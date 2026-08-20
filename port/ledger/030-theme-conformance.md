---
seq: 030
title: Batch 30 — the theme conformance suites
upstream: 0.4.5
date: 2026-08-21
units:
  [
    theme/expand-radius-scale,
    theme/expand-motion-scale,
    theme/expand-type-scale,
    theme/tokens,
    theme/on-media-tokens,
    theme/parse-style-key,
    theme/derived-var-registry,
    theme/theming-targets,
    theme/extensible-axes
  ]
upstream-prs: []
---

## Scope

First slice of front 1 (the test delta) under the full-parity goal set in `port/todo.md`. Eight of
the nine `theme/` suites `status.md` counted as unported, plus the split of
`src/tests/theme.test.ts` that makes their counts checkable at all.

The ninth, `generateThemeRules.test.ts`, is **deliberately not ported** — see _Deferred_ below. It
is the only item in scope that did not land, and `status.md` keeps counting it.

Nothing outside `packages/core/src/lib/theme/` and `src/tests/` changed.

## Why the tests came first, and what they cost

Two of these suites could not be ported at all until the module under them had upstream's shape.
That is the argument for sequencing the test delta ahead of the published-surface front rather than
after it: **the unported suites are the specification for the drift**, and porting one either
passes or names the divergence precisely.

### `expandTypeScale` — a signature that was not upstream's

`expandTypeScale(config: TypographyConfig)` here took the whole `{scale, body, heading, code}`
block and did two jobs upstream gives to `defineTheme`: building `--font-family-*` from the role
declarations, and mapping named weights (`'bold'`) onto `var(--font-weight-bold)`. Upstream's takes
`TypeScaleConfig` — `{base, ratio, weights?}`, weights already resolved to CSS values.

So the **published** `TypeScaleConfig` was shape drift under a shared name: a consumer typing
against it got `{base, ratio}` and handed the function an object it would not accept. `debts.md`
had this recorded and said it wanted a parity pass rather than a rename. It did.

Both jobs moved to `define-theme.ts` as `typeScaleConfigFrom` and `fontFamilyTokens`, which is
where upstream's `defineTheme` has them, and the move found two real defects:

- **`heading` did not inherit `body`'s family.** Upstream: `buildFontFamily(heading) ?? bodyFamily`.
  Ours had no fallback, so a theme naming only `body.family` kept the base theme's heading face.
- **A branch upstream has no counterpart for.** A `typography` with weights but no `scale` emitted
  `--text-*-weight` tokens here; upstream emits nothing without a scale.

`TypeRole`/`TypeWeight` became `TypographyRole`/`FontWeight` and moved to `theme/types.ts`, which is
where upstream's `theme/index.ts` publishes them from. The expander's barrel entry narrowed to
upstream's two names. Three of the four names in the "no upstream counterpart or the wrong one"
debt are closed; `TokenMap` remains.

All seven theme oracles stayed at zero mismatches across the restructure, which is the evidence it
is behaviour-preserving for every shipped theme.

### `theme.test.ts` was six suites in one file

`onMediaTokens`' 22 cases were **already ported** — inside `theme.test.ts`, along with fragments of
`defineTheme`, `parseStyleKey`, `expandMotionScale`, `expandTypeScale` and `generateThemeCss`. A
file that names six upstream suites at once cannot state a count against any of them, so
CLAUDE.md's contract did not apply to a single case in it, and `status.md` read the whole lot as
unported.

Splitting them into files named for the suite they port is most of what this batch did. The
coverage was there; the contract was not. What is left in `theme.test.ts` is the part with no
upstream counterpart — the pin against neutral's published `theme.css`, the syntax theme — plus the
`defineTheme` and `generateThemeCss` fragments, which are the next batch's work.

## The three guards

`derivedVarRegistry`, `themingTargets` and `extensibleAxes` are not unit tests. They scan the source
tree and hold three separate promises to the docs that describe them. **`themingTargets` is the
check that would have caught the three documented theming targets which shipped at 0.4.5 rendering
no class at all** — found instead by a full gate run, after the fact. All three pass on the tree as
it stands.

Porting them needed four honest extensions, each named in its own file's header:

- **A Svelte-shaped extractor.** Upstream reads `themeProps()` call sites out of the TypeScript AST
  and says why: the sites use every object form, so a regex reading identifiers after `:` records
  the local (`fillVariant`) instead of the prop (`variant`). The same argument holds here, so
  `themingTargets` walks `svelte/compiler`'s AST — one visitor reaches `themeProps('x')` in a
  `const` and `{...themeProps('x')}` on an element alike — and a `.ts` module is analysed by
  wrapping it in a `<script lang="ts">`. `extensibleAxes` needs interface and type-alias nodes, so
  it uses the TypeScript parser as upstream does, over the script bodies lifted out of `.svelte`.
- **CSS vars declared as text.** This port writes custom properties as object keys in `.stylex.ts`
  **and** as text in a `style` attribute in `.svelte`. Upstream's `'--x':` pattern is blind to the
  second, which is a class of declaration upstream's own scan is not blind to — `--_tree-indent` is
  declared in both trees and visible only to upstream's. `.svelte` files get a second pattern; it
  finds three vars and nothing else.
- **A split family doc.** Upstream's `Indicator.doc.mjs` is one file covering six classes; this
  port's generator emits one per family member. Where the fallback doc search returns several files
  for one directory, their union is compared — that union is what upstream's single file is.
- **One dropped case, named.** `extensibleAxes`' `every open prop union is declared in an index a
consumer can augment` has no counterpart: it checks that each `*Map` lives in
  `<Component>/index.ts`, the subpath a consumer augments, and **this port ships no per-component
  subpath** (`debts.md`, `retires: never`). 3 of upstream's 4 declarations are here.

## Deferred

`theme/generateThemeRules.test.ts` (36 cases). Its cases call `generateThemeRules(theme): string[]`,
which this port does not export, and a `generateThemeCSS` that returns `{prose, component}` where
this port's `generateThemeCss` returns one string with the `@layer` wrappers already applied. Making
the shapes match is a wide change — around twenty test files assert on that string, plus `<Theme>`,
both theme build scripts and the docs build — and does not belong in the same batch as a
`defineTheme` restructure. Recorded in `debts.md`; `status.md` keeps counting the suite.

## The gate, and a flake worth naming

The first full gate failed one stage of seven: client chunk 4 of 15, with **15 failed cases**
across `command-palette-item`, `complex-selector`, `date-input`, `date-range-input` and
`date-time-input`. The second full gate failed the same chunk again. Neither is a regression from
this batch, and the evidence is threefold:

- **Nothing in scope touches them.** `git diff` over the batch is four files, all under
  `lib/theme/`; `themeProps` does not route through `defineTheme`.
- **The same 12 files pass alone** — 336 cases, twice.
- **The same 15 chunks pass as a full concurrent suite** — 172/172 files, 4,828 cases.

The signature is worth writing down, because it reads like a regression and is not. `chunk` runs
up to four vitest processes at once, each with its own Chromium. Under that load the failures split
two ways: three suites time out at ~14.9 s on `toHaveFocus()` or `locator.click`, and — the
informative half — several assertions fail in **under 150 ms** with `Number of calls: 0`. A click
that resolves in 61 ms having called nothing is not starvation; it is the handler not yet attached
when the synthetic click arrives, which is what CPU contention does to effect ordering.

`isInfrastructureFailure` does not catch this class: it retries a chunk that lost its browser, and
deliberately stops immediately on a chunk that failed a *case*. **That conservatism is correct and
was left alone** — auto-retrying case failures would hide exactly the regressions the gate exists
to find. The cost is that this flake burns a full gate run, which it did twice.

## Oracle bookkeeping

No oracle changes. Both class oracles and all seven theme oracles were run after the
`expandTypeScale` restructure and stayed at zero mismatches, which is the whole evidence that
moving the font-family and weight derivation out of the expander changed no shipped output.

## What the audits caught

The closing audits run with `close-batch`; this entry is written at the point the units landed.

## Rules promoted

- `CLAUDE.md` § Testing — a suite file that ports more than one upstream suite cannot state a
  contract, and the count is the contract.

## Debts opened

- `generateThemeCss` returns a flat stylesheet where upstream returns two blocks

## Debts retired

- Three of the four names in "Three `./theme` names have no upstream counterpart or the wrong one"
  — `TypeRole`, `TypeWeight` and `TypeScaleConfig`'s shape. `TokenMap` remains.
