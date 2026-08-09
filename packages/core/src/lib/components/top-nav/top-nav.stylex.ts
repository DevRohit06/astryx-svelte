import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNav.tsx` styles.
 *
 * The bar has two layouts. Without `centerContent` it is a flex row
 * (`base` + `baseFlex`) whose end content is pushed over by `marginInlineStart:
 * auto`. With `centerContent` it switches to a three-column
 * `1fr auto 1fr` grid (`base` + `baseGrid`) — the only way to keep the centre
 * slot *actually* centred regardless of how wide the start and end slots are.
 *
 * `drawerExtraContent` is an **empty** style object on both sides. StyleX
 * compiles it to nothing, so the wrapper renders with no class attribute at
 * all; it exists as a named seam for themes rather than as styling. See the
 * component for how the empty class is kept off the DOM.
 */
const styles = stylex.create({
	base: {
		alignItems: 'center',
		width: '100%',
		padding: spacingVars['--spacing-2'],
		boxSizing: 'border-box'
	},
	// Flex layout (default, used when no centerContent)
	baseFlex: {
		display: 'flex'
	},
	// Grid layout (used when centerContent is present)
	baseGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr auto 1fr'
	},
	leftSection: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-4'],
		flex: '1 1 0%',
		minWidth: 0
	},
	heading: {
		display: 'flex',
		alignItems: 'center',
		flexShrink: 0
	},
	startContent: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	centerContent: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-1']
	},
	rightSection: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: spacingVars['--spacing-1']
	},
	endContent: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		flexShrink: 0,
		marginInlineStart: 'auto'
	},
	// Mobile bar mode — simplified top bar with heading + toggle + endContent
	mobileBar: {
		display: 'flex',
		alignItems: 'center',
		width: '100%',
		padding: spacingVars['--spacing-2'],
		boxSizing: 'border-box'
	},
	mobileBarEnd: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		marginInlineStart: 'auto'
	},
	// Drawer mode — vertical list of nav items
	drawerItems: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	},
	drawerDivider: {
		marginBlock: spacingVars['--spacing-2']
	},
	drawerExtraContent: {}
});

/** The `<nav>` root in default mode — flex or grid depending on `centerContent`. */
export function topNavRootAttrs(hasCenterContent: boolean, xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.base, hasCenterContent ? styles.baseGrid : styles.baseFlex, xstyle);
}

/** The `<nav>` root in mobile-bar mode. */
export function topNavMobileBarAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.mobileBar, xstyle);
}

/** The heading + start-content column. */
export function topNavLeftSectionAttrs(): SvelteStyleAttrs {
	return sx(styles.leftSection);
}

/** The heading slot wrapper. */
export function topNavHeadingSlotAttrs(): SvelteStyleAttrs {
	return sx(styles.heading);
}

/** The start-content slot wrapper. */
export function topNavStartContentAttrs(): SvelteStyleAttrs {
	return sx(styles.startContent);
}

/** The centre column of the grid layout. */
export function topNavCenterContentAttrs(): SvelteStyleAttrs {
	return sx(styles.centerContent);
}

/** The end column of the grid layout. */
export function topNavRightSectionAttrs(): SvelteStyleAttrs {
	return sx(styles.rightSection);
}

/** The end-content wrapper of the flex layout, pushed over by an auto margin. */
export function topNavEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.endContent);
}

/** The trailing group in mobile-bar mode — end content plus the toggle. */
export function topNavMobileBarEndAttrs(): SvelteStyleAttrs {
	return sx(styles.mobileBarEnd);
}

/** The vertical stack of nav items inside the drawer. */
export function topNavDrawerItemsAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerItems);
}

/** The spacing around the divider between the TopNav items and SideNav content. */
export function topNavDrawerDividerAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerDivider);
}

/** The wrapper around drawer content supplied by `AppShell`. Emits no class. */
export function topNavDrawerExtraContentAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerExtraContent);
}
