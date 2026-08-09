<!--
	Ported from upstream's `templates/blocks/components/Table/TableColumnSettingsTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Data, columns, column options and the `MultiSelector` chrome are upstream's,
	unchanged. Four translations:

	- **`useState` → `$state`** for the active key list.
	- **Both hooks take a getter**, where upstream passes the config object.
	- **The state result is *not* destructured, and `activeColumnKeys` is read
	  through it.** `useTableColumnSettingsState` returns one object for the
	  component's lifetime whose `columnSettingsConfig` and `activeColumnKeys` are
	  **getters**; reading them off a destructured binding would snapshot the first
	  value and the column picker would stop tracking. Upstream is already written
	  this way (`settingsState.activeColumnKeys`), so the shape carries over as-is.
	  `settingsState.setActiveColumnKeys` is a stable function and is passed by reference,
	  as upstream passes it.
	- **`Toolbar`'s `startContent`/`endContent` are `{#snippet}`s**, where upstream
	  passes JSX elements to props of the same names.

	No icon substitutions — this block imports no Heroicons.
-->
<script lang="ts">
	import {
		MultiSelector,
		Table,
		Text,
		Toolbar,
		VStack,
		proportional,
		useTableColumnSettings,
		useTableColumnSettingsState,
		type TableColumn
	} from '@astryx-svelte/core';

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		department: string;
		status: string;
	}

	const users: User[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Engineer',
			department: 'Platform',
			status: 'Active'
		},
		{
			id: '2',
			name: 'Bob Smith',
			email: 'bob@example.com',
			role: 'Designer',
			department: 'Product',
			status: 'Active'
		},
		{
			id: '3',
			name: 'Charlie Brown',
			email: 'charlie@example.com',
			role: 'Manager',
			department: 'Platform',
			status: 'Away'
		},
		{
			id: '4',
			name: 'Diana Prince',
			email: 'diana@example.com',
			role: 'Engineer',
			department: 'Infra',
			status: 'Active'
		},
		{
			id: '5',
			name: 'Eve Davis',
			email: 'eve@example.com',
			role: 'Admin',
			department: 'Operations',
			status: 'Inactive'
		}
	];

	const allColumns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: proportional(1) },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role', width: proportional(1) },
		{ key: 'department', header: 'Department', width: proportional(1) },
		{ key: 'status', header: 'Status', width: proportional(1) }
	];

	const columnOptions = [
		{ key: 'name' as const, label: 'Name', isAlwaysVisible: true },
		{ key: 'email' as const, label: 'Email' },
		{ key: 'role' as const, label: 'Role' },
		{ key: 'department' as const, label: 'Department' },
		{ key: 'status' as const, label: 'Status' }
	];

	const allKeys: string[] = ['name', 'email', 'role', 'department', 'status'];

	let activeKeys = $state<string[]>(allKeys);

	// Held, not destructured — see the header comment. Named `settingsState`, not
	// `state`: a local called `state` shadows the `$state` rune, which puts the
	// `$state(...)` call above into its own TDZ. svelte-check reports it as
	// "Block-scoped variable '$state' used before its declaration", which points
	// at the rune rather than at the name that broke it.
	const settingsState = useTableColumnSettingsState(() => ({
		columns: columnOptions,
		activeColumnKeys: activeKeys,
		onChangeActiveColumnKeys: (keys) => (activeKeys = [...keys])
	}));

	const plugin = useTableColumnSettings<User>(() => settingsState.columnSettingsConfig);

	const selectorOptions = columnOptions.map((c) => ({
		value: c.key,
		label: c.label,
		disabled: c.isAlwaysVisible === true
	}));
</script>

<VStack gap={3} width="100%">
	<Toolbar label="Table actions">
		{#snippet startContent()}
			<Text type="label">Team</Text>
		{/snippet}
		{#snippet endContent()}
			<MultiSelector
				label="Columns"
				isLabelHidden
				options={selectorOptions}
				value={[...settingsState.activeColumnKeys]}
				onChange={settingsState.setActiveColumnKeys}
			/>
		{/snippet}
	</Toolbar>
	<Table
		data={users}
		columns={allColumns}
		idKey="id"
		hasHover
		plugins={{ columnSettings: plugin }}
	/>
</VStack>
