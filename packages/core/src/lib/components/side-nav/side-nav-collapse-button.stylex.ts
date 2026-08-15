import * as stylex from '@stylexjs/stylex';
import { durationVars, easeVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNavCollapseButton.tsx` styles.
 *
 * Both keys ride the chevron `Icon`'s `xstyle` (#4838), so they cross a
 * component boundary and survive in upstream's `dist/` as objects — the module
 * folds no class string at all.
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

/**
 * The chevron, flipped to point the other way once the sidebar is collapsed.
 * Passed to the `Icon`'s `xstyle`. The RTL mirror deliberately stays on the
 * outer `<span>` — see the comment at the call site.
 */
export const sideNavCollapseChevronStyle = styles.chevron;
export const sideNavCollapseChevronCollapsedStyle = styles.chevronCollapsed;
