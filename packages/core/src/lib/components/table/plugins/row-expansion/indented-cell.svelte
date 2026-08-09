<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface IndentedCellProps {
		/** Indentation in pixels — `(depth - 1) * INDENT_PER_DEPTH`. */
		indent: number;
		/** Does this row have children? Non-expandable rows get a spacer instead of a chevron. */
		isExpandable: boolean;
		/** Is this row currently expanded? */
		isExpanded: boolean;
		/** Toggles this row. */
		onToggle: () => void;
		/** Accessible name for the chevron, resolved by the hook. */
		ariaLabel: string;
		/** The cell content the column would have rendered without this plugin. */
		content: Snippet;
	}
</script>

<script lang="ts">
	import ExpansionChevron from './expansion-chevron.svelte';
	import { expansionIndentedCellAttrs, expansionPlaceholderAttrs } from './row-expansion.stylex.js';

	/**
	 * A child row's first content cell — ported from the `<div>` Astryx returns
	 * from the wrapped `renderCell` when `depth > 0`.
	 *
	 * `content` is the port's stand-in for upstream's `originalContent` local: a
	 * React node can be computed once and placed in two branches, whereas a
	 * Svelte snippet is rendered where it is used, so the caller passes the
	 * already-branched content in.
	 */
	let { indent, isExpandable, isExpanded, onToggle, ariaLabel, content }: IndentedCellProps =
		$props();

	const cellAttrs = $derived(expansionIndentedCellAttrs(indent));
	const placeholderAttrs = expansionPlaceholderAttrs();
</script>

<div class={cellAttrs.class} style={cellAttrs.style}>
	{#if isExpandable}
		<ExpansionChevron {isExpanded} {onToggle} {ariaLabel} />
	{:else}
		<span class={placeholderAttrs.class} style={placeholderAttrs.style}></span>
	{/if}
	{@render content()}
</div>
