import { Context } from 'runed';

/**
 * Svelte equivalent of Astryx's `NavMenu/NavMenuContext.tsx`.
 *
 * Two contexts, both published as values from upstream's `index.ts`:
 *
 * - `NavHeadingCloseContext` is written by the *parent* nav heading popover
 *   (`SideNavHeading`/`TopNavHeading`, both unported) and read by
 *   `NavHeadingMenu`, which uses it to dismiss on Escape and to pass a working
 *   `closeMenu` down to its items.
 * - `NavHeadingMenuContext` is written by `NavHeadingMenu` and read by each
 *   `NavHeadingMenuItem` for its padding size and dismiss-on-click.
 *
 * Both store a **getter**, per the port's context convention, so a changing
 * `size` or `closeMenu` reaches descendants rather than freezing at mount —
 * upstream re-renders on the `useMemo`'d value instead. Both readers are
 * nullable: upstream's `use(…)` yields `null` outside a provider and each
 * consumer falls back (`size` to `'md'`, `closeMenu` to a no-op), so a bare
 * `<NavHeadingMenu>` or `<NavHeadingMenuItem>` still renders.
 */

/** Size scale shared by the menu container and its items. */
export type NavHeadingMenuSize = 'sm' | 'md' | 'lg';

/**
 * Close callback provided by the nav heading popover.
 * `NavHeadingMenu` reads this to dismiss the popover on item selection
 * and on Escape.
 */
export interface NavHeadingCloseContextValue {
	closeMenu: () => void;
}

export const NavHeadingCloseContext = new Context<() => NavHeadingCloseContextValue>(
	'astryx.navHeadingClose'
);

export function setNavHeadingCloseContext(get: () => NavHeadingCloseContextValue): void {
	NavHeadingCloseContext.set(get);
}

/** The enclosing popover's close getter, or `null` when there is no popover. */
export function useNavHeadingCloseContext(): (() => NavHeadingCloseContextValue) | null {
	return NavHeadingCloseContext.getOr(null);
}

/**
 * Size and close context provided by `NavHeadingMenu` to its children.
 * Items read this for consistent padding and dismiss-on-click.
 */
export interface NavHeadingMenuContextValue {
	size: NavHeadingMenuSize;
	closeMenu: () => void;
}

export const NavHeadingMenuContext = new Context<() => NavHeadingMenuContextValue>(
	'astryx.navHeadingMenu'
);

export function setNavHeadingMenuContext(get: () => NavHeadingMenuContextValue): void {
	NavHeadingMenuContext.set(get);
}

/** The enclosing menu's getter, or `null` for an item rendered alone. */
export function useNavHeadingMenuContext(): (() => NavHeadingMenuContextValue) | null {
	return NavHeadingMenuContext.getOr(null);
}
