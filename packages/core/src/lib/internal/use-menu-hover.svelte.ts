import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { useListFocus } from '../hooks/use-list-focus.svelte.js';
import { useMediaQuery } from '../hooks/use-media-query.svelte.js';

/**
 * Ported from Astryx's `hooks/useMenuHover.ts`.
 *
 * Hover as a progressive enhancement over standard popover behaviour, shared by
 * `SideNavHeading`, `SideNavItem`, `TopNavHeading`, `TopNavMenu`,
 * `TopNavMegaMenu` and `DropdownMenuSubMenu`: click toggles, Escape and
 * outside-click close, arrows navigate; on top of that, mouseenter opens after a
 * delay and mouseleave closes one that hover opened.
 *
 * Three upstream behaviours are not obvious and are load-bearing:
 *
 * 1. **Hover→click guard (#3121).** A hover-opened menu is already open under
 *    the cursor when the pointer arrives, so the click that naturally follows
 *    would toggle it shut. Within `clickGuardMs` a click instead *confirms* it:
 *    the menu pins and behaves like a click-open from then on.
 * 2. **Focus moves synchronously.** `show()` calls `showPopover()` in the same
 *    tick and the layer's children are always mounted, so items are focusable
 *    the moment `show()` returns — a `requestAnimationFrame` here lands after
 *    paint and races anything else moving focus. Hover-opens are the exception:
 *    the pointer is driving, so focus stays on the trigger. The hook always
 *    passes `skipAutoFocus` and owns focus itself, because the popover's
 *    auto-focus targets the first *tabbable* node while a menu wants its first
 *    item — under roving tabindex those are different elements.
 * 3. **Native light dismiss.** A `popover="auto"` is dismissed by the browser on
 *    pointer interaction outside the panel, and a trigger outside the panel
 *    counts — before our click handler runs. `popoverId` makes the trigger the
 *    panel's invoker, which exempts it. jsdom implements neither light dismiss
 *    nor invokers, so that wiring is only verifiable in a browser.
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
 * - **Options come in as a getter**, read at event time. Upstream's `useCallback`
 *   dependency lists exist only to keep those closures current; a getter is
 *   current by construction.
 * - **The refs are plain `let`s.** `showTimer`, `hideTimer`, `hoverMode`,
 *   `closedAt`, `hoverOpenedAt` and `triggerEl` are all values that must survive
 *   a render without causing one — which is what a non-reactive binding already
 *   is here.
 * - **`listRef` becomes `attachMenu` and `setTriggerEl` becomes `attachTrigger`**,
 *   because Svelte has no ref objects. `attachMenu` wraps `useListFocus`'s own
 *   attachment so this hook can also read the container: `focusMenu` focuses it
 *   when the menu is empty, and `close` has to know whether focus was inside it
 *   before hiding.
 * - **The `isEnabled` bail returns no-ops but the *same* menu attachment,
 *   `focusFirst`, `focusMenu`, `confirmHoverOpen` and `close`.** Upstream does
 *   this too (it calls `useListFocus` unconditionally and swaps only the
 *   handlers), which is what lets `SideNavHeading` call the hook with
 *   `isEnabled: !!menu` at the top level and still hand a working `attachMenu` to
 *   a menu that appears later.
 *
 * The close observer is the one place React's shape could not be transcribed.
 * Upstream catches every close — whatever caused it — in a layout effect keyed on
 * `isOpen`, and **it must be a real observer here too**: `closedAt` is a
 * *timestamp*, so stamping it lazily at the top of the next handler (which is
 * what this hook did while the flag was a one-shot boolean) would record the time
 * of the re-hover rather than the time of the close, and suppress a deliberate
 * re-hover that arrived long after the window should have expired. `$effect` is
 * the analogue that lands after the DOM update and before the browser hit-tests
 * the vanished panel and fires the mouseenter `REOPEN_SUPPRESS_MS` exists to
 * swallow. `isOpen` is narrowed through a `$derived` for the same reason
 * `useListFocus`'s `hasRovingTabIndex` is — a derived notifies only when its
 * *value* changes, which is what a dependency list means.
 */

const DEFAULT_CLICK_GUARD_MS = 500;

/**
 * How long after a close a mouseenter on the trigger is ignored.
 *
 * A panel positioned over its own trigger puts that trigger back under a
 * stationary pointer when it closes, and the browser fires a fresh mouseenter —
 * which reopened the menu the user had just dismissed. Time-bounded rather than
 * a one-shot flag, so a deliberate re-hover seconds later still opens; a real
 * mouseleave clears it early.
 */
const REOPEN_SUPPRESS_MS = 300;

export interface UseMenuHoverOptions {
	show: (options?: { skipAutoFocus?: boolean }) => void;
	hide: () => void;
	isOpen: boolean;
	isEnabled: boolean;
	/** Delay before a hover opens the menu (ms). @default 150 */
	showDelay?: number;
	/** Delay before leaving the trigger or menu closes it (ms). @default 200 */
	hideDelay?: number;
	/**
	 * Window after a hover-open in which a click confirms the menu instead of
	 * closing it. 0 opts out, making every click toggle. @default 500
	 */
	clickGuardMs?: number;
	/**
	 * Selector for the menu's focusable items, forwarded to `useListFocus`. A
	 * panel of links (a mega menu) needs an override; `role="menuitem"` rows do
	 * not. @default '[role="menuitem"]'
	 */
	itemSelector?: string;
	/**
	 * The popup's DOM id (`usePopover().id`). Supply it when the popup is a
	 * native `popover="auto"` and the trigger sits outside it; omit it for
	 * `popover="manual"` popups and triggers inside the panel.
	 */
	popoverId?: string;
	/**
	 * Whether the hook moves focus on a click or keyboard open. False for
	 * consumers that wire the pointer half only and leave focus to the popover's
	 * own trap — a panel that is a dialog rather than a menu (`SideNavItem`'s
	 * collapsed flyout) has no items for the hook to focus. @default true
	 */
	ownsFocus?: boolean;
}

export interface UseMenuHoverReturn {
	/** Handlers for the trigger element. */
	readonly triggerProps: {
		onclick: (event?: MouseEvent) => void;
		onmouseenter: () => void;
		onmouseleave: () => void;
		/** Present only when `popoverId` is supplied. */
		popovertarget?: string;
	};
	/** Handlers for the popover content element. */
	readonly contentProps: {
		onmouseenter: () => void;
		onmouseleave: () => void;
		onkeydown: (event: KeyboardEvent) => void;
	};
	/** Attach to the `role="menu"` container. Upstream's `menuRef`. */
	readonly attachMenu: Attachment<HTMLElement>;
	/** Attach to the trigger element. Upstream's `setTriggerEl`. */
	readonly attachTrigger: Attachment<HTMLElement>;
	/** Focus the first enabled item. Returns false when there was none. */
	focusFirst: () => boolean;
	/**
	 * Focus the first enabled item, falling back to the menu container when the
	 * menu is empty or still loading.
	 */
	focusMenu: () => void;
	/**
	 * For consumers with their own click handler: call this in the open branch.
	 * Returns `true` when the click was the one following a hover-open — the menu
	 * is now pinned and the click must NOT be treated as a dismissal.
	 */
	confirmHoverOpen: () => boolean;
	/**
	 * Close, restoring focus to the trigger. For dismiss affordances rendered
	 * inside the popup, which are close buttons rather than the trigger and so
	 * must not carry its toggle and keyboard-activation semantics.
	 */
	close: () => void;
}

export function useMenuHover(options: () => UseMenuHoverOptions): UseMenuHoverReturn {
	const hasHover = useMediaQuery(() => '(hover: hover)');

	// The one option read reactively: the close observer below is keyed on it.
	const isOpen = $derived(options().isOpen);

	let showTimer: ReturnType<typeof setTimeout> | null = null;
	let hideTimer: ReturnType<typeof setTimeout> | null = null;
	let triggerEl: HTMLElement | null = null;
	let menuEl: HTMLElement | null = null;
	/** Menu was hover-opened, so mouseleave may close it. */
	let hoverMode = false;
	let closedAt = 0;
	/** When the current open began as a hover-open; 0 once confirmed or closed. */
	let hoverOpenedAt = 0;
	let prevIsOpen = untrack(() => isOpen);

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

	// Catches every close, whatever caused it — a menu dismissed by Escape or by
	// light dismiss must leave hover mode exactly as a click-close does.
	$effect(() => {
		const open = isOpen;
		untrack(() => {
			const wasOpen = prevIsOpen;
			prevIsOpen = open;
			if (wasOpen && !open) {
				hoverMode = false;
				hoverOpenedAt = 0;
				closedAt = Date.now();
			}
		});
	});

	const list = useListFocus(() => ({
		itemSelector: options().itemSelector,
		onEscape: () => {
			clearTimeouts();
			hideAndRestoreFocus();
		}
	}));

	$effect(() => () => clearTimeouts());

	const attachMenu: Attachment<HTMLElement> = (element) => {
		menuEl = element;
		const cleanupList = untrack(() => list.attachList(element));
		return () => {
			cleanupList?.();
			menuEl = null;
		};
	};

	const attachTrigger: Attachment<HTMLElement> = (element) => {
		triggerEl = element;
		return () => {
			triggerEl = null;
		};
	};

	function hideAndRestoreFocus(): void {
		// Read before hiding: closing the layer moves focus itself.
		const menuHadFocus = menuEl?.contains(document.activeElement) ?? false;
		options().hide();
		if (menuHadFocus) {
			triggerEl?.focus();
		}
	}

	function focusMenu(): void {
		// An empty or still-loading menu has no focusable item; focus the container
		// so keyboard ownership still transfers off the trigger's list.
		if (!list.focusFirst()) {
			menuEl?.focus();
		}
	}

	function openAndFocus(): void {
		if (!(options().ownsFocus ?? true)) {
			options().show();
			return;
		}
		options().show({ skipAutoFocus: true });
		focusMenu();
	}

	function confirmHoverOpen(): boolean {
		const clickGuardMs = options().clickGuardMs ?? DEFAULT_CLICK_GUARD_MS;
		const isConfirming =
			clickGuardMs > 0 && hoverOpenedAt > 0 && Date.now() - hoverOpenedAt < clickGuardMs;
		if (!isConfirming) {
			return false;
		}
		hoverMode = false;
		hoverOpenedAt = 0;
		return true;
	}

	function handleClick(event?: MouseEvent): void {
		const { popoverId, ownsFocus = true } = options();

		// Cancel the invoker's default toggle so this handler stays the single
		// source of truth; popovertarget still exempts the trigger from dismissal.
		if (popoverId) {
			event?.preventDefault();
		}
		clearTimeouts();

		// Enter/Space arrive as a click with detail 0, and always open. A keyboard
		// user reaches the trigger of an open menu only because a hover-open left
		// focus behind; closing there would strand them outside a visible menu.
		const isKeyboardActivation = event != null && event.detail === 0;
		if (isKeyboardActivation) {
			closedAt = 0;
			hoverMode = false;
			hoverOpenedAt = 0;
			if (options().isOpen) {
				if (ownsFocus) {
					focusMenu();
				}
			} else {
				openAndFocus();
			}
			return;
		}

		if (!options().isOpen) {
			closedAt = 0;
			hoverMode = false;
			hoverOpenedAt = 0;
			openAndFocus();
			return;
		}

		if (confirmHoverOpen()) {
			if (ownsFocus) {
				focusMenu();
			}
			return;
		}

		hideAndRestoreFocus();
	}

	function handleMouseEnter(): void {
		if (!hasHover.matches) {
			return;
		}
		if (closedAt > 0 && Date.now() - closedAt < REOPEN_SUPPRESS_MS) {
			return;
		}
		// Re-entering an open menu's trigger must not un-pin it or re-arm the
		// guard, which would make the next deliberate click another "confirm" and
		// leave the menu undismissable.
		if (options().isOpen) {
			clearTimeouts();
			return;
		}
		hoverMode = true;
		clearTimeouts();
		const openByHover = () => {
			hoverOpenedAt = Date.now();
			options().show({ skipAutoFocus: true });
		};
		const showDelay = options().showDelay ?? 150;
		if (showDelay > 0) {
			showTimer = setTimeout(openByHover, showDelay);
		} else {
			openByHover();
		}
	}

	function handleMouseLeave(): void {
		// A real leave ends the stationary-pointer case the suppression window
		// exists for, so the next enter is deliberate whenever it arrives.
		closedAt = 0;
		if (!hoverMode) {
			return;
		}
		clearTimeouts();
		hideTimer = setTimeout(() => {
			options().hide();
		}, options().hideDelay ?? 200);
	}

	function handleContentMouseEnter(): void {
		clearTimeouts();
	}

	function noop(): void {}

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
	const disabledTriggerProps = {
		onclick: noop,
		onmouseenter: noop,
		onmouseleave: noop
	};

	return {
		get triggerProps() {
			if (!options().isEnabled) {
				return disabledTriggerProps;
			}
			const { popoverId } = options();
			return {
				onclick: handleClick,
				onmouseenter: handleMouseEnter,
				onmouseleave: handleMouseLeave,
				...(popoverId ? { popovertarget: popoverId } : null)
			};
		},
		get contentProps() {
			return options().isEnabled ? enabledContentProps : disabledContentProps;
		},
		get attachMenu() {
			return attachMenu;
		},
		get attachTrigger() {
			return options().isEnabled ? attachTrigger : () => {};
		},
		focusFirst: () => list.focusFirst(),
		focusMenu,
		confirmHoverOpen,
		close: hideAndRestoreFocus
	};
}
