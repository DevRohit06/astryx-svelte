import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
import Compound from './fixtures/dropdown-menu-compound.svelte';
import Controlled from './fixtures/dropdown-menu-controlled.svelte';
import CopyRow from './fixtures/dropdown-menu-copy-row.svelte';
import DataApi from './fixtures/dropdown-menu-data-api.svelte';
import IconButton from './fixtures/dropdown-menu-icon-button.svelte';
import Rtl from './fixtures/dropdown-menu-rtl.svelte';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenu.test.tsx` — 67 of its 77 cases,
 * re-derived at the **0.5.0** pin (the file is unchanged since v0.4.1, which is
 * where this header's count last came from), across fourteen of its fifteen describe
 * blocks (the top-level
 * `DropdownMenu`, `light-dismiss race`, `controlled mode`, `items`, `sections`,
 * `dividers`, `theming slots`, `DropdownMenuItem destructive variant`,
 * `button customization`, `icon-only mode`, `hasChevron`, `compound mode`,
 * `open focus follows input modality (#4477)`, and `data/compound parity`).
 *
 * DROPPED, and named here because the count is the contract: the whole of
 * upstream's `DropdownMenu keyboard access for
 * menuitemradio/menuitemcheckbox (#3829)` block — 9 cases covering arrow
 * navigation, Enter/Space activation, typeahead and hover-focus over
 * consumer-rendered `menuitemradio`/`menuitemcheckbox` rows. They are portable
 * (nothing in them is React-specific) and predate 0.3.0; the gap is a standing
 * coverage debt, not a translation decision. Also dropped: the top-level
 * `typeahead advances past an item that already starts with the letter` case,
 * which exercises `useTypeahead`. That hook is now ported
 * (`hooks/use-typeahead.ts`, with its own suite in `use-typeahead.test.ts`) and
 * `dropdown-menu.svelte` calls it, so the case is unported coverage rather than
 * a deferral — the header's "deferred with it" reason had expired.
 *
 * 41 → 67 is 0.4.x's twenty-six additions: seven in `items` (the
 * `hasCloseOnSelect` trio, the no-handler close, and the three keying cases),
 * the four-case `destructive variant` block, the eleven-case `#4477` modality
 * block, and the four-case `data/compound parity` block.
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

/**
 * Open the menu the way a *mouse* does. `HTMLElement.prototype.click()` — what
 * the rest of this suite uses, and what upstream's `fireEvent.click` produces —
 * reports `detail === 0`, the shape of a screen-reader / AT activation, which
 * `DropdownMenu` deliberately treats as a keyboard open (#4477). A real pointer
 * click reports `detail >= 1`, so the modality cases dispatch that explicitly
 * rather than reaching for `userEvent.click`: the assertion is about the event's
 * `detail`, so the test states it instead of relying on the driver to.
 */
function pointerOpen(trigger: HTMLElement): void {
	trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
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

	it('closes the menu after an item is activated', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Edit', onClick: () => {} }] }
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		menuItem(screen.container, 'Edit').click();
		expect(hideSpy).toHaveBeenCalled();
	});

	it('keeps the menu open when the item opts out of closing', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const handleClick = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Copy ID', onClick: handleClick, hasCloseOnSelect: false }]
			}
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const item = menuItem(screen.container, 'Copy ID');
		item.click();
		expect(handleClick).toHaveBeenCalledTimes(1);
		expect(hideSpy).not.toHaveBeenCalled();

		// Second activation still works, and focus never left the item.
		item.click();
		expect(handleClick).toHaveBeenCalledTimes(2);
	});

	it('keeps the menu open on keyboard activation too', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const handleClick = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Copy ID', onClick: handleClick, hasCloseOnSelect: false }]
			}
		});

		const trigger = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		pointerOpen(trigger);
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());
		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

		expect(handleClick).toHaveBeenCalledTimes(1);
		expect(hideSpy).not.toHaveBeenCalled();
		expect(menuItem(screen.container, 'Copy ID')).toHaveFocus();
	});

	it('closes the menu on activation even when the item carries no handler', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ label: 'Edit' }] }
		});

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		menuItem(screen.container, 'Edit').click();
		expect(hideSpy).toHaveBeenCalled();
	});

	it('keeps a row mounted when its label changes, so focus survives (data mode keys by position)', async () => {
		const screen = await render(CopyRow);

		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const item = menuItem(screen.container, 'Copy ID');
		item.focus();
		item.click();

		// Upstream awaits `user.click`, which settles the state update inside
		// `act()`. There is no counterpart here and none is needed — the `$state`
		// write flushes on its own — but it flushes in a *microtask*, so the query
		// has to retry rather than read the DOM in the same tick as the click.
		let renamed!: HTMLElement;
		await vi.waitFor(() => {
			renamed = menuItem(screen.container, 'Copied');
		});
		expect(renamed).toBe(item);
		expect(renamed).toHaveFocus();
	});

	it('follows the item, not the slot, when ids are supplied and the list changes', async () => {
		// A menu whose rows are filtered by a control outside it: the focused row
		// survives at a new index. Position keys cannot express this — the DOM node
		// at index 0 would be reused for whatever item lands there.
		const all = [
			{ id: 'edit', label: 'Edit' },
			{ id: 'duplicate', label: 'Duplicate' },
			{ id: 'archive', label: 'Archive' }
		];
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: all }
		});
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();

		const duplicate = menuItem(screen.container, 'Duplicate');
		duplicate.focus();

		await screen.rerender({
			button: { label: 'Actions' },
			items: all.filter((item) => item.id !== 'edit')
		});

		// Same node, still focused, even though it moved from index 1 to index 0.
		expect(menuItem(screen.container, 'Duplicate')).toBe(duplicate);
		expect(duplicate).toHaveFocus();
		expect(menuItems(screen.container).some((el) => el.textContent?.trim() === 'Edit')).toBe(false);
	});

	it('does not put id on the rendered row', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items: [{ id: 'edit', label: 'Edit' }] }
		});
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();

		// `id` is identity for the keyed `{#each}`, not a DOM attribute the caller
		// is setting.
		expect(menuItem(screen.container, 'Edit')).not.toHaveAttribute('id', 'edit');
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

describe('DropdownMenuItem destructive variant', () => {
	it('marks a compound-mode item destructive via data-variant', async () => {
		const screen = await render(Compound, { props: { scenario: 'destructive' } });

		const del = menuItem(screen.container, 'Delete');
		const edit = menuItem(screen.container, 'Edit');
		expect(del).toHaveAttribute('data-variant', 'destructive');
		// Default items carry no variant attribute, so existing usage is unchanged.
		expect(edit).not.toHaveAttribute('data-variant');
	});

	it('forwards variant from the data-driven items API', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{ label: 'Delete', variant: 'destructive', onClick: () => {} },
					{ label: 'Edit', onClick: () => {} }
				]
			}
		});

		expect(menuItem(screen.container, 'Delete')).toHaveAttribute('data-variant', 'destructive');
		expect(menuItem(screen.container, 'Edit')).not.toHaveAttribute('data-variant');
	});

	it('forwards variant to items nested inside a section', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{
						type: 'section',
						title: 'Danger zone',
						items: [{ label: 'Delete', variant: 'destructive', onClick: () => {} }]
					}
				]
			}
		});

		expect(menuItem(screen.container, 'Delete')).toHaveAttribute('data-variant', 'destructive');
	});

	it('defaults to no variant attribute', async () => {
		const screen = await render(Compound, { props: { scenario: 'defaultVariant' } });
		expect(menuItem(screen.container, 'Edit')).not.toHaveAttribute('data-variant');
	});
});

describe('DropdownMenu open focus follows input modality (#4477)', () => {
	const items = [{ label: 'Edit' }, { label: 'Duplicate' }, { label: 'Delete' }];

	it('pointer open focuses the menu container, not the first item (items mode)', async () => {
		const screen = await render(DropdownMenu, { props: { button: { label: 'Actions' }, items } });

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);

		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());
		expect(menuItem(screen.container, 'Edit')).not.toHaveFocus();
	});

	it('pointer open focuses the menu container in compound mode', async () => {
		const screen = await render(Compound, { props: { scenario: 'items' } });

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);

		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());
		expect(menuItem(screen.container, 'Edit')).not.toHaveFocus();
	});

	it('first ArrowDown after a pointer open moves focus to the first enabled item', async () => {
		const screen = await render(DropdownMenu, { props: { button: { label: 'Actions' }, items } });

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(menuItem(screen.container, 'Edit')).toHaveFocus();
	});

	it('ArrowDown after a pointer open skips a disabled leading item', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit', isDisabled: true }, { label: 'Delete' }]
			}
		});

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(menuItem(screen.container, 'Delete')).toHaveFocus();
	});

	it('keyboard open via Enter focuses the first enabled item', async () => {
		const screen = await render(DropdownMenu, { props: { button: { label: 'Actions' }, items } });

		const trigger = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		trigger.focus();
		trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

		await vi.waitFor(() => expect(menuItem(screen.container, 'Edit')).toHaveFocus());
	});

	it('keyboard open via ArrowDown skips a disabled leading item', async () => {
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit', isDisabled: true }, { label: 'Delete' }]
			}
		});

		const trigger = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		trigger.focus();
		trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

		await vi.waitFor(() => expect(menuItem(screen.container, 'Delete')).toHaveFocus());
	});

	it('a synthesized click (detail 0, AT activation) still focuses the first item', async () => {
		const screen = await render(DropdownMenu, { props: { button: { label: 'Actions' }, items } });

		// `.click()` dispatches a MouseEvent with detail 0 (the shape of a screen
		// reader / AT activation), so it must keep the keyboard behavior.
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();

		await vi.waitFor(() => expect(menuItem(screen.container, 'Edit')).toHaveFocus());
	});

	it('controlled pointer open focuses the menu container', async () => {
		const screen = await render(Controlled, { props: { items } });

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);

		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());
		expect(menuItem(screen.container, 'Edit')).not.toHaveFocus();
	});

	it('programmatic controlled open still focuses the first item', async () => {
		const screen = await render(DropdownMenu, {
			props: { button: { label: 'Actions' }, items, isMenuOpen: false, onOpenChange: () => {} }
		});

		await screen.rerender({
			button: { label: 'Actions' },
			items,
			isMenuOpen: true,
			onOpenChange: () => {}
		});

		await vi.waitFor(() => expect(menuItem(screen.container, 'Edit')).toHaveFocus());
	});

	it('Escape still closes the menu after a pointer open', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(DropdownMenu, { props: { button: { label: 'Actions' }, items } });

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(hideSpy).toHaveBeenCalled();
	});

	it('Tab still closes the menu after a pointer open (APG menu-button)', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(DropdownMenu, { props: { button: { label: 'Actions' }, items } });

		pointerOpen(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement);
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menu).toHaveFocus());

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
		expect(hideSpy).toHaveBeenCalled();
	});
});

describe('DropdownMenu data/compound parity', () => {
	it('renders an identical divider from either mode', async () => {
		const fromDataScreen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [{ label: 'Edit' }, { type: 'divider' }, { label: 'Delete' }]
			}
		});
		const fromData = fromDataScreen.container.querySelector('[role="separator"]')?.outerHTML;
		fromDataScreen.unmount();

		const compoundScreen = await render(Compound, { props: { scenario: 'menuDivider' } });
		const fromCompound = compoundScreen.container.querySelector('[role="separator"]');

		expect(fromCompound?.outerHTML).toBe(fromData);
		expect(fromCompound).toHaveClass('astryx-dropdown-menu-divider');
	});

	it('skips a compound divider in the arrow-key order', async () => {
		const screen = await render(Compound, { props: { scenario: 'menuDivider' } });

		const trigger = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		trigger.focus();
		trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		const menu = menuIn(screen.container);
		await vi.waitFor(() => expect(menuItem(screen.container, 'Edit')).toHaveFocus());

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(menuItem(screen.container, 'Delete')).toHaveFocus();
		expect(screen.container.querySelector('[role="separator"]')).not.toHaveFocus();
	});

	it('carries endContent and description through the items data API', async () => {
		const screen = await render(DataApi, { props: { scenario: 'endContent' } });

		const item = menuItems(screen.container)[0];
		expect(item).toHaveTextContent('Find anything');
		expect(item.contains(screen.getByTestId('shortcut').element())).toBe(true);
	});

	it('takes a snippet label through the items data API', async () => {
		// RESTATED: upstream passes a `ReactNode` label (`<em data-testid="rich">`).
		// The Svelte counterpart of "arbitrary node" in this API is a Snippet, which
		// `DropdownMenuItemData['label']` now admits because it is `Pick`ed from
		// `DropdownMenuItemProps`. Same claim: rich content renders inside the row
		// and the row still reads as "Rename" to typeahead and screen readers.
		const screen = await render(DataApi, { props: { scenario: 'richLabel' } });

		const item = menuItems(screen.container)[0];
		expect(item.contains(screen.getByTestId('rich').element())).toBe(true);
		expect(item.textContent?.trim()).toBe('Rename');
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
