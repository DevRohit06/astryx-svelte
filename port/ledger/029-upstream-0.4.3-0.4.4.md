---
seq: 29
title: Upstream 0.4.3 → 0.4.5 — BottomSheet graduates into core
upstream: 0.4.5
date: 2026-08-19
units:
  [
    BottomSheet,
    BottomSheetPanel,
    BottomSheetSwitcher,
    BottomSheet/snapOffsets,
    BottomSheet/useSheetGestures,
    BottomSheet/useMobileKeyboard,
    Avatar,
    Banner,
    Chat,
    ComplexSelector,
    ContextMenu,
    DateInput,
    DateTimeInput,
    Dialog,
    FileInput,
    Lightbox,
    Markdown,
    MobileNav,
    MultiSelector,
    NumberInput,
    PowerSearch,
    Selector,
    Switch,
    Table,
    TextArea,
    TimeInput,
    Tokenizer,
    Tooltip,
    TreeList,
    Typeahead,
    utils/ime,
    cli,
    themes
  ]
upstream-prs: []
---

## Scope

Two upstream releases in one batch, because 0.4.3 shipped nine days before 0.4.4 and this port
never pinned to it. Tracking them together is one re-pin, one oracle re-baseline and one token
re-derivation instead of two.

Measured, not estimated — `git diff --stat v0.4.2..v0.4.4`:

|                             |                            |
| --------------------------- | -------------------------- |
| `packages/core/src`         | 90 files, +12,820 / −505   |
| Test delta                  | 34 files, +7,237           |
| Changed core component dirs | 25, plus `BottomSheet` new |
| Upstream component dirs     | 102 → **103**              |

### The headline: `BottomSheet` graduates from `lab` to `core`

Not a new component upstream _wrote_ — one it **promoted**. It moved from
`packages/lab/src/BottomSheet/` to `packages/core/src/BottomSheet/` at 0.4.4 and was rewritten on
the way; `git diff -M` reports rename similarity as low as 50% on `BottomSheet.test.tsx` and 59% on
`useMobileKeyboard.ts`. This port has never touched `lab`, so it arrives as a **fresh port of six
modules**, not as drift.

| Module                          |  Impl LOC |
| ------------------------------- | --------: |
| `useSheetGestures.ts`           |     1,407 |
| `BottomSheetSwitcher.tsx`       |       628 |
| `BottomSheetPanel.tsx`          |       547 |
| `BottomSheet.tsx`               |       545 |
| `useMobileKeyboard.ts`          |       499 |
| `snapOffsets.ts`                |       159 |
| `BottomSheetSwitcherContext.ts` |        51 |
| `index.ts`                      |        15 |
| **impl total**                  | **3,851** |
| tests                           |     4,405 |

**The import list is contained, and that was checked rather than assumed** — the pre-flight item
this port has paid for skipping twice (`CodeBlock` +710, `Markdown` +3,400). `BottomSheet` reaches
outside its own directory for exactly: `BaseProps`; `DialogPurpose` from `Dialog`; `colorVars`,
`durationVars` and `easeVars` from `theme/tokens.stylex`; `useDevWarning`, `useScrollLock` and
`useMediaQuery` from `hooks`; and `mergeProps`/`themeProps`/`composeEventHandlers`/`mergeRefs` from
`utils`. **Every one of those is already ported**, so the real cost is the 3,851 lines above and
nothing hidden behind them.

The two gesture hooks are where the risk sits, not the three components: `useSheetGestures` is 37%
of the implementation on its own and is pointer-drag, velocity and snap-point logic — the shape
most likely to need a genuine Svelte translation rather than a transcription.

### Deliberately excluded

- `packages/lab` itself. `BottomSheet` leaving it does **not** start the lab front; the other 19
  directories stay unported.
- `packages/build`, `packages/charts`, `packages/vega`, `packages/richtext` — unchanged decisions.

### Carried in as scope, not left as debt

The 26 `SideNav` and 12 `Slider` cases `port/debts.md` records from batch 028. They are named there
individually; this batch closes them rather than carrying the entry a third time.

## Pre-flight

Run at open, per `start-batch`. What it caught:

- **The `lab` inventory row was wrong twice over.** `port/research/01-component-inventory.md` said
  "17 components", a figure derived from a component list that never mentioned `BottomSheet` at
  all — so it was not a measurement. And it framed `lab` as a fixed unstarted set, when components
  graduate out of it: `lab`'s source directories went 20 → 19 between v0.4.2 and v0.4.4. Corrected
  in the same commit, with the real figure and how to derive it.
- **The published dist does not lag for this unit.** `@astryxdesign/core@0.4.4`'s tarball carries
  all eight `dist/BottomSheet/*.js` files, so the class oracle can verify it from the first commit
  — no source-only slice, no self-retiring skip needed.
- **Debts touching units in scope** were read. The `Lightbox` family carries five recorded
  divergences and `Tooltip`, `Switch` and `CodeBlock` one each; none is a bug to fix.

## 0.4.5 landed mid-batch, and was folded in

Upstream released `0.4.5` while this batch was re-baselining against `0.4.4`. It was folded in
rather than deferred, and the reason is specific rather than a general preference for currency:

**`BottomSheet` changes again at 0.4.5 by +819 / −216 across nine files** — roughly a fifth of the
component — including +196 / −100 in `useSheetGestures.ts` and +119 / −33 in `snapOffsets.ts`, the
two modules carrying the batch's real risk. Porting it against 0.4.4 and then tracking 0.4.5 would
have meant re-porting a fifth of a 3,851-line unit that had just been written. Nothing had been
written yet, so the cost of folding in was one re-pin.

The rest of 0.4.5 is small next to 0.4.3+0.4.4: 1,083 impl insertions and 1,101 test insertions
across 54 files, with **no new component directories** — the four added files are supporting
(`Calendar/getStandaloneShortWeekdayNames`, its generated table, and `hooks/useResolvedRequired`).
It adds drift in `StatusDot` (+74 / −9), `DateRangeInput` (+72 / −1) and
`Table/plugins/rowExpansion` (+20 / −2), all of which show up in the oracle table below.

`Banner`, `MobileNav` and `useInputStatusIcon` are **unchanged** at 0.4.5, so the work already done
against 0.4.4 carried across untouched. `ComplexSelector` (+3 / −1) and `Switch` (+6) each moved
slightly.

The general rule this is an instance of: **a release that lands before a unit is written is cheaper
to fold in than to track**, and a release that lands after it is written is not. The deciding
question is whether the new version touches the unit in flight, not how recent it is.

## The re-pin

All ten `@astryxdesign/*` devDependencies moved 0.4.2 → 0.4.4 and then → 0.4.5, pinned exact,
across nine manifests
(`docs`, `packages/core`, seven theme packages). `packages/themes/liquid-glass` has no pin because
it has no upstream counterpart.

One thing worth writing down, because it cost a silent half-bump: a `sed` over
`"@astryxdesign/[a-z-]*"` misses `theme-y2k`. The package name contains a digit, and the character
class did not. Nine of ten pins moved and the tenth read as done; only re-grepping the manifests
caught it. Match `[a-z0-9-]`, and verify by grepping for the **old** version afterwards rather than
by reading the diff of the new one.

## Oracle bookkeeping

Re-baselined against the 0.4.4 tarballs. Every mismatch below is the drift the two releases
introduced — it is the batch's own worklist, not a regression.

| Oracle        | At 0.4.4 re-baseline                                           | At 0.4.5, after `Banner`                     |
| ------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Class oracle  | 1,624 keys / 515 inline sites, 0 skipped, **20 mismatches**    | 1,625 keys, **19 mismatches**                |
| CSS oracle    | 5,940 rules, 1,502 shared classes, 10 skips, **27 mismatches** | 5,947 rules, 1,507 shared, **20 mismatches** |
| Theme oracles | `neutral` 1 mismatch + 1 extra; six clean                      | **all seven clean**                          |

Class-oracle mismatches by module — they map one-for-one onto the modules with real implementation
churn, which is the correlation that says the oracle is reading the right diff:

| Module                  | Mismatches | Upstream impl delta                   |
| ----------------------- | ---------: | ------------------------------------- |
| `banner`                |         12 | +124 / −38, plus `index.ts` +15 / −13 |
| `complex-selector`      |          5 | +156 / −28                            |
| `use-input-status-icon` |          1 | +7                                    |
| `switch`                |          1 | +7                                    |
| `mobile-nav`            |          1 | +128 / −37                            |

The CSS oracle's 27 split as 24 rules upstream ships that we do not, 2 we invent, and one missing
`@starting-style` at-rule. The bulk of the missing 24 are `BottomSheet`'s (`--_sheet-budget`,
`--_sheet-scrim-opacity`, `--_sheet-keyboard-inset`, `92dvh`, `overscroll-behavior: none`,
`::backdrop` transition rules) and retire when that unit lands; the rest are `Banner`'s
`--_banner-radius` custom-property indirection.

The theme drift is one declaration and it is `Banner`'s too:

```
.astryx-banner.info | --color-accent-muted
  ours:     transparent
  upstream: var(--color-background-blue)
present in ours, absent upstream:
  .astryx-banner.info | background-color  var(--color-background-blue)
```

Upstream moved the `info` variant from painting `background-color` directly to driving it through
`--color-accent-muted`. Ours still paints it. One change, visible in three oracles at once.

### The skip lists

**The class oracle's skip list is empty and stayed empty** — `skip`, `inlineSkip` and
`ABSENT_UPSTREAM` all hold nothing, and the run reports `0 skipped`. There was nothing to retire at
this bump, which is the first time that has been true of a version bump here. The CSS oracle's 10
skips are the upstream ESLint-fixture bundling bug, already self-retiring and still matching.

## The tarball does not lag

Checked per `track-upstream` step 6, and the answer is unusually clean: **nothing in scope is
source-only at 0.4.4.** Every changed module ships compiled (`Banner` 2, `ComplexSelector` 2,
`MobileNav` 3, `Switch` 3, `BottomSheet` 8 `.js` files), the three new modules
(`utils/characters`, `utils/ime`, `theme/mergeComponents`) are all present, and the new `Banner`
atomic classes the oracle is asking for (`x1eprgri`, `x1k5g1gk`, `xgualba`, `xj0a0fe`) are in the
published `astryx.css`. **No self-retiring skip is needed anywhere in this batch.**

## Tokens: re-derived, unchanged

Per `track-upstream` step 5, derived against the new tag rather than carried forward — the step
exists because 0.3.0 moved the count 186 → 184 and nobody noticed. At 0.4.4 the answer is that
`theme/tokens.stylex.ts` has a **zero diff** across `v0.4.2..v0.4.4`: **188 declarations upstream,
188 here**, across all 13 `defineVars` groups. No token churn this bump — but measured, not assumed.

## The test delta

`track-upstream` step 5b: a release's new cases are what it ships, not a follow-up. Counted per
suite at both tags.

**281 upstream cases arrive with these two releases** — 212 in nine brand-new files, 69 added to 20
existing suites.

New files, none of which has any counterpart here:

| Upstream suite                                | Cases |
| --------------------------------------------- | ----: |
| `BottomSheet/BottomSheet.test.tsx`            |    59 |
| `BottomSheet/useSheetGestures.test.ts`        |    41 |
| `BottomSheet/snapOffsets.test.ts`             |    25 |
| `BottomSheet/BottomSheetSwitcher.test.tsx`    |    24 |
| `BottomSheet/BottomSheetPanel.test.tsx`       |     7 |
| `utils/characters.test.ts`                    |    22 |
| `MobileNav/MobileNavCloseEdgeCases.test.tsx`  |    12 |
| `__tests__/stubMatchMedia.test.ts`            |     6 |
| `MobileNav/MobileNavCloseVisibility.test.tsx` |     5 |
| `theme/extensibleAxes.test.ts`                |     4 |
| `utils/ime.test.ts`                           |     4 |
| `MobileNav/MobileNavCloseTiming.test.ts`      |     3 |

Grown suites, largest first: `theme/defineTheme` +10, `theme/expandColorScale` +10, `Banner` +9,
`ComplexSelector` +6, `DateTimeInput` +6, `Markdown/parser` +6, `TextArea` +4, `MultiSelector` +3,
`Typeahead` +3, `PowerSearch/formatFilterValue` +2, and eleven suites at +1.

Three `MobileNav` close-behaviour files arriving at once, for a component whose implementation moved
+128 / −37, is the same signal `useMenuHover` gave at 0.4.2 — upstream wrote a suite because it
fixed something subtle. Read those three before touching `MobileNav`.

### Re-deriving the header counts

Every suite header stating a count is a contract against upstream's file **at the pin**, so the
bump invalidates them. Attempting to re-derive them by parsing the prose failed and is worth
recording as a dead end: a header's first number is very often not its claim (`table`'s header
yielded "11" for a file with 121 cases), so a regex over the prose manufactures false positives
faster than it finds real ones.

What does work is comparing **case counts on both sides**, which needs no prose. Mapping our
kebab-case files onto upstream's PascalCase ones needs two keys, not one — ours are dir-prefixed
where upstream's are not (`Markdown/parser.test.ts` is `markdown-parser.test.ts` here) — and each
upstream file must be resolved once against a claimed-key set, or registering one file under two
aliases counts it twice and reports the unmatched alias as a missing suite.

Measured that way against v0.4.4: 141 upstream suites map, **92 are exactly level**, 42 are behind
by 251 cases in total, and 114 have no counterpart. The last figure is soft — it folds in suites
this port deliberately rolls up differently (`Stack`/`HStack`/`VStack`) — so it is not a metric to
quote. The 42-suite shortfall is concrete, and the part of it this bump caused is the grown-suite
list above.

## Units

### `Banner` — closed

The largest single source of drift in the batch, and it showed up in **all three oracles at once**,
which is what a change to a themable surface looks like: 12 of the 20 class mismatches, the only
theme mismatch, and a handful of CSS rules.

What upstream changed, and what landed here:

| Upstream change                                                         | Ported as                                   |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| `--_banner-radius` indirection on four radius keys                      | same, `var(--_banner-radius, <token>)`      |
| Header wraps: `flexWrap`, `columnGap`/`rowGap` split from `gap`         | same                                        |
| New `headerContentWithEndContent` (`flex-basis: 8rem`)                  | same, plus a second `inline` claim          |
| `overflowWrap: 'anywhere'` on title and description                     | same                                        |
| `endArea` wraps within itself: `flexWrap`, `justifyContent`, `maxWidth` | same                                        |
| `borderBottom*` → `borderBlockEnd*` on the content area                 | same                                        |
| Status lookups become `Partial`, with a `FALLBACK_ROLE`                 | same, plus a `hasStatusStyle` guard         |
| `isRenderable` replaces `!= null` on four slots                         | see below                                   |
| Focus handoff on dismiss                                                | `onfocusincapture` / `onpointerdowncapture` |

Two of these are worth more than a table row.

**The derived-var registry already had the entry.** `--_banner-radius` is not a free-floating custom
property: `theme/derivedVarRegistry` maps `banner`'s `borderRadius` onto it, so a theme that rounds
the `banner` target emits the var the component reads. That registry entry was already ported —
it had simply been a **dead hook**, with nothing reading the var it emitted. Wiring the component
closed the loop, and nothing in the theme layer had to change to do it.

**The theme fix removed a declaration rather than adding one.** `neutral`'s `status:info` used to
paint `background-color` directly _and_ force `--color-accent-muted: transparent` so the two would
not stack — two declarations doing one declaration's work. Upstream now redirects the token the
header already paints with, and the port follows: one declaration, and the theme oracle goes from
348 declarations with a mismatch to 347 with none.

**`isRenderable` splits three ways in Svelte, not one.** It is `node != null && typeof node !==
'boolean' && node !== ''`, and it is deliberately unported (`port/research/06`). For `icon`,
`endContent` and `children` — `Snippet`-only here — `!= null` is already exact, because a `Snippet`
is never `''` or a boolean. For `description`, typed `string | Snippet`, it is **not**: the guard was
`!= null`, so `description=""` rendered an empty description row. Upstream's new case caught it, and
that is the defect this unit's test delta was worth on its own.

Tests: **38 → 45**, against upstream's 47. The two dropped cases pass `{false}` as a snippet-typed
slot to exercise `isRenderable`; a Svelte `Snippet` cannot be `false` (the type forbids it and
`{@render}` would throw), so there is no state to assert. Both are named in the file header with
that reason, per the case-for-case contract.

One porting note for the wrapping cases: upstream asserts the literal `'8rem'` because jsdom returns
the declared value. These run in real Chromium, which resolves it, so they compare against the
computed length — derived from the root font size rather than hardcoded as `128px`, since the
threshold is authored in `rem` precisely so it tracks that.

### Form-wide optionality defaults — new at 0.4.5, 18 files

The batch's largest single change, and it was **not in the plan**: `Switch` needed
`aria-required`, which needed `useResolvedRequired`, which is new at 0.4.5 and has **14
consumers**. Sizing a unit by its oracle mismatch count would have missed it entirely — `Switch`
showed one.

`FormLayout` gains `defaultOptionality`, and the rule is _only the exception is marked_: a field
restating the form's default shows no indicator, a deviation shows one. The indicator is suppressed
for the unmarked majority, so `aria-required` has to be exposed anyway — otherwise a sighted user
reads a field as required (form default, no indicator) while a screen reader hears "not required".
It drives `aria-required` only, never the native `required`, so a layout default cannot switch on
browser validation.

**One structural correction fell out of it.** Upstream's `FormLayoutContext` has always been
`{direction}`; this port had flattened it to the bare direction. That made an _additive_ key
upstream a _shape change_ here. Matching upstream's object again is what keeps the next added key
additive — the same class of divergence as the `{...rest}` entry, caught before it cost anything.

Ported with 13 new cases in a **new `form-layout.svelte.test.ts`**. This port had no `FormLayout`
suite at all, so the other 17 upstream cases are named in that file's header as a pre-existing gap
rather than left implied by a missing file.

### `DateRangeInput` — one mismatch, ~300 lines

`maxRangeSpan` / `minRangeSpan`, spanning `plainDateDiffDays` (new), `useCalendarConstraints`,
`Calendar`, `MonthGrid` and `DateRangeInput`. A preset whose range violates the bounds renders
disabled rather than hidden — the cap is authoritative, so the preset stays discoverable but
non-committable. `Calendar` also gained the anchor-clears-selection behaviour and a new
`@astryx.calendar.rangeClearedAnnounce` string, which is the escape hatch when `minRangeSpan`
disables the days around the anchor.

### `StatusDot` — an `icon` slot

Each variant now sets an ink colour beside its plate, so a user-supplied icon painting from
`currentColor` can never drift out of contrast. On-warning is a fixed dark ink (~9.6:1 on the yellow
plate) where a surface ink lands near 2:1.

### `ComplexSelector` — 6 → 12 cases

A `ghost` toolbar variant, a `startIcon` slot, `alignment`, and an imperative handle. Upstream's
`handleRef` + `useImperativeHandle` becomes **instance exports reached through `bind:this`**, the
convention `SideNav`'s `getCollapseState()` set.

The re-open guard is the part with a real failure behind it: light dismiss fires on pointerdown and
the trigger's click lands after, so without a 50 ms guard the pair reads as close-then-open and the
surface never shuts.

### `MobileNav` — #4290, and a debt that retires with it

A `<dialog>` opened with `showModal()` blocks the whole document for as long as it holds the top
layer, **rendered or not**. The drawer hid itself the instant `isOpen` flipped, so `close()` always
ran against an already-hidden dialog, and a browser that fails to un-block leaves the page inert
with no JavaScript error. The fix keeps `display` in the transition with `allow-discrete` and splits
the unmount close into its own effect.

**That split is what retires this port's own recorded debt.** `mobile-nav.svelte.test.ts` stated the
delayed `close()` was "dead code on both sides" — true, and for the reason given: the teardown
closed the dialog before the delay could fire. 0.4.5 separates them precisely so an `isOpen` flip
stops cutting the slide-out off. The header's pointer to `port/debts.md → Known debts` was itself
stale: no such entry exists, so there was nothing to retire but the claim.

Three effects now, in upstream's order — side resolution first (so the trigger is still the active
element when `side='auto'` reads it), then open/close, then an unmount-only close. The close delay
is _derived from the hold actually in effect_ rather than assumed, because themes rewrite
`--duration-medium` (the shipped y2k theme sets it to exactly 250 ms).

`parseShortestDurationMs` and `resolveCloseDelay` live in `close-timing.ts` rather than the
component: Svelte cannot export from an instance script, and upstream marks the parser
`@internal Exported for unit tests`.

### The `matchMedia` stub was a trap already set here

Upstream added `stubMatchMedia` at 0.4.5 because a blanket `matches: true` also answers
`prefers-reduced-motion` — which caps `MobileNav`'s close delay at 0, so a suite runs against an
immediate close while its names claim it exercises the real delay, **and every test still passes**.
This port's `mobile-nav-reopen.svelte.test.ts` used exactly that shape. Helper ported (with its own
six cases — a test helper earns a suite when its failure mode is invisible) and that file switched
over. It still passes, so nothing was being masked: the trap was set, not sprung.

## Tests added

| Suite                                              |                    Cases |
| -------------------------------------------------- | -----------------------: |
| `form-layout.svelte.test.ts` (new)                 |      13 of upstream's 30 |
| `banner.svelte.test.ts`                            |            38 → 45 of 47 |
| `complex-selector.svelte.test.ts`                  |         6 → **12 of 12** |
| `mobile-nav-close-edge-cases.svelte.test.ts` (new) |                 11 of 12 |
| `mobile-nav-close-visibility.svelte.test.ts` (new) |               **5 of 5** |
| `mobile-nav-close-timing.test.ts` (new)            | **3 of 3** (14 expanded) |
| `stub-match-media.test.ts` (new)                   |               **6 of 6** |

Dropped, each named in its file with its reason: two `{false}`-as-snippet cases in `Banner`
(a Svelte `Snippet` cannot be `false`) and `survives StrictMode double-invoked effects` (React has a
double-invoke development mode; Svelte has none).

**Two upstream assertions became counterparts rather than translations**, both because they encode
jsdom artefacts:

- `Banner`'s wrap threshold asserts the literal `'8rem'`; a real browser resolves it, so the case
  compares the _computed_ length derived from the root font size — not hardcoded as `128px`, since
  the threshold is authored in `rem` precisely so it tracks that.
- `MobileNav`'s hold asserts `transitionDuration` **contains `var(`**, which is only true because
  jsdom never resolves custom properties. The intent — _the hold stays tied to the motion token
  rather than a literal_ — is asserted by comparing the resolved hold against the resolved
  `--duration-medium` **numerically**, since the token reads `.41s` and the computed style
  normalises to `0.41s`. Stronger than upstream's: it would catch a literal that happened to equal
  the token today.

## What the audits caught

## Rules promoted

## Debts opened
