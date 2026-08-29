/**
 * Ported from Astryx's `DateInput/usePointerDragScroll.ts`.
 *
 * ## Why this exists
 *
 * A wheel is a scroll container, which is what makes it feel right under a
 * finger: the platform supplies panning, momentum, rubber-banding and the
 * snap. A mouse gets none of that. Browsers do not drag-scroll an overflow
 * container — press and pull on one and nothing happens at all, which is
 * exactly what a wheel invites you to try.
 *
 * That leaves the mouse with the scroll wheel and a click on a visible row.
 * Both work, and neither is the gesture the control is shaped like. It
 * matters more than "mouse users are not the target": the touch surface is
 * reviewed, themed and screenshotted on desktop browsers, where a wheel that
 * ignores the pointer reads as broken rather than as touch-only.
 *
 * ## Mouse only, deliberately
 *
 * Touch and pen already pan natively, and this hook would be strictly worse
 * than what they get — no momentum, no rubber-banding, no compositor
 * threading. So it ignores every pointer type but `mouse` and leaves those
 * gestures untouched.
 *
 * ## Snap has to be suspended for the duration
 *
 * `scroll-snap-type: y mandatory` re-snaps after every scroll, including a
 * programmatic one, so a drag that assigns `scrollTop` is fighting it on
 * every frame. Measured: dragging 5px at a time with mandatory snap on, 7 of
 * 8 steps were yanked back to a snap position — the wheel sticks to a row and
 * then jumps a whole one. The drag therefore suspends snapping, and restores
 * it once the release has settled somewhere legal.
 *
 * ## Translation
 *
 * One `$effect` over upstream's one `useEffect`, on the same two dependencies
 * (`[ref, isEnabled]`). Every `let` inside the effect body is upstream's own
 * — they are gesture bookkeeping nothing renders from, so a rune would
 * schedule an update on each `pointermove` for no reason.
 */

/**
 * Movement below this stays a click. A mouse shifts a pixel or two under the
 * press of the button itself, and a wheel row is a click target.
 */
export const DRAG_SLOP = 4;

/** How long to wait for a release's settle before restoring snapping. */
const SETTLE_FALLBACK_MS = 260;

/**
 * The pitch of the rows, read off the first one. Taken from layout rather
 * than the token so a themed wheel item size is honoured without this hook
 * having to know the constant exists.
 */
function firstRowHeight(element: HTMLElement): number {
	const row = element.querySelector('[role="option"]');
	return row instanceof HTMLElement ? row.offsetHeight : 0;
}

/**
 * Let a mouse drag `element`'s contents, on a container that already scrolls
 * and snaps for touch.
 *
 * @param element - getter for the scroll container
 * @param isEnabled - getter; skip while the wheel is hidden. A hidden panel
 *   keeps its layout box, so its listeners would otherwise still be live.
 */
export function usePointerDragScroll(
	element: () => HTMLElement | null,
	isEnabled: () => boolean = () => true
): void {
	$effect(() => {
		const node = element();
		if (node == null || !isEnabled()) {
			return;
		}

		let pointerId: number | null = null;
		let originY = 0;
		let originScrollTop = 0;
		let isDragging = false;
		// Survives from the drag's end to the click it produces, which is the
		// whole reason it is not just `isDragging`.
		let wasDragged = false;
		let restoreTimer: number | undefined;

		const restoreSnap = (): void => {
			window.clearTimeout(restoreTimer);
			node.removeEventListener('scrollend', restoreSnap);
			// Back to the stylesheet's value rather than a hardcoded one, so this
			// cannot drift from Wheel's own `scrollSnapType`.
			node.style.removeProperty('scroll-snap-type');
		};

		const suspendSnap = (): void => {
			window.clearTimeout(restoreTimer);
			node.removeEventListener('scrollend', restoreSnap);
			node.style.scrollSnapType = 'none';
		};

		const onPointerDown = (event: PointerEvent): void => {
			// Touch and pen pan natively, and better. Secondary buttons are for the
			// context menu.
			if (event.pointerType !== 'mouse' || event.button !== 0) {
				return;
			}
			// Keep the press away from BottomSheet, which starts its own
			// drag-to-dismiss from a `pointerdown` on its body and CAPTURES the
			// pointer for it. Two things go wrong if it gets there first: the drag
			// below is fighting the sheet for the same gesture, and — measured on
			// the calendar too, so this is not new — every later pointer event
			// retargets to the sheet body, which means a click that wobbles more
			// than a pixel or two never reaches the row under it and selects
			// nothing at all.
			//
			// A native listener during the real bubble phase is what it takes.
			// Upstream's reason is that the sheet's handler is a React prop
			// delegated at the root container; ours is the same in effect — the
			// sheet's handler sits on an ancestor element, and only a listener on
			// this element can stop the event before it arrives. Same trade too:
			// mouse drag-to-dismiss now starts from the grab handle, the header or
			// the scrim rather than from inside a wheel, which is where a picker
			// sheet puts it anyway.
			event.stopPropagation();
			pointerId = event.pointerId;
			originY = event.clientY;
			originScrollTop = node.scrollTop;
			isDragging = false;
			// Not captured yet: a press that never moves has to stay a click on the
			// row under it, and capturing here would retarget that click.
		};

		const onPointerMove = (event: PointerEvent): void => {
			if (pointerId !== event.pointerId) {
				return;
			}
			const delta = event.clientY - originY;
			if (!isDragging) {
				if (Math.abs(delta) < DRAG_SLOP) {
					return;
				}
				isDragging = true;
				node.setPointerCapture(event.pointerId);
				suspendSnap();
				// Dragging across rows would otherwise select their text, leaving the
				// wheel looking highlighted after the gesture.
				node.style.userSelect = 'none';
			}
			// Content follows the hand: pull up and the list moves up, which means
			// scrolling further down it.
			node.scrollTop = originScrollTop - delta;
		};

		const onPointerEnd = (event: PointerEvent): void => {
			if (pointerId !== event.pointerId) {
				return;
			}
			pointerId = null;
			if (!isDragging) {
				return;
			}
			isDragging = false;
			wasDragged = true;
			node.style.removeProperty('user-select');
			if (node.hasPointerCapture(event.pointerId)) {
				node.releasePointerCapture(event.pointerId);
			}

			// The release lands mid-row. Glide to the nearest one and only then let
			// snapping back on — restoring it here instead would jump the distance
			// rather than travel it, and a jump is what this hook exists to avoid.
			const rowHeight = firstRowHeight(node);
			if (rowHeight > 0) {
				const nearest = Math.round(node.scrollTop / rowHeight) * rowHeight;
				node.scrollTo({ top: nearest, behavior: 'smooth' });
			}
			// `scrollend` is the honest signal; the timer covers browsers that do
			// not fire it, and the case where the glide had nowhere to go.
			// Not `{once: true}`: a listener that never fires is never removed by
			// it, so a component destroyed mid-glide would leave one attached.
			// `restoreSnap` removes it itself, whichever of the two gets there
			// first, and the teardown below calls `restoreSnap`.
			node.addEventListener('scrollend', restoreSnap);
			restoreTimer = window.setTimeout(restoreSnap, SETTLE_FALLBACK_MS);
		};

		// A drag ends over whichever row the mouse happens to be on, and that row
		// would take the click as a selection. Swallow it — but only the one, and
		// only after a real drag, so an ordinary click still selects.
		const onClickCapture = (event: MouseEvent): void => {
			if (!wasDragged) {
				return;
			}
			wasDragged = false;
			event.stopPropagation();
			event.preventDefault();
		};

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerEnd);
		node.addEventListener('pointercancel', onPointerEnd);
		node.addEventListener('click', onClickCapture, { capture: true });

		return () => {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerEnd);
			node.removeEventListener('pointercancel', onPointerEnd);
			node.removeEventListener('click', onClickCapture, { capture: true });
			restoreSnap();
		};
	});
}
