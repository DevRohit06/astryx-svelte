---
seq: 26
title: The Selector family at 0.4.1
upstream: 0.4.1
units: [Selector, MultiSelector, ComplexSelector, PanelSearchInput]
upstream-prs: [4928, 4838, 4846, 4993, 4951, 5003, 4802, 4935, 4973]
---

## Scope

`Selector`, `MultiSelector` and `ComplexSelector` in one batch, plus the new shared primitive
`field/panel-search-input.svelte` they lean on. The clear-button convergence (#4876) and the
`data-disabled` root state reach these three too; `025-input-family.md` describes both, so this file
covers only what is specific to the selectors. The general 0.4.1 upgrade-infrastructure findings that
`port/ledger/_inbox.md` staged under a second, differently-scoped "Batch 11" heading — CI splitting,
the client vitest project's port-binding fix, `ThemeConfig.extends`, and the `git checkout -- '*'`
incident — are not `Selector` work either; they now have their own file,
`027-upstream-0.4.1-infrastructure.md`.

## Components

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

## What the audits caught

### One parity correction outside the brief

`MultiSelector`'s `<PopoverLayer>` was passing `[styles.popover, layerAnimations.below]`. Upstream's
`popover.render` is called with `xstyle: styles.popover` and never had a `layerAnimations` entry —
checked against v0.3.0 and v0.4.1 — so the appended animation was this port's invention and is
removed. `Selector` and `ComplexSelector` both genuinely carry `layerAnimations[placement]` upstream
and keep it.

### What the post-port audits caught

The `astryx-parity` and `astryx-idiom` passes both ran after the components were written, and between them found five things worth recording — four of which were **pre-existing** rather than introduced by this batch, which is the argument for running them on a rewrite and not only on a new port.

**`ComplexSelector` was dropping the consumer's `onclick` entirely.** Upstream destructures `onClick: onClickProp` (`ComplexSelector.tsx:268`) and composes it — `composeEventHandlers(onClickProp, () => { if (!isDisabled) popover.toggle(); })` — so a consumer handler runs first and can veto the toggle with `preventDefault()`. This port never destructured it, so `onclick` survived into `...rest` and the spread sat _before_ the explicit `onclick=`. Compiled, that is one object literal where the last key wins, so the forwarded handler was discarded outright: `<ComplexSelector onclick={…}>` fired nothing and opened anyway. Now inlined as the two-step `MobileNav` and `SideNavCollapseButton` already use. The general rule, and it is `planning/06` H12 verbatim: **any event a component handles itself must be destructured out of `$props()` and invoked explicitly, in upstream's documented order** — a `{...rest}` beside an explicit handler for the same event is never a merge.

`Selector` and `MultiSelector` were checked for the same shape and are faithful: their `{...rest}` sits before `onkeydown` on the inner `<button>`, and so does upstream's JSX, so React drops a forwarded `onkeydown` too.

**`PanelSearchInput` omitted the wrong handler name.** It shipped `Omit<BaseProps<HTMLInputElement>, 'onchange'>`, reasoning by name from upstream's `Omit<…, 'onChange'>`. But React's `onChange` on a text input _is_ the input event, and the handler this component binds its own value callback to is `oninput` — which, because the rest spread deliberately comes **after** it, a caller could have silently replaced, leaving a search box that types but never filters. `onchange` is never set here and has no React counterpart to omit, so it passes through. `TextInput` omits `'oninput'` for exactly this reason and was the precedent to have read. Unreachable in practice today (neither selector passes it, and the component is not exported), which is why it is second on the list rather than first — but it is the kind of thing that only stays unreachable by luck.

**The `statusButton` inline→object flip had a third call site.** `use-input-status-icon.stylex.ts` composes `focusOutlineStyles.focusVisible` at its one call site exactly as upstream does, so its oracle case needed the same mode flip `selector` and `multi-selector` got — and without it the class oracle stayed red on a key whose atoms were already correct. The rule that generalises: **when a shared style helper is adopted, every case claiming `inline` for a call site that now composes it needs re-reading, and they are found by grepping the helper's name** rather than by waiting for each to fail in turn.

**One demo story was missed.** `Placements` (`below`/`start`/`end`) is new at 0.4.1 and was added by #5003 — the same PR as the `offset` change — so it belongs to this batch even though the brief named only five stories. Now present.

**`Selector`'s trigger spread was in the wrong place.** Upstream puts `{...rest}` after `ref, id, type, role` (`Selector.tsx:1328`); ours had it first, so our explicit `role`/`id`/`type` won where upstream lets a caller's override. Reordered to match.

The idiom pass additionally confirmed, empirically rather than by reading, the four translation decisions this batch was least sure of: `$.component` re-reads the `SelectionMark` derived so a `<Theme>` swap does re-resolve the mark; `useCombobox`'s options bag is rebuilt per call so `optimistic.current` is read at event time; a top-level `$effect` is deferred to `pop()` and therefore runs after the whole template subtree, so `searchEl` and `anchorEl` are populated before any measurement or focus; and `{@const}` compiles to a `$derived`, so the per-row `multi-selector-option` target restamps its `data-*` while the hoisted, argument-free `themeProps` calls correctly do not.

It also corrected one clause of a comment I wrote: `use-selected-item-offset.svelte.ts`'s header claimed `$effect.pre` would be wrong because "the items being measured would not be there yet". They would — the layer's content is rendered unconditionally, so the rows exist from mount. The real reason plain `$effect` is right is that this must observe the _patched_ DOM after `showPopover()` has run. Conclusion unchanged, justification corrected.

### The Selector family — port findings (`port/ledger/_inbox.md` staging)

- [ ] **An oracle case can be wrong about the _mode_ while every atom matches.** `statusButton` in
      both `selector` and `multi-selector` emits byte-identical classes at 0.4.1 and 0.3.0; what
      changed is that its call site now merges `focusOutlineStyles.focusVisible` across a module
      boundary, which defeats StyleX's fold, so `dist/` carries an object where it used to carry a
      literal string. A case claiming `inline` for it fails with a diff that looks like a style
      difference and is not one. **Read `dist/` for whether the key is an object before reading it
      for what the object says** — the mode is the first question, not a detail of the answer. The
      inverse bit the same batch: `complex-selector`'s `dist/` still carries `trigger` and
      `triggerText` as literals _and_ as objects, so its four-entry `inline` list was deleted rather
      than trimmed, and nothing went unverified because object mode already covered both keys
- [ ] **Two upstream PRs that touch one style key have to be ported as one change.** #4838 collapses
      `triggerIcon` to `{flexShrink: 0}` and #4846 adds `triggerIconRotation`; landing #4838 alone
      leaves the key in a shape that exists in no released version, so `dist/` has nothing to diff it
      against in either mode and the run reports a mismatch that no source edit can close. The
      general form: **when a brief lists two PR numbers against one declaration, the released tarball
      is the join of both, never of either**
- [ ] **A forward reference to a hook's `reset` must not be `$state`.** `Selector`'s hide and clear
      handlers have to drop the typeahead buffer, but `useTypeahead` is constructed after them
      because it needs the popover. Upstream uses a ref; the Svelte translation is a plain
      `let resetTypeahead = () => {}` assigned afterwards, because the handlers read it at call time.
      Making it `$state` compiles and works, and re-triggers every derivation that read it on the
      assignment — a self-inflicted extra render pass on every mount, invisible to `check` and to
      both oracles
- [ ] **`getBoundingClientRect()` measures through the popover's entry transform.** The selected-item
      overlay offset (#4802) had been computed from rects on both sides, so the error grew with each
      option's distance from the menu top — every row measured through a different point of the same
      `scale()`. `offsetTop`/`offsetParent`/`offsetHeight` are untransformed layout metrics and are
      what upstream uses. Anywhere this port measures an element inside an animating layer, the rect
      is the wrong instrument
- [ ] **A rewrite needs the parity and idiom passes as much as a fresh port does, and this batch is
      the evidence.** Both ran after the components were written; between them they found five
      things, and **four were pre-existing** rather than introduced here — `ComplexSelector`
      silently discarding a consumer's `onclick` (`{...rest}` beside an explicit handler is one
      object literal, last key wins, never a merge), `Selector`'s trigger spread sitting before
      `id`/`type`/`role` where upstream puts it after, a stale `mockSelectorRects` harness that
      `useSelectedItemOffset`'s rewrite had turned into a coincidence of the test page, and the
      `statusButton` mode flip's **third** call site in `use-input-status-icon`. None of the four
      would have been found by re-reading the diff of what changed
- [ ] **The ported suites for this family are written and typechecked, not passing** — the client
      vitest project still cannot bind a port in this environment, which is the standing 0.4.1 debt
      recorded above. `Selector` **124/124**, `MultiSelector` **101/102** (one named drop:
      `has displayName`, a React-only concern), `ComplexSelector` **6/6**. The server project is
      green (838/838), and both class and CSS oracles report nothing from `selector`,
      `multi-selector`, `complex-selector` or `panel-search-input`

## Rules promoted

The `ComplexSelector` `onclick` finding, above: **any event a component handles itself must be
destructured out of `$props()` and invoked explicitly, in upstream's documented order** — restated
as H12 in `port/research/06-react-to-svelte-patterns.md`, but not promoted at the time this batch
landed. It now lives in `CLAUDE.md`'s Conventions section, which points back here as the incident
that motivated it.

`027-upstream-0.4.1-infrastructure.md` carries the port-binding fix and CI split that used to be
described here; see that file's own Rules promoted for the accurate version.

## Debts opened

-
