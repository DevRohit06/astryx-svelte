import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	spacingVars
} from '../../styles/tokens.stylex.js';
import { radioScope } from './radio.markers.stylex.js';
import type { RadioListSize } from './radio-list-context.svelte.js';

/**
 * Ported from Astryx's `RadioList/RadioListItem.tsx` styles.
 *
 * The `<input type="radio">` is transparent and overlaid on a decorative circle
 * (`radio` + inner `innerDot`); the hover tints resolve through the `radioScope`
 * marker so a parent container's hover never bleeds in. The item container
 * carries the marker only when enabled.
 */
const styles = stylex.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	radioWrapper: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		isolation: 'isolate'
	},
	input: {
		position: 'absolute',
		margin: 0,
		padding: 0,
		opacity: 0,
		cursor: 'pointer',
		zIndex: 1
	},
	inputDisabled: {
		cursor: 'not-allowed'
	},
	radio: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderRadius: '50%',
		transitionProperty: 'background-color, border-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		boxSizing: 'border-box'
	},
	radioUnchecked: {
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			[stylex.when.ancestor(':hover', radioScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-border-emphasized']}, ${colorVars['--color-tint-hover']} 20%)`
			}
		},
		backgroundColor: {
			default: colorVars['--color-background-surface'],
			[stylex.when.ancestor(':hover', radioScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-background-surface']}, ${colorVars['--color-tint-hover']} 5%)`
			}
		}
	},
	radioChecked: {
		borderColor: {
			default: colorVars['--color-accent'],
			[stylex.when.ancestor(':hover', radioScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		},
		backgroundColor: {
			default: colorVars['--color-accent'],
			[stylex.when.ancestor(':hover', radioScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	radioWrapperFocus: {
		outline: {
			default: 'none',
			':has(:focus-visible)': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':has(:focus-visible)': '2px'
		},
		borderRadius: '50%'
	},
	radioDisabled: {
		opacity: 0.5,
		borderColor: colorVars['--color-border']
	},
	radioDisabledUnchecked: {
		backgroundColor: colorVars['--color-background-muted']
	},
	innerDot: {
		borderRadius: '50%',
		backgroundColor: {
			default: colorVars['--color-on-accent'],
			// Forced colors (Windows High Contrast) strips painted backgrounds,
			// which would make the selected dot invisible — checked and unchecked
			// radios would look identical. CanvasText keeps the dot perceivable on
			// the Canvas circle fill (WCAG 1.4.11).
			'@media (forced-colors: active)': 'CanvasText'
		}
	},
	labelDisabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'not-allowed'
	}
});

const wrapperSizeStyles = stylex.create({
	sm: { width: 20, height: 20 },
	md: { width: 24, height: 24 }
});

const radioSizeStyles = stylex.create({
	sm: { width: 20, height: 20 },
	md: { width: 24, height: 24 }
});

const dotSizeStyles = stylex.create({
	sm: { width: 8, height: 8 },
	md: { width: 10, height: 10 }
});

const embeddedStyles = stylex.create({
	root: {
		paddingBlock: 0,
		paddingInline: 0,
		borderRadius: 0,
		flex: 1,
		minWidth: 0
	}
});

/** Passed to the nested `Item` as `xstyle` so it fills the row flush. */
export const radioEmbeddedRoot: StyleArg = embeddedStyles.root;

/** The item container, marked (for hover scoping) only when enabled. */
export function radioListItemContainerAttrs(
	isDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.container, !isDisabled && radioScope, xstyle);
}

/** The square that centres the input, the circle and the focus ring. */
export function radioWrapperAttrs(size: RadioListSize, isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.radioWrapper, wrapperSizeStyles[size], !isDisabled && styles.radioWrapperFocus);
}

/** The transparent `<input type="radio">` overlaid on the circle. */
export function radioInputAttrs(size: RadioListSize, isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.input, wrapperSizeStyles[size], isDisabled && styles.inputDisabled);
}

/** The decorative circle. */
export function radioCircleAttrs(
	size: RadioListSize,
	isChecked: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.radio,
		radioSizeStyles[size],
		isChecked ? styles.radioChecked : styles.radioUnchecked,
		isDisabled && styles.radioDisabled,
		isDisabled && !isChecked && styles.radioDisabledUnchecked
	);
}

/** The filled centre dot, shown when checked. */
export function radioDotAttrs(size: RadioListSize): SvelteStyleAttrs {
	return sx(styles.innerDot, dotSizeStyles[size]);
}

/** The `<label>`, dimmed when disabled. */
export function radioLabelAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(isDisabled && styles.labelDisabled);
}
