import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../../../internal/sx.js';
import { colorVars } from '../../../../styles/tokens.stylex.js';

/**
 * Ported from the styles declared in Astryx's
 * `Table/plugins/columnResize/useTableColumnResize.tsx`.
 *
 * Group names are upstream's (`handleStyles`, `headerCellRelative`) so the class
 * oracle needs no renames, and every declaration is upstream's verbatim —
 * including the `content: '""'` inside `indicator`, which is the CSS property,
 * not a render slot.
 *
 * `handleStyles` is applied at exactly one call site (`stylex.props(base,
 * indicator)` on the handle `<div>`), so it is exported through `sx()`;
 * `headerCellRelative.base` is pushed onto the header cell's `xstyle` array and
 * so is exported as a raw style object, which the table's pipeline resolves
 * itself.
 */

const handleStyles = stylex.create({
	base: {
		position: 'absolute',
		// Keep entirely inside the <th> — extending outside gets clipped by the
		// adjacent <th>'s overflow:hidden.
		insetInlineEnd: 0,
		top: 0,
		// Extend the handle the full height of the table, not just the header.
		// The <th> has overflow:visible (from headerCellRelative), so the handle
		// visually reaches through the body rows. The CSS variable is set by
		// the plugin's ResizeObserver — falls back to 100% (header only) when
		// the observer hasn't fired yet.
		height: 'var(--table-resize-height, 100%)',
		// Wide transparent hit area; the visible indicator uses ::after to span
		// the full handle height independently of the border box.
		width: '8px',
		cursor: {
			default: 'ew-resize',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		zIndex: 1,
		touchAction: 'none',
		userSelect: 'none',
		// Drive the indicator color via a CSS variable that ::after reads.
		// The parent handle is the hover/focus target — pseudo-elements
		// can't receive :hover directly.
		'--indicator-color': {
			default: 'transparent',
			':hover:where(:not(:disabled,[aria-disabled="true"]))': colorVars['--color-accent'],
			':focus-visible': colorVars['--color-accent']
		},
		'@media (pointer: coarse)': {
			display: 'none'
		}
	},
	/**
	 * The 1px indicator line as a pseudo-element on the trailing edge.
	 * Spans the full height of the handle (which extends the table height).
	 * Reads --indicator-color from the parent, which toggles on
	 * hover, focus-visible, and during drag.
	 */
	indicator: {
		'::after': {
			content: '""',
			position: 'absolute',
			// Position on the column boundary (right edge of the handle)
			// so the visual line aligns with the column divider. The 8px
			// hit area extends to the left of it.
			insetInlineEnd: 0,
			top: 0,
			bottom: 0,
			width: 'var(--indicator-width, 1px)',
			backgroundColor: 'var(--indicator-color, transparent)',
			transition: 'background-color 150ms ease, width 150ms ease'
		}
	}
});

const headerCellRelative = stylex.create({
	base: {
		position: 'relative',
		overflow: 'visible'
	}
});

/** The draggable `role="separator"` sitting on a header cell's trailing edge. */
export function resizeHandleAttrs(): SvelteStyleAttrs {
	return sx(handleStyles.base, handleStyles.indicator);
}

/** Pushed onto a resizable header cell's `xstyle` so the handle can position. */
export const headerCellRelativeStyle: StyleArg = headerCellRelative.base;
