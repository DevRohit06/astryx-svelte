<script lang="ts" module>
	import RowStatusCellContent from './row-status-cell-content.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';
	import type { TableRowStatus } from './use-table-row-status.js';

	/** What the status column's `renderCell` needs for one row. */
	export interface RowStatusCellArg {
		/** The row's status, or null for a row with none. */
		status: TableRowStatus | null;
	}

	/**
	 * The status column's one markup slot.
	 *
	 * The batch-13 shape with the batch-16 wrinkle: a `.ts` plugin hook cannot
	 * author a snippet, but this slot *does* need closure data — `getStatus` lives
	 * on the config, not in a context — so it goes through `bindCellSnippet`
	 * rather than being a bare module snippet the way `selection`'s two are.
	 * The status is resolved on the hook side and travels in the argument, which
	 * keeps this file free of the config type's row generic.
	 *
	 * The `null` guard is here rather than in `RowStatusCellContent` because
	 * upstream's `return null` renders **no node**: a component that renders
	 * nothing still leaves Svelte's anchor comment in the cell, one per statusless
	 * row.
	 */
	export { rowStatusCell };
</script>

{#snippet rowStatusCell(arg: RowStatusCellArg | (() => RowStatusCellArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.status}
		<RowStatusCellContent status={a.status} />
	{/if}
{/snippet}
