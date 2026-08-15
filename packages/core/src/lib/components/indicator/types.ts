import type { Component, Snippet } from 'svelte';
import type { BaseProps } from '../../base-props.js';

/**
 * Ported from Astryx's `Indicator/types.ts`.
 *
 * An **indicator** is a decorative visual that expresses a piece of component
 * state: the box a checkbox draws, the circle a radio draws, the mark on a
 * chosen list option. The owning component keeps the input, role, accessible
 * name, focus, and keyboard behavior; the indicator turns state into a picture.
 *
 * Componentizing them buys three things a theme could not otherwise have:
 *
 *   1. **Theme it** — an indicator renders stable `astryx-*` class targets, so
 *      `defineTheme({components})` restyles it like any other component, in one
 *      place rather than per host component.
 *   2. **Swizzle it** — `astryx swizzle <Name>` copies the source to own.
 *   3. **Replace it** — `defineTheme({indicators})` swaps in another component
 *      by name, and every component that renders that indicator follows. A
 *      product that wants radio visuals for single selection replaces `check`.
 *
 * Indicators come in **families**, and a family fixes the state space. That is
 * what lets one mechanism serve semantics as different as "is this option
 * chosen" and "are several of these chosen" without either pretending to be
 * the other, and without a shared enum that would typecheck `indeterminate` on
 * a radio.
 *
 * Each family's vocabulary is the one the accessibility layer already uses, so
 * a component passing state down says the same word its ARIA attribute says.
 * Sharing one enum across families was measured and rejected upstream (#4831):
 * it produced call sites reading `aria-expanded={isOpen}` beside
 * `state={isOpen ? 'on' : 'off'}`.
 */

/**
 * The indicator families, each mapped to the states it can express.
 *
 * Single and multi selection are separate families because their state spaces
 * genuinely differ: `aria-checked` is `true|false` for a radio and
 * `true|false|mixed` for a checkbox. Keeping them apart is what makes a
 * replacement type-checkable — a checkbox visual cannot stand in where only
 * two states are ever passed, and a radio cannot be asked to draw a partial
 * state it has no picture for.
 *
 * Adding a family is additive: declare it here, then declare indicators of
 * that family in {@link IndicatorMap}. Packages outside core can contribute
 * families through module augmentation.
 */
export interface IndicatorFamilyMap {
	/** Is this one thing chosen? Radios, and the mark on a selected option. */
	singleSelection: 'unchecked' | 'checked';
	/** Which of these are chosen? Checkboxes, including the partial state. */
	multiSelection: 'unchecked' | 'checked' | 'indeterminate';
}

export type IndicatorFamily = keyof IndicatorFamilyMap & string;

/** The states an indicator of family `F` can be asked to draw. */
export type IndicatorState<F extends IndicatorFamily = IndicatorFamily> = IndicatorFamilyMap[F];

/** Indicator size scale — matches the control sizes of the owning inputs. */
export type IndicatorSize = 'sm' | 'md';

/**
 * Which edge of its row an indicator sits on.
 *
 * Logical, not physical: `start` is the left edge in LTR and the right edge in
 * RTL. Owned by the host component, not by the indicator — an indicator draws a
 * picture and has no say in where the row puts it — which is why this is a prop
 * on the components that lay out rows rather than part of
 * {@link IndicatorProps}.
 */
export type IndicatorPosition = 'start' | 'end';

/**
 * Props every indicator accepts.
 *
 * Indicators are **decorative**: they render `aria-hidden` visuals and own no
 * role, focus, keyboard handling, or state. The component that renders one
 * (CheckboxInput, RadioListItem, a listbox option) keeps all of that. An
 * indicator's only job is to turn `state` into a picture.
 *
 * The a11y props are omitted from this interface rather than left to
 * convention: un-hiding an indicator has it announced next to the control that
 * owns the accessible name — the same thing said twice (#4918). A replacement
 * that genuinely needs announcing is not an indicator; name the owning control.
 *
 * `tabIndex` is omitted for the same reason, one step on: the element is
 * unconditionally `aria-hidden`, so a tab stop on it is a focusable node inside
 * a hidden subtree — an axe `aria-hidden-focus` violation.
 *
 * **The omission enforces differently here than upstream, and it is worth
 * knowing how.** Upstream's note is about JSX: TypeScript exempts hyphenated
 * JSX attribute names from excess-property checking, so a literal `role=` is a
 * compile error while `aria-hidden` is not. Svelte has no such exemption — a
 * literal `aria-hidden` on a component *is* checked against the props type, so
 * the `Omit` rejects more here than it does there. What matches upstream
 * exactly is the runtime guarantee: each indicator emits its own `aria-hidden`
 * **after** `{...rest}`, so a forwarded one loses regardless of what the type
 * caught. Nothing else is stripped — a forwarded `aria-label` still reaches the
 * DOM, inert inside an `aria-hidden` subtree.
 *
 * Interaction state is deliberately *not* a prop. Hover and focus reach an
 * indicator through the CSS ancestor marker ({@link indicatorScope}) applied
 * by its owner, so a row hover tints the control without anyone threading a
 * boolean through the tree — and an owner that should not tint its indicator
 * simply does not apply the marker.
 */
export interface IndicatorProps<F extends IndicatorFamily = IndicatorFamily> extends Omit<
	BaseProps<HTMLSpanElement>,
	'aria-hidden' | 'role' | 'aria-label' | 'aria-labelledby' | 'tabindex'
> {
	/** Which state to draw. The state space is fixed by the family. */
	state: IndicatorState<F>;
	/**
	 * Control size.
	 * @default 'md'
	 */
	size?: IndicatorSize;
	/**
	 * Whether the owning control is disabled. Purely visual — the owner still
	 * owns the actual disabled semantics.
	 * @default false
	 */
	isDisabled?: boolean;
	/**
	 * Content rendered inside the indicator chrome *instead of* the state mark.
	 * CheckboxInput uses this to show a loading Spinner inside the box while a
	 * change action is pending.
	 *
	 * Upstream guards this with `isRenderable(children)` rather than a null
	 * check, because the React idiom a host writes is
	 * `children={isBusy && <Spinner/>}` — which passes `false` when idle, and
	 * `false` is neither `null` nor caught by `??`, so a null check took the
	 * children branch and **deleted the state mark** on every selected row
	 * (#4913). A Svelte snippet has no such falsy-but-present form: it is a
	 * `Snippet` or it is `undefined`, and a host writes
	 * `children={isBusy ? spinner : undefined}`. So the null check that was a
	 * bug upstream is the correct test here, and `isRenderable` has nothing to
	 * do — which is why this port never adopted it.
	 */
	children?: Snippet;
}

/** An indicator is any component accepting {@link IndicatorProps} of its family. */
export type IndicatorComponent<F extends IndicatorFamily = IndicatorFamily> = Component<
	IndicatorProps<F>
>;

/**
 * The named indicators a theme can replace, each mapped to its family.
 *
 * The name is what a theme addresses, and what every component renders
 * through — so replacing `check` reaches every single-selection mark at once,
 * which is the point.
 *
 * Packages outside core can contribute their own through module augmentation.
 * Core ships no default for a name it does not know, so the package that adds
 * the name owns its default — `getIndicator`/`useIndicator` return
 * `| undefined` for it, and the call site supplies the fallback:
 *
 * @example
 * ```ts
 * declare module '@astryx-svelte/core' {
 *   interface IndicatorMap {
 *     'brand-star': 'singleSelection';
 *   }
 * }
 *
 * const Star = $derived(useIndicator('brand-star').current ?? BrandStar);
 * ```
 */
export interface IndicatorMap {
	/** The mark on a chosen option — a checkmark by default. */
	check: 'singleSelection';
	/** The filled circle of a radio control. */
	radio: 'singleSelection';
	/** The box of a checkbox control, including its partial state. */
	checkbox: 'multiSelection';
}

export type IndicatorName = keyof IndicatorMap & string;

/** The indicator names belonging to family `F`. */
export type IndicatorNameOfFamily<F extends IndicatorFamily> = {
	[N in IndicatorName]: IndicatorMap[N] extends F ? N : never;
}[IndicatorName];

/**
 * Theme-provided indicator overrides, keyed by indicator name.
 *
 * Family-checked: each entry must accept the state space of that indicator's
 * family, so a replacement cannot be written against the wrong states. A
 * `check` replacement that only handles `collapsed`/`expanded`, or a `radio`
 * replacement expecting `indeterminate`, is a type error rather than a
 * runtime surprise.
 */
export type IndicatorRegistry = {
	[N in IndicatorName]?: IndicatorComponent<IndicatorMap[N]>;
};
