/** PORTS: MobileNav/MobileNavToggle.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AppShellFixture from './fixtures/app-shell-fixture.svelte';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Ported from Astryx's `MobileNav/MobileNavToggle.test.tsx`, all **3** cases at
 * the 0.5.0 pin. Nothing is dropped and nothing is added.
 *
 * This is `MobileNavToggle.test.tsx` and only that. `MobileNav.test.tsx`,
 * `MobileNavCloseEdgeCases.test.tsx`, `MobileNavCloseTiming.test.ts`,
 * `MobileNavCloseVisibility.test.tsx` and `MobileNavReopen.test.tsx` each have
 * their own file, one per upstream suite.
 *
 * What it pins: `mobile-nav-toggle.svelte` exposes `aria-expanded` and
 * `aria-controls`, so a screen-reader user knows the drawer's state and which
 * region the button targets. `aria-controls` is `AppShell`'s `mobileNavId`,
 * which `MobileNav` applies as the `<dialog>`'s own `id` — so the reference has
 * to resolve to the dialog element itself, not to a wrapper.
 *
 * ## Project
 *
 * The **client** project (real Chromium). The drawer is a native `<dialog>`
 * driven through `showModal()`, and `AppShell`'s breakpoint is a live
 * `MediaQueryList` — neither exists in the node project.
 *
 * ## Stubs, and which of upstream's are kept
 *
 * - **`showModal`/`close`** — upstream mocks these because jsdom implements
 *   neither. Chromium implements both, and the mock is kept for the reason
 *   `mobile-nav.svelte.test.ts`, `mobile-nav-reopen.svelte.test.ts`,
 *   `dialog.svelte.test.ts` and `lightbox.svelte.test.ts` all keep it: the real
 *   `showModal()` puts the dialog in the top layer and makes the rest of the
 *   document inert, which would take the toggle these cases query out of the
 *   accessibility tree the moment case 2 opens it. Installed per test and
 *   restored after, so it cannot leak.
 * - **`ResizeObserver`** — upstream's module-level `MockResizeObserver` is jsdom
 *   scaffolding (jsdom has none at all). Chromium has the real one and none of
 *   these three cases observes a spy, so substituting a fake would only mean the
 *   sticky-header path under `AppShell` runs against the fake. Not installed —
 *   the same call `app-shell.svelte.test.ts` documents.
 * - **`matchMedia`** — kept, and load-bearing: it is what puts `AppShell` below
 *   its breakpoint so the toggle renders at all. Upstream's blanket
 *   `matches: true` is replaced by the repo's query-aware `stubMatchMedia`,
 *   because a blanket `true` also answers `prefers-reduced-motion` and reroutes
 *   `MobileNav`'s close timing. See the header of `stub-match-media.ts`.
 *
 * ## Translations (neither is a dropped case)
 *
 * - Upstream's `TestShell` — a SideNav-only `AppShell` at breakpoint `md` — is
 *   `app-shell-fixture.svelte`'s `sideNav: 'test'` shape, which renders exactly
 *   upstream's `SideNavSection title="Test" isHeaderHidden` wrapping
 *   `SideNavItem label="Home"`. `mobile-nav-reopen.svelte.test.ts` already uses
 *   it for the same `TestShell`.
 * - `getAllByRole('dialog', {hidden: true})[0]` becomes
 *   `container.querySelector('dialog')`: a closed `<dialog>` is `display: none`
 *   and Playwright's role engine skips hidden nodes. Same shift the `MobileNav`
 *   and `AppShell` suites document.
 * - `fireEvent.click` becomes a native `element.click()`.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
	// Below the breakpoint so the mobile nav (and its toggle) render.
	stubMatchMedia({ matches: true, reduceMotion: false });
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

/** Upstream's `TestShell`. */
function renderTestShell() {
	return render(AppShellFixture, {
		props: {
			sideNav: 'test',
			sideNavLabel: 'Home',
			props: { mobileNav: { breakpoint: 'md' } }
		}
	});
}

describe('MobileNavToggle ARIA wiring', () => {
	it('exposes aria-expanded="false" when the drawer is closed', async () => {
		const screen = await renderTestShell();

		const toggle = screen.getByRole('button', { name: /open navigation/i });
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('exposes aria-expanded="true" after opening the drawer', async () => {
		const screen = await renderTestShell();

		const toggle = screen.getByRole('button', { name: /open navigation/i });
		(toggle.element() as HTMLElement).click();
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
	});

	it('references the nav drawer via aria-controls that resolves to the dialog', async () => {
		const screen = await renderTestShell();

		const toggle = screen.getByRole('button', { name: /open navigation/i }).element();
		const controls = toggle.getAttribute('aria-controls');
		expect(controls).toBeTruthy();

		const target = document.getElementById(controls as string);
		expect(target).not.toBeNull();
		expect(target).toBe(screen.container.querySelector('dialog'));
		expect(target?.tagName).toBe('DIALOG');
	});
});
