import type { StyleArg } from '../internal/sx.js';
import { entryAnimationStyle, type EntryAnimationPreset } from './entry-animation.stylex.js';

/**
 * Mount-only entry animations, ported from Astryx's `hooks/useEntryAnimation.ts`.
 *
 * The whole point of the hook is *not* animating: an element that was already
 * in the first paint should appear settled, and only elements inserted later
 * should animate in. Upstream tracks that with a module-level flag flipped in a
 * `requestAnimationFrame`, and captures it once per instance with
 * `useState(() => initialPaintComplete)`.
 *
 * Both halves transcribe directly. The flag is the same module-level
 * `let`, and `useState`'s once-per-instance capture is just reading it in the
 * hook body — this is called during component init, so it is read exactly once
 * per instance, which is why the file needs no runes and no `.svelte.ts`
 * suffix. (Calling it inside `$derived` would re-read the flag and lose that
 * property; a preset is a fixed choice, so there is no reason to.)
 *
 * Upstream's file carries a NOTE that its `'use client'` directive is what keeps
 * this working. We have no such directive and the module *does* evaluate during
 * SSR, but the outcome is the same and for a better reason: the `typeof window`
 * guard leaves the flag false on the server, so server-rendered elements get no
 * animation — which is the intended behaviour, not a degradation — and the
 * client bundle starts its own flag at false and flips it after the first frame,
 * so nothing present at hydration animates either.
 */

export type { EntryAnimationPreset };

// Track whether the initial page paint has completed. Elements rendered on page
// load should not animate; only dynamically inserted ones should.
let initialPaintComplete = false;
if (typeof window !== 'undefined') {
	requestAnimationFrame(() => {
		initialPaintComplete = true;
	});
}

/**
 * Returns a style for animating an element on mount, or `null` when the element
 * is part of the initial paint and should not animate.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const entryStyle = useEntryAnimation('slideDown');
 * </script>
 *
 * <div {...sx(entryStyle)}>Animated content</div>
 * ```
 */
export function useEntryAnimation(preset: EntryAnimationPreset = 'slideDown'): StyleArg | null {
	return initialPaintComplete ? entryAnimationStyle(preset) : null;
}
