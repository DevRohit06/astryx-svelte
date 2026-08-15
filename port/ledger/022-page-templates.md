---
seq: 22
title: Page templates — upstream's 43 whole pages
upstream: 0.3.0
date: 2026-08-10
units: []
upstream-prs: []
---

## Scope

Not components: upstream's `assets/templates/pages/*` are self-contained React pages the CLI
scaffolds. All 43 are transcribed to `packages/cli/assets/templates/pages/<slug>/+page.svelte` plus a
`template.doc.mjs`. The icon substitutions these pages needed are their own dated Phase 5 entry — see
`024-docs-site.md`'s "Page-template icons" section — because that fix landed later, against `todo.md`
rather than against this ported.md section.

## The pages

### Page templates — upstream's 43 whole pages (2026-08-10)

Not components: upstream's `assets/templates/pages/*` are self-contained React pages the CLI
scaffolds. All 43 are transcribed to `packages/cli/assets/templates/pages/<slug>/+page.svelte` plus
a `template.doc.mjs` carrying upstream's metadata verbatim — `isReady: false` and
`isHiddenFromOverview: true` included, because those are upstream's editorial calls and inverting
one would be invented content. Status, counts and the open debts live in
[`TODO.md`](./TODO.md#known-debts); this is how they were built.

**The job was transcription, not component work.** All 96 symbols the 43 pages import already
resolved against `packages/core/src/lib/index.ts` before a line was written — `Table`,
`Resizable`/`ResizeHandle`/`useResizable`, `PowerSearch`, `Chat`, `TreeList`, `CommandPalette`,
`AppShell`/`useAppShellMobile`, `useMediaQuery`, `Markdown`, `Outline`. The only apparent gap,
`ThemeProvider`, turned out to be sample text inside a `CodeBlock`'s `code={…}` string. The CLI seam
was equally ready: `_adapter.mjs` had defined `PAGE_SOURCE_FILE = '+page.svelte'` and walked
`assets/templates/pages` under `existsSync` guards since the CLI slice, so the files simply appeared.

### Two Svelte hazards these pages found, both silent

**A `class` handed to a component is never scoped.** Svelte's scoper stamps *elements*; a class
passed as a prop is an opaque string. So `.wrap .hero { … }`, where `.hero` sits on an Astryx
component, is emitted as `/* (unused) */` and dropped, with only a `css_unused_selector` warning to
say so — the page renders, minus that rule. The fix is a bounded global, `.wrap :global(.hero)`,
which also matches what upstream's own injected `<style>` string does (unscoped either way).
Mutation-checked rather than asserted: restoring the bare selectors reproduces exactly
`css_unused_selector @673, @677, @686, @690` in `ai-chat`. This has no React analogue — upstream's
`className` reaches the DOM unchanged — and it bit in four separate batches.

**A `{#snippet}` declared as a *direct child* of a component is a prop on that component.** In
`settings-dialog` a snippet written inside `<List>` became a `List` prop, and `List` spreads
`{...rest}` onto its `<ul>`, so it would have landed as a DOM attribute. Hoisting it to top level
fixes it; a snippet inside an `{#each}` is *not* a direct child and is safe, which is why the
per-row pattern works. The existing `/templates` page docstring already warned about this for
`ClickableCard`/`Overlay`; it has now bitten twice, so it belongs here rather than in one file.

### The translations that recurred

- `Layout content={<…>}` → `{#snippet content()}…{/snippet}` + `<Layout {content} />`. A component's
  slot prop takes a **zero-argument** `Snippet`, so a parameterised snippet needs a thin nullary
  wrapper. Per-row slots are declared *inside* the `{#each}` so they close over the loop variable.
- **Hooks take getters and must not be destructured.** `useMediaQuery(() => '(max-width: 768px)')`
  read as `.matches`; `useResizable(() => config)` returning `{get size, get isCollapsed, …}`;
  `usePowerSearchConfig(() => defs, () => name)`. `const {size} = useResizable(…)` snapshots at init
  and freezes the frame — upstream's own `const {config, applyFilters}` is exactly that destructure.
  `useAppShellMobile()` returns a **function** here: `appShellMobile().isMobile`.
- **`Table.renderCell` is `Snippet<[T]>`.** A column array referencing one must be `$derived.by`,
  because template snippets do not exist yet while `<script>` runs. `Table` in children mode ignores
  `columns` entirely (`base-table.svelte:406`, mirroring upstream's `BaseTable.tsx:525`), so
  `table-grouped` renders no header row — upstream behaviour, reproduced.
- **A page template is one file**, so a stateful local React component cannot become a sibling
  `.svelte`. Its state hoists onto the page (there is exactly one instance, so rendering is
  identical) and its markup becomes a parameterised snippet.
- No Astryx-Svelte component has a `ref` prop; `ref={cb}` becomes `{@attach …}`, which works because
  the components spread `{...rest}`. Upstream's ref-callback caches are **kept** — Svelte re-runs an
  attachment when its function identity changes, so dropping them would re-register every card on
  every pointermove.
- `CSSProperties` objects → `style` strings under upstream's const names and key order. An inline
  `<style>{CSS}</style>` moves to a top-level block, which Svelte requires.

### Test posture

Upstream ships no suite for these pages, so there is nothing to port case-for-case; `ShowcaseThumbnail`
mounts each one live in the gallery behind a `<svelte:boundary>`, so a page that throws is visible
immediately. What the batch did do is **retire four self-retiring fixtures at once** — assertions and
fixtures written specifically to expire when template assets landed:

- `template-integration.test.mjs` asserted `core.length === 0`; upstream's `toBeGreaterThan(0)` is
  restored, kept as a bound rather than a literal count so it asserts behaviour, not the batch schedule.
- `copy.test.mjs`, `template.test.mjs` and `template.path-safety.test.mjs` each stood up an
  integration-contributed `blank`/`contact-form` because none was packaged. Core's real ones now
  collide with them (`ERR_AMBIGUOUS_TEMPLATE`), so all three revert to upstream's shape — no fixture,
  resolving the packaged template exactly as upstream does. One assertion changes value, not meaning:
  upstream reads `columns={{minWidth: 200}}` out of the skeleton, ours carries the repo's prettier
  spacing inside the literal.


## Oracle bookkeeping

Not applicable — page templates carry no `.stylex.ts` of their own; they compose already-ported
components. Styles were never involved in either direction here.

## What the audits caught

No `port/debts.md` group was staged against this batch specifically — `port/ledger/_inbox.md` has no
group naming "page templates". The two Svelte hazards these pages found are recorded above, in the
component notes.

## Rules promoted

Not promoted at the time.

## Debts opened

-
