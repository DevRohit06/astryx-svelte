import { createAttachmentKey } from 'svelte/attachments';

/**
 * Ported from Astryx's `Toast/useToastGesture.ts`.
 *
 * Touch/pen swipe dismissal for one toast card. A drag along the block axis
 * *towards the viewport edge the toast entered from* follows the finger, fades
 * and shrinks the card, and on release either dismisses it (past the distance
 * threshold, or a short fast flick) or springs it back. A drag the other way, or
 * one that reads as horizontal, hands the gesture straight back to the page.
 *
 * The whole visual half is CSS custom properties this file sets on the card
 * (`--_toast-swipe-y`, `--_toast-swipe-opacity`, `--_toast-swipe-scale`,
 * `--_toast-swipe-exit-y`); `toast.stylex.ts` reads them through upstream's own
 * fallbacks, so the styles are inert until a gesture starts.
 *
 * Two translations, both following the `useSheetGestures` precedent — which is
 * the same split upstream makes, for the same reason:
 *
 * - **Pen** rides `on*` handler props, spread onto the card by the caller.
 * - **Touch** is wired with `addEventListener` from an attachment, because the
 *   passive flags are load-bearing: `touchmove` must be `{passive: false}` or
 *   its `preventDefault()` — the thing that stops the page scrolling under a
 *   swipe — is a no-op the browser only warns about. Svelte delegates
 *   `touchmove` handler *attributes* to the mount container, where the browser
 *   makes such listeners passive by default, so the attribute form cannot
 *   express upstream's listener.
 *
 * The attachment also replaces upstream's `rootRef`: `Toast.tsx` passes that ref
 * to the card and never reads it, so the hook's two return values collapse into
 * one spreadable object.
 *
 * The options come in as a **getter**. Everything the event handlers read is
 * read at event time, which is what upstream's `useCallback` dependency lists
 * achieve by recreating the callbacks; the one read that happens *during* the
 * attachment is `enabled`, so the attachment re-runs on exactly the values
 * upstream's touch effect re-runs on (`enabled`, and — through `beginGesture`'s
 * identity — `direction` and `canPauseTimer`).
 */

const DRAG_PROMOTION_SLOP = 8;
const SWIPE_DISMISS_RATIO = 0.4;
const FLICK_MIN_DISTANCE = 48;
const FLICK_VELOCITY = 1.2;
const VERTICAL_INTENT_RATIO = 1.2;
const SWIPE_EXIT_DISTANCE = '120%';
const SWIPE_ACTIVE_FADE_MAX = 0.4;
const SWIPE_ACTIVE_SCALE_MAX = 0.02;

/** Which way a toast leaves: `1` towards the block end, `-1` towards the start. */
export type ToastGestureDirection = 1 | -1;

interface GesturePoint {
	pointerId: number;
	clientX: number;
	clientY: number;
}

interface GestureState {
	pointerId: number;
	startX: number;
	startY: number;
	startTime: number;
	direction: ToastGestureDirection;
	intent: 'pending' | 'vertical' | 'opposite';
	pausedTimer: boolean;
	surfaceSize: number;
	dismissThreshold: number;
}

export interface UseToastGestureOptions {
	direction: ToastGestureDirection;
	enabled: boolean;
	canPauseTimer: boolean;
	isTimerPaused: () => boolean;
	pauseTimer: () => void;
	resumeTimer: () => void;
	dismiss: () => void;
	shouldIgnoreTarget: (target: EventTarget | null, root: HTMLElement) => boolean;
}

/**
 * Spread on the toast card: upstream's `bindings`, plus the attachment that
 * stands in for its `rootRef` and owns the non-passive touch listeners.
 */
export interface ToastGestureBindings {
	onpointerdown: (event: PointerEvent) => void;
	onpointermove: (event: PointerEvent) => void;
	onpointerup: (event: PointerEvent) => void;
	onpointercancel: (event: PointerEvent) => void;
	onlostpointercapture: (event: PointerEvent) => void;
	[key: symbol]: unknown;
}

function swipeProgressValue(travel: number, surfaceSize: number): number {
	return Math.min(Math.max(travel / surfaceSize, 0), 1);
}

function clearTransientStyles(root: HTMLElement): void {
	root.style.removeProperty('transition-duration');
	root.style.removeProperty('--_toast-swipe-y');
	root.style.removeProperty('--_toast-swipe-exit-y');
	root.style.removeProperty('--_toast-swipe-opacity');
	root.style.removeProperty('--_toast-swipe-scale');
}

export function useToastGesture(options: () => UseToastGestureOptions): ToastGestureBindings {
	// Upstream's two refs, and plain `let` for the same reason they are refs:
	// nothing renders from either.
	let root: HTMLElement | null = null;
	let gesture: GestureState | null = null;

	function resetGesture(shouldResume: boolean): void {
		const state = gesture;
		gesture = null;
		if (root) {
			clearTransientStyles(root);
		}
		if (shouldResume && state?.pausedTimer) {
			options().resumeTimer();
		}
	}

	function beginGesture(point: GesturePoint, target: EventTarget | null): boolean {
		const { direction, enabled, canPauseTimer, isTimerPaused, pauseTimer, shouldIgnoreTarget } =
			options();
		if (!root || !enabled || gesture != null || shouldIgnoreTarget(target, root)) {
			return false;
		}
		const pausedTimer = canPauseTimer && !isTimerPaused();
		if (pausedTimer) {
			pauseTimer();
		}
		const surfaceSize = Math.max(root.getBoundingClientRect().height, 1);
		gesture = {
			pointerId: point.pointerId,
			startX: point.clientX,
			startY: point.clientY,
			startTime: Date.now(),
			direction,
			intent: 'pending',
			pausedTimer,
			surfaceSize,
			dismissThreshold: Math.max(surfaceSize * SWIPE_DISMISS_RATIO, FLICK_MIN_DISTANCE)
		};
		return true;
	}

	function moveGesture(
		point: GesturePoint,
		preventDefault: () => void,
		releaseCapture?: () => void
	): void {
		const state = gesture;
		if (!state || !root || point.pointerId !== state.pointerId) {
			return;
		}
		const deltaX = point.clientX - state.startX;
		const deltaY = point.clientY - state.startY;
		const absX = Math.abs(deltaX);
		const absY = Math.abs(deltaY);
		if (state.intent === 'pending') {
			if (absX > DRAG_PROMOTION_SLOP && absX > absY) {
				releaseCapture?.();
				resetGesture(true);
				return;
			}
			if (absY <= DRAG_PROMOTION_SLOP || absY <= absX * VERTICAL_INTENT_RATIO) {
				return;
			}
			state.intent = deltaY * state.direction > 0 ? 'vertical' : 'opposite';
			if (state.intent === 'opposite') {
				releaseCapture?.();
				resetGesture(true);
				return;
			}
			root.style.setProperty('transition-duration', '0s');
		}
		preventDefault();
		const travel = Math.max(0, deltaY * state.direction);
		const progress = swipeProgressValue(travel, state.surfaceSize);
		root.style.setProperty('--_toast-swipe-y', `${travel * state.direction}px`);
		root.style.setProperty(
			'--_toast-swipe-opacity',
			(1 - progress * SWIPE_ACTIVE_FADE_MAX).toFixed(3)
		);
		root.style.setProperty(
			'--_toast-swipe-scale',
			(1 - progress * SWIPE_ACTIVE_SCALE_MAX).toFixed(3)
		);
	}

	function endGesture(point: GesturePoint): void {
		const state = gesture;
		if (!state || !root || point.pointerId !== state.pointerId) {
			return;
		}
		const travel = Math.max(0, (point.clientY - state.startY) * state.direction);
		const elapsed = Math.max(1, Date.now() - state.startTime);
		const isDismissed =
			state.intent === 'vertical' &&
			(travel >= state.dismissThreshold ||
				(travel >= FLICK_MIN_DISTANCE && travel / elapsed > FLICK_VELOCITY));

		gesture = null;
		root.style.removeProperty('transition-duration');
		if (isDismissed) {
			root.style.setProperty(
				'--_toast-swipe-exit-y',
				state.direction === 1 ? SWIPE_EXIT_DISTANCE : `calc(-1 * ${SWIPE_EXIT_DISTANCE})`
			);
			options().dismiss();
			return;
		}
		clearTransientStyles(root);
		if (state.pausedTimer) {
			options().resumeTimer();
		}
	}

	function handlePointerDown(event: PointerEvent): void {
		// `button` is always a number on a native `PointerEvent`; upstream's
		// `== null` branch tolerates an event that omits it, and widening the local
		// is what keeps that branch expressible under `strict`.
		const button: number | undefined = event.button;
		if (
			event.pointerType === 'pen' &&
			(button == null || button === 0) &&
			beginGesture(event, event.target)
		) {
			root?.setPointerCapture?.(event.pointerId);
		}
	}

	function handlePointerMove(event: PointerEvent): void {
		if (event.pointerType !== 'pen') {
			return;
		}
		moveGesture(
			event,
			() => event.preventDefault(),
			() => root?.releasePointerCapture?.(event.pointerId)
		);
	}

	function handlePointerUp(event: PointerEvent): void {
		if (event.pointerType !== 'pen') {
			return;
		}
		root?.releasePointerCapture?.(event.pointerId);
		endGesture(event);
	}

	function handlePointerCancel(event: PointerEvent): void {
		if (event.pointerType === 'pen' && gesture?.pointerId === event.pointerId) {
			resetGesture(true);
		}
	}

	const attachRoot = (node: HTMLElement): (() => void) => {
		root = node;
		// The only tracked read in this attachment — see the file header.
		const { enabled } = options();
		if (!enabled) {
			return () => {
				root = null;
			};
		}

		const point = (touch: Touch): GesturePoint => ({
			pointerId: touch.identifier,
			clientX: touch.clientX,
			clientY: touch.clientY
		});
		const changedTouch = (event: TouchEvent): Touch | undefined => {
			const pointerId = gesture?.pointerId;
			return pointerId == null
				? undefined
				: [...event.changedTouches].find((touch) => touch.identifier === pointerId);
		};
		const handleTouchStart = (event: TouchEvent): void => {
			const touch = event.touches.length === 1 ? event.changedTouches[0] : null;
			if (touch) {
				beginGesture(point(touch), event.target);
			}
		};
		const handleTouchMove = (event: TouchEvent): void => {
			const touch = changedTouch(event);
			if (touch) {
				moveGesture(point(touch), () => {
					if (event.cancelable) {
						event.preventDefault();
					}
				});
			}
		};
		const handleTouchEnd = (event: TouchEvent): void => {
			const touch = changedTouch(event);
			if (touch) {
				endGesture(point(touch));
			} else if (event.touches.length === 0) {
				resetGesture(true);
			}
		};
		const handleTouchCancel = (): void => resetGesture(true);

		node.addEventListener('touchstart', handleTouchStart, { passive: true });
		node.addEventListener('touchmove', handleTouchMove, { passive: false });
		node.addEventListener('touchend', handleTouchEnd, { passive: true });
		node.addEventListener('touchcancel', handleTouchCancel, { passive: true });
		return () => {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchmove', handleTouchMove);
			node.removeEventListener('touchend', handleTouchEnd);
			node.removeEventListener('touchcancel', handleTouchCancel);
			root = null;
		};
	};

	return {
		onpointerdown: handlePointerDown,
		onpointermove: handlePointerMove,
		onpointerup: handlePointerUp,
		onpointercancel: handlePointerCancel,
		onlostpointercapture: handlePointerCancel,
		[createAttachmentKey()]: attachRoot
	};
}
