<script lang="ts" module>
	import type { DayOfWeek, ISODateString, PlainDate } from '../../utils/date-types.js';

	export interface MonthScrollerProps {
		/** First reachable month, as a month index. */
		minMonthIndex: number;
		/** Last reachable month, as a month index. */
		maxMonthIndex: number;
		/** Month to rest on at mount. */
		initialMonthIndex: number;
		/** Fires as the scroller passes each month, settled or not. */
		onVisibleMonthChange: (monthIndex: number) => void;
		/** Currently selected date. */
		selectedDate: PlainDate | null;
		/** Today, for the `aria-current` marker. */
		today: PlainDate;
		/** Whether a date fails min/max or a custom constraint. */
		isDateDisabled: (date: PlainDate) => boolean;
		/** First column of the week. */
		weekStartsOn: DayOfWeek;
		/** Fired when a day is tapped. */
		onSelect: (value: ISODateString) => void;
	}

	/**
	 * The instance shape `bind:this` exposes — upstream's `MonthScrollerHandle`,
	 * reached through the component instance rather than a `handleRef` prop, the
	 * way `Calendar`'s `navigateTo` already is in this port.
	 */
	export interface MonthScrollerHandle {
		/** Bring a month to rest at the top of the scrollport. */
		scrollToMonth: (monthIndex: number, behavior?: ScrollBehavior) => void;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { useDirection } from '../../i18n/use-direction.svelte.js';
	import {
		plainDateAddDays,
		plainDateDayOfWeek,
		plainDateIsEqual,
		plainDateToISO
	} from '../../utils/plain-date.js';
	import MonthPane from './month-pane.svelte';
	import { useOwnScrollGesture } from './use-own-scroll-gesture.svelte.js';
	import { useScrollSettle } from './use-scroll-settle.svelte.js';
	import {
		monthIndexOf,
		paneWindow,
		rowAtScrollOffset,
		rowsIn,
		scrollOffsetForRow
	} from './month-geometry.js';
	import { monthScrollerAttrs, monthScrollerSpacerAttrs } from './month-scroller.stylex.js';

	/**
	 * A continuously paged run of month grids, ported from Astryx's
	 * `DateInput/MonthScroller.tsx`.
	 *
	 * The list is long (a century by default) but only a few panes are ever
	 * mounted: a spacer holds the full scroll width and the visible panes are
	 * positioned into it absolutely. Nothing is stitched or recycled during a
	 * scroll, so snap offsets are constant and momentum is never interrupted —
	 * which is the failure mode of the usual "append months at the edge"
	 * approach.
	 *
	 * Internal to `DateInput`; not exported from the barrel, exactly as upstream
	 * keeps it out of `DateInput/index.ts`.
	 */
	let {
		minMonthIndex,
		maxMonthIndex,
		initialMonthIndex,
		onVisibleMonthChange,
		selectedDate,
		today,
		isDateDisabled,
		weekStartsOn,
		onSelect
	}: MonthScrollerProps = $props();

	/**
	 * Panes mounted on each side of the visible one. Sized against a fast fling:
	 * the window widens once per animation frame, so it only fails if a single
	 * frame travels further than this — three months, about 800px at the default
	 * day size. Under `scroll-snap-type: mandatory`, landing on an unmounted pane
	 * would not merely show a gap, it would re-snap to the nearest mounted one.
	 */
	const OVERSCAN = 3;

	let scroller = $state<HTMLDivElement | null>(null);
	const rowCount = $derived(maxMonthIndex - minMonthIndex + 1);

	// Pane WIDTH is read from layout, never assumed: it is whatever the CSS
	// says the scrollport is, so the snap offsets and the virtualization follow
	// a resize (rotation, a split-screen change) without re-deriving anything.
	let paneSize = $state(0);
	// Which way the inline axis runs. Under RTL the panes lay out from the
	// right and scrollLeft counts DOWN from 0, so every conversion between a
	// row and a scroll offset has to know.
	const direction = useDirection();
	const isRTL = $derived(direction() === 'rtl');
	// svelte-ignore state_referenced_locally
	let centerRow = $state(initialMonthIndex - minMonthIndex);
	// Upstream's `centerRowRef`: the visible row mirrored so the scroll handler
	// can tell "changed" from "same" without reading state. A plain `let`, not a
	// rune — the handler both reads and writes this, and a reactive read there
	// would make the scroll effect depend on its own write.
	// svelte-ignore state_referenced_locally
	let centerRowValue = centerRow;
	// A row to scroll to once its pane is mounted; see scrollToMonth.
	let pendingScroll: number | null = null;

	/**
	 * The row a programmatic scroll is heading for, so its own scroll events
	 * are not reported back as if the user had gone there. Null once a finger
	 * touches the scroller, or once the steered scroll has arrived.
	 */
	let steeredRow: number | null = null;

	// Keyboard focus moves by date, not by cell index, so it crosses month
	// boundaries the way a calendar should. Null until the user takes the grid
	// with the keyboard.
	let focusedDate = $state<PlainDate | null>(null);
	let shouldRestoreFocus = false;

	// Upstream's `useLayoutEffect(…, [])`. A pre-effect is this port's
	// counterpart: it runs before the DOM is painted, which is where a
	// measurement belongs.
	$effect.pre(() => {
		const node = scroller;
		if (node == null) {
			return;
		}
		const measure = (): void => {
			// Ignore zero: the picker can be mounted inside something not yet
			// displayed (a closed BottomSheet), and a zero width would unmount
			// every pane and lose the scroll position.
			const measured = node.clientWidth;
			if (measured > 0) {
				untrack(() => {
					paneSize = measured;
				});
			}
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	});

	/**
	 * Land on the initial month before the first paint. Runs once the width is
	 * known; `hasPositioned` keeps a later resize from yanking the user back.
	 *
	 * **A post-effect, where the measurement above is a pre-effect, and the
	 * difference is the whole bug this once had.** Upstream is `useLayoutEffect`
	 * for both, and a layout effect runs *after* React has committed the DOM —
	 * so by the time it writes `scrollLeft`, the spacer already carries the width
	 * the same render gave it. `$effect.pre` is not that: it runs *before* Svelte
	 * patches the DOM, so the spacer still had its previous width — zero, on the
	 * pass that matters — and the browser clamped the write to 0.
	 *
	 * What made it invisible is that the scroller does not stay at 0. The panes
	 * mount an instant later at rows `centerRow ± OVERSCAN`, and
	 * `scroll-snap-type: mandatory` pulls the scrollport to the nearest snap
	 * area, which is the *first mounted pane*. So the calendar opened exactly
	 * `OVERSCAN` months early — three, every time the window is not clamped at
	 * row 0 — and looked deliberate rather than broken. It is the same failure
	 * the scroll listener below already warns about from the other direction.
	 *
	 * `$effect` runs after the DOM is patched and before paint, which is what
	 * `useLayoutEffect` means. The measurement stays in `$effect.pre`, where
	 * reading layout genuinely belongs.
	 */
	let hasPositioned = false;
	$effect(() => {
		const node = scroller;
		const size = paneSize;
		const initial = initialMonthIndex;
		const min = minMonthIndex;
		const rtl = isRTL;
		if (node == null || size === 0 || hasPositioned) {
			return;
		}
		hasPositioned = true;
		node.scrollLeft = scrollOffsetForRow(initial - min, size, rtl);
	});

	/**
	 * Upstream's `useImperativeHandle(handleRef, …)`. Svelte's counterpart to an
	 * imperative handle is the component instance, so this is an instance export
	 * reached through `bind:this` rather than a `handleRef` prop.
	 */
	export function scrollToMonth(monthIndex: number, behavior: ScrollBehavior = 'smooth'): void {
		const node = scroller;
		if (node == null || paneSize === 0) {
			return;
		}
		const row = Math.min(rowCount - 1, Math.max(0, monthIndex - minMonthIndex));
		if (Math.abs(row - centerRowValue) > OVERSCAN) {
			// Beyond the mounted window there is no pane at the target offset, and
			// `scroll-snap-type: mandatory` will not leave the scroller resting
			// where no snap area is — it re-snaps to the nearest mounted pane, so
			// a jump to another year lands one month away instead. Mount the
			// target first and scroll once it exists (see the effect below); a
			// jump that far is never worth animating either.
			pendingScroll = row;
			centerRowValue = row;
			centerRow = row;
			return;
		}
		steeredRow = row;
		node.scrollTo({ left: scrollOffsetForRow(row, paneSize, isRTL), behavior });
	}

	/**
	 * Upstream runs this un-keyed — "after every render" — because it must fire
	 * on whichever render finally mounts the pending row's pane. Svelte has no
	 * after-every-render effect, and does not need one: `pendingScroll` is only
	 * ever set together with a `centerRow` change (the branch above is taken
	 * exactly when the target is outside the mounted window), so depending on
	 * `centerRow` fires on the same render and no other. A post-effect, not a
	 * pre-effect: the pane has to exist in the DOM before the scroll lands.
	 */
	$effect(() => {
		// Read for the dependency; the value itself comes from the plain `let`.
		void centerRow;
		const node = scroller;
		const size = paneSize;
		const row = pendingScroll;
		if (row == null || node == null || size === 0) {
			return;
		}
		pendingScroll = null;
		node.scrollTo({ left: scrollOffsetForRow(row, size, isRTL), behavior: 'auto' });
	});

	/**
	 * Put the scroller back on a pane boundary once the gesture is over.
	 *
	 * `scroll-snap-type: mandatory` is supposed to make this unnecessary, and
	 * on a static list it does. This list is virtualized: seven panes exist out
	 * of twelve hundred, and the panes ARE the snap areas — so every month the
	 * finger crosses mounts one and unmounts another, mid-fling.
	 *
	 * iOS scrolls off the main thread. It picks a landing place from the snap
	 * points it knows about at the time, and a re-render that lands after that
	 * decision moves them; the scroller then comes to rest where no snap point
	 * exists any more, and nothing re-snaps it. That is the calendar sitting
	 * between two months with the weekday header still square — the grid is not
	 * skewed, the scrollport is simply parked a couple of columns into a pane.
	 * Chrome hides it by snapping again after the mutation.
	 *
	 * ## Why it re-checks that the scroller is still
	 *
	 * A quiet period is not proof of rest, and getting that wrong here does not
	 * merely fail to fix the bug — it REVERSES the user's swipe. iOS runs its
	 * own snap animation for ~150-300ms after the finger lifts, and the scroll
	 * events it fires during that animation arrive irregularly; a gap longer
	 * than the quiet period is routine in the slow tail. The settle then lands
	 * mid-animation, reads a scrollLeft still travelling toward April, rounds
	 * THAT to the nearest pane — which is still March, because the animation is
	 * not yet halfway — and drags the calendar back where it came from.
	 *
	 * Two samples a frame apart settle it: if the offset moved, the scroller is
	 * still going somewhere and its destination is not ours to guess. Skipping
	 * costs nothing, because the animation's own scroll events re-arm the
	 * settle, and the last of them gets a quiet period that ends at true rest.
	 *
	 * The threshold is a subpixel rather than exact equality. A scroller at rest
	 * on a fractional-density viewport can report an offset that wobbles in the
	 * last decimal place, and exact equality would read that as travel and never
	 * correct at all — the failure mode being silent, which is the worst kind.
	 *
	 * The correction is at most half a pane by construction, and its own scroll
	 * settles onto the boundary it just aimed at, so it cannot oscillate.
	 */
	let settleFrame: number | undefined;
	$effect(() => {
		return () => {
			if (settleFrame != null) {
				cancelAnimationFrame(settleFrame);
			}
		};
	});

	useScrollSettle(
		() => scroller,
		(node) => {
			if (paneSize === 0) {
				return;
			}
			const offsetBefore = node.scrollLeft;
			if (settleFrame != null) {
				cancelAnimationFrame(settleFrame);
			}
			settleFrame = requestAnimationFrame(() => {
				settleFrame = undefined;
				// Still travelling — including a snap animation iOS has not
				// finished. Correcting toward the nearest pane from a position
				// mid-flight would undo the swipe rather than complete it.
				if (Math.abs(node.scrollLeft - offsetBefore) >= 0.5) {
					return;
				}
				const row = rowAtScrollOffset(node.scrollLeft, paneSize, rowCount, isRTL);
				const target = scrollOffsetForRow(row, paneSize, isRTL);
				// Sub-pixel drift is the browser's own rounding, not a failed snap.
				if (Math.abs(node.scrollLeft - target) < 1) {
					return;
				}
				node.scrollTo({ left: target, behavior: 'smooth' });
			});
		}
	);

	// Claim horizontal gestures, leave vertical ones to the sheet.
	//
	// `touch-action: pan-x` alone is NOT enough: it governs what the browser
	// pans natively, and the sheet's listener is JavaScript whose
	// preventDefault() cancels the scroll regardless. Measured — a swipe 9° off
	// horizontal had every touchmove cancelled by the sheet and the month never
	// changed. The axis lock is biased toward horizontal, because a thumb arcs
	// as it swipes; `onSwipe` then pages the diagonals the browser itself
	// declines to pan, so no angle is left doing nothing. See
	// use-own-scroll-gesture.
	useOwnScrollGesture(
		() => scroller,
		() => 'inline',
		() => ({
			onSwipe: (swipeDirection) => {
				const node = scroller;
				if (node == null || paneSize === 0) {
					return;
				}
				node.scrollBy({ left: swipeDirection * paneSize, behavior: 'smooth' });
			}
		})
	);

	// rAF-throttled: a touch scroll fires far more scroll events than frames,
	// and all this does is move a label and widen a window.
	$effect(() => {
		const node = scroller;
		const size = paneSize;
		const count = rowCount;
		const min = minMonthIndex;
		const rtl = isRTL;
		// Not before the width is known. A listener attached while it was zero
		// would close over that zero and report row 0 for any scroll — and the
		// scroll event fired by the initial positioning arrives just late enough
		// to be handled by that stale listener. Every pane then unmounts except
		// rows 0-2, and `scroll-snap-type: mandatory` yanks the scroller to the
		// nearest surviving snap area, a century away from where it just landed.
		if (node == null || size === 0) {
			return;
		}
		let frame: number | undefined;
		// A finger on the scroller ends any steering: from here the months it
		// passes are the user's doing and every one of them is worth reporting.
		const onTouchStart = (): void => {
			steeredRow = null;
		};
		const onScroll = (): void => {
			if (frame != null) {
				return;
			}
			frame = requestAnimationFrame(() => {
				frame = undefined;
				const row = rowAtScrollOffset(node.scrollLeft, size, count, rtl);
				if (row === centerRowValue) {
					return;
				}
				centerRowValue = row;
				centerRow = row;
				// Report nothing while a steer is in flight. `scrollToMonth` is only
				// ever called by something that already knows the month — a wheel
				// commit, a header arrow, the re-assert when the wheels close — so
				// none of the scrolling it causes is news, including whatever the
				// scroller passes through on the way.
				//
				// Reporting it is a feedback cycle, and worse on iOS. A wheel commit
				// steers this scroller while it is hidden behind the wheels, and a
				// hidden scroller does not reliably stay where it was put: iOS
				// re-snaps it when the panel becomes visible again, firing scrolls
				// at the exact moment reports start being trusted again. The month
				// drifted on the way back to the calendar.
				//
				// Cleared on arrival, or by a touch above.
				if (steeredRow != null) {
					if (steeredRow === row) {
						steeredRow = null;
					}
					return;
				}
				onVisibleMonthChange(min + row);
			});
		};
		node.addEventListener('scroll', onScroll, { passive: true });
		node.addEventListener('touchstart', onTouchStart, { passive: true });
		return () => {
			node.removeEventListener('scroll', onScroll);
			node.removeEventListener('touchstart', onTouchStart);
			if (frame != null) {
				cancelAnimationFrame(frame);
				frame = undefined;
			}
		};
	});

	// Move the keyboard focus by whole days and let the scroller follow. Paging
	// by month is PageUp/PageDown; everything else is the APG grid vocabulary.
	function moveFocus(from: PlainDate, deltaDays: number): void {
		const next = plainDateAddDays(from, deltaDays);
		const nextIndex = monthIndexOf(next);
		if (nextIndex < minMonthIndex || nextIndex > maxMonthIndex) {
			return;
		}
		shouldRestoreFocus = true;
		focusedDate = next;
		if (nextIndex !== monthIndexOf(from)) {
			scrollToMonth(nextIndex, 'smooth');
		}
	}

	function handleKeyDown(event: KeyboardEvent, date: PlainDate): void {
		// Column within the displayed week, which is what Home/End move to —
		// not the day of the month.
		const column = (plainDateDayOfWeek(date) - weekStartsOn + 7) % 7;
		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				moveFocus(date, -1);
				break;
			case 'ArrowRight':
				event.preventDefault();
				moveFocus(date, 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				moveFocus(date, -7);
				break;
			case 'ArrowDown':
				event.preventDefault();
				moveFocus(date, 7);
				break;
			case 'Home':
				event.preventDefault();
				moveFocus(date, -column);
				break;
			case 'End':
				event.preventDefault();
				moveFocus(date, 6 - column);
				break;
			default:
				break;
		}
	}

	// The focused day may have been in an unmounted pane a frame ago; focus it
	// once it exists, and only in response to a key press so a scroll never
	// steals focus.
	const focusedISO = $derived(focusedDate == null ? null : plainDateToISO(focusedDate));
	$effect(() => {
		const iso = focusedISO;
		if (!shouldRestoreFocus || iso == null) {
			return;
		}
		const target = scroller?.querySelector<HTMLElement>(`[data-date="${iso}"]`);
		if (target != null) {
			shouldRestoreFocus = false;
			// preventScroll: the scroller is already snapping to this month; a
			// browser scroll-into-view here would fight the snap and land between
			// two panes.
			target.focus({ preventScroll: true });
		}
	});

	const visibleRows = $derived(paneWindow(centerRow, rowCount, OVERSCAN));

	// A focus event fires for the programmatic focus above too; only take the
	// date when it is actually a different day.
	function handleDayFocus(date: PlainDate): void {
		if (focusedDate != null && plainDateIsEqual(focusedDate, date)) {
			return;
		}
		focusedDate = date;
	}

	const scrollerAttrs = monthScrollerAttrs();
	const spacerAttrs = $derived(monthScrollerSpacerAttrs(rowCount * paneSize));
</script>

<div
	bind:this={scroller}
	data-scroller="months"
	class={scrollerAttrs.class}
	style={scrollerAttrs.style}
>
	<div class={spacerAttrs.class} style={spacerAttrs.style}>
		{#if paneSize > 0}
			{#each rowsIn(visibleRows) as row (row)}
				<MonthPane
					monthIndex={minMonthIndex + row}
					insetInlineStart={row * paneSize}
					inlineSize={paneSize}
					{selectedDate}
					{focusedDate}
					{today}
					{isDateDisabled}
					{weekStartsOn}
					{onSelect}
					onDayKeyDown={handleKeyDown}
					onDayFocus={handleDayFocus}
				/>
			{/each}
		{/if}
	</div>
</div>
