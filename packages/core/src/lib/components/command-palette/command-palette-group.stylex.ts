import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/** Ported from Astryx's `CommandPalette/CommandPaletteGroup.tsx` styles. */
const styles = stylex.create({
	group: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		paddingBlock: spacingVars['--spacing-1']
	},
	heading: {
		paddingInline: spacingVars['--spacing-3'],
		paddingBlock: spacingVars['--spacing-1'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		userSelect: 'none'
	}
});

/** The group wrapper. */
export function commandPaletteGroupAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.group, xstyle);
}

/** The `aria-hidden` heading above the group's items. */
export function commandPaletteGroupHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.heading);
}
