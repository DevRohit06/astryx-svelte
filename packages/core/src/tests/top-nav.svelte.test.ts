import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import type { LinkComponentType } from '$lib/components/link/types.js';
import NavIcon from '$lib/components/nav-icon/nav-icon.svelte';
import TopNav from '$lib/components/top-nav/top-nav.svelte';
import TopNavHeading from '$lib/components/top-nav/top-nav-heading.svelte';
import TopNavItem from '$lib/components/top-nav/top-nav-item.svelte';
import TopNavMegaMenuFeaturedCard from '$lib/components/top-nav/top-nav-mega-menu-featured-card.svelte';
import TopNavRenderModeFixture from './fixtures/top-nav-render-mode.svelte';
import CustomLink from './fixtures/custom-link.svelte';
import AnotherLink from './fixtures/another-link.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import TopNavFixture from './fixtures/top-nav-fixture.svelte';
import TopNavHeadingFixture from './fixtures/top-nav-heading-fixture.svelte';
import { parkPointer } from './park-pointer.js';
import TopNavItemFixture from './fixtures/top-nav-item-fixture.svelte';

/**
 * Ported from Astryx's `TopNav/TopNav.test.tsx` — **50 of its 58 `it` cases at
 * the 0.5.0 pin**, across its describes (`TopNav`, `TopNavHeading`, the nested
 * `logo link accessible name`, `NavIcon`, `TopNavItem` including 17c's `disabled
 * items do not navigate`, and the nested `TopNavMegaMenuFeaturedCard rest
 * forwarding`). Client (real Chromium) project.
 *
 * The eight not here are two whole nested describes plus one stray: `menu
 * popover semantics` (4 — the heading menu's non-modal popover and its
 * `role="menu"` scoping), `TopNavMegaMenuFeaturedCard image alt handling` (3)
 * and `keeps href and click behavior for enabled items (drawer mode)`. Every
 * subject is ported — `imageAlt` is implemented on
 * `top-nav-mega-menu-featured-card.svelte` with exactly the `role="presentation"`
 * / `aria-hidden` behaviour those cases assert — so the behaviour ships and only
 * the assertions do not. This header has now rotted twice: it said "all 43"
 * while the file held 46, then "46 of its 54" while the file held 50 and
 * upstream 58.
 *
 * Standing translations:
 *
 * - Every slot is a `Snippet`, so the slot content upstream writes inline as JSX
 *   comes in through `top-nav-fixture` / `top-nav-heading-fixture` /
 *   `top-nav-item-fixture`. Where a case needs no slot at all, the component is
 *   rendered directly.
 * - `<TopNavRenderContext value="mobile-bar">` becomes the fixture's `mode` prop,
 *   which wraps the subject in the internal `TopNavRenderScope`. React scopes a
 *   context with an element; Svelte sets context at component init, so scoping
 *   needs a component boundary. The context object itself is public on both sides.
 * - `render` is async — always awaited.
 * - `onClick` is `onclick`.
 *
 * COUNTERPART, not translation — the four `forwards ref correctly` cases. Svelte
 * has no `ref`; the root element reaches a consumer through an attachment passed
 * in rest props. Asserting on the element received checks more than upstream's
 * "the callback ran with some HTMLElement" does. Each is marked at the case.
 *
 * RESTATED — two assertions. One in `names the logo link in the independent-links
 * config`; see the comment at the case. The other is `renders icon with label`'s
 * `getByText('Settings')`, which goes through `ownText` below: the two
 * `getByText` implementations read different text off an element with mixed
 * children, and only `ownText` states what upstream's states.
 *
 * `sets tabIndex to -1 when disabled` reads `tabindex` rather than React's
 * `tabIndex` prop name: it is the same attribute on the same node (HTML attribute
 * lookups are case-insensitive), spelled as the DOM spells it.
 *
 * NOTE ON OVERLAP: upstream's `NavIcon` describe here duplicates its own
 * `NavIcon/NavIcon.test.tsx`, which this port already carries in
 * `nav-icon.svelte.test.ts`. Both are kept, because the count of *this* suite is the
 * contract and dropping them would silently shrink it.
 *
 * The rest-forwarding divergence the port introduces (`TopNavMenu` /
 * `TopNavMegaMenu` / `TopNavMegaMenuItem` spread rest props where upstream drops
 * them) touches no case in this file: the one rest-forwarding case here is
 * `TopNavMegaMenuFeaturedCard`'s, which upstream forwards too.
 */

/**
 * Upstream's `screen.getAllByRole('link')`: every `<a href>` that is actually in
 * the accessibility tree. An `<a>` without `href` has no link role, and a link
 * inside a *closed* popover is `display: none` — which RTL's role query skips and
 * which, in a real browser, has no accessible name to assert on either.
 */
function linksIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('a[href]')).filter((link) =>
		link.checkVisibility()
	);
}

/**
 * An element's **own** text — its direct text-node children, whitespace-
 * normalised — which is what Testing Library's `getByText` matches against
 * (`getNodeText`), and is not what a Playwright-style locator matches.
 *
 * `renders icon with label` needs it: `TopNavItem` renders `{icon}{label}` into
 * one element, so upstream's `getByText('Settings')` matches the item, whose own
 * text is exactly `Settings` beside the icon element. This project's locators
 * match the full `textContent` — `Icon Settings` — so `getByText('Settings')`
 * would pass only on the substring and `getByText('Settings', {exact: true})`
 * matches nothing. This is upstream's rule written out.
 */
function ownText(element: Element | null): string | undefined {
	if (!element) return undefined;
	return Array.from(element.childNodes)
		.filter((node) => node.nodeType === Node.TEXT_NODE)
		.map((node) => node.textContent ?? '')
		.join('')
		.replace(/\s+/g, ' ')
		.trim();
}

describe('TopNav', () => {
	it('renders with navigation role', async () => {
		const screen = await render(TopNav, { props: { label: 'Main navigation' } });
		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
	});

	it('renders aria-label from label prop', async () => {
		const screen = await render(TopNav, { props: { label: 'Primary navigation' } });
		await expect
			.element(screen.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Primary navigation');
	});

	it('defaults the landmark label to "Top navigation" when label is omitted', async () => {
		const screen = await render(TopNav);
		await expect
			.element(screen.getByRole('navigation', { name: 'Top navigation', exact: true }))
			.toBeInTheDocument();
	});

	it('defaults the landmark label in mobile-bar mode', async () => {
		const screen = await render(TopNavFixture, {
			props: { mode: 'mobile-bar', heading: { text: 'Logo' } }
		});
		await expect
			.element(screen.getByRole('navigation', { name: 'Top navigation', exact: true }))
			.toBeInTheDocument();
	});

	it('custom label overrides the default in mobile-bar mode', async () => {
		const screen = await render(TopNavFixture, {
			props: { mode: 'mobile-bar', nav: { label: 'Utility navigation' } }
		});
		await expect
			.element(screen.getByRole('navigation', { name: 'Utility navigation', exact: true }))
			.toBeInTheDocument();
	});

	it('renders heading slot content', async () => {
		const screen = await render(TopNavFixture, {
			props: { heading: { text: 'Logo', testid: 'title-content' } }
		});
		await expect.element(screen.getByTestId('title-content')).toBeInTheDocument();
	});

	it('renders startContent slot', async () => {
		const screen = await render(TopNavFixture, {
			props: { startContent: { text: 'Nav Items', testid: 'start-content' } }
		});
		await expect.element(screen.getByTestId('start-content')).toBeInTheDocument();
	});

	it('renders children as startContent', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				body: {
					items: [
						{ label: 'Home', href: '/' },
						{ label: 'About', href: '/about' }
					]
				}
			}
		});

		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('link', { name: 'About', exact: true }))
			.toBeInTheDocument();
	});

	it('prefers startContent when both startContent and children are provided', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				startContent: { items: [{ label: 'Start', href: '/start' }] },
				body: { items: [{ label: 'Child', href: '/child' }] }
			}
		});

		await expect
			.element(screen.getByRole('link', { name: 'Start', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('link', { name: 'Child', exact: true }))
			.not.toBeInTheDocument();
	});

	it('renders endContent slot', async () => {
		const screen = await render(TopNavFixture, {
			props: { endContent: { text: 'Actions', testid: 'end-content' } }
		});
		await expect.element(screen.getByTestId('end-content')).toBeInTheDocument();
	});

	it('renders centerContent slot', async () => {
		const screen = await render(TopNavFixture, {
			props: { centerContent: { text: 'Center', testid: 'center-content' } }
		});
		await expect.element(screen.getByTestId('center-content')).toBeInTheDocument();
	});

	it('renders all slots together', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				heading: { text: 'Title', testid: 'title' },
				startContent: { text: 'Start', testid: 'start' },
				centerContent: { text: 'Center', testid: 'center' },
				endContent: { text: 'End', testid: 'end' }
			}
		});
		await expect.element(screen.getByTestId('title')).toBeInTheDocument();
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
		await expect.element(screen.getByTestId('center')).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('renders without centerContent (backward compatible)', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				heading: { text: 'Title', testid: 'title' },
				startContent: { text: 'Start', testid: 'start' },
				endContent: { text: 'End', testid: 'end' }
			}
		});
		await expect.element(screen.getByTestId('title')).toBeInTheDocument();
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('renders centerContent without endContent', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				heading: { text: 'Title', testid: 'title' },
				centerContent: { text: 'Center', testid: 'center' }
			}
		});
		await expect.element(screen.getByTestId('title')).toBeInTheDocument();
		await expect.element(screen.getByTestId('center')).toBeInTheDocument();

		const nav = screen.container.querySelector('nav')!;
		// 3 child divs: left section, center section, right section (even without endContent)
		expect(nav.children).toHaveLength(3);
	});

	it('renders centerContent without startContent', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				centerContent: { text: 'Center', testid: 'center' },
				endContent: { text: 'End', testid: 'end' }
			}
		});
		await expect.element(screen.getByTestId('center')).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();

		const nav = screen.container.querySelector('nav')!;
		// 3 child divs: left section, center section, right section
		expect(nav.children).toHaveLength(3);
	});

	it('forwards ref correctly', async () => {
		// COUNTERPART: Svelte has no `ref`. The `<nav>` reaches a consumer through
		// an attachment passed in rest props, which `TopNav` spreads onto it.
		// Asserting on the element received is stricter than upstream's
		// `toHaveBeenCalledWith(expect.any(HTMLElement))`.
		const attached = vi.fn();
		const screen = await render(TopNavFixture, {
			props: { nav: { [createAttachmentKey()]: attached } }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('nav'));
	});

	it('does not create a stacking context on nav element', async () => {
		const screen = await render(TopNavFixture, {
			props: {
				nav: { label: 'Main navigation' },
				startContent: { text: 'Start' },
				endContent: { text: 'End' }
			}
		});
		const nav = screen.container.querySelector('nav')!;
		// Nav itself should NOT have position: relative — the wrapper provides
		// positioning context for the mega menu panel.
		expect(nav).not.toHaveStyle({ position: 'relative' });
	});
});

describe('TopNavHeading', () => {
	it('renders heading text', async () => {
		const screen = await render(TopNavHeading, { props: { heading: 'My App' } });
		await expect.element(screen.getByText('My App', { exact: true })).toBeInTheDocument();
	});

	it('renders logo element', async () => {
		const screen = await render(TopNavHeadingFixture, {
			props: { logo: { text: 'Logo', testid: 'logo' } }
		});
		await expect.element(screen.getByTestId('logo')).toBeInTheDocument();
	});

	it('renders both logo and heading', async () => {
		const screen = await render(TopNavHeadingFixture, {
			props: { props: { heading: 'Dashboard' }, logo: { text: 'Logo', testid: 'logo' } }
		});
		await expect.element(screen.getByText('Dashboard', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByTestId('logo')).toBeInTheDocument();
	});

	describe('logo link accessible name', () => {
		// Upstream's `const logo = <img src="/logo.png" alt="" />` — decorative.
		const logo = { img: true };

		// A logo image is decorative; when the logo is wrapped in a link the link
		// itself needs an accessible name, otherwise axe reports link-name.
		it('names the logo link in the independent-links config', async () => {
			const screen = await render(TopNavHeadingFixture, {
				props: {
					logo,
					props: {
						superheading: 'Suite',
						superheadingHref: '/suite',
						heading: 'Product',
						headingHref: '/product'
					}
				}
			});
			// No link should have an empty accessible name.
			const links = linksIn(screen.container);
			expect(links.length).toBeGreaterThan(0);
			for (const link of links) {
				expect(link).toHaveAccessibleName();
			}
			// The logo link is named from the heading.
			//
			// RESTATED, and stricter: upstream's
			// `getAllByRole('link', {name: 'Product'}).length >= 1` is satisfied by the
			// *heading* link, which is named by its own text — so it passes whether or
			// not the logo link got a name, which is the thing the case is about. This
			// counts the links named by `aria-label`, i.e. the logo link specifically.
			expect(
				links.filter((link) => link.getAttribute('aria-label') === 'Product').length
			).toBeGreaterThanOrEqual(1);
		});

		it('names the logo link in the menu + hrefs config', async () => {
			const screen = await render(TopNavHeadingFixture, {
				props: {
					logo,
					props: {
						superheading: 'Suite',
						superheadingHref: '/suite',
						heading: 'Product',
						headingHref: '/product'
					},
					menu: { href: '#menu', text: 'Menu item' }
				}
			});
			const links = linksIn(screen.container);
			expect(links.length).toBeGreaterThan(0);
			for (const link of links) {
				expect(link).toHaveAccessibleName();
			}
		});

		it('names a logo-only link via logoLabel', async () => {
			const screen = await render(TopNavHeadingFixture, {
				props: { logo, props: { headingHref: '/home', logoLabel: 'Home' } }
			});
			await expect
				.element(screen.getByRole('link', { name: 'Home', exact: true }))
				.toHaveAttribute('href', '/home');
		});
	});

	it('renders as anchor when headingHref is provided', async () => {
		const screen = await render(TopNavHeading, { props: { heading: 'Home', headingHref: '/' } });
		await expect.element(screen.getByRole('link')).toHaveAttribute('href', '/');
	});

	it('renders as div when no href', async () => {
		const screen = await render(TopNavHeading, { props: { heading: 'Home' } });
		await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
	});

	it('forwards ref correctly', async () => {
		// COUNTERPART: as above — the root reaches a consumer through an attachment
		// in rest props, and the assertion reads the element itself.
		const attached = vi.fn();
		const screen = await render(TopNavHeading, {
			props: { heading: 'Test', [createAttachmentKey()]: attached }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.firstElementChild);
	});
});

describe('NavIcon', () => {
	it('renders icon content', async () => {
		const screen = await render(SlotProbe, {
			props: { component: NavIcon, slot: 'icon', text: 'Icon', testid: 'icon' }
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('forwards ref correctly', async () => {
		// COUNTERPART: as above. Upstream asserts `expect.any(HTMLSpanElement)`;
		// this asserts the attachment received the rendered `<span>` itself.
		const attached = vi.fn();
		const screen = await render(SlotProbe, {
			props: {
				component: NavIcon,
				slot: 'icon',
				text: 'Icon',
				rest: { [createAttachmentKey()]: attached }
			}
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLSpanElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('span'));
	});
});

describe('TopNavItem', () => {
	it('renders label as visible text', async () => {
		const screen = await render(TopNavItem, { props: { label: 'Home' } });
		await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
	});

	it('renders as anchor element', async () => {
		const screen = await render(TopNavItem, { props: { label: 'Home', href: '/' } });
		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('href', '/');
	});

	it('renders children instead of label when provided', async () => {
		const screen = await render(TopNavItemFixture, {
			props: { props: { label: 'Accessible name' }, body: 'Custom content' }
		});
		await expect.element(screen.getByText('Custom content', { exact: true })).toBeInTheDocument();
	});

	it('applies aria-current when isSelected', async () => {
		const screen = await render(TopNavItem, {
			props: { label: 'Home', href: '#', isSelected: true }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
	});

	it('does not have aria-current when not selected', async () => {
		const screen = await render(TopNavItem, { props: { label: 'Home', href: '#' } });
		await expect.element(screen.getByRole('link')).not.toHaveAttribute('aria-current');
	});

	it('applies aria-disabled when isDisabled', async () => {
		const screen = await render(TopNavItem, {
			props: { label: 'Home', href: '#', isDisabled: true }
		});
		// Reached through the text rather than the link role: a disabled item is an
		// href-less anchor now, which exposes no link role at all.
		expect(screen.container.querySelector('a')).toHaveAttribute('aria-disabled', 'true');
	});

	it('sets tabIndex to -1 when disabled', async () => {
		const screen = await render(TopNavItem, {
			props: { label: 'Home', href: '#', isDisabled: true }
		});
		// `tabIndex` is React's prop name; the attribute is `tabindex` on both sides
		// (HTML attribute lookups are case-insensitive, so upstream's spelling reads
		// the same node).
		expect(screen.container.querySelector('a')).toHaveAttribute('tabindex', '-1');
	});

	describe('disabled items do not navigate', () => {
		it('drops href/target and suppresses clicks when disabled (default mode)', async () => {
			const handleClick = vi.fn();
			const screen = await render(TopNavItem, {
				props: {
					label: 'Home',
					href: '/home',
					target: '_blank',
					onclick: handleClick,
					isDisabled: true
				}
			});
			// An href-less anchor exposes no link role, so it is not announced with a
			// live destination.
			expect(screen.container.querySelector('[role="link"], a[href]')).toBeNull();
			const item = screen.container.querySelector('a') as HTMLAnchorElement;
			expect(item).not.toHaveAttribute('href');
			expect(item).not.toHaveAttribute('target');
			expect(item).toHaveAttribute('aria-disabled', 'true');
			expect(item).toHaveAttribute('tabindex', '-1');

			// A dispatched click bypasses pointer-events: none, simulating
			// programmatic/AT activation. `dispatchEvent` returns false when
			// preventDefault was called, i.e. any default navigation is cancelled —
			// upstream reads the same boolean out of `fireEvent.click`.
			const notCancelled = item.dispatchEvent(
				new MouseEvent('click', { bubbles: true, cancelable: true })
			);
			expect(notCancelled).toBe(false);
			expect(handleClick).not.toHaveBeenCalled();
		});

		it('drops href/target and suppresses clicks when disabled (drawer mode)', async () => {
			const handleClick = vi.fn();
			const screen = await render(TopNavRenderModeFixture, {
				props: {
					mode: 'drawer',
					props: {
						label: 'Home',
						href: '/home',
						target: '_blank',
						onclick: handleClick,
						isDisabled: true
					}
				}
			});
			expect(screen.container.querySelector('[role="link"], a[href]')).toBeNull();
			const item = screen.container.querySelector('a') as HTMLAnchorElement;
			expect(item).not.toHaveAttribute('href');
			expect(item).not.toHaveAttribute('target');
			expect(item).toHaveAttribute('aria-disabled', 'true');
			expect(item).toHaveAttribute('tabindex', '-1');

			const notCancelled = item.dispatchEvent(
				new MouseEvent('click', { bubbles: true, cancelable: true })
			);
			expect(notCancelled).toBe(false);
			expect(handleClick).not.toHaveBeenCalled();
		});

		it('keeps href and click behavior for enabled items (default mode)', async () => {
			const handleClick = vi.fn();
			const screen = await render(TopNavItem, {
				props: { label: 'Home', href: '#', onclick: handleClick }
			});
			const link = screen.getByRole('link', { name: 'Home', exact: true });
			await expect.element(link).toHaveAttribute('href', '#');
			await expect.element(link).not.toHaveAttribute('aria-disabled');

			await link.click();
			expect(handleClick).toHaveBeenCalledTimes(1);
		});
	});

	it('renders icon with label', async () => {
		const screen = await render(TopNavItemFixture, {
			props: { props: { label: 'Settings' }, icon: { text: 'Icon', testid: 'icon' } }
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		// COUNTERPART for upstream's `getByText('Settings')` — see `ownText`.
		expect(ownText(screen.container.querySelector('a'))).toBe('Settings');
	});

	it('hides label and sets aria-label when isIconOnly', async () => {
		const screen = await render(TopNavItemFixture, {
			props: {
				props: { label: 'Settings', href: '#', isIconOnly: true },
				icon: { text: '⚙️', testid: 'icon' }
			}
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		await expect.element(screen.getByText('Settings', { exact: true })).not.toBeInTheDocument();
		await expect.element(screen.getByRole('link')).toHaveAttribute('aria-label', 'Settings');
	});

	it('handles click events', async () => {
		const handleClick = vi.fn();
		const screen = await render(TopNavItem, {
			props: { label: 'Click me', href: '#', onclick: handleClick }
		});

		await userEvent.click(screen.getByRole('link'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('forwards ref correctly', async () => {
		// COUNTERPART: as above. Upstream asserts `expect.any(HTMLAnchorElement)`;
		// this asserts the attachment received the rendered `<a>` itself.
		const attached = vi.fn();
		const screen = await render(TopNavItem, {
			props: { label: 'Test', [createAttachmentKey()]: attached }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLAnchorElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('a'));
	});

	it('renders custom component when as is provided', async () => {
		const screen = await render(TopNavItem, {
			props: { label: 'Home', href: '/', as: CustomLink as LinkComponentType }
		});
		const link = screen.getByRole('link', { name: 'Home', exact: true });
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).toHaveAttribute('href', '/');
	});

	it('renders custom component from LinkProvider', async () => {
		const screen = await render(TopNavItemFixture, {
			props: { props: { label: 'Home', href: '/' }, provider: CustomLink }
		});
		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('data-custom-link');
	});

	it('as prop overrides LinkProvider', async () => {
		const screen = await render(TopNavItemFixture, {
			props: {
				props: { label: 'Home', href: '/', as: CustomLink },
				provider: AnotherLink
			}
		});
		const link = screen.getByRole('link', { name: 'Home', exact: true });
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).not.toHaveAttribute('data-another-link');
	});

	describe('TopNavMegaMenuFeaturedCard rest forwarding', () => {
		it('forwards data-testid, id, and aria-* to the root element', async () => {
			const screen = await render(TopNavMegaMenuFeaturedCard, {
				props: {
					title: "What's new",
					description: 'Details',
					'data-testid': 'featured-card',
					id: 'card-1',
					'aria-label': 'Featured'
				}
			});
			const card = screen.getByTestId('featured-card');
			await expect.element(card).toHaveAttribute('id', 'card-1');
			await expect.element(card).toHaveAttribute('aria-label', 'Featured');
		});
	});
});

/**
 * Upstream's `describe('TopNavHeading hover/click guard')`, all four cases, new
 * at 0.4.2 with the #3121 `useMenuHover` consolidation — `TopNavHeading` gained
 * the guard it never had.
 *
 * Timing translation is `menu-hover.svelte.test.ts`'s: upstream drives fake
 * timers and `act()`, these wait out real ones. The hover is dispatched
 * synthetically rather than through Playwright because the popup deliberately
 * overlaps its own trigger, so a real pointer press hit-tests into the popup —
 * the seam `side-nav.svelte.test.ts`'s `openMenu` records at length.
 */
describe('TopNavHeading hover/click guard', () => {
	const menuItems = ['Alpha', 'Beta'];
	/** The hook's `DEFAULT_CLICK_GUARD_MS`. */
	const CLICK_GUARD_MS = 500;

	async function renderHeading() {
		const screen = await render(TopNavHeadingFixture, {
			props: { props: { heading: 'My App' }, menuItems }
		});
		// The heading is a full-width row under Playwright's parked cursor, so a
		// close springs straight back open without this. See `park-pointer.ts`.
		await parkPointer();
		return {
			screen,
			trigger: screen
				.getByRole('button', { name: 'Open menu', exact: true })
				.element() as HTMLElement
		};
	}

	/** `mouseenter` does not bubble; walk the chain a real pointer would enter. */
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
		// Awaited where upstream asserts synchronously: `await user.click()` gave
		// React a render, while a native `.click()` returns before Svelte flushes.
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
