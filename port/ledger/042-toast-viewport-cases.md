---
seq: 042
title: Batch 42 — close ToastViewport's case gap
upstream: 0.5.2
date: 2026-09-01
units: [ToastViewport]
upstream-prs: []
---

## Scope

The first suite off batch 041's case-delta table, chosen over the three larger gaps because nothing
in it was blocked: `port/todo.md` singled it out as portable today, and the pre-flight below
confirmed every subject already exists here.

One upstream suite, `Toast/ToastViewport.test.tsx`, from 14 of its 55 cases to **all 55**. Six of
its eleven blocks had no counterpart at all; five more were short.

Not in scope: the other suites on that table. `DateInput/DateInputTouch` is the largest and needs
its own batch.

## Pre-flight

- **Treat an unported block as a possible missing implementation until checked** (batch 033). All
  six absent blocks had their subject here: `use-toast-gesture.ts` is ported **and consumed** —
  `toast-surface.svelte:171` calls it, which is the check batch 040's "a green oracle is not a
  finished migration" rule exists to force — and `toast-viewport.svelte` declares `position`,
  `maxVisible` and `inset` with upstream's defaults. So this batch ported cases and added no
  component code, which held: nothing under `src/lib` changed.
- **The debts in scope** are `port/debts.md`'s five Toast entries. None was contradicted; two are
  load-bearing in the port (`body`/`endContent` as `string | Snippet` shapes three fixtures).
- No `.stylex.ts`, no new component directory, no published-surface change.

## Units

| block                                  | cases | the shape of the work                        |
| -------------------------------------- | ----- | -------------------------------------------- |
| `Toast swipe dismissal`                | 16    | real `PointerEvent`/`Touch` dispatch         |
| `renderContent`                        | 9     | four custom layouts into a fixture           |
| live-region fallback + nested landmark | 3     | direct `Toast` render; one fixture           |
| placement, wide stacks, visible limit  | 4     | first computed-style restatement             |
| `Toast native motion contract`         | 5     | token resolution and transition timing       |
| `Toast responsive layout`              | 4     | densest token resolution; one type-only case |

Six fixtures were added, every one of them because the thing upstream writes inline in a case is a
**snippet** or **component content** here and cannot be written in a `.test.ts`: a custom layout, an
`endContent`, a viewport nested in a viewport, two sibling viewports, a long-bodied toast.

## The environment gap this block is really about

jsdom returns a computed style as the _declaration_; Chromium resolves it. Upstream's later blocks
lean on that hard — `getComputedStyle(el).height` reads back
`'calc(var(--text-body-size) * var(--text-body-leading))'` there and a used pixel length here — so
transcribing them is not an option and neither is transcribing the pixels, which would pin the
**token's** value and fail this suite on a theme change.

`resolves(host, property, expression)` is the general answer: a probe element inheriting from the
same host, carrying the same declaration, read back. The assertion becomes "computes to whatever
`var(--duration-fast)` computes to here" — upstream's assertion evaluated rather than restated.
Three assertions could not be resolved that way and are restated individually, each at its site:
a `transform` read as a matrix and checked by _driving_ its custom properties; upstream's three
`readFileSync` guards against `Toast.tsx` turned into scans of the compiled rules; and
`expectTypeOf`, which compiles to nothing and therefore fails `expect.requireAssertions`.

## A wrong diagnosis, and what it cost to find out

Two stacked toasts read `padding-bottom: 0` where upstream asserts an 8px gap. Our compiled CSS is
**byte-identical to upstream's** for both classes involved —
`.x1wesfrj{padding-bottom:var(--spacing-2)}` and `.xup0pd7:last-child{padding-bottom:0}` — so the
conclusion on offer was that upstream ships a dead `:last-child` rule and a gap that never renders,
and that this port replicates the bug faithfully. That would have been a `debts.md` entry asserting
a defect in someone else's library.

It is wrong. `@starting-style` supplies the toast's entry state — `grid-template-rows: 0fr`,
`padding-block-end: 0`, and a `--_toast-slide-y` offset on the card — and a synchronous read after
mount returns _that_, not the resting style. The same explanation covers the card's
`matrix(1, 0, 0, 1, 0, 8)`, which the swipe-block commit message called the exit throw and which is
actually the entry slide.

The lesson generalises past Toast: **a computed style read synchronously after mount is the
`@starting-style` value, not the resting one**, and jsdom has no such concept so no ported case
carries a wait. `settleEntry` awaits the element's animations, and every case that reads a
transitioned property waits first — otherwise it asserts about the entry animation while claiming
to assert about the resting style. Promoted to `CLAUDE.md`.

Two smaller versions of the same trap: `transform` is itself in `transition-property`, so _driving_
a custom property starts a transition and a synchronous read still returns the old matrix; and the
wrapper is gone by the time its collapse transition finishes, because the real `transitionend`
fires and the viewport unmounts on it — which is why `collapses a dismissed Toast before unmounting
it` asserts the collapse is _running_ and then that the element is gone, rather than reading back
two declarations.

## Scope is the other half of a restatement

`someRuleContains('scale(0.98)')` failed on its first run, correctly: another component in this
repo uses `scale(0.98)`, and upstream's assertion names one source file. A page-wide scan answers a
different question from the one the case asks. `rulesMatching(element)` narrows it to the rules
that actually apply to the toast — the restatement is only faithful once its **scope** matches
upstream's too, not just its subject.

## Oracle bookkeeping

Nothing. No `.stylex.ts`, component or theme declaration changed, so no oracle had a new subject.
The class oracle was consulted as _evidence_ during the padding investigation — it is what
established that our two gap classes are byte-identical to upstream's, which is what made the
`@starting-style` explanation the only one left.

## What the audits caught

Not run, and this is a claim rather than an omission. `astryx-parity`, `astryx-idiom` and
`astryx-surface` audit props, styles, elements, exports and the React→Svelte translation; nothing
under `src/lib` changed in this batch, so none has a subject. `astryx-test-parity` is the one that
applies and its contract — a suite as long as the one it ports, or naming its absences — is now
derived by `status.mjs` on every run: `Toast/ToastViewport.test.tsx` is off the short list, which is
the finding it would have reported.

## Findings recorded rather than fixed

- **`derived_inert` on a Toast's natural exit.** Svelte logs _"Reading a derived belonging to a
  now-destroyed effect"_ twice when a toast unmounts at the end of its real collapse transition.
  Recorded in `port/todo.md` with its reproduction. It is the idiom axis rather than the parity one,
  and it surfaced only because this batch wrote the first case that lets the transition finish
  instead of synthesising `transitionend` — which is itself the argument for porting the cases that
  exercise real browser behaviour.

## Rules promoted

- `CLAUDE.md` § Testing — a computed style read synchronously after mount is the `@starting-style`
  value; wait for the element's animations before asserting about a resting style.
- `CLAUDE.md` § Testing — when a jsdom-only assertion is restated, its **scope** has to be restated
  with it; a page-wide scan standing in for a one-file source read answers a different question.

## Debts opened

- None. Every divergence in this batch is a restated assertion, explained at its site, and no
  component behaviour changed.
