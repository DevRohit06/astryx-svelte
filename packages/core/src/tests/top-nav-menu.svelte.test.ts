import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import type { LocatorSelectors } from 'vitest/browser';
import TopNavMenuFixture, { type TopNavMenuItemSpec } from './fixtures/top-nav-menu-fixture.svelte';

/**
 * Ported from Astryx's `TopNav/TopNavMenu.test.tsx` — all 12 of its `it` cases,
 * across its three describes (`TopNavMenu`, `menu semantics (APG)` and `keyboard
 * navigation (APG menu pattern)`). Nothing dropped. Client (real Chromium)
 * project: eight of the twelve are focus, click or keyboard work.
 *
 * This header used to claim "all 4 … nothing dropped" while upstream has had 12
 * at every tag from 0.2.0 — both APG describes were unported and the count said
 * otherwise. That is the header-rot failure mode `top-nav.svelte.test.ts` names;
 * the count is a contract against *upstream's* file, not against this one.
 *
 * Standing translations:
 *
 * - `TopNavMenuItemData.icon` is a `Snippet` here where upstream's is a
 *   `ReactNode`, and its click callback is `onclick`, not `onClick`. A snippet
 *   can only be authored in a template, so the items arrive as specs and
 *   `top-nav-menu-fixture` rebuilds the data array.
 * - `render` is async — always awaited. `userEvent` comes from `vitest/browser`
 *   and needs no `setup()`.
 * - `queryByRole(r, {hidden: true})` becomes
 *   `getByRole(r, {includeHidden: true}).query()` and `getAllByRole(…)` becomes
 *   `.elements()`. `includeHidden` carries exactly the weight RTL's
 *   `hidden: true` does here: the popup is a native popover that is in the DOM
 *   but `display: none` until it opens, so the role queries would otherwise skip
 *   it — which is also why the two "does it exist" cases need no click.
 * - `fireEvent.keyDown(el, {key})` becomes
 *   `el.dispatchEvent(new KeyboardEvent('keydown', …))` on the *same* element.
 *   That is upstream's delivery in another spelling, not a substitute for it:
 *   `userEvent.keyboard` would retarget to `document.activeElement`, a different
 *   event path than the one upstream exercises. Same move
 *   `nav-heading-menu.svelte.test.ts` documents for its own menu.
 *
 * The trigger's `aria-haspopup` comes from `popover.triggerProps` on both sides.
 * It reads `"true"`, not `"dialog"`, since 0.1.9 dropped the modal wrapper: the
 * popup's exposed semantics are its child `role="menu"`.
 *
 * The port forwards rest props onto the desktop trigger where upstream drops
 * them (see the component's docs and port/debts.md → Known debts). No case in this
 * suite asserts a prop is absent, so none needed restating for it.
 */

/**
 * What `render()` hands back, narrowed to the part these helpers need — the
 * bound role queries. `LocatorSelectors` is the same narrowing
 * `calendar.svelte.test.ts` takes.
 */
type Screen = LocatorSelectors;

/** Upstream's `screen.getByRole('menu', {hidden: true})`, as an element. */
function menuOf(screen: Screen): HTMLElement {
	return screen.getByRole('menu', { includeHidden: true }).element() as HTMLElement;
}

/**
 * Upstream's `screen.getAllByRole('menuitem', {hidden: true})`, narrowed.
 * `locator.elements()` returns `Element[]` — it cannot know a `menuitem` query
 * only ever matches this component's `<a>` / `<div>` rows — and the cases call
 * `.focus()` on what comes back.
 */
function menuItemsOf(screen: Screen): HTMLElement[] {
	return screen.getByRole('menuitem', { includeHidden: true }).elements() as HTMLElement[];
}

/** Upstream's `fireEvent.keyDown(el, {key})`; see the header. */
function pressKey(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** Upstream's single-item onClick fixture, spelled with Svelte's `onclick`. */
function actionItem(onclick: () => void): TopNavMenuItemSpec[] {
	return [{ title: 'Action', onclick }];
}

const mockItems: TopNavMenuItemSpec[] = [
	{
		title: 'Analytics',
		description: 'Track user behavior',
		href: '/analytics'
	},
	{
		title: 'Messaging',
		description: 'Real-time communication',
		href: '/messaging'
	}
];

describe('TopNavMenu', () => {
	it('renders the trigger button with label', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('trigger announces a menu popup, not a dialog', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		const trigger = screen.getByRole('button', { name: 'Products' });
		// usePopover with role:'none' emits aria-haspopup="true" (the ARIA synonym
		// for "menu") because the exposed semantics of the popup are its child
		// role="menu", not a dialog.
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'true');
	});

	it('renders with custom items', async () => {
		const items: TopNavMenuItemSpec[] = [
			{ title: 'Custom Item', description: 'A custom description' }
		];
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Menu' }, items }
		});
		await expect.element(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
	});

	it('renders icon when provided in items', async () => {
		const items: TopNavMenuItemSpec[] = [
			{
				title: 'With Icon',
				description: 'Has an icon',
				icon: { text: 'Icon', testid: 'menu-icon' }
			}
		];
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Menu' }, items }
		});
		// Icon is in the hover card content, which may not be visible initially
		await expect.element(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
	});
});

describe('menu semantics (APG)', () => {
	it('does not wrap the popup in a role="dialog" / aria-modal shell', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		// The popup's exposed semantics are the role="menu" container itself —
		// no dialog wrapper, no aria-modal.
		expect(screen.getByRole('dialog', { includeHidden: true }).query()).not.toBeInTheDocument();
		expect(document.querySelector('[aria-modal]')).toBeNull();
		await expect
			.element(screen.getByRole('menu', { name: 'Products', includeHidden: true }))
			.toBeInTheDocument();
	});
});

describe('keyboard navigation (APG menu pattern)', () => {
	it('exposes exactly one tab stop among menu items (roving tabindex)', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		const items = menuItemsOf(screen);
		expect(items).toHaveLength(2);
		const tabbable = items.filter((el) => el.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
	});

	it('moves focus with ArrowDown/ArrowUp and the tab stop follows', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		const menu = menuOf(screen);
		const items = menuItemsOf(screen);
		items[0].focus();

		pressKey(menu, 'ArrowDown');
		expect(items[1]).toHaveFocus();
		expect(items[1]).toHaveAttribute('tabindex', '0');
		expect(items[0]).toHaveAttribute('tabindex', '-1');

		pressKey(menu, 'ArrowUp');
		expect(items[0]).toHaveFocus();
		expect(items[0]).toHaveAttribute('tabindex', '0');
		expect(items[1]).toHaveAttribute('tabindex', '-1');
	});

	it('wraps focus at both ends', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		const menu = menuOf(screen);
		const items = menuItemsOf(screen);

		items[1].focus();
		pressKey(menu, 'ArrowDown');
		expect(items[0]).toHaveFocus();

		pressKey(menu, 'ArrowUp');
		expect(items[1]).toHaveFocus();
	});

	it('typeahead moves focus to the item matching the typed character', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		const menu = menuOf(screen);
		pressKey(menu, 'm');
		// Asserted on the element rather than through `expect.element`, which is
		// what keeps upstream's assertion intact: the match is synchronous with the
		// keydown, and a retrying assertion would also accept the *next* frame's
		// open-time auto-focus landing back on the first item.
		expect(
			screen.getByRole('menuitem', { name: /Messaging/, includeHidden: true }).element()
		).toHaveFocus();
	});

	it('activates a focused onClick-only item with Enter', async () => {
		const onclick = vi.fn();
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Menu' }, items: actionItem(onclick) }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Menu' }));

		const item = menuItemsOf(screen)[0];
		item.focus();
		pressKey(item, 'Enter');
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('still activates an item on click', async () => {
		const onclick = vi.fn();
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Menu' }, items: actionItem(onclick) }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Menu' }));

		await userEvent.click(screen.getByRole('menuitem', { includeHidden: true }));
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('closes the menu with Escape', async () => {
		const screen = await render(TopNavMenuFixture, {
			props: { props: { label: 'Products' }, items: mockItems }
		});
		const trigger = screen.getByRole('button', { name: 'Products' });
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		pressKey(menuOf(screen), 'Escape');
		// `expect.element` retries where upstream's sync `expect` does not: the
		// attribute is rendered from `popover.isOpen`, and Svelte flushes that write
		// on a microtask rather than inside the dispatch. The assertion is unchanged.
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});
