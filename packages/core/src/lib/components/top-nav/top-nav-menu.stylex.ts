import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { navItemStyles } from '../nav-item/nav-item.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNavMenu.tsx` styles.
 *
 * Two groups, because there are two shapes: `styles` is the desktop trigger and
 * its popover of rich rows, `drawerStyles` is the collapsible section the same
 * component becomes inside a `MobileNav`.
 *
 * The drawer expand/collapse is a `grid-template-rows: 0fr → 1fr` transition
 * over an `overflow: hidden` inner div — the height-agnostic disclosure
 * `Collapsible` and `TopNavMegaMenu` also use, and the reason `itemsInner`
 * exists as a separate element rather than a padding on `items`.
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
		cursor: 'pointer',
		transitionProperty: 'background-color, color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: {
			default: 'transparent',
			':hover': {
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
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronOpen: {
		transform: 'rotate(180deg)'
	},
	menuContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-1'],
		minWidth: 280,
		padding: spacingVars['--spacing-1']
	},
	menuOffset: {
		marginBlockStart: spacingVars['--spacing-1']
	},
	menuItem: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-3'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-3'],
		borderRadius: radiusVars['--radius-element'],
		textDecoration: 'none',
		cursor: 'pointer',
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		backgroundColor: {
			default: 'transparent',
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		border: 'none'
	},
	menuItemIcon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 40,
		height: 40,
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: colorVars['--color-neutral'],
		flexShrink: 0
	},
	menuItemContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-1'],
		minWidth: 0
	},
	menuItemTitle: {
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-primary']
	},
	menuItemDescription: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	}
});

const drawerStyles = stylex.create({
	section: {
		display: 'flex',
		flexDirection: 'column'
	},
	header: {
		justifyContent: 'space-between',
		border: 'none',
		background: 'none'
	},
	chevron: {
		display: 'inline-flex',
		transitionProperty: 'transform',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	chevronExpanded: {
		transform: 'rotate(180deg)'
	},
	items: {
		display: 'grid',
		gridTemplateRows: '0fr',
		transitionProperty: 'grid-template-rows',
		transitionDuration: durationVars['--duration-medium'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	itemsExpanded: {
		gridTemplateRows: '1fr'
	},
	itemsInner: {
		overflow: 'hidden',
		minHeight: 0
	},
	item: {
		paddingInlineStart: spacingVars['--spacing-6'],
		textDecoration: 'none'
	},
	itemIcon: {
		flexShrink: 0,
		width: 20,
		height: 20
	},
	itemText: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	},
	itemDescription: {
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary'],
		fontWeight: fontWeightVars['--font-weight-normal']
	}
});

/**
 * The gap between the trigger and its popover. Passed to `usePopover`'s
 * `xstyle` option *and* to `<PopoverLayer>`'s, as upstream passes it to both the
 * hook options and the `render` call.
 */
export const topNavMenuOffset = styles.menuOffset;

/** The desktop trigger button. */
export function topNavMenuTriggerAttrs(isOpen: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.trigger, isOpen && styles.triggerOpen, xstyle);
}

/** The trigger's chevron, rotated while open. */
export function topNavMenuChevronAttrs(isOpen: boolean): SvelteStyleAttrs {
	return sx(styles.chevron, isOpen && styles.chevronOpen);
}

/** The `role="menu"` container inside the popover. */
export function topNavMenuContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.menuContainer);
}

/** A `role="menuitem"` row in the popover. */
export function topNavMenuItemAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.menuItem);
}

/** The 40px icon tile on a popover row. */
export function topNavMenuItemIconAttrs(): SvelteStyleAttrs {
	return sx(styles.menuItemIcon);
}

/** The title/description column on a popover row. */
export function topNavMenuItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.menuItemContent);
}

/** A popover row's title. */
export function topNavMenuItemTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.menuItemTitle);
}

/** A popover row's description. */
export function topNavMenuItemDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.menuItemDescription);
}

/** The drawer-mode collapsible section wrapper. */
export function topNavMenuDrawerSectionAttrs(): SvelteStyleAttrs {
	return sx(drawerStyles.section);
}

/** The drawer-mode disclosure header — a nav item that also justifies apart. */
export function topNavMenuDrawerHeaderAttrs(): SvelteStyleAttrs {
	return sx(navItemStyles.item, drawerStyles.header);
}

/** The drawer header's chevron, rotated while expanded. */
export function topNavMenuDrawerChevronAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(drawerStyles.chevron, isExpanded && drawerStyles.chevronExpanded);
}

/** The `0fr → 1fr` grid that animates the drawer section open. */
export function topNavMenuDrawerItemsAttrs(isExpanded: boolean): SvelteStyleAttrs {
	return sx(drawerStyles.items, isExpanded && drawerStyles.itemsExpanded);
}

/** The clipped inner track inside the animating grid. */
export function topNavMenuDrawerItemsInnerAttrs(): SvelteStyleAttrs {
	return sx(drawerStyles.itemsInner);
}

/** A drawer-mode row — the shared nav item plus this menu's indent. */
export function topNavMenuDrawerItemAttrs(): SvelteStyleAttrs {
	return sx(navItemStyles.item, drawerStyles.item);
}

/** The 20px icon slot on a drawer row. */
export function topNavMenuDrawerItemIconAttrs(): SvelteStyleAttrs {
	return sx(drawerStyles.itemIcon);
}

/** The title/description column on a drawer row. */
export function topNavMenuDrawerItemTextAttrs(): SvelteStyleAttrs {
	return sx(drawerStyles.itemText);
}

/** A drawer row's description. */
export function topNavMenuDrawerItemDescriptionAttrs(): SvelteStyleAttrs {
	return sx(drawerStyles.itemDescription);
}
