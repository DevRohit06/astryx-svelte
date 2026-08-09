<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SkeletonRadius } from './skeleton.stylex.js';

	export interface SkeletonProps extends BaseProps<HTMLDivElement> {
		/** Number for pixels, or any CSS length. @default '100%' */
		width?: number | string;
		/** Number for pixels, or any CSS length. @default '100%' */
		height?: number | string;
		/**
		 * `none` for sharp corners, `0`–`4` for the radius scale, `rounded` for a
		 * pill or circle.
		 * @default 3
		 */
		radius?: SkeletonRadius;
		/**
		 * Position in a run of skeletons. Sequential indices stagger the pulse
		 * into a wave.
		 * @default 0
		 */
		index?: number;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { skeletonAttrs } from './skeleton.stylex.js';

	/**
	 * A placeholder block that stands in for content while it loads.
	 */
	const {
		width = '100%',
		height = '100%',
		radius = 3,
		index = 0,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: SkeletonProps = $props();

	const attrs = $derived(skeletonAttrs({ width, height, radius, index }, xstyle));
	const theme = themeProps('skeleton');
</script>

<!-- Purely decorative, so it is hidden from assistive tech rather than
     announced as empty content — the surrounding region should carry the busy
     state (`aria-busy`). A consumer can override via props. -->
<div
	aria-hidden="true"
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
></div>
