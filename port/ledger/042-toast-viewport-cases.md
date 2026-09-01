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
in it is blocked: `port/todo.md` singles it out as portable today, and the pre-flight below confirms
every subject exists here.

One upstream suite, `Toast/ToastViewport.test.tsx`. Six of its eleven blocks have no counterpart
here at all — swipe dismissal, native motion contract, responsive layout, placement, live-region
fallback semantics, visible limit — and the five that do are short. Closing the whole gap is the
unit; the header's stated count goes with it, per the rule batch 041 promoted.

Not in scope: the other suites on that table. `DateInput/DateInputTouch` is the largest and needs
its own batch.

## Pre-flight

- **Treat an unported block as a possible missing implementation until checked** (batch 033). All
  six absent blocks have their subject here: `use-toast-gesture.ts` is ported **and consumed** —
  `toast-surface.svelte:171` calls it, which is the check batch 040's "a green oracle is not a
  finished migration" rule exists to force — and `toast-viewport.svelte` declares both `position`
  and `maxVisible` with upstream's defaults (`bottomEnd`, 5) and slices `toasts.slice(-maxVisible)`
  exactly as upstream does. So this batch ports cases, and adds no component code.
- **Name the consumers.** Tests only; nothing under `src/lib` is expected to change, so the docs
  generator, the barrel and the oracles have no stake in it. If that stops being true mid-batch it
  is a finding, not a detail.
- **The debts in scope** are `port/debts.md`'s five Toast entries — the `string | Snippet` body, the
  microtask-later mode resolution, the `untrack`ed viewport mutators, the replicated upstream quirks
  and the untested Snippet-lifetime edge. A case that fails against one of those is a recorded
  divergence, not a bug to fix.
- No `.stylex.ts`, no new component directory, no published-surface change: the dist-lag,
  responsive/SSR and hook pre-flight items do not apply.

## Units

<!-- filled as the work lands -->

## Oracle bookkeeping

<!-- filled at close -->

## What the audits caught

<!-- filled at close -->

## Rules promoted

<!-- filled at close -->

## Debts opened

<!-- filled at close -->
