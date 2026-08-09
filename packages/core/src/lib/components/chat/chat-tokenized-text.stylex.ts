import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/** Ported from the `styles` block in Astryx's `Chat/ChatTokenizedText.tsx`. */
const styles = stylex.create({
	root: {
		display: 'inline'
	}
});

export function chatTokenizedTextAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}
