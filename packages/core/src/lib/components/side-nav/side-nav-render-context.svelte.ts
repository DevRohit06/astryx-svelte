import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `SideNav/SideNavRenderContext.ts`.
 *
 * `AppShell` renders one `SideNav` in up to three places on a small viewport —
 * inline, in the mobile top bar, and inside the drawer — and this context is how
 * each copy is told which parts of itself to render.
 *
 * Unlike `SideNavCollapseContext`, the context **object** is public: upstream's
 * `SideNav/index.ts` exports `SideNavRenderContext` alongside
 * `useSideNavRenderMode`, so an app assembling its own shell can drive the modes
 * directly. The Svelte object is a `Context` (`internal/context.ts`), so `setSideNavRenderMode`
 * is the writer where React writes `<SideNavRenderContext value="drawer">`.
 */
export type SideNavRenderMode = 'default' | 'topbar' | 'drawer' | 'drawer-content';

export const SideNavRenderContext = new Context<() => SideNavRenderMode>(
	'astryx.sideNavRenderMode'
);

/** Stands in for React's `<SideNavRenderContext value={…}>`. */
export function setSideNavRenderMode(get: () => SideNavRenderMode): void {
	SideNavRenderContext.set(get);
}

/**
 * Read the current `SideNav` render mode.
 *
 * Call at component init and read the returned getter reactively. Defaults to
 * `'default'` outside any provider, as upstream's `createContext('default')`
 * does — which is what makes a standalone `<SideNav>` render the full sidebar.
 */
export function useSideNavRenderMode(): () => SideNavRenderMode {
	return SideNavRenderContext.getOr(() => 'default');
}
