<script lang="ts" module>
	import type { DropdownMenuOption } from './dropdown-menu-types.js';

	export interface RenderDropdownItemsProps {
		items: DropdownMenuOption[];
	}
</script>

<script lang="ts">
	import Divider from '../divider/divider.svelte';
	import DropdownMenuItem from './dropdown-menu-item.svelte';
	import DropdownMenuSubMenu from './dropdown-menu-sub-menu.svelte';
	// Self-import is how a Svelte 5 component recurses (`<svelte:self>` is gone).
	import RenderDropdownItems from './render-dropdown-items.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { sectionHeadingAttrs, dividerXstyle } from './render-dropdown-items.stylex.js';

	/**
	 * Data-mode renderer, ported from upstream's `renderDropdownItems`. Walks the
	 * `items` array and discriminates on `type`: `divider` → `Divider`, `section`
	 * → a `role="group"` with an optional `aria-hidden` heading, otherwise a
	 * `DropdownMenuItem`. Data mode carries only `icon`/`label`/`onClick`/`isDisabled`.
	 */
	const { items }: RenderDropdownItemsProps = $props();

	const heading = sectionHeadingAttrs();
	// Themeable slots so themes can target the heading and the divider directly
	// instead of relying on structural selectors. The `Divider` keeps its own
	// `astryx-divider` class alongside this one, so global divider theming
	// still applies.
	const headingTheme = themeProps('dropdown-menu-section-heading');
	const dividerTheme = themeProps('dropdown-menu-divider');
</script>

{#each items as item, i (i)}
	{#if 'type' in item && item.type === 'divider'}
		<Divider xstyle={dividerXstyle} {...dividerTheme} />
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
