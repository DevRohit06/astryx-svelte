import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../../../internal/sx.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/rowStatus/useTableRowStatus.tsx`.
 *
 * Upstream declares these in the hook file rather than a style module and keeps
 * the group's name `styles`, so the class oracle needs no rename.
 *
 * `SEMANTIC_COLORS` and `resolveColor` live here rather than beside the hook
 * because the dot's colour is fed straight into a `stylex.create` function
 * style, and because the raw-CSS escape hatch has to travel the same path as a
 * resolved token for the emitted class to match. Upstream writes the tokens as
 * literal `var(--color-icon-*)` strings rather than reaching for
 * `colorVars`, and that is transcribed rather than tidied: the value ends up in
 * a **CSS custom property** at runtime, not in a `stylex.create` declaration, so
 * a `colorVars` reference would compile to the same string by a longer road and
 * an authored raw colour has to work identically either way.
 */

/**
 * Semantic status colors, resolved to the design system's icon color tokens.
 * Prefer these over raw CSS so status colors stay consistent with the theme.
 */
export type TableRowStatusColor =
	| 'accent'
	| 'success'
	| 'error'
	| 'warning'
	| 'red'
	| 'orange'
	| 'green'
	| 'yellow'
	| 'blue'
	| 'gray';

const SEMANTIC_COLORS: Record<TableRowStatusColor, string> = {
	accent: 'var(--color-icon-accent)',
	success: 'var(--color-icon-green)',
	error: 'var(--color-icon-red)',
	warning: 'var(--color-icon-orange)',
	red: 'var(--color-icon-red)',
	orange: 'var(--color-icon-orange)',
	green: 'var(--color-icon-green)',
	yellow: 'var(--color-icon-yellow)',
	blue: 'var(--color-icon-blue)',
	gray: 'var(--color-icon-gray)'
};

/** Resolve a semantic color name to a token, or pass a raw CSS color through. */
export function resolveColor(color: string): string {
	return (SEMANTIC_COLORS as Record<string, string>)[color] ?? color;
}

const styles = stylex.create({
	// Centers the dot or icon within the narrow status column.
	wrap: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	dot: (color: string) => ({
		width: '8px',
		height: '8px',
		borderRadius: '50%',
		backgroundColor: color,
		flexShrink: 0
	})
});

/** The centring wrapper around the status dot or icon. */
export function rowStatusWrapAttrs(): SvelteStyleAttrs {
	return sx(styles.wrap);
}

/** The status dot itself, painted with the resolved colour. */
export function rowStatusDotAttrs(color: string): SvelteStyleAttrs {
	return sx(styles.dot(resolveColor(color)));
}
