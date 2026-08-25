/**
 * Ported from Astryx's `DateInput/useScrollSettle.ts`.
 *
 * A snap scroller commits its value when it comes to rest, so it needs a
 * "scrolling stopped" signal. `scrollend` is that signal, but it is recent
 * enough that mobile Safari below 26 does not have it — and it is exactly the
 * browser this component targets. So: listen for `scrollend` where it exists,
 * and fall back to a quiet-period timer everywhere else.
 *
 * ## The two things the timer must not mistake for rest
 *
 * A quiet period is a guess, and on iOS it guesses wrong twice unless it is
 * told otherwise. Both mistakes were behind the same bug: opening the
 * month/year wheels, flicking to an earlier month, and watching the month
 * climb on its own afterwards — on real iOS and the simulator, never in
 * Chrome.
 *
 * 1. **A finger resting mid-drag is not rest.** Hold a wheel still for a
 *    moment without lifting and the scroll events stop, so the timer fires
 *    and the value commits to whatever is under the band. Chrome hides this
 *    because it has `scrollend`, which does not fire until the touch is
 *    released.
 *
 * 2. **Momentum is not rest either.** iOS momentum runs on the UI thread and
 *    keeps going for a second or more after the finger is gone, and its scroll
 *    events arrive irregularly — the gaps in the slow tail routinely exceed
 *    any sane quiet period. Chrome's compositor-driven momentum fires evenly,
 *    so the same timer never trips there.
 *
 * A premature settle is not just a wrong value; it feeds back. The commit
 * moves the value, the value moves the scroller back onto the committed row,
 * that programmatic scroll does not stop the momentum still running
 * underneath, and the fresh scroll events start the next premature settle —
 * each one landing a row further along, which is why the month climbed.
 *
 * So: the settle waits for the touch to end, and then for a quiet period
 * measured from the LAST scroll event, which is what makes it outlast
 * momentum however long it runs. {@link useScrollSettle} also reports whether
 * the scroller is at rest, so a caller can refuse to reposition one that is
 * still moving.
 *
 * ## Translation
 *
 * Upstream's `useEffect(..., [ref, isEnabled])` becomes one `$effect` reading
 * exactly those two getters, so the listeners re-attach on the same two
 * changes and on no others.
 *
 * Upstream's `onSettleRef` — a ref holding a callback "that may change every
 * render" — has **no counterpart**, and deliberately: React recreates the
 * closure on every render, so a dependency on it would tear the listeners off
 * mid-scroll. A Svelte component's `function onSettle() {}` is one stable
 * identity for the component's whole life, and it reads its `$state` at call
 * time. It is passed as a plain value, not a getter, so it never registers as
 * a dependency of the effect.
 *
 * `isAtRestRef` becomes a plain `let` exposed through a getter object. Plain,
 * not `$state`, for the reason upstream uses a ref: `Wheel`'s park effect
 * *reads* this while depending on `isActive`/`selectedIndex` alone, and making
 * it reactive would re-run that effect on every scroll — the very repositioning
 * mid-flight the flag exists to prevent.
 */

/**
 * How long the scroller must be quiet before a settle is assumed. Long enough
 * to outlast the browser's own snap animation (~150-300ms after the finger
 * lifts), or a wheel would commit to whichever option it was passing rather
 * than the one it settles on.
 */
export const SCROLL_QUIET_MS = 220;

/** What {@link useScrollSettle} reports back about the scroller's state. */
export interface ScrollSettleState {
	/**
	 * False from the first touch until the scroller has genuinely stopped —
	 * momentum included. Read it before repositioning the scroller: doing that
	 * mid-flight fights the platform and, on iOS, restarts the cycle described
	 * in the file header.
	 */
	readonly isAtRest: boolean;
}

/**
 * Run `onSettle` when `element`'s scroller stops scrolling.
 *
 * @param element - getter for the scroll container
 * @param onSettle - called with the settled element
 * @param isEnabled - getter; skip attaching while false (e.g. a hidden panel)
 */
export function useScrollSettle(
	element: () => HTMLElement | null,
	onSettle: (element: HTMLElement) => void,
	isEnabled: () => boolean = () => true
): ScrollSettleState {
	let isAtRest = true;

	$effect(() => {
		const node = element();
		if (node == null || !isEnabled()) {
			isAtRest = true;
			return;
		}

		let timer: ReturnType<typeof setTimeout> | undefined;
		let hasSettled = false;
		let isTouching = false;

		const settle = (): void => {
			// A finger still on the glass is not rest, however quiet the scroller
			// has gone. The release re-arms this.
			if (hasSettled || isTouching) {
				return;
			}
			hasSettled = true;
			isAtRest = true;
			clearTimeout(timer);
			onSettle(node);
		};

		const arm = (): void => {
			clearTimeout(timer);
			timer = setTimeout(settle, SCROLL_QUIET_MS);
		};

		const onScroll = (): void => {
			// A fresh scroll re-opens the window: whatever we settle on now is
			// stale, and the settle that matters is the one after this gesture.
			// Momentum keeps arriving here, so the quiet period is measured from
			// the last of it however long it runs.
			hasSettled = false;
			isAtRest = false;
			arm();
		};

		const onTouchStart = (): void => {
			isTouching = true;
			hasSettled = false;
			isAtRest = false;
			clearTimeout(timer);
		};

		const onTouchEnd = (): void => {
			isTouching = false;
			// Momentum may carry on from here and will re-arm this on its own; the
			// timer covers the case where the finger lifted without a fling, which
			// produces no further scroll events at all.
			arm();
		};

		node.addEventListener('scroll', onScroll, { passive: true });
		node.addEventListener('scrollend', settle);
		node.addEventListener('touchstart', onTouchStart, { passive: true });
		node.addEventListener('touchend', onTouchEnd, { passive: true });
		node.addEventListener('touchcancel', onTouchEnd, { passive: true });

		return () => {
			clearTimeout(timer);
			node.removeEventListener('scroll', onScroll);
			node.removeEventListener('scrollend', settle);
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchend', onTouchEnd);
			node.removeEventListener('touchcancel', onTouchEnd);
		};
	});

	return {
		get isAtRest() {
			return isAtRest;
		}
	};
}
