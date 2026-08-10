# @astryx-svelte/core

Svelte 5 components, theme system, and utilities for Astryx — a port of Meta's open source design
system. Unofficial, and not affiliated with Meta. For project setup, see [Quick Start](#quick-start)
below.

> **Building with an AI agent?** Add the CLI, then run `init`:
>
> ```bash
> pnpm exec astryx-svelte init
> ```
>
> `init` writes the Astryx component index into your `AGENTS.md`/`CLAUDE.md` so your agent
> discovers components, utils, and design tokens instead of guessing. See
> [Astryx CLI](#astryx-cli) for the rest of what it does.

## Your bundler must run the StyleX compiler

This is the one setup fact that has no upstream counterpart, and getting it wrong fails **without
an error**: the components render, and they render unstyled.

Astryx's own package ships pre-built CSS, so a consumer imports a stylesheet and is done. This one
cannot. Components are styled with [StyleX](https://stylexjs.com/), and `svelte-package` — which
builds this package — transpiles TypeScript but does not run StyleX. So `dist/**/*.stylex.js` is
published **uncompiled**, and every consumer compiles it as part of their own build. That is the
same property that makes the port verifiable: the compiler derives its class names from the source,
so authoring against Astryx's token references emits byte-identical atomic CSS.

For Vite (and therefore SvelteKit), that is three things — the plugin, and two settings that exist
because Vite has two ways to route a dependency _around_ the plugin pipeline:

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import stylex from '@stylexjs/unplugin/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		stylex({
			dev: process.env.NODE_ENV !== 'production',
			runtimeInjection: false,
			treeshakeCompensation: true,
			useCSSLayers: true,
			// Without explicit targets, lightningcss lowers `light-dark()` to a pair of
			// `var(--lightningcss-*)` references that resolve to nothing, and every
			// colour token silently goes empty.
			lightningcssOptions: {
				targets: { chrome: 123 << 16, firefox: 120 << 16, safari: (17 << 16) | (5 << 8) }
			},
			unstable_moduleResolution: { type: 'commonJS', rootDir: import.meta.dirname }
		}),
		sveltekit()
	],
	// Vite's dev-time pre-bundler runs esbuild outside the plugin pipeline, so anything
	// it optimises never reaches the StyleX transform and `stylex.create` survives into
	// the browser as a runtime no-op.
	optimizeDeps: { exclude: ['@astryx-svelte/core'] },
	// Same reasoning for the server build: an externalised dependency is imported from
	// node_modules at runtime rather than transformed.
	ssr: { noExternal: ['@astryx-svelte/core'] }
});
```

Both `optimizeDeps.exclude` and `ssr.noExternal` fail silently when missing. If a page renders with
the right markup and none of the styling, check those two first.

## Component Docs

Look up any component's full API — props, variants, examples, best practices, and theming — through
the CLI:

```bash
pnpm exec astryx-svelte component --list      # every component, grouped
pnpm exec astryx-svelte component Button      # full docs for one component
pnpm exec astryx-svelte util --list           # the runes-based composables
pnpm exec astryx-svelte search button         # components, utils, docs and templates at once
```

Everything is exported from the package root. There are no per-component subpath entrypoints —
Astryx publishes one per component and this port publishes none, so `@astryx-svelte/core` is where
`Button` lives and the barrel is tree-shaken by your bundler. The subpaths that do exist are for
non-component surfaces:

| Subpath                            | What it is                                                   |
| ---------------------------------- | ------------------------------------------------------------ |
| `@astryx-svelte/core`              | Every component, every util, every props type                |
| `@astryx-svelte/core/theme`        | `Theme`, `useTheme`, the token vars                          |
| `@astryx-svelte/core/theme/define` | `defineTheme` and its types, for authoring a theme           |
| `@astryx-svelte/core/theme/syntax` | Syntax-highlighting themes for `CodeBlock`                   |
| `@astryx-svelte/core/hooks`        | The composables, without the components                      |
| `@astryx-svelte/core/utils`        | Framework-free helpers                                       |
| `@astryx-svelte/core/naming`       | The class-name helpers themes and integrations build against |
| `@astryx-svelte/core/i18n`         | The message catalog runtime                                  |
| `@astryx-svelte/core/locales/*`    | The shipped catalogs (`en`, `fr-FR`, `pseudo`)               |
| `@astryx-svelte/core/base.css`     | The one stylesheet — see below                               |

## Page Layouts

Building a full page? Astryx's advice is to start from a template rather than composing from
scratch, and the CLI has the command:

```bash
pnpm exec astryx-svelte template --list       # browse page and block templates
pnpm exec astryx-svelte template <id> --skeleton
```

**Core contributes none of them yet.** Astryx's 1,329 template assets are React source and are
deferred, so `template --list` finds nothing from this package today. The command is not a stub —
templates contributed by an integration package, or by any other installed package, are discovered
and injected normally — but do not plan on scaffolding a dashboard out of core.

## Astryx CLI

`@astryx-svelte/cli` provides the tooling around the library: component and util docs, reference
topics, search, theme scaffolding and building, source ejection, and upgrade codemods.

```bash
pnpm exec astryx-svelte --help              # all 14 commands
pnpm exec astryx-svelte component Button    # props, usage, theming
pnpm exec astryx-svelte docs                # reference topics
pnpm exec astryx-svelte docs theme          # the theming guide
pnpm exec astryx-svelte docs tokens         # spacing, color, radius, typography
pnpm exec astryx-svelte theme list          # the eight theme packages
pnpm exec astryx-svelte theme build ./src/themes/ocean.ts
pnpm exec astryx-svelte swizzle Button      # eject component source
pnpm exec astryx-svelte doctor              # diagnose a project's setup
```

```bash
npm install -D @astryx-svelte/cli
```

The binary is `astryx-svelte`, not `astryx`: `astryx` on npm is an unrelated package and Astryx's
own CLI already claims it, so a distinct name means both can be installed in one project.

## Related Packages

| Package                             | Description                                                     |
| ----------------------------------- | --------------------------------------------------------------- |
| `@astryx-svelte/cli`                | Component docs, reference topics, themes, scaffolding, codemods |
| `@astryx-svelte/theme-neutral`      | The default Astryx look — muted and minimal                     |
| `@astryx-svelte/theme-butter`       | Warm creamy yellows with a friendly blue accent                 |
| `@astryx-svelte/theme-chocolate`    | Rich cozy browns with Fraunces headings                         |
| `@astryx-svelte/theme-gothic`       | Deep blue-grays and a display serif; dark-only                  |
| `@astryx-svelte/theme-matcha`       | Earthy greens, calm and organic                                 |
| `@astryx-svelte/theme-stone`        | Warm stone and slate, understated                               |
| `@astryx-svelte/theme-y2k`          | Hot pinks, lime greens, and Poppins                             |
| `@astryx-svelte/theme-liquid-glass` | macOS translucent materials; **no upstream counterpart**        |

## Resources

- [The documentation site](https://astryx-svelte.rohitk06.in/) — every component page, reference
  topic and example, rendering live Svelte from the files in this repository
- [Astryx](https://astryx.atmeta.com/) — the design system this ports, and the source of every
  documented behaviour
- [The repository](https://github.com/devrohit06/astryx-svelte)

## Quick Start

Astryx requires **Svelte 5** or later — `svelte` >= 5.0.0 is the one peer dependency. Runes are used
throughout, so there is no Svelte 4 compatibility mode.

Install the library, a theme, and StyleX:

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-neutral @stylexjs/stylex
npm install -D @stylexjs/unplugin
```

### 1. Configure the compiler

See [Your bundler must run the StyleX compiler](#your-bundler-must-run-the-stylex-compiler) above.
Nothing else in this guide works without it, and nothing else in this guide errors when it is
missing.

### 2. Import the stylesheets

```css
/* src/app.css */
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-neutral/theme.css';
```

`base.css` is **one file, not two**. Astryx splits its reset out as an opt-in
`@astryxdesign/core/reset.css`; here the components are authored against the reset and misrender
without it, so it is folded in and is not optional. The file also declares the cascade layer
order — `reset, astryx-base, astryx-theme, product` — and sets `color-scheme`, without which every
`light-dark()` token is inert.

If your project has existing global CSS, a legacy reset, or Tailwind, assign every stylesheet to a
layer deliberately: unlayered rules beat layered ones regardless of specificity.

### 3. Wrap the app in a theme

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { neutralTheme } from '@astryx-svelte/theme-neutral';
	import '../app.css';

	const { children } = $props();
</script>

<Theme theme={neutralTheme}>
	{@render children()}
</Theme>
```

To route every `Link` and `Button href` through your router, wrap the tree in `LinkProvider` as
well — SvelteKit needs no wrapper for plain `<a>` navigation, so this is only for a custom link
component.

### 4. Use a component

```svelte
<script lang="ts">
	import { Button, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={2}>
	<Button label="Hello Astryx" variant="primary" onclick={() => alert('Hi!')} />
</VStack>
```

### Styling your own markup

Components take a `class`, so plain CSS, a scoped `<style>` block and Tailwind utilities all work.
For the deeper integration, `xstyle` takes StyleX styles:

```ts
// src/routes/page.stylex.ts
import * as stylex from '@stylexjs/stylex';

export const overrides = stylex.create({
	save: { alignSelf: 'flex-end', marginTop: 16 }
});
```

```svelte
<script lang="ts">
	import { Button } from '@astryx-svelte/core';
	import { overrides } from './page.stylex.js';
</script>

<Button label="Save" xstyle={overrides.save} />
```

StyleX must be imported from a `.ts` module, **never from a `.svelte` file**: the bundler plugin
Babel-parses anything importing `@stylexjs/stylex`, and it would read Svelte markup as JSX. Keep
the styles in a sibling `.stylex.ts` and import the object.

### Internationalization

Strings come from a message catalog. `en` ships complete; `fr-FR` and `pseudo` ship as Astryx ships
them.

```svelte
<script lang="ts">
	import { I18nProvider } from '@astryx-svelte/core';
	import fr from '@astryx-svelte/core/locales/fr-FR.json';
</script>

<I18nProvider locale="fr-FR" messages={fr}>
	<!-- … -->
</I18nProvider>
```

### What is not here

Astryx's README documents three delivery paths this package does not have, and they are absent
because of what it ships rather than by preference:

- **A pre-built stylesheet.** There is no `astryx.css`; the compiler emits it into your build.
- **A UMD global and an esm.sh entry.** `dist` is Svelte components plus uncompiled StyleX, so
  there is no bundler-free `<script src>` story. A CDN copy would render unstyled.
- **A Tailwind token bridge.** `tailwind-theme.css` has no counterpart; the tokens are plain CSS
  custom properties, so reference them directly (`bg-[var(--color-background-surface)]`).
