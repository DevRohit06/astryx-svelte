---
seq: 041
title: Batch 41 — the case-level test delta, declared and measured
upstream: 0.5.2
date: 2026-09-01
units: [status.mjs, src/tests/*, form-and-metadata split]
upstream-prs: []
---

## Scope

Front 1's measurement, not its cases. Batch 040 left every upstream suite with a counterpart file
and moved what remains into the _cases_ — a shortfall that lived in 283 hand-written suite headers,
203 of which still name the **0.5.0** pin against a tree at 0.5.2. This batch replaces the guessed
attribution behind `status.md`'s test-parity table with a declared one, and renders the per-suite
case delta.

Closing the case gaps themselves is the next batch. This one lands the thing that measures them,
which is the order `port/todo.md` sequences the fronts in: the check before the work it checks.

## Pre-flight

- **The whole import list, not the directory.** `status.mjs`'s consumers are `scripts/verify.mjs`
  (the `status` stage plus the `git diff --exit-code port/status.md` drift gate that follows it) and
  CI's `--no-client` run, which gates on the same file. Output must stay byte-identical between the
  fast and `--full` tiers.
- **A shared mechanism is costed by who adopts it** (batch 035). A marker in `status.mjs` is worth
  nothing until the test files carry it: the adoption set is all 283 files under
  `packages/core/src/tests/`, derived from the tool rather than from a hand list.
- Not a front outside `packages/core`; no component, no `.stylex.ts`, no oracle wiring, so the
  published-dist, responsive/SSR and hook pre-flight items do not apply.
- `port/debts.md` has one entry directly in scope — _The 0.4.2 test delta — mostly closed; 26
  SideNav and 12 Slider cases remain_ — which the delta table must not contradict. It does not: the
  table counts SideNav 70 short at this pin, of which those 26 are the recorded part.

## The marker

Every file under `src/tests/` opens with a machine-readable head, the same shape `port/debts.md`
entries carry:

```ts
/** PORTS: SideNav/SideNav.test.tsx */
```

repeated per suite for the handful of files that fold a family, or `NO-UPSTREAM:` where there is
nothing upstream to port. `status.mjs` reads nothing else. A file with neither marker fails the run,
and so does one naming a suite the current pin does not have — which is the property the old scheme
could not have: a version bump that renames or deletes a suite now fails the gate instead of quietly
leaving a file attributed to nothing.

283 files adopted it in the same change. 217 were derivable — filename and header already agreed on
exactly one upstream suite — and **66 were not**, and those are where the value is. They were decided
by reading each header, not by the tool that proposed them.

## Attribution was wrong in both directions, not just imprecise

The old rule granted coverage to any file that named an upstream suite anywhere in its text, or that
shared its kebab-cased basename. It was chosen deliberately, on the grounds that a false "covered" is
visible the moment someone opens the file. It was not:

| suite                                | cases | read as covered because                                               |
| ------------------------------------ | ----- | --------------------------------------------------------------------- |
| `Resizable/useResizable.test.ts`     | 29    | `resizable.svelte.test.ts` (which ports `ResizeHandle`) shares a stem |
| `Heading/Heading.test.tsx`           | 24    | `text.svelte.test.ts` names it to say it is **not** ported            |
| `BottomSheet/BottomSheetEdgeTint`    | 10    | `bottom-sheet-panel.svelte.test.ts` names it to disclose the gap      |
| `theme/MediaTheme.dom.test.tsx`      | 8     | `auto-media-mode.test.ts` says "is not ported yet"                    |
| `MetadataList/MetadataList.test.tsx` | 20    | an SSR-only companion file shares its stem — but it **is** ported     |

Three of those five are the `UNPORTED:` failure mode recurring for the third and fourth time, in a
repo that had already promoted a rule and a marker against it. The marker worked; it just had to be
remembered, and it was not. A declaration cannot be forgotten, because nothing else grants coverage
— so `UNPORTED:` is retired rather than re-taught, and the one file carrying it keeps the prose and
loses the marker.

The last row is the other direction, and it is why the 66 were read rather than inferred: a
mechanical "the stem collides, so it is false coverage" pass would have declared `MetadataList`
unported when `form-and-metadata.svelte.test.ts` ports it in full.

## The delta, and why it is per group

`status.md` gains a **Case delta** section: upstream's cases in the ported suites, ours, the
shortfall, and a table of every suite short of the one it ports.

The rule is one file to one suite, and the overwhelming majority obey it — but a fold (five `Chat`
message suites over one fixture) and a split (`FormLayout` across two files) both exist, and summing
either side alone double-counts. The `PORTS:` edges are a bipartite graph; the shortfall is computed
per **connected component**. A group's row names every suite in it.

The opposite sign is reported as a magnitude rather than a worklist: a group carrying _more_ cases
than the suite it ports is usually benign, and is also the only shape a duplicated port makes.

## What the measurement found on its first run

**`FieldStatus` was ported twice.** `form-and-metadata.svelte.test.ts` carried a 30-case
`describe('FieldStatus')` whose seven blocks are the seven in `field-status.svelte.test.ts`, 28 of
them title-for-title. The two that differed were the same assertions under this port's own renaming
(`hands the root element to an attachment passed through rest props` is
`forwards an attachment to the root element`; `merges a consumer class` is
`merges a consumer className`), verified case by case before anything was deleted. Nothing was lost.

That file held three components' suites at once, which is what let the duplicate hide: no count in it
could be stated against any one upstream file, so neither copy's contract was checkable. It is gone.
Its `FormLayout` block joins `form-layout.svelte.test.ts`, which had been carrying a header
explaining that its own suite was split across two files; its `MetadataList` and `MetadataListItem`
blocks become `metadata-list.svelte.test.ts`, beside the SSR-only `metadata-list.test.ts` that has no
upstream counterpart. Both moves are verbatim.

The over-count fell from +24 across 5 groups to +4 across 4, each of the four a single case a suite
adds to upstream's — which is what that row is supposed to look like.

## The numbers, and the prose they replace

`port/todo.md` said "roughly 400 new cases sit in suites that exist here and fall short". The
measured figure is in `status.md` and is more than twice that. The prose was not careless — it was
derived from the release's own test diff, which counts what upstream _added_ at 0.5.1 and 0.5.2 and
therefore cannot see a suite this port was already short of at 0.5.0.

Two entries in `NO_TEST_COUNTERPART` are new, both performance suites with no subject here
(`Table/Table.perf.test.tsx`, `Markdown/parser.perf.test.ts`). Both were being counted as covered by
the file that names them in order to say they are not ported — the same failure as the table above,
reached from the "deliberately not ported" side. Recorded, with the reason, rather than left to that
accident.

## What is deliberately not in this batch

**The headers that state a case count against `0.5.0`** — 203 files name that pin, and 132 of them
carry a number beside it. They are false and, since this batch,
also redundant: nothing reads them, and `status.md` derives the same numbers on every run. They are
not stripped mechanically because the sentences around them name which cases were dropped and why,
and that is the part worth keeping — a regex through 223 headers would take the reasons with the
arithmetic. It is the next batch's first unit and is written into `port/todo.md` as one, not left to
be noticed.

## The gate ran three times, and the third change came from the second run

Run 1 failed one stage: `status drift`, because the regenerated `port/status.md` was not yet
committed. That is the gate working — its own message says so.

Run 2, against the committed tree, passed `status drift` and failed **`test`** — and not for
anything this batch changed. Chunks 1, 2 and 4 never printed a header, chunk 3 printed
`Forced re-optimization of dependencies`, chunks 5–18 all passed, and the stage was killed at its
30-minute timeout. That is the cold-cache contention `CLAUDE.md` already described, verbatim, down
to "three of the first four": `pnpm -r build` empties the Vite optimizer cache, so **every**
`pnpm verify` run starts the client suite cold, and four chunks launching at once all try to
re-optimize the same directory.

The documented remedy was an instruction — warm the cache by hand before gating after a build —
which is the one thing that cannot survive being forgotten, and this run forgot it. So the remedy
moved into `run-client-tests.mjs`: the **first chunk runs alone**, and the pool starts after it. It
costs one chunk's parallelism in the good case and removes a 30-minute timeout in the bad one.
Serial mode already had the property; a single-chunk run has nothing to race.

It is the same shape as this batch's main change, arrived at from the other end: a rule that has to
be remembered is a rule that will be missed, and the fix is to make the thing that enforces it
structural.

## Oracle bookkeeping

Nothing. No `.stylex.ts` module, no component and no theme declaration changed, so neither class
oracle, the CSS oracle nor the eight theme oracles had a new subject — all ran in the gate and all
were already green. The mismatch count did not move because nothing this batch touched can move it,
which is the honest form of that sentence rather than "0 -> 0".

## What the audits caught

Nothing, because three of the four have no subject here and the fourth's job is what this batch
mechanised.

`astryx-parity`, `astryx-idiom` and `astryx-surface` audit props, styles, elements, exports and the
React→Svelte translation. This batch changed a build script, 283 test-file header comments, four
prose documents and one test file's location. Not a line under `src/lib` moved, so there is no drift
to find in either direction and no published symbol to sweep. Running them would have produced a
report about the state batch 040 left, not about this change.

`astryx-test-parity` is the one that applies, and its contract — a suite is as long as the one it
ports, or names its absences — is now derived on every `status.mjs` run rather than read off a
header. The one place it would have been pointed at is the `form-and-metadata` split, and that was
checked directly instead: every case title in the deleted `FieldStatus` block was diffed against
`field-status.svelte.test.ts` (28 identical, 2 the same assertions renamed), and the three affected
suites were run — 76 cases, all passing.

That is a claim, not an omission: **the next batch, which ports cases, needs this agent on every
suite it touches.**

## Rules promoted

- `CLAUDE.md` § Testing — every test file declares `PORTS:` or `NO-UPSTREAM:`; headers name dropped
  cases and their reasons but no longer state counts, because `status.md` derives them.
- `CLAUDE.md` § Testing — the `UNPORTED:` marker is retired, with the four suites that slipped past
  it recorded as the reason inference was replaced rather than patched again.
- `.claude/agents/astryx-test-parity.md` — write the marker; do not write a count into the header.
- `.claude/skills/track-upstream/SKILL.md` step 5b — read the case delta instead of re-deriving 283
  headers by hand; a new upstream suite still needs a decision (a file that ports it, or a
  `NO_TEST_COUNTERPART` entry).
- `CLAUDE.md` § Commands — the cold-cache warm-up is `run-client-tests.mjs`'s job now, not the
  reader's; the note says so, and says that driving vitest directly still has no such guard.
- `port/todo.md` front 1 — the header count strip folds into the batch that ports each suite's
  cases, rather than standing as a pass of its own. ~200 prose edits with no functional change, on
  files that are reopened anyway, and the numbers can no longer corrupt the metric while they wait.

## Debts opened

- None. The `FieldStatus` duplicate was fixed rather than recorded, and the header-count strip is a
  `todo.md` unit rather than a divergence from upstream.
