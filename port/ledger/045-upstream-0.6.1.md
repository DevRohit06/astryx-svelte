---
seq: 045
title: Batch 45 — track upstream 0.6.1
upstream: 0.6.1
date: 2026-09-15
units: [pin, doc contract, selector contract, oracle mechanical delta]
upstream-prs: [5177, 5395, 5484, 5547, 5586, 5627, 5671, 5673, 5693, 5713, 5769, 5776, 5822, 5827, 5832, 5928, 6026, 6121, 6126]
---

## Status: gate red at the parity stage, on purpose

`pnpm verify` does **not** pass. The class oracle reports 98 mismatches, down from the 133 the pin
move brought, and every one is explained by an upstream feature this batch did not port. That is
recorded as a debt with a worklist rather than papered over with skips — see "Why the oracle is red
rather than skipped". Everything else is green: `svelte-check` 0 errors, lint clean, all 1,664
server cases passing.

**No release is cut.** The release workflow re-runs the full gate against the tag, so a tag at this
commit could not publish; and the version scheme names the upstream release a version ports, which
would be a claim this tree does not yet support.

## Scope

Four upstream releases land at once: `0.5.3`, `0.5.4` (a two-fix patch), `0.6.0` (breaking) and
`0.6.1`.

`git diff v0.5.2..v0.6.1 -- packages/core/src`: **490 files, +57,639 / −5,193**. No component
directory was deleted or renamed; one was **added** (`ScrollableArea`), the first new component
since `Stepper` at 0.5.0.

What `status.md` measured once the pin moved, and what this batch did about it:

|                                       | Arrived              | Closed here |
| ------------------------------------- | -------------------- | ----------- |
| Class-oracle mismatches               | 133                  | 35          |
| Unported upstream suites              | 43 (507 cases)       | 0           |
| Case shortfall in ported suites       | 1,205                | —           |
| Documented rows core does not declare | 49                   | 4           |
| Missing components                    | 1 (`ScrollableArea`) | 0           |

## The doc contract

0.5.3 (#5713) added structured accessibility requirements and per-theme colour coverage to
component documentation, so upstream's `usage` grew two fields our CLI doctype did not declare.
`emit-core-docs` throws on an undeclared field rather than filtering it — which is the whole point
of that check — so both were ported into `packages/cli/authoring/doctypes/base/type.ts` and
declared in the emitter's key sets. 103 `.doc.mjs` files took the prose delta.

`useResizable` started carrying upstream examples, so it joined the JSX-example deferral list.

## The selector contract (0.6.0 #6121, and 0.6.1 #6126)

**The changelog headline is a trap, and reading the source is what caught it.** The 0.6.0 breaking
note says components stop emitting deprecated bare prop and state classes such as `.primary`,
`.sm` and `.checked`. They did — and 0.6.1 put them back, for a window that closes at 0.7.0. So
`themeProps` is unchanged here; the entire breaking change for this port is `parseStyleKey`.

It now returns data-attribute suffixes: `variant:secondary` becomes `[data-variant="secondary"]`,
`level:1` becomes `[data-level="1"]`, a bare `checked` becomes `[data-checked="checked"]`. Three
details in it are load-bearing and none is cosmetic:

- **The axis survives.** Grid's `align="center"` and `justify="center"` both compiled to `.center`
  before, so a theme could not target one without the other.
- **Only the first colon separates.** `variant:a:b` keeps `a:b`; the old `split` destructure
  silently dropped the rest.
- **The digit-prefix rule is gone.** An attribute value may start with a digit where a class may
  not, so `level:1` is no longer `level-1` and `size:2xs` no longer `size-2xs`.

`toDataAttributeName` became an exported `themeDataAttributeName`, because `parseStyleKey` builds
its attribute name from the same rule now rather than duplicating the transform. It is module-level
only: upstream does not put it on `utils/index.ts`, so neither do we.

**One consequence was not in the changelog and would have shipped silently.** The generated
text/heading colour rules were keyed on the bare value (`primary`), which under the new contract
resolves to `[data-primary="primary"]` — an attribute nothing reflects. Re-keyed onto the `color`
axis, as upstream's `generateColorOverrides` does. The placement divergence it exposed (ours runs
unconditionally inside `defineTheme`, upstream's as a gated step 4, and ours omits `link`) is now a
debt rather than an unremarked gap.

Ported case for case: `utils/parseStyleKey.test.ts`, whose second `describe` upstream folded away
and whose every expectation changed. The escaping case builds its metacharacters from char codes —
a literal backslash is the one thing a shell heredoc silently eats on the way in, and an
expectation that lost its escape would still compile, still lint, and assert the wrong string. That
is the control-character lesson in `CLAUDE.md` reached from the other direction, and it bit twice
while writing `parse-style-key.ts` itself before the bytes were checked with `cat -A`.

## The 0.6.0 removals

`isRtl` on `useListFocus` and `useGridFocus`, and the deprecated `isImeKeyEvent` re-export from the
hooks barrel. Upstream deleted the three cases that drove RTL through the option and now drives it
only through `dir="rtl"` on the container; the two override cases have no counterpart at all and
are named in their files as dropped, with the reason.

The `Resizable` `minSizePx`/`maxSizePx` rename is **not** done, deliberately: 0.6.0 renamed _and_
widened those bounds to a size expression, and the rename alone would hand a consumer following
upstream's docs a type error pointing at the wrong problem. Recorded as a debt; the two halves ship
together.

## Features ported

- **`Heading.weight`** and the upstream `HeadingTypeMap` augmentation seam (#6026), so a theme can
  register a visual role. A registered role has no style group here, so it falls back to the
  level's own sizing rather than indexing the map with a key it does not hold.
- **`autocomplete` on TextInput and TextArea** (0.6.0), under Svelte's spelling as `onkeydown`
  already is.
- **The row-status semantic/custom split** (#5832). `getStatus` may now return `{status, label}`,
  resolved to glyph and tone through the theme, or the custom marker it always took; the two are
  mutually exclusive at the type level, and a dev warning fires if both arrive. A raw CSS colour
  with no `IconColor` counterpart is now spent on the wrapper so the icon inherits it, instead of
  falling back to `primary`.

## Oracle bookkeeping: 133 to 98

Mechanical transcriptions, grouped by the upstream change that explains them:

- **One-liners** — the AppShell `overflow: clip` (#5776), the Carousel RTL-mirrored single-edge
  fades (#5586), the sortable header button mirroring its column alignment (#5928), the
  DropdownMenuItem pressed overlay (#5395).
- **The Button disabled split** (#5627) — `inactive` is the non-interactive treatment and covers a
  _loading_ button; `disabled` is only the dimming, which a loading button must not take, because
  it is busy rather than unavailable. `pressable` narrows its `:active` to exclude both disabled
  states.
- **Family C, the Field stack** (#5673, #5769, #5693) — five modules, one shape. The Field root
  owns a local stacking boundary; the attached status box rides up by a variable computed from the
  rendered control size, which is what keeps a rounded input's corners covered at any radius a
  theme picks; FieldLabel grows the label/description wrapper, and Switch and CheckboxInput drop
  the gap that wrapper now owns.
- **Family D, coarse pointers** (#5177) — the same edit three times. The 24px minimums move into a
  dedicated `inputCoarse` group and the control centres through `rtlStyles.centerInline`.
- **The ToastViewport popover width reset** (#5822) and **the ChatToolCalls semantic status icons**
  (#5671), the latter deleting two spans.

Two oracle-side moves, both self-retiring the way the list requires:

- The `row-status` inline claim for `styles.wrap` is **deleted**. #5832 put a function-style
  argument beside it at its one call site, and one such argument stops the compiler folding the
  whole call — so `wrap` is an object in `dist/` now. The tell was the upstream inline list for
  the file printing empty.
- `field-label` gained two inline entries for the new label-group wrapper, one per arm.

### The spinner overflow was load-bearing in the wrong direction

Worth recording because it is a shape that will recur (#5484, #5827). The `overflow: hidden` was
carried over from a canvas ring the component no longer draws, and it clipped nothing — the painted
circle is inscribed in the box, so hiding and showing the overflow render byte-identical pixels.
What it did was remove the floor under the box: a flex item whose overflow is not `visible` has an
automatic minimum size of **zero**, so a narrow flex host compressed the box while the ring kept
drawing at its own size, and the clip then sliced the ring. Nothing reported a problem, because a
sliced ring still spins. `flex-shrink: 0` states the invariant directly, which a host cannot take
away by setting `min-width: 0`.

The same change sizes the svg from the composed box var rather than the size constant, so a themed
diameter moves ring and frame together, and moves the arc start offset to a CSS rotation about the
circle's own box. That is what lets the `viewBox` go: it needed the centre as a number in user
units, which no themed diameter can supply.

## Why the oracle is red rather than skipped

The skip list exists for a key upstream declares and this port **deliberately** does not. The 98
remaining are keys this port fully intends to declare the moment the feature behind each one
exists — six feature families, traced one by one to the upstream commit that caused them. Writing
98 skips in one pass would be exactly the rot the hygiene rules on that list exist to prevent, and
it would make a partial port read as a finished one on the next `pnpm verify`.

So the number stays visible, `port/status.md` carries it, and `port/todo.md` gets the worklist in
the order that closes the most modules per edit. The debt entry names the retirement condition:
zero mismatches against the `0.6.1` pin.

## What the audits caught

`astryx-parity`, run **before** any code was written, found that 0.6.1 reverted the 0.6.0
bare-class removal. Acting on the changelog alone would have stripped the compatibility classes
from `themeProps`, breaking every consumer stylesheet that still matches them — and diverging from
upstream in the same commit that claimed to follow it.

`astryx-oracle` traced all 133 mismatches to their upstream commits and separated the mechanical
from the feature-shaped. It also corrected two hypotheses this batch started with: the shared
highlight-owner work (#6077) changes **no** `stylex.create` block anywhere and causes none of the
mismatches, and the single `date-time-input` mismatch belongs to the native-picker prop rather than
to that family.

## Rules promoted

- `CLAUDE.md` § Testing — a guard that reads prop names off an object literal must descend into
  spreads; reading top-level properties only turned a conditional spread into a false negative,
  and would be a false **pass** for any axis whose only reflection site is a spread.
- `CLAUDE.md` § Commands — a shell heredoc eats backslashes in both directions; verify the bytes of
  any file written that way with `cat -A` before trusting it.

## Debts opened

- The 0.6.1 pin lands ahead of six upstream feature families
- `useResizable` bounds are pixel numbers where upstream accepts a size expression
- Generated text colour rules are unconditional, and omit `link`
