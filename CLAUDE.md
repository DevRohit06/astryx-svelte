# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design system. pnpm
monorepo: `packages/core` (components), `packages/cli`, `packages/themes/*`, `docs`.

## The parity rule

**If it's not in Astryx, it's not here.** Invented props, extra variants, nicer defaults and
hand-drawn demo content are _defects_, not improvements — that includes the demo routes, which must
show upstream's documented API. Upstream bugs are documented in `port/debts.md` rather than
replicated.

Upstream's source is cloned at **`reference/astryx-upstream/`** — gitignored, present locally, and
the thing to read. Read it _before_ porting, not after: source, `.doc.mjs`, tests, storybook, and
the compiled `dist/` in `node_modules/@astryxdesign/core`.

**After cloning it, rename its `CLAUDE.md` to `UPSTREAM-CLAUDE.md`.** Reading any file in that tree
otherwise loads Meta's instructions for _their_ repo into agent context, where they read as
instructions for this one — they describe a React codebase, a different test runner and a CLI this
repo does not have. The content is kept under the new name, and its StyleX capability table is
worth consulting; it just must not auto-load.

**`port/` holds everything about building this port**, and `port/README.md` maps what goes where.
`port/todo.md` is the backlog — the current goal and what's next, no metrics and no batch history.
`port/status.md` is **generated** by `scripts/status.mjs` and must never be hand-edited; `pnpm
verify` regenerates it and fails when the committed file has drifted. `port/debts.md` records every
deliberate divergence from upstream with a machine-readable head (`units`, `kind`, `retires`).
`port/ledger/` holds one file per batch — how the work was actually done. `port/research/` is frozen
upstream analysis: research, not spec, so verify it against source before trusting it.

**Never write a metric into prose.** A count belongs in `port/status.md` and nowhere else — that is
what stopped "100 / 100" surviving three batches after upstream moved to 101, in a file that ended up
telling readers not to trust its own numbers.

Batches open with the `start-batch` skill and close with `close-batch`, which runs the audit agents
below and carries the **promotion rule**: a lesson that constrains future work moves into this file
or an agent's file, in the same commit — never left stranded in a ledger entry or a research file.
Three more skills cover the rest of the loop: `port-component` ports one component end to end,
`track-upstream` pulls an Astryx release and scopes the drift it introduces, and `release` cuts a
version once a batch's gate is green.

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
pnpm verify        # the gate: every stage runs and every result reports, then port/status.md is
                   #   regenerated and diffed against what's committed. Prefer this to chaining
                   #   build/check/lint/test with && — that reports "failed" identically whether
                   #   one stage failed or both ran, and once hid six real errors behind the first.
pnpm verify --fast # skips the browser suite (real Chromium, thousands of cases); for gating a
                   #   commit locally.
pnpm -r build     # must run before check — theme-neutral typechecks against core's built dist/,
                  #   and the docs generator reads props types out of that same dist/
pnpm -r check     # svelte-check + tsc
pnpm -r lint      # prettier --check && eslint
pnpm -r test      # vitest + all three fidelity oracles
pnpm -F @astryx-svelte/core test:unit --run      # unit tests only
pnpm -F @astryx-svelte/core test:unit --run src/tests/foo.svelte.test.ts   # one file
#   NOTE: no `--`. Under pnpm 10 the `--` is passed through, so vitest sees
#   `"--" "--run" "<path>"`, ignores both the flag and the filter, and starts a
#   full run in *watch mode* that never exits. It looks exactly like a hang.
#   `--project=client` / `--project=server` narrows to one vitest project.
pnpm -F @astryx-svelte/core test:client   # the client project, chunked — see below
#   The client project cannot be run in one process: it dies partway through with
#   `wrapDynamicImport` of undefined (Vite's module runner, not an assertion) and
#   reports every later file as failed. Measured on both Windows and Ubuntu CI, at a
#   different file each time. `scripts/run-client-tests.mjs` runs it in batches of 20
#   (`CLIENT_CHUNK_SIZE` overrides) and reconciles files-run against files-on-disk, so
#   a chunk that collected nothing fails the run instead of shrinking the total. This
#   is what `core`'s `test` script and CI both use; a bare `--project=client` over every
#   client test file is not a measurement.
pnpm dev          # core's demo routes;  pnpm dev:docs for the docs site
pnpm -F docs generate   # regenerate the docs content registries (runs automatically on dev/build)
```

Never install with `--prod` or prune devDependencies: all three oracles **and the docs content
pipeline** read the upstream `@astryxdesign/*` packages, which are devDependencies.

## The docs site

See `port/todo.md`'s `## Current goal` for what's active. Two things about `docs/` are easy to get
wrong:

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

`packages/core/scripts/compare-upstream-css.mjs` is the third, and covers what the first cannot.
`compare-upstream-classes.mjs` reads modules _statically_, so a `stylex.create` **function style** is
opaque to it, and this port has more than a few. The CSS oracle builds `dist/astryx.css` (via
`scripts/lib/collect-stylex-rules.mjs`, shared with `build-css.mjs`, so the sheet that ships is the
sheet that was checked) and diffs it against upstream's published `astryx.css`, where a function
style's output is just another rule. Reach for it when a bug would live inside one. Two classes of
expected difference are paired rather than ignored: `:not(#\#)` padding is stripped from both sides,
and marker-scoped rules are compared with their path-derived hashes blinded.

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
- Any event a component handles itself must be destructured out of `$props()` and invoked
  explicitly, in upstream's documented order — `{...rest}` beside an explicit handler for the same
  event is one object literal, and the last key silently wins. `ComplexSelector` shipped with a
  consumer's `onclick` discarded exactly this way (`port/ledger/026-selector-family.md`).
- Prettier: **tabs**, single quotes, **no trailing commas**, 100 columns.
