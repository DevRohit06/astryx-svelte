# Agentic work architecture

**Status:** approved design, not yet implemented
**Date:** 2026-08-15
**Scope:** repo-local to `astryx-svelte`. Not designed for reuse in other repos.

## The problem

The port's agent layer is good and its record-keeping is not. Five well-scoped agents and one
skill sit on top of a document set that has grown past the point where an agent — or a human —
can read it.

Measured at `35d569a`:

| Symptom                | Measurement                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| `TODO.md`              | 619 KB, 6,643 lines; grew 553 → 619 KB in six days across ~23 commits           |
| Longest table cell     | 5,755 characters                                                               |
| Known debts            | 2,323 lines — **a third of the file** — holding ~371 bullet entries            |
| `PORTED.md`            | 164 KB, 1,951 lines, organised by batch rather than by component               |
| Checkbox state         | 415 unchecked, 177 checked, in a project whose stated remaining work is one command |
| Root directory         | 30+ entries, including 50 MB of untracked scratch (deleted 2026-08-15)          |

Four structural failures follow from that.

**1. The state file is an append-only journal.** `CLAUDE.md` instructs agents to "read the relevant
section before starting work." At 6,643 lines that is not executable: an agent either spends ~180k
tokens on the whole file or greps and loses the surrounding context. The file only ever grows.

**2. Status is prose, so it rots, and the document knows it.** The Status rows fuse five document
types into single cells — current metric, superseded metric, the incident that produced it, the
lesson, and an instruction. The file has given up on its own numbers in writing: _"Run
`pnpm -F docs generate` and read the number; do not predict it"_, _"Re-derive this figure; do not
carry it forward"_, _"the figure read 100 / 100 for several batches"_. Every one of those numbers is
derivable by a script, and none are.

**3. "Batch" is the unit of work and nothing defines it.** `PORTED.md` is organised by batch,
pre-flight is "read before starting a batch", the audit agents are "run at batch close" — yet there
is no batch template, no start or close ritual, and no artifact per batch. Each batch's record lands
wherever the writer put it, split across two files. Numbering already broke down: `17a`/`17b`/`17c`/
`18`, then it stopped and the last two batches went untitled.

**4. No orchestration above the single component.** One skill covers porting one component. The
repo has executed three other multi-step procedures repeatedly — closing a batch, tracking an
upstream version bump (0.2.0 → 0.3.0 → 0.4.1), and cutting a release — each re-derived from scratch,
with the knowledge of how left behind in narrative form.

The gap that unifies all four: **this port's fidelity claims are machine-checked by three oracles,
but the record of those claims is hand-typed prose that drifts.** Closing that gap is the design.

## What this is not

- Not a rewrite of the five agents. They are well-scoped and stay as they are, modulo path updates.
- Not a deletion of history. The 619 KB is _sharded_, not discarded; git holds the rest.
- Not portable infrastructure. Repo-local, hardcoded against this workspace, deliberately.
- Not a move to GitHub Issues or a task API. The oracles' output is plain text and the record
  should be too.

## Architecture

### One folder

Every document about building the port moves under `port/`. Root keeps only what a package consumer
or contributor expects to find there.

```
port/
  README.md            index — start here, what each file is for
  todo.md              live backlog, <=150 lines
  status.md            GENERATED — do not edit
  debts.md             deliberate deviations, component-tagged
  upstream-diff.md     moved from root
  design/              this file and its successors
  ledger/              one file per batch, NNN-slug.md
  research/            today's planning/*.md, unchanged
```

Three constraints fixed that shape:

- **`CLAUDE.md` stays at root.** Claude Code auto-loads it from there; moving it breaks the one file
  that must always be in context.
- **It cannot live in `docs/`.** That is the SvelteKit docs-site package, not a docs folder.
- **Not `.claude/`.** That is harness config, and it is dot-hidden. `CONTRIBUTING.md` points
  contributors at the backlog, and a human must find it without knowing about Claude Code.

### Four document classes

| Class        | Home                          | Written by            | Cadence          |
| ------------ | ----------------------------- | --------------------- | ---------------- |
| **Doctrine** | `CLAUDE.md`, `.claude/agents/` | human                 | rarely           |
| **State**    | `port/todo.md`                | human                 | every batch      |
| **Metrics**  | `port/status.md`              | `scripts/status.mjs`  | every `verify`   |
| **Debts**    | `port/debts.md`               | human, on deviation   | on deviation     |
| **Ledger**   | `port/ledger/NNN-slug.md`     | `close-batch`         | once per batch   |
| **Research** | `port/research/`              | human                 | frozen           |

`port/debts.md` keeps its current prose bodies — the prose is good — but each entry gains a
machine-readable head so `astryx-parity` can query it:

```markdown
### <title>

- **units:** Selector, MultiSelector
- **kind:** upstream-lag | deliberate-divergence | unported | api-divergence
- **retires:** when upstream ships X | never

<the existing prose body, unchanged>
```

That head is what makes "is this drift already a known debt?" a one-line grep instead of a read
through a third of a megabyte.

### The batch lifecycle

A batch is **one upstream-scoped unit of work that opens with a spec and closes with all gates green
and one ledger entry.** One batch, one number, one file, one commit range. Flat monotonic integers,
no letters.

| Phase    | Skill                     | Produces                                                                       |
| -------- | ------------------------- | ------------------------------------------------------------------------------ |
| **Open** | `start-batch`             | Ledger file from template with scope and upstream refs; pre-flight as real todos |
| **Work** | `port-component` (exists) | The port                                                                       |
| **Close**| `close-batch`             | Four audit agents, `verify`, regenerated status, completed ledger, updated todo |

#### Ledger entry template

Derived from what batch 020 already does well, plus two sections:

```markdown
---
batch: 020
title: The Selector family at 0.4.1
upstream: 0.4.1
date: 2026-08-15
units: [Selector, MultiSelector, ComplexSelector, PanelSearchInput]
upstream-prs: [4928, 4838, 4846, 4993, 4951, 5003, 4802, 4935, 4973]
---

## Scope                   what is in, what a neighbouring batch covers
## <Unit>                  one section per component, PR-referenced
## Oracle bookkeeping      mode flips, new cases, N -> 0 counts
## What the audits caught  agent findings
## Rules promoted          NEW
## Debts opened            NEW
```

**"Rules promoted" is the section that matters.** The repo's most valuable content is currently
stranded at the point of the incident. `PORTED.md:1937` ends: _"The general rule, and it is
`planning/06` H12 verbatim: any event a component handles itself must be destructured out of
`$props()` and invoked explicitly."_ That constrains every future port, and it lives at line 1,937
of a 1,951-line file where no agent will read it.

So the template forces the question at close: **does this lesson change future work?** If yes, it
moves into `CLAUDE.md` or the relevant agent file _in the same commit_, and the ledger keeps only a
pointer. If no, it stays narrative. Today everything stays, so nothing is found.

"Debts opened" does the same for `port/debts.md`.

`PORTED.md` disappears into `port/ledger/`, sharded.

### The procedure layer

| Skill             | Status | Trigger                    | Encodes                                                    |
| ----------------- | ------ | -------------------------- | ---------------------------------------------------------- |
| `port-component`  | exists | one component              | spec -> author -> oracle -> idiom -> tests -> close         |
| `start-batch`     | new    | opening a batch            | pre-flight as todos; scaffold the ledger file               |
| `close-batch`     | new    | batch done                 | 4 agents -> `verify` -> regen status -> ledger -> todo      |
| `track-upstream`  | new    | upstream cuts a version    | the 0.2.0 / 0.3.0 / 0.4.1 sequence, done 3x from memory     |
| `release`         | new    | cutting a release          | 10 manifests -> CHANGELOG -> dry-run -> tag                 |

**`close-batch`** turns the pre-flight's `"Do not offer; just run them"` into something that runs,
and is where the promotion rule fires.

**`track-upstream`** is the most under-served. The sequence has been improvised three times: diff
upstream tags for added / removed / renamed component dirs, re-pin every `@astryxdesign/*`
devDependency exact, re-baseline the class oracle, audit the skip list for entries that now
self-retire, re-derive the token count against the new tag, and check whether the published tarball
lags source. Batch 18's entry records that it _"began as 'track 0.3.0' and grew, because four
closing audits kept finding things older than 0.3.0"_ — that growth is the symptom of a sequence
reconstructed rather than followed.

**`release`** covers only what `release.yml` cannot: the ten-manifest version bump, the CHANGELOG
heading stating the parity target, and the `workflow_dispatch` dry-run before the tag, because npm
does not permit reusing a version number.

**The five agents stay.** The split is right — agents are specialists that report, skills are
procedures the main loop follows. They need path updates (`TODO.md` -> `port/todo.md`) and one new
step in `astryx-parity`: consult `port/debts.md` before reporting drift, so a deliberate deviation
stops being re-reported as a defect every batch.

### The gate

#### `scripts/status.mjs`

Writes `port/status.md` behind a `DO NOT EDIT` header. Derives:

- component dirs, bidirectionally against `reference/astryx-upstream/`
- tokens, from core's built `dist/`
- style keys, inline call sites, skips and mismatches, from `compare-upstream-classes.mjs`
- CSS-oracle result, from `compare-upstream-css.mjs`
- theme declarations, from the neutral oracle and `liquid-glass`'s `check-theme.mjs`
- test files and cases, from `vitest list` plus `run-client-tests.mjs`'s reconciliation
- docs blocks and coverage, from `pnpm -F docs generate`
- the `@astryxdesign/*` pin, from the manifests
- debt counts by kind, from `port/debts.md`

Two tiers, because the full set takes minutes:

- **`--fast`** (default) — filesystem counts, manifest pins, debt tallies. Seconds.
- **full** — runs the gates and captures real output. Used by `close-batch` and CI.

#### `pnpm verify`

Runs build, check, lint, test and the three oracles, then regenerates `port/status.md`.

Its design is dictated by two failures already paid for and recorded in `TODO.md`:

- _"A lint gate chained with `&&` reports 'failed' identically whether one stage failed or both
  ran"_ — a stray scratch file short-circuited eslint and hid six real errors for several batches.
  So `verify` runs **every** stage, records pass/fail per stage, and reports all of them rather than
  dying at the first `&&`.
- _"The gate is only as trustworthy as the tree is quiet"_ — a scratch file deleted mid-run failed
  the gate on a path that no longer existed. So `verify` **refuses to start** with scratch files
  present. That check fires today: `zz-tmp-progressbar-paint.test.ts` and `zz-tmp-icb-verify.test.ts`
  are in `packages/core/src/tests/`.

Then the enforcement: `git diff --exit-code port/status.md`. **A stale claim fails CI.** That is
what stops `100 / 100` surviving three batches.

#### Root docs enter the lint gate

`pnpm -r lint` runs `prettier --check .` inside each _package_, so nothing has ever checked the repo
root — which is how malformed blocks accumulated in `TODO.md` unnoticed. `todo.md`, `status.md` and
`debts.md` join the gate. `port/ledger/**` stays prettier-ignored initially, because
`prettier --write` provably does not converge on that prose today (continuation paragraphs
re-indent 6 -> 10 -> ... -> 30 spaces, and past ~4 extra spaces markdown renders them as a code
block). `status.mjs` emits prettier-clean output so the generator and the gate do not fight.

## Migration

Six steps, ordered so value lands early and nothing depends on an unbuilt piece.

1. **Move and rename.** `git mv` into `port/`; no content changes. Root drops 19 -> 16 tracked entries
   immediately. Update every referencing path — `CLAUDE.md`, `CONTRIBUTING.md`, the five agents, the
   `port-component` skill, `.github/ISSUE_TEMPLATE/parity.yml`, `.github/scripts/changed-scopes.mjs`,
   and the docs and CLI scripts that mention `TODO.md`.
2. **Extract `debts.md`.** Lift the 2,323-line Known debts section wholesale; add the
   machine-readable head to each entry.
3. **Shard the ledger.** Landed-history sections of `TODO.md` (Phase 4 in full, most of Phase 5) and
   all of `PORTED.md` become `port/ledger/NNN-slug.md`. Retro-assign the two untitled batches as 019
   and 020.
4. **Cut `todo.md` to <=150 lines.** Current goal, next three items, links out. Everything else has
   a home by now.
5. **Build `scripts/status.mjs` and `pnpm verify`.** Before the skills, because `close-batch` calls
   `verify`.
6. **Write the four skills.**

Steps 1 and 2 are mechanical and safe. Step 3 needs judgment and is the bulk of the work. Step 5 is
the only real engineering.

## Success criteria

- `port/todo.md` is under 150 lines and every number in it is a link to `status.md`, not a claim.
- `pnpm verify` fails on a hand-edited `status.md`, on a scratch file in the tree, and on any single
  failing stage — each mutation-checked, per this repo's standing practice.
- `astryx-parity` can answer "is this a known debt?" with one grep.
- Closing a batch produces exactly one ledger file and zero edits to any other historical document.
- Root holds 16 tracked entries.

## Risks

- **Step 3 is judgment work at 780 KB.** Mitigated by it being pure text movement with git as the
  safety net; no code changes, and `verify` is unaffected until step 5.
- **The promotion rule can be skipped.** `close-batch` asks the question but cannot force a good
  answer. Accepted: it is strictly better than today, where the question is never asked.
- **`status.mjs` full-tier is slow.** Mitigated by the two tiers, and by CI already paying that cost
  on every PR.
