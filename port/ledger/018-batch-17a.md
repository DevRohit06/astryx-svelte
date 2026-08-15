---
batch: 18
title: Batch 17a — the 0.2.0 class re-baseline
upstream: 0.2.0
units: [AvatarStatusDot, CodeBlock]
upstream-prs: []
---

## Scope

The breaking changes, the direction API, the 99-site logical-CSS migration, the behavioural RTL units,
the `no-physical-properties` lint rule, and an RTL toggle on the demo routes — the class oracle went
81 → 3 and the theme oracle to 0 across all five themes. `17b` (next file) is the new-surface half of
the 0.2.0 tracking work; `17c` (the file after) is the a11y/themes/docs half.

## Components

### Batch 17a — the 0.2.0 class re-baseline

The class oracle went **81 → 3** and the theme oracle to **0 across all five themes**. Most of it
was mechanical once each mismatch was traced back to upstream's _source_ rather than read off the
atomic-class hashes; four things needed a decision.

**`AvatarStatusDot`'s shape glyph.** 0.2.0 pairs every variant with a distinct shape — filled dot,
ring, minus bar — so status is not conveyed by colour alone (WCAG 1.4.1). Two details are
load-bearing and neither is visible in the class diff:

- **Each variant now sets the ink colour as well as the plate.** The glyph and any user `icon` both
  paint from `currentColor`, so a variant that set only `background-color` would leave them free to
  drift out of contrast. `neutral` _inverts_ — surface plate, secondary stroke — because a hollow
  ring only reads as hollow when its interior is not the variant colour. The old `styles.icon`
  hard-coded `color: --color-background-surface`; that had to go, or it would have overridden the
  variant ink on exactly the variant that inverts.
- **The glyph is a stroked inline SVG, not a CSS box.** Stroking buys sub-pixel control and round
  caps, which is what keeps the mark intentional on the 10px dot where a box cutout can only land on
  whole pixels. `viewBox` is one user unit per px of the dot's _inner field_ (dot minus both
  borders), so every coordinate in the markup is literal px.

A rendered `icon` suppresses the glyph: both are non-colour marks, and overlaying two cutouts in a
10–32px field makes each illegible. Upstream expresses that as `isRenderable(icon)`; a Svelte
`Snippet` is either passed or not, so `icon !== undefined` is the whole test.

**`CodeBlock`'s chevron became a leading disclosure.** It moved from trailing `chevronDown`
(rotate 180° when collapsed) to leading `chevronRight` (rotate 90° when **expanded**), matching
TreeList and Table. The `collapseChevronCollapsed` key is `collapseChevronExpanded` upstream and the
predicate inverts with it — renaming without flipping the condition compiles and looks right in the
collapsed state only. The header's `gap` was dropped in the same change: spacing now comes from the
chevron's own `margin-inline-end`, which the new `chevronReveal` keyframes animate from zero so the
title slides rather than snaps when the control appears.

**Three oracle cases moved from inline to object mode.** `TypeaheadItem`, `SideNavItem` and
`FieldLabel` each took `xstyle` on their `stylex.props` call at 0.2.0. That makes the call dynamic,
so the compiler stops folding it to a literal class string and emits a style object instead — the
oracle then reports _"upstream has no matching call site"_ even though our classes are byte-identical
to the object it did emit. Worth knowing the two failures look nothing alike: a value mismatch prints
both class strings, this prints ours against an unrelated list. Object mode compares upstream's keys,
so it cannot catch a property we declare and upstream does not; that is why `SideNav`'s extra
`border-block-start` had to be fixed in source rather than mode-switched away.

**Three skips, one cause, and it runs the opposite way to the usual one.** Where a `stylex.keyframes`
body translates along the _inline_ axis, the build behind `@astryxdesign/core@0.2.0`'s `dist/` also
emitted a mirrored RTL keyframe plus a second `animation-name` class to select it under
`:is([dir="rtl"] *)`. Our `@stylexjs/babel-plugin@0.19.0` — the version upstream's own repo pins —
emits only the LTR keyframe from byte-identical source. `genConditionalClasses`,
`enableLegacyValueFlipping` and both `styleResolution` modes were tried; none changes it. So the
tarball _leads_ our compiler instead of lagging it, and the standing "follow the source" rule has
nothing to follow. `progress-bar.indeterminateFill` and `layerAnimations.start`/`.end` carry the
skip; `below`/`above` translate on the block axis and are unaffected.

**The theme fix was a cascade bug, not a missing token.** Eleven `.astryx-text.<size>` rules read as
a diff count, but `size` is documented as a font-size override that beats the size implied by
`type` — and its StyleX class lives in `@layer astryx-base` while a theme's per-type rule lives in
the higher `@layer astryx-theme`. Any theme that styled a type silently shadowed `size` for it.
Re-emitting the size classes from the theme generator, at the same specificity and later in source,
is what makes the prop work at all.


## Oracle bookkeeping

Class oracle 81 → 3; theme oracle 0 across all five themes. Three skips, one cause, running the
opposite way to the usual one: our `@stylexjs/babel-plugin@0.19.0` emits only the LTR keyframe from
byte-identical source where `@astryxdesign/core@0.2.0`'s own `dist/` also emits a mirrored RTL
keyframe — the tarball leads our compiler rather than lagging it, so `progress-bar.indeterminateFill`
and `layerAnimations.start`/`.end` carry the skip.

## What the audits caught

Not recorded separately at the time — this file's content is `port/ported.md`'s own narrative; no
inbox group is labelled 17a specifically.

## Rules promoted

Not promoted at the time.

## Debts opened

-
