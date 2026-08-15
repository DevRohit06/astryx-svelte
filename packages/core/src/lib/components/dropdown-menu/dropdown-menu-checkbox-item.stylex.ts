import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';
import { colorVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuCheckboxItem.tsx` styles.
 *
 * `root` reaches `Item`'s `xstyle` as an array, so it stays an object;
 * `markerBox` resolves at a single static call site and folds to a literal class
 * string (0.3.0 moved the painted square into a composed `CheckboxInput`, which
 * removed the dynamically indexed `boxSizeStyles` that used to keep the whole
 * module in object mode).
 *
 * The composed control is decorative — the row owns `aria-checked` — so the
 * wrapper is `aria-hidden` + `inert` with `pointer-events: none`, letting clicks
 * fall through to the row. It swaps to the inline-end of the row on
 * coarse-pointer devices through `order`, which is where selection toggles
 * conventionally sit on touch.
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
	// Placement of the marker within the row. The indicator draws its own box
	// (size, fill, border) — these are only the rules the MENU owns: where the
	// marker sits in the row, and that it never takes the pointer. `display` and
	// `flexShrink` went with the wrapper: the indicator's own chrome carries
	// both.
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

/** The `xstyle` array handed to `Item`. */
export function checkboxItemXstyle(isDisabled: boolean, xstyle?: StyleArg): StyleArg {
	return [styles.root, isDisabled && styles.disabled, xstyle];
}

/**
 * The `xstyle` handed to the checkbox indicator in `Item`'s `marker` slot.
 *
 * Through 0.3.0 this styled a wrapper around a whole decorative `CheckboxInput`
 * — a control rendered `inert` purely to borrow its picture. Upstream 0.4.0
 * renders the indicator directly, so the wrapper is gone and with it the
 * `aria-hidden`/`inert` scaffolding: an indicator is decorative by contract.
 * The `astryx-checkbox` target is already on the indicator's own element, so
 * the menu adds only its placement rules.
 */
export const checkboxMarkerXstyle: StyleArg = styles.marker;
