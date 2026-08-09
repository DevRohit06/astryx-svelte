import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../internal/sx.js';
import { durationVars, easeVars, spacingVars } from '../styles/tokens.stylex.js';

/**
 * Entry animation presets, ported from the `stylex.create` block inside
 * Astryx's `hooks/useEntryAnimation.ts`.
 *
 * The styles are split out from the hook for the reason every `.stylex.ts`
 * module in this port is split out: StyleX Babel-parses any module importing
 * `@stylexjs/stylex`, so the compiled surface stays in files that hold nothing
 * else. `use-entry-animation.ts` next door keeps the mount-timing logic.
 *
 * Each preset is skipped under `prefers-reduced-motion`, and every one uses
 * `animationFillMode: 'backwards'` so the element sits at the `from` frame
 * rather than flashing its final state before the animation starts.
 */

const slideDown = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateY(calc(-1 * ${spacingVars['--spacing-2']}))`
	},
	to: { opacity: 1, transform: 'translateY(0)' }
});

const slideUp = stylex.keyframes({
	from: {
		opacity: 0,
		transform: `translateY(${spacingVars['--spacing-2']})`
	},
	to: { opacity: 1, transform: 'translateY(0)' }
});

const fadeIn = stylex.keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 }
});

const scaleIn = stylex.keyframes({
	from: { opacity: 0, transform: 'scale(0.95)' },
	to: { opacity: 1, transform: 'scale(1)' }
});

const styles = stylex.create({
	slideDown: {
		animationName: {
			default: slideDown,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		animationDuration: durationVars['--duration-fast-max'],
		animationTimingFunction: easeVars['--ease-standard'],
		animationFillMode: 'backwards'
	},
	slideUp: {
		animationName: {
			default: slideUp,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		animationDuration: durationVars['--duration-fast-max'],
		animationTimingFunction: easeVars['--ease-standard'],
		animationFillMode: 'backwards'
	},
	fadeIn: {
		animationName: {
			default: fadeIn,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		animationDuration: durationVars['--duration-fast-max'],
		animationTimingFunction: easeVars['--ease-standard'],
		animationFillMode: 'backwards'
	},
	scaleIn: {
		animationName: {
			default: scaleIn,
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		animationDuration: durationVars['--duration-fast-max'],
		animationTimingFunction: easeVars['--ease-standard'],
		animationFillMode: 'backwards'
	}
});

/** The four entry animations `useEntryAnimation` can apply. */
export type EntryAnimationPreset = keyof typeof styles;

/**
 * The style for one preset, ready to compose into an `sx(...)` call.
 *
 * Unlike the rest of this port's style modules, this returns the style object
 * rather than finished attributes: upstream's hook hands consumers a
 * `StyleXStyles` they merge with their own, and the merge has to stay theirs.
 */
export function entryAnimationStyle(preset: EntryAnimationPreset): StyleArg {
	return styles[preset];
}
