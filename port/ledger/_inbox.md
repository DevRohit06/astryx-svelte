## Batch 17c — the coverage gap, measured by the closing test-parity audit

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

## Batch 17c — found by the closing surface sweep (all predate 17c unless noted)

- [ ] **The dev-warning family is published upstream and has no counterpart here — 5 names.**
      `utils/index.ts` publishes `devWarn`, `devError`, `warnOnce` and `formatDevMessage`;
      `hooks/index.ts` publishes `useDevWarning`. This port has no `devWarning` module at all — the
      only `warnOnce` in the tree is file-private in `i18n/resolve.ts`. The _behaviour_ was ported
      inline everywhere it was needed (`PORTED.md` records `useOverflow` turning `useDevWarning`
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

## Batch 17b — the status-variant family

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

## Batch 16 — `Chat` (ported; the debts below are what the ported units have left behind)

- [ ] **`ChatComposerInput` renders one element upstream does not: a `display: contents` span per
      token portal.** Upstream `createPortal`s each token's content _directly_ into the
      imperatively-created token span. Svelte has no portal, and `mount()` is not the substitute —
      it starts a separate component tree, so context would stop reaching the content and
      `ChatPastedTextToken`'s `useTranslator()` would silently fall back to the shipped `en`
      catalog instead of the provider's. The content is therefore rendered in the component's own
      tree inside a `display: contents` span, which an attachment moves into the token span:
      context, reactivity and teardown all behave as they would in place, the wrapper generates no
      box, and the emitted atomic classes are unchanged. Upstream's _custom-render_ branch already
      has a wrapper span of its own (`<span key={id}>{token.render()}</span>`), so the extra element
      only appears on the Badge and pasted-text branches
- [ ] **`<TriggerMenuLayer>` has no upstream counterpart**, for the reason every `*Layer` companion
      does — `useTriggerMenu`'s `renderMenu()` returns markup. Unlike `ImperativeDialogLayer` it is
      **not published**: upstream's `Chat/index.ts` exports no `useTriggerMenu`, so neither half of
      the pair reaches the barrel and no public name is invented. `TriggerMenuLayerProps` likewise
- [ ] **Divergence (ours is correct; upstream's `escapeRegExp` is broken).**
      `ChatTokenizedText.tsx` writes `/[.*+?^${}()|[\\]\\]/g`, where the doubled backslash before
      `]` closes the character class early — the pattern ends up matching "one of those specials,
      then a literal `\]`", which no realistic token value contains. So upstream escapes _nothing_:
      a token whose `value` holds a `.` silently matches as a wildcard, and one holding `(` makes
      `new RegExp` throw a `SyntaxError` and takes the render down with it. This port writes MDN's
      `/[.*+?^${}()|[\]\\]/g`, which is plainly the intent. Documented rather than replicated, per
      CLAUDE.md — and it is a crash, not a cosmetic difference, which is what settles it against the
      "a component's own behaviour is replicated" reading
- [x] ~~**Hard-coded English in `ChatDictationButton` and `ChatToolCalls` bypasses
      `useTranslator`**~~ — **retired at 17c's close.** The row was written against 0.1.7 (and cited
      its line numbers); **upstream translates both at 0.2.0**, so this stopped being a replicated
      upstream quirk and became a plain gap. Both now route through `useTranslator`:
      `@astryx.chatDictationButton.stopDictation`/`.startDictation` and
      `@astryx.chatToolCalls.groupLabel` with its `{count}` parameter. Found by the closing parity
      audit, and worth noting **why nothing else could find it** — our catalog is a byte-exact
      219/219 match with upstream's, so a catalog diff sees nothing, and `groupLabel`'s default is
      `"{count} tool calls"`, so the English render was identical. These were the _only_ three keys
      in the catalog that upstream uses and our source never referenced; that query is the check
      worth keeping. The comparable rows for `MultiSelector`, `Tokenizer` and the date family are
      still live — they are upstream quirks at 0.2.0, unlike these two
- [ ] **`ChatToolCalls` accepts a `label` prop it never reads.** Upstream destructures it and drops
      it on the floor (`ChatToolCalls.tsx:482`), so the published type promises a label that has no
      effect on the render. Replicated — including the dead prop — because removing it would narrow
      the published API
- [ ] **`ChatToolCalls`' `defaultIsExpanded` JSDoc contradicts its own implementation.** Upstream
      documents "@default true for ≤3 calls, false for >3" and then writes `?? false`
      (`ChatToolCalls.tsx`), so the auto-collapse the sentence describes does not exist. Both the
      behaviour and the comment are replicated verbatim, which means the incorrect sentence also
      ships in the docs prop table
- [ ] **`ChatToolCalls` keys its rows by content, so two identical calls throw.** `getToolCallKey`
      joins name/status/target/node/duration/additions/deletions/errorMessage when `key` is absent —
      and `key` is optional — so an agent that runs the same command twice with the same timing
      produces a duplicate. React warns and renders both; Svelte raises `each_key_duplicate` and
      takes the render down. Same hazard as the four positional-key rows above, resolved the other
      way round: those keep positional keys to avoid the throw, this one keys by value to match
      upstream. Upstream's own stories pass explicit `key`s, which is the documented way out
- [ ] **Every `ReactNode` leaf slot in `Chat` is `string | Snippet`** — `ChatMessage`'s `avatar` and
      `name`, `ChatMessageMetadata`'s `timestamp` and `footer`, `ChatSystemMessage`'s `children`,
      `ChatToolCalls`' `stats` and `label`, and `ChatComposerDrawer`'s `label`, which upstream feeds
      the raw `count` number (`ChatComposerDrawer.tsx:291`) and this port stringifies. The settled
      shape for the whole port, recorded here because `Chat` is where the largest number of them land

## Batch 15 — the imperative dialog pair (ported; the debts below are what the batch left behind)

- [ ] **`ImperativeDialogLayer` and `ImperativeAlertDialogLayer` are exports upstream has no
      counterpart for**, and so are their props types. `useImperativeDialog` and
      `useImperativeAlertDialog` each return `element: ReactNode` — a rendered value Svelte has no
      equivalent of — so the rendering half becomes a component, exactly as `useLayer` → `<Layer>`,
      `useTooltip` → `<TooltipLayer>`, `useKeyboardHint` → `<KeyboardHintLayer>` and
      `useLightbox` → `<LightboxLayer>` already do. `ImperativeDialogLayerProps` /
      `ImperativeAlertDialogLayerProps` likewise have no upstream name, for the same reason
      `LayerProps` and `LightboxLayerProps` do not
- [ ] **`ImperativeDialogReturn.content` / `.options` and `ImperativeAlertDialogReturn.options` have
      no upstream counterpart** — upstream's `element` closure owned that state directly, and
      splitting the rendering half out means the component needs a way back in. The same seam
      `UseLightboxReturn.setIndex`/`.options` opens, for the same reason. Both hooks take their
      options as a **getter**, this port's standing shape, and here it is the faithful translation
      rather than a convention applied blindly: upstream lists `defaultOptions` in the `useMemo`
      dependency array, so it genuinely re-reads it
- [ ] **`show()`'s content is `string | Snippet`, not `ReactNode`** — the `ToastOptions.body` case
      rather than the `Tooltip`/`HoverCard` one. Content is handed to a _function_ at call time, so
      there is no markup position to capture as a slot and the string branch is reachable. Not
      exported under a public name, for the reason `ToastContent` is not: upstream's counterpart is
      React's own `ReactNode`, so an alias would invent API. **One semantic difference worth
      knowing**, found by the idiom audit and not exercised by any consumer here: a `Snippet` is a
      _live template_ where a `ReactNode` is a _frozen value_, so `show(detail)` keeps re-reading
      the caller's state after the dialog is up, where upstream's `show(<Detail item={selected}/>)`
      freezes `selected` at show time. Every ported call site passes a snippet whose closure reads
      nothing mutable, so the two agree today
- [ ] **Upstream quirk (replicated): a changed `defaultOptions` is mostly shadowed.**
      `useImperativeDialog` seeds its `options` state _from_ `defaultOptions` and also spreads
      `defaultOptions` before it, so a later change can only contribute keys the initial read did
      not have — every overlapping key loses to the initial snapshot. Collapsing the two spreads
      would tidy it and change which side wins, so it is replicated
- [ ] **Divergence (ours is the better behaviour; upstream's is an effect-ordering accident):
      on the imperative-open path, focus lands on the dialog title, not the close button.**
      React runs passive effects child-first, so upstream's `DialogHeader` focuses its
      `<h2 tabindex="-1">` _before_ `Dialog`'s effect calls `showModal()`, whose own focusing steps
      then move focus to the first focus delegate — the close button. Svelte runs user effects
      parent-first, so `showModal()` goes first and the header's focus lands last and sticks.
      Verified in Chromium on the `DialogConfirmationDialog` block: after `show()` the active
      element is the `<h2>` "Delete project?", and one Tab reaches the `Close` button. **Only the
      imperative path can show this** — everywhere else `DialogHeader` is already mounted when
      `isOpen` flips, so its focus call happens while the dialog is still `display: none` and is a
      no-op on both sides. Ours is what `DialogHeader`'s own comment asks for ("auto-focus the title
      for screen reader accessibility"), which React's ordering silently defeats, so CLAUDE.md's
      rule applies and it is documented rather than replicated. If exact parity is ever wanted the
      change is one word: `$effect.pre` in `dialog-header.svelte`, which reproduces React's losing
      race
- [ ] **The docs generator would otherwise have advertised an `element` return the port does not
      ship.** Both `.doc.mjs` files list `element: ReactNode` in a `props` table, and the type
      mapper turns `ReactNode` into `string | Snippet` with a "renderable slots" note — a member
      that does not exist, described as a slot it is not. `classifyUndeclaredProp` now names it and
      points at the companion component instead, the same mechanism the `ref` rows already use.
      Found by the batch-close parity audit, not by review. The fix came with a second one: the
      props index now also reads `*Return` interfaces, and `propsTypeNamesFor` appends
      `<Name>Return`, so the two hooks' real members (`show`/`hide`/`isOpen`) type from
      `ImperativeDialogReturn`/`ImperativeAlertDialogReturn` rather than from upstream's React
      strings. Scoped by construction — the new candidates are last in the list, so they can only
      type rows nothing already typed, and the only entries they reach are these two (the twelve
      Table plugin hooks name their returns something else and are unchanged)

**Batch 15's surface sweep — five _pre-existing_ items it measured rather than assumed. None is a
batch-15 defect; each is new information about something already recorded, and each is one
directory's worth of work:**

- [x] ~~**`dropdownMenuContext` is withheld for a reason that is not true.**~~ — **retired at 17c's
      close.** The const is renamed `DropdownMenuContext` and published from the root barrel; the
      module's header now states upstream's own reason for publishing it. The stated justification
      ("a Svelte context has no equivalent value to export") was contradicted by the ten `Context`
      objects already on this barrel — the same class of defect batch 14 found in four file headers.
      **New information from the 17c sweep**: upstream only began publishing it _at 0.2.0_, so this
      was not merely an old asymmetry we had declined to follow — it became a 0.2.0 addition we
      missed. `FormLayoutContext` is the second site and is still open
- [ ] **`useTruncation` and `UseTruncationReturn` are not absent — they are renamed.** The record
      says they are missing; what is actually true is that `createTruncation` and `Truncation` exist
      in `internal/truncation.svelte.ts` and are on no barrel. Retiring the debt is a rename plus an
      export, not a port. (`UseTruncationOptions` genuinely has no counterpart: ours takes a
      `() => number` getter rather than an options bag)
- [ ] **`ButtonVariantMap` is the one missing `*VariantMap`** — 12 of upstream's 13 augmentation
      interfaces are published here, and `Button`'s does not exist at all; `ButtonVariant` is a
      hand-written union in `button.stylex.ts`. `badge.stylex.ts` is the pattern to copy (declare
      the interface, derive the union as `keyof`, export both). Consumers can extend every variant
      map _except_ the one on the highest-fan-in component.

      **`TokenColorMap` was briefly the second and is now closed** (17c). 0.2.0 added the seam and
      `todo.md` recorded it as surface to port; `token.stylex.ts` still carried a hand-written union
      whose comment asserted _"upstream has no augmentation seam"_ — true when written, false for a
      release. **A fourth instance of the batch-17 pattern**: a widened *type* with no new prop name
      is invisible to the docs generator, and only the surface sweep saw it. The count moved 12 → 13
      because 0.2.0 added the interface

- [ ] **Two headline numbers in this file were stale and are now measured:** the subpath list said
      _seven_ (it is **nine** — `./theme/syntax` and `./locales/*.json` were missing from it), and
      the theme gap said "~90 names"; it is **73**, because batch 8's `Theme`/`useTheme` family
      closed the difference and the headline was never updated
- [ ] **The over-export arithmetic now closes exactly**, which is worth keeping as a property rather
      than a number: **62** root-reachable over-exports = 37 recorded families + 3 `Layer`/`Toast`
      root-vs-unit + `TableContextProvider` + `StyleArg` + **20** sanctioned render-split names.
      Nothing is unaccounted for, so a _new_ over-export cannot hide in the total.

      **Re-measured at 17c's close, and the property did its job.** The sweep found **65**, with
      three names unaccounted for — `SwitchSize`, `ChatComposerElevation` and `Elevation`, all three
      of them 0.2.0 surface this batch family added (`Switch` gained `size`, `ChatComposer` gained
      `elevation`, and `elevation` spread across a dozen components). The first two are named
      aliases for unions upstream **inlines**, joining the four already recorded; `Elevation` is
      module-public and barrel-absent upstream, the `focusableSelector` rule. All three are now
      **removed from the barrel**, which is what brings the total back to 62. The render-split count
      also moved 18 → **20**: `InputStatusIcon` and `InputStatusIconProps` joined it with 17b's
      status-variant family and are documented in place — bookkeeping, not a defect, but the
      arithmetic stops closing if it is not carried

## Batch 14 — PowerSearch (ported; the debts below are what the batch left behind)

- [ ] **Upstream ships two different token renderers and two different truncators, and calls one of
      them something it is not.** `PowerSearchToken.tsx`'s docstring says it is "the built-in
      implementation used by PowerSearch"; `PowerSearch.tsx` never imports it. The same is true of
      `PowerSearchFilterEditor` vs `PowerSearchEditPopover`. The inlined renderer's `truncateString`
      cuts past `limit + 3` and appends three ASCII dots; `formatFilterValue`'s `truncate` cuts past
      `maxLength` and appends one U+2026 — and **both are fed the same `maxTokenLength`**. They also
      differ on `enum_list` joining, on `Intl.NumberFormat`, and on whether `timezoneID` is honoured.
      Each is transcribed at its own call site rather than unified, because unifying them would
      change rendered output. The consequence for a consumer is real and worth stating: composing on
      top of the _published_ `PowerSearchToken` gets you different text from the default token
- [ ] **`usePowerSearchSource` slices the value out of the _untrimmed_ query.** `lower` is
      `query.toLowerCase().trim()` but `rawValue` is `query.slice(prefix.length)`, so a leading
      space desynchronises the offset — `'  title foo'` matches the prefix `'title '` and yields
      `'e foo'`. **Replicated, not corrected**, because correcting it means choosing semantics
      upstream never states (does the value keep interior whitespace? does the content-search item,
      which deliberately uses the raw query, trim too?). No upstream case covers it
- [ ] **`matchesFilter`'s operator dispatch is `Object.hasOwn` here where upstream writes
      `operator in stringOpHandlers` — the one place the port deliberately diverges.** `in` walks the
      prototype chain, so a filter carrying `operator: 'propertyIsEnumerable'` resolves an
      `Object.prototype` method and _calls_ it as a comparator. Unreachable through the typed API and
      reachable from deserialised filter state, which is a real path for a search UI whose filters
      round-trip through a URL. `Object.hasOwn` says what the `in` was reaching for with nothing to
      invent, so this is documented-not-replicated. Verified no upstream case pins the `in`
      behaviour
- [ ] **`formatFilterValue` is reachable from nothing.** Upstream publishes it _only_ at
      `@astryxdesign/core/PowerSearch/utils`; it is deliberately absent from the `PowerSearch/index.ts`
      barrel, so it never reaches the package root on either side. This port ships 8 subpath keys
      against upstream's 123, so `./PowerSearch/utils` is one more instance of the standing
      per-component-subpath debt rather than a decision taken about this module. `power-search/utils.ts`
      exists to keep the grouping visible
- [ ] **0.2.0 added `@astryxdesign/core/BaseProps` as a subpath, and this port deliberately did not
      follow.** Upstream's changelog files it as a _fix_: `astryx swizzle` generates
      `import type {BaseProps} from '@astryxdesign/core/BaseProps'`, and the specifier did not
      resolve. **This port has no `swizzle`** — `packages/cli` is still just a `package.json` (Phase 4) — so nothing here emits that specifier, and `BaseProps` is already reachable from the root
      barrel. Adding one of upstream's 123 subpaths in isolation would not close the standing debt
      above and would make the 9-key list look arbitrary rather than deferred. **Revisit with the
      CLI**: when `swizzle` is written, this subpath is a prerequisite, not an option
- [ ] **`PowerSearch` is a closed-prop-list root that replicates rather than forwards.** It
      destructures a closed list off `BaseProps<HTMLElement>` with no rest spread, exactly as
      upstream does, so `id`/`role`/`aria-*`/handlers its type promises are dropped. It joins
      `Slider` and `Token` as the third _replicating_ exception to the standing "forward and
      document" convention, and for the same reason as `Slider`: there is no single element to
      forward to. `xstyle`/`class`/`style`/`data-testid` and the four content props all reach the
      `Tokenizer`, which is where upstream sends them; the root `<div>` carries only
      `themeProps('power-search')`
- [ ] **`PowerSearchWithTable.stories.tsx` (2 stories) is not ported to the demo route.** It is the
      only cross-component stories file in all 158, and its substance is already covered by the
      `PowerSearchSearchWithTable` docs block, which _is_ ported. Recorded because the demo route's
      note says "all 24 of upstream's `PowerSearch.stories.tsx` stories" and that sentence should
      not be read as "all of upstream's PowerSearch stories"
- [ ] **Upstream's own `Custom Components Map` story never exercises its `Token` override.** The
      story passes `config={fullConfig}` with a preset filter of
      `{field: 'status', operator: 'is', …}`, but `fullConfig`'s `status` field declares `any_of` and
      `none_of` and no `is` — so `getOperator('status','is')` is `undefined`, the override lookup is
      skipped, and the default renderer emits the bare label `Status:` with no value. Confirmed in a
      browser: 0 coloured spans. The `integer` **Editor** override on the same story _does_ fire.
      Transcribed faithfully; the inconsistency is upstream's story data, not the override mechanism
- [ ] **Clicking a token whose operator is `empty` opens a popover that closes itself.** The
      auto-save effect fires during the mount flush and calls `onSave`, which sets the state back to
      idle — and _then_ the frame queued by `setPopoverState` runs `popover.show()` on a layer with
      no content. Upstream does the same (its passive-effect flush also beats the frame). Named here
      because it looks like a port bug and is not
- [ ] **Three symbols are published from our root that upstream publishes only from a unit barrel**
      — `layerAnimations`, `ToastViewport`, `ToastViewportProps`. Found by the batch-14 surface
      sweep and **pre-existing, not from this batch.** It matters because `Layer` and `Toast` are the
      only two upstream units whose root re-export is _enumerated_ rather than `export *`, so they
      are the only two where unit-barrel membership and root membership can differ — and that gap is
      exactly six symbols, of which we withhold three (`LayerContext`, `useLayerContext`,
      `LayerContextValue`, on the record above) and publish three. `layerAnimations` sits three lines
      below `LayerContext` in the same upstream barrel and gets the opposite treatment. **One rule
      has to win**: either root membership is the contract (drop the three) or unit-barrel
      membership is (add the other three and reverse the earlier decision). Not resolved at batch-14
      close because changing published API on the way out of an unrelated batch is the wrong moment

## Batch 13 — the Table plugin hooks (ported; the debts below are what the batch left behind)

- [ ] **`useTableStickyColumns`' attachment is not `untrack`ed, and a dynamic config would pay for
      it.** `use-table-sticky-columns.ts:214-236` calls `update()` synchronously at `:231`, and
      `update()` reads `resolved()` → `config()`. An attachment body runs inside an effect, so any
      `$state` read reachable from the config getter is _tracked_: a consumer writing
      `endKeys: showNotes ? ['notes'] : undefined` would tear down and re-attach the scroll listener
      on every toggle rather than just recompute the offsets. **Inert today** — all five demo
      configs and every fixture pass literal arrays that read nothing reactive, which is why no test
      catches it — so this is the `useOverflow`/`useListFocus` `untrack` rule waiting for its first
      dynamic caller. Found by the batch-close idiom audit, which was explicit that it is a latent
      hazard and not a present defect
- [ ] **A resized last column keeps a DOM-only width that `columnWidths` never learns about, and
      "reset" plausibly cannot clear it — upstream does the same.** `column-resize-handle.svelte`
      deliberately leaves the drag's imperative inline widths on the `<th>`s at commit (to avoid a
      flash), while `buildWidthUpdates` excludes the last column from `updates`. So after a drag the
      last column carries a pixel width that lives only in the DOM. Clearing `columnWidths` — what
      `PersistingWidths`' "Reset all widths" button does, upstream's own story — snaps back every
      column the record knows about and plausibly leaves that one where the drag put it. React
      reconciliation would not clear it either, since the style prop never changed, so **this is
      upstream's behaviour rather than a port defect** and belongs here rather than being
      "corrected". **PLAUSIBLE, not confirmed**: it was reasoned from both files by the batch-close
      idiom audit and has not been reproduced in a browser. Reproduce it before acting on it
- [ ] **A `.ts` plugin hook cannot author a `Snippet`, and that is the whole shape of this batch.**
      An Astryx plugin fills `TableColumn.header`/`renderCell` and
      `HeaderCellRenderProps.content`/`before`/`after`/`overlay`/`below` with JSX that closes over
      its own state and over per-cell data. A Svelte snippet can only be authored in a `.svelte`
      file, and the slots are typed `Snippet` — so there is nothing for a hook to close over with.
      Three mechanisms answer it, in increasing order of how much they had to invent:
  - **Module-exported snippets.** Svelte lets a `.svelte` file `export` a snippet from
    `<script module>` as long as it references only module-scope bindings — and an `import` is
    module scope, so a snippet may render an imported component freely. This is the workhorse.
  - **State reaches those components by _context_, which is upstream's own design.**
    `useTableSelection` already publishes a `SelectionStore` through `SelectionStoreContext` and its
    header/cell markup reads it — so the markup needs no closure on either side, and the port's
    snippets are upstream's JSX verbatim. `rowIndex` is the one that _gains_ a context: upstream
    closes over `lookup`/`startFrom` where we cannot, so it publishes them the same way. Public API
    and rendered output are unchanged.
  - **`internal/with-props.ts`** binds a plugin's state onto its provider component, because
    `TableContextProvider` is `Component<{children}>` and has no prop slot. Leans on one fact,
    verified against the compiler output for **both** targets rather than assumed: a Svelte 5
    component is invoked as `Component(internals, props)` on the client _and_ the server. Props are
    merged by **descriptor**, not spread, so a reactive prop stays a getter.
- [ ] **`internal/bind-snippet.ts` is the one genuinely new mechanism, and it was a deliberate
      choice over widening the published types.** `sortable` wraps each header's _existing_ content
      in a button; `columnResize`, `filtering`, `tree` and `rowExpansion` are the same shape. That
      per-cell data cannot travel through a context, so a parameterised module snippet is bound to a
      zero-arg one. The alternative considered and rejected was widening every slot to accept a
      `{component, props}` descriptor — cleaner types, but visible drift from upstream's surface.
      **The subtlety it contains:** Svelte compiles snippet _parameters_ as getters on the client
      and as plain values on the server. The binder always passes the getter and the snippet body
      reads it through `unwrapSlotArg`, so one spelling covers both with no build flag and no
      sniffing of the first argument. **Invariant: the bound argument must be an object, never a
      function** — that is what makes the test unambiguous. Pinned by `bind-snippet.svelte.test.ts`
      and `bind-snippet-ssr.test.ts`, both **beyond upstream** (React has no analogue), the second
      mutation-checked. A Svelte upgrade that changed the parameter convention would break this;
      the SSR test is what would catch it.
- [ ] **`useTableSelection`'s external store and imperative row styling both collapse.**
      `SelectionStore` + `useSyncExternalStore` exist to give React fine-grained per-row
      subscriptions, and the `ref` callback that sets `aria-selected`/background exists to avoid
      re-rendering every `<tr>` to restyle one. Svelte is already fine-grained and
      `transformBodyRow` runs inside a `{@const}` — a derived — so both become declarative
      `htmlProps`. `mergeRefs`, `subscribe`/`notify`/`getConfig` and the `useEffect` that fires
      `notify()` on every render have no counterpart. This is the largest single simplification in
      the batch and the one most worth re-checking against upstream behaviour.
- [ ] **`useTableSelectionState.setSelectedKeys` is a plain setter**, not
      `React.Dispatch<SetStateAction<Set<string>>>`. The updater form exists because a React setter
      may see stale state inside a batch; a `$state` read never is. First hook in the port to take a
      React setter, so it is the shape the rest should follow.
- [ ] **Hook results expose getters, not properties.** `useTableSortableState` and
      `useTableColumnSettingsState` return one object for the component's lifetime where upstream
      returns a fresh one per render, so a plain property would freeze `sortedData` at its first
      value. Same hazard the `useThemeHookUsage` docs block records — **destructuring these results
      is the mistake they invite**, and nothing in the type system prevents it.
- [ ] **`stickyColumns` needs no ref merging at all.** Upstream hand-merges a `RefCallback` with a
      possible `RefObject` so a prior plugin's ref on the scroll container survives. Attachments
      compose, so ours adds one under its own `createAttachmentKey()` and `mergedRef` disappears.
      Its `ResizeObserver` goes through the already-ported shared observer.
- [ ] **`groupedRows`' Proxy is not a React workaround and must not be "cleaned up".** `BaseTable`
      evaluates `col.renderCell(item)` for every row _before_ `transformBodyRow` can replace a
      synthetic header row's cells, so a user renderer doing `item.name.toUpperCase()` would throw.
      Our `bodyCellsFor` runs before `transformBodyRow` in `bodyRowFragment` exactly as upstream's
      does, so the hazard and the fix both carry over.
- [ ] **Plain `Set`/`Map` with `svelte/prefer-svelte-reactivity` disabled at 13 sites.** Two
      reasons, both recorded in the files: `selectedKeys` is `Set<string>` in upstream's published
      config type and is not ours to change; and the rest are built fresh inside a `$derived` and
      never mutated after, so the derived is already the reactive boundary and a `SvelteSet` would
      add signal bookkeeping with no reader. Same argument `table-context-menu.svelte` already makes.
- [ ] **The batch-11 contract note held.** "A plugin must return a stable component reference" is
      why every `transformTableContext` here binds its provider **once**, outside the transform.
      `table-plugin-smoke.svelte.test.ts` pins it by element identity — a changing reference would
      replace the `<tr>` rather than mutate it, silently losing scroll position and focus.
- [ ] **Not yet re-checked: the `{@const}` laziness note from batch 11.** Batch 11 recorded that the
      transform pipeline's _wall-clock_ order is reversed by lazy deriveds, harmless until a plugin
      primes state in a cell transform and reads it in a row transform, and said to re-check "when
      the plugin hooks land". None of the seven landed so far does this. **`columnResize` and
      `filtering` are the two to check** when they land.

- [ ] **A bound snippet must be bound _once per key_, or the element it renders is replaced on
      every transform re-run.** This was a live defect in the first cut of `sortable`, found by the
      `columnResize` port and then reproduced directly: focus a sortable header button, click it,
      and `document.activeElement` falls back to `<body>`. `bindSnippet` returns a fresh function
      each call, a transform re-runs whenever the state it reads changes, and `{@render}` keys its
      branch on the snippet's **function identity** — so a new identity tears the branch down and
      rebuilds it. The markup is identical either way, which is exactly why every existing
      assertion stayed green while it was broken. Fixed by `createSlotBinder` /
      `createCellSlotBinder`: one bound snippet per key for the binder's lifetime, with the
      argument still live, so a change updates the child's props **in place**. Upstream never meets
      this — React reconciles `<ResizeHandle key={…}/>` by type-and-key. **The general lesson is
      bigger than this batch: any Svelte port of a React render-prop that returns a _new function_
      per render has this hazard, and no markup assertion will catch it.** Pinned by
      `table-plugin-smoke.svelte.test.ts`'s identity case, mutation-checked.
  - Its one documented limitation: the lookup map is a plain `Map`, because a transform runs inside
    a `{@const}` and writing reactive state there throws `state_unsafe_mutation`. So a swapped-in
    getter wakes the snippet only through a reactive source read _inside_ it — which every call
    site has, via the config getter.
- [ ] **The batch-11 `{@const}`-laziness note can be closed.** It said the pipeline's wall-clock
      order is reversed by lazy deriveds, harmless unless a plugin primes state in a cell transform
      and reads it in a row transform, and to re-check "when the plugin hooks land". Both named
      suspects were checked against their ported source: **`filtering` implements no body-level
      transform at all** and no transform of its writes state (its only mutable state is a
      popover's component-local `$state`, written by event handlers); **`columnResize` implements
      only `transformTableContext` and `transformHeaderCell`**, and all three of its drag-session
      fields are written and read exclusively from event handlers and the measure attachment —
      after the render flush, never during a transform. No first-party plugin has the shape the
      note warns about.
- [ ] **`rowExpansion` translates a context-menu label upstream hardcodes.** Upstream writes
      `'Collapse row'` / `'Expand row'` literally in `transformBodyCell` while translating the two
      aria labels that say the same words. The catalog already ships those keys with those exact
      defaults, so `en` output is byte-identical and every other locale stops leaking English.
      Taken as an upstream bug and documented rather than replicated, per the standing rule — but
      it is a **behaviour deviation in a non-`en` locale**, so it is the one to revisit first if
      strict parity is ever preferred. One-line revert at the call site.
- [ ] **Upstream does not publish `useTableRowExpansionState`'s config or result types**, so the
      hook's own parameter type is unnameable by a consumer — while `selection`, `sortable` and
      `columnSettings` all publish theirs. Verified against both the clone and the published
      `dist/Table/index.d.ts`, and replicated. `UseTableFilterStateResult` is the mirror case: on
      the plugin's own `index.ts` but not on `Table/index.ts`, so it never reaches upstream's
      package API either. Both read as oversights; both are preserved.
- [ ] **PowerSearch's _types_ are published ahead of the PowerSearch component, deliberately.**
      `UseTableFilteringConfig.searchConfig` is a required `PowerSearchConfig`, and a public prop
      whose type has no public name cannot be written down — the same argument that already
      published `TableFilterFieldRef`. The ~44 names ported are those reachable from a public
      signature or needed to build/read one; the names describing the _component's_ own API
      (`PowerSearchHandle`, `PowerSearchComponents`, `PowerSearchTokenProps`, …) are deliberately
      absent and arrive with it. **`astryx-surface` should be told this is intentional.**
      `EnumItem.icon`/`PowerSearchField.icon` became `Snippet` on the `SearchableItem.element`
      precedent rather than `IconName | Snippet`; nothing in this port renders either field yet, so
      that translation is **unverified until PowerSearch lands**.
- [ ] **`filtering`'s `transformColumns` cannot be absent in the `popover` variant.** Upstream sets
      the member to `undefined` there, which is only legal because it rebuilds the plugin object
      when `variant` changes — and batch 11's stable-reference contract forbids that here. The
      branch moved inside the transform, which returns its input unchanged. Observably identical;
      a test asserting `plugin.transformColumns === undefined` would not be.
- [ ] **`columnResize` is the one Table plugin upstream does not route through i18n** — its
      `Resize column …` label is a literal and there is no catalog key. Left as a literal; adding
      one would be drift. Worth contrasting with the `rowExpansion` case above, where the key
      already existed.
- [ ] **The idiom audit found the frozen-argument bug in _three more_ plugins, and proved my
      binder's stated invariant false.** `createSlotBinder`'s docstring claimed "every call site
      closes over the config getter, which covers it". Three of five did not: `sortable` passed the
      getter **uncalled**, and `column-resize` and `filtering` called it _above_ the getter and
      handed down only resolved values. Since a keyed bound snippet never rebuilds its branch, the
      slot's `{@const unwrapSlotArg(arg)}` derived is the only path new props can take — and a
      derived that reads nothing reactive never re-runs. Verified in Chromium, not inferred:
  - **`column-resize` was the worst, and not merely an ARIA problem.** The splitter froze at its
    mount width, so `aria-valuenow` went stale — and because the handle computes its Home/End delta
    from `currentWidth` while `buildDragState` reads `columnWidths` fresh, the two disagreed the
    moment a width was committed: after one ArrowRight, Home committed 210 instead of the 200
    minimum. `aria-valuemin`/`valuemax` and `neighborKey` went stale the same way, and a stale
    neighbour resizes the **wrong column**.
  - **`filtering` never showed a control that arrived late.** `operatorValue` derives from
    `config().searchConfig`, so a config populated after mount — the normal shape when enum options
    come from a server — left an inline column rendering the `aria-hidden` placeholder forever, and
    a `Selector` filter stuck with its stale option list.
  - **`sortable` froze the header label and `aria-label`**, while the icon, `aria-sort` and click
    behaviour kept working because `SortHeaderButton` calls `config()` itself. Partial masking is
    exactly what let this class through review twice.
  - **The fix reads `config()` inside each getter — and closes the config-driven half only.** A
    column that keeps its `key` but changes its `header` or `sortable.sortKey` re-runs the transform
    without waking the derived, because `column` arrives as a transform _argument_, not from a
    reactive source the getter can read. **Keying and liveness pull in opposite directions here**:
    the key is what preserves focus, and it is also what prevents a rebuild from delivering new
    props. Closing the residue needs either a key that encodes the argument (losing focus exactly
    when the content changes, which may be right) or a reactive handle on the resolved columns.
    Recorded rather than half-solved.
- [ ] **Three lower-severity idiom findings, none with a demonstrated break.** `sticky-columns`
      reads `resolved()` un-`untrack`ed inside its attachment _and_ mints a fresh `htmlProps` arrow
      per transform, so any config change tears the scroll listener down and re-observes — where
      upstream's `useCallback(…, [])` deliberately attaches once. `tree`'s bound cell tracks the row
      but not the column, so replacing the tree column's own `renderCell` while rows are unchanged
      leaves the old renderer wired. And under Svelte's **async mode** the binder's
      `getters.set()` — a side effect performed inside a `$derived` — can have an abandoned batch's
      getter win, while `{@const}` switches from `derived_safe_equal` to strict `===`, so any call
      site that ever returned a memoised object would silently stop propagating. Neither binder map
      is ever evicted, so a churning column set grows them for the component's lifetime.
- [ ] **What the idiom audit confirmed sound, and is worth not re-litigating**: `withProps` on both
      compile targets (server gets a plain object literal, so descriptors round-trip and `$$slots`
      survives; the client's `$.component` bails on an identical reference, which is what makes
      "bind the provider once" actually prevent the remount) — and **all six** plugins with a
      `transformTableContext` do bind once. Every plugin context stores a getter, and every scope
      component re-wraps with `Context.set(() => config())` rather than passing the prop through.
      `FilterDraftScope` overriding only the config context works because Svelte resolves a
      snippet's context at its _render_ site, reproducing upstream's nesting with one fewer
      component. And `useTableTreeState` exposing `hasExpandableRows` as a getter but `getRowMeta`
      as a stable function is load-bearing: it is what stops a row expansion invalidating
      `resolvedColumns`, which is the job upstream needs `columnsCacheRef` for.
- [ ] **The batch-close audits found five things, and the most useful one was in a _document_, not
      in code: upstream's `useTableSortable.doc.mjs` says `allowUnsortedState` defaults to
      `false`, while its own source is `cfg.allowUnsortedState ?? true` and its TSDoc says
      `@default true`.** The port follows the source (correct), but the docs pipeline reuses
      upstream prose verbatim — so our site was publishing a wrong default for a prop we
      implemented right. Fixed with a `DOC_CORRECTIONS` list in `docs/scripts/generate-content.mjs`:
      the first prose counterpart to the class oracle's `skip` list, and self-retiring in the same
      way — each entry names the upstream value it expects, and generation **throws** if upstream
      ever changes or fixes it (mutation-checked). The corrected field also carries a
      `correctedFromUpstream` reason so the page can explain itself.
- [ ] **`useTableTreeState` drops upstream's same-batch toggle composition.** Upstream advances
      `expandedIdsRef.current` _before_ the state write specifically so two `onToggleItem` calls in
      one handler compose — its own comment says so, which puts it outside the "React memo hygiene
      is deleted throughout" allowance. Ours re-reads the resolved `expandedIds`, which is
      equivalent for the uncontrolled branch and for any controlled consumer holding a `$state` set,
      and diverges only for one whose set is not immediately re-readable (a deferred or
      non-reactive store). Documented at the site; recorded here because every other translation of
      this class in the batch is.
- [ ] **`stickyColumns` uses the shared `ResizeObserver` where upstream builds a private one**, and
      that swap has a contract worth stating: `internal/shared-resize-observer.ts` keys a
      `Map<Element, ResizeCallback>`, so a **second** `observeResize(el, …)` silently replaces the
      first and `unobserveResize(el)` removes whichever is registered. Upstream deliberately uses
      the shared utility in `columnResize` and _not_ here. No first-party collision exists today —
      resize observes the `<table>`, sticky the scroll-wrapper `<div>` — but a future virtualization
      plugin attaching to that same wrapper is exactly the composition case upstream's `mergedRef`
      was written for.
- [ ] **`TableContextProvider` is now published, resolving an inconsistency the batch created.** It
      and `BaseTablePlugins` are the same thing — Svelte-only names with no upstream counterpart,
      each sitting on a _published_ signature — and the batch shipped one published and one not.
      todo.md's own note on that family says publishing some while withholding others "is the one
      option that is not defensible", so `TablePlugin.transformTableContext`'s return type is now
      nameable. Same argument that published `TableFilterFieldRef`.
- [ ] **`src/lib/index.ts` no longer re-exports `power-search/types.js` with `export type *`.** The
      wildcard was correct on the day — all 44 names verified reachable from `PowerSearchConfig` or
      `PowerSearchFilter`, all 44 on upstream's barrel — but it points at a file that will _grow_
      when PowerSearch lands, and `PowerSearchAuxData`/`PowerSearchItem` are module-public-and-
      unpublished on both sides. A wildcard would publish them with no diff to review. Enumerating
      the names is also what makes the file's "deliberately partial" claim auditable from the barrel.
- [ ] **Browser-verified on `vite dev`, and it found something a green build could not: two published
      hooks have no documentation page at all.** All twelve Table/hook routes were loaded in real
      Chromium (a prod build is not proof — hydration and snippet errors are dev-only). Result:
      **ten render live examples with zero console errors** — `useTableSortable` (4 sort buttons),
      `useTableSelection` (6 checkboxes), `useTableColumnResize` (4 `role="separator"` handles),
      `useTableGroupedRows` (9 rows), `useTableRowExpansion`, `useTableRowIndex`,
      `useTableStickyColumns`, `useTablePagination`, `useTableColumnSettings`, and `Table` itself.
      Two exceptions:
  - **`/components/useTableTreeData` and `/components/useTableTreeState` return 404.** The docs
    content pipeline reads `.doc.mjs` from `node_modules/@astryxdesign/core`, and the published
    0.1.7 ships **none for the tree hooks** — the same release lag that already blocks the tree
    oracle case. So the two hooks are exported, typed and tested, and a consumer looking them up in
    the docs site gets nothing. The prose _does_ exist in the clone
    (`reference/astryx-upstream/.../Table/useTableTreeData.doc.mjs`), so the options are to wait for
    a release or to make the generator fall back to the clone — a deliberate decision, since
    "content comes from `node_modules`, not the upstream clone" is a documented invariant of the
    pipeline.
  - **`/components/useTableFiltering` and `/components/useTableFilterState` render correctly** but
    show the "Live preview pending" placeholder instead of a live example, because both their blocks
    are the PowerSearch-blocked pair. That is the designed behaviour for an API-blocked block, and it
    was confirmed by diffing the page against a known-good one rather than assumed.
- [x] **FIXED — two distinct client-suite flakes, and between them they collected _four_ wrong
      diagnoses. Every wrong one was reached by reading; every right one by measuring.**
  - **Flake 1: the mouse pointer survives across test files.** `hover-card`'s "does not re-show after
    Escape dismiss and refocus" failed in full runs and passed in isolation. The pointer's position
    is page-global and is the one piece of state `isolate: true` does not reset — it lives in the
    browser, not the iframe. `layer.svelte.test.ts` left the cursor where its last interaction put
    it; the `hover-card` fixture then rendered _underneath_ it, so dismissing the card uncovered the
    trigger, Chromium fired a boundary `mouseenter`, and it reopened. **The component was behaving
    correctly.** Upstream never meets this: jsdom does no hit-testing and fires no boundary events.
    Fixed by parking the pointer at a 4px top-right element in `setup-stylex.ts`'s `beforeAll` —
    `beforeAll` because cross-_file_ inheritance is the isolation violation, and the corner because
    `unhover()` parks on `document.body`, whose centre is often _on_ the fixture.
    - _Retired diagnosis 1, "prototype hygiene"_ — both files patch `showPopover`/`hidePopover` and
      one restores by assignment after a `delete`, losing non-enumerability. All true, all
      irrelevant: the failing assertion was behavioural and the popover API worked throughout.
    - _Retired diagnosis 2, "the one-shot `isEscapeDismissing` flag"_ — plausible and false: the
      probe records **exactly one** `focusin` after Escape in both passing and failing runs. The
      re-show arrives later and is a `mouseenter`. Nothing about the flag needed hardening.
  - **Flake 2 (the "iframe-drop"): four tests click a real `<a href>`, and the navigation is a
    race.** The test page's identity lives in its **query string**
    (`localhost:PORT/?sessionId=…&iframeId=…`); a click on `<a href="/">` resolves to the same path
    with the **query gone**, so the runner can no longer find the frame and the file dies. vitest's
    message says exactly this — _"Did you change the location or submitted a form?"_ — and for three
    batches nobody took it literally. The sites: `breadcrumbs`'s `handles onClick on link items` and
    three `side-nav` cases. **Because navigation is asynchronous it is a race**, which is why the
    victim moved between runs, why runs aborted at different points, and why every file passed in
    isolation — _every property that pointed at "load" is explained by the race, and none of them
    required load._ That misreading was the third wrong diagnosis.
    - **Fixed in the harness, not at the four call sites**: a bubble-phase `click` listener on
      `window` in `setup-stylex.ts` that `preventDefault()`s a click whose anchor would navigate the
      frame. Two of the four sites have **nowhere to put a `preventDefault`** — they are upstream's
      `<SideNavItem href="/" />` with no handler at all — so fixing at the site would mean inventing
      an `onclick` upstream does not pass. Fragment, `target`ed and `download` links are left alone,
      and the listener runs _after_ every component handler and returns early if already prevented,
      so a component that should call `preventDefault` can still be tested for exactly that.
    - **Before: 7 full client runs, 7 with an infra error, best 124 of 125 files. After: 3 runs, 0
      errors, 125 of 125** — the first time the client project ever reported every file.
  - **Method notes worth keeping, both dearly bought:**
    - **Every probe perturbed the outcome.** Adding listeners flipped the case from ~50% failing to
      100% passing, and a later probe flipped it to 100% failing. Any conclusion from a single
      instrumented run would have been wrong; what worked was running the pair repeatedly under each
      probe and comparing **traces, not verdicts**.
    - **A small-scale mutation check was inconclusive, and that is the point.** Disabling the
      anchor guard and re-running only the four link-clicking files gave 4 passed / 198 tests — the
      race does not fire at that size. That is exactly the weakness that hid the bug for three
      batches: it is invisible until enough files run for the navigation to win.
    - **The setup file is evaluated _in the browser_, where `process` is not defined at all.** An
      `if (process.env.FOO)` feature switch throws a `ReferenceError` on the identifier before the
      property access, failing every file's `beforeAll` and reporting as _every test skipped in both
      arms_ — a broken experiment that looks like a catastrophic regression. Use `import.meta.env.VITE_*`.
- [ ] **Still open: `pnpm -r test` is a heavier configuration than any run that proved the fix, and
      it still fails intermittently.** All ten runs in the before/after tables above were
      `--project=client`; `pnpm -r test` runs the client and server projects **together**, and it
      has died with a _different_ signature — `Browser connection was closed while running tests` /
      `[birpc] rpc is closed` — on `use-table-column-settings`, `table-grouped-rows` and `xstyle`.
      That is "the page went away", not "the frame's URL changed". Seen again at batch 15's close:
      one `-r test` run lost `input-group` and `table-pagination-perf` to a failed
      `setup-stylex.ts` import and `layer-attribute-repair` to a closed connection, aborting at 103
      of 153 files; all three passed in isolation (28/28) and the next full run was clean
      (153 files, 3,737 passed). **Do not read the 3/3 client result as covering this.** There is no
      measured rate either way. `vite.config.ts`'s own comment is the standing hypothesis — node
      workers spinning up in parallel compete for the same cores as the single Chromium — and it
      says to measure before changing anything.
- [ ] **Do not read the full-run summary off the JSON reporter.** Its aggregate under the browser
      project undercounts badly — a run reporting `146 files / 0 non-passed / 2225 tests` was, per
      project, `21/511` (server, clean) and `1 failed | 123 passed (125) / 3067 passed` (client).
      The per-project default reporter is the honest one; the JSON aggregate hid a real failure
      behind a plausible-looking zero. Both numbers in this file's earlier batch-13 entries came
      from the JSON reporter and were therefore optimistic.
- [ ] **The oracle wired clean on the first pass — 9 modules, 0 mismatches**, taking the run to
      **1,298 style keys and 500 inline call sites** (+17 / +25). Because a clean first pass is
      also what a _mis-wired_ oracle looks like, the wiring was mutation-checked rather than
      trusted: dropping a key from `column-resize`'s combination produces both a merged-string
      mismatch and an unclaimed leftover, and every literal `className` in all nine upstream `dist/`
      files is claimed by exactly one entry. Two reconnaissance guesses were corrected by the run:
      `row-expansion` is **both** modes (`indentedCell` rides the dynamic `indent(px)` call and
      `clickableRow` seeds an `xstyle`, while the chevron folded), and `filtering`'s `triggerButton`
      **does** want inline entries — two, because upstream compiles a lookup table keyed by
      `!!hasValue << 0`. No `rename` was needed anywhere: every group name is upstream's verbatim,
      which is the property that makes this port's styles mechanically checkable at all.
  - **`tree` needed a new kind of skip.** A `CASES` entry reads `upstreamFile` before any `skip` is
    consulted, so a missing upstream file dies on an ENOENT that reads like a typo. It is now a
    sibling `ABSENT_UPSTREAM` list, processed after the main loop, which counts the five
    class-bearing keys it excuses into the run's `skipped` total (so the number stays honest) and
    **fails the run the moment `dist/Table/plugins/tree/` appears**. Verified: the guard pushes to
    `unusedSkips`, and the script exits 1 on any non-empty `unusedSkips`.
  - Worth keeping: `background: 'transparent' | 'none'` and `border: 'none'` emit **no class** on
    either side — StyleX drops them — which is why `sortable.button`, `grouped-rows.chevron` and
    `filtering.triggerButton` land on fewer classes than their property counts suggest. Same
    behaviour already noted for `useKeyboardHint`'s `hint` and `ToastViewport`'s `viewport`; it is
    not a dropped style.
- [ ] **`TableResizableTable` needs an explicit `useTableColumnResize<User>` where upstream needs
      nothing**, and the reason generalises. `UseTableColumnResizeConfig` never mentions the row
      type, so `T` has no inference site and falls back to its constraint — and
      `TablePlugin<Record<string, unknown>>` does not satisfy `Table`'s `Record<string, TablePlugin<User>>`,
      because `TableColumn<T>` is **contravariant** in `T` through `renderCell?: Snippet<[T]>`. The
      same contravariance is why that block's `columns` array must stay **unannotated**: it feeds
      both `Table` (wanting `TableColumn<User>[]`) and the resize config (wanting
      `TableColumn<Record<string, unknown>>[]`), and either annotation breaks the other site while
      the inferred literal — carrying no `renderCell` — satisfies both. This is the same invariance
      that `src/tests/render-table.ts` already documents for `render()`; it now has a consumer-facing
      face, which is worth a second look before release.
- [ ] **todo.md's batch-6 note attributes some type adjustments to `exactOptionalPropertyTypes`,
      and that flag is not set anywhere in the repo** — not in any checked-in `tsconfig.json` nor in
      the generated `.svelte-kit` ones. Pre-existing to this batch and harmless, but the note should
      either be corrected or the flag turned on deliberately, because docs blocks are currently
      being written against a stricter rule than the compiler enforces.
- [ ] **`tree`'s wrapped renderer falls back to `String(item[col.key] ?? '')`**, which diverges from
      `defaultCellRenderer` for `Date` values (ISO everywhere else, locale string in the tree
      column). Upstream's, replicated verbatim and commented at the site rather than silently
      "fixed" — a candidate for the same treatment as the `rowExpansion` label if it ever bites.

## Batch 12 — the date/time family

- [ ] **`Calendar`'s `handleRef` is an instance export, not a prop.** Upstream declares
      `handleRef?: React.Ref<CalendarHandle>` and fills it with `useImperativeHandle`; here
      `navigateTo` is an instance export reached through `bind:this`, and `CalendarHandle` still
      names exactly what upstream's does. The `Tokenizer`/`SideNav` precedent. `DateInput` and
      `DateTimeInput` are the two internal consumers, and both use `bind:this`
- [ ] **`useCalendarDays`'s day names are hardcoded English, and its JSDoc says otherwise.** The
      return field is documented "Localized day names" but the implementation is a literal
      `['Su','Mo','Tu','We','Th','Fr','Sa']` rotated by `weekStartsOn`, with no `Intl` anywhere in
      the hook. Upstream's bug, transcribed rather than fixed — the month header and every day
      button's `aria-label` _are_ `Intl`-formatted, so only the weekday rail is affected
- [ ] **`Calendar`'s range background applies two styles it does not need.** The `stylex.props` list
      passes `rangeInsetLeft` **twice** (once for a range start, again gated on `roundLeft`) and
      gives a range _start_ `rangeInsetRight` when `roundRight`. Both read as copy-paste slips.
      Transcribed verbatim: StyleX merges by property hash, so a repeated style is idempotent and
      the emitted classes are identical either way — deduplicating would diverge from the source
      for no observable gain
- [ ] **`calendarStyles.srOnly` is declared and never applied**, upstream and here. Ported for
      object-mode parity rather than pruned, the standing treatment for declared-and-unused keys
- [ ] **`Calendar` resolves "today" against the render-time clock and locale**, so SSR is a genuine
      hydration hazard: `plainDateToday()` uses the server's timezone, and `plainDateFormat`'s
      `new Intl.DateTimeFormat(undefined, …)` uses the server's default locale, which drives
      `aria-current="date"`, the today styling, the seeded roving tab stop, the month header and
      every day `aria-label`. Inherited from upstream, which computes both the same way at the same
      time. Deliberately **not** deferred to an `$effect` or gated on `browser` — that would change
      the first paint relative to upstream and move the seeded tab stop
- [ ] **`DateRangeInput` puts `aria-required`/`aria-invalid` on a `role="button"` trigger**, which
      is not in that role's supported set (Svelte's `a11y_role_supports_aria_props_implicit` says
      so, and the component carries a targeted ignore with this reason). Upstream's markup: the
      trigger stands in for a form control and carries the field's required/error state. Replicated
      rather than corrected — a component's own behaviour is upstream's to change, unlike an a11y
      defect on a page this repo ships (the `/components` gallery dialog precedent)
- [ ] **`DateRangeInput` and `DateTimeInput` never read the `InputGroup` context**, where
      `DateInput`, `TimeInput` and `NumberInput` all do. So neither composes `groupStyles.inGroup`,
      neither calls `getInputARIA` (each assembles `aria-describedby` by hand), and neither can be
      a group member. Upstream's asymmetry, replicated
- [ ] **`DateRangeInput`'s `aria-label` and its rendered value can disagree mid-flight.**
      `triggerAriaLabel` branches on the committed `value` while the visible text derives from the
      optimistic one, so during a `changeAction` the trigger shows a formatted range while
      announcing the placeholder. Upstream's own split, replicated
- [x] **The pending-focus pass is hoisted to `Calendar`, and had to be** — found by the batch-close
      idiom audit and fixed. Upstream passes `pendingFocus` plus an
      `onPendingFocusHandled` callback to _every_ `MonthGrid`; each pane's effect searches its own
      grid, focuses the target or its own first enabled day, and clears the flag. React effects run
      against **committed** props, so the first pane's clear does not stop the others — every pane
      runs and the last one wins. A Svelte child reads the parent's `$state` **live**, so the first
      pane's clear was immediately visible to the second and only one pane ever ran. With
      `numberOfMonths={2}` — `DateRangeInput`'s default — paging forward from the right-hand pane put
      the target seven days past the left pane's window, so the left pane found nothing, focused its
      own first day and cleared the flag before the right pane (which _did_ hold the target) got a
      turn. The pass now lives in `calendar.svelte` and walks the panes in DOM order applying each
      pane's rule in turn, which reproduces upstream's sequence including last-writer-wins; the
      intermediate `.focus()` calls are unobservable because no paint happens between them. **Worth
      generalising: any React `useEffect` fan-out where siblings read a parent flag and one of them
      clears it does not translate directly** — the commit snapshot is doing load-bearing work
- [ ] **`Calendar`'s `navigateMonth` tests `onFocusDateChange` alone, not `isControlledFocus`.**
      Focus is controlled only when `focusDate` _and_ `onFocusDateChange` are both supplied, but
      `navigateMonth` calls the callback whenever it exists — so a caller passing only
      `onFocusDateChange` is notified of a month change that never happens. Upstream's own tests pin
      this, so it is replicated

## Batch 11 — Markdown and the Table core

- [ ] **The ten Table plugin hooks are deferred to batch 13** — `useTableSortable`, `useTableSelection`,
      `useTablePagination`, `useTableColumnSettings`, `useTableColumnResize`, `useTableStickyColumns`,
      `useTableGroupedRows`, `useTableRowIndex`, `useTableRowExpansion`, `useTableTreeData`/
      `useTableTreeState` and `useTableFiltering`, plus the `paginateData`/`toSearchFilters` helpers
      and their config/state types. Upstream's `Table/index.ts` publishes all of them, so **this is
      the one ported component dir whose published surface is deliberately partial**. The pipeline
      they plug into is complete, and nothing else references them — which is why 24 stories and 122
      test cases port with none deferred. They are what the eight remaining pending example blocks
      wait on. `TableFilterFieldRef` lives in `table-types.ts` meanwhile, because `TableColumn.filter`
      names it; it relocates to `plugins/filtering/` when they land, with no consumer-visible change
- [ ] **`Markdown.children` is a `string` prop, so it cannot be written as component content.**
      Upstream types it `children: string` — the markdown _source_. Svelte turns anything between the
      tags into a snippet, whose text a parser cannot read, so every call site is
      `<Markdown children={md} />`. Faithful to upstream's prop name and type, and the only place in
      this port where `children` is not a snippet — but it reads oddly enough to be worth a note
- [ ] **`MarkdownComponents.inlineCode` receives `children` as a string prop**, for the same reason
      and matching upstream's `ComponentType<{children: string}>`. Every other override in that map
      takes a `Snippet`, so the map is internally inconsistent — as upstream's is
- [ ] **`renderInline`'s `image` case does not advance the streaming cursor, but
      `countInlineTextLength` counts `alt.length`.** The two disagree upstream and the disagreement is
      replicated, because the renderer is what the cursor has to stay in step with. Effect is confined
      to fade-span boundaries in a streamed document containing an inline image
- [ ] **`Markdown/utils`, `Table/utils` and `Calendar/utils` are not shipped** — upstream's three
      server-safe unit subpaths, re-exporting the pure parser, the column helpers and the calendar
      date aliases. Covered by the standing per-component-subpath debt below; noted here because all
      three were _designed_ as separate entry points. Only `Markdown/utils` strands anything:
      `trimStreamingArtifacts` is reachable **only** through it upstream, so it is on no barrel here
      either. `Calendar/utils` (added by batch 12) strands nothing — every name it carries reaches
      our root or `./utils`, and its `parseISO`/`dateToISO` are aliases for `plainDateFromISO`/
      `plainDateToISO`, both published under those names
- [ ] **`BaseTable` is not published**, matching upstream's barrel, which exports `Table` and the
      sub-components but reaches `BaseTable` only through the `BaseTableProps` type that `TableProps`
      extends. A consumer wanting an unstyled `<table>` has no path to one on either side
- [ ] **Open question from the idiom audit: does `$effect.pre` run before or after the hydration
      pass?** `use-media-query.svelte.ts`'s own docstring says _after_ — that is the claim the whole
      SSR story rests on, and Phase 5's mobile jump menu was built and browser-verified on it. The
      batch-11 idiom audit argues the opposite from Svelte's effect-ordering source: render effects
      created in the script run before the template's, so a pre-effect that flips
      `prefers-reduced-motion` would make the client hydrate different markup than the server sent.
      The concrete case it names is an SSR'd `<Markdown isStreaming>` under reduced motion, where the
      server emits an empty `role="document"` and a reduced-motion client would snap to the full text.
      **Checked, not settled:** the demo route was loaded in real Chromium with
      `reducedMotion: 'reduce'` and `'no-preference'` and produced **zero** hydration messages at
      either setting (and visibly more text under `reduce`, so the branch does run) — but the demo's
      streams start at zero characters, so both sides render empty and the check does not exercise
      the mismatch. Resolving it needs an SSR fixture that streams a non-empty document. Pre-existing
      to `useMediaQuery` rather than introduced here, and worth settling before the next SSR-sensitive
      component.

      **SETTLED at 17c's idiom audit, from the runtime rather than a fixture: `$effect.pre` runs
      *before* the hydration pass, so the docstring's claim is false and the batch-11 audit was
      right.** The mechanism is an asymmetry in how the two rune forms compile. A top-level
      `$effect` becomes `$.user_effect`, which *defers* into `component_context.e` and is only
      created at `$.pop()` — after the template. A top-level `$effect.pre` becomes
      `$.user_pre_effect`, i.e. `create_effect(RENDER_EFFECT | USER_EFFECT, fn)`, and anything
      without the `EFFECT` flag is executed **immediately** at creation, with **no `hydrating`
      guard**. So during hydration the order is: push → instance script (the pre-effect fires,
      `window.matchMedia` is read, `matches` goes live) → template claims the server's nodes. The
      first hydrated markup already carries the *client* value.

      For `AppShell` with `defaultIsMobile` unset on a narrow viewport, `isBelowBreakpoint` is
      `true` on that first pass while the server emitted the desktop shell, so
      `TopNavRenderContext` hands out `'mobile-bar'`/`'drawer'` and the `{#if}` branches disagree
      with the claimed DOM. **The ordering half is definitive; what Svelte's `{#if}` hydration then
      does — a dev `hydration_mismatch` or a silent branch re-create — is still unverified**, which
      is why this stays open rather than closing.

      **The fix is a one-word change with no visual cost**: make it a plain `$effect`. That
      reproduces the three-argument `useSyncExternalStore` exactly — `serverDefault` for SSR *and*
      hydration, live afterwards — and a post-effect still flushes before paint, so the
      "no flash on a client-only mount" argument for `.pre` never required `.pre`. Left for its own
      slice because it changes `AppShell`'s SSR story and wants the fixture the paragraph above
      describes. **Correct the docstring at the same time**; it is a third instance of _a header
      comment is an assertion and rots like one_

- [ ] **The plugin transform pipeline's wall-clock order is reversed by `{@const}` laziness.**
      Upstream runs columns → table → headerCell → headerRow → bodyCell → bodyRow → scrollWrapper →
      context; ours compiles each stage to a lazy derived, so they _evaluate_ in roughly the reverse
      order. **Data flow is unaffected** — each stage still receives its predecessor's output, which
      is what the pipeline contract specifies — but a plugin that primes internal state in a cell
      transform and reads it in a row transform would read the seed. No consumer exists until the
      plugin hooks land, which is exactly when to re-check it
- [ ] **`transformTableContext` returning a component can remount the whole table.** A dynamic
      component whose _reference_ changes tears down and rebuilds its subtree, and `plugins` gets a
      new array identity whenever any plugin object changes — so a plugin that mints its provider
      inside `transformTableContext()` rather than hoisting it would lose scroll position, focus and
      child state on every sort or selection change. Upstream's element-wrapping form cannot do this.
      A contract note for batch 13: **a plugin must return a stable component reference**
- [ ] **`Markdown` is a closed-prop-list root upstream** and belongs with the six above — it declares
      `BaseProps<HTMLElement>` and then destructures eighteen named props with no rest spread, so
      `id`/`aria-*`/handlers its type promises never reach the DOM. We forward rest, as we do for
      every other root, and spread it **before** `role="document"` so the component's own semantics
      still win — the ordering `List` documents and the one the `Dialog` role-clobber fix
      established. Found by the batch-close parity audit, which is the argument for running it
- [ ] **`TableContext` is published and `useTableContext` is not** — upstream's split exactly, but
      an earlier cut of this batch had it backwards, on the theory that a Svelte context surfaces
      through its _reader_. That theory is wrong on the facts: `runed`'s `Context` **is** the value
      counterpart of a React context object, this barrel already publishes ten of them
      (`SizeContext`, `RadioListContext`, `ThemeContext`, …), and upstream has a `useTableContext` of
      its own in `useTableCellStyles.ts` that it deliberately keeps off `Table/index.ts`. Fixed by
      the batch-close surface sweep. Worth remembering because the same reasoning would have
      mis-shaped `DropdownMenuContext` and `FormLayoutContext`, which are two of the seven names
      still recorded as missing
- [ ] **`./base.css` is a subpath we ship with no upstream counterpart.** Upstream ships
      `./reset.css`, `./astryx.css` and `./tailwind-theme.css`; we ship this instead. It is a
      genuine StyleX-port necessity — `@layer` ordering and `color-scheme`, neither of which StyleX
      can emit — and Phase 0 already records _why the reset is folded into it_, but nowhere until
      now recorded that the entry point itself is ours alone.
      **Updated 2026-08-11:** `./astryx.css` is no longer missing — upstream's `build-css.mjs` is
      ported and the stylesheet ships. `./reset.css` stays folded in; `./tailwind-theme.css` is
      still absent (9.2 kB, ~120 `@theme inline` mappings)
- [x] **No package declared `main`.** Upstream's every package does; ours had none, so any resolver
      that does not read `exports` could not resolve core or a theme at all. `exports` masks it from
      Node and every modern bundler, which is why nothing caught it — publint included. Added to
      core and all eight themes 2026-08-11. The CLI correctly has none, matching upstream
- [ ] **`TableHeaderCellProps` publishes `scope` and `title` only.** A `<th>` accepts
      `colspan`/`rowspan`/`abbr` too and Svelte's `HTMLThAttributes` types them, but upstream's
      `TableHeaderCellProps` declares none of the three, so neither do we — a plugin sets them
      through the `htmlProps` bag instead, which is the route upstream's
      `TableHeaderCellComponentProps` gives them. `TableCellProps` Picks four members for the
      opposite reason: upstream re-declares exactly those four by hand

## Batch 1 — slot translation and seams

- [x] **`useImperativeAlertDialog` is ported** — **batch 15**, together with `useImperativeDialog`, which is what "retire both deferrals together" asked for. Each returns `element: ReactNode` upstream, so each splits into a controller plus a companion component (`<ImperativeAlertDialogLayer>` / `<ImperativeDialogLayer>`), the `useLightbox`/`<LightboxLayer>` shape. `AlertDialog/index.ts`'s two names (`useImperativeAlertDialog`, `ImperativeAlertDialogReturn`) and `Dialog/index.ts`'s two are all on the barrel now. `useImperativeAlertDialog` still has no upstream test file, so none arrives with it; `useImperativeDialog.test.tsx` is restored at 5/5
- [ ] **`MoreMenu` has no `ref` counterpart.** Upstream threads `ref` into the trigger button's props; `MoreMenuProps` is a closed `Pick<BaseProps, 'xstyle' | 'class' | 'style'>` on both sides, so there is no rest spread for an attachment to travel through. Its `supports forwardRef` case is the one dropped from that suite — the same situation `Token`'s three ref cases are in
- [ ] **`ListItemProps` is typed `BaseProps<HTMLLIElement>` (upstream's type) but widens at the `Item` seam.** `Item`'s props are `BaseProps<HTMLElement>` and event handlers are contravariant in the element type, so the two are incompatible even though the DOM agrees — the rest props are cast once, at the single point they cross, rather than by publishing a weaker type. React's JSX prop bivariance is what lets upstream avoid the cast
- [ ] `List`'s `header`, `ListItem`'s `label`/`description` and `Banner`'s `title`/`description` are `string | Snippet`; `Banner`'s `icon`/`endContent`/`children` and `ListItem`'s `startContent`/`endContent` are plain `Snippet`. The leaf-slot translation settled for `Item`, applied unchanged
- [ ] **`Banner`'s `defaultIsExpanded` is read once at init** (`svelte-ignore state_referenced_locally`), matching `useState(defaultIsExpanded)`: a later prop change does not reopen a banner the user collapsed

## Batch 2 — slot translation and seams

- [ ] **`Carousel` takes `items: T[]` + `item: Snippet<[T, number]>`, not compositional `children`.** Upstream wraps every child in its own snap target with `Children.map`; a Svelte snippet is one opaque unit that cannot be mapped over, so the row is data-driven — the same forced translation `OverflowList` settled and the precedent `TabList` will reuse. Rendered DOM and classes are identical
- [ ] **`ContextMenu`'s three selectable re-exports are absent.** Upstream's `index.ts` re-exports `DropdownMenuCheckboxItem`/`RadioGroup`/`RadioItem` under ContextMenu names; the trio itself is deferred (the stale-dist slice), so the aliases have nothing to point at. `ContextMenuItem`/`ContextMenuItemProps` _are_ exported, since `DropdownMenuItem` is ported. Its suite drops the 2-case `selectable items` describe for the same reason
- [ ] **`ContextMenu` mints two ids where upstream mints one.** `$props.id()` may be called once per component and `<Layer>` already carries the layer's id, so the inner `role="menu"` div derives a second (`-menu`) from the same uid. Upstream's `useLayer` generates its own id internally and `useId` supplies the menu's
- [ ] **`Toolbar` has no `ref` counterpart on the `Section` root.** Upstream forwards `ref` to `Section`; the port's rest props reach the inner `role="toolbar"` div (where upstream's `{...props}` also go), so the attachment counterpart in its suite lands there instead. `Section` exposes no element seam, the same situation `SelectableCard`/`ClickableCard` document
- [ ] **`Toolbar`'s `onFocus`/`onBlur` props are `onfocusin`/`onfocusout` here.** Upstream's React `onFocus`/`onBlur` are the _bubbling_ synthetic events, which native `focus`/`blur` are not — the same correction `useListFocus` and `useKeyboardHint` already record for their handlers

## Batch 3 — slot translation, ids, and a source/dist lag

- [ ] **`NavHeadingMenu` and `TreeList` forward rest props where upstream drops them** — both destructure a closed list with no rest spread, the same closed-prop-root contradiction `Timestamp`/`FieldLabel`/`List`/`DropdownMenu` document. We forward, as every other component does. `TabList` and `Tab` _do_ spread upstream, so nothing changes there
- [ ] **`NavHeadingMenu` captures the menu element twice.** Upstream reads `listRef.current` for the typeahead's item list; `useListFocus` keeps its container private (the attachment is the whole seam), so the component adds its own `bind:this` rather than widening the hook's return. Same seam `DropdownMenu` already opens
- [ ] **`NavMenuItem` is a second barrel export, not a re-assignment.** Upstream's `export const NavMenuItem = NavHeadingMenuItem` makes the two the same value; exporting the same component module twice preserves that identity, which its backward-compat test asserts. `NavMenuItemProps` is likewise an alias of `NavHeadingMenuItemProps`
- [ ] **`TreeListItem` mints two ids from one uid** (`labelId` and `${labelId}-description`) where upstream calls `useId` twice — `$props.id()` may be called once per component. The same shape `ContextMenu` records. `TreeListItem`/`TreeListBranches` and their prop types stay module-private on both sides
- [ ] **`TreeList`'s recursion is a self-referencing `{#snippet}`.** Upstream's `renderItems(items, nestedLevel, ancestorsIsLast)` returns `ReactNode` and passes it down as `renderedChildren`; the Svelte counterpart is a parameterised snippet that renders a per-item `childSubtree` snippet calling itself. `renderedChildren` is therefore `Snippet`, not `ReactNode`. `TreeListItemData.label` is `string | Snippet` and `startContent`/`endContent` are plain `Snippet`s — the settled leaf-slot translation
- [ ] **`TabList`'s `orientation` is not `aria-orientation`** — replicated deliberately: the attribute is invalid on the navigation role, upstream reads and drops a caller-supplied one, and two of its cases pin that. `EDGE_COMP_ATTR` is destructured under its literal name (`data-astryx-edge-comp`) because a `$props()` pattern may not carry a computed key
- [ ] **`TabMenu` mints a second id for the `role="menu"` div** so `aria-controls` targets the menu itself, as upstream's `useId` does — the one popover in this port that does _not_ follow the `aria-controls`-at-`layer.id` convention `DropdownMenu` documents, because upstream's own test asserts `document.getElementById(aria-controls)` has `role="menu"`. `TabMenuOption.icon` is `IconName | Snippet` (the Svelte icon-slot shape), and `Tab`'s `icon`/`selectedIcon`/`endContent` are plain `Snippet`s
- [ ] **`styles.itemCheckmark` in `tab-menu.stylex.ts` is dead upstream** — declared and never applied (the selected tick is an `<Icon icon="check">`). Ported for parity, and therefore the one key in the batch with no upstream counterpart to diff against in either oracle mode; the reverse of a skip, as `Collapsible`'s `triggerDisabled` is
- [ ] **Source/dist lag (followed from source, per the Icon px→rem precedent): the tab divider gap.** Upstream's source reserves a gap under the tabs (`paddingBlockEnd`) and publishes `--_tab-indicator-bottom` so the selected indicator drops onto the rail; published 0.1.7 has neither, and its indicator `bottom` is still the literal `-1px`. Recorded as **four self-retiring skips** — `tab-list` `styles.divider` plus three `inlineSkip` entries on the `tab`/`tab-menu` indicator call sites — which retire together when a release ships the feature
- [ ] **The class oracle gained `inlineSkip`.** `skip` only reaches object-mode groups and keys; an inline call site has no name to hang one on, and this is the first lag that lands on one. Each entry names its `inline` keys, the exact upstream class string it excuses, and why — and it is self-retiring twice over: the run fails if our combination _starts_ matching, and it fails if the excused string disappears from `dist/`. Verified by mutation (a bogus excused string fails the run)

## Batch 4 — divergences, and a shared-primitive fragility Slider exposed

- [ ] **`CheckboxInput.syncNativeState` restores `.indeterminate` as well as `.checked`** — an upstream bug documented rather than replicated. React's controlled-input restore only knows about `checked` (there is no `indeterminate` prop, which is precisely why upstream needs its `indeterminateRef`), so upstream leaves a _blocked_ click on a mixed checkbox reporting **unchecked** to assistive tech while the painted box still shows the dash. Upstream's own forms-16 comment calls the native property the authoritative mixed-state signal, so the desync contradicts its stated intent. The attachment still reproduces the ref's `[isIndeterminate]` keying exactly; only the hand re-assert diverges
- [x] **The value-less-`CheckboxListItem` throw now fires per render, as upstream's does.** It was an init-time statement, so a `CheckboxList` that started standalone and _later_ gained a `value` array would render its value-less children as dead interactive rows instead of throwing. Moved into the `resolvedChecked` `$derived`, which the template reads on every render (and on the server, where a `$derived` is evaluated on first read) — that is what makes the timing match. Mutation-checked: removing the guard fails `throws when item has no value prop inside collection-mode CheckboxList`
- [x] **`useLayer.attachTrigger` repairs its own `anchor-name`.** It lives in the trigger's _inline style_, and the trigger belongs to a caller's template; Svelte applies a changed `style` **attribute** by assigning `cssText`, replacing the whole block and taking the anchor name with it — after which `position-anchor` names nothing, `position-area` computes to `none` and the popover pins to the viewport corner, permanently, since nothing re-runs the attachment. React never hits it (style _objects_, written per-property) and upstream's ref re-runs after every commit anyway, which doubles as a repair pass. Now a `MutationObserver` on `style`, with a membership check that stops it looping on its own write. `Slider`'s thumb also uses `style:` directives (per-property `setProperty`), which sidesteps the rewrite entirely rather than relying on the repair
- [x] **The `aria-describedby` merge is one shared, self-repairing internal.** `Tooltip` and `HoverCard` both describe a trigger they _found_ rather than rendered, and both had a one-shot write: any caller rewriting the attribute dropped the appended layer id, silently, for good (`Slider` recomposes its thumb's from `description`/`status`). Upstream re-merges after every commit for free — its layout effect is keyed on a ref whose identity churns every render because `useLayer` returns a bare object literal. Both now go through `internal/described-by.ts`, which observes the one attribute and re-appends; upstream inlines the same body in two layout effects, so one internal is the honest shape, as with `first-element-child.svelte.ts`
- [ ] **`Slider`'s `onChange` parameter is not contextually typed at call sites.** `SliderProps` is a discriminated union on `value`, and TS will not resolve which arm applies when checking a Svelte props object, so `onChange={(v) => …}` infers `v` as `any` under `noImplicitAny` and needs an annotation (`(v: number)` / `(v: [number, number])`). Upstream's TSX discriminates fine. The demo route annotates; a consumer must too. Fixable only by making the component generic, which would invent a type shape upstream does not have
- [ ] **`Slider`'s hidden inputs carry `value` as a property with the attribute stripped** (Svelte's `remove_input_defaults`). `FormData` reads the property, so submission is correct and all three form-participation cases pass — but a native `<form>` reset would clear them where React's would restore the submitted value

## Batch 5 — divergences, and a spread hazard NumberInput exposed

- [x] **An element carrying a spread loses Svelte's compare-against-the-DOM guard on `value` — and at 0.4.1 that stopped being observable.** The mechanism is unchanged and still verified in Svelte 5.56.7's source: `set_value` carries React's exact controlled-input condition (`element.value === value` → return), while _any_ spread routes every attribute through `set_attributes`, whose guard compares against the previously **rendered** string and then assigns `element.value` unconditionally. `NumberInput`'s `<input>` must carry `{...rest}` (test-pinned). Under `type="number"` this was a live bug: a field in `badInput` (`1e`, `2-`, …) reports `value === ''` while still showing the raw text, so `pendingInput` correctly became `''`, the stale compare fired, and the editor was wiped — typing `1e5` ended as `5`. #4896 made the control a text-backed spinbutton, and **a text field has no bad-input state**, so the symptom is gone. **The obvious replacement symptom does not exist either**, which is the part worth recording: caret destruction was the intuitive guess (a redundant write collapsing the selection to the end), and it is wrong — the HTML `value` setter moves the text entry cursor only *"if the element's value is different from oldValue"* (setter step 5), and Chromium implements it, so a same-string assignment leaves the caret alone. That was measured, not reasoned: `afterEdit {value:"152", sel:2}` → `afterSameAssign {value:"152", sel:2}`. **`src/tests/number-input-spread-value.svelte.test.ts` is therefore retired rather than restated** — it could no longer mutation-check its own fix, which is exactly the bar `CLAUDE.md` sets for beyond-upstream coverage, and a test whose stated rationale is false is worse than no test. The attachment **stays**: it is the faithful translation of `updateInput`, it costs one string comparison per keystroke, it is what makes the server-only `value` spread coherent, and it must stay reactive (not `untrack`ed) because `displayValue` now flips formatted↔raw on focus. What still pins anything is `src/tests/batch-5-server-markup.test.ts`'s two SSR cases, which are now the only pin on that spread. **Standing lesson: when a fix's symptom disappears, re-derive the replacement symptom empirically before writing it down** — a plausible mechanism stated confidently in a test header is how a suite starts lying
- [x] **Svelte preserves whitespace inside `<pre>`; JSX does not.** `CodeBlock`'s `<pre>` children are top-level snippets rendered with no literal whitespace between them, because Svelte switches to preserve-whitespace mode on entering a `<pre>` and keeps it for the whole _lexical_ subtree. Written the ordinary indented way, the header rendered three lines tall with its label indented ~48 characters (it inherits the default `tab-size: 8`; `styles.code`'s `tabSize: 2` does not reach it) and `collapseInner` gained blank lines. Both files above pin it
- [ ] **`NumberInput` omits `oninput` from its props surface**, as `TextInput` does. `BaseProps` extends `HTMLAttributes`, so without the omission a caller's `oninput` typechecks and is then silently shadowed by the spread. Upstream has no equivalent hole — React registers `onInput` and `onChange` as separate props over the same native event, so a caller's `onInput` arriving through `{...props}` really does fire alongside the component's own. Ours makes it a compile error instead of a silent drop, which is the honest translation but _is_ a surface difference
- [ ] **`NumberInput`'s props are a discriminated union, so `onChange` is not contextually typed at call sites** — the same limitation `Slider` records. `onChange={(v) => …}` infers `v` as `any` under `noImplicitAny`; the demo route annotates, and a consumer must too
- [ ] **`FileInput`'s `aria-required`/`aria-invalid` sit on a `role="button"`**, which ARIA 1.2 does not list as supported for that role (Svelte's a11y linter is correct, and is silenced with a comment). Replicated deliberately: upstream puts them there on purpose (forms-6) so they describe the control the user actually focuses rather than the hidden `tabindex="-1"` input, and two of its cases pin them
- [ ] **`FileInput`'s `handleClear` moves focus to an `aria-hidden`, `tabindex="-1"` input.** Upstream's behaviour and what its doc anatomy describes ("returns focus to the input"); arguably an a11y bug, replicated rather than silently fixed
- [ ] **Three hard-coded English strings in `FileInput` bypass `useTranslator`** — the two default placeholders (`'Choose file'`/`'Choose files'`), `'Drop files here'`, and both selection announcements — while the clear button alone is translated. `NumberInput`'s `'Invalid number'` live-region string is the same inconsistency. Only `@astryx.fileInput.clearLabel` and `@astryx.numberInput.clearLabel` exist in upstream's catalogue. Reproduced; **not** "fixed" by inventing keys
- [ ] **`CodeBlock` emits `xds-token-*` alongside `astryx-token-*`** on every span-mode token. `highlight-styles.ts` defines rules only for `astryx-token-*`, and `xds-token` appears nowhere in upstream's CSS — it is dead in upstream's source too. Replicated verbatim; emitting only the live class would be a divergence
- [ ] **`CodeBlock`'s `highlightMode: 'ranges'` is not a distinct branch**, upstream or here: `useSpans` is true only for `'spans'`, or for `'auto'` without the Highlight API, or `'auto'` on Safari. `'ranges'` and any unrecognised value both fall through to range mode. Kept in the type because upstream's is
- [ ] **`applyHighlightRangesBatch`/`Flat` and `tokenizeStreaming` have no consumer here.** They exist for upstream's lab `CodeEditor`, which this port does not ship, but `CodeBlock/index.ts` publishes them so the barrel does too. Likewise `highlight-styles.ts`'s `.astryx-codeeditor` selector half, kept verbatim — it simply matches nothing
- [ ] **`SyntaxThemeProps` is deliberately unexported**, unlike every other component's props type: upstream declares `interface SyntaxThemeProps` module-privately and publishes no props type for `SyntaxTheme` (contrast `MediaThemeProps`, which it does publish). Likewise no `CodeBlockSize`/`CodeBlockContainer`/`FileInputMode` — upstream inlines all three unions
- [ ] **`syntaxThemeStyle` returns an object and `SyntaxTheme` serialises it**, filtering `null`/`undefined`. React hands the object straight to `style` and silently omits empty entries; a naive `join` would emit `--color-syntax-x: undefined`, a _valid_ custom-property value that shadows the `:root` fallback and makes every `var()` referencing it invalid at computed-value time. `defineSyntaxTheme` warns-and-continues on a missing token, so partial themes are a supported input and this path is reachable
- [ ] **`remove_input_defaults` applies to `NumberInput` and `TextInput` too**, not just `Slider`: the `value` attribute is stripped on hydration while the property is preserved. The form-reset debt recorded under Slider is therefore general to every hydrated input in the port, and should be generalised there rather than left component-specific

## Batch 6 — slot translation, seams, and dead upstream keys

- [ ] **`Selector`'s `renderOption` and `Typeahead`'s `renderItem` are `Snippet<[T]>`,** not
      `(option) => ReactNode`. A render prop taking one argument and returning content is exactly
      what a parameterised snippet is, so unlike `Popover`'s trigger there is no discrimination
      problem and nothing splits — the only difference is the spelling
- [ ] **`SelectorOptionData.icon`, `SelectorOption.icon`, `Selector.startIcon` and
      `Typeahead.startIcon` are `IconName | Snippet`,** upstream's `ReactNode | IconType`. That is
      the `DropdownMenuItemData.icon` shape and the faithful translation — `renderIconSlot`
      dispatches on `typeof icon === 'string'` to a registry lookup, and a snippet covers the rest.
      **`NumberInput.startIcon` and `Button.icon` are `Snippet` only** for the same upstream type,
      which is now a visible inconsistency: those two drop half of upstream's union. Worth widening
      them to match rather than narrowing these
- [ ] **`useSelectedItemOffset` takes elements, not `RefObject`s** (`listboxEl`/`triggerEl`), the
      `Popover` `anchorRef` shape. Its `useIsomorphicLayoutEffect` becomes a plain `$effect`: Svelte
      effects run after the DOM write and before paint, which is the property `useLayoutEffect`
      buys, and the SSR half of `useIsomorphicLayoutEffect` has no counterpart at all because Svelte
      effects do not run on the server. `$effect.pre` would be wrong — it runs _before_ the DOM
      update, so the items being measured would not exist
- [ ] **`<PopoverLayer>` gained a `style` prop.** Upstream's `usePopover.render` spreads the caller's
      `ContextRenderProps` into `layer.render`, `style` included; the port's component had dropped it
      because no consumer needed it until `Selector`, whose selected-item overlay is a computed
      negative `margin-block-start`
- [ ] **`Selector` mints eight ids from one `$props.id()`** where upstream calls `useId` six times —
      the two extras are the layer's (upstream's `useLayer` mints its own internally; ours must be
      passed one) and the tooltip's (ditto for `useTooltip`). `Typeahead` mints five for upstream's
      four, and `BaseTypeahead` three for upstream's two, for the same two reasons
- [ ] **`Selector`'s trigger `aria-controls` targets the inner `role="listbox"` div**, not the
      `<Layer>` wrapper — the second exception to this port's aria-controls-at-`layer.id` convention,
      after `TabMenu`, and for the same reason: upstream wires it that way and its own suite asserts
      the attribute is present on both the trigger and the search input
- [x] **`Selector`'s `value` is deliberately NOT `$bindable()`** — it was, briefly, and the idiom
      audit found that the convention breaks the component's own first consumer. `Pagination` renders
      the page-size control as `<Selector value={String(pageSize)} onChange={handlePageSizeChange}>`,
      and upstream's `onPageSizeChange` is **optional**; with a bindable `value`, a consumer who omits
      it picks "25", Svelte stores the local write as an override on the prop's derived,
      `String(pageSize)` never changes so the override never clears, and the trigger reads 25 forever
      while `rangeStart`/`rangeEnd`/`computedTotalPages` all keep using 10. React's controlled input
      snaps straight back. Removed rather than patched around, on the `NumberInput` precedent —
      upstream is strictly controlled, `$bindable` is an additive convenience, and the convenience
      is what was wrong. **This is a live question for the rest of the input family**: `TextInput`,
      `TextArea` and `Switch` all still write locally on the non-action path, so any of them nested
      in a controlled-without-commit parent has the same latent divergence. Worth settling as one
      decision rather than component by component
- [ ] **`styles.itemCheckmark` in `selector.stylex.ts` and `styles.disabled` in
      `pagination.stylex.ts` are dead upstream** — declared and never applied, so `dist/` folds each
      away entirely and neither oracle mode has a counterpart to diff. Ported for parity, the
      standing `tab-menu.stylex.ts`'s identically-named `itemCheckmark` and `Collapsible`'s
      `triggerDisabled` already have (the reverse of a skip)
- [ ] **`BaseTypeahead` spreads rest props onto its `<input>` where upstream drops them** — upstream
      declares `BaseProps<HTMLElement>` and destructures a closed list, the same closed-prop-root
      contradiction `Timestamp`/`FieldLabel`/`List`/`DropdownMenu` document. Here it is also
      load-bearing: it is the seam `Typeahead` reaches the input through, standing in for upstream's
      `ref`. `TypeaheadItem` likewise forwards rest and honours `xstyle`/`class`/`style`, which
      upstream declares and drops — the `HoverCard` precedent
- [ ] **`Typeahead` finds the token to focus by its stable `astryx-token` class**, scoped to its own
      wrapper, where upstream holds a `tokenRef`. `Token` exposes no element seam (no rest spread, no
      attachment — see the closed-prop-list roots above), so this is the available handle; the class
      is exactly what `themeProps` exists to provide, so it is a stable contract rather than a
      markup-shape guess. Retire it if `Token` ever gains a seam
- [ ] **`Typeahead`'s wrapper `onBlur` is `onfocusout`, and `Pagination`'s dots `onFocus` is
      `onfocusin`** — React's `onFocus`/`onBlur` are the _bubbling_ synthetic events, which the
      native `focus`/`blur` are not. The same correction `useListFocus`, `useKeyboardHint` and
      `Toolbar` already record
- [ ] **`Typeahead`'s `TypeaheadItemProps.group` is accepted and unused on both sides** — upstream
      declares it, never destructures it and renders nothing for it. Kept for parity; it is API
      surface with no behaviour
- [ ] **Upstream's `Typeahead/utils.ts` server-safe subpath is not ported.** It re-exports
      `createStaticSource` and the two types at `@astryxdesign/core/Typeahead/utils`; this port ships
      no per-component subpaths at all (recorded under Published surface), and the root barrel
      carries all three names, so nothing is missing but the entry point
- [ ] **`BaseTypeahead` does not transcribe upstream's redundant `if (popover.isOpen)` inside the
      `Home`/`End` keydown cases** — the switch is only reached when it is already true, so the inner
      guard is dead. Noted at the site
- [x] **The five post-batch audits (parity ×3, idiom, surface) found 15 items; all are fixed.**
      Beyond the `$bindable` reversal above: `Selector`'s two upstream status tables
      (`STATUS_ICON_MAP` / `STATUS_ICON_COLOR_MAP`) had been collapsed into one — they are
      value-identical today, so nothing rendered differently, but the port had erased upstream's
      _which icon_ vs _which colour token_ distinction and a future change to either would have
      landed on the wrong axis; `Selector` and `Pagination` now declare `'data-testid'?: string`
      explicitly, as ten other ported components do, rather than leaning on `BaseProps`' index
      signature; `SelectorOption` tests `icon` for truthiness, not `!= null`;
      `TypeaheadItem` destructures `group` out so the declared-but-inert prop stays inert (left in
      `...rest` it rendered a `group="…"` attribute upstream never emits — the one finding with
      observable output); `BaseTypeahead` omits `oninput`/`onfocus`/`onblur`/`onpointerdown`, which
      it shadows, from its props surface; `Selector`'s scroll-into-view effect reads `getItemId`
      through `untrack` so it tracks upstream's two dependencies rather than the whole options bag
      (untracked, typing in a `hasSearch` selector yanked a wheel-scrolled listbox back);
      `BaseTypeahead`'s cleanup effect reads `searchSource` so a swapped source cancels and clears
      the pending debounce, as upstream's `[searchSource]` key does; and the demo's Typeahead source
      is hand-written so `bootstrap()` returns upstream's first five fruits rather than all eight
- [x] **`useLayer` no longer writes `popover.style.display` out of band.** The no-Popover-API
      fallback (infra-4) assigned `display` directly, which was safe only while every `<Layer>`
      consumer left `style` constant — Svelte writes the whole `style` attribute on change, so
      `Selector`'s computed `margin-block-start`, which flips exactly at open and close, would have
      discarded the `display:none` that `hide()` had just written and left a closed dropdown on
      screen (Safari <17, Firefox <125). The fallback is now a `fallbackStyle` the hook exposes and
      `<Layer>` merges last, so Svelte owns the declaration and the hazard class is gone rather than
      repaired. Same failure `attachTrigger`'s `anchor-name` `MutationObserver` exists for; this one
      is avoided at the source instead
- [ ] **`StyleArg` is now exported from the root barrel** — a Svelte-only name, in the family of
      `LayerProps` and the other render-split types. Upstream's counterpart is `StyleXStyles`, which
      a consumer imports from `@stylexjs/stylex`; ours had no public name at all, and ten published
      types reference it (`BaseProps`, `ButtonProps`, `LayerProps`, `PopoverLayerProps`,
      `BaseTypeaheadProps`, the `usePopover`/`useTooltip`/`useHoverCard` option and return types),
      so a consumer wrapping any of them could not write `xstyle?: …`. It adds one name upstream
      does not have, which is why it is recorded here rather than left silent
- [ ] **`useCombobox`/`useSelectedItemOffset` publish no option or return types** — upstream's
      `hooks.ts` declares all four without `export` and `Selector/index.ts` publishes only the two
      functions, so ours are module-private and carry upstream's names (`…Result`, not `…Return`).
      They are the first ported hooks whose types upstream withholds; every earlier pair is published
      because upstream's barrel publishes it, so that convention does not reach these two
- [ ] **`Selector/utils.ts`'s five type guards are unreachable from any entry point.** Upstream
      publishes `isOptionData`/`isDivider`/`isSection`/`normalizeOption`/`getSelectableOptions` at the
      `./Selector/utils` subpath, which this port does not ship. Unlike `./Typeahead/utils` — whose
      three names all reach the root barrel, so only the entry point is missing — these five have no
      route to a consumer at all. Do **not** "fix" it by adding them to the root barrel: upstream's
      `Selector/index.ts` deliberately withholds them, so root-exporting would convert a missing
      export into an over-export. This is the concrete cost of the per-component-subpath debt
- [x] **`use-typeahead.test.ts` was renamed** from `typeahead.svelte.test.ts` to free the filename
      for the component's suite. It is the type-to-select _hook_'s suite
      (`hooks/useTypeahead.test.tsx`), unrelated to the `Typeahead` component, and is the one hook
      suite that keeps its `use-` prefix. **At 0.4.1 it also moved from the client project to the
      server one** and lost its `.svelte` infix: the hook reads `key` and four modifier flags off a
      keyboard event and touches no node, no window and no layout, so it only ever sat in the client
      project because node has no `KeyboardEvent` _constructor_. A small `extends Event` stand-in
      carrying exactly those fields replaces it — deliberately not more, so a future `useTypeahead`
      reaching for `getModifierState` fails loudly instead of passing against a fake. Upstream's own
      suite runs under jsdom, so its `new KeyboardEvent(...)` is a reimplementation too. This makes
      `compute-overflow.test.ts:7-9`'s claim that `use-typeahead` follows the pure-module rule true
      rather than aspirational, and the suite is now runnable in an environment that cannot bind a
      browser port

## Batch 7 — the imperative handle, slot translation, and two closed-prop roots

- [ ] **`Tokenizer` has no `handleRef` prop — `focus()`/`blur()` are instance exports.** Upstream's
      `useImperativeHandle(handleRef, () => ({focus, blur}))` hands a controller object to a ref
      prop; Svelte's counterpart to an imperative handle _is_ the component instance, reached with
      `bind:this`. `TokenizerHandle` is still published and still describes exactly the same two
      methods — it just types the instance rather than a ref target. Same family as the
      `useLightbox`/`<LightboxLayer>` split: the React seam has no prop-shaped counterpart, so the
      Svelte-native seam is used instead
- [ ] **`Tokenizer`'s `ref` is an attachment through the rest props.** Upstream forwards `ref` to
      `Field`'s root; here the rest props reach the same `.astryx-field` div, so an attachment
      travelling through them lands on it. Its `forwards ref` case is the attachment counterpart the
      `ButtonGroup`/`Lightbox` suites already use
- [ ] **`Tokenizer`'s `renderToken` is `Snippet<[T, () => void]>` and `renderItem` is `Snippet<[T]>`**,
      not `(item, onRemove) => ReactNode` / `(item) => ReactNode`. A render prop taking arguments and
      returning content is exactly what a parameterised snippet is, so nothing splits — the only
      difference is the spelling, as `Selector`'s `renderOption` records. `endContent` is a plain
      `Snippet` and `startIcon` is `IconName | Snippet`, the settled icon-slot shape
- [ ] **`Tokenizer`'s `onFocus`/`onBlur` props are `onfocusin`/`onfocusout`, taken straight off
      `BaseProps`.** Upstream declares them itself and wires them from `onFocusCapture`/
      `onBlurCapture`; React's synthetic focus pair bubbles, which the native `focus`/`blur` do not
      — the correction `useListFocus`, `Toolbar`, `Pagination` and `Typeahead` already record. The
      capture-phase distinction is not reproduced: `focusin`/`focusout` bubble to the same wrapper
      the capture handlers were attached to, which is what the component actually needs
- [ ] **`MultiSelector` forwards rest props onto the trigger `<button>` where upstream drops them** —
      it destructures a closed list off `Omit<BaseProps, 'onChange' | 'defaultValue'>` with no rest
      spread, the same closed-prop-root contradiction `Timestamp`/`FieldLabel`/`List`/`DropdownMenu`
      document. We forward, as `Selector` does and to the same element
- [ ] **`MultiSelector` mints eight ids from one `$props.id()`** where upstream calls `useId` six
      times — the two extras are the layer's and the tooltip's, exactly as `Selector` records
- [x] **`MultiSelector`'s option rows are keyed by `item.value`, as upstream and `Selector` are.**
      They were positional (`item-${flatIndex}`) in the first cut, which the parity audit caught:
      `sortedItems` reorders on open, on close and on every search keystroke, and a positional key
      makes Svelte _repurpose_ the node at each index instead of moving it — so the decorative
      `CheckboxInput`, whose box transitions `background-color`/`border-color`, animates its tick on
      every reorder where upstream's node move produces no transition at all. Fixed; the sibling
      `Selector` already keyed by value, so this was drift inside the port as well as against upstream
- [ ] **Four `{#each}` keys remain positional where upstream keys by value** — `MultiSelector`'s
      hidden `htmlName` carriers (upstream `key={v}`) and trigger badges (`key={label}`), and
      `Tokenizer`'s hidden carriers and token row (both `key={item.id}`). A duplicated value, or two
      options sharing a label, only _warns_ in React but **throws** in Svelte, and for the hidden
      inputs and badges the key is not observable in the DOM at all. The token row is the one with a
      residual cost: a caller's `renderToken` snippet holding its own state would see that state
      re-associated with the _successor_ token when a middle one is removed. `OverflowList` keys by
      index internally, so the truncated path is positional regardless and the two paths would
      otherwise disagree with each other
- [ ] **`MultiSelector`'s `announceSelection` and both toggle paths read the optimistic list into
      plain locals before `optimistic.run` installs the override** — the `ToggleButton` race, which
      reaches here because `run` awaits and a live `$derived` re-read would hand `changeAction` the
      value it had just written
- [ ] **`MultiSelector`'s `selectAllState` is computed from the _filtered_ enabled items**, so a
      search query narrows what "all" means — upstream's behaviour, replicated. `handleSelectAll`
      likewise only ever adds or removes the currently enabled items, leaving a selected-but-disabled
      value untouched
- [ ] **Hard-coded English in `MultiSelector` bypasses `useTranslator`** — the four announcement
      strings (`'Selection cleared'`, `'All selected'`, `'N of M selected'`), the trigger's
      `'N selected'` count and the dropdown's `'No results found'`. Upstream's catalogue has keys
      only for the placeholder, select-all label, search placeholder, search aria-label and
      clear-all label, all of which _are_ translated here. Reproduced; **not** "fixed" by inventing
      keys — the same inconsistency `FileInput` and `NumberInput` record
- [ ] **`Tokenizer`'s `+N more` and `Create "…"` strings are likewise hard-coded**, while its clear
      button goes through `@astryx.tokenizer.clearAll`. Same standing
- [x] **`Tokenizer`'s `filteredSource` had an empty dependency set.** Written as
      `$derived({search: async () => …searchSource…selectedIds…})`, evaluating the expression only
      _constructs_ the two closures — it reads no signal doing so, so the derived was computed once
      and never invalidated: a per-instance constant wearing a memo's clothes, where upstream's
      `useMemo(…, [searchSource, selectedIds, hasCreate])` mints a new identity on every token
      add/remove. The consequence was one door down: `BaseTypeahead` keys a cleanup effect on
      `searchSource` _precisely_ so that swapping the source drops the queued debounce, and with a
      frozen identity that effect never re-ran for a `Tokenizer` — so removing a token inside the
      150 ms debounce window let the armed search fire afterwards and pop the dropdown open. Fixed by
      reading the three keys into locals in a `$derived.by` body, which restores both the dependency
      set and upstream's capture-at-memo-time semantics. Found by the idiom audit; the `cancel()`
      half of that teardown is a no-op for `Tokenizer` on **both** sides, since neither wrapper
      forwards `cancel` — an upstream bug the port inherits faithfully
- [ ] **Upstream's `hasCreate` suite cannot tell an `add` from a `create`.** The test-parity audit
      mutation-checked `handleAdd`: dropping the whole create branch fails
      `fires onChange with type "create"…`, but dropping only the
      `item.id.startsWith(CREATABLE_ID_PREFIX)` test — so _every_ add is misreported as a `create` —
      passes all 48 cases. That is upstream's own blind spot, faithfully inherited:
      `appends Create option alongside real search results` declares an `onChange` spy and never
      asserts on it, and no other `hasCreate` case adds a real item. Closing it would mean inventing
      coverage upstream does not have, so it is recorded rather than fixed
- [ ] **`Tokenizer`'s `.doc.mjs` omits six real props** — `startIcon`, `width`,
      `tokenOverflowBehavior`, `onFocus`, `onBlur` and `ref` are in the source _and_ the published
      `.d.ts` but absent from the props table in both locales, and the `docsZh` half additionally
      omits `hasCreate`. Ported from source, per the Icon px→rem precedent and the four batch-5 doc
      omissions above. Recorded so a future reader does not "correct" the port against the doc file
- [ ] **`useMultiCombobox`'s `getItemId` reads the whole options bag** (`options().listboxId`
      materialises `sortedItems`, `isOpen`, `hasValue`, …) where upstream's
      `useCallback(…, [listboxId])` is genuinely narrower. It is why the scroll-into-view effect
      needs its `untrack`, and it also makes the three `id={combobox.getItemId(...)}` template sites
      depend on `sortedItems` — inert, because the string is unchanged and Svelte's attribute update
      bails. Passing `listboxId` to the hook as a separate stable argument would remove both the cost
      and the need for the `untrack`; `useCombobox` has the identical shape, so settle it for the pair
- [ ] **`sx()` emits `class=""` where upstream emits no `class` attribute at all**, at every
      conditional-only call site — `Tokenizer`'s start-icon `<span>` is this batch's instance, and
      `radio-list-item.stylex.ts` / `toggle-button.stylex.ts` are the standing precedents. It follows
      from `SvelteStyleAttrs.class` being `string` rather than `string | undefined`, so it is the
      adapter's to fix once, not any component's
- [ ] **`Tokenizer`'s `unfocusedLayer` popover does not mirror in RTL** — `left: anchor(start)` is a
      physical inset, upstream's own known follow-up from #3389. Replicated verbatim, and its RTL
      case pins that no placement-derived style (`justify-self`, `position-area`,
      `position-try-fallbacks`) leaks into the inset-positioned box

## Batch 8 — `Theme`, `useTheme`, and where the token defaults have to live

- [ ] **`tokenDefaults` is declared in `theme/tokens.ts`, not `theme/define-theme.ts`.** Upstream
      puts it with `defineTheme`, and it cannot go there: building it means importing
      `styles/tokens.stylex.ts`, this package ships `.stylex.js` **uncompiled** for the consumer's
      StyleX plugin, and `define-theme.ts` is loaded under plain Node by the theme build
      (`build-theme.mjs` → `generate-theme-rules.js` → `define-theme.js`). The first cut put it
      upstream's side and the theme build died on a runtime `stylex.defineVars`. The general rule
      this establishes: **nothing reachable from `generate-theme-rules.js` may import a `.stylex.ts`
      module**, and it will bind again on anything the CLI (Phase 4) loads outside a bundler
- [x] **`registerIcons` now invalidates mounted `<Icon>`s** — found by the idiom audit, and a
      Svelte-specific hazard with **no upstream analogue**: `globalRegistry` is a plain module
      binding and `icon.svelte` reads it through a `$derived`, so swapping to a theme with its own
      `icons` refreshed the map and left every already-mounted icon painting the old glyph until its
      node was destroyed. React re-renders the subtree from `Theme`'s render body and has no gap.
      The registry stays a plain binding (it must be readable during SSR and from plain-Node
      tooling); the _read_ path subscribes to a version counter in
      `icon/icon-registry-signal.svelte.ts` that `registerIcons`/`resetIcons` bump. Latent until a
      theme ships an icon registry — which is the Phase 3 `neutralIconRegistry` item — so it was
      fixed before it could bite rather than after
- [x] **Upstream bug fixed, not replicated: the injected-stylesheet registry is refcounted.**
      Upstream's `injectedThemes` is a presence `Set` and its early return happens _before_ the
      cleanup is constructed, so two co-mounted `<Theme>`s on one theme name share a `<style>` that
      the first unmount deletes — leaving the survivor unstyled with nothing to re-inject it. Ours
      counts, and removes the tag at zero. Invisible for `__built` themes, which is every theme this
      repo ships, and that is exactly why it was worth fixing rather than waiting for a report
- [ ] **Upstream bug (documented, not replicated-away): `tokenDefaults` omits `borderDefaults`.**
      Upstream ships the group, publishes a `BorderVarName` type for it, and then leaves it out of
      the flat map — so `tokenVars` and every `useTheme().tokens` is missing `--border-width`. Ours
      matches the omission, because the parity rule puts upstream bugs here rather than in the code:
      folding it in would give this port a token key upstream's API does not have. Note the port's
      own suite could not have caught it either way — it compares `useTheme().tokens` against our
      own `resolveThemeTokens`, so both sides would carry the extra key
- [ ] **The runtime-injection warning substitutes package names.** Upstream's string names
      `@astryxdesign/theme-<name>` and its CLI; repeating that verbatim would tell a reader to
      install packages that do not exist here, unlike the `useToast` strings kept verbatim (which
      name _components_ this port intends to ship). Structure and content are upstream's. Upstream's
      two copies also disagree — `npx @astryxdesign/cli theme build` in source, `npx astryx theme
build` in the published 0.1.7 dist — and the source wins, per the Icon px→rem precedent
- [ ] **`ThemeProps` is deliberately unexported**, like `SyntaxThemeProps`: upstream declares it
      module-privately in `Theme.tsx` and `theme/index.ts` publishes no props type for the component
- [x] **Nine unit-test files sat under `src/lib`, not `src/tests`** — `i18n/resolve.test.ts`,
      `theme/theme.test.ts` and the seven under `utils/`. **Done:** all nine moved to `src/tests/`
      and re-pointed at `$lib/…`, the convention 173 of the 175 imports in that directory already
      used. A clean rebuild now emits **0** test files into `dist/` (was 18). The entry this
      replaces was right that it was never a live leak — `package.json#files` carries
      `!dist/**/*.test.*`, and `npm pack --dry-run` confirms the tarball has never held one. What
      it _was_ is a rule with nothing enforcing it: CLAUDE.md states the rule as **location**, while
      the only thing actually holding was a denylist somewhere else. So the sweep came with a **lint
      guard** — a `*.{test,spec}.{js,ts}` under `src/lib` is now an eslint error, mutation-checked
      with a throwaway probe — and the `files` denylist stays as the second line. One thing the move
      broke and the suite caught: `theme.test.ts` reads `base.css` off disk through a
      `new URL(…, import.meta.url)` relative path, which silently became `src/styles/base.css`.
      Vitest reported that as **3 skipped**, not 3 failures — a `beforeAll` that throws skips its
      describe rather than failing it, so a relative-path break in a file read is invisible in the
      pass count. Repointed at `../lib/styles/base.css`; 38/38 again, and the server project is back
      to 679 passing with nothing skipped
- [ ] **`useTheme` sits in `theme/`, not `hooks/`.** Upstream's `hooks/` barrel does not carry it
      either — `theme/index.ts` publishes it — so the port's `hooks/`-mirrors-upstream rule points
      the same way. Its mode half stays `internal/theme-mode.svelte.ts`
- [ ] **`TokenName` is `string` here.** Upstream's is a literal union of every token name, generated
      alongside its token modules, and `tokenVar`/`resolveThemeToken` take it. Ours accept a plain
      `string`, so a typo is a runtime `''` rather than a compile error. Worth generating from
      `styles/tokens.stylex.ts` — it is the one place the names are declared
- [ ] **No `domainTokens/` group.** Upstream folds a data-viz token set into `tokenDefaults`; this
      port does not ship one, so `resolveThemeTokens` resolves 186 names rather than upstream's full
      set. Lands with the data-viz components, which are not scheduled
- [ ] **Style injection writes one stylesheet, where upstream writes two.** Upstream's
      `generateThemeCSS` returns `{prose, component}` and `<Theme>` injects the prose half into
      `@layer reset` and the component half into `@layer astryx-theme`; ours calls `generateThemeCss`,
      which emits both layer wrappers itself and returns one string. **The content gap is closed** —
      the Phase 3 _Prose defaults_ item landed, so the prose half is injected either way, and the
      theme oracle now checks that direction. What is left is the return _shape_: a consumer calling
      `generateThemeCss` directly gets one string where upstream's gives two halves to place
      separately. Emitted CSS is identical, so this is API surface, not behaviour
- [ ] **The `<html>` sync's cleanup removes both attributes unconditionally**, as upstream's does —
      so two root `<Theme>`s (an app that mounts a second detached tree with its own theme) leave
      `<html>` bare when _either_ unmounts. Upstream's identical behaviour, replicated; the
      component's contract is that there is one root

## Batch 9 — `Outline`'s deferred half, a shared anchor name, and a link alias nobody had recorded

- [x] **`parseOutlineFromMarkdown` and `useOutlineFromMarkdown` landed with `Markdown/parser` in
      batch 11**, retiring the batch-9 deferral. Their three cases in
      `src/tests/outline.svelte.test.ts` are restored unchanged (the helper is pure), and upstream's
      separate `parseOutlineFromMarkdown.test.ts` is ported whole — 12 of 12 — as
      `src/tests/parse-outline-from-markdown.test.ts` in the server project. Upstream ships **no
      suite for `useOutlineFromMarkdown`** (a one-line `useMemo`, a one-line `$derived` here), so
      none is invented. The demo's `ExtractFromMarkdown` story is **also restored**, taking the
      `Outline` demo section to 7 of upstream's 7 — so this deferral is now closed end to end
- [ ] **`Outline`'s indicator anchor name is a literal, not per-instance** — `--outline-active`,
      exactly as upstream declares it. Two `Outline`s in one document therefore declare the same
      `anchor-name`, and each indicator resolves it against the last such element in DOM order
      rather than its own outline's active link. Replicated rather than fixed: a per-instance name
      would have to live in an **inline style**, which is the shape `useLayer.attachTrigger` needs a
      `MutationObserver` to repair against Svelte's whole-attribute `style` writes. In a StyleX class
      it cannot be clobbered, which is the tradeoff upstream's own choice already makes
- [ ] **`useScrollSpy` takes its options as a getter and an element, not a `RefObject`** — the
      settled shapes (`useSelectedItemOffset`'s `listboxEl`, `useMediaQuery`'s getter). It stays
      module-private on both sides. Upstream's `typeof window === 'undefined'` branch in
      `lockActiveId` has **no counterpart**: it is only reachable from a click handler, which cannot
      run on the server
- [ ] **`useOutlineFromDOM` returns `OutlineFromDOMState`, not `OutlineItem[]`** — an array cannot
      stay live across a Svelte component's lifetime, so the result comes back as an object whose
      `items` is a `$state` read. Joins `MediaQueryState`/`ImageModeState`/`ScrollOverflow` in the
      "Svelte-only state types that are legitimate but undocumented" list under Published surface
- [ ] **`OutlineItem` is re-exported from `types.js`, where upstream re-exports it from
      `Outline.tsx`.** Re-exporting a symbol the module also imports trips eslint's
      `no-import-assign` inside a Svelte module script. The type module is the honest source and the
      shape `TreeListItemData` already uses; consumer-visible surface is identical
- [ ] **A `to` alias reaches custom link components that upstream never sends — and it predates this
      batch.** `Link` and `Item` both spread `...(linkResolved.isNative ? {} : { to: href })`;
      upstream's `Link.tsx`, `Item.tsx` and `Outline.tsx` pass `href` only, so a custom component
      gets `href` upstream and `href` + `to` here. `Outline` follows the existing convention rather
      than becoming the one component that does not — the same reasoning the `{...rest}`-spread-first
      entry above records. **Found while porting `Outline`; it was undocumented until now.** Settle
      as one decision across `Link`/`Item`/`Outline`, not per component

## Batch 9 — `CommandPalette`'s slot translation, and a dev-only error class worth remembering

- [x] **`emptySearchText`/`emptyBootstrapText` are `string | Snippet`, and the snippet arm broke
      first.** `CommandPalette` rendered the value as component _content_ —
      `<CommandPaletteEmpty>{emptyBootstrapText}</CommandPaletteEmpty>` — which makes Svelte build a
      snippet that renders the expression; when the value is itself a `Snippet` that throws
      `snippet_without_render_tag`. Fixed by passing it as the `children` **prop**, which
      `CommandPaletteEmpty` already discriminates on. Two things about how it was found are worth
      keeping, because both are general:
  - **All 45 ported cases pass against the broken version.** Every upstream call site passes a
    plain string, so the snippet arm — which exists only because `ReactNode` had to be split — has
    no upstream case to inherit. `src/tests/command-palette-snippet-empty-text.svelte.test.ts` is
    the fifth beyond-upstream file, and it is mutation-checked: restoring the content form fails
    both its cases while the ported suite stays green.
  - **The production build cannot catch it.** `snippet_without_render_tag` is a **dev-only** Svelte
    check: the docs site prerendered 165 pages green with the bug present, and only the dev server
    surfaced it. That is the same trap the hydration sweep records, in a second error class —
    _treat a green production build as evidence about rendering, never about correctness_.
- [ ] **`CommandPalette`'s search input doubles as a type-to-select target.** Upstream does not pass
      `hasSearch` to `useCombobox`, and its `handleKeyDown` forwards every key except
      Escape/Enter/Space, so typing feeds the typeahead as well as the input: typing `tooltip` in
      the docs palette leaves the highlight on the `Tooltip` row rather than at the top. Replicated
      verbatim — it is upstream's wiring, and it happens to land on the best label match — but it is
      surprising enough to record, and it is why an ArrowDown from a freshly-typed query does not
      start at the first result
- [ ] **`renderItem` is `Snippet<[T, boolean]>` and the `input`/`footer` slots are `Snippet`s**,
      where upstream has `(item, isSelected) => ReactNode` and two `ReactNode`s. A render prop taking
      arguments and returning content is exactly a parameterised snippet, so nothing splits — the
      `Selector.renderOption` precedent. `CommandPaletteFooter`/`Empty`/`Group`/`List`/`Item`
      children are likewise `Snippet` (or `string | Snippet` for `Empty`, whose string branch is
      reachable through the two empty-text props)
- [ ] **`setCommandPaletteContext` is not published, though `useCommandPaletteContext` is.** Upstream's
      `CommandPalette/index.ts` exports the reader and the value type but has no provider function to
      export — React's `<Context value>` is the provider. The port's setter is the Svelte half of
      that, and the barrel's own convention keeps provider wrappers internal
- [ ] **`CommandPaletteInput` omits `oninput` from its props surface**, as `TextInput` and
      `NumberInput` do, because `BaseProps` would let a caller's handler typecheck and then be
      silently shadowed. The `value`-spread hazard `NumberInput` documents does **not** reach it: a
      `type="text"` field has no bad-input state, so it is immune for the same reason `TextInput` is
- [ ] **Upstream's trailing `{' '}` after the input's end cluster is not reproduced** — a JSX
      artifact emitting a whitespace text node, the same class as the `Switch` leading-whitespace
      note. No rendered difference

## Batch 10 — the nav family: closed-prop roots, replicated quirks, and one dead branch

_Closed-prop-list roots (forwarded here, dropped upstream — the standing convention):_

- [ ] **`TopNavMenu`** and **`TopNavMegaMenu`** declare `BaseProps<HTMLButtonElement>` and destructure
      a closed five/seven-prop list with no spread, so `xstyle`/`class`/`style`/`id`/`role`/`tabIndex`,
      every `aria-*` and `data-*` (including `data-testid`) and every handler are silently discarded.
      We forward onto the **desktop trigger**, which is the element the type names. The drawer and
      mobile-bar branches render no such button, so nothing is forwarded there — a per-mode asymmetry
      upstream cannot have, because upstream forwards nothing anywhere
- [ ] **`TopNavMegaMenuItem`** drops the same set off `Omit<BaseProps<HTMLElement>, 'onClick'>`; the
      one attribute it _does_ keep, `tabIndex`, reaches only the desktop branch. We forward, and
      replicate `tabindex`'s desktop-only routing
- [ ] **`SideNavItem`** drops the same set off `BaseProps<HTMLElement>`. We forward onto the wrapper
      `<div>` (the outermost element in all four of its shapes) and leave `data-testid` on the _item_
      element, which is where upstream routes it

_Faithful upstream quirks (replicated, not fixed):_

- [ ] **`TopNavMegaMenu`'s trigger writes its ARIA by hand and never spreads `popover.triggerProps`**,
      so it carries `aria-haspopup`/`aria-expanded` but **no `aria-controls`** — unlike `TopNavMenu`'s
      trigger, which does spread them. The two are not ARIA-equivalent, and upstream's own suite
      asserts only the first two, so the gap is unpinned there as well
- [ ] **`delay`, `hideDelay` and `onOpenChange` are inert in `TopNavMegaMenu`'s drawer mode** —
      upstream forwards only `label`/`items`/`featured` to its drawer sub-component, so the
      disclosure's expand/collapse fires no callback even though the prop is documented
      unconditionally
- [ ] **`TopNavMegaMenu`'s drawer `aria-controls` id is derived from the label**
      (`mega-menu-${label.toLowerCase()…}`), not minted, so two mega menus sharing a label collide.
      `TopNavMenu`, three files away, mints one properly
- [ ] **`SideNav`'s `stickyBottomCollapsed` sets `borderBlockStart: 'none'`, which emits no rule** —
      StyleX drops the shorthand, so the collapsed footer keeps its border and only the
      `paddingBlockStart: 0` lands. Authored verbatim so the classes still match; the same
      shorthand-drop family as Phase 0's `border: 'none'` note
- [ ] **`SideNavCollapseButton` is always icon-only.** Its `.doc.mjs` claims `label` renders "a text
      button with the chevron icon"; the source passes `isIconOnly` unconditionally and always
      supplies a label, so `label` changes the accessible name and nothing else. Source wins
- [ ] **`SideNavHeading` wraps only its _collapsed_ menu in `NavHeadingCloseContext`** — its three
      expanded branches render `{menu}` bare, where `TopNavHeading` wraps both of its popover
      branches. So a `NavHeadingMenu` inside an _expanded_ `SideNavHeading` gets no working
      `closeMenu`. Replicated exactly, scope for scope
- [ ] **`collapsible.buttonLabel` is declared in `SideNavProps` and never read** — grep across the
      whole family finds only the interface line and two doc lines. Declared for shape parity, wired
      to nothing
- [ ] **A hrefless `TopNavMegaMenuItem` on desktop is a bare `<div onclick tabindex>`** — no role, no
      key handler, so it is unreachable by keyboard. Replicated rather than corrected: adding a role
      would change the accessibility tree upstream's suite asserts on

_The dead branch:_

- [ ] **`MobileNav`'s delayed `close()` is unreachable on both sides.** The effect teardown runs
      before the re-run and closes the dialog first, so the `else if (dialog.open)` branch that
      schedules a 250ms close never fires on an `isOpen` transition. It would not matter if it did:
      `display` is driven by the `isOpen` prop, so the panel is `display: none` before either path
      runs and no transform transition could play. The drawer disappears rather than sliding out.
      The teardown-`close()` itself is kept — upstream needs it because `<Activity mode="hidden">`
      tears the effect down with a stale `isOpen`, and here it stops a drawer unmounted mid-open from
      leaving the browser's top layer occupied. **Mutation-confirmed while porting
      `MobileNavReopen.test.tsx`:** deleting the teardown `close()` leaves
      `mobile-nav-reopen.svelte.test.ts` green (the re-run's delayed branch closes the dialog
      instead), and deleting _both_ paths fails it — so the suite pins the open/close/re-open cycle,
      not the teardown, and no case asserts a slide-out delay. Recorded in that file's header

_Doc-vs-source disagreements followed in source's favour:_

- [ ] `MobileNav.doc.mjs` claims `width` is "capped at 85vw"; the source is
      `width: 100vw; max-width: {w}px` with no cap anywhere, in any locale, and no `85vw` in the
      shipped CSS. Not implemented
- [ ] Real source props absent from their props tables: `MobileNav`'s `label` (load-bearing — it
      drives `aria-label`), `TopNavHeading`'s `logoLabel`, `TopNavItem`'s `size`/`target`/`rel`/
      `download`/`referrerPolicy`/`xstyle`, `TopNavMegaMenuItem`'s `tabIndex`,
      `TopNavMegaMenuFeaturedCard`'s `xstyle`, `SideNavHeading`'s `as`, `SideNavItem`'s `size`, and
      `SideNavCollapseButton`'s `onClick`. All ported from source
- [ ] `AppShell.doc.mjs` narrows `mobileNav` to `'ReactNode'` deliberately (its comment cites #1645 —
      the docsite playground exact-matches the type string against `UNSUPPORTED_PROP_TYPES`). The
      real type is `false | MobileNavConfig | ReactNode`, and that is what is ported; only
      `docsDense.propDescriptions` states it upstream
- [ ] `AppShell`'s skip-link text is a **hardcoded English literal** upstream — there is no
      `@astryx.appShell.skipToContent` key in the catalog, so it is replicated as a literal rather
      than given an invented key

_Locale gaps in upstream's own docs, recorded because the docs site renders them:_

- [ ] `TopNav.doc.mjs`'s `docsZh` carries no `name`, no `description` and no `props` array, and its
      `usage` prose is the **English text verbatim**. `SideNav.doc.mjs`'s `docsZh`/`docsDense` have
      no props array either, and its `docsZh.usage` is byte-identical English. `MobileNav`'s `docsZh`
      is a flat props list that drops `MobileNavToggle` entirely
- [ ] `SideNavItem.doc.mjs` says "See `npx astryx docs icons`" in the published 0.1.7 tarball and
      "See `astryx docs icons`" in upstream's source (commit `04cd8f7`, landed after the build). The
      docs site reads `node_modules`, so it renders the `npx` form until 0.1.8. Expected; recorded so
      nobody "fixes" it

## Batch 10 — test-harness findings (not component defects)

- [x] **`pnpm … test:unit -- --run <path>` silently starts a _watch-mode full run_** — **FIXED in
      `CLAUDE.md`.** Under pnpm 10 the `--` is passed through, so vitest receives
      `"--" "--run" "<path>"`, ignores both the flag and the filter, and watches. It presents as a
      35-minute hang with an empty log, and it cost three separate agents exactly that before one
      diagnosed it. The documented form is now `pnpm -F @astryx-svelte/core test:unit --run <path>`,
      with `--project=client|server` to narrow. Worth remembering as a class: **a wrong command in
      the docs is a defect with a cost, not a typo.**
- [ ] **One Chromium instance is the suite's real constraint, and a truncated run looks green.**
      Two concurrent vitest runs (a second session's, or an agent's) make the shared browser die
      mid-run with `[vitest] Browser connection was closed while running tests`. Every remaining
      file is then **never executed**, and it is reported as an _unhandled error_ rather than as
      failed cases — so the summary reads e.g. `Test Files 1 failed | 43 passed (111)`,
      `Tests 1423 passed`, with **nothing marked failed** while ~60% of the suite did not run. That
      is the same shape of trap as the one-directional theme oracle: a green-looking result that is
      evidence about a subset. `fileParallelism: false` (the fix for the old starvation family) is
      what puts all 111 files in one instance, so the two debts are linked — the note above already
      says to reach for more browser _instances_, not more files per instance. **Two actions, not
      one:** make a truncated run exit non-zero and say so (the reporting is the dangerous half),
      then split the projects across instances. Until then, never run the suite concurrently with
      anything else, and treat any full-run number produced under contention as unmeasured.
      **Partly addressed**: `run-client-tests.mjs` now runs its chunks concurrently
      (`CLIENT_CHUNK_CONCURRENCY`, default `max(2, min(4, cpus - 1))`). This is not the same thing
      as the contention hazard above and does not reopen it — the danger there is _two runs sharing
      one browser_, where this gives every chunk its own process, browser and Vite server, which
      was already true and was only ever run serially. The reporting half of the debt was closed
      earlier by the files-run-vs-files-on-disk reconciliation, which a concurrent run does not
      weaken: it is a sum, and a chunk that collects nothing still subtracts from it. What remains
      open is the real fix — one run that survives all 163 files, so cross-chunk state leakage is
      exercised again.
- [ ] **oxlint cannot replace eslint here, and the reason is Svelte templates — not speed and not
      the custom rule.** Evaluated at oxlint v1.62-era (2026-08) because `pnpm -F …/core lint`
      measures **1m24**. Two things that sound like blockers are not: JS-authored plugins reached
      alpha in 2026-03 with "most existing ESLint plugins without modification" and 100% conformance
      on ESLint's 33,006 built-in-rule tests, so `eslint-rules/no-physical-properties.js` would very
      likely run unmodified; and raw speed is a ~4.8x win. The blocker is coverage: oxlint lints the
      `<script>` blocks of a `.svelte` file and **not the template**, where much of
      `svelte.configs.recommended` lives — and core is **559 `.svelte` files** against 643 `.ts`.
      So the honest framing is an *additional* fast pass over the `.ts` half, not a replacement, and
      it buys a fraction of 1m24 against a 25-minute client suite. Revisit when oxlint ships Svelte
      template support (on their roadmap; `sveltejs/svelte#17665` tracks the same question for
      upstream Svelte's own repo). **oxc has no test runner at all** — `@oxc-node/core` is a
      TypeScript register hook for Node's built-in runner, which is unrelated to 163 browser suites
      in headless Chromium, so nothing in that toolchain addresses the gate that actually costs time.

## Batch 11 — upstream 0.4.1 port findings

- [ ] **The class oracle cannot see a focus ring that stopped being applied.** Migrating 36 modules
      onto the shared `utils/focus-outline.stylex.ts` meant deleting each local ring declaration and
      wrapping the call site instead. Deleting the declaration and _forgetting the wrap_ produces
      **zero mismatches**: object-mode diffing compares the declarations a module makes, and the ring
      now arrives from a different module entirely, so its absence at the call site is not a
      difference the oracle is looking at. **16 modules silently lost their ring**, and they were
      found by grepping every stripped module for a `focusOutline` reference — not by the gate that
      exists to catch exactly this. The CSS oracle is blind for the same reason: the rule is still in
      the sheet, nothing references it. Generalised, **both oracles prove what a module _declares_,
      never what an element _receives_**, so any refactor that moves a declaration across a module
      boundary leaves the gate green by construction. Worth a third check that resolves call sites,
      or at minimum a rule that a style key deleted in the same commit as a shared-module adoption
      must appear as a wrap somewhere
- [x] **`ThemeConfig` has no `extends`, where upstream's does.** ~~Nothing in the port is _wrong_
      today because no shipped theme uses it; the debt is that a downstream consumer writing an
      upstream-shaped theme config gets a silently ignored key.~~ **Ported.** The framing above was
      too generous by one step: the CLI's shipped `assets/docs/theme.doc.mjs` was already
      documenting `extends` — upstream's prose carried over verbatim, down to the worked example —
      so this was not a key a consumer might reasonably not know about, it was **a documented
      feature that did nothing**. Merges tokens, components, icons and indicators with the base at
      lowest precedence and the child's `name` always winning, which is upstream's set; `syntax`
      inherits through `resolvedTokens` and the on-media maps are resolved unconditionally, so
      neither needs a branch. The one translation that mattered: the pre-seed reads
      `base.resolvedTokens`, not `base.tokens`, because upstream has one token map where this port
      has two — seeding the raw map would inherit only what the base's author typed by hand and
      drop every generated token. All 9 upstream cases ported plus one for indicators, which
      upstream merges without covering
- [x] **The client vitest project could not be executed for any of the 0.4.1 batch.** ~~Its browser
      server fails to bind with `EACCES: permission denied ::1:<port>` in this environment.~~
      **Resolved, and the recorded diagnosis was wrong in a way worth keeping.** It was called
      environmental, which suggested nothing could be done about it locally. The real cause is
      specific and fixable: vitest's browser server binds **63315** by default and Windows reserves
      TCP blocks for Hyper-V — `netsh interface ipv4 show excludedportrange protocol=tcp` reports
      `63271–63370` here. Vite retries `EADDRINUSE` and **not** `EACCES`, so the run dies before
      Chromium launches and reports "no tests" rather than anything naming a port.
      `VITEST_BROWSER_PORT` overrides it; the suite then runs 163/163 files, 4,510 cases. The
      generalisable part: **"environmental" is a diagnosis that stops investigation**, and this one
      survived disabling the sandbox — which should have been the clue that the assumed cause was
      not the cause
- [ ] **A failed hover in `beforeAll` costs a whole chunk, and did so only on CI.**
      `setup-stylex.ts` parks the real pointer in a corner so hover state cannot leak between files.
      On CI that hover hit Playwright's `element is outside of the viewport` and retried to the
      **30 s actionability timeout — once per file, in `beforeAll`**, so all 12 files of chunk 1
      died and reported with nothing named but the setup file. It passed locally every time. Two
      things were wrong independent of which environment difference triggered it: the corner is
      `position: fixed`, so a scrolled frame maps it outside the *top-level* viewport that
      Playwright checks against (the note there already reasoned about frame *height* and missed
      scroll offset), and **a hygiene step was allowed to fail a suite**. Now scrolls to top first
      and is best-effort with a 2 s bound, warning rather than failing. The rule: a setup step that
      is not an assertion must not be able to take the file down with it
- [ ] **CI ran everything for every change.** A full run is ~13 minutes — 409 s of tests, 190 s of
      type-aware lint, 76 s of build — and a `docs/`-only edit paid all of it. Split into `lib`,
      `client` and `docs` jobs behind a `changes` job that classifies the diff
      (`.github/scripts/changed-scopes.mjs`). Two properties are the point and should survive any
      later tidying: the classifier is **deny-by-default**, so a path it does not recognise sets
      `global` and runs every job (a skip-list would fail silently green instead); and the jobs
      select packages by **exclusion** (`--filter='!docs'`) rather than by naming them, so a package
      added later is covered by construction instead of going untested until someone edits the
      workflow. The always-running `ci` job exists so a *skipped* job cannot leave a required status
      pending forever
- [ ] **`git checkout -- '*'` destroyed every uncommitted tracked file in the worktree, across
      every concurrent workstream.** It was written inside a cleanup script as an intended no-op
      guard. It is not a no-op: git expands the pathspec against the **whole index**, not against
      the caller's own edits, and it has no concept of which workstream authored a change. Unstaged
      changes have no reflog, so nothing was recoverable — every affected agent had to retype from
      memory, and one commit's worth of work (`format-instant.ts`) was caught only because a
      follow-up read happened to show pre-edit content. **The revert is silent**: a reverted file
      looks untouched rather than broken, so "it still compiles" and "the oracle is green" are both
      worthless as evidence that an edit survived. Three rules came out of it, and the third is the
      one that generalises: a script that reverts files must **enumerate** them, never glob; the
      blast radius of `git checkout --` is every workstream sharing the checkout, not the one
      running it; and **the safe primitive for scoping work back to your own files is to rewrite
      the files you own, never to revert the ones you do not.** Untracked files survived, which is
      the only reason new modules (`panel-search-input.*`, new fixtures, new suites) came through
      intact — an accident of the mechanism, not a safeguard

## The Selector family at 0.4.1 — port findings

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

## The input family at 0.4.x — port findings

- [ ] **A "13 shipped i18n keys have no call site" brief is a count of the catalog, not of one
      family.** Grepping `src/lib` for every key in `locales/en.json` finds **20** with no call
      site, and only **10** of them belong to the input family (`fileInput.*` x8,
      `timeInput.invalidTime`, `dateInput.invalidDate`). The other ten are three separate
      workstreams: `numberInput.increment/decrementLabel` (2),
      `tableRowExpansion.expand/collapseAllRows` (2), and `step.*` (6) — the lab `Stepper`, which
      **this port has not ported at all**, so those six will stay uncalled until it is. The
      generalisation is the method, not the number: **derive the list from the catalog with a
      script and attribute each key to an owner**, because a hardcoded English literal is invisible
      to every gate the repo has (the oracles diff CSS, `check` sees a valid string, and a suite
      asserting the literal _passes_ precisely because the component emits it)
- [ ] **A summary of which callers pass `iconClassName` to `InputClearButton` is worth checking
      against the source, not trusting.** The convergence brief said "each converted caller passes
      `iconClassName={stableClassName('<component>-clear-icon')}`". Upstream passes it from **two**
      of the ten call sites — `DateInput` and `DateRangeInput` — and from those two only because
      they had already shipped a component-specific target a theme could be written against.
      `TextInput`, `TimeInput`, `DateTimeInput`, `FileInput`, `Tokenizer` and `PanelSearchInput`
      pass nothing, and stamping the extra class on them would have invented six public theme
      targets upstream does not ship — the parity rule's exact failure mode, arriving as an
      instruction rather than as an idea. The `.doc.mjs` corpus is the cross-check:
      `deprecatedFor: 'input-clear-icon'` appears on exactly the targets that exist
- [ ] **Three of the five date/time `inline` oracle claims were already stale before this batch,
      and the run had been red on them for a release.** An earlier batch moved
      `DateInput`/`DateRangeInput`/`DateTimeInput`'s icon buttons onto
      `focusOutlineStyles.focusVisible` without touching the oracle, and composing an **imported**
      style at a call site is exactly what stops StyleX folding it — upstream's `dist/` now carries
      `styles.iconButton` / `iconButtonDisabled` (and `DateRangeInput`'s `presetButton` pair) as
      live objects with no literal string left to claim. So the fix is to **delete** the `inline`
      entries, not to correct them: object mode already covers the keys. Generalised, and it is the
      other half of the focus-ring finding above: **adopting a shared style module moves a key from
      inline mode to object mode**, so the same commit that deletes a local ring declaration has to
      delete its `inline` claim too, or the oracle reports a mismatch that looks like a style bug
      and is really a bookkeeping one. `Switch`'s `statusGap` and `Token`'s `removeButton` moved the
      same way in this batch, for the neighbouring reasons (`xstyle` across a component boundary; a
      `focusOutlineProps.focusVisible(...)` runtime call)
- [ ] **`form=""` is the only escape for required + disabled-with-a-reason, and it reads like a
      typo.** `disabledMessage` deliberately drops the native `disabled` attribute so the reason
      stays focus-discoverable — which leaves `required` live on a control the user cannot operate,
      so `form.checkValidity()` is false forever and the browser's "please check this box" bubble
      points at a switch nothing can toggle. `form` names the **id** of the form to associate with,
      and no element can have the empty id, so `form=""` associates the input with _no_ form: it
      leaves constraint validation and form data entirely while staying visible, focusable and
      labelled. The two alternatives are both wrong — dropping `required` lets a genuinely required
      field submit empty once re-enabled, and setting `disabled` takes back the focusability the
      message exists for. Ported to `Switch` and `CheckboxInput`; `RadioListItem` carries it
      upstream too and is not in this batch
- [ ] **The docs emitter had TWO undeclared fields, not one, and the first hid the second.**
      `assertDeclared` throws on the first undeclared key it meets and aborts the whole run, so
      clearing `deprecatedFor` on `theming.targets[]` simply revealed `replaces` on
      `theming.derived[]` (0.4.1 added it for `ProgressBar`'s mark vars and `TextArea`'s
      `--_textarea-inline-padding`) behind an identical-looking message. Both are now declared in
      `packages/cli/authoring/doctypes/base/type.ts`, verbatim from upstream's own doctype, and in
      the emitter's field sets. Neither is consumed by `astryx theme build` — upstream's CLI does
      not consume them either — so both are documentary in both trees, which is what makes
      declaring them faithful rather than a promise the CLI does not keep. **Read a
      fail-on-first-error gate as a queue, not as a single decision**
- [x] **`NumberInput`'s 0.4.1 rewrite (#4896) — six new StyleX keys that look like function styles
      and are not.** The stepper declarations (`numberSteppers`, `numberStepperButton`,
      `numberStepperButtonDisabled`, `decrementButton`, plus `wrapperWithNumberSteppers` and
      `incrementIcon`) each have exactly one call site with a statically-known combination, so StyleX
      folded four of them into literal class strings and `dist/NumberInput.js` declares only
      `{wrapper, wrapperWithNumberSteppers, incrementIcon}`. The reflex on seeing "declared upstream,
      absent from dist" is a self-retiring **skip**; the right answer here was six more **`inline:`
      entries**, and the difference is whether those classes stay checked or stop being checked.
      **Read `dist/`'s `className:` literals before writing a skip** — `grep -n 'className:'` on the
      compiled file counts the fold sites directly, and it said ten where the old comment claimed
      six. The same rewrite deleted `MozAppearance` and both `::-webkit-*-spin-button` blocks (there
      is no `type="number"` left to grow spinners), removing **5 of the CSS oracle's invented
      rules**; NumberInput went from 10 CSS-oracle mismatches to 0
- [ ] **A consumer's `onwheel` fires here and does not upstream — a divergence Svelte cannot close
      cheaply.** `NumberInput` consumes a focused wheel gesture with `preventDefault()` +
      `stopPropagation()` on a native listener bound to the `<input>`. React delivers a consumer's
      `onWheel` from the **root container** (`wheel` is not in its `nonDelegatedEvents`), so
      upstream's `stopPropagation()` means the root never sees the event and the consumer's handler
      never runs. Svelte binds `onwheel` to the **same element**, where `stopPropagation()` has no
      effect on sibling listeners, so ours runs after every consumed step. `stopImmediatePropagation()`
      would match upstream, but only if our listener is registered first — which depends on Svelte's
      microtask registration order, too fragile a thing to lean on in order to gain the *less* useful
      behaviour. Documented at the prop instead. Generalised: **`stopPropagation` is not portable
      between React and Svelte whenever the consumer's handler arrives through a spread**, because
      the two frameworks attach it at different nodes

## Resolved — (ungrouped preamble)

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

## Retired — (ungrouped preamble)

- [ ] **The 28-name icon registry cannot keep upstream's glyphs distinct in a page template.**
      Templates follow the repo's standing rule — where upstream *imports* Heroicons, substitute a
      registry name and document the map in the file header; where upstream *inlines* SVG paths,
      transcribe them. At component-example scale that is nearly lossless; at page scale it is not.
      `editor` alone maps **24 glyphs onto 28 names**, with seven names carrying two or more; the
      worst reads are `SparklesIcon`→`info` and `LightBulbIcon`→`warning`, which render as status
      glyphs they are not, and `product-detail`'s `PlusIcon` and outline `StarIcon` both landing on
      `check`. Every collision is named in its file's header and every mapping is marked as retiring
      with the registry. The fix is growing the registry, not per-file workarounds
  - Retired by: `@fvilers/heroicons-svelte` now ships as a real dependency and every page template
    (`packages/cli/assets/templates/pages/*`) imports upstream's actual Heroicons directly
    (`Icon icon={SomeHeroIcon}`), replacing the lossy 28-name registry substitution this entry
    described.

- [ ] **`Avatar` and `Button` have no ported test suite**, which is what let their hard-coded `<a>`
      (the `LinkProvider` bypass fixed in batch 17b) go unnoticed for the whole port. Both are
      high-fan-in leaves — `Button` is fan-in 16 — so the absence is felt indirectly through their
      dependents rather than seen. `AvatarStatusDot` (19 upstream cases) and `Citation` (16) are
      missing too.
  - Retired by: `avatar.svelte.test.ts` (555 lines), `button.svelte.test.ts` (533 lines),
    `avatar-status-dot.svelte.test.ts` (261 lines) and `citation.svelte.test.ts` (241 lines) all
    now exist as substantial ported suites.

## Resolved — Fixed, found by porting an example block

- [x] **`VisuallyHidden.as` was narrowed to `'span' | 'div'`; upstream types it `ElementType`.**
      Found porting `VisuallyHiddenStructuralHeading`, whose whole point is `as="h2"` — a heading
      that gives assistive tech a landmark where the layout already makes the grouping obvious to
      sighted users. The port's narrower union made upstream's own documented example a type error,
      so the block could not be transcribed at all. Widened to `keyof HTMLElementTagNameMap`, the
      counterpart `Stack`/`StackItem` already use for the same upstream `ElementType`. Runtime was
      always correct (`<svelte:element this={as}>`); this was a types-only defect, which is why
      nothing rendered wrong and no test caught it. **The lesson generalises: a prop union narrowed
      "to what the docstring mentions" is an invented API when upstream's is open** — worth an
      `astryx-parity` sweep for other hand-narrowed `as`/variant unions
  - Retired by: own title says resolved (whole group is "Fixed, found by porting an example block").

## Retired — Published surface

- [ ] **No public path to the tokens.** Upstream ships `./theme/tokens.stylex` and `./theme/tokens`; ours live at `lib/styles/tokens.stylex.ts` and are exported from no barrel and no subpath. Authoring `stylex.create` against Astryx tokens is the documented consumer pattern _and the property this whole port rests on_, so this is the most consequential single gap in the published surface — and it is not covered by the per-component-subpath item above
  - Retired by: `theme/index.ts` now re-exports `colorVars`/`spacingVars`/`sizeVars`/… (the
    `stylex.create`-authoring vars) from `../styles/tokens.stylex.js`, reachable via
    `@astryx-svelte/core/theme` — the documented consumer pattern (author `stylex.create` against
    Astryx tokens) is achievable today, even though the subpath is `./theme` rather than a
    dedicated `./theme/tokens`.

- [ ] **`exports["."]` has no `default` condition** — every other subpath we ship does. A resolver that doesn't set the `svelte` condition (plain Node, a CLI, a tool consuming the pure-JS `utils`/`hooks`/`naming` re-exports) gets `ERR_PACKAGE_PATH_NOT_EXPORTED` for the package root. publint does not flag it
  - Retired by: `packages/core/package.json`'s `exports["."]` now carries a `"default"` condition
    (`"default": "./dist/index.js"`).

- [ ] **`sideEffects` is narrower than upstream's.** Ours lists `**/*.css`; upstream also lists `**/*.stylex.ts`, `**/*.stylex.js` and `**/componentStyles.ts`. Our `dist/` ships ~118 _uncompiled_ `*.stylex.js` modules for the consumer's StyleX plugin to compile, and upstream marks them side-effectful so a bundler cannot tree-shake a style module and drop its CSS. No concrete drop was reproduced (most are reached through an exported `*Attrs` function), but `styles/tokens.stylex.js` — a `defineVars` declaration module — is the shape most at risk
  - Retired by: `packages/core/package.json`'s `sideEffects` now lists `**/*.stylex.ts` and
    `**/*.stylex.js` alongside `**/*.css`, matching upstream. Only `**/componentStyles.ts` remains
    absent, a pattern that matches no file in this port's `.stylex.ts` naming convention.

## Resolved — Test-infra limits

- [x] **The "waits that starve under load" flake family is fixed — it was contention, not logic.** The suite used to fail on roughly half of full runs, never the same case twice, always passing in isolation; members spanned hover-intent timers (`tooltip.svelte.test.ts` `tooltip is still dismissible after isDefaultOpen`, `hover-card.svelte.test.ts:343`/`:376`, `tooltip-consumers.svelte.test.ts`), starved Playwright actionability waits timing out at 15 s (`breadcrumbs`, `item`, `leaves`, `banner`), and — found while fixing this — a `:popover-open` assertion in `text-area`. That the _symptom_ kept moving was the tell: 82 client files sharing one Chromium starve each other's timers and actionability checks, and whichever file lost the scheduler that run was the one that failed. **Fix: `fileParallelism: false` on both vitest projects** (`packages/core/vite.config.ts`). It is close to free, which is the part worth knowing — parallelism was buying ~20 s of wall clock while paying for it many times over in redundant per-worker setup. Measured over four runs each: parallel ran 68–78 s wall against **358–390 s** summed setup and 89–103 s import, at ~50% failure; serialized runs 89–92 s wall against 33–37 s setup and 4–6 s import. Raise it only with a measurement, and reach for more browser _instances_ (each with its own scheduler) rather than more files per instance, which is what caused this
  - Retired by: own title says resolved ("is fixed").

- [x] **`src/tests/trigger-wiring.ts` closes a second, real race** — independent of load, and worth keeping even though serializing is what actually retired the family. `Tooltip`/`HoverCard` _find_ their trigger rather than rendering it: it is wired by `watchFirstElementChild` in an `$effect`, while showing the layer is a **different** effect. So "the layer mounted" and "the layer showed" are both true strictly before the trigger has any listeners, and a `mouseenter`/`mouseleave` dispatched into an unwired element is dropped permanently — no amount of retrying the assertion afterwards brings it back, which is why those failures were clean full-budget `vi.waitFor` timeouts rather than slow passes. `whenWired()` waits on the `aria-describedby` that `wire()` merges as part of the same call that attaches the listeners. Both suites' `triggerIn()` helpers are now async and go through it, so the precondition cannot be forgotten at a call site
  - Retired by: own title says resolved (checked `[x]`, describes an already-landed permanent fix
    kept for a separate real race — status note, not a standing debt).

- [x] **FIXED — the residual `hover-card` failure (was ~1 run in 13, down from ~1 in 2) was the
      stationary mouse pointer, and the diagnosis recorded here was wrong.** This entry used to say
      the cause was upstream's one-shot `isEscapeDismissing` boolean being consumed by an extra
      `focusin` that popover-hide generates. That reasoning is plausible and **false**: an
      event-trace probe records **exactly one** `TRIGGER focusin` after the Escape in both the
      passing and the failing run, so the flag is consumed once and works as intended. The re-show
      arrives afterwards as a boundary **`mouseenter`** — the pointer, left over the card by a
      previous _test file_, lands on the trigger the moment the card is dismissed and uncovers it.
      Fixed by parking the pointer per file in `setup-stylex.ts`; full write-up, captured traces and
      both retired diagnoses are under Known debts. Nothing about the flag needed hardening, so the
      "would be a behavioural divergence from upstream" worry does not apply either
  - Retired by: own title says resolved ("FIXED"). (A follow-up hardening commit,
    "Stop a failed pointer park from taking down a chunk", made the same pointer-park more robust
    on CI without reopening this diagnosis.)

- [x] **A `userEvent.click` on an `<a href="/">` navigates the test iframe and aborts the whole run — diagnosed 2026-08-03, fixed later as the "iframe-drop" flake.** The mechanism and the harness fix are recorded in full above; what this entry adds is the shape of the _report_, which is what made it hard to see: it surfaces as an **unhandled error, not a failed case**, so the summary reads `45 passed (111)` with nothing marked failed. The policy decision it asked for was taken as written — a suite-wide `click` handler in the setup file, preferred over per-case `href="#…"` values, which would have changed assertions upstream pins (`toHaveAttribute('href', '/settings')`).
  - Retired by: own title says resolved ("fixed later as the 'iframe-drop' flake").

## Retired — Deferred demo blocks / skipped cases (unblock when their component lands)

- [ ] `HoverCardInteractiveContent` demo block — triggers from `<Link>` (now ported); pending authoring
  - Retired by: `docs/src/lib/examples/HoverCard/HoverCardInteractiveContent.svelte` now exists;
    `pnpm -F docs generate` reports 0 examples pending.

- [ ] `Popover` drops 0 of 21 cases but skips 1 (`lets Escape fall through to a host Dialog when fully opted out`) — `Dialog` unported; `it.skip` in `src/tests/popover.svelte.test.ts` preserves the count and unblocks when `Dialog` lands
  - Retired by: `popover.svelte.test.ts`'s own header now reads "23 upstream cases, 23 here…
    Nothing is dropped and nothing is skipped" — the case is written out in full against
    `fixtures/popover-in-dialog.svelte` and passes.

- [ ] `Popover` demo ports 7 of 9 storybook stories; `TokenTrigger` (needs `Token`) is absent rather than substituted. **`FilterPanel` is now unblocked** — `CheckboxInput` landed in batch 4 — and is pending authoring
  - Retired by: `docs/src/lib/examples/Popover/PopoverFilterPanel.svelte` now exists;
    `pnpm -F docs generate` reports 0 examples pending.

- [ ] `FormLayout` demo's `Text` placeholders are **fully unblockable now** — `Selector` landed in batch 6, so the last of `TextInput`/`TextArea`/`Selector` is present; pending authoring
  - Retired by: `docs/src/lib/examples/FormLayout/*.svelte` (Horizontal, HorizontalLabels,
    MixedControls, Nested, Showcase) all now exist; `pnpm -F docs generate` reports 0 examples
    pending.

- [ ] `Lightbox` demo ports 3 of upstream's 4 blocks — `LightboxVideo` is absent because it needs a video asset this repo doesn't ship (the other three reuse the four local data-URI scenes `thumbnail-images.ts` already substitutes for upstream's CDN photos, for the CORS reason documented there). `type: 'video'` is still covered by the test suite
  - Retired by: `docs/src/lib/examples/Lightbox/LightboxVideo.svelte` now exists, using upstream's
    CDN URL directly; `pnpm -F docs generate` reports 0 examples pending.

## Resolved — Deferred demo blocks / skipped cases (unblock when their component lands)

- [x] `InputGroup` is **18 of 18 ported, with no skips left** — closed in batch 12. Six cases had been kept as named `it.skip`s citing the member component they needed; each was restored when that component landed (`NumberInput` batch 5, `Selector`/`Typeahead` batch 6, `MultiSelector` batch 7, and the last two — `DateInput`'s group labelling and its calendar-button/popover semantics — batch 12). The pattern is worth keeping: a skip that names its blocking component retires itself the moment the block clears, where a dropped case would have been forgotten
  - Retired by: own title says resolved ("no skips left — closed in batch 12").

- [x] `Dialog`/`DialogHeader` suites ported case-for-case — `src/tests/dialog.svelte.test.ts` (25/25) and `src/tests/dialog-header.svelte.test.ts` (17/17), client (Chromium) project, reproducing upstream's `showModal`/`close` `vi.fn` mock so the "calls showModal" spies work and modal side effects stay out. **`useImperativeDialog.test.tsx` was dropped in full** while that hook was deferred; **batch 15 restored it** at 5/5 in `src/tests/use-imperative-dialog.svelte.test.ts`, keeping the same per-test mock so it cannot leak into the other suites sharing the browser page. Upstream declares two harnesses (one at module scope, one inside the last case); they differ in two values and fold into one parameterised probe fixture
  - Retired by: own title says resolved (checked `[x]`, status/informational note). Also stale:
    `dialog.svelte.test.ts`'s own header now reads "34 upstream cases, 34 here" and explicitly
    calls the old "25 cases" figure wrong.

- [x] `CodeBlock`'s three upstream suites ported case-for-case with **nothing dropped** — `src/tests/code-block.svelte.test.ts` (13/13, client), `src/tests/code-block-tokenizer.test.ts` (12/12, **server** — the module is pure, so booting Chromium would buy nothing) and `src/tests/code-block-highlight-ranges.svelte.test.ts` (3/3, client — it needs real `Range` objects). Both `syntaxTheme` cases are direct ports, since `theme/syntax/` landed with the component. Two setup translations, neither a case: upstream's `requestAnimationFrame`/`cancelAnimationFrame` stub in `highlightRanges.test.ts` is **not** reproduced (`highlightRanges.ts` calls neither — the stub is vestigial, and faking rAF in a real browser is a live hazard), and the timer case fakes only `setTimeout`/`clearTimeout`, because the default fake set includes `queueMicrotask` and would stall Svelte's mount. Upstream's clipboard stub is kept and matters _more_ here: Chromium implements `navigator.clipboard`, but `writeText` needs a permission grant Playwright does not have
  - Retired by: own title says resolved ("nothing dropped" — checked `[x]`, status/informational note).

## Resolved — `DropdownMenu` — deferred selectable trio + slot translation

- [x] **RETIRED 2026-08-06 — the selectable trio and `DropdownMenuSubMenu` are ported.** The deferral was: the **published dist v0.1.7 did not compile them** (no `menuItemRoles.ts`, no selectable-item classes, `index.d.ts` exporting only `DropdownMenu`/`DropdownMenuItem`), so the class oracle had no dist counterpart to diff against and porting would have been unverifiable. **0.2.0's tarball ships all of it**, and all four modules matched on the first oracle run. This is the second time the "published dist lags source" pattern resolved itself by a pin bump rather than by a workaround — the first being the 14 self-retiring skips at the top of Batch 17. Worth the standing lesson: **re-check a stale-dist deferral at every pin bump before planning around it.** The check is one `ls` of the dist directory and it turned a whole workstream from "next batch" into "already unblocked"
  - Retired by: own title says resolved ("RETIRED 2026-08-06").

## Retired — `DropdownMenu` — deferred selectable trio + slot translation

- [ ] `DropdownMenu`'s trigger `aria-controls` targets the `<Layer>` popover wrapper (which carries `menuId` via `layer.id`), not a dedicated id on the inner `role="menu"` div — upstream mints a _second_ `useId` for the menu div and points `aria-controls` there. Ours is valid ARIA (unique target that wraps the menu) and is **the port's uniform popover convention** (`usePopover` owns the id as the aria-controls target; `Popover`/`HoverCard`/`Tooltip` all wire it at `layer.id`). Restoring upstream's two-id shape would make `DropdownMenu` the only popover component to diverge, so the convention wins. Upstream's own suite doesn't assert the linkage
  - Retired by: `dropdown-menu.svelte` now mints a dedicated `menuId` (`${uid}-menu`) separate from
    `layerId`, and `aria-controls={menuId}` targets the `role="menu"` div directly — matching
    upstream's two-id shape this entry said the port didn't use.

- [ ] **`DropdownMenu.test.tsx` ported case-for-case** — `src/tests/dropdown-menu.svelte.test.ts` (36/36), client (Chromium) project. Upstream's `beforeEach` `showPopover`/`hidePopover`/`:popover-open` stub dropped (Chromium is native; call-based assertions keep upstream's form via `vi.spyOn` calling through). Three cases restated with comments: the two placement cases (browser canonicalises `position-area` token order → sorted-token compare, per `layer.svelte.test.ts`) and case 28 "renders icon + label" (upstream's `not.toHaveAttribute('aria-label')` is unportable — the Button port sets aria-label on `children != null`, having no way to compare an opaque Svelte snippet to the `label` string the way upstream's `children !== label` does; the accessible name is `'Settings'` either way, so the restated case asserts the name + icon). **`DropdownMenuSelectable.test.tsx` is now ported in full** (`src/tests/dropdown-menu-selectable.svelte.test.ts`, 6/6), as is `DropdownMenuSubMenu.test.tsx` (`src/tests/dropdown-menu-sub-menu.svelte.test.ts`, 17/17), both unblocked by the 0.2.0 pin. No checkbox/radio case leaked into `DropdownMenu.test.tsx`, and it has no React ref-callback or `displayName` case, so nothing else is dropped within it
  - Retired by: stale — `dropdown-menu.svelte.test.ts`'s own header now reads "67 of its 77 cases
    (v0.4.1)" and explicitly documents 9 cases DROPPED (menuitemradio/menuitemcheckbox keyboard
    access, #3829) as "a standing coverage debt, not a translation decision" — materially different
    from this entry's "36/36, nothing dropped" claim.

## Retired — Source/doc disagreements we follow (source wins, per the Icon px→rem precedent)

- [ ] `Collapsible` `isDisabled` feature — the prop plus `aria-disabled`/`tabindex="-1"`/`triggerDisabled` dim and the click guard — is in source, `.doc.mjs`, and tests, but the published 0.1.7 dist lags (no `triggerDisabled`, no guard). Followed from source. `triggerDisabled` has no dist class to diff, so the oracle leaves it **uncompared** (no skip needed — a skip is for keys upstream has that we defer; this is the reverse).
  - Retired by: upstream is pinned at 0.4.1 now (was 0.1.7 when written); `dist/Collapsible/Collapsible.js`
    now contains `triggerDisabled`/`isDisabled`, and `compare-upstream-classes.mjs` reports
    "0 skipped, 0 mismatches" — `triggerDisabled` is no longer uncompared, it matches.

- [ ] `Collapsible` `styles.content` typography anchoring (`fontFamily`/`fontSize`/`fontWeight`/`lineHeight`/`color` beyond `paddingBlockStart`) — added upstream by commit #4126 (same batch as Icon's rem #4120), present in source, absent from dist 0.1.7. Followed from source; the oracle records a **self-retiring skip** on `styles.content` that fails the moment a release ships the typography.
  - Retired by: mechanical fact — `ABSENT_UPSTREAM = []` in `compare-upstream-classes.mjs`; the
    skip list is empty, so this self-retiring skip has already self-retired.

## Resolved — Source/doc disagreements we follow (source wins, per the Icon px→rem precedent)

- [x] **RETIRED 2026-08-15 — batch 5's two `NumberInput` doc-vs-source disagreements are now doc-vs-doc agreements**, because #4896 made the docs true rather than the source. `step`'s `@default 1` was called an HTML implicit step the source never assigned; `getEffectiveStep` now assigns it for real, as the fallback for an unset, non-finite, non-positive or (under `isIntegerOnly`) fractional step — and the control is `type="text"`, so there is no native step left to inherit either way. The anatomy entry that listed a `Spinner` for "increment and decrement controls" the source never rendered is now `Number steppers`, and `hasNumberSteppers` renders exactly that. **The standing lesson is the third instance of it**: resolving a doc-vs-source disagreement in source's favour is a bet that the *source* is ahead, and twice now the next release proved the doc was ahead instead. Re-read both halves at every pin bump, as with stale-dist deferrals.
  - Retired by: own title says resolved ("RETIRED 2026-08-15").

## Resolved — `Toast` — slot translation, deferred suite, and replicated upstream quirks

- [x] **`useToast.test.tsx` (4 cases) is restored** in `src/tests/use-toast.svelte.test.ts`, batch 8, when `<Theme>` landed. The mode resolution it tests is `internal/theme-mode.svelte.ts`
  - Retired by: own title says resolved ("is restored" — checked `[x]`, status/informational note).

- [x] **`internal/theme-mode.svelte.ts` is the `mode` half of `useTheme`, and now has all three terms.** `<Theme>` landed in batch 8, so its context is the first, then `<html data-theme>` (upstream's shared refcounted `MutationObserver`), then OS preference — and, as upstream's args-switched no-op store does, a consumer under a `<Theme>` never touches the DOM or joins the observer. It stays in `internal/` rather than `hooks/` because `useTheme` itself is published from `theme/`, where upstream publishes it, and this is its mode half rather than a hook of its own
  - Retired by: own title says resolved ("now has all three terms" — checked `[x]`,
    status/informational note).

- [x] **`LayerProvider` / `LayerContext` landed in batch 9.** `ToastViewport` is "exported for LayerProvider integration" upstream, and `useToast`'s warn/throw strings name `<LayerProvider>`/`<AppShell>`. Half of that is now true: `<LayerProvider>` ships, so the strings name a component a consumer can actually reach. `<AppShell>` is still batch 10, and the strings stay verbatim either way, since they are the upstream contract
  - Retired by: `packages/core/src/lib/components/app-shell/` now exists too — the other half this
    entry tracked as still-pending ("`<AppShell>` is still batch 10") has since landed as well.

## Retired — `Lightbox` — hook/layer split and replicated upstream bugs

- [ ] **Test suite ported** in `src/tests/lightbox.svelte.test.ts` — all 26 of upstream's `it` cases, client (Chromium) project (native `<dialog>` + `useAnnounce`'s real `requestAnimationFrame`). Reuses upstream's `showModal`/`close` `vi.fn` mock, as the `Dialog` suites do, so the "calls showModal" spy works and the top-layer side effects stay out. Two cases changed shape: `forwards ref to dialog element` is an **attachment counterpart** (no `ref` prop in this port), and `does not render caption when not provided` gains a second, discriminating assertion because StyleX hashes the class upstream's `[class*="caption"]` selector looks for. Nothing dropped. Both load-bearing behaviours were mutation-checked: an always-announce effect fails the two silence cases, and unmounting the nav buttons at the range boundary fails all three boundary cases
  - Retired by: stale — `lightbox.svelte.test.ts`'s own header now reads "all 37 cases" (still
    "Nothing is dropped"), not 26; an accomplishment/status note whose count moved on, not a
    standing divergence.

## Retired — Docs site

- [ ] **The docs chrome is _partly_ hand-built — batch 9 retired half of it.** The `⌘K` palette and
      the on-this-page outline now run on the real `CommandPalette` and `Outline`; the seams held
      exactly as designed, and no page changed. What is still hand-built is the **header, sidebar
      and footer**, because `AppShell`/`SideNav`/`TopNav`/`MobileNav` are batch 10. A design system
      whose own docs do not use its navigation is a real weakness, not a neutral staging choice — so
      the remaining half is still a debt, not a resting place
  - Retired by: `docs/src/lib/shell/docs-shell.svelte`'s own header now reads "Batch 10 moved both
    to `AppShell`, which now supplies the side panel, its sticky behaviour, the divider, and —
    below the breakpoint — the mobile drawer that this version had no counterpart for at all."

- [ ] **No mobile drawer.** Below 900px the sidebar stacks above the content rather than collapsing
      into a drawer, and the top nav's links and CTA are CSS-hidden. Correct without JavaScript and
      correct on the server, but it is not what `MobileNav` will do (batch 10)
  - Retired by: `AppShell` now supplies the mobile drawer, per `docs-shell.svelte`'s header comment
    quoted above.

- [ ] **69 of 201 upstream doc entries are undocumented here**, because the components are unported.
      The sidebar is correspondingly shorter than upstream's 200 entries. `coverage.js` carries the
      list, so the gap is measured rather than implied
  - Retired by: `pnpm -F docs generate` now reports "216 documented / 219 upstream", and
    `coverage.js`'s `unported` list holds only 3 names (`Chat`, `Indicator`, `Resizable`) — the
    "69 undocumented" figure is off by roughly 66 and would mislead a reader trusting it today.

## Resolved — Docs site

- [x] **The header carries the real Astryx mark, in Svelte orange.**
      `shell/astryx-logo.svelte` replaces the placeholder rounded square that stood in for a logo.
      Its colour is a **docs-chrome token, `--color-brand: #ff3e00`**, declared in `docs.css`'s
      `product` layer — the same orange the favicon (the Svelte logo) already used, so the site now
      brands consistently. **Deliberately not `--color-accent`:** that token belongs to the theme,
      is byte-matched against upstream by the theme oracle (196/196), and every documented
      component renders from it — recolouring it would make all 406 example previews stop showing
      Astryx's own colours, which is the one thing a fidelity-focused docs site must not do. This
      is also what `docs.css`'s own header rule ("nothing here may restyle a component") exists to
      prevent. If the site should read Svelte-orange _throughout_ rather than only in the chrome,
      that is a deliberate second decision, not an extension of this one
  - Retired by: own title says resolved (checked `[x]`, describes an already-landed change, not a
    standing divergence).

- [x] **Ten example blocks were blocked on unported API, not on effort — and the list is now
      empty.** Every one retired with its blocker, the last five in batch 15:
  - **`useImperativeDialog`** (4) — `Dialog/DialogConfirmationDialog`, `DialogFormDialog`,
    `DialogScrollingContent`, `DialogWithSubtitle`, all driving a second dialog through the
    render-returning hook. **Batch 15.**
  - **`useImperativeAlertDialog`** (1) — `AlertDialog/AlertDialogDeleteConfirmation`, blocked for
    the same reason. `AlertDialogAsyncAction` was _not_ blocked and landed earlier: it uses
    `isInline`. **Batch 15.**
  - **`Table`** (4) — found while porting batch 11 and not previously recorded.
    `Toolbar/ToolbarBulkActions` (also needs `useTableSelection` + `useTableSelectionState`),
    `Toolbar/ToolbarTableFilter`, `Pagination/PaginationPageSize` and
    `Pagination/PaginationWithTable` each render a real `<Table>` beside the component they
    document. Batch 13. The lesson is worth keeping: **a block's blockers are its whole import
    list, not its owning component** — `Toolbar` and `Pagination` are both ported, so nothing in
    the per-component status hinted these four were unreachable.
  - **`SideNav`/`SideNavHeading`** (1) — `NavHeadingMenu/NavHeadingMenuShowcase` builds its menu
    inside them. Batch 10.

  Two of the ten were `isShowcase`, which is why that count used to read "106 of 108". Re-derived
  from the registry rather than carried forward, it is now **140 of 140** — the 108 was stale by
  five batches — and the overall block count is **544 of 544 with nothing pending**, the first
  time this backlog has been empty. What keeps it honest is unchanged: `hasSvelte` in the
  generated registry makes a missing block countable rather than silent, so run
  `pnpm -F docs generate` and read the number instead of predicting it.
  - Retired by: own title says resolved ("the list is now empty" — checked `[x]`).

## Retired — Empty package

- [ ] `packages/cli` — package.json only, no `bin/` or `src/`; `test` is an honest no-op
  - Retired by: `packages/cli` now has `bin/`, `api/`, `authoring/`, `foundation/`, `assets/`,
    `clients/` and a real `test` script (`test:unit -- --run && test:core-src && test:themes-bundle`)
    — not empty, and not a no-op.
