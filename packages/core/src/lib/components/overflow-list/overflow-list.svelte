<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SpacingStep } from '../../internal/types.js';

	/** An item paired with its original index in the list. */
	export interface OverflowItem<T> {
		/** The item's value, as passed in `items`. */
		value: T;
		/** The index of this item in the original `items` array. */
		index: number;
	}

	export interface OverflowListProps<T> extends BaseProps<HTMLDivElement> {
		/**
		 * The items to render. Each is passed to the `item` snippet, which must
		 * render a single element.
		 *
		 * Upstream takes compositional `children` and slices `Children.toArray`;
		 * a Svelte snippet is opaque and cannot be sliced, so the visible row is
		 * driven by data instead — see the port note in the component.
		 */
		items: T[];
		/** Renders one item, given its value and original index. */
		item: Snippet<[T, number]>;
		/**
		 * Gap between items as a spacing token step.
		 * Accepts: 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10
		 * @default 2
		 */
		gap?: SpacingStep;
		/**
		 * Minimum number of items to always show.
		 * @default 0
		 */
		minVisibleItems?: number;
		/**
		 * Maximum number of items to ever show, even when they all fit. The ceiling
		 * partner to `minVisibleItems`; extra items collapse into the overflow
		 * indicator. Leave undefined for no cap. If it is less than
		 * `minVisibleItems`, the floor wins (and a dev-only warning is logged).
		 * @default undefined
		 */
		maxVisibleItems?: number;
		/**
		 * Wrap items across up to this many rows before collapsing the remainder
		 * into the overflow indicator. Leave undefined (or set `1`) for the default
		 * single-line behaviour. A number, not a boolean — unbounded wrapping is a
		 * plain flex-wrap layout, not overflow collapse. Assumes uniform row height.
		 * @default undefined
		 */
		maxRows?: number;
		/**
		 * Which end to collapse items from.
		 * @default 'end'
		 */
		collapseFrom?: 'start' | 'end';
		/**
		 * Which element to observe for overflow calculations.
		 * - `'observeSelf'`: uses the container's own width (default)
		 * - `'observeParent'`: observes the parent element's content width for
		 *   overflow calculations. This keeps the overflow list content-sized
		 *   while still detecting available space for grow-back. Siblings that
		 *   don't fit can wrap and be clipped by the parent's overflow.
		 * @default 'observeSelf'
		 */
		behavior?: 'observeParent' | 'observeSelf';
		/**
		 * Renders the overflow indicator, given the items that are not visible,
		 * each with its original index. Only rendered when there are overflowing
		 * items. Automatically measured in a hidden container to reserve the
		 * correct amount of space.
		 */
		overflowRenderer?: Snippet<[OverflowItem<T>[]]>;
	}
</script>

<script lang="ts" generics="T">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useOverflow } from '../../hooks/use-overflow.svelte.js';
	import {
		overflowListContainerAttrs,
		overflowListMeasureAttrs,
		overflowListMeasureIndicatorAttrs,
		spacingToPx
	} from './overflow-list.stylex.js';

	/**
	 * A horizontal list that hides items that don't fit and shows an overflow
	 * indicator. A hidden measurement container holds every item, so which items
	 * fit is decided without flickering; the indicator is measured there too, so
	 * no manual width is needed.
	 *
	 * ## Port note
	 *
	 * Upstream is compositional — `children` is arbitrary elements, sliced through
	 * `Children.toArray`. A Svelte snippet is one opaque unit that can be rendered
	 * twice but never *sliced*, so this takes `items` + an `item` snippet and
	 * slices the data, exactly the shape `useOverflow`'s docstring anticipates.
	 * The rendered DOM, classes and behaviour are otherwise identical; the API
	 * difference is recorded in `port/debts.md` under "Known debts", alongside the same
	 * forced snippet translations in `Popover` and `Tooltip`.
	 */
	const {
		items,
		item,
		gap = 2,
		minVisibleItems = 0,
		maxVisibleItems,
		maxRows,
		collapseFrom = 'end',
		behavior = 'observeSelf',
		overflowRenderer,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: OverflowListProps<T> = $props();

	const overflow = useOverflow(
		() => items.length,
		() => ({
			gap: spacingToPx[gap],
			minVisibleItems,
			maxVisibleItems,
			maxRows,
			collapseFrom,
			behavior
		})
	);

	const observeParent = $derived(behavior === 'observeParent');
	const isMultiRow = $derived(maxRows != null && maxRows > 1);

	const allItems = $derived<OverflowItem<T>[]>(items.map((value, index) => ({ value, index })));

	const visibleItems = $derived(
		collapseFrom === 'end'
			? allItems.slice(0, overflow.visibleCount)
			: allItems.slice(items.length - overflow.visibleCount)
	);
	const overflowItems = $derived(
		collapseFrom === 'end'
			? allItems.slice(overflow.visibleCount)
			: allItems.slice(0, items.length - overflow.visibleCount)
	);

	const measure = $derived(overflowListMeasureAttrs(gap));
	const measureIndicator = overflowListMeasureIndicatorAttrs();
	const theme = themeProps('overflow-list');
	const container = $derived(
		overflowListContainerAttrs({
			gap,
			fillParent: observeParent && overflow.hasOverflow,
			isMultiRow,
			maxRows,
			rowHeight: overflow.rowHeight,
			xstyle
		})
	);
</script>

<!-- Hidden measurement container -->
<div
	{@attach overflow.attachMeasure}
	aria-hidden="true"
	inert
	class={measure.class}
	style={measure.style}
>
	{#each items as value, index (index)}
		{@render item(value, index)}
	{/each}
	{#if overflowRenderer}
		<div class={measureIndicator.class} style={measureIndicator.style}>
			{@render overflowRenderer(allItems)}
		</div>
	{/if}
</div>

<!-- Visible container -->
<div
	{@attach overflow.attachContainer}
	class={cx(theme.class, container.class, className)}
	style={mergeStyle(container.style, styleProp as string | undefined)}
	{...rest}
>
	{#if collapseFrom === 'start' && overflow.hasOverflow && overflowRenderer}
		{@render overflowRenderer(overflowItems)}
	{/if}
	{#each visibleItems as { value, index } (index)}
		{@render item(value, index)}
	{/each}
	{#if collapseFrom === 'end' && overflow.hasOverflow && overflowRenderer}
		{@render overflowRenderer(overflowItems)}
	{/if}
</div>
