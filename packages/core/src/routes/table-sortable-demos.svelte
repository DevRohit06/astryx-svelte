<script lang="ts">
	import {
		Table,
		useTableSelection,
		useTableSelectionState,
		useTableSortable,
		useTableSortableState
	} from '$lib/index.js';
	import type { TableColumn, TableSortState } from '$lib/index.js';

	/**
	 * Upstream's `TableSortable.stories.tsx`, as a sibling route component — the
	 * `table-demos.svelte` shape, because six tables and their captions would
	 * otherwise bury the page.
	 *
	 * **All 6 stories**, in upstream's order. Data, columns, captions and the
	 * control buttons are upstream's, unchanged — including `Employee.isLocked`,
	 * which no column reads.
	 *
	 * Four translations recur, and they are the ones the batch-13 hooks were
	 * designed around:
	 *
	 * - **Every hook takes a getter.** `useTableSortableState(() => config)` and
	 *   `useTableSortable(() => sortState.sortConfig)`, where upstream passes the
	 *   config object itself.
	 * - **The `*State` results are held, not destructured.** Upstream writes
	 *   `const {sortedData, sort, sortConfig} = useTableSortableState(...)`, which
	 *   is safe because React returns a fresh object every render. Here the hook
	 *   returns one object for the component's lifetime whose members are
	 *   *getters*, so destructuring would snapshot the first sort and the table
	 *   would never re-sort. `useTableSelectionState`'s `selectionConfig` *is*
	 *   destructured, as upstream destructures it: that member is a stable object
	 *   rather than a getter over changing state, the one case the rule misses.
	 * - **`useState` → `$state`, `setX(v)` → `x = v`.** `WithSelection`'s
	 *   `selectedKeys` and `Controlled`'s `sort` are plain `$state`, and
	 *   reassignment is the reactive boundary. The `Set` stays a plain one,
	 *   because that is what upstream's published config type declares.
	 * - **The hooks are hoisted out of `render` into the shared `<script>`** and
	 *   given story-prefixed names. Upstream declares them per story inside a
	 *   `render` function; a route component has a single instance, so the six
	 *   sets coexist.
	 *
	 * `AllowUnsortedState` passes `allowUnsortedState: true` explicitly, exactly
	 * as upstream does. That is also this port's default — the plugin reads
	 * `cfg.allowUnsortedState ?? true`, following upstream's *source*, whose own
	 * prop table says `false` and is wrong. The demo is not adjusted to the table.
	 */

	interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		age: number;
		isLocked: boolean;
	}

	const employees: Employee[] = [
		{
			id: '1',
			name: 'Alice',
			email: 'alice@example.com',
			role: 'Engineer',
			age: 32,
			isLocked: false
		},
		{
			id: '2',
			name: 'Bob',
			email: 'bob@example.com',
			role: 'Designer',
			age: 28,
			isLocked: false
		},
		{
			id: '3',
			name: 'Charlie',
			email: 'charlie@example.com',
			role: 'Manager',
			age: 45,
			isLocked: false
		},
		{
			id: '4',
			name: 'Diana',
			email: 'diana@example.com',
			role: 'Engineer',
			age: 37,
			isLocked: true
		},
		{
			id: '5',
			name: 'Eve',
			email: 'eve@example.com',
			role: 'Admin',
			age: 29,
			isLocked: false
		}
	];

	const columns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'email', header: 'Email', sortable: true },
		{ key: 'role', header: 'Role', sortable: true },
		{ key: 'age', header: 'Age', sortable: true }
	];

	// --- SingleSort -----------------------------------------------------------

	const singleSortState = useTableSortableState<Employee>(() => ({
		data: employees,
		defaultSort: [{ sortKey: 'name', direction: 'ascending' }]
	}));

	const singleSortPlugin = useTableSortable<Employee>(() => singleSortState.sortConfig);

	// --- MultiSort ------------------------------------------------------------

	const multiSortState = useTableSortableState<Employee>(() => ({
		data: employees,
		defaultSort: [{ sortKey: 'role', direction: 'ascending' }],
		isMultiSortEnabled: true
	}));

	const multiSortPlugin = useTableSortable<Employee>(() => multiSortState.sortConfig);

	// --- CustomSortKey --------------------------------------------------------

	const customColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'email', header: 'Email', sortable: { sortKey: 'emailSort' } },
		{ key: 'role', header: 'Role', sortable: true },
		{ key: 'age', header: 'Age', sortable: { sortKey: 'yearsOld' } }
	];

	const customSortState = useTableSortableState<Employee>(() => ({
		data: employees,
		defaultSort: [{ sortKey: 'yearsOld', direction: 'ascending' }],
		comparators: {
			yearsOld: (a, b) => a.age - b.age,
			emailSort: (a, b) => a.email.localeCompare(b.email)
		}
	}));

	const customSortPlugin = useTableSortable<Employee>(() => customSortState.sortConfig);

	// --- AllowUnsortedState ---------------------------------------------------

	const unsortedSortState = useTableSortableState<Employee>(() => ({
		data: employees,
		allowUnsortedState: true
	}));

	const unsortedSortPlugin = useTableSortable<Employee>(() => unsortedSortState.sortConfig);

	// --- WithSelection --------------------------------------------------------

	let selectedKeys = $state(new Set<string>());

	const selectionSortState = useTableSortableState<Employee>(() => ({
		data: employees,
		defaultSort: [{ sortKey: 'name', direction: 'ascending' }]
	}));

	const selectionSortPlugin = useTableSortable<Employee>(() => selectionSortState.sortConfig);

	const { selectionConfig } = useTableSelectionState<Employee>(() => ({
		data: selectionSortState.sortedData,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));
	const selectionPlugin = useTableSelection<Employee>(() => selectionConfig);

	// --- Controlled -----------------------------------------------------------

	let sort = $state<TableSortState>([{ sortKey: 'age', direction: 'descending' }]);

	const controlledSortState = useTableSortableState<Employee>(() => ({
		data: employees,
		sort,
		onSortChange: (next) => (sort = next)
	}));

	const controlledSortPlugin = useTableSortable<Employee>(() => controlledSortState.sortConfig);
</script>

<h3>Single sort</h3>
<div style="max-width: 700px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Click a column header to sort. Current:
		{singleSortState.sort.length > 0
			? `${singleSortState.sort[0].sortKey} ${singleSortState.sort[0].direction}`
			: 'none'}
	</p>
	<Table
		data={singleSortState.sortedData}
		{columns}
		idKey="id"
		plugins={{ sortable: singleSortPlugin }}
	/>
</div>

<h3>Multi sort</h3>
<div style="max-width: 700px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Shift+click column headers to add secondary sorts. Active sorts:
		{multiSortState.sort.map((s) => `${s.sortKey} (${s.direction})`).join(', ') || 'none'}
	</p>
	<Table
		data={multiSortState.sortedData}
		{columns}
		idKey="id"
		plugins={{ sortable: multiSortPlugin }}
	/>
</div>

<h3>Custom sort key</h3>
<div style="max-width: 700px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Age column uses sortKey "yearsOld", Email uses "emailSort". Current:
		{customSortState.sort.length > 0
			? `${customSortState.sort[0].sortKey} ${customSortState.sort[0].direction}`
			: 'none'}
	</p>
	<Table
		data={customSortState.sortedData}
		columns={customColumns}
		idKey="id"
		plugins={{ sortable: customSortPlugin }}
	/>
</div>

<h3>Allow unsorted state</h3>
<div style="max-width: 700px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Cycles: ascending → descending → unsorted. Current:
		{unsortedSortState.sort.length > 0
			? `${unsortedSortState.sort[0].sortKey} ${unsortedSortState.sort[0].direction}`
			: 'unsorted'}
	</p>
	<Table
		data={unsortedSortState.sortedData}
		{columns}
		idKey="id"
		plugins={{ sortable: unsortedSortPlugin }}
	/>
</div>

<h3>With selection</h3>
<div style="max-width: 700px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Sorting + Selection composed together. Selected: {selectedKeys.size} of
		{employees.length}. Sort:
		{selectionSortState.sort.length > 0
			? `${selectionSortState.sort[0].sortKey} ${selectionSortState.sort[0].direction}`
			: 'none'}
	</p>
	<Table
		data={selectionSortState.sortedData}
		{columns}
		idKey="id"
		plugins={{ sortable: selectionSortPlugin, selection: selectionPlugin }}
	/>
</div>

<h3>Controlled</h3>
<div style="max-width: 700px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Controlled mode — external state. Current:
		{sort.length > 0 ? `${sort[0].sortKey} ${sort[0].direction}` : 'none'}
	</p>
	<div style="display: flex; gap: 8px; margin-bottom: 8px">
		<button onclick={() => (sort = [{ sortKey: 'name', direction: 'ascending' }])}>
			Sort by Name ↑
		</button>
		<button onclick={() => (sort = [{ sortKey: 'age', direction: 'descending' }])}>
			Sort by Age ↓
		</button>
		<button onclick={() => (sort = [])}>Clear Sort</button>
	</div>
	<Table
		data={controlledSortState.sortedData}
		{columns}
		idKey="id"
		plugins={{ sortable: controlledSortPlugin }}
	/>
</div>
