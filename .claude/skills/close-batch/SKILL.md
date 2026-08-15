---
name: close-batch
description: Close a batch — run the four audit agents, run the full gate, complete the ledger entry, and promote any lesson that constrains future work into CLAUDE.md or an agent. Use when the last unit of a batch is written.
---

Close the batch in `port/ledger/<NNN>-*.md`.

Do not offer these steps; run them.

## 1. The four audit agents

Run all four, in this order, and record what each returns in the ledger entry's **What the audits
caught** section:

- `astryx-parity` — drift in both directions, per unit. Anything the port has that upstream does not
  is a defect to remove.
- `astryx-idiom` — for every unit with state, effects, refs or context.
- `astryx-test-parity` — the count is the contract; any dropped case is named with its reason.
- `astryx-surface` — the published API, repo-wide.

These have caught real bugs, not style. The idiom audit alone found the `ToggleButton` pressed-target
race (a non-reactive local captured the pre-click target, but `optimistic.run` flips the override
before it awaits, so a live re-read would have handed the wrong value to `pressedChangeAction`) and
`ToastViewport` reading `toasts` un-`untrack`ed while producing the next value — now the documented
`untrack` in `port/debts.md`. **A rewrite needs these passes as much as a fresh port does.**
`port/ledger/026-selector-family.md` ran both after the Selector family was already written and found
five things, four of them pre-existing rather than introduced by the rewrite — `ComplexSelector`
silently discarding a consumer's `onclick` (`{...rest}` beside an explicit handler is one object
literal; last key wins), `Selector`'s trigger spread sitting before `id`/`type`/`role` where upstream
puts it after, a stale test harness the rewrite had turned into a coincidence, and a mode flip's third
call site. None of the four would have been found by re-reading the diff of what changed.

## 2. The gate

```sh
pnpm verify
```

Every stage must pass. If `status drift` fails, commit the regenerated `port/status.md`.

## 3. Complete the ledger entry

Fill every section of `port/ledger/<NNN>-*.md` against `port/ledger/TEMPLATE.md`'s shape: `Scope`, one
section per unit, `Oracle bookkeeping` (mode flips, new cases, `N -> 0` mismatch counts) and `What the
audits caught` (step 1's findings, verbatim) are the record of the work.

## 4. Promote the rules — this is the step that is easy to skip

For each lesson in the entry, ask: **does this constrain future work?**

- **Yes** — move it into `CLAUDE.md` or the relevant `.claude/agents/*.md` **in this same commit**,
  and leave only a pointer in the ledger's `Rules promoted` section.
- **No** — it stays as narrative where it is.

This exists because the port's best content used to strand itself, and it has already happened once.
`port/ledger/026-selector-family.md` found `ComplexSelector` silently discarding a consumer's
`onclick` and fixed it with a rule pulled from `port/research/06-react-to-svelte-patterns.md:1191` —
a 1,463-line research file nothing points an agent at unless it already knows to look. That ledger
entry's own `Rules promoted` section first read "**Not promoted at the time.**" — this step didn't
run. It has since been promoted: "any event a component handles itself must be destructured out of
`$props()` and invoked explicitly, in upstream's documented order" now lives in `CLAUDE.md:171-174`,
and `026`'s `Rules promoted` section points back to it as the incident that motivated it. That is
what this step buys — do it, and the next agent that hits this shape of bug finds the rule in
`CLAUDE.md`, not buried in a research file.

If nothing was promoted, say so and why in the ledger's `Rules promoted` section. An empty section is
a claim, not an omission.

## 5. Record debts opened

Any deliberate divergence this batch introduced goes in `port/debts.md` with a full head — `units`,
`kind` (`upstream-lag` / `deliberate-divergence` / `unported` / `api-divergence`) and `retires` — and
its title is listed in the ledger's `Debts opened` section. `-` if none.

## 6. Update the backlog

`port/todo.md`: move the goal forward and refresh `Next`. **Do not write a number** — `port/status.md`
holds every metric, and it regenerated in step 2.
