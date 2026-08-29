/**
 * Ported from Astryx's `DateInput/useOwnScrollGesture.ts`.
 *
 * Lets a nested scroller keep the finger that lands on it.
 *
 * ## The conflict
 *
 * `BottomSheet` implements swipe-to-dismiss by watching touches on its
 * scrolling body: at the body's scroll top, a downward pull stops being a
 * scroll and becomes a sheet drag. The test is `body.scrollTop`, and the body
 * of a sheet sized to hug its content never scrolls, so it reads as "at the
 * top" forever — every downward-ish drag anywhere inside promotes to a drag.
 *
 * `touch-action` does NOT protect against this. It governs what the BROWSER
 * will pan natively; the sheet's listener is JavaScript, and its
 * `preventDefault()` cancels the native scroll whatever `touch-action` says.
 * Measured: with `touch-action: pan-x` on the month scroller, a swipe just 9°
 * off horizontal (120px across, 20px down — an ordinary thumb arc) had every
 * `touchmove` cancelled by the sheet, so the calendar did not move at all and
 * the sheet sprang back. The month simply would not change.
 *
 * ## Two ways to own a gesture
 *
 * - `'all'` — the wheels. They scroll vertically, exactly the axis the sheet
 *   wants, so there is no way to share: the scroller takes every touch that
 *   lands on it and the sheet is dismissed from the handle, the header or the
 *   scrim instead.
 *
 * - `'inline'` — the month scroller. It pages sideways, so the two CAN share
 *   by direction: lock the axis on the first significant move, claim the
 *   gesture only when it is horizontal, and let vertical ones through so
 *   swipe-to-dismiss still works on the calendar.
 *
 * ## Where the line falls, and the gestures that fall past it
 *
 * A thumb swiping sideways travels in an arc, not a line — a "horizontal"
 * swipe routinely drifts 10-30° down, and sometimes further. So an `'inline'`
 * scroller claims generously: vertical has to beat horizontal by
 * {@link VERTICAL_DOMINANCE} before the sheet gets the gesture, which puts the
 * split near 63° rather than at the diagonal.
 *
 * That is wider than the browser will pan. `touch-action: pan-x` pans only
 * while `|dx| > |dy|` and refuses the moment a gesture tips past 45°, so the
 * band between the two lines used to be the worst outcome available: measured
 * on an iPhone 15 profile, a 200px swipe at 45-60° neither paged a month nor
 * dismissed the sheet, because we had told the sheet to keep off a gesture the
 * compositor then declined to pan. Nothing moved at all.
 *
 * {@link OwnScrollGestureOptions.onSwipe} closes that band, and it does not
 * need to know where the browser's line is: if the element's scroll offset
 * never changed across a claimed gesture, the browser declined it, and a
 * swipe that cleared {@link SWIPE_DISTANCE} is reported so the caller can page
 * itself. Native pans keep their momentum and snapping and report nothing.
 *
 * The remaining asymmetry is deliberate and in the direction the scroller
 * needs: it is generous about distance too, paging on a 30px flick where the
 * sheet asks for ~200px of pull before it dismisses.
 *
 * ## Why native listeners
 *
 * The sheet's own handler sits on an ANCESTOR element, so `stopPropagation`
 * has to happen on a listener attached to this element itself, during the real
 * bubble phase, before the event ever reaches the body. (Upstream states this
 * against React's root-delegated events; the conclusion is identical here,
 * where Svelte's delegated handlers also run from an ancestor.)
 *
 * Nothing here calls `preventDefault`, so the listeners stay passive and the
 * scroller keeps native momentum, snapping and rubber-banding.
 *
 * ## Translation
 *
 * One `$effect` for upstream's one `useEffect`, on the same three
 * dependencies (`[ref, axis, isEnabled]`) — all read as getters at the top of
 * the body, so a change to any of them re-attaches and a change to anything
 * else does not.
 *
 * Upstream's `onSwipeRef` has no counterpart: `onSwipe` is read from the
 * options getter inside `onEnd`, which runs from a listener rather than an
 * effect body, so the read is both current and untracked — the two properties
 * the ref was there to provide.
 */

/**
 * How much a gesture's vertical travel must exceed its horizontal travel
 * before an `'inline'` scroller gives it up. Above 1, so horizontal wins the
 * ambiguous middle; see the file header for why the split is deliberately
 * unfair, and how the gestures past the browser's own 45° line are handled.
 */
export const VERTICAL_DOMINANCE = 2;

/** Movement below this is noise, not a direction. */
const AXIS_LOCK_SLOP = 6;

/**
 * Horizontal travel a claimed-but-unpanned gesture needs before it counts as
 * a swipe. Roughly the shortest flick the browser itself will page on.
 */
export const SWIPE_DISTANCE = 32;

export type OwnedAxis = 'all' | 'inline';

export interface OwnScrollGestureOptions {
	/**
	 * Skip while the scroller is hidden; a hidden panel keeps its layout box,
	 * so its listeners would otherwise still be live.
	 */
	isEnabled?: boolean;
	/**
	 * Called when a claimed gesture ended without the browser having scrolled
	 * the element at all — the diagonal swipes `touch-action: pan-x` refuses.
	 *
	 * `direction` is the sign to move the scroll offset by, so it composes
	 * directly: `scrollBy({left: direction * pageWidth})`. It is physical, and
	 * therefore correct in both directions of writing.
	 *
	 * Only fires for `'inline'`. A gesture the browser panned reports nothing,
	 * so momentum and snapping are never second-guessed.
	 */
	onSwipe?: (direction: 1 | -1) => void;
}

/**
 * Claim touch gestures that start on `element`, so an ancestor cannot
 * reinterpret them as its own drag.
 *
 * @param element - getter for the scroll container
 * @param axis - getter; `'all'` to take every touch, `'inline'` to take only
 *   the horizontal ones and leave vertical drags to the sheet
 * @param options - getter for {@link OwnScrollGestureOptions}
 */
export function useOwnScrollGesture(
	element: () => HTMLElement | null,
	axis: () => OwnedAxis = () => 'all',
	options: () => OwnScrollGestureOptions = () => ({})
): void {
	$effect(() => {
		const node = element();
		const ownedAxis = axis();
		if (node == null || options().isEnabled === false) {
			return;
		}

		// null = not yet decided; true = ours for the rest of this gesture.
		let claimed: boolean | null = null;
		let originX = 0;
		let originY = 0;
		let lastX = 0;
		let offsetAtStart = 0;
		// Whether the browser actually panned the element during this gesture.
		// Sampled per move rather than compared once at the end, because a short
		// pan that snaps back finishes at the offset it started from.
		let didPan = false;

		const onStart = (event: TouchEvent): void => {
			const touch = event.touches[0];
			originX = touch?.clientX ?? 0;
			originY = touch?.clientY ?? 0;
			lastX = originX;
			offsetAtStart = node.scrollLeft;
			didPan = false;
			// 'all' decides at touchstart, before the sheet's own touchstart
			// listener records an armed edge. 'inline' cannot decide yet — a touch
			// has no direction until it moves — so it lets touchstart through and
			// locks on the first move that clears the slop.
			claimed = ownedAxis === 'all' ? true : null;
			if (claimed) {
				event.stopPropagation();
			}
		};

		const onMove = (event: TouchEvent): void => {
			if (claimed === false) {
				return;
			}
			const touch = event.touches[0];
			if (touch == null) {
				return;
			}
			if (claimed == null) {
				const dx = Math.abs(touch.clientX - originX);
				const dy = Math.abs(touch.clientY - originY);
				if (Math.max(dx, dy) < AXIS_LOCK_SLOP) {
					return;
				}
				claimed = dy <= dx * VERTICAL_DOMINANCE;
				if (!claimed) {
					return;
				}
			}
			lastX = touch.clientX;
			didPan ||= Math.abs(node.scrollLeft - offsetAtStart) >= 1;
			event.stopPropagation();
		};

		const onEnd = (): void => {
			// A gesture we claimed that the browser then refused to pan: the sheet
			// was told to keep off it, so unless it is acted on here it does
			// nothing at all. See the file header.
			if (
				claimed === true &&
				ownedAxis === 'inline' &&
				!didPan &&
				Math.abs(lastX - originX) >= SWIPE_DISTANCE
			) {
				options().onSwipe?.(lastX < originX ? 1 : -1);
			}
			// touchend/touchcancel deliberately propagate: they carry no
			// interpretation, and letting them through is what resets the sheet's
			// bookkeeping.
			claimed = null;
		};

		node.addEventListener('touchstart', onStart, { passive: true });
		node.addEventListener('touchmove', onMove, { passive: true });
		node.addEventListener('touchend', onEnd, { passive: true });
		node.addEventListener('touchcancel', onEnd, { passive: true });

		return () => {
			node.removeEventListener('touchstart', onStart);
			node.removeEventListener('touchmove', onMove);
			node.removeEventListener('touchend', onEnd);
			node.removeEventListener('touchcancel', onEnd);
		};
	});
}
