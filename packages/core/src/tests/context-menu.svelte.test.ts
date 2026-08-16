import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ContextMenuFixture from './fixtures/context-menu-fixture.svelte';

/**
 * Ported from Astryx's `ContextMenu/ContextMenu.test.tsx`.
 *
 * COUNTS, stated the way `date-input.svelte.test.ts` does — upstream total,
 * local total, and why they differ — because a header naming only an upstream
 * count goes stale on every upstream release by construction:
 *
 * - upstream at **0.3.0: 41** cases
 * - here: **32**
 *
 * The 32nd is 0.3.0's `closes the menu when Tab is pressed inside it`, ported
 * with the component change it covers (the APG menus-5 fix).
 *
 * The remaining **9** are a pre-existing coverage gap, NOT a deliberate drop,
 * and they are counted in port/todo.md's batch-17c coverage-gap list (`ContextMenu
 * 40→31`). Batch 18 deliberately closes only what its own changes need.
 *
 * A previous version of this header said "31 of its 33 cases" and explained a
 * 2-case DROP as blocked on the deferred `DropdownMenu` selectable trio, which
 * the tarball did not compile. **That trio landed in batch 17b** and the two
 * cases are simply unported now, so the claim had become false — the sixth
 * recurrence of _a header comment is an assertion and rots like one_.
 *
 * Standing translations, following `dropdown-menu.svelte.test.ts`:
 *
 * - Runs in the **client** (real Chromium) project, so upstream's `beforeEach`
 *   stub of `showPopover`/`hidePopover`/`:popover-open` is **gone**. Cases that
 *   assert on the *call* `vi.spyOn` the native method, which calls through.
 * - `getByRole(..., {hidden: true})` becomes a container `querySelector`: a
 *   closed popover is `display: none` in a real browser.
 * - `fireEvent.contextMenu` / `fireEvent.keyDown` become dispatched native
 *   events; `act()` disappears.
 * - The touch cases build a minimal `touchstart`/`touchmove` carrying only
 *   `touches`, which is all `useLongPress` reads — the same synthetic event
 *   `long-press.svelte.test.ts` uses. Only `setTimeout`/`clearTimeout` are
 *   faked, since Svelte schedules its own work on `queueMicrotask`.
 */

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

function contextMenuEvent(init: MouseEventInit = {}): MouseEvent {
	return new MouseEvent('contextmenu', { bubbles: true, cancelable: true, ...init });
}

/** A touch event carrying only `touches` — all `useLongPress` reads. */
function touchEvent(type: string, touches: { clientX: number; clientY: number }[]): Event {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'touches', { value: touches });
	return event;
}

/**
 * Let Svelte flush the effects opening the menu schedules — the document-level
 * Escape and outside-click listeners are registered by an `$effect` keyed on the
 * open state, so a synchronous Escape right after the right-click would arrive
 * before they exist. This is upstream's `act()`: React flushes effects inside
 * `fireEvent`, Svelte schedules them on the microtask queue.
 */
function flushEffects(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function keyDownOnDocument(init: KeyboardEventInit): void {
	document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('ContextMenu', () => {
	it('renders trigger children', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});
		await expect.element(screen.getByText('Right-click me')).toBeInTheDocument();
	});

	it('renders menu with role="menu"', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});
		expect(menuIn(screen.container)).toBeInTheDocument();
	});

	it('typeahead focuses the matching menu item (menus-11)', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Cut' }, { label: 'Copy' }, { label: 'Paste' }] } }
		});
		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		const menu = menuIn(screen.container);
		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
		expect(menuItem(screen.container, 'Paste')).toHaveFocus();
	});

	it('gives the menu an accessible name (menus-13)', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});
		// Defaults to "Context menu"; overridable via label.
		expect(menuIn(screen.container)).toHaveAttribute('aria-label', 'Context menu');
	});

	it('uses a custom label', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }], label: 'Row actions' } }
		});
		expect(menuIn(screen.container)).toHaveAttribute('aria-label', 'Row actions');
	});

	it('does not put aria-haspopup on the role-less trigger wrapper (menus-15)', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' } }
		});
		await expect.element(screen.getByTestId('ctx')).not.toHaveAttribute('aria-haspopup');
	});

	it('opens menu on right-click', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});
		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		expect(showSpy).toHaveBeenCalled();
	});

	it('closes on Escape even when opened without auto-focus', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});

		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		expect(showSpy).toHaveBeenCalled();
		await flushEffects();
		// Focus is not inside the menu, so the Escape path must be document-level.
		keyDownOnDocument({ key: 'Escape' });
		expect(hideSpy).toHaveBeenCalled();
	});

	it('closes the menu when Tab is pressed inside it (APG menu pattern)', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});

		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		expect(showSpy).toHaveBeenCalled();
		await flushEffects();
		// Upstream fires Tab on the menu itself; the handler is the menu's own
		// `onkeydown`, so the event has to originate inside it rather than on
		// `document` the way the Escape cases do.
		menuIn(screen.container).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
		);
		expect(hideSpy).toHaveBeenCalled();
	});

	it('ignores Escape during IME composition', async () => {
		const hideSpy = vi.spyOn(HTMLElement.prototype, 'hidePopover');
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});

		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		await flushEffects();
		keyDownOnDocument({ key: 'Escape', isComposing: true });
		expect(hideSpy).not.toHaveBeenCalled();
	});

	it('restores focus to the trigger on close', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] }, isTriggerButton: true }
		});

		const trigger = screen.getByRole('button', { name: 'Right-click me' }).element();
		(trigger as HTMLElement).focus();
		expect(trigger).toHaveFocus();

		trigger.dispatchEvent(contextMenuEvent());
		await flushEffects();
		keyDownOnDocument({ key: 'Escape' });
		expect(trigger).toHaveFocus();
	});

	it('prevents default context menu on right-click', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});

		const event = contextMenuEvent();
		const preventDefault = vi.spyOn(event, 'preventDefault');
		screen.getByText('Right-click me').element().dispatchEvent(event);
		expect(preventDefault).toHaveBeenCalled();
	});

	it('prevents default context menu on the opened menu container', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }] } }
		});

		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		const event = contextMenuEvent();
		const preventDefault = vi.spyOn(event, 'preventDefault');
		menuIn(screen.container).dispatchEvent(event);
		expect(preventDefault).toHaveBeenCalled();
	});

	it('does not open when isDisabled is true', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }], isDisabled: true } }
		});

		screen.getByText('Right-click me').element().dispatchEvent(contextMenuEvent());
		expect(showSpy).not.toHaveBeenCalled();
	});

	it('applies data-testid to trigger wrapper', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }], 'data-testid': 'my-context-menu' } }
		});
		await expect.element(screen.getByTestId('my-context-menu')).toBeInTheDocument();
	});

	it('opens from a keyboard-invoked contextmenu (Shift+F10 / Menu key)', async () => {
		const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' } }
		});
		const trigger = screen.getByTestId('ctx').element() as HTMLElement;
		// Anchor the trigger box so the rect fallback has a position to read.
		trigger.getBoundingClientRect = () =>
			({ left: 40, top: 10, bottom: 30, right: 100, width: 60, height: 20 }) as DOMRect;
		// Keyboard-initiated contextmenu: coords are (0,0) and detail is 0.
		trigger.dispatchEvent(contextMenuEvent({ clientX: 0, clientY: 0, detail: 0 }));
		expect(showSpy).toHaveBeenCalled();
	});

	describe('touch long-press', () => {
		beforeEach(() => {
			vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('opens on touch long-press', async () => {
			const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
			const screen = await render(ContextMenuFixture, {
				props: {
					props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' },
					triggerText: 'Long-press me'
				}
			});
			const trigger = screen.getByTestId('ctx').element() as HTMLElement;
			trigger.dispatchEvent(touchEvent('touchstart', [{ clientX: 20, clientY: 20 }]));
			// Not open until the long-press threshold elapses.
			expect(showSpy).not.toHaveBeenCalled();
			vi.advanceTimersByTime(500);
			expect(showSpy).toHaveBeenCalled();
		});

		it('cancels the long-press when the finger moves past the threshold', async () => {
			const showSpy = vi.spyOn(HTMLElement.prototype, 'showPopover');
			const screen = await render(ContextMenuFixture, {
				props: {
					props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' },
					triggerText: 'Long-press me'
				}
			});
			const trigger = screen.getByTestId('ctx').element() as HTMLElement;
			trigger.dispatchEvent(touchEvent('touchstart', [{ clientX: 20, clientY: 20 }]));
			// Move past MOVE_CANCEL_PX (10px) — treated as a scroll, not a press.
			trigger.dispatchEvent(touchEvent('touchmove', [{ clientX: 20, clientY: 40 }]));
			vi.advanceTimersByTime(500);
			expect(showSpy).not.toHaveBeenCalled();
		});
	});
});

describe('ContextMenu items', () => {
	it('renders items with labels', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Cut' }, { label: 'Copy' }] } }
		});
		expect(menuItem(screen.container, 'Cut')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Copy')).toBeInTheDocument();
	});

	it('calls onClick when item is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Cut', onClick: handleClick }] } }
		});

		menuItem(screen.container, 'Cut').click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('does not call onClick when disabled', async () => {
		const handleClick = vi.fn();
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Cut', onClick: handleClick, isDisabled: true }] } }
		});

		menuItem(screen.container, 'Cut').click();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('has aria-disabled when disabled', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Cut', isDisabled: true }] } }
		});
		expect(menuItem(screen.container, 'Cut')).toHaveAttribute('aria-disabled', 'true');
	});
});

describe('ContextMenu sections', () => {
	it('renders section with title', async () => {
		const screen = await render(ContextMenuFixture, {
			props: {
				props: {
					items: [{ type: 'section', title: 'Edit', items: [{ label: 'Cut' }, { label: 'Copy' }] }]
				}
			}
		});

		expect(screen.container.textContent).toContain('Edit');
		expect(menuItem(screen.container, 'Cut')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Copy')).toBeInTheDocument();
	});

	it('has role="group" with aria-label', async () => {
		const screen = await render(ContextMenuFixture, {
			props: {
				props: { items: [{ type: 'section', title: 'Edit', items: [{ label: 'Cut' }] }] }
			}
		});

		const group = screen.container.querySelector('[role="group"]');
		expect(group).toBeInTheDocument();
		expect(group).toHaveAttribute('aria-label', 'Edit');
	});
});

describe('ContextMenu dividers', () => {
	it('renders dividers between items', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { props: { items: [{ label: 'Cut' }, { type: 'divider' }, { label: 'Paste' }] } }
		});

		expect(menuItem(screen.container, 'Cut')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Paste')).toBeInTheDocument();
		expect(screen.container.querySelector('[role="separator"]')).toBeInTheDocument();
	});
});

describe('ContextMenu compound mode', () => {
	it('renders menuContent as menu items', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { compound: [{ label: 'Cut' }, { label: 'Copy' }] }
		});
		expect(menuItem(screen.container, 'Cut')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Copy')).toBeInTheDocument();
	});

	it('renders ContextMenuItem endContent', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { compound: [{ label: 'Cut', endContentTestid: 'shortcut' }] }
		});
		expect(screen.container.querySelector('[data-testid="shortcut"]')).toHaveTextContent('⌘X');
	});

	it('calls onClick when compound item is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await render(ContextMenuFixture, {
			props: { compound: [{ label: 'Cut', onClick: handleClick }] }
		});

		menuItem(screen.container, 'Cut').click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders dividers between compound items', async () => {
		const screen = await render(ContextMenuFixture, {
			props: { compound: [{ label: 'Cut' }, { divider: true }, { label: 'Paste' }] }
		});

		expect(menuItem(screen.container, 'Cut')).toBeInTheDocument();
		expect(menuItem(screen.container, 'Paste')).toBeInTheDocument();
		expect(screen.container.querySelector('[role="separator"]')).toBeInTheDocument();
	});

	describe('cursor anchor positioning (#3465)', () => {
		// The menu is anchored to a zero-size element placed at the cursor point
		// *inside the trigger*, so it is positioned relative to the trigger's
		// context (scroll-follow + auto-flip) rather than the viewport.
		function getCursorAnchor(trigger: HTMLElement): HTMLElement {
			const anchor = trigger.querySelector<HTMLElement>('[aria-hidden="true"]');
			if (!anchor) {
				throw new Error('cursor anchor not found');
			}
			return anchor;
		}

		it('renders a zero-size cursor anchor inside the trigger', async () => {
			const screen = await render(ContextMenuFixture, {
				props: { props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' } }
			});
			const anchor = getCursorAnchor(screen.getByTestId('ctx').element() as HTMLElement);
			expect(anchor.tagName).toBe('SPAN');
			// Carries an anchor-name so the menu can be anchored to it via CSS
			// anchor positioning (context mode), not fixed viewport coordinates.
			expect(anchor.style.anchorName).toMatch(/^--astryx-layer-/);
		});

		it('places the cursor anchor at the pointer position relative to the trigger', async () => {
			const screen = await render(ContextMenuFixture, {
				props: { props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' } }
			});
			const trigger = screen.getByTestId('ctx').element() as HTMLElement;
			trigger.getBoundingClientRect = () =>
				({ left: 100, top: 50, right: 300, bottom: 150, width: 200, height: 100 }) as DOMRect;
			// Pointer at viewport (170, 90) -> local trigger offset (70, 40).
			trigger.dispatchEvent(contextMenuEvent({ clientX: 170, clientY: 90, detail: 1 }));
			const anchor = getCursorAnchor(trigger);
			expect(anchor.style.left).toBe('70px');
			expect(anchor.style.top).toBe('40px');
		});

		it('anchors a keyboard-invoked menu to the trigger bottom-left', async () => {
			const screen = await render(ContextMenuFixture, {
				props: { props: { items: [{ label: 'Item 1' }], 'data-testid': 'ctx' } }
			});
			const trigger = screen.getByTestId('ctx').element() as HTMLElement;
			trigger.getBoundingClientRect = () =>
				({ left: 40, top: 10, right: 100, bottom: 30, width: 60, height: 20 }) as DOMRect;
			// Keyboard-initiated contextmenu: coords (0,0), detail 0 -> local (0, height).
			trigger.dispatchEvent(contextMenuEvent({ clientX: 0, clientY: 0, detail: 0 }));
			const anchor = getCursorAnchor(trigger);
			expect(anchor.style.left).toBe('0px');
			expect(anchor.style.top).toBe('20px');
		});
	});
});
