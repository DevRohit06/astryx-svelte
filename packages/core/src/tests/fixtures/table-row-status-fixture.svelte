<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';
	import type { TableRowStatus } from '$lib/components/table/plugins/row-status/use-table-row-status.js';

	export interface Row extends Record<string, unknown> {
		id: string;
		name: string;
		state: 'error' | 'warning' | 'ok' | 'done';
	}

	/** Upstream's `data`. */
	export const rowStatusData: Row[] = [
		{ id: 'a', name: 'Alice', state: 'error' },
		{ id: 'b', name: 'Bob', state: 'ok' },
		{ id: 'c', name: 'Carol', state: 'warning' }
	];

	/** Upstream's `columns`. */
	export const rowStatusColumns: TableColumn<Row>[] = [{ key: 'name', header: 'Name' }];

	/** Upstream's module-level `getStatus`. */
	export function defaultGetStatus(item: Row): TableRowStatus | null {
		if (item.state === 'error') {
			return { color: 'red', label: 'Error' };
		}
		if (item.state === 'warning') {
			return { color: 'orange', label: 'Warning' };
		}
		return null;
	}
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableRowStatus } from '$lib/components/table/plugins/row-status/use-table-row-status.js';

	/** Upstream's `Harness` — the hook feeding `<Table plugins>`. */
	interface Props {
		rows?: Row[];
		statusFn?: (item: Row) => TableRowStatus | null;
	}

	const { rows = rowStatusData, statusFn = defaultGetStatus }: Props = $props();

	const rowStatus = useTableRowStatus<Row>(() => ({ getStatus: statusFn }));
</script>

<Table data={rows} columns={rowStatusColumns} idKey="id" plugins={{ rowStatus }} />
