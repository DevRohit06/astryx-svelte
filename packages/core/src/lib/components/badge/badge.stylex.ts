import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-1'],
		height: spacingVars['--spacing-5'],
		paddingBlock: 0,
		paddingInline: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-full'],
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		whiteSpace: 'nowrap'
	}
});

/**
 * Semantic variants take a solid fill; the colour-named ones take a tinted
 * background with matching text, so a wall of them stays readable.
 */
const variants = stylex.create({
	// Semantic
	neutral: {
		backgroundColor: colorVars['--color-neutral'],
		color: colorVars['--color-text-primary']
	},
	info: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent']
	},
	success: {
		backgroundColor: colorVars['--color-success'],
		color: colorVars['--color-on-success']
	},
	warning: {
		backgroundColor: colorVars['--color-warning'],
		color: colorVars['--color-on-warning']
	},
	error: {
		backgroundColor: colorVars['--color-error'],
		color: colorVars['--color-on-error']
	},
	// Non-semantic
	blue: {
		backgroundColor: colorVars['--color-background-blue'],
		color: colorVars['--color-text-blue']
	},
	cyan: {
		backgroundColor: colorVars['--color-background-cyan'],
		color: colorVars['--color-text-cyan']
	},
	green: {
		backgroundColor: colorVars['--color-background-green'],
		color: colorVars['--color-text-green']
	},
	orange: {
		backgroundColor: colorVars['--color-background-orange'],
		color: colorVars['--color-text-orange']
	},
	pink: {
		backgroundColor: colorVars['--color-background-pink'],
		color: colorVars['--color-text-pink']
	},
	purple: {
		backgroundColor: colorVars['--color-background-purple'],
		color: colorVars['--color-text-purple']
	},
	red: {
		backgroundColor: colorVars['--color-background-red'],
		color: colorVars['--color-text-red']
	},
	teal: {
		backgroundColor: colorVars['--color-background-teal'],
		color: colorVars['--color-text-teal']
	},
	yellow: {
		backgroundColor: colorVars['--color-background-yellow'],
		color: colorVars['--color-text-yellow']
	}
});

/**
 * Extensible variant map for Badge.
 *
 * Theme packages add their own variants by augmenting this interface:
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface BadgeVariantMap {
 *     premium: true;
 *   }
 * }
 */
export interface BadgeVariantMap {
	neutral: true;
	info: true;
	success: true;
	warning: true;
	error: true;
	blue: true;
	cyan: true;
	green: true;
	orange: true;
	pink: true;
	purple: true;
	red: true;
	teal: true;
	yellow: true;
}

/** Badge variant. Extensible via `BadgeVariantMap`. */
export type BadgeVariant = keyof BadgeVariantMap;

export function badgeAttrs(variant: BadgeVariant, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.base, variants[variant as keyof typeof variants], xstyle);
}
