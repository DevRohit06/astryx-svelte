/**
 * @file Dense overlay for the theme doc.
 *
 * Two entries differ from upstream's beyond compression. The Quick Start and
 * "Runtime vs Built" notes describe the published-theme story this port
 * actually has (every `@astryx-svelte/theme-*` is built; there is no `/built`
 * subpath), and the useTheme override is placed on a prose block rather than a
 * code block — upstream's index lands on its code block, where the loader's
 * type check makes it a silent no-op.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceTranslationDoc} */
export const docsDense = {
	description: 'Theme provider, custom themes, light/dark, component overrides',
	sections: [
		{
			section: 'Quick Start',
			title: 'Quick Start',
			content: [
				null,
				null,
				null,
				{
					type: 'prose',
					text: 'published themes are pre-built (__built:true): import the theme + its theme.css, no runtime injection.'
				}
			]
		},
		{
			section: 'Available Themes',
			title: 'Themes',
			content: [
				null,
				null,
				{
					type: 'prose',
					text: 'published: neutral (start here), butter, chocolate, gothic (dark-only), liquid-glass, matcha, stone, y2k. @astryx-svelte/theme-{name} = built theme + icons. /tokens = plain data (node-readable). /theme.css = stylesheet.'
				}
			]
		},
		{ section: 'Theme Props', title: 'Props', content: [null] },
		{
			section: 'Creating a Custom Theme',
			title: 'Custom Theme',
			content: [
				{
					type: 'prose',
					text: 'astryx-svelte theme add <slug> to scaffold, or manual defineTheme. only override tokens that differ.'
				},
				null
			]
		},
		{
			section: 'defineTheme',
			title: 'defineTheme',
			content: [
				{
					type: 'prose',
					text: 'scale configs (color, typography, radius, motion) + explicit token overrides + component overrides. color derives full palette from accent hex via HCT.'
				},
				null,
				null
			]
		},
		{
			section: 'Component Style Overrides',
			title: 'Component Overrides',
			content: [
				{
					type: 'prose',
					text: 'components field uses semantic component keys + style keys (base, variant:value, stateName), not raw selectors. for external CSS, prefer data-* selectors from `astryx-svelte docs styling`. write standard CSS (borderRadius, padding) — pipeline expands to internal vars. public vars (--button-press-scale etc) set directly. private vars (--_*) cannot be set — use CSS properties. run `astryx-svelte component <Name>` for details.'
				},
				null,
				null,
				null,
				null
			]
		},
		{
			section: 'Custom Variants',
			title: 'Custom Variants',
			content: [
				{
					type: 'prose',
					text: 'any unknown prop:value in components becomes a new variant. astryx-svelte theme build generates TS augmentations. works on any extensible prop axis (variant, status, etc).'
				},
				null,
				null,
				null
			]
		},
		{
			section: 'Building Themes for Production',
			title: 'Build for Production',
			content: [
				{
					type: 'prose',
					text: 'astryx-svelte theme build compiles defineTheme to static CSS. outputs .css + .js (__built:true) + .d.ts (+ .variants.d.ts for custom prop values).'
				},
				null,
				null,
				null,
				null,
				null
			]
		},
		{
			section: 'Runtime vs Built Themes',
			title: 'Runtime vs Built',
			content: [
				{
					type: 'prose',
					text: 'runtime: Theme injects <style> in an effect after mount. built: static CSS on first paint. published themes are always built; BUILD YOUR OWN BEFORE SSR.'
				},
				null,
				null,
				null
			]
		},
		{
			section: 'Light/Dark Mode',
			title: 'Light/Dark',
			content: [
				{
					type: 'prose',
					text: 'light-dark() in token values via [light, dark] tuples. mode=system follows OS.'
				},
				null,
				null
			]
		},
		{
			section: 'Nesting Themes',
			title: 'Nesting',
			content: [{ type: 'prose', text: 'wrap sections in separate <Theme> providers' }, null]
		},
		{
			section: 'useTheme',
			title: 'useTheme',
			content: [
				null,
				{
					type: 'prose',
					text: 'read-only, getter-backed: read theme.mode/theme.tokens inside $derived, do not destructure. manage state at app level.'
				},
				null,
				null,
				null
			]
		}
	]
};
