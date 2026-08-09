import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { SpacingStep } from '../../internal/types.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		minWidth: 0
	},
	containerMultiRow: {
		display: 'flex',
		flexWrap: 'wrap',
		alignContent: 'flex-start',
		overflow: 'hidden',
		whiteSpace: 'normal',
		minWidth: 0
	},
	fillParent: {
		width: '100%'
	},
	measureContainer: {
		position: 'absolute',
		visibility: 'hidden',
		height: 0,
		overflow: 'hidden',
		display: 'flex',
		alignItems: 'center',
		whiteSpace: 'nowrap',
		pointerEvents: 'none'
	},
	measureIndicator: {
		display: 'inline-flex'
	}
});

/**
 * The bounded height of a multi-row list: `maxRows` rows of the measured row
 * height, plus the gaps between them.
 */
const multiRowHeight = stylex.create({
	height: (maxRows: number, rowHeight: number, gapPx: number) => ({
		maxHeight: `calc(${rowHeight}px * ${maxRows} + ${gapPx}px * ${maxRows - 1})`
	})
});

const gapStyles = stylex.create({
	0: { gap: spacingVars['--spacing-0'] },
	0.5: { gap: spacingVars['--spacing-0-5'] },
	1: { gap: spacingVars['--spacing-1'] },
	1.5: { gap: spacingVars['--spacing-1-5'] },
	2: { gap: spacingVars['--spacing-2'] },
	3: { gap: spacingVars['--spacing-3'] },
	4: { gap: spacingVars['--spacing-4'] },
	5: { gap: spacingVars['--spacing-5'] },
	6: { gap: spacingVars['--spacing-6'] },
	8: { gap: spacingVars['--spacing-8'] },
	10: { gap: spacingVars['--spacing-10'] }
});

/**
 * Maps spacing token steps to pixel values for `useOverflow`'s width math.
 * Copied verbatim from upstream so the fit algorithm reserves the same space.
 */
export const spacingToPx: Record<SpacingStep, number> = {
	0: 0,
	0.5: 2,
	1: 4,
	1.5: 6,
	2: 8,
	3: 12,
	4: 16,
	5: 20,
	6: 24,
	8: 32,
	10: 40
};

export interface OverflowListContainerOptions {
	gap: SpacingStep;
	/** `observeParent && hasOverflow` — grows the list to fill its parent. */
	fillParent: boolean;
	/** `maxRows != null && maxRows > 1` — switches the container to wrapping. */
	isMultiRow: boolean;
	/** The configured row cap, used to bound the container's height. */
	maxRows?: number;
	/** The measured row height in pixels; 0 until the first measurement lands. */
	rowHeight: number;
	xstyle?: StyleArg;
}

/** The visible container. `xstyle` is threaded last so an override replaces. */
export function overflowListContainerAttrs({
	gap,
	fillParent,
	isMultiRow,
	maxRows,
	rowHeight,
	xstyle
}: OverflowListContainerOptions): SvelteStyleAttrs {
	return sx(
		isMultiRow ? styles.containerMultiRow : styles.container,
		gapStyles[gap],
		isMultiRow &&
			rowHeight > 0 &&
			maxRows != null &&
			multiRowHeight.height(maxRows, rowHeight, spacingToPx[gap]),
		fillParent && styles.fillParent,
		xstyle
	);
}

/** The hidden measurement container — holds every item plus the indicator. */
export function overflowListMeasureAttrs(gap: SpacingStep): SvelteStyleAttrs {
	return sx(styles.measureContainer, gapStyles[gap]);
}

/** The wrapper around the measured overflow indicator. */
export function overflowListMeasureIndicatorAttrs(): SvelteStyleAttrs {
	return sx(styles.measureIndicator);
}
