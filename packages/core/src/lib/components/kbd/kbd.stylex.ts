import * as stylex from '@stylexjs/stylex';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

const styles = stylex.create({
	wrapper: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		flexShrink: 0
	},
	kbd: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: spacingVars['--spacing-5'],
		height: spacingVars['--spacing-5'],
		paddingInline: spacingVars['--spacing-1'],
		borderRadius: radiusVars['--radius-inner'],
		backgroundColor: colorVars['--color-neutral'],
		// A single bottom edge, reading as a keycap without a full border.
		borderBottomWidth: '2px',
		borderBottomStyle: 'solid',
		borderBottomColor: colorVars['--color-border-emphasized'],
		color: colorVars['--color-text-secondary'],
		// Body family, not code: the glyphs are symbols, not source.
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		userSelect: 'none'
	}
});

export function kbdWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}

export function kbdKeyAttrs(): SvelteStyleAttrs {
	return sx(styles.kbd);
}
