<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Table from '$lib/components/table/table.svelte';
	import { useTablePagination } from '$lib/components/table/plugins/pagination/use-table-pagination.js';
	import { paginateData } from '$lib/components/table/plugins/pagination/paginate-data.js';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import { generateItems, ITEM_COLUMNS, type TestItem } from './table-pagination-fixture.svelte';

	/**
	 * Upstream's `DualPluginTable` and `ReversedPluginTable` from
	 * `useTablePagination.test.tsx`. They differ only in the order of the
	 * `plugins` record, so `reversed` selects between them.
	 */
	interface Props {
		/** Lists pagination before selection, as `ReversedPluginTable` does. */
		reversed?: boolean;
	}

	const { reversed = false }: Props = $props();

	const data = generateItems(20);
	let page = $state(1);
	const selectedIds = new SvelteSet<string>();

	const plugin = useTablePagination<TestItem>(() => ({
		page,
		onPageChange: (p) => (page = p),
		totalItems: data.length,
		pageSize: 10
	}));

	const selection = useTableSelection<TestItem>(() => ({
		getIsItemSelected: (item) => selectedIds.has(item.id),
		onSelectItem: ({ item, isSelected }) => {
			if (isSelected) {
				selectedIds.add(item.id);
			} else {
				selectedIds.delete(item.id);
			}
		},
		onSelectAll: ({ isAllSelected }) => {
			const pageData = paginateData(data, page, 10);
			selectedIds.clear();
			if (isAllSelected) {
				for (const d of pageData) {
					selectedIds.add(d.id);
				}
			}
		},
		getIsAllSelected: () => {
			const pageData = paginateData(data, page, 10);
			return pageData.length > 0 && pageData.every((d) => selectedIds.has(d.id));
		}
	}));
</script>

<Table
	data={paginateData(data, page, 10)}
	columns={ITEM_COLUMNS}
	idKey="id"
	plugins={reversed ? { pagination: plugin, selection } : { selection, pagination: plugin }}
/>
