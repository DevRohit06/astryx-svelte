/** PORTS: hooks/useScrollLock.test.ts */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import Probe from './fixtures/scroll-lock-probe.svelte';

/**
 * Astryx's `hooks/useScrollLock.test.ts`, ported whole — **6 of upstream's 6**
 * at the 0.5.0 pin, in upstream's order and with its titles and assertions
 * verbatim. Nothing is dropped.
 *
 * **The last 3 arrived at 0.5.0**, and they are one subject — scrollbar-gutter
 * compensation, which the lock did not do at v0.4.5. They were a **hook** gap
 * rather than only a test gap: this port's `useScrollLock` did not compensate
 * for the scrollbar it hides, and `hooks/scrollbarGutter.ts` had no counterpart
 * here at all. Both landed together with `scrollbar-gutter.svelte.test.ts`,
 * which is where the module's own cases live — the padding fallback, the
 * settle-once guard and the no-layout early return are asserted there rather
 * than through the lock, and that file states its own count against upstream's.
 *
 * (This header has been wrong once at a pin move already: it read "at
 * **v0.4.5**, all 3 cases … None dropped", true at that pin, where 3 was the
 * whole suite, and false the moment upstream added three more.)
 *
 * This suite exists to pin #4788. The lock counter and the body snapshot are
 * **module** state, not per-caller state. Per-caller snapshots are correct only
 * while exactly one lock exists; with two (a Dialog that opens a Drawer) the
 * second caller snapshots the body *already pinned* by the first, so its
 * "previous" values are `hidden` / `fixed` / `-480px`, and whichever unlocks
 * first restores those and leaves the page pinned with no lock holding it. Only
 * the transition through zero may touch the body. Cases 2 and 3 are that
 * invariant from both sides: out-of-order close must not unlock, and the last
 * close must fully restore. Case 6 is the same invariant for the gutter, which
 * rides in that one snapshot for exactly this reason.
 *
 * ## Why this is a `.svelte.test.ts` and not a `.test.ts`
 *
 * The hook reads `window.scrollX` / `scrollY`, writes five inline styles onto
 * `document.body`, and calls `window.scrollTo` — none of which node has. More
 * decisively, every case turns on the effect's **teardown**: a `.svelte.ts`
 * module compiled for `svelte/server` elides `$effect` altogether, so a node
 * port would lock nothing, unlock nothing, and still go green. It stays in the
 * client project, where a real Chromium runs the real effect.
 *
 * ## Translations
 *
 * - `renderHook(() => useScrollLock(true))` becomes a probe fixture whose mount
 *   *is* the lock; `.unmount()` maps straight across, and is awaited because
 *   `vitest-browser-svelte` v3 returns a promise from it. The teardown itself is
 *   synchronous (`flushSync(() => unmount(component))` inside the adapter), so
 *   upstream's assertions still read the body immediately after the release,
 *   with no polling and no `act()`.
 * - `cleanup()` is called explicitly at the top of `afterEach`, exactly as
 *   upstream does, and for a reason that is not cosmetic. `vitest-browser-svelte`
 *   does clean up on its own, but on the *next* test's `beforeEach` — so without
 *   this call a still-mounted probe would survive the `cssText` reset below and
 *   then write its snapshot back onto a body the next case expects to be blank,
 *   and its lock would still be counted. Unmounting before wiping makes the two
 *   orderings agree. Every case here also unmounts its own probes, as upstream's
 *   do, so this is a backstop rather than the mechanism.
 *
 * Both stubs are upstream's and both are load-bearing here. The `scrollX` /
 * `scrollY` getter mocks are what make "restores the scroll position" a real
 * assertion — a headless Chromium page is at 0,0, so without them
 * `scrollTo(0, 0)` would pass whether or not the snapshot was taken. The
 * `scrollTo` mock keeps the restore from actually scrolling the test harness's
 * own page.
 *
 * The last three cases add upstream's third stub, the viewport pair
 * (`window.innerWidth` against `documentElement.clientWidth`). It is what tells
 * `holdScrollbarGutter` a classic scrollbar from an overlay one, and pinning it
 * is what makes each of the two an *input* rather than a property of whichever
 * machine runs the suite — jsdom has neither, and a real Chromium has whichever
 * one the CI image was built with. `window.innerWidth` is put back in
 * `afterEach` alongside upstream's `clientWidth` delete; upstream leaves it
 * pinned because jsdom rebuilds the window per file, whereas here the window is
 * the test iframe's and outlives the case.
 */

describe('useScrollLock', () => {
	afterEach(() => {
		cleanup();
		document.body.style.cssText = '';
		document.documentElement.style.cssText = '';
		// @ts-expect-error -- drop the viewport stub so the browser's own value comes back
		delete document.documentElement.clientWidth;
		// @ts-expect-error -- see the header: the iframe's window outlives the case
		delete window.innerWidth;
		vi.restoreAllMocks();
	});

	it('restores body styles and scroll position after a single lock is released', async () => {
		document.body.style.overflow = 'auto';
		document.body.style.position = 'relative';

		vi.spyOn(window, 'scrollX', 'get').mockReturnValue(120);
		vi.spyOn(window, 'scrollY', 'get').mockReturnValue(480);
		vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		const lock = await render(Probe);

		expect(document.body.style.overflow).toBe('hidden');
		expect(document.body.style.position).toBe('fixed');

		await lock.unmount();

		expect(document.body.style.overflow).toBe('auto');
		expect(document.body.style.position).toBe('relative');
		expect(window.scrollTo).toHaveBeenCalledWith(120, 480);
	});

	it('stays locked while a second overlay is still open, even if the first closes out of order', async () => {
		vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		const first = await render(Probe);
		const second = await render(Probe);

		await first.unmount();

		expect(document.body.style.position).toBe('fixed');
		expect(document.body.style.overflow).toBe('hidden');

		await second.unmount();
	});

	it('fully restores the body once every overlay has closed, regardless of close order', async () => {
		vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		const first = await render(Probe);
		const second = await render(Probe);

		await first.unmount();
		await second.unmount();

		expect(document.body.style.position).toBe('');
		expect(document.body.style.overflow).toBe('');
		expect(document.body.style.top).toBe('');
		expect(document.body.style.left).toBe('');
		expect(document.body.style.right).toBe('');
	});

	it('holds the page still across the scrollbar it hides', async () => {
		// A 1024px window over a 1009px layout viewport = a 15px classic
		// scrollbar. Pinning the body hides it, which would widen the page by
		// those 15px and reflow everything sideways.
		Object.defineProperty(window, 'innerWidth', {
			value: 1024,
			configurable: true,
			writable: true
		});
		Object.defineProperty(document.documentElement, 'clientWidth', {
			value: 1009,
			configurable: true
		});
		vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		const lock = await render(Probe);

		expect(document.documentElement.style.scrollbarGutter).toBe('stable');

		await lock.unmount();

		expect(document.documentElement.style.scrollbarGutter).toBe('');
	});

	it('leaves the page alone when the scrollbar is an overlay one', async () => {
		Object.defineProperty(window, 'innerWidth', {
			value: 1024,
			configurable: true,
			writable: true
		});
		Object.defineProperty(document.documentElement, 'clientWidth', {
			value: 1024,
			configurable: true
		});
		vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		const lock = await render(Probe);

		expect(document.documentElement.style.scrollbarGutter).toBe('');
		expect(document.body.style.paddingRight).toBe('');

		await lock.unmount();
	});

	it('holds the gutter for the outermost overlay only, and gives it back once', async () => {
		Object.defineProperty(window, 'innerWidth', {
			value: 1024,
			configurable: true,
			writable: true
		});
		Object.defineProperty(document.documentElement, 'clientWidth', {
			value: 1009,
			configurable: true
		});
		vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

		const first = await render(Probe);
		const second = await render(Probe);

		expect(document.documentElement.style.scrollbarGutter).toBe('stable');

		await first.unmount();

		expect(document.documentElement.style.scrollbarGutter).toBe('stable');

		await second.unmount();

		expect(document.documentElement.style.scrollbarGutter).toBe('');
	});
});
