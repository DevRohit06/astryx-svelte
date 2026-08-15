---
batch: 24
title: Phase 5 — the docs site, landed
upstream: 0.3.0
date: 2026-08-03..2026-08-13
units: []
upstream-prs: []
---

## Scope

The dated and fully-landed subsections of `port/todo.md`'s Phase 5 ("Docs site"), in the order they
appear there. Phase 5 is an ongoing phase rather than a discrete numbered batch, so this file carries
everything in it that is dated and closed; sections without a date that still track open work — "The
v1 cut", "Next batch — the bento tiles", "After launch", and "Docs-site integration facts" — stay in
`port/todo.md`, since they are current backlog rather than history. `022-page-templates.md` covers the
43 CLI page scaffolds from `port/ported.md`'s own section on the same topic; "Page-template icons"
below is the docs-site-dated fix to the icons those pages draw, and is kept here because it came from
`todo.md`, not from `ported.md`.

### The props-page audit — 2026-08-08

An end-to-end audit of the component **properties** tables. The headline is that the generator's
own drift report said **0 documented props core does not declare** while 85 rows across 15 pages
rendered the "not declared by core" disclaimer — the number was not merely stale, it was
structurally unable to see the case it exists for. Nine defects, all fixed and re-verified against
a regenerated registry; the index moved **417 → 457 interfaces** and the honest drift count is now
**5**.

- **`isPropsLike` never indexed `*Config`, and `propsTypeNamesFor` asked for three `Config`
  spellings.** That lookup could never hit. The cost was the entire Table plugin API — 15 hook
  pages, 85 rows — every one telling the reader its type was unverified while core declared
  `UseTableSortableConfig`, `UseTablePaginationConfig` and 16 more all along. One `endsWith`.
- **The drift report guarded on `realTypes &&`, so it could see a component declaring 22 of 23
  props and not a hook declaring none of 11** — exactly inverted, since the second is the larger
  gap. That is what produced the 0.
- **Four components documented the wrong callback**, because candidate spellings were tried
  lowercase-first and a props interface extending Svelte's HTML attributes inherits `onchange` /
  `onclick` for every element — so the DOM handler shadowed the component's own camelCase prop.
  `PowerSearch.onChange` is `(filters, changeType, index) => void`; the page showed
  `FormEventHandler<T> | null` **and marked it Required**, so the wrong signature read as the
  primary API. Trying the authored name first fixes all four and leaves the other 33 collisions
  resolving as before.
- **33 rows across 30 entries rendered "upstream: onChange" underneath a prop named `onChange`** —
  `EVENT_PROP_RENAMES` renames unconditionally, before anyone knows whether core declares the
  renamed spelling, and the guard only ever *added* `renamedFrom`, never removed it.
- **`Table.idKey` rendered as syntactically invalid TypeScript.** The outer-paren strip was a
  greedy, balance-unaware regex, so `(keyof T & string) | ((item: T) => …)` came out with its
  first `(` and last `)` removed from the middle of the union.
- **`Selector.hasClear` and `NumberInput.hasClear` rendered `false`,** not `boolean` — a
  synthesised union property carries one declaration per arm and the first was taken as the whole
  type. A reader concludes the prop cannot be enabled.
- **Two pages cited a props interface that does not exist** (`useImperativeDialogProps`), because
  the caption name was synthesised as `<Name>Props` rather than being the candidate that actually
  matched. Naming a declaration a reader cannot find is worse than naming none.
- **Hook returns were never checked against the compiler at all**, and guessing type names could
  not have fixed it: `useMediaQuery` returns `MediaQueryState`, `useScrollOverflow` returns
  `ScrollOverflow`. They are now read off the **call signature**, which cannot miss. Two things
  fell out — every `*Ref` member upstream returns is an `attach…: Attachment<HTMLElement>` here, so
  those rows had been advertising members this port does not have; and context hooks return
  `() => Value`, so one getter level has to be unwrapped or the whole surface reads as missing.
- **The `ref` note gave one answer for three different translations.** `handleRef` is an imperative
  handle (this port publishes instance exports), a hook's `*Ref` is an attachment, and a component's
  `ref` needs the rest-props attachment because `bind:this` on a component yields the instance
  rather than its element. Each has its own note now.

**Process, and the reason this could sit unseen:** `vite-plugin-content.mjs` passes `quiet: true`
on *both* its paths, so the drift report printed only on a direct `pnpm -F docs generate` and never
during `pnpm dev:docs` or `pnpm -F docs build`. Combined with the guard above, that is two
independent reasons a real gap could ship. The report is now `console.warn` and survives `quiet`.

- [x] **The 5 drift rows are closed, and the diagnosis in the first draft of this entry was
      wrong.** It read them as "the port returns a value where upstream returns a single-member
      object". **Upstream returns them bare too** — `useToast.tsx:170` returns `ShowToastFn`,
      `useTranslator.ts:43` returns `TranslatorFn`, `useEntryAnimation.ts:119` returns
      `StyleXStyles | null`. What they actually share is that **`HookDoc.returns` is a _table_, so
      a hook returning a bare value still needs a name in the Field column and the `.doc.mjs`
      invents one** — the row is a label, not a member, and the port matches upstream exactly.
      `useStreamingText` is the one real divergence and it runs the **other way**: upstream returns
      a bare `string` (`useStreamingText.ts:94`), this port returns `StreamingTextState`, because a
      string cannot stay live across a Svelte component's lifetime — the port _added_ the wrapper.
      `useTableFilterState.initialState` is the hook's argument documented in a props table,
      because its entry is authored as a `ComponentDoc`. Each row now carries an entry-scoped note
      (`ENTRY_ROW_NOTES`, keyed `<entry>.<row>` because `value` and `initialState` mean something
      else on every other page), and a note that stops matching **fails the run**, on the class
      oracle's `skip` rule. Nothing was silenced: 5 → 0 with the check unchanged
- [x] **Hook `params` are reconciled against the signature's parameter list.**
      `parameterTypesForFunction` resolves the three shapes upstream's hook docs use — a positional
      parameter by name, a dotted `options.field`, and the fields of a sole options object listed
      flat — reusing the getter unwrap, since every options parameter here is `() => UseFooOptions`.
      **114 of 114 param rows now come from the compiler; 0 fall back to the mapper.** Four things
      it surfaced: the getter convention reaches the page at last (`useMediaQuery.query` is
      `() => string`, not `string`); `useClickableContainer.options.onClick` is really `onclick`
      and was _reported_ before it was fixed, which is the proof the reporting path works;
      `containerRef` / `interactiveRef` / `inputRef` are `container` / `interactive` / `input`,
      because this port takes the element from `bind:this` where upstream takes a ref object — and
      the generic `Ref$` note would have described them wrongly, since it is about a hook's
      _return_ being an attachment; and `useLayer.mode` was about to render as `'context'`, the
      first of two overloads, so member types are now unioned across overloads to give upstream's
      own `'context' | 'fixed'`
- [x] **The unrendered fields are resolved per field, not in bulk** — registry **850,946 → 703,975
      bytes (−17.3%)**, and the emitted row shape is now an explicit allowlist (`finaliseRow`)
      rather than a `...prop` spread, so the leak cannot recur. `correctedFromUpstream` is
      **rendered**. `typeNotes` is **dropped and was right on none of its 287 rows**: 244 sat on
      compiler-typed rows describing a rewrite that never ran — `AppShell.children` read
      "Renderable slots accept a string or a snippet" beside a declared `Snippet`, the exact
      `Button.icon` mistake CLAUDE.md warns about — and all 43 of the rest already carried a more
      specific `unsupported` note. `slotElements` is **dropped**: upstream reads it only from the
      playground (`parsePropType`, `PlaygroundPropsTable`, `interactiveState`), and it is a
      serialised React `createElement` argument. `upstreamType` is **kept only on `unverified`
      rows** (33.1 KB → 1.4 KB) and rendered there, where the displayed type _is_ the mapping.
      Entry `examples`, `relatedComponents` / `relatedHooks` and `subComponentOf` are **dropped** —
      upstream renders examples from its block registry, reads the related lists only in `/mcp`,
      and references `subComponentOf` nowhere. **`theming` is the one kept unrendered, and on
      purpose**: upstream really does render it (`component-detail/Theming.tsx`), so it is input to
      planned work, and `types.d.ts` says so on the field
- [x] **`component-groups.js` was a second full copy and the bundler does not dedupe it** —
      confirmed by grepping the built client, where one entry description appears in both the
      registry chunk and the root-layout node. It is now a slim `{name, displayName}` index:
      source **763,862 → 26,318 B**, root-layout chunk **587,294 → 35,622 B raw** and
      **137,979 → 9,172 B gzip (−93%)**, total client JS **4,643,180 → 4,091,508 B**. Both builds
      measured on the same registry

**Where the props tables now stand:** 1,876 rows, **0 mentioning a React type**, 56 unverified and
**all 56 explained** (was 51 of 56), 114 of 114 hook params compiler-typed, drift **0**.

- [ ] **`nodes/0` still pulls the 562 KB registry chunk into the root layout**, through
      `top-nav.svelte` → `search-palette.svelte` → `search-index.ts`. The search index reads
      `name`, `displayName`, `keywords` and `description`; it wants the same slim-projection fix
      the sidebar just got, one level up
- [ ] **Render the Theming section** — upstream's `component-detail/Theming.tsx` plus
      `themingHelpers`: a targets table keyed as `defineTheme` config keys, a copyable
      `defineTheme` example, and a themeable-vars table. The data is already generated
      (`ComponentEntry.theming`, 17.3 KB); it needs `Table` and the helpers. This is the only
      generated-but-unrendered field left, and the only one that is deliberate


### The Properties tab is a playground — 2026-08-08

Upstream's Properties tab is not a table; it is a **live preview over an editable table**, and the
port had only the table. `ComponentPlayground` is upstream's `InteractivePreviewStage` over
`PlaygroundPropsTable`: a sticky preview, a control per editable row, and a `<>` toggle emitting
**Svelte** where upstream emits JSX.

- [x] **Driven over all 183 Properties tabs in a real Chromium**, and classified rather than
      spot-checked: **130 render a live component**, 29 show the missing-required note, 9 the
      "documents a hook" note (the `useTable*` entries upstream authors as `ComponentDoc`s), 8 the
      empty-slot note, 4 surface the component's own error through `<svelte:boundary>`, 3 render
      nothing without erroring. **0 console errors across all 183.** The 8 slot cases recover the
      moment `children` is typed into — the boundary resets on change, as upstream's does
- [x] **1,222 of 1,665 prop rows get an editor** — string 374, boolean 285, enum 256, snippet 184,
      number 123. 162 are callbacks, which get no control (as upstream gives none) but a no-op seed
      when required; 281 stay read-only. Seeding order is `playground.defaults` → the documented
      `default` → a required fallback, and code generation **omits any prop still at its default**
- [x] **The stage never touches the prerender.** `tab` starts at `overview` and only an effect
      adopts `?tab=`, so the 209 prerendered pages contain no stage markup at all
- [x] **`playground` reaches the registry** — 59 of 209 entries (67 authored upstream; 8 lose
      everything to the descriptor drop below), 58 with defaults, 6 `wrapper`s, 2 `overlay`s,
      ~8.5 KB. Normalised through an allowlist (`normalisePlayground`), on `finaliseRow`'s rule
- [x] **Alias unions of _numeric_ literals are now expanded like the string ones**, 32 rows. This
      touches the audited Type column and is a parity **fix**, not a liberty: `Heading.level`
      printed `HeadingLevel` where upstream's own `.doc.mjs` prints `1 | 2 | 3 | 4 | 5 | 6`
      (`Text/Heading.doc.mjs`, verified byte-for-byte), and the unexpanded alias also hid the
      members from the control derivation, so the row got no `<select>`
- [x] **`--color-background-page` is upstream's token and is undefined by this port's themes.**
      Nothing in `packages/themes/*` declares it; the defined name is `--color-background-body`.
      Copying upstream's sticky-stage rule fails **silently** — the pinned stage stayed transparent
      with table rows scrolling through the previewed component, and nothing in the console
- [ ] **The Required badge is the doc's, the type is the compiler's, and they disagree on 31 rows.**
      Core declares them non-optional where upstream's `.doc.mjs` does not mark them required
      (`Center.children`, `List.children`, `AppShell.children`, `VisuallyHidden.children`,
      `Badge.label`, `Tooltip.content`, `DropdownMenuItem.label`, …). Eight are the slots that make
      the preview throw, because React renders an absent `children` as nothing where
      `{@render children()}` throws. Whether the badge should follow the compiler is a props-table
      question, not a playground one
- [ ] **Slot defaults upstream authors as `ElementDescriptor`s are dropped** — 36 of 149, all on
      slot props (`Card.children`, `Popover.content`, `AppShell.topNav`). A serialised React
      `createElement` argument cannot become a `Snippet`; the same reason `slotElements` went. Those
      previews seed empty and the text control fills them. Rendering them needs a recursive
      descriptor component _and_ a way to build a snippet per prop name at runtime
- [ ] **Four upstream controls have no counterpart here**: the `theme` and `syntax-theme` selectors
      (which is why `Theme` and `SyntaxTheme` are 2 of the 4 hard failures, alongside
      `DropdownMenuRadioItem` and `OverflowList`), `input-status` (16 rows typed `InputStatus`), and
      the `element` / `slot-list` add-remove controls
- [ ] **The component pages now pull the whole barrel** (`import * as core`), as upstream's
      `resolveElements` does: total client JS **4,104,106 → 4,196,460 B (+92 KB, +2.2%)**. A lazier
      `import.meta.glob` over core's component modules would trade it for a per-preview fetch
- [ ] **Only the `isOpen` / `onOpenChange` pair is bridged back into the knobs** (upstream's
      `canControlOpenState`). Upstream also bridges any `on<X>Change` whose first parameter names a
      state key; here that parameter is usually `checked` or `next` rather than the prop's name, so
      the general rule would fire on almost nothing


### Sidebar, gallery and upstream's package name — 2026-08-09

Three reader-visible defects, one shared root cause between the first two.

- [x] **Sub-components never inherited their family's fields across files, so 115 sidebar entries sat
      flat and 79 components were missing from the gallery entirely.** `SubComponentDoc` says it in
      as many words — family fields "are inherited from the directory's primary doc" — and upstream
      relies on it: `AvatarGroupOverflow.doc.mjs` declares `subComponentOf: 'AvatarGroup'` and leaves
      `group` and `category` **undefined**. `flattenDoc` did the inheritance for members written
      _inline_ in a parent's `components[]`, where the parent is in scope, and could not do it for
      the ~80 upstream extracted into their own files. So `AvatarGroupOverflow` and `AvatarStatusDot`
      rendered as siblings of `Avatar` instead of inside it, and all 14 Chat sub-components, 7
      Command Palette, 6 Dropdown Menu and 4 Table entries did the same. The gallery buckets by
      `category` and silently dropped everything without one. `inheritFamilyFields` runs after every
      doc is loaded, when the parent is finally knowable: **sidebar 149 flat entries → 72 groups**,
      **components with no category 79 → 0**, 81 emitted `.doc.mjs` files changed. `theming` and
      `playground` are named in that same sentence and deliberately **not** inherited — they are the
      primary member's own prose, and a sibling inheriting the parent's playground seed would render
      the parent's props
- [x] **A parent doc with no props of its own was dropped, taking its name with it.** 16 upstream
      docs declare only `usage` + `components[]`; 12 name themselves in `components[]` and were
      fine. The other four are `Chat`, `Layer`, `Resizable` and `Stack` — and **`Stack` and `Layer`
      are real exports** (`components/stack/stack.svelte`, `components/layer/layer.svelte`), so the
      gallery, the sidebar and the CLI were all missing a component core ships. `astryx-svelte
      component Stack` printed **HStack's** doc, because the CLI's directory walk landed on a
      sibling. Registry **209 → 211**. `Chat` and `Resizable` are group labels core does not export
      and the surface filter drops them with no special case. Restoring `Stack` also surfaced **3
      example blocks with no Svelte rewrite** (`StackAlignment`, `StackDirections`, `StackFillItem`)
      — written, so the counter is back to **629 ported / 0 pending**
- [x] **Upstream's package name reached real CLI output.** `Button`'s guidance said "use IconButton
      from `@astryxdesign/core/IconButton`", and `astryx-svelte component Button` printed it — 16
      occurrences across 8 docs, on both surfaces, because both read the same reconciliation.
      Reusing upstream's prose is the design; reusing its **import specifiers** is not. A scope-only
      rename would have been wrong too: upstream publishes a subpath per component (`/Button`,
      `/IconButton`, `/Table`, `/Calendar`, `/DateRangeInput`) and this port publishes none of them.
      `rewriteSpecifiersIn` reads core's own `exports` and keeps a mapped subpath only when core
      really has it, collapsing the rest to the root barrel — reading the export map rather than
      listing survivors is what keeps it correct when core's subpaths change.
      `assertNoUpstreamSpecifiers` then fails the run on any survivor; **mutation-checked**
- [x] **The rewrite made one sentence contradict itself, and that needed a second mechanism.**
      Collapsing both of upstream's subpaths onto the root barrel left Button asserting that a
      package both does and does not export IconButton. The fact underneath differs too — here both
      are on the root barrel — so the honest sentence is not upstream's with names swapped.
      `PROSE_CORRECTIONS` matches **after** the rewrite and **fails the run when its sentence stops
      matching**, on `DOC_CORRECTIONS`' rule; **mutation-checked in both directions**
- [ ] **`AvatarGroup`'s preview renders a box containing the word "children", and that is upstream's
      behaviour.** Its doc declares no `playground`, so the required `children` snippet falls to
      `requiredFallback`, which seeds a prop's own name — upstream's `getRequiredFallbackValue` does
      exactly this. It reads as broken rather than as a placeholder because the component is tiny
      inside a 400px stage. Changing the seed is a **divergence from upstream** and should be
      decided as one, not slipped in; the alternative that is not a divergence is rendering the
      `ElementDescriptor` slot defaults (36 of 149, already tracked above), which is what upstream
      actually uses to fill these previews


### The docs cascade was inverted, and it hid four fixes — 2026-08-09

- [x] **`@layer product` and `@layer astryx-theme` sat _before_ StyleX's `priority1…9`, so every
      docs-chrome and theme-`components:` rule that collided with an atomic class was inert.**
      Upstream never has this: its docsite consumes `@astryxdesign/core/astryx.css` wholly inside
      `@layer astryx-base` and compiles only its _own_ StyleX into priority layers. This port
      compiles core itself, layer order is order of first appearance, and StyleX's sheet is
      injected last — so its nine layers landed after everything. Proven by injection rather than
      inferred: the same rule in `@layer product` computes `0px`, unlayered computes `48px`.
      `app.html` now declares the order first. **Four silent consequences, all measured**:
      `#astryx-app-shell-main` `padding-top` 0 → **48px**, so `h1` moved y=72 → **120**, upstream's
      exact value; the theme's `top-nav-item.selected` override finally applied and the pill went
      `rgba(223,226,229,0.2)` → **`rgba(0,0,0,0)`**; the hero chevrons went `display:flex` →
      **none**; the `pagination-dot` ring reached the dots, `border-width` 0 → **2px**
- [x] **The nav pill was not invented surface — that first reading was wrong.**
      `astryx-theme-config.ts` had ported upstream's `backgroundColor: transparent` correctly all
      along; the rule was simply losing to `x17x4s8c{background-color:var(--color-neutral)}`. The
      comparison that produced the wrong diagnosis also put our **dark** mode against upstream's
      **light**
- [x] **Section headings were 20px against upstream's 29px** — upstream's `AnchorHeading` passes
      `type="display-3"` and this page passed none, which is what made every topic read flat.
      Section gap 12px → **16px**; prose line-height 27.2px → **28px**, because `.prose` set
      `line-height: var(--line-height-body, 1.6)` and **no theme in this repo declares that
      property**, so every paragraph in 20 topics took the fallback
- [x] **`Table` and `List` had landed and three files still said they had not.** Plain `table`
      blocks are now upstream's `TableBlock` (`Card` → `Table`, hover, the `Name`-column icon
      branch); **49 tables across 20 topics carry a scroll wrapper**. 12 best-practices sections
      render through upstream's `isBestPracticesSection` shape (one Card+Table, Guidance 100px /
      Practices). The **3 mixed** sections lose their badges, and that is parity: upstream's
      `/docs/layout` "Cards vs Rows" renders **0 `.astryx-badge`** — ours was invented decoration
- [x] **The clipped token value was `white-space: nowrap` kept on a stale justification.** The note
      claimed the scroll wrapper carries the overflow; it cannot — `Table`'s `min-width` is the sum
      of _declared_ column widths, so a nowrap cell overflows into `overflow: hidden` while the
      table itself still fits. At 1000px: `--color-neutral` 417px cell over 450px content, 33px
      cut, no scrollbar. Deleting it restores the component's own `word-break`, which is
      upstream's. **1 clipped cell → 0.** At 390px both sides clip and **upstream clips worse — 87
      here against 158 there** on identical geometry; left as an upstream debt
- [x] **The light→dark flash was persistence without a pre-paint stamp.** Upstream has no flash
      because it has no persistence (`providers.tsx`: a correct manual toggle needs a server
      cookie). This port added `localStorage` and read it in `$effect.pre` — after first paint, and
      unreadable during SSR. Measured with a light OS and a stored `dark`: `data-theme` null and
      background `rgb(248,244,237)` for the whole pre-hydration window. `app.html` now stamps
      `<html data-theme>` before paint; after, it is dark from the first sample. A reader with no
      stored preference is untouched, and a dev assertion fails if the two storage keys drift

**Verified independently of the agent that did the work**: `h1` y=**120**, main padding **48px**,
`h2` **29px**, nav background **`rgba(0,0,0,0)`** at weight 600, **0** clipped cells, **12** scroll
wrappers, **0** body horizontal scroll. 66 production page loads (11 URLs × 3 widths × 2 themes), 0
console errors. Client JS **+558 B (+0.013%)**.

- [x] **`/docs/cli`, `/docs/core` and the `Libraries` sidebar group landed — and the blocker was
      never the page, it was that there was no content.** The root `README.md` and
      `packages/cli/README.md` **did not exist**, and `packages/core/README.md` was 65 lines of
      stock `sv` scaffold opening "Everything you need to build a Svelte library". All three are
      written (72 / 543 / 276 lines): upstream's prose and section names reused, every code sample
      this port's. **Six things are said differently because upstream's are false here** — the
      consumer's bundler must run the StyleX compiler (upstream ships pre-compiled CSS and says
      "no build plugins, no PostCSS, no Babel config"), one stylesheet rather than three, no
      per-component subpaths, no UMD/esm.sh delivery, no Tailwind bridge, and `template --list` and
      the codemod registry are described as honestly empty rather than promised. The StyleX section
      sits **above** `## Quick Start` deliberately: upstream's own `CORE_STRIP_SECTIONS` strips
      Quick Start from the rendered page, and that is the one fact a reader must not lose
- [x] **`buildLibraryPackages` emits two modules, not one** — the `component-groups.js` lesson
      applied before it could bite. `package-registry.js` (635 B) is what the sidebar imports and
      therefore what the **root layout** pulls; the 43 KB of README markdown lives in
      `package-readmes.js`, dynamically imported by the page's `load`. Confirmed against the built
      client: no page preloads it. `assertNoUpstreamSpecifiers` covers the new path,
      **mutation-checked**
- [x] **Upstream assigns the README's heading ids in a commit callback ref; an attachment cannot,
      and the build is what said so.** Written that way first, `pnpm -F docs build` failed —
      `no element with id="…" exists on /docs/cli`. SvelteKit validates every `#fragment` against
      the HTML it prerendered, and it is right to: a deep link resolves before any of our JS runs.
      Ids are handed out **during** render through a context cursor keyed on the body, so a
      `/docs/core` → `/docs/cli` navigation cannot draw from an exhausted one
- [x] **The two `svelte-version-sync` `it.todo`s are closed** — CLI **1,935 → 1,937 passing,
      27 → 25 todo**. They were deferred because the surfaces they assert on did not exist; writing
      the READMEs is what made them assertable. Prerender **236 → 238 pages**; 12 production loads
      (2 pages × 3 widths × 2 themes) with 0 console errors, outline 17/4 entries and 0 broken
      anchors. Client JS **+49,509 B (+1.16%)**, of which 42,704 B is the README chunk nothing
      preloads; the `/docs/<slug>` route pays **+62,492 B** for `Markdown` joining its graph,
      measured against a controlled build with the package view stubbed out
- [x] **The release metadata is set — 2026-08-09.** All **10 packages** go to **`0.3.0`**, matching
      the upstream release this port is built against, and `private: true` comes off
      `packages/cli`. Every package gains `repository` (with its `directory`), `bugs` and
      `homepage` pointing at **`github.com/devrohit06/astryx-svelte`** — which closes the standing
      item that `issuesUrl()` returned `undefined` for every core-owned reference;
      `DEFAULT_ISSUES_URL` now resolves, verified by importing it
- [x] **Bumping the version made the READMEs lie, and the page is what showed it.** With
      `isReleased` flipping true, `Install v0.3.0` rendered directly above a callout still reading
      "`packages/cli` is `private` at `0.0.0`" — two contradictory claims on one screen, and the
      second was now simply false. Both READMEs and `getting-started.doc.mjs` are reworded to the
      one thing that is still true: the packages are versioned and **ready** to publish, and
      nothing resolves until the first `npm publish`. **This self-retires on publish** rather than
      on an edit — which is the property the previous wording lacked
- [x] **The repo shipped no LICENSE file at all, while all 10 packages declared `"license": "MIT"`
      — 2026-08-09.** A declared license with no text is the one governance item that is not
      cosmetic: MIT requires that "the above copyright notice and this permission notice shall be
      included in all copies", and this port is a derivative work that reproduces upstream's prose,
      token values, component APIs and test suites. **`LICENSE` now exists at the root and in all
      10 packages**, and `npm pack --dry-run` confirms it reaches both tarballs (core 2,993 files,
      cli 220) — npm includes `LICENSE` regardless of the `files` array, but it was worth proving
      rather than assuming.
      **The MIT body is byte-identical to upstream's, verified by `diff`**, carrying both copyright
      lines and an Attribution section that names what is derived (component APIs, tokens,
      documentation prose, the case-for-case test suites) and what is this port's own (the Svelte 5
      implementation, the StyleX adapter, the codemod runner).
      **`research/05-shadcn-svelte-playbook.md` guessed the notice wrong**, and told us to check:
      it says to reproduce `Copyright (c) Meta Platforms, Inc. and affiliates`, where
      `facebook/astryx/LICENSE` and the published `@astryxdesign/cli` both read
      **`Copyright (c) 2026 Meta Platforms, Inc.`** — no "and affiliates", and with a year. The
      planning line's own instruction to "verify the exact notice … and reproduce it verbatim" is
      what caught it
- [ ] **The port's copyright line reads `Rohit Kushwaha`**, taken from the repository's git
      identity. Change it if a different legal name or entity should hold it — it appears in all 11
      files
- [ ] **Nothing is on npm yet.** The packages are publishable; publishing is a human action and has
      not happened. **The `@astryx-svelte` org must be created on npm first** — a scoped publish
      does not auto-create it. `npm publish` is then the only remaining step, and the install
      instructions become true the moment it runs
- [ ] **Send the blessing message.** `research/05-shadcn-svelte-playbook.md` item 9: reach out to
      the Astryx maintainers the way huntabyte did with shadcn — "it costs one message and it is
      the difference between a welcomed port and a cease-and-desist". Cheaper before the first
      publish than after
- [ ] **`What's New` (`/changelog`) stays blocked** on the route and the data — still zero
      `CHANGELOG.md` files, no tags, no commits
- [ ] **`List` items are `4px 8px` where upstream's are `8px`** — core's `Item` at
      `density="compact"`. A core parity question, not a docs one
- [ ] **Section anchors are a `#` text link; upstream's `AnchorHeading` is a ghost `IconButton`**
      that copies the deep link and reveals on hover/focus-within


### Core's dependencies are upstream's again — 2026-08-09

Prompted by a reader asking whether the port had drifted from Astryx's
"dependency-free" claim. It had, in two places, and the manifests are what settled it —
`@astryxdesign/core` declares **one** runtime dependency, `intl-messageformat`, and
this port declared three.

- [x] **`runed` is gone, and the cost was out of all proportion to the use.** It supplied exactly
      one import — `Context` — across **39 modules**, and only `set()` and `getOr()` were ever
      called. For that it brought **555 KB, three transitive dependencies** (`dequal`, `esm-env`,
      `lz-string`) and, the part that actually mattered, **peer dependencies on `@sveltejs/kit`
      and `zod`** — so a plain-Svelte consumer with no SvelteKit was being asked to satisfy a peer
      for a framework they had not chosen. `internal/context.ts` now owns the class in ~40 lines
      over Svelte's own `getContext`/`setContext`.
      **The full `runed` API is implemented, not just the two methods used**, and that is not
      speculative: the barrel **publishes ten of these instances as public values**
      (`TableContext`, `SizeContext`, `AppShellMobileContext` …, which is upstream's own split —
      the context object is exported and its reader is not), so a consumer holding one can call
      anything the class exposes. Narrowing it would have been a breaking change dressed as a
      cleanup. Behaviour matches `runed@0.37.1` member for member, `get()`'s throw-by-name
      included
- [x] **`@stylexjs/stylex` moved from `dependencies` to `peerDependencies`, which is where upstream
      has it.** Not cosmetic: the consumer's own bundler compiles StyleX over core, so a second
      copy resolving at a different version renders **unstyled with no error** — the failure mode
      CLAUDE.md already names as this repo's nastiest. It is added to core's `devDependencies` at
      the same range, since a package does not install its own peers and the build, tests and
      class oracle all need it. `packages/core/README.md` already told consumers to install it, so
      the manifest now agrees with the documentation instead of contradicting it;
      `getting-started` gained the same line, which it had been missing
- [x] **A ported test caught the peer change, correctly, and was sharpened rather than deleted.**
      `svelte-version-sync`'s "core declares exactly one framework peer dependency" is this port's
      stand-in for upstream's react/react-dom range check, and it failed on
      `['@stylexjs/stylex', 'svelte']`. StyleX is not a framework peer and is not this port's
      addition — upstream declares it too — so the case now excludes build-tool peers and still
      asserts exactly one framework peer. **Mutation-checked**: adding `solid-js` fails it

**Core's dependency set is now identical to upstream's**: `intl-messageformat` alone, with StyleX
peered. The CLI is *lighter* than upstream's — same `commander`/`jiti`/`zod`, minus `jscodeshift`,
plus `magic-string` and `zimmerframe`, both zero-dependency. `theme-*` carries `@lucide/svelte`
where upstream carries `lucide-react`. Verified after the change: **class oracle 1,528 keys / 0
mismatches**, core server 811/811, the three context suites 79/79, CLI 1,937 + 25 todo, both theme
oracles clean, `build`/`check`/`lint` all 0.


### Landed

- [x] **Analytics, off the main thread — 2026-08-13.** GA4 via `gtag.js`, run inside a Partytown
      web worker rather than on the main thread, gated on `PUBLIC_GA_MEASUREMENT_ID`. Three parts:
      `scripts/vite-plugin-partytown.mjs` (copies the lib into `static/~partytown/`, serves the
      loader snippet as a virtual module so the package never enters the client graph),
      `src/lib/analytics/gtag.ts` (the head block and the navigation hit) and
      `analytics.svelte` in the root layout. **The measurement id is not committed** — `.env` is
      tracked with an *empty* value, because `$env/static/public` cannot import a name nothing
      declares and a dashboard-only variable would break every checkout and CI run; the real value
      goes in the Vercel project, which wins over `.env` in Vite's `loadEnv` order. Unset, the whole
      thing dead-code-eliminates: verified zero `partytown`/`googletagmanager` strings in the
      prerendered HTML and the client bundle. Four things the browser had to settle, all in
      `gtag.ts`'s docstring: `googletagmanager.com` reflects the origin in
      `Access-Control-Allow-Origin`, so **no `resolveUrl` reverse proxy is needed** despite what
      Partytown's docs imply; a client-side navigation must push a **plain array**, not an
      `arguments` object, which produces no hit at all through the forwarding stub; the worker's
      synthetic `location` **drops the port**, so local verification looks wrong and production is
      fine; and a browser without service workers reports nothing, because Partytown's 10s fallback
      recovers inline scripts but not `src` ones. Verified against a preview build: worker active,
      `gtag.js` fetched from inside it, and one `page_view` per navigation with the right `dl`/`dt`
      and no double-count on entry
- [x] **The social card is the landing page — 2026-08-13.** `static/og.png` was a hand-drawn card
      (headline, subhead, three stat columns) from a time when the landing page was a plain hero.
      It is now a 1200×630 crop of a committed 1920×1080 capture of `/`, so the unfurl shows the
      wordmark, the floating product cards and the reel. The capture is committed
      (`scripts/og-source.webp`) rather than taken live, which keeps `generate-og-image.mjs` a pure
      function: a live shot would need the site running *and* would race the hero reel's rotation,
      so a re-run for an unrelated change could land on a different slide. **The trade is
      legibility** — a screenshot at thumbnail size has no readable type, where the drawn card did.
      Re-capture at 1920×1080 on the first slide when the page changes enough to warrant it
- [x] **`/blog` and `/blog/<slug>` — 2026-08-10.** Upstream's blog surface, ported, with one post of
      this repo's own. The split is worth stating because it decided the whole shape: the **content**
      is Meta's prose and does not port (their seven posts stay theirs), but the **surface** ports
      like anything else. `src/lib/blog/posts.mjs` is upstream's own module copied **verbatim** —
      frontmatter parser, six-type schema, validation, reading-time estimate and latest-first
      ordering — so a post that builds here builds there, and upstream's authoring README describes
      this port exactly. `schema.ts` and `release.ts` likewise. Only `authors.ts`'s *entries* are
      ours, since copying Meta's team into a port they did not write would misattribute it.
      Components: `blog-index`, `blog-card`, `blog-article`, `author-byline`, `release-cover-art`.
      **Two upstream behaviours are load-bearing and easy to lose** — the type filter only renders
      when more than one type has posts (this port is the single-type case today), and the feature
      card only appears under "All", because "featured" within a filtered subset is a claim the
      ordering does not support. Three details worth keeping: drafts follow `NODE_ENV`, so `dev` and
      `build` legitimately disagree about the post count; `headingLevelStart={2}` is what stops a
      post body growing a second `h1`, and upstream's own posts use `##`, which lands them at `h3`;
      and core's `Markdown` takes its source as `children: string`, so upstream's JSX child becomes
      an attribute. Validation runs on every build in place of upstream's `blog.test.ts`, which has
      no runner here — a malformed post fails the build with a slug-prefixed error. Verified in the
      browser and in the prerendered output: `/blog` and `/blog/astryx-svelte-v0-3-0` both static,
      body prose at the article's 17px override, three related-doc cards, three tag badges
- [x] **Every live preview renders under `neutralTheme`, not the docsite's brand theme — 2026-08-10.**
      This was wrong on the site for its whole life and the port had *written down* the wrong reason
      three times. Upstream's `ComponentPreviewTheme` wraps `ComponentDetailClient`, `ExampleBlock`
      and `InteractivePreview` (×3), and standalone neutral `<Theme>` boundaries wrap
      `ShowcaseThumbnail`, `TemplateThumbnail` and `TemplatePreviewSurface`. This port dropped all
      six, with `example-block`, `showcase-thumbnail` and `template-preview-dialog` each explaining
      that "a second identical boundary would be a no-op" — and the root `+layout.svelte` docstring
      asserting the same premise, which is what licensed the other three. **The premise was false:**
      the ambient theme is `astryxTheme`, so the boundary *switches* the theme rather than repeating
      it, and every example, gallery tile and template was rendering in the brand skin (pill buttons,
      `#15110C` accent, +4px radii) instead of the theme a reader installs. Now
      `shell/component-preview-theme.svelte`, with upstream's module-load `registerIcons` for the
      SSR/hydration glyph mismatch it documents. Measured in a real browser before and after, and in
      the prerendered HTML: `/components/Button` went from **1 `astryx` wrapper and 0 `neutral`** to
      **1 `astryx` and 6 `neutral`**, its Primary button from pill/`#15110C` to `10px`/`#262626`.
      Upstream's `component-preview-theme.test.ts` is ported as
      `docs/scripts/check-preview-theme.mjs` — a node assertion script rather than a vitest file,
      because `docs` has no runner and its `test` script is already exactly that shape — and it
      guards three surfaces upstream's directory-scoped regexes never see. **The lesson worth
      keeping: a comment asserting parity is not evidence of it.** Four files agreed with each other
      and none of them agreed with upstream; it took re-cloning the reference tree to see it
- [x] **The top nav's Community button**, upstream's `HeartHandshake` slot between the mode toggle
      and GitHub. It had been left out under `nav-items.ts`'s rule against linking to a 404, and
      `/community` now exists, so it returns with it. The glyph is a docs-local Lucide mark
      (`heart-handshake-icon.svelte`) beside `moon-icon`/`sun-icon`/`github-logo`, not a registry
      substitution — the icon is the control's whole meaning. Path data verified byte-identical
      between `lucide-react@1.25.0` (what upstream resolves) and `@lucide/svelte@1.30.0`
- [x] **The StyleX consumer seam** — the thing that had to work before any of this was worth
      planning. `@astryx-svelte/core` ships its `.stylex.js` modules **uncompiled** (`svelte-package`
      transpiles TypeScript; it does not run StyleX), so every consumer compiles them itself. The
      docs app runs `@stylexjs/unplugin` with options copied verbatim from `packages/core`, plus
      `optimizeDeps.exclude` and `ssr.noExternal` for core — without those two, Vite's esbuild
      pre-bundler and the SSR externaliser both route the modules around the plugin and
      `stylex.create` survives into the browser as a runtime no-op. Verified end-to-end: 1202 atomic
      classes emitted, correct layer order, real classes in the SSR HTML, in **both** dev (virtual
      module) and production. See [Docs-site integration facts](#docs-site-integration-facts)
- [x] **The content pipeline** — `docs/scripts/generate-content.mjs` + `vite-plugin-content.mjs`,
      emitting `src/lib/generated/*` and regenerating on `.doc.mjs` change. Reads from
      `node_modules/@astryxdesign/{core,cli}` pinned to **0.1.7**, the exact version
      `packages/core` targets — not from the gitignored upstream clone — so a CI checkout generates
      identical output. Replicates upstream's `requireDisplayName()` build gate
- [x] **Props typed from our own declarations, not upstream's strings.** 1027 of 1049 documented
      props resolve against `packages/core/dist/**/*.d.ts`; the remaining 22 each carry a written
      reason. This was the correction that mattered: `research/04` risk #2 proposed mapping
      `ReactNode` → `string | Snippet`, but `Button.icon` is `Snippet` here with **no string
      branch**, so the mapping would have documented an API that throws. Upstream's `.doc.mjs`
      supplies the prose; the compiler supplies the types


### 1:1 pass over the docs pages (2026-08-03)

The v1 pages were _structurally_ upstream's but rendered with hand-rolled markup where upstream
composes its own components. Closed in this pass:

- [x] **Every example now shows its source.** Upstream's `ExampleBlock` is `Card padding={3}` →
      name → live preview → a muted, top-divided strip carrying a small `TabList`, and the panel it
      switches (Description / Code). This port had **no code view at all**. Source comes from a
      second `import.meta.glob(..., {query:'?raw'})` rather than the generator: upstream bakes each
      `.tsx` into its registry, which here would ship ~400 sources on every page load to serve one
      collapsed tab. The leading porting-note comment is stripped — it is this repo's note to its own
      contributors, not example content
- [x] **The gallery is a thumbnail grid, not a list of names.** `ShowcaseThumbnail` renders each
      component's showcase block live at 2× and scales it to 0.5, gated by an `IntersectionObserver`
      (200px margin) with `content-visibility: auto`, `inert`, and a `<svelte:boundary>` where
      upstream has an error boundary. Plus upstream's centred `display-1` hero and the "Install core
      library" `Popover`. **Upstream's `CATEGORIES` order is alphabetical** — Chat is second, not
      eleventh; this port had it near the end
- [x] **Component page rebuilt to `ComponentDetailClient`** — 960px transparent `Section`,
      `display-1` title over a package caption, `display-3` section headings, Usage prose at
      `type="large"`, best practices _nested inside_ Usage, showcase in a `Card variant="muted"`, and
      the Overview / Properties tab pair with the `?tab=` round-trip
- [x] **Best practices is a Guidance/Practices table**, upstream's `BestPracticesBlock` — a 100px
      badge column against a prose column, not a badge floating beside a paragraph with nothing
      naming what it meant. `Table` is unported, so it is a `<table>`, as `props-table.svelte`
      already is
- [x] **Anatomy section removed.** Upstream ships `component-detail/Anatomy.tsx` but **imports it
      nowhere** — the anatomy in `.doc.mjs` is rendered on no upstream page. Rendering it here was
      invented content. Worth remembering as a general trap: _a file existing upstream is not
      evidence upstream renders it_ — grep for the import before porting a component
- [x] **`/docs` 404'd.** Upstream redirects it to `/docs/getting-started`; nothing in the site
      linked to bare `/docs`, so no page surfaced the gap — but it is the URL a reader trims to
- [x] **Doc pages use upstream's title treatment** — `Heading level={1} type="display-1"`, dek at
      `type="large" color="secondary"`, and the prose column capped at upstream's `proseMaxWidth` of
      **800px** (was 960px) with the article body type scale re-declared at 17px/1.647
- [x] **Footer rebuilt from the design system** — `Section role="contentinfo"` + `Grid`/`GridSpan` +
      `Link type="supporting" isStandalone` + `Divider`, upstream's two-row shape, replacing raw
      `<footer>`/`<nav>`/`<a>`. Meta's social and legal blocks stay out (see Release & governance);
      the unofficial/not-affiliated notice takes that space
- [x] **Sidebar search is the real `TextInput`** — upstream's `SideNav topContent` is exactly a
      `TextInput` with `isLabelHidden`/`startIcon`/`hasClear`, and it is ported, so the hand-rolled
      `<input>` was a lookalike for something already shipped
- [x] **Centring bug** — `margin-inline: auto` sat on a full-width wrapper `div`, which does nothing;
      the capped `Section` inside stayed hard against the left edge. It belongs on the `Section`,
      which is where upstream's `xstyle={{marginInline:'auto'}}` puts it


### The navbar and the landing page, 1:1 (2026-08-03)

The home page was a hand-written stat card; upstream's is a themed hero reel over a
pin-and-cover showcase. Both it and `SharedTopNav` are now ported. What landed:

- [x] **`SharedTopNav` verbatim** — logo-only `TopNavHeading`, links as `centerContent` (bare in
      `drawer` render mode, wrapped in the `display:none`-at-768px `.desktop-nav` otherwise), and an
      `endContent` of `HStack gap={2}` around `HStack gap={0.5}` of ghost icon `Button`s + the
      primary CTA + a hamburger gated on `useAppShellMobile().isMobileNavEnabled`. The `⌘K` handler
      and the `SearchPalette` moved _into_ the nav, where upstream keeps them
- [x] **`astryxTheme`, the docsite's own brand theme** — `docs/src/lib/themes/`, compiled to
      `src/lib/generated/astryx-theme.css` by `scripts/build-astryx-theme.mjs` and stamped
      `__built: true`, exactly as upstream's `astryx theme build` artifact is. The config is a
      separate module taking the brand colour as an _argument_, because the build script runs under
      plain Node: the `@astryx-svelte/core/theme` barrel re-exports `theme.svelte`, which Node
      cannot load, and Node does not resolve a `.js` specifier to a `.ts` file
- [x] **The hero theme reel** — provider + wordmark/cards/stack/dots placements, the aurora blob
      layer, the per-slide `theme-fill` and `nav-backdrop` bands, touch swipe, visibility pausing,
      idle-time font/image warming, and `HeroFloatingCards` in both `overlap` and `stack` layouts
- [x] **`FeaturesShowcase`, `AboutShowcase`, `DiscoverShowcase`** + `ComponentsPreview` and
      `CliPreview`
- [x] **The `(site)` / `(docs)` layout split**, as upstream's two route-group layouts:
      `variant="surface"` (was `"section"`), `mobileNav={false}` on the marketing route, and the
      `shell`/`main`/`footer` flex column from `layout.module.css`
- [x] **`astryxTheme` is the site-wide theme**, as upstream's root `Providers` makes it — not
      scoped to the marketing route. The consequence is upstream's too and is worth stating rather
      than discovering: **every component example now renders in the Astryx brand** (pill buttons,
      near-black accent) instead of the neutral theme's own colours. `docs.css`'s note about why the
      _brand_ colour is a docs-chrome token and not `--color-accent` still stands and is unaffected;
      `neutralTheme` stays imported because the reel's registry lists it as an installed package
- [x] **The footer's attribution** now follows the shape shadcn-svelte uses — "Built by _upstream_.
      Ported to Svelte by _porter_." — over the not-affiliated notice, which stays
- [x] **Sun/moon are real glyphs, not registry stand-ins.** The toggle first shipped with
      `eyeSlash`/`info` — the substitution convention the rest of the site uses for a missing icon —
      and it read as an eye and an info circle. A stand-in is fine when the glyph is incidental and
      wrong when **the icon is the control's entire meaning**, so these two are inlined as docs
      chrome (`sun-icon.svelte` / `moon-icon.svelte`) beside `github-logo.svelte`, outside the
      `Icon` registry the theme oracle covers. Worth generalising when the icon-registry item lands
- [x] **One shared colour-mode instance.** `useColorMode()` is a factory, not a store, and it was
      being called in both `+layout.svelte` and `+page.svelte` — two independent `$state`s, so the
      nav toggled one and the hero reel read the other and the hero never changed mode at all. It
      is now created once in the layout and published via context, which is exactly the shape
      upstream's `ThemeModeContext` has. **General trap: a `use*()` factory returning `$state` is
      per-caller; anything more than one caller needs a context or a module singleton**

**The translation trap this batch paid for twice, worth writing down.** Upstream hangs `xstyle` on
the `VStack`/`HStack`/`Card` _itself_, so sizing and flex alignment share one box. Svelte's style
scoping cannot reach a child component's root element, so the tempting move is to wrap the Stack in
a styled `div` — and it is wrong every time: `align-items` stays on the Stack while the width and
padding move out one level. It cost a `row-gap` override that silently no-opped on a non-flex
wrapper, two heading blocks that stopped centring on mobile, a card whose padding ended up on its
560px content column, and a bento column that never collapsed to a single stack because
`display: contents` dissolved the wrapper but not the Stack inside it. **Where upstream styles a
Stack, write a plain element and declare the flex the Stack would have applied** — `gap={N}` maps
1:1 to `--spacing-N` (the scale is the discrete set `0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10`),
and a Stack with no `align` emits _no_ `align-items` at all.

Deliberately not ported, each blocked rather than skipped:

- [x] **Four of the reel's five theme slides** — **closed by the theme batch.** The reel was one slide with
      `HeroReelDots` rendering nothing (its own `slides.length <= 1` guard), because `themeFor()`
      returns `null` for an uninstalled package. **The prediction that a ported theme would be one
      line in `THEME_OBJECTS` held exactly**: that map and the font `<link>` were the only two edits
      the reel needed — every content, aurora, wordmark, dark-mode and label table was already
      complete for all five. Verified by clicking each dot in real Chromium: five dots, and the hero
      switches to `matcha`/Playwrite US Trad, `butter`/Outfit, `gothic`/Fustat **in dark mode**
      (it is a dark-only theme) and `y2k`/Poppins, each with its own `--color-accent`, and zero
      console errors or hydration warnings
- [ ] **The Themes and Templates bento tiles** — `ThemesPreview` needs the theme registry,
      `TemplatesPreview` needs the 42 page templates. Both omitted, and **the desktop bento is two
      columns instead of three** for as long as they are: upstream's third column would otherwise be
      a 400px hole. Dropping them also forced a _rebalance_, which is the part worth recording —
      keeping upstream's column membership and merely deleting the third track left the heading
      alone in column 1 above a 700px hole with both surviving cards stacked in column 2, and the
      section read as broken. The two real tiles are now one per column and both grow. Restoring a
      tile means putting it back in its upstream slot and restoring the third track
- [ ] **`BlogShowcase`** — a whole landing section on `blogRegistry` + `BlogCard`/`BlogFeatureCard`
- [ ] **The chat composer inside `HeroFloatingCards`** — `ChatComposer`/`ChatSendButton` are batch 13. `HeroThemeContent.chatPrompt` stays: it is upstream's data shape and returns with the
      component
- [ ] **The Community icon button** and upstream's `trackSearch`/`trackClickCta` analytics
- [ ] **`hero/AstryxWordmark.tsx` is not ported, and should not be** — upstream ships it with a
      docstring claiming the hero uses it, but **nothing imports it**; `HeroThemeReel` renders
      `AstryxLogo` from `logos.tsx`. A second instance of the trap already recorded for `Anatomy`


### Theme parity: 196 → 328 of upstream's 331 declarations (2026-08-03)

The theme oracle was **one-directional** — it proved every declaration we emit matches upstream, but
never that we emit every declaration upstream has. We shipped **196 of 331**. Worth remembering as a
general trap: _a green one-directional oracle is not coverage_, and the missing direction is the one
that hides whole features.

No colour **token** was ever wrong — all 135 missing declarations were tokens that existed but were
never _applied_, plus the type scale. Closed:

- [x] **The semantic type scale (40 declarations).** `expandTypeScale` only ported layer 1 (raw
      `--font-size-*`) and heading weight overrides, so the theme emitted **2 of upstream's 42**
      `--text-*` declarations and every component fell through to `typeScaleDefaults` in
      `tokens.stylex.ts`. Those defaults agree with the neutral theme everywhere **except**
      `--text-display-3-leading` — static table says `1.2414`, upstream's 4px-grid snapping says
      **`1.3793`** — so the gap stayed invisible until a page rendered `display-3`. The worse half:
      a theme with a _different_ `scale` got upstream's leadings rather than its own
- [x] **The `@layer reset` prose block (34).** `--color-text-primary` on bare `h1`–`h6`/`p`,
      `--color-text-secondary` on `small`, `--color-border` on `hr`, plus the heading family and
      scale. Any HTML that is not a `Text`/`Heading` component — docs prose, copied example markup —
      was rendering with no theme colour at all
- [x] **`Text`/`Heading` component bindings (58).** Upstream's `generateTypeScaleComponents`, plus
      the five colour variants (`primary`/`secondary`/`disabled`/`placeholder`/`accent`) for both
      components. These sit in the `astryx-theme` layer, _above_ the components' compiled StyleX, so
      upstream's `Text` takes its colour and metrics from the **theme**; ours took them from StyleX
      defaults. This is what made colours visibly diverge while the token oracle stayed green

The remaining **3** are the `color-scheme` declarations, which this port deliberately keeps in
`base.css` with a broader selector than upstream's `html[data-theme=…]` — they are present, just not
in `theme.css`, and `base.css` documents why.

Still open from this pass:

- [x] **Hydration is now testable at all** — `scripts/ssr-fixture-plugin.mjs` +
      `src/tests/tab-list-hydration.svelte.test.ts` (3 cases). A `.svelte` file compiles for one
      target per module graph, so the browser project (DOM build, can `hydrate()`) had no way to
      obtain server markup, and `mount()`-and-snapshot is not a substitute — client rendering omits
      the `<!--[-->` / `<!--$sN-->` markers hydration navigates by, so hydrating it tests nothing.
      The test asks the Vite dev server, which _does_ have an SSR graph, to render the fixture. One
      trap worth remembering: `render` must be pulled through `server.ssrLoadModule('svelte/server')`
      too — importing it at the Node level gets a second Svelte instance and the component dies in
      `push_element` against a null current-component
- [x] **The docs-shell hydration mismatch no longer reproduces** — swept 2026-08-03 and closed as
      not-reproducible rather than diagnosed. It had surfaced as _"Failed to hydrate"_ followed by
      `Tab` throwing "useTabListContext must be used within TabList"; the earlier round had already
      exonerated `TabList` itself, duplicate module instances, HMR staleness and the icon registry,
      and left `$props.id()` marker ordering as the thing to check next. Nothing was found to check:
      **156 of 156 production routes and 48 dev routes are clean** — every `/docs` topic, the home
      page, the gallery and a spread of 27 component pages, all of which render both `TabList`s (the
      page's Overview/Properties pair and `ExampleBlock`'s Description/Code strip). Two things about
      the method are worth keeping, because a naive sweep would have "passed" without meaning
      anything:
  - **Production cannot detect this.** Svelte logs the hydration failure only in dev builds, so the
    clean prod sweep is evidence about rendering, not about hydration. Dev is the detector.
  - **A page that never hydrated also looks clean.** The sweep carries a positive control (an
    element count that only a hydrated page reaches) _and_ was calibrated against known-noisy pages
    until it reported them — `load` + 900 ms was too early and returned a false clean; `networkidle`
    - 3 s surfaces the same warnings the control run does. On `/components/Button` a tab click
      changes the DOM, which is hydration proven rather than assumed.

      Left as-is: whatever fixed it is not identified, most likely the 1:1 pass's rebuild of the
      component page and shell. Re-open with the same harness if it returns.
- [x] **The `/components` gallery rendered an unnamed dialog** — found by that sweep, and the only
      real defect it turned up. The install `Popover` is a `role="dialog"` with no accessible name,
      so assistive tech announces "dialog" and nothing else; `usePopover` warned about exactly that
      on every visit. Upstream's own gallery passes only `width` and `content`, and its `usePopover`
      carries the identical warning — so the port was faithful and upstream trips its own
      diagnostic. Fixed here rather than replicated, on the `Code/CodeInlineInParagraph` precedent:
      an a11y defect on a page _we_ ship is fixed and documented, where a component's own behaviour
      would be replicated. `label` is `Popover`'s public name for `usePopover`'s `dialogLabel`
- [ ] **`useImageMode`'s cross-origin sampling fails on every CDN image** — also found by the sweep,
      and cosmetic today. Upstream's example blocks reference `lookaside.facebook.com` (21 files
      here, 23 upstream — transcribed verbatim, which is correct); the `<img>`s themselves all load
      (8/8 on `/components/Lightbox`, 16/16 on `/components/Avatar`, 12/12 on `/components/AspectRatio`,
      nothing broken), but `useImageMode`'s APCA pixel sampling **fetches** the image, and a
      cross-origin fetch without CORS headers fails. So the on-media theme silently falls back to
      its default instead of adapting to the image, and the console carries a CORS error per image.
      This is the same hazard `thumbnail-images.ts` already substitutes local data URIs for; the
      remaining blocks cannot take that fix without diverging from the upstream source the component
      page _displays_. (`/components/Avatar`'s two `does-not-exist-*.jpg` failures are not this —
      `AvatarFallbackChain` uses missing URLs on purpose.)
- [x] **The theme oracle is bidirectional** — **DONE.** It reported `not found upstream` but never
      _upstream-not-found-here_, which is how 135 missing declarations sat behind a green run. The
      reverse diff now runs, with an `emittedElsewhere` allowlist carrying the 3 `color-scheme` rules
      `base.css` owns and a written reason for each. The entries are **self-retiring in both
      directions**, as the class oracle's skips are: one naming a declaration upstream has dropped
      fails, and so does one we start emitting from `theme.css` after all. Two things found on the
      way in and worth keeping: **the script had no exit code at all** — `test:parity` ran it, read
      its output and always passed, so even the _forward_ direction was advisory rather than
      enforced; and the 3 `color-scheme` selectors differ (`html[data-theme="light"]` upstream vs the
      broader `[data-theme="light"]` here, because `<Theme>` sets the attribute on a subtree wrapper,
      not only on `<html>`). Mutation-checked four ways — a deleted declaration, a corrupted value,
      an invented one and a stale allowlist entry each exit 1, and the baseline exits 0
- [x] **Mobile on-this-page jump menu** — **DONE.** Upstream swaps the outline aside for a sticky
      `Selector` below 1024px; this port only hid the aside. Now `useMediaQuery` mounts exactly one
      side, as upstream does, so the hidden side's `IntersectionObserver` never runs — and both are
      _also_ styled for their side of the breakpoint, which is what keeps the server's HTML right at
      every width. **That is only hydration-safe because this port's `useMediaQuery` subscribes in
      `$effect.pre`**: it reports `serverDefault` through the server render _and_ the hydration pass,
      which is exactly what upstream's `getServerSnapshot` argument buys. Three smaller pieces came
      with it: the `Outline` seam gained upstream's `onActiveIdChange`, so a viewport crossing the
      breakpoint hands the newcomer the section the other had spied; the title `Divider` hides below
      the breakpoint on outline pages, because the selector carries its own bottom border and the two
      would read as a doubled separator; and the selector's measured height is published as
      **`--docs-anchor-offset`**, which `scroll-margin-block-start` now consumes — the bare `72px`
      there was upstream's `calc(header + var(--docs-anchor-offset, 0px) + 16px)` with the offset
      silently at 0, so a section scrolled to below 1024px used to land _behind_ the pinned selector.
      Verified in Chromium at both widths: at 1280 the aside mounts, the selector does not, offset
      `0px`, scroll-margin `72px`; at 900 the selector mounts sticky at 56px, the aside does not, the
      divider is hidden, offset `57px`, scroll-margin `129px`, and choosing a section sets the hash,
      updates the trigger and lands the heading clear of the pinned selector. No console or hydration
      errors at either width. One thing checked rather than assumed: the trigger's accessible name is
      `combobox "On this page"` from the visually-hidden `<label for>` — `getInputARIA` returns
      `ariaLabelledBy: undefined` outside an `InputGroup`, and that is upstream's own code, not drift


### The launch path

- [x] **Shell** — **DONE.** Header, mode-switching sidebar (docs topics / component registry, with a
      filter box that flattens the groups), footer, `⌘K` palette and on-this-page outline, all in
      `docs/src/lib/shell/`. Hand-built, each behind a seam so batches 9–10 swap the real component
      in without touching a page. The layout is a real `<Theme>` with a light/dark/system toggle
      persisted to `localStorage` and read in `$effect.pre`, so `'system'` is what the server emits
      and the first paint resolves from the OS preference with no hydration flip. The palette
      searches the same in-bundle index the sidebar reads — no Algolia, no Pagefind, as upstream
- [x] **`/docs/<topic>`** — **DONE.** All 19 topics prerendered, `ContentBlockRenderer` for the five
      block types (`prose`/`code`/`table`/`list`/`token-ref`), and upstream's `inlineMarkdown.tsx`
      ported as a pure parser plus a renderer component. `{type: 'table'}` renders a plain `<table>`
      until batch 13. **`TokensDocView`'s live computed value column is now built**: a section that
      declares a `previewType` routes its tables through `shell/token-table.svelte`, which prepends
      a preview cell (swatch, spacing bar, radius box, easing curve, font sample, …) and appends a
      **Resolved** column read from `useTheme().token(name)`, so the number in the table is the one
      the running theme actually computes. One data-driven table replaces upstream's eight
      hand-written ones. A `token-ref` block **inlines** the section it points at rather than
      linking to it — upstream's section-title override does the same, and linking would have left
      `/docs/color` with no colour table at all
- [x] **`/components`** gallery — **DONE.** Grouped by upstream's 12 categories, ported entries
      only, with the unported count stated rather than implied
- [x] **`/components/<name>`** — **DONE**, 134 routes prerendered. Usage prose, import snippet, best
      practices, anatomy, and the props table typed from core's own declarations. Hooks render
      Parameters/Returns instead, keyed on `isHook` (upstream's `params != null`).
      **One deliberate divergence:** upstream splits this into Overview/Properties tabs with the tab
      in the URL, and the outline aside does that job here instead. The tabs exist upstream to carry
      the sticky _interactive preview stage_ that sits above the props table — mechanism B, not in
      the v1 cut — so v1 is one scrolling page with the same sections in the same order. `TabList`
      is ported, so restoring the tabbed shape is markup, not a blocked feature
- [x] **Example blocks — the transcription backlog is finished, and stays finished.** **472 of 482**
      blocks have a Svelte rewrite under `docs/src/lib/examples/<Component>/<Block>.svelte`,
      including **129 of the 131 `isShowcase` blocks**. Worth keeping as a batch-close step:
      **porting a component reopens this backlog**, because a newly documented component brings its
      blocks with it. `Outline` added four (`Showcase`, `Controlled`, `Density`, `DeepNesting`) and
      the count went 406/10-pending to 406/**14**-pending until they were transcribed. None of the
      four needed the deferred markdown helpers. Re-run `pnpm -F docs generate` after any port and
      check the pending number is still exactly the API-blocked ten — the hero preview on every component page but two. **The
      remaining 10 are all blocked on an unported component, not on effort** (below); there is no
      transcription work left. **As of batch 14 that number is 5 of 534**, and all five have the
      _same_ blocker (`useImperativeDialog`/`useImperativeAlertDialog`) — the first time the pending
      set has had a single cause. `hasSvelte` in the generated registry keeps them countable rather
      than silent, and `shell/example-preview.svelte` renders a stated placeholder for each rather
      than an empty box. Blocks are transcribed from the `.tsx` in
      `node_modules/@astryxdesign/cli/templates/blocks/`, not re-authored; each file names its
      upstream source in a header comment, and every substitution or type-level adjustment is
      commented in place
- [x] **141 blocks landed 2026-08-03**, closing the backlog. Five things worth keeping from it:
  - **Blocks are a better fidelity source than storybook stories.** `SegmentedControl`'s two icon
    blocks, `TabList`'s `WithActions`/`WithIcons` and `Tab`'s `WithSelectedIcon` author their SVGs
    _in the block file_, so they transcribe as snippets with **no icon-registry substitution at
    all** — where the demo routes, which port the stories, have to stand in for Heroicons. Where a
    substitution _was_ needed the header comment says so; `arrowUp`/`arrowDown` (VisuallyHidden),
    `search` (Typeahead/Tokenizer/BaseTypeahead), `chevronRight` (TreeList) and `funnel`
    (ToggleButton) are true matches and retire with nothing.
  - **Upstream repeats its data literals inline** (`SelectorWithStatus` writes the same three-role
    array three times). Hoisting them to a `const` was reverted: the component page renders the
    block's _source_, so deduplicating it would document an example upstream does not have.
  - **`OverflowList`/`Carousel` blocks move the per-child variant into the data** — those two take
    `items` + an `item` snippet here, so `OverflowListOverflowBadges` carries `variant` on each
    item rather than on a child element. `OverflowListOverflowDropdownActions` keeps upstream's
    separate `actions` array, because its overflow renderer indexes it by `OverflowItem.index`.
  - **The hook-usage blocks are where the render-split shows.** `useTooltip`/`useHoverCard`/
    `useLayer`/`usePopover` each pass `id: $props.id()` (a hook cannot mint an SSR-stable id) and
    render through `<TooltipLayer>`/`<HoverCardLayer>`/`<Layer>`/`<PopoverLayer>` instead of
    upstream's `render(…)`. `useThemeHookUsage` **must not destructure** `useTheme()` —
    `name`/`mode` are getters, so upstream's `const {name, mode, token} = useTheme()` would
    snapshot them and stop tracking a theme change.
  - **Two blocks needed a sibling module.** `LinkProvider/RouterLink.svelte` holds the second
    component upstream declares in the same file (Svelte has no in-file component declaration).
    It is not a block: the registry only looks for `<BlockName>.svelte`, so a sibling is invisible
    to it. `ResizableSidebar` and `TooltipHookUsage` target two components each via
    `alsoExampleFor`, and `hasSvelte` is per-target — so each needs a copy under **both**
    directories.
- [x] **Batch 10's 44 nav blocks landed**, taking the count 428/54-pending → 472/**10**-pending, the
      API-blocked ten again. Documenting `AppShell`/`SideNav`/`TopNav`/`MobileNav` and their twelve
      sub-components pulled in 44 blocks at once — the largest single reopening of this backlog so
      far, and the clearest case for the batch-close step above. Three things it added to the notes:
  - **The nav blocks split two ways on icons, and the split is per-file.** Every `SideNav*` block
    and three others (`TopNavHeadingShowcase`, `TopNavItemShowcase`,
    `TopNavMegaMenuItemShowcase`) author their Heroicons paths _in the block file_, so they
    transcribe as snippets with no substitution. The `AppShell`/`MobileNav`/`TopNav*` blocks
    `import {…} from '@heroicons/react/24/outline'` instead, so those are registry stand-ins with
    the map named in each header comment (`HomeIcon`→`menu`, `Cog6ToothIcon`→`wrench`,
    `ChartBarIcon`→`viewColumns`, `CubeIcon`→`stop`, `UsersIcon`/`UserCircleIcon`→`info`,
    `BellIcon`→`warning`, …). `MagnifyingGlassIcon`→`search` is the only true match. Retires with
    the icon registry.
  - **An inlined `<svg>` needs its own `width`/`height` here.** Upstream's `SideNavItem.icon` takes
    an `IconType` and `renderIconSlot` wraps it in `<Icon size="sm">`, which supplies the 1rem box;
    the `Snippet` arm renders raw, so the size moves onto the `<svg>`. Blocks whose upstream SVG
    already carries a size (`width="20"`, the heading glyphs) transcribe untouched.
  - **`{null}` children transcribe verbatim** (`SideNavHeadingBasic`/`Showcase`) — Svelte renders
    `null` as the empty string, so `SideNav`'s required `children` is satisfied and emits nothing.
    And `AppShellMobileContext.Provider` becomes `AppShellMobileContext.set(() => …)` in the
    block's own `<script>`: Svelte sets context at init, so the block _is_ the provider, and the
    stored **getter** is what keeps `isMobileNavOpen` tracking rather than freezing at mount.
    `AppShell` blocks keep upstream's `height: 100%` and add a `640×480` wrapper `<div>` with a
    comment, because upstream's docsite supplies that frame via `aspectRatio` and this one's
    preview container is shrink-to-fit on both axes (the `AspectRatioImageGallery` precedent).
- [x] **In-bundle static search** over the generated registries (no Algolia/Pagefind), as upstream —
      `shell/search-index.ts`, ranked prefix → substring → keyword → description, shared by the
      `⌘K` palette
- [x] **Host it** so it cannot drift from what it documents — **live at
      <https://astryx-svelte.rohitk06.in/> since 2026-08-10** (`adapter-vercel`, all 165 pages
      prerendered). All 165 were loaded and checked in a real browser before the deploy (see the
      hydration sweep above): none throws, none fails to hydrate, and every image the example blocks
      reference renders.

      **The live site is built from `main`, and that is now a publishing surface with its own
      staleness.** The deployed release post still carries the two claims corrected in this batch —
      "the CLI is a placeholder and is marked private" and "4,760 tests" — because they were true of
      the commit that was deployed and are false of the tree. Verified by reading the live page, not
      assumed. **A doc fix is not shipped until the site redeploys**, which is a new failure mode
      this repo did not have while the site was local-only


### Page-template icons — real glyphs, and the `IconType` that blocked them (2026-08-10)

The 43 page templates drew the **wrong pictures**. 69 documented substitutions across **37 of
43** files mapped upstream's ~85 distinct Heroicons onto core's **28-name semantic registry** —
`PlusIcon` → `check` (×8, so "Add" buttons drew a checkmark), `StarIcon` → `check` (rating stars
drew checkmarks), `PencilSquareIcon` → `copy`, `SparklesIcon` → `wrench`, `FolderIcon` → `menu`.
The same upstream icon was mapped inconsistently across files (`LockClosedIcon` reached `stop`,
`eyeSlash` _and_ `warning`). Styles were never involved: the class oracle read 0 mismatches
before and after.

**The header comments blamed the wrong thing.** They asserted Heroicons "has no Svelte build".
The real blocker was one line of core: `IconType = Component<SVGAttributes<SVGSVGElement>>`, the
literal translation of upstream's `ComponentType<SVGProps<SVGSVGElement>>`. Component props are
contravariant and the element parameter reaches `DOMAttributes<T>`'s handlers, so **every** real
Svelte icon package failed it — measured, not assumed: `@fvilers/heroicons-svelte` on the element
parameter, `@lucide/svelte` (already this repo's theme dependency) on a narrowed `name`,
`svelte-heros-v2` on a narrowed `focusable`, `heroicons-svelte` on being Svelte 4 classes.
`@heroicons/react` accepts the _full_ `SVGProps` and only adds optional extras, which is why
upstream's type admits its own icon set and ours admitted nothing. `IconType` is now a bare
`Component`, which is the call shadcn-svelte makes for the same reason.

- **All 149 icon sites now draw upstream's glyph.** `@fvilers/heroicons-svelte` mirrors
  `@heroicons/react`'s entry points (`24/outline`, `20/solid`, `24/solid`) _and_ its `XxxIcon`
  export names, so the imports are upstream's with the package name changed. `theme-showcase` is
  the one page upstream draws with Lucide, and it uses `@lucide/svelte` for the same reason.
  Both are `packages/cli` devDependencies — the templates are CLI assets, so resolution has to
  work from that path, and upstream's arrangement is the same (its sandbox declares
  `@heroicons/react`; its CLI declares nothing)
- **One export name differs**: heroicons-react's `Squares2X2Icon` is `Squares2x2Icon` here
- **Three `Selector.startIcon`s in `theme-showcase`** went through the `Snippet` arm, so
  `INVENTORY_FILTERS` became `$derived.by` — a snippet does not exist while `<script>` runs
- [ ] **Templates are not typechecked, and this is how the substitutions survived.**
      Mutation-checked: a deliberate type error in a template produces **0** `svelte-check`
      errors, because `assets/` is outside every tsconfig include. It matters more now that
      templates import real packages — a scaffolded app _does_ typecheck what it received


## Oracle bookkeeping

Not the class/theme oracles — the docs app's own bookkeeping is prop-table drift counts (417 → 457
interfaces, drift 5 → 0), the theme oracle going bidirectional (135 missing declarations found), and
production/dev hydration sweeps recorded inline above.

## What the audits caught

### Icon registry substitutions in page templates

- [ ] **The 28-name icon registry cannot keep upstream's glyphs distinct in a page template.**
      Templates follow the repo's standing rule — where upstream *imports* Heroicons, substitute a
      registry name and document the map in the file header; where upstream *inlines* SVG paths,
      transcribe them. At component-example scale that is nearly lossless; at page scale it is not.
      `editor` alone maps **24 glyphs onto 28 names**, with seven names carrying two or more; the
      worst reads are `SparklesIcon`→`info` and `LightBulbIcon`→`warning`, which render as status
      glyphs they are not, and `product-detail`'s `PlusIcon` and outline `StarIcon` both landing on
      `check`. Every collision is named in its file's header and every mapping is marked as retiring
      with the registry. The fix is growing the registry, not per-file workarounds
  - Retired by: `@fvilers/heroicons-svelte` now ships as a real dependency and every page template
    (`packages/cli/assets/templates/pages/*`) imports upstream's actual Heroicons directly
    (`Icon icon={SomeHeroIcon}`), replacing the lossy 28-name registry substitution this entry
    described.

### `VisuallyHidden.as`, found porting an example block


- [x] **`VisuallyHidden.as` was narrowed to `'span' | 'div'`; upstream types it `ElementType`.**
      Found porting `VisuallyHiddenStructuralHeading`, whose whole point is `as="h2"` — a heading
      that gives assistive tech a landmark where the layout already makes the grouping obvious to
      sighted users. The port's narrower union made upstream's own documented example a type error,
      so the block could not be transcribed at all. Widened to `keyof HTMLElementTagNameMap`, the
      counterpart `Stack`/`StackItem` already use for the same upstream `ElementType`. Runtime was
      always correct (`<svelte:element this={as}>`); this was a types-only defect, which is why
      nothing rendered wrong and no test caught it. **The lesson generalises: a prop union narrowed
      "to what the docstring mentions" is an invented API when upstream's is open** — worth an
      `astryx-parity` sweep for other hand-narrowed `as`/variant unions
  - Retired by: own title says resolved (whole group is "Fixed, found by porting an example block").


## Rules promoted

- `CLAUDE.md` § "The docs site" — the StyleX consumer seam: `docs/vite.config.ts` running the same
  `@stylexjs/unplugin` options as `packages/core`, plus `optimizeDeps.exclude` and `ssr.noExternal` for
  `@astryx-svelte/core`, without which the page renders unstyled with no error.

## Retired debts

### Deferred demo blocks / skipped cases, unblocked by component landings


- [ ] `HoverCardInteractiveContent` demo block — triggers from `<Link>` (now ported); pending authoring
  - Retired by: `docs/src/lib/examples/HoverCard/HoverCardInteractiveContent.svelte` now exists;
    `pnpm -F docs generate` reports 0 examples pending.

- [ ] `Popover` drops 0 of 21 cases but skips 1 (`lets Escape fall through to a host Dialog when fully opted out`) — `Dialog` unported; `it.skip` in `src/tests/popover.svelte.test.ts` preserves the count and unblocks when `Dialog` lands
  - Retired by: `popover.svelte.test.ts`'s own header now reads "23 upstream cases, 23 here…
    Nothing is dropped and nothing is skipped" — the case is written out in full against
    `fixtures/popover-in-dialog.svelte` and passes.

- [ ] `Popover` demo ports 7 of 9 storybook stories; `TokenTrigger` (needs `Token`) is absent rather than substituted. **`FilterPanel` is now unblocked** — `CheckboxInput` landed in batch 4 — and is pending authoring
  - Retired by: `docs/src/lib/examples/Popover/PopoverFilterPanel.svelte` now exists;
    `pnpm -F docs generate` reports 0 examples pending.

- [ ] `FormLayout` demo's `Text` placeholders are **fully unblockable now** — `Selector` landed in batch 6, so the last of `TextInput`/`TextArea`/`Selector` is present; pending authoring
  - Retired by: `docs/src/lib/examples/FormLayout/*.svelte` (Horizontal, HorizontalLabels,
    MixedControls, Nested, Showcase) all now exist; `pnpm -F docs generate` reports 0 examples
    pending.

- [ ] `Lightbox` demo ports 3 of upstream's 4 blocks — `LightboxVideo` is absent because it needs a video asset this repo doesn't ship (the other three reuse the four local data-URI scenes `thumbnail-images.ts` already substitutes for upstream's CDN photos, for the CORS reason documented there). `type: 'video'` is still covered by the test suite
  - Retired by: `docs/src/lib/examples/Lightbox/LightboxVideo.svelte` now exists, using upstream's
    CDN URL directly; `pnpm -F docs generate` reports 0 examples pending.


### Docs site


- [ ] **The docs chrome is _partly_ hand-built — batch 9 retired half of it.** The `⌘K` palette and
      the on-this-page outline now run on the real `CommandPalette` and `Outline`; the seams held
      exactly as designed, and no page changed. What is still hand-built is the **header, sidebar
      and footer**, because `AppShell`/`SideNav`/`TopNav`/`MobileNav` are batch 10. A design system
      whose own docs do not use its navigation is a real weakness, not a neutral staging choice — so
      the remaining half is still a debt, not a resting place
  - Retired by: `docs/src/lib/shell/docs-shell.svelte`'s own header now reads "Batch 10 moved both
    to `AppShell`, which now supplies the side panel, its sticky behaviour, the divider, and —
    below the breakpoint — the mobile drawer that this version had no counterpart for at all."

- [ ] **No mobile drawer.** Below 900px the sidebar stacks above the content rather than collapsing
      into a drawer, and the top nav's links and CTA are CSS-hidden. Correct without JavaScript and
      correct on the server, but it is not what `MobileNav` will do (batch 10)
  - Retired by: `AppShell` now supplies the mobile drawer, per `docs-shell.svelte`'s header comment
    quoted above.

- [ ] **69 of 201 upstream doc entries are undocumented here**, because the components are unported.
      The sidebar is correspondingly shorter than upstream's 200 entries. `coverage.js` carries the
      list, so the gap is measured rather than implied
  - Retired by: `pnpm -F docs generate` now reports "216 documented / 219 upstream", and
    `coverage.js`'s `unported` list holds only 3 names (`Chat`, `Indicator`, `Resizable`) — the
    "69 undocumented" figure is off by roughly 66 and would mislead a reader trusting it today.



- [x] **The header carries the real Astryx mark, in Svelte orange.**
      `shell/astryx-logo.svelte` replaces the placeholder rounded square that stood in for a logo.
      Its colour is a **docs-chrome token, `--color-brand: #ff3e00`**, declared in `docs.css`'s
      `product` layer — the same orange the favicon (the Svelte logo) already used, so the site now
      brands consistently. **Deliberately not `--color-accent`:** that token belongs to the theme,
      is byte-matched against upstream by the theme oracle (196/196), and every documented
      component renders from it — recolouring it would make all 406 example previews stop showing
      Astryx's own colours, which is the one thing a fidelity-focused docs site must not do. This
      is also what `docs.css`'s own header rule ("nothing here may restyle a component") exists to
      prevent. If the site should read Svelte-orange _throughout_ rather than only in the chrome,
      that is a deliberate second decision, not an extension of this one
  - Retired by: own title says resolved (checked `[x]`, describes an already-landed change, not a
    standing divergence).

- [x] **Ten example blocks were blocked on unported API, not on effort — and the list is now
      empty.** Every one retired with its blocker, the last five in batch 15:
  - **`useImperativeDialog`** (4) — `Dialog/DialogConfirmationDialog`, `DialogFormDialog`,
    `DialogScrollingContent`, `DialogWithSubtitle`, all driving a second dialog through the
    render-returning hook. **Batch 15.**
  - **`useImperativeAlertDialog`** (1) — `AlertDialog/AlertDialogDeleteConfirmation`, blocked for
    the same reason. `AlertDialogAsyncAction` was _not_ blocked and landed earlier: it uses
    `isInline`. **Batch 15.**
  - **`Table`** (4) — found while porting batch 11 and not previously recorded.
    `Toolbar/ToolbarBulkActions` (also needs `useTableSelection` + `useTableSelectionState`),
    `Toolbar/ToolbarTableFilter`, `Pagination/PaginationPageSize` and
    `Pagination/PaginationWithTable` each render a real `<Table>` beside the component they
    document. Batch 13. The lesson is worth keeping: **a block's blockers are its whole import
    list, not its owning component** — `Toolbar` and `Pagination` are both ported, so nothing in
    the per-component status hinted these four were unreachable.
  - **`SideNav`/`SideNavHeading`** (1) — `NavHeadingMenu/NavHeadingMenuShowcase` builds its menu
    inside them. Batch 10.

  Two of the ten were `isShowcase`, which is why that count used to read "106 of 108". Re-derived
  from the registry rather than carried forward, it is now **140 of 140** — the 108 was stale by
  five batches — and the overall block count is **544 of 544 with nothing pending**, the first
  time this backlog has been empty. What keeps it honest is unchanged: `hasSvelte` in the
  generated registry makes a missing block countable rather than silent, so run
  `pnpm -F docs generate` and read the number instead of predicting it.
  - Retired by: own title says resolved ("the list is now empty" — checked `[x]`).


## Debts opened

-
