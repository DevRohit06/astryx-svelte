import { Context } from 'runed';

/**
 * Ported from Astryx's `TopNav/TopNavRenderContext.ts`.
 *
 * The `TopNav` counterpart of `SideNavRenderContext`: `AppShell` renders one
 * `TopNav` in the top bar and again inside the mobile drawer, and this tells
 * each copy — and every `TopNavItem`/`TopNavMenu`/`TopNavMegaMenu*` beneath it —
 * which shape to take.
 *
 * - `'default'`: full top bar (desktop)
 * - `'mobile-bar'`: heading + endContent + toggle, nav items hidden
 * - `'drawer'`: nav items as vertical list rows
 *
 * The context object is public, as upstream's `TopNav/index.ts` exports it.
 */
export type TopNavRenderMode = 'default' | 'mobile-bar' | 'drawer';

export const TopNavRenderContext = new Context<() => TopNavRenderMode>('astryx.topNavRenderMode');

/** Stands in for React's `<TopNavRenderContext value={…}>`. */
export function setTopNavRenderMode(get: () => TopNavRenderMode): void {
	TopNavRenderContext.set(get);
}

/**
 * Read the current `TopNav` render mode.
 *
 * Call at component init and read the returned getter reactively. Defaults to
 * `'default'` outside any provider, as upstream's `createContext('default')`
 * does.
 */
export function useTopNavRenderMode(): () => TopNavRenderMode {
	return TopNavRenderContext.getOr(() => 'default');
}
