# Docs site design and structure parity

**Status:** audit, no code changes
**Date:** 2026-08-16
**Scope:** `docs/` (this port's SvelteKit app, live at https://astryx-svelte.rohitk06.in/) against
`reference/astryx-upstream/apps/docsite/` (Next.js, live at https://astryx.atmeta.com/). Design and
structure only — component-level fidelity (props, StyleX classes, a11y) is the class/theme/CSS
oracles' job and is out of scope here except where it changes what a page looks like or contains.

## 1. What was compared, and against which upstream commit

`reference/astryx-upstream` was read at its checked-out HEAD, **`96f9917fe013a7062a403c58e54dfd47f482d89f`**,
2026-08-14. The most recent commit touching `apps/docsite` specifically is **`833edcb7e`**,
2026-08-13 (`fix(docsite): point components "View Figma" at the community library (#5007)`). The
working tree is clean apart from this repo's own convention of renaming upstream's `CLAUDE.md` to
`UPSTREAM-CLAUDE.md`.

This port's `docs/` pins `@astryxdesign/core` and `@astryxdesign/cli` at **`0.4.1`** exact
(`docs/package.json:32`, `packages/core/package.json`). `npm view @astryxdesign/core dist-tags`
reports `{latest: '0.4.1', canary: '0.4.1-canary.8320950'}` — so this port's content pipeline reads
from exactly the version upstream's own production deploy resolves to
(`resolve-content-root.mjs:44-50`: `latest` = the published npm dist-tag, used for
`VERCEL_ENV=production`; `canary` = the live monorepo, used for every preview and local dev). That
distinction matters for one finding below (§4, Theming tab) and is stated here once rather than
re-derived per-item.

Method: read upstream source directly (route trees, component-detail components, the docsite's own
data-pipeline scripts) and this port's equivalent `docs/src` files side by side; grepped
`port/debts.md` and `port/todo.md` for every candidate gap before classifying it; read
`port/ledger/024-docs-site.md` (the sharded record of the docs-site build) and
`port/design/2026-08-15-docs-discoverability.md` (a same-week SEO/AEO/GEO audit that already covers
`llms.txt`, sitemaps and per-page markdown mirrors — referenced, not repeated, where it overlaps).
No live browser session against either deployed site; no subagents; nothing was changed.

## 2. Summary table

| #   | Area                | Difference                                                                                                                           | Classification                                          |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | Component page      | Utility-category components (providers, `VisuallyHidden`) get a live-preview Properties tab instead of upstream's static props table | Behind                                                  |
| 2   | Doc prose           | A link label that is entirely a code span renders literal backticks instead of monospace                                             | Behind                                                  |
| 3   | Doc prose           | No auto-linking of component names in `/docs/<topic>` prose                                                                          | Behind                                                  |
| 4   | Example blocks      | 58 references across 25 files to a dead internal CDN (`lookaside.facebook.com`) instead of upstream's now-self-hosted paths          | Behind                                                  |
| 5   | Landing page        | `ThemesPreview`/`TemplatesPreview` bento tiles render simplified placeholder content, not upstream's live page-template preview      | Behind                                                  |
| 6   | Route               | No `/changelog`                                                                                                                      | Behind                                                  |
| 7   | Route               | No `/llms.txt`                                                                                                                       | Behind                                                  |
| 8   | Route               | No `/mcp` (agent search/get server)                                                                                                  | Behind                                                  |
| 9   | Route               | No `/playground` (live Monaco editor + theme editor + property editor)                                                               | Behind                                                  |
| 10  | Community / gallery | No Figma community-library links                                                                                                     | Behind                                                  |
| 11  | Route               | No `/blog/txt/[slug]` plain-text mirror                                                                                              | Behind                                                  |
| 12  | Component page      | Playground missing 4 upstream controls: theme selector, syntax-theme selector, `input-status`, element/slot-list add-remove          | Behind                                                  |
| 13  | Landing page        | `BlogShowcase` section not ported                                                                                                    | Behind                                                  |
| 14  | Top nav             | End-content icons 16px vs upstream's 20px                                                                                            | Deliberate divergence                                   |
| 15  | Package deps        | `docs/` depends on `theme-chocolate`; upstream's docsite does not                                                                    | Deliberate divergence                                   |
| 16  | Route               | `/templates/blank` 404s where upstream bounces to the gallery                                                                        | Deliberate divergence                                   |
| 17  | Route               | `/templates/<slug>` is a meta-refresh bounce, not an HTTP 308                                                                        | Deliberate divergence                                   |
| 18  | Landing page        | `AboutShowcase` heading doesn't reuse Meta's "13,000 apps" claim                                                                     | Deliberate divergence (informal)                        |
| 19  | Component page      | No Theming tab                                                                                                                       | Not applicable — matches upstream's own production gate |
| 20  | Theme system        | `liquid-glass` theme + hero-reel slide                                                                                               | Ahead / additive                                        |
| 21  | Shell               | No dual latest/canary version banner                                                                                                 | Not applicable                                          |
| 22  | Docs prose          | No React-19-peer-requirement equivalent note                                                                                         | Not applicable                                          |

## 3. Behind

Ranked by how much each affects a reader trying to learn the library.

### 3.1 Utility components get a broken playground instead of a props table

Upstream added this deliberately (`1887ee2ed`, 2026-07-28, `#2733`/`#3878`):
`interactiveState.ts:211-218`

```ts
export function hasInteractivePlayground(
	comp: Pick<ComponentEntry, 'category' | 'params' | 'playground'>
): boolean {
	if (comp.params != null) {
		return false;
	}
	return comp.category !== 'Utility' || comp.playground != null;
}
```

with the docstring stating why: "Utility entries (providers and context, e.g. LinkProvider,
LayerProvider, VisuallyHidden) are non-visual, so auto-generated knobs render an empty or
meaningless stage; they get the hook-style static layout with a plain props table unless their doc
curates a playground."

This port's equivalent gate is `docs/src/routes/components/[name]/+page.svelte:76`:

```ts
const hasPlayground = $derived(!component.isHook);
```

— only the hook exclusion, no Utility-category carve-out. The generated registry does carry a
`"category": "Utility"` value (`docs/src/lib/generated/component-registry.js`, e.g. line 9742, and
`VisuallyHidden`'s own entry at line 24093), so a Utility component without a curated
`playground` reaches `ComponentPlayground` (`docs/src/lib/shell/component-playground.svelte`, which
has no category check of its own at any of its `component.playground`/`knobs` call sites) and
renders the same empty-or-meaningless stage upstream fixed three weeks before this port's own
playground work landed (ledger 2026-08-08). Not previously recorded: no hit for "Utility" or
`hasInteractivePlayground` in `port/debts.md` or `port/todo.md`. Fix is a direct port of the
upstream function plus the one conditional it gates.

### 3.2 A code span inside a link label renders literal backticks

Upstream fixed this in `3a852c19b` (2026-08-10, `#4425`): `renderInlineMarkdown` captured a link
label as raw text, so ``[`code`](url)`` rendered with visible backticks instead of monospace. The
fix lives in `inlineTokens.ts` (an `isCodeLabel` flag) and `inlineMarkdown.tsx`'s `renderLink`
(wraps the label in `<Code color="inherit">`).

This port's parser, `docs/src/lib/shell/inline-markdown.ts`, has no counterpart — its link branch
captures the label as a plain string and the renderer (`inline-markdown.svelte:14-16`) always emits
`{segment.label}` as text, never through `<Code>`. The exact string upstream's own commit message
cites as the live reproduction still ships in this port's pinned dependency, verified directly:
`@astryxdesign/cli`'s `assets/docs/internationalization.doc.mjs:94`
(`node_modules/.pnpm/@astryxdesign+cli@0.4.1_.../assets/docs/internationalization.doc.mjs`) reads

```
"... derived from the ... `locale` you pass to `<InternationalizationProvider>` via
[`Intl.Locale.getTextInfo()`](https://developer.mozilla.org/...), so RTL locales ..."
```

which our `/docs/internationalization` page renders with literal backticks around
`Intl.Locale.getTextInfo()` inside the link. Reproducible from source, not run in a browser.

### 3.3 No auto-linking of component names in doc prose

The same upstream commit (`3a852c19b`) added a second, larger feature: bare component-name mentions
in `.doc.mjs` prose, list items and table cells get auto-linked to their `/components/<name>` page —
"189 auto-links across 20 topics" per the commit message, with an explicit opt-out (backtick a
mention to keep it plain) and skip logic for existing links/code spans/fenced blocks. Implementation:
`docsLinkify.ts`, wired into `apps/docsite/src/app/(docs)/docs/[topic]/page.tsx:13` and reused from
`changelogLinkify.ts`.

No counterpart exists in `docs/scripts/generate-content.mjs` or `docs/src/routes/docs/[topic]/`
(grepped both for "autolink"/"linkify" — no hits). Every one of those 189 cross-references a reader
of this port's `/docs/<topic>` pages does not get. Lower priority than 3.1-3.2 because it is additive
navigation, not a rendering defect, but it is the single largest content-structure feature upstream
shipped in the window this audit covers.

### 3.4 Example blocks point at a dead internal CDN

Upstream self-hosted its example imagery on 2026-08-06 (`b68ee614f`, `#3973`), explicitly because
`lookaside.facebook.com` is "invisible to external contributors and unreachable without Meta network
access." The change touched `packages/cli/assets/templates/blocks/**` directly (25+ files in that
diff's stat, including `Avatar/AvatarWithImage.tsx`) and is recorded in the CLI's own
`CHANGELOG.md:64-65` ("Self-host template demo imagery in the repo instead of streaming it (#3973)").

This port's **pinned** `@astryxdesign/cli@0.4.1` already carries the fix —
`.../assets/templates/blocks/components/Avatar/AvatarWithImage.tsx` now reads
`src="/template-assets/DATA-Ami-Pena.png"`, and a repo-wide grep of that installed package's
`templates/blocks` for `lookaside.facebook.com` returns zero matches. But
`docs/src/lib/examples/Avatar/AvatarWithImage.svelte` (and 24 other files, 58 occurrences total,
confirmed by grep) still hardcodes the old `https://lookaside.facebook.com/assets/astryx/...` URLs,
and `docs/static/` has no `template-assets/` directory to serve the self-hosted images even if the
paths were swapped. This is not upstream drift this port hasn't caught up to yet — the fix is
already sitting in the pinned dependency the transcription was supposed to be re-synced against.
`port/ledger/024-docs-site.md`'s own entry on this ("`useImageMode`'s cross-origin sampling fails on
every CDN image", dated before 2026-08-13) predates the self-host commit and is now itself stale —
it reasons about a CORS failure on images that upstream no longer serves from that CDN at all.

### 3.5 The Themes/Templates bento tiles render placeholder content, and their stated blocker is gone

`docs/src/lib/landing/features-showcase.svelte:11-25` documents (and the current code confirms) that
the bento grid is already **upstream's full 3-column layout with all four tiles present** — the
2-column rebalance `port/todo.md` still describes (lines 22-23, 80-81: "Build
`ThemesPreview`/`TemplatesPreview`... both were blocked on page templates, which have since landed";
"Restore the landing bento to upstream's three columns once both tiles above exist") is **already
done**. `port/todo.md` is stale on this specific point.

What is still open, and correctly named by `port/todo.md`'s own text even though the framing is
outdated: the two tiles' **content** is a documented simplification, not upstream's composition.
`docs/src/lib/landing/themes-preview.svelte:9-17` states upstream's `ThemesPreview` renders a live,
scaled `ThemeShowcaseStore` (the `theme-showcase` page template) and this port instead shows a
swatch rail across all eight themes, "because... no page template is ported." That premise is now
false: `packages/cli/assets/templates/pages/theme-showcase/+page.svelte` exists. Likewise
`docs/src/lib/landing/templates-preview.svelte:5-16` names the seven page templates upstream's
`TemplatesPreview` renders (`product-gallery`, `ide`, `payment-form`, `login-split`,
`settings-sidebar`, `ai-chat-landing`, `product-detail`) and says "Not one page template is ported" —
all seven now exist under `packages/cli/assets/templates/pages/` (verified directly; 44 page-template
directories total). The remaining work is wiring the already-landed page templates into these two
tiles, not porting page templates first.

### 3.6-3.9 Missing routes: `/changelog`, `/llms.txt`, `/mcp`, `/playground`

All four are real upstream routes with no counterpart here, confirmed by a full file listing of
`reference/astryx-upstream/apps/docsite/src/app/`:

- **`/changelog`** (`apps/docsite/src/app/(docs)/changelog/page.tsx`) — reads every package's
  `changelog` field off `packageRegistry` and renders `ChangelogView`. This port has real
  `CHANGELOG.md` content for every package (`git status` shows one at repo root under active edit)
  but no route or generator support to surface it; `docs/scripts/generate-content.mjs:1332` even
  comments "No CHANGELOG. Upstream's registry carries one for `/changelog`". `port/todo.md:87-89`
  conflates this with `/docs/core`/`/docs/cli`, which **have** landed (confirmed: `slug === 'cli'`
  and `isCore` branches exist in `docs/src/routes/docs/[topic]/+page.ts:45,93`) — so that todo line
  is half stale.
- **`/llms.txt`** (`apps/docsite/src/app/llms.txt/route.ts`) — a short, hand-authored, CLI-centric
  plain-text response pointing agents at `npx @astryxdesign/cli` commands rather than a generated
  page index. Already the subject of a dedicated same-week audit
  (`port/design/2026-08-15-docs-discoverability.md`, Part 3 Tier 1 item 2) that this report defers
  to rather than repeating; still absent as of this audit (`find docs/static -iname '*llms*'` — no
  match).
- **`/mcp`** (`apps/docsite/src/app/mcp/route.ts`) — a real Streamable HTTP MCP server
  (`mcp-handler` + `zod`) exposing `search()`/`get()` tools over the same component/docs/block/
  template registries the pages render from. `port/todo.md:93` already names this as planned,
  unstarted work.
- **`/playground`** (`apps/docsite/src/app/playground/`, 20+ files: Monaco setup, a property editor
  with a targeting overlay, a theme editor with token panels, a sandboxed preview iframe) — the
  single largest surface gap. `port/todo.md:91-92` already tracks it as deliberately last ("a
  different problem in Svelte than upstream's `ts.transpileModule`").

### 3.10 No Figma community-library links

Upstream's `/community` page links three real, public Figma Community files ("Official Figma
library, by Meta (@meta)" and two community contributions) —
`apps/docsite/src/app/(site)/community/page.tsx:676,682,688`. The `/components` gallery hero also
carries a "View Figma" button, whose URL was itself just corrected upstream
(`833edcb7e`, 2026-08-13) to point at the same public community file instead of an internal-only
design file — `apps/docsite/src/app/(docs)/components/page.tsx:27`. Neither surface exists in this
port (`grep -rln Figma docs/src` — no hits). These are genuinely public, external resources useful to
a reader learning the design system, not Meta-internal tooling, so nothing about the parity rule
argues against linking them.

### 3.11 No per-post plain-text mirror

`apps/docsite/src/app/blog/txt/[slug]/route.ts` serves each blog post as `text/plain` at
`/blog/txt/<slug>`. This port has no counterpart. Relevant context for
`port/design/2026-08-15-docs-discoverability.md`'s Tier 1 recommendation to add per-page `.md`
mirrors (which cites Mintlify/Cloudflare Pages/PostHog as precedent) — upstream's own docsite already
does the narrower, blog-only version of exactly that idea.

### 3.12 Four playground controls with no counterpart

Already recorded, with citations, in `port/ledger/024-docs-site.md:181-184`: "Four upstream controls
have no counterpart here: the `theme` and `syntax-theme` selectors..., `input-status` (16 rows typed
`InputStatus`), and the `element`/`slot-list` add-remove controls." Restated here because it is a
direct, verified match for this audit's checklist question ("a theme switcher we lack") — it is one
of the few items in that ledger that answers this specific question, and it remains open.

### 3.13 `BlogShowcase` not ported

`docs/src/routes/+page.svelte:28-31`'s own docstring: "`BlogShowcase` is not ported. Upstream renders
it between `AboutShowcase` and `DiscoverShowcase`, built on `blogRegistry` +
`BlogCard`/`BlogFeatureCard`." Confirmed against upstream's current `(site)/page.tsx:353` (order:
`FeaturesShowcase`, `AboutShowcase`, `BlogShowcase`, `DiscoverShowcase`) and this port's
`+page.svelte:134-136` (same order, `BlogShowcase` absent). Already tracked, `port/todo.md:82-83`.

## 4. Deliberate divergences

| Item                                                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top nav end-content icons 16px vs upstream's 20px                | `port/debts.md:23-35`, `kind: deliberate-divergence`, `retires: never` — "A deliberate divergence on the maintainer's call... Equalising was the fix; 16 rather than 20 is the divergence."                                                                                                                                                                                                   |
| `docs/` depends on `theme-chocolate`; upstream's docsite doesn't | `port/debts.md:148-165`, `kind: deliberate-divergence` — inert dependency, `themeFor()` never reached for it, kept so the shipped `theme-chocolate` package has at least one page loading its stylesheet                                                                                                                                                                                      |
| `/templates/blank` 404s, upstream bounces                        | `port/debts.md:76-86`, `kind: deliberate-divergence` — "A 404 says more, but it _is_ a divergence rather than an improvement, and it is recorded as one"                                                                                                                                                                                                                                      |
| `/templates/<slug>` is a meta-refresh bounce, not HTTP 308       | `port/debts.md:88-102`, `kind: deliberate-divergence`, `retires: when adapter-vercel can express a redirect rule` — forced by SvelteKit's full-prerender constraint, not a design choice                                                                                                                                                                                                      |
| `AboutShowcase` heading doesn't reuse Meta's "13,000 apps" claim | `port/todo.md:84-86` — not yet formalized in `debts.md`; the todo item itself asks whether it should be, so treated here as intentional-but-not-yet-logged rather than settled                                                                                                                                                                                                                |
| No Theming tab on component pages                                | Not upstream drift at all once `CURRENT_TARGET` is read (`docsVersions.ts:57-64`): `ComponentDetailClient.tsx:160-161` gates the tab on `CURRENT_TARGET === 'canary'`. Production (`latest`, the npm dist-tag this port's `0.4.1` pin matches exactly) never renders it. Matching upstream's production behavior is not a gap — see Open questions for the one nuance this leaves unresolved. |

## 5. Ahead / additive

**`liquid-glass` theme, including its own hero-reel slide** — no upstream counterpart. Already
reasoned through at length in `port/debts.md:167-291` (nine entries covering the theme itself, the
Safari `backdrop-filter`/`var()` bug, concentric radii, the reduced-transparency behavior, and the
hero-reel entry specifically at `port/debts.md:167-181`). The parity argument made there and worth
restating: the hero-reel slide "rides the local-theme seam upstream already wrote for the docsite's
own brand theme... rather than a fabricated `@astryxdesign/theme-liquid-glass` key," reuses the
vendored Neutral photo set rather than inventing demo assets, and is identifiable as the one
non-upstream slide by its key alone. This is additive in a way the parity rule's own carve-out
anticipates (the rule governs the component library; the docs _site_ choosing to also demo a
port-only theme package is a docs-site decision, not a component-library one) — defensible as
written, and already documented as such rather than found fresh by this audit.

Nothing else in the routes, shell, or landing-page comparison surfaced content this port has that
upstream lacks.

## 6. Open questions

- **Whether the Utility-playground bug (§3.1) is visually confirmed broken, not just logically
  present.** This audit read `hasPlayground`'s definition and the registry's `category` field; it did
  not load `/components/VisuallyHidden` in a browser (out of scope per this audit's instructions).
  The code path is unambiguous, but "renders an empty or meaningless stage" is upstream's own
  description of the failure mode, not independently observed here.
- **The sitemap discrepancy from `port/design/2026-08-15-docs-discoverability.md`** (391 live URLs
  vs. 288 computed from the checked-out registries) was flagged there as unresolved one day before
  this audit and was not re-checked here; it would affect confidence in any route-count claim made
  against the live site rather than against source, which is why this audit stayed source-only.
- **`port/todo.md`'s "Docs site" section has at least two stale items** beyond the bento-tile one
  corrected in §3.5: it lists `/docs/core`/`/docs/cli` as blocked (they are landed) bundled with
  `/changelog` (which is genuinely still missing). This is a backlog-hygiene observation, not a
  parity finding, but it means `port/todo.md` should not be trusted as a current source for docs-site
  gaps without cross-checking the code, which is what this audit did throughout.
- **Three recent upstream docsite/core commits were not deep-audited**: `6b81ba608` (Stepper audit
  hardening — a11y, theming, responsive labels, docs blocks), `2228f00bd` (seed DropdownMenu
  properties-tab preview with defaults), and `462790cbe` (keep component preview leading edge visible
  on overflow). All three read as component-level or single-page CSS fixes rather than site-wide
  design/structure, which is why they were triaged out, but that triage was not verified against this
  port's current rendering.
- **Whether `docs-discoverability.md`'s Tier 1 recommendations (`llms.txt`, `.md` mirrors,
  `BreadcrumbList` JSON-LD, the blog feed) have since been scheduled** was not re-checked; that
  document is one day older than this one and this audit treated its findings as still current
  without re-verifying `docs/static/` a second time beyond confirming `llms.txt`'s continued absence.
