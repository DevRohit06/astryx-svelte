import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MobileNavProbe from './fixtures/mobile-nav-probe.svelte';
import { stubMatchMedia } from './stub-match-media.js';
import { parseShortestDurationMs } from '$lib/components/mobile-nav/close-timing.js';

/**
 * Ported from Astryx's `MobileNav/MobileNavCloseVisibility.test.tsx`, all **5**
 * cases at the 0.5.0 pin. Nothing is dropped.
 *
 * Repro for #4290 (page unresponsive after closing the drawer in Safari 26.1).
 *
 * A `<dialog>` opened with `showModal()` blocks the rest of the document for as
 * long as it stays in the top layer — whether or not it is rendered. The drawer
 * hid itself the moment `isOpen` flipped, while the native `close()` only ran
 * afterwards from an effect, so `close()` was always called on a dialog that was
 * already `display: none`. A browser that fails to un-block the document when
 * such a dialog closes leaves the page inert with no JavaScript error.
 *
 * The fix keeps `display` in the transition with `allow-discrete`, so the drawer
 * stays rendered until the slide-out finishes, and moves the unmount close into
 * its own effect so the deferred close is no longer cut off by its own cleanup.
 *
 * ## One assertion is a counterpart rather than a translation
 *
 * Upstream's first case asserts `transitionDuration` **contains `var(`**, which
 * is a jsdom artefact: jsdom never resolves custom properties, so the
 * declaration reads back verbatim. Chromium resolves it, so there is no `var(`
 * to find. The intent — *the hold stays tied to the motion token rather than a
 * literal, because the close delay is derived by reading this value back* — is
 * asserted here by comparing the resolved hold against the resolved
 * `--duration-medium`. That is the same guarantee, and a stronger one: it would
 * catch a literal that happened to equal the token today.
 *
 * Runs in the **client** project, so the transition is a real computed style
 * rather than an echoed declaration.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
	stubMatchMedia({ matches: true, reduceMotion: false });
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
});

const drawerProps = (isOpen: boolean) => ({
	navProps: { isOpen, onOpenChange: () => {}, 'data-testid': 'mobile-nav' },
	text: 'Nav content'
});

/** A closed `<dialog>` is `display: none`, so the testid engine skips it. */
const dialogIn = (container: HTMLElement) =>
	container.querySelector('[data-testid="mobile-nav"]') as HTMLDialogElement;

describe('MobileNav stays rendered while it closes', () => {
	it('transitions display with allow-discrete so it hides only once closed', async () => {
		const screen = await render(MobileNavProbe, { props: drawerProps(true) });
		const style = getComputedStyle(dialogIn(screen.container));

		// Without these two the drawer blanks out the instant `isOpen` flips,
		// leaving an open modal dialog that nothing renders — and nothing can
		// click past. See the file header.
		expect(style.transitionProperty).toContain('display');
		expect(style.transitionBehavior).toBe('allow-discrete');
		// A zero hold is the bug wearing the fix's clothes: the drawer stops being
		// rendered on the next style recalc, before any effect can close it.
		expect(style.transitionDuration.trim()).not.toBe('');
		expect(style.transitionDuration.trim()).not.toBe('0s');
		// The hold must stay tied to the motion token rather than a literal — see
		// the file header for why this differs from upstream's `var(` assertion.
		// Compared as durations, not as strings: the token is authored `.41s` and
		// the computed style normalises it to `0.41s`, so the two never match
		// textually even when they are the same hold. `parseShortestDurationMs` is
		// the component's own reader, which is the value that actually matters here.
		const token = getComputedStyle(document.documentElement).getPropertyValue('--duration-medium');
		expect(parseShortestDurationMs(token)).not.toBeNull();
		expect(parseShortestDurationMs(style.transitionDuration)).toBe(parseShortestDurationMs(token));
	});

	it('keeps the native dialog open until the slide-out has run', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawerProps(true) });
		const dialog = dialogIn(screen.container);
		expect(dialog).toHaveAttribute('open');

		await screen.rerender(drawerProps(false));

		// The drawer is on its way out but the dialog is still open, so it is
		// still rendered and still the thing holding the top layer.
		expect(dialog).toHaveAttribute('open');

		await vi.advanceTimersByTimeAsync(300);
		expect(dialog).not.toHaveAttribute('open');
	});

	it('still closes the dialog when unmounted mid-slide-out', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawerProps(true) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawerProps(false));
		expect(dialog).toHaveAttribute('open');

		// Teardown before the timer fires — the unmount-only effect has to close
		// the dialog, or the next showModal() is skipped and the drawer can never
		// be re-opened (#3091).
		screen.unmount();
		expect(dialog).not.toHaveAttribute('open');
	});

	it('still defers the close under prefers-reduced-motion', async () => {
		// Query-aware on purpose. A blanket `matches: true` is the stub shape that
		// once left 9 of 11 tests in the sibling edge-case file silently running
		// against a 0ms close delay — see the header of `stub-match-media.ts`.
		stubMatchMedia({ reduceMotion: true });
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawerProps(true) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawerProps(false));
		// Reduced motion caps the delay at 0 — but 0 is still a macrotask. What
		// must not happen is the close landing synchronously in the commit, while
		// the dialog is mid-flip. This pins deferral, not duration.
		expect(dialog).toHaveAttribute('open');

		await vi.advanceTimersByTimeAsync(20);
		expect(dialog).not.toHaveAttribute('open');
	});

	it('re-opening mid-slide-out cancels the pending close', async () => {
		vi.useFakeTimers();
		const screen = await render(MobileNavProbe, { props: drawerProps(true) });
		const dialog = dialogIn(screen.container);

		await screen.rerender(drawerProps(false));
		await screen.rerender(drawerProps(true));
		await vi.advanceTimersByTimeAsync(300);

		// The queued close must not fire after the drawer has been re-opened.
		expect(dialog).toHaveAttribute('open');
	});
});
