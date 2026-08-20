<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';
	import type {
		StackCrossAlignment,
		StackDirection,
		StackMainAlignment,
		StackWrap
	} from './stack.stylex.js';

	/**
	 * Every alignment value Stack accepts. Which ones are valid depends on the
	 * axis: the main axis takes `start | center | end | between | around |
	 * evenly`, the cross axis takes `start | center | end | stretch`.
	 */
	export type StackAlignment = StackMainAlignment | StackCrossAlignment;

	export interface StackProps extends BaseProps<HTMLElement> {
		/** @default 'vertical' */
		direction?: StackDirection;
		/**
		 * Horizontal alignment. Main-axis (`justify-content`) when horizontal,
		 * cross-axis (`align-items`) when vertical.
		 */
		hAlign?: StackAlignment;
		/**
		 * Vertical alignment. Cross-axis (`align-items`) when horizontal,
		 * main-axis (`justify-content`) when vertical.
		 */
		vAlign?: StackAlignment;
		/** Main-axis alias, resolved by direction. Mirrors `justify-content`. */
		justify?: StackMainAlignment;
		/** Cross-axis alias, resolved by direction. Mirrors `align-items`. */
		align?: StackCrossAlignment;
		width?: SizeValue;
		height?: SizeValue;
		maxWidth?: SizeValue;
		minHeight?: SizeValue;
		/** Space between items, on the spacing scale. */
		gap?: SpacingStep;
		/** Inner padding on all sides, on the spacing scale. */
		padding?: SpacingStep;
		/** Inline padding. Overrides `padding` on the inline axis. */
		paddingInline?: SpacingStep;
		/** Block padding. Overrides `padding` on the block axis. */
		paddingBlock?: SpacingStep;
		/**
		 * `overflow: auto`. When the stack is itself a flex child that should
		 * scroll, pair it with a parent `StackItem size="fill" isScrollable` —
		 * StackItem carries the `min-height: 0` reset flex scroll regions need.
		 * @default false
		 */
		isScrollable?: boolean;
		/** @default 'nowrap' */
		wrap?: StackWrap;
		/** @default 'div' */
		as?: keyof HTMLElementTagNameMap;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle, sizingStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { stackAttrs } from './stack.stylex.js';

	/**
	 * Arranges items in a row or a column.
	 *
	 * `hAlign` and `vAlign` map onto the correct CSS axis for the direction, so
	 * the prop names stay physical while the CSS stays logical.
	 */
	const {
		direction = 'vertical',
		hAlign,
		vAlign,
		justify,
		align,
		gap,
		padding,
		paddingInline,
		paddingBlock,
		isScrollable,
		width,
		height,
		maxWidth,
		minHeight,
		wrap,
		as = 'div',
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: StackProps = $props();

	const isHorizontal = $derived(direction === 'horizontal');

	const resolvedHAlign = $derived(hAlign ?? (isHorizontal ? justify : align));
	const resolvedVAlign = $derived(vAlign ?? (isHorizontal ? align : justify));

	const mainAlign = $derived(
		(isHorizontal ? resolvedHAlign : resolvedVAlign) as StackMainAlignment | undefined
	);
	const crossAlign = $derived(
		(isHorizontal ? resolvedVAlign : resolvedHAlign) as StackCrossAlignment | undefined
	);

	// `padding` sets both axes; the per-axis props win on their own axis.
	const resolvedPaddingInline = $derived(paddingInline ?? padding);
	const resolvedPaddingBlock = $derived(paddingBlock ?? padding);

	const attrs = $derived(
		stackAttrs(
			{
				direction,
				crossAlign,
				mainAlign,
				gap,
				wrap,
				paddingInline: resolvedPaddingInline,
				paddingBlock: resolvedPaddingBlock,
				isScrollable
			},
			xstyle
		)
	);
	const theme = $derived(themeProps('stack', { direction, gap, wrap }));
	/**
	 * The sizing props go **after** the consumer's `style`, because upstream
	 * merges `{...style, ...sizingStyle}` — the props this component exists for
	 * win over a consumer declaration of the same property. Inline styles
	 * resolve by declaration order, so the order here *is* the precedence, and
	 * it was the other way round: `<Stack width={400} style="width:100%">` gave
	 * 100% here and 400px upstream.
	 *
	 * No upstream case covers it — none passes both `width` and `style` — so the
	 * ported suite is green either way. `AspectRatio` had the identical bug and
	 * upstream *does* have a case for it there, which is how the pair was found.
	 */
	const rootStyle = $derived(
		mergeStyle(
			attrs.style,
			styleProp as string | undefined,
			sizingStyle({ width, height, maxWidth, minHeight })
		)
	);
</script>

<svelte:element
	this={as}
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={rootStyle}
>
	{@render children?.()}
</svelte:element>
