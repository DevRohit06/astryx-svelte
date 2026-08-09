/**
 * The reactivity behind the global icon registry.
 *
 * `icon-registry.ts` keeps the registry itself in a plain module binding, as
 * upstream's `globalIconRegistry.ts` does — it has to be readable during SSR and
 * from plain-TS tooling, and it is written once at app start in the common case.
 * A plain binding invalidates nothing, though, and `Icon` reads it through a
 * `$derived`: re-registering a different theme's icons would refresh the map and
 * leave every mounted `<Icon>` painting the old glyph until its node was
 * destroyed. React has no such gap — upstream re-registers from `Theme`'s render
 * body, so the subtree re-reads the map in the same commit.
 *
 * So the *read* path subscribes to this version counter and `registerIcons`
 * bumps it. It lives in its own module because runes may only be declared in a
 * `.svelte.ts` file, and `icon-registry.ts` is imported by the theme compiler
 * and other plain-Node paths.
 *
 * @internal
 */

import { untrack } from 'svelte';

let version = $state(0);

/** Subscribe the caller's derived/effect to icon registrations. */
export function readIconVersion(): number {
	return version;
}

/**
 * Invalidate every reader. Called by `registerIcons` and `resetIcons`.
 *
 * **The `untrack` is load-bearing, and its absence was a live bug.** `version +=
 * 1` is a read *and* a write, so a bump from inside a reactive scope subscribed
 * that scope to the counter it was about to invalidate — and `<Theme>` bumps
 * from a `$effect.pre`, which made every theme carrying an `icons` map loop to
 * `effect_update_depth_exceeded` on mount. It went unseen because no client test
 * had ever mounted a `<Theme>` *with* icons; the nested-theme case in
 * `icon.svelte.test.ts` is the first, and it failed on this before it failed on
 * anything else.
 *
 * A version counter must never make its bumper one of its readers, whoever calls
 * it and from wherever — so the guard belongs here rather than at the call site.
 */
export function bumpIconVersion(): void {
	version = untrack(() => version) + 1;
}
