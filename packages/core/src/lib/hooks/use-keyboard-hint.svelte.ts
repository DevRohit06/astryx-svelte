import { untrack } from 'svelte';
import { useLayer, type ContextLayerReturn } from '../components/layer/use-layer.svelte.js';

/**
 * The ephemeral "← → to navigate" hint, ported from Astryx's
 * `hooks/useKeyboardHint.tsx`.
 *
 * It is the only hook upstream that *renders*, so it takes the split
 * `useLayer` → `<Layer>` and `useTooltip` → `<TooltipLayer>` already
 * established: a Svelte hook cannot return markup, so `hintElement` becomes
 * `<KeyboardHintLayer>` and the hook hands back what upstream's closure
 * captured. That closure is unusually small — the layer, and `orientation` —
 * because the hint's markup has no other dynamic input. Visibility is not
 * captured either: the element renders unconditionally and the popover
 * attribute drives display, which is upstream's design and the reason its
 * `hintElement` needs no memo.
 *
 * Two translations are worth stating:
 *
 * **The anchor is not a trigger.** Every other `useLayer` consumer attaches to
 * one fixed element; this hook re-anchors imperatively to *whichever descendant
 * currently has focus*, and unanchors by calling upstream's ref callback with
 * `null`. An `Attachment` takes a non-null element and returns a cleanup closed
 * over it, so `attachTrigger(null)` is not expressible — instead the detach
 * closure is kept and `anchorTo()` runs the previous one before applying the
 * next. That reproduces upstream's remove-from-previous-then-add semantics
 * exactly, through the public seam, and it is why `layerAnchorRef` (which
 * exists upstream only because context-mode `ref` is a fresh closure every
 * render) has nothing to do here.
 *
 * **`isVisibleRef` collapses into `layer.isOpen`.** Upstream mirrors the
 * popover's state into a ref purely to read it synchronously from handlers;
 * `layer.isOpen` is `$state`, is synchronously readable, and is set at exactly
 * the same three moments — including the browser-initiated toggle path.
 *
 * The `id` option has no upstream counterpart and is required here, for the
 * reason `useLayer` and `useTooltip` already record: `$props.id()` is only
 * callable at the top level of a component, so the layer's SSR-stable id has to
 * be passed in rather than minted.
 */

export type KeyboardHintOrientation = 'horizontal' | 'vertical' | 'both';

export interface UseKeyboardHintOptions {
	/**
	 * SSR-stable unique id for the hint layer. Pass `$props.id()` from the
	 * calling component; see `useLayer` for why the hook cannot mint it itself.
	 */
	id: string;

	/**
	 * Orientation of the arrow-key navigation. Controls which arrow icons are
	 * shown in the hint badge.
	 * - `'horizontal'` → ← →
	 * - `'vertical'` → ↑ ↓
	 * - `'both'` → ← → ↑ ↓
	 * @default 'horizontal'
	 */
	orientation?: KeyboardHintOrientation;

	/**
	 * Milliseconds before the hint auto-dismisses after appearing.
	 * @default 3000
	 */
	dismissAfterMs?: number;

	/**
	 * Whether the hint is enabled. Set to false to disable for a specific
	 * instance (e.g. when the widget is read-only or the user has dismissed
	 * globally).
	 * @default true
	 */
	isEnabled?: boolean;
}

export interface UseKeyboardHintReturn {
	/**
	 * The underlying layer. `<KeyboardHintLayer>` hands it to `<Layer>`;
	 * upstream's `hintElement` closes over the same value.
	 */
	readonly layer: ContextLayerReturn;

	/** Resolved orientation — which arrows `<KeyboardHintLayer>` renders. */
	readonly orientation: KeyboardHintOrientation;

	/**
	 * Attach to the composite container's `focusin`. Shows the hint on the first
	 * keyboard-focus (`:focus-visible`) entry from outside.
	 *
	 * Upstream's name is kept because it is published API, but the attribute a
	 * consumer writes is `onfocusin`: React's `onFocus` is the *bubbling*
	 * synthetic event, and this handler reads a focused descendant as `e.target`
	 * while `e.currentTarget` is the container — which native `focus` cannot
	 * deliver, since it does not bubble. Same correction `useListFocus` records.
	 */
	onFocus: (e: FocusEvent) => void;

	/**
	 * Attach to the composite container's `focusout` — see `onFocus` for why the
	 * name and the attribute differ. Hides the hint when focus leaves the
	 * composite entirely, and re-anchors when it moves within.
	 */
	onBlur: (e: FocusEvent) => void;

	/**
	 * Attach to the composite container's `keydown`. Dismisses the hint on the
	 * first arrow press (the user discovered the interaction).
	 */
	onKeyDown: (e: KeyboardEvent) => void;
}

const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/**
 * The keys each orientation shows. Module-private upstream, because
 * `hintElement` is built in the same module; the render split means
 * `<KeyboardHintLayer>` needs it, so it is module-public and **barrel-absent**
 * — the arrangement `hasActiveFocusTrapEscape` and `isImeKeyEvent` already use.
 */
export const ARROW_HINT_KEYS: Record<KeyboardHintOrientation, ReadonlyArray<string>> = {
	horizontal: ['left', 'right'],
	vertical: ['up', 'down'],
	both: ['left', 'right', 'up', 'down']
};

/**
 * Shows an ephemeral visual hint ("← → to navigate") anchored to the focused
 * item when a composite widget first receives keyboard focus. Teaches sighted
 * keyboard users that arrows navigate within the group.
 *
 * The hint renders in the top layer (`popover="manual"`) and is CSS-anchor-
 * positioned to the currently focused element, so it is never clipped by
 * overflow containers. It auto-dismisses on first arrow press, timeout, or
 * blur, and does not re-show for that instance.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const id = $props.id();
 *   const hint = useKeyboardHint(() => ({ id, orientation: 'horizontal' }));
 * </script>
 *
 * <div
 *   role="toolbar"
 *   onfocusin={hint.onFocus}
 *   onfocusout={hint.onBlur}
 *   onkeydown={hint.onKeyDown}
 * >
 *   {@render children()}
 *   <KeyboardHintLayer {hint} />
 * </div>
 * ```
 */
export function useKeyboardHint(options: () => UseKeyboardHintOptions): UseKeyboardHintReturn {
	const orientation = $derived(options().orientation ?? 'horizontal');

	let timeout: ReturnType<typeof setTimeout> | null = null;
	let dismissed = false;
	/**
	 * The teardown for the anchor name currently applied. Upstream calls its ref
	 * callback with `null` to unanchor; an attachment's cleanup is that call.
	 */
	let detachAnchor: (() => void) | null = null;

	function clearDismissTimeout(): void {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	}

	const layer = useLayer(() => ({
		mode: 'context',
		id: options().id,
		onHide: () => {
			clearDismissTimeout();
			anchorTo(null);
		}
	}));

	/**
	 * Move this layer's anchor name to `element`, or remove it entirely. The
	 * previous teardown runs first, so an element the hint has left keeps none
	 * of it — upstream's `layerAnchorRef.current(prev → next)` pair.
	 */
	function anchorTo(element: HTMLElement | null): void {
		detachAnchor?.();
		detachAnchor = null;
		if (element) {
			// Not reactive here — every caller is an event handler or a teardown —
			// but `attachTrigger` reads the derived `anchorId`, so an `$effect`
			// caller would subscribe to it. Untracked for that reason.
			detachAnchor = untrack(() => layer.attachTrigger(element)) ?? null;
		}
	}

	// Hide + mark dismissed (won't re-show for this instance)
	function dismiss(): void {
		dismissed = true;
		clearDismissTimeout();
		layer.hide();
		anchorTo(null);
	}

	// Show the layer anchored to the focused element
	function show(anchor: HTMLElement): void {
		const { isEnabled = true, dismissAfterMs = 3000 } = options();
		if (dismissed || !isEnabled) {
			return;
		}

		// The anchor name has to be on the element *before* showPopover(), or
		// anchor positioning resolves against nothing.
		anchorTo(anchor);
		layer.show();

		clearDismissTimeout();
		timeout = setTimeout(() => {
			dismiss();
		}, dismissAfterMs);
	}

	// Cleanup on unmount. No tracked reads, so it runs once and its teardown is
	// the whole point. It does not hide the layer, as upstream's does not.
	$effect(() => {
		return () => {
			clearDismissTimeout();
			anchorTo(null);
		};
	});

	function onFocus(e: FocusEvent): void {
		if (dismissed || !(options().isEnabled ?? true)) {
			return;
		}
		// Only show on keyboard focus (focus-visible)
		const target = e.target as HTMLElement;
		if (!target.matches(':focus-visible')) {
			return;
		}
		// Only show when focus enters from outside the container
		const container = e.currentTarget as HTMLElement;
		if (e.relatedTarget instanceof Node && container.contains(e.relatedTarget)) {
			return;
		}
		show(target);
	}

	function onBlur(e: FocusEvent): void {
		if (!layer.isOpen) {
			return;
		}
		const container = e.currentTarget as HTMLElement;
		// Only dismiss when focus leaves the container entirely
		if (e.relatedTarget instanceof Node && container.contains(e.relatedTarget)) {
			// Focus moved within — re-anchor to the new target
			if (!dismissed && e.relatedTarget instanceof HTMLElement) {
				anchorTo(e.relatedTarget);
			}
			return;
		}
		dismiss();
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (!layer.isOpen) {
			return;
		}
		if (ARROW_KEYS.has(e.key)) {
			dismiss();
		}
	}

	return {
		layer,
		get orientation() {
			return orientation;
		},
		onFocus,
		onBlur,
		onKeyDown
	};
}
