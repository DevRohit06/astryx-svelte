<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface TreeCellContentProps {
		/** The row this cell belongs to. */
		item: Record<string, unknown>;
		/** The tree column's key, for the default text when it has no renderer. */
		columnKey: string;
		/**
		 * The tree column's own `renderCell`. Upstream *wraps* the original
		 * renderer rather than replacing it, so it is rendered here as the
		 * wrapper's children.
		 */
		inner?: Snippet<[Record<string, unknown>]>;
	}
</script>

<script lang="ts">
	import TreeExpander from './tree-expander.svelte';
	import { useTreeConfig } from './tree-context.svelte.js';
	import { treeCellAttrs, treeLeafSpacerAttrs } from './tree.stylex.js';

	/**
	 * Ported from Astryx's `TreeCellContent` + `TreeCellContentInner`, merged into
	 * one component: upstream's split exists only so the `useSyncExternalStore`
	 * subscription can sit below the `if (!store) return children` guard, which is
	 * a React hooks-rules artifact. `plugins/selection` merges its equivalent pair
	 * for the same reason.
	 *
	 * The two pass-through cases are upstream's and stay exactly as they are: no
	 * tree context at all (the plugin is not installed), and no meta for this row
	 * (a row outside the flattened set). Both render the cell's own content with
	 * no wrapper element, so the DOM is byte-identical to a table without the
	 * plugin.
	 */
	let { item, columnKey, inner }: TreeCellContentProps = $props();

	const config = useTreeConfig();

	const meta = $derived(config?.().getRowMeta(item));
	const cellAttrs = $derived(meta ? treeCellAttrs(meta.level, config?.().indent) : null);
	const spacerAttrs = treeLeafSpacerAttrs();
</script>

{#snippet content()}
	{#if inner}
		{@render inner(item)}
	{:else}
		<!--
			Upstream's own fallback expression, kept verbatim rather than routed
			through `defaultCellRenderer`: the wrapper replaces the column's
			renderer, so BaseTable's default text never runs for the tree column and
			this is the text upstream renders in its place.
		-->
		{String(item[columnKey] ?? '')}
	{/if}
{/snippet}

{#if config && meta && cellAttrs}
	<div class={cellAttrs.class} style={cellAttrs.style}>
		{#if meta.hasChildren}
			<TreeExpander isExpanded={meta.isExpanded} onToggle={() => config().onToggleItem(item)} />
		{:else}
			<span class={spacerAttrs.class} style={spacerAttrs.style}></span>
		{/if}
		{@render content()}
	</div>
{:else}
	{@render content()}
{/if}
