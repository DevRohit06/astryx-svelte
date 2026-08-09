import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAnnounce, __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';

/**
 * Ported from Astryx's `hooks/useAnnounce.test.tsx`, all nine cases.
 *
 * This is the one hook that needs no `renderHook` stand-in: it holds no state
 * of its own and touches no component context, so the test calls it directly
 * where upstream reaches for `result.current`. It does need a document, which
 * is why it is a `.svelte.test.ts` and runs in the browser project.
 *
 * `waitFor` becomes `expect.element`, which retries the same way. The one
 * assertion that must *not* retry is the synchronous "cleared" check in the
 * re-announce case: the region is refilled on the next frame, so a retrying
 * matcher would race the rAF it is meant to observe. That one reads
 * `textContent` directly.
 *
 * The three auto-clear cases stand in for upstream's `act(() => …)` wrappers,
 * which have no counterpart: a plain DOM mutation needs no flush here. What they
 * *do* need is a faked `requestAnimationFrame`. Upstream gets one for free — its
 * jsdom rAF is built on `setTimeout`, so faking timers fakes it too — but these
 * run in a real browser, where rAF is native and vitest 4 does not fake it by
 * default. `withFakeTimers` names it explicitly, so `advanceTimersByTime` drives
 * both the announce's rAF and the clear's timeout as one clock.
 */

afterEach(() => {
	__resetLiveRegionsForTest();
});

/** Run `body` under a fake clock that also drives `requestAnimationFrame`. */
function withFakeTimers(body: () => void): void {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame'] });
	try {
		body();
	} finally {
		vi.useRealTimers();
	}
}

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}
function assertiveRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="assertive"]');
}

describe('useAnnounce', () => {
	it('mounts empty polite and assertive live regions on first announce', () => {
		const announce = useAnnounce();
		// Regions do not exist until first use.
		expect(politeRegion()).toBeNull();

		announce('Saved');

		// Both regions exist after the first announce, before content settles.
		expect(politeRegion()).not.toBeNull();
		expect(assertiveRegion()).not.toBeNull();
		expect(politeRegion()).toHaveAttribute('aria-live', 'polite');
		expect(politeRegion()).toHaveAttribute('aria-atomic', 'true');
		expect(politeRegion()).toHaveAttribute('role', 'status');
		expect(assertiveRegion()).toHaveAttribute('aria-live', 'assertive');
		expect(assertiveRegion()).toHaveAttribute('role', 'alert');
	});

	it('announces a polite message into the polite region', async () => {
		const announce = useAnnounce();
		announce('12 results');
		await expect.element(politeRegion()).toHaveTextContent('12 results');
		// Assertive region stays empty.
		expect(assertiveRegion()?.textContent).toBe('');
	});

	it('routes assertive messages to the assertive region', async () => {
		const announce = useAnnounce();
		announce('Upload failed', 'assertive');
		await expect.element(assertiveRegion()).toHaveTextContent('Upload failed');
		expect(politeRegion()?.textContent).toBe('');
	});

	it('re-announces an identical message (clears then re-sets)', async () => {
		const announce = useAnnounce();
		announce('No results found');
		await expect.element(politeRegion()).toHaveTextContent('No results found');
		// Second identical announce should still land (region is cleared first).
		announce('No results found');
		expect(politeRegion()?.textContent).toBe('');
		await expect.element(politeRegion()).toHaveTextContent('No results found');
	});

	it('ignores empty messages', () => {
		const announce = useAnnounce();
		announce('');
		// No regions created for an empty announce.
		expect(politeRegion()).toBeNull();
	});

	it('clears the region after the clear delay, but not before', () => {
		withFakeTimers(() => {
			const announce = useAnnounce();
			announce('Saved');
			// Flush the rAF that re-sets the message.
			vi.advanceTimersByTime(50);
			expect(politeRegion()?.textContent).toBe('Saved');

			// The message survives long enough for AT to finish reading it.
			vi.advanceTimersByTime(1000);
			expect(politeRegion()?.textContent).toBe('Saved');

			// After the clear delay, stale status text is removed from the DOM.
			vi.advanceTimersByTime(10_000);
			expect(politeRegion()?.textContent).toBe('');
		});
	});

	it('resets the clear timer on each announce', () => {
		withFakeTimers(() => {
			const announce = useAnnounce();
			announce('first');
			vi.advanceTimersByTime(1500);
			// Announcing again must reset the pending clear, not inherit it.
			announce('second');
			vi.advanceTimersByTime(1900);
			// 3.4s after 'first' (past its clear point) but only 1.9s after 'second'
			// — the newer message must still be present.
			expect(politeRegion()?.textContent).toBe('second');
			vi.advanceTimersByTime(10_000);
			expect(politeRegion()?.textContent).toBe('');
		});
	});

	it('re-announces normally after a clear', () => {
		withFakeTimers(() => {
			const announce = useAnnounce();
			announce('gone soon');
			vi.advanceTimersByTime(10_000);
			expect(politeRegion()?.textContent).toBe('');

			// The clear-then-rAF re-announce pattern still works after a clear.
			announce('back again');
			vi.advanceTimersByTime(50);
			expect(politeRegion()?.textContent).toBe('back again');
		});
	});

	it('reuses the same singleton regions across hook instances', async () => {
		const a = useAnnounce();
		a('first');
		const region = politeRegion();

		const b = useAnnounce();
		b('second');
		await expect.element(politeRegion()).toHaveTextContent('second');
		// Same DOM node, not a duplicate.
		expect(politeRegion()).toBe(region);
		expect(document.querySelectorAll('[data-astryx-live-region="polite"]').length).toBe(1);
	});
});
