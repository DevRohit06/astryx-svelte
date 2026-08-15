import { FOCUS_OUTLINE_PARTS, FOCUS_OUTLINE_PARTS_NONE } from '../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `hooks/useIndicatorFocusRing.tsx`.
 *
 * A checkbox or radio focuses a native `<input>` that is `opacity: 0`, so the
 * visible focus indicator has to appear on the picture beside it — and that
 * picture is a themeable indicator, which is what makes "who draws the ring"
 * awkward:
 *
 * - Only the indicator's own element can shape the ring: `outline` follows
 *   that element's `border-radius`. Draw it on a wrapper and the owner has to
 *   hardcode a guess about whatever indicator it hosts (`RadioListItem` used to
 *   carry `border-radius: 50%` for a circle it did not own).
 * - But an indicator supplied by a theme is third-party code. If drawing the
 *   ring is its job, a replacement that simply doesn't ships a control with no
 *   visible focus (WCAG 2.4.7) — and that is the DEFAULT outcome: a theme
 *   author plausibly destructures `{state, size, isDisabled}` and drops the
 *   rest. Nothing can enforce otherwise; a component ignoring every prop is
 *   still assignable to `IndicatorComponent`.
 *
 * So the owner draws it, on the indicator's own element, imperatively at focus
 * time. No cooperation is required and none can be forgotten.
 *
 * **Inline style, not a class — and the reason differs from upstream's.**
 * Upstream's is React-specific: React replaces `className` wholesale on
 * re-render, so an injected class disappeared the moment the control changed
 * state. Svelte updates attributes surgically, so that particular failure does
 * not arise here. The conclusion is the same anyway, for a reason that holds in
 * both: the ring has to land on an element this hook does not render, and the
 * only channel to an arbitrary element it did not create is its `style`
 * property. Writing individual properties (rather than `cssText`) is what keeps
 * it from fighting whatever the indicator itself put there.
 *
 * There is a Svelte-shaped hazard in the same place, and it is why the
 * indicators leave `style` undefined when they have nothing to put in it: a
 * component that *does* render `style={...}` sets the whole attribute when the
 * value changes, which would wipe an imperative outline. Our indicators emit
 * `style` only when a caller supplies one or a dynamic style produces a var, so
 * a state flip re-renders `class` and leaves `style` alone.
 *
 * **`:focus-visible`, not `:focus`.** The CSS this replaces got
 * keyboard-vs-pointer for free; an event handler has to ask. Checking the
 * element keeps the browser's heuristic, including `focus({focusVisible:
 * true})`, which a hand-rolled modality guess would miss.
 */

export interface UseIndicatorFocusRingOptions {
	/**
	 * The element wrapping ONLY the indicator, so its single element child is
	 * unambiguously the thing to ring, whatever a theme renders there.
	 */
	container: HTMLElement | null;
	/** Skip the ring; a disabled control is not focusable. */
	isDisabled?: boolean;
}

export interface UseIndicatorFocusRingReturn {
	/** Wire onto the element that owns the focusable input. */
	focusProps: {
		onFocus: (event: FocusEvent) => void;
		onBlur: () => void;
	};
}

/**
 * Draw the standard focus ring on the indicator inside the container, shaped by
 * whatever that indicator actually is.
 *
 * Options arrive as a getter, per this port's hook convention, so the container
 * can be a `bind:this` target that is still `null` at call time.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let indicatorSlot = $state<HTMLElement | null>(null);
 *   const { focusProps } = useIndicatorFocusRing(() => ({
 *     container: indicatorSlot,
 *     isDisabled
 *   }));
 * </script>
 *
 * <div onfocusin={focusProps.onFocus} onfocusout={focusProps.onBlur}>
 *   <input type="checkbox" />
 *   <span bind:this={indicatorSlot}><CheckboxIndicator state="checked" /></span>
 * </div>
 * ```
 */
export function useIndicatorFocusRing(
	options: () => UseIndicatorFocusRingOptions
): UseIndicatorFocusRingReturn {
	function paint(on: boolean): void {
		// `firstElementChild`, not a search: the container holds the indicator
		// and nothing else, so there is no ambiguity — and no way for a later
		// sibling to quietly become the target.
		const indicator = options().container?.firstElementChild;
		if (indicator instanceof HTMLElement) {
			Object.assign(indicator.style, on ? FOCUS_OUTLINE_PARTS : FOCUS_OUTLINE_PARTS_NONE);
		}
	}

	function onFocus(event: FocusEvent): void {
		if (options().isDisabled ?? false) {
			return;
		}
		const target = event.target;
		if (target instanceof HTMLElement && !target.matches(':focus-visible')) {
			return;
		}
		paint(true);
	}

	function onBlur(): void {
		paint(false);
	}

	// No memoisation counterpart: upstream's `useCallback`/`useMemo` exist to
	// keep prop identity stable across React re-renders, and Svelte does not
	// re-run this body. The handlers are created once, which is what the
	// `useMemo` was buying.
	return { focusProps: { onFocus, onBlur } };
}
