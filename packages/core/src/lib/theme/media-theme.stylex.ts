import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../internal/sx.js';
import { colorVars } from '../styles/tokens.stylex.js';

/**
 * `<MediaTheme>`'s wrapper.
 *
 * `display: contents` keeps the element out of layout entirely — it exists only
 * to carry `data-astryx-media`, and the tokens that attribute switches reach the
 * children through custom-property inheritance, which `display: contents` does
 * not interrupt. The one declaration it makes for itself is `color`, so text
 * inherits the surface's primary rather than the page's.
 */
const styles = stylex.create({
	root: {
		display: 'contents',
		color: colorVars['--color-text-primary']
	}
});

export function mediaThemeAttrs(): SvelteStyleAttrs {
	return sx(styles.root);
}
