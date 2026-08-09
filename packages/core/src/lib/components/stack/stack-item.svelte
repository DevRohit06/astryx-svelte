<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StackItemCrossAlignSelf, StackItemSize } from './stack-item.stylex.js';

	export interface StackItemProps extends BaseProps<HTMLElement> {
		/** Overrides the stack's cross-alignment for this item alone. */
		crossAlignSelf?: StackItemCrossAlignSelf;
		/**
		 * - `static`: intrinsic size, neither grows nor shrinks (default)
		 * - `fill`: grows to fill the remaining space
		 * @default 'static'
		 */
		size?: StackItemSize;
		/**
		 * `overflow: auto`. StackItem already carries the flex `min-height: 0` /
		 * `min-width: 0` reset, so `<StackItem size="fill" isScrollable>` is a
		 * complete scroll region with no extra plumbing.
		 * @default false
		 */
		isScrollable?: boolean;
		/** @default 'div' */
		as?: keyof HTMLElementTagNameMap;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { stackItemAttrs } from './stack-item.stylex.js';

	/**
	 * Controls how one child behaves inside a `Stack`.
	 */
	const {
		crossAlignSelf,
		size,
		isScrollable,
		as = 'div',
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: StackItemProps = $props();

	const attrs = $derived(stackItemAttrs({ crossAlignSelf, size, isScrollable }, xstyle));
	const theme = $derived(themeProps('stack-item', { size }));
</script>

<svelte:element
	this={as}
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children?.()}
</svelte:element>
