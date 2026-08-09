<script lang="ts" module>
	export interface SortableFixtureRow extends Record<string, unknown> {
		id: string;
		name: string;
		age: number;
	}
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSortable } from '$lib/components/table/plugins/sortable/use-table-sortable.js';
	import { useTableSortableState } from '$lib/components/table/plugins/sortable/use-table-sortable-state.svelte.js';

	/**
	 * Drives `useTableSortableState` → `useTableSortable`. The sort plugin is the
	 * first consumer of `bindSnippet` inside the real table pipeline, which is
	 * what this fixture exists to exercise.
	 */
	interface Props {
		data: SortableFixtureRow[];
		isMultiSortEnabled?: boolean;
	}

	const { data, isMultiSortEnabled = false }: Props = $props();

	const sortState = useTableSortableState<SortableFixtureRow>(() => ({
		data,
		isMultiSortEnabled
	}));

	const sort = useTableSortable<SortableFixtureRow>(() => sortState.sortConfig);

	const columns = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'age', header: 'Age', sortable: true },
		{ key: 'id', header: 'ID' }
	];

	/** Read by the assertions — the row order the table currently renders. */
	export const rendered = {
		get names(): string[] {
			return sortState.sortedData.map((r) => r.name);
		}
	};
</script>

<Table data={sortState.sortedData} {columns} idKey="id" plugins={{ sort }} />
