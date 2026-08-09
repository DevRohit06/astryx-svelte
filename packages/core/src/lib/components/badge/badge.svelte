<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { BadgeVariant } from './badge.stylex.js';

	export interface BadgeProps extends BaseProps<HTMLSpanElement> {
		/** @default 'neutral' */
		variant?: BadgeVariant;
		/** The badge text. A snippet covers the cases a string can't. */
		label: string | Snippet;
		/** Rendered before the label. */
		icon?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { badgeAttrs } from './badge.stylex.js';

	/**
	 * A pill for a status, count or short label.
	 */
	const {
		variant = 'neutral',
		label,
		icon,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: BadgeProps = $props();

	const attrs = $derived(badgeAttrs(variant, xstyle));
	const theme = $derived(themeProps('badge', { variant }));
</script>

<span
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render icon?.()}
	{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}
</span>
