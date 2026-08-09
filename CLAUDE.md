# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design system. pnpm
monorepo: `packages/core` (components), `packages/cli`, `packages/themes/*`, `docs`.

## The parity rule

**If it's not in Astryx, it's not here.** Invented props, extra variants, nicer defaults and
hand-drawn demo content are _defects_, not improvements — that includes the demo routes, which must
show upstream's documented API. Upstream bugs are documented in `TODO.md` under "Known debts" rather
than replicated.

Upstream's source is cloned at **`reference/astryx-upstream/`** — gitignored, present locally, and
the thing to read. Read it _before_ porting, not after: source, `.doc.mjs`, tests, storybook, and
the compiled `dist/` in `node_modules/@astryxdesign/core`.

**After cloning it, rename its `CLAUDE.md` to `UPSTREAM-CLAUDE.md`.** Reading any file in that tree
otherwise loads Meta's instructions for _their_ repo into agent context, where they read as
instructions for this one — they describe a React codebase, a different test runner and a CLI this
repo does not have. The content is kept under the new name, and its StyleX capability table is
worth consulting; it just must not auto-load.

`TODO.md` is the live status and backlog (what's next, the batch history, known debts). Read the
relevant section before starting work; update it when work lands. **`PORTED.md` is its companion**
— the per-component implementation notes (what each unit does, the translations it needed, its
oracle and test posture). Status and open decisions go in `TODO.md`; how a component was built goes
in `PORTED.md`.

## Subagents

Five agents in `.claude/agents/` own distinct axes. Use them — they encode this port's failure modes.

- `astryx-parity` — props, styles, elements, exports vs upstream. Run **before** porting (to extract
  the spec) and **after** (to catch drift).
- `astryx-idiom` — whether the React→Svelte translation is _correct_: contexts storing values instead
  of getters, `$derived` caching through a server render, un-`untrack`ed attachments. Exactly the
  class of bug `astryx-parity` is told to ignore.
- `astryx-oracle` — wires a `.stylex.ts` module into the class oracle and diagnoses mismatches.
- `astryx-test-parity` — ports an upstream `.test.tsx` suite case-for-case.
- `astryx-surface` — repo-wide published-API sweep. Run after a batch lands.

## Commands

```sh
pnpm -r build     # must run before check — theme-neutral typechecks against core's built dist/,
                  #   and the docs generator reads props types out of that same dist/
pnpm -r check     # svelte-check + tsc
pnpm -r lint      # prettier --check && eslint
pnpm -r test      # vitest + both fidelity oracles
pnpm -F @astryx-svelte/core test:unit --run      # unit tests only
pnpm -F @astryx-svelte/core test:unit --run src/tests/foo.svelte.test.ts   # one file
#   NOTE: no `--`. Under pnpm 10 the `--` is passed through, so vitest sees
#   `"--" "--run" "<path>"`, ignores both the flag and the filter, and starts a
#   full run in *watch mode* that never exits. It looks exactly like a hang.
#   `--project=client` / `--project=server` narrows to one vitest project.
pnpm dev          # core's demo routes;  pnpm dev:docs for the docs site
pnpm -F docs generate   # regenerate the docs content registries (runs automatically on dev/build)
```

Never install with `--prod` or prune devDependencies: both oracles **and the docs content
pipeline** read the upstream `@astryxdesign/*` packages, which are devDependencies.

## The docs site

`TODO.md`'s Phase 5 is the current goal. Two things about `docs/` are easy to get wrong:

- **It compiles core's StyleX itself.** `dist/` ships `.stylex.js` _uncompiled_ — `svelte-package`
  transpiles TypeScript and does not run StyleX — so `docs/vite.config.ts` runs the same
  `@stylexjs/unplugin` options as `packages/core`, plus `optimizeDeps.exclude` and `ssr.noExternal`
  for `@astryx-svelte/core`. Without those last two, Vite's pre-bundler and the SSR externaliser
  route the modules around the plugin and the page renders unstyled **with no error**.
- **Content comes from `node_modules`, not the upstream clone.** `docs/scripts/generate-content.mjs`
  reads `.doc.mjs` from `@astryxdesign/core` and `@astryxdesign/cli`, both pinned **exact** at the
  version `packages/core` targets. Prose is reused verbatim; prop _types_ are read from
  `packages/core/dist/**/*.d.ts`, because upstream's are React types and mapping them guesses wrong
  (`Button.icon` is `ReactNode` upstream and `Snippet` here, with no string branch).

## The fidelity oracles

`packages/core/scripts/compare-upstream-classes.mjs` compiles our `.stylex.ts` modules with the
StyleX Babel plugin and diffs the emitted atomic classes against the _already compiled_ ones in
`@astryxdesign/core`'s published `dist/`. `packages/themes/neutral/scripts/compare-upstream.mjs`
does the same for theme declarations. Authoring `stylex.create` against the same token references
upstream uses makes the compiler emit byte-identical CSS — that is the property that makes this port
tractable, and these scripts prove it rather than trusting review.

Deferrals are explicit `skip` entries with a reason. A skip that stops matching fails the run, and so
does a skip whose key _starts_ matching — the list cannot rot. The published tarball is ground truth
but **can lag upstream's source** (Icon's px→rem move is the standing example): follow the source and
record a self-retiring skip.

## StyleX constraints

- StyleX may only be imported from `.ts` / `.stylex.ts` modules, never from a `.svelte` file. The
  bundler plugin Babel-parses any module importing `@stylexjs/stylex` and would read Svelte markup as
  JSX. `internal/sx.ts` is the adapter from `stylex.props()` to Svelte's `class`/`style`.
- Adding a **new** `.stylex.ts` file requires a dev-server restart — StyleX's dev cache doesn't pick
  it up.

## Testing

Two vitest projects, selected by filename:

- `*.svelte.test.ts` → **client** project, real headless Chromium via Playwright.
- `*.test.ts` → **server** project, node environment.

Tests and fixtures live in `packages/core/src/tests/`, deliberately outside `src/lib` so
`svelte-package` can never copy them into `dist/`. **This is lint-enforced** — a `*.test.ts` under
`src/lib` is an eslint error, because the rule had drifted once and the only thing keeping the
build artifacts out of the tarball was `package.json`'s `files` denylist. Import through `$lib/…`,
not a relative path out of `src/tests/`. Svelte has no `renderHook`; the substitute is a
_probe_ fixture that runs the hooks and renders their result (a handler-returning hook exposes them
via instance `export const`, reachable through `render(...).component`). `act()` has no counterpart —
a `$state` write flushes on its own and `expect.element` retries.

Upstream suites are ported **case for case**; the count is the contract. Any dropped case is named in
the file with its reason.

Coverage _beyond_ upstream needs a high bar: a hazard with **no upstream analogue**, which the ported
suites structurally cannot catch — a Svelte-specific DOM or reactivity failure React cannot
reproduce. Such a file says so at the top and mutation-checks its fixes.
`src/tests/layer-attribute-repair.svelte.test.ts` is the precedent and, so far, the only one.

## Conventions

- Component dirs are kebab-case under `src/lib/components/`, holding `<name>.svelte` and
  `<name>.stylex.ts`.
- Every component declares its props interface in `<script module>`, exports it, and re-exports it
  from `src/lib/index.ts` — upstream publishes props types, so we do too.
- Relative imports use the `.js` extension even for `.ts` sources.
- Prettier: **tabs**, single quotes, **no trailing commas**, 100 columns.
