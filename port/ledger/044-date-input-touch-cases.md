---
seq: 044
title: Batch 44 — the DateInput touch surface, case for case
upstream: 0.5.2
date: 2026-09-02
units: [DateInputTouch.test.tsx, MonthScroller]
upstream-prs: []
---

## Scope

Front 1's largest single gap: `DateInput/DateInputTouch.test.tsx`, 101 cases short at the batch's
start and the biggest row in the delta table. It was scoped as test work end to end — every
`date-input/` module was already ported — and it did not stay that way: the cases found a defect in
`MonthScroller`, so one component changed after all. That is the batch working as intended rather
than scope creep.

Upstream's suite is 136 cases across nine `describe` blocks. Thirty-five already lived in
`date-input-touch.test.ts` (server project): the pure month arithmetic and the definition-level
scroll CSS, which upstream itself separates for reasons that survive the port. The other hundred
need a rendered tree, and they land in a new client companion declaring the same `PORTS:` suite.

## The harness

`date-time-input-touch.svelte.test.ts` had settled nearly every question this file asks, and the
answers are reused rather than re-derived: `stubMedia` kept verbatim and kept honest about width;
`MockResizeObserver`, `withLayout`, `Element.prototype.scrollTo` and the three `HTMLDialogElement`
shims all dropped because Chromium implements what each of them fakes; `withLayout`'s counterpart
is `settleMonthPanes()`, waiting for the panes a real observer mounts; only `Date` faked, so
Svelte's `queueMicrotask` scheduling and Playwright's actionability polling both keep working.

Three counterparts rather than translations, each noted at its case. Upstream's ref-forwarding case
has no `ref` prop to forward, so it asserts the rendered element's identity. `getByLabelText` has no
vitest-browser equivalent, so the name is resolved by role and the absence of `aria-label` asserted
beside it. `not.toBeDisabled()` becomes the native attribute, because Playwright's ARIA computation
counts `aria-disabled` as disabled and the case is about exactly that attribute.

Two upstream shims are kept **for the opposite reason they exist upstream**. The
`scrollLeft`/`scrollBy` shadows in the gesture block are needed here because a real scroller _would_
move, and `scrollsBy` has to be the only thing that moves it if "the compositor panned" is to be
distinguishable from "it did not". And the ancestor-walk in `leaves no inert ancestor over whichever
action is showing` stays even though Chromium implements `inert` for real, because the walk _is_ the
assertion rather than a stand-in for one.

## What a real browser changed

**`scroll-snap-type: none`, added deliberately.** The rest-position block tests a correction for an
iOS snap failure. Upstream tests it in jsdom precisely because jsdom implements no snapping: the
scroller can be put at a bad offset and left there. Chromium will not leave it there — it re-snaps,
which is upstream's own stated reason the bug never appears on Chrome — so the settle's second read
sees a moved offset, the "still travelling" guard returns, and the correction never runs. Ported
verbatim, three cases failed with `scrollTo` never called and **three passed vacuously**: every
negative in that block asserts `scrollTo` was _not_ called, which a scroller that never reaches the
correction satisfies for the wrong reason. Turning snapping off for the case reproduces the device
condition instead of removing it, and is what makes those three negatives assert anything at all.

**Waiting on the right thing, twice.** The calendar/wheels cross-fade means a panel is not visible
to a role query when the click returns, so `openWheels` waits for the arriving panel; and the
calendar's initial month is reached by a real scroll, so `openPicker` waits for the header to stop
changing across a frame. Two weaker waits were tried first and both are recorded at the site because
both look right: `aria-selected` is driven by the committed value rather than the scroll position,
so it reads correct throughout a travel that has not committed; and a fixed quiet-period sleep
passes in isolation and fails in a full run, which makes any wait measured in milliseconds a flake
with a threshold rather than a fix.

## The finding, and the fix

Five cases would not pass, and the reason was a real defect in this port — found by porting them to
a real browser, and invisible to upstream's own suite by construction.

**`MonthScroller` positioned itself before the DOM it measures against.** Upstream does it in a
`useLayoutEffect`, which runs _after_ React commits the DOM, so the spacer already carries the width
that same render gave it. This port used `$effect.pre`, which runs _before_ Svelte patches the DOM —
so the spacer still had its previous width, zero on the pass that matters, and the browser clamped
`scrollLeft` to 0. The scroller did not stay there: the panes mount an instant later at
`centerRow ± OVERSCAN`, and `scroll-snap-type: mandatory` pulls the scrollport to the nearest snap
area, which is the **first mounted pane**. The calendar opened exactly `OVERSCAN` months early —
three, whenever the window was not already clamped at row 0 — and looked deliberate rather than
broken.

It reached the wheels one step removed: they derive from `monthIndex`, so a scroller on the wrong
pane fed a wrong month back and a wheel commit read the wrong year. That is why
`the year wheel keeps the month` failed beside the two month cases, and why moving one effect closed
all five.

**Three wrong turns before it, all recorded in `port/debts.md`.** A race against the `BottomSheet`
entry animation; a stale render from an earlier case, ruled out by counting one dialog, one scroller
and one title at the moment of failure; and an off-by-overscan in the report path, ruled out by
reading `onVisibleMonthChange(min + row)` and finding it absolute. What settled it was lining the two
failures up and seeing the same constant — three rows, and three is the overscan. The number had
been in the failure text from the first run.

**The signature is the part worth carrying forward.** All five pass in isolation and pass with their
own `describe` block alone; only a full-file run reproduced them. This repo teaches that shape as
contention, and it was not — the wrong values were stable and repeatable rather than flaky between
values, which is the distinguishing test and is cheap to apply.

## Oracle bookkeeping

None. No `.stylex.ts` module changed and no oracle skip moved.

## What the audits caught

Nothing was run, and one of them should be. `astryx-idiom` owns exactly the axis this batch's fix
sits on — effect timing, and a context or effect that reads at the wrong moment — and it would have
had `MonthScroller`'s pre-effect in scope from the first day the component landed. The published
surface is unchanged, so `astryx-surface` and `astryx-parity` have nothing new to see;
`astryx-test-parity` is the agent whose job this batch is, and the work was done directly.

## Rules promoted

- `CLAUDE.md` § Commands — the `test:client` block already carries the rule this batch leaned on
  hardest (a symptom that only appears in a full run is contention until measured otherwise). What
  this batch adds is the counter-example, recorded in `port/debts.md`: five cases with exactly that
  signature that are **not** contention. The distinguishing test is whether the wrong value is
  stable and repeatable, and it is cheap.
- `CLAUDE.md` § Conventions — `useLayoutEffect` is ``, not `.pre`, whenever it writes
  to the DOM the same render creates. The defect this batch fixed, stated as the rule that would
  have prevented it.
- `scripts/status.mjs` — `NAME_EXACT` now accepts the hoisted `...exact` form that `TEXT_EXACT`
  already did. Written at the regex, next to the comment that catalogues this exact miscount.

## Debts opened

- _`MonthScroller` positioned itself before the DOM it measures against — fixed_
- _`DateInputTouch.test.tsx` repeats five cases verbatim_
