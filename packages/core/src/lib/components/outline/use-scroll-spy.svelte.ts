import { untrack } from 'svelte';
import type { OutlineItem } from './types.js';

/**
 * Drives the active outline item from scroll position, ported from Astryx's
 * `Outline/useScrollSpy.ts`.
 *
 * On each scroll (rAF-throttled) it reads live heading positions and marks the
 * last heading whose top has passed its activation line. This is stable — it
 * never compares stale cached positions — so the indicator moves monotonically
 * instead of jumping. Defaults to the first item at the top and the last item at
 * the bottom so short final sections still activate.
 *
 * The activation line and the scroll landing are the same number, computed once
 * in {@link getRestingTop}: scroll-root top + `offset` (a fixed header overlaying
 * the root) + the heading's own `scroll-margin-top`. A heading therefore
 * activates exactly where navigating to it puts it. `offset` and
 * `scroll-margin-top` compose — the header, then the breathing room below it —
 * they do not duplicate each other.
 *
 * It also owns the single navigation path ({@link UseScrollSpyResult.scrollTo}),
 * shared by click and keyboard activation: it announces the jump, suppresses
 * scroll-spy for the duration of the programmatic scroll (so the indicator
 * doesn't chase it), and resolves when the scroll settles — via `scrollend` where
 * supported, or a timeout fallback where it is not.
 *
 * The scroll root is the `scrollContainerRef` element when provided, otherwise
 * the nearest scrollable ancestor of the outline, otherwise the viewport.
 *
 * Module-private on both sides: upstream's `Outline/index.ts` publishes
 * `useOutlineFromDOM` and `useOutlineFromMarkdown` but not this one.
 */

/**
 * How long to wait for a programmatic smooth scroll to settle when the
 * `scrollend` event never arrives — either because the browser does not support
 * it (Safari at time of writing) or because the target was already in position,
 * so no scroll happened at all and no events were emitted.
 */
const SCROLL_SETTLE_TIMEOUT_MS = 1200;

/** Keys that scroll the viewport — used to detect a manual scroll intent. */
const SCROLL_KEYS = new Set([
	'ArrowUp',
	'ArrowDown',
	'PageUp',
	'PageDown',
	'Home',
	'End',
	' ',
	'Spacebar'
]);

function getScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
	let current = element?.parentElement ?? null;

	while (current != null) {
		const computedStyle = window.getComputedStyle(current);
		const overflowY = computedStyle.overflowY;
		const isScrollable =
			(overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
			current.scrollHeight > current.clientHeight;

		if (isScrollable) {
			return current;
		}

		current = current.parentElement;
	}

	return null;
}

/** The element's own `scroll-margin-top` in px (0 when unset). */
function getScrollMarginTop(element: HTMLElement): number {
	return Number.parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0;
}

/** The top of the scroll root in viewport coordinates (0 for the viewport). */
function getRootTop(scrollRoot: HTMLElement | null): number {
	return scrollRoot != null ? scrollRoot.getBoundingClientRect().top : 0;
}

/**
 * Where a heading comes to rest, in viewport coordinates: below the fixed header
 * (`offset`) and below its own `scroll-margin-top` breathing room.
 *
 * This is the single source of truth shared by the activation line and the
 * scroll landing — the two must agree, or a heading activates somewhere other
 * than where navigating to it puts it.
 */
function getRestingTop(
	target: HTMLElement,
	scrollRoot: HTMLElement | null,
	offset: number
): number {
	return getRootTop(scrollRoot) + offset + getScrollMarginTop(target);
}

/**
 * Bring `target` to rest at the top of the scroll root, below any fixed header.
 *
 * With no `offset`, this is the CSS-native path: `scrollIntoView` already honors
 * the heading's `scroll-margin-top`, and it walks *every* scrollable ancestor, so
 * the browser does it better than we can.
 *
 * An `offset` describes a fixed header overlaying the top of the scroll root —
 * which the browser cannot know about, so `scrollIntoView` would park the heading
 * underneath it, hidden. Compute the landing explicitly instead, from the same
 * {@link getRestingTop} the activation line uses.
 */
function scrollToTarget(
	target: HTMLElement,
	scrollRoot: HTMLElement | null,
	scrollTarget: HTMLElement | Window,
	offset: number
): void {
	if (offset === 0) {
		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		return;
	}

	const delta = target.getBoundingClientRect().top - getRestingTop(target, scrollRoot, offset);
	scrollTarget.scrollBy({ top: delta, behavior: 'smooth' });
}

/**
 * Resolve the active heading id from current scroll position.
 *
 * A heading is "passed" once its top reaches its activation line — exactly where
 * navigating to it would land it ({@link getRestingTop}): the scroll root's top,
 * plus `offset` (a fixed header overlaying the scroll root), plus the heading's
 * own scroll-margin-top. The active heading is the last passed one (headings are
 * in document order). When none have passed (scrolled above the first), the first
 * item is active; at the bottom, the last item is active.
 */
function resolveActiveId(
	items: OutlineItem[],
	scrollRoot: HTMLElement | null,
	offset: number
): string | undefined {
	if (items.length === 0) {
		return undefined;
	}

	const atBottom =
		scrollRoot != null
			? scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 2
			: window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
	if (atBottom) {
		return items[items.length - 1].id;
	}

	let activeId = items[0].id;
	for (const item of items) {
		const element = document.getElementById(item.id);
		if (element == null) {
			continue;
		}

		// 1px of tolerance absorbs sub-pixel rounding after a scroll lands.
		const top = element.getBoundingClientRect().top;
		if (top <= getRestingTop(element, scrollRoot, offset) + 1) {
			activeId = item.id;
		} else {
			break;
		}
	}
	return activeId;
}

export interface UseScrollSpyOptions {
	activeId?: string;
	items: OutlineItem[];
	onActiveIdChange?: (id: string) => void;
	/** The `<nav>` root. Upstream passes a `RefObject`; this port passes the element. */
	rootEl: HTMLElement | null;
	/**
	 * Height in px of a fixed header overlaying the top of the scroll root.
	 * Shifts both the activation line and the scroll landing by the same amount,
	 * on top of each heading's own `scroll-margin-top`.
	 */
	offset?: number;
	/**
	 * Scroll container to track, instead of the nearest scrollable ancestor.
	 * Upstream passes a `RefObject`; this port passes a getter, the settled
	 * translation (`ChatLayout.scrollRef`, `useOutlineFromDOM`).
	 */
	scrollContainerRef?: () => HTMLElement | null;
	/** Whether {@link UseScrollSpyResult.scrollTo} performs the smooth scroll. */
	hasScrollOnClick?: boolean;
	/** Called when a navigation begins, before the scroll starts. */
	onNavigateStart?: (id: string) => void;
	/** Called once per navigation, when the scroll settles or is interrupted. */
	onNavigateEnd?: (id: string) => void;
}

export interface UseScrollSpyResult {
	readonly activeId: string | undefined;
	/** Set the active id (notifies onActiveIdChange). For controlled consumers. */
	setActiveId: (id: string) => void;
	/**
	 * Navigate to the item with id `id` — the single path shared by click and
	 * keyboard activation.
	 *
	 * Fires `onNavigateStart(id)`, scrolls (unless `hasScrollOnClick` is false),
	 * and fires `onNavigateEnd(id)` exactly once when the scroll settles or the
	 * user interrupts it. While uncontrolled, scroll-spy is suppressed for the
	 * duration so the indicator doesn't chase the scroll through intervening
	 * sections; it lands on the target once the scroll settles, or resumes
	 * position tracking if the user scrolls away mid-flight.
	 *
	 * Returns false (and does nothing) when no element with `id` exists.
	 */
	scrollTo: (id: string) => boolean;
}

export function useScrollSpy(options: () => UseScrollSpyOptions): UseScrollSpyResult {
	// `items[0]` is read once at init, matching `useState(items[0]?.id)` — a later
	// items change must not reset an active id the user has scrolled to.
	let uncontrolledActiveId = $state<string | undefined>(untrack(() => options().items[0]?.id));

	// Upstream's refs. Plain `let`s here, deliberately: a ref is precisely a
	// non-reactive cell, and making any of these `$state` would subscribe the
	// scroll listener to its own writes.
	let suppressed = false;
	let sync: (() => void) | null = null;
	// The navigation currently in flight, if any.
	let navigation: {
		/** End it (without resuming tracking) because a new one is starting. */
		supersede: () => void;
		/** Drop its listeners without firing onNavigateEnd (unmount). */
		teardown: () => void;
	} | null = null;

	const isControlled = $derived(options().activeId !== undefined);
	const resolvedActiveId = $derived(isControlled ? options().activeId : uncontrolledActiveId);

	// Upstream keys the scroll effect on `[isControlled, itemIds, offset,
	// getScrollRoot]` — the *ids*, not the array, because `items` is a fresh array
	// on every render. A `$derived` string reproduces that exactly: Svelte does not
	// propagate a derived whose value is unchanged, so a re-created array with the
	// same ids does not re-subscribe the listener.
	const itemIds = $derived(
		options()
			.items.map((item) => item.id)
			.join('\n')
	);

	/**
	 * The element whose scroll position drives the outline: the explicit container
	 * when scoped, else the nearest scrollable ancestor, else null (the viewport).
	 */
	function getScrollRoot(): HTMLElement | null {
		const current = options();
		return current.scrollContainerRef?.() ?? getScrollableAncestor(current.rootEl);
	}

	$effect(() => {
		// The dependencies, read deliberately and nothing else. Everything the
		// callbacks below need is read through `untrack`, so this effect does not
		// re-subscribe when `items`' identity or `onActiveIdChange` changes.
		//
		// `getScrollRoot()` is called *tracked* here, which is upstream's
		// `getScrollRoot` dep read one level deeper: a `scrollContainerRef` getter
		// over a `$state` element re-subscribes the listener when that element
		// mounts, where React would need the ref to change identity.
		const controlled = isControlled;
		const offset = options().offset ?? 0;
		void itemIds;
		const scrollRoot = getScrollRoot();

		if (controlled) {
			return;
		}

		const scrollTarget: HTMLElement | Window = scrollRoot ?? window;

		let frame = 0;
		const update = (): void => {
			frame = 0;
			if (suppressed) {
				return;
			}
			// Runs inside a rAF callback, outside any tracking context — but the one
			// synchronous call below is not, hence the `untrack` there.
			const current = options();
			const nextActiveId = resolveActiveId(current.items, scrollRoot, offset);
			if (nextActiveId != null && nextActiveId !== resolvedActiveId) {
				uncontrolledActiveId = nextActiveId;
				current.onActiveIdChange?.(nextActiveId);
			}
		};
		const onScroll = (): void => {
			if (frame === 0) {
				frame = requestAnimationFrame(update);
			}
		};

		sync = update;
		untrack(update);
		scrollTarget.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });

		return () => {
			sync = null;
			scrollTarget.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (frame !== 0) {
				cancelAnimationFrame(frame);
			}
		};
	});

	// Tear down any in-flight navigation's listeners when the Outline unmounts.
	$effect(() => {
		return () => {
			navigation?.teardown();
		};
	});

	function setActiveId(nextActiveId: string): void {
		if (!untrack(() => isControlled)) {
			uncontrolledActiveId = nextActiveId;
		}
		untrack(() => options().onActiveIdChange)?.(nextActiveId);
	}

	function scrollTo(id: string): boolean {
		// Upstream's `typeof document === 'undefined'` branch has no counterpart:
		// this is only ever reached from an event handler, which cannot run on the
		// server.
		const target = document.getElementById(id);
		if (target == null) {
			return false;
		}

		// Read every option once, up front. An event handler is outside any
		// tracking context, so these reads subscribe nothing — the `untrack` is for
		// the reader, not the runtime.
		const current = untrack(options);
		const controlled = current.activeId !== undefined;
		const offset = current.offset ?? 0;
		const hasScrollOnClick = current.hasScrollOnClick ?? true;

		// A second navigation replaces the first: end the old one (balancing its
		// onNavigateStart) without resuming tracking, since we are about to
		// suppress it again anyway.
		navigation?.supersede();

		current.onNavigateStart?.(id);

		if (controlled) {
			// The consumer owns the active state — notify only.
			setActiveId(id);
		} else {
			// Freeze the indicator during the programmatic scroll instead of moving
			// it immediately: it lands on the target once the scroll settles, so it
			// doesn't chase the scroll through intervening sections.
			suppressed = true;
		}

		const scrollRoot = getScrollRoot();
		const scrollTarget: HTMLElement | Window = scrollRoot ?? window;

		let settleTimer = 0;
		let isSettled = false;

		const cleanup = (): void => {
			scrollTarget.removeEventListener('scrollend', onSettle);
			scrollTarget.removeEventListener('wheel', onManual);
			scrollTarget.removeEventListener('touchmove', onManual);
			window.removeEventListener('keydown', onKeyDown);
			if (settleTimer !== 0) {
				clearTimeout(settleTimer);
				settleTimer = 0;
			}
			navigation = null;
		};

		/**
		 * End the navigation exactly once. `didArrive` is false when the user took
		 * over with a manual scroll mid-flight. `onNavigateEnd` fires either way, so
		 * every `onNavigateStart` is balanced and a consumer's "navigating" state
		 * can never leak.
		 */
		const finish = (didArrive: boolean, shouldResume = true): void => {
			if (isSettled) {
				return;
			}
			isSettled = true;
			cleanup();

			if (!controlled) {
				suppressed = false;
				if (didArrive) {
					uncontrolledActiveId = id;
					untrack(() => options().onActiveIdChange)?.(id);
				} else if (shouldResume) {
					// Hand control back to scroll-position tracking.
					sync?.();
				}
			}

			current.onNavigateEnd?.(id);
		};

		const onSettle = (): void => finish(true);
		const onManual = (): void => finish(false);
		const onKeyDown = (event: KeyboardEvent): void => {
			// A key the outline itself consumed (arrow roving focus, Space
			// activation) is prevented, so the browser will not scroll — it is not a
			// manual scroll intent and must not cancel the navigation it just began.
			if (!event.defaultPrevented && SCROLL_KEYS.has(event.key)) {
				finish(false);
			}
		};

		if (hasScrollOnClick) {
			// Arm settle detection *before* scrolling so an instant jump (a target
			// already in position, or prefers-reduced-motion collapsing the smooth
			// scroll) cannot land before anyone is listening.
			scrollTarget.addEventListener('scrollend', onSettle, { once: true });
			scrollTarget.addEventListener('wheel', onManual, { passive: true });
			scrollTarget.addEventListener('touchmove', onManual, { passive: true });
			window.addEventListener('keydown', onKeyDown);
			settleTimer = window.setTimeout(onSettle, SCROLL_SETTLE_TIMEOUT_MS);
			navigation = {
				supersede: () => finish(false, false),
				teardown: cleanup
			};
			scrollToTarget(target, scrollRoot, scrollTarget, offset);
		} else {
			// The consumer owns scrolling — there is no scroll to wait for, so the
			// navigation is already at rest. Resolving immediately (instead of
			// waiting on the settle timeout) keeps onNavigateEnd usable for arrival
			// effects even when hasScrollOnClick is false.
			finish(true);
		}

		return true;
	}

	return {
		get activeId() {
			return resolvedActiveId;
		},
		setActiveId,
		scrollTo
	};
}
