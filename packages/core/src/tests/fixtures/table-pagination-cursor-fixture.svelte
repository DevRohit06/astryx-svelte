<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTablePagination } from '$lib/components/table/plugins/pagination/use-table-pagination.js';
	import { generateItems, ITEM_COLUMNS, type TestItem } from './table-pagination-fixture.svelte';

	/**
	 * Upstream's two `CursorTable` helpers from `useTablePagination.test.tsx` —
	 * pagination driven by `hasMore` alone, with neither `totalItems` nor
	 * `totalPages`. The second one omits `pageSize` as well, which is what
	 * `pageSize` being optional here expresses.
	 */
	interface Props {
		count: number;
		hasMore: boolean;
		pageSize?: number;
	}

	const { count, hasMore, pageSize }: Props = $props();

	let page = $state(1);
	// Built once, as upstream's `generateItems(10)` call in the JSX is: no case
	// re-renders this harness with a different count.
	// svelte-ignore state_referenced_locally
	const data = generateItems(count);

	const plugin = useTablePagination<TestItem>(() => ({
		page,
		onPageChange: (p) => (page = p),
		hasMore,
		pageSize
	}));
</script>

<Table {data} columns={ITEM_COLUMNS} idKey="id" plugins={{ pagination: plugin }} />
