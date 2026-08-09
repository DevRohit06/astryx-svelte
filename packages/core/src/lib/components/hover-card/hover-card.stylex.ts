import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * The trigger wrapper's styles, from Astryx's `HoverCard/HoverCard.tsx`.
 *
 * Upstream applies all three at single call sites, so its compiler resolved
 * them into literal class strings and left no style object in `dist/`. The
 * oracle checks them through its `inline` mode for that reason.
 *
 * These are *not* `Tooltip`'s three, despite reading the same: Tooltip's
 * `hoverIndication` writes a literal `'2px'` underline offset where HoverCard
 * writes `spacingVars['--spacing-0-5']`. The token happens to resolve to the
 * same 2px, but StyleX hashes the reference and not the resolved value, so the
 * two emit different classes (`xrys4gj` vs `x11b3rvo`). Write the token, not
 * the literal, and do not share the module.
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
		textUnderlineOffset: spacingVars['--spacing-0-5']
	}
});

/** The `display: contents` wrapper used for element children. */
export function hoverCardWrapperContentsAttrs(): SvelteStyleAttrs {
	return sx(styles.wrapperContents);
}

/** The inline `<span>` wrapper used for text-only children. */
export function hoverCardWrapperInlineAttrs(showHoverIndication: boolean): SvelteStyleAttrs {
	return sx(styles.wrapperInline, showHoverIndication && styles.hoverIndication);
}
