import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

const indeterminateSlide = stylex.keyframes({
	'0%': {
		transform: 'translateX(-100%)'
	},
	'100%': {
		transform: 'translateX(250%)'
	}
});

// RTL: mirror the slide so the indeterminate bar travels along the reading
// flow (inline-start → inline-end, i.e. right → left) instead of always
// physically left → right. The magnitudes mirror the LTR keyframe.
const indeterminateSlideRtl = stylex.keyframes({
	'0%': {
		transform: 'translateX(100%)'
	},
	'100%': {
		transform: 'translateX(-250%)'
	}
});

const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-1'],
		width: '100%',
		minWidth: '48px'
	},
	header: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline'
	},
	label: {
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-primary']
	},
	labelDisabled: {
		color: colorVars['--color-text-disabled']
	},
	valueLabel: {
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	},
	valueLabelDisabled: {
		color: colorVars['--color-text-disabled']
	},
	// The label keeps its place in the header row when hidden, rather than being
	// swapped for the VisuallyHidden component — otherwise the value label
	// beside it would lose its `space-between` partner and drift left.
	visuallyHidden: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		borderWidth: 0
	},
	// The `role="progressbar"` element. In determinate mode it does NOT clip its
	// content (`overflow` stays visible) so a themed mark taller than the bar can
	// overhang it; the determinate fill rounds its own corners via `border-radius`
	// (see `fill`) and is always inside the track box, so dropping the clip does
	// not change its appearance at any progress. Indeterminate mode re-adds the
	// clip via `trackClipped` (see below) — its sliding fill travels outside the
	// track and must be clipped, and marks are ignored while indeterminate, so
	// there is nothing to overhang.
	track: {
		position: 'relative',
		width: '100%',
		height: '8px',
		backgroundColor: colorVars['--color-background-muted'],
		borderRadius: radiusVars['--radius-full']
	},
	// Indeterminate-only clip. The indeterminate fill slides from translateX
	// -100% to 250%, so it deliberately overshoots the track on both sides and
	// relies on the track clipping it to the visible window. Applied only when
	// `isIndeterminate` (marks are suppressed then, so nothing needs to overhang)
	// so it never re-clips a themed tall mark in determinate mode.
	trackClipped: {
		overflow: 'hidden'
	},
	fill: {
		height: '100%',
		borderRadius: radiusVars['--radius-full'],
		transitionProperty: 'width',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	indeterminateFill: {
		height: '100%',
		width: '40%',
		borderRadius: radiusVars['--radius-full'],
		animationName: {
			default: indeterminateSlide,
			':is([dir="rtl"] *)': indeterminateSlideRtl
		},
		animationDuration: {
			default: '1.5s',
			'@media (prefers-reduced-motion: reduce)': '3s'
		},
		animationTimingFunction: 'ease-in-out',
		animationIterationCount: 'infinite'
	},
	// A mark is a vertical tick centred on the track, a child of the
	// `role="progressbar"` element (unchanged DOM). The track no longer clips, so
	// its height — 8px by default — may exceed the bar and overhang; the centring
	// translate keeps any overhang symmetric. Positioned horizontally via
	// `insetInlineStart`; the translate mirrors under RTL.
	//
	// The dimensions read private vars rather than being plain declarations: a
	// theme writes `width`/`height` on the `progressbar-mark` target as usual and
	// the derived-var registry emits them as these vars instead of as competing
	// properties. Nothing else declares them, so the theme value lands whatever
	// the consumer's cascade looks like — a source-build app that compiles StyleX
	// without `useCSSLayers` leaves the atomics unlayered, where they outrank
	// every rule in `@layer astryx-theme` and made sizing the mark impossible
	// without `!important`.
	//
	// The tick's colour is not set here: it depends on what the mark sits on, so
	// it comes from `markOnFillStyles[variant]` (mark inside the filled area) or
	// `markOnTrackStyles.track` (mark out on the bare track).
	mark: {
		position: 'absolute',
		top: '50%',
		width: 'var(--_progressbar-mark-width, 2px)',
		height: 'var(--_progressbar-mark-height, 8px)',
		transform: {
			default: 'translate(-50%, -50%)',
			':is([dir="rtl"] *)': 'translate(50%, -50%)'
		}
	}
});

const variantStyles = stylex.create({
	accent: {
		backgroundColor: colorVars['--color-accent']
	},
	success: {
		backgroundColor: colorVars['--color-success']
	},
	warning: {
		backgroundColor: colorVars['--color-warning']
	},
	error: {
		backgroundColor: colorVars['--color-error']
	},
	neutral: {
		backgroundColor: colorVars['--color-text-disabled']
	},
	disabled: {
		backgroundColor: colorVars['--color-text-disabled']
	}
});

// A mark sitting inside the filled area is drawn *on* the bar, so it takes the
// on-colour that pairs with the fill's own variant colour — the same pairing
// Badge uses for solid semantic backgrounds.
//
// `neutral` and `disabled` both fill with the muted `--color-text-disabled`
// grey, which carries no semantic weight and has no dedicated on-token, so they
// fall back to a plain foreground. They pick different ones: a `neutral` bar is
// live, so its mark keeps the full-contrast `--color-text-primary` a mark uses
// out on the track; a `disabled` bar is deliberately low-emphasis — its own
// label and value text drop to muted colours — so its mark steps down to
// `--color-text-secondary` rather than becoming the loudest thing on a
// greyed-out component.
const markOnFillStyles = stylex.create({
	accent: {
		backgroundColor: colorVars['--color-on-accent']
	},
	success: {
		backgroundColor: colorVars['--color-on-success']
	},
	warning: {
		backgroundColor: colorVars['--color-on-warning']
	},
	error: {
		backgroundColor: colorVars['--color-on-error']
	},
	neutral: {
		backgroundColor: colorVars['--color-text-primary']
	},
	disabled: {
		backgroundColor: colorVars['--color-text-secondary']
	}
});

// A mark out on the bare track is a foreground tick over the muted track
// background, so it takes `--color-text-primary`.
//
// The obvious candidate was `--color-border-emphasized` — the emphasized
// divider colour `Divider`'s `strong` variant and `Slider`'s marks use — but
// divider tokens sit a step or two from the track on the same neutral ramp, so
// a mark drawn in one is at or near invisible: measured against each shipped
// theme's track it lands between 1.00:1 (theme-neutral, both modes, where the
// track is aliased to that very token) and 2.9:1, under the 3:1 WCAG 1.4.11
// non-text floor in 7 of 8 themes. `--color-text-secondary` still misses in
// two. `--color-text-primary` is the one foreground guaranteed to read against
// every surface a theme defines: 5.8:1 to 15.7:1 on the track across all themes
// and both modes.
const markOnTrackStyles = stylex.create({
	track: {
		backgroundColor: colorVars['--color-text-primary']
	},
	// A disabled bar dims everything it draws, so its track marks step down to
	// the secondary foreground for the same reason the disabled on-fill mark
	// does — matching the muted label and value text.
	trackDisabled: {
		backgroundColor: colorVars['--color-text-secondary']
	}
});

/**
 * Extensible variant map for ProgressBar.
 *
 * Theme packages add their own variants by augmenting this interface:
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface ProgressBarVariantMap {
 *     brand: true;
 *   }
 * }
 */
export interface ProgressBarVariantMap {
	accent: true;
	success: true;
	warning: true;
	neutral: true;
	error: true;
}

/** ProgressBar variant, mapped to a semantic colour token. */
export type ProgressBarVariant = keyof ProgressBarVariantMap;

/** The variant actually painted on the fill — `disabled` overrides the rest. */
export type ProgressBarFillVariant = ProgressBarVariant | 'disabled';

export function progressBarContainerAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.container, xstyle);
}

export function progressBarHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.header);
}

export function progressBarLabelAttrs(
	isLabelHidden: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.label,
		isLabelHidden && styles.visuallyHidden,
		isDisabled && styles.labelDisabled
	);
}

export function progressBarValueLabelAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.valueLabel, isDisabled && styles.valueLabelDisabled);
}

export function progressBarTrackAttrs(isIndeterminate: boolean): SvelteStyleAttrs {
	return sx(styles.track, isIndeterminate && styles.trackClipped);
}

/**
 * A mark's colour follows what it sits on: inside the fill it takes the fill
 * variant's on-colour, out on the bare track the plain foreground — stepped
 * down to the secondary one when the bar is disabled.
 */
export function progressBarMarkAttrs(
	variant: ProgressBarFillVariant,
	isOnFill: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.mark,
		isOnFill
			? markOnFillStyles[variant as keyof typeof markOnFillStyles]
			: isDisabled
				? markOnTrackStyles.trackDisabled
				: markOnTrackStyles.track
	);
}

export function progressBarFillAttrs(
	variant: ProgressBarFillVariant,
	isIndeterminate: boolean
): SvelteStyleAttrs {
	return sx(
		isIndeterminate ? styles.indeterminateFill : styles.fill,
		variantStyles[variant as keyof typeof variantStyles]
	);
}
