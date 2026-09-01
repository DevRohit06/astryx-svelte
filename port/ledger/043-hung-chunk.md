---
seq: 043
title: Batch 43 — the hung chunk, and the diagnosis it broke
upstream: 0.5.2
date: 2026-09-01
units: [run-client-tests.mjs, classify-chunk-failure.mjs]
upstream-prs: []
---

## Scope

No component, no `.stylex.ts`, no upstream case. This batch fixes the client runner and corrects
what batch 042 wrote about it, because 042's gate never went green and the reason recorded for that
was wrong.

Front 1's next suite — `DateInput`/`DateInputTouch` — is deliberately not in here. A batch that
opens with "the gate cannot be trusted" has exactly one unit of work in it.

## What was actually wrong

Batch 042 closed with a failing gate and a stated cause: isolating each chunk's Vite optimizer cache
had raised per-chunk memory, and an already-loaded box had run out. The evidence was a
`memory allocation of 34816 bytes failed`, a `0xC0000409` chunk crash, and 16 of 18 chunks — against
18/18 standalone on the same commit twenty minutes earlier.

That reading was wrong, and the machine still held the proof. Two **complete orphaned test trees**
were alive: `pnpm -r test` → `run-client-tests.mjs` → three vitest processes → three
`chrome-headless-shell.exe`, twice over. Eighteen processes and a gigabyte, idle, started 16 and 7
hours earlier — and **both predate the commit that isolated the caches**. The memory was already
gone before the change that got blamed for it, and six vitest processes were holding this project
while a seventh, eighth and ninth ran the gate against it. That is the collision CLAUDE.md has
warned about since batch 029, arriving from the one direction the warning does not cover: not two
runs someone started, but one run someone started and one nobody knew was still going.

The mechanism is a gap in the runner. `child.on('close')` is the only thing that ever resolved a
chunk, so a chunk whose browser died **without closing its vitest process** never resolved at all —
the pool slot was never returned and the run hung rather than failing. Nothing bounded it, and a
hang produces no output to notice, which is why two of them sat there for most of a day.

## The fix, in two parts

**A per-chunk timeout.** `CLIENT_CHUNK_TIMEOUT_MS`, 12 minutes by default — about 6× the slowest
observed chunk. On expiry the runner kills the chunk _and its descendants_: `child.kill()` was never
going to be enough, because the headless shell is Playwright's child rather than ours and a signal
to the parent does not walk the tree on Windows. `taskkill /T` there, a dedicated process group and
a group signal elsewhere. The same kill runs on `SIGINT`/`SIGTERM`, so an interrupted runner stops
orphaning what the timeout exists to prevent.

A timeout is classified as a drop and retried, which meant extending
`classify-chunk-failure.mjs` rather than deciding locally — the "a chunk that failed a _case_ is
never retried" rule lives in that module and had to keep governing. A hang arrives with **no error
text at all**, so it enters as a flag rather than another pattern, and the zero-failed-tests guard
still runs first. Hoisting the new branch above that guard is the mutation that turns the gate into
a re-roll; `chunk-failure-classifier.test.ts` grew the case that catches it, and it was mutation-
checked by swapping the two lines and confirming that case — and only that case — fails.

**A lock.** The timeout stops a run hanging; it does not stop the _next_ run colliding with a hang
already in progress. `node_modules/.client-run.lock` names the live run's pid, is keyed on
`process.kill(pid, 0)` liveness rather than on the file existing — so a hard kill leaves nothing to
clean up by hand — and refuses in one line at start-up instead of failing an hour later in a way
that reads like a broken suite. `CLIENT_CHUNK_NO_LOCK=1` overrides it. Both directions were checked
before the gate: a lock naming a live pid refuses and exits before spawning anything, and this
batch's own gate ran against a deliberately planted stale lock, which it reclaimed.

## What the gate then found

The first clean run — no orphans, no competing process — came back 17 of 18, and the eighteenth was
not a case. Chunk 3 reported `Failed to connect to the browser session … within the timeout`,
`Test Files (12)`, `Tests no tests`: twelve files collected, **zero executed**. A drop, by any
reading. It was not retried, because that string matches none of the five patterns
`classify-chunk-failure.mjs` knew, and so a green suite was reported as a failing one — the twelve
files pass in isolation, 285 cases, and the eighteen chunks sum to the same 5,499 the standalone run
produced.

The classifier is an **allowlist of signatures observed in real runs**, which is the right shape —
the alternative retries on anything and turns the gate into a re-roll — but it means a _new_
infrastructure signature fails a green run, and the reconciliation cannot help: reconciliation
catches a chunk that silently shrank the total, not one loudly misclassified. The pattern is added
with the sample verbatim, as the file's other cases are. Every future addition needs a real run
behind it.

## The gate

Green — all seven stages, on the commit that adds the missing drop signature. Eighteen chunks, no
drop, no wedge, no retry, and the lock reclaimed the stale entry planted for it and released on
exit, so both of its paths were exercised by the run rather than only by the check beforehand.

**What that does not establish.** Every measurement here is from one Windows machine, which is the
mistake 042's close made and the reason its conclusion survived as long as it did. `taskkill /T` is
the only kill path tested; the POSIX process-group branch has never run. The 12-minute bound is
sized against local chunk times, and a cold CI runner is slower. And the isolated cache's memory
cost is still unmeasured — this batch removed the evidence that it was ever a problem, which is not
the same as showing it is not one. CI is what arbitrates all three.

## Oracle bookkeeping

None. No `.stylex.ts` module changed, and no oracle skip moved.

## What the audits caught

Nothing was run, and the section is a claim rather than an omission: `astryx-parity`,
`astryx-idiom`, `astryx-oracle`, `astryx-test-parity` and `astryx-surface` all take a component or
an upstream suite as their subject, and this batch changed neither. The published surface is
byte-identical to 042's. The one thing here that _can_ weaken the gate — the retry classifier — is
guarded by the file that exists for exactly that, and was mutation-checked rather than reviewed.

## Rules promoted

- `CLAUDE.md` § Commands, the `test:client` block — a hung run is the second run you did not know
  about; check for a live one before diagnosing this symptom, and the two mechanisms that now make
  it impossible.
- `packages/core/scripts/run-client-tests.mjs` — the "isolated cache is a memory trade and it has
  been seen to lose" note is corrected in place. It has not been seen to lose; the trade is real and
  still unmeasured.
- `packages/core/scripts/lib/classify-chunk-failure.mjs` — the pattern list is an allowlist of
  signatures seen in real runs, and a signature it lacks fails a green suite. Kept in that module
  rather than `CLAUDE.md`: it constrains edits to one file, and it is written where the next person
  adding a pattern will be standing.

## Debts opened

`-`
