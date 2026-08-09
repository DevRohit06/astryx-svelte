<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface InputGroupTextProps extends BaseProps<HTMLDivElement> {
		/** The addon content — text or an icon. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { inputGroupTextAttrs } from './input-group-text.stylex.js';

	/**
	 * A static text or icon addon inside an `InputGroup` — a currency symbol, a
	 * URL scheme, a unit. Pure presentation: it sits flush against the adjacent
	 * member and shares its collapsed border.
	 *
	 * @example
	 * ```svelte
	 * <InputGroup label="Price">
	 *   <InputGroupText>$</InputGroupText>
	 *   <TextInput label="Amount" bind:value />
	 * </InputGroup>
	 * ```
	 */
	let {
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: InputGroupTextProps = $props();

	const theme = themeProps('input-group-text');
	const attrs = $derived(inputGroupTextAttrs(xstyle));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</div>
