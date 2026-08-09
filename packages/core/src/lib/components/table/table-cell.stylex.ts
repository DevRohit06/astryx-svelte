import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { borderVars, colorVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';
import { containerEdgeStyles, overflowStyles, wrapStyles } from './table.stylex.js';
import { tableRowMarker } from './table.markers.stylex.js';
import { buildDividerStyles, mergeXStyle } from './table-cell-styles.js';
import type { TableContextValue } from './table-context.svelte.js';

/**
 * Ported from the styles declared in Astryx's `Table/TableCell.tsx`.
 *
 * Group names are upstream's so the class oracle needs no renames.
 */

const densityStyles = stylex.create({
	compact: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2'],
		fontSize: typeScaleVars['--text-body-size'],
		boxSizing: 'border-box'
	},
	balanced: {
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3'],
		fontSize: typeScaleVars['--text-body-size'],
		boxSizing: 'border-box'
	},
	spacious: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4'],
		fontSize: typeScaleVars['--text-body-size'],
		boxSizing: 'border-box'
	}
});

// When a cell owns a context menu, its padding moves from the `<td>` onto the
// right-click trigger wrapper so the *entire* cell (padding included) opens the
// menu. Without this, right-clicking the padding ring near a cell edge falls
// through to the browser's native menu. Paired with `contextMenuCellStyles` on
// the `<td>` (font/box-sizing only — no padding).
const densityTextStyles = stylex.create({
	compact: {
		fontSize: typeScaleVars['--text-body-size'],
		boxSizing: 'border-box'
	},
	balanced: {
		fontSize: typeScaleVars['--text-body-size'],
		boxSizing: 'border-box'
	},
	spacious: {
		fontSize: typeScaleVars['--text-body-size'],
		boxSizing: 'border-box'
	}
});

const densityPaddingStyles = stylex.create({
	compact: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2']
	},
	balanced: {
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3']
	},
	spacious: {
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-4']
	}
});

// The trigger wrapper fills the whole cell (a `<td>` child with height:100%
// stretches to the row height) so a right-click anywhere in the cell opens the
// menu. It carries the density padding relocated off the `<td>`.
const triggerFillStyles = stylex.create({
	fill: {
		display: 'block',
		boxSizing: 'border-box',
		blockSize: '100%',
		inlineSize: '100%'
	}
});

// `height:100%` on the `<td>` is the CSS trick that lets a block child resolve
// its own `height:100%` against the row height — so the trigger fills the cell
// vertically (top/bottom padding included) and is fully right-clickable.
const contextMenuCellStyles = stylex.create({
	cell: {
		blockSize: '100%'
	}
});

const dividerRowStyles = stylex.create({
	cell: {
		borderBottomWidth: {
			default: borderVars['--border-width'],
			// Skip border on cells in the last body row to avoid a
			// redundant line at the bottom of the table.
			// Scoped to tableRowMarker so only the parent <tr> is checked —
			// without the scope, <tbody> (also a :last-child) would match
			// and suppress borders on every row.
			[stylex.when.ancestor(':last-child', tableRowMarker)]: '0'
		},
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

const verticalAlignStyles = stylex.create({
	middle: {
		verticalAlign: 'middle'
	},
	top: {
		verticalAlign: 'top'
	},
	bottom: {
		verticalAlign: 'bottom'
	}
});

/**
 * The `<td>` itself. `ctx` is `null` for a cell rendered outside a `Table`, in
 * which case only the consumer's `xstyle` applies — upstream's unstyled branch.
 */
export function tableCellAttrs(
	ctx: TableContextValue | null,
	hasContextMenu: boolean,
	xstyle: StyleArg | StyleArg[] | undefined
): SvelteStyleAttrs {
	// When the cell owns a context menu, its density padding is relocated onto
	// the right-click trigger wrapper (see `tableCellTriggerXstyle`) so the
	// entire cell — padding included — opens the menu. Otherwise padding lives
	// on the `<td>`.
	const cellStyles: StyleArg[] = ctx
		? [
				hasContextMenu ? densityTextStyles[ctx.density] : densityStyles[ctx.density],
				ctx.textOverflow === 'truncate' ? overflowStyles.cell : wrapStyles.cell,
				containerEdgeStyles[ctx.density],
				verticalAlignStyles[ctx.verticalAlign],
				...buildDividerStyles(ctx, dividerRowStyles.cell, dividerColumnStyles.cell),
				...(hasContextMenu ? [contextMenuCellStyles.cell] : [])
			]
		: [];

	return sx(...mergeXStyle(cellStyles, xstyle));
}

/**
 * Styles for the context-menu trigger wrapper inside a cell. `undefined` when
 * the cell has no actions, which is what keeps the wrapper out of the DOM.
 */
export function tableCellTriggerXstyle(
	ctx: TableContextValue | null,
	hasContextMenu: boolean
): StyleArg | undefined {
	if (!hasContextMenu) {
		return undefined;
	}
	return ctx ? [triggerFillStyles.fill, densityPaddingStyles[ctx.density]] : triggerFillStyles.fill;
}
