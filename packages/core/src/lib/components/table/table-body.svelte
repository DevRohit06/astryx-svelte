<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface TableBodyProps extends BaseProps<HTMLTableSectionElement> {
		children: Snippet;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle, sx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';

	/** `<tbody>` wrapper, ported from Astryx's `Table/TableBody.tsx`. */
	let {
		children,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: TableBodyProps = $props();

	const theme = themeProps('table-body');
	const attrs = $derived(sx(xstyle));
</script>

<tbody
	{...rest}
	data-testid={testId}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</tbody>
