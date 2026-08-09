<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface SortableUser extends Record<string, unknown> {
		name: string;
		age: number;
		email: string;
	}

	export const USERS: SortableUser[] = [
		{ name: 'Alice', age: 30, email: 'alice@example.com' },
		{ name: 'Bob', age: 25, email: 'bob@example.com' }
	];

	export const SORTABLE_COLUMNS: TableColumn<SortableUser>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'age', header: 'Age', sortable: true },
		{ key: 'email', header: 'Email' }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import type { TablePlugin } from '$lib/components/table/table-types.js';
	import {
		useTableSortable,
		type TableSortState
	} from '$lib/components/table/plugins/sortable/use-table-sortable.js';

	/**
	 * Upstream's `SortableTable` helper from `useTableSortable.test.tsx`, prop for
	 * prop: it owns the sort state, forwards every change to an optional spy, and
	 * hands the plugin to `<Table>`.
	 *
	 * `captured` is the counterpart to upstream's `Capture` component — the hook's
	 * return value reachable from a test, which is what `renderHook` gives React.
	 */
	interface Props {
		columns?: TableColumn<SortableUser>[];
		data?: SortableUser[];
		initialSort?: TableSortState;
		allowUnsortedState?: boolean;
		isMultiSortEnabled?: boolean;
		onSortChange?: (sort: TableSortState) => void;
	}

	const {
		columns = SORTABLE_COLUMNS,
		data = USERS,
		initialSort = [],
		allowUnsortedState = false,
		isMultiSortEnabled = false,
		onSortChange: externalOnSortChange
	}: Props = $props();

	// Seeded once from the prop, as upstream's `useState(initialSort)` is — the
	// "initial" in the name is the point, so capturing the first value is correct.
	// svelte-ignore state_referenced_locally
	let sort = $state<TableSortState>(initialSort);

	function handleSortChange(newSort: TableSortState): void {
		sort = newSort;
		externalOnSortChange?.(newSort);
	}

	// The config getter is re-read on every plugin call, so `sort` is always the
	// live value — the reason the hook takes a getter rather than a config object.
	const sortPlugin = useTableSortable<SortableUser>(() => ({
		sort,
		onSortChange: handleSortChange,
		allowUnsortedState,
		isMultiSortEnabled
	}));

	/** Read by the assertions. */
	export const captured = {
		get plugin(): TablePlugin<SortableUser> {
			return sortPlugin;
		},
		get sort(): TableSortState {
			return sort;
		}
	};
</script>

<Table {data} {columns} plugins={{ sort: sortPlugin }} />
