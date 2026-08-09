<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CommandPaletteFooterProps extends BaseProps<HTMLDivElement> {
		/**
		 * Footer content. When provided, renders custom content instead of default
		 * hints. Custom children inherit the footer font treatment
		 * (supporting/12px, secondary color). When omitted, renders default
		 * keyboard navigation hints using `Kbd`.
		 */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import Kbd from '../kbd/kbd.svelte';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import {
		commandPaletteFooterAttrs,
		commandPaletteFooterHintAttrs
	} from './command-palette-footer.stylex.js';

	/**
	 * Footer for the command palette showing keyboard navigation hints, ported
	 * from Astryx's `CommandPalette/CommandPaletteFooter.tsx`.
	 *
	 * When no children are provided, renders default hints using `Kbd` for arrow
	 * keys, Enter to select, and Escape to close. The three hint labels are
	 * hard-coded English on both sides — upstream's catalogue has no keys for
	 * them, and inventing keys would be inventing API (the same standing
	 * `FileInput`/`MultiSelector` record).
	 */
	const {
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CommandPaletteFooterProps = $props();

	const theme = $derived(themeProps('command-palette-footer'));
	const attrs = $derived(commandPaletteFooterAttrs(xstyle));
	const hintAttrs = $derived(commandPaletteFooterHintAttrs());
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{#if children}
		{@render children()}
	{:else}
		<span class={hintAttrs.class} style={hintAttrs.style}>
			<Kbd keys="up" />
			<Kbd keys="down" />
			Navigate
		</span>
		<span class={hintAttrs.class} style={hintAttrs.style}>
			<Kbd keys="enter" />
			Select
		</span>
		<span class={hintAttrs.class} style={hintAttrs.style}>
			<Kbd keys="escape" />
			Close
		</span>
	{/if}
</div>
