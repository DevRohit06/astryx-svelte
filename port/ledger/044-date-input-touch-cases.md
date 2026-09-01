---
seq: 044
title: Batch 44 — the DateInput touch surface, case for case
upstream: 0.5.2
date: 2026-09-02
units: [DateInputTouch.test.tsx]
upstream-prs: []
---

## Scope

Front 1's largest single gap: `DateInput/DateInputTouch.test.tsx`, 101 cases short at the batch's
start and the biggest row in the delta table. No component is written or changed — every
`date-input/` module was already ported — so this is test work end to end.

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

## The finding

**Five cases cannot be made to pass, and the reason is not the harness.** Full detail is in
`port/debts.md`; the short form is that the calendar opens three months early — exactly `OVERSCAN`
— and a wheel commits a row it is only passing, with the year wheel observed sitting on row 1 of
2024–2028 while selecting row 1, having been parked on row 2 a moment earlier.

Every piece of code involved is character-for-character upstream's: the initial
`scrollOffsetForRow(initial - min, size, rtl)` and its `hasPositioned` latch, `Wheel`'s
`Math.round(scrollTop / size)` commit and disabled-row bounce, `MonthYearWheels`'
`toMonthIndex(parts.year, nextMonth)`, and `handleVisibleMonthChange`'s `isWheelOpen` guard. The
suspected cause is one thing seen twice: both the scroller and the wheels position themselves from
layout the `BottomSheet` entry animation has not finished producing, and both latch it.

It was nearly dismissed twice, which is the part worth keeping. All five pass alone and pass with
their own block alone; only a full-file run reproduces them, which is the same shape as a starved
chunk. It is not that shape underneath: the assertions are stable and repeatable at the _wrong_
value rather than flaky between values, the header is not still moving when it is read, and the
document holds exactly one dialog, one scroller and one title at the moment of failure — so the two
cheap explanations, a race and a stale render, are both ruled out by measurement rather than by
argument.

Upstream cannot see any of it. jsdom neither lays out nor scrolls, so its scroller never travels,
its wheels never re-settle, and its pane size is a constant `withLayout` supplies. These five are
the cases written to catch this class of thing, so a port of them that passed by not scrolling would
be worth nothing — which is why they are left unported with the evidence rather than adjusted until
green.

## Oracle bookkeeping

None. No `.stylex.ts` module changed and no oracle skip moved.

## What the audits caught

Nothing was run. `astryx-parity`, `astryx-idiom` and `astryx-surface` take a component as their
subject and no component changed; the published surface is byte-identical to 043's.
`astryx-test-parity` is the agent whose job this batch is, and the work was done directly.

## Rules promoted

- `CLAUDE.md` § Commands — the `test:client` block already carries the rule this batch leaned on
  hardest (a symptom that only appears in a full run is contention until measured otherwise). What
  this batch adds is the counter-example, recorded in `port/debts.md`: five cases with exactly that
  signature that are **not** contention. The distinguishing test is whether the wrong value is
  stable and repeatable, and it is cheap.
- `scripts/status.mjs` — `NAME_EXACT` now accepts the hoisted `...exact` form that `TEXT_EXACT`
  already did. Written at the regex, next to the comment that catalogues this exact miscount.

## Debts opened

- _`DateInput`'s touch surface positions itself from a measurement the sheet has not settled_
- _`DateInputTouch.test.tsx` repeats five cases verbatim_
