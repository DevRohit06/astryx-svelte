<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SpacingStep } from '../../internal/types.js';
	import type { CarouselGap } from './carousel.stylex.js';

	/**
	 * The imperative control surface a `Carousel` exposes. Its methods drive the
	 * same native-scroll machinery as the built-in buttons, so they respect RTL,
	 * reduced motion and `hasLoop`.
	 *
	 * Upstream reaches it through a `handleRef` prop and `useImperativeHandle`;
	 * Svelte's counterpart is the component instance itself, so these are instance
	 * exports and `bind:this` is the seam — the arrangement `Tokenizer`, `SideNav`,
	 * `Calendar`, `PowerSearch` and `ChatComposerInput` already established. There
	 * is therefore no `handleRef` prop; the type still describes exactly what
	 * upstream's does.
	 *
	 * @example
	 * ```svelte
	 * let carousel: CarouselHandle;
	 * <Carousel bind:this={carousel} {items} {item} />
	 * <button onclick={() => carousel.scrollTo(0)}>Back to start</button>
	 * ```
	 */
	export interface CarouselHandle {
		/**
		 * Scroll forward by roughly one viewport. With `hasLoop`, wraps to the
		 * start once the end is reached.
		 */
		scrollNext(): void;
		/**
		 * Scroll backward by roughly one viewport. With `hasLoop`, wraps to the
		 * end once the start is reached.
		 */
		scrollPrev(): void;
		/**
		 * Scroll the item at the given 0-based index to the start edge. The index
		 * is clamped to the item range, and only the carousel scrolls — the page
		 * position is left untouched.
		 */
		scrollTo(index: number): void;
		/**
		 * Whether there is scrollable content past the trailing edge. With
		 * `hasLoop`, returns true whenever the content overflows, since wrapping is
		 * always available. Reads live state — safe to call in an event handler.
		 */
		canScrollNext(): boolean;
		/**
		 * Whether there is scrollable content past the leading edge. With
		 * `hasLoop`, returns true whenever the content overflows. Reads live state.
		 */
		canScrollPrev(): boolean;
	}

	export interface CarouselProps<T> extends BaseProps<HTMLDivElement> {
		/**
		 * The items to render, each wrapped in its own snap target.
		 *
		 * Upstream takes compositional `children` and wraps every child with
		 * `Children.map`; a Svelte snippet is one opaque unit and cannot be mapped
		 * over, so the row is driven by data — the same translation `OverflowList`
		 * settled on. See the port note in the component.
		 */
		items: T[];
		/** Renders one item, given its value and index. */
		item: Snippet<[T, number]>;
		/**
		 * Gap between items using spacing scale tokens.
		 * @default 1
		 */
		gap?: CarouselGap;
		/**
		 * Show prev/next navigation buttons when content is scrollable.
		 * @default true
		 */
		hasButtons?: boolean;
		/**
		 * Show a gradient edge-fade mask when content overflows. Can be suppressed
		 * when items have full-fidelity surfaces that look broken when masked.
		 * @default true
		 */
		hasEdgeFade?: boolean;
		/**
		 * Enable wrap-around scrolling. When the content overflows, pressing Next at
		 * the end scrolls back to the start, and Prev at the start scrolls to the
		 * end — for both the built-in buttons and the imperative handle. The
		 * navigation buttons stay visible at both edges instead of hiding, since a
		 * scroll is always available. Has no effect when the content fits without
		 * overflowing.
		 * @default false
		 */
		hasLoop?: boolean;
		/**
		 * Enable scroll-snap on items. Each item snaps to the start edge.
		 * @default false
		 */
		hasSnap?: boolean;
		/**
		 * Inline padding on the scroll container, applied as `padding-inline` so
		 * the gutter is inside the scrollable area. Also sets a matching
		 * `scroll-padding` so snap points align to the content edge.
		 */
		padding?: SpacingStep;
		/**
		 * Accessible label for the carousel region.
		 * @default 'Carousel'
		 */
		'aria-label'?: string;
		'data-testid'?: string;
	}
</script>

<script lang="ts" generics="T">
	import { untrack } from 'svelte';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import Layer from '../layer/layer.svelte';
	import { useLayer } from '../layer/use-layer.svelte.js';
	import { isRtlElement } from '../../hooks/is-rtl-element.js';
	import { useScrollOverflow } from '../../hooks/use-scroll-overflow.svelte.js';
	import { rtlStyles } from '../../utils/rtl.stylex.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		carouselButtonOverlay,
		carouselButtonPillAttrs,
		carouselButtonRadiusOverride,
		carouselItemAttrs,
		carouselRootAttrs,
		carouselScrollerAttrs
	} from './carousel.stylex.js';

	/**
	 * A horizontal scroll container with fade-edge overflow indication and
	 * optional navigation buttons.
	 *
	 * When content overflows, gradient fades appear at the edges and prev/next
	 * buttons are rendered **on the top layer** through `Layer`, so they escape
	 * any parent overflow clipping. `hasLoop` turns the edges into wrap-arounds,
	 * and the instance exports described by {@link CarouselHandle} drive the same
	 * scrolling programmatically.
	 *
	 * @example
	 * ```svelte
	 * <Carousel items={photos} gap={1}>
	 *   {#snippet item(photo)}<Thumbnail src={photo.src} alt={photo.alt} />{/snippet}
	 * </Carousel>
	 * ```
	 */
	let {
		items,
		item,
		gap = 1,
		hasButtons = true,
		hasEdgeFade = true,
		hasLoop = false,
		hasSnap = false,
		padding,
		'aria-label': ariaLabelFromProps,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...htmlProps
	}: CarouselProps<T> = $props();

	const t = useTranslator();
	const ariaLabel = $derived(ariaLabelFromProps ?? t('@astryx.carousel.label'));

	let scrollEl = $state<HTMLElement | null>(null);
	const overflow = useScrollOverflow();

	const layerId = $props.id();
	const layer = useLayer(() => ({ mode: 'context', id: layerId, lightDismiss: false }));

	// Upstream's `useEffect(..., [hasButtons, layer])`. `show()`/`hide()` read the
	// layer's own `isOpen`, so the call is untracked — otherwise the effect
	// subscribes to state it then writes, which is the `useHoverCard` note.
	$effect(() => {
		const shouldShow = hasButtons;
		untrack(() => (shouldShow ? layer.show() : layer.hide()));
	});

	/**
	 * Map Shift + vertical wheel to horizontal scroll. Trackpads emit horizontal
	 * deltas natively, but a standard mouse only produces `deltaY` — so mouse
	 * users could not wheel-scroll a horizontal container. Shift + wheel is the
	 * long-established convention for horizontal scroll containers.
	 *
	 * Only kicks in when Shift is held and the wheel is purely vertical
	 * (`deltaX === 0`), so native trackpad horizontal scrolling is untouched.
	 */
	function handleWheel(event: WheelEvent): void {
		if (!event.shiftKey || event.deltaY === 0 || event.deltaX !== 0) {
			return;
		}
		const el = scrollEl;
		if (!el) {
			return;
		}
		// Nothing to scroll horizontally — let the event fall through so the page
		// can scroll as it normally would.
		if (el.scrollWidth <= el.clientWidth) {
			return;
		}
		event.preventDefault();
		el.scrollBy({ left: event.deltaY, behavior: 'auto' });
	}

	/**
	 * Respect the user's reduced-motion preference — mirrors the CSS
	 * scroll-behavior override so button-driven scrolling doesn't animate for
	 * users who opted out of motion.
	 */
	function scrollBehavior(): ScrollBehavior {
		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return prefersReducedMotion ? 'auto' : 'smooth';
	}

	function scrollBy(direction: -1 | 1): void {
		const el = scrollEl;
		if (!el) {
			return;
		}
		const behavior = scrollBehavior();
		// Under RTL the scroll axis is inverted (start is scrollLeft 0, the end is
		// negative), so flip the physical delta sign.
		const rtlSign = isRtlElement(el) ? -1 : 1;

		// Wrap-around: when looping over overflowing content, a press that would run
		// past an edge jumps to the opposite edge instead. Overshoot by the full
		// scroll width in the opposite logical direction and let the browser clamp
		// to the far edge — this reuses the same RTL sign convention as a normal
		// scroll, so it stays direction-correct without special-casing.
		if (hasLoop && overflow.hasOverflow) {
			const atEnd = direction === 1 && !overflow.overflowEnd;
			const atStart = direction === -1 && !overflow.overflowStart;
			if (atEnd || atStart) {
				el.scrollBy({ left: rtlSign * -direction * el.scrollWidth, behavior });
				return;
			}
		}

		const firstChild = el.firstElementChild as HTMLElement | null;
		const itemWidth = firstChild ? firstChild.offsetWidth : 0;
		const amount = el.clientWidth - itemWidth * 0.5;
		el.scrollBy({
			// `direction` is the logical intent (-1 = toward content start, +1 =
			// toward content end).
			left: rtlSign * direction * Math.max(amount, itemWidth),
			behavior
		});
	}

	function scrollToIndex(index: number): void {
		const el = scrollEl;
		const slides = el?.children;
		if (!el || !slides || slides.length === 0) {
			return;
		}
		const clamped = Math.max(0, Math.min(index, slides.length - 1));
		const target = slides[clamped] as HTMLElement;
		// Bring the item to the start edge by scrolling the container by the
		// measured gap between the item and the container edge. Using `scrollBy`
		// (not `scrollIntoView`) keeps the scroll contained to the carousel and
		// never moves ancestors or the page. In RTL the start edge is the right
		// edge, so align the trailing edges instead of the leading ones.
		const containerRect = el.getBoundingClientRect();
		const itemRect = target.getBoundingClientRect();
		const delta = isRtlElement(el)
			? itemRect.right - containerRect.right
			: itemRect.left - containerRect.left;
		el.scrollBy({ left: delta, behavior: scrollBehavior() });
	}

	/**
	 * Upstream's `useImperativeHandle(handleRef, …)`. Svelte's counterpart to an
	 * imperative handle is the component instance, so these are instance exports
	 * reached through `bind:this` rather than a `handleRef` prop. Together they
	 * satisfy {@link CarouselHandle}.
	 *
	 * The three **mutators** run `untrack`ed. React's `scrollBy` closes over
	 * `hasLoop` and the overflow flags as plain values from the last committed
	 * render, so a handle method can never subscribe its caller to anything;
	 * ours reads them through live getters, and without this a consumer's
	 * `$effect(() => carousel?.scrollNext())` would take a dependency on
	 * `overflowEnd` — which that very scroll then flips, re-running the effect
	 * forever. The `hasLoop` branch is what makes the read reachable, so the
	 * loop only appears once looping is on. The template's `onclick` handlers
	 * call `scrollBy` directly: an event handler is already untracked.
	 *
	 * The two **queries** stay tracked on purpose. Their contract is a live read,
	 * and a consumer putting `canScrollNext()` in a `$derived` wants it to update
	 * — the `SideNav.getCollapseState()` precedent. A query cannot feed back on
	 * itself the way a mutator can.
	 */
	export function scrollNext(): void {
		untrack(() => scrollBy(1));
	}

	/** See {@link scrollNext}. */
	export function scrollPrev(): void {
		untrack(() => scrollBy(-1));
	}

	/** See {@link scrollNext}. */
	export function scrollTo(index: number): void {
		untrack(() => scrollToIndex(index));
	}

	// With loop, either direction is reachable whenever the content overflows;
	// otherwise these reflect the live per-edge overflow state.
	/** See {@link scrollNext}. */
	export function canScrollNext(): boolean {
		return hasLoop ? overflow.hasOverflow : overflow.overflowEnd;
	}

	/** See {@link scrollNext}. */
	export function canScrollPrev(): boolean {
		return hasLoop ? overflow.hasOverflow : overflow.overflowStart;
	}

	// With loop, the buttons stay reachable at both edges as long as there's
	// something to scroll; without loop they follow the per-edge overflow state.
	const canScrollStart = $derived(hasLoop && overflow.hasOverflow ? true : overflow.overflowStart);
	const canScrollEnd = $derived(hasLoop && overflow.hasOverflow ? true : overflow.overflowEnd);

	const fade = $derived(
		hasEdgeFade
			? (hasLoop && overflow.hasOverflow) || (overflow.overflowStart && overflow.overflowEnd)
				? 'both'
				: overflow.overflowStart
					? 'start'
					: overflow.overflowEnd
						? 'end'
						: null
			: null
	);

	// Self-authored position styles (`positioning="custom"` below): a cover
	// centred on the anchor, sized to it — direction-neutral by construction.
	const coverStyle = 'position-area:center;width:anchor-size(width);height:anchor-size(height)';

	const theme = themeProps('carousel');
	const rootAttrs = $derived(carouselRootAttrs(xstyle));
	// The scroller is the box a theme actually paints — gap, inline padding, snap
	// and the edge fade all live on it, so it names itself and reflects those four
	// as its own variant classes and `data-*` attributes.
	const scrollerTheme = $derived(
		themeProps('carousel-scroller', {
			gap,
			padding,
			snap: hasSnap ? 'snap' : null,
			edgeFade: hasEdgeFade ? 'edge-fade' : null
		})
	);
	const scrollerAttrs = $derived(carouselScrollerAttrs(gap, padding, hasSnap, fade));
	const itemAttrs = carouselItemAttrs();
	const startPill = $derived(carouselButtonPillAttrs('start', !canScrollStart));
	const endPill = $derived(carouselButtonPillAttrs('end', !canScrollEnd));
</script>

<!--
	The chevrons carry `rtlStyles.mirror`, so they point toward the content they
	scroll to in both directions.

	The mirror rides the `Icon`'s own `xstyle`, not a wrapper span. This port used
	to wrap, on the reading that the mirror is a `transform` and the icon's own
	styles might carry one too — but `Icon` declares no `transform` at any size or
	colour, so there was nothing to collide with, and the extra element was a
	divergence in the DOM upstream does not have. Upstream (#4775) passes
	`xstyle={rtlStyles.mirror}` here for exactly that reason. Where a rotation IS
	present the rule still holds and `rtl.stylex.ts`'s header still states it: the
	mirror must compose with the rotation on one element or sit outside it, never
	fight it from a second `transform`.
-->
{#snippet chevronLeft()}
	<Icon icon="chevronLeft" size="xsm" xstyle={rtlStyles.mirror} />
{/snippet}

{#snippet chevronRight()}
	<Icon icon="chevronRight" size="xsm" xstyle={rtlStyles.mirror} />
{/snippet}

<div
	{@attach layer.attachTrigger}
	data-testid={testId}
	{...htmlProps}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	role="region"
	aria-label={ariaLabel}
	aria-roledescription="carousel"
>
	<!--
		A scroll container must be keyboard-reachable so it can be scrolled with the
		arrow keys; upstream sets the same `tabIndex={0}`.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={scrollEl}
		{@attach overflow.attach}
		tabindex="0"
		onwheel={handleWheel}
		{...scrollerTheme}
		class={cx(scrollerTheme.class, scrollerAttrs.class)}
		style={scrollerAttrs.style}
	>
		{#each items as value, index (index)}
			<!--
				APG carousel pattern: each slide container is a group with
				`aria-roledescription="slide"` and an "N of M" accessible name, so ATs
				announce slide boundaries and position instead of anonymous generics.
			-->
			<div
				role="group"
				aria-roledescription="slide"
				aria-label={t('@astryx.carousel.slideLabel', {
					current: index + 1,
					total: items.length
				})}
				class={itemAttrs.class}
				style={itemAttrs.style}
			>
				{@render item(value, index)}
			</div>
		{/each}
	</div>

	{#if hasButtons}
		<Layer {layer} positioning="custom" style={coverStyle} xstyle={carouselButtonOverlay}>
			<div class={startPill.class} style={startPill.style}>
				<Button
					icon={chevronLeft}
					label={t('@astryx.carousel.scrollLeft')}
					variant="ghost"
					size="sm"
					isIconOnly
					isDisabled={!canScrollStart}
					onclick={() => scrollBy(-1)}
					xstyle={carouselButtonRadiusOverride}
				/>
			</div>
			<div class={endPill.class} style={endPill.style}>
				<Button
					icon={chevronRight}
					label={t('@astryx.carousel.scrollRight')}
					variant="ghost"
					size="sm"
					isIconOnly
					isDisabled={!canScrollEnd}
					onclick={() => scrollBy(1)}
					xstyle={carouselButtonRadiusOverride}
				/>
			</div>
		</Layer>
	{/if}
</div>
