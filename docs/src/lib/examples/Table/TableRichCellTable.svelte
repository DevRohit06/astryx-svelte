<!--
	Ported from upstream's `templates/blocks/components/Table/TableRichCellTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	One shape change the Svelte port forces. `TableColumn.renderCell` is a
	`Snippet<[T]>` where upstream's is `(item) => ReactNode`, and a template
	snippet does not exist yet while the `<script>` runs — so a plain
	`const columns = [...]` referencing one would hit its temporal dead zone.
	`$derived.by` defers the array to first read, which is inside the render,
	by which time the snippets are live. Same data, same columns, same order.
-->
<script lang="ts">
	import { Badge, Link, Table, proportional, pixel, type TableColumn } from '@astryx-svelte/core';

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

	const roleVariant: Record<string, 'blue' | 'purple' | 'green'> = {
		Engineer: 'blue',
		Designer: 'purple',
		PM: 'green'
	};

	const columns = $derived.by<TableColumn<User>[]>(() => [
		{ key: 'name', header: 'Name' },
		{
			key: 'email',
			header: 'Email',
			width: proportional(2),
			renderCell: emailCell
		},
		{
			key: 'role',
			header: 'Role',
			renderCell: roleCell
		},
		{ key: 'age', header: 'Age', width: pixel(80) }
	]);
</script>

{#snippet emailCell(item: User)}
	<Link href={`mailto:${item.email}`}>{item.email}</Link>
{/snippet}

{#snippet roleCell(item: User)}
	<Badge label={item.role} variant={roleVariant[item.role] ?? 'neutral'} />
{/snippet}

<Table data={users} {columns} idKey="id" hasHover />
