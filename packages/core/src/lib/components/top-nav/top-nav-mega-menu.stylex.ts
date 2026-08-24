import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { navItemStyles } from '../nav-item/nav-item.stylex.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	shadowVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNavMegaMenu.tsx` styles.
 *
 * The panel is promoted to the top layer by `usePopover` with `hasSurface:
 * false` — the mega menu brings its own surface (`panelContainer`, with a
 * border-top and its own overflow) because the standard popover surface has the
 * wrong radius and shadow for a full-width shelf. The entry animation is
 * therefore applied through `<PopoverLayer>`'s `xstyle` (`panelAnimation`, which
 * targets the layer's `:popover-open` state and `@starting-style`), not through
 * the hook's option `xstyle`, which styles the inner wrapper.
 *
 * `drawer*` is the same collapsible section `TopNavMenu` uses in a `MobileNav`.
 */
const styles = stylex.create({
	trigger: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1-5'],
		paddingInline: spacingVars['--spacing-3'],
		borderRadius: radiusVars['--radius-element'],
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		color: colorVars['--color-text-secondary'],
		textDecoration: 'none',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		transitionProperty: 'background-color, color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: {
			default: 'transparent',
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		border: 'none',
		fontFamily: 'inherit'
	},
	triggerOpen: {
		color: colorVars['--color-text-primary'],
		backgroundColor: colorVars['--color-overlay-hover']
	},
	chevron: {
		display: 'inline-flex',
		alignItems: 'center',
		// The registry chevron is a 1em SVG, so it has always rendered at the
		// trigger's own font size (--text-label-size). Icon's size box would repin
		// it to a fixed rem (the nearest, sm, is 1rem = 16px vs the 14px here), so
		// hold it on the inherited em: same pixels, and still tracks the type
		// scale when a theme changes the label size.
		width: '1em',
		height: '1em',
		fontSize: 'inherit',
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronOpen: {
		transform: 'rotate(180deg)'
	},
	// Animation styles applied to the layer's popover element.
	panelAnimation: {
		opacity: {
			default: 0,
			':popover-open': 1
		},
		transform: {
			default: 'translateY(-4px)',
			':popover-open': 'translateY(0)'
		},
		transitionProperty: 'opacity, transform, overlay, display',
		transitionDuration: durationVars['--duration-medium-min'],
		transitionTimingFunction: easeVars['--ease-standard'],
		transitionBehavior: 'allow-discrete',
		'@starting-style': {
			opacity: 0,
			transform: 'translateY(-4px)'
		}
	},
	// Clamp the anchored layer to the space available below the nav so a tall
	// menu never runs off the bottom of the viewport. The layer is positioned
	// with position-area: self-block-end, so its containing block spans from
	// the nav's block-end to the viewport edge — 100% is exactly that space.
	// The layer is a flex column so panelContainer can shrink and scroll its
	// own content, keeping the surface radius/shadow static at the edges.
	// Internal scroll is a stopgap until the mobile bottom-sheet lands.
	panelViewportFit: {
		display: {
			default: 'none',
			':popover-open': 'flex'
		},
		flexDirection: 'column',
		maxHeight: `calc(100% - ${spacingVars['--spacing-3']})`
	},
	// Visual styles for the panel content container.
	panelContainer: {
		backgroundColor: colorVars['--color-background-popover'],
		borderTopWidth: borderVars['--border-width'],
		borderTopStyle: 'solid',
		borderTopColor: colorVars['--color-border'],
		borderRadius: radiusVars['--radius-container'],
		boxShadow: shadowVars['--shadow-low'],
		overflow: 'hidden',
		// Allow the container to shrink inside the height-clamped layer so its
		// content (panelContent) can scroll rather than overflow the viewport.
		display: 'flex',
		flexDirection: 'column',
		minHeight: 0
	},
	panelContent: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-6'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-3'],
		// Clamp to the viewport (minus a gutter) so the anchored panel never
		// overflows the screen edge on narrow viewports; caps at 960px otherwise.
		maxWidth: `min(960px, calc(100dvw - ${spacingVars['--spacing-4']}))`,
		boxSizing: 'border-box',
		// Scroll internally when the menu is taller than the available space
		// below the nav (paired with panelViewportFit on the layer).
		overflowY: 'auto',
		overscrollBehavior: 'contain'
	},
	menuWrapper: {
		flexGrow: 2,
		flexShrink: 1,
		flexBasis: 300,
		minWidth: 0
	},
	featured: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 200,
		borderRadius: radiusVars['--radius-container'],
		backgroundColor: colorVars['--color-background-muted'],
		overflow: 'hidden',
		display: 'flex',
		flexDirection: 'column'
	},
	// =========================================================================
	// Drawer mode styles (composes navItemStyles.item as base)
	// =========================================================================
	drawerSection: {
		display: 'flex',
		flexDirection: 'column'
	},
	// Header button override — justifyContent and button resets only,
	// base layout/colors come from navItemStyles.item
	drawerHeader: {
		justifyContent: 'space-between',
		border: 'none',
		background: 'none'
	},
	drawerChevron: {
		display: 'inline-flex',
		// Same em pin as styles.chevron above — the drawer header inherits
		// --text-label-size from navItemStyles.item.
		width: '1em',
		height: '1em',
		fontSize: 'inherit',
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	drawerChevronExpanded: {
		transform: 'rotate(180deg)'
	},
	drawerItems: {
		display: 'grid',
		gridTemplateRows: '0fr',
		transitionProperty: 'grid-template-rows',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	drawerItemsExpanded: {
		gridTemplateRows: '1fr'
	},
	drawerItemsInner: {
		overflow: 'hidden',
		minHeight: 0
	},

	// Featured card in drawer — compact version
	drawerFeatured: {
		marginBlockStart: spacingVars['--spacing-2'],
		marginInlineStart: spacingVars['--spacing-6'],
		borderRadius: radiusVars['--radius-container'],
		backgroundColor: colorVars['--color-background-muted'],
		overflow: 'hidden'
	}
});

/** The panel's entry animation, applied to the layer's positioned element. */
export const megaMenuPanelAnimation = styles.panelAnimation;

/**
 * The height clamp applied to the layer alongside the entry animation, so a
 * tall menu scrolls inside the panel rather than off the bottom of the screen.
 */
export const megaMenuPanelViewportFit = styles.panelViewportFit;

/** The desktop trigger button. */
export function megaMenuTriggerAttrs(isOpen: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.trigger, isOpen && styles.triggerOpen, xstyle);
}

/**
 * The trigger's chevron, rotated while open — passed to the `Icon`'s `xstyle`
 * as upstream's `[styles.chevron, isOpen && styles.chevronOpen]` array (#4838),
 * so the wrapper `<span>` that used to hold it is gone.
 */
export function megaMenuChevronStyle(isOpen: boolean): StyleArg {
	return [styles.chevron, isOpen && styles.chevronOpen];
}

/** The `role="menu"` surface — the mega menu supplies its own, not the popover's. */
export function megaMenuPanelContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.panelContainer);
}

/** The padded, wrapping row holding the items grid and the featured card. */
export function megaMenuPanelContentAttrs(): SvelteStyleAttrs {
	return sx(styles.panelContent);
}

/**
 * The items column — grows twice as fast as the featured column. Passed to
 * `<Grid xstyle>` rather than to a wrapper `<div>` (#4775): the flex sizing
 * belongs to the grid itself, so the box that used to carry it is gone.
 */
export const megaMenuWrapperStyle: StyleArg = styles.menuWrapper;

/** The featured column. */
export function megaMenuFeaturedAttrs(): SvelteStyleAttrs {
	return sx(styles.featured);
}

/** The drawer-mode collapsible section wrapper. */
export function megaMenuDrawerSectionAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerSection);
}

/** The drawer-mode disclosure header. */
export function megaMenuDrawerHeaderAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(navItemStyles.item, styles.drawerHeader);
}

/** The drawer header's chevron, rotated while expanded. Also an `Icon` `xstyle` (#4838). */
export function megaMenuDrawerChevronStyle(isExpanded: boolean): StyleArg {
	return [styles.drawerChevron, isExpanded && styles.drawerChevronExpanded];
}

/** The `0fr → 1fr` grid that animates the drawer section open. */
export function megaMenuDrawerItemsAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(styles.drawerItems, isExpanded && styles.drawerItemsExpanded);
}

/** The clipped inner track inside the animating grid. */
export function megaMenuDrawerItemsInnerAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerItemsInner);
}

/** The compact featured card inside the drawer. */
export function megaMenuDrawerFeaturedAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerFeatured);
}
