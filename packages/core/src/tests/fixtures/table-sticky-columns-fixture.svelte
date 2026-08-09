<script lang="ts" module>
	import { pixel } from '$lib/components/table/column-utils.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface StickyRow extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		team: string;
		status: string;
	}

	export const STICKY_DATA: StickyRow[] = [
		{ id: '1', name: 'Alice', email: 'a@x.com', team: 'DS', status: 'Active' },
		{ id: '2', name: 'Bob', email: 'b@x.com', team: 'Plat', status: 'Away' }
	];

	export const STICKY_COLUMNS: TableColumn<StickyRow>[] = [
		{ key: 'name', header: 'Name', width: pixel(180) },
		{ key: 'email', header: 'Email', width: pixel(220) },
		{ key: 'team', header: 'Team', width: pixel(160) },
		{ key: 'status', header: 'Status', width: pixel(140) }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableStickyColumns } from '$lib/components/table/plugins/sticky-columns/use-table-sticky-columns.js';

	/**
	 * Upstream's per-case `Harness` from `useTableStickyColumns.test.tsx`. Each of
	 * its six cases declares the same component with a different config, so one
	 * fixture taking `startKeys` / `endKeys` covers all of them — including the
	 * empty-config no-op, which is the hook's documented "pins nothing" shape.
	 */
	interface Props {
		startKeys?: string[];
		endKeys?: string[];
	}

	const { startKeys, endKeys }: Props = $props();

	const sticky = useTableStickyColumns<StickyRow>(() => ({ startKeys, endKeys }));
</script>

<Table data={STICKY_DATA} columns={STICKY_COLUMNS} idKey="id" plugins={{ stickyColumns: sticky }} />
