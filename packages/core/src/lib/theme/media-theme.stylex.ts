import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../internal/sx.js';
import { colorVars } from '../styles/tokens.stylex.js';

/**
 * `<MediaTheme>`'s wrapper.
 *
 * `display: contents` keeps the element out of layout entirely — it exists only
 * to carry `data-astryx-media`, and the tokens that attribute switches reach the
 * children through custom-property inheritance, which `display: contents` does
 * not interrupt.
 *
 * The one declaration it makes for itself is `color`, so text inherits the
 * surface's primary rather than the page's — and that is the whole reason the
 * two keys are split. `mode="off"` renders the same element with no media
 * attribute, so it must not install the surface's colour either; `root` alone is
 * what it applies.
 */
const styles = stylex.create({
	root: {
		display: 'contents'
	},
	active: {
		color: colorVars['--color-text-primary']
	}
});

/**
 * @param isActive - whether a media context is in force. `false` for the
 *   resolved `"off"` mode, which keeps the element and drops the colour.
 */
export function mediaThemeAttrs(isActive: boolean): SvelteStyleAttrs {
	return sx(styles.root, isActive && styles.active);
}
