import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `BottomSheet/BottomSheetEdgeTint.tsx` styles.
 *
 * The one style the strip needs. Upstream declares it in the component file;
 * StyleX may not be imported from a `.svelte` module here, so it lives beside
 * the component instead.
 */

/**
 * WebKit ignores the declared `background-color` of a sampled box thinner than
 * 10px and falls back to sampling painted pixels, which a masked element has
 * none of. 12px clears that floor with room to spare and is still far below the
 * ~40px of chrome it colours.
 */
const SAMPLE_HEIGHT_PX = 12;

const styles = stylex.create({
	tint: {
		position: 'fixed',
		insetInline: 0,
		insetBlockEnd: 0,
		height: `${SAMPLE_HEIGHT_PX}px`,
		backgroundColor: colorVars['--color-background-surface'],
		// Above the panel so the edge hit test lands here, and never in the way of
		// a touch that was meant for the sheet.
		zIndex: 2,
		pointerEvents: 'none',
		// Invisible to the user. WebKit's sampler checks `visibility` and `opacity`
		// — either would disqualify the element — but not `mask`, so this hides the
		// strip while leaving the colour readable. Without it the strip would show
		// as a hairline under the panel as the sheet slides out.
		maskImage: 'linear-gradient(transparent, transparent)',
		WebkitMaskImage: 'linear-gradient(transparent, transparent)'
	}
});

/** The sampled strip. */
export function bottomSheetEdgeTintAttrs(): SvelteStyleAttrs {
	return sx(styles.tint);
}
