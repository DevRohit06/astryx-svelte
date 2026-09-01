import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	textSizeVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';
import { stepMarker } from './stepper.markers.stylex.js';
import type { StepperDensity, StepperOrientation } from './stepper-context.svelte.js';
import type { StepStatus } from './step-status.js';

/**
 * Ported from the `stylex.create` block in Astryx's `Stepper/Step.tsx`.
 *
 * Every connector this module draws — the separated progress bars and the
 * on-track segments alike — paints its accent fill as a scaled `::before` rather
 * than by swapping a background color, so a step the flow advances into grows
 * its line along the track. See the CONNECTOR FILL block below for the
 * axis/RTL/reduced-motion rules that go with it.
 *
 * Exactly one change animates: advancing a single step. Going back, jumping
 * forward by more than one, and mounting mid-flow all land at once.
 */

/** Internal progress through the sequence, derived from the parent's `activeStep`. */
export type StepProgress = 'completed' | 'in-progress' | 'not-started';

const BAR_WIDTH = spacingVars['--spacing-1'];
// Every indicator — check, ring, custom icon, number badge — occupies the same
// box, so the `auto` mode swapping a number for a check as a step completes
// never nudges the label or the track.
const INDICATOR_SIZE = spacingVars['--spacing-4'];
// Indicator (16px) + the label-row gap (8px). The indent that lines a
// description or a content slot up with the label above it.
const INDICATOR_GUTTER = spacingVars['--spacing-6'];

// --- Connector fill motion ---
//
// One change animates: advancing exactly one step. Going back, jumping
// forward by more than one, and mounting mid-flow all apply at once.
//
// Animating the others was tried and read worse than not animating them. A
// retreat is the clearest case: run forward, the transition ends with a bar
// that is nearly full, and nearly full is indistinguishable from full, so the
// eye calls it arrived well before it settles. Run backward, the same curve
// ends with a shrinking stub of accent still on the track, and a remnant that
// is still there reads unmistakably as not finished. Identical arithmetic in
// both directions — measurably so — and the backward one still feels slow,
// because the tail is what is visible rather than what is hidden. No easing
// fixes that; only not animating it does. A multi-step jump fails differently:
// it is a navigation rather than a progression, and sweeping a front across
// four segments makes the user sit through a journey they asked to skip.
//
// What is left is the one gesture where the movement carries the meaning: the
// flow went forward one step, and the line grows to show it. That span takes
// the medium band — a fill crossing a whole segment is a spatial change, not a
// micro-interaction, so per `astryx docs motion` it sits above the fast band
// reserved for high-frequency states like hover.
const FILL_SPAN_TIME = durationVars['--duration-medium'];

// Share of one node-to-node span owned by the segment *arriving* at the far
// node; the segment leaving the near node takes the rest. On-track spans are
// drawn by two steps (see the ON-TRACK section), and the time has to be split
// the way the length is or the two halves sweep at visibly different speeds.
//
// Horizontal: both halves are `flex: 1` inside equal-width steps, so an even
// split is the proportional one.
//
// Vertical: the halves are nothing like equal, and no constant can be right
// for all of them. The arriving half is otSegLeadV, a cap fixed at one density
// space; the leaving half is otSegFlexV, grown to whatever is left of the step
// row, so its length turns on label and description lengths this file cannot
// see. Measured in the browser the cap is 40% of a plain balanced span (8 of
// 20px) but 21% once the step carries a description (8 of 38px). 0.3 is the
// value that minimises the worse of those two: it leaves the cap ~1.6x off the
// rail's speed either way, where tuning to one case puts the other past 2x.
// Matching each case exactly would mean measuring the rendered rail, a layout
// read this system avoids.
const OT_ARRIVAL_SHARE_H = 0.5;
const OT_ARRIVAL_SHARE_V = 0.3;
// A vertical step carrying a content slot draws a third segment down the side
// of it (otContentSegV) which continues the leaving half past the row, so the
// leaving half's time splits again. A slot runs several times the rail left
// above it — 34px of rail to 108px of slot in the spacious content story — and
// this is the middle of that range. Matching it exactly would mean measuring
// the rendered slot; the ordering is what keeps the front contiguous, and this
// keeps its speed in the right neighbourhood.
const OT_RAIL_SHARE_OF_LEAVING = 0.25;

/**
 * Scale a CSS `<time>` by a unitless factor, collapsing the trivial cases.
 *
 * Module-private, as upstream's is: `stepFillTimings` below is the only caller,
 * and exporting it would publish a symbol upstream does not have.
 */
function fillTimeSlice(time: string, factor: number): string {
	if (factor <= 0) {
		return '0s';
	}
	if (factor === 1) {
		return time;
	}
	// Rounded because the factors are sums of shares, and float noise would
	// otherwise reach the emitted custom property as `calc(... * 0.7000000001)`.
	return `calc(${time} * ${Number(factor.toFixed(4))})`;
}

const styles = stylex.create({
	// ===================== VERTICAL LAYOUT =====================
	verticalRoot: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'stretch',
		position: 'relative',
		gap: spacingVars['--spacing-0-5']
	},

	// 4px progress bar segment. Its filled/unfilled paint comes from the shared
	// connector styles below, not from here.
	verticalBar: {
		width: BAR_WIDTH,
		borderRadius: radiusVars['--radius-full'],
		flexShrink: 0,
		alignSelf: 'stretch'
	},

	// Step body — the selectable area
	verticalBody: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1
	},

	// ===================== HORIZONTAL LAYOUT =====================
	horizontalStep: {
		display: 'flex',
		flexDirection: 'column',
		// Stretch, not flex-start: a flex-start child is sized to fit-content,
		// which is floored at its own min-content and would spill the label past
		// the step's slice of the track and into the next step. Stretched, the
		// label row is exactly as wide as the step and the label wraps inside it.
		alignItems: 'stretch',
		flex: 1,
		// `flex: 1` alone does not make the steps equal: a flex item's default
		// `min-width: auto` floors it at its own min-content width, so a step
		// labelled "Integrations" claims a wider slice of the track than one
		// labelled "Team". Zeroing the floor lets the even distribution actually
		// apply, which is what keeps every progress segment the same width.
		minWidth: 0
		// density padding applied via density styles below
	},

	// Full-width progress bar segment sitting above each horizontal step.
	// Each step owns its own segment (filled from its derived progress) so the
	// parent never has to introspect children to build the bar.
	horizontalBar: {
		width: '100%',
		height: BAR_WIDTH,
		borderRadius: radiusVars['--radius-full'],
		flexShrink: 0,
		marginBlockEnd: spacingVars['--spacing-0-5']
	},

	// ===================== CONNECTOR FILL =====================
	// Shared by every connector the four layout combinations draw: the separated
	// bars (verticalBar, horizontalBar) and the on-track segments (otSegBaseV,
	// otSegH, otContentSegV).
	//
	// The segment element is the *unfilled* track and never changes color; the
	// accent fill is a ::before scaled along the track axis. Advancing a step
	// grows it out of the segment's leading edge, so the line reads as progress
	// travelling rather than a bar changing state. The obvious alternative,
	// transitioning `background-color` between accent and border on the segment
	// itself, lights the whole segment at once: a flash, with no direction in
	// it. Going the other way the scale still returns to zero, but instantly —
	// only a single step forward is given a duration to cross (see the motion
	// block above).
	//
	// A pseudo-element rather than a real child element, because the connector is
	// emitted from seven places and several of them size themselves in ways a
	// child would have to re-derive (otSegFlexV grows, otSegLeadV is fixed,
	// otContentSegV is absolutely positioned). ::before inherits the box for
	// free, so one style covers all of them.
	//
	// Mount is deliberately not animated, and falls out of how transitions work:
	// interpolation needs a previous computed value and a freshly rendered
	// element has none. A stepper that opens on step 3 paints the segments behind
	// it filled, instantly, instead of playing its whole history back.
	connectorTrack: {
		position: 'relative',
		backgroundColor: colorVars['--color-border'],
		'::before': {
			content: '""',
			position: 'absolute',
			inset: 0,
			// Follows whatever the segment itself rounds to: the full pill of a
			// separated bar, the square ends the on-track segments need in order to
			// stack into one continuous line.
			borderRadius: 'inherit',
			backgroundColor: colorVars['--color-accent'],
			transitionProperty: 'transform',
			// Resting duration, for a segment moving on its own. connectorTiming
			// below replaces it on every connector — each one is handed either its
			// slice of the animated span or a zero — so this is the fallback that
			// applies if a connector is ever rendered without it.
			transitionDuration: {
				default: FILL_SPAN_TIME,
				'@media (prefers-reduced-motion: reduce)': '0s'
			},
			// Linear, deliberately, and not the `--ease-standard` the rest of the
			// system transitions on. A node-to-node span is not always one element:
			// in the on-track layouts the segment leaving one node and the segment
			// arriving at the next draw it between them, and a vertical step with a
			// content slot splits it three ways. A curve applied per segment
			// restarts its deceleration at every seam, so the front lurches, stalls
			// at the joint, and the joint becomes the most visible thing in the
			// animation — the fill stops reading as one line growing and starts
			// reading as two pieces taking turns. Linear is the only timing that
			// stitches into a single constant-speed front. The separated bars run
			// linear too: a lone segment gives up very little by it, and the two
			// layouts should not animate with different character.
			transitionTimingFunction: 'linear'
		}
	},
	// This segment's slice of the animated span, or a pair of zeros for a
	// segment that is not part of it (see the motion block above the styles).
	// Dynamic because which segments animate, and over what part of the span,
	// depends on where the active step just moved from — known only at render.
	// StyleX routes the values through a custom property, so these are still
	// generated rules and not inline styles.
	//
	// Restates the reduced-motion escape connectorTrack declares rather than
	// relying on it: a StyleX style that redefines a property replaces the
	// earlier definition wholesale, conditions included. Without it a
	// reduced-motion user would get an on-track span as two instant snaps spaced
	// apart by the delay — motion smuggled back in as timing. Zeroing the delay
	// alongside the duration lands the whole span at once instead.
	connectorTiming: (duration: string, delay: string) => ({
		'::before': {
			transitionDuration: {
				default: duration,
				'@media (prefers-reduced-motion: reduce)': '0s'
			},
			transitionDelay: {
				default: delay,
				'@media (prefers-reduced-motion: reduce)': '0s'
			}
		}
	}),
	// Vertical track: progress runs down the block axis under both LTR and RTL
	// (direction only mirrors the inline axis), so the growth anchors at the
	// physical top either way.
	connectorFillV: {
		'::before': { transformOrigin: 'center top', transform: 'scaleY(1)' }
	},
	connectorEmptyV: {
		'::before': { transformOrigin: 'center top', transform: 'scaleY(0)' }
	},
	// Horizontal track: progress runs along the reading direction, so the growth
	// anchors at the inline-start edge — physically left in LTR, right in RTL.
	// `transform-origin` accepts no logical keywords, so the flip is spelled out
	// with the same `:is([dir="rtl"] *)` hook Switch's thumb travel and the
	// shared rtlStyles.mirror use. Stated on both states rather than hoisted onto
	// connectorTrack, which is axis-agnostic and shared with the vertical
	// segments.
	connectorFillH: {
		'::before': {
			transformOrigin: {
				default: 'left center',
				':is([dir="rtl"] *)': 'right center'
			},
			transform: 'scaleX(1)'
		}
	},
	connectorEmptyH: {
		'::before': {
			transformOrigin: {
				default: 'left center',
				':is([dir="rtl"] *)': 'right center'
			},
			transform: 'scaleX(0)'
		}
	},

	// ===================== SHARED =====================

	// Icon + Label in one row
	iconLabelRow: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},

	// Indicator icon container
	icon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: INDICATOR_SIZE,
		height: INDICATOR_SIZE,
		flexShrink: 0
	},
	iconCompleted: {
		color: colorVars['--color-accent']
	},
	iconInProgress: {
		color: colorVars['--color-accent']
	},
	iconNotStarted: {
		color: colorVars['--color-icon-secondary']
	},
	iconDisabled: {
		color: colorVars['--color-icon-disabled'],
		opacity: 0.5
	},
	// Semantic status overrides for the icon — color only.
	iconAccent: {
		color: colorVars['--color-accent']
	},
	iconSuccess: {
		color: colorVars['--color-success']
	},
	iconWarning: {
		color: colorVars['--color-warning']
	},
	iconError: {
		color: colorVars['--color-error']
	},

	// Number badge — same box as every other indicator (see INDICATOR_SIZE).
	numberBadge: {
		display: 'grid',
		placeItems: 'center',
		width: INDICATOR_SIZE,
		height: INDICATOR_SIZE,
		borderRadius: radiusVars['--radius-full'],
		// The digit has to read at the same optical weight as the check glyph it
		// alternates with inside a 16px circle, which the supporting size (12px)
		// overfills — it leaves no room for a two-digit step. This is the scale
		// step below it, still a token so themes rescale it. The digit is centered
		// by the grid (placeItems), so no explicit line-height is needed — this
		// matches how Avatar/AvatarGroup center a single glyph in a circle.
		fontSize: textSizeVars['--font-size-xs'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		flexShrink: 0,
		textAlign: 'center'
	},
	numberCompleted: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-background-surface']
	},
	numberInProgress: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-background-surface']
	},
	numberNotStarted: {
		backgroundColor: colorVars['--color-background-muted'],
		color: colorVars['--color-text-secondary']
	},
	numberDisabled: {
		backgroundColor: colorVars['--color-background-muted'],
		color: colorVars['--color-text-disabled'],
		opacity: 0.5
	},
	// Semantic status overrides for the number badge — color only.
	numberAccent: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent']
	},
	numberSuccess: {
		backgroundColor: colorVars['--color-success'],
		color: colorVars['--color-on-success']
	},
	numberWarning: {
		backgroundColor: colorVars['--color-warning'],
		color: colorVars['--color-on-warning']
	},
	numberError: {
		backgroundColor: colorVars['--color-error'],
		color: colorVars['--color-on-error']
	},

	// Label
	label: {
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-primary'],
		// Horizontal steps divide the track evenly, so a label can end up with
		// less room than it wants. Let it shrink past its longest word and break
		// that word rather than overlap the neighbouring step. Inert wherever
		// there is room, which is every vertical stepper.
		minWidth: 0,
		overflowWrap: 'break-word'
	},
	labelInProgress: {
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	labelNotStarted: {
		color: colorVars['--color-text-secondary']
	},
	labelDisabled: {
		color: colorVars['--color-text-disabled']
	},

	// Optional tag
	optionalDot: {
		fontSize: typeScaleVars['--text-body-size'],
		color: colorVars['--color-text-secondary']
	},
	optionalText: {
		fontSize: typeScaleVars['--text-body-size'],
		color: colorVars['--color-text-secondary']
	},

	// Description
	descriptionRow: {
		paddingInlineStart: spacingVars['--spacing-0']
	},
	descriptionRowWithIndicator: {
		paddingInlineStart: INDICATOR_GUTTER
	},
	description: {
		// Block, not inline. An inline span is laid out in a line box belonging to
		// its parent, and that box is floored by the parent's strut — the invisible
		// box every block container reserves from its own font and line-height. The
		// row inherits the page's 16px/24px, so an inline description sat in a 24px
		// line box no matter how tight its own leading was, padding the gap under
		// the label. Blockifying moves the strut onto this span, where the metrics
		// below apply and the box hugs the text at 16px.
		display: 'block',
		fontSize: typeScaleVars['--text-supporting-size'],
		// The supporting-leading token (1.667 → 20px at 12px) reads too loose for
		// a caption sitting under its label; a fixed 16px line box (the --spacing-4
		// step) is tighter without collapsing the text the way capsize trim did,
		// and stays on the spacing scale rather than a raw literal.
		lineHeight: spacingVars['--spacing-4'],
		color: colorVars['--color-text-secondary']
	},

	// Step content (children / flex slot)
	stepContent: {
		paddingBlockStart: spacingVars['--spacing-2']
	},
	// The label row sits inside the density-padded hover target, but the content
	// slot is that target's *sibling* — a <button> cannot contain the buttons and
	// inputs a content slot usually holds, so the slot has to live outside it.
	// Left alone the slot therefore starts at the step edge while the label above
	// starts one density pad in. Reproducing that pad here is what keeps the two
	// flush; the gutter on top of it is what lines the content up with the label
	// rather than with the indicator.
	contentIndent: (inlinePad: string, gutter: string) => ({
		paddingInlineStart: `calc(${inlinePad} + ${gutter})`,
		paddingInlineEnd: inlinePad
	}),

	// Density. Block padding only — the inline half comes from densityInline,
	// which is passed in so the content slot outside this wrapper can apply the
	// same value.
	densityCompact: {
		paddingBlock: spacingVars['--spacing-1']
	},
	densityBalanced: {
		paddingBlock: spacingVars['--spacing-2']
	},
	densitySpacious: {
		paddingBlock: spacingVars['--spacing-3']
	},
	densityInline: (value: string) => ({
		paddingInline: value
	}),

	// Button reset for clickable steps
	buttonReset: {
		all: 'unset',
		textAlign: 'start',
		alignItems: 'stretch',
		display: 'flex',
		flexDirection: 'column',
		width: '100%',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element'],
		transitionProperty: 'background-color',
		transitionDuration: {
			default: durationVars['--duration-fast-min'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: 'transparent'
	},

	// ===================== ON-TRACK LAYOUT =====================
	// Indicator is slotted into the connector line as a node on the track.
	// Each step draws the connector segments that flank its own indicator; the
	// segment *before* the indicator is hidden on the first step (step === 0) so
	// the track starts at the first node. Segments abut the indicator directly,
	// so no child introspection or total-count is needed.

	otVerticalRoot: {
		display: 'flex',
		flexDirection: 'column',
		position: 'relative'
	},
	otHorizontalRoot: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0
	},

	// Interactive wrapper (indicator + label act as one click target).
	otInteractive: {
		all: 'unset',
		boxSizing: 'border-box',
		// `all: unset` leaves the <button> UA default of centered text; force
		// start so vertical labels/descriptions read left-aligned. Horizontal
		// labels re-center via otLabelWrapH (a deeper element).
		textAlign: 'start',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element'],
		transitionProperty: 'background-color',
		transitionDuration: {
			default: durationVars['--duration-fast-min'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: 'transparent'
	},

	otRowWrap: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'stretch',
		gap: spacingVars['--spacing-2'],
		width: '100%'
	},
	otColWrap: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'stretch',
		width: '100%'
	},

	// Vertical indicator column: [segment] [indicator] [segment] stacked.
	otIndicatorColV: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		width: INDICATOR_SIZE,
		flexShrink: 0,
		alignSelf: 'stretch'
	},
	// Shared segment base: square ends so stacked segments read as one
	// continuous line (no radius).
	otSegBaseV: {
		width: BAR_WIDTH,
		flexShrink: 0,
		borderRadius: 0
	},
	// Flexible segment (below the node) — grows to fill the step height and
	// meets the next node's leading segment.
	otSegFlexV: {
		flex: 1,
		minHeight: spacingVars['--spacing-2']
	},
	// Fixed leading segment (above the node) — its height offsets the node down
	// so it aligns with the label's first line instead of the step's center.
	otSegLeadV: (value: string) => ({
		height: value
	}),

	// Horizontal track row: [segment] [indicator] [segment] in a line.
	otTrackRowH: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%'
	},
	otSegH: {
		height: BAR_WIDTH,
		flex: 1,
		minWidth: spacingVars['--spacing-2'],
		borderRadius: 0
	},

	otSegHiddenIfFirst: {
		// Structural first/last hiding keyed off the step's own <li> position via
		// stepMarker, so it never depends on the parent counting children (which
		// breaks when steps are grouped in a fragment). Scoped to stepMarker so only
		// the parent <li> is checked, not the outer <ol> (also a :first/:last-child).
		visibility: {
			default: 'visible',
			[stylex.when.ancestor(':first-child', stepMarker)]: 'hidden'
		}
	},
	otSegHiddenIfLast: {
		visibility: {
			default: 'visible',
			[stylex.when.ancestor(':last-child', stepMarker)]: 'hidden'
		}
	},

	otBodyV: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		flex: 1,
		gap: spacingVars['--spacing-0-5'],
		minWidth: 0
	},
	otLabelWrapH: {
		display: 'flex',
		flexDirection: 'column',
		// Stretch rather than center for the same reason as horizontalStep: a
		// centered child is fit-content sized and would spill past its node.
		// The label still reads centered under the node — otLabelRowCenter
		// centers it inside the full-width row.
		alignItems: 'stretch',
		gap: spacingVars['--spacing-0-5'],
		textAlign: 'center'
	},
	otLabelRowStart: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	otLabelRowCenter: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-1']
	},

	// Inline offset comes from contentIndent, and only in the vertical layout —
	// a horizontal on-track step pads its hover target on the block axis alone,
	// so its content slot already starts flush with the column above it.
	otContent: {
		paddingBlockStart: spacingVars['--spacing-2']
	},
	// A vertical on-track step draws its connector inside the row holding the
	// indicator and label, and the content slot sits below that row rather than
	// in it (the row is a <button> when the step is clickable, which cannot
	// contain the controls a content slot usually holds). So the line stops at
	// the label and the track breaks open wherever a step carries content.
	// otContentSegV continues it: a segment spanning the slot's full height, on
	// the same rail the row's segments run down, which closes the gap between
	// this step's indicator and the next one's.
	otContentWrapV: {
		position: 'relative'
	},
	otContentSegV: (inlinePad: string) => ({
		position: 'absolute',
		insetBlock: 0,
		// Center on the rail: the row pads itself by inlinePad, then centers a
		// BAR_WIDTH line inside an INDICATOR_SIZE-wide column.
		insetInlineStart: `calc(${inlinePad} + (${INDICATOR_SIZE} - ${BAR_WIDTH}) / 2)`,
		width: BAR_WIDTH
	}),

	// Density-driven spacing. The connector runs along the "track axis"
	// (vertical = block, horizontal = inline), so density is only ever applied
	// to the *cross* axis — padding the track axis would break the line into
	// gapped segments.
	//
	// Vertical: pad the whole step row (indicator rail + label) so density adds
	// breathing room *around the indicators*, not just the text. Applied to the
	// hover target itself.
	otRowPadV: (value: string) => ({
		paddingBlock: value,
		paddingInline: value
	}),
	// The rail draws the connector, so it must span the row's full block extent
	// to keep the line continuous. A negative block margin cancels the wrapper's
	// block padding, letting the line bridge step-to-step while the label still
	// sits inside the padding.
	otRailBridgeV: (value: string) => ({
		marginBlock: `calc(-1 * ${value})`
	}),
	// Horizontal: block padding around the track+label column (inside the hover
	// target) adds vertical breathing room while the inline track stays flush.
	otPadBlock: (value: string) => ({
		paddingBlock: value
	}),
	otMarginTop: (value: string) => ({
		marginBlockStart: value
	})
});

/**
 * Inline padding of a separated step's hover target. Density varies the block
 * padding freely, but the inline value has to be readable from out here: the
 * content slot renders outside that target and re-applies it to stay aligned
 * (see `contentIndent`), so keeping it in one place is what stops the two
 * drifting apart.
 */
function separatedDensityInline(density: StepperDensity): string {
	return density === 'spacious' ? spacingVars['--spacing-3'] : spacingVars['--spacing-2'];
}

/** The on-track layouts' single density space, used for padding and rail offsets. */
function densitySpaceFor(density: StepperDensity): string {
	return density === 'compact'
		? spacingVars['--spacing-1']
		: density === 'spacious'
			? spacingVars['--spacing-3']
			: spacingVars['--spacing-2'];
}

function densityBlockStyle(density: StepperDensity): StyleArg {
	return density === 'compact'
		? styles.densityCompact
		: density === 'spacious'
			? styles.densitySpacious
			: styles.densityBalanced;
}

// ===================== CONNECTOR TIMING =====================

export interface StepFillTimingOptions {
	step: number;
	activeStep: number;
	previousActiveStep: number;
	isVertical: boolean;
	/** A vertical on-track step with a content slot draws a third segment. */
	hasContentSeg: boolean;
}

/**
 * Every connector's slice of the animated span, as StyleX timing styles.
 *
 * Both layouts are measured in the same unit, the node-to-node span: on-track
 * span k runs from node k to node k+1, and a separated step's lone bar is the
 * span arriving at it (bar s fills on exactly the condition span s-1 does). So
 * one rule serves both, and neither needs to know the step count.
 *
 * Only a single forward step animates, and the span it crosses is the one
 * leaving the step the flow came from. Every other segment — the untouched
 * ones, and every segment of a jump or a retreat — is handed a zero duration,
 * so it lands at once and carries no stale delay into a later change.
 */
export function stepFillTimings({
	step,
	activeStep,
	previousActiveStep,
	isVertical,
	hasContentSeg
}: StepFillTimingOptions): {
	bar: StyleArg;
	before: StyleArg;
	rail: StyleArg;
	content: StyleArg;
} {
	const isSingleAdvance = activeStep === previousActiveStep + 1;
	const animatedSpan = previousActiveStep;

	/**
	 * Timing for the segment covering `[offset, offset + share)` of span
	 * `spanIndex`, both expressed as fractions of that span.
	 */
	const fillTiming = (spanIndex: number, offset: number, share: number): StyleArg => {
		if (!isSingleAdvance || spanIndex !== animatedSpan) {
			return styles.connectorTiming('0s', '0s');
		}
		return styles.connectorTiming(
			fillTimeSlice(FILL_SPAN_TIME, share),
			fillTimeSlice(FILL_SPAN_TIME, offset)
		);
	};

	// A node-to-node span is drawn by two steps: this one's trailing segments
	// leave its own node, the next one's leading cap arrives at the next node.
	// Both flip on the same condition, so left to themselves they fill together
	// and one gap between two nodes reads as two dashes converging on the space
	// between them. Handing each its own slice of the span's time, in track
	// order — the leaving half first, then the arriving one — is what closes
	// that into a single line growing.
	const arrivalShare = isVertical ? OT_ARRIVAL_SHARE_V : OT_ARRIVAL_SHARE_H;
	const leavingShare = 1 - arrivalShare;
	// A content slot's segment continues the leaving half below the row, so the
	// two divide the leaving time between them; with no slot the rail segment
	// takes all of it. Each step can work this out for its own trailing side
	// alone: the arriving cap always takes the span's last `arrivalShare`, so
	// the step drawing it never has to know whether the step before it carries
	// a slot.
	const railShare = leavingShare * (hasContentSeg ? OT_RAIL_SHARE_OF_LEAVING : 1);
	const contentShare = leavingShare - railShare;

	return {
		// A separated step draws the whole span arriving at it, so it fills for the
		// span's entire slice with nothing to sequence against.
		bar: fillTiming(step - 1, 0, 1),
		before: fillTiming(step - 1, leavingShare, arrivalShare),
		rail: fillTiming(step, 0, railShare),
		content: fillTiming(step, railShare, contentShare)
	};
}

// ===================== ATTRS =====================

export interface StepRootOptions {
	orientation: StepperOrientation;
	indicatorPosition: 'separated' | 'on-track';
}

/** The step's `<li>`, which also carries the marker the connectors key off. */
export function stepRootAttrs(
	{ orientation, indicatorPosition }: StepRootOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const isVertical = orientation === 'vertical';
	const root =
		indicatorPosition === 'on-track'
			? isVertical
				? styles.otVerticalRoot
				: styles.otHorizontalRoot
			: isVertical
				? styles.verticalRoot
				: styles.horizontalStep;

	return sx(stepMarker, root, xstyle);
}

/** The separated layout's 4px progress bar segment. */
export function stepBarAttrs({
	isVertical,
	isBarFilled,
	timing
}: {
	isVertical: boolean;
	isBarFilled: boolean;
	timing: StyleArg;
}): SvelteStyleAttrs {
	return sx(
		isVertical ? styles.verticalBar : styles.horizontalBar,
		styles.connectorTrack,
		isVertical
			? isBarFilled
				? styles.connectorFillV
				: styles.connectorEmptyV
			: isBarFilled
				? styles.connectorFillH
				: styles.connectorEmptyH,
		timing
	);
}

/** The vertical layout's body column, holding the hover target and the slot. */
export function stepVerticalBodyAttrs(): SvelteStyleAttrs {
	return sx(styles.verticalBody);
}

/**
 * The separated layout's hover target — a `<button>` when the step is
 * clickable, a plain `<div>` otherwise.
 */
export function stepBodyAttrs({
	density,
	isClickable
}: {
	density: StepperDensity;
	isClickable: boolean;
}): SvelteStyleAttrs {
	return isClickable
		? sx(
				styles.buttonReset,
				// Upstream 0.5.1: hover/pressed background moved to the shared module.
				interactionOverlayStyles.backgroundColor,
				focusOutlineStyles.focusVisible,
				densityBlockStyle(density),
				styles.densityInline(separatedDensityInline(density))
			)
		: sx(densityBlockStyle(density), styles.densityInline(separatedDensityInline(density)));
}

/** Indicator + label in one row. */
export function stepIconLabelRowAttrs(): SvelteStyleAttrs {
	return sx(styles.iconLabelRow);
}

export interface StepIndicatorTintOptions {
	progress: StepProgress;
	status: StepStatus | undefined;
	isDisabled: boolean;
}

/**
 * The glyph indicator's box and tint.
 *
 * Priority: disabled → a custom icon takes the raw `status` colour → a status
 * glyph takes its own → otherwise the progress-derived default.
 */
export function stepIndicatorIconAttrs({
	progress,
	status,
	isDisabled,
	hasCustomIcon,
	statusGlyph
}: StepIndicatorTintOptions & {
	hasCustomIcon: boolean;
	statusGlyph: 'success' | 'warning' | 'error' | null;
}): SvelteStyleAttrs {
	const progressStyle =
		progress === 'completed'
			? styles.iconCompleted
			: progress === 'in-progress'
				? styles.iconInProgress
				: styles.iconNotStarted;

	const colorStyle = isDisabled
		? styles.iconDisabled
		: hasCustomIcon
			? status === 'accent'
				? styles.iconAccent
				: status === 'success'
					? styles.iconSuccess
					: status === 'warning'
						? styles.iconWarning
						: status === 'error'
							? styles.iconError
							: progressStyle
			: statusGlyph === 'success'
				? styles.iconSuccess
				: statusGlyph === 'warning'
					? styles.iconWarning
					: statusGlyph === 'error'
						? styles.iconError
						: progressStyle;

	return sx(styles.icon, colorStyle);
}

/**
 * The numbered badge's box and tint.
 *
 * Status only fills the badge once the step is reached. A not-started step
 * stays neutral — otherwise `accent` (which has no glyph to swap in) would
 * paint an inverted accent badge on an upcoming step, making it read as
 * active/completed.
 */
export function stepIndicatorNumberAttrs({
	progress,
	status,
	isDisabled
}: StepIndicatorTintOptions): SvelteStyleAttrs {
	const isReached = progress === 'completed' || progress === 'in-progress';
	const colorStyle = isDisabled
		? styles.numberDisabled
		: isReached && status === 'accent'
			? styles.numberAccent
			: isReached && status === 'success'
				? styles.numberSuccess
				: isReached && status === 'warning'
					? styles.numberWarning
					: isReached && status === 'error'
						? styles.numberError
						: progress === 'completed'
							? styles.numberCompleted
							: progress === 'in-progress'
								? styles.numberInProgress
								: styles.numberNotStarted;

	return sx(styles.numberBadge, colorStyle);
}

/** The label text. */
export function stepLabelAttrs({
	progress,
	isDisabled
}: {
	progress: StepProgress;
	isDisabled: boolean;
}): SvelteStyleAttrs {
	const colorStyle = isDisabled
		? styles.labelDisabled
		: progress === 'not-started'
			? styles.labelNotStarted
			: progress === 'in-progress'
				? styles.labelInProgress
				: undefined;

	return sx(styles.label, colorStyle);
}

/** The separator dot before the "Optional" affordance. */
export function stepOptionalDotAttrs(): SvelteStyleAttrs {
	return sx(styles.optionalDot);
}

/** The "Optional" affordance itself. */
export function stepOptionalTextAttrs(): SvelteStyleAttrs {
	return sx(styles.optionalText);
}

/** The separated layout's description row, indented to clear the indicator. */
export function stepDescriptionRowAttrs(hasIndicator: boolean): SvelteStyleAttrs {
	return sx(hasIndicator ? styles.descriptionRowWithIndicator : styles.descriptionRow);
}

/** The description text, in either layout. */
export function stepDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.description);
}

/** The separated layout's content slot. */
export function stepContentAttrs({
	density,
	hasIndicator
}: {
	density: StepperDensity;
	hasIndicator: boolean;
}): SvelteStyleAttrs {
	return sx(
		styles.stepContent,
		styles.contentIndent(separatedDensityInline(density), hasIndicator ? INDICATOR_GUTTER : '0px')
	);
}

/**
 * The on-track layout's hover target — a `<button>` when the step is clickable,
 * a plain `<div>` otherwise.
 */
export function stepOtWrapAttrs({
	isVertical,
	density,
	isClickable
}: {
	isVertical: boolean;
	density: StepperDensity;
	isClickable: boolean;
}): SvelteStyleAttrs {
	const space = densitySpaceFor(density);
	const shape = isVertical ? styles.otRowWrap : styles.otColWrap;
	const pad = isVertical ? styles.otRowPadV(space) : styles.otPadBlock(space);

	return isClickable
		? sx(
				styles.otInteractive,
				interactionOverlayStyles.backgroundColor,
				shape,
				pad,
				focusOutlineStyles.focusVisible
			)
		: sx(shape, pad);
}

/** The vertical on-track layout's indicator rail column. */
export function stepOtIndicatorColAttrs(density: StepperDensity): SvelteStyleAttrs {
	return sx(styles.otIndicatorColV, styles.otRailBridgeV(densitySpaceFor(density)));
}

function connectorAxisStyle(isVertical: boolean, isFilled: boolean): StyleArg {
	return isVertical
		? isFilled
			? styles.connectorFillV
			: styles.connectorEmptyV
		: isFilled
			? styles.connectorFillH
			: styles.connectorEmptyH;
}

/** The on-track segment arriving at this step's node, hidden on the first step. */
export function stepOtLeadSegAttrs({
	isVertical,
	density,
	isFilled,
	timing
}: {
	isVertical: boolean;
	density: StepperDensity;
	isFilled: boolean;
	timing: StyleArg;
}): SvelteStyleAttrs {
	return isVertical
		? sx(
				styles.otSegBaseV,
				styles.otSegLeadV(densitySpaceFor(density)),
				styles.connectorTrack,
				connectorAxisStyle(true, isFilled),
				timing,
				styles.otSegHiddenIfFirst
			)
		: sx(
				styles.otSegH,
				styles.connectorTrack,
				connectorAxisStyle(false, isFilled),
				timing,
				styles.otSegHiddenIfFirst
			);
}

/** The on-track segment leaving this step's node, hidden on the last step. */
export function stepOtRailSegAttrs({
	isVertical,
	isFilled,
	timing
}: {
	isVertical: boolean;
	isFilled: boolean;
	timing: StyleArg;
}): SvelteStyleAttrs {
	return isVertical
		? sx(
				styles.otSegBaseV,
				styles.otSegFlexV,
				styles.connectorTrack,
				connectorAxisStyle(true, isFilled),
				timing,
				styles.otSegHiddenIfLast
			)
		: sx(
				styles.otSegH,
				styles.connectorTrack,
				connectorAxisStyle(false, isFilled),
				timing,
				styles.otSegHiddenIfLast
			);
}

/**
 * The segment running down the side of a vertical on-track step's content slot.
 *
 * `connectorTrack` comes first: it declares `position: relative` to anchor its
 * fill layer, but this segment is absolutely placed on the rail beside the
 * content slot and must keep that. An absolute box is a containing block too,
 * so the fill still pins to it.
 */
export function stepOtContentSegAttrs({
	density,
	isFilled,
	timing
}: {
	density: StepperDensity;
	isFilled: boolean;
	timing: StyleArg;
}): SvelteStyleAttrs {
	return sx(
		styles.connectorTrack,
		styles.otContentSegV(densitySpaceFor(density)),
		connectorAxisStyle(true, isFilled),
		timing,
		styles.otSegHiddenIfLast
	);
}

/** The horizontal on-track layout's `[segment] [indicator] [segment]` row. */
export function stepOtTrackRowAttrs(): SvelteStyleAttrs {
	return sx(styles.otTrackRowH);
}

/** The vertical on-track layout's label column, beside the rail. */
export function stepOtBodyAttrs(): SvelteStyleAttrs {
	return sx(styles.otBodyV);
}

/** The horizontal on-track layout's label column, below the track. */
export function stepOtLabelWrapAttrs(density: StepperDensity): SvelteStyleAttrs {
	return sx(styles.otLabelWrapH, styles.otMarginTop(densitySpaceFor(density)));
}

/** The on-track label line: start-aligned when vertical, centered when horizontal. */
export function stepOtLabelRowAttrs(isVertical: boolean): SvelteStyleAttrs {
	return sx(isVertical ? styles.otLabelRowStart : styles.otLabelRowCenter);
}

/** The positioning context a vertical on-track content slot's segment pins to. */
export function stepOtContentWrapAttrs(): SvelteStyleAttrs {
	return sx(styles.otContentWrapV);
}

/** The on-track layout's content slot. */
export function stepOtContentAttrs({
	isVertical,
	density
}: {
	isVertical: boolean;
	density: StepperDensity;
}): SvelteStyleAttrs {
	return isVertical
		? sx(styles.otContent, styles.contentIndent(densitySpaceFor(density), INDICATOR_GUTTER))
		: sx(styles.otContent);
}
