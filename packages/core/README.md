<!--
	Absolute, and pinned to a commit rather than to a relative path: this file is
	published to npm, where a repo-relative `src` has nothing to resolve against.
	The target is the same SVG the docs site imports as its favicon.
-->

<img
	src="https://raw.githubusercontent.com/DevRohit06/astryx-svelte/37d3aebd2335e38015274448b541c3b2a746a710/docs/src/lib/assets/favicon.svg"
	alt=""
	width="64"
	height="64"
/>

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

## Styles: import a stylesheet, or compile it yourself

Components are styled with [StyleX](https://stylexjs.com/), and there are two ways to get their CSS.
Pick one.

### 1. Import the pre-built stylesheet — no bundler configuration at all

The same thing Astryx's own package does, and what most projects should do:

```ts
import '@astryx-svelte/core/base.css';
import '@astryx-svelte/core/astryx.css';
import '@astryx-svelte/theme-neutral/theme.css';
```

That is the entire setup. `dist` ships compiled, so nothing needs to run StyleX.

`astryx.css` carries every component's styles — 131 kB, one `@layer astryx-base`, checked against
`@astryxdesign/core`'s published stylesheet on every test run: 1,463 shared atomic classes, zero
differing rules. The cost is that you ship every component's CSS whether you use it or not.

### 2. Compile it yourself, from `source`

Every subpath also publishes a `source` condition pointing at the TypeScript. Ask your bundler for
it and compile the package yourself, and you emit only the atomic classes your app actually reaches
— smaller than the whole stylesheet, at the cost of configuration:

```ts
// vite.config.ts — alongside the preset below
export default defineConfig({
	plugins: [astryx(), sveltekit()],
	resolve: { conditions: ['source'] }
});
```

This is also the property that makes the port verifiable: the compiler derives class names from the
source, so authoring against Astryx's token references emits byte-identical atomic CSS.

Getting this route wrong fails **without an error**: the components render, and they render
unstyled. If that happens, run `pnpm exec astryx-svelte doctor` — it accepts either route, and names
whichever piece is missing.

For Vite (and therefore SvelteKit), **use the preset**:

```ts
// vite.config.ts
import { astryx } from '@astryx-svelte/core/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [astryx(), sveltekit()]
});
```

That is the whole setup. `astryx()` takes `include` (further packages that ship uncompiled
`.stylex.js`), `rootDir` (the StyleX module-resolution root — a monorepo importing `.stylex`
modules across packages wants the workspace root, not the default `process.cwd()`), and `dev`.

<details>
<summary>What the preset does, and why it is three things rather than one</summary>

The plugin compiles the styles. The other two exist because Vite has **two separate ways to route a
dependency _around_ its own plugin pipeline**, and each defeats the compiler on its own:

```ts
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

Written by hand, these options must match this package's own build **exactly**, or the atomic CSS
you compile differs from the output verified against upstream. The preset is the only form in which
"exactly" stays true without anyone maintaining it.

</details>

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
| `@astryx-svelte/core/vite`         | The `astryx()` Vite preset, for compiling from `source`      |
| `@astryx-svelte/core/base.css`     | Layer order and `color-scheme` — always needed               |
| `@astryx-svelte/core/astryx.css`   | Every component's styles, pre-built — see above              |

## Page Layouts

Building a full page? Astryx's advice is to start from a template rather than composing from
scratch, and the CLI has the command:

```bash
pnpm exec astryx-svelte template --list       # browse page and block templates
pnpm exec astryx-svelte template <id> --skeleton
```

**43 page templates ship today** — dashboards, chat, settings, auth, pricing and more — and every id
matches upstream's. `template <id> --skeleton` prints the structure; without it you get the whole
page.

Upstream also ships ~614 _block_ templates, the smaller compositions you drop inside a page. Those
are React source and are still being ported, so `--list` shows the page set only. Templates
contributed by an integration or by any other installed package are discovered and injected the same
way.

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
npm install @astryx-svelte/core @astryx-svelte/theme-neutral
```

`@stylexjs/stylex` is a peer dependency and npm and pnpm install it for you. It is required at
runtime — the components reach `stylex.props()` through `sx()` — so add it explicitly if your
package manager does not resolve peers automatically.

### 1. Import the stylesheets

```css
/* src/app.css */
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/core/astryx.css';
@import '@astryx-svelte/theme-neutral/theme.css';
```

There is no step for configuring a compiler — `astryx.css` is pre-built. (If you would rather
compile and tree-shake, see [route 2](#2-compile-it-yourself-from-source) above.)

Import them **in that order**. `base.css` declares the cascade layer order, and a layer's position is
fixed by where it is first named — so a stylesheet that loads before it can put the layers in the
wrong sequence and quietly invert which rules win.

`base.css` is also **one file, not two**. Astryx splits its reset out as an opt-in
`@astryxdesign/core/reset.css`; here the components are authored against the reset and misrender
without it, so it is folded in and is not optional. It sets `color-scheme` too, without which every
`light-dark()` token is inert.

If your project has existing global CSS, a legacy reset, or Tailwind, assign every stylesheet to a
layer deliberately: unlayered rules beat layered ones regardless of specificity.

### 2. Wrap the app in a theme

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

### 3. Use a component

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

Astryx's README documents two delivery paths this package does not have, and they are absent
because of what it ships rather than by preference:

- **A UMD global and an esm.sh entry.** `dist` is Svelte components, so there is no bundler-free
  `<script src>` story. A CDN copy would render unstyled.
- **A Tailwind token bridge.** `tailwind-theme.css` has no counterpart; the tokens are plain CSS
  custom properties, so reference them directly (`bg-[var(--color-background-surface)]`).
