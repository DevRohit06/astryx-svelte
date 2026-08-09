<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface TreeItem extends Record<string, unknown> {
		id: string;
		name: string;
		children: TreeItem[];
	}

	/** Upstream's `treeData`. */
	export const treeData: TreeItem[] = [
		{
			id: 'a',
			name: 'Folder A',
			children: [
				{ id: 'a1', name: 'File A1', children: [] },
				{ id: 'a2', name: 'File A2', children: [] }
			]
		},
		{
			id: 'b',
			name: 'Folder B',
			children: [{ id: 'b1', name: 'File B1', children: [] }]
		},
		{ id: 'c', name: 'Leaf C', children: [] }
	];

	/** Upstream's `columns`. */
	export const expansionColumns: TableColumn<TreeItem>[] = [{ key: 'name', header: 'Name' }];

	const EMPTY_KEYS = new Set<string>();
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableRowExpansion } from '$lib/components/table/plugins/row-expansion/use-table-row-expansion.js';
	import { useTableRowExpansionState } from '$lib/components/table/plugins/row-expansion/use-table-row-expansion-state.svelte.js';

	/**
	 * Upstream's `Harness`.
	 *
	 * Upstream destructures `{data, expansionConfig}` out of the state hook,
	 * which it can because React returns a fresh object each render. Here the
	 * result's members are **getters** over one object, so destructuring `data`
	 * would freeze the first flattening — the hazard the hook's docstring names.
	 * The fixture therefore reads `expansionState.data` at the use site.
	 */
	interface Props {
		initialExpanded?: Set<string>;
	}

	const { initialExpanded = EMPTY_KEYS }: Props = $props();

	// svelte-ignore state_referenced_locally
	let expandedKeys = $state(new Set(initialExpanded));

	const expansionState = useTableRowExpansionState<TreeItem>(() => ({
		baseData: treeData,
		getChildren: (item) => item.children,
		getRowKey: (item) => item.id,
		expandedKeys,
		setExpandedKeys: (next) => (expandedKeys = next)
	}));

	const expansion = useTableRowExpansion<TreeItem>(() => expansionState.expansionConfig);
</script>

<Table data={expansionState.data} columns={expansionColumns} idKey="id" plugins={{ expansion }} />
