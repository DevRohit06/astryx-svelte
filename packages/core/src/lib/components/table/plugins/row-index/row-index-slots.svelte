<script lang="ts" module>
	import RowIndexCell from './row-index-cell.svelte';

	/**
	 * The index column's `renderCell`, as a module-exported snippet.
	 * See `plugins/selection/selection-slots.svelte` for why this is the shape.
	 */
	export { rowIndexCell };
</script>

{#snippet rowIndexCell(item: Record<string, unknown>)}
	<RowIndexCell {item} />
{/snippet}
