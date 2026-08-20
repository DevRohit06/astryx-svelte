---
seq: 030
title: Batch 30 — the theme conformance suites
upstream: 0.4.5
date: 2026-08-20
units:
  [
    theme/expand-radius-scale,
    theme/expand-motion-scale,
    theme/expand-type-scale,
    theme/tokens,
    theme/on-media-tokens,
    theme/generate-theme-rules,
    theme/derived-var-registry,
    theme/theming-targets,
    theme/extensible-axes
  ]
upstream-prs: []
---

## Scope

First slice of front 1 (the test delta) under the full-parity goal set in `port/todo.md`. The nine
`theme/` suites upstream ships that `status.md` counted as unported, and the split of
`src/tests/theme.test.ts` that makes their counts verifiable.

Nothing outside `packages/core/src/lib/theme/` and `packages/core/src/tests/` is in scope. The
`./theme` barrel renames the suites will press on are front 2's work and are recorded in
`debts.md`; where a ported case cannot pass without one, the rename lands here and the debt retires.

_(in progress)_
