<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { Elevation, SizeValue, SpacingStep } from '../../internal/types.js';
	import type { CardVariant } from './card.stylex.js';

	export interface CardProps extends BaseProps<HTMLDivElement> {
		/** Numbers are pixels; strings are used as-is. */
		width?: SizeValue;
		/** A fixed height also makes the card scroll its content. */
		height?: SizeValue;
		maxWidth?: SizeValue;
		minHeight?: SizeValue;
		/**
		 * Inner padding, on the spacing scale. Left unset, the card takes the
		 * theme's `--astryx-card-padding` — which is how a theme retunes every card
		 * at once.
		 * @default 4 (16px)
		 */
		padding?: SpacingStep;
		/**
		 * - `default`: card background with a visible border
		 * - `transparent`: groups content without adding visual weight
		 * - `muted`: a de-emphasised surface
		 * - the rest tint the background from the matching colour token
		 * @default 'default'
		 */
		variant?: CardVariant;
		/**
		 * Resting elevation — the shadow depth the card sits at.
		 * `none` is flat; `low`/`med`/`high` map to the shadow token scale.
		 * @default 'none'
		 */
		elevation?: Elevation;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { cardAttrs } from './card.stylex.js';

	/**
	 * A container with a background, border and radius, which also publishes the
	 * container padding variables its layout children read.
	 */
	const {
		width,
		height,
		maxWidth,
		minHeight,
		padding,
		variant = 'default',
		elevation = 'none',
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: CardProps = $props();

	const attrs = $derived(
		cardAttrs({ variant, elevation, padding, width, height, maxWidth, minHeight }, xstyle)
	);
	const theme = $derived(themeProps('card', { variant }));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children?.()}
</div>
