<script lang="ts">
	import {
		Table,
		pixel,
		proportional,
		useTableRowIndex,
		useTableSortable,
		useTableSortableState
	} from '$lib/index.js';
	import type { TableColumn, TableSortState } from '$lib/index.js';

	/**
	 * Upstream's `TableRowIndex.stories.tsx`, as a sibling route component — the
	 * `table-demos.svelte` shape.
	 *
	 * **All 3 stories**, with upstream's own per-story prose:
	 *
	 * - **Default** — a monospaced, right-aligned row-number column is prepended
	 *   to the table. Numbering follows the rendered data order and starts at 1
	 *   by default.
	 * - **CustomLabelAndStart** — customize the header `label` and the
	 *   `startFrom` offset (e.g. 0-based).
	 * - **RenumbersWithSort** — the index reflects the current view: with sorting
	 *   active, pass the **sorted** data to `useTableRowIndex` so numbering
	 *   renumbers as the order changes. Sort by Plays to see rows renumber 1..n
	 *   in the new order.
	 *
	 * Four translations, all of them batch 13's settled shape:
	 *
	 * - **The hooks take a getter.** `useTableRowIndex<Track>(() => ({ data }))`,
	 *   where upstream passes the config object itself. The explicit `<Track>` is
	 *   upstream's, not an adjustment.
	 * - **The state result is *not* destructured.** Upstream writes
	 *   `const {sortedData, sortConfig} = useTableSortableState(...)`, which is
	 *   safe there because React returns a fresh object every render. Here the
	 *   hook returns one object whose members are **getters**, so destructuring
	 *   would snapshot the first sort and the index would never renumber. The
	 *   result is held as `sortState` and read through.
	 * - **`useState` → `$state`.** `setSort` becomes the assignment inside
	 *   `onSortChange`.
	 * - **The `useMemo` is gone.** Upstream memoizes `{rowIndex, sort: sortPlugin}`
	 *   for a stable `plugins` identity; both plugin objects here already close
	 *   over getters, so the object literal is written inline on the prop.
	 *
	 * The three `rowIndex` locals are named apart only because one file holds all
	 * three stories — each is still passed under upstream's `rowIndex` plugin key.
	 */

	interface Track extends Record<string, unknown> {
		id: string;
		title: string;
		artist: string;
		plays: number;
	}

	const tracks: Track[] = [
		{ id: 't1', title: 'Nightfall', artist: 'Ava Chen', plays: 1820 },
		{ id: 't2', title: 'Ember', artist: 'Liam Park', plays: 942 },
		{ id: 't3', title: 'Tidal', artist: 'Zoe Vega', plays: 3310 },
		{ id: 't4', title: 'Cinder', artist: 'Max Ross', plays: 604 },
		{ id: 't5', title: 'Halcyon', artist: 'Mia Cole', plays: 2075 }
	];

	const columns: TableColumn<Track>[] = [
		{ key: 'title', header: 'Title', width: proportional(2) },
		{ key: 'artist', header: 'Artist', width: proportional(2) },
		{ key: 'plays', header: 'Plays', width: pixel(90), align: 'end', sortable: true }
	];

	const rowIndex = useTableRowIndex<Track>(() => ({ data: tracks }));

	const customRowIndex = useTableRowIndex<Track>(() => ({
		data: tracks,
		label: 'No.',
		startFrom: 0
	}));

	let sort = $state<TableSortState>([{ sortKey: 'plays', direction: 'descending' }]);
	// Held, not destructured — see the header comment.
	const sortState = useTableSortableState<Track>(() => ({
		data: tracks,
		sort,
		onSortChange: (next) => (sort = next)
	}));
	const sortPlugin = useTableSortable<Track>(() => sortState.sortConfig);
	// Pass the sorted data + a stable key so the index tracks the sorted order.
	const sortedRowIndex = useTableRowIndex<Track>(() => ({
		data: sortState.sortedData,
		getRowKey: (item) => item.id
	}));
</script>

<h3>Default</h3>
<Table data={tracks} {columns} idKey="id" hasHover plugins={{ rowIndex }} />

<h3>Custom label and start</h3>
<Table data={tracks} {columns} idKey="id" hasHover plugins={{ rowIndex: customRowIndex }} />

<h3>Renumbers with sort</h3>
<Table
	data={sortState.sortedData}
	{columns}
	idKey="id"
	hasHover
	plugins={{ rowIndex: sortedRowIndex, sort: sortPlugin }}
/>
