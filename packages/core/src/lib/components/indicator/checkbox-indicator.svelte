<script lang="ts" module>
	import type { IndicatorProps } from './types.js';

	/**
	 * The default checkbox visual's props: {@link IndicatorProps} of the
	 * `multiSelection` family, which is the family that has a partial state.
	 */
	export type CheckboxIndicatorProps = IndicatorProps<'multiSelection'>;
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		checkboxIndicatorBoxAttrs,
		checkboxIndicatorCheckmarkAttrs,
		checkboxIndicatorIndeterminateAttrs
	} from './checkbox-indicator.stylex.js';

	/**
	 * The default checkbox visual: a square box with a checkmark or an
	 * indeterminate bar.
	 *
	 * Decorative and non-interactive — it renders `aria-hidden` and owns no input,
	 * role, or focus behavior. The focus ring lives on the owner's control wrapper
	 * (see CheckboxInput), so a theme that replaces this component keeps a visible
	 * focus indicator for free. Themes replace it wholesale through
	 * `defineTheme({indicators: {checkbox: MyCheckbox}})`, or restyle it through
	 * the `checkbox-indicator` theme target like any other component.
	 *
	 * @example
	 * ```svelte
	 * <CheckboxIndicator state="indeterminate" size="sm" />
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
	}: CheckboxIndicatorProps = $props();

	const isChecked = $derived(state === 'checked');
	const isIndeterminate = $derived(state === 'indeterminate');
	const isCheckedOrIndeterminate = $derived(isChecked || isIndeterminate);

	const box = $derived(
		checkboxIndicatorBoxAttrs(size, isCheckedOrIndeterminate, isDisabled, xstyle)
	);
	const checkmark = $derived(checkboxIndicatorCheckmarkAttrs(size, isChecked));
	const indeterminate = $derived(checkboxIndicatorIndeterminateAttrs(size, isIndeterminate));

	const theme = $derived(
		themeProps(
			'checkbox-indicator',
			{
				size,
				checked: isChecked ? 'checked' : isIndeterminate ? 'indeterminate' : null,
				disabled: isDisabled ? 'disabled' : null
			},
			// `checkbox` was the target before indicators existed; themes styling
			// it keep working until the next major.
			{ legacyNames: ['checkbox'] }
		)
	);
</script>

<!--
	`{...rest}` first, own contract after. `aria-hidden` is set AFTER the spread
	so a forwarded one cannot win — the props type omits it, but the attribute
	order is what actually holds the guarantee at runtime, and it is the half of
	the mechanism that does not depend on the type system.
-->
<span
	{...rest}
	{...theme}
	class={cx(theme.class, box.class, className)}
	style={mergeStyle(box.style, styleProp as string | undefined)}
	aria-hidden="true"
>
	{#if children}
		{@render children()}
	{:else}
		<svg viewBox="0 0 10 10" class={checkmark.class} style={checkmark.style}>
			<path
				d="M8.5 2.5L4 7.5L1.5 5"
				stroke="currentColor"
				stroke-width="1.5"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span class={indeterminate.class} style={indeterminate.style}></span>
	{/if}
</span>
