# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design system. pnpm
monorepo: `packages/core` (components), `packages/cli`, `packages/themes/*`, `docs`.

## The parity rule

**If it's not in Astryx, it's not here.** Invented props, extra variants, nicer defaults and
hand-drawn demo content are _defects_, not improvements — that includes the docs site's example
blocks, which must show upstream's documented API. Upstream bugs are documented in `port/debts.md`
rather than replicated.

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

**A count another script already computes is not tracked until `status.mjs` renders it — and
`status.mjs` must _call_ that script, never recompute its rule.** `generate-content.mjs` printed
`examples N ported / M pending` on every run and discarded it, so that front was measured in prose
for as long as it existed. Reimplementing the tally is where it goes wrong: the count is filtered to
blocks whose target is a **documented entry**, and that set is not the barrel's export list —
`useMediaQuery` is a hook, absent from `src/lib/index.ts`, present in the registry. Walking the
blocks alone reports 13 pending, filtering off the barrel reports 8, and the answer is 9. Both wrong
implementations look obviously right (batch 039).

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
                   #   **Redirect its output, never pipe it.** `pnpm verify 2>&1 | tail -80` returns
                   #   `tail`'s exit code, so a run that failed 3 of 7 stages reads as a clean pass
                   #   — the same hazard as the && chain, reached from the other direction. Write to
                   #   a file and grep the file (batch 032).
pnpm verify --fast # skips the whole test stage — the browser suite (real Chromium, thousands of
                   #   cases), the node suites, the CLI's own checks and the theme oracles. Use it
                   #   for a quick read *between* commits, never as a batch's gate. Batch 029 was
                   #   gated on it and the first full run found four defects it structurally could
                   #   not see: six `FormLayout` cases printing `[object Object]` since the context
                   #   became an object, the CLI's bundled copy of `neutral-theme.ts` left stale by
                   #   a Banner change, three documented theming targets with no `themeProps`
                   #   literal, and two `InputClearButton` cases the pin move added. Three of those
                   #   came from one commit. **`pnpm verify` — full — before the batch is called
                   #   done, and before any release.**
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
#   Run it alone. Two vitest processes on this project at once fail at *project
#   init* — `EPERM: operation not permitted, rename` on Windows, as both write
#   `.svelte-kit` and the Vite cache — and every chunk then reports as failed.
#   It reads as a catastrophic regression rather than as contention, and it cost
#   a full 30-minute gate run to a background agent that was running the suite
#   at the same time. Same rule for `pnpm verify`, which runs this.
#   **The same contention bites a cold Vite cache**, which `pnpm -r build` leaves
#   behind — so every `pnpm verify` run has one. Four chunks launching at once all
#   found the cache missing, all started `Forced re-optimization of dependencies`,
#   and three of the four never printed a header and held their slots until the
#   30-minute stage timeout killed the run, while every later chunk passed. It
#   reads as a catastrophic regression and is contention; each stalled chunk
#   passes in isolation. `run-client-tests.mjs` now runs its **first chunk alone**
#   to warm the cache before starting the pool — this was an instruction to warm
#   it by hand, and it cost a second gate run in batch 041 to the one thing an
#   instruction cannot do. Driving vitest directly (`test:unit`, or a bare
#   `--project=client`) still has no such guard.
#   The client project cannot be run in one process: it dies partway through with
#   `wrapDynamicImport` of undefined (Vite's module runner, not an assertion) and
#   reports every later file as failed. Measured on both Windows and Ubuntu CI, at a
#   different file each time. `scripts/run-client-tests.mjs` runs it in batches of 20
#   (`CLIENT_CHUNK_SIZE` overrides) and reconciles files-run against files-on-disk, so
#   a chunk that collected nothing fails the run instead of shrinking the total. This
#   is what `core`'s `test` script and CI both use; a bare `--project=client` over every
#   client test file is not a measurement.
#   **Audit a generated script for control characters before trusting its output.**
#   A `\b` written through a shell heredoc can reach the file as the character it
#   names rather than the escape - U+0008, not a word boundary. Inside a regex
#   literal that still compiles, still lints, still typechecks, and simply never
#   matches. In batch 037 that made `status.mjs` report 38 weak assertions where
#   one was, and it was found only by piping the line through `cat -A` and seeing
#   `^H`. It failed *safe* - overstating the work - which is why nobody audits it.
#   `node -e "const s=require('fs').readFileSync(F,'utf8');"` plus a scan for
#   codepoints under 32 settles it in one command.
pnpm dev          # the docs site — the only demo surface (see below)
pnpm -F docs generate   # regenerate the docs content registries (runs automatically on dev/build)
```

Never install with `--prod` or prune devDependencies: all three oracles **and the docs content
pipeline** read the upstream `@astryxdesign/*` packages, which are devDependencies.

## The docs site

**It is the port's only demo surface.** `packages/core` used to carry a SvelteKit demo route beside
its library — 36 files that predated the docs site and were kept because nothing else showed a
component running. Once `docs/` covered every component with its own example blocks, the route was
two places to demonstrate the same thing, and the parity rule applied to both. It is gone; `pnpm
dev` runs the docs site, and a component's examples live in `docs/src/lib/examples/<Name>/`.

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
- **`packages/core/src/lib/**/*.doc.mjs` are generated, and hand-editing them is a mistake** — each
  says so at the top. `docs/scripts/emit-core-docs.mjs` writes them from the pinned upstream
  `.doc.mjs` plus core's built `dist/**/*.d.ts`, so after a version bump the whole prose delta lands
  with `pnpm -r build && pnpm -F docs emit-core-docs` (17 files at 0.4.2), and `--check` fails on
  drift. They are the CLI's discovery corpus, not just the docs site's.

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

**A green class oracle is not a finished migration.** The oracle compares style _keys_. When
upstream moves a declaration out of a component into a shared module — `interactionOverlay` at
0.5.1, applied at twenty call sites — deleting the component's own rules satisfies it whether or not
anything applies the shared style in their place. Six modules were briefly left with **no hover or
pressed state at all** and a completely clean oracle run; nothing failed, and the only reason it was
caught is that the call sites had been written down as pending before the keys were removed. Any
change that relocates a declaration needs its own check that the consumer adopts it, because the
oracle structurally cannot supply one. Related: derive the set to migrate **from the oracle**, not
from a consumer list — upstream had twenty adopters and forty-two of our modules referenced the same
token, and the set that actually needed changing was neither (batch 040).

## StyleX constraints

- StyleX may only be imported from `.ts` / `.stylex.ts` modules, never from a `.svelte` file. The
  bundler plugin Babel-parses any module importing `@stylexjs/stylex` and would read Svelte markup as
  JSX. `internal/sx.ts` is the adapter from `stylex.props()` to Svelte's `class`/`style`.
- Adding a **new** `.stylex.ts` file requires a dev-server restart — StyleX's dev cache doesn't pick
  it up.
- **A `stylex.create` key that nothing in the module references is compiled away**, so adding a
  style group is invisible until a component actually uses it — the class oracle reports it as
  `ours: (absent)` and its "style keys checked" total does not move, which reads exactly like the
  oracle failing to re-read the file. It is not: `treeshakeCompensation` drops the key. Wire the key
  through its `*Attrs` helper and its `.svelte` call site in the same change, then re-run the
  oracle. (Batch 032, `Item`'s `layout="inline"` trio.)

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

Upstream suites are ported **case for case**, and every file says which one it ports: a
`PORTS: <upstream/path.test.tsx>` line in the header, or `NO-UPSTREAM:` where there is nothing
upstream to port. `status.mjs` reads nothing else — a file with neither marker, or one naming a
suite the current pin does not have, **fails the gate**. Any dropped case is still named in the
file with its reason; what the header no longer states is a _number_. The shortfall against
upstream is arithmetic over the markers and lives in `port/status.md`'s case delta, because a
header's count is a contract against upstream's file at the pin and a version bump falsifies every
one of them at once — when this rule landed, 203 of these files still named the `0.5.0` pin against
a tree at `0.5.2`.

**One file ports one upstream suite** — `theme.test.ts` covered fragments of six at once, so no
count in it could be stated against any of them and the contract applied to not a single case; 22
already-ported cases read as unported until they were split out (batch 030). A few files legitimately
fold a family (five `Chat` message suites over one fixture) and a few suites are split across two
files; both declare every edge, and the delta is computed per connected group so neither
double-counts.

**`getByRole(role, {name: 'X'})` is not the same assertion here as upstream.** Testing Library
matches an accessible name as a **whole string**; the browser project's locators are Playwright's,
where a string `name` is a case-insensitive **substring**. A case ported verbatim is therefore
_weaker_ than the one it ports, and passes where upstream's would fail — `VisuallyHidden`'s
icon-only-control case still passed with the icon's `aria-hidden` removed and the name reading
`'Trash Delete'`, until `exact: true` was added. Pass `exact: true` with every string `name`. A
regex `name` is substring-matching on both sides by construction and needs nothing. `status.md`
counts the sites that still lack it.

**A version bump is still scope, not follow-up** — diff the test delta as part of the batch that
moves the pin (`track-upstream` step 5b). What changed is that the delta is now measured rather
than re-typed: `status.md` recomputes every suite's shortfall from the markers on each run, so a
bump can no longer leave a gap looking accounted for the way four false headers did at 0.4.2, where
the two Layer defects that shipped were exactly what the unported cases existed to catch. A dropped
case's stated _reason_ still expires and nothing checks it: `button-group` carried "`DropdownMenu`
is not ported" for three batches after it was.

**Attribution is declared because inferring it failed in both directions.** It used to be read off
a file naming an upstream suite anywhere in its text, or sharing its kebab-cased basename. So a
header written to be _honest_ about a gap closed it on paper — `scroll-lock.svelte.test.ts`'s
sentence about `hooks/scrollbarGutter.test.ts` subtracted eight cases from the delta rather than
adding them, and `layout.svelte.test.ts` understated its gap by 34 the same way (batch 033). An
`UNPORTED:` marker was added to subtract those back, and it worked only where someone remembered
it: at 0.5.2 three suites still read as covered because a file mentioned them to say they were not
ported (`Heading` 24 cases, `theme/MediaTheme.dom` 8, `BottomSheetEdgeTint` 10) and a fourth
because an SSR-only companion file shared its stem (`useResizable` 29). A declaration cannot be
forgotten, because nothing else grants coverage — the failure mode is structurally gone rather
than patched (batch 041).

**The compiled StyleX sheet is on a browser-test page twice.** Vite's dev server injects it for
the module graph `setup-stylex.ts` imports, and that setup file then appends its own `<style>` so
the sheet is complete whatever the suite imports. A suite counting rules out of
`document.styleSheets` therefore reads every rule twice, and an upstream `toHaveLength(1)` fails
for a reason that is about the harness rather than the styles. De-duplicate by rule text — never
loosen it to `toBeGreaterThan(0)`, which would still pass with a second, contradictory rule in the
sheet. The rules also sit inside `@layer` blocks, so the walk has to descend where upstream's
single top-level pass did not (`mobile-nav-entry-animation.svelte.test.ts`).

**A header that discusses `it` in backticks used to inflate its own count.** `status.mjs` counted a
bare `it` followed by a backtick as a declaration, and a backtick-quoted `it` in prose is exactly
that — so a suite explaining its own counting could overstate the contract it exists to state, and
two upstream suites read one case higher than they declare. Only `it.each` and `it.for` are tagged
templates; the regex now requires a call paren for everything else. If a derived count ever looks
implausible, check the header's prose before the code (batch 033).

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
- **A React node prop gated on state translates to a conditional _snippet_, never an `{#if}` inside
  the tag.** Upstream writes `{active === N && (…)}` for a `children`/slot prop, which hands the
  component a falsy child so nothing renders. A snippet passed by slot is always defined, so an
  `{#if}` wrapping the body leaves every `{#if children}` guard _inside_ the component true and
  renders its wrapper around an empty slot. `Step` has two such guards and the second is not
  cosmetic: `hasContentSeg = isVertical && children != null` drives the **connector geometry**, so
  the vertical `StepperCustomContent` block would have grown a segment on every inactive step. Pass
  it through instead — `children={active === 0 ? content : undefined}` (batch 038).
- Prettier: **tabs**, single quotes, **no trailing commas**, 100 columns.
