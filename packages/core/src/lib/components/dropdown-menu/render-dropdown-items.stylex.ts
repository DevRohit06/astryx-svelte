import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
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
	}
	// The `divider` key that stood here moved to `DropdownMenuDivider` at
	// upstream 0.4.0 — the data path renders that component now, so the two menu
	// modes cannot draw different rules.
});

/** The `aria-hidden` section heading row. */
export function sectionHeadingAttrs(): SvelteStyleAttrs {
	return sx(styles.sectionHeading);
}
