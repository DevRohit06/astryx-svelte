import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * Shape of the ratio box.
 * - `rectangle`: a plain rectangular container (default).
 * - `ellipse`: clips the container to an ellipse — a circle at `ratio={1}`, an
 *   oval otherwise.
 */
export type AspectRatioShape = 'rectangle' | 'ellipse';

/**
 * How the child is sized inside the ratio box.
 * - `cover`: child fills the box; media is cropped (`object-fit: cover`).
 * - `contain`: child fills the box; media is letterboxed (`object-fit: contain`).
 * - `center`: child keeps its natural size, centred in the box.
 */
export type AspectRatioFit = 'cover' | 'contain' | 'center';

const styles = stylex.create({
	container: {
		position: 'relative',
		width: '100%',
		overflow: 'clip',
		minHeight: 0,
		flexShrink: 0
	},
	ellipse: {
		// 50% on both axes follows the box dimensions, so the clip respects the
		// ratio: a circle at 1:1 and an oval at non-square ratios.
		borderRadius: '50%'
	},
	child: {
		position: 'absolute',
		top: 0,
		insetInlineStart: 0,
		width: '100%',
		height: '100%'
	},
	// fit="center" centres the child at its natural size from the wrapper — no
	// styles on the child itself. The `cover`/`contain` child sizing can't live
	// here (StyleX has no descendant selectors); it ships as baseline rules in
	// `styles/base.css`, keyed on the `data-astryx-aspect-ratio-override`
	// attribute the wrapper carries.
	childCenter: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	}
});

// The ratio compiles to a CSS variable + a class-level declaration
// (`aspect-ratio: var(--x)`) instead of a raw inline style, so consumer
// overrides — `xstyle` rules, including ones inside @media/@container
// queries — can still win. A raw inline `aspect-ratio` would beat any class
// (same rationale as Grid's dynamic track values). Non-StyleX consumers
// don't need a dedicated hook: the compiled declaration sits in the
// `astryx-base` cascade layer, so any unlayered consumer rule wins
// regardless of specificity.
const dynamicStyles = stylex.create({
	ratio: (ratio: number) => ({
		aspectRatio: ratio
	})
});

export function aspectRatioContainerAttrs(
	shape: AspectRatioShape,
	ratio: number,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.container,
		dynamicStyles.ratio(ratio),
		shape === 'ellipse' && styles.ellipse,
		xstyle
	);
}

export function aspectRatioChildAttrs(fit: AspectRatioFit | undefined): SvelteStyleAttrs {
	return sx(styles.child, fit === 'center' && styles.childCenter);
}
