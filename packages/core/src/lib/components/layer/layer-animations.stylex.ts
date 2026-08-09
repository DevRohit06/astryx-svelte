import * as stylex from '@stylexjs/stylex';
import { durationVars, easeVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Shared entry animations for layer-based components, ported from Astryx's
 * `Layer/layerAnimations.stylex.ts`.
 *
 * Opt-in: a component passes one through `<Layer xstyle={…}>`, which is where
 * upstream passes it through `layer.render(…, {xstyle})`.
 *
 * @example
 * ```svelte
 * <!-- Direction-aware (for components that know placement): -->
 * <Layer {layer} {placement} xstyle={layerAnimations[placement]}>…</Layer>
 *
 * <!-- Fixed direction: -->
 * <Layer {layer} xstyle={layerAnimations.below}>…</Layer>
 * ```
 */

const enterBelow = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateY(calc(-1 * ${spacingVars['--spacing-2']})) scale(0.95)`
	},
	to: { opacity: 1, transform: 'translateY(0) scale(1)' }
});

const enterAbove = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateY(${spacingVars['--spacing-2']}) scale(0.95)`
	},
	to: { opacity: 1, transform: 'translateY(0) scale(1)' }
});

const enterEnd = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateX(calc(-1 * ${spacingVars['--spacing-2']})) scale(0.95)`
	},
	to: { opacity: 1, transform: 'translateX(0) scale(1)' }
});

const enterStart = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateX(${spacingVars['--spacing-2']}) scale(0.95)`
	},
	to: { opacity: 1, transform: 'translateX(0) scale(1)' }
});

// RTL: the horizontal entrance nudge is a physical translateX, so it must
// mirror under RTL — a layer on the inline-end/start side must slide in from
// the correct physical side following the reading flow. Only the horizontal
// (translateX) keyframes need mirroring; the vertical enterAbove/enterBelow
// (translateY) entrances are direction-neutral and are left as-is.
const enterEndRtl = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateX(${spacingVars['--spacing-2']}) scale(0.95)`
	},
	to: { opacity: 1, transform: 'translateX(0) scale(1)' }
});

const enterStartRtl = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateX(calc(-1 * ${spacingVars['--spacing-2']})) scale(0.95)`
	},
	to: { opacity: 1, transform: 'translateX(0) scale(1)' }
});

const animationBase = {
	animationDuration: durationVars['--duration-fast-max'],
	animationTimingFunction: easeVars['--ease-standard'],
	animationFillMode: 'backwards' as const
};

/**
 * Keyed by `LayerPlacement` for lookup as `layerAnimations[placement]`.
 *
 * Each entry disables its keyframe animation under
 * `prefers-reduced-motion: reduce` so the layer appears instantly instead of
 * translating/scaling in (infra-6).
 */
export const layerAnimations = stylex.create({
	below: {
		animationName: {
			default: enterBelow,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		...animationBase
	},
	above: {
		animationName: {
			default: enterAbove,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		...animationBase
	},
	end: {
		animationName: {
			default: enterEnd,
			':is([dir="rtl"] *)': enterEndRtl,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		...animationBase
	},
	start: {
		animationName: {
			default: enterStart,
			':is([dir="rtl"] *)': enterStartRtl,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		...animationBase
	}
});
