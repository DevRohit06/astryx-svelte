/** PORTS: MobileNav/MobileNavCloseEdgeCases.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MobileNavProbe from './fixtures/mobile-nav-probe.svelte';
import AppShellFixture from './fixtures/app-shell-fixture.svelte';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Ported from Astryx's `MobileNav/MobileNavCloseEdgeCases.test.tsx`, **11 of its
 * 12** cases at the 0.5.0 pin.
 *
 * **One case has no Svelte analogue and is dropped**: `survives StrictMode
 * double-invoked effects`. `StrictMode` is a React development behaviour —
 * mount, tear down, mount again — and Svelte has no counterpart, so there is no
 * double invocation to survive. The property it protects (the unmount-only
 * effect closing the dialog during a teardown that is immediately followed by a
 * remount) is still covered by `closes the dialog when unmounted while fully
 * open` and by `mobile-nav-reopen.svelte.test.ts`.
 *
 * #4290 moved the unmount close into its own effect so the deferred slide-out
 * close is no longer cut off by its own cleanup. That split is the risky part:
 * the close now depends on a timer surviving to fire, and on the unmount-only
 * effect catching every teardown the timer misses. These cover the paths where
 * the two could disagree and leave a modal dialog open — which blocks the whole
 * document, whether or not the drawer is rendered.
 *
 * The invariant behind all of them: the drawer must never be left open. Being
 * slow to close is a glitch; never closing is a wedged page.
 *
 * `matchMedia` is stubbed **query-aware**. A blanket `matches: true` puts
 * `AppShell` below its breakpoint, which these need, but it also matches
 * `prefers-reduced-motion`, which caps the close delay at 0 — every case here
 * would run against an immediate close while appearing to exercise the real
 * delay. See the header of `stub-match-media.ts`.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
	stubMatchMedia({ reduceMotion: false });
});

afterEach(() => {
	document.documentElement.style.overflow = '';
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
});

const drawer = (isOpen: boolean, extra: Record<string, unknown> = {}) => ({
	navProps: { isOpen, onOpenChange: () => {}, 'data-testid': 'mobile-nav', ...extra },
	text: 'Nav content'
});

/** A closed `<dialog>` is `display: none`, so the testid engine skips it. */
const dialogIn = (container: HTMLElement) =>
	container.querySelector('[data-testid="mobile-nav"]') as HTMLDialogElement;

describe('MobileNav close path edge cases', () => {
	// Upstream's `survives StrictMode double-invoked effects` is dropped — see the
	// file header.

	it('closes the dialog when unmounted while fully open', async () => {
		const screen = await render(MobileNavProbe, { props: drawer(true) });
		const dialog = dialogIn(screen.container);
		expect(dialog).toHaveAttribute('open');

		screen.unmount();

		// Left open, the next showModal() is skipped and the drawer can never be
		// re-opened (#3091) — and the document stays blocked meanwhile.
		expect(dialog).not.toHaveAttribute('open');
	});

	it('does not restart the pending close when the side prop changes', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawer(true, { side: 'start' }) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawer(false, { side: 'start' }));
		expect(dialog).toHaveAttribute('open');

		// Most of the way through the pending close...
		await vi.advanceTimersByTimeAsync(200);
		expect(dialog).toHaveAttribute('open');

		// ...then change the side. Side resolution lives in its own effect, so this
		// has to leave the close alone. Were `side` tracked by the open/close
		// effect, its teardown would cancel the pending close and re-arm a fresh
		// full delay — while the CSS hold keeps running from the commit that
		// started the slide-out. The close would then land after the drawer had
		// stopped being rendered, which is the #4290 state again.
		//
		// The split advance is the whole point: the total must clear one delay but
		// not two.
		await screen.rerender(drawer(false, { side: 'end' }));
		await vi.advanceTimersByTimeAsync(100);

		expect(dialog).not.toHaveAttribute('open');
	});

	it('settles closed after a rapid open/close/open/close burst', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawer(false) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawer(true));
		await screen.rerender(drawer(false));
		await screen.rerender(drawer(true));
		await screen.rerender(drawer(false));
		await vi.advanceTimersByTimeAsync(300);

		expect(dialog).not.toHaveAttribute('open');
	});

	it('restores documentElement overflow once the drawer has closed', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawer(true) });
		const dialog = dialogIn(screen.container);
		expect(document.documentElement.style.overflow).toBe('clip');

		await screen.rerender(drawer(false));
		await vi.advanceTimersByTimeAsync(300);

		// Pin the close itself. The effect teardown resets overflow on every
		// `isOpen` flip, so the overflow assertion alone passes even with the whole
		// close path deleted — the test name would be the only thing left of it.
		expect(dialog).not.toHaveAttribute('open');
		// A drawer that closes but leaves the page scroll-locked is its own flavour
		// of "the page is broken and nothing says why".
		expect(document.documentElement.style.overflow).toBe('');
	});

	it('restores documentElement overflow when unmounted while open', async () => {
		const screen = await render(MobileNavProbe, { props: drawer(true) });
		expect(document.documentElement.style.overflow).toBe('clip');

		screen.unmount();

		expect(document.documentElement.style.overflow).toBe('');
	});

	it('leaves no pending close timer behind after unmount', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawer(true) });
		await screen.rerender(drawer(false));
		screen.unmount();

		// The queued close must be cancelled, not left to fire against a detached
		// node.
		expect(vi.getTimerCount()).toBe(0);
	});

	it('closes inside the display hold when a theme shortens it', async () => {
		// The hold is `--duration-medium`, which themes rewrite: the shipped y2k
		// theme uses 250ms and the documented "Snappy" preset does too. A close
		// scheduled on the hold's boundary lands on the frame the drawer stops
		// being rendered — which is exactly the #4290 state. The delay has to be
		// derived from the hold actually in effect, not assumed.
		// Full motion (the file default) — under reduced motion the close is
		// immediate and the boundary is never exercised.
		vi.useFakeTimers();
		const hold = 250;
		const style = 'transition-duration: 250ms';
		const screen = await render(MobileNavProbe, { props: drawer(true, { style }) });
		const dialog = dialogIn(screen.container);
		expect(getComputedStyle(dialog).transitionDuration).toBe('0.25s');

		await screen.rerender(drawer(false, { style }));
		await vi.advanceTimersByTimeAsync(hold - 1);

		expect(dialog).not.toHaveAttribute('open');
	});

	it('closes on the next macrotask when the hold is zero', async () => {
		// A theme can set --duration-medium to 0 — nothing validates motion values
		// — and then `display` flips on the next style recalc with no hold at all.
		// No delay is safe at that point, so the close has to go out immediately
		// rather than fall back to the cap and land a quarter-second after the
		// drawer stopped being rendered, which is #4290 restored.
		vi.useFakeTimers();
		const style = 'transition-duration: 0ms';
		const screen = await render(MobileNavProbe, { props: drawer(true, { style }) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawer(false, { style }));
		await vi.advanceTimersByTimeAsync(1);

		expect(dialog).not.toHaveAttribute('open');
	});

	it('closes on the next macrotask under reduced motion', async () => {
		// Reduced motion should make the close *sooner*, not the safety margin
		// *smaller*. Shortening the hold to match leaves no slack: one slow frame
		// between the commit and the close macrotask and the drawer has already
		// stopped being rendered — #4290 again, on the accessibility setting.
		stubMatchMedia({ reduceMotion: true });
		vi.useFakeTimers();
		const style = 'transition-duration: 410ms';
		const screen = await render(MobileNavProbe, { props: drawer(true, { style }) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawer(false, { style }));
		await vi.advanceTimersByTimeAsync(1);

		expect(dialog).not.toHaveAttribute('open');
	});

	it('closes the AppShell drawer when dismissed with Escape', async () => {
		const screen = await render(AppShellFixture, {
			props: {
				sideNav: 'test',
				sideNavLabel: 'Home',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});
		await screen.getByRole('button', { name: /open navigation/i }).click();
		const dialog = screen.container.querySelector('dialog') as HTMLDialogElement;
		expect(dialog).toHaveAttribute('open');

		dialog.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: false }));
		await vi.waitFor(() => expect(dialog).not.toHaveAttribute('open'));
	});

	it('closes the AppShell drawer when the backdrop is clicked', async () => {
		const screen = await render(AppShellFixture, {
			props: {
				sideNav: 'test',
				sideNavLabel: 'Home',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});
		await screen.getByRole('button', { name: /open navigation/i }).click();
		const dialog = screen.container.querySelector('dialog') as HTMLDialogElement;
		expect(dialog).toHaveAttribute('open');

		// A click landing on the dialog itself, not the drawer panel, is a backdrop
		// dismiss.
		dialog.click();
		await vi.waitFor(() => expect(dialog).not.toHaveAttribute('open'));
	});
});
