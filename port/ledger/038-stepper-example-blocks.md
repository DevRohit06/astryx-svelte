---
seq: 038
title: Batch 38 — the Stepper and Step example blocks
upstream: 0.5.0
date: 2026-08-26
units: [docs/src/lib/examples/Stepper, docs/src/lib/examples/Step]
upstream-prs: []
---

## Scope

The ten block templates upstream's CLI ships for `Stepper` and `Step`, which the docs generator had
been counting as pending. Six carry `exampleFor: 'Stepper'`, four `exampleFor: 'Step'`; none carries
`alsoExampleFor`. Nothing under `packages/core` changed.

## These are ports, not authored content

Worth stating because it is the whole reason the parity rule reaches here. A docs example is not a
demo someone writes for this port — it is a transcription of
`@astryxdesign/cli`'s `assets/templates/blocks/components/<Name>/<Block>.tsx`, resolved by
`exampleFor` in the block's own `.doc.mjs`. `docs/scripts/generate-content.mjs` already counts a
block with no Svelte counterpart as *pending*, which is the only reason this gap was findable at
all — a silently-absent example would have read as complete.

So the check is a diff, not a review. Extracting the user-visible double-quoted strings from both
sides and diffing the sets returns, for all ten files, **only** additions on our side: the `lang="ts"`
attribute and the CSS strings. Upstream writes styles as JSX objects (`style={{width: 680}}`), which
never appear double-quoted there. No prose, label, description or step title differs.

## The `{cond && node}` gate has no faithful `{#if}` translation

`StepperCustomContent` gates each content slot with `{active === N && (…)}`. In React that hands
`Step` a falsy `children` and no slot renders.

Writing `{#if active === N}` inside the `<Step>` tag is the obvious translation and is **wrong**.
A snippet passed by slot is always defined, so every `{#if children}` guard inside the component
stays true regardless of what the snippet renders. Two of them matter here:

- `step.svelte:473` wraps the slot in a div carrying `stepContent`'s `paddingBlockStart`, so every
  inactive step would render an empty 8px box.
- `step.svelte:221` — `hasContentSeg = isVertical && children != null` — is the load-bearing one.
  This block is `orientation="vertical"`, so an always-defined snippet also changes the **connector
  geometry** on every inactive step. That is a layout defect, not a spacing nit, and it would not
  have been visible in a diff of the markup.

The faithful equivalent passes the snippet itself conditionally:
`children={active === 0 ? projectDetailsContent : undefined}`. Recorded in a comment in the file,
and promoted below.

### Transcribing a comment into the tag is safe, and that was checked

`StepIndicator` puts one of upstream's body comments *inside* the `<Step>` tag, beside a
`{#snippet indicator()}`. If an HTML comment materialised a `children` snippet, that placement would
trip the `hasContentSeg` defect above by accident — invisibly, since the markup diff would look
right. Compiling the four shapes says it does not, and the control case shows the probe can tell:

| tag body | `children` passed |
| --- | --- |
| snippet only | no |
| snippet + whitespace | no |
| snippet + comment | no |
| real text (control) | **yes** |

Only real content creates the implicit slot. The convention of transcribing upstream's comments into
the markup is safe wherever a node prop is involved.

## Props and icons: nothing missing, and it is enforced rather than asserted

Every prop the ten blocks use exists in this port, and all four icon names the blocks reference
(`info`, `search`, `wrench`, `check`) are in the built-in `IconName` union and match upstream
**exactly** — nothing was substituted, so no new demo debt.

The part worth keeping is *why that claim is trustworthy*. `Icon`'s prop is typed
`icon: IconName | IconType`, a closed union, and props are checked against core's built `dist/`, so
`pnpm -F docs check` fails on an invented prop or a misspelled icon. The agent mutation-checked
this rather than trusting a fast-looking clean run: adding `bogusPropXyz={1}` to `StepShowcase`
produced `'bogusPropXyz' does not exist in type 'StepProps'`, confirming the new files are genuinely
in the checked graph. A clean `svelte-check` over files it never collected looks identical to a
clean one over files it did.

This is the same shape as batch 037's backspace-in-a-regex: a green result that is green because
nothing ran. Mutation-check the checker whenever a run is suspiciously fast.

## Oracle bookkeeping

None. No `.stylex.ts` module changed.

## What the audits caught

No audit agents were run: the batch adds no component, no props interface, no export and no test.
`astryx-parity`, `astryx-idiom` and `astryx-surface` all read `packages/core`, which this batch does
not touch. The parity question it *does* raise — does the example match upstream's block — is the
string-set diff above, which is a stronger check than any of them would apply here.

## Rules promoted

- `CLAUDE.md` § Conventions — a React node prop gated on state is passed as a conditional snippet,
  never wrapped in `{#if}` inside the tag.

## Debts opened

`-` — none. Every icon resolved, so this batch neither opens a demo debt nor retires one.
