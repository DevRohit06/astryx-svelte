/**
 * @file Styling-library interop.
 *
 * The most portable doc in the set: its whole thesis is "point the other
 * library's semantic tokens at the system's CSS custom properties", and CSS
 * custom properties are framework-neutral. Four adaptations:
 *
 *   - the StyleX row/section drops the typed `colorVars` import — this port
 *     publishes no `defineVars` object from any subpath — and the Tailwind row
 *     drops `@astryxdesign/core/tailwind-theme.css`, which has no counterpart
 *     here; the bridge is `@theme inline` over the same token names;
 *   - `resolveThemeTokens` / `tokenVar` come from `@astryx-svelte/core/theme`,
 *     not a `/theme/tokens` subpath;
 *   - MUI is dropped from the list and the section: it is React-only, so the
 *     "map its palette slots" advice cannot be acted on from a Svelte app;
 *   - the chart examples use `--color-icon-*`, because this port does not ship
 *     upstream's `domainTokens/` data-viz group and `--color-data-categorical-*`
 *     resolves to nothing.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'styling-libraries',
	title: 'Styling Library Interop',
	category: 'guide',
	description:
		'Integrate Tailwind, StyleX, Panda, Chakra, CSS-in-JS, CSS Modules, and non-CSS renderers with system tokens.',

	sections: [
		{
			title: 'Core Principle',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Keep the system as the source of truth for theme values. Components read design tokens from CSS custom properties such as `--color-text-primary`, `--color-background-surface`, `--spacing-4`, and `--radius-container`. Other styling libraries should map their own semantic tokens, utility names, or theme objects to those system CSS variables whenever possible.'
				},
				{
					type: 'prose',
					text: 'Use CSS variables for ordinary DOM styling because they inherit through the tree, follow `data-theme` color mode, respect nested `data-astryx-theme` scopes, and update when themes switch. Use token resolver APIs only for non-CSS consumers such as SVG attribute values, canvas, chart configuration, color calculations, or static config generation.'
				},
				{
					type: 'prose',
					text: 'For available token names and values, run `astryx-svelte docs tokens`. Focused references are also available with `astryx-svelte docs color`, `astryx-svelte docs spacing`, `astryx-svelte docs shape`, `astryx-svelte docs typography`, `astryx-svelte docs elevation`, and `astryx-svelte docs motion`.'
				}
			]
		},
		{
			title: 'Choose an Integration Path',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Choose the narrowest integration path that fits the styling library. Most DOM styling should stay on the CSS-variable path; JavaScript token resolution is for APIs that cannot consume CSS custom properties.'
				},
				{
					type: 'table',
					headers: ['Path', 'Use when', 'Value shape'],
					rows: [
						[
							'CSS variable aliases',
							'The library ultimately writes CSS and accepts string values',
							'`var(--color-text-primary)`'
						],
						[
							'StyleX',
							'You are writing StyleX styles in a .stylex.ts module',
							"`{ color: 'var(--color-text-primary)' }`"
						],
						[
							'Tailwind @theme inline',
							'You want utility classes backed by active system tokens',
							'`--color-surface: var(--color-background-surface)`'
						],
						[
							'Token resolver APIs',
							'JavaScript needs token values for charts, canvas, SVG, or config objects',
							"`resolveThemeToken(theme, '--color-icon-blue', {mode})`"
						]
					]
				}
			]
		},
		{
			title: 'Best Practices',
			category: 'guide',
			content: [
				{
					type: 'list',
					style: 'do',
					items: [
						'Map by semantic intent: text, surface, border, accent, status, radius, spacing, typography.',
						'Let the system own color mode. The root Theme syncs `data-theme="light|dark"` and `data-astryx-theme` to `<html>` for portals and first-level theme scope.',
						'Prefer CSS variables for runtime theme switching and nested themes.'
					]
				},
				{
					type: 'list',
					style: 'dont',
					items: [
						'Copy raw hex/px values into a second theme object when a `var(...)` reference would work.',
						'Run a second unsynchronized dark-mode provider that disagrees with Theme.',
						"Make another library's CSS variables the source of truth for the system. Some consumers need token values outside the DOM."
					]
				}
			]
		},
		{
			title: 'Plain CSS and CSS Modules',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'The simplest integration is direct CSS variable usage. CSS Modules scope class names, but system token variables are global/inherited values supplied by package CSS and the active theme. The same is true of a Svelte `<style>` block: the scoping hash applies to the selector, not to the custom properties it reads.'
				},
				{
					type: 'code',
					lang: 'css',
					label: 'Card.module.css',
					code: `.card {
  background: var(--color-background-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-container);
  padding: var(--spacing-4);
}`
				},
				{
					type: 'prose',
					text: 'Sass variables are compile-time only. They are useful for generating static CSS, but they do not update when the system switches theme or color mode. Use native CSS custom properties for themeable values.'
				}
			]
		},
		{
			title: 'StyleX',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'For StyleX styles, reference tokens as `var(--token)` strings. The token names are the published surface; the `defineVars` objects that mint them are internal to `@astryx-svelte/core` and are not exported from any subpath, so there are no typed token imports to reach for.'
				},
				{
					type: 'prose',
					text: 'Author every `stylex.create` call in a `.ts` module. StyleX may not be imported from a `.svelte` file — the plugin Babel-parses anything that imports it and would read the markup as JSX.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'panel.stylex.ts',
					code: `import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
	panel: {
		backgroundColor: 'var(--color-background-surface)',
		color: 'var(--color-text-primary)',
		padding: 'var(--spacing-4)',
		borderRadius: 'var(--radius-container)'
	}
});`
				},
				{
					type: 'prose',
					text: 'Use `xstyle` for component overrides and `stylex.props()` (through the `sx` adapter) for your own DOM nodes. Use `class` when integrating a non-StyleX styling library.'
				}
			]
		},
		{
			title: 'Tailwind',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Tailwind v4 reads its theme from CSS custom properties, so no plugin is needed: map Tailwind's theme variables to the system's with `@theme inline` and utility classes like `text-primary`, `bg-surface`, `border-border`, `rounded-lg`, and `shadow-md` stay in sync with the active theme."
				},
				{
					type: 'code',
					lang: 'css',
					label: 'app.css',
					code: `@layer reset, theme, base, astryx-base, astryx-theme, product, utilities;

@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-neutral/theme.css';
@import 'tailwindcss/utilities.css' layer(utilities);

@theme inline {
	--color-surface: var(--color-background-surface);
	--color-primary: var(--color-text-primary);
	--color-border: var(--color-border);
	--radius-lg: var(--radius-container);
	--shadow-md: var(--shadow-med);
}`
				},
				{
					type: 'prose',
					text: 'Pre-declare every layer before any imports. This keeps reset lowest, Tailwind preflight above reset, component/theme styles in the middle, and Tailwind utilities last so utility classes on `class` can intentionally override component defaults.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Tailwind classes backed by system tokens',
					code: `<section class="rounded-lg border border-border bg-surface p-4 text-primary shadow-md">
	<Button label="Save" variant="primary" />
</section>`
				},
				{
					type: 'prose',
					text: "Tailwind is the concrete example of the general interop pattern: expose another library's semantic API, but point the values at system token variables."
				}
			]
		},
		{
			title: 'Panda, Chakra, and Other Semantic Token Systems',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Libraries with first-class semantic token objects, such as Panda CSS, let you put system CSS variables at the leaves so product code can use the library's semantic names while the system still owns the values."
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Semantic token aliases',
					code: `semanticTokens: {
	colors: {
		text: {
			primary: { value: 'var(--color-text-primary)' },
			secondary: { value: 'var(--color-text-secondary)' }
		},
		background: {
			surface: { value: 'var(--color-background-surface)' },
			body: { value: 'var(--color-background-body)' }
		},
		border: {
			default: { value: 'var(--color-border)' }
		}
	}
},
tokens: {
	spacing: {
		4: { value: 'var(--spacing-4)' }
	},
	radii: {
		container: { value: 'var(--radius-container)' }
	}
}`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Panda-style usage',
					code: `<section
	class={css({
		bg: 'background.surface',
		color: 'text.primary',
		borderColor: 'border.default',
		p: '4',
		rounded: 'container'
	})}
></section>`
				},
				{
					type: 'prose',
					text: 'If a semantic-token library needs to generate its own light/dark CSS from raw values, align its mode selector with Theme (`data-theme="light|dark"`) and generate that adapter from system theme data. Otherwise it can drift from nested or runtime themes.'
				}
			]
		},
		{
			title: 'Emotion, Theme UI, and Other CSS-in-JS Theme Objects',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Runtime CSS-in-JS libraries usually accept arbitrary theme objects. Keep those objects semantic, but store system CSS variable references as the values. This keeps generated classes stable while the system updates values through the CSS cascade.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Generic CSS-in-JS theme object',
					code: `const appTheme = {
	colors: {
		textPrimary: 'var(--color-text-primary)',
		textSecondary: 'var(--color-text-secondary)',
		surface: 'var(--color-background-surface)',
		border: 'var(--color-border)',
		accent: 'var(--color-accent)'
	},
	spacing: {
		4: 'var(--spacing-4)'
	},
	radius: {
		container: 'var(--radius-container)'
	}
};`
				},
				{
					type: 'prose',
					text: 'Avoid rebuilding CSS-in-JS theme objects with raw color values on every mode switch. CSS variables let the class names stay the same while the browser resolves the active values.'
				}
			]
		},
		{
			title: 'UnoCSS and Custom Utility Systems',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Utility generators such as UnoCSS can put system variables in their theme config or shortcuts. Keep classes semantic (`bg-surface`, `text-primary`) and let the values point at system tokens.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'UnoCSS-style config',
					code: `export default defineConfig({
	theme: {
		colors: {
			surface: 'var(--color-background-surface)',
			primary: 'var(--color-text-primary)',
			border: 'var(--color-border)',
			accent: 'var(--color-accent)'
		},
		spacing: {
			4: 'var(--spacing-4)'
		}
	},
	shortcuts: {
		'astryx-card': 'bg-surface text-primary border border-border rounded-lg p-4'
	}
});`
				},
				{
					type: 'prose',
					text: "Static utility extractors cannot see dynamically constructed class names. Prefer explicit class strings or the library's safelist/source-registration mechanism."
				}
			]
		},
		{
			title: 'Non-CSS Processing',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Use `resolveThemeTokens()` or `resolveThemeToken()` when code outside a component needs token values for a known theme and mode. Use `useTheme()` inside a component when the values should come from the nearest Theme and active mode.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Resolve tokens with no component context',
					code: `import { resolveThemeTokens } from '@astryx-svelte/core/theme';
import { neutralTheme } from '@astryx-svelte/theme-neutral/tokens';

const tokens = resolveThemeTokens(neutralTheme, { mode: 'light' });

const chartOptions = {
	textColor: tokens['--color-text-primary'],
	mutedTextColor: tokens['--color-text-secondary'],
	gridColor: tokens['--color-border'],
	seriesColors: [
		tokens['--color-icon-blue'],
		tokens['--color-icon-orange'],
		tokens['--color-icon-purple']
	]
};`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Resolve tokens from the nearest Theme',
					code: `<script lang="ts">
	import { useTheme } from '@astryx-svelte/core/theme';

	let { data }: { data: Array<{ x: string; y: number }> } = $props();

	const theme = useTheme();

	const chartOptions = $derived({
		mode: theme.mode,
		textColor: theme.tokens['--color-text-primary'],
		mutedTextColor: theme.tokens['--color-text-secondary'],
		gridColor: theme.tokens['--color-border'],
		seriesColors: [
			theme.tokens['--color-icon-blue'],
			theme.tokens['--color-icon-orange'],
			theme.tokens['--color-icon-purple']
		]
	});
</script>

<ThirdPartyChart {data} options={chartOptions} />`
				}
			]
		},
		{
			title: 'Non-CSS Processing Best Practices',
			category: 'guide',
			content: [
				{
					type: 'list',
					style: 'do',
					items: [
						'Read `theme.tokens` inside `$derived`; the return of `useTheme()` is getter-backed, so destructuring it once freezes the value.',
						'Use the distinct hue tokens (`--color-icon-blue`, `--color-icon-orange`, ...) for chart series instead of reusing arbitrary UI colors.',
						'Prefer CSS variables for SVG elements when possible (`fill="var(--color-accent)"`); use token resolver APIs when an API requires a string value in JavaScript.'
					]
				},
				{
					type: 'list',
					style: 'dont',
					items: [
						'Use token resolver APIs for ordinary DOM styling. Use CSS variables, StyleX, xstyle, or library aliases instead.',
						'Assume the returned values reflect every CSS cascade override. They resolve tokens for the current theme and mode; local media-surface overrides and arbitrary CSS overrides may not be represented in the returned map.'
					]
				}
			]
		},
		{
			title: 'Interop Checklist',
			category: 'guide',
			content: [
				{
					type: 'list',
					style: 'ordered',
					items: [
						'Import `@astryx-svelte/core/base.css` and a theme CSS file early enough for first paint. For a server-rendered app, build custom themes with `astryx-svelte theme build`; published themes are already built.',
						'Choose one owner for color mode. Theme uses `data-theme="light|dark"` and `color-scheme` to resolve `light-dark()` tokens.',
						"Map the external library's semantic layer to system variables by intent, not by exact naming. For example, a library's `background.paper` maps to `--color-background-surface`.",
						'Use `astryx-svelte docs tokens` and focused token docs when building mappings. Keep mappings small at first: text, surface/body/card/popover, border, accent, status, spacing, radius, typography, shadow.',
						'Use token resolver APIs only for non-CSS APIs that need resolved values.'
					]
				}
			]
		}
	]
};
