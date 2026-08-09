import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, durationVars, easeVars } from '../../styles/tokens.stylex.js';
import { tableRowMarker } from './table.markers.stylex.js';
import type { TableContextValue } from './table-context.svelte.js';

/**
 * Ported from the styles declared in Astryx's `Table/TableRow.tsx`.
 *
 * Group names are upstream's so the class oracle needs no renames.
 */

const stripedRowStyles = stylex.create({
	row: {
		backgroundColor: {
			default: null,
			':nth-child(even)': colorVars['--color-background-muted']
		},
		// Publish the row's current overlay color as an inheritable variable so
		// pinned/sticky cells (which paint an opaque background over the otherwise
		// transparent row) can replay the exact same striping. Unset on odd rows.
		'--table-row-overlay': {
			default: null,
			':nth-child(even)': colorVars['--color-background-muted']
		}
	}
});

const hoverRowStyles = stylex.create({
	row: {
		backgroundColor: {
			default: null,
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		'--table-row-overlay': {
			default: null,
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	}
});

const stripedHoverRowStyles = stylex.create({
	row: {
		backgroundColor: {
			default: null,
			':nth-child(even)': colorVars['--color-background-muted'],
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		'--table-row-overlay': {
			default: null,
			':nth-child(even)': colorVars['--color-background-muted'],
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	}
});

/**
 * The `<tr>` itself. Always carries `tableRowMarker` — that is what scopes a
 * cell's `:last-child` ancestor check to its own row.
 *
 * Striping and hover are body-row styling: the header row must not pick either
 * up even when the table sets `isStriped`/`hasHover`. `ctx` is `null` for a row
 * rendered outside a `Table`, which renders plain plus the consumer's `xstyle`.
 */
export function tableRowAttrs(
	ctx: TableContextValue | null,
	isHeaderRow: boolean,
	xstyle: StyleArg[] | undefined
): SvelteStyleAttrs {
	if (!ctx) {
		return sx(tableRowMarker, xstyle);
	}

	const rowStyles: StyleArg[] = [];

	if (!isHeaderRow) {
		// Handle striped + hover combination to avoid backgroundColor conflicts
		if (ctx.isStriped && ctx.hasHover) {
			rowStyles.push(stripedHoverRowStyles.row);
		} else if (ctx.isStriped) {
			rowStyles.push(stripedRowStyles.row);
		} else if (ctx.hasHover) {
			rowStyles.push(hoverRowStyles.row);
		}
	}

	// Note: last-body-row border removal is handled by TableCell so it cannot
	// affect the header row in <thead>. Upstream keeps an empty `dividers`
	// branch here saying exactly that; there is nothing to run, so this port
	// records it as a comment rather than as dead code.

	if (xstyle) {
		rowStyles.push(...xstyle);
	}

	return sx(tableRowMarker, ...rowStyles);
}
