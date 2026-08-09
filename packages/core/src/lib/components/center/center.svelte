<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';
	import type { CenterAxis } from './center.stylex.js';

	export interface CenterProps extends BaseProps<HTMLDivElement> {
		/**
		 * - `both`: centre on both axes (default)
		 * - `horizontal`: `justify-content: center` only
		 * - `vertical`: `align-items: center` only
		 * @default 'both'
		 */
		axis?: CenterAxis;
		/** Numbers are pixels; strings are used as-is (`'100%'`). */
		width?: SizeValue;
		height?: SizeValue;
		maxWidth?: SizeValue;
		minHeight?: SizeValue;
		/**
		 * Inner padding on all sides, on the spacing scale.
		 *
		 * The same prop `Stack`, `Card`, `LayoutContent` and `LayoutPanel` carry, so
		 * centred page content needs no wrapper for basic padding.
		 */
		padding?: SpacingStep;
		/** Inline (horizontal) padding. Overrides `padding` on the inline axis. */
		paddingInline?: SpacingStep;
		/** Block (vertical) padding. Overrides `padding` on the block axis. */
		paddingBlock?: SpacingStep;
		/**
		 * Render as `inline-flex`, for centring inside a run of text.
		 * @default false
		 */
		isInline?: boolean;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { centerAttrs } from './center.stylex.js';

	/**
	 * Centres its content with flexbox, on one axis or both.
	 */
	const {
		axis = 'both',
		width,
		height,
		maxWidth,
		minHeight,
		padding,
		paddingInline,
		paddingBlock,
		isInline = false,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: CenterProps = $props();

	// `padding` sets both axes; the per-axis props win on their own axis.
	const resolvedPaddingInline = $derived(paddingInline ?? padding);
	const resolvedPaddingBlock = $derived(paddingBlock ?? padding);

	const attrs = $derived(
		centerAttrs(
			{
				axis,
				isInline,
				width,
				height,
				maxWidth,
				minHeight,
				paddingInline: resolvedPaddingInline,
				paddingBlock: resolvedPaddingBlock
			},
			xstyle
		)
	);
	const theme = $derived(themeProps('center', { axis }));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</div>
