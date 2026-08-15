import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	radiusVars
} from '../../styles/tokens.stylex.js';
import { indicatorScope } from './indicator.markers.stylex.js';
import type { IndicatorSize } from './types.js';

const styles = stylex.create({
	box: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderRadius: radiusVars['--radius-inner'],
		transitionProperty: 'background-color, border-color',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	// State-dependent colors with ancestor hover behavior
	unchecked: {
		// Foreground for the inherit-shade loading spinner (reads currentColor):
		// brand accent on the light surface fill.
		color: colorVars['--color-accent'],
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			[stylex.when.ancestor(':hover', indicatorScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-border-emphasized']}, ${colorVars['--color-tint-hover']} 20%)`
			}
		},
		backgroundColor: {
			default: colorVars['--color-background-surface'],
			[stylex.when.ancestor(':hover', indicatorScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-background-surface']}, ${colorVars['--color-tint-hover']} 5%)`
			}
		}
	},
	checked: {
		// Foreground for the inherit-shade loading spinner (reads currentColor):
		// on-accent color against the accent fill.
		color: colorVars['--color-on-accent'],
		borderColor: {
			default: colorVars['--color-accent'],
			[stylex.when.ancestor(':hover', indicatorScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		},
		backgroundColor: {
			default: colorVars['--color-accent'],
			[stylex.when.ancestor(':hover', indicatorScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	disabled: {
		opacity: 0.5,
		borderColor: {
			default: colorVars['--color-border'],
			[stylex.when.ancestor(':hover', indicatorScope)]: {
				'@media (hover: hover)': colorVars['--color-border']
			}
		}
	},
	disabledUnchecked: {
		backgroundColor: {
			default: colorVars['--color-background-muted'],
			[stylex.when.ancestor(':hover', indicatorScope)]: {
				'@media (hover: hover)': colorVars['--color-background-muted']
			}
		}
	},
	checkmark: {
		display: 'none',
		color: {
			default: colorVars['--color-on-accent'],
			// Forced colors (Windows High Contrast) does not reliably force an SVG
			// stroke painted with currentColor, so the check stays the same white as
			// the flattened (Canvas) box fill — a white check on a white box.
			// CanvasText keeps it perceivable on the Canvas box, matching the
			// indeterminate mark (WCAG 1.4.11).
			'@media (forced-colors: active)': 'CanvasText'
		}
	},
	checkmarkVisible: {
		display: 'block'
	},
	indeterminateMark: {
		display: 'none',
		backgroundColor: {
			default: colorVars['--color-on-accent'],
			// Forced colors (Windows High Contrast) strips painted backgrounds,
			// which would make the indeterminate bar invisible; CanvasText keeps it
			// perceivable on the Canvas box fill (WCAG 1.4.11). The checkmark carries
			// the matching CanvasText treatment on its own style.
			'@media (forced-colors: active)': 'CanvasText'
		},
		borderRadius: radiusVars['--radius-full']
	},
	indeterminateMarkVisible: {
		display: 'block'
	}
});

const boxSizeStyles = stylex.create({
	sm: {
		width: 20,
		height: 20
	},
	md: {
		width: 24,
		height: 24
	}
});

const checkmarkSizeStyles = stylex.create({
	sm: {
		width: 12,
		height: 12
	},
	md: {
		width: 14,
		height: 14
	}
});

const indeterminateSizeStyles = stylex.create({
	sm: {
		width: 10,
		height: 2
	},
	md: {
		width: 12,
		height: 2
	}
});

/** The square box: size ramp, then the state fill, then the disabled dim. */
export function checkboxIndicatorBoxAttrs(
	size: IndicatorSize,
	isCheckedOrIndeterminate: boolean,
	isDisabled: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.box,
		boxSizeStyles[size],
		isCheckedOrIndeterminate ? styles.checked : styles.unchecked,
		isDisabled && styles.disabled,
		isDisabled && !isCheckedOrIndeterminate && styles.disabledUnchecked,
		xstyle
	);
}

/** The tick `<svg>`, present in every state and revealed only when checked. */
export function checkboxIndicatorCheckmarkAttrs(
	size: IndicatorSize,
	isChecked: boolean
): SvelteStyleAttrs {
	return sx(styles.checkmark, checkmarkSizeStyles[size], isChecked && styles.checkmarkVisible);
}

/** The partial-state bar, same always-rendered / conditionally-shown shape. */
export function checkboxIndicatorIndeterminateAttrs(
	size: IndicatorSize,
	isIndeterminate: boolean
): SvelteStyleAttrs {
	return sx(
		styles.indeterminateMark,
		indeterminateSizeStyles[size],
		isIndeterminate && styles.indeterminateMarkVisible
	);
}
