import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { spacingVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/pagination/useTablePagination.tsx`.
 *
 * Group name is upstream's (`styles`) so the class oracle needs no rename.
 */

const styles = stylex.create({
	wrapper: {
		display: 'flex'
	},
	marginTop: {
		marginTop: spacingVars['--spacing-2']
	},
	marginBottom: {
		marginBottom: spacingVars['--spacing-2']
	},
	alignStart: {
		justifyContent: 'flex-start'
	},
	alignCenter: {
		justifyContent: 'center'
	},
	alignEnd: {
		justifyContent: 'flex-end'
	}
});

/**
 * The flex row the controls sit in. Upstream's conditional argument list is
 * kept in the same order, so the atomic classes resolve identically.
 */
export function paginationWrapperAttrs(
	side: 'above' | 'below',
	align: 'start' | 'center' | 'end'
): SvelteStyleAttrs {
	return sx(
		styles.wrapper,
		side === 'below' && styles.marginTop,
		side === 'above' && styles.marginBottom,
		align === 'center' && styles.alignCenter,
		align === 'end' && styles.alignEnd,
		align === 'start' && styles.alignStart
	);
}
