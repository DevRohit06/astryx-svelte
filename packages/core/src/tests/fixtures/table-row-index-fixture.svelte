<script lang="ts" module>
	export interface RowIndexRow extends Record<string, unknown> {
		id: string;
		name: string;
	}
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableRowIndex } from '$lib/components/table/plugins/row-index/use-table-row-index.svelte.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	/**
	 * Upstream's `Harness` from `useTableRowIndex.test.tsx`, transcribed. The
	 * `useKey` flag selects the keyed lookup path exactly as upstream's does.
	 */
	interface Props {
		rows: RowIndexRow[];
		label?: string;
		startFrom?: number;
		useKey?: boolean;
	}

	const { rows, label, startFrom, useKey = false }: Props = $props();

	const rowIndex = useTableRowIndex<RowIndexRow>(() => ({
		data: rows,
		label,
		startFrom,
		getRowKey: useKey ? (item) => item.id : undefined
	}));

	const columns: TableColumn<RowIndexRow>[] = [{ key: 'name', header: 'Name' }];
</script>

<Table data={rows} {columns} idKey="id" plugins={{ rowIndex }} />
