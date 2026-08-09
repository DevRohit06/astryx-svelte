<script lang="ts" module>
	export interface RowIndexCellProps {
		/** The row item whose ordinal this cell shows. */
		item: Record<string, unknown>;
	}
</script>

<script lang="ts">
	import { useRowIndexContext } from './row-index-context.svelte.js';
	import { rowIndexAttrs } from './row-index.stylex.js';

	/**
	 * `renderCell` for the synthetic index column, ported from the arrow function
	 * upstream declares inline in `transformColumns`.
	 *
	 * Upstream returns `null` for an item the lookup does not know — a row that
	 * is not in the `data` array the plugin was configured with. `{#if}` is that.
	 */
	let { item }: RowIndexCellProps = $props();

	const ctx = useRowIndexContext();
	const attrs = rowIndexAttrs();

	const index = $derived(ctx?.().lookup(item));
</script>

{#if index != null}
	<span class={attrs.class} style={attrs.style}>{index + (ctx?.().startFrom ?? 1)}</span>
{/if}
