/**
 * Touch long-press detection, ported from Astryx's `hooks/useLongPress.ts`.
 *
 * Fires `onLongPress` with the touch start point after `delayMs`. Cancels if
 * the finger moves past `moveCancelPx` (treated as a scroll/drag), lifts, or
 * the touch is cancelled; the pending timer is also cleared on unmount.
 *
 * Motivation is upstream's: iOS Safari never synthesises a `contextmenu` event
 * on long-press, so long-press is the only touch affordance for opening
 * cursor-positioned surfaces.
 *
 * Two translations. The handler names are Svelte's DOM names (`ontouchstart`
 * rather than `onTouchStart`) so the returned object spreads straight onto an
 * element, matching how `onclick` is spelled everywhere else in this port. And
 * the options come in as a **getter**, read at event time rather than at
 * handler-creation time — which is what upstream's `onLongPressRef` exists to
 * achieve, so the ref and the `useCallback` dependency lists both disappear.
 */

// Default long-press tuning.
const DEFAULT_DELAY_MS = 500;
const DEFAULT_MOVE_CANCEL_PX = 10;

export interface UseLongPressOptions {
	/** Fired with the touch start point once the press is held for `delayMs`. */
	onLongPress: (point: { x: number; y: number }) => void;
	/** When true, touch handlers are inert. */
	disabled?: boolean;
	/** Hold duration before the press fires, in ms. Defaults to 500. */
	delayMs?: number;
	/** Movement past this distance (px, either axis) cancels the press. Defaults to 10. */
	moveCancelPx?: number;
}

export interface UseLongPressHandlers {
	ontouchstart: (event: TouchEvent) => void;
	ontouchmove: (event: TouchEvent) => void;
	ontouchend: () => void;
	ontouchcancel: () => void;
}

/**
 * Returns touch handlers to spread onto an element.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const longPress = useLongPress(() => ({ onLongPress: openMenu, disabled }));
 * </script>
 *
 * <div {...longPress}>…</div>
 * ```
 */
export function useLongPress(options: () => UseLongPressOptions): UseLongPressHandlers {
	// Neither of these is rendered, so neither needs to be reactive — they are
	// upstream's two `useRef`s, which are exactly "mutable and not reactive".
	let timer: ReturnType<typeof setTimeout> | null = null;
	let start: { x: number; y: number } | null = null;

	function clear(): void {
		if (timer != null) {
			clearTimeout(timer);
			timer = null;
		}
		start = null;
	}

	function ontouchstart(event: TouchEvent): void {
		const { disabled = false, delayMs = DEFAULT_DELAY_MS } = options();
		if (disabled || event.touches.length !== 1) {
			return;
		}
		const touch = event.touches[0];
		// Clear any stale timer first, THEN record the start point — clearing
		// also nulls `start`, so order matters.
		clear();
		start = { x: touch.clientX, y: touch.clientY };
		timer = setTimeout(() => {
			if (start == null) {
				return;
			}
			options().onLongPress({ x: start.x, y: start.y });
		}, delayMs);
	}

	function ontouchmove(event: TouchEvent): void {
		if (start == null || event.touches.length !== 1) {
			return;
		}
		const { moveCancelPx = DEFAULT_MOVE_CANCEL_PX } = options();
		const touch = event.touches[0];
		if (
			Math.abs(touch.clientX - start.x) > moveCancelPx ||
			Math.abs(touch.clientY - start.y) > moveCancelPx
		) {
			// Treat as a scroll/drag, not a long-press.
			clear();
		}
	}

	// Cancel any pending long-press timer on unmount.
	$effect(() => clear);

	return {
		ontouchstart,
		ontouchmove,
		ontouchend: clear,
		ontouchcancel: clear
	};
}
