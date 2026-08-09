<!--
	Ported from upstream's `templates/blocks/components/Table/TableRowIndexTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Data, columns and upstream's own note above the hook call are unchanged. The
	block holds no state, so there is exactly one translation:

	- **The hook takes a getter.** `useTableRowIndex<Track>(() => ({data: tracks}))`,
	  where upstream passes the config object itself. The explicit **`<Track>`** is
	  upstream's, not an adjustment.

	No icon substitutions: the index column is the plugin's own.
-->
<script lang="ts">
	import {
		Table,
		pixel,
		proportional,
		useTableRowIndex,
		type TableColumn
	} from '@astryx-svelte/core';

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
		{ key: 'plays', header: 'Plays', width: pixel(90), align: 'end' }
	];

	// Pass the rendered data array — numbering follows its order.
	const rowIndex = useTableRowIndex<Track>(() => ({ data: tracks }));
</script>

<Table data={tracks} {columns} idKey="id" hasHover plugins={{ rowIndex }} />
