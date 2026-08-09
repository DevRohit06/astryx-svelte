<!--
	Ported from upstream's `templates/blocks/components/Table/TablePaginatedTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The twenty names, the five roles and the derived `users` mapping are
	upstream's, unchanged. Three translations:

	- **`useState` → `$state`** for the page number.
	- **`onPageChange: setPage` → `onPageChange: (next) => (page = next)`.** The
	  ported config takes a plain setter; React's `Dispatch<SetStateAction<number>>`
	  has no counterpart, because a `$state` read is never stale.
	- **The hook takes a getter**, where upstream passes the config object. `page`
	  and `users.length` are read *through* that getter, so the pagination chrome
	  tracks the page without the hook being re-created.

	`paginateData(users, page, pageSize)` is the same exported pure helper on both
	sides. No icon substitutions: the page controls are `Pagination`'s own.
-->
<script lang="ts">
	import {
		Section,
		Table,
		paginateData,
		proportional,
		useTablePagination,
		type TableColumn
	} from '@astryx-svelte/core';

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
	}

	const names = [
		'Alice Johnson',
		'Bob Smith',
		'Charlie Brown',
		'Diana Prince',
		'Eve Davis',
		'Frank Miller',
		'Grace Lee',
		'Hank Wilson',
		'Ivy Chen',
		'Jack Turner',
		'Karen White',
		'Leo Garcia',
		'Mia Thompson',
		'Noah Martinez',
		'Olivia Clark',
		'Paul Harris',
		'Quinn Walker',
		'Rachel Adams',
		'Sam Robinson',
		'Tina Scott'
	];

	const roles = ['Engineer', 'Designer', 'Manager', 'Admin', 'Analyst'];

	const users: User[] = names.map((name, i) => ({
		id: String(i + 1),
		name,
		email: `${name.split(' ')[0].toLowerCase()}@example.com`,
		role: roles[i % roles.length]
	}));

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: proportional(1) },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role', width: proportional(1) }
	];

	let page = $state(1);
	const pageSize = 5;

	const plugin = useTablePagination<User>(() => ({
		page,
		onPageChange: (next) => (page = next),
		totalItems: users.length,
		pageSize
	}));
</script>

<Section>
	<Table
		data={paginateData(users, page, pageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: plugin }}
	/>
</Section>
