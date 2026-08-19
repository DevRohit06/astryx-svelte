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
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
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
	 * keys, Enter to select, and Escape to close. The three hint labels were
	 * hard-coded English on both sides until upstream 0.4.2 added catalogue keys
	 * for them (#4506); they now resolve from the locale catalogue like the rest
	 * of the package.
	 */
	const {
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CommandPaletteFooterProps = $props();

	const t = useTranslator();
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
			{t('@astryx.commandPalette.footer.navigate')}
		</span>
		<span class={hintAttrs.class} style={hintAttrs.style}>
			<Kbd keys="enter" />
			{t('@astryx.commandPalette.footer.select')}
		</span>
		<span class={hintAttrs.class} style={hintAttrs.style}>
			<Kbd keys="escape" />
			{t('@astryx.commandPalette.footer.close')}
		</span>
	{/if}
</div>
