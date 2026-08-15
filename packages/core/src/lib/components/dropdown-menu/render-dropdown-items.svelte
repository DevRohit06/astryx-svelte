<script lang="ts" module>
	import type { DropdownMenuOption } from './dropdown-menu-types.js';

	export interface RenderDropdownItemsProps {
		items: DropdownMenuOption[];
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

{#each items as item, i (i)}
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
			{#each item.items as sub (sub.label)}
				<DropdownMenuItem
					icon={sub.icon}
					label={sub.label}
					onClick={sub.onClick}
					isDisabled={sub.isDisabled}
				/>
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
		<DropdownMenuItem
			icon={item.icon}
			label={item.label}
			onClick={item.onClick}
			isDisabled={item.isDisabled}
		/>
	{/if}
{/each}
