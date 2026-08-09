import type { Snippet } from 'svelte';
import { createCellSlotBinder, createSlotBinder } from '../../../../internal/bind-snippet.js';
import { useTranslator } from '../../../../i18n/index.js';
import { pixel } from '../../column-utils.js';
import { resolveContextActions } from '../../table-context-menu.svelte';
import type {
	BodyCellRenderProps,
	BodyRowRenderProps,
	HeaderCellRenderProps,
	TableColumn,
	TablePlugin
} from '../../table-types.js';
import { clickableRowStyle } from './row-expansion.stylex.js';
import {
	chevronDownIcon,
	chevronRightIcon,
	expandAllContent,
	expansionCell,
	expansionFirstColumnCell,
	type ExpandAllArg,
	type ExpansionCellArg,
	type ExpansionFirstColumnCellArg
} from './row-expansion-slots.svelte';

/**
 * Ported from Astryx's
 * `Table/plugins/rowExpansion/useTableRowExpansion.tsx`.
 *
 * @deprecated Superseded by the tree plugin (useTableTreeData +
 *   useTableTreeState). Kept for back-compat; new tree tables should use the
 *   tree plugin. See the migration guide on useTableRowExpansion.
 *
 * The transform pipeline transcribes verbatim — the synthetic `__expansion`
 * column, the wrapped first content column, the per-cell context-menu action and
 * the optional whole-row click target are all upstream's, in upstream's order.
 * What follows is every translation, including the deletions.
 *
 * ## What has no counterpart, and is deleted
 *
 * - **`useMemo` / `useCallback`.** Upstream memoises the plugin object and the
 *   expansion column so a re-render does not hand `BaseTable` a new identity.
 *   The config arrives here as a **getter**, so a closure over it is stable and
 *   live at once: the plugin object is built once for the component's lifetime
 *   and every read of `expandedKeys`, `getDepth`, … happens at call time. There
 *   is nothing left to memoise and no dependency array to keep honest.
 * - **`firstUserColumnKeyRef`.** The ref is written at the top of
 *   `transformColumns` and read in the `map` immediately below it, inside the
 *   same call. It is a local variable wearing a ref's clothes, so it is a local
 *   variable here.
 *
 * ## What changes shape
 *
 * - **Three slots are markup, and a `.ts` hook cannot author a snippet.** Each
 *   is a module-exported snippet from `row-expansion-slots.svelte`, bound with
 *   its per-cell data through the **keyed** binders in
 *   `internal/bind-snippet.ts`. `content` on the header uses `createSlotBinder`;
 *   the two `renderCell`s use `createCellSlotBinder`, because
 *   `TableColumn.renderCell` is `Snippet<[T]>` and the row parameter has to be
 *   folded into the bound argument. See those functions' notes — and note the
 *   keying is not cosmetic: `{@render}` branches on a snippet's function
 *   identity, so an unkeyed binding hands it a fresh function on every transform
 *   and *replaces* the chevron a keyboard user just pressed, dropping focus to
 *   `<body>`. Upstream never meets this, because React reconciles by
 *   type-and-key. This plugin briefly carried its own private `bindCellSnippet`
 *   for the fold; the shared, keyed pair supersedes it.
 * - **Returning `null` from `renderCell` becomes a flag.** Upstream skips the
 *   chevron for child rows and for non-expandable rows by returning `null`;
 *   `ExpansionCellArg.isVisible` carries both guards and the snippet renders
 *   nothing when it is false.
 * - **`content: null` on the header becomes `content: undefined`.** The slot is
 *   `string | Snippet`, and `BaseTable` resolves `content ?? column.header`, so
 *   `undefined` falls back to the expansion column's `header: ''` and the cell
 *   renders empty — which is what `null` renders upstream.
 * - **`onClick` → `onclick`** on the row's `htmlProps`, Svelte's attribute name.
 *
 * The context-menu label was translated here ahead of upstream — a recorded
 * known debt of theirs, since they hardcoded `'Collapse row'` / `'Expand row'`
 * there while translating the two aria labels that say the same words. Upstream
 * 0.3.0 closed it against the same `@astryx.tableRowExpansion.*` keys, so this
 * is no longer a divergence.
 *
 * The plugin holds no state, so this is a plain `.ts` module;
 * `use-table-row-expansion-state.svelte.ts` is where the runes live.
 */

// =============================================================================
// Config
// =============================================================================

/**
 * Configuration for useTableRowExpansion (inherited-columns mode).
 *
 * Child rows use the same columns as their parents, with indentation on the
 * first content column. The consumer provides a **flat** data array (use
 * `useTableRowExpansionState` to flatten a tree) and a `getDepth`
 * function so the plugin knows each row's nesting level.
 */
export interface UseTableRowExpansionConfig<T extends Record<string, unknown>> {
	/** Set of currently-expanded row keys. */
	expandedKeys: Set<string>;
	/** Called when a row's expansion is toggled. */
	onToggle: (key: string) => void;
	/** Derive a stable unique key from a row item. */
	getRowKey: (item: T) => string;
	/** Return the children of a row (used to determine expandability). */
	getChildren: (item: T) => T[];
	/** Return the depth of a row in the hierarchy (0 = top-level). */
	getDepth?: (item: T) => number;
	/** Optionally control which rows are expandable. @default checks getChildren length */
	getIsItemExpandable?: (item: T) => boolean;
	/**
	 * When true, clicking anywhere on the row toggles expansion (in addition to
	 * the chevron button). @default false — only the chevron triggers expansion.
	 */
	hasRowClickExpansion?: boolean;
	/**
	 * State of the expand-all toggle in the header. `true` = all expanded,
	 * `false` = all collapsed, `'indeterminate'` = mixed. When provided
	 * (together with `onToggleExpandAll`), the header cell shows a toggle button.
	 */
	isAllExpanded?: boolean | 'indeterminate';
	/** Called when the expand-all header toggle is clicked. */
	onToggleExpandAll?: (expand: boolean) => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Expansion column key. Upstream's verbatim — `BaseTable` never inspects it, but this plugin does. */
const EXPANSION_COLUMN_KEY = '__expansion';

const EXPANSION_COLUMN_WIDTH = pixel(40);

/** Indentation applied per depth level, in pixels. */
const INDENT_PER_DEPTH = 24;

// =============================================================================
// Hook
// =============================================================================

/**
 * Returns a {@link TablePlugin} implementing expandable rows with inherited
 * columns: child rows use the same columns as their parents, indented by depth,
 * and a synthetic chevron column leads the table.
 *
 * @deprecated Use `useTableTreeData` (with `useTableTreeState`) instead. The
 * tree plugin covers the same affordances (expand-all header control,
 * whole-row click) with a cycle guard and per-row fine-grained re-render. See
 * the migration guide in the `useTableRowExpansion` docs for the before/after
 * and config mapping.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let expandedKeys = $state(new Set<string>());
 *   const expansionState = useTableRowExpansionState(() => ({
 *     baseData: tree,
 *     getChildren: (item) => item.children ?? [],
 *     getRowKey: (item) => item.id,
 *     expandedKeys,
 *     setExpandedKeys: (next) => (expandedKeys = next)
 *   }));
 *   const expansion = useTableRowExpansion(() => expansionState.expansionConfig);
 * </script>
 * <Table data={expansionState.data} {columns} idKey="id" plugins={{ expansion }} />
 * ```
 */
export function useTableRowExpansion<T extends Record<string, unknown>>(
	config: () => UseTableRowExpansionConfig<T>
): TablePlugin<T> {
	const t = useTranslator();

	// Bound once per hook call, keyed by column: each chevron must keep its
	// element identity across an expand/collapse, or clicking it by keyboard
	// destroys the very button that has focus. See the keyed binders' notes in
	// `internal/bind-snippet.ts`.
	const bindExpansionCell = createCellSlotBinder<T, ExpansionCellArg>(expansionCell);
	const bindFirstColumnCell = createCellSlotBinder<T, ExpansionFirstColumnCellArg>(
		expansionFirstColumnCell
	);
	const bindExpandAll = createSlotBinder<ExpandAllArg>(expandAllContent);

	// Upstream destructures the config once per render and closes over the
	// results; here every read goes back through the getter, which is what keeps
	// one plugin object correct for the component's whole lifetime.
	const isItemExpandable = (item: T): boolean => {
		const { getIsItemExpandable, getChildren } = config();
		return getIsItemExpandable ? getIsItemExpandable(item) : getChildren(item).length > 0;
	};

	const depthOf = (item: T): number => {
		const { getDepth } = config();
		return getDepth ? getDepth(item) : 0;
	};

	const rowToggleLabel = (isExpanded: boolean): string =>
		isExpanded
			? t('@astryx.tableRowExpansion.collapseRow')
			: t('@astryx.tableRowExpansion.expandRow');

	const expansionColumn: TableColumn<T> = {
		key: EXPANSION_COLUMN_KEY,
		header: '',
		width: EXPANSION_COLUMN_WIDTH,
		resizable: false,
		renderCell: bindExpansionCell(EXPANSION_COLUMN_KEY, (item) => {
			const { expandedKeys, getRowKey } = config();
			const key = getRowKey(item);
			const isExpanded = expandedKeys.has(key);
			return {
				// Child rows (depth > 0) show their chevron inline in the first user
				// column instead — don't double up here. Non-expandable rows show
				// nothing at all.
				isVisible: depthOf(item) === 0 && isItemExpandable(item),
				isExpanded,
				onToggle: () => config().onToggle(key),
				ariaLabel: rowToggleLabel(isExpanded)
			};
		})
	};

	return {
		transformColumns(columns: TableColumn<T>[]) {
			// The first user column takes the indentation. Upstream parks this in a
			// `useRef` that it writes and reads within this one call; see the module
			// header for why the ref has no counterpart.
			const firstUserColumnKey = columns.find((c) => !c.key.startsWith('__'))?.key ?? null;

			// Wrap the first user column's renderCell to add depth indentation +
			// an inline chevron for child rows. This is the inherited-columns
			// pattern: child rows use the same columns but indent their first
			// content cell.
			const wrappedColumns = columns.map((col) => {
				if (col.key !== firstUserColumnKey) {
					return col;
				}
				const originalRenderCell = col.renderCell;
				return {
					...col,
					renderCell: bindFirstColumnCell(col.key, (item) => {
						const { expandedKeys, getRowKey } = config();
						const depth = depthOf(item);
						const key = getRowKey(item);
						const isExpanded = expandedKeys.has(key);
						return {
							item,
							depth,
							// Guarded rather than computed unconditionally, because
							// upstream computes both only inside its `depth > 0`
							// branch and `getChildren` is the consumer's function.
							indent: depth > 0 ? (depth - 1) * INDENT_PER_DEPTH : 0,
							isExpandable: depth > 0 && isItemExpandable(item),
							isExpanded,
							onToggle: () => config().onToggle(key),
							ariaLabel: rowToggleLabel(isExpanded),
							renderCell: originalRenderCell as Snippet<[Record<string, unknown>]> | undefined,
							text: originalRenderCell
								? ''
								: String((item[col.key] as string | number | null | undefined) ?? '')
						};
					})
				};
			});

			return [expansionColumn, ...wrappedColumns];
		},

		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>
		): HeaderCellRenderProps {
			if (column.key !== EXPANSION_COLUMN_KEY) {
				return props;
			}

			// Show expand-all toggle when the consumer provides the state + callback.
			const { isAllExpanded, onToggleExpandAll } = config();
			if (isAllExpanded !== undefined && onToggleExpandAll) {
				return {
					...props,
					content: bindExpandAll(column.key, () => {
						const c = config();
						const allExpanded = c.isAllExpanded === true;
						return {
							allExpanded,
							onToggleExpandAll: c.onToggleExpandAll ?? (() => {}),
							ariaLabel: allExpanded
								? t('@astryx.tableRowExpansion.collapseAllRows')
								: t('@astryx.tableRowExpansion.expandAllRows')
						};
					})
				};
			}

			// Upstream's `content: null`. `BaseTable` resolves `content ?? header`,
			// and this column's header is `''`, so the cell renders empty either way.
			return { ...props, content: undefined };
		},

		transformBodyCell(
			props: BodyCellRenderProps,
			_column: TableColumn<T>,
			item: T
		): BodyCellRenderProps {
			// Contribute "Expand/Collapse row" context-menu action on every cell
			// so right-clicking anywhere in the row shows the option.
			if (!isItemExpandable(item)) {
				return props;
			}

			const { expandedKeys, getRowKey } = config();
			const key = getRowKey(item);
			const isExpanded = expandedKeys.has(key);
			const priorActions = props.contextMenuActions;
			return {
				...props,
				contextMenuActions: () => [
					...resolveContextActions(priorActions),
					{
						id: 'row-expansion-toggle',
						group: 'row-expansion',
						label: rowToggleLabel(isExpanded),
						icon: isExpanded ? chevronDownIcon : chevronRightIcon,
						onSelect: () => config().onToggle(key)
					}
				]
			};
		},

		transformBodyRow(props: BodyRowRenderProps, item: T): BodyRowRenderProps {
			const { hasRowClickExpansion = false, getRowKey } = config();
			if (!hasRowClickExpansion) {
				return props;
			}
			if (!isItemExpandable(item)) {
				return props;
			}
			const key = getRowKey(item);
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					onclick: () => config().onToggle(key)
				},
				xstyle: [...props.xstyle, clickableRowStyle]
			};
		}
	};
}
