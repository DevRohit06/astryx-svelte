import * as stylex from '@stylexjs/stylex';
import { durationVars, spacingVars } from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerShade = 'default' | 'subtle' | 'onMedia' | 'inherit';

/** How much of the circle the active arc covers, as a fraction of 2π. */
export const SPREAD = 0.75;
/** Where the active arc starts, as a fraction of 2π. */
export const START_POINT = 1.5;

export const SIZES: Record<SpinnerSize, { diameter: number; border: number }> = {
	sm: { diameter: 10, border: 2 },
	md: { diameter: 14, border: 3 },
	lg: { diameter: 18, border: 3 },
	xl: { diameter: 28, border: 4 }
};

// `'0%'`/`'100%'`, not `from`/`to`, and the difference is not cosmetic. CSS
// treats the two spellings as equivalent, but **StyleX hashes a
// `stylex.keyframes` body verbatim**, so they compile to two different
// `@keyframes` names and therefore two different `animation-name` classes —
// upstream ships `x1ka1v4i`, `from`/`to` shipped `x1aerksh`. The animation looked
// identical, which is why it survived; what it broke was the port's
// byte-identical-CSS property, and our stylesheet carried a keyframe upstream's
// does not have.
//
// It was invisible because Spinner's oracle case was object-mode only while
// upstream folds `styles.canvas` into a literal — the silently-partial-case
// blind spot. The case now claims that string, so this cannot drift again.
const rotation = stylex.keyframes({
	'0%': { transform: 'rotate(0deg)' },
	'100%': { transform: 'rotate(360deg)' }
});

const styles = stylex.create({
	wrapper: {
		display: 'inline-flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: spacingVars['--spacing-2']
	},
	spinner: {
		display: 'inline-grid',
		placeItems: 'center',
		overflow: 'hidden',
		verticalAlign: 'middle'
	},
	canvas: {
		backfaceVisibility: 'hidden',
		display: 'block',
		willChange: 'transform',
		// Slow the rotation dramatically under reduced motion rather than freezing
		// it — a frozen spinner reads as broken. role="status" plus the "Loading"
		// label still convey the busy state.
		animationDuration: {
			default: durationVars['--duration-slow-min'],
			'@media (prefers-reduced-motion: reduce)': '3s'
		},
		animationIterationCount: 'infinite',
		animationName: rotation,
		animationTimingFunction: 'linear'
	}
});

export function spinnerWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}

export function spinnerAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.spinner, xstyle);
}

export function spinnerCanvasAttrs(): SvelteStyleAttrs {
	return sx(styles.canvas);
}
