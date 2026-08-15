<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';

	/**
	 * A type alias rather than an empty `interface … extends`, which eslint
	 * rejects as equivalent to its supertype. Upstream declares an interface
	 * because it adds a `ref` to the `Pick`; Svelte has no counterpart to
	 * forward, so the body here would be empty.
	 */
	export type DropdownMenuDividerProps = Pick<BaseProps, 'xstyle' | 'class' | 'style'>;
</script>

<script lang="ts">
	import Divider from '../divider/divider.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { dropdownMenuDividerStyle } from './dropdown-menu-divider.stylex.js';

	/**
	 * A horizontal rule separating groups of menu rows.
	 *
	 * Renders `role="separator"`, so it is never a stop in the menu's arrow-key
	 * order. Equivalent to `{type: 'divider'}` in the `items` data API — and
	 * literally the same component, because the data path renders this one.
	 * That is the point of it existing: through 0.3.0 the two modes drew their own
	 * rules and could drift in DOM, spacing and theme target.
	 *
	 * Aliased as `ContextMenuDivider` and `BreadcrumbMenuDivider`, which is what
	 * forced the data-mode option types to take the `Data` suffix their sibling
	 * `DropdownMenuItemData` already carried: TypeScript cannot re-export a value
	 * and a type under one name from a single barrel.
	 *
	 * @example
	 * ```svelte
	 * <DropdownMenu button={{ label: 'Actions' }}>
	 *   <DropdownMenuItem label="Edit" onclick={handleEdit} />
	 *   <DropdownMenuDivider />
	 *   <DropdownMenuItem label="Delete" variant="destructive" onclick={handleDelete} />
	 * </DropdownMenu>
	 * ```
	 */
	const { xstyle, class: className, style }: DropdownMenuDividerProps = $props();

	const theme = themeProps('dropdown-menu-divider');
</script>

<Divider xstyle={[dropdownMenuDividerStyle, xstyle]} class={cx(theme.class, className)} {style} />
