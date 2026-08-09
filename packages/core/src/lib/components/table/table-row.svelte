<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';

	/** Props for TableRow — thin `<tr>` wrapper */
	export interface TableRowProps extends BaseProps<HTMLTableRowElement> {
		children: Snippet;
		/**
		 * StyleX styles for layout customization (margins, positioning, sizing).
		 * Must be a `stylex.create()` value — not an inline style object.
		 */
		xstyle?: StyleArg[];
		/**
		 * Whether this row is the header row. Header rows skip the striped/hover
		 * row styling (which is only meant for body rows).
		 */
		isHeaderRow?: boolean;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTableContext } from './table-context.svelte.js';
	import { tableRowAttrs } from './table-row.stylex.js';

	/**
	 * TableRow — a `<tr>` wrapper for children/streaming mode.
	 *
	 * When used inside `<Table>`, inherits styling from the table context
	 * (striped, hover, divider overrides). When used standalone, renders a plain
	 * `<tr>` — the context is optional on both sides.
	 *
	 * @example
	 * ```svelte
	 * <Table>
	 *   <TableRow>
	 *     <TableCell>Alice</TableCell>
	 *     <TableCell>30</TableCell>
	 *   </TableRow>
	 * </Table>
	 * ```
	 */
	let {
		children,
		xstyle,
		isHeaderRow = false,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: TableRowProps = $props();

	const tableContext = useTableContext();

	const theme = themeProps('table-row');
	const attrs = $derived(tableRowAttrs(tableContext?.() ?? null, isHeaderRow, xstyle));
</script>

<tr
	{...rest}
	data-testid={testId}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</tr>
