---
seq: 0
title: Retired debts with no identifiable owning batch
units: []
upstream-prs: []
---

## Scope

Not a batch — a holding file for `port/debts.md` groups that `port/ledger/_inbox.md` staged as
retired or resolved, where the debt's own content gives no reliable signal about which numbered batch
opened it. `Task 3`'s brief asked for exactly this: "where no batch is identifiable, create
`port/ledger/000-pre-ledger-retired.md` for them and say so in your report." One group landed here:
"Retired — Published surface", covering the package's published-exports surface (the `./theme` tokens
path, `exports["."]`'s missing `default` condition, and `sideEffects` being narrower than upstream's).
These are repo-wide publishing concerns rather than the output of any single component batch, and none
of the three entries names a batch or cites a date that would place it.

## What the audits caught

### Retired — Published surface

- [ ] **No public path to the tokens.** Upstream ships `./theme/tokens.stylex` and `./theme/tokens`; ours live at `lib/styles/tokens.stylex.ts` and are exported from no barrel and no subpath. Authoring `stylex.create` against Astryx tokens is the documented consumer pattern _and the property this whole port rests on_, so this is the most consequential single gap in the published surface — and it is not covered by the per-component-subpath item above
  - Retired by: `theme/index.ts` now re-exports `colorVars`/`spacingVars`/`sizeVars`/… (the
    `stylex.create`-authoring vars) from `../styles/tokens.stylex.js`, reachable via
    `@astryx-svelte/core/theme` — the documented consumer pattern (author `stylex.create` against
    Astryx tokens) is achievable today, even though the subpath is `./theme` rather than a
    dedicated `./theme/tokens`.

- [ ] **`exports["."]` has no `default` condition** — every other subpath we ship does. A resolver that doesn't set the `svelte` condition (plain Node, a CLI, a tool consuming the pure-JS `utils`/`hooks`/`naming` re-exports) gets `ERR_PACKAGE_PATH_NOT_EXPORTED` for the package root. publint does not flag it
  - Retired by: `packages/core/package.json`'s `exports["."]` now carries a `"default"` condition
    (`"default": "./dist/index.js"`).

- [ ] **`sideEffects` is narrower than upstream's.** Ours lists `**/*.css`; upstream also lists `**/*.stylex.ts`, `**/*.stylex.js` and `**/componentStyles.ts`. Our `dist/` ships ~118 _uncompiled_ `*.stylex.js` modules for the consumer's StyleX plugin to compile, and upstream marks them side-effectful so a bundler cannot tree-shake a style module and drop its CSS. No concrete drop was reproduced (most are reached through an exported `*Attrs` function), but `styles/tokens.stylex.js` — a `defineVars` declaration module — is the shape most at risk
  - Retired by: `packages/core/package.json`'s `sideEffects` now lists `**/*.stylex.ts` and
    `**/*.stylex.js` alongside `**/*.css`, matching upstream. Only `**/componentStyles.ts` remains
    absent, a pattern that matches no file in this port's `.stylex.ts` naming convention.


## Rules promoted

Not promoted at the time.

## Debts opened

-
