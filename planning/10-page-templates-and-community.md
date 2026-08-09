# 10 · Page templates and the community page

Design for two independent pieces of Phase 5 work, agreed 2026-08-09:

- **A** — `/community`, upstream's contribution page, retargeted at this port.
- **B** — upstream's 43 **page templates**, transcribed to Svelte, and `/templates` rebuilt
  on them.

They share no code and can land in either order. A is one sitting; B is batched.

Spec lives here rather than under `docs/`, because `docs/` is the SvelteKit docs app and
`planning/NN-topic.md` is this repo's established location for design notes.

---

## Why B exists

`/templates` today renders **block** templates: `generate-content.mjs` → `buildExampleRegistry()`
reads `@astryxdesign/cli/assets/templates/blocks`, and each block's Svelte rewrite lives in
`docs/src/lib/examples/<Component>/`. 619 tiles, all live.

Upstream's `/templates` shows **no blocks at all.** Its gallery reads a `templateRegistry`
built from `assets/templates/pages/` and lists the 32 page templates that are
`isReady && !isHiddenFromOverview`. The block set is a CLI scaffolding feature that surfaces on
component detail pages, not a gallery.

So the current page is not upstream's page wearing a different dataset — it is a different page.
B closes that.

### The blocker that turned out not to exist

Every component and hook the 43 pages import is **already exported from
`@astryx-svelte/core`** — verified by diffing all 96 imported symbols against
`packages/core/src/lib/index.ts`. That includes the ones most likely to be missing: `Table`,
`Resizable`/`ResizeHandle`/`useResizable`, `PowerSearch`, `Chat`, `TreeList`, `CommandPalette`,
`AppShell`/`useAppShellMobile`, `useMediaQuery`, `Markdown`, `Outline`.

The only symbol that looked absent, `ThemeProvider`, appears solely inside a `code={...}` string
in `theme-showcase`'s `CodeBlock` sample — it is sample text, not an import.

**B is transcription. It is not blocked on component work.**

### The CLI seam is already built

`packages/cli/api/template/_adapter.mjs` discovers core page templates today and is waiting on
the files:

- `PAGE_SOURCE_FILE = '+page.svelte'` (line 63) — SvelteKit's route component name, deliberately
  chosen over upstream's `page.tsx`.
- `PAGES_DIR = assets/templates/pages` (line 163), walked under `fs.existsSync` guards.
- Spec files: canonical `.template.{ts,mjs,js}` (default export) or legacy `.doc.{ts,mjs,js}`
  (`export const doc`). Canonical wins when both exist.
- `stripTemplateAssetRefs()` already replaces Meta's `lookaside.facebook.com` imagery with an
  inline placeholder data URI on scaffold.

The adapter's own docstring (lines 31-38) records that the directory is empty and that discovery
"reads those directories the moment they appear". B makes them appear.

---

## B · Design

### B1 · Where the files go

```
packages/cli/assets/templates/pages/<slug>/
	+page.svelte          the transcription
	template.doc.mjs      the spec, rewritten for this port
```

Authored under `packages/cli`, not `docs/`, because upstream ships these through the **CLI** as
scaffolding assets and the docsite merely renders them. Same precedent as
`packages/cli/assets/docs/`, which carries all 27 reference topics rewritten for this port
rather than reading upstream's from `node_modules`.

`template.doc.mjs` uses the legacy suffix on purpose: it is the name upstream uses, the adapter
accepts it, and matching upstream keeps a future `.template.ts` migration a single rename across
both repos.

### B2 · The registry

`docs/scripts/generate-content.mjs` gains `buildTemplateRegistry()`, emitting
`docs/src/lib/generated/template-registry.js`.

**Metadata source is upstream's**, read from the installed `@astryxdesign/cli` at the pinned
exact version — identical to how `buildExampleRegistry()` treats blocks, and for the same reason:
prose is reused verbatim, and a CI checkout with no upstream clone must generate the same output.

Per template, the registry records `slug`, `name`, `displayName`, `description`, `category`,
`isReady`, `isHiddenFromOverview`, the derived `group`, and **`hasSvelte`** — whether
`packages/cli/assets/templates/pages/<slug>/+page.svelte` exists.

`hasSvelte` is what keeps the gallery honest while the batches land, exactly as
`coverage.examplesPending` does for blocks. A template with no transcription yet is **recorded
and counted, not listed** — the gallery renders only `isReady && !isHiddenFromOverview &&
hasSvelte`, and the pending count goes to `coverage.js` so `TODO.md` has a number to track.

### B3 · Grouping

`groupOf(category)` is the text before the first `' - '`; a category with no separator is its own
group; an empty category falls to `'Other'`. Upstream's `GROUP_ORDER`:

```
Dashboard · Table · Form · Settings · Login · Tools · Content · AI Chat · Gallery · Shell
```

Groups outside the list append alphabetically, `Other` last.

### B4 · The gallery page

`docs/src/routes/templates/+page.svelte` is rewritten to upstream's structure:

- centred `display-1` hero,
- `ToggleButtonGroup` category filter (the existing `:global(.astryx-toggle-button-group)`
  wrap rule is kept — it is the fix for a 997px group clipped inside a 375px viewport),
- group headings in `GROUP_ORDER`,
- `ClickableCard` + hover `Overlay` tile per template.

Thumbnails reuse **`ShowcaseThumbnail`** unchanged: it already renders a block live at 2× and
scales it 0.5 behind an `IntersectionObserver`, `content-visibility: auto` and `inert`, which is
the same job upstream's `TemplateThumbnail` does. It needs a second importer map for
`packages/cli/assets/templates/pages/*/+page.svelte`, added to
`docs/src/lib/shell/example-modules.ts`.

**The block gallery is removed.** Blocks stay reachable on each component's detail page, where
their live preview and source already sit. This is the strict-parity choice: upstream's
`/templates` is pages-only.

### B5 · The preview dialog

Upstream's `/templates/[slug]` is a redirect to `/templates?preview=<slug>`; the real detail UI is
`TemplatePreviewDialog` on the gallery — full-bleed render, prev/next, `?preview=` in the URL.

Both are ported. The current page's docstring records the dialog as deliberately skipped because
"a block whose live preview and source already sit on the component page" did not need it — that
reasoning does not extend to a whole page, so the dialog returns with the pages.

`/templates/[slug]` is a `+page.ts` redirect, keeping direct links working as upstream's does.

### B6 · Transcription rules

One rule per recurring React→Svelte shape, applied uniformly so batches stay reviewable:

| Upstream | Here |
| --- | --- |
| `useState` | `$state` |
| `useMemo` / derived render values | `$derived` / `$derived.by` |
| `useCallback` handlers | plain functions |
| `.map(x => <Foo key={x.id} …/>)` | `{#each xs as x (x.id)}` |
| `{cond && <Foo/>}` | `{#if cond}` |
| `stylex.props(styles.x)` in a page | a `<style>` block, or `<name>.stylex.ts` beside it |
| `CSSProperties` inline objects | `style="…"` strings |
| `lookaside.facebook.com` imagery | left as-is in source; `stripTemplateAssetRefs` handles scaffold |

StyleX may not be imported from a `.svelte` file, so a page needing StyleX gets a sibling
`.stylex.ts`. Most pages use plain inline styles and scoped CSS and need none.

### B7 · Batches

Ten batches by group, smallest-first so the rules settle on cheap files before the 1,200-line
ones. Line counts are upstream's `page.tsx`.

| # | Group | Slugs | Lines |
| --- | --- | --- | --- |
| 1 | Shell | blank 18, shell-top-nav 224, shell-side-nav 241, shell-nav 321, messaging-shell† 674 | 1,478 |
| 2 | Gallery | centered-hero 77, gallery-hero 94, side-gallery 142, mixed-gallery 159, product-gallery 159, classic-gallery 161 | 792 |
| 3 | Login | login‡ 98, login-card 214, login-split 275, login-sso 285 | 872 |
| 4 | Form | form-two-column 240, contact-form 292, payment-form 978 | 1,510 |
| 5 | Settings | settings 230, settings-dialog‡ 817, settings-sidebar 834 | 1,881 |
| 6 | Content | documentation-technical 256, documentation 272, product-detail 298, library 514, detail-page 631, documentation-design 757 | 2,728 |
| 7 | Table | table‡† 85, table-page 439, table-page-heatmap-status‡ 467, table-page-chart‡ 577, table-page-shoe-store-heatmap‡ 931, table-grouped 1,211 | 3,710 |
| 8 | AI Chat | ai-chat-landing 478, ai-chat 758 | 1,236 |
| 9 | Tools | ide 462, file-explorer 538, incident-console† 580, kanban-board 753, editor 956 | 3,289 |
| 10 | Dashboard + Other | dashboard-portfolio‡ 767, dashboard‡ 803, theme-showcase‡ 1,273 | 2,843 |

† `isReady: false` upstream · ‡ `isHiddenFromOverview: true` upstream

43 templates, 20,339 lines. Flags are carried through verbatim — a template upstream marks
not-ready or hidden is transcribed and recorded, and stays out of the gallery listing, because
the flags are upstream's editorial call and inverting them would be invented content.

Each batch ends with `pnpm -r build && pnpm -r check && pnpm -r lint` clean, `PORTED.md` updated,
and the pending count in `TODO.md` moved.

### B8 · Tests

Upstream ships no test suite for the page templates, so there is nothing to port case-for-case.
What B adds instead:

- a generator test that the registry lists 43 templates, 32 gallery-visible, and that every
  `hasSvelte: true` slug resolves to a real file;
- a CLI test that `template --list` now reports the core page templates that landed, since
  `_adapter.mjs`'s discovery has until now only ever been exercised through integration and
  external-package templates.

Rendering each of 43 pages in a test is not proposed: `ShowcaseThumbnail` mounts them live in the
gallery, so a page that throws is visible immediately, and `<svelte:boundary>` already contains it.

---

## A · Design

`/community`, upstream's page, retargeted. New route
`docs/src/routes/community/+page.svelte`, plus a `NAV_ITEMS` / `FOOTER_LINKS` entry — the
comment in `nav-items.ts:12` listing `/community` as absent for being "Meta's content and Meta's
accounts" is replaced by the reasoning below.

### A1 · Structure

Upstream's, in upstream's order:

1. Hero — `display-1` "Build with us", dek, and two `Button`s.
2. Contributor wall card — avatar scatter, wordmark, "See contributors".
3. "How we build together" — 4 numbered steps left, 4 `BlockCard`s right.
4. Resources — three columns (Contributing / Communications / Legal) of `List` + `ListItem`
   with `startContent` icon tiles.

### A2 · The retargeting rule

Two link classes, split the way `site-footer.svelte:27-31` already splits them:

**Actionable → this port.** Issues, PRs, contribution guide, dev setup. A reader who clicks
"file a bug" must land where Svelte bugs are accepted; `github.com/facebook/astryx` is different
software and would reject them.

**System-of-record → upstream.** `astryx.atmeta.com`, and the wiki's **API Conventions** and
**API Arbitration** — those define the API this port is required to match, so linking anywhere
else would be wrong.

**Meta's accounts are not shipped.** Facebook, Instagram, Threads and X are Meta's brand
accounts; the footer already refuses them, and re-adding them here would claim an affiliation the
site's own notice disclaims. Discord stays — it is the design system's community, useful to
anyone using either implementation. Six channels become three: this repo's Issues, this repo's
Discussions, and upstream's Discord, each labelled so the destination is unambiguous.

The Discussions link is contingent on the tab being enabled on `DevRohit06/astryx-svelte`; if it
is not, that channel is dropped rather than linked to a 404, on `nav-items.ts`'s standing rule
that "linking to a 404 is worse than not linking".

Logos needed: `GitHubLogo` and `AstryxLogo` exist in `docs/src/lib/shell/`. Discord needs one new
inline SVG. The dropped four need none.

### A3 · The four steps

Upstream's RFC steps describe proposal → co-design → ship in `@astryxdesign/lab` → graduate to
`@astryxdesign/core`. `@astryx-svelte/lab` does not exist, so steps 3 and 4 describe a gate this
repo does not have.

They are replaced with this port's real gate, which is documented and enforced:

1. **Read upstream first** — `reference/astryx-upstream/`, the `.doc.mjs`, the tests, the
   compiled `dist/`. The parity rule: if it is not in Astryx, it is not here.
2. **Port it** — `.stylex.ts` authored against the same token references upstream uses.
3. **Prove the CSS** — the class oracle diffs emitted atomic classes against upstream's published
   `dist/`. Byte-identical or it does not land.
4. **Audit** — `astryx-parity` for API drift, `astryx-idiom` for the Svelte translation,
   `astryx-test-parity` for the ported suite.

This is not upstream's prose, and the page says so. Inventing a `lab` package we do not have
would be worse.

### A4 · The four Start Here cards

Upstream's are Fix a bug / Improve the docs / Add a template / Build a theme, with effort badges
and previews. Kept, retargeted:

- **Fix a bug** → this repo's issue template.
- **Improve the docs** → this repo's issues.
- **Port a page template** → replaces "Add a template", and links at B's backlog. It is the
  largest real opening this port has, and `templates-preview.svelte` already exists to preview it.
- **Build a theme** → `/docs/theme`, unchanged; `themes-preview.svelte` exists.

### A5 · The contributor wall

Upstream fetches `api.github.com/repos/facebook/stylex/contributors` at build with a 1-hour
revalidate, falling back to Unsplash placeholders.

Here it reads **this repo's** contributors, fetched in `+page.ts` with the same graceful-empty
fallback — a wall of Meta's StyleX contributors on this port's community page would credit people
who have not worked on it. Unsplash placeholders are dropped: an empty wall on a young repo is
accurate, and the card's copy carries the invitation without them.

### A6 · Tests

Upstream ships no test for this page. One server-project test is added, for the thing most likely
to rot: that no link in the page's data tables points at `github.com/facebook/astryx`, and that
every internal `href` resolves to a route that exists. The Meta-account rule is a decision that a
future edit could quietly undo, so it gets an assertion rather than a comment.

---

## Order

A first. It is one sitting, it introduces no new pipeline, and B's backlog is what its
"Port a page template" card links to — so shipping A first gives B's ten batches a front door.

## Out of scope

`/playground`, `/blog`, `/changelog`, `/mcp` — unchanged from the v1 cut. B does not need the
playground: upstream's tiles carry an "Open in Playground" button, which is dropped here for the
same reason the block tiles dropped it.
