---
seq: 27
title: Upstream 0.4.1 — CI, test infrastructure, and ThemeConfig.extends
upstream: 0.4.1
units: []
upstream-prs: []
---

## Scope

General 0.4.1-era infrastructure work that is not specific to any single component or family: the CI
job split (`.github/scripts/changed-scopes.mjs`), the client vitest project's port-binding fix, the
`beforeAll` pointer-park hardening, `ThemeConfig.extends` landing, and the `git checkout -- '*'`
data-loss incident and the rules it produced. `port/ledger/_inbox.md` staged this under a second,
differently-scoped "Batch 11" heading ("upstream 0.4.1 port findings") — a label that otherwise names
`012-batch-11.md` (Markdown/Table core). None of this content is Markdown/Table work, nor is it
specific to `025-input-family.md` or `026-selector-family.md`, where it was filed before this file
existed; it moved here to stop a CI redesign and a data-loss incident from being buried inside a
component-family entry.

## What the audits caught

- [ ] **The class oracle cannot see a focus ring that stopped being applied.** Migrating 36 modules
      onto the shared `utils/focus-outline.stylex.ts` meant deleting each local ring declaration and
      wrapping the call site instead. Deleting the declaration and _forgetting the wrap_ produces
      **zero mismatches**: object-mode diffing compares the declarations a module makes, and the ring
      now arrives from a different module entirely, so its absence at the call site is not a
      difference the oracle is looking at. **16 modules silently lost their ring**, and they were
      found by grepping every stripped module for a `focusOutline` reference — not by the gate that
      exists to catch exactly this. The CSS oracle is blind for the same reason: the rule is still in
      the sheet, nothing references it. Generalised, **both oracles prove what a module _declares_,
      never what an element _receives_**, so any refactor that moves a declaration across a module
      boundary leaves the gate green by construction. Worth a third check that resolves call sites,
      or at minimum a rule that a style key deleted in the same commit as a shared-module adoption
      must appear as a wrap somewhere
- [x] **`ThemeConfig` has no `extends`, where upstream's does.** ~~Nothing in the port is _wrong_
      today because no shipped theme uses it; the debt is that a downstream consumer writing an
      upstream-shaped theme config gets a silently ignored key.~~ **Ported.** The framing above was
      too generous by one step: the CLI's shipped `assets/docs/theme.doc.mjs` was already
      documenting `extends` — upstream's prose carried over verbatim, down to the worked example —
      so this was not a key a consumer might reasonably not know about, it was **a documented
      feature that did nothing**. Merges tokens, components, icons and indicators with the base at
      lowest precedence and the child's `name` always winning, which is upstream's set; `syntax`
      inherits through `resolvedTokens` and the on-media maps are resolved unconditionally, so
      neither needs a branch. The one translation that mattered: the pre-seed reads
      `base.resolvedTokens`, not `base.tokens`, because upstream has one token map where this port
      has two — seeding the raw map would inherit only what the base's author typed by hand and
      drop every generated token. All 9 upstream cases ported plus one for indicators, which
      upstream merges without covering
- [x] **The client vitest project could not be executed for any of the 0.4.1 batch.** ~~Its browser
      server fails to bind with `EACCES: permission denied ::1:<port>` in this environment.~~
      **Resolved, and the recorded diagnosis was wrong in a way worth keeping.** It was called
      environmental, which suggested nothing could be done about it locally. The real cause is
      specific and fixable: vitest's browser server binds **63315** by default and Windows reserves
      TCP blocks for Hyper-V — `netsh interface ipv4 show excludedportrange protocol=tcp` reports
      `63271–63370` here. Vite retries `EADDRINUSE` and **not** `EACCES`, so the run dies before
      Chromium launches and reports "no tests" rather than anything naming a port.
      `VITEST_BROWSER_PORT` overrides it; the suite then runs 163/163 files, 4,510 cases. The
      generalisable part: **"environmental" is a diagnosis that stops investigation**, and this one
      survived disabling the sandbox — which should have been the clue that the assumed cause was
      not the cause
- [ ] **A failed hover in `beforeAll` costs a whole chunk, and did so only on CI.**
      `setup-stylex.ts` parks the real pointer in a corner so hover state cannot leak between files.
      On CI that hover hit Playwright's `element is outside of the viewport` and retried to the
      **30 s actionability timeout — once per file, in `beforeAll`**, so all 12 files of chunk 1
      died and reported with nothing named but the setup file. It passed locally every time. Two
      things were wrong independent of which environment difference triggered it: the corner is
      `position: fixed`, so a scrolled frame maps it outside the *top-level* viewport that
      Playwright checks against (the note there already reasoned about frame *height* and missed
      scroll offset), and **a hygiene step was allowed to fail a suite**. Now scrolls to top first
      and is best-effort with a 2 s bound, warning rather than failing. The rule: a setup step that
      is not an assertion must not be able to take the file down with it
- [ ] **CI ran everything for every change.** A full run is ~13 minutes — 409 s of tests, 190 s of
      type-aware lint, 76 s of build — and a `docs/`-only edit paid all of it. Split into `lib`,
      `client` and `docs` jobs behind a `changes` job that classifies the diff
      (`.github/scripts/changed-scopes.mjs`). Two properties are the point and should survive any
      later tidying: the classifier is **deny-by-default**, so a path it does not recognise sets
      `global` and runs every job (a skip-list would fail silently green instead); and the jobs
      select packages by **exclusion** (`--filter='!docs'`) rather than by naming them, so a package
      added later is covered by construction instead of going untested until someone edits the
      workflow. The always-running `ci` job exists so a *skipped* job cannot leave a required status
      pending forever
- [ ] **`git checkout -- '*'` destroyed every uncommitted tracked file in the worktree, across
      every concurrent workstream.** It was written inside a cleanup script as an intended no-op
      guard. It is not a no-op: git expands the pathspec against the **whole index**, not against
      the caller's own edits, and it has no concept of which workstream authored a change. Unstaged
      changes have no reflog, so nothing was recoverable — every affected agent had to retype from
      memory, and one commit's worth of work (`format-instant.ts`) was caught only because a
      follow-up read happened to show pre-edit content. **The revert is silent**: a reverted file
      looks untouched rather than broken, so "it still compiles" and "the oracle is green" are both
      worthless as evidence that an edit survived. Three rules came out of it, and the third is the
      one that generalises: a script that reverts files must **enumerate** them, never glob; the
      blast radius of `git checkout --` is every workstream sharing the checkout, not the one
      running it; and **the safe primitive for scoping work back to your own files is to rewrite
      the files you own, never to revert the ones you do not.** Untracked files survived, which is
      the only reason new modules (`panel-search-input.*`, new fixtures, new suites) came through
      intact — an accident of the mechanism, not a safeguard

## Rules promoted

Not promoted at the time — the port-binding fix and CI split are real infrastructure changes of this
era, but no specific CLAUDE.md passage was confidently traced back to them.

## Debts opened

-
