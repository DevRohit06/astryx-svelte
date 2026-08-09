<!--
	`BaseTableProps` is deliberately *not* re-exported from a `<script module>`
	here, unlike every other component's props type: it is declared in
	`table-types.ts` alongside the plugin render-props it references, and the
	barrel exports it from there. `TableProps` extends it, so a consumer never
	needs this file.
-->
<script lang="ts" generics="T extends Record<string, unknown>">
	import EmptyState from '../empty-state/empty-state.svelte';
	import Text from '../text/text.svelte';
	import TableBody from './table-body.svelte';
	import TableCell from './table-cell.svelte';
	import TableHeader from './table-header.svelte';
	import TableHeaderCell from './table-header-cell.svelte';
	import TableRow from './table-row.svelte';
	import { applyPlugins } from './apply-plugins.js';
	import { baseTableAttrs, baseTableSeedXstyle, headerLabelRowAttrs } from './base-table.stylex.js';
	import { defaultCellRenderer, generateColumns, resolveColumnWidths } from './column-utils.js';
	import { cx, mergeStyle, type StyleArg } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { devError } from '../../utils/dev-warning.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import type {
		BaseTableProps,
		BodyCellRenderProps,
		BodyRowRenderProps,
		HeaderCellRenderProps,
		HeaderRowRenderProps,
		TableColumn,
		TablePlugin,
		TableRenderProps
	} from './table-types.js';

	/**
	 * BaseTable — an unstyled, generic `<table>` component.
	 *
	 * Supports data-driven rendering (via `data` + `columns`) and children mode.
	 * Applies plugins as a transform pipeline over render props.
	 *
	 * ## What the port changes, and why
	 *
	 * - **No `MemoizedTableRow`.** Upstream memoises each row behind a
	 *   hand-written `areRowPropsEqual` so a data change re-renders one row
	 *   rather than the table. Svelte re-runs only the expressions whose
	 *   dependencies changed, so the keyed `{#each}` *is* that optimisation —
	 *   the `React.memo` counterpart `CodeBlock` also had no need for. Its
	 *   companion `areArraysShallowEqual`, which stabilises the resolved-columns
	 *   array reference for the same reason, goes with it.
	 * - **Header cells are data, not elements.** `renderInline`-style
	 *   node-returning helpers become records the template renders, which is what
	 *   lets the plugin pipeline stay a pure function.
	 * - **`transformTableContext` returns a component.** Svelte reads context at
	 *   component init, so a provider cannot be a function of already-rendered
	 *   children; the plugin hands back the component to wrap in and the chain is
	 *   rendered recursively. Order is upstream's — reverse iteration, so the
	 *   first plugin wraps outermost.
	 *
	 * @example
	 * ```svelte
	 * <BaseTable
	 *   data={[{ name: 'Alice', age: 30 }]}
	 *   columns={[
	 *     { key: 'name', header: 'Name' },
	 *     { key: 'age', header: 'Age', width: pixel(80) }
	 *   ]}
	 * />
	 * ```
	 */
	let {
		data,
		columns: columnsProp,
		idKey,
		plugins: pluginsProp,
		children,
		textOverflow = 'wrap',
		rowIndexStart,
		rowCount,
		scrollWrapper: ScrollWrapper,
		emptyState,
		xstyle,
		class: className,
		style: styleProp,
		// `data-testid` is deliberately **not** destructured, unlike every other
		// component in this port. It rides `rest`, as upstream lets it, because
		// the `<table>` takes *two* spreads: the plugin pipeline's `htmlProps`
		// and then `rest`. Pulling the key out and re-emitting it by name after
		// both would write `data-testid={undefined}` whenever the consumer set
		// none — silently deleting an attribute a plugin's `transformTable` had
		// just added. It was the only `htmlProps` key `BaseTable` named, so it
		// was the only one a plugin could not set.
		...rest
	}: BaseTableProps<T> = $props();

	const t = useTranslator();

	// Stable empty array when no plugins are provided.
	const plugins = $derived((pluginsProp ?? []) as TablePlugin<T>[]);

	// When the table opts into ARIA row indexing (by the consumer passing
	// `rowIndexStart` or `rowCount`), body rows carry `aria-rowindex` and the
	// `<table>` carries `aria-rowcount`. `aria-rowindex` is 1-based and counts
	// data rows from `rowIndexStart` (default 1); a windowed/paginated view
	// passes the offset of its first visible row. `aria-rowcount` is `rowCount`
	// when known, or `-1` (the ARIA convention for unknown) when it is not.
	const ariaRowIndexingEnabled = $derived(rowIndexStart != null || rowCount != null);
	const firstRowAriaIndex = $derived(rowIndexStart ?? 1);
	const ariaRowCount = $derived(ariaRowIndexingEnabled ? (rowCount ?? -1) : undefined);

	// Resolve columns: explicit > auto-generated from data.
	const baseColumns = $derived<TableColumn<T>[]>(
		columnsProp ?? (data ? generateColumns(data) : [])
	);

	// --- Plugin pipeline: transformColumns ---
	// Runs before any element-level transforms. Allows plugins to filter,
	// reorder, or inject synthetic columns (e.g. selection checkbox).
	const resolvedColumns = $derived(applyPlugins(plugins, (p) => p.transformColumns, baseColumns));

	// Resolve all column widths in a single pass — produces per-column
	// inline styles and the aggregate table min-width.
	const resolvedWidths = $derived(resolveColumnWidths(resolvedColumns));

	// --- Plugin pipeline: table ---
	const tableRenderProps = $derived(
		applyPlugins(plugins, (p) => p.transformTable, {
			htmlProps: {},
			xstyle: baseTableSeedXstyle(children != null)
		} satisfies TableRenderProps)
	);

	// --- Plugin pipeline: header cells ---
	const headerCells = $derived(
		resolvedColumns.map((col, columnIndex) => {
			const headerContent = col.header ?? col.key;

			// Build initial htmlProps with column alignment if specified.
			// `scope: 'col'` is the default so every column header associates its
			// data cells with the correct column for screen readers; a plugin's
			// transformHeaderCell can override it via htmlProps.scope.
			const initialHeaderHtmlProps: Record<string, unknown> = {
				'data-column-key': col.key,
				scope: 'col'
			};
			if (col.align) {
				initialHeaderHtmlProps.style = `text-align:${col.align}`;
			}

			const initialHeaderRenderProps = {
				htmlProps: initialHeaderHtmlProps,
				xstyle: [],
				content: headerContent,
				columnIndex,
				columns: resolvedColumns as ReadonlyArray<TableColumn<Record<string, unknown>>>
			} as HeaderCellRenderProps;

			const cellRenderProps = applyPlugins(
				plugins,
				(p) => p.transformHeaderCell,
				initialHeaderRenderProps,
				col,
				columnIndex,
				resolvedColumns
			);

			// Apply pre-computed column width styles on the <th>.
			// With table-layout: fixed, header cell sizing controls column widths.
			const width = resolvedWidths.columns.get(col.key)?.style ?? {};
			const widthStyle = [
				width.width != null ? `width:${width.width}` : null,
				width.minWidth != null ? `min-width:${width.minWidth}` : null
			]
				.filter(Boolean)
				.join(';');

			// A plugin's own `style` wins over the computed width, as upstream's
			// `{...widthStyle, ...existingStyle}` spread order does — with inline
			// strings, that is the later declaration.
			const existingStyle = cellRenderProps.htmlProps.style as string | undefined;
			const mergedHtmlProps = {
				...cellRenderProps.htmlProps,
				style: mergeStyle(widthStyle, existingStyle)
			};

			// Resolve header content from slots — plugins write to named slots
			// to avoid conflicts (e.g. sort writes `after`, resize writes `overlay`)
			const resolvedContent = cellRenderProps.content ?? headerContent;
			const headerTitle =
				typeof resolvedContent === 'string' && resolvedContent.length > 0
					? resolvedContent
					: undefined;
			const { before, after, overlay, below } = cellRenderProps;
			const hasSlots = before != null || after != null || overlay != null || below != null;

			return {
				key: col.key,
				htmlProps: mergedHtmlProps,
				title: headerTitle,
				contextMenuActions: cellRenderProps.contextMenuActions,
				xstyle: cellRenderProps.xstyle as StyleArg[],
				content: resolvedContent,
				before,
				after,
				overlay,
				below,
				hasSlots
			};
		})
	);

	// --- Render ---
	const hasData = $derived(data != null && data.length > 0);
	const hasColumns = $derived(resolvedColumns.length > 0);

	// Style precedence: consumer style < the computed column min-width
	// (structural — derived from column defs, so it
	// must win when present; when absent, a consumer minWidth survives).
	const tableStyle = $derived(
		mergeStyle(
			tableRenderProps.htmlProps.style as string | undefined,
			styleProp as string | undefined,
			resolvedWidths.tableMinWidth > 0 ? `min-width:${resolvedWidths.tableMinWidth}px` : null
		)
	);

	const theme = themeProps('base-table');
	const attrs = $derived(baseTableAttrs(tableRenderProps.xstyle, xstyle));
	const labelRow = headerLabelRowAttrs();

	// Iterated in reverse so the first plugin in the array wraps outermost,
	// matching the mental model: plugins are listed in priority order, and the
	// first plugin's context provider encompasses all others.
	const contextProviders = $derived.by(() => {
		const out = [];
		for (let i = plugins.length - 1; i >= 0; i--) {
			const plugin = plugins[i];
			if (plugin.transformTableContext) {
				try {
					out.unshift(plugin.transformTableContext());
				} catch (error) {
					devError('Table', 'Plugin threw in transformTableContext:', error);
				}
			}
		}
		return out;
	});

	function rowKeyFor(item: T, rowIndex: number): string | number {
		if (idKey == null) {
			return rowIndex;
		}
		return typeof idKey === 'function' ? idKey(item) : String(item[idKey]);
	}

	function bodyCellsFor(item: T): {
		key: string;
		htmlProps: Record<string, unknown>;
		xstyle: StyleArg[];
		contextMenuActions: BodyCellRenderProps['contextMenuActions'];
		column: TableColumn<T>;
		text: string | null;
		isTruncatedText: boolean;
	}[] {
		return resolvedColumns.map((col, columnIndex) => {
			// Apply column alignment to body cells
			const initialCellHtmlProps: Record<string, unknown> = {};
			if (col.align) {
				initialCellHtmlProps.style = `text-align:${col.align}`;
			}

			const initialBodyCellRenderProps = {
				htmlProps: initialCellHtmlProps,
				xstyle: [],
				columnIndex,
				columns: resolvedColumns as ReadonlyArray<TableColumn<Record<string, unknown>>>
			} as BodyCellRenderProps;

			const cellRenderProps = applyPlugins(
				plugins,
				(p) => p.transformBodyCell,
				initialBodyCellRenderProps,
				col,
				item,
				columnIndex,
				resolvedColumns
			);

			const isDefaultRenderer = !col.renderCell;
			const rawContent = isDefaultRenderer ? defaultCellRenderer(item, col.key) : null;

			// In truncate mode, wrap default-rendered string content in
			// <Text maxLines={1}> for smart tooltips that only appear
			// when text is actually overflowing. In wrap mode (default),
			// content renders as-is — the cell's CSS handles wrapping.
			const isTruncatedText =
				isDefaultRenderer &&
				textOverflow === 'truncate' &&
				rawContent != null &&
				rawContent.length > 0;

			return {
				key: col.key,
				htmlProps: cellRenderProps.htmlProps as Record<string, unknown>,
				xstyle: cellRenderProps.xstyle as StyleArg[],
				contextMenuActions: cellRenderProps.contextMenuActions,
				column: col,
				text: rawContent,
				isTruncatedText
			};
		});
	}
</script>

{#snippet headerCellsFragment()}
	{#each headerCells as cell (cell.key)}
		<!--
			`title` is spread conditionally, not written by name. Upstream builds a
			`headerTitleProp` that is `{}` unless the resolved content is a non-empty
			string, precisely so a `title` a plugin set through `htmlProps` survives.
			Writing `title={cell.title}` unconditionally would send `undefined` and
			delete it — the same shape as the `data-testid` clobber this component
			already had, and worth fixing while the pipeline is fresh rather than
			rediscovering it when the plugin hooks land.
		-->
		<TableHeaderCell
			{...cell.htmlProps}
			{...cell.title != null ? { title: cell.title } : {}}
			contextMenuActions={cell.contextMenuActions}
			xstyle={cell.xstyle}
		>
			{#if cell.hasSlots}
				{#if cell.before}{@render cell.before()}{/if}
				{#if cell.after}
					<div class={labelRow.class} style={labelRow.style}>
						{#if typeof cell.content === 'function'}{@render cell.content()}{:else}{cell.content}{/if}
						{@render cell.after()}
					</div>
				{:else if typeof cell.content === 'function'}
					{@render cell.content()}
				{:else}
					{cell.content}
				{/if}
				{#if cell.overlay}{@render cell.overlay()}{/if}
				{#if cell.below}{@render cell.below()}{/if}
			{:else if typeof cell.content === 'function'}
				{@render cell.content()}
			{:else}
				{cell.content}
			{/if}
		</TableHeaderCell>
	{/each}
{/snippet}

{#snippet bodyRowFragment(item: T, rowIndex: number)}
	{@const cells = bodyCellsFor(item)}
	{#snippet cellsFragment()}
		{#each cells as cell (cell.key)}
			<TableCell
				{...cell.htmlProps}
				contextMenuActions={cell.contextMenuActions}
				xstyle={cell.xstyle}
			>
				{#if cell.column.renderCell}
					{@render cell.column.renderCell(item)}
				{:else if cell.isTruncatedText}
					<Text type="body" maxLines={1}>{cell.text}</Text>
				{:else}
					{cell.text}
				{/if}
			</TableCell>
		{/each}
	{/snippet}
	<!--
		`aria-rowindex` is seeded as a base `htmlProp` so plugins compose over it
		and can still override, as upstream's is.
	-->
	{@const rowProps = applyPlugins(
		plugins,
		(p) => p.transformBodyRow,
		{
			htmlProps: ariaRowIndexingEnabled ? { 'aria-rowindex': firstRowAriaIndex + rowIndex } : {},
			xstyle: [],
			children: cellsFragment
		} satisfies BodyRowRenderProps,
		item,
		rowIndex
	)}
	<TableRow {...rowProps.htmlProps} xstyle={rowProps.xstyle as StyleArg[]}>
		{@render rowProps.children()}
	</TableRow>
{/snippet}

{#snippet tableElement()}
	<table
		aria-rowcount={ariaRowCount}
		{...tableRenderProps.htmlProps}
		{...rest}
		{...theme}
		class={cx(
			theme.class,
			attrs.class,
			tableRenderProps.htmlProps.class as string | undefined,
			className
		)}
		style={mergeStyle(attrs.style, tableStyle)}
	>
		{#if children}
			{@render children()}
		{:else}
			{#if hasColumns}
				<TableHeader>
					{@const headerRowProps = applyPlugins(plugins, (p) => p.transformHeaderRow, {
						htmlProps: {},
						xstyle: [],
						children: headerCellsFragment
					} satisfies HeaderRowRenderProps)}
					<TableRow
						{...headerRowProps.htmlProps}
						isHeaderRow
						xstyle={headerRowProps.xstyle as StyleArg[]}
					>
						{@render headerRowProps.children()}
					</TableRow>
				</TableHeader>
			{/if}
			<TableBody>
				{#if hasData}
					{#each data ?? [] as item, rowIndex (rowKeyFor(item, rowIndex))}
						{@render bodyRowFragment(item, rowIndex)}
					{/each}
				{:else if data != null && emptyState !== false}
					<tr>
						<td colspan={resolvedColumns.length}>
							{#if emptyState}
								{@render emptyState()}
							{:else}
								<EmptyState title={t('@astryx.table.noData')} isCompact />
							{/if}
						</td>
					</tr>
				{/if}
			</TableBody>
		{/if}
	</table>
{/snippet}

{#snippet wrappedTable()}
	{#if ScrollWrapper}
		{@const scrollWrapperRenderProps = applyPlugins(plugins, (p) => p.transformScrollWrapper, {
			htmlProps: {},
			xstyle: []
		})}
		<ScrollWrapper
			htmlProps={scrollWrapperRenderProps.htmlProps}
			xstyle={scrollWrapperRenderProps.xstyle}
			beforeTable={scrollWrapperRenderProps.beforeTable}
			afterTable={scrollWrapperRenderProps.afterTable}
			children={tableElement}
		/>
	{:else}
		{@render tableElement()}
	{/if}
{/snippet}

{#snippet withContextProviders(index: number)}
	{#if index < contextProviders.length}
		{@const Provider = contextProviders[index]}
		<Provider>
			{@render withContextProviders(index + 1)}
		</Provider>
	{:else}
		{@render wrappedTable()}
	{/if}
{/snippet}

{@render withContextProviders(0)}
