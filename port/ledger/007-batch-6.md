---
seq: 7
title: Batch 6 — the selector spine
upstream: 0.1.7
units: [Selector, SelectorOption, useCombobox, useSelectedItemOffset, Pagination, Typeahead, BaseTypeahead, TypeaheadItem, createStaticSource]
upstream-prs: []
---

## Scope

`Selector` (+ `SelectorOption` + `useCombobox` + `useSelectedItemOffset`), `Pagination`, `Typeahead`
(+ `BaseTypeahead` + `TypeaheadItem` + `createStaticSource`), and the Phase 1 `groupItems` debt.

## Components

- **Batch 6 — the selector spine** — `Selector` (+ `SelectorOption` + `useCombobox` +
  `useSelectedItemOffset`), `Pagination`, `Typeahead` (+ `BaseTypeahead` + `TypeaheadItem` +
  `createStaticSource`), and the Phase 1 `groupItems` debt:
  - **Selector / SelectorOption** — a `role="combobox"` trigger over `Popover` (`role: 'none'`, so
    the inner `role="listbox"` is the exposed semantics and the trigger keeps DOM focus). Without an
    explicit `placement` the dropdown overlays the _selected_ item on the trigger and clamps to the
    viewport — `useSelectedItemOffset` measures that in an `$effect` (the counterpart of upstream's
    `useIsomorphicLayoutEffect`: Svelte effects run after the DOM write and before paint, which is
    the property `useLayoutEffect` buys) and the listbox stays `opacity: 0` until it has. `hasSearch`
    moves the combobox role onto the search input, which then owns `aria-activedescendant`; the
    trigger drops to a plain button. `useCombobox` is the keyboard/typeahead/selection state machine,
    published as upstream publishes it. **`aria-controls` points at the real `role="listbox"` div**,
    not the layer wrapper — the `TabMenu` exception to this port's convention, because upstream wires
    it that way. Landed a `style` prop on `<PopoverLayer>` (upstream's `render` spreads
    `ContextRenderProps`, `style` included; `Selector` is its first consumer). 50/50 tests
  - **Pagination** — five indicator variants (`pages` with ellipsis, `count`, `compact`, `dots`,
    `none`) between prev/next. `generatePageRange` is public API and lives in the component's
    `<script module>`, as upstream declares it in `Pagination.tsx`. The dots are a `useListFocus`
    roving-tabindex group with selection-follows-focus (so arrows change the page), keyed on
    `onfocusin` rather than `onfocus` — React's `onFocus` bubbles and the native `focus` does not, the
    correction `useListFocus`/`Toolbar` already record. `createOptimistic` gives the interruptible
    optimistic page. Upstream's two `return null` early exits become a template guard. 64/64 tests
  - **Typeahead / BaseTypeahead / TypeaheadItem** — `BaseTypeahead` is the bare combobox engine
    (input, debounced search with generation-counted race discard, keyboard nav, dropdown) and is
    exported, as upstream exports it; `Typeahead` owns the border, the selected-value `Token`, edit
    mode and the `Field` shell. Upstream's `ref` to the input has no counterpart, so
    `BaseTypeahead` spreads rest props onto the `<input>` and `Typeahead` reaches it with an
    attachment — which also closes the closed-prop-root contradiction its `BaseProps` type leaves
    open. `anchorRef` is `anchorEl` (an element, the `Popover` shape). 42/42 tests
  - Retired two `InputGroup` skips (`Selector` and `Typeahead`), leaving **15 of 18** ported and
    three waiting on `DateInput`/`MultiSelector`


## Oracle bookkeeping

Not recorded separately from the component notes above.

## What the audits caught

### Batch 6 — slot translation, seams, and dead upstream keys

- [ ] **`Selector`'s `renderOption` and `Typeahead`'s `renderItem` are `Snippet<[T]>`,** not
      `(option) => ReactNode`. A render prop taking one argument and returning content is exactly
      what a parameterised snippet is, so unlike `Popover`'s trigger there is no discrimination
      problem and nothing splits — the only difference is the spelling
- [ ] **`SelectorOptionData.icon`, `SelectorOption.icon`, `Selector.startIcon` and
      `Typeahead.startIcon` are `IconName | Snippet`,** upstream's `ReactNode | IconType`. That is
      the `DropdownMenuItemData.icon` shape and the faithful translation — `renderIconSlot`
      dispatches on `typeof icon === 'string'` to a registry lookup, and a snippet covers the rest.
      **`NumberInput.startIcon` and `Button.icon` are `Snippet` only** for the same upstream type,
      which is now a visible inconsistency: those two drop half of upstream's union. Worth widening
      them to match rather than narrowing these
- [ ] **`useSelectedItemOffset` takes elements, not `RefObject`s** (`listboxEl`/`triggerEl`), the
      `Popover` `anchorRef` shape. Its `useIsomorphicLayoutEffect` becomes a plain `$effect`: Svelte
      effects run after the DOM write and before paint, which is the property `useLayoutEffect`
      buys, and the SSR half of `useIsomorphicLayoutEffect` has no counterpart at all because Svelte
      effects do not run on the server. `$effect.pre` would be wrong — it runs _before_ the DOM
      update, so the items being measured would not exist
- [ ] **`<PopoverLayer>` gained a `style` prop.** Upstream's `usePopover.render` spreads the caller's
      `ContextRenderProps` into `layer.render`, `style` included; the port's component had dropped it
      because no consumer needed it until `Selector`, whose selected-item overlay is a computed
      negative `margin-block-start`
- [ ] **`Selector` mints eight ids from one `$props.id()`** where upstream calls `useId` six times —
      the two extras are the layer's (upstream's `useLayer` mints its own internally; ours must be
      passed one) and the tooltip's (ditto for `useTooltip`). `Typeahead` mints five for upstream's
      four, and `BaseTypeahead` three for upstream's two, for the same two reasons
- [ ] **`Selector`'s trigger `aria-controls` targets the inner `role="listbox"` div**, not the
      `<Layer>` wrapper — the second exception to this port's aria-controls-at-`layer.id` convention,
      after `TabMenu`, and for the same reason: upstream wires it that way and its own suite asserts
      the attribute is present on both the trigger and the search input
- [x] **`Selector`'s `value` is deliberately NOT `$bindable()`** — it was, briefly, and the idiom
      audit found that the convention breaks the component's own first consumer. `Pagination` renders
      the page-size control as `<Selector value={String(pageSize)} onChange={handlePageSizeChange}>`,
      and upstream's `onPageSizeChange` is **optional**; with a bindable `value`, a consumer who omits
      it picks "25", Svelte stores the local write as an override on the prop's derived,
      `String(pageSize)` never changes so the override never clears, and the trigger reads 25 forever
      while `rangeStart`/`rangeEnd`/`computedTotalPages` all keep using 10. React's controlled input
      snaps straight back. Removed rather than patched around, on the `NumberInput` precedent —
      upstream is strictly controlled, `$bindable` is an additive convenience, and the convenience
      is what was wrong. **This is a live question for the rest of the input family**: `TextInput`,
      `TextArea` and `Switch` all still write locally on the non-action path, so any of them nested
      in a controlled-without-commit parent has the same latent divergence. Worth settling as one
      decision rather than component by component
- [ ] **`styles.itemCheckmark` in `selector.stylex.ts` and `styles.disabled` in
      `pagination.stylex.ts` are dead upstream** — declared and never applied, so `dist/` folds each
      away entirely and neither oracle mode has a counterpart to diff. Ported for parity, the
      standing `tab-menu.stylex.ts`'s identically-named `itemCheckmark` and `Collapsible`'s
      `triggerDisabled` already have (the reverse of a skip)
- [ ] **`BaseTypeahead` spreads rest props onto its `<input>` where upstream drops them** — upstream
      declares `BaseProps<HTMLElement>` and destructures a closed list, the same closed-prop-root
      contradiction `Timestamp`/`FieldLabel`/`List`/`DropdownMenu` document. Here it is also
      load-bearing: it is the seam `Typeahead` reaches the input through, standing in for upstream's
      `ref`. `TypeaheadItem` likewise forwards rest and honours `xstyle`/`class`/`style`, which
      upstream declares and drops — the `HoverCard` precedent
- [ ] **`Typeahead` finds the token to focus by its stable `astryx-token` class**, scoped to its own
      wrapper, where upstream holds a `tokenRef`. `Token` exposes no element seam (no rest spread, no
      attachment — see the closed-prop-list roots above), so this is the available handle; the class
      is exactly what `themeProps` exists to provide, so it is a stable contract rather than a
      markup-shape guess. Retire it if `Token` ever gains a seam
- [ ] **`Typeahead`'s wrapper `onBlur` is `onfocusout`, and `Pagination`'s dots `onFocus` is
      `onfocusin`** — React's `onFocus`/`onBlur` are the _bubbling_ synthetic events, which the
      native `focus`/`blur` are not. The same correction `useListFocus`, `useKeyboardHint` and
      `Toolbar` already record
- [ ] **`Typeahead`'s `TypeaheadItemProps.group` is accepted and unused on both sides** — upstream
      declares it, never destructures it and renders nothing for it. Kept for parity; it is API
      surface with no behaviour
- [ ] **Upstream's `Typeahead/utils.ts` server-safe subpath is not ported.** It re-exports
      `createStaticSource` and the two types at `@astryxdesign/core/Typeahead/utils`; this port ships
      no per-component subpaths at all (recorded under Published surface), and the root barrel
      carries all three names, so nothing is missing but the entry point
- [ ] **`BaseTypeahead` does not transcribe upstream's redundant `if (popover.isOpen)` inside the
      `Home`/`End` keydown cases** — the switch is only reached when it is already true, so the inner
      guard is dead. Noted at the site
- [x] **The five post-batch audits (parity ×3, idiom, surface) found 15 items; all are fixed.**
      Beyond the `$bindable` reversal above: `Selector`'s two upstream status tables
      (`STATUS_ICON_MAP` / `STATUS_ICON_COLOR_MAP`) had been collapsed into one — they are
      value-identical today, so nothing rendered differently, but the port had erased upstream's
      _which icon_ vs _which colour token_ distinction and a future change to either would have
      landed on the wrong axis; `Selector` and `Pagination` now declare `'data-testid'?: string`
      explicitly, as ten other ported components do, rather than leaning on `BaseProps`' index
      signature; `SelectorOption` tests `icon` for truthiness, not `!= null`;
      `TypeaheadItem` destructures `group` out so the declared-but-inert prop stays inert (left in
      `...rest` it rendered a `group="…"` attribute upstream never emits — the one finding with
      observable output); `BaseTypeahead` omits `oninput`/`onfocus`/`onblur`/`onpointerdown`, which
      it shadows, from its props surface; `Selector`'s scroll-into-view effect reads `getItemId`
      through `untrack` so it tracks upstream's two dependencies rather than the whole options bag
      (untracked, typing in a `hasSearch` selector yanked a wheel-scrolled listbox back);
      `BaseTypeahead`'s cleanup effect reads `searchSource` so a swapped source cancels and clears
      the pending debounce, as upstream's `[searchSource]` key does; and the demo's Typeahead source
      is hand-written so `bootstrap()` returns upstream's first five fruits rather than all eight
- [x] **`useLayer` no longer writes `popover.style.display` out of band.** The no-Popover-API
      fallback (infra-4) assigned `display` directly, which was safe only while every `<Layer>`
      consumer left `style` constant — Svelte writes the whole `style` attribute on change, so
      `Selector`'s computed `margin-block-start`, which flips exactly at open and close, would have
      discarded the `display:none` that `hide()` had just written and left a closed dropdown on
      screen (Safari <17, Firefox <125). The fallback is now a `fallbackStyle` the hook exposes and
      `<Layer>` merges last, so Svelte owns the declaration and the hazard class is gone rather than
      repaired. Same failure `attachTrigger`'s `anchor-name` `MutationObserver` exists for; this one
      is avoided at the source instead
- [ ] **`StyleArg` is now exported from the root barrel** — a Svelte-only name, in the family of
      `LayerProps` and the other render-split types. Upstream's counterpart is `StyleXStyles`, which
      a consumer imports from `@stylexjs/stylex`; ours had no public name at all, and ten published
      types reference it (`BaseProps`, `ButtonProps`, `LayerProps`, `PopoverLayerProps`,
      `BaseTypeaheadProps`, the `usePopover`/`useTooltip`/`useHoverCard` option and return types),
      so a consumer wrapping any of them could not write `xstyle?: …`. It adds one name upstream
      does not have, which is why it is recorded here rather than left silent
- [ ] **`useCombobox`/`useSelectedItemOffset` publish no option or return types** — upstream's
      `hooks.ts` declares all four without `export` and `Selector/index.ts` publishes only the two
      functions, so ours are module-private and carry upstream's names (`…Result`, not `…Return`).
      They are the first ported hooks whose types upstream withholds; every earlier pair is published
      because upstream's barrel publishes it, so that convention does not reach these two
- [ ] **`Selector/utils.ts`'s five type guards are unreachable from any entry point.** Upstream
      publishes `isOptionData`/`isDivider`/`isSection`/`normalizeOption`/`getSelectableOptions` at the
      `./Selector/utils` subpath, which this port does not ship. Unlike `./Typeahead/utils` — whose
      three names all reach the root barrel, so only the entry point is missing — these five have no
      route to a consumer at all. Do **not** "fix" it by adding them to the root barrel: upstream's
      `Selector/index.ts` deliberately withholds them, so root-exporting would convert a missing
      export into an over-export. This is the concrete cost of the per-component-subpath debt
- [x] **`use-typeahead.test.ts` was renamed** from `typeahead.svelte.test.ts` to free the filename
      for the component's suite. It is the type-to-select _hook_'s suite
      (`hooks/useTypeahead.test.tsx`), unrelated to the `Typeahead` component, and is the one hook
      suite that keeps its `use-` prefix. **At 0.4.1 it also moved from the client project to the
      server one** and lost its `.svelte` infix: the hook reads `key` and four modifier flags off a
      keyboard event and touches no node, no window and no layout, so it only ever sat in the client
      project because node has no `KeyboardEvent` _constructor_. A small `extends Event` stand-in
      carrying exactly those fields replaces it — deliberately not more, so a future `useTypeahead`
      reaching for `getModifierState` fails loudly instead of passing against a fake. Upstream's own
      suite runs under jsdom, so its `new KeyboardEvent(...)` is a reimplementation too. This makes
      `compute-overflow.test.ts:7-9`'s claim that `use-typeahead` follows the pure-module rule true
      rather than aspirational, and the suite is now runnable in an environment that cannot bind a
      browser port


## Rules promoted

Not promoted at the time.

## Debts opened

-
