<!--
	Ported from upstream's `templates/blocks/components/Table/TableRowStatusTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The one translation is the settled one for this plugin family: the hook takes
	a **getter**, where upstream passes the config object.
-->
<script lang="ts">
	import { Table, useTableRowStatus, proportional, pixel } from '@astryx-svelte/core';
	import type { TableColumn, TableRowStatus } from '@astryx-svelte/core';

	interface Job extends Record<string, unknown> {
		id: string;
		name: string;
		owner: string;
		state: 'failed' | 'running' | 'queued' | 'succeeded';
	}

	const jobs: Job[] = [
		{ id: 'j1', name: 'build-core', owner: 'Ava', state: 'failed' },
		{ id: 'j2', name: 'lint', owner: 'Liam', state: 'running' },
		{ id: 'j3', name: 'unit-tests', owner: 'Zoe', state: 'succeeded' },
		{ id: 'j4', name: 'docsite-deploy', owner: 'Max', state: 'queued' },
		{ id: 'j5', name: 'smoke-test', owner: 'Mia', state: 'succeeded' }
	];

	const columns: TableColumn<Job>[] = [
		{ key: 'name', header: 'Job', width: proportional(2) },
		{ key: 'owner', header: 'Owner', width: pixel(120) },
		{ key: 'state', header: 'State', width: pixel(120) }
	];

	function jobStatus(job: Job): TableRowStatus | null {
		switch (job.state) {
			case 'failed':
				return { color: 'error', icon: 'error', label: 'Failed' };
			case 'running':
				return { color: 'warning', icon: 'warning', label: 'Running' };
			case 'queued':
				return { color: 'gray', label: 'Queued' };
			default:
				return null; // succeeded: no dot
		}
	}

	const rowStatus = useTableRowStatus<Job>(() => ({ getStatus: jobStatus }));
</script>

<Table data={jobs} {columns} idKey="id" hasHover plugins={{ rowStatus }} />
