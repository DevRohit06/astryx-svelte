import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
import MoreMenu from '$lib/components/more-menu/more-menu.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Ported from Astryx's `MoreMenu/MoreMenu.test.tsx` — 21 of its 22 cases
 * (v0.4.1). 16 → 21 is 0.4.x's five additions: the two `#4477` open-modality
 * cases and the three-case `placement and alignment` block.
 *
 * DROPPED: **`supports forwardRef`**. Upstream threads a `ref` into the trigger
 * `button`'s props. `MoreMenuProps` is a closed `Pick<BaseProps, 'xstyle' |
 * 'class' | 'style'>` on both sides, so there is no rest spread for an
 * attachment to travel through and no `ref` prop to translate — the port has no
 * seam to assert on, the same situation `Token`'s three ref cases are in.
 *
 * Everything else is upstream's, with this suite's standing translations (the
 * same ones `dropdown-menu.svelte.test.ts` documents, since `MoreMenu` is a thin
 * wrapper over that component):
 *
 * - Runs in the **client (real Chromium)** project, so upstream's `beforeEach`
 *   stubbing `showPopover`/`hidePopover`/`:popover-open` is gone; the two cases
 *   asserting on the *call* `vi.spyOn` the native method, which calls through.
 * - `getByRole('menu'/'menuitem'/'group'/'separator', {hidden: true})` becomes a
 *   container `querySelector`: a closed popover is `display: none` in a real
 *   browser, so an accessibility-tree query cannot see it.
 * - `icon={<CustomIcon />}` goes through the shared `slot-probe`, since `icon` is
 *   a `Snippet` here.
 */

const defaultItems = [
	{ label: 'Edit', onClick: vi.fn() },
	{ label: 'Delete', onClick: vi.fn() }
];

function menuIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="menu"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="menu" element');
	return el;
}

function menuItem(container: HTMLElement, name: string): HTMLElement {
	const el = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
		(item) => item.getAttribute('aria-label') === name || item.textContent?.trim() === name
	);
	if (!el) throw new Error(`no menuitem named "${name}"`);
	return el;
}

/**
 * Open the menu the way a *mouse* does. `HTMLElement.prototype.click()` reports
 * `detail === 0`, which `DropdownMenu` treats as an AT activation and therefore
 * a keyboard open (#4477); a real pointer click reports `detail >= 1`. See
 * `dropdown-menu.svelte.test.ts`, which documents the same helper.
 */
function pointerOpen(trigger: HTMLElement): void {
	trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
}

/** `position-area` keywords are order-insensitive; the engine canonicalises. */
function areaTokens(value: string): string[] {
	return value.trim().split(/\s+/).filter(Boolean).sort();
}

function positionAreaOf(container: HTMLElement): string[] {
	const popover = menuIn(container).closest('[popover]');
	if (!(popover instanceof HTMLElement)) throw new Error('expected a [popover] ancestor');
	return areaTokens(popover.style.getPropertyValue('position-area'));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('MoreMenu', () => {
	it('renders trigger button with default aria-label', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });
		await expect.element(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
	});

	it('renders menu with role="menu"', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });
		expect(menuIn(screen.container)).toBeInTheDocument();
	});

	it('has aria-haspopup and aria-expanded attributes', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });
		const button = screen.getByRole('button', { name: 'More options' });
		await expect.element(button).toHaveAttribute('aria-haspopup', 'menu');
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('renders menu items', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });
		expect(menuItem(screen.container, 'Edit')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Delete')).toBeInTheDocument();
	});

	it('opens menu when button is clicked', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(MoreMenu, { props: { items: defaultItems } });

		(screen.getByRole('button', { name: 'More options' }).element() as HTMLElement).click();
		expect(showSpy).toHaveBeenCalled();
	});

	it('calls onClick when item is clicked', async () => {
		const handleEdit = vi.fn();
		const items = [
			{ label: 'Edit', onClick: handleEdit },
			{ label: 'Delete', onClick: vi.fn() }
		];
		const screen = await render(MoreMenu, { props: { items } });

		// Open the menu first
		(screen.getByRole('button', { name: 'More options' }).element() as HTMLElement).click();
		// Click the item
		menuItem(screen.container, 'Edit').click();

		expect(handleEdit).toHaveBeenCalledOnce();
	});

	it('supports disabled state', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems, isDisabled: true } });
		// Button uses aria-disabled (not native disabled) to keep
		// the button focusable for tooltip access
		await expect
			.element(screen.getByRole('button', { name: 'More options' }))
			.toHaveAttribute('aria-disabled', 'true');
	});

	it('supports custom label', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems, label: 'Row actions' } });
		await expect.element(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
	});

	it('supports custom icon', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: MoreMenu,
				slot: 'icon',
				text: '★',
				testid: 'custom-icon',
				rest: { items: defaultItems }
			}
		});
		await expect.element(screen.getByTestId('custom-icon')).toBeInTheDocument();
	});

	it('supports data-testid', async () => {
		const screen = await render(MoreMenu, {
			props: { items: defaultItems, 'data-testid': 'my-menu' }
		});
		await expect.element(screen.getByTestId('my-menu')).toBeInTheDocument();
	});

	it('opens menu when clicked', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(MoreMenu, { props: { items: defaultItems } });

		(screen.getByRole('button', { name: 'More options' }).element() as HTMLElement).click();
		expect(showSpy).toHaveBeenCalled();
	});

	it('renders sections with group role', async () => {
		const items = [
			{
				type: 'section' as const,
				title: 'Actions',
				items: [{ label: 'Edit', onClick: vi.fn() }]
			}
		];
		const screen = await render(MoreMenu, { props: { items } });

		const group = screen.container.querySelector('[role="group"]');
		expect(group).toBeInTheDocument();
		expect(group?.getAttribute('aria-label') ?? group?.textContent).toContain('Actions');
	});

	it('does not call onClick for disabled items', async () => {
		const handleEdit = vi.fn();
		const items = [{ label: 'Edit', onClick: handleEdit, isDisabled: true }];
		const screen = await render(MoreMenu, { props: { items } });

		(screen.getByRole('button', { name: 'More options' }).element() as HTMLElement).click();
		menuItem(screen.container, 'Edit').click();

		expect(handleEdit).not.toHaveBeenCalled();
	});

	it('renders dividers between items', async () => {
		const items = [
			{ label: 'Edit', onClick: vi.fn() },
			{ type: 'divider' as const },
			{ label: 'Delete', onClick: vi.fn() }
		];
		const screen = await render(MoreMenu, { props: { items } });

		const separators = screen.container.querySelectorAll('[role="separator"]');
		expect(separators.length).toBeGreaterThanOrEqual(1);
	});

	it('defaults to ghost variant', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });
		const button = screen.getByRole('button', { name: 'More options' }).element();
		// Ghost variant should render a button element
		expect(button).toBeInTheDocument();
		expect(button.tagName).toBe('BUTTON');
	});

	it('renders astryx-more-menu class on dropdown panel for theme targeting', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });
		expect(menuIn(screen.container).className).toContain('astryx-more-menu');
	});

	it('pointer open focuses the menu container, not the first item (#4477)', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });

		pointerOpen(screen.getByRole('button', { name: 'More options' }).element() as HTMLElement);

		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());
		expect(menuItem(screen.container, 'Edit')).not.toHaveFocus();
	});

	it('first ArrowDown after a pointer open moves focus to the first item (#4477)', async () => {
		const screen = await render(MoreMenu, { props: { items: defaultItems } });

		pointerOpen(screen.getByRole('button', { name: 'More options' }).element() as HTMLElement);
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(menuItem(screen.container, 'Edit')).toHaveFocus();
	});

	describe('placement and alignment', () => {
		it('resolves the same default position as DropdownMenu', async () => {
			// RESTATED: upstream renders both components into one tree and compares
			// their `position-area` strings. `render()` here mounts one component, so
			// the two are rendered separately and compared across the pair — the same
			// claim (MoreMenu's default resolves to DropdownMenu's), and the literal
			// upstream asserts is kept as the second expectation.
			const moreScreen = await render(MoreMenu, { props: { items: defaultItems } });
			const moreArea = positionAreaOf(moreScreen.container);
			moreScreen.unmount();

			const dropdownScreen = await render(DropdownMenu, {
				props: { button: { label: 'Actions' }, items: defaultItems }
			});

			expect(moreArea).toEqual(positionAreaOf(dropdownScreen.container));
			expect(moreArea).toEqual(areaTokens('self-block-end span-self-inline-end'));
		});

		it('forwards alignment to the menu layer', async () => {
			const screen = await render(MoreMenu, { props: { items: defaultItems, alignment: 'end' } });
			expect(positionAreaOf(screen.container)).toEqual(
				areaTokens('self-block-end span-self-inline-start')
			);
		});

		it('forwards placement to the menu layer', async () => {
			const screen = await render(MoreMenu, { props: { items: defaultItems, placement: 'above' } });
			expect(positionAreaOf(screen.container)).toEqual(
				areaTokens('self-block-start span-self-inline-end')
			);
		});
	});
});
