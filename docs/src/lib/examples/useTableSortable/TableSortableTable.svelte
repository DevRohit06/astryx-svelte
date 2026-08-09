<!--
	Ported from upstream's `templates/blocks/components/Table/TableSortableTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Data, columns and the default sort are upstream's, unchanged. Two
	translations, both of them the shape every ported hook in batch 13 takes:

	- **The hooks take a getter.** `useTableSortableState(() => config)` and
	  `useTableSortable(() => sortState.sortConfig)`, where upstream passes the
	  config object itself.
	- **The state result is *not* destructured.** Upstream writes
	  `const {sortedData, sortConfig} = useTableSortableState(...)`, which is safe
	  because React returns a fresh object every render. Here the hook returns one
	  object for the component's lifetime and exposes `sortedData` / `sortConfig`
	  as **getters**, so destructuring would snapshot the first sort and the table
	  would never re-sort. The result is held as `sortState` and read through.

	No icon substitutions: the sort indicators are the plugin's own.
-->
<script lang="ts">
	import {
		Table,
		pixel,
		proportional,
		useTableSortable,
		useTableSortableState,
		type TableColumn
	} from '@astryx-svelte/core';

	interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		age: number;
	}

	const employees: Employee[] = [
		{
			id: '1',
			name: 'Alice',
			email: 'alice@example.com',
			role: 'Engineer',
			age: 32
		},
		{ id: '2', name: 'Bob', email: 'bob@example.com', role: 'Designer', age: 28 },
		{
			id: '3',
			name: 'Charlie',
			email: 'charlie@example.com',
			role: 'Manager',
			age: 45
		},
		{
			id: '4',
			name: 'Diana',
			email: 'diana@example.com',
			role: 'Engineer',
			age: 37
		},
		{ id: '5', name: 'Eve', email: 'eve@example.com', role: 'Admin', age: 29 }
	];

	const columns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', width: proportional(1), sortable: true },
		{ key: 'email', header: 'Email', width: proportional(2), sortable: true },
		{ key: 'role', header: 'Role', width: proportional(1), sortable: true },
		{ key: 'age', header: 'Age', width: pixel(80), sortable: true }
	];

	// Held, not destructured — see the header comment.
	const sortState = useTableSortableState<Employee>(() => ({
		data: employees,
		defaultSort: [{ sortKey: 'name', direction: 'ascending' }]
	}));

	const sortablePlugin = useTableSortable<Employee>(() => sortState.sortConfig);
</script>

<Table data={sortState.sortedData} {columns} idKey="id" plugins={{ sortable: sortablePlugin }} />
