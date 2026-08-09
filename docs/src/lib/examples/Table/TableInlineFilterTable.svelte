<!--
	Ported from upstream's `templates/blocks/components/Table/TableInlineFilterTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	**Pending from batch 13 to batch 14** for the same reason as
	`TableFilterableTable` — see that block's note; both needed PowerSearch's
	config builder and match engine, which live outside the filtering plugin.

	This block differs from its sibling in exactly two ways, and both are
	upstream's: the employee data uses full names and abbreviates one department
	to `Infra`, and the plugin runs `variant: 'inline'`, which puts the filter
	control under each header instead of behind a funnel popover. The data is
	*not* shared between the two blocks, because upstream does not share it — the
	component page renders each block's own source.

	Two translations, both the shape every ported hook takes: the hooks take
	getters, `usePowerSearchConfig`'s result is held rather than destructured, and
	`data` is a `$derived` so the table follows the filter state.
-->
<script lang="ts">
	import {
		Table,
		proportional,
		toSearchFilters,
		useTableFilterState,
		useTableFiltering,
		usePowerSearchConfig
	} from '@astryx-svelte/core';
	import type { PowerSearchFilter, TableColumn } from '@astryx-svelte/core';

	interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		department: string;
	}

	const employees: Employee[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Engineer',
			department: 'Platform'
		},
		{
			id: '2',
			name: 'Bob Smith',
			email: 'bob@example.com',
			role: 'Designer',
			department: 'Product'
		},
		{
			id: '3',
			name: 'Charlie Brown',
			email: 'charlie@example.com',
			role: 'Manager',
			department: 'Platform'
		},
		{
			id: '4',
			name: 'Diana Prince',
			email: 'diana@example.com',
			role: 'Engineer',
			department: 'Infra'
		},
		{
			id: '5',
			name: 'Eve Davis',
			email: 'eve@example.com',
			role: 'Admin',
			department: 'Operations'
		}
	];

	const fieldDefs = [
		{ key: 'name', type: 'string', label: 'Name' },
		{ key: 'email', type: 'string', label: 'Email' },
		{
			key: 'role',
			type: 'enum',
			label: 'Role',
			enumValues: [
				{ value: 'Engineer', label: 'Engineer' },
				{ value: 'Designer', label: 'Designer' },
				{ value: 'Manager', label: 'Manager' },
				{ value: 'Admin', label: 'Admin' }
			]
		}
	] as const;

	const columns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', width: proportional(1), filter: 'name' },
		{ key: 'email', header: 'Email', width: proportional(2), filter: 'email' },
		{ key: 'role', header: 'Role', width: proportional(1), filter: 'role' },
		{ key: 'department', header: 'Department', width: proportional(1) }
	];

	const search = usePowerSearchConfig(() => fieldDefs);
	const filterState = useTableFilterState();

	const filterPlugin = useTableFiltering<Employee>(() => ({
		filters: filterState.filters,
		onFilterChange: filterState.onFilterChange,
		searchConfig: search.config,
		variant: 'inline'
	}));

	const data = $derived(
		search.applyFilters(
			toSearchFilters(filterState.filters, columns, search.config) as PowerSearchFilter[],
			employees
		)
	);
</script>

<Table {data} {columns} idKey="id" plugins={{ filter: filterPlugin }} />
