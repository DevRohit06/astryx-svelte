<script lang="ts">
	import { Table, useTableSelection, useTableSelectionState } from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableSelection.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape, because seven live selections would
	 * otherwise bury the page.
	 *
	 * **All 7 stories.** Upstream carries no per-story doc comments; the only
	 * prose in the file is the `<p>` above each table, which transcribes into
	 * the markup here. `users` and `columns` are shared across the stories
	 * upstream and shared here; the selection state is not — each story is its
	 * own React component with its own `useState`, so each gets its own
	 * `$state` set and its own pair of hooks.
	 *
	 * Four translations:
	 *
	 * - **`useState` → `$state`.** `const [selectedKeys, setSelectedKeys] =
	 *   useState<Set<string>>(new Set())` becomes `let xKeys =
	 *   $state(new Set<string>())`, and `setSelectedKeys` a reassignment. The
	 *   `Set` is a plain one: reassignment is the reactive boundary, and the
	 *   ported config's setter takes the next set rather than upstream's
	 *   updater function, because a `$state` read is never stale.
	 * - **Both hooks take a getter**, where upstream passes the config object.
	 *   Upstream's `useMemo`/`useCallback` around plugin objects have no
	 *   counterpart — the ported hooks are already stable — and the storybook
	 *   file uses none anyway.
	 * - **The `*State` hook result is held, not destructured**, and read
	 *   through (`xState.selectionConfig`), per the port's convention for
	 *   `useTable*State` results.
	 * - **Story wrappers stay inline.** Upstream's `style={{maxWidth: 600}}`
	 *   and `{{marginBottom: 8, fontSize: 14, color: '#666'}}` are storybook
	 *   scaffolding, not tokens, so they transcribe as literal CSS rather than
	 *   reaching for theme values the original never used.
	 */

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		isLocked: boolean;
	}

	const users: User[] = [
		{
			id: '1',
			name: 'Alice',
			email: 'alice@example.com',
			role: 'Engineer',
			isLocked: false
		},
		{
			id: '2',
			name: 'Bob',
			email: 'bob@example.com',
			role: 'Designer',
			isLocked: false
		},
		{
			id: '3',
			name: 'Charlie',
			email: 'charlie@example.com',
			role: 'Manager',
			isLocked: false
		},
		{
			id: '4',
			name: 'Diana',
			email: 'diana@example.com',
			role: 'Engineer',
			isLocked: true
		},
		{
			id: '5',
			name: 'Eve',
			email: 'eve@example.com',
			role: 'Admin',
			isLocked: false
		}
	];

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email' },
		{ key: 'role', header: 'Role' }
	];

	// Default
	let defaultKeys = $state(new Set<string>());

	const defaultState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: defaultKeys,
		setSelectedKeys: (next) => (defaultKeys = next)
	}));
	const defaultPlugin = useTableSelection<User>(() => defaultState.selectionConfig);

	// WithPreselection
	let preselectionKeys = $state(new Set<string>(['1', '3']));

	const preselectionState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: preselectionKeys,
		setSelectedKeys: (next) => (preselectionKeys = next)
	}));
	const preselectionPlugin = useTableSelection<User>(() => preselectionState.selectionConfig);

	// NonSelectableRows
	let nonSelectableKeys = $state(new Set<string>());

	const nonSelectableState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: nonSelectableKeys,
		setSelectedKeys: (next) => (nonSelectableKeys = next),
		getIsItemSelectable: (item) => item.role !== 'Admin'
	}));
	const nonSelectablePlugin = useTableSelection<User>(() => nonSelectableState.selectionConfig);

	// DisabledRows
	let disabledKeys = $state(new Set<string>());

	const disabledState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: disabledKeys,
		setSelectedKeys: (next) => (disabledKeys = next),
		getIsItemEnabled: (item) => !item.isLocked
	}));
	const disabledPlugin = useTableSelection<User>(() => disabledState.selectionConfig);

	// Compact
	let compactKeys = $state(new Set<string>());

	const compactState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: compactKeys,
		setSelectedKeys: (next) => (compactKeys = next)
	}));
	const compactPlugin = useTableSelection<User>(() => compactState.selectionConfig);

	// Spacious
	let spaciousKeys = $state(new Set<string>());

	const spaciousState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: spaciousKeys,
		setSelectedKeys: (next) => (spaciousKeys = next)
	}));
	const spaciousPlugin = useTableSelection<User>(() => spaciousState.selectionConfig);

	// WithStripedRows
	let stripedKeys = $state(new Set<string>());

	const stripedState = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys: stripedKeys,
		setSelectedKeys: (next) => (stripedKeys = next)
	}));
	const stripedPlugin = useTableSelection<User>(() => stripedState.selectionConfig);
</script>

<h3>Default</h3>
<div style="max-width: 600px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Selected: {defaultKeys.size} of {users.length}
	</p>
	<Table data={users} {columns} idKey="id" plugins={{ selection: defaultPlugin }} />
</div>

<h3>With preselection</h3>
<div style="max-width: 600px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Selected: {[...preselectionKeys].join(', ') || 'none'}
	</p>
	<Table data={users} {columns} idKey="id" plugins={{ selection: preselectionPlugin }} />
</div>

<h3>Non selectable rows</h3>
<div style="max-width: 600px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Admin rows have no checkbox. Selected: {nonSelectableKeys.size}
	</p>
	<Table data={users} {columns} idKey="id" plugins={{ selection: nonSelectablePlugin }} />
</div>

<h3>Disabled rows</h3>
<div style="max-width: 600px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Locked rows (Diana) have a disabled checkbox. Select-all skips them. Selected: {disabledKeys.size}
	</p>
	<Table data={users} {columns} idKey="id" plugins={{ selection: disabledPlugin }} />
</div>

<h3>Compact</h3>
<div style="max-width: 600px">
	<Table
		data={users}
		{columns}
		idKey="id"
		density="compact"
		plugins={{ selection: compactPlugin }}
	/>
</div>

<h3>Spacious</h3>
<div style="max-width: 600px">
	<Table
		data={users}
		{columns}
		idKey="id"
		density="spacious"
		hasHover
		plugins={{ selection: spaciousPlugin }}
	/>
</div>

<h3>With striped rows</h3>
<div style="max-width: 600px">
	<Table data={users} {columns} idKey="id" isStriped plugins={{ selection: stripedPlugin }} />
</div>
