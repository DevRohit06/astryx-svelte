<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';
	import { treeColumns, type FileRow } from './table-tree-fixture.svelte';

	/** Upstream's `LazyTable` — children arrive only once the row is expanded. */
	let data = $state<FileRow[]>([{ id: 'folder', name: 'folder', size: 0 }]);

	const treeState = useTableTreeState<FileRow>(() => ({
		data,
		idKey: 'id',
		isItemExpandable: (item) => item.id === 'folder',
		onExpandedIdsChange: (expandedIds) => {
			if (expandedIds.has('folder')) {
				// Simulated fetch: children arrive after expansion.
				data = [
					{
						id: 'folder',
						name: 'folder',
						size: 0,
						children: [{ id: 'lazy-child', name: 'lazy-child', size: 3 }]
					}
				];
			}
		}
	}));

	const tree = useTableTreeData<FileRow>(() => treeState.treeConfig);
</script>

<Table data={treeState.visibleData} columns={treeColumns} idKey="id" plugins={{ tree }} />
