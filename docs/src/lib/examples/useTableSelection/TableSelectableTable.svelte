<!--
	Ported from upstream's `templates/blocks/components/Table/TableSelectableTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Data and columns are upstream's, unchanged. Three translations:

	- **`useState` → `$state`.** `const [selectedKeys, setSelectedKeys] =
	  useState<Set<string>>(new Set())` becomes `let selectedKeys =
	  $state(new Set<string>())`. The `Set` is a plain one and reassignment is the
	  reactive boundary, exactly as `Toolbar/ToolbarBulkActions.svelte` does it.
	- **`setSelectedKeys` is a plain setter.** Upstream hands React's
	  `Dispatch<SetStateAction<Set<string>>>` straight to the hook; the ported
	  config takes `(next: Set<string>) => void`, because the updater form exists
	  only to guard against a batched React setter reading stale state and a
	  `$state` read never is.
	- **Both hooks take a getter**, where upstream passes the config object.

	`const {selectionConfig} = useTableSelectionState(...)` *is* destructured, as
	upstream destructures it: that member is a stable object rather than a getter
	over changing state, which is the one case the no-destructure rule does not
	cover.
-->
<script lang="ts">
	import {
		Table,
		proportional,
		useTableSelection,
		useTableSelectionState,
		type TableColumn
	} from '@astryx-svelte/core';

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
	}

	const users: User[] = [
		{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
		{ id: '2', name: 'Bob', email: 'bob@example.com', role: 'Designer' },
		{ id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'Manager' },
		{ id: '4', name: 'Diana', email: 'diana@example.com', role: 'Engineer' },
		{ id: '5', name: 'Eve', email: 'eve@example.com', role: 'Admin' }
	];

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: proportional(1) },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role', width: proportional(1) }
	];

	let selectedKeys = $state(new Set<string>());

	const { selectionConfig } = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));
	const selectionPlugin = useTableSelection<User>(() => selectionConfig);
</script>

<Table data={users} {columns} idKey="id" plugins={{ selection: selectionPlugin }} />
