<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';
	import { fileTree, type FileRow } from './table-tree-fixture.svelte';

	/** Upstream's `ZeroColumnsTable` — the plugin has no column to decorate. */
	const treeState = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));
	const tree = useTableTreeData<FileRow>(() => treeState.treeConfig);
</script>

<Table data={treeState.visibleData} columns={[]} idKey="id" plugins={{ tree }} />
