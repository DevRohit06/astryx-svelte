---
seq: 033
title: Batch 33 — the test delta, and the modules 0.5.0 added that 032 missed
upstream: 0.5.0
date: 2026-08-25
units:
  [
    scrollbarGutter,
    useScrollLock,
    getInitialFocusDate,
    Calendar,
    useCollator,
    hasActiveFocusTrapEscape,
    useFocusTrap,
    useLocale,
    MobileNav,
    Layout,
    useTableGroupedRows,
    status.mjs
  ]
upstream-prs: []
---

## Scope

Front 1 of the current goal — the test delta — resumed after batch 032 moved the pin to `0.5.0` and
widened it. Batch 031 had driven the gap to a single suite; the version bump took it back to fifteen.

Scoping the fifteen found that several are not test gaps at all. `0.5.0` added twenty test files,
and batch 032 tracked the implementation drift in *existing* components — the oracles, the breaking
changes, the new `Stepper` — without noticing that some of the new suites test **modules this port
does not have**. The unported suite was the symptom; the missing module was the cause. The exact
split is in the sections below, and it is not what this batch's scoping first assumed: the shim
suite's subject turned out to be present already.

Batch 032's headers were not wrong about this. Two of them say it outright — `scroll-lock` records
that the gutter suite "has no ported counterpart at all" and that "both are a **hook** gap rather
than only a test gap", and `calendar` records that upstream's `getInitialFocusDate` block "is
unported *source*, not only unported tests". What failed is that nothing turned those sentences into
a number, and in one case the sentence was read as its own refutation — see _The measurement_ below.

Deliberately excluded: the four `Layer` dismissal suites (52 cases). They are blocked on the
dismissal stack itself, which is its own unit and its own batch.

Also excluded, and for a reason already written down: `theme/generateThemeRules.test.ts` (44 cases,
the largest single unported suite). Its blocker is an API divergence `port/debts.md` has recorded
since batch 030 — this port exports `generateThemeRulesSplit` but not upstream's
`generateThemeRules(theme): string[]`, and `generateThemeCss` returns one layer-wrapped string where
upstream's `generateThemeCSS` returns `{prose, component}` with the `@layer` wrappers left to each
caller. Scoping it here confirmed the debt's own judgement that it "belongs in a batch of its own":
upstream *derives* the split from the flat list by testing each rule for a leading `:where(`, and
this port generates the two groups separately, so exporting the flat list is not an addition but a
re-architecture — and the 44 cases assert on rule order and indentation that only that
re-architecture produces. It also reaches further than the debt records: upstream's `<Theme>` injects
**two** `<style>` elements, `data-astryx-theme-prose` for the reset layer and `data-astryx-theme` for
the theme layer, where ours injects one containing both. That is DOM-observable divergence, not only
a return type. It is batch 034.

## The missing modules

### `hasActiveFocusTrapEscape` — present after all, and the batch's own scoping error

This was booked as the fourth missing module on the strength of `hooks/index.ts` line 14 publishing
it upstream and a `grep` for the camelCase name finding nothing under `src/lib`. Both were true; the
conclusion was not. The symbol is defined in `use-focus-trap.svelte.ts`, exported from this port's
`hooks/index.ts`, and reaches the root surface through `export * from './hooks/index.js'` — the
grep that missed it was the same camelCase-against-a-kebab-case-tree mistake this batch had already
made once and corrected. What 0.5.0 actually changed was the deprecation and the guarding suite.

The suite is ported whole and blocks on nothing. Upstream keeps a private `activeEscapeTrapCount`
*beside* the shared dismissal stack rather than deriving the answer from it, precisely so the shim
keeps answering about focus traps alone — the shared stack carries tooltips, hover cards and dialogs,
which never trap focus. This port has one stack, `useFocusTrap`'s own, and nothing but a trap ever
pushes onto it, so the two implementations hold the same state and must answer identically. That
equivalence is conditional, and it is recorded in `debts.md`: the four families that must answer
`false` are what will fail on the day the shared stack lands, which is the whole reason to have
ported them now rather than with it.

### `getInitialFocusDate` — the one that was a behaviour bug, not a test gap

Upstream's module decides which month `Calendar` opens on, clamped into the `min`/`max` window.
This port seeded `focusDate` -> `value` -> `today` with no clamp at all, so the whole
`opens on a month inside the min/max window` describe had no counterpart — unported *source*
wearing the shape of unported tests, which is what batch 032's calendar header said and what
nothing acted on.

It matters because of who renders `Calendar` without a `focusDate`: `DateInput`,
`DateRangeInput` and `DateTimeInput` all forward `min`/`max` and none forwards `focusDate`.
With `min` in the future, the calendar opened on today's month with **every day disabled** and
the prev/next chevrons as the only way in. With `max` in the past, the same in the other
direction. A two-pane calendar now also shifts so `max` lands in the right-hand pane rather
than the left, without ever crossing `min`'s month, and inverted bounds resolve to `min`
deterministically. An explicit `focusDate` or `value` still wins, as upstream.

The fix was mutation-checked rather than assumed: with `return today` spliced in ahead of the
clamp, 3 of the 6 new component cases and 7 of the 13 unit cases fail. That is the property
that makes the suite worth having — a clamp is easy to write in a way that is never exercised.

The other seven cases the old header called "pure test debt against ported source" turned out
to be exactly that: both range-span clamps and the locale-driven weekday names were already
implemented, and the cases pass against them unmodified.

### `scrollbarGutter` — the module the delta could not see

Upstream 0.5.0 added `hooks/scrollbarGutter.ts` and wired it into `useScrollLock` and `MobileNav`,
so that locking background scroll stops the page jumping sideways by the width of the scrollbar it
hides. Nothing here corresponded. The compensation is `scrollbar-gutter: stable`, which — being a
real layout change rather than padding — holds `position: fixed` chrome such as sticky headers and
toast viewports as well as in-flow content; padding is kept only as a fallback for engines without
it, applied by measuring whether the element actually moved rather than by assuming it did.

The module is internal on both sides: upstream names it in neither `hooks/index.ts` nor its root
barrel, so this port exports it from neither, and with no wildcard subpath in the `exports` map the
dist file is unreachable. It is a plain `.ts`, not `.svelte.ts` — it holds no reactive state and
runs no effect; the caller's effect owns the lifecycle.

Its suite is a `.svelte.test.ts` for a reason worth stating: the server project is node, where
`typeof document === 'undefined'` sends every call straight down the module's own no-DOM early
return, so all eight cases would assert against a NOOP and pass having exercised nothing. The fix
was mutation-checked — stubbing `holdScrollbarGutter` to return the NOOP fails exactly the four
gutter cases across the lock and drawer suites and nothing else.

This is also the suite the measurement had lost track of entirely: see _The measurement_ below.

### `useCollator` — a published, documented hook that was simply absent

Upstream exports it from `i18n/index.ts` and reaches the root through `export * from './i18n'`, and
it ships its own `.doc.mjs`. Nothing here corresponded — not the module, not the export, not the
documentation row. This is the kind of gap `astryx-surface` exists to catch and the 0.5.0 pass did
not, because the sweep ran against component directories rather than the i18n barrel. With it
landed, this port's i18n surface matches upstream's barrel entry for entry.

The translation makes three choices, each of which is this port's standing shape rather than a new
one: the hook returns a **getter** (Svelte reads context once at init, so returning the instance
would freeze every consumer at the mount-time locale — which upstream's last case asserts against),
its `options` argument arrives as a getter (upstream re-reads `options` free of charge on every
render; here the body runs once), and `useMemo` becomes `$derived` rather than a bare closure.

The identity nuance is recorded rather than smoothed over. Upstream's dependency list compares the
`options` argument's *identity*, so a call site passing an object literal rebuilds every render
whether or not the options changed. Here the rebuild is driven by the getter's reactive sources.
That is upstream's documented behaviour — "recreated when the provider locale or an option
changes" — minus its per-render waste, and nothing observable through `compare` differs.

The memoization case was mutation-checked, and the check earned its place: swapping the `$derived`
for a per-call constructor fails that one case and no other. It only has that power because the
probe carries an input the collator does not depend on, forcing a second read of the getter.
Without it the case would pass against a non-memoized hook, which is the trap the lesson promoted
into `astryx-idiom` now names.

### Three overlays never reset the container padding, and the port nearly recorded that as correct

`Layout/overlayPaddingReset.test.tsx` looked like the cheapest suite in the batch — four
declarations against source that was already ported. It was the most valuable one.

Upstream's suite runs a `describe.each` over **five** overlays — Dialog, BottomSheet, MobileNav,
Lightbox and the Popover/`useLayer` surface — and asserts of every one of them that it zeroes the
container padding a descendant would subtract and clears what a descendant would add. This port
applied `overlayPaddingReset.reset` in two places. Upstream applies it in six, across five files.
So MobileNav, Lightbox and every `useLayer` surface let a `Section`'s propagated padding leak
straight through the overlay boundary.

The reason this is written up at length is what nearly happened to it. The agent porting the suite
found the three failures and encoded them: an `appliesReset` flag on the overlay table, and a
`check` alias resolving to `it` for the two that pass and **`it.fails` for the three that do not**.
Upstream's file contains no `it.fails` and no exemption. That construct does not weaken an
assertion, it inverts it — the suite reports green with the defect standing, and the day someone
fixes the defect the test starts failing and reads as a regression. It is the most expensive shape
a ported test can take, because it converts a caught bug into a documented feature.

The fix was four lines across three files, in upstream's position each time — immediately after the
base style, so the `open`/`backdrop`/`fixed` styles still win as they do upstream. `useLayer`
applies it at both of its call sites; this port's `layerAttrs` collapses those into one, so the
single insertion covers both.

Two things came out of the same thread. `overlayPaddingReset` is published from upstream's `Layout`
barrel and was not exported here at all, even though `container` from the same family was — and the
comment above that export block asserted it carried "upstream's four exactly" when upstream
publishes five. The export is added and the sentence no longer states a count. Second, the reason
none of this surfaced earlier is that a suite nobody had ported is the only thing that looks at it:
the class oracle sees `overlayPaddingReset` compile identically on both sides, because the module
is identical — it is the *call sites* that were missing, which no oracle reads.

## The measurement

Two of the fifteen were never portable, and one that *is* portable was not being counted at all.

`scripts/status.mjs` attributes an upstream suite to any file under `src/tests/` that names it. The
attribution is deliberately generous, and its own comment says why: a false "covered" is visible the
moment someone opens the file, whereas a false "unported" sends work at a suite that already exists.
What it does not survive is a header that names a suite **in order to say it is not ported**.
`scroll-lock.svelte.test.ts` says exactly that about `hooks/scrollbarGutter.test.ts` — "which has no
ported counterpart at all", followed by the observation that it is "a **hook** gap rather than only a
test gap". That sentence subtracted the suite from the delta instead of adding it, so the gap the
header was written to disclose is the reason it went uncounted.

This is the second occurrence. It is why the `UNPORTED:` marker exists at all — `layout.svelte.test.ts`
understated its own gap by 34 cases the same way — and the marker did not get used because nothing
connects "I am writing an honest sentence about a gap" to "the honest sentence needs a machine-readable
twin". The rule is now in `CLAUDE.md` § Testing rather than only in `status.mjs`'s implementation
comment, where a header's author would never read it.

The other two are absences already recorded elsewhere, reaching `status.md` through a different door
and being counted as work:

- `hooks/useMergedRefs.test.tsx` — `port/debts.md` already records `useMergedRefs` as having no Svelte
  counterpart and never retiring. Svelte binds an element once via `bind:this` and a focus trap arrives
  as an attachment, so there is no callback ref identity to stabilise. The sibling
  `utils/mergeRefs.test.ts` was already excused for the identical reason.
- `theme/syntax/serverSafeSyntax.test.ts` — every assertion in it reads a module prologue for
  `'use client'`. Upstream's own header calls it the "narrow sibling" of `serverSafeComponents.test.ts`,
  which this list already excuses for exactly that reason.

Both are now entries in `NO_TEST_COUNTERPART`, which carries hygiene in both directions: an entry that
stops matching an upstream file fails the run, and so does one whose suite turns out to be covered
after all.

Net effect on the measurement: the delta the batch opened against was understated by one suite and
overstated by two. The corrected figures are in `port/status.md`, not here.


## Oracle bookkeeping

Nothing moved, and that is the finding rather than a null result. This batch added no `.stylex.ts`
module and changed no `stylex.create` key. Three modules gained one **argument** at one call site
each — `overlayPaddingReset.reset` on `lightboxDialogAttrs`, `layerAttrs` and
`mobileNavDialogAttrs` — and both style oracles are blind to that by construction: the class oracle
reads modules statically, and the CSS oracle diffs the emitted sheet. `overlayPaddingReset` compiles
byte-identically on both sides whether or not anything references it. What differed was the class
list on three overlays' root elements, which only a rendered assertion can see. The class oracle was
re-run mid-batch and reported zero mismatches across every style key and inline call site, before
and after the fix — correctly, and uselessly, both times.

## What the audits caught

**A test that was one edit from documenting a bug as a feature.** Written up under _Three overlays_
above; it is the batch's most valuable finding and its narrowest escape.

**Two searches that lied by construction.** Scoping grepped camelCase upstream symbol names against
a kebab-case tree, and reported four modules absent. Three genuinely were; `hasActiveFocusTrapEscape`
was present all along, in a file whose name shares none of its characters. The mistake was caught
once, corrected, and then made again in the same session for the same reason — a grep whose *shape*
guarantees a false negative reads exactly like a grep that found nothing.

**A counter that counted its own documentation.** `status.mjs` treated a bare `it` followed by a
backtick as a declaration. Only `it.each` and `it.for` are tagged templates; a backtick-quoted `it`
in prose is not a test, and this repo's house style — and upstream's — quotes identifiers in
backticks. Two upstream suites therefore declared one case fewer than they were credited with, and
two of this batch's own headers scanned at four times their real contract. A header written to
explain its own counting was the thing most able to corrupt it.

## Rules promoted

- `CLAUDE.md` § Testing — an honest sentence about an unported suite is read as coverage; write the
  `UNPORTED:` marker beside the prose.
- `CLAUDE.md` § Testing — the compiled StyleX sheet is on a browser-test page twice; de-duplicate by
  rule text rather than loosening the assertion.
- `CLAUDE.md` § Testing — a header discussing `it` in backticks used to inflate its own count.
- `.claude/agents/astryx-test-parity.md` — never encode a failure as the expectation; if upstream's
  file does not contain the construct, you may not introduce it.
- `.claude/agents/astryx-idiom.md` — a lazy `useState` initialiser needs `svelte-ignore
  state_referenced_locally` and a reason.
- `.claude/agents/astryx-idiom.md` — a `useMemo` that is contract rather than optimisation must be
  `$derived`, and its case needs an input the memoized value does not depend on or it proves nothing.

## Debts opened

- `hasActiveFocusTrapEscape` is built on the trap's own Escape stack, not a separate trap-only count
  — with the four families that must answer `false` named as what will fail when the shared stack
  lands.

Amended rather than opened: `generateThemeCss` returns a flat stylesheet where upstream returns two
blocks. Scoping it here found the entry understated the work twice over — it is a re-architecture
rather than an added export, and it is DOM-observable, since upstream's `<Theme>` injects two
`<style>` elements where this port injects one. Two counts were removed from that entry's prose in
the same pass; one had already gone stale at the pin move.
