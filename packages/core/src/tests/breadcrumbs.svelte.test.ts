/** PORTS: Breadcrumbs/Breadcrumbs.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import BreadcrumbsFixture from './fixtures/breadcrumbs-fixture.svelte';
import CustomLink from './fixtures/custom-link.svelte';

/**
 * Ported from Astryx's `Breadcrumbs/Breadcrumbs.test.tsx`, all 39 cases at the
 * 0.5.0 pin, across its three describe blocks. Nothing is dropped. (0.5.0 added
 * the two variant theme-target cases; they are here.)
 *
 * Every case renders a trail, so all of them go through
 * `breadcrumbs-fixture.svelte`: the crumbs are JSX children upstream, with
 * inline `startIcon` and `separator` nodes, and a Svelte snippet can only be
 * authored in a template. The fixture passes each crumb's label as a **string**
 * `children`, not as slot content — upstream's `<BreadcrumbItem>Teams</…>` gives
 * a string child, and `BreadcrumbItem` narrows on it (`typeof children ===
 * 'string'`) to name a `menu` crumb's surface, the same `ReactNode`→union
 * translation `HoverCard` and `Item` make.
 *
 * One case is a **counterpart** rather than a translation:
 * **`forwards ref to the nav element`** becomes an attachment travelling in the
 * rest props, which `Breadcrumbs` spreads onto its `<nav>` — the port has no
 * `ref`. It asserts the same two things upstream's does (an `HTMLElement`, whose
 * tag is `NAV`), from the element the attachment receives.
 *
 * Runs in the **client** (real Chromium) project: auto-current detection is a
 * post-render DOM read, and `expect.element` retrying stands in for upstream's
 * `waitFor`.
 */

describe('Breadcrumbs', () => {
	it('renders a nav landmark with aria-label', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: { items: [{ label: 'Home', props: { href: '/' } }] }
		});
		await expect
			.element(screen.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Breadcrumb');
	});

	it('supports custom aria-label', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: { list: { label: 'Custom nav' }, items: [{ label: 'Home', props: { href: '/' } }] }
		});
		await expect
			.element(screen.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Custom nav');
	});

	it('renders items in an ordered list', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Projects', props: { href: '/projects' } }
				]
			}
		});
		expect(screen.getByRole('list').element().tagName).toBe('OL');
	});

	it('renders separators between items', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Projects', props: { href: '/projects' } },
					{ label: 'Detail', props: { isCurrent: true } }
				]
			}
		});
		// Each item renders its own separator span; the first is hidden via CSS
		const separators = screen.container.querySelectorAll('span[aria-hidden="true"]');
		expect(separators).toHaveLength(3);
		expect(separators[0].textContent).toBe('/');
	});

	it('supports custom separator', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				hasCustomSeparator: true,
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Page', props: { isCurrent: true } }
				]
			}
		});
		const separators = screen.container.querySelectorAll('span[aria-hidden="true"]');
		// Custom separator content is nested inside the aria-hidden span.
		// The first item's separator is hidden via CSS, but still in the DOM.
		expect(separators[1].textContent).toBe('›');
	});

	it('separators are aria-hidden', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Page', props: { isCurrent: true } }
				]
			}
		});
		const separators = screen.container.querySelectorAll('span[aria-hidden="true"]');
		expect(separators.length).toBeGreaterThan(0);
		expect(separators[0]).toHaveAttribute('aria-hidden', 'true');
	});

	it('forwards an attachment to the nav element', async () => {
		// Upstream's `forwards ref to the nav element`, as an attachment.
		const attached = vi.fn();
		await render(BreadcrumbsFixture, {
			props: {
				list: { [createAttachmentKey()]: (node: Element) => attached(node) },
				items: [{ label: 'Home', props: { href: '/' } }]
			}
		});
		const node = attached.mock.calls[0][0] as HTMLElement;
		expect(node).toBeInstanceOf(HTMLElement);
		expect(node.tagName).toBe('NAV');
	});

	it('supports data-testid', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				list: { 'data-testid': 'my-breadcrumbs' },
				items: [{ label: 'Home', props: { href: '/' } }]
			}
		});
		await expect.element(screen.getByTestId('my-breadcrumbs')).toBeInTheDocument();
	});

	it('defaults to variant="default"', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
	});

	it('accepts variant="supporting"', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				list: { variant: 'supporting' },
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
		await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
		await expect
			.element(screen.getByText('Current', { exact: true }))
			.toHaveAttribute('aria-current', 'page');
	});

	it('supporting variant renders links and current items', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				list: { variant: 'supporting' },
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Projects', props: { href: '/projects' } },
					{ label: 'Detail', props: { isCurrent: true } }
				]
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('href', '/');
		await expect
			.element(screen.getByText('Detail', { exact: true }))
			.toHaveAttribute('aria-current', 'page');
	});
});

describe('BreadcrumbItem', () => {
	it('renders a link when href is provided', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/home' } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('href', '/home');
	});

	it('renders current item as span with aria-current="page"', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Current Page', props: { isCurrent: true } }
				]
			}
		});
		const current = screen.getByText('Current Page', { exact: true }).element();
		expect(current.tagName).toBe('SPAN');
		expect(current).toHaveAttribute('aria-current', 'page');
	});

	it('auto-detects last child as current when no isCurrent is set', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Projects', props: { href: '/projects' } },
					{ label: 'Last Item' }
				]
			}
		});
		// aria-current is set by the effect on the content element (matching the
		// explicit isCurrent path), not the outer <li>.
		const lastContent = screen.getByText('Last Item', { exact: true });
		await expect.element(lastContent).toHaveAttribute('aria-current', 'page');
		expect(lastContent.element().tagName).toBe('SPAN');
		// The <li> wrapper must NOT carry aria-current.
		expect(lastContent.element().closest('li')).not.toHaveAttribute('aria-current');
	});

	it('auto-detects aria-current on the anchor when the last item is a link', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Current', props: { href: '/projects/current' } }
				]
			}
		});
		const lastLink = screen.getByText('Current', { exact: true });
		await expect.element(lastLink).toHaveAttribute('aria-current', 'page');
		// aria-current is on the anchor itself, not the <li>.
		expect(lastLink.element().tagName).toBe('A');
		expect(lastLink.element().closest('li')).not.toHaveAttribute('aria-current');
	});

	it('does not auto-detect when isCurrent is explicitly set', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'First', props: { isCurrent: true } },
					{ label: 'Second', props: { href: '/second' } },
					{ label: 'Third', props: { href: '/third' } }
				]
			}
		});
		await expect
			.element(screen.getByText('First', { exact: true }))
			.toHaveAttribute('aria-current', 'page');
		const third = screen.getByText('Third', { exact: true });
		expect(third.element().closest('li')).not.toHaveAttribute('aria-current');
		expect(third.element().tagName).toBe('A');
	});

	it('handles onClick on link items', async () => {
		const handleClick = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/', onclick: handleClick } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		await userEvent.click(screen.getByRole('link', { name: 'Home', exact: true }));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders onClick-only items as buttons with link styling', async () => {
		const handleClick = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { onclick: handleClick } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		const button = screen.getByRole('button', { name: 'Home', exact: true });
		expect(button.element().tagName).toBe('BUTTON');
		await expect.element(button).toHaveAttribute('type', 'button');
		await userEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders startIcon', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' }, startIconTestid: 'home-icon' },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		await expect.element(screen.getByTestId('home-icon')).toBeInTheDocument();
	});

	it('supports data-testid on items', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/', 'data-testid': 'crumb-home' } },
					{ label: 'Current', props: { isCurrent: true, 'data-testid': 'crumb-current' } }
				]
			}
		});
		await expect.element(screen.getByTestId('crumb-home')).toBeInTheDocument();
		await expect.element(screen.getByTestId('crumb-current')).toBeInTheDocument();
	});

	it('renders single item as current by auto-detection', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: { items: [{ label: 'Only Item' }] }
		});
		const content = screen.getByText('Only Item', { exact: true });
		await expect.element(content).toHaveAttribute('aria-current', 'page');
		expect(content.element().tagName).toBe('SPAN');
		expect(content.element().closest('li')).not.toHaveAttribute('aria-current');
	});

	it('auto-detects last child as current with supporting variant', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				list: { variant: 'supporting' },
				items: [{ label: 'Home', props: { href: '/' } }, { label: 'Last' }]
			}
		});
		const content = screen.getByText('Last', { exact: true });
		await expect.element(content).toHaveAttribute('aria-current', 'page');
		expect(content.element().tagName).toBe('SPAN');
		expect(content.element().closest('li')).not.toHaveAttribute('aria-current');
	});

	it('renders custom component for non-current items when as is provided', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/', as: CustomLink } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		const link = screen.getByRole('link', { name: 'Home', exact: true });
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).toHaveAttribute('href', '/');
	});

	it('does not apply as to current item (renders as span)', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Current', props: { isCurrent: true, as: CustomLink } }
				]
			}
		});
		const current = screen.getByText('Current', { exact: true }).element();
		expect(current.tagName).toBe('SPAN');
		expect(current).not.toHaveAttribute('data-custom-link');
	});

	it('renders custom component from LinkProvider for non-current items', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				provider: CustomLink,
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Projects', props: { href: '/projects' } },
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Home', exact: true }))
			.toHaveAttribute('data-custom-link');
		await expect
			.element(screen.getByRole('link', { name: 'Projects', exact: true }))
			.toHaveAttribute('data-custom-link');
		// The current item is still a span
		expect(screen.getByText('Current', { exact: true }).element().tagName).toBe('SPAN');
	});
});

// A closed popover keeps its content in the DOM (display:none), so these read it
// directly, mirroring upstream's `{hidden: true}` role queries — the same
// translation `dropdown-menu.svelte.test.ts` documents.
function menusIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menu"]'));
}

function menuIn(container: HTMLElement): HTMLElement {
	const el = menusIn(container)[0];
	if (!el) throw new Error('expected a role="menu" element');
	return el;
}

/** A menu row of any selectable role, by its accessible name. */
function menuRow(container: HTMLElement, name: string): HTMLElement {
	const rows = Array.from(
		container.querySelectorAll<HTMLElement>(
			'[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]'
		)
	);
	// `includes`, not `===`, on the text branch. As of upstream 0.3.0
	// `DropdownMenuCheckboxItem` composes a real `CheckboxInput` for its marker,
	// which contributes a visually-hidden `<label>` carrying the same text — so a
	// checkbox row's `textContent` is the label twice over. The *accessible* name
	// is unaffected (the marker is `aria-hidden` + `inert`), which is why only a
	// raw-text query sees it. The sibling dropdown-menu suites already match this
	// way.
	const el = rows.find(
		(row) => row.getAttribute('aria-label') === name || row.textContent?.includes(name)
	);
	if (!el) throw new Error(`no menu row named "${name}"`);
	return el;
}

function press(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('BreadcrumbItem menu', () => {
	// Upstream's `beforeEach` stubbing `showPopover`/`hidePopover`/`:popover-open`
	// is GONE: this suite runs in real Chromium, which implements all of it — the
	// reasoning `dropdown-menu.svelte.test.ts` records. Cases that assert on the
	// *call* spy on the native method, which `spyOn` still calls through.
	const items = [
		{ label: 'Design', onClick: vi.fn() },
		{ label: 'Engineering', onClick: vi.fn() },
		{ type: 'divider' as const },
		{ label: 'Data', onClick: vi.fn() }
	];

	it('renders as a menu trigger button with aria-haspopup="menu"', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Teams', props: { menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		const trigger = screen.getByRole('button', { name: 'Teams', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('portability: a DropdownMenuOption[] renders its items on open', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Teams', props: { menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		(screen.getByRole('button', { name: 'Teams', exact: true }).element() as HTMLElement).click();
		const menu = menuIn(screen.container);
		expect(menu).toHaveAttribute('aria-label', 'Teams');
		expect(menuRow(screen.container, 'Design')).toBeInTheDocument();
		expect(menuRow(screen.container, 'Engineering')).toBeInTheDocument();
		expect(menuRow(screen.container, 'Data')).toBeInTheDocument();
	});

	it('fires the item onClick and closes the menu on select', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const onDesign = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Teams', props: { menu: [{ label: 'Design', onClick: onDesign }] } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		(screen.getByRole('button', { name: 'Teams', exact: true }).element() as HTMLElement).click();
		menuRow(screen.container, 'Design').click();
		expect(onDesign).toHaveBeenCalledTimes(1);
		expect(hideSpy).toHaveBeenCalled();
	});

	it('supports the composed children form', async () => {
		const onOverview = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{
						label: 'Project',
						composedMenu: [{ label: 'Overview', onClick: onOverview }, { label: 'Settings' }]
					},
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		(screen.getByRole('button', { name: 'Project', exact: true }).element() as HTMLElement).click();
		expect(menuRow(screen.container, 'Overview')).toBeInTheDocument();
		menuRow(screen.container, 'Overview').click();
		expect(onOverview).toHaveBeenCalledTimes(1);
	});

	it('supports a selectable checkbox item', async () => {
		const onChange = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{
						label: 'Filters',
						checkboxMenu: { label: 'Show archived', value: false, onChange }
					},
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		(screen.getByRole('button', { name: 'Filters', exact: true }).element() as HTMLElement).click();
		const checkbox = menuRow(screen.container, 'Show archived');
		expect(checkbox).toHaveAttribute('aria-checked', 'false');
		checkbox.click();
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it('supports a selectable radio group', async () => {
		const onChange = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{
						label: 'Sort',
						radioMenu: {
							label: 'Sort by',
							value: 'name',
							onChange,
							options: [
								{ value: 'name', label: 'Name' },
								{ value: 'date', label: 'Date' }
							]
						}
					},
					{ label: 'Current', props: { isCurrent: true } }
				]
			}
		});
		(screen.getByRole('button', { name: 'Sort', exact: true }).element() as HTMLElement).click();
		expect(menuRow(screen.container, 'Name')).toHaveAttribute('aria-checked', 'true');
		menuRow(screen.container, 'Date').click();
		expect(onChange).toHaveBeenCalledWith('date');
	});

	it('opens with ArrowDown and closes with Escape, returning focus to trigger', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Teams', props: { menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		const trigger = screen
			.getByRole('button', { name: 'Teams', exact: true })
			.element() as HTMLElement;
		trigger.focus();
		press(trigger, 'ArrowDown');
		await vi.waitFor(() => {
			expect(showSpy).toHaveBeenCalled();
		});
		const menu = menuIn(screen.container);
		await vi.waitFor(() => {
			expect(menu.contains(document.activeElement)).toBe(true);
		});
		press(menu, 'Escape');
		expect(hideSpy).toHaveBeenCalled();
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
	});

	it('roves focus with ArrowDown across items', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Teams', props: { menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		const trigger = screen
			.getByRole('button', { name: 'Teams', exact: true })
			.element() as HTMLElement;
		trigger.focus();
		press(trigger, 'ArrowDown');
		const menu = menuIn(screen.container);
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(menuRow(screen.container, 'Design'));
		});
		press(menu, 'ArrowDown');
		expect(document.activeElement).toBe(menuRow(screen.container, 'Engineering'));
	});

	it('renders a submenu from a nested items array and keyboard-reaches an item after it', async () => {
		// Breadcrumb menus reuse the DropdownMenu item pipeline, so a nested
		// `items` array becomes a submenu. The inline flyout must not pollute the
		// breadcrumb menu's roving order — an item after the submenu row stays
		// keyboard-reachable.
		const onDelete = vi.fn();
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{
						label: 'Teams',
						props: {
							menu: [
								{ label: 'Rename', onClick: vi.fn() },
								{
									label: 'Move to',
									items: [
										{ label: 'Folder A', onClick: vi.fn() },
										{ label: 'Folder B', onClick: vi.fn() }
									]
								},
								{ type: 'divider' as const },
								{ label: 'Delete', onClick: onDelete }
							]
						}
					},
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		const trigger = screen
			.getByRole('button', { name: 'Teams', exact: true })
			.element() as HTMLElement;
		trigger.focus();
		press(trigger, 'ArrowDown');
		// Two role="menu" exist (the breadcrumb menu + the inline submenu flyout);
		// the breadcrumb menu is the first in DOM order.
		const menu = menuIn(screen.container);
		const submenuTrigger = menuRow(screen.container, 'Move to');
		expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(menuRow(screen.container, 'Rename'));
		});
		// Rename -> Move to -> Delete, one step per press.
		press(menu, 'ArrowDown');
		expect(document.activeElement).toBe(submenuTrigger);
		press(menu, 'ArrowDown');
		expect(document.activeElement).toBe(menuRow(screen.container, 'Delete'));
	});

	it('allows menu together with isCurrent (both aria-current and aria-haspopup)', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Teams', props: { isCurrent: true, menu: items } }
				]
			}
		});
		const trigger = screen.getByRole('button', { name: 'Teams', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-current', 'page');
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
	});

	it('warns and lets menu win when href is also provided', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Teams', props: { href: '/teams', menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		// menu wins: it's a button trigger, not a link.
		await expect
			.element(screen.getByRole('button', { name: 'Teams', exact: true }))
			.toHaveAttribute('aria-haspopup', 'menu');
		expect(screen.container.querySelector('a[href="/teams"]')).not.toBeInTheDocument();
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('`menu` and `href` are mutually exclusive')
		);
		warn.mockRestore();
	});

	it('reflects the variant on the item and menu-trigger theme targets', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				list: { variant: 'supporting' },
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Teams', props: { menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		// The variant selects between style objects on both elements, so a theme
		// needs it as a data attribute on both targets to reach them.
		const crumbs = [...screen.container.querySelectorAll('.astryx-breadcrumb-item')];
		expect(crumbs).toHaveLength(3);
		for (const item of crumbs) {
			expect(item).toHaveAttribute('data-variant', 'supporting');
		}
		expect(screen.container.querySelector('.astryx-breadcrumb-item-menu-trigger')).toHaveAttribute(
			'data-variant',
			'supporting'
		);
	});

	it('defaults the item theme target to the default variant', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		expect(screen.container.querySelector('.astryx-breadcrumb-item')).toHaveAttribute(
			'data-variant',
			'default'
		);
	});

	it('keeps mid-trail separators intact around a menu crumb', async () => {
		const screen = await render(BreadcrumbsFixture, {
			props: {
				items: [
					{ label: 'Home', props: { href: '/' } },
					{ label: 'Teams', props: { menu: items } },
					{ label: 'Overview', props: { isCurrent: true } }
				]
			}
		});
		// One separator per item (first hidden via CSS); the menu crumb does not
		// add or drop any. The trigger's chevron is `li > button > span`, so the
		// direct-child selector does not sweep it in.
		const separators = screen.container.querySelectorAll('ol > li > span[aria-hidden="true"]');
		expect(separators).toHaveLength(3);
	});
});
