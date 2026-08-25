---
seq: 035
title: Batch 35 — the Layer dismissal stack
upstream: 0.5.0
date: 2026-08-25
units:
  [layerStack, useLayerDismissal, useTouchTrigger, LayerDepthContext, useLayer, Tooltip, HoverCard]
upstream-prs: [4881]
---

## Scope

The last unit of front 1, and the largest single thing `0.5.0` shipped. It is the reason the four
remaining unported suites are unported, and it blocks four documented-but-undeclared props.

`0.5.0` added roughly nine hundred lines of new source to `Layer/` — `layerStack.ts`,
`useLayerDismissal.ts`, `useTouchTrigger.ts`, an extension to `LayerDepthContext`, wiring in
`useLayer`, and nineteen new barrel exports — and this port has none of it. `touchTrigger` exists
here only as prose in four `.doc.mjs` files.

## Why one stack

Upstream's own header states the problem it solves, and it is worth restating because it is the
thing the port has to preserve. Every overlay used to own its Escape listener, so one press
dismissed every open layer: a popover inside a dialog closed both. Patching that per primitive
produced parallel registries — the focus-trap Escape stack, a drawer LIFO registry, the scroll-lock
counter. The stack is the single registry those collapse into, with one document-level `keydown`
on the **bubble** phase so content inside a layer can claim the press first, and `preventDefault()`
when it does act so the browser's own close-watcher does not dismiss a second layer on the same
press.

This port has exactly the same parallel-registry problem, in the same places, so the collapse is
the point of the batch rather than a side effect of it.

## The prediction this batch has to answer

`port/debts.md` carries an entry, written in batch 033, saying that
`hasActiveFocusTrapEscape` answers correctly here **only** while nothing but a focus trap pushes
onto the stack it reads — and that the day a shared dismissal stack lands and other families join
it, the shim needs its own trap-only count, exactly as upstream's `activeEscapeTrapCount` is. The
four cases in `focus-trap-escape-shim.svelte.test.ts` that must answer `false` are named there as
what will fail.

That day is this batch. The entry is a prediction with a test attached, and here is how it came out.

**It named the right mechanism and the wrong trigger.** Landing the stack breaks nothing on its own,
because the stack is its own registry and the focus trap's private one was untouched by it — the
agent that ported the stack checked exactly this and found the shim's eleven cases still green. What
the entry got right is the part that matters: once the trap is migrated onto the shared stack, the
shim can no longer be allowed to read it. The stack carries tooltips, hover cards and dialogs, none
of which trap focus, and `BottomSheetSwitcher` gates its own dismissal on the shim's answer — so a
shim reading the shared stack would tell the sheet a trap sits above it when none does, and the
sheet would stop closing.

So the migration keeps `activeEscapeTrapCount`, and the reason upstream keeps a counter beside a
registry that already knows what is registered is precisely that. Both are driven by one expression,
`isActive && onEscape != null`, so they cannot disagree about whether a trap is active. The four
cases that must answer `false` still do.

The entry was worth writing, and it was worth writing more carefully than it was: "those four cases
will fail when the stack lands" would have sent someone hunting a failure that never appears, and it
was only ever true of pointing the shim *at* the stack. A prediction about a mechanism should name
the mechanism, not a symptom it happens to expect.

## Units

### The stack itself

`layer-stack.ts` is a transcription rather than a translation — it is module state plus one
listener, and almost nothing about it is React-shaped. The four load-bearing properties were
checked against upstream individually rather than assumed from a passing suite: the listener is on
the **bubble** phase (no capture flag, so content inside a layer can claim the press first), a press
already claimed by content is deferred to via `defaultPrevented`, the stack calls `preventDefault()`
when it does act so the browser's own close-watcher cannot dismiss a second layer on the same press,
and an Escape that cancels an IME composition is **claimed but acted on by nobody** — claiming is
the entire fix, because an unclaimed Escape is what makes the browser raise a close request that
would dismiss the layer through its `cancel` handler on that same press. It reuses this port's
existing `utils/ime.ts` rather than introducing a second predicate.

`useLayerDismissal` drops upstream's three closure refs. Upstream keeps `onDismiss`, `getContainer`
and `isPresent` in refs refreshed by a bare effect; a getter-based `options()` already reads current
values at call time, so there is nothing to refresh. What survives is upstream's dependency list —
`[isRegistered, depth, escapeBehavior]` become three `$derived`s — because that is what keeps
re-registration keyed to a *value* change, and so keeps `seq`'s token keying meaningful.

One case of upstream's twenty-one is dropped, named in the header at its position:
`keeps ordering under StrictMode, which mounts every effect twice`. Svelte has no StrictMode and
never double-invokes an effect, so the setup cannot be written; the invariant it guards is covered
by the two `registration order` cases either side of it, which re-register a layer by flipping
`escapeBehavior` and assert it keeps its place.

### The focus trap joins the stack

This is the part that makes the batch worth doing rather than merely additive, and it is the part
the scoping nearly missed. Upstream's `useFocusTrap.ts` changed by 62 insertions and **111
deletions** at 0.5.0: it deleted its own Escape listener and its own top-most-by-DOM-containment
resolution, and registered on the shared stack instead. This port had transcribed the *deprecation*
of `hasActiveFocusTrapEscape` in batch 033 but not the migration behind it, correctly, because the
stack did not exist yet.

So the same sixty lines are gone here now. What replaces them is one `useLayerDismissal` call and a
single `activeEscapeTrapCount`, and the reason upstream keeps that counter beside a stack that
already knows what is registered is the whole point: the stack is shared, and it carries tooltips,
hover cards and dialogs, none of which trap focus. `hasActiveFocusTrapEscape` has to keep answering
about traps alone, so it reads the counter and never the stack. Both are driven by one expression —
`isActive && onEscape != null` — so they cannot disagree about whether a trap is active.

### `useTouchTrigger`, and four props that were documentation only

`touchTrigger` on `Tooltip`, `HoverCard`, `useTooltip` and `useHoverCard` had been carried as a
known gap for several batches: the props were **documented and undeclared**, existing in this repo
only as prose in four generated `.doc.mjs` files. A grep for the name across `src/lib` returned
nothing but documentation. They are declared now, with upstream's type, default and JSDoc.

The hook itself turned out not to depend on the dismissal stack at all — it imports one module,
`utils/interactionModality`, which this port already had — so it could land beside the stack rather
than behind it.

Two things it deleted are worth recording because they were *this port's* code rather than
upstream's: `useTooltip`'s `window.matchMedia('(hover: none)')` bail in its mouse-enter path, which
is pre-0.5.0 upstream code that upstream itself replaced with the touch-pointer flag; and, in the
same pass, `useHoverCard` gained a `pointerdown` listener its trigger never had.

### The families join — MobileNav, Tooltip, HoverCard

What each family had to give up differs, and that is the interesting part rather than the wiring.

`MobileNav` owned no listener at all: Escape reached it through the native `<dialog>` `cancel`
event. So nothing was deleted; what it gained is a **gate** on that event, because a close request
can arrive with no keydown to inspect — the Android back gesture, the platform close watcher — and
the stack answers those through `shouldDismissOnCloseRequest()`. It is the only one of the three
that consumes the hook's return value.

`useTooltip` gave up a whole document-level `keydown` effect, its `isOpen !== undefined` early
return and its own IME guard. `useHoverCard` gave up more, and more interestingly: a **trigger**
`keydown` listener that called `stopPropagation()` on any Escape while the trigger merely had
focus. That is precisely the choreography upstream's header says the stack exists to delete — a
layer claiming a press it was never entitled to, breaking any layer underneath it.

Both tooltip families pass `isPresent: () => ...matches(':popover-open')` and register for the
hook's whole lifetime rather than keying on `isOpen`. The reason is worth recording because it
inverts the obvious approach: `layer.isOpen` lags the DOM by a frame, and these layers *consume* the
press, so a registration keyed on stale state would eat an Escape meant for a dialog underneath.
Presence is answered from the DOM instead.

Two things landed that the scoping did not ask for and would have lost. `MobileNav` now wraps its
drawer in `<LayerDepthProvider>`, which is how nesting depth reaches the stack. And a real parity
gap surfaced from the *touch* port rather than this one: `useHoverCard`'s content-surface
`mouseenter`/`mouseleave` were missing the touch-pointer early return upstream added alongside
`useTouchTrigger`, so a tap inside the card registered as hovering content and blocked every later
hide.

`Tooltip` reaches upstream's full count with the `controlled` case that 0.5.0 added — and it exists
*because* of this change: a controlled tooltip now stays on the stack and answers Escape by
reporting through `onHide` instead of hiding itself.

### What the scoping missed, and the shape of the remainder

This batch was scoped as "port three new modules plus their suites". That was the visible half. The
invisible half is that a shared registry is worth nothing until the families join it, and joining
them is a change to every overlay in the port rather than an addition beside them.

Upstream has six things registered on the stack: the focus trap, `Dialog`, `Lightbox`, `MobileNav`,
`useTooltip` and `useHoverCard`. After the stack, the dismissal hook, `useTouchTrigger` and the
focus-trap migration had all landed, this port had **one**. Two of the four suites still unported —
`layerDismissalFamilies` and `layerDismissalInvariants` — are precisely the cross-family ones, and
they cannot pass in any meaningful sense against a stack that arbitrates between a single family and
itself. The remaining five migrations are therefore not follow-up work; they are the batch.

The check that caught it was cheap and worth repeating: grep for the hook's name on both sides and
compare the *lists*, not the counts. Two of this port's three matches turned out to be comments
anticipating a migration rather than the migration.

### The cross-family suites, and why they were last

`layerDismissalInvariants` (15) and `layerDismissalFamilies` (11) are the only two suites in the
delta that could not have been ported earlier in any honest form. Their cases are assertions *about
the collapse itself*: a modal-in-modal peels one press at a time and never two; a `Lightbox` over a
required `Dialog` takes the press and only it; a required `Dialog` swallows a press so nothing
behind it dismisses either, but does not block a layer opened on top of it; a browser-initiated
cancel follows the same top-most rule as a keypress. None of that is expressible against per-family
Escape handlers, because with per-family handlers there is no "top-most" to be right or wrong about.

Both were mutation-checked rather than trusted. Making the modal fixture's `onOpenChange` a no-op
breaks ten of the fifteen invariants cases with exact census diffs, which is what proves the
open-dialog census reads state rather than passing against an empty query. Swapping the render order
so the `Lightbox` mounts after the required `Dialog` breaks the eighth families case, which is what
proves the suite is order-sensitive in the way its titles claim.

With them landed, `port/status.md` reports the test delta at **zero**: 268 suites ported, 7 with no
counterpart by design, against upstream's 275. The two `UNPORTED:` markers that had been holding
these suites honestly out of the count are gone, and `grep -rn "UNPORTED:" src/tests/` now returns
nothing at all.

## Oracle bookkeeping

Nothing moved, and for the second batch running that is the finding rather than a null result. This
batch added no `stylex.create` key and changed no style module. Both fidelity oracles were green
before it and are green after, because what changed is which module owns a `keydown` listener — and
no oracle reads listeners. The suites are the only instrument that sees this work at all, which is
the whole reason front 1 is sequenced before the rest.

## What the audits caught

**A batch that was a fifth done when it looked finished.** Three agents reported success and the
stack, the dismissal hook, `useTouchTrigger` and the focus-trap migration were all green — and the
port had **one** family registered where upstream has six. The two files that made it look otherwise
mentioned `useLayerDismissal` in comments anticipating a migration rather than performing one. The
check that caught it costs one command: grep the hook's name on both sides and compare the *lists*,
not the counts.

**A stale IDE snapshot that looked like a broken agent.** Diagnostics reported `Cannot find name
isImeKeyEvent` and `handleKeyDown` in files whose agent had just claimed a clean typecheck. An
independent `svelte-check` returned zero errors: the diagnostics were mid-edit. Verifying was still
right — the cost was one command and the alternative was shipping on an agent's word — but the
lesson is that a stale diagnostic and a real regression are indistinguishable from the outside, and
only re-running the tool settles it.

**A sentence in a file no agent owned.** `use-focus-trap.svelte.ts` claimed "`Dialog` consults it
for the same reason, to defer to a popover layered on top of it." The Dialog migration made that
false and the agent doing it flagged the sentence rather than editing a file outside its ownership.
Upstream had deleted the same consultation for a better reason than redundancy: the shim can only
see layers that trap focus, so it could never order two dialogs correctly. The stack's depth key
can.

## Rules promoted

- `.claude/skills/start-batch/SKILL.md` — cost a shared-mechanism port by who has to **adopt** it,
  not by the size of the mechanism. A registry, a context or a base class is worth nothing until its
  consumers migrate, and the migrations are a change to every consumer rather than an addition
  beside them. Grep the symbol on both sides and compare the lists.

## Debts opened

One: `useTouchTrigger`'s two ref-shaped members have no Svelte spelling. Recorded as
`api-divergence` rather than the `api-shape` first proposed, because `status.mjs` tallies by kind
and a new kind would have been a silent taxonomy change.

Two **retired**: `hasActiveFocusTrapEscape` is built on the trap's own Escape stack (opened in 033,
its retirement condition met here), and — as the entry itself now records — the prediction it
carried named the right mechanism and the wrong trigger.
