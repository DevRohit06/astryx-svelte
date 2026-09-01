/** PORTS: hooks/useOverflow.test.ts */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import type { UseOverflowOptions } from '$lib/hooks/use-overflow.svelte.js';
import Probe from './fixtures/overflow-probe.svelte';

/**
 * Ported from Astryx's `hooks/useOverflow.test.ts`, all **26** cases at the
 * 0.5.0 pin, arithmetic comments and all. Nothing is dropped. (The header read
 * "all twenty cases" while both files held 26 — the port was complete and only
 * the number was stale.)
 *
 * The mock elements are upstream's — plain objects carrying only `offsetWidth`
 * and `children`. They work here for the same reason: the hook reads widths and
 * nothing else. The ref callbacks become attachments, which the test can call
 * directly because an attachment *is* a function of the element.
 *
 * Three of upstream's cases count React renders. Svelte has no equivalent
 * number, so they count the runs of an effect that reads `visibleCount` —
 * the same question ("did that cause an update?") asked of the thing that
 * actually updates. What guarantees the answer moves from React's `setState`
 * bail-out to `$state` equality.
 *
 * One case changes. Upstream's "cleans up ResizeObserver on unmount" makes no
 * assertion at all — it sets the ref to null and unmounts — and this repo's
 * vitest sets `requireAssertions`, which reads that as a test that checks
 * nothing. It now asserts what the title says: detaching unobserves.
 */

// Builds a mock container element with a given offsetWidth
function mockContainer(width: number): HTMLElement {
	return { offsetWidth: width } as unknown as HTMLElement;
}

// Builds a mock measure element whose children have the given widths.
// If indicatorWidth is provided, an extra child is appended as the overflow indicator.
function mockMeasure(itemWidths: number[], indicatorWidth?: number, itemHeight = 0): HTMLElement {
	const children: { offsetWidth: number; offsetHeight: number }[] = itemWidths.map((w) => ({
		offsetWidth: w,
		offsetHeight: itemHeight
	}));
	if (indicatorWidth != null) {
		children.push({ offsetWidth: indicatorWidth, offsetHeight: itemHeight });
	}
	return { children } as unknown as HTMLElement;
}

// Stubs ResizeObserver — fires callback immediately on observe, like the real
// one. `unobserve` is shared across instances rather than per-instance: these
// tests call the attachments by hand, so Svelte never tears them down and
// `sharedResizeObserver` keeps one live observer across the whole file. A spy
// on the class, not on an instance, is what the cleanup case can assert on.
const unobserveSpy = vi.fn();

class FakeResizeObserver {
	callback: ResizeObserverCallback;
	constructor(cb: ResizeObserverCallback) {
		this.callback = cb;
	}
	observe = vi.fn(() => {
		this.callback([], this as unknown as ResizeObserver);
	});
	unobserve = unobserveSpy;
	disconnect = vi.fn();
}

beforeEach(() => {
	unobserveSpy.mockClear();
	vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

const probe = (itemCount: number, options?: UseOverflowOptions) =>
	render(Probe, { props: { itemCount, options } });

describe('useOverflow', () => {
	it('shows all items when they fit', async () => {
		// 3 items of 50px each, gap 10 → total = 50+10+50+10+50 = 170, container = 200
		const { component } = await probe(3, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50]));
		component.overflow.attachContainer(mockContainer(200));

		expect(component.overflow.visibleCount).toBe(3);
		expect(component.overflow.hasOverflow).toBe(false);
	});

	it('hides items that do not fit', async () => {
		// 4 items of 50px, gap 10, indicator 30px, container 150
		// Item 1: 50, not last → reserve 30+10=40 → 50+40=90 ≤ 150 ✓ (total=50)
		// Item 2: 50+10+50=110, not last → reserve 40 → 110+40=150 ≤ 150 ✓ (total=110)
		// Item 3: 110+10+50=170, not last → reserve 40 → 170+40=210 > 150 ✗
		// → visibleCount = 2
		const { component } = await probe(4, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(150));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('shows zero items when nothing fits and minVisibleItems is 0', async () => {
		// 3 items of 100px, container 50, indicator 30
		// Item 1: 100, not last → reserve 30+0=30 → 100+30=130 > 50, count=0 ≥ min(0) → break
		const { component } = await probe(3, { gap: 0 });

		component.overflow.attachMeasure(mockMeasure([100, 100, 100], 30));
		component.overflow.attachContainer(mockContainer(50));

		expect(component.overflow.visibleCount).toBe(0);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('respects minVisibleItems even when items do not fit', async () => {
		// 3 items of 100px, container 50, indicator 30, minVisibleItems 2
		// Item 1: 100 > 50+reserved, but count(0) < min(2) → continue
		// Item 2: 200 > 50, but count(1) < min(2) → continue
		// Item 3: last item (i=2, length=3) → reservedWidth=0 → 300 > 50, count(2) ≥ min(2) → break
		// → visibleCount = max(min(2, 3), 2) = 2
		const { component } = await probe(3, { gap: 0, minVisibleItems: 2 });

		component.overflow.attachMeasure(mockMeasure([100, 100, 100], 30));
		component.overflow.attachContainer(mockContainer(50));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('handles no gap', async () => {
		// 3 items of 40px, no gap → total = 120, container = 100, indicator = 20
		// gap=0, so gapWidth for i>0 is 0 and reservedWidth = 20 + 0 = 20
		// Item 1: 40, not last → reserve 20 → 60 ≤ 100 ✓ (total=40)
		// Item 2: 80, not last → reserve 20 → 100 ≤ 100 ✓ (total=80)
		// Item 3: 120, last → reserve 0 → 120 > 100, count(2) ≥ 0 → break
		// → visibleCount = 2
		const { component } = await probe(3, { gap: 0 });

		component.overflow.attachMeasure(mockMeasure([40, 40, 40], 20));
		component.overflow.attachContainer(mockContainer(100));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('works without an overflow indicator', async () => {
		// 3 items of 50px, gap 10, no indicator, container 130
		// total needed = 50+10+50+10+50 = 170 > 130
		// Item 1: 50, not last → reserve 0 → 50 ≤ 130 ✓
		// Item 2: 110, not last → reserve 0 → 110 ≤ 130 ✓
		// Item 3: 170, last → reserve 0 → 170 > 130 → break
		// → visibleCount = 2
		const { component } = await probe(3, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50]));
		component.overflow.attachContainer(mockContainer(130));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('handles items with different widths', async () => {
		// Items: 30, 80, 40, 60. Gap 10. Indicator 25. Container 200.
		// Item 1 (30): not last → reserve 25+0=25 → 30+25=55 ≤ 200 ✓ (total=30)
		// Item 2 (80): 30+10+80=120, not last → reserve 25+10=35 → 120+35=155 ≤ 200 ✓ (total=120)
		// Item 3 (40): 120+10+40=170, not last → reserve 35 → 170+35=205 > 200 → break
		// → visibleCount = 2
		const { component } = await probe(4, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([30, 80, 40, 60], 25));
		component.overflow.attachContainer(mockContainer(200));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('collapses from start', async () => {
		// Items: 30, 80, 40. Gap 10. Indicator 25. Container 100.
		// collapseFrom='start' reverses widths → ordered: [40, 80, 30]
		// Item 1 (40): not last → reserve 25+0=25 → 40+25=65 ≤ 100 ✓ (total=40)
		// Item 2 (80): 40+10+80=130, not last → reserve 25+10=35 → 130+35=165 > 100 → break
		// → visibleCount = 1 (the last 1 item is kept visible)
		const { component } = await probe(3, { gap: 10, collapseFrom: 'start' });

		component.overflow.attachMeasure(mockMeasure([30, 80, 40], 25));
		component.overflow.attachContainer(mockContainer(100));

		expect(component.overflow.visibleCount).toBe(1);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('handles zero children', async () => {
		const { component } = await probe(0);

		component.overflow.attachMeasure(mockMeasure([]));
		component.overflow.attachContainer(mockContainer(200));

		expect(component.overflow.visibleCount).toBe(0);
		expect(component.overflow.hasOverflow).toBe(false);
	});

	it('shows all items when exact fit with indicator not needed', async () => {
		// 3 items of 50px, gap 10 → total = 170, container = 170, indicator present
		// Item 1 (50): not last → reserve 30+0=30 → 50+30=80 ≤ 170 ✓ (total=50)
		// Item 2 (50): 50+10+50=110, not last → reserve 30+10=40 → 110+40=150 ≤ 170 ✓ (total=110)
		// Item 3 (50): 110+10+50=170, last → reserve 0 → 170 ≤ 170 ✓ (total=170)
		// → visibleCount = 3, all fit so no overflow
		const { component } = await probe(3, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(170));

		expect(component.overflow.visibleCount).toBe(3);
		expect(component.overflow.hasOverflow).toBe(false);
	});

	it('recalculates when container resizes', async () => {
		const { component } = await probe(3, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(170));

		expect(component.overflow.visibleCount).toBe(3);

		// Simulate resize by re-attaching to a smaller container
		component.overflow.attachContainer(mockContainer(100));

		expect(component.overflow.visibleCount).toBe(1);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('cleans up ResizeObserver on detach', async () => {
		const { component, unmount } = await probe(3);

		const container = mockContainer(200);
		const detach = component.overflow.attachContainer(container);

		expect(unobserveSpy).not.toHaveBeenCalled();
		detach?.();
		expect(unobserveSpy).toHaveBeenCalledWith(container);

		await unmount();
	});

	it('single item that fits', async () => {
		const { component } = await probe(1, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50]));
		component.overflow.attachContainer(mockContainer(100));

		expect(component.overflow.visibleCount).toBe(1);
		expect(component.overflow.hasOverflow).toBe(false);
	});

	it('does not update dependents when visibleCount stays the same', async () => {
		const { component } = await probe(3, { gap: 10 });

		const initialUpdates = component.seenCounts.length;

		component.overflow.attachMeasure(mockMeasure([50, 50, 50]));
		component.overflow.attachContainer(mockContainer(200));
		await tick();

		// All items fit (visibleCount stays 3 = initial), so no state change.
		expect(component.seenCounts.length).toBe(initialUpdates);
		expect(component.overflow.visibleCount).toBe(3);
	});

	it('updates dependents exactly once when visibleCount changes', async () => {
		const { component } = await probe(4, { gap: 10 });

		const initialUpdates = component.seenCounts.length;

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(150));
		await tick();

		// visibleCount changes from 4 → 2, so exactly one additional run
		expect(component.seenCounts.length).toBe(initialUpdates + 1);
		expect(component.overflow.visibleCount).toBe(2);
	});

	it('does not update dependents on resize when visibleCount is unchanged', async () => {
		const { component } = await probe(3, { gap: 10 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50]));
		component.overflow.attachContainer(mockContainer(200));
		await tick();

		const afterSetup = component.seenCounts.length;

		// Resize to a still-large-enough container — visibleCount stays 3
		component.overflow.attachContainer(mockContainer(300));
		await tick();

		expect(component.seenCounts.length).toBe(afterSetup);
		expect(component.overflow.visibleCount).toBe(3);
	});

	it('single item that does not fit without minVisibleItems', async () => {
		const { component } = await probe(1, { gap: 0 });

		component.overflow.attachMeasure(mockMeasure([200], 30));
		component.overflow.attachContainer(mockContainer(100));

		// Single item is the last item, so reservedWidth=0 → 200 > 100 → break at count=0
		expect(component.overflow.visibleCount).toBe(0);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('caps visible items even when they all fit', async () => {
		const { component } = await probe(5, { gap: 10, maxVisibleItems: 3 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(10000));

		expect(component.overflow.visibleCount).toBe(3);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('cap does not raise a fit-limited count', async () => {
		const { component } = await probe(4, { gap: 10, maxVisibleItems: 4 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(150));

		expect(component.overflow.visibleCount).toBe(2);
	});

	it('min wins when maxVisibleItems < minVisibleItems and warns in dev', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { component } = await probe(5, {
			gap: 10,
			minVisibleItems: 3,
			maxVisibleItems: 1
		});

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainer(10000));

		expect(component.overflow.visibleCount).toBe(3);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('useOverflow with maxRows (multi-row)', () => {
	it('exposes rows and rowHeight', async () => {
		const { component } = await probe(6, { gap: 10, maxRows: 2 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50, 50, 50], 40, 24));
		component.overflow.attachContainer(mockContainer(170));

		// 3 items per row (170), 2 rows → all 6 fit
		expect(component.overflow.visibleCount).toBe(6);
		expect(component.overflow.rows).toBe(2);
		expect(component.overflow.rowHeight).toBe(24);
		expect(component.overflow.hasOverflow).toBe(false);
	});

	it('collapses items beyond maxRows into the indicator', async () => {
		const { component } = await probe(8, { gap: 10, maxRows: 2 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50, 50, 50, 50, 50], 40, 24));
		component.overflow.attachContainer(mockContainer(170));

		expect(component.overflow.visibleCount).toBe(5);
		expect(component.overflow.rows).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('maxRows=1 matches single-line behavior', async () => {
		const { component } = await probe(4, { gap: 10, maxRows: 1 });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50], 30, 24));
		component.overflow.attachContainer(mockContainer(150));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.rows).toBe(1);
	});
});

describe('useOverflow with behavior=observeParent', () => {
	function mockContainerWithParent(parentWidth: number, parentPadding = 0): HTMLElement {
		const container = { offsetWidth: 0 } as unknown as HTMLElement;

		const parent = { clientWidth: parentWidth };

		vi.stubGlobal('getComputedStyle', () => ({
			paddingLeft: `${parentPadding}px`,
			paddingRight: `${parentPadding}px`
		}));

		Object.defineProperty(container, 'parentElement', {
			value: parent,
			configurable: true
		});

		return container;
	}

	it('uses parent content width as available space', async () => {
		// Parent: 400px wide, 8px padding each side → available = 384
		// 4 items of 50px, gap 10 → total = 230 ≤ 384 → all fit
		const { component } = await probe(4, { gap: 10, behavior: 'observeParent' });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainerWithParent(400, 8));

		expect(component.overflow.visibleCount).toBe(4);
		expect(component.overflow.hasOverflow).toBe(false);
	});

	it('overflows when parent content width is too small', async () => {
		// Parent: 200px, padding 8 each side → available = 184
		// 4 items of 50px, gap 10, indicator 30
		// Item 1 (50): reserve 30 → 80 ≤ 184 ✓
		// Item 2 (50): 110, reserve 40 → 150 ≤ 184 ✓
		// Item 3 (50): 170, reserve 40 → 210 > 184 → break
		// → visibleCount = 2
		const { component } = await probe(4, { gap: 10, behavior: 'observeParent' });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50, 50], 30));
		component.overflow.attachContainer(mockContainerWithParent(200, 8));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});

	it('accounts for parent padding', async () => {
		// Parent: 200px, padding 40 each side → available = 120
		// 3 items of 50px, gap 10, no indicator → total = 170 > 120
		// Item 1 (50): not last, reserve 0 → 50 ≤ 120 ✓
		// Item 2 (50): 110, not last, reserve 0 → 110 ≤ 120 ✓
		// Item 3 (50): 170, last, reserve 0 → 170 > 120 → break
		// → visibleCount = 2
		const { component } = await probe(3, { gap: 10, behavior: 'observeParent' });

		component.overflow.attachMeasure(mockMeasure([50, 50, 50]));
		component.overflow.attachContainer(mockContainerWithParent(200, 40));

		expect(component.overflow.visibleCount).toBe(2);
		expect(component.overflow.hasOverflow).toBe(true);
	});
});
