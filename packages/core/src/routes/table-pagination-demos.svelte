<script lang="ts">
	import {
		Table,
		paginateData,
		useTablePagination,
		useTableSelection,
		useTableSelectionState
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TablePagination.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape.
	 *
	 * **All 9 stories.** The generated 50-user array, the three columns and every
	 * note string are upstream's, unchanged.
	 *
	 * Four translations:
	 *
	 * - **`useState` → `$state`, and every hook takes a getter.** `page` is read
	 *   *through* that getter, so the pagination chrome tracks the page without
	 *   the plugin object being re-created — a changing provider reference
	 *   remounts the whole table.
	 * - **`onPageChange: setPage` → `onPageChange: (next) => (page = next)`.**
	 *   React's `Dispatch<SetStateAction<number>>` has no counterpart, because a
	 *   `$state` read is never stale.
	 * - **One `pageSize` const.** Each upstream story declares its own
	 *   `const pageSize = 10` inside `render`; the stories share one script scope
	 *   here, so they share one const. `PageSizeSelector`'s is the only one that
	 *   varies, and keeps its own `$state`.
	 * - **`useTableSelectionState`'s result is held, not destructured** —
	 *   `selectionConfig` is read back off it at call time.
	 *
	 * `PaginatedDemo`, upstream's shared render helper, has no counterpart: a
	 * `.svelte` file declares one component. Its two callers are expanded in
	 * place.
	 *
	 * - `Playground` — "Interactive playground — use the controls panel to
	 *   explore every combination of variant, position, and align." The controls
	 *   are Storybook's `argTypes` panel; the story body itself renders none, so
	 *   the port shows the configuration its `args` default to
	 *   (`variant="pages"`, `position="below"`, `align="center"`) rather than
	 *   inventing a control panel upstream does not have.
	 * - `OptionsMatrix` — "All variant × position × align combinations in one
	 *   scrollable view. One row per combination, labelled clearly. The `none`
	 *   values are omitted." Each of upstream's 36 `PaginatedDemo` instances owns
	 *   its own page state, so the port holds one page per combination in a
	 *   `$state` array and builds one plugin per combination.
	 */

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
	}

	const users: User[] = Array.from({ length: 50 }, (_, i) => ({
		id: String(i + 1),
		name: `User ${i + 1}`,
		email: `user${i + 1}@example.com`,
		role: ['Engineer', 'Designer', 'Manager', 'Admin', 'Analyst'][i % 5]
	}));

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email' },
		{ key: 'role', header: 'Role' }
	];

	type Variant = 'pages' | 'count' | 'compact' | 'dots' | 'none';
	type Position = 'below' | 'above' | 'both' | 'none';
	type Align = 'start' | 'center' | 'end';

	const pageSize = 10;

	// Default
	let defaultPage = $state(1);
	const defaultPlugin = useTablePagination<User>(() => ({
		page: defaultPage,
		onPageChange: (next) => (defaultPage = next),
		totalItems: users.length,
		pageSize
	}));

	// ServerSide
	let serverPage = $state(1);
	const serverData = $derived(users.slice((serverPage - 1) * pageSize, serverPage * pageSize));
	const serverPlugin = useTablePagination<User>(() => ({
		page: serverPage,
		onPageChange: (next) => (serverPage = next),
		totalItems: users.length,
		pageSize
	}));

	// PageSizeSelector
	let selectorPage = $state(1);
	let selectorPageSize = $state(10);
	const selectorPlugin = useTablePagination<User>(() => ({
		page: selectorPage,
		onPageChange: (next) => (selectorPage = next),
		totalItems: users.length,
		pageSize: selectorPageSize,
		onPageSizeChange: (next) => (selectorPageSize = next),
		pageSizeOptions: [5, 10, 25, 50]
	}));

	// CursorBased
	let cursorPage = $state(1);
	const cursorHasMore = $derived(cursorPage * pageSize < users.length);
	const cursorPlugin = useTablePagination<User>(() => ({
		page: cursorPage,
		onPageChange: (next) => (cursorPage = next),
		hasMore: cursorHasMore,
		pageSize
	}));

	// PositionAbove
	let abovePage = $state(1);
	const abovePlugin = useTablePagination<User>(() => ({
		page: abovePage,
		onPageChange: (next) => (abovePage = next),
		totalItems: users.length,
		pageSize,
		position: 'above'
	}));

	// PositionBoth
	let bothPage = $state(1);
	const bothPlugin = useTablePagination<User>(() => ({
		page: bothPage,
		onPageChange: (next) => (bothPage = next),
		totalItems: users.length,
		pageSize,
		position: 'both'
	}));

	// WithSelection
	let selectionPage = $state(1);
	let selectedKeys = $state(new Set<string>());
	const selectionPagination = useTablePagination<User>(() => ({
		page: selectionPage,
		onPageChange: (next) => (selectionPage = next),
		totalItems: users.length,
		pageSize
	}));
	const selectionPageData = $derived(paginateData(users, selectionPage, pageSize));
	const selectionState = useTableSelectionState<User>(() => ({
		data: selectionPageData,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next)
	}));
	const selectionPlugin = useTableSelection<User>(() => selectionState.selectionConfig);

	// Playground
	let playgroundPage = $state(1);
	const playgroundPlugin = useTablePagination<User>(() => ({
		page: playgroundPage,
		onPageChange: (next) => (playgroundPage = next),
		totalItems: users.length,
		pageSize,
		variant: 'pages',
		position: 'below',
		align: 'center'
	}));

	// OptionsMatrix
	const VARIANTS: Variant[] = ['pages', 'count', 'compact', 'dots'];
	const POSITIONS: Position[] = ['below', 'above', 'both'];
	const ALIGNS: Align[] = ['start', 'center', 'end'];

	const matrix = VARIANTS.flatMap((variant) =>
		POSITIONS.flatMap((position) => ALIGNS.map((align) => ({ variant, position, align })))
	);

	const matrixPages = $state(matrix.map(() => 1));

	const matrixPlugins = matrix.map((combo, i) =>
		useTablePagination<User>(() => ({
			page: matrixPages[i],
			onPageChange: (next) => (matrixPages[i] = next),
			totalItems: users.length,
			pageSize,
			variant: combo.variant,
			position: combo.position,
			align: combo.align
		}))
	);

	const noteStyle = 'margin-bottom: 8px; font-size: 14px; color: #666';
	const matrixRow = 'margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid #e5e5e5';
	const matrixPills = 'display: inline-flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap';
	const matrixPill =
		'font-size: 11px; font-family: monospace; background: #f0f0f0; border-radius: 4px; padding: 2px 6px; color: #555';
</script>

<h3>Default</h3>
<div style="max-width: 600px">
	<Table
		data={paginateData(users, defaultPage, pageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: defaultPlugin }}
	/>
</div>

<h3>Server side</h3>
<div style="max-width: 600px">
	<p style={noteStyle}>Server-side: data is pre-sliced, no paginatedData() needed.</p>
	<Table data={serverData} {columns} idKey="id" plugins={{ pagination: serverPlugin }} />
</div>

<h3>Page size selector</h3>
<div style="max-width: 600px">
	<Table
		data={paginateData(users, selectorPage, selectorPageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: selectorPlugin }}
	/>
</div>

<h3>Cursor based</h3>
<div style="max-width: 600px">
	<p style={noteStyle}>Cursor-based: total unknown, only hasMore={String(cursorHasMore)}.</p>
	<Table
		data={paginateData(users, cursorPage, pageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: cursorPlugin }}
	/>
</div>

<h3>Position above</h3>
<div style="max-width: 600px">
	<Table
		data={paginateData(users, abovePage, pageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: abovePlugin }}
	/>
</div>

<h3>Position both</h3>
<div style="max-width: 600px">
	<Table
		data={paginateData(users, bothPage, pageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: bothPlugin }}
	/>
</div>

<h3>With selection</h3>
<div style="max-width: 600px">
	<p style={noteStyle}>Pagination + Selection composed. Selected: {selectedKeys.size}</p>
	<Table
		data={selectionPageData}
		{columns}
		idKey="id"
		plugins={{ selection: selectionPlugin, pagination: selectionPagination }}
	/>
</div>

<h3>Playground</h3>
<div style="max-width: 700px">
	<Table
		data={paginateData(users, playgroundPage, pageSize)}
		{columns}
		idKey="id"
		plugins={{ pagination: playgroundPlugin }}
	/>
</div>

<h3>Options matrix</h3>
<div style="font-family: sans-serif; max-width: 700px">
	{#each matrix as combo, i (`${combo.variant}-${combo.position}-${combo.align}`)}
		{@const pills = [
			{ label: 'variant', value: combo.variant },
			{ label: 'position', value: combo.position },
			{ label: 'align', value: combo.align }
		]}
		<div style={matrixRow}>
			<div style={matrixPills}>
				{#each pills as pill (pill.label)}
					<span style={matrixPill}>{pill.label}="{pill.value}"</span>
				{/each}
			</div>
			<Table
				data={paginateData(users, matrixPages[i], pageSize)}
				{columns}
				idKey="id"
				plugins={{ pagination: matrixPlugins[i] }}
			/>
		</div>
	{/each}
</div>
