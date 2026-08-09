import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	group: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	vertical: {
		flexDirection: 'column',
		alignItems: 'stretch'
	}
});

/** The group container styles; `vertical` stacks the buttons. `xstyle` is last. */
export function toggleButtonGroupAttrs(
	orientation: 'horizontal' | 'vertical',
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.group, orientation === 'vertical' && styles.vertical, xstyle);
}
