---
batch: 3
title: Batch 2 — slot translation and seams
upstream: 0.1.7
units: [Breadcrumbs, BreadcrumbItem, Carousel, Toolbar, ContextMenu, Collapsible, CollapsibleGroup]
upstream-prs: []
---

## Scope

`Breadcrumbs` + `BreadcrumbItem`, `Carousel`, `Toolbar`, `ContextMenu`, and `Collapsible` (+
`CollapsibleGroup` + `useCollapsible`) ported on the way through.

## Components

- **Batch 2** — `Breadcrumbs` + `BreadcrumbItem`, `Carousel`, `Toolbar`, `ContextMenu`:
  - **Breadcrumbs / BreadcrumbItem** — `<nav>` + `<ol>`; each item renders its own _leading_
    separator, hidden on `:first-child` by a `--separator-display` custom property, so there are no
    separator `<li>`s to skip. Auto-current detection is a post-render DOM read in an `$effect` (with
    the attribute removed on cleanup), landing `aria-current` on the link/button/span rather than the
    `<li>`. Context defaults to `default`/`/` so a bare item still renders, as upstream's
    `createContext` default does. 25/25 tests
  - **Carousel** — horizontal scroller with edge-fade masking and nav pills on the **top layer**
    (`Layer`, `positioning="custom"`, a cover sized to the anchor); pills stay mounted and disabled at
    each end. `useScrollOverflow` + `useLayer`. 8/8 tests
  - **Toolbar** — `Section` + `role="toolbar"` with `useListFocus` roving tabindex, `useKeyboardHint`,
    the size cascade through the size context, and `edgeCompSlot` on both slots. Two-slot flex or
    three-slot grid depending on `centerContent`. 25/25 tests
  - **ContextMenu** — right-click menu anchored to a zero-size cursor anchor _inside_ the trigger, so
    CSS anchor positioning keeps it context-relative (scroll-follow, auto-flip) while sitting under
    the cursor. `popover="manual"` with document-level outside-click and Escape (native light-dismiss
    would eat the opening right-click's mouseup); touch long-press invocation; data and compound
    modes over `renderDropdownItems` + the shared dropdown context. 31/33 tests
- Collapsible (+ CollapsibleGroup + `useCollapsible`) — disclosure primitive: trigger + chevron + `display:none` region (children stay mounted); getter-based `useCollapsible` (group-controlled / controlled / uncontrolled); two getter contexts (coordination + presentation), the presentation reset to `() => null` for children so nested collapsibles stay chrome-free; DOM-less group unless `hasDividers`. `trigger` is `string | Snippet`. Two source/dist lags followed from source (`isDisabled`, `content` typography — see Known debts). 34/35 + 34/34 tests (`displayName` dropped)

## Oracle bookkeeping

Not recorded separately from the component notes above.

## What the audits caught

### Batch 2 — slot translation and seams

- [ ] **`Carousel` takes `items: T[]` + `item: Snippet<[T, number]>`, not compositional `children`.** Upstream wraps every child in its own snap target with `Children.map`; a Svelte snippet is one opaque unit that cannot be mapped over, so the row is data-driven — the same forced translation `OverflowList` settled and the precedent `TabList` will reuse. Rendered DOM and classes are identical
- [ ] **`ContextMenu`'s three selectable re-exports are absent.** Upstream's `index.ts` re-exports `DropdownMenuCheckboxItem`/`RadioGroup`/`RadioItem` under ContextMenu names; the trio itself is deferred (the stale-dist slice), so the aliases have nothing to point at. `ContextMenuItem`/`ContextMenuItemProps` _are_ exported, since `DropdownMenuItem` is ported. Its suite drops the 2-case `selectable items` describe for the same reason
- [ ] **`ContextMenu` mints two ids where upstream mints one.** `$props.id()` may be called once per component and `<Layer>` already carries the layer's id, so the inner `role="menu"` div derives a second (`-menu`) from the same uid. Upstream's `useLayer` generates its own id internally and `useId` supplies the menu's
- [ ] **`Toolbar` has no `ref` counterpart on the `Section` root.** Upstream forwards `ref` to `Section`; the port's rest props reach the inner `role="toolbar"` div (where upstream's `{...props}` also go), so the attachment counterpart in its suite lands there instead. `Section` exposes no element seam, the same situation `SelectableCard`/`ClickableCard` document
- [ ] **`Toolbar`'s `onFocus`/`onBlur` props are `onfocusin`/`onfocusout` here.** Upstream's React `onFocus`/`onBlur` are the _bubbling_ synthetic events, which native `focus`/`blur` are not — the same correction `useListFocus` and `useKeyboardHint` already record for their handlers


## Rules promoted

Not promoted at the time.

## Retired debts

`Collapsible`'s two source/dist disagreements (`isDisabled`, `styles.content` typography), both
followed from source per the Icon px→rem precedent, are now retired — the tarball caught up.

### Retired — Source/doc disagreements we follow (source wins, per the Icon px→rem precedent)

- [ ] `Collapsible` `isDisabled` feature — the prop plus `aria-disabled`/`tabindex="-1"`/`triggerDisabled` dim and the click guard — is in source, `.doc.mjs`, and tests, but the published 0.1.7 dist lags (no `triggerDisabled`, no guard). Followed from source. `triggerDisabled` has no dist class to diff, so the oracle leaves it **uncompared** (no skip needed — a skip is for keys upstream has that we defer; this is the reverse).
  - Retired by: upstream is pinned at 0.4.1 now (was 0.1.7 when written); `dist/Collapsible/Collapsible.js`
    now contains `triggerDisabled`/`isDisabled`, and `compare-upstream-classes.mjs` reports
    "0 skipped, 0 mismatches" — `triggerDisabled` is no longer uncompared, it matches.

- [ ] `Collapsible` `styles.content` typography anchoring (`fontFamily`/`fontSize`/`fontWeight`/`lineHeight`/`color` beyond `paddingBlockStart`) — added upstream by commit #4126 (same batch as Icon's rem #4120), present in source, absent from dist 0.1.7. Followed from source; the oracle records a **self-retiring skip** on `styles.content` that fails the moment a release ships the typography.
  - Retired by: mechanical fact — `ABSENT_UPSTREAM = []` in `compare-upstream-classes.mjs`; the
    skip list is empty, so this self-retiring skip has already self-retired.


## Debts opened

-
