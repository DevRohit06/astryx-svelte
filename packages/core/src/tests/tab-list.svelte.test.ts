/** PORTS: TabList/TabList.test.tsx */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TabListFixture from './fixtures/tab-list-fixture.svelte';
import CustomLink from './fixtures/custom-link.svelte';

/**
 * Ported from Astryx's `TabList/TabList.test.tsx`. **46 of its 74 cases at the
 * 0.5.0 pin.** This suite ported all 45 at 0.4.5; 0.5.0 rewrote two `aria-current`
 * cases (`"page"` -> `"true"`), added a link-tab counterpart — the three that are
 * here — and added 28 more across four new describes that are **not yet ported**:
 * `TabList overflow (scroll)` (16), `ARIA pattern - role="tablist"` (9), `- no
 * role` (2) and `- any other role` (1). Those cover #5348 and #5349, whose source
 * half landed in batch 032; the suite is the half still owed.
 * Client (real Chromium) project.
 *
 * Standing translations:
 *
 * - Tabs are a data spec through `tab-list-fixture` (`icon`/`selectedIcon`/
 *   `endContent` are `Snippet`s here, and a snippet can only be authored in a
 *   template). `TabList` itself takes compositional `children` on both sides —
 *   it never sliced them — so nothing about the strip's shape changes.
 * - Upstream's `beforeAll` stubbing `showPopover`/`hidePopover`/`:popover-open`
 *   is gone: Chromium is native. The four cases that assert on the *call*
 *   `vi.spyOn` the native method, which calls through — the same move
 *   `dropdown-menu`/`more-menu` make.
 * - `getByRole(…, {hidden: true})` becomes a container `querySelector`: a closed
 *   popover is `display: none` in a real browser, so an accessibility-tree query
 *   cannot see it.
 * - `fireEvent.keyDown(el, …)` becomes `dispatchEvent(new KeyboardEvent(…))`.
 * - `rerender` maps straight across; `vitest-browser-svelte`'s is async.
 *
 * Two restated cases, both noted at the case and with their assertions intact:
 * `moves focus between items with ArrowDown and ArrowUp` and `moves the roving
 * tab stop with arrow navigation`. The APG focus-on-open `requestAnimationFrame`
 * has *settled* by the time a Playwright click resolves, where jsdom's timing
 * leaves it pending — so the menu opens with its first item already focused and
 * upstream's key sequence is shifted by one step. What is asserted (ArrowDown
 * advances, ArrowUp retreats, the tab stop follows focus) is unchanged.
 */

const menuOptions = [
	{ value: 'analytics', label: 'Analytics' },
	{ value: 'reports', label: 'Reports' }
];

const homeAndSettings = [
	{ props: { value: 'home', label: 'Home' } },
	{ props: { value: 'settings', label: 'Settings' } }
];

function navIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('nav');
	if (!el) throw new Error('expected a <nav>');
	return el;
}

function navClassSet(container: HTMLElement): Set<string> {
	return new Set(navIn(container).className.split(/\s+/).filter(Boolean));
}

function menuIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="menu"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="menu" element');
	return el;
}

/**
 * The overflow menu is single-select, so its options are `menuitemradio` rows
 * (APG menu-button), not plain `menuitem`s — upstream's own queries moved to
 * that role at 0.3.0.
 */
function menuItem(container: HTMLElement, name: string): HTMLElement {
	const el = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitemradio"]')).find(
		(item) => item.textContent?.trim() === name
	);
	if (!el) throw new Error(`no menuitemradio named "${name}"`);
	return el;
}

function pressKey(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('TabList', () => {
	it('renders a nav element with tab buttons', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: homeAndSettings }
		});

		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Settings', exact: true }))
			.toBeInTheDocument();
	});

	it('does not set aria-orientation on the nav (invalid for role navigation)', async () => {
		// Regression: aria-orientation is not an allowed attribute on the
		// navigation role and produces an axe aria-allowed-attr violation.
		// TabList deliberately never sets this attribute.
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: homeAndSettings }
		});

		expect(navIn(screen.container)).not.toHaveAttribute('aria-orientation');
	});

	it('ignores a consumer-supplied aria-orientation on the nav', async () => {
		// A caller passing aria-orientation should not reintroduce the invalid
		// attribute onto the nav.
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {}, 'aria-orientation': 'vertical' },
				tabs: homeAndSettings
			}
		});

		expect(navIn(screen.container)).not.toHaveAttribute('aria-orientation');
	});

	it('marks selected tab with a generic aria-current, not "page"', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: homeAndSettings }
		});

		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toHaveAttribute('aria-current', 'true');
		await expect
			.element(screen.getByRole('button', { name: 'Settings', exact: true }))
			.not.toHaveAttribute('aria-current');
	});

	it('marks a selected link tab with the same generic aria-current', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [
					{ props: { value: 'home', label: 'Home', href: '/home' } },
					{ props: { value: 'settings', label: 'Settings', href: '/settings' } }
				]
			}
		});

		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('aria-current', 'true');
		await expect
			.element(screen.getByRole('link', { name: 'Settings', exact: true }))
			.not.toHaveAttribute('aria-current');
	});

	it('calls onChange when a tab is clicked', async () => {
		const handleChange = vi.fn();
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: handleChange }, tabs: homeAndSettings }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Settings', exact: true }));
		expect(handleChange).toHaveBeenCalledWith('settings');
	});

	it('updates aria-current when value changes', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: homeAndSettings }
		});

		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toHaveAttribute('aria-current', 'true');

		await screen.rerender({
			tabList: { value: 'settings', onChange: () => {} },
			tabs: homeAndSettings
		});

		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.not.toHaveAttribute('aria-current');
		await expect
			.element(screen.getByRole('button', { name: 'Settings', exact: true }))
			.toHaveAttribute('aria-current', 'true');
	});

	it('renders with different sizes', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {}, size: 'sm' },
				tabs: [{ props: { value: 'home', label: 'Home' } }]
			}
		});
		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toBeInTheDocument();

		await screen.rerender({
			tabList: { value: 'home', onChange: () => {}, size: 'lg' },
			tabs: [{ props: { value: 'home', label: 'Home' } }]
		});
		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toBeInTheDocument();
	});

	it('renders tab with icon', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [{ props: { value: 'home', label: 'Home' }, icon: { testid: 'icon', glyph: '🏠' } }]
			}
		});

		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders icon-only tab with aria-label from label prop', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'preview', onChange: () => {} },
				tabs: [
					{
						props: { value: 'preview', label: 'Preview', isLabelHidden: true },
						icon: { testid: 'icon', glyph: '▣' }
					}
				]
			}
		});

		const tab = screen.getByRole('button', { name: 'Preview', exact: true });
		await expect.element(tab).toHaveAttribute('aria-label', 'Preview');
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		// The visible label is omitted entirely, so "Preview" appears only as the
		// accessible name.
		expect(screen.container.textContent).not.toContain('Preview');
	});

	it('omits empty label nodes so aria-labeled icon tabs align to the icon', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'preview', onChange: () => {} },
				tabs: [
					{
						props: { value: 'preview', label: '', 'aria-label': 'Preview' },
						icon: { testid: 'icon', glyph: '▣' }
					}
				]
			}
		});

		const tab = screen.getByRole('button', { name: 'Preview', exact: true });
		await expect.element(tab).toBeInTheDocument();
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		expect((tab.element() as HTMLElement).querySelectorAll(':scope > span').length).toBe(3);
	});

	it('renders selectedIcon when tab is selected', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [
					{
						props: { value: 'home', label: 'Home' },
						icon: { testid: 'icon', glyph: '○' },
						selectedIcon: { testid: 'selected-icon', glyph: '●' }
					}
				]
			}
		});

		await expect.element(screen.getByTestId('selected-icon')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeInTheDocument();
	});

	it('renders regular icon when tab is not selected', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'other', onChange: () => {} },
				tabs: [
					{
						props: { value: 'home', label: 'Home' },
						icon: { testid: 'icon', glyph: '○' },
						selectedIcon: { testid: 'selected-icon', glyph: '●' }
					}
				]
			}
		});

		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-testid="selected-icon"]')).not.toBeInTheDocument();
	});

	it('renders endContent after the label', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [{ props: { value: 'home', label: 'Home' }, end: { testid: 'badge', text: '5' } }]
			}
		});

		await expect.element(screen.getByTestId('badge')).toBeInTheDocument();
		expect(screen.getByTestId('badge').element().textContent).toBe('5');
	});

	it('does not render endContent wrapper when endContent is not provided', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [{ props: { value: 'home', label: 'Home' } }]
			}
		});

		// Button children: hoverBg, labelContainer, indicator (no endContent wrapper)
		const button = screen
			.getByRole('button', { name: 'Home', exact: true })
			.element() as HTMLElement;
		expect(button.querySelectorAll(':scope > span').length).toBe(3);
	});

	it('renders endContent in link tabs', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [
					{
						props: { value: 'home', label: 'Home', href: '/home' },
						end: { testid: 'dot', text: '●' }
					}
				]
			}
		});

		await expect.element(screen.getByTestId('dot')).toBeInTheDocument();
	});
});

describe('TabList divider gap', () => {
	// The divider adds the reserved gap + indicator offset via a single class
	// (StyleX applies deterministic classes in the test env). Capture that
	// class set once so the assertions describe intent, not opaque hashes.
	//
	// Upstream renders/unmounts once per variant; here the two variants are two
	// renders of the same tree via `rerender`, which is the same measurement
	// without needing an imperative unmount.
	const oneTab = [{ props: { value: 'home', label: 'Home' } }];

	it('adds divider-only styling classes when hasDivider is set', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {}, hasDivider: false }, tabs: oneTab }
		});
		const withoutDivider = navClassSet(screen.container);

		await screen.rerender({
			tabList: { value: 'home', onChange: () => {}, hasDivider: true },
			tabs: oneTab
		});
		const withDivider = navClassSet(screen.container);

		// Every class the plain nav has must still be present when divided: the
		// divider only adds styling (border + reserved gap + indicator offset),
		// it never removes the base nav styles.
		for (const cls of withoutDivider) {
			expect(withDivider.has(cls)).toBe(true);
		}

		// And it must add at least one class the undivided nav does not have.
		const added = [...withDivider].filter((c) => !withoutDivider.has(c));
		expect(added.length).toBeGreaterThan(0);
	});

	it('does not add divider styling to an undivided tab list (default)', async () => {
		// Default (no hasDivider) and explicit hasDivider={false} are identical:
		// the non-divided path is untouched by the divider gap change.
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {}, hasDivider: false }, tabs: oneTab }
		});
		const explicitlyFalse = navClassSet(screen.container);

		await screen.rerender({ tabList: { value: 'home', onChange: () => {} }, tabs: oneTab });
		expect(navClassSet(screen.container)).toEqual(explicitlyFalse);
	});

	it('keeps the selected indicator rendered under a divider', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {}, hasDivider: true },
				tabs: [
					{ props: { value: 'home', label: 'Home' } },
					{ props: { value: 'away', label: 'Away' } }
				]
			}
		});
		const selected = screen
			.getByRole('button', { name: 'Home', exact: true })
			.element() as HTMLElement;
		// The indicator span carries the selected marker; the divider must not
		// drop it (it is repositioned onto the rail, not removed).
		expect(selected.querySelector('[data-selected="selected"]')).toBeInTheDocument();
	});
});

describe('TabList keyboard navigation (roving tabindex)', () => {
	const three = [
		{ props: { value: 'home', label: 'Home' } },
		{ props: { value: 'settings', label: 'Settings' } },
		{ props: { value: 'profile', label: 'Profile' } }
	];

	it('exposes the tab strip as a single Tab stop (only selected tab is tabbable)', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'settings', onChange: () => {} }, tabs: three }
		});

		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toHaveAttribute('tabindex', '-1');
		await expect
			.element(screen.getByRole('button', { name: 'Settings', exact: true }))
			.toHaveAttribute('tabindex', '0');
		await expect
			.element(screen.getByRole('button', { name: 'Profile', exact: true }))
			.toHaveAttribute('tabindex', '-1');
	});

	it('makes the first tab tabbable when the selected value matches no tab', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: '__none__', onChange: () => {} }, tabs: homeAndSettings }
		});

		await expect
			.element(screen.getByRole('button', { name: 'Home', exact: true }))
			.toHaveAttribute('tabindex', '0');
		await expect
			.element(screen.getByRole('button', { name: 'Settings', exact: true }))
			.toHaveAttribute('tabindex', '-1');
	});

	it('moves focus with ArrowRight and ArrowLeft', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: three }
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		const settings = screen
			.getByRole('button', { name: 'Settings', exact: true })
			.element() as HTMLElement;
		const profile = screen
			.getByRole('button', { name: 'Profile', exact: true })
			.element() as HTMLElement;

		home.focus();
		expect(document.activeElement).toBe(home);

		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(settings);

		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(profile);

		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(settings);
	});

	it('supports ArrowDown and ArrowUp as forward/backward as well', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: homeAndSettings }
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		const settings = screen
			.getByRole('button', { name: 'Settings', exact: true })
			.element() as HTMLElement;

		home.focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(settings);

		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(home);
	});

	it('jumps to first and last tab with Home and End', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'settings', onChange: () => {} }, tabs: three }
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		const settings = screen
			.getByRole('button', { name: 'Settings', exact: true })
			.element() as HTMLElement;
		const profile = screen
			.getByRole('button', { name: 'Profile', exact: true })
			.element() as HTMLElement;

		settings.focus();

		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(profile);

		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(home);
	});

	it('wraps around at the ends', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: three }
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		const profile = screen
			.getByRole('button', { name: 'Profile', exact: true })
			.element() as HTMLElement;

		home.focus();
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(profile);

		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(home);
	});

	it('skips disabled tabs during arrow navigation', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [
					{ props: { value: 'home', label: 'Home' } },
					{ props: { value: 'settings', label: 'Settings', 'aria-disabled': 'true' } },
					{ props: { value: 'profile', label: 'Profile' } }
				]
			}
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		const profile = screen
			.getByRole('button', { name: 'Profile', exact: true })
			.element() as HTMLElement;

		home.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(profile);
	});

	it('does not intercept unrelated keys', async () => {
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {} }, tabs: homeAndSettings }
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		home.focus();
		await userEvent.keyboard('a');
		expect(document.activeElement).toBe(home);
	});

	it('composes consumer onKeyDown with internal arrow navigation', async () => {
		const onkeydown = vi.fn();
		const screen = await render(TabListFixture, {
			props: { tabList: { value: 'home', onChange: () => {}, onkeydown }, tabs: homeAndSettings }
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		const settings = screen
			.getByRole('button', { name: 'Settings', exact: true })
			.element() as HTMLElement;

		home.focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(onkeydown).toHaveBeenCalled();
		expect(document.activeElement).toBe(settings);
	});

	it('respects preventDefault from consumer onKeyDown', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: {
					value: 'home',
					onChange: () => {},
					onkeydown: (e: KeyboardEvent) => e.preventDefault()
				},
				tabs: homeAndSettings
			}
		});

		const home = screen.getByRole('button', { name: 'Home', exact: true }).element() as HTMLElement;
		home.focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(document.activeElement).toBe(home);
	});
});

describe('Tab polymorphic link', () => {
	it('renders custom component when href and as are provided', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [{ props: { value: 'home', label: 'Home', href: '/home', as: CustomLink } }]
			}
		});
		const link = screen.getByRole('link', { name: 'Home', exact: true });
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).toHaveAttribute('href', '/home');
	});

	it('still renders button without href even with as prop', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [{ props: { value: 'home', label: 'Home', as: CustomLink } }]
			}
		});
		const button = screen.getByRole('button', { name: 'Home', exact: true });
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).not.toHaveAttribute('data-custom-link');
	});

	it('renders custom component from LinkProvider when href is provided', async () => {
		const screen = await render(TabListFixture, {
			props: {
				tabList: { value: 'home', onChange: () => {} },
				tabs: [{ props: { value: 'home', label: 'Home', href: '/home' } }],
				provider: CustomLink
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('data-custom-link');
	});
});

describe('TabMenu', () => {
	const withMenu = {
		tabList: { value: 'home', onChange: () => {} },
		tabs: [{ props: { value: 'home', label: 'Home' } }],
		menu: { label: 'More', options: menuOptions }
	};

	it('renders a trigger button with aria-haspopup and aria-controls', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		const trigger = screen.getByRole('button', { name: 'More', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		// aria-controls points to the menu element
		const menuId = (trigger.element() as HTMLElement).getAttribute('aria-controls');
		expect(menuId).toBeTruthy();
		const menu = document.getElementById(menuId!);
		expect(menu).toBeInTheDocument();
		expect(menu).toHaveAttribute('role', 'menu');
	});

	it('shows label prop as trigger text when no option is selected', async () => {
		const screen = await render(TabListFixture, { props: withMenu });
		await expect
			.element(screen.getByRole('button', { name: 'More', exact: true }))
			.toBeInTheDocument();
	});

	it('shows selected option label as trigger text when an option is active', async () => {
		const screen = await render(TabListFixture, {
			props: { ...withMenu, tabList: { value: 'analytics', onChange: () => {} } }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Analytics', exact: true }))
			.toBeInTheDocument();
	});

	it('opens dropdown on click and shows menu items', async () => {
		const showPopover = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(TabListFixture, { props: withMenu });

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));

		expect(showPopover).toHaveBeenCalled();

		expect(menuItem(screen.container, 'Analytics')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Reports')).toBeInTheDocument();
	});

	it('renders heading with menu label in dropdown', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		// The dropdown has role="menu" with aria-label
		const menu = menuIn(screen.container);
		expect(menu).toHaveAttribute('aria-label', 'More');

		// The heading is a presentation span with the menu label
		const heading = screen.container.querySelector('[role="presentation"]');
		expect(heading).toHaveTextContent('More');
	});

	it('selects a menu item and calls onChange', async () => {
		const handleChange = vi.fn();
		const screen = await render(TabListFixture, {
			props: { ...withMenu, tabList: { value: 'home', onChange: handleChange } }
		});

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		await userEvent.click(menuItem(screen.container, 'Analytics'));
		expect(handleChange).toHaveBeenCalledWith('analytics');
	});

	it('exposes options as menuitemradio and marks the selected tab aria-checked', async () => {
		const screen = await render(TabListFixture, {
			props: { ...withMenu, tabList: { value: 'analytics', onChange: () => {} } }
		});

		// Single-select menu options carry radio semantics (APG menu-button):
		// role="menuitemradio" + aria-checked, not menuitem + aria-current.
		const analyticsItem = menuItem(screen.container, 'Analytics');
		expect(analyticsItem).toHaveAttribute('aria-checked', 'true');
		expect(analyticsItem).not.toHaveAttribute('aria-current');

		expect(menuItem(screen.container, 'Reports')).toHaveAttribute('aria-checked', 'false');
	});
});

describe('TabMenu keyboard navigation (roving tabindex)', () => {
	const withMenu = {
		tabList: { value: 'home', onChange: () => {} },
		tabs: [{ props: { value: 'home', label: 'Home' } }],
		menu: { label: 'More', options: menuOptions }
	};

	it('exposes the overflow menu as a single Tab stop (one item tabbable, rest -1)', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));

		const analytics = menuItem(screen.container, 'Analytics');
		const reports = menuItem(screen.container, 'Reports');

		// Exactly one menu item is in the Tab sequence; arrow keys reach the rest.
		expect(analytics).toHaveAttribute('tabindex', '0');
		expect(reports).toHaveAttribute('tabindex', '-1');

		const tabbable = [analytics, reports].filter((el) => el.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
	});

	it('moves focus between items with ArrowDown and ArrowUp', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		const menu = menuIn(screen.container);
		const analytics = menuItem(screen.container, 'Analytics');
		const reports = menuItem(screen.container, 'Reports');

		// Restated (see file header): the APG focus-on-open has settled, so the menu
		// opens with the first item focused rather than with focus unset.
		expect(document.activeElement).toBe(analytics);

		pressKey(menu, 'ArrowDown');
		expect(document.activeElement).toBe(reports);

		pressKey(menu, 'ArrowUp');
		expect(document.activeElement).toBe(analytics);
	});

	it('moves the roving tab stop with arrow navigation', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		const menu = menuIn(screen.container);
		const analytics = menuItem(screen.container, 'Analytics');
		const reports = menuItem(screen.container, 'Reports');

		// Restated (see file header): one ArrowDown reaches "Reports" here, because
		// focus-on-open has already landed on "Analytics".
		pressKey(menu, 'ArrowDown');

		// The tab stop follows focus, so it is still a single stop after moving.
		expect(reports).toHaveAttribute('tabindex', '0');
		expect(analytics).toHaveAttribute('tabindex', '-1');
	});

	it('jumps to first and last item with Home and End', async () => {
		const options = [
			{ value: 'analytics', label: 'Analytics' },
			{ value: 'reports', label: 'Reports' },
			{ value: 'exports', label: 'Exports' }
		];
		const screen = await render(TabListFixture, {
			props: { ...withMenu, menu: { label: 'More', options } }
		});

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		const menu = menuIn(screen.container);
		const analytics = menuItem(screen.container, 'Analytics');
		const exportsItem = menuItem(screen.container, 'Exports');

		pressKey(menu, 'End');
		expect(document.activeElement).toBe(exportsItem);

		pressKey(menu, 'Home');
		expect(document.activeElement).toBe(analytics);
	});

	it('selects an item with Enter and calls onChange', async () => {
		const handleChange = vi.fn();
		const screen = await render(TabListFixture, {
			props: { ...withMenu, tabList: { value: 'home', onChange: handleChange } }
		});

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		const analytics = menuItem(screen.container, 'Analytics');
		analytics.focus();
		pressKey(analytics, 'Enter');

		expect(handleChange).toHaveBeenCalledWith('analytics');
	});

	it('closes the menu when Tab is pressed inside it (APG menu-button)', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		const menu = menuIn(screen.container);

		const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		pressKey(menu, 'Tab');
		expect(hidePopover).toHaveBeenCalled();
	});

	it('closes the menu when Escape is pressed', async () => {
		const screen = await render(TabListFixture, { props: withMenu });

		await userEvent.click(screen.getByRole('button', { name: 'More', exact: true }));
		const menu = menuIn(screen.container);

		const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		pressKey(menu, 'Escape');
		expect(hidePopover).toHaveBeenCalled();
	});
});
