<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { FormLayoutDirection } from './form-layout-context.svelte.js';

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
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: FormLayoutProps = $props();

	// The getter is the whole of upstream's `useMemo(() => ({direction}), [direction])`:
	// a memo exists to keep an object identity stable across renders, and there is
	// no object here to keep stable.
	setFormLayoutContext(() => direction);

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
