import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import type { LayerPlacement } from '../layer/use-layer.svelte.js';

/**
 * The tooltip surface's own styles, from Astryx's `Tooltip/useTooltip.tsx`.
 *
 * They sit in a `.stylex.ts` module rather than beside the hook for the same
 * reason `Layer`'s do: the StyleX bundler plugin Babel-parses anything that
 * imports `@stylexjs/stylex`, and `use-tooltip.svelte.ts` has to stay a plain
 * rune module.
 */
const styles = stylex.create({
	// Base container styles - inverted colors for high contrast
	container: {
		// Inverted color palette: dark background, light text
		backgroundColor: colorVars['--color-text-primary'],
		color: colorVars['--color-background-surface'],
		borderRadius: radiusVars['--radius-container'],
		// Typography
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading']
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
	// Content wrapper for padding
	content: {
		paddingBlockStart: spacingVars['--spacing-1'],
		paddingBlockEnd: spacingVars['--spacing-1'],
		paddingInlineStart: spacingVars['--spacing-2'],
		paddingInlineEnd: spacingVars['--spacing-2'],
		maxWidth: 300,
		wordBreak: 'break-word'
	}
});

/**
 * The popover container's `xstyle` — upstream's `popoverXstyle`, the memoised
 * `[styles.container, marginStyle]` pair.
 *
 * The margin gap is chosen from the *hook's* placement, not the one a given
 * render passes: upstream computes `marginStyle` once from the option and only
 * `layerAnimations` follows the per-render placement. That is transcribed
 * rather than tidied, so a `<TooltipLayer placement>` override changes the
 * animation direction and not the gap, exactly as it does upstream.
 */
export function tooltipSurfaceXstyle(placement: LayerPlacement): StyleArg {
	const marginStyle =
		placement === 'above' || placement === 'below' ? styles.marginBlock : styles.marginInline;
	return [styles.container, marginStyle];
}

/** The inner padding wrapper `renderTooltip` puts around its children. */
export function tooltipContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}
