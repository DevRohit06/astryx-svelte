/**
 * Whether `el` renders right-to-left, per its computed `direction`, ported from
 * Astryx's `hooks/isRtlElement.ts`.
 *
 * SSR-safe: returns `false` when `el` is null or there is no DOM. **Call it
 * lazily — on keydown, not during render** — so `getComputedStyle` runs only
 * when a horizontal arrow key is actually handled. It forces layout, and doing
 * that on every render of a long list is the difference between free and
 * measurable.
 *
 * Reading the *computed* direction rather than the `dir` attribute is
 * deliberate: `dir` may sit on any ancestor, and CSS `direction` can set it
 * without the attribute at all. Same precedent `ResizeHandle` already uses for
 * its drag deltas.
 *
 * A plain `.ts` module, not `.svelte.ts`: it is a pure DOM read with no state.
 */
export function isRtlElement(el: HTMLElement | null): boolean {
	if (!el || typeof window === 'undefined') {
		return false;
	}
	return window.getComputedStyle(el).direction === 'rtl';
}
