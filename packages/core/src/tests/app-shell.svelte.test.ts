/** PORTS: AppShell/AppShell.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { createAttachmentKey } from 'svelte/attachments';
import AppShellFixture from './fixtures/app-shell-fixture.svelte';
import AppShellI18n from './fixtures/app-shell-i18n.svelte';
import AppShellMobileProbe from './fixtures/app-shell-mobile-probe.svelte';

/**
 * Ported from Astryx's `AppShell/AppShell.test.tsx`, all **48** cases at the
 * 0.5.0 pin. Nothing is dropped. (Re-derived at the 0.5.0 pin, where this header
 * last read v0.4.5: upstream's file has not moved since, so 48 still holds.)
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header once read "all 38 cases". Upstream had **42**, and the four
 * missing ones were never named: `moves focus to the main content when the skip
 * link is activated`, `skip link text comes from the i18n catalog`, and the
 * `Banner landmark` pair (`exposes the header region as a banner landmark`,
 * `does not render a banner landmark without header content`). All four were
 * ported and all four passed on the first run — the component already had the
 * behaviour; only the assertions were absent.
 *
 * v0.4.1 (#4944) took it to **48**, and the six are ported here: the
 * `Keyboard operation` pair, the `Banner landmark on the mobile top bar` pair
 * that covers the new `role` on the sidenav-only top bar, and the
 * `useAppShellMobile` pair.
 *
 * ## Project
 *
 * The **client** project (real Chromium). The mobile drawer is a native
 * `<dialog>`, `useMediaQuery` subscribes to a live `MediaQueryList`, the sticky
 * assertions read computed styles out of the compiled StyleX sheet, and the two
 * `ResizeObserver` cases need a real observer constructor to stub over — none of
 * which the node project has.
 *
 * ## Stubs, and which of upstream's are kept
 *
 * - **`matchMedia`** — kept verbatim, and load-bearing. `useMediaQuery`
 *   subscribes in `$effect.pre`, so every breakpoint case is driven by what
 *   `window.matchMedia(query).matches` reports; without the stub these tests
 *   would report the size of whatever window Playwright happened to open.
 * - **`showModal`/`close`** — kept, as in `dialog.svelte.test.ts` and
 *   `lightbox.svelte.test.ts`, so the drawer's `open` attribute is the only thing
 *   that moves and the real top-layer/focus side effects stay out of the way.
 * - **`ResizeObserver`** — upstream's *module-level* `MockResizeObserver` is
 *   jsdom scaffolding (jsdom has no `ResizeObserver` at all); Chromium has the
 *   real one, and substituting a fake for the whole file would make the sticky
 *   cases test the fake. It is therefore not installed globally. The two
 *   per-case stubs are upstream's own and are kept **verbatim**, because there
 *   the spy *is* the assertion. Those two rely on the shared observer having been
 *   released — `unobserveResize` disconnects and nulls the singleton once the
 *   last element goes, which the auto-cleanup between renders guarantees.
 *
 * ## Translations
 *
 * - Every slot is a `Snippet`, so upstream's inline JSX shapes are enumerated in
 *   `app-shell-fixture.svelte`. `isRenderable` is Svelte-obviated: a snippet is
 *   never `''` or a boolean, so `topNav != null` is the exact analogue.
 * - `getByRole('dialog', {hidden: true})` becomes `container.querySelector`.
 *   A closed `<dialog>` is `display: none`, and Playwright's role engine skips
 *   hidden nodes by default; the dialog suite documents the same shift.
 * - `getAllByText` becomes `textMatches()` below, which reproduces
 *   testing-library's rule exactly (an element matches on its **own** text
 *   children, so wrappers do not double-count) and, unlike a role query, sees
 *   into the closed drawer where the counted nodes actually live.
 * - `getByText(…)` carries `{exact: true}` throughout. Playwright's text engine
 *   is substring-and-case-insensitive by default where testing-library's is
 *   exact, and the difference is observable here: `getByText('Content')` would
 *   otherwise also match the skip link's "Skip to content". The option restores
 *   upstream's semantics rather than departing from them.
 * - `getAllByRole` becomes `screen.getByRole(…).elements()`, as in `calendar`.
 * - Upstream's `MobileProbe` is `fixtures/app-shell-mobile-probe.svelte`. Svelte
 *   has no `renderHook`, so the hook runs inside a component that renders its
 *   result — the probe-fixture substitute CLAUDE.md describes.
 * - `act()` disappears: a `$state` write flushes on its own.
 *
 * ## Cases that changed shape
 *
 * - `forwards ref to root element` → **counterpart**. This port has no `ref`
 *   prop; the root element reaches a consumer through an attachment passed in
 *   rest props, which `AppShell` spreads onto it. Receiving the element checks
 *   more than upstream's `ref.mock.calls[0][0]`, which only proves a callback
 *   ran — the identity assertion is kept.
 * - `wraps header in sticky container in auto mode` and `does not apply sticky
 *   wrapper in fill mode` → **restated**; see the cases.
 * - `does not show auto mobile toggle when sideNav is omitted entirely` is
 *   upstream's second half of the `#2243` pair. Svelte cannot tell
 *   `sideNav={undefined}` from an absent attribute *at the component*, but the
 *   fixture still renders two genuinely different `<AppShell>` invocations so the
 *   pair stays two renders rather than one duplicated call.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

// Mock matchMedia — upstream's helper, verbatim.
function createMockMatchMedia(matches: boolean) {
	const listeners: ((e: MediaQueryListEvent) => void)[] = [];
	const mql = {
		matches,
		media: '',
		onchange: null,
		addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
			listeners.push(handler);
		}),
		removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
			const idx = listeners.indexOf(handler);
			if (idx >= 0) {
				listeners.splice(idx, 1);
			}
		}),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
		// Expose for test control
		_listeners: listeners,
		_setMatches: (newMatches: boolean) => {
			mql.matches = newMatches;
			for (const listener of listeners) {
				listener({ matches: newMatches } as MediaQueryListEvent);
			}
		}
	};
	return mql;
}

let mockMql: ReturnType<typeof createMockMatchMedia>;

beforeEach(() => {
	mockMql = createMockMatchMedia(false);
	vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMql));
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

/** Put the mock below the breakpoint, as upstream's mobile cases do. */
function goMobile(): void {
	mockMql = createMockMatchMedia(true);
	vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMql));
}

/**
 * `getAllByText`, reproduced. Testing-library matches an element on the text of
 * its **direct** text children only, which is what keeps a wrapper from counting
 * alongside the node that actually holds the text.
 */
function textMatches(container: HTMLElement, text: string): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('*')).filter(
		(el) =>
			Array.from(el.childNodes)
				.filter((node) => node.nodeType === Node.TEXT_NODE)
				.map((node) => node.textContent ?? '')
				.join('')
				.replace(/\s+/g, ' ')
				.trim() === text
	);
}

describe('AppShell', () => {
	// ===========================================================================
	// Basic rendering
	// ===========================================================================

	it('renders children as main content', async () => {
		const screen = await render(AppShellFixture, { props: { content: 'Main content' } });
		await expect.element(screen.getByText('Main content', { exact: true })).toBeInTheDocument();
	});

	it('renders main element with role="main"', async () => {
		const screen = await render(AppShellFixture, { props: {} });
		await expect.element(screen.getByRole('main')).toBeInTheDocument();
	});

	it('renders topNav in the header area', async () => {
		const screen = await render(AppShellFixture, {
			props: { topNav: 'div', topNavText: 'Top Nav' }
		});
		await expect.element(screen.getByText('Top Nav', { exact: true })).toBeInTheDocument();
	});

	it('renders banner when provided', async () => {
		const screen = await render(AppShellFixture, { props: { banner: 'System banner' } });
		await expect.element(screen.getByText('System banner', { exact: true })).toBeInTheDocument();
	});

	it('renders sideNav in a nav element', async () => {
		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });
		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
		await expect.element(screen.getByText('Nav', { exact: true })).toBeInTheDocument();
	});

	it('renders without optional slots', async () => {
		const screen = await render(AppShellFixture, { props: { content: 'Just content' } });
		await expect.element(screen.getByText('Just content', { exact: true })).toBeInTheDocument();
		expect(screen.container.querySelector('nav, [role="navigation"]')).not.toBeInTheDocument();
	});

	it('supports data-testid', async () => {
		const screen = await render(AppShellFixture, {
			props: { props: { 'data-testid': 'my-shell' } }
		});
		await expect.element(screen.getByTestId('my-shell')).toBeInTheDocument();
	});

	// ===========================================================================
	// Skip-to-content link
	// ===========================================================================

	it('renders a skip-to-content link', async () => {
		const screen = await render(AppShellFixture, { props: {} });
		const skipLink = screen.getByTestId('skip-to-content');
		await expect.element(skipLink).toBeInTheDocument();
		await expect.element(skipLink).toHaveAttribute('href', '#astryx-app-shell-main');
		// `.trim()` only strips the template indentation JSX would have stripped for
		// upstream; the asserted string is upstream's.
		expect(skipLink.element().textContent?.trim()).toBe('Skip to content');
	});

	it('main content has the correct id for skip link', async () => {
		const screen = await render(AppShellFixture, { props: {} });
		await expect.element(screen.getByRole('main')).toHaveAttribute('id', 'astryx-app-shell-main');
	});

	it('moves focus to the main content when the skip link is activated', async () => {
		const screen = await render(AppShellFixture, { props: {} });
		const skipLink = screen.getByTestId('skip-to-content').element() as HTMLElement;
		const main = screen.getByRole('main').element();
		// The target must be programmatically focusable for focus to move
		expect(main).toHaveAttribute('tabindex', '-1');
		// Upstream's `fireEvent.click`: a plain, untrusted DOM dispatch. Playwright's
		// real click would also scroll the anchor's target into view and assert its
		// own actionability, neither of which is what this case is about.
		skipLink.click();
		expect(document.activeElement).toBe(main);
	});

	it('skip link text comes from the i18n catalog', async () => {
		const screen = await render(AppShellI18n, {
			props: {
				locale: 'en',
				overrides: { en: { '@astryx.appShell.skipToContent': 'Jump to main' } }
			}
		});
		// `.trim()` only strips the template indentation JSX would have stripped for
		// upstream; the asserted string is upstream's.
		expect(screen.getByTestId('skip-to-content').element().textContent?.trim()).toBe(
			'Jump to main'
		);
	});

	// ===========================================================================
	// Banner landmark
	// ===========================================================================

	it('exposes the header region as a banner landmark', async () => {
		const screen = await render(AppShellFixture, {
			props: { topNav: 'div', topNavText: 'Top Nav' }
		});
		const banner = screen.getByRole('banner');
		await expect.element(banner).toBeInTheDocument();
		// banner must be top-level — not nested inside another landmark
		expect(screen.getByRole('main').element()).not.toContainElement(banner.element());
	});

	it('does not render a banner landmark without header content', async () => {
		const screen = await render(AppShellFixture, { props: {} });
		expect(screen.container.querySelector('[role="banner"]')).toBeNull();
	});

	// ===========================================================================
	// SideNav accessibility
	// ===========================================================================

	it('sideNav has aria-label', async () => {
		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });
		await expect
			.element(screen.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Side navigation');
	});

	// ===========================================================================
	// SideNav collapse — uncontrolled
	// ===========================================================================

	it('sideNav is visible by default (uncontrolled)', async () => {
		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });
		await expect.element(screen.getByText('Nav', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
	});

	// (Collapse tests removed upstream — collapse is managed by SideNav, not AppShell)

	// ===========================================================================
	// Responsive breakpoint
	// ===========================================================================

	it('tracks breakpoint changes', async () => {
		await render(AppShellFixture, {
			props: { sideNav: 'test', props: { mobileNav: { breakpoint: 'md' } } }
		});

		// matchMedia should have been called for the breakpoint
		expect(window.matchMedia).toHaveBeenCalled();
	});

	it('does not enter mobile mode when mobileNav breakpoint is none', async () => {
		const screen = await render(AppShellFixture, {
			props: { sideNav: 'test', props: { mobileNav: { breakpoint: 'none' } } }
		});

		// breakpoint 'none' uses (max-width: 0px) which never matches,
		// so sideNav stays inline and no mobile nav toggle appears
		await expect.element(screen.getByText('Nav', { exact: true })).toBeInTheDocument();
		// **Restated.** Upstream queries `{name: /menu/i}`, which no toggle has ever
		// matched — the button is labelled "Open navigation" on both sides, so that
		// query would pass even with the toggle present. The assertion is redirected
		// at the label the toggle actually carries, which is what the title claims.
		expect(
			screen.container.querySelector('button[aria-label="Open navigation"]')
		).not.toBeInTheDocument();
	});

	// ===========================================================================
	// Mobile overlay (default MobileNav wrapping sideNav)
	// ===========================================================================

	it('shows default mobile nav when below breakpoint and not collapsed', async () => {
		// Start below breakpoint with sideNav expanded
		goMobile();

		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });

		// Should show default mobile nav (MobileNav wrapping sideNav)
		expect(screen.container.querySelector('dialog')).toBeInTheDocument();
		// Should show nav content inside the mobile nav. Upstream's `getByText`
		// throws on both zero and more-than-one, so a length-of-1 assertion is the
		// same guarantee — and it reads the closed drawer, which a role/text
		// locator would skip as hidden.
		expect(textMatches(screen.container, 'Nav')).toHaveLength(1);
	});

	it('renders default mobile nav when below breakpoint', async () => {
		goMobile();

		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });

		// Default mobile nav should be rendered when below breakpoint
		expect(screen.container.querySelector('dialog')).toBeInTheDocument();
	});

	it('keeps TopNav children in the combined mobile drawer with sideNav content', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: { topNav: 'with-item', sideNav: 'test', sideNavLabel: 'Side item' }
		});

		await expect
			.element(screen.getByRole('button', { name: /open navigation/i }))
			.toBeInTheDocument();
		expect(screen.container.querySelectorAll('dialog').length).toBeGreaterThan(0);
		// `getByText('Home')` upstream, so exactly one — a length-of-1 assertion is
		// the same guarantee. `Side item` keeps upstream's `getAllByText(…).length`.
		expect(textMatches(screen.container, 'Home')).toHaveLength(1);
		expect(textMatches(screen.container, 'Side item').length).toBeGreaterThan(0);
	});

	it('shows mobile nav toggle for sideNav-only layout with heading-only topNav (#2243)', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'heading-only',
				sideNav: 'test',
				sideNavLabel: 'Home',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});

		await expect
			.element(screen.getByRole('button', { name: /open navigation/i }))
			.toBeInTheDocument();
	});

	it('renders sidenav items exactly once in mobile drawer when topNav has only heading (#2243)', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'heading-only',
				sideNav: 'two-items',
				props: { variant: 'section', mobileNav: { breakpoint: 'md' }, contentPadding: 4 }
			}
		});

		await expect
			.element(screen.getByRole('button', { name: /open navigation/i }))
			.toBeInTheDocument();
		expect(textMatches(screen.container, 'Dashboard')).toHaveLength(1);
		expect(textMatches(screen.container, 'Settings')).toHaveLength(1);
	});

	it('does not show auto mobile toggle when sideNav is explicitly undefined (#2243)', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'heading-only',
				sideNav: 'none',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});

		expect(
			screen.container.querySelector('button[aria-label="Open navigation"]')
		).not.toBeInTheDocument();
	});

	it('does not show auto mobile toggle when sideNav is omitted entirely', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'heading-only',
				sideNav: 'omitted',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});

		expect(
			screen.container.querySelector('button[aria-label="Open navigation"]')
		).not.toBeInTheDocument();
	});

	it('heading-only topNav does not prevent sidenav from collapsing to mobile (#2243)', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'heading-only',
				sideNav: 'test',
				sideNavLabel: 'Home',
				props: { mobileNav: { breakpoint: 'md' } }
			}
		});

		const inlinePanel = screen.container.querySelector('.astryx-layout-panel');
		expect(inlinePanel).toBeNull();
	});

	it('renders mobile layout on first render when defaultIsMobile is true', async () => {
		// matchMedia says mobile too — simulates correct SSR hint
		goMobile();

		const screen = await render(AppShellFixture, {
			props: { sideNav: 'test', props: { mobileNav: { defaultIsMobile: true } } }
		});

		// SideNav should NOT be rendered inline — it's in the mobile drawer
		const inlinePanel = screen.container.querySelector(
			'.astryx-app-shell > .astryx-layout .astryx-layout-panel'
		);
		expect(inlinePanel).toBeNull();
	});

	// ===========================================================================
	// Height modes
	// ===========================================================================

	it('defaults to fill mode', async () => {
		const screen = await render(AppShellFixture, { props: { props: { 'data-testid': 'shell' } } });
		// The root element should exist (fill is default)
		await expect.element(screen.getByTestId('shell')).toBeInTheDocument();
	});

	it('supports auto height mode', async () => {
		const screen = await render(AppShellFixture, {
			props: { props: { height: 'auto', 'data-testid': 'shell' } }
		});
		await expect.element(screen.getByTestId('shell')).toBeInTheDocument();
	});

	it('renders topNav in auto mode', async () => {
		const screen = await render(AppShellFixture, {
			props: { topNav: 'div', props: { height: 'auto', 'data-testid': 'shell' } }
		});
		await expect.element(screen.getByText('Nav', { exact: true })).toBeInTheDocument();
	});

	// ===========================================================================
	// Sticky navigation in auto mode
	// ===========================================================================

	it('wraps header in sticky container in auto mode', async () => {
		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'div',
				topNavTestId: 'topnav',
				props: { height: 'auto', 'data-testid': 'shell' }
			}
		});
		const topNav = screen.getByTestId('topnav').element() as HTMLElement;
		// Upstream walks topNav -> LayoutHeader div -> "sticky wrapper div" and then
		// asserts `style.position || getComputedStyle(...).position` is *defined* —
		// which is true of every element that exists, and of the wrong element here:
		// `LayoutHeader` renders an outer and an inner div on both sides, so the
		// grandparent is the LayoutHeader root, not the sticky wrapper. The walk is
		// kept (it still proves the nesting depth), and the vacuous half is
		// **restated** to assert what the title claims, on the element that actually
		// carries the sticky style.
		const headerWrapper = topNav.parentElement?.parentElement;
		expect(headerWrapper).toBeTruthy();
		const stickyWrapper = screen.container.querySelector('.astryx-app-shell-header');
		expect(getComputedStyle(stickyWrapper as Element).position).toBe('sticky');
	});

	it('does not apply sticky wrapper in fill mode', async () => {
		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'div',
				topNavTestId: 'topnav',
				props: { height: 'fill', 'data-testid': 'shell' }
			}
		});
		// In fill mode, header still renders but without sticky wrapper styles.
		// Upstream only asserts the first half; the second is **restated** from
		// "the topnav is in the document" to the negative the title states, so this
		// case and its `auto` twin actually bracket the behaviour.
		await expect.element(screen.getByTestId('topnav')).toBeInTheDocument();
		const headerWrapper = screen.container.querySelector('.astryx-app-shell-header');
		expect(getComputedStyle(headerWrapper as Element).position).not.toBe('sticky');
	});

	it('wraps sideNav in sticky container in auto mode', async () => {
		const screen = await render(AppShellFixture, {
			props: {
				topNav: 'div',
				sideNav: 'div',
				props: { height: 'auto', 'data-testid': 'shell' }
			}
		});
		await expect.element(screen.getByTestId('sidenav')).toBeInTheDocument();
		// The sideNav should be wrapped in a sticky div in auto mode
		const sideNav = screen.getByTestId('sidenav').element() as HTMLElement;
		// sideNav -> LayoutPanel div -> sticky wrapper div
		const stickyWrapper = sideNav.parentElement?.parentElement;
		expect(stickyWrapper).toBeTruthy();
	});

	it('sets up ResizeObserver on header in auto mode', async () => {
		const observeSpy = vi.fn();
		const disconnectSpy = vi.fn();
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(public callback: ResizeObserverCallback) {}
				observe = observeSpy;
				unobserve = vi.fn();
				disconnect = disconnectSpy;
			}
		);

		await render(AppShellFixture, {
			props: { topNav: 'div', props: { height: 'auto', 'data-testid': 'shell' } }
		});

		expect(observeSpy).toHaveBeenCalled();
	});

	it('does not set up ResizeObserver in fill mode', async () => {
		const observeSpy = vi.fn();
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(public callback: ResizeObserverCallback) {}
				observe = observeSpy;
				unobserve = vi.fn();
				disconnect = vi.fn();
			}
		);

		await render(AppShellFixture, {
			props: { topNav: 'div', props: { height: 'fill', 'data-testid': 'shell' } }
		});

		expect(observeSpy).not.toHaveBeenCalled();
	});

	// ===========================================================================
	// Mobile nav slot
	// ===========================================================================

	it('renders mobileNav slot content', async () => {
		const screen = await render(AppShellFixture, {
			props: {
				sideNav: 'test',
				mobileNav: {
					isOpen: true,
					header: 'Test App',
					'data-testid': 'appshell-mobile-nav',
					text: 'Mobile Nav Content'
				}
			}
		});
		await expect.element(screen.getByTestId('appshell-mobile-nav')).toBeInTheDocument();
		await expect
			.element(screen.getByText('Mobile Nav Content', { exact: true }))
			.toBeInTheDocument();
	});

	it('does not render mobileNav when not provided', async () => {
		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });
		expect(
			screen.container.querySelector('[data-testid="appshell-mobile-nav"]')
		).not.toBeInTheDocument();
	});

	it('uses explicit mobileNav instead of default when provided', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: {
				sideNav: 'test',
				mobileNav: { isOpen: false, 'data-testid': 'appshell-mobile-nav', text: 'Mobile Nav' }
			}
		});
		// Default auto-generated mobile nav should NOT appear — only the explicit one
		const dialogs = screen.container.querySelectorAll('dialog');
		expect(dialogs).toHaveLength(1);
		// Explicit mobileNav slot should be rendered
		expect(screen.container.querySelector('[data-testid="appshell-mobile-nav"]')).toBeTruthy();
	});

	it('mobileNav onOpenChange is called when close button is clicked', async () => {
		const onClose = vi.fn();
		const screen = await render(AppShellFixture, {
			props: {
				sideNav: 'test',
				mobileNav: { isOpen: true, header: 'Nav', onOpenChange: onClose, text: 'Mobile Nav' }
			}
		});
		const closeButton = screen.getByRole('button', { name: /close/i });
		(closeButton.element() as HTMLElement).click();
		expect(onClose).toHaveBeenCalled();
	});

	// ===========================================================================
	// Content padding
	// ===========================================================================

	it('passes contentPadding to main content area', async () => {
		const screen = await render(AppShellFixture, {
			props: { props: { contentPadding: 4, 'data-testid': 'shell' } }
		});
		// Main content should render — contentPadding is passed through
		await expect.element(screen.getByRole('main')).toBeInTheDocument();
		await expect.element(screen.getByText('Content', { exact: true })).toBeInTheDocument();
	});

	it('defaults to contentPadding={0} when not specified', async () => {
		const screen = await render(AppShellFixture, { props: { props: { 'data-testid': 'shell' } } });
		// Should render without error — padding=0 is the default
		await expect.element(screen.getByRole('main')).toBeInTheDocument();
	});

	it('supports contentPadding={0} for full-bleed content', async () => {
		const screen = await render(AppShellFixture, {
			props: { content: 'Full bleed content', props: { contentPadding: 0, 'data-testid': 'shell' } }
		});
		await expect
			.element(screen.getByText('Full bleed content', { exact: true }))
			.toBeInTheDocument();
	});

	// ===========================================================================
	// Ref forwarding
	// ===========================================================================

	it('forwards ref to root element', async () => {
		// Counterpart, not a translation: there is no `ref` prop in this port. The
		// root element reaches a consumer through an attachment in rest props, and
		// asserting it *is* the `data-testid="shell"` node keeps upstream's identity
		// check while proving more than "a callback ran".
		const attached = vi.fn();
		const screen = await render(AppShellFixture, {
			props: { props: { 'data-testid': 'shell', [createAttachmentKey()]: attached } }
		});
		expect(attached).toHaveBeenCalled();
		expect(attached.mock.calls[0][0]).toBe(screen.getByTestId('shell').element());
	});

	// ===========================================================================
	// Keyboard operation
	//
	// Upstream's note here is about jsdom: the drawer's focus TRAP and focus
	// RESTORE are native `<dialog>` behaviour that its shim cannot express, so
	// upstream verified those two in Chromium and asserts only the keyboard path
	// and the ARIA wiring. This project runs in Chromium already, but the same
	// two are still out of reach for the same reason one level down — this file
	// stubs `showModal`/`close` so the drawer's `open` attribute is all that
	// moves, which is what keeps the real top layer from swallowing focus. The
	// scope of the two cases is therefore upstream's, unchanged.
	// ===========================================================================

	it('reaches the skip link with Tab and moves focus to main with Enter', async () => {
		const screen = await render(AppShellFixture, { props: { topNav: 'label-only' } });

		await userEvent.tab();
		const skipLink = screen.getByTestId('skip-to-content');
		await expect.element(skipLink).toHaveFocus();

		await userEvent.keyboard('{Enter}');
		await expect.element(screen.getByRole('main')).toHaveFocus();
	});

	it('opens the mobile drawer from the keyboard and points the toggle at it', async () => {
		goMobile();

		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });

		const toggle = screen.getByRole('button', { name: 'Open navigation', exact: true });
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');

		(toggle.element() as HTMLElement).focus();
		await userEvent.keyboard('{Enter}');

		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
		// `getByRole('dialog', {hidden: true})` upstream; a closed `<dialog>` is
		// `display: none` and Playwright's role engine skips hidden nodes, so the
		// drawer is read off the container as everywhere else in this file.
		const drawer = screen.container.querySelector('dialog');
		expect(drawer).not.toBeNull();
		// aria-controls has to name the drawer that actually opened, or a screen
		// reader cannot follow the toggle to it.
		expect((toggle.element() as HTMLElement).getAttribute('aria-controls')).toBe(drawer?.id);
		expect(drawer?.id).toBeTruthy();
	});

	// ===========================================================================
	// Banner landmark on the mobile top bar
	// ===========================================================================

	it('exposes the mobile top bar as a banner landmark in a sidenav-only layout', async () => {
		goMobile();

		const screen = await render(AppShellFixture, { props: { sideNav: 'test' } });

		// Same landmark structure as the topNav layout: one banner region holding
		// the top bar, whichever nav slots the page happens to fill.
		await expect.element(screen.getByRole('banner')).toBeInTheDocument();
	});

	it('renders exactly one banner landmark when a banner slot joins the mobile top bar', async () => {
		goMobile();

		const screen = await render(AppShellFixture, {
			props: { banner: 'Announcement', sideNav: 'test' }
		});

		// `getAllByRole` upstream; `.elements()` is this project's counterpart.
		expect(screen.getByRole('banner').elements()).toHaveLength(1);
	});

	// ===========================================================================
	// useAppShellMobile
	//
	// Upstream's `MobileProbe` is `fixtures/app-shell-mobile-probe.svelte`: Svelte
	// has no `renderHook`, so the hook runs in a component that renders its result.
	// ===========================================================================

	it('useAppShellMobile is inert outside an AppShell', async () => {
		const screen = await render(AppShellMobileProbe);
		expect(JSON.parse(screen.getByTestId('probe').element().textContent ?? '')).toEqual({
			isMobile: false,
			isMobileNavOpen: false,
			isMobileNavEnabled: false,
			hasId: false
		});
	});

	it('useAppShellMobile reports the shell mobile state and drawer id', async () => {
		goMobile();

		const screen = await render(AppShellFixture, { props: { probe: true, sideNav: 'test' } });

		expect(JSON.parse(screen.getByTestId('probe').element().textContent ?? '')).toEqual({
			isMobile: true,
			isMobileNavOpen: false,
			isMobileNavEnabled: true,
			hasId: true
		});

		await userEvent.click(screen.getByRole('button', { name: 'Open navigation', exact: true }));

		// `expect.poll` rather than a bare read: upstream's assertion follows a
		// React re-render that `act()` has already flushed, and the retrying form
		// is this project's counterpart to that.
		await expect
			.poll(
				() => JSON.parse(screen.getByTestId('probe').element().textContent ?? '').isMobileNavOpen
			)
			.toBe(true);
	});
});
