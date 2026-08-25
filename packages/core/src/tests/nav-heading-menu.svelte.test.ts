import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NavHeadingMenuFixture from './fixtures/nav-heading-menu-fixture.svelte';

/**
 * Ported from Astryx's `NavMenu/NavHeadingMenu.test.tsx` — all 23 of its `it`
 * cases at the 0.5.0 pin, nothing dropped. Client (real Chromium) project: every case is focus,
 * click or keyboard work.
 *
 * Standing translations:
 *
 * - Children are a data spec through `nav-heading-menu-fixture`, since a Svelte
 *   snippet can only be authored in a template (the same move `list-fixture`
 *   makes).
 * - Upstream's `wrapper: <NavHeadingCloseContext value={{closeMenu}}>` becomes
 *   the fixture's `closeMenu` prop, which calls `setNavHeadingCloseContext`.
 * - `fireEvent.keyDown(menu, …)` becomes a `dispatchEvent(new KeyboardEvent(…))`
 *   on the menu element, as `context-menu.svelte.test.ts` does for its own
 *   typeahead case. `userEvent.keyboard` would deliver to `document.activeElement`,
 *   which these two cases deliberately leave unset.
 * - `does not call onClick when disabled` — the item is `aria-disabled`, which
 *   Playwright's actionability treats as un-clickable, so the click is delivered
 *   as a native `.click()` (upstream's `fireEvent.click` in another shape). The
 *   assertion is unchanged. Same restatement `segmented-control` documents.
 * Upstream's suite carried a two-case `NavMenuItem backward compat` describe
 * through 0.2.0. 0.3.0 deletes `NavMenu/NavMenuItem.tsx` as a breaking change and
 * drops both cases with it — 25 `it`s became 23 — so they are gone here too.
 */

function menuIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="menu"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="menu" element');
	return el;
}

function menuItemsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

function pressKey(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('NavHeadingMenu', () => {
	it('renders with role="menu"', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Item 1' }] }
		});
		expect(menuIn(screen.container)).toBeInTheDocument();
	});

	it('renders children as menuitems', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Dashboard' }, { label: 'Settings' }] }
		});
		const items = menuItemsIn(screen.container);
		expect(items).toHaveLength(2);
		expect(items[0]).toHaveTextContent('Dashboard');
		expect(items[1]).toHaveTextContent('Settings');
	});

	it('applies size class to container', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { menu: { size: 'lg' }, items: [{ label: 'Item' }] }
		});
		expect(menuIn(screen.container).className).toContain('nav-heading-menu');
	});

	it('applies data-testid', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { menu: { 'data-testid': 'product-menu' }, items: [{ label: 'Item' }] }
		});
		await expect.element(screen.getByTestId('product-menu')).toBeInTheDocument();
	});

	it('applies minWidth override via inline style', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { menu: { minWidth: 300 }, items: [{ label: 'Item' }] }
		});
		expect(menuIn(screen.container).style.minWidth).toBe('300px');
	});
});

describe('NavHeadingMenuItem', () => {
	it('renders with role="menuitem"', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Dashboard' }] }
		});
		expect(menuItemsIn(screen.container)[0]).toHaveTextContent('Dashboard');
	});

	it('renders as a link when href is provided', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Docs', href: '/docs' }] }
		});
		const item = menuItemsIn(screen.container)[0];
		expect(item.tagName).toBe('A');
		expect(item).toHaveAttribute('href', '/docs');
	});

	it('renders as div when no href', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Action', onClick: () => {} }] }
		});
		expect(menuItemsIn(screen.container)[0].tagName).toBe('DIV');
	});

	it('calls onClick on click', async () => {
		const onClick = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Action', onClick }] }
		});
		await userEvent.click(menuItemsIn(screen.container)[0]);
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('does not call onClick when disabled', async () => {
		const onClick = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Action', onClick, isDisabled: true }] }
		});
		// Restated delivery (see file header): the item is `aria-disabled`, and
		// Playwright's actionability refuses to `userEvent.click` such an element —
		// which would assert the heuristic rather than the component. A native
		// `.click()` still runs `handleClick` and hits its guard.
		menuItemsIn(screen.container)[0].click();
		expect(onClick).not.toHaveBeenCalled();
	});

	it('sets aria-disabled when disabled', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Disabled', isDisabled: true }] }
		});
		expect(menuItemsIn(screen.container)[0]).toHaveAttribute('aria-disabled', 'true');
	});

	it('renders description text', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Dashboard', description: 'View metrics' }] }
		});
		await expect.element(screen.getByText('View metrics')).toBeInTheDocument();
	});

	it('applies data-testid', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Item', 'data-testid': 'menu-item-1' }] }
		});
		await expect.element(screen.getByTestId('menu-item-1')).toBeInTheDocument();
	});
});

describe('keyboard navigation', () => {
	it('moves focus with arrow keys', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'First' }, { label: 'Second' }, { label: 'Third' }] }
		});
		const items = menuItemsIn(screen.container);
		items[0].focus();
		expect(document.activeElement).toBe(items[0]);

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(items[1]);

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(items[2]);

		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(items[1]);
	});

	it('wraps focus at boundaries', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'First' }, { label: 'Last' }] }
		});
		const items = menuItemsIn(screen.container);
		items[1].focus();

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(items[0]);
	});

	it('Home focuses first item, End focuses last', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'First' }, { label: 'Middle' }, { label: 'Last' }] }
		});
		const items = menuItemsIn(screen.container);
		items[1].focus();

		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(items[0]);

		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(items[2]);
	});

	it('activates a focused onClick-only item with Enter', async () => {
		const onClick = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Action', onClick }] }
		});
		menuItemsIn(screen.container)[0].focus();

		await userEvent.keyboard('{Enter}');
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('activates a focused onClick-only item with Space', async () => {
		const onClick = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Action', onClick }] }
		});
		menuItemsIn(screen.container)[0].focus();

		await userEvent.keyboard(' ');
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('does not activate a disabled item with Enter', async () => {
		const onClick = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Action', onClick, isDisabled: true }] }
		});
		menuItemsIn(screen.container)[0].focus();

		await userEvent.keyboard('{Enter}');
		expect(onClick).not.toHaveBeenCalled();
	});

	it('typeahead focuses the item matching the typed character (menus-11)', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: { items: [{ label: 'Cut' }, { label: 'Paste' }] }
		});
		pressKey(menuIn(screen.container), 'p');
		expect(document.activeElement).toBe(menuItemsIn(screen.container)[1]);
	});

	it('typeahead skips a disabled menuitem (menus-11)', async () => {
		const screen = await render(NavHeadingMenuFixture, {
			props: {
				items: [
					{ label: 'Cut' },
					{ label: 'Paste (disabled)', isDisabled: true },
					{ label: 'Paste special' }
				]
			}
		});
		// Typing "p" must land on the enabled "Paste special", never the disabled
		// "Paste (disabled)" — the disabled item is excluded from the typeahead
		// selector entirely.
		pressKey(menuIn(screen.container), 'p');
		const items = menuItemsIn(screen.container);
		expect(document.activeElement).toBe(items[2]);
		expect(document.activeElement).not.toBe(items[1]);
	});
});

describe('context forwarding', () => {
	it('forwards closeMenu from parent NavMenuContext', async () => {
		const closeMenu = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { closeMenu, items: [{ label: 'Action', onClick: () => {} }] }
		});
		await userEvent.click(menuItemsIn(screen.container)[0]);
		expect(closeMenu).toHaveBeenCalledOnce();
	});

	it('calls parent closeMenu on Escape', async () => {
		const closeMenu = vi.fn();
		const screen = await render(NavHeadingMenuFixture, {
			props: { closeMenu, items: [{ label: 'First' }] }
		});
		menuItemsIn(screen.container)[0].focus();
		await userEvent.keyboard('{Escape}');
		expect(closeMenu).toHaveBeenCalledOnce();
	});
});
