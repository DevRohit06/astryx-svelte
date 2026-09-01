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

All four ran. Three of them found something, and one found a defect that was shipping.

### `astryx-parity` — Toast never adopted `mode="auto"`

Upstream #5299 replaced Toast's *guessed* media side with a **measurement** of the painted surface:
`<MediaTheme mode="auto" fallback={fallbackMediaMode}>`. This port had taken the provider half —
`useAutoMediaMode` is ported with its 10 cases green, and `MediaTheme` accepts `mode="auto"` and
`fallback` — and left the consumer half behind, passing the fallback value as the mode. Toast is
upstream's **only** `mode="auto"` call site, so the hook was ported and nothing called it.

That is the `interactionOverlay` failure from batch 040, exactly: a relocated declaration whose
consumer never adopted it, invisible to the class oracle because no style key moved. It is also
invisible to the 55/55 suite — neither upstream's cases nor ours assert `data-astryx-media` on a
toast. Batch 042's own pre-flight checked three subjects and not this one.

The visible consequence is upstream's own `brandToastTheme` story: a cream `#FFF4D6` toast surface,
where measurement resolves `light` (dark text) and the guess resolves `dark` — light text on cream,
the ~1.25:1 case `useAutoMediaMode`'s header says it exists to prevent. `'off'` was unreachable here
too, so the toast always wrote `data-astryx-media` where upstream can omit it.

**Fixed.** `toast-surface.svelte` now passes `mode="auto" fallback={fallbackMediaMode}`, and
`toast.svelte`'s JSDoc — still the pre-#5299 sentence — was re-synced with upstream's.

Two smaller ones, both fixed: `UseToastGestureOptions` and `ToastGestureBindings` were `export`ed
where upstream keeps them module-private (nothing imported them), and the `Snippet`-body
announcement gap that `toastText`'s own comment had been asking to have recorded since it was
written is now an entry in `port/debts.md`.

### `astryx-idiom` — a warning that reached production, and a timer that outlived its component

`ontransitionend={isExiting ? handler : undefined}` is not a conditional *attachment*. Svelte
evaluates the ternary when the event fires, so it re-read a `{@const}` derived owned by the
`{#each}` branch that `handleExited` had just destroyed. The card's `opacity` and `transform`
transitions finish on the same frame as the wrapper's `grid-template-rows` and bubble to the
now-detached node — whose listener Svelte leaves attached — so it happened **twice per dismissal**.
React never sees those events at all: it delegates `transitionend` at the root container, which a
detached subtree cannot reach.

`derived_inert` is **not dev-gated**. Every consumer app was logging it twice for every toast a user
dismissed. The stale `true` was absorbed by luck rather than design.

The same asymmetry produced a second defect: removing a capturing element fires
`lostpointercapture` *at that element*, and a spread handler is never delegated, so a toast
unmounted mid-pen-drag read `options()` off a destroyed component and resumed a timer whose teardown
had already run — a `setTimeout` scheduled 3.8s past unmount, measured.

**Both fixed**, and the general rule promoted to `CLAUDE.md`.

### `astryx-test-parity` — 55/55 is real, and six assertions were weaker than they read

The verdict was that every upstream case has a counterpart on the same subject, no case is skipped
or loosened, and every string `name` carries `exact: true`. But six restatements were weaker than
the case they stood for, and two individual assertions could not fail at all. All six are fixed:

| what was weak | now |
| --- | --- |
| the file header still declared four blocks unported that the file contains | rewritten; three other stale claims in it went too |
| `expectSpansInlineAxisWithoutOverflowing` blind to `width: 100%` — the one declaration upstream names | asserts the declaration directly, as the same case already did for `100lvh`/`100dvh` |
| the `0fr` collapse target asserted nowhere (a collapse to `0.5fr` would pass) | asserts the exiting rule's declaration while it applies |
| reduced motion: `rulesMatching` flattens the `@media` away, so moving `0.01ms` into the default would pass | searches the reduced-motion block's own text |
| `scale(0.98)`/`transform-origin` scanned only the two root elements | scans the wrapper and every descendant, as upstream's file read covers |
| case 13 drove both transform variables, so the declaration's `var()` fallbacks were never exercised | reads the resting matrix first |

Two more it raised are addressed rather than fixed: the bare `vi.useFakeTimers()` that contradicted
the header's own rule now passes `toFake`, and the double-click exit case regained the `await tick()`
that makes its copied comment true. The one it flagged as ceremonial — the runtime half of the
`expectTypeOf` case — stays, because `expect.requireAssertions` requires *something*, and the
comment now says which half has the teeth.

### `astryx-surface` — the surface held, and the sweep measured a front

It confirmed what both batches claimed: zero files changed under `packages/core/src/lib`, in any
`package.json`, in `packages/themes` or in `packages/cli` across `190034b..HEAD`. And it checked the
tarball rather than trusting the rule — `npm pack --dry-run` emits 3096 files, none matching
`tests/`, `.test.`, `.spec.` or `fixtures/`, so the new fixtures cannot ship. Two independent
mechanisms hold them out, `svelte-package` reading only `src/lib` and `package.json`'s `files`
denylist. It also noticed that the lint rule protecting that invariant matches
`*.{test,spec}.{js,ts}` only, so a fixture `.svelte` misfiled under `src/lib` would pass both —
latent, since every fixture is placed correctly.

Then it did the thing `port/debts.md`'s "`./theme` barrel drift" entry explicitly asks for: measure
this front rather than trust a figure typed into the entry. Both surfaces were enumerated with the
TypeScript compiler API over all 119 of upstream's entry points, so a name published only on
`./Layer` is not mistaken for an over-export here.

None of it is batch 042's to fix — front 2 sequences the surface as one call at a minor, and mixing
breaking export changes into a test batch is exactly what that sequencing exists to prevent. The
worklist is written into `port/todo.md` under that front, and the four findings that are **not**
surface policy — a missing `Markdown` feature, an unimplemented `MultiSelector` prop our own docs
advertise, `Icon` rejecting namespaced names upstream accepts, and two missing augmentation seams
whose unions drifted with them — are written up separately, because each reads as a missing export
and is really a missing feature.

## Findings recorded rather than fixed

The `derived_inert` warning was first recorded here and then **fixed** — see the idiom audit above.
It is worth keeping the sequence: it was found by writing the first case that lets a transition
finish on its own, recorded as a lead because chasing it would have ballooned the batch, and closed
once an audit could be pointed at it. Porting cases that exercise real browser behaviour is what
produced it.

What stays recorded rather than fixed is the surface worklist, in `port/todo.md` under front 2 and
under its own heading for the four items that are missing features rather than missing exports.

## Rules promoted

- `CLAUDE.md` § Testing — a computed style read synchronously after mount is the `@starting-style`
  value; wait for the element's animations before asserting about a resting style.
- `CLAUDE.md` § Testing — when a jsdom-only assertion is restated, its **scope** has to be restated
  with it; a page-wide scan standing in for a one-file source read answers a different question.
- `CLAUDE.md` § Conventions — a handler that can destroy its own block must not read that block's
  state at event time. React delegates at the root container so an unmounted subtree's events are
  unreachable; Svelte attaches non-delegated **and spread** handlers to the node, which keeps them
  after detachment. This is the rule the shipped `derived_inert` warning came from.

## Debts opened

- **A Toast with a `Snippet` body is not announced through the singleton live regions.** Not opened
  by this batch's work — `toastText`'s own doc comment had been asking to be recorded since it was
  written, and `astryx-parity` found the comment. Upstream flattens a `ReactNode` body to text and
  announces it; a snippet is an opaque function with no children tree to walk and no way to read its
  text without rendering it, which would run consumer code twice and move the announcement off the
  dispatch path that makes it exactly-once.

Two component changes landed, and neither is a divergence: `mode="auto"` **closes** one against
upstream, and the two idiom fixes remove defects with no upstream counterpart.
