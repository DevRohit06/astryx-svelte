# astryx-svelte — backlog

A Svelte 5 port of [Astryx](https://astryx.atmeta.com/), Meta's open source design system.
Unofficial; not affiliated with Meta.

Metrics live in [`status.md`](./status.md) and are generated — do not restate a number here.
History lives in [`ledger/`](./ledger). Deviations from upstream live in [`debts.md`](./debts.md).

## Current goal

The first npm release shipped as `0.3.1` (porting Astryx `0.3.0` — the port's own version scheme
can't express a release of its own, so it took the next free patch number instead of `0.3.0`
itself). Since then the goal has been continuous upstream tracking rather than a one-time port:
pull each Astryx release, close the class-oracle and theme-oracle drift it introduces, and cut a
matching release of this port. The pin is currently Astryx `0.4.4` — see
[`status.md`](./status.md) for the live count of what that leaves open. Set 2026-08-16, re-pinned
2026-08-19.

`0.4.2` is merged to `main` but **not tagged**: the release step is still open below, and tagging
from a quiet `main` is easier than tagging mid-batch.

## Next

- [ ] Push the release tag for the current pin once its gate is green (see Open work → Release)
- [ ] Finish the 0.4.2 test delta — 39 SideNav cases and 12 Slider cases, plus smaller counts in
      Avatar, TopNav, ChatMessageBubble, useContainerReveal, DropdownMenuSubMenu and useFocusTrap.
      The release-blocking part is done (useLayer's hosting block, the whole useMenuHover suite,
      Slider's inset blocks, HoverCard's portal pair); `debts.md` carries the per-suite list
- [ ] Hand-translate the deferred `.doc.mjs` examples. Upstream's are JSX, and this port's
      `ComponentExampleDoc.code` is documented as Svelte source, so emitting them verbatim would
      ship React as this CLI's answer to "show me an example" — the `Button.icon` mistake.
      `UPSTREAM_EXAMPLES_NOT_PORTED` in `docs/scripts/emit-core-docs.mjs` is the exact list and
      fails the run in both directions, so it cannot drift; `BottomSheet` and
      `BottomSheetSwitcher` joined it at 0.4.5
- [ ] Re-sweep the demo route against upstream now that later batches have landed
- [ ] Build `ThemesPreview`/`TemplatesPreview`, the two landing-page bento tiles — both were
      blocked on page templates, which have since landed in full
- [ ] Work down the CLI backlog (see Open work → CLI); the codemod runner and the lockfile
      hashing are the two pieces nothing else depends on

## Open work

### Core / build

- [ ] Upstream publishes its CSS reset at its own subpath (`@astryxdesign/core/reset.css`,
      opt-in); ours is folded into the always-loaded `base.css` because the components genuinely
      require it. Revisit if the published surface should mirror upstream's split
- [ ] The StyleX _compiler_ path (as opposed to the pre-built `dist/astryx.css`) still emits
      `@layer priority1…9` rather than one named layer, because StyleX has no way to emit into a
      named layer. Revisit only if that changes
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
      count is the contract (see `status.md` for the measured gap)
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
      id constant — a demo-page artifact of showing every story at once, not a component defect
- [ ] Re-sweep the demo route against upstream now that later batches have landed

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

| Front      | Size              |
| ---------- | ----------------- |
| `lab`      | 19 dirs at v0.4.4 |
| `charts`   | 35 files          |
| `vega`     | 5 files           |
| `richtext` | 1 file            |
| `build`    | 7 files           |
