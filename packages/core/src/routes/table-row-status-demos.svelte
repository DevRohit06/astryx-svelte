<script lang="ts">
	import { Table, useTableRowStatus, pixel, proportional } from '$lib/index.js';
	import type { TableColumn, TableRowStatus } from '$lib/index.js';

	/**
	 * Upstream's `TableRowStatus.stories.tsx`, as a sibling route component — the
	 * `table-tree-demos.svelte` shape.
	 *
	 * **Both stories.** The jobs, the columns and `jobStatus` are module-level
	 * upstream and shared here; each story is its own React component with its own
	 * hook call, so each gets its own `useTableRowStatus`.
	 *
	 * Upstream's per-story prose, which Storybook renders through `autodocs`:
	 *
	 * - **Default** — a small colored dot in a leading gutter column signals
	 *   per-row status. Rows whose `getStatus` returns `null` (here: succeeded
	 *   jobs) show no dot. Hover a dot to see its accessible label.
	 * - **RawColors** — any CSS color works: here raw hex values instead of theme
	 *   tokens.
	 *
	 * One translation: **the hook takes a getter**, where upstream passes the
	 * config object — the settled shape for every published hook in this port,
	 * and what replaces upstream's `useMemo(..., [getStatus])`.
	 */

	// =============================================================================
	// Sample Data
	// =============================================================================

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
				return null; // succeeded: no indicator
		}
	}

	// =============================================================================
	// Stories
	// =============================================================================

	// Default
	const defaultStatus = useTableRowStatus<Job>(() => ({ getStatus: jobStatus }));

	// RawColors
	const rawColorStatus = useTableRowStatus<Job>(() => ({
		getStatus: (job) =>
			job.state === 'failed'
				? { color: '#dc2626', label: 'Failed' }
				: job.state === 'running'
					? { color: '#f59e0b', label: 'Running' }
					: null
	}));
</script>

<h3>Default</h3>
<Table data={jobs} {columns} idKey="id" hasHover plugins={{ rowStatus: defaultStatus }} />

<h3>Raw colors</h3>
<Table data={jobs} {columns} idKey="id" hasHover plugins={{ rowStatus: rawColorStatus }} />
