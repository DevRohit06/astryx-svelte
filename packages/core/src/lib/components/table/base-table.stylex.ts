import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's `Table/BaseTable.tsx`.
 *
 * Group name is upstream's (`styles`) so the class oracle needs no rename.
 */
const styles = stylex.create({
	table: {
		width: '100%',
		borderCollapse: 'collapse',
		borderSpacing: '0',
		tableLayout: 'fixed'
	},
	tableAutoLayout: {
		tableLayout: 'auto'
	},
	/**
	 * Inline flex row that keeps the header label and any "after" slot content
	 * (sort icons, filter buttons, etc.) on the same line with a small gap.
	 * Applied only when `after` is present so plain cells are unaffected.
	 */
	headerLabelRow: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		minWidth: 0
	}
});

/**
 * The `xstyle` seed for the `<table>` plugin pipeline. Children mode adds
 * `tableLayout: auto`, because a compositional table has no column definitions
 * to size a fixed layout from.
 */
export function baseTableSeedXstyle(hasChildren: boolean): StyleArg[] {
	return hasChildren ? [styles.table, styles.tableAutoLayout] : [styles.table];
}

/** The finished `<table>` attributes, after the plugin pipeline. */
export function baseTableAttrs(pipelineXstyle: StyleArg[], xstyle: StyleArg): SvelteStyleAttrs {
	return sx(...pipelineXstyle, xstyle);
}

/** The inline-flex row wrapping a header label and its `after` slot. */
export function headerLabelRowAttrs(): SvelteStyleAttrs {
	return sx(styles.headerLabelRow);
}
