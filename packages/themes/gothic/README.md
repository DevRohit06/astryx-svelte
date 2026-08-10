# @astryx-svelte/theme-gothic

Deep blue-grays and a signature display serif. Dark-only.

A theme for [astryx-svelte](https://github.com/devrohit06/astryx-svelte) — a Svelte 5 port of [Astryx](https://astryx.atmeta.com/),
Meta's open source design system. Unofficial, and not affiliated with Meta.

## Install

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-gothic @stylexjs/stylex
```

`@astryx-svelte/core` is a peer dependency. A theme is data plus one stylesheet; it renders
nothing on its own.

## Use

```css
/* src/app.css */
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-gothic/theme.css';
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { gothicTheme } from '@astryx-svelte/theme-gothic';
	import '../app.css';

	const { children } = $props();
</script>

<Theme theme={gothicTheme}>
	{@render children()}
</Theme>
```

`base.css` is not optional and is not a duplicate: it declares the cascade layer order and sets
`color-scheme`, without which every `light-dark()` token is inert. And **your bundler must run the
StyleX compiler** over `@astryx-svelte/core`, which is the one setup step that fails without an
error — the components render, unstyled. See
[core's README](https://github.com/devrohit06/astryx-svelte/tree/main/packages/core#your-bundler-must-run-the-stylex-compiler).

## Exports

| Export                                  | What it is                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gothicTheme`                           | The theme object, pre-built. It carries `__built`, so `<Theme>` injects no CSS at runtime.                                                                                    |
| `gothicIconRegistry`                    | The 28 semantic icon names mapped to Lucide glyphs. Already attached to `gothicTheme.icons`; exported separately for `registerIcons()` and for composing a theme of your own. |
| `gothicPalettes`                        | The raw tonal palettes, as upstream's package publishes them — pure data, the ramps the token values were picked from.                                                        |
| `@astryx-svelte/theme-gothic/tokens`    | The same theme as plain data, without `icons`, in a module that imports nothing. Readable by plain Node, which the `.` entry is not — it reaches a `.svelte` registry.        |
| `@astryx-svelte/theme-gothic/theme.css` | The pre-built stylesheet.                                                                                                                                                     |

## Fidelity

The theme oracle (`scripts/compare-upstream.mjs`) diffs this package's generated CSS
declaration by declaration against the published `@astryxdesign/theme-gothic` tarball, in
**both** directions — a missing declaration, a wrong value and an invented one all fail the
run. It reports **345 of upstream's 345 declarations matching, 0 mismatches**.
The counts are equal because a dark-only theme declares no `[light, dark]` pairs, so
upstream emits no `html[data-theme=…]` block for it and there is nothing left over.

## Resources

- [The documentation site](https://astryx-svelte.rohitk06.in/themes) — every theme rendered live,
  side by side
- [Astryx](https://astryx.atmeta.com/) — the design system this ports
- [The repository](https://github.com/devrohit06/astryx-svelte)

## License

MIT. Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and reuses its
documentation prose, and claims no affiliation or endorsement.
