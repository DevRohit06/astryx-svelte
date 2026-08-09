<script lang="ts">
	import {
		Table,
		pixel,
		useTableColumnResize,
		useTableSelection,
		useTableSelectionState
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableColumnResize.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape, because six tables that each own a
	 * controlled width record would otherwise bury the page.
	 *
	 * **All 6 stories**, in upstream's order. Data, columns, widths and the
	 * per-story prose transcribe verbatim — including `isLocked`, which the row
	 * type carries and no column reads, because upstream's `users` carries it.
	 * No story declares a `renderCell`, so no column array needs `$derived.by`
	 * here; every one is a plain `const`.
	 *
	 * Upstream declares `columnWidths` and `resizePlugin` once per `render`, where
	 * six `render` functions shadow the same two names. One module cannot, so each
	 * story's pair is prefixed with its story — the only renaming in the file.
	 *
	 * The translations, all of them settled elsewhere in this port:
	 *
	 * - **`useState` → `$state`, and the updater form is gone.** Upstream writes
	 *   `setColumnWidths(prev => ({...prev, ...updates}))`; here the same merge is
	 *   the plain assignment `widths = { ...widths, ...updates }`, because a
	 *   `$state` read is never stale. The record is **controlled** either way: the
	 *   consumer owns it and folds `onColumnResizeEnd`'s updates in, which is what
	 *   `PersistingWidths` exists to show.
	 * - **Both hooks take a getter**, where upstream passes the config object.
	 * - **The explicit `<User>`** on `useTableColumnResize`.
	 *   `UseTableColumnResizeConfig` never mentions the row type, so `T` has no
	 *   inference site and falls back to its constraint `Record<string, unknown>`;
	 *   `TablePlugin<T>` is contravariant in `T`, so the resulting
	 *   `TablePlugin<Record<string, unknown>>` would not satisfy `Table`'s
	 *   `Record<string, TablePlugin<User>>`. Upstream omits the argument and
	 *   relies on TSX inference resolving `Table`'s own `T` to the wider
	 *   candidate. Naming it is the same plugin, pinned.
	 * - **`const { selectionConfig } = useTableSelectionState(...)` *is*
	 *   destructured**, as upstream destructures it: that member is a stable
	 *   object rather than a getter over changing state, which is the one case the
	 *   no-destructure rule does not cover.
	 *
	 * Upstream's `columns as TableColumn<Record<string, unknown>>[]` cast at every
	 * config site transcribes unchanged. The same annotated array reaches `Table`
	 * (wanting `TableColumn<User>[]`) and the resize config (wanting the erased
	 * form), and `TableColumn<T>` is contravariant in `T` through
	 * `renderCell: Snippet<[T]>`, so one annotation cannot satisfy both.
	 *
	 * The two repeated inline styles — upstream's `{maxWidth: 600}` wrapper and
	 * its grey caption — are hoisted to consts, as `table-demos.svelte` hoists
	 * `pageWrapper`/`storyWrapper`. Same declarations, written once.
	 */

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		isLocked: boolean;
	}

	const users: User[] = [
		{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Engineer', isLocked: false },
		{ id: '2', name: 'Bob', email: 'bob@example.com', role: 'Designer', isLocked: false },
		{ id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'Manager', isLocked: false },
		{ id: '4', name: 'Diana', email: 'diana@example.com', role: 'Engineer', isLocked: true },
		{ id: '5', name: 'Eve', email: 'eve@example.com', role: 'Admin', isLocked: false }
	];

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email' },
		{ key: 'role', header: 'Role' }
	];

	// ─── Default ──────────────────────────────────────────────────────────────
	let defaultWidths = $state<Record<string, number>>({});

	const defaultResize = useTableColumnResize<User>(() => ({
		columnWidths: defaultWidths,
		columns: columns as TableColumn<Record<string, unknown>>[],
		onColumnResizeEnd: (updates) => {
			defaultWidths = { ...defaultWidths, ...updates };
		}
	}));

	// ─── WithMinMaxConstraints ────────────────────────────────────────────────
	let minMaxWidths = $state<Record<string, number>>({});

	const minMaxResize = useTableColumnResize<User>(() => ({
		columnWidths: minMaxWidths,
		onColumnResizeEnd: (updates) => {
			minMaxWidths = { ...minMaxWidths, ...updates };
		},
		columns: columns as TableColumn<Record<string, unknown>>[],
		minWidth: 80,
		maxWidth: 300
	}));

	// ─── PersistingWidths ─────────────────────────────────────────────────────
	let persistingWidths = $state<Record<string, number>>({});

	const persistingResize = useTableColumnResize<User>(() => ({
		columnWidths: persistingWidths,
		columns: columns as TableColumn<Record<string, unknown>>[],
		onColumnResizeEnd: (updates) => {
			persistingWidths = { ...persistingWidths, ...updates };
		}
	}));

	// Upstream computes this inline in the caption; a `$derived` is the same
	// render-time expression, just named so the markup stays one line.
	const persistingSummary = $derived(
		Object.keys(persistingWidths).length > 0
			? Object.entries(persistingWidths)
					.map(([key, width]) => `${key}: ${width}px`)
					.join(', ')
			: 'none set (resize a column to see)'
	);

	// ─── KeyboardResize ───────────────────────────────────────────────────────
	let keyboardWidths = $state<Record<string, number>>({});

	const keyboardResize = useTableColumnResize<User>(() => ({
		columnWidths: keyboardWidths,
		columns: columns as TableColumn<Record<string, unknown>>[],
		onColumnResizeEnd: (updates) => {
			keyboardWidths = { ...keyboardWidths, ...updates };
		}
	}));

	// ─── WithSelectionAndResize ───────────────────────────────────────────────
	let selectedKeys = $state(new Set<string>());
	let selectionWidths = $state<Record<string, number>>({});

	const { selectionConfig } = useTableSelectionState<User>(() => ({
		data: users,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));
	const selectionPlugin = useTableSelection<User>(() => selectionConfig);

	const selectionResize = useTableColumnResize<User>(() => ({
		columnWidths: selectionWidths,
		columns: columns as TableColumn<Record<string, unknown>>[],
		onColumnResizeEnd: (updates) => {
			selectionWidths = { ...selectionWidths, ...updates };
		}
	}));

	// ─── AllPixelColumns ──────────────────────────────────────────────────────
	const pixelColumns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: pixel(200) },
		{ key: 'email', header: 'Email', width: pixel(250) },
		{ key: 'role', header: 'Role', width: pixel(150) }
	];

	let pixelWidths = $state<Record<string, number>>({});

	const pixelResize = useTableColumnResize<User>(() => ({
		columnWidths: pixelWidths,
		columns: pixelColumns as TableColumn<Record<string, unknown>>[],
		onColumnResizeEnd: (updates) => {
			pixelWidths = { ...pixelWidths, ...updates };
		}
	}));

	const storyWrapper = 'max-width: 600px';
	const caption = 'margin-bottom: 8px; font-size: 14px; color: #666';
</script>

<h3>Default</h3>
<div style={storyWrapper}>
	<p style={caption}>
		Drag the right edge of any column header to resize. The last proportional column has no handle;
		it flexes to fill remaining space.
	</p>
	<Table data={users} {columns} idKey="id" plugins={{ columnResize: defaultResize }} />
</div>

<h3>With min/max constraints</h3>
<div style={storyWrapper}>
	<p style={caption}>Columns are constrained between 80px and 300px.</p>
	<Table data={users} {columns} idKey="id" plugins={{ columnResize: minMaxResize }} />
</div>

<h3>Persisting widths</h3>
<div style={storyWrapper}>
	<p style={caption}>Current widths: {persistingSummary}</p>
	<button onclick={() => (persistingWidths = {})} style="margin-bottom: 8px; font-size: 14px">
		Reset all widths
	</button>
	<Table data={users} {columns} idKey="id" plugins={{ columnResize: persistingResize }} />
</div>

<h3>Keyboard resize</h3>
<div style={storyWrapper}>
	<p style={caption}>
		Tab to a resize handle, press Enter to activate, use Arrow keys to resize (Shift for larger
		steps), Enter to commit, Escape to cancel.
	</p>
	<Table data={users} {columns} idKey="id" plugins={{ columnResize: keyboardResize }} />
</div>

<h3>With selection and resize</h3>
<div style={storyWrapper}>
	<p style={caption}>
		Selection and column resize plugins composed together. Selected: {selectedKeys.size} of {users.length}
	</p>
	<Table
		data={users}
		{columns}
		idKey="id"
		plugins={{ selection: selectionPlugin, columnResize: selectionResize }}
	/>
</div>

<h3>All pixel columns</h3>
<div style={storyWrapper}>
	<p style={caption}>
		All columns are pixel-width. Every column gets a resize handle, including the last one. Min
		width defaults to the column's declared pixel value.
	</p>
	<Table data={users} columns={pixelColumns} idKey="id" plugins={{ columnResize: pixelResize }} />
</div>
