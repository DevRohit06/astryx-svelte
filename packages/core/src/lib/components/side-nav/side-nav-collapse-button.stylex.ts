import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { durationVars, easeVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNavCollapseButton.tsx` styles.
 *
 * Two keys, one call site, one boolean — so upstream's `dist/` carries no style
 * object for this module at all, only the two folded class strings.
 */
const styles = stylex.create({
	chevron: {
		display: 'inline-flex',
		alignItems: 'center',
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronCollapsed: {
		transform: 'rotate(180deg)'
	}
});

/** The chevron, flipped to point the other way once the sidebar is collapsed. */
export function sideNavCollapseChevronAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.chevron, isCollapsed && styles.chevronCollapsed);
}
