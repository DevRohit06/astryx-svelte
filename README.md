<!--
	The Astryx mark in this port's own colour — the same SVG the docs site imports
	as its favicon rather than a copy, so the two cannot drift. See
	`docs/src/routes/+layout.svelte` for why the orange is a literal and not
	`currentColor`. `alt=""` because the <h1> below already names it.

	Absolute and pinned to a commit, matching the package READMEs, which are
	published to npm and have no repo to resolve a relative path against. One URL
	across all three beats two mechanisms that can drift apart.
-->

<img
	src="https://raw.githubusercontent.com/DevRohit06/astryx-svelte/37d3aebd2335e38015274448b541c3b2a746a710/docs/src/lib/assets/favicon.svg"
	alt=""
	width="64"
	height="64"
/>

# astryx-svelte

**[Astryx](https://astryx.atmeta.com/), Meta's open source design system, ported to Svelte 5.**
101 components, 8 themes, 184 design tokens — and a compiler-level diff proving they match upstream.
Unofficial, and not affiliated with Meta.

**[Documentation →](https://astryx-svelte.rohitk06.in/)**

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-neutral @stylexjs/stylex
```

```ts
import { Button } from '@astryx-svelte/core';
import '@astryx-svelte/core/base.css';
import '@astryx-svelte/core/astryx.css';
import '@astryx-svelte/theme-neutral/theme.css';
```

That is the whole setup — the stylesheet ships pre-built, so nothing has to run a compiler. If you
would rather compile and tree-shake, [core's README](packages/core#2-compile-it-yourself-from-source)
has the one-line Vite preset.

Requires **Svelte 5**. Runes are used throughout, and there is no Svelte 4 compatibility mode.

## Why this port is different

Most ports ask you to trust them. This one is **checked**, because a design system is the rare thing
where "is this the same?" has a mechanical answer.

Components are authored against the same design-token references Astryx uses, so the StyleX compiler
emits byte-identical atomic CSS. Three oracles then diff our output against the _already compiled_
classes published in `@astryxdesign/*` — a missing declaration, a wrong value and an invented one all
fail the build:

| Oracle            | What it proves                                                     | Result           |
| ----------------- | ------------------------------------------------------------------ | ---------------- |
| Component classes | 1,528 style keys + 615 inline call sites match upstream's          | **0 mismatches** |
| Stylesheet        | 1,463 atomic classes shared with upstream's published `astryx.css` | **0 differing**  |
| Theme tokens      | 2,418 declarations across the eight ported themes                  | **0 mismatches** |

It also means the limits are known rather than hoped for. The class oracle cannot see inside a
`stylex.create` function style, so the stylesheet oracle exists to cover them — and found a real RTL
bug the day it landed. [`CHANGELOG.md`](CHANGELOG.md) names every limitation in the release.

## Packages

| Package                                     | What it is                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| [`@astryx-svelte/core`](packages/core)      | The components, the theme system, the composables, the message catalogs    |
| [`@astryx-svelte/cli`](packages/cli)        | Docs, search, templates, theme tooling and codemods, for humans and agents |
| [`@astryx-svelte/theme-*`](packages/themes) | Eight theme packages, `neutral` being the default Astryx look              |
| [`docs`](docs)                              | The documentation site, built out of the same docs the CLI serves          |

Ten packages ship together at **`0.4.1`**. The number is the Astryx release they port, not a count
of this port's own history — so `0.4.1` means "at parity with Astryx 0.4.1, plus changes upstream has
no counterpart for" (see [`CHANGELOG.md`](CHANGELOG.md) for what a version collision does to that
scheme). `docs` is the eleventh workspace package and is not published.

## The parity rule

**If it's not in Astryx, it's not here.** Invented props, extra variants, nicer defaults and
hand-drawn demo content are defects, not improvements. Upstream's prose is reused; upstream's React
code is not, because none of it is true of a Svelte library. Where a fact genuinely differs — one
stylesheet instead of two, no per-component subpath exports — the port says the true thing rather
than the familiar one.

It cuts the other way too. Upstream bugs are **written down, not replicated**: their published
stylesheet ships ten classes from an ESLint test fixture, `color:#FF0000` among them, because their
build's ignore glob misses the file. Ours does not, and the exemption retires itself when they fix
it.

## The docs site

**[astryx-svelte.rohitk06.in](https://astryx-svelte.rohitk06.in/)** — every component page,
reference topic and example on it is generated from the same `.doc.mjs` modules the CLI reads, so
the site cannot drift from what the CLI prints. Every example is a real file in this repository,
rendering live Svelte rather than a screenshot.

To run it locally:

```sh
pnpm install
pnpm -r build     # the docs generator reads props types out of core's built dist/
pnpm dev
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
pnpm -r test      # vitest + all three fidelity oracles
pnpm dev          # the docs site — the port's only demo surface
```

Never install with `--prod` or prune devDependencies: both fidelity oracles and the docs content
pipeline read the published `@astryxdesign/*` packages, which are devDependencies.

`CLAUDE.md` is the contributor guide, `port/todo.md` the live status and backlog, and `port/ledger/` the
per-component implementation notes.

## License

MIT. Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and reuses its
documentation prose, and claims no affiliation or endorsement.
