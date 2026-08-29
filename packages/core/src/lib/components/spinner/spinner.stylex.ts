import * as stylex from '@stylexjs/stylex';
import { colorVars, durationVars, spacingVars } from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerShade = 'default' | 'subtle' | 'onMedia' | 'inherit';

/**
 * Fraction of the ring the moving arc covers. The canvas ring this replaces
 * swept 135deg, not the 270deg its constant's comment claimed.
 */
export const ARC_FRACTION = 0.375;

export const SIZES: Record<SpinnerSize, { diameter: number; border: number }> = {
	sm: { diameter: 10, border: 2 },
	md: { diameter: 14, border: 3 },
	lg: { diameter: 18, border: 3 },
	xl: { diameter: 28, border: 4 }
};

/** `onMedia` keeps the 77/255 its token's `4D` hex suffix used to encode. */
const TRACK_OPACITY = {
	default: 1,
	subtle: 1,
	onMedia: 77 / 255,
	inherit: 0.3
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
// upstream folds the ring into a literal — the silently-partial-case blind spot.
// The case now claims that string, so this cannot drift again.
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
	ring: {
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
	},
	circle: {
		fill: 'none',
		strokeLinecap: 'round'
	}
});

/**
 * The moving arc's colour, one key per shade.
 *
 * These used to be resolved in JS: the canvas ring this replaces read
 * `getComputedStyle` to turn a token into an `rgb()` string a `strokeStyle`
 * would accept, through a `color` / `text-decoration-color` carrier pair. An
 * SVG `stroke` takes the token reference directly, so the cascade resolves both
 * rings — `light-dark()`, `var()` chains and a theme's in-position override
 * included — and nothing has to read a computed style to paint.
 */
const arcStyles = stylex.create({
	default: { stroke: colorVars['--color-accent'] },
	subtle: { stroke: colorVars['--color-text-secondary'] },
	onMedia: { stroke: colorVars['--color-on-dark'] },
	inherit: { stroke: 'currentColor' }
});

/** The full ring behind the arc. `stroke-opacity` carries what a `4D` hex suffix used to. */
const trackStyles = stylex.create({
	default: {
		stroke: colorVars['--color-track'],
		strokeOpacity: TRACK_OPACITY.default
	},
	subtle: {
		stroke: colorVars['--color-track'],
		strokeOpacity: TRACK_OPACITY.subtle
	},
	onMedia: {
		stroke: colorVars['--color-on-dark'],
		strokeOpacity: TRACK_OPACITY.onMedia
	},
	inherit: { stroke: 'currentColor', strokeOpacity: TRACK_OPACITY.inherit }
});

export function spinnerWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}

export function spinnerAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.spinner, xstyle);
}

export function spinnerRingAttrs(): SvelteStyleAttrs {
	return sx(styles.ring);
}

export function spinnerTrackAttrs(shade: SpinnerShade): SvelteStyleAttrs {
	return sx(styles.circle, trackStyles[shade]);
}

export function spinnerArcAttrs(shade: SpinnerShade): SvelteStyleAttrs {
	return sx(styles.circle, arcStyles[shade]);
}
