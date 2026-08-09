<script lang="ts" module>
	import SelectAllCheckbox from './select-all-checkbox.svelte';
	import SelectionCellContent from './selection-cell-content.svelte';
	import { selectionCenterAttrs } from './selection.stylex.js';

	/**
	 * The selection column's two markup slots, as **module-exported snippets**.
	 *
	 * This is the batch-13 shape, and it is worth stating once here because every
	 * plugin uses it. A `TableColumn.header` / `renderCell` is a `Snippet`, and a
	 * plugin hook is a `.ts` module — it cannot author one. Svelte does let a
	 * `.svelte` file *export* a snippet from `<script module>`, provided the
	 * snippet references only module-scope bindings; an `import` is module scope,
	 * so a snippet may render an imported component freely.
	 *
	 * That is the whole trick, and it works because upstream already put the
	 * plugin's state in a **context** rather than in the closure: upstream's
	 * `header` is `<div><SelectAllCheckbox /></div>` with no props, and its
	 * `renderCell` is `<div><SelectionCellContent item={item} /></div>` — both
	 * read the store from context. So the snippets need no closure either, and
	 * the port's markup is upstream's markup verbatim.
	 *
	 * The component's own default export is an empty component and is never used.
	 */
	export { selectionHeader, selectionCell };

	const center = selectionCenterAttrs();
</script>

{#snippet selectionHeader()}
	<div class={center.class} style={center.style}>
		<SelectAllCheckbox />
	</div>
{/snippet}

{#snippet selectionCell(item: Record<string, unknown>)}
	<div class={center.class} style={center.style}>
		<SelectionCellContent {item} />
	</div>
{/snippet}
