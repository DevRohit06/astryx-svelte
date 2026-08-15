<script lang="ts" module>
	import type { IndicatorProps } from './types.js';

	/**
	 * The default radio visual's props: {@link IndicatorProps} of the
	 * `singleSelection` family, which has no partial state.
	 */
	export type RadioIndicatorProps = IndicatorProps<'singleSelection'>;
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { radioIndicatorCircleAttrs, radioIndicatorDotAttrs } from './radio-indicator.stylex.js';

	/**
	 * The default radio visual: a circle with a filled inner dot when selected.
	 *
	 * Decorative and non-interactive — it renders `aria-hidden` and owns no input,
	 * role, or focus behavior. Themes replace it wholesale through
	 * `defineTheme({indicators: {radio: MyRadio}})`, or restyle it through the
	 * `radio-indicator` / `radio-indicator-dot` theme targets like any other
	 * component.
	 *
	 * Unlike an icon, a radio draws in *both* states — an empty circle when
	 * unchecked. That is what makes it usable as a selection indicator in
	 * components whose default is "a checkmark when selected, nothing otherwise".
	 *
	 * @example
	 * ```svelte
	 * <RadioIndicator state="checked" size="md" />
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
	}: RadioIndicatorProps = $props();

	// A radio has no partial state; anything other than unchecked reads as
	// selected.
	const isChecked = $derived(state !== 'unchecked');

	const circle = $derived(radioIndicatorCircleAttrs(size, isChecked, isDisabled, xstyle));
	const dot = $derived(radioIndicatorDotAttrs(size));

	const theme = $derived(
		themeProps(
			'radio-indicator',
			{
				size,
				checked: isChecked ? 'checked' : null,
				disabled: isDisabled ? 'disabled' : null
			},
			// `radio` was the target before indicators existed; themes styling it
			// keep working until the next major.
			{ legacyNames: ['radio'] }
		)
	);

	const dotTheme = $derived(
		themeProps('radio-indicator-dot', { size }, { legacyNames: ['radio-dot'] })
	);
</script>

<!--
	`{...rest}` first, own contract after — see the note in
	`checkbox-indicator.svelte`. The `aria-hidden` after the spread is what
	enforces the decorative contract at runtime.
-->
<span
	{...rest}
	{...theme}
	class={cx(theme.class, circle.class, className)}
	style={mergeStyle(circle.style, styleProp as string | undefined)}
	aria-hidden="true"
>
	{#if children}
		{@render children()}
	{:else if isChecked}
		<span {...dotTheme} class={cx(dotTheme.class, dot.class)} style={dot.style}></span>
	{/if}
</span>
