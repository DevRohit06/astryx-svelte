<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import TreeCellContent from './tree-cell-content.svelte';
	import TreeExpandAllToggle from './tree-expand-all-toggle.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';
	import { treeHeaderCellAttrs } from './tree.stylex.js';

	/** What the tree column's header needs in order to render the expand-all toggle. */
	export interface TreeHeaderArg {
		isAllExpanded: boolean | 'indeterminate';
		onExpandAll: () => void;
		onCollapseAll: () => void;
		/** The header content the slot already held, wrapped rather than replaced. */
		inner?: string | Snippet;
	}

	/** What the tree column's wrapped `renderCell` needs for one row. */
	export interface TreeCellArg {
		/** The row, folded into the argument so the slot stays a one-parameter snippet. */
		item: Record<string, unknown>;
		/** The tree column's key, for the default text when it has no renderer. */
		columnKey: string;
		/** The column's own `renderCell`, wrapped rather than replaced. */
		inner?: Snippet<[Record<string, unknown>]>;
	}

	/**
	 * The tree column's wrapped `renderCell`.
	 *
	 * This is the one slot in the plugin that needs *both* halves of the
	 * `bind-snippet` story at once, so it is worth stating the shape here.
	 * Upstream's transform builds
	 *
	 * ```tsx
	 * renderCell: item => <TreeCellContent item={item}>{originalRenderCell?.(item)}</TreeCellContent>
	 * ```
	 *
	 * — a closure over **per-column** data (the column's own renderer and key)
	 * that is still called with **per-row** data (the item). A `.ts` hook cannot
	 * author a snippet, and `createSlotBinder` collapses its snippet to a
	 * zero-parameter one, which a `renderCell` cannot be: `BaseTable` calls it as
	 * `renderCell(item)`.
	 *
	 * So the hook binds it with `createCellSlotBinder`, keyed by `column.key`,
	 * which keeps the caller's row parameter open and **folds the row into the
	 * single object argument**. That is why this snippet takes one parameter and
	 * `item` is a member of {@link TreeCellArg}: it is the rule every other slot
	 * in the batch follows, and a second native parameter would mean a body where
	 * one argument needs `unwrapSlotArg` and the next does not. The argument
	 * always arrives as a getter, hence `unwrapSlotArg`, whose invariant that the
	 * bound argument is an object holds here too.
	 *
	 * The binding is *keyed* because `{@render}` branches on the bound snippet's
	 * function identity: an unkeyed binding would hand it a new function whenever
	 * `transformColumns` re-ran and rebuild every tree cell — replacing the
	 * expander a keyboard user just pressed instead of updating it.
	 *
	 * `treeHeader` is the same story one slot over, minus the row parameter: it
	 * closes over the aggregate state, both handlers and whatever content a prior
	 * plugin left in the header, so it goes through the plain `createSlotBinder`
	 * keyed by `column.key`. The keying matters for the same reason — a keyboard
	 * user pressing expand-all must not have the button replaced under them.
	 */
	export { treeCell, treeHeader };
</script>

{#snippet treeCell(arg: TreeCellArg | (() => TreeCellArg))}
	{@const a = unwrapSlotArg(arg)}
	<TreeCellContent item={a.item} columnKey={a.columnKey} inner={a.inner} />
{/snippet}

<!--
	Upstream wraps the header label and the toggle in one inline-flex row so the
	chevron sits to the *inline-start* of the title on the same line: `BaseTable`
	applies its own flex row only for the `after` slot, so a bare `before` would
	stack above the label in the block-level `<th>`.
-->
{#snippet treeHeader(arg: TreeHeaderArg | (() => TreeHeaderArg))}
	{@const a = unwrapSlotArg(arg)}
	{@const attrs = treeHeaderCellAttrs()}
	<span class={attrs.class} style={attrs.style}>
		<TreeExpandAllToggle
			isAllExpanded={a.isAllExpanded}
			onExpandAll={a.onExpandAll}
			onCollapseAll={a.onCollapseAll}
		/>
		{#if typeof a.inner === 'string'}{a.inner}{:else if a.inner}{@render a.inner()}{/if}
	</span>
{/snippet}
