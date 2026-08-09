import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
import Compound from './fixtures/dropdown-menu-compound.svelte';
import IconButton from './fixtures/dropdown-menu-icon-button.svelte';
import Rtl from './fixtures/dropdown-menu-rtl.svelte';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenu.test.tsx` — 41 of its 50 cases
 * (v0.3.0), across eleven of its twelve describe blocks (the top-level
 * `DropdownMenu`, `light-dismiss race`, `controlled mode`, `items`, `sections`,
 * `dividers`, `theming slots`, `button customization`, `icon-only mode`,
 * `hasChevron`, and `compound mode`).
 *
 * DROPPED, and named here because the count is the contract: the whole of
 * upstream's twelfth block, `DropdownMenu keyboard access for
 * menuitemradio/menuitemcheckbox (#3829)` — 9 cases covering arrow navigation,
 * Enter/Space activation, typeahead and hover-focus over consumer-rendered
 * `menuitemradio`/`menuitemcheckbox` rows. They are portable (nothing in them is
 * React-specific) and predate 0.3.0; the gap is a standing coverage debt, not a
 * translation decision. 36 → 41 here is 0.3.0's five additions
 * (`alignment`, the two uncontrolled-transition cases, and the two theming
 * slots); the #3829 block is unchanged by 0.3.0 and stays open.
 *
 * Its two sibling suites live in their own files, matching upstream's split:
 * `dropdown-menu-selectable.svelte.test.ts` (the checkbox/radio trio) and
 * `dropdown-menu-sub-menu.svelte.test.ts`. Both were unportable until the 0.2.0
 * pin — their components were the slice the published tarball did not compile —
 * and that stale-dist deferral has since retired. No checkbox/radio/submenu case
 * belongs in this file.
 *
 * No React-only case appears in this file: there is no ref-callback and no
 * `displayName` case to drop.
 *
 * The mechanical translations this suite makes, each following a pattern the
 * `popover`/`layer`/`list-focus` suites set:
 *
 * - Runs in the **client (real Chromium)** project — the `.svelte.` filename —
 *   for the same reason `popover.svelte.test.ts` does: the menu opens through the
 *   native Popover API, and typeahead/roving-focus need real focus. Upstream's
 *   `beforeEach` stubbing `showPopover`/`hidePopover`/`:popover-open` is therefore
 *   GONE — Chromium implements all of it natively, and keeping the stub would
 *   substitute a model of the thing under test for the thing itself. Where a case
 *   asserts on the *call* (`showPopover`/`hidePopover`), we `vi.spyOn` the native
 *   method (which `spyOn` still calls through), preserving both the real behavior
 *   and upstream's assertion verbatim.
 * - `render` is async — always awaited.
 * - `getByRole('menu'/'menuitem', {hidden: true})` becomes a container
 *   `querySelector`: a closed popover is `display: none` in a real browser, so the
 *   accessibility-tree query would need to opt into hidden nodes to see it — the
 *   same translation `popover.svelte.test.ts` documents for its hidden dialog.
 * - `fireEvent.click` / `fireEvent.keyDown` become a native `.click()` / a
 *   dispatched `KeyboardEvent`, as the `popover`/`list-focus` suites do.
 * - `rerender` is `screen.rerender`.
 *
 * RESTATED cases carry an inline comment: the two placement cases (browser
 * canonicalises `position-area` token order — see `layer.svelte.test.ts`) and
 * the icon+label case (28), whose `not.toHaveAttribute('aria-label')` cannot be
 * ported because Svelte snippet children are opaque; see its comment.
 */

// A closed popover keeps its content in the DOM (display:none), so these read it
// directly, mirroring upstream's `{hidden: true}` role queries.
function menuIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="menu"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="menu" element');
	return el;
}

function menuItems(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

/** A menuitem by its accessible name (its trimmed text, or an `aria-label`). */
function menuItem(container: HTMLElement, name: string): HTMLElement {
	const el = menuItems(container).find(
		(item) => item.getAttribute('aria-label') === name || item.textContent?.trim() === name
	);
	if (!el) throw new Error(`no menuitem named "${name}"`);
	return el;
}

/** `position-area` keywords are order-insensitive; the engine canonicalises. */
function areaTokens(value: string): string[] {
	return value.trim().split(/\s+/).filter(Boolean).sort();
}

function popoverAreaOf(container: HTMLElement): string[] {
	const popover = menuIn(container).closest('[popover]');
	if (!(popover instanceof HTMLElement)) throw new Error('expected a [popover] ancestor');
	return areaTokens(popover.style.getPropertyValue('position-area'));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('DropdownMenu', () => {
	it('renders trigger button with label', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});
		await expect.element(screen.getByRole('button', { name: /Actions/ })).toBeInTheDocument();
	});

	it('renders menu with role="menu"', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});
		expect(menuIn(screen.container)).toBeInTheDocument();
	});

	it('names the menu from the trigger label (menus-13)', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});
		expect(menuIn(screen.container)).toHaveAttribute('aria-label', 'Actions');
	});

	it('does not wrap the menu in a role="dialog" aria-modal element', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});
		// The popup exposes its own role="menu"; it must not be nested inside a
		// modal dialog, which would announce an unnamed dialog around the menu
		// while focus stays on the trigger.
		expect(screen.container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
		expect(document.querySelector('[aria-modal="true"]')).not.toBeInTheDocument();
	});

	it('defaults menu placement below', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});
		// RESTATED: upstream `style` string match `.toContain('position-area:
		// self-block-end span-self-inline-end')`. Chromium reserialises the style
		// attribute and reorders position-area keywords (block-axis first), so the
		// cases compare the parsed property as a sorted token set — same reasoning
		// as `layer.svelte.test.ts`, and stricter (only passes if the engine
		// actually accepted the value).
		expect(popoverAreaOf(screen.container)).toEqual(
			areaTokens('self-block-end span-self-inline-end')
		);
	});

	it('supports explicit menu placement', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, placement: 'above', items: [{ label: 'Item 1' }] }
		});
		// RESTATED as above — token-set comparison of the canonicalised property.
		expect(popoverAreaOf(screen.container)).toEqual(
			areaTokens('self-block-start span-self-inline-end')
		);
	});

	it('supports explicit menu alignment', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, alignment: 'end', items: [{ label: 'Item 1' }] }
		});
		// RESTATED as the placement cases above — token-set comparison of the
		// canonicalised property.
		expect(popoverAreaOf(screen.container)).toEqual(
			areaTokens('self-block-end span-self-inline-start')
		);
	});

	it('emits the direction-independent logical mapping under an RTL ancestor (#3389)', async () => {
		// The self-* position-area keywords resolve against the popover's own
		// inherited direction in the browser, so RTL emits the same string as LTR
		// and the mirroring is pure CSS.
		const screen = await render(Rtl);
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		// RESTATED as the placement cases above — token-set comparison.
		expect(popoverAreaOf(screen.container)).toEqual(
			areaTokens('self-block-end span-self-inline-end')
		);
	});

	it('has aria-haspopup and aria-expanded attributes', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});
		const button = screen.getByRole('button', { name: /Actions/ });
		await expect.element(button).toHaveAttribute('aria-haspopup', 'menu');
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens menu when button is clicked', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		await vi.waitFor(() => {
			expect(showSpy).toHaveBeenCalled();
		});
	});

	it('calls onOpenChange for uncontrolled native open and close transitions', async () => {
		const handleOpenChange = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Item 1' }],
				onOpenChange: handleOpenChange
			}
		});

		const button = screen.getByRole('button', { name: /Actions/ });
		(button.element() as HTMLElement).click();
		await vi.waitFor(() => {
			expect(handleOpenChange).toHaveBeenCalledWith(true);
		});

		handleOpenChange.mockClear();
		// RESTATED: upstream synthesises a `toggle` event with `newState: 'closed'`
		// because jsdom has no Popover API. In a real browser the genuine article is
		// available — `hidePopover()` called on the popover element itself bypasses
		// our `hide()` exactly as a light dismiss does, and the browser fires the
		// real toggle event. Same transition, no model of it.
		const popoverEl = menuIn(screen.container).closest('[popover]') as HTMLElement;
		expect(popoverEl).not.toBeNull();
		popoverEl.hidePopover();

		await vi.waitFor(() => {
			expect(handleOpenChange).toHaveBeenCalledWith(false);
		});
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('restores focus to the trigger after native light dismiss', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Edit' }, { label: 'Delete' }] }
		});

		const button = screen.getByRole('button', { name: /Actions/ });
		(button.element() as HTMLElement).focus();
		(button.element() as HTMLElement).click();
		await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

		// RESTATED: upstream stubs `requestAnimationFrame` to run synchronously and
		// blurs the trigger from a `toggle` listener, both jsdom accommodations. Here
		// focus really does move into the menu (asserted above), and the dismissal is
		// a real `hidePopover()`, so the assertion that focus comes back to the
		// trigger is made against the browser rather than a simulation of it.
		const popoverEl = menuIn(screen.container).closest('[popover]') as HTMLElement;
		expect(popoverEl).not.toBeNull();
		popoverEl.hidePopover();

		await expect.element(button).toHaveFocus();
	});

	it('closes the menu when Tab is pressed inside it (APG menu-button)', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }] }
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		await vi.waitFor(() => {
			expect(showSpy).toHaveBeenCalled();
		});

		const menu = menuIn(screen.container);
		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
		await vi.waitFor(() => {
			expect(hideSpy).toHaveBeenCalled();
		});
	});

	it('typeahead focuses the item matching the typed character (menus-11)', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Cut' }, { label: 'Copy' }, { label: 'Delete' }]
			}
		});
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const menu = menuIn(screen.container);
		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
		await expect.element(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
	});

	it('calls onClick callback when button is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Item 1' }], onClick: handleClick }
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('applies data-testid to button', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Item 1' }],
				'data-testid': 'my-dropdown'
			}
		});
		await expect.element(screen.getByTestId('my-dropdown')).toBeInTheDocument();
	});
});

describe('DropdownMenu light-dismiss race', () => {
	it('does not re-open the menu when a click follows a hide within the guard window', async () => {
		// Reproduces the iOS Safari race: pointerdown fires light-dismiss before the
		// subsequent click on the trigger; without the guard, the click would
		// immediately re-open the menu in the same tap.
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit' }],
				'data-testid': 'astryx-dropdown-menu'
			}
		});

		const trigger = screen.getByTestId('astryx-dropdown-menu').element() as HTMLElement;
		trigger.click(); // open
		trigger.click(); // close (stamps guard)
		trigger.click(); // would re-open without guard
		expect(showSpy).toHaveBeenCalledTimes(1);
		expect(hideSpy).toHaveBeenCalledTimes(1);
	});
});

describe('DropdownMenu controlled mode', () => {
	it('respects isMenuOpen prop', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const handleToggle = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Item 1' }],
				isMenuOpen: false,
				onOpenChange: handleToggle
			}
		});

		await expect
			.element(screen.getByRole('button', { name: /Actions/ }))
			.toHaveAttribute('aria-expanded', 'false');

		await screen.rerender({
			button: { label: 'Actions' },
			items: [{ label: 'Item 1' }],
			isMenuOpen: true,
			onOpenChange: handleToggle
		});

		await vi.waitFor(() => {
			expect(showSpy).toHaveBeenCalled();
		});
	});

	it('calls onOpenChange when button is clicked', async () => {
		const handleToggle = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Item 1' }],
				isMenuOpen: false,
				onOpenChange: handleToggle
			}
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		expect(handleToggle).toHaveBeenCalledWith(true);
	});
});

describe('DropdownMenu items', () => {
	it('renders items with labels', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Edit' }, { label: 'Delete' }] }
		});
		expect(menuItem(screen.container, 'Edit')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Delete')).toBeInTheDocument();
	});

	it('calls onClick when item is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Edit', onClick: handleClick }] }
		});

		menuItem(screen.container, 'Edit').click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('does not call onClick when disabled', async () => {
		const handleClick = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit', onClick: handleClick, isDisabled: true }]
			}
		});

		menuItem(screen.container, 'Edit').click();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('has aria-disabled when disabled', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Edit', isDisabled: true }] }
		});
		expect(menuItem(screen.container, 'Edit')).toHaveAttribute('aria-disabled', 'true');
	});
});

describe('DropdownMenu sections', () => {
	it('renders section with title', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{
						type: 'section',
						title: 'File Actions',
						items: [{ label: 'New' }, { label: 'Open' }]
					}
				]
			}
		});

		expect(screen.container.textContent).toContain('File Actions');
		expect(menuItem(screen.container, 'New')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Open')).toBeInTheDocument();
	});

	it('renders section without title', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{
						type: 'section',
						items: [{ label: 'Item 1' }, { label: 'Item 2' }]
					}
				]
			}
		});

		expect(menuItem(screen.container, 'Item 1')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Item 2')).toBeInTheDocument();
	});

	it('has role="group" with aria-label', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{
						type: 'section',
						title: 'My Section',
						items: [{ label: 'Item' }]
					}
				]
			}
		});

		const group = screen.container.querySelector('[role="group"]');
		expect(group).toBeInTheDocument();
		expect(group).toHaveAttribute('aria-label', 'My Section');
	});
});

describe('DropdownMenu dividers', () => {
	it('renders dividers between items', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit' }, { type: 'divider' }, { label: 'Delete' }]
			}
		});

		expect(menuItem(screen.container, 'Edit')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Delete')).toBeInTheDocument();
		expect(screen.container.querySelector('[role="separator"]')).toBeInTheDocument();
	});
});

describe('DropdownMenu theming slots', () => {
	it('exposes a themeable slot on the section heading', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ type: 'section', title: 'File Actions', items: [{ label: 'New' }] }]
			}
		});

		const heading = Array.from(screen.container.querySelectorAll('div')).find(
			(el) => el.textContent?.trim() === 'File Actions' && el.getAttribute('aria-hidden') === 'true'
		);
		expect(heading).toHaveClass('astryx-dropdown-menu-section-heading');
	});

	it('exposes a themeable slot on the menu divider', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit' }, { type: 'divider' }, { label: 'Delete' }]
			}
		});

		const divider = screen.container.querySelector('[role="separator"]');
		expect(divider).toHaveClass('astryx-dropdown-menu-divider');
		// Still carries the base Divider slot so global divider theming applies too.
		expect(divider).toHaveClass('astryx-divider');
	});
});

describe('DropdownMenu button customization', () => {
	it('renders with different button variants', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Primary', variant: 'primary' }, items: [{ label: 'Item' }] }
		});
		await expect.element(screen.getByRole('button', { name: /Primary/ })).toBeInTheDocument();

		await screen.rerender({
			button: { label: 'Ghost', variant: 'ghost' },
			items: [{ label: 'Item' }]
		});
		await expect.element(screen.getByRole('button', { name: /Ghost/ })).toBeInTheDocument();
	});

	it('renders with different button sizes', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Small', size: 'sm' }, items: [{ label: 'Item' }] }
		});
		await expect.element(screen.getByRole('button', { name: /Small/ })).toBeInTheDocument();

		await screen.rerender({ button: { label: 'Large', size: 'lg' }, items: [{ label: 'Item' }] });
		await expect.element(screen.getByRole('button', { name: /Large/ })).toBeInTheDocument();
	});
});

describe('DropdownMenu icon-only mode', () => {
	it('renders icon-only button when icon is set without children', async () => {
		const screen = await render(IconButton, { props: { iconOnly: true } });
		const button = screen.getByRole('button', { name: 'More options' });
		// label should be aria-label, not visible text
		await expect.element(button).toHaveAttribute('aria-label', 'More options');
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders icon + label when children are provided on button', async () => {
		const screen = await render(IconButton, { props: { iconOnly: false } });
		const button = screen.getByRole('button', { name: /Settings/ });
		// RESTATED: upstream asserts `not.toHaveAttribute('aria-label')`. Upstream
		// Button only sets aria-label when `children != null && children !== label`;
		// with `children === label` ('Settings'), no aria-label is emitted. In
		// Svelte `children` is an opaque Snippet, so the port cannot compare it to
		// `label` and falls back to `children != null`, emitting a redundant
		// aria-label EQUAL to the label. The accessible name is 'Settings' either
		// way — the title's claim ("icon + label") — so this asserts that and the
		// icon's presence, in place of the unportable attribute-absence check.
		await expect.element(button).toBeInTheDocument();
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});
});

describe('DropdownMenu hasChevron', () => {
	it('hides chevron when hasChevron is false', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Sort by' },
				hasChevron: false,
				items: [{ label: 'Name' }, { label: 'Date' }]
			}
		});
		// RESTATED: upstream selects `[class*="endContent"]` inside the button.
		// StyleX compiles the endContent wrapper's class to a hashed atomic name
		// with no literal "endContent" substring, so that selector is meaningless
		// here. The chevron is a `chevronDown` `<svg>`; with hasChevron false the
		// trigger renders no endContent, hence no svg — same claim, observable.
		const button = screen.getByRole('button', { name: /Sort by/ }).element();
		expect(button.querySelector('svg')).toBeNull();
	});
});

describe('DropdownMenu compound mode', () => {
	it('renders JSX children as menu items', async () => {
		const screen = await render(Compound, { props: { scenario: 'items' } });
		expect(menuItem(screen.container, 'Edit')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Delete')).toBeInTheDocument();
	});

	it('renders endContent after the item label', async () => {
		const screen = await render(Compound, { props: { scenario: 'endContent' } });
		await expect.element(screen.getByTestId('badge')).toHaveTextContent('3');
	});

	it('calls onClick when compound item is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(Compound, { props: { scenario: 'items', editClick: handleClick } });

		menuItem(screen.container, 'Edit').click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('does not call onClick when compound item is disabled', async () => {
		const handleClick = vi.fn();
		const screen = await render(Compound, {
			props: { scenario: 'disabled', editClick: handleClick, isDisabled: true }
		});

		menuItem(screen.container, 'Edit').click();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('renders dividers between compound items', async () => {
		const screen = await render(Compound, { props: { scenario: 'divider' } });

		expect(menuItem(screen.container, 'Edit')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Delete')).toBeInTheDocument();
		expect(screen.container.querySelector('[role="separator"]')).toBeInTheDocument();
	});

	it('has aria-disabled on disabled compound items', async () => {
		const screen = await render(Compound, { props: { scenario: 'disabled', isDisabled: true } });
		expect(menuItem(screen.container, 'Edit')).toHaveAttribute('aria-disabled', 'true');
	});

	it('supports mixed static and dynamic compound children', async () => {
		const screen = await render(Compound, { props: { scenario: 'mixed', showConditional: true } });

		expect(menuItem(screen.container, 'Always')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Conditional')).toBeInTheDocument();
	});
});
