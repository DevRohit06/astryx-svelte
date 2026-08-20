<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';
	import type { GridAlignment, GridColumns } from './grid.stylex.js';

	export interface GridProps extends BaseProps<HTMLDivElement> {
		/** Fixed count, or a responsive `{minWidth, max?, repeat?}`. */
		columns?: GridColumns;
		/**
		 * Minimum width of each item, in pixels, switching the grid to auto-fit.
		 * @deprecated Use `columns={{ minWidth: 280 }}`.
		 * @default 0
		 */
		minChildWidth?: number;
		width?: SizeValue;
		height?: SizeValue;
		maxWidth?: SizeValue;
		minHeight?: SizeValue;
		/** Space between items, both axes. */
		gap?: SpacingStep;
		/** Space between rows. Overrides `gap`. */
		rowGap?: SpacingStep;
		/** Space between columns. Overrides `gap`. */
		columnGap?: SpacingStep;
		/**
		 * Height of each implicit row track, in pixels (`grid-auto-rows`). Pair it
		 * with `GridSpan rows={n}` for masonry-style layouts.
		 */
		rowHeight?: number;
		/**
		 * Vertical alignment of items (`align-items`).
		 * @default 'stretch'
		 */
		align?: GridAlignment;
		/**
		 * Horizontal alignment of items (`justify-items`).
		 * @default 'stretch'
		 */
		justify?: GridAlignment;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle, sizingStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { gridAttrs, resolveTemplateColumns } from './grid.stylex.js';

	/**
	 * A CSS Grid container.
	 *
	 * `columns={3}` gives three equal columns; `columns={{minWidth: 280}}` gives
	 * responsive ones that reflow on their own, with `max` to cap the count.
	 */
	const {
		columns,
		minChildWidth = 0,
		rowHeight,
		width,
		height,
		maxWidth,
		minHeight,
		gap,
		rowGap,
		columnGap,
		align,
		justify,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: GridProps = $props();

	const templateColumns = $derived(resolveTemplateColumns(columns, minChildWidth, gap, columnGap));

	const attrs = $derived(
		gridAttrs({ templateColumns, rowHeight, gap, rowGap, columnGap, align, justify }, xstyle)
	);

	// Only a fixed count is a meaningful variant to theme against; the responsive
	// form has no single column count to name.
	const theme = $derived(
		themeProps('grid', {
			columns: typeof columns === 'number' ? columns : undefined,
			gap,
			align,
			justify
		})
	);
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

<div {...rest} {...theme} class={cx(theme.class, attrs.class, className)} style={rootStyle}>
	{@render children?.()}
</div>
