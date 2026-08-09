<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableColumnResize } from '$lib/components/table/plugins/column-resize/use-table-column-resize.js';
	import { testColumns, testData, type ResizeRow } from './table-column-resize-fixture.svelte';

	/**
	 * Upstream's `ControlledResizeTable` — the plugin reads `columnWidths`
	 * straight off the prop, with no internal state, so a rerender that drops a
	 * key removes the override.
	 */
	interface Props {
		columnWidths: Record<string, number>;
	}

	const { columnWidths }: Props = $props();

	const resize = useTableColumnResize<ResizeRow>(() => ({ columnWidths }));
</script>

<Table data={testData} columns={testColumns} idKey="id" plugins={{ resize }} />
