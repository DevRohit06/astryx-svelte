import type { TableSortState } from './sort-utils.js';
import type { UseTableSortableConfig } from './use-table-sortable.js';

/**
 * Ported from Astryx's
 * `Table/plugins/sortable/useTableSortableState.tsx`.
 *
 * The comparator logic transcribes verbatim, including the NaN guard whose
 * absence would corrupt the order of unrelated rows. Three translations:
 *
 * - **`useState` → `$state`** for the uncontrolled branch. The
 *   controlled/uncontrolled resolution is upstream's, unchanged.
 * - **The result's members are getters.** Upstream returns a fresh object each
 *   render, so a consumer reading `sortedData` always sees the current value;
 *   a Svelte hook returns one object, so the members have to be live or a
 *   consumer would snapshot the first sort and never re-sort. This is the
 *   `useTheme()` hazard the docs blocks already record — destructuring this
 *   result is the mistake it invites.
 * - **The two `useRef`s are gone.** They exist to keep `sortedData`'s memo and
 *   `sortConfig`'s identity stable against inline object/callback identities; a
 *   `$derived` reading through the config getter has neither problem.
 */

// =============================================================================
// Comparator Types
// =============================================================================

/**
 * Custom comparator for a single sort key.
 * Receives two row values and returns a standard comparison number.
 * Direction (ascending/descending) is applied automatically by the hook —
 * comparators should always sort in ascending order.
 */
export type TableSortComparator<T> = (a: T, b: T) => number;

function toSortableString(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		typeof value === 'bigint'
	) {
		return String(value);
	}
	return '';
}

// =============================================================================
// Hook Config
// =============================================================================

/**
 * Configuration for {@link useTableSortableState}.
 *
 * @template T - The row data type
 * @template TSortKey - Union of valid sort key strings
 */
export interface UseTableSortableStateConfig<
	T extends Record<string, unknown>,
	TSortKey extends string = string
> {
	/**
	 * The data array to sort.
	 * The hook returns a new sorted copy — the original is never mutated.
	 */
	data: T[];

	/**
	 * Initial sort state for uncontrolled mode.
	 * Ignored when `sort` is provided.
	 * @default []
	 */
	defaultSort?: TableSortState<TSortKey>;

	/**
	 * Controlled sort state. When provided, the hook uses this instead of
	 * internal state. Must be paired with `onSortChange`.
	 */
	sort?: TableSortState<TSortKey>;

	/**
	 * Called when the sort state changes. Required when `sort` is provided.
	 */
	onSortChange?: (sort: TableSortState<TSortKey>) => void;

	/**
	 * Custom comparators per sort key.
	 * Keys are sort key strings; values are comparator functions that receive
	 * two row items. Comparators should sort ascending — the hook flips the
	 * sign for descending.
	 *
	 * For keys not in this map, the hook falls back to `localeCompare` with
	 * `{ numeric: true }` on the stringified values.
	 */
	comparators?: Partial<Record<TSortKey, TableSortComparator<T>>>;

	/**
	 * Allow returning to unsorted state.
	 * Passed through to the sortable plugin config.
	 * @default true
	 */
	allowUnsortedState?: boolean;

	/**
	 * Enable multi-sort via modifier key.
	 * Passed through to the sortable plugin config.
	 * @default false
	 */
	isMultiSortEnabled?: boolean;
}

// =============================================================================
// Hook Result
// =============================================================================

export interface UseTableSortableStateResult<
	T extends Record<string, unknown>,
	TSortKey extends string = string
> {
	/** Sorted copy of the input data. Derived — recomputed when sort state or data change. */
	readonly sortedData: T[];

	/** Current sort state. */
	readonly sort: TableSortState<TSortKey>;

	/** Ready-to-use config for `useTableSortable`. */
	readonly sortConfig: UseTableSortableConfig<TSortKey>;

	/**
	 * Apply the current sort state to arbitrary data.
	 * Useful when you have multiple data sources or need to sort a subset.
	 */
	applySort: (data: T[]) => T[];
}

// =============================================================================
// Default Comparator
// =============================================================================

function defaultCompare<T extends Record<string, unknown>>(a: T, b: T, sortKey: string): number {
	const aVal = a[sortKey];
	const bVal = b[sortKey];

	// null/undefined/NaN sort to the end. NaN must not reach the numeric fast
	// path: a NaN comparator result reads as "equal" to Array.sort, which makes
	// the comparator inconsistent and corrupts the order of the other rows.
	const aMissing = aVal == null || (typeof aVal === 'number' && Number.isNaN(aVal));
	const bMissing = bVal == null || (typeof bVal === 'number' && Number.isNaN(bVal));
	if (aMissing && bMissing) {
		return 0;
	}
	if (aMissing) {
		return 1;
	}
	if (bMissing) {
		return -1;
	}

	// number fast path
	if (typeof aVal === 'number' && typeof bVal === 'number') {
		return aVal - bVal;
	}

	// string comparison with numeric collation
	return toSortableString(aVal).localeCompare(toSortableString(bVal), undefined, {
		numeric: true
	});
}

// =============================================================================
// Sort Logic
// =============================================================================

function sortData<T extends Record<string, unknown>, TSortKey extends string = string>(
	data: T[],
	sortState: TableSortState<TSortKey>,
	comparators?: Partial<Record<TSortKey, TableSortComparator<T>>>
): T[] {
	if (sortState.length === 0) {
		return data;
	}

	return [...data].sort((a, b) => {
		for (const entry of sortState) {
			const { sortKey, direction } = entry;
			const customCmp = comparators?.[sortKey];
			const cmp = customCmp ? customCmp(a, b) : defaultCompare(a, b, sortKey);

			if (cmp !== 0) {
				return direction === 'ascending' ? cmp : -cmp;
			}
		}
		return 0;
	});
}

// =============================================================================
// Hook
// =============================================================================

/**
 * `useTableSortableState` — manages sort state and applies local sort to data.
 *
 * Convenience layer over {@link useTableSortable}. Owns sort state internally
 * (or accepts controlled state), sorts the data, and produces a ready-to-use
 * config for the headless sortable plugin.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const sortState = useTableSortableState(() => ({
 *     data: employees,
 *     defaultSort: [{ sortKey: 'name', direction: 'ascending' }],
 *     comparators: { age: (a, b) => (a.age as number) - (b.age as number) }
 *   }));
 *   const sortPlugin = useTableSortable(() => sortState.sortConfig);
 * </script>
 * <Table data={sortState.sortedData} {columns} plugins={{ sort: sortPlugin }} />
 * ```
 */
export function useTableSortableState<
	T extends Record<string, unknown>,
	TSortKey extends string = string
>(
	config: () => UseTableSortableStateConfig<T, TSortKey>
): UseTableSortableStateResult<T, TSortKey> {
	// Internal state (used in uncontrolled mode). Seeded from `defaultSort` at
	// init, as `useState`'s initial value is — a later change is ignored, which
	// is what "default" means on both sides.
	let internalSort = $state<TableSortState<TSortKey>>(config().defaultSort ?? []);

	// Resolve controlled vs uncontrolled
	const isControlled = $derived(config().sort !== undefined);
	const sort = $derived(isControlled ? (config().sort as TableSortState<TSortKey>) : internalSort);

	const onSortChange = (next: TableSortState<TSortKey>): void => {
		if (config().sort !== undefined) {
			(config().onSortChange ?? (() => {}))(next);
		} else {
			internalSort = next;
		}
	};

	const sortedData = $derived(sortData(config().data, sort, config().comparators));

	const sortConfig: UseTableSortableConfig<TSortKey> = {
		get sort() {
			return sort;
		},
		onSortChange,
		get allowUnsortedState() {
			return config().allowUnsortedState;
		},
		get isMultiSortEnabled() {
			return config().isMultiSortEnabled;
		}
	};

	return {
		get sortedData(): T[] {
			return sortedData;
		},
		get sort(): TableSortState<TSortKey> {
			return sort;
		},
		get sortConfig(): UseTableSortableConfig<TSortKey> {
			return sortConfig;
		},
		applySort: (inputData: T[]): T[] => sortData(inputData, sort, config().comparators)
	};
}
