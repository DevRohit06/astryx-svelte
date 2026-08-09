<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableColumnResize } from '$lib/components/table/plugins/column-resize/use-table-column-resize.js';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import { testColumns, testData, type ResizeRow } from './table-column-resize-fixture.svelte';

	/** Upstream's `ComposedTable` — the resize plugin stacked with selection. */
	let columnWidths = $state<Record<string, number>>({});

	const resize = useTableColumnResize<ResizeRow>(() => ({
		columnWidths,
		onColumnResizeEnd: (updates) => {
			columnWidths = { ...columnWidths, ...updates };
		}
	}));

	const selection = useTableSelection<ResizeRow>(() => ({
		getIsItemSelected: () => false,
		onSelectItem: () => {},
		onSelectAll: () => {},
		getIsAllSelected: () => false
	}));
</script>

<Table data={testData} columns={testColumns} idKey="id" plugins={{ resize, selection }} />
