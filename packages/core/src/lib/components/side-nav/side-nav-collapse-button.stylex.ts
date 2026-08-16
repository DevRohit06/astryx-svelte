import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { rtlStyles } from '../../utils/rtl.stylex.js';
import { durationVars, easeVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNavCollapseButton.tsx` styles.
 *
 * Both keys ride the chevron `Icon`'s `xstyle` (#4838), so they cross a
 * component boundary and survive in upstream's `dist/` as objects — the module
 * folds no class string at all.
 */
const styles = stylex.create({
	// A flex container, so the glyph is a flex item. Left to blockify as a flex
	// item of Button's icon slot, this span gets a line box and seats the
	// chevron on its text baseline — 2.42px above the button's centre.
	chevronMirror: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	chevron: {
		display: 'inline-flex',
		alignItems: 'center',
		transitionProperty: 'transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
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

/**
 * The mirror `<span>`, which also has to centre the glyph it wraps. One `sx()`
 * call for both styles, matching upstream's single `stylex.props(...)` — the
 * class oracle diffs the emitted list, so splitting it in two would not match.
 */
export function sideNavCollapseChevronMirrorAttrs(): SvelteStyleAttrs {
	return sx(styles.chevronMirror, rtlStyles.mirror);
}
