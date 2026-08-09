/**
 * @file Spacing scale tokens.
 *
 * Prose verbatim; the code sample is re-authored for Svelte markup and for a
 * port that publishes no `spacingVars` export (see color.doc.mjs).
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'spacing',
	title: 'Spacing',
	category: 'foundations',
	description:
		'Spacing scale tokens for padding, gap, and margin: the rhythmic foundation of design system layouts.',
	tokenCategory: 'spacing',

	sections: [
		{
			title: 'Overview',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'The design system uses a 4px base-unit spacing scale. Component gap props accept step values that map to these tokens. The scale provides fine-grained control at the small end (2px, 4px, 6px) and consistent rhythm at larger sizes (multiples of 4px).'
				}
			]
		},
		{
			title: 'Scale',
			category: 'foundations',
			content: [
				{
					type: 'token-ref',
					topic: 'tokens',
					section: 'Spacing Tokens'
				}
			]
		},
		{
			title: 'Usage',
			category: 'foundations',
			content: [
				{
					type: 'prose',
					text: 'Most components accept a `gap` prop using step values (0 through 12). For custom layouts, use the spacing tokens directly.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Spacing via component props (preferred)',
					code: `<script lang="ts">
	import { Stack } from '@astryx-svelte/core';
</script>

<Stack gap={4}>
	<!-- 16px gap -->
</Stack>`
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Spacing tokens in a .stylex.ts module (custom layouts)',
					code: `import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
	custom: {
		padding: 'var(--spacing-4)',
		gap: 'var(--spacing-3)'
	}
});`
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
						'Use component gap props when available; they handle automatic spacing compensation.',
						"Stick to the scale for consistency. If a value isn't on the scale, reconsider the design.",
						'Use smaller steps (0.5–2) for tight internal spacing and larger steps (4–8) for section gaps.'
					]
				},
				{
					type: 'list',
					style: 'dont',
					items: [
						'Use arbitrary pixel values outside the scale.',
						'Mix spacing tokens with raw px/rem values in the same component.'
					]
				}
			]
		}
	]
};
