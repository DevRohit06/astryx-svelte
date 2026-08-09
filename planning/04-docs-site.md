# 04 — Astryx Docs Site: Information Architecture, Content Pipeline & Port Plan

Research target: `https://astryx.atmeta.com/` + `apps/docsite/` in the upstream monorepo
(`facebook/astryx`). Written for a 1:1 SvelteKit port modelled on how `shadcn-svelte`
rebuilt `ui.shadcn.com`.

Upstream clone used:
`C:\Users\Rohit\AppData\Local\Temp\claude\D--astryx-svelte\958fb66c-28ed-4759-8e20-87f238de1788\scratchpad\astryx-upstream`

---

## 0. TL;DR

| Fact | Value |
|---|---|
| Total URLs in `sitemap.xml` | **278** |
| Top-level pages | 9 |
| `/components/*` detail pages | 200 |
| `/docs/*` pages | 22 (20 topics + 2 package pages) |
| `/templates/*` pages | 42 |
| `/blog/*` posts | 5 |
| Non-sitemap routes | `/playground/preview`, `/mcp`, `/rss.xml`, `/robots.txt`, `/sitemap.xml`, `/blog/<slug>.txt`, `/themes?theme=<slug>` |
| Docs authored as MDX? | **No. Zero MDX/Markdown in the docs pipeline.** |
| Component docs source | `packages/core/src/<Name>/<Name>.doc.mjs` (883 `.doc.mjs` files repo-wide) |
| Long-form docs source | `packages/cli/docs/<topic>.doc.mjs` (structured `ContentBlock[]` JSON-ish objects) |
| Blog source | Markdown + YAML frontmatter, `apps/docsite/src/content/blog/posts/*.md` (the **only** markdown content) |
| Framework | Next.js 16 (App Router, RSC) + React 19 + StyleX |
| Content pipeline | `pnpm generate` → 5 build scripts → `src/generated/*.ts` typed registries |

---

## 1. Complete Site Map

### 1.1 Top level (9)

```
/                      Landing / marketing page
/components            Component gallery (categorised)
/docs                  → 308 redirect to /docs/getting-started
/templates             Templates gallery
/themes                Theme browser (single canonical surface)
/blog                  Blog index
/changelog             "What's New" — aggregated package CHANGELOG.md
/community             Community page
/playground            Monaco + live TSX playground
```

### 1.2 `/docs/*` (22)

**Guide** (`category: 'guide'` in the reference doc):

```
/docs/getting-started        Getting Started       (promoted to its own sidebar item)
/docs/browser-support        Browser Support
/docs/cli-integrations       CLI Integrations
/docs/internationalization   Internationalization
/docs/layout                 Layout
/docs/migration              Migration Guide
/docs/principles             Principles
/docs/styling                Styling Components
/docs/styling-libraries      Styling Library Interop
/docs/theme                  Theme System
/docs/working-with-ai        Working with AI
```

**Foundations** (`category: 'foundations'`; `tokens` is force-sorted first, rest alphabetical):

```
/docs/tokens                 All Tokens        (no explicit category — sorted first)
/docs/color                  Color
/docs/elevation              Elevation
/docs/icons                  Icons
/docs/illustrations          Illustrations
/docs/motion                 Motion
/docs/shape                  Shape
/docs/spacing                Spacing
/docs/typography             Typography
```

**Libraries** (auto-derived: every non-`private`, non-`theme-*` package that the docsite
depends on; rendered as a README "package stub" page, not a reference doc):

```
/docs/core                   @astryxdesign/core
/docs/cli                    @astryxdesign/cli
```

> Note: `@astryxdesign/charts` is `astryx.canaryOnly`, so it appears on the canary
> deploy but not on production `latest`. Theme packages are deliberately excluded
> here — they live under `/themes`.

### 1.3 `/components/<Name>` (200)

Route: `src/app/(docs)/components/[name]/page.tsx`, `generateStaticParams` from
`flattenComponentSidebarEntries()`. Names are the **React export identifier**
(PascalCase for components, `useX` camelCase for hooks) — not slugified.

Sidebar/gallery grouping (from the `group` field on each doc), in the order the
sidebar renders them:

| Group | Entries |
|---|---|
| AppShell | `AppShell`, `useAppShellMobile` |
| (flat) | `AspectRatio` |
| Avatar | `Avatar`, `AvatarGroup`, `AvatarGroupOverflow`, `AvatarStatusDot` |
| (flat) | `Badge`, `Banner`, `Blockquote` |
| Breadcrumbs | `BreadcrumbItem`, `Breadcrumbs` |
| Button | `Button`, `ButtonGroup`, `IconButton`, `ToggleButton`, `ToggleButtonGroup` |
| (flat) | `Calendar` |
| Card | `Card`, `ClickableCard`, `SelectableCard` |
| (flat) | `Carousel` |
| Chat | `ChatComposer`, `ChatComposerDrawer`, `ChatComposerInput`, `ChatComposerTokenElement`, `ChatDictationButton`, `ChatLayout`, `ChatLayoutScrollButton`, `ChatMessage`, `ChatMessageBubble`, `ChatMessageList`, `ChatMessageMetadata`, `ChatSendButton`, `ChatSystemMessage`, `ChatTokenizedText`, `ChatToolCalls` |
| Checkbox | `CheckboxInput`, `CheckboxList`, `CheckboxListItem` |
| (flat) | `Citation` |
| Code | `Code`, `CodeBlock` |
| Collapsible | `Collapsible`, `CollapsibleGroup`, `useCollapsible` |
| CommandPalette | `CommandPalette`, `CommandPaletteEmpty`, `CommandPaletteFooter`, `CommandPaletteGroup`, `CommandPaletteInput`, `CommandPaletteItem`, `CommandPaletteList` |
| ContextMenu | `ContextMenu`, `ContextMenuItem` |
| Date | `DateInput`, `DateRangeInput`, `DateTimeInput` |
| Dialog | `AlertDialog`, `Dialog`, `DialogHeader`, `useImperativeAlertDialog`, `useImperativeDialog` |
| (flat) | `Divider` |
| DropdownMenu | `DropdownMenu`, `DropdownMenuItem` |
| (flat) | `EmptyState` |
| Field | `Field`, `FieldLabel`, `FieldStatus`, `InputGroup`, `InputGroupText` |
| (flat) | `FileInput`, `Heading` |
| HoverCard | `HoverCard`, `useHoverCard` |
| (flat) | `Icon`, `Item`, `Kbd` |
| Layout | `Center`, `FormLayout`, `Grid`, `GridSpan`, `HStack`, `Layout`, `LayoutContent`, `LayoutFooter`, `LayoutHeader`, `LayoutPanel`, `Section`, `StackItem`, `VStack` |
| (flat) | `Lightbox`, `Link` |
| List | `List`, `ListItem` |
| (flat) | `Markdown` |
| MetadataList | `MetadataList`, `MetadataListItem` |
| (flat) | `MoreMenu` |
| Nav | `MobileNav`, `MobileNavToggle`, `NavHeadingMenu`, `NavIcon`, `SideNav`, `SideNavCollapseButton`, `SideNavHeading`, `SideNavItem`, `SideNavSection`, `TopNav`, `TopNavHeading`, `TopNavItem`, `TopNavMegaMenu`, `TopNavMegaMenuFeaturedCard`, `TopNavMegaMenuItem`, `TopNavMenu` |
| (flat) | `NumberInput`, `Outline`, `OverflowList`, `Overlay`, `Pagination` |
| Popover | `Popover`, `usePopover` |
| (flat) | `PowerSearch`, `ProgressBar` |
| Radio | `RadioList`, `RadioListItem` |
| Resize | `ResizeHandle`, `useResizable` |
| SegmentedControl | `SegmentedControl`, `SegmentedControlItem` |
| Selector | `MultiSelector`, `Selector`, `SelectorOption` |
| (flat) | `Skeleton`, `Slider`, `Spinner`, `StatusDot`, `Switch` |
| Table | `Table`, `TableCell`, `TableHeaderCell`, `TableRow`, `useTableColumnResize`, `useTableColumnSettings`, `useTableFiltering`, `useTableFilterState`, `useTableGroupedRows`, `useTablePagination`, `useTableRowExpansion`, `useTableRowIndex`, `useTableSelection`, `useTableSelectionState`, `useTableSortable`, `useTableStickyColumns` |
| Tabs | `Tab`, `TabList`, `TabMenu` |
| (flat) | `Text`, `TextArea`, `TextInput`, `Thumbnail`, `TimeInput`, `Timestamp` |
| Toast | `Toast`, `useToast` |
| Token | `Token`, `Tokenizer` |
| (flat) | `Toolbar` |
| Tooltip | `Tooltip`, `useTooltip` |
| (flat) | `TreeList` |
| Typeahead | `BaseTypeahead`, `Typeahead`, `TypeaheadItem` |
| (flat) | `VisuallyHidden` |
| **Utilities** (collapsed by default, rendered last) | `InternationalizationProvider`, `LayerProvider`, `LinkProvider`, `MediaTheme`, `SyntaxTheme`, `Theme`, `useClickableContainer`, `useEntryAnimation`, `useFocusTrap`, `useGridFocus`, `useHotkeys`, `useImageMode`, `useInputContainer`, `useKeyboardHint`, `useLayer`, `useListFocus`, `useMediaQuery`, `useOverflow`, `useScrollLock`, `useScrollOverflow`, `useStreamingText`, `useTheme`, `useTranslator`, `useTreeFocus` |

Grouping rules (from `generateGroupedComponentRegistry` in `generate-data.mjs`):
- `hidden: true` → excluded entirely from the sidebar.
- `group === 'Utilities'` **or** a `useX` hook living in `src/hooks/` with no parent → Utilities bucket.
- A group with exactly **one** member is flattened to a plain sidebar entry (no expander).
- Group label = the member whose `name` equals the group label; otherwise the group
  label is humanised (`ChatComposer` group `Chat` → `Chat`, not `Chat Composer`).
- Items sorted alphabetically by `sortKey` (group label or entry name).

### 1.4 `/templates/<slug>` (42)

```
ai-chat                        ai-chat-landing            centered-hero
classic-gallery                contact-form               dashboard
dashboard-portfolio            detail-page                documentation
documentation-design           documentation-technical    editor
file-explorer                  form-two-column            gallery-hero
ide                            incident-console           kanban-board
library                        login                      login-card
login-split                    login-sso                  messaging-shell
mixed-gallery                  payment-form               product-detail
product-gallery                settings                   settings-dialog
settings-sidebar               shell-nav                  shell-side-nav
shell-top-nav                  side-gallery               table
table-grouped                  table-page                 table-page-chart
table-page-heatmap-status      table-page-shoe-store-heatmap
theme-showcase
```

Source: `packages/cli/templates/pages/<slug>/` (43 dirs; `blank` is `scaffold: true`
and is skipped). Each dir has `template.doc.mjs` + `page.tsx`. The `page.tsx` source
is inlined verbatim into `templateRegistry.ts`.

### 1.5 `/blog/<slug>` (5)

| Slug | Title | Date | Type | Authors |
|---|---|---|---|---|
| `astryx-cli-build-command` | AI is a copycat so we gave it good examples to copy | 2026-07-17 | engineering | josephfarina |
| `the-astryx-cli` | The best CLI is one you never run | 2026-07-10 | engineering | josephfarina |
| `astryx-v0-1-3` | Astryx v0.1.3: better tables, keyboard navigation, and accessibility | 2026-07-04 | update | team |
| **`how-astryx-works`** | **How Astryx works** | 2026-06-29 | engineering | cvkxx, cixzhang |
| **`introducing-astryx`** | Introducing Astryx by Meta: an open source design system built for how we build now | 2026-06-18 | update | team |

(Both `/blog/introducing-astryx` and `/blog/how-astryx-works` exist and are live.)

### 1.6 Routes NOT in the sitemap

| Route | File | Purpose |
|---|---|---|
| `/docs` | `(docs)/docs/page.tsx` | `redirect('/docs/getting-started')` |
| `/playground/preview` | `playground/preview/page.tsx` | The sandboxed **iframe** the playground renders user code into |
| `/mcp` | `app/mcp/route.ts` | MCP server (Streamable HTTP) exposing `search()` / `get()` over the same registries |
| `/rss.xml` | `app/rss.xml/route.ts` | Blog RSS feed |
| `/blog/<slug>.txt` | rewrite → `/blog/txt/[slug]/route.ts` | Plaintext/LLM-friendly post body |
| `/robots.txt`, `/sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` | Generated from the registries |
| `/themes/<name>` | legacy | Redirects to `/themes?theme=<slug>` |
| `/not-found` | `app/not-found.tsx` | 404 |

---

## 2. Navigation Structure

### 2.1 Top nav — `src/components/SharedTopNav.tsx`

Rendered on **every** route group (site, docs, blog, playground).

**Left:** Astryx mark (`AstryxIcon`, `--color-brand`), links to `/`.

**Center** (`NAV_ITEMS`, in order):

| Label | Href | Active when pathname… |
|---|---|---|
| Docs | `/docs/getting-started` | `=== '/docs'` or starts with `/docs/` or `/changelog` |
| Components | `/components` | starts with `/components` |
| Templates | `/templates` | starts with `/templates` |
| Themes | `/themes` | starts with `/themes` |
| Playground | `/playground` | starts with `/playground` |

**Right (endContent):**
1. Search icon button → opens `SearchPalette` (also `⌘K` / `Ctrl+K`)
2. Light/dark toggle (Moon/Sun; CSS `prefers-color-scheme` decides first paint while
   mode is `'system'`, so no hydration flip)
3. Community icon button → `/community`
4. GitHub icon button → `https://github.com/facebook/astryx`
5. Primary "Get started" button → `/docs/getting-started`
6. Hamburger (≤768px, only when AppShell isn't already supplying one)

Mobile: desktop links and hamburger are **both in the DOM**; a pure CSS
`@media (max-width: 768px)` picks one, so SSR HTML is correct on first paint. On docs
routes AppShell owns the drawer; elsewhere `SharedTopNav` renders its own `MobileNav`.

**Canary banner:** when `CURRENT_TARGET === 'canary'`, a `<CanaryBanner />` is passed
as `AppShell banner`.

### 2.2 Sidebar — `src/components/DocsShell.tsx`

Only exists inside the `(docs)` route group (`/docs/*`, `/components/*`, `/changelog`).
It is **mode-switching** on `pathname.startsWith('/components')`:

**Mode A — docs routes** (`/docs/*`, `/changelog`):

```
Documentation            (header hidden)
  Getting Started        → /docs/getting-started
  What's New             → /changelog
Guide                    (collapsible, defaultIsCollapsed: false)
  …guide topics, alphabetical by title, minus getting-started
Foundations              (collapsible, defaultIsCollapsed: false)
  Tokens                 (forced first)
  …remaining foundations topics, alphabetical by title
Libraries                (collapsible, defaultIsCollapsed: false)
  @astryxdesign/core     → /docs/core
  @astryxdesign/cli      → /docs/cli
```

**Mode B — `/components*`** (every non-component section is hidden):

```
[TextInput "Search components…" pinned as SideNav topContent, with clear button]
Components               (header hidden)
  Overview               → /components          (hidden while searching)
  …grouped entries (single-member groups flattened; multi-member groups are
    collapsible, auto-expanded when the active pathname is inside them)
  Utilities              (collapsible, defaultIsCollapsed: true — always collapsed)
    …hooks + providers
```

While the search box has a query, groups are **flattened** to a single-level filtered
list (case-insensitive substring match on `displayName`) and the "Overview" item and
the Utilities expander are dropped.

### 2.3 On-this-page outline

`src/components/docs/DocPageLayout.tsx` renders a right-hand sticky `<Outline>` aside
(232px, `position: sticky`) on ≥1024px, and a `<Selector>` jump-menu pinned under the
header below that breakpoint. Both are always styled for their side of the breakpoint
so SSR is jank-free; `useMediaQuery` mounts only one. Anchors resolve to section ids
that pages assign via `AnchorHeading`.

### 2.4 Footer — `src/components/SiteFooter.tsx`

Present on **all** route groups (site, docs, blog).

**Nav links** (`FOOTER_LINKS`, in order): Docs (`/docs/getting-started`), Components,
Templates, Themes, Playground, Blog, Community, Changelog — plus a
`<DocsVersionFooterLink />` that toggles between the canary and latest docs deploys.

**Social** (`SOCIAL_LINKS`, icon buttons):
GitHub `github.com/facebook/astryx` · Discord `discord.com/invite/XnsUcFykEP` ·
Facebook `facebook.com/astryxdesign` · Instagram `instagram.com/astryxdesign` ·
Threads `threads.com/@astryxdesign` · X `x.com/Astryxdesign`

**Legal:** Terms of use `opensource.fb.com/legal/terms` · Privacy policy
`opensource.fb.com/legal/privacy`. Plus Astryx wordmark + Meta Open Source logo +
copyright year (server-computed via `getCopyrightYear()`).

### 2.5 Command palette (`⌘K`)

`SearchPalette.tsx` builds a `createStaticSource` over the union of components (from
the **same** grouped registry as the sidebar), packages, doc topics, and templates.
Keywords come from `getSearchItemKeywords` which reads the `.doc.mjs` `keywords`
arrays. **There is no external search service (no Algolia, no Pagefind)** — the whole
index ships in the JS bundle as generated data.

---

## 3. How Docs Pages Are Authored & Generated

### 3.1 The headline answer

**There is no MDX and no Markdown in the component/docs pipeline.** `apps/docsite`
has zero MDX dependencies (`next-mdx-remote`, `@mdx-js/*`, `contentlayer`, `velite`,
`gray-matter`, `remark`, `rehype`, `shiki` — all absent from `package.json`).

Content comes from **three** places:

| Content | Source of truth | Format |
|---|---|---|
| Component & hook pages | `packages/*/src/<Dir>/<Name>.doc.mjs` | JS object literal (`export const docs`) |
| Long-form docs (`/docs/<topic>`) | `packages/cli/docs/<topic>.doc.mjs` | JS object with `sections[].content[]` **ContentBlock** array |
| Package pages (`/docs/core`, `/docs/cli`), `/changelog` | package `README.md` / `CHANGELOG.md` | Markdown, rendered by the in-house `<Markdown>` core component |
| Blog | `apps/docsite/src/content/blog/posts/*.md` | Markdown + YAML frontmatter (the only markdown authoring surface) |
| Live examples & templates | `packages/cli/templates/{blocks,pages}/**/*.tsx` + sibling `*.doc.mjs` | Real compilable TSX |

This is deliberate: the CLI (`astryx docs <topic>`, `astryx component <name>`) and
the MCP server consume the same `.doc.mjs` objects directly — "no markdown parsing
needed" (`docs-types.ts` header comment).

### 3.2 The build pipeline

`package.json`:

```
generate = build:theme
        && node scripts/generate-data.mjs
        && node scripts/generate-scope.mjs
        && node scripts/generate-playground-types.mjs
        && node scripts/copy-vendor.mjs
dev   = pnpm generate && next dev --webpack
build = pnpm generate && next build --webpack
```

#### `scripts/resolve-content-root.mjs` (262 lines) — versioned content

Decides **which version of the packages supplies the documented data**:

- `DOCSITE_TARGET=canary` (default for previews/dev, and when `VERCEL_ENV !== production`)
  → `CONTENT_ROOT = REPO_ROOT`, i.e. the live workspace.
- `DOCSITE_TARGET=latest` (production) → reads `npm view @astryxdesign/core@latest version`,
  then `npm pack`s every publishable `@astryxdesign/*` dep and untars them into
  `.content-cache/npm-<version>/` laid out **exactly like the monorepo** (with a
  synthetic `pnpm-workspace.yaml`), so discovery code is unchanged. Published tarballs
  ship `src/`, so the `.doc.mjs` files are present.
- `cliRoot` is **never** pinned — template/example TSX is live-rendered against the
  bundled `@astryxdesign/core`, so pinning it would break renders.

#### `scripts/generate-data.mjs` (1600 lines) — the core generator

Discovers packages by expanding the `packages:` globs of `CONTENT_ROOT`'s
`pnpm-workspace.yaml`, then emits typed TS registries into `src/generated/`:

| Output | Built from | Notes |
|---|---|---|
| `packageRegistry.ts` | each `packages/*/package.json` + `README.md` + `CHANGELOG.md` | Full README/CHANGELOG text inlined |
| `componentRegistry.ts` | **dynamic `import()`** of every `*.doc.mjs` under each package's `src/` | The flattened per-component entries; functions/symbols stripped by `sanitizeForJson` |
| `groupedComponentRegistry.ts` | the above | Sidebar shape (`items[]` + `utilities[]`) |
| `blockRegistry.ts` | `packages/cli/templates/blocks/**/*.doc.mjs` + sibling `.tsx` | 588 blocks; raw TSX `source` inlined |
| `templateRegistry.ts` | `packages/cli/templates/pages/*/template.doc.mjs` + `page.tsx` | 42 (skips `scaffold: true`) |
| `docsRegistry.ts` | `packages/cli/docs/*.doc.mjs` (skips `.doc.zh.` / `.doc.dense.`) | 20 topics with full `sections[]` |
| `blogRegistry.ts` | `src/content/blog/posts/*.md` via `src/lib/blog/posts.mjs` | Drafts excluded when `NODE_ENV=production` |
| `themeRegistry.ts` + `themes.css` | `packages/themes/*` | `themeObjects` (tokens-only `/built`) + `themeObjectsFull` (with component overrides) |
| `showcaseRegistry.ts` + `generated/showcases/*.tsx` | blocks with `isShowcase: true` (+ `alsoShowcaseFor` aliases) | 153 showcases; TSX **copied** so Next compiles it |
| `exampleRegistry.ts` + `generated/examples/*.tsx` | blocks with `isShowcase` falsy (+ `alsoExampleFor` aliases) | TSX **copied**; each entry carries `{name, description, source, load: () => import(...)}` |

Important detail: `.doc.mjs` files are **actually `import()`-ed at build time** — they
are executable ES modules, not parsed. There is a regex-based fallback
(`readDocMeta`/`extractQuotedField`, with a hand-written JS string-literal parser) used
only when the import throws, and for cheap metadata scans of block docs.

Hard validation: `requireDisplayName()` **throws the build** if any doc entry lacks an
explicit `displayName`. A codemod (`scripts/backfill-display-name.mjs`) backfills it.

Type-reference extraction: `src/lib/typeDefinitions.mjs` builds an index of exported
types per package; any prop whose `type` string references one gets
`prop.typeRefs: string[]` plus a `comp.typeDefs: TypeDefinition[]` carrying the extracted
TS declaration + repo-relative `sourcePath`, so the props table can pop the real type.

#### `scripts/generate-scope.mjs` (317 lines)

Emits `src/generated/playground-scope.ts` — a module map for the playground's
in-browser `require`. Reads `packages/core/package.json` `exports`, filters PascalCase
subpaths, and generates `import * as X from '@astryxdesign/core/X'` for each, plus
hooks, tokens, two themes, `lucide-react`, four Heroicons variants, a `next/image` stub,
and a **~120-line runtime StyleX mock** (`stylex.create`/`props` reimplemented as atomic
classes injected into a shared `<style>` element, so `@media`/`@container`/pseudo
conditions survive without the StyleX compiler).

#### `scripts/generate-playground-types.mjs` (194 lines)

Bundles `.d.ts` text for Monaco's TS language service.

#### `scripts/copy-vendor.mjs` (65 lines)

Copies `monaco-editor/min/vs` → `public/monaco/vs` and
`typescript/lib/typescript.js` → `public/vendor/typescript.js`. Everything is
self-hosted because "corpnet blocks CDNs".

### 3.3 Verdict for the Svelte port

**The content source is 100% reusable.** `.doc.mjs` files are framework-agnostic plain
JS objects — prop names, types, descriptions, defaults, best practices, anatomy,
theming vars, keywords, categories. A SvelteKit port can run an equivalent generator
over the same files with **zero content authoring**.

What is **not** reusable as-is:
- `props[].type` strings are React types (`ReactNode`, `ReactElement<IconProps>`,
  `(e: MouseEvent) => void`) → need a Svelte mapping layer (`Snippet`, `class`, event props).
- `slotElements` / `playground.defaults` `ElementDescriptor`s resolve via
  `React.createElement(Core[name], props, children)` → needs a Svelte
  `<svelte:component>` / snippet-based resolver.
- `theming.targets` / `vars` are CSS-level and port unchanged.
- Every example/showcase/template is a React `.tsx` file → must be rewritten as `.svelte`.
  **This is the single largest port cost: 588 example blocks + 42 page templates.**

---

## 4. `.doc.mjs` Format Specification

Canonical types: `packages/core/src/docs-types.ts` (1104 lines of JSDoc'd interfaces).
Every file is:

```js
// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('../docs-types').ComponentDoc} */
export const docs = { /* … */ };

/** @type {import('../docs-types').ComponentDoc} */
export const docsZh = { /* Chinese overlay */ };     // optional

/** @type {import('../docs-types').TranslationDoc} */
export const docsDense = { /* token-compressed overlay for AI */ }; // optional
```

Only `docs` reaches the docsite. `docsZh` / `docsDense` are merged by the CLI at read
time (they are prose-only overlays; props/types/code always come from `docs`).

### 4.1 `ComponentDoc` — a union of three shapes

```ts
type ComponentDoc = SingleComponentDoc | MultiComponentDoc | SubComponentDoc;
```

| Shape | Discriminator | Used when |
|---|---|---|
| `SingleComponentDoc` | has `props: PropDoc[]` | directory exports one component (Switch, Badge, Button) |
| `MultiComponentDoc` | has `components: (ComponentEntry \| ComponentRef)[]` | directory exports several (Table, Dialog, TabList) |
| `SubComponentDoc` | has `subComponentOf: string` | a sub-component extracted into its own sibling `.doc.mjs` inside the parent dir |

Plus two sibling formats: `HookDoc` (has `params` + `returns`) and `ReferenceDoc`
(long-form docs, §4.7).

### 4.2 `BaseDoc` — shared fields

| Field | Type | Req | Meaning |
|---|---|---|---|
| `name` | `string` | ✅ | Directory/export name, PascalCase, no prefix. `"Button"`, `"TextInput"` |
| `displayName` | `string` | ✅ **(build fails without it)** | Human label with spaces: `"AppShell"` → `"App Shell"`. Hooks keep the raw identifier (`"useMediaQuery"`). |
| `keywords` | `string[]` | | Lowercase search synonyms for CLI fuzzy match, `⌘K` palette, and MCP keyword index. |
| `group` | `string` | | Sidebar cluster label. Absent → flat alphabetical. |
| `category` | enum | | Overview-gallery bucket. One of: `Action`, `Chat`, `Container`, `Content`, `Data Input`, `Data Visualization`, `Feedback & Status`, `Layout`, `Navigation`, `Overlay`, `Table & List`, `Utility`. |
| `hidden` | `boolean` | | Hide from **all** human UI (still importable, still visible to agents). |
| `hiddenComponents` | `string[]` | | Names of sub-components to hide from catalogs. |
| `isHiddenFromOverview` | `boolean` | | Keep in sidebar + CLI, drop from the `/components` gallery. |
| `usage` | `UsageDoc` | ✅ | Prose + guidance (§4.4). |
| `theming` | `ThemingDoc` | | Selector surface + CSS vars (§4.5). |
| `playground` | `PlaygroundConfig` | | Interactive preview config (§4.6). |
| `examples` | `ExampleDoc[]` | | `{label?, code}` — short snippets the **CLI** prints after the props table. (The docsite uses `exampleRegistry` blocks instead.) |

### 4.3 `PropDoc`

```ts
interface PropDoc {
  name: string;          // exact JSX prop name. callbacks `onX`, booleans `isX`/`hasX`
  type: string;          // stringified TS. Single-quoted string-literal unions.
  description: string;   // 1–2 sentences, behavior + consequence
  default?: string;      // stringified: "'md'", "false", "0". Omit for required props.
  required?: boolean;    // omit (don't set false) when optional
  slotElements?: ElementDescriptor[]; // for ReactNode slots: what the playground may inject
}
```

Generator-added fields (not authored): `typeRefs?: string[]` — names of package-exported
types referenced by `type`, resolvable against the entry's `typeDefs`.

### 4.4 `UsageDoc`

```ts
interface UsageDoc {
  description: string;              // 2–3 sentences: what it is; when to use it
  bestPractices?: BestPractice[];   // {guidance: boolean, description: string}
                                    //   true → green "Do" badge; false → red "Don't"
                                    //   description must NEVER start with Do/Don't
  anatomy?: AnatomyElement[];       // {name, required: boolean, description}
                                    //   ordered leading→trailing / top→bottom
}
```

The `componentRegistry.ts` output type also declares `features?: string[]`,
`accessibility?: string[]`, `keyboard?: string`, `notes?: string[]` on `UsageDoc` —
these are pass-through fields the generator will carry if present, but they are **not**
in the authored `docs-types.ts` contract and are **not rendered** by the current
component detail page. Treat them as vestigial.

### 4.5 `ThemingDoc`

```ts
theming: {
  container?: boolean;         // padding props expand to container tokens
  targets: ThemingTarget[];    // {className: 'astryx-button', visualProps?: string[], states?: string[]}
  vars?: ComponentVar[];       // {name: '--button-press-scale', description, default,
                               //  derived?, formula?, private?}
  derived?: DerivedVar[];      // {property: 'borderRadius', vars?: ['--_button-radius'],
                               //  expand?: 'container'}
}
```

`className` always starts with `astryx-`. `visualProps` are reflected as `data-*`
attributes (`variant` → `[data-variant="secondary"]`); `states` reflect runtime state
(`[data-checked="checked"]`). `private: true` vars are hidden from CLI output and
`astryx theme build` errors if a theme sets them directly.

### 4.6 `PlaygroundConfig` + `ElementDescriptor`

```ts
interface PlaygroundConfig {
  defaults?: Record<string, unknown>;   // prop → primitive | ElementDescriptor
  overlay?: boolean;                    // full-viewport overlay (MobileNav, Lightbox):
                                        //   preview shows an open-trigger placeholder
  wrapper?: {component: string; props?: Record<string, unknown>};
                                        // required parent context provider, e.g.
                                        //   {component: 'TabList', props: {value: 'tab-1'}}
}

interface ElementDescriptor {
  __element: string;                    // component name, resolved via Core[name]
  props?: Record<string, unknown>;
  children?: string | ElementDescriptor | (string | ElementDescriptor)[];
}
```

`ElementDescriptor` is the serialisable stand-in for JSX — it exists precisely because
the registry is JSON. **This is the cleanest part to port**: a Svelte resolver just needs
a name→component map and Svelte 5 snippets for children.

### 4.7 `ReferenceDoc` (long-form `/docs/<topic>`)

```ts
interface ReferenceDoc {
  name: string;            // URL slug + CLI topic name, e.g. 'getting-started'
  title: string;           // 'Getting Started'
  description: string;     // one-line summary for listings
  category?: 'guide' | 'foundations';
  tokenCategory?: string;  // links the tokens overview → this doc
  sections: ReferenceSection[];
}

interface ReferenceSection {
  title: string;                 // becomes an h2 + anchor + outline entry
  content: ContentBlock[];
  previewType?: TokenPreviewType;
}

type ContentBlock =
  | {type: 'prose';     text: string}
  | {type: 'code';      lang: string; code: string; label?: string}
  | {type: 'table';     headers: string[]; rows: string[][]}
  | {type: 'list';      style: 'ordered'|'unordered'|'do'|'dont'; items: string[]}
  | {type: 'token-ref'; topic: string; section: string};  // inlines another doc's table

type TokenPreviewType =
  | 'swatch' | 'shadow-box' | 'radius-box' | 'spacing-bar' | 'size-bar'
  | 'border-line' | 'duration-bar' | 'easing-curve' | 'font-sample';
```

Prose text supports light inline markdown, rendered by
`src/components/docs/inlineMarkdown.tsx` (not a full markdown engine).

### 4.8 `TemplateDoc` (blocks + page templates)

```ts
// packages/cli/templates/pages/<slug>/template.doc.mjs
export const doc = {
  type: 'page', name, displayName, description?, isReady?, scaffold?,
  category?: TemplateCategory,          // "Group - Variant", e.g. 'Dashboard - Analytics'
  isHiddenFromOverview?: boolean,
};

// packages/cli/templates/blocks/components/<Comp>/<Block>.doc.mjs
export const doc = {
  type: 'block', name, displayName, description, isReady,
  exampleFor: 'Button',                 // which component page shows it
  alsoExampleFor?: string[],            // extra pages (e.g. the component's hook)
  alsoShowcaseFor?: string[],           // extra hero-showcase placements
  aspectRatio: 16 / 9,                  // preview container ratio
  scale?: number,
  componentsUsed?: string[],            // "see also" cross-refs
  isShowcase?: boolean,                 // true → the hero showcase for exampleFor
};
```

Note the inconsistency: component/reference docs export `docs`; template docs export
`doc` (singular).

### 4.9 `HookDoc`

```ts
{ name, displayName, group?, keywords?, category?, importPath?,
  params: HookParamDoc[],    // {name, type, description, default?, required?}
  returns: HookReturnDoc[],  // {name, type, description}
  usage: UsageDoc,
  relatedComponents?: string[], relatedHooks?: string[] }
```

`params != null` is the discriminator the docsite uses to decide "this is a hook":
it renders a `HookSignature` (Parameters / Returns tables) **instead of** the
interactive Properties tab.

### 4.10 Worked example — `packages/core/src/Button/Button.doc.mjs` (290 lines)

```
name: 'Button' · displayName: 'Button' · group: 'Button' · category: 'Action'
keywords: 11 entries (button, btn, cta, submit, action, loading, primary, …)
usage.description: 1 paragraph
usage.bestPractices: 8 items (5 Do, 3 Don't)
usage.anatomy: 4 elements (Icon, Label, End content, Spinner)
props: 17 entries — including slotElements on `icon` and `endContent`
playground.defaults: {label: 'Click me', variant: 'primary'}
theming.targets: [{className: 'astryx-button', visualProps: ['size','variant']}]
theming.vars: 5 (one private: --_button-radius)
theming.derived: [{property: 'borderRadius', vars: ['--_button-radius']}]
+ docsZh (full Chinese overlay) + docsDense (compressed for AI context budgets)
```

---

## 5. Structure of a Component Docs Page

Route: `/components/[name]` → `ComponentDetailClient.tsx`.

### 5.1 Page chrome (always)

```
┌──────────────────────────────────────────────────────┐
│ TopNav (SharedTopNav)                                │
├───────────────┬──────────────────────────────────────┤
│ SideNav       │  Section maxWidth=960, padding=6     │
│ (components   │                                      │
│  mode +       │  <Text display-1>{displayName}</Text>│
│  search)      │  <Text supporting>                   │
│               │    @astryxdesign/core v0.1.3         │
│               │      · {moduleName}                  │
│               │  </Text>                             │
│               │  …tabs / body…                       │
├───────────────┴──────────────────────────────────────┤
│ SiteFooter                                           │
└──────────────────────────────────────────────────────┘
```

### 5.2 Two page variants

| | Component (`params == null`) | Hook (`params != null`) |
|---|---|---|
| Header | title + `pkg vX · moduleName` | same |
| Nav | `<TabList>` **Overview / Properties** | `<Divider />`, no tabs |
| Body | tab-switched | Overview content only |

Tab state lives in the URL: `?tab=properties` (`router.replace`, `scroll: false`;
`overview` deletes the param).

### 5.3 Overview tab — section order

| # | Section | Rendered when | Content source |
|---|---|---|---|
| 1 | **Hero showcase** — `<Card variant="muted" padding={0}>` wrapping `<ShowcasePreview>` inside `<ComponentPreviewTheme>` | `comp.name in showcaseRegistry` | the block with `isShowcase: true` and `exampleFor === name` (or an `alsoShowcaseFor` alias), lazily `import()`-ed as a real compiled React component |
| 2 | **`## Usage`** heading + prose | `comp.usage` present | `docs.usage.description` (rendered via `MarkdownText`, inline markdown only) |
| 3 | **Import snippet** — `CodeExampleBlock` with copy button | always (inside Usage) | computed: `import {${moduleName}} from '${importPath}'`; `importPath` resolved at build time from the package's `exports` map (`@astryxdesign/core/Chat`), falling back to the bare package name |
| 4 | **Best practices** table — Guidance / Practices columns, green "Do" / red "Don't" badges | `usage.bestPractices?.length` | `docs.usage.bestPractices[]` |
| 5 | **Hook signature** — Parameters + Returns tables | hooks only | `docs.params[]`, `docs.returns[]` |
| 6 | **`## Examples`** heading + "Common configurations, variations, and states." | `exampleRegistry[name].length > 0` | fixed copy |
| 7 | **Example blocks**, one card each | as above | `exampleRegistry[name][]` |

Each **example card** (`ExampleBlock.tsx`):
```
Card
 ├ <Text body medium>{entry.name}</Text>          ← block doc `name`
 ├ LivePreview  — lazily import()s the copied TSX, renders the real component
 ├ muted Section: TabList[Description | Code]  +  "Open in Playground" (real <a>)
 └ muted Section: description (MarkdownText)  OR  CodeExampleBlock(source, tsx, copy)
```

> `usage.anatomy` has an `Anatomy.tsx` renderer in `component-detail/`, and
> `docs/BestPracticesBlock.tsx` exists for reference docs — but the current
> `ComponentDetailClient` **does not** mount `Anatomy`. Anatomy data is authored and
> generated but only consumed by the CLI/MCP surfaces today.

### 5.4 Properties tab — section order

| # | Section | Notes |
|---|---|---|
| 1 | **Sticky interactive preview stage** | `position: sticky; top: 44; z-index: 10`, `backdrop-filter: blur(16px)`, `max-height: 400` (250 ≤768px), bordered + `--radius-container`. Renders `<InteractivePreviewStage>` with the current knob state, a `PreviewErrorBoundary`, and a generated JSX snippet of the current state. |
| 2 | **`### Props`** + `PlaygroundPropsTable` (730 lines) | Every `PropDoc` row is simultaneously **documentation and a live control**. |

`PlaygroundPropsTable` columns: prop name · type (with `typeRefs` rendered as inline
popover triggers showing the extracted TS declaration + `sourcePath`) · default ·
description · **control**.

Control kind is inferred by `parsePropType.ts` from the `type` string:

| Control kind | Inferred from |
|---|---|
| `enum` | string-literal union (`'sm' \| 'md' \| 'lg'`); handles mixed literal+boolean unions; `optionValues` maps label→typed value |
| `input-status` | `'error' \| 'warning' \| 'success'` |
| `boolean` / `string` / `number` | primitive types |
| `callback` | contains `=>` |
| `element` | ReactNode prop with exactly **one** `slotElements` entry → toggle switch |
| `slot-list` | ReactNode prop with **multiple** `slotElements` → selector |
| `theme` / `syntax-theme` | special-cased (`themeObjectsFull`, `allSyntaxPresets`) |
| `unknown` | fallback, no control |

`interactiveState.ts` builds initial state from `playground.defaults` → doc `default`
values → auto-generated values for required props; injects runtime-only values that
can't be JSON-serialised (mock `SearchSource`, controlled `onOpenChange` bridges,
theme objects) and tracks `missingRequiredProps`.

### 5.5 `/docs/<topic>` page structure

`(docs)/docs/[topic]/page.tsx` resolves in this order:

1. **Long-form doc topic** (`docTopics.find(...)`)
   - If `category === 'foundations'` **and** topic ∈ `{tokens, color, elevation, motion, shape, spacing, typography}` → `<TokensDocView>` (renders token tables with live computed CSS values and a `previewType` preview column).
   - Otherwise → `<ReferenceDocView>`.
   - Both wrap `DocPageLayout` (title, description/dek, divider, outline aside) and map each `ContentBlock` through `ContentBlockRenderer` → `ProseBlock` / `CodeBlock` / `TableBlock` / `ListBlock` / `BestPracticesBlock`.
2. **Non-theme package** (`@astryxdesign/<slug>`) → `<PackageStubPage>`: name, description, version, install steps (`npm install …` / `npx astryx component --list` for the CLI), rendered README, optional CTA (core → "View Components" → `/components/Button`), with `stripSections` (`Quick Start`, `Resources`, `Astryx CLI`) and `stripIntro` for core.
3. Otherwise `notFound()`.

---

## 6. Live-Example / Playground Rendering (the hard part)

There are **three distinct** live-rendering mechanisms. Conflating them is the main
porting trap.

### 6.1 Mechanism A — Build-time compiled examples (component pages)

Used for the hero showcase and every example card.

```
packages/cli/templates/blocks/components/Button/ButtonVariants.tsx     (real TSX)
        │  generate-data.mjs copies the file
        ▼
apps/docsite/src/generated/examples/ButtonVariants.tsx
        │  emitted into exampleRegistry.ts as
        ▼
{name, description, source: "<raw TSX string>", load: () => import('./examples/ButtonVariants')}
```

- The component is **compiled by Next/webpack like any app code** — no runtime eval.
- `ExampleBlock` calls `entry.load()` in a `useEffect`, sets it in state, and renders `<Component />` with a `Spinner` fallback and a "Preview not available" error path.
- The **same file's raw text** is shown in the Code tab and deep-linked into the playground.
- `SideNav` previews get `onClickCapture={preventPreviewNavigation}` so demo links don't navigate.
- `ComponentPreviewTheme` wraps every preview in a nested `<Theme>` that re-declares the type-scale tokens, isolating the demo from the docs article's larger prose typography.

**Port difficulty: LOW.** SvelteKit does this natively with
`import.meta.glob('./examples/*.svelte')` (or a generated map of dynamic imports) plus
`?raw` imports for the source text. The cost is rewriting 588 blocks in Svelte, not the plumbing.

### 6.2 Mechanism B — Registry-driven interactive preview (Properties tab)

No source file exists. The component is constructed from **data**:

```
comp.props (PropDoc[])  ──parsePropType──▶  KnobProp[] {row, control}
comp.playground.defaults ──resolveValue──▶  initial state
                                            │
                    createElement(Core[name], state)   ← literally React.createElement
                                            │
   optional playground.wrapper ▶ createElement(Core[wrapper.component], props, previewed)
                                            │
                    PreviewErrorBoundary (resetKeys = state)
                                            │
                    generateCode(name, state) ▶ formatted JSX snippet shown under the stage
```

`resolveElements.ts` turns `ElementDescriptor`s into elements:
`Core[name] ?? Core['XDS'+name]`, then `createElement(comp, props, ...children)`,
recursing into `children`.

`playground.overlay: true` (MobileNav, Lightbox) swaps the empty stage for an
open-trigger placeholder while `isOpen` is false, then lets the real top-layer overlay
render. Dialog/AlertDialog/CommandPalette instead use an `isInline` docs-preview prop so
the modal stays contained and knobs remain usable.

**Port difficulty: MEDIUM.** The Svelte 5 equivalent is a name→component map plus
`<svelte:component this={Map[name]} {...state} />` and snippet-based children. The
`parsePropType` string parser ports 1:1. The genuine work is a React→Svelte **prop type
mapping layer**: `ReactNode` → `Snippet`/`string`, `onClick` → `onclick`,
`ReactElement<IconProps>` → a `{@render}`-able snippet. Consider adding a
`svelte:` overlay block to `.doc.mjs` (or a sidecar `.doc.svelte.mjs`) rather than
mutating upstream files.

### 6.3 Mechanism C — Full in-browser TSX compilation (`/playground`)

The genuinely hard one.

```
/playground  (PlaygroundClient.tsx)
  ├ Monaco editor  — served from /monaco/vs (copied from node_modules; no CDN)
  │                  .d.ts text bundled by generate-playground-types.mjs
  ├ PropertyEditor — click-to-target overlay that edits props of the rendered instance
  ├ ThemeEditor    — live token editing (base styles / component tokens / raw tokens)
  └ <iframe src="/playground/preview">
        ├ loads /vendor/typescript.js  (TypeScript UMD, self-hosted)
        ├ runner.ts:
        │    ts.transpileModule(code, {jsx: React, target: ES2020,
        │                              module: CommonJS, esModuleInterop: true})
        │    → new Function('module','exports','require', ...globalNames, compiled)
        │    → require() resolves against generated playground-scope.ts
        │    → every named export is ALSO injected as a positional global, so
        │      unimported components/hooks resolve (minus RESERVED_GLOBALS —
        │      Map, Set, Date, Image… would shadow JS builtins; lucide exports
        │      icons literally named `Map` and `Image`)
        │    → identifiers the user declares are dropped from the injected globals
        │      (a param and a top-level `const` of the same name can't coexist)
        │    → requires `export default function …`
        └ ErrorBoundary + previewReset.css
```

Code is shared via URL: `lib/compress.ts` (`lz-string` + `fflate`) →
`buildPlaygroundHref(source)` in `components/playgroundLink.ts`, used by every example
card's "Open in Playground" button. Theme + mode are pushed into the iframe via
`window.__xds_preview_theme__` / `window.__xds_preview_mode__`, read by the
`ControlledTheme` wrapper generated into the scope.

**Port difficulty: HIGH.** Svelte cannot be compiled by `ts.transpileModule` — the
Svelte compiler itself must run in the browser. Options, best → worst:

| Option | Notes |
|---|---|
| `svelte/compiler` in a Web Worker (the REPL approach) | This is exactly how `svelte.dev/playground` works — compile `.svelte` → JS in a worker, then eval with a scope-mapped `require`. Reuse `@sveltejs/repl` or its `Bundler`/`Compiler` internals. Highest fidelity, largest bundle (~1–2 MB compiler, still self-hostable). |
| Rollup/esbuild-wasm in a worker | More general, heavier. |
| **Defer the playground** | Ship `/playground` last. Mechanisms A + B cover ~all of the per-component docs value; only the standalone playground and "Open in Playground" links depend on C. |

The Monaco editor, theme editor, property editor, URL compression, and the whole
`playground-scope` generation concept all port unchanged.

---

## 7. Tech Stack → Svelte Equivalents

| Concern | Astryx (upstream) | SvelteKit equivalent |
|---|---|---|
| Framework | **Next.js 16.3.0-preview.5**, App Router, RSC, `cacheComponents: true`, `--webpack` | **SvelteKit 2 + Vite 5/6**, `adapter-vercel` or `adapter-static` |
| UI runtime | React 19.2 | **Svelte 5** (runes) |
| Route groups | `(site)` / `(docs)` + `blog` / `playground` layouts | `src/routes/(site)/`, `(docs)/`, `blog/`, `playground/` — SvelteKit has identical group syntax |
| Dynamic routes | `[name]`, `[topic]`, `[slug]` + `generateStaticParams` | `[name]`, `[topic]`, `[slug]` + `export const entries` (+ `prerender = true`) |
| Styling | **StyleX 0.19** (`@stylexjs/stylex`, babel plugin, postcss plugin) | StyleX has no first-class Svelte integration. Use **plain scoped `<style>` + the design system's CSS custom properties** (`--color-*`, `--spacing-*`, `--radius-*`), which is what the themes already emit. Optional: Tailwind v4 mapped onto the same token vars. |
| Theme distribution | `@astryxdesign/theme-*` packages emit `theme.css` + a `/built` tokens-only JS object; docsite aggregates via generated `themes.css` | Identical — theme CSS is framework-agnostic. Import the same packages. |
| Content pipeline | 5 Node scripts → `src/generated/*.ts` | Same scripts, ported to emit `src/lib/generated/*.ts` (or `.json`). Run via a `prepare`/`predev` npm script, or a small Vite plugin so HMR picks up `.doc.mjs` edits. |
| Content format | `.doc.mjs` (executable JS objects) + `ContentBlock[]` | **Reuse verbatim.** Add a Svelte type-mapping overlay. |
| Blog | Markdown + YAML frontmatter, custom `posts.mjs` discovery/validation | **mdsvex** (if you want Svelte components in posts) or keep the same generator + `marked`/`markdown-it`. Port `posts.mjs` almost as-is. |
| Markdown rendering | In-house `<Markdown>` core component + `inlineMarkdown.tsx` | Port `<Markdown>` to Svelte, or use `marked` + a small renderer mapping to Astryx-Svelte components. |
| Syntax highlighting | **In-house tokenizer** — `packages/core/src/CodeBlock/tokenizer.ts` + `highlightStyles.ts` + `SyntaxTheme` (`dracula` and other presets). **No Shiki, no Prism, no highlight.js.** | Port the tokenizer (pure TS, framework-agnostic — copy it verbatim) into a Svelte `<CodeBlock>`. Fallback: **Shiki** (`shiki`/`@shikijs/rehype`) at build time. |
| Search | `<CommandPalette>` + `createStaticSource` over generated registries. **No Algolia/Pagefind/Orama.** | Same: Svelte `CommandPalette` + a static index built from the registries. If the index grows, add **Pagefind** or **Orama** — but 1:1 parity means an in-bundle static source. |
| Code editor | Monaco (self-hosted from `public/monaco/vs`) | Monaco works in Svelte (`monaco-editor` + a Vite worker config), or **CodeMirror 6** (lighter, first-class Svelte usage in the Svelte REPL). |
| In-browser compile | `typescript.js` UMD `transpileModule` | **`svelte/compiler` in a Web Worker** (`@sveltejs/repl`), + `typescript` for `<script lang="ts">` stripping. |
| Example rendering | copied `.tsx` + `() => import()` per entry | `import.meta.glob('./examples/*.svelte')` + `import.meta.glob('./examples/*.svelte', {query: '?raw'})` for the source strings |
| Icons | `lucide-react` (+ `@heroicons/react` for playground back-compat) | **`lucide-svelte`** (drop Heroicons unless the ported examples need it) |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights`, custom `lib/analytics.ts` events (`trackNavigate`, `trackSearch`, `trackClickCta`, `trackOpenPlayground`) | Same Vercel packages ship framework-agnostic scripts; port `analytics.ts` as-is |
| MCP server | `mcp-handler` + `zod` at `app/mcp/route.ts` | `mcp-handler` is Next-shaped; use `@modelcontextprotocol/sdk` directly in a SvelteKit `+server.ts` with the Streamable HTTP transport. Registry-driven logic ports unchanged. |
| Sitemap / RSS / robots | `app/sitemap.ts`, `app/rss.xml/route.ts`, `app/robots.ts` | `src/routes/sitemap.xml/+server.ts`, `rss.xml/+server.ts`, `robots.txt/+server.ts` |
| URL rewrite | `next.config.mjs` rewrites `/blog/:slug.txt` → `/blog/txt/:slug` | `src/routes/blog/[slug=txt]/+server.ts` with a param matcher, or `src/hooks.server.ts` |
| Metadata / OG | `generateMetadata` + `lib/pageMetadata.ts` | `<svelte:head>` fed by `+page.ts` load data; port `pageMetadata.ts` to return a plain object |
| Versioned docs (canary vs latest) | `resolve-content-root.mjs` + `DOCSITE_TARGET` / `VERCEL_ENV` | Port verbatim — it's plain Node, framework-agnostic |
| Compression for share links | `lz-string` + `fflate` | Identical packages |
| Deploy | Vercel (`vercel.json`) | Vercel via `@sveltejs/adapter-vercel` |

### 7.1 Recommended SvelteKit stack

```
SvelteKit 2 + Svelte 5 (runes) + Vite
adapter-vercel (or adapter-static — every content route is prerenderable)
Styling:  scoped <style> + @astryxdesign/theme-* CSS custom properties
Content:  the SAME .doc.mjs files, read by a ported generate-data script
          emitting src/lib/generated/*.ts, wired as a Vite plugin for HMR
Blog:     mdsvex (or marked + the ported posts.mjs validator)
Code:     ported in-house tokenizer from packages/core/src/CodeBlock (zero deps)
          — Shiki only if you decide not to port it
Search:   in-bundle static index over the generated registries + Svelte CommandPalette
Icons:    lucide-svelte
Playground (phase 2): svelte/compiler in a Web Worker + CodeMirror 6 (or Monaco)
MCP:      @modelcontextprotocol/sdk in a +server.ts
```

---

## 8. Port Sequencing (recommended)

| Phase | Scope | Rationale |
|---|---|---|
| **1** | Port `generate-data.mjs` (+ `resolve-content-root.mjs`, `typeDefinitions.mjs`) to emit `src/lib/generated/*` | Unblocks everything; zero content authoring |
| **2** | Shell: `SharedTopNav`, `DocsShell` sidebar, `SiteFooter`, `SearchPalette`, `DocPageLayout` + `Outline` | Nav parity is cheap and high-visibility |
| **3** | `/docs/<topic>` — `ContentBlockRenderer`, `ReferenceDocView`, `TokensDocView`, `PackageStubPage` | Pure data → markup; 22 pages for one renderer |
| **4** | `/components` gallery + `/components/[name]` **Overview tab** (minus live previews) | 200 pages from `componentRegistry` |
| **5** | Example/showcase rendering (Mechanism A) — rewrite the 588 blocks as `.svelte` | The long tail; can land incrementally per component |
| **6** | Properties tab (Mechanism B) — `parsePropType`, `interactiveState`, `resolveElements`, `PlaygroundPropsTable` + a React→Svelte type-mapping layer | Highest-value interactive surface |
| **7** | `/blog`, `/changelog`, `/community`, `/themes`, `/templates` | Independent of the above |
| **8** | `/playground` (Mechanism C) + `/mcp` | Hardest; defer |

### Key risks

1. **588 example blocks + 42 page templates are React TSX.** No automated path;
   this dominates the schedule. Prioritise `isShowcase: true` blocks (153) — those are
   the hero previews and buy the most visible parity per unit of work.
2. **`props[].type` strings are React-typed.** A naive port renders `ReactNode` in a
   Svelte props table. Needs an explicit mapping table + probably a `svelte` overlay
   field in the doc format.
3. **StyleX has no Svelte story.** Don't try to port StyleX; the theme packages already
   ship plain CSS custom properties, which is the right seam.
4. **The in-browser playground is a different problem in Svelte** (compiler in a worker,
   not `transpileModule`). Budget it separately or defer.
5. **`displayName` is a hard build gate** — replicate `requireDisplayName()` so the
   Svelte generator fails loudly rather than silently emitting blank sidebar labels.
