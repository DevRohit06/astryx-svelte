import type { Snippet } from 'svelte';
import { createCellSlotBinder, createSlotBinder } from '../../../../internal/bind-snippet.js';
import { withProps } from '../../../../internal/with-props.js';
import type {
	BodyRowRenderProps,
	HeaderCellRenderProps,
	TableColumn,
	TablePlugin
} from '../../table-types.js';
import { treeClickableRowStyle } from './tree.stylex.js';
import TreeScope from './tree-scope.svelte';
import { treeCell, treeHeader, type TreeCellArg, type TreeHeaderArg } from './tree-slots.svelte';

/**
 * Ported from Astryx's `Table/plugins/tree/useTableTreeData.tsx`.
 *
 * Upstream's architecture note describes four mechanisms. The tree affordance
 * itself — decorating the tree column's cells in place, with no synthetic
 * column, so every other column gets zero extra DOM, and a full pass-through
 * when `hasExpandableRows` is false — is upstream's design and is kept exactly.
 * The other three are React scheduling and have no counterpart:
 *
 * - **The external store.** `TreeStore` + `useSyncExternalStore` exist so a
 *   toggle re-renders one row's cells rather than the whole body, and the
 *   snapshot is an *integer* (`encodeRowMeta`, `INDENT_INDEX`,
 *   `useRowMetaSnapshot`) purely because an object snapshot would tear. Svelte
 *   is already fine-grained; the store collapses into the config getter it was
 *   wrapping, and the encoding has nothing left to encode. See
 *   `tree-context.svelte.ts`.
 * - **The imperative row ARIA.** Upstream applies `aria-level` / `aria-expanded`
 *   from a `ref` callback that subscribes to the store, because re-rendering
 *   every `<tr>` to re-label one is the thing it is avoiding — and then has to
 *   merge its ref with a prior plugin's through `mergeRefs`. Here
 *   `transformBodyRow` runs inside a `{@const}` in `BaseTable` — a derived — so
 *   writing the attributes into `htmlProps` re-labels exactly the row whose meta
 *   changed. That is the shape `plugins/selection` settled on for the same
 *   upstream code (upstream's own comment calls this "exactly like selection's
 *   row styling"), and it needs no attachment because nothing here wants the DOM
 *   node. `applyRowTreeAria`'s `removeAttribute` branch goes with it: an
 *   attribute absent from the spread is removed by the spread, so flat data
 *   still drops tree ARIA.
 * - **The wrapped-column cache.** `columnsCacheRef` / `getCachedColumns` keep the
 *   wrapped column objects referentially stable, "or the per-row memo breaks and
 *   a toggle re-renders the whole body". Nothing here keys off column identity:
 *   `BaseTable` keys its cells by `column.key`, and `resolvedColumns` is a
 *   `$derived` that re-runs only when a value `transformColumns` actually read
 *   changes. That is why `useTableTreeState`'s `treeConfig` exposes
 *   `hasExpandableRows` as a getter and `getRowMeta` as a stable function: this
 *   transform reads the former and never the latter, so expanding a row does not
 *   invalidate the columns at all.
 *
 * Three further translations:
 *
 * - **`config` is a getter**, as every published hook in this port takes. That is
 *   what upstream's `useRef(config)` + `useMemo(..., [store])` pair buys —
 *   a stable plugin identity that still reads fresh config — so both are deleted.
 *   The stability is load-bearing rather than tidy: `transformTableContext` must
 *   return a **stable component reference** or the table remounts on every
 *   toggle, which is why `provider` is bound once, outside the transform.
 * - **`transformTableContext(children)` → `transformTableContext()`.** Svelte
 *   reads context at component init, so the plugin returns the provider
 *   *component* instead of wrapping already-rendered children.
 * - **The wrapped `renderCell` is a keyed bound cell snippet.** It needs both
 *   per-column data (the column's key and its own renderer) and the caller's
 *   per-row `item`, so it goes through `createCellSlotBinder` keyed by
 *   `column.key`, which keeps the row parameter open and folds the row into the
 *   single object argument. The keying is load-bearing: `{@render}` branches on
 *   the bound snippet's function identity, so an unkeyed binding would rebuild
 *   every tree cell whenever `transformColumns` re-ran, replacing the expander a
 *   keyboard user just pressed rather than updating it. This plugin briefly
 *   carried its own `wrapTreeRenderCell`, which forwarded the row as a *second*
 *   native snippet parameter; the shared binder supersedes it, and
 *   `tree-slots.svelte` states the resulting one-parameter contract.
 *
 * No runes are used, so this is a plain `.ts` module: the plugin object holds
 * closures over the config getter, which is already both stable and live.
 */

// =============================================================================
// Types
// =============================================================================

/** Structural position of one visible row within the tree. */
export interface TableTreeRowMeta {
	/** The row's id (from `idKey`). */
	id: string;
	/** 0-based depth: roots are level 0. */
	level: number;
	/** Whether the row shows an expander. */
	hasChildren: boolean;
	/** Whether the row is currently expanded. */
	isExpanded: boolean;
}

/**
 * Configuration for useTableTreeData. `useTableTreeState` returns a
 * ready-made value (`treeConfig`); consumers with server-driven or
 * pre-flattened trees can construct one directly.
 */
export interface UseTableTreeDataConfig<T extends Record<string, unknown>> {
	/** Structural meta for a visible row; undefined for unknown rows. */
	getRowMeta: (item: T) => TableTreeRowMeta | undefined;
	/** Toggle a row's expansion. */
	onToggleItem: (item: T) => void;
	/**
	 * Whether any row in the dataset is expandable. When false the plugin is
	 * a no-op: no expanders, no indent, no tree ARIA — flat data renders
	 * identically to a Table without the plugin.
	 */
	hasExpandableRows: boolean;
	/**
	 * Aggregate expansion state across every expandable row. When provided
	 * together with `onExpandAll`/`onCollapseAll`, the tree column header shows
	 * an expand-all toggle. `useTableTreeState` supplies all three.
	 */
	isAllExpanded?: boolean | 'indeterminate';
	/** Expand every expandable row. Wired to the header expand-all control. */
	onExpandAll?: () => void;
	/** Collapse every row. Wired to the header expand-all control. */
	onCollapseAll?: () => void;
	/**
	 * Show the expand-all/collapse-all toggle in the tree column header. Needs
	 * `isAllExpanded` and `onExpandAll`/`onCollapseAll` to be present.
	 * @default false
	 */
	hasExpandAllControl?: boolean;
	/**
	 * Indent step per level, as spacing tokens.
	 * @default 'md'
	 */
	indent?: 'sm' | 'md' | 'lg';
	/** Column that carries the indent + expander. @default the first column */
	treeColumnKey?: string;
	/**
	 * When true, clicking anywhere on an expandable row toggles its expansion,
	 * in addition to the chevron. Leaf rows stay inert. No-op on flat data.
	 *
	 * This is a pointer-only convenience layered over the chevron: keyboard and
	 * assistive-tech users toggle via the chevron button (which stays the
	 * accessible control). Clicks originating from interactive cell content
	 * (buttons, links, form controls) or a text selection do not toggle.
	 * @default false (only the chevron toggles expansion).
	 */
	hasRowClickExpansion?: boolean;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Returns a {@link TablePlugin} that renders nested rows: per-level indentation
 * and an expand/collapse chevron on the tree column, and `aria-level` /
 * `aria-expanded` on the body rows.
 *
 * Composable with the other table plugins — the canonical order places `tree`
 * before `selection`, so the checkbox column lands left of the indented tree
 * column. When no row is expandable, every transform is a pass-through.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const tree = useTableTreeState(() => ({
 *     data: files, idKey: 'id', defaultExpandedIds: ['src']
 *   }));
 *   const treePlugin = useTableTreeData(() => tree.treeConfig);
 * </script>
 * <Table data={tree.visibleData} {columns} idKey="id" plugins={{ tree: treePlugin }} />
 * ```
 */
export function useTableTreeData<T extends Record<string, unknown>>(
	config: () => UseTableTreeDataConfig<T>
): TablePlugin<T> {
	// Bound once, not per `transformTableContext()` call: a provider whose
	// component *reference* changes tears down and rebuilds the table's whole
	// subtree, losing scroll position, focus and child state on every toggle.
	const provider = withProps(TreeScope, {
		config: config as () => UseTableTreeDataConfig<Record<string, unknown>>
	});

	// Bound once per hook call, keyed by column: the expander must keep its
	// element identity across a toggle, or clicking it by keyboard destroys the
	// very button that has focus. See `createCellSlotBinder`'s note.
	const bindTreeCell = createCellSlotBinder<T, TreeCellArg>(treeCell);
	const bindTreeHeader = createSlotBinder<TreeHeaderArg>(treeHeader);

	// Upstream's `treeKeyRef`: `transformHeaderCell` has to know which column
	// `transformColumns` resolved as the tree column, and the pipeline runs the
	// two in that order. A plain `let` is exactly a ref — it must not be `$state`,
	// or writing it during a transform would invalidate the derived that ran it.
	let treeKeyResolved: string | undefined;

	return {
		transformTableContext() {
			return provider;
		},

		transformColumns(columns: TableColumn<T>[]): TableColumn<T>[] {
			const { hasExpandableRows, treeColumnKey } = config();

			// Resolve the tree column: the configured key when present, else the
			// first non-synthetic column (a configured column may have been hidden
			// by columnSettings — the expander must not vanish). Resolved **before**
			// the flat-data exit, as upstream does, so `treeKeyResolved` is current
			// even on a pass-through pass.
			const configuredExists =
				treeColumnKey != null && columns.some((c) => c.key === treeColumnKey);
			const treeKey = configuredExists
				? treeColumnKey
				: (columns.find((c) => !c.key.startsWith('__'))?.key ?? columns[0]?.key);
			treeKeyResolved = treeKey;

			// Migration guarantee: flat data renders identically to a Table without
			// the plugin. Upstream reaches the same early exit through its cache's
			// `wrapped` flag; with the cache gone this is the whole of it.
			if (!hasExpandableRows) {
				return columns;
			}

			return columns.map((col) => {
				if (col.key !== treeKey) {
					return col;
				}
				// The column's own renderer, wrapped rather than replaced. Declared
				// over the erased row type, as the context is; `TableColumn<T>` narrows
				// it back for the consumer and there is one row shape at runtime either
				// way.
				const inner = col.renderCell as unknown as Snippet<[Record<string, unknown>]> | undefined;
				return {
					...col,
					renderCell: bindTreeCell(col.key, (item) => ({
						item,
						columnKey: col.key,
						inner
					}))
				};
			});
		},

		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>
		): HeaderCellRenderProps {
			const { hasExpandableRows, hasExpandAllControl, isAllExpanded, onExpandAll, onCollapseAll } =
				config();

			// Only the tree column carries the toggle, and only when the control is
			// enabled, the data is actually hierarchical, and the state hook supplied
			// the aggregate state plus both handlers. Otherwise this is a
			// pass-through (flat data stays a no-op).
			if (
				!hasExpandAllControl ||
				!hasExpandableRows ||
				column.key !== treeKeyResolved ||
				isAllExpanded === undefined ||
				!onExpandAll ||
				!onCollapseAll
			) {
				return props;
			}

			const priorContent = props.content;

			return {
				...props,
				// `config()` is called **inside** the getter, exactly as `sortable`'s
				// header binding does and for the same reason: a keyed bound snippet
				// keeps its function identity, so this getter is the only path by
				// which a changed `isAllExpanded` reaches the toggle.
				content: bindTreeHeader(column.key, () => {
					const c = config();
					return {
						isAllExpanded: c.isAllExpanded ?? false,
						onExpandAll: c.onExpandAll ?? (() => {}),
						onCollapseAll: c.onCollapseAll ?? (() => {}),
						inner: priorContent
					};
				})
			};
		},

		transformBodyRow(props: BodyRowRenderProps, item: T): BodyRowRenderProps {
			const c = config();
			// Read through `hasExpandableRows` so tree ARIA disappears if the data
			// turns flat — upstream's reason for attaching the ref unconditionally.
			const meta = c.hasExpandableRows ? c.getRowMeta(item) : undefined;
			if (!meta) {
				return props;
			}

			const withAria: BodyRowRenderProps = {
				...props,
				htmlProps: {
					...props.htmlProps,
					'aria-level': meta.level + 1,
					// Only expandable rows carry aria-expanded; a leaf must not
					// advertise a state it has no control for.
					...(meta.hasChildren ? { 'aria-expanded': meta.isExpanded } : {})
				}
			};

			// Whole-row-click expansion (opt-in). Only expandable rows are
			// clickable; leaves and flat data stay inert. Upstream's guard is
			// `hasRowClickExpansion === true && hasExpandableRows &&
			// getRowMeta(item)?.hasChildren === true` — `hasExpandableRows` is the
			// feature-level flag and `hasChildren` the per-row check, both
			// intentional. Reaching this line already means `hasExpandableRows` was
			// true and `meta` is that same `getRowMeta(item)`, so the chain is
			// spelled against `meta` rather than re-reading it.
			const rowClickExpandable = c.hasRowClickExpansion === true && meta.hasChildren === true;
			if (!rowClickExpandable) {
				return withAria;
			}

			return {
				...withAria,
				htmlProps: {
					...withAria.htmlProps,
					onclick: (event: MouseEvent) => {
						// Don't hijack clicks on interactive cell content (the chevron
						// already stops propagation, but a composed selection checkbox,
						// link, or action button does not) or a text selection.
						const target = event.target as HTMLElement;
						if (
							target.closest(
								'button, a, input, select, textarea, [role="button"], [role="checkbox"], [contenteditable="true"]'
							)
						) {
							return;
						}
						if ((window.getSelection()?.toString() ?? '') !== '') {
							return;
						}
						config().onToggleItem(item);
					}
				},
				xstyle: [...withAria.xstyle, treeClickableRowStyle]
			};
		}
	};
}
