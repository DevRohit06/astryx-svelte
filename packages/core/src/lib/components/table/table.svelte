<script lang="ts" module>
	import type { BaseTableProps, TablePlugin, TableVerticalAlign } from './table-types.js';

	/** Row density controlling padding and font size */
	export type TableDensity = 'compact' | 'balanced' | 'spacious';

	/** Divider style between cells */
	export type TableDividers = 'rows' | 'columns' | 'grid' | 'none';

	/** How body cell text behaves when it exceeds column width */
	export type TableTextOverflow = 'wrap' | 'truncate';

	/**
	 * Props for the styled Table component.
	 * Supports both data-driven mode and children mode with TableRow/TableCell.
	 *
	 * @template T - The row data type
	 */
	export interface TableProps<T extends Record<string, unknown>> extends Omit<
		BaseTableProps<T>,
		'plugins'
	> {
		/** Row density. @default 'balanced' */
		density?: TableDensity;
		/** Divider style. @default 'rows' */
		dividers?: TableDividers;
		/** Striped even rows. @default false */
		isStriped?: boolean;
		/** Hover highlight on rows. @default false */
		hasHover?: boolean;
		/**
		 * Vertical alignment for body row cells.
		 * Controls `vertical-align` on `<td>` elements.
		 *
		 * @default 'middle'
		 *
		 * @example
		 * ```svelte
		 * <Table data={items} {columns} verticalAlign="top" />
		 * ```
		 */
		verticalAlign?: TableVerticalAlign;
		/**
		 * How body cell text behaves when it exceeds the column width.
		 *
		 * - `'wrap'` — text wraps and the row grows taller. No content is hidden.
		 * - `'truncate'` — text is clipped with an ellipsis. Default-rendered cells
		 *   show a tooltip on hover when truncated.
		 *
		 * Header cells always truncate regardless of this setting.
		 *
		 * @default 'wrap'
		 *
		 * @example
		 * ```svelte
		 * <Table data={logs} {columns} textOverflow="wrap" />
		 * ```
		 */
		textOverflow?: TableTextOverflow;
		/** Named plugins to extend table behavior */
		plugins?: Record<string, TablePlugin<T>>;
	}
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
	import BaseTable from './base-table.svelte';
	import TableScrollWrapper from './table-scroll-wrapper.svelte';
	import { setTableContext } from './table-context.svelte.js';
	import { tableBaseStyle } from './table-scroll-wrapper.stylex.js';
	import { useBaseTablePlugins } from './use-base-table-plugins.svelte.js';
	import type { TableRenderProps } from './table-types.js';

	/**
	 * Table — a styled, data-driven table component.
	 *
	 * Wraps BaseTable with styled components (TableRow, TableCell,
	 * TableHeaderCell) that read appearance configuration from TableContext.
	 * Density, dividers, striped rows, and hover effects are applied via
	 * design tokens in the component styles.
	 *
	 * `TableProps` omits only `plugins` from `BaseTableProps`, which reads
	 * narrower than upstream's `Omit<…, 'plugins' | 'components'>` and is the
	 * same type: `BaseTableProps` declares no `components` member on either
	 * side, so that half of upstream's omit removes nothing. `scrollWrapper`
	 * stays public and still overrides `Table`'s own, because `{...rest}` is
	 * spread last exactly as upstream spreads it.
	 *
	 * @compositionHint Use renderCell on columns to compose rich cell content.
	 * Combine with Badge (status labels), StatusDot (colored indicators),
	 * Text (formatted values), Avatar (user cells), and HStack/VStack
	 * (multi-element cell layouts). Without renderCell, cells render as plain
	 * text. Always set explicit width on columns using proportional() or pixel()
	 * — omitting width skips the minimum width floor, which can cause columns to
	 * collapse on mobile.
	 *
	 * @example
	 * ```svelte
	 * <Table
	 *   data={users}
	 *   columns={[
	 *     { key: 'name', header: 'Name', width: proportional(1), renderCell: nameCell },
	 *     { key: 'status', header: 'Status', width: proportional(1), renderCell: statusCell }
	 *   ]}
	 *   density="compact"
	 *   dividers="grid"
	 *   hasHover
	 * />
	 * ```
	 */
	let {
		density = 'balanced',
		dividers = 'rows',
		isStriped = false,
		hasHover = false,
		verticalAlign = 'middle',
		textOverflow = 'wrap',
		plugins: userPlugins,
		columns,
		data,
		...rest
	}: TableProps<T> = $props();

	// Table-level styling plugin (just adds font/color to <table>).
	//
	// The `astryx-table` class itself comes from `BaseTable`, which renders the
	// `<table>` element and now names it `table` (with `base-table` as its legacy
	// name). Adding it here too would put the token on twice.
	const tablePlugin: TablePlugin<T> = {
		transformTable(props: TableRenderProps): TableRenderProps {
			return {
				...props,
				xstyle: [...props.xstyle, tableBaseStyle]
			};
		}
	};

	const mergedPlugins = useBaseTablePlugins<T>(
		() => [tablePlugin],
		() => userPlugins
	);

	setTableContext(() => ({
		density,
		dividers,
		isStriped,
		hasHover,
		verticalAlign,
		textOverflow
	}));
</script>

<BaseTable
	{data}
	{columns}
	plugins={mergedPlugins.current}
	{textOverflow}
	scrollWrapper={TableScrollWrapper}
	{...rest}
/>
