import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Ported from Astryx's `CommandPalette/CommandPaletteEmpty.tsx` styles. */
const styles = stylex.create({
	empty: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		paddingBlock: spacingVars['--spacing-8'],
		paddingInline: spacingVars['--spacing-4'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		textAlign: 'center' as const
	}
});

/** The centred empty-state message. */
export function commandPaletteEmptyAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.empty, xstyle);
}
