---
seq: 28
title: Upstream 0.4.2 — the SideNav/useMenuHover consolidation, Layer's template marker, and coarse-pointer targets
upstream: 0.4.2
date: 2026-08-16
units:
  [
    Avatar,
    AvatarGroup,
    Button,
    ButtonGroup,
    Card,
    Chat,
    CheckboxInput,
    CodeBlock,
    CommandPalette,
    DateTimeInput,
    DropdownMenu,
    HoverCard,
    InputGroup,
    Item,
    Layer,
    MobileNav,
    NavItem,
    RadioList,
    SideNav,
    Slider,
    Switch,
    TabList,
    Text,
    Thumbnail,
    Timestamp,
    Toolbar,
    TopNav,
    TreeList,
    hooks/useContainerReveal,
    hooks/useFocusTrap,
    hooks/useMenuHover,
    theme/derivedVarRegistry,
    theme/defineTheme,
    theme/tokens,
    locales/en,
    themes/butter,
    themes/chocolate,
    themes/gothic,
    themes/stone,
    cli
  ]
upstream-prs:
  [
    2574,
    3121,
    4363,
    4506,
    4546,
    4555,
    4654,
    4783,
    4963,
    4964,
    4967,
    5015,
    5016,
    5023,
    5026,
    5030,
    5039,
    5046,
    5047,
    5048,
    5051,
    5064
  ]
---

## Scope

Track Astryx `0.4.2` (tagged 2026-08-15) from the `0.4.1` pin. No component directory was added,
deleted or renamed upstream, so the surface count is unchanged; the whole batch is drift inside
directories this port already ships. 28 `packages/core/src` component directories changed, plus
three hooks, the theme internals and the `en` locale catalog. All 28 are ported here, so nothing in
the delta lands as "not yet ported".

**Deliberately excluded**, each already a standing entry rather than a new decision:

- `packages/lab` (`ListInput`, `TransferList`) and `packages/richtext` — unstarted fronts. The
  `@astryx.listInput.*` namespace #4967 added **is** in scope, because the catalog is core's, not
  lab's; it ports as catalog keys with no consumer here.
- `assets/templates/pages/ai-chat` and the new `ChatMessageBubbleCustomContent` block — the CLI's
  page-template scaffolding catalog, deferred by `debts.md` → "Upstream's template assets stay
  deferred from the CLI's own catalog".
- `clients/cli/commands/*.doc.mjs`, `api/theme/themeTemplate.doc.mjs` and
  `foundation/response/response-types.doc.mjs` — this port's CLI describes its commands through
  Commander rather than per-command doc modules, so those three upstream files have no counterpart.
- `scripts/check-portable-scripts.mjs` and `scripts/score-ledger.mjs` — upstream's own repo
  tooling, with no relationship to this tree.

## Themes

`--radius-none` moved from `0.125rem` to `0px` in butter, chocolate, gothic and stone: it is fixed
by contract alongside `--radius-full` and must never be scaled by a theme. `neutral` already carried
both the value and the comment, which is where upstream's propagated text came from. All seven
theme oracles report `mismatch: 0` at the new pin — and the four that changed are exactly the four
that had a mismatch beforehand, which is a pleasant confirmation that the oracle sees theme drift
precisely.

## Tokens, re-derived rather than carried forward

`borderDefaults` and `focusDefaults` both joined `tokenDefaults`: upstream folded the first in at
0.4.2 (#5026), and the second had simply been missed on this side since before 0.4.1. With both in,
our flat token map is **exactly upstream's minus the domain group** — same families, same counts,
nothing extra on either side, and the only absentees the `--color-data-*` / `--color-syntax-*`
tokens this port does not ship. That is the whole check track-upstream asks for, and it is the first
time the two maps have agreed family for family.

## InputGroup / Button — one selector, three call sites

`button groupStyles.horizontal`, `groupStyles.vertical` and `group-styles groupStyles.inGroup` all
mismatched for one reason, and it is the Layer change below rather than anything about groups:
`IS_LAST_ITEM` has to skip the inert `<template>` marker as well as the popover, so
`:not(:has(~ *:not([popover])))` became `:not(:has(~ *:not([popover]):not(template)))`. Upstream
also collapsed `group-styles`' older `:last-child` + two `:has(+ [popover]…)` variants onto the same
const. Seven CSS-oracle rules closed with them.

`InputGroupText` keeps a plain `:first-child`/`:last-child` pair — a text addon owns no layer — and
its docstring now says so in those terms rather than naming the deleted variants.

## Coarse-pointer targets (#4963, #4964)

WCAG 2.5.8 AA. Five components, three shapes:

- `Switch`, `CheckboxInput`, `RadioListItem` — the visually-hidden `<input>` **is** the tappable
  target, so it floors to 24×24 and centres on the control under `@media (pointer: coarse)`. One
  identical block in three modules, applied as such.
- `Thumbnail` — a `::after` overlay driven by a new private `--_thumbnail-hit-inset`, documented in
  `theming.vars[]` because #4963 landing it undocumented is what left upstream's derived-var guard
  red on `main`.
- `Slider` — the track is clickable along its whole length but only 20px tall, so its block size
  floors to 24px on touch.

Only the invisible tappable area changes in every case; rails, thumbs and glyphs stay put.

## Slider — thumb inset (#5051)

Thumb travel is inset by half a thumb at each end, which is the geometry a native
`input[type=range]` uses: at `min`/`max` the thumb no longer overhangs the component box by 10px.
`insetPosition`, `insetSpan` and `travelFraction` transcribe unchanged, and the fill, the marks and
the pointer-to-value mapping all route through them, so the thumb stays under the pointer that
grabbed it. `THUMB_SIZE` had to become an export: upstream is one file and reads a module-private
const, and the number has to cross this port's `.stylex.ts` / `.svelte` boundary rather than be
written down twice.

## Avatar (#5030)

The avatar's box moved from the content circle onto the wrapper — the element carrying the
`astryx-avatar` theme target — so a theme rule on the documented `size` axis resizes the whole
avatar instead of growing a wrapper around a fixed-size circle. A whitespace-only `name`/`alt` is
now treated as absent (`meaningfulName`/`meaningfulAlt`), which stops an empty plate rendering
behind a blank accessible name.

**The bare `console.warn` finally moved.** This port kept it verbatim through three batches with a
comment explaining that upstream's `Avatar.tsx` was the one site still writing one; 0.4.2 moved
upstream's onto `useDevWarning`, so ours moved in the same pass and the comment became history
rather than justification.

## Layer (#5039, #5064) — the largest unit

A context layer now renders an inert `<template>` marker at its position in the template, and the
marker's parent decides where the real container mounts: inline when that parent is safe, or
portaled to the nearest element outside every unsafe ancestor when it is not. `layerHost.ts` — the
pure function that walks the chain — transcribes unchanged, along with its 19-case suite.

Two things about the Svelte translation:

- **There is no `createPortal`.** The container renders in place and an attachment moves it, which
  is the device `ChatComposerInput` already uses. **The cleanup is load-bearing here, where that one
  needs none** — see "Rules promoted".
- **`setTriggerEl` stopped being dead.** This port had dropped it, with a note that upstream's
  `triggerElRef` was written and never read. 0.4.2 reads it: `showPopover({source: triggerRef})`
  passes the trigger as the popover's invoker so a hosted-away layer still takes its focus order
  from the trigger. It came back as `attachTrigger`, and the note came out.

`lazyMount` defers mounting until `show()`, and `HoverCard` opts in so rich content never enters an
invalid paragraph even briefly — which is also why its content element went from `<span>` back to
`<div>`. #5064 gave every layer its own `font-size`/`line-height` rather than inheriting the
trigger's, so the same Tooltip no longer renders at 13px from a caption and 20px from a lede.

## useMenuHover (#3121) — five adopters, one machine

The hover→click guard, the time-bounded reopen suppression, synchronous focus, keyboard activation
that always opens, and focus restoration all moved into the shared hook. `TopNavMegaMenu` lost its
private copy (#4555's original home) and `SideNavItem` lost its hand-rolled timers; `TopNavMenu`,
`TopNavHeading`, `SideNavHeading` and `DropdownMenuSubMenu` gained the guard they never had.

**The one-shot flag becoming a timestamp forced a real observer.** This port had translated
upstream's `useIsomorphicLayoutEffect` on `[isOpen]` into a lazy `syncHoverMode()` at the top of
each handler, and documented the narrow gap that left. That works for a boolean and is wrong for
`closedAt`: stamping lazily records the time of the _re-hover_, not of the close, so a deliberate
re-hover seconds later would be suppressed. It is now an `$effect` keyed on an `isOpen` `$derived`,
which is the same "notify only when the value changes" the dependency list meant.

## SideNav — 17 of the 27 class-oracle mismatches

The hardening pass, in one commit upstream and one unit here: forced-colors `Highlight`/
`HighlightText` on the selected row (a 6% background tint flattens away entirely under forced
colors, leaving the current page unmarked); the shared focus ring on every focusable row, with the
link and the chevron ringed individually in a split-action row; reduced-motion guards on three
transitions; the flyout's second square-cornered surface removed and its gap moved to the positioned
layer where `DropdownMenu` keeps it; `alignSelf: stretch` so the primary action fills the row rather
than collapsing to a 20px line box.

Four consumer-visible changes came with it: `footerIcons` cascade a `sm` size through `SizeContext`;
`SideNavCollapseButton` takes a `size`; it takes the controlled `collapsible` config, which is how a
button outside the sidenav stays in step without an imperative handle (`handleRef` is deprecated in
its favour); and the collapsed flyout's hover is gated on `(hover: hover)`.

`SideNavSection`'s hand-rolled clip rectangle became `VisuallyHidden`, and the two branches are
separate elements rather than one element with a conditional style, as upstream's are. The shared
header body moved into a snippet so they cannot drift.

**`SizeProvider` had no counterpart.** `setSizeContext` cascades to a component's _whole_ subtree,
which is what `Toolbar` wants; upstream wraps _part_ of `SideNav`'s output. `internal/size-scope.svelte`
is the boundary component that makes that possible — the device `side-nav-collapse-scope.svelte`
already established, unexported for the same reason.

## The rest

- **`useContainerReveal`** grew `hoverDelay` (a dwell gate, mouse-only, surviving reduced motion
  because an intent gate is timing rather than motion), `forceState` on the container and
  `forceVisibility` on a single element. Every remaining CSS-oracle rule closed with it.
- **`useFocusTrap`** (#5023): a modal surface with no tabbable controls keeps its programmatic focus
  target instead of letting Tab escape. `hasActiveFocusTrapEscape` and `isImeKeyEvent` joined the
  `./hooks` barrel — this port already had both, module-private, with a note that upstream's barrel
  named neither.
- **`ChatMessageBubble.width`** (#2574), so ghost-bubble custom content can span the full message
  column instead of the `max(80%, 280px)` cap.
- **i18n**: the whole `en` catalog was adopted verbatim (263 → 284 keys — it was already a
  byte-identical subsequence of upstream's). `CommandPaletteFooter`'s three keyboard hints and
  `DateTimeInput`'s two time placeholders stopped being hardcoded English.
- **`derivedVarRegistry`** gained `context-menu`, whose `ContextMenu.doc.mjs` mapping had been dead
  since it was written.
- **Heading's `type`** is a documented theming target, which stops `theme build` warning
  `Unknown prop "type"` on every theme that sets a type scale.

## Oracle bookkeeping

| Oracle          | Before | After                                |
| --------------- | -----: | ------------------------------------ |
| Class parity    |     30 | 0 (1621 keys, 515 inline call sites) |
| CSS parity      |     37 | 0 (5937 rules, 10 skips)             |
| Theme parity ×7 |      4 | 0                                    |

Three mode flips, all one mechanism — a call site that starts going through
`focusOutlineProps.focusVisible(...)` passes its styles through a runtime function StyleX cannot
fold, so the keys stay objects and the inline claim has to be deleted rather than repaired:
`side-nav-heading` lost three (`heading+headingLink`, `chevron+interactive`, `popoverHeading`) and
`side-nav-item` two (`expandToggle`, `splitAction`). The reverse happened once: `avatar`'s `content`
stopped taking a dynamic size, started folding, and needed an inline entry it never had.

No skips were added, and none retired.

## What the closing audits caught

Six agents across the four axes (parity split three ways over 24 changed component dirs, plus
idiom, test-parity and the repo-wide surface sweep). They found **one release blocker and six
defects**, and the blocker was in the batch's own headline feature.

**First, the audits were nearly run against the wrong tree.** `reference/astryx-upstream`'s
worktree was still checked out at `v0.4.1` — the batch was built by diffing tags, which reads
fetched refs and never touches the worktree, so nothing had forced it forward. Every agent would
have reported the entire batch as invented drift. Checked out to `v0.4.2` first; `port/status.md`
regenerated identically against it, which is consistent with 0.4.2 adding, deleting and renaming
no component directory.

### The blocker: every `HoverCard` in an unsafe host mounted hidden

`<p>`, `<a>`, `<td>`, `<li>` — the exact positions #5039's corrective portal exists to serve. The
card opened, was evicted from the top layer, and never came back. Reproduced in Chromium
(`:popover-open === false`, `display: none`), with a safe-host control passing.

Three faults compounded, and each is now a rule in `astryx-idiom.md`:

1. **`attachSentinel` read `isOpen` — a `$state` — where upstream reads `isOpenRef.current`.** A
   ref read cannot subscribe; a `$state` read inside an attachment does. Opening the layer
   re-ran the attachment. The docstring immediately above said "Reading `lazyMount` is the only
   tracked read here", which is true only while `lazyMount` is false — the short-circuit means
   the reads after it are still reached.
2. **`requestContextMount` always allocated a fresh object**, so `contextMount`'s identity changed
   even when its contents did not, and `{@attach intoPortal(...)}` — keyed on that identity —
   tore down and re-appended. React is immune: an equal `contextMount` re-renders into the same
   `createPortal` container and moves no DOM. Here the identity change _is_ the move.
3. **`intoPortal` treated a `null` target as a no-op**, so a render call moving from a `<p>` into a
   `<section>` removed the container and never put it back. Svelte will not re-insert a node it
   considers already rendered.

A fourth followed from fixing the third: `attachPopover` is a stable function, so it never re-ran
on a mount change and its own "changing a portal target remounts the container" re-show branch
could not fire. `<Layer>` now threads the mount through it.

**Every one of these lived in the nine `useLayer` `describe('context hosting')` cases upstream
added in the same release, and none had been ported.**

### The other defects

| Defect                                                                                                                                 | Origin                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `SideNavHeading`'s collapsed flyout heading button still wired to `triggerProps.onclick`, not `close` — Enter/Space never dismissed it | missed 0.4.2 change          |
| The collapsed heading trigger never registered with `useMenuHover`, so Escape restored focus to nothing                                | missed 0.4.2 change          |
| `TopNavMegaMenuItem`'s drawer row drew no focus ring — `sx(...)` where upstream composes `focusOutlineProps.focusVisible(...)`         | missed 0.4.2 change          |
| `AvatarGroupOverflow` omitted `size` from `themeProps`                                                                                 | **introduced by this batch** |
| `Switch` omitted `size` from both `themeProps` calls                                                                                   | pre-existing                 |
| `TreeList` had no `hasExpandableItems`, so a wholly flat tree indented every row                                                       | pre-existing (#4540)         |

The two `size` gaps share a shape worth naming: the `.doc.mjs` regeneration ran and published
`visualProps: ['size']` on both targets while the components never followed, so the port
**documented theming axes it did not emit**. Neither oracle can see it — the class oracle walks
upstream's keys, and `data-size` is not a style.

Surface was comparatively clean: two missing exports (`BreadcrumbMenuDividerProps`,
`ContextMenuDividerProps` — we shipped five of six aliases in each family) and three CLI barrel
over-exports (`buildHelp`, `buildKit`, `importSpecifier`, all module-private upstream). Every
symbol _this batch_ added was correct. The three `Indicator` props aliases the sweep flagged were
left in place and are covered by the existing "named aliases for what upstream inlines" entry —
they follow this port's own `<script module>` convention and removing them would break a surface
that shipped at 0.4.1.

One agent claim did not verify: a stray `zz-temp-idiom-probe.svelte.test.ts`. No such file exists.

### The systemic finding

**The batch tracked implementation drift and did not track the test delta.** Upstream added ~90
cases at 0.4.2; the batch ported 21. Four suite headers asserted counts that were false — one
("32 upstream cases … nothing dropped") had never been true of any tag. Closed here: `useLayer`'s
nine hosting cases plus one beyond-upstream regression, the whole 21-case `useMenuHover` suite
(new upstream; this port had none for a hook the batch rewrote), Slider's three `THUMB_INSET`
blocks, HoverCard's two portal cases, SideNav's four `useMenuHover` cases, and `button-group`'s
two `DropdownMenu` cases whose stated reason ("not ported") had expired batches ago. The
remainder is a debt with the full list.

## What the audits caught during the batch

- **The generated `.doc.mjs` files were hand-edited first.** Twelve of them, before noticing the
  `@generated by docs/scripts/emit-core-docs.mjs — do not edit` header at the top of each. Reverted;
  `pnpm -r build && pnpm -F docs emit-core-docs` then landed all 17 correctly, including the nine
  this batch had not got to. Promoted to `CLAUDE.md`.
- **`{#if}` teardown does not follow a moved node.** Caught by a test, not by review: the
  `portals block content before showing and restores the marker after hiding` case timed out with
  the layer still in the DOM after hiding. See "Rules promoted".
- **The theme template's `weight` claim was a lie**, caught by writing the template against our own
  `TypeRole` rather than transcribing upstream's example. Recorded in `debts.md` and the template
  now documents `weights` alone.
- **Four suites read a layer that no longer exists while closed**, all of them HoverCard's, and
  every one restated the way upstream restated its own: `timestamp` (15 cases — its `awaitCard`
  helper now opens the card, and the keyboard-reachability case dropped a content comparison that
  only ever worked because the layer was mounted cold), `trigger-rewire` (2 — the wiring is read
  off the trigger, where it has always been, rather than off the layer), and `hover-card` itself
  (5 restated, 3 SSR). `table-context-menu` is the corrective portal rather than `lazyMount`: a
  `<td>` sits inside four unsafe hosts, so scoping a menu query to the cell finds nothing.
- **Two test suites were marker-blind.** `button-group` and `toolbar` count group members with
  `:scope > *:not([popover])`; the marker made four cases fail. Upstream restated the same
  selectors in the same release, which is a good sign the seam is real rather than ours.
- **The CLI's bundled theme copies went stale** the moment the theme sources changed —
  `test:themes-bundle` caught it, and `pnpm -F @astryx-svelte/cli generate-themes` is the fix.

## Rules promoted

From the closing audits:

- `.claude/agents/astryx-idiom.md` — three new rules, all from the Layer blocker: a portal
  attachment must handle the move _back_ (a `null` target is a move, not a no-op); an attachment
  keyed on a per-resolve object needs an equality bail-out **and** its inverse checked (an
  attachment that must re-run on change gets nothing from a stable function reference); and a
  React `ref` read is non-tracking where a `$state` read is not, so a sampled read needs
  `untrack` — with the note that a docstring claiming "X is the only tracked read here" is a
  claim to verify, since short-circuits still reach the reads after it.
- `.claude/skills/track-upstream/SKILL.md` — new step 5b: diff the **test** delta and treat it as
  scope, with an added test _file_ as the loudest signal; then re-derive every suite header's
  count against the new tag.
- `CLAUDE.md` § Testing — the count is a contract against upstream's file _at the current pin_, so
  a version bump invalidates every header that states one; and a dropped case's stated reason
  expires too (`button-group` carried "`DropdownMenu` is not ported" for three batches after it
  was).

From the batch itself:

- `CLAUDE.md` § The docs site — `packages/core/src/lib/**/*.doc.mjs` are generated by
  `docs/scripts/emit-core-docs.mjs`; a version bump lands the whole prose delta with one command,
  and hand-editing them is a mistake the header already warns about.
- `.claude/agents/astryx-idiom.md` — a node moved out of an `{#if}` block survives its own unmount,
  because teardown clears the range between the block's anchors in the _original_ parent; a portal
  attachment must return `() => node.remove()`.
- `.claude/agents/astryx-oracle.md` — a call site that starts going through a runtime helper flips
  inline → object (and back), with the "upstream has no matching call site" tell and both 0.4.2
  examples.

## Debts opened

- `TypeRole` takes no `weight`, so a theme cannot set one default weight per role
- `SideNavItem` puts `xstyle`/`class`/`style` on its wrapper, where upstream's collapsed branch
  takes neither
- The 0.4.2 test delta is only partly ported: 39 SideNav cases and 12 Slider cases are absent
  (opened by the closing audits, with the full per-suite list)

**Retired:** `009-batch-8.md`'s `tokenDefaults` omits `borderDefaults` — upstream folded it in at
0.4.2 (#5026), and `focusDefaults`, missing on this side only, landed with it.
