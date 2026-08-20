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

### The loose 0.4.5 modules

Five arrived without a component of their own, and three of them were **already here, inline and
duplicated** — 0.4.5 is largely an extraction release for these.

| Module                                        | What it was here before                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `utils/ime`                                   | `isImeKeyEvent` in `use-focus-trap`, plus three inline copies of the same two-signal test |
| `utils/characters`                            | `Avatar`'s own `Intl.Segmenter` + `firstGrapheme`, and three hand-rolled truncations      |
| `theme/merge-components`                      | `deepMergeComponents` inside `define-theme.ts`                                            |
| `Calendar/get-standalone-short-weekday-names` | a hardcoded `['Su','Mo',…]` array                                                         |
| `theme/extensibleAxes`                        | nothing — see below                                                                       |

`isImeKeyEvent` moves to `utils/` and the hooks barrel keeps upstream's **deprecated one-release
re-export**, because it is a pure predicate rather than a hook. `characters` replaces `.length` /
`.charAt(0)` / `.slice(0, n)` across `Avatar`, `TextArea`, `PowerSearch` and `Table` so an emoji
counts as one character; `TextArea`'s counter is now guarded at the call site as well as inside
`announceCounter`, so a textarea with no `maxLength` never segments its value on a keystroke.

The weekday names become CLDR-generated and locale-resolved. The generated table is **copied
verbatim** rather than regenerated: this port has no CLDR pipeline, and deriving the strings
independently would risk drifting from what upstream's own comparison uses.

### `expandColorScale` gains a per-scheme accent

The one loose change that is a real feature: `accent` now accepts a `[light, dark]` tuple, so the
light scheme's palettes derive from the light seed and the dark scheme's from the dark seed. Every
palette reference splits — `P`, `N`, `NV` become `PL`/`PD`, `NL`/`ND`, `NVL`/`NVD` — across 27
`ld()` calls, with the D palettes aliasing the L ones when a single seed is given. **That aliasing
is the property that matters**: single-seed output has to stay identical to the pre-tuple
implementation, and all 64 existing cases passing unchanged is what says it does.

### An upstream test found a defect here before it was ported

`theme/extensibleAxes.test.ts` is new at 0.4.5 and is a _repo-structural scanner_: it walks the
source tree checking that every extensible `*Map` axis is kept in all three places it is promised —
the augmentable interface, `themeProps` putting the axis on the DOM, and the doc's `visualProps`.
Miss the middle one and the type says yes while the CSS says nothing.

The scanner is tied to upstream's file layout (`Foo/index.ts`, PascalCase dirs), so porting it is a
rewrite rather than a transcription and is **deliberately deferred** — named here rather than left
implied. But the check it encodes was run by hand against this tree first, and it found the same
defect upstream wrote it for: **`TreeList` declared `TreeListVariantMap` while
`themeProps('tree-list', …)` passed only `density`**, so an augmented variant type-checked,
rendered, and could not be themed. Upstream closed it at 0.4.5 in one line; so does this. The doc's
`visualProps` third leg came along with the regenerated `.doc.mjs`.

Getting the _finding_ without the _tooling_ is the right trade here: the defect is real today, the
scanner protects against a future one.

### The `.doc.mjs` regeneration

`pnpm -r build && pnpm -F docs emit-core-docs` after the pin move — **17 files changed**, which is
also where `TreeList`'s `visualProps: ['density', 'variant']` came from. They are generated and
hand-editing them is a mistake; each says so at the top.

## Tests added

| Suite                                                 |                    Cases |
| ----------------------------------------------------- | -----------------------: |
| `bottom-sheet.svelte.test.ts` (new)                   |    **70 of 70** running¹ |
| `sheet-gestures.svelte.test.ts` (new)                 |             **45 of 45** |
| `bottom-sheet-switcher.svelte.test.ts` (new)          |             **24 of 24** |
| `bottom-sheet-panel.svelte.test.ts` (new)             |               **7 of 7** |
| `form-layout.svelte.test.ts` (new)                    |      13 of upstream's 30 |
| `banner.svelte.test.ts`                               |            38 → 45 of 47 |
| `complex-selector.svelte.test.ts`                     |         6 → **12 of 12** |
| `mobile-nav-close-edge-cases.svelte.test.ts` (new)    |                 11 of 12 |
| `mobile-nav-close-visibility.svelte.test.ts` (new)    |               **5 of 5** |
| `mobile-nav-close-timing.test.ts` (new)               | **3 of 3** (14 expanded) |
| `stub-match-media.test.ts` (new)                      |               **6 of 6** |
| `characters.test.ts` (new)                            |             **22 of 22** |
| `ime.test.ts` (new)                                   |               **4 of 4** |
| `get-standalone-short-weekday-names.test.ts` (new)    |               **5 of 5** |

¹ 63 `it` cases and two `it.each` tables. Nothing dropped across the four sheet suites: 146 cases,
all of upstream's.

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

## The sheet suites found seven defects, and every one was a phase error

The four ported suites are the reason this batch is trustworthy, and what they caught is a single
family: **`$effect.pre` used for a layout effect that reads the DOM.** React's `useLayoutEffect`
runs after the commit with `ref.current` already populated — that is where a plain `$effect` runs,
not where `$effect.pre` does. `bind:this` is itself an effect created after the script's, so a pre
effect runs first with nothing bound.

1. **The entrance completed on the frame it started.** `$effect.pre` ran before `bind:this`, so
   `waitForTransition(null)` resolved immediately.
2. **A settled sheet pinned a detent too low.** The panel _appended_ its transform to the hook's
   declaration string, where upstream's `{...contentProps.style, transform}` spread replaces it. The
   fix parses the hook's `transform` out and rebuilds the rest of the string without it.
3. **Settle resolved instantly instead of following the snap.** The pre pass read the render being
   _replaced_, which still carried the drag's inline `transition: none`. Both reading effects moved
   to `$effect`.
4. **The keyboard scroll range cleared on close.** Not a phase error but its neighbour: the main
   effect tore down on an _unchanged_ re-notification and lost `keyboardGeometry`. Six `$derived`
   dependency wrappers give it React's value-compare semantics.
5. **A flow active on mount rendered a closed dialog.** `dialogEl` read `untrack`ed inside
   `$effect.pre`, so the element that arrived was never heard about.
6. **Focus "restored" into the sheet just dismissed.** The trigger was captured _after_ the focus
   trap had already pulled focus inside; capture moved ahead of the trap.
7. **A shared dialog left open with nothing in it.** The panel never reported `null` on teardown, so
   the switcher believed a panel was still mounted.

Two harness facts made upstream's jsdom numbers reproducible in real Chromium, and both are
differences in how a case is _driven_, never in what it asserts: geometry stubbed to zero, and a
real transition rule injected. `mockIOSWebKit` also needs its own `vibrate` no-op —
`Object.create(navigator)` inherits Chromium's real one, and `hapticTick` then throws
`Illegal invocation`.

## The demo routes are retired

`packages/core` carried a SvelteKit demo app beside its library — 35 route files, an `app.html`, a
favicon and an adapter — that predated the docs site. Once `docs/` covered every component with its
own example blocks it was two places to demonstrate the same thing, under a parity rule that applies
to both, and the workbench was the one nobody looked at: 36 files against `docs/`'s 185 example
directories.

Verified before deleting rather than after: `svelte-kit sync`, `check`, `build`, `lint` and
`assert-core-ships-src.mjs` all pass without `src/routes`, and the client project runs without
`src/app.html`. `@sveltejs/adapter-auto` went with it — an adapter only runs at app-build time and
this package is never built by `vite build`; the config now says so where the adapter used to sit.

`assert-core-ships-src.mjs` keeps rule 5. `src/tests` is still under `src/`, so the next thing to
land beside `src/lib` is caught the same way; only the comment naming the routes changed.

## The example blocks

Upstream ships six blocks for the family, and this batch is where they land: five under
`BottomSheet` and the switcher's three-step notification flow. Two translations are worth naming.

`BottomSheetSwitcherShowcase` is **one file where upstream has four components**. Svelte has one
component per file, so the three steps inline and the state each of them held moves to the top.
Nothing about lifetime changes — the switcher keeps all three sheets mounted either way, so
upstream's per-step state survives a handoff exactly as this does.

`BottomSheetSnapPoints` is the **widest icon substitution in the block corpus**: six Heroicons over
twelve turn-by-turn steps collapse onto four built-ins, because the registry has no pin, u-turn or
flag glyph. The existing debt entry now says so.

Checked in a browser at a 420×900 viewport, not only by `check` and `lint`: all five
`BottomSheet` blocks render, the showcase opens over its scrim, and the switcher's three-step flow
hands off through all three sheets with each step's state intact.

## What the audits caught

All four ran, plus `astryx-oracle`. The short version: **the suites had not found everything**, and
the one audit worth singling out is `astryx-idiom`, which was asked to sweep _every_ remaining
`$effect.pre` in the family and classify each as write-before-paint or read-after-commit.

### `astryx-idiom` — two more of the same defect

The seven defects above were six instances of one mistake. The sweep found **two more the porting
missed**, both invisible to the ported suites:

- **`use-sheet-gestures.svelte.ts:502`, the reconciliation reflow.** Its entire job is to compute
  style for the DOM that now carries `transition: none` _and_ the new transform, so that pair
  becomes the "before" the next recalculation compares against. As a pre effect it ran before the
  template wrote the `style` attribute, reflowing the render being **replaced** — so every snap
  settle animated the swap that must be instantaneous, throwing the sheet the wrong way for
  `--duration-medium` immediately after it appeared to land.
- **`use-sheet-gestures.svelte.ts:708`, the snap-points re-anchor.** `reanchorToSettledDetent`
  _measures_ — strips the inline height, reads `getBoundingClientRect()`, reads the body's scroll
  metrics. A pre effect reads all of that before the DOM update, so a host changing `snapPoints` in
  the same update as anything altering the sheet's box re-anchors against geometry that no longer
  exists.

**Neither is catchable by the ported suites, in either language.** Upstream's `reconciliationFrames`
cases and our ports of them assert that `transition: none` is _present in the style string_ during
the held frame, which is true whichever phase the reflow sat in. That makes this the strongest
argument in the batch for running the idiom audit even when the suite is green: 146 passing cases
did not see either one.

A third finding — the sheet attachment subscribing to `isOpen` through an un-`untrack`ed
`options.isOpen()` — is a rule violation with **no demonstrated symptom**; the agent traced every
path and each is a no-op. Fixed anyway, because `recordSheetHeight` is also the `ResizeObserver`
callback, so the next reactive read added to it would become an attachment dependency silently.

### `astryx-parity` — 8 findings, none blocking

Source and published `dist/` agree throughout this family, and the two things most likely to have
gone wrong had not: the `BottomSheetProps` union reproduces upstream's arms field for field
including `never` placement, only the union is published, and `{@attach}` reaches the sheet `<div>`
on `BottomSheet` and the shared `<dialog>` on `BottomSheetSwitcher` — verified as behaviour, through
three rest spreads, not as intent.

What it did catch, and what happened to each:

| Finding                                                                  | Outcome                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Neither `.stylex.ts` wired into the class oracle, no `skip` saying why    | Fixed — see below                                        |
| `.doc.mjs` prop types named `BottomSheetHeightValue`, an unimportable alias | Fixed; the residue is a debt entry                      |
| `heightBudgetFor()` exported with zero callers                            | Deleted                                                  |
| `UseMobileKeyboardOptions` exported where upstream's is module-private    | Unexported                                               |
| `wait-for-transition.ts` header claimed it had more than one caller       | Corrected — it has one importer, two call sites          |
| Two effect-phase deferrals documented in-file only                        | Recorded in `debts.md`                                   |
| `panelState` renamed from upstream's `state` on a rationale that does not reproduce | **Open** — see below                           |

The `panelState` finding is the one left open, and deliberately. The agent compiled a replica of the
panel's shape and showed that a prop named `state` does not make `$state` ambiguous, so the stated
reason is false — but the claim is repeated verbatim in `bottom-sheet-panel.svelte.test.ts`, the
component is module-private either way, and renaming a prop plus its harness during a release gate
buys nothing. It is a comment to correct, not a divergence to close.

### `astryx-oracle` — the family was unguarded

The gap `astryx-parity` found was the serious one: a whole new component family with **no oracle
coverage at all**, which is the port's central guarantee simply not applied. Both modules are wired
in now. The run goes **1625 → 1635 style keys and 516 → 532 inline call sites, 0 skipped, 0
mismatches** — nothing here was undiffable, so no skip was needed.

Two details worth keeping. Upstream declares the dialog shell twice, byte-identical, and only the
switcher's copy survives in `dist/` as an object — an `xstyle` argument defeats the fold there,
while `BottomSheet.js` folds the same keys at a literal call site. So this port's *shared* module
needs two cases, object and inline, to cover what upstream splits across two declarations. And the
two property-key overrides (`dialogOpen` swapping `display`, `dialogNonModal` swapping `dvw`/`dvh`
for `%`) are reproduced by the merge rather than skipped, mutation-checked by reversing the merge
order and confirming the run fails.

### `astryx-test-parity` — the count contract holds

**146/146, and all four headers are true at 0.4.5** — re-derived by counting upstream's cases rather
than by trusting our own prose, which is the failure mode that made four headers false at the last
bump. Nothing silently missing, nothing added, no drop note anywhere to expire.

Three cases had been weakened in translation, none of it forced, all now restored:

- `keeps focus in a modal sheet that has no tabbable controls` had **lost its premise**. The fixture
  rendered no background control outside the switcher, so there was nowhere for focus to go and the
  case could not fail the way it is named — worse than a weak assertion. Upstream's fourth assertion
  and its `Background action` button are back, gated on the fixture so the other eight cases keep
  running without one.
- `ignores Escape while an IME composition is active` ran on `hasScrim: false`, covering this port's
  local `!isModal` guard, where upstream's runs modal and covers the focus-trap guard. Moved to the
  modal branch, and **mutation-checked** rather than accepted on a green tick: stripping the IME
  flags fails the case, so it evidences the trap's guard rather than a dead path. Upstream has the
  identical `!isModal` guard and ships no case for it, so neither do we — recorded on the case so
  the next reader does not "restore" the gap.
- Four `toHaveAccessibleName` assertions had been downgraded to `getAttribute('aria-label')`. The
  matcher is used in ten other suites here, so nothing about the browser runner required it, and at
  the switcher re-labelling case an attribute read cannot see the `aria-labelledby` branch the
  label derivation actually has.

### `astryx-surface` — and a regression this batch introduced

BottomSheet's published surface is exactly upstream's six names with nothing leaked, and the three
0.4.5 utility extractions all land on upstream's subpaths. The sweep's own finding against this
batch was the valuable one:

**Deleting `src/app.html` turned every `check` and every `prepack` into a ten-line `load_template`
stack trace.** Non-fatal — `svelte-package` reads `svelte.config.js`, not the Vite config — which is
exactly why it was missed: the removal was verified by reading `0 ERRORS` off the end of a run whose
head carried the stack. A build that prints a stack on every run is a build whose output stops being
read. `app.html` is back as the two placeholders SvelteKit requires, saying in a comment why it
exists when nothing renders it.

Two of its neighbours went dead with the routes and were **shipping to consumers**: `src/app.d.ts`
and `src/virtual-modules.d.ts`, both let through by a `.d.ts` exemption in rule 5 of
`assert-core-ships-src.mjs` that existed for exactly those two files. Both deleted, exemption
removed — a `.d.ts` outside `src/lib` is now a leak like any other, which is what the rule was for.

The rest of the sweep is pre-existing and **deliberately not acted on**: three `Layer` context
symbols withheld while three symbols in the identical upstream position are published, and nine
over-exports against upstream's barrels. Every one is an add or a remove on a surface that has
shipped. That is semver-visible and belongs at a minor as one decision, not in the polish before a
patch — `todo.md` carries it, including that the comment at the head of `src/lib/index.ts` cites the
barrel-*absent* rule to justify withholding barrel-*present* symbols and needs rewriting whichever
way it goes.

Three gaps it found that had **never been recorded anywhere** are now in `debts.md`: 28 of upstream's
locale catalogs unported, `./theme/tokens` and `./theme/tokens.stylex` missing from the exports map
though `dist/styles/tokens.stylex.js` already ships, and `tailwind-theme.css` with no counterpart.
All three had been sitting in a ledger entry or in `upstream-diff.md` — per-batch and frozen records
that the parity agents do not grep, which is how a two-key fix stayed open across four batches.

## Rules promoted

- `CLAUDE.md` § The parity rule — the rule now names the docs site's example blocks, not the demo
  routes, as the surface it covers.
- `CLAUDE.md` § The docs site — a new opening paragraph: it is the port's only demo surface, why
  the route existed, and why it is gone.
- `CLAUDE.md` § Commands — `pnpm dev` runs the docs site; `dev:docs` no longer exists.
- `.claude/agents/astryx-parity.md` — the "our demo page" row of the where-things-live table is now
  `docs/src/lib/examples/<Name>/`.
- `.claude/skills/port-component/SKILL.md` — step 6 adds example blocks under `docs/`, and says
  `packages/core` has no demo routes.
- `.claude/agents/astryx-idiom.md` — two sharpenings, both paid for above: `$effect.pre` is for a
  layout effect that **writes** before paint, never one that reads the just-committed DOM
  (`bind:this` is a later effect); and an over-tracking effect with a **teardown** loses what that
  teardown discards on every unchanged re-notification, not merely an extra run. The same bullet
  now carries the audit's own lesson: sweep every `$effect.pre`, and do not accept a green suite as
  evidence the phase is right.
- `CLAUDE.md` § Commands — run the client project alone. Two vitest processes on it at once fail at
  *project init* with `EPERM ... rename` and report every chunk as failed, which reads as a
  catastrophic regression rather than as contention. It cost a full gate run here.
- `packages/cli/scripts/assert-core-ships-src.mjs` — rule 5 no longer exempts `.d.ts`, and the
  comment records that the exemption was load-bearing for exactly the two files that had just gone
  dead.
- `docs/scripts/lib/props-types.mjs` — `renderType` expands a union that **mixes** literals with
  primitives, and its docstring now records the hard limit past that: TypeScript collapses string
  literals into `string`, so upstream's hand-written `'hug' | 'capped' | 'tall' | number | string`
  is not recoverable from a `.d.ts` and is not going to be faked.

## Debts opened

None new. Four existing entries were re-scoped by the routes retirement, since each described the
demo route as the place a thing was or was not shown:

- `Icon` demo hand-draws an SVG for component mode → **`Icon`'s component mode has no example
  block**, since the hand-drawn `squiggle-icon.svelte` went with the route and `docs/` has no
  counterpart.
- The docs example blocks' Heroicons substitutions no longer describe themselves as matching the
  demo routes', and now name the `BottomSheetSnapPoints` swaps.
- `Thumbnail`'s hoisted image module is no longer "the same file as the demo routes'" — it is the
  only copy.
- The props-table entry no longer claims `PropsTablePattern` is ported on the demo route.
