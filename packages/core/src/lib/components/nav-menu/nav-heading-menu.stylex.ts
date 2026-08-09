import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import type { NavHeadingMenuSize } from './nav-menu-context.svelte.js';

/**
 * Ported from Astryx's `NavMenu/NavHeadingMenu.tsx` styles.
 *
 * Both groups survive as objects in upstream's `dist/`: the single call site
 * merges a dynamic `sizeStyles[size]` index with an `xstyle` spread, so the
 * compiler could not fold it into a literal class string.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	}
});

const sizeStyles = stylex.create({
	sm: {
		minWidth: 160
	},
	md: {
		minWidth: 200
	},
	lg: {
		minWidth: 240
	}
});

/** The `role="menu"` container. */
export function navHeadingMenuAttrs(size: NavHeadingMenuSize, xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, sizeStyles[size], xstyle);
}
