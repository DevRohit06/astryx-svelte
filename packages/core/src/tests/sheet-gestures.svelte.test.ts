/** PORTS: BottomSheet/useSheetGestures.test.ts */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SheetGesturesProbe from './fixtures/sheet-gestures-probe.svelte';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Ported from Astryx's `BottomSheet/useSheetGestures.test.ts` — **45 of its 47
 * cases at the 0.5.0 pin**.
 *
 * The 2 not here are 0.5.0's tap-slop pair in `body overscroll`: `treats a few
 * pixels of finger drift as a tap, not a drag` and `still promotes once the pull
 * passes the tap slop`. (The header read "all 45 … nothing is dropped" at the
 * v0.4.5 pin, where 45 was the whole suite.)
 *
 * Runs in the **client** project, unlike upstream's node suite: the hook is
 * built from `$state` and `$effect`, which need a component context to exist at
 * all. `sheet-gestures-probe.svelte` is the `renderHook` substitute CLAUDE.md
 * describes, exposing the hook's result through an instance export.
 *
 * Mechanical translations:
 *
 * - `sheetRef(el)` / `bodyProps.ref(el)` are attachments here, invoked through
 *   the probe's `attachSheet` / `attachBody`.
 * - Handler names are Svelte's (`onpointerdown`, not `onPointerDown`).
 * - `contentProps.style` is a **string**, not React's `CSSProperties` object, so
 *   the transform is read back out of it (`transformOf`) rather than off a
 *   property.
 * - `hook.rerender(...)` becomes the render result's `rerender`, which merges
 *   props into the live probe.
 */

/**
 * React's `act`, as a no-op.
 *
 * `act()` has no Svelte counterpart — a `$state` write is visible to the next
 * read on its own. Upstream wraps ~57 calls in it, and the choice is between
 * unwrapping every one (which changes the shape of every case, for nothing) and
 * this shim. The shim wins: it keeps each case line-for-line comparable with
 * upstream's, which is what makes a future re-derivation of the count cheap.
 */
const act = (fn: () => void): void => {
	fn();
};

/** `contentProps.style` is a declaration string here; pull the transform out. */
function transformOf(hook: Hook): string | undefined {
	const match = /transform:\s*([^;]+)/.exec(hook.result().contentProps.style);
	return match?.[1]?.trim();
}

const SHEET_HEIGHT = 400;

// A fake pointer event object good enough for the handlers, which only read
// pointerId, clientY, timeStamp, preventDefault, and currentTarget's capture +
// measure APIs.
function pointerEvent(
	clientY: number,
	timeStamp: number,
	target: HTMLElement,
	pointerId = 1,
	button = 0,
	isPrimary = true
) {
	return {
		pointerId,
		button,
		isPrimary,
		clientY,
		timeStamp,
		currentTarget: target,
		preventDefault: vi.fn()
	} as unknown as PointerEvent;
}

function makeTarget(): HTMLElement {
	const el = document.createElement('div');
	el.setPointerCapture = vi.fn();
	el.releasePointerCapture = vi.fn();
	el.getBoundingClientRect = () => ({ height: SHEET_HEIGHT }) as DOMRect;
	return el;
}

beforeEach(() => {
	// Full motion: the settle branch this file exercises is skipped entirely under
	// reduced motion, so a blanket stub would quietly test the wrong path.
	stubMatchMedia({ reduceMotion: false, matches: false });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function setup(options: Record<string, unknown> = {}) {
	const onDismiss = vi.fn();
	const screen = await render(SheetGesturesProbe, {
		props: { isOpen: true, onDismiss, ...options }
	});
	return { hook: screen.component, onDismiss, screen };
}

type Hook = ReturnType<typeof SheetGesturesProbe>;

function down(hook: Hook, y: number, t: number, target: HTMLElement) {
	// Register the sheet element the way the component does on mount, so the
	// hook can measure its height (it no longer queries the DOM for it).
	act(() => hook.attachSheet(target));
	act(() => hook.result().handleProps.onpointerdown(pointerEvent(y, t, target)));
}
function move(hook: Hook, y: number, t: number, target: HTMLElement) {
	act(() => hook.result().handleProps.onpointermove(pointerEvent(y, t, target)));
}
function up(hook: Hook, y: number, t: number, target: HTMLElement) {
	act(() => hook.result().handleProps.onpointerup(pointerEvent(y, t, target)));
}

describe('useSheetGestures', () => {
	it('dismisses on a fast downward flick (swipe-to-close)', async () => {
		const { hook, onDismiss } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();
		down(hook, 0, 0, t);
		// 60px in 20ms = 3px/ms, and 60px > the flick distance floor.
		move(hook, 60, 20, t);
		up(hook, 60, 22, t);
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('settles instead of dismissing on a downward flick when canDismiss is false', async () => {
		const onSnap = vi.fn();
		const onScrimOpacity = vi.fn();
		const { hook, onDismiss } = await setup({
			canDismiss: false,
			snapHeights: () => [200],
			onSnap,
			onScrimOpacity
		});
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 60, 20, t);
		up(hook, 60, 22, t);

		expect(onDismiss).not.toHaveBeenCalled();
		expect(hook.result().settledOffset).toBe(200);
		expect(onSnap).toHaveBeenLastCalledWith(200);
		// The 200px stop is half the sheet — a working surface, not a peek — so
		// the backdrop stays full there.
		expect(onScrimOpacity).toHaveBeenLastCalledWith(1);
	});

	it('expands to the tallest detent on a fast upward flick', async () => {
		const onSnap = vi.fn();
		const { hook, onDismiss } = await setup({ snapHeights: () => [200], onSnap });
		const t = makeTarget();
		// Start rested at a lower detent by first snapping there via a slow drag.
		down(hook, 0, 0, t);
		move(hook, 200, 400, t); // slow drag down toward the 200px detent
		up(hook, 200, 800, t);
		onSnap.mockClear();
		// Now flick up fast: 60px in 20ms = 3px/ms, over the distance floor.
		down(hook, 200, 1000, t);
		move(hook, 140, 1020, t);
		up(hook, 140, 1022, t);
		expect(onDismiss).not.toHaveBeenCalled();
		expect(onSnap).toHaveBeenLastCalledWith(SHEET_HEIGHT); // full height
		expect(hook.result().settledOffset).toBe(0);
	});

	it('does not flick-dismiss on a fast but short nudge', async () => {
		const { hook, onDismiss } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();
		// Fast (20px/10ms = 2px/ms) but only 20px of travel — under the distance
		// floor, so it settles rather than dismissing.
		down(hook, 0, 0, t);
		move(hook, 20, 10, t);
		up(hook, 20, 12, t);
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('settles to the nearest detent on a slow drag', async () => {
		const onSnap = vi.fn();
		const { hook, onDismiss } = await setup({ snapHeights: () => [200], onSnap });
		const t = makeTarget();
		// Detents: full=400 (offset 0) and 200 (offset 200). Drag slowly to ~180
		// offset -> nearest is the 200px detent (offset 200).
		down(hook, 0, 0, t);
		move(hook, 90, 300, t);
		move(hook, 180, 700, t);
		up(hook, 180, 1100, t);
		expect(onDismiss).not.toHaveBeenCalled();
		expect(onSnap).toHaveBeenLastCalledWith(200);
		expect(hook.result().settledOffset).toBe(200);
	});

	it('excludes the offscreen block-end reserve from visible detent heights', async () => {
		const onSnap = vi.fn();
		const { hook } = await setup({
			snapHeights: () => [200],
			offscreenBlockEndInset: 48,
			onSnap
		});
		const t = makeTarget();

		// The 400px border box has 352px visible. A 200px visible detent therefore
		// rests at offset 152, not 200; the 48px reserve remains below the viewport.
		down(hook, 0, 0, t);
		move(hook, 150, 700, t);
		up(hook, 150, 1100, t);

		expect(hook.result().settledOffset).toBe(152);
		expect(onSnap).toHaveBeenLastCalledWith(200);
	});

	it('keeps the full layout height at the peek detent', async () => {
		// Three detents on the 400px sheet: full (0), mid 240 (offset 160), and
		// the 80px peek (offset 320).
		const { hook } = await setup({ snapHeights: () => [80, 240] });
		const t = makeTarget();

		// Settle at the mid detent: the scrolling area takes that travel as
		// layout height.
		down(hook, 0, 0, t);
		move(hook, 150, 700, t);
		up(hook, 150, 1100, t);
		expect(hook.result().settledOffset).toBe(160);
		expect(hook.result().settledLayoutOffset).toBe(160);

		// Settle at the peek: a glance state keeps the sheet's full layout height
		// and slides it below the viewport, so no layout travel is reported.
		down(hook, 150, 2000, t);
		move(hook, 310, 2700, t);
		up(hook, 310, 3100, t);
		expect(hook.result().settledOffset).toBe(320);
		expect(hook.result().settledLayoutOffset).toBe(0);
	});

	it('re-anchors to the same stop when the snap heights change at rest', async () => {
		const { hook, screen } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();

		// Settle on the one collapsed stop: 400 - 200 = 200px of travel.
		down(hook, 0, 0, t);
		move(hook, 180, 700, t);
		up(hook, 180, 1100, t);
		act(() => hook.result().completeScrollAreaSettle());
		expect(hook.result().settledOffset).toBe(200);

		// A new resolver is a new set of stops. The sheet is resting on the one it
		// names, so it follows: a 150px stop is 250px of travel. The resolver is read
		// in an `$effect.pre`, this port's counterpart to upstream's layout effect —
		// a passive effect would still see the previous one.
		await screen.rerender({ snapHeights: () => [150] });

		expect(hook.result().settledOffset).toBe(250);
		expect(hook.result().settledLayoutOffset).toBe(250);
	});

	it('resizes the scrolling area at a collapsed stop that is a working height', async () => {
		// A 200px stop on the 400px sheet is half of it: the scrolling area takes
		// that travel as layout height rather than sliding the sheet away.
		const { hook } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 180, 700, t);
		up(hook, 180, 1100, t);
		expect(hook.result().settledOffset).toBe(200);
		expect(hook.result().settledLayoutOffset).toBe(200);
	});

	it('treats the only collapsed stop as a peek when it is a sliver', async () => {
		// 60px of a 400px sheet is inside the quarter that makes a peek, so the
		// sheet keeps its full layout height and slides below the viewport.
		const { hook } = await setup({ snapHeights: () => [60] });
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 320, 700, t);
		up(hook, 320, 1100, t);
		expect(hook.result().settledOffset).toBe(340);
		expect(hook.result().settledLayoutOffset).toBe(0);
	});

	it('uses the visible shortest detent height for the dismiss overshoot', async () => {
		const { hook, onDismiss } = await setup({
			snapHeights: () => [200],
			offscreenBlockEndInset: 48
		});
		const t = makeTarget();

		// Visible full height is 352px, so the 200px stop is offset 152. Its 40%
		// dismiss overshoot ends at 232px; the hidden reserve must not extend it.
		down(hook, 0, 0, t);
		move(hook, 235, 1000, t);
		up(hook, 235, 2000, t);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('a downward drag from a middle detent never snaps back up past it', async () => {
		// Three detents on a 600px sheet: full (offset 0), mid 360 (offset 240),
		// short 160 (offset 440). Rest at the mid detent, then drag DOWN a modest
		// amount that's still closer to mid than to short. It must not snap back
		// UP to full — only to mid (stay) or further down.
		const onSnap = vi.fn();
		const { hook } = await setup({ snapHeights: () => [160, 360], onSnap });
		const t = makeTarget();
		t.getBoundingClientRect = () => ({ height: 600 }) as DOMRect;
		// Drag to the mid detent (offset 240).
		down(hook, 0, 0, t);
		move(hook, 120, 300, t);
		move(hook, 240, 700, t);
		up(hook, 240, 1100, t);
		expect(hook.result().settledOffset).toBe(240);
		onSnap.mockClear();
		// Small slow drag DOWN from mid: offset 240 -> ~300.
		down(hook, 300, 2000, t);
		move(hook, 340, 2200, t);
		move(hook, 360, 2600, t);
		up(hook, 360, 3000, t);
		// Must not have jumped back up to full (offset 0).
		expect(hook.result().settledOffset).not.toBe(0);
		expect(hook.result().settledOffset).toBeGreaterThanOrEqual(240);
	});

	it('dismisses when dragged well below the shortest detent', async () => {
		const { hook, onDismiss } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();
		// Shortest detent offset = 200 (height 200). Drag slowly past it by
		// >40% of 200 -> offset ~320 dismisses.
		down(hook, 0, 0, t);
		move(hook, 160, 400, t);
		move(hook, 330, 900, t);
		up(hook, 330, 1400, t);
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('rebounds to the shortest detent when canDismiss is false', async () => {
		const onScrimOpacity = vi.fn();
		const { hook, onDismiss } = await setup({
			canDismiss: false,
			snapHeights: () => [200],
			onScrimOpacity
		});
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 160, 400, t);
		move(hook, 330, 900, t);
		up(hook, 330, 1400, t);

		expect(onDismiss).not.toHaveBeenCalled();
		expect(hook.result().settledOffset).toBe(200);
		// Rebounding restores the scrim the 200px stop rests under — full, since
		// half a sheet is a working surface rather than a glance.
		expect(onScrimOpacity).toHaveBeenLastCalledWith(1);
	});

	it('fades the scrim from full toward the peek floor as it collapses onto the peek detent', async () => {
		const onScrimOpacity = vi.fn();
		// Sheet 400, stops at 300 and a 60px sliver -> offsets [0, 100, 340]. The
		// fade spans the mid detent (offset 100) to the peek (offset 340): full
		// at/above 100, thinned to the peek floor (0.3) at/below 340.
		const { hook } = await setup({ snapHeights: () => [60, 300], onScrimOpacity });
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 60, 200, t); // offset 60, above the mid detent -> full
		move(hook, 220, 600, t); // offset 220, halfway -> between 1 and 0.3 (~0.65)
		move(hook, 360, 1000, t); // offset 360, past the peek -> peek floor
		const values = onScrimOpacity.mock.calls.map((c) => Number(c[0]));
		expect(values[0]).toBe(1);
		expect(values[1]).toBeGreaterThan(0.55);
		expect(values[1]).toBeLessThan(0.75);
		expect(values[values.length - 1]).toBeCloseTo(0.3);
	});

	it('thins the scrim to the peek floor when settled at the peek detent (still modal)', async () => {
		const onScrimOpacity = vi.fn();
		const { hook } = await setup({ snapHeights: () => [60, 300], onScrimOpacity });
		const t = makeTarget();
		// Slow drag down to the peek detent (offset 340).
		down(hook, 0, 0, t);
		move(hook, 170, 400, t);
		move(hook, 340, 900, t);
		up(hook, 340, 1400, t);
		expect(hook.result().settledOffset).toBe(340);
		// Last reported opacity (on settle) is the peek floor, not fully hidden —
		// the sheet is still modal, so the backdrop keeps a minimum dim.
		const values = onScrimOpacity.mock.calls.map((c) => Number(c[0]));
		expect(values[values.length - 1]).toBeCloseTo(0.3);
	});

	it('magnetically settles the live drag onto a nearby detent', async () => {
		// Detents for a 400px sheet with snaps 300 and 200 -> visible-height snaps
		// become offsets [0, 100, 200]. Approaching the middle detent (offset 100)
		// from just below (raw ~90) — inside MAGNET_RANGE and BELOW the shortest
		// detent so the between-detents magnet applies — should ease toward 100.
		const { hook } = await setup({ snapHeights: () => [200, 300] });
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 90, 100, t); // raw offset 90, 10px from the 100 detent
		const off = hook.result().dragOffset;
		expect(off).toBeGreaterThan(90); // pulled up toward 100
		expect(off).toBeLessThanOrEqual(100);
	});

	it('translates the surface live during a drag', async () => {
		const { hook } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();
		down(hook, 0, 0, t);
		move(hook, 50, 100, t);
		expect(hook.result().dragOffset).toBe(50);
		expect(hook.result().isDragging).toBe(true);
		expect(transformOf(hook)).toBe('translateY(50px)');
	});

	it('returns to the settled detent when a context menu interrupts a drag', async () => {
		const onScrimOpacity = vi.fn();
		const { hook, onDismiss } = await setup({
			snapHeights: () => [200, 300],
			onScrimOpacity
		});
		const target = makeTarget();
		down(hook, 0, 0, target);
		move(hook, 300, 1000, target);

		const preventDefault = vi.fn();
		act(() =>
			hook.result().handleProps.oncontextmenu({
				currentTarget: target,
				preventDefault
			} as unknown as MouseEvent)
		);

		expect(preventDefault).toHaveBeenCalledTimes(1);
		expect(hook.result().isDragging).toBe(false);
		expect(transformOf(hook)).toBeUndefined();
		expect(onScrimOpacity).toHaveBeenLastCalledWith(1);
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('returns to the settled detent when pointer capture is lost', async () => {
		const { hook, onDismiss } = await setup({ snapHeights: () => [200] });
		const target = makeTarget();
		down(hook, 0, 0, target);
		move(hook, 300, 1000, target);

		act(() => hook.result().handleProps.onlostpointercapture(pointerEvent(300, 1000, target)));

		expect(hook.result().isDragging).toBe(false);
		expect(transformOf(hook)).toBeUndefined();
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('does not start a drag from a secondary pointer button', async () => {
		const { hook } = await setup();
		const target = makeTarget();
		act(() => hook.attachSheet(target));

		act(() => hook.result().handleProps.onpointerdown(pointerEvent(0, 0, target, 1, 2)));

		expect(hook.result().isDragging).toBe(false);
	});

	it('rubber-bands an upward drag past the fully-open position', async () => {
		const { hook } = await setup({ snapHeights: () => [200] });
		const t = makeTarget();
		down(hook, 100, 0, t);
		move(hook, 20, 100, t); // drag up 80px past the top of a rested-at-top sheet
		// Overscroll is allowed but damped: a resisted fraction of the raw -80,
		// and negative (above the top), not the raw distance and not clamped to 0.
		const off = hook.result().dragOffset;
		expect(off).toBeLessThan(0);
		expect(off).toBeGreaterThan(-80); // resisted, so smaller in magnitude
	});

	it('dismisses a single-height sheet on a slow drag past the floor', async () => {
		const { hook, onDismiss } = await setup(); // no snapHeights
		const t = makeTarget();
		// Only detent is the full 400px height (offset 0). A slow drag past 40%
		// of it (>160px) with no detent to catch it dismisses.
		down(hook, 0, 0, t);
		move(hook, 120, 400, t);
		move(hook, 240, 900, t);
		up(hook, 240, 1400, t);
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	describe('body overscroll', () => {
		// A scrollable body element nested inside the sheet, with a settable
		// scrollTop so we can simulate "at the top" vs "scrolled".
		function makeBody(scrollTop: number) {
			const body = document.createElement('div');
			Object.defineProperty(body, 'scrollTop', {
				value: scrollTop,
				writable: true
			});
			body.setPointerCapture = vi.fn();
			body.releasePointerCapture = vi.fn();
			body.getBoundingClientRect = () => ({ height: SHEET_HEIGHT }) as DOMRect;
			return body;
		}
		function bodyDown(hook: Hook, y: number, t: number, el: HTMLElement) {
			// Register a sheet element so the hook can measure height (it reads the
			// tracked node, not the DOM). The body stands in with the right height.
			act(() => hook.attachSheet(el));
			act(() => hook.result().bodyProps.onpointerdown(pointerEvent(y, t, el)));
		}
		function bodyMove(hook: Hook, y: number, t: number, el: HTMLElement) {
			act(() => hook.result().bodyProps.onpointermove(pointerEvent(y, t, el)));
		}

		it('promotes a top-overscroll pull-down into a sheet drag', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const body = makeBody(0); // at the top
			bodyDown(hook, 0, 0, body);
			bodyMove(hook, 40, 100, body); // pull down while at the top
			expect(hook.result().isDragging).toBe(true);
			expect(hook.result().dragOffset).toBe(40);
		});

		it('does not hijack scrolling when the body is scrolled down', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const body = makeBody(120); // scrolled, not at the top
			bodyDown(hook, 0, 0, body);
			bodyMove(hook, 40, 100, body);
			expect(hook.result().isDragging).toBe(false);
		});

		it('does not start a drag on an upward move from the top', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const body = makeBody(0);
			bodyDown(hook, 100, 0, body);
			bodyMove(hook, 60, 100, body); // moving up = scrolling intent
			expect(hook.result().isDragging).toBe(false);
		});
	});

	describe('body touch handoff', () => {
		// Attach a real DOM node via the body ref, then dispatch touch events. The
		// hook's non-passive touchmove listener is how the handoff works on touch
		// devices (pointer events get cancelled once native panning starts).
		function makeScroller(opts: { scrollTop: number; clientHeight: number; scrollHeight: number }) {
			const sheet = makeTarget();
			const el = document.createElement('div');
			Object.defineProperty(el, 'scrollTop', {
				value: opts.scrollTop,
				writable: true
			});
			Object.defineProperty(el, 'clientHeight', { value: opts.clientHeight });
			Object.defineProperty(el, 'scrollHeight', { value: opts.scrollHeight });
			el.getBoundingClientRect = () => ({ height: SHEET_HEIGHT }) as DOMRect;
			sheet.appendChild(el);
			document.body.appendChild(sheet);
			return el;
		}
		function touch(el: HTMLElement, type: string, y: number, id = 1) {
			const ev = new Event(type, { bubbles: true, cancelable: true });
			// A plain `Event` with the touch lists defined on it, as upstream builds
			// it: upstream's reason is that jsdom has no `TouchEvent`, and it stays
			// that way here because it keeps the identifiers and coordinates the
			// handler reads under the case's control.
			Object.defineProperty(ev, 'changedTouches', {
				value: [{ identifier: id, clientY: y }]
			});
			Object.defineProperty(ev, 'touches', {
				value: type === 'touchend' || type === 'touchcancel' ? [] : [{ identifier: id, clientY: y }]
			});
			Object.defineProperty(ev, 'currentTarget', { value: el });
			el.dispatchEvent(ev);
			return ev;
		}

		it('promotes a top pull-down (touch) into a sheet drag', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = makeScroller({
				scrollTop: 0,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			act(() => {
				touch(el, 'touchstart', 0);
				touch(el, 'touchmove', 50);
			});
			expect(hook.result().isDragging).toBe(true);
		});

		it('promotes a bottom pull-up (touch) into a sheet drag that travels', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			// scrolled to the bottom: scrollTop + clientHeight === scrollHeight
			const el = makeScroller({
				scrollTop: 600,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			// Settle at the lower detent first, so expanding has somewhere to go.
			down(hook, 0, 0, el);
			move(hook, 180, 700, el);
			up(hook, 180, 1100, el);
			expect(hook.result().settledOffset).toBe(200);

			act(() => {
				touch(el, 'touchstart', 300);
				touch(el, 'touchmove', 250); // pull up
			});
			expect(hook.result().isDragging).toBe(true);
			// The handoff is only worth taking if the sheet follows the finger:
			// 50px of pull expands 50px toward the tallest detent.
			expect(hook.result().dragOffset).toBe(150);
		});

		it('leaves a bottom pull-up with the scroller at the tallest detent', async () => {
			// Regression: the sheet is already fully expanded, so an upward pull has
			// nowhere to expand to. Promoting it produced a rubber-band the release
			// threw straight back, and stole the gesture from the scroller.
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = makeScroller({
				scrollTop: 600,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			expect(hook.result().settledOffset).toBe(0);

			act(() => {
				touch(el, 'touchstart', 300);
				touch(el, 'touchmove', 250); // pull up
			});
			expect(hook.result().isDragging).toBe(false);
			expect(hook.result().dragOffset).toBe(0);
		});

		it('does not preventDefault a bottom pull-up at the tallest detent', async () => {
			// The captured gesture was the worse half of the bug: once promoted,
			// every later touchmove was preventDefault()ed, so reversing downward to
			// scroll back collapsed the sheet instead of scrolling.
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = makeScroller({
				scrollTop: 600,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));

			let pullUp: Event | undefined;
			let reverseDown: Event | undefined;
			act(() => {
				touch(el, 'touchstart', 300);
				pullUp = touch(el, 'touchmove', 250);
				reverseDown = touch(el, 'touchmove', 400);
			});
			expect(pullUp?.defaultPrevented).toBe(false);
			expect(reverseDown?.defaultPrevented).toBe(false);
			expect(hook.result().isDragging).toBe(false);
		});

		it('finishes the active drag when another ended touch is listed first', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = makeScroller({
				scrollTop: 0,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			act(() => {
				touch(el, 'touchstart', 0, 2);
				touch(el, 'touchmove', 300, 2);

				const end = new Event('touchend', {
					bubbles: true,
					cancelable: true
				});
				Object.defineProperty(end, 'changedTouches', {
					value: [
						{ identifier: 1, clientY: 100 },
						{ identifier: 2, clientY: 300 }
					]
				});
				Object.defineProperty(end, 'touches', { value: [] });
				el.dispatchEvent(end);
			});

			expect(hook.result().isDragging).toBe(false);
		});

		it('leaves native scrolling alone in the middle of the content', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = makeScroller({
				scrollTop: 300,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			act(() => {
				touch(el, 'touchstart', 300);
				touch(el, 'touchmove', 250);
			});
			expect(hook.result().isDragging).toBe(false);
		});
	});

	describe('body touch handoff mid-gesture', () => {
		// The reported bug: the finger lands mid-content, swipes up, REACHES the
		// end of the content, and keeps pulling in the same continuous gesture.
		// Arming decided at touchstart can never see that, and by the time the
		// scroller is at its end the browser owns the gesture — every remaining
		// touchmove is non-cancelable, so preventDefault() is not available to
		// promote with. These cases pin the anchored, cancel-free handoff instead.
		function makeScroller(opts: { scrollTop: number; clientHeight: number; scrollHeight: number }) {
			const sheet = makeTarget();
			const el = document.createElement('div');
			Object.defineProperty(el, 'scrollTop', {
				value: opts.scrollTop,
				writable: true
			});
			Object.defineProperty(el, 'clientHeight', { value: opts.clientHeight });
			Object.defineProperty(el, 'scrollHeight', { value: opts.scrollHeight });
			el.getBoundingClientRect = () => ({ height: SHEET_HEIGHT }) as DOMRect;
			sheet.appendChild(el);
			document.body.appendChild(sheet);
			return el;
		}
		function touch(el: HTMLElement, type: string, y: number, id = 1) {
			const ev = new Event(type, { bubbles: true, cancelable: true });
			Object.defineProperty(ev, 'changedTouches', {
				value: [{ identifier: id, clientY: y }]
			});
			Object.defineProperty(ev, 'touches', {
				value: type === 'touchend' || type === 'touchcancel' ? [] : [{ identifier: id, clientY: y }]
			});
			Object.defineProperty(ev, 'currentTarget', { value: el });
			el.dispatchEvent(ev);
			return ev;
		}
		// A scroller with 600px of scrollable content, resting one detent down so
		// an upward pull has somewhere to expand to.
		function midDetentScroller(hook: Hook, scrollTop: number) {
			const el = makeScroller({
				scrollTop,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			down(hook, 0, 0, el);
			move(hook, 180, 700, el);
			up(hook, 180, 1100, el);
			expect(hook.result().settledOffset).toBe(200);
			return el;
		}

		// iOS Safari raises PointerEvents for a finger under the SAME numeric id
		// it puts in `Touch.identifier`, so a drag the touch path starts is keyed
		// to a live pointer. WebKit takes that pointer's capture straight back,
		// and the `lostpointercapture` that follows used to cancel the drag one
		// event after it began — leaving the sheet inert for the rest of the pull
		// while the handle still worked. Every browser that keeps the two id
		// spaces apart hides this, which is why it only showed up on device.
		it('survives a lostpointercapture for the finger driving it', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 600); // parked at the content end
			act(() => {
				touch(el, 'touchstart', 500, 7);
				touch(el, 'touchmove', 450, 7); // promotes at the armed bottom edge
			});
			expect(hook.result().isDragging).toBe(true);
			act(() => {
				hook.result().bodyProps.onlostpointercapture(
					pointerEvent(450, 0, el, 7) // same id as the touch: iOS does this
				);
			});
			expect(hook.result().isDragging).toBe(true);
			act(() => {
				touch(el, 'touchmove', 400, 7);
			});
			// 100px of pull past the touchstart, from the 200px detent.
			expect(hook.result().dragOffset).toBe(100);
		});

		// `pointercancel` for that same finger arrives the moment WebKit claims
		// the gesture. Ending the drag on it settles the sheet mid-pull.
		it('does not end the touch drag on a pointercancel for that finger', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 600);
			act(() => {
				touch(el, 'touchstart', 500, 7);
				touch(el, 'touchmove', 450, 7);
			});
			act(() => {
				hook.result().bodyProps.onpointercancel(pointerEvent(450, 0, el, 7));
			});
			expect(hook.result().isDragging).toBe(true);
		});

		it('hands off when the content runs out under a moving finger', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 300); // finger lands mid-content
			act(() => {
				touch(el, 'touchstart', 500);
				el.scrollTop = 450; // the swipe scrolls the content...
				touch(el, 'touchmove', 350);
				el.scrollTop = 600; // ...until it runs out at the bottom
				touch(el, 'touchmove', 200); // the content ended here
				touch(el, 'touchmove', 150); // 50px BEYOND the end
			});
			expect(hook.result().isDragging).toBe(true);
			// Anchored where the content ran out, so only the 50px past it moves the
			// sheet. Anchoring at touchstart would have thrown it 350px instead.
			expect(hook.result().dragOffset).toBe(150);
		});

		it('does not preventDefault the mid-gesture handoff', async () => {
			// By this point in the gesture the events are non-cancelable anyway, and
			// there is nothing to cancel: the scroller is clamped at its end.
			// Claiming the gesture would only strand the content under the finger.
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 300);
			let atEnd: Event | undefined;
			let past: Event | undefined;
			let further: Event | undefined;
			act(() => {
				touch(el, 'touchstart', 500);
				el.scrollTop = 600;
				atEnd = touch(el, 'touchmove', 200);
				past = touch(el, 'touchmove', 150);
				further = touch(el, 'touchmove', 100);
			});
			expect(hook.result().isDragging).toBe(true);
			expect(atEnd?.defaultPrevented).toBe(false);
			expect(past?.defaultPrevented).toBe(false);
			expect(further?.defaultPrevented).toBe(false);
		});

		it('gives the gesture back when the finger returns to the content end', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 300);
			act(() => {
				touch(el, 'touchstart', 500);
				el.scrollTop = 600;
				touch(el, 'touchmove', 200); // the content ended here
				touch(el, 'touchmove', 150);
			});
			expect(hook.result().dragOffset).toBe(150);

			act(() => {
				touch(el, 'touchmove', 210); // back below the anchor
			});
			// The native scroll was never cancelled, so it resumes from here. Two
			// things moving at once is the failure mode; the sheet yields.
			expect(hook.result().isDragging).toBe(false);
			expect(hook.result().settledOffset).toBe(200);

			act(() => {
				el.scrollTop = 600; // scrolled back to the end
				touch(el, 'touchmove', 190); // and pulls past it again
				touch(el, 'touchmove', 140);
			});
			expect(hook.result().isDragging).toBe(true);
			expect(hook.result().dragOffset).toBe(150);
		});

		it('does not hand off on reaching the end without travelling past it', async () => {
			// Landing on the last pixel is not a pull, and the momentum tail after
			// the finger lifts fires no touchmove at all, so it can never promote.
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 300);
			act(() => {
				touch(el, 'touchstart', 500);
				el.scrollTop = 600;
				touch(el, 'touchmove', 200);
				touch(el, 'touchmove', 199); // jitter, not a pull
				touch(el, 'touchend', 199);
				el.scrollTop = 600; // momentum carries on with no finger down
			});
			expect(hook.result().isDragging).toBe(false);
			expect(hook.result().settledOffset).toBe(200);
		});

		it('leaves the mid-gesture pull to the content at the tallest detent', async () => {
			// Same #5161 rule as the touchstart-armed edge: with no taller detent
			// there is nothing to expand into, so the scroller keeps the gesture.
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = makeScroller({
				scrollTop: 300,
				clientHeight: 200,
				scrollHeight: 800
			});
			act(() => hook.attachSheet(el));
			act(() => hook.attachBody(el));
			expect(hook.result().settledOffset).toBe(0);

			let past: Event | undefined;
			act(() => {
				touch(el, 'touchstart', 500);
				el.scrollTop = 600;
				touch(el, 'touchmove', 200);
				past = touch(el, 'touchmove', 100);
			});
			expect(hook.result().isDragging).toBe(false);
			expect(hook.result().dragOffset).toBe(0);
			expect(past?.defaultPrevented).toBe(false);
		});

		it('does not hand off while the content can still scroll', async () => {
			const { hook } = await setup({ snapHeights: () => [200] });
			const el = midDetentScroller(hook, 0);
			act(() => {
				touch(el, 'touchstart', 500);
				el.scrollTop = 200;
				touch(el, 'touchmove', 300);
				el.scrollTop = 400;
				touch(el, 'touchmove', 100); // 400px of pull, all of it scrolling
			});
			expect(hook.result().isDragging).toBe(false);
			expect(hook.result().settledOffset).toBe(200);
		});
	});

	describe('viewport resize', () => {
		// The panel pins the sheet's height in px at a resizing detent; everywhere
		// else the height comes from CSS (`92dvh`), which follows the viewport.
		// Model both, so a measurement taken while pinned reads the pin back —
		// that is the trap the hook has to work around.
		const SNAP_FRACTIONS = [0.14, 0.5, 0.92];
		const RESERVED_BELOW_FLOOR = 48;

		async function viewportHarness(initialViewport: number) {
			let viewport = initialViewport;
			const el = document.createElement('div');
			el.setPointerCapture = vi.fn();
			el.releasePointerCapture = vi.fn();
			el.getBoundingClientRect = () =>
				({
					height: el.style.height
						? Number.parseFloat(el.style.height)
						: 0.92 * viewport + RESERVED_BELOW_FLOOR
				}) as DOMRect;

			const onSnap = vi.fn();
			const { hook, screen } = await setup({
				offscreenBlockEndInset: RESERVED_BELOW_FLOOR,
				snapHeights: () => SNAP_FRACTIONS.map((f) => f * viewport),
				onSnap
			});
			act(() => hook.attachSheet(el));

			// What BottomSheetPanel renders at rest.
			const paint = () => {
				const { sheetHeight, settledLayoutOffset } = hook.result();
				el.style.height = settledLayoutOffset > 0 ? `${sheetHeight - settledLayoutOffset}px` : '';
			};
			const dragTo = (offset: number) => {
				// Anchor anywhere; what matters is the delta from where it rests, so
				// this drags in whichever direction the target detent lies.
				const anchor = 1000;
				const delta = offset - hook.result().settledOffset;
				act(() => hook.result().handleProps.onpointerdown(pointerEvent(anchor, 0, el)));
				// Slow: well under the flick threshold, so the release settles.
				act(() => hook.result().handleProps.onpointermove(pointerEvent(anchor + delta, 2000, el)));
				act(() => hook.result().handleProps.onpointerup(pointerEvent(anchor + delta, 2400, el)));
				// The panel resolves the settle when the transform transition ends.
				act(() => hook.result().completeScrollAreaSettle());
				paint();
			};
			const resizeTo = (next: number) => {
				viewport = next;
				act(() => {
					window.dispatchEvent(new Event('resize'));
				});
				paint();
			};
			// What the user sees: the border box, less the part reserved below the
			// viewport floor and the part translated past it.
			const visibleHeight = () =>
				hook.result().sheetHeight - RESERVED_BELOW_FLOOR - hook.result().settledOffset;

			return { hook, screen, el, onSnap, dragTo, resizeTo, visibleHeight };
		}

		it('re-resolves the settled detent against the new viewport', async () => {
			// 900px viewport: detents at 0 / 378 / 702, so the half-height stop
			// shows 450px of sheet.
			const { hook, dragTo, resizeTo, visibleHeight, onSnap } = await viewportHarness(900);
			dragTo(378);
			expect(hook.result().settledOffset).toBe(378);
			expect(visibleHeight()).toBe(450);

			resizeTo(600);

			// Still the half-height stop, now half of 600 — not the 450px (75% of
			// the window) it was frozen at before.
			expect(visibleHeight()).toBe(300);
			expect(hook.result().settledOffset).toBe(252);
			expect(onSnap).toHaveBeenLastCalledWith(300);
		});

		it('keeps the peek detent on screen when the viewport shrinks', async () => {
			const { hook, dragTo, resizeTo, visibleHeight } = await viewportHarness(900);
			dragTo(702);
			expect(hook.result().settledOffset).toBe(702);
			// The peek keeps its full height and slides, so its offset is the whole
			// of its travel — and 702px of travel does not fit in a 600px window.
			expect(hook.result().settledLayoutOffset).toBe(0);

			resizeTo(600);

			expect(hook.result().settledOffset).toBe(468);
			expect(hook.result().settledOffset).toBeLessThan(hook.result().sheetHeight);
			expect(visibleHeight()).toBe(84);
		});

		it('refreshes the fully open height the next drag measures against', async () => {
			const { hook, dragTo, resizeTo } = await viewportHarness(900);
			dragTo(378);
			expect(hook.result().sheetHeight).toBe(876);

			resizeTo(600);

			// Measured through the pinned height the panel had written for the old
			// viewport, so this is the natural budget and not the stale pin.
			expect(hook.result().sheetHeight).toBe(600);

			// Dragging back up lands on fully open rather than overshooting past it
			// toward where fully open used to be.
			dragTo(0);
			expect(hook.result().settledOffset).toBe(0);
			expect(hook.result().settledLayoutOffset).toBe(0);
		});

		it('leaves a drag in progress alone', async () => {
			const { hook, el } = await viewportHarness(900);
			act(() => hook.result().handleProps.onpointerdown(pointerEvent(0, 0, el)));
			act(() => hook.result().handleProps.onpointermove(pointerEvent(200, 2000, el)));

			act(() => {
				window.dispatchEvent(new Event('resize'));
			});

			expect(hook.result().isDragging).toBe(true);
			expect(hook.result().sheetHeight).toBe(876);
			expect(hook.result().settledOffset).toBe(0);
		});

		it('stops re-resolving once the sheet closes', async () => {
			const { hook, screen, dragTo, resizeTo } = await viewportHarness(900);
			dragTo(378);
			await screen.rerender({ isOpen: false });

			resizeTo(600);

			expect(hook.result().sheetHeight).toBe(876);
		});
	});
});
