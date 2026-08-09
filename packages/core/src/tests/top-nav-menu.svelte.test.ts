import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TopNavMenuFixture, { type TopNavMenuItemSpec } from './fixtures/top-nav-menu-fixture.svelte';

/**
 * Ported from Astryx's `TopNav/TopNavMenu.test.tsx` — all 4 of its `it` cases,
 * nothing dropped. Client (real Chromium) project.
 *
 * The one translation: `TopNavMenuItemData.icon` is a `Snippet` here where
 * upstream's is a `ReactNode`, and its click callback is `onclick`, not
 * `onClick`. A snippet can only be authored in a template, so the items arrive as
 * specs and `top-nav-menu-fixture` rebuilds the data array. Everything else —
 * including the trigger's `aria-haspopup`, which comes from
 * `popover.triggerProps` on both sides — is upstream's assertion verbatim. That
 * one reads `"true"`, not `"dialog"`, since 0.1.9 dropped the modal wrapper: the
 * popup's exposed semantics are its child `role="menu"`.
 *
 * The port forwards rest props onto the desktop trigger where upstream drops
 * them (see the component's docs and TODO.md → Known debts). No case in this
 * suite asserts a prop is absent, so none needed restating for it.
 */

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
