<script lang="ts">
	import {
		Table,
		pixel,
		proportional,
		useTableRowExpansion,
		useTableRowExpansionState
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableRowExpansion.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape, because three live file trees would
	 * otherwise bury the page.
	 *
	 * **All 3 stories.** `fileTree` and `columns` are shared across the stories
	 * upstream and shared here; the expanded set is not — each story is its own
	 * React component with its own `useState`, so each gets its own `$state` set
	 * and its own pair of hooks. Upstream's per-story doc comments, verbatim:
	 *
	 * - **InheritedColumns** — "A file tree rendered as a table with expandable
	 *   folder rows. Child rows inherit the parent's columns and are indented
	 *   based on depth. Click the chevron (or right-click → "Expand/Collapse
	 *   row") to expand a folder."
	 * - **LeafNodesNotExpandable** — "Only folders are expandable (files have no
	 *   children). The chevron and context-menu action are hidden for leaf
	 *   nodes."
	 * - **ExpandOnRowClick** — "`hasRowClickExpansion: true` — clicking anywhere
	 *   on the row toggles expansion (in addition to the chevron). The row shows
	 *   a pointer cursor."
	 *
	 * Four translations:
	 *
	 * - **`useState` → `$state`.** `useState<Set<string>>(new Set(['src']))`
	 *   becomes `$state(new Set(['src']))`, and `setExpandedKeys` a
	 *   reassignment. The `Set` is a plain one: reassignment is the reactive
	 *   boundary, and the ported config's setter takes the next set rather than
	 *   upstream's updater function, because a `$state` read is never stale.
	 * - **Both hooks take a getter**, where upstream passes the config object.
	 *   Upstream's `useMemo`/`useCallback` around plugin objects have no
	 *   counterpart — the ported hooks are already stable — and the storybook
	 *   file uses none anyway.
	 * - **The `*State` hook result is held, not destructured.** Upstream writes
	 *   `const {data, expansionConfig} = useTableRowExpansionState(…)`, safe
	 *   because React returns a fresh object every render. Here the hook returns
	 *   one object for the component's lifetime and exposes `data` as a
	 *   **getter** over a `$derived`, so destructuring would snapshot the first
	 *   flattening and the tree would never expand.
	 * - **`ExpandOnRowClick`'s spread moves *inside* the getter.** Upstream
	 *   extends the derived config with `{...expansionConfig,
	 *   hasRowClickExpansion: true}` at render time; spreading at the top of
	 *   `<script>` would run `expansionConfig`'s getters once and freeze
	 *   `expandedKeys`. Spread inside `() => ({…})` it is re-evaluated on every
	 *   read, which is where the plugin reads its config from anyway.
	 */

	// =============================================================================
	// Sample Data — tree structure (file system)
	// =============================================================================

	interface FileNode extends Record<string, unknown> {
		id: string;
		name: string;
		type: 'folder' | 'file';
		size: string;
		modified: string;
		children?: FileNode[];
	}

	const fileTree: FileNode[] = [
		{
			id: 'src',
			name: 'src',
			type: 'folder',
			size: '—',
			modified: '2026-06-20',
			children: [
				{
					id: 'src/components',
					name: 'components',
					type: 'folder',
					size: '—',
					modified: '2026-06-19',
					children: [
						{
							id: 'src/components/Button.tsx',
							name: 'Button.tsx',
							type: 'file',
							size: '4.2 KB',
							modified: '2026-06-18',
							children: []
						},
						{
							id: 'src/components/Table.tsx',
							name: 'Table.tsx',
							type: 'file',
							size: '12.8 KB',
							modified: '2026-06-20',
							children: []
						},
						{
							id: 'src/components/Dialog.tsx',
							name: 'Dialog.tsx',
							type: 'file',
							size: '6.1 KB',
							modified: '2026-06-15',
							children: []
						}
					]
				},
				{
					id: 'src/utils',
					name: 'utils',
					type: 'folder',
					size: '—',
					modified: '2026-06-17',
					children: [
						{
							id: 'src/utils/format.ts',
							name: 'format.ts',
							type: 'file',
							size: '1.3 KB',
							modified: '2026-06-17',
							children: []
						},
						{
							id: 'src/utils/merge.ts',
							name: 'merge.ts',
							type: 'file',
							size: '0.8 KB',
							modified: '2026-06-10',
							children: []
						}
					]
				},
				{
					id: 'src/index.ts',
					name: 'index.ts',
					type: 'file',
					size: '0.4 KB',
					modified: '2026-06-20',
					children: []
				}
			]
		},
		{
			id: 'public',
			name: 'public',
			type: 'folder',
			size: '—',
			modified: '2026-06-01',
			children: [
				{
					id: 'public/favicon.ico',
					name: 'favicon.ico',
					type: 'file',
					size: '15 KB',
					modified: '2026-05-20',
					children: []
				}
			]
		},
		{
			id: 'package.json',
			name: 'package.json',
			type: 'file',
			size: '1.8 KB',
			modified: '2026-06-22',
			children: []
		},
		{
			id: 'tsconfig.json',
			name: 'tsconfig.json',
			type: 'file',
			size: '0.6 KB',
			modified: '2026-06-01',
			children: []
		}
	];

	const columns: TableColumn<FileNode>[] = [
		{ key: 'name', header: 'Name', width: proportional(2) },
		{ key: 'type', header: 'Type', width: pixel(80) },
		{ key: 'size', header: 'Size', width: pixel(90) },
		{ key: 'modified', header: 'Modified', width: pixel(120) }
	];

	// =============================================================================
	// Stories
	// =============================================================================

	// InheritedColumns
	let inheritedKeys = $state(new Set(['src']));

	// The state hook flattens the tree, tracks depth, and derives the
	// expand/collapse + expand-all handlers — no boilerplate in the consumer.
	const inheritedState = useTableRowExpansionState<FileNode>(() => ({
		baseData: fileTree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id,
		expandedKeys: inheritedKeys,
		setExpandedKeys: (next) => (inheritedKeys = next)
	}));

	const inheritedPlugin = useTableRowExpansion<FileNode>(() => inheritedState.expansionConfig);

	// LeafNodesNotExpandable
	let leafKeys = $state(new Set(['src', 'src/components']));

	// `getIsItemExpandable` restricts expandability (and expand-all) to folders.
	const leafState = useTableRowExpansionState<FileNode>(() => ({
		baseData: fileTree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id,
		getIsItemExpandable: (item) => item.type === 'folder',
		expandedKeys: leafKeys,
		setExpandedKeys: (next) => (leafKeys = next)
	}));

	const leafPlugin = useTableRowExpansion<FileNode>(() => leafState.expansionConfig);

	// ExpandOnRowClick
	let rowClickKeys = $state(new Set<string>());

	const rowClickState = useTableRowExpansionState<FileNode>(() => ({
		baseData: fileTree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id,
		expandedKeys: rowClickKeys,
		setExpandedKeys: (next) => (rowClickKeys = next)
	}));

	// Opt into row-click expansion by extending the derived config.
	const rowClickPlugin = useTableRowExpansion<FileNode>(() => ({
		...rowClickState.expansionConfig,
		hasRowClickExpansion: true
	}));
</script>

<h3>Inherited columns</h3>
<Table
	data={inheritedState.data}
	{columns}
	idKey="id"
	hasHover
	plugins={{ expansion: inheritedPlugin }}
/>

<h3>Leaf nodes not expandable</h3>
<Table data={leafState.data} {columns} idKey="id" hasHover plugins={{ expansion: leafPlugin }} />

<h3>Expand on row click</h3>
<Table
	data={rowClickState.data}
	{columns}
	idKey="id"
	hasHover
	plugins={{ expansion: rowClickPlugin }}
/>
