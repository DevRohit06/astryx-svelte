---
seq: 031
title: Batch 31 — the test delta, fanned out
upstream: 0.4.5
date: 2026-08-21
units:
  [
    Stack,
    StackItem,
    HStack,
    VStack,
    Grid,
    FieldStatus,
    AspectRatio,
    EmptyState,
    Card,
    Skeleton,
    Indicator,
    indicatorRegistry,
    StatusDot,
    Badge,
    Kbd,
    Blockquote,
    Code,
    IconButton,
    VisuallyHidden,
    NavIcon,
    Layout,
    LayoutSlots,
    ChatComposer,
    ChatComposerDrawer,
    MobileNavToggle,
    useClipboard,
    i18n-e2e,
    themeProps,
    sharedResizeObserver,
    naming,
    docPropLiterals,
    docPropReferences
  ]
upstream-prs: []
---

## Scope

The rest of front 1. Fifteen agents, one per suite or small family, each porting case for case and
running only its own files. Batch 030 took the `theme/` suites; this one took everything else.

The gap `status.md` measures went from 45 suites / 581 cases at the start of the goal to **one**:
`theme/generateThemeRules.test.ts`, deferred in 030 with its reason and still counted.

Nothing was ported by hand here except the fixes below. The interesting output of a fan-out is not
the case count — it is what fifteen independent readings of upstream found that one reading did not.

## What the ports found

### Three components let a consumer override the prop they exist for

`AspectRatio`'s suite has a case for it (`keeps the consumer style and applies the ratio over it`)
and it failed: upstream merges `{...style, aspectRatio}` — consumer declarations first, the `ratio`
prop last — and this port had the order inverted, so `style="aspect-ratio: 3 / 1"` silently beat
`ratio={16/9}`. Inline styles resolve by declaration order, so the order **is** the precedence.

Reading the pair after it found the same inversion in `Stack` (upstream `Stack.tsx:288`) and `Grid`
(`Grid.tsx:463`), where `<Stack width={400} style="width:100%">` gave 100% here and 400px upstream.
**Neither suite covers it** — no upstream case passes both `width` and `style` — so both came back
green and the defect was found by reading, not by testing. `AppShell` looked like a fourth and is
not: upstream sets that variable imperatively, which wins regardless.

All three fixed. Four more instances of the same family are recorded rather than changed in
`debts.md`, because nothing observable turns on them today and changing precedence with no case
demanding it is how a port acquires a divergence in the other direction.

### Ported `getByRole` name assertions are weaker than the ones they port

The most consequential finding, and it came out of a seven-case suite. Testing Library matches an
accessible name as a **whole string**; Playwright, which supplies the browser project's locators,
matches a string `name` as a case-insensitive **substring**. So a case ported verbatim asserts less
than upstream's does.

Demonstrated twice, independently. `VisuallyHidden`: with the icon span's `aria-hidden` removed the
control's accessible name became `'Trash Delete'` and `{name: 'Delete'}` still matched. `LayoutSlots`:
a label changed to `'The Site header here'` against `{name: 'Site header', exact: true}` produced a
15-second locator timeout, proving the flag is honoured and the verbatim form would not have bitten.

The exposure is generated into `status.md` rather than stated here. The sweep is its own batch and
deliberately not this one: adding `exact: true` will surface every place this port's accessible name
differs from upstream's, and each is a parity defect to triage rather than a test to relax. The rule
is promoted into `CLAUDE.md` and `.claude/agents/astryx-test-parity.md` so no new port adds to it.

### Three files were porting several upstream suites at once

The rule promoted in batch 030 — one file ports one upstream suite — paid for itself three times
over, and each of the three was hiding something different:

- **`leaves.svelte.test.ts`** held sixteen `EmptyState` cases, four of which (the 0.4.x theming
  targets) had no port at all, and one of which had silently lost two of upstream's five assertions
  to a fixture that fills a single slot. It also held `IconButton` at 8 of 10. Now `nav-icon.svelte.test.ts`,
  which is what it actually ports.
- **`layout.svelte.test.ts`** claimed "all four upstream suites". It had three. The fourth,
  `LayoutSlots.test.tsx`, turned out to be ported after all — housed in this file rather than
  missing, which the header had first over-claimed and then over-corrected. A filing problem, not a
  coverage gap, and worth stating precisely because the intermediate correction read as a 34-case
  hole.
- **`theme.test.ts`**, split in batch 030.

### `pseudo.json` had rotted 34 keys behind `en.json`

Upstream **gitignores** its `pseudo.json` and regenerates it every build, so the file is absent from
the upstream clone and there was nothing here to vendor or diff against. This port's copy was
generated once and never again. At the 0.4.5 pin it was missing every announcement key wired in
batch 029 — so the locale whose whole job is making untranslated strings visible was itself missing
them.

Upstream's generator is ported with a `--check` mode and wired into `test:node`. Two things make it
trustworthy rather than merely present: regenerating produced **102 insertions and zero deletions**,
so all 263 existing keys reproduce byte-for-byte and the algorithm is upstream's; and the check was
negative-controlled by deleting a key and confirming exit 1. A generator without a `--check` is how
the file rotted the first time.

### A stale reason, exactly as CLAUDE.md warns

`chat-composer-input.svelte.test.ts` carried a comment calling the missing `inputControlRef`
registration "a parity gap no case in this file can see". The registration exists
(`chat-composer-input.svelte:401`, provided at `chat-composer.svelte:206`). The reason survived
because upstream's assertion — the editable ends up focused — holds down either branch, which is
precisely how an expired reason hides. Corrected.

## Two suites have no counterpart, established rather than assumed

`serverSafeComponents.test.ts` (16 declarations) rests entirely on the React Server Components
boundary: there is no `'use client'` directive in Svelte, no `react-server` export condition, no
`scripts/check-use-client.mjs`, and no per-component subpath map. Svelte's split is a compilation
target, not a bundling boundary a directive pins, so there is nothing to mark stale or missing.

`babelPluginAddExtensions.test.ts` (20) guards a Babel plugin that adds file extensions during
upstream's build; `svelte-package` does the inverse and this port has no such transform. Its
assessment produced a real finding of its own, recorded as a debt: **nothing here enforces the
fully-specified-relative-import convention** — not eslint, not `publint`, not the build — so an
extensionless import would pass everything and break only a strict-ESM consumer of the tarball.

Both are now `NO_TEST_COUNTERPART` entries in `scripts/status.mjs`, which carries hygiene in both
directions.

## `doc-prop-literals`, deliberately bounded rather than skipped

Its port is faithful and it fails honestly: 34 documented props here name a type where upstream's
hand-authored doc spells the values out — `(reason: ToastDismissReason) => void` against upstream's
`(reason: "auto" | "manual") => void`. That is a real gap in this port's **generated** docs, and its
fix lives in `docs/scripts/lib/props-types.mjs`.

The 34 are listed in `PORT_DOC_TYPE_DEBT` in the suite, carrying the class oracle's skip hygiene in
both directions — an entry that stops violating fails the run, and a violation that is not listed
fails the run — so the list can only shrink. Both directions were negative-controlled. Upstream's own
`ENUMERATED_IN_PROSE` registry is left at its single entry, because widening that would be divergence
rather than porting.

## READMEs

Rewritten around the hero social card, with the badge row and centred header shadcn-svelte uses. The
substance stayed; the **numbers went**, because three of them were already wrong — the root README
claimed 101 components (`status.md` says 99 against upstream's 103) and oracle counts of 1,528 style
keys and 615 inline sites (the gate reports 1,635 and 532), and seven theme READMEs each stated a
declaration total that had drifted. `status.md` prints them now.

`@stylexjs/stylex` comes out of ten install commands. It stays a peer dependency, as upstream has it,
and it is genuinely required at runtime — `dist/internal/sx.js` calls `stylex.props()`, and the
`import * as stylex` left in the 207 compiled `.stylex.js` modules is dead (0 uses) — so each command
grew a note rather than losing the fact.

## Rules promoted

- `CLAUDE.md` § Testing — `exact: true` on every string `name`, with the demonstration.
- `.claude/agents/astryx-test-parity.md` — the same rule, where the porting agents will read it.

## Debts opened

- Ported `getByRole` name assertions are substring matches, where upstream's are whole-string
- Rest-prop and inline-style precedence disagrees with upstream in four components
- The docs emitter names value-carrying type aliases where upstream spells the values out
- Nothing enforces the fully-specified relative import convention

## Debts retired

- Only three of upstream's locale catalogs are ported — superseded; `pseudo.json` now generated and gated
