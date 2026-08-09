<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableColumnResize } from '$lib/components/table/plugins/column-resize/use-table-column-resize.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';
	import { testColumns, testData, type ResizeRow } from './table-column-resize-fixture.svelte';

	/**
	 * Upstream's `ReorderTable` — a button that reverses the column order while
	 * the committed widths stay keyed by column key.
	 */
	let cols = $state<TableColumn<ResizeRow>[]>(testColumns);

	const resize = useTableColumnResize<ResizeRow>(() => ({
		columnWidths: { name: 200, role: 150 }
	}));
</script>

<div>
	<button type="button" onclick={() => (cols = [...cols].reverse())}>Reorder</button>
	<Table data={testData} columns={cols} idKey="id" plugins={{ resize }} />
</div>
