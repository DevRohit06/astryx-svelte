<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';
	import { fileTree, treeColumns, type FileRow } from './table-tree-fixture.svelte';

	/**
	 * Upstream's `SpyTree` from the row-click-expansion block: `hasRowClickExpansion`
	 * on, with `onToggleItem` wrapped so the case can count how many times one
	 * chevron click reaches the toggle. The spy is a prop rather than a closure
	 * over a `vi.fn()` declared in the fixture, so the case owns the assertion.
	 */
	interface Props {
		onToggle: (item: FileRow) => void;
	}

	const { onToggle }: Props = $props();

	const treeState = useTableTreeState<FileRow>(() => ({
		data: fileTree,
		idKey: 'id'
	}));

	// The spread sits inside the getter for the reason `table-tree-fixture.svelte`
	// records: `treeConfig`'s members are getters, and spreading once outside
	// would snapshot them.
	const tree = useTableTreeData<FileRow>(() => ({
		...treeState.treeConfig,
		hasRowClickExpansion: true,
		onToggleItem: (item: FileRow) => {
			onToggle(item);
			treeState.treeConfig.onToggleItem(item);
		}
	}));
</script>

<Table data={treeState.visibleData} columns={treeColumns} idKey="id" plugins={{ tree }} />
