<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { FormLayoutDirection, FormOptionality } from './form-layout-context.svelte.js';

	export interface FormLayoutProps extends BaseProps<HTMLDivElement> {
		/**
		 * The fields to arrange — Astryx inputs, or `Field`-wrapped custom
		 * controls.
		 */
		children?: Snippet;
		/**
		 * - `vertical` — fields stack top to bottom (default)
		 * - `horizontal` — equal-width columns, one child each, via CSS grid
		 * - `horizontal-labels` — labels to the left of inputs, collapsing to
		 *   vertical below 480px
		 * @default 'vertical'
		 */
		direction?: FormLayoutDirection;
		/**
		 * Which state the form treats as its default, so only the *exception*
		 * carries a visible optional/required indicator. It also resolves each
		 * field's `aria-required` so the unmarked majority is still announced
		 * correctly — but only `aria-required`, never the native `required`
		 * attribute, so a layout default can't switch on browser validation.
		 *
		 * - `optional` — fields read as optional; only a field with `isRequired`
		 *   shows an indicator (the "required" one).
		 * - `required` — fields read as required; only a field with `isOptional`
		 *   shows an indicator (the "optional" one). Fields without `isOptional`
		 *   expose `aria-required` even though they show no indicator.
		 * - unset — `isRequired` and `isOptional` each show their own indicator
		 *   independently.
		 *
		 * A field that merely restates the default (e.g. `isOptional` under
		 * `optional`) shows nothing. An inner `FormLayout` shadows an outer one.
		 */
		defaultOptionality?: FormOptionality;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { setFormLayoutContext } from './form-layout-context.svelte.js';
	import { formLayoutAttrs } from './form-layout.stylex.js';

	/**
	 * Spatial container for form fields.
	 *
	 * A `<div>`, not a `<form>` — submission is a separate concern. It publishes
	 * its direction so fields can adapt, and nests naturally: a horizontal layout
	 * inside a vertical one works without either knowing about the other.
	 *
	 * @example
	 * ```svelte
	 * <FormLayout>
	 *   <TextInput label="Name" bind:value={name} />
	 *   <TextInput label="Email" bind:value={email} />
	 * </FormLayout>
	 * ```
	 */
	const {
		children,
		direction = 'vertical',
		defaultOptionality,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: FormLayoutProps = $props();

	// The getter is the whole of upstream's
	// `useMemo(() => ({direction, defaultOptionality}), [...])`: a memo exists to
	// keep an object identity stable across renders, and a getter read at call
	// time never has a stale identity to keep.
	setFormLayoutContext(() => ({ direction, defaultOptionality }));

	const attrs = $derived(formLayoutAttrs(direction, xstyle));
	const theme = $derived(themeProps('form-layout', { direction }));
</script>

<div
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	{...rest}
>
	{@render children?.()}
</div>
