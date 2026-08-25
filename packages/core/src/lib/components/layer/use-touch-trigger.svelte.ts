import { untrack } from 'svelte';
import {
	getInteractionModality,
	trackInteractionModality
} from '../../utils/interaction-modality.js';

/**
 * Touch behaviour shared by the hover layers, ported from Astryx's
 * `Layer/useTouchTrigger.ts`.
 *
 * Hover is the one trigger a touch screen cannot express. A tap synthesizes
 * `mouseenter`, so an untreated hover layer either opens on every tap and
 * lingers with nothing to close it, or swallows the tap the user aimed at the
 * control underneath.
 *
 * What the trigger DOES decides which of those the tap deserves. A trigger
 * that performs an action — a button, a link, a form control — keeps its tap:
 * the layer stays shut, because the tap already has somewhere to go and a hint
 * about a control the user just operated is noise. A trigger that performs no
 * action — an info icon, an abbreviation, a truncated label — has nothing to
 * lose, so the tap opens the layer and the next tap outside dismisses it. That
 * is `auto`; `tap` and `none` state the choice outright, which is what an
 * icon-button whose only job is to reveal the layer needs.
 *
 * Four translations, all of them ones this port has already made:
 *
 * **`triggerRef` becomes a `trigger` option.** Svelte has no ref objects, so —
 * as `useClickableContainer` and `Tooltip`'s `anchor` prop already established
 * — the option carries the element itself. It is read through the options
 * getter at event time, which is exactly when upstream reads `.current`.
 *
 * **`isTouchPointerRef` becomes the `isTouchPointer` getter.** Its consumers
 * read `touch.isTouchPointerRef.current` upstream to bail out of the hover
 * path; here they read `touch.isTouchPointer`. It is a plain `let` behind a
 * getter, not `$state`: nothing renders from it, and a pointer type recorded
 * mid-gesture must not schedule anything.
 *
 * **`isOpenRef`, `hideRef` and `layerIdRef` disappear.** All three exist to
 * give a handler that outlives its render a current value; the options getter
 * is current by construction, so the mirrors have nothing to do — the same
 * deletion `useLayer` made for its own `isOpenRef`.
 *
 * **The one dependency list that is load-bearing becomes a `$derived`.**
 * Upstream's open→closed effect lists `[isOpen]`, and a getter read inside an
 * `$effect` would instead track every option the getter touches. Narrowing
 * `isOpen` through a `$derived` restores the dependency-list semantics: a
 * derived notifies only when its *value* changes, which is what
 * `useMenuHover`'s `hasRovingTabIndex` does for the same reason.
 */

/**
 * How a hover layer behaves on a touch pointer.
 *
 * - `auto`: tap-to-open, unless the trigger performs an action of its own
 * - `tap`: always tap-to-open, even on a trigger that performs an action
 * - `none`: never open on touch
 */
export type LayerTouchTrigger = 'auto' | 'tap' | 'none';

/**
 * Pointer types whose *press* is a tap rather than a click.
 *
 * A pen belongs here but not in the arrival path: in detection range it hovers
 * — firing `pointerenter`/`pointermove` with no contact, exactly as a mouse
 * does, on a device where `(hover: hover)` matches — and only becomes a tap
 * once it lands. See `handlePointerEnter`.
 */
const TOUCH_POINTER_TYPES = new Set(['touch', 'pen']);

/**
 * ARIA roles that make an element do something when activated. An explicit
 * role wins over the tag: `<button role="presentation">` is scenery, and a
 * `<span role="button">` is a real control.
 */
const ACTION_ROLES = new Set([
	'button',
	'checkbox',
	'combobox',
	'link',
	'menuitem',
	'menuitemcheckbox',
	'menuitemradio',
	'option',
	'radio',
	'searchbox',
	'slider',
	'spinbutton',
	'switch',
	'tab',
	'textbox'
]);

/**
 * Whether activating this element does something other than reveal the layer.
 *
 * Deliberately narrower than "focusable": the wrapper a text-only Tooltip
 * renders carries `tabindex=0` so keyboard users can reach the hint, and it
 * still performs no action.
 *
 * True only decides that the layer stays shut — the tap itself is never
 * swallowed. Nothing here calls `preventDefault` or `stopPropagation`, so an
 * inert trigger that happens to carry its own `onclick` (a `<div onclick>`
 * with no role) gets both: the layer opens and the handler runs.
 */
export function isActionTrigger(element: HTMLElement): boolean {
	const role = element.getAttribute('role');
	if (role != null && role !== '') {
		return ACTION_ROLES.has(role);
	}

	switch (element.tagName) {
		case 'BUTTON':
		case 'INPUT':
		case 'LABEL':
		case 'SELECT':
		case 'SUMMARY':
		case 'TEXTAREA':
			return true;
		case 'A':
		case 'AREA':
			return element.hasAttribute('href');
		default:
			return isEditable(element);
	}
}

/**
 * Whether typing into this element edits it. Reads the attribute as well as
 * the property: a DOM implementation without `isContentEditable` must not make
 * an editor that is an action in the browser read as inert.
 */
function isEditable(element: HTMLElement): boolean {
	if (element.isContentEditable === true) {
		return true;
	}
	const attribute = element.getAttribute('contenteditable');
	return attribute != null && attribute !== 'false';
}

export interface UseTouchTriggerOptions {
	/** How the layer should behave on a touch pointer. */
	touchTrigger: LayerTouchTrigger;

	/** Whether the layer's triggers are live at all. */
	isEnabled: boolean;

	/**
	 * Whether the consumer controls visibility. A controlled layer is never
	 * toggled by a tap — its visibility is the consumer's to own.
	 */
	isControlled: boolean;

	/** Whether the layer is currently open. */
	isOpen: boolean;

	/** Element id of the layer surface, so taps inside it count as inside. */
	layerId: string;

	/** The trigger element the layer is anchored to. Upstream's `triggerRef`. */
	trigger: HTMLElement | null;

	/** Open the layer immediately, with no hover delay. */
	show: () => void;

	/** Close the layer immediately. */
	hide: () => void;
}

export interface UseTouchTriggerReturn {
	/**
	 * Whether the pointer in play on this trigger has no hover of its own: a
	 * finger, or a pen that has landed. A hovering pen reads as false, because
	 * it hovers. Upstream's `isTouchPointerRef`.
	 */
	readonly isTouchPointer: boolean;

	/**
	 * Whether the interaction in flight is a touch one. Unlike the raw flag this
	 * goes false again as soon as the user reaches for the keyboard, so
	 * focus-driven triggers stay available after a tap.
	 */
	isTouchInteraction: () => boolean;

	/**
	 * Attach to the trigger: records pointer type ahead of synthesized hover.
	 * Arrival alone only marks a finger — a pen hovers, so it is left to the
	 * hover path until it presses.
	 */
	handlePointerEnter: (event: PointerEvent) => void;

	/**
	 * Attach to the trigger. Returns true when the press was a touch one and
	 * this hook has dealt with it, meaning the caller's own pointer-down
	 * behavior must not also run.
	 */
	handlePointerDown: (event: PointerEvent) => boolean;

	/** Forget a tap-open. Call from every other close path (Escape, controlled). */
	clearTapOpen: () => void;
}

/**
 * Touch behavior shared by the hover layers.
 *
 * @example
 * ```ts
 * const touch = useTouchTrigger(() => ({
 * 	touchTrigger: options().touchTrigger ?? 'auto',
 * 	isEnabled: options().isEnabled ?? true,
 * 	isControlled: options().isOpen !== undefined,
 * 	isOpen: layer.isOpen,
 * 	layerId: layer.id,
 * 	trigger,
 * 	show: showNow,
 * 	hide: hideNow
 * }));
 * ```
 */
export function useTouchTrigger(options: () => UseTouchTriggerOptions): UseTouchTriggerReturn {
	let isTouchPointer = false;

	// Whether a tap is what opened the layer. Only a tap-open owes the user an
	// outside-tap dismissal: a hover-opened layer already closes on
	// pointer-leave, and a controlled one is not ours to close.
	let isTapOpen = false;
	let outsideListener: ((event: PointerEvent) => void) | null = null;

	/**
	 * Narrowed so the open→closed effect below re-runs on a change of value
	 * rather than on every read of the options getter — upstream's `[isOpen]`.
	 */
	const isOpen = $derived(options().isOpen);

	$effect(() => {
		trackInteractionModality();
	});

	function disarmOutsideDismiss(): void {
		isTapOpen = false;
		const listener = outsideListener;
		if (listener == null) {
			return;
		}
		outsideListener = null;
		document.removeEventListener('pointerdown', listener, true);
	}

	// Capture phase, so a trigger that stops propagation cannot strand an open
	// layer. The opening tap's own capture phase at the document has already
	// passed by the time this runs, so the listener never sees it.
	function armOutsideDismiss(): void {
		isTapOpen = true;
		if (outsideListener != null) {
			return;
		}

		const handleOutsidePointerDown = (event: PointerEvent): void => {
			const target = event.target as Node | null;
			if (target != null) {
				// The trigger's own handler owns the toggle.
				if (options().trigger?.contains(target) === true) {
					return;
				}
				// Hover card content is interactive; a tap inside it is not a dismiss.
				if (document.getElementById(options().layerId)?.contains(target) === true) {
					return;
				}
			}
			disarmOutsideDismiss();
			options().hide();
		};

		outsideListener = handleOutsidePointerDown;
		document.addEventListener('pointerdown', handleOutsidePointerDown, true);
	}

	// Nothing tracked, so this runs once and its teardown is the whole point —
	// upstream's `useEffect(() => disarmOutsideDismiss, …)`.
	$effect(() => disarmOutsideDismiss);

	function isTouchInteraction(): boolean {
		return isTouchPointer && getInteractionModality() === 'pointer';
	}

	function handlePointerEnter(event: PointerEvent): void {
		// Only a finger is hoverless on arrival. A pen in detection range hovers
		// like a mouse, and treating its arrival as touch would bail out of the
		// hover path and leave a stylus user with no tooltip at all. A pen that
		// presses is a tap, and `handlePointerDown` still reads it as one.
		isTouchPointer = event.pointerType === 'touch';
	}

	function handlePointerDown(event: PointerEvent): boolean {
		const isTouch = TOUCH_POINTER_TYPES.has(event.pointerType);
		isTouchPointer = isTouch;

		const { touchTrigger, isEnabled, isControlled, trigger, show, hide } = options();

		if (!isTouch || isControlled) {
			return false;
		}

		const mode =
			touchTrigger === 'auto'
				? trigger != null && isActionTrigger(trigger)
					? 'none'
					: 'tap'
				: touchTrigger;

		if (mode === 'none' || !isEnabled) {
			// A layer left open by an earlier tap must not survive the next one.
			disarmOutsideDismiss();
			hide();
			return true;
		}

		// A lazily mounted layer reports `isOpen` a tick after `show()`, so the
		// tap's own bookkeeping is what makes the second tap a close.
		if (isOpen || isTapOpen) {
			disarmOutsideDismiss();
			hide();
			return true;
		}

		armOutsideDismiss();
		show();
		return true;
	}

	// A layer closed by any other path (Escape, a consumer, the browser) leaves
	// no tap-open to dismiss. Only a true open→closed transition counts: a
	// lazily mounted layer still reports `false` for a tick after the tap asked
	// it to open, and reading that as a close would disarm the dismissal the
	// tap-open just armed.
	let wasOpen = untrack(() => options().isOpen);
	$effect(() => {
		const nextIsOpen = isOpen;
		if (wasOpen && !nextIsOpen) {
			disarmOutsideDismiss();
		}
		wasOpen = nextIsOpen;
	});

	return {
		get isTouchPointer() {
			return isTouchPointer;
		},
		isTouchInteraction,
		handlePointerEnter,
		handlePointerDown,
		clearTapOpen: disarmOutsideDismiss
	};
}
