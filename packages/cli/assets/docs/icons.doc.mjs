/**
 * @file Icons reference doc: semantic icon names available in Astryx.
 *
 * The 28-name table is verbatim and checked against this port's own `IconName`
 * union in `components/icon/icon-registry.ts` — same 28 names, same order.
 *
 * The two code blocks are re-authored, because the *shape* of an icon differs.
 * Upstream's `IconType` is a React component and its registry holds React
 * elements, so a theme registers `close: <XMarkIcon />`. Here `IconType` is
 * `Component<SVGAttributes<SVGSVGElement>>` and `IconRegistry` is
 * `Record<IconName, Snippet>` — a bare component reference cannot carry the
 * preset props upstream's elements do, and a Snippet is a compiler construct,
 * so a theme's registry has to live in a `.svelte` module.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'icons',
	title: 'Icons',
	category: 'foundations',
	description:
		"Semantic icon names available in the design system. These adapt to the active theme's icon registry.",

	sections: [
		{
			title: 'Available Names',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'Components that accept an icon prop use IconType: either a semantic name string or a direct SVG component. The semantic names below are resolved through the global icon registry.'
				},
				{
					type: 'table',
					headers: ['Name', 'Usage'],
					rows: [
						['close', 'Dismiss, close dialogs/panels'],
						['chevronDown', 'Dropdown triggers, expand/collapse'],
						['chevronLeft', 'Navigate back, previous'],
						['chevronRight', 'Navigate forward, next'],
						['chevronsLeft', 'Jump to first, skip to start'],
						['chevronsRight', 'Jump to last, skip to end'],
						['check', 'Checkbox checked, confirm'],
						['success', 'Success status indicator'],
						['error', 'Error status indicator'],
						['warning', 'Warning status indicator'],
						['info', 'Info status indicator, tooltips'],
						['calendar', 'Date pickers, scheduling'],
						['clock', 'Time pickers, timestamps'],
						['externalLink', 'Links opening in new tab'],
						['menu', 'Hamburger menu, navigation toggle'],
						['moreHorizontal', 'Overflow menu, additional actions'],
						['search', 'Search inputs, find'],
						['arrowUp', 'Sort ascending, move up'],
						['arrowDown', 'Sort descending, move down'],
						['arrowsUpDown', 'Sortable column indicator'],
						['funnel', 'Filter controls'],
						['eyeSlash', 'Hidden/visibility toggle'],
						['viewColumns', 'Column visibility settings'],
						['copy', 'Copy to clipboard'],
						['checkDouble', 'Copied confirmation'],
						['wrench', 'Settings, configuration'],
						['stop', 'Stop/cancel action'],
						['microphone', 'Voice input, audio recording']
					]
				}
			]
		},
		{
			title: 'Custom Icons',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'For icons not in the semantic list, pass an SVG component directly. Any `Component<SVGAttributes<SVGSVGElement>>` works; Icon applies size and color styling automatically.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Using custom SVG components',
					code: `<script lang="ts">
	import { Icon } from '@astryx-svelte/core';
	import Photo from '@lucide/svelte/icons/image';
	import Heart from '@lucide/svelte/icons/heart';
</script>

<Icon icon={Photo} size="lg" />
<Icon icon={Heart} color="negative" />`
				}
			]
		},
		{
			title: 'Theme Overrides',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'Themes can replace the default SVGs for any semantic name with the `icons` field in `defineTheme()`. This lets you swap the icon set without touching component code, and keeps lookup scoped to the active theme instead of mutating global defaults.'
				},
				{
					type: 'prose',
					text: 'A registry entry is a `Snippet`, not a component reference — that is what lets a theme preset props on the glyph it registers (a size, an `aria-hidden`). Snippets are a compiler construct, so the registry lives in a `.svelte` module that renders nothing and exports its snippets from `<script module>`.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'icons.svelte — a theme icon registry',
					code: `<script module lang="ts">
	import type { IconRegistry } from '@astryx-svelte/core';

	export const brandIcons = { close, chevronDown } as Partial<IconRegistry>;
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
</script>

{#snippet close()}
	<X size="1em" aria-hidden="true" />
{/snippet}

{#snippet chevronDown()}
	<ChevronDown size="1em" aria-hidden="true" />
{/snippet}`
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Registering them on a theme',
					code: `import { defineTheme } from '@astryx-svelte/core/theme';
import { brandIcons } from './icons.svelte';

export const brandTheme = defineTheme({
	name: 'brand',
	icons: brandIcons
});`
				}
			]
		},
		{
			title: 'Adding New Icons',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'To add a new semantic icon name to the design system:'
				},
				{
					type: 'list',
					style: 'ordered',
					items: [
						'Add the name to the IconName union in packages/core/src/lib/components/icon/icon-registry.ts',
						'Add the default snippet to packages/core/src/lib/components/icon/default-icons.svelte',
						'Add a row to the Available Names table in packages/cli/assets/docs/icons.doc.mjs'
					]
				}
			]
		}
	]
};
