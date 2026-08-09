import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import { layerAnimations } from '../layer/layer-animations.stylex.js';
import type { LayerPlacement } from '../layer/use-layer.svelte.js';

/**
 * The `Popover` component's own styles, from Astryx's `Popover/Popover.tsx`.
 *
 * Separate from `use-popover.stylex.ts` because upstream keeps two `stylex.create`
 * calls — one beside the hook (surface, focus-trap wrapper, close button) and one
 * beside the component (anchor wrapper, content padding, gap, width). The oracle
 * diffs each `.stylex.ts` against its upstream file, so the split is preserved.
 */
const styles = stylex.create({
	// Stable anchor wrapper — uses inline-flex to generate a box for CSS
	// anchor positioning without affecting layout. The trigger element (e.g.
	// Button) renders inside this wrapper. Because the wrapper itself is
	// the anchor, pressed-state transforms on the child (e.g. :active scale)
	// don't shift the anchor position and cause popover jitter.
	anchorWrapper: {
		display: 'inline-flex'
	},
	// Visual styles for the inner content container
	contentPadding: {
		paddingBlockStart: spacingVars['--spacing-3'],
		paddingBlockEnd: spacingVars['--spacing-3'],
		paddingInlineStart: spacingVars['--spacing-3'],
		paddingInlineEnd: spacingVars['--spacing-3']
	},
	gap: {
		marginBlockStart: spacingVars['--spacing-1'],
		marginBlockEnd: spacingVars['--spacing-1']
	},
	customWidth: (width: string | number) => ({
		width: typeof width === 'number' ? `${width}px` : width
	}),
	matchTrigger: {
		minWidth: 'anchor-size(width)'
	}
});

/** The inline-flex anchor wrapper for automatic (children) mode. */
export function popoverAnchorWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.anchorWrapper);
}

/**
 * The content-padding `xstyle` layer for the inner content div. Composed with
 * `themeProps('popover')`, `class` and `style` in the component, matching
 * upstream's `mergeProps(themeProps('popover'), stylex.props(styles.contentPadding,
 * xstyle), className, style)`.
 */
export function popoverContentAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.contentPadding, xstyle);
}

/**
 * The layer container's `xstyle` — upstream's per-`render` array
 * `[popoverXstyle, styles.gap, layerAnimations[placement]]`, where
 * `popoverXstyle = width ? styles.customWidth(width) : styles.matchTrigger`.
 */
export function popoverLayerXstyle(
	width: number | string | undefined,
	placement: LayerPlacement
): StyleArg {
	const widthStyle = width ? styles.customWidth(width) : styles.matchTrigger;
	return [widthStyle, styles.gap, layerAnimations[placement]];
}
