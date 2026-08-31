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
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNavMegaMenuItem.tsx` styles.
 *
 * The item renders itself twice over, picked by `TopNavRenderContext`: a large
 * desktop card with a 40px icon tile (`desktop*`), and a drawer row built on the
 * shared {@link navItemStyles} with a 32px tile (`drawerItem*`).
 */
const styles = stylex.create({
	// Desktop popover item
	desktop: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: spacingVars['--spacing-3'],
		paddingBlock: spacingVars['--spacing-3'],
		paddingInline: spacingVars['--spacing-3'],
		borderRadius: radiusVars['--radius-element'],
		textDecoration: 'none',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		transitionProperty: 'background-color',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		border: 'none',
		color: 'inherit',
		fontFamily: 'inherit',
		textAlign: 'start',
		boxSizing: 'border-box',
		width: '100%'
	},
	desktopIcon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 40,
		height: 40,
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: colorVars['--color-neutral'],
		flexShrink: 0,
		color: colorVars['--color-icon-secondary']
	},
	desktopContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-1'],
		minWidth: 0
	},
	desktopTitle: {
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		color: colorVars['--color-text-primary']
	},
	desktopDescription: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	},
	// Drawer item overrides (base from navItemStyles.item)
	drawerItem: {
		paddingInlineStart: spacingVars['--spacing-6'],
		alignItems: 'flex-start',
		textDecoration: 'none'
	},
	drawerItemIcon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: colorVars['--color-neutral'],
		flexShrink: 0,
		color: colorVars['--color-icon-secondary'],
		marginBlockStart: spacingVars['--spacing-0-5']
	},
	drawerItemContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		minWidth: 0
	},
	drawerItemDescription: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		fontWeight: fontWeightVars['--font-weight-normal']
	}
});

/** The desktop card. */
export function megaMenuItemAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.desktop,
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		interactionOverlayStyles.backgroundColor,
		xstyle
	);
}

/** The 40px icon tile on the desktop card. */
export function megaMenuItemIconAttrs(): SvelteStyleAttrs {
	return sx(styles.desktopIcon);
}

/** The title/description column on the desktop card. */
export function megaMenuItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.desktopContent);
}

/** The desktop card title. */
export function megaMenuItemTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.desktopTitle);
}

/** The desktop card description. */
export function megaMenuItemDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.desktopDescription);
}

/** The drawer row — shared nav item plus the indent and top alignment. */
export function megaMenuItemDrawerAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		navItemStyles.item,
		// Upstream 0.5.1: hover/pressed background moved to the shared module.
		interactionOverlayStyles.backgroundColor,
		styles.drawerItem,
		xstyle
	);
}

/** The 32px icon tile on the drawer row. */
export function megaMenuItemDrawerIconAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerItemIcon);
}

/** The title/description column on the drawer row. */
export function megaMenuItemDrawerContentAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerItemContent);
}

/** The drawer row description. */
export function megaMenuItemDrawerDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerItemDescription);
}
