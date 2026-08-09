import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

const styles = stylex.create({
	// Lays items out in a column; between-item hairlines are drawn by each
	// Collapsible (borderBlockStart, suppressed on :first-child).
	wrapper: {
		display: 'flex',
		flexDirection: 'column'
	}
});

/** The divider-mode wrapper. `xstyle` is threaded last. */
export function collapsibleGroupWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}
