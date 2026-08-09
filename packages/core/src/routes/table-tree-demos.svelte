<script lang="ts">
	import {
		Table,
		useTableSelection,
		useTableSelectionState,
		useTableSortable,
		useTableSortableState,
		useTableTreeData,
		useTableTreeState,
		pixel,
		proportional
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableTree.stories.tsx`, as a sibling route component — the
	 * `table-demos.svelte` shape, because seven live trees would otherwise bury
	 * the page.
	 *
	 * **All 9 stories.** The org chart, the columns and their sortable variant
	 * are module-level upstream and shared here; the tree state is not — each
	 * story is its own React component with its own hook calls, so each gets its
	 * own `useTableTreeState` / `useTableTreeData` pair.
	 *
	 * Upstream's per-story prose, which Storybook renders through `autodocs`:
	 *
	 * - **Default** — hierarchical records rendered as a table.
	 *   `useTableTreeState` flattens the nested data into the visible rows and
	 *   owns the expanded set; `useTableTreeData` draws the indent + expander in
	 *   the first column. Collapsed branches are unmounted, not hidden — the
	 *   `<tbody>` holds exactly the visible rows.
	 * - **ExpandAndCollapseAll** — `expandAll` / `collapseAll` from the state
	 *   hook, driving a deep hierarchy. Indentation is `calc(level * token)` —
	 *   there is no depth cap.
	 * - **HeaderExpandAllControl** — `hasExpandAllControl` renders a built-in
	 *   expand-all/collapse-all toggle in the tree column header, wired to the
	 *   state hook. No external buttons needed: the toggle reads the aggregate
	 *   `isAllExpanded` state (down chevron only when every expandable row is
	 *   expanded) and calls `expandAll`/`collapseAll`.
	 * - **RowClickExpansion** — `hasRowClickExpansion` lets a click anywhere on an
	 *   expandable row toggle it, in addition to the chevron. Leaf rows stay
	 *   inert, and the chevron still works on its own (it stops propagation, so a
	 *   chevron click never double-toggles).
	 * - **IndentSizes** — the `indent` token controls the step per level: `sm`
	 *   (spacing-3), `md` (spacing-4, the default), and `lg` (spacing-6).
	 * - **WithSelection** — composed with selection. The canonical plugin order
	 *   puts `tree` before `selection`, so the checkbox column lands to the left
	 *   of the indented tree column, and selection operates on the visible
	 *   (flattened) rows.
	 * - **WithSiblingSorting** — composed with sorting. `applySort` is passed as
	 *   `sortSiblings`, so each sibling group sorts independently — children
	 *   always stay directly under their parent and levels never interleave.
	 *   Sort by Group or Headcount.
	 * - **LazyLoadedChildren** — lazy loading. `isItemExpandable` shows an
	 *   expander before the children exist; `onExpandedIdsChange` triggers the
	 *   fetch, and the rows appear when the data arrives.
	 * - **FlatDataIsANoOp** — migration case: the same plugin on flat data (no
	 *   `children` anywhere) is a no-op — no expanders, no indent spacers, no
	 *   tree ARIA. Adopting the plugin before the data becomes hierarchical
	 *   changes nothing.
	 *
	 * Six translations:
	 *
	 * - **Both hooks take a getter**, where upstream passes the config object.
	 * - **`{...treeConfig, hasExpandAllControl}` spreads *inside* the getter.**
	 *   `treeConfig`'s members are getters, so spreading it once — as upstream's
	 *   call site reads — would snapshot `isAllExpanded` and the header toggle
	 *   would never relabel.
	 * - **The `*State` results are held, not destructured.** Their members are
	 *   getters, so `const {visibleData} = useTableTreeState(...)` would snapshot
	 *   the first flatten and the tree would never expand; every story reads
	 *   through the held object instead.
	 * - **`useState` → `$state`**, and `setData(next)` / `setLoadingIds(next)`
	 *   become plain reassignments. The `Set`s stay plain ones — reassignment is
	 *   the reactive boundary, and `expandedIds` is `ReadonlySet<string>` in the
	 *   published config type either way.
	 * - **`IndentExample` has no counterpart.** It is a React component purely so
	 *   the hooks can run once per indent size; a Svelte component cannot declare
	 *   hooks inside a loop, so the three instances are declared up front and the
	 *   markup loops over them.
	 * - **Story wrappers stay inline.** Upstream's `style={{display: 'flex', …}}`
	 *   scaffolding is storybook layout, not tokens, so it transcribes as literal
	 *   CSS rather than reaching for theme values the original never used.
	 *
	 * `sortableColumns` keeps upstream's `sortKey: col.key` verbatim even though
	 * `TableColumn` declares no top-level `sortKey` on either side: it is inert
	 * (`resolveSortKey` already returns `column.key` when `sortable === true`),
	 * and it is upstream's line to write.
	 */

	// =============================================================================
	// Sample Data — an org chart (hierarchical records with columns)
	// =============================================================================

	interface OrgRow extends Record<string, unknown> {
		id: string;
		name: string;
		title: string;
		team: string;
		headcount: number;
		children?: OrgRow[];
	}

	const orgChart: OrgRow[] = [
		{
			id: 'eng',
			name: 'Engineering',
			title: 'VP Engineering',
			team: 'Engineering',
			headcount: 48,
			children: [
				{
					id: 'eng-platform',
					name: 'Platform',
					title: 'Director',
					team: 'Engineering',
					headcount: 22,
					children: [
						{
							id: 'eng-platform-core',
							name: 'Core Services',
							title: 'Manager',
							team: 'Platform',
							headcount: 12,
							children: [
								{
									id: 'eng-platform-core-api',
									name: 'API Gateway',
									title: 'Tech Lead',
									team: 'Core Services',
									headcount: 5
								},
								{
									id: 'eng-platform-core-data',
									name: 'Data Pipeline',
									title: 'Tech Lead',
									team: 'Core Services',
									headcount: 7
								}
							]
						},
						{
							id: 'eng-platform-infra',
							name: 'Infrastructure',
							title: 'Manager',
							team: 'Platform',
							headcount: 10
						}
					]
				},
				{
					id: 'eng-product',
					name: 'Product Engineering',
					title: 'Director',
					team: 'Engineering',
					headcount: 26,
					children: [
						{
							id: 'eng-product-web',
							name: 'Web',
							title: 'Manager',
							team: 'Product Engineering',
							headcount: 14
						},
						{
							id: 'eng-product-mobile',
							name: 'Mobile',
							title: 'Manager',
							team: 'Product Engineering',
							headcount: 12
						}
					]
				}
			]
		},
		{
			id: 'design',
			name: 'Design',
			title: 'VP Design',
			team: 'Design',
			headcount: 11,
			children: [
				{
					id: 'design-systems',
					name: 'Design Systems',
					title: 'Manager',
					team: 'Design',
					headcount: 4
				},
				{
					id: 'design-research',
					name: 'Research',
					title: 'Manager',
					team: 'Design',
					headcount: 7
				}
			]
		},
		{
			id: 'ops',
			name: 'Operations',
			title: 'VP Operations',
			team: 'Operations',
			headcount: 6
		}
	];

	const columns: TableColumn<OrgRow>[] = [
		{ key: 'name', header: 'Group', width: proportional(2) },
		{ key: 'title', header: 'Lead', width: proportional(1) },
		{ key: 'team', header: 'Parent team', width: proportional(1) },
		{ key: 'headcount', header: 'Headcount', width: pixel(110), align: 'end' }
	];

	const sortableColumns: TableColumn<OrgRow>[] = columns.map((col) =>
		col.key === 'name' || col.key === 'headcount'
			? { ...col, sortable: true, sortKey: col.key }
			: col
	);

	// =============================================================================
	// Stories
	// =============================================================================

	// Default
	const defaultTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		defaultExpandedIds: ['eng']
	}));
	const defaultPlugin = useTableTreeData<OrgRow>(() => defaultTree.treeConfig);

	// ExpandAndCollapseAll
	const expandAllTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		defaultExpandedIds: ['eng', 'eng-platform', 'eng-platform-core']
	}));
	const expandAllPlugin = useTableTreeData<OrgRow>(() => expandAllTree.treeConfig);

	// HeaderExpandAllControl. The spread sits **inside** the getter: `treeConfig`'s
	// members are getters, so spreading once would snapshot `isAllExpanded` and
	// the header toggle would never relabel.
	const headerControlTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		defaultExpandedIds: ['eng']
	}));
	const headerControlPlugin = useTableTreeData<OrgRow>(() => ({
		...headerControlTree.treeConfig,
		hasExpandAllControl: true
	}));

	// RowClickExpansion. The spread sits inside the getter for the same reason
	// HeaderExpandAllControl's does.
	const rowClickTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		defaultExpandedIds: ['eng']
	}));
	const rowClickPlugin = useTableTreeData<OrgRow>(() => ({
		...rowClickTree.treeConfig,
		hasRowClickExpansion: true
	}));

	// IndentSizes
	const indentSmTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		indent: 'sm',
		defaultExpandedIds: ['eng', 'eng-platform', 'eng-platform-core']
	}));
	const indentSmPlugin = useTableTreeData<OrgRow>(() => indentSmTree.treeConfig);

	const indentMdTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		indent: 'md',
		defaultExpandedIds: ['eng', 'eng-platform', 'eng-platform-core']
	}));
	const indentMdPlugin = useTableTreeData<OrgRow>(() => indentMdTree.treeConfig);

	const indentLgTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		indent: 'lg',
		defaultExpandedIds: ['eng', 'eng-platform', 'eng-platform-core']
	}));
	const indentLgPlugin = useTableTreeData<OrgRow>(() => indentLgTree.treeConfig);

	const indentExamples = [
		{ indent: 'sm', tree: indentSmTree, plugin: indentSmPlugin },
		{ indent: 'md', tree: indentMdTree, plugin: indentMdPlugin },
		{ indent: 'lg', tree: indentLgTree, plugin: indentLgPlugin }
	];

	// WithSelection
	let selectedKeys = $state(new Set<string>(['design-systems']));

	const selectionTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		defaultExpandedIds: ['eng', 'design']
	}));

	const selectionState = useTableSelectionState<OrgRow>(() => ({
		data: selectionTree.visibleData,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));

	const selectionTreePlugin = useTableTreeData<OrgRow>(() => selectionTree.treeConfig);
	const selectionPlugin = useTableSelection<OrgRow>(() => selectionState.selectionConfig);

	// WithSiblingSorting
	const siblingSort = useTableSortableState<OrgRow>(() => ({
		data: orgChart,
		defaultSort: [{ sortKey: 'headcount', direction: 'descending' }]
	}));

	const sortingTree = useTableTreeState<OrgRow>(() => ({
		data: orgChart,
		idKey: 'id',
		defaultExpandedIds: ['eng', 'eng-platform'],
		sortSiblings: siblingSort.applySort
	}));

	const sortingTreePlugin = useTableTreeData<OrgRow>(() => sortingTree.treeConfig);
	// T can't be inferred from the sort config (it only carries the sort key).
	const sortingPlugin = useTableSortable<OrgRow>(() => siblingSort.sortConfig);

	// LazyLoadedChildren
	let lazyData = $state<OrgRow[]>([
		{ id: 'remote', name: 'Remote team', title: 'Director', team: '—', headcount: 9 }
	]);
	let loadingIds = $state(new Set<string>());

	const lazyTree = useTableTreeState<OrgRow>(() => ({
		data: lazyData,
		idKey: 'id',
		// Expandable before children exist.
		isItemExpandable: (item) => item.id === 'remote',
		onExpandedIdsChange: (ids) => {
			if (!ids.has('remote') || lazyData[0].children) {
				return;
			}
			loadingIds = new Set(['remote']);
			window.setTimeout(() => {
				lazyData = [
					{
						...lazyData[0],
						children: [
							{
								id: 'remote-emea',
								name: 'EMEA',
								title: 'Manager',
								team: 'Remote team',
								headcount: 5
							},
							{
								id: 'remote-apac',
								name: 'APAC',
								title: 'Manager',
								team: 'Remote team',
								headcount: 4
							}
						]
					}
				];
				loadingIds = new Set();
			}, 600);
		}
	}));

	const lazyPlugin = useTableTreeData<OrgRow>(() => lazyTree.treeConfig);

	// FlatDataIsANoOp
	const flat: OrgRow[] = [
		{ id: 'a', name: 'Engineering', title: 'VP Engineering', team: '—', headcount: 48 },
		{ id: 'b', name: 'Design', title: 'VP Design', team: '—', headcount: 11 },
		{ id: 'c', name: 'Operations', title: 'VP Operations', team: '—', headcount: 6 }
	];

	const flatTree = useTableTreeState<OrgRow>(() => ({ data: flat, idKey: 'id' }));
	const flatPlugin = useTableTreeData<OrgRow>(() => flatTree.treeConfig);
</script>

<h3>Default</h3>
<Table
	data={defaultTree.visibleData}
	{columns}
	idKey="id"
	hasHover
	plugins={{ tree: defaultPlugin }}
/>

<h3>Expand and collapse all</h3>
<div style="display: flex; flex-direction: column; gap: 12px">
	<div style="display: flex; gap: 8px">
		<button type="button" onclick={() => expandAllTree.expandAll()}>Expand all</button>
		<button type="button" onclick={() => expandAllTree.collapseAll()}>Collapse all</button>
	</div>
	<Table
		data={expandAllTree.visibleData}
		{columns}
		idKey="id"
		hasHover
		plugins={{ tree: expandAllPlugin }}
	/>
</div>

<h3>Header expand-all control</h3>
<Table
	data={headerControlTree.visibleData}
	{columns}
	idKey="id"
	hasHover
	plugins={{ tree: headerControlPlugin }}
/>

<h3>Row click expansion</h3>
<Table
	data={rowClickTree.visibleData}
	{columns}
	idKey="id"
	hasHover
	plugins={{ tree: rowClickPlugin }}
/>

<h3>Indent sizes</h3>
<div style="display: flex; flex-direction: column; gap: 32px">
	{#each indentExamples as example (example.indent)}
		<div>
			<p style="margin-block-end: 8px; font-weight: 600">indent="{example.indent}"</p>
			<Table
				data={example.tree.visibleData}
				{columns}
				idKey="id"
				plugins={{ tree: example.plugin }}
			/>
		</div>
	{/each}
</div>

<h3>With selection</h3>
<Table
	data={selectionTree.visibleData}
	{columns}
	idKey="id"
	hasHover
	plugins={{ tree: selectionTreePlugin, selection: selectionPlugin }}
/>

<h3>With sibling sorting</h3>
<Table
	data={sortingTree.visibleData}
	columns={sortableColumns}
	idKey="id"
	hasHover
	plugins={{ sort: sortingPlugin, tree: sortingTreePlugin }}
/>

<h3>Lazy loaded children</h3>
<div style="display: flex; flex-direction: column; gap: 8px">
	<Table data={lazyTree.visibleData} {columns} idKey="id" hasHover plugins={{ tree: lazyPlugin }} />
	{#if loadingIds.size > 0}
		<p>Loading children…</p>
	{/if}
</div>

<h3>Flat data is a no-op</h3>
<Table data={flatTree.visibleData} {columns} idKey="id" hasHover plugins={{ tree: flatPlugin }} />
