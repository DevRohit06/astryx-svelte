/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CarouselEffectProbe from './fixtures/carousel-effect-probe.svelte';

/**
 * **Coverage beyond upstream.** Upstream has no analogue for this case and the
 * ported `carousel.svelte.test.ts` structurally cannot catch it: the hazard only
 * exists because Svelte tracks reads, and React's `useImperativeHandle` cannot
 * reproduce it at all.
 *
 * React's `Carousel.scrollBy` closes over `hasLoop`, `hasOverflow`,
 * `overflowStart` and `overflowEnd` as plain values from the last committed
 * render, so a method handed out through `useImperativeHandle` can never
 * subscribe its caller to anything. This port reads the same four through live
 * `$state` getters on `useScrollOverflow`. Without an `untrack` around the
 * mutators, a consumer writing the literal translation of
 * `useEffect(() => handleRef.current?.scrollNext(), [x])` takes a dependency on
 * `overflowEnd` — and the scroll that call performs is exactly what flips it, so
 * the effect re-runs and scrolls again, forever.
 *
 * `hasLoop` is what makes the read reachable (`hasLoop && overflow.hasOverflow`
 * short-circuits before touching the flags when looping is off), which is why
 * the default-props cases in the ported suite stay silent on it.
 *
 * **Mutation-checked**: dropping the `untrack(…)` from `scrollNext` in
 * `carousel.svelte` makes this case fail with a run count that keeps climbing.
 * The queries (`canScrollNext`/`canScrollPrev`) are deliberately left tracked —
 * their contract is a live read — so nothing here asserts about them.
 */

const twoItems = [
	{ text: 'Item 1', testid: 'item-1' },
	{ text: 'Item 2', testid: 'item-2' }
];

/** The scroll container — the carousel region's first child. */
function getScroller(container: HTMLElement): HTMLElement {
	const region = container.querySelector('[role="region"]');
	if (region?.firstElementChild == null) {
		throw new Error('carousel region has not rendered');
	}
	return region.firstElementChild as HTMLElement;
}

/** Fake an overflowing container resting at `scrollLeft` and drive the hook. */
function makeOverflowing(el: HTMLElement, scrollLeft: number): void {
	Object.defineProperty(el, 'scrollWidth', { value: 500, configurable: true });
	Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true });
	Object.defineProperty(el, 'scrollLeft', {
		value: scrollLeft,
		writable: true,
		configurable: true
	});
	el.dispatchEvent(new Event('scroll'));
}

describe('Carousel imperative handle', () => {
	it('does not subscribe a calling $effect to the overflow state it reads', async () => {
		const screen = await render(CarouselEffectProbe, { props: { items: twoItems } });
		const scroller = getScroller(screen.container);
		// The handle drives real scrolling; stub it out so only the tracking
		// question is under test.
		scroller.scrollBy = () => {};

		// Let mount settle: the effect runs once before `bind:this` lands and once
		// after, and nothing may move it again.
		await tick();
		await tick();
		const settled = screen.component.getRuns();
		expect(settled).toBeGreaterThan(0);

		// Flip every flag `scrollBy` consults. If the handle call had tracked them,
		// the consumer's effect would re-run here — and again on the next flip.
		makeOverflowing(scroller, 100);
		await tick();
		await tick();
		expect(screen.component.getRuns()).toBe(settled);

		makeOverflowing(scroller, 300);
		await tick();
		await tick();
		expect(screen.component.getRuns()).toBe(settled);
	});
});
