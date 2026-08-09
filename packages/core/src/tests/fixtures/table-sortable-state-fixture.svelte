<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		age: number;
		department: string;
		salary: number;
	}

	export const EMPLOYEES: Employee[] = [
		{ id: '1', name: 'Charlie', age: 35, department: 'Engineering', salary: 120000 },
		{ id: '2', name: 'Alice', age: 28, department: 'Design', salary: 95000 },
		{ id: '3', name: 'Bob', age: 42, department: 'Engineering', salary: 140000 },
		{ id: '4', name: 'Diana', age: 31, department: 'PM', salary: 110000 }
	];

	export const EMPLOYEE_COLUMNS: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'age', header: 'Age', sortable: true },
		{ key: 'department', header: 'Department', sortable: true },
		{ key: 'salary', header: 'Salary', sortable: true }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSortable } from '$lib/components/table/plugins/sortable/use-table-sortable.js';
	import type { TableSortState } from '$lib/components/table/plugins/sortable/use-table-sortable.js';
	import {
		useTableSortableState,
		type TableSortComparator
	} from '$lib/components/table/plugins/sortable/use-table-sortable-state.svelte.js';

	/**
	 * Upstream's `SortableStateTable` helper from `useTableSortableState.test.tsx`.
	 *
	 * `api` is the counterpart to `renderHook`'s `result.current`: the two NaN
	 * cases and the `applySort` case read the hook's return value directly. It is
	 * deliberately a bag of **getters** — destructuring `sortedData` here would
	 * snapshot the first sort and never re-sort, which is the hazard the hook's
	 * own header documents.
	 */
	interface Props {
		data?: Employee[];
		columns?: TableColumn<Employee>[];
		defaultSort?: TableSortState;
		sort?: TableSortState;
		onSortChange?: (sort: TableSortState) => void;
		comparators?: Partial<Record<string, TableSortComparator<Employee>>>;
		allowUnsortedState?: boolean;
		isMultiSortEnabled?: boolean;
	}

	const {
		data = EMPLOYEES,
		columns: cols = EMPLOYEE_COLUMNS,
		defaultSort,
		sort: controlledSort,
		onSortChange: controlledOnSortChange,
		comparators,
		allowUnsortedState,
		isMultiSortEnabled
	}: Props = $props();

	const sortState = useTableSortableState<Employee>(() => ({
		data,
		defaultSort,
		sort: controlledSort,
		onSortChange: controlledOnSortChange,
		comparators,
		allowUnsortedState,
		isMultiSortEnabled
	}));

	const sortPlugin = useTableSortable<Employee>(() => sortState.sortConfig);

	export const api = {
		get sortedData(): Employee[] {
			return sortState.sortedData;
		},
		get sort(): TableSortState {
			return sortState.sort;
		},
		applySort: (input: Employee[]): Employee[] => sortState.applySort(input)
	};
</script>

<Table data={sortState.sortedData} columns={cols} idKey="id" plugins={{ sort: sortPlugin }} />
