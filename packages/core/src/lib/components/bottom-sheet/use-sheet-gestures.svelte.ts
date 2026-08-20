import { untrack } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
import {
	computeDetentOffsets,
	peekOffsetFor,
	resolveSettleOffset,
	scrimOpacityForOffset
} from './snap-offsets.js';

/**
 * Ported from Astryx's `BottomSheet/useSheetGestures.ts`.
 *
 * Drag + snap machinery for the bottom sheet. Tracks a pointer drag down the
 * block axis, translates the sliding surface live, and on release either settles
 * to the nearest snap detent (a slow drag) or dismisses (a fast flick down). A
 * fast flick up expands to the tallest detent. This is the core behaviour split
 * the sheet needs: DRAG places, SWIPE closes.
 *
 * A settled detent is split across two properties: `settledLayoutOffset` is the
 * part the scrolling area gives up as layout height, and the remainder is a
 * transform. Gestures and snaps only ever move the transform, so they stay on
 * the compositor; layout height changes at rest, in one transition-free render
 * whose visible geometry is identical. A peek detent — a stop that is only a
 * sliver of the sheet — keeps the full height and slides below the viewport
 * instead of reflowing to that sliver.
 *
 * Those are pixels, and the stops behind them are relative to the viewport, so a
 * sheet at rest re-resolves its detent on `resize` / `orientationchange`, and
 * whenever the host swaps the snap points, and re-anchors to the new geometry
 * without animating. The detent it returns to is tracked by index: the pixels
 * stop meaning the same thing when the viewport changes, the stop the user chose
 * does not.
 *
 * On touch, the scrolling body hands the gesture to the sheet at a scroll edge.
 * Two shapes, because the browser only offers one of them a choice: a finger
 * that lands on an edge and pulls away from it promotes by cancelling the first,
 * still-cancelable touchmove; a finger that scrolls INTO the end of the content
 * mid-gesture cannot, since the browser has committed the gesture to scrolling
 * and every remaining event is non-cancelable. The second shape needs no
 * cancelling — the scroller is clamped at its end, so there is nothing left to
 * scroll — and instead anchors at the point where the content ran out and drives
 * the sheet from the travel beyond it.
 *
 * Kept private to `BottomSheet`: a dismiss edge + detents on a bottom-anchored
 * surface are inherently sheet concepts. Not a general primitive, and
 * deliberately not exported from the package.
 *
 * SSR-safe: no window/document access at module scope; all measurement happens
 * inside handlers. Respects `prefers-reduced-motion` by skipping the settle
 * transition.
 *
 * ## Translation
 *
 * Options are **per-field getters**, for the reason `use-mobile-keyboard`
 * records: upstream reads most of them through refs so a change does not
 * re-subscribe anything, and one composite getter would subscribe the caller to
 * every field at once.
 *
 * Upstream's `useRef` boxes split three ways here, and the split is the whole
 * translation:
 *
 * - Boxes that hold **live gesture bookkeeping** nothing renders from
 *   (`dragState`, `armedBody`, `touchDrag`, the DOM nodes) are plain `let`s. A
 *   rune would schedule an update on every `pointermove`. Upstream's
 *   `observerRef` has no counterpart at all: it exists so a callback ref can
 *   disconnect the *previous* observer by hand, and an attachment's teardown is
 *   already scoped to the node it ran for.
 * - Boxes that exist purely to read a **current value inside a callback**
 *   (`onDismissRef`, `canDismissRef`, `onSnapRef`, `onScrimOpacityRef`,
 *   `snapHeightsRef`, `offscreenBlockEndInsetRef`, `isOpenRef`) have no
 *   counterpart: a callback runs outside any effect body, so calling the getter
 *   there is already both current and untracked.
 * - Boxes that **mirror a piece of state** (`settledLayoutOffsetRef`,
 *   `scrollPreservationInsetRef`, `settlingLayoutOffsetRef`, `sheetHeightRef`) are
 *   kept as plain `let`s beside the `$state`, rather than
 *   dropped in favour of reading the state directly. Dropping them looks
 *   tempting — a `$state` read is always current — but `reanchorToSettledDetent`
 *   both reads and writes this geometry and runs from an effect, so reading the
 *   state there would make that effect depend on what it writes. React's refs
 *   prevented that cycle structurally; these `let`s are what preserve it.
 */

/**
 * The stops a sheet of a given height rests at: offsets from fully-open in px,
 * ascending, plus which of them (if any) is the peek.
 */
interface SheetDetents {
	offsets: number[];
	peekOffset: number | null;
}

// A flick (fast throw) dismisses (down) or expands (up) regardless of where it
// ends. Requires both a speed and a distance floor so a small nudge doesn't
// trigger it.
const FLICK_VELOCITY = 1.2; // px/ms
const FLICK_MIN_DISTANCE = 48; // px traveled during the gesture
// On a slow drag below the shortest detent, dismiss once dragged past it by more
// than this fraction of that detent's height; otherwise snap back to it.
const DISMISS_OVERSHOOT_RATIO = 0.4;
// Within this many px of a detent, the live drag is magnetically eased toward it
// so it "clicks" into place instead of hovering just off the mark.
const MAGNET_RANGE = 40;
// Rubber-band factor for dragging up past fully-open, capped at OVERSCROLL_MAX
// (the sheet reserves that much bottom padding for the lift to reveal).
const OVERSCROLL_RESISTANCE = 0.35;
// SYNC: must match OVERSCROLL_PADDING in `bottom-sheet-panel.stylex.ts` (the
// reserved bottom padding the lift reveals). Kept as a local const rather than a
// shared import so it can be used inside `stylex.create` there.
const OVERSCROLL_MAX = 48;
// Travel past the point where a scrolling gesture ran out of content before it
// hands the sheet the rest of the pull. Small enough to feel continuous with the
// scroll, large enough that a swipe merely coming to rest on the last pixel
// doesn't start a drag on jitter.
const CONTENT_END_HANDOFF_SLOP = 4;

/**
 * The pointer-shaped object the touch path drives the sheet with.
 *
 * The touch path reuses the pointer machinery by handing it an object built from
 * a `Touch`. On iOS Safari that object is indistinguishable from the real thing:
 * WebKit raises PointerEvents for a finger under the SAME numeric id it puts in
 * `Touch.identifier`, so such a drag is keyed to a live pointer and the handlers
 * that guard a mouse drag fire against it. The flag is how they tell the two
 * apart.
 */
interface SheetPointer {
	syntheticTouch?: true;
	pointerId: number;
	clientY: number;
	timeStamp: number;
	button?: number;
	isPrimary?: boolean;
	currentTarget: HTMLElement;
	preventDefault?: () => void;
	setPointerCapture?: (id: number) => void;
	releasePointerCapture?: (id: number) => void;
	hasPointerCapture?: (id: number) => boolean;
}

function isSyntheticTouch(event: SheetPointer): boolean {
	return event.syntheticTouch === true;
}

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) {
		return false;
	}
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Short haptic tick on detent settle where supported. iOS Safari doesn't expose
// navigator.vibrate, so this is a no-op there; skipped under reduced-motion.
function hapticTick(): void {
	if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
		return;
	}
	if (prefersReducedMotion()) {
		return;
	}
	navigator.vibrate(8);
}

// Pull a value toward the nearest of `targets` when within MAGNET_RANGE, easing
// the last stretch so the surface settles crisply onto a detent while dragging.
function magnetize(value: number, targets: number[]): number {
	let nearestTarget = targets[0];
	let nearestDist = Math.abs(value - nearestTarget);
	for (const t of targets) {
		const d = Math.abs(value - t);
		if (d < nearestDist) {
			nearestDist = d;
			nearestTarget = t;
		}
	}
	if (nearestDist >= MAGNET_RANGE) {
		return value;
	}
	// Ease-in over the range: pull grows as you approach (t^2), so the click feels
	// magnetic near the detent but doesn't fight a deliberate drag-through.
	const t = nearestDist / MAGNET_RANGE;
	const pull = 1 - t * t;
	return value + (nearestTarget - value) * pull;
}

function preservationInsetForOffset(
	baseOffset: number,
	targetOffset: number,
	naturalEndGap: number
): number {
	return Math.max(0, baseOffset - targetOffset - naturalEndGap);
}

function renderedBlockEndPadding(element: HTMLElement): number {
	const value = Number.parseFloat(getComputedStyle(element).paddingBlockEnd);
	return Number.isFinite(value) ? value : 0;
}

// How much further the body could scroll on its own, ignoring the padding the
// hook adds to preserve scroll position across a height change.
function naturalEndGapFor(body: HTMLElement | null): number {
	if (!body) {
		return 0;
	}
	const renderedInset = renderedBlockEndPadding(body);
	const naturalMaxScrollTop = Math.max(0, body.scrollHeight - body.clientHeight - renderedInset);
	return naturalMaxScrollTop - body.scrollTop;
}

function visibleHeightForOffset(
	sheetHeight: number,
	offset: number,
	offscreenBlockEndInset: number
): number {
	return Math.max(0, sheetHeight - offscreenBlockEndInset - offset);
}

export interface UseSheetGesturesOptions {
	/** Whether the owning sheet is open. Drag state resets when it closes. */
	isOpen: () => boolean;
	/**
	 * Whether a downward swipe may dismiss the sheet. When false, a gesture past
	 * the dismiss threshold settles at the shortest detent instead.
	 * @default true
	 */
	canDismiss?: () => boolean;
	/**
	 * Portion of the measured sheet border box reserved below the viewport.
	 * Excluded from detent heights so a 50vh snap has 50vh of visible sheet.
	 * @default 0
	 */
	offscreenBlockEndInset?: () => number;
	/** Called on a swipe-to-close (fast downward flick, or drag past the floor). */
	onDismiss: () => void;
	/**
	 * Resolver for candidate visible detent heights in px below the fully open
	 * visible height. Called at the start of each drag, and again whenever the
	 * viewport changes while the sheet rests, so the detents track the window
	 * (rotation, a resized desktop window, collapsing browser chrome). The fully
	 * open height is always the tallest detent. Omit for a single-height sheet (a
	 * drag then only dismisses or springs back).
	 *
	 * Keep the identity stable: a new function is read as new stops, and
	 * re-anchors a resting sheet to them.
	 */
	snapHeights?: () => (() => number[]) | undefined;
	/** Notified when the settled visible detent height (px) changes. */
	onSnap?: (heightPx: number) => void;
	/**
	 * Called with the scrim opacity the sheet should show (1 = fully visible,
	 * 0 = hidden) as the drag moves and on settle. Full while the sheet is at or
	 * above its mid detent, fading to 0 as it collapses onto the shortest "peek"
	 * detent — thinning to a faint glance state without fully clearing — and on
	 * the dismiss overshoot. Lets the owner mirror it onto the scrim.
	 */
	onScrimOpacity?: (opacity: number) => void;
}

/** Spread on the sliding surface. */
export interface SheetContentProps {
	style: string;
}

/** Spread on the grab-handle element. */
export interface SheetHandleProps {
	style: string;
	oncontextmenu: (event: MouseEvent) => void;
	onlostpointercapture: (event: PointerEvent) => void;
	onpointerdown: (event: PointerEvent) => void;
	onpointermove: (event: PointerEvent) => void;
	onpointerup: (event: PointerEvent) => void;
	onpointercancel: (event: PointerEvent) => void;
}

/** Spread on the scrollable body. Carries the element attachment. */
export interface SheetBodyProps {
	oncontextmenu: (event: MouseEvent) => void;
	onlostpointercapture: (event: PointerEvent) => void;
	onpointerdown: (event: PointerEvent) => void;
	onpointermove: (event: PointerEvent) => void;
	onpointerup: (event: PointerEvent) => void;
	onpointercancel: (event: PointerEvent) => void;
	onscroll: (event: Event) => void;
	[key: symbol]: unknown;
}

export interface UseSheetGesturesResult {
	/**
	 * Attachment for the sheet surface. The hook observes it (ResizeObserver) to
	 * keep the fully-open height current, so detents stay correct across rotation
	 * / viewport changes without re-measuring mid-drag.
	 *
	 * Upstream's `sheetRef` callback ref; an attachment is this port's counterpart
	 * and, unlike a callback ref, cleans itself up.
	 */
	readonly sheetAttachment: Record<symbol, unknown>;
	/** Spread on the sliding surface: live translate + touch-action guard. */
	readonly contentProps: SheetContentProps;
	/** Spread on the grab-handle element: pointer drag handlers. */
	readonly handleProps: SheetHandleProps;
	/**
	 * Spread on the scrollable body. An overscroll-at-top pull-down starts a sheet
	 * drag (a larger, more forgiving target when the content isn't itself
	 * scrolling); normal scrolling passes through untouched.
	 */
	readonly bodyProps: SheetBodyProps;
	/**
	 * The body element `bodyProps`' attachment is bound to. The hook tracks the
	 * node anyway (it owns the non-passive touch listeners on it), so a host that
	 * also needs the element reads it here.
	 */
	readonly bodyElement: HTMLElement | null;
	/** Current live drag translate in px (0 = fully expanded, larger = collapsed). */
	readonly dragOffset: number;
	/** Translate of the resting detent in px (0 = tallest detent). */
	readonly settledOffset: number;
	/** Whether a drag is currently in progress. */
	readonly isDragging: boolean;
	/** Measured height of the fully expanded sheet. */
	readonly sheetHeight: number;
	/** End padding that preserves the scroll position across height changes. */
	readonly scrollPreservationInset: number;
	/** Layout offset retained until the transform-only snap finishes. */
	readonly settlingLayoutOffset: number | null;
	/**
	 * Reconciles the final layout once the transform-only snap finishes. The panel
	 * decides WHEN a snap is over (it owns the element and its computed
	 * transition), so completion cannot be driven from a `transitionend` listener
	 * alone: with transitions disabled — inline `transition: none`, a `0s` duration
	 * token, a test harness turning animation off — no event ever arrives and the
	 * scroll area would keep its full height forever.
	 */
	completeScrollAreaSettle: () => void;
	/**
	 * How much of `settledOffset` is expressed as layout height rather than as a
	 * transform. Equals `settledOffset` at the resizing detents; 0 at fully open
	 * and at the peek, which keep the sheet's full height (see `peekOffsetFor`).
	 */
	readonly settledLayoutOffset: number;
}

/**
 * Drag + snap machinery for the bottom sheet. Returns props to spread on the
 * grab handle and the sliding surface, plus live drag state. A slow drag settles
 * to the nearest detent; a fast downward flick dismisses; a fast upward flick
 * expands to the tallest detent.
 *
 * @example
 * ```ts
 * const gestures = useSheetGestures({
 * 	isOpen: () => isOpen,
 * 	onDismiss: () => onOpenChange(false),
 * 	snapHeights: () => () => [240, 0.5 * (window.visualViewport?.height ?? 0)]
 * });
 * ```
 */
export function useSheetGestures(options: UseSheetGesturesOptions): UseSheetGesturesResult {
	let dragOffset = $state(0);
	let settledOffset = $state(0);
	let isDragging = $state(false);
	let sheetHeight = $state(0);
	let scrollPreservationInset = $state(0);
	// How much of the settled travel is expressed as layout height. Equal to
	// settledOffset for the resizing detents, and 0 at fully open and at the peek
	// (see peekOffsetFor), which keep the full height and use a transform.
	let settledLayoutOffset = $state(0);
	let settlingLayoutOffset = $state<number | null>(null);
	let isScrollAreaReconciling = $state(false);
	let bodyElement = $state<HTMLElement | null>(null);

	// --- mirrors, deliberately plain `let` (see the file header) --------------
	let settledLayoutOffsetBox = 0;
	let scrollPreservationInsetBox = 0;
	let settlingLayoutOffsetBox: number | null = null;
	let pendingScrollPreservationInset: number | null = null;
	let sheetHeightBox = 0;
	// WHICH detent the sheet rests on, as an index into the resolved list. The
	// offsets themselves are pixels derived from the viewport, so they stop
	// meaning the same thing the moment the viewport changes; the index survives
	// that and lets a resize re-resolve the same stop against the new geometry.
	let settledDetentIndex = 0;

	// --- live gesture bookkeeping ---------------------------------------------
	let dragState: {
		// Whether the touch path drives this drag. Such a drag holds no pointer
		// capture and takes its events from `touchmove`, so every real-pointer
		// handler has to leave it alone.
		syntheticTouch: boolean;
		pointerId: number;
		startCoord: number;
		lastCoord: number;
		lastTime: number;
		velocity: number;
		height: number;
		baseOffset: number;
		baseLayoutOffset: number;
		renderedOffset: number;
		layoutOffset: number;
		naturalEndGap: number;
	} | null = null;
	let sheetEl: HTMLElement | null = null;
	let bodyNode: HTMLElement | null = null;
	let armedBody: { pointerId: number; startCoord: number; scroller: HTMLElement } | null = null;
	let touchDrag: {
		id: number;
		startY: number;
		top: boolean;
		bottom: boolean;
		// Where the finger was when the scroller ran out of content, or null while
		// it can still scroll. A mid-gesture handoff drives the sheet from travel
		// BEYOND this point, so the part of the swipe that legitimately scrolled
		// doesn't move the sheet as well.
		contentEndY: number | null;
		// Whether the drag in flight was promoted from `contentEndY` rather than
		// armed at `touchstart`. That drag never cancelled the native scroll, so it
		// has to yield again if the finger comes back down.
		promotedAtContentEnd: boolean;
	} | null = null;

	/** Current value, read from callbacks — upstream's ref-refresh, obviated. */
	const offscreenInset = () => Math.max(0, options.offscreenBlockEndInset?.() ?? 0);
	const canDismissNow = () => options.canDismiss?.() ?? true;

	/**
	 * The offset currently rendered. Upstream keeps this in `activeOffsetRef`,
	 * assigned during render so every callback reads a value that is already
	 * current; syncing a box from an `$effect` here would instead lag it by a
	 * microtask, and `recordSheetHeight` would accept a measurement it should have
	 * rejected. Reading the state on demand is exact — and `untrack`ed, because
	 * `reanchorToSettledDetent` reads this from inside an effect and must not
	 * re-run on every drag frame.
	 */
	const activeOffsetNow = () => untrack(() => (isDragging ? dragOffset : settledOffset));

	function recordSettledLayoutOffset(offset: number): void {
		const normalizedOffset = Math.max(0, offset);
		settledLayoutOffsetBox = normalizedOffset;
		settledLayoutOffset = normalizedOffset;
	}

	function updateScrollPreservationInset(nextInset: number): void {
		const normalizedInset = Math.max(0, nextInset);
		const hasChanged = Math.abs(normalizedInset - scrollPreservationInsetBox) > 0.5;
		if (!hasChanged) {
			return;
		}
		scrollPreservationInsetBox = normalizedInset;
		scrollPreservationInset = normalizedInset;
	}

	function completeScrollAreaSettle(): void {
		// Resetting the transform at the same time as the final height swap must not
		// start a second transition. The layouts have identical visible geometry, so
		// reconcile them with transitions disabled for one frame.
		isScrollAreaReconciling = true;
		settlingLayoutOffsetBox = null;
		settlingLayoutOffset = null;
		const pendingInset = pendingScrollPreservationInset;
		pendingScrollPreservationInset = null;
		if (pendingInset != null) {
			updateScrollPreservationInset(pendingInset);
		}
	}

	function prepareScrollAreaSettle(
		baseLayoutOffset: number,
		targetOffset: number,
		targetLayoutOffset: number,
		renderedOffset: number,
		layoutOffset: number,
		naturalEndGap: number,
		shouldAnimate: boolean
	): void {
		const targetInset = preservationInsetForOffset(
			baseLayoutOffset,
			targetLayoutOffset,
			naturalEndGap
		);
		if (shouldAnimate && Math.abs(renderedOffset - targetOffset) > 0.5 && !prefersReducedMotion()) {
			pendingScrollPreservationInset = targetInset;
			settlingLayoutOffsetBox = layoutOffset;
			settlingLayoutOffset = layoutOffset;
			return;
		}
		pendingScrollPreservationInset = null;
		settlingLayoutOffsetBox = null;
		settlingLayoutOffset = null;
		// Released on the detent, so there is no travel left to animate — but the
		// layout split may still differ from the one the drag rendered with
		// (magnetize() lands a slow drag exactly on a detent). Swapping height for
		// transform is only invisible while transitions are off: with them live, the
		// composited transform would animate the whole swap while the layout height
		// jumped, throwing the sheet the wrong way. Reconcile in one transition-free
		// frame instead.
		isScrollAreaReconciling = Math.abs(layoutOffset - targetLayoutOffset) > 0.5;
		updateScrollPreservationInset(targetInset);
	}

	// Force the transition-free transform reset to resolve before transitions are
	// restored. Otherwise both DOM updates can be coalesced and the reset becomes
	// an unintended fly-in animation from the bottom.
	//
	// `$effect`, not `$effect.pre`: the whole point is to compute style for the
	// DOM that *now* carries `transition: none` and the new transform, so that
	// pair becomes the "before" the next recalculation compares against. A pre
	// effect is created inside the hook during the panel's `<script>`, so it runs
	// before the template writes the `style` attribute and would reflow the render
	// being replaced — leaving the pair that actually needs committing never
	// computed alone, and every snap settle animating the swap that must be
	// instantaneous. Upstream's `useLayoutEffect` runs after the commit, which is
	// where a plain `$effect` runs.
	$effect(() => {
		if (!isScrollAreaReconciling) {
			return;
		}
		void sheetEl?.offsetHeight;
		const frame = requestAnimationFrame(() => {
			isScrollAreaReconciling = false;
		});
		return () => cancelAnimationFrame(frame);
	});

	function recordSheetHeight(renderedHeight: number): void {
		if (renderedHeight <= 0) {
			return;
		}
		// A resized or closing panel's observer reports intermediate heights
		// throughout its animation. Keep the last fully-expanded measurement instead
		// of feeding those transient values back into the rendered height.
		//
		// `untrack`, because this runs synchronously from the sheet attachment as
		// well as from the observer. Upstream's `sheetRef` is a `useCallback` and
		// reads `isOpenRef.current`, which cannot subscribe to anything; a tracked
		// read here makes the attachment depend on `isOpen`, so Svelte tears it
		// down and rebuilds the `ResizeObserver` on every open and close. No
		// current path breaks — every one of them is a no-op — but this function is
		// also the observer callback, so any reactive read added to it later would
		// become an attachment dependency silently.
		if (!untrack(options.isOpen) || activeOffsetNow() > 0) {
			return;
		}
		sheetHeightBox = renderedHeight;
		if (sheetHeight !== renderedHeight) {
			sheetHeight = renderedHeight;
		}
	}

	const sheetAttachment = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			sheetEl = node;
			recordSheetHeight(node.getBoundingClientRect().height);
			if (typeof ResizeObserver === 'undefined') {
				return () => {
					sheetEl = null;
				};
			}
			const ro = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					// Keep this measurement in the same border-box coordinate space as
					// getBoundingClientRect(). contentRect excludes the sheet's reserved
					// bottom padding and would make the first resized drag jump shorter.
					const borderBoxHeight = entry.borderBoxSize?.[0]?.blockSize;
					recordSheetHeight(borderBoxHeight ?? entry.target.getBoundingClientRect().height);
				}
			});
			ro.observe(node);
			// No handle kept: upstream needs one because a callback ref has to
			// disconnect the *previous* observer by hand. An attachment's teardown is
			// scoped to the node it ran for, so this closure is the whole lifecycle.
			return () => {
				ro.disconnect();
				sheetEl = null;
			};
		}
	};

	// Reset to the tallest detent each time the sheet re-opens.
	//
	// Guarded on the **transition** into open, not on `isOpen` being true. React's
	// dependency array compares values, so upstream's effect does not re-run when
	// a render leaves `isOpen` unchanged; Svelte tracks signals, so any
	// invalidation of the prop re-runs this — and an unrelated re-render would
	// then zero a sheet the user had settled at a detent. `wasOpen` is what
	// restores the value comparison.
	let wasOpen = false;
	$effect(() => {
		const open = options.isOpen();
		const isReopening = open && !wasOpen;
		wasOpen = open;
		if (isReopening) {
			dragOffset = 0;
			settledOffset = 0;
			isDragging = false;
			isScrollAreaReconciling = false;
			recordSettledLayoutOffset(0);
			settledDetentIndex = 0;
			scrollPreservationInsetBox = 0;
			settlingLayoutOffsetBox = null;
			pendingScrollPreservationInset = null;
			scrollPreservationInset = 0;
			settlingLayoutOffset = null;
		}
	});

	// The fully-open height for detent math. Prefer the ResizeObserver-locked
	// value; fall back to a live measure of the tracked sheet element if the
	// observer hasn't reported yet.
	function measureHeight(): number {
		if (sheetHeightBox > 0) {
			return sheetHeightBox;
		}
		return sheetEl?.getBoundingClientRect().height ?? 0;
	}

	// Detent translate offsets (px) from the tallest detent, ascending, plus the
	// peek among them. Exclude the border-box portion reserved below the viewport
	// before comparing the candidate visible heights; otherwise every snap point
	// lands that many px too low. Snap heights are resolved lazily so they track
	// the viewport.
	function resolveDetents(height: number): SheetDetents {
		const visibleSheetHeight = visibleHeightForOffset(height, 0, offscreenInset());
		const offsets = computeDetentOffsets(visibleSheetHeight, options.snapHeights?.()?.() ?? []);
		return { offsets, peekOffset: peekOffsetFor(offsets, visibleSheetHeight) };
	}

	// The height the sheet WOULD have fully open, right now. While it rests at a
	// resizing detent the element carries a pixel height computed for whatever the
	// viewport was then, so measuring it directly just reads that stale number
	// back. Drop the inline height for the measurement and put it back in the same
	// synchronous block — the browser cannot paint in between, so this is
	// invisible — and the natural CSS budget is what gets measured.
	function measureFullyOpenHeight(): number {
		const element = sheetEl;
		if (!element) {
			return sheetHeightBox;
		}
		const inlineHeight = element.style.height;
		if (inlineHeight === '') {
			return element.getBoundingClientRect().height;
		}
		element.style.height = '';
		const height = element.getBoundingClientRect().height;
		element.style.height = inlineHeight;
		return height;
	}

	// Detents are viewport fractions, but a settled sheet holds them as pixels: an
	// offset to translate by, and a layout height to render. Both are read once,
	// at gesture time. Without this, a viewport change leaves the sheet frozen at
	// the old pixel geometry — a "half height" sheet showing 75% of a shorter
	// window, a peek detent whose slide-down is taller than the whole window (so
	// the sheet leaves the screen while its dialog stays modal), and a stale
	// fully-open height for the next drag to overshoot past.
	//
	// Re-resolve the SAME detent — by index, the one thing that survives the units
	// changing — against the new geometry, and re-anchor without animating: the
	// geometry moved, not the user's finger, so there is no gesture to continue
	// and nothing to ease.
	function reanchorToSettledDetent(): void {
		// A closed sheet re-anchors on its way back open; a live drag re-measures on
		// its own, and a settle in flight owns the layout until it lands.
		if (!options.isOpen() || dragState != null || settlingLayoutOffsetBox != null) {
			return;
		}
		const height = measureFullyOpenHeight();
		if (height <= 0) {
			return;
		}
		const { offsets, peekOffset } = resolveDetents(height);
		const index = Math.min(settledDetentIndex, offsets.length - 1);
		const target = offsets[index];
		const targetLayoutOffset = target === peekOffset ? 0 : target;
		const baseLayoutOffset = settledLayoutOffsetBox;
		if (
			height === sheetHeightBox &&
			Math.abs(target - activeOffsetNow()) <= 0.5 &&
			Math.abs(targetLayoutOffset - baseLayoutOffset) <= 0.5
		) {
			return;
		}

		sheetHeightBox = height;
		sheetHeight = height;
		settledDetentIndex = index;
		prepareScrollAreaSettle(
			baseLayoutOffset,
			target,
			targetLayoutOffset,
			target,
			baseLayoutOffset,
			naturalEndGapFor(bodyNode),
			false
		);
		recordSettledLayoutOffset(targetLayoutOffset);
		settledOffset = target;
		options.onSnap?.(visibleHeightForOffset(height, target, offscreenInset()));
		const maxOffset = offsets[offsets.length - 1];
		const shortestDetentHeight = visibleHeightForOffset(height, maxOffset, offscreenInset());
		options.onScrimOpacity?.(
			scrimOpacityForOffset(
				target,
				offsets,
				maxOffset + shortestDetentHeight * DISMISS_OVERSHOOT_RATIO,
				peekOffset
			)
		);
	}

	$effect(() => {
		if (!options.isOpen() || typeof window === 'undefined') {
			return;
		}
		window.addEventListener('resize', reanchorToSettledDetent);
		window.addEventListener('orientationchange', reanchorToSettledDetent);
		return () => {
			window.removeEventListener('resize', reanchorToSettledDetent);
			window.removeEventListener('orientationchange', reanchorToSettledDetent);
		};
	});

	// The other input to the same geometry: the snap points themselves. A host
	// that swaps them while the sheet rests has moved the stops out from under it,
	// exactly as a rotation does, so re-anchor the same way. Skipped on the first
	// run — the sheet is already anchored to the detents it opened with.
	//
	// `$effect`, not `$effect.pre`, because `reanchorToSettledDetent` *measures*:
	// it strips the inline height, reads `getBoundingClientRect()`, and reads the
	// body's scroll metrics. A pre effect reads all of that before the DOM update,
	// so a host changing `snapPoints` in the same update as anything that alters
	// the sheet's box — `height`, or the children of a `hug` sheet — would
	// re-anchor against geometry that no longer exists, and the sheet would rest
	// visibly off its detent until the next resize.
	let hasAnchoredSnapHeights = false;
	$effect(() => {
		// Tracked deliberately: this effect exists to notice the resolver changing.
		options.snapHeights?.();
		if (!hasAnchoredSnapHeights) {
			hasAnchoredSnapHeights = true;
			return;
		}
		reanchorToSettledDetent();
	});

	function cancelDrag(target?: HTMLElement): void {
		const state = dragState;
		if (state == null) {
			return;
		}

		// Clear first: releasePointerCapture() may synchronously dispatch
		// lostpointercapture, which must observe that this drag is already done.
		dragState = null;
		if (target?.hasPointerCapture?.(state.pointerId)) {
			target.releasePointerCapture(state.pointerId);
		}
		dragOffset = state.baseOffset;
		isDragging = false;
		prepareScrollAreaSettle(
			state.baseLayoutOffset,
			state.baseOffset,
			state.baseLayoutOffset,
			state.renderedOffset,
			state.layoutOffset,
			state.naturalEndGap,
			true
		);

		// An interrupted drag returns to its previous resting detent. Restore the
		// matching scrim opacity as well so the modal shell cannot remain dimmed
		// with its sheet translated out of view.
		const { offsets, peekOffset } = resolveDetents(state.height);
		const maxOffset = offsets[offsets.length - 1];
		const shortestDetentHeight = visibleHeightForOffset(state.height, maxOffset, offscreenInset());
		const dismissOffset = maxOffset + shortestDetentHeight * DISMISS_OVERSHOOT_RATIO;
		options.onScrimOpacity?.(
			scrimOpacityForOffset(state.baseOffset, offsets, dismissOffset, peekOffset)
		);
	}

	$effect(() => {
		const handleWindowBlur = () => cancelDrag();
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				cancelDrag();
			}
		};
		window.addEventListener('blur', handleWindowBlur);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			window.removeEventListener('blur', handleWindowBlur);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	function settleFromDrag(
		offset: number,
		velocity: number,
		height: number,
		dir: number,
		travel: number,
		baseOffset: number,
		baseLayoutOffset: number,
		renderedOffset: number,
		layoutOffset: number,
		naturalEndGap: number
	): void {
		const { offsets, peekOffset } = resolveDetents(height);
		const maxOffset = offsets[offsets.length - 1];
		const shortestDetentHeight = visibleHeightForOffset(height, maxOffset, offscreenInset());
		const speed = Math.abs(velocity);
		const isFlick = speed > FLICK_VELOCITY && travel > FLICK_MIN_DISTANCE;
		const settleAt = (target: number) => {
			// A peek keeps the full layout height and slides below the viewport; every
			// taller detent resizes the scrolling area to what it shows.
			const targetLayoutOffset = target === peekOffset ? 0 : target;
			prepareScrollAreaSettle(
				baseLayoutOffset,
				target,
				targetLayoutOffset,
				renderedOffset,
				layoutOffset,
				naturalEndGap,
				true
			);
			recordSettledLayoutOffset(targetLayoutOffset);
			settledDetentIndex = Math.max(0, offsets.indexOf(target));
			settledOffset = target;
			options.onSnap?.(visibleHeightForOffset(height, target, offscreenInset()));
			const dismissOffset = maxOffset + shortestDetentHeight * DISMISS_OVERSHOOT_RATIO;
			options.onScrimOpacity?.(scrimOpacityForOffset(target, offsets, dismissOffset, peekOffset));
			if (target !== baseOffset) {
				hapticTick();
			}
		};

		if (dir > 0 && isFlick) {
			if (canDismissNow()) {
				prepareScrollAreaSettle(
					baseLayoutOffset,
					baseOffset,
					baseLayoutOffset,
					baseLayoutOffset,
					baseLayoutOffset,
					naturalEndGap,
					false
				);
				options.onDismiss();
			} else {
				settleAt(maxOffset);
			}
			return;
		}
		// Fast upward flick = expand to the tallest detent (the sheet's full
		// provided height).
		if (dir < 0 && isFlick) {
			prepareScrollAreaSettle(
				baseLayoutOffset,
				0,
				0,
				renderedOffset,
				layoutOffset,
				naturalEndGap,
				true
			);
			recordSettledLayoutOffset(0);
			settledDetentIndex = 0;
			dragOffset = 0;
			settledOffset = 0;
			options.onSnap?.(visibleHeightForOffset(height, 0, offscreenInset()));
			options.onScrimOpacity?.(1);
			hapticTick();
			return;
		}
		if (offset > maxOffset + shortestDetentHeight * DISMISS_OVERSHOOT_RATIO) {
			if (canDismissNow()) {
				prepareScrollAreaSettle(
					baseLayoutOffset,
					baseOffset,
					baseLayoutOffset,
					baseLayoutOffset,
					baseLayoutOffset,
					naturalEndGap,
					false
				);
				options.onDismiss();
			} else {
				settleAt(maxOffset);
			}
			return;
		}
		// Settle to the nearest detent in the drag direction (never back past the
		// starting detent), de-duped and direction-clamped by the util.
		const target = resolveSettleOffset(offset, offsets, dir, baseOffset);
		settleAt(target);
	}

	function beginDrag(event: SheetPointer, height: number, startCoord?: number): void {
		const target = event.currentTarget;
		const syntheticTouch = isSyntheticTouch(event);
		// Never capture for a touch drag. The id came from `Touch.identifier`, which
		// on iOS names a live pointer: the capture succeeds, WebKit takes it straight
		// back for its own gesture handling, and the `lostpointercapture` a
		// millisecond later cancels the drag that just started. Touch drags need no
		// capture — the listener is on the scroller itself.
		if (!syntheticTouch) {
			target.setPointerCapture?.(event.pointerId);
		}
		// `startCoord` lets a body-overscroll drag anchor at the original
		// pointer-down position (not the promotion point), so the first frame's delta
		// reflects the full pull distance.
		const start = startCoord ?? event.clientY;
		const naturalEndGap = naturalEndGapFor(bodyNode);
		const baseLayoutOffset = settledLayoutOffsetBox;
		dragState = {
			syntheticTouch,
			pointerId: event.pointerId,
			startCoord: start,
			lastCoord: event.clientY,
			lastTime: event.timeStamp,
			velocity: 0,
			height,
			baseOffset: settledOffset,
			baseLayoutOffset,
			renderedOffset: settledOffset,
			layoutOffset: baseLayoutOffset,
			naturalEndGap
		};
		updateScrollPreservationInset(
			preservationInsetForOffset(baseLayoutOffset, baseLayoutOffset, naturalEndGap)
		);
		// Seed dragOffset at the resting detent so flipping isDragging doesn't jump
		// the sheet to fully-open for one frame.
		dragOffset = settledOffset;
		isDragging = true;
	}

	function handlePointerDown(event: PointerEvent): void {
		if (event.button !== 0 || !event.isPrimary) {
			return;
		}
		// The handle has no native focus action. Prevent pointer-down from moving
		// focus off a form control on a tap; once the pointer actually moves,
		// BottomSheet dismisses the keyboard as sheet travel begins.
		event.preventDefault();
		beginDrag(event as unknown as SheetPointer, measureHeight());
	}

	function handleContextMenu(event: MouseEvent): void {
		if (dragState == null) {
			return;
		}
		event.preventDefault();
		cancelDrag(event.currentTarget as HTMLElement);
	}

	function handleLostPointerCapture(event: PointerEvent): void {
		// A touch drag never took capture, so this is WebKit reclaiming its own
		// pointer for the finger doing the dragging — not the drag losing its grip.
		if (dragState?.syntheticTouch) {
			return;
		}
		if (dragState?.pointerId === event.pointerId) {
			cancelDrag();
		}
	}

	function handlePointerMove(event: SheetPointer): void {
		const state = dragState;
		if (!state || state.pointerId !== event.pointerId) {
			return;
		}
		// Same finger, real pointer event: the touch path already drove this move.
		// Let it own the drag rather than driving it twice.
		if (state.syntheticTouch && !isSyntheticTouch(event)) {
			return;
		}
		const delta = event.clientY - state.startCoord;
		const dt = event.timeStamp - state.lastTime;
		if (dt > 0) {
			state.velocity = (event.clientY - state.lastCoord) / dt;
			state.lastCoord = event.clientY;
			state.lastTime = event.timeStamp;
		}
		const { offsets, peekOffset } = resolveDetents(state.height);

		const raw = state.baseOffset + delta;
		const maxDetentOffset = offsets[offsets.length - 1];
		let next: number;
		if (raw < 0) {
			// Up past fully-open: damped + capped rubber-band; springs back on release.
			next = Math.max(-OVERSCROLL_MAX, raw * OVERSCROLL_RESISTANCE);
		} else if (raw > maxDetentOffset) {
			// In the dismiss zone: no magnet, so it doesn't fight a drag-to-close.
			next = raw;
		} else {
			// Between detents: magnetically ease toward a nearby one.
			next = magnetize(raw, offsets);
		}
		// Dragging above the base restores the full layout height below the
		// viewport; otherwise keep whatever layout the base detent settled with (0 at
		// a peek, so a peek drag stays transform-only).
		const layoutOffset = next < state.baseOffset ? 0 : state.baseLayoutOffset;
		state.renderedOffset = next;
		state.layoutOffset = layoutOffset;
		dragOffset = next;
		updateScrollPreservationInset(
			preservationInsetForOffset(state.baseLayoutOffset, layoutOffset, state.naturalEndGap)
		);

		// Mirror the scrim to the live drag: full at/above the mid detent, fading to
		// hidden as it collapses onto the peek detent and through the dismiss
		// overshoot.
		const floorOffset = offsets[offsets.length - 1];
		const shortestDetentHeight = visibleHeightForOffset(
			state.height,
			floorOffset,
			offscreenInset()
		);
		const dismissOffset = floorOffset + shortestDetentHeight * DISMISS_OVERSHOOT_RATIO;
		options.onScrimOpacity?.(scrimOpacityForOffset(next, offsets, dismissOffset, peekOffset));
	}

	function endDrag(event: SheetPointer): void {
		const state = dragState;
		if (!state || state.pointerId !== event.pointerId) {
			return;
		}
		// `pointercancel` fires for the finger the moment WebKit claims the gesture;
		// ending a touch drag on it settles the sheet mid-pull. The touchend handler
		// is what finishes a touch drag.
		if (state.syntheticTouch && !isSyntheticTouch(event)) {
			return;
		}
		const target = event.currentTarget;
		const delta = event.clientY - state.startCoord;
		const offset = Math.max(0, state.baseOffset + delta);
		const dir = delta === 0 ? 0 : delta > 0 ? 1 : -1;
		dragState = null;
		if (!state.syntheticTouch) {
			target.releasePointerCapture?.(event.pointerId);
		}
		isDragging = false;
		settleFromDrag(
			offset,
			state.velocity,
			state.height || 1,
			dir,
			Math.abs(delta),
			state.baseOffset,
			state.baseLayoutOffset,
			state.renderedOffset,
			state.layoutOffset,
			state.naturalEndGap
		);
	}

	// Pointer path for the body at-top pull-down (desktop / mouse). Touch uses the
	// non-passive listener below, since pointer events are cancelled once a native
	// pan starts.
	function handleBodyPointerDown(event: PointerEvent): void {
		if (event.button !== 0 || !event.isPrimary) {
			return;
		}
		const scroller = event.currentTarget as HTMLElement;
		if (scroller.scrollTop > 0) {
			armedBody = null;
			return;
		}
		armedBody = { pointerId: event.pointerId, startCoord: event.clientY, scroller };
	}

	function handleBodyPointerMove(event: PointerEvent): void {
		if (dragState) {
			handlePointerMove(event as unknown as SheetPointer);
			return;
		}
		const armed = armedBody;
		if (!armed || armed.pointerId !== event.pointerId) {
			return;
		}
		const delta = event.clientY - armed.startCoord;
		if (delta > 0 && armed.scroller.scrollTop <= 0) {
			// Downward pull at the top: promote to a sheet drag, anchored at the
			// original pointer-down position so the pull distance carries over.
			armedBody = null;
			beginDrag(event as unknown as SheetPointer, measureHeight(), armed.startCoord);
			handlePointerMove(event as unknown as SheetPointer);
		} else if (delta < 0) {
			// Upward move = the user is scrolling; disarm so we don't hijack it.
			armedBody = null;
		}
	}

	function handleBodyEnd(event: PointerEvent): void {
		armedBody = null;
		// The pointerup/pointercancel for a finger already driving a touch drag
		// arrives here carrying that drag's own id; touchend ends those.
		if (dragState?.syntheticTouch) {
			return;
		}
		if (dragState) {
			endDrag(event as unknown as SheetPointer);
		}
	}

	function reconcileScrollPreservationInset(body: HTMLElement): void {
		if (scrollPreservationInsetBox <= 0) {
			return;
		}
		const renderedInset = renderedBlockEndPadding(body);
		const naturalMaxScrollTop = Math.max(0, body.scrollHeight - body.clientHeight - renderedInset);
		const requiredInset = Math.max(0, body.scrollTop - naturalMaxScrollTop);
		if (requiredInset < scrollPreservationInsetBox - 0.5) {
			updateScrollPreservationInset(requiredInset);
		}
	}

	function handleBodyScroll(event: Event): void {
		if (dragState != null || settlingLayoutOffsetBox != null) {
			return;
		}
		reconcileScrollPreservationInset(event.currentTarget as HTMLElement);
	}

	/**
	 * Non-passive `touchmove` is the reliable scroll↔drag handoff on touch:
	 * `preventDefault()` at a scroll edge stops the native scroll and drives the
	 * sheet drag through the pointer math (a `Touch` adapted to the fields it
	 * reads).
	 *
	 * Every touch on the body is tracked, not only the ones that begin at an edge:
	 * a gesture that starts mid-content and scrolls to the end has to hand off too,
	 * and by then it is far too late to arm from `touchstart`.
	 *
	 * An attachment rather than upstream's callback ref, so the listener teardown
	 * is the attachment's own — upstream has to remember the previous handlers in a
	 * ref and detach them by hand.
	 */
	const attachBody = (node: HTMLElement) => {
		const asPointer = (touch: Touch, target: HTMLElement): SheetPointer => ({
			syntheticTouch: true,
			pointerId: touch.identifier,
			clientY: touch.clientY,
			timeStamp: Date.now(),
			currentTarget: target,
			setPointerCapture: () => {},
			releasePointerCapture: () => {}
		});

		const atTop = (el: HTMLElement) => el.scrollTop <= 0;
		const atBottom = (el: HTMLElement) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

		const onTouchStart = (event: TouchEvent) => {
			const scroller = event.currentTarget as HTMLElement;
			const touch = event.changedTouches[0];
			// Record where the gesture began and whether it began at a scroll edge. At
			// the top, a pull DOWN hands off (collapse); at the bottom, a pull UP hands
			// off (expand). A gesture that starts mid-content is an ordinary scroll,
			// but it is tracked all the same: the scroller can run out of content while
			// the finger is still down (see onTouchMove).
			if (!touch) {
				touchDrag = null;
				return;
			}
			const top = atTop(scroller);
			// The bottom edge hands off so the sheet can EXPAND, so it is only a
			// handoff when a taller detent exists. Already at the tallest, an upward
			// pull has nowhere to travel: promoting it would trade the user's scroll
			// for a rubber-band the release throws straight back, and — because
			// promotion preventDefault()s the rest of the gesture — would strand the
			// scroller for as long as the finger stays down, so reversing downward to
			// scroll back would collapse the sheet instead. Leave the gesture with the
			// content.
			const bottom = atBottom(scroller) && activeOffsetNow() > 0;
			touchDrag = {
				id: touch.identifier,
				startY: touch.clientY,
				top,
				bottom,
				contentEndY: null,
				promotedAtContentEnd: false
			};
		};

		const onTouchMove = (event: TouchEvent) => {
			const scroller = event.currentTarget as HTMLElement;
			const armed = touchDrag;
			if (dragState) {
				const t = [...event.changedTouches].find((x) => x.identifier === dragState?.pointerId);
				if (!t) {
					return;
				}
				if (armed?.promotedAtContentEnd && armed.contentEndY != null) {
					if (t.clientY >= armed.contentEndY) {
						// Back at the point where the content ran out. This drag never
						// cancelled the native scroll — it couldn't, the events were no
						// longer cancelable — so the scroller is about to move again. Hand
						// the gesture back rather than driving the sheet and the content at
						// once; a later pull past the end promotes again.
						armed.contentEndY = null;
						armed.promotedAtContentEnd = false;
						cancelDrag(scroller);
						return;
					}
					// Deliberately NOT preventDefault()ed: the scroller is clamped at its
					// end, so there is no scrolling left to cancel, and claiming the
					// gesture would strand the content for as long as the finger is down.
					handlePointerMove(asPointer(t, scroller));
					return;
				}
				event.preventDefault();
				handlePointerMove(asPointer(t, scroller));
				return;
			}
			if (!armed) {
				return;
			}
			const t = [...event.changedTouches].find((x) => x.identifier === armed.id);
			if (!t) {
				return;
			}
			const delta = t.clientY - armed.startY;
			// Promote to a sheet drag on a pull that opposes the armed edge and can no
			// longer scroll that way: at the top, a downward pull (delta > 0) collapses;
			// at the bottom, an upward pull (delta < 0) expands. The opposite direction
			// is a real scroll, so disarm and let it through.
			const pullDownAtTop = armed.top && delta > 0 && atTop(scroller);
			const pullUpAtBottom = armed.bottom && delta < 0 && atBottom(scroller);
			if (pullDownAtTop || pullUpAtBottom) {
				event.preventDefault();
				touchDrag = null;
				beginDrag(asPointer(t, scroller), measureHeight(), armed.startY);
				handlePointerMove(asPointer(t, scroller));
				return;
			}
			if ((armed.top && delta < 0) || (armed.bottom && delta > 0)) {
				// Scrolling away from the armed edge; hand back to native scroll. The
				// touch stays tracked: this is the swipe that may reach the far edge.
				armed.top = false;
				armed.bottom = false;
			}
			// Reaching the end of the content mid-gesture. Arming at `touchstart`
			// cannot see this, and re-arming for a preventDefault() promotion would be
			// useless anyway: once the browser has committed the gesture to scrolling,
			// every remaining touchmove is non-cancelable. Nothing needs cancelling
			// either — the scroller is clamped at its maximum, so further upward travel
			// scrolls nothing. Anchor at the point where the content ran out and give
			// the sheet everything past it, so the pull continues into the sheet with
			// no jump and no lost scrolling.
			if (activeOffsetNow() > 0 && atBottom(scroller)) {
				if (armed.contentEndY == null) {
					armed.contentEndY = t.clientY;
				} else if (armed.contentEndY - t.clientY >= CONTENT_END_HANDOFF_SLOP) {
					armed.promotedAtContentEnd = true;
					beginDrag(asPointer(t, scroller), measureHeight(), armed.contentEndY);
					handlePointerMove(asPointer(t, scroller));
				}
			} else {
				armed.contentEndY = null;
			}
		};

		const onTouchEnd = (event: TouchEvent) => {
			touchDrag = null;
			const pointerId = dragState?.pointerId;
			if (pointerId == null) {
				return;
			}
			const t = [...event.changedTouches].find((touch) => touch.identifier === pointerId);
			const target = event.currentTarget as HTMLElement;
			if (t) {
				endDrag(asPointer(t, target));
			} else if (event.touches.length === 0) {
				// Some interrupted multi-touch sequences omit the active touch from
				// changedTouches. If no fingers remain, the drag cannot finish later.
				cancelDrag(target);
			}
		};

		bodyNode = node;
		bodyElement = node;
		node.addEventListener('touchstart', onTouchStart, { passive: true });
		node.addEventListener('touchmove', onTouchMove, { passive: false });
		node.addEventListener('touchend', onTouchEnd, { passive: true });
		node.addEventListener('touchcancel', onTouchEnd, { passive: true });

		return () => {
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchmove', onTouchMove);
			node.removeEventListener('touchend', onTouchEnd);
			node.removeEventListener('touchcancel', onTouchEnd);
			bodyNode = null;
			bodyElement = null;
		};
	};

	// Subscribed, not memoized: the preference can change while a sheet is open,
	// and this branch decides whether the settle runs as a transition at all. The
	// imperative gesture paths read prefersReducedMotion() directly.
	const reducedMotion = useMediaQuery(() => '(prefers-reduced-motion: reduce)');

	// While dragging, follow the finger; otherwise rest at the settled detent.
	const activeOffset = $derived(isDragging ? dragOffset : settledOffset);

	const contentStyle = $derived(
		[
			activeOffset !== 0 ? `transform: translateY(${activeOffset}px)` : null,
			isDragging || isScrollAreaReconciling || reducedMotion.matches ? 'transition: none' : null,
			'touch-action: none',
			'overscroll-behavior: contain'
		]
			.filter((declaration) => declaration !== null)
			.join('; ')
	);

	const handleProps: SheetHandleProps = {
		style: 'touch-action: none; cursor: grab',
		oncontextmenu: handleContextMenu,
		onlostpointercapture: handleLostPointerCapture,
		onpointerdown: handlePointerDown,
		onpointermove: (event) => handlePointerMove(event as unknown as SheetPointer),
		onpointerup: (event) => endDrag(event as unknown as SheetPointer),
		onpointercancel: (event) => endDrag(event as unknown as SheetPointer)
	};

	const bodyProps: SheetBodyProps = {
		oncontextmenu: handleContextMenu,
		onlostpointercapture: handleLostPointerCapture,
		onpointerdown: handleBodyPointerDown,
		onpointermove: handleBodyPointerMove,
		onpointerup: handleBodyEnd,
		onpointercancel: handleBodyEnd,
		onscroll: handleBodyScroll,
		[createAttachmentKey()]: attachBody
	};

	return {
		sheetAttachment,
		get contentProps() {
			return { style: contentStyle };
		},
		handleProps,
		bodyProps,
		get bodyElement() {
			return bodyElement;
		},
		get dragOffset() {
			return dragOffset;
		},
		get settledOffset() {
			return settledOffset;
		},
		get isDragging() {
			return isDragging;
		},
		get sheetHeight() {
			return sheetHeight;
		},
		get scrollPreservationInset() {
			return scrollPreservationInset;
		},
		get settlingLayoutOffset() {
			return settlingLayoutOffset;
		},
		get settledLayoutOffset() {
			return settledLayoutOffset;
		},
		completeScrollAreaSettle
	};
}
