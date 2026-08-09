<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import { useTableSelectionState } from '$lib/components/table/plugins/selection/use-table-selection-state.svelte.js';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';
	import { fileTree, treeColumns, type FileRow } from './table-tree-fixture.svelte';

	/**
	 * Upstream's `ComposedTable` — tree plus selection. `useBaseTablePlugins`
	 * orders `tree` before `selection`, so the checkbox column lands left of the
	 * indented tree column no matter how the record is written.
	 *
	 * Upstream's later `TreeWithSelection` (the row-click-expansion block) is the
	 * same component with `hasRowClickExpansion` on and nothing expanded, so both
	 * props are parameterised here rather than duplicating the fixture; the
	 * defaults are `ComposedTable`'s.
	 */
	interface Props {
		defaultExpandedIds?: string[];
		hasRowClickExpansion?: boolean;
	}

	const { defaultExpandedIds = ['src'], hasRowClickExpansion }: Props = $props();

	let selectedKeys = $state(new Set<string>());

	const treeState = useTableTreeState<FileRow>(() => ({
		data: fileTree,
		idKey: 'id',
		defaultExpandedIds
	}));

	const { selectionConfig } = useTableSelectionState<FileRow>(() => ({
		data: treeState.visibleData,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));

	const tree = useTableTreeData<FileRow>(() => ({
		...treeState.treeConfig,
		hasRowClickExpansion
	}));
	const selection = useTableSelection<FileRow>(() => selectionConfig);
</script>

<Table
	data={treeState.visibleData}
	columns={treeColumns}
	idKey="id"
	plugins={{ tree, selection }}
/>
