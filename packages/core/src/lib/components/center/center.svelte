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
		/**
		 * Inline-start padding, using the spacing scale. Logical: the left edge in
		 * LTR, the right edge in RTL.
		 * Overrides `paddingInline` and `padding` on that edge only.
		 */
		paddingInlineStart?: SpacingStep;
		/**
		 * Inline-end padding, using the spacing scale. Logical: the right edge in
		 * LTR, the left edge in RTL.
		 * Overrides `paddingInline` and `padding` on that edge only.
		 */
		paddingInlineEnd?: SpacingStep;
		/** Block (vertical) padding. Overrides `padding` on the block axis. */
		paddingBlock?: SpacingStep;
		/**
		 * Block-start (top) padding, using the spacing scale.
		 * Overrides `paddingBlock` and `padding` on that edge only.
		 */
		paddingBlockStart?: SpacingStep;
		/**
		 * Block-end (bottom) padding, using the spacing scale.
		 * Overrides `paddingBlock` and `padding` on that edge only.
		 */
		paddingBlockEnd?: SpacingStep;
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
		paddingInlineStart,
		paddingInlineEnd,
		paddingBlock,
		paddingBlockStart,
		paddingBlockEnd,
		isInline = false,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: CenterProps = $props();

	// Resolve padding to per-edge values. Most specific wins, per edge:
	// edge prop -> axis prop -> `padding`.
	const resolvedPaddingInlineStart = $derived(paddingInlineStart ?? paddingInline ?? padding);
	const resolvedPaddingInlineEnd = $derived(paddingInlineEnd ?? paddingInline ?? padding);
	const resolvedPaddingBlockStart = $derived(paddingBlockStart ?? paddingBlock ?? padding);
	const resolvedPaddingBlockEnd = $derived(paddingBlockEnd ?? paddingBlock ?? padding);

	const attrs = $derived(
		centerAttrs(
			{
				axis,
				isInline,
				width,
				height,
				maxWidth,
				minHeight,
				paddingInlineStart: resolvedPaddingInlineStart,
				paddingInlineEnd: resolvedPaddingInlineEnd,
				paddingBlockStart: resolvedPaddingBlockStart,
				paddingBlockEnd: resolvedPaddingBlockEnd
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
