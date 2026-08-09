import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	spacingVars,
	typographyVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	sectionHeading: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		userSelect: 'none'
	},
	divider: {
		marginBlock: spacingVars['--spacing-1']
	}
});

/** The `aria-hidden` section heading row. */
export function sectionHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.sectionHeading);
}

/** Passed to `Divider` as `xstyle`. */
export const dividerXstyle: StyleArg = styles.divider;
