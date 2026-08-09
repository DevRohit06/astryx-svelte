import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CarouselFixture from './fixtures/carousel-fixture.svelte';

/**
 * Ported from Astryx's `Carousel/Carousel.test.tsx` — **16 of upstream's 23**.
 *
 * The 8 originally ported cases were the ones outside upstream's two nested
 * `describe`s; 0.3.0's `hasLoop` (4) and `handleRef` (4) groups are ported here
 * in full, which is what took the count to 16. Still unported, from 0.2.0 and
 * recorded in TODO.md as part of the batch-9 test-parity debt: the 3
 * `slide semantics` cases and the 4 `Shift + wheel horizontal scroll` cases.
 *
 * Every case goes through `carousel-fixture.svelte`: the port takes `items` plus
 * an `item` snippet where upstream takes children and wraps each with
 * `Children.map`, since a Svelte snippet is one opaque unit that cannot be
 * mapped over (the `OverflowList` precedent — see TODO.md → Known debts).
 *
 * Runs in the **client** (real Chromium) project, so upstream's
 * `MockResizeObserver` stub is **gone**: Chromium implements `ResizeObserver`,
 * and `useScrollOverflow` measures for real. The edge-state case still holds —
 * with no measurable overflow both edges are at rest, exactly as in jsdom.
 *
 * The two nav buttons live inside a `<Layer>` popover, so they are read from the
 * container rather than through a label query, the translation the `popover` and
 * `dropdown-menu` suites document for layer content.
 */

const twoItems = [
	{ text: 'Item 1', testid: 'item-1' },
	{ text: 'Item 2', testid: 'item-2' }
];

const threeItems = [
	{ text: 'Item 1', testid: 'item-1' },
	{ text: 'Item 2', testid: 'item-2' },
	{ text: 'Item 3', testid: 'item-3' }
];

/** A nav button by its accessible label, hidden or not. */
function navButton(container: HTMLElement, label: string): HTMLElement | null {
	return container.querySelector(`button[aria-label="${label}"]`);
}

/** The same, for the cases that go on to click it. */
function requireNavButton(container: HTMLElement, label: string): HTMLElement {
	const button = navButton(container, label);
	if (button == null) {
		throw new Error(`no nav button labelled "${label}"`);
	}
	return button;
}

/** The scroll container — the carousel region's first child. */
function getScroller(container: HTMLElement): HTMLElement {
	const region = container.querySelector('[role="region"]');
	if (region?.firstElementChild == null) {
		throw new Error('carousel region has not rendered');
	}
	return region.firstElementChild as HTMLElement;
}

/**
 * Fake an overflowing scroll container resting at `scrollLeft`, then drive the
 * overflow hook's scroll listener so `overflowStart`/`overflowEnd` settle.
 *
 * Upstream does this because jsdom lays nothing out; this port keeps it under
 * real Chromium for a different reason. The wrap-around assertions check an
 * *exact* overshoot of the full `scrollWidth`, and a real one depends on the
 * harness's viewport and font metrics. Pinning the geometry keeps the arithmetic
 * the assertion names deterministic — the hook, the sign convention and the
 * branch under test are all still the real ones.
 */
function makeOverflowing(el: HTMLElement, scrollLeft: number, scrollWidth = 500): void {
	Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
	Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true });
	Object.defineProperty(el, 'scrollLeft', {
		value: scrollLeft,
		writable: true,
		configurable: true
	});
	el.dispatchEvent(new Event('scroll'));
}

describe('Carousel', () => {
	it('renders children', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { 'aria-label': 'Test carousel' }, items: twoItems }
		});
		await expect.element(screen.getByTestId('item-1')).toBeInTheDocument();
		await expect.element(screen.getByTestId('item-2')).toBeInTheDocument();
	});

	it('has carousel ARIA attributes', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { 'aria-label': 'Photos' }, items: [{ text: 'Item' }] }
		});
		await expect
			.element(screen.getByRole('region', { name: 'Photos' }))
			.toHaveAttribute('aria-roledescription', 'carousel');
	});

	it('makes the scroll container keyboard-focusable', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { 'aria-label': 'Photos' }, items: [{ text: 'Item' }] }
		});
		// The inner scroll container overflows, so it must be reachable by
		// keyboard (axe: scrollable-region-focusable).
		const region = screen.getByRole('region', { name: 'Photos' }).element();
		expect(region.firstElementChild).toHaveAttribute('tabindex', '0');
	});

	it('applies data-testid', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { 'data-testid': 'my-carousel' }, items: [{ text: 'Item' }] }
		});
		await expect.element(screen.getByTestId('my-carousel')).toBeInTheDocument();
	});

	it('has correct astryx class name', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { 'data-testid': 'cls-test' }, items: [{ text: 'Item' }] }
		});
		expect(screen.getByTestId('cls-test').element().className).toContain('astryx-carousel');
	});

	it('does not render button layer when hasButtons={false}', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { hasButtons: false, 'aria-label': 'No buttons' }, items: twoItems }
		});
		expect(navButton(screen.container, 'Scroll left')).not.toBeInTheDocument();
		expect(navButton(screen.container, 'Scroll right')).not.toBeInTheDocument();
	});

	it('renders buttons by default', async () => {
		const screen = await render(CarouselFixture, {
			props: { props: { 'aria-label': 'With buttons' }, items: twoItems }
		});
		expect(navButton(screen.container, 'Scroll left')).toBeInTheDocument();
		expect(navButton(screen.container, 'Scroll right')).toBeInTheDocument();
	});

	it('disables edge scroll buttons instead of removing them from the tab order', async () => {
		// With no measurable overflow both edges are at rest and the scroll buttons
		// are in their hidden/inert state. They must stay mounted but be disabled —
		// a disabled <button> is skipped by the tab order and hidden from the a11y
		// tree, so keyboard users don't focus an invisible control (WCAG 2.4.7).
		const screen = await render(CarouselFixture, {
			props: { props: { 'aria-label': 'Edge state' }, items: twoItems }
		});
		const left = navButton(screen.container, 'Scroll left');
		const right = navButton(screen.container, 'Scroll right');
		expect(left).toBeInTheDocument();
		expect(right).toBeInTheDocument();
		expect(left).toBeDisabled();
		expect(right).toBeDisabled();
	});

	describe('hasLoop', () => {
		it('keeps both navigation buttons enabled at the edges when looping', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { hasLoop: true, 'aria-label': 'Looping' }, items: twoItems }
			});
			const scroller = getScroller(screen.container);
			// At the start edge: without loop the left button would be disabled.
			makeOverflowing(scroller, 0);

			await expect.element(requireNavButton(screen.container, 'Scroll left')).toBeEnabled();
			await expect.element(requireNavButton(screen.container, 'Scroll right')).toBeEnabled();
		});

		it('wraps to the start when pressing next at the end', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { hasLoop: true, 'aria-label': 'Looping' }, items: twoItems }
			});
			const scroller = getScroller(screen.container);
			// At the end edge (scrolled fully right): overflowEnd is false.
			makeOverflowing(scroller, 300);
			const scrollBy = vi.fn();
			scroller.scrollBy = scrollBy;

			const right = requireNavButton(screen.container, 'Scroll right');
			// The disabled state is DOM, so it lands on the next flush; the click has
			// to wait for it or it hits an inert button.
			await expect.element(right).toBeEnabled();
			right.click();

			// Overshoots toward the start by the full scroll width; the browser clamps
			// to scrollLeft 0.
			expect(scrollBy).toHaveBeenCalledWith({ left: -500, behavior: 'smooth' });
		});

		it('wraps to the end when pressing prev at the start', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { hasLoop: true, 'aria-label': 'Looping' }, items: twoItems }
			});
			const scroller = getScroller(screen.container);
			makeOverflowing(scroller, 0);
			const scrollBy = vi.fn();
			scroller.scrollBy = scrollBy;

			const left = requireNavButton(screen.container, 'Scroll left');
			await expect.element(left).toBeEnabled();
			left.click();

			// Overshoots toward the end by the full scroll width.
			expect(scrollBy).toHaveBeenCalledWith({ left: 500, behavior: 'smooth' });
		});

		it('does not wrap when content fits without overflowing', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { hasLoop: true, 'aria-label': 'Looping' }, items: [{ text: 'Only item' }] }
			});
			const scroller = getScroller(screen.container);
			// scrollWidth === clientWidth: nothing overflows, so nothing to wrap to.
			makeOverflowing(scroller, 0, 200);
			const scrollBy = vi.fn();
			scroller.scrollBy = scrollBy;

			// Buttons are hidden/disabled with no overflow; invoking scroll is a no-op
			// wrap-wise — a normal (non-wrap) scrollBy still runs, but there is
			// nothing to wrap to, so the overshoot branch must not fire.
			requireNavButton(screen.container, 'Scroll right').click();

			// Either not called (button disabled) or called with a normal delta —
			// never the full-scrollWidth overshoot. Upstream guards the two negative
			// assertions behind `if (calls.length > 0)`; this project's vitest config
			// fails a case that runs no assertion at all, and here the button *is*
			// disabled, so the same claim is stated as a filter that always asserts.
			const overshoots = scrollBy.mock.calls.filter(
				(call) => Math.abs((call[0] as ScrollToOptions).left ?? 0) === 200
			);
			expect(overshoots).toHaveLength(0);
		});
	});

	/**
	 * Upstream's `handleRef` group. There is no `handleRef` prop here — the five
	 * methods are instance exports reached through `bind:this`, so the fixture
	 * holds them and `screen.component.handle()` stands in for `handle.current`.
	 */
	describe('imperative handle', () => {
		it('exposes scrollNext/scrollPrev that drive the scroll container', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { 'aria-label': 'Handle' }, items: twoItems }
			});
			const scroller = getScroller(screen.container);
			makeOverflowing(scroller, 100);
			const scrollBy = vi.fn();
			scroller.scrollBy = scrollBy;

			screen.component.handle().scrollNext();
			expect(scrollBy).toHaveBeenCalledTimes(1);
			expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);

			screen.component.handle().scrollPrev();
			expect(scrollBy).toHaveBeenCalledTimes(2);
			expect(scrollBy.mock.calls[1][0].left).toBeLessThan(0);
		});

		it('reports canScrollNext/canScrollPrev from live overflow state', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { 'aria-label': 'Handle' }, items: twoItems }
			});
			const scroller = getScroller(screen.container);

			// At the start: can scroll toward the end, not the start.
			makeOverflowing(scroller, 0);
			expect(screen.component.handle().canScrollPrev()).toBe(false);
			expect(screen.component.handle().canScrollNext()).toBe(true);

			// Scroll into the middle: both directions available.
			makeOverflowing(scroller, 150);
			expect(screen.component.handle().canScrollPrev()).toBe(true);
			expect(screen.component.handle().canScrollNext()).toBe(true);
		});

		it('reports both directions scrollable under hasLoop when overflowing', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { hasLoop: true, 'aria-label': 'Handle' }, items: twoItems }
			});
			const scroller = getScroller(screen.container);
			// Rest at the start edge — normally canScrollPrev would be false.
			makeOverflowing(scroller, 0);

			expect(screen.component.handle().canScrollPrev()).toBe(true);
			expect(screen.component.handle().canScrollNext()).toBe(true);
		});

		it('scrollTo scrolls the container and clamps out-of-range indices', async () => {
			const screen = await render(CarouselFixture, {
				props: { props: { 'aria-label': 'Handle' }, items: threeItems }
			});
			const scroller = getScroller(screen.container);
			const scrollBy = vi.fn();
			scroller.scrollBy = scrollBy;

			// Out-of-range index is clamped to the last item — no throw, one call.
			expect(() => screen.component.handle().scrollTo(99)).not.toThrow();
			expect(scrollBy).toHaveBeenCalledTimes(1);
			// Uses scrollBy (contained to the carousel), never scrollIntoView.
			expect(scrollBy.mock.calls[0][0]).toHaveProperty('left');
		});
	});
});
