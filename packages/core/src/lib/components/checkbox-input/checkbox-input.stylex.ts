import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	radiusVars,
	durationVars,
	easeVars,
	typographyVars,
	typeScaleVars,
	fontWeightVars,
	borderVars
} from '../../styles/tokens.stylex.js';
import type { SizeValue } from '../../internal/types.js';
import { checkboxScope } from './checkbox.markers.stylex.js';

/**
 * `CheckboxInput`'s styles, ported from Astryx's `CheckboxInput/CheckboxInput.tsx`.
 *
 * The box's focus outline and the checked/unchecked hover tints are entirely CSS
 * via `when.ancestor(..., checkboxScope)` — see `checkbox.markers.stylex.ts` for
 * the marker they resolve against. The four size ramps are fixed pixels,
 * transcribed from upstream.
 */

const styles = stylex.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	containerLabelHidden: {
		gap: 0
	},
	checkboxWrapper: {
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
	checkbox: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
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
	checkboxFocus: {
		outline: {
			default: 'none',
			[stylex.when.ancestor(':has(:focus-visible)', checkboxScope)]:
				`2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: null,
			[stylex.when.ancestor(':has(:focus-visible)', checkboxScope)]: '2px'
		}
	},
	// State-dependent colors with ancestor hover behavior
	checkboxUnchecked: {
		// Foreground for the inherit-shade loading spinner (reads currentColor):
		// brand accent on the light surface fill.
		color: colorVars['--color-accent'],
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			[stylex.when.ancestor(':hover', checkboxScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-border-emphasized']}, ${colorVars['--color-tint-hover']} 20%)`
			}
		},
		backgroundColor: {
			default: colorVars['--color-background-surface'],
			[stylex.when.ancestor(':hover', checkboxScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-background-surface']}, ${colorVars['--color-tint-hover']} 5%)`
			}
		}
	},
	checkboxChecked: {
		// Foreground for the inherit-shade loading spinner (reads currentColor):
		// on-accent color against the accent fill.
		color: colorVars['--color-on-accent'],
		borderColor: {
			default: colorVars['--color-accent'],
			[stylex.when.ancestor(':hover', checkboxScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		},
		backgroundColor: {
			default: colorVars['--color-accent'],
			[stylex.when.ancestor(':hover', checkboxScope)]: {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	checkboxDisabled: {
		opacity: 0.5,
		borderColor: {
			default: colorVars['--color-border'],
			[stylex.when.ancestor(':hover', checkboxScope)]: {
				'@media (hover: hover)': colorVars['--color-border']
			}
		}
	},
	checkboxDisabledUnchecked: {
		backgroundColor: {
			default: colorVars['--color-background-muted'],
			[stylex.when.ancestor(':hover', checkboxScope)]: {
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
	},
	labelWrapper: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	},
	// Declared by upstream but never applied — the description is rendered by
	// `FieldLabel`, not here. Kept so the authored surface matches source; it is
	// tree-shaken out of upstream's `dist/`, so the oracle has nothing to diff it
	// against (the same situation `Switch`'s `description` key is in).
	description: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	}
});

const wrapperSizeStyles = stylex.create({
	sm: {
		width: 20,
		height: 20
	},
	md: {
		width: 24,
		height: 24
	}
});

const checkboxSizeStyles = stylex.create({
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

/** The two checkbox sizes, keyed off the wrapper ramp as upstream's type is. */
export type CheckboxInputSize = keyof typeof wrapperSizeStyles;

// Dynamic field width (number -> px, string used as-is).
const dynamicWidthStyles = stylex.create({
	width: (width: SizeValue | null) => ({ width })
});

/** The outer field box — dynamic width plus the caller's `xstyle`. */
export function checkboxFieldAttrs(
	width: SizeValue | undefined,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(width != null && dynamicWidthStyles.width(width), xstyle);
}

/**
 * The checkbox *row*. Carries the `checkboxScope` marker (dropped while
 * disabled) that the box's hover/focus rules resolve against.
 */
export function checkboxContainerAttrs(
	isLabelHidden: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.container,
		isLabelHidden && styles.containerLabelHidden,
		!isDisabled && checkboxScope
	);
}

/** The positioned wrapper around the native input and the visual box. */
export function checkboxWrapperAttrs(size: CheckboxInputSize): SvelteStyleAttrs {
	return sx(styles.checkboxWrapper, wrapperSizeStyles[size]);
}

/**
 * The visually-transparent native checkbox that owns the interaction. It is
 * sized to the *wrapper* ramp, not the box ramp, so the whole control area is
 * clickable — upstream passes `wrapperSizeStyles[size]` here too.
 */
export function checkboxInputAttrs(size: CheckboxInputSize, isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.input, wrapperSizeStyles[size], isDisabled && styles.inputDisabled);
}

/** The visual box, coloured by checked/indeterminate and dimmed while disabled. */
export function checkboxBoxAttrs(
	size: CheckboxInputSize,
	isCheckedOrIndeterminate: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.checkbox,
		checkboxSizeStyles[size],
		!isDisabled && styles.checkboxFocus,
		isCheckedOrIndeterminate ? styles.checkboxChecked : styles.checkboxUnchecked,
		isDisabled && styles.checkboxDisabled,
		isDisabled && !isCheckedOrIndeterminate && styles.checkboxDisabledUnchecked
	);
}

/** The tick glyph — always in the DOM, revealed by `display` when checked. */
export function checkboxCheckmarkAttrs(
	size: CheckboxInputSize,
	isChecked: boolean
): SvelteStyleAttrs {
	return sx(styles.checkmark, checkmarkSizeStyles[size], isChecked && styles.checkmarkVisible);
}

/** The mixed-state bar — always in the DOM, revealed when indeterminate. */
export function checkboxIndeterminateMarkAttrs(
	size: CheckboxInputSize,
	isIndeterminate: boolean
): SvelteStyleAttrs {
	return sx(
		styles.indeterminateMark,
		indeterminateSizeStyles[size],
		isIndeterminate && styles.indeterminateMarkVisible
	);
}

/** The column holding the label and description. */
export function checkboxLabelWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.labelWrapper);
}
