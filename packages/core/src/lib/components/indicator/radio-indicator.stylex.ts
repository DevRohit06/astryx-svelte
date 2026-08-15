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
	circle: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		// A circle, in tokens: --radius-full is the house "fully rounded" value
		// (9999px) and renders pixel-identical to 50% on a square box, which the
		// size styles below guarantee. Themeable through --radius-full, unlike a
		// raw 50%.
		borderRadius: radiusVars['--radius-full'],
		transitionProperty: 'background-color, border-color',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	unchecked: {
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
	dot: {
		borderRadius: radiusVars['--radius-full'],
		backgroundColor: {
			default: colorVars['--color-on-accent'],
			// Forced colors (Windows High Contrast) strips painted backgrounds,
			// which would make the selected dot invisible — checked and unchecked
			// radios would look identical. CanvasText keeps the dot perceivable on
			// the Canvas circle fill (WCAG 1.4.11).
			'@media (forced-colors: active)': 'CanvasText'
		}
	}
});

const circleSizeStyles = stylex.create({
	sm: {
		width: 20,
		height: 20
	},
	md: {
		width: 24,
		height: 24
	}
});

const dotSizeStyles = stylex.create({
	sm: {
		width: 8,
		height: 8
	},
	md: {
		width: 10,
		height: 10
	}
});

/** The outer circle: size ramp, then the state fill, then the disabled dim. */
export function radioIndicatorCircleAttrs(
	size: IndicatorSize,
	isChecked: boolean,
	isDisabled: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.circle,
		circleSizeStyles[size],
		isChecked ? styles.checked : styles.unchecked,
		isDisabled && styles.disabled,
		isDisabled && !isChecked && styles.disabledUnchecked,
		xstyle
	);
}

/** The inner dot, rendered only when selected. */
export function radioIndicatorDotAttrs(size: IndicatorSize): SvelteStyleAttrs {
	return sx(styles.dot, dotSizeStyles[size]);
}
