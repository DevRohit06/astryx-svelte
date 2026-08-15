import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';
import { colorVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuRadioItem.tsx` styles.
 *
 * **The menu stopped drawing the radio at upstream 0.4.0.** The circle, the
 * inner dot and their size ramps are `RadioIndicator`'s now, so a menu radio and
 * a `RadioList` radio are literally the same component — which is the point of
 * the change, and why `dropdown-menu-radio-dot` could be removed as a theme
 * target: there is no menu-only dot element left to address, and a theme reaches
 * the dot through `radio-indicator-dot` instead.
 *
 * What is left is `root` (reaching `Item`'s `xstyle` as an array, so it stays an
 * object) and `marker` — where the indicator sits in the row.
 */
const styles = stylex.create({
	root: {
		width: '100%',
		borderRadius: `max(0px, calc(var(--_dropdown-menu-radius, ${spacingVars['--spacing-2']}) - var(--_dropdown-menu-padding, ${spacingVars['--spacing-1']})))`,
		color: colorVars['--color-text-primary'],
		backgroundColor: {
			default: 'transparent',
			':focus': colorVars['--color-overlay-hover']
		},
		cursor: 'pointer',
		outline: 'none'
	},
	disabled: {
		opacity: 0.5,
		cursor: 'not-allowed'
	},
	// Rendered in Item's `marker` slot as a raw flex child. On touch it moves to
	// the inline-end of the row via `order`.
	// Placement of the marker within the row. The indicator draws its own box
	// (size, fill, border) — these are only the rules the MENU owns: where the
	// marker sits in the row, and that it never takes the pointer. On touch it
	// moves to the inline-end of the row via `order`.
	marker: {
		pointerEvents: 'none',
		order: {
			default: 0,
			'@media (pointer: coarse)': 1
		},
		marginInlineStart: {
			default: 0,
			'@media (pointer: coarse)': 'auto'
		}
	}
});

/** The control size the circle renders at — a `sm` menu gets the compact one. */
export type RadioControlSize = 'sm' | 'md';

/** The `xstyle` array handed to `Item`. */
export function radioItemXstyle(isDisabled: boolean, xstyle?: StyleArg): StyleArg {
	return [styles.root, isDisabled && styles.disabled, xstyle];
}

/**
 * The `xstyle` handed to the radio indicator in `Item`'s `marker` slot.
 *
 * Everything the circle and its dot used to declare here moved to
 * `RadioIndicator` at upstream 0.4.0 — including their two size ramps, which is
 * why the menu no longer states `18/22` and `6/8` px: it passes a control
 * `size` and the indicator picks the box. What stays is placement, because
 * where a marker sits in a menu row is the menu's business, not the radio's.
 */
export const radioMarkerXstyle: StyleArg = styles.marker;
