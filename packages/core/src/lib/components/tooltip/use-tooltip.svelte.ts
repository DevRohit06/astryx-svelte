import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { StyleArg } from '../../internal/sx.js';
import {
	useLayer,
	type ContextLayerReturn,
	type LayerAlignment,
	type LayerPlacement
} from '../layer/use-layer.svelte.js';
import { tooltipSurfaceXstyle } from './use-tooltip.stylex.js';
import { isImeKeyEvent } from '../../utils/ime.js';

/**
 * Hover/focus-triggered tooltips, ported from Astryx's `Tooltip/useTooltip.tsx`.
 *
 * It is a thin layer of timing over `useLayer`, so everything the layer already
 * solved — the native Popover API, CSS anchor positioning, RTL mirroring — comes
 * along unchanged. What is left is delay bookkeeping, the focus-trigger rules,
 * and the two WCAG 1.4.13 obligations (dismissible on Escape, hoverable across
 * the gap), all of which are plain DOM and transcribe.
 *
 * Four things did translate:
 *
 * **`renderTooltip` is gone; `<TooltipLayer>` replaces it.** This is the same
 * split `layer.render` → `<Layer>` already took, for the same reason — a Svelte
 * hook cannot return markup. The hook therefore hands back what upstream's
 * closure captured: the `layer` itself, the resolved `placement`/`alignment`,
 * the surface `xstyle`, and the two hover-bridge callbacks. `cancelHide` and
 * `scheduleHide` are private upstream only because `renderTooltip` owned the
 * element they bind to; here the component does, so they are on the return.
 *
 * **The three refs become three attachments.** `ref`/`positionRef`/
 * `interactionRef` map onto `attachTrigger`/`attachPosition`/`attachInteraction`
 * — an attachment has a ref callback's exact attach/replace/detach lifecycle.
 * That deletes `triggerRef` and the "remove the listeners I put on the element I
 * am leaving" block whose only job was to stand in for a cleanup phase a ref
 * callback does not have. `focusTrigger` is read *inside* the attachment, so
 * changing it re-runs attach/detach — which is exactly what its presence in
 * upstream's `useCallback` dependency list buys.
 *
 * **The id is passed in**, as `useLayer` requires; see that module for why.
 *
 * **Every option is read at use time through the getter.** Upstream carries
 * eleven `useCallback` dependency arrays to keep its handlers from going stale;
 * a getter read at event time is that, with nothing to list.
 */

/**
 * Grace period (ms) before hiding on pointer-leave when no explicit `hideDelay`
 * is set, so the pointer can travel across the small gap from the trigger onto
 * the tooltip surface without the tooltip disappearing (WCAG 1.4.13 hoverable).
 */
const HOVER_BRIDGE_DELAY = 100;

/**
 * Focus trigger behavior for tooltips
 */
export type TooltipFocusTrigger = 'auto' | 'always' | 'never';

export interface TooltipOptions {
	/**
	 * SSR-stable unique id for the tooltip layer — the `aria-describedby` target
	 * the trigger points at. Pass `$props.id()` from the calling component; see
	 * `useLayer` for why the hook cannot mint it itself.
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
	 * @default 200
	 */
	delay?: number;

	/**
	 * Delay before hiding after mouse/focus leave (ms)
	 * @default 0
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
	focusTrigger?: TooltipFocusTrigger;

	/**
	 * Whether the tooltip is enabled.
	 * When false, hover/focus triggers are disabled.
	 *
	 * @default true
	 */
	isEnabled?: boolean;

	/**
	 * Controlled open state. When provided, overrides hover/focus triggers:
	 * - `true`: force-show the tooltip (hover/focus hide is suppressed)
	 * - `false`: force-hide the tooltip
	 * - `undefined`: uncontrolled — hover/focus triggers manage visibility
	 */
	isOpen?: boolean;

	/**
	 * Whether the tooltip should be shown on mount.
	 * The tooltip is still dismissible — this just opens it initially.
	 */
	isDefaultOpen?: boolean;

	/** Callback fired when tooltip is shown. */
	onShow?: () => void;

	/** Callback fired when tooltip is hidden. */
	onHide?: () => void;
}

export interface TooltipReturn {
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
	 * The underlying layer. `<TooltipLayer>` hands it to `<Layer>`; upstream's
	 * `renderTooltip` closes over the same value.
	 */
	readonly layer: ContextLayerReturn;

	/** Resolved placement — the default `<TooltipLayer>` renders at. */
	readonly placement: LayerPlacement;

	/** Resolved alignment — the default `<TooltipLayer>` renders at. */
	readonly alignment: LayerAlignment;

	/** The surface `xstyle` — upstream's `popoverXstyle`. */
	readonly xstyle: StyleArg;

	/** Cancel a pending hide, e.g. the pointer entered the tooltip surface. */
	cancelHide: () => void;

	/** Schedule a hide, after `hideDelay` or the hover-bridge grace period. */
	scheduleHide: () => void;
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
 * Hook for tooltip behavior with hover/focus triggers.
 *
 * Builds on `useLayer` to add:
 * - Hover triggers with configurable delay
 * - Focus triggers with auto-detection for focusable elements
 * - Inverted color palette for high contrast
 *
 * Unlike HoverCard, tooltips:
 * - Don't stay open when hovering the tooltip content
 * - Have shorter delays
 * - Use inverted colors (dark background, light text)
 * - Are typically used for short, non-interactive text
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const id = $props.id();
 *   const tooltip = useTooltip(() => ({ id, placement: 'above' }));
 * </script>
 *
 * <Button {@attach tooltip.attachTrigger} aria-describedby={tooltip.describedBy}>
 *   Hover me
 * </Button>
 * <TooltipLayer {tooltip}>Helpful tooltip text</TooltipLayer>
 * ```
 */
export function useTooltip(options: () => TooltipOptions): TooltipReturn {
	const placement = $derived(options().placement ?? 'above');
	const alignment = $derived(options().alignment ?? 'center');

	const layer = useLayer(() => ({
		mode: 'context',
		id: options().id,
		onShow: options().onShow,
		onHide: options().onHide
	}));

	const xstyle = $derived(tooltipSurfaceXstyle(placement));

	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

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
		const { isEnabled = true, isOpen, delay = 200 } = options();
		if (!isEnabled || isOpen === false) {
			return;
		}
		clearTimeouts();
		showTimeout = setTimeout(() => {
			layer.show();
		}, delay);
	}

	// Schedule hide with delay (suppressed when isOpen is true).
	// A small hover bridge (when hideDelay is 0) lets the pointer travel from the
	// trigger onto the tooltip surface without the tooltip vanishing — required
	// for WCAG 1.4.13 (Content on Hover or Focus: hoverable).
	function scheduleHide(): void {
		const { isOpen, hideDelay = 0 } = options();
		if (isOpen === true) {
			return;
		}
		clearTimeouts();
		const effectiveHideDelay = hideDelay > 0 ? hideDelay : HOVER_BRIDGE_DELAY;
		hideTimeout = setTimeout(() => {
			layer.hide();
		}, effectiveHideDelay);
	}

	// Cancel a pending hide (e.g. the pointer entered the tooltip surface).
	function cancelHide(): void {
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	}

	// Event handlers
	function handleMouseEnter(): void {
		// Suppress tooltips on touch devices — hover is simulated and eats a tap
		if (
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(hover: none)').matches
		) {
			return;
		}
		scheduleShow();
	}

	function handleMouseLeave(): void {
		scheduleHide();
	}

	function handleFocusIn(e: Event): void {
		if (!(options().isEnabled ?? true)) {
			return;
		}
		// Only show tooltip for keyboard focus (:focus-visible),
		// not programmatic focus (e.g. dialog auto-focus, touch tap)
		const target = e.target as HTMLElement;
		if (!target.matches(':focus-visible')) {
			return;
		}
		clearTimeouts();
		layer.show();
	}

	function handleFocusOut(): void {
		scheduleHide();
	}

	/**
	 * Pressing the trigger hides its own tooltip: once the control is activated
	 * the hint has served its purpose, and a tooltip lingering over a just-pressed
	 * control reads as stale (a "Copy link" button's tooltip used to survive the
	 * click). Fires on `pointerdown` so it feels immediate. Uncontrolled tooltips
	 * only — a controlled tooltip's visibility is owned by the consumer.
	 * `layer.hide()` self-guards when already closed.
	 */
	function handlePointerDown(): void {
		if (options().isOpen !== undefined) {
			return;
		}
		clearTimeouts();
		layer.hide();
	}

	/**
	 * The interaction half. Reading `focusTrigger` here is deliberate: an
	 * attachment is an effect, so a change re-runs detach/attach and the focus
	 * listeners are re-decided — which is what upstream's dependency list on the
	 * same value does.
	 */
	const attachInteraction: Attachment<HTMLElement> = (element) => {
		element.addEventListener('mouseenter', handleMouseEnter);
		element.addEventListener('mouseleave', handleMouseLeave);
		// Press-to-dismiss: activating the trigger hides its own tooltip.
		element.addEventListener('pointerdown', handlePointerDown);

		// Attach focus listeners based on focusTrigger option
		const focusTrigger = options().focusTrigger ?? 'auto';
		const shouldAttachFocus =
			focusTrigger === 'always' || (focusTrigger === 'auto' && isFocusable(element));

		if (shouldAttachFocus) {
			element.addEventListener('focusin', handleFocusIn);
			element.addEventListener('focusout', handleFocusOut);
		}

		return () => {
			element.removeEventListener('mouseenter', handleMouseEnter);
			element.removeEventListener('mouseleave', handleMouseLeave);
			element.removeEventListener('pointerdown', handlePointerDown);
			element.removeEventListener('focusin', handleFocusIn);
			element.removeEventListener('focusout', handleFocusOut);
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

	// Cleanup on unmount. No tracked reads, so it runs once and its teardown is
	// the whole point — upstream's mount-only cleanup `useEffect`.
	$effect(() => {
		return () => {
			clearTimeouts();
		};
	});

	// Show on mount when isDefaultOpen is true. Read once at init, as upstream's
	// empty dependency list documents ("isDefaultOpen is not reactive"), so the
	// effect has nothing tracked and runs a single time. `layer.show()` reads
	// `isOpen`, hence the untrack.
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

	// Dismiss on Escape (WCAG 1.4.13 — dismissible). Uncontrolled tooltips only;
	// a controlled tooltip's visibility is owned by the consumer. The listener is
	// mounted for the lifetime of an uncontrolled tooltip rather than gated on
	// `layer.isOpen` — `layer.hide()` self-guards and no-ops when the layer is
	// already closed. Guarded against IME composition-cancel.
	$effect(() => {
		if (options().isOpen !== undefined) {
			return;
		}
		const handleKeyDown = (e: KeyboardEvent): void => {
			if (e.key !== 'Escape') {
				return;
			}
			// Ignore Escape that is committing/cancelling an IME composition;
			// see utils/ime.ts for why.
			if (isImeKeyEvent(e)) {
				return;
			}
			clearTimeouts();
			layer.hide();
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
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
		cancelHide,
		scheduleHide
	};
}
