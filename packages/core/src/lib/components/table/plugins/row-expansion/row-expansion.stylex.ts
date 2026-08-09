import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars, radiusVars, spacingVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/rowExpansion/useTableRowExpansion.tsx`.
 *
 * Group name is upstream's (`expansionStyles`) so the class oracle needs no
 * rename, and every declaration is transcribed verbatim — including the
 * dynamic `indent(px)` style, which StyleX compiles to a custom property and
 * `sx()` serialises into the element's `style` string.
 *
 * `clickableRow` is exported as a raw style object rather than through `sx()`,
 * because `transformBodyRow` pushes it onto the row's `xstyle` array and the
 * pipeline resolves that itself — the same split `grouped-rows.stylex.ts` makes
 * for its `headerRow`.
 */

const expansionStyles = stylex.create({
	chevronButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '24px',
		height: '24px',
		background: 'transparent',
		border: 'none',
		borderRadius: radiusVars['--radius-inner'],
		cursor: 'pointer',
		color: colorVars['--color-icon-secondary'],
		transitionProperty: 'transform, color, background-color',
		transitionDuration: '150ms',
		padding: 0,
		flexShrink: '0',
		// Match IconButton ghost hover: subtle overlay background
		backgroundImage: {
			default: null,
			':hover': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			}
		},
		':hover': {
			color: colorVars['--color-icon-primary']
		}
	},
	chevronExpanded: {
		transform: 'rotate(90deg)'
	},
	chevronIcon: {
		display: 'inline-flex',
		transitionProperty: 'transform',
		transitionDuration: '150ms'
	},
	indentedCell: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	indent: (px: number) => ({
		paddingInlineStart: `${px}px`
	}),
	placeholder: {
		display: 'inline-block',
		width: '24px',
		height: '24px',
		flexShrink: '0'
	},
	clickableRow: {
		cursor: 'pointer'
	}
});

/** The transparent, borderless chevron button — both the row one and the header expand-all one. */
export function expansionChevronButtonAttrs(): SvelteStyleAttrs {
	return sx(expansionStyles.chevronButton);
}

/** The chevron's icon wrapper, rotated a quarter turn while expanded. */
export function expansionChevronIconAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(expansionStyles.chevronIcon, isExpanded && expansionStyles.chevronExpanded);
}

/** A child row's first content cell: chevron (or placeholder) plus the original content. */
export function expansionIndentedCellAttrs(indent: number): SvelteStyleAttrs {
	return sx(expansionStyles.indentedCell, indent > 0 && expansionStyles.indent(indent));
}

/** Chevron-sized spacer keeping non-expandable child rows aligned with their siblings. */
export function expansionPlaceholderAttrs(): SvelteStyleAttrs {
	return sx(expansionStyles.placeholder);
}

/** Pushed onto a row's `xstyle` by `transformBodyRow` when `hasRowClickExpansion` is set. */
export const clickableRowStyle: StyleArg = expansionStyles.clickableRow;
