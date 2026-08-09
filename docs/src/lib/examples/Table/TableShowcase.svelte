<!--
	Ported from upstream's `templates/blocks/components/Table/TableShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Table, proportional, pixel, type TableColumn } from '@astryx-svelte/core';

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
		}
	];

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: proportional(1) },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role', width: proportional(1) },
		{ key: 'age', header: 'Age', width: pixel(80) }
	];
</script>

<Card width={600}>
	<Table data={users} {columns} idKey="id" hasHover />
</Card>
