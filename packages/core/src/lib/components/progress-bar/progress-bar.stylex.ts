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
	// its height — 8px by default, directly overridable via the `progressbar-mark`
	// theme target — may exceed the bar and overhang; the centring translate keeps
	// any overhang symmetric. Positioned horizontally via `insetInlineStart`; the
	// translate mirrors under RTL.
	mark: {
		position: 'absolute',
		top: '50%',
		width: 2,
		height: 8,
		// Defaults to text-primary. Directly overridable via the `progressbar-mark`
		// theme target — a theme can set `backgroundColor`, `width`, and `height`
		// (e.g. a taller "flag" tick that overhangs the bar, or per-variant
		// contrast) with `defineTheme`; no dedicated CSS vars needed.
		backgroundColor: colorVars['--color-text-primary'],
		outline: {
			default: 'none',
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':focus-visible': '2px'
		},
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

export function progressBarMarkAttrs(): SvelteStyleAttrs {
	return sx(styles.mark);
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
