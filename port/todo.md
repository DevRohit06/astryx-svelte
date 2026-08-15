# astryx-svelte — build checklist

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design
system. Unofficial; not affiliated with Meta.

Detailed research lives in [`research/`](./research); the design rationale behind each
landed item lives in git history. This file is the **live status and backlog** only —
what's ported, what's next, known debts.

> **Current goal: cut the first npm release** (decided 2026-08-07). Core is done — **101 / 101**
> upstream component dirs, zero invented — and so is what used to gate it: `chocolate`, `stone` and
> all six icon registries landed, so the theme set is **7 / 7 upstream plus `liquid-glass`**.
> `packages/cli` is no longer a placeholder either (Phase 4 closed 2026-08-09, and it is what ships
> the 43 page templates), so **ten packages go out together at `0.3.0`** — core, the CLI and eight
> themes. `lab` follows as a later release.
>
> **What is left is one command.** The publish pipeline, the manifest gate, the eight theme READMEs
> and the `CHANGELOG` landed 2026-08-10; the gates were re-run over the tree that will be tagged;
> the docs site is [live](https://astryx-svelte.rohitk06.in/); and `NPM_TOKEN` is configured. What
> remains is merging this branch and pushing `v0.3.0`, which is what publishes. See
> [Release & governance](#release--governance).
>
> Read [Pre-flight](#pre-flight--read-this-before-starting-a-batch) before picking up a batch —
> every item in it is a rework this port already paid for — and see [Roadmap](#roadmap) for what
> each remaining front actually costs, measured at the tag rather than estimated.
>
> _Superseded goals, kept because the ordering they forced still explains the batch history:_ "get
> the docs site live" (2026-08-02) reordered batches 9–13 around `Theme` being the one real blocker;
> "finish the component set" preceded it. That goal is **met**: the docs site is built, dogfooded and
> [live](https://astryx-svelte.rohitk06.in/) as of 2026-08-10.

---

## Roadmap

Two fronts remain, both after the release. Sizes are measured from `git show v0.3.0:` in the
upstream clone, not estimated — and the count that matters for scheduling is the one in the third
column, since assets and generated files dominate the raw file counts.

| Front                                    | Upstream size                                                                         | State                                          | Gates the release?      |
| ---------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------- |
| ~~**Themes**~~                           | `chocolate` 226 + `stone` 652 lines, 81-line `icons.tsx` ×6                           | **8 / 8 packages, 6 / 6 icon registries**      | ~~yes~~ — **done**      |
| ~~**CLI**~~                              | 1,809 files / 4.3 MB — but **293 code files** (1.5 MB); the other 1,502 are `assets/` | **Phase 4 complete**, and it ships in `0.3.0` | ~~no~~ — **in the release** |
| **`lab`**                                | 180 files / ~995 KB, **17 component dirs**                                            | never started                                  | no                      |
| `charts` / `vega` / `richtext` / `build` | 35 / 5 / 1 / 7 files                                                                  | never started                                  | no                      |

**Why the release goes first.** It establishes the publish pipeline on the smallest surface that is
actually finished, so `lab` ships into an existing release process rather than inventing one under
pressure. The standing test gap ships as a documented known limitation.

**The CLI moved into the release rather than after it**, and the reason is the page templates: they
are CLI assets, so holding the CLI back would have announced 43 templates a reader could not obtain.
That decision is what the two release-mechanics fronts below were sized against — **ten** packages,
not nine. The count is worth stating explicitly because "nine" survived three documents after the
CLI moved in: it was correct when the release was core plus eight themes, and adding a package to
the release does not update the prose that counted them. `check:publish` reports 10/10 and the dry
run lists ten `+ @astryx-svelte/…@0.3.0` lines, which is where the error was caught.

**`lab` needs decisions before it needs porting.** Four of its seventeen components (`CodeEditor`,
`RichTextEditor`, `ThreeD`, `Sankey`) wrap heavy third-party React libraries with no drop-in Svelte
equivalent. Choosing those substitutes is design work, and the parity rule cannot arbitrate it —
there is no upstream Svelte answer to copy. Scope `lab` only after that is settled.

---

## Status

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Components ported | **101 / 101** upstream component dirs at 0.3.0 — **the set is complete**, and nothing here is invented (a bidirectional diff finds no directory of ours without an upstream counterpart). Ours are 97 directories because `HStack`/`VStack` fold into `stack/` and `SizeContext`/`InteractiveRoleContext` into context modules; all four are exported. The figure read "100 / 100 at 0.1.7" for several batches — upstream 0.3.0 has 101, so re-measure this against the tag rather than carrying it forward. Themes: **7 / 7 upstream** — butter, chocolate, gothic, matcha, neutral, stone, y2k — **plus `liquid-glass`, which ports nothing**: a macOS/Liquid Glass theme with no upstream counterpart, and the port's one deliberate addition to the published surface. See [Known debts](#known-debts) for why it is allowed to exist. Every theme now ships its `<name>IconRegistry`. `@astryx-svelte/cli` **is in the first release** — the placeholder note this row used to carry predates Phase 4 closing, and the CLI is what ships the 43 page templates, so **ten packages publish together at `0.3.0`**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Tokens            | **184 / 184** at upstream 0.3.0, verified against source — down from 186 because 0.3.0's "remove long-deprecated compatibility APIs" deleted the `--transition-fast` / `--transition-normal` shorthand pair (and `transitionDefaults` / `transitionVars` / `TransitionVarName` with it). The published 0.3.0 dist carries no `transition` token at all; ours had no consumer and reached no barrel, so removal was clean. `liquid-glass`'s `check-theme.mjs` reads the count out of core's **built `dist/`** and reports 184, 0 unknown — which is what proves it. Note that 184 is the _ambient vocabulary_ of known token names, not a per-theme declared count (liquid-glass itself declares 106). The **`en` catalog is 250 / 250**, byte-identical to upstream and prettier-ignored to stay that way, alongside `fr-FR` (upstream's own 3-key partial) and `pseudo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Theme output      | **2,418 declarations match upstream across seven theme packages, 0 mismatches** (2026-08-08) — butter 430/433, chocolate 289/292, gothic **345/345**, matcha 303/306, neutral 339/342, stone 355/358, y2k 357/360. The oracle is **bidirectional**: a missing declaration, a wrong value, an invented one or a stale allowlist entry all **fail the run**. The 3-per-theme remainder is the `color-scheme` rules `base.css` owns, so the arithmetic checks itself — 2,436 upstream − 18 = 2,418, and **gothic needs no allowlist at all**, because a dark-only theme declares no `[light, dark]` pairs and upstream emits no `html[data-theme=…]` block for it. Both `chocolate` and `stone` were green on their first run. **The eighth package, `liquid-glass`, is not in that total** — it ports nothing, so there is no upstream CSS to diff. It carries `scripts/check-theme.mjs` instead, asserting every token name it declares is one of core's 184 and every component it overrides is a real `themeProps()` name, both read out of core's **built `dist/`**. Those are the two failures the diff oracle catches for free everywhere else, and neither fails loudly alone: `defineTheme` accepts any string and `generateThemeRules` emits a rule for any string, so a typo compiles to CSS that parses, loads and styles nothing. It caught one on its first run — see the `chat` entry under Known debts                                                                                                                                    |
| Component classes | **1,528 style keys (19 as marker-normalised CSS) + 615 inline call sites, 0 skips, 0 mismatches**, re-derived 2026-08-08. The skip list is **empty** — every "published dist lags source" deferral the port ever wrote retired itself when the pin moved to 0.3.0, and the last three (RTL keyframes) went when explicit `enterEndRtl`/`enterStartRtl`/`indeterminateSlideRtl` landed. **But read what a clean run does and does not claim:** it covers every _static_ style and **no function style at all**, because a `stylex.create` arrow value carries no `$$css` for `extractGroups` to find — 54 of them across 32 modules, recorded under [Known debts](#known-debts). Batch 18 proved that blindness rather than asserting it: **inverting the `!isDisabled` status-hover guard in `text-input` left the oracle at 0 mismatches, exit 0**, while the bug was live in 13 call sites. Three rules the oracle work has settled: **where upstream keeps its styles decides which oracle mode applies** (a separate style module defeats StyleX's fold, so it is object-mode only — batch 12/`Calendar`); **an unused declaration needs a skip only if our build still emits the class**, which with the attrs-function convention it usually does not (batch 14); and **a module that only composes already-verified components adds no atomic CSS at all** (batch 15). A component can be in _both_ modes at once — declaring only the object side leaves the folded literals unaccounted for, which is what the leftover check exists to catch |
| Typecheck / lint  | `pnpm -r check` clean (**core 2,121 files, 0 errors, 32 warnings, 20 files with problems; docs 1,505 files, 0 errors, 0 warnings**); `pnpm -r lint` clean, exit 0; `pnpm -r build` exit 0. All re-derived 2026-08-08. Two lessons this gate cost, both still live: **a lint gate chained with `&&` reports "failed" identically whether one stage failed or both ran** — `prettier --check . && eslint .` meant a stray scratch file short-circuited eslint entirely, hiding six real errors for several batches; and **the gate is only as trustworthy as the tree is quiet**, since a scratch file deleted between eslint's enumeration and its read fails the run on a path that no longer exists. A batch that leaves `zz-*.mjs` in a package root has not finished A third, found 2026-08-08: **the root `todo.md` and `port/ledger/` are not in the lint gate at all** — `pnpm -r lint` runs `prettier --check .` inside each *package*, and nothing checks the repo root, which is how malformed blocks accumulated here unnoticed. Worse, `prettier --write` does **not converge** on this file: a multi-paragraph list item has its continuation paragraphs re-indented deeper on every pass (6 → 10 → … → 30 spaces observed), and past ~4 extra spaces markdown renders them as an indented *code block* rather than prose. The stable form for extra detail under a `- [ ]` item is a nested `  - ` bullet, which round-trips; 57 lines were normalised back. Do not run `prettier --write` here expecting a fixed point. |
| Public types      | every component exports its props type (in `<script module>`, re-exported from `index.ts`, carried into `.d.ts`). **Now load-bearing beyond typing**: the docs generator reads the props table out of `dist/**/*.d.ts`, so a component that stops exporting its interface silently loses its documented types. The theme packages' generated `.d.ts` is on the same footing and was **wrong in shipped packages** until batch 18 — `literalType()` guarded on `typeof value === 'string'`, so numeric palette values emitted `readonly hue: { }` instead of `readonly hue: 291`. Nothing caught it: the runtime value was always right, `{}` is valid TS so `check` stayed green, and the theme oracles diff CSS declarations rather than declaration files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Docs site         | **629 example blocks live, 0 pending**; **211 of 213** upstream doc entries documented and **0 documented props core does not declare**, 72 sidebar entries + 26 utilities, 20 topics, 42 page templates, 8 theme packages, 1 blog post, against **502 core exports and 457 props interfaces** (re-derived 2026-08-10 — every figure in this row moved since 2026-08-08, so read them from `pnpm -F docs generate` rather than from here). **That 0 is a different 0 from the one this row used to report**, and the difference is the whole props-page audit below: the old one was an artefact of a report that could not see the case it existed for, while 85 rows rendered "not declared by core"; the new one is 1,876 rows with every type from the compiler, 56 unverified rows all carrying a stated reason, and the interface count up 417 → 457. **Both undocumented entries are umbrella family pages, not components** — `Chat` and `Resizable`. Upstream ships no `Chat.tsx` and no `Resizable.tsx`; each `.doc.mjs` is a family-overview entry whose `displayName` matches no export, so the generator's ported-check drops it while documenting every member it names. All 15 Chat components have their own pages, as do `ResizeHandle` and `useResizable`. The pair is a docs-site gap, not a port gap. **The upstream total moved 210 → 213 and the cause is not established**: the counting expression (`normalised.length`) has not changed since the initial commit and the `@astryxdesign/core` pin is exact at 0.3.0, so the 210 recorded on 2026-08-08 was measured against a different `docs/node_modules` state. Re-derive this figure; do not carry it forward. The shell is fully dogfooded: a real `AppShell`/`TopNav`/`SideNav`, a `CommandPalette` for `⌘K` and an `Outline` for the on-this-page aside. **All 8 themes are wired and verified on `vite dev`** — nine `@scope ([data-astryx-theme=…])` blocks live in the CSSOM, 0 console errors. **Live at <https://astryx-svelte.rohitk06.in/> since 2026-08-10**, built from `main` — so a doc fix reaches readers only on redeploy. Two rules this row cost: **porting a component reopens this backlog**, because a newly documented component drags its blocks in with it; and **`hasSvelte` is per registry _target_**, so a block reached through `alsoExampleFor` needs a copy under _each_ target directory. **Run `pnpm -F docs generate` and read the number; do not predict it**                                                                                                                                                                                                                                                                                           |
| Tests             | **196 files, 5,066 passed, 0 failed** — client **162 files / 4,255 passed** and server **34 files / 811 passed** (re-derived 2026-08-10, unchanged from 2026-08-08; `@astryx-svelte/cli` adds **102 files / 1,937 passed**, 1 file skipped and 25 todo). **The client number is a chunked pass reconciled two ways**, which is the honest form: 14 chunks of 12, all exit 0, 159 files counted back against 159 on disk, _and_ the summed case total matching `vitest list`'s collected 4,190 exactly — that pair was measured before the four suites below added 65 more — a tally summed from chunk logs is only as complete as the loop that wrote it. Suites are ported **case for case and the count is the contract**. Batch 18 closed 22 wrong headers (~59 cases restored, all passing first run) and then 88 more across eleven files, which exposed two live bugs. **But the honest figure is the one in [Testing](#testing): 434 upstream cases are still missing**, and no header audit could have found them, because a suite with no counterpart file here has no header to be wrong — that blindness had already let a real `ChatComposer` bug ship. Five rules the suites have cost: **the contract has to be re-derived from the upstream source**, never from a brief or a grep; **a restatement can make a vacuous upstream assertion load-bearing**; **"this assertion is vacuous" is itself a claim to mutation-check**; **pure modules stay in the _server_ project**; and **coverage beyond upstream needs a hazard with no upstream analogue**                                                                                                                                                                               |

**Why the port is tractable:** we author `stylex.create` with the same token references
Astryx uses, so StyleX's content-derived hashes make the compiler emit _byte-identical_
atomic CSS. Fidelity is compiler-guaranteed and checked mechanically by two oracles
(`scripts/compare-upstream-classes.mjs` for component classes,
`packages/themes/neutral/scripts/compare-upstream.mjs` for the theme) that diff our
compiled output against the already-compiled classes in `@astryxdesign/core`'s `dist/`.
Every deferral is an explicit `skip` with a reason; a skip that stops matching (or starts
matching) fails the run, so the list cannot rot. The published tarball is ground truth but
**can lag upstream's source** (Icon's px→rem move is the standing example) — follow the
source and record a self-retiring skip.

---

## Phase 0 — Foundations

Done: pnpm monorepo scaffolded; StyleX compiling in SvelteKit (dev + prod, layers);
`lightningcss` browser targets; 186 tokens as `defineVars`; `base.css` layer order;
`internal/sx.ts` adapter; `internal/naming.ts` + `theme-props.ts`; `internal/contexts`;
upstream's **`reset.css` ported in full** into `base.css`'s `@layer reset`.
`@astryxdesign/core` stays a **devDependency** (powers both oracles) — never install
`--prod` or prune devDependencies.

StyleX **silently drops the `border` shorthand** — `border: 'none'` in a `stylex.create`
emits no rule at all (upstream's compiled `dist/` has none either). Upstream's components
lean on `reset.css`'s universal `border-width: 0; border-style: solid` for it, so any
component whose only border reset is a `border: 'none'` renders with the UA default
instead — `<dialog>` and `[popover]` both ship `border: solid` (medium = 3px). Same for
`box-sizing: border-box`, which nothing but the reset sets. Hence the full port above.

- [ ] Upstream publishes the reset at its own subpath (`@astryxdesign/core/reset.css`,
      opt-in); ours is folded into the always-loaded `base.css` because the components
      genuinely require it. Revisit if the published surface should mirror upstream's split

- [x] Align `useCSSLayers` output with upstream's form — **done for the shipped stylesheet.**
      `dist/astryx.css` is built with `processStylexRules(rules, false)`, so it carries upstream's
      `:not(#\#)` padding inside one `@layer astryx-base`, byte-comparable to theirs.
      `compare-upstream-css.mjs` proves it: 1,463 shared classes, 0 differing rules.
- [ ] The _compiler_ path still emits `@layer priority1…9`, and it must: with `useCSSLayers: false`
      the plugin emits **unlayered** rules, which beat every layered rule and would defeat theming
      outright (upstream avoids this only by wrapping at build time, which a consumer's build does
      not do). `base.css` therefore names `priority1…16` between `astryx-base` and `astryx-theme`.
      Revisit only if StyleX gains a way to emit into a named layer.
      → Before this, `base.css` declared four layers and the nine real ones sorted _after_ `product`,
      silently inverting the cascade for every consumer on the compiler path. Fixed 2026-08-11
- [x] **`astryx.css` stands alone: `dist` is compiled at publish time.** Shipping the stylesheet was
      not enough — `stylex.create` **throws** at runtime rather than degrading, so importing the
      sheet without a compiler crashed. `scripts/compile-dist-stylex.mjs` runs in `prepack` and
      compiles the 200 `dist/**/*.stylex.js` modules. Only `create`/`defineVars`/`keyframes` are
      compile-time; `props` is a real runtime function and `.svelte` files reach StyleX only through
      `sx()` → `props`, so nothing else needs it.
      It compiles each module under its **source** identity, not its dist path: StyleX hashes
      `defineVars` companion classes from the module path, and the first run mismatched 26 classes
      against `astryx.css` because of it. The script asserts every class dist references is in the
      stylesheet, so that class of drift cannot ship.
      Both routes are alive, as upstream has them: the pre-built sheet by default, and a `"source"`
      export condition on all 9 non-CSS subpaths for bundlers that would rather compile and
      tree-shake.
      **This was a breaking delivery change**, and a silent one: a precompiled `dist` gives a
      consumer's StyleX plugin nothing to compile. The docs site hit it exactly — its CSS fell from
      ~250 kB to 161 kB with no error — and is now the dogfood for route 1. `doctor`'s check accepts
      either route rather than reporting route 1 as broken

- [ ] **Upstream bug, not replicated: `astryx.css` carries their ESLint fixture.**
      `packages/core/src/Badge/Badge.test-violations.tsx` is a file of deliberate token violations
      ("VIOLATION: hardcoded color"). Their `build-css.mjs` ignores `**/*.test.*`, which
      `.test-violations.` does not match, so ten junk classes — `color:#FF0000`, `margin:8px`,
      `font-size:14px` … — ship in every consumer's stylesheet. Recorded as the ten named skips in
      `compare-upstream-css.mjs`, which retire themselves when upstream fixes the glob
- [ ] **Babel 7 pin** in `packages/core` (`@babel/core@8` needs Node ≥22.18; dev machine on 22.17.0). Revisit on next Node bump

---

## Phase 1 — Shared primitives (~14,137 LOC, must land before components)

Done: `BaseProps` + `naming`; `utils/*` (7 pure helpers + 187 tests); `i18n/`
(resolve/translator/`en` catalog/provider/`useTranslator`); `InteractiveRoleContext` +
`useInteractiveRole`; `Layer/` (native Popover API + CSS anchor positioning — the single
most important primitive; `<Layer>` replaces upstream's `render`); **all 19 hooks**
(`useMediaQuery`, `useScrollLock`, `useAnnounce`, `useLongPress`, `useEntryAnimation`,
`useHotkeys`, `useScrollOverflow`, `useClickableContainer`, `useInputContainer`,
`useOverflow`, `useImageMode`, `useTypeahead`, `useFocusTrap`, `useListFocus`,
`useGridFocus`, `useTreeFocus`, `useKeyboardHint`, `useStreamingText`) — **this phase's hook
list is closed**, `useStreamingText` having landed with batch 11.

**Not ported** (`research/06`, Svelte obviates each): `mergeRefs`, `isRenderable`,
`mergeProps`, `composeEventHandlers`, `useIsomorphicLayoutEffect`; `useTheme()` replaced
by `getComputedStyle`.

- [x] `groupItems` — **landed with `Typeahead` in batch 6** (`utils/group-items.ts`, exported from
      `utils/index.ts` with `getItemGroup` and `ItemGroup`, as upstream's barrel does). Its
      consumers upstream are `CommandPalette` and the trigger menu, neither ported yet
- [ ] **Consolidate two homes for one upstream dir** — `types.ts`, `themeProps.ts`, `sharedResizeObserver.ts` landed under `internal/`; `parseStyleKey` sits with the theme compiler. Recorded, not done (touches every component's imports)
- [x] **`useMenuHover` landed with batch 10** — an _un-counted_ hook the batch plan missed entirely
      (`SideNavHeading`, `TopNavHeading` and `TopNavMenu` all need it). It lives in `internal/`, not
      `hooks/`, because upstream's `hooks/index.ts` does not export it and neither does the package
      root — publishing it from our `./hooks` subpath would invent API
- [x] `useStreamingText` — **landed**, exported from `hooks/index.ts` with `StreamingTextSpeed`,
      `StreamingTextState` and `UseStreamingTextOptions`. Arguments are getters and the result is a
      live `{ current }`, the `useThemeMode` shape. Upstream's ten test cases are ported whole in
      `src/tests/use-streaming-text.svelte.test.ts` (client project — the hook is entirely effects,
      so `svelte/server` reaches none of it)

---

## Phase 2 — Components

96 units: trivial 26 · moderate 29 · hard 26 · very hard 15. 9 build levels; L0 has 28
leaves. Highest fan-in: `Icon` (36), `Tooltip` (24), `Field` (18), `Button` (16),
`Spinner` (15).

### Done (131 components across 89 upstream dirs)

**Moved to [`port/ledger/`](./port/ledger/)** — the per-component implementation notes, verbatim: what
each unit does, the translations it needed (slot shapes, context seams, imperative handles), and
its oracle and test posture. It is reference rather than status, which is why it no longer sits in
the backlog. Counts and what remains are in [Status](#status) above; open divergences are under
[Known debts](#known-debts).

### Next — the batch plan

**Re-ordered 2026-08-02: the docs site is now the goal, and the batch order serves it.**
Batches 1–7 were sequenced by dependency level, smallest-unblocking-first, which was right while
the aim was breadth. It is the wrong order now — it would spend the next two batches on the
date/time family, which the docs site does not use, before touching anything that gets the site
live.

What changed the ordering is a measurement, not a preference. Every component
[`research/04`](./research/04-docs-site.md) §2 builds the docs _chrome_ from is unported:
`AppShell`, `SideNav`, `TopNav`, `MobileNav`, `CommandPalette`, `Outline`, `Markdown`, `Table`,
`Theme`, `LayerProvider`. Three of them are in "the five riskiest". Taken literally that makes the
docs site cost ~28k LOC before its first page renders.

It does not, because the docs _chrome_ and the docs _content_ need different things — see
[Phase 5](#phase-5--docs-site-the-current-goal). Only one of that list is a genuine launch blocker
(`Theme`, ~40 lines). The rest are dogfooding: real value, but they gate nothing, and the site
ships without them.

So: **Batch 8 is now the launch set**, batches 9–11 are the chrome we migrate onto afterwards,
and the date/time family moves back behind both.

**Batches 8, 9 and 10 have since landed, and the ordering was right.** That ten-component chrome
list is now **complete**: `Theme`, `CommandPalette`, `Outline`, `LayerProvider`, `AppShell`,
`SideNav`, `TopNav` and `MobileNav` are all done, and the docs shell runs on every one of them —
`Markdown` and `Table` are the only two left, and neither gates the shell. The prediction that only
`Theme` genuinely blocked launch held: the site shipped its v1 cut on batch 8 and has been
migrating onto its own components ever since.

All L0 leaves are ported. **9 upstream component dirs remain.** A batch is still a unit of work:
port every component in it, then close the batch out together.

**One step is now part of closing a batch, learned the hard way twice:** re-run
`pnpm -F docs generate` and check the pending example count is still exactly the API-blocked ten.
Documenting a component pulls its example blocks in with it, so a port that ignores them silently
reopens a backlog `todo.md` claims is closed — `Outline` added 4 and `CommandPalette` 18.

**Per-batch process** (a trimmed `port-component`): spec from upstream → author
`.stylex.ts` + `.svelte` → wire the class oracle → port the test suite case-for-case →
`todo.md` + demo route. **Testing is scoped:** run the new component's suite plus its direct
dependents' suites and `test:parity`, not the full `pnpm -r test`. A full run happens once at
batch close, not per component.

- [x] **Batch 1 — unblockers & quick leaves** — **DONE**, see [port/ledger/](./port/ledger/)
  - `List` + `ListItem` (+ `ListContext`) · 507 · `Item` ✔ — **gates `CheckboxList`**
  - `MoreMenu` · 163 · `Button`/`DropdownMenu`/`Icon`/`SizeContext` ✔
  - `AlertDialog` · 290 · `Dialog` ✔ — `useImperativeAlertDialog` deferred with `useImperativeDialog` (same render-returning-hook problem); **both landed in batch 15**
  - `Banner` · 544 · `Button`/`Icon`/`Layout` ✔
- [x] **Batch 2 — composition leaves** — **DONE**, see [port/ledger/](./port/ledger/)
  - `Breadcrumbs` + `BreadcrumbItem` · 535 · `Link` ✔
  - `Carousel` · 428 · `Button`/`Icon`/`Layer` ✔
  - `Toolbar` · 405 · `Layout`/`Section`/`SizeContext` ✔ — retires the `useKeyboardHint` `WithToolbar` demo debt
  - `ContextMenu` · 536 · `DropdownMenu`/`Divider`/`Layer` ✔ — its selectable + submenu re-exports landed with the trio (batch 17b)
- [x] **Batch 3 — nav & tree surfaces** — **DONE**, see [port/ledger/](./port/ledger/)
  - `NavMenu` · 456 · `Icon`/`Link`/`Text` ✔
  - `TreeList` · 1015 · `useTreeFocus` ✔
  - `TabList` · 1139 · `Popover`/`SizeContext` ✔ — **corrected `research/01`**: it does _not_ need the
    `OverflowList` items+snippet precedent, because it never slices its children (the overflow story
    wraps them in `Carousel`, which does)
  - (`NavItem/` is **not a component** — one shared `navItemStyles.stylex.ts` consumed by `SideNav`/`TopNav`; it lands with them)
- [x] **Batch 4 — checkbox family + Slider** — **DONE**, see [port/ledger/](./port/ledger/)
  - `CheckboxInput` + `CheckboxList` · 649 + 597 — mutually recursive, landed together ✔
  - `Slider` · 950 · `Field`/`Tooltip` ✔
- [x] **Batch 5 — standalone inputs + CodeBlock** — **DONE**, see [port/ledger/](./port/ledger/)
  - `NumberInput` · 742 · `Field`/`InputGroup` ✔
  - `FileInput` · 823 · `Field`/`Spinner` ✔
  - `CodeBlock` · 2083 · `Code`/`Icon` ✔ — **the plan under-costed this one**: it also needs
    `theme/syntax/` (~710 LOC), which landed with it. Read a component's _whole_ import list when
    costing a batch, not just its component-dir dependencies
- [x] **Batch 6 — the selector spine** — **DONE**, see [port/ledger/](./port/ledger/)
  - `Selector` · 1822 · `Popover` ✔ — also landed `SelectorOption`, `useCombobox`,
    `useSelectedItemOffset`, and a `style` prop on `<PopoverLayer>`
  - `Pagination` · 706 · `Selector` ✔
  - `Typeahead` · 1750 ✔ — landed `BaseTypeahead`, `TypeaheadItem`, `createStaticSource`, and the
    `groupItems` Phase 1 debt
- [x] **Batch 7 — multi-select** — **DONE**, see [port/ledger/](./port/ledger/)
  - `MultiSelector` · 1704 (`Selector` ✔ + `CheckboxInput` ✔) — also landed `useMultiCombobox`
  - `Tokenizer` · 917 (`Typeahead` ✔ + `Token` ✔ + `OverflowList` ✔)
- [x] **Batch 8 — the launch set: `Theme`** — **DONE**, see [port/ledger/](./port/ledger/). The component work
      is finished; the rest of the batch is docs work, in
      [Phase 5](#phase-5--docs-site-the-current-goal)
- [x] **Batch 9 — dogfood the chrome** — **DONE**, all three units. See [port/ledger/](./port/ledger/)
  - [x] `CommandPalette` · 1520 — landed with its 6 sub-components and context; the hand-built
        `⌘K` palette now runs on it
  - [x] `Outline` · **742 of 838 landed** — `Outline` + `useScrollSpy` + `useOutlineFromDOM` +
        `types`; the hand-built on-this-page aside now runs on it
  - [x] `LayerProvider` / `LayerContext` — landed
- [x] **Batch 10 — the nav family** — **DONE**, see [port/ledger/](./port/ledger/). Booked at 6,919 LOC across
      `TopNav` + `SideNav` + `AppShell` + `MobileNav`; the estimate held, and the 4-way dependency
      cycle turned out not to need breaking because the contexts are the seams. **The one thing the
      plan missed was `useMenuHover`**, a nineteenth hook three of the components need — the
      pre-flight's "cost the whole import list" item caught it before any code was written, which is
      the second time that check has paid for itself after `CodeBlock`/`theme/syntax`
- [x] **Batch 11 — `Markdown`, and the Table core it turned out to need** — **DONE**, see
      [port/ledger/](./port/ledger/). Booked at 3,717 LOC for `Markdown` alone; it came in at roughly **7,100**, because
      the pre-flight's "cost the whole import list" item caught two dependencies the plan had not
      counted — the _third_ time that check has paid for itself, after `CodeBlock`/`theme/syntax`
      and `useMenuHover`:
  - **`Markdown.tsx` imports the whole `Table` family** (`Table`/`BaseTable`/`TableHeader`/
    `TableBody`/`TableRow`/`TableCell`/`TableHeaderCell`) to render a GFM table. There is no
    faithful `Markdown` without it, so **the Table core moved forward into this batch** and only
    the plugin hooks stayed in batch 13. That seam is clean rather than convenient: the hooks
    are standalone and reach the table through the public `plugins` prop, which is fully ported —
    `Table.stories.tsx` and both upstream Table suites turn out to import no `useTable*` hook at all
  - **`useStreamingText`** was the other one, and it was already a known Phase 1 debt
- [x] **Batch 12 — date/time family** — **DONE**, see [port/ledger/](./port/ledger/). Booked at ~5.4k and it
      held: `Calendar` (2,225 across 9 files, the gate for the other four), `DateInput` · 727,
      `TimeInput` · 741, `DateTimeInput` · 1,067, `DateRangeInput` · 689. It **retired the last two
      `InputGroup` skips**, taking that suite to 18 of 18 with none left, and it is the first batch
      since 10 to need **no new oracle skip at all**. Four things the pre-flight caught that the
      plan had not:
  - **`useCalendarNavigation` is published but never used by `Calendar`**, which inlines an
    almost-identical copy with two differences (it seeds from the _effective value_, unwrapping a
    `DateRange.start`, and it clears pending focus through a callback prop rather than exposing
    `clearPendingFocus`). Ported anyway — the export is the contract, not the call site
  - **`DayOfWeekName` had two homes.** `utils/index.ts` had been exporting it with a note saying it
    would re-home when Calendar landed; upstream's `utils/index.ts` does **not** export it, and it
    reaches the package root through `Calendar/index.ts` alone. Moved, so the root has one
    declaration site again
  - **`Calendar`'s oracle case is object-mode only, and that is not a choice.** It is one of the few
    upstream components whose styles already live in a module separate from the component, so StyleX
    never sees a declaration and its call site together and folds _nothing_ — `dist/Calendar/Calendar.js`
    carries zero literal class strings and all four groups survive as objects. An `inline` entry
    would have failed. Worth remembering as a rule: **where upstream puts its styles decides which
    oracle mode applies**, and the split-module case is the one that produces no inline sites at all
  - **`Calendar` had no `handleRef` counterpart to inherit.** It is not a DOM ref, so the settled
    "`ref` props are omitted" rule did not answer it; the `Tokenizer`/`SideNav` instance-export
    precedent did
- [x] **Batch 13 — the Table plugin hooks — DONE, all eleven plugin dirs**, 18 published symbols
      plus the 44 `PowerSearch` type names. `Table`'s ~9k LOC was **split**: the ~3,200-LOC core
      landed with batch 11, leaving the hooks. The pre-flight re-costed them from the source rather
      than the plan — **6,438 LOC, not the ~4,800 the plan carried**, plus 6,657 LOC of tests — and
      settled four things before any code was written:
  - **`PowerSearch` was not a blocker.** The plan said `useTableFiltering` "wants `PowerSearch`"; it
    imports `PowerSearch/**types**`, 434 LOC of pure types whose only non-React import was already
    ported. Fourth time "cost the whole import list" paid, and the first time it made a batch
    _smaller_.
  - **The plugin dirs are mutually independent in source** — only their _tests_ cross-import — so
    they port in any order and a partial batch strands nothing. Every other dependency was already
    ported, and `locales/en.json` already carried all 20 plugin message keys.
  - **Oracle modes are per-dir and decided by upstream's file layout**, the batch-12 rule holding:
    `selection`/`rowIndex`/`sortable` folded to **inline** literals, `pagination`/`stickyColumns`
    stayed **object** (conditional args, or seeding an `xstyle` array), `groupedRows` is **both**,
    and `columnSettings` declares no styles at all and needs no case.
  - **The blocked-docs-block accounting was wrong twice before it was checked against the block
    _sources_ rather than their owning components.** The real split: 6 unblocked here, 2 blocked on
    `PowerSearch` (both open with `usePowerSearchConfig` and need its config builder _and_ match
    engine, which live outside the filtering plugin), 5 on `useImperativeDialog`. This is
    **"a block's blockers are its whole import list"** applied one dependency deeper than the
    `ToolbarBulkActions` case: _a component being ported does not mean the blocks documenting it are
    reachable._ The same ruling deferred `TableFiltering.stories.tsx`'s 11 stories from the demo
    route — the first cut shipped a ~180-line hand-transcription of PowerSearch's operator tables
    and match engine to fill the gap, which is re-authoring an unported subsystem, so it was deleted
    rather than kept behind a "temporary" comment.
  - **The pending block count went 13 → 21, not 13 → 7, and that is the batch-close step working.**
    Documenting eleven hooks reopened the backlog by 14: five genuinely new blocks, and **five
    per-target duplicates** (`hasSvelte` is per registry _target_, so a block reached through
    `alsoExampleFor` needs a copy under each). Copying cleared them, 21 → 16.

  Gate: `svelte-check` 1,480 files / 0 errors · class oracle 1,298 keys + 500 inline, 18 skips,
  0 mismatches · theme oracle 328 matched · **293 of upstream's 293** plugin cases, zero dropped ·
  server project 511/511 · demo route 10 new sections, 53 stories, driven in real Chromium.

- [ ] **`tree` is the eleventh dir, and the tarball does not have it.** `@astryxdesign/core@0.1.7`
      ships **no `dist/Table/plugins/tree/`** and no `useTableTreeData.doc.mjs` /
      `useTableTreeState.doc.mjs` — the plugin exists only in upstream's _source_. So `tree` is the
      standing "published dist can lag upstream's source" case (`Icon`'s px→rem is the other), and
      the pre-flight item that says to check the dist _before_ wiring the oracle is what caught it.
      Consequences: **`tree.stylex.ts` cannot be class-verified at all** and needs a self-retiring
      **skip** rather than a case (written to drop into `CASES` unchanged when a release catches up
      — `upstreamFile: 'Table/plugins/tree/useTableTreeData.js'`, group `treeStyles`, no rename);
      and the **docs content pipeline has no prose for the two tree hooks**, because it reads
      `.doc.mjs` from `node_modules`, not from the clone. Both are release-gated, not effort-gated.
- [x] **Batch 14 — `PowerSearch`, and the three deferrals it retires — DONE.** Booked at 4,611 LOC;
      the source is **4,187** excluding tests and `.doc.mjs`, plus 2,363 LOC of suites. It closed
      batch 13's three named deferrals together: the `TableFiltering` demo route (11 stories) and
      the `TableFilterableTable` / `TableInlineFilterTable` docs blocks. Four pre-flight findings:
  - **Every one of its 23 imports was already ported** — **the first time "cost the whole import
    list" came back empty**, after paying for itself four times. The check is still worth running:
    knowing the list is empty is the result.
  - **The published tarball ships all of `PowerSearch/`**, so every module is class-verifiable and
    the batch needed no release-gated skip. All 25 i18n keys it touches were already in `en.json`.
  - **`types.ts` had landed a batch early and was deliberately partial.** The nine remaining
    declarations split 7/2: seven on upstream's barrel, two (`PowerSearchAuxData`,
    `PowerSearchItem`) module-public-and-unpublished on _both_ sides. **The barrel enumerates names
    rather than using `export type *` precisely so that second pair could not slip out with no diff
    to review — and that is exactly what it caught.** The enumeration has now earned itself once.
  - **The "type-dispatches into 15 components" description was wrong on all three numbers**: 14
    `OperatorValue.type` arms, 12 editors, 7 distinct astryx components.

  Gate: `pnpm -r build` exit 0 · `svelte-check` core 1,534 / docs 1,353, 0 errors, 0 warnings ·
  lint clean · class oracle 1,299 keys + 513 inline, 18 skips, 0 mismatches · **144 of upstream's
  144** cases, none dropped or added · full `test:unit` 152 files, 3,732 passed, 1 skipped ·
  docs blocks 529/534 · demo routes 24 + 11 stories driven in real Chromium.

  Its three style modules take **two oracle modes in one component**, and it produced a _near-miss_
  worth keeping: `PowerSearchEditPopover`'s `styles.nestedRow` is declared upstream and referenced
  nowhere, which reads like the classic "declared here, absent from `dist/`" skip case — and is not
  one. **StyleX dead-code-eliminates it from our module too**, so the two sides agree and a skip
  would have _failed_ as stale. Hence the standing rule: an unused declaration needs a skip only if
  our build still emits the class.

  **Four audits ran at close. The code came back faithful; the _record_ around it did not.**
  - `astryx-parity`: **0 behavioural defects** across all 22 files and both token renderers, barrel
    confirmed name-for-name. Its 8 findings were documentation — four file headers claiming a debt
    was "recorded in todo.md" when no entry existed, a mis-stated subpath count, a stale status
    table, and a false claim about a `'use client'` directive. **A header comment is an assertion
    and rots like one**; three of the eight were claims I wrote and did not check.
  - `astryx-idiom`: **one real latent defect**, fixed — `untrack(() => onSave)(…)` untracks the
    _lookup_, not the _call_, so every signal `onSave`'s body read became a dependency of an effect
    that then _writes_ one of them. Unobservable only because the write destroys the component in
    the same flush. The fix is one parenthesis: `untrack(() => onSave(…))`. **Worth remembering as
    a shape** — `untrack` wraps a _callback_, so it protects exactly what runs inside it.
  - `astryx-test-parity` ported all six suites and found **no component defect**.
  - `astryx-surface` found the batch **clean** — 51 of 53 `types.ts` names on the barrel, with
    exactly the two withheld — and turned up three _pre-existing_ over-exports, recorded below.

- [x] **Batch 15 — `useImperativeDialog` + `useImperativeAlertDialog`, and the docs-block backlog
      they close — DONE.** The smallest batch this port has had (**182 LOC** of upstream source
      across the two hooks, plus a 78-line test file) and the one that cleared the most standing
      deferrals: both hooks, the suite dropped with them, four barrel names, and **all five
      remaining docs blocks**. Neither hook declares a style, so the class oracle needed no case and
      no skip.

  **The translation is the `useLightbox` split, applied twice** — both return `element: ReactNode`,
  so each becomes a controller plus a companion (`<ImperativeDialogLayer>`,
  `<ImperativeAlertDialogLayer>`). Four settlements, all detailed under Known debts: `show()`'s
  content is `string | Snippet` (the `ToastOptions.body` case, since content is handed to a
  _function_ and so has no markup position to capture); the seam members `content`/`options` have no
  upstream counterpart, as `UseLightboxReturn.setIndex` does not; upstream's spread order is
  replicated in both directions and **differs between the two**; and one upstream quirk is
  replicated rather than tidied, where a changed `defaultOptions` is shadowed by the initial
  snapshot for every key it already had.

  **The docs blocks sharpened the `LinkProvider/RouterLink` precedent into a rule.** All four Dialog
  blocks declare a `Content({onClose})` component in-file and render it twice; Svelte has no in-file
  component declaration, so it is either a **parameterised snippet** or a **sibling module** — and
  the choice is not stylistic. `DialogFormDialog`'s `Content` holds `name`/`bio` state and upstream
  gives each of its two instances an independent pair, where a snippet rendered twice shares one.
  **The sibling module is required exactly when the in-file component owns state.** Verified in the
  browser, not reasoned about: typing into the inline preview leaves the modal's fields at their
  defaults. The idiom audit added _why_ the snippet form is legitimate at all — **Svelte context
  follows render position**, so the same snippet resolves `useDialogContext()` against
  `<Dialog isInline>` inline and against the modal `Dialog` through the layer, which is React's
  tree-position semantics.

  **The per-target duplication caught this batch too, for the third batch running.** Transcribing
  the five blocked blocks took the pending count 5 → 5, not 5 → 0: documenting the two hooks created
  two new registry _targets_, so every block needed a second copy (534 → 539 → 544).

  **The demo route's AlertDialog section went 2 of 4 stories to 4 of 4**, and only one addition was
  ever blocked — `Async` was simply missed when the component landed, and no entry recorded it as
  deferred, which is how a gap stays invisible. It is now four labelled columns rather than a flat
  row, because `Delete` and `Imperative` both label their trigger "Delete item": unambiguous in
  Storybook's one-story-per-frame view, a duplicate on a page showing every story at once. **No
  imperative _Dialog_ story was added**, checked rather than assumed — none of upstream's 12
  `Dialog.stories.tsx` stories uses the hook. (The note first said "15": a miscount the parity audit
  caught, and the fourth time a number written from memory rather than re-derived has been wrong.)

  Gate: `pnpm -r build` 7 packages exit 0 · `svelte-check` core 1,541 / docs 1,369, **0 errors**,
  docs 0 warnings · `pnpm -r lint` exit 0 · class oracle **unchanged** at 1,299 keys + 513 inline,
  18 skips, 0 mismatches · five theme oracles clean · **5 of upstream's 5** cases, none dropped or
  added · full `test:unit` **153 files, 3,737 passed, 1 skipped**, exit 0 · **docs blocks 544 / 544,
  0 pending** · 185 documented entries. One earlier `-r test` run hit the still-open heavier-config
  flake (see Testing); the three files passed in isolation and the next full run was clean.

  **Verified on `vite dev`**, 0 console errors and 0 warnings on every page after load. All five
  blocks render on **both** their component page and their new hook page; the inline previews open
  the real modal and the modal closes through `hide()`; **the options provably land** — width 400 on
  Confirmation, 480 on Form, and `maxHeight: 50vh` from the hook defaults on Scrollable, which is
  _not_ the 360px its inline preview uses; `purpose: 'required'` survives, so that modal is
  `role="alertdialog"` and **Escape does not close it**; all 15 terms render in the scrolling modal.
  On the demo route the async story holds a `role="status"` spinner with its action button disabled
  for the full two seconds. That options check matters more than usual, because it is the one thing
  upstream's own suite does not cover.

  **Four audits ran at close. The code came back faithful; the bookkeeping around it did not — for
  the second batch running.**
  - `astryx-parity`: **0 behavioural defects** (state machines term-for-term, names exact, blocks
    byte-faithful — it diffed the 15-entry `TERMS` array mechanically, demo route in upstream's
    order). All four findings were bookkeeping, and **three were claims I wrote and did not check**:
    comments citing a Known-debts entry that did not exist yet, the "15 stories" miscount, and the
    one real defect — **the generated docs page advertised an `element` return the port does not
    ship**, typed `string | Snippet` and described as a slot. Both generator fixes are under Known
    debts. _A header comment is an assertion and rots like one_ was batch 14's lesson; a second
    batch proving it makes it a pattern, not an incident.
  - `astryx-idiom`: **no defect in the batch's own files** — liveness, the `$state.raw` choice, the
    untracked init read and the SSR story all check out. What it found instead is the
    **effect-ordering focus divergence** under Known debts, which this batch did not cause but is
    the first to make reachable, and which was **verified in Chromium rather than accepted**.
  - `astryx-test-parity`: **5 of 5**, re-derived from the upstream file, nothing dropped or added —
    and it made two of my own claims _more_ accurate rather than confirming them. The probe is a
    superset of `OptionsHarness`, not identical to it; and the vacuity I recorded for one case is
    **the whole options path**, since replacing the `options` getter with `{}` kills no case at all.
  - `astryx-surface`: batch 15 **clean — 0 new missing exports, 0 new over-exports**, with both
    option bags confirmed module-private on each side. Everything else it measured reconciles to an
    entry already on the record; the genuinely new information is under Known debts.

- [x] **Batch 16 — `Chat`, the last unported component dir — DONE.** The largest batch this
      port has had: **7,311 LOC** of upstream source across 25 files (the plan said 7,336), plus
      **2,472 LOC** of tests across 14 suites, **16 `.doc.mjs` entries** and **58 example blocks**
      across 15 block dirs. Pre-flight settled five things before any code was written:
  - **The import list came back empty for the second time**, after batch 14's first. Every one of
    `Badge`, `Button`, `Divider`, `HoverCard`, `Icon` + `globalIconRegistry`, `usePopover`,
    `Spinner`, `Typeahead/types`, `i18n`, `tokens.stylex`, `utils` (including `groupItems`, the
    Phase 1 debt landed in batch 6) and `sharedResizeObserver` is already ported. Knowing the list
    is empty is still the result — it is what says the batch is 7.3k LOC and not more.
  - **The published tarball ships all of `dist/Chat/`** (25 modules) and all 16 `src/Chat/*.doc.mjs`,
    so every style module is class-verifiable and this batch needs **no release-gated skip** — the
    opposite of the `tree` plugin dir.
  - **All 19 `@astryx.chat*` i18n keys were already in `en.json`**, checked against the source's
    call sites rather than assumed.
  - **`research/01`'s description is correct on all four claims**, the first time it has been —
    `createPortal` (one site, `ChatComposerInput`), the contenteditable composer,
    `useSpeechRecognition`, and IntersectionObserver scroll anchoring (in `ChatMessageList`, for
    scroll-to-top infinite scroll; `useChatNewMessages` uses the _Resize_ observer, which is what
    the phrase could have been read to mean).
  - **Three modules are module-private upstream and stay private here**: `ChatPastedTextToken`,
    `useTriggerMenu` and `chatComposerSelection` are absent from `Chat/index.ts`. That is what
    keeps `<TriggerMenuLayer>` from being a new public name the way `ImperativeDialogLayer` had
    to be.

  **All 25 units landed, plus the barrel.** `svelte-check` 1,601 files / 0 errors / 33 warnings and
  `pnpm -F @astryx-svelte/core lint` exit 0. The four new warnings are all in an accepted class the
  baseline already carries: two `a11y_no_noninteractive_tabindex` (`role="log"` with `tabindex=0`,
  and the conditional-role tool-call row — `top-nav-mega-menu-item` is the precedent) and two
  `state_referenced_locally` for `defaultIsExpanded`/`defaultIsCollapsed`, which are _deliberate_
  — they are `useState(initial)` semantics, the same shape `Calendar` and `DateInput` carry.

  **The class oracle is wired and green: all 16 `.stylex.ts` modules, 0 mismatches**, taking the
  run to **1,398 style keys and 591 inline call sites**. Two changes to the oracle itself:
  - **`extractGroups` now requires `$$css: true`.** Any top-level object-of-objects with string
    values used to read as a style group, and `ChatMessageMetadata`'s `STATUS_CONFIG` (icon name +
    i18n key per status) is the first non-style one upstream declares beside its styles. It would
    have been reported as five styles missing from our module, and a `skip` would have been the
    wrong answer — it is not styles, so the extractor simply should not see it.
  - **A `stylex.defaultMarker()` pseudo-key for `inline` combinations.** `ChatComposerDrawer`'s
    toggle row is the port's first folded call site that includes a marker, and a marker has no
    `stylex.create` key to name. It compiles to `{'x-default-marker': 'x-default-marker'}` on both
    sides, so the pseudo-key merges exactly that and the run fails loudly if it ever changes.

  **All 14 upstream suites are ported case for case — 146 of 146 cases, all passing**, in six files
  grouped by shared fixtures rather than one per upstream file. Three translations recur:
  - **Real Chromium is not jsdom, and the scroll suites feel it.** Upstream defines
    `scrollHeight`/`clientHeight` onto an element; a browser clamps a `scrollTop` write on an
    element that does not really overflow, so the fixtures give the content _real_ height. The
    `ChatLayout` first-fill pair needs more: its message area is `min-height: 100%`, so the
    self-scrolling root overflows its own height by a fixed ~98px the instant it mounts and the
    mount jump consumes the pending first fill before the case can. Those two run through
    `ChatLayout`'s **external `scrollRef` mode** instead — a documented mode, and the only way to
    put the geometry back under the test's control.
  - **`act()` is `flushSync`** wherever a `$state` write has to land in the DOM before the next
    synchronous assertion; everywhere else it needs no counterpart.
  - **Two assertions are counterparts, not translations**: `container.firstChild` is null in React
    but an anchor comment in Svelte (so the question becomes "did it produce an element"), and the
    empty-state cases pass `{[]}` upstream where the port omits the prop.

  **`ChatMessageList.children` and `ChatLayout.children` are optional**, unlike upstream's
  `children: ReactNode`. Upstream reaches its documented, _tested_ empty state by passing `[]` —
  content that is present and renders nothing — which a `Snippet` cannot express. A required prop
  would put the empty state out of reach of the published type; omitting it is the nearest Svelte
  gets, and both components say so in place.

  **The demo route has landed**: `chat-demos.svelte` plus a `Chat` nav group, drawn from upstream's
  `Chat`, `ChatToolCalls`, `ChatTokenizedText` and `ChatComposer` stories rather than all 74 — the
  rest are auto-scroll and dictation variations that need a live conversation or a microphone.

  **Docs blocks: all 55 landed — the generator reports `599 ported / 0 pending`.** The count is the
  generator's, not the 58 block dirs: `ChatDictation`'s blocks target `ChatDictationButton`, and
  `alsoExampleFor` means dirs and targets are not one-to-one. Five things they settled:
  - **A `string`-typed `children` must be passed as an attribute.** `ChatTokenizedText` and
    `Markdown` both type it `string` on both sides; text written between the tags compiles to a
    `Snippet` and fails to typecheck. `children="…"` is the spelling.
  - **`Stack`'s cross-axis prop is `vAlign`**, not `crossAlign` — `crossAlign` is the
    `StackOptions` name inside `stack.stylex.ts`, not the published prop.
  - **`handleRef` + `useRef` becomes `bind:this`** in the dictation blocks, and `inputRef` is a
    getter — the same pair `useChatDictation` documents.
  - **A per-item snippet prop needs a lookup, not a parameter.** Three blocks map over data and give
    each row a _different_ `metadata` / `startContent` / `avatar`, which a parameterised snippet
    cannot supply: a snippet with arguments cannot be pre-applied and handed to a prop. Each variant
    is declared separately and selected by key, with the table in a `{@const}` sitting directly
    inside the component tag — which is where Svelte allows one.
  - **A `renderItem` trigger has to be assembled in the template.** `ChatComposerTrigger.renderItem`
    is a `Snippet<[SearchableItem]>`, and snippets do not exist in script scope, so the two
    trigger blocks that use one spread a script-side base object with the snippet at the point of
    use. The two blocks that do not use `renderItem` keep their triggers in the script.

  Also worth carrying: `Carousel` is data-driven here (`items` + an `item` snippet) where upstream
  maps over compositional `children`, so `ChatComposerDrawerAttachments`'s `.map()` translates onto
  the `item` snippet rather than into an `{#each}` inside the tag.

  **All four audits ran. Nine defects found, all nine fixed.**
  - **`astryx-test-parity` — 146/146, nothing dropped, merged away or split**, reconstructed
    independently from upstream's fourteen suites and matched in both directions. It confirmed the
    scroll rewrite still tests the component (`scrollRef` is a real upstream prop, and
    `chat-layout.svelte` builds one `scrollContainerRef` closure either way, so the mode switch
    changes where geometry comes from, not which branch decides instant-vs-spring), that the
    hand-rolled `firePaste`/`fireInput`/`fireKeyDown` match RTL's event map on every property the
    components actually read, and that no probe fixture asserts against itself. **Three assertions
    had been weakened during the port** — all three `getByText` (an element-text match) degraded to a
    container-wide substring — plus a missing `> 0` guard: `chat-tool-calls`' "renders nothing" now
    also asserts empty `textContent`, `chat-message`'s `·` separator is pinned to its own `<span>`,
    `chat-composer-input`'s default placeholder is asserted on the `aria-hidden` element, and
    `chat-scroll`'s spring case carries the same overflow guard as its sibling. All four still pass.
  - **`astryx-idiom` — four findings, all real, all fixed**: the `$state` deep-proxy identity bug in
    `useTriggerMenu`, frozen options in `useChatStreamScroll`/`useChatPasteAsToken`/`debounceMs`, and
    the always-present children snippet on `ChatLayoutScrollButton`. Detailed in
    [port/ledger/](./port/ledger/). It also confirmed `ChatMessageList`'s two asymmetric effects are
    correct, and for a sharper reason than the comment gave: the layout context getter _eagerly_
    evaluates `scrollContainer`, so a tracked read would subscribe the registration effect to
    `rootEl` and the `scrollRef` prop, where untracked it depends only on `innerEl` — which is
    exactly upstream's stable `useMemo` deps.
  - **`astryx-parity` — five findings.** `ChatComposerInputProps` omitted two of the three keys
    upstream omits (`onsubmit` was missing, so the DOM handler collided with the component's own);
    the demo route carried invented copy under a header claiming transcription, now replaced with
    upstream's actual `AllStatuses`, `WithStats`, `DensityComparison`, `MultiBubble` and
    `WithStatusTop` stories; and three source comments cited `todo.md` for debts it did not record —
    fixed by adding the rows (hard-coded English, the unread `label`, the `defaultIsExpanded` JSDoc,
    the content-keying hazard, the `string | Snippet` leaf slots) and by repointing the analyser
    comment at `port/ledger/`, where it belongs.
  - **`astryx-surface` — `Chat` is clean in both directions: 63/63 upstream symbols, zero extras,
    zero name drift, 0 unpublished props types.** Every one of the repo's 102 missing and 73
    over-exports predates this batch and reconciles _exactly_ against figures already recorded here,
    which is the real result — because both totals close against the record, a new leak could not
    hide in either. It confirmed `getDefaultAudioContext` and `STATUS_ICON_NAMES` are correctly off
    the barrel. Two corrections to the record: the `./theme` over-exports are **14, not 13** (the
    14th, `parseStyleKey`, is double-counted with the `./utils` row), and **upstream's published
    `dist` lags its source by 22 names**, so a dist-only diff would have invented 9 false
    over-exports and hidden 13 real gaps — upstream _source_ is the authority for surface work.

  **Verified green after the audit fixes:** `pnpm -r build`, `pnpm -r check` and `pnpm -r lint` all
  exit 0; the server project 23 files / 594 tests; **all 137 client files**; the class oracle 1,398
  style keys / 591 inline call sites / 18 documented skips / 0 mismatches; and all five theme
  packages 0 mismatches. That is every component of `pnpm -r test`, though it was assembled from
  several runs rather than one — see [the flake section below](#the-client-full-run-flake-measured-2026-08-05),
  which supersedes what this entry originally claimed about it.

  Five translations this batch has settled, each detailed in [port/ledger/](./port/ledger/):
  - **`createPortal` becomes a moved node, and this is the port's only use of either.** Token spans
    are created imperatively — a `Range` decides where they go — so no framework owns them
    declaratively. `mount()` is _not_ the substitute: it starts a separate component tree, so
    context would stop reaching the content and `ChatPastedTextToken`'s `useTranslator()` would
    fall back to the shipped catalog. Each portal instead renders a `display: contents` span in the
    component's own tree and an attachment moves that span into the token span. One element
    upstream does not have, generating no box; recorded under Known debts.
  - **`useTriggerMenu`'s `renderMenu()` splits into `<TriggerMenuLayer>`**, the
    `useLightbox`/`useImperativeDialog` shape — but with **no new public name**, because the hook is
    module-private upstream. Its running `flatIndex` becomes a precomputed per-group offset: a
    Svelte `{#each}` body is not a sequential pass, and those indices are the
    `aria-activedescendant` targets.
  - **`handleRef` + `useImperativeHandle` become instance exports** on `ChatComposerInput`
    (`Tokenizer`/`SideNav`/`Calendar`/`PowerSearch` precedent). That also deletes upstream's
    `selfRef` and its two `insertTokenRef`/`insertTextRef` mirrors, which exist only because React
    runs the `useImperativeHandle` factory _only_ when a parent attaches a ref — without them
    paste-as-token silently no-ops inside `ChatComposer`. Instance exports are always present.
  - **A `RefObject` option is a getter** — `useChatStreamScroll`, `useChatComposerTokens`,
    `useTriggerMenu`, `useChatPasteAsToken` and `ChatLayout.scrollRef` all take one, the
    `useOutlineFromDOM`/`useScrollSpy` translation. `useChatNewMessages.contentRef` is the
    exception and stays a **callback**: it is published _through a context_ and invoked by a
    different component, which is the shape upstream's `ChatLayoutContextValue` already has.
  - **`usePopover`'s `attachTrigger` needs its cleanup held.** Upstream's `layer.ref` is a ref
    callback that strips the previous element's anchor name when called with a new one; an
    attachment puts that in its cleanup, so `useTriggerMenu` keeps the cleanup and runs it before
    re-attaching. Calling `attachTrigger` imperatively and discarding the return would leave every
    caret-anchor span it has ever created still named.

  **Two traps this batch has already paid for, both worth carrying forward:**
  - **`Read` renders U+00A0 as a plain space.** The composer's trailing separator after a token is a
    **non-breaking** space, written as the escape `'\u00A0'` in `useChatComposerTokens.ts` and as a
    **literal NBSP byte** in `ChatComposerInput.tsx`. Transcribing the literal one silently turns
    the backspace-removes-token-and-space case into dead code — the comparison can never match. Both
    sites are now `'\u00A0'` escapes here, and a byte-level check (`ord(ch) == 0xa0`) is the only
    way to verify it. **Diff the bytes, not the rendering, for any whitespace-sensitive literal.**
  - **Upstream's `escapeRegExp` in `ChatTokenizedText.tsx` is broken**, and it is a crash rather
    than a cosmetic bug. See Known debts.

  **And one lint finding worth generalising:** `svelte/no-dom-manipulating` fires on the composer's
  `textContent` writes, and it is a **false positive that only a contentEditable can produce**. The
  rule guards a template-owned node being mutated behind Svelte's back; the editable `<div>` has no
  template children at all, so Svelte has nothing to reconcile. Four sites carry a disable pointing
  at one `DOM_OWNERSHIP` note; a fifth, writing through a local copy rather than the `bind:this`
  binding, needs none — and the difference is recorded in place, because an _unused_ disable is
  itself a lint error and would otherwise be "fixed" by adding the fourth back.

- [x] **Batch 17 — track upstream 0.2.0 — DONE, split into 17a/17b/17c.** Full plan in
      [`research/08-upstream-0.2.0.md`](./research/08-upstream-0.2.0.md) — workstreams, sequencing,
      open decisions and done criteria. **The split is the point, not bookkeeping:** a batch this
      size run as one unit would sit red for its whole life, and a gate that is expected to be red
      tells you nothing. Each sub-batch closes green.
  - **17a — breaking changes + RTL. ✅ DONE.** Both breaking changes, the direction API, the
    99-site logical-CSS migration (99 → 0), the behavioural RTL units, the lint rule at `error`,
    and an RTL toggle on the demo routes. Skip list 18 → 0; class oracle 267 → 163, the remainder
    being 17b's props showing up early.
  - **17b — new surface + new props. IN PROGRESS.** Done so far: `elevation` (**7**, not the 8 the
    changelog implies — `IconButton` does not take it), `Switch.size`, the `tree` plugin's real
    oracle case, and the whole status-variant family — `statusVariant` on all **12** bordered
    inputs, the `"tooltip"` variant on the 7 that take it, `useInputStatusIcon` +
    `<InputStatusIcon>`, `FieldStatus`'s detached leading icon and its move to live-region
    announcement, and the i18n catalog resync. Then `Icon` (`label` + `xstyle`/`class`/`style`
    composition, plus its 31-case suite, which had never been ported),
    `Table.rowIndexStart`/`rowCount`, `TreeList.variant`, `CommandPaletteInput.label`,
    `HoverCard.label`, and the full `Thumbnail` re-port. Docs-undeclared props **35 → 15**; class
    oracle **101 → 93**.

    **`OverflowList`'s two bounds landed**, and the sizing note below was right about them:
    `hooks/compute-overflow.ts` is now a pure module of its own (**34/34** cases, in the _server_
    project — it holds no DOM, so it never boots Chromium), `use-overflow.svelte.ts` delegates to
    it and gained `rows`/`rowHeight` plus the `maxVisibleItems < minVisibleItems` dev warning, and
    `OverflowList` gained `containerMultiRow` and a `multiRowHeight` dynamic `maxHeight`. Suites:
    `useOverflow` 20 → **26/26**, `OverflowList` 14 → **18** (upstream's 19 less `displayName`).
    Class oracle **93 → 92**; docs-undeclared props **15 → 13**.

    **The whole menu family landed next, and the stale-dist deferral retired itself.**
    `BreadcrumbItem.menu`/`menuSize` needed `useListFocus` to gain `boundarySelector` /
    `ownsEvent` / `getItems` first — shared infrastructure 0.2.0 added, which `DropdownMenu` and
    `ContextMenu` had already silently drifted from (both now pass `MENU_BOUNDARY_SELECTOR`).
    Wiring it surfaced that **0.2.0's published dist compiles the selectable trio and
    `DropdownMenuSubMenu`**, so the deferral recorded below — "the tarball has no dist counterpart
    to diff them against" — was simply no longer true, and the whole of workstream D came with the
    breadcrumb prop rather than after it. Landed: `DropdownMenuCheckboxItem`,
    `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSubMenu`, `menuItemHover.ts`,
    the nested-`items` submenu branch in `renderDropdownItems`, and all three families' aliases
    (`DropdownMenu*` / `ContextMenu*` / `BreadcrumbMenu*`). **All four new `.stylex.ts` modules
    matched upstream's compiled CSS on the first run** — 17 new style keys, 0 mismatches, still 0
    skips. Suites: `Breadcrumbs` 25 → **37/37** (upstream's full file, nothing dropped),
    `dropdown-menu-selectable` **6/6** and `dropdown-menu-sub-menu` **17/17**, both new files that
    could not previously exist. Docs-undeclared props **13 → 11**; documented components 202 →
    **206**; example blocks 599 → **603** (the four this batch unblocked). Class oracle **92 → 88**
    — one of those four was a _drift_ fix, not new surface: our `DropdownMenuItem` still carried a
    `:hover` background that 0.2.0 deleted, `focusMenuItemOnHover` being its replacement.

    **Workstream B and D are now closed, and the generator says so: 0 documented props core lacks,
    623 example blocks ported / 0 pending, 207 of 208 doc entries.** The tail landed as five
    slices — `Timestamp.tooltipEntries` + `DateInput.format` (one unit over a shared
    `SharedDateFormat`/`formatSharedDate` layer), `Avatar` interactivity, `Outline`'s four
    navigation props, the 19-block docs backlog, and `useTableRowStatus`. Six things they settled,
    each generalising past its own slice:

    - **`Outline`'s four props are one behavioural unit, not four.** `useScrollSpy` gained the whole
      0.2.0 navigation contract — `scrollTo(id)` replacing `lockActiveId`, a `finish(didArrive,
shouldResume)` that fires `onNavigateEnd` **exactly once per `onNavigateStart`** including on
      interrupt, `supersede`/`teardown` for a superseded or unmounted navigation, and
      `getRestingTop` as the single source of truth the activation line _and_ the scroll landing
      both read (so `offset` and a heading's own `scroll-margin-top` **compose rather than
      duplicate**). `Outline` gained roving tabindex via `useListFocus`, seated on the _active_
      heading. **Upstream orders that seating effect after the hook's layout effect so it wins;
      here the order does not matter**, because `syncTabStops` keeps whichever enabled item already
      holds the stop and only promotes the first as a fallback — both orders converge, and saying so
      is better than relying on an ordering Svelte does not guarantee. Suite: 17 → **46/46**,
      upstream's whole file. It also fixed a **drift**: our `aria-current` was `"true"` where
      upstream emits `"location"` — load-bearing, since the seating effect finds the active link by
      that exact value.
    - **A hook's option bag is invisible to the docs prop check**, which is how
      `useTableTreeData.hasExpandAllControl` (0.1.9) stayed unported through two audits: the
      generator counts documented props core lacks, and a hook config is not a props interface. It
      landed here with `isAllExpanded` on `useTableTreeState` (+`onExpandAll`/`onCollapseAll` on
      `treeConfig`), a `TreeExpandAllToggle` sharing the row expander's affordance, and a
      `transformHeaderCell` that wraps label + toggle in one inline-flex row. The styles were
      _already_ ported and oracle-verified — `treeStyles.headerCell` has been in the inline list all
      along — so **a green oracle proved a control that did not exist**. Suites: `useTableTreeData`
      23 → **31/31**, `useTableTreeState` 29 → **36/36**.
    - **The class oracle cannot see a `stylex.create` function style at all**, and this is the
      batch's most important finding because it narrows what a clean run means. `extractGroups`
      requires `$$css: true`; a dynamic style compiles to an _arrow function_ value and its hoisted
      static half to a `_temp` of bare strings, so **neither side is diffed**. That is **54 function
      styles across 32 modules** — Slider's track fills, Tree's `indent`, `rowStatus`'s `dot`, every
      `--_var` carrier. Recorded at the head of `compare-upstream-classes.mjs` and under Known
      debts; `useTableRowStatus`'s two colour cases are now the only mechanical check that its dot
      resolves at all.
    - **`useTableRowStatus` is the smallest plugin in the family** (189 LOC) and the first to need
      `bindCellSnippet` _without_ keying — one synthetic column means one binding. Its `null` guard
      lives in the slot rather than the content component, because upstream's `return null` renders
      no node where a component that renders nothing still leaves an anchor comment per row. Oracle
      case wired on the first run, **0 mismatches**; suite **9/9**; both demo stories and the docs
      block landed — and porting it reopened the block backlog by exactly one, the standing rule.
    - **`Avatar.as` was never the open decision it was booked as.** `useLinkComponent()` in this
      port already returns a resolver taking an `as` override, so the prop is a pass-through. What
      the slice actually found is bigger: **our `Avatar` and `Button` both hard-coded `<a>`**, so a
      link inside a `LinkProvider` did a full page load. Of upstream's ten components carrying
      `as?: LinkComponentType` this port had eight; both now route through `LinkElement`.
    - **`elevation` landed on 8 components, not 7 — the earlier correction was itself wrong.**
      `IconButtonProps extends Omit<ButtonProps, 'isIconOnly' | 'children' | 'endContent'>` on
      _both_ sides, and the omit list does not name `elevation`, so `IconButton` takes it by
      inheritance and always did. Reading a props _interface_ rather than what it extends is what
      produced the wrong count — **twice, in opposite directions**, first off the changelog and then
      off the code.

    **And a third recurrence of the record-rot pattern.** `button.svelte`'s link branch carried a
    comment calling this "the deferred `as`/LinkProvider work" — and `todo.md` recorded no such
    deferral. That is the same failure batch 14 and 15 each found (_a header comment is an assertion
    and rots like one_); three occurrences make it a standing hazard rather than an incident, and
    the fix here was to land the work rather than write the entry.

    **Three of those six were bigger than "a prop", and the generator cannot tell you so** — it
    counts documented props core lacks, not the module behind one. `OverflowList`'s two were a new
    pure `computeOverflow` module (**34 test cases**) plus a multi-row packing algorithm, now
    landed; `Avatar`'s five drag in two new style groups, a merged
    `fallback` with `--_avatar-fallback-*` vars, the `data-avatar-item` roving-focus marker, and a
    `tooltip` default that **changes existing rendering**; `Timestamp.tooltipEntries` and
    `DateInput.format` are one unit, sharing a new `tooltipEntries.ts` and the
    `date_long`/`date_weekday` formats. Sizing the tail from the prop count would under-plan it by
    a lot. **`Avatar` also has an open decision** — see `research/08` §11a: upstream reads the
    status element's `label` off the React node (`getStatusLabel`) to compose "Jane Doe, Online",
    and a Svelte `Snippet` has no props to read.

    **Three things this stretch settled, each worth carrying forward:**
    - **The i18n catalog was 31 keys behind and nothing reported it.** No oracle covers
      `locales/en.json` — a missing key falls back to the key string at runtime, silently. It is now
      copied verbatim from upstream (219 keys, byte-identical, and prettier-ignored so it stays
      that way), and upstream's partial `fr-FR.json` came with it. **Resync the catalog on every
      pin bump**, as a step of its own; it is not implied by any component's port.
    - **A hook that returns a node splits into a hook plus a layer component.** `useInputStatusIcon`
      returns a `ReactNode` upstream. That is the third instance of the same translation
      (`renderTooltip` → `<TooltipLayer>`, `hintElement` → `<KeyboardHintLayer>`), so it is now a
      settled pattern rather than a judgement call: the hook returns what the markup needs, the
      component renders it, and the component is exported beside the hook with a comment saying
      upstream has no such symbol.
    - **`Thumbnail` was carrying machinery upstream had retired.** Its remove button sampled the
      picture underneath it (`useImageMode` + APCA + an inverted `<MediaTheme>`) so the glyph would
      read on any image; 0.1.9 replaced that with a fixed scrim plus an `--color-on-dark` icon, and
      left the hook exported but uncalled. Neither a `.d.ts` diff nor the prop list shows this —
      the oracle saw it only as four mismatched style keys. **A prop staying the same does not mean
      the code behind it did.**
    - **`useAnnounce`'s live regions make body-wide `getByRole('status'|'alert')` ambiguous.**
      Moving `FieldStatus` onto the persistent regions put a `role="status"` and a `role="alert"`
      element on `document.body` for the rest of the file, which broke three unrelated cases in
      two other suites. The fix is the container-scoped `screen.locator`, which
      `date-input.svelte.test.ts` had already documented for `Calendar`. **Any future component
      that starts announcing will break the same class of assertion**, and the failure reads as an
      unrelated test going flaky.

  - **17c — a11y, themes, docs. ✅ DONE.** ~30 accessibility fixes (two of which touch
    `base.css` and the theme layer), the Known-debts entries upstream has now fixed, the theme
    declarations, and the full docs regeneration plus the four audit agents.

    **Landed so far, in the order the slices closed.**

    **Shared foundations first, because they can be verified in isolation.** `base.css`'s
    `@media (hover: none) and (pointer: coarse) { :focus-visible { outline: none } }` is deleted
    — a coarse pointer does not mean no keyboard (an iPad with a Bluetooth keyboard, a
    switch-control user), so the guard was removing the WCAG 2.4.7 indicator from exactly the
    people who need it. Upstream's `reset.test.ts` came with it as `base-css.test.ts` (**2**
    cases). `useFocusTrap` now resolves Escape by **DOM containment first, push order second**;
    upstream's reason is React's child-before-parent commit order, and Svelte's effect ordering
    produces the same hazard, so the containment rule is what makes the result independent of the
    schedule rather than a coincidence of it. `aria-hidden` subtrees leave the trap's tab cycle,
    and `useAnnounce`'s regions auto-clear 2s after announcing. Suites: focus-trap 12 → **16**,
    announce 6 → **9**.

    **Then the a11y body**, roughly one slice per family: announcements and naming (Calendar's
    selection state in day names + range progress/completion + `aria-multiselectable`,
    CommandPalette result counts, MultiSelector search counts, Tokenizer add/remove, NumberInput
    units, Divider's `aria-labelledby`, Spinner naming from the visible label); semantics (List's
    unconditional `role="list"`, Item's `aria-selected`→`aria-current` fallback, Carousel's APG
    slide roles + Shift-wheel, Dialog's auto-label from `DialogHeader` with a dev warning,
    MobileNav's `aria-expanded`/`aria-controls`, Chat's drawer `aria-controls` and exposed
    tool-call errors, Button's link-branch `aria-busy`, CodeBlock's inert collapsed region,
    CheckboxListItem's `aria-label`); nav (TopNavMenu's full APG menu pattern, the modal-dialog
    wrapper removed from TopNavMenu/TopNavMegaMenu/SideNavHeading/TopNavHeading, the menu role
    rescoped so the heading button is a sibling not an invalid child, disabled `TopNavItem`s as
    href-less anchors); Slider (group label via `aria-labelledby`, sibling-constrained thumb
    bounds, required via description, controlled-value clamping, snapped-value precision);
    FileInput (the trigger is now a visually hidden real `<button>` beside the clear/status
    controls in a non-interactive container, so no interactive element nests in another); and
    reduced motion for `useChatStreamScroll`'s follow spring.

    **Suites re-ported alongside**: Calendar 52 → **62**, Spinner 16 → **17**, FileInput 50 →
    **52**, plus `Divider` at **16**, which had never been ported at all and whose absence only
    surfaced because this batch changed the component.

    **Read those as deltas, not as completeness — two of them are not the upstream total.** The
    closing test-parity audit measured Calendar at 62 of **73** and FileInput at 52 of **58**;
    Spinner (17) and Divider (16) are complete. The cases added here are the ones 17c's own changes
    needed; the remainder belong to workstreams this batch did not run, and are listed with the rest
    of the coverage gap below. Stating a delta as though it were a total is the same class of error
    as the file headers that assert an upstream count upstream no longer has.

    **Three findings worth carrying past this batch:**

    - **`expect.requireAssertions` caught a case that passes vacuously upstream.** Upstream's
      `reset.test.ts` asserts per matching block with `expect.soft`, so with no `:focus-visible`
      rule left it makes _no assertion at all_ — green upstream, failed here. Restated to assert
      the offender list is empty, which keeps the diagnosis and cannot go vacuous. **This config
      difference is a real asset and worth remembering: it finds dead tests, not just wrong ones.**
    - **A retrying assertion can race a strict locator's match count.** `side-nav.svelte.test.ts`
      began failing with "resolved to 2 elements" — the heading mounts under Playwright's
      stationary cursor at the viewport origin, `useMenuHover` has `showDelay: 0`, so the popover
      opened _during_ the 15s retry window and a second button appeared. Upstream reads
      synchronously and never sees it. Fixed at the query (select by the attribute under test,
      assert synchronously), not by widening the wait — the standing rule.
    - **An upstream fix can introduce an upstream regression**, and the dist is how you tell. See
      the `ChatSendButton` theme-class entry under Known debts.

    **Themes (workstream E) need no work**: all four upstream-tracked oracles are clean in both
    directions (neutral 339, matcha 303, gothic 345, butter 430, 0 mismatches each), and the class
    oracle is at **1490 style keys / 593 inline call sites / 0 mismatches / 3 skips** — the skips
    are the standing RTL-keyframe compiler difference. **The open question about upstream's
    de-hyphenated `KNOWN_COMPONENTS` keys is settled: not replicated, and it cannot be** — the bug
    was in the CLI's registry of _suggested_ override keys, and `packages/cli` has no sources yet.
    `generateThemeRules` passes the author's key through `stableClassName` verbatim on both sides.
    It becomes a real question the moment the CLI's theme-build command is written.

    **Docs**: the `heading` content block's outline half landed — `build-outline.ts` is upstream's
    `ReferenceDocView.buildOutline`, minting page-wide-deduped ids for sections _and_ nested
    headings and seating each at its own level, with `OutlineEntry.level` optional so a page with
    only sections still passes `{id, label}`. Verified on `vite dev`, not just the prod build.
    Generator: **207 documented / 208 upstream** (the umbrella `Chat` page, a docs-site gap),
    **623 examples ported / 0 pending**, **0 documented props core lacks**.

    **Gate at close — every §10 done-criterion, measured:**

    |                                    | result                                                             |
    | ---------------------------------- | ------------------------------------------------------------------ |
    | `pnpm -r build` / `check` / `lint` | exit 0, 0 errors (32 pre-existing svelte-check warnings)           |
    | class oracle                       | 1490 style keys + 593 inline call sites, **0 mismatches**, 3 skips |
    | theme oracles (4 upstream-tracked) | **0 mismatches, 0 missing**, both directions                       |
    | tests — server project             | 27 files, **683 passed**                                           |
    | tests — client project             | 149 files, **3747 passed** (1 skipped), run in 13 chunks           |
    | `pnpm -F docs generate`            | 623 examples / **0 pending**, 0 props core lacks                   |

    The **skip list is 3, not the 4 §10 predicted, and none of the 14 release-gated ones survive** —
    they were deleted at 17a rather than left to rot. The three remaining share one cause (upstream's
    `dist/` carries an RTL `animation-name` class our pinned StyleX build does not emit from
    identical source; a compiler difference, not a style one).

    The client suite was chunked at 12 files, per the standing note that full runs abort
    intermittently. All 13 chunks passed on the first attempt — worth recording, because the
    chunking rule was written when five consecutive full runs did not.

  The port had been pinned to `0.1.7` exact
  since the theme batch; `@astryxdesign/core@0.2.0` (and all five theme packages) shipped
  2026-07-30. This is the first time the port has followed a released upstream _version_ rather
  than porting new surface at a fixed one, so the shape of the work is different: most of it is
  re-baselining what is already ported, not writing new components.

  **Groundwork done.** All eight pins moved to `0.2.0` (`packages/core`, `docs` ×2, the five theme
  packages) and installed; the reference clone was 352 commits and two weeks behind, and is now
  checked out at the **`v0.2.0` tag** rather than `main`. That choice matters and is deliberate:
  pinning the clone to the tag makes **source and published dist correspond exactly**, which is what
  lets the oracle verify everything with no lag skips at all. Tracking `main` would immediately
  re-open the "dist lags source" gap the bump just closed. `CLAUDE.md` was renamed to
  `UPSTREAM-CLAUDE.md` again after the checkout restored it — the rename is not a one-time setup
  step, it has to be re-applied on **every** update of the clone, or Meta's instructions for their
  repo silently load as instructions for this one.

  **Read the changelog before the code — and the class oracle is not the scope.** The first pass at
  sizing this batch worked from the oracle's mismatch list and from `.d.ts` diffs, and it was
  measuring the wrong thing. `packages/core/CHANGELOG.md` in the clone carries **189 bullet items
  across the three releases this jump spans** (0.1.8 · 36, 0.1.9 · 72, 0.2.0 · 81), and most of them
  are invisible to a class diff: new props, behavioural fixes, a11y corrections, and two breaking
  changes. **A batch driven by the oracle alone would have gone green with ~60 behavioural changes
  unported** — a false green of exactly the kind the bidirectional theme-oracle work was meant to
  end. The oracle proves the styles that exist match; it cannot tell you upstream added a prop.

  **Two breaking changes**, and both need a migration decision here:
  - **0.1.8 — `Avatar`/`AvatarGroup` adopt Icon's abbreviated size scale.** `tiny`/`xsmall`/`small`/
    `medium`/`large` become `xsm`/`sm`/`md`/`lg`/`xl`, pixel values unchanged (20/24/36/48/128), and
    **the default moves from `small` to `md`** — same 36px, different name.
  - **0.2.0 — `TabList.orientation` is removed** as a misleading no-op: it never rendered vertical
    tabs, only toggled the keyboard-hint badge arrows, and arrow navigation always accepted both
    axes via `useListFocus`'s `orientation: 'both'`.

  **The dominant theme of 0.2.0 is RTL**, delivered in phases and only partly mechanical:
  - A new **direction API** — `useDirection()`, `getLocaleDirection(locale)` (server-safe, via
    `Intl.Locale.getTextInfo()`), and an optional `dir` prop on `InternationalizationProvider`,
    which auto-derives `dir="rtl"` from an RTL locale.
  - **Phase 2, mechanical**: physical `left`/`right`/`margin*`/`padding*`/`border*` and the four
    physical corner radii migrate to logical equivalents. A no-op in LTR, which is why it produces so
    many class mismatches and no visual change.
  - **Phases 4 and 4b, behavioural** and _not_ reachable by renaming properties: `Slider` flips its
    centering transform under RTL **and measures the pointer/click value fraction from the
    inline-start edge** (a click at 25% must map to 75); `Table`'s sticky-column shadows make
    `translateX` and the gradient direction-aware and gate visibility on `Math.abs(scrollLeft)`,
    because spec-compliant browsers report a negative `scrollLeft` under RTL; `ResizeHandle`'s
    hit-area bias mirrors and its drag delta reads the computed direction; `ChatMessageBubble`'s
    grouped-tail corners use logical radii; `Carousel`'s scroll buttons were a **no-op under RTL**
    entirely. `useListFocus`/`useGridFocus` auto-detect direction for arrow keys.
  - A shared `rtlStyles.mirror` transform, and a new upstream ESLint rule
    (`@astryx/no-physical-properties`) scoped strictly to `stylex.create()`. **Worth adopting here**
    — it is the mechanical guard that keeps phase 2 from regressing.

  **New features on already-ported components** (the part no class diff would have surfaced):
  `Avatar` gains `href`/`onClick`/`as`/`target`/`rel` interactivity plus roving focus inside
  `AvatarGroup` (**the group half of which was still unwired until 17c** — see the AvatarGroup entry
  below; the line above read as "landed" for a whole batch while arrows did nothing);
  a `statusVariant` prop lands on **twelve** bordered inputs (`'attached'`/`'detached'`)
  and a **`statusVariant="tooltip"`** on seven of them, where the on-field status icon becomes a real
  focusable button; `Switch` gains `size` (`sm`/`md`); `TreeList` gains `variant`
  (`'lineGuides'`/`'noGuides'`) and the themeable `--tree-list-indent`; `Timestamp` gains
  `tooltipEntries` (multi-timezone tooltip); `Table` gains `rowIndexStart`/`rowCount` for
  `aria-rowindex`/`aria-rowcount`; `Citation.icon` accepts a node and gains `src`; `Token`'s `color`
  becomes module-augmentable via `TokenColorMap`; `Icon` finally honours `className`/`style`/`xstyle`.
  Plus a long list of new theme targets and `data-state` reflections across the date, selector and
  collapsible families.

  **Roughly 30 accessibility fixes** ride along, several of them WCAG-cited — `List` always emitting
  `role="list"` (Safari/VoiceOver drops implicit roles when `list-style-type` is stripped), the reset
  no longer suppressing `:focus-visible` on coarse pointers, `FileInput` no longer nesting
  interactive controls inside a `role="button"` trigger, focus-trap Escape resolving by DOM depth,
  live regions auto-clearing, and `Calendar`/`CommandPalette`/`Divider`/`Spinner`/`NumberInput`
  announcement corrections.

  **Scope of the style drift specifically, measured rather than estimated:**
  - **Class oracle: 267 mismatches across 39 components**, out of 1,428 style keys and 591 inline
    call sites now checked (up from 1,398 keys at 0.1.7). Concentrated rather than uniform — `slider`
    20, `switch` 16, `selectable-card` 13, then `thumbnail`/`resize-handle`/`field-label`/
    `chat-tool-calls`/`chat-message-bubble` at 6 each, and a long tail of 1–5. New `elevationStyles`
    groups on `button`/`button-group`/`card` are absent from our modules entirely.
  - **14 of the 18 skips retire, and the skip list said so itself.** Every "published dist lags
    source" skip the port ever wrote reported _"the excused upstream string is gone — delete the
    skip"_ on the first run against 0.2.0: Icon's px→rem ×8, `Collapsible.content`,
    `TabList.divider`, the three `tab`/`tab-menu` indicator inlines, and the `tree` module entry,
    which now reads _"now ships in dist/ — delete the entry and add a real case"_. **This is the
    self-retiring-skip property paying for itself in a single step**, and it is the strongest
    argument yet for the rule that a deferral must be written so that it fails when it stops
    applying.
  - **Theme oracles are nearly clean: 1 real mismatch.** Neutral's `--color-border` light value
    changed upstream (`#ebebeb` → `#00000014`). Beyond that each theme is **missing 11 declarations**
    that 0.2.0 adds — the type scale gained `4xs` and `3xs` steps (`.astryx-text.size-4xs` and
    `size-3xs` lead the list). Upstream declaration counts moved neutral 331→342, matcha 295→306,
    gothic 334→345, butter 422→433.
  - **New surface to port**, none of it present at 0.1.7: the **DropdownMenu selectable trio**
    (`DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`) — a deferral
    standing since the early batches, blocked all this time on the dist that did not ship it — plus a
    genuinely new **`DropdownMenuSubMenu`** and its `menuItemHover.ts`, the **`Table` `tree` plugin**
    (`useTableTreeData` + `useTableTreeState`), and **`useTableRowStatus`**. 0.2.0 adds **7 new
    `.doc.mjs` entries** (199 → 206), so the docs-block backlog will reopen — run the generator and
    read the number.
  - **`TreeList`'s dist layout changed**: `treeListItem.markers.stylex.js` is gone in 0.2.0, folded
    into `TreeListItem.js`. The oracle case still points at the old path and **crashes the run with
    `ENOENT` rather than reporting a mismatch**, which is worth fixing on its own terms — a
    restructured upstream file should fail as a diagnosable mismatch, not take the process down.
  - **No component directory was added or removed** between 0.1.7 and 0.2.0; the drift is all within
    existing dirs plus the new files above.

  **Landed so far — 267 → 3 mismatches. The skip list went 18 → 0, then 0 → 3 for one reason
  (below), which is a different and much narrower claim than the 18 it replaced.**

  **Batch 17a is functionally complete.** Both breaking changes, the direction API, the whole
  99-site logical-CSS migration and every behavioural RTL unit are in, with `pnpm -r build`,
  `pnpm -r check` (1,630 files, 0 errors, 33 warnings — the accepted baseline) and `pnpm -r lint`
  all exit 0. Detail below; the headline items:

  - **A2 closed the lint rule to zero: 99 sites across 27 modules → 0**, and the rule is now at
    **`error`** rather than upstream's `warn`. That is stricter than upstream _deliberately_: their
    core still has un-migrated physical properties, and this port has none **unaccounted for**.
    Roughly **19 declarations stay physical on purpose**, each carrying an inline `eslint-disable`
    with its reason. **The "do not blanket-`--fix`" warning paid for itself immediately** — a
    mechanised diff of every one of the 99 sites against upstream's 0.2.0 source returned
    **61 RENAME, 5 RENAME\*, 14 BOTH and 19 KEEP**, so an autofix would have _diverged_ from
    upstream on 19 sites while looking like progress. The KEEP cases are worth naming because they
    are not laziness: symmetric pairs whose logical spelling emits byte-identical CSS
    (Banner/ChatComposer/FieldStatus radii, Calendar's `::before` hit target); a **published
    physical API** (`DialogProps.position`, which a caller sets in physical terms and which would
    silently jump sides under RTL if remapped); a paired physical `translate` that a lone logical
    inset would strand (Avatar's status dot, Popover's close button); and — the one worth
    remembering — **Markdown's `textAlign: 'right'`, which is author _data_, not layout**: it comes
    from a table's `---:` marker and means the literal right edge, so mapping it to `end` would
    re-align the author's column under RTL.
  - **The disables cannot rot silently, and that is what makes `error` safe.** If upstream migrates
    one of them, its emitted atomic class changes and the **class oracle** reports the mismatch. The
    lint rule guards against _new_ physical properties; the oracle guards the exceptions. Two
    mechanisms, neither trusting the other — the same split the self-retiring skips already use.
  - **The 14 stale skips retired, and the count went to 0 rather than the predicted 4.** Every
    "published dist lags source" skip the port ever wrote reported itself stale on the first run
    against 0.2.0 and is now deleted: Icon's px→rem ×8, `Collapsible.content`, `TabList.divider`,
    the three `tab`/`tab-menu` indicator inlines. The `tree` module's `ABSENT_UPSTREAM` entry became
    a **real oracle case** (clean on the first run) instead of being deleted and forgotten —
    `ABSENT_UPSTREAM` is kept as an empty array with the reason, because that is where the next such
    module goes.
  - **`rtlStyles.mirror` is ported once and composed in seven places**, and the composition rule is
    the whole point: it goes on a span **outside** any state-driven rotation. Sharing an element
    with a rotating chevron makes one `transform` overwrite the other, and the bug only appears in
    the expanded × RTL corner — invisible in LTR, invisible collapsed. TreeList, SideNav's collapse
    button, the Table row-expansion / grouped-rows / tree plugins and Carousel all nest two spans;
    **Calendar composes onto one element instead**, correctly, because its `navIcon` carries no
    transform of its own. Calendar also had a _hand-rolled_ copy of the same `:is([dir="rtl"] *)`
    transform from an earlier batch — left in place it would have emitted the mirror twice.
  - **The behavioural RTL that no property rename reaches**: `Slider` measures the pointer fraction
    from the inline-start edge (a click at 25% of the track now maps to **75** under RTL);
    `Carousel`'s scroll buttons were a **no-op under RTL entirely** and now flip the physical delta
    sign; `useListFocus`/`useGridFocus` auto-detect direction from the container's computed
    `direction`, read **lazily on keydown and only for horizontal arrows**, so `getComputedStyle`
    never runs on an unrelated key; `ResizeHandle`'s hit area was rebuilt to share the pill's
    physical-offset construction (the old percentage bias mixed a direction-relative `50%` anchor
    with a physical translate and stranded the grab zone under RTL).
  - **The demo route carries upstream's Direction toggle**, and it has to set the direction in
    **two** places — `InternationalizationProvider dir` for the JavaScript half (`useDirection`,
    pointer math, arrow keys) and a real `dir` attribute for the CSS half, because logical
    properties resolve against the DOM and know nothing about a Svelte context. Setting only one
    produces a half-flipped page that reads as a component bug.

  **Landed so far — the detail:**
  - **The oracle no longer dies on a moved upstream file.** `readUpstreamFile()` returns null on
    `ENOENT` and both the case file and the marker module report _"upstream no longer ships … repoint
    the case"_ as an ordinary mismatch. This mattered more than it looks: the raw `readFileSync`
    aborted the whole run at the **first** stale path, so every case after `TreeList` went unchecked
    and the run said nothing about them. A restructured upstream file is precisely the drift this
    script exists to notice.
  - **The `TreeList` family is clean**, and it is the batch's template. 0.2.0 deleted the
    `treeItemScope` marker: focus scoping moved from `when.ancestor(':focus-visible', treeItemScope)`
    to two inheritable custom properties published on the `<li>`, so `tree-list-item.markers.stylex.ts`
    is deleted on both sides and those keys now compare as ordinary atomic classes instead of through
    the marker-normalised CSS fallback. The indent became the public `--tree-list-indent` lever with a
    private `--_tree-indent` the stylesheet consumes — deliberately _not_ an inline longhand, which
    would outrank every layer and put it beyond a theme's reach. **And `wrapper` moved from object
    mode to inline**, which is the batch-12 rule from the other direction: nothing about the
    declaration changed, but dropping the marker left it applied alone at one call site, and a lone
    call site folds. **A case can change oracle mode on a release that touches no style value at all.**
  - **Upstream's `no-physical-properties` lint rule is ported and wired in** (17a/A4), verbatim from
    `internal/eslint-plugin-astryx/`, as `packages/core/eslint-rules/`. **At `warn`, deliberately**,
    which is upstream's own severity and for upstream's own reason — at `error` every un-migrated
    module fails the gate before the migration has run. It reports **99 problems, 0 errors, 99
    warnings across 27 modules** (`calendar` 26, `banner` 12, `chat-message-bubble` 8,
    `resize-handle` 7, …), so `pnpm -r lint` stays exit 0 and the warning count doubles as the
    migration's progress meter. Flip to `error` when A2/A3 land — recorded in the rule's own header
    and beside the config entry, not only in the plan. **It earns its place because phase 2 is a
    no-op in LTR**: nothing renders differently, no test fails, and the class oracle only notices
    once a module is already wrong, so lint is the only mechanical guard against the next
    hand-ported component reintroducing `left:`. **Do not blanket-`--fix` it** — see the plan for why
    (upstream is itself un-migrated in three places, and `Slider` proved the fix is often a rename
    _plus_ a behavioural flip).
  - **Both breaking changes are done (17a step 1).** The `Avatar`/`AvatarGroup` scale is
    `xsm`/`sm`/`md`/`lg`/`xl` with the default at `md`, and the union was **replaced, not widened** —
    which is the whole technique. The old names are defects under the parity rule, so making them
    un-typeable turns every stale call site into a compile error instead of a silent survivor; that
    found all 28 files (demo routes, 26 docs examples, the `avatarSizes` ramp, two snippet
    identifiers and a prose comment) without a single grep judgement call. The rename is
    value-preserving (`tiny`→`xsm` 20px … `large`→`xl` 128px), so nothing renders differently, and
    the ported examples now match upstream's own (`<Avatar name="Navi" size="md" />` in `ChatMessage`,
    `<AvatarGroup size="lg">` in `AvatarGroupOverflow`) token for token. `TabList.orientation` and
    its `TabListOrientation` type are gone on both sides; `useKeyboardHint` is now called without an
    orientation, matching upstream's argument-less call, and its suite is **45 cases against
    upstream's 45** — upstream kept the `aria-orientation` case but dropped its rerender half, and
    the port follows.
  - **0.2.0 added a sixth docs content-block type, `heading`, and it took the docs build down.**
    Found by running `pnpm -r build`, not by reading a diff: `/docs/internationalization` failed to
    prerender with `Cannot read properties of undefined (reading 'toLowerCase')`. The cause is worth
    recording because the new block type was only the trigger — `content-block.svelte` ended in a
    bare `{:else}` that rendered the `token-ref` link, so **every unhandled block type was read as a
    `token-ref`** and dereferenced an absent `block.section`. Upstream's switch ends in
    `default: return null`. The final branch is now guarded on `block.type === 'token-ref'` with no
    catch-all, so the next block type upstream adds renders nothing instead of crashing the site.
    The `heading` branch itself matches upstream's renderer, `level` default included. **Still to
    do:** upstream also seats these headings in the page outline at their own level, which
    `DocPageLayout`'s flat `{id, label}` items cannot express — a shell change, tracked for 17c.
  - **17a is DONE.** `build`/`check`/`lint` all exit 0 (1,608 files, 0 errors, 33 warnings — the
    accepted baseline), the class oracle is **267 → 163** with a **skip list of 0**, and the demo
    routes carry an RTL toggle.
  - **The direction API (A1).** `getLocaleDirection` (plain `.ts`), `useDirection` (`.svelte.ts`),
    `InternationalizationProvider.dir` and `direction` on the context value, exported exactly where
    upstream exports them, with `Pagination`'s chevron flip as the first consumer. Suites ported
    **5 + 5 against upstream's 5 + 5**. Both open decisions resolved _by the port's own precedent
    rather than preference_: `useDirection()` returns a **getter**, because all 20+ context readers
    here do and `{current}` is reserved for hooks owning their own `$state` — and here it is
    load-bearing, since Svelte reads context once at init, so a snapshot would freeze every consumer
    at the mount-time direction. `getLocaleDirection` stays a **plain `.ts`** module because it
    exists to be called from `+layout.server.ts` to set `<html dir>`, and the `.svelte.ts` extension
    alone would make it unimportable from the one place it is for; its suite runs in the **server**
    project for the same reason.
  - **The logical-CSS migration (A2): 99 sites → 0, and 19 of them were not renames.** Before
    editing anything, every site was checked against upstream's _source_ — 61 genuine renames, 5
    `textAlign` values, 14 needing eyes, and **19 where upstream is still physical**. Renaming those
    would have _diverged_ from upstream, which is precisely what the "do not blanket-`--fix`"
    warning was about; it is now measured rather than predicted. Each of the 19 keeps its physical
    spelling behind an inline `eslint-disable` naming the reason, and they fall into three honest
    families: **symmetric pairs** (both corners of one axis set together, so the logical spelling
    emits identical CSS), **a published physical API** (`DialogProps.position` takes `{top, right,
bottom, left}` from the caller — remapping it would move a consumer's pinned dialog to the other
    side of the viewport under RTL), and **author data** (Markdown's `textAlign: 'right'` comes from
    a table's `---:` marker and means the literal right edge). Three structural changes rode along
    that no codemod would find: Calendar renamed its style _groups_ and its `roundLeft`/`roundRight`
    chain through `dayCellUtils`/`day-cell.svelte`/its suite, ChatMessageBubble's grouped-tail radii
    became logical, and ResizeHandle swapped its percentage hit-area bias for upstream's
    `hitAreaBiasDir` construction.
  - **Behavioural RTL (A3).** Two shared foundations first — `utils/rtl.stylex.ts` (published, as
    upstream publishes `rtlStyles`) and `hooks/is-rtl-element.ts` (module-private on both sides).
    `useListFocus`/`useGridFocus` now auto-detect direction, resolved **lazily and only for
    horizontal arrows**, because `getComputedStyle` forces layout. The mirror reaches **eight**
    chevrons; seven wrap the rotating span in an **outer** span and Calendar's two compose onto the
    same element — not a style choice: the mirror and a state rotation are both `transform`, so
    sharing an element makes one overwrite the other and the chevron is wrong _only_ in the expanded
    × RTL corner. `Table`'s sticky columns needed both halves — `Math.abs(scrollLeft)` (spec-compliant
    browsers report a **negative** `scrollLeft` under RTL, so the start shadow never appeared and the
    end shadow never cleared) and explicit `[dir="rtl"]` branches for `transform`/`background-image`,
    neither of which has a logical form. Worth noting: `useScrollOverflow` already used `Math.abs`,
    so the port had **half** this fix and no mechanism to notice the other half was missing.
  - **The lint rule is at `error` (A4)** — stricter than upstream, which stays at `warn` because its
    own core is still un-migrated. Ours has no un-migrated properties, only ~19 deliberate ones, and
    **the class oracle is what keeps those from rotting**: if upstream migrates one, its emitted
    atomic class changes and the oracle reports it. The rule guards new physical properties; the
    oracle guards the exceptions.
  - **The skip list is empty — 18 → 0, not the 4 the plan predicted.** Every remaining entry turned
    out to be release-gated and every one reported itself stale on the first run against 0.2.0. The
    `tree` plugin's deferral **converted into a real oracle case** rather than being deleted, which
    is the whole value of having recorded it: `ABSENT_UPSTREAM` is now an empty array with a note
    explaining what belongs in it.
  - **17b is under way — oracle 163 → 101.** `elevation` landed on **7** components, not the 8 the
    plan predicted: Card, ClickableCard, SelectableCard, Button, ButtonGroup, Banner and
    ChatComposer. `IconButton` does _not_ take it upstream — a count read off the changelog rather
    than the code, and wrong. Two of the seven are more than a prop:
    - **`SelectableCard`'s selection ring moved from `box-shadow` to `--_card-ring`.** Both the ring
      and the elevation are listed in `Card`'s single `box-shadow`, so routing the ring through the
      var is what lets a card be selected _and_ raised; setting `box-shadow` directly would have
      silently clobbered whichever landed second. That one change cleared 11 oracle keys.
    - **`ChatComposer`'s shadow moved out of `body` entirely.** Its two tiers are not one surface at
      two depths — `none` draws a real border and re-insets the body padding by the border width so
      content geometry does not shift between them — so it could not stay an override.
      `Switch` gained `size` (`sm`/`md`), which is six new style groups and, notably, **flipped the
      whole module from inline to object mode**: the `size` index made every call site dynamic, so the
      compiler can no longer fold any of them and the case's 13-entry `inline` list collapsed to one.
      That is batch 12's rule (_where upstream keeps its styles decides the mode_) arriving from the
      other direction for the second time this batch, after `TreeList.wrapper`.
  - **A standing rule needed refining: the published dist can lead the tagged source, not only lag
    it.** `Switch`'s thumb travel is the case. The `v0.2.0` _source_ has a bare
    `transform: translateX(12px)`; the published 0.2.0 _tarball_ also emits an
    `:is([dir="rtl"] *): translateX(-12px)` branch. CLAUDE.md's rule — _"the published tarball is
    ground truth but can lag upstream's source … follow the source and record a self-retiring
    skip"_ — assumes the lag runs one way. Here it runs the other, and following the source would
    have shipped a **visibly broken RTL switch** (the thumb travels the wrong way and slides off the
    track) in order to match a stale artifact. **The rule should be read as "follow whichever side
    is newer, and say which"**, not "always follow the source"; the tie-breaker when both are
    plausible is behaviour, not provenance.
  - **`Slider` is clean** — the whole RTL phase-2/4 style change, verified by diffing its
    `stylex.create` block against upstream's source until the two were textually identical rather
    than by chasing the oracle's class hashes. That is the faster loop and it is what found the
    misplacement: two keys carry `translate(-50%, -50%)` and only `thumbHorizontal` takes the RTL
    flip, not `thumb`. **Slider's behavioural half — the pointer math measuring from the inline-start
    edge — is still unported.**

  **The docs backlog reopened, and the numbers are read rather than predicted** (the standing rule).
  After the pin bump the generator reports **202 documented / 208 upstream** entries — the plan
  estimated 206 from the changelog, so upstream shipped **9** new `.doc.mjs`, not 7 — **599 examples
  ported / 23 pending**, and **44 documented props across 32 components that core does not declare
  yet**, which is workstream B's work list arriving pre-measured rather than by hand.

  **The 0.2.0 class re-baseline is done — measured 2026-08-07, not estimated.** The class oracle
  went **81 → 3**, and the three that remain are one component's missing feature, not scattered
  drift. What closed, grouped by what it actually was:
  - **`AvatarStatusDot` now pairs each variant with a distinct shape** — filled dot, ring, minus bar
    — drawn as a stroked inline SVG in `currentColor`, so status is never colour alone (WCAG 1.4.1).
    Each variant sets _both_ the plate and the ink colour, which is what keeps the glyph in contrast
    with its own background; `neutral` inverts (surface plate, secondary stroke) because a hollow
    shape only reads as hollow when its interior is not the variant colour.
  - **`prefers-reduced-motion`** across `chat-tool-calls` (3 keys), `chat-layout-scroll-button`,
    `chat-dictation-button`, `dialog` and `code-block`'s new chevron reveal.
  - **Value re-baselining upstream made at 0.2.0**: checkbox/radio controls 18/22 → 20/24px,
    the card overlays moved off `color-mix(currentColor …)` onto `--color-overlay-hover/pressed`,
    `SideNav` dropped the top border from both footers, `CodeBlock`'s chevron moved to a _leading_
    disclosure (`chevronRight`, rotate 90° when expanded) with the title's `gap` replaced by the
    chevron's own animated `margin-inline-end`, `Citation` split `cursor` into
    `labelInteractive`/`numberInteractive`, and `AvatarGroupOverflow` became a `min-width` pill.
  - **Two more RTL sites the A2 sweep missed**, both `textAlign: 'left'` (`command-palette-item`,
    `use-trigger-menu`), plus `Carousel`'s pill transforms, which had no RTL branch at all.
  - **Three oracle cases moved from inline to object mode.** `TypeaheadItem`, `SideNavItem` and
    `FieldLabel` each took `xstyle` on the call site at 0.2.0, so the compiler stopped folding them
    to literal class strings and emitted style objects instead. Our classes were already correct —
    there was simply no longer a string to match against. They are still compared, key by key.
  - **Three skips, all one cause, and it is the inverse of the usual one.** Where a
    `stylex.keyframes` body translates along the _inline_ axis, the build that produced
    `@astryxdesign/core@0.2.0`'s `dist/` also emitted a mirrored RTL keyframe and a second
    `animation-name` class to select it. Our `@stylexjs/babel-plugin@0.19.0` — the same version
    upstream's repo pins — emits only the LTR keyframe from byte-identical source, and no plugin
    option we can set changes that (`genConditionalClasses`, `enableLegacyValueFlipping` and both
    `styleResolution` modes were tried). So the tarball _leads_ our compiler rather than lagging it,
    which is why "follow the source" cannot close it. `progress-bar.indeterminateFill` and
    `layerAnimations.start`/`.end`; `below`/`above` translate on the block axis and are unaffected.
    Self-retiring in the ordinary way: the run fails the moment our plugin starts flipping these.

  **The theme oracle is clean for the first time** — all five themes at 0 mismatches, 0 missing.
  Two fixes: neutral's `--color-border` `#ebebeb` → `#00000014`, and the 11 missing
  `.astryx-text.<size>` rules, which were not a token gap but a **cascade** one. `size` is
  documented as a font-size override that beats the size implied by `type`, but its StyleX class
  lives in `@layer astryx-base` while a theme's per-type rule lives in the higher `@layer
astryx-theme` — so the theme silently shadowed `size` for every type it styled. Re-emitting the
  size classes from the theme generator, at the same specificity and later in source, is what makes
  the prop work at all. It was reported as a diff count; it was a real bug.

  **Written at 17b's close; 17c has since closed the first two. Kept for the record of what the
  batch inherited, with the outcome noted inline:**
  - ~~**The ~30 a11y fixes beyond reduced motion (workstream C) are untouched**~~ — **done at
    17c**, along with the Known-debts entries upstream has now fixed (`FieldLabel`,
    `ChatSendButton`, and the re-read of the whole closed-prop-list block).
  - ~~**No `avatar`, `button` or `avatar-status-dot` suite exists here**~~ — **all ported at 17c**,
    plus `AvatarGroup` (24), `Citation` (16) and `Divider` (16), none of which had a counterpart
    either. The prediction in this entry was right and understated: the link-component fix had no
    suite to run against, and when the suites finally landed they found **five** unported or broken
    things across those components rather than the one this entry anticipated.
  - **`Citation`'s suite is now ported in full — 16/16, all green — and how it got there is the
    finding.** `src/tests/citation.svelte.test.ts` carries all 16 of upstream 0.2.0's cases (the
    seven that lived inside `leaves.svelte.test.ts` moved there and went back to upstream's own
    atomic-class probe, plus the nine 0.2.0 adds). Four of them failed on first run, and all four
    were one gap: **`Citation`'s 0.2.0 source-icon work had never been ported**, despite being
    listed in this file as 0.2.0 surface. `CitationSource` read `icon?: string` with no `src`, so a
    snippet handed to `icon` was stringified into `src` and Svelte threw
    `snippet_without_render_tag`. The `icon: string | Snippet` + `src` resolution (node wins;
    `src`, then a legacy string `icon`, as the image fallback) has now landed, along with a smaller
    misplacement in the same markup — `aria-hidden="true"` sat on the `<img>` here and on the
    **icon wrapper `<span>`** upstream, which is load-bearing once the wrapper can hold a rendered
    node instead of an image.

    **This is the third instance of the batch-17 pattern that no gate catches surface, and the
    first where the missing thing was a documented _prop_.** `hasExpandAllControl` hid because a
    hook config is not a props interface; the class oracle stayed green on styles a missing control
    would have used; here `Citation.icon` widened its _type_ without adding a prop name, so the
    docs generator's "documented props core lacks" check — which compares names — saw nothing to
    report, and the class oracle had nothing to say either. **Only porting the suite found it.**
    That is the strongest argument yet for treating an unported upstream suite as a gap in
    coverage of the _component_, not just of the tests.

  - **`Avatar`'s suite landed at 42 + 19 = 61/61, and it too found a live bug on the first run.**
    `Avatar` **erased a consumer's `aria-describedby`** in every case except a custom string
    tooltip — which is the uncommon one. Upstream builds `describedByProp` as a whole prop _object_
    that is `null` in the default case, so `{...props}` supplies the attribute untouched; this port
    computed a _value_ and wrote `aria-describedby={describedBy}` after the rest spread on all three
    roots, so the `undefined` fallback won and removed the attribute. It dropped with
    `tooltip={false}` too, i.e. when no tooltip existed at all. Fixed by falling through to
    `rest['aria-describedby']`, which reproduces upstream's spread semantics for all three roots at
    once. **Note which case caught it**: the sibling case that _composes_ a consumer value with a
    custom tooltip passed, so only the non-custom path was broken — a shape no partial port of the
    suite would have found.
  - **`AvatarGroup`'s suite (24) landed and found the third component gap — a feature this file
    recorded as landed.** The 0.2.0 roving-focus feature was **half-wired**: `Avatar` stamped
    `data-avatar-item` on its interactive branches and `AvatarGroupOverflow` stamped it on its
    `<button>` — both with comments explaining the marker was there _for_ the group's roving focus
    — but `AvatarGroup` never called `useListFocus` and never rendered the `aria-describedby`
    keyboard hint whose catalog key was already sitting in `en.json`. **Every producer of the marker
    existed and the consumer did not**, so no member ever received a tabindex and arrows did
    nothing. Wired now, and the five failing cases pass. **The lesson is about the half that did
    land**: it had a passing test and a comment asserting a behaviour that was not implemented
    anywhere — a fourth recurrence of _a header comment is an assertion and rots like one_.
  - **`Button`'s suite landed at 38/38 with no component change** — the one suite in this sweep that
    found nothing, and worth naming so the pattern is not overstated.
  - **Three component gaps in four newly-ported suites is the number worth remembering.** Every one
    of those components was recorded as done and current; every one was wrong in a way all existing
    gates were blind to. The audit agents check drift against upstream's _source_; a ported suite
    checks behaviour against upstream's _assertions_, and those are not the same question. **An
    unported upstream suite is a gap in the component's verification, not a tidiness debt.**

  - **Function styles are unverified by the class oracle** (54 across 32 modules) — see the entry
    under Known debts for what closing it would take.
  - **Docs: 207 documented / 208 upstream, 623 examples ported / 0 pending, 0 documented props core
    lacks.** All read from the generator, per the standing rule. The one undocumented entry remains
    the umbrella `Chat` page, which is a docs-site gap rather than a component one.

  **Measured at 17c's close.** `pnpm -r build`, `pnpm -r check` (0 errors, 32 warnings) and
  `pnpm -r lint` all exit 0. Class oracle **1490 style keys / 593 inline call sites / 0 mismatches /
  3 skips** (the standing RTL-keyframe compiler difference). Four theme oracles clean both ways:
  neutral 339, matcha 303, gothic 345, butter 430, **0 mismatches each**. Tests: **684 server +
  3746 client = 4430 passing**, 1 skipped, 0 failing — all 149 client files and all 27 server files.
  (Re-measured after the post-audit fixes below; the server count moved 683 → 684 with the one
  `day-cell-utils` case those fixes required.)

  **That client figure was first recorded as 3250, and it was wrong.** The chunk loop hit the
  10-minute shell limit partway through, the remainder was re-run in the background, and the totals
  were summed from the logs that happened to be on disk — covering 120 of 149 files. The closing
  test-parity audit caught it by enumerating with `vitest list` instead of trusting the run.
  **A tally assembled from per-chunk logs is only as complete as the loop that wrote them**, and
  nothing in the summing step notices a missing chunk. Enumerate first, reconcile the tally against
  that number, and treat a mismatch as unfinished rather than as a discrepancy to explain.

  **Two independent methods agree at 3746**, which is what makes the corrected figure trustworthy
  rather than merely newer: `vitest list --project=client` _collects_ 3746 across 149 files, and a
  complete chunked re-run _passes_ 3746 across the same 149. Collected and passing are different
  measurements, and the audit was right not to close on the enumeration alone — they coincide here
  because nothing is skipped in the client project except the single recorded case, which lives in
  the server project's count.

  **One thing the full run is worth recording for.** `tab-list-hydration`'s single case times out at
  15s when its chunk is 12 files wide, and passes alone, as a pair with `tab-list`, at 5 files, and
  at 6. Nothing in 17c touches `TabList` or hydration; it is the standing intermittent client-project
  flake, and what is _new_ is a repro recipe — **chunk width, not file pairing, is the variable**.
  The case server-renders and then hydrates inside a 15s budget, and it shares a chunk with
  `table-tree-data-perf`. Worth revisiting as a real fix (raise that one case's timeout, or move the
  perf file) rather than living with a chunk size that happens to work.

  **The parity audit found four more, and they were not where the batch had been looking.**

  - **Four more 0.2.0 theme targets were missing** — `calendar-nav`, `tree-list-item-label`,
    `tree-list-chevron`, `tree-list-guide` — bringing the batch's total to **sixteen**. My own sweep
    used a line-oriented grep and could not see a multi-line `themeProps(
'name',` call, which is
    exactly how upstream writes the ones with a state argument. **The lesson is about the tool, not
    the list**: a regex over source is the wrong instrument for a question about calls, and the
    audit's parser-based extraction (194 upstream keys vs 191 ours) is what actually settled it.
  - **`SideNavHeading` has two popover branches and only one was rescoped.** The collapsed branch
    still had `role="menu"` on the container holding the heading-replica button. Same fix, second
    site — and a reminder that "the component is done" means every branch, in a file with four.
  - **Two rest-spread positions are observable and were wrong.** `CommandPaletteGroup` writes
    `role="group"`/`aria-label`, and `TopNavItem` writes six attributes including `aria-current` and
    the `data-selected`/`data-mode` reflections; upstream spreads rest **last** in both, so a
    consumer's value wins. `TopNavItem` also needed `href`/`target` destructured out — which is
    exactly why upstream names them, and what lets its spread go last without a raw `href`
    defeating the disabled branch.
  - **`AvatarGroup` overwrote a consumer's `onfocusin`** instead of composing it, where its
    `onkeydown` already composed. Upstream wraps both in `composeEventHandlers`.

  **And the rest-spread convention now needs restating rather than reapplying.** `todo.md`'s
  standing entry says rest is spread first everywhere, recorded once, to be revisited _as one
  decision_ — precisely so the set does not go inconsistent. This batch flipped five components to
  upstream's per-component position because each was observable, which is the state that entry was
  written to avoid. The convention is now **per-component where checked, first elsewhere**, and the
  audit measured the residue: upstream spreads rest last in eleven components and first in fifteen,
  and every one of the "first" cases already matches. Of the eleven, four more invert precedence for
  data attributes only (`Collapsible`, `MobileNav`, `ChatComposerDrawer`, `CodeBlock`) and are worth
  closing as a set.

  **The idiom audit found two live bugs, and both are the same translation mistake in different
  clothes: a React effect whose _dependency list is absent_ became a Svelte effect whose
  _dependencies are narrow_.**

  - **`AvatarGroup` measured once where upstream measures every commit.** Upstream's
    `useIsomorphicLayoutEffect(() => {…})` has no dependency array — the "after every commit" form,
    chosen because React cannot know which render added an item. Our `$effect` read only `root`,
    which `bind:this` assigns exactly once, so a facepile filled by a fetch would _never_ gain its
    `aria-describedby` keyboard hint: a screen-reader user is never told the group is
    arrow-navigable. Roving tabindex itself survived, because `useListFocus`'s `attachList` installs
    a `MutationObserver` — **which is precisely the idiom the effect was missing**, and is now what
    it uses. The suite was green because every case mounts its items up front.
  - **`MultiSelector` never cleared the live region on close**, where `Selector` does. Type a query,
    hear "3 results", press Escape inside the 2s auto-clear window, and the count sits in the
    _shared_ document-level `role="status"` node every other component speaks through. One line,
    and the two siblings now agree.

  A third finding was a cleanup with no symptom: `TopNavMenu` carried a third attachment capturing
  the container so its typeahead could re-query `[role="menuitem"]`, duplicating `list.getItems()` —
  which exists for exactly that, and is the counterpart to upstream's `mergeRefs(menuRef, listRef)`,
  one element read twice. Removed.

  **And one shape worth naming before it bites.** `useClickableContainer`'s `$effect` reads
  `options()` wholesale, so with `FileInput`'s new options bag it re-runs on every `isDisabled`
  change where upstream's is keyed `[containerRef]`. The body is an idempotent `setAttribute` with
  no teardown, so nothing is observable today — it is the flattened-dependency-array shape, and the
  next option added to that bag could make it so. Routing `container` through a `$derived` before
  the effect restores upstream's key.

  **Eleven fixes landed after the four audits reported, and the gate above was re-run over them.**
  Grouped by what the finding actually was, because the mix is the point — only three were the
  a11y-shaped work 17c was scoped around:

  - **A live a11y regression no gate could see.** `dayCellUtils.computeDayCellState` set
    `isToday` without the `!isOutside` guard its three siblings all carry, so with `hasOutsideDays`
    or a two-month view **`aria-current="date"` landed on two cells at once** — the duplicate
    indicator upstream removed at `25def2f10`. Upstream's one case for it (`does not identify an
outside day as today`) was the single case our 41 was short of its 42; the test-parity audit ran
    it as a probe, it failed, and it is now ported. Fixed, and the guard's reason is recorded at the
    function.
  - **`Slider` positioned horizontally with a physical `left`** where upstream uses
    `insetInlineStart`, at all three sites (thumb, marks, filled track). `thumbHorizontal` carries
    no positional inset of its own, so the inline style _is_ the position — and the `.stylex.ts`
    block had already ported the RTL half of the pair, flipping `transform` under `[dir="rtl"]`.
    Under RTL the thumb was therefore mirrored _and_ mis-offset, and disagreed with
    `handlePointerDown`, which correctly measures from the right edge. Verified in real Chromium
    with a throwaway probe, since no gate covers inline styles: LTR 25% sits at 103.5px of a 414px
    track, RTL 25% sits 103.5px from the **right**. The vertical `left: 50%` stays physical —
    it is a centring constant and upstream writes it physically too.
  - **`Dialog` dropped a consumer's `onkeydown` entirely.** Upstream deliberately does _not_ put
    its Escape handler in the element's props — it is `dialog.addEventListener('keydown', …)` from
    an effect, precisely so a consumer handler arriving through `{...safeProps}` still reaches the
    DOM. Svelte has one `onkeydown` slot per element and the explicit attribute beats the spread, so
    the two are now composed, in upstream's order: React delegates to the root container, so the
    dialog's own listener runs first and the consumer's after, unconditionally. The consumer call
    sits outside the `isOpen` guard because upstream installs its listener only while open.
  - **Two i18n keys were in the catalog and referenced nowhere** —
    `@astryx.chatDictationButton.startDictation`/`.stopDictation` and
    `@astryx.chatToolCalls.groupLabel` were the only three of 219 that upstream uses and our source
    did not. Both components string-concatenated English instead. **No gate could see this**: the
    catalog matched byte-for-byte, and `groupLabel`'s default is `"{count} tool calls"`, so English
    output was identical — only the ICU parameter was lost. The stale Known-debts row calling these
    "replicated, not fixed" cited 0.1.7 line numbers; upstream translates both at 0.2.0.
  - **`Avatar` used `??` where upstream uses `||`.** Narrow but it is the WCAG 4.1.2 path: an
    explicit empty `alt`/`name` alongside a labelled `AvatarStatusDot` yielded `''`, making the
    avatar decorative and dropping the very status label the 0.2.0 fix exists to surface.
  - **`FileInput` kept a `liveRegion` style and an exported `fileInputLiveRegionAttrs()` with zero
    call sites** — 0.2.0 moved that announcement to `useAnnounce` and deleted both. This one is
    **oracle-invisible by construction**: the block was byte-identical to `hiddenInput`, so it
    compiled to the same atomic classes and the diff read the collision as a match for a key
    upstream no longer has.
  - **`Icon` component mode spread rest before the theme**, where upstream spreads it last.
    Upstream's own two branches disagree — component mode last, registry mode first — and ours now
    matches each rather than tidying them into agreement.
  - **`UseTableSelectionStateConfig.getRowLabel` was invented.** Upstream's state hook neither
    accepts nor forwards one; it is a member of the _plugin_ config only. Removed.
  - **`DropdownMenuContext` is now published.** Upstream started exporting the object itself at
    0.2.0 — "public so consumers can build custom menu items". The module's stated reason for
    withholding it ("a Svelte context has no equivalent value to export") was contradicted by the
    ten `Context` objects this barrel already ships.
  - **Three stale comments corrected**, each asserting something that had stopped being true:
    `DropdownMenu`'s header still called the selectable rows deferred (they ship),
    `top-nav-heading.stylex.ts` cited `themeProps('nav-icon')` where the call is `'navicon'` — one
    of upstream's eight genuinely de-hyphenated names, and load-bearing for the `:has()` selector —
    and `useMediaQuery`'s design note claimed its `$effect.pre` "runs after the hydration pass".

  **That last one was a false claim in a load-bearing comment, and two other files cited it.**
  Verified against Svelte 5.56.7 rather than argued: the compiler emits `user_pre_effect` _above_
  the template, `create_effect` runs a `RENDER_EFFECT` immediately instead of queueing it, and
  `effects.js` contains **zero** references to `hydrating`. So the live media reading has already
  landed before the template hydrates, and a `{#if}` keyed on it takes Svelte's mismatch-recovery
  path — the server's subtree is discarded and rebuilt. `AppShell` and the docs' `DocPageLayout`
  both justified mounting one side of a breakpoint by quoting the claim. **The behaviour is
  unchanged and the comments now say what actually happens**: a pre-effect buys the _no-flash_
  half of upstream's three-argument `useSyncExternalStore`, not the _hydration_ half. A plain
  `$effect` would trade one for the other — correct hydration, visible flash on every client-only
  mount — which is worse and is a regression against React rather than a match for it. Reproducing
  both halves needs a hydration signal Svelte does not expose.

  **A repo-wide sweep for the `Dialog` shape found no others.** Mechanically: every element
  carrying a `{...rest}`-style spread _and_ an explicit `on*` handler not destructured out of
  `$props()` — 26 sites across 16 files. All 26 are parity, because upstream's JSX clobbers in the
  same direction; the two that were not (`Dialog`, `AvatarGroup`) are fixed above. The sweep is
  worth keeping as a recipe: naive greps produced 126 then 33 false positives, because the handler
  usually sits on a _child_ element, and because the shorthand destructure (`onkeydown,`) reads
  differently from the renamed one (`onkeydown: onkeydownProp`). `ToggleButton` is the one site that
  clobbers in the _opposite_ direction — upstream puts `{...props}` last so a consumer's `onClick`
  silently disables toggling — and that is already recorded under Known debts.

  **A process failure worth recording, because it made two audit reports contradict each other.**
  The four closing audits were briefed as read-only — `astryx-parity`, `astryx-idiom` and
  `astryx-surface` have no write tools, and `astryx-test-parity` is scoped to `src/tests/`. The
  working tree nonetheless changed under them **three times**: `calendar-nav` and the three
  `tree-list-*` targets landed mid-pass, along with `TokenColorMap`, the `useChatComposerContext`
  export and three over-export removals. The consequences were real, not cosmetic — `pnpm -r check`
  went red twice mid-run for reasons that had nothing to do with the code being audited, and the
  parity and test-parity reports state **opposite facts** about whether `calendar-nav` exists,
  because they sampled either side of an edit. Both were right when they looked.
  **An audit is a measurement, and a measurement of a moving tree is not one.** The rule the earlier
  instruction was reaching for needs to be stronger than "do not edit `src/lib`": nothing may write
  to the tree while a closing audit runs, including the orchestrator. If a finding needs a fix to
  confirm it, the fix waits. The gate reported before the audits was, in consequence, a gate over
  source that no longer existed, and had to be re-run in full.

  One
  upstream change to be aware of while working: 0.2.0 adds a **`postinstall` nudge** to
  `@astryxdesign/core` and `/cli`; pnpm reports it as an ignored build script, which is correct — it
  prompts for `astryx init` and is not a build step.

  **A method note worth keeping, because it cost the first hour:** diff the `stylex.create` block
  against upstream's **source** to find _what_ changed, and use the oracle to confirm it. The oracle
  reports mismatched atomic class hashes, which say a key is wrong but not why; the source diff says
  `left: 0` became `insetInlineStart: 0`. `scratchpad/show.mjs` pairs the two automatically off the
  oracle's own `CASES` table.

- [ ] **Batch 18 — track upstream 0.3.0, and end in the port's first release — IN PROGRESS, split
      into 18a/18b/18c.** Full plan in
      [`research/09-upstream-0.3.0.md`](./research/09-upstream-0.3.0.md) — workstreams, sequencing,
      open decisions and done criteria. `@astryxdesign/core@0.3.0` and the five theme packages
      shipped after batch 17. **This is the second release-tracking batch, and the first run with
      the intent of ending in a release of this port rather than in another green gate.**

  **Why a release is the point.** Every batch so far has raised fidelity against a moving target
  with nothing shipped: all six packages are still `version: 0.0.0`, there is no publish workflow
  and no changesets, and the docs site is not hosted. There is no longer a component backlog to
  finish first — **all 100 upstream dirs are ported and 0.3.0 adds exactly one component and one
  hook** — so "port everything, then release" resolves to "finish `packages/cli` and the ~410-case
  test gap", during which upstream ships 0.4.0. Porting more does not exit the loop; releasing
  converts it from _perpetually behind_ into one batch per upstream release. The ~410-case gap is
  an independent axis and ships as a **documented limitation** of the first release, which is a
  decision recorded here rather than a detail.

  **Groundwork done.** All eight pins moved to `0.3.0` and installed; the clone is checked out at
  the **`v0.3.0` tag** (`v0.3.0` and `astryx-announced/v0.3.0` resolve to the same commit,
  `82d4dab3d`), so source and dist correspond exactly and the oracle needs no lag skips.
  `CLAUDE.md` was renamed to `UPSTREAM-CLAUDE.md` again after the checkout restored it — **the
  rename is per-update, and this is the second consecutive batch to re-apply it**.

  **0.3.0 is about half the drift of 0.2.0, and the shape is different.** Batch 17's headline was
  267 class mismatches driven by a library-wide RTL property migration. This one is **124**, and
  the migration is _finishing_ rather than starting — upstream's changelog says the RTL
  physical→logical migration is complete. 82 changelog bullets: **3 breaking, ~27 features, ~44
  fixes, 4 docs**, across 121 commits and 513 changed files in `packages/core/src` (+13,106
  / −4,103).

  **One 0.3.0 change actively breaks this repo, and it exits 0.** `@astryxdesign/cli` restructured
  — `docs/` → `assets/docs/`, `templates/blocks/` → `assets/templates/blocks/`. The generator reads
  the old paths, found nothing, **wrote empty registries over the real ones** (20 topics → 0, 623
  examples → 0), and `pnpm -r build`, which runs `generate`, still **exited 0**. The 626
  hand-transcribed example `.svelte` sources are untouched, so it is a two-path fix — but it is
  step one of 18a, and the lesson is the direction of the failure: **the content pipeline fails
  _open_**, so the "0 pending" it reports afterwards is a false green pointing the opposite way
  from the ones this port usually guards against. A content root resolving to zero entries must
  become an error, the same fix the oracle's `ENOENT` case got at 17a.

  **The pre-flight's "cost the whole import list" paid for itself a fifth time, and this time on a
  hook.** `useContainerReveal` reads as 181 LOC and is really ~908: it needs a **571-line pooled
  StyleX module** (`containerReveal.pool.stylex.ts`, a shape this port has not built) plus
  `utils/devWarning.ts` (102) and `hooks/useDevWarning.ts` (54) — **the dev-warning family 17c's
  surface sweep recorded as absent here**. That deferral said _port the module or record a
  deliberate non-port; leaving it unmeasured is the one option that is not defensible_, and a new
  hook now depends on it, so it ends this batch. Porting it also closes the second half of the same
  debt: the **13 ungated `console.warn` sites** become `NODE_ENV`-gated in one change.
  `ComplexSelector`'s import list, by contrast, **came back empty** — the fourth time.

  **Measured baseline, read from the tools rather than estimated** (2026-08-07):

  |                | measurement                                                                                                                                            |
  | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | class oracle   | **124 mismatches** over 1504 style keys + 586 inline call sites, 3 skips                                                                               |
  | — by component | slider 18, text-area 13, switch 7, chat-composer 6, multi-selector 5, timestamp/selector/number-input/chat-layout 4 each, then a tail of 3s, 2s and 1s |
  | theme oracles  | **1 mismatch across all five** — neutral `--color-text-secondary` `#737373` → `#525252`; matcha 303 / butter 430 / gothic 345 / y2k 357 clean, no work |
  | i18n catalog   | ours **219**, upstream **250** — **31 missing, 0 extra, 0 changed**, all shared keys byte-identical                                                    |
  | new surface    | **1 component** (`ComplexSelector`, 446 LOC), **1 hook** (`useContainerReveal`), 2 new `.doc.mjs` (205 → 207); `authoring` removed                     |
  | docs generator | 207 documented / **210** upstream; **14 undeclared props across 9 components**; topics **0**, examples **0** ← the breakage above                      |

  **The 124 mismatches map one-to-one onto the changelog**, which is what says the measurement is
  sound rather than merely small: slider + resize-handle are the new `rtlStyles.centerInline`
  helper, text-area is its layout rework, switch is the RTL thumb mirror plus forced-colors,
  timestamp is the copyable hover card, chat-layout is the phantom-scrollbar flex fix, and
  skeleton / segmented-control-item / radio-list-item / checkbox-input are the Windows
  High-Contrast bullet. Nothing in the list is unexplained.

  **`rtlStyles.centerInline` is a bug this port probably has.** It centres an absolutely-positioned
  auto-width element with physical `left: 50%` + `translateX(-50%)` **on purpose** — both reference
  the same physical edge, so the pair is direction-symmetric, where a logical `insetInlineStart:
50%` anchor paired with a physical translate shifts the element off-centre **by its own width**
  under RTL. That is a regression 17a's migration could have introduced at exactly the three sites
  upstream fixes (Popover close button, vertical Slider track/thumb, ResizeHandle grab-zone), and
  `slider` 18 + `resize-handle` 1 is consistent with having it. It also **retires two of 17a's ~19
  deliberate KEEP disables** — Avatar's status dot and Popover's close button were kept physical
  for reasons 0.3.0 has now solved properly, so those disables should retire rather than persist,
  and the class oracle is what proves it either way.

  **Two hiding places this release re-uses, both named in advance:** `useTableTreeData` gains
  `hasRowClickExpansion`, and **a hook's option bag is invisible to the docs prop check** — the
  same place `hasExpandAllControl` hid for two audits; and `registerIcons()` now accepts arbitrary
  extension keys, which is **a widened type with no new prop name**, the `Citation.icon` shape that
  only a ported suite found.

  - **18a step 0 — the docs pipeline, DONE and mutation-checked.** Both roots repointed
    (`assets/docs`, `assets/templates/blocks`) in `generate-content.mjs` _and_ in
    `vite-plugin-content.mjs`'s dev watcher, which had the same two stale paths and would otherwise
    have stopped rebuilding on upstream edits silently. A new `requireDocModules(dir, label)`
    replaces `findDocModules` at all **three** content roots: a root that does not exist, or exists
    and yields no `*.doc.mjs`, now **throws** instead of returning `[]`. Mutation-checked in both
    directions rather than reasoned about — with the 0.2.0 path restored the generator exits **1**
    with a diagnosable message _and leaves the registries intact_, because the throw precedes the
    write; repointed, it reports **20 topics, 623 examples / 2 pending**. The 2 are 0.3.0's new
    blocks, the standing "porting a component reopens the backlog" rule.

    **The generalisable half is the direction of the failure.** Every other guard in this port is
    built to catch a claim that is too strong (a stale skip, a rotted header, an invented export).
    This one failed the other way: it silently _weakened_ to zero and reported success, and both
    `pnpm -r build` and the batch-close step that exists to read this very number would have
    confirmed it. **A pipeline whose empty state is indistinguishable from its healthy state cannot
    be a gate.** Same shape as the oracle's `ENOENT` fix at 17a, and now the second instance.

  - **18a — the i18n catalog is resynced: 219 → 250, byte-identical.** Copied verbatim and verified
    with `cmp`, not by eye. `fr-FR.json` came too (upstream's is still a 3-key partial), and
    **`pseudo.json` is now carried** — it is upstream surface, the parity rule says match it, and
    `"./locales/*.json"` is a wildcard export so it publishes with no manifest change. The open
    decision recorded in `research/09` §9.1 is therefore closed in favour of carrying it.

  - **18a — `rtlStyles.centerInline` is ported and all six call sites are on it. Oracle 124 → 103,
    with `slider`, `resize-handle` and `use-popover` at zero.** This port did have the bug, at
    exactly the sites upstream fixes: Slider's `trackVertical`, `filledTrackVertical` and
    `thumbVertical`, ResizeHandle's `hitAreaCenteredX` and `pill`, and Popover's
    `closeButtonWrapper` all paired an anchor at 50% with a physical `translate(-50%, …)`, which
    lands off-centre by the element's own width under RTL. Upstream **deleted** `thumbVertical` and
    `hitAreaCenteredX` outright and stripped the centring pair from the rest; this port now matches
    key for key. Popover's was the physical-`left` **KEEP disable 17a recorded deliberately**, and
    its stated reasoning is verbatim what upstream has now formalised into the helper — so the
    disable retires, as `research/09` §A1 predicted.

    **A claim written earlier in this entry was wrong and is corrected here.** It said three further
    Slider keys carried a "hand-rolled" `':is([dir="rtl"] *)': 'translate(50%, …)'` compensation.
    They do carry it — `thumbHorizontal`, `markHorizontal`, `markLabelHorizontal` — but diffing
    against upstream's 0.3.0 source shows all three are **byte-identical to upstream, comment
    included, and unchanged at 0.3.0**. They are parity, not divergence, and nothing about them
    needed touching. The error came from reading our own file and inferring intent instead of
    diffing upstream first — the same shortcut the method note at the end of batch 17 was written to
    prevent.

    **The verification is hand-done, and it has to be.** `centerInline` is a `stylex.create`
    _function_ style, so it compiles to an arrow over a hoisted `_temp` and **the class oracle
    cannot see either half** — the 54-function-style debt. Compiling our module with the oracle's
    own Babel options emits `_temp = {kbCHJM: "x1nrll8i", k3aq6I: "xsqj5wx", $$css: true}`,
    **byte-identical to upstream's compiled `utils/rtlStyles.js`**.

  - **And the fix moved three oracle cases between modes — the batch-12 rule arriving from a new
    direction.** That rule said _where upstream keeps its styles decides which oracle mode applies_.
    0.3.0 sharpens it: it is not only **where** the styles live, it is **whether anything dynamic
    shares their call site**. A conditional with a function style in one branch cannot fold, so
    Slider's nine folded call sites became runtime merges and `dist/Slider.js` — which through 0.2.0
    carried **no style object at all** — now declares eleven keys. Sixteen inline entries were
    deleted from the Slider case and one from `use-popover`, and the comments on both rewritten,
    because a case comment asserting "pure inline mode, 28 literals" is exactly the header-rot this
    file keeps recording.

    **State precisely what that costs, because "0 mismatches" now means less than it did.** The
    eleven keys are still diffed — coverage _moved_ to object mode rather than vanishing. What is no
    longer checked is the **combinations** (the twelve thumb permutations especially), plus
    `centerInline`'s own two classes, which no run can see. So slider going 18 → 0 is partly a real
    fix and partly the oracle losing sight, and the honest split is: declarations verified,
    combinations no longer, helper hand-verified once.

  - **The class re-baseline was run as ten parallel agents over disjoint component directories, and
    the partition is the finding.** Two constraints made it work: the oracle script is a **single
    shared file** every component needs a case edit in, so agents reported case changes and the
    orchestrator applied them serially; and the gate is repo-wide, so no agent ran `pnpm -r`
    anything. Oracle **124 → 3** across the wave, skip list **3 → 0**.

    **The parallelism has one hard limit, and it is this repo's own test setup.**
    `src/tests/setup-stylex.ts` statically imports `$lib/index.js`, so **one agent mid-rename takes
    down every client suite in the repo** — a `multi-selector.stylex.ts` that had lost an export its
    `.svelte` still imported failed three unrelated agents' runs for ~3 minutes. Three of them
    diagnosed it correctly and re-ran; one reported a `switch.svelte` `ReferenceError` that was the
    _orchestrator_ mid-edit. **While write-agents are running, no test run in this tree is a
    measurement** — the same rule 17c learned for audits, now shown to apply to any concurrent
    write.

  - **Two more of 17a's ~19 deliberate KEEP disables retired, and the pair is worth contrasting
    because only one of them was ever _true_.**
    - **`Banner`'s radii disable was justified by a false claim.** Its nine-line comment asserted
      the physical pair was a "symmetric pair whose logical spelling emits byte-identical CSS".
      Upstream migrated at 0.3.0 and the oracle then showed **four different atomic hashes** for
      `headerCardWithContent` and two for `contentAreaCard`. The reasoning was simply wrong, and
      every gate agreed with it for a whole batch — the disable suppressed the lint, and the oracle
      had nothing to compare while _both_ sides were physical. **Two mechanisms neither of which can
      see a wrong exception both sides share.**
    - **`Markdown`'s `textAlign: 'right'` disable was correct and upstream changed its mind
      anyway.** The reasoning stands on its own terms — the value is a GFM `---:` marker, author
      _data_ meaning the literal right edge, not layout — but 0.3.0 renamed the key to `end` and the
      declaration to `textAlign: 'end'`. Followed upstream.

    - **`Calendar`'s day-cell hit target was the third, and it repeated Banner's false claim
      word for word.** Its disable read "the four sides carry the same value, so the box is
      symmetric and the logical spelling would emit identical CSS" — the identical assertion, and
      identically wrong: `dayCellStyles.day` differed by four atomic hashes until
      `right`/`left` became `insetInlineEnd`/`insetInlineStart`. `top`/`bottom` stay physical
      because they are block-axis, which is upstream's own split.

      **The distinction matters for how the remaining ~16 get reviewed**: one class is a claim to
      re-verify, the other is a judgement to re-check against upstream's. They are not the same
      task, and a sweep that treats them alike will either miss the false ones or churn the sound
      ones. **And the false class has a signature** — "the logical spelling would emit identical
      CSS" appeared twice, in Banner and Calendar, and was wrong both times. It is a claim about
      compiler output that was never run through the compiler. **Any disable justified by predicted
      CSS rather than measured CSS is suspect by construction**, and the oracle can settle each one
      in a single run by flipping the property and reading the hash.

  - **A changelog describes a release's history, not its contents — and following it produced a
    false entry in this batch's own plan.** `research/09` said `Dialog.position` "gains logical
    `start`/`end` and deprecates physical `left`/`right`. Both work; logical wins when both set",
    quoting 0.3.0's changelog. **At the `v0.3.0` tag there is no physical arm at all.** Commit
    `827f17387` added the logical pair and deprecated the physical one; commit `e6beddb4e` — the
    "remove deprecated APIs" breaking change, three bullets earlier in the same changelog — then
    deleted it. The prose describes an intermediate state that never shipped, and building it would
    have invented `left`/`right` on our published API.

    Caught because the agent doing the work re-derived from `git show v0.3.0:…` and the published
    `.d.ts` instead of trusting the brief, which is what it was told to do. **`git show <tag>:<path>`
    is the spec; the changelog is only the index of where to look.** That is the pre-flight's
    "verify the description against upstream source" item applying to _upstream's own prose_ rather
    than to `research/01` — and it means `DialogPosition` is a **breaking change for consumers**:
    `position={{left}}` → `{{start}}`, `{{right}}` → `{{end}}`. No consumer exists in this repo.

  - **NINE lying suite headers in one batch, and the class of lie matters more than the count.**
    Three kinds turned up:
    - **A false number with no missing case.** `item.svelte.test.ts` claimed 37 where both sides had
      40 — nothing was absent, the figure was simply wrong.
    - **A stale _reason_ rather than a stale count.** `popover.svelte.test.ts`'s skip said "blocked
      on the `Dialog` component, which is NOT ported yet", written before Dialog landed.
    - **A count that concealed real unported cases** — the dangerous one, six times over.
      `context-menu` explained a 2-case drop as blocked on the DropdownMenu selectable trio, which
      shipped at 17b. `markdown` claimed 55/55 against upstream's 56. `table-row-expansion` claimed
      9/9 "nothing dropped" against 13, hiding a whole `useTableRowExpansionState cycle guard`
      block. `dialog` claimed 25 against 30, hiding a five-case `accessible name` block. `token`
      claimed 32 against 33, hiding the theme-augmented-colour case. `checkbox-list` claimed 43/43
      against 46, hiding the entire `CheckboxListItem accessible name` block.

    **Every one of those hidden cases passed on the first run once restored.** No component bug was
    behind any of them — which is exactly why nothing ever reported the gap, and exactly what makes
    the pattern dangerous: a header is the only artefact that claims coverage, and a wrong one is
    indistinguishable from a right one until someone re-derives the count from upstream. **A suite
    header that names only a total is unfalsifiable.** The form that works is
    `date-input.svelte.test.ts`'s — upstream total, local total, and why they differ — because each
    number is separately checkable and the difference has to be argued.

  - **Two source comments asserted a mechanism that never existed, and the same sentence appeared in
    both.** `checkbox-list-item.svelte` and `thumbnail.svelte` each justified a bare init-time
    `console.warn` with "so it warns during SSR as upstream's render-time `useDevWarning` does".
    Upstream's `useDevWarning` is **`useEffect`-based** and never warns during SSR, so the premise
    was false and the init statement _diverged_ rather than matched: two lines (server + hydrate)
    where upstream emits one, silence when props later become the bad combination, and no
    `NODE_ENV` gate, so it shipped to production. Both now call the real `useDevWarning`, which
    landed with `useContainerReveal` this batch. **A comment that explains why our shape matches
    upstream's is a claim about upstream, and this port has now been wrong about that four times**
    (Banner's radii, Calendar's hit target, and these two).

  - **An object-mode-only case can check a key with NOTHING, silently — a blind spot the batch found
    by accident.** `ProgressBar`'s case carried no `inline` list. Upstream's `dist/` keeps only
    `container`/`fill`/`indeterminateFill` as objects and **folds** `header`, the label pair and
    `track` into literal strings, so object mode had no counterpart to diff those against and
    reported nothing at all — `styles.track` had been unverified for as long as the case existed.
    Adding the ten folded combinations took the run from 594 to **604 inline call sites checked**,
    all matching.

    **The mechanism is general and worth a sweep.** The leftover check — the thing that catches "you
    claimed fewer sites than upstream has" — only runs when a case _has_ an `inline` list. So any
    case that is object-mode-only, in a module where upstream folds anything, is silently partial,
    and a green run says nothing about the folded half. This is distinct from the function-style
    debt (which no mode can see) and from the mode migrations 0.3.0 forced: it is a case-authoring
    gap that has been latent since whenever each case was written.

    **The sweep ran, and it found a real defect — which is the whole argument for having run it.**
    Of the 122 cases, **78 were object-mode-only**; running the script's own
    `extractInlineClassNames()` over each one's upstream dist file split them **6 silently partial
    (11 folded strings) / 72 genuinely clean**. Ten of the eleven strings were claimed and matched
    at once, closing keys that had never been verified: `Button`'s spinner overlay, delayed spinner,
    label text and end-content wrapper; **`Divider`'s entire `labelStyles` group**; `AspectRatio`'s
    two child keys; `Kbd`'s whole 17-class keycap; `Blockquote`'s `cite`.

    **The eleventh failed, and it was a genuine style bug in `Spinner`.** Our `rotation` keyframe
    wrote `from`/`to` where upstream writes `'0%'`/`'100%'`. CSS treats those as equivalent —
    **StyleX does not**, because it hashes the keyframes body verbatim, so the two compile to
    different `@keyframes` names and different `animation-name` classes (`x1ka1v4i` upstream vs
    `x1aerksh` here). Every other class in the string agreed. The animation looked correct, which is
    why it survived; what it actually broke was the port's whole byte-identical-CSS property, and
    our stylesheet shipped a keyframe upstream's does not have. Upstream's source and its published
    dist agreed with each other, so this was ours, not a lag. Fixed, claimed, and now checked —
    **615 inline call sites**.

    **Two things this settles.** First, `from`/`to` vs `0%`/`100%` is a real class of divergence to
    watch for in any `stylex.keyframes` — equivalent CSS is not equivalent StyleX. Second, and
    larger: a green oracle run was never evidence about a key no case claimed, and nothing in the
    output distinguished "checked and matching" from "not checked at all". The counts in the status
    table are the honest measure, which is why they are quoted with the mismatch number rather than
    instead of it.

  **Gate at 18b's close — every axis measured, not predicted:**

  |                                    | result                                                                  |
  | ---------------------------------- | ----------------------------------------------------------------------- |
  | `pnpm -r build` / `check` / `lint` | exit 0, 0 errors (32 accepted svelte-check warnings)                    |
  | class oracle                       | 1,528 style keys + **615 inline call sites**, **0 skips, 0 mismatches** |
  | theme oracles (5)                  | 0 mismatches — neutral 339, matcha 303, butter 430, gothic 345, y2k 357 |
  | tests — server                     | **31 files, 716 passed**                                                |
  | tests — client                     | **156 files, 4,012 passed, 1 skipped**, run in 13 chunks                |
  | `pnpm -F docs generate`            | 209/210 documented, **0 documented props core lacks**, 623 examples     |

  **4,728 passing, 1 skipped** — up from 17c's 4,430, and the client figure is reconciled rather
  than summed: 13 chunks, all exit 0, **156 files counted back against 156 on disk**. That
  reconciliation is the point, per the rule 17c paid for — a tally assembled from per-chunk logs is
  only as complete as the loop that wrote them, and nothing in the summing notices a missing chunk.
  The lone skip is still `popover.svelte.test.ts`'s host-`Dialog` Escape fall-through.

  **The skip list is 0 and the undeclared-prop count is 0**, both having started this batch at 3 and
  14 respectively.

  - **THE CLASS ORACLE IS GREEN — 1,528 style keys, 615 inline call sites, 0 skips, 0 mismatches**,
    from 124 mismatches and 3 skips at the pin bump. Read what that does and does not claim: it
    covers every _static_ style and **no function style at all** (54+ across the tree, now including
    MetadataList's new grid template and `rtlStyles.centerInline`), and the pooled marker module
    `useContainerReveal` introduces is **unmeasured** — `marker` holds one name per case while the
    pool declares six, so slot 0 verifies and the other five are inference. Closing that needs the
    script to take a list of marker names.

  - **A third instance of a suite header asserting a count its own file contradicts.**
    `markdown.svelte.test.ts` claimed 55/55 while upstream had 56 — the missing case covered
    behaviour the component already implemented, so nothing was broken and nothing reported it. Now
    62/62 against 0.3.0. `context-menu.svelte.test.ts` was the other: it explained a 2-case DROP as
    blocked on the deferred DropdownMenu selectable trio, **which landed in batch 17b**. Both
    rewritten to `date-input.svelte.test.ts`'s shape — upstream total, local total, and why they
    differ — which is the only form that does not rot on an upstream release.

### The five riskiest — now split by whether the docs site needs them

Three of the five turned out to be on the docs path, which is why they are scheduled above as
batches 10, 11 and 13 rather than left as an undifferentiated "hard pile". The other two are not
needed by the site at all and sit last.

**On the docs path** (scheduled above):

- [x] **`TopNav` + `SideNav` + `AppShell` + `MobileNav`** (6,919 combined) — **batch 10, done.** The
      4-way cycle never needed splitting: the render-mode contexts are the seams, so each component
      compiles against the others' contexts rather than their implementations
- [x] **`Markdown`** (3,717 LOC) — **batch 11, done.** Hand-written parser, custom `citation` AST
      node, streaming-safe incremental re-render. The risk turned out not to be the parser — that is
      pure and transcribes verbatim — but the _renderer_: upstream threads a mutable cursor through
      its render pass to drive the streaming fade, and Svelte has no such pass
- [~] **`Table`** (9,047 LOC) — **the core landed with batch 11** (~3,200 LOC: `Table`, `BaseTable`,
  the six compositional sub-components, the context, the plugin pipeline, `columnUtils`,
  `tableContextMenu`). The **eleven plugin dirs** (6,438 LOC — the plan said ten and ~4,800) landed in batch 13; no Svelte
  idiom, and TanStack stays rejected (only 910 of ~4,846 plugin LOC is replaceable state)

**Not on the docs path** — schedule deliberately, after launch:

- [ ] **`Chat`** (7,336 LOC, 25 files) — only `createPortal` user; contenteditable composer, SpeechRecognition, IntersectionObserver scroll anchoring. **The last unported component dir.**
- [x] **`PowerSearch`** — **batch 14, done.** Booked at 4,611 LOC; **4,187** excluding tests and
      `.doc.mjs`. The "type-dispatches into 15 components" description was wrong on all three
      numbers: **14 `OperatorValue.type` arms, 12 editors, 7 distinct astryx components**. It was
      also the only one of the five whose dependency list was _entirely_ satisfied before it
      started — which is why the last of the riskiest turned out not to be the hardest

### Pre-flight — read this before starting a batch

Every item here is a mistake this port actually made and paid for in rework. The pattern is always
the same: a plan was trusted where the source should have been read, or a cost was estimated from
one dimension when it had several. Ten minutes of these checks is cheaper than any of the reworks
below.

- [ ] **Cost the whole import list, not the component directory.** `CodeBlock` was booked at 2,083
      LOC; it also needed `theme/syntax/` (~710 LOC, `defineSyntaxTheme` + provider + 12 presets),
      because its `syntaxTheme` prop and `highlight-styles.ts`'s `:root` block both require it. The
      batch plan listed its dependencies as satisfied. Read what a component _imports_, then what
      those import, before writing a number down.
- [ ] **Verify `research/01`'s description against upstream source.** It is research, not spec, and
      it has been wrong three times. `Lightbox` was described as a Popover-API overlay with a focus
      trap and autoplay timing — all three wrong (it is a native `<dialog>`, browser-owned focus, no
      autoplay). `TabList` was said to need the `OverflowList` items+snippet precedent; it never
      slices its children. Correct the planning file in the same commit, as those two did.
- [ ] **Check the published dist against the source before wiring the oracle.** The tarball lags:
      `Icon`'s px→rem, `Collapsible`'s `isDisabled` and `content` typography, `DropdownMenu`'s
      selectable trio. Follow the source and record a **self-retiring skip**; do not port a slice the
      dist cannot verify at all (that is why the selectable trio is deferred rather than written).
- [ ] **Decide the responsive and SSR story up front.** Both have been retrofitted and both cost a
      rework. The demo route grew to 66 stacked sections with no navigation and had to be rebuilt as
      a two-column shell with scroll-spy; `Timestamp`'s SSR warning still sits in the wrong shape
      (an `$effect`, so client-only) where `Field` got it right at init time. Decide the breakpoint
      behaviour and what the server renders _before_ writing markup, not after it looks wrong.
- [ ] **Name the consumers, and remember the docs site is one now.** A component that stops
      exporting its props interface loses its documented types silently — the docs generator reads
      the props table out of `dist/**/*.d.ts`. A component whose props are a discriminated union
      needs every arm checked (`Slider`'s `minStepsBetweenThumbs` lives on the range arm alone and
      read as undeclared until the generator walked union constituents).
- [ ] **Check whether the entry is a hook before designing its page or its props.** `params != null`
      is upstream's discriminator, and a hook's surface is its signature, not a props table.
      `useResizable` is described by _both_ its own `.doc.mjs` (params) and a `components[]` member
      in `Resizable.doc.mjs` (props); anything merging them has to let the hook branch win.
- [ ] **Run the four audit agents at batch close** — `astryx-parity`, `astryx-idiom`,
      `astryx-test-parity`, `astryx-surface`. The idiom audit alone caught the `ToggleButton`
      pressed-target race, `Toast`'s un-`untrack`ed viewport mutators and three of the four
      beyond-upstream test files. Do not offer; just run them.

---

### Blocking design decisions (`research/01` §6.11)

Settled: `xstyle` (public prop on every `BaseProps` component, threaded as the final `sx()`
arg — not appended via `cx` — so StyleX atomic dedup makes an override _replace_);
`createOptimistic` (one object with a `run`; reverts on in-flight count reaching zero, not
on reject; overlapping actions interrupt); `value = $bindable()` (two-way write confined to
the plain-edit path so the optimistic spinner still shows); `cloneElement` (moot — Tooltip
attaches to a `display:contents` wrapper's `firstElementChild`).

Still open:

- [ ] **`string | Snippet` slots + empty-slot detection.** Leaf slots settled (`typeof === 'function'` discriminates a snippet); empty-slot detection ("did the caller pass something that renders nothing?") is the hard half still open. Bites in `Tooltip`/`HoverCard` — see Known debts
- [x] **`Children.toArray` rendered _twice_** — **settled by `OverflowList`** in favour of candidate (a): `items: T[]` + `item: Snippet<[T, number]>`. A snippet renders twice but can't be _sliced_, so the data is sliced instead — which keeps the single hidden measurement container (candidate (b) would have given it up) and matches the shape `useOverflow`'s docstring already anticipated. The API divergence is recorded under Known debts. Precedent to reuse for `Toolbar`/`Breadcrumbs`/`TabList` when they land
- [ ] The Table plugin contract

---

## Phase 3 — Themes

Done: theme compiler (`defineTheme`, `parseStyleKey`, expanders, `generateThemeCss`,
`generateOnMediaCss`); **neutral** (196/196); both oracles wired into CI
(build→check→lint→test); `onMediaTokens` / `[data-astryx-media]` + `MediaTheme`.

- [x] **Prose defaults** — **landed 2026-08-03**, closing the whole 196-vs-331 gap. All 135
      declarations (`h1`–`h6`, `p`, `small`, `code`/`pre` sizing, the `.astryx-text`/`.astryx-heading`
      classes and their `--text-*` vars, plus the semantic type scale) are emitted by the _theme_
      build: `generate-theme-rules.ts` writes an `@layer reset` block and an `@layer astryx-theme`
      block from one call, where upstream's `generateThemeRulesSplit` returns the two halves
      separately. See [Theme parity](#theme-parity-196--328-of-upstreams-331-declarations-2026-08-03)
- [ ] **Icon registry** — every shipped theme's `icons:` field is dropped, not just neutral's. All
      **seven** upstream packages ship an `icons.tsx` mapping **28** semantic names to
      `lucide-react` components (matcha and y2k are 71 lines rather than 81 only because they lack
      the header docblock; chocolate, gothic and stone carry an upstream copy-paste bug whose header
      says "for the neutral theme"), and the Svelte counterpart uses `@lucide/svelte`
      (`lucide-svelte` is deprecated), carried at `^1.25.0` — a **caret, matching upstream's
      `lucide-react: ^1.18.0`**. The exact-pin convention in these packages exists for the upstream
      `@astryxdesign/*` devDependencies the oracles diff against; a runtime dep no oracle reads does
      not carry that hazard. **Now gates the first release** (2026-08-07) — upstream publishes a
      `<name>IconRegistry` from every theme package and we publish none.

  - **This entry was wrong twice, and both errors are instructive.** It said 26 icons; it is 28
    (`matcha-theme.ts` also said 26, `research/07` says 25 — three sources, three numbers, none
    checked against core's own `IconName` union). And it recorded the shape as
    `Partial<IconRegistry>` of snippets → `registerIcons`, which is **actively wrong**:
    `registerIcons()` warns-once telling the caller to prefer `defineTheme({icons})`, so the
    documented path would have fired our own warning, and it is a document-wide write that breaks
    the nested-`<Theme>` scoping 0.3.0 added
  - **The real blocker was never the shape** — `build-theme-package.mjs` serialises the theme with
    `JSON.stringify`, which drops a function-valued property **silently**. Snippets are functions,
    so `icons` could not have survived that path however it was authored. Settled design: a
    `src/icons.svelte` of snippets, passed to the build **by name**, substituted into the emitted
    literal via a placeholder the build asserts appears exactly once, and **copied** into `dist/`
    rather than compiled (`svelte-package` leaves `.svelte` essentially as authored, and its two
    real transforms have nothing to act on here) — so no theme package needs new build tooling.
    One shape divergence, documented in-file: upstream writes `icons:` inside `defineTheme()` in
    the theme source, which we cannot, because that source is imported by the build under plain
    Node where a `.svelte` import will not parse. The published surface is identical
  - It stayed deferred a long time on grounds that were true and are now spent: `Icon` ships
    built-in fallbacks so nothing looked broken, and it contributes nothing to `theme.css`, so
    **no oracle was ever going to report it** — which is precisely why it survived this long. See
    the `icon-registry-signal` entry under Known debts for the reactivity hazard already fixed
    ahead of this landing
  - `liquid-glass` gets one too, by decision rather than by parity: it has no upstream
    counterpart, and since all seven upstream registries are byte-identical the registry carries
    zero per-theme design content, so copying it follows the convention instead of inventing a
    variant. Without it, liquid-glass would be the only theme falling back to core's placeholder
    SVGs — a visible inconsistency in the docs theme switcher with nothing to justify it

- [x] **The four reel themes — `matcha`, `butter`, `gothic`, `y2k`** — **landed 2026-08-03 as batch 11.** ~2,440 lines of upstream theme source, each with its own package, build script and
      bidirectional oracle, all four at **0 mismatches** on the numbers in the Status table. Three
      things are worth carrying forward:
  - **Four real gaps in the theme compiler, every one of them found by an oracle rather than by
    review, and every one invisible to `neutral`.** They are the argument for porting a _second_
    instance of anything before believing the first proved the machinery:
    - **Multi-word font families were never quoted.** `buildFontFamily` quotes a family containing
      a space, because `DM Sans` is two identifiers to a CSS parser and only `"DM Sans"` names the
      font. Neutral names `Figtree` and `ui-monospace` — both single identifiers — so the bug could
      not show. Three declarations in matcha alone.
    - **The `derivedVarRegistry` did not exist.** This port had approximated it with a one-entry
      `CONTAINER_PROPERTIES = new Set(['padding'])`, which is exactly the surface neutral uses.
      Upstream maps eleven components' `borderRadius`/`padding` onto the internal custom properties
      the components actually read (`--_button-radius`, `--_card-radius`, …), **additively** —
      `card: {borderRadius}` emits both `border-radius` _and_ `--_card-radius`. Ported in full as
      `theme/derived-var-registry.ts`, along with upstream's real padding shorthand/longhand parser
      and its all-sides-equal collapse, which the one-value approximation had stood in for.
    - **`deepMergeComponents` was one level too shallow.** A theme writing
      `text: {'type:display-1': {fontFamily}}` — butter, gothic and y2k all do, to put a display
      face on the largest three sizes — _replaced_ the generated style key instead of merging into
      it, silently dropping its `fontSize` and `lineHeight` bindings. Six missing declarations per
      theme, and a display heading that fell back to the component's compiled default size. Neutral
      has no `components` key that collides with a generated one.
    - **The radius expander was needed after all.** `define-theme.ts` recorded it as omitted
      "because no shipped theme uses them"; y2k's `radius: {base: 4, multiplier: 0}` is how it gets
      its brutalist square corners. It pins every named radius token explicitly, so the single
      declaration the expander contributes there is `--radius-chat` — which is precisely what the
      oracle reported missing. **A deferral justified by "no shipped theme uses it" expires the
      moment another theme ships.**
  - **The five packages now share one build script and one oracle** (`packages/themes/shared/`,
    deliberately not a workspace package — no `package.json`, so pnpm's `packages/themes/*` glob
    skips it). Neutral was migrated onto them and its numbers are unchanged. Five copies of a
    240-line script pair would have had to be fixed five times each of the four times above.
  - **The upstream packages are pinned `0.1.7` exact, not `^0.1.7`.** They are the oracles' ground
    truth, and the caret resolved straight to **0.1.9** on first install while neutral sat at 0.1.7
    by lockfile luck — the port would have been diffing against a version whose source is not the
    one in `reference/astryx-upstream`. Neutral's pin was corrected with them and moved out of
    `packages/core` (which never imported it) into its own package. The oracle now resolves upstream
    through that package's own `node_modules` symlink rather than scanning pnpm's store, because the
    store keeps orphaned versions and a prefix scan can match the wrong one
- [ ] Remaining 2 themes: `chocolate` (226 lines) and `stone` (652 lines, the largest of the seven —
      `neutral` is 637). **These now gate the first release** (2026-08-07): the release is cut at
      core + themes parity, so 5/7 is no longer good enough. Was "not a launch blocker" while the
      goal was the docs site, and neither is in the hero reel's curated list. The theme _switcher_
      lands with them. Mirror a sibling rather than re-deriving: `butter`/`gothic` for the
      `*Palettes` export both of these have, `neutral` for `stone`'s overall size and shape
- [x] **`Theme` component + root `color-scheme` sync** — **landed in batch 8**, together with
      `useTheme`, `theme/tokens.ts`, `theme/types.ts`'s `ThemeMode`, and the theme package's
      previously-missing `dist/index.js`. See the batch-8 entry in Phase 2
- [x] **The installed themes' typefaces reach the docs site** — `docs/src/app.html` loads them from
      Google Fonts with preconnects, which is what upstream's own docsite does. It was Figtree alone
      until the theme batch; it is now **11 of upstream's 14 families**, transcribed from upstream's single
      combined URL with each family's axis spec kept as upstream writes it. The three-family
      difference is not a cut: Albert Sans, Fraunces, Montserrat and PT Serif belong to `chocolate`,
      `stone` and the playground theme editor, so requesting them would download faces nothing on
      the site can select. **Self-hosting from the theme packages is still open** and is the harder
      half: it means shipping the woff2 files in each package and declaring the `@font-face` rules
      there, so a consumer who installs a theme gets its font without a third-party request. The
      docs site is unblocked either way; a library consumer is not
- [ ] Decide the `@scope` floor (Baseline only since 2025-12-12) — fall back to descendant selectors, or require it?

Deferred without loss (no shipped theme needs it): **this list is now empty.** All three items came
off it, and **not one left on the terms the list set.** The radius expander went when y2k landed.
HCT-generative **`color` went in batch 18**, for a reason the list did not anticipate: not a shipped
theme needing it, but a _surface_ audit noticing `theme/index.ts` was missing `expandColorScale`
entirely — a gap predating v0.2.0 that also required two absent dependency modules (`hct.ts`,
`contrast.ts`) and carried 63 upstream test cases. `defineTheme`'s header called it "omitted **for
now**", which is a deferral with a to-do attached, not a decision.

**`extends` went last, and it is the one that should have gone first.** The deferral held that a
consumer would at worst hit a silently ignored key. That was wrong on the facts: the CLI's shipped
`assets/docs/theme.doc.mjs` had been documenting `extends` the whole time, upstream's prose and
worked example carried over verbatim. The published surface was promising it while `defineTheme`
dropped it on the floor.

So the standing lesson is now earned three times over, and it is sharper than the version this
paragraph used to carry: **"no shipped theme uses it" is a claim about this repo's themes and
nothing else.** It is not a claim about the published type, the generated docs, or what a consumer
will reach for — and when the docs pipeline reads from a different source than the implementation,
the two can disagree indefinitely without any gate noticing.

---

## Phase 4 — CLI

Landed in full — see [`port/ledger/023-cli-phase-4.md`](./ledger/023-cli-phase-4.md).

## Phase 5 — Docs site (the current goal)

Per `research/04`: **278 pages**, no MDX. Content comes from executable `.doc.mjs` modules,
specified by `docs-types.ts`.

The dated, fully-landed sections of this phase moved to
[`port/ledger/024-docs-site.md`](./ledger/024-docs-site.md). What remains below is open or
undated tracking.

### The v1 cut

Scoped 2026-08-02 to _launchable_, not complete. In: the shell, the `/components` gallery and
detail pages, and the `/docs/*` reference topics. Out: `/templates` (42), `/blog`, `/playground`,
`/themes`, `/changelog`, `/mcp`.

`/docs/core` and `/docs/cli` are out too, and for a specific reason rather than by preference —
they render package READMEs through the `<Markdown>` component. Everything else in the cut is
`ContentBlock[]` data, which needs no markdown engine at all. **`Markdown` has since landed
(batch 11)**, so the three README-rendered pages are unblocked; what they still need is docs-site
work rather than component work, itemised under [After launch](#after-launch).

### Next batch — ~~the theme packages~~, then the bento tiles the landing page is missing

Decided 2026-08-03, straight after the landing page landed. This is the work that closes every
deferral above, in the order the dependencies force. **The theme packages have since landed**, so
what is left here is the two bento tiles and `BlogShowcase` — and both tiles are now waiting on page
templates rather than on themes:

- [x] **Port the four reel theme packages** — **DONE 2026-08-03**; see
      [Phase 3](#phase-3--themes) for the four compiler gaps the oracles found and the shared
      tooling the five packages now share. The estimate (~2,450 lines) held at ~2,440. Two of the
      three things it was expected to unblock have landed — the hero reel is upstream's five slides
      and `HeroReelDots` renders — and the third, the Themes bento tile, is now blocked only on the
      first page template
- [ ] **`ThemesPreview`, the Themes bento tile** — needed Butter _and_ `ThemeShowcaseStore`, which
      is a page template out of `packages/cli/templates/pages/theme-showcase/`. **Butter has
      landed**, so this is now blocked on the first page template alone. The tile is a scaled-down live store (rendered at
      1000px and `transform: scale`d into a container-query-sized window, cropped at a fixed
      aspect ratio) beside a rail of theme swatches and a script "Aa"
- [ ] **`TemplatesPreview`, the Templates bento tile** — needs `TemplateThumbnail` and seven of the
      42 page templates (`product-gallery`, `ide`, `payment-form`, `login-split`, `settings-sidebar`,
      `ai-chat-landing`, `product-detail`), each rendered live at 1100px and scaled to a 16/11.5 tile
- [ ] **Restore the bento to upstream's three columns** once both tiles exist: col 1 heading +
      Themes, col 2 Components + CLI, col 3 Templates (tall). The rebalance recorded above is
      explicitly temporary and reverts here
- [ ] **`BlogShowcase`** — the remaining landing section, on `blogRegistry` +
      `BlogCard`/`BlogFeatureCard`. Lower priority than the tiles: it needs post content, not just
      components

One divergence that is a decision rather than a gap:

- [ ] **`AboutShowcase`'s heading block is not upstream's copy.** "Astryx powers over 13,000 apps" /
      "grown inside Meta over the last eight years" is Meta's institutional claim, and this port is
      unofficial — the same call `site-footer.svelte` already made for Meta's social and legal
      blocks. The three columns are transcribed verbatim; two of their CTAs are repointed from
      `/community` and `/changelog` to the repository and its releases

### After launch

- [x] **The shell is fully dogfooded** — palette and outline in batch 9, then frame, header and
      sidebar in batch 10. `+layout.svelte` is an `AppShell`, `shell/top-nav.svelte` a `TopNav` and
      `shell/side-nav.svelte` a `SideNav`; `shell/docs-shell.svelte` is now a pass-through because
      `AppShell` owns the two-column grid, the sticky panel and the divider it used to hand-roll.
      The footer stays hand-built and stays inside `children`: it is a `Section`/`Grid` composition
      already, and `Layout`'s `footer` slot would pin it rather than let it scroll away
- [ ] `/docs/core`, `/docs/cli`, `/changelog` — **no longer blocked on a component**: `Markdown`
      landed in batch 11 and `parseOutlineFromMarkdown` with it, which is the pair upstream's
      `PackageStubPage` is built from. What is left is docs-site plumbing, and it is worth naming so
      the next pass does not rediscover it: (1) the generator emits no **package registry** — it
      reads one `{name, version}` pair for the component-page caption and no README or CHANGELOG
      text at all, where upstream's `packageRegistry` carries both; (2) `PackageStubPage` itself is
      unported — the README-stripping rules (`stripIntro`, `stripSections`), the `PackageActions`
      install block, and the heading-id assignment that makes the outline anchors resolve; (3) the
      route needs a package branch, which `docs/[topic]/+page.ts` currently 404s instead
- [x] **`/templates` (42) — landed 2026-08-10.** All **43** of upstream's page templates are
      transcribed to `packages/cli/assets/templates/pages/<slug>/+page.svelte` + `template.doc.mjs`,
      so the CLI ships and scaffolds them (`_adapter.mjs`'s discovery had been written and guarded
      by `existsSync` since the CLI slice, and needed no change). The docs registry is upstream's
      **42**, not 43: `generate-data.mjs:1118` skips `doc.scaffold`, which drops `blank` from the
      gallery while leaving it scaffoldable. **31** are gallery-visible after
      `isReady && !isHiddenFromOverview`, and the gallery is one flat `Grid` ordered by group —
      upstream renders no group headings, so neither do we. Three self-retiring test fixtures
      expired the same day and are restored to upstream's shape; see Known debts for the rest
- [ ] `/blog` (5, mdsvex) · `/themes` browser
- [ ] **`/playground`** — `svelte/compiler` in a Web Worker + CodeMirror 6. Deliberately last:
      `research/04` §6.3 is right that this is a different problem in Svelte than upstream's
      `ts.transpileModule`, and mechanisms A + B cover nearly all the per-component docs value
      without it
- [ ] `/mcp` — `@modelcontextprotocol/sdk` in a `+server.ts`, over the same registries

### Docs-site integration facts

Non-obvious things established by building it. Each would otherwise be rediscovered the hard way.

- **The generator's output depended on `readdirSync` order, and therefore on the OS** (found
  2026-08-10, on the first CI run that ever reached the docs test step). Four emitted docs —
  `HStack`, `VStack`, `StackItem`, `VisuallyHidden` — differed between Windows and Ubuntu in exactly
  one position: where `'map'` sits inside the `as` prop's 120-member union of HTML tag names. That is
  TypeScript's union member order, which follows the order the checker reached the declarations,
  which followed filesystem order. **Reversing the declaration walk makes 35 docs stale**, so the
  four are the subset where two platforms happened to disagree rather than the size of the exposure.
  All three walks (`collectDeclarations`, `findDocModules`, `findEmitted`) now sort by name, with a
  code-unit comparison rather than `localeCompare`, which is locale-dependent — the same class of
  problem one layer up. Generated-and-committed output has to be a function of the tree alone
- **Consumers must run the StyleX compiler.** Covered above. The two settings that are easy to miss
  are `optimizeDeps.exclude` and `ssr.noExternal`; both fail _silently_ (unstyled output, no error)
- **Token names are literal, not hashed.** `tokens.stylex.ts` keys start with `--`, so StyleX emits
  `--color-accent` rather than a content hash, and the theme CSS is decoupled from StyleX's hashing
  entirely. It is also the only `defineVars` declaration site in the library, so nothing about the
  compiled output depends on `rootDir`. This is what makes the theme package framework-agnostic
- **Content lives in the published tarballs.** `@astryxdesign/core@0.1.7` ships 198 `.doc.mjs`;
  `@astryxdesign/cli@0.1.7` ships 19 reference topics, 588 example blocks and 86 template files.
  Nothing in the pipeline needs `reference/astryx-upstream/`. Both are pinned **exact**, not
  caret — they are content, and a floating minor would silently change documented props
- **`.doc.mjs` shapes are not uniform**, and mis-flattening them drops prose without erroring.
  42 docs carry `components[]`; 11 of those have a self-named member that inherits the parent's
  `usage`/`theming` (`Tooltip`), and 27 also declare top-level `props` (`Breadcrumbs`). A
  sub-component extracted to its own sibling file is _also_ listed in its parent, so entries must
  be merged by name. Getting this wrong cost 20 entries and every Overview page's prose on the
  first pass
- **`@astryxdesign/cli` is now a docs devDependency**, alongside the existing `@astryxdesign/core`.
  The standing rule extends to it: never install `--prod`, never prune devDependencies — the two
  oracles _and_ the docs content pipeline all read these packages

---

## Phase 6 — the packages beyond `core`

Never started, and deliberately so: this port's scope has always been the **core subset**. Recorded
here because "components pending" is otherwise ambiguous — `packages/core` itself is **complete at
101 / 101 upstream component dirs**, so everything below is a _new package_, not a missing
component.

### `lab` — 17 components, 180 files, ~995 KB

`BottomSheet`, `Chart`, `Chat`, `ChatReasoning`, `CircularProgress`, `CodeEditor`, `Drawer`,
`InfoTip`, `LogStream`, `Radial`, `RichTextEditor`, `SVGIcon`, `Sankey`, `Schedule`, `Stat`,
`Stepper`, `ThreeD`. Would ship as `@astryx-svelte/lab`.

**Settle the dependency question before scoping the port.** Four of the seventeen — `CodeEditor`,
`RichTextEditor`, `ThreeD`, `Sankey` — wrap heavy third-party React libraries with no drop-in Svelte
equivalent. **The parity rule cannot arbitrate this**: there is no upstream Svelte answer to copy, so
picking a substitute is genuine design work and the first place in this port where "if it's not in
Astryx, it's not here" gives no guidance. Expect the same shape of decision the icon registry needed
(`lucide-react` → `@lucide/svelte`, because `lucide-svelte` is deprecated), but harder, because a
code editor and a rich-text editor are not one-to-one the way an icon set is.

Note `lab` has its own `Chat` and `Chart` — distinct from core's `Chat` family, which is already
ported. Do not conflate them.

### The small ones

| package    | files | note                                         |
| ---------- | ----: | -------------------------------------------- |
| `charts`   |    35 | one `src/` dir (`marks`); pairs with `vega`  |
| `build`    |     7 | build tooling, not a consumer-facing package |
| `vega`     |     5 |                                              |
| `richtext` |     1 |                                              |

None of these gate anything. `build` may not warrant a port at all — check whether its job is already
done by this repo's own theme build scripts before treating it as a gap.

---

## Cross-cutting

### Testing

Done: `vitest-browser-svelte` bumped to v3. Pattern for hook tests (no `renderHook` in
Svelte): a _probe_ fixture runs the hooks and renders their result (handler-returning hooks
expose them via instance `export const`, reached through `render(...).component`); a
_provider_ fixture sets context. Fixtures live in `src/tests/`, outside `src/lib`.

#### The measured gap against upstream’s suites — **434 cases** (audited 2026-08-08, 65 closed since)

Upstream v0.3.0 ships **233** test files under `packages/core/src`; we have 193. Classifying every
upstream file with no counterpart here gives **72 unmatched**, and:

| bucket                                           |  files | missing cases |
| ------------------------------------------------ | -----: | ------------: |
| COVERED — cases live in a differently-named file |     25 |             — |
| PARTIAL                                          |     12 |           176 |
| ABSENT                                           |     28 |           323 |
| N/A — no meaningful counterpart                  |      7 |             — |
| **total** (audited)                              | **72** |       **499** |

By kind: **305 component/hook**, 178 theme+util modules (`defineTheme` 63, `generateThemeRules` 30,
`expandTypeScale` 24, `tokens` 20, `themeProps` 10, the rest smaller), 16 perf benchmarks. The 7 N/A
are four suites reading `.doc.mjs` (which this port has no counterpart for), upstream's build-tooling
babel plugin, and `mergeProps`/`composeEventHandlers` — both recorded as deliberately unported at
`utils/index.ts:10`, "Svelte obviates each".

**Why this went unmeasured for so long, and the rule that comes out of it.** Every test-parity pass
before this one compared _our_ suites against upstream's — auditing headers and case counts of files
that exist here. That method cannot see an upstream suite with **no counterpart file at all**: there
is no header to be wrong. The blindness had a cost: upstream's `ChatComposer.test.tsx` was unported,
and the registration contract it covers was implemented wrongly here — found by accident during an
unrelated fix, not by any audit. So: **audit in the direction of upstream's file list, not ours.**

Two measurement traps this audit walked into, both worth remembering:

- **A filename diff said 100, not 72.** This port normalises the `use` prefix in _both_ directions —
  upstream `useToast.test.tsx` is our `use-toast.svelte.test.ts`, but upstream `useFocusTrap.test.tsx`
  is our `focus-trap.svelte.test.ts`. 28 files were "missing" only under a one-directional match.
  `useFocusTrap` was reported as having no coverage anywhere on exactly this mistake; it is fully
  covered.
- **Grepping the component name proves nothing.** `badge` matches every suite that merely renders a
  Badge. Coverage has to be established by comparing case _titles_.

Being closed before the first release (the four where a silent bug is most likely, ~67 cases):
`SizeContext` (27 — a context cascade with nine consumers, the context-vs-getter hazard),
`useInputStatusIcon` (27 — a WCAG 1.3.1 dangling-`aria-describedby` matrix that fails with no visual
symptom), `useInputContainer` (6 — click-vs-focus dispatch, structurally the ChatComposer shape where
a `focus()` fallback masks a missing `click()` branch), and 7 parked `edgeCompensation` cases whose
exclusion reads "components that do not exist yet" — all four now exist.

The rest ship as a documented limitation. **The triage read implementations only for the top-risk
suites**; the other 24 ABSENT files were classified by coverage alone, so there may be further live
bugs among them. Full table:
`scratchpad/agent-triage/triage.md` (session-local; regenerate rather than trust it later).

### The client full-run flake (measured 2026-08-05; re-measured 2026-08-07 and 2026-08-10)

**2026-08-10 — it is not a Windows problem, and chunking is now the committed entry point.** The
first CI run that ever reached the test step (browsers were never installed on the runner; see the
release notes above) died on Ubuntu in the same shape: **82 files in**, then
`TypeError: Cannot read properties of undefined (reading 'wrapDynamicImport')` — Vite's module
runner, not an assertion — with `table-tree-state` as the innocent victim. Five months of local
measurement had left open whether this was one machine's problem. It is not.

So `packages/core/scripts/run-client-tests.mjs` replaces the scratchpad loop this section used to
point at, and `pnpm -F @astryx-svelte/core test` runs it: server project unchunked, client project
in batches of 20 (`CLIENT_CHUNK_SIZE` overrides), then the class oracle. **State the cost rather
than calling it a fix**: cross-file leakage across a chunk boundary is no longer exercised, and each
boundary pays ~15 s of browser and Vite start-up. What it buys is a gate that can pass at all — the
release workflow re-runs `pnpm -r test`, so an unchunked client project meant a tag that could never
publish.

Two implementation notes worth keeping. The runner **streams and captures** each chunk, because a
captured 25-minute step with no output is indistinguishable from a hung one in a CI log. And its
counts come from the printed summary, not `--reporter=json`: measured on a two-file chunk, the JSON
report filed all 42 cases under a **single** `testResults` entry naming one of the two files, so
`testResults.length` is not a file count and the reconciliation — the whole reason the script exists
— would have compared 1 against 2 and failed a passing run.

**2026-08-07 update — the flake now has a _second_ shape, and the distinction matters.** Three full
runs at batch 17b's close: run 1 aborted the old way (`Browser connection was closed`, at
`chat-scroll`, **83 of 143 files, 0 test failures**); run 2 completed all 143 with **one assertion
failure** — `dropdown-menu-sub-menu`'s "roves to the first item once a loading flyout resolves" got
`Folder B` where it expected `Folder A`, i.e. roving focus had advanced one item further than the
case waited for. It passes alone and with its whole family (menu ×4, 121 cases), so it is a
**timing** flake under full-run load rather than the tester page dying.

Runs 3–5 aborted the old way again (**114**, **117** and **106 of 143 files, 0 test failures**;
victims `chat-scroll` and `use-table-column-settings`, the latter already on the recorded list). So
**five consecutive full runs, none complete** — markedly worse than the 2-in-5 measured on
2026-08-05, on a session that had been driving Chromium hard all day, which is itself a data point.

**The chunked path is what produced the batch's actual number**, and it is worth keeping rather than
treating as a workaround: 143 files in twelve chunks of twelve, **3,510 passed / 0 failed / 1
skipped**, every chunk green. A chunk boundary costs a fresh browser, which is exactly what the drop
consumes. `scratchpad/run-client-chunked.sh` (not committed — it is four lines of `ls` and a loop)
prints a per-chunk tally and a total.

**That timing failure was a real, fixable defect, and it is fixed** — which is the useful part,
because it is the first of these to be diagnosed rather than absorbed. It is also a different animal
from the connection drop: the drop makes an innocent file the victim and says nothing about that
file, while a timing failure names a case that is genuinely racing something.

The cause was in the **fixture**, not the case. `dropdown-menu-sub-menu.svelte`'s async scenario
flipped `loaded` from a `setTimeout(…, 10)`, and it has to land _after_ the
`requestAnimationFrame` on which `DropdownMenuSubMenu.open()` runs `focusFirst()` — that item-less
moment is the whole state the case exercises. A 10ms timer only _usually_ wins that race: under
full-run load the frame arrives later, `Folder A` already exists when `focusFirst()` runs, focus
lands on it, and the case's ArrowDown advances to `Folder B`. The fixture now defers through a
**nested rAF**, which runs in the next frame by definition and is therefore ordered after the
submenu's. The fixture's own comment already claimed that ordering; it is now guaranteed rather than
probable.

**Two things this cost, both worth generalising.** A wrong fix was tried first — tightening the
_test's_ wait to "the flyout container holds focus", which fails because the element taking the
fallback focus is not the one the suite's `flyoutFor` helper returns; **when a case races, look at
what the fixture schedules before rewriting what the case waits for**. And a repro appeared only when
the file ran _alongside others_ (3 files was enough, alone was not), which is the cheap loop worth
reaching for before assuming a failure needs a full run to reproduce.

**Do not read a run's exit code alone.** Run 1's exit 1 carried zero failures; run 2's carried one
real assertion. The number that matters is the failed-test count and which file it names.

Five consecutive full `--project=client` runs on one machine, nothing else competing for it:
**2 passed, 3 failed.** The passing runs are complete — **137 files, 3,289 passed, 1 skipped, exit
0**, in ~120 s. So the flake is _intermittent, not deterministic_, and two claims previously written
into the batch-16 entry were wrong:

- **"On this machine a full run currently cannot be obtained."** It can; it succeeded twice out of
  five. The chunked helper is still the reliable path, but it is a convenience, not a necessity.
- **A leak or exhaustion was the standing suspect.** It is not memory. Sampling the vitest node
  process and every `chrome-headless-shell` every 3 s across a whole run, both sit **flat at ~1.0 GB
  and ~1.1 GB** from the first file to the last, on the failing runs as much as the passing ones.
  There is no growth curve to exhaust anything.

What the failures actually look like: `Browser connection was closed while running tests. Was the
page closed unexpectedly?` — the _tester page_ dies, not the test iframe, which is a different
failure from the old iframe-drop (that one is fixed; see the anchor-navigation guard in
`setup-stylex.ts`). The victim is a different innocent file every time and each passes alone. This
session added three more — `use-typeahead`, `use-table-column-settings`, `clickable-card` — to the
five already recorded, so **eight distinct files have now been the casualty**, which is what says the
file is the victim and not the cause.

**Root cause is not identified**, and this is recorded as an open question rather than a diagnosis.
Two leads worth trying first, both the same _class_ as the bug that turned out to explain the old
iframe-drop — an un-suppressed navigation whose async landing kills whichever file is running when
it lands:

- **`useClickableContainer` writes `window.location.href` directly** (`use-clickable-container.svelte.ts:185`,
  plus two `window.open` calls). No click guard can intercept a programmatic location write. Suggestive
  rather than proven, but `clickable-card` — one of only two suites touching that hook — was a victim.
- **The `<form>` fixtures have no submit guard.** Seven fixtures wrap components in a real `<form>`,
  and vitest's own error text names form submission as a cause. `setup-stylex.ts` guards anchor
  clicks and nothing else; implicit submission on Enter navigates and drops the query string the
  runner identifies the frame by.

Two smaller facts worth keeping: every run, **including the ones that pass**, logs `Tests closed
successfully but something prevents the main process from exiting`, so a leaked handle is real but is
evidently not what kills the run; and **vitest 4 has no `basic` reporter** — passing one is a startup
error that costs a whole run before you notice.

**The client project's Chromium is pinned to `en-US`** (`vite.config.ts`, the instance's
`context.locale`), and batch 12 is why. `plainDateFormat` and `Timestamp` both format through
`new Intl.DateTimeFormat(undefined, …)`, i.e. the _runtime default_ locale — which in Node/jsdom is
`en-US` (so upstream's literal `"January 15, 2026"` assertions are written for it) but in headless
Chromium is inherited from the host OS. On this machine that is **en-GB**, so every day-label
assertion read `"Sunday, 28 December 2025"` and matched nothing. Three of batch 12's suites hit it
independently and reached for two different workarounds — `calendar.svelte.test.ts` derives the
expected string from the component's own formatter (locale-agnostic, but then the assertion cannot
catch a formatter regression), while `date-input`/`date-time-input` stub `Intl.DateTimeFormat`'s
_default_ locale per file, restoring it in `afterAll`. Both were mutation-checked, and both stay:
the config pin is what makes the project deterministic across machines, and each file's own stub is
what keeps it correct when run in isolation under someone else's config. Worth remembering as a
class — **any assertion on `Intl` output is machine-dependent until the locale is pinned
somewhere**, and that includes `isLocaleDayFirst()` in `date-parser.ts`, which reads the same
default to choose DD/MM over MM/DD.

- [ ] Fold the two per-file `Intl` stubs into the config pin now that it exists, so there is one
      mechanism rather than three. Deliberately **not** done at batch close: both suites are green
      and mutation-checked as they stand, and the simplification is worth its own verification pass

**The one suite with no upstream counterpart** is `src/tests/layer-attribute-repair.svelte.test.ts`
(7 cases, added 2026-07-26), and none is _possible_: it pins two failures that exist only because of
how Svelte writes DOM attributes, which React cannot reproduce. `Tooltip`/`HoverCard` wire a trigger
they _found_ rather than rendered by mutating its inline `style` (the CSS `anchor-name`) and its
`aria-describedby` — and the caller's template owns both, so a `cssText` write or an attribute
rewrite silently destroys the wiring for good. That is the bar for adding coverage beyond upstream: a
hazard with no upstream analogue, which the ported suites structurally cannot catch. Both repairs
were mutation-checked — disabling them fails 5 of the 7, the 2 survivors being the baseline
"initial write" cases the broken version also got right.

**Batch 5 added three more** (10 cases), all found by the idiom audit and all meeting the same bar —
a Svelte-specific DOM failure React cannot reproduce, invisible to the ported suites. The third,
`src/tests/batch-5-server-markup.test.ts` (4 cases, node project against `svelte/server`), holds the
**server halves** of the two fixes below: Svelte compiles a separate server output, and both fixes
have a server side a client-project test structurally cannot reach — `NumberInput`'s server-only
`value` spread (attachments do not run during SSR) and `CodeBlock`'s `<pre>`, whose pre-hydration
paint uses the server markup.

- `src/tests/code-block-pre-whitespace.svelte.test.ts` (4 cases). JSX drops any whitespace run
  containing a newline; Svelte switches to **preserve-whitespace mode** on entering a `<pre>` and
  keeps it for the whole lexical subtree, so indenting the `<pre>`'s children the ordinary way emits
  the newlines and tabs as text under the inherited `white-space: pre`. Only two boxes show it —
  `headerTitle` (whitespace contiguous with the title, so the anonymous flex item is not
  whitespace-only) and `collapseInner` (a plain block box). The 13 ported cases reach the header
  through accessible-name computation, **which normalises whitespace**, so they pass either way. Fix
  is structural: the `<pre>`'s children are top-level snippets rendered with no literal whitespace.
  Three mutations checked; a fifth case asserting copy-button position was written and **removed**
  because it survived all of them (the root clips with `overflow: hidden`).
- ~~`src/tests/number-input-spread-value.svelte.test.ts` (2 cases)~~ — **RETIRED 2026-08-15 at the
  0.4.1 rewrite, and it is the one entry on this list that stopped earning its place.** The rule it
  pinned is still true: **an element carrying a spread loses Svelte's compare-against-the-DOM guard
  on `value`** — `set_value` has React's `if (node.value != value)` condition, but any spread routes
  every attribute through `set_attributes`, which compares against the previously _rendered_ string
  and then assigns unconditionally. What is gone is anything observable. The symptom was a
  `type="number"` field in `badInput` reporting `value === ''` while showing the raw text, so typing
  `1e5` ended as `5`; #4896's `type="text"` has no bad-input state. The intuitive replacement — a
  redundant write collapsing the caret to the end — was **measured in Chromium and does not happen**,
  because the HTML `value` setter moves the cursor only when the new value differs. With no case that
  can mutation-check the fix, the file failed this list's own bar and was deleted rather than left
  asserting a false rationale. The attachment stays; `src/tests/batch-5-server-markup.test.ts` is now
  the only thing pinning the server-only `value` spread it requires

**Batch 9 added a fifth** (2 cases): `src/tests/command-palette-snippet-empty-text.svelte.test.ts`.
It meets the same bar for a reason worth generalising — **the hazard lives in the translation
itself**. `emptySearchText`/`emptyBootstrapText` are `ReactNode` upstream and `string | Snippet`
here; every upstream call site passes a plain string, so the snippet arm has _no upstream case to
inherit_ and all 45 ported cases pass against the broken version. It also could not be caught by a
build: `snippet_without_render_tag` is a dev-only Svelte check, so the docs site prerendered 165
pages green with the bug present. **Wherever a `ReactNode` prop was split into `string | Snippet`,
the snippet half is untested by construction** — `Toast`'s `body`/`endContent`, `Lightbox`'s
`caption`, `List`'s `header`, `Banner`'s `title`/`description` and `ListItem`'s `label` are all in
that family and worth the same two-case treatment.

- [ ] Continue porting upstream `.test.tsx` suites alongside each component (case-for-case; the count is the contract)
- [ ] a11y parity checks on every `aria-*`, `role`, and live region
- [ ] SSR render with JS disabled, no hydration warnings

### Demo-route parity

The dev route (`packages/core/src/routes/+page.svelte`) is in scope for the parity rule:
show upstream's documented API and its own example content, not hand-drawn content.

**Batch 14 added two sections and closed the last deferral in this file.**
`power-search-demos.svelte` ports all **24** of `PowerSearch.stories.tsx`'s stories, and
`table-filtering-demos.svelte` ports all **11** of `TableFiltering.stories.tsx`'s — the one plugin
file batch 13 could not port, whose first cut had hand-transcribed PowerSearch's operator tables and
match engine and was deleted rather than kept. Both were verified in real Chromium rather than
typechecked. Two conventions recur and are settled:

- **`{...args}` has no counterpart on a demo route**, so each story renders the combination its
  `args` default to. This is the `TablePagination`/`Playground` ruling, now applied a second time
  and general: Storybook's `argTypes` panel is the knob surface, and hand-building one is invented
  content.
- **An override that upstream declares inside its stories file becomes a sibling `.svelte`.**
  `PowerSearchComponentOverride.Token`/`.Editor` are `Component<P>` _constructors_, not snippets, so
  `StatusToken` and `CustomIntegerEditor` cannot be inlined — the `LinkProvider/RouterLink`
  precedent applied to story helpers rather than to library code.

`PowerSearchWithTable.stories.tsx` (2 stories) is **not** ported; see Known debts.

**Revamped 2026-07-25** — the page had grown to 66 stacked sections with no way to find
anything. It is now a sticky top bar (theme + colour-scheme toggles) over a two-column
shell: a sticky sidebar indexing every section in seven role groups (Foundations,
Typography, Layout, Actions, Data display, Inputs, Overlays), a type-to-filter box with a
live match count, `IntersectionObserver` scroll-spy highlighting, and a permalink anchor on
every heading. Sections were **reordered to match the sidebar** and each carries an `id`;
their _content_ moved verbatim. Three Button sections were retitled for the nav only
(`Variants` → `Button variants`, and so on). Collapses to one column below 900px.

The 2026-07-22 sweep's remaining findings are now **all fixed**:

- [x] **Coverage gaps** — added `SpinnerWithLabel`/`SpinnerOnMedia`, `AspectRatioWithSkeleton`, `DividerFullBleed`, `Grid`'s `repeat: 'fit' | 'fill'` pair, `TooltipActionBarTooltips`, `ThumbnailShowcase`, `AvatarInitialsFallback`, `IconButtonActionBar` + `IconButtonTooltipIconButton`, `Overlay`'s `useOverlay` disconnected-hover story + `showOn="hover-or-focus"` + `position="top"`, and `MetadataList` `title`/`label` config + `MetadataListItem` `icon`
- [x] **Content/arrangement drift** — Timestamp rebuilt as upstream's three blocks (`system_*` rows now `type="code"`; relative and `auto` measure from `now` instead of a fixed date, so both branches actually show); `avatarSizes` walks the named ramp with the numeric size as its own example; `EmptyState` gains the `HStack gap={2}` actions wrapper and drops the stray `Icon color`; `IconButton` uses human labels, not registry icon names; `NavIcon` uses an `HStack`, not a page `div.row`; `Card padding={0}` in the Layout section is commented with upstream's reason; the theme-token swatches follow the theme's own colour groups; multi-column `MetadataList` regains its `Tags` and `Priority` rows
- [x] **`.demo-box`** — `EmptyState` now wraps in a real `<Card>`, as `EmptyStateContainer` does. The class survives only for the layout-primitive boxes and the ContextMenu right-click target, which is what it was for

**Batch 12 sections added** — `Calendar`, `DateInput`, `TimeInput`, `DateTimeInput` and
`DateRangeInput`, all five under _Inputs_ (Calendar's docs category is `Data Input`), inserted
between `fileinput` and `selector` in dependency order and indexed in the sidebar. **All 82 upstream
stories are accounted for** — 13 + 18 + 17 + 18 + 16 — and none was dropped for lack of a port.
Three things worth keeping:

- **No icon substitution was needed anywhere**, the first batch of which that is true. None of the
  82 stories passes an icon, so nothing hit the 26-name registry limit and nothing retires with it.
- **`AllVariations` is folded away in all five sections**, and `SizeVariants` flattens into its
  three tiles — every block in them re-shows a configuration already present under another label.
  Each fold is named in that section's trailing note, which is the existing `numberinput`
  convention.
- **`Calendar` tiles are captioned with `<h3>`**, because it has no `label` prop — the `outline`
  section's arrangement, for the same reason. And the `RTL` story is a bare `<div dir="rtl">`
  wrapper: the route needs no direction plumbing, because the chevron flip is a `:dir()` rule
  inside `calendar.stylex.ts`.

**Batch 3 sections added** (2026-07-25) — `TabList` under _Actions_, `TreeList` under _Data display_,
`NavHeadingMenu` under _Overlays_, each indexed in the sidebar. `TabList` ports all 11 storybook
stories, including the two inline SVG icon sets upstream authors in the story file itself; the
overflow blocks use `Carousel`'s `items` + `item` snippet form. `TreeList` ports 9 of 11 (see below).
`NavHeadingMenu` ports all 5, substituting registry built-ins for upstream's Heroicons.

- [ ] `ThumbnailDisabled`'s _Enabled_ row is still absent — our Thumbnail section shows the lifecycle, removable and gallery blocks but not the enabled/disabled pair
- [ ] `TreeList` demo ports 9 of upstream's 11 stories. `WithIcons` needs folder/document icons the
      registry does not ship (retires with `@lucide/svelte`, as the `Icon` demo's hand-drawn SVG
      does), and `Interactive` drives its rows with `alert()` — absent rather than substituted
- [ ] `TabList`'s `WithActions`/`DividerGap` blocks show the _Filter_ button with the registry's
      `funnel`, matching upstream, but the _New item_ button has no leading icon: upstream uses
      Heroicons' `PlusIcon` and the registry has no plus. Retires with the icon registry
      **Batch 4 sections added** (2026-07-26) — `CheckboxInput`, `CheckboxList` and `Slider` under _Inputs_,
      each indexed in the sidebar between `RadioList` and `Switch`. `CheckboxInput` covers **14 of
      upstream's 17** stories, `CheckboxList` **13 of 15**, `Slider` **9 of 10**. Every story absent purely
      because it is a _roll-up_ of blocks already shown individually is listed here rather than left
      implicit: `CheckboxInput`'s `AllVariations`/`StatusVariations`/`StartIconVariations`,
      `CheckboxList`'s `AllVariations`, `Slider`'s `AllVariations`. The `CheckboxList` section also carries
      a `disabledMessage` block, which upstream documents as a prop (and tests in 8 cases) without shipping
      a story for it. Other deferrals below.

- [ ] `CheckboxInput`'s `WithStartIcon`/`StartIconVariations` use the registry's `info` where upstream
      passes Heroicons' `Bell`/`Envelope`/`ShieldCheck` — the substitution the `Switch` icons already
      make. Retires with the icon registry
- [ ] `CheckboxList`'s `DynamicItems` story is absent — it demonstrates rendering items from an array,
      which is a consumer pattern rather than component API, and the select-all block already shows
      `{#each}`-driven items
      **Batch 5 sections added** (2026-07-26) — `NumberInput` and `FileInput` under _Inputs_ (between
      `TextArea` and `InputGroup`), `CodeBlock` under _Typography_ (after `Code, Kbd, Blockquote`), each
      indexed in the sidebar. `NumberInput` covers **24 of upstream's 29** stories (retallied
      2026-08-15: 0.4.1 added `FormattedDisplay`, `WithNumberSteppers`, `WheelBehavior`, `ReadOnly`
      and `StatusVariantComparison`, and all five are rendered — the old "19 of 24" was already wrong
      before the batch, so re-derive this from the stories file rather than incrementing it),
      `FileInput` **13 of 14**, `CodeBlock` **all 15** plus a `syntaxTheme` block. Every absence,
      named rather than left implicit:

- `NumberInput`'s `AllVariations` and `FileInput`'s `AllVariations` are _roll-ups_ of blocks already
  shown individually — the batch-4 convention. **One caveat found 2026-08-15**: that rationale is
  exactly true for `FileInput` and _not_ for `NumberInput`, whose `AllVariations` is the only
  upstream story setting `isLabelHidden`. So `isLabelHidden` is demonstrated nowhere in our section —
  a genuine gap, not a roll-up. Left open rather than closed: a standalone `isLabelHidden` block
  would be demo content upstream does not have as a story of its own, which the parity rule calls a
  defect. It closes when the `AllVariations` roll-up convention is revisited.
- `NumberInput`'s `ErrorStatus`/`WarningStatus`/`SuccessStatus` are the **inverse** case: the
  `StatusVariations` roll-up _is_ rendered, and the three individual stories differ from it only in
  their label and starting value, so the API surface is fully covered by the block that is there.
- `NumberInput`'s `WithEventHandlers` renders a running event log — storybook-harness scaffolding
  rather than component API.

- [ ] `NumberInput`'s `WithStep`/`DecimalInput`/`WithStartIcon` use the registry's `info` and `menu`
      where upstream passes Heroicons' `CurrencyDollarIcon`/`HashtagIcon` — the substitution the
      `Switch` and `CheckboxInput` icons already make. Retires with the icon registry
- [ ] The `CodeBlock` demo's `syntaxTheme` block uses `dracula`; upstream ships no story for the prop
      at all (it is documented in `.doc.mjs` and tested), so this block is the port's own — the same
      standing the `CheckboxList` `disabledMessage` block has
      **Batch 6 sections added** — `Selector` and `Typeahead` under _Inputs_ (between `FileInput` and
      `InputGroup`), `Pagination` under _Data display_ (after `Carousel`), each indexed in the sidebar.
      `Selector` covers **16 of upstream's 17** stories plus a `hasSearch` block, `Pagination` **13 of
      14**, `Typeahead` **all 14**. The absences, named rather than left implicit:

- `Selector`'s `AllVariations` and `Pagination`'s `AllVariants` are _roll-ups_ of blocks already
  shown individually — the batch-4 convention.
- The `Selector` demo's `hasSearch` block is the port's own: upstream ships no story for the prop
  (it is documented in `.doc.mjs` and tested in eleven cases), the same standing the `CheckboxList`
  `disabledMessage` and `CodeBlock` `syntaxTheme` blocks have.

- [ ] `Selector`'s `WithIcons`/`CustomRender` blocks use the registry's `info`/`menu`/`warning` where
      upstream passes Heroicons' `UserIcon`/`CogIcon`/`BellIcon`, and `Typeahead`'s `WithStartIcon`
      uses the registry's `search` where upstream passes `MagnifyingGlassIcon` — the substitution the
      `Switch`/`CheckboxInput`/`NumberInput` icons already make. Only the `search` one is a true
      match; the rest are stand-ins. Retires with the icon registry
      **Batch 7 sections added** — `MultiSelector` and `Tokenizer` under _Inputs_ (immediately after
      `Selector` and `Typeahead` respectively), each indexed in the sidebar. `MultiSelector` covers **all
      12** of upstream's stories, `Tokenizer` **all 20**. Two notes rather than absences: upstream's
      `TriggerModes`, `Status`, `Sizes`, `FormComposition` and `SizeVariants` stories each render two or
      three selectors inside one flex column, which the section's existing `.field-column` already is, so
      they land as consecutive blocks rather than nested wrappers; and `Tokenizer`'s `WithStartIcon`/
      `WithStartIconAndTokens` use the registry's `search` where upstream passes Heroicons'
      `MagnifyingGlassIcon` — a true match, unlike the stand-ins elsewhere, so nothing retires with the
      icon registry here.

**Batch 8 section added** — `Theme` under _Foundations_, between `Theme tokens` and `Icon`, indexed
in the sidebar. It ports **all 5** of upstream's `Theme.stories.tsx` stories (`BarChart`,
`BarChartDark`, `GroupedChart`, `ThemeComparison`, `Token Inspector`), including its
`ThemeAwareBarChart`, `ThemeAwareGroupedChart` and `TokenInspector` helpers as sibling route
components and its `oceanTheme` verbatim. Every one is a `useTheme()` demo — that is what the
stories are for.

**The page shell now dogfoods `<Theme>`.** It had hand-written `data-astryx-theme` / `data-theme` on
its root `<div>`, which was the only option before the component existed and is a defect now that it
does — and a live one, not cosmetic: a section-level `<Theme>` with no `<Theme>` ancestor is a
_root_, so the six in the new section would each have raced to write `<html>`. The toggle's
"Theme: none" branch became a `defineTheme({name: 'none'})` marked `__built`: its `@scope` name
matches no stylesheet, so every token falls back to `tokens.stylex.ts`'s defaults, which is exactly
what that branch was for, and there is no CSS to inject.

**Batch 9 also added `CommandPalette`** under _Overlays_, between `AlertDialog` and `Lightbox`,
indexed in the sidebar. It ports **all 8** of upstream's stories as a sibling route component
(`command-palette-demos.svelte` — the shape the `Theme` section's helpers already use, since eight
button-plus-dialog pairs with their own sources would otherwise bury the page). Unusually,
**nothing is substituted**: `menu`, `wrench`, `info`, `search` and `check` are all registry
built-ins, so the rich-item and picker stories render upstream's exact glyphs.

**Batch 9 section added** — `Outline` under _Data display_, between `Breadcrumbs` and `Carousel`,
indexed in the sidebar. Placement is by the port's own role grouping, as `Breadcrumbs` (also
`category: 'Navigation'` upstream) already is. It ports **all 7** of upstream's stories — `Basic`,
`Controlled`, `Compact`, `DeepNesting`, `WithDocument`, `ExtractFromHTML` and (since batch 11)
`ExtractFromMarkdown`, the last three with upstream's own document markup so the uncontrolled
scroll-spy has real headings to resolve against. `LayerProvider` gets no section — it renders no UI of its own, and upstream ships
no story for it.

**Batch 10 sections added** — the nav family: `AppShell`, `SideNav`, `TopNav` and `MobileNav`, all
four under _Layout_ after `OverflowList`, each indexed in the sidebar. Placement is by the port's own
role grouping: `AppShell` composes over `Layout` and the other three are the _regions_ it composes,
so the group reads as page structure end to end. Every section is a **sibling route component**
(`nav-app-shell-demos.svelte`, `nav-side-nav-demos.svelte`, `nav-top-nav-demos.svelte`,
`nav-mobile-nav-demos.svelte`) — the `command-palette-demos.svelte` precedent, and not optional here:
nine application shells and fourteen sidebars written inline would have doubled `+page.svelte`.

Counts: `AppShell` **9 of 10**, `SideNav` **all 14**, `TopNav` **all 9** plus **all 4** of
`TopNavMenu.stories.tsx` (the menu stories live in the `TopNav` section, since upstream composes both
inside a `TopNav`), `MobileNav` **all 6**. Absences, named rather than left implicit:

- `AppShell`'s `Playground` is absent. Its `render` is `TopNavWithSideNav` with the two defaults
  (`variant="elevated"`, `height="fill"`) passed explicitly; the rest of it is storybook `argTypes`
  controls, which a static page has no counterpart for. The `NumberInput`
  `ErrorStatus`/`WarningStatus`/`SuccessStatus` standing — covered by the block that _is_ rendered.
  Consequence worth knowing: `variant`'s other three values (`wash`, `surface`, `section`) reach the
  page nowhere, because upstream ships no story for them either.
- `SideNav`'s `Collapsible Items` ports two of its three sections. The third, `Collapsible + onClick`,
  drives the item with `alert('Settings clicked')` — the `TreeList` `Interactive` precedent, absent
  rather than substituted.

Two framing decisions, both commented at their call site:

- **Every `AppShell` story is in a fixed-height frame.** The shell is `height: 100dvh` (`fill`) or
  `min-height: 100dvh` (`auto`), so nine unconstrained embeds would each be a full viewport tall. The
  frame supplies the bound and the shell takes an inline `height`/`min-height: 100%` — `style` is a
  documented `BaseProps` prop and inline beats StyleX's class. `fill` still scrolls its regions
  internally; `auto` still grows with content, with the frame as the scroller.
- **Every `SideNav` story is in a 480px frame**, which is upstream's _own_ decorator
  (`<div style={{height: 480}}>`) rather than a choice made here — `SideNav` is `height: 100%` and has
  no height at all without a bounded parent. They wrap into a row because fourteen stacked columns
  would be ~6,700px of page.

`MobileNav`'s stories each keep their own open state and all start **closed**: it is a native
`<dialog>` opened with `showModal()`, so one left open on mount would cover the demo page.

**Batch 11 sections added** — `Table` and `Markdown`, both under _Display_ after `TreeList`, each a
sibling route component (`table-demos.svelte`, `markdown-demos.svelte`) for the reason the nav family
established. `Table` ports **all 24** of upstream's stories and `Markdown` **all 15** across
`Markdown.stories.tsx` and `MarkdownCitations.stories.tsx` — no absences in either, and no icon
substitutions, since neither story file imports Heroicons. The `Outline` section goes to **7 of 7**
with `ExtractFromMarkdown` restored.

Three translations recur across the two new sections, each commented at its call site:

- **The two streaming stories use `{#key}` rather than React's `key={key}` remount** — the same
  mechanism spelled differently: bumping the key tears the subtree down so the incremental parse
  state and the fade boundaries start clean.
- **`ExtractFromMarkdown`'s heading ids come from `useOutlineFromMarkdown`, not from the heading
  text.** Upstream's story overrides `components.heading` and slugifies `nodeText(children)`; a
  snippet's text cannot be read, so the ids are taken from the hook — same slugifier, same document
  order — and stamped onto the rendered headings by an effect. That is upstream's own docsite
  pattern (`PackageStubPage`), not an invention.
- **Two column/plugin arrays are `$derived.by`** rather than plain `const`s, because they reference
  snippets and a template snippet does not exist while the `<script>` runs.

**Verified in real headless Chromium against the dev server** (dev, not the prod build — Svelte logs
hydration failures only in dev): 15 markdown roots, 45 `role="paragraph"` divs, 7 rendered tables, 16
citations, 13 task checkboxes, 7 `<pre>` code blocks, 36 tables and 506 body cells in the `Table`
section, and the `ExtractFromMarkdown` outline's five ids present on the headings — which proves an
effect ran, so hydration is demonstrated rather than assumed. Zero console errors and zero hydration
warnings; the only failed request is the pre-existing deliberate `/nope.png` broken-image demo.

- [ ] Batch 10's icon substitutions. Upstream's five nav story files use **16 distinct Heroicons**, of
      which the registry has **two true matches** — `Bars3Icon` → `menu` and `MagnifyingGlassIcon` →
      `search`. The rest are stand-ins, the substitution the `Switch`/`CheckboxInput`/`NumberInput`/
      `NavHeadingMenu` blocks already make: `HomeIcon` → `viewColumns`, `ChartBarIcon` → `arrowUp`,
      `FolderIcon` → `calendar`, `Cog6ToothIcon` → `wrench`, `DocumentTextIcon` → `copy`,
      `ShieldCheckIcon` → `check`, `UserGroupIcon`/`UserCircleIcon` → `info`,
      `QuestionMarkCircleIcon` → `warning`, `BellIcon` → `clock`, `CubeIcon` → `stop`, `BoltIcon` →
      `warning`, `CodeBracketIcon` → `wrench`, `GlobeAltIcon` → `info`. Retires with the icon registry
- [ ] **`selectedIcon` cannot be "the same glyph, filled"** — the registry ships **no outline/solid
      pairs**, so every `*IconSolid` upstream passes lands as `success`, its only filled counterpart to
      a stroked glyph. Passing the same name twice would make the swap the prop exists for invisible,
      and omitting it would drop a documented prop, so the stand-in is a _different_ glyph on purpose.
      Retires with the icon registry
- [ ] The mega menu's `TopNavMegaMenuFeaturedCard.image` points at one of the four inline data-URI
      scenes in `thumbnail-images.ts` where upstream points at an Unsplash URL — the substitution the
      `Lightbox` and `Thumbnail` blocks already make, so the page needs no network
- [ ] `SideNav`'s `getCollapseState()` / `collapseHandle` instance exports and
      `SideNavCollapseButton`'s `handle` (this port's translation of upstream's `handleRef`) appear in
      **no** demo block — upstream ships no story that uses `handleRef` either, so demonstrating it
      would be inventing content. Worth a port-own block if the prop ever needs showing
- [ ] Nine `AppShell` instances on one page means nine `role="main"` landmarks and nine copies of the
      `astryx-app-shell-main` id, since the id is a module constant. A demo-page artifact of showing
      every story at once (storybook renders one per page), not a component defect

- [ ] Re-sweep the demo route against upstream now that batches 1–3 have landed

### Release & governance

Done: adopted the parity rule verbatim, enforced by 5 subagents (`astryx-parity`,
`astryx-idiom`, `astryx-test-parity`, `astryx-oracle`, `astryx-surface`).

**Four of the five boxes below were already done and stayed unchecked for several batches** —
`LICENSE`, the unaffiliated notice, CI, and the `parity` issue template all exist in the tree. That
is its own lesson and the reason this section is now audited rather than carried forward: a
checklist nobody re-reads against the repo describes the day it was written.

- [x] MIT `LICENSE` carrying Meta Platforms' copyright (as huntabyte did for shadcn) — at the repo
      root, and npm packs it into every tarball automatically
- [x] Explicit "unofficial / not affiliated with Meta" notice; no Meta trademarks — in `README.md`,
      every package README, and the release post
- [x] **The publish pipeline — landed 2026-08-10, and it is a tag, not changesets.** Every package
      carries the version of the upstream Astryx release it ports and they publish together, so
      per-package changelog machinery has nothing to decide: one tag names the whole release.
      `.github/workflows/release.yml` fires on `v*`, re-runs the full CI gate (a tag can be pushed
      at any commit, including one CI never saw), then `pnpm publish -r --access public
      --provenance --no-git-checks`. **It must be pnpm, not npm**: the theme manifests now carry
      `"@astryx-svelte/core": "workspace:^"` as a peer, and only pnpm rewrites the `workspace:`
      protocol to a real range at pack time — verified by packing `theme-neutral` and reading
      `^0.3.0` back out of the tarball. `workflow_dispatch` runs the same job as a `--dry-run`.
- [x] **`scripts/check-publish.mjs` + `pnpm check:publish`** — publint over all ten publishable
      packages plus two things publint does not check: a package with **no README** (npm renders a
      blank page and nothing else here would ever notice — all eight themes were in that state), and
      a manifest whose version disagrees with the tag being released (`--version 0.3.0`).
      Mutation-checked in three directions: a removed README, a broken `exports` target and a
      mismatched version each fail with exit 1.
- [x] `NPM_TOKEN` configured in the repository's Actions secrets (2026-08-10); `id-token: write` is
      already in the workflow for provenance
- [ ] **Push the tag** — the last step, and the only one that publishes.
      `git tag v0.3.0 && git push origin v0.3.0`, from a merged `main`. Worth a
      `workflow_dispatch` dry run first: it runs the identical job with `--dry-run`, so a manifest
      or credential problem surfaces without burning a version number, which npm does not let you
      re-use
- [ ] Consider asking the Astryx maintainers for a blessing
- [ ] **The version scheme cannot express a release of our own, and 0.3.1 is the first proof.**
      Decided 2026-08-10, with the collision accepted deliberately rather than missed: versions stay
      in lockstep with the upstream release they port, so a port-local fix — the Vite preset, the
      `doctor` check — takes the next patch number regardless of whether upstream has used it.
      **Upstream will very likely publish its own 0.3.1**: it shipped ten patches across the 0.1.x
      line, so this is likely rather than hypothetical. The rule when it happens, written down now
      so it is not improvised then: **skip to the next free patch and state the parity target in the
      `CHANGELOG` heading** — if upstream ships 0.3.1 we release 0.3.2 and say it ports 0.3.1. The
      machine-readable parity target is already exact and already in the tree: the
      `@astryxdesign/*` pin in each package's devDependencies. The alternative considered and
      rejected was decoupling to our own semver with parity as metadata, which costs the
      "version means parity" property that the README, the CHANGELOG and the tag all lean on
- [x] Enforce the parity rule in CI, with a `parity` label on issues/PRs — `.github/ISSUE_TEMPLATE`
      carries `parity.yml`, `bug.yml` and `port-template.yml`; CI runs both fidelity oracles on
      every PR, which is the enforcement that matters

#### What the first `npm pack` found — 2026-08-10

Three things, none of which any existing gate could see, because **every gate in this repo reads the
working tree and npm reads the `files` field**. The whole class only becomes visible the first time
someone asks npm what it would actually publish.

- **All eight theme packages had no README**, so all eight would have published a blank npm page.
  Nothing anywhere reads a theme's README — the docs site's `package-readmes.js` covers `core` and
  `cli` only, which is why its "2 packages, 2 with a README" line looked healthy. Eight are written
  now, each carrying its own oracle number (butter 430/433, chocolate 289/292, gothic **345/345**,
  matcha 303/306, neutral 339/342, stone 355/358, y2k 357/360), which are claims a reader can
  re-run. Gothic's equal pair is the dark-only case: no `[light, dark]` pairs, so upstream emits no
  `html[data-theme=…]` block and there is no three-declaration `color-scheme` remainder.
- **Core's tarball carried 283 files that are not library source** — 248 test fixtures under
  `src/tests/fixtures/` and 35 demo routes. The `files` denylist excluded `*.test.*`, and a fixture
  is not named `*.test.*`; `assert-core-ships-src.mjs`'s leak rule tested the same pattern, so both
  agreed. One of the demo routes is `src/routes/+layout.svelte`, which imports
  `../../../themes/neutral/dist/` — a relative path that resolves inside this monorepo and points at
  nothing anywhere else. `files` now denies `src/tests`, `src/routes` and `src/app.html` (2,996 →
  2,712 files), and the assertion has a **fifth rule**: anything under `src/` but outside `src/lib`,
  `.d.ts` aside, fails the run. Mutation-checked by removing the deny and watching it fail.
- **A scoped package does not publish public by default.** Without `publishConfig.access`, the first
  publish of `@astryx-svelte/*` fails with E402 — at the end of a workflow that has already built,
  typechecked, linted and tested. All ten now declare it.

And one thing the pack **proved rather than assumed**: `pnpm pack` rewrites the new
`"@astryx-svelte/core": "workspace:^"` peer to `^0.3.0` in the packed manifest. That was read out of
the tarball, not inferred from documentation — it is the reason the publish step must be `pnpm` and
not `npm`, which would ship the `workspace:` protocol literally.

#### The release gate — every axis re-measured 2026-08-10, over the tree that will be tagged

The previous full measurement was 2026-08-08 and five commits back, which included the `IconType`
widening in core, the docs preview-theme fix, the core build split, the blog surface and the
template icons. None of them moved a number here, but **that is a finding of this run, not an
assumption it was allowed to make**.

|                                    | result                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm -r build` / `check` / `lint` | exit 0 — core **2,062 files, 0 errors, 32 warnings**; docs **1,492 files, 0 errors**      |
| class oracle                       | **1,528 style keys (19 marker-normalised) + 615 inline call sites, 0 skips, 0 mismatches** |
| theme oracles (7)                  | **2,418 declarations, 0 mismatches** — butter 430/433, chocolate 289/292, gothic 345/345, matcha 303/306, neutral 339/342, stone 355/358, y2k 357/360 |
| theme icon registries (8)          | 28 names → 28 Lucide glyphs, all resolved, in every package                               |
| tests — core client                | **162 files, 4,255 passed**, 14 chunks, all exit 0, **162 counted back against 162 on disk** |
| tests — core server                | **34 files, 811 passed**                                                                  |
| tests — CLI                        | **102 files passed, 1 skipped; 1,937 passed, 25 todo**                                    |
| packaging assertions               | `assert-core-ships-src` 97 components / 906 src files / 2,712 total; themes bundle up to date; `check:publish` 10/10 |
| `pnpm -F docs generate`            | **211 / 213** documented, **0** documented props core lacks, 629 examples / 0 pending, 42 templates, 8 themes |

**5,066 core tests and 1,937 CLI tests pass, 0 failures.** The client figure is the reconciled kind
this repo insists on rather than a sum of chunk logs: 14 chunks, every one exit 0, and the files-run
count checked back against the files on disk. The blog post said **4,760** before this run; the
Status table said 5,066; the Status table was right, and the post is corrected — **two numbers for
one measurement means at least one of them was never re-derived.**

**And every one of those green numbers was measured on a tree CI could not reproduce.** Pushing to
`main` showed CI had failed on _every_ run since the CLI landed — 22 typecheck errors in
`packages/cli`, in files no diff had touched — because `.gitignore`'s unanchored `reference/` (meant
for the upstream clone) also matched `packages/cli/authoring/doctypes/reference/`, upstream's own
path for the reference doctype. Three source files were never tracked; `git add` refused them and
said nothing. Anchored to `/reference/` and the files committed.

Two things worth carrying from it. **`/build` two lines above carries a comment explaining exactly
this hazard**, written when the same mistake ate two CLI directories — and it did not generalise to
the next pattern added below it, so the lesson was recorded and then repeated. And **it explains why
a local gate is not a substitute for CI here**: `check`, `lint`, `test` and `check:publish` all read
the working tree, where the files were present, so every local measurement in the table above was
honest and none of them could see it. `git archive HEAD` is what shows the difference, and it is now
the thing to run when local and CI disagree.

---

## Known debts

Standing deviations live in [`debts.md`](./debts.md), each with a machine-readable head.
Per-batch findings live in [`ledger/`](./ledger).
