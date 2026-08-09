import { Context } from 'runed';

/**
 * Ported from Astryx's `SideNav/SideNavCollapseContext.ts`.
 *
 * `SideNav` publishes its collapse state to `SideNavCollapseButton` (which
 * toggles it), `SideNavHeading` and `SideNavItem` (which render icon-only when
 * collapsed) and `SideNavSection` (which visually hides its header). It is only
 * provided when `collapsible` is set — a non-collapsible `SideNav` sets nothing,
 * and every consumer falls through to the default below, which is what makes a
 * bare `<SideNavItem>` render normally outside any `SideNav` at all.
 *
 * `SideNavItem` also *re-provides* it, pinned to
 * {@link EXPANDED_COLLAPSE_STATE}, around the children it shows inside its
 * collapsed-mode popover: those rows are in an expanded flyout, so they must not
 * inherit the sidebar's collapsed state.
 *
 * The context stores a getter, so `isCollapsed` flipping reaches descendants.
 */
export interface SideNavCollapseState {
	/** Whether the sidenav is currently collapsed */
	isCollapsed: boolean;
	/** Toggle collapse state */
	toggle: () => void;
	/** Whether collapse is enabled */
	isCollapsible: boolean;
}

/**
 * The imperative handle a `SideNav` exposes for `SideNavCollapseButton`
 * instances rendered *outside* its tree, where context is unavailable.
 *
 * Upstream mints it with `useImperativeHandle(handleRef, …)` and the consumer
 * holds a `RefObject`. Svelte has neither, so — as `Tokenizer`'s `focus()`/
 * `blur()` already do — `SideNav` exposes `getCollapseState()` as an instance
 * export reached through `bind:this`, and `SideNavCollapseButton` takes the
 * handle *object* rather than a ref to one. Same translation `Popover`'s
 * `anchorRef` took: bind the thing, not a box holding it.
 */
export interface SideNavImperativeCollapseHandle {
	getCollapseState: () => SideNavCollapseState | null;
}

/** Upstream's `createContext` default — collapse disabled, toggle a no-op. */
const defaultValue: SideNavCollapseState = {
	isCollapsed: false,
	toggle: () => {},
	isCollapsible: false
};

/**
 * The state `SideNavItem` pins around its collapsed-mode popover children, so
 * nested items inside the flyout render expanded. Upstream's
 * `EXPANDED_COLLAPSE_STATE`.
 *
 * Upstream declares it as a bare `const` inside `SideNavItem.tsx`; here it has to
 * be `export`ed because the context and its consumer are separate modules. It is
 * **barrel-absent on both sides**, so nothing is published either way — but if
 * per-component subpaths ever land (TODO.md → Published surface), this becomes a
 * real over-export and should move into `side-nav-item.svelte` rather than gain
 * an entry.
 */
export const EXPANDED_COLLAPSE_STATE: SideNavCollapseState = {
	isCollapsed: false,
	toggle: () => {},
	isCollapsible: false
};

const SideNavCollapseContext = new Context<() => SideNavCollapseState>('astryx.sideNavCollapse');

/** Stands in for React's `<SideNavCollapseContext value={…}>`. */
export function setSideNavCollapseContext(get: () => SideNavCollapseState): void {
	SideNavCollapseContext.set(get);
}

/**
 * Read the sidenav collapse state from context.
 *
 * Call at component init and read the returned getter reactively. Outside a
 * collapsible `SideNav` it yields `{isCollapsed: false, isCollapsible: false}`,
 * which is upstream's `createContext` default.
 */
export function useSideNavCollapse(): () => SideNavCollapseState {
	return SideNavCollapseContext.getOr(() => defaultValue);
}
