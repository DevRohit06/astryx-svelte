---
seq: 1
title: Foundations, before batch numbering began
upstream: 0.1.7
units: [Button, Spinner, VisuallyHidden, Text, Heading, Code, Kbd, Blockquote, Stack, StackItem, HStack, VStack, Grid, GridSpan, Divider, AspectRatio, Center, Badge, StatusDot, Skeleton, ProgressBar, Card, Timestamp, Avatar, AvatarStatusDot, AvatarGroup, AvatarGroupOverflow, Icon, Tooltip, Thumbnail, NavIcon, IconButton, EmptyState, Citation, FieldStatus, FormLayout, MetadataList, MetadataListItem, Layout, LayoutHeader, LayoutFooter, LayoutContent, LayoutPanel, Resizable, ResizeHandle, Overlay, OverlayScrim, HoverCard, HoverCardLayer, ButtonGroup, Field, FieldLabel, TextArea, Switch, TextInput, InputGroup, InputGroupText, InputClearButton, Link, Item, RadioList, RadioListItem, Popover, PopoverLayer, PopoverAnchor, OverflowList, Dialog, DialogHeader, DropdownMenu, DropdownMenuItem, Section, Token, SelectableCard, ClickableCard, SegmentedControl, SegmentedControlItem, ToggleButton, ToggleButtonGroup, Lightbox, LightboxLayer, Toast, ToastViewport]
upstream-prs: []
---

## Scope

The components ported before batch numbering started: the L0/L1 shared primitives (Phase 1) and the
first wave of L2 composites, through the first overlay/imperative stack (Popover, Dialog,
DropdownMenu, Lightbox, Toast). `port/ported.md` carried this as an unbatched preamble list, split out
of `TODO.md` verbatim on 2026-08-05. Batch-numbered work (`List`, `MoreMenu`, `AlertDialog`, `Banner`,
…) begins in the next file. `useImperativeDialog`/`useImperativeAlertDialog`, mentioned here only in
passing against `Dialog`/`AlertDialog`, are their own batch (15).

## The primitives

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

## Oracle bookkeeping

Not recorded separately from the component notes above at the time this list was written — each
entry states its own test count and any oracle mode inline rather than in a dedicated section.

## What the audits caught

Not recorded separately from the component notes above at the time this list was written.

## Rules promoted

Not promoted at the time — this content predates the ledger's Rules-promoted convention.

## Retired debts

Two `port/debts.md` groups whose components were ported here (Toast, Lightbox) were later retired or
fell stale; filed here rather than invented a separate file for two entries.

### Resolved — `Toast` — slot translation, deferred suite, and replicated upstream quirks

- [x] **`useToast.test.tsx` (4 cases) is restored** in `src/tests/use-toast.svelte.test.ts`, batch 8, when `<Theme>` landed. The mode resolution it tests is `internal/theme-mode.svelte.ts`
  - Retired by: own title says resolved ("is restored" — checked `[x]`, status/informational note).

- [x] **`internal/theme-mode.svelte.ts` is the `mode` half of `useTheme`, and now has all three terms.** `<Theme>` landed in batch 8, so its context is the first, then `<html data-theme>` (upstream's shared refcounted `MutationObserver`), then OS preference — and, as upstream's args-switched no-op store does, a consumer under a `<Theme>` never touches the DOM or joins the observer. It stays in `internal/` rather than `hooks/` because `useTheme` itself is published from `theme/`, where upstream publishes it, and this is its mode half rather than a hook of its own
  - Retired by: own title says resolved ("now has all three terms" — checked `[x]`,
    status/informational note).

- [x] **`LayerProvider` / `LayerContext` landed in batch 9.** `ToastViewport` is "exported for LayerProvider integration" upstream, and `useToast`'s warn/throw strings name `<LayerProvider>`/`<AppShell>`. Half of that is now true: `<LayerProvider>` ships, so the strings name a component a consumer can actually reach. `<AppShell>` is still batch 10, and the strings stay verbatim either way, since they are the upstream contract
  - Retired by: `packages/core/src/lib/components/app-shell/` now exists too — the other half this
    entry tracked as still-pending ("`<AppShell>` is still batch 10") has since landed as well.


### Retired — `Lightbox` — hook/layer split and replicated upstream bugs

- [ ] **Test suite ported** in `src/tests/lightbox.svelte.test.ts` — all 26 of upstream's `it` cases, client (Chromium) project (native `<dialog>` + `useAnnounce`'s real `requestAnimationFrame`). Reuses upstream's `showModal`/`close` `vi.fn` mock, as the `Dialog` suites do, so the "calls showModal" spy works and the top-layer side effects stay out. Two cases changed shape: `forwards ref to dialog element` is an **attachment counterpart** (no `ref` prop in this port), and `does not render caption when not provided` gains a second, discriminating assertion because StyleX hashes the class upstream's `[class*="caption"]` selector looks for. Nothing dropped. Both load-bearing behaviours were mutation-checked: an always-announce effect fails the two silence cases, and unmounting the nav buttons at the range boundary fails all three boundary cases
  - Retired by: stale — `lightbox.svelte.test.ts`'s own header now reads "all 37 cases" (still
    "Nothing is dropped"), not 26; an accomplishment/status note whose count moved on, not a
    standing divergence.


## Debts opened

-
