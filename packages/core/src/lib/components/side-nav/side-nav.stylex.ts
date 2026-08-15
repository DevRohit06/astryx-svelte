import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNav.tsx` styles.
 *
 * Five vertical zones: a sticky `header` + `topContent` block, a scrollable
 * middle, and a sticky `footer` + icon bar. The scrollable middle's padding
 * depends on which of the two sticky blocks exist, which is why there are four
 * `scrollable*` variants rather than one — the compiler folds the whole set into
 * an eight-entry lookup keyed on `collapsed`/`hasStickyTop`/`hasStickyBottom`.
 *
 * Two upstream shapes worth knowing before "tidying" any of this:
 *
 * - **`topContent` is an empty style object.** It compiles to nothing, so the
 *   wrapper `<div>` carries no class at all. It is a named seam for themes.
 * - **`footerIcons`/`footerIconsCollapsed` are declared and never applied.** The
 *   `footerIcons` slot renders bare inside `footerRow`. Ported for shape parity;
 *   StyleX drops unreferenced keys, so they emit nothing on either side.
 *
 * A third is gone: `stickyBottom` used to carry a `borderBlockStart` that
 * `stickyBottomCollapsed` tried to clear with the shorthand `'none'`, which
 * StyleX drops — so the collapsed footer kept a divider it meant to remove.
 * 0.2.0 deleted the border outright, and the divergence with it.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		width: 260,
		backgroundColor: 'inherit',
		boxSizing: 'border-box',
		overflow: 'hidden'
	},
	rootCollapsed: {
		width: spacingVars['--spacing-12']
	},
	stickyTop: {
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		position: 'sticky',
		top: 0,
		zIndex: 1,
		backgroundColor: 'inherit',
		paddingBlockStart: spacingVars['--spacing-2'],
		paddingBlockEnd: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		gap: spacingVars['--spacing-2']
	},
	stickyTopCollapsed: {
		alignItems: 'center'
	},
	topContent: {},
	scrollable: {
		flex: 1,
		overflowY: 'auto',
		overflowX: 'hidden',
		paddingInline: spacingVars['--spacing-2']
	},
	scrollableCollapsed: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center'
	},
	scrollableNoTop: {
		paddingBlockStart: spacingVars['--spacing-2']
	},
	scrollableWithTop: {
		paddingBlockStart: spacingVars['--spacing-1']
	},
	scrollableNoBottom: {
		paddingBlockEnd: spacingVars['--spacing-2']
	},
	scrollableWithBottom: {
		paddingBlockEnd: spacingVars['--spacing-1']
	},
	stickyBottom: {
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		marginTop: 'auto',
		position: 'sticky',
		bottom: 0,
		backgroundColor: 'inherit',
		gap: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		paddingBlockStart: spacingVars['--spacing-1'],
		paddingBlockEnd: spacingVars['--spacing-2']
	},
	footerRow: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	footerRowCollapsed: {
		flexDirection: 'column-reverse'
	},
	footerIcons: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	footerIconsCollapsed: {
		flexDirection: 'column',
		alignItems: 'center'
	},
	stickyBottomCollapsed: {
		paddingBlockStart: 0,
		// Centre the footer on the collapsed rail, matching its structural sibling
		// `scrollableCollapsed` — without this, full-width footer content stretches
		// to the rail's width instead of centring (#4852).
		alignItems: 'center'
	},
	// Drawer footer — pushed to bottom of the scrollable content area
	drawerFooter: {
		display: 'flex',
		flexDirection: 'column',
		marginBlockStart: 'auto',
		gap: spacingVars['--spacing-2'],
		paddingBlockStart: spacingVars['--spacing-2']
	},
	drawerFooterIcons: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1']
	},
	// Resizable container — wraps the nav and the drag handle
	resizableContainer: {
		position: 'relative',
		display: 'flex',
		flexShrink: 0,
		height: '100%'
	},
	// Topbar mode — horizontal layout for mobile top bar
	topbar: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 48,
		width: '100%',
		backgroundColor: 'inherit',
		boxSizing: 'border-box',
		overflow: 'hidden'
	},
	topbarIcons: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		marginInlineStart: 'auto'
	}
});

/** The `<nav>` root in default mode. */
export function sideNavRootAttrs(isCollapsed: boolean, xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, isCollapsed && styles.rootCollapsed, xstyle);
}

/** The `<div>` root in topbar mode. */
export function sideNavTopbarAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.topbar, xstyle);
}

/** The trailing icon group in topbar mode. */
export function sideNavTopbarIconsAttrs(): SvelteStyleAttrs {
	return sx(styles.topbarIcons);
}

/** The sticky header + topContent block. */
export function sideNavStickyTopAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.stickyTop, isCollapsed && styles.stickyTopCollapsed);
}

/** The `topContent` wrapper. Emits no class — see the module comment. */
export function sideNavTopContentAttrs(): SvelteStyleAttrs {
	return sx(styles.topContent);
}

/** The scrollable middle, padded according to which sticky blocks exist. */
export function sideNavScrollableAttrs(
	isCollapsed: boolean,
	hasStickyTop: boolean,
	hasStickyBottom: boolean
): SvelteStyleAttrs {
	return sx(
		styles.scrollable,
		isCollapsed && styles.scrollableCollapsed,
		hasStickyTop ? styles.scrollableWithTop : styles.scrollableNoTop,
		hasStickyBottom ? styles.scrollableWithBottom : styles.scrollableNoBottom
	);
}

/** The sticky footer block. */
export function sideNavStickyBottomAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.stickyBottom, isCollapsed && styles.stickyBottomCollapsed);
}

/** The collapse button + footer icons row inside the sticky footer. */
export function sideNavFooterRowAttrs(isCollapsed: boolean): SvelteStyleAttrs {
	return sx(styles.footerRow, isCollapsed && styles.footerRowCollapsed);
}

/** The footer block inside the mobile drawer. */
export function sideNavDrawerFooterAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerFooter);
}

/** The icon row inside the drawer footer. */
export function sideNavDrawerFooterIconsAttrs(): SvelteStyleAttrs {
	return sx(styles.drawerFooterIcons);
}

/** The positioned wrapper that lets the resize handle overlay the nav. */
export function sideNavResizableContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.resizableContainer);
}
