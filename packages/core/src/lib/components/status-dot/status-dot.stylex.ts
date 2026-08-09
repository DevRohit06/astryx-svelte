import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

const pulseKeyframes = stylex.keyframes({
	'0%': { opacity: 1 },
	'50%': { opacity: 0.5 },
	'100%': { opacity: 1 }
});

const styles = stylex.create({
	base: {
		display: 'inline-block',
		borderRadius: '50%',
		flexShrink: 0,
		width: '8px',
		height: '8px'
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

const variants = stylex.create({
	success: {
		backgroundColor: colorVars['--color-success']
	},
	warning: {
		backgroundColor: colorVars['--color-warning']
	},
	error: {
		backgroundColor: colorVars['--color-error']
	},
	accent: {
		backgroundColor: colorVars['--color-accent']
	},
	neutral: {
		backgroundColor: colorVars['--color-icon-secondary']
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
