import { createSlotBinder } from '../../../../internal/bind-snippet.js';
import { useTranslator } from '../../../../i18n/index.js';
import { resolveContextActions } from '../../table-context-menu.svelte';
import type {
	HeaderCellRenderProps,
	TableColumn,
	TableContextAction,
	TablePlugin
} from '../../table-types.js';
import { resolveSortKey } from './sort-utils.js';
import type { TableSortState } from './sort-utils.js';
import {
	sortAscIcon,
	sortClearIcon,
	sortContent,
	sortDescIcon,
	type SortContentArg
} from './sortable-slots.svelte';

export type { TableSortDirection, TableSortEntry, TableSortState } from './sort-utils.js';

/**
 * Ported from Astryx's `Table/plugins/sortable/useTableSortable.tsx`.
 *
 * Two things to know about the translation:
 *
 * - **The header content is a bound snippet.** Upstream sets
 *   `content: <SortHeaderButton column={column}>{props.content}</SortHeaderButton>` —
 *   a closure over the column *and* over whatever content a prior plugin left
 *   in the slot. Neither can travel through a context, so this is the case
 *   `internal/bind-snippet.ts` exists for; see its header.
 * - **The context-menu actions stay lazy.** Upstream builds them behind a getter
 *   so the array is only constructed when a menu opens and always reflects the
 *   current sort. `TableContextActions` already models the getter form, so the
 *   shape carries over unchanged — including the `resolveContextActions` call
 *   that folds in a prior plugin's actions.
 *
 * The pure helpers live in `sort-utils.ts` so the component can share them.
 */

// =============================================================================
// Hook Config
// =============================================================================

/**
 * Configuration for {@link useTableSortable}.
 *
 * Follows Astryx headless plugin conventions: the consumer owns all state
 * and provides callbacks. The plugin never holds internal sort state.
 *
 * @template TSortKey - Union of valid sort key strings
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let sort = $state<TableSortState>([{ sortKey: 'name', direction: 'ascending' }]);
 *   const sortPlugin = useTableSortable(() => ({ sort, onSortChange: (s) => (sort = s) }));
 * </script>
 * <Table {data} {columns} plugins={{ sort: sortPlugin }} />
 * ```
 */
export interface UseTableSortableConfig<TSortKey extends string = string> {
	/** Current sort state — ordered array of active sort entries. */
	sort: TableSortState<TSortKey>;

	/**
	 * Called when the user changes sort via header click.
	 * Receives the complete new sort state array.
	 */
	onSortChange: (sort: TableSortState<TSortKey>) => void;

	/**
	 * Allow returning to unsorted state.
	 * When true, clicking a sorted column cycles: asc → desc → unsorted.
	 * When false, clicking cycles: asc → desc → asc.
	 *
	 * @default true
	 */
	allowUnsortedState?: boolean;

	/**
	 * Enable multi-sort via modifier key (Shift+click).
	 * When true, Shift+click adds/toggles a column as a secondary sort.
	 * Regular click still replaces the entire sort state (single-sort behavior).
	 *
	 * @default false
	 */
	isMultiSortEnabled?: boolean;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * `useTableSortable` — table plugin for column sorting.
 *
 * Returns a stable `TablePlugin<T>` that transforms header cells to add
 * clickable sort indicators. Follows the headless pattern: consumer owns
 * sort state, plugin provides UI and interaction.
 */
export function useTableSortable<
	T extends Record<string, unknown>,
	TSortKey extends string = string
>(config: () => UseTableSortableConfig<TSortKey>): TablePlugin<T> {
	const t = useTranslator();

	const erasedConfig = config as unknown as () => UseTableSortableConfig;

	// Bound once per hook call, keyed by column: the sort button must keep its
	// element identity across a sort change, or clicking it by keyboard destroys
	// the very button that has focus. See `createSlotBinder`'s note.
	const bindContent = createSlotBinder<SortContentArg>(sortContent);

	return {
		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>
		): HeaderCellRenderProps {
			const sortKey = resolveSortKey(column);
			if (sortKey == null) {
				return props;
			}

			const entry = config().sort.find((e) => e.sortKey === sortKey);

			// Context-menu actions are built lazily (only when the menu opens) via
			// a getter, reading the current sort state at call time — so we don't
			// build an action array for every header on every render, and the
			// checked/clear state always reflects the latest sort.
			const getSortActions = (): TableContextAction[] => {
				const c = config();
				const dir = c.sort.find((e) => e.sortKey === sortKey)?.direction ?? null;
				const actions: TableContextAction[] = [
					{
						id: 'sort-asc',
						group: 'sort',
						label: t('@astryx.table.sort.ascending'),
						icon: sortAscIcon,
						checked: dir === 'ascending',
						onSelect: () =>
							c.onSortChange([{ sortKey: sortKey as TSortKey, direction: 'ascending' }])
					},
					{
						id: 'sort-desc',
						group: 'sort',
						label: t('@astryx.table.sort.descending'),
						icon: sortDescIcon,
						checked: dir === 'descending',
						onSelect: () =>
							c.onSortChange([{ sortKey: sortKey as TSortKey, direction: 'descending' }])
					}
				];
				if (dir != null) {
					actions.push({
						id: 'sort-clear',
						group: 'sort-clear',
						label: t('@astryx.table.sort.clear'),
						icon: sortClearIcon,
						onSelect: () => c.onSortChange(c.sort.filter((e) => e.sortKey !== sortKey))
					});
				}
				return actions;
			};

			// Merge with any actions a prior plugin contributed (array or getter),
			// resolving both lazily at open time.
			const priorActions = props.contextMenuActions;
			const priorContent = props.content;

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					...(entry != null ? { 'aria-sort': entry.direction } : {})
				},
				// `config()` is called **inside** the getter, and the call is the whole
				// point rather than a stray read. A keyed bound snippet keeps its
				// function identity, so the slot's `{@const unwrapSlotArg(arg)}` derived
				// is the only path by which new props reach the child — and a derived
				// that reads nothing reactive never re-runs. Passing `erasedConfig`
				// *uncalled*, as the first cut did, left it inert.
				//
				// This makes the argument track the **config**. It does not make it
				// track the column object: `column` arrives as a transform argument, so
				// a column that keeps its `key` but changes its `header` or
				// `sortable.sortKey` still re-runs the transform without waking this
				// derived. See `createSlotBinder`'s contract and port/todo.md for that debt.
				content: bindContent(column.key, () => {
					config();
					return {
						column: column as TableColumn<Record<string, unknown>>,
						inner: priorContent,
						config: erasedConfig
					};
				}),
				contextMenuActions: () => [...resolveContextActions(priorActions), ...getSortActions()]
			};
		}
	};
}
