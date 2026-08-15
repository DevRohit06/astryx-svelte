import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `AppShell/AppShell.tsx` styles.
 *
 * Two things here are worth understanding before changing anything.
 *
 * **The `elevated` variant is two elements, not one.** A wash-coloured shell
 * with a surface-coloured content area rounded at its top-inline-start corner
 * cannot be one box, because the content must scroll under the rounded corner
 * rather than clipping it. So `elevatedContentWrapper` positions a
 * `pointer-events: none` `elevatedBackdrop` behind the real content, and that
 * backdrop is what carries the radius.
 *
 * **`skipLink` is styled entirely by `:focus` pairs.** It is a real, focusable
 * `<a>` that is 1px and clipped until focused, at which point every one of those
 * properties flips — which is why the declarations come in `{default, ':focus'}`
 * pairs rather than a `.visually-hidden` class plus an override.
 *
 * Upstream also declares a `hidden: {display: 'none'}` key with **zero call
 * sites**; StyleX eliminates it entirely, so it is omitted here rather than
 * carried as dead code the oracle would leave uncompared either way.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		position: 'relative'
	},
	variantWash: {
		backgroundColor: colorVars['--color-background-body']
	},
	variantSurface: {
		backgroundColor: colorVars['--color-background-surface']
	},
	variantSection: {
		backgroundColor: colorVars['--color-background-surface']
	},
	variantElevated: {
		backgroundColor: colorVars['--color-background-body']
	},
	rootFill: {
		height: '100dvh'
	},
	rootAuto: {
		minHeight: '100dvh'
	},
	skipLink: {
		// Visually hidden by default, visible on focus (keyboard navigation)
		position: {
			default: 'absolute',
			':focus': 'fixed'
		},
		width: {
			default: '1px',
			':focus': 'auto'
		},
		height: {
			default: '1px',
			':focus': 'auto'
		},
		paddingBlock: {
			default: 0,
			':focus': spacingVars['--spacing-2']
		},
		paddingInline: {
			default: 0,
			':focus': spacingVars['--spacing-4']
		},
		margin: {
			default: '-1px',
			':focus': 0
		},
		overflow: {
			default: 'hidden',
			':focus': 'visible'
		},
		clipPath: {
			default: 'inset(50%)',
			':focus': 'none'
		},
		whiteSpace: {
			default: 'nowrap',
			':focus': 'normal'
		},
		borderWidth: 0,
		// Focus styles
		top: {
			default: 0,
			':focus': spacingVars['--spacing-2']
		},
		insetInlineStart: {
			default: 0,
			':focus': spacingVars['--spacing-2']
		},
		backgroundColor: colorVars['--color-background-surface'],
		color: colorVars['--color-text-accent'],
		zIndex: 9999,
		textDecoration: 'none',
		fontWeight: fontWeightVars['--font-weight-semibold'],
		fontSize: typeScaleVars['--text-body-size']
	},
	// Programmatic focus target for the skip link. The main container is only
	// focusable via tabindex="-1" (never tabbable), so a focus ring around the
	// entire content area would be noise rather than guidance — suppress it.
	mainFocusTarget: {
		outline: {
			default: null,
			':focus': 'none'
		}
	},

	elevatedBackdrop: {
		position: 'absolute',
		inset: 0,
		backgroundColor: colorVars['--color-background-surface'],
		borderStartStartRadius: radiusVars['--radius-page'],
		pointerEvents: 'none'
	},
	elevatedContentWrapper: {
		position: 'relative',
		display: 'flex',
		flex: 1,
		minHeight: 0,
		height: '100%'
	},
	contentBgSurface: {
		backgroundColor: colorVars['--color-background-surface']
	},
	contentBgWash: {
		backgroundColor: colorVars['--color-background-body']
	},
	contentBgTransparent: {
		backgroundColor: 'transparent',
		isolation: 'isolate'
	},
	navAreaWash: {
		backgroundColor: colorVars['--color-background-body']
	},
	navAreaSurface: {
		backgroundColor: colorVars['--color-background-surface']
	},
	banner: {
		flexShrink: 0
	},
	autoMobileTopBar: {
		display: 'flex',
		alignItems: 'center',
		height: spacingVars['--spacing-12'],
		paddingInline: spacingVars['--spacing-2']
	},
	// Sticky header for auto height mode
	headerSticky: {
		position: 'sticky',
		top: 0,
		zIndex: 1
	},
	// Sticky sideNav for auto height mode — sticks within the wrapper.
	// This div replaces the panel as the direct flex child of the middle
	// (horizontal) container, so it needs the same flex properties that
	// LayoutPanel applies: flexShrink: 0 prevents the flex container
	// from collapsing the sidenav, and overflow: clip matches the panel's
	// default so content doesn't bleed horizontally.
	sideNavSticky: {
		flexShrink: 0,
		overflow: 'clip',
		position: 'sticky',
		top: 'var(--_app-shell-header-height, 0px)',
		height: 'calc(100dvh - var(--_app-shell-header-height, 0px))',
		// Ensure children (LayoutPanel → SideNav) fill the sticky container
		display: 'flex',
		flexDirection: 'column'
	},
	// Panel fill for auto mode — panel fills the sticky container vertically
	// and scrolls independently since the page (not the panel) owns the scroll
	panelAutoFill: {
		flex: 1,
		overflow: 'auto'
	}
});

/** The variant background applied to nav areas (header, side panel). */
export function appShellNavAreaStyle(variant: string): StyleArg {
	if (variant === 'wash' || variant === 'elevated') {
		return styles.navAreaWash;
	}
	if (variant === 'surface') {
		return styles.navAreaSurface;
	}
	return undefined;
}

/**
 * The background of the main content area. `elevated` goes transparent — and
 * only when a top nav *and* an inline side nav are both present — so the rounded
 * `elevatedBackdrop` behind it shows through.
 */
export function appShellContentAreaStyle(
	variant: string,
	hasTopNav: boolean,
	hasSideNav: boolean,
	isBelowBreakpoint: boolean
): StyleArg {
	if (variant === 'wash') {
		return styles.contentBgWash;
	}
	if (variant === 'elevated' && hasTopNav && hasSideNav && !isBelowBreakpoint) {
		return styles.contentBgTransparent;
	}
	if (variant === 'surface' || variant === 'elevated') {
		return styles.contentBgSurface;
	}
	return undefined;
}

/** The shell root. */
export function appShellRootAttrs(
	variant: string,
	isFill: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.root,
		variant === 'wash'
			? styles.variantWash
			: variant === 'surface'
				? styles.variantSurface
				: variant === 'section'
					? styles.variantSection
					: styles.variantElevated,
		isFill ? styles.rootFill : styles.rootAuto,
		xstyle
	);
}

/**
 * The outline suppressor for the main content area — the skip link focuses it
 * programmatically, so it is focusable without ever being tabbable. Composed
 * after the background style, matching upstream's `xstyle` array order.
 */
export const appShellMainFocusTarget = styles.mainFocusTarget;

/**
 * The skip-to-content link — 1px and clipped until focused, and ringed by the
 * shared focus outline. It is the first thing a keyboard user reaches, so the
 * ring is the only signal that anything happened; before it was shared, the link
 * drew the UA default.
 */
export function appShellSkipLinkAttrs(): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(styles.skipLink);
}

/** The banner slot wrapper, tinted with the nav-area background. */
export function appShellBannerAttrs(navAreaStyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.banner, navAreaStyle);
}

/** The header wrapper — tinted, and sticky in `auto` height mode. */
export function appShellHeaderAttrs(navAreaStyle: StyleArg, isAuto: boolean): SvelteStyleAttrs {
	return sx(navAreaStyle, isAuto && styles.headerSticky);
}

/** The sticky wrapper the side panel sits in under `auto` height mode. */
export function appShellSideNavStickyAttrs(): SvelteStyleAttrs {
	return sx(styles.sideNavSticky);
}

/** The `xstyle` array handed to the side `LayoutPanel`. */
export function appShellSideNavPanelStyle(
	navAreaStyle: StyleArg,
	stickyBgStyle: StyleArg,
	isAuto: boolean
): StyleArg {
	return [navAreaStyle, isAuto && stickyBgStyle, isAuto && styles.panelAutoFill];
}

/** The relative wrapper holding the rounded backdrop and the real content. */
export function appShellElevatedContentWrapperAttrs(): SvelteStyleAttrs {
	return sx(styles.elevatedContentWrapper);
}

/** The rounded, inert surface painted behind the content in `elevated`. */
export function appShellElevatedBackdropAttrs(): SvelteStyleAttrs {
	return sx(styles.elevatedBackdrop);
}

/** The sidenav-only mobile top bar `AppShell` synthesises when there is no TopNav. */
export function appShellAutoMobileTopBarAttrs(): SvelteStyleAttrs {
	return sx(styles.autoMobileTopBar);
}

/** The fallback opaque background for sticky elements in `auto` mode. */
export const appShellStickyFallbackBg = styles.navAreaSurface;
