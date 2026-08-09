import type { Attachment } from 'svelte/attachments';
import { useListFocus } from '../hooks/use-list-focus.svelte.js';
import { useMediaQuery } from '../hooks/use-media-query.svelte.js';

/**
 * Ported from Astryx's `hooks/useMenuHover.ts`.
 *
 * Hover as a progressive enhancement over ordinary popover behaviour, shared by
 * `SideNavHeading`, `TopNavHeading` and `TopNavMenu`:
 *
 * 1. Click toggles; Escape, outside-click and arrow-key navigation come from the
 *    popover and `useListFocus` underneath.
 * 2. `mouseenter` activates *hover mode* and opens after `showDelay`; while in
 *    hover mode `mouseleave` closes after `hideDelay`. Any close resets hover
 *    mode, and closing by click additionally swallows the next `mouseenter` so
 *    the menu does not immediately reopen under a stationary pointer.
 *
 * Only `mouseenter`/`mouseleave`, never `mouseover` — the difference matters,
 * because `mouseover` fires again for every descendant.
 *
 * **It lives in `internal/`, not `hooks/`.** Upstream's file sits in `hooks/`
 * but `hooks/index.ts` does not export it, and neither does the package root —
 * so publishing it from our `./hooks` subpath would invent public API.
 *
 * Four translations:
 *
 * - **Options come in as a getter**, read at event time. Upstream's six
 *   `useCallback` dependency lists exist only to keep those closures current; a
 *   getter is current by construction.
 * - **The five refs are plain `let`s.** `showTimer`, `hideTimer`, `hoverMode`,
 *   `skipNextEnter` and `prevIsOpen` are all values that must survive a render
 *   without causing one — which is what a non-reactive binding already is here.
 * - **A sixth ref is dropped outright, along with its public setter.** Upstream
 *   returns `setTriggerEl`, which writes `triggerElRef` — and nothing in the hook
 *   ever reads it, so the three consumers that merge it into their trigger refs
 *   achieve nothing. Dropped rather than transcribed, as `SideNavHeading`'s and
 *   `TopNavHeading`'s equally dead `rootRef` is. The return type is therefore one
 *   member short of upstream's, deliberately.
 * - **`listRef` becomes `attachMenu`**, `useListFocus`'s attachment.
 * - **The `isEnabled` bail returns no-ops but the *same* menu attachment and
 *   `focusFirst`.** Upstream does this too (it calls `useListFocus`
 *   unconditionally and swaps only the handlers), which is what lets
 *   `SideNavHeading` call the hook with `isEnabled: !!menu` at the top level and
 *   still hand a working `attachMenu` to a menu that appears later.
 *
 * The one place upstream's shape could not survive verbatim is the
 * close-resets-hover-mode rule. React writes it as a during-render comparison
 * against `prevIsOpenRef`; Svelte has no render pass to hang that on, so it is
 * folded into the same getter reads the handlers already do — `syncHoverMode()`
 * runs at the top of every handler, and `hoverMode` is *read* only in
 * `handleMouseLeave`, so for any sequence where the open state changes through
 * this hook's own handlers the two reach the same state. The reset is idempotent
 * and `prevIsOpen` is reassigned on every call, so it can neither be
 * double-consumed nor fire twice for one transition.
 *
 * The gap it leaves is narrow and reachable exactly once: upstream resets on
 * *every* `true → false` transition because it re-renders on every one, whereas
 * this misses a close if a **reopen lands between two handler calls**. That needs
 * both edges to happen outside a handler — `handleMouseEnter` arms `showTimer`
 * while the layer is already open, the browser light-dismisses it inside that
 * window, and the pending timer reopens it. `hoverMode` is then `true` here and
 * `false` upstream, so the next `mouseleave` schedules a hide here and is ignored
 * upstream. Left as-is: the window is at most `showDelay` wide and closing on
 * mouseleave is the better of the two outcomes. Same "a one-shot flag assumes
 * exactly one intervening event" family as `useHoverCard`'s `isEscapeDismissing`,
 * which TODO.md already records.
 */

export interface UseMenuHoverOptions {
	show: (options?: { skipAutoFocus?: boolean }) => void;
	hide: () => void;
	isOpen: boolean;
	isEnabled: boolean;
	/** @default 150 */
	showDelay?: number;
	/** @default 200 */
	hideDelay?: number;
}

export interface UseMenuHoverReturn {
	/** Handlers for the trigger element. */
	readonly triggerProps: {
		onclick: () => void;
		onmouseenter: () => void;
		onmouseleave: () => void;
	};
	/** Handlers for the popover content element. */
	readonly contentProps: {
		onmouseenter: () => void;
		onmouseleave: () => void;
		onkeydown: (event: KeyboardEvent) => void;
	};
	/** Attach to the `role="menu"` container. Upstream's `menuRef`. */
	readonly attachMenu: Attachment<HTMLElement>;
	/** Focus the first enabled menu item. */
	focusFirst: () => boolean;
}

export function useMenuHover(options: () => UseMenuHoverOptions): UseMenuHoverReturn {
	const hasHover = useMediaQuery(() => '(hover: hover)');

	let showTimer: ReturnType<typeof setTimeout> | null = null;
	let hideTimer: ReturnType<typeof setTimeout> | null = null;
	// Whether the menu was opened/interacted via hover (enables mouseleave-to-close)
	let hoverMode = false;
	// One-shot: skip the next mouseenter after click-to-close
	let skipNextEnter = false;
	let prevIsOpen = options().isOpen;

	function clearTimeouts(): void {
		if (showTimer) {
			clearTimeout(showTimer);
			showTimer = null;
		}
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = null;
		}
	}

	// Upstream's during-render `if (prevIsOpenRef.current && !isOpen)`. Any close,
	// for any reason, leaves hover mode — so a menu dismissed by Escape does not
	// close a second time when the pointer eventually leaves.
	function syncHoverMode(): void {
		const isOpen = options().isOpen;
		if (prevIsOpen && !isOpen) {
			hoverMode = false;
		}
		prevIsOpen = isOpen;
	}

	const list = useListFocus(() => ({
		onEscape: () => {
			clearTimeouts();
			options().hide();
		}
	}));

	$effect(() => () => clearTimeouts());

	// Click: always toggle.
	function handleClick(): void {
		syncHoverMode();
		clearTimeouts();
		if (options().isOpen) {
			skipNextEnter = true;
			options().hide();
		} else {
			skipNextEnter = false;
			options().show();
			requestAnimationFrame(() => list.focusFirst());
		}
	}

	// Hover: mouseenter activates hover mode and opens.
	function handleMouseEnter(): void {
		syncHoverMode();
		if (!hasHover.matches) {
			return;
		}
		if (skipNextEnter) {
			skipNextEnter = false;
			return;
		}
		hoverMode = true;
		clearTimeouts();
		const showDelay = options().showDelay ?? 150;
		if (showDelay > 0) {
			showTimer = setTimeout(() => {
				options().show({ skipAutoFocus: true });
			}, showDelay);
		} else {
			options().show({ skipAutoFocus: true });
		}
	}

	// Hover: mouseleave only closes if in hover mode.
	function handleMouseLeave(): void {
		syncHoverMode();
		if (!hoverMode) {
			return;
		}
		clearTimeouts();
		hideTimer = setTimeout(() => {
			options().hide();
		}, options().hideDelay ?? 200);
	}

	// Content: mouseenter cancels a pending hide.
	function handleContentMouseEnter(): void {
		syncHoverMode();
		clearTimeouts();
	}

	function noop(): void {}

	const enabledTriggerProps = {
		onclick: handleClick,
		onmouseenter: handleMouseEnter,
		onmouseleave: handleMouseLeave
	};
	const disabledTriggerProps = {
		onclick: noop,
		onmouseenter: noop,
		onmouseleave: noop
	};
	const enabledContentProps = {
		onmouseenter: handleContentMouseEnter,
		onmouseleave: handleMouseLeave,
		onkeydown: list.handleKeyDown
	};
	const disabledContentProps = {
		onmouseenter: noop,
		onmouseleave: noop,
		onkeydown: noop
	};

	return {
		get triggerProps() {
			return options().isEnabled ? enabledTriggerProps : disabledTriggerProps;
		},
		get contentProps() {
			return options().isEnabled ? enabledContentProps : disabledContentProps;
		},
		get attachMenu() {
			return list.attachList;
		},
		focusFirst: () => list.focusFirst()
	};
}
