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

/**
 * The dash pattern, per unit of diameter: one arc, then the gap that closes
 * the circle. The circumference is `pi x diameter`, so multiplying the
 * resolved diameter by these two constants gives exactly the lengths the
 * default render has always used, and scales them with a themed diameter.
 */
const PI = 3.141592653589793;
const ARC_DASH = PI * ARC_FRACTION;
const ARC_GAP = PI * (1 - ARC_FRACTION);

export const SIZES: Record<SpinnerSize, { diameter: number; border: number }> = {
	sm: { diameter: 10, border: 2 },
	md: { diameter: 14, border: 3 },
	lg: { diameter: 18, border: 3 },
	xl: { diameter: 28, border: 4 }
};

/**
 * Opacity the track is drawn at, per shade. `77 / 255` is the `4D` the onMedia
 * track used to append to the token's hex — the same composite, but applied as
 * `stroke-opacity` to a color off the cascade, so it no longer depends on the
 * token being hex notation and it applies to a themed color too.
 */
const TRACK_OPACITY: Record<SpinnerShade, number> = {
	default: 1,
	subtle: 1,
	onMedia: 77 / 255,
	inherit: 0.3
};

/**
 * Where the resolved geometry lands: the public var, resolved into a registered
 * `<length>` the `calc()`s below can do arithmetic on. The box and the ring
 * read these; the public vars are declared once, on the element carrying the
 * theme target, by `sizeStyles`.
 */
const RESOLVED_DIAMETER = '--_spinner-ring-diameter';
const RESOLVED_STROKE = '--_spinner-ring-stroke';
const RESOLVED_GEOMETRY_VARS = [RESOLVED_DIAMETER, RESOLVED_STROKE];

/**
 * The composed box size: diameter plus a stroke width on each side.
 *
 * It is deliberately NOT registered, unlike the pair above. The element reads
 * it through an inline `width`/`height` with the size's own default as the
 * `var()` fallback, so a render with no stylesheet — where nothing declares
 * it — still sizes the box the way it always did. A registered property always
 * has a value (its `initial-value`), which would swallow that fallback and
 * collapse the box to zero.
 */
export const BOX_SIZE = '--_spinner-box-size';

/**
 * Register the resolved geometry vars as `<length>`.
 *
 * Both are consumed inside `calc()` — the box adds two stroke widths to a
 * diameter, the circle halves one. Unregistered, a custom property substitutes
 * as text, so whatever a theme wrote lands in the expression verbatim and a
 * bare `0` (a valid length on its own, a `<number>` inside `calc()`) poisons
 * the sum: `calc(28px + 0 * 2)` is invalid at computed-value time and the box
 * loses its size. Registered, the value is already an absolute length by the
 * time the `calc()` sees it, so `0` means `0px` — a zero-width stroke that
 * paints nothing — rather than a bare `0` that invalidates the sum and leaves
 * the box with no size at all. One `stroke-width` drives both circles, so a
 * themed stroke width of `0` hides the arc along with the track; an arc with no
 * track behind it is `--spinner-track-color: transparent`.
 *
 * Only these private vars are registered. The four public ones deliberately are
 * not: a registered property has an `initial-value`, so every element in the
 * document would report a value for it, and a var-reachability audit that finds
 * a var's declaring element by exactly that test would be pointed at `<html>`.
 */
function registerSpinnerVars(): void {
	if (typeof CSS === 'undefined' || typeof CSS.registerProperty !== 'function') {
		return;
	}
	for (const name of RESOLVED_GEOMETRY_VARS) {
		try {
			CSS.registerProperty({
				name,
				syntax: '<length>',
				inherits: true,
				initialValue: '0px'
			});
		} catch {
			// Already registered — a second copy of the package on the page, or a
			// hot-reload re-evaluation. registerProperty throws rather than
			// replacing, and the existing registration is this same one.
		}
	}
}

// Registering an inherited property with an `initial-value` invalidates style
// for the whole document, so this runs when the module is evaluated rather than
// when a spinner mounts. A spinner is the loading indicator: it mounts onto a
// page that is already rendered, with someone already waiting, and the recalc it
// triggers there is paid on the full tree. At import the tree is whatever has
// rendered so far, which for a bundle loaded in the head is nothing.
//
// It is safe at module scope in both directions. The `typeof CSS` guard above
// keeps it out of the server render, and tree-shaking cannot strip it from a
// build that renders a spinner: a bundle that never imports `Spinner` drops this
// module whole — registration and all, which is the outcome you want — while one
// that does import it keeps the module, and a bare call is not something a
// bundler may elide.
registerSpinnerVars();

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
		verticalAlign: 'middle',
		// The public geometry vars, resolved into the registered `<length>` pair
		// the arithmetic below needs. Reading them here rather than in each
		// `calc()` keeps one place where a themed value enters the component, and
		// it is the span that reads them whether the theme target is the span or
		// the wrapper — a custom property inherits either way.
		[RESOLVED_DIAMETER]: 'var(--spinner-diameter)',
		[RESOLVED_STROKE]: 'var(--spinner-stroke-width)',
		// The size of the box, composed here and applied as an inline style at the
		// element, so that the box and the drawn ring come from the same two vars
		// and a themed size moves both together — without the sizing moving from
		// an inline style to a rule, which would hand a caller's `style="width:…"`
		// a precedence over the box that it has never had.
		[BOX_SIZE]: `calc(var(${RESOLVED_DIAMETER}) + var(${RESOLVED_STROKE}) * 2)`
	},
	ring: {
		backfaceVisibility: 'hidden',
		display: 'block',
		willChange: 'transform',
		// The svg keeps the size its `viewBox` describes, so one user unit is one
		// CSS pixel and the lengths below mean what they say. A themed diameter
		// therefore draws a ring wider than the svg's own box — which is fine, and
		// stays centered, because the box it is centered in is the span, sized
		// from the same two vars. Clipping it to the default frame is the one
		// thing that would break that, hence `visible`.
		overflow: 'visible',
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
		strokeLinecap: 'round',
		// The geometry the ring is actually drawn at. `r` and `stroke-width` are
		// CSS properties on an SVG shape, and a CSS declaration outranks the
		// presentation attribute of the same name — so the attributes in the
		// markup stay as the size's default (and as what a server render and a
		// no-CSS render draw), and these take over the moment the cascade has a
		// themed value.
		r: `calc(var(${RESOLVED_DIAMETER}) / 2)`,
		strokeWidth: `var(${RESOLVED_STROKE})`
	},
	// The two ring colors ride `stroke` directly, read off the public vars the
	// shade declares. The paint comes from the cascade, so every notation a theme
	// can write — `var()`, `color-mix()`, and the `currentColor` the inherit
	// shade is built on — resolves where it is used, and a color changed after
	// mount repaints instead of going stale.
	//
	// The dash pattern is composed from the resolved diameter the same way, so a
	// themed ring keeps the same fraction of arc rather than the same absolute
	// dash. `pathLength` would be the shorter route to that, but it rescales the
	// pattern against the path length the UA measures on its own approximation of
	// the circle — 87.398 against the 87.965 of pi x 28 — which shortens the
	// default arc by 0.64% and moves the cap by half a pixel. Composing the
	// lengths keeps the default byte-identical to what it drew before.
	arc: {
		stroke: 'var(--spinner-color)',
		strokeDasharray: `calc(var(${RESOLVED_DIAMETER}) * ${ARC_DASH}) calc(var(${RESOLVED_DIAMETER}) * ${ARC_GAP})`
	},
	track: { stroke: 'var(--spinner-track-color)' }
});

// What each named `size` and `shade` resolve to. Both groups DECLARE the four
// public vars, on the element that carries the `spinner` theme target, and
// everything downstream reads them — so a theme's `@layer astryx-theme` rule
// against `.astryx-spinner.xl` overrides the default the same way it does for
// `--tree-list-indent` or `--button-focus-offset`, e.g.
// spinner: { 'size:xl': { '--spinner-diameter': '40px' } }.
//
// Declaring is only safe because the compiled StyleX CSS moved inside
// `@layer astryx-base`. Before that, StyleX emitted custom-property
// declarations at priority 0 and therefore OUTSIDE its layers, and an unlayered
// declaration beats every layer — so a StyleX-declared `--spinner-diameter: 10px`
// shadowed the theme's own rule no matter how specific the theme got. The
// earlier revision worked around it by never declaring the public var and
// reading it with the default as a `var()` fallback; that is no longer
// necessary, and the fallback shape has a cost of its own — with nothing
// declaring the var, a reachability audit cannot find an element to check, so a
// documented var reads as unreachable.
const sizeStyles = stylex.create({
	sm: {
		'--spinner-diameter': `${SIZES.sm.diameter}px`,
		'--spinner-stroke-width': `${SIZES.sm.border}px`
	},
	md: {
		'--spinner-diameter': `${SIZES.md.diameter}px`,
		'--spinner-stroke-width': `${SIZES.md.border}px`
	},
	lg: {
		'--spinner-diameter': `${SIZES.lg.diameter}px`,
		'--spinner-stroke-width': `${SIZES.lg.border}px`
	},
	xl: {
		'--spinner-diameter': `${SIZES.xl.diameter}px`,
		'--spinner-stroke-width': `${SIZES.xl.border}px`
	}
});

/**
 * The two ring colours, one key per shade.
 *
 * These used to be resolved in JS: the canvas ring this replaces read
 * `getComputedStyle` to turn a token into an `rgb()` string a `strokeStyle`
 * would accept, through a `color` / `text-decoration-color` carrier pair. An
 * SVG `stroke` takes the token reference directly, so the cascade resolves both
 * rings — `light-dark()`, `var()` chains and a theme's in-position override
 * included — and nothing has to read a computed style to paint.
 */
const shadeStyles = stylex.create({
	default: {
		'--spinner-color': colorVars['--color-accent'],
		'--spinner-track-color': colorVars['--color-track']
	},
	subtle: {
		'--spinner-color': colorVars['--color-text-secondary'],
		'--spinner-track-color': colorVars['--color-track']
	},
	onMedia: {
		'--spinner-color': colorVars['--color-on-dark'],
		'--spinner-track-color': colorVars['--color-on-dark']
	},
	inherit: {
		'--spinner-color': 'currentColor',
		'--spinner-track-color': 'currentColor'
	}
});

// The track's alpha is a property, not a color: it composites over whatever
// color the shade or the theme supplies. `77 / 255` is the `4D` the onMedia
// token's hex used to carry.
const trackOpacityStyles = stylex.create({
	default: { strokeOpacity: TRACK_OPACITY.default },
	subtle: { strokeOpacity: TRACK_OPACITY.subtle },
	onMedia: { strokeOpacity: TRACK_OPACITY.onMedia },
	inherit: { strokeOpacity: TRACK_OPACITY.inherit }
});

/**
 * The labelled wrapper. It carries the theme target when a label renders, so the
 * four public vars are declared here and the span below inherits them.
 */
export function spinnerWrapperAttrs(
	size: SpinnerSize,
	shade: SpinnerShade,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.wrapper, sizeStyles[size], shadeStyles[shade], xstyle);
}

/**
 * The status span.
 *
 * The defaults are declared on whichever element carries the theme target, and
 * only there: when a label moves the target to the wrapper, this span must
 * inherit the wrapper's value rather than declare its own, which would shadow a
 * theme's override with the default it is trying to replace.
 */
export function spinnerAttrs(
	size: SpinnerSize,
	shade: SpinnerShade,
	hasLabel: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.spinner,
		!hasLabel && sizeStyles[size],
		!hasLabel && shadeStyles[shade],
		!hasLabel && xstyle
	);
}

export function spinnerRingAttrs(): SvelteStyleAttrs {
	return sx(styles.ring);
}

export function spinnerTrackAttrs(shade: SpinnerShade): SvelteStyleAttrs {
	return sx(styles.circle, styles.track, trackOpacityStyles[shade]);
}

export function spinnerArcAttrs(): SvelteStyleAttrs {
	return sx(styles.circle, styles.arc);
}
