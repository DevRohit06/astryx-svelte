import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../internal/sx.js';
import { colorVars, typographyVars } from '../styles/tokens.stylex.js';
import type { ThemeMode } from './types.js';

/**
 * `<Theme>`'s wrapper.
 *
 * `display: contents` keeps the element out of layout — like `<MediaTheme>`'s,
 * it exists to carry an attribute (`data-astryx-theme`) and a `color-scheme`,
 * both of which inherit past a contents box. `color-scheme` is the load-bearing
 * declaration: every `light-dark()` token in the theme resolves against it, so a
 * `mode` that never reached the DOM would leave the whole palette on the OS
 * preference.
 */
const wrapperStyles = stylex.create({
	base: {
		display: 'contents',
		color: colorVars['--color-text-primary'],
		fontFamily: typographyVars['--font-family-body']
	},
	light: {
		colorScheme: 'light'
	},
	dark: {
		colorScheme: 'dark'
	},
	system: {
		colorScheme: 'light dark'
	}
});

export function themeWrapperAttrs(mode: ThemeMode): SvelteStyleAttrs {
	const colorSchemeStyle =
		mode === 'dark'
			? wrapperStyles.dark
			: mode === 'light'
				? wrapperStyles.light
				: wrapperStyles.system;

	return sx(wrapperStyles.base, colorSchemeStyle);
}
