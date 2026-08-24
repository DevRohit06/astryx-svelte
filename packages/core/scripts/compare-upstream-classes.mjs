/**
 * Component class-parity oracle.
 *
 * The port's central claim is that authoring `stylex.create` against the same
 * token references upstream uses makes the compiler emit byte-identical atomic
 * CSS. This checks that claim against the ground truth: `@astryxdesign/core`
 * ships its StyleX already compiled, so its `dist/**.js` literally contains the
 * class names React renders.
 *
 * We run the same Babel plugin over our sources and diff the emitted classes,
 * keyed by StyleX's property hash. Names on either side are irrelevant — only
 * the (property, class) pairs have to agree, which is what lets our files be
 * laid out and named differently from upstream's.
 *
 * Usage: node scripts/compare-upstream-classes.mjs
 */

import { parseSync, transformAsync } from '@babel/core';
import styleXPlugin from '@stylexjs/babel-plugin';
import typescriptSyntax from '@babel/plugin-syntax-typescript';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstream = path.join(root, 'node_modules/@astryxdesign/core/dist');

// The ground truth is a devDependency. An install that pruned it would leave
// this script with nothing to compare against — so say so, rather than failing
// later with an ENOENT that reads like a missing source file of our own.
if (!existsSync(upstream)) {
	console.error(
		`@astryxdesign/core is not installed at ${upstream}.\n` +
			'It is a devDependency and the oracle has nothing to compare against without it.\n' +
			'Install without --prod / NODE_ENV=production.'
	);
	process.exit(1);
}

/**
 * **What this oracle does NOT check: `stylex.create` function styles.**
 *
 * A dynamic style — `dot: (color) => ({backgroundColor: color, …})` — compiles
 * to an *arrow function* value, not to a `{propHash: "class", $$css: true}`
 * object, so `extractGroups` skips it on both sides (it requires `$$css`, for
 * the `STATUS_CONFIG` reason documented there). Its hoisted static half lands in
 * a `_temp` const whose properties are bare strings rather than style objects,
 * which the same test also skips. Neither half is diffed.
 *
 * As of 2026-08-07 that is **54 function styles across 32 modules** — Slider's
 * track fills, Tree's `indent`, `rowStatus`'s `dot`, every `--_var` carrier. A
 * clean run therefore means "every *static* style matches", which is a narrower
 * claim than the report's wording suggests, and the reason it is stated here
 * rather than left to be re-derived. Recorded under Known debts in port/debts.md with
 * what closing it would take.
 *
 * Each entry maps one of our style modules to the upstream module holding the
 * same `stylex.create` calls.
 *
 * `rename` maps an upstream group name to ours where the two differ. `skip`
 * excuses a group (`groupStyles`) or a single style (`styles.ariaDisabled`)
 * that upstream declares and we deliberately do not — every entry needs a
 * reason, so the deferrals stay legible instead of accumulating silently.
 *
 * `inline` covers modules where every style is applied at exactly one call
 * site: StyleX resolves those at compile time and writes the finished class
 * string straight into the JSX, so there is no style object left to diff. Each
 * entry names the keys one call site combines, **in the order it combines
 * them**, and the check is that merging them our side produces the same class
 * set as the string upstream emitted.
 *
 * `inlineSkip` is `skip` for an inline call site — the published tarball can lag
 * upstream's source, and an inline site has no group/key name to hang a `skip`
 * on. Each entry names the same `keys` as its `inline` entry, the exact upstream
 * class string it excuses, and why. It is self-retiring twice over: the run
 * fails if our combination *starts* matching upstream, and it fails if the
 * excused string disappears from `dist/` (which is what a release catching up
 * looks like).
 */
/** Pseudo-key for `stylex.defaultMarker()` in an `inline` combination. */
const BUILTIN_DEFAULT_MARKER = 'stylex.defaultMarker()';

/*
 * THE SKIP LIST IS EMPTY, and the way the last three went is worth recording
 * because it is the strongest case yet for how a deferral must be written.
 *
 * Against 0.2.0 this file carried an `RTL_KEYFRAME_SKIP` used three times
 * (`layerAnimations.start`/`.end`, `progress-bar`'s `styles.indeterminateFill`).
 * It read: where a `stylex.keyframes` body translates along the inline axis, the
 * build behind upstream's `dist/` also emitted a *mirrored* RTL keyframe and a
 * second `animation-name` class selecting it under `:is([dir="rtl"] *)`, while
 * our `@stylexjs/babel-plugin@0.19.0` — the same version upstream's repo pins —
 * emitted only the LTR keyframe from byte-identical source. It was filed as "the
 * one place the published tarball *leads* our compiler", a compiler difference
 * no source change could close.
 *
 * That diagnosis was right about the symptom and wrong about the cause being
 * permanent. Upstream's 0.3.0 RTL phase 4c stopped relying on the compiler too:
 * it now DECLARES `enterEndRtl` / `enterStartRtl` / `indeterminateSlideRtl`
 * explicitly and selects them with `':is([dir="rtl"] *)'`. Porting those three
 * declarations made both sides emit the same classes from the same source, and
 * all three skips reported themselves stale on the very next run without anyone
 * going looking for them.
 *
 * The rule that earned: a deferral written so that it FAILS when it stops
 * applying costs nothing to keep and retires itself. This list has now gone
 * 18 → 0 (batch 17a) and 3 → 0 (batch 18a) that way, and not once has a stale
 * excuse had to be hunted down by review.
 */

const CASES = [
	{
		// The shared focus ring, new at upstream 0.4.1. It sits first because every
		// other case now depends on it: the ring used to be written out per
		// component, and consolidating it here is what moved the drifted offsets.
		//
		// **Object mode only, and that is the whole module.** All four keys
		// (`focusVisible`, `focusWithin`, `publishFocusVisibleVars`,
		// `focusWithinOrPublished`) are handed to `stylex.props` through the
		// `makeFocusOutlineProps` closure rather than applied at a literal call
		// site, so the compiler folds none of them and upstream's `dist/` carries
		// the finished object. Nothing is left over to claim inline.
		//
		// The group keeps upstream's `focusOutlineStyles` name, so the diff needs
		// no rename — only the filename differs (kebab-case, per this port).
		file: 'src/lib/utils/focus-outline.stylex.js',
		upstreamFile: 'utils/focusOutline.stylex.js'
	},
	{
		// The indicator layer, new at upstream 0.4.0. Three components draw the
		// stateful control visuals — the checkbox box, the radio circle, the mark
		// on a chosen option — that CheckboxInput, RadioListItem and the selection
		// components used to draw themselves.
		//
		// Upstream keeps its styles in the component file, so `dist/` folds every
		// static call site into a literal string and keeps as an object only what
		// a runtime merge touches. Both modes therefore apply, and the size ramps
		// are indexed by a `size` prop, which defeats the fold outright.
		//
		// `unchecked`/`checked`/`disabled`/`disabledUnchecked` embed
		// `when.ancestor(':hover', indicatorScope)`. A `defineMarker()`'s class is
		// derived from its module's path and cannot match upstream's by name, so
		// those keys diff as **marker-normalised CSS** — the same fallback the
		// Switch, RadioList and OverlayScrim marker paths already use. The marker
		// module holds only the marker, so it rides here rather than as a
		// standalone case that would compare nothing.
		file: 'src/lib/components/indicator/checkbox-indicator.stylex.js',
		upstreamFile: 'Indicator/CheckboxIndicator.js',
		marker: {
			file: 'src/lib/components/indicator/indicator.markers.stylex.js',
			upstreamFile: 'Indicator/indicator.markers.stylex.js',
			name: 'indicatorScope'
		}
	},
	{
		// Same shape as CheckboxIndicator above, one family down: no partial
		// state, so no `indeterminateMark` pair, and the chrome is a circle with
		// an inner dot instead of a box with a tick.
		file: 'src/lib/components/indicator/radio-indicator.stylex.js',
		upstreamFile: 'Indicator/RadioIndicator.js',
		marker: {
			file: 'src/lib/components/indicator/indicator.markers.stylex.js',
			upstreamFile: 'Indicator/indicator.markers.stylex.js',
			name: 'indicatorScope'
		}
	},
	{
		// The default single-selection mark renders no chrome — it IS the glyph,
		// an `<Icon>` — so the only styles here are the children slot that stands
		// where the glyph would and the two foreground colours it carries. No
		// marker: this indicator reads no ancestor state, because a listbox row
		// that marks selection takes focus itself.
		file: 'src/lib/components/indicator/check-indicator.stylex.js',
		upstreamFile: 'Indicator/CheckIndicator.js'
	},
	{
		file: 'src/lib/components/text/text.stylex.js',
		upstreamFile: 'Text/text.stylex.js'
	},
	{
		file: 'src/lib/components/code/code.stylex.js',
		upstreamFile: 'Code/Code.js'
	},
	{
		// Both modes. Object mode covers `styles.root` alone — it reaches
		// `stylex.props(styles.root, xstyle)` beside the spread, so the compiler could
		// not fold it. This case was **object-mode-only**, which quietly meant
		// `styles.cite` was checked by nothing: the `<cite>` is a lone static call
		// site upstream folded into a literal string, and object mode has no
		// counterpart to diff a folded string against. Claiming it also turns the
		// leftover check on for this module, and upstream has no string left over.
		file: 'src/lib/components/blockquote/blockquote.stylex.js',
		upstreamFile: 'Blockquote/Blockquote.js',
		inline: [['styles.cite']]
	},
	{
		// Both modes. Object mode covers `styles.wrapper` alone (the `xstyle` spread).
		// **Object-mode-only until now**, so `styles.kbd` — the whole keycap surface,
		// seventeen classes of it — was unchecked: upstream folded the per-key `<kbd>`
		// into one literal string and `dist/` declares no object for it.
		file: 'src/lib/components/kbd/kbd.stylex.js',
		upstreamFile: 'Kbd/Kbd.js',
		inline: [['styles.kbd']]
	},
	{
		// Both modes. Object mode covers what `dist/` still declares —
		// `styles` (base/pressable/disabled/ariaDisabled/iconOnly/iconWrapper/
		// contentWrapper/link), the size, icon-size, elevation, variant and group
		// ramps, and `loadingStyles`' two content-hiding keys — all of which ride the
		// button's one runtime `stylex.props` beside `dynamicStyles.width` and an
		// `xstyle` spread.
		//
		// **This case was object-mode-only**, and four keys were therefore checked by
		// nothing at all: they appear in no `dist/` object because each reaches a lone
		// static call site the compiler folded. The spinner overlay is a two-entry
		// lookup table keyed by `!!delaySpinner << 0` (`spinnerDelayed` adds the
		// fade-in animation and shares `hiddenContentDelayed`'s delay pair, so it
		// joins rather than replaces), and the label and end-content spans are one
		// literal each.
		file: 'src/lib/components/button/button.stylex.js',
		upstreamFile: 'Button/Button.js',
		inline: [
			['loadingStyles.spinnerOverlay'],
			['loadingStyles.spinnerOverlay', 'loadingStyles.spinnerDelayed'],
			['styles.labelText'],
			['styles.endContentWrapper']
		]
	},
	{
		// Upstream declares these in the component file rather than a style module,
		// and keeps the group's name `styles`, so ours needs no rename. Object mode:
		// both keys reach `stylex.props` alongside a conditional and an `xstyle`
		// spread, so the compiler could not resolve the merge and left the object
		// live in `dist/`. The connected look itself is the *children's* job and is
		// checked over in `button.stylex.js` under `groupStyles`.
		file: 'src/lib/components/button-group/button-group.stylex.js',
		upstreamFile: 'ButtonGroup/ButtonGroup.js'
	},
	{
		// Object mode covers `styles.wrapper`, `styles.spinner`, `styles.circle` and
		// the whole of `arcStyles` / `trackStyles`. The first two ride runtime
		// `stylex.props` calls with an `xstyle` spread beside them; the last three
		// are **new at upstream 0.5.0**, where the canvas ring became two SVG
		// `<circle>`s whose paint comes off the cascade. Each circle merges
		// `styles.circle` with a `shade`-indexed key from one of the two ramps, and
		// a dynamic index defeats the fold, so `dist/` keeps all three objects.
		//
		// `styles.ring` (upstream's `styles.canvas` through 0.4.5) folds to a
		// literal upstream, and claiming it is what
		// **found a real style defect that had been live since the case was
		// written**. The case was object-mode only, so the key was checked by
		// nothing; the first run that claimed it failed on one property:
		//
		//   property  animation-name (kKVMdj)
		//   upstream  x1ka1v4i  → @keyframes xqng64z-B{0%{…}100%{…}}
		//   ours      x1aerksh  → @keyframes x1wc8ddo-B{from{…}to{…}}
		//
		// Every other class in the string agreed. **StyleX hashes a
		// `stylex.keyframes` body verbatim**, so `from`/`to` and `0%`/`100%` are two
		// different keyframes to the compiler even though CSS treats them as the
		// same — the animation looked right, and our stylesheet carried a keyframe
		// upstream's did not. Upstream's source and its published `dist/` agreed
		// with each other, so this was ours to fix, not a lag. `rotation` now
		// writes `'0%'`/`'100%'` and the key is checked.
		file: 'src/lib/components/spinner/spinner.stylex.js',
		upstreamFile: 'Spinner/Spinner.js',
		inline: [['styles.ring']]
	},
	{
		file: 'src/lib/components/visually-hidden/visually-hidden.stylex.js',
		upstreamFile: 'VisuallyHidden/VisuallyHidden.js',
		// One style, one call site, so upstream's `dist/` carries the finished
		// class string and no style object. This case had been declared in object
		// mode and so compared nothing at all until the empty-case guard below
		// caught it.
		inline: [['styles.visuallyHidden']]
	},
	{
		// Both modes. Object mode covers `baseStyles`, `lineStyles` and
		// `fullBleedStyles` — the root picks its orientation and full-bleed keys by
		// conditional beside an `xstyle` spread, and the two rules index
		// `lineStyles[variant]` dynamically, so the compiler could fold none of them.
		//
		// **Object-mode-only until now, and `labelStyles` has no object in `dist/` at
		// all**, so the whole group was checked by nothing: the label div is a
		// two-entry lookup table keyed by `!!!isHorizontal << 0`, and `verticalLabel`
		// narrows `paddingInline` to 0 while adding `paddingBlock`, so the vertical
		// branch *replaces* the label's `x2lah0s`-mate rather than joining it.
		file: 'src/lib/components/divider/divider.stylex.js',
		upstreamFile: 'Divider/Divider.js',
		inline: [['labelStyles.label'], ['labelStyles.label', 'labelStyles.verticalLabel']]
	},
	{
		// Both modes. Object mode covers `styles.container` and `styles.ellipse` —
		// the wrapper merges the `shape === 'ellipse'` conditional with an `xstyle`
		// spread, so neither folded.
		//
		// **Object-mode-only until now**, so `child`/`childCenter` were unchecked:
		// the inner div is a two-entry lookup table keyed by
		// `!!(fit === 'center') << 0` that `dist/` carries as literals, with nothing
		// for object mode to compare them against.
		file: 'src/lib/components/aspect-ratio/aspect-ratio.stylex.js',
		upstreamFile: 'AspectRatio/AspectRatio.js',
		inline: [['styles.child'], ['styles.child', 'styles.childCenter']]
	},
	{
		file: 'src/lib/components/center/center.stylex.js',
		upstreamFile: 'Center/Center.js'
	},
	{
		file: 'src/lib/components/grid/grid.stylex.js',
		upstreamFile: 'Grid/Grid.js'
	},
	{
		file: 'src/lib/components/grid/grid-span.stylex.js',
		upstreamFile: 'Grid/GridSpan.js'
	},
	{
		file: 'src/lib/components/stack/stack.stylex.js',
		upstreamFile: 'Stack/stack.stylex.js'
	},
	{
		// Upstream keeps the container's own `overflow: auto` beside the component
		// rather than in its style module; ours lives with the rest of Stack.
		file: 'src/lib/components/stack/stack.stylex.js',
		upstreamFile: 'Stack/Stack.js'
	},
	{
		file: 'src/lib/components/stack/stack-item.stylex.js',
		upstreamFile: 'Stack/stackItem.stylex.js'
	},
	{
		file: 'src/lib/components/stack/stack-item.stylex.js',
		upstreamFile: 'Stack/StackItem.js'
	},
	{
		file: 'src/lib/components/badge/badge.stylex.js',
		upstreamFile: 'Badge/Badge.js'
	},
	{
		file: 'src/lib/components/skeleton/skeleton.stylex.js',
		upstreamFile: 'Skeleton/Skeleton.js'
	},
	{
		file: 'src/lib/components/status-dot/status-dot.stylex.js',
		upstreamFile: 'StatusDot/StatusDot.js'
	},
	{
		// The RTL keyframe skip RETIRED at upstream 0.3.0 (phase 4c), same cause as
		// the two on `layer-animations`: we were relying on StyleX to mirror the
		// keyframe automatically and it did not. Upstream now declares
		// `indeterminateSlideRtl` explicitly and selects it with
		// `':is([dir="rtl"] *)'`, so both sides emit the same class from the same
		// source. That took the whole skip list to zero.
		// Both modes, and the `inline` list is an ADDITION that *increases* coverage
		// rather than a repair. This case was object-mode only, which quietly meant
		// `styles.track` was checked by nothing: upstream's `dist/` keeps only
		// `container`, `fill` and `indeterminateFill` as objects and folds `header`,
		// the label pair and `track` into literal strings, so object mode had no
		// counterpart to diff them against and reported nothing.
		//
		// Listing them turns the leftover check on for this module too, so the list
		// has to be complete — all nine folded sites are claimed and upstream has no
		// string left over.
		//
		// `styles.mark` was the tenth from 0.3.0 and is claimed by NEITHER list as of
		// 0.4.1 (#4970/#4741) — object mode picks it up instead. The tick's colour
		// became a runtime choice between `markOnFillStyles[fillVariant]`,
		// `markOnTrackStyles.trackDisabled` and `markOnTrackStyles.track`, which
		// defeats the fold, so upstream's `dist/` keeps `mark` and both new colour
		// groups as live objects and emits no literal string for the tick. Dropping
		// the inline entry is what keeps the leftover check honest: a claim with no
		// upstream call site to match is itself a mismatch.
		file: 'src/lib/components/progress-bar/progress-bar.stylex.js',
		upstreamFile: 'ProgressBar/ProgressBar.js',
		inline: [
			['styles.header'],
			['styles.label'],
			['styles.label', 'styles.visuallyHidden'],
			['styles.label', 'styles.labelDisabled'],
			['styles.label', 'styles.visuallyHidden', 'styles.labelDisabled'],
			['styles.valueLabel'],
			['styles.valueLabel', 'styles.valueLabelDisabled'],
			['styles.track'],
			['styles.track', 'styles.trackClipped']
		]
	},
	{
		file: 'src/lib/components/card/card.stylex.js',
		upstreamFile: 'Card/Card.js'
	},
	{
		// Object mode. Upstream declares Section's styles inline in the component
		// file rather than a style module, and keeps the group names
		// `variantStyles`/`nestedStyles`/`dividerStyles`, so ours need no rename.
		// Each of those groups is applied at `stylex.props` alongside conditionals
		// (the `dividers?.includes(...)` guards, the padding cascade) and the
		// dynamic `sizing` function, so the compiler could not fold the merge and
		// left the objects live in `dist/`. `dynamicStyles.sizing` compiles to a
		// function on both sides, so neither extractor sees it and there is nothing
		// to diff for it — exactly as Card and Dialog exclude their own sizing.
		file: 'src/lib/components/section/section.stylex.js',
		upstreamFile: 'Section/Section.js'
	},
	{
		file: 'src/lib/components/avatar/avatar.stylex.js',
		upstreamFile: 'Avatar/Avatar.js',
		// `image`, the icon plate's bare `fallback`, and — as of 0.4.2, which moved
		// the size off it onto the wrapper (#5030) — `content` are each applied at
		// one call site with no dynamic style beside them, so the compiler resolved
		// them and left no object entry behind.
		inline: [['styles.image'], ['styles.fallback'], ['styles.content']]
	},
	{
		file: 'src/lib/components/avatar/avatar-status-dot.stylex.js',
		upstreamFile: 'Avatar/AvatarStatusDot.js'
	},
	{
		file: 'src/lib/components/avatar-group/avatar-group.stylex.js',
		upstreamFile: 'AvatarGroup/AvatarGroup.js'
	},
	{
		file: 'src/lib/components/avatar-group/avatar-group-overflow.stylex.js',
		upstreamFile: 'AvatarGroup/AvatarGroupOverflow.js'
	},
	{
		file: 'src/lib/components/icon/icon.stylex.js',
		upstreamFile: 'Icon/Icon.js'
		// The px→rem move landed in the published dist at 0.2.0, so the eight
		// skips that carried it are gone. They retired themselves: each reported
		// "now matches upstream — delete the skip" on the first run against the
		// new pin, which is the whole point of writing a deferral so that it
		// fails when it stops applying.
	},
	{
		// 0.3.0 SPLIT this into two modules, and the split is upstream's own file
		// layout rather than a porting choice — the batch-12 rule about where
		// upstream keeps its styles deciding the oracle mode, applied to a module
		// that did not exist before.
		//
		// `Timestamp.js` now emits exactly ONE inline site. The old read-only
		// tooltip became a copyable hover card in its own component, so
		// `tooltipLines` / `tooltipLabel` / `tooltipValue` moved there and
		// `focusable` — the focus ring — was deleted outright (upstream's reasoning
		// and the a11y regression it introduced are under Known debts).
		file: 'src/lib/components/timestamp/timestamp.stylex.js',
		upstreamFile: 'Timestamp/Timestamp.js',
		inline: [['styles.time']]
	},
	{
		// The card is BOTH modes. `styles.dl` and all four `gridTemplates` combine
		// at runtime (the trailing action column is only reserved when some row is
		// copyable), so `dist/` keeps them as objects and the diff walks them; the
		// four row parts each reach exactly one call site and fold to literals.
		file: 'src/lib/components/timestamp/timestamp-hover-card.stylex.js',
		upstreamFile: 'Timestamp/TimestampHoverCard.js',
		inline: [['styles.row'], ['styles.label'], ['styles.value'], ['styles.action']]
	},
	{
		file: 'src/lib/components/layer/layer.stylex.js',
		upstreamFile: 'Layer/useLayer.js'
	},
	{
		file: 'src/lib/components/tooltip/use-tooltip.stylex.js',
		upstreamFile: 'Tooltip/useTooltip.js',
		// The padding wrapper `renderTooltip` puts around its children is applied
		// at that one call site, so the compiler resolved it and left no object
		// entry behind.
		inline: [['styles.content']]
	},
	{
		file: 'src/lib/components/tooltip/tooltip.stylex.js',
		upstreamFile: 'Tooltip/Tooltip.js',
		// Every one of Tooltip's own styles is applied at a single call site, so
		// upstream's `dist/` carries no style object at all — only the three
		// finished class strings.
		inline: [
			['styles.wrapperContents'],
			['styles.wrapperInline'],
			['styles.wrapperInline', 'styles.hoverIndication']
		]
	},
	{
		file: 'src/lib/components/hover-card/use-hover-card.stylex.js',
		upstreamFile: 'HoverCard/useHoverCard.js',
		// Both modes at once. The container and the two margin variants are the
		// pair `popoverXstyle` memoises and hands to `useLayer`, so they survive in
		// upstream's `dist/` as an object; `content` — the padding wrapper
		// `renderHoverCard` puts around its children — is applied at one call site
		// and was resolved into a literal class string.
		inline: [['styles.content']]
	},
	{
		file: 'src/lib/components/hover-card/hover-card.stylex.js',
		upstreamFile: 'HoverCard/HoverCard.js',
		// As with Tooltip, every one of HoverCard's trigger-wrapper styles is
		// applied at a single call site, so upstream's `dist/` carries no style
		// object at all — only the three finished class strings. They read like
		// Tooltip's three but are not: `hoverIndication` takes its underline offset
		// from `spacingVars['--spacing-0-5']` where Tooltip writes a literal `2px`,
		// and StyleX hashes the reference rather than the resolved value, so the
		// two must land on different classes.
		inline: [
			['styles.wrapperContents'],
			['styles.wrapperInline'],
			['styles.wrapperInline', 'styles.hoverIndication']
		]
	},
	{
		file: 'src/lib/components/popover/popover.stylex.js',
		upstreamFile: 'Popover/Popover.js',
		// Both modes at once, and for the reason `xstyle` always creates: the row
		// hands `[popoverXstyle, styles.gap, layerAnimations[placement]]` to
		// `layer.render` and `stylex.props(styles.contentPadding, xstyle)` beside a
		// spread, so upstream's `dist/` keeps `contentPadding`, `gap` and
		// `matchTrigger` as objects. `customWidth` compiles to a function on both
		// sides, so neither extractor sees it and there is nothing to diff for it.
		// `anchorWrapper` is applied at its one call site — the automatic-mode
		// wrapper div — so the compiler resolved it into a literal class string.
		inline: [['styles.anchorWrapper']]
	},
	{
		file: 'src/lib/components/popover/use-popover.stylex.js',
		upstreamFile: 'Popover/usePopover.js'
		// Object mode only as of upstream 0.3.0. `surface` and `contentWrapper` reach
		// `stylex.props` beside the hook's `xstyle` option, so upstream's `dist/` has
		// always kept them as objects.
		//
		// `closeButtonWrapper` — the hidden close button `render` appends after the
		// content — used to be applied alone at one call site and folded to a literal
		// class string, which is what the removed `inline` entry claimed. 0.3.0
		// composes `rtlStyles.centerInline('100%')` beside it (the wrapper's physical
		// `left: 50%` + `translate(-50%, 100%)` pair moved into the shared helper), and
		// a **function** style at the call site defeats the fold, so the literal is
		// gone and the key is now diffed as a declaration above instead. Same cause as
		// the Slider case — see the long note there.
	},
	{
		// Both RTL keyframe skips RETIRED at upstream 0.3.0, and the cause is worth
		// keeping. They read "upstream's dist carries an extra RTL `animation-name`
		// class our pinned StyleX build does not emit from identical source —
		// a compiler difference, not a style one", i.e. we were relying on StyleX to
		// mirror the keyframe automatically and it did not.
		//
		// 0.3.0's RTL phase 4c stopped relying on that too: upstream now DECLARES
		// `enterEndRtl` / `enterStartRtl` explicitly and selects them with
		// `':is([dir="rtl"] *)'`, so both sides emit the same class from the same
		// source and the skips reported themselves stale on the first run. `below`
		// and `above` translate on the block axis and are direction-neutral, so
		// upstream leaves them alone and so do we.
		file: 'src/lib/components/layer/layer-animations.stylex.js',
		upstreamFile: 'Layer/layerAnimations.stylex.js'
	},
	{
		file: 'src/lib/components/nav-icon/nav-icon.stylex.js',
		upstreamFile: 'NavIcon/NavIcon.js'
	},
	{
		file: 'src/lib/components/form-layout/form-layout.stylex.js',
		upstreamFile: 'FormLayout/FormLayout.js'
	},
	{
		file: 'src/lib/components/field-status/field-status.stylex.js',
		upstreamFile: 'FieldStatus/FieldStatus.js',
		// Both modes. The base/variant/colour groups merge with `entryStyle` and
		// `xstyle`, so the compiler could not fold them and `dist/` keeps the
		// objects; the two wrappers 0.2.0 added for the detached leading icon each
		// reach one call site with nothing beside them and were resolved into
		// literal class strings.
		inline: [['styles.detachedContent'], ['styles.detachedIcon']]
	},
	{
		// **Object mode as of 0.4.1** — `statusButton` used to be the one key that
		// folded, because its single call site had nothing beside it. It now merges
		// `focusOutlineStyles.focusVisible` from `utils/focusOutline.stylex`, and a
		// style imported across a module boundary defeats StyleX's fold, so `dist/`
		// carries the object instead of the string. The atoms did not change at all;
		// only the mode did.
		//
		// This is the **third** call site of that one change — `Selector` and
		// `MultiSelector` declare an identically-named key that moved the same way in
		// the same release. Worth stating as a rule: when a shared style helper is
		// adopted, every case claiming `inline` for a call site that now composes it
		// needs re-reading, and the three are found by grepping the helper's name
		// rather than by waiting for each to fail.
		//
		// `iconAnchor` is declared upstream and never applied, so it appears in
		// neither side's output.
		file: 'src/lib/hooks/use-input-status-icon.stylex.js',
		upstreamFile: 'hooks/useInputStatusIcon.js'
	},
	{
		// Published API rather than a component's private styles: every input
		// component composes these, so they reach `stylex.props` from many call
		// sites and upstream's `dist/` keeps the whole module as plain objects.
		file: 'src/lib/components/field/input-styles.stylex.js',
		upstreamFile: 'Field/inputStyles.stylex.js'
	},
	{
		// Both modes at once. Upstream's `dist/` keeps `container`, `containerGap`
		// and `horizontalLabels` as objects — they merge with `xstyle` and a
		// dynamic width, so the compiler could not fold them — while
		// `horizontalLabelAlign` and `inputStatusWrapper` each reach exactly one
		// call site and were resolved into literal class strings. The status
		// wrapper's string appears twice in `dist/` (the `horizontal-labels` branch
		// and the `attached` branch) but is one call site's worth of classes.
		//
		// `dynamicStyles.width` compiles to a function on both sides, so neither
		// extractor sees it and there is nothing to diff for it.
		file: 'src/lib/components/field/field.stylex.js',
		upstreamFile: 'Field/Field.js',
		inline: [['styles.horizontalLabelAlign'], ['styles.inputStatusWrapper']]
	},
	{
		// Both modes since 0.2.0. The label element's `stylex.props` call took on
		// `xstyle`, so the compiler could no longer fold its four branches to
		// literals and emitted `label` / `labelDisabled` / `srOnly` as objects
		// instead — the object diff above compares all three, key by key. The
		// description still folds — but into a FOUR-entry lookup table as of 0.3.0,
		// not two. Description-click forwarding added a second independent
		// condition (`forwardsDescriptionClick && styles.descriptionClickable`)
		// beside `isLabelHidden`, so the table is 2^2 and all four combinations are
		// claimed below. Composition ORDER is load-bearing and follows upstream:
		// `descriptionClickable` sits BEFORE `srOnly`.
		file: 'src/lib/components/field/field-label.stylex.js',
		upstreamFile: 'Field/FieldLabel.js',
		inline: [
			['styles.optionalRequired'],
			['styles.description'],
			['styles.description', 'styles.descriptionClickable'],
			['styles.description', 'styles.srOnly'],
			['styles.description', 'styles.descriptionClickable', 'styles.srOnly']
		]
	},
	{
		// Both modes at once. Upstream's `dist/` keeps `styles.wrapper` and
		// `textareaSizeStyles` as objects — they reach `stylex.props` beside the
		// shared `inputWrapperStyles` / `inputStatus*Styles` groups, a dynamic size
		// index and an `xstyle` spread, so the compiler could not fold them. Those
		// shared groups are `Field`'s published API and are checked over in
		// `input-styles.stylex.js`; composing them here neither re-checks nor
		// double-counts them, since the diff only walks the objects *this* module
		// declares.
		//
		// `textareaSizeStyles.sm` and `.md` are declared empty on both sides — they
		// exist only so `textareaSizeStyles[size]` can be indexed unconditionally —
		// and compile to a bare `$$css: true`. The extractor keeps no class-bearing
		// entry for them, so they drop out of the diff rather than reading as a
		// mismatch, and `lg` alone carries the group.
		//
		// The inline list SHRANK at upstream 0.3.0's TextArea layout rework, and for
		// the same structural reason the Slider case records: a dynamic style joined
		// the call site.
		//
		// Through 0.2.0 the `<textarea>` merged static keys only, so the compiler
		// folded it into a four-entry lookup table keyed
		// `!!effectivelyDisabled << 1 | !!status` — the four entries this list used
		// to open with. 0.3.0 moves `size` off the wrapper and onto the textarea, so
		// the call site now indexes `textareaSizeStyles[size]` dynamically and
		// nothing folds: upstream's `dist/` keeps `textarea`, `textareaDisabled`,
		// `textareaWithStartIcon`, `textareaWithStatus`, `textareaWithBusyStatus`
		// and `textareaWithCounter` as OBJECTS, where object mode already covers
		// them. `styles.statusIcon` is gone from upstream entirely — the on-field
		// glyph moved into the shared end slot.
		//
		// What remains folded is the two genuinely new overlay spans plus the
		// counter pair. Order is load-bearing on that pair: `counterError` narrows
		// `color` only, so it *replaces* the counter's `xv1l7n4` rather than joining
		// it — the same merge the `EmptyState` compact pairs rely on.
		file: 'src/lib/components/text-area/text-area.stylex.js',
		upstreamFile: 'TextArea/TextArea.js',
		inline: [
			['styles.startIcon'],
			['styles.endSlot'],
			['styles.counter'],
			['styles.counter', 'styles.counterError']
		]
	},
	{
		// One style, one call site — but the call site hands `[styles.button,
		// xstyle]` to `Button`'s `xstyle` prop rather than to `stylex.props`, so the
		// compiler could not fold it and upstream's `dist/` still carries the object.
		// Object mode, not inline.
		file: 'src/lib/components/field/input-clear-button.stylex.js',
		upstreamFile: 'Field/InputClearButton.js'
	},
	{
		// Both modes at once, and the split is the component's structure exactly.
		// `wrapper` rides `stylex.props(styles.wrapper, xstyle)` and `icon` is
		// handed to `Icon`'s `xstyle`, so the compiler could fold neither and
		// upstream's `dist/` keeps both as objects. The three that fold are the row
		// itself (with and without its keyboard focus ring) and the bare `<input>`.
		//
		// The ring pair is the one merge worth naming: `fieldKeyboardFocus` adds a
		// `boxShadow` the base `field` never sets, so the focused string is exactly
		// the unfocused one plus two classes (the `default: 'none'` and the
		// `:has(input:focus-visible)` inset) rather than a replacement.
		file: 'src/lib/components/field/panel-search-input.stylex.js',
		upstreamFile: 'Field/PanelSearchInput.js',
		inline: [['styles.field'], ['styles.field', 'styles.fieldKeyboardFocus'], ['styles.input']]
	},
	{
		// Shared group-member style, imported directly by every InputGroup-aware
		// control, so upstream's `dist/` keeps it as a plain object. Object mode.
		file: 'src/lib/components/input-group/group-styles.stylex.js',
		upstreamFile: 'InputGroup/groupStyles.js'
	},
	{
		// `styles` (group/disabled) and `sizeStyles` both reach `stylex.props`
		// alongside a dynamic `sizeStyles[size]` index and an `xstyle` spread, so the
		// compiler could not fold the merge and left both objects live in `dist/`.
		// Object mode.
		file: 'src/lib/components/input-group/input-group.stylex.js',
		upstreamFile: 'InputGroup/InputGroup.js'
	},
	{
		// One style, one call site, but merged with an `xstyle` spread at
		// `stylex.props(styles.text, xstyle)`, so upstream's `dist/` carries the
		// object. Object mode.
		file: 'src/lib/components/input-group/input-group-text.stylex.js',
		upstreamFile: 'InputGroup/InputGroupText.js'
	},
	{
		// Both modes at once. `sizeStyles` survives in upstream's `dist/` as an object
		// — it reaches `stylex.props` beside the shared `inputWrapperStyles` /
		// `inputStatus*Styles` groups, a dynamic `sizeStyles[size]` index,
		// `groupStyles.inGroup` and an `xstyle` spread, so the compiler could not fold
		// it. Those shared groups are `Field`'s and `InputGroup`'s published API,
		// checked in their own modules; composing them here neither re-checks nor
		// double-counts them, since object mode only walks the objects `dist/`
		// declares (here just `sizeStyles`).
		//
		// `styles` has no object in `dist/` at all: `input` / `inputDisabled` compile
		// to a two-entry lookup table keyed by `!!isDisabled << 0`. Those are the two
		// inline call sites.
		//
		// It used to be three. 0.4.x (#4876) converged the family's clear buttons on
		// the shared `InputClearButton`, so `styles.clearButton` — and the literal
		// class string it folded to — is gone from both sides.
		file: 'src/lib/components/text-input/text-input.stylex.js',
		upstreamFile: 'TextInput/TextInput.js',
		inline: [['styles.input'], ['styles.input', 'styles.inputDisabled']]
	},
	{
		file: 'src/lib/components/metadata-list/metadata-list.stylex.js',
		upstreamFile: 'MetadataList/MetadataList.js',
		inline: [['styles.title'], ['styles.toggleButton']]
	},
	{
		file: 'src/lib/components/metadata-list/metadata-list-item.stylex.js',
		upstreamFile: 'MetadataList/MetadataListItem.js',
		inline: [
			['styles.iconWrapper'],
			['styles.stackedLabel'],
			['styles.value'],
			['styles.stackedValue']
		]
	},
	{
		file: 'src/lib/components/empty-state/empty-state.stylex.js',
		upstreamFile: 'EmptyState/EmptyState.js',
		// Only the container pair survives as an object — it is the one combined
		// with `xstyle`. The rest are single call sites the compiler resolved,
		// each in a plain and a compact form.
		inline: [
			['styles.textGroup'],
			['styles.title'],
			['styles.title', 'styles.titleCompact'],
			['styles.description'],
			['styles.description', 'styles.descriptionCompact'],
			['styles.actions'],
			['styles.actions', 'styles.actionsCompact']
		]
	},
	{
		file: 'src/lib/components/citation/citation.stylex.js',
		upstreamFile: 'Citation/Citation.js',
		inline: [['styles.iconWrap'], ['styles.icon'], ['styles.labelText']]
	},
	{
		file: 'src/lib/components/thumbnail/thumbnail.stylex.js',
		upstreamFile: 'Thumbnail/Thumbnail.js',
		// **NO MARKER as of upstream 0.3.0**, and the old case is deleted rather
		// than repointed. The oracle reported this itself — "upstream no longer
		// ships marker module `Thumbnail/thumbnail.markers.stylex.js` — it has moved
		// or been removed; repoint the case" — which is 17a's
		// restructured-file-as-diagnosable-mismatch path doing its job instead of
		// aborting the run on `ENOENT`.
		//
		// It was removed, not moved: 0.3.0 puts the hover reveal on the new
		// `useContainerReveal` hook, whose marker comes from that hook's own
		// pre-declared pool and is merged onto the element at RUNTIME. So
		// `removeOnHover` and the marker module are both gone from upstream and from
		// here. The TreeListItem outcome again.
		//
		// Both modes. Object mode keeps `root`, `removeButtonOverrides` and
		// `disabled`. The remove slot is a single string now: its hover variant
		// moved to the pool.
		//
		// **The image container is object mode as of upstream 0.4.1 (#4654), and
		// its eight inline permutations are deleted rather than repaired.** They
		// were right for 0.3.0, when the container's four keys folded at a literal
		// call site and the compiler emitted an eight-entry lookup over the three
		// conditionals. #4654 routes the call site through the shared focus ring —
		// `Thumbnail.js` now reads
		// `focusOutlineProps.focusWithin(styles.imageContainer, isInteractive && styles.interactive, …)`
		// — and a *runtime* `stylex.props` call folds nothing, so `dist/` carries
		// `imageContainer`, `interactive`, `overlay` and `hoverOnPointer` as plain
		// `$$css` objects and emits no inline string for them at all. Object mode
		// above already diffs all four. `thumbnail.stylex.ts` makes the same call
		// through `focusOutlineProps.focusWithin`, so the shapes agree.
		//
		// **The pool is gone at upstream 0.4.0, and with it the one measurement gap
		// this case used to record.** It read: the pool itself is UNMEASURED,
		// because `containerReveal.pool.stylex.js` declared six mechanically
		// identical marker slots while `marker` holds exactly one name per case, so
		// a case for it passed slot 0 and failed the other five — evidence rather
		// than measurement, closable only by teaching this script a LIST of marker
		// names. #4955 replaced the pool with inherited custom properties, which
		// carry no marker at all: `container-reveal.stylex.ts` is ordinary static
		// CSS and the CSS oracle covers it directly. The debt retired itself.
		inline: [
			['styles.image'],
			['styles.placeholder'],
			['styles.interactiveButton'],
			['styles.insetBorder'],
			['styles.uploadOverlay'],
			['styles.removeSlot']
		]
	},
	{
		// **Object mode only, as of 0.4.1.** Upstream declares ComplexSelector's
		// styles inline in the component file rather than a style module, and keeps
		// the group's name `styles`, so ours needs no rename. `dist/` keeps every
		// key as a live object — the container's call site indexes `styles[size]`
		// dynamically, so the compiler could fold nothing there, and the chevron's
		// three keys now cross a component boundary as the `<Icon>`'s `xstyle`
		// (#4838/#4846), which defeats the fold the same way.
		//
		// That leaves `dist/` carrying only two literal class strings — the trigger
		// `<button>` and its text `<span>` — and BOTH of those keys survive as
		// objects too, so object mode already checks them atom for atom. The
		// four-entry `inline` list this case used to carry claimed two sites that no
		// longer exist and two that were never worth a second check, so it is gone
		// rather than trimmed: with no `inline` key the leftover check does not run,
		// and nothing goes unverified.
		file: 'src/lib/components/complex-selector/complex-selector.stylex.js',
		upstreamFile: 'ComplexSelector/ComplexSelector.js'
	},
	{
		// Object mode. `<Theme>` picks one of three `colorScheme` styles by `mode`,
		// so the compiler cannot fold the merge and `dist/` keeps the whole
		// `wrapperStyles` object live. Same group name on both sides.
		file: 'src/lib/theme/theme.stylex.js',
		upstreamFile: 'theme/Theme.js'
	},
	{
		file: 'src/lib/theme/media-theme.stylex.js',
		upstreamFile: 'theme/MediaTheme.js',
		// MediaTheme's one style is applied at its one call site, so upstream's
		// `dist/` carries the finished class string and no style object.
		inline: [['styles.root']]
	},
	{
		// All three theme-default padding chains are now compared: `card`, `dialog`
		// and `section` are ported, and their `--astryx-*` chains all live here.
		// `themeDefaultStyles` itself is a lookup of Identifiers, not a
		// `stylex.create` object, so the extractor never treats it as a group.
		file: 'src/lib/internal/container.stylex.js',
		upstreamFile: 'Layout/container.stylex.js'
	},
	{
		// Object mode. Upstream declares Dialog's styles inline in the component
		// file rather than a style module, and keeps the group's name `styles`, so
		// ours needs no rename. Every key (dialog, open, backdrop, fullscreen,
		// inner, inlineWrapper) reaches `stylex.props` alongside conditionals, the
		// dynamic `sizing`/`position` functions and an `xstyle` spread, so the
		// compiler could not fold the merge and left the whole object live in
		// `dist/`. `open`'s `animationName` carries the `enterDirectional` keyframe,
		// so comparing that key compares the keyframe by reference too. The dynamic
		// `sizing`/`position` compile to functions on both sides, so neither
		// extractor sees them and there is nothing to diff for them.
		file: 'src/lib/components/dialog/dialog.stylex.js',
		upstreamFile: 'Dialog/Dialog.js'
	},
	{
		// Both modes at once. Per an upstream parity pass only `titleFocusable`
		// stays a keyed object in `dist/` — it is handed to `Heading` via `xstyle`,
		// so the compiler could not fold it. The other four keys each reach exactly
		// one call site and were resolved into literal className strings: `container`
		// wraps the row, `titleWrapper` the heading column, `actions` both the
		// start-content slot and the end-content slot, and `actionsCompensation`
		// joins `actions` only in the end slot's `!!onOpenChange`-indexed branch.
		file: 'src/lib/components/dialog/dialog-header.stylex.js',
		upstreamFile: 'Dialog/DialogHeader.js',
		inline: [
			['styles.container'],
			['styles.titleWrapper'],
			['styles.actions'],
			['styles.actions', 'styles.actionsCompensation']
		]
	},
	{
		// Upstream declares these inside the hook itself; ours are split into a
		// `.stylex.ts` beside it, so the group keeps upstream's `styles` name and
		// the diff needs no rename.
		file: 'src/lib/hooks/entry-animation.stylex.js',
		upstreamFile: 'hooks/useEntryAnimation.js'
	},
	{
		// Both modes at once, and for the reason `xstyle` always creates: `hint` is
		// handed to `layer.render` rather than to `stylex.props`, so the compiler
		// cannot resolve it and upstream's `dist/` still carries the object. `keys`
		// and `label` each have exactly one call site and were resolved into literal
		// class strings.
		//
		// `hint`'s `border: 'none'` emits no class on either side — StyleX drops it,
		// so it is simply absent from both hash sets and the object diff has nothing
		// to compare for it. The module's `KEYBOARD_HINT_OFFSET_STYLE` is a template
		// literal rather than a style object, so neither extractor sees it.
		file: 'src/lib/hooks/keyboard-hint.stylex.js',
		upstreamFile: 'hooks/useKeyboardHint.js',
		inline: [['styles.keys'], ['styles.label']]
	},
	{
		// `sectionPaddingPropagationStyles` is now compared — Section is ported and
		// publishes `--astryx-section-padding` from this module so nested sections
		// inherit its padding.
		file: 'src/lib/internal/padding.stylex.js',
		upstreamFile: 'Layout/padding.stylex.js'
	},
	// `internal/edge-compensation.stylex.ts` has no case: its one style is
	// dynamic, so the compiler leaves it a function on both sides and there is no
	// class to diff. The guard at the foot of the loop rejects a case like that
	// rather than letting it read as coverage.
	{
		// Upstream declares these in the component file; ours are split into a
		// `.stylex.ts` beside it, so the group keeps upstream's `styles` name.
		file: 'src/lib/components/layout/layout.stylex.js',
		upstreamFile: 'Layout/Layout.js'
	},
	{
		file: 'src/lib/components/layout/layout-header.stylex.js',
		upstreamFile: 'Layout/LayoutHeader.js'
	},
	{
		file: 'src/lib/components/layout/layout-footer.stylex.js',
		upstreamFile: 'Layout/LayoutFooter.js'
	},
	{
		file: 'src/lib/components/layout/layout-content.stylex.js',
		upstreamFile: 'Layout/LayoutContent.js'
	},
	{
		file: 'src/lib/components/layout/layout-panel.stylex.js',
		upstreamFile: 'Layout/LayoutPanel.js'
	},
	{
		file: 'src/lib/components/resizable/resize-handle.stylex.js',
		upstreamFile: 'Resizable/ResizeHandle.js'
	},
	{
		file: 'src/lib/components/overlay/overlay.markers.stylex.js',
		upstreamFile: 'Overlay/overlay.markers.stylex.js'
	},
	{
		file: 'src/lib/components/overlay/overlay-scrim.stylex.js',
		upstreamFile: 'Overlay/OverlayScrim.js',
		// Every `showOn` rule is a `when.ancestor(..., overlayScope)`, and StyleX
		// derives a `defineMarker()`'s class from its module's *path* and export
		// name — there is no way to name one. Our markers module cannot sit at
		// upstream's path, so that class differs by construction, and so does every
		// conditional class whose selector embeds it. See `marker` below.
		marker: {
			file: 'src/lib/components/overlay/overlay.markers.stylex.js',
			upstreamFile: 'Overlay/overlay.markers.stylex.js',
			name: 'overlayScope'
		}
	},
	{
		// Both modes at once, and the port's first *inline* marker case. Upstream's
		// `dist/` keeps only `container` and `containerSpread` as objects: the row
		// applies them beside the conditional `switchScope` marker, so the compiler
		// could not fold the merge and left the object live. Everything else is a
		// single call site the compiler resolved into a literal class string.
		//
		// Three of the four `track` combos carry a class the marker's selector
		// embeds — the focus outline and the off/on hover tints all resolve against
		// `switchScope`, whose class is derived from its module's path and so cannot
		// match upstream's by name. Those three diff as marker-normalised CSS, the
		// same way the OverlayScrim object path does. The off/disabled track is the
		// exception: `trackDisabledOff` replaces the hover background, so no marker
		// class survives and it diffs by name.
		//
		// The `track` call site combines five conditional style args, so upstream's
		// `dist/` compiles a 2^4 lookup table. Its unreachable permutations (focus
		// with disabled, and so on) only recombine keys the four reachable combos
		// already verify, so the leftover check tolerates them as lookup-table
		// filler. `styles.description` is declared upstream but never applied, and
		// `dist/` tree-shakes it out entirely — with no object and no inline string
		// it has no counterpart to diff, so it needs no entry.
		file: 'src/lib/components/switch/switch.stylex.js',
		upstreamFile: 'Switch/Switch.js',
		marker: {
			file: 'src/lib/components/switch/switch.markers.stylex.js',
			upstreamFile: 'Switch/switch.markers.stylex.js',
			name: 'switchScope'
		}
		// **Object mode only since 0.2.0.** The `size` prop turned every one of
		// these call sites into a dynamic `[size]` index, so the compiler can no
		// longer fold any of them and `dist/` keeps them all as objects. The
		// previous 13-entry `inline` list is gone with the fold — batch 12's rule
		// (where upstream keeps its styles decides the mode) arriving from the
		// other direction, a second time this batch after `TreeList.wrapper`.
		//
		// `styles.statusGap` was the last inline holdout and went the same way at
		// 0.4.x (#4815's neighbour): the detached `FieldStatus` no longer sits in a
		// spacer `<div>` of its own, it takes the gap through its `xstyle` prop —
		// a value crossing a component boundary, which the compiler cannot fold.
	},
	{
		// Both `styles` (chrome + focus ring) and `linkColorStyles` (the per-colour
		// text/hover pair) reach `stylex.props` from three branches — the button
		// fallback, the disabled `<a>`, and the polymorphic component — so the
		// compiler could not fold the merge and left both objects live in `dist/`.
		// Object mode for both. `styles.base.outline` uses a `{default: null,
		// ':focus-visible': …}` shape, so its hash carries a null the extractor keeps.
		file: 'src/lib/components/link/link.stylex.js',
		upstreamFile: 'Link/Link.js'
	},
	{
		// Both modes at once. Upstream's `dist/` keeps `styles` (13 keys) and
		// `densityStyles` as objects — the row applies them beside `xstyle`, a
		// dynamic density index and several conditionals, so the compiler could not
		// fold them. `dynamicStyles.lineClamp` compiles to a function on both sides,
		// so neither extractor sees it and there is nothing to diff for it.
		//
		// The middle-column and slot wrappers each reach exactly one call site and
		// were resolved into literal class strings — the compiler emits a two-entry
		// lookup table keyed by `!!isDisabled << 0` for the four that carry a
		// disabled dim. `startContent` has no disabled variant, so it is a single
		// string. The nine inline combos below are those strings, with and without
		// `disabledContent` (`xbyyjgo`, opacity 0.5), which simply joins since it
		// touches a property none of the base keys set. `invisibleAnchor` differs
		// from `invisibleButton` only by `x1hl2dhg` — its `text-decoration: none`.
		file: 'src/lib/components/item/item.stylex.js',
		upstreamFile: 'Item/Item.js',
		inline: [
			['styles.startContent'],
			['styles.content'],
			['styles.content', 'styles.disabledContent'],
			['styles.invisibleButton'],
			['styles.invisibleButton', 'styles.disabledContent'],
			['styles.invisibleAnchor'],
			['styles.invisibleAnchor', 'styles.disabledContent'],
			['styles.endContent'],
			['styles.endContent', 'styles.disabledContent']
		]
	},
	{
		// Entirely inline: upstream's `dist/` carries no style object for the
		// radiogroup container, only a two-entry lookup table keyed by
		// `!!(orientation === 'vertical') << 0` — index 0 is the horizontal row,
		// index 1 the vertical column. Each is `radiogroup` merged with one
		// orientation variant, the pair `radiogroupAttrs` composes.
		file: 'src/lib/components/radio-list/radio-list.stylex.js',
		upstreamFile: 'RadioList/RadioList.js',
		inline: [
			['styles.radiogroup', 'styles.horizontal'],
			['styles.radiogroup', 'styles.vertical']
		]
	},
	{
		// **Down to the row chrome at upstream 0.4.0, and no marker.** The circle,
		// its inner dot and their two size ramps moved into `RadioIndicator`;
		// `radio.markers.stylex.ts` was deleted, because the element the hover tint
		// lands on is no longer one this component renders — the row now applies
		// the shared `indicatorScope`, and the marker-normalised keys moved to the
		// indicator's case with it.
		//
		// The wrapper also stopped carrying a focus ring. It used to hardcode a
		// `border-radius: 50%` so the ring matched a circle it did not own; the
		// ring is now painted on the indicator's own element by
		// `useIndicatorFocusRing`, which takes whatever shape the theme's
		// replacement actually has.
		//
		// Two inline call sites. `labelDisabled` — upstream resolves the label's
		// disabled dim into a two-entry lookup table keyed by `!!isDisabled << 0`,
		// where only the disabled branch carries a class, leaving no object for it;
		// it lives in our `styles` group, which upstream's `dist/` `styles` object
		// omits, so object mode never reaches it. And the new `indicatorSlot`,
		// whose lone `display: contents` folds to one class.
		file: 'src/lib/components/radio-list/radio-list-item.stylex.js',
		upstreamFile: 'RadioList/RadioListItem.js',
		inline: [['styles.labelDisabled'], ['styles.indicatorSlot']]
	},
	{
		// Both modes at once. Upstream's `dist/` keeps exactly four of `styles`
		// (`root`, `link`, `activeLink`, `activeAnchor`) plus the whole
		// `densityStyles` and `indentStyles` groups as objects: `root` takes an
		// `xstyle` spread, and the link merge carries a dynamic `densityStyles[density]`
		// index, a `getIndentStyle(level)` call and two `isActive &&` conditionals, so
		// the compiler could fold neither. The other six keys are each applied at one
		// call site with nothing dynamic beside them, so they survive only as literal
		// class strings — hence the six `inline` entries rather than object keys.
		file: 'src/lib/components/outline/outline.stylex.js',
		upstreamFile: 'Outline/Outline.js',
		inline: [
			['styles.list'],
			['styles.item'],
			['styles.label'],
			['styles.track'],
			['styles.dividerLine'],
			['styles.indicator']
		]
	},
	{
		// Both modes at once. Upstream's `dist/` keeps `styles` (container,
		// fillParent, measureContainer) and the whole `gapStyles` group as objects —
		// each is applied beside a dynamic `gapStyles[gap]` index and, for the
		// container, an `observeParent && hasOverflow` conditional plus an `xstyle`
		// spread, so the compiler could not fold the merge. `measureIndicator` is the
		// hidden indicator wrapper, applied at exactly one call site with no dynamic
		// style beside it, so the compiler resolved it into the literal class string
		// `x3nfvp2` and left no object entry behind.
		file: 'src/lib/components/overflow-list/overflow-list.stylex.js',
		upstreamFile: 'OverflowList/OverflowList.js',
		inline: [['styles.measureIndicator']]
	},
	{
		// Object mode. Upstream's `dist/` keeps the whole `styles` object —
		// `dropdown` reaches `stylex.props(styles.dropdown, xstyle)`, and `popover`,
		// `popoverBlockGap` and `popoverInlineGap` are picked by a `menuWidth ? … :`
		// / placement conditional and handed to `popover.render`'s `xstyle` array, so
		// the compiler could not fold any of them. The dynamic `popoverCustomWidth`
		// compiles to a function on both sides, so neither extractor sees it and there
		// is nothing to diff for it.
		file: 'src/lib/components/dropdown-menu/dropdown-menu.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenu.js'
	},
	{
		// Object mode. Both `menuItemStyles` (root/disabled) and `itemSizeStyles`
		// (sm/md/lg) reach `Item` as an `xstyle` array beside a dynamic
		// `itemSizeStyles[size]` index, so the compiler could not fold them and left
		// both objects live in `dist/`. `itemSizeStyles.lg` is declared empty on both
		// sides — it exists only so `itemSizeStyles[size]` can be indexed
		// unconditionally — and compiles to a bare `$$css: true`, so the extractor
		// keeps no class-bearing entry for it and it drops out of the diff.
		file: 'src/lib/components/dropdown-menu/dropdown-menu-item.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenuItem.js'
	},
	{
		// Both modes, and the module keeps shrinking. Through 0.2.0 it painted the
		// square itself and was object-mode-only (`boxSizeStyles[controlSize]` is a
		// dynamic index, which the compiler cannot resolve); 0.3.0 replaced the
		// square with a composed `CheckboxInput` and deleted that ramp; **0.4.0
		// replaced the composed control with the `checkbox` indicator**, which took
		// the `aria-hidden` + `inert` wrapper with it.
		//
		// So `markerBox` is now `marker` — placement only, with no
		// `display`/`flexShrink`, because the indicator's own chrome carries those.
		//
		// **And it went back to object mode with that rename**, which is the third
		// time this module has changed mode in three releases and worth stating as
		// the rule rather than the instance: the mode follows whether the style is
		// *applied* here or *handed onward*. 0.3.0's `markerBox` styled a wrapper
		// element via `stylex.props`, so the compiler folded it to a literal. 0.4.0
		// passes `marker` to the indicator as `xstyle` — a value crossing a
		// component boundary, which the compiler cannot resolve — so `dist/` keeps
		// the object and there is no literal left to claim inline. Adding an
		// `inline` entry for it fails with "upstream has no matching call site".
		file: 'src/lib/components/dropdown-menu/dropdown-menu-checkbox-item.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenuCheckboxItem.js'
	},
	{
		// The same move as its checkbox sibling at 0.4.0, object mode for the same
		// reason: the circle, the inner dot and their
		// `circleSizeStyles`/`dotSizeStyles` ramps went to `RadioIndicator`,
		// leaving `root`/`disabled` (an `xstyle` array) and `marker` (handed to the
		// indicator as `xstyle`) — all objects in `dist/`.
		//
		// This is the case that retires the `dropdown-menu-radio-dot` theme target:
		// with no menu-owned dot element left, there is nothing for it to address.
		file: 'src/lib/components/dropdown-menu/dropdown-menu-radio-item.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenuRadioItem.js'
	},
	{
		// Both modes. The trigger's groups reach `Item` as an `xstyle` array beside
		// a dynamic `triggerSizeStyles[menuSize]` index and stay objects, as
		// `DropdownMenuItem`'s do; `caret` and the flyout surface each resolve at
		// one call site. `flyoutStyles.popoverCustomWidth` is a dynamic style —
		// it compiles to a function on both sides, so neither extractor sees it,
		// the same standing `DropdownMenu`'s own `popoverCustomWidth` has.
		file: 'src/lib/components/dropdown-menu/dropdown-menu-sub-menu.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenuSubMenu.js',
		inline: [['triggerStyles.caret'], ['flyoutStyles.menu']]
	},
	{
		// **Object only as of upstream 0.4.1 — this case inverted, and its one
		// inline claim is deleted rather than repaired.** `group` is still the
		// module's single key at its single call site, but the call site grew an
		// `xstyle`: `DropdownMenuRadioGroup.js` reads
		// `stylex.props(styles.group, xstyle)`, and a spread of a runtime value
		// defeats the fold, so `dist/` carries the `$$css` object and emits no
		// inline string. `radioGroupAttrs(xstyle?)` takes the same argument.
		file: 'src/lib/components/dropdown-menu/dropdown-menu-radio-group.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenuRadioGroup.js'
	},
	{
		// **Inline only at upstream 0.4.0.** The `divider` key that made this case
		// object-mode-too moved to `DropdownMenuDivider` (below) when the data path
		// stopped drawing its own rule, leaving `sectionHeading` — one call site,
		// the `aria-hidden` heading row, reached via `stylex.props` and resolved
		// into a literal class string.
		file: 'src/lib/components/dropdown-menu/render-dropdown-items.stylex.js',
		upstreamFile: 'DropdownMenu/renderDropdownItems.js',
		inline: [['styles.sectionHeading']]
	},
	{
		// The divider the two menu modes now share, new at upstream 0.4.0. One key,
		// handed to `Divider` as `xstyle` — a value crossing a component boundary,
		// which the compiler cannot fold — so `dist/` keeps the object and there is
		// nothing to claim inline.
		file: 'src/lib/components/dropdown-menu/dropdown-menu-divider.stylex.js',
		upstreamFile: 'DropdownMenu/DropdownMenuDivider.js'
	},
	{
		// Both modes at once, and upstream declares Token's styles inline in the
		// component file rather than a style module, keeping the group names
		// `styles`/`sizeStyles`/`colorStyles`, so ours need no rename. Object mode
		// covers `styles.base`, `styles.interactive` and `styles.disabled` — they
		// reach `stylex.props` alongside the dynamic
		// `sizeStyles[size]`/`colorStyles[color]` indices and conditionals, so the
		// compiler could not fold them and left the objects live in `dist/`. The
		// whole `sizeStyles` and `colorStyles` groups ride the same runtime
		// `stylex.props`, so both survive as objects too.
		//
		// `styles.removeButton` joined them at 0.4.x (#4973): the remove button had
		// no ring at all, and now goes through `focusOutlineProps.focusVisible(...)`
		// — a runtime call the compiler cannot fold — so `dist/` carries the object
		// and there is no literal string left to claim inline.
		// (`styles.focusVisibleOutline` is gone from that list for a different 0.4.x
		// reason: the interactive branches take the shared `focusOutlineStyles`
		// instead, so the key no longer exists on either side.)
		//
		// `styles.label`, `styles.labelHidden` and `styles.invisibleButton` resolve
		// into literal class strings: `label` and `label`+`labelHidden` are the two
		// branches of the `!!isLabelHidden << 0` lookup table, and `invisibleButton`
		// the click container's hidden `<button>`.
		//
		// NOT "each reaches exactly one call site", which this comment claimed until
		// 0.3.0 — the link-with-remove rework gave `Token` a fourth render branch, so
		// upstream's `dist/` now emits the `isLabelHidden` label table **twice** and
		// the `invisibleButton` literal **twice**. The `inline` list below is
		// unaffected: the extractor keys upstream's strings by content, so duplicate
		// emissions collapse and one claim still accounts for both sites.
		file: 'src/lib/components/token/token.stylex.js',
		upstreamFile: 'Token/Token.js',
		inline: [['styles.label'], ['styles.label', 'styles.labelHidden'], ['styles.invisibleButton']]
	},
	{
		// Both modes at once. Upstream declares SelectableCard's styles inline in
		// the component file rather than a style module, and keeps the group's name
		// `styles`, so ours needs no rename. The 16 non-`srOnly` keys survive in
		// `dist/` as a live object: `interactive`, `focusWithin`, `overlay`,
		// `hoverOnPointer`, `disabled`, `selected` and the ten `selected<Color>`
		// are all handed to `Card`'s `xstyle` prop (an array) rather than to a
		// local `stylex.props`, so the compiler could not fold the merge. `srOnly`
		// is the one inline call site — the visually-hidden `<input>` applies it via
		// `stylex.props`, so the compiler resolved it into a literal class string.
		file: 'src/lib/components/selectable-card/selectable-card.stylex.js',
		upstreamFile: 'SelectableCard/SelectableCard.js',
		inline: [['styles.srOnly']]
	},
	{
		// Both modes at once. Upstream declares ClickableCard's styles inline in the
		// component file rather than a style module, and keeps the group's name
		// `styles`, so ours needs no rename. The eight non-`srOnly` keys survive in
		// `dist/` as a live object: `interactive`, `focusWithin`, `overlay`,
		// `hoverOnPointer`, `borderless`, `bordered`, `borderedHoverOnPointer` and
		// `disabled` are all handed to `Card`'s `xstyle` prop (an array) rather than
		// to a local `stylex.props`, so the compiler could not fold the merge.
		// `srOnly` is the one inline call site — the hidden `<button>`/`<a>` control
		// applies it via `stylex.props`, and the same folded class string is reused
		// on both branches, so the compiler resolved it into one literal class string.
		file: 'src/lib/components/clickable-card/clickable-card.stylex.js',
		upstreamFile: 'ClickableCard/ClickableCard.js',
		inline: [['styles.srOnly']]
	},
	{
		// Object mode. Both `styles` (container/fill/disabled/disabledWithMessage)
		// and `sizeStyles` (sm/md/lg) reach `stylex.props` alongside a dynamic
		// `sizeStyles[size]` index, layout/disabled conditionals and an `xstyle`
		// spread, so the compiler could not fold the merge and left both objects
		// live in `dist/`. `styles.container` publishes `--_segmented-control-padding`
		// and `sizeStyles` publishes `--_segmented-control-radius`; StyleX hashes the
		// custom-prop declarations like any other, so they compare by pair.
		file: 'src/lib/components/segmented-control/segmented-control.stylex.js',
		upstreamFile: 'SegmentedControl/SegmentedControl.js'
	},
	{
		// Object mode. `styles` (base/hover/selected/disabled/fill/icon),
		// `sizeStyles` (sm/md/lg) and `iconSizeStyles` (sm/md/lg) all reach
		// `stylex.props` beside the dynamic `sizeStyles[size]`/`iconSizeStyles[size]`
		// indices and conditionals, so the compiler could not fold them and left all
		// three objects live in `dist/`. `sizeStyles.borderRadius` reads the
		// concentric `max(0px, calc(var(--_segmented-control-radius) -
		// var(--_segmented-control-padding)))`, authored verbatim from the source, so
		// it hashes identically.
		file: 'src/lib/components/segmented-control/segmented-control-item.stylex.js',
		upstreamFile: 'SegmentedControl/SegmentedControlItem.js'
	},
	{
		// Both modes at once. Upstream declares ToggleButton's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `pressedStyles`/`labelStyles`, so ours need no rename. Object mode covers
		// `pressedStyles.background`: it is handed to `Button`'s `xstyle` prop
		// (`[isPressed ? pressedStyles.background : undefined, xstyle]`) rather than a
		// local `stylex.props`, so the compiler could not fold it and left the object
		// live in `dist/`. The three `labelStyles` keys each reach exactly one call
		// site and were resolved into literal class strings: `wrapper` is the label
		// column, `pressed` the visible line's `!!isPressed << 0` lookup table, and
		// `widthReservation` the hidden semibold copy that reserves the pressed width.
		file: 'src/lib/components/toggle-button/toggle-button.stylex.js',
		upstreamFile: 'ToggleButton/ToggleButton.js',
		inline: [['labelStyles.wrapper'], ['labelStyles.pressed'], ['labelStyles.widthReservation']]
	},
	{
		// Object mode. Upstream declares ToggleButtonGroup's styles inline in the
		// component file rather than a style module, and keeps the group's name
		// `styles`, so ours needs no rename. Both `group` and `vertical` reach
		// `stylex.props` alongside the `orientation === 'vertical'` conditional and an
		// `xstyle` spread, so the compiler could not fold the merge and left the whole
		// object live in `dist/`.
		file: 'src/lib/components/toggle-button/toggle-button-group.stylex.js',
		upstreamFile: 'ToggleButton/ToggleButtonGroup.js'
	},
	{
		// Both modes at once. Object mode covers `styles.root`, `styles.trigger`,
		// `styles.contentHidden`, `styles.content`, `styles.divided` and the whole
		// `densityStyles` group — each reaches `stylex.props` alongside a dynamic
		// `[density]` index and/or conditionals (`isDivided && styles.divided`,
		// `!isOpen && styles.contentHidden`) plus an `xstyle` spread on the root, so
		// the compiler could not fold the merge and left the objects live in `dist/`.
		//
		// The `isDisabled` feature — including `styles.triggerDisabled` — is in
		// upstream's source and tests but ABSENT from the published 0.1.7 `dist/`,
		// the same source/dist lag as Icon. Object mode walks `dist/`'s keys, so our
		// extra `triggerDisabled` is simply uncompared; it is the reverse of a skip
		// (a key we have that upstream defers), so it needs no skip entry.
		//
		// Inline: `styles.triggerLabel` is the capsized label span at one call site,
		// resolved into the literal `x1b2iylo xwgcxoh`.
		//
		// **The chevron pair is object mode as of upstream 0.4.1 (#4838), and its
		// two inline permutations are deleted rather than repaired.** They were
		// right for 0.3.0, when the chevron rotated a wrapper `<span>` and the
		// ternary folded into a two-entry lookup table keyed by `!!isOpen << 0`.
		// #4838 drops the wrapper and hands the styles straight to the `<Icon>` as
		// `xstyle: [styles.chevron, isOpen ? styles.chevronOpen : styles.chevronClosed]`.
		// A style crossing a component boundary as `xstyle` is opaque to the
		// compiler, so `dist/` keeps `chevron`, `chevronOpen` and `chevronClosed`
		// as `$$css` objects and emits no inline string for them. Object mode above
		// already diffs all three; `collapsible.svelte` builds the same array.
		file: 'src/lib/components/collapsible/collapsible.stylex.js',
		upstreamFile: 'Collapsible/Collapsible.js',
		// The `styles.content` skip (upstream #4126's body typography, present in
		// 0.1.7's source but not its published dist) is gone: 0.2.0 ships it, and
		// the skip said so itself on the first run against the new pin.
		inline: [['styles.triggerLabel']]
	},
	{
		// Object mode. One style, one member — but `styles.wrapper` reaches
		// `stylex.props(styles.wrapper, xstyle)` beside an `xstyle` spread, so the
		// compiler could not fold it and left the object live in `dist/`.
		file: 'src/lib/components/collapsible/collapsible-group.stylex.js',
		upstreamFile: 'Collapsible/CollapsibleGroup.js'
	},
	{
		// Entirely inline. `ToastProps` is a closed list with no `xstyle`, so no
		// style here ever merges with a caller's — every one of upstream's four
		// call sites is a plain `stylex.props(...)` the compiler could fold, and
		// `dist/Toast.js` carries no style object at all.
		//
		// The root is a four-entry lookup table keyed by
		// `!!isError << 1 | !!isExiting << 0`, so the four combos below are
		// `root` + the `isError ? variantError : variantDefault` pick + the
		// optional `exiting`. Order is load-bearing twice over: the variant pair
		// both set `backgroundColor`, so the pick replaces rather than joins, and
		// `exiting` narrows `opacity` and `transform`, so it *replaces* `root`'s
		// `opacity: 1` / `translateY(0)` classes instead of accumulating beside
		// them. `inner`, `content` and `endContent` are the three single-style
		// call sites.
		file: 'src/lib/components/toast/toast.stylex.js',
		upstreamFile: 'Toast/Toast.js',
		inline: [
			['styles.root', 'styles.variantDefault'],
			['styles.root', 'styles.variantDefault', 'styles.exiting'],
			['styles.root', 'styles.variantError'],
			['styles.root', 'styles.variantError', 'styles.exiting'],
			['styles.inner'],
			['styles.content'],
			['styles.endContent']
		]
	},
	{
		// Both modes at once. The region's `stylex.props(styles.viewport,
		// posStyle)` picks `posStyle` from a four-way position conditional, so the
		// compiler could not fold it and left `viewport` and the four position
		// keys live in `dist/` as an object — object mode covers those five.
		//
		// `viewport`'s `border: 'none'` and `background: 'none'` emit no class on
		// either side (StyleX drops them, the same way `useKeyboardHint`'s `hint`
		// border drops), so they are simply absent from both hash sets and the
		// object diff has nothing to compare for them.
		//
		// The two wrapper keys have no object in `dist/`: the per-toast wrapper is
		// a two-entry lookup table keyed by `!!isExiting << 0`, and the inner
		// overflow clip is a single literal class string. Those are the three
		// inline call sites. `toastWrapperExiting` narrows `gridTemplateRows` and
		// `paddingBlockEnd`, so it replaces the wrapper's `1fr` and `--spacing-3`
		// classes rather than joining them.
		file: 'src/lib/components/toast/toast-viewport.stylex.js',
		upstreamFile: 'Toast/ToastViewport.js',
		inline: [
			['styles.toastWrapper'],
			['styles.toastWrapper', 'styles.toastWrapperExiting'],
			['styles.toastWrapperInner']
		]
	},
	{
		// Both modes at once. Upstream declares Lightbox's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `styles`/`dynamicStyles`, so ours need no rename.
		//
		// Object mode covers the four keys `dist/` still carries: `dialog` reaches
		// `stylex.props(styles.dialog, xstyle)` beside the `xstyle` spread and
		// `themeProps`, `image` and `imageDragging` ride the same runtime
		// `stylex.props` as the dynamic `imageTransform`, and `controlButton` is
		// handed to `IconButton`'s `xstyle` prop — so the compiler could not fold
		// any of them. `dialog`'s `border: 'none'` emits no class on either side
		// (StyleX drops it, as with `useKeyboardHint`'s `hint`), so it is absent
		// from both hash sets and there is nothing to compare for it.
		// `dynamicStyles.imageTransform` compiles to a function on both sides, so
		// neither extractor sees it.
		//
		// **The image wrapper's eight claims are deleted at upstream 0.4.1; the
		// close/nav ones are DELIBERATELY KEPT and are EXPECTED TO FAIL. Read the
		// second half before touching them.**
		//
		// The wrapper used to be a 2^4 lookup table keyed by
		// `!!zoomTarget << 3 | !!zoomable << 2 | !!zoomed << 1 | !!dragging << 0`,
		// which is why eight combinations were claimed. Two things ended that.
		// `styles.zoomTarget` (0.3.0's hand-written keyboard-zoom ring) no longer
		// exists on either side — upstream replaced the key outright with the
		// shared `focusOutlineStyles.focusVisible`, and `lightbox.stylex.ts` did
		// too, which is why four of the old claims reported "absent from our
		// module". And the surviving `stylex.props(styles.imageWrapper,
		// isZoomTarget && focusOutlineStyles.focusVisible, …)` no longer folds, so
		// `dist/` carries `imageWrapper`, `imageWrapperZoomable`,
		// `imageWrapperZoomed` and `imageWrapperDragging` as objects. Object mode
		// above diffs all four, and `lightbox.svelte` calls
		// `lightboxImageWrapperAttrs` with the same four flags in the same order —
		// the precedence that collapse encodes (zoomed beats zoomable, dragging
		// beats both, all three sharing `cursor`) is preserved by the order, not by
		// the claims.
		//
		// `styles.closeButton`, `navButton`, `navPrev` and `navNext` are OBJECT mode
		// and have no claims. #4775 deleted the wrapper `<div>`s they sat on and
		// moved them onto `IconButton`'s own `xstyle`
		// (`xstyle: [styles.closeButton, styles.controlButton]`, and likewise for
		// the two nav pairs), so they cross a component boundary and `dist/` keeps
		// them as objects on both sides.
		//
		// `navButton` uses the individual `translate: '0 -50%'` rather than
		// `transform: 'translateY(-50%)'`, and that is load-bearing rather than
		// stylistic: the style lands on the Button root now, and a `transform`
		// there REPLACES Button's own transform rules — the `scale(0.98)` press
		// feedback stops firing. `translate` composes with them, reproducing what
		// the removed wrapper did (wrapper translated, button scaled).
		//
		// The remaining keys each reach exactly one call site and were resolved
		// into literal class strings.
		file: 'src/lib/components/lightbox/lightbox.stylex.js',
		upstreamFile: 'Lightbox/Lightbox.js',
		inline: [
			['styles.container'],
			['styles.mediaGroup'],
			['styles.video'],
			['styles.caption'],
			['styles.counter']
		]
	},
	{
		// Both modes at once. `styles.list`, `withDividers` and `withCounter` reach
		// `stylex.props` beside a marker-style conditional and an `xstyle` spread, so
		// upstream's `dist/` keeps them as objects. `root` and `header` exist only on
		// the header branch's two wrapper divs — one call site each, no dynamic style
		// beside them — so the compiler folded each into a literal class string.
		//
		// `dynamicStyles.counterStart` is the ordered-list counter seed. It compiles
		// to a *function* over a hoisted `_temp` object on both sides, which neither
		// mode reaches: object mode walks named group members and inline mode
		// literal strings.
		file: 'src/lib/components/list/list.stylex.js',
		upstreamFile: 'List/List.js',
		inline: [['styles.root'], ['styles.header']]
	},
	{
		// Both modes at once. The three `xstyle` keys upstream hands to `Item`
		// (`withCounter`, `withDivider`, `noRadius`) survive as objects because they
		// sit in a conditional array; every `markerStyles` key is applied at exactly
		// one call site and was folded into a literal string. The `dot`/`circle`
		// pair and the `container` wrapper are those strings, plus the `decimal`
		// marker's counter span.
		file: 'src/lib/components/list/list-item.stylex.js',
		upstreamFile: 'List/ListItem.js',
		inline: [
			['markerStyles.container'],
			['markerStyles.dot'],
			['markerStyles.circle'],
			['markerStyles.number']
		]
	},
	{
		// Both modes at once. `root` (an `xstyle` spread), `header` (three
		// conditionals plus the status lookup), `endArea` (a dynamic
		// `edgeCompSlot.inset`) and the whole `statusStyles` group survive as
		// objects in upstream's `dist/`. The text slots, icon wrapper and content
		// area are single call sites the compiler folded into literal strings — the
		// content area twice, with and without its one conditional
		// (`contentAreaCard`).
		//
		// **`chevron`/`chevronExpanded` joined the objects at upstream 0.4.1
		// (#4838), and their two inline permutations are deleted rather than
		// repaired.** They were right for 0.3.0, when the chevron rotated a wrapper
		// and folded with and without `chevronExpanded`. #4838 hands the pair
		// straight to the toggle's `<Icon>` as
		// `xstyle: [styles.chevron, isExpanded && styles.chevronExpanded]`; a style
		// crossing a component boundary as `xstyle` is opaque to the compiler, so
		// `dist/` keeps both as `$$css` objects and emits no inline string for
		// them. Object mode above already diffs them; `banner.svelte`'s
		// `chevronIcon` snippet builds the same array.
		file: 'src/lib/components/banner/banner.stylex.js',
		upstreamFile: 'Banner/Banner.js',
		inline: [
			['styles.iconWrapper'],
			['styles.headerContent'],
			// **`headerContentWithEndContent` is new at upstream 0.4.4**, and it makes
			// the header content a folding *pair* — the same shape `contentArea` has
			// below. The `flex-basis: 8rem` it adds is the wrap threshold: it applies
			// only when there is `endContent` to wrap, so the compiler folds the slot
			// twice, with and without it. Listing only the bare combination leaves
			// upstream's second string unclaimed and the run fails on it.
			['styles.headerContent', 'styles.headerContentWithEndContent'],
			['styles.title'],
			['styles.description'],
			['styles.contentArea'],
			['styles.contentArea', 'styles.contentAreaCard']
		]
	},
	{
		// Both modes at once. `navStyles.root` takes an `xstyle` spread and stays an
		// object; the `<ol>` is one call site, folded into a literal string.
		file: 'src/lib/components/breadcrumbs/breadcrumbs.stylex.js',
		upstreamFile: 'Breadcrumbs/Breadcrumbs.js',
		inline: [['listStyles.root']]
	},
	{
		// Both modes at once. Object mode covers `root`, the two size variants (a
		// variant ternary plus an `xstyle` spread reach `stylex.props` together) and
		// — **new at upstream 0.5.0** — `link`, `buttonReset`, `defaultLink` and
		// `supportingLink`. Those four moved *out* of the inline list rather than
		// changing: #4605 routes the `<a>` and `<button>` branches through
		// `focusOutlineProps.focusVisible(...)` instead of a bare `stylex.props(...)`,
		// and the compiler cannot fold a call it does not own, so `dist/` now keeps
		// the objects and emits no literal for either branch. Their two inline
		// claims are deleted rather than repaired; leaving them in fails with
		// "upstream has no matching call site".
		//
		// The current-wrapper pair *does* still fold, differs between the variants
		// (primary vs secondary text) and stays claimed below — which is what
		// checks `current`'s semibold weight, the accessibility half of #4605.
		//
		// **`itemStyles.chevron` is object mode as of upstream 0.4.1 (#4838), and
		// its inline claim is deleted rather than repaired.** It was right for
		// 0.3.0, when the menu trigger's chevron sat in a wrapper `<span>` that
		// folded at one call site. #4838 hands it straight to the `<Icon>` as
		// `xstyle: itemStyles.chevron`; a style crossing a component boundary as
		// `xstyle` is opaque to the compiler, so `dist/` keeps the object and emits
		// no inline string for it. Object mode above already diffs it, and
		// `breadcrumb-menu-trigger.svelte` passes the same
		// `xstyle={breadcrumbChevronStyle}`.
		file: 'src/lib/components/breadcrumbs/breadcrumb-item.stylex.js',
		upstreamFile: 'Breadcrumbs/BreadcrumbItem.js',
		inline: [
			['itemStyles.icon'],
			['itemStyles.separator'],
			['itemStyles.contentWrapper', 'itemStyles.current', 'itemStyles.defaultCurrent'],
			['itemStyles.contentWrapper', 'itemStyles.current', 'itemStyles.supportingCurrent'],
			// The menu surface. `menuStyles.popover` is *not* here: it is handed to
			// the layer as an `xstyle` value, never resolved at a static call site,
			// so it stays an object on both sides and object mode covers it.
			['menuStyles.menu']
		]
	},
	{
		// Both modes at once. Everything but `item` and the button pill survives as
		// an object: the scroller merges a dynamic `gapStyles[gap]` index with three
		// conditionals, and the root takes an `xstyle` spread. The item wrapper is
		// one call site; the pill resolved to four strings — start/end × faded-out.
		file: 'src/lib/components/carousel/carousel.stylex.js',
		upstreamFile: 'Carousel/Carousel.js',
		inline: [
			['styles.item'],
			['styles.buttonPill', 'styles.buttonPillStart'],
			['styles.buttonPill', 'styles.buttonPillStart', 'styles.buttonHidden'],
			['styles.buttonPill', 'styles.buttonPillEnd'],
			['styles.buttonPill', 'styles.buttonPillEnd', 'styles.buttonHidden']
		]
	},
	{
		// Pure object mode, and the only case in the file with no inline entries at
		// all: every one of Toolbar's call sites merges a dynamic
		// `dynamicStyles.gap(...)`, so the compiler could fold none of them into a
		// literal string and `dist/` kept all eight `styles` keys plus
		// `sizeStyles.base`. `dynamicStyles` itself compiles to functions over
		// hoisted temporaries on both sides, which neither mode reaches.
		file: 'src/lib/components/toolbar/toolbar.stylex.js',
		upstreamFile: 'Toolbar/Toolbar.js'
	},
	{
		// Object mode. The one key takes an `xstyle` spread, so upstream's `dist/`
		// keeps it; there is no other call site in the file.
		file: 'src/lib/components/command-palette/command-palette-empty.stylex.js',
		upstreamFile: 'CommandPalette/CommandPaletteEmpty.js'
	},
	{
		// Both modes at once. `group` takes an `xstyle` spread and stays an object;
		// the `aria-hidden` heading is a single call site, folded to a literal.
		file: 'src/lib/components/command-palette/command-palette-group.stylex.js',
		upstreamFile: 'CommandPalette/CommandPaletteGroup.js',
		inline: [['styles.heading']]
	},
	{
		// Object mode. `list` takes an `xstyle` spread; nothing else is styled.
		file: 'src/lib/components/command-palette/command-palette-list.stylex.js',
		upstreamFile: 'CommandPalette/CommandPaletteList.js'
	},
	{
		// Both modes at once. `footer` takes an `xstyle` spread and stays an object.
		// `hint` is folded, and upstream emits the *same* literal three times (one
		// per key-hint span) — the oracle compares distinct call sites, so one entry
		// covers all three, as the `Breadcrumbs` case documents for its link pair.
		file: 'src/lib/components/command-palette/command-palette-footer.stylex.js',
		upstreamFile: 'CommandPalette/CommandPaletteFooter.js',
		inline: [['styles.hint']]
	},
	{
		// Pure object mode. Every key reaches one `stylex.props` merge alongside four
		// conditionals and an `xstyle` spread, so the compiler folded none of them.
		file: 'src/lib/components/command-palette/command-palette-item.stylex.js',
		upstreamFile: 'CommandPalette/CommandPaletteItem.js'
	},
	{
		// Both modes at once. Only `wrapper` survives as an object (the `xstyle`
		// spread); the other four are single call sites. `icon` appears twice — bare
		// on the leading search icon, and merged with `spinner` on the busy
		// indicator — so both combinations are listed.
		file: 'src/lib/components/command-palette/command-palette-input.stylex.js',
		upstreamFile: 'CommandPalette/CommandPaletteInput.js',
		inline: [['styles.icon'], ['styles.input'], ['styles.end'], ['styles.icon', 'styles.spinner']]
	},
	{
		// Both modes at once. `trigger` (a `triggerXstyle` spread), `menu` (an
		// `xstyle` spread) and `popover` (chosen against the dynamic
		// `popoverCustomWidth`) stay objects; the zero-size cursor anchor is the one
		// inline call site.
		file: 'src/lib/components/context-menu/context-menu.stylex.js',
		upstreamFile: 'ContextMenu/ContextMenu.js',
		inline: [['styles.cursorAnchor']]
	},
	{
		// Pure object mode: the menu's one call site merges the dynamic
		// `sizeStyles[size]` index with an `xstyle` spread, so nothing folded.
		file: 'src/lib/components/nav-menu/nav-heading-menu.stylex.js',
		upstreamFile: 'NavMenu/NavHeadingMenu.js'
	},
	{
		// Both modes. `root`/`disabled` and the size ramp stay objects (dynamic
		// index + conditional + `xstyle`); `content` is applied alone at one call
		// site, so upstream folded it into a literal string.
		file: 'src/lib/components/nav-menu/nav-heading-menu-item.stylex.js',
		upstreamFile: 'NavMenu/NavHeadingMenuItem.js',
		inline: [['styles.content']]
	},
	{
		// Both modes. Only `root` survives as an object (an `xstyle` spread); the
		// `<ul>` and the header block are each applied alone at one call site.
		file: 'src/lib/components/tree-list/tree-list.stylex.js',
		upstreamFile: 'TreeList/TreeList.js',
		inline: [['styles.list'], ['styles.header']]
	},
	{
		// Pure inline mode — upstream's `dist/` carries no style object for this
		// module at all: every call site is static, so the compiler folded each into
		// a literal class string. The `left` offsets are per-instance calcs and stay
		// inline `style` on both sides, so they never reach a class.
		//
		// The `verticalLast` combination is the third site, new at 0.4.1 (#4540):
		// the terminus segment is clamped by half the `--tree-list-row-gap` lever so
		// it does not overhang the last row. It reads as static to the compiler even
		// though the choice is `isLast ? verticalLast : verticalFull`, because
		// upstream writes the ternary *inside* `stylex.props` — both arms fold, and
		// both have to be claimed or the leftover check fires.
		file: 'src/lib/components/tree-list/tree-list-branches.stylex.js',
		upstreamFile: 'TreeList/TreeListBranches.js',
		inline: [
			['styles.container'],
			['styles.verticalLine', 'styles.verticalFull'],
			['styles.verticalLine', 'styles.verticalLast']
		]
	},
	{
		// Both modes. The row merges a dynamic `densityStyles[density]` with four
		// conditionals and the description merges a dynamic
		// `descriptionSizeStyles[density]`, so `wrapper`, `contentWrapper`,
		// `interactive`, `focusVisibleOutline`, `disabled`, `selected` and
		// `description` stayed objects; everything else folded into a literal string.
		//
		// **No marker as of 0.2.0.** This case used to carry one: `focusVisibleOutline`
		// embedded `when.ancestor(':focus-visible', treeItemScope)`, and a
		// `defineMarker()`'s class is path-derived and so can never match upstream's by
		// name, which forced those keys through the marker-normalised CSS fallback.
		// 0.2.0 replaced the ancestor selector with two inheritable custom properties
		// published on the `<li>` itself and deleted `treeListItem.markers.stylex.ts`,
		// so both sides now compare as ordinary atomic classes.
		file: 'src/lib/components/tree-list/tree-list-item.stylex.js',
		upstreamFile: 'TreeList/TreeListItem.js',
		inline: [
			// `wrapper` folded in 0.2.0 — dropping `treeItemScope` did it, with nothing
			// about the declaration changing — and UNfolded again at 0.4.1, when the
			// `<li>` went back to merging (`focusOutlineProps.publishFocusVisibleVars`
			// took the retired marker's place). It is claimed by neither list now;
			// object mode has it. A third instance of the batch-12 rule, and the
			// clearest: the mode follows upstream's call site, so a key can move
			// between modes twice on releases that touch no style value at all.
			['styles.childGroup'],
			['styles.treeBranches'],
			['styles.rowWrapper'],
			['styles.invisibleButton'],
			['styles.invisibleAnchor'],
			['styles.content'],
			['styles.label'],
			['styles.startContent'],
			['styles.endContent'],
			['styles.chevronContainer'],
			['styles.chevronButton']
			// The two `chevronSvg` combinations left the inline list at 0.4.1 (#4838)
			// for the same reason `wrapper` did, one step further out: the chevron now
			// rides an `<Icon xstyle>` rather than being drawn here, so the styles
			// cross a component boundary and StyleX has no single call site to fold.
			// `chevronSvg`/`chevronExpanded`/`chevronCollapsed` are objects in
			// upstream's `dist/` again and object mode covers them.
		]
	},
	{
		// Pure object mode: the `<nav>`'s one call site merges two conditionals with
		// an `xstyle` spread, so all three keys survived.
		// The `styles.divider` skip is gone: 0.2.0's dist ships the divider gap and
		// `--_tab-indicator-bottom`, so the source we ported from is now the
		// published build too. It retired together with the three `tab`/`tab-menu`
		// indicator inline skips, exactly as its own text predicted.
		file: 'src/lib/components/tab-list/tab-list.stylex.js',
		upstreamFile: 'TabList/TabList.js'
	},
	{
		// Both modes, plus the `tabScope` marker shared with TabMenu. `base`,
		// `hoverBg`, `selected` and `icon` stay objects (dynamic size indexes,
		// conditionals, the marker and an `xstyle` spread), along with all four
		// size/layout groups; the indicator, label and end-content wrappers folded
		// into literal strings. `hoverBg` embeds `when.ancestor(':hover', tabScope)`
		// and so diffs as marker-normalised CSS.
		file: 'src/lib/components/tab-list/tab.stylex.js',
		upstreamFile: 'TabList/Tab.js',
		marker: {
			file: 'src/lib/components/tab-list/tab.markers.stylex.js',
			upstreamFile: 'TabList/tab.markers.stylex.js',
			name: 'tabScope'
		},
		inline: [
			['styles.indicator', 'styles.indicatorSelected'],
			['styles.indicator', 'styles.indicatorUnselected'],
			['styles.labelContainer'],
			['styles.labelText'],
			['styles.labelSizer'],
			['styles.endContentWrapper']
		]
		// The two indicator `inlineSkip`s are gone: 0.2.0's dist ships
		// `var(--_tab-indicator-bottom, -1px)`, so source and dist agree again.
	},
	{
		// Both modes, same marker. `trigger`/`triggerSelected`/`hoverBg` survive as
		// objects, and at upstream 0.4.1 four more joined them.
		// `styles.itemCheckmark` is declared upstream and never applied (the
		// selected tick is an `<Icon icon="check">`), so it has no counterpart in
		// either mode and stays uncompared — the reverse of a skip, as
		// `Collapsible`'s `triggerDisabled` is.
		//
		// **Two deletions, two different 0.4.1 mechanisms.**
		//
		// `chevronIcon`/`chevronOpen` are #4838. The wrapper `<span>` is still a
		// folded call site — `[styles.chevron]` below claims it and still resolves
		// to `x12xnipv x6b6gus x2lah0s` — but the rotation and its transition moved
		// off the wrapper onto the glyph, which `TabMenu.js` hands to the `<Icon>`
		// as `xstyle: [styles.chevronIcon, popover.isOpen && styles.chevronOpen]`.
		// A style crossing a component boundary as `xstyle` is opaque to the
		// compiler, so `dist/` keeps both as objects. Note the key names: our
		// module carries `chevron` AND `chevronIcon` exactly as upstream does, so
		// the old `['styles.chevron', 'styles.chevronOpen']` claim was naming two
		// keys that never merge at any call site.
		//
		// `menuItem`/`menuItemSelected` are #4973. `TabMenu.js` now reads
		// `focusOutlineProps.focusVisible(styles.menuItem, isSelected && styles.menuItemSelected)`,
		// and a runtime `stylex.props` call folds nothing, so `dist/` keeps both as
		// objects too. `tab-menu.stylex.ts` makes the same call.
		file: 'src/lib/components/tab-list/tab-menu.stylex.js',
		upstreamFile: 'TabList/TabMenu.js',
		marker: {
			file: 'src/lib/components/tab-list/tab.markers.stylex.js',
			upstreamFile: 'TabList/tab.markers.stylex.js',
			name: 'tabScope'
		},
		inline: [
			['styles.triggerLabel'],
			['styles.triggerLabelText'],
			['styles.triggerLabelSizer'],
			['styles.chevron'],
			['styles.indicator', 'styles.indicatorSelected'],
			['styles.dropdown'],
			['styles.menuHeading'],
			['styles.menuItemContent']
		]
		// The indicator `inlineSkip` is gone with TabList's and Tab's — 0.2.0's dist
		// ships `var(--_tab-indicator-bottom, -1px)`.
	},
	{
		// Both modes. Upstream declares CheckboxInput's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `styles` / `wrapperSizeStyles`, so ours need no rename.
		//
		// **Down to two groups at upstream 0.4.0, and no marker.** The box, the
		// tick, the mixed-state bar and their three size ramps moved into
		// `CheckboxIndicator`; `checkbox.markers.stylex.ts` was deleted outright,
		// because the element the hover tint lands on is no longer one this
		// component renders — the row now applies the shared `indicatorScope`, and
		// the marker-normalised keys moved to the indicator's case with it. What
		// is left here draws no checkbox at all: the row, the positioned wrapper,
		// the visually-hidden `<input>`, the `display: contents` indicator slot and
		// the label column.
		//
		// Two inline call sites, both plain `stylex.props` with no dynamic style
		// beside them, so the compiler resolved each into a literal: the label
		// column (`x78zum5 xdt5ytf x1lsbc85`) and the new indicator slot, whose
		// lone `display: contents` folds to one class.
		//
		// `dynamicWidthStyles.width` compiles to a function on both sides, so
		// neither extractor sees it. `styles.description` is declared upstream and
		// never applied — `FieldLabel` renders the description — and `dist/`
		// tree-shakes it out entirely, so it has no counterpart in either mode and
		// needs no skip, exactly as `Switch`'s `description` key is.
		file: 'src/lib/components/checkbox-input/checkbox-input.stylex.js',
		upstreamFile: 'CheckboxInput/CheckboxInput.js',
		inline: [['styles.labelWrapper'], ['styles.indicatorSlot']]
	},
	{
		// Pure object mode. `styles.selected` is the only style the module declares,
		// and it reaches `ListItem` inside an `xstyle` array beside a conditional
		// rather than a local `stylex.props`, so the compiler could not fold it and
		// upstream's `dist/` still carries the object. `CheckboxList.tsx` itself
		// imports no StyleX at all, so it gets no case.
		file: 'src/lib/components/checkbox-list/checkbox-list-item.stylex.js',
		upstreamFile: 'CheckboxList/CheckboxListItem.js'
	},
	{
		// BOTH MODES as of upstream 0.3.0, and the reason is worth keeping, because
		// it is the batch-12 rule ("where upstream keeps its styles decides which
		// oracle mode applies") arriving from a new direction: it is not only *where*
		// the styles live, it is whether anything **dynamic** shares their call site.
		//
		// Through 0.2.0 this case was pure inline. Upstream declares Slider's styles
		// inline in the component file, and every `stylex.props(...)` site merged
		// static keys only, so the compiler folded all nine into bitmask-keyed lookups
		// of finished class strings and `dist/Slider.js` carried no style object at
		// all. Every positional value — thumb offset, filled extent, mark placement —
		// is an inline `style` on both sides and never reaches a class.
		//
		// 0.3.0 composes `rtlStyles.centerInline(...)` — a `stylex.create` **function**
		// style — into the track, filled-track and thumb sites, to fix an RTL
		// off-centre bug (see `utils/rtl.stylex.ts`). A conditional whose branch holds
		// a dynamic style cannot fold, so those three sites became runtime merges and
		// `dist/Slider.js` now declares a `styles` object holding exactly the eleven
		// keys they touch: track/trackHorizontal/trackVertical,
		// filledTrack/filledTrackHorizontal/filledTrackVertical, and
		// thumb/thumbHorizontal/thumbHover/thumbFocusVisible/thumbDisabled.
		// `thumbVertical` is gone from both sides — upstream deleted the key when
		// `centerInline('50%')` replaced it.
		//
		// So the sixteen inline entries those sites owned are removed rather than
		// repaired, and **their coverage moves to object mode rather than
		// disappearing**: all eleven keys are diffed as declarations above. What is
		// genuinely no longer checked is the *combinations* — the twelve thumb
		// permutations in particular — and, because `centerInline` is a function
		// style, the helper's own two classes are invisible to this script entirely
		// (the 54-function-style debt in the header). Those were hand-verified once
		// against upstream's compiled `utils/rtlStyles.js`: `_temp` is
		// `{kbCHJM: "x1nrll8i", k3aq6I: "xsqj5wx"}` on both sides.
		//
		// The twelve entries that remain still fold, and the notes on them stand: the
		// row and text readout, the four track-container branches (orientation x
		// disabled), and the orientation pairs for marks container, mark and mark
		// label. There is no `defineMarker` here, so no leftover is tolerated as
		// lookup-table filler and all twelve must be claimed exactly.
		file: 'src/lib/components/slider/slider.stylex.js',
		upstreamFile: 'Slider/Slider.js',
		inline: [
			['styles.sliderRow'],
			['styles.trackContainer', 'styles.trackContainerHorizontal'],
			['styles.trackContainer', 'styles.trackContainerVertical'],
			['styles.trackContainer', 'styles.trackContainerHorizontal', 'styles.trackContainerDisabled'],
			['styles.trackContainer', 'styles.trackContainerVertical', 'styles.trackContainerDisabled'],
			['styles.marksContainer', 'styles.marksContainerHorizontal'],
			['styles.marksContainer', 'styles.marksContainerVertical'],
			['styles.mark', 'styles.markHorizontal'],
			['styles.mark', 'styles.markVertical'],
			['styles.markLabel', 'styles.markLabelHorizontal'],
			['styles.markLabel', 'styles.markLabelVertical'],
			['styles.textValue']
		]
	},
	{
		// Both modes at once. Upstream declares NumberInput's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `styles`/`sizeStyles`, so ours need no rename.
		//
		// Object mode reaches only what `dist/` still carries: a `styles` object
		// holding `wrapper`, `wrapperWithNumberSteppers` and `incrementIcon`, plus
		// all three `sizeStyles` keys. The first two and the size keys ride the
		// wrapper's one runtime `stylex.props`, which merges the shared
		// `inputWrapperStyles` / `inputStatus*Styles` groups, a dynamic
		// `sizeStyles[size]` index, `groupStyles.inGroup` and an `xstyle` spread, so
		// the compiler could fold none of it; `incrementIcon` survives because it is
		// handed to `Icon`'s `xstyle` prop, which is a runtime merge in another
		// component. Those shared groups are `Field`'s and `InputGroup`'s published
		// API, checked in their own modules; composing them here neither re-checks
		// nor double-counts them, since object mode only walks the objects `dist/`
		// declares.
		//
		// `styles.wrapper` is only `zIndex: 1` — the declaration
		// `inputWrapperStyles.base` already makes — so it emits that same class
		// (`x1vjfegm`) rather than one of its own. Upstream keeps it anyway and so do
		// we: `dist/` declares the object, and dropping the key would leave object
		// mode one key short.
		//
		// The other eight `styles` keys have no object in `dist/` at all — and this
		// is the case worth naming, because the six stepper declarations added by
		// #4896 look like function styles and are not. Each is applied at exactly one
		// call site with a statically known combination, so StyleX folded every one
		// into a literal class string: the `<input>` compiles to a four-entry lookup
		// table keyed by `!!isDisabled << 1 | !!!isInputValid << 0`, `units` and
		// `numberSteppers` to one string each, and the two stepper buttons to a
		// two-entry table apiece (enabled/disabled, with `decrementButton` folded
		// into the second pair). Ten inline call sites, all listed below — an
		// `inline:` list, not a skip. `grep -n 'className:'` on the compiled file
		// counts the fold sites directly and is the check to run before reaching for
		// a skip.
		//
		// Order is load-bearing on the two invalid branches: `inputInvalid` narrows
		// `color` only, so it *replaces* `input`'s `x1tgivj0` with `xv1l7n4` rather
		// than joining it, the same merge `TextArea`'s `counterError` relies on.
		// `inputDisabled` narrows `cursor`, which `input` never sets, so it simply
		// joins as `x1h6gzvc`. The stepper pairs are the same shape:
		// `numberStepperButtonDisabled` replaces the button's `color` and
		// `backgroundImage` and joins its `cursor`.
		//
		// `input` and `inputDisabled` are byte-identical to `TextInput`'s — upstream
		// restates them rather than sharing — so the same classes are checked twice
		// over, once against each upstream file. That is the point: the oracle diffs
		// this module against `NumberInput`'s output, and a divergence in either copy
		// has to surface against its own counterpart. (`clearButton` used to be the
		// third such twin; #4876 moved the affordance to the shared
		// `InputClearButton`, so the key and its inline entry are both gone.)
		file: 'src/lib/components/number-input/number-input.stylex.js',
		upstreamFile: 'NumberInput/NumberInput.js',
		inline: [
			['styles.input'],
			['styles.input', 'styles.inputInvalid'],
			['styles.input', 'styles.inputDisabled'],
			['styles.input', 'styles.inputDisabled', 'styles.inputInvalid'],
			['styles.units'],
			['styles.numberSteppers'],
			['styles.numberStepperButton'],
			['styles.numberStepperButton', 'styles.numberStepperButtonDisabled'],
			['styles.numberStepperButton', 'styles.decrementButton'],
			['styles.numberStepperButton', 'styles.decrementButton', 'styles.numberStepperButtonDisabled']
		]
	},
	{
		// Object mode only, and the *reason* is unusual enough to be worth naming:
		// Calendar is one of the few upstream components whose styles already live
		// in a module of their own (`Calendar/styles.ts`) rather than inline in the
		// component file. StyleX folds a merge into a literal class string only
		// when it can see the style declaration and the call site together, so a
		// module boundary defeats it completely — `dist/Calendar/Calendar.js`
		// carries **zero** `className:` literals and all four groups survive as
		// live objects. There is no inline entry to write, and one would fail.
		//
		// All 38 keys across the four groups are diffed. Four of them contribute
		// nothing: `dayCellStyles.dayToday`, `dayTodayInRange` and `daySelected`
		// are declared `{}` upstream — the structural half of a seam whose visual
		// half is in `dayCellTheme` — and compile to a bare `{$$css: true}`, the
		// same shape `Section`'s empty padding keys and `Selector`'s
		// `itemSizeStyles.lg` have. `calendarStyles.srOnly` is declared and never
		// applied; it is ported for object parity rather than pruned.
		file: 'src/lib/components/calendar/calendar.stylex.js',
		upstreamFile: 'Calendar/styles.js'
	},
	{
		// Both modes at once, and `NumberInput`'s shape with one difference.
		// Upstream declares TimeInput's styles inline in the component file rather
		// than a style module, and keeps the group names `styles`/`sizeStyles`, so
		// ours need no rename.
		//
		// Object mode reaches `sizeStyles` alone. Unlike `NumberInput` there is no
		// surviving `styles` object at all — nothing in this module is handed to a
		// runtime merge except the wrapper, and the wrapper takes no key from
		// `styles`. All three `sizeStyles` keys ride the wrapper's one runtime
		// `stylex.props`, which merges the shared `inputWrapperStyles` /
		// `inputStatus*Styles` groups, a dynamic `sizeStyles[size]` index,
		// `groupStyles.inGroup` and an `xstyle` spread, so the compiler could fold
		// none of it. Those shared groups are `Field`'s and `InputGroup`'s published
		// API, checked in their own modules; composing them here neither re-checks
		// nor double-counts them.
		//
		// Each `sizeStyles` key sets `minWidth: 120` as well as its height, so all
		// three carry the same `k7Eaqz` class and differ only in `kZKoxP` — that
		// shared class is the one thing distinguishing this group from
		// `NumberInput`'s, and dropping the `minWidth` would still leave a green
		// height diff. It is the reason this module restates `sizeStyles` rather
		// than reaching for `NumberInput`'s.
		//
		// The five `styles` keys have no object in `dist/`. The `<input>` compiles
		// to a four-entry lookup table keyed by
		// `!!isDisabled << 1 | !!!isInputValid << 0`, and `icon` and `clearButton`
		// each to a single literal class string — the six inline call sites below.
		// Order is load-bearing on the two invalid branches: `inputInvalid` narrows
		// `color` only, so it *replaces* `input`'s `x1tgivj0` with `xv1l7n4` rather
		// than joining it, the same merge `NumberInput` relies on.
		//
		// `input`, `inputDisabled` and `inputInvalid` are byte-identical to
		// `NumberInput`'s and `TextInput`'s — upstream restates them rather than
		// sharing — so the same classes are checked three times over, once against
		// each upstream file. That is the point: a divergence in any copy has to
		// surface against its own counterpart.
		//
		// `styles.clearButton` was a sixth call site until 0.4.x (#4876) converged
		// the family's clear buttons on the shared `InputClearButton`. It is gone
		// from both sides, along with the literal class string it folded to.
		file: 'src/lib/components/time-input/time-input.stylex.js',
		upstreamFile: 'TimeInput/TimeInput.js',
		inline: [
			['styles.icon'],
			['styles.input'],
			['styles.input', 'styles.inputInvalid'],
			['styles.input', 'styles.inputDisabled'],
			['styles.input', 'styles.inputDisabled', 'styles.inputInvalid']
		]
	},
	{
		// Both modes at once, `TimeInput`'s shape with a different chrome split.
		// Upstream declares DateInput's styles inline in the component file rather
		// than a style module, and keeps the group names `styles`/`sizeStyles`, so
		// ours need no rename.
		//
		// Object mode reaches `sizeStyles` for the same reason `TimeInput`'s does:
		// all three keys ride the wrapper's one runtime `stylex.props`, which merges
		// the shared `inputWrapperStyles` / `inputStatus*Styles` groups, a dynamic
		// `sizeStyles[size]` index, `groupStyles.inGroup` and an `xstyle` spread.
		// (`statusIconMap`/`statusIconColorMap` are plain string maps, not
		// `stylex.create` output, so the extractor skips them — their values are
		// string literals rather than nested style objects.)
		//
		// It reaches `styles.iconButton`/`styles.iconButtonDisabled` too, and that
		// is 0.4.x. Two changes landed on the calendar toggle at once: it composes
		// the shared `focusOutlineStyles.focusVisible` (an import from another
		// module, which the compiler cannot fold into a literal), and the trailing
		// clear button — the *other* site those two keys used to serve — converged
		// on `InputClearButton` (#4876). So upstream's `dist/` now carries the pair
		// as objects with no literal string left, and the two `inline` claims this
		// list used to open with are gone rather than merely renamed.
		//
		// The remaining three `styles` keys are the four inline call sites below.
		// Order is load-bearing on the two invalid branches: `inputInvalid` narrows
		// `color` only, so it *replaces* `input`'s `x1tgivj0` with `xv1l7n4` rather
		// than joining it — the same merge `TimeInput` and `NumberInput` rely on.
		file: 'src/lib/components/date-input/date-input.stylex.js',
		upstreamFile: 'DateInput/DateInput.js',
		inline: [
			['styles.input'],
			['styles.input', 'styles.inputDisabled'],
			['styles.input', 'styles.inputInvalid'],
			['styles.input', 'styles.inputDisabled', 'styles.inputInvalid']
		]
	},
	{
		// Both modes at once. Object mode reaches `sizeStyles` — the same
		// wrapper-merge story as `DateInput` — plus the four keys 0.4.x moved off
		// the inline list. (`statusIconMap`/`statusIconColorMap` are plain string
		// maps, not `stylex.create` output, so the extractor skips them.)
		//
		// `iconButton`/`iconButtonDisabled` went the way `DateInput`'s did: the
		// calendar toggle composes the imported `focusOutlineStyles.focusVisible`,
		// and the clear button that shared the pair converged on `InputClearButton`
		// (#4876). `presetButton`/`presetButtonActive` moved for the first half of
		// that reason alone — the preset rail's buttons compose the same shared
		// ring, so the compiler can no longer fold either branch.
		//
		// The six inline call sites are what is left. Two things about the trigger's
		// four are worth naming, because both are merges rather than accumulations:
		// `triggerPlaceholder` narrows `color` only, so it *replaces* `trigger`'s
		// `x1tgivj0` with `xv1l7n4`; `triggerDisabled` narrows `cursor`, which
		// `trigger` already sets to `pointer`, so it likewise replaces rather than
		// joins. All four combinations are reachable — a disabled field with no
		// value shows the placeholder — so none is a correlated-pair artifact.
		//
		// This component composes **no** `groupStyles.inGroup`, unlike every other
		// input in the family: upstream never reads the `InputGroup` context here.
		file: 'src/lib/components/date-range-input/date-range-input.stylex.js',
		upstreamFile: 'DateRangeInput/DateRangeInput.js',
		inline: [
			['styles.trigger'],
			['styles.trigger', 'styles.triggerPlaceholder'],
			['styles.trigger', 'styles.triggerDisabled'],
			['styles.trigger', 'styles.triggerPlaceholder', 'styles.triggerDisabled'],
			['styles.popoverLayout'],
			['styles.presetSidebar']
		]
	},
	{
		// Both modes at once, and the only member of the date/time family with a
		// surviving `styles` object *and* inline sites in the same module.
		//
		// Object mode reaches `styles.row`, `styles.dateWrapper`, `styles.timeWrapper`
		// and all three `sizeStyles`. `row` survives because it merges an `xstyle`
		// spread; the two wrappers because each rides a runtime `stylex.props` that
		// also merges the shared `inputWrapperStyles` / `inputStatus*Styles` groups
		// and a dynamic `sizeStyles[size]` index. `dateWrapper` and `timeWrapper` are
		// byte-identical declarations and therefore carry identical class pairs —
		// upstream declares both, and dropping either would leave a `dist/` key
		// unaccounted for.
		//
		// `iconButton`/`iconButtonDisabled` joined them at 0.4.x, for `DateInput`'s
		// two reasons at once: the calendar toggle composes the imported
		// `focusOutlineStyles.focusVisible`, and the clear button that shared the
		// pair converged on `InputClearButton` (#4876).
		//
		// The remaining three `styles` keys are the five inline sites below. The
		// four-entry input table is shared by *both* `<input>`s — the date field and
		// the time field pass the same three keys in the same order — so upstream
		// emits four strings rather than eight, and listing the combination once is
		// correct rather than an under-count.
		file: 'src/lib/components/date-time-input/date-time-input.stylex.js',
		upstreamFile: 'DateTimeInput/DateTimeInput.js',
		inline: [
			['styles.icon'],
			['styles.input'],
			['styles.input', 'styles.inputDisabled'],
			['styles.input', 'styles.inputInvalid'],
			['styles.input', 'styles.inputDisabled', 'styles.inputInvalid']
		]
	},
	{
		// Both modes at once. Upstream declares FileInput's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `styles`/`statusBorderStyles`, so ours need no rename.
		//
		// Object mode reaches the six keys `dist/` still carries in `styles` —
		// `dropzone`, `dropzoneHover`, `dropzoneActive`, `dropzoneDisabled`,
		// `compact`, `compactDisabled` — plus all three `statusBorderStyles`. They
		// ride the trigger's one runtime `stylex.props`, which picks between the
		// dashed dropzone and the solid compact row, layers four conditionals and the
		// status border on top and spreads `xstyle`, so the compiler could fold none
		// of it. FileInput does *not* compose `Field`'s `inputWrapperStyles`:
		// upstream restates the whole surface twice because the border style, padding
		// and axis all differ between the two modes, and ours restates it the same
		// way — so unlike `TextInput`/`NumberInput` these chrome keys are checked
		// here and nowhere else.
		//
		// The remaining seven `styles` keys have no object in `dist/` at all. Two of
		// the strings below need saying out loud:
		//
		// `hiddenInput` and `liveRegion` are byte-identical declaration blocks, so
		// their two call sites emit the *same* class string — `dist/` carries the
		// literal twice, and the extractor keys upstream's inline strings by content.
		// Listing `liveRegion` as well would ask the oracle for a second copy of a
		// string it holds once, as `Breadcrumbs`' supporting-link pair would, so the
		// one `hiddenInput` entry covers both.
		//
		// The compact label is a four-entry lookup table with only two reachable
		// entries: upstream writes two ternaries that both read `hasFiles`
		// (`fileNameText : placeholderText`, then `fileNameCompact :
		// placeholderCompact`), and the compiler enumerates all four permutations
		// without noticing the conditions are correlated. `fileNameText +
		// placeholderCompact` costs nothing — `placeholderCompact`'s `flex: 1` and
		// `minWidth: 0` are declarations `fileNameText` already makes, so it collapses
		// onto the reachable `fileNameText + fileNameCompact` string and is not listed
		// twice. `placeholderText + fileNameCompact` folds to a string of its own and
		// *is* listed: the artifact tolerance that swallows `Switch`'s unreachable
		// permutations is reached only through the marker path, and this case has no
		// marker, so an unclaimed leftover would read as a style upstream applies and
		// we do not. Claiming it still compares real classes — our merge of those two
		// keys against the string upstream's compiler folded — it is only the runtime
		// that never reaches the branch.
		file: 'src/lib/components/file-input/file-input.stylex.js',
		upstreamFile: 'FileInput/FileInput.js',
		inline: [
			['styles.hiddenInput'],
			['styles.fileNameText', 'styles.fileNameDropzone'],
			['styles.placeholderText'],
			['styles.fileNameText'],
			['styles.placeholderText', 'styles.placeholderCompact'],
			['styles.fileNameText', 'styles.fileNameCompact'],
			['styles.placeholderText', 'styles.fileNameCompact']
		]
	},
	{
		// Both modes at once. Upstream declares CodeBlock's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `containerStyles`/`dynamicStyles`/`styles`, so ours need no rename.
		//
		// Object mode reaches eight keys: both `containerStyles` variants, which are
		// picked by a dynamic `containerStyles[container]` index, and the six `styles`
		// keys that ride a call site the compiler could not fold — `root` merges
		// `dynamicStyles.width(...)`, that container index and an `xstyle` spread,
		// while `code`, `codeWrapped`, `codeNumbered`, `sizeSm` and `sizeMd` all reach
		// the `<code>` element's `stylex.props` beside `dynamicStyles.gutterWidth(...)`.
		//
		// `dynamicStyles` compiles to functions on both sides, so neither extractor
		// sees it and there is nothing to diff for it — the `grid.stylex.js`
		// precedent. `gutterWidth`'s static half is hoisted to a top-level `_temp`
		// object in `dist/`, but its members are class strings rather than nested
		// style objects, so `extractGroups` does not mistake it for a group.
		//
		// The other 21 `styles` keys have no object in `dist/` at all: each of their
		// call sites is a plain `stylex.props` of static keys, so the compiler folded
		// all of them into literal class strings. The 21 entries below are those
		// strings — the line div's four-entry table keyed by
		// `!!lineNumbers << 1 | !!isHighlighted << 0`, the chunk and line-content
		// wrappers, the copy button with and without its absolute placement, the
		// header row's divider/compact pick, the header control with and without its
		// collapsible affordance, the title, the chevron's rotated pair, the scroll
		// container, the code wrapper's compact pair, the collapse grid's pair and its
		// inner clip.
		//
		// Two of the merges are load-bearing rather than additive. `collapseGridCollapsed`
		// narrows `gridTemplateRows` only, so it *replaces* `collapseGrid`'s `1fr`
		// (`x1tu4anv`) with `0fr` (`xihq33y`) instead of joining it — the emitted
		// string is one class shorter, which is the merge working. And
		// `headerWithDivider`/`headerCompact` are an either/or pick that both set
		// `paddingBlock`, so each branch carries `xce4md1` once.
		//
		// `styles.lineContent` folds to the single class `xeuugli`, which is also the
		// `flex: 1` `styles.header` already carries; upstream's `dist/` holds it as its
		// own one-class string, so it is a distinct call site rather than a duplicate.
		//
		// Four keys are **object** mode for two different 0.4.x reasons, and neither
		// leaves an inline claim to make. `header`/`headerCollapsible` go through
		// `focusOutlineProps.focusVisible(...)` (#4654), a runtime call the compiler
		// cannot fold. `copyButton`/`copyButtonAbsolute` ride `IconButton`'s `xstyle`
		// (#4867), and `collapseChevronIcon`/`collapseChevronExpanded` ride the
		// chevron `Icon`'s (#4838) — all three cross a component boundary, so they
		// survive in `dist/` as objects. Verified against `dist/CodeBlock/CodeBlock.js`.
		file: 'src/lib/components/code-block/code-block.stylex.js',
		upstreamFile: 'CodeBlock/CodeBlock.js',
		inline: [
			['styles.line'],
			['styles.line', 'styles.lineHighlighted'],
			['styles.line', 'styles.lineNumbered'],
			['styles.line', 'styles.lineNumbered', 'styles.lineHighlighted'],
			['styles.lineChunk'],
			['styles.lineContent'],
			['styles.headerRow', 'styles.headerWithDivider'],
			['styles.headerRow', 'styles.headerCompact'],
			['styles.headerTitle'],
			['styles.collapseChevron'],
			['styles.scrollContainer'],
			['styles.codeWrapper'],
			['styles.codeWrapper', 'styles.codeWrapperCompact'],
			['styles.collapseGrid'],
			['styles.collapseGrid', 'styles.collapseGridCollapsed'],
			['styles.collapseInner']
		]
	},
	{
		// Both modes at once. Upstream declares Selector's styles inline in the
		// component file rather than a style module, and keeps the group names
		// `styles`/`sizeStyles`/`itemSizeStyles`, so ours need no rename.
		//
		// Object mode reaches the `styles` keys `dist/` still declares (0.3.0's ghost
		// trigger adds `triggerGhost` and `triggerGhostDisabled`) plus all three
		// `sizeStyles` and all three `itemSizeStyles`. Two runtime call sites are
		// what keep most of them from folding: the trigger container merges `Field`'s
		// `inputWrapperStyles` / `inputStatus*Styles`, a dynamic `sizeStyles[size]`
		// index, `groupStyles.inGroup` and an `xstyle` spread; the option row merges
		// a dynamic `itemSizeStyles[size]` index with three conditionals. Those
		// shared `Field`/`InputGroup` groups are checked in their own modules, so
		// composing them here neither re-checks nor double-counts them.
		//
		// `styles.popover`, `styles.divider`, and — new at 0.4.1 — `triggerIcon`,
		// `triggerIconRotation`, `triggerIconOpen` and `searchRowInput` survive as
		// objects for a second reason: each is handed to another component's
		// `xstyle` (`<Layer>`'s, `<Divider>`'s, the chevron `<Icon>`'s, and
		// `PanelSearchInput`'s), so the compiler cannot see the call site at all.
		// `itemSizeStyles.lg` is an empty declaration on both sides, so its object is
		// `{$$css: true}` and it contributes no pairs — the same shape `Section`'s
		// empty padding keys have.
		//
		// **`statusButton` moved inline → object at 0.4.1**, and the atoms did not
		// change at all: its one call site now merges `focusOutlineStyles.focusVisible`
		// from `utils/focusOutline.stylex`, and a style imported across a module
		// boundary defeats the fold. Only the mode was wrong, which is exactly the
		// failure an oracle that checked one mode only would have missed.
		//
		// The remaining `styles` keys have no object in `dist/` and are the ten
		// inline call sites below, except `itemCheckmark`, which is **dead
		// upstream** — declared and never applied, so `dist/` folds it away entirely
		// and there is nothing to diff it against in either mode. That is the reverse
		// of a skip (a skip excuses a key upstream has and we defer), and it is the
		// same standing `tab-menu.stylex.js`'s identically-named key and
		// `Collapsible`'s `triggerDisabled` already have.
		//
		// The four dropdown entries are one call site's conditional matrix, not four
		// sites: `dropdownInput` is gated on `variant !== 'ghost'` and `dropdownHidden`
		// on `!isPositioned`, and the compiler folds every combination. `dropdownInput`
		// narrows `paddingInline` only, so it *replaces* the base's `x7a5moj` with
		// `x2hg6jq` rather than joining it — the emitted string stays the same length,
		// which is the merge working.
		file: 'src/lib/components/selector/selector.stylex.js',
		upstreamFile: 'Selector/Selector.js',
		inline: [
			['styles.trigger'],
			['styles.triggerLabel'],
			['styles.dropdown'],
			['styles.dropdown', 'styles.dropdownInput'],
			['styles.dropdown', 'styles.dropdownHidden'],
			['styles.dropdown', 'styles.dropdownInput', 'styles.dropdownHidden'],
			['styles.emptyState'],
			['styles.sectionHeading'],
			['styles.itemContent'],
			['styles.itemMarkColumn']
		]
	},
	{
		// Object mode. `embeddedStyles.root` is never resolved to a class here — it
		// is handed to `Item`'s `xstyle` as `[embeddedStyles.root, xstyle]`, so the
		// compiler cannot fold it and `dist/` keeps the object. Upstream declares it
		// inline in `SelectorOption.tsx` under the same group name, so no rename.
		file: 'src/lib/components/selector/selector-option.stylex.js',
		upstreamFile: 'Selector/SelectorOption.js'
	},
	{
		// Both modes at once. Upstream declares Pagination's styles inline in the
		// component file and keeps the group name `styles`, so ours needs no rename.
		//
		// Object mode reaches six keys. `root` rides the `<nav>`'s runtime
		// `stylex.props(styles.root, xstyle)`, which the compiler cannot fold
		// because of the spread; `activePage` survives because it is handed to
		// `Button`'s `xstyle`, so the call site is in another component entirely —
		// the same reason `Selector`'s `popover`/`divider`/`sectionDivider` do.
		//
		// **`dot`/`dotSm`/`dotActive`/`dotDisabled` joined them at upstream 0.4.1
		// (#4973), and their eight inline permutations are deleted rather than
		// repaired.** They were right for 0.3.0, when the dots folded into an
		// eight-entry lookup table keyed by
		// `!!isSm << 2 | !!isActive << 1 | !!isDisabled << 0`. #4973 routes the dot
		// through the shared focus ring — `Pagination.js` now reads
		// `focusOutlineProps.focusVisible(styles.dot, isSm && styles.dotSm, …)` —
		// and a *runtime* `stylex.props` call folds nothing, so `dist/` carries all
		// four as plain `$$css` objects and emits no inline string for them.
		// `pagination.stylex.ts` makes the same call, so the shapes agree.
		//
		// Six of the remaining keys are the inline call sites below. Two
		// of those sites emit a string another site already emits, and the extractor
		// keys upstream's inline strings by content, so each is listed once: the
		// `count` and `compact` variants both render `infoText` (the same `<span>`
		// wrapper, one string in `dist/`), and `controls` and `dotsContainer` are
		// byte-identical declaration blocks (`display:flex; align-items:center;
		// gap:--spacing-1`) that therefore fold to the same class list. That is the
		// `FileInput` `hiddenInput`/`liveRegion` case exactly.
		//
		// The twelfth, `styles.disabled`, is **dead upstream** — declared and never
		// applied, since the disabled treatment is each `Button`'s own `isDisabled`
		// plus `dotDisabled` on the dots — so `dist/` folds it away and there is
		// nothing to diff it against in either mode. The reverse of a skip, as
		// `Selector`'s `itemCheckmark` and `Collapsible`'s `triggerDisabled` are.
		//
		// `styles.pageSizeSelectorControl` is gone with #4775, which deleted the
		// `width:80` wrapper `<div>` outright and passes
		// `width={PAGE_SIZE_SELECTOR_WIDTH}` to `<Selector>` instead. The prop
		// rather than an `xstyle` is load-bearing: Selector's `xstyle` lands on the
		// trigger box while `width` sizes the whole field, which is what the
		// wrapper was doing — moving the style to `xstyle` would have silently
		// narrowed what it applied to.
		file: 'src/lib/components/pagination/pagination.stylex.js',
		upstreamFile: 'Pagination/Pagination.js',
		inline: [
			['styles.ellipsis'],
			['styles.ellipsis', 'styles.ellipsisSm'],
			['styles.infoText'],
			['styles.dotsContainer'],
			['styles.pageSizeSelector'],
			// 0.3.0's `input` variant. `inputTotal` / `inputTotalSm` are DELIBERATELY
			// unclaimed: upstream declares them identically to `inputLabel` /
			// `inputLabelSm`, so the compiler hashes both pairs to the same atomic
			// classes and `dist/` carries one string per pair. `upstreamInline` is a
			// Set, so a second claim would find the string already deleted and report
			// a spurious "upstream has no matching call site". The total's own keys are
			// checked by hash identity with the label's.
			['styles.inputGroup'],
			['styles.inputLabel'],
			['styles.inputLabel', 'styles.inputLabelSm']
		]
	},
	{
		// Both modes at once. Upstream declares BaseTypeahead's styles inline in the
		// component file and keeps the group names `styles`/`itemSizeStyles`, so
		// neither needs a rename.
		//
		// Object mode reaches seven `styles` keys plus all three `itemSizeStyles`.
		// `input`/`inputDisabled` ride the `<input>`'s runtime `stylex.props`, which
		// spreads the caller's `inputXStyle`; `item`/`itemHighlighted`/`itemSelected`
		// ride the option row's, which indexes `itemSizeStyles[size]` dynamically;
		// and `popover`/`popoverGap` survive because they are handed to the layer's
		// `xstyle` as an array, so the call site is in another component entirely —
		// the same reason `Selector`'s `popover` does.
		//
		// The other four keys have no object in `dist/` and are the inline call
		// sites below. `dropdown` folds even though it sits inside a `mergeProps`
		// with `themeProps`, because `mergeProps` takes the finished `stylex.props`
		// result — the compiler had already resolved it.
		file: 'src/lib/components/typeahead/base-typeahead.stylex.js',
		upstreamFile: 'Typeahead/BaseTypeahead.js',
		inline: [
			['styles.loadingSpinner'],
			['styles.dropdown'],
			['styles.emptyState'],
			['styles.itemContent']
		]
	},
	{
		// Object mode only — upstream's `Typeahead.tsx` has no folded call site at
		// all. The wrapper merges `Field`'s `inputWrapperStyles`/`inputStatus*Styles`,
		// a dynamic `wrapperSizeStyles[size]` index, `groupStyles.inGroup` and an
		// `xstyle` spread, so nothing there could fold; `token`, `inputHidden` and
		// the two `clearButton` keys are all handed to a *child* component's
		// `xstyle` (`Token`, `BaseTypeahead`, `InputClearButton`), so the compiler
		// never sees their call sites either. Group names are upstream's
		// (`styles`/`wrapperSizeStyles`), so neither needs a rename.
		file: 'src/lib/components/typeahead/typeahead.stylex.js',
		upstreamFile: 'Typeahead/Typeahead.js'
	},
	{
		// Inline mode only — `dist/` declares no style object for TypeaheadItem at
		// all. Every one of its five keys reaches a `stylex.props` call of static
		// keys, so the compiler folded each to a literal class string: the container
		// with and without `disabled`, then the content column, the label and the
		// description.
		file: 'src/lib/components/typeahead/typeahead-item.stylex.js',
		upstreamFile: 'Typeahead/TypeaheadItem.js',
		// The container's two combinations moved to object mode at 0.2.0: the call
		// site gained `xstyle`, so the compiler could no longer fold it to a
		// literal and emitted `styles.container` / `styles.disabled` as objects
		// instead. They are still compared — by key, above — just not as strings.
		inline: [['styles.content'], ['styles.label'], ['styles.description']]
	},
	{
		// Both modes at once. Upstream declares MultiSelector's styles inline in the
		// component file and keeps all four group names
		// (`styles`/`sizeStyles`/`itemSizeStyles`/`selectAllSizeStyles`), so none
		// needs a rename.
		//
		// Object mode reaches the `styles` keys `dist/` still declares (0.3.0's ghost
		// trigger adds `triggerGhost` and `triggerGhostDisabled`) plus all three size
		// ramps. `triggerContainer`/`triggerPlaceholder` ride the container's runtime
		// `stylex.props`, which merges `Field`'s wrapper/status groups, a dynamic
		// `sizeStyles[size]` index, `groupStyles.inGroup` and an `xstyle` spread;
		// `item`/`selectAllWrapper`/`itemHighlighted`/`itemDisabled` ride the option
		// row's, which indexes two size ramps dynamically; and `popover`, `divider`
		// and — new at 0.4.1 — `triggerIcon`, `triggerIconRotation` and
		// `triggerIconOpen` survive because each is handed to another component's
		// `xstyle` (`<Layer>`'s, `<Divider>`'s and the chevron `<Icon>`'s), so the
		// compiler cannot see the call site at all — the same reason `Selector`'s do.
		//
		// **`statusButton` moved inline → object at 0.4.1**, with unchanged atoms:
		// its call site now merges `focusOutlineStyles.focusVisible` across a module
		// boundary, which defeats the fold. `Selector`'s identical key made the same
		// move for the same reason.
		//
		// The remaining `styles` keys have no object in `dist/` and are the eleven
		// inline call sites below. The checkbox contributes two: `checkboxDecorativeEnd`
		// is new at 0.4.1 and adds `marginInlineStart: auto` for
		// `indicatorPosition="end"`, so the pair is an additive merge rather than a
		// replacement.
		file: 'src/lib/components/multi-selector/multi-selector.stylex.js',
		upstreamFile: 'MultiSelector/MultiSelector.js',
		inline: [
			['styles.trigger'],
			['styles.triggerContent'],
			['styles.triggerText'],
			['styles.triggerBadges'],
			['styles.triggerOverflow'],
			['styles.dropdown'],
			['styles.sectionHeading'],
			['styles.checkboxDecorative'],
			['styles.checkboxDecorative', 'styles.checkboxDecorativeEnd'],
			['styles.itemLabel'],
			['styles.emptyState']
		]
	},
	{
		// Both modes at once. Upstream declares Tokenizer's styles inline in the
		// component file and keeps all five group names, so none needs a rename.
		//
		// Object mode reaches eight `styles` keys plus all four size ramps: the two
		// wrapper keys and the two truncation/at-max keys ride runtime
		// `stylex.props` calls that merge `Field`'s groups with dynamic size
		// indexes, `token`/`inputAtMax`/`inputCompact`/`layerPopover` are handed to
		// a *child*'s `xstyle` (`Token`, `BaseTypeahead`, `<Layer>`), and
		// `endSection` merges a dynamic `endSectionSizeStyles[size]`.
		//
		// `styles.token` appears in **both** modes: the object survives for the
		// `Token` `xstyle` above, and the `renderToken` branch also wraps a custom
		// token in a `<span {...stylex.props(styles.token)}>`, which folds. The two
		// leftover keys are folded-only — the start-icon inset (a lone conditional,
		// so only its true branch emits a string) and the `+N more` text.
		file: 'src/lib/components/tokenizer/tokenizer.stylex.js',
		upstreamFile: 'Tokenizer/Tokenizer.js',
		inline: [['styles.token'], ['styles.startIconWithTokens'], ['styles.overflowText']]
	},
	{
		// Pure object mode, and the only case whose upstream file is a *shared*
		// style module rather than a component. Nothing in `navItemStyles.stylex.js`
		// is applied at a call site of its own — every key is merged into some other
		// component's `stylex.props` — so the compiler had nothing to fold and
		// `dist/` keeps the whole group. The group name matches ours, so no rename.
		file: 'src/lib/components/nav-item/nav-item.stylex.js',
		upstreamFile: 'NavItem/navItemStyles.stylex.js'
	},
	{
		// Object mode. Every key rides a merge the compiler could not fold: the
		// dialog takes four conditionals plus an `xstyle` spread, the drawer a
		// dynamic `dynamicStyles.width(width)` and four conditionals, and the header
		// a dynamic `dynamicStyles.width(width)` and four conditionals. The header row
		// is the one merge the compiler *could* fold: `!header && styles.headerNoTitle`
		// is a lone boolean over two static keys, so it emitted one literal string per
		// branch and dropped both keys from the object — hence two inline entries for
		// what reads as a single call site. `dynamicStyles.width` compiles to a
		// function on both sides, which neither mode reaches.
		//
		// `headerText` left the inline list at 0.4.x: #4775 dropped the style-only
		// `<span>` that wrapped a string header and put the inset on
		// `<Heading xstyle>` instead, so it crosses a component boundary and the
		// compiler has no element of its own to fold it onto. Object mode has it.
		file: 'src/lib/components/mobile-nav/mobile-nav.stylex.js',
		upstreamFile: 'MobileNav/MobileNav.js',
		inline: [['styles.header'], ['styles.header', 'styles.headerNoTitle'], ['styles.content']]
	},
	{
		// Both modes. Only the two root merges survived as objects (each takes an
		// `xstyle` spread); every slot wrapper is a lone static call site and
		// folded. `styles.drawerExtraContent` is an **empty** object on both sides —
		// it compiles to nothing and upstream's `dist/` spreads `...{}`, so the div
		// carries no class attribute and there is no string to diff.
		//
		// `drawerDivider` joined them at 0.4.x: #4775 dropped the style-only
		// `<div>` that wrapped the rule, so the margin now rides `<Divider xstyle>`
		// — a component prop the compiler cannot fold, and `dist/` carries the
		// object.
		file: 'src/lib/components/top-nav/top-nav.stylex.js',
		upstreamFile: 'TopNav/TopNav.js',
		inline: [
			['styles.leftSection'],
			['styles.heading'],
			['styles.startContent'],
			['styles.centerContent'],
			['styles.rightSection'],
			['styles.endContent'],
			['styles.mobileBarEnd'],
			['styles.drawerItems']
		]
	},
	{
		// Pure object mode. Both branches merge a conditional and an `xstyle`
		// spread, so the compiler folded neither, and `drawerFocus` rides the
		// drawer merge. `navItemStyles` is diffed over in its own case.
		file: 'src/lib/components/top-nav/top-nav-item.stylex.js',
		upstreamFile: 'TopNav/TopNavItem.js'
	},
	{
		// Both modes. `root`, `menuTrigger` and `popoverOverlap` stay objects; the
		// text/logo wrappers are each one static call site.
		//
		// `chevron`, `chevronGlyph` and `popoverChevron` are objects as of 0.4.x:
		// #4838 dropped the `<span>` wrappers around the glyph, so all three now
		// ride an `<Icon xstyle={[…]}>` **array**, which the compiler cannot fold.
		// `['styles.chevron', 'styles.interactive']` survives as the one folded
		// chevron site left — the trigger `<button>`, which keeps its own
		// `stylex.props` because it owns the accessible name and the handlers.
		//
		// `styles.popover` is declared upstream and **applied nowhere** — only
		// `popoverOverlap` reaches a layer. StyleX drops unreferenced keys, so
		// upstream's `dist/` has no counterpart and the key is simply uncompared;
		// it is ported for shape parity, not for output.
		//
		// `superheading` and `subheading` compile to the *same* class string, so
		// one inline entry covers both call sites — the `Breadcrumbs` link-pair
		// precedent.
		file: 'src/lib/components/top-nav/top-nav-heading.stylex.js',
		upstreamFile: 'TopNav/TopNavHeading.js',
		inline: [
			['styles.logo'],
			['styles.textContainer'],
			['styles.superheading'],
			['styles.heading'],
			['styles.heading', 'styles.headingLink'],
			['styles.headingRow'],
			['styles.chevron', 'styles.interactive'],
			['styles.headerEndContent'],
			['styles.popoverContent'],
			['styles.popoverHeading']
		]
	},
	{
		// Both modes, two groups. `drawerStyles.header` and `drawerStyles.item` ride
		// merges with `navItemStyles.item`, so they stayed objects. Everything
		// listed below is a lone folded call site; `drawerStyles.items` carries a
		// boolean conditional, which the compiler emits as one literal per branch —
		// hence two entries for what reads as a single site.
		//
		// Five more keys became objects at 0.4.x, none of them foldable:
		// `trigger`/`triggerOpen` and `menuItem` now route through
		// `focusOutlineProps.focusVisible(...)` (#4654), and `chevron`/`chevronOpen`
		// plus `drawerStyles.chevron`/`chevronExpanded` ride `<Icon xstyle={[…]}>`
		// arrays after #4838 dropped their wrapper `<span>`s. `menuOffset` is gone
		// from the group entirely — #4951 deleted the key and passes the token to
		// `render`'s `offset` instead of baking a `marginBlockStart`.
		file: 'src/lib/components/top-nav/top-nav-menu.stylex.js',
		upstreamFile: 'TopNav/TopNavMenu.js',
		inline: [
			['styles.menuContainer'],
			['styles.menuItemIcon'],
			['styles.menuItemContent'],
			['styles.menuItemTitle'],
			['styles.menuItemDescription'],
			['drawerStyles.section'],
			['drawerStyles.items'],
			['drawerStyles.items', 'drawerStyles.itemsExpanded'],
			['drawerStyles.itemsInner'],
			['drawerStyles.itemIcon'],
			['drawerStyles.itemText'],
			['drawerStyles.itemDescription']
		]
	},
	{
		// Both modes. `panelAnimation` and `panelViewportFit` (both handed to the
		// layer's `xstyle`) and `drawerHeader` (merged with `navItemStyles.item`)
		// stayed objects.
		//
		// Seven more joined them at 0.4.x, none foldable: `trigger`/`triggerOpen`
		// route through `focusOutlineProps.focusVisible(...)` (#4654);
		// `chevron`/`chevronOpen` and `drawerChevron`/`drawerChevronExpanded` ride
		// `<Icon xstyle={[…]}>` arrays after #4838 dropped their wrapper `<span>`s;
		// and `menuWrapper` is now `<Grid xstyle>` — a component prop — after #4775
		// dropped the style-only `<div>` around the grid.
		file: 'src/lib/components/top-nav/top-nav-mega-menu.stylex.js',
		upstreamFile: 'TopNav/TopNavMegaMenu.js',
		inline: [
			['styles.panelContainer'],
			['styles.panelContent'],
			['styles.featured'],
			['styles.drawerSection'],
			['styles.drawerItems'],
			['styles.drawerItems', 'styles.drawerItemsExpanded'],
			['styles.drawerItemsInner'],
			['styles.drawerFeatured']
		]
	},
	{
		// Both modes. `drawerItem` stays an object (it rides a merge with
		// `navItemStyles.item`), and so does `desktop` as of 0.4.x — #4654 routes
		// the desktop card through `focusOutlineProps.focusVisible(...)`, which the
		// compiler cannot fold. Both content columns folded.
		//
		// `drawerItemDescription` has **no entry of its own on purpose**: it declares
		// the same four properties as `desktopDescription` in a different order, so
		// both fold to the same atomic class *set* and the extractor — which keys
		// inline strings by content — sees one. The `desktopDescription` entry covers
		// both call sites, as the `Breadcrumbs` link pair and `CommandPaletteFooter`'s
		// three key hints already do.
		file: 'src/lib/components/top-nav/top-nav-mega-menu-item.stylex.js',
		upstreamFile: 'TopNav/TopNavMegaMenuItem.js',
		inline: [
			['styles.desktopIcon'],
			['styles.desktopContent'],
			['styles.desktopTitle'],
			['styles.desktopDescription'],
			['styles.drawerItemIcon'],
			['styles.drawerItemContent']
		]
	},
	{
		// Both modes. `root` takes an `xstyle` spread and stays an object; the five
		// inner elements are each one static call site.
		file: 'src/lib/components/top-nav/top-nav-mega-menu-featured-card.stylex.js',
		upstreamFile: 'TopNav/TopNavMegaMenuFeaturedCard.js',
		inline: [
			['styles.image'],
			['styles.body'],
			['styles.title'],
			['styles.description'],
			['styles.link']
		]
	},
	{
		// Both modes. Only the two roots survive as objects (each takes an `xstyle`
		// spread). The scrollable middle is the interesting one: its padding depends
		// on which sticky blocks exist, so the compiler folded the four `scrollable*`
		// keys into an eight-entry lookup keyed on
		// `collapsed << 2 | hasStickyTop << 1 | hasStickyBottom` — every combination
		// is listed rather than sampled, which is what makes the table verifiable.
		//
		// `styles.topContent` is an **empty** object on both sides and emits no
		// class, so it has no entry. `footerIcons`/`footerIconsCollapsed` are
		// declared upstream and applied nowhere (the slot renders bare inside
		// `footerRow`); StyleX drops unreferenced keys, so they are uncompared and
		// need no skip.
		//
		// `footerRow` has no entry of its own: it declares the same three
		// properties as `drawerFooterIcons`, so both fold to one class set and the
		// extractor — which keys inline strings by content — sees a single string.
		// The `drawerFooterIcons` entry covers both, as the `Breadcrumbs` link pair
		// already does. Its *collapsed* variant adds `flex-direction` and so is a
		// distinct set with an entry of its own.
		file: 'src/lib/components/side-nav/side-nav.stylex.js',
		upstreamFile: 'SideNav/SideNav.js',
		inline: [
			['styles.topbarIcons'],
			['styles.drawerFooter'],
			['styles.drawerFooterIcons'],
			['styles.stickyTop'],
			['styles.stickyTop', 'styles.stickyTopCollapsed'],
			['styles.scrollable', 'styles.scrollableNoTop', 'styles.scrollableNoBottom'],
			['styles.scrollable', 'styles.scrollableNoTop', 'styles.scrollableWithBottom'],
			['styles.scrollable', 'styles.scrollableWithTop', 'styles.scrollableNoBottom'],
			['styles.scrollable', 'styles.scrollableWithTop', 'styles.scrollableWithBottom'],
			[
				'styles.scrollable',
				'styles.scrollableCollapsed',
				'styles.scrollableNoTop',
				'styles.scrollableNoBottom'
			],
			[
				'styles.scrollable',
				'styles.scrollableCollapsed',
				'styles.scrollableNoTop',
				'styles.scrollableWithBottom'
			],
			[
				'styles.scrollable',
				'styles.scrollableCollapsed',
				'styles.scrollableWithTop',
				'styles.scrollableNoBottom'
			],
			[
				'styles.scrollable',
				'styles.scrollableCollapsed',
				'styles.scrollableWithTop',
				'styles.scrollableWithBottom'
			],
			['styles.stickyBottom'],
			['styles.stickyBottom', 'styles.stickyBottomCollapsed'],
			['styles.footerRow', 'styles.footerRowCollapsed'],
			['styles.resizableContainer']
		]
	},
	{
		// Both modes. `root`, `rootCollapsed`, `menuTrigger`, `popover` and
		// `popoverOverlap` stay objects — the roots take `xstyle` spreads and the
		// two layer offsets are handed to `render`. Everything else is a lone call
		// site. `superheading` and `subheading` compile to the same class string, so
		// one entry covers both (the `Breadcrumbs` link-pair precedent).
		//
		// `interactiveCollapsed` is declared upstream and applied nowhere; StyleX
		// drops it, so it is uncompared and needs no skip.
		//
		// `headingCompact` has no entry either, and for a subtler reason: it sets
		// only `fontWeight: semibold`, which `heading` *already* sets, so
		// `[heading, headingCompact]` resolves to exactly `heading`'s class set.
		// The two call sites are indistinguishable in the output, so the `heading`
		// entry covers both — the same content-keyed collapse as the
		// superheading/subheading pair below it.
		//
		// **`chevron` and `popoverChevron` are object mode as of upstream 0.4.1
		// (#4838), and their bare inline claims are deleted rather than repaired.**
		// Both used to sit on a wrapper the compiler could fold; `SideNavHeading.js`
		// now hands each straight to an `<Icon>` (`xstyle: styles.chevron` on
		// `chevronElement`, `xstyle: styles.popoverChevron` on the two replica
		// glyphs), and a style crossing a component boundary as `xstyle` is opaque
		// to the compiler, so `dist/` keeps both objects and emits no inline string
		// for them. `side-nav-heading.svelte` passes the same two through
		// `sideNavHeadingChevronStyle` / `sideNavHeadingPopoverChevronStyle`.
		// `chevronGlyph` is object mode for the same reason and, being new with
		// #4838, never had an inline claim to delete.
		//
		// `['styles.chevron', 'styles.interactive']` used to stay: that pair is not
		// an `<Icon>` at all but the chevron's own `<button>`, which upstream once
		// folded into a literal. The glyph inside it is what moved for #4838, and
		// it moved to `chevronGlyph`.
		//
		// **Three more pairs joined the objects at 0.4.2**, when the SideNav
		// hardening pass put every focusable row on the shared focus ring: a call
		// site that reads `focusOutlineProps.focusVisible(a, b)` passes its styles
		// through a *runtime function*, which the compiler cannot fold, so `dist/`
		// keeps the keys as objects and emits no inline string. That is the same
		// mechanism as an `xstyle` crossing a component boundary. `styles.icon`
		// **stays** inline: it has two call sites, and only the link variant
		// (`sideNavHeadingIconLinkAttrs`) took the ring — the plain span is not
		// focusable, still folds, and is what the inline entry matches.
		file: 'src/lib/components/side-nav/side-nav-heading.stylex.js',
		upstreamFile: 'SideNav/SideNavHeading.js',
		inline: [
			['styles.icon'],
			['styles.textContainer'],
			['styles.superheading'],
			['styles.heading'],
			['styles.headingRow'],
			['styles.headerEndContent'],
			['styles.popoverContent']
		]
	},
	{
		// Both modes. The three collapsed-width keys stay objects (they ride the
		// merge with `navItemStyles` and a size index); everything else folded.
		// `styles.children` is declared upstream and applied nowhere —
		// `childrenInner` superseded it — so it is uncompared and needs no skip.
		//
		// **`expandChevron`/`expandChevronExpanded` joined the objects at upstream
		// 0.4.1 (#4838), and their two inline permutations are deleted rather than
		// repaired.** They were right for 0.3.0, when the chevron rotated a wrapper
		// and folded with and without its one boolean. `SideNavItem.js` now hands
		// the pair to the `<Icon>` at both of its call sites as
		// `xstyle: [styles.expandChevron, !isItemCollapsed && styles.expandChevronExpanded]`;
		// a style crossing a component boundary as `xstyle` is opaque to the
		// compiler, so `dist/` keeps both as objects and emits no inline string for
		// them. `side-nav-item.svelte` builds the same array in `chevronXstyle`.
		file: 'src/lib/components/side-nav/side-nav-item.stylex.js',
		upstreamFile: 'SideNav/SideNavItem.js',
		// `styles.root` is object-only since 0.2.0 — all three of its call sites
		// take `xstyle`, so none folds to a literal. The object diff above still
		// covers it.
		//
		// **`expandToggle` and `splitAction` joined the objects at 0.4.2**: the
		// hardening pass put both on the shared focus ring, and a call site that
		// reads `focusOutlineProps.focusVisible(...)` passes its styles through a
		// runtime function the compiler cannot fold. Same mechanism as the three
		// `side-nav-heading` pairs above. Their inline claims are deleted rather
		// than repaired — there is no literal left upstream to match.
		inline: [
			['styles.label'],
			['styles.endContent'],
			['styles.childrenCollapsible'],
			['styles.childrenCollapsible', 'styles.childrenCollapsed'],
			['styles.childrenInner'],
			['styles.popoverSurface'],
			['styles.popoverHeader']
		]
	},
	{
		// Both modes. Only `root` stays an object (the `xstyle` spread); the header,
		// title column and item stack are each one static call site. The
		// visually-hidden treatment is a plain inline style on both sides, so it
		// never reaches a class and has no entry.
		file: 'src/lib/components/side-nav/side-nav-section.stylex.js',
		upstreamFile: 'SideNav/SideNavSection.js',
		inline: [
			['styles.header'],
			['styles.titleContainer'],
			['styles.title'],
			['styles.subtitle'],
			['styles.endContent'],
			['styles.items']
		]
	},
	{
		// **Pure OBJECT mode as of upstream 0.4.1 (#4838) — this case inverted, and
		// both inline claims are deleted rather than repaired.** It used to be pure
		// inline: two keys, one call site, one boolean, so the compiler folded each
		// branch into a literal and `dist/` carried no style object at all. #4838
		// moves the rotation and its transition off the wrapper `<span>` onto the
		// glyph, so `SideNavCollapseButton.js` now reads
		// `xstyle: [styles.chevron, isCollapsed && styles.chevronCollapsed]` on the
		// `<Icon>` and `dist/` carries nothing BUT the two objects. The wrapper is
		// still there and still folded, but it now carries only `rtlStyles.mirror`
		// (which belongs to `utils/rtlStyles` and is compared by that case) —
		// upstream keeps the mirror on its own element deliberately, since both it
		// and the state rotation are `transform` and one element would let the
		// rotation overwrite the mirror. `side-nav-collapse-button.svelte` renders
		// the identical two-element shape.
		file: 'src/lib/components/side-nav/side-nav-collapse-button.stylex.js',
		upstreamFile: 'SideNav/SideNavCollapseButton.js'
	},
	{
		// Both modes. The root and the six tint/background keys stay objects — the
		// root takes a three-way variant ternary plus an `xstyle` spread, and the
		// tints are picked at runtime and handed to a *child*'s `xstyle`
		// (`LayoutPanel`, `LayoutContent`) or merged into the header wrapper. The
		// five structural wrappers are each one static call site and folded.
		//
		// Upstream also declares `styles.hidden` with **zero call sites**; StyleX
		// eliminates it, so there is nothing to diff and it is omitted here rather
		// than carried as dead code.
		//
		// **`skipLink` joined the objects at upstream 0.4.1 (#4973), and its inline
		// claim is deleted rather than repaired.** The skip link used to write its
		// own focus ring and fold at its one call site; `AppShell.js` now reads
		// `focusOutlineProps.focusVisible(styles.skipLink)`, and a runtime
		// `stylex.props` call folds nothing, so `dist/` carries the `$$css` object
		// and emits no inline string. Object mode above already diffs it (18 pairs,
		// nearly all of them `default`/`:focus` two-class values);
		// `appShellSkipLinkAttrs` makes the same call.
		file: 'src/lib/components/app-shell/app-shell.stylex.js',
		upstreamFile: 'AppShell/AppShell.js',
		inline: [
			['styles.elevatedContentWrapper'],
			['styles.elevatedBackdrop'],
			['styles.autoMobileTopBar'],
			['styles.sideNavSticky']
		]
	},
	{
		// Pure object mode. The three shared cell groups are merged into a longer
		// conditionally-built list by both cell components, so none folded.
		// `tableRowMarker` is declared in this same upstream module but lives in
		// `table.markers.stylex.ts` here (a marker's class is derived from its
		// module path, so it needs a module of its own to keep the rest of this one
		// comparable); it is compared as the `marker` of the TableCell case below.
		file: 'src/lib/components/table/table.stylex.js',
		upstreamFile: 'Table/table.stylex.js'
	},
	{
		// Pure object mode, plus a marker. Every group reaches `stylex.props` inside
		// a conditionally-built array, so all eight survived in `dist/`.
		//
		// `dividerRowStyles.cell` embeds `when.ancestor(':last-child', tableRowMarker)`
		// — a `defineMarker()`'s class is path-derived and cannot match upstream's by
		// name, so that key diffs as marker-normalised CSS, the fallback
		// `overlayScope`/`switchScope`/`treeItemScope` already use.
		file: 'src/lib/components/table/table-cell.stylex.js',
		upstreamFile: 'Table/TableCell.js',
		marker: {
			file: 'src/lib/components/table/table.markers.stylex.js',
			upstreamFile: 'Table/table.stylex.js',
			name: 'tableRowMarker'
		}
	},
	{
		// Pure object mode — the header cell builds its list conditionally too.
		file: 'src/lib/components/table/table-header-cell.stylex.js',
		upstreamFile: 'Table/TableHeaderCell.js'
	},
	{
		// Pure object mode. All three row treatments are picked at runtime and
		// merged beside the marker and an `xstyle` spread.
		file: 'src/lib/components/table/table-row.stylex.js',
		upstreamFile: 'Table/TableRow.js'
	},
	{
		// Both modes. `table`/`tableAutoLayout` seed the plugin pipeline's `xstyle`
		// array, so they stayed objects; `headerLabelRow` is one static call site
		// (the inline-flex row that only appears when a plugin fills the `after`
		// slot) and folded into a literal string.
		file: 'src/lib/components/table/base-table.stylex.js',
		upstreamFile: 'Table/BaseTable.js',
		inline: [['styles.headerLabelRow']]
	},
	{
		// Pure object mode. Upstream declares both groups in `Table.tsx`: the
		// `<table>` font/colour pair is appended to the plugin pipeline's `xstyle`
		// array, and the scroll wrapper merges its two keys with the plugin styles
		// spread. This port splits `Table.tsx` into `table.svelte` and the private
		// `table-scroll-wrapper.svelte`, and the styles follow the wrapper.
		file: 'src/lib/components/table/table-scroll-wrapper.stylex.js',
		upstreamFile: 'Table/Table.js'
	},
	{
		// Entirely inline. The centring wrapper is the plugin's only style, and it
		// reaches two call sites — the select-all header and each row's checkbox —
		// but both are plain `stylex.props(...)` the compiler folded into the *same*
		// literal string, so `dist/` carries no style object and one entry covers
		// both. `selectedBgColor` is a bare token reference, not a `stylex.create`
		// member: upstream assigns it to `el.style.backgroundColor` from a ref
		// callback, so neither extractor sees it and there is nothing to diff for it.
		file: 'src/lib/components/table/plugins/selection/selection.stylex.js',
		upstreamFile: 'Table/plugins/selection/useTableSelection.js',
		inline: [['selectionColumnStyles.center']]
	},
	{
		// Entirely inline. One style, one call site — the `renderCell` ordinal span —
		// so the compiler resolved it and `dist/` carries the finished class string
		// with no style object behind it.
		file: 'src/lib/components/table/plugins/row-index/row-index.stylex.js',
		upstreamFile: 'Table/plugins/rowIndex/useTableRowIndex.js',
		inline: [['styles.index']]
	},
	{
		// Both modes as of upstream 0.4.1. `SortHeaderButton` is the plugin's whole
		// UI, and its icon wrapper and rank badge still reach exactly one
		// `stylex.props` each and fold into literal strings. The icon wrapper is a
		// two-entry lookup table keyed by `!!(direction != null) << 0`: index 0 is
		// the unsorted wrapper (dimmed until the header is hovered or the button
		// focused), index 1 the active one — which is why the two are separate keys
		// here rather than a base plus a narrowing variant.
		//
		// **`sortStyles.button` is the exception and object mode now (#4973); its
		// inline claim is deleted rather than repaired.** The header button used to
		// write its own focus ring and fold; `useTableSortable.js` now reads
		// `focusOutlineProps.focusVisible(sortStyles.button)`, and a runtime
		// `stylex.props` call folds nothing, so `dist/` carries the one `$$css`
		// object it has for this module. `sortable.stylex.ts` makes the same call.
		file: 'src/lib/components/table/plugins/sortable/sortable.stylex.js',
		upstreamFile: 'Table/plugins/sortable/useTableSortable.js',
		inline: [
			['sortStyles.iconWrapperUnsorted'],
			['sortStyles.iconWrapperActive'],
			['sortStyles.rank']
		]
	},
	{
		// Pure object mode. The controls row picks its margin and its justification
		// from five conditionals at one `stylex.props`, so the compiler could not fold
		// the merge and left the whole `styles` object live in `dist/`. Same group
		// name on both sides.
		file: 'src/lib/components/table/plugins/pagination/pagination.stylex.js',
		upstreamFile: 'Table/plugins/pagination/useTablePagination.js'
	},
	{
		// Pure object mode. Every key in both groups is pushed onto a cell's `xstyle`
		// array rather than handed to a local `stylex.props`, so the compiler could
		// fold none of them and `dist/` carries both objects whole. The `SHADOW_VAR_*`
		// names and the `SHADOW_WIDTH` / `SHADOW_TINT` constants are plain strings on
		// both sides, so neither extractor sees them — they are compared only through
		// the classes the styles that read them hash to.
		file: 'src/lib/components/table/plugins/sticky-columns/sticky-columns.stylex.js',
		upstreamFile: 'Table/plugins/stickyColumns/useTableStickyColumns.js'
	},
	{
		// Both modes at once. `styles.headerRow` is pushed onto the group-header row's
		// `xstyle` array, so the compiler could not fold it and it is the one key
		// `dist/` still carries as an object. Everything the header row *renders* is a
		// single static call site the compiler resolved into a literal string: the
		// full-width `<td>`, its flex inner, the chevron button, the label and the
		// count.
		//
		// **The glyph is object mode as of upstream 0.4.1 (#4838), and the two
		// claims naming it are deleted rather than repaired.** They were right for
		// 0.3.0, when the rotation sat on a wrapper span and folded into a
		// two-entry lookup keyed by `!!!collapsed << 0`. #4838 hands it to the
		// `<Icon>` as
		// `xstyle: [styles.chevronIcon, collapsed ? styles.chevronIconCollapsed : styles.chevronIconExpanded]`
		// "so the theme target below reaches both the mark and its open/closed
		// transform" (`useTableGroupedRows.js`), and a style crossing a component
		// boundary as `xstyle` is opaque to the compiler, so `dist/` keeps all
		// three as objects. Note the RESHAPE, not just the mode change:
		// `chevronExpanded` — which the second claim named — no longer exists on
		// either side. The rotation is now a two-way pick between
		// `chevronIconCollapsed` and `chevronIconExpanded`, each spelling out its
		// own `:is([dir="rtl"] *)` mirror, because folding the mirror onto the same
		// element as the rotation means one `transform` would overwrite the other.
		// Object mode above diffs all three; `group-header-cell.svelte` builds the
		// same array.
		//
		// `styles.chevron` — the button, not the glyph — is untouched and stays an
		// inline claim.
		file: 'src/lib/components/table/plugins/grouped-rows/grouped-rows.stylex.js',
		upstreamFile: 'Table/plugins/groupedRows/useTableGroupedRows.js',
		inline: [
			['styles.headerCell'],
			['styles.headerInner'],
			['styles.chevron'],
			['styles.label'],
			['styles.count']
		]
	},
	{
		// **Pure inline mode as of upstream 0.4.1 (#4609), and this case is rebuilt
		// rather than patched — the plugin was rewritten wholesale.** It used to
		// draw hierarchy (indented child cells, a per-depth `indent(px)` function
		// style, a chevron-sized spacer, a clickable row) and both modes applied,
		// because `indentedCell` rode the same runtime `stylex.props` as `indent`
		// and `clickableRow` was pushed onto the row's `xstyle`. It now draws a
		// full-width detail panel and nothing else: `chevronIcon`, `indentedCell`,
		// `indent`, `placeholder` and `clickableRow` all went with the hierarchy
		// (which is `tree.stylex.ts`'s job), and `dist/` carries no style object at
		// all — four `className` literals and no `$$css` anywhere in the file. The
		// three stale claims named keys that no longer exist on either side, which
		// is why two of them reported as "absent from our module".
		//
		// `chevronExpanded` composes onto the **button** now, not onto an icon
		// wrapper, so the button is a two-entry lookup table keyed by
		// `!!isExpanded << 0` rather than a single string with a separate rotating
		// glyph beside it — and the entry naming both keys is what covers index 1.
		// (That is the same #4838 "rotation rides the element, not a wrapper" move
		// the tree and grouped-rows plugins made, arriving here as part of the
		// larger rewrite; note it lands on the button here because this chevron's
		// `<Icon>` takes no `xstyle` at all.) `expandedRow` and `expandedCell` are
		// the panel's `<tr>` and its full-width `<td>`, both new.
		file: 'src/lib/components/table/plugins/row-expansion/row-expansion.stylex.js',
		upstreamFile: 'Table/plugins/rowExpansion/useTableRowExpansion.js',
		inline: [
			// **The bare button stopped folding alone at upstream 0.4.5.** It used to
			// be `isExpanded && chevronExpanded`, so the collapsed state applied no
			// transform and the button emitted on its own. The RTL mirror is now
			// folded into each state's `transform` (one element, and the later
			// `transform` value would win over a separate mirror style), which makes
			// it a ternary — so every call site carries exactly one of the pair and
			// there is no lone-button string left to claim.
			['expansionStyles.chevronButton', 'expansionStyles.chevronCollapsed'],
			['expansionStyles.chevronButton', 'expansionStyles.chevronExpanded'],
			['expansionStyles.expandedRow'],
			['expansionStyles.expandedCell']
		]
	},
	{
		// **New at 0.2.0**, and the reason `ABSENT_UPSTREAM` is now empty: the
		// published 0.1.7 tarball shipped no `Table/plugins/tree/` directory at
		// all, so this module was deferred wholesale. It is a real case now.
		//
		// Both modes. `cell` rides the same runtime `stylex.props` as the dynamic
		// `indent(paddingInlineStart)`, so the compiler could fold neither and
		// `dist/` keeps both as objects. Everything else is a single static call
		// site resolved into a literal string: the expander button (one entry for
		// two call sites — the row expander and the header's expand-all toggle
		// apply the same style), the leaf spacer and the header cell.
		//
		// **The glyph is object mode as of upstream 0.4.1 (#4838), and the two
		// claims naming it are deleted rather than repaired.** They were right for
		// 0.3.0, when the rotation sat on a wrapper span (with `rtlStyles.mirror`
		// on a second span outside it) and folded into a two-entry lookup keyed by
		// `!!isExpanded << 0`. #4838 hands it to the `<Icon>` as
		// `xstyle: [treeStyles.chevronIcon, isExpanded ? treeStyles.chevronIconExpanded : treeStyles.chevronIconCollapsed]`
		// at both call sites, and a style crossing a component boundary as `xstyle`
		// is opaque to the compiler, so `dist/` keeps all three as objects. Note
		// the RESHAPE, not just the mode change: `chevron` and `chevronExpanded` —
		// the two keys the old claims named — no longer exist on either side. Both
		// the wrapper span and the separate `rtlStyles.mirror` span are gone, and
		// each of `chevronIconCollapsed` / `chevronIconExpanded` now spells out its
		// own `:is([dir="rtl"] *)` mirror, because on one element the rotation and
		// the mirror are both `transform` and the later would win. Object mode
		// above diffs all three; `tree-expander.svelte` and
		// `tree-expand-all-toggle.svelte` build the same array.
		file: 'src/lib/components/table/plugins/tree/tree.stylex.js',
		upstreamFile: 'Table/plugins/tree/useTableTreeData.js',
		inline: [['treeStyles.expanderButton'], ['treeStyles.leafSpacer'], ['treeStyles.headerCell']]
	},
	{
		// Both modes at once, and the split is the smallest illustration of the rule
		// in the whole list. `styles.dot` is a **function style** — its colour is an
		// argument — so the compiler cannot fold it and `dist/` keeps it as an
		// object (with the `--x-backgroundColor` custom property the dynamic value
		// rides on). `styles.wrap` reaches exactly one static `stylex.props` and was
		// resolved into a literal class string.
		//
		// Upstream declares both in the hook file rather than a style module and
		// keeps the group's name `styles`, so ours needs no rename.
		file: 'src/lib/components/table/plugins/row-status/row-status.stylex.js',
		upstreamFile: 'Table/plugins/rowStatus/useTableRowStatus.js',
		inline: [['styles.wrap']]
	},
	{
		// Both modes at once. `headerCellRelative.base` is pushed onto a resizable
		// header cell's `xstyle` array, so the compiler could not fold it and it
		// survives in `dist/` as an object. `handleStyles` has no object there at all:
		// `base` and `indicator` are only ever applied together, at the single
		// `stylex.props` on the handle `<div>`, so the compiler folded the pair into
		// one literal class string — hence one `inline` entry naming both keys rather
		// than two object keys.
		file: 'src/lib/components/table/plugins/column-resize/column-resize.stylex.js',
		upstreamFile: 'Table/plugins/columnResize/useTableColumnResize.js',
		inline: [['handleStyles.base', 'handleStyles.indicator']]
	},
	{
		// Both modes at once. Only `placeholder` and `placeholderCompact` survive as
		// objects: `InlineFilterSlot` picks between them by variant and hands the
		// chosen one to a runtime `stylex.props`, so the compiler could not fold
		// either. Every other style reaches exactly one static call site and was
		// resolved into a literal string — the two header-cell slot wrappers, the
		// popover's fixed-width content box, its action row and that row's spacer.
		//
		// The funnel trigger is a two-entry lookup table keyed by `!!hasValue << 0`,
		// so it needs two entries rather than one. The two variants are alternatives
		// rather than a base and a narrowing: `triggerInactive` carries the dimmed
		// default plus its `:is(th:hover *)` and `:focus-visible` overrides — one
		// property, one hash, three classes — and `triggerActive` the plain
		// `opacity: 1`. `triggerButton` sets no opacity, so either one only ever adds.
		file: 'src/lib/components/table/plugins/filtering/filtering.stylex.js',
		upstreamFile: 'Table/plugins/filtering/useTableFiltering.js',
		inline: [
			['filterStyles.afterPopover'],
			['filterStyles.afterInline'],
			['filterStyles.triggerButton', 'filterStyles.triggerInactive'],
			['filterStyles.triggerButton', 'filterStyles.triggerActive'],
			['filterStyles.popoverContent'],
			['filterStyles.popoverActions'],
			['filterStyles.popoverActionsSpacer']
		]
	},
	// `table/plugins/column-settings/` declares no styles at all — the plugin is
	// pure state and menu wiring — so it has no `.stylex.ts` module and no case.
	// `table/plugins/tree/tree.stylex.ts` does have one, but the published tarball
	// has nothing to diff it against; see `ABSENT_UPSTREAM` below.
	{
		// Both modes. Almost everything Markdown declares is merged into a
		// conditionally-built `stylex.props` list — block spacing times density
		// times first/last times prose width — so `styles`, `dynamicStyles` and
		// `cellAlignStyles` all survived as objects. `streamingStyles.fadeIn` is the
		// exception: one static call site (the fading half of a streamed text span),
		// which the compiler folded into a literal class string.
		//
		// `headingStyles` is not a `stylex.create` group on either side — it is a
		// plain `1..6 → styles.hN` lookup — so it has no entry.
		//
		// Five keys are in *both* modes, which is worth stating because it reads
		// like a contradiction: `bold`, `strikethrough`, `link` and `image` survive
		// in the `styles` object (Markdown re-exports it and other keys keep it
		// alive) *and* the compiler folded each of their single call sites — the
		// `<strong>`, `<del>`, `<a>` and `<img>` — into a literal class string.
		// Declaring only the object side leaves those four strings unaccounted for,
		// which is exactly what the leftover check exists to catch. `image` is one
		// entry for two call sites: the inline image and the block image apply the
		// same single style, so the compiler emitted one string for both.
		file: 'src/lib/components/markdown/markdown.stylex.js',
		upstreamFile: 'Markdown/Markdown.js',
		inline: [
			['streamingStyles.fadeIn'],
			['styles.bold'],
			['styles.strikethrough'],
			['styles.link'],
			['styles.image']
		]
	},
	{
		// Both modes at once — the `Markdown` shape, from the opposite direction.
		// Upstream declares all three groups inline in `PowerSearch.tsx` and keeps
		// the names `tokenValueStyles`/`popoverLayerStyles`/`resultCountStyles`, so
		// none needs a rename.
		//
		// Object mode reaches `popoverLayerStyles.layer` alone, and it is the only
		// one it *can* reach: the layer style rides `popover.render`'s `xstyle` array
		// (`[popoverLayerStyles.layer, layerAnimations.below]`) rather than a local
		// `stylex.props`, so the compiler never sees the call site and `dist/` still
		// carries the object — the same reason `Selector`'s `popover` survives. Ours
		// is exported raw rather than through `sx()` for exactly that: it is passed
		// on, not applied.
		//
		// The other two are folded. `tokenValueStyles.value` is the bold `<span>`
		// wrapping a token's formatted value and reaches **22** call sites in
		// `dist/PowerSearch.js` — one per value shape the tokenizer can render — but
		// every one folded to the same single class, and the extractor keys upstream's
		// inline strings by content, so one entry claims all 22. That is the
		// `CommandPaletteFooter` three-hint precedent at scale, not an under-count.
		// `resultCountStyles.text` has the one call site in the tokenizer's end slot.
		file: 'src/lib/components/power-search/power-search.stylex.js',
		upstreamFile: 'PowerSearch/PowerSearch.js',
		inline: [['tokenValueStyles.value'], ['resultCountStyles.text']]
	},
	{
		// Pure inline mode. `dist/PowerSearchToken.js` carries no style object at
		// all: the one key reaches one plain `stylex.props`, which the compiler
		// folded into the literal `x1lvx875`.
		//
		// That class is byte-identical to the one `PowerSearch.js` emits, because
		// upstream declares `tokenValueStyles.value` **twice** — once in each file —
		// rather than sharing it, and this port keeps the two declarations separate
		// for the same reason (`PowerSearch` never imports `PowerSearchToken`). So
		// the same class is checked twice over, once against each upstream file, the
		// way `TextInput`/`NumberInput`/`TimeInput` restate their `input` chrome. A
		// divergence in either copy has to surface against its own counterpart.
		file: 'src/lib/components/power-search/power-search-token.stylex.js',
		upstreamFile: 'PowerSearch/PowerSearchToken.js',
		inline: [['tokenValueStyles.value']]
	},
	{
		// Pure inline mode. Upstream declares the group in the component file under
		// the name `styles`, so ours needs no rename, and `dist/` holds no object for
		// it: every call site passes exactly one key with nothing dynamic and no
		// `xstyle` beside it, so the compiler folded all of them into literal class
		// strings. Ten distinct strings across fifteen call sites: `container`,
		// `content`, `fieldSelector` and `footer` each appear twice because the
		// component returns two whole trees — the `isNestedType` early return and the
		// flat one below it — and `operatorSelector` twice because it wraps both the
		// flat branch's operator slot and `NestedEditor`'s group-operator row. The
		// extractor keys upstream's inline strings by content, so one entry apiece
		// covers both sites, as `CommandPaletteFooter`'s three key hints do.
		//
		// `styles.nestedRow` (`width: '100%'`) is declared upstream and **referenced
		// nowhere**, so it has no entry here and needs no skip — and the reason is
		// worth stating exactly, because it is not the asymmetry it looks like.
		// StyleX prunes an unreferenced `stylex.create` key from the object it emits,
		// so it is absent from *both* compiled modules: upstream's `dist/` has no
		// class for it, and neither does ours (our `.stylex.ts` authors the
		// declaration, per the source-is-the-contract rule, but exports no attrs
		// function for it, so the plugin drops it the same way). Both builds still
		// emit the rule `.xh8yej3{width:100%}` into the stylesheet and neither
		// attaches it to an element — the two sides agree completely, so there is no
		// absence for a skip to excuse and a skip here would be the rot the
		// discipline warns about.
		//
		// It is self-retiring all the same, through the leftover check rather than a
		// skip list: if upstream ever applies the key, its `dist/` grows a call site
		// we do not claim and the run fails with "upstream applies classes we never
		// produce". Same standing as `Selector`'s `itemCheckmark`, `Pagination`'s
		// `disabled` and `SideNav`'s `children` — the reverse of a skip.
		file: 'src/lib/components/power-search/power-search-edit-popover.stylex.js',
		upstreamFile: 'PowerSearch/PowerSearchEditPopover.js',
		inline: [
			['styles.container'],
			['styles.content'],
			['styles.footer'],
			['styles.fieldSelector'],
			['styles.operatorSelector'],
			['styles.valueEditor'],
			['styles.nestedRootLabel'],
			['styles.nestedFieldSelector'],
			['styles.nestedOperatorSelector'],
			['styles.nestedRowValueEditor']
		]
	},
	// `PowerSearch/PowerSearchValueEditor.tsx` and `PowerSearchFilterEditor.tsx`
	// import no StyleX at all — they are pure dispatch over the editor components —
	// so neither has a `.stylex.ts` module here and neither gets a case.
	{
		// Both modes. Only `body` and `compact` survive as objects — the body div
		// applies them beside `xstyle` — and everything else is a single call site
		// the compiler folded. The status bar is the port's second 2^n lookup table
		// after Switch's track: three independent conditions, eight entries, but
		// `statusError` and `statusWarning` set the same two properties, so the two
		// error+warning permutations collapse onto the warning-only strings and only
		// six distinct ones remain. Claiming the six reachable combinations claims
		// every string in the table.
		//
		// `styles.textarea` is declared and applied nowhere — upstream's default
		// textarea became `ChatComposerInput` and the style stayed behind — so
		// StyleX prunes it from both compiled modules and it needs no entry and no
		// skip, the `PowerSearchEditPopover.nestedRow` situation exactly.
		file: 'src/lib/components/chat/chat-composer.stylex.js',
		upstreamFile: 'Chat/ChatComposer.js',
		inline: [
			['styles.root'],
			['styles.root', 'styles.rootDisabled'],
			['styles.header'],
			['styles.headerLeft'],
			['styles.headerRight'],
			['styles.inputArea'],
			['styles.footer'],
			['styles.statusBar', 'styles.statusTop'],
			['styles.statusBar', 'styles.statusBottom'],
			['styles.statusBar', 'styles.statusTop', 'styles.statusError'],
			['styles.statusBar', 'styles.statusBottom', 'styles.statusError'],
			['styles.statusBar', 'styles.statusTop', 'styles.statusWarning'],
			['styles.statusBar', 'styles.statusBottom', 'styles.statusWarning']
		]
	},
	{
		// Both modes. `root` survives beside `xstyle`; the rest folded.
		//
		// The toggle row is the port's first `stylex.defaultMarker()` call site — it
		// is what the two `when.ancestor(':hover')` rules on `collapseLabel` and
		// `collapseBarHandle` resolve against. A marker is a style argument with no
		// `stylex.create` key to name, hence the `stylex.defaultMarker()` pseudo-key.
		//
		// `styles.toggleCollapsed` is `{}` upstream — declared, applied, and empty.
		// StyleX emits nothing for it, so the row's two-entry lookup table holds the
		// same string twice and one entry claims both.
		//
		// `footerLeft`/`footerRight` are not this component's: the *composer's*
		// `headerLeft` string is byte-identical to them, and the extractor keys by
		// content, so a single claim covers every site that folded to it.
		file: 'src/lib/components/chat/chat-composer-drawer.stylex.js',
		upstreamFile: 'Chat/ChatComposerDrawer.js',
		inline: [
			['styles.toggleRow', BUILTIN_DEFAULT_MARKER],
			['styles.toggleContent'],
			['styles.toggleContent', 'styles.toggleContentHidden'],
			['styles.collapseLabel'],
			['styles.collapseBarHandle'],
			['styles.collapseBarHandle', 'styles.collapseBarHandleHidden'],
			['styles.contentGrid'],
			['styles.contentGrid', 'styles.contentGridCollapsed'],
			['styles.content'],
			['styles.content', 'styles.contentCollapsed']
		]
	},
	{
		// Both modes. The editable div merges `root` with a conditional `disabled`
		// and an `xstyle`, so both survive; the placeholder overlay and the
		// measuring span are one call site each.
		file: 'src/lib/components/chat/chat-composer-input.stylex.js',
		upstreamFile: 'Chat/ChatComposerInput.js',
		inline: [['styles.placeholder'], ['styles.editable']]
	},
	{
		// Both modes. `wrapper` takes the `xstyle`; the bar container and each bar
		// are one call site apiece — and both carry an inline `style` object
		// upstream, which is why only their static half compiles to a class.
		file: 'src/lib/components/chat/chat-dictation-button.stylex.js',
		upstreamFile: 'Chat/ChatDictationButton.js',
		inline: [['styles.barsContainer'], ['styles.bar']]
	},
	{
		// Almost pure object mode: eighteen of the twenty-two keys ride a density
		// lookup or an `xstyle` and survive. Only the empty-state wrapper and the
		// dock container's two position variants folded.
		file: 'src/lib/components/chat/chat-layout.stylex.js',
		upstreamFile: 'Chat/ChatLayout.js',
		inline: [
			['styles.emptyState'],
			['styles.dockContainer', 'styles.dockContainerSticky'],
			['styles.dockContainer', 'styles.dockContainerFixed']
		]
	},
	{
		// Both modes. `wrapper` and the two button styles reach `stylex.props`
		// beside an `xstyle`; the container's visibility/label pair folded into a
		// 2^2 table whose four entries are all reachable.
		file: 'src/lib/components/chat/chat-layout-scroll-button.stylex.js',
		upstreamFile: 'Chat/ChatLayoutScrollButton.js',
		inline: [
			['styles.container', 'styles.hidden'],
			['styles.container', 'styles.hidden', 'styles.visible'],
			['styles.container', 'styles.hidden', 'styles.expanded'],
			['styles.container', 'styles.visible', 'styles.expanded']
		]
	},
	{
		// Object mode for everything the sender/density lookups touch; the avatar
		// wrapper and the name label are the two single call sites.
		file: 'src/lib/components/chat/chat-message.stylex.js',
		upstreamFile: 'Chat/ChatMessage.js',
		inline: [['styles.avatarWrap'], ['styles.name']]
	},
	{
		// Pure object mode — every one of the twenty-two keys is chosen by a
		// variant, density or grouping lookup, so none could be folded.
		file: 'src/lib/components/chat/chat-message-bubble.stylex.js',
		upstreamFile: 'Chat/ChatMessageBubble.js'
	},
	{
		// Both modes. `root` takes the `xstyle`, `inner` merges the density gap with
		// the `gap` prop's override, and `gapStyles` is indexed — all objects. The
		// spacer, the top spinner row and the empty state are one call site each.
		file: 'src/lib/components/chat/chat-message-list.stylex.js',
		upstreamFile: 'Chat/ChatMessageList.js',
		inline: [['styles.spacer'], ['styles.loadingTop'], ['styles.emptyState']]
	},
	{
		// Both modes. The metadata row picks `metaUser`/`metaAssistant` by sender
		// beside an `xstyle`; the status row folded into a 2^2 table.
		//
		// Upstream declares `STATUS_CONFIG` (icon name and i18n key per status) next
		// to its styles. It is not styles and does not live in our `.stylex.ts` — see
		// the `$$css` test in `extractGroups`, which is what keeps it from reading as
		// five missing styles here.
		file: 'src/lib/components/chat/chat-message-metadata.stylex.js',
		upstreamFile: 'Chat/ChatMessageMetadata.js',
		inline: [
			['styles.statusRow'],
			['styles.statusRow', 'styles.statusError'],
			['styles.statusRow', 'styles.statusPulse'],
			['styles.statusRow', 'styles.statusError', 'styles.statusPulse']
		]
	},
	{
		// Pure inline mode: `dist/ChatPastedTextToken.js` carries no style object at
		// all. Every key is the hover card's preview chrome, applied once each with
		// nothing dynamic beside it.
		file: 'src/lib/components/chat/chat-pasted-text-token.stylex.js',
		upstreamFile: 'Chat/ChatPastedTextToken.js',
		inline: [['styles.preview'], ['styles.previewText'], ['styles.footer'], ['styles.meta']]
	},
	{
		// Pure object mode. The one key rides `Button`'s `xstyle`, which is exactly
		// why it survived — and why this port exports it as a raw style rather than
		// through `sx()`.
		file: 'src/lib/components/chat/chat-send-button.stylex.js',
		upstreamFile: 'Chat/ChatSendButton.js'
	},
	{
		// Both modes. `root` merges a variant conditional with `xstyle` and
		// `dividerWrap` is chosen by the same conditional; the icon and the text
		// span are one call site each.
		file: 'src/lib/components/chat/chat-system-message.stylex.js',
		upstreamFile: 'Chat/ChatSystemMessage.js',
		inline: [['styles.icon'], ['styles.content']]
	},
	{
		// Pure object mode. One key, applied beside `xstyle`.
		file: 'src/lib/components/chat/chat-tokenized-text.stylex.js',
		upstreamFile: 'Chat/ChatTokenizedText.js'
	},
	{
		// Both modes, and the widest inline surface in the batch. `root` takes the
		// `xstyle`; `statusIcon` and the four `color*` styles are the status lookup
		// `STATUS_STYLES` indexes; `nodePill` rides `Badge`'s `xstyle`. Everything
		// else is a single call site.
		//
		// Three claims each stand for two folded sites, because the pairs compile to
		// the same class: `statsAdditions` is `color: --color-success` and so is
		// `colorComplete`, `statsDeletions` is `--color-error` and so is
		// `colorError`. The extractor keys upstream's strings by content, so one
		// entry claims both — the `CommandPaletteFooter` precedent. The `color*`
		// half of each pair is verified anyway, by object mode.
		//
		// `groupHeader`, `listIndented`, `errorText` and the three `pile*` styles are
		// declared upstream and applied nowhere, so StyleX prunes them from both
		// compiled modules: no object entry, no inline string, nothing to diff, and
		// no skip to rot. If upstream ever applies one, its `dist/` grows a string we
		// do not claim and the leftover check fails — the reverse of a skip.
		//
		// `chevronTransition` and `chevronExpanded` are **object** mode, and that is
		// the whole of #4838 here: both chevrons' transition and rotation moved off
		// the wrapper `<span>` and onto the `<Icon>` beneath it, where they cross a
		// component boundary as `xstyle` and so survive in `dist/` as objects. The
		// two wrapper claims below (`chevron`, `callDetailChevron`) are therefore
		// bare — a `+ chevronExpanded` pair here would be claiming a site upstream
		// no longer has.
		file: 'src/lib/components/chat/chat-tool-calls.stylex.js',
		upstreamFile: 'Chat/ChatToolCalls.js',
		inline: [
			['styles.callRow'],
			['styles.callRow', 'styles.callRowClickable'],
			['styles.callRow', 'styles.callRowToggle'],
			['styles.statusIconCircle'],
			['styles.statusIconInner'],
			['styles.callName'],
			['styles.callLabel'],
			['styles.stats'],
			['styles.statsAdditions'],
			['styles.statsDeletions'],
			['styles.callDuration'],
			['styles.callDetailChevron'],
			['styles.callDetailContent'],
			['styles.groupIcon'],
			['styles.groupLabel'],
			['styles.callCount'],
			['styles.chevron'],
			['styles.groupContent'],
			['styles.groupContent', 'styles.groupContentExpanded'],
			['styles.groupContentInner'],
			['styles.list']
		]
	},
	{
		// Both modes. `popoverSurface` and `popoverGap` are the pair the hook hands
		// to `usePopover`'s `xstyle`, so they survive as objects — the `Selector`
		// `popover` case again; the rest of the menu chrome folded.
		//
		// `emptyState` and `loadingState` compile to the same class (both are the
		// same padding and muted type), so one claim covers the two call sites.
		file: 'src/lib/components/chat/use-trigger-menu.stylex.js',
		upstreamFile: 'Chat/useTriggerMenu.js',
		inline: [
			['styles.dropdown'],
			['styles.item'],
			['styles.item', 'styles.itemHighlighted'],
			['styles.itemLabel'],
			['styles.groupHeading'],
			['styles.emptyState']
		]
	},
	{
		// **One module of ours, two upstream files — and the same five keys declared
		// twice upstream.** `BottomSheet.tsx` and `BottomSheetSwitcher.tsx` each
		// carry their own `stylex.create` for the dialog shell, with identical
		// properties and identical token references, so both compile to the same
		// atoms. This port shares one module between the two hosts rather than
		// duplicating it byte for byte, which is why the file appears in two cases
		// here — the `Stack` / `StackItem` precedent, arrived at from the opposite
		// direction (there, one of ours split across two of theirs; here, one of
		// ours standing in for two copies of theirs).
		//
		// Object mode, and the switcher is the copy that leaves objects behind: it
		// assigns `stylex.props(styles.dialog, isFlowVisible && styles.dialogOpen,
		// hasScrim && styles.scrim, !hasScrim && styles.dialogNonModal, xstyle)` to a
		// `dialogStyleProps` const, and the `xstyle` beside the merge defeats the
		// fold, so `dist/` keeps `dialog`, `dialogOpen`, `dialogNonModal` and `scrim`
		// live. Upstream's group is named `styles` and so is ours, so no rename.
		//
		// The switcher declares no positioner — the block-end positioner belongs to
		// `BottomSheet.js` and is claimed inline in the case below. Our module holds
		// both because both hosts here draw from it; object mode only walks the
		// groups *upstream* declares, so the extra keys are not a leftover.
		file: 'src/lib/components/bottom-sheet/bottom-sheet.stylex.js',
		upstreamFile: 'BottomSheet/BottomSheetSwitcher.js'
	},
	{
		// The same module against the OTHER host, where nothing survives as an
		// object at all: `BottomSheet.js` merges the identical keys at a literal call
		// site with no `xstyle` and no dynamic index beside them, so the compiler
		// folded every one into a class string and `dist/` declares no `styles`.
		// Inline mode only — twenty claims, no object diff, and the two modes
		// together are what cover the module's ten keys.
		//
		// The dialog is a SIXTEEN-entry lookup table keyed
		// `!!shouldPresent << 3 | !!hasScrim << 2 | !!(hasScrim && !isOpen &&
		// isPresented) << 1 | !!!hasScrim << 0`. It was eight before 0.5.0 added
		// `scrimClosing` as bit 1. Bits 2 and 0 are exact complements, so half of
		// the sixteen can never be reached at runtime — but each is still a merge
		// of our keys in upstream's order, so all sixteen are CLAIMED rather than
		// waved through. The filler tolerance at the foot of the loop only applies
		// to marker cases and this is not one, so an unclaimed permutation would
		// read as "upstream applies classes we never produce"; claiming it is both
		// cheaper and stricter.
		//
		// Three of the five keys OVERRIDE a property the base already set rather
		// than adding one, which is exactly why the order of a combination is
		// load-bearing:
		//   • `dialogOpen` replaces `display: none` (x1s85apg) with `display: block`
		//     (x1lliihq) — one property in, one property out, so the merged string
		//     stays twelve classes rather than growing to thirteen.
		//   • `dialogNonModal` replaces the base's `100dvw` / `100dvh`
		//     (x1o6l61p / xtdtrs8) with `100%` / `100%` (xh8yej3 / x5yr21d) while
		//     adding `pointer-events` and `z-index`, so the non-modal strings are
		//     two classes shorter than "base plus four" would predict.
		//   • `scrimClosing` replaces the scrim's `::backdrop` timing function
		//     (x15h3t91, `--ease-standard`) with `linear` (x1cz9k3x), so a
		//     scrim-plus-closing string is the same length as the scrim's own.
		//     Against the base alone — the four unreachable no-scrim permutations —
		//     it has nothing to replace and simply adds x1cz9k3x.
		// None is a skip: all three are the merge working, and reproducing them is
		// the check. `styles.dialog`'s `border: 'none'` emits no class on either
		// side — StyleX drops it — so it is simply absent from both, the same way
		// `useKeyboardHint`'s `hint` is.
		//
		// The positioner is a second, four-entry table keyed
		// `!!!isPresented << 1 | !!isTopSheet << 0`, all four reachable, where
		// `positionerHidden` overrides `display: flex` the same way. Its index-0
		// string is byte-identical to the one the standalone host's own positioner
		// `<div>` folded to, and `extractInlineClassNames` collects into a Set, so
		// one claim covers both call sites.
		file: 'src/lib/components/bottom-sheet/bottom-sheet.stylex.js',
		upstreamFile: 'BottomSheet/BottomSheet.js',
		inline: [
			['styles.dialog'],
			['styles.dialog', 'styles.dialogOpen'],
			['styles.dialog', 'styles.scrim'],
			['styles.dialog', 'styles.dialogOpen', 'styles.scrim'],
			['styles.dialog', 'styles.scrimClosing'],
			['styles.dialog', 'styles.dialogOpen', 'styles.scrimClosing'],
			['styles.dialog', 'styles.scrim', 'styles.scrimClosing'],
			['styles.dialog', 'styles.dialogOpen', 'styles.scrim', 'styles.scrimClosing'],
			['styles.dialog', 'styles.dialogNonModal'],
			['styles.dialog', 'styles.dialogOpen', 'styles.dialogNonModal'],
			['styles.dialog', 'styles.scrim', 'styles.dialogNonModal'],
			['styles.dialog', 'styles.dialogOpen', 'styles.scrim', 'styles.dialogNonModal'],
			['styles.dialog', 'styles.scrimClosing', 'styles.dialogNonModal'],
			['styles.dialog', 'styles.dialogOpen', 'styles.scrimClosing', 'styles.dialogNonModal'],
			['styles.dialog', 'styles.scrim', 'styles.scrimClosing', 'styles.dialogNonModal'],
			[
				'styles.dialog',
				'styles.dialogOpen',
				'styles.scrim',
				'styles.scrimClosing',
				'styles.dialogNonModal'
			],
			['styles.positioner'],
			['styles.positioner', 'styles.positionerTop'],
			['styles.positioner', 'styles.positionerHidden'],
			['styles.positioner', 'styles.positionerHidden', 'styles.positionerTop']
		]
	},
	{
		// Both modes. Object mode covers the six keys the panel's own `stylex.props`
		// merges — `sheet`, the three motion states (`sheetClosing`, `sheetFading`,
		// `sheetInactive`) and the two height budgets (`budget`, `hugHeight`) —
		// because that call site carries an `xstyle`, a `height === 'hug'` ternary
		// and a `mergeProps` wrapper, so the compiler could fold none of it.
		// `sheet`'s `transform` is one hash with two classes (the `@starting-style`
		// pair) and its `transitionDuration` likewise (the reduced-motion pair), so
		// `parsePairs` is what keeps them from being under-counted.
		//
		// The handle bar, its pill and the scrolling body each reach exactly one call
		// site with nothing beside them and were resolved into literal strings, so
		// they have no object to diff and are claimed inline. The body is a two-entry
		// table keyed `!!(height === 'tall') << 0`; `tallKeyboardBody` touches no
		// property the base body sets (`scroll-padding-block-end` plus the four
		// `::after` atoms), so it JOINS rather than replaces — the opposite of the
		// dialog pair above, and worth stating because both shapes appear in the one
		// component.
		file: 'src/lib/components/bottom-sheet/bottom-sheet-panel.stylex.js',
		upstreamFile: 'BottomSheet/BottomSheetPanel.js',
		inline: [
			['styles.handleBar'],
			['styles.handlePill'],
			['styles.body'],
			['styles.body', 'styles.tallKeyboardBody']
		]
	},
	{
		// Inline mode only, and the smallest case in the file: the edge tint is one
		// style on one element with nothing beside it, so upstream folded it to a
		// literal class string and `dist/` declares no `styles` object at all.
		//
		// The two mask declarations are one property to CSS and two to StyleX —
		// `maskImage` and `WebkitMaskImage` hash separately — so the string carries
		// both, and authoring only the unprefixed one would come up a class short
		// rather than merely unprefixed.
		file: 'src/lib/components/bottom-sheet/bottom-sheet-edge-tint.stylex.js',
		upstreamFile: 'BottomSheet/BottomSheetEdgeTint.js',
		inline: [['styles.tint']]
	}
];

/**
 * Modules of ours whose upstream counterpart is missing from the published
 * tarball *entirely* — not a group or a key we defer, but a whole `dist/` file
 * that does not exist at this release. This is the `Icon` px→rem situation taken
 * to its limit: the styles are in upstream's source and we port them from there,
 * but the ground truth has nothing to compare them against yet.
 *
 * A `CASES` entry cannot express that. It reads its upstream file before any
 * `skip` is consulted, so the run would die on an ENOENT that reads like a typo
 * rather than a deferral.
 *
 * Each entry names the `dist/` path we expect to appear, the module of ours
 * going uncompared, and why. Self-retiring in the direction that matters: the
 * run fails the moment a release ships the file, which is the prompt to delete
 * the entry and write the real case.
 */
// Empty, and worth keeping empty rather than deleting: this is where a module
// goes when upstream's *source* has it and upstream's *published dist* does not.
// The `tree` plugin was its only occupant, deferred at 0.1.7 because the tarball
// shipped no `Table/plugins/tree/` directory at all. 0.2.0 ships it, so it is now
// an ordinary case below — the deferral converted to a real check instead of
// being deleted and forgotten, which is the entire value of recording it here.
const ABSENT_UPSTREAM = [];

async function compileOurs(relative) {
	const { code } = await compileOursWithCss(relative);
	return code;
}

/**
 * Same compile, keeping the plugin's CSS metadata — `[className, {ltr}, …]` for
 * every rule the module emits. The marker check below is the only thing that
 * needs it, and it needs it because a class *name* is not enough there.
 */
async function compileOursWithCss(relative) {
	const filename = path.join(root, relative.replace(/\.js$/, '.ts'));
	const { code, metadata } = await transformAsync(readFileSync(filename, 'utf8'), {
		filename,
		babelrc: false,
		configFile: false,
		plugins: [
			[typescriptSyntax, { isTSX: false }],
			[
				styleXPlugin,
				{
					dev: false,
					runtimeInjection: false,
					treeshakeCompensation: true,
					unstable_moduleResolution: { type: 'commonJS', rootDir: root }
				}
			]
		]
	});
	const css = new Map();
	for (const [className, rule] of metadata?.stylex ?? []) {
		if (rule?.ltr) css.set(className, rule.ltr);
	}
	return { code, css };
}

/** Literal name of an object property, whether bare, quoted, or numeric. */
function propertyName(node) {
	if (node.key.type === 'Identifier') return node.key.name;
	if (node.key.type === 'StringLiteral') return node.key.value;
	if (node.key.type === 'NumericLiteral') return String(node.key.value);
	return null;
}

/**
 * Pull `group.key → "propHash=class …"` out of compiled StyleX output. Both
 * sides are compiled JS, so one parser covers ours and upstream's alike.
 *
 * This walks the AST rather than matching text. Compiled StyleX is dense with
 * nested braces, and a regex over it quietly skips whole groups instead of
 * failing — which is the worst possible behaviour in an oracle.
 */
function extractGroups(code) {
	const ast = parseSync(code, {
		babelrc: false,
		configFile: false,
		sourceType: 'module',
		// StyleX rewrites the style objects but leaves the rest of the module
		// alone, so our side still carries `import type` and annotations.
		plugins: [[typescriptSyntax, { isTSX: false }]]
	});

	const groups = {};

	for (const statement of ast.program.body) {
		const declaration =
			statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
		if (declaration?.type !== 'VariableDeclaration') continue;

		for (const declarator of declaration.declarations) {
			if (declarator.id.type !== 'Identifier') continue;
			if (declarator.init?.type !== 'ObjectExpression') continue;

			const entries = {};
			for (const property of declarator.init.properties) {
				if (property.type !== 'ObjectProperty') continue;
				const key = propertyName(property);
				if (key == null || property.value.type !== 'ObjectExpression') continue;

				// Compiled StyleX marks every style object with `$$css: true`. Without
				// that test, any plain lookup table of string-valued objects reads as a
				// style group — `ChatMessageMetadata`'s `STATUS_CONFIG` (icon name +
				// i18n key per status) is the first one upstream declares beside its
				// styles, and it would otherwise be reported as five styles missing
				// from our module. It is not styles, so it does not belong in `skip`
				// either; the extractor should simply not see it.
				const isStyleObject = property.value.properties.some(
					(p) => p.type === 'ObjectProperty' && propertyName(p) === '$$css'
				);
				if (!isStyleObject) continue;

				// A style object is `{ propHash: "class …", $$css: true }`. The hash
				// identifies the CSS property, so comparing hash→class pairs compares
				// the styles themselves, independent of what either side named them.
				//
				// A `null` value is kept, as a hash with no class. StyleX emits it for
				// a style that *unsets* a property, and in a merge it has to beat
				// whatever an earlier style set — dropping it would leave the earlier
				// class standing.
				const classes = property.value.properties
					.filter(
						(p) =>
							p.type === 'ObjectProperty' &&
							(p.value.type === 'StringLiteral' || p.value.type === 'NullLiteral')
					)
					.map((p) => `${propertyName(p)}=${p.value.type === 'NullLiteral' ? '' : p.value.value}`)
					.sort();
				if (classes.length > 0) entries[key] = classes.join(' ');
			}

			if (Object.keys(entries).length > 0) groups[declarator.id.name] = entries;
		}
	}

	return groups;
}

/**
 * Every literal `className: "…"` in compiled StyleX output — the call sites
 * where the compiler resolved the merge itself rather than leaving a style
 * object behind. Values are normalised to a sorted class list so comparison
 * does not depend on the order StyleX happened to emit.
 */
function extractInlineClassNames(code) {
	const ast = parseSync(code, {
		babelrc: false,
		configFile: false,
		sourceType: 'module',
		plugins: [[typescriptSyntax, { isTSX: false }]]
	});

	const found = new Set();

	const walk = (node) => {
		if (node == null || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			node.forEach(walk);
			return;
		}
		if (
			node.type === 'ObjectProperty' &&
			propertyName(node) === 'className' &&
			node.value?.type === 'StringLiteral'
		) {
			found.add(normaliseClasses(node.value.value.split(/\s+/)));
		}
		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
			walk(node[key]);
		}
	};

	walk(ast.program.body);
	return found;
}

function normaliseClasses(classes) {
	return [...classes].filter(Boolean).sort().join(' ');
}

/**
 * The classes our side would emit for one call site.
 *
 * This reproduces StyleX's merge rather than approximating it: the keys are
 * applied in the order the call site lists them and the last one to touch a
 * property hash wins, which is exactly what `stylex.props` does when it folds
 * the compiled objects together. A variant that only narrows one property —
 * `title` then `titleCompact` — therefore replaces that property's class
 * instead of accumulating both, and an unsetting style (a `null`, carried here
 * as a hash with no class) removes the earlier one.
 */
function classesForCombination(groups, keys) {
	const byHash = new Map();

	for (const key of keys) {
		// `stylex.defaultMarker()` is a style argument like any other — it compiles
		// to `{'x-default-marker': 'x-default-marker', $$css: true}` — but it has no
		// `stylex.create` key to name, so a call site that includes one cannot be
		// spelled as a list of group keys. This is the pseudo-key for it, and it
		// carries no version risk: the class is a fixed built-in on both sides, so
		// the run fails loudly if it ever stops being this string.
		if (key === BUILTIN_DEFAULT_MARKER) {
			byHash.set('x-default-marker', 'x-default-marker');
			continue;
		}

		const [group, name] = key.split('.');
		const entry = groups[group]?.[name];
		if (entry == null) return { missing: key };

		for (const [hash, classes] of parsePairs(entry)) {
			byHash.set(hash, classes.join(' '));
		}
	}

	return {
		classes: normaliseClasses([...byHash.values()].flatMap((v) => v.split(' ')))
	};
}

/**
 * Split an extracted `hash=class …` entry back into `[hash, classes]` pairs.
 *
 * One hash can carry several classes — a conditional style such as
 * `{default: '0', ':focus-visible': '2px'}` is one property and so one hash,
 * but two rules and two classes. Splitting on spaces alone would strip every
 * class after the first, which is exactly the kind of silent under-count an
 * oracle must not have.
 */
function parsePairs(entry) {
	const pairs = [];

	for (const token of entry.split(' ')) {
		if (token.includes('=')) {
			const [hash, className] = token.split('=');
			pairs.push([hash, [className]]);
		} else if (pairs.length > 0) {
			pairs[pairs.length - 1][1].push(token);
		}
	}

	return pairs;
}

/**
 * Upstream ships its compiled CSS as one file, one rule per line. Map a class
 * to the rules that define it, so a marker-bearing rule can be compared as CSS
 * rather than as a name.
 */
function loadUpstreamCss() {
	const file = path.join(upstream, 'astryx.css');
	if (!existsSync(file)) return new Map();

	const byClass = new Map();
	for (const line of readFileSync(file, 'utf8').split('\n')) {
		const rule = line.trim();
		if (rule === '') continue;
		// A rule names its own class several times over — StyleX repeats it to
		// raise specificity — so collect the distinct names before indexing.
		const names = new Set();
		for (const match of rule.matchAll(/\.([A-Za-z_][\w-]*)(?=[.:{[\s])/g)) names.add(match[1]);
		for (const name of names) {
			const existing = byClass.get(name);
			if (existing) existing.push(rule);
			else byClass.set(name, [rule]);
		}
	}
	return byClass;
}

/** The class a compiled `defineMarker()` export carries. */
function markerClassOf(code, name) {
	const ast = parseSync(code, {
		babelrc: false,
		configFile: false,
		sourceType: 'module',
		plugins: [[typescriptSyntax, { isTSX: false }]]
	});

	for (const statement of ast.program.body) {
		const declaration =
			statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
		if (declaration?.type !== 'VariableDeclaration') continue;
		for (const declarator of declaration.declarations) {
			if (declarator.id.type !== 'Identifier' || declarator.id.name !== name) continue;
			if (declarator.init?.type !== 'ObjectExpression') continue;
			for (const property of declarator.init.properties) {
				if (property.type !== 'ObjectProperty') continue;
				if (property.value.type === 'StringLiteral') return property.value.value;
			}
		}
	}
	return null;
}

/**
 * One CSS rule, reduced to what the comparison is actually about.
 *
 * Three things are names rather than styles here. The rule's own atomic class
 * is a hash of its content, so it is the *thing being identified* rather than
 * part of the identity. The marker class is a hash of its module's path, which
 * ours cannot match. And upstream's build pads specificity with `:not(#\#)`
 * where ours emits `@layer` — the open `useCSSLayers` item in port/todo.md, and a
 * difference in how the rule is *ordered*, not in what it does.
 */
function normaliseRule(rule, ownClass, markerClass) {
	return rule
		.replaceAll(':not(#\\#)', '')
		.replaceAll(`.${ownClass}`, '.SELF')
		.replaceAll(`.${markerClass}`, '.MARKER')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Look a class up in our compiled metadata (one rule) or upstream's sheet. */
const ourRuleLookup = (ctx) => (className) => {
	const rule = ctx.ourCss.get(className);
	return rule == null ? null : [rule];
};
const upstreamRuleLookup = (ctx) => (className) => ctx.upstreamCss.get(className);

/**
 * Reduce a list of class names to the set of CSS rules they resolve to, each
 * marker-normalised. Returns null if any class has no rule in the stylesheet —
 * a class we cannot account for is a finding, not a silent pass.
 *
 * This is the shared core of both marker comparisons: the object-diff path
 * feeds it a style key's classes, the inline path a merged call site's. Where a
 * `defineMarker()` is involved the class *names* cannot agree across the two
 * builds, so the emitted CSS is compared instead.
 */
function markerRulesForClasses(classNames, lookup, markerClass) {
	const rules = new Set();
	for (const className of classNames) {
		const found = lookup(className);
		if (found == null || found.length === 0) return null;
		// Upstream's stylesheet repeats a rule once per priority bucket, so the
		// distinct texts are what carry meaning, not how many there are.
		for (const rule of found) rules.add(normaliseRule(rule, className, markerClass));
	}
	return rules;
}

/** Whether two rule sets hold the same normalised rules (and are non-empty). */
function ruleSetsEqual(a, b) {
	if (a == null || b == null || a.size === 0 || a.size !== b.size) return false;
	for (const rule of a) if (!b.has(rule)) return false;
	return true;
}

/** Flatten an extracted `hash=class …` entry to its bare class names. */
function classNamesOfEntry(entry) {
	return parsePairs(entry).flatMap(([, classes]) => classes);
}

/**
 * Whether one style key's classes describe the same rules on both sides once
 * the marker class is normalised away.
 *
 * This is the check the class-name diff stands in for everywhere else. Where a
 * `defineMarker()` is involved the names *cannot* agree, so the oracle compares
 * the emitted CSS instead — which is stricter than a skip, and the only way
 * these keys stay checked at all.
 */
function markerRulesMatch(ourEntry, upstreamEntry, ctx) {
	if (ourEntry == null || ctx.ourMarker == null || ctx.upstreamMarker == null) return false;
	const ourRules = markerRulesForClasses(
		classNamesOfEntry(ourEntry),
		ourRuleLookup(ctx),
		ctx.ourMarker
	);
	const upstreamRules = markerRulesForClasses(
		classNamesOfEntry(upstreamEntry),
		upstreamRuleLookup(ctx),
		ctx.upstreamMarker
	);
	return ruleSetsEqual(ourRules, upstreamRules);
}

const upstreamCss = loadUpstreamCss();

/**
 * Read a file out of the upstream `dist/`, tolerating its absence.
 *
 * Upstream restructures its own tree between releases — 0.2.0 folded
 * `TreeList/treeListItem.markers.stylex.js` into `TreeListItem.js` — and a case
 * still pointing at the old path used to take the whole run down with a raw
 * `ENOENT` from `readFileSync`. That is the worst possible failure here: it
 * aborts at the first stale path, so every case *after* it goes unchecked and
 * the run reports nothing about them. A moved file is exactly the kind of drift
 * this script exists to notice, so it is reported as a mismatch and the run
 * carries on to the end.
 *
 * @returns {string | null} the file's contents, or null if it no longer exists
 */
function readUpstreamFile(relativePath) {
	try {
		return readFileSync(path.join(upstream, relativePath), 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

let checked = 0;
let skipped = 0;
let mismatches = 0;
let inlineChecked = 0;
const unusedSkips = [];
let markerChecked = 0;
let markerInlineChecked = 0;
let markerArtifacts = 0;

for (const testCase of CASES) {
	const compiled = await compileOursWithCss(testCase.file);
	const ours = extractGroups(compiled.code);
	const theirsCode = readUpstreamFile(testCase.upstreamFile);
	if (theirsCode === null) {
		mismatches++;
		console.log(
			`  ${path.basename(testCase.file)}: upstream no longer ships ` +
				`"${testCase.upstreamFile}" — it has moved or been removed; repoint the case`
		);
		continue;
	}
	const theirs = extractGroups(theirsCode);
	// The file stem, not its directory: `components/layout/` holds five style
	// modules, and naming them all "layout" would make a mismatch message
	// ambiguous about which one it came from.
	const label = path
		.basename(testCase.file)
		.replace(/\.js$/, '')
		.replace(/\.stylex$/, '');
	const skips = testCase.skip ?? {};
	const claimed = new Set();
	const before = { checked, skipped, inlineChecked };

	// A `defineMarker()` class is derived from its module's path, so ours can
	// never equal upstream's. Where a case declares one, a mismatching key falls
	// back to comparing the emitted CSS with both marker classes normalised.
	const upstreamMarkerCode = testCase.marker
		? readUpstreamFile(testCase.marker.upstreamFile)
		: null;
	if (testCase.marker && upstreamMarkerCode === null) {
		mismatches++;
		console.log(
			`  ${label}: upstream no longer ships marker module ` +
				`"${testCase.marker.upstreamFile}" — it has moved or been removed; repoint the case`
		);
		continue;
	}
	const marker = testCase.marker
		? {
				ourCss: compiled.css,
				upstreamCss,
				ourMarker: markerClassOf(await compileOurs(testCase.marker.file), testCase.marker.name),
				upstreamMarker: markerClassOf(upstreamMarkerCode, testCase.marker.name)
			}
		: null;

	for (const [group, entries] of Object.entries(theirs)) {
		if (skips[group]) {
			claimed.add(group);
			skipped += Object.keys(entries).length;
			// Same rule as the key-level skips below: a group that now matches in
			// full has served its purpose, and leaving the skip in place would go
			// on excusing something that no longer needs excusing.
			const ourSkipped = ours[testCase.rename?.[group] ?? group];
			const nowMatches =
				ourSkipped != null &&
				Object.entries(entries).every(([key, expected]) => ourSkipped[key] === expected);
			if (nowMatches) {
				unusedSkips.push(`${label}: ${group} (group now matches upstream — delete the skip)`);
			} else {
				console.log(`  ${label}: skipping group "${group}" — ${skips[group]}`);
			}
			continue;
		}

		const ourGroup = ours[testCase.rename?.[group] ?? group];
		if (!ourGroup) {
			console.log(`  ${label}: group "${group}" absent from our module`);
			mismatches += Object.keys(entries).length;
			continue;
		}

		for (const [key, expected] of Object.entries(entries)) {
			const skipKey = `${group}.${key}`;
			if (skips[skipKey]) {
				claimed.add(skipKey);
				skipped++;
				// A key-level skip stays honest only if we keep comparing it. One
				// that now matches has served its purpose — usually because an
				// upstream release caught up — and leaving it in place would go on
				// excusing a key that no longer needs excusing.
				if (ourGroup[key] === expected) {
					unusedSkips.push(`${label}: ${skipKey} (now matches upstream — delete the skip)`);
				} else {
					console.log(`  ${label}: skipping "${skipKey}" — ${skips[skipKey]}`);
				}
				continue;
			}

			checked++;
			if (ourGroup[key] !== expected) {
				if (marker && markerRulesMatch(ourGroup[key], expected, marker)) {
					markerChecked++;
					continue;
				}
				mismatches++;
				console.log(
					`  ${label} ${skipKey}\n    upstream: ${expected}\n    ours:     ${ourGroup[key] ?? '(absent)'}`
				);
			}
		}
	}

	const upstreamInline = testCase.inline ? extractInlineClassNames(theirsCode) : new Set();

	// A marker case can resolve an inline call site to a class whose *name* our
	// build cannot reproduce — a `defineMarker()`'s class is derived from its
	// module's path. So keep each upstream string's marker-normalised rule set
	// ready to compare as CSS, the same fallback the object-diff path uses.
	// `verifiedRules` gathers the rules of every string we matched, which is what
	// lets a lookup-table artifact be told apart from a missing style below.
	const upstreamInlineRules = marker
		? new Map(
				[...upstreamInline].map((s) => [
					s,
					markerRulesForClasses(s.split(' '), upstreamRuleLookup(marker), marker.upstreamMarker)
				])
			)
		: null;
	const verifiedRules = new Set();

	const inlineSkips = new Map((testCase.inlineSkip ?? []).map((s) => [s.keys.join(' + '), s]));
	const claimedInlineSkips = new Set();

	for (const keys of testCase.inline ?? []) {
		const combination = keys.join(' + ');
		const { missing, classes } = classesForCombination(ours, keys);

		if (missing) {
			inlineChecked++;
			mismatches++;
			console.log(`  ${label}: "${missing}" absent from our module`);
			continue;
		}

		const inlineSkip = inlineSkips.get(combination);
		if (inlineSkip) {
			claimedInlineSkips.add(combination);
			// Both retirement paths: our combination has caught up with upstream, or
			// upstream's dist no longer carries the string this excuses. Either way
			// the skip has served its purpose and must not go on excusing anything.
			if (upstreamInline.has(classes)) {
				upstreamInline.delete(classes);
				upstreamInlineRules?.delete(classes);
				unusedSkips.push(
					`${label}: inline [${combination}] (now matches upstream — delete the skip)`
				);
				continue;
			}
			if (!upstreamInline.has(inlineSkip.upstream)) {
				unusedSkips.push(
					`${label}: inline [${combination}] (the excused upstream string is gone — delete the skip)`
				);
				continue;
			}
			upstreamInline.delete(inlineSkip.upstream);
			upstreamInlineRules?.delete(inlineSkip.upstream);
			skipped++;
			console.log(`  ${label}: skipping inline [${combination}] — ${inlineSkip.reason}`);
			continue;
		}

		inlineChecked++;

		// Fast path: no marker in these classes, so the names agree and matching
		// the merged string against upstream's is the whole check.
		if (upstreamInline.has(classes)) {
			upstreamInline.delete(classes);
			for (const rule of upstreamInlineRules?.get(classes) ?? []) verifiedRules.add(rule);
			continue;
		}

		// Marker fallback: a marker-derived class differs by name, so compare the
		// CSS the merged classes resolve to with both marker classes normalised.
		if (marker) {
			const ourRules = markerRulesForClasses(
				classes.split(' '),
				ourRuleLookup(marker),
				marker.ourMarker
			);
			let matched = null;
			if (ourRules) {
				for (const [candidate, candidateRules] of upstreamInlineRules) {
					if (ruleSetsEqual(ourRules, candidateRules)) {
						matched = candidate;
						break;
					}
				}
			}
			if (matched != null) {
				upstreamInline.delete(matched);
				for (const rule of upstreamInlineRules.get(matched)) verifiedRules.add(rule);
				upstreamInlineRules.delete(matched);
				markerInlineChecked++;
				continue;
			}
		}

		mismatches++;
		console.log(
			`  ${label} [${keys.join(' + ')}]\n    ours:     ${classes}\n` +
				`    upstream has no matching call site; its inline classes are:\n` +
				[...upstreamInline].map((c) => `      ${c}`).join('\n')
		);
	}

	// An inline call site we never claimed is one upstream applies and we do not
	// — the same signal an absent group gives on the object-diff path. The one
	// exception is a marker case's lookup table: the compiler emits one entry per
	// combination of a call site's conditional style args (2^n of them, even
	// where the conditions are correlated and most combinations never occur at
	// runtime). Those extra entries only recombine keys we already verified, so a
	// leftover whose every rule is one we matched is that filler, not a missing
	// style. A leftover carrying any unverified rule is still a real finding.
	for (const leftover of upstreamInline) {
		if (marker) {
			const rules = upstreamInlineRules.get(leftover);
			if (rules && [...rules].every((rule) => verifiedRules.has(rule))) {
				markerArtifacts++;
				continue;
			}
		}
		mismatches++;
		console.log(`  ${label}: upstream applies classes we never produce: ${leftover}`);
	}

	// A skip that no longer matches anything upstream is stale, and would
	// otherwise go on quietly excusing a style that has since been renamed.
	for (const name of Object.keys(skips)) {
		if (!claimed.has(name)) unusedSkips.push(`${label}: ${name}`);
	}
	// Likewise an `inlineSkip` naming a combination the `inline` list no longer
	// declares: it excuses nothing and would hide the next real difference.
	for (const combination of inlineSkips.keys()) {
		if (!claimedInlineSkips.has(combination)) {
			unusedSkips.push(`${label}: inline [${combination}] (no matching \`inline\` entry)`);
		}
	}

	// A case that compared nothing is worse than no case at all: it reads on the
	// list as coverage while checking none. It happens when a module holds only
	// dynamic styles — the compiler leaves those as functions, so there is no
	// class to diff — and when an upstream file has been renamed out from under
	// an entry.
	if (
		checked === before.checked &&
		skipped === before.skipped &&
		inlineChecked === before.inlineChecked
	) {
		console.error(
			`\n${testCase.file} compared nothing against ${testCase.upstreamFile}.\n` +
				'Either the module holds only dynamic styles (there is nothing to compare, so\n' +
				'drop the case) or the upstream file no longer carries the styles it did.'
		);
		process.exit(1);
	}
}

for (const absent of ABSENT_UPSTREAM) {
	const label = path
		.basename(absent.file)
		.replace(/\.js$/, '')
		.replace(/\.stylex$/, '');
	const ours = extractGroups(await compileOurs(absent.file));
	// What the entry actually excuses: every class-bearing key of ours that has
	// no counterpart to be diffed against. Counting them keeps the run's
	// `skipped` total meaningful rather than off by a whole module.
	const excused = Object.values(ours).reduce((n, entries) => n + Object.keys(entries).length, 0);

	if (existsSync(path.join(upstream, absent.upstreamFile))) {
		unusedSkips.push(
			`${label}: ${absent.upstreamFile} now ships in dist/ — delete the entry and add a real case`
		);
		continue;
	}
	// The mirror of the empty-case guard: an entry excusing a module that
	// declares no comparable style reads as coverage deferred when there was
	// never anything to defer.
	if (excused === 0) {
		unusedSkips.push(
			`${label}: declares no comparable style, so the entry excuses nothing — delete it`
		);
		continue;
	}

	skipped += excused;
	console.log(`  ${label}: skipping module (${excused} keys) — ${absent.reason}`);
}

if (unusedSkips.length > 0) {
	console.log(`\nstale skips — these no longer excuse anything:\n  ${unusedSkips.join('\n  ')}`);
}

console.log(
	`\n${checked} style keys checked (${markerChecked} of them as marker-normalised CSS), ` +
		`${inlineChecked} inline call sites checked` +
		(markerInlineChecked || markerArtifacts
			? ` (${markerInlineChecked} of them as marker-normalised CSS, ` +
				`${markerArtifacts} lookup-table artifacts tolerated)`
			: '') +
		`, ${skipped} skipped, ${mismatches} mismatches`
);
process.exit(mismatches === 0 && unusedSkips.length === 0 ? 0 : 1);
