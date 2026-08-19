/**
 * @file The theme system.
 *
 * Prose survives; the code is all re-authored, and two sections say something
 * materially different because the packages differ:
 *
 *   - **"Available Themes" has no `/built` subpath.** Upstream publishes each
 *     theme twice — source (runtime injection) and `/built` (pre-compiled CSS).
 *     This port publishes each theme *built*: `.` is the built theme object
 *     (`__built: true`) plus its icon registry, `./tokens` is the same object
 *     as plain data with no icon import, and `./theme.css` is the stylesheet.
 *     There are eight themes here, not seven — `liquid-glass` has no upstream
 *     counterpart at this version.
 *   - **"Runtime vs Built" is therefore about YOUR themes, not published ones.**
 *     A `defineTheme()` theme you write is runtime-injected until you run
 *     `astryx-svelte theme build`; a published one never was.
 *
 * `./tokens` is also the subpath a plain-Node consumer wants: the `.` entry's
 * first statement imports an icon registry from a `.svelte` module, which Node
 * cannot parse.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'theme',
	title: 'Theme System',
	category: 'guide',
	description:
		'Theme provider, custom themes, theme build for production/SSR, light/dark mode, and component style overrides.',

	sections: [
		{
			title: 'Quick Start',
			category: 'guide',
			content: [
				{
					type: 'code',
					lang: 'bash',
					label: 'Install a theme package',
					code: 'npm install @astryx-svelte/theme-neutral'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Basic theme setup',
					code: `<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { neutralTheme } from '@astryx-svelte/theme-neutral';
	import '@astryx-svelte/theme-neutral/theme.css';

	let { children } = $props();
</script>

<Theme theme={neutralTheme}>
	{@render children()}
</Theme>`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'In a SvelteKit root layout',
					code: `<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { neutralTheme } from '@astryx-svelte/theme-neutral';
	import '../app.css';

	let { children } = $props();
</script>

<Theme theme={neutralTheme} mode="system">
	{@render children()}
</Theme>`
				},
				{
					type: 'prose',
					text: 'Each theme ships as its own npm package. Install the one you want, import its stylesheet once, then wrap your app in `<Theme>`. The same pattern works for every theme; just swap the package and import name.'
				},
				{
					type: 'prose',
					text: 'Published themes are pre-built: the theme object carries `__built: true`, so `<Theme>` skips runtime `<style>` injection and the stylesheet you imported does the work. That is what makes them SSR-safe with no flash.'
				}
			]
		},
		{
			title: 'Available Themes',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Install the theme package you want with `npm install @astryx-svelte/theme-{name}`, then import its theme object as shown below.'
				},
				{
					type: 'table',
					headers: ['Theme', 'Import', 'Description'],
					rows: [
						[
							'Neutral',
							"import {neutralTheme} from '@astryx-svelte/theme-neutral'",
							'Muted, minimal aesthetic with system fonts. A good starting point.'
						],
						[
							'Butter',
							"import {butterTheme} from '@astryx-svelte/theme-butter'",
							'Golden, buttery surfaces with blue accents; Sarina + Outfit type.'
						],
						[
							'Chocolate',
							"import {chocolateTheme} from '@astryx-svelte/theme-chocolate'",
							'Warm brown tones and cozy beige; Fraunces + Albert Sans type.'
						],
						[
							'Gothic',
							"import {gothicTheme} from '@astryx-svelte/theme-gothic'",
							'Dark-only atmospheric theme; deep blue-gray surfaces, distressed display type.'
						],
						[
							'Liquid Glass',
							"import {liquidGlassTheme} from '@astryx-svelte/theme-liquid-glass'",
							'Translucent, high-blur surfaces over a saturated backdrop.'
						],
						[
							'Matcha',
							"import {matchaTheme} from '@astryx-svelte/theme-matcha'",
							'Earthy green theme with Figtree typography.'
						],
						[
							'Stone',
							"import {stoneTheme} from '@astryx-svelte/theme-stone'",
							'Warm stone and slate tones; Montserrat + Figtree type.'
						],
						[
							'Y2K',
							"import {y2kTheme} from '@astryx-svelte/theme-y2k'",
							'Playful Y2K pop; periwinkle body, holographic accents, Poppins + Crimson Text.'
						]
					]
				},
				{
					type: 'prose',
					text: 'Every theme package publishes three entries:\n- `@astryx-svelte/theme-{name}`: the built theme object plus its icon registry — what an app imports\n- `@astryx-svelte/theme-{name}/tokens`: the same theme as plain data, with no icon registry and no imports, so plain Node can read it\n- `@astryx-svelte/theme-{name}/theme.css`: the pre-compiled stylesheet, imported once alongside the theme'
				}
			]
		},
		{
			title: 'Theme Props',
			category: 'guide',
			content: [
				{
					type: 'table',
					headers: ['Prop', 'Type', 'Default', 'Description'],
					rows: [
						['theme', 'DefinedTheme', '-', 'Theme object (required)'],
						[
							'mode',
							"'system' | 'light' | 'dark'",
							"'system'",
							'Color mode. system follows OS preference.'
						],
						['children', 'Snippet', '-', 'App content']
					]
				}
			]
		},
		{
			title: 'Creating a Custom Theme',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Start from a theme we ship, or write one from scratch with defineTheme. Only override tokens that differ from defaults; omitted tokens use the design system defaults.'
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Browse, then copy a theme in as editable source',
					code: 'astryx-svelte theme list\nastryx-svelte theme add stone'
				},
				{
					type: 'prose',
					text: 'For an annotated map of the whole surface — every defineTheme field, the token families, and the component override syntax, each with the CLI command that prints its reference — run `astryx-svelte theme template`. It writes `theme.template.ts` into your project to read and copy from (`astryx-svelte init --features theme` writes it as part of project setup).'
				}
			]
		},
		{
			title: 'defineTheme',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'defineTheme creates a theme from token overrides and optional scale configs. Scale configs generate tokens from parameters. Explicit token overrides always take precedence over scale-generated values.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'defineTheme with scale configs',
					code: `import { defineTheme } from '@astryx-svelte/core/theme';

export const myTheme = defineTheme({
	name: 'my-theme',
	color: { accent: '#7B61FF', neutralStyle: 'cool' },
	typography: {
		scale: { base: 14, ratio: 1.2 },
		body: { family: 'Inter', fallbacks: '-apple-system, sans-serif' }
	},
	radius: { base: 4, multiplier: 1 },
	motion: { fast: 175, medium: 410, ratio: 0.75 },
	tokens: {
		// Explicit overrides take precedence over scale-generated values
		'--color-accent': ['#7B61FF', '#9B85FF']
	},
	components: {
		button: { 'variant:primary': { color: 'white' } }
	}
});`
				},
				{
					type: 'table',
					headers: ['Config', 'Generates', 'Parameters'],
					rows: [
						[
							'color',
							'--color-accent, --color-background-*, --color-text-*, --color-border, etc.',
							'accent? (hex; omit for neutral-only), neutralStyle? (warm|cool|neutral), contrast? (standard|high)'
						],
						[
							'typography.scale',
							'--text-heading-*-size/weight/leading, --text-body-size/weight/leading',
							'base (px), ratio'
						],
						[
							'typography.body/heading/code',
							'--font-family-body, --font-family-heading, --font-family-code',
							'family, fallbacks?, url?, weight?'
						],
						[
							'radius',
							'--radius-inner, --radius-element, --radius-container, --radius-page, --radius-chat',
							'base (px), multiplier (0–2)'
						],
						[
							'motion',
							'--duration-fast-min/fast/fast-max, --duration-medium-min/medium/medium-max',
							'fast (ms), medium (ms), ratio, easing?'
						]
					]
				}
			]
		},
		{
			title: 'Extending a Theme',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: '`extends` lets you derive a new theme from an existing one, inheriting its tokens, component overrides, icons, and fonts. Only specify what you want to change; everything else carries over from the base theme.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Extending the neutral theme',
					code: `import { defineTheme } from '@astryx-svelte/core/theme';
import { neutralTheme } from '@astryx-svelte/theme-neutral';
import { myIcons } from './icons.svelte';

export const brandTheme = defineTheme({
	name: 'brand',
	extends: neutralTheme,
	icons: myIcons,
	tokens: {
		'--color-accent': ['#7B61FF', '#9B85FF']
	}
});`
				},
				{
					type: 'table',
					headers: ['Field', 'Merge behavior'],
					rows: [
						['tokens', 'Base tokens are copied first, then child tokens override on top.'],
						[
							'components',
							'Deep-merged: child component rules override matching keys from the base.'
						],
						['icons', 'Shallow-merged: child icons override matching names from the base.'],
						['fonts', 'Base fonts included first, then child fonts appended.'],
						[
							'typography, motion, radius, color',
							'Child config replaces base entirely (these are scale inputs, not additive).'
						]
					]
				}
			]
		},
		{
			title: 'Component Style Overrides',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'The `components` field in defineTheme uses semantic component keys and style keys, not raw CSS selectors. Use `base` for all instances, `variant:value` or `stateName` for specific props/states, and let the theme pipeline choose the underlying selector. For raw external CSS escape hatches, prefer the data-attribute selector surface documented in `astryx-svelte docs styling`.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Component overrides with standard CSS',
					code: `components: {
	// Standard CSS properties are expanded automatically.
	// borderRadius also sets the internal radius var for concentric math.
	// padding on container components (card, section, dialog) expands to layout tokens.
	card: {
		base: { borderRadius: '20px', padding: '24px' }
	},
	button: {
		base: {
			borderRadius: '9999px',
			textTransform: 'uppercase',
			// Some components have public CSS vars for properties that don't map
			// to standard CSS. Set these directly. Take the name from
			// \`astryx-svelte component <Name>\` — a var the component does not
			// define compiles to CSS that never applies.
			'--button-focus-offset': '3px'
		},
		'variant:ghost': { borderWidth: '2px', borderStyle: 'solid' }
	}
}`
				},
				{
					type: 'prose',
					text: "Run `astryx-svelte component <Name>` to see a component's theming targets, public CSS variables, and which standard CSS properties are supported."
				},
				{
					type: 'list',
					style: 'do',
					items: [
						'Write standard CSS properties (borderRadius, padding); the pipeline expands them into internal vars.',
						'Set public CSS vars directly when no standard property equivalent exists.'
					]
				},
				{
					type: 'list',
					style: 'dont',
					items: [
						'Set private CSS vars (prefixed --_) directly. Use standard CSS properties instead. `astryx-svelte theme build` will error.'
					]
				}
			]
		},
		{
			title: 'Custom Variants',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Themes can add new prop values to any component. Any `prop:value` key where the value isn't a built-in gets treated as a new variant. Use `astryx-svelte theme build` to generate TypeScript augmentations for type safety."
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Adding custom variants',
					code: `components: {
	button: {
		// Override an existing variant
		'variant:secondary': { backgroundColor: 'rgba(0,0,0,0.06)' },
		// Add a new variant — generates type augmentation on build
		'variant:primary-muted': {
			backgroundColor: 'light-dark(#F2F4F6, #28292C)',
			color: 'var(--color-text-primary)'
		}
	},
	banner: {
		// Any extensible prop axis works — not just variant
		'status:neutral': {
			backgroundColor: 'var(--color-background-muted)',
			color: 'var(--color-text-secondary)'
		}
	}
}`
				},
				{
					type: 'prose',
					text: 'After building, the new values are type-safe in markup:'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Using custom variants',
					code: `<!-- TypeScript knows about 'primary-muted' after astryx-svelte theme build -->
<Button variant="primary-muted" label="Save draft" />
<Banner status="neutral" title="Note" />`
				},
				{
					type: 'prose',
					text: "Custom variants only work when the theme that defines them is active. The component's variant map is extended via module augmentation, with no changes to the component source needed."
				}
			]
		},
		{
			title: 'Building Themes for Production',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: '`astryx-svelte theme build` compiles a defineTheme file into production-ready artifacts. Recommended for SSR apps (SvelteKit with `adapter-node`, `adapter-vercel`, or any prerendered output) where styles must be present on first paint.'
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Build a theme',
					code: 'astryx-svelte theme build ./src/lib/themes/ocean.ts'
				},
				{
					type: 'prose',
					text: 'This generates the following files alongside the source:'
				},
				{
					type: 'table',
					headers: ['File', 'Description'],
					rows: [
						[
							'ocean.css',
							'Pre-compiled CSS with token overrides, component overrides, and prose element styles in @scope rules'
						],
						[
							'ocean.js',
							'ES module exporting the theme object with `__built: true` and pre-resolved token values. Also re-exports the icon registry if the source theme declares one.'
						],
						['ocean.d.ts', 'TypeScript declarations for the theme and icon registry exports'],
						[
							'ocean.variants.d.ts',
							"(Optional) Module augmentations for custom component prop values found in the theme's component overrides"
						]
					]
				},
				{
					type: 'prose',
					text: 'The `__built: true` flag tells Theme to skip runtime `<style>` injection; the CSS file handles it.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Using a custom built theme',
					code: `<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { oceanTheme } from '$lib/themes/ocean.js';
	import '$lib/themes/ocean.css';

	let { children } = $props();
</script>

<Theme theme={oceanTheme}>
	{@render children()}
</Theme>`
				}
			]
		},
		{
			title: 'Runtime vs Built Themes',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Themes work in two modes. Every published `@astryx-svelte/theme-*` package is already built; the distinction matters for a theme you write yourself.'
				},
				{
					type: 'table',
					headers: ['', 'Runtime (source)', 'Built'],
					rows: [
						[
							'Import (published theme)',
							'n/a — published themes are built',
							'@astryx-svelte/theme-{name} + theme.css'
						],
						[
							'Import (custom theme)',
							'defineTheme() directly',
							'Built .js + .css from `astryx-svelte theme build`'
						],
						[
							'How it works',
							'Theme injects a <style> element in an effect after mount',
							'Pre-compiled .css file loaded with the page'
						],
						['Component overrides', 'Injected client-only', 'In static CSS: present during SSR'],
						[
							'SSR safe',
							'Tokens yes, component overrides flash on hydration',
							'Fully SSR safe: no flash'
						],
						['Best for', 'Dev, prototyping, client-only SPAs', 'Production, server-rendered apps']
					]
				},
				{
					type: 'list',
					style: 'do',
					items: [
						'Import the published theme plus its theme.css for production apps.',
						'Use a runtime defineTheme() theme during development for fast iteration.',
						'Run `astryx-svelte theme build` for custom themes to get the built artifacts.'
					]
				},
				{
					type: 'list',
					style: 'dont',
					items: [
						'Ship a runtime theme in a server-rendered app; component overrides will flash on hydration.',
						"Import a built theme without its CSS file; component overrides won't apply."
					]
				}
			]
		},
		{
			title: 'Light/Dark Mode',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Use [light, dark] tuples in token values for automatic mode switching. Use mode='system' (default) on Theme to follow OS preference."
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Light/dark tuple',
					code: "'--color-accent': ['#0064E0', '#2694FE'],\n//                   ^light     ^dark"
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Toggle with a button',
					code: `<script lang="ts">
	import { Button, Theme } from '@astryx-svelte/core';
	import { myTheme } from '$lib/themes/my-theme.js';

	let mode = $state<'light' | 'dark'>('light');
</script>

<Theme theme={myTheme} {mode}>
	<Button
		label={mode === 'light' ? 'Switch to Dark' : 'Switch to Light'}
		onclick={() => (mode = mode === 'light' ? 'dark' : 'light')}
	/>
</Theme>`
				}
			]
		},
		{
			title: 'Nesting Themes',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Wrap different sections in separate <Theme> providers.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Dark sidebar with light content',
					code: `<Theme theme={lightTheme} mode="light">
	<Layout>
		{#snippet header()}
			<LayoutHeader>...</LayoutHeader>
		{/snippet}

		{#snippet start()}
			<Theme theme={darkTheme} mode="dark">
				<LayoutPanel><!-- Dark sidebar --></LayoutPanel>
			</Theme>
		{/snippet}

		{#snippet content()}
			<LayoutContent><!-- Light content --></LayoutContent>
		{/snippet}
	</Layout>
</Theme>`
				}
			]
		},
		{
			title: 'Token Utilities',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Use `tokenVar()` when a non-StyleX styling library wants a CSS variable reference, and `resolveThemeTokens()` when JavaScript needs token values for a specific theme and mode without any component context. Themes are also registered by name when created with `defineTheme()`; call `registerTheme(theme)` for prebuilt or object-literal themes that need name-based SSR lookup.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'CSS var references for styling-library configs',
					code: `import { tokenVar, tokenVars } from '@astryx-svelte/core/theme';

const pandaOrEmotionTheme = {
	colors: {
		text: tokenVar('--color-text-primary'),
		surface: tokenVars['--color-background-surface']
	},
	spacing: {
		4: tokenVars['--spacing-4']
	}
};`
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Resolve token values without a component',
					code: `import { resolveThemeTokens } from '@astryx-svelte/core/theme';
import { neutralTheme } from '@astryx-svelte/theme-neutral/tokens';

const lightTokens = resolveThemeTokens(neutralTheme, { mode: 'light' });
const chartTheme = {
	textColor: lightTokens['--color-text-primary'],
	seriesColor: lightTokens['--color-icon-blue']
};`
				},
				{
					type: 'prose',
					text: 'These helpers are server-safe and render nothing, so they work in a `+page.server.ts`, a build script, or a plain Node process. Import the theme itself from its `/tokens` subpath there: the package root pulls in an icon registry that is a `.svelte` module, which plain Node cannot parse.'
				}
			]
		},
		{
			title: 'useTheme',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: '`useTheme()` uses the same token resolution as `resolveThemeTokens()`, but reads the nearest Theme and effective color mode from context and media query state. Use it inside a component for SVG, canvas, charts, maps, and third-party configuration objects that need token values in JavaScript instead of `var(...)` references.'
				},
				{
					type: 'prose',
					text: 'It returns a live object — `name`, `mode`, `tokens`, and a `token(name)` lookup — whose properties are getters, so read them inside `$derived` rather than destructuring them once.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Access resolved token values',
					code: `<script lang="ts">
	import { useTheme } from '@astryx-svelte/core/theme';

	const theme = useTheme();

	const options = $derived({
		mode: theme.mode,
		textColor: theme.tokens['--color-text-primary'],
		gridColor: theme.tokens['--color-border'],
		seriesColor: theme.token('--color-icon-blue')
	});
</script>

<Chart {options} />`
				},
				{
					type: 'prose',
					text: 'Prefer CSS variables, xstyle, or class for ordinary styling. To change the theme or mode, manage state at the app level and pass it to <Theme>.'
				},
				{
					type: 'prose',
					text: 'See `astryx-svelte docs styling-libraries` for styling-library interop and `astryx-svelte docs tokens` for the full token reference.'
				}
			]
		}
	]
};
