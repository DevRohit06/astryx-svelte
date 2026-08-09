<script lang="ts" module>
	import { pixel } from '$lib/components/table/column-utils.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface ResizeRow extends Record<string, unknown> {
		id: string;
		name: string;
		role: string;
	}

	/** Upstream's `testData`. */
	export const testData: ResizeRow[] = [
		{ id: '1', name: 'Alice', role: 'engineer' },
		{ id: '2', name: 'Bob', role: 'admin' },
		{ id: '3', name: 'Charlie', role: 'designer' }
	];

	/** Upstream's `testColumns` — no explicit width, so both are proportional. */
	export const testColumns: TableColumn<ResizeRow>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'role', header: 'Role' }
	];

	/** Upstream's `pixelColumns` — both columns get handles and resize directly. */
	export const pixelColumns: TableColumn<ResizeRow>[] = [
		{ key: 'name', header: 'Name', width: pixel(200) },
		{ key: 'role', header: 'Role', width: pixel(200) }
	];

	const EMPTY_WIDTHS: Record<string, number> = {};
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableColumnResize } from '$lib/components/table/plugins/column-resize/use-table-column-resize.js';

	/**
	 * Upstream's `ResizeTable` harness from
	 * `Table/plugins/columnResize/useTableColumnResize.test.tsx`.
	 *
	 * `useState(initialWidths)` becomes `$state({ ...initialWidths })` — seeded at
	 * init and thereafter owned by the fixture, which is what `useState`'s initial
	 * value is. The `onColumnResizeEnd` shim is upstream's verbatim: it merges the
	 * whole updates map into state and forwards the *first* entry to the
	 * single-column spy the assertions use.
	 */
	interface Props {
		columnWidths?: Record<string, number>;
		/** Spy receives a single entry, as upstream's does. */
		onColumnResizeEnd?: (event: { columnKey: string; newWidth: number }) => void;
		minWidth?: number;
		maxWidth?: number;
		columns?: TableColumn<ResizeRow>[];
	}

	const {
		columnWidths: initialWidths = EMPTY_WIDTHS,
		onColumnResizeEnd,
		minWidth,
		maxWidth,
		columns: columnsProp = testColumns
	}: Props = $props();

	// Seeded once, exactly as `useState(initialWidths)` is — a later prop change
	// is ignored on both sides, which is what the "initial" in the name means.
	// svelte-ignore state_referenced_locally
	let columnWidths = $state<Record<string, number>>({ ...initialWidths });

	const resize = useTableColumnResize<ResizeRow>(() => ({
		columnWidths,
		onColumnResizeEnd: (updates) => {
			columnWidths = { ...columnWidths, ...updates };
			// Forward the first update entry to the single-column spy.
			const [[columnKey, newWidth]] = Object.entries(updates);
			onColumnResizeEnd?.({ columnKey, newWidth });
		},
		minWidth,
		maxWidth,
		columns: columnsProp as TableColumn<Record<string, unknown>>[]
	}));
</script>

<Table data={testData} columns={columnsProp} idKey="id" plugins={{ resize }} />
