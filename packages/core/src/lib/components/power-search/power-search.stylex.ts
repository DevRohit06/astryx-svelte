import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `PowerSearch.tsx` styles — three groups, and they take
 * **two different oracle modes in the same file**:
 *
 * - `tokenValueStyles.value` and `resultCountStyles.text` reach `stylex.props`
 *   at fixed call sites, so upstream's compiler folded each into a literal class
 *   string (22 sites and 1 respectively): `inline` mode. The extractor keys an
 *   inline string by its content, so one case entry claims all 22.
 * - `popoverLayerStyles.layer` is passed as an **`xstyle`**, never to
 *   `stylex.props`, so it survives in `dist/` as an object: `object` mode. It is
 *   therefore exported raw rather than through `sx()`.
 *
 * `tokenValueStyles` is declared identically in `PowerSearchToken.tsx` and is
 * kept as a second declaration there — see that module's note.
 */
const tokenValueStyles = stylex.create({
	value: {
		fontWeight: fontWeightVars['--font-weight-bold']
	}
});

export const popoverLayerStyles = stylex.create({
	layer: {
		width: 'anchor-size(width)',
		// Floor for comfortable editing, yielding when the available inline
		// space cannot fit it, so the editor stays on-screen at narrow viewport
		// widths (#4761). Percentages resolve against the position-area region
		// (anchor start edge to viewport end), falling back to the viewport
		// where area sizing is not honored.
		minWidth: `min(400px, calc(100% - ${spacingVars['--spacing-4']}))`
	}
});

/**
 * The clearance upstream passes as `popover.render(…, {offset})` at 0.4.x
 * (#4951). It used to be a `marginTop` baked into `layer` above, which a
 * `position-try-fallbacks` flip would strand on the wrong edge. Exported from
 * here rather than read in the markup, so the token import stays out of the
 * `.svelte` file.
 */
export const powerSearchPopoverOffset = spacingVars['--spacing-1'];

const resultCountStyles = stylex.create({
	text: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		whiteSpace: 'nowrap'
	}
});

/** The `<span>` carrying a token's formatted value. */
export function powerSearchTokenValueAttrs(): SvelteStyleAttrs {
	return sx(tokenValueStyles.value);
}

/** The `<span>` carrying the result count in the tokenizer's end slot. */
export function powerSearchResultCountAttrs(): SvelteStyleAttrs {
	return sx(resultCountStyles.text);
}
