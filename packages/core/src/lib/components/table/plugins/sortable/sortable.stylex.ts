import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars, radiusVars, spacingVars } from '../../../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../../../utils/focus-outline.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/sortable/useTableSortable.tsx`.
 *
 * Group name is upstream's (`sortStyles`) so the class oracle needs no rename.
 */

const sortStyles = stylex.create({
	button: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		background: 'transparent',
		border: 'none',
		padding: 0,
		margin: 0,
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		font: 'inherit',
		color: 'inherit',
		width: '100%',
		height: '100%',
		textAlign: 'inherit',
		borderRadius: radiusVars['--radius-inner']
	},
	iconWrapperUnsorted: {
		display: 'inline-flex',
		opacity: {
			default: 0.35,
			':is(th:hover *)': 1,
			':focus-visible': 1
		}
	},
	iconWrapperActive: {
		display: 'inline-flex'
	},
	rank: {
		fontSize: 10,
		// no token for lineHeight:1 (tight badge) — upstream disables its own
		// `no-hardcoded-styles` rule on this line for the same reason
		lineHeight: '1',
		color: colorVars['--color-accent']
	}
});

/** The full-bleed button that makes a sortable header clickable. */
export function sortButtonAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(sortStyles.button);
}

/** The icon wrapper — dimmed until hover/focus while the column is unsorted. */
export function sortIconWrapperAttrs(isActive: boolean): SvelteStyleAttrs {
	return sx(isActive ? sortStyles.iconWrapperActive : sortStyles.iconWrapperUnsorted);
}

/** The small ordinal badge shown on secondary sorts in multi-sort mode. */
export function sortRankAttrs(): SvelteStyleAttrs {
	return sx(sortStyles.rank);
}
