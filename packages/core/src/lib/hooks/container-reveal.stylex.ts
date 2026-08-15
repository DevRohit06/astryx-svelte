import * as stylex from '@stylexjs/stylex';
import { durationVars, easeVars } from '../styles/tokens.stylex.js';

/**
 * The container style that publishes the reveal state, and the four content
 * style blocks (reveal / conceal, each with a layout-preserved variant) that
 * read it. Ported from Astryx's `hooks/containerReveal.stylex.ts`.
 *
 * HOW THE SCOPING WORKS: the container declares its own reveal state as
 * inherited custom properties on itself, and content reads them. Because a
 * nested container re-declares the same properties on itself, its subtree sees
 * the inner value and never the ancestor's — nesting isolation falls out of the
 * cascade, with one static style block for any number of containers.
 *
 * **This replaced a pool of six pre-declared markers at upstream 0.4.0**, and
 * the reason the pool existed is worth keeping, because it is a real StyleX
 * constraint: `stylex.when.ancestor(':hover', marker)` welds the marker's class
 * into the compiled selector, so a marker and the styles referencing it are
 * inseparable *at compile time* — there is no runtime knob that re-points a
 * compiled block at another marker. One shared marker would leak hover across
 * nested containers, so isolation meant N pre-compiled copies and a free list,
 * which capped the number of concurrent containers (six) and warned past it.
 * Inheritance has no such ceiling: the cascade does the scoping, `isEnabled`
 * can flip after mount, and 570 generated lines become these hundred.
 *
 * Internal to `useContainerReveal` and **barrel-absent**, as upstream keeps it.
 */

const REST_DELAY = '0s, ' + durationVars['--duration-fast'];

export const styles = stylex.create({
	container: {
		'--_reveal-opacity': {
			default: 0,
			':hover': { '@media (hover: hover)': 1 },
			':focus-within': 1,
			'@media (any-pointer: coarse)': 1
		},
		'--_reveal-position': {
			default: 'absolute',
			':hover': { '@media (hover: hover)': 'static' },
			':focus-within': 'static',
			'@media (any-pointer: coarse)': 'static'
		},
		// The position flip is discrete, so it transitions with allow-discrete and
		// a state-conditional delay: 0 on entry (flips into flow immediately, then
		// fades in) and the fade duration on exit (stays in flow until the fade
		// finishes, then snaps out) — without this the exit would snap out of flow
		// at full opacity and flicker.
		'--_reveal-delay': {
			default: REST_DELAY,
			':hover': { '@media (hover: hover)': '0s, 0s' },
			':focus-within': '0s, 0s',
			'@media (any-pointer: coarse)': '0s, 0s'
		},
		// Conceal is a mouse-only visual swap, so it reads hover alone: no
		// :focus-within (a keyboard user must never watch content vanish) and no
		// coarse-pointer branch (it stays visible on touch).
		'--_conceal-opacity': {
			default: 1,
			':hover': { '@media (hover: hover)': 0 }
		}
	},
	// The fallbacks make content spread outside a reveal container fail visible
	// rather than invisible.
	reveal: {
		transitionProperty: 'opacity, position',
		transitionDuration: {
			default: durationVars['--duration-fast'] + ', 0s',
			'@media (prefers-reduced-motion: reduce)': '0s, 0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		transitionBehavior: 'allow-discrete',
		transitionDelay: {
			default: 'var(--_reveal-delay, 0s, 0s)',
			'@media (prefers-reduced-motion: reduce)': '0s, 0s'
		},
		opacity: 'var(--_reveal-opacity, 1)',
		position: 'var(--_reveal-position, static)'
	},
	revealLayoutPreserved: {
		transitionProperty: 'opacity',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		opacity: 'var(--_reveal-opacity, 1)'
	},
	conceal: {
		transitionProperty: 'opacity',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		opacity: 'var(--_conceal-opacity, 1)'
	},
	concealLayoutPreserved: {
		transitionProperty: 'opacity',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		opacity: 'var(--_conceal-opacity, 1)'
	}
});
