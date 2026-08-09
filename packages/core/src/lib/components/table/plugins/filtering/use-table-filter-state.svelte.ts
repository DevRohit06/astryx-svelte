import type { TableFilterState, TableFilterValue } from './use-table-filtering.js';

/**
 * Ported from Astryx's
 * `Table/plugins/filtering/useTableFilterState.tsx`.
 *
 * The update logic transcribes verbatim, including the destructure-and-drop
 * that removes a key rather than assigning `undefined` to it. Three
 * translations:
 *
 * - **`useState` → `$state`.** The hook owns the map outright; there is no
 *   controlled branch on either side.
 * - **The result's members are getters.** Upstream returns a fresh object every
 *   render, so `filters` is always current; a Svelte hook returns one object for
 *   the component's lifetime, so a plain property would freeze the map at its
 *   first value. Same hazard `useTableSortableState` records — **destructuring
 *   this result is the mistake it invites**, and nothing in the type system
 *   prevents it.
 * - **The two `useCallback`s are gone.** They exist to keep `onFilterChange` and
 *   `clearAll` referentially stable across renders; these two are created once
 *   and never re-created, so there is no identity to preserve. Neither reads
 *   state through a stale closure either — upstream's `setFilters(prev => …)`
 *   updater form guards against a batched React setter seeing stale state, and a
 *   `$state` read never is. That is the `useTableSelectionState` reasoning
 *   applied to the hook's own state rather than a caller's setter.
 *
 * This is the one file in the plugin that needs runes, hence `.svelte.ts`.
 */

export interface UseTableFilterStateResult {
	/** Current filter state — pass to `useTableFiltering`. */
	filters: TableFilterState;
	/** Filter change handler — pass to `useTableFiltering`. */
	onFilterChange: (key: string, value: TableFilterValue | null) => void;
	/** Reset all filters to empty. */
	clearAll: () => void;
}

/**
 * `useTableFilterState` — manages the filter state object.
 *
 * A convenience hook that bundles `$state<TableFilterState>` with a
 * correctly-typed `onFilterChange` handler. Eliminates the boilerplate of
 * writing the state update logic in every consumer.
 *
 * The returned `filters` and `onFilterChange` are passed directly to
 * `useTableFiltering`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const filterState = useTableFilterState();
 *   const filterPlugin = useTableFiltering(() => ({
 *     filters: filterState.filters,
 *     onFilterChange: filterState.onFilterChange,
 *     variant: 'inline',
 *     searchConfig
 *   }));
 * </script>
 * ```
 */
export function useTableFilterState(initialState?: TableFilterState): UseTableFilterStateResult {
	let filters = $state<TableFilterState>(initialState ?? {});

	return {
		get filters() {
			return filters;
		},

		onFilterChange: (key: string, value: TableFilterValue | null) => {
			if (value == null) {
				const { [key]: _removed, ...next } = filters;
				filters = next;
				return;
			}
			filters = { ...filters, [key]: value };
		},

		clearAll: () => {
			filters = {};
		}
	};
}
