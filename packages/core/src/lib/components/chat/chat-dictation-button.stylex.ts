import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, radiusVars } from '../../styles/tokens.stylex.js';

/**
 * The bars' idle colour. Upstream interpolates `colorVars['--color-accent']`
 * into a `var()` fallback inside the component; a `.svelte` file may not import
 * StyleX at all, so the string is built here — `defineVars` compiles to a
 * runtime object of `var(--hash)` strings, which is exactly what the template
 * needs.
 */
export const chatDictationBarColor = `var(--color-accent, ${colorVars['--color-accent']})`;

/** Ported from the `styles` block in Astryx's `Chat/ChatDictationButton.tsx`. */
const styles = stylex.create({
	wrapper: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	barsContainer: {
		position: 'absolute',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		pointerEvents: 'none',
		zIndex: 1
	},
	bar: {
		borderRadius: radiusVars['--radius-full'],
		transformOrigin: 'center',
		transitionProperty: 'transform, background-color',
		transitionDuration: {
			default: '0.06s',
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: 'ease-out'
	}
});

export function chatDictationButtonWrapperAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.wrapper, xstyle);
}

export function chatDictationBarsContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.barsContainer);
}

export function chatDictationBarAttrs(): SvelteStyleAttrs {
	return sx(styles.bar);
}
