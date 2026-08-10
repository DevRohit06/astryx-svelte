# @astryx-svelte/theme-liquid-glass

macOS translucent materials, capsule controls and the Apple system palette. **This theme has no upstream Astryx counterpart** — it is the port’s one deliberate addition to the published surface, and is labelled as such rather than presented as parity.

A theme for [astryx-svelte](https://github.com/devrohit06/astryx-svelte) — a Svelte 5 port of [Astryx](https://astryx.atmeta.com/),
Meta's open source design system. Unofficial, and not affiliated with Meta.

## Install

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-liquid-glass @stylexjs/stylex
```

`@astryx-svelte/core` is a peer dependency. A theme is data plus one stylesheet; it renders
nothing on its own.

## Use

```css
/* src/app.css */
@import '@astryx-svelte/core/base.css';
@import '@astryx-svelte/theme-liquid-glass/theme.css';
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { liquidGlassTheme } from '@astryx-svelte/theme-liquid-glass';
	import '../app.css';

	const { children } = $props();
</script>

<Theme theme={liquidGlassTheme}>
	{@render children()}
</Theme>
```

`base.css` is not optional and is not a duplicate: it declares the cascade layer order and sets
`color-scheme`, without which every `light-dark()` token is inert. And **your bundler must run the
StyleX compiler** over `@astryx-svelte/core`, which is the one setup step that fails without an
error — the components render, unstyled. See
[core's README](https://github.com/devrohit06/astryx-svelte/tree/main/packages/core#your-bundler-must-run-the-stylex-compiler).

## Exports

| Export                                        | What it is                                                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `liquidGlassTheme`                            | The theme object, pre-built. It carries `__built`, so `<Theme>` injects no CSS at runtime.                                                                                         |
| `liquidGlassIconRegistry`                     | The 28 semantic icon names mapped to Lucide glyphs. Already attached to `liquidGlassTheme.icons`; exported separately for `registerIcons()` and for composing a theme of your own. |
| `@astryx-svelte/theme-liquid-glass/tokens`    | The same theme as plain data, without `icons`, in a module that imports nothing. Readable by plain Node, which the `.` entry is not — it reaches a `.svelte` registry.             |
| `@astryx-svelte/theme-liquid-glass/theme.css` | The pre-built stylesheet.                                                                                                                                                          |

## Fidelity

This theme ports nothing, so there is no upstream CSS to diff against. It carries
`scripts/check-theme.mjs` instead, which asserts that every token name it declares is one
of core's 184 and that every component it overrides is a real theme target — both read out
of core's built `dist/`. Neither failure is loud on its own: `defineTheme` accepts any
string, so a typo compiles to CSS that parses, loads and styles nothing.

## Resources

- [The documentation site](https://astryx-svelte.rohitk06.in/themes) — every theme rendered live,
  side by side
- [Astryx](https://astryx.atmeta.com/) — the design system this ports
- [The repository](https://github.com/devrohit06/astryx-svelte)

## License

MIT. Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and reuses its
documentation prose, and claims no affiliation or endorsement.
