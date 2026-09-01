# astryx-svelte — backlog

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design system.
Unofficial; not affiliated with Meta.

Metrics live in [`status.md`](./status.md) and are generated — do not restate a number here.
History lives in [`ledger/`](./ledger). Deviations from upstream live in [`debts.md`](./debts.md).

## Current goal

**Full parity with Astryx `0.5.2`**, across every package except three. Set 2026-08-20 against
`0.4.5`, replacing "track each upstream release and cut a matching version" — that goal was about
staying level with upstream's _movement_; this one is about closing the distance that predates it.
**Re-target it in the same batch the pin moves**: a goal naming a version this port no longer
tracks is the same defect as a suite header stating a count against the wrong tag, and it went
unnoticed for a whole release. Moved to `0.5.0` on 2026-08-25 (batch 032) and to `0.5.2` on
2026-08-31 (batch 040, which took `0.5.1` and `0.5.2` in one pass). Each move widened the distance
rather than closing it — `0.5.0` brought a new component (`Stepper`), two breaking changes, and the
largest single-release test delta this port has tracked; `0.5.2` left the surface whole and moved
what remains into the _cases_. The size of it is in [`status.md`](./status.md), not here.

Out of scope, by decision: **`lab`, `charts` and `vega`**. Four of `lab`'s components
(`CodeEditor`, `RichTextEditor`, `ThreeD`, `Sankey`) wrap React-only libraries with no drop-in
Svelte equivalent, and the parity rule cannot arbitrate a substitute that has no upstream answer
to copy; `charts` and `vega` are d3 and Vega-Lite renderers built on that same React surface.
Everything else is in: `core`, `cli`, `themes/*`, `build`, `richtext`, and the docs site.

In scope means _upstream's_ surface, not a superset. Where a symbol genuinely has no Svelte
counterpart it lands in [`debts.md`](./debts.md) with the reason — an absence that is recorded is
parity; an absence that is unremarked is a gap.

Measure it, do not describe it. [`status.md`](./status.md) now generates the test delta as well as
the surface delta, so "how far from parity" has a number that cannot rot into prose. Progress is
that table going to zero.

### The fronts, in order

Each front is sequenced so the thing that _catches_ mistakes lands before the thing that makes
them.

1. **The test delta.** The largest and most mechanical front, and the one that protects every
   other — and the one that keeps proving it protects more than tests.

   **At the 0.5.2 pin this front is case-level, and since batch 041 it is measured.** Every file
   under `src/tests/` declares the upstream suite it ports, so `status.md` carries both halves: the
   suites nothing ports at all, and the per-suite shortfall of the ones that do. Work the case-delta
   table top-down; it is the worklist, and it going to zero is what finishing this front means.

   Two things in it are not just cases. `Carousel`'s new keyboard-focus cases have a feature behind
   them — `carousel.svelte` has no counterpart for focus at the scroll edges. And `ToastViewport`'s
   swipe-dismissal block is portable today: `use-toast-gesture.ts` is ported and writes exactly the
   properties those cases assert on.

   Batch 033 found three of `0.5.0`'s new suites were testing **modules this port did not have**
   (`scrollbarGutter`, `getInitialFocusDate`, `useCollator`) and a fourth caught three overlays that
   never reset the container padding. None of that was visible to either style oracle, which read
   modules and emitted CSS rather than call sites. Treat an unported suite as a possible missing
   implementation until you have checked, and check with the **kebab-case** name — a camelCase grep
   against this tree returns a false absence.

   The two units this front used to name are both closed: the four `Layer` dismissal suites landed
   behind the shared dismissal stack, and `theme/generateThemeRules.test.ts` closed in batch 034,
   which aligned the `generateThemeCSS` API and ported it whole — and found the blocking debt had
   overstated itself. That is the standing warning about estimating a port from reading two
   implementations against each other instead of running either.

   - [ ] **Strip a suite header's stated case count when you touch that suite** — not as a pass of
         its own. Most still state one against the `0.5.0` pin while the tree is at `0.5.2`, so they
         are false, and since batch 041 they are also redundant: `status.md` derives the same numbers
         from the `PORTS:` markers on every run, and `CLAUDE.md` forbids writing new ones. What is
         left is ~200 prose edits with no functional change, on files that are each reopened the
         moment their cases are ported — which is the work above this line. Folding the strip into
         that is strictly less work for the same end state, and the numbers can no longer corrupt
         the metric while they wait. `grep -l '0\.5\.0.* pin' packages/core/src/tests/*.ts` is the
         worklist if it is ever wanted as one.
   - [ ] **`FieldStatus` is ported twice.** `form-and-metadata.svelte.test.ts` and
         `field-status.svelte.test.ts` carry the same seven describe blocks; the second adds
         `field-status-icon theme target` and is the fuller one. Split the first into `FormLayout`
         and `MetadataList` files, per one file / one suite, and drop the duplicate block. Found by
         the declared attribution in batch 041 — the group reads as _over_ upstream's count, which
         is the shape a duplicate makes.

2. **The published surface.** Settle the Layer/over-export decision as one call at a minor, then
   the `./theme` barrel renames, the `./theme/tokens` subpath keys, `reset.css` at its own subpath,
   and the Tailwind bridge. Every one is an addition to or removal from a shipped API, so they
   belong together rather than dribbled across patches.
3. **`@astryx-svelte/build`.** Upstream's `build` package is seven files of framework-agnostic
   JavaScript — a PostCSS plugin, a Babel config and a Vite plugin — and it ships on the stable
   release train at `0.4.5`, unlike the canary packages. The only piece needing translation rather
   than transcription is `next.js`, whose counterpart is SvelteKit.
4. **`@astryx-svelte/richtext`.** Lexical's core is framework-agnostic; only `@lexical/react` is
   not, and its plugins are thin wrappers over `editor.registerCommand` and node transforms. Ten of
   them need Svelte counterparts. Upstream ships this `private` and canary-only, so it is parity
   work with no release pressure behind it.
5. **The CLI backlog.** `blog`, `components.lock.json` with per-file hashes, the codemod runner and
   the template assets — see Open work → CLI.
6. **The docs site.** The remaining routes (`/docs/core`, `/docs/cli`, `/changelog`, `/blog`,
   `/themes`, `/playground`, `/mcp`), the two landing bento tiles, and the deferred `.doc.mjs`
   examples. The **icon registry expansion** is the cross-cutting piece here: seven demo debts name
   it as their retirement condition, because upstream's stories use Heroicons the registry has no
   match for.

   On the examples: batch 038 ported the `Stepper` and `Step` blocks, and every icon they reach for
   already resolves, so they opened no new demo debt. What is left are the blocks for
   `ComplexSelector`, `ChatDictation`, `AvatarGroup`, `ChatMessageBubble`, `Dialog` and `Selector`.
   These are ports, not authored demos — the source is
   `@astryxdesign/cli`'s `assets/templates/blocks/components/<Name>/`, resolved by `exampleFor` in
   the block's `.doc.mjs`, so the parity rule applies to them exactly as it does to a component.

   Batch 039 put the examples figure in [`status.md`](./status.md), where it belongs — it had been
   printed by the generator on every run and discarded, leaving this front the only one measured in
   prose. `status.mjs` calls the generator for it rather than recomputing the rule, because the
   tally counts only blocks whose target is a documented entry and that set is not the barrel's
   export list.

   **One figure is still discarded the same way:** `templates N ported / M pending`, from the same
   generator run and the same front. Identical defect, identical fix, deliberately left out of 039
   so that batch's scope kept meaning something.

### The release, held

`0.4.5` is merged to `main` and **not tagged**. The gate is green and the manifests are at `0.4.5`,
so the tag is one command away whenever it is wanted — but full parity is now the goal ahead of it,
and a release is a checkpoint on the way rather than the destination. `0.4.2` was likewise merged
and never tagged, which is why the `0.4.5` changelog entry opens by saying so.

## Open work

### Core / build

- [ ] Upstream publishes its CSS reset at its own subpath (`@astryxdesign/core/reset.css`,
      opt-in); ours is folded into the always-loaded `base.css` because the components genuinely
      require it. Revisit if the published surface should mirror upstream's split
- [x] The StyleX _compiler_ path emits its priority buckets **under `astryx-base`**, which is
      upstream's own arrangement — their PostCSS plugin turns layers on and then wraps the result
      in `@layer astryx-base { … }`, and nesting `priorityN` inside that is `astryx-base.priorityN`.
      StyleX 0.19 added `useLayers: {prefix}`, so `vite.ts` gets there directly. `base.css` used to
      name sixteen buckets by hand — a workaround for turning layers on without upstream's wrapper
      — and now names four layers total
- [ ] Upstream bug, not replicated: `astryx.css` bundles their ESLint test fixture
      (`Badge.test-violations.tsx` doesn't match their own `**/*.test.*` glob). Recorded as named
      skips in `compare-upstream-css.mjs`, which retire themselves when upstream fixes the glob
- [ ] Babel 7 pin in `packages/core` (`@babel/core@8` needs Node ≥22.18). Revisit on the next Node
      bump
- [ ] Consolidate two homes for one upstream dir — `types.ts`, `themeProps.ts`,
      `sharedResizeObserver.ts` sit under `internal/`; `parseStyleKey` sits with the theme
      compiler. Touches every component's imports, so it's recorded rather than done
- [ ] **Self-hosting from the theme packages is still open** and is the harder half: it means
      shipping the woff2 files in each package and declaring the `@font-face` rules there, so a
      consumer who installs a theme gets its font without a third-party request. The docs site is
      unblocked either way; a library consumer is not

### CLI

- [ ] `blog` CLI command is not ported — it needs content this port does not have
- [ ] `components.lock.json` with per-file content hashes — not started
- [ ] The remaining `it.todo`s in the CLI suite don't name a slice any more: some wait on this
      port cutting a second upstream-tracking release (a codemod migrates _between_ two
      versions), the rest wait on the deferred codemod and template assets

Upstream's codemod and template assets stay deliberately deferred from the CLI's own catalog. Both
are recorded in [`debts.md`](./debts.md) rather than here, because a standing decision is a
deviation, not a task.

### Docs site

- [ ] `ThemesPreview`, the Themes bento tile — a scaled-down live `ThemeShowcaseStore` beside a
      rail of theme swatches. Needs the `theme-showcase` page template, which has landed
- [ ] `TemplatesPreview`, the Templates bento tile — needs `TemplateThumbnail` and several page
      templates rendered live and scaled into the tile
- [ ] Restore the landing bento to upstream's three columns once both tiles above exist (col 1
      heading + Themes, col 2 Components + CLI, col 3 Templates)
- [ ] `BlogShowcase`, the remaining landing section, on `blogRegistry` +
      `BlogCard`/`BlogFeatureCard` — lower priority than the tiles, since it needs post content
- [ ] `AboutShowcase`'s heading block is intentionally not upstream's copy (Meta's "13,000 apps"
      institutional claim doesn't fit an unofficial port). Confirm this still reads as the right
      call, or fold it into `debts.md` as a settled divergence
- [ ] `/docs/core`, `/docs/cli`, `/changelog` — no longer blocked on a component (`Markdown` +
      `parseOutlineFromMarkdown` landed); needs a package registry in the generator, a ported
      `PackageStubPage`, and a route branch that doesn't 404
- [ ] `/blog` (mdsvex) and a `/themes` browser
- [ ] `/playground` — `svelte/compiler` in a Web Worker + CodeMirror 6. Deliberately last: a
      different problem in Svelte than upstream's `ts.transpileModule`
- [ ] `/mcp` — `@modelcontextprotocol/sdk` in a `+server.ts`, over the existing content registries

### Tests

- [ ] Fold the two per-file `Intl.DateTimeFormat` locale stubs into the client project's `en-US`
      config pin now that it exists, so there's one mechanism instead of three
- [ ] Continue porting upstream `.test.tsx` suites alongside each component, case for case — the
      count is the contract, and `status.md`'s case delta is where it is now kept. A new file
      declares `PORTS:`; a new upstream suite nothing ports needs either that or a
      `NO_TEST_COUNTERPART` entry, or the run fails
- [ ] a11y parity checks on every `aria-*`, `role` and live region
- [ ] SSR render with JS disabled, no hydration warnings

### Demo route

In scope for the parity rule: it must show upstream's documented API and example content, not
hand-drawn content.

- [ ] `ThumbnailDisabled`'s _Enabled_ row is still absent from the Thumbnail section
- [ ] `TreeList` demo is missing a couple of upstream's stories: `WithIcons` needs folder/document
      icons the registry doesn't ship, and `Interactive` drives its rows with `alert()` rather
      than a substitute
- [ ] `TabList`'s _New item_ button has no leading icon — the registry has no plus glyph. Retires
      with the icon registry expansion
- [ ] `CheckboxInput`'s start-icon stories use the registry's `info` glyph as a stand-in for
      upstream's Heroicons. Retires with the icon registry expansion
- [ ] `CheckboxList`'s `DynamicItems` story is absent — a consumer pattern (rendering from an
      array), not component API, so lower priority
- [ ] `NumberInput`'s icon stories use `info`/`menu` stand-ins for upstream's Heroicons. Retires
      with the icon registry expansion
- [ ] The `CodeBlock` demo's `syntaxTheme` block (`dracula`) is the port's own — upstream ships no
      story for the prop
- [ ] `Selector`'s icon stories use `info`/`menu`/`warning` stand-ins for upstream's Heroicons;
      only `Typeahead`'s `search` substitution is a true match. Retires with the icon registry
      expansion
- [ ] The nav family's story files use many distinct Heroicons; the registry has two true matches
      (`menu`, `search`) and the rest are stand-ins. Retires with the icon registry expansion
- [ ] `selectedIcon` can't demonstrate "the same glyph, filled" — the registry ships no
      outline/solid pairs, so every upstream `*IconSolid` lands as a _different_ glyph on purpose.
      Retires with the icon registry expansion
- [ ] The mega menu's featured-card image uses an inline data-URI instead of upstream's Unsplash
      URL, so the page needs no network — the same substitution `Lightbox`/`Thumbnail` make
- [ ] `SideNav`'s `getCollapseState()`/`collapseHandle` instance exports appear in no demo block —
      upstream ships no story using `handleRef` either. Worth a port-own block if the prop ever
      needs showing
- [ ] Multiple `AppShell` instances on one page means multiple `role="main"` landmarks sharing one
      id constant — an artifact of a component page showing every example at once, not a component
      defect
- [ ] Re-sweep the docs example blocks against upstream now that later batches have landed

### Release

- [ ] Push the release tag — the step that actually publishes. Run the `workflow_dispatch`
      dry-run first: it runs the identical job with `--dry-run`, so a manifest or credential
      problem surfaces without burning a version number
- [ ] Consider asking the Astryx maintainers for a blessing
- [ ] When upstream ships its own patch release that collides with this port's version scheme,
      skip to the next free local patch and state the real parity target in the `CHANGELOG`
      heading (already done once: `0.3.1` ports Astryx `0.3.0`)

## Open decisions

- [ ] **Empty-slot detection for `string | Snippet` props** — leaf-slot discrimination is settled
      (`typeof === 'function'`); "did the caller pass something that renders nothing?" is not.
      Bites in `Tooltip`/`HoverCard`
- [ ] The Table plugin contract for third-party plugins
- [ ] Decide the `@scope` floor (Baseline only since 2025-12-12) — fall back to descendant
      selectors, or require it?
- [ ] `lab`'s substitute libraries for `CodeEditor`/`RichTextEditor`/`ThreeD`/`Sankey` — none of
      the four has a drop-in Svelte equivalent, and the parity rule can't arbitrate a pick that
      has no upstream Svelte answer to copy

## Fronts not started

Sizes measured from upstream source, not estimated.

| Front      | Size              | In scope                                    |
| ---------- | ----------------- | ------------------------------------------- |
| `build`    | 7 files           | yes — front 3                               |
| `richtext` | 11 files          | yes — front 4                               |
| `lab`      | 19 dirs at v0.4.4 | no — React-only libraries, see Current goal |
| `charts`   | 35 files          | no — built on that same surface             |
| `vega`     | 5 files           | no — built on that same surface             |
