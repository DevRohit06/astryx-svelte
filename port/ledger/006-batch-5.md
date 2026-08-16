---
seq: 6
title: Batch 5 — divergences, and a spread hazard NumberInput exposed
upstream: 0.1.7
units: [NumberInput, FileInput, CodeBlock]
upstream-prs: []
---

## Scope

`NumberInput`, `FileInput`, `CodeBlock` (+ the `theme/syntax/` subsystem: `defineSyntaxTheme`,
`syntaxThemeStyle`/`syntaxThemeToCSS`, `syntaxTokenDefaults`, the `SyntaxTheme` provider + getter
context + `useSyntaxTheme`, and the 12 community presets).

## Components

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


## Oracle bookkeeping

The six stepper declarations look like function styles and are not — each has one statically-known
call site, so StyleX folded them all into literals and they are `inline:` entries rather than a skip.

## What the audits caught

### Batch 5 — divergences, and a spread hazard NumberInput exposed

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


## Rules promoted

Not promoted at the time.

## Retired debts

The `NumberInput` source/doc disagreements (`step`'s `@default 1`, the anatomy's `Spinner` entry)
recorded against this batch are resolved now that #4896 (the 0.4.1 rewrite, see `025-input-family`)
made the docs true rather than the source.

### Resolved — Source/doc disagreements we follow (source wins, per the Icon px→rem precedent)

- [x] **RETIRED 2026-08-15 — batch 5's two `NumberInput` doc-vs-source disagreements are now doc-vs-doc agreements**, because #4896 made the docs true rather than the source. `step`'s `@default 1` was called an HTML implicit step the source never assigned; `getEffectiveStep` now assigns it for real, as the fallback for an unset, non-finite, non-positive or (under `isIntegerOnly`) fractional step — and the control is `type="text"`, so there is no native step left to inherit either way. The anatomy entry that listed a `Spinner` for "increment and decrement controls" the source never rendered is now `Number steppers`, and `hasNumberSteppers` renders exactly that. **The standing lesson is the third instance of it**: resolving a doc-vs-source disagreement in source's favour is a bet that the *source* is ahead, and twice now the next release proved the doc was ahead instead. Re-read both halves at every pin bump, as with stale-dist deferrals.
  - Retired by: own title says resolved ("RETIRED 2026-08-15").


## Debts opened

-
