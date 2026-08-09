<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';
	import type { TreeRow } from './table-tree-perf-fixture.svelte';

	/** Upstream's inline `DomBudgetTable` data and columns. */
	export const budgetData: TreeRow[] = [{ id: 'a', name: 'a', children: [{ id: 'b', name: 'b' }] }];

	export const budgetColumns: TableColumn<TreeRow>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'id', header: 'Id' }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';

	/** Upstream's `DomBudgetTable`. */
	const treeState = useTableTreeState<TreeRow>(() => ({ data: budgetData, idKey: 'id' }));
	const tree = useTableTreeData<TreeRow>(() => treeState.treeConfig);
</script>

<Table data={treeState.visibleData} columns={budgetColumns} idKey="id" plugins={{ tree }} />
