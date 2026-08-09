<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableColumnResize } from '$lib/components/table/plugins/column-resize/use-table-column-resize.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';
	import { testColumns, testData, type ResizeRow } from './table-column-resize-fixture.svelte';

	/**
	 * The three upstream harnesses that hand the plugin **no `columns`** —
	 * `LegacyResizeTable`, `SingleColumnTable` and `EmptyTable`. Without the
	 * column list the plugin treats every column as pixel, so the last-column and
	 * neighbour rules never fire and every column gets a handle.
	 */
	interface Props {
		data?: ResizeRow[];
		columns?: TableColumn<ResizeRow>[];
		columnWidths?: Record<string, number>;
	}

	const { data = testData, columns = testColumns, columnWidths }: Props = $props();

	const resize = useTableColumnResize<ResizeRow>(() => ({ columnWidths }));
</script>

<Table {data} {columns} idKey="id" plugins={{ resize }} />
