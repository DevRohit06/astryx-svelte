import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, durationVars, radiusVars } from '../../styles/tokens.stylex.js';

/**
 * Delay before the pulse starts, so content that loads quickly never flashes an
 * animation.
 */
const DELAY_TIME = 1000;

/** Stagger between sequential skeletons, which reads as a wave. */
const STAGGER_TIME = 100;

const skeletonFade = stylex.keyframes({
	'0%': { opacity: 0.25 },
	'100%': { opacity: 1 }
});

const styles = stylex.create({
	root: {
		backgroundColor: {
			default: colorVars['--color-skeleton'],
			'@media (prefers-contrast: more)': `color-mix(in srgb, ${colorVars['--color-skeleton']}, ${colorVars['--color-text-primary']} 30%)`,
			// Forced colors (Windows High Contrast) strips painted backgrounds,
			// which would make the placeholder invisible. GrayText is a system
			// color, so it survives forcing and keeps the placeholder visible
			// (WCAG 1.4.11). Listed after prefers-contrast so it wins when both
			// media features are active.
			'@media (forced-colors: active)': 'GrayText'
		},
		opacity: {
			default: 0.25,
			// The resting 0.25 opacity would render GrayText nearly invisible on
			// Canvas; full opacity keeps the static placeholder perceivable (the
			// fade animation still pulses when motion is allowed).
			'@media (forced-colors: active)': 1
		}
	},
	animate: {
		animationDirection: 'alternate',
		animationDuration: durationVars['--duration-medium-max'],
		animationIterationCount: 'infinite',
		// No pulse under reduced motion; the static placeholder still reads as
		// loading.
		animationName: {
			default: skeletonFade,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		animationTimingFunction: 'steps(10, end)'
	}
});

const radiusStyles = stylex.create({
	none: {
		borderRadius: 0
	},
	0: {
		borderRadius: radiusVars['--radius-none']
	},
	1: {
		borderRadius: radiusVars['--radius-inner']
	},
	2: {
		borderRadius: radiusVars['--radius-element']
	},
	3: {
		borderRadius: radiusVars['--radius-container']
	},
	4: {
		borderRadius: radiusVars['--radius-container']
	},
	rounded: {
		borderRadius: radiusVars['--radius-full']
	}
});

const dynamicStyles = stylex.create({
	animationDelay: (index: number) => ({
		animationDelay: `${DELAY_TIME + STAGGER_TIME * index}ms`
	}),
	dimensions: (width: number | string, height: number | string) => ({
		width: typeof width === 'number' ? `${width}px` : width,
		height: typeof height === 'number' ? `${height}px` : height
	})
});

/** Corner radius, on the radius token scale. */
export type SkeletonRadius = keyof typeof radiusStyles;

export interface SkeletonAttrsOptions {
	width: number | string;
	height: number | string;
	radius: SkeletonRadius;
	index: number;
}

export function skeletonAttrs(
	{ width, height, radius, index }: SkeletonAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.root,
		styles.animate,
		radiusStyles[radius],
		dynamicStyles.dimensions(width, height),
		dynamicStyles.animationDelay(index),
		xstyle
	);
}
