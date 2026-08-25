---
seq: 036
title: Batch 36 — every ported name assertion, at upstream's strength
upstream: 0.5.0
date: 2026-08-25
units: [src/tests (client project)]
upstream-prs: []
---

## Scope

The one axis `port/status.md` measures that has never moved: every ported `getByRole` /
`getByLabelText` assertion that passes a string `name` without `exact: true`.

Testing Library matches an accessible name as a **whole string**. The browser project's locators are
Playwright's, where a string `name` is a case-insensitive **substring**. So a case transcribed
faithfully from upstream is, here, strictly *weaker* than the one it ports: it admits names
upstream's assertion would reject. The count is not a style metric — it is the number of assertions
in this port that cannot fail for a reason upstream's would catch.

`VisuallyHidden` is the standing proof. Its icon-only-control case still passed with the icon's
`aria-hidden` removed and the accessible name reading `'Trash Delete'` instead of `'Delete'`,
because `'Delete'` is a substring of `'Trash Delete'`. One `exact: true` turned it back into the
assertion it was ported to be.

`port/debts.md` records this with a retirement condition that is exactly the count reaching zero.

## Why the failures are the point

Adding `exact: true` to an assertion that was passing on a substring makes it fail — and every one
of those failures is a finding about **this port's accessible name**, not about the test. That is
the entire value of the sweep, and it is why it cannot be done by a codemod that reverts anything
that goes red.

A regex `name` is substring-matching on both sides by construction and is left alone.

## Units

Six agents over 78 files, partitioned so no two shared a file. Roughly nine hundred sites, and the
count `port/status.md` measures is now **zero**.

## Findings

### Nothing went red, and that is a result rather than an anticlimax

The sweep was commissioned expecting failures: an assertion that had been passing on a substring
should fail once it has to match the whole name, and each such failure would be a finding about this
port's rendered accessible name. None appeared. At every site, what this port renders is
byte-identical to what upstream asserts — not merely a superstring of it.

A clean sweep is worth exactly nothing on its own, though, because it is indistinguishable from a
sweep whose option was silently ignored. Every agent was asked to prove otherwise and every one did,
independently:

- **Mutation.** Shorten a name to a strict substring of the real one and confirm the case fails.
  Done in five groups, on both `getByRole` and `getByLabelText`.
- **The inverse mutation**, which is the sharper one: with `exact: true` *removed*, the same
  shortened strings **pass**. That is the hazard demonstrated live rather than argued.
- **The runner's own source**, `I(t.name, t.exact ?? Z.options.exact)`, and
  `@vitest/browser`'s `locators.d.ts` declaring `exact?: boolean` on `ByRoleOptions`.

### The check a green sweep structurally cannot make

`exact: true` cannot catch a *shortened* string that this port also renders short — the assertion
would pass while upstream's still failed. So every agent diffed its strengthened literals against
the upstream suite named in each file's header. Every string matched verbatim, including the awkward
ones: `'Sort by Name, sorted ascending, priority 1 of 2'`, `'Trier par Age, tri décroissant,
priorité 2 sur 2'`, `'Ada Lovelace, profile photo, Online'`, `` `Status: ${variant}` ``.

One string had no upstream counterpart — `typeahead`'s `'Sibling'` — and it is not a slip: upstream
builds that node with `document.createElement('button')` and never names it, so there is no string
to restore. The assertion it carries is upstream's.

### Upstream does not use Testing Library here, and that settles the question

`Calendar` and `DateTimeInput` upstream go through a shared helper,
`__tests__/fastRoleQueries.ts`, whose predicate is
`typeof name === 'string' ? accessibleName === name : name.test(accessibleName)`. Strict
whole-string equality for a string, regex semantics for a regex. That is the contract this sweep
restores, stated in upstream's own source rather than inferred from Testing Library's defaults —
and it is why a regex `name` is correctly left alone, and why `calendar.svelte.test.ts`'s deliberate
`exact: false` is faithful rather than a straggler: upstream matches day cells with a regex there,
because the selection cases append `', selected'` to the name.

## Oracle bookkeeping

Untouched, and untouchable by this work — nothing here changed a style module. Third batch running
where the fidelity oracles are silent and the suites are the only instrument.

## What the audits caught

**A second counter that counted its own documentation.** `status.mjs`'s assertion-strength figure
read three weak sites in `timestamp.svelte.test.ts` that no edit could ever have removed: all three
were prose in its header and an inline comment, explaining that
`getByRole('button', {name: 'Copied'})` reads the aria-label. Six such matches existed across the
tree, and the metric could not have reached zero while any header discussed the idiom it measures.

This is the same failure the case counter had earlier in this session with a backtick-quoted `it`,
in the same file, found the same way — a figure that would not move. The rule is now stated once in
`status.mjs` where both fixes live: **a metric over source has to skip prose, because the file most
likely to discuss a construct is the file that uses it most carefully.** The counter now drops
whole-line comments before matching, and the zero it reports was checked by hand: six remaining
matches, all six in comments, none in code.

**`getByText` has the identical weakness and a larger surface.** Testing Library matches the whole
normalised string; Playwright matches a case-insensitive substring. Two suites already apply
`{exact: true}` there and document why; the rest do not. Rather than record that as a remark, it is
now a **second row in the assertion-strength table** — 605 sites across 81 files — because this
port's own rule is that a gap belongs in a number and not in prose. Closing it is its own sweep.

## Rules promoted

- `scripts/status.mjs` — comment-stripping before counting, with the two-occurrence reasoning stated
  beside it. Not duplicated into `CLAUDE.md`: the rule constrains whoever writes the next counter,
  and that person is reading this file.

## Debts opened

None opened. One **retired**: ported `getByRole` name assertions are substring matches where
upstream's are whole-string — open since the browser project existed, with a retirement condition
that was exactly this count reaching zero.
