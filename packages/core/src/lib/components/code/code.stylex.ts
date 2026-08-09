import * as stylex from '@stylexjs/stylex';
import {
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/** Text colour for Code — the primary/secondary/inherit subset of Text's colours. */
export type CodeColor = 'primary' | 'secondary' | 'inherit';

/** Font size for Code. `inherit` adopts the surrounding text size. */
export type CodeSize = 'inherit';

const styles = stylex.create({
	base: {
		fontFamily: typographyVars['--font-family-code'],
		fontSize: typeScaleVars['--text-code-size'],
		lineHeight: 'inherit',
		backgroundColor: colorVars['--color-background-muted'],
		paddingInline: spacingVars['--spacing-1'],
		paddingBlock: spacingVars['--spacing-0'],
		borderRadius: radiusVars['--radius-inner'],
		// Keep a long identifier from blowing out the parent's layout.
		overflowWrap: 'break-word',
		wordBreak: 'break-word'
	}
});

const colorStyles = stylex.create({
	primary: { color: colorVars['--color-text-primary'] },
	secondary: { color: colorVars['--color-text-secondary'] },
	inherit: { color: 'inherit' }
});

const sizeStyles = stylex.create({
	// Take the surrounding text's size and leading, for inline code sitting in
	// text that is not at the base size.
	inherit: {
		fontSize: 'inherit',
		lineHeight: 'inherit'
	}
});

export function codeAttrs(color: CodeColor, size?: CodeSize, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.base, colorStyles[color], size && sizeStyles[size], xstyle);
}
