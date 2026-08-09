<script lang="ts">
	import SortableStateTable from './table-sortable-state-fixture.svelte';
	import type { TableSortState } from '$lib/components/table/plugins/sortable/use-table-sortable.js';

	/**
	 * Upstream's `ControlledWrapper` (and `ControlledWithSpy`, which is the same
	 * component with an empty initial sort and a spy) from
	 * `useTableSortableState.test.tsx`: it owns the sort state and drives the
	 * table in controlled mode.
	 */
	interface Props {
		initialSort?: TableSortState;
		onSortChange?: (sort: TableSortState) => void;
	}

	const { initialSort = [{ sortKey: 'name', direction: 'ascending' }], onSortChange }: Props =
		$props();

	// svelte-ignore state_referenced_locally
	let sort = $state<TableSortState>(initialSort);

	function handleChange(newSort: TableSortState): void {
		sort = newSort;
		onSortChange?.(newSort);
	}
</script>

<button
	type="button"
	data-testid="external-sort"
	onclick={() => (sort = [{ sortKey: 'age', direction: 'descending' }])}
>
	Sort by age desc
</button>
<button type="button" data-testid="clear-sort" onclick={() => (sort = [])}> Clear sort </button>
<SortableStateTable {sort} onSortChange={handleChange} />
