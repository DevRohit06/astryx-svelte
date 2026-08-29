import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typographyVars,
	typeScaleVars,
	fontWeightVars
} from '../../styles/tokens.stylex.js';
import type { SizeValue } from '../../internal/types.js';
import { indicatorScope } from '../indicator/indicator.markers.stylex.js';

/**
 * `CheckboxInput`'s styles, ported from Astryx's `CheckboxInput/CheckboxInput.tsx`.
 *
 * **This component no longer draws a checkbox.** Upstream 0.4.0 moved the box,
 * the tick, the mixed-state bar and their three size ramps into
 * `CheckboxIndicator`, so what is left here is the row, the positioned wrapper,
 * the visually-hidden native `<input>` and the label column. The row still owns
 * the hover marker — now the shared `indicatorScope` rather than a
 * `checkboxScope` of its own — because the thing being tinted is a component
 * the theme chose, not an element this file renders.
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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		zIndex: 1,
		minInlineSize: {
			default: null,
			'@media (pointer: coarse)': '24px'
		},
		minBlockSize: {
			default: null,
			'@media (pointer: coarse)': '24px'
		},
		insetBlockStart: {
			default: null,
			'@media (pointer: coarse)': '50%'
		},
		insetInlineStart: {
			default: null,
			'@media (pointer: coarse)': '50%'
		},
		transform: {
			default: null,
			'@media (pointer: coarse)': 'translate(-50%, -50%)'
		}
	},
	inputDisabled: {
		cursor: 'default'
	},
	// Holds only the indicator, so the focus ring has one unambiguous target.
	// `display: contents` adds no box of its own — the indicator keeps whatever
	// layout relationship it already had with the wrapper.
	indicatorSlot: {
		display: 'contents'
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

// The `checkboxSizeStyles` / `checkmarkSizeStyles` / `indeterminateSizeStyles`
// ramps that stood here moved to `CheckboxIndicator` at upstream 0.4.0, along
// with the ten style keys that drew the box, the tick and the mixed-state bar.
// This component no longer draws a checkbox — it renders whichever indicator
// the theme resolves for the `checkbox` name and lets that draw itself.

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
 * The checkbox *row*. Carries the shared `indicatorScope` marker (dropped while
 * disabled) that the indicator's hover rules resolve against, so the whole row
 * drives the visual rather than the box alone.
 *
 * This was `checkboxScope`, from a `checkbox.markers.stylex.ts` beside this
 * file, until upstream 0.4.0 deleted that module: the marker now belongs to the
 * indicator layer, because the element it tints is no longer one this component
 * renders.
 */
export function checkboxContainerAttrs(
	isLabelHidden: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.container,
		isLabelHidden && styles.containerLabelHidden,
		!isDisabled && indicatorScope
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

/**
 * A container holding ONLY the indicator, so the focus ring has an unambiguous
 * target whatever a theme renders. `display: contents` keeps it out of layout
 * entirely, so the indicator keeps the layout relationship it already had with
 * the wrapper.
 */
export function checkboxIndicatorSlotAttrs(): SvelteStyleAttrs {
	return sx(styles.indicatorSlot);
}

/** The column holding the label and description. */
export function checkboxLabelWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.labelWrapper);
}
