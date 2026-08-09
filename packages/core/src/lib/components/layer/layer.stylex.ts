import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { typographyVars } from '../../styles/tokens.stylex.js';

/**
 * The layer container's own styles, from Astryx's `Layer/useLayer.tsx`.
 *
 * They live in a `.stylex.ts` module rather than beside the hook because the
 * StyleX bundler plugin Babel-parses anything importing `@stylexjs/stylex`, and
 * `use-layer.svelte.ts` has to stay a plain rune module. Upstream keeps them in
 * `useLayer.tsx` for the same reason in reverse — a `.tsx` file is already JSX.
 */
const styles = stylex.create({
	// Base reset for all layers
	base: {
		marginBlockStart: 0,
		marginBlockEnd: 0,
		marginInlineStart: 0,
		marginInlineEnd: 0,
		paddingBlockStart: 0,
		paddingBlockEnd: 0,
		paddingInlineStart: 0,
		paddingInlineEnd: 0,
		borderWidth: 0,
		borderStyle: 'none',
		overflow: 'visible',
		fontFamily: typographyVars['--font-family-body'],
		// Override browser default [popover] background (canvas color)
		backgroundColor: 'transparent'
	},
	// Fixed positioning mode
	fixed: {
		position: 'fixed'
	}
});

/**
 * Resolve the popover container's classes.
 *
 * Reproduces both of upstream's `stylex.props` calls: `renderContext` combines
 * `base` with the caller's `xstyle`, `renderFixed` puts `fixed` between them.
 */
export function layerAttrs(isFixed: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.base, isFixed && styles.fixed, xstyle);
}
