import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AppShellFixture from './fixtures/app-shell-fixture.svelte';

/**
 * Ported from Astryx's `MobileNav/MobileNavReopen.test.tsx`, its single case.
 * Nothing is dropped, and nothing is added.
 *
 * ## What this file pins, and what it cannot
 *
 * Upstream's regression is: the OOTB hamburger drawer opens and closes once,
 * then can never be re-opened. The mechanism is React-specific. Upstream mounts
 * the drawer inside `<React.Activity mode>` and flips it to `hidden` on close;
 * React then runs the drawer's effect *cleanup* with a stale `isOpen` instead of
 * re-running the effect with `isOpen: false`, so the close branch never fires and
 * the `<dialog>` is left `open` in the hidden tree — after which `showModal()` is
 * a permanent no-op. `MobileNav`'s unconditional `dialog.close()` on teardown is
 * the fix.
 *
 * Svelte has no `<Activity>` counterpart, so this port always takes the shape
 * upstream itself falls back to on React 19.0/19.1: the drawer is plainly mounted
 * below the breakpoint and `MobileNav`'s own `isOpen` owns visibility. The
 * *cycle* the case exercises — open, close, open again — is therefore fully
 * reproducible, and it is the assertion that matters. What has **no counterpart**
 * is the Activity-teardown path that produced the bug, because that path does not
 * exist here.
 *
 * That has a consequence worth stating plainly, since it bounds what a green run
 * here means. Mutation-checked: deleting `MobileNav`'s teardown `dialog.close()`
 * leaves this case **passing**, because with the drawer plainly mounted the
 * effect *re-runs* on close and the delayed branch closes the dialog anyway.
 * Deleting *both* close paths fails it at step 2. So this pins the cycle, not the
 * teardown; the teardown is kept in `MobileNav` because it is also what stops a
 * drawer unmounted mid-open from holding the browser's top layer, and because it
 * is upstream's code.
 *
 * ## Translations
 *
 * - `vi.useFakeTimers()` + `advanceTimersByTime(300)` are **dropped from the
 *   mechanism, not from the assertions**. The delayed `close()` is dead code on
 *   both sides: an effect runs its teardown before it re-runs, so the teardown's
 *   `dialog.close()` has already fired by the time the `isOpen: false` pass
 *   reaches the delayed branch. Faking timers here would also be actively wrong —
 *   Vitest's default fake set includes `queueMicrotask`, which is what Svelte
 *   schedules on, so mount and unmount would stall. All three of upstream's
 *   `open`-attribute assertions are kept, in order.
 * - `getAllByRole('dialog', {hidden: true})[0]` becomes
 *   `container.querySelector('dialog')`: a closed `<dialog>` is `display: none`
 *   and Playwright's role engine skips hidden nodes.
 * - `fireEvent.click` becomes a native `element.click()`.
 * - `showModal`/`close` are mocked as in every other dialog-driven suite here, so
 *   the `open` attribute is the only thing that moves.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

function createMockMatchMedia(matches: boolean) {
	return {
		matches,
		media: '',
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn()
	};
}

beforeEach(() => {
	vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(createMockMatchMedia(true)));
	HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
});

describe('Mobile nav re-open after close (uncontrolled OOTB)', () => {
	it('can be opened, closed, then opened again', async () => {
		// Upstream's `TestShell`: a SideNav-only AppShell at breakpoint `md`.
		const screen = await render(AppShellFixture, {
			props: {
				sideNav: 'test',
				sideNavLabel: 'Home',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});

		const getDialog = (): HTMLDialogElement =>
			screen.container.querySelector('dialog') as HTMLDialogElement;
		const openToggle = (): HTMLElement =>
			screen.getByRole('button', { name: /open navigation/i }).element() as HTMLElement;

		// 1. Open
		openToggle().click();
		await vi.waitFor(() => {
			expect(getDialog()).toHaveAttribute('open');
		});

		// 2. Close via the drawer's close button
		(screen.getByRole('button', { name: /close navigation/i }).element() as HTMLElement).click();
		await vi.waitFor(() => {
			expect(getDialog()).not.toHaveAttribute('open');
		});

		// 3. Open AGAIN — this is the bug: it should re-open
		openToggle().click();
		await vi.waitFor(() => {
			expect(getDialog()).toHaveAttribute('open');
		});
	});
});
