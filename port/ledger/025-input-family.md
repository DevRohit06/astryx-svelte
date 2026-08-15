---
batch: 25
title: The input family at 0.4.x
upstream: 0.4.x
units: [TextInput, TextArea, TimeInput, DateInput, DateRangeInput, DateTimeInput, Tokenizer, FileInput, Switch, CheckboxInput, Token, InputClearButton]
upstream-prs: [4876, 4813, 4940, 4974, 4815, 4973, 4745, 4896]
---

## Scope

Ten components in one batch: `TextInput`, `TextArea`, `TimeInput`, `DateInput`, `DateRangeInput`,
`DateTimeInput`, `Tokenizer`, `FileInput`, `Switch`, `CheckboxInput`, plus `Token`'s remove button and
the shared `InputClearButton` they converge on. `NumberInput` and the `Selector` family took the same
changes in parallel and are described in the next file (`026-selector-family.md`), which also carries
the general 0.4.1 infrastructure findings (CI, the client-project port-binding fix, `ThemeConfig.extends`,
the `git checkout --` incident) that `port/ledger/_inbox.md` staged under a second "Batch 11" heading —
none of it is specific to this family or to the selectors, so it is filed with whichever of the two
0.4.x/0.4.1 files sits last, per the task's numbering instruction.

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

## Oracle bookkeeping

The clear-button convergence deleted `text-input`/`time-input`'s stale `inline` claims outright and
deleted (not corrected) the three date inputs' equally-stale ones — adopting `focusOutlineStyles.focusVisible`
composes an imported style, which defeats StyleX's fold, so object mode already covers those keys.

## What the audits caught

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


## Rules promoted

Not promoted at the time.

## Debts opened

-
