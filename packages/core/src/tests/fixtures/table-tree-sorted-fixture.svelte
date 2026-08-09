<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSortableState } from '$lib/components/table/plugins/sortable/use-table-sortable-state.svelte.js';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';
	import { fileTree, treeColumns, type FileRow } from './table-tree-fixture.svelte';

	/**
	 * Upstream's `SortedTree` — `useTableSortableState.applySort` handed to
	 * `sortSiblings`, so each sibling group is sorted without ever interleaving
	 * levels.
	 */
	const sortState = useTableSortableState<FileRow>(() => ({
		data: fileTree,
		defaultSort: [{ sortKey: 'name', direction: 'descending' }]
	}));

	const treeState = useTableTreeState<FileRow>(() => ({
		data: fileTree,
		idKey: 'id',
		defaultExpandedIds: ['src'],
		sortSiblings: sortState.applySort
	}));

	const tree = useTableTreeData<FileRow>(() => treeState.treeConfig);
</script>

<Table data={treeState.visibleData} columns={treeColumns} idKey="id" plugins={{ tree }} />
