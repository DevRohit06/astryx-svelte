---
seq: 039
title: Batch 39 — the docs-examples count, measured instead of described
upstream: 0.5.0
date: 2026-08-26
units: [scripts/status.mjs, docs/scripts/generate-content.mjs]
upstream-prs: []
---

## Scope

One row in `port/status.md`: how many of upstream's CLI block templates have a Svelte
transcription under `docs/src/lib/examples/`, and how many do not. Nothing under `packages/core`
changed.

Batch 038 found the gap while porting the `Stepper` and `Step` blocks.
`docs/scripts/generate-content.mjs` had always computed the pair as it ran — it prints
`examples N ported / M pending` — and then thrown it away. `status.md` had no row for it, so the
docs-examples front was the one place this port measured progress in **prose**, against
`port/todo.md`'s own rule and in the file whose entire purpose is that a count cannot rot.

## The rule for which blocks count is not derivable from committed source

This is the finding, and it nearly produced a wrong number.

The obvious implementation recomputes the tally inside `status.mjs`, which reads only the committed
tree and is fast and dependency-free — properties worth protecting. Walk the pinned CLI's blocks,
read `exampleFor`/`alsoExampleFor` from each `.doc.mjs`, and check for
`docs/src/lib/examples/<Target>/<Block>.svelte`.

That walk gives **13** blocks with no transcription. The generator reports **9**. The difference is
one line in `buildExampleRegistry`:

```js
if (!portedNames.has(target)) continue;
```

`portedNames` is the set of *documented entries*, and a block aimed at something this port does not
document is not a gap in the examples — it is a gap somewhere else. Four pairs are filtered:
`ChatDictation` (three blocks) and `Resizable` (one).

The trap is in reconstructing that set. The natural proxy is the barrel, `packages/core/src/lib/index.ts`
— committed, cheap, no build required. It is **wrong**, and grepping it says `useMediaQuery` is
absent. `useMediaQuery` is a hook: it has a `.doc.mjs`, it is one of the documented entries, and its
`DialogAdaptivePresentation` pair is genuinely pending. A barrel-derived filter drops it and reports
**8**.

So the three candidate answers were 13, 8 and 9, and only the third is right. Two of them are
reached by implementations that look obviously correct. The counts were settled against the
generator's own output rather than argued from the code.

The conclusion is the promoted rule: when `status.mjs` needs a number another script already
computes, **call that script's function**. `exampleCounts()` now lives beside
`buildExampleRegistry` in `generate-content.mjs`, where the filter it depends on is, and
`status.mjs` calls it.

## The cost, stated rather than hidden

This is the first input to `status.mjs` that is not the committed tree. The generator reads core's
built `dist/`, so a bare `node scripts/status.mjs` on a clean checkout can no longer derive the row.

It degrades rather than throws: the section renders the reason and names the fix. It deliberately
does **not** render a zero, which would read as "nothing pending" — the one wrong answer available.

A degraded run still writes a different file and so fails the drift gate. That is the same bargain
the Surface section already makes with the upstream clone, and the reason CI clones it; `pnpm verify`
and CI's `lib` job both build before this stage, so both derive it. Recorded here because a
degradation that is discovered rather than documented reads as a bug.

## What was checked

- **Mutation.** Deleting one example moved the row `645 / 9` to `644 / 10`; restoring it returned
  the original pair. A count that never moves is the failure mode this whole file exists to catch,
  and batch 038's own lesson was to mutation-check a checker rather than trust a clean run.
- **Against ground truth.** The row matches `pnpm -F docs generate`'s printed figures exactly.
- **The degraded branch**, by moving `dist` aside and running: exit 0, reason rendered, no zero.
- **Tier identity.** `status.md` must be byte-identical whether generated fast or `--full`; both
  tiers were generated and diffed, since this change adds content to that file.
- **Control characters**, per batch 037 — none below the newline/tab floor.

## Not done, and why

`generate-content.mjs` discards a second figure the same way: `templates N ported / M pending`. It
is the identical defect on the identical front and the fix is the same shape, but this batch was
scoped to the examples row and widening it silently is how a scope stops meaning anything. It is
named in `port/todo.md` instead.

## Oracle bookkeeping

None. No `.stylex.ts` module changed.

## What the audits caught

No audit agents were run. This batch touches two scripts and no component, props interface, export
or test; all four agents read `packages/core`. The check that matters here is the mutation test
above, which no agent performs.

## Rules promoted

- `CLAUDE.md` § the metric rule — a count another script already computes is untracked until
  `status.mjs` renders it, and `status.mjs` must call that script rather than recompute its rule.

## Debts opened

`-` — none.
