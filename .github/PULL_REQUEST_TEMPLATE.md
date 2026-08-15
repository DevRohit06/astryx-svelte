<!--
Thanks for sending this. A couple of things make a port PR land first time —
see CONTRIBUTING.md for the full loop. Delete anything below that doesn't
apply (a docs fix has no upstream source to cite; a CLI change has no
component to name), but don't delete the checklist.
-->

## What this changes

<!-- One thing: a component port, a batch of page templates, a docs fix, a tooling change.
     If it's more than one, it's probably two PRs. -->

## What upstream says

<!-- The parity rule is "if it's not in Astryx, it's not here" — so say what you read and where:
     a path in reference/astryx-upstream/, a .doc.mjs, an upstream test, the compiled dist/, or a
     page on astryx.atmeta.com. If this PR doesn't touch ported surface (CI, scripts, docs
     prose), say n/a. -->

## Judgement calls

<!-- Anywhere React has no Svelte counterpart and you had to decide something — a ReactNode prop
     becoming a Snippet, a hook's return shape, a substituted icon — name it here. A PR that names
     its judgement calls is far quicker to review than one that hides them. "None" is a fine
     answer if this is a mechanical change. -->

## Checklist

- [ ] `pnpm verify` is green (or `pnpm verify --fast` locally, with a note on why the full run
      wasn't feasible)
- [ ] No invented props, extra variants, nicer defaults, or hand-drawn demo/example content —
      the parity rule applies to demo routes and template content too
- [ ] `port/todo.md` reflects what changed, `port/ledger/` has this batch's entry (if this is a
      port), and any deliberate divergence is recorded in `port/debts.md` with a machine-readable
      head
- [ ] No number was hand-written where `port/status.md` already tracks it
