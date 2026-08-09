import { Context } from '../../internal/context.js';
import type { Snippet } from 'svelte';

/**
 * Ported from Astryx's `TopNav/TopNavMobileContentContext.ts`.
 *
 * When an `AppShell` has *both* a `TopNav` and a `SideNav`, the small-viewport
 * layout must not open two drawers. `AppShell` resolves that by handing the
 * SideNav content to `TopNav` through this context; `TopNav` renders it below
 * its own items inside one combined `MobileNav`.
 *
 * Upstream's context transports a `ReactNode` and is typed as one. The Svelte
 * counterpart transports a `Snippet` — the same substitution `Toast`'s `body`
 * and `Lightbox`'s `caption` make, except that there is no string branch to
 * consider here: the value is always markup `AppShell` composed, never
 * user-supplied text.
 *
 * Module-internal on both sides — `TopNav/index.ts` does not re-export it.
 * Reading it is also how `TopNav` decides whether to show its mobile toggle at
 * all, so "no context" and "context set to nothing" have to stay
 * distinguishable: the getter yields `undefined` for the former as upstream's
 * `createContext(null)` default yields `null`.
 */
const TopNavMobileContentContext = new Context<() => Snippet | undefined>(
	'astryx.topNavMobileContent'
);

/** Stands in for React's `<TopNavMobileContentContext value={…}>`. */
export function setTopNavMobileContent(get: () => Snippet | undefined): void {
	TopNavMobileContentContext.set(get);
}

/**
 * Additional mobile-drawer content provided by `AppShell`.
 *
 * Call at component init and read the returned getter reactively. Yields
 * `undefined` when there is none, which is upstream's `null` default.
 */
export function useTopNavMobileContent(): () => Snippet | undefined {
	return TopNavMobileContentContext.getOr(() => undefined);
}
