/**
 * @file Getting started.
 *
 * The most rewritten doc in the set, because almost every instruction in it is
 * an instruction about *this* package graph. Four things differ from upstream
 * and each is a fact about the port, not a preference:
 *
 *   - the peer dependency is `svelte` >= 5, not `react`/`react-dom` >= 19;
 *   - core publishes ONE stylesheet, `@astryx-svelte/core/base.css`, which
 *     already contains the reset — upstream's `reset.css` + `astryx.css` split
 *     does not exist here;
 *   - there are no per-component subpath exports. Everything is on the root
 *     barrel `@astryx-svelte/core`, so upstream's "import from per-category
 *     entrypoints" advice is inverted;
 *   - `xstyle` takes StyleX styles authored in a `.stylex.ts` module, because
 *     StyleX may not be imported from a `.svelte` file at all.
 *
 * One section is dropped rather than adapted: upstream's "Example Apps" table
 * links five Next.js/Vite example apps in `facebook/astryx`. This port ships no
 * example apps, so the table would be five dead links. Recorded in TODO.md.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'getting-started',
	title: 'Getting Started',
	category: 'guide',
	description: 'Add the design system to your project and start building.',

	sections: [
		{
			title: 'Quick Start with AI',
			content: [
				{
					type: 'prose',
					text: 'Paste this into your AI coding tool and let it handle the setup:'
				},
				{
					type: 'code',
					lang: 'text',
					label: 'Paste this into your AI',
					code: 'Install @astryx-svelte/core, @astryx-svelte/theme-neutral, and @astryx-svelte/cli in this project, then run `npx @astryx-svelte/cli init` to set up agent docs. Read the generated files to learn the conventions.'
				}
			]
		},
		{
			title: 'Install',
			content: [
				{
					type: 'prose',
					text: 'Astryx requires Svelte 5 or later: `svelte` >= 5.0.0 is the peer dependency of `@astryx-svelte/core`. Runes are used throughout, so there is no Svelte 4 compatibility mode.'
				},
				{
					type: 'prose',
					text: 'Add the core package, a theme, and the CLI to your existing project.'
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Terminal',
					code: `npm install @astryx-svelte/core @astryx-svelte/theme-neutral @astryx-svelte/cli`
				},
				{
					type: 'prose',
					text: 'These packages are versioned `0.3.0` and ready to publish, but they are **not on npm yet** — nothing resolves until the first `npm publish`. Until then, work from a clone of [the repository](https://github.com/devrohit06/astryx-svelte): `pnpm install`, then `node packages/cli/bin/astryx-svelte.mjs <command>`.'
				},
				{
					type: 'prose',
					text: "Then run `astryx-svelte init` to install the AI agent cheat sheet (AGENTS.md/CLAUDE.md). It's non-interactive; no prompts; so it's safe for AI agents, CI, and scripts. Add `--all` for pointers to the theme and page-building workflows."
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Terminal',
					code: `npx astryx-svelte init`
				}
			]
		},
		{
			title: 'Add the theme CSS',
			content: [
				{
					type: 'prose',
					text: 'Import the base stylesheet and a theme in your global CSS file. Themes provide all design tokens (colors, spacing, radius, typography) as CSS custom properties.'
				},
				{
					type: 'code',
					lang: 'css',
					label: 'src/app.css',
					code: `@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-neutral/theme.css';`
				},
				{
					type: 'prose',
					text: '`base.css` is one file, not two: it declares the cascade layer order, sets `color-scheme` so every `light-dark()` token resolves, and contains the reset. Upstream ships the reset separately as an opt-in import; here the components are authored against it and misrender without it, so it is not optional.'
				},
				{
					type: 'prose',
					text: 'Available themes: @astryx-svelte/theme-neutral (muted minimal, a good starting point), @astryx-svelte/theme-butter, @astryx-svelte/theme-chocolate, @astryx-svelte/theme-gothic (dark-only), @astryx-svelte/theme-liquid-glass, @astryx-svelte/theme-matcha, @astryx-svelte/theme-stone, and @astryx-svelte/theme-y2k. See `astryx-svelte docs theme` for the full theming guide.'
				},
				{
					type: 'prose',
					text: 'These stylesheets are cascade-layered: the layer order is `reset, astryx-base, astryx-theme, product`. If your project has existing global CSS, a legacy reset, or Tailwind, assign every stylesheet to a layer deliberately: unlayered styles and later layers both override astryx-base regardless of specificity. See the Cascade Layer Safety section in `astryx-svelte docs migration` before building screens.'
				}
			]
		},
		{
			title: 'Add your first component',
			content: [
				{
					type: 'prose',
					text: 'Every component is exported from the package root. There are no per-component subpath entrypoints — the barrel is tree-shaken by your bundler, and `@astryx-svelte/core` is where `Button` lives. The subpaths that do exist are for non-component surfaces: `./theme`, `./hooks`, `./utils`, `./i18n`, `./naming`, and `./base.css`.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'src/routes/+page.svelte',
					code: `<script lang="ts">
	import { Button, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={2}>
	<Button label="Hello Astryx" onclick={() => alert('Hi!')} />
</VStack>`
				}
			]
		},
		{
			title: 'Customize with StyleX',
			content: [
				{
					type: 'prose',
					text: 'Astryx components support various styling solutions, from plain CSS and a scoped `<style>` block to Tailwind utilities and the `class` prop. See `astryx-svelte docs styling` for the full guide. Astryx also has a deep integration with [StyleX](https://stylexjs.com/), an atomic CSS-in-JS library: create styles with `stylex.create()` and pass them to components with the `xstyle` prop.'
				},
				{
					type: 'prose',
					text: 'StyleX must be imported from a `.ts` module, never from a `.svelte` file — the bundler plugin Babel-parses anything that imports `@stylexjs/stylex`, and it would read Svelte markup as JSX. So the styles live in a sibling `.stylex.ts` and the component imports the object.'
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'src/routes/page.stylex.ts',
					code: `import * as stylex from '@stylexjs/stylex';

export const overrides = stylex.create({
	save: { alignSelf: 'flex-end', marginTop: 16 }
});`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'src/routes/+page.svelte',
					code: `<script lang="ts">
	import { Button } from '@astryx-svelte/core';
	import { overrides } from './page.stylex.js';
</script>

<Button label="Save" xstyle={overrides.save} />`
				}
			]
		},
		{
			title: 'Explore the CLI',
			content: [
				{
					type: 'prose',
					text: 'The CLI is your reference for components, tokens, templates, and docs. For reliable invocation (especially with AI assistants), add this script to your package.json:'
				},
				{
					type: 'code',
					lang: 'json',
					label: 'package.json',
					code: `"scripts": {
  "astryx-svelte": "node node_modules/@astryx-svelte/cli/bin/astryx-svelte.mjs"
}`
				},
				{
					type: 'prose',
					text: "Then discover what's available:"
				},
				{
					type: 'code',
					lang: 'bash',
					label: 'Terminal',
					code: `astryx-svelte component          # list all components
astryx-svelte component Button   # props, usage, theming for Button
astryx-svelte util               # list all utils (runes-based composables)
astryx-svelte docs               # list all doc topics
astryx-svelte template --list    # available page templates
astryx-svelte docs tokens        # spacing, color, radius reference`
				}
			]
		}
	]
};
