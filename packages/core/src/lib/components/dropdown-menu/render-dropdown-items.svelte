<script lang="ts" module>
	import type {
		DropdownMenuItemData,
		DropdownMenuOption,
		DropdownMenuSection
	} from './dropdown-menu-types.js';
	import type { DropdownMenuItemProps } from './dropdown-menu-item.svelte';

	export interface RenderDropdownItemsProps {
		items: DropdownMenuOption[];
	}

	/**
	 * Keyed by `item.id` when the caller supplies one, else by position. NOT by
	 * label: an item that reports its own result (a copy row swapping to
	 * "Copied") would change key mid-interaction, remounting the row and dropping
	 * keyboard focus. Position is the safe default because a menu's rows are
	 * usually fixed; a menu whose items reorder or filter needs `id` for the same
	 * reason.
	 */
	function itemKey(item: DropdownMenuItemData, index: number): string {
		return `item-${item.id ?? index}`;
	}

	function sectionKey(section: DropdownMenuSection, index: number): string {
		return `section-${section.id ?? index}`;
	}

	/**
	 * One `{#each}` block covers all three option shapes, so the key has to as
	 * well; upstream's three `key=` expressions become this one discriminator.
	 */
	function optionKey(option: DropdownMenuOption, index: number): string {
		if ('type' in option) {
			return option.type === 'divider' ? `divider-${index}` : sectionKey(option, index);
		}
		return itemKey(option, index);
	}

	/**
	 * The props one leaf row forwards to `DropdownMenuItem`.
	 *
	 * `items` selects the submenu shape rather than being an item prop, and `id`
	 * is identity for the keyed `{#each}` rather than something `DropdownMenuItem`
	 * renders, so both are stripped. Every remaining field of
	 * `DropdownMenuItemData` is a `DropdownMenuItem` prop by construction (the
	 * type is `Pick`ed from `DropdownMenuItemProps`), so the data path forwards
	 * them wholesale and can't silently drop a field the data API advertises.
	 */
	function leafProps(item: DropdownMenuItemData): DropdownMenuItemProps {
		const { items: _submenuItems, id: _id, ...itemProps } = item;
		return itemProps;
	}
</script>

<script lang="ts">
	import DropdownMenuDivider from './dropdown-menu-divider.svelte';
	import DropdownMenuItem from './dropdown-menu-item.svelte';
	import DropdownMenuSubMenu from './dropdown-menu-sub-menu.svelte';
	// Self-import is how a Svelte 5 component recurses (`<svelte:self>` is gone).
	import RenderDropdownItems from './render-dropdown-items.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { sectionHeadingAttrs } from './render-dropdown-items.stylex.js';

	/**
	 * Data-mode renderer, ported from upstream's `renderDropdownItems`. Walks the
	 * `items` array and discriminates on `type`: `divider` → `DropdownMenuDivider`,
	 * `section` → a `role="group"` with an optional `aria-hidden` heading,
	 * otherwise a `DropdownMenuItem`.
	 *
	 * The divider goes through the **component** as of upstream 0.4.0, rather than
	 * this file styling a `Divider` itself. That is what makes `{type: 'divider'}`
	 * and `<DropdownMenuDivider />` produce identical DOM, spacing and theme
	 * target — through 0.3.0 the two paths each drew their own rule and could
	 * drift.
	 */
	const { items }: RenderDropdownItemsProps = $props();

	const heading = sectionHeadingAttrs();
	// A themeable slot so themes can target the heading directly instead of
	// relying on structural selectors. The divider's equivalent moved to the
	// component with the rest of it.
	const headingTheme = themeProps('dropdown-menu-section-heading');
</script>

{#each items as item, i (optionKey(item, i))}
	{#if 'type' in item && item.type === 'divider'}
		<DropdownMenuDivider />
	{:else if 'type' in item && item.type === 'section'}
		<div role="group" aria-label={item.title}>
			{#if item.title}
				<div
					aria-hidden="true"
					{...headingTheme}
					class={cx(headingTheme.class, heading.class)}
					style={heading.style}
				>
					{item.title}
				</div>
			{/if}
			{#each item.items as sub, j (itemKey(sub, j))}
				<DropdownMenuItem {...leafProps(sub)} />
			{/each}
		</div>
	{:else if item.items && item.items.length > 0}
		<!-- A plain item that declares nested `items` becomes a submenu (data-mode
		     parity with the compound DropdownMenuSubMenu API); otherwise it's a
		     leaf. This module owns the recursion and hands the rendered children to
		     DropdownMenuSubMenu — so DropdownMenuSubMenu never imports it back (no
		     import cycle). -->
		<DropdownMenuSubMenu icon={item.icon} label={item.label} isDisabled={item.isDisabled}>
			<RenderDropdownItems items={item.items} />
		</DropdownMenuSubMenu>
	{:else}
		<DropdownMenuItem {...leafProps(item)} />
	{/if}
{/each}
