import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

const baseStyles = stylex.create({
	span: {
		// Prevent overflow in the grid.
		minWidth: 0,
		// Fill the grid cell, and stretch children to it.
		display: 'grid',
		height: '100%'
	}
});

export function gridSpanAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(baseStyles.span, xstyle);
}

/** Inline `grid-column` / `grid-row` for the span the caller asked for. */
export function gridSpanStyle(
	columns: number | 'full' | undefined,
	rows: number | undefined
): string | undefined {
	const parts: string[] = [];

	if (columns != null)
		parts.push(`grid-column:${columns === 'full' ? '1 / -1' : `span ${columns}`}`);
	if (rows != null) parts.push(`grid-row:span ${rows}`);

	return parts.length > 0 ? parts.join(';') : undefined;
}
