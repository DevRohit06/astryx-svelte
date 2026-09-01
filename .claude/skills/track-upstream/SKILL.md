---
name: track-upstream
description: Track a new upstream Astryx version — diff the tags, re-pin the exact devDependencies, re-baseline the oracles, retire the skips that no longer apply, and find what was added, removed or renamed. Use when Astryx cuts a release this port should follow.
---

Track upstream `$ARGUMENTS` (a version, e.g. `0.4.2`).

This sequence has been improvised three times (0.2.0, 0.3.0, 0.4.1). Batch 18 records what that
costs: it _"began as 'track 0.3.0' and grew, because four closing audits and a release-readiness
sweep kept finding things older than 0.3.0."_ Follow the order.

## 1. Diff the tags

In `reference/astryx-upstream/`:

```sh
git fetch --tags
git diff --stat v<old>..v<new> -- packages/core/src
git diff --name-status v<old>..v<new> -- packages/core/src | grep -E '^(A|D|R)'
```

**Then re-do the rename the checkout just undid**, before reading anything in that tree:

```sh
mv -f reference/astryx-upstream/CLAUDE.md reference/astryx-upstream/UPSTREAM-CLAUDE.md
```

`CLAUDE.md` is tracked upstream, so every pull and every tag checkout restores it, and while it is
there any read in that tree loads Meta's instructions for _their_ repo as instructions for this one.
The 0.5.2 pull restored it and it went unnoticed for a batch. `status.mjs` now fails the gate on it,
so the cost of forgetting is a failed gate rather than a poisoned context — but the gate runs at the
_end_, and this step is at the start for a reason.

Component directories live directly under `packages/core/src/<PascalCase>/` — there is no
`components/` subdirectory. The same tree also holds five lowercase infrastructure directories
(`hooks/`, `i18n/`, `theme/`, `utils/`, `__tests__/`) and loose top-level files (`index.ts`,
`naming.ts`, `reset.css`); their changes show up in the same diff and are not component churn.
Added, deleted and renamed **component** directories (the PascalCase entries) are the batch's
scope. Record the counts — they are what `status.md` will diff against.

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

Every `skip` entry (and `inlineSkip`, and the whole-module `ABSENT_UPSTREAM` list) in
`packages/core/scripts/compare-upstream-classes.mjs` is a deferral with a reason, and the list
cannot rot: a skip that stops matching fails the run, and so does one that _starts_ matching. On a
version bump, entries that read "published dist lags source" often retire themselves. Delete every
entry the new tarball has caught up with rather than carrying it forward.

## 5. Re-derive the token count against the new tag

Do not carry the previous count forward. 0.3.0 removed the `--transition-fast` / `--transition-normal`
pair and the count moved 186 -> 184; the figure "100 / 100 components" survived three batches after
upstream moved to 101.

## 5b. Diff the **test** delta, and treat it as scope

```sh
git diff --stat v<old>..v<new> -- 'packages/core/src/**/*.test.tsx' 'packages/core/src/**/*.test.ts'
git diff --name-status v<old>..v<new> -- packages/core/src | grep -E '^A.*test'
```

A release's new cases are part of what it ships, not a follow-up. 0.4.2 added ~90 across the
changed suites and the batch ported 21; the closing audits then found the two Layer defects that
upstream's own unported `describe('context hosting')` block was written to catch, and the batch's
headline change (`THUMB_INSET`) had shipped with no coverage at all while the ledger described it
as transcribed and routed. **An added test _file_ is the loudest signal** — `useMenuHover.test.tsx`
arrived new with 21 cases for a hook this port rewrote from scratch in the same batch, and nothing
flagged that no suite existed on this side.

Then **run `node scripts/status.mjs` and read the case delta**. Since batch 041 the shortfall is
derived from the `PORTS:` markers rather than restated in each header, so the bump's real cost
appears in one table instead of having to be re-typed 283 times — and a suite upstream renamed or
deleted fails the run outright, because some file is still declaring it. Four headers were false
at 0.4.2 for want of this — `side-nav` ("all 99 … at v0.3.0"), `layer` ("all twenty-nine"),
`slider` ("32 … nothing dropped", never true of any tag) and `hover-card` — and each one made a
real gap look accounted for. A **new** upstream suite still needs a decision from you: a file that
ports it, or a `NO_TEST_COUNTERPART` entry with the reason.

## 6. Check whether the tarball lags the source

The published dist is ground truth but **can** lag upstream's source — `Icon`'s px -> rem is the
standing example. Follow the source and record a self-retiring skip.

## 7. Close it

This is a batch. Use `close-batch`.
