<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface BlockquoteProps extends BaseProps<HTMLQuoteElement> {
		/** Attribution, rendered in a `<footer>` wrapping a `<cite>`. */
		cite?: Snippet;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { blockquoteAttrs, blockquoteCiteAttrs } from './blockquote.stylex.js';

	/**
	 * A quotation: semantic `<blockquote>` with a rule on the inline-start edge
	 * and secondary text colour.
	 */
	const {
		cite,
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: BlockquoteProps = $props();

	const attrs = $derived(blockquoteAttrs(xstyle));
	const citeAttrs = blockquoteCiteAttrs();
	const theme = themeProps('blockquote');
</script>

<blockquote
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
	{#if cite}
		<footer>
			<cite class={citeAttrs.class} style={citeAttrs.style}>{@render cite()}</cite>
		</footer>
	{/if}
</blockquote>
