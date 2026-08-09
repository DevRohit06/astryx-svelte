import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars, typeScaleVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/rowIndex/useTableRowIndex.tsx`.
 *
 * Group name is upstream's (`styles`) so the class oracle needs no rename.
 */

const styles = stylex.create({
	index: {
		fontFamily: 'var(--font-family-code)',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontVariantNumeric: 'tabular-nums',
		color: colorVars['--color-text-secondary']
	}
});

/** The monospaced, tabular ordinal in each index cell. */
export function rowIndexAttrs(): SvelteStyleAttrs {
	return sx(styles.index);
}
