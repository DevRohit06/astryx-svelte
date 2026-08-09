<script lang="ts" module>
	import type { SpacingStep } from '$lib/internal/types.js';

	/**
	 * One item, in the shape upstream writes as `<button data-w="40">A</button>`.
	 *
	 * `OverflowList` is compositional upstream; ours takes `items` + an `item`
	 * snippet (see the component's port note). Each upstream child becomes an entry
	 * here — its `data-w` and its label — and the `item` snippet below renders the
	 * same `<button type="button" data-w={w}>{label}</button>` the test harness
	 * measures through the monkeypatched `offsetWidth`.
	 */
	export interface OverflowItemData {
		w: number;
		label: string;
	}

	export interface OverflowListFixtureProps {
		items: OverflowItemData[];
		gap?: SpacingStep;
		minVisibleItems?: number;
		maxVisibleItems?: number;
		maxRows?: number;
		collapseFrom?: 'start' | 'end';
		behavior?: 'observeParent' | 'observeSelf';
		/** Whether to pass an `overflowRenderer` at all. */
		withIndicator?: boolean;
		/** The indicator's label, i.e. upstream's `indicator(label)`. */
		indicatorLabel?: string;
		/** The indicator's `data-w`, i.e. upstream's `indicator(label, width)`. */
		indicatorWidth?: number;
		/** Everything else — `data-w`, `data-testid`, `aria-label`, an attachment. */
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import OverflowList from '$lib/components/overflow-list/overflow-list.svelte';
	import type { OverflowItem } from '$lib/components/overflow-list/overflow-list.svelte';

	const {
		items,
		gap,
		minVisibleItems,
		maxVisibleItems,
		maxRows,
		collapseFrom,
		behavior,
		withIndicator = false,
		indicatorLabel = 'more:',
		indicatorWidth = 40,
		...rest
	}: OverflowListFixtureProps = $props();
</script>

{#snippet renderItem(it: OverflowItemData)}
	<button type="button" data-w={it.w}>{it.label}</button>
{/snippet}

{#snippet indicator(overflowItems: OverflowItem<OverflowItemData>[])}
	<span data-w={indicatorWidth}>{indicatorLabel}{overflowItems.map((i) => i.index).join(',')}</span>
{/snippet}

<OverflowList
	{items}
	item={renderItem}
	{gap}
	{minVisibleItems}
	{maxVisibleItems}
	{maxRows}
	{collapseFrom}
	{behavior}
	overflowRenderer={withIndicator ? indicator : undefined}
	{...rest}
/>
