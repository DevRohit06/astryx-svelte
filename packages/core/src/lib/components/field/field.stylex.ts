import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SizeValue } from '../../internal/types.js';
import { borderVars, sizeVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Field/Field.tsx`.
 */
const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		// The Field root owns the local stacking boundary: the input wrapper's
		// z-index (1, above the attached status box) and the attached status layer
		// (-1) order parts inside this surface only. Without it, detached/tooltip
		// fields — whose input wrapper renders outside the attached-status wrapper
		// — compete with page-level stacking, and a focused input painted above
		// the sticky AppShell header (#5689).
		isolation: 'isolate'
	},
	containerGap: {
		gap: spacingVars['--spacing-1']
	},
	horizontalLabels: {
		display: 'contents'
	},
	horizontalLabelAlign: {
		// Align label text with input text by matching the input wrapper's
		// top border + top padding. Works for both single-line inputs and
		// textareas (labels stay top-aligned, not vertically centered).
		paddingTop: `calc(${borderVars['--border-width']} + ${spacingVars['--spacing-1']})`
	},
	inputStatusWrapper: {
		display: 'flex',
		flexDirection: 'column',
		isolation: 'isolate',
		// Extend an attached FieldStatus behind the lower half of the control.
		// Half-height is the maximum effective corner radius CSS can render, even
		// when a theme uses a pill value such as --radius-full (9999px).
		'--_field-status-overlap': {
			default: `calc(${sizeVars['--size-element-md']} / 2)`,
			':has(> [data-size="sm"])': `calc(${sizeVars['--size-element-sm']} / 2)`,
			':has(> [data-size="lg"])': `calc(${sizeVars['--size-element-lg']} / 2)`
		}
	},
	attachedStatusLayer: {
		// Keep the overlapping background below both Astryx inputs and custom
		// controls. The isolated wrapper contains this negative stacking layer.
		position: 'relative',
		zIndex: -1
	}
});

// Dynamic style for the consumer-controlled field width. Numbers are treated
// as pixels by StyleX; strings (e.g. '100%') are used as-is.
const dynamicStyles = stylex.create({
	width: (width: SizeValue | null) => ({ width })
});

/** The root in the default (vertical / horizontal) branch. */
export function fieldContainerAttrs(
	isLabelHidden: boolean,
	width: SizeValue | undefined,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.container,
		!isLabelHidden && styles.containerGap,
		width != null && dynamicStyles.width(width),
		xstyle
	);
}

/**
 * The root in `horizontal-labels` mode. `display: contents` hands the label and
 * the input group straight to the enclosing grid's `auto 1fr` columns — which is
 * also why neither `container` nor `width` applies on this branch.
 */
export function fieldHorizontalLabelsAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.horizontalLabels, xstyle);
}

/** The label's column wrapper in `horizontal-labels` mode. */
export function fieldHorizontalLabelAlignAttrs(): SvelteStyleAttrs {
	return sx(styles.horizontalLabelAlign);
}

/** Wraps the control and its status message so the two read as one unit. */
export function fieldInputStatusWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.inputStatusWrapper);
}

/**
 * The attached status box's own layer, handed to `FieldStatus` as an `xstyle`.
 * It rides *behind* the control, which only works inside the isolated wrapper
 * above.
 */
export const fieldAttachedStatusLayer: StyleArg = styles.attachedStatusLayer;
