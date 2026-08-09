import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../../../internal/sx.js';
import { colorVars, durationVars, easeVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/stickyColumns/useTableStickyColumns.tsx`.
 *
 * Group names are upstream's (`stickyStyles`, `shadowStyles`) so the class
 * oracle needs no renames. The styles are exported as raw objects rather than
 * through `sx()`, because they are pushed onto a cell's `xstyle` array and the
 * table's pipeline resolves that itself.
 */

// Scroll-state CSS variables set on the scroll container by the layout
// attachment; the cell ::after shadows read them so each edge's shadow only
// shows when content is hidden behind it. (A variable, not stylex.when.ancestor,
// because StyleX ancestor selectors are pseudo-class only — not scroll state.)
export const SHADOW_VAR_START = '--table-sticky-shadow-start';
export const SHADOW_VAR_END = '--table-sticky-shadow-end';

const stickyStyles = stylex.create({
	cell: {
		position: 'sticky',
		// Opaque base (overridable; defaults to the card token, the common
		// container) so scrolled content doesn't show through the pinned column.
		backgroundColor: `var(--table-sticky-background, ${colorVars['--color-background-card']})`,
		// Replay the row's overlay on a ::before layer (above the base, below text)
		// so the pinned column mirrors the row's striping/hover exactly via
		// --table-row-overlay. Transitions background-COLOR (not background-image)
		// so hover stays smooth at rest, not just when GPU-promoted while scrolled.
		'::before': {
			content: '""',
			position: 'absolute',
			inset: 0,
			zIndex: -1,
			pointerEvents: 'none',
			backgroundColor: 'var(--table-row-overlay, transparent)',
			transitionProperty: 'background-color',
			transitionDuration: durationVars['--duration-fast'],
			transitionTimingFunction: easeVars['--ease-standard']
		},
		// padding-box keeps the base off the cell's collapsed divider border.
		backgroundClip: 'padding-box',
		// Sticky cells need visible overflow so the shadow ::after can bleed out.
		overflow: 'visible'
	},
	headerCell: {
		// Header cells stack above body cells; both stack above non-sticky cells.
		zIndex: 3
	},
	bodyCell: {
		zIndex: 1
	}
});

// Soft drop shadow over the scrolling region (matches the EPS sticky treatment).
// border-collapse tables don't paint box-shadow on cells in Chromium, so it's a
// ::after gradient strip just past the pinned edge (visible thanks to the cell's
// overflow: visible). Opacity is gated by the scroll-state variable above.
const SHADOW_WIDTH = '6px';
// --color-shadow is only ~10% alpha (too faint here); use a slightly stronger soft tint.
const SHADOW_TINT = 'light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.32))';

const shadowStyles = stylex.create({
	// start-pinned: shadow falls toward inline-end (over scrolled content).
	// `insetInlineEnd` anchors the strip to the column's inline-end edge; the
	// strip is nudged one full width OUTWARD into content — +X under LTR
	// (inline-end = right) but −X under RTL (inline-end = left) — with the
	// gradient fading from the pinned edge toward content in each direction.
	// `transform` and `background-image` have no logical form, so both need the
	// explicit `[dir="rtl"]` branch; the insets do not.
	start: {
		'::after': {
			content: '""',
			position: 'absolute',
			top: 0,
			bottom: 0,
			insetInlineEnd: 0,
			width: SHADOW_WIDTH,
			transform: {
				default: 'translateX(100%)',
				':is([dir="rtl"] *)': 'translateX(-100%)'
			},
			pointerEvents: 'none',
			transition: 'opacity 150ms ease',
			opacity: `var(${SHADOW_VAR_START}, 0)`,
			backgroundImage: {
				default: `linear-gradient(to right, ${SHADOW_TINT}, transparent)`,
				':is([dir="rtl"] *)': `linear-gradient(to left, ${SHADOW_TINT}, transparent)`
			}
		}
	},
	// end-pinned: shadow falls toward inline-start (over scrolled content).
	// `insetInlineStart` anchors the strip to the column's inline-start edge; the
	// strip is nudged one full width OUTWARD into content — −X under LTR
	// (inline-start = left) but +X under RTL (inline-start = right) — with the
	// gradient fading from the pinned edge toward content in each direction.
	end: {
		'::after': {
			content: '""',
			position: 'absolute',
			top: 0,
			bottom: 0,
			insetInlineStart: 0,
			width: SHADOW_WIDTH,
			transform: {
				default: 'translateX(-100%)',
				':is([dir="rtl"] *)': 'translateX(100%)'
			},
			pointerEvents: 'none',
			transition: 'opacity 150ms ease',
			opacity: `var(${SHADOW_VAR_END}, 0)`,
			backgroundImage: {
				default: `linear-gradient(to left, ${SHADOW_TINT}, transparent)`,
				':is([dir="rtl"] *)': `linear-gradient(to right, ${SHADOW_TINT}, transparent)`
			}
		}
	}
});

export const stickyCellStyle: StyleArg = stickyStyles.cell;
export const stickyHeaderCellStyle: StyleArg = stickyStyles.headerCell;
export const stickyBodyCellStyle: StyleArg = stickyStyles.bodyCell;
export const stickyShadowStartStyle: StyleArg = shadowStyles.start;
export const stickyShadowEndStyle: StyleArg = shadowStyles.end;
