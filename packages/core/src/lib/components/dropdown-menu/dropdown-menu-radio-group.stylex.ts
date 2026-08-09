import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/** Ported from Astryx's `DropdownMenu/DropdownMenuRadioGroup.tsx` styles. */
const styles = stylex.create({
	// Match the menu's own inter-item rhythm (2px) so grouped radio items keep
	// the same gap as ungrouped items instead of sitting flush against each
	// other inside the role="group" wrapper.
	group: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	}
});

/** The `role="group"` wrapper. */
export function radioGroupAttrs(): SvelteStyleAttrs {
	return sx(styles.group);
}
