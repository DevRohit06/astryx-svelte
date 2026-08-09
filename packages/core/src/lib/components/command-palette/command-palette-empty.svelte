<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CommandPaletteEmptyProps extends BaseProps<HTMLDivElement> {
		/**
		 * The message or content to display.
		 *
		 * `string | Snippet` where upstream has `ReactNode` — the settled leaf-slot
		 * translation. The string branch is genuinely reachable here: `CommandPalette`
		 * passes its `emptySearchText`/`emptyBootstrapText` through, and both default
		 * to a translated string.
		 */
		children: string | Snippet;
	}
</script>

<script lang="ts">
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { commandPaletteEmptyAttrs } from './command-palette-empty.stylex.js';

	/**
	 * Empty state for the command palette list area, ported from Astryx's
	 * `CommandPalette/CommandPaletteEmpty.tsx`.
	 *
	 * Rendered automatically by `CommandPalette` in two situations:
	 * - `emptyBootstrapText`: no search term and `bootstrap()` returns nothing
	 * - `emptySearchText`: a search query returned no results
	 *
	 * Can also be composed manually inside a custom render function.
	 */
	const {
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CommandPaletteEmptyProps = $props();

	const theme = $derived(themeProps('command-palette-empty'));
	const attrs = $derived(commandPaletteEmptyAttrs(xstyle));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{#if typeof children === 'string'}{children}{:else}{@render children()}{/if}
</div>
