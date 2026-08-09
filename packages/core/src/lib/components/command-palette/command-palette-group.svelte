<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CommandPaletteGroupProps extends BaseProps<HTMLDivElement> {
		/** Group heading text. */
		heading: string;
		/** Items within this group. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import {
		commandPaletteGroupAttrs,
		commandPaletteGroupHeadingAttrs
	} from './command-palette-group.stylex.js';

	/**
	 * Visual grouping for command palette items with a heading label, ported from
	 * Astryx's `CommandPalette/CommandPaletteGroup.tsx`.
	 *
	 * Heading style matches `DropdownMenu` section headings: supporting-size
	 * (12px), secondary color, no uppercase/letterSpacing.
	 */
	const {
		heading,
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CommandPaletteGroupProps = $props();

	const theme = $derived(themeProps('command-palette-group'));
	const headingTheme = $derived(themeProps('command-palette-group-heading'));
	const attrs = $derived(commandPaletteGroupAttrs(xstyle));
	const headingAttrs = $derived(commandPaletteGroupHeadingAttrs());
</script>

<!--
	`rest` is spread **last**, which is upstream's position for it — so a consumer's
	`role` or `aria-label` overrides the group's own. Observable, unlike most of the
	rest-position residue, because this element writes both.
-->
<div
	role="group"
	aria-label={heading}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	{...rest}
>
	<!--
		The heading is a theming target of its own, distinct from the group root, so
		a theme can restyle just the label. It stays decorative — the target is
		additive and does not change what assistive tech sees.
	-->
	<div
		aria-hidden="true"
		{...headingTheme}
		class={cx(headingTheme.class, headingAttrs.class)}
		style={headingAttrs.style}
	>
		{heading}
	</div>
	{@render children()}
</div>
