<!--
	Ported from upstream's `templates/blocks/components/Table/TableFilterableTable.tsx`
	(the block targets `Table`, `useTableFiltering` and `useTableFilterState` via
	`alsoExampleFor`, and `hasSvelte` is per registry target, so it is filed under
	each of the three).
	Transcribed, not re-authored: the parity rule covers example content too.

	**This block was pending from batch 13 to batch 14**, and the reason is worth
	keeping: batch 13 ported the filtering *plugin*, but this block opens with
	`usePowerSearchConfig(fieldDefs)` and uses both halves of the result —
	`config` is the plugin's required `searchConfig`, `applyFilters` is what
	actually removes rows. Those live in `PowerSearch`, outside the plugin.
	Transcribing the operator tables and the match engine by hand to fill the gap
	would have been re-authoring an unported subsystem, and shipping the UI with
	`applyFilters` dropped would have been filtering that silently does nothing —
	worse than the block's absence. It landed with PowerSearch instead.

	Data, field definitions, columns and widths are upstream's, unchanged. Two
	translations, both the shape every ported hook takes:

	- **`usePowerSearchConfig` takes a getter and returns getters**, so the result
	  is held as `search` rather than destructured. Upstream's
	  `const {config, applyFilters} = …` would snapshot both here and stop
	  tracking — the `useThemeHookUsage` hazard.
	- **`useTableFiltering` takes a getter** over its whole config, and `data`
	  becomes a `$derived` so the table follows the filter state.
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
			name: 'Alice',
			email: 'alice@example.com',
			role: 'Engineer',
			department: 'Platform'
		},
		{
			id: '2',
			name: 'Bob',
			email: 'bob@example.com',
			role: 'Designer',
			department: 'Product'
		},
		{
			id: '3',
			name: 'Charlie',
			email: 'charlie@example.com',
			role: 'Manager',
			department: 'Platform'
		},
		{
			id: '4',
			name: 'Diana',
			email: 'diana@example.com',
			role: 'Engineer',
			department: 'Infrastructure'
		},
		{
			id: '5',
			name: 'Eve',
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
		searchConfig: search.config
	}));

	const data = $derived(
		search.applyFilters(
			toSearchFilters(filterState.filters, columns, search.config) as PowerSearchFilter[],
			employees
		)
	);
</script>

<Table {data} {columns} idKey="id" plugins={{ filter: filterPlugin }} />
