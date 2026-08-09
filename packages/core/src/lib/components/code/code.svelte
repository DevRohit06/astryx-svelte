<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { CodeColor, CodeSize } from './code.stylex.js';

	export interface CodeProps extends BaseProps<HTMLElement> {
		color?: CodeColor;
		/** `inherit` adopts the surrounding text's size and leading. */
		size?: CodeSize;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { codeAttrs } from './code.stylex.js';

	/**
	 * Inline code — a `<code>` in the monospace family on a muted background.
	 *
	 * For fenced blocks with syntax highlighting, use `CodeBlock`.
	 */
	const {
		color = 'primary',
		size,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: CodeProps = $props();

	const attrs = $derived(codeAttrs(color, size, xstyle));
	const theme = $derived(themeProps('code', { color }));
</script>

<code
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</code>
