<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CommandPaletteListProps extends BaseProps<HTMLDivElement> {
		/** Command palette items, groups, empty states, etc. */
		children: Snippet;

		/**
		 * Accessible label for the listbox.
		 * @default 'Commands'
		 */
		label?: string;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useCommandPaletteContext } from './command-palette-context.svelte.js';
	import { commandPaletteListAttrs } from './command-palette-list.stylex.js';

	/**
	 * Scrollable results container for the command palette, ported from Astryx's
	 * `CommandPalette/CommandPaletteList.tsx`. Renders as a listbox for ARIA
	 * compliance.
	 *
	 * When used inside `CommandPalette`, automatically gets the correct id for
	 * `aria-controls` linking with the input.
	 */
	const {
		children,
		label: labelFromProps,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CommandPaletteListProps = $props();

	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.commandPalette.list.label'));

	const ctx = useCommandPaletteContext();

	const theme = $derived(themeProps('command-palette-list'));
	const attrs = $derived(commandPaletteListAttrs(xstyle));
</script>

<div
	{...rest}
	id={ctx?.().listId}
	role="listbox"
	aria-label={label}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{@render children()}
</div>
