import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

/**
 * Styles for Icon, ported from Astryx's `src/Icon/Icon.tsx`.
 */

const styles = stylex.create({
	root: {
		flexShrink: 0
	},
	/** Wrapper for string-based (registry) icons */
	span: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0
	}
});

const colorStyles = stylex.create({
	primary: {
		color: colorVars['--color-icon-primary']
	},
	secondary: {
		color: colorVars['--color-icon-secondary']
	},
	tertiary: {
		color: colorVars['--color-icon-secondary']
	},
	disabled: {
		color: colorVars['--color-icon-disabled']
	},
	accent: {
		color: colorVars['--color-accent']
	},
	success: {
		color: colorVars['--color-success']
	},
	error: {
		color: colorVars['--color-error']
	},
	warning: {
		color: colorVars['--color-warning']
	},
	inherit: {
		color: 'inherit'
	},
	// Non-semantic colors
	blue: {
		color: colorVars['--color-icon-blue']
	},
	red: {
		color: colorVars['--color-icon-red']
	},
	green: {
		color: colorVars['--color-icon-green']
	},
	gray: {
		color: colorVars['--color-icon-gray']
	},
	cyan: {
		color: colorVars['--color-icon-cyan']
	},
	teal: {
		color: colorVars['--color-icon-teal']
	},
	yellow: {
		color: colorVars['--color-icon-yellow']
	},
	orange: {
		color: colorVars['--color-icon-orange']
	},
	pink: {
		color: colorVars['--color-icon-pink']
	},
	purple: {
		color: colorVars['--color-icon-purple']
	}
});

/**
 * Size styles for direct SVG icon components.
 * Uses width/height only — SVG components handle their own viewBox scaling.
 *
 * Sizes are expressed in `rem` (relative to the root font-size) so icons scale
 * in step with text when the document font-size changes, matching the rest of
 * the design system's rem-based type scale. Values are the px-equivalents at a
 * 16px root: 12px → 0.75rem, 16px → 1rem, 20px → 1.25rem, 24px → 1.5rem.
 */
const sizeStyles = stylex.create({
	xsm: {
		width: '0.75rem',
		height: '0.75rem'
	},
	sm: {
		width: '1rem',
		height: '1rem'
	},
	md: {
		width: '1.25rem',
		height: '1.25rem'
	},
	lg: {
		width: '1.5rem',
		height: '1.5rem'
	}
});

/**
 * Size styles for string-based (registry) icons.
 * Includes fontSize so that 1em-based icons from the registry scale correctly.
 *
 * Expressed in `rem` for the same reason as {@link sizeStyles} — icons track the
 * root font-size instead of being locked to absolute pixels.
 */
const spanSizeStyles = stylex.create({
	xsm: {
		width: '0.75rem',
		height: '0.75rem',
		fontSize: '0.75rem'
	},
	sm: {
		width: '1rem',
		height: '1rem',
		fontSize: '1rem'
	},
	md: {
		width: '1.25rem',
		height: '1.25rem',
		fontSize: '1.25rem'
	},
	lg: {
		width: '1.5rem',
		height: '1.5rem',
		fontSize: '1.5rem'
	}
});

export type IconColor = keyof typeof colorStyles;
export type IconSize = keyof typeof sizeStyles;

/**
 * The `<svg>` a caller passed as a component. `xstyle` folds into the same
 * `stylex.props()` call as the base colour/size styles, last, so it merges and
 * dedupes with them rather than landing beside them — upstream's arrangement.
 */
export function iconAttrs(color: IconColor, size: IconSize, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, colorStyles[color], sizeStyles[size], xstyle);
}

/** The `<span>` wrapping a registry icon, whose font-size sizes the 1em SVG. */
export function iconSpanAttrs(
	color: IconColor,
	size: IconSize,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.span, colorStyles[color], spanSizeStyles[size], xstyle);
}
