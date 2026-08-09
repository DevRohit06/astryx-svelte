<script lang="ts">
	import { Table, pixel, useTableColumnResize, useTableStickyColumns } from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableStickyColumns.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape, one `<h3>` per story.
	 *
	 * **All 5 stories.** The employee data, the eight fixed-width columns, the
	 * grey note paragraph and the 720px cap on every story wrapper transcribe
	 * verbatim. The cap is load-bearing rather than cosmetic: it is what keeps the
	 * Table's own scroll container narrower than its columns, and with no internal
	 * horizontal scroll there is nothing for a pinned column to pin against.
	 *
	 * Upstream's per-story doc comments, kept here rather than dropped:
	 *
	 * - **PinStart** — pin the leading `Name` column to the start edge. Scroll
	 *   horizontally: the name stays put and a drop shadow appears over the
	 *   scrolling content.
	 * - **PinEnd** — pin the trailing `Status` column to the end edge.
	 * - **PinBothEdges** — pin both edges at once. `startKeys`/`endKeys` each
	 *   define a contiguous run from their edge inward; columns get cumulative
	 *   offsets so multiple pinned columns stack correctly.
	 * - **WithColumnResize** — sticky columns composed with column resize.
	 *   Resizing a pinned column keeps it pinned; the plugin order (sticky after
	 *   resize) ensures the sticky inline offset wins over the resize handle's
	 *   inline width.
	 * - **NoOpEmptyConfig** — empty config is a valid no-op: nothing is pinned,
	 *   every cell passes through untouched. Lets callers compute keys
	 *   conditionally without branching on whether to install the plugin.
	 *
	 * Three translations:
	 *
	 * - **Both hooks take a getter** — `useTableStickyColumns<Employee>(() => ({…}))`
	 *   where upstream passes the config object itself. Upstream's explicit
	 *   `<Employee>` is kept for the reason it exists there:
	 *   `UseTableStickyColumnsConfig` never mentions the row type, so `T` has no
	 *   inference site.
	 * - **Each story's plugin needs its own name.** Storybook renders every story
	 *   as its own component, so upstream can call all four of them `sticky`; here
	 *   they share one scope. The hook is still called once per story — it mints
	 *   an attachment key per call for the scroll-shadow listener, so the calls
	 *   cannot be shared even where the config is identical.
	 * - **`useState` plus its functional updater becomes `$state`.**
	 *   `WithColumnResize`'s `setColumnWidths(prev => ({...prev, ...updates}))` is
	 *   `columnWidths = { ...columnWidths, ...updates }`. `useMemo`/`useCallback`
	 *   have no counterpart at all: the hooks are already stable.
	 *
	 * One prose adaptation. `NoOpEmptyConfig`'s note spells the call itself out,
	 * and that call is the one thing this port changes — it reads
	 * `useTableStickyColumns(() => ({}))`, the form that compiles here. Every
	 * other `<code>` in the notes is config shape, which is unchanged.
	 */

	// =============================================================================
	// Sample Data — wide enough to require horizontal scroll
	// =============================================================================

	interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		team: string;
		role: string;
		location: string;
		startDate: string;
		manager: string;
		status: string;
	}

	const employees: Employee[] = [
		{
			id: '1',
			name: 'Alice Nguyen',
			email: 'alice@example.com',
			team: 'Design Systems',
			role: 'Staff Engineer',
			location: 'San Francisco',
			startDate: '2019-03-12',
			manager: 'Priya Patel',
			status: 'Active'
		},
		{
			id: '2',
			name: 'Bob Martinez',
			email: 'bob@example.com',
			team: 'Design Systems',
			role: 'Senior Designer',
			location: 'New York',
			startDate: '2020-07-01',
			manager: 'Priya Patel',
			status: 'Active'
		},
		{
			id: '3',
			name: 'Charlie Okafor',
			email: 'charlie@example.com',
			team: 'Platform',
			role: 'Engineering Manager',
			location: 'London',
			startDate: '2017-11-20',
			manager: 'Sam Lee',
			status: 'On leave'
		},
		{
			id: '4',
			name: 'Diana Rossi',
			email: 'diana@example.com',
			team: 'Platform',
			role: 'Staff Engineer',
			location: 'Remote',
			startDate: '2021-01-15',
			manager: 'Sam Lee',
			status: 'Active'
		},
		{
			id: '5',
			name: 'Ehsan Karimi',
			email: 'ehsan@example.com',
			team: 'Growth',
			role: 'Product Engineer',
			location: 'Berlin',
			startDate: '2022-05-30',
			manager: 'Mei Chen',
			status: 'Active'
		}
	];

	// Wide columns so the table overflows its container and scrolls horizontally.
	const columns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', width: pixel(180) },
		{ key: 'email', header: 'Email', width: pixel(220) },
		{ key: 'team', header: 'Team', width: pixel(180) },
		{ key: 'role', header: 'Role', width: pixel(200) },
		{ key: 'location', header: 'Location', width: pixel(160) },
		{ key: 'startDate', header: 'Start date', width: pixel(140) },
		{ key: 'manager', header: 'Manager', width: pixel(180) },
		{ key: 'status', header: 'Status', width: pixel(140) }
	];

	// =============================================================================
	// Stories
	// =============================================================================

	const note = 'margin-bottom: 8px; font-size: 14px; color: #666';

	const pinStartSticky = useTableStickyColumns<Employee>(() => ({ startKeys: ['name'] }));

	const pinEndSticky = useTableStickyColumns<Employee>(() => ({ endKeys: ['status'] }));

	const pinBothEdgesSticky = useTableStickyColumns<Employee>(() => ({
		startKeys: ['name', 'email'],
		endKeys: ['status']
	}));

	let columnWidths = $state<Record<string, number>>({});
	const withColumnResizeResize = useTableColumnResize<Employee>(() => ({
		columnWidths,
		columns: columns as TableColumn<Record<string, unknown>>[],
		onColumnResizeEnd: (updates) => (columnWidths = { ...columnWidths, ...updates })
	}));
	const withColumnResizeSticky = useTableStickyColumns<Employee>(() => ({ startKeys: ['name'] }));

	const noOpEmptyConfigSticky = useTableStickyColumns<Employee>(() => ({}));
</script>

<h3>Pin start</h3>
<div style="max-width: 720px">
	<p style={note}>
		<code>startKeys: ['name']</code> — scroll right to see the Name column stay pinned with a drop shadow.
	</p>
	<Table data={employees} {columns} idKey="id" plugins={{ stickyColumns: pinStartSticky }} />
</div>

<h3>Pin end</h3>
<div style="max-width: 720px">
	<p style={note}>
		<code>endKeys: ['status']</code> — the Status column stays pinned to the right edge while the rest
		scrolls.
	</p>
	<Table data={employees} {columns} idKey="id" plugins={{ stickyColumns: pinEndSticky }} />
</div>

<h3>Pin both edges</h3>
<div style="max-width: 720px">
	<p style={note}>
		<code>startKeys: ['name', 'email']</code> + <code>endKeys: ['status']</code> — two columns pinned
		left with cumulative offsets, one pinned right.
	</p>
	<Table data={employees} {columns} idKey="id" plugins={{ stickyColumns: pinBothEdgesSticky }} />
</div>

<h3>With column resize</h3>
<div style="max-width: 720px">
	<p style={note}>
		Resize columns by dragging header edges; the pinned Name column stays sticky. Plugins compose:
		<code>&#123; columnResize, stickyColumns &#125;</code>.
	</p>
	<Table
		data={employees}
		{columns}
		idKey="id"
		plugins={{ columnResize: withColumnResizeResize, stickyColumns: withColumnResizeSticky }}
	/>
</div>

<h3>No-op empty config</h3>
<div style="max-width: 720px">
	<p style={note}>
		<code>useTableStickyColumns(() => (&#123;&#125;))</code> — no pinned columns; the table behaves as
		if the plugin weren't installed.
	</p>
	<Table data={employees} {columns} idKey="id" plugins={{ stickyColumns: noOpEmptyConfigSticky }} />
</div>
