import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars, fontWeightVars, spacingVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/groupedRows/useTableGroupedRows.tsx`.
 *
 * Group name is upstream's (`styles`) so the class oracle needs no rename.
 * `headerRow` is exported as a raw style object rather than through `sx()`,
 * because it is pushed onto the row's `xstyle` array — the pipeline resolves
 * that itself.
 */

const styles = stylex.create({
	headerRow: {
		cursor: 'pointer',
		userSelect: 'none',
		backgroundColor: colorVars['--color-background-muted'],
		// Divider beneath each group header row (Ernest review #2).
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border']
	},
	headerCell: {
		paddingBlock: spacingVars['--spacing-2'],
		// No inline start padding so the chevron aligns with the table's leading
		// edge (Ernest review #1).
		paddingInlineStart: spacingVars['--spacing-1'],
		paddingInlineEnd: spacingVars['--spacing-3']
	},
	headerInner: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	// Standalone chevron button with no heavy chrome (transparent, borderless,
	// zero padding) so the icon sits flush with the start of the table
	// (Ernest review #1) while staying keyboard-operable.
	chevron: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: '0',
		padding: 0,
		margin: 0,
		background: 'transparent',
		border: 'none',
		cursor: 'pointer',
		color: {
			default: colorVars['--color-icon-secondary'],
			':hover': colorVars['--color-icon-primary']
		}
	},
	chevronIcon: {
		transitionProperty: 'transform',
		transitionDuration: '150ms'
	},
	// The RTL mirror is folded into each state's transform rather than living on
	// a parent span. Both are `transform`, so on one element the later value
	// would win — spelling out `scaleX(-1) rotate(...)` per state composes them
	// exactly as the nested elements did, while leaving a single element to
	// carry the glyph's theme target.
	chevronIconCollapsed: {
		transform: {
			default: 'rotate(0deg)',
			':is([dir="rtl"] *)': 'scaleX(-1) rotate(0deg)'
		}
	},
	chevronIconExpanded: {
		transform: {
			default: 'rotate(90deg)',
			':is([dir="rtl"] *)': 'scaleX(-1) rotate(90deg)'
		}
	},
	// Emphasized body text — same size as body, heavier weight (Ernest #3).
	label: {
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-primary']
	},
	count: {
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	}
});

/** Pushed onto the group-header row's `xstyle` by `transformBodyRow`. */
export const groupHeaderRowStyle: StyleArg = styles.headerRow;

export function groupHeaderCellAttrs(): SvelteStyleAttrs {
	return sx(styles.headerCell);
}

export function groupHeaderInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.headerInner);
}

export function groupChevronAttrs(): SvelteStyleAttrs {
	return sx(styles.chevron);
}

/**
 * Passed to the chevron `Icon`'s `xstyle` (#4838). The rotation rides the glyph
 * rather than a wrapper span, so the `astryx-icon` target reaches both the mark
 * and its open/closed transform — and the RTL mirror, which was inert on the
 * old inline wrapper (`transform` does not apply to a non-replaced inline box),
 * is spelled out per state above and now actually mirrors.
 */
export const groupChevronIconStyle = styles.chevronIcon;
export const groupChevronIconCollapsedStyle = styles.chevronIconCollapsed;
export const groupChevronIconExpandedStyle = styles.chevronIconExpanded;

export function groupLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.label);
}

export function groupCountAttrs(): SvelteStyleAttrs {
	return sx(styles.count);
}
