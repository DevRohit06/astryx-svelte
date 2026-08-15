# Ported components — implementation notes

**131 components across 101 upstream dirs — the complete set.** (The dir figure read 89 while the
pin was 0.1.7; re-measured against `v0.3.0`, upstream's `packages/core/src/` holds 101 component
dirs and every one has a counterpart here. Ours are 97 directories, because `HStack`/`VStack` fold
into `stack/` and `SizeContext`/`InteractiveRoleContext` into context modules; all four are
exported.) This is the per-component reference for
[astryx-svelte](./TODO.md): what each unit does, the React→Svelte translations it needed, and its
oracle and test posture. Split out of `TODO.md` on 2026-08-05, verbatim — it was 62 KB of the
backlog file and none of it is status, so it belongs beside it rather than inside it.

Read this to answer _"how was X ported, and what did it cost?"_. For what is **left** to do, for
open divergences and for the batch history, stay in [`TODO.md`](./TODO.md) — its **Known debts**
section is where every open decision lives, and several entries here point at it.

---

- Button, Spinner, VisuallyHidden, Text + Heading (`useTruncation` → attachment)
- Code, Kbd, Blockquote
- Layout primitives: Stack/StackItem/HStack/VStack, Grid/GridSpan, Divider, AspectRatio, Center
- Badge, StatusDot, Skeleton, ProgressBar
- Card (+ `internal/container.stylex` padding system)
- Timestamp (added the oracle's `inline` comparison mode)
- Avatar, AvatarStatusDot, AvatarGroup, AvatarGroupOverflow
- Icon (registry entries are **snippets**; the `icon` prop is a component)
- Tooltip (`useTooltip` + `<TooltipLayer>` + `<Tooltip>`) — and its 4 consumer debts (Button/StatusDot/Timestamp/Text+Heading), via `{#await import()}` code-split
- Thumbnail (+ `MediaTheme` + on-media theme compiler; `useImageMode`/APCA)
- NavIcon, IconButton, EmptyState, Citation
- FieldStatus, FormLayout, MetadataList (+ MetadataListItem) — registration-based `Children` substitute
- Layout + LayoutHeader/Footer/Content/Panel (+ `edgeCompensation.stylex`)
- Resizable: `useResizable` + ResizeHandle
- Overlay + OverlayScrim + `useOverlay` (added the oracle's marker-normalised CSS mode)
- HoverCard + HoverCardLayer + `useHoverCard`
- ButtonGroup
- Field + FieldLabel + `inputStyles` (fan-in 18, gate on the input family)
- TextArea, Switch, TextInput + InputGroup (+ InputGroupText) + InputClearButton
- Link (full unit) + Item; RadioList + RadioListItem
- Popover (`usePopover` + `<PopoverLayer>` + `<PopoverAnchor>` + `<Popover>`) — click-triggered dialog on `Layer` + `useFocusTrap`; three trigger modes (automatic/`trigger` render-prop/`anchorRef` sibling), hidden close button, 50ms re-open guard. Unblocks `Selector`/`DropdownMenu`/`DateInput`
- `internal/optimistic.svelte.ts` (`createOptimistic`, the `useOptimistic` replacement); `value = $bindable()` on controlled inputs
- OverflowList (the last L0 leaf) — `items: T[]` + `item: Snippet` on `useOverflow`; single hidden `[inert]` measure container + real sliced visible DOM; byte-identical classes; see Known debts for the forced snippet-translation API divergence
- Dialog + DialogHeader (+ `dialog-context`) — native `<dialog>` + `showModal()` (no `<Layer>`; browser top-layer); `purpose`-gated dismissal, directional entry animation, `useScrollLock`, focus-trap-aware Escape; added the `dialog` padding chain to `container.stylex` (retired the standing oracle skip). `useImperativeDialog` **landed in batch 15** as a controller plus `<ImperativeDialogLayer>`
- DropdownMenu (+ DropdownMenuItem, `renderDropdownItems`, `dropdown-menu-context`, `menu-item-roles`) — data + compound modes on `Popover` (`role: 'none'`) + `useListFocus`/`useTypeahead`; APG menu-button keyboard model; 36/36 tests. **Selectable trio (Checkbox/Radio/RadioGroup items) deferred** — the un-compiled stale-dist slice; see Known debts
- Section — two-div structure (outer margin-negation wrapper + inner styled region); `variant`/`dividers`/`padding`/`paddingBlock`/sizing; landed `sectionDefaultPaddingStyles` (container) + `sectionPaddingPropagationStyles` (padding), **retiring the two Section skips and 17 more** the padding chains had held open (27 → 8 skips); 20/20 tests
- Token — chip/tag with three render branches (inert `<span>`, link `<a>` via `LinkElement`, onClick `<span>`+invisible `<button>`); `useInteractiveRole`/`useLinkComponent`/i18n remove label; closed-prop-list root (see Known debts); 32/32 tests
- SelectableCard — controlled toggle card composing `Card`; hidden `<input type="checkbox">` is the a11y surface + inset accent ring; `useClickableContainer`. **Card exposes no element seam, so the container `<div>` is captured with an attachment threaded through `Card`'s `{...rest}`** (idiom-audited sound) — no `Card` change; 9/9 tests
- ClickableCard — nav/action card composing `Card`; hidden `<button>` (onclick) or `<a>` via `LinkElement` (href); `useClickableContainer` with nested-interactive bail. Same attachment-through-`{...rest}` container capture as SelectableCard, plus the hidden control captured via `bind:this` (button) or an attachment through `LinkElement` (link). A custom link component that doesn't spread the attachment onto its DOM node leaves the proxy-click unbound and the hook falls back to `window.location.href` (full-page nav) — graceful, harder to hit than upstream's ref-forward equivalent (a working custom link must already spread the same `{...rest}` that carries `href`); 9/9 tests
- SegmentedControl (+ SegmentedControlItem) — radiogroup on `useListFocus` (roving tabindex) + `useKeyboardHint` (`<KeyboardHintLayer>`) + `useTooltip` (disabledMessage); getter context; APG selection-follows-focus with the #3597 pure-tab-in guard; 41/41 tests
- ToggleButton (+ ToggleButtonGroup) — thin wrapper over `Button` (ghost, interruptible) with `aria-pressed`, `pressedIcon` swap, semibold-on-press + width-reservation; `createOptimistic` toggle; getter-context group (single deselect-on-reclick / multiple), discriminated-union props. **The pre-click pressed target is captured into a non-reactive `let` in `handleClick`** — `optimistic.run` flips the override before it awaits, so a live `$derived` re-read would hand `pressedChangeAction` the inverted value (idiom + test agents both caught this race; fixed); 25/25 tests
- Lightbox (+ `useLightbox` + `<LightboxLayer>`) — fullscreen media viewer on the **native `<dialog>` + `showModal()`**, not the Popover API and not `<Layer>`; focus containment is the browser's, so no `useFocusTrap`. Controlled/uncontrolled `index`, double-click zoom (a 1↔2 toggle) and unclamped pointer drag, arrow-key navigation, `useScrollLock`, and polite `useAnnounce` announcements gated to index changes during an already-open session. Nav buttons stay **mounted and disabled** at range boundaries so dismissing at the edge can't drop focus to `<body>` (3 upstream cases pin it). `useLightbox`'s `element: ReactNode` becomes `<LightboxLayer>`, the `useLayer`/`useTooltip`/`useKeyboardHint` split. Two upstream bugs replicated (empty-gallery scroll-lock leak; unconditional arrow-key `preventDefault()` that kills `<video>` seeking) and one dead ref dropped. 26/26 tests. **Corrected `planning/01`**, which described this component as a Popover-API overlay with a focus trap and autoplay timing — all three wrong
- Toast (+ ToastViewport + `useToast` + `toast-context`) — the imperative overlay: `ToastViewport` owns the list, `uniqueID` dedup (`overwrite`/`ignore`), `maxVisible` slicing, grid-row exit transitions, F6 keyboard reach and focus handoff on dismiss; `popover="manual"` for the top layer (no `<Layer>` — the viewport is fixed-positioned, not anchored). `useToast()` returns an imperative `showToast` and works with **or without** a provider: `mount()` being synchronous retires upstream's `createRoot` promise handshake, pending-entry queue and proxy in favour of a one-slot handoff (`fallback-slot.ts`). Two source-faithful Svelte corrections found by the idiom audit: the viewport mutators `untrack` their state reads (upstream's `setToasts(prev => …)` never reads the list, which is what makes `$effect(() => toast(…))` legal for a consumer), and `toasts` is `$state.raw`. Landed `internal/theme-mode.svelte.ts` for the resolved colour mode. **7/7 `ToastViewport` cases**; `useToast.test.tsx` (4) landed in batch 8, when `<Theme>` did. Does **not** yet unblock `LayerProvider`/`LayerContext` — see Known debts
- **Batch 1** — `List` + `ListItem` (+ `list-context`), `MoreMenu`, `AlertDialog`, `Banner`:
  - **List / ListItem** — `<ul>`/`<ol>` by marker style, custom counter markers (CSS counter, not
    `list-style-type`), density/dividers/header context; `ListItem` composes `Item`, so the invisible
    button/anchor pattern comes for free. Context is optional — a bare `ListItem` falls back to
    `balanced`/no dividers/no markers, as upstream's nullable context does. 52/52 tests
  - **MoreMenu** — thin `DropdownMenu` wrapper: ghost icon-only trigger carrying the registry's
    `moreHorizontal`, `label` doubling as `aria-label` + tooltip, `hasChevron={false}`. No styles of
    its own, so no oracle case. 16/17 tests (`supports forwardRef` dropped — closed `Pick` props, no
    seam)
  - **AlertDialog** — `role="alertdialog"` over `Dialog` (`purpose="form"`), title/description wired
    through `aria-labelledby`/`aria-describedby`, cancel + action buttons in a `Layout` footer. The
    action never auto-closes. 12/12 tests. **Fixed a real `Dialog` bug on the way in**: our port wrote
    `role={purpose === 'required' ? 'alertdialog' : undefined}`, which _clobbers_ a caller's `role`;
    upstream spreads `{...(purpose === 'required' ? {role} : undefined)}`, so the caller's survives.
    Now a conditional spread. `useImperativeAlertDialog` **landed in batch 15** with `useImperativeDialog`, as a controller plus `<ImperativeAlertDialogLayer>`
  - **Banner** — two theme targets (coloured status header + collapsible content region), status →
    icon/role/background mapping, self-managed dismissal, `aria-controls` set only while the region is
    mounted, `edgeCompSlot.inset` on the end area (its first real consumer). 33/33 tests
- **`Spinner.label` restored** (found while filling the demo's coverage gaps). Upstream's
  `label?: ReactNode` renders below the ring, becomes the accessible name when it is a string,
  and moves the root to a wrapper `<div>` that every consumer prop is routed to. The port had
  dropped the prop entirely — `spinner.stylex.ts` carried the `wrapper` style all along with
  nothing rendering it, and no oracle skip was needed because the key still compiled. `label` is
  `string | Snippet`, and **`Spinner.test.tsx` is now ported** (16/16 then; **17/17** since 0.1.9 split its label case in two, updated at 17c); the component predates the
  case-for-case test discipline and had no suite at all
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

- **Batch 4** — `CheckboxInput`, `CheckboxList` (+ `CheckboxListItem` + context), `Slider`:
  - **CheckboxInput** — native `<input type="checkbox">` under an `aria-hidden` box, with the mixed
    state carried _only_ by the DOM `indeterminate` property (no `aria-checked`, which upstream's
    forms-16 comment calls redundant and desync-prone). Controlled with **no** `$bindable()`, unlike
    `Switch`: `'indeterminate'` has no boolean to commit back and `CheckboxListItem` drives `value`
    from the group's array. Rest props land on the `<input>`, not the root — test-pinned. Reads one
    field of `CheckboxListContext` (`hasDisabledMessage`) so a checkbox in a disabled-with-a-reason
    group stays focusable via `aria-disabled`. 32/32 tests
  - **CheckboxList / CheckboxListItem** — `Field` + `List` + a getter context, in two modes:
    _collection_ (the group owns `value[]`, every item needs a `value` or it throws) and
    _standalone_ (each item owns `isChecked`/`onCheck`), which is what the select-all pattern is
    built from — the group computes no tri-state of its own. Upstream's two `useOptimistic` values
    collapse into **one `createOptimistic` over a `{values, toggled}` tuple**, because they revert
    together on one transition and `createOptimistic` has a single override per instance. 43/43 tests
  - **Slider** — single or range on a discriminated union (`value: number | [number, number]`),
    fully controlled, zero effects. Pointer interaction belongs to the track and survives leaving the
    element through pointer capture, so there are no window listeners; `minStepsBetweenThumbs` is read
    through `'minStepsBetweenThumbs' in rest`, upstream's own probe. Compiles to **28 inline call
    sites and no style object at all** — the first pure-`inline` oracle case. 32/32 tests
- **Batch 5** — `NumberInput`, `FileInput`, `CodeBlock` (+ the `theme/syntax/` subsystem):
  - **NumberInput** (rewritten to 0.4.1, #4896) — a **text-backed spinbutton** on the `TextInput`
    shell (`Field` outside a group, bare control inside one): `type="text"` with `role="spinbutton"`
    and `aria-valuemin`/`valuemax`/`valuenow`/`valuetext`, and no native `min`/`max`/`step` attribute
    anywhere. That is what lets `formatValue` show `$1,234.56` at rest and the raw number on focus,
    and what makes the stepping arithmetic the component's own rather than the UA's. Strictly
    controlled with **no `$bindable()`**, unlike `TextInput`: upstream never writes `value` back, and
    the emptied-then-blurred-with-no-parent-update case depends on it. A local `pendingInput` buffer
    holds unparseable text — it dims (`inputInvalid` _replaces_ the text colour rather than joining
    it, so the inline merge order is load-bearing), sets `aria-invalid`, announces through an
    always-rendered `role="alert"` region, and reverts on blur; Enter commits but deliberately keeps
    the buffer. **`min`/`max` are enforced two different ways**, which is the thing to remember:
    typing out of range is _rejected_ (`parseNumberInput` returns `null`, so `onChange` never fires),
    while stepping _clamps_ and then no-ops — and that same no-op comparison
    (`getSteppedValue(…) === value`) is what greys out one stepper button at a time. `getSteppedValue`
    is **transcribed, not reimplemented** (character-identical to upstream once trailing commas are
    normalised): its `Number.EPSILON * max(1, |pos|) * 4` tolerance is what snaps `0.25` at
    `step: 0.1` to `0.3` going up and `0.2` going down. `step`'s documented `@default 1` is real here
    too, applied by `getEffectiveStep` rather than by an attribute. Keyboard stepping is **arrow keys
    only and only unmodified** — no PageUp/PageDown, no Home/End, no press-and-hold repeat, none of
    which upstream has. **Two attachments, neither `untrack`ed**: the controlled-`value` sync, which
    is now *defensive* rather than load-bearing (TODO.md's spread hazard — `type="text"` retired the
    bad-input symptom, and the intuitive replacement, caret destruction, was measured in Chromium and
    does not occur, because the `value` setter only moves the cursor when the value differs); and the
    non-passive `wheel` listener, an attachment rather than `onwheel={…}` because an attribute after
    `{...rest}` would shadow a consumer's own, and one that gets the `isWheelEnabled` re-attach for
    free. One **accepted divergence**: a consumer's `onwheel` fires here after a consumed step and
    does not upstream, since React delegates `onWheel` from the root where `stopPropagation()` reaches
    it. `isFocused` is plain `$state` and forces `onfocus` to be composed, since focusing is what
    swaps `displayValue` from the formatted string to the raw number. Props are a _discriminated
    union_ (`hasClear` widens `onChange` to accept `null`), not an interface, so the two arms meet at
    one cast. The clear button is the shared `InputClearButton` as of #4876. Oracle-wise the six
    stepper declarations **look like function styles and are not** — each has one statically-known
    call site, so StyleX folded them all into literals and they are `inline:` entries rather than a
    skip. 113/113 tests
  - **FileInput** — the operable control is a `role="button"` wrapper, not the `<input type="file">`,
    which is visually hidden / `aria-hidden` / `tabindex="-1"`; every describing attribute lives on
    the wrapper (upstream's forms-6). `input` and `dropzone` modes, with the four drag handlers
    attached _only_ in dropzone mode — in `input` mode a drop is not even `preventDefault`ed.
    Client-side `accept`/`maxSize`/`maxFiles` validation in upstream's exact order, since only
    `errors[0]` is ever surfaced, and `maxFiles` **truncates** rather than rejecting. An explicit
    `status` prop suppresses the internal validation error from the border/icon/`aria-invalid` while
    the live region still carries it. 50/50 tests
  - **CodeBlock** (+ `tokenizer.ts`, `highlight-ranges.ts`, `highlight-styles.ts`) — the three helper
    modules are **pure and transcribe verbatim**; only `CodeBlock.tsx` carries StyleX. Syntax colour
    is painted with the CSS Custom Highlight API (`Range`s in `CSS.highlights`, styled by
    `::highlight()`), so the code stays bare text nodes; browsers without it — and Safari, which has
    the objects but mis-renders the pseudo-element — fall back to `<span>`s. Upstream's `renderLines`
    / `buildSpanLine` return `ReactNode`; the counterparts return **data** the template renders, which
    is what makes `React.memo` unnecessary (identical DOM either way). `useTokenLines` splits into a
    `$derived` sync half, an `AbortController` `$effect` async half above the 2000-char threshold, and
    a `$derived` that only trusts the async answer while its cached `code` _and_ `language` still
    match. `highlight-styles.ts` is deliberately **not** a StyleX module — `::highlight()` rules have
    no `stylex.create` expression, so it hand-writes one `<style>` into `document.head` once.
    13 + 12 + 3 tests, nothing dropped
  - **`theme/syntax/`** — `defineSyntaxTheme`, `syntaxThemeStyle`/`syntaxThemeToCSS`,
    `syntaxTokenDefaults` (the 14-token architecture), the `SyntaxTheme` provider + getter context +
    `useSyntaxTheme`, and the 12 community presets with upstream's `THIRD_PARTY_LICENSES.md`. This
    was **not costed in the batch plan** — the plan listed CodeBlock's deps as satisfied, but its
    `syntaxTheme` prop and `highlight-styles.ts`'s `:root` fallback block both need it. It **replaces
    the `defineSyntaxTheme` identity stub** that sat in `define-theme.ts` behind an incompatible
    `SyntaxThemeConfig`; the neutral theme's `[light, dark]` tuples now resolve to `light-dark()` one
    step earlier, with byte-identical output (theme oracle still 196/196). Also adds the
    `./theme/syntax` subpath export upstream ships

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

- **Batch 8 — the launch set** — `Theme` (+ `ThemeContext`, `theme/types.ts`) and, with it,
  `useTheme` + `theme/tokens.ts`:
  - **Theme** — a `display: contents` wrapper carrying `data-astryx-theme` and a `color-scheme`,
    which is the load-bearing half: every `light-dark()` token resolves against it. The **first**
    `<Theme>` in the tree also mirrors `data-theme` and `data-astryx-theme` onto `<html>`, so
    browser chrome and top-layer content follow the app's mode; nested ones theme their own subtree
    and deliberately do not. Nesting is detected by a module-private marker context **read before it
    is set** — Svelte's context map includes a component's own writes, so presence of `ThemeContext`
    could not serve. Runtime style injection is skipped for a `__built` theme (the flag the theme
    build now stamps) and otherwise writes one `<style>` per theme name, **refcounted** through a
    module-level registry — where upstream keeps a presence `Set`, so its second `<Theme>` on the
    same theme name registers no cleanup and whichever instance unmounts first takes the shared
    stylesheet away from the survivor. Icons register from the **component body** as well as an
    effect: `Icon` resolves against a module-level map, so a registration that happened only in an
    effect would make the server emit the fallback glyph and hydration replace it. 11/11 tests
  - **`useTheme` + `theme/tokens.ts`** — not in the batch plan, and landed because every one of
    upstream's five `Theme` stories is built on it _and_ Phase 5's `TokensDocView` wants live token
    values. `tokens.ts` transcribes upstream's resolver: `light-dark()` splitting, `var()`
    substitution with cycle guarding, and `color-mix(in srgb, …)` evaluated against `utils/color`,
    so a chart gets `#0064E0` rather than `var(--color-accent)`. The hook itself is thin — the mode
    half was already `internal/theme-mode.svelte.ts`, which now reads `ThemeContext` first and only
    subscribes the shared `MutationObserver` on the no-context path (upstream's args-switched
    no-op store). 16/17 tests
  - **`tokenDefaults` lives in `tokens.ts`, not `define-theme.ts`** where upstream declares it.
    Building it means importing `styles/tokens.stylex.ts`, and this package ships `.stylex.js`
    _uncompiled_ — so a plain-Node importer hits a runtime `stylex.defineVars` and throws.
    `define-theme.ts` is on the theme build's plain-Node import path (`build-theme.mjs` →
    `generate-theme-rules.js` → here), and the build **did** break on the first cut. Upstream has no
    such constraint: its published `dist/` is already compiled
  - **`useToast.test.tsx` restored** (4/4), the suite deferred at batch 7 on the unported `<Theme>`
  - **`@astryx-svelte/theme-neutral` now emits `dist/index.js`** — the package's `.` export promised
    a theme object and the build only ever wrote `theme.css`, so
    `import { neutralTheme } from '@astryx-svelte/theme-neutral'` failed. It carries `__built: true`,
    as upstream's `astryx theme build` artifact does
  - **A docs-generator bug fixed on the way in.** `internal/theme-props.ts` publishes a `ThemeProps`
    (the return of `themeProps()`) and `theme.svelte` declares a module-private `ThemeProps` of its
    own — upstream has the identical collision. The props index was keyed by bare name and
    first-wins, so `<Theme>`'s props table silently resolved to `{class: string}` and reported
    `theme`/`mode` as undeclared. Declarations found in a `<name>.svelte.d.ts` now win

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

- **Batch 10 — the nav family, and the end of the hand-built chrome** — `AppShell`, `SideNav` (+
  `SideNavHeading`/`SideNavItem`/`SideNavSection`/`SideNavCollapseButton`), `TopNav` (+ `TopNavHeading`/
  `TopNavItem`/`TopNavMenu`/`TopNavMegaMenu`/`TopNavMegaMenuItem`/`TopNavMegaMenuFeaturedCard`),
  `MobileNav` (+ `MobileNavToggle`), the shared `NavItem/navItemStyles` module, six contexts and one
  internal hook. **Every one of the nine style modules was byte-identical to upstream's compiled
  output on the first or second oracle run, and the batch needed no new skip** — unlike `Icon`,
  `Collapsible` and `TabList`, the published 0.1.7 tarball does not lag source anywhere here.
  - **The responsive story is the whole design, and it is contexts rather than media queries.**
    `AppShell` renders the _same_ nav content in several shapes at once by publishing render-mode
    contexts around it: `SideNavRenderContext` (`default`/`topbar`/`drawer`/`drawer-content`) and
    `TopNavRenderContext` (`default`/`mobile-bar`/`drawer`). With only a `SideNav` it gets a
    `topbar` copy plus a `drawer`; with only a `TopNav`, a `mobile-bar` plus a `drawer`; with
    **both**, `AppShell` hands the SideNav to the TopNav through `TopNavMobileContentContext` so the
    two share **one** drawer instead of opening two overlays. React scopes a context by wrapping a
    subtree; Svelte reads context at _component_ init, so each of those became a tiny internal
    scope component (`side-nav-render-scope`, `top-nav-render-scope`,
    `top-nav-mobile-content-scope`, `top-nav-slot-scope`, `side-nav-collapse-scope`) that renders no
    DOM of its own. That is five new files for what React writes inline, and it is the price of the
    init-time context read — worth stating plainly because it will recur
  - **There is no `<Activity>`, and that is upstream-supported rather than a shortcut.** Upstream
    wraps the mobile drawer in React 19.2's `<Activity mode>` to keep it mounted but hidden, with a
    plain-fragment fallback for 19.0/19.1. Svelte has no counterpart, so this port always takes the
    fallback shape: the drawer stays mounted and `MobileNav`'s own `isOpen` owns visibility.
    `MobileNav`'s teardown-`close()` is kept anyway — it is what stops a drawer unmounted mid-open
    from leaving the browser's top layer occupied
  - **`MobileNav`'s delayed close is dead code on both sides.** The effect teardown runs before the
    re-run, so by the time the `isOpen: false` pass reaches `else if (dialog.open)` the teardown has
    already closed the dialog; and `display` is driven by the `isOpen` prop, so the panel is
    `display: none` before either path runs. The drawer disappears rather than sliding out.
    Replicated, not fixed — see Known debts
  - **`useMenuHover` is a nineteenth hook the plan did not count**, and the pre-flight's
    "cost the whole import list" item caught it: `SideNavHeading`, `TopNavHeading` and `TopNavMenu`
    all need it. It lands in `internal/`, not `hooks/`, because upstream's `hooks/index.ts` does not
    export it and publishing it from our `./hooks` subpath would invent API. Its one real
    translation is upstream's during-render `prevIsOpenRef` comparison, which has no Svelte render
    pass to hang on and folds into a `syncHoverMode()` call at the top of every handler
  - **`SideNav`'s `handleRef` becomes instance exports.** `useImperativeHandle` has no counterpart,
    so `getCollapseState()` and a `collapseHandle` object are reached through `bind:this` and handed
    to a `SideNavCollapseButton` as its `handle` — the `Tokenizer` `focus()`/`blur()` precedent, and
    the `Popover` `anchorRef` one (bind the thing, not a box holding it)
  - **Three new closed-prop-list roots**, all forwarded rather than replicated: `TopNavMenu` and
    `TopNavMegaMenu` (rest → the desktop trigger, which is the element their
    `BaseProps<HTMLButtonElement>` names) and `TopNavMegaMenuItem` and `SideNavItem` (rest → the
    rendered element / the wrapper `<div>`). See Known debts
  - **Six upstream shapes replicated rather than corrected**, each recorded in Known debts: the
    mega-menu trigger's hand-written ARIA with no `aria-controls`; `delay`/`hideDelay`/`onOpenChange`
    being inert in the mega menu's drawer mode; its label-derived `aria-controls` id, which collides
    when two mega menus share a label; `SideNav`'s `stickyBottomCollapsed` border that StyleX drops;
    `SideNavCollapseButton` always being icon-only despite its docs; and `SideNavHeading` **not**
    wrapping its menu in `NavHeadingCloseContext` where `TopNavHeading` does
  - **Five style keys are declared upstream and applied nowhere** (`TopNavHeading.popover`,
    `SideNav.footerIcons`/`footerIconsCollapsed`, `SideNavHeading.interactiveCollapsed`,
    `SideNavItem.children`) and one has zero call sites at all (`AppShell.hidden`). StyleX drops
    unreferenced keys, so the first five are ported for shape parity and left uncompared — no skip
    needed, which is the reverse of the `Collapsible` case. `AppShell.hidden` is omitted outright
  - **Two oracle collapses worth knowing for next time.** The extractor keys inline strings by
    _content_, so two keys that resolve to the same atomic class set share one entry:
    `TopNavMegaMenuItem`'s `drawerItemDescription` (same four properties as `desktopDescription`,
    different order) and `SideNavHeading`'s `headingCompact` (sets only a `fontWeight` that `heading`
    already sets, so `[heading, headingCompact]` _is_ `heading`). Declaring a second entry fails with
    "upstream has no matching call site", which reads like a mismatch and is not one
  - **The docs shell now runs on all four.** `+layout.svelte` is an `AppShell` with
    `height="auto"` (the page must own the scroll, or `Outline`'s scroll-spy and hash landing both
    break silently) and a **route-gated** `sideNav`, because `AppShell` treats any snippet as "a
    sidenav exists" — handing it one that renders nothing would put an empty panel on the home page
    and offer a drawer with nothing in it. `docs-shell.svelte` is now a pass-through; the two-column
    grid, the sticky sidebar and the divider all come from `AppShell`. Three files that hardcoded a
    `56px` header now read `var(--appshell-header-height, 56px)`, which `AppShell` measures with a
    `ResizeObserver` — retiring a stand-in those files documented. Verified in real Chromium at 1280
    and 700px across nine routes: shell present, header measured at 49px (an effect ran, so
    hydration is proven rather than assumed), side panel inline above the breakpoint and absent
    below it, the hamburger present below it, the drawer opening with all 19 sidebar rows inside,
    the sidebar filter live (178 rows → 6), and **zero console errors or hydration warnings**
  - **`NavHeadingCloseContext` is scoped to exactly the subtrees upstream scopes it to**, which
    needed a sixth scope component (`nav-menu/nav-heading-close-scope.svelte`). Setting it at
    component init would have been the obvious translation and is wrong: upstream wraps
    `SideNavHeading`'s **collapsed** menu only — its three expanded branches render `{menu}` bare —
    and both of `TopNavHeading`'s popover menus, but never the `logo`/`headerEndContent` slots. For
    a context whose entire payload is "dismiss the popover you are inside", handing it to a subtree
    that is not inside one is a defect rather than harmless generosity. Found by the `SideNav` test
    port, which noticed the collapsed branch had lost it — the audit catching a gap in a component
    the same batch wrote
  - **`SideNav` exposes one imperative handle, not two.** An earlier cut exported both
    `getCollapseState()` _and_ a `collapseHandle` object; the second was invented surface, because a
    component instance reached through `bind:this` already satisfies
    `SideNavImperativeCollapseHandle` structurally. Upstream has one handle
    (`useImperativeHandle(handleRef, …)`), so `<SideNavCollapseButton handle={sideNav} />` takes the
    instance directly
  - **The batch-close audits found five defects in components this same batch wrote**, which is
    the case for running them: `SideNavItem`'s tooltip anchor seeded `undefined` instead of `null`
    (so the server and the first client pass took `Tooltip`'s _wrapper_ branch, emitted a stray
    `display:contents` div and then tore the whole subtree down on mount); `MobileNav`'s and
    `SideNavCollapseButton`'s consumer-handler composition dropping the `defaultPrevented` gate that
    `composeEventHandlers` exists for, so a caller's `preventDefault()` no longer vetoed
    backdrop-dismiss or collapse; `SideNavItem`'s collapsed-visibility guard reading `displayIcon`
    where upstream reads the raw `icon`; and `MobileNav`'s `headerNoTitle` testing `header != null`
    where upstream tests falsiness. All four fixed. **Two independent audits found the `icon`/
    `displayIcon` one from opposite directions** — parity by reading upstream, idiom by reasoning
    about the branch — which is the argument for running both rather than picking one
  - **`--appshell-header-height` is written through the `style` attribute Svelte owns, not with
    `element.style.setProperty`.** Upstream writes it imperatively because React has no other
    option; doing that here would put a custom property on an element whose `style` Svelte assigns
    via `cssText`, which wipes anything written behind its back. That is the hazard `useLayer` needs
    a `MutationObserver` to repair for `anchor-name`, and the one
    `src/tests/layer-attribute-repair.svelte.test.ts` exists for. It was **latent, not live** — the
    root's `sx()` output is static, so the attribute never changed — and would have gone live the
    first time a consumer passed a changing `style`/`xstyle` to an `auto`-height shell, dropping the
    sticky sidenav behind the header with no observer event to repair it. Routing the value through
    the same attribute Svelte already manages removes the hazard rather than policing it
  - **`Layout`'s `start` slot is passed `undefined`, not an empty snippet.** Found by the
    `AppShell` test port rather than by a failing case: `Layout` publishes `hasStart` from the
    slot's _presence_, so handing it a snippet that renders nothing would read as "there is a start
    panel". Upstream's `start={sideNavContent}` is `undefined` in that situation, and now so is
    ours. Unobservable today — `layoutContentAttrs` consults `hasStart` only when `padding == null`
    and `AppShell` always passes `padding={contentPadding ?? 0}` — but it is the same
    "a renderable that renders nothing still counts" hazard `AppShellProps.sideNav` documents, and
    it is the reason the route-gating in the docs layout matters too
  - **The `TopNav` family's three upstream suites are ported case-for-case, nothing dropped** —
    `src/tests/top-nav.svelte.test.ts` (43/43 across six describes, including upstream's second
    `NavIcon` describe, which duplicates `NavIcon.test.tsx` and is kept because the count of _that_
    suite is the contract), `src/tests/top-nav-menu.svelte.test.ts` (**12/12** at v0.4.1) and
    `src/tests/top-nav-mega-menu.svelte.test.ts` (**37/37** at v0.4.1). All client (Chromium).
    Both of those counts were header rot caught at the 0.4.1 bump and are recorded in the files
    themselves: the menu suite claimed "all 4, nothing dropped" against a suite that had **12 at
    every tag from v0.2.0** — the 8 unported ones were the two APG describes (`menu semantics`,
    `keyboard navigation`), now in; and the mega-menu suite closed at 21 for v0.3.0 before #4555
    added **16 more** (nine `hover/click guard`, three `dismissal`, four `keyboard`). Five new
    fixtures
    carry the slot content upstream writes inline as JSX, and `mode` on each of them stands in for
    `<TopNavRenderContext value=…>` by wrapping the subject in the internal `TopNavRenderScope` —
    React scopes a context with an element, Svelte needs a component boundary. Four `forwards ref
correctly` cases are **attachment counterparts** (no `ref` prop here; the assertion reads the
    element received, which is stricter than upstream's "some HTMLElement"), and one case is
    **restated**: `returns null in mobile-bar mode` cannot compare `container.innerHTML` to `''`
    because Svelte leaves `{#if}` anchor comments, so it asserts no element and no text instead. The
    rest-forwarding divergence the port introduces on `TopNavMenu`/`TopNavMegaMenu`/
    `TopNavMegaMenuItem` touches no case — none of the three suites asserts a prop is absent
  - **`SideNav.test.tsx` is ported case-for-case, nothing dropped** —
    `src/tests/side-nav.svelte.test.ts` (94/94 across its twelve describes), client (Chromium),
    on seven new fixtures. Three of the twelve blocks _need_ the real browser: a closed
    `[popover]` being `display: none` is what makes upstream's `getByRole('button')` single-match
    with a second button sitting inside the popover, so faking it would substitute a model of the
    thing under test. Three cases are **counterparts** — `forwards ref correctly` (an attachment in
    the rest props, which also names the tag, where upstream only proves a callback ran) and the two
    `handleRef` cases (a stable delegating box in the fixture standing in for `useRef`, feeding
    `SideNav`'s `getCollapseState()` instance export to `SideNavCollapseButton`'s `handle`). Two are
    **restated**: `returns null when collapsed without icon` (Svelte's `{#if}` anchor comments, same
    as `TopNav`'s) and the second assertion of `hides items without icons when collapsed`, which
    upstream writes against `[data-xds="side-nav-item"]` — an attribute `themeProps` has not emitted
    since the XDS → Astryx rename, so it is vacuously true there; restated against the class it does
    mint. One translation is worth knowing for the next suite: Testing Library matches a _string_
    `name` against the whole accessible name and a Playwright locator matches a substring, so the two
    split-action cases pass `exact: true` to keep upstream's semantics rather than change the
    assertion. The rest-forwarding divergence on `SideNavItem` touches no case

- **Batch 11 — `Markdown`, and the `Table` core it turned out to require** — `Markdown` (+ `parser`,
  `streaming`, the render plan and `markdown-types`), `Table` + `BaseTable` + `TableRow`/`TableCell`/
  `TableHeaderCell`/`TableHeader`/`TableBody`/`TableFooter` + the scroll wrapper + the context menu +
  the plugin pipeline + `columnUtils` + `useBaseTablePlugins`, `useStreamingText`, and the two
  `Outline` markdown helpers batch 9 deferred. Nine style modules, **all byte-identical on the first
  or second oracle run, with no new skip**.
  - **The batch doubled before a line was written, and the pre-flight is why.** `Markdown.tsx`
    imports the whole `Table` family to render a GFM table, and `useStreamingText` on top. Costing
    the _import list_ rather than the component directory is the check that caught it — for the
    third time, after `CodeBlock`/`theme/syntax` and `useMenuHover`. What made it tractable is that
    Table's eleven plugin directories publish 18 standalone hook/helper values: `use*` functions returning a
    `TablePlugin`, handed in through a public `plugins` prop the core implements in full. So the
    core could land alone with a seam that is real rather than convenient — and the evidence is that
    upstream's own `Table.stories.tsx`, `Table.test.tsx` and `tableContextMenu.test.tsx` import no
    `useTable*` hook at all, so 24 stories and 122 cases port with nothing deferred
  - **The one structural translation in `Markdown` is the cursor.** Upstream threads a _mutable_
    `StreamingCursor` through `renderInline`/`renderBlock`, incrementing it as each node becomes an
    element, and assigns citation numbers the same way — both work because React renders a tree in
    one synchronous pass. Svelte has none: snippets are evaluated lazily and independently, and a
    `$derived` may re-run on its own schedule, so a cursor mutated from markup would hand a node a
    different offset on a re-render than it had on the first and the fade spans would jump. The walk
    therefore runs **once, before rendering**, in exactly upstream's traversal order, and records
    what each node needs (`markdown-render-plan.ts`); the template reads the plan. Same move
    `CodeBlock` made for `renderLines`/`buildSpanLine` — a node-returning helper becomes a
    data-returning one
  - **`renderInline`/`renderBlock` are self-referencing snippets**, the `TreeList` precedent, and the
    parser itself is a pure transcription — 1,776 lines with no React in them, and all 177 of its
    upstream cases pass against it unchanged
  - **`Markdown.children` is a `string` prop, not component content.** Upstream types it `children:
string` — it is the markdown _source_. Svelte turns anything between the tags into a snippet,
    whose text a parser cannot read, so consumers write `<Markdown children={md} />`. That keeps
    upstream's prop name and type exactly; it is the one place in this port where `children` is not
    a snippet, and it is worth knowing before writing a call site
  - **A real defect, found by the `Table` test port and fixed.** `BaseTable` destructured
    `data-testid` out of its props and re-emitted it by name _after_ both spreads — the plugin
    pipeline's `htmlProps` and then `rest`. With no consumer value that wrote
    `data-testid={undefined}`, **deleting an attribute a plugin's `transformTable` had just set**.
    It was the only `htmlProps` key `BaseTable` named, so it was the only one a plugin could not
    set, and three cases failed on exactly that. Upstream has no such hole: it never destructures
    the key, so it rides `{...rest}`. Now so does ours. The general shape is worth carrying forward
    — _a named attribute after a spread is an unconditional write, including of `undefined`_ — and
    the batch-close parity audit immediately found a **second instance of it** in the same file:
    `title={cell.title}` on the header cell, where upstream spreads a `headerTitleProp` that is `{}`
    unless the resolved content is a non-empty string, precisely so a plugin's `title` survives. Also
    fixed. Two independent discoveries of one shape in one component is the argument for running the
    audits even when the suites are green
  - **Four more findings came out of the batch-close audits, all fixed**, and they are the case for
    running all four rather than picking one. Parity found `Markdown` spreading `{...rest}` _after_
    `role="document"`, so a caller could replace a semantic the component owns (the `Dialog`
    role-clobber shape again), and `TableHeaderCellProps` publishing `colspan`/`rowspan`/`abbr` that
    upstream does not declare. Idiom found the empty-stream branch dropping upstream's incremental
    cache reset, and `boundaries` reading `smoothed.current.length` inline — which made it depend on
    everything the _text_ does rather than on the length, pushing a zero-width ring-buffer entry per
    chunk and evicting a live fade span a tick early. Surface found the Table context published
    **backwards**: `useTableContext` on the barrel and `TableContext` off it, where upstream does the
    exact opposite
  - **What the idiom audit cleared is worth recording too**, because it is the part of this batch I
    was least sure of. The `boundaries`/`prevRenderedLen` pair is correct, and for a reason worth
    keeping: `$effect.pre` and template render effects run during the flush traversal, user
    `$effect`s drain _after_ it — so `boundaries`, read only from the template, always sees the
    previous render's length, which is exactly what upstream's memo sees in `prevBlocksRef`. Using
    `$effect.pre` for the write-back would be a real bug: every fade span would be zero-width and the
    streaming animation would silently vanish. A plain `let` is also the only correct box — writing
    `$state` from inside `$derived.by` throws `state_unsafe_mutation`
  - **`TableRow` composes a consumer's `class` where upstream drops it.** Upstream spreads
    `{...props}` before `mergeProps(…)`, whose merged `className` never saw the caller's and
    overwrites it — `TableCell` and `TableHeaderCell` thread theirs through explicitly, so the
    asymmetry is a slip rather than a design. Fixed here on the `Dialog` `role`-clobber precedent: a
    component that silently discards a caller's prop is corrected, where a component's own
    _behaviour_ would be replicated
  - **`transformTableContext` returns a component, not a function of children.** Upstream's plugin
    hook takes the rendered tree and wraps it (`(children: ReactNode) => ReactNode`). Svelte reads
    context at component _init_, so a provider cannot wrap an already-rendered subtree; the plugin
    hands back the component to wrap in and `BaseTable` renders the chain recursively, first plugin
    outermost as upstream's reverse iteration produces. Same shape as batch 10's scope components.
    For the same reason, plugin render-props carry `children: Snippet`, and a plugin reaching a DOM
    node uses an attachment under a `createAttachmentKey()` symbol in `htmlProps` rather than a
    `ref` — which also means plugins never have to _merge_ each other's the way upstream's
    ref-composition does
  - **No `MemoizedTableRow`, and no `areArraysShallowEqual`.** Both exist upstream to stop a data
    change re-rendering every row; a keyed `{#each}` plus fine-grained reactivity is that
    optimisation. This is also why upstream's eleven `Table.perf.test.tsx` cases have no
    counterpart: five count `renderCell` invocations across a state change, which measures
    `React.memo`, and `renderCell` is a `Snippet` whose body re-runs on value change rather than on
    parent render (three more count only the _parent's_ React renders, and three are wall-clock)
  - **`useStreamingText` closed the last Phase 1 hook debt.** Upstream's during-render
    `prevTargetLen`/`prevIsStreaming` comparisons have no Svelte counterpart (the `useMenuHover`
    problem) and become one `$effect.pre`, which keeps the timing: it does not run during SSR —
    where upstream's first render also makes no state change, both refs being seeded to match — and
    on the client it runs before the DOM write. Its `displayedLen` is one `$state`, not the
    state/ref pair upstream needs, because Svelte tracks dependencies during _synchronous_ effect
    execution only and the rAF callback's read is therefore already untracked
  - **`parseOutlineFromMarkdown` + `useOutlineFromMarkdown` landed**, retiring the batch-9 deferral
    and its three `Outline` cases. `useOutlineFromMarkdown` is a one-line `useMemo` upstream and a
    one-line `$derived` here — the memo is the point, since the parse is not cheap and `Outline`
    re-renders on every scroll tick
  - **The demo route gains two sections**: `Table` (all 24 of upstream's stories, none needing a
    plugin) and `Markdown` (all 15 across `Markdown.stories.tsx` and `MarkdownCitations.stories.tsx`),
    and `Outline` goes to **7 of 7** with `ExtractFromMarkdown` restored. That story's heading ids
    come from `useOutlineFromMarkdown` and are stamped onto the rendered headings, because upstream's
    `components.heading` override derives them from the heading's own _text_ and a snippet's text
    cannot be read — which is upstream's own docsite pattern (`PackageStubPage`), not an invention
  - **Two column-array call sites need `$derived.by`**, and the reason will recur: `TableColumn`'s
    `renderCell` and `MarkdownInlinePlugin`'s `render` are snippets, and a template snippet does not
    exist while the `<script>` runs — a plain `const columns = [...]` referencing one hits its
    temporal dead zone. Deferring the array to first read, which is inside the render, is the fix
- **Batch 12 — the date/time family** — `Calendar` (+ its private `MonthGrid`/`DayCell`, the three
  published hooks `useCalendarDays`/`useCalendarConstraints`/`useCalendarNavigation`, `dayCellUtils`
  and the `utils` alias shim), `TimeInput`, `DateInput`, `DateTimeInput`, `DateRangeInput`. Five
  style modules, **all byte-identical with no new skip** — the second batch running to zero
  deferrals. Every date primitive they need (`plainDate`, `dateTypes`, `dateParser`, `timeParser`)
  was already ported, so the whole batch was component work.
  - **`Calendar` publishes a hook it does not use.** `useCalendarNavigation` is on
    `Calendar/index.ts` "for advanced usage" while `Calendar.tsx` inlines its own near-copy. It is
    ported as its own module: the barrel is the contract, and a consumer who imports it gets what
    upstream's does. The two copies differ in exactly two ways, both recorded in its docstring.
  - **The imperative handle is an instance export.** `handleRef?: React.Ref<CalendarHandle>` is not
    a DOM ref, so the "`ref` props are omitted" rule did not decide it; `Tokenizer` and `SideNav`
    had already settled the shape, so `navigateTo` is an instance export and `bind:this` is the
    seam. `DateInput` and `DateTimeInput` are both internal consumers and both use it.
  - **Two `useMemo`s that had to stay `$state`, not `$derived`.** `Calendar`'s `internalFocusDate`
    and its `today` are seeded _once_ — upstream's lazy `useState` initialiser and `useMemo(…, [])`
    respectively — and deriving either would have made the visible month follow a later
    `defaultValue`/`initialValue` change that upstream ignores. The same shape appears in
    `useCalendarNavigation`.
  - **Two components reconcile a pending buffer against the value prop.** `DateInput` and
    `DateTimeInput` clear half-typed text when `value` changes _externally_ but not when the change
    is one they caused. Upstream does it during render with two refs, explicitly "to avoid an extra
    render cycle"; here it is an `$effect.pre` whose body is `untrack`ed, because the buffer is both
    read and written inside it and tracking it would make the effect depend on its own write.
  - **One `useGridFocus` per month pane, not per calendar.** With `numberOfMonths={2}` there are two
    `role="grid"` elements, each with its own hook and its own seeded roving tab stop. A single
    shared grid would be tidier and would be a different component.
  - **`useGridFocus` exposes no container getter**, so the pending-focus pass (which queries the
    grid for `button[data-date]` after a month change) needs its own `bind:this` alongside the
    attachment. Worth noting for the next consumer that needs to read the container.
- **PowerSearch** (batch 14) — the component, `PowerSearchToken`, `PowerSearchFilterEditor`,
  `resolveOperatorLabel`, `createPowerSearchConfig`/`usePowerSearchConfig`, and the module-private
  `useInternalConfig`, `usePowerSearchSource`, `formatFilterValue`, `PowerSearchValueEditor` and
  `PowerSearchEditPopover`. 22 files. Six things it settled that are worth carrying:
  - **`PowerSearch` renders neither of the two components upstream's own docstrings call "the
    built-in implementation used by PowerSearch".** It imports `PowerSearchToken` nowhere and calls
    `PowerSearchEditPopover` directly, never `PowerSearchFilterEditor`. The inlined token renderer
    is a _different_ one: different truncator (`> limit + 3` → slice to `limit` + `'...'`, against
    `formatFilterValue`'s `> maxLength` → slice to `maxLength - 1` + `…`), overflow decided on the
    **sum of item lengths** rather than the joined length, no `Intl.NumberFormat`, no `timezoneID`,
    and `N items` / `date range` / `1 filter` hard-coded in English where the other reaches for
    `t()`. Both are transcribed at their own call sites; unifying them would have been a fix. See
    Known debts.
  - **Its 12 value editors are 12 sibling `.svelte` files**, the `LinkProvider/RouterLink`
    precedent. TODO.md used to say PowerSearch "type-dispatches into 15 components"; the real
    figures, re-derived twice, are **14 arms, 12 editors, 7 distinct astryx components**.
  - **`usePowerSearchConfig` takes getters and returns getters**, so its result must not be
    destructured — the `useTheme()` hazard. `createPowerSearchConfig` is the plain-args escape
    hatch, and it is published upstream for exactly that reason, so the port did not have to invent
    one. Every call site in the repo obeys it (verified by the idiom audit, not assumed).
  - **The nested-group editor is the batch's only genuinely new mechanism-use**: a `TreeList` whose
    per-node `label`/`endContent` travel through `createSlotBinder`, keyed by node path. Driven in a
    real browser — Add filter 4→5 rows, Remove filter 5→4 — because the keying rule
    (`bind-snippet.ts`'s "`get`'s body must itself perform a reactive read") has already cost this
    repo four bugs.
  - **The published-props-type convention has two principled exceptions**, and they are here:
    `PowerSearchToken` and `PowerSearchFilterEditor` declare no `<script module>` block, because
    neither has a props type of its own on _either_ side — both take theirs from `types.ts`, which
    is where the barrel publishes it. Re-exporting would give one type two declaration sites, and
    `no-import-assign` flags the attempt.
  - **`PowerSearch` is a new closed-prop-list root that _replicates_ rather than forwards** — see
    Known debts, where `Slider` and `Token` were until now the only two.
- **Chat** (batch 16) — the last unported upstream dir and the largest: 25 source units behind 16
  published components and 7 published hooks, plus `TriggerMenuLayer` and `ChatToolCallRow`, which
  are public on neither side. Seven things it settled:
  - **`createPortal` becomes a moved node, and this is the port's only encounter with either.**
    `useChatComposerTokens` creates token spans imperatively — a `Range` decides where each goes —
    so no framework owns them declaratively. `mount()` is _not_ the substitute: it starts a separate
    component tree, so context stops reaching the content and `ChatPastedTextToken`'s
    `useTranslator()` would silently fall back to the shipped catalog. Each portal instead renders a
    `display: contents` span inside the component's own tree, and an attachment moves that span into
    the token span. One element upstream does not have, generating no box.
  - **A hook that returns markup splits, but publishes nothing new.** `useTriggerMenu`'s
    `renderMenu()` becomes `<TriggerMenuLayer>`, the `useLightbox`/`useImperativeDialog` shape —
    except the hook is module-private upstream, so unlike `ImperativeDialogLayer` this introduces no
    public name. Its running `flatIndex` becomes a per-group offset computed in a `$derived`,
    because a Svelte `{#each}` body is not a sequential pass and those indices are the
    `aria-activedescendant` targets.
  - **`attachTrigger` used imperatively must have its cleanup held.** Upstream's `layer.ref` is a
    ref callback that strips the previous element's anchor name when called with a new one; an
    attachment puts that in its cleanup instead. Discarding the return would leave every
    caret-anchor span the menu has ever created still named.
  - **Two components' `children` are optional where upstream's are `ReactNode`.**
    `ChatMessageList` and `ChatLayout` both reach a documented, _tested_ empty state by being passed
    `[]` — content that is present and renders nothing. A `Snippet` cannot be that. Omitting the
    prop is the nearest Svelte gets, and a required prop would put the empty state out of reach of
    the published type.
  - **`useChatDictation` keeps upstream's duplicated analyser and audio-context singleton**, and the
    duplication is observable rather than cosmetic: its `getDefaultAudioContext` closes over its
    _own_ `_sharedAudioCtx`, so a consumer who passes no `audioContext` ends up with two of them and
    two microphone streams. Importing `use-speech-recognition`'s copy would quietly merge them,
    which is a change, not a fix.
  - **The class oracle grew two capabilities.** `extractGroups` now requires `$$css: true`, because
    `ChatMessageMetadata`'s `STATUS_CONFIG` is the first non-style lookup table upstream declares
    beside its styles and it would otherwise read as five missing styles; and `inline` combinations
    accept a `stylex.defaultMarker()` pseudo-key, because `ChatComposerDrawer`'s toggle row is the
    first folded call site that includes a marker and a marker has no `create` key to name.
  - **Real Chromium is not jsdom, and three test translations follow from it.** Geometry has to be
    _real_ rather than defined onto the element (a browser clamps a `scrollTop` write on something
    that does not overflow); `ChatLayout`'s first-fill pair runs through its external `scrollRef`
    mode, because the self-scrolling root's `min-height: 100%` message area overflows by a fixed
    ~98px at mount and consumes the pending first fill before the case can; and `act()` becomes
    `flushSync` wherever a `$state` write must land in the DOM before the next assertion.
  - **`$state` deep-proxies, so a React `useState` object cannot hold anything compared by
    identity.** `useTriggerMenu` keeps its six fields in one `useState` and asks
    `state.activeTrigger !== trigger` to decide "new trigger" versus "same trigger, new query". Held
    in a single `$state` object, `state.activeTrigger` is a _proxy_ of the caller's trigger and is
    never `===` it, so the guard always reported "new": the open popover re-anchored to the caret on
    every keystroke and visibly walked right one character at a time, the highlight reset mid-debounce,
    and `searchSource.search()` ran on unchanged queries. The proxy also leaked outward — `onSelect`
    received a proxy of the consumer's own item, so `items.indexOf(item)` in caller code missed. Fixed
    by splitting the object into one rune per field, with `$state.raw` for `activeTrigger` and `items`
    (both are replaced wholesale, never mutated), behind a getter/setter facade that keeps the
    published `TriggerMenuState` shape and every internal `state.x = y` site unchanged. **The 44-case
    `ChatComposerInput` suite passed throughout** — no upstream case types a _second_ character into an
    open menu, which is the only thing that exposes it.
  - **A React dependency array is a `$derived`, not a destructure.** `useChatStreamScroll` took its
    six scalars by destructuring, freezing them at mount, so `enabled={!isSelecting}` could never turn
    auto-scroll off — upstream re-runs the listener effect on `[scrollRef, enabled, lockThreshold,
buttonThreshold]` and rebuilds `animate` on `[scrollRef, damping, stiffness, mass]`. Each is now a
    `$derived` off the options object, which leaves every call site untouched, costs a plain-value
    caller nothing, and lets a getter track. `useTriggerMenu`'s `debounceMs` and
    `useChatPasteAsToken`'s `threshold`/`toToken` had the same freeze and are now read at point of
    use; the composer input was already handing `debounceMs` over as a getter that nothing read.
  - **An always-present snippet is not an absent one.** `ChatLayoutScrollButton` passed
    `{#if label}{label}{/if}` as `Button`'s children, and a snippet is present whether or not it
    renders anything — so `Button`'s `children != null` was always true and the label-less button
    emitted an empty span where upstream's `{label ?? undefined}` falls through to the fallback text.
    Now `children={label ? labelText : undefined}`.

---

## Batch 17b — the status-variant family

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

## Batch 17b — the singles

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

## Batch 17b — `computeOverflow` and OverflowList's bounds

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

## Batch 17b — the menu family: `BreadcrumbItem.menu`, the selectable trio, `DropdownMenuSubMenu`

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

## Batch 17a — the 0.2.0 class re-baseline

The class oracle went **81 → 3** and the theme oracle to **0 across all five themes**. Most of it
was mechanical once each mismatch was traced back to upstream's _source_ rather than read off the
atomic-class hashes; four things needed a decision.

**`AvatarStatusDot`'s shape glyph.** 0.2.0 pairs every variant with a distinct shape — filled dot,
ring, minus bar — so status is not conveyed by colour alone (WCAG 1.4.1). Two details are
load-bearing and neither is visible in the class diff:

- **Each variant now sets the ink colour as well as the plate.** The glyph and any user `icon` both
  paint from `currentColor`, so a variant that set only `background-color` would leave them free to
  drift out of contrast. `neutral` _inverts_ — surface plate, secondary stroke — because a hollow
  ring only reads as hollow when its interior is not the variant colour. The old `styles.icon`
  hard-coded `color: --color-background-surface`; that had to go, or it would have overridden the
  variant ink on exactly the variant that inverts.
- **The glyph is a stroked inline SVG, not a CSS box.** Stroking buys sub-pixel control and round
  caps, which is what keeps the mark intentional on the 10px dot where a box cutout can only land on
  whole pixels. `viewBox` is one user unit per px of the dot's _inner field_ (dot minus both
  borders), so every coordinate in the markup is literal px.

A rendered `icon` suppresses the glyph: both are non-colour marks, and overlaying two cutouts in a
10–32px field makes each illegible. Upstream expresses that as `isRenderable(icon)`; a Svelte
`Snippet` is either passed or not, so `icon !== undefined` is the whole test.

**`CodeBlock`'s chevron became a leading disclosure.** It moved from trailing `chevronDown`
(rotate 180° when collapsed) to leading `chevronRight` (rotate 90° when **expanded**), matching
TreeList and Table. The `collapseChevronCollapsed` key is `collapseChevronExpanded` upstream and the
predicate inverts with it — renaming without flipping the condition compiles and looks right in the
collapsed state only. The header's `gap` was dropped in the same change: spacing now comes from the
chevron's own `margin-inline-end`, which the new `chevronReveal` keyframes animate from zero so the
title slides rather than snaps when the control appears.

**Three oracle cases moved from inline to object mode.** `TypeaheadItem`, `SideNavItem` and
`FieldLabel` each took `xstyle` on their `stylex.props` call at 0.2.0. That makes the call dynamic,
so the compiler stops folding it to a literal class string and emits a style object instead — the
oracle then reports _"upstream has no matching call site"_ even though our classes are byte-identical
to the object it did emit. Worth knowing the two failures look nothing alike: a value mismatch prints
both class strings, this prints ours against an unrelated list. Object mode compares upstream's keys,
so it cannot catch a property we declare and upstream does not; that is why `SideNav`'s extra
`border-block-start` had to be fixed in source rather than mode-switched away.

**Three skips, one cause, and it runs the opposite way to the usual one.** Where a `stylex.keyframes`
body translates along the _inline_ axis, the build behind `@astryxdesign/core@0.2.0`'s `dist/` also
emitted a mirrored RTL keyframe plus a second `animation-name` class to select it under
`:is([dir="rtl"] *)`. Our `@stylexjs/babel-plugin@0.19.0` — the version upstream's own repo pins —
emits only the LTR keyframe from byte-identical source. `genConditionalClasses`,
`enableLegacyValueFlipping` and both `styleResolution` modes were tried; none changes it. So the
tarball _leads_ our compiler instead of lagging it, and the standing "follow the source" rule has
nothing to follow. `progress-bar.indeterminateFill` and `layerAnimations.start`/`.end` carry the
skip; `below`/`above` translate on the block axis and are unaffected.

**The theme fix was a cascade bug, not a missing token.** Eleven `.astryx-text.<size>` rules read as
a diff count, but `size` is documented as a font-size override that beats the size implied by
`type` — and its StyleX class lives in `@layer astryx-base` while a theme's per-type rule lives in
the higher `@layer astryx-theme`. Any theme that styled a type silently shadowed `size` for it.
Re-emitting the size classes from the theme generator, at the same specificity and later in source,
is what makes the prop work at all.

---

## Batch 17b — the tail: Outline's navigation props, `hasExpandAllControl`, `useTableRowStatus`, the link seam

The five slices that closed workstreams B and D. Grouped by what each actually taught.

### `Outline` — four props that are one behavioural unit

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

### `useTableTreeData.hasExpandAllControl` — found by a docs block, not by a check

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

### `useTableRowStatus` — the smallest plugin, and the oracle's blind spot in miniature

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

### `Avatar.as` / `Button.as` — the prop was trivial; the seam behind it was not

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

## Batch 17c — the a11y batch

Upstream's `Fixes` sections across 0.1.8/0.1.9/0.2.0 are where most of this batch lives, and the
shape of the work differs from 17a's mechanical migration and 17b's new surface: almost every unit
is a _correction to something already ported_, so the diff is small and the reasoning is where the
value is. The units below are the ones whose translation needed a decision.

### The shared foundations, and why they went first

`base.css` lost its `@media (hover: none) and (pointer: coarse) { :where(:focus-visible) { outline:
none } }` block. The comment it carried was internally consistent — "no hover + coarse pointer means
no keyboard, so a focus ring is noise" — and simply false: an iPad with a Bluetooth keyboard, or a
switch-control user, matches that query exactly and is the population WCAG 2.4.7 exists for.
Upstream deleted the block and added `reset.test.ts` to keep it deleted; this port owns `base.css`
in full, so the same assertions came across as `base-css.test.ts`.

**That port needed one restatement, and it reads as a property of this repo rather than a detail.**
Upstream's case filters for `:focus-visible` rule blocks and asserts on each with `expect.soft`.
With the block gone there are no matching rules, so the loop body never runs and the case makes _no
assertion at all_ — which vitest reports as a pass upstream and as a failure here, because
`packages/core/vite.config.ts` sets `expect: {requireAssertions: true}` and upstream does not. The
case now collects the offending selectors and asserts the list is empty: same meaning, same
diagnosis in the failure message, and it cannot go vacuous if the last `:focus-visible` rule is ever
deleted. **The config difference is an asset — it finds dead tests, not just wrong ones.**

`useFocusTrap`'s Escape stack changed from "last pushed wins" to "deepest by DOM containment, push
order as tiebreaker". Upstream's stated reason is React's commit order: child effects run before
parent effects, so an outer and an inner trap mounting in the same commit push inner-first and a
pure last-pushed comparison hands Escape to the _outer_ one. **Svelte has the same ordering, so the
hazard ports directly** — and the fixture proves it, because it really nests one trap inside the
other's subtree rather than calling `render` twice. The two cases now split by what they assert:
unrelated traps still test the tiebreaker with two `render` calls, DOM-nested traps test containment
with the nesting fixture.

### `FileInput` — the nested-interactive fix is a restructure, not an attribute change

The trigger was a `role="button"` wrapper that _contained_ the clear and status buttons, which is a
WCAG 4.1.2 violation (interactive inside interactive) no attribute can fix. Upstream's resolution
inverts the structure: the container becomes non-interactive and carries only the surface click
(through `useClickableContainer`, which already ignores clicks landing on nested controls) plus the
drag-and-drop handlers, while a **visually hidden real `<button>`** takes the role, the accessible
name and every describing attribute — as a _sibling_ of the clear/status controls.

Three consequences that are easy to miss:

- **`aria-required` had to go, and its replacement is a description.** It is unsupported on
  `role="button"`, which is why upstream replaced it with a visually hidden "Required" node
  referenced from `aria-describedby` — the same shape `Slider` uses for the same reason.
  `aria-invalid` stays on the button despite being equally unsupported; that is upstream's call and
  its cases pin it, so it is replicated with a lint suppression naming why.
- **The disabled-reason tooltip had to move to the container.** The trigger is now a 1px box, so
  anchoring there put the tooltip nowhere. `focusin` bubbles from the button, so keyboard focus
  still opens it.
- **This port was rendering a duplicate live region.** `FileInput` had its own `role="status"`
  element for validation errors _and_ the `FieldStatus` persistent region from 17b announcing the
  same thing — which is exactly the "announce validation errors exactly once" the changelog names.
  Upstream deleted its local region; so did this port, along with the now-dead `liveRegionID` and
  `fileInputLiveRegionAttrs`.

### The nav family — four components, one anti-pattern

`TopNavMenu`, `TopNavMegaMenu`, `SideNavHeading` and `TopNavHeading` all wrapped their popups in a
`role="dialog" aria-modal="true"` layer. For a menu or a grid of links that announces "dialog,
Navigation menu" around content that already has its own role, and it makes the trigger claim
`aria-haspopup="dialog"`. All four now pass `role: 'none'` to `usePopover`, so the popup's own
`role="menu"` — or `role="group"` for the mega menu, since the APG names link mega-menus as the
documented anti-case for `menu` — is the exposed semantics.

Two second-order fixes came with it. The **menu role is rescoped** in both heading components: it
used to sit on the container holding the heading-replica button _and_ the items, making that button
an invalid child of a `role="menu"`; it now wraps the items only, with the button as a sibling. And
`TopNavMenu` gained the **full APG composite-menu pattern** — `useListFocus` with roving tabindex,
first-character typeahead, and Enter/Space activation for the `<div role="menuitem">` rows that have
no native activation. That composition already existed in `NavHeadingMenu`, which is what upstream's
own comment says its version mirrors, so the port is a transcription of a shape this repo had.

**The `aria-haspopup` value change is what the suite noticed**: `"dialog"` becomes `"true"`, the
ARIA synonym for a menu popup.

### `Slider` — five fixes that are one story about naming a non-labelable element

The thumb is a `div[role="slider"]`, which a `<label htmlFor>` cannot name — only form-associated
elements are labelable. So the label became a **group label** (`FieldLabel`'s `isGroupLabel`, wired
by `aria-labelledby`), the single thumb references it directly, and in range mode a `role="group"`
container references it while each thumb keeps its own short `"Minimum value"`/`"Maximum value"`
name that composes with it. `aria-required` is invalid on the slider role for the same class of
reason, so required routes through a visually hidden description.

The other two are arithmetic. **ARIA bounds now agree with the movement clamping** — a range thumb
cannot cross its sibling minus the `minStepsBetweenThumbs` gap, and reporting the raw `[min, max]`
on both thumbs told assistive tech about travel the pointer and keyboard paths both refuse. And
**snapped values are rounded to the combined decimal precision of `min` and `step`**, because
`min + steps * step` accumulates binary error (`0 + 3 * 0.1` gives `0.30000000000000004`) that
leaked into `onChange`, `aria-valuenow` and the value tooltip.

### `Item` — the fallback is the interesting half

`aria-selected` is only valid on seven roles, so a `listitem` or bare `div` carrying it was invalid
ARIA. The fix is not just to suppress it: selection still has to reach assistive tech, so those
roles get `aria-current="true"` instead — written _after_ the rest spread so a consumer's own
`aria-current` (`"step"`, say) wins. The selected _styling_ stays unconditional, which is what keeps
this from being a visual change.

### `Calendar` — selection state has to be in the name

A day is a `<button>`, and roving focus lands on it. It cannot carry `aria-selected`, so the state
lives in the accessible name: `", selected"`, `", range start"`, `", range end"`, `", in range"`,
and `", range start and range end"` for a completed one-day range. The in-progress case is the
subtle one — while a range is half-picked `rangeStart === rangeEnd`, and the day must read as
_"range start" only_, which is why `DayCell` needs `isRangeSelectionInProgress` as a prop rather
than deriving it.

**The suite change this forced is worth recording.** `getDayButton` looked days up by exact
accessible name; a selected day's name now carries a suffix, so the helper matches on substring —
which is what upstream's regex always did. Day 1's name is not a substring of day 15's, because the
weekday prefix differs.

### What the class oracle did and did not prove here

The oracle came back at **1490 style keys / 593 inline call sites / 0 mismatches**, and several
changelog items in this batch are pure style fixes: `TabList`'s divider gap, `TreeList`'s
focus-visible leak, the inputs' disabled hover ring, `CheckboxInput`'s indeterminate radius,
`Citation`'s non-interactive cursor, `Thumbnail`'s hover overlay. **All of them were already
correct** — they landed with 17b's re-ports — and the oracle established that in one run rather than
a dozen file reads. That is the tool working as intended.

It remains blind to the 54 function styles across 32 modules; nothing in this batch narrowed that.

### `plainDateAddMonths` — a one-line fix with a two-case blast radius

`Date#setMonth` overflows: Jan 31 + 1 month is Mar 3, not Feb 28, so month arithmetic from any
end-of-month date **skips February entirely**. Replaced with pure month arithmetic plus a day clamp,
matching `Temporal.PlainDate.add`. Two ported cases pinned the _old_ behaviour and were replaced by
upstream's four, which pin the clamp in both directions and across a leap year.

### The docs `heading` block, finished

17b landed the block's rendering and recorded the outline half as a shell change. `build-outline.ts`
is upstream's `ReferenceDocView.buildOutline`: it mints ids for sections _and_ nested headings,
deduped across the whole page (two sections can hold a heading with the same text, and every outline
link must resolve to exactly one element), and returns them alongside a flat entry list carrying
each heading's own level. The page consumes the minted ids rather than re-deriving a slug.

**One property had to be preserved deliberately.** A `token-ref` block links to another topic's
section _by title_, slugified through the shared `sectionId`. `uniqueSlug` returns exactly
`sectionId(title)` for a first occurrence, so those cross-page links are unchanged; only a duplicate
title takes a suffix, and a `token-ref` pointing at a duplicated title was already ambiguous.

### Fixed at 17c's close, after the audits

The four closing audits found eleven things. Three were the a11y-shaped work the batch was scoped
around; the rest were drift that had accumulated in components 17c happened to touch. The notes
that matter are below — the ones where the _reason_ is not obvious from the diff.

**`Slider` positioned horizontally with a physical `left`.** Upstream uses `insetInlineStart` at all
three sites (thumb, marks, filled track), and `thumbHorizontal` carries no positional inset of its
own — so the inline style _is_ the position. Our `.stylex.ts` had already ported the RTL half of the
pair, flipping `transform` to `translate(50%, -50%)` under `[dir="rtl"]`, and even said so in a
comment: "the thumb is positioned via logical `insetInlineStart`". The component then wrote `left`.
Under RTL the thumb was mirrored _and_ mis-offset, and disagreed with `handlePointerDown`, which
measures the fraction from the right edge correctly. The vertical `left: 50%` is left physical — it
is a centring constant, and upstream writes it physically too.

No gate covers inline styles, so this was verified in real headless Chromium with a throwaway probe:
LTR 25% resolves to 103.5px of a 414px track; RTL 25% resolves to 103.5px **from the right**, with
`left` at 290.5px. Probe deleted after it reported.

**`Dialog` dropped a consumer's `onkeydown`.** This is the sharpest React→Svelte translation trap in
the batch. Upstream deliberately does _not_ pass its Escape handler as a JSX prop — it is
`dialog.addEventListener('keydown', …)` from an effect, so a consumer's `onKeyDown` arriving through
`{...safeProps}` coexists with it. Svelte gives an element one `onkeydown` slot and lets the explicit
attribute beat the spread, so the direct transcription silently ate the consumer's handler. The two
are now composed in upstream's observable order: React delegates `onKeyDown` to the root container,
so the dialog's own bubble-phase listener runs first and the consumer's after — unconditionally,
because `preventDefault` does not stop propagation. The consumer's call sits _outside_ the `isOpen`
guard, because upstream installs its listener only while open and leaves `onKeyDown` live on a
closed dialog.

A repo-wide sweep for the same shape found no other instances. Mechanically: every element carrying
a rest spread _and_ an explicit `on*` handler not destructured out of `$props()`. All 26 remaining
sites are parity — upstream's JSX clobbers in the same direction. Two false-positive rounds are
worth remembering: the handler usually sits on a _child_ element that never sees the spread, and the
shorthand destructure (`onkeydown,`) does not match a pattern written for the renamed form
(`onkeydown: onkeydownProp`).

**`useMediaQuery`'s design note was wrong, and two files cited it.** The comment claimed its
`$effect.pre` "runs after the hydration pass (so the hydrated DOM still matches the server's)",
which is how `AppShell` and the docs' `DocPageLayout` justified mounting only one side of a
breakpoint. Checked against Svelte 5.56.7 rather than reasoned about: the compiler emits
`user_pre_effect` _above_ the template, `create_effect` runs a `RENDER_EFFECT` immediately rather
than queueing it, and `effects.js` has **zero** references to `hydrating`. The live reading is
therefore already in place when the template hydrates, and a `{#if}` keyed on it takes the
mismatch-recovery path — server subtree discarded, branch rebuilt client-side.

The behaviour is unchanged; only the claim is. A pre-effect buys the **no-flash** half of upstream's
three-argument `useSyncExternalStore`, not the **hydration** half. Swapping to a plain `$effect`
would trade one for the other and land on the worse side: correct hydration, but a visible flash on
every client-only mount, which React does not have. Reproducing both halves needs a hydration signal
Svelte does not expose, so the trade is recorded instead of papered over.

**`FileInput`'s dead `liveRegion` style is the batch's best example of an oracle blind spot.** 0.2.0
moved the announcement to `useAnnounce` and deleted the style along with the `role="status"` element
it dressed; ours outlived the element. The class oracle could not see it, and not by accident — the
block was byte-identical to `hiddenInput`, so it compiled to the same atomic classes and the diff
read the collision as a _match_ for a key upstream no longer has.

**`Icon`'s spread order now differs between its own two branches, on purpose.** Upstream's do too:
component mode spreads consumer props last (`Icon.tsx:345`), registry mode spreads them before the
theme (`Icon.tsx:403`). Ours matched the registry shape in both. Fixed to match each branch rather
than tidied into agreement — the inconsistency is upstream's API.

**Two i18n keys were in the catalog and referenced nowhere.** `ChatDictationButton` and
`ChatToolCalls` string-concatenated English. Nothing could catch this: the catalog is a byte-exact
219/219 match with upstream's, and `groupLabel`'s default is `"{count} tool calls"`, so the rendered
English was identical — only the ICU parameter was lost. The query that _would_ have caught it is
"which catalog keys does upstream reference and our source never does"; the answer was exactly these
three.

---

## Batch 18 — tracking upstream 0.3.0, and the gaps the audits found on the way

Batch 18 began as "track 0.3.0" and grew, because four closing audits and a release-readiness sweep
kept finding things older than 0.3.0. Grouped by unit here; the batch's status, counters and open
decisions stay in [`TODO.md`](./TODO.md).

### `expandColorScale` + `hct` + `contrast` — three new modules, and a gap older than v0.2.0

`expandColorScale` derives ~27 `--color-*` token overrides from one seed accent hex using the HCT
perceptual model, emitting only the tokens that meaningfully derive from the accent and letting
status/categorical/fixed tokens fall through to `colorDefaults`. An accent-less config seeds neutrals
from the default accent's hue (`#0064E0`) and leaves the three accent tokens ungenerated;
`--color-border-emphasized` is tone-bumped until it clears 3:1 against the generated surface.

**It was never a 0.3.0 addition.** `expandColorScale.ts` first appeared upstream around v0.0.13
(`ddc384c0d`) and `hct.ts` also predates v0.2.0 — so this port had been missing it since before the
pin it was tracking. Only `contrast.ts` is genuinely new in 0.3.0. The expander did grow +143 lines
between v0.2.0 and v0.3.0 (an optional `accent`, plus the WCAG 1.4.11 tone-bump) with its suite
growing +388, which is probably how "the three 0.3.0 pieces" entered `define-theme.ts`'s header as a
provenance claim. Corrected there.

The dependency chain bottomed out cleanly — `utils/color.ts` already exported `parseHex`,
`formatHex`, `parseColor` and `RGBA` with the signatures upstream's usage needs, so no new package
and no invented substitute. `hct` (269 lines) and `contrast` (99) stay module-private, matching
upstream, which publishes neither from `theme/index.ts` nor its root barrel.

**Suite: 63/63**, plus new `hct.test.ts` (19/19) and `contrast.test.ts` (10/10) — upstream's 9
literal `it(` lines in `hct` expand to 19, because two sit inside `for` loops over 7 and 5 hex
fixtures. The 41 WCAG cases are what actually verify the maths: their `toBeCloseTo(2.24, 1)` and
`toBeCloseTo(1.84, 1)` targets are only reachable if the whole sRGB to XYZ to Lab to HCT
gamut-mapped pipeline is right.

**One translation was load-bearing.** Three cases call upstream's `generateThemeRules`, which returns
the theme's scope rules and generates on-media rules _separately_. This port publishes only
`generateThemeCss`, which appends the on-media layer — and `defaultOnDarkTokens` and
`defaultOnLightTokens` both set `--color-accent`, so a naive port of the neutral-only case fails on
`--color-accent: var(--color-on-dark)` for a reason unrelated to the expander. A `themeRules` helper
strips the on-media layer back off, reconstructing the embedding rather than guessing at it;
mutation-checked, since bypassing the strip fails that case with exactly those two declarations.

`defineTheme` gained the `color` field that feeds it — applied first in the `resolvedTokens` spread
(upstream's step 1, ahead of the type scale) and still beaten by explicit `tokens`. Its own header
had called it "omitted **for now**", which is a deferral with a to-do attached rather than a
decision.

### Theme icon registries — the seam was wired and shipped nothing

Every upstream theme package exports a `<name>IconRegistry` of **28** semantic names over
`lucide-react`; this port shipped none, for any package. The blocker was never the API shape:
`build-theme-package.mjs` serialises the theme with `JSON.stringify`, which **drops a function-valued
property silently**. Registry values are snippets — functions — so `icons` could not have survived
that path however it was authored, and nothing warned.

Settled shape: a `src/icons.svelte` of 28 snippets over `@lucide/svelte` (`lucide-svelte` is
deprecated), passed to the shared build **by name**, substituted into the emitted literal through a
placeholder the build asserts appears exactly once, and **copied** into `dist/` rather than compiled.
`svelte-package` leaves `.svelte` essentially as authored — core's published `default-icons.svelte`
still carries its `lang="ts"` — and its two real transforms (rewriting `$lib` aliases and `.ts`
specifiers) have nothing to act on in a module importing only bare specifiers. So no theme package
needed new build tooling.

One shape divergence, documented in-file: upstream writes `icons:` inside `defineTheme()` in the
theme _source_; ours cannot, because that source is imported by the build under plain Node
(`--experimental-strip-types`), which will not parse a `.svelte` import. The build attaches it
instead — published surface identical.

All seven upstream registries were diffed individually rather than assumed identical: zero mapping
differences, and the only variation is the export name plus a header docblock that matcha and y2k
omit entirely and that chocolate, gothic and stone inherit from neutral _including the words "for the
neutral theme"_ — an upstream copy-paste slip, noted and not reproduced. Upstream's deprecated Lucide
aliases (`CheckCircle`, `XCircle`, `AlertTriangle`, `MoreHorizontal`, `Filter`, `Columns`) are kept:
`lucide-react` carries the identical alias table, so the glyphs match and parity governs.

`liquid-glass` ships one too, by decision rather than parity — it has no upstream original, and since
all seven upstream registries are byte-identical the registry carries zero per-theme design content.

The checker lives in `packages/themes/shared/check-icon-registry.mjs` with eight thin callers,
mirroring the existing `compare-upstream.mjs` to `shared/compare-theme-css.mjs` split. It carries a
fourth assertion the rollout itself made necessary: since the eight registries differ by exactly one
identifier, a copy that kept the name it was copied from is the obvious failure — so it asserts the
exported binding matches what that package's `build-theme.mjs` imports.

### `chocolate` and `stone` — the theme set completed

Both green on the first oracle run: chocolate **289/289**, stone **355/355**, zero theme-specific
skips, the 3-per-theme remainder being the shared `color-scheme` rules `base.css` owns. Chocolate has
**no** `chocolatePalettes` upstream (only butter, gothic, stone and y2k have a palettes export) and
none was invented. Stone carries a stone-only idiom — a shared `INPUT_STATUS_VARS` const spread
across all nine input components — transcribed verbatim with its `as const`.

Neither uses `extends` or `color`; checking all seven upstream themes confirmed none does, which is
what finally discharges the standing "no shipped theme needs them" obligation for `extends`.

**A pre-existing bug in the shared build surfaced here.** `literalType()` guarded on
`typeof value === 'string'`, so numbers fell to the object branch — and `Object.entries(291)` is
`[]`, emitting `readonly hue: { }` where upstream publishes `readonly hue: 291`. It had already
reached the **published** `index.d.ts` of gothic and y2k (10 entries each); stone's `hue`/`chroma`
numerics made it 20 in one package and someone finally read the output. Nothing caught it because
nothing was looking: the runtime value in `index.js` was always correct, `{}` is valid TypeScript so
`check` stayed green, and the theme oracles diff CSS declarations rather than declaration files. Key
quoting was fixed alongside it, so the generated `.d.ts` now matches the upstream declaration it
mirrors bare-for-bare.

### `Typeahead.inputTabIndex` — the one real component gap the audits found

A **`BaseTypeahead`** prop (`number`, no default, rendered verbatim as `tabIndex` so omitting it
emits no attribute), which `Typeahead` consumes as `inputTabIndex={showToken ? -1 : undefined}`.
While the selected-value token is shown the input collapses to width 0 and opacity 0, so it must
leave the Tab order (WCAG 2.4.3 / 2.4.7) while staying programmatically focusable for token edit and
clear, both of which refocus it after it uncollapses.

Auditing its header found the suite claimed 42/42 when upstream has **49** across twelve blocks —
three missing describe blocks, not one. All 7 ported. Two literal transcription omissions were fixed
with them: the `results.length > 0` guard dropped from `ArrowDown`/`ArrowUp`/`Home`/`End` (with zero
results, ArrowDown and Home set `highlightedIndex = 0` where upstream leaves `-1`), and
`highlightedIndex` computed from the unclamped array rather than the clamped `shown.length`.

### The status-hover `!isDisabled` guard — 13 live sites, and the mechanism that misled us

Upstream guards its status hover shadow on `!isDisabled` (`Typeahead.tsx:424`). This port had dropped
it across seven input components and `tokenizer` — **13 call sites, every one live**. The three date
components use `!isEffectivelyDisabled` (`isDisabled || isBusy`), so restoring plain `!isDisabled`
there would have introduced a _new_ defect where a busy field keeps the ring.

The first analysis called one site inert on the theory that styleq merges `disabled` and the hover
shadow under one `boxShadow` key, last-wins. **That is wrong**, and the correction matters: styleq
keys a _conditional_ declaration separately from an unconditional one, so `disabled`'s flat
`boxShadow: 'none'` only ever replaces the default key and never touches the ring's
`:hover:not(:focus-within)` key. Declaration order is irrelevant; the guard is the only thing that
removes the ring anywhere.

**The class oracle is provably blind to all of it** — inverting the guard in `text-input` still
reported 0 mismatches, exit 0 — because `extractGroups` needs `$$css` and an `attrs()` function
compiles to a function over a hoisted `_temp`. `input-status-hover-guard.svelte.test.ts` (18 cases)
is the only mechanism that can catch a regression, and it deletes each guard individually to prove
per-site sensitivity. One trap in writing it: `inputStatusHoverShadowStyles.error` and
`inputWrapperStyles.disabled` emit the **same** class for `boxShadow: 'none'`, so a naive
"lacks the ring class" assertion reports a ring on every disabled wrapper.

### The dev-warning family — 17 of 18 bare `console.warn` sites

Converted to `devWarn` / `warnOnce` / `useDevWarning` per upstream's own mechanism at each site,
restoring the `NODE_ENV` production gate 17 of them had lost, and restoring 8 message texts to
upstream's verbatim wording (the `[Astryx] ` and `[Table] ` bracket prefixes are gone; the format is
`Component: message`).

**`Avatar` is deliberately still bare.** `Avatar.tsx:521-525` at the tag is itself an ungated
`console.warn`, carrying the very comment this port transcribed — so gating it would have been a
parity regression. Annotated at the call site so a future sweep does not "fix" it.

Two sites could not use the `useDevWarning` hook: `use-overflow` and `timestamp` interpolate values
that can change after mount, and the hook takes `message` as a plain string captured at init, so a
condition first turning true later would report mount-time values. Both expand the latch inline
(`let hasWarned` plus `devWarn`) — semantically identical to upstream's ref+effect, and a shape
upstream itself uses at `Dialog.tsx:514-532`. Widening the hook to accept `string | (() => string)`
would fix it generally and was rejected as an invented API.

### `useIcon` and `Icon` — the root-theme fallback, missing in both

Upstream's `useThemeName` has two arms: the nearest `<Theme>`'s name, and — with no `<Theme>` above —
the name the root `<Theme>` mirrored onto `<html data-astryx-theme>`. Only the first was here, in
both `use-icon.svelte.ts` and `icon.svelte`, so a consumer outside the provider subtree (a portal, a
detached root, `useToast`'s fallback viewport) silently resolved built-in defaults instead of the
app's themed glyphs. Both now read `themeContext?.().theme ?? themeName.current`.

The **context** arm deliberately keeps passing the theme _object_ rather than upstream's name:
Svelte's context is SSR-readable, so the name indirection upstream needs for RSC buys nothing here,
and routing it through the module-level registry would reintroduce a request-global server lookup and
make nested `<Theme>`s sharing a name resolve to whichever registered last. The root-attribute arm
has no object to reach for, so it passes the name through the registry exactly as upstream does.
`useThemeName` had **zero in-repo consumers** before this — itself corroboration the path was dead.
The parameter also narrowed from `ExtendedIconName` to upstream's `IconName`.

### `useContainerReveal` — the SSR pool leak

Svelte's `Renderer.#open_render` calls the component inside a `try/finally` whose `finally` only
restores SSR context; `onDestroy` callbacks drain in `#close_render`, which a throw skips entirely.
So a render that threw never returned its marker to the free list: POOL_SIZE throwing renders
**permanently** exhausted the pool, and every later render then emitted the fallback marker for every
container — a hover leak between nested containers _and_ a hydration mismatch, since the client
hydrates against its own untouched pool and numbers the same containers 0,1,2.

Fixed with a server-only microtask free-list reset armed from `claimSlot`. A microtask is exactly the
end-of-render boundary for a synchronous render — `render()` completes or throws inside one task and
the queue cannot drain until that stack unwinds — which is why the existing SSR cases still pass
unchanged. One documented edge remains: under Svelte's _async_ SSR a component body can resume in a
later microtask turn, so a reset armed by an outer container could land before a nested one claims.
Nothing in this package awaits and the synchronous `render()` path throws on any async work, so the
exposure is a consumer awaiting _between_ two nested reveal containers; closing it needs a
render-boundary signal Svelte does not expose to a hook.

Verifying it needed care: a hand-written component function does **not** create a component-body
renderer, and `onDestroy` callbacks are only collected from renderers flagged `#is_component_body`
(set only by `$$renderer.component()`), so the first repro leaked in the control too. Compiling a
probe with Svelte's own compiler gave the right shape and a passing control. The pool cases are also
deliberately ordered with the pristine baseline **first**, because a leaked pool can never be
restored — placed last, it compares `m0,m0,m0` against `m0,m0,m0` and passes.

## Page templates — upstream's 43 whole pages (2026-08-10)

Not components: upstream's `assets/templates/pages/*` are self-contained React pages the CLI
scaffolds. All 43 are transcribed to `packages/cli/assets/templates/pages/<slug>/+page.svelte` plus
a `template.doc.mjs` carrying upstream's metadata verbatim — `isReady: false` and
`isHiddenFromOverview: true` included, because those are upstream's editorial calls and inverting
one would be invented content. Status, counts and the open debts live in
[`TODO.md`](./TODO.md#known-debts); this is how they were built.

**The job was transcription, not component work.** All 96 symbols the 43 pages import already
resolved against `packages/core/src/lib/index.ts` before a line was written — `Table`,
`Resizable`/`ResizeHandle`/`useResizable`, `PowerSearch`, `Chat`, `TreeList`, `CommandPalette`,
`AppShell`/`useAppShellMobile`, `useMediaQuery`, `Markdown`, `Outline`. The only apparent gap,
`ThemeProvider`, turned out to be sample text inside a `CodeBlock`'s `code={…}` string. The CLI seam
was equally ready: `_adapter.mjs` had defined `PAGE_SOURCE_FILE = '+page.svelte'` and walked
`assets/templates/pages` under `existsSync` guards since the CLI slice, so the files simply appeared.

### Two Svelte hazards these pages found, both silent

**A `class` handed to a component is never scoped.** Svelte's scoper stamps *elements*; a class
passed as a prop is an opaque string. So `.wrap .hero { … }`, where `.hero` sits on an Astryx
component, is emitted as `/* (unused) */` and dropped, with only a `css_unused_selector` warning to
say so — the page renders, minus that rule. The fix is a bounded global, `.wrap :global(.hero)`,
which also matches what upstream's own injected `<style>` string does (unscoped either way).
Mutation-checked rather than asserted: restoring the bare selectors reproduces exactly
`css_unused_selector @673, @677, @686, @690` in `ai-chat`. This has no React analogue — upstream's
`className` reaches the DOM unchanged — and it bit in four separate batches.

**A `{#snippet}` declared as a *direct child* of a component is a prop on that component.** In
`settings-dialog` a snippet written inside `<List>` became a `List` prop, and `List` spreads
`{...rest}` onto its `<ul>`, so it would have landed as a DOM attribute. Hoisting it to top level
fixes it; a snippet inside an `{#each}` is *not* a direct child and is safe, which is why the
per-row pattern works. The existing `/templates` page docstring already warned about this for
`ClickableCard`/`Overlay`; it has now bitten twice, so it belongs here rather than in one file.

### The translations that recurred

- `Layout content={<…>}` → `{#snippet content()}…{/snippet}` + `<Layout {content} />`. A component's
  slot prop takes a **zero-argument** `Snippet`, so a parameterised snippet needs a thin nullary
  wrapper. Per-row slots are declared *inside* the `{#each}` so they close over the loop variable.
- **Hooks take getters and must not be destructured.** `useMediaQuery(() => '(max-width: 768px)')`
  read as `.matches`; `useResizable(() => config)` returning `{get size, get isCollapsed, …}`;
  `usePowerSearchConfig(() => defs, () => name)`. `const {size} = useResizable(…)` snapshots at init
  and freezes the frame — upstream's own `const {config, applyFilters}` is exactly that destructure.
  `useAppShellMobile()` returns a **function** here: `appShellMobile().isMobile`.
- **`Table.renderCell` is `Snippet<[T]>`.** A column array referencing one must be `$derived.by`,
  because template snippets do not exist yet while `<script>` runs. `Table` in children mode ignores
  `columns` entirely (`base-table.svelte:406`, mirroring upstream's `BaseTable.tsx:525`), so
  `table-grouped` renders no header row — upstream behaviour, reproduced.
- **A page template is one file**, so a stateful local React component cannot become a sibling
  `.svelte`. Its state hoists onto the page (there is exactly one instance, so rendering is
  identical) and its markup becomes a parameterised snippet.
- No Astryx-Svelte component has a `ref` prop; `ref={cb}` becomes `{@attach …}`, which works because
  the components spread `{...rest}`. Upstream's ref-callback caches are **kept** — Svelte re-runs an
  attachment when its function identity changes, so dropping them would re-register every card on
  every pointermove.
- `CSSProperties` objects → `style` strings under upstream's const names and key order. An inline
  `<style>{CSS}</style>` moves to a top-level block, which Svelte requires.

### Test posture

Upstream ships no suite for these pages, so there is nothing to port case-for-case; `ShowcaseThumbnail`
mounts each one live in the gallery behind a `<svelte:boundary>`, so a page that throws is visible
immediately. What the batch did do is **retire four self-retiring fixtures at once** — assertions and
fixtures written specifically to expire when template assets landed:

- `template-integration.test.mjs` asserted `core.length === 0`; upstream's `toBeGreaterThan(0)` is
  restored, kept as a bound rather than a literal count so it asserts behaviour, not the batch schedule.
- `copy.test.mjs`, `template.test.mjs` and `template.path-safety.test.mjs` each stood up an
  integration-contributed `blank`/`contact-form` because none was packaged. Core's real ones now
  collide with them (`ERR_AMBIGUOUS_TEMPLATE`), so all three revert to upstream's shape — no fixture,
  resolving the packaged template exactly as upstream does. One assertion changes value, not meaning:
  upstream reads `columns={{minWidth: 200}}` out of the skeleton, ours carries the repo's prettier
  spacing inside the literal.

## The input family at 0.4.x — `isReadOnly`, the clear-button convergence, and ten uncalled i18n keys

Ten components in one batch: `TextInput`, `TextArea`, `TimeInput`, `DateInput`, `DateRangeInput`,
`DateTimeInput`, `Tokenizer`, `FileInput`, `Switch`, `CheckboxInput`, plus `Token`'s remove button
and the shared `InputClearButton` they converge on. `NumberInput` and the `Selector` family took the
same changes in parallel and are not described here.

### `isReadOnly` — a state defined by what it does _not_ do

New on `TextInput` and `TextArea` only (`NumberInput` is the third upstream case). It is the native
`readonly` attribute and nothing else: `readonly={isReadOnly || showsDisabledMessage || undefined}`,
never `aria-readonly`. It selects **no style key** — the whole point of the state is that it is not
dimmed — so it reaches the stylesheet only through `themeProps`, as `data-readonly="readonly"` plus
a bare `readonly` class token, for a theme that wants to paint it. The value still submits, the
control keeps its tab stop, and `isDisabled` wins when both are set.

The behaviour lives in three places that each have to agree, and two of them are easy to skip: the
attribute stops the DOM accepting an insert, the `if (isDisabled || isReadOnly) return` guard in the
change handler stops the optimistic value and the callbacks firing, and `hasClear`'s render
condition gains `&& !isReadOnly` so the affordance is not offered for a value that cannot change.
Upstream's suite tests all three independently, which is what makes them independent: Chromium's
editor refusing the keystroke would otherwise mask a missing handler guard.

`name={isDisabled ? undefined : htmlName}` landed alongside it on both, and is the sharper half of
the pair. A `disabledMessage` deliberately drops the native `disabled` attribute so the reason stays
focus-discoverable — but a `readonly` control **does** submit, so without withholding the name a
field the user was told they cannot edit posts its value anyway. `Switch` and `CheckboxInput`
already had it; `Tokenizer` reaches the same end differently, by putting `disabled` on the hidden
`<input>` carriers rather than dropping their name, which is upstream's shape and is left alone.

### `data-disabled` on seven roots

`disabled: isDisabled ? 'disabled' : null` in the root `themeProps` of `TextInput`, `TextArea`,
`TimeInput`, `DateInput`, `DateRangeInput`, `DateTimeInput` and `Tokenizer`. Keyed off the
**prop**, not the effective busy-inclusive state the three date inputs compute for their own
styling: a busy field is not a disabled one, and reflecting the derived value would have made the
attribute flicker for the duration of a `changeAction`.

### The clear-button convergence (#4876)

`TextInput`, `TimeInput` and the three date inputs each inlined their own `<button>` and each drew
its own 1px `--color-accent` focus ring — a width nothing else in the system used, and the source of
the CSS oracle's two invented rules `.x1p25gnr:focus-visible{…}` and `.x1y3gkto{outline-offset:1px}`.
All five now render `field/input-clear-button.svelte`, and both rules are gone from `astryx.css`.

**Only two callers pass `iconClassName`.** The brief said every converted caller passes
`stableClassName('<component>-clear-icon')`; upstream passes it from `DateInput` and
`DateRangeInput` and from nowhere else, because those two are the only ones that had already shipped
a component-specific theme target a consumer could be styling. Stamping it on the other three would
have invented three public targets. The `.doc.mjs` corpus is the cross-check that settles it:
`deprecatedFor: 'input-clear-icon'` appears on exactly `astryx-date-input-clear-icon`,
`astryx-date-range-input-clear-icon`, `astryx-selector-clear-icon` and
`astryx-multi-selector-clear-icon` — four targets, two of them in this batch.

The oracle bookkeeping is the interesting half. `styles.clearButton` left `text-input` and
`time-input` outright, so their `inline` claims were deleted. But the three date inputs' claims had
been stale _since an earlier batch_: adopting `focusOutlineStyles.focusVisible` on the calendar
toggle is a composition of an **imported** style, which is exactly what defeats StyleX's fold, so
upstream's `dist/` already carried `styles.iconButton` / `iconButtonDisabled` (and
`DateRangeInput`'s `presetButton` pair) as live objects. The fix is to delete the `inline` entries
rather than correct them — object mode already covers those keys. `Switch`'s `statusGap` and
`Token`'s `removeButton` moved the same direction for the neighbouring reasons: an `xstyle` handed
across a component boundary, and a `focusOutlineProps.focusVisible(...)` runtime call.

### Ten i18n keys, not thirteen

`file-input` hardcoded eight English strings, `time-input` and the two date-time components three
more between them. The brief called it thirteen; grepping `src/lib` for every key in
`locales/en.json` finds **twenty** uncalled, of which ten are this family's. The rest belong to
`NumberInput` (2), the table's row-expansion plugin (2) and the lab `Stepper` (6) — a component this
port has not ported at all, so those six stay uncalled by construction. The method is the finding:
**derive the list from the catalog, not from a brief**, because a hardcoded literal is invisible to
every gate here. The oracles diff CSS, `check` sees a perfectly good string, and a ported suite
asserting the English literal _passes_ precisely because the component emits it.

`validateFiles` is module-private and pure, so it takes the translator as a parameter rather than
calling `useTranslator` — which forced upstream's own rename of the `accept.split(',').map(t => …)`
lambda parameter to `s`, since `t` is now the translator in that scope.

### `TextArea`'s double inset and its detached reserve (#4813, #4940)

`styles.wrapper` zeroed the shared inset with the `padding` shorthand. StyleX ranks longhands above
shorthands **regardless of merge order**, so `padding: 0` lost to `inputWrapperStyles.base`'s
`paddingBlock`/`paddingInline` and the wrapper kept an inset the `<textarea>`'s own padding then
doubled — insetting the text and pushing the native resize grip in from the corner. Splitting it
into matching longhands is the whole fix, and it is the class oracle's `kmVPX3=x1717udv` →
`k8WAf4=xt970qd kg3NbH=xnjsko4`.

The trailing reserve was gated on `status != null || isBusy`, i.e. on the _prop_. The `detached`
variant renders no on-field glyph — its icon lives in the message box below — so the reserve was
insetting text for an icon that never appeared. It now gates on the end slot's own render condition,
`isBusy || statusIcon.hasIcon`, which is the value the slot already reads.

### Focus return on calendar dismiss (#4974)

`utils/focus-return.ts` was ported with `isFocusDetached` exported and **no consumer anywhere in
`src/lib/components`** — the same shape of gap as a custom property with no reader. `DateInput` and
`DateTimeInput`'s `usePopover` `onHide` now guards on it. A native `popover="auto"` light-dismiss
fires synchronously with the pointer event that moved focus, so by the time `onHide` runs the user's
click has already landed somewhere; reclaiming focus unconditionally fought it. Escape and a click
on non-focusable empty space are the cases that leave focus on the body, and those are the only ones
that should reclaim.

### `form=""` (#4815)

`Switch` and `CheckboxInput`. `disabledMessage` drops the native `disabled` attribute, which leaves
`required` live on a control the user cannot operate: `form.checkValidity()` is false forever and
the browser's validation bubble points at a switch nothing can toggle. `form` names the **id** of
the form to associate with, and no element can have the empty id — so `form=""` associates the input
with no form at all, dropping it out of constraint validation and form data while it stays visible,
focusable and labelled. Dropping `required` instead would let a genuinely required field submit
empty once re-enabled; setting `disabled` takes back the focusability the message exists for.

### `Token`'s remove button (#4973)

`all: 'unset'` cleared the UA outline and nothing put one back, so the remove affordance had **no
focus ring at all**. `focusOutlineProps.focusVisible(styles.removeButton)` supplies it; the shared
ring is written as longhands, which is what lets it outrank the `all` shorthand whatever the merge
order.

### `weekStartsOn` (#4745)

Pure forwarding on all three date inputs — optional, no local default, handed raw to `<Calendar>`,
which owns both the `= 0` fallback and `normalizeDayOfWeek`. Defaulting it in the caller would state
the same fact twice in the file that does not decide it. No locale interaction: the default stays
Sunday regardless of the active locale.

### Test posture

64 upstream cases added across nine suites — `TextInput` 13, `TextArea` 14, `TimeInput` 5,
`DateInput` 8, `DateRangeInput` 7, `DateTimeInput` 8, `Tokenizer` 2, `Switch` 2, `CheckboxInput` 5 —
**nothing dropped**. Two suites are new: `input-clear-button.svelte.test.ts` (6 for 6, upstream's own
new file for the converged primitive) and `focus-return.svelte.test.ts` (4 for 4). The second is a
`.test.ts` upstream and a `*.svelte.test.ts` here, because two of its four cases focus a real element
and read `document.activeElement`, and this port's server project is `environment: 'node'` with no
DOM — splitting one four-case suite across two projects to keep a filename would have been worse.

The client project could not be run in this environment, so those 74 cases are **written and
typechecked, not passing**. The server project is 838 for 838.

---

## The Selector family at 0.4.1 — `PanelSearchInput`, the indicator seam, and a chevron that is its own element

`Selector`, `MultiSelector` and `ComplexSelector` in one batch, plus the new shared primitive
`field/panel-search-input.svelte` they lean on. The clear-button convergence (#4876) and the
`data-disabled` root state reach these three too; the input-family section above describes both, so
this one covers only what is specific to the selectors.

### `PanelSearchInput` — a search row that is part of the panel, not a box inside it (#4928)

A dropdown panel is already a bordered, elevated surface, so the `TextInput` these three used to nest
in one drew a second box within that box. The replacement is a magnifier `<Icon>`, a borderless
`<input>`, and the shared `InputClearButton`, in a rounded box shaped like the option rows beneath
it, separated from them by a full-bleed `<Divider>` the panel owns.

**It is not barrel-exported**, and that is upstream's shape rather than an oversight: `Field/index.ts`
exports only `InputClearButton`, and the file header says so in as many words. `src/lib/index.ts` is
therefore untouched by this batch.

Two orderings are load-bearing and neither is obvious from reading the render:

- **The rest spread comes _after_ the StyleX class on the `<input>`.** The selectors pass
  `role="combobox"` and the whole `aria-activedescendant` wiring through it, so a caller's attributes
  have to win.
- **`InputClearButton` renders _after_ the input in DOM order.** Both selectors' Tab handling depends
  on it: a forward Tab from the input moves onto the ✕ (keeping the popup open) only because the ✕ is
  the next tab stop, and `onContainerKeyDown` dismisses on a Tab that did _not_ originate on the
  input.

`data-keyboard-focus` is part of the contract, and `fieldKeyboardFocus` is the one sanctioned
exception to this family's shared-ring rule: an **inset** `box-shadow`, not `focusOutlineStyles`. The
field is inset 4–5px from the panel edge, so the shared ring's 3px offset would land on the panel's
own border and on the divider. The comment in the module says so, because the natural instinct on
reading it is to "fix" it back to the shared helper.

Upstream ships no `PanelSearchInput.test.tsx`, so this port writes none — beyond-upstream coverage
needs a hazard with no upstream analogue, and this has none.

The oracle case is both modes at once: `wrapper` rides `stylex.props(styles.wrapper, xstyle)` and
`icon` is handed to `Icon`'s `xstyle`, so neither folds; `field`, `field + fieldKeyboardFocus` and
`input` are the three literal strings in `dist/`.

### The chevron becomes its own element (#4838 + #4846)

All three had a wrapper `<span>` carrying a 16px box, the secondary icon colour, the rotation
transition and the theme target, with a bare `<Icon>` inside it. The wrapper is gone. `triggerIcon`
collapses to `{flexShrink: 0}`, a new `triggerIconRotation` holds the transition, `triggerIconStatus`
is deleted, and the glyph itself takes
`xstyle={[triggerIcon, triggerIconRotation, isOpen && triggerIconOpen]}` plus the
`*-indicator-icon` target — so one element carries the mark, its open/closed transform and the
selector a theme addresses. The status branch renders a different icon and so never picks up the
rotation, which is why its `transition: 'none'` opt-out could be deleted rather than moved.

**The two changes have to land together.** #4838 alone leaves `triggerIcon` in a shape that exists in
no released version, so the oracle would have nothing to diff it against in either mode.

That is also the batch's clearest instance of the standing hazard: object-mode diffing proves what a
module _declares_, never what an element _receives_. Moving a transform onto an `<Icon xstyle>` can
leave the declaration correct and the wrap missing at **zero mismatches**. Every converted `.svelte`
was grepped for its `xstyle=` references as a separate check.

### `useIndicator('check')`, rendered unconditionally

`Selector`'s option row no longer renders `{#if isSelected}<Icon icon="check">`. It renders the
theme's `check` indicator **on every row**, inside a `styles.itemMarkColumn` span, with
`state={isSelected ? 'checked' : 'unchecked'}`. The default `CheckIndicator` draws nothing when
unchecked, so the rendered output is unchanged — but a theme that maps `check` to a radio needs the
unchecked state to draw its empty circle, and `{#if}` would make that impossible.

`itemMarkColumn` uses `minWidth: '1rem'`, not `width`, for the same reason: a replacement radio is
20px at `sm` and the column has to grow with it.

The Svelte translation is `const mark = useIndicator('check')` then
`const SelectionMark = $derived(mark.current)`. Freezing it at init compiles, renders correctly on
first paint, and breaks `<Theme>` swaps — the exact hazard `use-indicator.svelte.ts` documents in its
header, and the reason that hook returns a getter where upstream returns the component.

### `indicatorPosition` (#4993)

Default `'end'` on `Selector`, `'start'` on `MultiSelector` — the two conventions each family already
had. `MultiSelector`'s `'end'` needs a new `checkboxDecorativeEnd` (`marginInlineStart: auto`)
because its row is not `space-between`: a truncating label plus a trailing control is what wants the
auto margin, and `renderOption` output is not wrapped in a growing span, so the margin has to live on
the checkbox itself.

### Section headings stop being separators

A labelled `<Divider>` rendered as a sibling put a stray `role="separator"` inside `role="listbox"`.
Both selectors now render an `aria-hidden="true"` `<div>` **inside** the `role="group"`, styled by a
new `sectionHeading` key and themed `selector-section-heading` / `multi-selector-section-heading`.
`sectionDivider` is deleted from both modules. The group already carries the title as its accessible
name, so the visible text is hidden rather than announced twice.

`MultiSelector`'s select-all divider goes for the same reason — upstream has none, and its storybook
comment names our shape as the a11y failure that stops a story opening its popup.

### `offset` replaces a baked `marginBlockStart` (#4951, #5003)

`MultiSelector` and `ComplexSelector` baked `marginBlockStart: --spacing-1` into their `popover`
style, which a `position-try-fallbacks` flip would have applied to the wrong edge. Both now pass
`offset` to `<PopoverLayer>`. `Selector` passes
`shouldOverlaySelectedItem ? undefined : spacingVars['--spacing-1']`: in overlay mode the measured
negative margin owns the block geometry and the menu is _meant_ to sit on the trigger.

A token cannot be read from a `.svelte` file, so each `.stylex.ts` re-exports the value as a plain
string — the arrangement `powerSearchPopoverOffset` settled.

### `useSelectedItemOffset` stops measuring through a transform (#4802)

The port had used `getBoundingClientRect()` throughout, which includes the popover's entry `scale()`,
so the measured error grew with each option's distance from the menu top. It now walks
`offsetTop`/`offsetParent` (`getLayoutTop`), reads `listbox.offsetHeight`, subtracts
`listbox.scrollTop`, and applies `SELECTED_ITEM_OPTICAL_OFFSET = 1`. It also anchors on the **outer
container** rather than the inner `<button>` — the shorter element made every size's selected row
land too low, and the outer div is what `usePopover` anchors to anyway.

### Typeahead moves out of `useCombobox`

The private matcher in `use-combobox.svelte.ts`'s `default:` branch is deleted in favour of the
shared `useTypeahead`, composed _ahead_ of `combobox.onKeyDown` by the component. What is left in
`default:` is the new `onSearchSeed` path: with `hasSearch`, a printable key on the closed trigger
seeds the query and opens the popup, and `onOpen` then places the caret after the seeded text.

**`resetTypeahead` is a forward reference and must stay a plain `let`.** The hide handler and
`clearValue` both need to drop the pending buffer (or "Dog" then "c" searches "dc"), but the hook is
constructed below them because it needs the popover. A plain `let resetTypeahead = () => {}` assigned
after `useTypeahead(...)` works, because the handlers read it at call time — making it `$state` would
have the assignment re-trigger every derivation that read it.

### The optimistic value is what `useCombobox` sees

`Selector.tsx:922` passes `optimisticValue`, and this port had been passing `normalizedValue`. With a
pending `changeAction` the raw prop still holds the old selection, so the popup would open with the
highlight on a value the action has already replaced, and Delete/Backspace would clear it. The
typeahead's `getCurrentIndex` / `onMatch` read the optimistic value for the same reason.

### `ComplexSelector` loses its local focus ring (#4935, #4973)

`styles.focusRing` (`:focus-within { outline: 2px solid accent; outline-offset: 2px }`) was the CSS
oracle's two invented rules `.x1oqel4m:focus-within` and `.x1fanpfn`; both are gone from
`astryx.css`. `focusOutlineStyles.focusWithin` replaces it and is `:has(:focus-visible)`, so the ring
is now a **keyboard** ring where the old one drew on a mouse click too. `Selector` and
`MultiSelector`'s ghost triggers gain the same style, for the same reason: a ghost trigger has no
bordered wrapper of its own.

### Oracle bookkeeping

Three mode flips and one new case, each landed with its style edit:

- **`selector`'s `statusButton` moved inline → object**, with its atoms unchanged. Its call site now
  merges `focusOutlineStyles.focusVisible` across a module boundary, which defeats StyleX's fold.
  `multi-selector`'s identical key made the same move. Only the _mode_ was wrong — exactly the
  failure an oracle checking one mode would miss.
- **`complex-selector`'s four-entry `inline` list is deleted, not trimmed.** `dist/` carries only two
  literal strings (`trigger`, `triggerText`), and both keys survive as objects too, so object mode
  already checks them atom for atom. With no `inline` key the leftover check does not run and nothing
  goes unverified.
- `selector`'s four dropdown entries are one call site's conditional matrix (`dropdownInput` on
  `variant !== 'ghost'`, `dropdownHidden` on `!isPositioned`), not four sites.
- New case for `field/panel-search-input.stylex.js` → `Field/PanelSearchInput.js`.

`selector` 18 → 0, `multi-selector` 17 → 0, `complex-selector` 5 → 0, `panel-search-input` 0 from a
standing start. The CSS oracle lost the two invented `complex-selector` rules and now reports nothing
from this family.

### One parity correction outside the brief

`MultiSelector`'s `<PopoverLayer>` was passing `[styles.popover, layerAnimations.below]`. Upstream's
`popover.render` is called with `xstyle: styles.popover` and never had a `layerAnimations` entry —
checked against v0.3.0 and v0.4.1 — so the appended animation was this port's invention and is
removed. `Selector` and `ComplexSelector` both genuinely carry `layerAnimations[placement]` upstream
and keep it.

### What the post-port audits caught

The `astryx-parity` and `astryx-idiom` passes both ran after the components were written, and between them found five things worth recording — four of which were **pre-existing** rather than introduced by this batch, which is the argument for running them on a rewrite and not only on a new port.

**`ComplexSelector` was dropping the consumer's `onclick` entirely.** Upstream destructures `onClick: onClickProp` (`ComplexSelector.tsx:268`) and composes it — `composeEventHandlers(onClickProp, () => { if (!isDisabled) popover.toggle(); })` — so a consumer handler runs first and can veto the toggle with `preventDefault()`. This port never destructured it, so `onclick` survived into `...rest` and the spread sat *before* the explicit `onclick=`. Compiled, that is one object literal where the last key wins, so the forwarded handler was discarded outright: `<ComplexSelector onclick={…}>` fired nothing and opened anyway. Now inlined as the two-step `MobileNav` and `SideNavCollapseButton` already use. The general rule, and it is `planning/06` H12 verbatim: **any event a component handles itself must be destructured out of `$props()` and invoked explicitly, in upstream's documented order** — a `{...rest}` beside an explicit handler for the same event is never a merge.

`Selector` and `MultiSelector` were checked for the same shape and are faithful: their `{...rest}` sits before `onkeydown` on the inner `<button>`, and so does upstream's JSX, so React drops a forwarded `onkeydown` too.

**`PanelSearchInput` omitted the wrong handler name.** It shipped `Omit<BaseProps<HTMLInputElement>, 'onchange'>`, reasoning by name from upstream's `Omit<…, 'onChange'>`. But React's `onChange` on a text input *is* the input event, and the handler this component binds its own value callback to is `oninput` — which, because the rest spread deliberately comes **after** it, a caller could have silently replaced, leaving a search box that types but never filters. `onchange` is never set here and has no React counterpart to omit, so it passes through. `TextInput` omits `'oninput'` for exactly this reason and was the precedent to have read. Unreachable in practice today (neither selector passes it, and the component is not exported), which is why it is second on the list rather than first — but it is the kind of thing that only stays unreachable by luck.

**The `statusButton` inline→object flip had a third call site.** `use-input-status-icon.stylex.ts` composes `focusOutlineStyles.focusVisible` at its one call site exactly as upstream does, so its oracle case needed the same mode flip `selector` and `multi-selector` got — and without it the class oracle stayed red on a key whose atoms were already correct. The rule that generalises: **when a shared style helper is adopted, every case claiming `inline` for a call site that now composes it needs re-reading, and they are found by grepping the helper's name** rather than by waiting for each to fail in turn.

**One demo story was missed.** `Placements` (`below`/`start`/`end`) is new at 0.4.1 and was added by #5003 — the same PR as the `offset` change — so it belongs to this batch even though the brief named only five stories. Now present.

**`Selector`'s trigger spread was in the wrong place.** Upstream puts `{...rest}` after `ref, id, type, role` (`Selector.tsx:1328`); ours had it first, so our explicit `role`/`id`/`type` won where upstream lets a caller's override. Reordered to match.

The idiom pass additionally confirmed, empirically rather than by reading, the four translation decisions this batch was least sure of: `$.component` re-reads the `SelectionMark` derived so a `<Theme>` swap does re-resolve the mark; `useCombobox`'s options bag is rebuilt per call so `optimistic.current` is read at event time; a top-level `$effect` is deferred to `pop()` and therefore runs after the whole template subtree, so `searchEl` and `anchorEl` are populated before any measurement or focus; and `{@const}` compiles to a `$derived`, so the per-row `multi-selector-option` target restamps its `data-*` while the hoisted, argument-free `themeProps` calls correctly do not.

It also corrected one clause of a comment I wrote: `use-selected-item-offset.svelte.ts`'s header claimed `$effect.pre` would be wrong because "the items being measured would not be there yet". They would — the layer's content is rendered unconditionally, so the rows exist from mount. The real reason plain `$effect` is right is that this must observe the *patched* DOM after `showPopover()` has run. Conclusion unchanged, justification corrected.
