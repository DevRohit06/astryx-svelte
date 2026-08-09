import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * Scoped marker for Overlay ancestor hover selectors.
 * When applied to a container, enables OverlayScrim's
 * CSS-driven showOn="hover" / "focus" / "hover-or-focus" behavior.
 */
export const overlayScope: ReturnType<typeof stylex.defineMarker> = stylex.defineMarker();

/**
 * Container styles that pair with overlayScope.
 * Sets position: relative + overflow: clip so the scrim
 * can use position: absolute + inset: 0 correctly.
 */
export const overlayContainerStyles = stylex.create({
	root: {
		position: 'relative',
		overflow: 'clip'
	}
});

/**
 * The marker plus the container box, as the `class`/`style` pair a container
 * spreads onto itself. Both `Overlay` and `useOverlay` produce exactly this.
 */
export function overlayContainerAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(overlayScope, overlayContainerStyles.root, xstyle);
}
