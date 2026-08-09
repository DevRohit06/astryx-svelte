<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { AspectRatioFit, AspectRatioShape } from './aspect-ratio.stylex.js';

	export interface AspectRatioProps extends BaseProps<HTMLDivElement> {
		/** Ratio as width / height: `16 / 9`, `4 / 3`, `1` for a square. */
		ratio: number;
		/**
		 * `ellipse` clips the box to an ellipse — a circle at `ratio={1}`. Pair it
		 * with `fit="cover"` so the media fills the clipped box.
		 * @default 'rectangle'
		 */
		shape?: AspectRatioShape;
		/**
		 * Lets the component size the child, so the child does not have to declare
		 * `width`/`height`/`object-fit` itself. Omitted, the child is left alone.
		 *
		 * `cover` and `contain` ship as zero-specificity baseline rules in
		 * `base.css` keyed on `data-astryx-aspect-ratio-override`, so anything the
		 * child sets for itself still wins. `fit` is structural rather than
		 * visual, so it is not part of the theming surface.
		 */
		fit?: AspectRatioFit;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { dataAttr } from '../../internal/naming.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { aspectRatioChildAttrs, aspectRatioContainerAttrs } from './aspect-ratio.stylex.js';

	/**
	 * Holds its content to a fixed width/height ratio — for images, video,
	 * embeds and placeholders.
	 */
	const {
		ratio,
		shape = 'rectangle',
		fit,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: AspectRatioProps = $props();

	const container = $derived(aspectRatioContainerAttrs(shape, xstyle));
	const child = $derived(aspectRatioChildAttrs(fit));
	const theme = $derived(themeProps('aspect-ratio', { shape }));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, container.class, className)}
	style={mergeStyle(container.style, `aspect-ratio:${ratio}`, styleProp as string | undefined)}
>
	<!-- The marker attribute carries the fit value so the base.css child sizing
	     can use direct-child selectors on this wrapper — the child's actual
	     parent — without depending on AspectRatio's internal structure. -->
	<div {...{ [dataAttr('aspect-ratio-override')]: fit }} class={child.class} style={child.style}>
		{@render children()}
	</div>
</div>
