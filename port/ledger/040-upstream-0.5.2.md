---
seq: 040
title: Batch 40 — track upstream 0.5.2
upstream: 0.5.2
date: 2026-08-26
units: [pin, docs prose, oracle re-baseline]
upstream-prs: []
---

## Status: IN PROGRESS

The mechanical half is done and the scope below is measured, not estimated. The porting work it
names is not done. Nothing here should be read as a completed batch.

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

## Still to do

- Port the nine modules above.
- Resolve the 125 oracle mismatches.
- Re-derive **every** suite header's case count against the new tag — a header stating a count is a
  contract against upstream's file at the pin, so the bump invalidates all of them even where
  nothing local changed. Diff the test delta as scope, not follow-up.
- Re-derive the token count against the new tag rather than carrying it forward.
- Check whether the tarball lags source for anything new.
- 0.5.2's category rename (Data Input → Form Controls) reaches the docs registries and the CLI.

## Rules promoted

Pending — this batch is not closed.

## Debts opened

Pending.
