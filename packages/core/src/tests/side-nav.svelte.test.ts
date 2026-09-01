/** PORTS: SideNav/SideNav.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import CustomLink from './fixtures/custom-link.svelte';
import CollapseHandleFixture from './fixtures/side-nav-collapse-handle-fixture.svelte';
import Fixture from './fixtures/side-nav-fixture.svelte';
import HeadingFixture from './fixtures/side-nav-heading-fixture.svelte';
import IntegrationFixture from './fixtures/side-nav-integration-fixture.svelte';
import ItemFixture from './fixtures/side-nav-item-fixture.svelte';
import SectionFixture from './fixtures/side-nav-section-fixture.svelte';
import { expectNoSharedFocusRing, expectSharedFocusRing } from './shared-focus-ring.js';
import SizeRefFixture from './fixtures/button-size-reference.svelte';
import CollapseButtonScope from './fixtures/side-nav-collapse-button-scope.svelte';

/**
 * Ported from Astryx's `SideNav/SideNav.test.tsx`. Upstream declares **144**
 * cases at the **0.5.0** pin (it had 99 at v0.3.0, 101 at v0.4.1 and the same
 * 144 at v0.4.2, where this header last stated it — upstream has not moved the
 * file since); **116 are here**, so the suite is **28 short**. Twenty-six of the
 * 28 are named in `port/debts.md`, and the block-level summary below says which.
 * The other two predate that delta and are named here: `centers footer content
 * when collapsed, matching children alignment` (in `SideNav`) and `anchors the
 * collapsed icon-only trigger so the popover positions against it` (in
 * `SideNavHeading collapsed`). The header used to claim all 28 were recorded in
 * `port/debts.md`, which its own "Twenty-six are not" line below contradicted.
 *
 * ## The 0.4.2 delta, stated rather than implied
 *
 * The hardening pass added 43 cases. **Seventeen are here**, chosen as the ones
 * that verify what that pass actually changed:
 *
 * - `menu hover/click guard` (4) — the #3121 `useMenuHover` consolidation, which
 *   this port rewrote from scratch in the same batch.
 * - `SideNav focus ring (A15)` (8) — every focusable row draws the *shared* ring,
 *   including each half of a split-action row and not the row itself.
 * - `SideNav size cascade` (5) — the sidenav publishes its row size to the parts
 *   of its own output that did not size themselves, which is what
 *   `internal/size-scope.svelte` (upstream's `SizeProvider`) exists for.
 *
 * **Twenty-six are not**: the forced-colors compiled-output assertions, the
 * flyout hover-intent and coarse-pointer gates, the collapsed-submenu keyboard
 * path, Tab order, and the catalog-named submenu dialog. Named individually in
 * `port/debts.md`. They are behaviour this suite does exercise in other shapes,
 * and porting them properly is a batch of its own — a hurried pass produces
 * assertions weakened to fit, which is the failure the 0.4.2 audits caught.
 *
 * ## The count, re-derived from the tag (an earlier header was wrong twice)
 *
 * This header has twice stated a count that was true of no upstream tag —
 * first "all 94", then "all 99 … at v0.3.0" while the pin had moved to 0.4.2.
 * The count is a contract against *upstream's file at the current pin*, so it
 * is re-derived here rather than carried forward.
 *
 * Of the five absent at the v0.3.0 re-derivation: they were the heading-menu popup
 * semantics assertions (the APG "a popup menu is not a dialog" block plus its
 * collapsed-mode sibling), and they are here now. They needed one fixture
 * addition — `side-nav-heading-fixture`'s `menuItems`, which fills the `menu`
 * slot with `role="menuitem"` divs the way upstream's inline fragment does —
 * and, in `keeps the popup heading button outside the menu`, a native `.click()`
 * for upstream's `fireEvent.click`, since the open popover overlaps the trigger
 * and a Playwright hit-test would be asserting geometry rather than semantics.
 *
 * Runs in the **client** (real Chromium) project. Three of the twelve blocks
 * depend on a real popover: `SideNavHeading`'s chevron trigger, `SideNavItem`'s
 * collapsed flyout, and the accessible-name sweep all rely on a *closed*
 * `[popover]` being `display: none` and therefore out of the accessibility tree
 * — which is exactly what makes upstream's `getByRole('button')` single-match
 * with a second button sitting inside the popover. Faking that would substitute
 * a model of the thing under test for the thing itself.
 *
 * Standing translations, each following a pattern an earlier suite set:
 *
 * - **Every slot is a `Snippet`.** `header`/`topContent`/`footer`/`footerIcons`/
 *   `children` on `SideNav`, `icon`/`menu`/`headerEndContent` on
 *   `SideNavHeading`, `icon`/`endContent`/`children` on `SideNavItem`, and
 *   `endContent` on `SideNavSection` all go through fixtures, because a Svelte
 *   snippet can only be authored in a template. Nested `SideNavItem`s become a
 *   recursive spec (`side-nav-item-node.svelte`), as `TreeList`'s items did.
 * - **`icon={StubIcon}` becomes a snippet** rendering `<svg
 *   data-testid="stub-icon" />`. Upstream's `ReactNode | IconType` is
 *   `IconName | Snippet` here; `renderIconSlot` is Svelte-obviated, and the
 *   `IconType` half is the branch a snippet stands in for.
 * - **Context providers become scope components.** React scopes a context by
 *   wrapping a subtree in `<SideNavCollapseContext value={…}>`; Svelte reads
 *   context at component init, so scoping needs a component boundary.
 *   `SideNavCollapseScope`, `SideNavRenderScope` and a `setAppShellMobileContext`
 *   call inside the item fixture are those boundaries — upstream's
 *   `CollapsedWrapper`, `renderCollapsed`/`renderExpanded`, `<SideNavRenderContext
 *   value="drawer">` and `<AppShellMobileContext value={…}>` respectively.
 * - **`screen.getByText` becomes `withText`/`hasText`.** A Playwright locator
 *   cannot stand in: an item's row contains its children's text, so several
 *   elements match and strict mode trips. Testing Library's default matcher
 *   reads only an element's *own* text nodes, which is what these reproduce —
 *   and it is what makes upstream's `getByText` single-match in the first place.
 * - **`act()` is gone** — a `$state` write flushes on its own, and
 *   `expect.element` retries.
 * - **`getByRole(…, {name: 'X'})` gains `exact: true`** in the two split-action
 *   cases. Testing Library matches a string `name` against the *whole*
 *   accessible name; a Playwright locator matches a substring, so plain
 *   `'Settings'` also matches the chevron toggle's "Collapse Settings". The flag
 *   restores upstream's semantics rather than changing the assertion.
 *
 * COUNTERPARTS (a different mechanism, the same question), each also commented
 * at its case:
 *
 * - **`forwards ref correctly`** → an attachment travelling in the rest props,
 *   which `SideNav` spreads onto its `<nav>`. It checks more than upstream's,
 *   which only proves a callback ran: this receives the element and asserts the
 *   tag.
 * - **The two `handleRef` cases** → `SideNav` exposes `getCollapseState()` as an
 *   instance export reached through `bind:this`, and `SideNavCollapseButton`
 *   takes the handle *object*. The fixture's stable delegating box is what
 *   `useRef` buys — it exists from the first render and fills in at mount.
 * - **The four mobile-drawer cases** → the two contexts are published by the
 *   fixture rather than by wrapper elements, per above.
 *
 * RESTATED (assertion changed), each commented at its case: `returns null when
 * collapsed without icon` (Svelte leaves `{#if}` anchor comments, so
 * `innerHTML === ''` cannot hold) and `hides items without icons when collapsed`
 * (upstream's second assertion queries `[data-xds="side-nav-item"]`, an
 * attribute neither design system has emitted since the rename — it is
 * vacuously true there; restated against the class `themeProps` actually mints).
 */

// =============================================================================
// Helpers
// =============================================================================

/** An element's own text nodes, joined and trimmed. */
function ownText(el: Element): string {
	return Array.from(el.childNodes)
		.filter((n) => n.nodeType === Node.TEXT_NODE)
		.map((n) => n.textContent ?? '')
		.join('')
		.trim();
}

/** Upstream's `screen.getAllByText(text)`. */
function allWithText(container: HTMLElement, text: string): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('*')).filter(
		(el) => ownText(el) === text
	);
}

/** Upstream's `screen.getByText(text)` — throws when it is not single-match. */
function withText(container: HTMLElement, text: string): HTMLElement {
	const found = allWithText(container, text);
	if (found.length !== 1) {
		throw new Error(`expected one element with the text "${text}", found ${found.length}`);
	}
	return found[0];
}

/** Upstream's `screen.queryByText(text) != null`. */
function hasText(container: HTMLElement, text: string): boolean {
	return allWithText(container, text).length > 0;
}

/**
 * The heading's popover **trigger** button — the one carrying `aria-haspopup`.
 *
 * Upstream reaches it with a bare, synchronous `screen.getByRole('button')`,
 * which finds exactly one because its closed popover's contents are out of
 * jsdom's accessibility tree. Two things make that unavailable here, and they
 * compound:
 *
 * - The popover renders inline, so the collapsed-heading replica button inside
 *   it is a second `<button>` in the container.
 * - A *retrying* `expect.element` against a strict locator re-queries for up to
 *   15s, and the popover opens during that window — the heading mounts under a
 *   stationary Playwright cursor at the viewport origin and `useMenuHover` has
 *   `showDelay: 0`, so hover fires. The match count then goes 1 → 2 and the
 *   locator throws before any attribute is read.
 *
 * Selecting the trigger by the attribute under test and asserting synchronously
 * removes both: it is upstream's own synchronous read, and it cannot race an
 * open that has nothing to do with what the case is about.
 */
function triggerButtonIn(container: HTMLElement): HTMLElement {
	const button = container.querySelector<HTMLElement>('button[aria-haspopup]');
	if (!button) {
		throw new Error('no popover trigger button found');
	}
	return button;
}

/** Upstream's `StubIcon`, as an item spec flag. */
const stubIcon = { hasStubIcon: true } as const;

// =============================================================================
// SideNav
// =============================================================================

describe('SideNav', () => {
	it('renders with navigation role', async () => {
		const screen = await render(Fixture, { props: {} });
		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
	});

	it('renders aria-label for page navigation', async () => {
		const screen = await render(Fixture, { props: {} });
		await expect
			.element(screen.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Side navigation');
	});

	it('renders children in scrollable area', async () => {
		const screen = await render(Fixture, {
			props: { content: { text: 'Nav items', testid: 'nav-content' } }
		});
		await expect.element(screen.getByTestId('nav-content')).toBeInTheDocument();
	});

	it('renders header slot', async () => {
		const screen = await render(Fixture, {
			props: { header: { text: 'Header', testid: 'header' } }
		});
		await expect.element(screen.getByTestId('header')).toBeInTheDocument();
	});

	it('renders topContent slot', async () => {
		const screen = await render(Fixture, {
			props: { topContent: { text: 'Sticky', testid: 'sticky' } }
		});
		await expect.element(screen.getByTestId('sticky')).toBeInTheDocument();
	});

	it('renders footer slot', async () => {
		const screen = await render(Fixture, {
			props: { footer: { text: 'Footer', testid: 'footer' } }
		});
		await expect.element(screen.getByTestId('footer')).toBeInTheDocument();
	});

	it('renders footerIcons slot', async () => {
		const screen = await render(Fixture, {
			props: { footerIcons: { text: 'Icons', testid: 'footer-icons' } }
		});
		await expect.element(screen.getByTestId('footer-icons')).toBeInTheDocument();
	});

	it('renders all slots together', async () => {
		const screen = await render(Fixture, {
			props: {
				header: { text: 'Header', testid: 'header' },
				topContent: { text: 'Sticky', testid: 'sticky' },
				footer: { text: 'Footer', testid: 'footer' },
				footerIcons: { text: 'Icons', testid: 'icons' },
				content: { text: 'Content', testid: 'content' }
			}
		});
		await expect.element(screen.getByTestId('header')).toBeInTheDocument();
		await expect.element(screen.getByTestId('sticky')).toBeInTheDocument();
		await expect.element(screen.getByTestId('content')).toBeInTheDocument();
		await expect.element(screen.getByTestId('footer')).toBeInTheDocument();
		await expect.element(screen.getByTestId('icons')).toBeInTheDocument();
	});

	// COUNTERPART for `forwards ref correctly`: the port has no `ref`, so a
	// consumer reaches the root through an attachment travelling in the rest
	// props. This asserts more than upstream's `toHaveBeenCalledWith(any
	// HTMLElement)` — it receives the element, so it can also name the tag.
	it('forwards ref correctly', async () => {
		let received: Element | null = null;
		await render(Fixture, {
			props: {
				props: {
					[createAttachmentKey()]: (node: Element) => {
						received = node;
					}
				}
			}
		});
		expect(received).toBeInstanceOf(HTMLElement);
		expect((received as unknown as HTMLElement).tagName).toBe('NAV');
	});

	it('passes data-testid to root', async () => {
		const screen = await render(Fixture, { props: { props: { 'data-testid': 'page-nav' } } });
		await expect.element(screen.getByTestId('page-nav')).toBeInTheDocument();
	});

	// COUNTERPART for the `handleRef` wiring — see the file header.
	it('renders and toggles from outside SideNav when handleRef is provided', async () => {
		const screen = await render(CollapseHandleFixture, { props: {} });

		const button = screen.getByRole('button', { name: 'Collapse sidebar', exact: true });
		await userEvent.click(button);

		await expect
			.element(screen.getByRole('button', { name: 'Expand sidebar', exact: true }))
			.toBeInTheDocument();
	});

	it('does not render an empty footer container when collapsible.hasButton is false', async () => {
		const screen = await render(Fixture, {
			props: { props: { 'data-testid': 'nav', collapsible: { hasButton: false } } }
		});

		// The built-in collapse button is opted out (consumers render their own
		// SideNavCollapseButton in the header), so it must not appear...
		expect(
			screen.getByRole('button', { name: 'Collapse sidebar', exact: true }).query()
		).toBeNull();

		// ...and no empty sticky-bottom container should be left behind. With no
		// footer/footerIcons and no built-in button, the scrollable content region
		// is the nav's only child.
		const nav = screen.getByTestId('nav').element();
		expect(nav.children).toHaveLength(1);
	});

	// COUNTERPART for the `handleRef` wiring — see the file header.
	it('fires a consumer onClick on the collapse button in addition to toggling', async () => {
		const onclick = vi.fn();
		const screen = await render(CollapseHandleFixture, { props: { onclick } });

		await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar', exact: true }));

		expect(onclick).toHaveBeenCalledTimes(1);
		// Toggle still ran: the label flipped to "Expand sidebar".
		await expect
			.element(screen.getByRole('button', { name: 'Expand sidebar', exact: true }))
			.toBeInTheDocument();
	});
});

// =============================================================================
// SideNavHeading
// =============================================================================

describe('SideNavHeading', () => {
	it('renders heading text', async () => {
		const screen = await render(HeadingFixture, { props: { props: { heading: 'My App' } } });
		expect(withText(screen.container, 'My App')).toBeInTheDocument();
	});

	it('renders icon', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App' }, icon: { text: '🏠', testid: 'app-icon' } }
		});
		await expect.element(screen.getByTestId('app-icon')).toBeInTheDocument();
	});

	it('renders superheading', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'Product', superheading: 'Suite Name' } }
		});
		expect(withText(screen.container, 'Suite Name')).toBeInTheDocument();
	});

	it('renders subheading', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'Product', subheading: 'Account' } }
		});
		expect(withText(screen.container, 'Account')).toBeInTheDocument();
	});

	it('renders as link when headingHref is provided without menu', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App', headingHref: '/home' } }
		});
		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('href', '/home');
		await expect.element(link).toHaveTextContent('My App');
	});

	it('uses custom link component from as prop', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App', headingHref: '/home', as: CustomLink } }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('data-custom-link');
	});

	it('uses custom link component from LinkProvider', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App', headingHref: '/home' }, provider: CustomLink }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('data-custom-link');
	});

	it('renders independent links when headingHref and superheadingHref are provided', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: {
					heading: 'Product',
					headingHref: '/product',
					superheading: 'Suite',
					superheadingHref: '/suite'
				}
			}
		});
		const links = screen.getByRole('link').elements();
		expect(links).toHaveLength(2);
		expect(links[0]).toHaveAttribute('href', '/suite');
		expect(links[1]).toHaveAttribute('href', '/product');
	});

	it('gives every link an accessible name with superheadingHref, headingHref, and menu', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: {
					superheading: 'Suite Name',
					superheadingHref: '/suite',
					heading: 'Product Name',
					headingHref: '/product'
				},
				icon: { text: 'Icon' },
				menu: 'Analytics'
			}
		});
		// The icon link to /product previously rendered with no text and no
		// aria-label, producing an empty accessible name (axe rule: link-name).
		// Every link pointing at /product must now expose "Product Name".
		const productLinks = screen
			.getByRole('link', { name: 'Product Name', exact: true })
			.elements()
			.filter((link) => link.getAttribute('href') === '/product');
		expect(productLinks.length).toBeGreaterThan(0);
		for (const link of productLinks) {
			expect(link).toHaveAccessibleName('Product Name');
		}
		// The independent superheading link is unaffected.
		await expect
			.element(screen.getByRole('link', { name: 'Suite Name', exact: true }))
			.toHaveAttribute('href', '/suite');
		// No link should be missing an accessible name.
		for (const link of screen.getByRole('link').elements()) {
			expect(link).toHaveAccessibleName();
		}
	});

	it('shows chevron when menu is provided', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App' }, menu: 'Menu content' }
		});
		// The chevron SVG should be rendered
		await expect.element(screen.getByRole('button')).toBeInTheDocument();
	});

	it('does not show chevron without menu', async () => {
		const screen = await render(HeadingFixture, { props: { props: { heading: 'My App' } } });
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	it('whole heading is popover trigger when menu provided without hrefs', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App' }, menu: 'Menu' }
		});
		const button = triggerButtonIn(screen.container);
		// The popup is no longer a dialog (role: 'none' on usePopover), so the
		// trigger advertises a generic popup rather than aria-haspopup="dialog".
		expect(button).toHaveAttribute('aria-haspopup', 'true');
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('has popoverTarget on trigger button when menu is provided', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App' }, menu: 'Menu' }
		});
		const button = triggerButtonIn(screen.container);
		// The trigger button uses aria attributes from usePopover and
		// an onclick handler from useMenuHover for click-to-lock toggle.
		expect(button).toHaveAttribute('aria-haspopup', 'true');
		expect(button).toHaveAttribute('aria-expanded');
	});

	it('renders chevron as separate trigger when menu and hrefs are provided', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'Product', headingHref: '/product' }, menu: 'Menu' }
		});
		expect(triggerButtonIn(screen.container)).toHaveAttribute('aria-haspopup', 'true');
	});

	it('passes data-testid', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App', 'data-testid': 'nav-header' } }
		});
		await expect.element(screen.getByTestId('nav-header')).toBeInTheDocument();
	});

	// ===========================================================================
	// Menu popover semantics — the popup must not be announced as a modal
	// dialog, and role="menu" must be scoped to the actual menu items so the
	// heading button is not an invalid child of the menu.
	// ===========================================================================

	// Upstream's note here is that the popover layer keeps `popover` content
	// display:none in jsdom even when open, hiding it from role queries — so it
	// asserts the popup's ARIA semantics at the DOM level instead. A real
	// Chromium opens the popover for real, but the DOM-level assertions are kept
	// verbatim: they are what the block is about. Upstream's document-wide
	// `document.querySelector` is scoped to the render container, which is what
	// RTL's freshly-cleaned `document` amounts to.
	describe('menu popover semantics', () => {
		const menuItems = ['Alpha', 'Beta'];

		/**
		 * Upstream's `await user.click(screen.getByRole('button', {name: 'Open
		 * menu'}))` — the one mechanism change in this block, in two parts, both
		 * forced by the environment rather than by the component.
		 *
		 * **Why the pointer has to be moved first.** The heading is a full-width row
		 * at the top of the page, and `setup-stylex` parks the physical cursor at
		 * the viewport's *top-right* corner, which is inside that row. Chromium
		 * re-hit-tests hover after a render, so the row gets `mouseenter` with no
		 * interaction at all, `useMenuHover` opens after its 150 ms `showDelay`, and
		 * the case starts from an already-open menu. Parking below the fixture is
		 * `setup-stylex`'s own technique at a coordinate this fixture does not
		 * occupy: hovering a throwaway element moves the real cursor to it, and
		 * removing the element leaves the cursor there, over bare `document.body`.
		 * `absolute` at 300px rather than `fixed` at the bottom edge, for the reason
		 * that file records — a tall test iframe puts a `fixed; bottom: 0` element
		 * outside the visible window.
		 *
		 * **Why the click is then dispatched.** Playwright's click hovers the
		 * chevron before pressing, which restarts the same 150 ms hover-open; the
		 * popup uses `sideNavHeadingPopoverOverlap`, whose entire job is to cover
		 * the trigger in place, so by press time Playwright's hit-test finds the
		 * popup's own chevron and reports `… subtree intercepts pointer events`,
		 * retrying to the actionability timeout. The component is right — a pointer
		 * resting on the heading *should* open its hover menu, and the popup
		 * *should* overlap. A native `.click()` dispatches the same click event
		 * upstream's user-event does (the trigger listens on `onclick` only) and
		 * removes the browser's hit-test, leaving the component's own toggle, which
		 * is what these cases are about.
		 */
		async function openMenu(trigger: Element): Promise<void> {
			const spot = document.createElement('div');
			spot.style.cssText =
				'position:absolute;top:300px;left:0;width:4px;height:4px;z-index:2147483647';
			document.body.append(spot);
			try {
				await userEvent.hover(spot);
			} finally {
				spot.remove();
			}
			// The hover menu may have opened before the pointer moved away; the
			// case's premise is that one click opens it.
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'false');
			});
			(trigger as HTMLElement).click();
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'true');
			});
		}

		it('does not wrap the heading menu popup in a modal dialog', async () => {
			const screen = await render(HeadingFixture, {
				props: { props: { heading: 'My App' }, menuItems }
			});
			await openMenu(screen.getByRole('button', { name: 'Open menu', exact: true }).element());
			expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
			expect(screen.container.querySelector('[aria-modal="true"]')).toBeNull();
		});

		it('scopes role="menu" to only menuitem children with an accessible name', async () => {
			const screen = await render(HeadingFixture, {
				props: { props: { heading: 'My App' }, menuItems }
			});
			await openMenu(screen.getByRole('button', { name: 'Open menu', exact: true }).element());
			const menu = screen.container.querySelector('[role="menu"]');
			expect(menu).not.toBeNull();
			expect(menu).toHaveAttribute('aria-label', 'My App');
			const children = Array.from(menu!.children);
			expect(children.length).toBeGreaterThan(0);
			for (const child of children) {
				expect(child).toHaveAttribute('role', 'menuitem');
			}
		});

		it('keeps the popup heading button outside the menu and closes on click', async () => {
			const screen = await render(HeadingFixture, {
				props: { props: { heading: 'My App' }, menuItems }
			});
			const trigger = screen.getByRole('button', { name: 'Open menu', exact: true }).element();
			await openMenu(trigger);
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
			const menu = screen.container.querySelector('[role="menu"]');
			expect(menu).not.toBeNull();
			// The heading replica button in the popup is a sibling of the menu,
			// not an invalid menu child.
			const headingButton = Array.from(screen.container.querySelectorAll('button')).find(
				(b) => b !== trigger && b.textContent?.includes('My App')
			);
			expect(headingButton).toBeDefined();
			expect(menu!.contains(headingButton!)).toBe(false);
			// Clicking it still closes the popup. Upstream's `fireEvent.click` is a
			// dispatched click with no pointer sequence, which a native `.click()` is.
			headingButton!.click();
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'false');
			});
		});

		it('applies the same semantics in mixed mode (menu + hrefs)', async () => {
			const screen = await render(HeadingFixture, {
				props: { props: { heading: 'Product', headingHref: '/product' }, menuItems }
			});
			await openMenu(screen.getByRole('button', { name: 'Open menu', exact: true }).element());
			expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
			const menu = screen.container.querySelector('[role="menu"]');
			expect(menu).not.toBeNull();
			expect(menu).toHaveAttribute('aria-label', 'Product');
			for (const child of Array.from(menu!.children)) {
				expect(child).toHaveAttribute('role', 'menuitem');
			}
		});
	});

	/**
	 * Upstream's four `SideNavHeading` cases for the #3121 `useMenuHover`
	 * consolidation, added at 0.4.2. All four are here.
	 *
	 * Timing translation is the same one `menu-hover.svelte.test.ts` documents:
	 * upstream drives fake timers and `act()`, these wait out real ones. The
	 * hover is dispatched synthetically rather than through Playwright for the
	 * reason `openMenu` above records at length — the popup deliberately covers
	 * its own trigger, so a real pointer press hit-tests into the popup.
	 * `SideNavHeading` passes `showDelay: 0`, so a hover-open needs only a tick.
	 */
	describe('menu hover/click guard (#3121)', () => {
		const menuItems = ['Alpha', 'Beta'];
		/** The hook's `DEFAULT_CLICK_GUARD_MS`. */
		const CLICK_GUARD_MS = 500;

		async function renderHeading() {
			const screen = await render(HeadingFixture, {
				props: { props: { heading: 'My App' }, menuItems, menuItemsFocusable: true }
			});
			return {
				screen,
				trigger: screen
					.getByRole('button', { name: 'Open menu', exact: true })
					.element() as HTMLElement
			};
		}

		/**
		 * `mouseenter` does not bubble, and with no hrefs the *whole heading* is the
		 * trigger — the handler is on the root `<div>`, not on the chevron button
		 * upstream names. A real pointer entering the button fires `mouseenter` on
		 * every element it enters, so the synthetic form walks the same chain.
		 */
		function hover(el: HTMLElement, root: HTMLElement): void {
			for (let node: HTMLElement | null = el; node; node = node.parentElement) {
				node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
				if (node === root) {
					break;
				}
			}
		}

		it('keeps the menu open when a hover-open is immediately clicked', async () => {
			const { screen, trigger } = await renderHeading();

			hover(trigger, screen.container);
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'true');
			});

			trigger.click();
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('closes on a click that lands well after the hover-open', async () => {
			const { screen, trigger } = await renderHeading();

			hover(trigger, screen.container);
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'true');
			});
			// Past the guard: a deliberate dismissal, not a follow-on.
			await new Promise((resolve) => setTimeout(resolve, CLICK_GUARD_MS + 100));

			trigger.click();
			// Awaited where upstream asserts synchronously: its `await user.click()`
			// already gave React a render, while a native `.click()` returns before
			// Svelte has flushed the `$state` write to the attribute.
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'false');
			});
		});

		it('leaves focus on the trigger for a hover-open, and moves it in on click', async () => {
			const { screen, trigger } = await renderHeading();

			hover(trigger, screen.container);
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'true');
			});
			const firstItem = screen.container.querySelector<HTMLElement>('[role="menuitem"]');
			expect(firstItem).not.toBeNull();
			expect(document.activeElement).not.toBe(firstItem);

			trigger.click();
			await vi.waitFor(() => {
				expect(document.activeElement).toBe(firstItem);
			});
		});

		it('returns focus to the trigger on Escape', async () => {
			const { screen, trigger } = await renderHeading();

			trigger.click();
			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'true');
			});

			const menu = screen.container.querySelector('[role="menu"]') as HTMLElement;
			menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

			await vi.waitFor(() => {
				expect(trigger).toHaveAttribute('aria-expanded', 'false');
				expect(document.activeElement).toBe(trigger);
			});
		});
	});
});

// =============================================================================
// SideNavHeading — collapsed mode
// =============================================================================

describe('SideNavHeading collapsed', () => {
	// RESTATED: upstream asserts `container.innerHTML === ''`. Svelte leaves the
	// `{#if}` chain's anchor comment behind, so the equivalent claim — "renders
	// nothing" — is that no element and no text was produced. Same precedent as
	// `overflow-list.svelte.test.ts`'s empty-child-list case.
	it('returns null when collapsed without icon', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App' }, collapsed: true }
		});
		expect(screen.container.querySelector('*')).toBeNull();
		expect(screen.container.textContent?.trim()).toBe('');
	});

	it('renders icon when collapsed with icon', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App' },
				icon: { text: '🏠', testid: 'app-icon' },
				collapsed: true
			}
		});
		await expect.element(screen.getByTestId('app-icon')).toBeInTheDocument();
	});

	it('does not show heading text inline when collapsed (only in tooltip)', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App' },
				icon: { text: '🏠', testid: 'app-icon' },
				collapsed: true
			}
		});
		// The heading text should not appear as a visible inline element
		// (it exists only in the tooltip for accessibility)
		const headingSpans = screen.container.querySelectorAll('span');
		const inlineHeadingText = Array.from(headingSpans).find(
			(el) =>
				el.textContent === 'My App' &&
				!el.closest('[role="tooltip"]') &&
				!el.hasAttribute('data-tooltip')
		);
		expect(inlineHeadingText).toBeUndefined();
	});

	it('renders as link when collapsed with headingHref', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App', headingHref: '/home' },
				icon: { text: '🏠', testid: 'app-icon' },
				collapsed: true
			}
		});
		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('href', '/home');
		await expect.element(link).toHaveAttribute('aria-label', 'My App');
	});

	it('does not show chevron when collapsed', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App', headingHref: '/home' },
				icon: { text: '🏠', testid: 'app-icon' },
				menu: 'Menu',
				collapsed: true
			}
		});
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	it('passes data-testid when collapsed', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App', 'data-testid': 'nav-header' },
				icon: { text: '🏠' },
				collapsed: true
			}
		});
		await expect.element(screen.getByTestId('nav-header')).toBeInTheDocument();
	});

	it('collapsed menu popup is not a dialog and scopes role="menu" to menu items', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App' },
				icon: { text: '🏠', testid: 'app-icon' },
				menuItems: ['Alpha', 'Beta'],
				collapsed: true
			}
		});
		// The collapsed trigger carries `aria-label={heading}`. It is a single
		// match while the popover is closed, which is when the click resolves it.
		await userEvent.click(screen.getByRole('button', { name: 'My App', exact: true }));
		// No modal dialog wrapper around the menu popup.
		expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
		expect(screen.container.querySelector('[aria-modal="true"]')).toBeNull();
		// role="menu" is scoped to the menu items and has a direct name.
		const menu = screen.container.querySelector('[role="menu"]');
		expect(menu).not.toBeNull();
		expect(menu).toHaveAttribute('aria-label', 'My App');
		const children = Array.from(menu!.children);
		expect(children.length).toBeGreaterThan(0);
		for (const child of children) {
			expect(child).toHaveAttribute('role', 'menuitem');
		}
		// No button (trigger or heading replica) lives inside the menu.
		for (const button of Array.from(screen.container.querySelectorAll('button'))) {
			expect(menu!.contains(button)).toBe(false);
		}
	});
});

// =============================================================================
// SideNavHeading — headerEndContent
// =============================================================================

describe('SideNavHeading headerEndContent', () => {
	it('renders headerEndContent in the default static path', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App' },
				headerEndContent: { text: '3', testid: 'end-badge' }
			}
		});
		await expect.element(screen.getByTestId('end-badge')).toBeInTheDocument();
	});

	it('renders headerEndContent inside the link in isWholeHeadingLink path', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App', headingHref: '/home' },
				headerEndContent: { text: '3', testid: 'end-badge' }
			}
		});
		const badge = screen.getByTestId('end-badge').element();
		expect(badge).toBeInTheDocument();
		// Badge renders inside the link
		expect(badge.closest('a')).not.toBeNull();
	});

	it('renders headerEndContent in isWholeHeadingTrigger path', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App' },
				menu: 'Menu',
				headerEndContent: { text: '3', testid: 'end-badge' }
			}
		});
		const badge = screen.getByTestId('end-badge').element();
		expect(badge).toBeInTheDocument();
		// Badge renders inside the heading container (div), alongside the chevron button
		expect(badge.closest('[class]')).not.toBeNull();
	});

	it('renders headerEndContent in mixed mode (menu + href)', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App', headingHref: '/home' },
				menu: 'Menu',
				headerEndContent: { text: '3', testid: 'end-badge' }
			}
		});
		await expect.element(screen.getByTestId('end-badge')).toBeInTheDocument();
	});

	it('renders headerEndContent with independent links (no menu)', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: {
					heading: 'Product',
					headingHref: '/product',
					superheading: 'Suite',
					superheadingHref: '/suite'
				},
				headerEndContent: { text: '3', testid: 'end-badge' }
			}
		});
		await expect.element(screen.getByTestId('end-badge')).toBeInTheDocument();
	});

	it('hides headerEndContent when collapsed', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App' },
				icon: { text: '🏠' },
				headerEndContent: { text: '3', testid: 'end-badge' },
				collapsed: true
			}
		});
		expect(screen.getByTestId('end-badge').query()).toBeNull();
	});
});

// =============================================================================
// SideNavHeading — truncation tooltips
// =============================================================================

describe('SideNavHeading truncation tooltips', () => {
	it('attaches truncation refs to heading text spans', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				props: { heading: 'My App', superheading: 'Acme Corp', subheading: 'admin@acme.com' }
			}
		});
		// All three text spans should be present
		expect(withText(screen.container, 'My App')).toBeInTheDocument();
		expect(withText(screen.container, 'Acme Corp')).toBeInTheDocument();
		expect(withText(screen.container, 'admin@acme.com')).toBeInTheDocument();
	});

	it('does not crash with truncation hooks when only heading is provided', async () => {
		const screen = await render(HeadingFixture, { props: { props: { heading: 'My App' } } });
		expect(withText(screen.container, 'My App')).toBeInTheDocument();
	});
});

// =============================================================================
// SideNavItem
// =============================================================================

describe('SideNavItem', () => {
	it('renders label text', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard' } } }
		});
		expect(withText(screen.container, 'Dashboard')).toBeInTheDocument();
	});

	it('renders as link when href is provided', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', href: '/dashboard' } } }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('href', '/dashboard');
	});

	it('renders as button when no href', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard' } } }
		});
		await expect.element(screen.getByRole('button')).toBeInTheDocument();
	});

	it('sets aria-current="page" when selected', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', isSelected: true } } }
		});
		await expect.element(screen.getByRole('button')).toHaveAttribute('aria-current', 'page');
	});

	it('does not set aria-current when not selected', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard' } } }
		});
		await expect.element(screen.getByRole('button')).not.toHaveAttribute('aria-current');
	});

	it('disables the button when isDisabled', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', isDisabled: true } } }
		});
		await expect.element(screen.getByRole('button')).toBeDisabled();
	});

	it('calls onClick handler', async () => {
		const handleClick = vi.fn();
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', onclick: handleClick } } }
		});
		await userEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders endContent', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Projects' }, endContent: { text: '3', testid: 'badge' } }
			}
		});
		await expect.element(screen.getByTestId('badge')).toBeInTheDocument();
	});

	it('renders nested children', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings' },
					children: [{ props: { label: 'General' } }, { props: { label: 'Security' } }]
				}
			}
		});
		expect(withText(screen.container, 'General')).toBeInTheDocument();
		expect(withText(screen.container, 'Security')).toBeInTheDocument();
	});

	it('passes data-testid', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', 'data-testid': 'nav-item' } } }
		});
		await expect.element(screen.getByTestId('nav-item')).toBeInTheDocument();
	});

	it('renders with selected link', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', href: '/dashboard', isSelected: true } } }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
	});

	it('places aria-current on the link, not the wrapper, for split-action items', async () => {
		// A collapsible item (has children) WITH a primary href renders the
		// split-action path: the link and the expand toggle are siblings inside a
		// wrapper div. aria-current="page" must sit on the focusable link so it is
		// announced as the current page (navigation-8).
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Reports', href: '/reports', isSelected: true },
					children: [{ props: { label: 'Weekly', href: '/reports/weekly' } }]
				}
			}
		});
		const link = screen.getByRole('link', { name: /Reports/ }).element();
		expect(link).toHaveAttribute('aria-current', 'page');
		// The wrapper div must NOT carry aria-current.
		expect(link.closest('[aria-current="page"]')).toBe(link);
	});

	it('renders custom component when as and href are provided', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', href: '/dashboard', as: CustomLink } } }
		});
		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).toHaveAttribute('href', '/dashboard');
	});

	it('still renders button when no href even with as prop', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', as: CustomLink } } }
		});
		const button = screen.getByRole('button');
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).not.toHaveAttribute('data-custom-link');
	});

	it('renders custom component from LinkProvider when href is provided', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Dashboard', href: '/dashboard' } },
				provider: CustomLink
			}
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('data-custom-link');
	});
});

// =============================================================================
// SideNavSection
// =============================================================================

describe('SideNavSection', () => {
	it('renders with group role', async () => {
		const screen = await render(SectionFixture, { props: { props: { title: 'Main' } } });
		await expect.element(screen.getByRole('group')).toBeInTheDocument();
	});

	it('renders heading text', async () => {
		const screen = await render(SectionFixture, { props: { props: { title: 'Main' } } });
		expect(withText(screen.container, 'Main')).toBeInTheDocument();
	});

	it('uses aria-labelledby to link title to group', async () => {
		const screen = await render(SectionFixture, { props: { props: { title: 'Main' } } });
		const group = screen.getByRole('group').element();
		const labelId = group.getAttribute('aria-labelledby');
		expect(labelId).toBeTruthy();
		const label = document.getElementById(labelId!);
		expect(label).toHaveTextContent('Main');
	});

	it('renders subheading', async () => {
		const screen = await render(SectionFixture, {
			props: { props: { title: 'Main', subtitle: 'Primary navigation' } }
		});
		expect(withText(screen.container, 'Primary navigation')).toBeInTheDocument();
	});

	it('renders endContent', async () => {
		const screen = await render(SectionFixture, {
			props: { props: { title: 'Main' }, endContent: { text: '+', testid: 'section-action' } }
		});
		await expect.element(screen.getByTestId('section-action')).toBeInTheDocument();
	});

	it('passes data-testid', async () => {
		const screen = await render(SectionFixture, {
			props: { props: { title: 'Main', 'data-testid': 'nav-section' } }
		});
		await expect.element(screen.getByTestId('nav-section')).toBeInTheDocument();
	});

	it('forwards className to root element', async () => {
		const screen = await render(SectionFixture, {
			props: { props: { title: 'Main', class: 'custom-section' } }
		});
		const group = screen.getByRole('group').element();
		expect(group.className).toContain('custom-section');
	});

	it('forwards style to root element', async () => {
		const screen = await render(SectionFixture, {
			props: { props: { title: 'Main', style: 'margin-top: 16px' } }
		});
		const group = screen.getByRole('group').element() as HTMLElement;
		expect(group.style.marginTop).toBe('16px');
	});

	it('forwards arbitrary pass-through attributes (id, aria-*) to root element', async () => {
		const screen = await render(SectionFixture, {
			props: { props: { title: 'Main', id: 'section-1', 'aria-describedby': 'hint' } }
		});
		const group = screen.getByRole('group');
		await expect.element(group).toHaveAttribute('id', 'section-1');
		await expect.element(group).toHaveAttribute('aria-describedby', 'hint');
	});
});

// =============================================================================
// Resizable
// =============================================================================

describe('SideNav resizable', () => {
	it('renders drag handle when resizable', async () => {
		const screen = await render(Fixture, { props: { props: { resizable: true } } });
		await expect.element(screen.getByTestId('astryx-sidenav-resize-handle')).toBeInTheDocument();
	});

	it('does not render drag handle without resizable', async () => {
		const screen = await render(Fixture, { props: {} });
		expect(screen.getByTestId('astryx-sidenav-resize-handle').query()).toBeNull();
	});

	it('does not render drag handle when collapsed', async () => {
		const screen = await render(Fixture, {
			props: {
				props: { resizable: true, collapsible: { isCollapsed: true, onCollapsedChange: () => {} } }
			}
		});
		expect(screen.getByTestId('astryx-sidenav-resize-handle').query()).toBeNull();
	});

	it('calls onWidthChange after drag', async () => {
		const handleWidthChange = vi.fn();
		const screen = await render(Fixture, {
			props: { props: { resizable: { onWidthChange: handleWidthChange } } }
		});
		const handle = screen.getByTestId('astryx-sidenav-resize-handle').element();
		// The pointer event handler is on the hit area child inside the handle.
		const hitArea = handle.firstElementChild as HTMLElement;

		// `act()` has no counterpart — a `$state` write flushes on its own.
		hitArea.dispatchEvent(new PointerEvent('pointerdown', { clientX: 260, bubbles: true }));
		document.dispatchEvent(new PointerEvent('pointermove', { clientX: 310, bubbles: true }));
		document.dispatchEvent(new PointerEvent('pointerup', { clientX: 310, bubbles: true }));

		expect(handleWidthChange).toHaveBeenCalledTimes(1);
		expect(handleWidthChange).toHaveBeenCalledWith(expect.any(Number));
	});

	it('respects defaultWidth', async () => {
		const screen = await render(Fixture, {
			props: { props: { resizable: { defaultWidth: 300 } } }
		});
		const nav = screen.getByRole('navigation').element() as HTMLElement;
		expect(nav.style.width).toBe('300px');
	});

	it('drag handle has separator role', async () => {
		const screen = await render(Fixture, { props: { props: { resizable: true } } });
		await expect.element(screen.getByRole('separator')).toBeInTheDocument();
	});
});

// =============================================================================
// Integration
// =============================================================================

describe('SideNav integration', () => {
	it('renders a complete page nav', async () => {
		const screen = await render(IntegrationFixture, { props: {} });

		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
		expect(withText(screen.container, 'My App')).toBeInTheDocument();
		expect(withText(screen.container, 'Dashboard')).toBeInTheDocument();
		expect(withText(screen.container, 'Projects')).toBeInTheDocument();
		expect(withText(screen.container, 'General')).toBeInTheDocument();
		await expect.element(screen.getByTestId('promo')).toBeInTheDocument();
	});
});

// =============================================================================
// SideNavItem — Collapsed mode
// =============================================================================

describe('SideNavItem (collapsed)', () => {
	// RESTATED (second assertion): upstream queries `[data-xds="side-nav-item"]`,
	// an attribute `themeProps` has not emitted since the XDS → Astryx rename, so
	// the assertion is vacuously true there. Restated against the stable class it
	// does mint, which is what the case means to claim.
	it('hides items without icons when collapsed', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'No Icon Item' } }, collapse: 'collapsed' }
		});
		expect(hasText(screen.container, 'No Icon Item')).toBe(false);
		expect(screen.container.querySelector('.astryx-side-nav-item')).toBeNull();
	});

	it('renders icon-only button when collapsed with icon and no children', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Dashboard', 'data-testid': 'item' }, ...stubIcon },
				collapse: 'collapsed'
			}
		});
		// Should have an element with aria-label (icon-only)
		await expect.element(screen.getByLabelText('Dashboard', { exact: true })).toBeInTheDocument();
		// Icon should be rendered
		await expect.element(screen.getByTestId('stub-icon')).toBeInTheDocument();
	});

	it('renders collapsed link when href is provided', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Dashboard', href: '/dashboard' }, ...stubIcon },
				collapse: 'collapsed'
			}
		});
		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('href', '/dashboard');
		await expect.element(link).toHaveAttribute('aria-label', 'Dashboard');
	});

	it('renders popover trigger when collapsed with icon and children', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', 'data-testid': 'parent' },
					...stubIcon,
					children: [{ props: { label: 'General' } }, { props: { label: 'Security' } }]
				},
				collapse: 'collapsed'
			}
		});
		const trigger = screen.getByTestId('parent');
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trigger).toHaveAttribute('aria-label', 'Settings');
	});

	it('opens popover on click showing children in expanded form', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', 'data-testid': 'parent' },
					...stubIcon,
					children: [
						{ props: { label: 'General', 'data-testid': 'child-general' } },
						{ props: { label: 'Security', 'data-testid': 'child-security' } }
					]
				},
				collapse: 'collapsed'
			}
		});
		await userEvent.click(screen.getByTestId('parent'));

		// Children should be visible in expanded form (label text visible)
		expect(withText(screen.container, 'General')).toBeInTheDocument();
		expect(withText(screen.container, 'Security')).toBeInTheDocument();
	});

	it('shows parent label as header in the popover', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', 'data-testid': 'parent' },
					...stubIcon,
					children: [{ props: { label: 'General' } }]
				},
				collapse: 'collapsed'
			}
		});
		await userEvent.click(screen.getByTestId('parent'));
		expect(withText(screen.container, 'Settings')).toBeInTheDocument();
	});

	it('does not render children without icon when collapsed', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings' },
					children: [{ props: { label: 'General' } }, { props: { label: 'Security' } }]
				},
				collapse: 'collapsed'
			}
		});
		expect(hasText(screen.container, 'Settings')).toBe(false);
		expect(hasText(screen.container, 'General')).toBe(false);
	});

	it('renders normally when not collapsed', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Dashboard' },
					...stubIcon,
					children: [{ props: { label: 'General' } }]
				},
				collapse: 'expanded'
			}
		});
		expect(allWithText(screen.container, 'Dashboard').length).toBeGreaterThanOrEqual(1);
		expect(withText(screen.container, 'General')).toBeInTheDocument();
		await expect.element(screen.getByRole('group')).toBeInTheDocument();
	});
});

// =============================================================================
// SideNavItem — collapsible + href (independent toggle)
// =============================================================================

describe('SideNavItem — collapsible + href', () => {
	it('renders a link that navigates when both collapsible and href are set', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: {
						label: 'Settings',
						href: '/settings',
						collapsible: true,
						'data-testid': 'parent'
					},
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Settings', exact: true }))
			.toHaveAttribute('href', '/settings');
	});

	it('renders a separate toggle button for the chevron', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', href: '/settings', collapsible: true },
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		const toggle = screen.getByRole('button', { name: /collapse settings/i });
		await expect.element(toggle).toBeInTheDocument();
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
	});

	it('toggle button collapses children without navigating', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', href: '/settings', collapsible: true },
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		// Held as an element: the locator's name filter stops matching once the
		// label flips, and Svelte updates the attributes on the same node.
		const toggle = screen.getByRole('button', { name: /collapse settings/i }).element();
		await userEvent.click(toggle);
		// After collapsing, aria-hidden on children container
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(toggle).toHaveAccessibleName('Expand Settings');
	});

	it('link does not toggle collapse when clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', href: '/settings', collapsible: true, onclick },
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		await userEvent.click(screen.getByRole('link', { name: 'Settings', exact: true }));
		expect(onclick).toHaveBeenCalledTimes(1);
		// Children should still be visible (not collapsed)
		await expect
			.element(screen.getByRole('button', { name: /collapse settings/i }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('link does not have aria-expanded (toggle button owns it)', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', href: '/settings', collapsible: true },
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Settings', exact: true }))
			.not.toHaveAttribute('aria-expanded');
	});

	it('without href or onClick, clicking the item toggles collapse', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', collapsible: true },
					children: [{ props: { label: 'General' } }]
				}
			}
		});
		// `exact: true` — see the sibling case below for why.
		const button = screen.getByRole('button', { name: 'Settings', exact: true }).element();
		expect(button).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(button);
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('with onClick (no href), clicking the label fires onClick', async () => {
		const onclick = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', onclick, collapsible: true },
					children: [{ props: { label: 'General' } }]
				}
			}
		});
		// `exact: true` is what upstream's *string* `name` already means: Testing
		// Library matches the whole accessible name, Playwright's locators match a
		// substring. Without it this resolves to two buttons here, since the
		// chevron toggle is named "Collapse Settings".
		await userEvent.click(screen.getByRole('button', { name: 'Settings', exact: true }));
		expect(onclick).toHaveBeenCalledTimes(1);
		// Children should still be visible
		await expect
			.element(screen.getByRole('button', { name: /collapse settings/i }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('with onClick (no href), toggle collapses without firing onClick', async () => {
		const onclick = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', onclick, collapsible: true },
					children: [{ props: { label: 'General' } }]
				}
			}
		});
		const toggle = screen.getByRole('button', { name: /collapse settings/i }).element();
		await userEvent.click(toggle);
		expect(onclick).not.toHaveBeenCalled();
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('collapsed children are inert (not focusable)', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', collapsible: true },
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		// Collapse the item
		const button = screen.getByRole('button', { name: 'Settings', exact: true }).element();
		await userEvent.click(button);
		// The children container should have inert attribute
		const childrenContainer = document.getElementById(button.getAttribute('aria-controls')!);
		expect(childrenContainer).toHaveAttribute('inert');
	});
});

// =============================================================================
// Mobile nav close-on-activate
// =============================================================================

describe('SideNavItem — mobile drawer close-on-activate', () => {
	/** Upstream's `renderInDrawer` — see the file header for the two providers. */
	function drawerProps(closeMobileNav: () => void) {
		return {
			renderMode: 'drawer' as const,
			mobile: {
				isMobile: true,
				isMobileNavOpen: true,
				toggleMobileNav: vi.fn(),
				openMobileNav: vi.fn(),
				closeMobileNav,
				isMobileNavEnabled: true,
				hasAutoToggle: true
			}
		};
	}

	it('closes the mobile nav when a link item is clicked', async () => {
		const closeMobileNav = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Home', href: '/', 'data-testid': 'item' } },
				...drawerProps(closeMobileNav)
			}
		});
		await userEvent.click(screen.getByTestId('item'));
		expect(closeMobileNav).toHaveBeenCalledTimes(1);
	});

	it('closes the mobile nav when a button item is clicked', async () => {
		const closeMobileNav = vi.fn();
		const onclick = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Action', onclick, 'data-testid': 'item' } },
				...drawerProps(closeMobileNav)
			}
		});
		await userEvent.click(screen.getByTestId('item'));
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(closeMobileNav).toHaveBeenCalledTimes(1);
	});

	it('does NOT close when a collapsible parent is toggled', async () => {
		const closeMobileNav = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', collapsible: true, 'data-testid': 'parent' },
					...stubIcon,
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				},
				...drawerProps(closeMobileNav)
			}
		});
		await userEvent.click(screen.getByTestId('parent'));
		expect(closeMobileNav).not.toHaveBeenCalled();
	});

	it('does NOT close when not inside a drawer', async () => {
		const closeMobileNav = vi.fn();
		const screen = await render(ItemFixture, {
			props: {
				item: { props: { label: 'Home', href: '/', 'data-testid': 'item' } },
				mobile: {
					isMobile: false,
					isMobileNavOpen: false,
					toggleMobileNav: vi.fn(),
					openMobileNav: vi.fn(),
					closeMobileNav,
					isMobileNavEnabled: false,
					hasAutoToggle: true
				}
			}
		});
		await userEvent.click(screen.getByTestId('item'));
		expect(closeMobileNav).not.toHaveBeenCalled();
	});
});

/**
 * Upstream's `describe('SideNav focus ring (A15)')`, all eight cases, new at
 * 0.4.2 with the hardening pass. Every focusable row in the sidenav draws the
 * *shared* ring rather than a per-component one, so a theme that restyles focus
 * restyles all of them together.
 *
 * `expectSharedFocusRing` / `expectNoSharedFocusRing` live in
 * `shared-focus-ring.ts` because the TopNav suites assert the same thing.
 */
describe('SideNav focus ring (A15)', () => {
	it('draws the shared ring on a link item', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', href: '/dashboard' } } }
		});
		expectSharedFocusRing(screen.getByRole('link', { name: 'Dashboard', exact: true }).element());
	});

	it('draws the shared ring on a button item', async () => {
		const screen = await render(ItemFixture, {
			props: { item: { props: { label: 'Dashboard', onclick: () => {} } } }
		});
		expectSharedFocusRing(screen.getByRole('button', { name: 'Dashboard', exact: true }).element());
	});

	it('draws the shared ring on a collapsed icon-only item', async () => {
		const screen = await render(ItemFixture, {
			props: {
				collapse: 'collapsed',
				item: { props: { label: 'Dashboard', href: '/dashboard' }, hasStubIcon: true }
			}
		});
		expectSharedFocusRing(screen.getByRole('link', { name: 'Dashboard', exact: true }).element());
	});

	it('draws the shared ring on a collapsed submenu trigger', async () => {
		const screen = await render(ItemFixture, {
			props: {
				collapse: 'collapsed',
				item: {
					props: { label: 'Settings' },
					hasStubIcon: true,
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});
		expectSharedFocusRing(screen.getByRole('button', { name: 'Settings', exact: true }).element());
	});

	it('rings each focusable of a split-action row, and not the row itself', async () => {
		const screen = await render(ItemFixture, {
			props: {
				item: {
					props: { label: 'Settings', href: '/settings', collapsible: true },
					children: [{ props: { label: 'General', href: '/settings/general' } }]
				}
			}
		});

		const link = screen.getByRole('link', { name: 'Settings', exact: true }).element();
		const toggle = screen.getByRole('button', { name: 'Collapse Settings', exact: true }).element();
		expectSharedFocusRing(link);
		expectSharedFocusRing(toggle);

		// A presentational <div> holding two independent tab stops; ringing it too
		// would paint a second outline around the whole row.
		const row = link.parentElement!;
		expect(row.tagName).toBe('DIV');
		expect(row.contains(toggle)).toBe(true);
		expectNoSharedFocusRing(row);
	});

	it('draws the shared ring on a heading rendered as one link', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App', headingHref: '/' } }
		});
		expectSharedFocusRing(screen.getByRole('link', { name: /My App/ }).element());
	});

	it('draws the shared ring on a collapsed heading link', async () => {
		const screen = await render(HeadingFixture, {
			props: {
				collapsed: true,
				props: { heading: 'My App', headingHref: '/' },
				icon: { text: 'i' }
			}
		});
		expectSharedFocusRing(screen.getByRole('link', { name: 'My App', exact: true }).element());
	});

	it('draws the shared ring on the heading menu trigger', async () => {
		const screen = await render(HeadingFixture, {
			props: { props: { heading: 'My App' }, menu: 'menu' }
		});
		expectSharedFocusRing(screen.getByRole('button', { name: 'Open menu', exact: true }).element());
	});
});

/**
 * Upstream's size-cascade cases, new at 0.4.2: the sidenav publishes its row
 * size to the parts of its own output that did not size themselves, which is
 * what `internal/size-scope.svelte` (upstream's `SizeProvider`) exists for.
 * All five.
 */
describe('SideNav size cascade', () => {
	/**
	 * Upstream's `sizeOnlyClasses`: the atomic classes a `size` compiles to that
	 * `md` does not. Comparing against the `md` reference rather than asserting a
	 * literal class keeps this independent of StyleX's hashing, and the
	 * `length > 0` guard is upstream's own — if two sizes compiled identically
	 * every check below would hold vacuously.
	 */
	async function sizeOnlyClasses(size: 'sm' | 'lg'): Promise<string[]> {
		const screen = await render(SizeRefFixture, { props: { size } });
		const sized = new Set(screen.getByTestId('sized-ref').element().classList);
		const md = new Set(screen.getByTestId('md-ref').element().classList);
		const only = [...sized].filter((c) => !md.has(c));
		expect(only.length).toBeGreaterThan(0);
		return only;
	}

	function expectHasAll(el: Element, classes: string[]): void {
		for (const className of classes) {
			expect(el.className.split(' ')).toContain(className);
		}
	}

	it('renders the built-in collapse button at the row size, not the Button default', async () => {
		const smClasses = await sizeOnlyClasses('sm');
		const screen = await render(Fixture, {
			props: { props: { collapsible: true }, content: { text: 'Dashboard' } }
		});
		const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i }).element();
		expectHasAll(collapseButton, smClasses);
	});

	it('cascades the same size to footerIcons the consumer did not size', async () => {
		const smClasses = await sizeOnlyClasses('sm');
		const screen = await render(Fixture, {
			props: {
				props: { collapsible: true },
				footerIconButton: { testid: 'help' },
				content: { text: 'Dashboard' }
			}
		});
		expectHasAll(screen.getByTestId('help').element(), smClasses);
	});

	it('lets an explicit size on a footer icon win over the cascade', async () => {
		const lgClasses = await sizeOnlyClasses('lg');
		const screen = await render(Fixture, {
			props: {
				props: { collapsible: true },
				footerIconButton: { testid: 'help', size: 'lg' },
				content: { text: 'Dashboard' }
			}
		});
		expectHasAll(screen.getByTestId('help').element(), lgClasses);
	});

	it('honours an explicit size on SideNavCollapseButton outside the nav', async () => {
		const lgClasses = await sizeOnlyClasses('lg');
		const screen = await render(CollapseButtonScope, {
			props: { buttonProps: { size: 'lg', 'data-testid': 'collapse' } }
		});
		expectHasAll(screen.getByTestId('collapse').element(), lgClasses);
	});

	it('centres the chevron instead of seating it on a text baseline', async () => {
		const screen = await render(CollapseButtonScope, {
			props: { buttonProps: { 'data-testid': 'collapse' } }
		});
		// Icon renders its own `astryx-icon` span around the svg; the RTL-mirror
		// wrapper this component adds is that span's parent.
		const iconSpan = screen.getByTestId('collapse').element().querySelector('span.astryx-icon');
		const mirror = iconSpan?.parentElement;
		expect(mirror).not.toBeNull();
		// The RTL-mirror wrapper is a flex item of Button's icon slot, so it takes
		// its cross-axis position from the slot rather than from a text baseline.
		expect(getComputedStyle(mirror!).alignSelf).not.toBe('baseline');
	});
});
