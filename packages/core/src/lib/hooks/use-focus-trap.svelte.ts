import type { Attachment } from 'svelte/attachments';
import { FOCUSABLE_SELECTOR } from '../internal/focusable-selector.js';
import { useLayerDismissal } from '../components/layer/use-layer-dismissal.svelte.js';

/**
 * Focus trapping, ported from Astryx's `hooks/useFocusTrap.ts`.
 *
 * Implements the WAI-ARIA dialog pattern: focus that escapes the container via
 * the keyboard is pulled back, Tab and Shift+Tab wrap at the boundaries, and
 * focus returns to whatever was focused before the trap opened. All of that is
 * DOM work and transcribes unchanged, including the two coordination details
 * that are easy to lose — the shared Escape stack, so a popover inside a Dialog
 * does not close both on one press, and the IME guard, so a CJK user cancelling
 * a composition does not dismiss the overlay under it.
 *
 * Two translations:
 *
 * Upstream returns a `RefObject` for the consumer to attach with `ref=`. Svelte
 * has no ref objects, so the hook hands back an **attachment** instead —
 * ownership stays with the hook either way.
 *
 * Upstream's three effects are keyed `[isActive]`, `[isActive]` and
 * `[isActive, onEscape]`. Reading `options()` inside an effect would track every
 * source the getter touches, so those two values go through `$derived` first: a
 * derived only notifies dependents when its **value** changes, which is exactly
 * what a dependency list means.
 */

/**
 * How many Escape-dismissible focus traps are currently active.
 *
 * This used to be a whole parallel registry: a module-level stack of trap
 * handlers, with its own document-level `keydown` listener and its own
 * DOM-containment rule for resolving the top-most trap. Upstream 0.5.0 deleted
 * that — the trap now registers on the shared layer dismissal stack like every
 * other family, and one press dismisses exactly one layer whether the layers
 * above and below it trap focus or not.
 *
 * What survives is this count, and upstream keeps it deliberately. It is driven
 * by the *same expression* that registers the trap on the stack, so the two can
 * never disagree about whether a trap is active, and it answers about focus
 * traps alone — which is the whole contract of `hasActiveFocusTrapEscape`
 * below.
 */
let activeEscapeTrapCount = 0;

/**
 * Whether an Escape-dismissible focus trap is currently active — a Popover,
 * menu or other trapped layer that would take an Escape press.
 *
 * Public API, exported from the hooks barrel as upstream's is. Its answer must
 * stay about focus traps *alone*: `BottomSheetSwitcher` gates its own dismissal
 * on it, so a shim that also counted tooltips, hover cards and dialogs would
 * tell the sheet a trap is above it when none is, and the sheet would stop
 * closing. The sheet is now the **only** consumer, here and upstream —
 * `Dialog` used to consult it to defer to a popover layered on top of it, and
 * 0.5.0 deleted that: the ordering it approximated comes from the stack's depth
 * key now, and the approximation was strictly wrong for a dialog over a dialog,
 * since it can only see layers that trap focus.
 * `tests/focus-trap-escape-shim.svelte.test.ts` is the guard on that meaning.
 *
 * What it reads is `activeEscapeTrapCount` above, incremented from the same
 * expression that registers this trap on the shared dismissal stack. Reading
 * the stack itself would be wrong now that it is shared: it carries tooltips,
 * hover cards and dialogs, none of which trap focus, and the sheet would stop
 * closing the moment one of them was open above it.
 *
 * @deprecated Upstream 0.5.0 moved Escape coordination off the focus trap and
 *   onto one shared stack (`useLayerDismissal`), which routes each press to the
 *   top-most layer; a layer that wants that ordering should join the stack
 *   rather than ask whether a trap exists. The trap itself now does exactly
 *   that, so the redirect is live here and not merely transcribed.
 */
export function hasActiveFocusTrapEscape(): boolean {
	return activeEscapeTrapCount > 0;
}

/**
 * Whether an element is currently perceivable/focusable — excludes ones hidden
 * via `display:none`/`visibility:hidden` or inside an `inert`/`hidden` subtree,
 * which the browser skips for Tab, and ones inside an `aria-hidden="true"`
 * subtree, which sighted-keyboard users could Tab to while AT skips them
 * (WCAG 4.1.2 — focusable content must be exposed to assistive tech).
 */
function isVisiblyFocusable(el: HTMLElement): boolean {
	if (el.hasAttribute('inert') || el.closest('[inert]')) {
		return false;
	}
	if (el.hidden || el.closest('[hidden]')) {
		return false;
	}
	// closest() matches the element itself as well as any ancestor.
	if (el.closest('[aria-hidden="true"]')) {
		return false;
	}
	// offsetParent is null for display:none (and fixed elements); pair with a
	// visibility check via getComputedStyle when available.
	if (typeof window !== 'undefined' && window.getComputedStyle) {
		const style = window.getComputedStyle(el);
		if (style.visibility === 'hidden' || style.display === 'none') {
			return false;
		}
	}
	return true;
}

/** Get all focusable elements within a container. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
		isVisiblyFocusable
	);
}

/** Attempt to focus an element. Returns true if focus was successful. */
function attemptFocus(element: HTMLElement): boolean {
	try {
		element.focus();
	} catch {
		// Some elements may throw on focus
	}
	return document.activeElement === element;
}

/**
 * Focus the first focusable descendant of a container.
 * Returns true if a focusable element was found and focused.
 */
function focusFirstDescendant(container: HTMLElement): boolean {
	const focusable = getFocusableElements(container);
	for (const element of focusable) {
		if (attemptFocus(element)) {
			return true;
		}
	}
	return false;
}

/**
 * Focus the last focusable descendant of a container.
 * Returns true if a focusable element was found and focused.
 */
function focusLastDescendant(container: HTMLElement): boolean {
	const focusable = getFocusableElements(container);
	for (let i = focusable.length - 1; i >= 0; i--) {
		if (attemptFocus(focusable[i])) {
			return true;
		}
	}
	return false;
}

/** Configuration for focus trap behavior */
export interface UseFocusTrapOptions {
	/** Whether the focus trap is currently active. */
	isActive: boolean;

	/** Callback when Escape key is pressed. */
	onEscape?: () => void;
}

/** Return type for useFocusTrap */
export interface UseFocusTrapReturn {
	/** Attach to the container element that should trap focus. */
	readonly attachContainer: Attachment<HTMLElement>;

	/** Focus the first focusable element in the container. */
	focusFirst: () => void;
}

/**
 * Traps focus within a container element.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let isOpen = $state(false);
 *   const trap = useFocusTrap(() => ({ isActive: isOpen, onEscape: () => (isOpen = false) }));
 *   $effect(() => { if (isOpen) trap.focusFirst(); });
 * </script>
 *
 * <div {@attach trap.attachContainer}>
 *   <button>First</button>
 *   <button>Last</button>
 * </div>
 * ```
 */
export function useFocusTrap(options: () => UseFocusTrapOptions): UseFocusTrapReturn {
	const isActive = $derived(options().isActive);
	const onEscape = $derived(options().onEscape);

	// Upstream's refs. `container` is deliberately *not* cleared when the
	// attachment detaches: the restore path below needs the element the trap was
	// built around even after it has been unmounted, which is what upstream's
	// "snapshot the container now" comment is protecting. Nothing can reach a
	// stale element anyway — every listener is torn down with the trap.
	let container: HTMLElement | null = null;
	let lastFocus: Element | null = null;
	// Track if focus change was triggered by keyboard (Tab key)
	let isKeyboardNavigation = false;

	const attachContainer: Attachment<HTMLElement> = (element) => {
		container = element;
	};

	/**
	 * One expression drives both the stack registration and the deprecated
	 * `hasActiveFocusTrapEscape` count, exactly as upstream does, so the two can
	 * never disagree about whether this trap is active. A trap with no `onEscape`
	 * is not dismissible: it stays off the stack entirely and a press flows past
	 * it to whatever is underneath.
	 */
	const isEscapeTrap = $derived(isActive && onEscape != null);

	useLayerDismissal(() => ({
		isActive: isEscapeTrap,
		onDismiss: () => {
			onEscape?.();
		},
		// The trap renders nothing, so it cannot push a depth provider around its
		// content; hand the stack the container instead, so two DOM-nested traps
		// still resolve in the right order.
		getContainer: () => container
	}));

	$effect(() => {
		if (!isEscapeTrap) {
			return;
		}
		activeEscapeTrapCount += 1;
		return () => {
			activeEscapeTrapCount -= 1;
		};
	});

	/** Focus the first focusable element. */
	function focusFirst(): void {
		if (container) {
			focusFirstDescendant(container);
		}
	}

	/**
	 * Capture the element focused before the trap activated, and restore focus to
	 * it when the trap deactivates (or the component unmounts). Overlays are
	 * opened imperatively (e.g. `showPopover()`), so the browser's declarative
	 * popover focus restoration does not apply — without this, closing a Popover
	 * via Escape or light dismiss drops keyboard focus to `<body>`.
	 *
	 * The restore is guarded so it never steals focus a consumer moved on
	 * purpose: it only runs when focus would otherwise be lost — i.e. the active
	 * element is nothing, the document body/root, or still inside the (possibly
	 * now-unmounted) trap container. If focus already moved to some other element
	 * outside the trap (the user clicked elsewhere, or a consumer such as
	 * DropdownMenu already refocused its trigger), the restore is a no-op.
	 */
	$effect(() => {
		if (!isActive) {
			return;
		}

		const previouslyFocused = document.activeElement as HTMLElement | null;

		return () => {
			const active = document.activeElement;
			const focusWasLost =
				active == null ||
				active === document.body ||
				active === document.documentElement ||
				(container != null && container.contains(active));

			if (!focusWasLost) {
				return;
			}

			if (
				previouslyFocused != null &&
				previouslyFocused.isConnected &&
				typeof previouslyFocused.focus === 'function'
			) {
				previouslyFocused.focus();
			}
		};
	});

	/**
	 * Handle focus events - redirect focus back into container if it escapes.
	 * Only redirects for keyboard navigation, not mouse clicks.
	 */
	$effect(() => {
		if (!isActive) {
			return;
		}

		const handleFocus = (event: FocusEvent) => {
			if (!container) {
				return;
			}

			const target = event.target as Node;

			if (container.contains(target)) {
				// Focus is inside the container - track it
				lastFocus = target as Element;
			} else if (isKeyboardNavigation) {
				// Focus escaped via keyboard - redirect it back
				const focusedFirst = focusFirstDescendant(container);

				// If we're back at the same element (Shift+Tab from first element),
				// try focusing the last element instead
				if (focusedFirst && lastFocus === document.activeElement) {
					focusLastDescendant(container);
				} else if (
					!focusedFirst &&
					lastFocus instanceof HTMLElement &&
					container.contains(lastFocus)
				) {
					// A modal surface may intentionally have no tabbable controls and
					// place initial focus on a tabindex={-1} heading or panel. Preserve
					// that programmatic focus target instead of letting Tab escape.
					attemptFocus(lastFocus);
				}

				lastFocus = document.activeElement;
			}
			// If focus escaped via mouse click, don't redirect - let light dismiss handle it

			// Reset keyboard navigation flag
			isKeyboardNavigation = false;
		};

		// Use capture phase to intercept focus before it settles
		document.addEventListener('focus', handleFocus, true);

		return () => {
			document.removeEventListener('focus', handleFocus, true);
		};
	});

	/**
	 * Handle Tab to wrap focus at the trap's boundaries, and track that keyboard
	 * navigation is occurring. Escape belongs to the shared dismissal stack.
	 */
	$effect(() => {
		if (!isActive) {
			return;
		}

		// Escape is not handled here any more: the trap registers on the shared
		// dismissal stack above, which owns the single document-level listener and
		// routes each press to the top-most layer. What is left is Tab wrapping.
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!container) {
				return;
			}

			if (event.key === 'Tab') {
				// Mark that keyboard navigation is happening
				isKeyboardNavigation = true;

				const focusable = getFocusableElements(container);
				if (focusable.length === 0) {
					// There is nowhere to advance to. Keep focus on the current
					// programmatic target (for example a dialog panel with tabindex=-1)
					// rather than allowing the browser to move into background content.
					event.preventDefault();
					const active = document.activeElement;
					if (active instanceof HTMLElement && container.contains(active)) {
						lastFocus = active;
					}
					isKeyboardNavigation = false;
					return;
				}

				const first = focusable[0];
				const last = focusable[focusable.length - 1];

				if (event.shiftKey) {
					// Shift+Tab: if on first element, wrap to last
					if (document.activeElement === first) {
						event.preventDefault();
						last.focus();
					}
				} else {
					// Tab: if on last element, wrap to first
					if (document.activeElement === last) {
						event.preventDefault();
						first.focus();
					}
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	return {
		attachContainer,
		focusFirst
	};
}
