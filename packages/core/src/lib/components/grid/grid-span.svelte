<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface GridSpanProps extends BaseProps<HTMLDivElement> {
		/** Columns to span, or `'full'` for the whole row (`1 / -1`). */
		columns?: number | 'full';
		/** Rows to span. */
		rows?: number;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { gridSpanAttrs, gridSpanStyle } from './grid-span.stylex.js';

	/**
	 * A direct child of `Grid` that spans more than one cell.
	 */
	const {
		columns,
		rows,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: GridSpanProps = $props();

	const attrs = $derived(gridSpanAttrs(xstyle));
	const theme = themeProps('grid-span');
	const span = $derived(gridSpanStyle(columns, rows));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, span, styleProp as string | undefined)}
>
	{@render children?.()}
</div>
