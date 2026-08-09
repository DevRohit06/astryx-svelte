import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { Elevation } from '../../internal/types.js';
import { radiusVars, shadowVars } from '../../styles/tokens.stylex.js';

/**
 * The group container's styles, from Astryx's `ButtonGroup/ButtonGroup.tsx`.
 *
 * Two keys only — the connected look is entirely the *children's* job. Each
 * `Button` reads the group context and picks its own `groupStyles` branch, so
 * the shared borders and the outer-edges-only radii live in `button.stylex.ts`
 * and are already oracle-checked. This module contributes the flex container
 * and nothing else.
 *
 * Upstream applies both through a single `stylex.props` call with a conditional
 * and an `xstyle` spread, so its compiler left the style object live in
 * `dist/` — hence the oracle checks these by object diff rather than inline.
 */
const styles = stylex.create({
	group: {
		display: 'inline-flex',
		alignItems: 'stretch'
	},
	vertical: {
		flexDirection: 'column'
	}
});

/**
 * Resting elevation, new in 0.1.9.
 *
 * Every raised tier also sets `borderRadius`, which `none` does not: a shadow
 * on a square-cornered group would trace the corners of the *container* rather
 * than the rounded buttons inside it, and read as a misaligned box.
 */
const elevationStyles = stylex.create({
	none: { boxShadow: 'none' },
	low: {
		boxShadow: shadowVars['--shadow-low'],
		borderRadius: radiusVars['--radius-element']
	},
	med: {
		boxShadow: shadowVars['--shadow-med'],
		borderRadius: radiusVars['--radius-element']
	},
	high: {
		boxShadow: shadowVars['--shadow-high'],
		borderRadius: radiusVars['--radius-element']
	}
});

/**
 * The group root's attributes. `vertical` is additive, as upstream's is.
 *
 * `xstyle` is upstream's third argument to the same `stylex.props` call and is
 * accepted here, but nothing passes it: the prop is deferred repo-wide, so this
 * is the one line that wires up when that decision lands.
 */
export function buttonGroupAttrs(
	isVertical: boolean,
	elevation: Elevation,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.group, isVertical && styles.vertical, elevationStyles[elevation], xstyle);
}
