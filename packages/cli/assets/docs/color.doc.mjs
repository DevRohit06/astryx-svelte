/**
 * @file Semantic colour tokens.
 *
 * Prose is upstream's verbatim; the one code sample is re-authored, because it
 * imports `colorVars` from `@astryxdesign/core/theme/tokens.stylex` and this
 * port publishes no `defineVars` object from any subpath. The token names are
 * the surface, and `var(--token)` is how they are reached.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'color',
	title: 'Color',
	category: 'foundations',
	description: 'Semantic color tokens for surfaces, text, icons, borders, and status indicators.',
	tokenCategory: 'color',

	sections: [
		{
			title: 'Overview',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'Colors are semantic: tokens describe purpose, not appearance. Every color adapts automatically between light and dark modes via CSS light-dark(). Themes override the resolved values, so your code never references raw hex colors.'
				}
			]
		},
		{
			title: 'Surface Colors',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'Layered surface hierarchy: body → surface → card → popover. Each level sits visually above the previous one.'
				},
				{
					type: 'token-ref',
					topic: 'tokens',
					section: 'Color Tokens'
				}
			]
		},
		{
			title: 'Usage',
			category: 'foundations',
			content: [
				{
					type: 'code',
					lang: 'ts',
					label: 'Applying color tokens (page.stylex.ts)',
					code: `import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
	container: {
		backgroundColor: 'var(--color-background-surface)',
		color: 'var(--color-text-primary)',
		borderColor: 'var(--color-border)'
	},
	accent: {
		color: 'var(--color-text-accent)'
	}
});`
				},
				{
					type: 'prose',
					text: "Outside StyleX the same tokens work anywhere CSS does — a scoped `<style>` block, a global stylesheet, or an SVG `fill`. `tokenVar('--color-text-accent')` from `@astryx-svelte/core/theme` returns the same `var(...)` reference when a styling-library config needs it as a value."
				}
			]
		},
		{
			title: 'Best Practices',
			category: 'foundations',
			content: [
				{
					type: 'list',
					style: 'do',
					items: [
						'Use semantic tokens (--color-text-primary) instead of raw hex values.',
						'Rely on the surface hierarchy (body → surface → card → popover) for layering.',
						'Use status colors (success, error, warning) only for their semantic meaning.'
					]
				},
				{
					type: 'list',
					style: 'dont',
					items: [
						"Hardcode hex values, since they won't adapt to dark mode or custom themes.",
						'Mix accent colors with status colors in the same context.',
						'Use --color-on-accent on non-accent backgrounds.'
					]
				}
			]
		}
	]
};
