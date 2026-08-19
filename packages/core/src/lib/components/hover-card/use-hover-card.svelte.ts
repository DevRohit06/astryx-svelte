import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { StyleArg } from '../../internal/sx.js';
import {
	useLayer,
	type ContextLayerReturn,
	type LayerAlignment,
	type LayerPlacement
} from '../layer/use-layer.svelte.js';
import { hoverCardSurfaceXstyle } from './use-hover-card.stylex.js';

/**
 * Hover/focus-triggered hover cards, ported from Astryx's
 * `HoverCard/useHoverCard.tsx`.
 *
 * Like `useTooltip` it is timing over `useLayer`, so the native Popover API,
 * CSS anchor positioning and RTL mirroring all arrive already solved. What
 * distinguishes a hover card from a tooltip is that its *content* is
 * interactive: the pointer and the keyboard can both move into the card, so the
 * hook owns four handlers for the content surface as well as five for the
 * trigger, and a hide scheduled while the pointer is over the card is dropped
 * rather than honoured.
 *
 * The translations are the ones this port has already made:
 *
 * **`renderHoverCard` is gone; `<HoverCardLayer>` replaces it.** A Svelte hook
 * cannot return markup, so the render function becomes a component and the hook
 * hands it what upstream's closure captured — the `layer`, the resolved
 * `placement`/`alignment`, the surface `xstyle`, and the four content-surface
 * handlers. Those four are private upstream only because `renderHoverCard`
 * owned the element they bind to; here the component does.
 *
 * **The three refs become three attachments.** `ref`/`positionRef`/
 * `interactionRef` map onto `attachTrigger`/`attachPosition`/
 * `attachInteraction`, which deletes upstream's "remove the listeners I put on
 * the element I am leaving" block — an attachment has the cleanup phase a ref
 * callback lacks.
 *
 * **`triggerRef` survives that deletion, unlike `Tooltip`'s.** It is not only
 * listener bookkeeping here: the Escape-from-content path calls
 * `trigger.focus()` and the content's blur check asks `trigger.contains(...)`,
 * so the element itself has to be readable. It is a plain `let` — nothing
 * renders from it — assigned on attach and nulled on detach.
 *
 * **The id is passed in**, as `useLayer` requires; see that module for why.
 *
 * **Every option is read at use time through the getter**, which is what
 * upstream's eleven `useCallback` dependency arrays buy.
 *
 * Note there is deliberately **no hover-bridge constant** here. `useTooltip`
 * substitutes a 100ms grace period when `hideDelay` is 0 so the pointer can
 * cross the gap; a hover card's default `hideDelay` is 200 and its stay-open
 * behaviour is handled by `isHoveringContent` instead, so upstream uses
 * `hideDelay` raw and so does this.
 */

/**
 * Focus trigger behavior for hover cards
 */
export type HoverCardFocusTrigger = 'auto' | 'always' | 'never';

export interface HoverCardOptions {
	/**
	 * SSR-stable unique id for the hover card layer — the `aria-describedby`
	 * target the trigger points at. Pass `$props.id()` from the calling
	 * component; see `useLayer` for why the hook cannot mint it itself.
	 */
	id: string;

	/**
	 * Position placement relative to anchor
	 * @default 'above'
	 */
	placement?: LayerPlacement;

	/**
	 * Alignment along the placement axis
	 * @default 'center'
	 */
	alignment?: LayerAlignment;

	/**
	 * Delay before showing on hover (ms)
	 * @default 300
	 */
	delay?: number;

	/**
	 * Delay before hiding after mouse/focus leave (ms)
	 * @default 200
	 */
	hideDelay?: number;

	/**
	 * When to trigger on focus:
	 * - `auto`: Only if element is naturally focusable
	 * - `always`: Always attach focus listeners
	 * - `never`: Never attach focus listeners (for composite widgets)
	 *
	 * @default 'auto'
	 */
	focusTrigger?: HoverCardFocusTrigger;

	/**
	 * Whether the hover card is enabled.
	 * When false, hover/focus triggers are disabled.
	 *
	 * @default true
	 */
	isEnabled?: boolean;

	/**
	 * Accessible name for the hover card popup.
	 *
	 * When provided, the popup is exposed to assistive technology as a named
	 * `role="dialog"`. When omitted, the popup falls back to `role="group"` —
	 * a group may validly be unnamed, an unnamed dialog may not, and hover cards
	 * are non-modal, so group is honest semantics without a name.
	 */
	label?: string;

	/**
	 * Controlled open state. When provided, overrides hover/focus triggers:
	 * - `true`: force-show the hover card (hover/focus hide is suppressed)
	 * - `false`: force-hide the hover card
	 * - `undefined`: uncontrolled — hover/focus triggers manage visibility
	 */
	isOpen?: boolean;

	/**
	 * Whether the hover card should be shown on mount.
	 * The hover card is still dismissible — this just opens it initially.
	 */
	isDefaultOpen?: boolean;

	/** Callback fired when hover card is shown. */
	onShow?: () => void;

	/** Callback fired when hover card is hidden. */
	onHide?: () => void;
}

export interface HoverCardReturn {
	/**
	 * Combined attachment that sets both position and interaction on the same
	 * element. Shorthand for applying both `attachPosition` and
	 * `attachInteraction`. Upstream's `ref`.
	 */
	readonly attachTrigger: Attachment<HTMLElement>;

	/**
	 * Attachment for the positioning anchor element. Injects the anchor name for
	 * CSS anchor positioning. Upstream's `positionRef`.
	 */
	readonly attachPosition: Attachment<HTMLElement>;

	/**
	 * Attachment for the interaction element. Binds the hover/focus listeners.
	 * Can be the same element as `attachPosition` or a different one. Upstream's
	 * `interactionRef`.
	 */
	readonly attachInteraction: Attachment<HTMLElement>;

	/**
	 * The CSS anchor name to use for positioning.
	 * Use this when you need to set anchorName manually (e.g. a `display:contents`
	 * wrapper).
	 */
	readonly anchorId: string;

	/**
	 * ID for `aria-describedby` on the trigger element.
	 * Caller should compose with other IDs.
	 */
	readonly describedBy: string;

	/**
	 * The underlying layer. `<HoverCardLayer>` hands it to `<Layer>`; upstream's
	 * `renderHoverCard` closes over the same value.
	 */
	readonly layer: ContextLayerReturn;

	/** Resolved placement — the default `<HoverCardLayer>` renders at. */
	readonly placement: LayerPlacement;

	/** Resolved alignment — the default `<HoverCardLayer>` renders at. */
	readonly alignment: LayerAlignment;

	/** The surface `xstyle` — upstream's `popoverXstyle`. */
	readonly xstyle: StyleArg;

	/**
	 * The popup's ARIA role: `dialog` when `label` names it, otherwise `group`.
	 * Upstream computes this inside `renderHoverCard`; `<HoverCardLayer>` is that
	 * closure here, so the hook hands it over instead.
	 */
	readonly role: 'dialog' | 'group';

	/** The popup's accessible name, or `undefined` when it has none. */
	readonly label: string | undefined;

	/**
	 * Pointer entered the card. Marks the card hovered and cancels any pending
	 * timers, so the hide scheduled by leaving the trigger never fires.
	 */
	handleContentMouseEnter: () => void;

	/** Pointer left the card — clears the hovered mark and schedules a hide. */
	handleContentMouseLeave: () => void;

	/**
	 * Escape inside the card: dismiss and return focus to the trigger, without
	 * the refocus re-opening it.
	 */
	handleContentKeyDown: (e: KeyboardEvent) => void;

	/**
	 * Focus left the card. Hides unless focus stayed inside it or went back to
	 * the trigger. Bound to `focusout`, not `blur` — see the module comment.
	 */
	handleContentFocusOut: (e: FocusEvent) => void;

	/** Imperatively show the hover card (bypassing the hover delay). */
	show: () => void;

	/** Imperatively hide the hover card. */
	hide: () => void;
}

/**
 * Check if an element is naturally focusable
 */
function isFocusable(element: HTMLElement): boolean {
	// Elements with explicit tabindex
	if (element.hasAttribute('tabindex')) {
		return element.tabIndex >= 0;
	}

	// Naturally focusable elements
	const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
	if (focusableTags.includes(element.tagName)) {
		return !(element as HTMLButtonElement).disabled;
	}

	// Elements with contenteditable
	if (element.isContentEditable) {
		return true;
	}

	return false;
}

/**
 * Hook for hover card behavior with hover/focus triggers.
 *
 * Builds on `useLayer` to add:
 * - Hover triggers with configurable delay
 * - Focus triggers with auto-detection for focusable elements
 * - Stay-open behavior when mouse/focus moves into the hover card
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const id = $props.id();
 *   const hoverCard = useHoverCard(() => ({ id, placement: 'above' }));
 * </script>
 *
 * <Button {@attach hoverCard.attachTrigger} aria-describedby={hoverCard.describedBy}>
 *   Hover me
 * </Button>
 * <HoverCardLayer {hoverCard}><ProfileCard {user} /></HoverCardLayer>
 * ```
 */
export function useHoverCard(options: () => HoverCardOptions): HoverCardReturn {
	const placement = $derived(options().placement ?? 'above');
	const alignment = $derived(options().alignment ?? 'center');

	const layer = useLayer(() => ({
		mode: 'context',
		// Rich card content must never enter an invalid paragraph, even briefly:
		// nothing but the inert marker exists while the card is closed, and the
		// container's position is resolved at the moment it opens (#5039).
		lazyMount: true,
		id: options().id,
		onShow: options().onShow,
		onHide: options().onHide
	}));

	const xstyle = $derived(hoverCardSurfaceXstyle(placement));

	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;
	/**
	 * The trigger element. Upstream's `triggerRef`, kept for the two reads that
	 * are not listener bookkeeping: the Escape refocus and the content blur test.
	 */
	let trigger: HTMLElement | null = null;
	let isHoveringContent = false;
	// Track when we're dismissing via Escape to prevent re-show on refocus
	let isEscapeDismissing = false;

	// Clear all timeouts
	function clearTimeouts(): void {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	}

	// Schedule show with delay (suppressed when isOpen is false)
	function scheduleShow(): void {
		const { isEnabled = true, isOpen, delay = 300 } = options();
		if (!isEnabled || isOpen === false) {
			return;
		}
		clearTimeouts();
		showTimeout = setTimeout(() => {
			layer.show();
		}, delay);
	}

	// Schedule hide with delay (suppressed when isOpen is true)
	function scheduleHide(): void {
		const { isOpen, hideDelay = 200 } = options();
		if (isOpen === true) {
			return;
		}
		clearTimeouts();
		hideTimeout = setTimeout(() => {
			// Don't hide if hovering content
			if (!isHoveringContent) {
				layer.hide();
			}
		}, hideDelay);
	}

	// Event handlers
	function handleMouseEnter(): void {
		scheduleShow();
	}

	function handleMouseLeave(): void {
		scheduleHide();
	}

	/**
	 * Focus opens the card immediately, with no delay and — unlike `scheduleShow`
	 * — without consulting `isOpen`, so a controlled-closed card can still be
	 * force-opened by focus. Both asymmetries are upstream's and are transcribed
	 * rather than reconciled.
	 */
	function handleFocusIn(): void {
		if (!(options().isEnabled ?? true)) {
			return;
		}
		// Skip showing if we're in the middle of an Escape dismiss
		if (isEscapeDismissing) {
			isEscapeDismissing = false;
			return;
		}
		clearTimeouts();
		layer.show();
	}

	function handleFocusOut(e: FocusEvent): void {
		// Check if focus is moving to the hover card content
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		const popoverElement = document.getElementById(layer.id);

		if (popoverElement?.contains(relatedTarget)) {
			// Focus moving into hover card, keep it open
			return;
		}

		scheduleHide();
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			// Stop propagation so parent components don't react to the same Escape
			e.stopPropagation();
			// Hide immediately without refocusing (we're already on trigger)
			clearTimeouts();
			layer.hide();
		}
	}

	/**
	 * The interaction half. Reading `focusTrigger` here is deliberate: an
	 * attachment is an effect, so a change re-runs detach/attach and the focus
	 * listeners are re-decided — which is what upstream's dependency list on the
	 * same value does.
	 */
	const attachInteraction: Attachment<HTMLElement> = (element) => {
		// Attach hover listeners
		element.addEventListener('mouseenter', handleMouseEnter);
		element.addEventListener('mouseleave', handleMouseLeave);

		// Attach focus listeners based on focusTrigger option
		const focusTrigger = options().focusTrigger ?? 'auto';
		const shouldAttachFocus =
			focusTrigger === 'always' || (focusTrigger === 'auto' && isFocusable(element));

		if (shouldAttachFocus) {
			element.addEventListener('focusin', handleFocusIn);
			element.addEventListener('focusout', handleFocusOut);
		}

		// Attach keydown for Escape handling
		element.addEventListener('keydown', handleKeyDown);

		trigger = element;

		return () => {
			element.removeEventListener('mouseenter', handleMouseEnter);
			element.removeEventListener('mouseleave', handleMouseLeave);
			element.removeEventListener('focusin', handleFocusIn);
			element.removeEventListener('focusout', handleFocusOut);
			element.removeEventListener('keydown', handleKeyDown);
			if (trigger === element) {
				trigger = null;
			}
		};
	};

	// Combined attachment — shorthand for applying both halves to one element
	const attachTrigger: Attachment<HTMLElement> = (element) => {
		const detachPosition = layer.attachTrigger(element);
		const detachInteraction = attachInteraction(element);
		return () => {
			detachInteraction?.();
			detachPosition?.();
		};
	};

	// The content surface's handlers. Private upstream only because
	// `renderHoverCard` owned the element they bind to.
	function handleContentMouseEnter(): void {
		isHoveringContent = true;
		clearTimeouts();
	}

	function handleContentMouseLeave(): void {
		isHoveringContent = false;
		scheduleHide();
	}

	function handleContentKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			// Stop propagation so parent components don't react to the same Escape
			e.stopPropagation();
			// Set flag to prevent re-show when we refocus trigger
			isEscapeDismissing = true;
			// Hide immediately
			clearTimeouts();
			layer.hide();
			// Refocus the trigger
			trigger?.focus();
		}
	}

	function handleContentFocusOut(e: FocusEvent): void {
		// Check if focus is moving back to the trigger or staying within content
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		const popoverElement = e.currentTarget as HTMLElement;

		// If focus stays within the hover card, do nothing
		if (popoverElement.contains(relatedTarget)) {
			return;
		}

		// If focus is moving back to the trigger, do nothing
		if (trigger?.contains(relatedTarget)) {
			return;
		}

		// Focus is leaving the hover card entirely
		scheduleHide();
	}

	// Cleanup on unmount. No tracked reads, so it runs once and its teardown is
	// the whole point — upstream's mount-only cleanup `useEffect`.
	$effect(() => {
		return () => {
			clearTimeouts();
		};
	});

	// Show on mount when isDefaultOpen is true. Read once at init, as upstream's
	// empty dependency list documents, so the effect has nothing tracked and runs
	// a single time. `layer.show()` reads `isOpen`, hence the untrack.
	//
	// The popover element is already attached by the time this runs: a child
	// component's attachment is created during the parent's template render and
	// therefore flushes before the parent's `$effect`.
	const isDefaultOpen = untrack(() => options().isDefaultOpen ?? false);
	$effect(() => {
		if (isDefaultOpen) {
			untrack(() => layer.show());
		}
	});

	// Controlled open state — overrides hover/focus triggers
	$effect(() => {
		const isOpen = options().isOpen;
		if (isOpen === undefined) {
			return;
		}
		untrack(() => {
			clearTimeouts();
			if (isOpen) {
				layer.show();
			} else {
				layer.hide();
			}
		});
	});

	return {
		attachTrigger,
		attachPosition: layer.attachTrigger,
		attachInteraction,
		get anchorId() {
			return layer.anchorId;
		},
		get describedBy() {
			return layer.id;
		},
		layer,
		get placement() {
			return placement;
		},
		get alignment() {
			return alignment;
		},
		get xstyle() {
			return xstyle;
		},
		// A named dialog when a label is provided; otherwise a group. A group may
		// validly be unnamed, an unnamed dialog may not — and hover cards are
		// non-modal, so group is honest semantics without a name.
		get role() {
			return options().label ? ('dialog' as const) : ('group' as const);
		},
		get label() {
			return options().label || undefined;
		},
		handleContentMouseEnter,
		handleContentMouseLeave,
		handleContentKeyDown,
		handleContentFocusOut,
		show: layer.show,
		hide: layer.hide
	};
}
