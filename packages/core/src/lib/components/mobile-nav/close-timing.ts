/**
 * Ported from the close-timing helpers in Astryx's `MobileNav/MobileNav.tsx`.
 *
 * Their own module here rather than file-locals, because Svelte has no way to
 * export a helper from a component's instance script — upstream marks
 * `parseShortestDurationMs` `@internal Exported for unit tests` and its suite
 * imports it directly, so it needs a module to live in. Not exported from the
 * barrel, matching upstream, which publishes neither.
 */

/** Longest the drawer will wait before closing, however long the hold is. */
const MAX_CLOSE_DELAY_MS = 250;
/** Fraction of the hold to close at, so the close never lands on its boundary. */
const CLOSE_WITHIN_HOLD = 0.6;

/**
 * Shortest duration in a `transition-duration` list, in ms; null if unreadable.
 *
 * Browsers serialise computed `<time>` values in seconds — an authored `410ms`
 * reads back as `"0.41s"` and a list as `"0.41s, 0.12s"` — so the seconds branch
 * is the one that runs outside tests. A non-browser environment echoes an inline
 * `250ms` back as-is and never resolves `var()`, so both units and the
 * unreadable case are covered directly in `mobile-nav-close-timing.test.ts`
 * rather than through the component.
 *
 * @internal Exported for unit tests.
 */
export function parseShortestDurationMs(value: string): number | null {
	const durations = value
		.split(',')
		.map((part) => {
			const trimmed = part.trim();
			const ms = Number.parseFloat(trimmed);
			if (!Number.isFinite(ms)) {
				return null;
			}
			return trimmed.endsWith('ms') ? ms : trimmed.endsWith('s') ? ms * 1000 : null;
		})
		.filter((ms): ms is number => ms !== null);

	return durations.length ? Math.min(...durations) : null;
}

/**
 * How long to wait before closing the native dialog.
 *
 * The drawer is only rendered for as long as its `display` transition runs, and
 * closing an unrendered modal dialog is what leaves the page inert (#4290). So
 * the close has to land inside that hold. The hold is `--duration-medium`, which
 * themes rewrite — the shipped y2k theme sets it to exactly 250ms — so read the
 * hold in effect rather than assuming it.
 */
export function resolveCloseDelay(dialog: HTMLDialogElement): number {
	// Reduced motion makes the close sooner; it must not make the hold shorter.
	// Shrinking both leaves no slack — one slow frame between the commit and this
	// macrotask and the drawer has already stopped being rendered.
	const cap = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		? 0
		: MAX_CLOSE_DELAY_MS;

	const hold = parseShortestDurationMs(window.getComputedStyle(dialog).transitionDuration);

	// The hold is unreadable — an unresolved var() outside a real browser.
	if (hold === null) {
		return cap;
	}

	return hold <= 0 ? 0 : Math.min(cap, hold * CLOSE_WITHIN_HOLD);
}
