---
seq: 040
title: Batch 40 — track upstream 0.5.2
upstream: 0.5.2
date: 2026-08-26
units: [pin, docs prose, oracle re-baseline]
upstream-prs: []
---

## Status: gate green, front not closed

`pnpm verify` passes all seven stages. Class oracle **0 mismatches** (from 125), CSS oracle matches
upstream, all eight theme oracles pass, `svelte-check` 0 errors, every one of upstream's 283 suites
has a counterpart.

What is **not** done is the case-level test delta: 74 upstream suites grew, and roughly 400 new
cases sit in suites that exist here but fall short. Those shortfalls are stated in each suite's own
header, which is the contract — but many of those headers still state their count against 0.5.0.
See "Still to do".

## Scope, measured against the tags

Two upstream releases land at once: `0.5.1` (large) and `0.5.2` (small — a component-category
rename, Data Input → Form Controls, and a translation-lookup perf change).

`git diff v0.5.0..v0.5.2 -- packages/core/src`: **272 files, +20,217 / −1,746**.

- **No component directory churn.** 104 PascalCase dirs at both tags, and the sets are identical —
  no additions, deletions or renames. So `status.md`'s Surface section will not move, and the
  bump adds no components.
- **77 test files changed, +11,324.** Nine are new files.
- **53 entries** in 0.5.1's `@astryxdesign/core` notes, plus 10 cli, 1 build, and one fix in each
  of seven theme packages.

### Nine new upstream modules have no counterpart here

Checked with **kebab-case** names, per the standing hazard — a camelCase grep against this tree
returns a false absence.

| upstream | backs |
| --- | --- |
| `DateInput/NativeDateField`, `nativeDateSegments` | the new `nativePicker` prop |
| `DateTimeInput/TouchDateTimeField` | coarse-pointer bottom-sheet picker |
| `Layer/gestureCounter` | the touch/swipe work |
| `Toast/useToastGesture` | swipe dismissal |
| `utils/interactionOverlay.stylex` | pressed overlays overriding hover |
| `utils/isApplePlatform` | platform detection, consolidated |
| `NumberInput/numberInputCommit`, `numberParser` | locale-formatted paste |

These are **implementation** gaps, not test-porting gaps. Batch 033's rule applies: an unported
suite is a possible missing module until checked, and here nine of them are.

### Oracle re-baseline

`test:parity` after the re-pin: **1,815 style keys and 599 inline call sites checked, 0 skipped,
125 mismatches.** They cluster exactly where the release notes say they should:

| module | mismatches |
| --- | --- |
| `touch-date-field` | 17 |
| `toast-viewport` | 15 |
| `toast` | 14 |
| `spinner` | 9 |
| `avatar` | 7 |
| `number-input`, `grouped-rows` | 5 each |
| `calendar`, `button` | 4 each |
| the rest | 1–3 each |

## What is done

- **Re-pinned, exact, all ten** `@astryxdesign/*` devDependencies across nine manifests. `pnpm
  install` clean.
- **72 `.doc.mjs` files** regenerated via `pnpm -r build && pnpm -F docs emit-core-docs` — the
  whole 0.5.0 → 0.5.2 prose delta.
- `pnpm -r check` passes: the bump breaks no types.
- **Skip list audit is a no-op with a reason.** `skip` and `inlineSkip` do not exist in
  `compare-upstream-classes.mjs` and `ABSENT_UPSTREAM` is empty — earlier batches took the list to
  zero, which is what "0 skipped" in the oracle output means. Nothing retired because nothing was
  deferred.

## A near-miss worth keeping

The re-pin was scripted with `"@astryxdesign/[a-z-]+"`, which silently skipped **`theme-y2k`** —
the digit is not in the character class. Nine manifests rewrote, one did not, and the only reason
it surfaced was counting the result rather than trusting the script's own "rewrote 8 manifests".

Same family as the camelCase-against-a-kebab-case-tree false absence: an assumption about the shape
of a name, applied silently, failing safe-looking. **Count the matches against the expected total,
never the rewrites against nothing.**

## The interactionOverlay migration, and its verified pattern

`utils/interactionOverlay.stylex.ts` is ported and **proven**: registering it with the class
oracle took the style-key total 1,815 → 1,818 and it reports **zero mismatches**, so the
transcription compiles byte-identical to upstream's published output.

It is a *migration*, not an addition. Upstream removed the equivalent per-component
`backgroundImage` rules from twenty components' own style groups and applies the shared keys at
each call site instead. So every consumer that has not yet adopted it shows up in the oracle as
**our group carrying classes upstream's no longer does** — which is what most of the spread across
`button`, `outline`, `item`, `token`, `step`, `side-nav-*`, `top-nav-*`, `tree-list-item`,
`avatar-group-overflow`, `selector` and `number-input` is measuring.

The pattern, established and verified on `token` (125 → 124 mismatches, and `token` left the list):

1. Delete the `backgroundImage` block from the component's own interactive style key.
2. Import `interactionOverlayStyles` from `../../utils/interaction-overlay.stylex.js`.
3. Apply `interactionOverlayStyles.backgroundImage` at the call site, under the same gate the
   component already uses for its interactive styles.

### The oracle names the set; the consumer list does not

Forty-two of our `.stylex.ts` files reference `--color-overlay-hover`, and upstream has twenty
adopters — but the set that actually needs migrating is **neither**. Migrating a component upstream
did not migrate would be inventing, so the set was derived from the oracle instead: the keys where
we emit the `backgroundImage` hash (`kKwaWg`) and upstream no longer does. That is **12 keys across
8 modules**, and it is the whole job.

Done, each verified by re-running the oracle:

| module | keys | mismatches |
| --- | --- | --- |
| `token` | `interactive` | 125 → 124 |
| `button` | four `variants.*` | 124 → 120 |
| `selector`, `multi-selector`, `complex-selector` | `triggerGhost` | 120 → 117 |
| `tree-list-item`, `number-input`, `avatar-group-overflow` | 3 keys | 117 → 114 |

`avatar-group-overflow` takes `backgroundImageOnNeutral` — it paints a neutral fill the overlays
layer onto — where the other seven take `backgroundImage`. Placement follows upstream's call-site
order in each case, which matters because StyleX is last-wins: the overlay goes before
`disabled`/`ariaDisabled` so those still override it.

`calendar`'s two `dayCellTheme` keys are the remainder of the twelve and are not yet done.

**A scripted import insertion broke a file, and the oracle caught it, not review.** Anchoring on
"the last line starting with `import `" put the new statement *inside* a multi-line import in
`number-input`, which is a Babel parse error rather than a subtle defect — but it is the same
class as the `[a-z-]+` pin miss above: a shape assumption about source text, applied by script,
across files that do not all share the shape.

## Two remainders that are not overlay work

- `avatar-group-overflow styles.base` differs in exactly one property hash (`kaIpWk`), unrelated to
  the migration.
- `number-input` has four **inline call-site** entries where upstream "has no matching call site"
  and lists nothing — upstream's stepper button is object mode where ours folds to a literal
  string. That is the object-vs-inline question `astryx-oracle` owns, not a style defect.

## The test delta is the largest remaining front, and it is measured

**74 upstream suites changed their case count** between 0.5.0 and 0.5.2. A stated count is a
contract against upstream's file at the *current* pin, so the bump invalidated every one of those
headers — and a header that overstates coverage makes a real gap look accounted for, which is the
failure this repo has already paid for twice.

The big movers: `SideNav` 144 → 186, `Toast/ToastViewport` 13 → 55, `NumberInput` 117 → 142,
`OverflowList` 19 → 34, `Carousel` 23 → 37, `Layer/useLayer` 32 → 46, `Selector` 144 → 158,
`ComplexSelector` 12 → 21, `HoverCard` 35 → 44. Roughly 400 genuinely new upstream cases sit behind
those numbers.

Whole suites with no counterpart are counted in `status.md` and are down from 7 to 5 (92 → 86
cases): `isApplePlatform` (4) and `TypeaheadItem` (2) are ported, and three of the remaining five
are behind modules this batch is still porting.

## A green oracle is not a finished migration

Worth stating plainly because it nearly shipped that way. The class oracle compares style **keys**.
Removing a component's own hover rules satisfies it whether or not anything applies the shared style
in their place — so six modules briefly had *no hover at all* and a completely clean oracle run.

Nothing failed. The only reason it was caught is that the call sites were written down as pending
before the keys were removed. Any migration that moves a declaration from a component to a shared
module needs its own check that the consumer adopts it; the oracle structurally cannot supply one.

## The locale never reached date formatting, on any surface

A ported case found it: under `<InternationalizationProvider locale="de-DE">` our DOM read
`March 21, 2026` where upstream reads `21. März 2026`.

The cause was a signature that had quietly dropped a parameter. Upstream's `plainDateFormat(pd,
options, locale)` and `formatSharedDate(pd, format, locale = 'en')` are two and three arguments
here, so the locale never reached `Intl.DateTimeFormat` and it fell back to the runtime default.
`date-parser.ts`'s `isLocaleDayFirst`/`parseDateInput` had the identical gap. **An
`InternationalizationProvider` locale was therefore inert on every DateInput surface**, and the
Gregorian calendar default upstream added in the same commit was missing too.

Threaded through 16 call sites across 12 files. Twenty further cases became portable and are ported:
`plain-date.test.ts` is 87 of 87 (it previously had no header at all), `date-parser.test.ts` 38 of
38.

**Two test stubs were deleted as part of the fix, and that is the part worth remembering.** The
DateInput suites each substituted `Intl.DateTimeFormat` so an omitted locale resolved to `en-US`.
With the locale threaded they are inert — but kept, they would hold 173 cases green *if the locale
argument were ever dropped again*. A stub that survives the defect it was written around is hiding
it, not testing it.

`formatInstant` has the same shape and is being fixed separately; upstream makes its locale a
**required** third positional argument, so it is a positional shift rather than an additive one.

## A stale count reads exactly like a defect

`date-input-touch.test.ts` failed two cases: `expected [ …(4) ] to have a length of 3`. It looked
like the touch-field port had added a stray transition.

It had not. Our `touch-date-field.stylex.ts` matches upstream's transition counts exactly — 4 linear
timing functions and 6 `SWAP_DURATION` — and upstream's own suite asserts 4 and 6. Ours still
asserted 3 and 5, the numbers from the 0.5.0 pin. The assertion was doing its job; the contract it
was checking had expired.

This is the cheapest possible illustration of why a version bump invalidates every header and every
count: the failure is indistinguishable from a real regression until you check upstream, and the
instinct on a red test is to change the implementation.

## Still to do

- Port the nine modules above.
- Resolve the 125 oracle mismatches.
- Re-derive **every** suite header's case count against the new tag — a header stating a count is a
  contract against upstream's file at the pin, so the bump invalidates all of them even where
  nothing local changed. Diff the test delta as scope, not follow-up.
- Re-derive the token count against the new tag rather than carrying it forward.
- Check whether the tarball lags source for anything new.
- 0.5.2's category rename (Data Input → Form Controls) reaches the docs registries and the CLI.

## Five gate runs, five failures, five different checks

The most transferable thing in this batch is not any one fix. It is that every gate run surfaced
exactly one real failure, and **each was caught by a check the others were structurally blind to**:

| check | found | why nothing else could |
| --- | --- | --- |
| `derived-var-registry` guard | six new public CSS vars undocumented | the oracles compare values, not documentation |
| CSS oracle | an invented rule we emit and upstream does not | the class oracle iterates *upstream's* keys, so a key only we have is invisible to it |
| browser suite | upstream gated the toast landmark on having something to announce | no static check renders a DOM |
| theme oracles | contrast fixes in four themes, 56 missing tokens in all eight | core's oracles do not read the theme packages |
| CLI docs/implementation cross-check | five documented theme targets no component emits | docs and components were each internally consistent; only a check crossing between them sees it |

Add to that the two neither oracle can see at all: a per-file **adoption count** against upstream
found seven modules with no hover state, and a ported **assertion** found the provider locale never
reaching the DOM.

A green oracle means one axis is clean. It never means the port is.

## Two ways of reading the wrong source

Both nearly produced a confident wrong answer.

`node_modules/.ignored/@astryxdesign/theme-chocolate` still carried the **0.5.0** punctuation value,
identical to ours. Reading it would have confirmed we were right; the published `dist/` and
upstream's git tag both disagreed.

And a rough scan for orphaned theme targets produced three false leads — targets already emitted
through `usePopover`'s `surfaceTarget:` option, which the scan's looser matching could not see. They
were labelled approximate and verified before acting, which is the only reason they were not
"fixed" into duplicates.

## Rules promoted

- `CLAUDE.md` § The fidelity oracles — a green class oracle is not a finished migration; derive a
  migration set from the oracle rather than from a consumer list.
- `scripts/status.mjs` — `countCases` strips comments before counting. The lookbehind rejected a
  backtick before `it`, which catches this repo's prose but not upstream's; `Timestamp.test.tsx`
  read as 78 where it declares 77, and the fix removed 12 phantom cases from each side.

## Debts opened

- `NativeDateField` drops `changeAction` from its rest spread where upstream leaks it. In React that
  is a dev warning; in Svelte a function in a spread stringifies its source into the DOM.
