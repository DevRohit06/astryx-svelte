import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

const pulseKeyframes = stylex.keyframes({
	'0%': { opacity: 1 },
	'50%': { opacity: 0.5 },
	'100%': { opacity: 1 }
});

/** Fixed dot size in px. A user-supplied icon is drawn into this same field. */
const DOT_SIZE = 8;

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '50%',
		flexShrink: 0,
		width: `${DOT_SIZE}px`,
		height: `${DOT_SIZE}px`
	},
	// A user-supplied icon fills the whole 8px field and paints from
	// `currentColor` (the variant's ink).
	icon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		lineHeight: 0,
		width: `${DOT_SIZE}px`,
		height: `${DOT_SIZE}px`
	},
	pulsing: {
		animationName: pulseKeyframes,
		animationDuration: '2s',
		animationTimingFunction: 'ease-in-out',
		animationIterationCount: 'infinite'
	},
	reducedMotion: {
		'@media (prefers-reduced-motion: reduce)': {
			animationName: 'none'
		}
	}
});

/**
 * Variant styles mapping to theme colour tokens.
 *
 * Each variant sets both the plate colour and an ink colour: a user-supplied
 * `icon` paints from `currentColor`, so plate and ink can never drift out of
 * contrast (same contract as `AvatarStatusDot`). The ink is each plate's
 * dedicated `--color-on-*` pairing (the `Badge` precedent), not the surface
 * colour: on-warning is a fixed dark ink, which keeps an icon legible on the
 * yellow plate (~9.6:1) where a light surface ink lands near 2:1. Neutral has no
 * `--color-on-*` token; its mid-grey plate takes the surface ink.
 */
const variants = stylex.create({
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
	accent: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent']
	},
	neutral: {
		backgroundColor: colorVars['--color-icon-secondary'],
		color: colorVars['--color-background-surface']
	}
});

/**
 * Extensible variant map for StatusDot.
 *
 * Theme packages add their own variants by augmenting this interface:
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface StatusDotVariantMap {
 *     critical: true;
 *   }
 * }
 */
export interface StatusDotVariantMap {
	success: true;
	warning: true;
	error: true;
	accent: true;
	neutral: true;
}

/** StatusDot variant. Extensible via `StatusDotVariantMap`. */
export type StatusDotVariant = keyof StatusDotVariantMap;

export function statusDotAttrs(
	variant: StatusDotVariant,
	isPulsing: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.base,
		variants[variant as keyof typeof variants],
		isPulsing && styles.pulsing,
		isPulsing && styles.reducedMotion,
		xstyle
	);
}

/** The centred icon wrapper, painted in the dot's `currentColor` ink. */
export function statusDotIconAttrs(): SvelteStyleAttrs {
	return sx(styles.icon);
}
