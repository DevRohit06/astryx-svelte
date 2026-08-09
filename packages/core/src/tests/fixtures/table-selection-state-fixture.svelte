<script lang="ts" module>
	export interface SelectionStateItem extends Record<string, unknown> {
		id: string;
		name: string;
		isLocked: boolean;
		isHidden: boolean;
	}

	/** Upstream's module-level `EMPTY_SET` — a stable default, never mutated. */
	const EMPTY_SET: ReadonlySet<string> = new Set<string>();
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import { useTableSelectionState } from '$lib/components/table/plugins/selection/use-table-selection-state.svelte.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	/**
	 * Upstream's `StateHelperTable` from `useTableSelectionState.test.tsx`.
	 *
	 * `setSelectedKeys` is a plain setter here (the port documents why React's
	 * updater form has no counterpart), so the assignment is direct.
	 */
	interface Props {
		data: SelectionStateItem[];
		getIsItemEnabled?: (item: SelectionStateItem) => boolean;
		getIsItemSelectable?: (item: SelectionStateItem) => boolean;
		initialSelected?: ReadonlySet<string>;
	}

	const {
		data,
		getIsItemEnabled,
		getIsItemSelectable,
		initialSelected = EMPTY_SET
	}: Props = $props();

	// The initial value is the whole point, exactly as upstream's
	// `useState(initialSelected)` is — no case re-renders with a different one.
	// svelte-ignore state_referenced_locally
	let selectedKeys = $state(new Set<string>(initialSelected));

	const { selectionConfig } = useTableSelectionState<SelectionStateItem>(() => ({
		data,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys: (next) => (selectedKeys = next),
		getIsItemEnabled,
		getIsItemSelectable
	}));

	const selection = useTableSelection<SelectionStateItem>(() => selectionConfig);

	const columns: TableColumn<SelectionStateItem>[] = [{ key: 'name', header: 'Name' }];
</script>

<Table {data} {columns} idKey="id" plugins={{ selection }} />
