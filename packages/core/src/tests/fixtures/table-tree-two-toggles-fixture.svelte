<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';
	import { fileTree, treeColumns, type FileRow } from './table-tree-fixture.svelte';

	/**
	 * Upstream's `TwoTogglesTable`. Its point is that two commits inside one event
	 * handler both survive — a React *batch* upstream, a single synchronous
	 * handler here. The second `onToggleItem` must build on the set the first one
	 * wrote, which is what the hook's deleted `expandedIdsRef` used to buy.
	 */
	const treeState = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));
	const tree = useTableTreeData<FileRow>(() => treeState.treeConfig);
</script>

<button
	type="button"
	onclick={() => {
		treeState.treeConfig.onToggleItem(fileTree[0]); // expand 'src'
		treeState.treeConfig.onToggleItem(fileTree[0].children![0]); // expand 'components'
	}}>expand two</button
>
<Table data={treeState.visibleData} columns={treeColumns} idKey="id" plugins={{ tree }} />
<button type="button" onclick={treeState.expandAll}>noop</button>
