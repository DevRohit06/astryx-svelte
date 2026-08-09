<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface FileRow extends Record<string, unknown> {
		id: string;
		name: string;
		size: number;
		children?: FileRow[];
	}

	/** Upstream's `fileTree`. */
	export const fileTree: FileRow[] = [
		{
			id: 'src',
			name: 'src',
			size: 0,
			children: [
				{
					id: 'components',
					name: 'components',
					size: 0,
					children: [{ id: 'button', name: 'Button.tsx', size: 120 }]
				},
				{ id: 'utils', name: 'utils.ts', size: 40 }
			]
		},
		{ id: 'readme', name: 'README.md', size: 10 }
	];

	/** Upstream's `columns`. */
	export const treeColumns: TableColumn<FileRow>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'size', header: 'Size' }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';

	/**
	 * Upstream's `TreeTable` harness — `useTableTreeState` feeding
	 * `useTableTreeData`, with the flattened rows going straight to `<Table>`.
	 */
	interface Props {
		data?: FileRow[];
		defaultExpandedIds?: string[];
		indent?: 'sm' | 'md' | 'lg';
		treeColumnKey?: string;
		hasExpandAllControl?: boolean;
		hasRowClickExpansion?: boolean;
	}

	const {
		data = fileTree,
		defaultExpandedIds,
		indent,
		treeColumnKey,
		hasExpandAllControl,
		hasRowClickExpansion
	}: Props = $props();

	const treeState = useTableTreeState<FileRow>(() => ({
		data,
		idKey: 'id',
		defaultExpandedIds,
		indent,
		treeColumnKey
	}));

	// Upstream splits `hasExpandAllControl` and `hasRowClickExpansion` off the
	// state config and folds them into the *data* config —
	// `useTableTreeData({...treeConfig, hasExpandAllControl, hasRowClickExpansion})`.
	// The spread has to sit inside the getter, not outside it: `treeConfig`'s
	// members are getters, so spreading once would snapshot the aggregate state
	// and the toggle would never relabel.
	const tree = useTableTreeData<FileRow>(() => ({
		...treeState.treeConfig,
		hasExpandAllControl,
		hasRowClickExpansion
	}));
</script>

<Table data={treeState.visibleData} columns={treeColumns} idKey="id" plugins={{ tree }} />
