import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, radiusVars, shadowVars, spacingVars } from '../../styles/tokens.stylex.js';
import type { LayerPlacement } from '../layer/use-layer.svelte.js';

/**
 * The hover card surface's own styles, from Astryx's `HoverCard/useHoverCard.tsx`.
 *
 * They sit in a `.stylex.ts` module rather than beside the hook for the same
 * reason `Tooltip`'s and `Layer`'s do: the StyleX bundler plugin Babel-parses
 * anything that imports `@stylexjs/stylex`, and `use-hover-card.svelte.ts` has
 * to stay a plain rune module.
 */
const styles = stylex.create({
	// Base container styles passed to useLayer
	container: {
		backgroundColor: colorVars['--color-background-surface'],
		'--_hovercard-radius': radiusVars['--radius-container'],
		borderRadius: 'var(--_hovercard-radius)',
		boxShadow: shadowVars['--shadow-med']
	},
	// Position-based margin styles
	marginBlock: {
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-1'],
		marginInlineStart: 0,
		marginInlineEnd: 0
	},
	marginInline: {
		marginBlockStart: 0,
		marginBlockEnd: 0,
		marginInlineStart: spacingVars['--spacing-1'],
		marginInlineEnd: spacingVars['--spacing-1']
	},
	// Content wrapper for padding and mouse events.
	// `display: block` keeps the wrapper a block box even though it renders as a
	// `span` (the layer uses inline-safe phrasing markup so it is valid inside a
	// paragraph and produces identical server/client markup).
	content: {
		display: 'block',
		paddingBlockStart: spacingVars['--spacing-3'],
		paddingBlockEnd: spacingVars['--spacing-3'],
		paddingInlineStart: spacingVars['--spacing-3'],
		paddingInlineEnd: spacingVars['--spacing-3']
	}
});

/**
 * The popover container's `xstyle` — upstream's `popoverXstyle`, the memoised
 * `[styles.container, marginStyle]` pair.
 *
 * The margin gap is chosen from the *hook's* placement, not the one a given
 * render passes: upstream computes `marginStyle` once from the option and only
 * `layerAnimations` follows the per-render placement. That is transcribed
 * rather than tidied, so a `<HoverCardLayer placement>` override changes the
 * animation direction and not the gap, exactly as it does upstream — the same
 * quirk `use-tooltip.stylex.ts` already carries.
 */
export function hoverCardSurfaceXstyle(placement: LayerPlacement): StyleArg {
	const marginStyle =
		placement === 'above' || placement === 'below' ? styles.marginBlock : styles.marginInline;
	return [styles.container, marginStyle];
}

/**
 * The inner padding wrapper `renderHoverCard` puts around its children. It is
 * also the element that carries the hover/focus handlers and the
 * `.astryx-hover-card` theme class — unlike `Tooltip`, which themes the layer
 * container itself.
 */
export function hoverCardContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}
