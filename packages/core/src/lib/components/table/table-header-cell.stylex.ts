import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { containerEdgeStyles, overflowStyles } from './table.stylex.js';
import { mergeXStyle } from './table-cell-styles.js';
import type { TableContextValue } from './table-context.svelte.js';

/**
 * Ported from the styles declared in Astryx's `Table/TableHeaderCell.tsx`.
 *
 * Group names are upstream's so the class oracle needs no renames.
 */

const densityStyles = stylex.create({
	compact: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2'],
		fontSize: typeScaleVars['--text-label-size'],
		boxSizing: 'border-box'
	},
	balanced: {
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3'],
		fontSize: typeScaleVars['--text-label-size'],
		boxSizing: 'border-box'
	},
	spacious: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4'],
		fontSize: typeScaleVars['--text-label-size'],
		boxSizing: 'border-box'
	}
});

const headerStyles = stylex.create({
	cell: {
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-secondary'],
		textAlign: 'start'
	}
});

const headerDividerStyles = stylex.create({
	cell: {
		borderBottomWidth: borderVars['--border-width'],
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border']
	}
});

const dividerColumnStyles = stylex.create({
	cell: {
		borderInlineEndWidth: {
			default: borderVars['--border-width'],
			':last-child': '0'
		},
		borderInlineEndStyle: 'solid',
		borderInlineEndColor: colorVars['--color-border']
	}
});

/**
 * The `<th>` itself.
 *
 * Header cells always get the bottom divider (it separates header from body).
 * When used standalone (no table context) the cell renders plain, with no
 * density or divider styles — upstream's unstyled branch.
 */
export function tableHeaderCellAttrs(
	ctx: TableContextValue | null,
	xstyle: StyleArg | StyleArg[] | undefined
): SvelteStyleAttrs {
	const cellStyles: StyleArg[] = [];
	if (ctx) {
		cellStyles.push(
			headerStyles.cell,
			densityStyles[ctx.density],
			headerDividerStyles.cell,
			overflowStyles.cell,
			containerEdgeStyles[ctx.density]
		);
		// Column dividers come from the shared builder (column axis only).
		if (ctx.dividers === 'columns' || ctx.dividers === 'grid') {
			cellStyles.push(dividerColumnStyles.cell);
		}
	}

	return sx(...mergeXStyle(cellStyles, xstyle));
}
