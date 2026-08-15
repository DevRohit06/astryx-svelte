---
batch: 5
title: Batch 4 — divergences, and a shared-primitive fragility Slider exposed
upstream: 0.1.7
units: [CheckboxInput, CheckboxList, CheckboxListItem, Slider]
upstream-prs: []
---

## Scope

`CheckboxInput`, `CheckboxList` (+ `CheckboxListItem` + context), `Slider`.

## Components

- **Batch 4** — `CheckboxInput`, `CheckboxList` (+ `CheckboxListItem` + context), `Slider`:
  - **CheckboxInput** — native `<input type="checkbox">` under an `aria-hidden` box, with the mixed
    state carried _only_ by the DOM `indeterminate` property (no `aria-checked`, which upstream's
    forms-16 comment calls redundant and desync-prone). Controlled with **no** `$bindable()`, unlike
    `Switch`: `'indeterminate'` has no boolean to commit back and `CheckboxListItem` drives `value`
    from the group's array. Rest props land on the `<input>`, not the root — test-pinned. Reads one
    field of `CheckboxListContext` (`hasDisabledMessage`) so a checkbox in a disabled-with-a-reason
    group stays focusable via `aria-disabled`. 32/32 tests
  - **CheckboxList / CheckboxListItem** — `Field` + `List` + a getter context, in two modes:
    _collection_ (the group owns `value[]`, every item needs a `value` or it throws) and
    _standalone_ (each item owns `isChecked`/`onCheck`), which is what the select-all pattern is
    built from — the group computes no tri-state of its own. Upstream's two `useOptimistic` values
    collapse into **one `createOptimistic` over a `{values, toggled}` tuple**, because they revert
    together on one transition and `createOptimistic` has a single override per instance. 43/43 tests
  - **Slider** — single or range on a discriminated union (`value: number | [number, number]`),
    fully controlled, zero effects. Pointer interaction belongs to the track and survives leaving the
    element through pointer capture, so there are no window listeners; `minStepsBetweenThumbs` is read
    through `'minStepsBetweenThumbs' in rest`, upstream's own probe. Compiles to **28 inline call
    sites and no style object at all** — the first pure-`inline` oracle case. 32/32 tests

## Oracle bookkeeping

`Slider` compiles to 28 inline call sites and no style object at all — the first pure-`inline`
oracle case.

## What the audits caught

### Batch 4 — divergences, and a shared-primitive fragility Slider exposed

- [ ] **`CheckboxInput.syncNativeState` restores `.indeterminate` as well as `.checked`** — an upstream bug documented rather than replicated. React's controlled-input restore only knows about `checked` (there is no `indeterminate` prop, which is precisely why upstream needs its `indeterminateRef`), so upstream leaves a _blocked_ click on a mixed checkbox reporting **unchecked** to assistive tech while the painted box still shows the dash. Upstream's own forms-16 comment calls the native property the authoritative mixed-state signal, so the desync contradicts its stated intent. The attachment still reproduces the ref's `[isIndeterminate]` keying exactly; only the hand re-assert diverges
- [x] **The value-less-`CheckboxListItem` throw now fires per render, as upstream's does.** It was an init-time statement, so a `CheckboxList` that started standalone and _later_ gained a `value` array would render its value-less children as dead interactive rows instead of throwing. Moved into the `resolvedChecked` `$derived`, which the template reads on every render (and on the server, where a `$derived` is evaluated on first read) — that is what makes the timing match. Mutation-checked: removing the guard fails `throws when item has no value prop inside collection-mode CheckboxList`
- [x] **`useLayer.attachTrigger` repairs its own `anchor-name`.** It lives in the trigger's _inline style_, and the trigger belongs to a caller's template; Svelte applies a changed `style` **attribute** by assigning `cssText`, replacing the whole block and taking the anchor name with it — after which `position-anchor` names nothing, `position-area` computes to `none` and the popover pins to the viewport corner, permanently, since nothing re-runs the attachment. React never hits it (style _objects_, written per-property) and upstream's ref re-runs after every commit anyway, which doubles as a repair pass. Now a `MutationObserver` on `style`, with a membership check that stops it looping on its own write. `Slider`'s thumb also uses `style:` directives (per-property `setProperty`), which sidesteps the rewrite entirely rather than relying on the repair
- [x] **The `aria-describedby` merge is one shared, self-repairing internal.** `Tooltip` and `HoverCard` both describe a trigger they _found_ rather than rendered, and both had a one-shot write: any caller rewriting the attribute dropped the appended layer id, silently, for good (`Slider` recomposes its thumb's from `description`/`status`). Upstream re-merges after every commit for free — its layout effect is keyed on a ref whose identity churns every render because `useLayer` returns a bare object literal. Both now go through `internal/described-by.ts`, which observes the one attribute and re-appends; upstream inlines the same body in two layout effects, so one internal is the honest shape, as with `first-element-child.svelte.ts`
- [ ] **`Slider`'s `onChange` parameter is not contextually typed at call sites.** `SliderProps` is a discriminated union on `value`, and TS will not resolve which arm applies when checking a Svelte props object, so `onChange={(v) => …}` infers `v` as `any` under `noImplicitAny` and needs an annotation (`(v: number)` / `(v: [number, number])`). Upstream's TSX discriminates fine. The demo route annotates; a consumer must too. Fixable only by making the component generic, which would invent a type shape upstream does not have
- [ ] **`Slider`'s hidden inputs carry `value` as a property with the attribute stripped** (Svelte's `remove_input_defaults`). `FormData` reads the property, so submission is correct and all three form-participation cases pass — but a native `<form>` reset would clear them where React's would restore the submitted value


## Rules promoted

Not promoted at the time.

## Debts opened

-
