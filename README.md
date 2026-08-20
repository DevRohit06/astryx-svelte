<!--
	The Astryx mark in this port's own colour — the same SVG the docs site imports
	as its favicon rather than a copy, so the two cannot drift. See
	`docs/src/routes/+layout.svelte` for why the orange is a literal and not
	`currentColor`.

	Every image and badge below is an absolute URL pinned to a commit, matching
	the package READMEs, which are published to npm and have no repo to resolve a
	relative path against. One URL across all three beats two mechanisms that can
	drift apart.
-->

<div align="center">

<img
	src="https://raw.githubusercontent.com/DevRohit06/astryx-svelte/37d3aebd2335e38015274448b541c3b2a746a710/docs/src/lib/assets/favicon.svg"
	alt=""
	width="88"
	height="88"
/>

# astryx-svelte

**[Astryx](https://astryx.atmeta.com/), Meta's open source design system, ported to Svelte 5.**

[![npm](https://img.shields.io/npm/v/@astryx-svelte/core?style=flat&color=EA6A24&label=%40astryx-svelte%2Fcore)](https://www.npmjs.com/package/@astryx-svelte/core)
[![CI](https://img.shields.io/github/actions/workflow/status/DevRohit06/astryx-svelte/ci.yml?style=flat&label=CI)](https://github.com/DevRohit06/astryx-svelte/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)

[**Documentation**](https://astryx-svelte.rohitk06.in/) · [**Components**](https://astryx-svelte.rohitk06.in/components) · [**Themes**](https://astryx-svelte.rohitk06.in/themes) · [**Changelog**](CHANGELOG.md)

</div>

<br />

<a href="https://astryx-svelte.rohitk06.in/">
	<img
		src="https://raw.githubusercontent.com/DevRohit06/astryx-svelte/fada324f7e8e11ea4f59d67cc359c8ec14d7f1ef/docs/static/og.png"
		alt="astryx-svelte — Astryx, ported to Svelte 5"
	/>
</a>

<br />

An unofficial, community port. Not affiliated with, endorsed by, or supported by Meta.

Every component is authored against the same design-token references Astryx uses, so the StyleX
compiler emits byte-identical atomic CSS — and three oracles diff that output against the
_already published_ `@astryxdesign/*` packages on every build. It is a port you can check rather
than one you have to trust.

## Installation

```bash
npm install @astryx-svelte/core @astryx-svelte/theme-neutral
```

`@stylexjs/stylex` is a peer dependency and npm and pnpm install it for you. It is required at
runtime — the components reach `stylex.props()` through `sx()` — so add it explicitly if your
package manager does not resolve peers automatically.

```ts
import { Button } from '@astryx-svelte/core';
import '@astryx-svelte/core/base.css';
import '@astryx-svelte/core/astryx.css';
import '@astryx-svelte/theme-neutral/theme.css';
```

That is the whole setup — the stylesheet ships pre-built, so nothing has to run a compiler. To
compile and tree-shake from source instead, [core's README](packages/core#2-compile-it-yourself-from-source)
has the one-line Vite preset.

Requires **Svelte 5**. Runes are used throughout; there is no Svelte 4 compatibility mode.

## Why this port is different

Most ports ask you to trust them. This one is **checked**, because a design system is the rare
thing where "is this the same?" has a mechanical answer.

| Oracle                | What it diffs                                                    |
| --------------------- | ---------------------------------------------------------------- |
| **Component classes** | Our compiled atomic classes against upstream's published `dist/` |
| **Stylesheet**        | Our built `astryx.css` against upstream's, rule for rule         |
| **Theme tokens**      | Every declaration in all eight theme packages                    |

A missing declaration, a wrong value and an invented one all fail the build. The live counts —
components, oracle keys, ported test cases, known debts — are **generated** into
[`port/status.md`](port/status.md) rather than written here, because a number typed into prose
goes stale quietly and this one used to.

The limits are known rather than hoped for, too. The class oracle cannot see inside a
`stylex.create` function style, which is why the stylesheet oracle exists — and it found a real
RTL bug the day it landed. [`port/debts.md`](port/debts.md) records every deliberate divergence
with the condition that retires it.

## Packages

| Package                                     | What it is                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| [`@astryx-svelte/core`](packages/core)      | The components, the theme system, the composables, the message catalogs    |
| [`@astryx-svelte/cli`](packages/cli)        | Docs, search, templates, theme tooling and codemods, for humans and agents |
| [`@astryx-svelte/theme-*`](packages/themes) | Eight theme packages, `neutral` being the default Astryx look              |
| [`docs`](docs)                              | The documentation site, built from the same docs the CLI serves            |

Ten packages ship together, versioned by the **Astryx release they port** rather than by this
port's own history — so `0.4.5` means "at parity with Astryx 0.4.5, plus changes upstream has no
counterpart for". [`CHANGELOG.md`](CHANGELOG.md) explains what a version collision does to that
scheme. `docs` is the eleventh workspace package and is not published.

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

## Documentation

**[astryx-svelte.rohitk06.in](https://astryx-svelte.rohitk06.in/)** — every component page,
reference topic and example is generated from the same `.doc.mjs` modules the CLI reads, so the
site cannot drift from what the CLI prints. Every example is a real file in this repository,
rendering live Svelte rather than a screenshot.

Read the same content in your terminal:

```sh
npx @astryx-svelte/cli component Button
npx @astryx-svelte/cli docs getting-started
```

## Contributing

```sh
pnpm install
pnpm -r build     # must run before check — the docs generator reads core's built dist/
pnpm dev          # the docs site, the port's only demo surface

pnpm verify       # the gate: build, check, lint, test, and the status drift check
```

Never install with `--prod` or prune devDependencies: all three fidelity oracles **and** the docs
content pipeline read the published `@astryxdesign/*` packages, which are devDependencies.

[`CLAUDE.md`](CLAUDE.md) is the contributor guide, [`port/todo.md`](port/todo.md) the live goal and
backlog, and [`port/ledger/`](port/ledger) the per-batch implementation notes — including what
broke and why, which is usually the more useful half.

## License

[MIT](LICENSE). Astryx is © Meta Platforms, Inc. and affiliates; this project ports its design and
reuses its documentation prose, and claims no affiliation or endorsement.
