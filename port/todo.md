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
| Typecheck / lint  | `pnpm -r check` clean (**core 2,121 files, 0 errors, 32 warnings, 20 files with problems; docs 1,505 files, 0 errors, 0 warnings**); `pnpm -r lint` clean, exit 0; `pnpm -r build` exit 0. All re-derived 2026-08-08. Two lessons this gate cost, both still live: **a lint gate chained with `&&` reports "failed" identically whether one stage failed or both ran** — `prettier --check . && eslint .` meant a stray scratch file short-circuited eslint entirely, hiding six real errors for several batches; and **the gate is only as trustworthy as the tree is quiet**, since a scratch file deleted between eslint's enumeration and its read fails the run on a path that no longer exists. A batch that leaves `zz-*.mjs` in a package root has not finished A third, found 2026-08-08: **the root `todo.md` and `PORTED.md` are not in the lint gate at all** — `pnpm -r lint` runs `prettier --check .` inside each *package*, and nothing checks the repo root, which is how malformed blocks accumulated here unnoticed. Worse, `prettier --write` does **not converge** on this file: a multi-paragraph list item has its continuation paragraphs re-indented deeper on every pass (6 → 10 → … → 30 spaces observed), and past ~4 extra spaces markdown renders them as an indented *code block* rather than prose. The stable form for extra detail under a `- [ ]` item is a nested `  - ` bullet, which round-trips; 57 lines were normalised back. Do not run `prettier --write` here expecting a fixed point. |
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

**Moved to [`PORTED.md`](./PORTED.md)** — the per-component implementation notes, verbatim: what
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

- [x] **Batch 1 — unblockers & quick leaves** — **DONE**, see [PORTED.md](./PORTED.md)
  - `List` + `ListItem` (+ `ListContext`) · 507 · `Item` ✔ — **gates `CheckboxList`**
  - `MoreMenu` · 163 · `Button`/`DropdownMenu`/`Icon`/`SizeContext` ✔
  - `AlertDialog` · 290 · `Dialog` ✔ — `useImperativeAlertDialog` deferred with `useImperativeDialog` (same render-returning-hook problem); **both landed in batch 15**
  - `Banner` · 544 · `Button`/`Icon`/`Layout` ✔
- [x] **Batch 2 — composition leaves** — **DONE**, see [PORTED.md](./PORTED.md)
  - `Breadcrumbs` + `BreadcrumbItem` · 535 · `Link` ✔
  - `Carousel` · 428 · `Button`/`Icon`/`Layer` ✔
  - `Toolbar` · 405 · `Layout`/`Section`/`SizeContext` ✔ — retires the `useKeyboardHint` `WithToolbar` demo debt
  - `ContextMenu` · 536 · `DropdownMenu`/`Divider`/`Layer` ✔ — its selectable + submenu re-exports landed with the trio (batch 17b)
- [x] **Batch 3 — nav & tree surfaces** — **DONE**, see [PORTED.md](./PORTED.md)
  - `NavMenu` · 456 · `Icon`/`Link`/`Text` ✔
  - `TreeList` · 1015 · `useTreeFocus` ✔
  - `TabList` · 1139 · `Popover`/`SizeContext` ✔ — **corrected `research/01`**: it does _not_ need the
    `OverflowList` items+snippet precedent, because it never slices its children (the overflow story
    wraps them in `Carousel`, which does)
  - (`NavItem/` is **not a component** — one shared `navItemStyles.stylex.ts` consumed by `SideNav`/`TopNav`; it lands with them)
- [x] **Batch 4 — checkbox family + Slider** — **DONE**, see [PORTED.md](./PORTED.md)
  - `CheckboxInput` + `CheckboxList` · 649 + 597 — mutually recursive, landed together ✔
  - `Slider` · 950 · `Field`/`Tooltip` ✔
- [x] **Batch 5 — standalone inputs + CodeBlock** — **DONE**, see [PORTED.md](./PORTED.md)
  - `NumberInput` · 742 · `Field`/`InputGroup` ✔
  - `FileInput` · 823 · `Field`/`Spinner` ✔
  - `CodeBlock` · 2083 · `Code`/`Icon` ✔ — **the plan under-costed this one**: it also needs
    `theme/syntax/` (~710 LOC), which landed with it. Read a component's _whole_ import list when
    costing a batch, not just its component-dir dependencies
- [x] **Batch 6 — the selector spine** — **DONE**, see [PORTED.md](./PORTED.md)
  - `Selector` · 1822 · `Popover` ✔ — also landed `SelectorOption`, `useCombobox`,
    `useSelectedItemOffset`, and a `style` prop on `<PopoverLayer>`
  - `Pagination` · 706 · `Selector` ✔
  - `Typeahead` · 1750 ✔ — landed `BaseTypeahead`, `TypeaheadItem`, `createStaticSource`, and the
    `groupItems` Phase 1 debt
- [x] **Batch 7 — multi-select** — **DONE**, see [PORTED.md](./PORTED.md)
  - `MultiSelector` · 1704 (`Selector` ✔ + `CheckboxInput` ✔) — also landed `useMultiCombobox`
  - `Tokenizer` · 917 (`Typeahead` ✔ + `Token` ✔ + `OverflowList` ✔)
- [x] **Batch 8 — the launch set: `Theme`** — **DONE**, see [PORTED.md](./PORTED.md). The component work
      is finished; the rest of the batch is docs work, in
      [Phase 5](#phase-5--docs-site-the-current-goal)
- [x] **Batch 9 — dogfood the chrome** — **DONE**, all three units. See [PORTED.md](./PORTED.md)
  - [x] `CommandPalette` · 1520 — landed with its 6 sub-components and context; the hand-built
        `⌘K` palette now runs on it
  - [x] `Outline` · **742 of 838 landed** — `Outline` + `useScrollSpy` + `useOutlineFromDOM` +
        `types`; the hand-built on-this-page aside now runs on it
  - [x] `LayerProvider` / `LayerContext` — landed
- [x] **Batch 10 — the nav family** — **DONE**, see [PORTED.md](./PORTED.md). Booked at 6,919 LOC across
      `TopNav` + `SideNav` + `AppShell` + `MobileNav`; the estimate held, and the 4-way dependency
      cycle turned out not to need breaking because the contexts are the seams. **The one thing the
      plan missed was `useMenuHover`**, a nineteenth hook three of the components need — the
      pre-flight's "cost the whole import list" item caught it before any code was written, which is
      the second time that check has paid for itself after `CodeBlock`/`theme/syntax`
- [x] **Batch 11 — `Markdown`, and the Table core it turned out to need** — **DONE**, see
      [PORTED.md](./PORTED.md). Booked at 3,717 LOC for `Markdown` alone; it came in at roughly **7,100**, because
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
- [x] **Batch 12 — date/time family** — **DONE**, see [PORTED.md](./PORTED.md). Booked at ~5.4k and it
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
    [PORTED.md](./PORTED.md). It also confirmed `ChatMessageList`'s two asymmetric effects are
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
    comment at `PORTED.md`, where it belongs.
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

  Five translations this batch has settled, each detailed in [PORTED.md](./PORTED.md):
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

**The next front after the release** (decided 2026-08-07). Per `research/02`: Astryx has **no
registry** — components ship as an npm package that publishes its `src/`, and the CLI reads from
`node_modules`. Do **not** graft on a hosted registry.

`packages/cli` is a **placeholder, not a scaffold**: one `package.json`, no sources, and a `bin`
entry pointing at a `./bin/astryx-svelte.mjs` that does not exist. It is marked `"private": true`
so the release cannot publish a broken binary; **remove that flag when the CLI is real**, and not
before.

**Measured scope at `v0.3.0`** — 1,809 files / 4.3 MB, which badly overstates the job:

| area          | files |   size | what it is                                                                                       |
| ------------- | ----: | -----: | ------------------------------------------------------------------------------------------------ |
| `assets/`     | 1,502 | 2.6 MB | docs, templates, blocks, codemods — content, and the `.doc.mjs` half already feeds our docs site |
| `api/`        |   125 | 543 KB | the real logic; returns `{type, data}`, throws `AstryxError`                                     |
| `clients/`    |    75 | 454 KB | the Commander shell                                                                              |
| `foundation/` |    55 | 410 KB | XLE grammar and support                                                                          |
| `authoring/`  |    38 | 103 KB | config / integration / doctype / codemod parsers                                                 |

So **293 code files (~1.5 MB)** is the port — refined once slice 1 landed: **117 of those are
tests**, so **176 are source modules**. The 1,502 asset files are mostly transcription or
adaptation. `foundation/xle/` is an isolated subsystem that can land in a later milestone without
blocking anything — `research/02` already rates it lowest priority.

### Slice 1 — landed 2026-08-08

`packages/cli` is a real package: 20 files in the tarball, `check`/`lint`/`test` all exit 0, 35
tests. Still `"private": true` — that flag comes off when the CLI is genuinely usable, not before.

- [x] **`api/` ↔ `commands/` seam.** `api/` returns `{type, data}` and throws `AstryxError`; it never
      touches stdout, never calls `process.exit`, never reads `--json`. `clients/cli/` owns all four
      enforcement points — the `preAction` allowlist gate, the `postAction` backstop, `cliError` (the
      one place `AstryxError.code` becomes an envelope), and `json-shim`, which extends the contract
      to Commander's parse-time short-circuits that run *before* `preAction`. `manifest` is
      deliberately **not** in `api/`: it introspects the live Commander program, so an `api/manifest`
      would create the `api → cli` cycle upstream calls out by issue number
- [x] **`manifest --json`**, `apiVersion: 1`. Verified against the **real** `@astryxdesign/cli@0.3.0`
      binary (installed under `docs/node_modules`, so it is runnable) rather than against the
      changelog: **12/12 structural checks, 0 diffs** — envelope key order, data key order, all six
      `globalOptions` byte-identical, the `manifest` entry identical on every key including order.
      The only differences are the two that must differ: `data.name` and the bin name in `examples`.
      8 further JSON-contract edge paths (unknown command, bare `--json`, `--version --json`, bad
      `--lang`/`--detail`, unknown option, `--help --json` at root and leaf) all match on keys,
      `type`, `code` and exit code
- [x] **The append-only `ERR_*` codes — there are 43, not 53.** Verified against the frozen object at
      both tags; `v0.1.7` and `v0.3.0` are byte-identical in membership *and* order. **The "53" in
      `research/02` §1.3 and in this checklist was wrong.** All 43 transcribed in upstream's order and
      grouping, including codes for commands not yet ported (blog, layout, upgrade), as append-only
      requires. **Upstream bug, not replicated:** its `error-codes.d.ts` declares only **41** —
      `ERR_UNKNOWN_POST` and `ERR_FETCH_FAILED` are missing from the union, so a TypeScript consumer
      cannot compare against two codes the CLI really emits. Upstream's test only iterates the runtime
      object, which is how it drifted. Ours declares all 43 and cross-checks the union against the
      frozen object for membership *and* order
- [x] **`JSON_SUPPORTED` / `RESPONSE_TYPES` deliberately not pre-seeded** with upstream's 19 commands.
      The drift guard fails in both directions, so pre-seeding would switch it off for the whole port.
      Each slice must add registry entry + allowlist name + response-types row together, or the test
      fails

**Two Commander 12 → 14 breaks, both of which would have shipped silently.** Upstream pins
`commander@^12.1.0`; we are on 14.0.3.

- `configureHelp({wrap})` was renamed to `boxWrap` in 13. `configureHelp` merges unknown keys without
  complaint, so upstream's spelling type-checks, runs, and simply fails to disable wrapping.
- **`allowExcessArguments` flipped default `true` → `false`**, and this one destroyed a real recovery
  path: `astryx-svelte bogus-cmd` was rejected by the excess-args check *during parse*, so the root
  action never ran, and the result was `ERR_INVALID_ARGUMENT` with no suggestions instead of
  `ERR_UNKNOWN_COMMAND` with the "did you mean" list — exactly what an agent depends on when it
  guesses a verb wrong. Caught by the ported test, confirmed against the upstream binary.

**Three corrections to `research/02`, all of it 0.1.7-era where it disagrees:**

- **The `src/{api,commands,lib,…}` layout in §7.3 no longer exists.** At v0.3.0 upstream is
  root-level `api/` + `clients/cli/` + `foundation/` + `authoring/`. Slice 1 follows v0.3.0, because
  ~293 later-slice files carry v0.3.0 paths and a `src/` remap would need a translation table for
  every one. One deliberate divergence: the bin sits at `bin/astryx-svelte.mjs` rather than
  `clients/cli/bin/`, matching what `package.json#bin` already declared.
- **`@clack/prompts` is dead.** Upstream v0.3.0 uses **no prompt library at all** — `init` is
  non-interactive. §7.3's "interactive `@clack/prompts` wizard" is 0.1.7-era; the dependency has been
  removed.
- **`blog` is no longer hidden and *is* on the JSON allowlist** (`blog.list` / `blog.detail`), and
  **`build` is now JSON-supported** (`build.help` / `build.kit`). `research/02` says the opposite for
  both, true at 0.1.7.

### Slice 2 — Foundation II, landed 2026-08-08

`fs/paths`, `fs/path-safety`, `fs/module-loader`, `env/semver`, `text/string-utils`, plus the three
suites slice 1 shipped source for but no coverage of (`env/node-version`, `env/package-manager`,
`text/levenshtein`). **163 tests, up from 35**; `check` / `lint` / `test` all exit 0; the tarball is
25 files and still contains no `.test.mjs`.

Near-verbatim, as forecast — the identity strings change (`@astryxdesign/core` →
`@astryx-svelte/core`, `astryx` → `astryx-svelte`) and prettier reflows. The four places it is
_not_:

- **`jiti` is now a declared dependency**, one slice earlier than scheduled above.
  `module-loader`'s `.ts` branch is what needs it, and that branch lands here rather than with its
  callers. Not deferrable: a SvelteKit project is TypeScript by default, so `astryx-svelte.config.ts`
  is the _likely_ spelling rather than the exotic one, and Node's default 22.x type stripping does
  not cover an imported `.ts`.
- **`isFilePathArg` gained `.svelte`** — the extension the adapted `template` writes (`+page.svelte`
  where upstream writes `page.tsx`). Upstream's `.tsx`/`.jsx` entries are kept rather than pruned:
  the set only decides _file or directory_, so dropping them would not reject `./foo.tsx`, it would
  silently create a **directory** named `foo.tsx` — the exact bug the helper exists to close. Folded
  into the existing case, so the ported count still matches.
- **`listComponents` reads `<core>/src/lib/components`**, not `<core>/src`. Upstream's deny-list
  (`hooks`, `theme`, `utils`) has nothing left to deny — here those three are siblings of
  `components`, not of the components. The ported case keeps its upstream name and still asserts
  none of the three appear.
- **`searchComponents`' Pass 2 finds nothing, and cannot yet.** Its doc lookup is retargeted to our
  layout and upstream's legacy `XDS<Name>.doc.mjs` fallback dropped — but **this port's core ships
  no `.doc.mjs` at all**; the docs site reads upstream's out of `@astryxdesign/core`. Scoring is
  therefore entirely Pass 1 today. Ported now so slice 5 inherits the scoring contract instead of
  re-deriving it.

**`findProjectRoot` is inherited dead — and dead in a way that matters later.** It has **zero
callers** upstream, and it detects a monorepo by looking for `workspaces` in a root `package.json`,
which upstream's own root does not have (it is pnpm-only, `packageManager: pnpm@11.10.0`) — so the
helper returns `null` in the very repo it was written for. It works here only because this root
mirrors its `pnpm-workspace.yaml` into a `workspaces` field. Ported verbatim rather than fixed,
since nothing calls it, but **no later slice should build on it**: in an ordinary pnpm consumer
project it returns `null`, and `findCoreDir`'s `node_modules` branch is the reliable one.

**A footgun worth naming, because it will recur.** The file comment documenting
`formatCliCommand`'s regex divergence quoted upstream's pattern verbatim inside a `/** … */` block.
That pattern ends `\s*/`, which _closes the block comment_ — and the resulting syntax error is
reported at the end of the file, 220 lines from its cause. Any later slice documenting a regex has
the same trap.

**Two decisions were deliberately left open here**, because slice 4 is what had the information to
make them. **Both are now resolved** — recorded in place below rather than moved, so the reasoning
sits with the code that raised it:

- **PascalCase name ↔ kebab-case directory — RESOLVED 2026-08-08, and the answer is "there is no
  mapping".** Upstream's component directories _are_ the component names (`src/Button`); ours are
  `src/lib/components/button` while the name a user types is `Button`. The tempting fix is a
  mechanical transform, and it was measured before being adopted rather than after:
  - kebab → Pascal → kebab **round-trips for all 97 directories**, so the transform itself is sound;
  - but **98 of 191 exported components have no directory of their own** — `AvatarStatusDot` lives
    in `avatar/`, `ChatComposer` in `chat/`, `BreadcrumbItem` in `breadcrumbs/`. Name → directory
    is not a function.
  - Falling back to the *filename* (`chat-composer.svelte` → `ChatComposer`) covers 176 of 191 and
    then fails three different ways at once: **aliased re-exports** (`BreadcrumbMenuItem` and 9
    siblings are `dropdown-menu-item.svelte` published under another name), **casing** (`hstack.svelte`
    pascalises to `Hstack`, not `HStack`), and **location** (`Theme`/`MediaTheme`/`SyntaxTheme` live
    under `src/lib/theme/`, not `components/` at all).

  So **the barrel is the index and the filesystem is not a naming convention.** `foundation/discovery/`
  must read the export surface and follow each re-export to its source, not derive a path from a
  name. This is not a new mechanism to invent: `docs/scripts/lib/export-surface.mjs` already does
  exactly this, parsing the generated `.d.ts` with the TypeScript compiler, and its header records
  the same lesson learned the same way — "guessing from the source barrel with a regex would miss
  multi-line and re-export forms". Slice 4 models on it.

  Consequences for what slice 2 left provisional: `listComponents` returning directory names stays
  correct for `swizzle` (slice 7), which copies a directory, but it is **not** the component list —
  slice 4 adds the barrel-derived one alongside it rather than changing it. `searchComponents`
  joining the given name as a path segment is wrong for the 98 and must resolve through the index.
- **Where the CLI's component prose comes from — RESOLVED 2026-08-08: generate it.** Pass 2 above
  is the first place the port wants `.doc.mjs` from core and finds none, and the gap is total —
  **core ships 0 where upstream ships 208**. Of the three options (hand-author beside the
  components, generate, or read the docs site's registries), generation is the only one that does
  not either invent prose or make the CLI depend on the docs app. **The docs pipeline already holds
  both halves**: it reads upstream's prose from `@astryxdesign/core`'s `.doc.mjs` and reconciles it
  against this port's own compiler-derived types out of `packages/core/dist/**/*.d.ts`. That
  reconciled record — upstream's words, our types — _is_ the doc file, so emitting it is
  serialisation rather than authorship.

  Layout follows from the barrel decision above rather than being a second choice: one file per
  documented entry, **named for the export** and placed in the directory of that export's source
  module — `components/button/Button.doc.mjs`, `components/dropdown-menu/DropdownMenuItem.doc.mjs`,
  `hooks/useMediaQuery.doc.mjs`. Measured: **all 209 documented entries resolve to a source module
  through the barrel, none unresolved**, and naming by export is collision-free where naming by
  source basename is not (`dropdown-menu-item.svelte` backs both `ContextMenuItem` and
  `DropdownMenuItem`; `i18n/index.js` backs both `InternationalizationProvider` and `useTranslator`).
  This is upstream's own file convention (`src/Text/Heading.doc.mjs`), kept even though our
  `.svelte` files are kebab-case.

  **No name→source index file is emitted**, and the earlier note that one would be needed to keep
  `typescript` out of the CLI's runtime dependencies was wrong: upstream's `resolveImportPath` and
  `findComponentSource` walk the tree and read `package.json#exports`, needing no compiler. The
  co-located docs are the index, exactly as upstream's are.

The `astryx` package.json field `discoverExternalPackages` scans for **keeps upstream's spelling**.
It is a convention third-party packages author against, and renaming it forks that contract for no
gain. The cost — a React Astryx add-on being discovered and its React source read as Svelte — is
theoretical today: neither `@astryxdesign/core` nor `@astryxdesign/cli` declares the field, and both
are installed in this repo.

### Slice 3 — Authoring + config, landed 2026-08-08

`authoring/**` (parsers, doctypes, the sealed zod schemas), `foundation/config/`
(`config-cache`, `Project`) and `foundation/integrations/`. **254 tests passing + 13 `it.todo`
across 20 files**, up from 163; `check` / `lint` / `test` all exit 0; the tarball is **64 files**,
32 of them `authoring/`, with no `.test.mjs` and no `scripts/`. Six subpath exports added
(`./authoring`, `./config`, `./integration`, `./doc`, `./template`, `./codemod`), every target
verified to resolve on disk.

**Case parity is exact on all 19 suites** — every one matches upstream's `it(` count, with the 13
deferrals carried as `it.todo` naming the slice that unblocks them (6 doctypes `loadComponentDoc`
→ slice 4; 6 `Project` discovery/issues → slices 4/6/9; 1 integrations `discover()` → slice 5). The
single over-count, `error-codes.test.mjs` at 15 vs 11, is slice 1's deliberate declaration-parity
layer, which has no upstream analogue and is documented in that file's header.

Three decisions are worth reading before the file list, because each one reverses or defers
something.

**`Project` could not land the way the slice was scoped, and the fix shaped the whole slice.**
TODO called it "the single read API"; it is also the most forward-coupled file in the CLI, with
five outbound edges into code no slice has written — component discovery (4), template discovery
(6), the codemod registry and integration codemod discovery (9 / deferred assets), and
`validate-integration` (7). Deferring `Project` was not an option, because **every later slice is
blocked on it**. So the class lands **whole** — every getter, `#memo`, `#pushIssue`,
`#collectIssues`, `issuesUrl()`, `issues()`, and the skip-and-warn scaffolding _inside_ all three
discovery methods — with only the discovery calls themselves deferred, each marked at its own call
site with the slice that owns it. A later slice adds a line; it does not reshape a method.

Two things fell out of that. `api/integration/validate-integration.mjs` lands as a **deliberate
fragment**: one of its five exports and one of its three contribution checks. That is not
arbitrary — `checkRoots` is the only check with no forward dependency, and it is also the one that
matters most day to day, because a deleted contribution directory is how an integration usually
breaks after install. It was enough to land **all six** `integration-warnings` cases, which the
slice plan predicted and which held. And `Project.codemods()`' core half returns `[]`, which is
**not a stub**: upstream reads an 18-entry version registry, this port has released no versions, so
there is no transform between any two of them and the empty result is the correct answer.

**Config and manifest basenames are renamed** to `astryx-svelte.config.{ts,mjs,js}` and
`astryx-svelte.integration.{ts,mjs,js}`. This **reverses the call made for the `astryx`
package.json field** that `discoverExternalPackages` reads, and the reasoning is the same one
pointed the other way: that field was kept because it is a third-party authoring contract whose
payload — a docs directory, a category string — is framework-neutral, so the cost of a collision
was theoretical. A manifest's payload is not neutral; it points at component sources this CLI will
read as Svelte. Sharing upstream's basename would let a React Astryx integration installed
alongside this port be loaded and its `.tsx` read as `.svelte`. Same principle, opposite
conclusion, because what the file contains differs. No `.svelte.ts` basename was added — a config
is not a runes module and jiti loads plain `.ts`.

- [ ] **The published docs now contradict the shipped CLI on this.** The docs site already
      publishes a live `cli-integrations` page whose prose — reused verbatim from upstream's
      `.doc.mjs` — says `astryx.config.{ts,mjs,js}` and `astryx.integration.{ts,mjs,js}`. It needs a
      doc overlay for that page. Agreed as rename-plus-overlay; the overlay is not written yet

**`DEFAULT_ISSUES_URL` is read from this package's own `package.json#bugs`, not hard-coded.**
Upstream's literal is `https://github.com/facebook/astryx/issues/new`, which must not be inherited —
it would route a *port* bug to Meta's tracker. It was not replaced with a guess either: this
repository declares no `repository`, `bugs` or `homepage` and has no git remote, so **there is no
correct URL to write down yet**. Reading the field means the answer appears the moment the package
declares one, and until then `issuesUrl()` returns `undefined` rather than a plausible-looking
address that goes nowhere.

- [ ] **Set `packages/cli/package.json#bugs` before the release.** Until it is set, `issuesUrl()`
      returns `undefined` for every core-owned reference. The ported test asserts against the
      exported constant rather than a literal, so it passes either way — which means nothing will
      fail to remind you

**Inherited, not introduced: `foundation/` imports from `api/`.** Both `project.mjs` and
`integration-warnings.mjs` reach up into `api/integration/validate-integration.mjs`. Slice 1 was
careful to avoid exactly this shape for `manifest` (an `api → cli` cycle it called out by issue
number); upstream did not avoid the mirror image here. Replicated for parity and recorded under
Known debts, because unwinding it would move a published module's path.

**The `.tsx` → `.svelte` adaptation surface turned out to be far smaller than the brief assumed**,
and the negative finding is the useful one: across all 47 slice-3 files there are **zero** Next.js
hits (no `app/`, `pages/`, `page.tsx`, `next.config`), **zero** StyleX or CSS-file hits, and only
**six** literal `.tsx` occurrences. The `app/` → `src/routes` and `page.tsx` → `+page.svelte`
mappings the plan budgeted for do not arise until slices 6 and 7.

**The drift-locks were dead on arrival, and the reason is worth internalising.** Three parsers
carry a compile-time `Expect<Equal<…>>` asserting the sealed zod schema still infers exactly the
public type. Adding `authoring/**` to the tsconfig `include` — which this slice did, precisely so
they would fire — was necessary and **not sufficient**: the first mutation test came back _clean_.
TypeScript groups extensions as `[.mts, .d.mts, .mjs]` and, for a **wildcard-matched** path, keeps
only the highest-priority extension sharing a basename. So `authoring/config/parse.d.mts` **evicts
`authoring/config/parse.mjs` from the program entirely** — `--listFiles` showed the three
declaration files and not one parser. Every lock, and every `@param`/`@returns` in those files, was
a dead comment. Upstream never hits it because its
`tsconfig.authoring-contract.json` includes `authoring/**/*.mjs` + `authoring/**/*.ts`, and `*.ts`
does not match `.d.mts`.

The fix is one entry — `**/*.d.mts` in `exclude` — chosen over upstream's include-shape because it
also covers `authoring/doctypes/*/parse.d.mts` (which had the same hazard, live, in the same slice)
and any future `api/**/*.d.mts` without a second edit. The `.d.mts` files cannot simply be deleted:
`authoring/index.d.ts` re-exports value bindings from `./*.mjs` and a downstream build without
`allowJs` needs them to resolve. **Verified by mutation, not by reading**: all 8 parsers now enter
the program, and changing `integrations: z.array(z.string())` to `z.array(z.number())` fails with
`TS2344: Type 'false' does not satisfy the constraint 'true'` at the assertion plus an independent
`TS2322` at the `return result.data` line; reverting is clean. The general lesson is the one this
port keeps relearning — **a lock you have not watched fail is not a lock** — with a sharper edge
this time, because the thing that disarmed it was a file-resolution rule, not a mistake anyone made.

**A third instance of the stale-rename class.** Alongside the known `xds-*`/`astryx-*` and
`Astryx*.tsx`/`XDS*.tsx` pairs, `component/type.ts` twice says a name is the "full export name
**including** the Astryx prefix" and gives `"TableRow"` → `"Astryx Table Row"` as a `displayName`
example. All three are false against upstream's own files (`Button.tsx`, `TableRow.tsx`, and a real
`displayName: 'Table Row'`). Corrected rather than replicated, on the same reasoning as the other
two: it is rename residue, not a documented API.

**Two test divergences, both named in their files.** `project.test.mjs`'s `issues() dedupes` and
`issues() validates unvisited` are **refixtured** from `brokenComponent` (which needs slice 4's
`checkComponents`) onto a **missing contribution root**, which `checkRoots` already reports. The
property under test is unchanged; only the issue that populates the set differs. Left as-is they
would have been _vacuous_ — a stubbed `components()` returns `[]`, so every "is absent" assertion
passes for the wrong reason. And `integrations.test.mjs`'s `resolvePackageDir` case compares
against `path.resolve` where upstream compares against `path.join`: the two agree on POSIX, so
upstream's form passes in CI and fails **only on a Windows dev machine** — a false negative about
correct code.

**Left open by this slice:**

- [ ] **`authoring/index.d.ts` under-publishes.** Upstream's barrel omits six types reachable from
      ones it does export. Two were added because omitting them makes the published surface
      unusable — `PostCodemodCommand` (the return of `PostCodemodHook.buildCommand`) and
      `XleComponent`. The remaining four — `SubComponentDoc`, `ComponentRef`, `ComponentBaseDoc`
      and the three `*TemplateDoc` bases — are recorded rather than fixed, for an
      `astryx-surface` sweep to decide as one question
- [ ] **`codemod/type.ts` ports lines 1–77 only.** Six types are deferred to slice 9, not three:
      `CodemodTransform`, `CodemodTransformApi` and `JscodeshiftFactory` are jscodeshift-bound, and
      `CodemodEntry`, `CodemodRunResult` and `CliLog` are runner infrastructure that slice 9 will
      redeclare against the `magic-string` + `svelte/compiler` surface. `AstryxCodemodApi.jscodeshift`
      survives as `unknown` for parity, with a note that it is the wrong tool here and nothing
      populates it
- [ ] **`ComponentSlotElement` is ported verbatim and unresolved.** It serialises React's
      `createElement`; Svelte 5 has no synchronous element factory. Its only consumer is the docs
      playground, so the decision belongs with that work, not with the CLI. No mechanism was
      invented — the type carries a `TODO(playground)` naming the ambiguity, and its one referrer
      was reworded to stop asserting `createElement`
- [ ] **A zod-major bump would silently break one doctypes case.** "Rejects an empty name with a
      readable message" passes only because zod 4 collapses a union failure to the shared branch
      issue, surfacing `name is required` rather than a bare `Invalid input`. Upstream pins the same
      `^4.4.3`, so this is parity rather than luck — but it is behaviour no assertion pins down

### `validate-integration` — the port's second real command, landed 2026-08-08

Taken out of slice 7 and landed early, because it turned out to need nothing slice 7 owns: its
whole dependency set — `path-safety`, `module-loader`, `findManifestPaths` / `loadManifestObject` /
`resolvePackageDir`, `jsonOut`, the formatters — was already on the ground after slices 1–3.
**267 tests + 17 todo across 22 files.**

- `api/integration/validate-integration.mjs` completed from the slice-3 fragment: `validateAtPackageDir`,
  `validateLocalIntegration`, `validateInstalledIntegration`, `validateIntegration`,
  `summarizeIssues`, plus `validate-integration.type.mjs`. **The manifest half is now complete** —
  presence, uniqueness, schema, roots-inside-package, roots-exist — which is every way an
  integration can be wrong _about itself_. The three contribution checks stay deferred to slices
  4 / 6 / 9, named at their call sites.
- `clients/cli/commands/validate-integration.mjs` registered, with **registry entry + `JSON_SUPPORTED`
  name + `RESPONSE_TYPES` row + `EXAMPLES` added together**, which is what slice 1's bidirectional
  drift guard requires. `manifest --json` now advertises the command, its `integration.validate`
  response type and its examples, so the agent-facing contract is real rather than declared.
- Verified by driving the binary, not only the suites: no-manifest prints guidance at **exit 0**; a
  missing root emits `missing_root` at **exit 1**; and `validate-integration ../evil --json`
  degrades the path-safety throw into an `invalid_package_spec` diagnostic instead of a raw stack.
  That last one is the reason the guard exists and the only way to see it work.

**Case parity 17/17 across the two suites, with 4 deferred.** One of those four is worth naming:
"reports no errors for a valid component" **would pass today** — asserting zero `invalid_component`
issues is trivially true when nothing can emit one. It passes for the wrong reason, which is worse
than not running, because it would report a check as working that does not exist. Same call as the
two refixtured `project.test.mjs` cases.

- [x] **The no-manifest hint stays a fixed string — decided 2026-08-08, and the parity rule
      decides it.** The question was whether `formatCliCommand` should replace fixed command hints
      everywhere, since it would make them install-aware (`pnpm exec astryx-svelte …` vs
      `npx @astryx-svelte/cli …`). Measured instead of assumed: **upstream calls `formatCliCommand`
      at exactly 5 non-test sites** (`api/upgrade/status`, `api/upgrade/_adapter` ×3,
      `clients/cli/commands/build`, `clients/cli/commands/search`) and hard-codes the bare bin
      everywhere else — including this exact string (`clients/cli/commands/validate-integration.mjs:53`).
      Upstream's selectivity is the specification, so there is no repo-wide sweep to schedule and no
      decision left for slice 4 to make: **mirror upstream site by site**, renaming the bin and
      nothing else. A sweep would have made ~14 command hints diverge from upstream to no benefit

### Core ships 209 `.doc.mjs` — the slice 4/5 blocker, cleared 2026-08-08

Core shipped **0** doc files against upstream's **207**, and every doc-driven command reads them, so
slices 4 and 5 could not start. `docs/scripts/emit-core-docs.mjs` now emits them —
`pnpm -F docs emit-core-docs`, with `--check` wired as docs' `test` script.

It is **serialisation, not authorship**. `generate-content.mjs` already reconciles upstream's prose
against this port's compiler-derived types out of `packages/core/dist/**/*.d.ts`; the emitter
imports its `reconcile()` and reshapes the result. Nothing re-derives the reconciliation, which is
the one thing that must not happen twice.

- [x] **209 files, one per documented entry, named for the export and placed beside its source
      module** — `components/button/Button.doc.mjs`, `components/dropdown-menu/DropdownMenuItem.doc.mjs`,
      `hooks/useMediaQuery.doc.mjs`. Upstream's own file convention, kept even though our `.svelte`
      files are kebab-case, because it makes name → file a trivial function. **183 stamped
      `type: 'component'`, 26 `type: 'function'`** — the same split as the registry's 183
      Properties tabs and 26 hook pages, arrived at independently
- [x] **All 209 round-trip through the CLI's own `parseDoc`**, checked inside the emitter before a
      file is written and re-checked from outside afterwards: 209/209, no duplicate names, and
      every filename equal to its `name` field. That last one is the whole lookup contract. A doc
      the CLI cannot load is worthless, and this is the check that asks the real question rather
      than a proxy for it
- [x] **They ship.** `svelte-package` carries `.mjs` through untouched, so the tarball has **418** —
      209 under `src/` and 209 under `dist/` — and `assert-core-ships-src.mjs` still passes
- [x] **No dependency cycle was created to win a type annotation.** Upstream's docs annotate
      themselves `/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */`, which here
      would make `packages/core` devDepend on `@astryx-svelte/cli` while the CLI's own tests read
      core. The files are emitted unannotated; correctness is enforced by running `parseDoc` at emit
      time instead, which is a stronger check than an annotation anyway
- [x] **Four fields survive normalisation solely because the emitter reads them** —
      `subComponentOf`, `hiddenComponents`, `relatedComponents`, `relatedHooks`. The props-page
      audit had dropped all four because the site renders none of them, and that reasoning still
      holds for the site: `projectForSite` strips them, so `component-registry.js` is byte-identical.
      **26 docs carry the related lists, matching upstream's 26 exactly**
- [ ] **Ten entries are emitted without their `examples`, and upstream has them** —
      `AvatarGroupOverflow`, `CheckboxListItem`, `DialogHeader`, `Field`,
      `InternationalizationProvider`, `Markdown`, `Outline`, `useTableRowExpansion`,
      `useTableSelection`, `useTableTreeData`. `ComponentBaseDoc.examples` is a real field and
      upstream's CLI renders it after the props table, so this is a **gap, not a tidy-up**. It is
      dropped because upstream's `code` is JSX — a React function component,
      `<Field status={{type: 'success'}}>`, `defaultValue` — where this port's own
      `ComponentExampleDoc.code` is documented as "Svelte source for the example". Emitting it
      verbatim would ship React as this CLI's answer to "show me an example", the `Button.icon`
      mistake CLAUDE.md names: upstream's prose is reusable, upstream's _code_ is not. Ten
      hand-translated Svelte examples is the fix. **The deferral cannot rot** —
      `UPSTREAM_EXAMPLES_NOT_PORTED` is exact on the class oracle's `skip` rule and the run fails if
      an entry starts or stops carrying examples; **both directions mutation-checked**

**The silence was the defect, not the drop.** The first cut of the emitter dropped `examples` with
no note anywhere — no constant, no comment, no count — which is indistinguishable from not having
noticed. Refusing upstream's JSX is right; refusing it invisibly is how a gap becomes folklore.

### Phase 4 is complete — every slice landed 2026-08-09

**14 commands** — `build`, `component`, `discover`, `docs`, `doctor`, `init`, `layout`, `search`,
`swizzle`, `template` (+`add`), `theme`, `util` (+`hook`), `upgrade`, `validate-integration` — plus
`manifest`. That is upstream's whole surface bar `blog`, which stays deferred.

**1,932 tests + 27 `it.todo` across 103 files**, from 267 + 17 across 22 at the start of the day.
`pnpm -r build`, `check`, `lint` all exit 0; the tarball is 218 files with **0** `*.test.*`.

Case parity is exact on every ported suite. The four suites written *beyond* upstream each declare
why at the top and are mutation-checked, per the bar `src/tests/layer-attribute-repair` set:
`swizzle.svelte-adaptations`, `skeleton-svelte-ast`, `resolve-theme-loading` and
`runner-corruption-guards`.

**Three things could not be transcribed and were written instead**, each because the React
mechanism has no Svelte counterpart rather than as a preference:

- **`upgrade`'s codemod runner.** jscodeshift fuses editing (`toSource()`) with parsing (`j(result)`,
  the corruption guard) and cannot read `.svelte` at all. The two jobs split: `magic-string` splices
  the original buffer, `svelte/compiler`'s `parse` re-reads it. `magic-string` is the one dependency
  the whole phase added; `jscodeshift` never will be
- **`template --skeleton`.** Upstream's line scanner anchors on `export default function` … `return (`,
  neither of which exists in a `.svelte` file, so it would have emitted nothing at all
- **`swizzle`'s import rewriting.** Upstream's textual `../<dir>/<x>` → `<pkg>/<dir>` collapse rests
  on 123 per-component subpaths; this port publishes 10, so each specifier is resolved and
  classified against the owner's real `exports`

**What the slices found that no review would have.** Each was caught by writing the tests, which is
the argument for the case-for-case contract:

- **`.gitignore`'s bare `build` was silently excluding two whole slices** — `git check-ignore`
  confirmed `api/build/**` and `api/theme/build/**`, both upstream's own paths, were unstageable.
  The loss would have looked like nothing
- **`assets` was missing from `package.json#files`** — all 27 doc assets and 17 template assets sat
  outside the tarball, so a published `astryx-svelte docs` would have listed nothing
- **`doctor`'s peer-dependency check could not be tested at all.** Vite's resolver ignores
  `createRequire`'s `paths`, so three hermetic fixtures were reading the monorepo's own
  `node_modules` and passing for the wrong reason
- **Core's root barrel documents itself in prose**, and unanchored `export * from` regexes read the
  comments as code, indexing three directories a second time under the root specifier
- **Core emitted no prose reset for a theme with no type scale** — a one-token theme lost its
  `@layer reset` entirely. All 8 shipped themes declare `typography`, so the branch never fired and
  the oracles, which diff declarations rather than their absence, could not see it
- **`api/index.mjs` was under-exported by three separate slices**, because **nothing guards that
  barrel** — upstream has no test for it either

### What is left, and none of it is a slice

- [ ] **146 upstream codemod assets stay deferred, and should stay deferred permanently in their
      present form.** Every one is a jscodeshift transform over `.tsx` migrating *React* source
      between React Astryx versions. The first real registry entry belongs to this port's second
      release, written against the `magic-string` + `svelte/compiler` api
- [ ] **1,329 template assets and 43 page templates stay deferred.** `template --list` therefore
      shows nothing from core, and `init --features template` returns `skipped`. Everything around
      it is live and tested — integration-contributed templates and external-package blocks are
      discovered, listed, shown, skeletonised and scaffolded — which is also what makes
      `component --showcase`, `search --type template` and `layout`'s `{hint}` catalog work now
- [ ] **`blog` (7/5) is not ported.** It needs content this port does not have
- [ ] **`components.lock.json` with per-file content hashes** — still not started
- [ ] **The 27 remaining `it.todo`s do not name a slice any more.** Nine wait on this port cutting a
      **second release** (a codemod migrates *between* two versions, and there is one); the rest
      wait on the deferred assets. Both are content, not code

### The original slice sizing

Kept for the record. Sized as `source files (tests)` at v0.3.0, ordered so each unblocked the next.

| #   | Slice                                                                              | Files   | Notes                                                                                              |
| --- | ---------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| ~~2~~ | ~~**Foundation II** — `fs/` (paths, path-safety, module-loader), `env/semver`, `text/`~~ | 5 (8) | **Landed 2026-08-08** — see above. Sized 7 here; 5 sources, since slice 1 had already taken two |
| ~~3~~ | ~~**Authoring + config** — `authoring/`, `foundation/config/`, `foundation/integrations/`~~ | 37 (10) | **Landed 2026-08-08** — see above. Sizing held exactly; `Project` landed whole with only its three discovery bodies deferred |
| ~~4~~ | ~~**`component` + `util` (+`hook` alias)** — incl. `foundation/discovery/`~~ | 18 (14) | **Landed** — 16 suites, 179 cases, exact parity |
| ~~5~~ | ~~**`docs` + `search` + `discover`**~~ | 16 (11) | **Landed** — 94 cases, and all 27 doc assets rewritten, none deferred |
| ~~6~~ | ~~**`template` (+`add` alias) + `theme list\|add`**~~ | 13 (8) | **Landed** — split: 6a template (41 cases + 4 beyond), 6b themes with 8 |
| ~~7~~ | ~~**`swizzle` + `init` + `doctor`**~~ | 17 (13) | **Landed** — 177 cases + 4 beyond. `validate-integration` had landed early |
| ~~8~~ | ~~**`theme build` + `build` playbook**~~ | 12 (11) | **Landed** with 6b — `build` is a composition assistant, not a compiler |
| ~~9~~ | ~~**`upgrade` shell**~~ | 7 (6) | **Landed** — the runner is written, not ported. `magic-string` declared |
| ~~10~~ | ~~**`layout` / XLE**~~ | 17 (5) | **Landed** — 72 cases; the oracle is `svelte/compiler`, stronger than upstream's |
| —   | _deferred_                                                                          | —       | `blog` (7/5); 1,329 template assets; 146 codemod assets — transcription rather than porting          |

One dependency note left for scheduling: slice 9 needs **`magic-string`** declared (jscodeshift is
explicitly not being ported — it cannot parse `.svelte`). **`jiti` is declared as of slice 2** —
`module-loader`'s `.ts` branch forced it a slice or two earlier than this line anticipated. Upstream
declares both `jiti` and `jscodeshift`; we now declare the first and never will the second.

**Slices 6 and 8 have a blocker of their own, found 2026-08-08 while sizing them: plain Node cannot
load this port's theme packages at all.** Upstream's `clients/cli/lib/resolve-theme.mjs` loads a
theme with `createRequire()` and reads `variants` / `fonts` off it; `theme list|add` (slice 6) and
`theme build` (slice 8) all rest on that. Ported verbatim it would return `null` for **every theme
this port ships**, and silently — `tryLoadModule`'s bare `catch` turns a resolution failure into
"no theme configured". Both loaders fail, for two unrelated reasons, and each was reproduced rather
than reasoned about:

- **`require()` → `ERR_PACKAGE_PATH_NOT_EXPORTED`.** Every theme's `exports["."]` declares `types`,
  `svelte` and `import` and **no `require` condition**, so resolution fails before Node 24's
  require(esm) support is even reached. This is the failure upstream's `catch` swallows.
- **`await import()` → `ERR_UNKNOWN_FILE_EXTENSION`.** The built entry's first statement is
  `import { neutralIconRegistry } from './icons.svelte'`, so the token object is only reachable
  through a module plain Node cannot parse. **All 8 themes** do this (`butter`, `chocolate`,
  `gothic`, `liquid-glass`, `matcha`, `neutral`, `stone`, `y2k`) — it is the icon-registry design,
  not one theme's accident. Upstream's themes are plain token objects and have no analogue.

So the CLI needs a path to a theme's tokens that does not drag in a Svelte component: a `./tokens`
subpath that stops short of the icon registry, reading the built `dist/theme.css`, or a jiti loader
with a `.svelte` stub. **Decide it at the top of slice 6, not inside it** — `resolveTheme`'s
signature going async ripples through every caller in both slices.

### Still open from the original checklist

- [ ] Commands identical to upstream: `docs`, `search`, `discover`, `doctor`, `theme *`, `validate-integration`
- [ ] Adapted: `component` (props + snippets), `template` (`page.tsx` → `+page.svelte`), `swizzle`, `init`
- [ ] Rename `hook` → `util` with `.alias('hook')`; add `.alias('add')` to `template`
- [ ] `upgrade` with the full contract (dry-run default, corruption guards) but a `magic-string` + `svelte/compiler` runner (jscodeshift can't parse `.svelte`)
- [x] **CI assertion on `package.json#files`** — **landed 2026-08-08** as
      `packages/cli/scripts/assert-core-ships-src.mjs`, wired as the CLI's `test:core-src` and
      chained into its `test` script the way core chains `test:parity`. It asserts against what
      `npm pack --dry-run` would really publish, not against the `files` array read literally —
      the array is the input to the question, not the answer. Four checks: every non-test file
      under core's `src/lib` is in the tarball (**691 of 691**), the barrel and `base-props` are
      there, `dist/index.{js,d.ts}` are there, and no `*.test.*` leaked. **Mutation-checked**:
      setting core's `files` to `["dist"]` fails it with all 691 named, and it passes again on
      revert. Two implementation notes worth keeping — it must **not** be phrased as "every
      component dir ships `<name>.svelte`" (`chat/`, `nav-menu/`, `resizable/` are families with no
      same-named root and `nav-item/` has no component at all, so that phrasing fails on four dirs
      today), and on Windows `npm` is a `.cmd` shim that Node refuses to spawn without a shell
      since the CVE-2024-27980 fix — POSIX takes `execFileSync` with an args array, Windows a
      static command string
- [ ] **Core ships its demo routes to consumers.** The assertion above surfaced it: core's tarball
      is 2,356 files, of which `src/lib` is 691 — the other ~286 `src/` entries are `src/routes`,
      the SvelteKit demo app, plus the app shell files around it. Upstream ships `src` wholesale
      too, but upstream's `src` has no demo app in it (their stories live elsewhere), so this is a
      port artifact rather than parity. A `"!src/routes"` negation is the whole fix. Left alone
      here because it changes published content and this slice was not the moment; it should ride
      with the release checklist rather than a CLI slice
- [ ] `components.lock.json` with per-file content hashes
- [ ] Drop `"private": true` from `packages/cli/package.json` — **only** when the CLI is genuinely usable

---

## Phase 5 — Docs site (the current goal)

Per `research/04`: **278 pages**, no MDX. Content comes from executable `.doc.mjs` modules,
specified by `docs-types.ts`.

### The props-page audit — 2026-08-08

An end-to-end audit of the component **properties** tables. The headline is that the generator's
own drift report said **0 documented props core does not declare** while 85 rows across 15 pages
rendered the "not declared by core" disclaimer — the number was not merely stale, it was
structurally unable to see the case it exists for. Nine defects, all fixed and re-verified against
a regenerated registry; the index moved **417 → 457 interfaces** and the honest drift count is now
**5**.

- **`isPropsLike` never indexed `*Config`, and `propsTypeNamesFor` asked for three `Config`
  spellings.** That lookup could never hit. The cost was the entire Table plugin API — 15 hook
  pages, 85 rows — every one telling the reader its type was unverified while core declared
  `UseTableSortableConfig`, `UseTablePaginationConfig` and 16 more all along. One `endsWith`.
- **The drift report guarded on `realTypes &&`, so it could see a component declaring 22 of 23
  props and not a hook declaring none of 11** — exactly inverted, since the second is the larger
  gap. That is what produced the 0.
- **Four components documented the wrong callback**, because candidate spellings were tried
  lowercase-first and a props interface extending Svelte's HTML attributes inherits `onchange` /
  `onclick` for every element — so the DOM handler shadowed the component's own camelCase prop.
  `PowerSearch.onChange` is `(filters, changeType, index) => void`; the page showed
  `FormEventHandler<T> | null` **and marked it Required**, so the wrong signature read as the
  primary API. Trying the authored name first fixes all four and leaves the other 33 collisions
  resolving as before.
- **33 rows across 30 entries rendered "upstream: onChange" underneath a prop named `onChange`** —
  `EVENT_PROP_RENAMES` renames unconditionally, before anyone knows whether core declares the
  renamed spelling, and the guard only ever *added* `renamedFrom`, never removed it.
- **`Table.idKey` rendered as syntactically invalid TypeScript.** The outer-paren strip was a
  greedy, balance-unaware regex, so `(keyof T & string) | ((item: T) => …)` came out with its
  first `(` and last `)` removed from the middle of the union.
- **`Selector.hasClear` and `NumberInput.hasClear` rendered `false`,** not `boolean` — a
  synthesised union property carries one declaration per arm and the first was taken as the whole
  type. A reader concludes the prop cannot be enabled.
- **Two pages cited a props interface that does not exist** (`useImperativeDialogProps`), because
  the caption name was synthesised as `<Name>Props` rather than being the candidate that actually
  matched. Naming a declaration a reader cannot find is worse than naming none.
- **Hook returns were never checked against the compiler at all**, and guessing type names could
  not have fixed it: `useMediaQuery` returns `MediaQueryState`, `useScrollOverflow` returns
  `ScrollOverflow`. They are now read off the **call signature**, which cannot miss. Two things
  fell out — every `*Ref` member upstream returns is an `attach…: Attachment<HTMLElement>` here, so
  those rows had been advertising members this port does not have; and context hooks return
  `() => Value`, so one getter level has to be unwrapped or the whole surface reads as missing.
- **The `ref` note gave one answer for three different translations.** `handleRef` is an imperative
  handle (this port publishes instance exports), a hook's `*Ref` is an attachment, and a component's
  `ref` needs the rest-props attachment because `bind:this` on a component yields the instance
  rather than its element. Each has its own note now.

**Process, and the reason this could sit unseen:** `vite-plugin-content.mjs` passes `quiet: true`
on *both* its paths, so the drift report printed only on a direct `pnpm -F docs generate` and never
during `pnpm dev:docs` or `pnpm -F docs build`. Combined with the guard above, that is two
independent reasons a real gap could ship. The report is now `console.warn` and survives `quiet`.

- [x] **The 5 drift rows are closed, and the diagnosis in the first draft of this entry was
      wrong.** It read them as "the port returns a value where upstream returns a single-member
      object". **Upstream returns them bare too** — `useToast.tsx:170` returns `ShowToastFn`,
      `useTranslator.ts:43` returns `TranslatorFn`, `useEntryAnimation.ts:119` returns
      `StyleXStyles | null`. What they actually share is that **`HookDoc.returns` is a _table_, so
      a hook returning a bare value still needs a name in the Field column and the `.doc.mjs`
      invents one** — the row is a label, not a member, and the port matches upstream exactly.
      `useStreamingText` is the one real divergence and it runs the **other way**: upstream returns
      a bare `string` (`useStreamingText.ts:94`), this port returns `StreamingTextState`, because a
      string cannot stay live across a Svelte component's lifetime — the port _added_ the wrapper.
      `useTableFilterState.initialState` is the hook's argument documented in a props table,
      because its entry is authored as a `ComponentDoc`. Each row now carries an entry-scoped note
      (`ENTRY_ROW_NOTES`, keyed `<entry>.<row>` because `value` and `initialState` mean something
      else on every other page), and a note that stops matching **fails the run**, on the class
      oracle's `skip` rule. Nothing was silenced: 5 → 0 with the check unchanged
- [x] **Hook `params` are reconciled against the signature's parameter list.**
      `parameterTypesForFunction` resolves the three shapes upstream's hook docs use — a positional
      parameter by name, a dotted `options.field`, and the fields of a sole options object listed
      flat — reusing the getter unwrap, since every options parameter here is `() => UseFooOptions`.
      **114 of 114 param rows now come from the compiler; 0 fall back to the mapper.** Four things
      it surfaced: the getter convention reaches the page at last (`useMediaQuery.query` is
      `() => string`, not `string`); `useClickableContainer.options.onClick` is really `onclick`
      and was _reported_ before it was fixed, which is the proof the reporting path works;
      `containerRef` / `interactiveRef` / `inputRef` are `container` / `interactive` / `input`,
      because this port takes the element from `bind:this` where upstream takes a ref object — and
      the generic `Ref$` note would have described them wrongly, since it is about a hook's
      _return_ being an attachment; and `useLayer.mode` was about to render as `'context'`, the
      first of two overloads, so member types are now unioned across overloads to give upstream's
      own `'context' | 'fixed'`
- [x] **The unrendered fields are resolved per field, not in bulk** — registry **850,946 → 703,975
      bytes (−17.3%)**, and the emitted row shape is now an explicit allowlist (`finaliseRow`)
      rather than a `...prop` spread, so the leak cannot recur. `correctedFromUpstream` is
      **rendered**. `typeNotes` is **dropped and was right on none of its 287 rows**: 244 sat on
      compiler-typed rows describing a rewrite that never ran — `AppShell.children` read
      "Renderable slots accept a string or a snippet" beside a declared `Snippet`, the exact
      `Button.icon` mistake CLAUDE.md warns about — and all 43 of the rest already carried a more
      specific `unsupported` note. `slotElements` is **dropped**: upstream reads it only from the
      playground (`parsePropType`, `PlaygroundPropsTable`, `interactiveState`), and it is a
      serialised React `createElement` argument. `upstreamType` is **kept only on `unverified`
      rows** (33.1 KB → 1.4 KB) and rendered there, where the displayed type _is_ the mapping.
      Entry `examples`, `relatedComponents` / `relatedHooks` and `subComponentOf` are **dropped** —
      upstream renders examples from its block registry, reads the related lists only in `/mcp`,
      and references `subComponentOf` nowhere. **`theming` is the one kept unrendered, and on
      purpose**: upstream really does render it (`component-detail/Theming.tsx`), so it is input to
      planned work, and `types.d.ts` says so on the field
- [x] **`component-groups.js` was a second full copy and the bundler does not dedupe it** —
      confirmed by grepping the built client, where one entry description appears in both the
      registry chunk and the root-layout node. It is now a slim `{name, displayName}` index:
      source **763,862 → 26,318 B**, root-layout chunk **587,294 → 35,622 B raw** and
      **137,979 → 9,172 B gzip (−93%)**, total client JS **4,643,180 → 4,091,508 B**. Both builds
      measured on the same registry

**Where the props tables now stand:** 1,876 rows, **0 mentioning a React type**, 56 unverified and
**all 56 explained** (was 51 of 56), 114 of 114 hook params compiler-typed, drift **0**.

- [ ] **`nodes/0` still pulls the 562 KB registry chunk into the root layout**, through
      `top-nav.svelte` → `search-palette.svelte` → `search-index.ts`. The search index reads
      `name`, `displayName`, `keywords` and `description`; it wants the same slim-projection fix
      the sidebar just got, one level up
- [ ] **Render the Theming section** — upstream's `component-detail/Theming.tsx` plus
      `themingHelpers`: a targets table keyed as `defineTheme` config keys, a copyable
      `defineTheme` example, and a themeable-vars table. The data is already generated
      (`ComponentEntry.theming`, 17.3 KB); it needs `Table` and the helpers. This is the only
      generated-but-unrendered field left, and the only one that is deliberate

### The Properties tab is a playground — 2026-08-08

Upstream's Properties tab is not a table; it is a **live preview over an editable table**, and the
port had only the table. `ComponentPlayground` is upstream's `InteractivePreviewStage` over
`PlaygroundPropsTable`: a sticky preview, a control per editable row, and a `<>` toggle emitting
**Svelte** where upstream emits JSX.

- [x] **Driven over all 183 Properties tabs in a real Chromium**, and classified rather than
      spot-checked: **130 render a live component**, 29 show the missing-required note, 9 the
      "documents a hook" note (the `useTable*` entries upstream authors as `ComponentDoc`s), 8 the
      empty-slot note, 4 surface the component's own error through `<svelte:boundary>`, 3 render
      nothing without erroring. **0 console errors across all 183.** The 8 slot cases recover the
      moment `children` is typed into — the boundary resets on change, as upstream's does
- [x] **1,222 of 1,665 prop rows get an editor** — string 374, boolean 285, enum 256, snippet 184,
      number 123. 162 are callbacks, which get no control (as upstream gives none) but a no-op seed
      when required; 281 stay read-only. Seeding order is `playground.defaults` → the documented
      `default` → a required fallback, and code generation **omits any prop still at its default**
- [x] **The stage never touches the prerender.** `tab` starts at `overview` and only an effect
      adopts `?tab=`, so the 209 prerendered pages contain no stage markup at all
- [x] **`playground` reaches the registry** — 59 of 209 entries (67 authored upstream; 8 lose
      everything to the descriptor drop below), 58 with defaults, 6 `wrapper`s, 2 `overlay`s,
      ~8.5 KB. Normalised through an allowlist (`normalisePlayground`), on `finaliseRow`'s rule
- [x] **Alias unions of _numeric_ literals are now expanded like the string ones**, 32 rows. This
      touches the audited Type column and is a parity **fix**, not a liberty: `Heading.level`
      printed `HeadingLevel` where upstream's own `.doc.mjs` prints `1 | 2 | 3 | 4 | 5 | 6`
      (`Text/Heading.doc.mjs`, verified byte-for-byte), and the unexpanded alias also hid the
      members from the control derivation, so the row got no `<select>`
- [x] **`--color-background-page` is upstream's token and is undefined by this port's themes.**
      Nothing in `packages/themes/*` declares it; the defined name is `--color-background-body`.
      Copying upstream's sticky-stage rule fails **silently** — the pinned stage stayed transparent
      with table rows scrolling through the previewed component, and nothing in the console
- [ ] **The Required badge is the doc's, the type is the compiler's, and they disagree on 31 rows.**
      Core declares them non-optional where upstream's `.doc.mjs` does not mark them required
      (`Center.children`, `List.children`, `AppShell.children`, `VisuallyHidden.children`,
      `Badge.label`, `Tooltip.content`, `DropdownMenuItem.label`, …). Eight are the slots that make
      the preview throw, because React renders an absent `children` as nothing where
      `{@render children()}` throws. Whether the badge should follow the compiler is a props-table
      question, not a playground one
- [ ] **Slot defaults upstream authors as `ElementDescriptor`s are dropped** — 36 of 149, all on
      slot props (`Card.children`, `Popover.content`, `AppShell.topNav`). A serialised React
      `createElement` argument cannot become a `Snippet`; the same reason `slotElements` went. Those
      previews seed empty and the text control fills them. Rendering them needs a recursive
      descriptor component _and_ a way to build a snippet per prop name at runtime
- [ ] **Four upstream controls have no counterpart here**: the `theme` and `syntax-theme` selectors
      (which is why `Theme` and `SyntaxTheme` are 2 of the 4 hard failures, alongside
      `DropdownMenuRadioItem` and `OverflowList`), `input-status` (16 rows typed `InputStatus`), and
      the `element` / `slot-list` add-remove controls
- [ ] **The component pages now pull the whole barrel** (`import * as core`), as upstream's
      `resolveElements` does: total client JS **4,104,106 → 4,196,460 B (+92 KB, +2.2%)**. A lazier
      `import.meta.glob` over core's component modules would trade it for a per-preview fetch
- [ ] **Only the `isOpen` / `onOpenChange` pair is bridged back into the knobs** (upstream's
      `canControlOpenState`). Upstream also bridges any `on<X>Change` whose first parameter names a
      state key; here that parameter is usually `checked` or `next` rather than the prop's name, so
      the general rule would fire on almost nothing

### Sidebar, gallery and upstream's package name — 2026-08-09

Three reader-visible defects, one shared root cause between the first two.

- [x] **Sub-components never inherited their family's fields across files, so 115 sidebar entries sat
      flat and 79 components were missing from the gallery entirely.** `SubComponentDoc` says it in
      as many words — family fields "are inherited from the directory's primary doc" — and upstream
      relies on it: `AvatarGroupOverflow.doc.mjs` declares `subComponentOf: 'AvatarGroup'` and leaves
      `group` and `category` **undefined**. `flattenDoc` did the inheritance for members written
      _inline_ in a parent's `components[]`, where the parent is in scope, and could not do it for
      the ~80 upstream extracted into their own files. So `AvatarGroupOverflow` and `AvatarStatusDot`
      rendered as siblings of `Avatar` instead of inside it, and all 14 Chat sub-components, 7
      Command Palette, 6 Dropdown Menu and 4 Table entries did the same. The gallery buckets by
      `category` and silently dropped everything without one. `inheritFamilyFields` runs after every
      doc is loaded, when the parent is finally knowable: **sidebar 149 flat entries → 72 groups**,
      **components with no category 79 → 0**, 81 emitted `.doc.mjs` files changed. `theming` and
      `playground` are named in that same sentence and deliberately **not** inherited — they are the
      primary member's own prose, and a sibling inheriting the parent's playground seed would render
      the parent's props
- [x] **A parent doc with no props of its own was dropped, taking its name with it.** 16 upstream
      docs declare only `usage` + `components[]`; 12 name themselves in `components[]` and were
      fine. The other four are `Chat`, `Layer`, `Resizable` and `Stack` — and **`Stack` and `Layer`
      are real exports** (`components/stack/stack.svelte`, `components/layer/layer.svelte`), so the
      gallery, the sidebar and the CLI were all missing a component core ships. `astryx-svelte
      component Stack` printed **HStack's** doc, because the CLI's directory walk landed on a
      sibling. Registry **209 → 211**. `Chat` and `Resizable` are group labels core does not export
      and the surface filter drops them with no special case. Restoring `Stack` also surfaced **3
      example blocks with no Svelte rewrite** (`StackAlignment`, `StackDirections`, `StackFillItem`)
      — written, so the counter is back to **629 ported / 0 pending**
- [x] **Upstream's package name reached real CLI output.** `Button`'s guidance said "use IconButton
      from `@astryxdesign/core/IconButton`", and `astryx-svelte component Button` printed it — 16
      occurrences across 8 docs, on both surfaces, because both read the same reconciliation.
      Reusing upstream's prose is the design; reusing its **import specifiers** is not. A scope-only
      rename would have been wrong too: upstream publishes a subpath per component (`/Button`,
      `/IconButton`, `/Table`, `/Calendar`, `/DateRangeInput`) and this port publishes none of them.
      `rewriteSpecifiersIn` reads core's own `exports` and keeps a mapped subpath only when core
      really has it, collapsing the rest to the root barrel — reading the export map rather than
      listing survivors is what keeps it correct when core's subpaths change.
      `assertNoUpstreamSpecifiers` then fails the run on any survivor; **mutation-checked**
- [x] **The rewrite made one sentence contradict itself, and that needed a second mechanism.**
      Collapsing both of upstream's subpaths onto the root barrel left Button asserting that a
      package both does and does not export IconButton. The fact underneath differs too — here both
      are on the root barrel — so the honest sentence is not upstream's with names swapped.
      `PROSE_CORRECTIONS` matches **after** the rewrite and **fails the run when its sentence stops
      matching**, on `DOC_CORRECTIONS`' rule; **mutation-checked in both directions**
- [ ] **`AvatarGroup`'s preview renders a box containing the word "children", and that is upstream's
      behaviour.** Its doc declares no `playground`, so the required `children` snippet falls to
      `requiredFallback`, which seeds a prop's own name — upstream's `getRequiredFallbackValue` does
      exactly this. It reads as broken rather than as a placeholder because the component is tiny
      inside a 400px stage. Changing the seed is a **divergence from upstream** and should be
      decided as one, not slipped in; the alternative that is not a divergence is rendering the
      `ElementDescriptor` slot defaults (36 of 149, already tracked above), which is what upstream
      actually uses to fill these previews

### The docs cascade was inverted, and it hid four fixes — 2026-08-09

- [x] **`@layer product` and `@layer astryx-theme` sat _before_ StyleX's `priority1…9`, so every
      docs-chrome and theme-`components:` rule that collided with an atomic class was inert.**
      Upstream never has this: its docsite consumes `@astryxdesign/core/astryx.css` wholly inside
      `@layer astryx-base` and compiles only its _own_ StyleX into priority layers. This port
      compiles core itself, layer order is order of first appearance, and StyleX's sheet is
      injected last — so its nine layers landed after everything. Proven by injection rather than
      inferred: the same rule in `@layer product` computes `0px`, unlayered computes `48px`.
      `app.html` now declares the order first. **Four silent consequences, all measured**:
      `#astryx-app-shell-main` `padding-top` 0 → **48px**, so `h1` moved y=72 → **120**, upstream's
      exact value; the theme's `top-nav-item.selected` override finally applied and the pill went
      `rgba(223,226,229,0.2)` → **`rgba(0,0,0,0)`**; the hero chevrons went `display:flex` →
      **none**; the `pagination-dot` ring reached the dots, `border-width` 0 → **2px**
- [x] **The nav pill was not invented surface — that first reading was wrong.**
      `astryx-theme-config.ts` had ported upstream's `backgroundColor: transparent` correctly all
      along; the rule was simply losing to `x17x4s8c{background-color:var(--color-neutral)}`. The
      comparison that produced the wrong diagnosis also put our **dark** mode against upstream's
      **light**
- [x] **Section headings were 20px against upstream's 29px** — upstream's `AnchorHeading` passes
      `type="display-3"` and this page passed none, which is what made every topic read flat.
      Section gap 12px → **16px**; prose line-height 27.2px → **28px**, because `.prose` set
      `line-height: var(--line-height-body, 1.6)` and **no theme in this repo declares that
      property**, so every paragraph in 20 topics took the fallback
- [x] **`Table` and `List` had landed and three files still said they had not.** Plain `table`
      blocks are now upstream's `TableBlock` (`Card` → `Table`, hover, the `Name`-column icon
      branch); **49 tables across 20 topics carry a scroll wrapper**. 12 best-practices sections
      render through upstream's `isBestPracticesSection` shape (one Card+Table, Guidance 100px /
      Practices). The **3 mixed** sections lose their badges, and that is parity: upstream's
      `/docs/layout` "Cards vs Rows" renders **0 `.astryx-badge`** — ours was invented decoration
- [x] **The clipped token value was `white-space: nowrap` kept on a stale justification.** The note
      claimed the scroll wrapper carries the overflow; it cannot — `Table`'s `min-width` is the sum
      of _declared_ column widths, so a nowrap cell overflows into `overflow: hidden` while the
      table itself still fits. At 1000px: `--color-neutral` 417px cell over 450px content, 33px
      cut, no scrollbar. Deleting it restores the component's own `word-break`, which is
      upstream's. **1 clipped cell → 0.** At 390px both sides clip and **upstream clips worse — 87
      here against 158 there** on identical geometry; left as an upstream debt
- [x] **The light→dark flash was persistence without a pre-paint stamp.** Upstream has no flash
      because it has no persistence (`providers.tsx`: a correct manual toggle needs a server
      cookie). This port added `localStorage` and read it in `$effect.pre` — after first paint, and
      unreadable during SSR. Measured with a light OS and a stored `dark`: `data-theme` null and
      background `rgb(248,244,237)` for the whole pre-hydration window. `app.html` now stamps
      `<html data-theme>` before paint; after, it is dark from the first sample. A reader with no
      stored preference is untouched, and a dev assertion fails if the two storage keys drift

**Verified independently of the agent that did the work**: `h1` y=**120**, main padding **48px**,
`h2` **29px**, nav background **`rgba(0,0,0,0)`** at weight 600, **0** clipped cells, **12** scroll
wrappers, **0** body horizontal scroll. 66 production page loads (11 URLs × 3 widths × 2 themes), 0
console errors. Client JS **+558 B (+0.013%)**.

- [x] **`/docs/cli`, `/docs/core` and the `Libraries` sidebar group landed — and the blocker was
      never the page, it was that there was no content.** The root `README.md` and
      `packages/cli/README.md` **did not exist**, and `packages/core/README.md` was 65 lines of
      stock `sv` scaffold opening "Everything you need to build a Svelte library". All three are
      written (72 / 543 / 276 lines): upstream's prose and section names reused, every code sample
      this port's. **Six things are said differently because upstream's are false here** — the
      consumer's bundler must run the StyleX compiler (upstream ships pre-compiled CSS and says
      "no build plugins, no PostCSS, no Babel config"), one stylesheet rather than three, no
      per-component subpaths, no UMD/esm.sh delivery, no Tailwind bridge, and `template --list` and
      the codemod registry are described as honestly empty rather than promised. The StyleX section
      sits **above** `## Quick Start` deliberately: upstream's own `CORE_STRIP_SECTIONS` strips
      Quick Start from the rendered page, and that is the one fact a reader must not lose
- [x] **`buildLibraryPackages` emits two modules, not one** — the `component-groups.js` lesson
      applied before it could bite. `package-registry.js` (635 B) is what the sidebar imports and
      therefore what the **root layout** pulls; the 43 KB of README markdown lives in
      `package-readmes.js`, dynamically imported by the page's `load`. Confirmed against the built
      client: no page preloads it. `assertNoUpstreamSpecifiers` covers the new path,
      **mutation-checked**
- [x] **Upstream assigns the README's heading ids in a commit callback ref; an attachment cannot,
      and the build is what said so.** Written that way first, `pnpm -F docs build` failed —
      `no element with id="…" exists on /docs/cli`. SvelteKit validates every `#fragment` against
      the HTML it prerendered, and it is right to: a deep link resolves before any of our JS runs.
      Ids are handed out **during** render through a context cursor keyed on the body, so a
      `/docs/core` → `/docs/cli` navigation cannot draw from an exhausted one
- [x] **The two `svelte-version-sync` `it.todo`s are closed** — CLI **1,935 → 1,937 passing,
      27 → 25 todo**. They were deferred because the surfaces they assert on did not exist; writing
      the READMEs is what made them assertable. Prerender **236 → 238 pages**; 12 production loads
      (2 pages × 3 widths × 2 themes) with 0 console errors, outline 17/4 entries and 0 broken
      anchors. Client JS **+49,509 B (+1.16%)**, of which 42,704 B is the README chunk nothing
      preloads; the `/docs/<slug>` route pays **+62,492 B** for `Markdown` joining its graph,
      measured against a controlled build with the package view stubbed out
- [x] **The release metadata is set — 2026-08-09.** All **10 packages** go to **`0.3.0`**, matching
      the upstream release this port is built against, and `private: true` comes off
      `packages/cli`. Every package gains `repository` (with its `directory`), `bugs` and
      `homepage` pointing at **`github.com/devrohit06/astryx-svelte`** — which closes the standing
      item that `issuesUrl()` returned `undefined` for every core-owned reference;
      `DEFAULT_ISSUES_URL` now resolves, verified by importing it
- [x] **Bumping the version made the READMEs lie, and the page is what showed it.** With
      `isReleased` flipping true, `Install v0.3.0` rendered directly above a callout still reading
      "`packages/cli` is `private` at `0.0.0`" — two contradictory claims on one screen, and the
      second was now simply false. Both READMEs and `getting-started.doc.mjs` are reworded to the
      one thing that is still true: the packages are versioned and **ready** to publish, and
      nothing resolves until the first `npm publish`. **This self-retires on publish** rather than
      on an edit — which is the property the previous wording lacked
- [x] **The repo shipped no LICENSE file at all, while all 10 packages declared `"license": "MIT"`
      — 2026-08-09.** A declared license with no text is the one governance item that is not
      cosmetic: MIT requires that "the above copyright notice and this permission notice shall be
      included in all copies", and this port is a derivative work that reproduces upstream's prose,
      token values, component APIs and test suites. **`LICENSE` now exists at the root and in all
      10 packages**, and `npm pack --dry-run` confirms it reaches both tarballs (core 2,993 files,
      cli 220) — npm includes `LICENSE` regardless of the `files` array, but it was worth proving
      rather than assuming.
      **The MIT body is byte-identical to upstream's, verified by `diff`**, carrying both copyright
      lines and an Attribution section that names what is derived (component APIs, tokens,
      documentation prose, the case-for-case test suites) and what is this port's own (the Svelte 5
      implementation, the StyleX adapter, the codemod runner).
      **`research/05-shadcn-svelte-playbook.md` guessed the notice wrong**, and told us to check:
      it says to reproduce `Copyright (c) Meta Platforms, Inc. and affiliates`, where
      `facebook/astryx/LICENSE` and the published `@astryxdesign/cli` both read
      **`Copyright (c) 2026 Meta Platforms, Inc.`** — no "and affiliates", and with a year. The
      planning line's own instruction to "verify the exact notice … and reproduce it verbatim" is
      what caught it
- [ ] **The port's copyright line reads `Rohit Kushwaha`**, taken from the repository's git
      identity. Change it if a different legal name or entity should hold it — it appears in all 11
      files
- [ ] **Nothing is on npm yet.** The packages are publishable; publishing is a human action and has
      not happened. **The `@astryx-svelte` org must be created on npm first** — a scoped publish
      does not auto-create it. `npm publish` is then the only remaining step, and the install
      instructions become true the moment it runs
- [ ] **Send the blessing message.** `research/05-shadcn-svelte-playbook.md` item 9: reach out to
      the Astryx maintainers the way huntabyte did with shadcn — "it costs one message and it is
      the difference between a welcomed port and a cease-and-desist". Cheaper before the first
      publish than after
- [ ] **`What's New` (`/changelog`) stays blocked** on the route and the data — still zero
      `CHANGELOG.md` files, no tags, no commits
- [ ] **`List` items are `4px 8px` where upstream's are `8px`** — core's `Item` at
      `density="compact"`. A core parity question, not a docs one
- [ ] **Section anchors are a `#` text link; upstream's `AnchorHeading` is a ghost `IconButton`**
      that copies the deep link and reveals on hover/focus-within

### Core's dependencies are upstream's again — 2026-08-09

Prompted by a reader asking whether the port had drifted from Astryx's
"dependency-free" claim. It had, in two places, and the manifests are what settled it —
`@astryxdesign/core` declares **one** runtime dependency, `intl-messageformat`, and
this port declared three.

- [x] **`runed` is gone, and the cost was out of all proportion to the use.** It supplied exactly
      one import — `Context` — across **39 modules**, and only `set()` and `getOr()` were ever
      called. For that it brought **555 KB, three transitive dependencies** (`dequal`, `esm-env`,
      `lz-string`) and, the part that actually mattered, **peer dependencies on `@sveltejs/kit`
      and `zod`** — so a plain-Svelte consumer with no SvelteKit was being asked to satisfy a peer
      for a framework they had not chosen. `internal/context.ts` now owns the class in ~40 lines
      over Svelte's own `getContext`/`setContext`.
      **The full `runed` API is implemented, not just the two methods used**, and that is not
      speculative: the barrel **publishes ten of these instances as public values**
      (`TableContext`, `SizeContext`, `AppShellMobileContext` …, which is upstream's own split —
      the context object is exported and its reader is not), so a consumer holding one can call
      anything the class exposes. Narrowing it would have been a breaking change dressed as a
      cleanup. Behaviour matches `runed@0.37.1` member for member, `get()`'s throw-by-name
      included
- [x] **`@stylexjs/stylex` moved from `dependencies` to `peerDependencies`, which is where upstream
      has it.** Not cosmetic: the consumer's own bundler compiles StyleX over core, so a second
      copy resolving at a different version renders **unstyled with no error** — the failure mode
      CLAUDE.md already names as this repo's nastiest. It is added to core's `devDependencies` at
      the same range, since a package does not install its own peers and the build, tests and
      class oracle all need it. `packages/core/README.md` already told consumers to install it, so
      the manifest now agrees with the documentation instead of contradicting it;
      `getting-started` gained the same line, which it had been missing
- [x] **A ported test caught the peer change, correctly, and was sharpened rather than deleted.**
      `svelte-version-sync`'s "core declares exactly one framework peer dependency" is this port's
      stand-in for upstream's react/react-dom range check, and it failed on
      `['@stylexjs/stylex', 'svelte']`. StyleX is not a framework peer and is not this port's
      addition — upstream declares it too — so the case now excludes build-tool peers and still
      asserts exactly one framework peer. **Mutation-checked**: adding `solid-js` fails it

**Core's dependency set is now identical to upstream's**: `intl-messageformat` alone, with StyleX
peered. The CLI is *lighter* than upstream's — same `commander`/`jiti`/`zod`, minus `jscodeshift`,
plus `magic-string` and `zimmerframe`, both zero-dependency. `theme-*` carries `@lucide/svelte`
where upstream carries `lucide-react`. Verified after the change: **class oracle 1,528 keys / 0
mismatches**, core server 811/811, the three context suites 79/79, CLI 1,937 + 25 todo, both theme
oracles clean, `build`/`check`/`lint` all 0.

### The v1 cut

Scoped 2026-08-02 to _launchable_, not complete. In: the shell, the `/components` gallery and
detail pages, and the `/docs/*` reference topics. Out: `/templates` (42), `/blog`, `/playground`,
`/themes`, `/changelog`, `/mcp`.

`/docs/core` and `/docs/cli` are out too, and for a specific reason rather than by preference —
they render package READMEs through the `<Markdown>` component. Everything else in the cut is
`ContentBlock[]` data, which needs no markdown engine at all. **`Markdown` has since landed
(batch 11)**, so the three README-rendered pages are unblocked; what they still need is docs-site
work rather than component work, itemised under [After launch](#after-launch).

### Landed

- [x] **Analytics, off the main thread — 2026-08-13.** GA4 via `gtag.js`, run inside a Partytown
      web worker rather than on the main thread, gated on `PUBLIC_GA_MEASUREMENT_ID`. Three parts:
      `scripts/vite-plugin-partytown.mjs` (copies the lib into `static/~partytown/`, serves the
      loader snippet as a virtual module so the package never enters the client graph),
      `src/lib/analytics/gtag.ts` (the head block and the navigation hit) and
      `analytics.svelte` in the root layout. **The measurement id is not committed** — `.env` is
      tracked with an *empty* value, because `$env/static/public` cannot import a name nothing
      declares and a dashboard-only variable would break every checkout and CI run; the real value
      goes in the Vercel project, which wins over `.env` in Vite's `loadEnv` order. Unset, the whole
      thing dead-code-eliminates: verified zero `partytown`/`googletagmanager` strings in the
      prerendered HTML and the client bundle. Four things the browser had to settle, all in
      `gtag.ts`'s docstring: `googletagmanager.com` reflects the origin in
      `Access-Control-Allow-Origin`, so **no `resolveUrl` reverse proxy is needed** despite what
      Partytown's docs imply; a client-side navigation must push a **plain array**, not an
      `arguments` object, which produces no hit at all through the forwarding stub; the worker's
      synthetic `location` **drops the port**, so local verification looks wrong and production is
      fine; and a browser without service workers reports nothing, because Partytown's 10s fallback
      recovers inline scripts but not `src` ones. Verified against a preview build: worker active,
      `gtag.js` fetched from inside it, and one `page_view` per navigation with the right `dl`/`dt`
      and no double-count on entry
- [x] **The social card is the landing page — 2026-08-13.** `static/og.png` was a hand-drawn card
      (headline, subhead, three stat columns) from a time when the landing page was a plain hero.
      It is now a 1200×630 crop of a committed 1920×1080 capture of `/`, so the unfurl shows the
      wordmark, the floating product cards and the reel. The capture is committed
      (`scripts/og-source.webp`) rather than taken live, which keeps `generate-og-image.mjs` a pure
      function: a live shot would need the site running *and* would race the hero reel's rotation,
      so a re-run for an unrelated change could land on a different slide. **The trade is
      legibility** — a screenshot at thumbnail size has no readable type, where the drawn card did.
      Re-capture at 1920×1080 on the first slide when the page changes enough to warrant it
- [x] **`/blog` and `/blog/<slug>` — 2026-08-10.** Upstream's blog surface, ported, with one post of
      this repo's own. The split is worth stating because it decided the whole shape: the **content**
      is Meta's prose and does not port (their seven posts stay theirs), but the **surface** ports
      like anything else. `src/lib/blog/posts.mjs` is upstream's own module copied **verbatim** —
      frontmatter parser, six-type schema, validation, reading-time estimate and latest-first
      ordering — so a post that builds here builds there, and upstream's authoring README describes
      this port exactly. `schema.ts` and `release.ts` likewise. Only `authors.ts`'s *entries* are
      ours, since copying Meta's team into a port they did not write would misattribute it.
      Components: `blog-index`, `blog-card`, `blog-article`, `author-byline`, `release-cover-art`.
      **Two upstream behaviours are load-bearing and easy to lose** — the type filter only renders
      when more than one type has posts (this port is the single-type case today), and the feature
      card only appears under "All", because "featured" within a filtered subset is a claim the
      ordering does not support. Three details worth keeping: drafts follow `NODE_ENV`, so `dev` and
      `build` legitimately disagree about the post count; `headingLevelStart={2}` is what stops a
      post body growing a second `h1`, and upstream's own posts use `##`, which lands them at `h3`;
      and core's `Markdown` takes its source as `children: string`, so upstream's JSX child becomes
      an attribute. Validation runs on every build in place of upstream's `blog.test.ts`, which has
      no runner here — a malformed post fails the build with a slug-prefixed error. Verified in the
      browser and in the prerendered output: `/blog` and `/blog/astryx-svelte-v0-3-0` both static,
      body prose at the article's 17px override, three related-doc cards, three tag badges
- [x] **Every live preview renders under `neutralTheme`, not the docsite's brand theme — 2026-08-10.**
      This was wrong on the site for its whole life and the port had *written down* the wrong reason
      three times. Upstream's `ComponentPreviewTheme` wraps `ComponentDetailClient`, `ExampleBlock`
      and `InteractivePreview` (×3), and standalone neutral `<Theme>` boundaries wrap
      `ShowcaseThumbnail`, `TemplateThumbnail` and `TemplatePreviewSurface`. This port dropped all
      six, with `example-block`, `showcase-thumbnail` and `template-preview-dialog` each explaining
      that "a second identical boundary would be a no-op" — and the root `+layout.svelte` docstring
      asserting the same premise, which is what licensed the other three. **The premise was false:**
      the ambient theme is `astryxTheme`, so the boundary *switches* the theme rather than repeating
      it, and every example, gallery tile and template was rendering in the brand skin (pill buttons,
      `#15110C` accent, +4px radii) instead of the theme a reader installs. Now
      `shell/component-preview-theme.svelte`, with upstream's module-load `registerIcons` for the
      SSR/hydration glyph mismatch it documents. Measured in a real browser before and after, and in
      the prerendered HTML: `/components/Button` went from **1 `astryx` wrapper and 0 `neutral`** to
      **1 `astryx` and 6 `neutral`**, its Primary button from pill/`#15110C` to `10px`/`#262626`.
      Upstream's `component-preview-theme.test.ts` is ported as
      `docs/scripts/check-preview-theme.mjs` — a node assertion script rather than a vitest file,
      because `docs` has no runner and its `test` script is already exactly that shape — and it
      guards three surfaces upstream's directory-scoped regexes never see. **The lesson worth
      keeping: a comment asserting parity is not evidence of it.** Four files agreed with each other
      and none of them agreed with upstream; it took re-cloning the reference tree to see it
- [x] **The top nav's Community button**, upstream's `HeartHandshake` slot between the mode toggle
      and GitHub. It had been left out under `nav-items.ts`'s rule against linking to a 404, and
      `/community` now exists, so it returns with it. The glyph is a docs-local Lucide mark
      (`heart-handshake-icon.svelte`) beside `moon-icon`/`sun-icon`/`github-logo`, not a registry
      substitution — the icon is the control's whole meaning. Path data verified byte-identical
      between `lucide-react@1.25.0` (what upstream resolves) and `@lucide/svelte@1.30.0`
- [x] **The StyleX consumer seam** — the thing that had to work before any of this was worth
      planning. `@astryx-svelte/core` ships its `.stylex.js` modules **uncompiled** (`svelte-package`
      transpiles TypeScript; it does not run StyleX), so every consumer compiles them itself. The
      docs app runs `@stylexjs/unplugin` with options copied verbatim from `packages/core`, plus
      `optimizeDeps.exclude` and `ssr.noExternal` for core — without those two, Vite's esbuild
      pre-bundler and the SSR externaliser both route the modules around the plugin and
      `stylex.create` survives into the browser as a runtime no-op. Verified end-to-end: 1202 atomic
      classes emitted, correct layer order, real classes in the SSR HTML, in **both** dev (virtual
      module) and production. See [Docs-site integration facts](#docs-site-integration-facts)
- [x] **The content pipeline** — `docs/scripts/generate-content.mjs` + `vite-plugin-content.mjs`,
      emitting `src/lib/generated/*` and regenerating on `.doc.mjs` change. Reads from
      `node_modules/@astryxdesign/{core,cli}` pinned to **0.1.7**, the exact version
      `packages/core` targets — not from the gitignored upstream clone — so a CI checkout generates
      identical output. Replicates upstream's `requireDisplayName()` build gate
- [x] **Props typed from our own declarations, not upstream's strings.** 1027 of 1049 documented
      props resolve against `packages/core/dist/**/*.d.ts`; the remaining 22 each carry a written
      reason. This was the correction that mattered: `research/04` risk #2 proposed mapping
      `ReactNode` → `string | Snippet`, but `Button.icon` is `Snippet` here with **no string
      branch**, so the mapping would have documented an API that throws. Upstream's `.doc.mjs`
      supplies the prose; the compiler supplies the types

### 1:1 pass over the docs pages (2026-08-03)

The v1 pages were _structurally_ upstream's but rendered with hand-rolled markup where upstream
composes its own components. Closed in this pass:

- [x] **Every example now shows its source.** Upstream's `ExampleBlock` is `Card padding={3}` →
      name → live preview → a muted, top-divided strip carrying a small `TabList`, and the panel it
      switches (Description / Code). This port had **no code view at all**. Source comes from a
      second `import.meta.glob(..., {query:'?raw'})` rather than the generator: upstream bakes each
      `.tsx` into its registry, which here would ship ~400 sources on every page load to serve one
      collapsed tab. The leading porting-note comment is stripped — it is this repo's note to its own
      contributors, not example content
- [x] **The gallery is a thumbnail grid, not a list of names.** `ShowcaseThumbnail` renders each
      component's showcase block live at 2× and scales it to 0.5, gated by an `IntersectionObserver`
      (200px margin) with `content-visibility: auto`, `inert`, and a `<svelte:boundary>` where
      upstream has an error boundary. Plus upstream's centred `display-1` hero and the "Install core
      library" `Popover`. **Upstream's `CATEGORIES` order is alphabetical** — Chat is second, not
      eleventh; this port had it near the end
- [x] **Component page rebuilt to `ComponentDetailClient`** — 960px transparent `Section`,
      `display-1` title over a package caption, `display-3` section headings, Usage prose at
      `type="large"`, best practices _nested inside_ Usage, showcase in a `Card variant="muted"`, and
      the Overview / Properties tab pair with the `?tab=` round-trip
- [x] **Best practices is a Guidance/Practices table**, upstream's `BestPracticesBlock` — a 100px
      badge column against a prose column, not a badge floating beside a paragraph with nothing
      naming what it meant. `Table` is unported, so it is a `<table>`, as `props-table.svelte`
      already is
- [x] **Anatomy section removed.** Upstream ships `component-detail/Anatomy.tsx` but **imports it
      nowhere** — the anatomy in `.doc.mjs` is rendered on no upstream page. Rendering it here was
      invented content. Worth remembering as a general trap: _a file existing upstream is not
      evidence upstream renders it_ — grep for the import before porting a component
- [x] **`/docs` 404'd.** Upstream redirects it to `/docs/getting-started`; nothing in the site
      linked to bare `/docs`, so no page surfaced the gap — but it is the URL a reader trims to
- [x] **Doc pages use upstream's title treatment** — `Heading level={1} type="display-1"`, dek at
      `type="large" color="secondary"`, and the prose column capped at upstream's `proseMaxWidth` of
      **800px** (was 960px) with the article body type scale re-declared at 17px/1.647
- [x] **Footer rebuilt from the design system** — `Section role="contentinfo"` + `Grid`/`GridSpan` +
      `Link type="supporting" isStandalone` + `Divider`, upstream's two-row shape, replacing raw
      `<footer>`/`<nav>`/`<a>`. Meta's social and legal blocks stay out (see Release & governance);
      the unofficial/not-affiliated notice takes that space
- [x] **Sidebar search is the real `TextInput`** — upstream's `SideNav topContent` is exactly a
      `TextInput` with `isLabelHidden`/`startIcon`/`hasClear`, and it is ported, so the hand-rolled
      `<input>` was a lookalike for something already shipped
- [x] **Centring bug** — `margin-inline: auto` sat on a full-width wrapper `div`, which does nothing;
      the capped `Section` inside stayed hard against the left edge. It belongs on the `Section`,
      which is where upstream's `xstyle={{marginInline:'auto'}}` puts it

### The navbar and the landing page, 1:1 (2026-08-03)

The home page was a hand-written stat card; upstream's is a themed hero reel over a
pin-and-cover showcase. Both it and `SharedTopNav` are now ported. What landed:

- [x] **`SharedTopNav` verbatim** — logo-only `TopNavHeading`, links as `centerContent` (bare in
      `drawer` render mode, wrapped in the `display:none`-at-768px `.desktop-nav` otherwise), and an
      `endContent` of `HStack gap={2}` around `HStack gap={0.5}` of ghost icon `Button`s + the
      primary CTA + a hamburger gated on `useAppShellMobile().isMobileNavEnabled`. The `⌘K` handler
      and the `SearchPalette` moved _into_ the nav, where upstream keeps them
- [x] **`astryxTheme`, the docsite's own brand theme** — `docs/src/lib/themes/`, compiled to
      `src/lib/generated/astryx-theme.css` by `scripts/build-astryx-theme.mjs` and stamped
      `__built: true`, exactly as upstream's `astryx theme build` artifact is. The config is a
      separate module taking the brand colour as an _argument_, because the build script runs under
      plain Node: the `@astryx-svelte/core/theme` barrel re-exports `theme.svelte`, which Node
      cannot load, and Node does not resolve a `.js` specifier to a `.ts` file
- [x] **The hero theme reel** — provider + wordmark/cards/stack/dots placements, the aurora blob
      layer, the per-slide `theme-fill` and `nav-backdrop` bands, touch swipe, visibility pausing,
      idle-time font/image warming, and `HeroFloatingCards` in both `overlap` and `stack` layouts
- [x] **`FeaturesShowcase`, `AboutShowcase`, `DiscoverShowcase`** + `ComponentsPreview` and
      `CliPreview`
- [x] **The `(site)` / `(docs)` layout split**, as upstream's two route-group layouts:
      `variant="surface"` (was `"section"`), `mobileNav={false}` on the marketing route, and the
      `shell`/`main`/`footer` flex column from `layout.module.css`
- [x] **`astryxTheme` is the site-wide theme**, as upstream's root `Providers` makes it — not
      scoped to the marketing route. The consequence is upstream's too and is worth stating rather
      than discovering: **every component example now renders in the Astryx brand** (pill buttons,
      near-black accent) instead of the neutral theme's own colours. `docs.css`'s note about why the
      _brand_ colour is a docs-chrome token and not `--color-accent` still stands and is unaffected;
      `neutralTheme` stays imported because the reel's registry lists it as an installed package
- [x] **The footer's attribution** now follows the shape shadcn-svelte uses — "Built by _upstream_.
      Ported to Svelte by _porter_." — over the not-affiliated notice, which stays
- [x] **Sun/moon are real glyphs, not registry stand-ins.** The toggle first shipped with
      `eyeSlash`/`info` — the substitution convention the rest of the site uses for a missing icon —
      and it read as an eye and an info circle. A stand-in is fine when the glyph is incidental and
      wrong when **the icon is the control's entire meaning**, so these two are inlined as docs
      chrome (`sun-icon.svelte` / `moon-icon.svelte`) beside `github-logo.svelte`, outside the
      `Icon` registry the theme oracle covers. Worth generalising when the icon-registry item lands
- [x] **One shared colour-mode instance.** `useColorMode()` is a factory, not a store, and it was
      being called in both `+layout.svelte` and `+page.svelte` — two independent `$state`s, so the
      nav toggled one and the hero reel read the other and the hero never changed mode at all. It
      is now created once in the layout and published via context, which is exactly the shape
      upstream's `ThemeModeContext` has. **General trap: a `use*()` factory returning `$state` is
      per-caller; anything more than one caller needs a context or a module singleton**

**The translation trap this batch paid for twice, worth writing down.** Upstream hangs `xstyle` on
the `VStack`/`HStack`/`Card` _itself_, so sizing and flex alignment share one box. Svelte's style
scoping cannot reach a child component's root element, so the tempting move is to wrap the Stack in
a styled `div` — and it is wrong every time: `align-items` stays on the Stack while the width and
padding move out one level. It cost a `row-gap` override that silently no-opped on a non-flex
wrapper, two heading blocks that stopped centring on mobile, a card whose padding ended up on its
560px content column, and a bento column that never collapsed to a single stack because
`display: contents` dissolved the wrapper but not the Stack inside it. **Where upstream styles a
Stack, write a plain element and declare the flex the Stack would have applied** — `gap={N}` maps
1:1 to `--spacing-N` (the scale is the discrete set `0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10`),
and a Stack with no `align` emits _no_ `align-items` at all.

Deliberately not ported, each blocked rather than skipped:

- [x] **Four of the reel's five theme slides** — **closed by the theme batch.** The reel was one slide with
      `HeroReelDots` rendering nothing (its own `slides.length <= 1` guard), because `themeFor()`
      returns `null` for an uninstalled package. **The prediction that a ported theme would be one
      line in `THEME_OBJECTS` held exactly**: that map and the font `<link>` were the only two edits
      the reel needed — every content, aurora, wordmark, dark-mode and label table was already
      complete for all five. Verified by clicking each dot in real Chromium: five dots, and the hero
      switches to `matcha`/Playwrite US Trad, `butter`/Outfit, `gothic`/Fustat **in dark mode**
      (it is a dark-only theme) and `y2k`/Poppins, each with its own `--color-accent`, and zero
      console errors or hydration warnings
- [ ] **The Themes and Templates bento tiles** — `ThemesPreview` needs the theme registry,
      `TemplatesPreview` needs the 42 page templates. Both omitted, and **the desktop bento is two
      columns instead of three** for as long as they are: upstream's third column would otherwise be
      a 400px hole. Dropping them also forced a _rebalance_, which is the part worth recording —
      keeping upstream's column membership and merely deleting the third track left the heading
      alone in column 1 above a 700px hole with both surviving cards stacked in column 2, and the
      section read as broken. The two real tiles are now one per column and both grow. Restoring a
      tile means putting it back in its upstream slot and restoring the third track
- [ ] **`BlogShowcase`** — a whole landing section on `blogRegistry` + `BlogCard`/`BlogFeatureCard`
- [ ] **The chat composer inside `HeroFloatingCards`** — `ChatComposer`/`ChatSendButton` are batch 13. `HeroThemeContent.chatPrompt` stays: it is upstream's data shape and returns with the
      component
- [ ] **The Community icon button** and upstream's `trackSearch`/`trackClickCta` analytics
- [ ] **`hero/AstryxWordmark.tsx` is not ported, and should not be** — upstream ships it with a
      docstring claiming the hero uses it, but **nothing imports it**; `HeroThemeReel` renders
      `AstryxLogo` from `logos.tsx`. A second instance of the trap already recorded for `Anatomy`

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

### Theme parity: 196 → 328 of upstream's 331 declarations (2026-08-03)

The theme oracle was **one-directional** — it proved every declaration we emit matches upstream, but
never that we emit every declaration upstream has. We shipped **196 of 331**. Worth remembering as a
general trap: _a green one-directional oracle is not coverage_, and the missing direction is the one
that hides whole features.

No colour **token** was ever wrong — all 135 missing declarations were tokens that existed but were
never _applied_, plus the type scale. Closed:

- [x] **The semantic type scale (40 declarations).** `expandTypeScale` only ported layer 1 (raw
      `--font-size-*`) and heading weight overrides, so the theme emitted **2 of upstream's 42**
      `--text-*` declarations and every component fell through to `typeScaleDefaults` in
      `tokens.stylex.ts`. Those defaults agree with the neutral theme everywhere **except**
      `--text-display-3-leading` — static table says `1.2414`, upstream's 4px-grid snapping says
      **`1.3793`** — so the gap stayed invisible until a page rendered `display-3`. The worse half:
      a theme with a _different_ `scale` got upstream's leadings rather than its own
- [x] **The `@layer reset` prose block (34).** `--color-text-primary` on bare `h1`–`h6`/`p`,
      `--color-text-secondary` on `small`, `--color-border` on `hr`, plus the heading family and
      scale. Any HTML that is not a `Text`/`Heading` component — docs prose, copied example markup —
      was rendering with no theme colour at all
- [x] **`Text`/`Heading` component bindings (58).** Upstream's `generateTypeScaleComponents`, plus
      the five colour variants (`primary`/`secondary`/`disabled`/`placeholder`/`accent`) for both
      components. These sit in the `astryx-theme` layer, _above_ the components' compiled StyleX, so
      upstream's `Text` takes its colour and metrics from the **theme**; ours took them from StyleX
      defaults. This is what made colours visibly diverge while the token oracle stayed green

The remaining **3** are the `color-scheme` declarations, which this port deliberately keeps in
`base.css` with a broader selector than upstream's `html[data-theme=…]` — they are present, just not
in `theme.css`, and `base.css` documents why.

Still open from this pass:

- [x] **Hydration is now testable at all** — `scripts/ssr-fixture-plugin.mjs` +
      `src/tests/tab-list-hydration.svelte.test.ts` (3 cases). A `.svelte` file compiles for one
      target per module graph, so the browser project (DOM build, can `hydrate()`) had no way to
      obtain server markup, and `mount()`-and-snapshot is not a substitute — client rendering omits
      the `<!--[-->` / `<!--$sN-->` markers hydration navigates by, so hydrating it tests nothing.
      The test asks the Vite dev server, which _does_ have an SSR graph, to render the fixture. One
      trap worth remembering: `render` must be pulled through `server.ssrLoadModule('svelte/server')`
      too — importing it at the Node level gets a second Svelte instance and the component dies in
      `push_element` against a null current-component
- [x] **The docs-shell hydration mismatch no longer reproduces** — swept 2026-08-03 and closed as
      not-reproducible rather than diagnosed. It had surfaced as _"Failed to hydrate"_ followed by
      `Tab` throwing "useTabListContext must be used within TabList"; the earlier round had already
      exonerated `TabList` itself, duplicate module instances, HMR staleness and the icon registry,
      and left `$props.id()` marker ordering as the thing to check next. Nothing was found to check:
      **156 of 156 production routes and 48 dev routes are clean** — every `/docs` topic, the home
      page, the gallery and a spread of 27 component pages, all of which render both `TabList`s (the
      page's Overview/Properties pair and `ExampleBlock`'s Description/Code strip). Two things about
      the method are worth keeping, because a naive sweep would have "passed" without meaning
      anything:
  - **Production cannot detect this.** Svelte logs the hydration failure only in dev builds, so the
    clean prod sweep is evidence about rendering, not about hydration. Dev is the detector.
  - **A page that never hydrated also looks clean.** The sweep carries a positive control (an
    element count that only a hydrated page reaches) _and_ was calibrated against known-noisy pages
    until it reported them — `load` + 900 ms was too early and returned a false clean; `networkidle`
    - 3 s surfaces the same warnings the control run does. On `/components/Button` a tab click
      changes the DOM, which is hydration proven rather than assumed.

      Left as-is: whatever fixed it is not identified, most likely the 1:1 pass's rebuild of the
      component page and shell. Re-open with the same harness if it returns.
- [x] **The `/components` gallery rendered an unnamed dialog** — found by that sweep, and the only
      real defect it turned up. The install `Popover` is a `role="dialog"` with no accessible name,
      so assistive tech announces "dialog" and nothing else; `usePopover` warned about exactly that
      on every visit. Upstream's own gallery passes only `width` and `content`, and its `usePopover`
      carries the identical warning — so the port was faithful and upstream trips its own
      diagnostic. Fixed here rather than replicated, on the `Code/CodeInlineInParagraph` precedent:
      an a11y defect on a page _we_ ship is fixed and documented, where a component's own behaviour
      would be replicated. `label` is `Popover`'s public name for `usePopover`'s `dialogLabel`
- [ ] **`useImageMode`'s cross-origin sampling fails on every CDN image** — also found by the sweep,
      and cosmetic today. Upstream's example blocks reference `lookaside.facebook.com` (21 files
      here, 23 upstream — transcribed verbatim, which is correct); the `<img>`s themselves all load
      (8/8 on `/components/Lightbox`, 16/16 on `/components/Avatar`, 12/12 on `/components/AspectRatio`,
      nothing broken), but `useImageMode`'s APCA pixel sampling **fetches** the image, and a
      cross-origin fetch without CORS headers fails. So the on-media theme silently falls back to
      its default instead of adapting to the image, and the console carries a CORS error per image.
      This is the same hazard `thumbnail-images.ts` already substitutes local data URIs for; the
      remaining blocks cannot take that fix without diverging from the upstream source the component
      page _displays_. (`/components/Avatar`'s two `does-not-exist-*.jpg` failures are not this —
      `AvatarFallbackChain` uses missing URLs on purpose.)
- [x] **The theme oracle is bidirectional** — **DONE.** It reported `not found upstream` but never
      _upstream-not-found-here_, which is how 135 missing declarations sat behind a green run. The
      reverse diff now runs, with an `emittedElsewhere` allowlist carrying the 3 `color-scheme` rules
      `base.css` owns and a written reason for each. The entries are **self-retiring in both
      directions**, as the class oracle's skips are: one naming a declaration upstream has dropped
      fails, and so does one we start emitting from `theme.css` after all. Two things found on the
      way in and worth keeping: **the script had no exit code at all** — `test:parity` ran it, read
      its output and always passed, so even the _forward_ direction was advisory rather than
      enforced; and the 3 `color-scheme` selectors differ (`html[data-theme="light"]` upstream vs the
      broader `[data-theme="light"]` here, because `<Theme>` sets the attribute on a subtree wrapper,
      not only on `<html>`). Mutation-checked four ways — a deleted declaration, a corrupted value,
      an invented one and a stale allowlist entry each exit 1, and the baseline exits 0
- [x] **Mobile on-this-page jump menu** — **DONE.** Upstream swaps the outline aside for a sticky
      `Selector` below 1024px; this port only hid the aside. Now `useMediaQuery` mounts exactly one
      side, as upstream does, so the hidden side's `IntersectionObserver` never runs — and both are
      _also_ styled for their side of the breakpoint, which is what keeps the server's HTML right at
      every width. **That is only hydration-safe because this port's `useMediaQuery` subscribes in
      `$effect.pre`**: it reports `serverDefault` through the server render _and_ the hydration pass,
      which is exactly what upstream's `getServerSnapshot` argument buys. Three smaller pieces came
      with it: the `Outline` seam gained upstream's `onActiveIdChange`, so a viewport crossing the
      breakpoint hands the newcomer the section the other had spied; the title `Divider` hides below
      the breakpoint on outline pages, because the selector carries its own bottom border and the two
      would read as a doubled separator; and the selector's measured height is published as
      **`--docs-anchor-offset`**, which `scroll-margin-block-start` now consumes — the bare `72px`
      there was upstream's `calc(header + var(--docs-anchor-offset, 0px) + 16px)` with the offset
      silently at 0, so a section scrolled to below 1024px used to land _behind_ the pinned selector.
      Verified in Chromium at both widths: at 1280 the aside mounts, the selector does not, offset
      `0px`, scroll-margin `72px`; at 900 the selector mounts sticky at 56px, the aside does not, the
      divider is hidden, offset `57px`, scroll-margin `129px`, and choosing a section sets the hash,
      updates the trigger and lands the heading clear of the pinned selector. No console or hydration
      errors at either width. One thing checked rather than assumed: the trigger's accessible name is
      `combobox "On this page"` from the visually-hidden `<label for>` — `getInputARIA` returns
      `ariaLabelledBy: undefined` outside an `InputGroup`, and that is upstream's own code, not drift

### The launch path

- [x] **Shell** — **DONE.** Header, mode-switching sidebar (docs topics / component registry, with a
      filter box that flattens the groups), footer, `⌘K` palette and on-this-page outline, all in
      `docs/src/lib/shell/`. Hand-built, each behind a seam so batches 9–10 swap the real component
      in without touching a page. The layout is a real `<Theme>` with a light/dark/system toggle
      persisted to `localStorage` and read in `$effect.pre`, so `'system'` is what the server emits
      and the first paint resolves from the OS preference with no hydration flip. The palette
      searches the same in-bundle index the sidebar reads — no Algolia, no Pagefind, as upstream
- [x] **`/docs/<topic>`** — **DONE.** All 19 topics prerendered, `ContentBlockRenderer` for the five
      block types (`prose`/`code`/`table`/`list`/`token-ref`), and upstream's `inlineMarkdown.tsx`
      ported as a pure parser plus a renderer component. `{type: 'table'}` renders a plain `<table>`
      until batch 13. **`TokensDocView`'s live computed value column is now built**: a section that
      declares a `previewType` routes its tables through `shell/token-table.svelte`, which prepends
      a preview cell (swatch, spacing bar, radius box, easing curve, font sample, …) and appends a
      **Resolved** column read from `useTheme().token(name)`, so the number in the table is the one
      the running theme actually computes. One data-driven table replaces upstream's eight
      hand-written ones. A `token-ref` block **inlines** the section it points at rather than
      linking to it — upstream's section-title override does the same, and linking would have left
      `/docs/color` with no colour table at all
- [x] **`/components`** gallery — **DONE.** Grouped by upstream's 12 categories, ported entries
      only, with the unported count stated rather than implied
- [x] **`/components/<name>`** — **DONE**, 134 routes prerendered. Usage prose, import snippet, best
      practices, anatomy, and the props table typed from core's own declarations. Hooks render
      Parameters/Returns instead, keyed on `isHook` (upstream's `params != null`).
      **One deliberate divergence:** upstream splits this into Overview/Properties tabs with the tab
      in the URL, and the outline aside does that job here instead. The tabs exist upstream to carry
      the sticky _interactive preview stage_ that sits above the props table — mechanism B, not in
      the v1 cut — so v1 is one scrolling page with the same sections in the same order. `TabList`
      is ported, so restoring the tabbed shape is markup, not a blocked feature
- [x] **Example blocks — the transcription backlog is finished, and stays finished.** **472 of 482**
      blocks have a Svelte rewrite under `docs/src/lib/examples/<Component>/<Block>.svelte`,
      including **129 of the 131 `isShowcase` blocks**. Worth keeping as a batch-close step:
      **porting a component reopens this backlog**, because a newly documented component brings its
      blocks with it. `Outline` added four (`Showcase`, `Controlled`, `Density`, `DeepNesting`) and
      the count went 406/10-pending to 406/**14**-pending until they were transcribed. None of the
      four needed the deferred markdown helpers. Re-run `pnpm -F docs generate` after any port and
      check the pending number is still exactly the API-blocked ten — the hero preview on every component page but two. **The
      remaining 10 are all blocked on an unported component, not on effort** (below); there is no
      transcription work left. **As of batch 14 that number is 5 of 534**, and all five have the
      _same_ blocker (`useImperativeDialog`/`useImperativeAlertDialog`) — the first time the pending
      set has had a single cause. `hasSvelte` in the generated registry keeps them countable rather
      than silent, and `shell/example-preview.svelte` renders a stated placeholder for each rather
      than an empty box. Blocks are transcribed from the `.tsx` in
      `node_modules/@astryxdesign/cli/templates/blocks/`, not re-authored; each file names its
      upstream source in a header comment, and every substitution or type-level adjustment is
      commented in place
- [x] **141 blocks landed 2026-08-03**, closing the backlog. Five things worth keeping from it:
  - **Blocks are a better fidelity source than storybook stories.** `SegmentedControl`'s two icon
    blocks, `TabList`'s `WithActions`/`WithIcons` and `Tab`'s `WithSelectedIcon` author their SVGs
    _in the block file_, so they transcribe as snippets with **no icon-registry substitution at
    all** — where the demo routes, which port the stories, have to stand in for Heroicons. Where a
    substitution _was_ needed the header comment says so; `arrowUp`/`arrowDown` (VisuallyHidden),
    `search` (Typeahead/Tokenizer/BaseTypeahead), `chevronRight` (TreeList) and `funnel`
    (ToggleButton) are true matches and retire with nothing.
  - **Upstream repeats its data literals inline** (`SelectorWithStatus` writes the same three-role
    array three times). Hoisting them to a `const` was reverted: the component page renders the
    block's _source_, so deduplicating it would document an example upstream does not have.
  - **`OverflowList`/`Carousel` blocks move the per-child variant into the data** — those two take
    `items` + an `item` snippet here, so `OverflowListOverflowBadges` carries `variant` on each
    item rather than on a child element. `OverflowListOverflowDropdownActions` keeps upstream's
    separate `actions` array, because its overflow renderer indexes it by `OverflowItem.index`.
  - **The hook-usage blocks are where the render-split shows.** `useTooltip`/`useHoverCard`/
    `useLayer`/`usePopover` each pass `id: $props.id()` (a hook cannot mint an SSR-stable id) and
    render through `<TooltipLayer>`/`<HoverCardLayer>`/`<Layer>`/`<PopoverLayer>` instead of
    upstream's `render(…)`. `useThemeHookUsage` **must not destructure** `useTheme()` —
    `name`/`mode` are getters, so upstream's `const {name, mode, token} = useTheme()` would
    snapshot them and stop tracking a theme change.
  - **Two blocks needed a sibling module.** `LinkProvider/RouterLink.svelte` holds the second
    component upstream declares in the same file (Svelte has no in-file component declaration).
    It is not a block: the registry only looks for `<BlockName>.svelte`, so a sibling is invisible
    to it. `ResizableSidebar` and `TooltipHookUsage` target two components each via
    `alsoExampleFor`, and `hasSvelte` is per-target — so each needs a copy under **both**
    directories.
- [x] **Batch 10's 44 nav blocks landed**, taking the count 428/54-pending → 472/**10**-pending, the
      API-blocked ten again. Documenting `AppShell`/`SideNav`/`TopNav`/`MobileNav` and their twelve
      sub-components pulled in 44 blocks at once — the largest single reopening of this backlog so
      far, and the clearest case for the batch-close step above. Three things it added to the notes:
  - **The nav blocks split two ways on icons, and the split is per-file.** Every `SideNav*` block
    and three others (`TopNavHeadingShowcase`, `TopNavItemShowcase`,
    `TopNavMegaMenuItemShowcase`) author their Heroicons paths _in the block file_, so they
    transcribe as snippets with no substitution. The `AppShell`/`MobileNav`/`TopNav*` blocks
    `import {…} from '@heroicons/react/24/outline'` instead, so those are registry stand-ins with
    the map named in each header comment (`HomeIcon`→`menu`, `Cog6ToothIcon`→`wrench`,
    `ChartBarIcon`→`viewColumns`, `CubeIcon`→`stop`, `UsersIcon`/`UserCircleIcon`→`info`,
    `BellIcon`→`warning`, …). `MagnifyingGlassIcon`→`search` is the only true match. Retires with
    the icon registry.
  - **An inlined `<svg>` needs its own `width`/`height` here.** Upstream's `SideNavItem.icon` takes
    an `IconType` and `renderIconSlot` wraps it in `<Icon size="sm">`, which supplies the 1rem box;
    the `Snippet` arm renders raw, so the size moves onto the `<svg>`. Blocks whose upstream SVG
    already carries a size (`width="20"`, the heading glyphs) transcribe untouched.
  - **`{null}` children transcribe verbatim** (`SideNavHeadingBasic`/`Showcase`) — Svelte renders
    `null` as the empty string, so `SideNav`'s required `children` is satisfied and emits nothing.
    And `AppShellMobileContext.Provider` becomes `AppShellMobileContext.set(() => …)` in the
    block's own `<script>`: Svelte sets context at init, so the block _is_ the provider, and the
    stored **getter** is what keeps `isMobileNavOpen` tracking rather than freezing at mount.
    `AppShell` blocks keep upstream's `height: 100%` and add a `640×480` wrapper `<div>` with a
    comment, because upstream's docsite supplies that frame via `aspectRatio` and this one's
    preview container is shrink-to-fit on both axes (the `AspectRatioImageGallery` precedent).
- [x] **In-bundle static search** over the generated registries (no Algolia/Pagefind), as upstream —
      `shell/search-index.ts`, ranked prefix → substring → keyword → description, shared by the
      `⌘K` palette
- [x] **Host it** so it cannot drift from what it documents — **live at
      <https://astryx-svelte.rohitk06.in/> since 2026-08-10** (`adapter-vercel`, all 165 pages
      prerendered). All 165 were loaded and checked in a real browser before the deploy (see the
      hydration sweep above): none throws, none fails to hydrate, and every image the example blocks
      reference renders.

      **The live site is built from `main`, and that is now a publishing surface with its own
      staleness.** The deployed release post still carries the two claims corrected in this batch —
      "the CLI is a placeholder and is marked private" and "4,760 tests" — because they were true of
      the commit that was deployed and are false of the tree. Verified by reading the live page, not
      assumed. **A doc fix is not shipped until the site redeploys**, which is a new failure mode
      this repo did not have while the site was local-only

### Page-template icons — real glyphs, and the `IconType` that blocked them (2026-08-10)

The 43 page templates drew the **wrong pictures**. 69 documented substitutions across **37 of
43** files mapped upstream's ~85 distinct Heroicons onto core's **28-name semantic registry** —
`PlusIcon` → `check` (×8, so "Add" buttons drew a checkmark), `StarIcon` → `check` (rating stars
drew checkmarks), `PencilSquareIcon` → `copy`, `SparklesIcon` → `wrench`, `FolderIcon` → `menu`.
The same upstream icon was mapped inconsistently across files (`LockClosedIcon` reached `stop`,
`eyeSlash` _and_ `warning`). Styles were never involved: the class oracle read 0 mismatches
before and after.

**The header comments blamed the wrong thing.** They asserted Heroicons "has no Svelte build".
The real blocker was one line of core: `IconType = Component<SVGAttributes<SVGSVGElement>>`, the
literal translation of upstream's `ComponentType<SVGProps<SVGSVGElement>>`. Component props are
contravariant and the element parameter reaches `DOMAttributes<T>`'s handlers, so **every** real
Svelte icon package failed it — measured, not assumed: `@fvilers/heroicons-svelte` on the element
parameter, `@lucide/svelte` (already this repo's theme dependency) on a narrowed `name`,
`svelte-heros-v2` on a narrowed `focusable`, `heroicons-svelte` on being Svelte 4 classes.
`@heroicons/react` accepts the _full_ `SVGProps` and only adds optional extras, which is why
upstream's type admits its own icon set and ours admitted nothing. `IconType` is now a bare
`Component`, which is the call shadcn-svelte makes for the same reason.

- **All 149 icon sites now draw upstream's glyph.** `@fvilers/heroicons-svelte` mirrors
  `@heroicons/react`'s entry points (`24/outline`, `20/solid`, `24/solid`) _and_ its `XxxIcon`
  export names, so the imports are upstream's with the package name changed. `theme-showcase` is
  the one page upstream draws with Lucide, and it uses `@lucide/svelte` for the same reason.
  Both are `packages/cli` devDependencies — the templates are CLI assets, so resolution has to
  work from that path, and upstream's arrangement is the same (its sandbox declares
  `@heroicons/react`; its CLI declares nothing)
- **One export name differs**: heroicons-react's `Squares2X2Icon` is `Squares2x2Icon` here
- **Three `Selector.startIcon`s in `theme-showcase`** went through the `Snippet` arm, so
  `INVENTORY_FILTERS` became `$derived.by` — a snippet does not exist while `<script>` runs
- [ ] **Templates are not typechecked, and this is how the substitutions survived.**
      Mutation-checked: a deliberate type error in a template produces **0** `svelte-check`
      errors, because `assets/` is outside every tsconfig include. It matters more now that
      templates import real packages — a scaffolded app _does_ typecheck what it received

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
