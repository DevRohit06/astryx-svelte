---
seq: 19
title: Batch 17b — new surface and new props at 0.2.0
upstream: 0.2.0
units: [InputStatusIcon, FieldStatus, Field, Icon, TreeList, HoverCard, CommandPaletteInput, Thumbnail, OverflowList, BreadcrumbItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSubMenu, Outline, useTableTreeData, useTableRowStatus, Avatar, Button]
upstream-prs: []
---

## Scope

The new-surface-and-new-props half of the 0.2.0 tracking work: `elevation`, `Switch.size`, the status-
variant family, the singles (`Icon.label`, `Table.rowIndexStart`/`rowCount`, `TreeList.variant`,
`HoverCard.label`, `CommandPaletteInput.label`, `Thumbnail.showRemoveOn`), `computeOverflow` and
`OverflowList`'s bounds, the menu family (`BreadcrumbItem.menu`, the selectable trio,
`DropdownMenuSubMenu`), and the tail (`Outline`'s navigation props, `hasExpandAllControl`,
`useTableRowStatus`, the link seam). `17a` (previous file) is the breaking-changes/RTL half; `17c`
(next file) is the a11y/themes/docs half.

### The status-variant family


- **`useInputStatusIcon` + `<InputStatusIcon>`** (`src/lib/hooks/`) — the on-field status
  affordance the bordered inputs share, and the third instance of the
  hook-returns-a-node split (`renderTooltip` → `<TooltipLayer>`, `hintElement` →
  `<KeyboardHintLayer>`). The hook returns `hasIcon`/`hasTooltip`/`icon`/`type`/`size`/
  `message`/`label`/`tooltip`/`describedBy` plus the two button handlers; the component renders
  either nothing, a plain `<Icon>`, or the focusable info-tip button and its `<TooltipLayer>`.
  Both are exported from `hooks/index.ts`, the component with the comment saying upstream has no
  such symbol. `id` is an added option, as it is on `useTooltip`, because `useLayer` needs an
  SSR-stable id from the calling component; every call site derives it as `` `${uid}-status-tip` ``.
  The touch tap-to-toggle is a `$state<boolean | undefined>` handed to `useTooltip`'s `isOpen`, with
  its own Escape listener while it holds control — `useTooltip` owns Escape only for the
  uncontrolled case. Oracle: **inline mode**, one call site (`styles.statusButton`); `iconAnchor` is
  declared upstream and never applied, so it appears in neither side's output and needs no skip.
- **`FieldStatus`** — three 0.2.0 changes at once. `FieldStatusVariantMap` gains `tooltip`. The
  `detached` variant renders a leading status glyph before the message (WCAG 1.4.1), `aria-hidden`
  because the text already names the status, in two new wrappers (`detachedContent`,
  `detachedIcon`) that each fold to a literal class string upstream — so the oracle case is now
  **both modes at once**. And the announcement moves off the element onto `useAnnounce`'s
  persistent live regions: `role`/`aria-live` are gone, replaced by an `$effect` reading `message`
  and `type`, which is exactly React's `[announce, message, type]` dependency list. Announce-on-
  mount is deliberate — a form can mount with a server-side validation error already present.
- **`Field`** — `statusVariant` widens to `FieldStatusVariant` and the message box is suppressed
  for `tooltip`.
- **The 12 bordered inputs** — `statusVariant` forwards to `Field` on all twelve. Seven route their
  on-field glyph through the new hook; `DateTimeInput` routes through it too with the variant fixed
  to `'detached'`, which is upstream's way of _suppressing_ the glyph (the detached message box
  carries its own). `PowerSearch` forwards to `Tokenizer` rather than to a `Field` of its own.
  The `!inputGroup` guard on the status-message `aria-describedby` is per-component and not
  uniform upstream — `TextInput`/`NumberInput` have it, `TimeInput` correctly does not (it renders
  an in-group status element), and `DateInput` is the one divergence, recorded under Known debts.
- **Tests** — `FieldStatus`'s suite (inside `form-and-metadata.svelte.test.ts`) goes 24 → **30**
  against upstream's 31, the gap being `displayName`. The old `role`/`aria-live` cases invert into
  assertions that those attributes are _absent_, seven announcement cases assert the live regions,
  the four detached-icon cases are new, and the `xstyle` case is now portable. `Field`'s two
  role-semantics cases become upstream's three announcement cases (43 upstream → 42 here).


### the singles

- **`Icon`** — `label` (0.1.8) collapses the three-attribute a11y dance into one prop:
  non-empty gives `role="img"` + `aria-label` and drops the decorative `aria-hidden`; empty or
  omitted keeps `aria-hidden="true"`. The derived attributes are spread _before_ the rest props in
  both render modes, so an explicit `aria-hidden`/`role`/`aria-label` still wins. `xstyle` (0.2.0)
  folds into the same `stylex.props()` call as the base colour/size styles rather than landing
  beside them. **Its suite lands with it** — 31 cases, never ported before, so `label` and `xstyle`
  would otherwise have been the only untested props on the component every other one renders. The
  two `rem` sizing cases are restated: upstream's jsdom returns the authored `0.75rem` verbatim and
  so never proves it resolves, where a real browser resolves against the root font-size.
- **`Table.rowIndexStart` / `rowCount`** — opt-in ARIA row indexing. Passing either seeds
  `aria-rowindex` on body rows as a base `htmlProp` (so plugins compose over it and can override)
  and puts `aria-rowcount` on the `<table>`, `-1` when the total is unknown. The header row keeps
  native semantics. Six cases, matching upstream's.
- **`TreeList.variant`** — `'lineGuides' | 'noGuides'`, orthogonal to `density`, threaded to
  `TreeListItem` which drops the connector-line div entirely for `noGuides`. `TreeListVariantMap`
  is module-augmentable, as `FieldStatusVariantMap` is.
- **`HoverCard.label`** — a named popup becomes `role="dialog"`; unnamed it stays `role="group"`,
  because a group may validly be unnamed and a dialog may not. Upstream computes this inside
  `renderHoverCard`; `<HoverCardLayer>` is that closure here, so the hook returns `role` and
  `label` and the layer applies them. `Layer` gained an `'aria-label'` prop for it — upstream's
  `ContextRenderProps` has had one all along.
- **`CommandPaletteInput.label`** — an accessible name for the combobox, falling back to the
  placeholder. Written as `rest['aria-label'] ?? label ?? placeholder` rather than as a plain
  attribute: upstream spreads its rest props _last_ on this input so a consumer's own `aria-label`
  wins, and this port spreads rest _first_, which would otherwise invert that precedence.
- **`Thumbnail`** — a fuller re-port than the `showRemoveOn` prop suggests. The prop itself adds a
  `removeSlot` wrapper and a `removeOnHover` reveal keyed to a new `thumbnailScope` marker
  (hover, `:focus-within`, and always-visible on `any-pointer: coarse`). Around it: `interactive`
  lost its shadow/opacity treatment for the `::after` tint `ClickableCard` uses, the image is
  explicitly `role="presentation"` + `aria-hidden` when it has no `alt`, the accessible-name
  fallback moved to the `@astryx.thumbnail.fallbackName` catalog entry, and a dev warning fires for
  `src` with no name source. **And the remove button stopped sampling the picture**: `useImageMode`
  - APCA + `<MediaTheme>` are gone from the component, replaced by a fixed `--color-overlay` scrim
    and an `--color-on-dark` icon. The hook stays exported and uncalled, exactly as upstream keeps it.
    Suite 14 → 22, matching upstream; the `fetch` stub went with the sampling. Oracle: clean, and the
    image container moved inline → object mode because the marker and the overlay pair made its merge
    unfoldable.


### `computeOverflow` and OverflowList's bounds

- **`hooks/compute-overflow.ts`** (new) — the fit/clamp/row-packing math, ported from upstream's
  `hooks/computeOverflow.ts`. Pure arithmetic with no DOM and no React, so it is a transcription;
  the point of the extraction is that the multi-row packing becomes unit-testable without rendering
  anything. **Deliberately absent from the hooks barrel**, as it is from upstream's, so
  `useOverflow` is its only caller and the suite imports it from the module directly.
  Its 34 cases live in `src/tests/compute-overflow.test.ts` — a `.test.ts`, so the **server**
  project runs them and no Chromium boots.
- **`useOverflow`** — delegates the whole fit loop to `computeOverflow`, gains `maxVisibleItems`
  and `maxRows` options and `rows`/`rowHeight` on its return. Upstream's `useDevWarning` for
  `maxVisibleItems < minVisibleItems` becomes a plain `$effect` rather than the init-time statement
  `Field` and `Thumbnail` use: unlike a mutually-exclusive-props check, both values can legitimately
  change after mount and upstream re-warns when they do. Suite 20 → 26, matching upstream.
- **`OverflowList`** — `maxVisibleItems`/`maxRows` forward to the hook; a new `containerMultiRow`
  group swaps `flex-wrap`/`align-content`/`white-space` in, and a `multiRowHeight` dynamic style
  bounds the container to `maxRows` rows of the measured row height plus the gaps between them.
  Suite 14 → 18 (upstream's 19 less `displayName`). Oracle: `containerMultiRow` matched on the
  first run; the dynamic `maxHeight` compiles to a function on both sides, so neither extractor
  sees it — the same standing as `DropdownMenu`'s `popoverCustomWidth`.


### the menu family: `BreadcrumbItem.menu`, the selectable trio, `DropdownMenuSubMenu`

Ported as one unit because they are one: a breadcrumb menu, a context menu and a dropdown menu all
run the _same_ item pipeline upstream, so the breadcrumb prop could not land without the shared
hook changes, and those in turn revealed the trio was no longer blocked.

- **`useListFocus` gained `boundarySelector` / `ownsEvent` / `getItems`.** A menu and its submenu
  flyouts both use `role="menu"`, and a flyout renders _inline_ (native popover, not a portal), so
  without scoping a parent's `querySelectorAll` sweeps the nested items into its roving order and
  the nested level's key events bubble up and get handled twice. `getItems` now filters on
  `el.closest(boundarySelector) === container`; `ownsEvent` applies the same test to an event's
  target. Both are exported so a consumer wrapping `handleKeyDown` (Enter/Space activation,
  typeahead) can self-filter identically.
- **`DropdownMenu` and `ContextMenu` had silently drifted.** Upstream passes
  `MENU_BOUNDARY_SELECTOR` in both and builds typeahead from the hook's scoped `getItems`; ours
  still hand-rolled a `querySelectorAll` off a `bind:this` element and had no `ownsEvent` guard.
  Fixed in the same pass — the hand-rolled `getMenuItems` in each is now `list.getItems`, which is
  also what let `ContextMenu` drop a `menuEl` read it no longer needed for that purpose.
- **`DropdownMenuItem` lost a `:hover` background.** 0.2.0 deleted it and added
  `menuItemHover.ts`'s `focusMenuItemOnHover`, which moves DOM focus to the pointed-at row on
  `pointermove`. The point is that focus is the _sole_ highlight source: with both, the
  keyboard-focused row and the hovered row highlight at once. Ours still had the `:hover`, so this
  was a drift fix that also closed an oracle mismatch. `DropdownMenuSubMenu`'s trigger _keeps_ its
  `:hover` — that row opens on hover intent, so there the pointer highlight is the affordance.
- **`DropdownMenuCheckboxItem` / `RadioGroup` / `RadioItem`.** Straight ports. The row owns
  `role`/`aria-checked`/`tabindex` (no nested native `<input>`, per the WAI-ARIA pattern) and the
  square/circle is a decorative `aria-hidden` marker in `Item`'s `marker` slot, moved to the
  inline-end on coarse pointers via `order`. `DropdownMenuRadioItem` throws at init when it has no
  group — upstream throws during render, and the init-time check is the counterpart; it runs on the
  server too, which is right, because a radio item outside a group is an authoring mistake rather
  than a runtime state. The group context is stored as a **getter**, per this port's convention, so
  an item re-reads the live `value` instead of the one that existed when it mounted.
- **`DropdownMenuSubMenu`.** One component, not three — the row is promoted into a nested surface
  by having children, the way `SideNavItem` does, rather than a Sub/SubTrigger/SubContent split.
  `useLayer` context mode positions the flyout; `useMenuHover` supplies open/close intent; a
  per-level `useListFocus` + `useTypeahead` owns the keyboard. Every level **re-provides**
  `DropdownMenuContext` with a `closeMenu` that closes itself _and_ calls the parent's, which is
  what makes selecting a leaf dismiss the whole stack rather than one flyout. Upstream's single
  `setTriggerEl` ref callback — which both stores the row and wires it as the positioning anchor —
  becomes one `createAttachmentKey()` entry travelling in `Item`'s rest props, since `Item` spreads
  them onto its root.
- **`renderDropdownItems` owns the recursion.** A data item with a non-empty nested `items` array
  becomes a `DropdownMenuSubMenu` whose children are `renderDropdownItems(item.items)`. The
  submenu never imports the renderer back, so there is no cycle; in Svelte the recursion is a
  **self-import** of the component's own file (`<svelte:self>` is gone in Svelte 5).
- **`BreadcrumbItem.menu` / `menuSize`.** A single `menu` prop typed `DropdownMenuOption[] |
Snippet`, discriminated with `Array.isArray` exactly as upstream does — no `items`/`menuContent`
  split was needed here (unlike `ContextMenu`), because a snippet is a function and an array is
  not. `menuSize` defaults from the breadcrumb variant (`supporting` → `sm`). The trigger lives in
  a sibling `breadcrumb-menu-trigger.svelte`: upstream's `BreadcrumbMenuTrigger` is module-private
  in the same file, and Svelte allows one component per file, so it is a sibling the barrel does
  not export.
- **`BreadcrumbItemProps.children` widened to `Snippet | string`.** This is the interesting one.
  Upstream names the menu surface with `aria-label={typeof label === 'string' ? label : undefined}`
  — the crumb's own children. A Svelte snippet is opaque, so a bare `Snippet` would make that
  branch structurally unreachable and every breadcrumb menu would go unnamed. The port already
  models React's "string or node" unions as `string | Snippet` wherever upstream narrows on the
  string (`HoverCard.children`, `Item.label`, `CommandPaletteEmpty.children`,
  `CheckboxListItem.label`), so this follows that precedent rather than inventing a `menuLabel`
  prop. Consumers write `children="Teams"`; slot content — even a literal — compiles to a snippet
  and leaves the menu unnamed, which the docs example calls out in place.

**Oracle.** All four new `.stylex.ts` modules matched upstream's compiled CSS on the first run: 17
new style keys, 1 new inline call site, 0 mismatches, still 0 skips. The checkbox and radio modules
are **object-mode only** — their one call site indexes `boxSizeStyles[controlSize]` /
`circleSizeStyles[controlSize]` dynamically, so StyleX cannot fold them and upstream's compiled
module carries no inline string at all, exactly as `DropdownMenuItem`'s `itemSizeStyles[size]`
already did. Getting that wrong is cheap to detect: the oracle reports _"upstream has no matching
call site"_ with an empty class list, which is a different message from a class mismatch.

**Tests.** `Breadcrumbs` 25 → **37/37** — upstream's whole file, nothing dropped, since the three
cases previously named-and-dropped (two selectable, one submenu) became portable in the same
change. Two new files: `dropdown-menu-selectable.svelte.test.ts` (**6/6**) and
`dropdown-menu-sub-menu.svelte.test.ts` (**17/17**). Three translations in the submenu suite worth
recording:

- Two cases assert open state right after a native `.click()`. Upstream's `await user.click()`
  flushes React first; a native click does not wait for Svelte's DOM update, so both assertions
  became `vi.waitFor`.
- **`roves to the first item once a loading flyout resolves` needed the fixture to defer its state
  write.** Upstream's `setLoaded(true)` fires during `layer.show()` but React has not committed by
  the time the submenu's `requestAnimationFrame` runs `focusFirst()` — so the flyout is genuinely
  item-less at that instant, focus falls back to the container, and _that_ is the state the case
  exists to exercise. A `$state` write flushes ahead of that rAF, so the undeferred version had
  already rendered `Folder A` and focus landed straight on it, making the following ArrowDown step
  to `Folder B` and the case assert nothing. A `setTimeout` in the fixture restores upstream's
  ordering. The deferral is in the **fixture**, not the component: the component's behaviour is
  identical either way, and what needed reproducing was "children arrive after the flyout opens".

**One upstream bug, recorded not replicated.** The `DropdownMenuWithSubmenu` example block passes
`icon="pencil"`, `icon="folder"` and `icon="trash"`. None of those is an icon name — upstream's own
`IconName` union is the same 26 entries as this port's and contains none of them. Upstream types
`DropdownMenuItem.icon` as `ReactNode | IconType`, so a bare string passes as a `ReactNode`;
`renderIconSlot` then casts it back to `IconName` and `getIcon` returns `undefined`, rendering an
empty icon slot. The props are inert upstream. This port types `icon` as `Snippet | IconName`,
which rejects them at compile time, so the ported example drops them rather than substituting some
other registry icon — a substitution would be demo content upstream does not have.


### the tail: Outline's navigation props, `hasExpandAllControl`, `useTableRowStatus`, the link seam

The five slices that closed workstreams B and D. Grouped by what each actually taught.

#### `Outline` — four props that are one behavioural unit

`useScrollSpy` was re-ported whole rather than extended. Upstream's 0.2.0 shape is a **navigation
contract**, and the pieces only work together:

- **`getRestingTop` is the single source of truth** shared by the activation line and the scroll
  landing — scroll-root top + `offset` + the heading's own `scroll-margin-top`. A heading therefore
  activates exactly where navigating to it puts it, and the two inputs **compose rather than
  duplicate**: a 48px header plus an 8px `scroll-margin-top` is a 56px line, not 96.
- **`scrollTo(id)` replaces `lockActiveId`** and owns the scroll as well as the suppression.
  `finish(didArrive, shouldResume)` fires `onNavigateEnd` **exactly once for every
  `onNavigateStart`** — including when a manual wheel/touch/key scroll takes over mid-flight — so a
  consumer's "navigating" state can never leak. A second navigation `supersede`s the first without
  resuming tracking; unmount `teardown`s without firing at all.
- **The settle watch listens on the scroll _target_, not the window.** With `scrollContainerRef`
  scoping the outline to a pane, a window `scrollend` must not resolve the navigation — a case
  upstream tests and the pre-0.2.0 port would have failed.
- **`hasScrollOnClick={false}` resolves immediately** rather than waiting out the 1200ms fallback,
  so an arrival effect paired with `onNavigateEnd` does not land a second late for no reason.

Three translations, all settled ones: `scrollContainerRef` is a **getter** (the `ChatLayout.scrollRef`
precedent); the options object is read once at the top of `scrollTo`, because an event handler is
outside any tracking context; and `onActiveIdChange` is read through `untrack(() => options()…)`
because upstream reads it from a ref — the _latest_ callback — while `onNavigateEnd` is read from the
render closure. The asymmetry is upstream's, not a simplification.

**The roving tab stop needed one thing stated rather than relied on.** Upstream registers its seating
effect _after_ `useListFocus`'s layout effect so it wins. Svelte guarantees no such order between a
script-level `$effect` and an attachment's — but here it does not matter, and saying so is better
than depending on it: `syncTabStops` keeps whichever enabled item already carries `tabindex="0"` and
only promotes the first as a fallback, so running first lets this effect move the stop, and running
second finds the active item already holding it. Both orders converge.

**One drift fixed on the way**: `aria-current` was `"true"` here where upstream emits `"location"`.
Load-bearing rather than cosmetic — the seating effect finds the active link by that exact value.

Suite: 17 → **46/46**, upstream's whole file. Two Chromium translations recur.
`mockScrollMarginTop` has **no counterpart**: upstream fakes `scroll-margin-top` at the
`getComputedStyle` boundary because jsdom's cssstyle never resolves it, where Chromium does — so the
headings simply declare it, testing the same read through the real CSSOM instead of around it. And
the document-height pin is **explicit in every describe**: upstream pins `scrollHeight` in one case
and three later describes inherit it by leakage (`Object.defineProperty` is not a spy, so
`restoreAllMocks` never undoes it), which would make a case pass for a reason it does not state.

#### `useTableTreeData.hasExpandAllControl` — found by a docs block, not by a check

The `TableTreeTable` block sets it; nothing else in the port did. **No gate could have reported it.**
The docs generator counts documented _props_ core lacks, and a hook's option bag is not a props
interface. The class oracle had `treeStyles.headerCell` in its inline list and was green, because the
_styles_ for the control were ported when the module was — so **a clean oracle proved a control that
did not exist**. That is the sharpest illustration yet of what the oracle does and does not claim.

`useTableTreeState` gained `isAllExpanded` (`true` / `false` / `'indeterminate'`, counting only
_expandable_ ids so a leaf or unknown id in the expanded set never skews the tally) plus
`onExpandAll`/`onCollapseAll` on `treeConfig`. `TreeExpandAllToggle` shares the row expander's
button, chevron and RTL-mirror nesting; `'indeterminate'` reads as collapsed and the next press
expands all, which is upstream's `=== true` comparison rather than a truthiness check.
`transformHeaderCell` wraps label + toggle in one inline-flex row — a bare `before` slot would stack
the chevron _above_ the title, which is the bug upstream's own case pins.

Two Svelte specifics: `treeKeyResolved` is a plain `let` (a ref is precisely a non-reactive cell, and
`$state` written during a transform would invalidate the derived that ran it), resolved **before**
the flat-data early exit as upstream does; and `{...treeConfig, hasExpandAllControl}` must spread
**inside** the config getter, since `treeConfig`'s members are getters and one spread would snapshot
the aggregate state so the toggle never relabels.

Suites: `useTableTreeData` 23 → **31/31**, `useTableTreeState` 29 → **36/36**.

#### `useTableRowStatus` — the smallest plugin, and the oracle's blind spot in miniature

189 upstream LOC: one synthetic 28px column, one transform, no context and no state. It is the first
slot to use `bindCellSnippet` **without** keying — one synthetic column means one binding, so the
identity is stable without a per-column map. The `null` guard lives in the _slot_, not in
`RowStatusCellContent`, because upstream's `return null` renders **no node** where a component that
renders nothing still leaves Svelte's anchor comment in every statusless row.

`SEMANTIC_COLORS`/`resolveColor` live in the `.stylex.ts` because the dot's colour feeds a
`stylex.create` function style. Upstream writes the tokens as literal `var(--color-icon-*)` strings
rather than reaching for `colorVars`, and that is transcribed rather than tidied: the value ends up
in a **CSS custom property** at runtime, not in a `stylex.create` declaration, so an authored raw CSS
colour has to travel the identical path.

**Its oracle case is the clearest illustration of both modes in one module** — `styles.wrap` folds to
a literal class string (inline), `styles.dot` is a function style and survives as an object. And it
is where the oracle's limit surfaced: `extractGroups` requires `$$css: true`, which an arrow value
does not carry, so **`styles.dot` is not diffed at all** — nor is any of the port's 54 other function
styles. Its two colour test cases are the only mechanical check that the dot resolves.

Suite **9/9**; both upstream stories on a new demo route; docs block landed, and porting the hook
reopened the block backlog by exactly one.

#### `Avatar.as` / `Button.as` — the prop was trivial; the seam behind it was not

`Avatar.as` was booked as an open translation decision. It is not one: `useLinkComponent()` in this
port already returns a resolver taking an `as` override, so the prop is a pass-through, and the
`Snippet`-has-no-props problem the plan feared belongs to `getStatusLabel`, which the status-label
sink had already solved.

What the slice actually found is that **`Avatar` and `Button` both rendered a hard-coded `<a>`**, so
a link inside a `LinkProvider` did a full page load — the provider appeared to work everywhere else
and failed only there. Of upstream's ten components carrying `as?: LinkComponentType` this port had
eight. Both now resolve through `LinkElement`, with the props object carrying the tooltip attachment
under a `createAttachmentKey()` (the `BreadcrumbItem`/`ClickableCard` seam) and the `to` alias for
`to`-based routers.

`Button`'s link branch carried a comment calling this "the deferred `as`/LinkProvider work" — and no
`TODO.md` entry recorded any such deferral. Third recurrence of _a header comment is an assertion and
rots like one_, after batches 14 and 15.


## Oracle bookkeeping

`elevation` landed on 7 components, not the 8 the plan predicted. Oracle 163 → 101 over the batch's
course. The menu family's four new `.stylex.ts` modules matched upstream's compiled CSS on the first
run: 17 new style keys, 1 new inline call site, 0 mismatches, still 0 skips.

## What the audits caught

### Batch 17b — the status-variant family (audit findings)

- [ ] **`TextArea`'s `statusVariant="tooltip"` button is not hoverable or tappable, upstream and
      here.** `TextArea`'s own `styles.statusIcon` wrapper — the absolutely-positioned span the
      on-field glyph has always sat in — carries `pointerEvents: 'none'`. 0.2.0 put a real
      `<button>` inside it without revisiting that, so pointer hit-testing skips it: keyboard focus
      still opens the info-tip (the WCAG 2.1.1/2.4.7 obligation the changelog cites), but hover and
      touch-tap do not. **Replicated deliberately**, and it is the one place in this batch where
      that was the call rather than the exception: the wrapper's declaration is byte-identical to
      upstream's compiled class and the oracle checks it, so dropping `pointer-events` would trade
      a compiler-verified property for an unverifiable local fix. The other six tooltip-variant
      inputs put the button in a normal flow position and are unaffected. Retire when upstream does
- [ ] **Divergence (ours is correct): `DateInput` guards its status-message `aria-describedby` on
      `!inputGroup`; upstream does not.** Upstream added exactly that guard to `TextInput` and
      `NumberInput` in 0.2.0, with the comment _"the status message element is rendered by Field,
      which is skipped inside an InputGroup — only reference it when it actually exists"_, and did
      not add it to `DateInput`, which also renders no in-group status element. So upstream's
      `DateInput` inside an `InputGroup` points `aria-describedby` at an id that is not in the
      document. (`TimeInput` correctly has no guard — it _does_ render a visually-hidden status
      element in the group branch, which is why its described-by case asserts the text is found.)
      Neither side has a test for the `DateInput` case. Documented rather than replicated


## Rules promoted

Not promoted at the time.

## Retired debts

The `DropdownMenu` selectable trio + `DropdownMenuSubMenu` deferral is retired — the 0.2.0 tarball
compiles what 0.1.7's published dist did not.

### Resolved — `DropdownMenu` — deferred selectable trio + slot translation

- [x] **RETIRED 2026-08-06 — the selectable trio and `DropdownMenuSubMenu` are ported.** The deferral was: the **published dist v0.1.7 did not compile them** (no `menuItemRoles.ts`, no selectable-item classes, `index.d.ts` exporting only `DropdownMenu`/`DropdownMenuItem`), so the class oracle had no dist counterpart to diff against and porting would have been unverifiable. **0.2.0's tarball ships all of it**, and all four modules matched on the first oracle run. This is the second time the "published dist lags source" pattern resolved itself by a pin bump rather than by a workaround — the first being the 14 self-retiring skips at the top of Batch 17. Worth the standing lesson: **re-check a stale-dist deferral at every pin bump before planning around it.** The check is one `ls` of the dist directory and it turned a whole workstream from "next batch" into "already unblocked"
  - Retired by: own title says resolved ("RETIRED 2026-08-06").


### Retired — `DropdownMenu` — deferred selectable trio + slot translation

- [ ] `DropdownMenu`'s trigger `aria-controls` targets the `<Layer>` popover wrapper (which carries `menuId` via `layer.id`), not a dedicated id on the inner `role="menu"` div — upstream mints a _second_ `useId` for the menu div and points `aria-controls` there. Ours is valid ARIA (unique target that wraps the menu) and is **the port's uniform popover convention** (`usePopover` owns the id as the aria-controls target; `Popover`/`HoverCard`/`Tooltip` all wire it at `layer.id`). Restoring upstream's two-id shape would make `DropdownMenu` the only popover component to diverge, so the convention wins. Upstream's own suite doesn't assert the linkage
  - Retired by: `dropdown-menu.svelte` now mints a dedicated `menuId` (`${uid}-menu`) separate from
    `layerId`, and `aria-controls={menuId}` targets the `role="menu"` div directly — matching
    upstream's two-id shape this entry said the port didn't use.

- [ ] **`DropdownMenu.test.tsx` ported case-for-case** — `src/tests/dropdown-menu.svelte.test.ts` (36/36), client (Chromium) project. Upstream's `beforeEach` `showPopover`/`hidePopover`/`:popover-open` stub dropped (Chromium is native; call-based assertions keep upstream's form via `vi.spyOn` calling through). Three cases restated with comments: the two placement cases (browser canonicalises `position-area` token order → sorted-token compare, per `layer.svelte.test.ts`) and case 28 "renders icon + label" (upstream's `not.toHaveAttribute('aria-label')` is unportable — the Button port sets aria-label on `children != null`, having no way to compare an opaque Svelte snippet to the `label` string the way upstream's `children !== label` does; the accessible name is `'Settings'` either way, so the restated case asserts the name + icon). **`DropdownMenuSelectable.test.tsx` is now ported in full** (`src/tests/dropdown-menu-selectable.svelte.test.ts`, 6/6), as is `DropdownMenuSubMenu.test.tsx` (`src/tests/dropdown-menu-sub-menu.svelte.test.ts`, 17/17), both unblocked by the 0.2.0 pin. No checkbox/radio case leaked into `DropdownMenu.test.tsx`, and it has no React ref-callback or `displayName` case, so nothing else is dropped within it
  - Retired by: stale — `dropdown-menu.svelte.test.ts`'s own header now reads "67 of its 77 cases
    (v0.4.1)" and explicitly documents 9 cases DROPPED (menuitemradio/menuitemcheckbox keyboard
    access, #3829) as "a standing coverage debt, not a translation decision" — materially different
    from this entry's "36/36, nothing dropped" claim.


## Debts opened

-
