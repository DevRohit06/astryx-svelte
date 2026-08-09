<script lang="ts">
	import {
		Button,
		MultiSelector,
		Table,
		Text,
		Toolbar,
		useTableColumnSettings,
		useTableColumnSettingsState,
		useTableSelection,
		useTableSelectionState
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableColumnSettings.stories.tsx`, as a sibling route
	 * component — the `table-demos.svelte` shape, because four toolbars and four
	 * tables would otherwise bury the page.
	 *
	 * **All 4 stories**, in upstream's order.
	 *
	 * Storybook gives each story its own component, so upstream's four `render`
	 * functions each declare their own `useState`, `state`, `plugin` and
	 * `selectorOptions`. Here they share one `<script>`, so every story-local
	 * binding carries its story's prefix (`basicActiveKeys`, `disabledSettings`,
	 * `resetDefaultKeys`, …). `selectorOptions` is the one exception: all four
	 * stories evaluate the identical expression over the shared `columnOptions`,
	 * so it is declared once rather than four times.
	 *
	 * The translations:
	 *
	 * - **`useState` → `$state`.** `setActiveKeys([...keys])` becomes
	 *   `activeKeys = [...keys]`, and `useState<Set<string>>(new Set())` becomes
	 *   `$state(new Set<string>())` — a plain `Set`, with reassignment as the
	 *   reactive boundary, exactly as the `TableSelectableTable` block does it.
	 * - **Every hook takes a getter**, where upstream passes the config object.
	 *   Upstream's `useMemo`/`useCallback` wrappers around plugin objects have no
	 *   counterpart and are gone: the getter is what keeps a plugin's identity
	 *   stable while it still reads current config.
	 * - **`useTableColumnSettingsState`'s result is held, not destructured.**
	 *   `columnSettingsConfig` and `activeColumnKeys` are **getters** on a single
	 *   object that lives for the component's lifetime; reading them off a
	 *   destructured binding would snapshot the first value and the column picker
	 *   would stop tracking. `setActiveColumnKeys` and `resetToDefault` are stable
	 *   functions and are passed by reference, as upstream passes them.
	 *   `useTableSelectionState`'s `{selectionConfig}` *is* destructured, as
	 *   upstream destructures it — that member is a stable object rather than a
	 *   getter over changing state, the one case the rule does not cover.
	 * - **The held results are not named `state`.** A local called `state` shadows
	 *   the `$state` rune and puts the `$state(...)` calls above into their own
	 *   TDZ; svelte-check then reports it as "Block-scoped variable '$state' used
	 *   before its declaration", pointing at the rune rather than at the name that
	 *   broke it.
	 * - **`setSelectedKeys` is a plain setter**, not React's
	 *   `Dispatch<SetStateAction<Set<string>>>`: the updater form guards against a
	 *   batched React setter reading stale state, and a `$state` read never is.
	 * - **`Toolbar`'s `startContent`/`endContent` are `{#snippet}`s**, where
	 *   upstream passes JSX elements to props of the same names. `ResetToDefault`
	 *   passes a `<>…</>` fragment to `endContent`; a snippet body takes both
	 *   children directly, so the fragment drops out.
	 * - **`Button`'s `onClick` is `onclick`** — this port keeps Svelte's native
	 *   event attribute names.
	 * - **`style={{maxWidth: 700}}` is `style="max-width: 700px"`.**
	 */

	// =========================================================================
	// Sample Data
	// =========================================================================

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
			name: 'Alice',
			email: 'alice@example.com',
			role: 'Engineer',
			department: 'Platform',
			status: 'Active'
		},
		{
			id: '2',
			name: 'Bob',
			email: 'bob@example.com',
			role: 'Designer',
			department: 'Product',
			status: 'Active'
		},
		{
			id: '3',
			name: 'Charlie',
			email: 'charlie@example.com',
			role: 'Manager',
			department: 'Platform',
			status: 'Away'
		},
		{
			id: '4',
			name: 'Diana',
			email: 'diana@example.com',
			role: 'Engineer',
			department: 'Infrastructure',
			status: 'Active'
		},
		{
			id: '5',
			name: 'Eve',
			email: 'eve@example.com',
			role: 'Admin',
			department: 'Operations',
			status: 'Inactive'
		}
	];

	const allColumns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email' },
		{ key: 'role', header: 'Role' },
		{ key: 'department', header: 'Department' },
		{ key: 'status', header: 'Status' }
	];

	type UserColumnKey = 'name' | 'email' | 'role' | 'department' | 'status';

	const columnOptions = [
		{ key: 'name' as UserColumnKey, label: 'Name', isAlwaysVisible: true },
		{ key: 'email' as UserColumnKey, label: 'Email' },
		{ key: 'role' as UserColumnKey, label: 'Role' },
		{ key: 'department' as UserColumnKey, label: 'Department' },
		{ key: 'status' as UserColumnKey, label: 'Status' }
	];

	const defaultActiveKeys: UserColumnKey[] = ['name', 'email', 'role', 'department', 'status'];

	// Identical in all four stories; see the header note.
	const selectorOptions = columnOptions.map((c) => ({
		value: c.key,
		label: c.label,
		disabled: c.isAlwaysVisible === true
	}));

	// =========================================================================
	// BasicColumnToggle
	// =========================================================================

	let basicActiveKeys = $state<UserColumnKey[]>(defaultActiveKeys);

	const basicSettings = useTableColumnSettingsState<UserColumnKey>(() => ({
		columns: columnOptions,
		activeColumnKeys: basicActiveKeys,
		onChangeActiveColumnKeys: (keys) => (basicActiveKeys = [...keys])
	}));
	const basicPlugin = useTableColumnSettings<User, UserColumnKey>(
		() => basicSettings.columnSettingsConfig
	);

	// =========================================================================
	// DisabledColumns
	// =========================================================================

	let disabledActiveKeys = $state<UserColumnKey[]>(['name', 'email', 'role']);

	const disabledSettings = useTableColumnSettingsState<UserColumnKey>(() => ({
		columns: columnOptions,
		activeColumnKeys: disabledActiveKeys,
		onChangeActiveColumnKeys: (keys) => (disabledActiveKeys = [...keys])
	}));
	const disabledPlugin = useTableColumnSettings<User, UserColumnKey>(
		() => disabledSettings.columnSettingsConfig
	);

	// =========================================================================
	// ResetToDefault
	// =========================================================================

	const resetDefaultKeys: UserColumnKey[] = ['name', 'email', 'role'];

	let resetActiveKeys = $state<UserColumnKey[]>(resetDefaultKeys);

	const resetSettings = useTableColumnSettingsState<UserColumnKey>(() => ({
		columns: columnOptions,
		activeColumnKeys: resetActiveKeys,
		onChangeActiveColumnKeys: (keys) => (resetActiveKeys = [...keys]),
		defaultColumnKeys: resetDefaultKeys
	}));
	const resetPlugin = useTableColumnSettings<User, UserColumnKey>(
		() => resetSettings.columnSettingsConfig
	);

	// =========================================================================
	// WithSelection
	// =========================================================================

	let selectionActiveKeys = $state<UserColumnKey[]>(defaultActiveKeys);
	let selectedKeys = $state(new Set<string>());

	const selectionSettings = useTableColumnSettingsState<UserColumnKey>(() => ({
		columns: columnOptions,
		activeColumnKeys: selectionActiveKeys,
		onChangeActiveColumnKeys: (keys) => (selectionActiveKeys = [...keys])
	}));
	const selectionColumnPlugin = useTableColumnSettings<User, UserColumnKey>(
		() => selectionSettings.columnSettingsConfig
	);

	const { selectionConfig } = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));
	const selectionPlugin = useTableSelection<User>(() => selectionConfig);
</script>

<h3>Basic column toggle</h3>
<div style="max-width: 700px">
	<Toolbar label="Table actions">
		{#snippet startContent()}
			<Text type="label">Users</Text>
		{/snippet}
		{#snippet endContent()}
			<MultiSelector
				label="Columns"
				isLabelHidden
				options={selectorOptions}
				value={[...basicSettings.activeColumnKeys]}
				onChange={basicSettings.setActiveColumnKeys}
			/>
		{/snippet}
	</Toolbar>
	<Table data={users} columns={allColumns} idKey="id" plugins={{ columnSettings: basicPlugin }} />
</div>

<h3>Disabled columns</h3>
<div style="max-width: 700px">
	<Text type="supporting">"Name" is always visible and cannot be unchecked.</Text>
	<Toolbar label="Table actions">
		{#snippet startContent()}
			<Text type="label">Users</Text>
		{/snippet}
		{#snippet endContent()}
			<MultiSelector
				label="Columns"
				isLabelHidden
				options={selectorOptions}
				value={[...disabledSettings.activeColumnKeys]}
				onChange={disabledSettings.setActiveColumnKeys}
			/>
		{/snippet}
	</Toolbar>
	<Table
		data={users}
		columns={allColumns}
		idKey="id"
		plugins={{ columnSettings: disabledPlugin }}
	/>
</div>

<h3>Reset to default</h3>
<div style="max-width: 700px">
	<Text type="supporting">
		Toggle columns, then reset to restore the default set (Name, Email, Role).
	</Text>
	<Toolbar label="Table actions">
		{#snippet startContent()}
			<Text type="label">Users</Text>
		{/snippet}
		{#snippet endContent()}
			<Button label="Reset to default" variant="secondary" onclick={resetSettings.resetToDefault} />
			<MultiSelector
				label="Columns"
				isLabelHidden
				options={selectorOptions}
				value={[...resetSettings.activeColumnKeys]}
				onChange={resetSettings.setActiveColumnKeys}
			/>
		{/snippet}
	</Toolbar>
	<Table data={users} columns={allColumns} idKey="id" plugins={{ columnSettings: resetPlugin }} />
</div>

<h3>With selection</h3>
<div style="max-width: 700px">
	<Toolbar label="Table actions">
		{#snippet startContent()}
			<Text type="supporting">{selectedKeys.size} of {users.length} selected</Text>
		{/snippet}
		{#snippet endContent()}
			<MultiSelector
				label="Columns"
				isLabelHidden
				options={selectorOptions}
				value={[...selectionSettings.activeColumnKeys]}
				onChange={selectionSettings.setActiveColumnKeys}
			/>
		{/snippet}
	</Toolbar>
	<Table
		data={users}
		columns={allColumns}
		idKey="id"
		plugins={{ columnSettings: selectionColumnPlugin, selection: selectionPlugin }}
	/>
</div>
