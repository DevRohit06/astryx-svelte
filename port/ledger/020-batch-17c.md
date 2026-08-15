---
seq: 20
title: Batch 17c — the a11y batch
upstream: 0.2.0
units: [Avatar, AvatarStatusDot, AvatarGroup, Button, Citation, Divider, FileInput, Slider, Item, Calendar]
upstream-prs: []
---

## Scope

~30 accessibility fixes (two of which touch `base.css` and the theme layer), the Known-debts entries
upstream has now fixed, and the theme layer. Closes out the 0.2.0 tracking work started in `17a`
(breaking changes/RTL) and continued in `17b` (new surface/new props).

## Components


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


## Oracle bookkeeping

Measured at 17c's close: `pnpm -r build`, `pnpm -r check` (0 errors, 32 warnings) and `pnpm -r lint`
all exit 0. Class oracle 1490 style keys / 593 inline call sites / 0 mismatches. The skip list is 3,
not the 4 §10 predicted, and none of the 14 release-gated ones survive — they were deleted at 17a
rather than left to rot.

## What the audits caught

### the coverage gap, measured by the closing test-parity audit

- [ ] **~160 upstream cases across 17c's own components are unported, and the shape of the gap is
      the finding.** The audit enumerated with `vitest list` and diffed case titles against the
      pinned 0.2.0 source: **1,911 of 2,083** upstream cases covered across the batch-17c set.
      Almost none of it is a component bug — the features ship and were verified by hand or by the
      oracles. It is **assertions that were never written for behaviour that was**, which is exactly
      the posture that let `Citation.icon`, `Avatar`'s `aria-describedby` and `AvatarGroup`'s
      half-wired roving focus survive. Prioritised: 1. **Three whole upstream files have no counterpart, all in this batch's scope**:
      `ChatComposer.test.tsx` (5 — the elevation body-class and the whole custom-input
      composition seam), `ChatComposerDrawer.test.tsx` (3 — the `aria-controls`/`aria-expanded`
      contract 17c _claims to have delivered_), `MobileNavToggle.test.tsx` (3 — likewise). 2. **`Slider` −13**, the largest single-suite gap, and its header says "nothing added, nothing
      dropped". Two of the missing cases are the RTL track-click pair — which is the assertion
      that would settle the separately-recorded "Slider's pointer math is still unported". 3. **The `statusVariant forwarding` block is one gap, not six.** Upstream ships it in **12**
      suites; this port has it in **3**, all newly ported at 17c. Nine suites lack it (18 cases),
      while `todo.md` records `statusVariant` on all twelve as landed at 17b. 4. **The theme-target assertions never came with the targets** (Calendar, DateInput,
      DateRangeInput, DateTimeInput, Collapsible). The entry above says all sixteen "now emit",
      and they do — this is the second half of the same "two halves verified by different tools"
      hazard, now in its test form. 5. The 0.2.0 APG/a11y assertions for TopNavMenu (−8), TopNav (−8), TopNavMegaMenu (−5),
      SideNav (−5), Carousel (−7), Dialog (−5), DropdownMenu (−9) — 47 unwritten assertions on
      shipped behaviour. 6. Chat −22, Table −10, CheckboxList −3, CodeBlock −2, `plainDate` −4 (the whole
      `formatSharedDate` block, for a util this port ships).
- [ ] **26 suite headers assert an upstream count upstream no longer has, and two contradicted their
      own file.** The two were 17c's (`file-input` said "50 here" with 52; `top-nav` said "all 43"
      with 46) and are fixed; `plain-date.test.ts` has no header at all. **This is the fifth
      recurrence of _a header comment is an assertion and rots like one_**, and the first where the
      rot is systematic rather than incidental — a suite header naming an upstream count goes stale
      on every upstream release, by construction. `date-input.svelte.test.ts` shows the shape a
      correct one takes: it states the upstream total, the local total, and why the difference
      exists. **A check that re-derives each header's upstream count from the clone would retire the
      whole class**, and is the same kind of gate as the `themeProps`-target cross-check above
- [ ] **Repo-wide, ~250 upstream cases cover ported components with no suite at all** — `AspectRatio`
      24, `Grid` 36, `Stack` 30 + `StackItem` 11, `ProgressBar` 27, `Text` 27, `Heading` 23,
      `SizeContext` 21, `Kbd` 15, `HStack`/`VStack` 12 each, `Center` 11, `StatusDot` 10, `Badge` 8,
      `Blockquote` 8, `globalIconRegistry` 8, `VisuallyHidden` 7, `Code` 6, `Card` 5, `Skeleton` 3,
      `useInputStatusIcon` 3, `parseStyleKey` 10, `themeProps` 10, `sharedResizeObserver` 6. Mostly
      leaf primitives, which is why it has never bitten — but `Citation` and `Avatar` were also
      "just" components until their suites landed
- [ ] **Out-of-scope suite deltas, noticed but not audited**: `TreeList` 66→47, `ContextMenu` 40→31,
      `useListFocus` 31→23, `TextInput` 61→53, `Layout` family 80→73, `useGridFocus` 12→8,
      `TimeInput` 39→35, `PowerSearch` 21→17

- [ ] **`calendar-day`'s `marker` state does not exist here.** `calendar-nav` landed during 17c's
      close, but the second half of the same Calendar finding did not: upstream stamps a `marker`
      state on the day cell (`Calendar.tsx:1103`) and nothing in
      `src/lib/components/calendar/` emits it. It is the same shape as the sixteen theme targets —
      a theming seam whose two halves are checked by different tools and therefore by neither — and
      it is what the 11 absent Calendar cases (upstream's 63–73) are about. Add the state, then the
      cases


### found by the closing surface sweep (all predate 17c unless noted)

- [ ] **The dev-warning family is published upstream and has no counterpart here — 5 names.**
      `utils/index.ts` publishes `devWarn`, `devError`, `warnOnce` and `formatDevMessage`;
      `hooks/index.ts` publishes `useDevWarning`. This port has no `devWarning` module at all — the
      only `warnOnce` in the tree is file-private in `i18n/resolve.ts`. The _behaviour_ was ported
      inline everywhere it was needed (`port/ledger/` records `useOverflow` turning `useDevWarning`
      into a plain `$effect`), so nothing is missing functionally; what is missing is the published
      surface, and it was never accounted for either way. **Port the module or record it as a
      deliberate non-port** — leaving it unmeasured is the one option that is not defensible.
      `__resetDevWarnings` is module-public and barrel-absent upstream and must stay so
- [ ] **This port's dev warnings are unconditional `console.warn`; upstream's `devWarn` is gated on
      `process.env.NODE_ENV !== 'production'` and is a no-op in prod.** Thirteen sites are affected
      (`dialog.svelte`, `avatar.svelte`, `field.svelte`, `checkbox-list-item.svelte`, …). The
      convention is stated _in code_ — `avatar.svelte` says "a plain `console.warn`, never gated on
      `process.env`" — but has never been in this list, which is the same failure mode as the
      comments those entries describe. Recorded now; gating it is a one-module change once the
      family above is settled
- [x] **`ChatComposerInputControl` has no counterpart, and neither does the field it types** —
      **retired in batch 18.** Upstream publishes it from `Chat/index.ts` (`{ focus: () => void }`)
      and `ChatContext.tsx` carries an `inputControlRef` field on `ChatComposerContextValue`; this
      port published `ChatComposerInputHandle` — upstream's _other_, fuller imperative type — and
      had neither the field nor the narrow type. Both now exist. The port keeps upstream's _name_
      with a **callback ref** rather than a `{current}` box, following this repo's own doctrine:
      read-direction refs become getters, but a getter cannot carry a child→parent write, and
      `ChatLayoutContextValue.contentRef` was already a callback-ref field on a context value. The
      registration is read through `untrack`, because the composer rebuilds its context value on
      every `value` change and a plain read would re-run the effect on every keystroke.

      **The missing field was masking a live bug**, which is the part worth remembering: with no
      registration, `chat-composer.svelte` fell through to `querySelector('[contenteditable="true"],
      textarea')` — and that fallback made the ported case pass either way. A two-way mutation check
      is what settled it (neutering the fallback still passes → the control really is used;
      neutering the registration still passes → the case is blind to it). See the
      [absent-suite audit](#known-debts) note: upstream's `ChatComposer.test.tsx` is unported and
      contains the case that *could not* have been masked, because it uses a plain `<input>` the
      fallback selector does not match

- [x] **`package.json`'s `sideEffects` and the missing `exports["."]` default** — **both retired in
      batch 18.** `sideEffects` was `["**/*.css"]`; upstream also lists `**/*.stylex.ts` and
      `**/*.stylex.js`, and the tarball ships 198 `.stylex.js` files that were declared side-effect
      free. Upstream marks them because a consumer's bundler must _visit_ the module for the StyleX
      plugin to emit its CSS — the "renders unstyled with no error" failure `CLAUDE.md` describes
      for `docs/`. No dropped module was ever demonstrated, so it was latent rather than live; both
      globs are now declared. Upstream's `**/componentStyles.ts` is deliberately **not** copied —
      no such file exists in this kebab-case tree, so it would be an invented reference.

      `exports["."]` carried `types` and `svelte` but no `default`, where all seven sibling subpaths
      carry one: simulating Node's resolver with conditions `["node","import"]`, `.` resolved to
      **null** while every subpath resolved. Now `"default": "./dist/index.js"`, matching upstream's
      `.` entry. Upstream's `"source"` condition stays out — present on 116 of its 123 entries and
      none of ours, it is a bundler hint rather than published API, and adding it to `.` alone would
      be the inconsistency this entry was about

- [ ] **Three `./theme` names are load-bearing on the _root_ surface**, which sharpens that
      73-name gap: `DefinedTheme` is referenced by our published `ThemeContextValue`,
      `SyntaxThemeDefinition` by our published `CodeBlockProps`, and `SyntaxThemeTokenKey` by our
      published `UseSyntaxThemeReturn` — so a consumer can hold those values but cannot name their
      types. A full scan found 59 locally-declared types referenced by published declarations; only
      these three have an upstream public counterpart, and all three sit inside the recorded theme
      gap. The other 56 are module-public/barrel-absent on both sides and are correct as-is
- [ ] **`src/tests` (206 files) and `src/routes` (32) ship in the tarball.** `files` includes `src`
      with a `*.test.*` denylist, which the fixtures and `*.stylex.ts` probes under `src/tests` do
      not match, and the SvelteKit demo app has no upstream counterpart at all. Upstream ships its
      232 test files, so we are stricter on tests and looser on everything around them. Bloat rather
      than breakage — 2,264 files packed, of which `src/lib` is 675


## Rules promoted

Not promoted at the time.

## Retired debts

### Resolved — (ungrouped preamble)

- [x] ~~**`Selector`/`MultiSelector` are missing the 0.2.0 clear- and indicator-icon theme
      targets**~~ — **landed at 17c, and the gap was four times wider than the entry said.** A
      ported suite reported the Selector pair; a sweep for the rest of 0.2.0's "new theme targets"
      list found **twelve missing in total**, none of which any gate could see:
      `selector-clear-icon`, `selector-indicator-icon`, `multi-selector-clear-icon`,
      `multi-selector-indicator-icon`, `date-input-clear-icon`, `date-input-toggle-icon`,
      `date-range-input-clear-icon`, `date-range-input-toggle-icon`,
      `date-time-input-date-segment`, `date-time-input-time-segment`, `collapsible-trigger` and
      `command-palette-group-heading`. All twelve now emit, with the `data-state` /
      `size`+`status` / `density` reflections upstream gives them.

      **This is the fourth instance of the batch-17 "no gate sees it" pattern, and the clearest.**
      A theme target is a *class on an element* — it is not a prop, so the docs generator's
      name-comparison is blind; it is not a StyleX atomic class, so the class oracle is blind; and
      the theme oracles compare *declarations a theme emits*, which is the half that already worked
      (`generateThemeCss` takes an arbitrary component key, so `defineTheme` could always generate
      `.astryx-selector-clear-icon { … }` — pointing at a class no component rendered). **The two
      halves of a theme target are verified by different tools, and nothing checked that they met.**
      Worth a real gate: a check that every `themeProps(key)` in component source has a
      corresponding documented target, and vice versa, is the shape upstream added on its own side
      after the de-hyphenated-key bug.
  - Retired by: own title says resolved ("landed at 17c").

- [x] ~~`FieldLabel` drops the props its type promises (incl. `xstyle`)~~ — **retired at 17c.**
      0.1.9 forwards `className`/`style`/`xstyle` and pass-throughs, and this port followed
      (`id`/`for` before the rest spread, so a consumer `id` wins, as upstream's does). Its
      consequence retired with it: the `forwards ref correctly` case now _has_ an attachment
      counterpart, and `field.svelte.test.ts` carries it
  - Retired by: own title says resolved ("retired at 17c").

- [x] ~~`ChatSendButton` destructures a closed list off `BaseProps<HTMLButtonElement>` and does **not** rest-spread~~ — **retired at 17c.** 0.1.9 forwards `className`, `style` and pass-throughs, and this port followed. The spread moved to upstream's position, **after** the component's own `label`/`variant`/`icon`/`onclick`, which a consumer's rest therefore overrides — a deliberate reversal of what this port did while upstream dropped rest entirely. The `as Partial<ButtonProps>` cast stays for the reason it always had: `Button` takes the _intersection_ of the button and anchor attribute sets, so every handler off a `BaseProps<HTMLButtonElement>` rest is contravariantly incompatible — the same clash `Timestamp` records against `Text`
  - Retired by: own title says resolved ("retired at 17c").


### Retired — (ungrouped preamble, one entry of two — the other belongs with page templates)

- [ ] **`Avatar` and `Button` have no ported test suite**, which is what let their hard-coded `<a>`
      (the `LinkProvider` bypass fixed in batch 17b) go unnoticed for the whole port. Both are
      high-fan-in leaves — `Button` is fan-in 16 — so the absence is felt indirectly through their
      dependents rather than seen. `AvatarStatusDot` (19 upstream cases) and `Citation` (16) are
      missing too.
  - Retired by: `avatar.svelte.test.ts` (555 lines), `button.svelte.test.ts` (533 lines),
    `avatar-status-dot.svelte.test.ts` (261 lines) and `citation.svelte.test.ts` (241 lines) all
    now exist as substantial ported suites.


## Debts opened

-
