import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TreeList/TreeListBranches.tsx` styles.
 *
 * Upstream's `dist/` carries no style object for this module at all: both call
 * sites are static, so the compiler folded each into a literal class string.
 * Pure inline mode for the oracle.
 */
const LINE_WIDTH = 1;

/**
 * Branch margin from the left edge. No exact spacing token for 10px,
 * so we use calc(--spacing-2 + --spacing-0-5) = 8 + 2 = 10.
 */
export const BRANCH_MARGIN = `calc(${spacingVars['--spacing-2']} + ${spacingVars['--spacing-0-5']})`;

/** Per-level indent width, matching --spacing-4 (16px). */
export const LEVEL_INDENT: string = spacingVars['--spacing-4'];

const styles = stylex.create({
	container: {
		height: '100%',
		position: 'absolute',
		width: spacingVars['--spacing-5']
	},
	verticalLine: {
		borderRadius: 1,
		insetInlineStart: 0,
		margin: 'auto',
		position: 'absolute',
		insetInlineEnd: 0,
		width: LINE_WIDTH,
		backgroundColor: colorVars['--color-border-emphasized']
	},
	verticalFull: {
		height: 'calc(100% + 1px)'
	}
});

/**
 * One full-height connector column. Its `left` offset is a per-instance calc,
 * so it stays an inline `style` exactly as upstream's `mergeProps({style})` does.
 */
export function treeBranchContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.container);
}

/** The 1px rule inside a connector column. */
export function treeBranchLineAttrs(): SvelteStyleAttrs {
	return sx(styles.verticalLine, styles.verticalFull);
}
