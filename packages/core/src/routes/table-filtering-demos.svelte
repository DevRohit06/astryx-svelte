<script lang="ts">
	import {
		EmptyState,
		Table,
		toSearchFilters,
		useTableColumnResize,
		useTableFilterState,
		useTableFiltering,
		useTableSelection,
		useTableSelectionState,
		useTableSortable,
		useTableSortableState,
		usePowerSearchConfig
	} from '$lib/index.js';
	import type { PowerSearchFilter, TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableFiltering.stories.tsx`, as a sibling route component.
	 *
	 * **All 11 stories**, in upstream's order. This file was **deferred at batch
	 * 13's close** and is one of the three things PowerSearch unblocks: every
	 * story opens with `usePowerSearchConfig(fieldDefs)` and uses *both* halves of
	 * the result — `config` is the plugin's required `searchConfig`, and
	 * `applyFilters` is what actually removes rows. The batch-13 note recorded
	 * that a first cut had hand-transcribed PowerSearch's operator tables and
	 * match engine to stand in, that this was re-authoring an unported subsystem,
	 * and that it was deleted rather than kept. It is now the real thing.
	 *
	 * Two translations recur, and both are the ones the batch-13 hooks and this
	 * batch's config hook were designed around:
	 *
	 * - **`usePowerSearchConfig` takes a getter and returns getters**, so its
	 *   result is *held*, never destructured. Upstream's
	 *   `const {config, applyFilters} = usePowerSearchConfig(fieldDefs)` would
	 *   snapshot both here and stop tracking — the `useTheme()` hazard already
	 *   recorded for `useThemeHookUsage`. `createPowerSearchConfig` is the plain
	 *   escape hatch, but the stories demonstrate the hook, so the hook is what
	 *   they use.
	 * - **The `*State` results are held for the same reason**, except
	 *   `selectionConfig`, which upstream destructures and which is a stable
	 *   object rather than a getter over changing state.
	 *
	 * The two `Set`s stay plain rather than `SvelteSet`, as every other table demo
	 * route's do: that is what upstream's published `selectedKeys` type declares,
	 * and reassignment is the reactive boundary.
	 *
	 * The hooks are hoisted out of `render` into this shared `<script>` and given
	 * story-prefixed names, as every other table demo route does. Data, columns,
	 * captions and plugin key names are upstream's, unchanged — including the
	 * `filter`/`sort`/`resize`/`selection` key spellings and their per-story
	 * order.
	 */

	interface Employee extends Record<string, unknown> {
		name: string;
		email: string;
		role: string;
		department: readonly string[];
		level: number;
	}

	const employees: Employee[] = [
		{
			name: 'Alice',
			email: 'alice@example.com',
			role: 'Engineer',
			department: ['Platform'],
			level: 5
		},
		{
			name: 'Bob',
			email: 'bob@example.com',
			role: 'Designer',
			department: ['Product'],
			level: 4
		},
		{
			name: 'Charlie',
			email: 'charlie@example.com',
			role: 'Manager',
			department: ['Platform'],
			level: 6
		},
		{
			name: 'Diana',
			email: 'diana@example.com',
			role: 'Engineer',
			department: ['Infrastructure'],
			level: 5
		},
		{
			name: 'Eve',
			email: 'eve@example.com',
			role: 'Admin',
			department: ['Operations'],
			level: 3
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
		},
		{
			key: 'department',
			type: 'enum_list',
			label: 'Department',
			enumValues: [
				{ value: 'Platform', label: 'Platform' },
				{ value: 'Product', label: 'Product' },
				{ value: 'Infrastructure', label: 'Infrastructure' },
				{ value: 'Operations', label: 'Operations' }
			]
		},
		{ key: 'level', type: 'number', label: 'Level' }
	] as const;

	// ── TextFilter ────────────────────────────────────────────────────────────
	const textSearch = usePowerSearchConfig(() => fieldDefs);
	const textFilterState = useTableFilterState();
	const textColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'email', header: 'Email', filter: 'email' },
		{ key: 'role', header: 'Role' },
		{ key: 'department', header: 'Department' }
	];
	const textPlugin = useTableFiltering<Employee>(() => ({
		filters: textFilterState.filters,
		onFilterChange: textFilterState.onFilterChange,
		searchConfig: textSearch.config
	}));
	const textData = $derived(
		textSearch.applyFilters(
			toSearchFilters(
				textFilterState.filters,
				textColumns,
				textSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── SelectorFilter ────────────────────────────────────────────────────────
	const selectorSearch = usePowerSearchConfig(() => fieldDefs);
	const selectorFilterState = useTableFilterState();
	const selectorColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'role', header: 'Role', filter: 'role' },
		{ key: 'department', header: 'Department' },
		{ key: 'level', header: 'Level' }
	];
	const selectorPlugin = useTableFiltering<Employee>(() => ({
		filters: selectorFilterState.filters,
		onFilterChange: selectorFilterState.onFilterChange,
		searchConfig: selectorSearch.config
	}));
	const selectorData = $derived(
		selectorSearch.applyFilters(
			toSearchFilters(
				selectorFilterState.filters,
				selectorColumns,
				selectorSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── MultiSelectorFilter ───────────────────────────────────────────────────
	const multiSearch = usePowerSearchConfig(() => fieldDefs);
	const multiFilterState = useTableFilterState();
	const multiColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'role', header: 'Role' },
		{ key: 'department', header: 'Department', filter: 'department' },
		{ key: 'level', header: 'Level' }
	];
	const multiPlugin = useTableFiltering<Employee>(() => ({
		filters: multiFilterState.filters,
		onFilterChange: multiFilterState.onFilterChange,
		searchConfig: multiSearch.config
	}));
	const multiData = $derived(
		multiSearch.applyFilters(
			toSearchFilters(
				multiFilterState.filters,
				multiColumns,
				multiSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── NumberFilter ──────────────────────────────────────────────────────────
	const numberSearch = usePowerSearchConfig(() => fieldDefs);
	const numberFilterState = useTableFilterState();
	const numberColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'role', header: 'Role' },
		{ key: 'level', header: 'Level', filter: 'level' },
		{ key: 'department', header: 'Department' }
	];
	const numberPlugin = useTableFiltering<Employee>(() => ({
		filters: numberFilterState.filters,
		onFilterChange: numberFilterState.onFilterChange,
		searchConfig: numberSearch.config
	}));
	const numberData = $derived(
		numberSearch.applyFilters(
			toSearchFilters(
				numberFilterState.filters,
				numberColumns,
				numberSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── InlineVariant ─────────────────────────────────────────────────────────
	const inlineSearch = usePowerSearchConfig(() => fieldDefs);
	const inlineFilterState = useTableFilterState();
	const inlineColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'role', header: 'Role', filter: 'role' },
		{ key: 'level', header: 'Level', filter: 'level' },
		{ key: 'department', header: 'Department' }
	];
	const inlinePlugin = useTableFiltering<Employee>(() => ({
		filters: inlineFilterState.filters,
		onFilterChange: inlineFilterState.onFilterChange,
		variant: 'inline',
		searchConfig: inlineSearch.config
	}));
	const inlineData = $derived(
		inlineSearch.applyFilters(
			toSearchFilters(
				inlineFilterState.filters,
				inlineColumns,
				inlineSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── WithSelection ─────────────────────────────────────────────────────────
	const selectionSearch = usePowerSearchConfig(() => fieldDefs);
	const selectionFilterState = useTableFilterState();
	let selectionSelectedKeys = $state(new Set<string>());
	const selectionColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'role', header: 'Role', filter: 'role' },
		{ key: 'department', header: 'Department', filter: 'department' },
		{ key: 'level', header: 'Level' }
	];
	const selectionPluginFilter = useTableFiltering<Employee>(() => ({
		filters: selectionFilterState.filters,
		onFilterChange: selectionFilterState.onFilterChange,
		searchConfig: selectionSearch.config
	}));
	const selectionData = $derived(
		selectionSearch.applyFilters(
			toSearchFilters(
				selectionFilterState.filters,
				selectionColumns,
				selectionSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);
	const selectionState = useTableSelectionState<Employee>(() => ({
		data: selectionData,
		idKey: 'name',
		selectedKeys: selectionSelectedKeys,
		setSelectedKeys: (keys) => (selectionSelectedKeys = keys)
	}));
	const { selectionConfig: selectionSelectionConfig } = selectionState;
	const selectionPlugin = useTableSelection<Employee>(() => selectionSelectionConfig);

	// ── WithSorting ───────────────────────────────────────────────────────────
	const sortingSearch = usePowerSearchConfig(() => fieldDefs);
	const sortingFilterState = useTableFilterState();
	const sortingState = useTableSortableState<Employee>(() => ({ data: employees }));
	const sortingColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', sortable: true, filter: 'name' },
		{ key: 'role', header: 'Role', sortable: true, filter: 'role' },
		{ key: 'level', header: 'Level', sortable: true, filter: 'level' },
		{ key: 'department', header: 'Department' }
	];
	const sortingFilterPlugin = useTableFiltering<Employee>(() => ({
		filters: sortingFilterState.filters,
		onFilterChange: sortingFilterState.onFilterChange,
		searchConfig: sortingSearch.config
	}));
	const sortingSortPlugin = useTableSortable<Employee>(() => sortingState.sortConfig);
	const sortingData = $derived(
		sortingState.applySort(
			sortingSearch.applyFilters(
				toSearchFilters(
					sortingFilterState.filters,
					sortingColumns,
					sortingSearch.config
				) as PowerSearchFilter[],
				employees
			)
		)
	);

	// ── WithResize ────────────────────────────────────────────────────────────
	const resizeSearch = usePowerSearchConfig(() => fieldDefs);
	const resizeFilterState = useTableFilterState();
	let resizeColumnWidths = $state<Record<string, number>>({});
	const resizeColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'role', header: 'Role', filter: 'role' },
		{ key: 'level', header: 'Level', filter: 'level' },
		{ key: 'department', header: 'Department' }
	];
	const resizeFilterPlugin = useTableFiltering<Employee>(() => ({
		filters: resizeFilterState.filters,
		onFilterChange: resizeFilterState.onFilterChange,
		variant: 'inline',
		searchConfig: resizeSearch.config
	}));
	const resizePlugin = useTableColumnResize<Employee>(() => ({
		columnWidths: resizeColumnWidths,
		onColumnResizeEnd: (updates) => (resizeColumnWidths = { ...resizeColumnWidths, ...updates }),
		columns: resizeColumns as TableColumn<Record<string, unknown>>[]
	}));
	const resizeData = $derived(
		resizeSearch.applyFilters(
			toSearchFilters(
				resizeFilterState.filters,
				resizeColumns,
				resizeSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── WithAllPlugins ────────────────────────────────────────────────────────
	const allSearch = usePowerSearchConfig(() => fieldDefs);
	const allFilterState = useTableFilterState();
	const allSortState = useTableSortableState<Employee>(() => ({ data: employees }));
	let allColumnWidths = $state<Record<string, number>>({});
	let allSelectedKeys = $state(new Set<string>());
	const allColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', sortable: true, filter: 'name' },
		{ key: 'role', header: 'Role', sortable: true, filter: 'role' },
		{ key: 'level', header: 'Level', sortable: true, filter: 'level' },
		{ key: 'department', header: 'Department', sortable: true }
	];
	const allFilterPlugin = useTableFiltering<Employee>(() => ({
		filters: allFilterState.filters,
		onFilterChange: allFilterState.onFilterChange,
		searchConfig: allSearch.config
	}));
	const allSortPlugin = useTableSortable<Employee>(() => allSortState.sortConfig);
	const allResizePlugin = useTableColumnResize<Employee>(() => ({
		columnWidths: allColumnWidths,
		onColumnResizeEnd: (updates) => (allColumnWidths = { ...allColumnWidths, ...updates }),
		columns: allColumns as TableColumn<Record<string, unknown>>[]
	}));
	const allData = $derived(
		allSortState.applySort(
			allSearch.applyFilters(
				toSearchFilters(
					allFilterState.filters,
					allColumns,
					allSearch.config
				) as PowerSearchFilter[],
				employees
			)
		)
	);
	const allSelectionState = useTableSelectionState<Employee>(() => ({
		data: allData,
		idKey: 'name',
		selectedKeys: allSelectedKeys,
		setSelectedKeys: (keys) => (allSelectedKeys = keys)
	}));
	const { selectionConfig: allSelectionConfig } = allSelectionState;
	const allSelectionPlugin = useTableSelection<Employee>(() => allSelectionConfig);

	// ── InlineWithClear ───────────────────────────────────────────────────────
	const clearSearch = usePowerSearchConfig(() => fieldDefs);
	const clearFilterState = useTableFilterState();
	const clearColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'role', header: 'Role', filter: 'role' },
		{ key: 'level', header: 'Level', filter: 'level' },
		{ key: 'department', header: 'Department' }
	];
	const clearPlugin = useTableFiltering<Employee>(() => ({
		filters: clearFilterState.filters,
		onFilterChange: clearFilterState.onFilterChange,
		variant: 'inline',
		searchConfig: clearSearch.config
	}));
	const clearData = $derived(
		clearSearch.applyFilters(
			toSearchFilters(
				clearFilterState.filters,
				clearColumns,
				clearSearch.config
			) as PowerSearchFilter[],
			employees
		)
	);

	// ── EmptyState ────────────────────────────────────────────────────────────
	const emptySearch = usePowerSearchConfig(() => fieldDefs);
	const emptyFilterState = useTableFilterState();
	const emptyColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'role', header: 'Role', filter: 'role' },
		{ key: 'level', header: 'Level', filter: 'level' },
		{ key: 'department', header: 'Department' }
	];
	const emptyPlugin = useTableFiltering<Employee>(() => ({
		filters: emptyFilterState.filters,
		onFilterChange: emptyFilterState.onFilterChange,
		variant: 'inline',
		searchConfig: emptySearch.config
	}));
	const emptyData = $derived(
		emptySearch.applyFilters(
			toSearchFilters(
				emptyFilterState.filters,
				emptyColumns,
				emptySearch.config
			) as PowerSearchFilter[],
			employees
		)
	);
</script>

<h3>TextFilter</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Showing {textData.length}/{employees.length} rows.
	</p>
	<Table data={textData} columns={textColumns} idKey="name" plugins={{ filter: textPlugin }} />
</div>

<h3>SelectorFilter</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Enum → selector. Showing {selectorData.length}/{employees.length} rows.
	</p>
	<Table
		data={selectorData}
		columns={selectorColumns}
		idKey="name"
		plugins={{ filter: selectorPlugin }}
	/>
</div>

<h3>MultiSelectorFilter</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Enum list → multi-selector. Showing {multiData.length}/{employees.length} rows.
	</p>
	<Table data={multiData} columns={multiColumns} idKey="name" plugins={{ filter: multiPlugin }} />
</div>

<h3>NumberFilter</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Number field → numeric input. Showing {numberData.length}/{employees.length} rows.
	</p>
	<Table
		data={numberData}
		columns={numberColumns}
		idKey="name"
		plugins={{ filter: numberPlugin }}
	/>
</div>

<h3>InlineVariant</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Inline variant. Showing {inlineData.length}/{employees.length} rows.
	</p>
	<Table
		data={inlineData}
		columns={inlineColumns}
		idKey="name"
		plugins={{ filter: inlinePlugin }}
	/>
</div>

<h3>WithSelection</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Filtering + Selection. Selected: {selectionSelectedKeys.size} | Showing
		{selectionData.length}/{employees.length} rows.
	</p>
	<Table
		data={selectionData}
		columns={selectionColumns}
		idKey="name"
		plugins={{ selection: selectionPlugin, filter: selectionPluginFilter }}
	/>
</div>

<h3>WithSorting</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Filtering + Sorting. Showing {sortingData.length}/{employees.length} rows.
	</p>
	<Table
		data={sortingData}
		columns={sortingColumns}
		idKey="name"
		plugins={{ sort: sortingSortPlugin, filter: sortingFilterPlugin }}
	/>
</div>

<h3>WithResize</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Inline filtering + Resize. Showing {resizeData.length}/{employees.length} rows.
	</p>
	<Table
		data={resizeData}
		columns={resizeColumns}
		idKey="name"
		plugins={{ filter: resizeFilterPlugin, resize: resizePlugin }}
	/>
</div>

<h3>WithAllPlugins</h3>
<div style="max-width: 900px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		All plugins. Selected: {allSelectedKeys.size} | Showing {allData.length}/{employees.length} rows.
	</p>
	<Table
		data={allData}
		columns={allColumns}
		idKey="name"
		plugins={{
			selection: allSelectionPlugin,
			sort: allSortPlugin,
			filter: allFilterPlugin,
			resize: allResizePlugin
		}}
	/>
</div>

<h3>InlineWithClear</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Inline variant with clear buttons. Type to filter, then click ✕ to clear. Showing
		{clearData.length}/{employees.length} rows.
	</p>
	<Table data={clearData} columns={clearColumns} idKey="name" plugins={{ filter: clearPlugin }} />
</div>

<h3>EmptyState</h3>
<div style="max-width: 800px">
	<p style="margin-bottom: 8px; font-size: 14px; color: #666">
		Try filtering to get zero results; empty state appears.
	</p>
	{#snippet tableEmptyState()}
		<EmptyState
			title="No results"
			description="Try adjusting your filters to find what you're looking for."
			isCompact
		/>
	{/snippet}
	<Table
		data={emptyData}
		columns={emptyColumns}
		idKey="name"
		plugins={{ filter: emptyPlugin }}
		emptyState={tableEmptyState}
	/>
</div>
