<!--
	Ported from upstream's `templates/blocks/components/Table/TableStripedTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Table, proportional, pixel, type TableColumn } from '@astryx-svelte/core';

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		age: number;
	}

	const users: User[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Engineer',
			age: 30
		},
		{
			id: '2',
			name: 'Bob Smith',
			email: 'bob@example.com',
			role: 'Designer',
			age: 25
		},
		{
			id: '3',
			name: 'Charlie Brown',
			email: 'charlie@example.com',
			role: 'PM',
			age: 35
		},
		{
			id: '4',
			name: 'Diana Prince',
			email: 'diana@example.com',
			role: 'Engineer',
			age: 28
		},
		{
			id: '5',
			name: 'Eve Davis',
			email: 'eve@example.com',
			role: 'Designer',
			age: 32
		}
	];

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role' },
		{ key: 'age', header: 'Age', width: pixel(80) }
	];
</script>

<Table data={users} {columns} idKey="id" isStriped hasHover />
