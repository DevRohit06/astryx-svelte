# Batch 18 — tracking upstream 0.2.0 → 0.3.0

`@astryxdesign/core@0.3.0` and the five theme packages shipped after the 0.2.0 jump batch 17
tracked. This is the **second** release-tracking batch, and the first run with the intent of
**ending in a release of this port** rather than in another green gate.

All eight pins are at `0.3.0` and installed; the reference clone is checked out at the **`v0.3.0`
tag** (`astryx-announced/v0.3.0` and `v0.3.0` resolve to the same commit, `82d4dab3d`), so source
and published dist correspond exactly and the oracle needs no lag skips. `CLAUDE.md` was renamed to
`UPSTREAM-CLAUDE.md` again after the checkout restored it — per-update, never one-time.

---

## 0. The finding that should shape the batch

**0.3.0 is roughly half the drift of 0.2.0, and the shape is different.** Batch 17's headline was
267 class mismatches driven by a library-wide RTL property migration. 0.3.0's is **124**, and the
migration is *finishing* rather than starting — upstream's own changelog says "the RTL
physical→logical migration is complete". The residue is concentrated in nine components that had
been left behind plus one new shared helper.

**What no oracle sees is again the larger half.** 82 changelog bullets: 3 breaking changes, ~27 new
features, ~44 fixes, 4 documentation. The class oracle proves styles that exist match; it cannot
tell you `Carousel` grew `hasLoop` or that `CheckboxList` restructured into a single tab stop.

**And one 0.3.0 change actively breaks this repo, silently.** `@astryxdesign/cli` restructured:
`docs/` → `assets/docs/`, `templates/blocks/` → `assets/templates/blocks/`. Our generator reads the
old paths, found nothing, wrote **empty registries over the real ones**, and `pnpm -r build` still
exited **0**. The 626 hand-transcribed example `.svelte` sources under `docs/src/lib/examples/` are
untouched, so it is a two-path fix — but it must be **step one**, and it earns a real lesson: the
content pipeline fails **open**, and the "0 pending" it reports afterwards is a false green in the
opposite direction from the one the port usually guards against.

---

## 1. Breaking changes (3)

### 1.1 `DropdownMenuRadioGroup` requires `label`

`label` is now required and applied as `aria-label`, replacing the optional
`aria-label`/`aria-labelledby` passthrough. Covers the re-exports too — `ContextMenuRadioGroup` and
`BreadcrumbMenuRadioGroup`. Ported here in 17b, so all three alias families need the prop.

Same bullet also fixes **ContextMenu to close on Tab** per the APG menu pattern — a behavioural
change riding a breaking-change bullet, which is exactly the kind of thing a `.d.ts` diff misses.

### 1.2 The authoring surfaces move to `@astryxdesign/cli/authoring`

`@astryxdesign/core/authoring` and `@astryxdesign/core/config` are **removed** subpaths;
`packages/core/src/docs-types.ts` is deleted upstream (1,108 lines) and the doc-type vocabulary
re-exported from core is now a deprecated alias.

**Decide explicitly rather than by default:** this port never shipped `./authoring` or `./config`,
and its docs generator reads `.doc.mjs` files **by path** rather than importing the types, so
nothing here imports the removed subpaths (verified by grep — zero hits). The consequence is
confined to the **CLI content-path move** above, which is a real breakage. Record the removal as a
non-event with the evidence, so a later surface sweep does not re-open it as a gap.

### 1.3 Long-deprecated compatibility APIs removed from core and CLI

Dialog logical positions, Switch label spacing, Table root props. Check each against what this port
actually shipped — some were never ported, and a removal of something we never had is a non-event
that still deserves a line.

---

## 2. Workstream A — finish RTL (phase 4c) and the `centerInline` helper

0.2.0's phases 2/4/4b landed in 17a. 0.3.0 closes the migration.

### A1. `rtlStyles.centerInline(blockOffset)` — a new shared helper

Centres an absolutely-positioned, auto-width element on the inline axis. It **deliberately uses
physical `left: 50%` + `translateX(-50%)`**: both reference the same physical edge, so the pair is
direction-symmetric. A logical `insetInlineStart: 50%` anchor with a physical translate shifts the
element off-centre **by its own width** under RTL — which is a bug 17a's migration introduced here
and 0.3.0 fixes upstream.

**This port must check whether it has that bug.** Three call sites upstream: Popover close button,
vertical Slider track/thumb, ResizeHandle grab-zone/pill. `slider` (18) and `resize-handle` (1) are
the two largest entries in our mismatch list, which is consistent with having it.

Upstream also made this **the single sanctioned `no-physical-properties` suppression**, living in
the helper rather than at each call site, and taught the lint rule to recognise the idiom and point
at the helper. Our rule is already at `error` (17a, ahead of upstream); adopt the recogniser.

### A2. RTL phase 4c — three animated/interactive behaviours

Not reachable by renaming a property:

- **ProgressBar** indeterminate bar slides along the reading flow (right → left under RTL).
- **Switch** thumb mirrors on toggle (off-thumb on reading-start, on-thumb on reading-end).
- **Horizontal `Layer` enter animations** (Popover/DropdownMenu/HoverCard/Selector `start`/`end`
  placements) nudge in from the correct physical side. Vertical entrances unchanged.

### A3. The last physical→logical components

Avatar, Banner, Calendar, Chat composer, Chat composer drawer, Markdown, Popover, Slider,
Resizable. Plus the **Avatar status dot's outward-push `transform` becoming direction-aware**, so it
hugs the bottom-inline-end corner instead of pulling inward under RTL.

**Cross-check against 17a's KEEP list.** 17a deliberately kept ~19 declarations physical, each with
an inline `eslint-disable` and a reason — and two of those reasons (Avatar's status dot paired
translate, Popover's close button) are **exactly what 0.3.0 has now solved properly** with
`centerInline` and a direction-aware transform. Those disables should retire, not persist. The class
oracle is what proves it either way.

### A4. `isRtl` deprecated on `useListFocus` / `useGridFocus`

Direction is auto-detected from the container (this port already does that, 17a). Add the
`@deprecated` tag so the published surface matches; do not remove.

---

## 3. Workstream B — new props on already-ported components

The generator names these mechanically: **14 documented props across 9 components core does not
declare.** That list is the spine of B, and it is read from the tool rather than the changelog.

| component | props |
| --- | --- |
| `Carousel` | `hasLoop` (+ `handleRef` / `CarouselHandle` imperative handle) |
| `Center` | `padding`, `paddingInline`, `paddingBlock` |
| `DropdownMenu` | `alignment` |
| `DropdownMenuRadioGroup` | `label` (breaking — §1.1) |
| `MultiSelector` | `variant` (ghost) |
| `Pagination` | `pageLabel`, `hasFirstLast`, `step` |
| `Popover` | `role`, `isModal` |
| `ProgressBar` | `marks` (+ `ProgressBarMark`) |
| `Selector` | `variant` (ghost) |

**Three of these are much bigger than "a prop"**, the batch-17b lesson restated — the generator
counts prop *names*, not the module behind one:

- **`Pagination`'s `input` variant** is an editable `NumberInput` page box flanked by first/last
  buttons, with `step`-aware accessible names, hover tooltips on all four carets, and two new icons
  (`chevronsLeft`/`chevronsRight`). 287 changed lines. Seven of the 31 new i18n keys are its.
- **`ProgressBar.marks`** draws themeable target lines with a **lazily-loaded** tooltip per mark (a
  ProgressBar with no marks must bundle no tooltip code), plus a `progressbar-mark` theme target.
- **`Carousel`'s `handleRef`** is the instance-export translation again
  (`Tokenizer`/`SideNav`/`Calendar`/`PowerSearch`/`ChatComposerInput` precedent) — `CarouselHandle`
  exposes `scrollNext`/`scrollPrev`/`scrollTo`/`canScrollNext`/`canScrollPrev`.

**Not prop changes but same workstream** (behaviour on ported components, invisible to the props
check):

- `DropdownMenuCheckboxItem` now **composes `CheckboxInput`** so the checkmark matches
  `CheckboxListItem`. Row keeps `role="menuitemcheckbox"` and owns checked state; checkbox is
  decorative.
- **`Selector`/`MultiSelector` dropdown search becomes a real `TextInput`** — gains `startIcon`
  magnifier and `hasClear`. Explicitly "no new props or theme targets", and a **new default glyph**
  on existing `hasSearch` dropdowns.
- `SelectableCard` toggles on **Enter** as well as Space.
- `Text`/`Heading` `color` becomes theme-extensible via a new **`TextColorMap`** interface — the
  `ButtonVariantMap` technique this port already ports, and a new barrel export.
- **Icon registry**: `registerIcons()` accepts arbitrary extension keys, plus a new
  `getExtendedIcon(name, fallback)`.
- `useTableTreeData` gains **`hasRowClickExpansion`** — a hook option bag, so it is invisible to the
  docs prop check by construction. This is the *same hiding place* `hasExpandAllControl` used at
  17b; check the whole config interface, not the prop table.
- **`Dialog.position` becomes logical-only — and this entry was WRONG as first written.** It said
  the prop "gains logical `start`/`end` and deprecates physical `left`/`right`. Both work; logical
  wins when both set", which is the changelog's own wording and describes a shape that **does not
  exist at the tag**. Two commits land between v0.2.0 and v0.3.0: `827f17387` (#4568) adds the
  logical pair and deprecates the physical one as a discriminated union with `never` arms, and then
  `e6beddb4e` (#4657, the "remove deprecated APIs" breaking change) **deletes the physical arm
  outright**. Net at `v0.3.0`, corroborated against the published tarball's `Dialog.d.ts`:

  ```ts
  interface DialogBlockPosition { top?: number | string; bottom?: number | string; }
  export interface DialogPosition extends DialogBlockPosition {
    start?: number | string;   // inset-inline-start
    end?: number | string;     // inset-inline-end
  }
  ```

  No union, no `never` arms, no `@deprecated`, no `left`/`right`, and **no eslint-disable** — which
  matters, because an unused disable is itself a lint error here. So "logical wins when both are
  set" has no implementation because the situation cannot arise, and **17a's deliberate
  keep-it-physical decision is superseded outright rather than added to**. Building the union would
  have put `left`/`right` in our published API where upstream has none — an invented surface, i.e. a
  defect by the parity rule.

  **The lesson generalises past Dialog and is the sharpest one this batch has produced.** A
  changelog is a record of what happened *during* a release, not a description of the release. Where
  a feature is added and then removed inside the same version, the prose describes an intermediate
  state that never shipped. **`git show <tag>:<path>` is the spec; the changelog is only the index
  of where to look** — which is the pre-flight's "verify the description against upstream source"
  item applying to upstream's own prose, not just to `planning/01`.

---

## 4. Workstream C — the fix list (~44)

Grouped by what they need rather than by changelog order.

**a11y / WCAG:**

- `AppShell` skip-link target focusable (`tabIndex={-1}`), localized label, header as `banner`.
- **`CheckboxList`: each option is a single tab stop** (WCAG 4.1.2). The row becomes an enlarged
  click target delegating to the checkbox via a **new `interactiveRef` prop on `Item`/`ListItem`**
  (the `useClickableContainer` pattern), replacing the internal invisible row button.
  `interactiveRef` is mutually exclusive with `onClick`/`href`. **This is a new public prop on two
  ported components** and belongs in B as much as C.
- `Resizable` collapsed handle clamps `aria-valuenow` to `aria-valuemin` + localized `aria-valuetext`
  "Collapsed"; `TabMenu` overflow options become `menuitemradio` + `aria-checked`.
- **Forced colors / Windows High Contrast** (WCAG 1.4.11) for painted controls — `Switch`,
  `CheckboxInput`, `RadioList`, `SegmentedControl`, `ToggleButton`, `Skeleton`. Consistent with
  `skeleton`, `segmented-control-item`, `radio-list-item` and `checkbox-input` each carrying 1–2
  oracle mismatches.
- `Lightbox` keyboard zoom (Enter/Space, `+`/`-`), arrow-key panning while zoomed, polite
  announcements; and **backdrop click dismissal made reachable** (the container fills the dialog, so
  the old check never matched).
- `Selector`/`MultiSelector` select-all partial state in the accessible name; empty-state messages
  marked presentational inside the listbox; Typeahead's collapsed input out of the Tab order while a
  token shows.
- `Toast` announces through the **persistent singleton live regions** — the same move 17c made for
  `FieldStatus`, and it carries the same hazard: body-wide `getByRole('status'|'alert')` becomes
  ambiguous and breaks unrelated suites. 17c's fix (container-scoped `screen.locator`) is the
  precedent.

**i18n — and this closes a standing debt of ours:**

- Upstream localized the remaining hardcoded assistive-tech strings: AvatarGroup overflow label,
  CodeBlock copy announcement, Button loading announcement, MetadataList show more/less, Table
  row-expansion context-menu actions, keyboard hint. **`TODO.md` records "hard-coded English" as a
  Known debt of this port** — this retires it upstream-first rather than by local invention.
- `FieldLabel` localizes the Required/Optional indicator (`@astryx.field.required`/`.optional`).
- **31 new catalog keys**, 0 changed, 0 extra — see §7.

**Behaviour:**

- `ChatLayout` phantom scrollbar in self-scroll mode — root becomes a flex column so the dock's
  height is part of the 100%. External-`scrollRef` mode unchanged. (Our `chat-layout` carries 4
  mismatches, incl. `styles.root` and `styles.messageArea`.)
- `Token`: remove button becomes a **sibling of the link** rather than nested inside the anchor; the
  surface delegates via `useClickableContainer`, so middle-click and cmd/ctrl+click work.
- `DropdownMenu` reports uncontrolled native open/close transitions and restores focus to the
  trigger after native popover dismissal; a submenu trigger no longer double-highlights on hover.
- `CheckboxInput` & `Switch`: clicking the field **description** forwards to the control, while
  clicks on interactive content inside a description are left alone.
- `MetadataList`: numeric `columns` honoured with stacked labels — `repeat(n, 1fr)` vs
  `repeat(n, auto 1fr)`, resolved through a StyleX **dynamic** style. (Note: a dynamic style is
  exactly what our class oracle cannot see — §8.)
- `MultiSelector` trigger loses its own focus outline (was doubling the wrapper ring).
- `NumberInput` hides native spinners and stops a focused wheel gesture scrolling an ancestor.
- `Pagination` mirrors prev/next chevrons **in CSS** rather than reading direction in JS — so it
  server-renders correctly with no hydration flash.
- `Popover` exposes wrapper `role` and `isModal`.
- **`TextArea` layout rework** — the `<textarea>` spans the full container with icons, status and
  the character counter as absolutely-positioned overlays; counter moves inside the container. 13
  oracle mismatches, the second largest, and two new i18n keys.
- `Thumbnail` shows the placeholder when the image **fails to load** (it previously had no error
  handling at all despite the docs promising it).
- `TopNavMegaMenu` caps panel height to the space below the nav and clamps width.
- `TreeList` ArrowLeft/ArrowRight mirror under RTL.
- `Selector`/`MultiSelector` with `statusVariant="detached"` no longer show the on-field status icon.

**Not applicable / verify-then-record:**

- The `.js`-extension dist fix and its `check-fully-specified.mjs` gate are about upstream's Babel
  build. We ship through `svelte-package`; confirm our dist has no extensionless relative specifier
  and record the check as N/A with evidence rather than porting the script.
- Markdown streaming perf test timeouts — a test-config change; check ours declare their own.

---

## 5. Workstream D — genuinely new surface

### D1. `ComplexSelector` (446 LOC, +179 doc, +156 test)

"A rich custom selector shell with accessible button/popover behavior, async change actions, and
optional grid keyboard navigation." Exports `ComplexSelector`, `ComplexSelectorProps`,
`ComplexSelectorRenderState`, `ComplexSelectorSize`, `ComplexSelectorStatus`.

**Import list costed and it comes back empty** — `BaseProps`, `Field`, `Icon`,
`Layer/layerAnimations.stylex`, `Popover/usePopover`, `Spinner`, `i18n`, `theme/tokens.stylex`,
`utils`, `utils/themeProps`, `utils/types` are all ported. Fourth time the check has come back
empty; knowing it is empty is still the result.

`ComplexSelectorRenderState` suggests a render-prop; expect the `Snippet` translation and check
whether it is a leaf slot or a parameterised one before designing the props type.

### D2. `useContainerReveal` — and it is **not** 181 lines

A headless hook revealing content when its container is hovered or focused. CSS-driven, no hover
state in JS. Callers spread `getContainerProps()` and `getContentRevealProps()`.

**Costing the whole import list changes the number by 5×** — the fifth time this pre-flight item has
paid for itself:

| unit | LOC | status here |
| --- | --- | --- |
| `hooks/useContainerReveal.ts` | 181 | new |
| `hooks/containerReveal.pool.stylex.ts` | 571 | new — a *pooled* style module, a shape this port has not built before |
| `utils/devWarning.ts` | 102 | **absent** — the Known-debt family |
| `hooks/useDevWarning.ts` | 54 | **absent** — same |

**So `useContainerReveal` forces the dev-warning decision.** 17c's surface sweep recorded
`devWarn`/`devError`/`warnOnce`/`formatDevMessage`/`useDevWarning` as published upstream with no
counterpart here, and said: *port the module or record it as a deliberate non-port — leaving it
unmeasured is the one option that is not defensible.* A new hook now depends on it, so the deferral
ends this batch. Porting it also lets the **13 ungated `console.warn` sites** become
`process.env.NODE_ENV`-gated in one change, closing the second half of that debt.

`Thumbnail.showRemoveOn="hover"` moves onto the hook internally (no API change) — so `Thumbnail` is
touched by D2 *and* by the placeholder-on-error fix in C.

### D3. Theme targets — additive, and there are many

New `defineTheme` targets to declare and cross-check with the parser-based extraction (the
line-oriented grep failed at 17c and missed four):

- DropdownMenu ×4: `-section-heading`, `-divider`, `-indicator-icon`, `-radio-dot`
- Field/FieldStatus ×2: `astryx-input-status-icon` (reflects `data-size`/`data-status`),
  `astryx-field-status-icon` (reflects `data-type`)
- Markdown ×8: `-heading` (reflects `data-level` 1–6), `-paragraph`, `-list`, `-codeblock`,
  `-blockquote`, `-table`, `-hr`, `-image`; each reflects `data-density`
- `progressbar-mark`
- Table: `astryx-table-cell` / `-header-cell` gain a `density` visual prop
  (`{className, visualProps: ['density']}`)

### D4. `defineTheme`: `color.accent` becomes optional

An accent-less config seeds neutral palettes from the default accent's hue but leaves
`--color-accent`, `--color-accent-muted`, `--color-on-accent` **ungenerated**, falling through to
token defaults. Configs that pass an accent are unchanged token-for-token — which the theme oracle
proves for all five packages.

### D5. SSR-friendly theme and icon registry resolution

"so semantic icons can resolve from a registered theme name without relying on React context." Read
the source before deciding what this means here — Svelte's context is not React's, and this may be
a non-port or may be a real seam.

---

## 6. Workstream E — themes

**Measured: one mismatch across all five packages.** Neutral `--color-text-secondary` light
`#737373` → `#525252` — upstream's WCAG-contrast guarantee ("text-on-surface pairs asserted at
≥ 4.5:1"); `#737373` on white is ≈4.4:1. Matcha 303, butter 430, gothic 345, y2k 357 all clean, both
directions, with no work at all.

Also in that bullet and **not** covered by a declaration diff: `--color-border-emphasized` is
tone-bumped *during generation* until it clears 3:1. If our generator reproduces the generation, it
needs the bump; if our themes are declaration tables, the oracle already covers it. Determine which
before assuming the single mismatch is the whole story.

`astryx theme build` also now generates the `TextColorMap` / custom-Button-variant module
augmentations (§3). `packages/cli` has no sources here, so this stays a note, as the
`KNOWN_COMPONENTS` question did at 17c.

---

## 7. Workstream F — i18n, tests, docs, demo routes

### F1. i18n catalog — resync as a step of its own

Measured: **ours 219, upstream 250 — 31 missing, 0 extra, and all 219 shared keys byte-identical.**
Copy verbatim (it is prettier-ignored to stay that way). Upstream also now ships **`pseudo.json`**,
which this port does not carry — decide and record.

The 31 split: Pagination 7, Timestamp 4, Lightbox 3, Step 5 (a **lab** Stepper — not ported, so
these are catalog-only), TextArea 2, MetadataList 2, Field 2, and one each for AppShell,
AvatarGroup, MultiSelector, Resizable, Button, keyboardHint.

**Note the standing hazard directly:** no oracle covers `en.json`; a missing key falls back to the
key string at runtime, silently. That is why this is its own step and not implied by any component.

### F2. Docs content pipeline — **step one, before anything else**

Repoint `docs/scripts/generate-content.mjs` and `vite-plugin-content.mjs` at the new CLI layout
(`assets/docs/`, `assets/templates/blocks/`), restore the registries, and read the numbers. Baseline
before the bump: 20 topics, 623 examples / 0 pending. 0.3.0 ships **677** `.doc.mjs` files in the
CLI and **20** reference topics under `assets/docs/`.

**Then make it fail loudly.** A content root that resolves to zero entries must be an error, not an
empty array — this is the one failure the pipeline has now demonstrably had, and it cost a green
build. Same shape as the oracle's `ENOENT` fix at 17a: *a restructured upstream file should fail as
a diagnosable error, not silently.*

Expect the block backlog to reopen — `ComplexSelector` and `useContainerReveal` bring their own
example blocks, and per-registry-target duplication applies. **Run the generator and read the
number; do not predict it.**

### F3. Tests

Upstream's suites moved with their components; ours are ported case-for-case and the count is the
contract. Two things specific to this batch:

- **Re-derive every count from the 0.3.0 source**, never from this document. 17c found 26 suite
  headers asserting an upstream count upstream no longer had — a class of rot that goes stale on
  *every* release by construction, and this is a release.
- The **~410-case coverage gap** 17c measured is deliberately **not** in scope here (see §9). Do not
  silently absorb part of it; if a 0.3.0 change lands in a suite with a pre-existing gap, close what
  the change needs and leave the rest counted.

### F4. Demo routes

New sections for `ComplexSelector` and the `Pagination` input variant / `ProgressBar` marks;
`useContainerReveal` needs a story that shows keyboard focus-within, not just hover.

---

## 8. What the gates still cannot see

Unchanged from 17c and worth restating because this batch adds to it:

- **Function styles are invisible to the class oracle** — 54 across 32 modules at 0.2.0.
  `MetadataList`'s new grid template resolves "through a StyleX dynamic style", so 0.3.0 adds at
  least one more. A green oracle says nothing about any of them.
- **A hook's option bag is invisible to the docs prop check** — `hasRowClickExpansion` is this
  release's instance of the `hasExpandAllControl` hiding place.
- **A widened prop *type* is invisible to both** — `Citation.icon` at 17c. `registerIcons()`
  accepting arbitrary keys is the same shape: no new prop name, no new class.
- **The i18n catalog is covered by nothing.**
- **An unported upstream suite is a gap in the component's verification**, not a tidiness debt.

---

## 9. Open decisions

1. **`pseudo.json`** — carry it or record a deliberate non-port.
2. **The dev-warning family** — §D2 forces the port; confirm `__resetDevWarnings` stays
   module-public and barrel-absent, as upstream keeps it.
3. **`ComplexSelectorRenderState`** — leaf slot, parameterised snippet, or sibling module? The
   17b/15 rule decides it: a sibling module is required exactly when the in-file component owns
   state.
4. **SSR theme/icon resolution (D5)** — real seam or React-context artefact.
5. **Whether `astryx-*` theme targets added by D3 need the `themeProps` parser cross-check run
   repo-wide** rather than per-component. 17c's answer was yes; make it a step.
6. **The ~410-case test gap** is explicitly out of scope and ships as a documented limitation of the
   first release. If that is wrong, it is wrong *now*, not after the release.

---

## 10. Sequencing — 18a / 18b / 18c

The split is the point, not bookkeeping: a batch this size run as one unit sits red for its whole
life, and a gate expected to be red tells you nothing. Each sub-batch closes green.

### Batch 18a — unbreak, then finish RTL

0. **The docs pipeline repoint (§F2)** — first, because the tree is currently red in a way that
   exits 0.
1. The three breaking changes (§1), including the ContextMenu Tab fix.
2. `rtlStyles.centerInline` + the lint recogniser; retire the 17a KEEP disables it supersedes (§A1).
3. RTL phase 4c (§A2) and the last physical→logical components (§A3).
4. `isRtl` deprecation tags (§A4).
5. The i18n catalog resync (§F1) — cheap, unblocks C, and no component implies it.

Close when: class oracle mismatches down to the B/C remainder, `build`/`check`/`lint` exit 0, docs
generator back to a real number.

### Batch 18b — new surface + new props

1. `ComplexSelector` (§D1).
2. The dev-warning family, then `useContainerReveal` + the pooled style module (§D2), then
   `Thumbnail` onto it.
3. The 14 props (§3), largest first: Pagination's input variant, ProgressBar marks, Carousel
   `hasLoop`+handle.
4. The non-prop behavioural additions in §3 — the CheckboxInput-composing menu item, the TextInput
   search field, `TextColorMap`, the icon-registry extension keys, `hasRowClickExpansion`,
   `Dialog` logical positions.
5. The new theme targets (§D3) and `defineTheme`'s optional accent (§D4).

Close when: 0 documented props core lacks, oracle green for every touched module, suites for each
new unit ported case-for-case.

### Batch 18c — the fix list, themes, docs, audits

1. Workstream C (§4) in family order.
2. Theme fix (§6) and the `--color-border-emphasized` generation question.
3. Docs regeneration, demo routes (§F4), suite re-ports (§F3) and **the four audit agents**.

**Nothing may write to the tree while a closing audit runs, including the orchestrator** — 17c's
audits contradicted each other because the tree moved under them, and the gate reported before them
was over source that no longer existed.

### Then: the release

Batch 18 ends in the port's **first release**, not another green gate. All six packages are at
`version: 0.0.0` today with no publish workflow and no changesets. That work is scoped separately
once 18c is green — it is a decision about versioning and distribution, not about parity.

---

## 11. Done criteria

| | target |
| --- | --- |
| `pnpm -r build` / `check` / `lint` | exit 0, 0 errors |
| class oracle | 0 mismatches; skip list documented and self-retiring |
| theme oracles (5) | 0 mismatches, 0 missing, both directions |
| i18n catalog | 250 / 250, byte-identical, `pseudo.json` decided |
| docs generator | topics and examples back to real numbers, 0 documented props core lacks, **and a zero-entry content root now fails loudly** |
| tests | every 0.3.0-touched suite re-derived from source and ported case-for-case |
| audits | all four run, over a frozen tree |

---

## 12. Measured baseline (2026-08-07, before the batch)

Read from the tools, not estimated.

| | measurement |
| --- | --- |
| upstream commits `v0.2.0..v0.3.0` | **121** |
| changelog bullets | **82** — 3 breaking, ~27 features, ~44 fixes, 4 docs |
| `packages/core/src` diff | **513 files, +13,106 / −4,103** |
| class oracle | **124 mismatches** over 1504 style keys + 586 inline call sites, 3 skips |
| — by component | slider 18, text-area 13, switch 7, chat-composer 6, multi-selector 5, timestamp 4, selector 4, number-input 4, chat-layout 4, top-nav-mega-menu 3, chat-composer-drawer 3, use-popover 2, checkbox-input 2, banner 2, then 1 each: skeleton, segmented-control-item, resize-handle, radio-list-item, field-status, app-shell |
| theme oracles | **1 mismatch** (neutral `--color-text-secondary`); matcha 303 / butter 430 / gothic 345 / y2k 357 clean |
| i18n catalog | ours **219**, upstream **250**; 31 missing, 0 extra, 0 changed |
| new component dirs | **1** (`ComplexSelector`); 1 removed (`authoring`) |
| new `.doc.mjs` | **2** (`ComplexSelector`, `useContainerReveal`); 205 → 207 |
| docs generator | 207 documented / **210** upstream; **14** undeclared props / 9 components; topics **0**, examples **0** ← the CLI-restructure breakage |
| largest changed dirs (excl. tests/docs/stories) | theme 1135, `docs-types.ts` 1108 (deleted), hooks 863, Timestamp 595, ComplexSelector 446, authoring 382 (deleted), Pagination 287, MultiSelector 281, Token 272, ProgressBar 261, Selector 254, Markdown 246, DropdownMenu 239, TextArea 193, Icon 179, Carousel 167 |
