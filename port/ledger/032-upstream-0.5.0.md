---
seq: 032
title: Batch 32 — upstream 0.5.0
upstream: 0.5.0
date: 2026-08-25
units: [neutral-theme, Layout/padding, Layout/container, disabled-interaction-sweep]
upstream-prs: [4881, 5255, 5323, 5247, 5352]
---

## Scope

Tracking `@astryxdesign/*` 0.4.5 -> 0.5.0. The jump swallows 0.4.6 and 0.4.7, which this port
never pinned.

Measured before any porting (`git diff v0.4.5..v0.5.0`, and `node scripts/status.mjs` with the
reference clone checked out at `v0.5.0`):

| Dimension                                  | Delta                                             |
| ------------------------------------------ | ------------------------------------------------- |
| `packages/core/src` files changed           | 354 (+28,913 / -1,801)                            |
| Component dirs upstream                     | 103 -> 104                                        |
| Component dirs added                        | `Stepper` (promoted out of `lab`)                 |
| Component dirs removed / renamed            | none                                              |
| Component dirs touched                      | 79                                                |
| Upstream test suites                        | 256 -> 275                                        |
| Upstream declared cases                     | 6383 -> 7041 (+658)                               |
| — in suites with no counterpart here        | 21 suites / 367 cases                             |
| — of which arrived as new upstream files    | 20 files / 323 cases                              |
| — added inside suites that already existed  | +335 cases, across 59 suites                      |
| Class-oracle mismatches after the re-pin    | 0 -> 427                                          |
| Barrel additions                            | `Stepper`, `MediaThemeMode`                       |

Two changes upstream calls breaking:

- **`Banner`**: the disclosure axis collapses onto one `collapsible: boolean | CollapsibleConfig`
  prop backed by the shared `useCollapsible` hook; `defaultIsExpanded` is removed (#5255).
- **`Layer`**: every overlay's own Escape listener is replaced by one shared dismissal stack
  (`useLayerDismissal`), with an `escapeBehavior` of `close` | `block`, IME-composition guards, and
  top-most resolved from tree nesting rather than DOM containment (#4881).

## Units

### `neutral` theme — the error red fails AA (landed)

Upstream moved the saturated error stop one tonal step, `#e33f4a` -> `#c9303a`: the old stop pairs
with its white label at 4.14:1, and a 12px/500 label wants AA's 4.5 rather than the 3:1 large-text
allowance. Three declarations (`badge`, `statusdot`, `progressbar`), in **both** copies of the file
— `packages/themes/neutral/src/` and the CLI's bundled template. `--shadow-inset-error` keeps
`#e33f4a4D`; upstream did not move it.

The file header's "pass WCAG AA (5.6–9.6 contrast)" was a false claim on our side too, and is
replaced rather than re-ranged.

Theme oracle: 3 -> 0.

### `Layout/padding` + `Layout/container` — the overlay padding boundary (#5352, #5208) (landed)

`padding.stylex.ts` gains six per-edge groups (`paddingInlineStart/End`,
`containerPaddingInlineStart/EndVar`, `paddingBlockStart/End`) and `overlayPaddingReset`, and the
propagation variable is renamed `--astryx-section-padding` -> `--_section-padding-propagated`.

The rename is the load-bearing part. The public token is the *theme's* section padding, set once at
the theme root; the propagated one is *an ancestor `Section`'s* padding. An overlay leaves its
parent's visual box while staying its DOM descendant, so it has to drop the inherited value at its
boundary without dropping the theme's — impossible while both live under one name.
`container.stylex.ts` now reads the propagated name ahead of the public one, so a propagated value
still wins for nested sections.

Class oracle: 427 -> 341 (the two modules' own 26, plus 60 downstream of the section chain).

### The disabled-interaction sweep (#5323, #5247) (landed)

The single largest share of the drift, and one coherent unit rather than 71 small ones:

- Every `cursor` in core carries `':is(:disabled,[aria-disabled="true"])': 'default'` — 71 upstream
  files.
- Every `cursor: 'not-allowed'` becomes `'default'` — 36 files. Upstream's reasoning: a disabled
  control sealed behind `pointer-events: none` shows whatever its ancestor shows, so one cursor
  everywhere beats a stronger one that can only be painted on half of them.
- Every self-`:hover` takes the zero-specificity guard
  `':hover:where(:not(:disabled,[aria-disabled="true"]))'` — 46 files. `:where()` contributes no
  specificity, so existing overrides weigh what they weighed before.
- `reset.css`: `:where(:disabled)` becomes `:where(:disabled, [aria-disabled='true'])`.
- `theme/generateThemeRules.ts`: a themed `:hover` gets the same guard spliced in, with any
  pseudo-element kept last (`HOVER_DISABLED_GUARD`, +88 lines, +8 cases).

Applied here as one mechanical pass over `src/lib/**/*.ts`, then verified by the oracle rather
than by review — 148 declarations in 70 files (104 cursors made conditional, 44 `not-allowed` ->
`default`), 84 hover keys in 41 files, plus `base.css` and `generate-theme-rules.ts`.

Two shapes needed care. `stylex.when.ancestor(':hover')` is an **ancestor** hover, not a self-hover;
upstream left all 23 of its own untouched and so did we (27 here). And a pseudo-ELEMENT has to end
the selector, so `':hover::after'` takes the guard spliced in before the `::after` rather than
appended — `guardHoverPseudo` does the same splice for themed rules.

`generate-theme-rules.ts` also picked up upstream's second change in the same file: `paddingTop` and
`paddingBottom` now normalise to `paddingBlockStart`/`paddingBlockEnd` and join the container
expansion. `paddingLeft`/`paddingRight` deliberately do not — they are direction-relative, and the
expansion's tokens are consumed by logical properties, so mapping them would move the padding to the
opposite edge in RTL.

Upstream keeps the sweep from rotting with two lint rules (`@astryx/no-hover-on-disabled` and its
cursor counterpart) and a Chromium sweep over every story. Neither exists here; the oracle is what
catches a regression, and only for a module it already covers.

Class oracle: 341 -> 103.

### `Stepper` / `Step` — not started

New component dir, promoted out of `lab`. 9 files, 48 test cases, its own `.doc.mjs` pair, and an
animated connector whose only animating case is a single forward step.

### `Layer` — one dismissal stack (#4881) — not started

The batch's deepest change. `useLayerDismissal` + `layerStack.ts` + `LayerDepthContext` +
`useTouchTrigger` replace every overlay's own Escape listener. 4 new upstream suites, 52 cases.

### `Banner` — `collapsible` (#5255) — not started

`defaultIsExpanded` removed; the axis becomes `boolean | CollapsibleConfig` over the shared
`useCollapsible` hook.

### `DateInput` touch surface — not started

7 new source files (`TouchDateField`, `MonthScroller`, `MonthYearWheels`, `Wheel`, `monthGeometry`,
`useOwnScrollGesture`, `usePointerDragScroll`, `useScrollSettle`) and the batch's single largest
suite at 134 cases.

### Remaining, by size

`TabList` (scrolling strip + `role="tablist"`, #5348/#5349), `DateTimeInput`
(`timeOptionInterval`), `Selector`/`MultiSelector`, `Table` plugins, `PowerSearch`, `Markdown`
source ranges, `useMergedRefs`, `i18n/useLocale` + `useCollator`, `hooks/useAutoMediaMode`,
`hooks/scrollbarGutter`, `MediaTheme`, `Item.layout`, the CLI's `v0.5.0` codemod directory and
theme-targets API.

## Oracle bookkeeping

The 0.4.5 baseline was **measured**, not assumed: the 0.4.5 tarball was unpacked over
`packages/core/node_modules/@astryxdesign/core` and the oracle re-run — 1635 style keys, 0 skipped,
**0 mismatches**. Everything below is 0.5.0 drift.

| Stage                                   | Class oracle | Theme oracle |
| --------------------------------------- | ------------ | ------------ |
| After the re-pin                        | 427          | 3            |
| After `neutral` error red               | 427          | **0**        |
| After `Layout/padding` + `container`    | 341          | 0            |
| After the disabled-cursor sweep         | 173          | 0            |
| After the hover-guard sweep             | 103          | 0            |
| After the four parallel component units | 47           | 0            |
| After `Item`, `Selector`, `PowerSearch` | **42**       | 0            |

Style keys checked went 1656 -> 1723 with the six new padding groups. The skip list is still empty
and needs no entries so far: nothing in this bump is a case of the tarball lagging source.

Remaining 42, by module — each a per-component feature port rather than a sweep:

`item`(6) `date-time-input`(5) `slider`(4) `mobile-nav`(4) `selector`(3) `number-input`(3)
`segmented-control-item`(2) `radio-list-item`(2) `dialog`(2) `avatar-group-overflow`(2)
`power-search`(1) `media-theme`(1) `input-clear-button`(1) `chat-composer-input`(1) `button`(1)
`blockquote`(1) `base-typeahead`(1)

`item`'s six and `selector`'s three are **inline call-site combinations**, not missing styles: the
compiler folded new permutations upstream (`Item`'s three content wrappers × the inline layout, and
`Selector`'s `renderValue` box) and the oracle's hand-maintained `inline:` lists have not been
extended to claim them. `date-time-input`'s five include a whole `timeOptionSizeStyles` group that
belongs to the unported `timeOptionInterval` combobox.

`compare-upstream-classes.mjs` is this batch's merge hazard: three of the four parallel units needed
to edit it, and its inline claim lists are hand-maintained. It survived, but a fourth concurrent
editor would not have.

## The props delta, as the docs generator measures it

`pnpm -F docs generate` reads upstream's `.doc.mjs` against our built `dist/**/*.d.ts`, so it states
the API gap without anyone assembling a list: **38 documented rows across 22 entries** that core does
not declare, and 221 documented components against upstream's 229.

    Banner: collapsible                    Section: paddingInline, paddingInline{Start,End},
    Center: paddingInline{Start,End},               paddingBlock{Start,End}
            paddingBlock{Start,End}        SelectorOption: layout
    ChatMessageList: align                 Stack/HStack/VStack: paddingInline{Start,End},
    DateTimeInput: timeOptionInterval                           paddingBlock{Start,End}
    HoverCard/useHoverCard: touchTrigger   Tab: panelId
    Item: layout                           TabList: overflow
    MultiSelector: formatValue             useTableSelection: hasRowHighlight
    PowerSearch: maxSearchResults          Tokenizer: menuWidth
    Tooltip/useTooltip: touchTrigger       BaseTypeahead: menuWidth
    MediaTheme: fallback

The `padding*Start`/`padding*End` rows across `Center`, `Section` and the `Stack` family are the
consumer half of the six new `padding.stylex.ts` groups — the modules landed, the props have not.

## What the audits caught

<!-- astryx-parity, astryx-idiom, astryx-test-parity, astryx-surface -->

### `Item` — `layout="inline"` (landed)

`layout?: 'stacked' | 'inline'` with the `inlineContent` / `inlineLabel` / `inlineDescription` trio.
`isInline` is `layout === 'inline' && description != null` — with nothing to inline the layout falls
back to stacked — and an inline row is one line by definition, so its description always ellipsizes
even when it is a snippet rather than a string.

This unit is where the tree-shaking rule below came from: the three style keys were added, the
oracle went on reporting them `absent`, and the total "style keys checked" did not move. Nothing
referenced them, so StyleX had compiled them away.

### `Banner` — `collapsible` (#5255) (landed)

`defaultIsExpanded` removed; the axis is `boolean | CollapsibleConfig` over the shared
`useCollapsible` hook. The one subtlety, verified against upstream line-for-line rather than
inferred: the config is passed with `defaultIsOpen: config.defaultIsOpen ?? false`, overriding the
hook's own open-by-default so Banner keeps its historical closed start.

The suite is 49 of upstream's 52 at v0.5.0 (was 45 of 47 at v0.4.5). The delta is not a simple +5:
upstream **removed** three cases and added eight. The eighth is dropped here — it passes
`children={false}`, and a Svelte `Snippet` cannot be `false`.

### `BottomSheet` family (landed)

`BottomSheetEdgeTint` ported as a new internal component (upstream keeps it out of its own
`index.ts`, so it stays unpublished here), the panel's uniform-edge and floated-handle work
(#5305, #5222), the exit curve and `scrimClosing` (#5326), `overlayPaddingReset` applied at the
sheet root (#5208/#5231), and the IME guard on the standalone sheet (#5322) — `preventDefault()`
first so the browser raises no close request of its own, then the early return.

`useSheetGestures`'s `DRAG_PROMOTION_SLOP` came with it: shipping #5326's curve without its
tap-slop half would have landed the visual change and not the fix behind it.

### `Item` — `layout="inline"` (landed)

`layout?: 'stacked' | 'inline'` with the `inlineContent` / `inlineLabel` / `inlineDescription` trio.
`isInline` is `layout === 'inline' && description != null` — with nothing to inline the layout falls
back to stacked — and an inline row is one line by definition, so its description always ellipsizes
even when it is a snippet rather than a string.

This unit is where the tree-shaking rule below came from: the three style keys were added, the
oracle went on reporting them `absent`, and the total "style keys checked" did not move. Nothing
referenced them, so StyleX had compiled them away.

### `Selector` — the trigger is sized by padding (landed)

`height` on the size styles becomes `minHeight` + a `paddingBlock` of
`calc((token - --spacing-5 - 2 * --border-width) / 2)`, and `triggerContainer` pins its line-height
to `--spacing-5` so the line box is a known quantity. That is what lets a two-line value (the
`Item.layout="inline"` row above) grow the trigger onto 48/52/56 instead of clipping. New
`triggerInGroup` zeroes both inside an `InputGroup`, where the group owns the row height.

### `PowerSearch` — the edit popover fits a narrow viewport (#4768/#4761) (landed)

`containerType: 'inline-size'` on the container plus a `chipRow` group whose `flexWrap` flips at
`@container (max-width: 399px)` — a container query, not a viewport one, so the rows track the width
the popover actually got. `maxWidth: '100%'` on the three selector slots so a long translated
operator label truncates instead of pushing the row wider.

### `TabList` — the scrolling strip and the tabs pattern (#5348, #5349) (landed)

The strip becomes an inner element (`themeProps('tab-strip')`) inside the wrapper, which is a `<div>`
under `role="tablist"` and a `<nav>` landmark otherwise. `overflow: 'auto' | 'scroll' | 'visible'`,
edge fades, two `aria-hidden` `tabindex="-1"` arrows, reveal-on-mount and reveal-on-`value`-change.
`Tab` gains `panelId`, and under the asserted role emits `role="tab"` + `aria-selected` +
`aria-controls`, with `aria-current` moving from `'page'` to `'true'`.

`role` is deliberately **not** re-declared on `TabListProps`. Upstream restates it purely to carry a
doc comment; `BaseProps` already publishes it here as Svelte's `AriaRole | null`, and re-declaring as
`AriaRole` would narrow this port's published type and drift the generated doc row. Verified against
the emitted `TabList.doc.mjs`, which already reads `AriaRole | null` with upstream's 0.5.0 prose.

Class oracle: 10 -> 0.

The suite's header was a **false contract** the moment the pin moved: it claimed all 45 cases, and
upstream's file is 74 at 0.5.0. Three are ported here (the two rewritten `aria-current` cases and
the new link-tab counterpart, which is what the `'page'` -> `'true'` change breaks); the header now
states 46 of 74 and names the four unported describes rather than leaving the old number standing.

### `Spinner` — the ring stops being a canvas (landed)

0.5.0 replaces the `<canvas>` ring with an `<svg>` and two `<circle>`s, which deletes this port's
`getComputedStyle` colour-carrier hack outright: the paint path needed a JS-readable token value,
and the cascade now supplies it. `SPREAD`/`START_POINT` give way to `ARC_FRACTION = 0.375` —
upstream's own note is that the canvas ring swept 135°, not the 270° its constant's comment claimed.

Upstream's `syncRotationPhase` batching (a module-level `Set` plus one rAF, pinning
`animation.startTime = 0` so every ring on the page turns in phase) is ported as an attachment in
`<script module>`. It reads no reactive state, so it runs once per element the way React's stable
ref callback does, and the `Set` is deliberately not a `SvelteSet`: a reactive set would make each
mount invalidate the others, which is the opposite of batching.

Class oracle: 3 -> 0.

### `Breadcrumbs` — the current crumb is not colour alone (#4605) (landed)

`current.fontWeight` moves from `'inherit'` to `--font-weight-semibold`. Two things came with it that
were ours, not upstream's: `buttonReset`'s blanket `padding: 0` was also killing `link`'s
`paddingBlock`, so a button crumb rendered 20px against its sibling links' 28px, and the variant now
reaches both theme targets as `data-variant`.

Class oracle: 7 -> 0.

## Rules promoted

- `CLAUDE.md` § StyleX constraints — a `stylex.create` key nothing references is compiled away, so
  the oracle reports it `absent` and its key total does not move; wire the key through its `*Attrs`
  helper and `.svelte` call site in the same change.

## The gate

`pnpm verify` is **not green**, and the batch is not closable. What was run, and what it said:

| Stage                                    | Result                                              |
| ---------------------------------------- | --------------------------------------------------- |
| `pnpm -r build`                          | clean                                               |
| `pnpm -r check`                          | 0 errors (core 1789 files, docs 1498)               |
| prettier / eslint                        | clean                                               |
| core server project                      | 59 files, 1358 cases, 0 failed                      |
| core client project (real Chromium)      | 200/200 files, 5162 cases, 0 failed                 |
| all 8 theme packages                     | oracles and icon checks green                       |
| `@astryx-svelte/cli`                     | 114 files, 2091 cases, 0 failed                     |
| **class oracle**                         | **42 mismatches** — the one stage still red         |

Three failures found by running the stages rather than by review, each from the version bump rather
than from a code change:

- **`derivedVarRegistry` gained a `number-input` entry** at 0.5.0 (`padding` -> `container`,
  `borderRadius` -> `--_field-radius`). Missing it made `butter`'s theme oracle emit raw
  `padding-block`/`padding-inline` where upstream emits container tokens — and only `butter` sets
  padding on that component, so exactly one of eight theme packages caught it.
- **Three documented theming targets had no `themeProps` literal** — the CLI's registry test.
  `selector-option-row` (#5179) is ported; `date-time-input-time-listbox` and
  `-time-option` belong to the unported `timeOptionInterval` combobox and are now an explicit,
  self-retiring deferral in that test, with hygiene in both directions: an entry that stops being
  orphaned fails the run.
- The four client-suite assertions that pinned an unguarded themed `:hover` selector, covered above.

## Debts opened

- `TabList`'s stranger-in-the-strip warning cannot see a `role` attribute flip
- `useMergedRefs` (#5267) has no Svelte counterpart
- `BottomSheet`'s scrim-closing condition is a parameter, not a call-site expression

**`port/debts.md` has a `## Retired` section and `scripts/status.mjs` stops counting at it.** Three
entries were appended to the end of the file — below that heading — and silently did not count;
`status.md`'s total did not move, which is the only reason it was caught. The two entries this batch
retired had also been *deleted* rather than moved into that section, which is where the file's own
preamble says closed entries belong. Both are fixed: the new three sit above the heading, the
retired two below it with their heads rewritten to `retires: retired at 0.5.0`.

## What the version bump did to two hygiene lists

Both are lists whose stated rule is that they may only shrink, and both legitimately grew — because
upstream **documented props it had previously left undocumented** (#4315-#4320). The violation is
not ours and there is nothing to fix in our tree; the list is the only place it can be recorded.

- `doc-prop-literals.test.ts`'s `PORT_DOC_TYPE_DEBT` gained five: `MultiSelector`, `Selector` and
  `Typeahead`'s `startIcon`, `Toast.onDismiss`, `Toolbar.dividers`. Each is the same inherited
  `IconName | Snippet` / named-union bargain as its already-listed sibling. The header now states
  that the shrink-only rule holds **at a fixed pin**, which is the thing that was actually true all
  along.
- `derived-var-registry.test.ts`'s `VARS_WITHOUT_DERIVED_MAPPING` gained
  `--_input-clear-hit-inset` and `--_input-clear-hit-content` — the clear button's coarse-pointer
  hit target, the same `::after`-overlay shape as the already-listed `--_thumbnail-hit-inset`.

Neither failure was visible until `emit-core-docs` re-ran against the new pin, which is the argument
for running it early in a tracking batch rather than at the end.

## Debts retired

Two `upstream-lag` entries closed themselves at 0.5.0, both verified against the pinned tarball's
`src/**/*.doc.mjs` rather than assumed:

- **Batch 5's doc omissions** — upstream now documents `NumberInput.onKeyDown` and
  `CodeBlock.highlightMode`. Our re-emitted docs carry both (the generator maps the handler to
  Svelte's lowercase `onkeydown` and keeps upstream's description).
- **Upstream doc gap: `defaultIndex` and `hasAutoPlay` are absent from `Lightbox.doc.mjs`** — both
  are documented now.

Three that did **not** retire, checked rather than carried forward:

- `Spinner`/`Kbd`/`Code` still document less than their source ships — `Spinner`'s `size="xl"`,
  `Kbd`'s `plus`, `Code`'s `color`/`size` are all still absent from upstream's tables.
- Upstream's `AspectRatio` comments in the Gallery templates are still stale: 0.5.0 rewrote
  `mixed-gallery`'s hero comment for the new responsive override but left "AspectRatio exposes no
  objectFit or radius props" intact in all four.

## Generated docs

`pnpm -F docs emit-core-docs` after the re-pin: **64 of 221 `.doc.mjs` changed**. That is the whole
0.5.0 prose delta, and it is why the two debts above could be checked from our own tree.
