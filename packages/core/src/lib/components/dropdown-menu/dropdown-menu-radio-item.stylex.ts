import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuRadioItem.tsx` styles.
 *
 * The same shape as the checkbox item's, with a circle instead of a square and
 * an inner dot rather than a check glyph: `root` reaches `Item`'s `xstyle` as an
 * array and stays an object; the circle and dot each resolve at one call site.
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
	circle: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		boxSizing: 'border-box',
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderRadius: '50%',
		transitionProperty: 'background-color, border-color',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		order: {
			default: 0,
			'@media (pointer: coarse)': 1
		},
		marginInlineStart: {
			default: 0,
			'@media (pointer: coarse)': 'auto'
		}
	},
	unchecked: {
		borderColor: colorVars['--color-border-emphasized'],
		backgroundColor: colorVars['--color-background-surface']
	},
	checked: {
		borderColor: colorVars['--color-accent'],
		backgroundColor: colorVars['--color-accent']
	},
	dot: {
		borderRadius: '50%',
		backgroundColor: colorVars['--color-on-accent']
	}
});

const circleSizeStyles = stylex.create({
	sm: { width: 18, height: 18 },
	md: { width: 22, height: 22 }
});

const dotSizeStyles = stylex.create({
	sm: { width: 6, height: 6 },
	md: { width: 8, height: 8 }
});

/** The control size the circle renders at — a `sm` menu gets the compact one. */
export type RadioControlSize = 'sm' | 'md';

/** The `xstyle` array handed to `Item`. */
export function radioItemXstyle(isDisabled: boolean, xstyle?: StyleArg): StyleArg {
	return [styles.root, isDisabled && styles.disabled, xstyle];
}

/** The decorative circle in `Item`'s `marker` slot. */
export function radioCircleAttrs(
	controlSize: RadioControlSize,
	isChecked: boolean
): SvelteStyleAttrs {
	return sx(
		styles.circle,
		circleSizeStyles[controlSize],
		isChecked ? styles.checked : styles.unchecked
	);
}

/** The inner dot, rendered only when the item is checked. */
export function radioDotAttrs(controlSize: RadioControlSize): SvelteStyleAttrs {
	return sx(styles.dot, dotSizeStyles[controlSize]);
}
