<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLTdAttributes } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';
	import type { TableContextActions } from './table-types.js';

	/**
	 * Props for TableCell — thin `<td>` wrapper.
	 *
	 * Upstream re-declares `scope` / `headers` / `colSpan` / `rowSpan` because
	 * its `BaseProps` extends React's generic `HTMLAttributes`, which has no
	 * `<td>` members. The same is true of Svelte's, so the four are `Pick`ed
	 * from `HTMLTdAttributes` — which keeps Svelte's own attribute names
	 * (`colspan`, not `colSpan`) and its `| null` remove-the-attribute value,
	 * both of which a hand-written declaration would get wrong.
	 */
	export interface TableCellProps
		extends
			BaseProps<HTMLTableCellElement>,
			Pick<HTMLTdAttributes, 'scope' | 'headers' | 'colspan' | 'rowspan'> {
		children?: Snippet;
		/**
		 * StyleX styles for layout customization (margins, positioning, sizing).
		 * Must be a `stylex.create()` value — not an inline style object.
		 */
		xstyle?: StyleArg | StyleArg[];
		/**
		 * Right-click actions rendered as a context menu around the cell content.
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
	import { tableCellAttrs, tableCellTriggerXstyle } from './table-cell.stylex.js';

	/**
	 * TableCell — a `<td>` wrapper for children/streaming mode.
	 *
	 * When used inside `<Table>`, inherits styling from the table context
	 * (density padding, divider borders). When used standalone, renders a plain
	 * `<td>`.
	 *
	 * @example
	 * ```svelte
	 * <TableRow>
	 *   <TableCell>Alice</TableCell>
	 *   <TableCell>30</TableCell>
	 * </TableRow>
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
	}: TableCellProps = $props();

	const tableContext = useTableContext();
	const ctx = $derived(tableContext?.() ?? null);

	const hasContextMenu = $derived(
		typeof contextMenuActions === 'function' ||
			(Array.isArray(contextMenuActions) && contextMenuActions.length > 0)
	);

	// `density` is reflected as `data-density` (and a variant class token) so a
	// theme can override cell padding per density through `defineTheme` — the
	// density padding itself lives in internal StyleX classes and is otherwise
	// unreachable. Upstream: `themeProps('table-cell', {density: ctx?.density})`.
	// Derived, not computed once: the table's `density` prop is reactive here
	// where upstream re-renders the cell.
	const theme = $derived(themeProps('table-cell', { density: ctx?.density }));
	const attrs = $derived(tableCellAttrs(ctx, hasContextMenu, xstyle));
	const triggerXstyle = $derived(tableCellTriggerXstyle(ctx, hasContextMenu));
</script>

{#snippet cellContent()}
	{#if children}{@render children()}{/if}
{/snippet}

<td
	{...rest}
	data-testid={testId}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	<TableContextMenu actions={contextMenuActions} {triggerXstyle} children={cellContent} />
</td>
