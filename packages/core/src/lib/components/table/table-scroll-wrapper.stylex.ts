import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's `Table/Table.tsx` — the
 * table-level style plugin's `tableStyles` and the scroll container's
 * `scrollWrapperStyles`. They live together because upstream declares them in
 * one module; group names are upstream's so the class oracle needs no renames.
 */

const tableStyles = stylex.create({
	base: {
		fontFamily: 'inherit',
		color: colorVars['--color-text-primary']
	}
});

const scrollWrapperStyles = stylex.create({
	base: {
		overflowX: 'auto',
		WebkitOverflowScrolling: 'touch'
	},
	containerBleed: {
		marginInlineStart: 'calc(-1 * var(--container-padding-inline-start, 0px))',
		marginInlineEnd: 'calc(-1 * var(--container-padding-inline-end, 0px))',
		width:
			'calc(100% + var(--container-padding-inline-start, 0px) + var(--container-padding-inline-end, 0px))',
		marginTop: {
			default: null,
			':first-child': 'calc(-1 * var(--container-padding-block-start, 0px))'
		},
		marginBottom: {
			default: null,
			':last-child': 'calc(-1 * var(--container-padding-block-end, 0px))'
		}
	}
});

/** The `<table>` styles the table-level plugin appends to the pipeline. */
export const tableBaseStyle: StyleArg = tableStyles.base;

/** The horizontal scroll container around the `<table>`. */
export function tableScrollWrapperAttrs(pluginStyles: StyleArg[] | undefined): SvelteStyleAttrs {
	return sx(scrollWrapperStyles.base, scrollWrapperStyles.containerBleed, ...(pluginStyles ?? []));
}
