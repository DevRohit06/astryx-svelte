import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, sizeVars } from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '50%',
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent'],
		flexShrink: 0,
		width: sizeVars['--size-element-md'],
		height: sizeVars['--size-element-md']
	}
});

export function navIconAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.base, xstyle);
}
