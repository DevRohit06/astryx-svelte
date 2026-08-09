import * as stylex from '@stylexjs/stylex';
import { colorVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

const styles = stylex.create({
	root: {
		borderInlineStartWidth: spacingVars['--spacing-0-5'],
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border-emphasized'],
		paddingInlineStart: spacingVars['--spacing-4'],
		color: colorVars['--color-text-secondary'],
		// The UA stylesheet gives blockquote 1em block margins and 40px inline
		// indents; the rule is zeroed so spacing comes from layout, not the tag.
		marginInlineStart: 0,
		marginInlineEnd: 0,
		marginBlockStart: 0,
		marginBlockEnd: 0
	},
	cite: {
		display: 'block',
		marginBlockStart: spacingVars['--spacing-2'],
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontStyle: 'normal'
	}
});

export function blockquoteAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

export function blockquoteCiteAttrs(): SvelteStyleAttrs {
	return sx(styles.cite);
}
