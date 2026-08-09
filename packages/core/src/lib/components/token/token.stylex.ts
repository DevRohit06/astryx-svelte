import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Extensible colour map for `Token`.
 *
 * Theme packages add their own colours by augmenting this interface, and
 * `astryx theme build` generates the augmentation — the same seam `Badge` and
 * `Button` carry. **This used to be a closed union**, with a comment claiming
 * upstream had no augmentation seam; 0.2.0 added one, and the comment outlived
 * the fact by a release.
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface TokenColorMap {
 *     brand: true;
 *   }
 * }
 */
export interface TokenColorMap {
	default: true;
	red: true;
	orange: true;
	yellow: true;
	green: true;
	teal: true;
	cyan: true;
	blue: true;
	purple: true;
	pink: true;
	gray: true;
}

/** Colour variant for the token. Extensible via {@link TokenColorMap}. */
export type TokenColor = keyof TokenColorMap;

export type TokenSize = 'sm' | 'md' | 'lg';

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		paddingBlock: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: radiusVars['--radius-inner'],
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		whiteSpace: 'nowrap',
		textDecoration: 'none',
		maxWidth: '100%',
		overflow: 'hidden'
	},
	label: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		minWidth: 0
	},
	interactive: {
		cursor: 'pointer',
		transitionProperty: 'background-image',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundImage: {
			default: null,
			':hover': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			},
			':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`
		},
		outline: {
			default: null,
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':focus-visible': '2px'
		}
	},
	disabled: {
		cursor: 'not-allowed',
		opacity: 0.5,
		pointerEvents: 'none'
	},
	labelHidden: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clipPath: 'inset(50%)',
		whiteSpace: 'nowrap',
		borderWidth: 0
	},
	invisibleButton: {
		all: 'unset',
		cursor: 'inherit',
		font: 'inherit',
		color: 'inherit',
		outline: 'none',
		overflow: 'hidden',
		minWidth: 0
	},
	focusVisibleOutline: {
		outline: {
			default: null,
			':has(:focus-visible)': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':has(:focus-visible)': '2px'
		}
	},
	removeButton: {
		all: 'unset',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
		padding: 0,
		marginInlineEnd: `calc(-1 * ${spacingVars['--spacing-1']})`,
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-full'],
		width: '16px',
		height: '16px',
		color: 'inherit',
		outline: {
			default: null,
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		'::after': {
			content: '""',
			position: 'absolute',
			inset: '-14px'
		}
	}
});

const sizeStyles = stylex.create({
	sm: {
		height: `calc(${sizeVars['--size-element-sm']} - 8px)`,
		fontSize: typeScaleVars['--text-supporting-size'],
		paddingInline: spacingVars['--spacing-2']
	},
	md: {
		height: `calc(${sizeVars['--size-element-md']} - 8px)`,
		paddingInline: spacingVars['--spacing-2']
	},
	lg: {
		height: `calc(${sizeVars['--size-element-lg']} - 8px)`,
		paddingInline: spacingVars['--spacing-2']
	}
});

const colorStyles = stylex.create({
	default: {
		backgroundColor: colorVars['--color-neutral'],
		color: colorVars['--color-text-primary']
	},
	red: {
		backgroundColor: colorVars['--color-background-red'],
		color: colorVars['--color-text-red']
	},
	orange: {
		backgroundColor: colorVars['--color-background-orange'],
		color: colorVars['--color-text-orange']
	},
	yellow: {
		backgroundColor: colorVars['--color-background-yellow'],
		color: colorVars['--color-text-yellow']
	},
	green: {
		backgroundColor: colorVars['--color-background-green'],
		color: colorVars['--color-text-green']
	},
	teal: {
		backgroundColor: colorVars['--color-background-teal'],
		color: colorVars['--color-text-teal']
	},
	cyan: {
		backgroundColor: colorVars['--color-background-cyan'],
		color: colorVars['--color-text-cyan']
	},
	blue: {
		backgroundColor: colorVars['--color-background-blue'],
		color: colorVars['--color-text-blue']
	},
	purple: {
		backgroundColor: colorVars['--color-background-purple'],
		color: colorVars['--color-text-purple']
	},
	pink: {
		backgroundColor: colorVars['--color-background-pink'],
		color: colorVars['--color-text-pink']
	},
	gray: {
		backgroundColor: colorVars['--color-background-gray'],
		color: colorVars['--color-text-gray']
	}
});

export interface TokenRootOptions {
	color: TokenColor;
	size: TokenSize;
	/** `interactive` styling for the link and onClick branches. */
	interactive: boolean;
	/** `:has(:focus-visible)` outline — only the onClick container branch. */
	focusWithin: boolean;
	isDisabled: boolean;
}

/** The token root: base + size + color, plus interactive/focus/disabled layers. */
export function tokenRootAttrs(
	{ color, size, interactive, focusWithin, isDisabled }: TokenRootOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.base,
		sizeStyles[size],
		colorStyles[color],
		interactive && styles.interactive,
		focusWithin && styles.focusVisibleOutline,
		isDisabled && styles.disabled,
		xstyle
	);
}

/** The label span; hidden variant collapses it to a screen-reader-only box. */
export function tokenLabelAttrs(isLabelHidden: boolean): SvelteStyleAttrs {
	return sx(styles.label, isLabelHidden && styles.labelHidden);
}

/** The invisible `<button>` that carries button semantics in the onClick branch. */
export function tokenInvisibleButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.invisibleButton);
}

/** The trailing remove (X) button. */
export function tokenRemoveButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.removeButton);
}
