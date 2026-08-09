<script lang="ts" module>
	export interface SelectionFixtureRow extends Record<string, unknown> {
		id: string;
		name: string;
	}
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import { useTableSelectionState } from '$lib/components/table/plugins/selection/use-table-selection-state.svelte.js';
	import { useTableRowIndex } from '$lib/components/table/plugins/row-index/use-table-row-index.svelte.js';

	/**
	 * Drives `useTableSelectionState` → `useTableSelection` the way a consumer
	 * does, and optionally stacks `useTableRowIndex` on top so the two plugins'
	 * synthetic columns are exercised together.
	 */
	interface Props {
		data: SelectionFixtureRow[];
		withRowIndex?: boolean;
		getIsItemSelectable?: (item: SelectionFixtureRow) => boolean;
		getIsItemEnabled?: (item: SelectionFixtureRow) => boolean;
	}

	const { data, withRowIndex = false, getIsItemSelectable, getIsItemEnabled }: Props = $props();

	let selectedKeys = $state(new Set<string>());

	const { selectionConfig } = useTableSelectionState<SelectionFixtureRow>(() => ({
		data,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next),
		...(getIsItemSelectable ? { getIsItemSelectable } : {}),
		...(getIsItemEnabled ? { getIsItemEnabled } : {})
	}));

	const selection = useTableSelection<SelectionFixtureRow>(() => selectionConfig);
	const rowIndex = useTableRowIndex<SelectionFixtureRow>(() => ({ data }));

	const columns = [{ key: 'name', header: 'Name' }];

	/** Read by the assertions — the selection the fixture currently holds. */
	export const selected = {
		get keys(): string[] {
			return [...selectedKeys].sort();
		}
	};
</script>

<Table
	{data}
	{columns}
	idKey="id"
	plugins={withRowIndex ? { selection, rowIndex } : { selection }}
/>
