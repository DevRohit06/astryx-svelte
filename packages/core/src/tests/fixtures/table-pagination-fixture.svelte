<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface TestItem extends Record<string, unknown> {
		id: string;
		name: string;
		value: number;
	}

	export function generateItems(count: number): TestItem[] {
		return Array.from({ length: count }, (_, i) => ({
			id: String(i + 1),
			name: `Item ${i + 1}`,
			value: (i + 1) * 10
		}));
	}

	export const ITEM_COLUMNS: TableColumn<TestItem>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'value', header: 'Value' }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTablePagination } from '$lib/components/table/plugins/pagination/use-table-pagination.js';
	import { paginateData } from '$lib/components/table/plugins/pagination/paginate-data.js';

	/**
	 * Upstream's `PaginatedTable` helper from `useTablePagination.test.tsx`, prop
	 * for prop — including the `totalItems` expression that lets a case override
	 * the data shape with `totalPages` / `hasMore`.
	 */
	interface Props {
		data: TestItem[];
		pageSize?: number;
		position?: 'below' | 'above' | 'both' | 'none';
		align?: 'start' | 'center' | 'end';
		variant?: 'pages' | 'count' | 'compact' | 'dots' | 'none';
		size?: 'sm' | 'md';
		label?: string;
		pageSizeOptions?: number[];
		totalPagesProp?: number;
		hasMore?: boolean;
	}

	const {
		data,
		pageSize = 10,
		position,
		align,
		variant,
		size,
		label,
		pageSizeOptions,
		totalPagesProp,
		hasMore
	}: Props = $props();

	let page = $state(1);
	// svelte-ignore state_referenced_locally
	let currentPageSize = $state(pageSize);

	const plugin = useTablePagination<TestItem>(() => ({
		page,
		onPageChange: (p) => (page = p),
		// Allow overriding with totalPages/hasMore for specific test scenarios
		totalItems: totalPagesProp == null && hasMore == null ? data.length : undefined,
		totalPages: totalPagesProp,
		hasMore,
		pageSize: currentPageSize,
		position,
		align,
		variant,
		size,
		label,
		pageSizeOptions,
		onPageSizeChange: pageSizeOptions ? (s) => (currentPageSize = s) : undefined
	}));
</script>

<Table
	data={paginateData(data, page, currentPageSize)}
	columns={ITEM_COLUMNS}
	idKey="id"
	plugins={{ pagination: plugin }}
/>
