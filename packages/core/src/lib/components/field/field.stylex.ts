import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SizeValue } from '../../internal/types.js';
import { borderVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Field/Field.tsx`.
 */
const styles = stylex.create({
	container: {
		display: 'flex',
		flexDirection: 'column'
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
		isolation: 'isolate'
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
