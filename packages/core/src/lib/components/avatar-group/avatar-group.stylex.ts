import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * Styles for AvatarGroup, ported from Astryx's `src/AvatarGroup/AvatarGroup.tsx`.
 *
 * The group itself is barely styled — the overlap is drawn by each child, which
 * reads the offset from context. That is what lets the API stay compositional:
 * the group never introspects its children.
 */

/** Fraction of an avatar's width that the next one covers. */
const OVERLAP_RATIO = 0.25;

/** Pixels of overlap for a given avatar size. */
export function resolveOverlap(numericSize: number): number {
	return Math.round(numericSize * OVERLAP_RATIO);
}

const styles = stylex.create({
	root: {
		display: 'inline-flex',
		alignItems: 'center'
	}
});

export function avatarGroupAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}
