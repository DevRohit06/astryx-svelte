<script lang="ts" module>
	import type { PowerSearchConfig } from '$lib/components/power-search/types.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';
	import type { TableFilterVariant } from '$lib/components/table/plugins/filtering/use-table-filtering.js';

	export interface TestRow extends Record<string, unknown> {
		id: string;
		name: string;
		status: string;
		age: number;
		tags: string;
	}

	/** Upstream's `testData`. */
	export const testData: TestRow[] = [
		{ id: '1', name: 'Alice', status: 'active', age: 30, tags: 'admin' },
		{ id: '2', name: 'Bob', status: 'inactive', age: 25, tags: 'user' },
		{ id: '3', name: 'Charlie', status: 'active', age: 35, tags: 'user' }
	];

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' }
	];

	const tagOptions = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'user', label: 'User' }
	];

	/** Upstream's `searchConfig`. */
	export const searchConfig: PowerSearchConfig = {
		name: 'test',
		fields: [
			{
				key: 'name',
				label: 'Name',
				defaultOperator: 'contains',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
			},
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [{ key: 'is', label: 'is', value: { type: 'enum', values: statusOptions } }]
			},
			{
				key: 'age',
				label: 'Age',
				defaultOperator: 'equals',
				operators: [
					{
						key: 'equals',
						label: 'equals',
						value: { type: 'integer', minValue: 0, maxValue: 120 }
					}
				]
			},
			{
				key: 'tags',
				label: 'Tags',
				defaultOperator: 'includes',
				operators: [
					{
						key: 'includes',
						label: 'includes',
						value: { type: 'enum_list', values: tagOptions }
					}
				]
			}
		]
	};

	/** Upstream's `defaultColumns`. */
	export const defaultColumns: TableColumn<TestRow>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'status', header: 'Status', filter: 'status' },
		{ key: 'age', header: 'Age', filter: 'age' }
	];

	/** Upstream's `allFilterColumns`. */
	export const allFilterColumns: TableColumn<TestRow>[] = [
		{ key: 'name', header: 'Name', filter: 'name' },
		{ key: 'status', header: 'Status', filter: 'status' },
		{ key: 'age', header: 'Age', filter: 'age' },
		{ key: 'tags', header: 'Tags', filter: 'tags' }
	];
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableFiltering } from '$lib/components/table/plugins/filtering/use-table-filtering.js';
	import type {
		TableFilterState,
		TableFilterValue
	} from '$lib/components/table/plugins/filtering/use-table-filtering.js';

	/**
	 * Upstream's `FilterTable` harness. The `onFilterChange` reducer is
	 * upstream's verbatim, including the destructure-and-drop that removes a key
	 * rather than assigning `undefined` to it.
	 */
	interface Props {
		columns?: TableColumn<TestRow>[];
		variant?: TableFilterVariant;
	}

	const { columns = defaultColumns, variant = 'popover' }: Props = $props();

	let filters = $state<TableFilterState>({});

	const filterPlugin = useTableFiltering<TestRow>(() => ({
		filters,
		onFilterChange: (key: string, value: TableFilterValue | null) => {
			if (value == null) {
				const { [key]: _removed, ...next } = filters;
				filters = next;
				return;
			}
			filters = { ...filters, [key]: value };
		},
		variant,
		searchConfig
	}));
</script>

<Table data={testData} {columns} idKey="id" plugins={{ filter: filterPlugin }} />
