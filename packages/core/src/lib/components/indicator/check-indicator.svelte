<script lang="ts" module>
	import type { IndicatorProps } from './types.js';

	/**
	 * The default single-selection mark's props: {@link IndicatorProps} of the
	 * `singleSelection` family.
	 */
	export type CheckIndicatorProps = IndicatorProps<'singleSelection'>;
</script>

<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import Icon from '../icon/icon.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { checkIndicatorIconSize, checkIndicatorSlotAttrs } from './check-indicator.stylex.js';

	/**
	 * The default single-selection mark: a checkmark when chosen, nothing when not.
	 *
	 * This is the indicator a product replaces to change what "chosen" looks like.
	 * `defineTheme({indicators: {check: RadioIndicator}})` turns every
	 * single-selection mark into a radio, in one line, without any component
	 * knowing it happened.
	 *
	 * It draws NOTHING when unchecked, which is what makes it the default: a
	 * listbox should not show an empty box beside every row. A replacement is free
	 * to draw in both states — a radio does — and hosting components render the
	 * indicator unconditionally so that works.
	 *
	 * Unlike the checkbox and radio indicators, this one renders no chrome of its
	 * own: it IS the glyph. Two consequences, both deliberate:
	 *
	 *   - It renders `Icon` directly rather than wrapping one, so the class the
	 *     host passes (`selector-check`, say) lands on the same element as
	 *     `astryx-icon` — one element carrying the mark and its theme target, per
	 *     the wrapper reduction in #4838/#4846.
	 *   - It adds NO theme target of its own. `astryx-checkbox-indicator` and
	 *     `astryx-radio-indicator` exist because those indicators draw chrome that
	 *     needs styling; a check is an icon, and `astryx-icon` plus the host's
	 *     target already reach it.
	 *
	 * Decorative and non-interactive — it renders `aria-hidden` and owns no role,
	 * state, or focus behavior; the option or row that hosts it keeps all of that.
	 *
	 * @example
	 * ```svelte
	 * <CheckIndicator state={isSelected ? 'checked' : 'unchecked'} size="sm" />
	 * ```
	 */
	const {
		state,
		size = 'md',
		isDisabled = false,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: CheckIndicatorProps = $props();

	const isChecked = $derived(state === 'checked');

	const slot = $derived(checkIndicatorSlotAttrs(isDisabled, xstyle));

	/**
	 * An indicator declares span props while `Icon` declares SVG ones, so the
	 * handler types differ nominally. For a registry icon the element that
	 * actually receives these IS a span, so forwarding them is correct at
	 * runtime; the cast only reconciles the two declarations.
	 */
	const iconRest = $derived(rest as Omit<SVGAttributes<SVGSVGElement>, 'color'>);
</script>

<!--
	`children` (a pending Spinner, say) replaces the mark but keeps the
	indicator's place, matching the other indicators' contract. It is checked
	BEFORE `state`: a host passes a busy visual through in whatever state the row
	happens to be in, and an unchecked listbox row is the common one.

	Upstream needs `isRenderable` here rather than a null check, because
	`children={isBusy && <Spinner/>}` passes `false` when idle and a null check
	took this branch, rendered nothing in it, and deleted the mark on a chosen
	row (#4893). A snippet has no falsy-but-present form, so the plain check is
	the correct translation — see the note on `IndicatorProps.children`.

	There is no glyph to hang the caller's props on in this branch, so they go on
	a span — every one of them, so a `data-testid`, an `id`, a handler or an
	`xstyle` behaves the same whether or not children are present.
-->
{#if children}
	<span
		{...rest}
		class={cx(slot.class, className)}
		style={mergeStyle(slot.style, styleProp as string | undefined)}
		aria-hidden="true"
	>
		{@render children()}
	</span>
{:else if isChecked}
	<!--
		Nothing to draw when unchecked, and no box to reserve: an unmarked row
		keeps the layout it would have without this indicator.

		`aria-hidden` after the spread, deliberately. `Icon` puts its own a11y
		defaults BEFORE its rest props as a documented escape hatch, which is right
		for an icon and wrong for an indicator — this one is decorative by
		contract, so it re-asserts it rather than inheriting the hatch.

		The focus ring rides in through `xstyle`, but never paints here: it only
		activates under an owner's `indicatorScope` marker, and a listbox row that
		marks selection takes focus itself rather than marking its indicator.
	-->
	<Icon
		{...iconRest}
		aria-hidden="true"
		icon="check"
		size={checkIndicatorIconSize(size)}
		color={isDisabled ? 'disabled' : 'accent'}
		{xstyle}
		class={className}
		style={styleProp}
	/>
{/if}
