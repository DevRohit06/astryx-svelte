/** @type {import('@astryx-svelte/cli/authoring').ReferenceTranslationDoc} */
export const docsDense = {
	description: 'spacing/color/radius/type/shadow token ref',
	sections: [
		{
			section: 'Color Tokens',
			title: 'Color',
			content: [
				{ type: 'prose', text: 'semantic colors, support light-dark() auto switching.' },
				null,
				null,
				null
			]
		},
		{
			section: 'Spacing Tokens',
			title: 'Spacing',
			content: [
				{
					type: 'prose',
					text: 'defined in styles/tokens.stylex.ts. gap props use space0-space12.'
				},
				null
			]
		},
		{
			section: 'Size Tokens',
			title: 'Size',
			content: [{ type: 'prose', text: 'control heights for buttons/inputs/selectors.' }, null]
		},
		{ section: 'Radius Tokens', title: 'Radius', content: [null] },
		{ section: 'Shadow Tokens', title: 'Elevation', content: [null] },
		{ section: 'Usage in StyleX', title: 'StyleX Usage', content: [null, null, null, null] }
	]
};
