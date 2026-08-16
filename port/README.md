# port/

Everything about _building_ this port. Consumer-facing documents (`README.md`, `CHANGELOG.md`,
`CONTRIBUTING.md`) stay at the repo root, and so does `CLAUDE.md`, which Claude Code auto-loads
from there.

| File               | What goes in it                                                      |
| ------------------ | -------------------------------------------------------------------- |
| `todo.md`          | The current goal and the next few items. Nothing landed, no metrics. |
| `status.md`        | **Generated.** Every countable claim. Never edit by hand.            |
| `debts.md`         | Deliberate deviations from upstream, one entry each.                 |
| `ledger/`          | One file per batch — how the work was actually done.                 |
| `research/`        | Frozen upstream analysis. Research, not spec: verify against source. |
| `design/`          | Design docs and their implementation plans.                          |
| `upstream-diff.md` | The standing upstream-versus-port comparison.                        |

## Where do I write this?

- **A number** — nowhere. Run `node scripts/status.mjs` and it appears in `status.md`.
- **A deliberate divergence from upstream** — `debts.md`, with a machine-readable head.
- **How a component was built** — the current batch's `ledger/` entry.
- **A rule that constrains future work** — `CLAUDE.md` or the relevant `.claude/agents/*.md`.
  The ledger keeps only a pointer. This is the promotion rule, and `close-batch` enforces it.
- **What to do next** — `todo.md`. Keep it a readable backlog — cut what's landed on sight, but
  never cut open work just to hit a line count; a shorter file that hides a still-open item is
  worse than a longer one that doesn't.
