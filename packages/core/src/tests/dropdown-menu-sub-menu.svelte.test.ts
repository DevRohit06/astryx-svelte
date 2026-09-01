/** PORTS: DropdownMenu/DropdownMenuSubMenu.test.tsx */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
import SubMenu from './fixtures/dropdown-menu-sub-menu.svelte';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuSubMenu.test.tsx`, all **22**
 * cases at the 0.5.0 pin, across its four describe blocks
 * (`DropdownMenuSubMenu`, `DropdownMenu data-driven submenus`, the WCAG 2.2 /
 * APG block, and `theming slots`). Nothing is dropped. (The header read "all 19
 * cases (v0.3.0)" while both files held 22 — the port was complete and only the
 * number was stale.)
 *
 * Like `dropdown-menu-selectable.svelte.test.ts`, this suite could not exist
 * before the 0.2.0 pin — `DropdownMenuSubMenu` was part of the slice the
 * published tarball did not compile.
 *
 * Translations, all following `dropdown-menu.svelte.test.ts`:
 * - **Client (real Chromium)** project, so upstream's `beforeEach` stubbing
 *   `showPopover`/`hidePopover`/`:popover-open` is GONE — Chromium implements
 *   all of it, and this suite leans on that hard: every case depends on real
 *   focus moving between nested inline popovers.
 * - `getByRole(…, {hidden: true})` / `findByRole` become container
 *   `querySelector`s, since a closed popover is `display: none` here.
 * - `user.keyboard('{ArrowRight}')` becomes a `KeyboardEvent` dispatched at
 *   `document.activeElement`, which is what `user.keyboard` targets.
 * - `user.hover` becomes a dispatched `mouseover`/`mouseenter` pair.
 * - `waitFor` is `vi.waitFor`.
 * - Upstream's inline `MoveMenu` and `AsyncSubmenu` components become scenarios
 *   in `fixtures/dropdown-menu-sub-menu.svelte`.
 */

function rows(container: HTMLElement, role = 'menuitem'): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(`[role="${role}"]`));
}

/** A menu row by accessible name. Matches on contained text, as upstream's regex names do. */
function item(container: HTMLElement, name: string): HTMLElement {
	const el = rows(container).find(
		(r) => r.getAttribute('aria-label') === name || r.textContent?.trim().includes(name)
	);
	if (!el) throw new Error(`no menuitem named "${name}"`);
	return el;
}

/** The flyout `role="menu"` labelled by the given trigger. */
function flyoutFor(container: HTMLElement, trigger: HTMLElement): HTMLElement {
	const el = container.querySelector<HTMLElement>(`[role="menu"][aria-labelledby="${trigger.id}"]`);
	if (!el) throw new Error('no flyout for that trigger');
	return el;
}

/** `user.keyboard` dispatches at the focused element; so does this. */
function press(key: string): void {
	const target = (document.activeElement as HTMLElement | null) ?? document.body;
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function hover(el: HTMLElement): void {
	el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
	el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
}

/** `fireEvent.pointerMove(el, {pointerType: 'mouse'})`. */
function pointerMove(el: HTMLElement): void {
	el.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('DropdownMenuSubMenu', () => {
	it('renders the trigger with aria-haspopup and collapsed aria-expanded', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens the flyout on trigger click and exposes its items', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		trigger.click();
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});
		expect(item(screen.container, 'Folder A')).toBeInTheDocument();
	});

	it('opens on ArrowRight and returns focus to the trigger on ArrowLeft', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		// The menu focuses its first item (Rename) on open via rAF; wait for that
		// to settle before moving focus to the submenu trigger, so the deferred
		// focus can't steal it back mid-test.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Rename'));
		});
		trigger.focus();
		press('ArrowRight');
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});
		// Focus moved into the flyout's first item.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Folder A'));
		});
		press('ArrowLeft');
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
		});
		expect(document.activeElement).toBe(trigger);
	});

	it('names the flyout from its trigger via aria-labelledby', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		trigger.click();
		const flyout = flyoutFor(screen.container, trigger);
		expect(flyout).toHaveAttribute('aria-labelledby', trigger.id);
	});

	it('invokes the nested item handler on selection', async () => {
		const onMove = vi.fn();
		const screen = await render(SubMenu, { props: { scenario: 'move', onMove } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		item(screen.container, 'Move to').click();
		await vi.waitFor(() => {
			expect(item(screen.container, 'Folder A')).toBeInTheDocument();
		});
		item(screen.container, 'Folder A').click();
		expect(onMove).toHaveBeenCalledWith('a');
	});

	it('closes the whole menu after selecting a nested item', async () => {
		// Regression: the nested closeMenu only closed the flyout, leaving the
		// root menu open. Selecting a leaf must dismiss the entire stack. The root
		// menu's open state is reflected on its trigger button's aria-expanded.
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		const button = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		button.click();
		// Upstream's `await user.click()` flushes React before asserting; a native
		// `.click()` does not wait for Svelte's DOM update, so the open-state
		// assertion retries.
		await vi.waitFor(() => {
			expect(button).toHaveAttribute('aria-expanded', 'true');
		});
		item(screen.container, 'Move to').click();
		await vi.waitFor(() => {
			expect(item(screen.container, 'Folder A')).toBeInTheDocument();
		});
		item(screen.container, 'Folder A').click();
		// The whole stack is dismissed — the root menu closed too.
		await vi.waitFor(() => {
			expect(button).toHaveAttribute('aria-expanded', 'false');
		});
	});

	it('activates a nested item with the Enter key and closes the menu', async () => {
		const onMove = vi.fn();
		const screen = await render(SubMenu, { props: { scenario: 'move', onMove } });
		const button = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		button.click();
		const trigger = item(screen.container, 'Move to');
		// Let the root menu's open-focus (Rename, via rAF) settle before moving
		// focus to the submenu trigger, so it can't steal focus back mid-test.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Rename'));
		});
		trigger.focus();
		press('ArrowRight');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Folder A'));
		});
		press('Enter');
		expect(onMove).toHaveBeenCalledWith('a');
		await vi.waitFor(() => {
			expect(button).toHaveAttribute('aria-expanded', 'false');
		});
	});

	it('does not open a disabled submenu', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'disabled' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		expect(trigger).toHaveAttribute('aria-disabled', 'true');
		trigger.click();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('steps through every flyout item with ArrowDown without skipping', async () => {
		// Regression: the flyout renders inline inside the parent menu's
		// roving-focus container, so an unstopped ArrowDown bubbled to the parent
		// and moved focus a second time — skipping the middle item.
		const screen = await render(SubMenu, { props: { scenario: 'threeItems' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		// The root menu focuses its first item on open — here the submenu trigger
		// itself — through an effect-deferred rAF (0.3.0 moved the focus off the
		// show() call and onto the layer's committed-open transition). Upstream's
		// `await user.click` flushes that before the test continues; a native
		// `.click()` does not, so wait for it to land. Otherwise it fires *after*
		// ArrowRight opened the flyout and steals focus back onto the trigger — the
		// same settle the `loading` case below already waits for.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
		press('ArrowRight');
		// Opens and focuses the first item.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Projects'));
		});
		// ArrowDown lands on the MIDDLE item (previously skipped to Trash).
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Archive'));
		});
		// ArrowDown again lands on the last item.
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Trash'));
		});
		// ArrowUp returns to the middle item (no skip in reverse either).
		press('ArrowUp');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Archive'));
		});
	});
});

describe('DropdownMenu data-driven submenus', () => {
	it('renders a submenu when an item declares nested items', async () => {
		const onMove = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{ label: 'Rename', onClick: () => {} },
					{
						label: 'Move to',
						items: [
							{ label: 'Folder A', onClick: () => onMove('a') },
							{ label: 'Folder B', onClick: () => onMove('b') }
						]
					}
				]
			}
		});
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
		trigger.click();
		await vi.waitFor(() => {
			expect(item(screen.container, 'Folder B')).toBeInTheDocument();
		});
		item(screen.container, 'Folder B').click();
		expect(onMove).toHaveBeenCalledWith('b');
	});

	it('keyboard-reaches an item positioned after a submenu row', async () => {
		// Regression: the submenu flyout renders inline inside the root menu, so
		// the root's item query swept in the (hidden) flyout items. Arrow nav then
		// stalled on those unfocusable items and never reached "Delete" below the
		// submenu row.
		const onDelete = vi.fn();
		const screen = await render(DropdownMenu, {
			props: {
				button: { label: 'Actions' },
				items: [
					{ label: 'Rename', onClick: () => {} },
					{
						label: 'Move to',
						items: [
							{ label: 'Folder A', onClick: () => {} },
							{ label: 'Folder B', onClick: () => {} }
						]
					},
					{ type: 'divider' },
					{ label: 'Delete', onClick: onDelete }
				]
			}
		});
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Rename'));
		});
		// Rename → Move to → Delete (two ArrowDowns, no stalling on hidden flyout
		// items).
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Move to'));
		});
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Delete'));
		});
		press('Enter');
		expect(onDelete).toHaveBeenCalled();
	});
});

describe('DropdownMenuSubMenu accessibility (WCAG 2.2 / APG)', () => {
	// 2.1.2 No Keyboard Trap + APG submenu contract: Escape closes the current
	// submenu and returns focus to its trigger, leaving the parent menu open.
	it('closes only the submenu on Escape and restores focus to the trigger', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		const button = screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement;
		button.click();
		const trigger = item(screen.container, 'Move to');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Rename'));
		});
		trigger.focus();
		press('ArrowRight');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Folder A'));
		});
		press('Escape');
		// Submenu collapsed, focus back on the trigger…
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
		});
		expect(document.activeElement).toBe(trigger);
		// …but the parent menu is still open (Escape didn't dismiss everything).
		expect(button).toHaveAttribute('aria-expanded', 'true');
	});

	// 2.1.1 Keyboard: type-ahead is operable inside the flyout.
	it('supports first-character type-ahead within the flyout', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'fruit' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		// Wait for the root menu's deferred open-focus to land on the trigger before
		// opening the flyout; see the `ArrowDown` case above for why.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
		press('ArrowRight');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Apple'));
		});
		press('c');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Cherry'));
		});
	});

	// The core of the inline-flyout fix: a submenu nested inside a submenu must
	// not double-handle arrow keys (each level self-scopes via boundarySelector),
	// so navigation in the deepest flyout steps one item at a time.
	it('navigates a two-level nested submenu without double-stepping', async () => {
		const onPick = vi.fn();
		const screen = await render(SubMenu, { props: { scenario: 'nested', onPick } });
		(screen.getByRole('button', { name: /Share/ }).element() as HTMLElement).click();
		const shareTo = item(screen.container, 'Share to');
		// Let the root menu's open-focus (Copy link, via rAF) settle first so it
		// can't steal focus back after we move to the submenu trigger.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Copy link'));
		});
		shareTo.focus();
		press('ArrowRight');
		// First flyout: focus on Email.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Email'));
		});
		// Down to the nested submenu trigger, then open it.
		press('ArrowDown');
		const teamTrigger = item(screen.container, 'Team');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(teamTrigger);
		});
		press('ArrowRight');
		// Deepest flyout: Design → Eng → Data, one step per press (no skipping).
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Design'));
		});
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Eng'));
		});
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Data'));
		});
		press('Enter');
		expect(onPick).toHaveBeenCalledWith('data');
	});

	// Regression: hovering the submenu trigger while a sibling item still holds
	// focus must move the single focus-driven highlight onto the trigger — not
	// leave two items highlighted at once (the trigger via :hover, the sibling
	// via :focus). Mirrors DropdownMenuItem's hover-focus behavior.
	it('moves focus to the submenu trigger on hover, keeping a single highlight', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();

		const rename = item(screen.container, 'Rename');
		const trigger = item(screen.container, 'Move to');

		rename.focus();
		expect(document.activeElement).toBe(rename);

		// A mouse hover over the submenu trigger moves focus onto it, so the single
		// focus-driven highlight follows the pointer instead of leaving two.
		pointerMove(trigger);
		expect(document.activeElement).toBe(trigger);
		expect(document.activeElement).not.toBe(rename);
	});

	// 1.4.13 Content on Hover or Focus: the flyout stays open while the pointer
	// is over it (moving onto the flyout must not dismiss it).
	it('keeps the flyout open while the pointer is over it', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		trigger.click();
		// As above: wait for the open to land before hovering, since a native
		// `.click()` doesn't flush Svelte's DOM update the way `user.click` does.
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});
		const flyout = flyoutFor(screen.container, trigger);
		hover(flyout);
		hover(item(screen.container, 'Folder A'));
		// Still open after moving the pointer onto the flyout and its items.
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	// Async/loading submenu (hasSpinner): the flyout may contain no focusable
	// items yet (only a disabled "Loading…" row). Opening it must still move
	// keyboard ownership INTO the flyout — otherwise focus stays on the parent
	// list, arrow keys rove the parent while the empty flyout stays open, and
	// Enter re-triggers into a broken state.
	it('moves focus into a loading (item-less) flyout so keyboard ownership transfers', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'loading' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Rename'));
		});
		trigger.focus();
		press('ArrowRight');
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});
		// The flyout has no focusable items, so focus lands on the flyout container
		// itself — NOT on a parent item (Rename/Delete).
		const flyout = flyoutFor(screen.container, trigger);
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(flyout);
		});
		expect(document.activeElement).not.toBe(item(screen.container, 'Rename'));
		expect(document.activeElement).not.toBe(item(screen.container, 'Delete'));
		// Left/Escape from the loading flyout closes it and returns to the trigger.
		press('ArrowLeft');
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
		});
		expect(document.activeElement).toBe(trigger);
	});

	it('roves to the first item once a loading flyout resolves', async () => {
		// After children load, ArrowDown from the focused container moves onto the
		// first real item (container reports index -1, so next = first).
		const screen = await render(SubMenu, { props: { scenario: 'async' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		// Wait for the root menu's deferred open-focus to land on the trigger before
		// opening the flyout; see the `ArrowDown` case above for why.
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
		press('ArrowRight');
		// Children resolve on open; ArrowDown moves from the container to Folder A.
		//
		// **This case was the suite's one full-run flake, and the cause was in the
		// fixture rather than here** (2026-08-07). Its `loaded` flip raced the very
		// `requestAnimationFrame` the submenu's `focusFirst()` runs on: under load
		// the frame arrived after the 10ms timer, so `Folder A` already existed
		// when `focusFirst()` ran, focus landed on it, and this ArrowDown advanced
		// to `Folder B`. The fixture now defers through a nested rAF, which is
		// ordered after the submenu's by definition. Tightening the wait *here* to
		// "the flyout container holds focus" was tried first and is wrong — the
		// element that takes the fallback focus is not the one `flyoutFor` returns.
		await vi.waitFor(() => {
			expect(item(screen.container, 'Folder A')).toBeInTheDocument();
		});
		press('ArrowDown');
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(item(screen.container, 'Folder A'));
		});
	});
});

/**
 * Upstream's `describe('DropdownMenuSubMenu hover/click guard')`, new at 0.4.2
 * with the #3121 `useMenuHover` consolidation — the submenu gained the guard it
 * never had. All three cases.
 *
 * Timing translation is `menu-hover.svelte.test.ts`'s: upstream drives fake
 * timers and `act()`, these wait out real ones. The hover is dispatched
 * synthetically for the same reason the other menu suites do it — a real pointer
 * press hit-tests into a flyout that deliberately overlaps its own trigger.
 */
describe('DropdownMenuSubMenu hover/click guard', () => {
	/** The hook's `DEFAULT_CLICK_GUARD_MS`. */
	const CLICK_GUARD_MS = 500;

	async function openTrigger() {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		return { screen, trigger };
	}

	function hover(el: HTMLElement): void {
		el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
	}

	it('keeps the flyout open when a hover-open is immediately clicked', async () => {
		const { screen, trigger } = await openTrigger();

		hover(trigger);
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		trigger.click();
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
			expect(document.activeElement).toBe(item(screen.container, 'Folder A'));
		});
	});

	it('closes on a click that lands well after the hover-open', async () => {
		const { trigger } = await openTrigger();

		hover(trigger);
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});
		// Past the guard: a deliberate dismissal, not a follow-on.
		await new Promise((resolve) => setTimeout(resolve, CLICK_GUARD_MS + 100));

		trigger.click();
		await vi.waitFor(() => {
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
		});
	});

	it('moves focus into the flyout synchronously on a click-open', async () => {
		const { screen, trigger } = await openTrigger();

		trigger.click();

		// No waitFor and no flush: focus must already be inside the flyout when the
		// click handler returns, which is what "synchronously" means and what a
		// deferred (rAF) focus would fail.
		//
		// Scoped to the flyout rather than read through `item(container, …)`: the
		// flyout renders *inline*, inside the trigger row's own subtree, so the
		// trigger's `textContent` contains "Folder A" too and the container-wide
		// lookup can return the trigger itself.
		const flyout = flyoutFor(screen.container, trigger);
		const firstItem = Array.from(flyout.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
			(row) => row.textContent?.trim().includes('Folder A')
		);
		expect(firstItem).toBeDefined();
		expect(document.activeElement).toBe(firstItem);
	});
});

describe('DropdownMenuSubMenu theming slots', () => {
	it('exposes a themeable slot on the submenu indicator icon', async () => {
		const screen = await render(SubMenu, { props: { scenario: 'move' } });
		(screen.getByRole('button', { name: /Actions/ }).element() as HTMLElement).click();
		const trigger = item(screen.container, 'Move to');
		// The indicator-icon slot wraps the chevron affordance inside the trigger
		// row.
		expect(trigger.querySelector('.astryx-dropdown-menu-indicator-icon')).toBeInTheDocument();
	});
});
