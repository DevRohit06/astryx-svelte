# @astryx-svelte/theme-stone

Warm stone and slate, earthy and understated.

A theme for [astryx-svelte](https://github.com/devrohit06/astryx-svelte) — a Svelte 5 port of [Astryx](https://astryx.atmeta.com/),
Meta's open source design system. Unofficial, and not affiliated with Meta.

## Install

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-stone @stylexjs/stylex
```

`@astryx-svelte/core` is a peer dependency. A theme is data plus one stylesheet; it renders
nothing on its own.

## Use

```css
/* src/app.css */
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-stone/theme.css';
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { stoneTheme } from '@astryx-svelte/theme-stone';
	import '../app.css';

	const { children } = $props();
</script>

<Theme theme={stoneTheme}>
	{@render children()}
</Theme>
```

`base.css` is not optional and is not a duplicate: it declares the cascade layer order and sets
`color-scheme`, without which every `light-dark()` token is inert. And **your bundler must run the
StyleX compiler** over `@astryx-svelte/core`, which is the one setup step that fails without an
error — the components render, unstyled. See
[core's README](https://github.com/devrohit06/astryx-svelte/tree/main/packages/core#your-bundler-must-run-the-stylex-compiler).

## Exports

| Export                                 | What it is                                                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stoneTheme`                           | The theme object, pre-built. It carries `__built`, so `<Theme>` injects no CSS at runtime.                                                                                   |
| `stoneIconRegistry`                    | The 28 semantic icon names mapped to Lucide glyphs. Already attached to `stoneTheme.icons`; exported separately for `registerIcons()` and for composing a theme of your own. |
| `stonePalettes`                        | The raw tonal palettes, as upstream's package publishes them — pure data, the ramps the token values were picked from.                                                       |
| `@astryx-svelte/theme-stone/tokens`    | The same theme as plain data, without `icons`, in a module that imports nothing. Readable by plain Node, which the `.` entry is not — it reaches a `.svelte` registry.       |
| `@astryx-svelte/theme-stone/theme.css` | The pre-built stylesheet.                                                                                                                                                    |

## Fidelity

The theme oracle (`scripts/compare-upstream.mjs`) diffs this package's generated CSS
declaration by declaration against the published `@astryxdesign/theme-stone` tarball, in
**both** directions — a missing declaration, a wrong value and an invented one all fail the
run. It reports **355 of upstream's 358 declarations matching, 0 mismatches**.
The three not compared are the `color-scheme` rules `@astryx-svelte/core`'s
`base.css` owns rather than the theme.

## Resources

- [The documentation site](https://astryx-svelte.rohitk06.in/themes) — every theme rendered live,
  side by side
- [Astryx](https://astryx.atmeta.com/) — the design system this ports
- [The repository](https://github.com/devrohit06/astryx-svelte)

## License

MIT. Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and reuses its
documentation prose, and claims no affiliation or endorsement.
