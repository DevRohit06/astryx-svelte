---
batch: 4
title: Batch 3 — slot translation, ids, and a source/dist lag
upstream: 0.1.7
units: [NavHeadingMenu, NavHeadingMenuItem, TreeList, TabList, Tab, TabMenu]
upstream-prs: []
---

## Scope

`NavHeadingMenu` (+ `NavHeadingMenuItem` + the two contexts), `TreeList`, `TabList` (+ `Tab` +
`TabMenu`).

## Components

- **Batch 3** — `NavHeadingMenu` (+ `NavHeadingMenuItem` + the two contexts), `TreeList`, `TabList` (+ `Tab` + `TabMenu`):
  - **NavHeadingMenu / NavHeadingMenuItem** — the `role="menu"` body a nav heading popover renders.
    `useListFocus` + `useTypeahead` over an _enabled-only_ selector (so a typeahead match index lines
    up with `focusItem`'s), plus Enter/Space forwarded to the focused row — an `onClick`-only item is
    a `<div role="menuitem">` with no native activation. Two contexts: `NavHeadingCloseContext` is
    written by the (unported) `SideNavHeading`/`TopNavHeading` above it, `NavHeadingMenuContext` by
    the menu itself. Both optional, both getters. `NavMenuItem` is upstream's deprecated alias — a
    second barrel export of the same component module, so `NavMenuItem === NavHeadingMenuItem` still
    holds. 25/25 tests
  - **TreeList** (+ internal `TreeListItem`/`TreeListBranches`) — data-driven `role="tree"` over a
    recursive `items` array; expansion is internal `$state.raw` seeded from `isExpanded`, and the
    positional data (`aria-level`/`posinset`/`setsize`, connector lines, terminus) is computed during
    the render, not threaded through a context. The recursion is a **self-referencing `{#snippet}`**
    — `renderItems(list, nestedLevel, ancestorsIsLast)` renders a `childSubtree` snippet that calls
    itself, which is the direct counterpart of upstream's `renderItems` function returning
    `ReactNode`. `useTreeFocus` owns the single tab stop and the APG tree model. `treeItemScope` is
    the port's fourth `defineMarker` (oracle-normalised). 47/47 tests
  - **TabList** (+ `Tab` + `TabMenu` + `tab-list-context`) — `<nav>` whose strip is one Tab stop:
    `useListFocus` with `hasRovingTabIndex` and `orientation: 'both'` (the APG tab-strip allowance),
    `useKeyboardHint` for the badge, and `aria-orientation` deliberately _not_ emitted even when a
    caller passes one. Each `Tab` reserves its semibold-selected width with an invisible sizer cell,
    so selection never reflows. `TabMenu` is a `Popover` (`role: 'none'`) + `useListFocus` menu that
    mints its own `-menu` id so `aria-controls` points at the `role="menu"` div, as upstream's does.
    **`TabList` takes compositional `children` on both sides** — `planning/01`'s note that it would
    reuse the `OverflowList` items+snippet precedent was wrong; it never slices its children, and the
    overflow story wraps them in `Carousel` (which _is_ data-driven here). `tabScope` is the fifth
    marker. Landed **`inlineSkip`** in the class oracle — `skip` for an inline call site, needed
    because the divider-gap feature is in upstream's source but not in the published 0.1.7 dist and an
    inline site has no group/key to hang a `skip` on. 45/45 tests.
    **0.2.0 removed the `orientation` prop** (and its type) as a misleading no-op — the
    `orientation: 'both'` above was always unconditional, so the prop only picked the hint badge's
    glyphs. `useKeyboardHint` is now called without one, as upstream's is


## Oracle bookkeeping

Landed `inlineSkip` in the class oracle — a `skip` reaching an inline call site rather than an
object-mode group/key, for the tab-divider source/dist lag (four self-retiring skips: `tab-list`
`styles.divider` plus three `inlineSkip` entries on the `tab`/`tab-menu` indicator call sites).

## What the audits caught

### Batch 3 — slot translation, ids, and a source/dist lag

- [ ] **`NavHeadingMenu` and `TreeList` forward rest props where upstream drops them** — both destructure a closed list with no rest spread, the same closed-prop-root contradiction `Timestamp`/`FieldLabel`/`List`/`DropdownMenu` document. We forward, as every other component does. `TabList` and `Tab` _do_ spread upstream, so nothing changes there
- [ ] **`NavHeadingMenu` captures the menu element twice.** Upstream reads `listRef.current` for the typeahead's item list; `useListFocus` keeps its container private (the attachment is the whole seam), so the component adds its own `bind:this` rather than widening the hook's return. Same seam `DropdownMenu` already opens
- [ ] **`NavMenuItem` is a second barrel export, not a re-assignment.** Upstream's `export const NavMenuItem = NavHeadingMenuItem` makes the two the same value; exporting the same component module twice preserves that identity, which its backward-compat test asserts. `NavMenuItemProps` is likewise an alias of `NavHeadingMenuItemProps`
- [ ] **`TreeListItem` mints two ids from one uid** (`labelId` and `${labelId}-description`) where upstream calls `useId` twice — `$props.id()` may be called once per component. The same shape `ContextMenu` records. `TreeListItem`/`TreeListBranches` and their prop types stay module-private on both sides
- [ ] **`TreeList`'s recursion is a self-referencing `{#snippet}`.** Upstream's `renderItems(items, nestedLevel, ancestorsIsLast)` returns `ReactNode` and passes it down as `renderedChildren`; the Svelte counterpart is a parameterised snippet that renders a per-item `childSubtree` snippet calling itself. `renderedChildren` is therefore `Snippet`, not `ReactNode`. `TreeListItemData.label` is `string | Snippet` and `startContent`/`endContent` are plain `Snippet`s — the settled leaf-slot translation
- [ ] **`TabList`'s `orientation` is not `aria-orientation`** — replicated deliberately: the attribute is invalid on the navigation role, upstream reads and drops a caller-supplied one, and two of its cases pin that. `EDGE_COMP_ATTR` is destructured under its literal name (`data-astryx-edge-comp`) because a `$props()` pattern may not carry a computed key
- [ ] **`TabMenu` mints a second id for the `role="menu"` div** so `aria-controls` targets the menu itself, as upstream's `useId` does — the one popover in this port that does _not_ follow the `aria-controls`-at-`layer.id` convention `DropdownMenu` documents, because upstream's own test asserts `document.getElementById(aria-controls)` has `role="menu"`. `TabMenuOption.icon` is `IconName | Snippet` (the Svelte icon-slot shape), and `Tab`'s `icon`/`selectedIcon`/`endContent` are plain `Snippet`s
- [ ] **`styles.itemCheckmark` in `tab-menu.stylex.ts` is dead upstream** — declared and never applied (the selected tick is an `<Icon icon="check">`). Ported for parity, and therefore the one key in the batch with no upstream counterpart to diff against in either oracle mode; the reverse of a skip, as `Collapsible`'s `triggerDisabled` is
- [ ] **Source/dist lag (followed from source, per the Icon px→rem precedent): the tab divider gap.** Upstream's source reserves a gap under the tabs (`paddingBlockEnd`) and publishes `--_tab-indicator-bottom` so the selected indicator drops onto the rail; published 0.1.7 has neither, and its indicator `bottom` is still the literal `-1px`. Recorded as **four self-retiring skips** — `tab-list` `styles.divider` plus three `inlineSkip` entries on the `tab`/`tab-menu` indicator call sites — which retire together when a release ships the feature
- [ ] **The class oracle gained `inlineSkip`.** `skip` only reaches object-mode groups and keys; an inline call site has no name to hang one on, and this is the first lag that lands on one. Each entry names its `inline` keys, the exact upstream class string it excuses, and why — and it is self-retiring twice over: the run fails if our combination _starts_ matching, and it fails if the excused string disappears from `dist/`. Verified by mutation (a bogus excused string fails the run)


## Rules promoted

Not promoted at the time.

## Debts opened

-
