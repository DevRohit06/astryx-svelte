<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import { useTableSelectionState } from '$lib/components/table/plugins/selection/use-table-selection-state.svelte.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';
	import type { SelectionStateItem } from './table-selection-state-fixture.svelte';

	/**
	 * Upstream's `FilteredSelectionTable` from `useTableSelectionState.test.tsx`.
	 *
	 * Simulates the pattern where consumers pass filtered data to
	 * `useTableSelectionState`, scoping select-all to visible rows. Selections
	 * made on filtered views persist when the filter changes.
	 *
	 * React's `onChange` on an `<input>` is the DOM `input` event, so that is the
	 * handler here; the two read-out `<span>`s are upstream's, verbatim.
	 */
	interface Props {
		data: SelectionStateItem[];
		initialFilter?: string;
	}

	const { data, initialFilter = '' }: Props = $props();

	let selectedKeys = $state(new Set<string>());
	// Initial value only, as upstream's `useState(initialFilter)` is.
	// svelte-ignore state_referenced_locally
	let filter = $state(initialFilter);

	const filteredData = $derived(
		filter ? data.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase())) : data
	);

	const { selectionConfig } = useTableSelectionState<SelectionStateItem>(() => ({
		data: filteredData,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));

	const selection = useTableSelection<SelectionStateItem>(() => selectionConfig);

	const columns: TableColumn<SelectionStateItem>[] = [{ key: 'name', header: 'Name' }];
</script>

<div>
	<input
		data-testid="filter-input"
		value={filter}
		oninput={(e) => (filter = e.currentTarget.value)}
	/>
	<span data-testid="selected-count">{selectedKeys.size}</span>
	<span data-testid="selected-keys">{[...selectedKeys].sort().join(',')}</span>
	<Table data={filteredData} {columns} idKey="id" plugins={{ selection }} />
</div>
