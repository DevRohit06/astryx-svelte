<script lang="ts" module>
	export interface PerfRow extends Record<string, unknown> {
		id: string;
		name: string;
	}
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	/**
	 * Upstream's `SelectionTestTable` from `useTableSelection-perf.test.tsx`.
	 *
	 * Upstream's second harness, `SelectionRenderCountTable`, has no counterpart —
	 * it exists to increment a per-row counter inside `renderCell`, which measures
	 * React's reconciliation. See the header of `table-selection-perf.svelte.test.ts`.
	 */
	interface Props {
		data: PerfRow[];
	}

	const { data }: Props = $props();

	let selectedKeys = $state(new Set<string>());

	const columns: TableColumn<PerfRow>[] = [{ key: 'name', header: 'Name' }];

	const selection = useTableSelection<PerfRow>(() => ({
		getIsItemSelected: (item) => selectedKeys.has(item.id),
		onSelectItem: ({ item, isSelected }) => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Set(selectedKeys);
			if (isSelected) {
				next.add(item.id);
			} else {
				next.delete(item.id);
			}
			selectedKeys = next;
		},
		onSelectAll: ({ isAllSelected }) => {
			selectedKeys = isAllSelected ? new Set(data.map((d) => d.id)) : new Set();
		},
		getIsAllSelected: () => data.length > 0 && data.every((d) => selectedKeys.has(d.id)),
		getIsIndeterminate: () => {
			const count = data.filter((d) => selectedKeys.has(d.id)).length;
			return count > 0 && count < data.length;
		}
	}));
</script>

<Table {data} {columns} idKey="id" plugins={{ selection }} />
