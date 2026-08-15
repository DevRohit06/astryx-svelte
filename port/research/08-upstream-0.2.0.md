# Batch 17 — tracking upstream 0.1.7 → 0.2.0

Research and plan for the first batch that follows a released upstream _version_ rather than porting
new surface at a fixed one. Status lives in [`todo.md`](../todo.md); this file is the detail.

**Sources.** `reference/astryx-upstream/packages/core/CHANGELOG.md` and `packages/cli/CHANGELOG.md`
at tag **`v0.2.0`** (commit `e4013c900`, 2026-07-30). Every count below was extracted from those
files, not estimated.

---

## 0. The finding that should shape the batch

**The class oracle is not the scope, and working from it would have produced a false green.**

The first pass at sizing this batch used the oracle's mismatch list (267 across 39 components) and a
`.d.ts` diff. Both measure _styles_ and _type shapes_. The changelog carries **189 bullet items
across the three releases this jump spans**:

| release   | bullets | breaking |
| --------- | ------- | -------- |
| 0.1.8     | 36      | 1        |
| 0.1.9     | 72      | 0        |
| 0.2.0     | 81      | 1        |
| **total** | **189** | **2**    |

Most are new props, behavioural fixes and accessibility corrections — none of which a class diff can
see. Driving the oracle to green would have left roughly **60 behavioural changes unported with a
green run**, which is the same class of failure the bidirectional theme oracle was built to end: _a
green one-directional check is not coverage._

**So the method for this batch inverts the usual one.** The changelog is the work list; the oracle is
the confirmation that the styles half landed. Concretely, for each unit:

1. Read the changelog bullet — it says _what_ changed and usually _why_.
2. Diff the `stylex.create` block against upstream's **source** (`scratchpad/show.mjs` pairs them off
   the oracle's own `CASES` table) — that names the declaration, where the oracle only names a
   mismatched class hash.
3. Port the behaviour from the `.tsx`.
4. Re-run the oracle to confirm the style half.

---

## 1. Breaking changes (2) — **LANDED** (17a step 1)

Both needed an explicit decision recorded before any code moved, because the port has no `astryx
upgrade` codemod to lean on. Both are now done; the sub-sections below keep the reasoning and record
what it cost.

**Outcome.** `pnpm -r build`, `pnpm -r check` (1,600 files, 0 errors, 33 warnings — the accepted
baseline) and `pnpm -r lint` (99 warnings, 0 errors) all exit 0. `tab-list.svelte.test.ts` is 45
cases against upstream's 45.

### 1.1 `Avatar` / `AvatarGroup` size scale (0.1.8)

`size` takes `xsm`/`sm`/`md`/`lg`/`xl` instead of `tiny`/`xsmall`/`small`/`medium`/`large`. Pixel
values unchanged (20/24/36/48/128). **The default moves from `small` to `md`** — the same 36px, a
different name.

The rename is mechanical. The trap is the _call sites we own_: demo routes, docs example blocks and
tests that pass the old names silently keep compiling if the union is widened rather than replaced.
**Replace the union, do not widen it** — the parity rule makes the old names defects, and a compile
error at every call site is the cheap way to find them all.

**Done, and the technique paid.** Replacing the union turned every stale call site into a compile
error and found **28 files** with no grep judgement calls: the two components, the `avatarSizes`
demo ramp, 26 docs example blocks, two snippet identifiers (`xsmallAvatar`/`smallAvatar` →
`smAvatar`/`mdAvatar`) and one prose comment. The mapping is value-preserving — `tiny`→`xsm` 20px,
`xsmall`→`sm` 24px, `small`→`md` 36px, `medium`→`lg` 48px, `large`→`xl` 128px — so nothing renders
differently, and each renamed example now matches upstream's own literal (`<Avatar name="Navi"
size="md" />`, `<AvatarGroup size="lg">`).

One check worth keeping: `size="small"`/`"medium"`/`"large"` could in principle have belonged to
another component's union. It does not — the only other old-scale strings in `src/lib` are
`Text.type='large'` and `weight='medium'`, both unrelated to `size` — so the rename was safe to
apply by pattern.

### 1.2 `TabList.orientation` removed (0.2.0)

Removed as a misleading no-op: it never rendered vertical tabs, only toggled the keyboard-hint badge
arrows, and arrow navigation has always accepted both axes via `useListFocus`'s `orientation:
'both'`. Delete the prop, its type member, its demo-route usage and any test case asserting it.

**Done.** The prop, the `TabListOrientation` type (already barrel-absent, and gone upstream too) and
the demo-route prose are removed; `useKeyboardHint` is called without an orientation, matching
upstream's now argument-less call, and falls back to its own `'horizontal'` default for the badge.
The `id` argument stays — this port's hook cannot mint one itself (see `useLayer`).

The suite is **45 cases against upstream's 45**. Upstream kept
`does not set aria-orientation on the nav` but dropped the half that re-rendered with
`orientation="vertical"`, and rewrote the comment to _"TabList deliberately never sets this
attribute"_; the port follows exactly rather than deleting the case.

---

## 2. Workstream A — RTL (the spine of 0.2.0)

Four phases upstream, and only one is mechanical. **Do them in order** — the behavioural phases
assume the direction API exists.

### A1. The direction API — **LANDED**

`getLocaleDirection` (plain `.ts`), `useDirection` (`.svelte.ts`), `InternationalizationContextValue.direction`
and `InternationalizationProvider.dir` are in, exported from `i18n/index.ts` and the root barrel exactly
as upstream exports them. `Pagination` is the first consumer, flipping its prev/next chevrons.
Suites ported case-for-case: **5 + 5 against upstream's 5 + 5**.

**Both §9 decisions resolved by precedent rather than preference:**

- **`useDirection()` returns a getter**, not `{current}`. The port has 20+ context readers
  (`useAvatarSize`, `useFormLayout`, `useSideNavRenderMode`, …) and every one returns a getter;
  `{current}` is reserved for hooks that own their own `$state` (`useThemeMode`,
  `useStreamingText`). Here it is load-bearing, not stylistic: Svelte reads context once at init,
  so returning `get().direction` would freeze consumers at the mount-time direction and a runtime
  locale swap would leave chevrons pointing the wrong way.
- **`getLocaleDirection` lives in `i18n/`**, where upstream puts it — and it is a plain `.ts`
  module, deliberately. It exists to be called from a `+layout.server.ts` to set `<html dir>`, and
  those load through the plain Node resolver with no Svelte compiler; the `.svelte.ts` extension
  alone would make it unimportable from the one place it is for. Its suite is a **server-project**
  test for the same reason — running it with no DOM is the thing under test.

- `useDirection()` → `'ltr' | 'rtl'`, falling back to `'ltr'` outside a provider.
- `getLocaleDirection(locale)` — computes direction from a BCP 47 locale via
  `Intl.Locale.getTextInfo()`. Upstream markets it as safe to call from React Server Components; the
  Svelte counterpart is that it must stay a **pure module function** with no rune in it, so it can be
  called from a `+layout.server.ts` to set `<html dir>`.
- `InternationalizationProvider` gains an optional `dir` prop and **auto-derives `dir="rtl"`** from an
  RTL locale when it is omitted.

Port-specific: `useDirection()` returns a live value, so it follows this port's settled shape — a
getter or a `{current}` object, matching `useThemeMode`, **not** a snapshot. A destructured snapshot
would freeze direction at init, which is exactly the `useThemeHookUsage` trap already recorded.

### A2. Mechanical logical-CSS migration (phase 2) — **LANDED, 99 → 0**

**And "mechanical" was the wrong word for 19 of the 99 sites.** Before touching anything I ran every
site against upstream's _source_ (`scratchpad/a2-plan.mjs` maps our module → upstream file via the
oracle's own `CASES` table, then asks whether upstream spells that key physically or logically). The
verdict split:

| verdict   | sites | meaning                                                                |
| --------- | ----: | ---------------------------------------------------------------------- |
| `RENAME`  |    61 | upstream uses the logical key — safe rename                            |
| `RENAME*` |     5 | `textAlign: 'left'` → `'start'`, all four confirmed migrated upstream  |
| `BOTH`    |    14 | Calendar — the range pills migrated, the `::before` hit-target did not |
| `KEEP`    |    19 | **upstream is still physical — renaming would diverge from it**        |

**A blanket `--fix` would have been wrong on 19 sites**, which is what the warning in this section
was about, now measured rather than predicted. Those 19 each keep their physical spelling behind an
inline `eslint-disable` naming the reason, in three families:

- **Symmetric pairs** (Banner, ChatComposer, ChatComposerDrawer, FieldStatus, Calendar's
  `::before`) — both corners/sides of one axis set together, so the logical spelling emits identical
  CSS and physical keeps byte-parity with upstream's compiled classes.
- **A published physical API** — `DialogProps.position` takes `{top, right, bottom, left}` from the
  caller. Remapping those to logical insets would silently move a consumer's pinned dialog to the
  other side of the viewport under RTL.
- **Author data, not layout** — Markdown's `textAlign: 'right'` comes from a table's `---:`
  alignment marker, which means the literal right edge. Mapping it to `end` would re-align the
  author's column under RTL.

Three structural changes came with the renames, none reachable by a codemod: Calendar renamed its
style _groups_ (`rangeBgRadiusLeft` → `rangeBgRadiusStart`, and `roundLeft`/`roundRight` →
`roundStart`/`roundEnd` through `dayCellUtils`, `day-cell.svelte` and its suite); ChatMessageBubble's
grouped-tail radii became logical so the tail follows reading direction; and ResizeHandle replaced
its percentage hit-area bias with upstream's `hitAreaBiasDir` construction (see A3).

### A2 (original plan text)

Physical → logical inside `stylex.create()` only:

- `left`/`right` → `insetInlineStart`/`insetInlineEnd`
- `marginLeft`/`marginRight`, `paddingLeft`/`paddingRight`, `borderLeft*`/`borderRight*` → inline
  equivalents, kept as **separate start/end declarations**
- the four physical corner radii → diagonal-aware logical names
  (`borderTopLeftRadius` → `borderStartStartRadius`, …)
- value-based: `textAlign: 'left'|'right'` → `'start'|'end'`; `float`/`clear` likewise

A no-op in LTR with no visual change — which is precisely why it produces most of the 267 class
mismatches and why it is safe to do in bulk.

**Measured by the ported lint rule (§A4): 99 sites across 27 modules.**

| sites | module                                                |     | sites | module                                                            |
| ----: | ----------------------------------------------------- | --- | ----: | ----------------------------------------------------------------- |
|    26 | `calendar`                                            |     |     2 | `tab`, `tab-menu`, `markdown`, `field-status`, `dialog`, `button` |
|    12 | `banner`                                              |     |     2 | `chat-composer-input`, `chat-composer-drawer`                     |
|     8 | `chat-message-bubble`                                 |     |     1 | `base-typeahead`, `thumbnail`, `selector`, `use-popover`          |
|     7 | `resize-handle`                                       |     |     1 | `nav-heading-menu-item`, `field-label`, `avatar`                  |
|     4 | `lightbox`, `chat-layout`, `chat-composer`            |     |     1 | `dropdown-menu-item`, `code-block`                                |
|     3 | `table-header-cell`, `table-cell`, `date-range-input` |     |       |                                                                   |

**Do not blanket-`--fix`.** The rename is correct for most sites, but three things make a blind
autofix wrong. First, **upstream itself is not fully migrated** — its own rule ships at `warn`
because Calendar radii, Slider positioning and Table gradients were still physical at 0.2.0, so a
site we "fix" may diverge from upstream rather than match it. Second, several of these modules need
the _behavioural_ change in A3 as well, and the rename alone would leave them half-done and looking
finished. Third, `Slider` already proved it: the port there was not a rename but a rename **plus** an
RTL transform flip on `thumbHorizontal` — and the flip belongs on that key, not on `thumb`. Diff
against upstream's source per module; use `--fix` only where the diff says a pure rename is the whole
change.

### A3. Behavioural RTL (phases 4 and 4b) — **LANDED**

Two shared foundations first, both ported before any consumer: **`utils/rtl.stylex.ts`** (upstream's
`rtlStyles`, published under its own name because upstream publishes it) and
**`hooks/is-rtl-element.ts`** (module-private on both sides, as upstream keeps it).

`useListFocus` and `useGridFocus` both changed from `isRtl = false` to `isRtl ?? isRtlElement(container)`,
resolved **lazily and only for horizontal arrow keys** — `getComputedStyle` forces layout, and doing
that on every keystroke in a long list is the difference between free and measurable.

The mirror is applied to **eight** chevrons: TreeListItem, SideNavCollapseButton, Carousel ×2,
Lightbox ×2, the Table row-expansion pair, grouped-rows and the tree plugin. Seven wrap the rotating
span in an **outer** mirror span; Calendar's two compose onto the same element, and the difference is
not stylistic — `rtlStyles.mirror` and a state rotation are both `transform`, so sharing an element
makes one overwrite the other and the chevron is wrong _only_ in the expanded × RTL corner. Calendar's
`navIcon` carries no transform, so there is nothing to overwrite; upstream composes there too.

`Table`'s sticky columns needed both halves: the shadow gate now reads `Math.abs(el.scrollLeft)`
(spec-compliant browsers report a **negative** `scrollLeft` under RTL, so the start shadow would never
appear and the end shadow would never clear), and the strips' `transform`/`background-image` gained
explicit `[dir="rtl"]` branches because neither property has a logical form. `useScrollOverflow`
already used `Math.abs` — the port had half the fix and no way to notice.

`Slider` measures the pointer fraction from `rect.right` under RTL; `ResizeHandle` already had its
drag multiplier, so only the hit-area/pill restructure was outstanding.

**The original six-unit table, kept for the reasoning:**

| unit                                 | what actually changes                                                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Slider`                             | flips the centering transform under RTL **and measures the pointer/click value fraction from the inline-start edge** — a click at 25% of the track must map to **75**      |
| `Table` sticky columns               | `translateX` and gradient become direction-aware; visibility gates on `Math.abs(scrollLeft)`, because spec-compliant browsers report a **negative** `scrollLeft` under RTL |
| `ResizeHandle`                       | hit-area bias mirrors about centre; the pointer-drag delta reads the handle's computed direction                                                                           |
| `Carousel`                           | scroll buttons were a **no-op under RTL entirely**; chevrons mirror and the pills move to the correct edges                                                                |
| `ChatMessageBubble`                  | grouped-bubble tail corners use logical radii so the tail follows reading direction                                                                                        |
| `TreeList` / `SideNavCollapseButton` | compose `rtlStyles.mirror` on the icon wrapper **outside** the state rotation, so chevrons stay correct in every collapsed×expanded × LTR×RTL combination                  |

Plus `useListFocus` / `useGridFocus` auto-detecting direction for arrow keys, and `Calendar`'s
range-pill caps and month-nav chevrons.

`rtlStyles.mirror` is a shared transform — port it once, as its own module.

### A4. The lint rule — **LANDED, and now at `error`**

Flipped from `warn` to **`error`** once A2 closed, which is _stricter than upstream_ — upstream keeps
it at `warn` because its own core still has un-migrated properties. The port has none un-migrated,
only ~19 deliberate ones, each carrying an inline disable with its reason. And those disables cannot
rot silently: if upstream migrates one, its emitted atomic class changes and **the class oracle
reports the mismatch**. The rule guards new physical properties; the oracle guards the exceptions.

### A4 (as first landed)

Upstream's `no-physical-properties` is ported verbatim to
`packages/core/eslint-rules/no-physical-properties.js` and wired into `eslint.config.js`. The rule
logic is upstream's, unchanged — same two maps, same conflict guard, same autofix. Only the packaging
differs: upstream ships a plugin package with `strict`/`recommended` tiers; this port has one
consumer, so it is a local module registered directly.

It is registered globally rather than globbed at `*.stylex.ts`, because the rule already self-scopes
to `stylex.create()` calls and is inert in every file without one.

**At `warn`, deliberately and temporarily** — matching upstream's severity and reasoning. At `error`
every un-migrated module fails the gate before A2 has run. `pnpm exec eslint src` currently reports
**99 problems, 0 errors, 99 warnings**, so the lint gate stays green (exit 0) while the count doubles
as the A2 progress meter. **Flip to `error` when A2 and A3 land**; that instruction is recorded in
the rule's own header and beside the config entry, not only here.

Why it earns its place: the phase-2 migration is a **no-op in LTR**, so nothing renders differently,
no test fails, and the class oracle only notices once a module is already wrong. The lint rule is the
only mechanical guard that catches `left:` being reintroduced by the next component ported by hand.

---

## 3. Workstream B — new props on already-ported components

The part no class diff surfaces. Grouped by how much work each is.

**Large — one change, many components:**

- **`statusVariant` on the bordered input family (0.2.0).** `'attached' | 'detached'` (default
  `'attached'`, matching today) on **12** components: TextInput, TextArea, NumberInput, DateInput,
  DateRangeInput, TimeInput, Selector, MultiSelector, Typeahead, Tokenizer, FileInput, PowerSearch.
  Forwards to the underlying `Field`.
- **`statusVariant="tooltip"` (0.2.0)** on **7** of those (TextInput, TextArea, NumberInput,
  DateInput, DateRangeInput, TimeInput, FileInput). This one is not just a prop: it hides the status
  box and makes the on-field status icon **a real focusable button** — keyboard users tab to it with
  a visible ring, pointer users hover, touch users tap to toggle. The message is piped into both the
  input's and the button's `aria-describedby` and is Escape-dismissible.
- **`elevation` (0.1.9)** on **8**: Card, ClickableCard, SelectableCard, Button, IconButton,
  ButtonGroup, Banner take `'none' | 'low' | 'med' | 'high'`; ChatComposer takes `'none' | 'low'`.
  Defaults preserve today's look. _This is already visible in the oracle as `elevationStyles` groups
  absent from `button`/`button-group`/`card` — independent confirmation the changelog is complete._

**Medium — single components with real behaviour:**

- `Avatar` interactivity (0.2.0): `href`/`onClick`/`as`/`target`/`rel`, following Button's
  element-swap trichotomy. Inside `AvatarGroup`, interactive avatars and an interactive
  `AvatarGroupOverflow` **share one Tab stop with roving arrow focus**, and the group exposes a
  screen-reader hint via `aria-describedby`. A static facepile is unchanged.
- `Avatar.tooltip?: string | boolean` (0.1.9) — **adds a default tooltip to every named Avatar**, so
  this one changes existing rendering. Decorative avatars get none.
- `Outline` (0.1.8): roving-tabindex keyboard nav seated on the _active_ heading,
  `onNavigateStart`/`onNavigateEnd` (fires exactly once per start, even on interrupt; resolves on
  `scrollend`, with a settle timeout for Safari), `offset`, `scrollContainerRef`, `hasScrollOnClick`.
- `BreadcrumbItem.menu` (0.1.9) — turns a crumb into a menu trigger, accepting the DropdownMenu item
  API. Ships `Breadcrumb*` aliases of the item components.
- `DateInput.format` (0.1.9) — reuses Timestamp's vocabulary; **also adds `date_long` and
  `date_weekday` to Timestamp**, so the two components reach parity on date-only formats.
- `Timestamp.tooltipEntries` (0.2.0) — multi-timezone/format tooltip. Note the consequence upstream
  calls out: configuring entries attaches a tooltip to _absolute_ formats, which gives them a tab
  stop and focus ring they did not have, so a column of them gains one tab stop per row.
- `TreeList.variant` `'lineGuides' | 'noGuides'` (0.2.0), orthogonal to `density`.
- `OverflowList.maxVisibleItems` + `maxRows` (0.1.9) — bounded multi-row wrapping.

**Small:**

- `Collapsible.isDisabled` (0.1.8) — `aria-disabled`, drops out of tab order, does not collapse an
  open item.
- `Icon.label` (0.1.8) — collapses the three-attribute a11y dance into one prop.
- `Thumbnail.showRemoveOn` `'hover' | 'always'` (0.1.9).
- `Table.rowIndexStart` / `rowCount` (0.2.0) — `aria-rowindex`/`aria-rowcount` correct across
  pagination. Opt-in.
- `Citation.icon` accepts a node, plus a new `src` field (0.2.0); node wins when both are set.
- `Token.color` becomes module-augmentable via `TokenColorMap` (0.2.0), matching Badge and Button.
- `CommandPalette.label`, `HoverCard.label`, `CheckboxList` `accessibleLabel`, Table selection
  `getRowLabel` (all 0.1.9, all accessible-name fixes that arrive as props).
- `useTableTreeData.hasExpandAllControl` (0.1.9).
- `ChatComposerInput.onKeyDown` (0.1.9); `useChatComposerContext()` becomes public.

**Theme targets and `data-state` reflections** land across Calendar (`astryx-calendar-nav`, compound
`marker` state), CommandPalette group heading, Collapsible trigger and content, TreeList
(chevron/guide/item-label), the date family and the selector family. Each is a `themeProps` call plus
a documented target — cheap individually, but there are ~15 of them.

---

## 4. Workstream C — accessibility fixes (~30)

Several are WCAG-cited and a few change rendering. The ones with structural consequences:

- **`List` always emits an explicit `role="list"`** — the base style strips `list-style-type` for
  every variant, and Safari/VoiceOver drops the implicit role for such lists (WCAG 1.3.1).
- **The reset stops suppressing `:focus-visible` outlines on coarse-pointer devices** (WCAG 2.4.7).
  This touches `base.css`, which this port owns in full — see Phase 0.
- **`FileInput` no longer nests interactive controls** inside a `role="button"` trigger; the trigger
  becomes a visually hidden button alongside them in a non-interactive container (WCAG 4.1.2).
- **`AvatarStatusDot` pairs each variant with a distinct shape** — filled dot / ring / minus bar — so
  status is not colour alone (WCAG 1.4.1), with a new `astryx-avatar-status-dot-glyph` target and a
  `data-shape` attribute.
- **Focus-trap Escape resolves by DOM depth** instead of push order; `aria-hidden` subtrees leave the
  tab cycle; live regions auto-clear after announcing.
- **`Dialog` auto-labels from `DialogHeader`** via `aria-labelledby`, and **warns in development**
  when an open dialog is unnamed.
- **`Text`: an explicit `size` now overrides a themed `type`'s font-size.** The size class sat in
  `astryx-base`, below the theme layer's per-type rule, so `<Text type="supporting" size="xsm">`
  silently kept the type's size. **Themes must re-emit the size classes in the theme layer** — this
  is a _theme-compiler_ change, not a component one.
- `prefers-reduced-motion` honoured in ChatToolCalls, ChatLayoutScrollButton, ChatDictationButton,
  `useChatStreamScroll` (the follow spring falls back to the instant jump) and Dialog's entry
  animation.
- Announcement fixes in Calendar, CommandPalette, MultiSelector, Tokenizer, NumberInput, Divider,
  Spinner, Field/FieldStatus (persistent live regions).
- Semantics fixes in Carousel (APG slide roles), Item (`aria-selected` only where the role permits),
  MobileNav (`aria-expanded`/`aria-controls`), TopNav (menu semantics without a modal wrapper, full
  APG keyboard pattern), SideNav/TopNav collapsed heading popovers, Slider (group label via
  `aria-labelledby`, required via description, clamped values, sibling-constrained range bounds).

### 4.1 These retire some of the port's own Known debts

Worth checking each off rather than re-deriving later. 0.1.9 fixes **exactly** two of the
"closed-prop-list roots" this port documented as upstream contradictions:

- **`FieldLabel` now forwards `className`/`style`/`xstyle` and pass-throughs.** Our debt entry says it
  "drops the props its type promises"; upstream agrees now. The entry retires, and its consequence —
  _"this is why its `forwards ref correctly` case has no attachment counterpart"_ — needs re-checking.
- **`ChatSendButton` now forwards `className`, `style` and rest props.** Our entry called it the
  _widest_ of these roots. It retires too.

Also relevant: `Divider`'s rest-prop spread order is fixed upstream (consumer attributes can no longer
overwrite `role="separator"`), `CommandPalette` and `DropdownMenu` now forward BaseProps
pass-throughs. **Re-read the whole Known-debts "closed-prop-list roots" block against 0.2.0** — the
port forwarded rest in every one of these cases, so where upstream has caught up the divergence
simply ends.

---

## 5. Workstream D — genuinely new surface

| unit                                                                | release       | notes                                                                                                                                                          |
| ------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DropdownMenuCheckboxItem`                                          | 0.1.8         | `role="menuitemcheckbox"`, independent toggle                                                                                                                  |
| `DropdownMenuRadioGroup` + `DropdownMenuRadioItem`                  | 0.1.8         | `role="menuitemradio"`, single-select                                                                                                                          |
| `ContextMenu*` re-exports of the three                              | 0.1.8         | already the port's deferred "selectable trio"                                                                                                                  |
| `DropdownMenuContext`, `useDropdownMenuContext`, `DropdownMenuSize` | 0.1.8         | now public, for custom items                                                                                                                                   |
| `DropdownMenuSubMenu`                                               | 0.2.0         | flyouts open inline-end with auto-flip, hover-intent, Right/Enter/Space to open, Left/Escape to close and restore focus. Also works via a nested `items` array |
| `menuItemHover.ts`, `menuItemRoles.ts`                              | 0.2.0 / 0.1.8 | shared helpers the above need                                                                                                                                  |
| `useTableTreeState` + `useTableTreeData`                            | 0.1.8         | **already ported** from source; 0.2.0 is the first release whose _dist_ ships them, so the release-gated skip becomes a real oracle case                       |
| `useTableRowStatus`                                                 | 0.1.9         | new plugin: a narrow status column, `getStatus(item) → {color, icon?, label?}` or `null`                                                                       |
| `useDirection`, `getLocaleDirection`                                | 0.2.0         | see A1                                                                                                                                                         |

The control size on the selectable items derives from the menu's item size and **swaps to the row's
inline-end on touch** — which is an RTL-adjacent detail, so schedule this after A2.

---

## 6. Workstream E — themes

Measured against 0.2.0, and much smaller than the component side:

- **One real value change:** neutral's `--color-border` light value `#ebebeb` → `#00000014`.
  (Upstream's note: Card's bordered variant now rests on the subtle `--color-border` rather than
  `--color-border-emphasized`, so the frame matches neighbouring dividers.)
- **11 declarations missing per theme**, consistent across neutral/matcha/gothic/butter — the type
  scale gained **`4xs` and `3xs` steps** (`.astryx-text.size-4xs`, `size-3xs` lead the list).
  Upstream declaration counts moved: neutral 331→342, matcha 295→306, gothic 334→345, butter 422→433.
- **The `Text` size-vs-type cascade fix (§4)** is a theme-compiler change: themes re-emit the size
  classes in the `astryx-theme` layer.
- **`astryx theme build` multi-word component keys** — upstream's known-component registry used
  de-hyphenated keys (`.astryx-textinput` instead of `.astryx-text-input`), so overrides authored
  against them emitted dead selectors. **Check whether this port replicated the bug**; the theme
  compiler here was written from upstream's, so it may well have.

---

## 7. Workstream F — tests, docs, demo routes

- **Upstream suites that changed must be re-ported case-for-case**; the count is the contract. New
  props arrive with new upstream cases, and the a11y fixes come with assertions.
- **The docs backlog has reopened — measured, 2026-08-05.** The generator now reports **202
  documented / 208 upstream**, **599 examples ported / 23 pending**, and **44 documented props across
  32 components that core does not declare**. Note the estimate was wrong in the safe direction: the
  changelog implied 206 entries and upstream shipped **208**, which is exactly why the standing rule
  says read the number rather than predict it. The 44-prop list is workstream B's work list arriving
  pre-measured. Expect per-target duplication for anything reached through `alsoExampleFor`.
- **A sixth content-block type, `heading`** (`{type, level: 3|4|5|6, text}`), lands in
  `docs-types.ts`. It is already ported (see below) because it broke the build, but the _outline_
  half is not: upstream's `ReferenceDocView` seats these headings in the page outline at their own
  level via `AnchorHeading`, and `DocPageLayout`'s outline items are flat `{id, label}` here. That is
  a docs-shell change, scheduled for 17c.
- Documentation-only upstream change: `width` is now documented across **17** input doc files.
- **Demo routes** need the new props, the two breaking-change migrations, and (new here) an **RTL
  toggle** — upstream added a global Direction control to Storybook, and without an equivalent none of
  workstream A is verifiable by eye.
- **`Tokenizer`/`PowerSearch` `startIcon`** was always implemented but undocumented and untested
  upstream; 0.1.9 adds the doc entries and tests. Check whether the port documents it.

---

## 8. Sequencing — split into 17a / 17b / 17c

**Decided 2026-08-05.** This is comparable in size to batch 16 (`Chat`, 7,311 LOC) and larger in
surface area, because it touches ~40 already-ported components instead of adding one directory. It is
split into three sub-batches, **each closable with its own green gate** — which is the point of the
split, since a single batch this size would sit red for its whole life and lose the signal that a
green gate carries.

The dependency order below is real, not preference.

### Batch 17a — breaking changes + RTL

_The foundation. Everything else assumes the direction API exists and the CSS is logical._

1. ~~**§1.1 Avatar size scale** and **§1.2 `TabList.orientation`**~~ — **DONE.** First, because they
   touch call sites everywhere — doing them late means re-touching every file the later sub-batches
   edited. Landed with a green build/check/lint and the docs-`heading` block fixed along the way (it
   blocked the build; see §7).
2. **A1 direction API** (`useDirection`, `getLocaleDirection`, `InternationalizationProvider.dir`).
3. **A2 mechanical logical-CSS** — 99 sites, 27 modules. The bulk of the oracle's 267 mismatches and
   the lowest-risk part, so it buys a mostly-green oracle early, which is what makes every _later_
   mismatch meaningful.
4. **A3 behavioural RTL** — the six units in the table above.
5. **A4 flip the lint rule to `error`** (the rule itself has already landed).

**Gate — met, with one number better than planned and one worse:**

|                            | planned               | actual                                         |
| -------------------------- | --------------------- | ---------------------------------------------- |
| `no-physical-properties`   | 0 warnings            | **0**, and the rule is at `error`              |
| skip list                  | 4 entries (14 retire) | **0 entries** — every remaining skip was stale |
| `build` / `check` / `lint` | exit 0                | exit 0 (1,630 files, 0 errors, 33 warnings)    |
| class oracle               | "at or near 0"        | **81** — see below                             |
| RTL toggle                 | demo routes           | landed, in the topbar                          |

**The oracle number is not an A2/A3 failure.** 267 → 81, and the remainder is **17b/17c** work, not
RTL debt: `AvatarStatusDot`'s WCAG 1.4.1 shape-per-variant (4), `prefers-reduced-motion` across the
chat surfaces + `progress-bar` + `layer-animations` (~13), and the class changes riding along with
new props on Timestamp, Carousel, CodeBlock, SideNav, `use-trigger-menu` and
`avatar-group-overflow`. Driving it to 0 requires those, which is exactly why the batch is split — a gate
that mixes two sub-batches' work tells you nothing about either.

**The RTL toggle applies `dir` in two places, and that is the point of it:**
`InternationalizationProvider dir` drives the JavaScript half (`useDirection`, pointer math, arrow
keys) and a `dir` attribute on a real element drives the CSS half, since logical properties resolve
against the DOM and know nothing about a Svelte context. Setting only one produces a half-flipped
page that reads as a component bug. Upstream's Storybook decorator does the same two things.

### Batch 17b — new surface + new props

_Additive. Nothing here changes existing rendering except where noted._

1. **Workstream D** (§5) — the DropdownMenu selectable trio, `DropdownMenuSubMenu`, the `tree`
   plugin's oracle case, `useTableRowStatus`. Self-contained, and the selectable items' touch
   behaviour wants A2 done.
2. **Workstream B** (§3), largest fan-out first: `statusVariant` (12 components), then the
   `"tooltip"` variant (7, and it is real behaviour — a focusable status button), then `elevation`
   (8), then the singles.

**Watch:** `Avatar.tooltip` **changes existing rendering** — every named Avatar gains a default
tooltip. Audit demo routes and docs blocks that supply their own `Tooltip`/`HoverCard` and set
`tooltip={false}`.

**Gate:** class oracle 0 mismatches; every new prop exercised on a demo route; `pnpm -F docs generate`
0 pending (7 new `.doc.mjs` land here).

### Batch 17c — a11y, themes, docs

1. **Workstream C** (§4) — ~30 fixes. `base.css`'s `:focus-visible` change and the `Text`
   size-vs-type cascade fix touch shared foundations, so land them where they can be verified in
   isolation rather than buried among component edits.
2. **§4.1** — retire the Known-debts entries upstream has now fixed (`FieldLabel`, `ChatSendButton`,
   and re-read the whole closed-prop-list block).
3. **Workstream E** (§6) — themes, after the `Text` fix, since they share the theme layer.
4. **Workstream F** (§7) — the full docs regeneration and the four audit agents.

**Gate:** the full done-criteria list in §10.

### Throughout

**Workstream F is not a trailing task.** Docs blocks, demo-route sections and ported test cases fold
into each unit's slice as it lands — the standing rule from batch 8 onward — with one full generate
and one full gate at each sub-batch's close.

---

## 9. Open decisions

- [x] **Adopt `no-physical-properties`?** **Yes — landed** (§A4), ported verbatim, at `warn` until
      A2/A3 close.
- [x] **Split into 17a/b/c?** **Yes — see §8.**
- [ ] **`useDirection()`'s shape** — getter vs `{current}`. Follow `useThemeMode`; record it either way.
- [ ] **Does `getLocaleDirection` belong in `utils` or `i18n`?** Upstream puts it with the i18n
      provider; the port's `./i18n` subpath is the natural home.
- [ ] **`Avatar.tooltip` changes existing rendering** — every named Avatar gains a tooltip. Confirm the
      demo routes and docs blocks that wrap Avatar in their own Tooltip get `tooltip={false}`.
- [x] **Does the theme compiler have upstream's de-hyphenated-key bug?** (§6) **No — and it
      cannot.** The bug was in the _CLI's_ `KNOWN_COMPONENTS` registry (`astryx theme build`'s
      list of suggested override keys), not in `generateThemeRules`, which passes the author's
      key through `stableClassName` verbatim on both sides. This port's `packages/cli` has no
      sources yet (Phase 4), so there is no registry to carry the bug. **It becomes a real
      question the moment the CLI's theme-build command is written** — the registry must be
      generated from, or cross-checked against, the `themeProps()` literals in component source,
      which is exactly the regression test upstream added alongside its fix.

## 10. Done criteria

- `pnpm -r build`, `pnpm -r check`, `pnpm -r lint` exit 0.
- Class oracle: 0 mismatches, and **the skip list is 4 entries, not 18** — the 14 release-gated skips
  must be _deleted_, not left to rot (they already report themselves stale).
- Five theme oracles: 0 mismatches in both directions.
- Every changed upstream suite re-ported case-for-case, counts stated per suite.
- `pnpm -F docs generate` reports 0 pending blocks, and the number is read rather than predicted.
- The four audit agents run at close: `astryx-parity`, `astryx-idiom`, `astryx-test-parity`,
  `astryx-surface`.
- Demo routes carry an RTL toggle and every new prop.

## 11a. Progress (measured 2026-08-06)

|                              | at 0.1.7    | first run vs 0.2.0 | now (2026-08-07)                         |
| ---------------------------- | ----------- | ------------------ | ---------------------------------------- |
| class oracle mismatches      | 0           | 267                | **0**                                    |
| oracle skips                 | 18          | 18 (14 stale)      | **3** (one cause: RTL keyframes, §below) |
| `no-physical-properties`     | rule absent | 99 warnings        | **0**, rule at `error`                   |
| docs: props core lacks       | —           | 44 across 32       | **0**                                    |
| docs: example blocks pending | —           | 23                 | **0** (623 ported)                       |
| i18n catalog keys            | 188         | 188 (31 behind)    | **219**, byte-identical + `fr-FR`        |
| `build` / `check` / `lint`   | exit 0      | —                  | **exit 0**                               |

**Workstreams B and D are closed.** What remains of batch 17 is 17c: the ~30 a11y fixes, the
Known-debts entries upstream has now fixed, and the final audit pass. Two findings from the tail are
worth carrying past this batch:

1. **A hook's option bag is invisible to the docs prop check.** `useTableTreeData.hasExpandAllControl`
   (0.1.9) went unported through two audits because the generator counts documented _props_ core
   lacks and a hook config is not a props interface — while the class oracle was green on the very
   styles the missing control would have used. Neither gate can see it; only reading the changelog
   against the source can.
2. **The class oracle cannot see a `stylex.create` function style at all** (54 across 32 modules).
   `extractGroups` requires `$$css: true`, which an arrow value does not carry. A clean run means
   "every _static_ style matches". Recorded at the head of the script and under Known debts.

**Landed.** Both breaking changes; the direction API + `Pagination`; the full logical-CSS
migration; behavioural RTL (`rtlStyles`, `isRtlElement`, list/grid focus auto-detect, eight mirrored
chevrons, Table sticky columns, Slider pointer math, ResizeHandle); the lint rule at `error`; the
demo RTL toggle; the `heading` content block; `elevation` on 7 components; `Switch.size`; the i18n
catalog resync; and the whole **status-variant family** — `statusVariant` on all 12 bordered
inputs, `statusVariant="tooltip"` on the 7 that take it, `useInputStatusIcon` +
`<InputStatusIcon>`, `FieldStatus`'s detached leading icon and its move to live-region
announcement.

Also landed since: `Icon` (`label` + `xstyle`/`class`/`style` composition, and its 31-case suite,
which had never been ported), `Table.rowIndexStart`/`rowCount`, `TreeList.variant`,
`CommandPaletteInput.label`, `HoverCard.label` (and the `aria-label` pass-through `Layer` needed for
it), and the full `Thumbnail` re-port.

**All landed.** The docs generator prints the remaining prop list exactly — read it, don't
re-derive it (`pnpm -F docs generate`, "documented prop(s) … not declared by core"). It now prints
**nothing**: the four rows below all closed, plus `useTableRowStatus`, `hasExpandAllControl` and the
19-block example backlog.

| component   | props                                                            |     |
| ----------- | ---------------------------------------------------------------- | --- |
| `Avatar`    | `tooltip`, `href`, `as`, `target`, `rel`                         | ✅  |
| `Outline`   | `onNavigateStart`, `onNavigateEnd`, `offset`, `hasScrollOnClick` | ✅  |
| `DateInput` | `format`                                                         | ✅  |
| `Timestamp` | `tooltipEntries`                                                 | ✅  |

**`Avatar.as` was not the open decision it was booked as** (see §11a's note below, now resolved):
this port's `useLinkComponent()` already returns a resolver taking an `as` override, so the prop is
a pass-through. The real finding was that `Avatar` **and `Button`** rendered a hard-coded `<a>`,
bypassing `LinkProvider` entirely — 8 of upstream's 10 `as`-bearing components had it here. Both now
route through `LinkElement`.

**The prop list understates three of the original six, and the sizing matters.** The generator
counts _documented props core lacks_; it cannot see the module or the algorithm behind one — and
`BreadcrumbItem`'s two turned out to be the clearest case of all:

- ~~**`OverflowList.maxVisibleItems` / `maxRows`**~~ — **DONE**, and it was indeed not two props:
  `hooks/compute-overflow.ts` is now a pure module of its own (34/34 cases, in the **server**
  project since it holds no DOM), `use-overflow.svelte.ts` delegates to it and gained
  `rows`/`rowHeight` plus the `max < min` dev warning, and `OverflowList` gained the
  `containerMultiRow` group and the `multiRowHeight` dynamic `maxHeight`. Suites: `computeOverflow`
  34/34 new, `useOverflow` 20 → **26/26**, `OverflowList` 14 → **18** (upstream's 19 less
  `displayName`).
- ~~**`BreadcrumbItem.menu` / `menuSize`**~~ — **DONE**, and these two props pulled in an entire
  workstream. `menu` reuses the DropdownMenu item pipeline, so it first needed `useListFocus` to
  gain `boundarySelector` / `ownsEvent` / `getItems` (0.2.0 infrastructure `DropdownMenu` and
  `ContextMenu` had already drifted from). Wiring that surfaced that **0.2.0's published dist
  compiles the selectable trio and `DropdownMenuSubMenu`** — so workstream D's stale-dist deferral
  was already void and came along in the same change: `DropdownMenuCheckboxItem`,
  `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSubMenu`, `menuItemHover.ts`, the
  nested-`items` submenu branch in `renderDropdownItems`, and all three families' aliases. All four
  new `.stylex.ts` modules matched on the first oracle run (0 mismatches, still 0 skips). Suites:
  `Breadcrumbs` 25 → **37/37** (nothing dropped), plus **6/6** selectable and **17/17** submenu.
  **The lesson to carry: re-check every stale-dist deferral at each pin bump before planning around
  it** — it is one `ls` of the dist directory, and here it moved a whole workstream from "next" to
  "already unblocked".
- **`Avatar`'s five props** drag along more than interactivity: two new style groups
  (`focusable`, `interactive`), a merged `fallback` group with `--_avatar-fallback-*` derived vars,
  a `borderRadius` on `wrapper`, the `data-avatar-item` marker AvatarGroup's roving focus selects
  on, and `tooltip?: string | boolean` — which **changes existing rendering** for every named
  avatar. It also needs a decision recorded below.
- **`Timestamp.tooltipEntries`** comes with a new `tooltipEntries.ts` module (`formatTooltipLines`)
  _and_ the `date_long`/`date_weekday` formats `DateInput.format` reuses, so those two entries are
  one unit, not two. Both sit on a third new thing: `utils/plainDate.ts` gained a `SharedDateFormat`
  union, a `SHARED_DATE_FORMAT_OPTIONS` bag and `formatSharedDate()` — the shared vocabulary
  `DateInput`'s named-format path and `Timestamp`'s switch both read. **This port's
  `utils/plain-date.ts` has none of the three**, so the shared layer lands before either prop.

**One open decision, on `Avatar`.** Upstream composes the avatar's accessible name from the status
element's own `label` — `getStatusLabel(status)` calls `isValidElement(status)` and reads
`status.props.label`, giving "Jane Doe, Online" through `@astryx.avatar.nameWithStatus`. A Svelte
`Snippet` is opaque: it has no props to inspect. The options are (a) the registration-based
`Children` substitute this port already uses for `FieldStatus`/`FormLayout`/`MetadataList`, which
works but publishes the label _after_ the wrapper's `aria-label` is emitted and so is wrong under
SSR; or (b) an explicit `statusLabel` prop, which is an invented prop and a parity defect. Settle
this before porting Avatar, not during.

Plus: the remaining **92 oracle mismatches** (`chat-tool-calls` 12, `chat-layout-scroll-button` 8,
`carousel` 8, `side-nav`/`code-block`/`avatar` 6 each, then a long tail — most will fall out _with_
the props above rather than needing separate work), workstream D's new surface (the DropdownMenu
selectable trio, `DropdownMenuSubMenu`, `useTableRowStatus`), the ~30 a11y fixes, the themes, **23
pending docs examples**, and the four audit agents.

**Three findings from the status-variant stretch, each generalising past it:**

1. **Nothing checks the i18n catalog.** `locales/en.json` was **31 keys behind** upstream and no
   gate reported it: a missing key falls back to the key string at runtime, silently. Both oracles
   read compiled CSS; the docs generator reads props. The catalog is now copied verbatim (219 keys,
   byte-identical, prettier-ignored so it stays that way) and upstream's partial `fr-FR.json` came
   with it. **Make the resync an explicit step of every pin bump.**
2. **`useAnnounce` is a test-visibility hazard, not just a component detail.** Moving `FieldStatus`
   onto the persistent live regions puts a `role="status"` and a `role="alert"` element on
   `document.body`, which broke three cases in two _unrelated_ suites (`checkbox-list`'s spinner
   query, `number-input`'s two invalid-input alerts). Container-scoped `screen.locator` is the fix
   and `date-input.svelte.test.ts` had already documented it for `Calendar`. Every future
   announcing component will break the same class of assertion.
3. **`Thumbnail` was carrying machinery upstream had already retired.** Its remove button used to
   sample the picture underneath it (`useImageMode` + APCA + an inverted `<MediaTheme>`) so the
   glyph would read on any image. 0.1.9 replaced that with a fixed translucent scrim and an
   `--color-on-dark` icon — and the hook is _still exported_ upstream, just no longer called by any
   component. A `.d.ts` diff sees nothing; the oracle only saw it as four mismatched style keys.
   **A prop being unchanged does not mean the code behind it is**, which is the same reason this
   batch's method starts from the changelog rather than from the type surface.

4. **A `!inputGroup` guard upstream applied to two of four inputs.** `TextInput`/`NumberInput` got
   it in 0.2.0 with an explanatory comment; `TimeInput` correctly does not need it (it renders an
   in-group status element); `DateInput` needs it and does not have it, so upstream's
   `aria-describedby` there points at nothing. Assuming a family-wide change is uniform is what
   would have hidden this — the guard had to be checked per component against the source.

## 11. Measured baseline (2026-08-05, before the batch)

|               | at 0.1.7                                            | against 0.2.0                                                           |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| class oracle  | 1,398 keys + 591 inline, **0 mismatches**, 18 skips | 1,428 keys checked, **267 mismatches / 39 components**, 14 skips retire |
| theme oracles | 1,719 declarations, 0 mismatches                    | 1 mismatch (neutral `--color-border`), 11 missing per theme             |
| tests         | 160 files, 3,883 passed, 1 skipped                  | unchanged (not yet re-ported)                                           |
| docs          | 599 blocks, 0 pending; 200/201 entries              | 206 upstream `.doc.mjs` (+7)                                            |

Progress since: **267 → 221**. The oracle's `ENOENT`-on-moved-file crash is fixed, the `TreeList`
family is clean (marker deleted upstream; `wrapper` moved object→inline with no declaration change),
and `Slider`'s styles are clean with its pointer math still outstanding.
