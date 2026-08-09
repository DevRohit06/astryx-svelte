import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';

const styles = stylex.create({
	// Canonical "visually hidden" clip block. Uses `clip: rect(...)` rather than
	// clip-path for the widest assistive-tech and browser support. `inset` pins
	// the 1px box to the top-left so a positioned ancestor cannot reveal it, and
	// pointer/selection are disabled so the hidden node can't catch clicks or be
	// text-selected.
	visuallyHidden: {
		position: 'absolute',
		width: 1,
		height: 1,
		margin: -1,
		padding: 0,
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		borderStyle: 'none',
		insetBlockStart: 0,
		insetInlineStart: 0,
		pointerEvents: 'none',
		userSelect: 'none'
	}
});

export function visuallyHiddenAttrs(): SvelteStyleAttrs {
	return sx(styles.visuallyHidden);
}
