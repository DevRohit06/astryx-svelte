import { describe, it, expect } from 'vitest';
import { parseShortestDurationMs } from '$lib/components/mobile-nav/close-timing.js';

/**
 * Ported from Astryx's `MobileNav/MobileNavCloseTiming.test.ts`, all **3** `it`
 * blocks at the 0.5.0 pin — 14 collected cases, 8 + 5 rows across two `it.each`
 * tables plus one standalone. Nothing is dropped. (The header read "12
 * assertions"; the tables carry 13 rows between them on both sides.)
 *
 * Through the component this helper is only ever reachable via a real browser,
 * which serialises computed `<time>` values in seconds — so `"0.41s"` is the
 * only shape it sees in production and `"250ms"` is a shape it never sees.
 * Reading it directly is the only way the seconds branch, a list, and a zero
 * hold get covered at all.
 *
 * Runs in the **server** project: it is a pure string parser with no DOM.
 *
 * The helper lives in `close-timing.ts` rather than in the component, because
 * Svelte cannot export from an instance script — upstream marks it `@internal
 * Exported for unit tests` and imports it from `./MobileNav`, which is the one
 * structural difference here.
 */

describe('parseShortestDurationMs', () => {
	it.each([
		// How browsers actually serialise a computed transition-duration.
		['0.41s', 410],
		['0.25s', 250],
		['1s', 1000],
		// A non-browser environment's shape: an inline declaration echoed back.
		['250ms', 250],
		// Lists. The dialog transitions one property today, but a style or xstyle
		// prop can add more, and only the shortest entry is safe to close inside.
		['0.41s, 0.12s', 120],
		['120ms, 410ms', 120],
		// A zero hold is the #4290 state itself. It has to read as 0 — meaning
		// "close now" — rather than as unreadable, which would fall back to the cap
		// and schedule the close long after the drawer stopped being rendered.
		['0s', 0],
		['0ms', 0]
	])('reads %j as %ims', (value, expected) => {
		expect(parseShortestDurationMs(value as string)).toBeCloseTo(expected as number, 6);
	});

	it.each([
		// An unresolved var() — any style read outside a browser.
		['var(--duration-medium)'],
		// A CSS math function reads as unreadable too, so the caller falls back to
		// the cap rather than deriving a delay from a number it did not compute.
		['max(150ms, var(--duration-medium))'],
		// A bare number is not a duration.
		['250'],
		[''],
		['   ']
	])('reports %j as unreadable', (value) => {
		expect(parseShortestDurationMs(value)).toBeNull();
	});

	it('skips unreadable entries rather than discarding the whole list', () => {
		expect(parseShortestDurationMs('var(--x), 0.3s')).toBeCloseTo(300, 6);
	});
});
