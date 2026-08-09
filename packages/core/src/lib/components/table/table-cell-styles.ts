import type { StyleArg } from '../../internal/sx.js';
import type { TableContextValue } from './table-context.svelte.js';

/**
 * Ported from Astryx's `Table/useTableCellStyles.ts`.
 *
 * Upstream's module is three exports: two pure style builders and a
 * one-line `use(TableContext)` wrapper. The wrapper has no counterpart here —
 * `useTableContext` is already the context module's own export (see
 * `table-context.svelte.ts`), and re-exporting it through a second module
 * would invent a second name for one thing. So this file carries the two pure
 * builders, and is a plain `.ts` rather than a `.svelte.ts` because nothing in
 * it is reactive.
 */

/**
 * Build the divider styles array for a cell based on context.
 * Shared between body cells and header cells — both apply row/column
 * dividers the same way.
 */
export function buildDividerStyles(
	ctx: TableContextValue,
	dividerRowStyle: StyleArg,
	dividerColumnStyle: StyleArg
): StyleArg[] {
	const result: StyleArg[] = [];

	if (ctx.dividers === 'rows' || ctx.dividers === 'grid') {
		result.push(dividerRowStyle);
	}

	if (ctx.dividers === 'columns' || ctx.dividers === 'grid') {
		result.push(dividerColumnStyle);
	}

	return result;
}

/**
 * Merge consumer xstyle (single or array) into a styles array.
 * Handles the polymorphic xstyle prop that both cell components accept.
 */
export function mergeXStyle(
	styles: StyleArg[],
	xstyle: StyleArg | StyleArg[] | undefined
): StyleArg[] {
	if (!xstyle) {
		return styles;
	}
	if (Array.isArray(xstyle)) {
		return [...styles, ...xstyle];
	}
	return [...styles, xstyle];
}
