import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TopNavMegaMenuItem from '$lib/components/top-nav/top-nav-mega-menu-item.svelte';
import MegaMenu from './fixtures/top-nav-mega-menu-fixture.svelte';

/**
 * Ported from Astryx's `TopNav/TopNavMegaMenu.test.tsx` — **all 21 of its `it`
 * cases** at v0.3.0, across all five of its describes (`default mode`, `popup
 * semantics`, `mobile-bar mode`, `drawer mode`, `TopNavMegaMenuItem`). Client
 * (real Chromium) project.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "all 16 of its `it` cases … Nothing dropped".
 * Upstream has **21**; the five that were absent are the `popup semantics`
 * block (the APG "a link grid is not an ARIA menu" assertions), and they have
 * since been ported, closing the file. Upstream's `queryByRole(r, {hidden:
 * true})` becomes `getByRole(r, {includeHidden: true}).query()` and its
 * `queryAllByRole` becomes `.elements()`; the `{hidden: true}` flag is
 * upstream's and is kept. That block also needs one mechanism change, for an
 * environment reason spelled out at its `openPanel` helper: a closed mega-menu
 * panel is *not* `display: none` in a real browser, so it intercepts the click
 * Playwright would otherwise deliver to the trigger.
 *
 * Standing translations:
 *
 * - `items` and `featured` are `Snippet`s, so the `<TopNavMegaMenuItem>` children
 *   upstream writes inline as JSX come in through `top-nav-mega-menu-fixture` as
 *   specs. `onClick` is `onclick`.
 * - `<TopNavRenderContext value="drawer">` becomes the fixture's `mode` prop,
 *   which wraps the subject in the internal `TopNavRenderScope`: React scopes a
 *   context with an element, Svelte needs a component boundary. The context
 *   object itself is public on both sides.
 * - `render` is async — always awaited.
 * - `user.click` is `userEvent.click` from `vitest/browser`; there is no `setup()`.
 *
 * Two shapes of the port worth stating, because they are what the `aria-*` cases
 * are actually checking:
 *
 * - The desktop trigger spreads `popover.triggerProps` rather than hand-writing
 *   `aria-haspopup`/`aria-expanded`, which is what upstream's 0.1.9 changed and
 *   this port carries; with the layer's `role: 'none'` the spread emits
 *   `aria-haspopup="true"` (where `TopNavMenu`'s is `"dialog"`) and, critically,
 *   the `aria-controls` the first popup-semantics case asserts.
 * - The popover is anchored to the enclosing `<nav>` via a `closest('nav')` read
 *   in an effect. These cases render no `<nav>`, so no anchor is found — exactly
 *   as upstream's `triggerButtonRef.current?.closest('nav')` finds none. The
 *   panel still opens; only its positioning anchor is absent, which nothing
 *   asserts on.
 *
 * RESTATED — one case, `returns null in mobile-bar mode`; see its comment. The
 * port forwards rest props onto the desktop trigger and onto
 * `TopNavMegaMenuItem`'s rendered element where upstream drops them, but no case
 * in this suite asserts a prop is absent, so nothing needed restating for that.
 */

describe('TopNavMegaMenu — default mode', () => {
	it('renders the trigger button with label', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('trigger has aria-haspopup and aria-expanded attributes', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		const trigger = screen.getByRole('button', { name: 'Products' });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'true');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('renders with multiple menu items', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('renders with featured content', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }],
				featured: { text: 'Featured content', testid: 'featured' }
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('renders without items or featured', async () => {
		const screen = await render(MegaMenu, { props: { menu: { label: 'Empty' } } });
		await expect.element(screen.getByRole('button', { name: 'Empty' })).toBeInTheDocument();
	});
});

describe('TopNavMegaMenu — popup semantics', () => {
	/**
	 * Upstream's `await user.click(trigger)`, dispatched rather than driven by
	 * Playwright's pointer — the one mechanism change in this block, and it is
	 * forced by the environment, not by the component.
	 *
	 * The closed panel is not out of the way in a real browser. Its layer carries
	 * `panelViewportFit`, whose `display: 'flex'` (upstream's own —
	 * `TopNavMegaMenu.tsx:133-137`) is an *author* declaration and therefore beats
	 * the UA's `[popover]:not(:popover-open) {display: none}`. So the popover is
	 * laid out at all times — `opacity: 0`, but hit-testable — and, unanchored
	 * here (no `<nav>` ancestor, exactly as upstream renders it), it sits over the
	 * trigger. Playwright's hit-target check then reports `<a href="/analytics">
	 * … subtree intercepts pointer events` and retries until the actionability
	 * timeout. jsdom has no hit-testing, so upstream never meets it.
	 *
	 * A native `.click()` dispatches the same click event upstream's user-event
	 * does — the component listens on `onclick` only — and removes the browser's
	 * hit-test while leaving the component's own guard, which is what these cases
	 * are about.
	 */
	function openPanel(trigger: Element): void {
		(trigger as HTMLElement).click();
	}

	// Upstream's `beforeAll`/`afterAll` shim `showPopover`/`hidePopover` and
	// `:popover-open` because jsdom implements none of them, and synthesise the
	// `toggle` event the real API dispatches. Chromium has all three, so the
	// block runs against the real Popover API, and upstream's `{hidden: true}`
	// survives as `{includeHidden: true}`.
	it('trigger aria-controls resolves to the popup element', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		const triggerLoc = screen.getByRole('button', { name: 'Products' });
		await expect.element(triggerLoc).toHaveAttribute('aria-expanded', 'false');
		const trigger = triggerLoc.element();

		// aria-controls must be present and point at the real popup element.
		const controlsId = trigger.getAttribute('aria-controls');
		expect(controlsId).toBeTruthy();
		const popup = document.getElementById(controlsId as string);
		expect(popup).not.toBeNull();

		openPanel(trigger);

		await expect.element(triggerLoc).toHaveAttribute('aria-expanded', 'true');
		// The referenced element is the popup that contains the panel content.
		expect(popup).toContainElement(
			screen.getByRole('group', { name: 'Products', includeHidden: true }).element()
		);
	});

	it('does not wrap the panel in a role="dialog" aria-modal element', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		// Focus stays on the trigger while the panel is open, so a modal dialog
		// wrapper would tell assistive tech the focused control is inert.
		expect(screen.getByRole('dialog', { includeHidden: true }).query()).not.toBeInTheDocument();
		expect(screen.container.querySelector('[aria-modal="true"]')).toBeNull();
	});

	it('does not expose role="menu" — a link grid is not an ARIA menu', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		// Per the WAI-ARIA APG, mega menu panels of navigation links must not use
		// the menu role (reserved for action menus with menuitem children).
		expect(screen.getByRole('menu', { includeHidden: true }).query()).not.toBeInTheDocument();
		expect(screen.getByRole('menuitem', { includeHidden: true }).elements()).toHaveLength(0);
	});

	it('exposes the panel as a labeled group', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		await expect
			.element(screen.getByRole('group', { name: 'Products', includeHidden: true }))
			.toBeInTheDocument();
	});

	it('keeps item links with accessible names inside the panel', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		await expect
			.element(screen.getByRole('link', { name: /Analytics/, includeHidden: true }))
			.toHaveAttribute('href', '/analytics');
		await expect
			.element(screen.getByRole('link', { name: /Reports/, includeHidden: true }))
			.toHaveAttribute('href', '/reports');
	});
});

// =============================================================================
// Mobile-bar mode — should be hidden
// =============================================================================

describe('TopNavMegaMenu — mobile-bar mode', () => {
	it('returns null in mobile-bar mode', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'mobile-bar',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		// RESTATED: upstream asserts `container.innerHTML === ''`. Svelte leaves the
		// `{#if}` anchor comments of the branch that rendered nothing (and of the
		// fixture around it) in the container, so an empty-string comparison would
		// fail for a reason that has nothing to do with the component. The
		// equivalent claim — the mega menu rendered nothing at all — is that no
		// element and no text reached the DOM.
		expect(screen.container.querySelector('*')).toBeNull();
		expect(screen.container.textContent?.trim()).toBe('');
	});
});

// =============================================================================
// Drawer mode — inline collapsible
// =============================================================================

describe('TopNavMegaMenu — drawer mode', () => {
	it('renders a collapsible trigger with label', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		const trigger = screen.getByRole('button', { name: 'Products' });
		await expect.element(trigger).toBeInTheDocument();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('expands to show items when tapped', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});

		const trigger = screen.getByRole('button', { name: 'Products' });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		await userEvent.click(trigger);

		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Analytics')).toBeInTheDocument();
		await expect.element(screen.getByText('Reports')).toBeInTheDocument();
	});

	it('collapses when trigger is clicked again', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		const trigger = screen.getByRole('button', { name: 'Products' });
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('shows item descriptions when provided', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', description: 'Track behavior', href: '/analytics' }]
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		await expect.element(screen.getByText('Analytics')).toBeInTheDocument();
		await expect.element(screen.getByText('Track behavior')).toBeInTheDocument();
	});

	it('renders items as links when href is provided', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		const link = screen.getByRole('link', { name: 'Analytics' });
		await expect.element(link).toHaveAttribute('href', '/analytics');
	});

	it('renders items as buttons when onClick is provided without href', async () => {
		const handleClick = vi.fn();

		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Tools' },
				items: [{ title: 'Export', onclick: handleClick }]
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Tools' }));
		await userEvent.click(screen.getByRole('button', { name: 'Export' }));

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders featured content when expanded', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }],
				featured: { text: 'Featured: New AI Tools' }
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		await expect.element(screen.getByText('Featured: New AI Tools')).toBeInTheDocument();
	});
});

// =============================================================================
// TopNavMegaMenuItem — standalone rendering
// =============================================================================

describe('TopNavMegaMenuItem', () => {
	it('renders as a desktop item by default', async () => {
		const screen = await render(TopNavMegaMenuItem, {
			props: { title: 'Analytics', href: '/analytics' }
		});
		await expect.element(screen.getByRole('link', { name: /Analytics/ })).toBeInTheDocument();
	});

	it('renders description in desktop mode', async () => {
		const screen = await render(TopNavMegaMenuItem, {
			props: { title: 'Analytics', description: 'Track behavior', href: '/analytics' }
		});
		await expect.element(screen.getByText('Analytics')).toBeInTheDocument();
		await expect.element(screen.getByText('Track behavior')).toBeInTheDocument();
	});

	it('renders as a drawer item in drawer context', async () => {
		const screen = await render(MegaMenu, {
			props: { mode: 'drawer', item: { title: 'Analytics', href: '/analytics' } }
		});
		await expect.element(screen.getByRole('link', { name: /Analytics/ })).toBeInTheDocument();
	});
});
