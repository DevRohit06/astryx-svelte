---
batch: 8
title: Batch 7 — the imperative handle, slot translation, and two closed-prop roots
upstream: 0.1.7
units: [MultiSelector, useMultiCombobox, Tokenizer]
upstream-prs: []
---

## Scope

`MultiSelector` (+ `useMultiCombobox`), `Tokenizer`.

## Components

- **Batch 7 — multi-select** — `MultiSelector` (+ `useMultiCombobox`), `Tokenizer`:
  - **MultiSelector** — the multi-select sibling of `Selector`: a `role="combobox"` trigger over
    `Popover` (`role: 'none'`) whose popup is an `aria-multiselectable` listbox of `inert`,
    decorative `CheckboxInput`s, and where toggling deliberately does _not_ close the dropdown.
    The values selected **at open** are snapshotted into `$state.raw` and sorted to the top of
    their flat run or section, frozen until close, so a row never moves under the pointer;
    `sortedItems` is the single source of truth for order and the keyboard index alike, and the
    render walk interleaves the structural dividers/section headers back in from `options`.
    `hasSelectAll` prepends a sentinel row (`__xds_select_all__`) that routes to `handleSelectAll`
    rather than `handleToggle`, and shows a tri-state box driven by the _enabled_ items only.
    Three trigger displays (`count`/`labels`/`badges`), `useAnnounce` on every selection change,
    Delete/Backspace clearing from the closed trigger, and `hasSearch` moving the combobox role
    onto the search input. `useMultiCombobox` is published as upstream publishes it. 56/57 tests
    (`has displayName` dropped)
  - **Tokenizer** — a multi-select typeahead: `BaseTypeahead` for search, `Token` per selection,
    all inside a `role="group"` wrapper. A `$derived` source wrapper filters already-selected ids
    and, under `hasCreate`, appends the synthetic `Create "…"` row that `handleAdd` recognises by
    its `__xds_create__` id prefix. `tokenOverflowBehavior` drives three layouts —
    `unfocusedInline` collapses the row through `OverflowList`, `unfocusedLayer` additionally
    promotes the expanded wrapper into a `<Layer positioning="custom">` pinned over an in-flow
    placeholder by explicit `anchor()` insets. Upstream's `handleRef`/`useImperativeHandle` becomes
    **instance exports** (`focus()`/`blur()`) reached through `bind:this`, and its `ref` becomes an
    attachment through the rest props `Field` spreads. 48/48 tests, nothing dropped
  - Retired the third `InputGroup` skip (`MultiSelector`), leaving **16 of 18** ported and two
    waiting on `DateInput`


## Oracle bookkeeping

Not recorded separately from the component notes above.

## What the audits caught

### Batch 7 — the imperative handle, slot translation, and two closed-prop roots

- [ ] **`Tokenizer` has no `handleRef` prop — `focus()`/`blur()` are instance exports.** Upstream's
      `useImperativeHandle(handleRef, () => ({focus, blur}))` hands a controller object to a ref
      prop; Svelte's counterpart to an imperative handle _is_ the component instance, reached with
      `bind:this`. `TokenizerHandle` is still published and still describes exactly the same two
      methods — it just types the instance rather than a ref target. Same family as the
      `useLightbox`/`<LightboxLayer>` split: the React seam has no prop-shaped counterpart, so the
      Svelte-native seam is used instead
- [ ] **`Tokenizer`'s `ref` is an attachment through the rest props.** Upstream forwards `ref` to
      `Field`'s root; here the rest props reach the same `.astryx-field` div, so an attachment
      travelling through them lands on it. Its `forwards ref` case is the attachment counterpart the
      `ButtonGroup`/`Lightbox` suites already use
- [ ] **`Tokenizer`'s `renderToken` is `Snippet<[T, () => void]>` and `renderItem` is `Snippet<[T]>`**,
      not `(item, onRemove) => ReactNode` / `(item) => ReactNode`. A render prop taking arguments and
      returning content is exactly what a parameterised snippet is, so nothing splits — the only
      difference is the spelling, as `Selector`'s `renderOption` records. `endContent` is a plain
      `Snippet` and `startIcon` is `IconName | Snippet`, the settled icon-slot shape
- [ ] **`Tokenizer`'s `onFocus`/`onBlur` props are `onfocusin`/`onfocusout`, taken straight off
      `BaseProps`.** Upstream declares them itself and wires them from `onFocusCapture`/
      `onBlurCapture`; React's synthetic focus pair bubbles, which the native `focus`/`blur` do not
      — the correction `useListFocus`, `Toolbar`, `Pagination` and `Typeahead` already record. The
      capture-phase distinction is not reproduced: `focusin`/`focusout` bubble to the same wrapper
      the capture handlers were attached to, which is what the component actually needs
- [ ] **`MultiSelector` forwards rest props onto the trigger `<button>` where upstream drops them** —
      it destructures a closed list off `Omit<BaseProps, 'onChange' | 'defaultValue'>` with no rest
      spread, the same closed-prop-root contradiction `Timestamp`/`FieldLabel`/`List`/`DropdownMenu`
      document. We forward, as `Selector` does and to the same element
- [ ] **`MultiSelector` mints eight ids from one `$props.id()`** where upstream calls `useId` six
      times — the two extras are the layer's and the tooltip's, exactly as `Selector` records
- [x] **`MultiSelector`'s option rows are keyed by `item.value`, as upstream and `Selector` are.**
      They were positional (`item-${flatIndex}`) in the first cut, which the parity audit caught:
      `sortedItems` reorders on open, on close and on every search keystroke, and a positional key
      makes Svelte _repurpose_ the node at each index instead of moving it — so the decorative
      `CheckboxInput`, whose box transitions `background-color`/`border-color`, animates its tick on
      every reorder where upstream's node move produces no transition at all. Fixed; the sibling
      `Selector` already keyed by value, so this was drift inside the port as well as against upstream
- [ ] **Four `{#each}` keys remain positional where upstream keys by value** — `MultiSelector`'s
      hidden `htmlName` carriers (upstream `key={v}`) and trigger badges (`key={label}`), and
      `Tokenizer`'s hidden carriers and token row (both `key={item.id}`). A duplicated value, or two
      options sharing a label, only _warns_ in React but **throws** in Svelte, and for the hidden
      inputs and badges the key is not observable in the DOM at all. The token row is the one with a
      residual cost: a caller's `renderToken` snippet holding its own state would see that state
      re-associated with the _successor_ token when a middle one is removed. `OverflowList` keys by
      index internally, so the truncated path is positional regardless and the two paths would
      otherwise disagree with each other
- [ ] **`MultiSelector`'s `announceSelection` and both toggle paths read the optimistic list into
      plain locals before `optimistic.run` installs the override** — the `ToggleButton` race, which
      reaches here because `run` awaits and a live `$derived` re-read would hand `changeAction` the
      value it had just written
- [ ] **`MultiSelector`'s `selectAllState` is computed from the _filtered_ enabled items**, so a
      search query narrows what "all" means — upstream's behaviour, replicated. `handleSelectAll`
      likewise only ever adds or removes the currently enabled items, leaving a selected-but-disabled
      value untouched
- [ ] **Hard-coded English in `MultiSelector` bypasses `useTranslator`** — the four announcement
      strings (`'Selection cleared'`, `'All selected'`, `'N of M selected'`), the trigger's
      `'N selected'` count and the dropdown's `'No results found'`. Upstream's catalogue has keys
      only for the placeholder, select-all label, search placeholder, search aria-label and
      clear-all label, all of which _are_ translated here. Reproduced; **not** "fixed" by inventing
      keys — the same inconsistency `FileInput` and `NumberInput` record
- [ ] **`Tokenizer`'s `+N more` and `Create "…"` strings are likewise hard-coded**, while its clear
      button goes through `@astryx.tokenizer.clearAll`. Same standing
- [x] **`Tokenizer`'s `filteredSource` had an empty dependency set.** Written as
      `$derived({search: async () => …searchSource…selectedIds…})`, evaluating the expression only
      _constructs_ the two closures — it reads no signal doing so, so the derived was computed once
      and never invalidated: a per-instance constant wearing a memo's clothes, where upstream's
      `useMemo(…, [searchSource, selectedIds, hasCreate])` mints a new identity on every token
      add/remove. The consequence was one door down: `BaseTypeahead` keys a cleanup effect on
      `searchSource` _precisely_ so that swapping the source drops the queued debounce, and with a
      frozen identity that effect never re-ran for a `Tokenizer` — so removing a token inside the
      150 ms debounce window let the armed search fire afterwards and pop the dropdown open. Fixed by
      reading the three keys into locals in a `$derived.by` body, which restores both the dependency
      set and upstream's capture-at-memo-time semantics. Found by the idiom audit; the `cancel()`
      half of that teardown is a no-op for `Tokenizer` on **both** sides, since neither wrapper
      forwards `cancel` — an upstream bug the port inherits faithfully
- [ ] **Upstream's `hasCreate` suite cannot tell an `add` from a `create`.** The test-parity audit
      mutation-checked `handleAdd`: dropping the whole create branch fails
      `fires onChange with type "create"…`, but dropping only the
      `item.id.startsWith(CREATABLE_ID_PREFIX)` test — so _every_ add is misreported as a `create` —
      passes all 48 cases. That is upstream's own blind spot, faithfully inherited:
      `appends Create option alongside real search results` declares an `onChange` spy and never
      asserts on it, and no other `hasCreate` case adds a real item. Closing it would mean inventing
      coverage upstream does not have, so it is recorded rather than fixed
- [ ] **`Tokenizer`'s `.doc.mjs` omits six real props** — `startIcon`, `width`,
      `tokenOverflowBehavior`, `onFocus`, `onBlur` and `ref` are in the source _and_ the published
      `.d.ts` but absent from the props table in both locales, and the `docsZh` half additionally
      omits `hasCreate`. Ported from source, per the Icon px→rem precedent and the four batch-5 doc
      omissions above. Recorded so a future reader does not "correct" the port against the doc file
- [ ] **`useMultiCombobox`'s `getItemId` reads the whole options bag** (`options().listboxId`
      materialises `sortedItems`, `isOpen`, `hasValue`, …) where upstream's
      `useCallback(…, [listboxId])` is genuinely narrower. It is why the scroll-into-view effect
      needs its `untrack`, and it also makes the three `id={combobox.getItemId(...)}` template sites
      depend on `sortedItems` — inert, because the string is unchanged and Svelte's attribute update
      bails. Passing `listboxId` to the hook as a separate stable argument would remove both the cost
      and the need for the `untrack`; `useCombobox` has the identical shape, so settle it for the pair
- [ ] **`sx()` emits `class=""` where upstream emits no `class` attribute at all**, at every
      conditional-only call site — `Tokenizer`'s start-icon `<span>` is this batch's instance, and
      `radio-list-item.stylex.ts` / `toggle-button.stylex.ts` are the standing precedents. It follows
      from `SvelteStyleAttrs.class` being `string` rather than `string | undefined`, so it is the
      adapter's to fix once, not any component's
- [ ] **`Tokenizer`'s `unfocusedLayer` popover does not mirror in RTL** — `left: anchor(start)` is a
      physical inset, upstream's own known follow-up from #3389. Replicated verbatim, and its RTL
      case pins that no placement-derived style (`justify-self`, `position-area`,
      `position-try-fallbacks`) leaks into the inset-positioned box


## Rules promoted

Not promoted at the time.

## Debts opened

-
