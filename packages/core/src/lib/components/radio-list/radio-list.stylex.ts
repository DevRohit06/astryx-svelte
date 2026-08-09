import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `RadioList/RadioList.tsx` styles — just the group's flex
 * direction and gap; the radios' chrome lives in `radio-list-item.stylex.ts`.
 */
const styles = stylex.create({
	radiogroup: {
		display: 'flex'
	},
	vertical: {
		flexDirection: 'column',
		gap: spacingVars['--spacing-2']
	},
	horizontal: {
		flexDirection: 'row',
		gap: spacingVars['--spacing-5']
	}
});

/** The `role="radiogroup"` container's layout. */
export function radiogroupAttrs(orientation: 'vertical' | 'horizontal'): SvelteStyleAttrs {
	return sx(styles.radiogroup, orientation === 'vertical' ? styles.vertical : styles.horizontal);
}
