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
	},
	// Clearance from the anchor. Set on BOTH edges of the placement axis, not
	// just the one facing the anchor: `position-try-fallbacks` can flip the
	// layer to the opposite side at paint time, and a single-edge margin then
	// lands on the far side and the gap vanishes (#4803).
	offsetBlock: (offset: string) => ({
		marginBlockStart: offset,
		marginBlockEnd: offset
	}),
	offsetInline: (offset: string) => ({
		marginInlineStart: offset,
		marginInlineEnd: offset
	})
});

/** Upstream's `toCssLength` — a bare number is px. */
function toCssLength(value: number | string): string {
	return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Resolve the popover container's classes.
 *
 * Reproduces both of upstream's `stylex.props` calls: `renderContext` combines
 * `base` with the caller's `xstyle`, `renderFixed` puts `fixed` between them.
 *
 * `offset` composes between the two, as upstream does at `useLayer.tsx:589-596`:
 * anchor mode only (custom mode owns its own insets), and the axis follows the
 * placement — block for `above`/`below`, inline for `start`/`end`. Both are
 * `stylex.create` **function styles**, so the class oracle cannot see them; the
 * CSS oracle is what proves this one.
 */
export function layerAttrs(
	isFixed: boolean,
	xstyle?: StyleArg,
	offset?: number | string,
	positioning: 'anchor' | 'custom' = 'anchor',
	placement: 'above' | 'below' | 'start' | 'end' = 'above'
): SvelteStyleAttrs {
	const offsetStyle =
		positioning === 'anchor' && offset
			? placement === 'above' || placement === 'below'
				? styles.offsetBlock(toCssLength(offset))
				: styles.offsetInline(toCssLength(offset))
			: null;
	return sx(styles.base, isFixed && styles.fixed, offsetStyle, xstyle);
}
