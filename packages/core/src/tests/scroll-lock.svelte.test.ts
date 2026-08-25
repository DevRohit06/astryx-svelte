import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import Probe from './fixtures/scroll-lock-probe.svelte';

/**
 * Astryx's `hooks/useScrollLock.test.ts` at the **0.5.0** pin — **3 of
 * upstream's 6**, in upstream's order and with its titles and assertions
 * verbatim. The file has no `displayName` case, no non-JSX construction form
 * and no snapshot, so none of this port's standing drops applies to the three
 * that are missing.
 *
 * **The 3 that are not here arrived at 0.5.0**, and they are one subject —
 * scrollbar-gutter compensation, which the lock did not do at v0.4.5:
 *
 * - `holds the page still across the scrollbar it hides` — locking must not let
 *   the content jump sideways by the width of the scrollbar it removes.
 * - `leaves the page alone when the scrollbar is an overlay one` — the
 *   compensation must not fire where the scrollbar never took space.
 * - `holds the gutter for the outermost overlay only, and gives it back once` —
 *   the same through-zero invariant the three cases below assert for the body
 *   snapshot, applied to the gutter.
 *
 * 0.5.0 also added a whole `hooks/scrollbarGutter.test.ts` beside this suite,
 * which has no ported counterpart at all. Both are a **hook** gap rather than
 * only a test gap: this port's `useScrollLock` does not compensate for the
 * scrollbar it hides. (This header read "at **v0.4.5**, all 3 cases … None
 * dropped", true at that pin, where 3 was the whole suite.)
 *
 * This is a new suite — the hook had none here before — and it exists to pin
 * #4788. The lock counter and the body snapshot are **module** state, not
 * per-caller state. Per-caller snapshots are correct only while exactly one lock
 * exists; with two (a Dialog that opens a Drawer) the second caller snapshots
 * the body *already pinned* by the first, so its "previous" values are
 * `hidden` / `fixed` / `-480px`, and whichever unlocks first restores those and
 * leaves the page pinned with no lock holding it. Only the transition through
 * zero may touch the body. Cases 2 and 3 are that invariant from both sides:
 * out-of-order close must not unlock, and the last close must fully restore.
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
 */

describe('useScrollLock', () => {
	afterEach(() => {
		cleanup();
		document.body.style.cssText = '';
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
});
