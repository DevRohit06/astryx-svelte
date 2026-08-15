---
batch: 10
title: Batch 9 — the chrome, dogfooded
upstream: 0.1.7
units: [CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteItem, CommandPaletteGroup, CommandPaletteFooter, CommandPaletteEmpty, Outline, useScrollSpy, useOutlineFromDOM, LayerProvider, LayerContext]
upstream-prs: []
---

## Scope

`CommandPalette` (+ 6 sub-components), `Outline`, `LayerProvider`. The docs shell starts running on
two of its own components, which is what the batch was for.

## Components

- **Batch 9 — the chrome, dogfooded** — `CommandPalette` (+ 6 sub-components), `Outline`,
  `LayerProvider`. **The docs shell now runs on two of its own components**, which is what the batch
  was for:
  - **CommandPalette** (+ `Input`/`List`/`Item`/`Group`/`Footer`/`Empty` + context) — a `Dialog`
    shell over a `searchSource`, the same interface `Typeahead` takes, with `useCombobox` supplying
    the keyboard model so arrows/Home/End/Enter match `Selector`. **Upstream's `useTransition` plus
    two `useOptimistic`s become two `createOptimistic`s**: `optimisticSearch` is what the input
    shows (it advances per keystroke) and `search` is the committed query the on-screen results
    correspond to, which is what keeps the two empty-state flags exhaustive so the empty state is
    never unmounted mid-search. Classes byte-identical on the first oracle run (**+10 style keys,
    +6 inline call sites, 0 mismatches**). **45 of 45 upstream cases ported** across its six suites,
    plus a beyond-upstream pair (below). One upstream walk is written _once_ here rather than twice:
    `buildSelectableItems` and the render both call `partitionByGroup`, so the flat keyboard index
    and the rendered order **cannot** drift — upstream's own comment says they must match, and it
    keeps two copies. Demo route ports all 8 stories, with **no icon substitutions** (`menu`,
    `wrench`, `info`, `search`, `check` are all registry built-ins)
  - **The `⌘K` palette and the on-this-page aside are now the real components.**
    `docs/src/lib/shell/search-palette.svelte` is a `CommandPalette` over the same in-bundle index
    (`createStaticSource` + keywords, which is upstream's own `SearchPalette.tsx` arrangement), and
    `shell/outline.svelte` is an `Outline`. Both seams held: the shell still mounts
    `<SearchPalette bind:isOpen />` and `<Outline entries … />`, and no page changed. Verified in a
    real browser — grouped results, filtering, Enter-to-navigate, the sliding indicator and the
    scroll-spy all work, console clean
- **Batch 9's other two units — `LayerProvider` and `Outline`**:
  - **LayerProvider (+ `LayerContext`)** — the app-level provider for layer systems: it provides the
    context and wraps its children in a `<ToastViewport>` carrying the `toast` config, and a nested
    provider is a pass-through. **The nesting check reads the context before setting it**, which is
    what makes it see ancestors only — Svelte's context map includes a component's own writes, the
    hazard `<Theme>` had to mint a separate marker context for; here upstream's own order
    (`useLayerContext()` first, provide second) already puts the read on top, so it comes free.
    Worth knowing what this context is _not_: **nothing outside `Layer/` reads it, upstream
    included.** `useToast` keys off `ToastContext`, which `ToastViewport` sets; `LayerContext` exists
    for the sheet/imperative-modal systems upstream's docstring anticipates. So this is faithful
    surface, not behaviour wiring. No styles, so no oracle case (as `MoreMenu`), and **no upstream
    test file**, so no suite is lost. `LayerContext`/`useLayerContext`/`LayerContextValue` are
    deliberately **not** on the root barrel — upstream publishes them from `Layer/index.ts` only, and
    its root carries just `LayerProvider`/`LayerProviderProps`/`LayerToastConfig`
  - **Outline (+ `useScrollSpy` + `useOutlineFromDOM`)** — the table-of-contents nav: a flat `items`
    array rendered as indented anchors, with a **sliding indicator built on CSS anchor positioning**
    rather than measurement (the active link carries `anchor-name: --outline-active`; the bar
    resolves `top`/`height` against it and transitions). Classes were byte-identical on the first
    oracle run: **+10 style keys and +6 inline call sites, 0 mismatches**. `useScrollSpy` is the
    component's engine and stays module-private on both sides — rAF-throttled, resolving the active
    heading from live `getBoundingClientRect` + each heading's own `scroll-margin-top`, with a click
    _suppressing_ the spy until `scrollend` so the indicator lands once instead of chasing the smooth
    scroll through intervening sections. **17 of 17 upstream `it` cases ported** — the three
    `parseOutlineFromMarkdown` cases were deferred with the helper and restored once the parser
    landed in batch 11. The deferred-indicator behaviour was mutation-checked — moving the indicator
    immediately instead of on `scrollend` fails the case that pins it. Demo route ports **6 of
    upstream's 7** stories; `ExtractFromMarkdown` is still outstanding, though the parser it waited
    on has since landed


## Oracle bookkeeping

`CommandPalette`: byte-identical on the first oracle run (+10 style keys, +6 inline call sites, 0
mismatches). `Outline`: byte-identical on the first oracle run (+10 style keys and +6 inline call
sites, 0 mismatches). `LayerProvider`: no styles, so no oracle case (as `MoreMenu`).

## What the audits caught

### Batch 9 — `Outline`'s deferred half, a shared anchor name, and a link alias nobody had recorded

- [x] **`parseOutlineFromMarkdown` and `useOutlineFromMarkdown` landed with `Markdown/parser` in
      batch 11**, retiring the batch-9 deferral. Their three cases in
      `src/tests/outline.svelte.test.ts` are restored unchanged (the helper is pure), and upstream's
      separate `parseOutlineFromMarkdown.test.ts` is ported whole — 12 of 12 — as
      `src/tests/parse-outline-from-markdown.test.ts` in the server project. Upstream ships **no
      suite for `useOutlineFromMarkdown`** (a one-line `useMemo`, a one-line `$derived` here), so
      none is invented. The demo's `ExtractFromMarkdown` story is **also restored**, taking the
      `Outline` demo section to 7 of upstream's 7 — so this deferral is now closed end to end
- [ ] **`Outline`'s indicator anchor name is a literal, not per-instance** — `--outline-active`,
      exactly as upstream declares it. Two `Outline`s in one document therefore declare the same
      `anchor-name`, and each indicator resolves it against the last such element in DOM order
      rather than its own outline's active link. Replicated rather than fixed: a per-instance name
      would have to live in an **inline style**, which is the shape `useLayer.attachTrigger` needs a
      `MutationObserver` to repair against Svelte's whole-attribute `style` writes. In a StyleX class
      it cannot be clobbered, which is the tradeoff upstream's own choice already makes
- [ ] **`useScrollSpy` takes its options as a getter and an element, not a `RefObject`** — the
      settled shapes (`useSelectedItemOffset`'s `listboxEl`, `useMediaQuery`'s getter). It stays
      module-private on both sides. Upstream's `typeof window === 'undefined'` branch in
      `lockActiveId` has **no counterpart**: it is only reachable from a click handler, which cannot
      run on the server
- [ ] **`useOutlineFromDOM` returns `OutlineFromDOMState`, not `OutlineItem[]`** — an array cannot
      stay live across a Svelte component's lifetime, so the result comes back as an object whose
      `items` is a `$state` read. Joins `MediaQueryState`/`ImageModeState`/`ScrollOverflow` in the
      "Svelte-only state types that are legitimate but undocumented" list under Published surface
- [ ] **`OutlineItem` is re-exported from `types.js`, where upstream re-exports it from
      `Outline.tsx`.** Re-exporting a symbol the module also imports trips eslint's
      `no-import-assign` inside a Svelte module script. The type module is the honest source and the
      shape `TreeListItemData` already uses; consumer-visible surface is identical
- [ ] **A `to` alias reaches custom link components that upstream never sends — and it predates this
      batch.** `Link` and `Item` both spread `...(linkResolved.isNative ? {} : { to: href })`;
      upstream's `Link.tsx`, `Item.tsx` and `Outline.tsx` pass `href` only, so a custom component
      gets `href` upstream and `href` + `to` here. `Outline` follows the existing convention rather
      than becoming the one component that does not — the same reasoning the `{...rest}`-spread-first
      entry above records. **Found while porting `Outline`; it was undocumented until now.** Settle
      as one decision across `Link`/`Item`/`Outline`, not per component


### Batch 9 — `CommandPalette`'s slot translation, and a dev-only error class worth remembering

- [x] **`emptySearchText`/`emptyBootstrapText` are `string | Snippet`, and the snippet arm broke
      first.** `CommandPalette` rendered the value as component _content_ —
      `<CommandPaletteEmpty>{emptyBootstrapText}</CommandPaletteEmpty>` — which makes Svelte build a
      snippet that renders the expression; when the value is itself a `Snippet` that throws
      `snippet_without_render_tag`. Fixed by passing it as the `children` **prop**, which
      `CommandPaletteEmpty` already discriminates on. Two things about how it was found are worth
      keeping, because both are general:
  - **All 45 ported cases pass against the broken version.** Every upstream call site passes a
    plain string, so the snippet arm — which exists only because `ReactNode` had to be split — has
    no upstream case to inherit. `src/tests/command-palette-snippet-empty-text.svelte.test.ts` is
    the fifth beyond-upstream file, and it is mutation-checked: restoring the content form fails
    both its cases while the ported suite stays green.
  - **The production build cannot catch it.** `snippet_without_render_tag` is a **dev-only** Svelte
    check: the docs site prerendered 165 pages green with the bug present, and only the dev server
    surfaced it. That is the same trap the hydration sweep records, in a second error class —
    _treat a green production build as evidence about rendering, never about correctness_.
- [ ] **`CommandPalette`'s search input doubles as a type-to-select target.** Upstream does not pass
      `hasSearch` to `useCombobox`, and its `handleKeyDown` forwards every key except
      Escape/Enter/Space, so typing feeds the typeahead as well as the input: typing `tooltip` in
      the docs palette leaves the highlight on the `Tooltip` row rather than at the top. Replicated
      verbatim — it is upstream's wiring, and it happens to land on the best label match — but it is
      surprising enough to record, and it is why an ArrowDown from a freshly-typed query does not
      start at the first result
- [ ] **`renderItem` is `Snippet<[T, boolean]>` and the `input`/`footer` slots are `Snippet`s**,
      where upstream has `(item, isSelected) => ReactNode` and two `ReactNode`s. A render prop taking
      arguments and returning content is exactly a parameterised snippet, so nothing splits — the
      `Selector.renderOption` precedent. `CommandPaletteFooter`/`Empty`/`Group`/`List`/`Item`
      children are likewise `Snippet` (or `string | Snippet` for `Empty`, whose string branch is
      reachable through the two empty-text props)
- [ ] **`setCommandPaletteContext` is not published, though `useCommandPaletteContext` is.** Upstream's
      `CommandPalette/index.ts` exports the reader and the value type but has no provider function to
      export — React's `<Context value>` is the provider. The port's setter is the Svelte half of
      that, and the barrel's own convention keeps provider wrappers internal
- [ ] **`CommandPaletteInput` omits `oninput` from its props surface**, as `TextInput` and
      `NumberInput` do, because `BaseProps` would let a caller's handler typecheck and then be
      silently shadowed. The `value`-spread hazard `NumberInput` documents does **not** reach it: a
      `type="text"` field has no bad-input state, so it is immune for the same reason `TextInput` is
- [ ] **Upstream's trailing `{' '}` after the input's end cluster is not reproduced** — a JSX
      artifact emitting a whitespace text node, the same class as the `Switch` leading-whitespace
      note. No rendered difference


## Rules promoted

Not promoted at the time.

## Debts opened

-
