<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		ColumnWidth,
		TableColumn,
		TableColumnAlign
	} from '$lib/components/table/table-types.js';

	/** Every fixture row is an open record — the shape `Table` is generic over. */
	export type TableFixtureRow = Record<string, unknown>;

	/**
	 * A column as *data*. `headerSlot` and `cellSlot` name a snippet declared in
	 * this fixture rather than carrying one, because a Svelte snippet can only be
	 * authored in a template — the same "name the slot by string" move
	 * `slot-probe` and `tree-list-fixture` make.
	 */
	export interface TableFixtureColumn {
		key: string;
		header?: string;
		/** `full-name` → `<span data-testid="custom-header">Full Name</span>`. */
		headerSlot?: 'full-name';
		/**
		 * `bold-name` → `<strong data-testid="bold-name">{item.name}</strong>`;
		 * `custom-name` → `<span data-testid="custom">{item.name}</span>`.
		 */
		cellSlot?: 'bold-name' | 'custom-name';
		width?: ColumnWidth;
		align?: TableColumnAlign;
	}

	function withSlots(
		columns: TableFixtureColumn[],
		headers: Record<string, Snippet>,
		cells: Record<string, Snippet<[TableFixtureRow]>>
	): TableColumn<TableFixtureRow>[] {
		return columns.map(({ headerSlot, cellSlot, header, ...column }) => ({
			...column,
			header: headerSlot != null ? headers[headerSlot] : header,
			renderCell: cellSlot != null ? cells[cellSlot] : undefined
		}));
	}
</script>

<script lang="ts">
	import BaseTable from '$lib/components/table/base-table.svelte';
	import Table from '$lib/components/table/table.svelte';

	/**
	 * Data-mode `Table` / `BaseTable` for the cases whose columns carry a snippet
	 * (`header`, `renderCell`) or whose `emptyState` is one.
	 */
	interface Props {
		/** Render the unstyled `BaseTable` instead of the styled `Table`. */
		base?: boolean;
		data?: TableFixtureRow[];
		columns?: TableFixtureColumn[];
		/** When set, `emptyState` is a snippet rendering `<div data-testid="empty">`. */
		emptyText?: string;
		/** Everything else, forwarded to the table. */
		rest?: Record<string, unknown>;
	}

	const { base = false, data, columns, emptyText, rest = {} }: Props = $props();

	function resolve(list: TableFixtureColumn[]): TableColumn<TableFixtureRow>[] {
		return withSlots(
			list,
			{ 'full-name': fullNameHeader },
			{ 'bold-name': boldName, 'custom-name': customName }
		);
	}
</script>

{#snippet fullNameHeader()}
	<span data-testid="custom-header">Full Name</span>
{/snippet}

{#snippet boldName(item: TableFixtureRow)}
	<strong data-testid="bold-name">{item.name}</strong>
{/snippet}

{#snippet customName(item: TableFixtureRow)}
	<span data-testid="custom">{item.name}</span>
{/snippet}

{#snippet emptyState()}
	<div data-testid="empty">{emptyText}</div>
{/snippet}

{#if base}
	<BaseTable
		{data}
		columns={columns ? resolve(columns) : undefined}
		emptyState={emptyText != null ? emptyState : undefined}
		{...rest}
	/>
{:else}
	<Table
		{data}
		columns={columns ? resolve(columns) : undefined}
		emptyState={emptyText != null ? emptyState : undefined}
		{...rest}
	/>
{/if}
