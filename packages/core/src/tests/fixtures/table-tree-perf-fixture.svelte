<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface TreeRow extends Record<string, unknown> {
		id: string;
		name: string;
		children?: TreeRow[];
	}

	/** Upstream's `roots` — 5 roots; the last root has 2 children. */
	export const roots: TreeRow[] = [
		...Array.from({ length: 4 }, (_, i) => ({ id: `root-${i}`, name: `Root ${i}` })),
		{
			id: 'root-4',
			name: 'Root 4',
			children: [
				{ id: 'child-0', name: 'Child 0' },
				{ id: 'child-1', name: 'Child 1' }
			]
		}
	];

	export const perfColumns: TableColumn<TreeRow>[] = [{ key: 'name', header: 'Name' }];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableTreeData } from '$lib/components/table/plugins/tree/use-table-tree-data.js';
	import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';

	/**
	 * Upstream's `TreeRenderCountTable`, minus the render counter.
	 *
	 * Upstream threads a `renderCounts` record through a `renderCell` that
	 * increments on every React render. There is no render to count here — a
	 * Svelte cell's text updates in place — so the fixture keeps only the data
	 * shape, and the ported case asks the same question of element identity.
	 * See the suite file.
	 */
	const treeState = useTableTreeState<TreeRow>(() => ({ data: roots, idKey: 'id' }));
	const tree = useTableTreeData<TreeRow>(() => treeState.treeConfig);
</script>

<Table data={treeState.visibleData} columns={perfColumns} idKey="id" plugins={{ tree }} />
