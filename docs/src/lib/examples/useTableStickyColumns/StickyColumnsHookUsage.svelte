<!--
	Ported from upstream's `templates/blocks/components/Table/StickyColumnsHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Data, columns, the pinned keys and both of upstream's own explanatory comments
	are unchanged. The block holds no state, so there are only two translations:

	- **The hook takes a getter.** `useTableStickyColumns<Employee>(() => ({…}))`,
	  where upstream passes the config object itself. The explicit **`<Employee>`**
	  is upstream's, not an adjustment: `UseTableStickyColumnsConfig` never mentions
	  the row type, so `T` has no inference site, and upstream names it for the same
	  reason this port needs it.
	- **The wrapper's style is a string, not a React style object.**
	  `{width: 560, maxWidth: '100%'}` becomes `width: 560px; max-width: 100%` —
	  including the unit React would have appended to the bare `560`.

	No icon substitutions: the edge shadows are the plugin's own chrome.
-->
<script lang="ts">
	import { Table, pixel, useTableStickyColumns } from '@astryx-svelte/core';

	interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		team: string;
		role: string;
		location: string;
		startDate: string;
		status: string;
	}

	const employees: Employee[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			team: 'Design Systems',
			role: 'Staff Engineer',
			location: 'San Francisco',
			startDate: '2019-03-12',
			status: 'Active'
		},
		{
			id: '2',
			name: 'Bob Smith',
			email: 'bob@example.com',
			team: 'Design Systems',
			role: 'Senior Designer',
			location: 'New York',
			startDate: '2020-07-01',
			status: 'Active'
		},
		{
			id: '3',
			name: 'Charlie Brown',
			email: 'charlie@example.com',
			team: 'Platform',
			role: 'Engineering Manager',
			location: 'London',
			startDate: '2017-11-20',
			status: 'On leave'
		},
		{
			id: '4',
			name: 'Diana Prince',
			email: 'diana@example.com',
			team: 'Platform',
			role: 'Staff Engineer',
			location: 'Remote',
			startDate: '2021-01-15',
			status: 'Active'
		},
		{
			id: '5',
			name: 'Eve Davis',
			email: 'eve@example.com',
			team: 'Growth',
			role: 'Product Engineer',
			location: 'Berlin',
			startDate: '2022-05-30',
			status: 'Active'
		}
	];

	// Wide fixed-width columns so the table overflows and scrolls horizontally,
	// keeping the pinned Name (start) and Status (end) columns in view.
	const columns = [
		{ key: 'name', header: 'Name', width: pixel(180) },
		{ key: 'email', header: 'Email', width: pixel(220) },
		{ key: 'team', header: 'Team', width: pixel(180) },
		{ key: 'role', header: 'Role', width: pixel(200) },
		{ key: 'location', header: 'Location', width: pixel(160) },
		{ key: 'startDate', header: 'Start date', width: pixel(140) },
		{ key: 'status', header: 'Status', width: pixel(140) }
	];

	const stickyColumns = useTableStickyColumns<Employee>(() => ({
		startKeys: ['name'],
		endKeys: ['status']
	}));
</script>

<!--
	Constrain the width so the Table's own horizontal scroll container is
	narrower than its columns — that scroll container is what sticky columns
	pin against. Without a width cap the table renders full-width and never
	scrolls internally, so nothing sticks.
-->
<div style="width: 560px; max-width: 100%">
	<Table data={employees} {columns} idKey="id" hasHover plugins={{ stickyColumns }} />
</div>
