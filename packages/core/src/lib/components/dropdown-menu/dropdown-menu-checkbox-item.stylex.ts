import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
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
	// Rendered in Item's `marker` slot as a raw flex child, so `order` moves it
	// relative to the label within the row. On touch it moves to the inline-end.
	// `aria-hidden` + `inert` + pointer-events:none keep the composed CheckboxInput
	// decorative: it adds no accessible name, and clicks fall through to the row,
	// which owns the role and activation.
	markerBox: {
		display: 'flex',
		flexShrink: 0,
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

/** The `inert` wrapper around the decorative `CheckboxInput` in `Item`'s `marker` slot. */
export function checkboxMarkerBoxAttrs(): SvelteStyleAttrs {
	return sx(styles.markerBox);
}
