/**
 * @file Core design principles.
 *
 * Upstream's prose, with the four rules that name a React API restated against
 * this port's: controlled inputs are `bind:value` rather than `value + onChange`,
 * and the CLI verb in every cross-reference carries this port's bin name.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'principles',
	title: 'Principles',
	category: 'guide',
	description: 'Core design principles and rules for building with the design system.',

	sections: [
		{
			title: 'Design Philosophy',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'A design system that prioritizes consistency, adaptability, and developer experience. Every decision flows from a few core ideas:'
				},
				{
					type: 'list',
					style: 'unordered',
					items: [
						'Components over primitives: use components for everything they cover before reaching for raw HTML',
						'Semantic tokens over hardcoded values: colors, spacing, and radii are named by purpose, not appearance',
						'Theme-agnostic code: your app code never references specific colors or measurements, so themes and dark mode work automatically',
						'Open internals: every primitive is exported and composable, so you can build on top of it without fighting it'
					]
				}
			]
		},
		{
			title: 'Rules',
			category: 'guide',
			content: [
				{
					type: 'list',
					style: 'ordered',
					items: [
						'Use components for everything they cover',
						'Layout is frame-first: pick the shell and budget regions before writing content (see `astryx-svelte docs layout`)',
						'Dense data renders as rows (Table, List/Item), edge-to-edge with dividers; Card is for widgets, galleries, and settings groups',
						'StyleX or Tailwind for custom styling; both are first-class (see `astryx-svelte docs styling`)',
						'Semantic tokens, not hardcoded values (see `astryx-svelte docs tokens`)',
						'CSS custom properties for colors, not hex values',
						'Form inputs are controlled: bind with `bind:value` (or pass `value` and an `onchange` handler)',
						'Use useLinkComponent() for navigation so consumers can plug in their framework router via LinkProvider'
					]
				}
			]
		},
		{
			title: 'Styling Approach',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'The design system supports multiple styling approaches. Every component accepts an `xstyle` prop for StyleX style overrides authored with `stylex.create()` in a sibling `.stylex.ts` module. For layout and wrapper styling outside of components, use StyleX, scoped `<style>` blocks, or Tailwind utilities; all resolve to the same design tokens.'
				},
				{
					type: 'prose',
					text: 'See `astryx-svelte docs styling` for the complete guide with examples.'
				}
			]
		},
		{
			title: 'Anti-Patterns',
			category: 'guide',
			content: [
				{
					type: 'list',
					style: 'dont',
					items: [
						'Inline styles on raw elements. Use xstyle on components',
						'Hardcoded colors (#fff). Use var(--color-*) or Tailwind semantic classes (text-primary, bg-surface)',
						'Hardcoded spacing (16px). Use spacing tokens or Tailwind spacing utilities',
						'Hardcoded <a> elements. Use useLinkComponent() so consumers can swap in their framework router via LinkProvider',
						'Wrapping every list item or page section in a Card. Decide the frame first; dense data renders as rows (see `astryx-svelte docs layout`)',
						'Badge as decoration. Reserve Badge for counts and enumerated states; use StatusDot or Token for status',
						'Inventing props. Read component docs first'
					]
				}
			]
		},
		{
			title: 'Design Tokens',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'The design system provides semantic design tokens for spacing, color, radius, shadow, typography, and size. Tokens adapt to the active theme and color mode. Run `astryx-svelte docs tokens` for the full reference with all values.'
				}
			]
		}
	]
};
