/** PORTS: hooks/useClipboard.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/clipboard-probe.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import type { UseClipboardOptions } from '$lib/hooks/use-clipboard.svelte.js';

/**
 * Ported from Astryx's `hooks/useClipboard.test.tsx` at the **0.5.0** pin, which
 * declares **8** `it` cases in one `describe('useClipboard')`. **8 here**, in
 * upstream's order, with upstream's titles and assertions. **None dropped.**
 *
 * There is no `displayName` case and no ref case in the file, so nothing in it
 * is React-only.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **`renderHook` → `clipboard-probe.svelte`.** Svelte has no `renderHook`;
 *   `useClipboard`'s reset-timer teardown is an `$effect`, so the hook has to
 *   run inside a component's init. `result.current` becomes the probe's
 *   instance export, reached through `render(...).component` — the
 *   `long-press-probe.svelte` arrangement. The probe exports the *whole* return
 *   object because `isCopied` is a getter on it; destructuring would snapshot
 *   the boolean.
 * - **`act()` disappears.** None of these assertions read rendered output —
 *   they read `result.current` and the live region — and a `$state` write
 *   flushes on its own. `await act(async () => { … })` is therefore just
 *   `await`, and `act(() => vi.advanceTimersByTime(n))` is the bare advance.
 * - **`waitFor` → `expect.element`**, which retries the same way.
 * - **The clipboard stub is kept, but respelled.** Upstream writes
 *   `Object.assign(navigator, {clipboard: …})`, which works only because jsdom
 *   has no `navigator.clipboard` at all, so the assignment creates an own
 *   property. This project runs real headless Chromium, where `clipboard` is a
 *   getter-only accessor on `Navigator.prototype` and that assignment throws in
 *   strict mode. `Object.defineProperty` installs the same spy, and
 *   `Reflect.deleteProperty` hands the real (permission-gated) clipboard back —
 *   the `code-block.svelte.test.ts` / `timestamp.svelte.test.ts` spelling. The
 *   stub matters *more* here than upstream: `writeText` in a real browser needs
 *   a permission grant the test page does not have, so without it these cases
 *   would assert Playwright's permission model rather than the hook.
 * - **The spy is held in a local**, so upstream's
 *   `navigator.clipboard.writeText as ReturnType<typeof vi.fn>` cast is not
 *   needed at either use site. Same object, same assertions.
 * - **Only `setTimeout`/`clearTimeout` are faked**, where upstream's bare
 *   `vi.useFakeTimers()` takes the default set. That set includes
 *   `queueMicrotask`, which is what Svelte schedules its own work on — faking it
 *   stalls mount and unmount, and the eighth case is about exactly those. The
 *   `long-press.svelte.test.ts` rule.
 *
 * ## Why the client project
 *
 * `useAnnounce` writes into `document.body` and re-sets the message inside a
 * `requestAnimationFrame`, so three cases need a real document; and the eighth
 * needs an `$effect` teardown, which a `.svelte.ts` compiled for `svelte/server`
 * elides entirely. Both halves of the hook are only observable where a browser
 * can start.
 */

/** Upstream's module-scope helper, unchanged. */
function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

let writeText: ReturnType<typeof vi.fn>;

const probe = (options: UseClipboardOptions = {}) =>
	render(Probe, { props: { options: () => options } });

/** Upstream's bare `vi.useFakeTimers()`, minus the microtask queue Svelte runs on. */
function useFakeTimeouts(): void {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
}

describe('useClipboard', () => {
	beforeEach(() => {
		// jsdom does not implement the async Clipboard API; Chromium does, but
		// gates `writeText` behind a permission grant this page does not have.
		writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
			writable: true
		});
	});

	afterEach(() => {
		__resetLiveRegionsForTest();
		// Hand the real (permission-gated) clipboard back to the page.
		Reflect.deleteProperty(navigator, 'clipboard');
		vi.restoreAllMocks();
	});

	it('writes the given text to the clipboard and resolves true', async () => {
		const { component } = await probe();
		const outcome = await component.clipboard.copy('hello world');
		expect(writeText).toHaveBeenCalledWith('hello world');
		expect(outcome).toBe(true);
	});

	it('flips isCopied to true after a successful copy', async () => {
		const { component } = await probe();
		expect(component.clipboard.isCopied).toBe(false);
		await component.clipboard.copy('x');
		expect(component.clipboard.isCopied).toBe(true);
	});

	it('reverts isCopied after resetAfterMs', async () => {
		useFakeTimeouts();
		try {
			const { component } = await probe({ resetAfterMs: 1000 });
			await component.clipboard.copy('x');
			expect(component.clipboard.isCopied).toBe(true);
			vi.advanceTimersByTime(1000);
			expect(component.clipboard.isCopied).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('keeps isCopied true for the full window after a rapid re-copy', async () => {
		useFakeTimeouts();
		try {
			const { component } = await probe({ resetAfterMs: 2000 });
			await component.clipboard.copy('x');
			expect(component.clipboard.isCopied).toBe(true);

			// Re-copy partway through the window.
			vi.advanceTimersByTime(1500);
			await component.clipboard.copy('x');

			// 600ms after the second copy (2.1s after the first): the first copy's
			// timer must not have reverted it early.
			vi.advanceTimersByTime(600);
			expect(component.clipboard.isCopied).toBe(true);

			// It resets 2s after the most recent copy.
			vi.advanceTimersByTime(1400);
			expect(component.clipboard.isCopied).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('announces the configured message to a polite live region', async () => {
		const { component } = await probe({ announce: 'Copied' });
		await component.clipboard.copy('x');
		await expect.element(politeRegion()).toHaveTextContent('Copied');
	});

	it('does not announce when no announce message is configured', async () => {
		const { component } = await probe();
		await component.clipboard.copy('x');
		// No announce option → no live region is ever created.
		expect(politeRegion()).toBeNull();
	});

	it('is a silent no-op that resolves false when the clipboard rejects', async () => {
		writeText.mockRejectedValue(new Error('denied'));
		const { component } = await probe({ announce: 'Copied' });
		const outcome = await component.clipboard.copy('x');
		expect(outcome).toBe(false);
		expect(component.clipboard.isCopied).toBe(false);
		expect(politeRegion()).toBeNull();
	});

	it('clears a pending reset timer on unmount', async () => {
		useFakeTimeouts();
		const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
		try {
			const { component, unmount } = await probe();
			await component.clipboard.copy('x');
			// Upstream asserts on a spy installed before `renderHook`, so its
			// `toHaveBeenCalled()` also counts anything the render itself cleared.
			// Clearing here narrows the window to the unmount the title names; the
			// assertion below is upstream's, unchanged.
			clearSpy.mockClear();
			await unmount();
			expect(clearSpy).toHaveBeenCalled();
		} finally {
			clearSpy.mockRestore();
			vi.useRealTimers();
		}
	});
});
