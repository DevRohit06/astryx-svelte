import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { borderVars, colorVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TabList/TabList.tsx` styles.
 *
 * Pure object mode: the `<nav>`'s single call site merges two conditionals with
 * an `xstyle` spread, so all three keys survive in upstream's `dist/`.
 */
const styles = stylex.create({
	nav: {
		display: 'flex',
		alignItems: 'stretch',
		gap: spacingVars['--spacing-0-5'],
		maxWidth: '100%',
		minWidth: 0
	},
	fill: {
		width: '100%'
	},
	divider: {
		borderBottomWidth: borderVars['--border-width'],
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border'],
		// Reserve a gap between the tabs and the divider rail so the hover pill
		// (which fills the tab height) no longer touches the underline, and an
		// adjacent same-size Button aligns to the tabs rather than butting the
		// rail. The tabs keep their element-size height; this padding grows the
		// strip. `--_tab-indicator-bottom` drops the selected indicator through
		// the reserved gap (+ the 1px border) so it still sits on the rail.
		paddingBlockEnd: spacingVars['--spacing-1'],
		'--_tab-indicator-bottom': `calc(-1 * (${spacingVars['--spacing-1']} + ${borderVars['--border-width']}))`
	}
});

/** The `<nav>` that holds the tab strip. */
export function tabListNavAttrs(
	isFill: boolean,
	hasDivider: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.nav, isFill && styles.fill, hasDivider && styles.divider, xstyle);
}
