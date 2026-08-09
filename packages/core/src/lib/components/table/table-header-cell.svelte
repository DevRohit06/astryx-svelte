<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLThAttributes } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';
	import type { TableContextActions } from './table-types.js';

	/**
	 * Props for TableHeaderCell — `<th>` wrapper with context-aware styling.
	 *
	 * Upstream re-declares `scope` because its `BaseProps` extends React's
	 * generic `HTMLAttributes`, which has no `<th>` members; the same is true of
	 * Svelte's, so the cell-specific attributes are `Pick`ed from
	 * `HTMLThAttributes` rather than re-typed. That keeps Svelte's own
	 * `| null` (its remove-the-attribute value) instead of narrowing it, which a
	 * hand-written declaration would silently do.
	 *
	 * `title` is `Pick`ed for a second reason: `BaseProps` omits it for every
	 * component, and `BaseTable` sets it to the header's own text so a truncated
	 * column still exposes its full label on hover. Upstream reaches it through
	 * `TableHeaderCellComponentProps` instead, which extends `ThHTMLAttributes`.
	 *
	 * The Pick is exactly `scope` + `title` and no wider. `colspan`/`rowspan`/
	 * `abbr` are **not** here even though a `<th>` accepts them, because
	 * upstream's `TableHeaderCellProps` does not declare them and inventing
	 * public props is a defect. A plugin can still set them: they ride the
	 * `htmlProps` bag `BaseTable` spreads, which is typed `HTMLThAttributes` —
	 * the same route upstream's `TableHeaderCellComponentProps` gives them.
	 * Contrast `TableCellProps`, which Picks four members because upstream's
	 * `TableCellProps` re-declares exactly those four by hand.
	 */
	export interface TableHeaderCellProps
		extends BaseProps<HTMLTableCellElement>, Pick<HTMLThAttributes, 'scope' | 'title'> {
		children?: Snippet;
		/**
		 * StyleX styles for layout customization (margins, positioning, sizing).
		 * Must be a `stylex.create()` value — not an inline style object.
		 */
		xstyle?: StyleArg | StyleArg[];
		/**
		 * Right-click actions rendered as a context menu around the header content.
		 * The cell owns the wrapper so it controls how the menu interacts with its
		 * padding / content. Empty or undefined renders no menu.
		 */
		contextMenuActions?: TableContextActions;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import TableContextMenu from './table-context-menu.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTableContext } from './table-context.svelte.js';
	import { tableHeaderCellAttrs } from './table-header-cell.stylex.js';

	/**
	 * TableHeaderCell — a `<th>` wrapper for header cells.
	 *
	 * When used inside `<Table>`, inherits styling from the table context
	 * (density padding, header font weight/color, divider borders).
	 * When used standalone, renders a plain `<th>`.
	 *
	 * Accepts `xstyle` for plugin-provided styles that merge on top.
	 *
	 * @example
	 * ```svelte
	 * <TableHeader>
	 *   <TableRow>
	 *     <TableHeaderCell>Name</TableHeaderCell>
	 *     <TableHeaderCell>Age</TableHeaderCell>
	 *   </TableRow>
	 * </TableHeader>
	 * ```
	 */
	let {
		children,
		xstyle,
		class: className,
		style: styleProp,
		contextMenuActions,
		'data-testid': testId,
		...rest
	}: TableHeaderCellProps = $props();

	const tableContext = useTableContext();
	const ctx = $derived(tableContext?.() ?? null);

	// Same theme hook as TableCell: `data-density` on the stable
	// `astryx-table-header-cell` target. Upstream:
	// `themeProps('table-header-cell', {density: ctx?.density})`.
	const theme = $derived(themeProps('table-header-cell', { density: ctx?.density }));
	const attrs = $derived(tableHeaderCellAttrs(ctx, xstyle));
</script>

{#snippet headerContent()}
	{#if children}{@render children()}{/if}
{/snippet}

<th
	{...rest}
	data-testid={testId}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	<TableContextMenu actions={contextMenuActions} children={headerContent} />
</th>
