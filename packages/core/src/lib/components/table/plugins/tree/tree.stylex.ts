import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars, radiusVars, spacingVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/tree/useTableTreeData.tsx`.
 *
 * The group name is upstream's (`treeStyles`) and every declaration is
 * upstream's, in upstream's order, so the class oracle needs no rename. (The
 * 0.1.7 tarball shipped no `Table/plugins/tree/` at all and this module was
 * deferred wholesale; 0.2.0 shipped it and the oracle has checked it since.)
 *
 * `INDENT_STEP` lives here rather than next to the hook because it is a table of
 * `spacingVars` references, and StyleX may only be imported from `.ts` /
 * `.stylex.ts` modules. `treeCellAttrs` therefore also owns upstream's
 * `calc(${level} * ${step})` expression, which is the only place the token value
 * is consumed.
 */

/** Indent step per level, by the `indent` config token. Upstream's `INDENT_STEP`. */
const INDENT_STEP = {
	sm: spacingVars['--spacing-3'],
	md: spacingVars['--spacing-4'],
	lg: spacingVars['--spacing-6']
} as const;

const treeStyles = stylex.create({
	cell: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	indent: (paddingInlineStart: string) => ({
		paddingInlineStart
	}),
	expanderButton: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '24px',
		height: '24px',
		background: 'transparent',
		border: 'none',
		borderRadius: radiusVars['--radius-inner'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		color: colorVars['--color-icon-secondary'],
		transitionProperty: 'color, background-color',
		transitionDuration: '150ms',
		padding: 0,
		flexShrink: '0',
		// Match IconButton ghost hover: subtle overlay background
		backgroundImage: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			}
		},
		':hover:where(:not(:disabled,[aria-disabled="true"]))': {
			color: colorVars['--color-icon-primary']
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
	/** Keeps leaf content aligned with expandable siblings. */
	leafSpacer: {
		display: 'inline-block',
		width: '24px',
		height: '24px',
		flexShrink: '0'
	},
	/** Header expand-all toggle: same affordance as a row expander. */
	headerCell: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		minWidth: 0
	},
	/** Whole-row-click expansion: signal the row is interactive. */
	clickableRow: {
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	}
});

/**
 * The flex wrapper the tree column's cells get, carrying this row's
 * indentation. Upstream applies `treeStyles.indent` only above level 0, so the
 * root rows keep the class list a table without the plugin would have.
 */
export function treeCellAttrs(
	level: number,
	indent: 'sm' | 'md' | 'lg' | undefined
): SvelteStyleAttrs {
	const step = INDENT_STEP[indent ?? 'md'];
	return sx(treeStyles.cell, level > 0 && treeStyles.indent(`calc(${level} * ${step})`));
}

/** The expander chevron's button. */
export function treeExpanderButtonAttrs(): SvelteStyleAttrs {
	return sx(treeStyles.expanderButton);
}

/**
 * The chevron itself; rotates 90° when the row is expanded. Passed to the
 * `Icon`'s `xstyle` (#4838), so the rotation rides the glyph rather than a
 * wrapper span and the `astryx-icon` target reaches both the mark and its
 * open/closed transform.
 *
 * The RTL mirror moved into each state's `transform` with it, and that fixed a
 * real bug: the old `rtlStyles.mirror` wrapper was **inert**, because
 * `transform` does not apply to a non-replaced inline box. RTL disclosure
 * chevrons now mirror where they silently did not before.
 */
export const treeChevronIconStyle = treeStyles.chevronIcon;
export const treeChevronIconCollapsedStyle = treeStyles.chevronIconCollapsed;
export const treeChevronIconExpandedStyle = treeStyles.chevronIconExpanded;

/** The fixed-width spacer a leaf row renders instead of an expander. */
export function treeLeafSpacerAttrs(): SvelteStyleAttrs {
	return sx(treeStyles.leafSpacer);
}

/** The header's expand-all toggle cell. */
export function treeHeaderCellAttrs(): SvelteStyleAttrs {
	return sx(treeStyles.headerCell);
}

/**
 * Pushed onto an expandable row's `xstyle` by `transformBodyRow` when
 * `hasRowClickExpansion` is set. Exported raw rather than through `sx()`
 * because it joins the row's `xstyle` array and the `<tr>` resolves it —
 * exactly as `row-expansion.stylex.ts` exports its own `clickableRow`.
 */
export const treeClickableRowStyle: StyleArg = treeStyles.clickableRow;
