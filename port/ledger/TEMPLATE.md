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
