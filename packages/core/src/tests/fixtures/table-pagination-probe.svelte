<script lang="ts">
	import type { TablePlugin } from '$lib/components/table/table-types.js';
	import { useTablePagination } from '$lib/components/table/plugins/pagination/use-table-pagination.js';
	import type { TestItem } from './table-pagination-fixture.svelte';

	/**
	 * The `renderHook` counterpart for `useTablePagination`: it calls the hook and
	 * renders nothing, exposing the plugin through an instance export that
	 * `render(...).component` hands back. Upstream's `result.current`.
	 *
	 * `page` and `pageSize` are local state so a case can change them the way a
	 * consumer does and then re-read the plugin, which is what the `-perf` suite's
	 * identity cases need.
	 */
	interface Props {
		initialPage?: number;
		initialPageSize?: number;
		totalItems?: number;
	}

	const { initialPage = 1, initialPageSize = 5, totalItems = 50 }: Props = $props();

	// svelte-ignore state_referenced_locally
	let page = $state(initialPage);
	// svelte-ignore state_referenced_locally
	let pageSize = $state(initialPageSize);

	const plugin = useTablePagination<TestItem>(() => ({
		page,
		onPageChange: (p) => (page = p),
		totalItems,
		pageSize,
		onPageSizeChange: (s) => (pageSize = s),
		pageSizeOptions: [5, 10, 20]
	}));

	export const api = {
		get plugin(): TablePlugin<TestItem> {
			return plugin;
		},
		get page(): number {
			return page;
		},
		setPage: (p: number): void => {
			page = p;
		},
		setPageSize: (s: number): void => {
			pageSize = s;
		}
	};
</script>
