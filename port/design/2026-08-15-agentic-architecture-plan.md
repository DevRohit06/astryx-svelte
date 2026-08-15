# Agentic Work Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every build document under `port/`, replace hand-typed status prose with a generated
and CI-enforced `port/status.md`, define the batch lifecycle with a per-batch ledger, and encode the
four procedures this repo currently re-derives from memory.

**Architecture:** Four document classes get four homes under one folder. Metrics stop being written
and start being generated — `scripts/status.mjs` runs each gate and embeds its output verbatim, and
`scripts/verify.mjs` regenerates the file and fails when it differs from what is committed. Batches
gain a template with a rule that promotes reusable lessons into `CLAUDE.md` or an agent instead of
stranding them in narrative. Four skills encode the procedures.

**Tech Stack:** Node 22 ESM (`.mjs`, no build step), pnpm 10 workspaces, existing vitest projects,
GitHub Actions, prettier (tabs, single quotes, no trailing commas, 100 cols).

**Spec:** `port/design/2026-08-15-agentic-architecture.md`

## Global Constraints

- **Node 22, ESM `.mjs`, zero dependencies** in `scripts/` — matches `scripts/check-publish.mjs`,
  the existing root-script precedent.
- **Prettier: tabs, single quotes, no trailing commas, 100 columns.**
- **`status.md` must be deterministic.** No timestamps, no durations, no absolute paths, no commit
  SHAs. Any clock-dependent byte makes `git diff --exit-code port/status.md` fail on every run and
  destroys the gate. Strip non-determinism from captured output before writing.
- **Capture, do not parse.** `status.mjs` embeds each gate's own stdout verbatim plus its exit code.
  Never regex a number out of prose output.
- **Root scripts are mutation-checked, not unit-tested.** This repo's precedent is
  `scripts/check-publish.mjs`, verified by proving it fails in three directions rather than by a
  test file. Follow it: every gate added here is proven by a deliberate mutation that must fail.
- **`CHANGELOG.md` is never codemodded.** It is a published historical record; its `TODO.md`
  references describe the repo as it was at each release.
- **`CLAUDE.md` stays at the repo root.** Claude Code auto-loads it from there.
- **Never install with `--prod` or prune devDependencies** — both oracles and the docs content
  pipeline read the upstream `@astryxdesign/*` packages, which are devDependencies.

## File Structure

**Created:**

| Path                             | Responsibility                                             |
| -------------------------------- | ---------------------------------------------------------- |
| `port/README.md`                 | Index — what each file is for, where to write what         |
| `port/todo.md`                   | Live backlog, <=150 lines (from `TODO.md`)                 |
| `port/status.md`                 | Generated metrics                                          |
| `port/debts.md`                  | Deliberate deviations, machine-readable heads              |
| `port/upstream-diff.md`          | From `UPSTREAM-DIFF.md`                                    |
| `port/ledger/NNN-<slug>.md`      | One file per batch                                         |
| `port/ledger/TEMPLATE.md`        | The template `start-batch` copies                          |
| `port/research/`                 | From `planning/`                                           |
| `scripts/status.mjs`             | Generates `port/status.md`                                 |
| `scripts/verify.mjs`             | Runs every stage, reports all, gates on status drift       |
| `scripts/lib/run-stage.mjs`      | Shared child-process runner + non-determinism stripping    |
| `scripts/codemod-doc-paths.mjs`  | One-shot path rewriter (deleted after Task 5)              |
| `.claude/skills/start-batch/SKILL.md`    | Open a batch                                       |
| `.claude/skills/close-batch/SKILL.md`    | Close a batch                                      |
| `.claude/skills/track-upstream/SKILL.md` | Track an upstream version                          |
| `.claude/skills/release/SKILL.md`        | Cut a release                                      |

**Modified:** `CLAUDE.md`, `CONTRIBUTING.md`, `package.json`, `.prettierignore`, the five
`.claude/agents/*.md`, `.claude/skills/port-component/SKILL.md`,
`.github/scripts/changed-scopes.mjs`, `.github/ISSUE_TEMPLATE/parity.yml`,
`.github/workflows/ci.yml`, and ~330 source files carrying doc-path references in comments.

**Deleted:** `TODO.md`, `PORTED.md`, `UPSTREAM-DIFF.md`, `planning/`, `scripts/codemod-doc-paths.mjs`.

---

### Task 1: Create `port/`, move the documents, rewrite the three known-final paths

Moves only. No prose is rewritten in this task, so the diff is reviewable as pure renames plus one
mechanical path substitution.

`PORTED.md` moves to `port/ported.md` as a way-station — its references are rewritten in Task 3,
once sharding has decided their final targets.

**Files:**

- Create: `port/README.md`
- Create: `scripts/codemod-doc-paths.mjs`
- Move: `TODO.md` -> `port/todo.md`, `PORTED.md` -> `port/ported.md`,
  `UPSTREAM-DIFF.md` -> `port/upstream-diff.md`, `planning/` -> `port/research/`
- Modify: ~330 files carrying `TODO.md`, `UPSTREAM-DIFF.md` or `planning/` references

- [ ] **Step 1: Move the files with git so history follows**

```bash
mkdir -p port
git mv TODO.md port/todo.md
git mv PORTED.md port/ported.md
git mv UPSTREAM-DIFF.md port/upstream-diff.md
git mv planning port/research
git status --short
```

Expected: four rename entries (`R`), no deletions.

- [ ] **Step 2: Write the codemod**

Create `scripts/codemod-doc-paths.mjs`:

```js
#!/usr/bin/env node
// One-shot rewriter for the doc paths that moved under `port/`. Deleted once
// Task 5 has run it for the last time — it exists to make a 330-file diff
// reviewable as one mechanical substitution rather than 330 judgement calls.
//
// Usage: node scripts/codemod-doc-paths.mjs [--check]
//   --check exits 1 if any occurrence remains, and writes nothing.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// `planning/` is a prefix rule on purpose: `planning/06-react-to-svelte-patterns.md`
// becomes `port/research/06-react-to-svelte-patterns.md` with the filename intact.
const RULES = [
	[/\bUPSTREAM-DIFF\.md\b/g, 'port/upstream-diff.md'],
	[/\bTODO\.md\b/g, 'port/todo.md'],
	[/\bplanning\//g, 'port/research/']
];

// `CHANGELOG.md` is a published record of what the repo looked like at each
// release. Rewriting it would falsify shipped history.
const EXCLUDE = new Set(['CHANGELOG.md']);

const checkOnly = process.argv.includes('--check');

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
	.split('\n')
	.filter(Boolean)
	.filter((f) => !EXCLUDE.has(f))
	.filter((f) => /\.(md|mjs|js|ts|svelte|yml|yaml|json)$/.test(f));

let changed = 0;
let occurrences = 0;

for (const file of files) {
	const before = readFileSync(file, 'utf8');
	let after = before;
	for (const [pattern, replacement] of RULES) {
		after = after.replace(pattern, () => {
			occurrences += 1;
			return replacement;
		});
	}
	if (after === before) continue;
	changed += 1;
	if (!checkOnly) writeFileSync(file, after);
}

if (checkOnly) {
	if (occurrences > 0) {
		console.error(`${occurrences} stale doc path(s) across ${changed} file(s)`);
		process.exit(1);
	}
	console.log('no stale doc paths');
	process.exit(0);
}

console.log(`rewrote ${occurrences} occurrence(s) across ${changed} file(s)`);
```

- [ ] **Step 3: Count occurrences before running, so the result is checkable**

```bash
git grep -c -E "\bTODO\.md\b|\bUPSTREAM-DIFF\.md\b|\bplanning/" -- ':!CHANGELOG.md' | \
  awk -F: '{n+=$2} END {print n" occurrences across "NR" files"}'
```

Expected: roughly 400 occurrences across roughly 330 files. Record the exact number.

- [ ] **Step 4: Run the codemod**

```bash
node scripts/codemod-doc-paths.mjs
```

Expected: `rewrote <N> occurrence(s) across <M> file(s)` where `<N>` matches Step 3.

- [ ] **Step 5: Verify no occurrence survives**

```bash
node scripts/codemod-doc-paths.mjs --check
```

Expected: `no stale doc paths`, exit 0.

- [ ] **Step 6: Write `port/README.md`**

```markdown
# port/

Everything about *building* this port. Consumer-facing documents (`README.md`, `CHANGELOG.md`,
`CONTRIBUTING.md`) stay at the repo root, and so does `CLAUDE.md`, which Claude Code auto-loads
from there.

| File                | What goes in it                                                       |
| ------------------- | --------------------------------------------------------------------- |
| `todo.md`           | The current goal and the next few items. Nothing landed, no metrics.  |
| `status.md`         | **Generated.** Every countable claim. Never edit by hand.             |
| `debts.md`          | Deliberate deviations from upstream, one entry each.                  |
| `ledger/`           | One file per batch — how the work was actually done.                  |
| `research/`         | Frozen upstream analysis. Research, not spec: verify against source.  |
| `design/`           | Design docs and their implementation plans.                           |
| `upstream-diff.md`  | The standing upstream-versus-port comparison.                         |

## Where do I write this?

- **A number** — nowhere. Run `node scripts/status.mjs` and it appears in `status.md`.
- **A deliberate divergence from upstream** — `debts.md`, with a machine-readable head.
- **How a component was built** — the current batch's `ledger/` entry.
- **A rule that constrains future work** — `CLAUDE.md` or the relevant `.claude/agents/*.md`.
  The ledger keeps only a pointer. This is the promotion rule, and `close-batch` enforces it.
- **What to do next** — `todo.md`, and keep it under 150 lines.
```

- [ ] **Step 7: Confirm the root shrank**

```bash
git ls-files | awk -F/ '{print $1}' | sort -u | tee /dev/stderr | wc -l
```

Expected: 16 entries — `port/` present; `TODO.md`, `PORTED.md`, `UPSTREAM-DIFF.md` and `planning`
absent.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Move the build documents under port/

Root drops from 19 tracked entries to 16. Pure renames plus one mechanical
path substitution across 330 files; no prose is rewritten here.

PORTED.md lands at port/ported.md as a way-station — its references are
rewritten when sharding decides their targets.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Route the Known debts section

**Corrected 2026-08-15 after measurement. The original task assumed the section was ~371 debts and
moved it out whole. It is not.** The section is 2,324 lines organised into **41 groups** by bold
paragraph label, and 25 of those groups are keyed to a batch — "Batch 14 — PowerSearch (ported; the
debts below are what the batch left behind)", "Batch 10 — test-harness findings (not component
defects)". Those are ledger entries, not debts. Measured split:

| Group class | Groups | Entries | Destination |
| --- | --- | --- | --- |
| Batch-keyed | 25 | **242** | `port/ledger/`, under the batch that produced them |
| Cross-cutting | 16 | **129** | `port/debts.md` |

Moving all 371 into `debts.md` would preserve the category error and make the grep this whole design
exists for useless: `astryx-parity` would hit landed CI fixes, incident reports and already-resolved
items. So this task **routes** rather than moves, and Task 3 distributes what it stages.

The 129 are not all debts either — "Fixed, found by porting an example block" is resolved by its own
title. Resolved entries are dropped here and named in the report, not carried forward.

**Files:**

- Create: `port/debts.md` (from the cross-cutting groups), `port/ledger/_inbox.md` (staging for the
  batch-keyed groups, consumed and deleted by Task 3)
- Modify: `port/todo.md` (delete the Known debts section, leave a pointer)

**Interfaces:**

- Produces: the entry head format that `astryx-parity` greps in Task 10 and `status.mjs` counts in
  Task 5 — `- **units:** …`, `- **kind:** …`, `- **retires:** …` under a `### <title>` heading.
- Produces: `port/ledger/_inbox.md`, batch-keyed entries under their original group labels as `##`
  headings, verbatim. Task 3 consumes it.

- [ ] **Step 1: Print the group inventory and confirm the split**

```bash
tail -n +4320 port/todo.md | node --input-type=module -e '
let t=""; process.stdin.on("data",d=>t+=d).on("end",()=>{
 const lines=t.split("\n"); let cur="(ungrouped preamble)"; const g=new Map([[cur,0]]);
 for(const l of lines){
  const m=l.match(/^\*\*(.+)\*\*$/);
  if(m){cur=m[1].replace(/:$/,"");g.set(cur,0);continue;}
  if(/^- \[[ x]\]/.test(l)) g.set(cur,g.get(cur)+1);
 }
 const batchy=/^(Batch \d|The Selector family|The input family|Slice)/;
 for(const [k,n] of g) if(n>0) console.log(String(n).padStart(4), batchy.test(k)?"LEDGER":"debt  ", k);
});'
```

Expected: 41 groups, 242 entries marked LEDGER and 129 marked debt. If these numbers differ, stop
and report — the routing below is sized against them.

- [ ] **Step 2: Stage the batch-keyed groups**

Write the 25 LEDGER-marked groups to `port/ledger/_inbox.md`, each under its original label as a
`##` heading, entries verbatim. This file is Task 3's input and Task 3 deletes it.

Do not classify, reword or add heads to these — they are batch narrative and Task 3 files them.

- [ ] **Step 2b: Cut the cross-cutting groups into `port/debts.md`**

Write the 16 cross-cutting groups to `port/debts.md` under this header, preserving their group
labels as `##` headings so related debts stay together:

```markdown
# Known debts

Small, named, deliberately not hidden. Upstream bugs are documented here, not replicated.

Every entry carries a machine-readable head so `astryx-parity` can ask "is this drift already a
known debt?" with one grep. The prose body below it is unchanged.
```

**Do not truncate `port/todo.md` with a redirect in the same pipeline that reads it.** An earlier
attempt at this task ran `head -n $((START-1)) port/todo.md > port/todo.md.new && mv …` and left the
file truncated when it was interrupted mid-step. Cut `todo.md` last, as its own step, after both
output files exist and have been counted.

- [ ] **Step 2c: Reconcile the counts before touching `todo.md`**

```bash
echo "inbox:  $(grep -c '^- \[[ x]\]' port/ledger/_inbox.md)"
echo "debts:  $(grep -c '^- \[[ x]\]' port/debts.md)"
```

Expected: `242` and `129`, summing to 371. **If they do not sum to 371, stop** — an entry has been
dropped, and nothing else in this task may proceed until the sum is right.

- [ ] **Step 3: Verify each of the 129 is still true — most are not**

This port compares itself against upstream mechanically and continuously, so a debt written six
batches ago has usually retired itself without anyone striking it out. The section is a write-only
log. Three mechanical facts settle most of it before you read a word of prose:

```bash
# The class oracle's deferral list — every "published dist lags source" entry ever written
grep -n "ABSENT_UPSTREAM = " packages/core/scripts/compare-upstream-classes.mjs   # => []
# Components ported
ls -d packages/core/src/lib/components/*/ | wc -l
# Docs blocks still pending
pnpm -F docs generate 2>&1 | grep -i pending
```

The skip list is **empty**. Therefore **every entry whose debt is a deferred oracle verification is
retired** — there is nothing left deferred. Likewise every entry reading "unblock when their
component lands" or "deferred until X is ported", because the component set is complete.

For each of the 129, decide: **is this still true of the tree in front of you?** Check the named
component, module or file. An entry survives only if you can point at the code that still diverges.

- **Survives** — gets a head and stays in `port/debts.md`.
- **Retired** — moves to `port/ledger/_inbox.md` under `## Retired — <original group>`, with one
  added line naming what retired it ("the skip list is empty", "`Chat` landed in batch 16",
  "0 pending blocks"). Never delete one; a retired debt is history and Task 3 files it.

Do not carry an entry forward because it is plausible. The point of this pass is that the surviving
list is short enough to be read, and true enough to be trusted. Report the survivor count — do not
predict it, and do not aim for a target.

- [ ] **Step 3b: Convert each surviving entry to a heading with a head**

Each debt is currently a `- [ ] **<title>.** <prose>` bullet. Convert every one to:

```markdown
### `BlogCoverArt` is not ported, so a non-release post with no `coverImage` has no cover

- **units:** BlogCoverArt
- **kind:** unported
- **retires:** when a second blog post lands without a `coverImage`

Upstream's generative default cover (210 lines, deterministic from post `type` + `slug`) is the
one piece of the blog surface this port skipped. …
```

`kind` is one of exactly four values: `upstream-lag`, `deliberate-divergence`, `unported`,
`api-divergence`. `units` is a comma-separated list of component or module names, or `-` where the
debt is repo-wide. `retires` states the condition, or `never`.

Work through `port/debts.md` top to bottom — the 129 cross-cutting entries only. The 242 staged in
`_inbox.md` get no heads; they are batch narrative and Task 3 files them as-is.

Do not summarise or shorten any prose body.

**Drop entries whose own title says they are resolved** — "Fixed, found by porting an example
block" is one whole group, and individual entries elsewhere read "…is now published, resolving an
inconsistency the batch created". A resolved item is history: move it to `_inbox.md` under a
`## Resolved — <original group>` heading so Task 3 can file it with its batch, and name it in your
report. Never delete one outright.

- [ ] **Step 4: Verify every entry has a complete head**

```bash
node -e '
const t = require("fs").readFileSync("port/debts.md","utf8");
const entries = t.split(/^### /m).slice(1);
const kinds = new Set(["upstream-lag","deliberate-divergence","unported","api-divergence"]);
let bad = 0;
for (const e of entries) {
  const title = e.split("\n")[0];
  const kind = (e.match(/^- \*\*kind:\*\* (.+)$/m) || [])[1];
  const units = (e.match(/^- \*\*units:\*\* (.+)$/m) || [])[1];
  const retires = (e.match(/^- \*\*retires:\*\* (.+)$/m) || [])[1];
  if (!kind || !kinds.has(kind.trim()) || !units || !retires) {
    bad++; console.error("incomplete: " + title);
  }
}
console.log(entries.length + " entries, " + bad + " incomplete");
process.exit(bad === 0 ? 0 : 1);
'
```

Expected: `<N> entries, 0 incomplete`, exit 0.

Then re-reconcile, because Step 3 moved the retired entries across:

```bash
echo "debts:  $(grep -c '^### ' port/debts.md)"
echo "inbox:  $(grep -c '^- \[[ x]\]' port/ledger/_inbox.md)"
```

The two must still sum to **371**. The split will no longer be 129/242 — it moved by however many
entries Step 3 retired, and that is the number this task exists to discover.

- [ ] **Step 5: Cut the section out of `todo.md` and leave a pointer**

Only now, with `debts.md` and `_inbox.md` both written and reconciled at 371. Delete from the
`## Known debts` heading to EOF and append:

```markdown
## Known debts

Standing deviations live in [`debts.md`](./debts.md), each with a machine-readable head.
Per-batch findings live in [`ledger/`](./ledger).
```

Verify the cut did not overshoot:

```bash
wc -l port/todo.md          # expect 4,319
tail -5 port/todo.md        # expect the pointer above, nothing after it
git diff --stat port/todo.md
```

- [ ] **Step 6: Commit**

```bash
git add port/debts.md port/todo.md
git commit -m "Extract the known debts into port/debts.md

2,323 lines — a third of the backlog file — holding the entries agents most
need to query, buried at line 4,320. Each entry gains a units/kind/retires
head so astryx-parity can check 'is this already a known debt?' with one
grep instead of a read through a third of a megabyte.

Prose bodies are unchanged.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Shard the ledger

`port/ported.md` and the landed-history sections of `port/todo.md` become one file per batch.

**Files:**

- Create: `port/ledger/TEMPLATE.md`, `port/ledger/NNN-<slug>.md` (one per batch)
- Delete: `port/ported.md`
- Modify: `port/todo.md` (remove landed history), all files referencing `PORTED.md`

- [ ] **Step 1: Write the template**

Create `port/ledger/TEMPLATE.md`:

```markdown
---
batch: NNN
title:
upstream:
date:
units: []
upstream-prs: []
---

## Scope

What is in this batch, and what a neighbouring batch covers instead.

## <Unit>

One section per component or module. Reference upstream PR numbers.

## Oracle bookkeeping

Mode flips, new cases, and the `N -> 0` mismatch counts.

## What the audits caught

Findings from `astryx-parity`, `astryx-idiom`, `astryx-test-parity` and `astryx-surface`.

## Rules promoted

Every lesson here that constrains **future** work moves into `CLAUDE.md` or the relevant
`.claude/agents/*.md` in this same commit. List the pointers, not the prose:

- `CLAUDE.md` § Conventions — <one line>
- `.claude/agents/astryx-idiom.md` — <one line>

If nothing was promoted, say so and why. An empty section is a claim, not an omission.

## Debts opened

Entries added to `port/debts.md` by this batch, by title. `-` if none.
```

- [ ] **Step 2: Enumerate the batches**

```bash
grep -n "^## " port/ported.md
grep -n "^## Phase 4\|^## Phase 5\|^### .*landed\|^### .*—.*20[0-9][0-9]-" port/todo.md | head -40
```

Expected: the batch headings in `ported.md` (17a, 17b, 17c, 18, page templates, the input family,
the Selector family) and the landed sections of Phases 4 and 5 in `todo.md`.

- [ ] **Step 3: Assign numbers and create the files**

Flat monotonic integers, no letters. The two untitled batches become `019` and `020`:

| File                                  | Source                                            |
| ------------------------------------- | ------------------------------------------------- |
| `017a…c` -> `017-`, `018-`            | renumber in order; keep the original titles       |
| `019-input-family-0.4.x.md`           | `ported.md` § "The input family at 0.4.x"         |
| `020-selector-family-0.4.1.md`        | `ported.md` § "The Selector family at 0.4.1"      |
| `page-templates` -> its own number    | `ported.md` § "Page templates"                    |
| Phase 4 slices                        | `todo.md` § Phase 4 (all landed)                  |
| Phase 5 landed sections               | `todo.md` § Phase 5 dated subsections             |

Each file gets the YAML front matter from the template, filled from its content. Prose bodies move
verbatim. Add `## Rules promoted` and `## Debts opened` to each; for historical batches, fill
`Rules promoted` with a pointer where the lesson has already reached `CLAUDE.md`, and otherwise
record `not promoted at the time`.

- [ ] **Step 3b: Distribute `port/ledger/_inbox.md`**

Task 2 staged **242 batch-keyed entries** there — the groups whose own labels name a batch ("Batch
14 — PowerSearch (ported; the debts below are what the batch left behind)"), plus any resolved
entries it moved out of the debts file under `## Resolved — <group>` headings.

Each `##` group in the inbox names its batch. File its entries into that batch's ledger file, under
the **What the audits caught** section — that is what they are. A group naming a batch with no
ledger file of its own (the older Batch 1-8 groups predate `PORTED.md`'s narrative) gets a ledger
file created for it from the template, carrying only what the inbox holds; mark its front matter
`units: []` and `upstream-prs: []` where the content does not say.

Then:

```bash
grep -c '^- \[[ x]\]' port/ledger/_inbox.md    # must reach 0 entries unfiled
git rm port/ledger/_inbox.md
```

**The inbox must be empty before it is deleted.** An entry left in it is an entry lost.

- [ ] **Step 4: Verify nothing was lost**

```bash
git show HEAD:port/ported.md | wc -l
cat port/ledger/*.md | grep -v "^---$" | wc -l
```

Expected: the ledger total exceeds `ported.md`'s line count (front matter and the two new sections
are additive). Then spot-check three batches for a paragraph that exists in both.

- [ ] **Step 5: Delete the way-station and rewrite its references**

```bash
git rm port/ported.md
git grep -l "PORTED\.md" -- ':!CHANGELOG.md' | \
  xargs -r sed -i 's|PORTED\.md|port/ledger/|g'
git grep -n "PORTED\.md" -- ':!CHANGELOG.md' | wc -l
```

Expected: `0`.

- [ ] **Step 6: Remove the landed history from `todo.md`**

Delete the Phase 4 and Phase 5 sections now living in the ledger, leaving a one-line pointer to
`port/ledger/`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Shard the batch history into port/ledger/

One batch, one number, one file. PORTED.md was organised by batch already;
this makes that structure real and gives each entry the two sections the
old form had no place for — Rules promoted and Debts opened.

Numbering is flat and monotonic; 17a/17b/17c and the two untitled batches
are renumbered in order.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Cut `port/todo.md` to 150 lines

**Files:**

- Modify: `port/todo.md`

- [ ] **Step 1: Establish the target shape**

`port/todo.md` keeps exactly five sections and nothing else:

```markdown
# astryx-svelte — backlog

A Svelte 5 port of Astryx. Unofficial; not affiliated with Meta.

Metrics live in [`status.md`](./status.md) and are generated — do not restate a number here.
History lives in [`ledger/`](./ledger). Deviations live in [`debts.md`](./debts.md).

## Current goal

<one paragraph, with the date it was set>

## Next

- [ ] <item>
- [ ] <item>
- [ ] <item>

## Open decisions

<the still-open items from "Blocking design decisions", one line each>

## Fronts not started

<the roadmap table, sizes only — no narrative>
```

- [ ] **Step 2: Rewrite the file to that shape**

Every number becomes a link to `status.md`. Every landed item is already in `ledger/`; delete it
rather than restating it. Superseded goals are in git history; delete them.

- [ ] **Step 3: Verify the size**

```bash
wc -l port/todo.md
awk '{ if (length > 100) print FILENAME":"NR" is "length" chars" }' port/todo.md
```

Expected: at most 150 lines, and no line over 100 characters.

- [ ] **Step 4: Verify no metric survived**

```bash
grep -nE "[0-9]+ */ *[0-9]+|[0-9]{3,} (passed|files|declarations|keys|cases)" port/todo.md
```

Expected: no output. Any hit is a number that belongs in `status.md`.

- [ ] **Step 5: Commit**

```bash
git add port/todo.md
git commit -m "Cut the backlog to 150 lines

It was 6,643. CLAUDE.md tells agents to read the relevant section before
starting work, which was not executable at that size. Current goal, next
items, open decisions, unstarted fronts — everything else now has a home.

Every number is a link to status.md rather than a claim that goes stale.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `scripts/status.mjs`

**Files:**

- Create: `scripts/lib/run-stage.mjs`, `scripts/status.mjs`, `port/status.md`
- Modify: `package.json`
- Delete: `scripts/codemod-doc-paths.mjs`

**Interfaces:**

- Produces: `runStage(name, command, args, opts) -> { name, ok, code, output }` and
  `stripNondeterminism(text) -> string`, both consumed by `scripts/verify.mjs` in Task 6.

- [ ] **Step 1: Write the shared stage runner**

Create `scripts/lib/run-stage.mjs`:

```js
// Shared child-process runner for `status.mjs` and `verify.mjs`.
//
// Two rules encoded here, both of which this repo has already paid for:
//
//   - A stage never throws. `pnpm -r lint` used to be chained with `&&`, which
//     reports "failed" identically whether one stage failed or both ran — a
//     stray scratch file short-circuited eslint and hid six real errors for
//     several batches. Callers collect every result and report all of them.
//   - Captured output is stripped of anything clock-dependent before it can
//     reach `port/status.md`. A timestamp there would make the diff gate fail
//     on every run, which is the same as having no gate.

import { spawnSync } from 'node:child_process';

const NONDETERMINISM = [
	// Durations: "1.23s", "456ms", "in 2 m", "(1.2 s)"
	[/\b\d+(?:\.\d+)?\s?m?s\b/g, '<duration>'],
	// ISO timestamps
	[/\b\d{4}-\d{2}-\d{2}T[\d:.]+Z?\b/g, '<timestamp>'],
	// Absolute paths on either platform
	[/[A-Za-z]:[\\/][^\s'"]+/g, '<path>'],
	[/\/(?:home|Users|tmp)\/[^\s'"]+/g, '<path>']
];

export function stripNondeterminism(text) {
	let out = text;
	for (const [pattern, replacement] of NONDETERMINISM) out = out.replace(pattern, replacement);
	// Normalise line endings so a Windows run and a CI run agree byte for byte.
	return out.replace(/\r\n/g, '\n').trimEnd();
}

export function runStage(name, command, args, opts = {}) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		shell: process.platform === 'win32',
		cwd: opts.cwd ?? process.cwd(),
		maxBuffer: 64 * 1024 * 1024
	});
	const output = stripNondeterminism(`${result.stdout ?? ''}${result.stderr ?? ''}`);
	return { name, ok: result.status === 0, code: result.status ?? 1, output };
}

export function lastLine(text) {
	const lines = text.split('\n').filter((l) => l.trim() !== '');
	return lines[lines.length - 1] ?? '';
}
```

- [ ] **Step 2: Write the generator**

Create `scripts/status.mjs`:

```js
#!/usr/bin/env node
// Generates `port/status.md`. Every countable claim about this port is derived
// here rather than typed, because the typed ones drifted: "100 / 100" survived
// three batches after upstream moved to 101, and the file it lived in ended up
// instructing readers not to trust its own numbers.
//
// Two design rules:
//   - Capture, do not parse. Each gate's own stdout is embedded verbatim with
//     its exit code. Regexing a number out of prose is the fragility this
//     script exists to remove.
//   - Deterministic output only. No clock, no paths, no SHAs — `verify.mjs`
//     gates on `git diff --exit-code port/status.md`, so a timestamp would
//     fail every run.
//
// Usage: node scripts/status.mjs [--full]
//   default  filesystem counts, manifest pins and debt tallies. Seconds.
//   --full   additionally runs the oracles, `vitest list` and the docs
//            generator, and embeds their output. Minutes.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { runStage, lastLine } from './lib/run-stage.mjs';

const full = process.argv.includes('--full');
const root = process.cwd();

const dirs = (p) =>
	existsSync(p)
		? readdirSync(p, { withFileTypes: true })
				.filter((e) => e.isDirectory())
				.map((e) => e.name)
				.sort()
		: [];

// --- Components, bidirectionally -------------------------------------------

const ours = dirs(path.join(root, 'packages/core/src/lib/components'));
const upstreamRoot = path.join(root, 'reference/astryx-upstream/packages/core/src/components');
const theirs = dirs(upstreamRoot);
const upstreamPresent = theirs.length > 0;

// --- Themes ----------------------------------------------------------------

const themes = dirs(path.join(root, 'packages/themes'));

// --- The upstream pin ------------------------------------------------------

const corePkg = JSON.parse(readFileSync('packages/core/package.json', 'utf8'));
const pin =
	corePkg.devDependencies?.['@astryxdesign/core'] ??
	corePkg.dependencies?.['@astryxdesign/core'] ??
	'unpinned';

// --- Debts by kind ---------------------------------------------------------

const debtsText = existsSync('port/debts.md') ? readFileSync('port/debts.md', 'utf8') : '';
const debtKinds = {};
for (const match of debtsText.matchAll(/^- \*\*kind:\*\* (.+)$/gm)) {
	const kind = match[1].trim();
	debtKinds[kind] = (debtKinds[kind] ?? 0) + 1;
}
const debtTotal = Object.values(debtKinds).reduce((a, b) => a + b, 0);

// --- Ledger ----------------------------------------------------------------

const ledger = existsSync('port/ledger')
	? readdirSync('port/ledger').filter((f) => /^\d{3}-/.test(f)).sort()
	: [];

// --- The gates (--full only) -----------------------------------------------

const gates = [];
if (full) {
	gates.push(
		runStage('Class oracle', 'pnpm', ['-F', '@astryx-svelte/core', 'test:parity']),
		runStage('CSS oracle', 'pnpm', ['-F', '@astryx-svelte/core', 'test:css']),
		runStage('Theme oracle', 'pnpm', ['-F', '@astryx-svelte/theme-neutral', 'test']),
		runStage('Test collection', 'pnpm', [
			'-F',
			'@astryx-svelte/core',
			'exec',
			'vitest',
			'list',
			'--reporter=json'
		]),
		runStage('Docs content', 'pnpm', ['-F', 'docs', 'generate'])
	);
}

// --- Render ----------------------------------------------------------------

const lines = [];
const push = (...l) => lines.push(...l);

push(
	'<!-- GENERATED by scripts/status.mjs — DO NOT EDIT.',
	'     Run `node scripts/status.mjs --full` to regenerate.',
	'     `pnpm verify` fails when this file differs from what is committed. -->',
	'',
	'# Status',
	''
);

push('## Surface', '');
push('| | |', '| --- | --- |');
push(`| Component dirs (ours) | ${ours.length} |`);
push(
	`| Component dirs (upstream) | ${upstreamPresent ? theirs.length : 'upstream clone absent'} |`
);
if (upstreamPresent) {
	const missing = theirs.filter((t) => !ours.includes(t));
	const invented = ours.filter((o) => !theirs.includes(o));
	push(`| Missing here | ${missing.length === 0 ? 'none' : missing.join(', ')} |`);
	push(`| Not in upstream | ${invented.length === 0 ? 'none' : invented.join(', ')} |`);
}
push(`| Theme packages | ${themes.length} — ${themes.join(', ')} |`);
push(`| Upstream pin | \`@astryxdesign/core\` ${pin} |`);
push(`| Ledger entries | ${ledger.length} |`);
push('');

push('## Debts', '');
push('| Kind | Count |', '| --- | --- |');
for (const kind of Object.keys(debtKinds).sort()) push(`| ${kind} | ${debtKinds[kind]} |`);
push(`| **total** | **${debtTotal}** |`);
push('');

push('## Gates', '');
if (!full) {
	push('_Not run — regenerate with `node scripts/status.mjs --full`._', '');
} else {
	push('| Gate | Result | Summary |', '| --- | --- | --- |');
	for (const g of gates) {
		push(`| ${g.name} | ${g.ok ? 'pass' : `FAIL (${g.code})`} | ${lastLine(g.output).slice(0, 120)} |`);
	}
	push('');
	for (const g of gates) {
		push(`### ${g.name}`, '', '```', g.output, '```', '');
	}
}

writeFileSync('port/status.md', lines.join('\n') + '\n');
console.log(`wrote port/status.md (${full ? 'full' : 'fast'})`);
```

- [ ] **Step 3: Run it fast and read the result**

```bash
node scripts/status.mjs
cat port/status.md
```

Expected: `wrote port/status.md (fast)`, and a file with real component counts, the theme list, the
upstream pin and the debt tally.

- [ ] **Step 4: Prove determinism**

```bash
node scripts/status.mjs && cp port/status.md /tmp/a
node scripts/status.mjs && diff /tmp/a port/status.md && echo "DETERMINISTIC"
```

Expected: `DETERMINISTIC`. If the files differ, a clock-dependent byte survived
`stripNondeterminism` — fix it before continuing, because the Task 6 gate depends on this.

- [ ] **Step 5: Run it full**

```bash
node scripts/status.mjs --full
```

Expected: `wrote port/status.md (full)`, and a Gates table with five rows.

- [ ] **Step 6: Wire the scripts and remove the codemod**

In root `package.json`, add to `scripts`:

```json
"status": "node scripts/status.mjs",
"status:full": "node scripts/status.mjs --full"
```

```bash
git rm scripts/codemod-doc-paths.mjs
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Generate port/status.md instead of typing it

Every countable claim about this port is now derived: component dirs read
bidirectionally against the upstream clone, themes and ledger entries from
disk, the upstream pin from the manifest, debts by kind from their heads,
and each gate's own stdout embedded verbatim with its exit code.

Capture rather than parse — regexing a number out of prose is the
fragility this replaces. Output is clock-free so the Task 6 diff gate can
mean something.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `scripts/verify.mjs` and the CI gate

**Files:**

- Create: `scripts/verify.mjs`
- Modify: `package.json`, `.github/workflows/ci.yml`
- Inspect: `packages/core/src/tests/zz-tmp-progressbar-paint.test.ts`,
  `packages/core/src/tests/zz-tmp-icb-verify.test.ts`

**Interfaces:**

- Consumes: `runStage`, `lastLine` from `scripts/lib/run-stage.mjs` (Task 5).

- [ ] **Step 1: Deal with the two scratch files already in the tree**

```bash
head -20 packages/core/src/tests/zz-tmp-progressbar-paint.test.ts
head -20 packages/core/src/tests/zz-tmp-icb-verify.test.ts
```

Read both. If either asserts something the ported suites do not, rename it to a real suite name and
give it the file header this repo requires of beyond-upstream coverage (a hazard with no upstream
analogue, stated at the top). Otherwise `git rm` it. Do not skip this step — the guard in Step 2
will refuse to run until the tree is clean, and deciding under that pressure is how a real test gets
deleted.

- [ ] **Step 2: Write the gate**

Create `scripts/verify.mjs`:

```js
#!/usr/bin/env node
// The gate. Runs every stage, reports all of them, and fails if the committed
// `port/status.md` disagrees with what the tree actually produces.
//
// Its shape is dictated by two failures this repo already paid for:
//
//   - `prettier --check . && eslint .` reports "failed" identically whether one
//     stage failed or both ran. A stray scratch file short-circuited eslint and
//     hid six real errors for several batches. So: no `&&`. Every stage runs,
//     every result is printed, the exit code is the OR of the failures.
//   - "The gate is only as trustworthy as the tree is quiet" — a scratch file
//     deleted between eslint's enumeration and its read failed the run on a
//     path that no longer existed. So the tree is checked before anything runs.

import { execFileSync } from 'node:child_process';
import { runStage, lastLine } from './lib/run-stage.mjs';

// Scratch patterns. `zz-` is this repo's own convention for a throwaway.
const SCRATCH = /(^|[\\/])(zz-|.*\.scratch\.)/;

function scratchFiles() {
	const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n');
	const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
		encoding: 'utf8'
	}).split('\n');
	return [...tracked, ...untracked].filter((f) => f && SCRATCH.test(f));
}

const scratch = scratchFiles();
if (scratch.length > 0) {
	console.error('verify refuses to run: scratch files in the tree\n');
	for (const f of scratch) console.error(`  ${f}`);
	console.error('\nA batch that leaves these behind has not finished. Remove or rename them.');
	process.exit(1);
}

const stages = [
	runStage('build', 'pnpm', ['-r', 'build']),
	runStage('check', 'pnpm', ['-r', 'check']),
	runStage('lint', 'pnpm', ['-r', 'lint']),
	runStage('test', 'pnpm', ['-r', 'test']),
	runStage('status', 'node', ['scripts/status.mjs', '--full'])
];

// The drift gate. `status.mjs` has just rewritten the file; if that changed
// anything, a committed claim no longer matches the tree.
stages.push(runStage('status drift', 'git', ['diff', '--exit-code', '--', 'port/status.md']));

console.log('\n=== verify ===\n');
for (const s of stages) {
	console.log(`${s.ok ? 'pass' : 'FAIL'}  ${s.name}${s.ok ? '' : ` (exit ${s.code})`}`);
}

const failed = stages.filter((s) => !s.ok);
if (failed.length > 0) {
	for (const s of failed) {
		console.error(`\n--- ${s.name} (exit ${s.code}) ---\n${s.output}`);
	}
	console.error(`\n${failed.length} of ${stages.length} stages failed.`);
	if (failed.some((s) => s.name === 'status drift')) {
		console.error('\nport/status.md is stale. Commit the regenerated file.');
	}
	process.exit(1);
}

console.log(`\nall ${stages.length} stages passed.`);
```

- [ ] **Step 3: Wire `pnpm verify`**

In root `package.json` `scripts`: `"verify": "node scripts/verify.mjs"`.

- [ ] **Step 4: Mutation-check the scratch guard**

```bash
touch packages/core/zz-scratch.mjs
pnpm verify; echo "exit=$?"
rm packages/core/zz-scratch.mjs
```

Expected: refuses to run, lists `packages/core/zz-scratch.mjs`, `exit=1`, and **no stage runs**.

- [ ] **Step 5: Mutation-check the drift gate**

```bash
node scripts/status.mjs --full && git add port/status.md && git commit -m "wip: status baseline"
printf '\n<!-- hand edit -->\n' >> port/status.md
pnpm verify; echo "exit=$?"
git checkout port/status.md
```

Expected: every other stage passes, `status drift` fails, `exit=1`, and the message
`port/status.md is stale. Commit the regenerated file.`

- [ ] **Step 6: Mutation-check the no-`&&` reporting**

```bash
printf 'const x = ;\n' > packages/core/src/lib/zz-broken.ts
pnpm verify 2>&1 | head -20; echo "exit=$?"
rm packages/core/src/lib/zz-broken.ts
```

Expected: the scratch guard catches this one first — which is itself the correct behaviour and
proves the ordering. Then repeat with a non-scratch filename (`packages/core/src/lib/broken.ts`) and
confirm that **`check` and `lint` both report**, rather than the run dying at the first failure.

- [ ] **Step 7: Add it to CI**

In `.github/workflows/ci.yml`, replace the separate build/check/lint/test invocations in the main
job with a single `pnpm verify` step, keeping the existing `changed-scopes` gating that stops a docs
edit paying for the browser suite.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add pnpm verify, and make a stale status.md fail CI

Runs every stage rather than chaining with && — that chaining is what let a
stray scratch file short-circuit eslint and hide six real errors for
several batches, because the gate reports 'failed' identically whether one
stage failed or both ran.

Refuses to start on a scratch file, because the gate is only as
trustworthy as the tree is quiet.

Then regenerates port/status.md and diffs it. A claim that no longer
matches the tree now fails CI instead of surviving three batches.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Root documents enter the lint gate

`pnpm -r lint` runs `prettier --check .` inside each *package*, so nothing has ever checked the repo
root — which is how malformed blocks accumulated in the old `TODO.md` unnoticed.

**Files:**

- Create: `.prettierignore` (root)
- Modify: `package.json`

- [ ] **Step 1: Check whether prettier converges on the new files**

```bash
npx prettier --check port/todo.md port/debts.md port/status.md port/README.md
```

Expected: either clean, or a list of files to format. The old `TODO.md` provably did **not**
converge — continuation paragraphs under a `- [ ]` item re-indented 6 -> 10 -> ... -> 30 spaces on
each pass — so run `--write` twice and diff to confirm the new shapes are stable:

```bash
npx prettier --write port/todo.md port/debts.md && cp port/debts.md /tmp/b
npx prettier --write port/debts.md && diff /tmp/b port/debts.md && echo "CONVERGES"
```

Expected: `CONVERGES`. If not, the offending entry uses a multi-paragraph list item; convert it to a
nested `  - ` bullet, which round-trips.

- [ ] **Step 2: Write `.prettierignore`**

```
node_modules
reference
port/ledger
docs/.svelte-kit
packages/*/dist
```

`port/ledger` is excluded because it is imported history whose prose does not converge today.
`status.md` is **not** excluded: `status.mjs` must emit prettier-clean output, or the generator and
the gate fight each other.

- [ ] **Step 3: Confirm `status.mjs` output is prettier-clean**

```bash
node scripts/status.mjs --full
npx prettier --check port/status.md
```

Expected: clean. If not, adjust the table rendering in `status.mjs` — not `.prettierignore`.

- [ ] **Step 4: Add the root lint script**

In root `package.json`: `"lint:root": "prettier --check port/*.md *.md"`, and add it to `verify.mjs`
as a stage between `lint` and `test`.

- [ ] **Step 5: Mutation-check**

```bash
printf '#  bad   heading\n' >> port/todo.md
pnpm lint:root; echo "exit=$?"
git checkout port/todo.md
```

Expected: `exit=1` naming `port/todo.md`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Put the root documents in the lint gate

pnpm -r lint runs prettier inside each package, so the repo root has never
been checked — which is how malformed blocks accumulated in TODO.md
unnoticed. The ledger stays ignored: it is imported history whose prose
does not converge under prettier --write today.

status.md is deliberately not ignored, so the generator has to emit
prettier-clean output rather than fighting the gate.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: `start-batch` and `close-batch` skills

**Files:**

- Create: `.claude/skills/start-batch/SKILL.md`, `.claude/skills/close-batch/SKILL.md`
- Modify: `port/todo.md` (delete the Pre-flight section, now encoded in `start-batch`)

- [ ] **Step 1: Write `start-batch`**

Create `.claude/skills/start-batch/SKILL.md`:

```markdown
---
name: start-batch
description: Open a batch of porting work — pick the next number, scaffold its ledger entry, and run the pre-flight checks that this port has already paid for skipping. Use before starting any multi-component unit of work.
---

Open a batch for `$ARGUMENTS` (a scope, e.g. `the Table family at 0.4.1`).

## 1. Number it

`ls port/ledger/` — take the next integer. Flat and monotonic; no letters.

## 2. Scaffold the entry

Copy `port/ledger/TEMPLATE.md` to `port/ledger/<NNN>-<slug>.md` and fill the front matter: `batch`,
`title`, `upstream` (the version being ported against), `date`, `units`, `upstream-prs`.

## 3. Pre-flight — create a todo per item and complete them

Every item below is a mistake this port actually made and paid for in rework. The pattern is always
the same: a plan was trusted where the source should have been read, or a cost was estimated from
one dimension when it had several.

- [ ] **Cost the whole import list, not the component directory.** `CodeBlock` was booked at 2,083
      LOC; it also needed `theme/syntax/` (~710 LOC). Read what a component *imports*, then what
      those import, before writing a number down.
- [ ] **Verify `port/research/01`'s description against upstream source.** It is research, not spec,
      and it has been wrong three times. Correct the research file in the same commit.
- [ ] **Check the published dist against the source before wiring the oracle.** The tarball lags.
      Follow the source and record a self-retiring skip; do not port a slice the dist cannot verify.
- [ ] **Decide the responsive and SSR story up front.** Both have been retrofitted and both cost a
      rework.
- [ ] **Name the consumers, and remember the docs site is one.** A component that stops exporting
      its props interface loses its documented types silently.
- [ ] **Check whether the entry is a hook before designing its page or its props.** `params != null`
      is upstream's discriminator; a hook's surface is its signature, not a props table.
- [ ] **Read `port/debts.md` for every unit in scope.** A deliberate divergence already recorded
      there is not a bug to fix.

## 4. Confirm the scope

State the units, the upstream version, and anything the batch deliberately excludes. Then port with
the `port-component` skill, one unit at a time.
```

- [ ] **Step 2: Write `close-batch`**

Create `.claude/skills/close-batch/SKILL.md`:

```markdown
---
name: close-batch
description: Close a batch — run the four audit agents, run the full gate, regenerate status, complete the ledger entry, and promote any lesson that constrains future work into CLAUDE.md or an agent. Use when the last unit of a batch is written.
---

Close the batch in `port/ledger/<NNN>-*.md`.

Do not offer these steps; run them.

## 1. The four audit agents

Run all four, in this order, and record what each returns in the ledger's **What the audits caught**
section:

- `astryx-parity` — drift in both directions, per unit. Anything the port has that upstream does not
  is a defect to remove.
- `astryx-idiom` — for every unit with state, effects, refs or context.
- `astryx-test-parity` — the count is the contract; any dropped case is named with its reason.
- `astryx-surface` — the published API, repo-wide.

The idiom audit alone has caught the `ToggleButton` pressed-target race, `Toast`'s un-`untrack`ed
viewport mutators, and `ComplexSelector` dropping the consumer's `onclick` entirely. Four of the
five findings in batch 020 were pre-existing rather than introduced — which is the argument for
running these on a rewrite and not only on a new port.

## 2. The gate

```sh
pnpm verify
```

Every stage must pass. If `status drift` fails, commit the regenerated `port/status.md`.

## 3. Complete the ledger entry

Fill every section. `Scope`, the per-unit sections, `Oracle bookkeeping` (mode flips, new cases,
`N -> 0` counts) and `What the audits caught` are the record of the work.

## 4. Promote the rules — this is the step that is easy to skip

For each lesson in the entry, ask: **does this constrain future work?**

- **Yes** — move it into `CLAUDE.md` or the relevant `.claude/agents/*.md` **in this same commit**,
  and leave only a pointer in the ledger's `Rules promoted` section.
- **No** — it stays as narrative where it is.

This exists because the port's best content used to strand itself. "Any event a component handles
itself must be destructured out of `$props()` and invoked explicitly, in upstream's documented
order" is a rule for every future port, and it sat at line 1,937 of a 1,951-line file where no agent
would read it.

If nothing was promoted, say so and why. An empty section is a claim, not an omission.

## 5. Record debts opened

Any deliberate divergence this batch introduced goes in `port/debts.md` with a full head — `units`,
`kind` (`upstream-lag` / `deliberate-divergence` / `unported` / `api-divergence`) and `retires` —
and its title is listed in the ledger's `Debts opened`.

## 6. Update the backlog

`port/todo.md`: move the goal forward and refresh `Next`. **Do not write a number** — `status.md`
holds every metric, and it regenerated in step 2.
```

- [ ] **Step 3: Remove the pre-flight from `port/todo.md`**

Delete the Pre-flight section, including its `"Do not offer; just run them"` line — `close-batch`
now runs them.

- [ ] **Step 4: Verify the skills are discoverable**

```bash
ls .claude/skills/
head -4 .claude/skills/start-batch/SKILL.md .claude/skills/close-batch/SKILL.md
```

Expected: three skill directories; both files carry `name:` and `description:` front matter.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Encode the batch lifecycle as start-batch and close-batch

The pre-flight checklist ended with 'Do not offer; just run them' — a
written plea that the four audit agents actually get run. close-batch runs
them, so that line is gone.

close-batch also carries the promotion rule: a lesson that constrains
future work moves into CLAUDE.md or an agent in the same commit, instead
of stranding itself at line 1,937 of a file no agent reads.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: `track-upstream` and `release` skills

**Files:**

- Create: `.claude/skills/track-upstream/SKILL.md`, `.claude/skills/release/SKILL.md`

- [ ] **Step 1: Write `track-upstream`**

Create `.claude/skills/track-upstream/SKILL.md`:

```markdown
---
name: track-upstream
description: Track a new upstream Astryx version — diff the tags, re-pin the exact devDependencies, re-baseline the oracles, retire the skips that no longer apply, and find what was added, removed or renamed. Use when Astryx cuts a release this port should follow.
---

Track upstream `$ARGUMENTS` (a version, e.g. `0.4.2`).

This sequence has been improvised three times (0.2.0, 0.3.0, 0.4.1). Batch 18 records what that
costs: it *"began as 'track 0.3.0' and grew, because four closing audits and a release-readiness
sweep kept finding things older than 0.3.0."* Follow the order.

## 1. Diff the tags

In `reference/astryx-upstream/`:

```sh
git fetch --tags
git diff --stat v<old>..v<new> -- packages/core/src/components
git diff --name-status v<old>..v<new> -- packages/core/src/components | grep -E '^(A|D|R)'
```

Added, deleted and renamed component directories are the batch's scope. Record the counts — they
are what `status.md` will diff against.

## 2. Re-pin, exactly

Every `@astryxdesign/*` devDependency across the workspace moves to the new version, pinned exact —
no `^`. The oracles and the docs content pipeline both read these, so a range makes the ground truth
float.

```sh
git grep -n '"@astryxdesign/' -- '**/package.json'
pnpm install
```

## 3. Re-baseline the class oracle

```sh
pnpm -F @astryx-svelte/core test:parity
```

Mismatches here are expected — they are the diff. Work them with the `astryx-oracle` agent.

## 4. Audit the skip list

Every `skip` entry is a deferral with a reason, and the list cannot rot: a skip that stops matching
fails the run, and so does one that *starts* matching. On a version bump, entries that read
"published dist lags source" often retire themselves. Delete every entry the new tarball has caught
up with rather than carrying it forward.

## 5. Re-derive the token count against the new tag

Do not carry the previous count forward. 0.3.0 removed the `--transition-fast` / `--transition-normal`
pair and the count moved 186 -> 184; the figure "100 / 100 components" survived three batches after
upstream moved to 101.

## 6. Check whether the tarball lags the source

The published dist is ground truth but **can** lag upstream's source — `Icon`'s px -> rem is the
standing example. Follow the source and record a self-retiring skip.

## 7. Close it

This is a batch. Use `close-batch`.
```

- [ ] **Step 2: Write `release`**

Create `.claude/skills/release/SKILL.md`:

```markdown
---
name: release
description: Cut a release — bump every publishable manifest, write the CHANGELOG heading that states the parity target, dry-run the publish workflow, then tag. Use when a version is ready to publish to npm.
---

Release `$ARGUMENTS` (a version, e.g. `0.4.1`).

`.github/workflows/release.yml` owns the mechanics: it fires on `v*`, re-runs the full CI gate
(a tag can be pushed at any commit, including one CI never saw), then publishes with
`pnpm publish -r --access public --provenance --no-git-checks`. It must be pnpm, not npm — only pnpm
rewrites the `workspace:` protocol in the theme peer dependencies to a real range at pack time.

This skill covers what the workflow cannot.

## 1. Bump every publishable manifest

All ten publish together — core, the CLI and eight themes — because every package carries the
version of the upstream Astryx release it ports, so one tag names the whole release.

```sh
pnpm check:publish --version <version>
```

## 2. The version scheme, when it collides

Versions stay in lockstep with the upstream release they port, so a port-local fix takes the next
patch number regardless of whether upstream has used it. **When upstream ships a patch we have
already spent: skip to the next free number and state the parity target in the `CHANGELOG`
heading.** If upstream ships 0.3.1 and we have too, we release 0.3.2 and say it ports 0.3.1. The
machine-readable parity target is the exact `@astryxdesign/*` pin, already in the tree.

## 3. Gate

```sh
pnpm verify
pnpm check:publish --version <version>
```

`check:publish` catches two things publint does not: a package with no README (npm renders a blank
page and nothing else here would notice — all eight themes were once in that state), and a manifest
whose version disagrees with the tag.

## 4. Dry run before the tag

Trigger the release workflow with `workflow_dispatch` and the version as input. It runs the
identical job with `--dry-run`, so a manifest or credential problem surfaces without burning a
version number — which npm does not let you re-use.

Watch for `EOTP`: a classic *Publish* token fails on an account with 2FA enforced for writes, and it
fails at the last possible step, after the full gate has run. `NPM_TOKEN` must be an **Automation**
token or a Granular Access Token with write access to the `@astryx-svelte` scope.

## 5. Tag from a merged `main`

```sh
git tag v<version> && git push origin v<version>
```

That is the step that publishes.
```

- [ ] **Step 3: Verify the front matter parses**

```bash
for f in .claude/skills/*/SKILL.md; do head -4 "$f"; echo "--"; done
```

Expected: five skills, each with `name:` and `description:`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Encode track-upstream and release as skills

Both are sequences this repo has run from memory — the upstream bump three
times, the release once, with another imminent. Batch 18's entry records
what improvising it costs: it 'began as track 0.3.0 and grew, because four
closing audits kept finding things older than 0.3.0'.

release covers only what release.yml cannot: the ten-manifest bump, the
CHANGELOG heading stating the parity target, and the dry run before the
tag, because npm does not let a version number be re-used.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Update the agents, `CLAUDE.md` and `CONTRIBUTING.md`

**Files:**

- Modify: `.claude/agents/astryx-parity.md`, `.claude/agents/astryx-oracle.md`,
  `.claude/agents/astryx-test-parity.md`, `.claude/agents/astryx-idiom.md`,
  `.claude/skills/port-component/SKILL.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
  `.github/ISSUE_TEMPLATE/parity.yml`, `.github/scripts/changed-scopes.mjs`

- [ ] **Step 1: Teach `astryx-parity` to consult the debts file**

In `.claude/agents/astryx-parity.md`, replace the sentence referencing known debts with:

```markdown
**Before reporting drift, grep `port/debts.md`.** Every deliberate divergence in this port is
recorded there with a machine-readable head — `units`, `kind` and `retires`. A finding that matches
an existing entry is not a defect: report it as *already recorded* and name the entry. Re-reporting
a known debt every batch is how a real finding gets lost in the noise.

```sh
grep -n -A3 "^### .*<ComponentName>" port/debts.md
grep -n -B2 "units:.*<ComponentName>" port/debts.md
```
```

- [ ] **Step 2: Point the other agents at the new paths**

`astryx-oracle.md` (3 references), `astryx-test-parity.md` (1) and `astryx-idiom.md` (3) now say
`port/todo.md`, `port/debts.md` or `port/research/06-react-to-svelte-patterns.md` as appropriate.
A skip or a deviation is recorded in **`port/debts.md`**, not the backlog.

- [ ] **Step 3: Rewrite `CLAUDE.md`'s document section**

Replace the `TODO.md` / `PORTED.md` paragraph (lines 25-29) with:

```markdown
**`port/` holds everything about building this port**, and `port/README.md` says where to write
what. The short version: `port/todo.md` is the backlog and stays under 150 lines; `port/status.md`
is **generated** by `scripts/status.mjs` and must never be hand-edited; `port/debts.md` carries
every deliberate divergence with a machine-readable head; `port/ledger/` holds one file per batch;
`port/research/` is frozen upstream analysis — research, not spec, so verify it against source.

**Never write a metric into prose.** Numbers live in `port/status.md` and nowhere else. `pnpm
verify` regenerates it and fails when it differs from what is committed, which is what stopped
"100 / 100" surviving three batches after upstream moved to 101.

Batches open with the `start-batch` skill and close with `close-batch`. `close-batch` runs the four
audit agents and carries the **promotion rule**: a lesson that constrains future work moves into
this file or an agent, in the same commit — not into narrative.
```

Also update the Phase 5 reference at line 76 to `port/todo.md`.

- [ ] **Step 4: Add `pnpm verify` to the Commands block**

In `CLAUDE.md`'s Commands section, above the existing entries:

```sh
pnpm verify        # the gate: every stage runs and all results report, then
                   #   port/status.md is regenerated and diffed. Use this
                   #   rather than chaining build/check/lint/test by hand —
                   #   an && chain reports "failed" identically whether one
                   #   stage failed or both ran, which once hid six errors.
pnpm status        # fast metrics refresh (filesystem + manifests only)
```

- [ ] **Step 5: Update `CONTRIBUTING.md`**

Rewrite the document map (lines 47-52) and the two workflow references (146, 166) to name
`port/todo.md`, `port/ledger/` and `port/debts.md`. Step 6 of the porting workflow becomes:
"**Write it down** — the batch's `port/ledger/` entry for how, `port/todo.md` for what's next,
`port/debts.md` for any deliberate divergence. Never write a number: `pnpm verify` regenerates
`port/status.md`."

- [ ] **Step 6: Update the CI scope map and the issue template**

`.github/scripts/changed-scopes.mjs` lines 56-59: replace the `planning/`, `TODO.md` and `PORTED.md`
entries with a single `['port/', null]`. `.github/ISSUE_TEMPLATE/parity.yml` line 17 points at
`port/debts.md`.

- [ ] **Step 7: Verify no stale path survives anywhere**

```bash
git grep -nE "\bTODO\.md\b|\bPORTED\.md\b|\bUPSTREAM-DIFF\.md\b|\bplanning/" -- ':!CHANGELOG.md' ':!port/ledger'
```

Expected: no output.

- [ ] **Step 8: Run the full gate**

```bash
pnpm verify
```

Expected: every stage passes.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Point the agents and the docs at port/

astryx-parity now greps port/debts.md before reporting drift, so a
deliberate divergence stops being re-reported as a defect every batch.

CLAUDE.md gains the rule the old document set could not enforce: never
write a metric into prose. Numbers live in port/status.md, pnpm verify
regenerates it, and a stale claim fails CI.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Self-review

**Spec coverage.** One folder → Task 1. Four document classes → Tasks 1-4. Debts with heads →
Task 2. Batch lifecycle and ledger template → Tasks 3, 8. Promotion rule → Tasks 3, 8, 10.
Procedure skills → Tasks 8, 9. `status.mjs` two tiers → Task 5. `verify` per-stage reporting,
scratch guard, drift gate → Task 6. Root docs in the lint gate → Task 7. Agent updates → Task 10.
Migration steps 1-6 map onto Tasks 1-9. Success criteria are each checked by a step:
150 lines (4.3), mutation-checked gate (6.4-6.6), one-grep debt query (10.1), 16 root entries (1.7).

**Deviations from the spec, both discovered while planning:**

1. The spec's migration step 1 called the path rewrite mechanical. It touches **330 files and ~393
   occurrences**, so it is a scripted codemod with a `--check` mode, not hand edits.
2. The spec left `status.mjs`'s input format open. It **captures verbatim rather than parsing**, and
   its output must be **clock-free** — otherwise the diff gate fails on every run and means nothing.
   Both are now Global Constraints.

**Type consistency.** `runStage(name, command, args, opts) -> {name, ok, code, output}`,
`stripNondeterminism(text) -> string` and `lastLine(text) -> string` are defined in Task 5 Step 1 and
consumed under those exact names in Task 5 Step 2 and Task 6 Step 2. The four `kind` values are
identical in Task 2 (Step 3, Step 4 validator), Task 8 (`close-batch` step 5) and Task 10 (Step 1).
The ledger front-matter keys are identical in Task 3's template and Task 8's `start-batch`.
