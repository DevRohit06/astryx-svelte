import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/** Ported from Astryx's `CommandPalette/CommandPaletteList.tsx` styles. */
const styles = stylex.create({
	list: {
		overflowY: 'auto',
		maxHeight: '100%',
		padding: spacingVars['--spacing-1'],
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	}
});

/** The scrollable `role="listbox"` container. */
export function commandPaletteListAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.list, xstyle);
}
