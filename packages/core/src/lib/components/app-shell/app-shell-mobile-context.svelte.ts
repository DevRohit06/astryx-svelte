import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `AppShell/AppShellMobileContext.tsx`.
 *
 * The mobile-nav state `AppShell` publishes to everything beneath it:
 * `MobileNavToggle` reads it to open/close the drawer and to decide whether to
 * render at all, `MobileNav` falls back to it when the caller passes no
 * `isOpen`/`onOpenChange`, `SideNavItem`/`TopNavItem`/`TopNavMenu`/
 * `TopNavMegaMenuItem` read `closeMobileNav` so activating a nav row inside the
 * drawer dismisses it, and `SideNavCollapseButton` reads `isMobile` to hide
 * itself (collapse has no meaning inside a drawer).
 *
 * Two things follow from Svelte reading context once, at init:
 *
 * **The context stores a getter**, per this port's convention, so a consumer
 * tracks `isMobile`/`isMobileNavOpen` changing rather than freezing at mount —
 * which is exactly what upstream's `useMemo`'d value plus a re-render buys.
 *
 * **The default is a value, not `null`.** Upstream's `createContext` takes a
 * `defaultValue`, so every one of those consumers works *outside* an `AppShell`
 * — a standalone `<MobileNav isOpen … />` is a documented usage, and
 * `MobileNavToggle` renders nothing rather than throwing. `useAppShellMobile()`
 * therefore falls back to the same frozen default rather than returning `null`.
 */
export interface AppShellMobileContextValue {
	/** Whether the viewport is below the mobile breakpoint */
	isMobile: boolean;
	/** Whether the mobile nav drawer is currently open */
	isMobileNavOpen: boolean;
	/**
	 * DOM id of the mobile nav drawer. `AppShell` sets this so the toggle can
	 * point its `aria-controls` at the drawer and the drawer can apply it as its
	 * `id`. Optional: callers that construct this context by hand may omit it, in
	 * which case `MobileNav` falls back to a locally generated id and the toggle
	 * simply drops `aria-controls`.
	 */
	mobileNavId?: string;
	/** Toggle the mobile nav drawer open/closed */
	toggleMobileNav: () => void;
	/** Open the mobile nav drawer */
	openMobileNav: () => void;
	/** Close the mobile nav drawer */
	closeMobileNav: () => void;
	/** Whether mobile nav is enabled at all */
	isMobileNavEnabled: boolean;
	/** Whether auto-placed toggles should render (false in customToggle mode) */
	hasAutoToggle: boolean;
}

/** Upstream's `defaultValue` argument to `createContext`. */
const defaultValue: AppShellMobileContextValue = {
	isMobile: false,
	isMobileNavOpen: false,
	toggleMobileNav: () => {},
	openMobileNav: () => {},
	closeMobileNav: () => {},
	isMobileNavEnabled: false,
	hasAutoToggle: true
};

/**
 * The context object, published as upstream publishes it from
 * `AppShell/index.ts` (alongside `useAppShellMobile`).
 */
export const AppShellMobileContext = new Context<() => AppShellMobileContextValue>(
	'astryx.appShellMobile'
);

/** Stands in for React's `<AppShellMobileContext value={…}>`. */
export function setAppShellMobileContext(get: () => AppShellMobileContextValue): void {
	AppShellMobileContext.set(get);
}

/**
 * Mobile nav state from anywhere in the `AppShell` tree.
 *
 * Call at component init and read the returned getter reactively. Outside an
 * `AppShell` this returns upstream's default value, so every consumer degrades
 * to "not mobile, no drawer" rather than throwing.
 */
export function useAppShellMobile(): () => AppShellMobileContextValue {
	return AppShellMobileContext.getOr(() => defaultValue);
}
