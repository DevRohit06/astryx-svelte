import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { StyleArg } from '../../internal/sx.js';
import {
	useLayer,
	type ContextLayerReturn,
	type LayerAlignment,
	type LayerPlacement
} from '../layer/use-layer.svelte.js';
import { useTouchTrigger, type LayerTouchTrigger } from '../layer/use-touch-trigger.svelte.js';
import { useLayerDismissal } from '../layer/use-layer-dismissal.svelte.js';
import { hoverCardSurfaceXstyle } from './use-hover-card.stylex.js';

/**
 * Hover/focus-triggered hover cards, ported from Astryx's
 * `HoverCard/useHoverCard.tsx`.
 *
 * Like `useTooltip` it is timing over `useLayer`, so the native Popover API,
 * CSS anchor positioning and RTL mirroring all arrive already solved. What
 * distinguishes a hover card from a tooltip is that its *content* is
 * interactive: the pointer and the keyboard can both move into the card, so the
 * hook owns handlers for the content surface as well as for the trigger, and a
 * hide scheduled while the pointer is over the card is dropped rather than
 * honoured.
 *
 * Escape is not among them. Upstream 0.5.0 deleted both of the private handlers
 * that used to own it — the `keydown` listener on the trigger and the
 * `onKeyDown` on the content surface — and joined the shared dismissal stack
 * (`useLayerDismissal`) instead, so one press dismisses exactly one layer. The
 * trigger listener in particular called `stopPropagation()` on any Escape while
 * the trigger merely had focus, open card or not, which silently ate the press
 * that should have closed a `Dialog` around it.
 *
 * The translations are the ones this port has already made:
 *
 * **`renderHoverCard` is gone; `<HoverCardLayer>` replaces it.** A Svelte hook
 * cannot return markup, so the render function becomes a component and the hook
 * hands it what upstream's closure captured — the `layer`, the resolved
 * `placement`/`alignment`, the surface `xstyle`, and the content-surface
 * handlers. Those are private upstream only because `renderHoverCard` owned the
 * element they bind to; here the component does.
 *
 * **The three refs become three attachments.** `ref`/`positionRef`/
 * `interactionRef` map onto `attachTrigger`/`attachPosition`/
 * `attachInteraction`, which deletes upstream's "remove the listeners I put on
 * the element I am leaving" block — an attachment has the cleanup phase a ref
 * callback lacks.
 *
 * **`triggerRef` survives that deletion.** It is not only listener bookkeeping
 * here: the Escape dismissal calls `trigger.focus()` when the card held focus,
 * the content's blur check asks `trigger.contains(...)`, and `useTouchTrigger`
 * asks the element whether it performs an action of its own — so the element
 * itself has to be readable. It is a plain `let` — nothing renders from it —
 * assigned on attach and nulled on detach.
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

/**
 * Touch trigger behavior for hover cards
 */
export type HoverCardTouchTrigger = LayerTouchTrigger;

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
	 * What a tap does on a touch pointer, where there is no hover:
	 * - `auto`: tap opens the card, unless the trigger performs an action of its
	 *   own (a button, a link, a form control) — that tap belongs to the control
	 * - `tap`: tap always opens the card, even on a trigger that acts
	 * - `none`: touch never opens the card
	 *
	 * @default 'auto'
	 */
	touchTrigger?: HoverCardTouchTrigger;

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
	 *
	 * A controlled hover card still takes Escape when it is the top-most layer,
	 * and answers by calling `onHide` without hiding itself — closing is your
	 * update's decision, exactly as for a controlled Dialog. Ignore the call and
	 * the card stays, and so does the press: nothing underneath dismisses.
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

	// Touch resolves immediately: the hover delays exist to filter out a pointer
	// passing across the trigger, and a tap is never that.
	function showNow(): void {
		clearTimeouts();
		layer.show();
	}

	function hideNow(): void {
		clearTimeouts();
		isHoveringContent = false;
		layer.hide();
	}

	const touch = useTouchTrigger(() => ({
		touchTrigger: options().touchTrigger ?? 'auto',
		isEnabled: options().isEnabled ?? true,
		isControlled: options().isOpen !== undefined,
		isOpen: layer.isOpen,
		layerId: layer.id,
		trigger,
		show: showNow,
		hide: hideNow
	}));

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
		// A tap synthesizes mouseenter. On touch the tap path owns the decision,
		// so hover must not also fire — without this a hover card opens on every
		// tap of its trigger and has nothing to close it.
		if (touch.isTouchPointer) {
			return;
		}
		scheduleShow();
	}

	function handleMouseLeave(): void {
		// On touch the synthesized mouseleave arrives with the next tap elsewhere,
		// which the outside-tap dismissal already handles.
		if (touch.isTouchPointer) {
			return;
		}
		scheduleHide();
	}

	// Tap-to-open on touch; on a mouse this does nothing and hover still rules.
	function handlePointerDown(event: PointerEvent): void {
		touch.handlePointerDown(event);
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
		// A tap focuses the trigger it activates. Opening on that focus would
		// reinstate exactly the behavior the touch path just decided against —
		// and on an action trigger it covers the thing the user tapped.
		if (touch.isTouchInteraction()) {
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

	// Escape dismissal (WCAG 1.4.13) goes through the shared layer stack: a
	// visible card is the top-most layer, so it takes the press and consumes it.
	//
	// This replaces a keydown listener on the TRIGGER that called
	// `stopPropagation()` on any Escape while the trigger merely had focus — open
	// card or not — so focusing a HoverCard trigger inside a Dialog silently ate
	// the press that should have closed the Dialog. Presence is now answered from
	// the DOM, so a closed card never claims a press.
	//
	// A controlled hover card stays on the stack and takes the press like any
	// other layer, but answers it by reporting instead of hiding: `isOpen` is the
	// consumer's value, so only their update may change it. Same contract as a
	// controlled Dialog.
	useLayerDismissal(() => ({
		// Registered for the hook's lifetime rather than gated on `layer.isOpen`:
		// that state can lag a frame behind the DOM, so a press arriving right
		// after the layer appears would find nothing registered. Because this
		// layer CONSUMES the press, a stale registration would be worse than a
		// missed one — it would silently eat Escapes meant for the dialog
		// underneath — so presence is answered from the DOM at press time instead
		// of from state.
		isActive: true,
		isPresent: () => {
			const el = typeof document === 'undefined' ? null : document.getElementById(layer.id);
			if (el == null) {
				return false;
			}
			try {
				return el.matches(':popover-open');
			} catch {
				// Browsers without the Popover API (and some test environments)
				// cannot answer the selector; fall back to the hook's own state.
				return layer.isOpen;
			}
		},
		onDismiss: () => {
			clearTimeouts();
			// A tap-open closed by Escape leaves no tap-open to dismiss.
			touch.clearTapOpen();
			// Controlled: report and stop. The close — and the focus restore that
			// goes with it — happens in the controlled effect if and when the
			// consumer flips `isOpen`.
			if (options().isOpen !== undefined) {
				options().onHide?.();
				return;
			}
			// Only when the card itself held focus, which is the one case the
			// content-level handler this replaced could run in. Refocusing
			// unconditionally would drag the caret out of a field the user was
			// typing in while a hover card happened to be up; arming the re-show
			// guard unconditionally would swallow their next focus on the trigger,
			// because a `focus()` on the already-focused trigger fires no focusin
			// to clear it.
			const card = typeof document === 'undefined' ? null : document.getElementById(layer.id);
			const hadFocus = card?.contains(document.activeElement) ?? false;
			layer.hide();
			if (hadFocus) {
				isEscapeDismissing = true;
				trigger?.focus();
			}
		}
	}));

	/**
	 * The interaction half. Reading `focusTrigger` here is deliberate: an
	 * attachment is an effect, so a change re-runs detach/attach and the focus
	 * listeners are re-decided — which is what upstream's dependency list on the
	 * same value does.
	 */
	const attachInteraction: Attachment<HTMLElement> = (element) => {
		// Attach hover listeners. `pointerenter` runs before the synthesized
		// `mouseenter` a tap produces, which is what lets the hover path know it
		// is looking at a finger.
		element.addEventListener('pointerenter', touch.handlePointerEnter);
		element.addEventListener('mouseenter', handleMouseEnter);
		element.addEventListener('mouseleave', handleMouseLeave);
		element.addEventListener('pointerdown', handlePointerDown);

		// Attach focus listeners based on focusTrigger option
		const focusTrigger = options().focusTrigger ?? 'auto';
		const shouldAttachFocus =
			focusTrigger === 'always' || (focusTrigger === 'auto' && isFocusable(element));

		if (shouldAttachFocus) {
			element.addEventListener('focusin', handleFocusIn);
			element.addEventListener('focusout', handleFocusOut);
		}

		trigger = element;

		return () => {
			element.removeEventListener('pointerenter', touch.handlePointerEnter);
			element.removeEventListener('mouseenter', handleMouseEnter);
			element.removeEventListener('mouseleave', handleMouseLeave);
			element.removeEventListener('pointerdown', handlePointerDown);
			element.removeEventListener('focusin', handleFocusIn);
			element.removeEventListener('focusout', handleFocusOut);
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
		// Touch synthesizes these over the card too; letting a tap inside register
		// as "hovering content" would block every later hide.
		if (touch.isTouchPointer) {
			return;
		}
		isHoveringContent = true;
		clearTimeouts();
	}

	function handleContentMouseLeave(): void {
		if (touch.isTouchPointer) {
			return;
		}
		isHoveringContent = false;
		scheduleHide();
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
				// A consumer closing the card while it holds focus would strand focus
				// on `<body>`. Arming the re-show guard is what keeps the refocus
				// from reopening the card through `handleFocusIn`, which shows on any
				// focusin.
				const card = document.getElementById(layer.id);
				const hadFocus = card?.contains(document.activeElement) ?? false;
				layer.hide();
				if (hadFocus) {
					isEscapeDismissing = true;
					trigger?.focus();
				}
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
		handleContentFocusOut,
		show: layer.show,
		hide: layer.hide
	};
}
