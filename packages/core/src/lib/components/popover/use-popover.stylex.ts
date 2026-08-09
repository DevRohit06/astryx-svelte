import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { rtlStyles } from '../../utils/rtl.stylex.js';
import { colorVars, radiusVars, shadowVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * The popover surface's own styles, from Astryx's `Popover/usePopover.tsx`.
 *
 * They sit in a `.stylex.ts` module rather than beside the hook for the same
 * reason `HoverCard`'s and `Layer`'s do: the StyleX bundler plugin Babel-parses
 * anything that imports `@stylexjs/stylex`, and `use-popover.svelte.ts` has to
 * stay a plain rune module.
 */
const styles = stylex.create({
	// Default popover surface — background, radius, shadow.
	// Applied automatically unless hasSurface is false.
	// Consumers that need a raw positioned layer should use useLayer instead.
	surface: {
		backgroundColor: colorVars['--color-background-popover'],
		borderRadius: radiusVars['--radius-container'],
		boxShadow: shadowVars['--shadow-low']
	},
	// Focus trap container
	contentWrapper: {
		position: 'relative'
	},
	// Hidden close button wrapper - sr-only until focused, then positioned below
	// popover. Inline-axis centering (+ the translateY(100%) that drops it below
	// the surface) comes from rtlStyles.centerInline('100%') at the call site —
	// it centers correctly in both LTR and RTL.
	closeButtonWrapper: {
		position: 'absolute',
		bottom: 0,
		zIndex: 1,
		// sr-only by default
		width: {
			default: 1,
			':focus-within': 'auto'
		},
		height: {
			default: 1,
			':focus-within': 'auto'
		},
		overflow: {
			default: 'hidden',
			':focus-within': 'visible'
		},
		clipPath: {
			default: 'inset(50%)',
			':focus-within': 'none'
		},
		pointerEvents: {
			default: 'none',
			':focus-within': 'auto'
		},
		paddingBlockStart: {
			default: 0,
			':focus-within': spacingVars['--spacing-1']
		}
	}
});

/**
 * The focus-trap content wrapper `render` builds — upstream's
 * `stylex.props(styles.contentWrapper, hasSurface && styles.surface, xstyle)`.
 *
 * `contentWrapper` is always applied; the default surface is added unless
 * `hasSurface` is false; the hook's `xstyle` option merges last so it can
 * override background/radius/etc.
 */
export function popoverContentWrapperAttrs(
	hasSurface: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(styles.contentWrapper, hasSurface && styles.surface, xstyle);
}

/** The hidden close-button wrapper `render` appends after the content. */
export function popoverCloseButtonWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.closeButtonWrapper, rtlStyles.centerInline('100%'));
}
