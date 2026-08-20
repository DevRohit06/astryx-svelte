# @astryx-svelte/theme-y2k

Hot pinks, lime greens, and Poppins.

A theme for [astryx-svelte](https://github.com/devrohit06/astryx-svelte) — a Svelte 5 port of [Astryx](https://astryx.atmeta.com/),
Meta's open source design system. Unofficial, and not affiliated with Meta.

## Install

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-y2k
```

`@stylexjs/stylex` is a peer dependency and npm and pnpm install it for you. It is required at
runtime — the components reach `stylex.props()` through `sx()` — so add it explicitly if your
package manager does not resolve peers automatically.

`@astryx-svelte/core` is a peer dependency. A theme is data plus one stylesheet; it renders
nothing on its own.

## Use

```css
/* src/app.css */
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-y2k/theme.css';
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { y2kTheme } from '@astryx-svelte/theme-y2k';
	import '../app.css';

	const { children } = $props();
</script>

<Theme theme={y2kTheme}>
	{@render children()}
</Theme>
```

`base.css` is not optional and is not a duplicate: it declares the cascade layer order and sets
`color-scheme`, without which every `light-dark()` token is inert. And **your bundler must run the
StyleX compiler** over `@astryx-svelte/core`, which is the one setup step that fails without an
error — the components render, unstyled. See
[core's README](https://github.com/devrohit06/astryx-svelte/tree/main/packages/core#your-bundler-must-run-the-stylex-compiler).

## Exports

| Export                               | What it is                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `y2kTheme`                           | The theme object, pre-built. It carries `__built`, so `<Theme>` injects no CSS at runtime.                                                                                 |
| `y2kIconRegistry`                    | The 28 semantic icon names mapped to Lucide glyphs. Already attached to `y2kTheme.icons`; exported separately for `registerIcons()` and for composing a theme of your own. |
| `@astryx-svelte/theme-y2k/tokens`    | The same theme as plain data, without `icons`, in a module that imports nothing. Readable by plain Node, which the `.` entry is not — it reaches a `.svelte` registry.     |
| `@astryx-svelte/theme-y2k/theme.css` | The pre-built stylesheet.                                                                                                                                                  |

## Fidelity

The theme oracle (`scripts/compare-upstream.mjs`) diffs this package's generated CSS
declaration by declaration against the published `@astryxdesign/theme-y2k` tarball, in
**both** directions — a missing declaration, a wrong value and an invented one all fail the
run. Every declaration matches, at **0 mismatches**.

The run prints the totals; this paragraph deliberately does not, because a count written into
prose goes stale quietly and these ones had. Where the two totals differ, the remainder is the
`color-scheme` rules that `@astryx-svelte/core`'s `base.css` owns rather than the theme. A
dark-only theme declares no `[light, dark]` pairs, so upstream emits no `html[data-theme=…]`
block for it and the totals are equal.

## Resources

- [The documentation site](https://astryx-svelte.rohitk06.in/themes) — every theme rendered live,
  side by side
- [Astryx](https://astryx.atmeta.com/) — the design system this ports
- [The repository](https://github.com/devrohit06/astryx-svelte)

## License

MIT. Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and reuses its
documentation prose, and claims no affiliation or endorsement.
