import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars } from '../../styles/tokens.stylex.js';

/**
 * The trigger wrapper's styles, from Astryx's `Tooltip/Tooltip.tsx`.
 *
 * Upstream applies all three at single call sites, so its compiler resolved
 * them into literal class strings and left no style object in `dist/`. The
 * oracle checks them through its `inline` mode for that reason.
 */
const styles = stylex.create({
	wrapperContents: {
		display: 'contents'
	},
	wrapperInline: {
		display: 'inline'
	},
	hoverIndication: {
		textDecorationLine: 'underline',
		textDecorationStyle: 'dashed',
		textDecorationColor: colorVars['--color-border-emphasized'],
		textUnderlineOffset: '2px'
	}
});

/** The `display: contents` wrapper used for element children. */
export function tooltipWrapperContentsAttrs(): SvelteStyleAttrs {
	return sx(styles.wrapperContents);
}

/** The inline `<span>` wrapper used for text-only children. */
export function tooltipWrapperInlineAttrs(showHoverIndication: boolean): SvelteStyleAttrs {
	return sx(styles.wrapperInline, showHoverIndication && styles.hoverIndication);
}
