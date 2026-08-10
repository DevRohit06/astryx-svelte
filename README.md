# astryx-svelte

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design system.
**Unofficial, and not affiliated with Meta.**

Astryx requires **Svelte 5** — runes are used throughout `@astryx-svelte/core`, and there is no
Svelte 4 compatibility mode.

## Packages

| Package                                                    | What it is                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`@astryx-svelte/core`](packages/core)                     | The components, the theme system, the composables, the message catalogs   |
| [`@astryx-svelte/cli`](packages/cli)                       | Docs, search, templates, theme tooling and codemods, for humans and agents |
| [`@astryx-svelte/theme-*`](packages/themes)                | Eight theme packages, `neutral` being the default Astryx look             |
| [`docs`](docs)                                             | The documentation site, built out of the same docs the CLI serves         |

Ten packages ship together at **`0.3.0`**, which is the Astryx release they port — the versions
track upstream's rather than counting this port's own history, so `0.3.0` here means "at parity
with Astryx 0.3.0". `docs` is the eleventh workspace package and is not published.

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-neutral @stylexjs/stylex
npm install -D @stylexjs/unplugin
```

**Your bundler must run the StyleX compiler**, and getting that wrong fails without an error — the
components render, unstyled. [`packages/core/README.md`](packages/core#your-bundler-must-run-the-stylex-compiler)
has the setup, and [`CHANGELOG.md`](CHANGELOG.md) what is in the release and what its known
limitations are.

## The parity rule

**If it's not in Astryx, it's not here.** Invented props, extra variants, nicer defaults and
hand-drawn demo content are defects, not improvements. Upstream's prose is reused; upstream's React
code is not, because none of it is true of a Svelte library. Where a fact genuinely differs — one
stylesheet instead of two, no per-component subpath exports, a StyleX compile step the consumer
runs — the port says the true thing rather than the familiar one.

Fidelity is checked mechanically rather than by review. Because components are authored against the
same design-token references Astryx uses, the StyleX compiler emits **byte-identical atomic CSS**,
and two oracles diff our compiled output against the already-compiled classes in the published
`@astryxdesign/*` packages.

## The docs site

**[astryx-svelte.rohitk06.in](https://astryx-svelte.rohitk06.in/)** — every component page,
reference topic and example on it is generated from the same `.doc.mjs` modules the CLI reads, so
the site cannot drift from what the CLI prints. Every example is a real file in this repository,
rendering live Svelte rather than a screenshot.

To run it locally:

```sh
pnpm install
pnpm -r build     # the docs generator reads props types out of core's built dist/
pnpm dev:docs
```

Or read the same content in the terminal:

```sh
node packages/cli/bin/astryx-svelte.mjs component Button
node packages/cli/bin/astryx-svelte.mjs docs getting-started
```

## Working in the repo

```sh
pnpm -r build     # must run before check
pnpm -r check     # svelte-check + tsc
pnpm -r lint      # prettier --check && eslint
pnpm -r test      # vitest + both fidelity oracles
pnpm dev          # core's demo routes
```

Never install with `--prod` or prune devDependencies: both fidelity oracles and the docs content
pipeline read the published `@astryxdesign/*` packages, which are devDependencies.

`CLAUDE.md` is the contributor guide, `TODO.md` the live status and backlog, and `PORTED.md` the
per-component implementation notes.

## License

MIT. Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and reuses its
documentation prose, and claims no affiliation or endorsement.
