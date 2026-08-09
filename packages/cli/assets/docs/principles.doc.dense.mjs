/** @type {import('@astryx-svelte/cli/authoring').ReferenceTranslationDoc} */
export const docsDense = {
	description: 'core design principles + rules for the design system',
	sections: [
		{
			section: 'Design Philosophy',
			title: 'Philosophy',
			content: [
				{
					type: 'list',
					items: [
						'components over primitives',
						'semantic tokens over hardcoded values',
						'theme-agnostic code',
						'open internals'
					]
				}
			]
		},
		{
			section: 'Rules',
			title: 'Rules',
			content: [
				{
					type: 'list',
					items: [
						'use components',
						'frame-first layout: shell + region budgets before content (astryx-svelte docs layout)',
						'dense data = rows (Table, List/Item) not Cards; Card = widgets/galleries/settings groups',
						'StyleX or Tailwind for styling',
						'semantic tokens only',
						'CSS vars for colors',
						'controlled form inputs (bind:value)',
						'useLinkComponent() for navigation'
					]
				}
			]
		},
		{
			section: 'Styling Approach',
			title: 'Styling',
			content: [
				{
					type: 'prose',
					text: 'xstyle prop for component overrides, authored in a .stylex.ts sibling. StyleX/scoped style/Tailwind for layout. See astryx-svelte docs styling.'
				}
			]
		},
		{
			section: 'Anti-Patterns',
			title: 'Anti-Patterns',
			content: [
				{
					type: 'list',
					items: [
						'no inline styles on raw elements',
						'no hardcoded colors — use tokens or Tailwind semantic classes',
						'no hardcoded spacing',
						'no hardcoded <a> — use useLinkComponent()',
						'no Card-wrapped list items — frame first, rows for dense data (astryx-svelte docs layout)',
						'no decorative Badge — StatusDot/Token for status',
						'read docs before inventing props'
					]
				}
			]
		},
		{
			section: 'Design Tokens',
			title: 'Tokens',
			content: [{ type: 'prose', text: 'run astryx-svelte docs tokens for full reference' }]
		}
	]
};
