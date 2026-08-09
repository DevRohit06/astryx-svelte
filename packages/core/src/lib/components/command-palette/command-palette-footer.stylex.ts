import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Ported from Astryx's `CommandPalette/CommandPaletteFooter.tsx` styles. */
const styles = stylex.create({
	footer: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-4'],
		paddingInline: spacingVars['--spacing-4'],
		paddingBlock: spacingVars['--spacing-2'],
		flexShrink: 0,
		// Inherit font so custom children match hint text treatment
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	hint: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	}
});

/** The footer bar. */
export function commandPaletteFooterAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.footer, xstyle);
}

/** One key-hint cluster inside the default footer. */
export function commandPaletteFooterHintAttrs(): SvelteStyleAttrs {
	return sx(styles.hint);
}
