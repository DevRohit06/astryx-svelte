---
seq: 034
title: Batch 34 — the theme CSS API, aligned to upstream's shape
upstream: 0.5.0
date: 2026-08-25
units: [generateThemeRules, generateThemeCSS, generateOnMediaCSS, Theme, ThemeCSSOutput]
upstream-prs: []
---

## Scope

The unit batch 033 scoped out, and the one `port/debts.md` had been asking for since batch 030:
close the `generateThemeCSS` API divergence, and with it the largest single unported upstream
suite, `theme/generateThemeRules.test.ts`.

Upstream publishes `generateThemeRules(theme): string[]` and a `generateThemeCSS(theme)` that
returns `{prose, component}` — two `@scope` blocks with **no** layer wrappers, leaving each caller
to decide which layer each block belongs in. This port published neither: it had
`generateThemeRulesSplit`, and a `generateThemeCss` returning one string with the
`@layer reset` / `@layer astryx-theme` wrappers and a generated-file header already applied.

## The estimate that was wrong

Batch 033 recorded this as a re-architecture rather than an added export, reasoning that upstream
*derives* the split from the flat list by testing each rule for a leading `:where(` while this port
generates the two groups separately — so the flat list would have to become the source, in
upstream's rule order and with upstream's indentation.

Running the generator disproved it in one command. **Every** rule this port groups as `prose`
starts with `:where(`; **no** rule it groups as `component` does; and the size overrides already
fall after the themed type rules they have to beat on source order, which is the one ordering
assertion the suite makes. Upstream's derivation and this port's grouping agree exactly, so
`generateThemeRules` is `[...component, ...prose]` and nothing had to move.

Reading the suite corrected the second half of the estimate too. Its cases assert on **content** —
`toContain`, and `rules.find(r => r.includes(...))` — not on whitespace or array index, so
upstream's literal indentation was never a requirement. What *is* a requirement, and was missed by
reading only the implementations, is that every string `generateThemeRules` returns must appear
**verbatim** inside `prose + component`. That fixes one thing: the blocks may not re-indent when
they wrap. Upstream's doesn't, and neither does this one.

The lesson is the cheap one: the estimate was derived from reading two implementations against each
other, and both of its claims fell to a single probe and a single read of the suite that defines
the contract. `debts.md` now records the correction beside the original.

## What the alignment actually cost

Far less than the entry predicted, because **every existing caller reaches the generator by deep
path** — the test files through `$lib/theme/generate-theme-rules.js`, the theme build scripts and
the docs build through `core/dist/theme/generate-theme-rules.js`. None of them goes through the
`./theme` barrel, and the `exports` map has no wildcard subpath, so the deep path is not published.

So `generateThemeCss` — the layered, headered document that `<Theme>`, both theme build scripts and
the docs build were built around — simply stays where it is and comes **off the public barrel**.
The published surface becomes upstream's exactly; the build path keeps the single generator that
stops a built stylesheet and the runtime drifting apart. The twenty-odd caller rewrites the debt
anticipated never happened.

Two names lose their drift in the same change: `generateOnMediaCss` -> `generateOnMediaCSS`, which
`port/debts.md` had recorded under the 0.4.5 surface entry.

The rename, not the shape change, is what actually reached callers — four files, all found by the
gate rather than by grep: two core test suites that import the function directly, and the CLI's
`theme build` plus its own suite, which captures core's generator at module load and mocks it. The
CLI pair is worth noting because `pnpm -F @astryx-svelte/core check` was clean while
`pnpm -r check` was not: core typechecks against its own sources, and the CLI typechecks against
core's built `dist/`, so a rename that crosses the package boundary is invisible until the
recursive run. The CLI's mock failed in the other direction again — `vi.fn(actual.generateOnMediaCss)`
on a renamed export wraps `undefined` and the "nothing to build" branch stops behaving, which is a
test failing for the right reason.

## `<Theme>` now injects one `<style>` per layer

This is the half of the divergence the debt did not record until batch 033 found it, and the only
DOM-observable one. Upstream's `<Theme>` writes **two** `<style>` elements — `data-astryx-theme-prose`
carrying `@layer reset`, `data-astryx-theme` carrying `@layer astryx-theme` — so the two halves land
in different layers. This port wrote one tag containing both wrappers, and a consumer or test
selecting `style[data-astryx-theme-prose]` found nothing.

**Neither side covers this.** Upstream's `Theme.test.tsx` has no style-injection assertion, and
this port's `theme.svelte.test.ts` asserts only on the wrapper `div` and the `<html>` attributes.
So the change was verified against a throwaway probe rather than shipped on a passing suite that
never looked at it: two tags, the right markers, `@layer reset {` and `@layer astryx-theme {`
respectively, and the `@scope` selector inside the component half. The probe was deleted rather
than committed — it pins upstream's own behaviour rather than a Svelte-specific hazard, which is
not the bar this port sets for coverage beyond upstream. Recorded here so the gap is known rather
than merely absent.

## What the audits caught

**Batch 033's counting fix was half a fix, and the port of this suite is what found it.** That
batch stopped `scripts/status.mjs` reading a bare `it` followed by a backtick as a declaration,
because a backtick-quoted `it` in prose is exactly that. But `it.each` and `it.for` genuinely are
tagged templates, so the second alternative of the regex still has to accept a backtick after
them — and a backtick-quoted `it.each` in a header therefore matched all over again, by the same
mechanism, through the door the fix had to leave open. The agent porting this suite watched its own
header derive 45 against a real 44 and reported it rather than adjusting the number.

The lookbehind now rejects a preceding backtick as well: in code nothing precedes `it` with one,
and in prose that is precisely what does. Measured across both trees, upstream's total is
unchanged — so no figure in `status.md` moves — while **43 phantom matches disappear from 26 files
under `src/tests/`**, which is the number a port uses to check its own header against the contract
it states.

Two records were stale by the time the port landed, both flagged rather than silently left: the
`generateThemeCss` debt still said "the suite is deliberately left unported rather than partially
ported", and `todo.md` still named it as one of two blocked fronts. Both are corrected here.

## Rules promoted

- `scripts/status.mjs` — the lookbehind fix and its reasoning live in the file itself, beside the
  fix it completes, rather than in `CLAUDE.md`. The rule a human needs was already promoted in
  batch 033 ("if a derived count looks implausible, check the header's prose before the code");
  this is the same rule, and restating it would add a second copy to keep in sync.

No new lesson reached `CLAUDE.md` or an agent file. The one this batch would have promoted —
*measure before you estimate a port from reading two implementations* — is recorded where it will
actually be read: in `port/debts.md`, beside the estimate it corrects, and in `todo.md`'s front 1.
An entry in `CLAUDE.md` saying "measure first" would be true, unactionable and unfalsifiable.

## Debts opened

None. One **retired**: `generateThemeCss` returns a flat stylesheet where upstream returns two
blocks — open since batch 030, and the entry that asked for this batch. One amended: the `0.4.5`
surface entry loses the `generateThemeCss`/`generateOnMediaCss` half of its name-drift condition,
keeping `ThemeConfig`/`ComponentOverrides`.
