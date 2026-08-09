/**
 * SSR-safe media query subscription, ported from Astryx's
 * `hooks/useMediaQuery.ts`.
 *
 * Upstream is `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`,
 * which returns a plain `boolean`. A boolean cannot stay live across a Svelte
 * component's lifetime, so the two halves of that signature are split the way
 * the rest of this port splits React hooks: the query comes in as a **getter**
 * so a changing query re-subscribes (upstream's `[query]` dependency list), and
 * the result comes back as an object whose `matches` is a `$state` read.
 *
 * The subscription lives in `$effect.pre`, which reproduces **one** of the two
 * halves of upstream's three-argument `useSyncExternalStore` — deliberately, and
 * it is the half worth having. Upstream renders `getServerSnapshot` on the
 * server *and* through the hydration pass, then re-renders with the live
 * `getSnapshot`; on a client-only mount it uses `getSnapshot` from the first
 * render, so there is no flash of the default.
 *
 * A pre-effect gives us the no-flash half. It does not run during SSR, so the
 * server emits `serverDefault`. On the client it runs *before* the first DOM
 * write — the compiler emits `user_pre_effect` above the template, and
 * `create_effect` runs a `RENDER_EFFECT` immediately rather than queueing it —
 * so a client-only mount never paints the default.
 *
 * It does **not** give us the hydration half: there is no `hydrating` guard in
 * Svelte's effect machinery, so the live read has already landed by the time the
 * template hydrates. A `{#if}` keyed on `matches` therefore takes Svelte's
 * mismatch-recovery path on a viewport where the server guessed the other
 * branch — the server's nodes are discarded and the branch is built client-side.
 * The resulting DOM is correct and nothing warns; the cost is the discarded
 * subtree. A plain `$effect` would trade that away for a visible flash on every
 * client-only mount, which is the worse end of the bargain and is a regression
 * against React rather than a match for it. Reproducing both halves needs a
 * hydration signal Svelte does not expose.
 */

export interface MediaQueryState {
	/** Whether the query currently matches. `serverDefault` until the first client run. */
	readonly matches: boolean;
}

/**
 * Subscribes to `window.matchMedia` and reports whether the query matches.
 *
 * @param query - Getter for the CSS media query string. Changing it re-subscribes.
 * @param serverDefault - Value reported during SSR and hydration. Pass a
 *   server-side hint (e.g. derived from User-Agent or client hints) to avoid a
 *   layout flash.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const isMobile = useMediaQuery(() => '(max-width: 768px)');
 * </script>
 *
 * {#if isMobile.matches}…{/if}
 * ```
 */
export function useMediaQuery(query: () => string, serverDefault = false): MediaQueryState {
	let matches = $state(serverDefault);

	$effect.pre(() => {
		const mql = window.matchMedia(query());
		matches = mql.matches;

		const onChange = (event: MediaQueryListEvent): void => {
			matches = event.matches;
		};

		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});

	return {
		get matches() {
			return matches;
		}
	};
}
