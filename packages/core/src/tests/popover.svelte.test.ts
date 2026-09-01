/** PORTS: Popover/Popover.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Popover from './fixtures/popover-fixture.svelte';
import PopoverInDialog from './fixtures/popover-in-dialog.svelte';

/**
 * Ported from Astryx's `Popover/Popover.test.tsx` — **23 of its 24 cases at the
 * 0.5.0 pin**, across its three describe blocks (`Popover`, `dismiss controls`,
 * `focus restoration`).
 *
 * Unported: `dismiss controls` → `dismisses on Escape pressed inside a
 * roving-focus list`, which 0.5.0 added. Nothing is skipped. (The header read
 * "23 upstream cases, 23 here … nothing is dropped" at the v0.3.0 pin, where 23
 * was the whole suite.)
 *
 * (Through the previous revision, case #21 — the host-`Dialog` Escape
 * fall-through — was an `it.skip` with an **empty body**: present and counted,
 * but asserting nothing, so it could not fail. `Dialog` has been ported since
 * the skip was written, so the case is now written out in full against
 * `fixtures/popover-in-dialog.svelte` and passes.)
 *
 * Counts re-derived from the v0.3.0 tag, not carried forward: v0.2.0 had 21, and
 * 0.3.0's `role`/`isModal` pair added the two wrapper-semantics cases below
 * ('can render a neutral wrapper when content owns its role', 'can render a
 * non-modal dialog wrapper').
 *
 * Upstream's top-level `beforeAll`/`afterAll` block is gone, exactly as it is in
 * `tooltip.svelte.test.ts` and `hover-card.svelte.test.ts` and for the same
 * reason: it exists only to give jsdom a Popover API — `showPopover`/
 * `hidePopover` backed by a `WeakMap`, plus a `matches` override so
 * `:popover-open` answers from that map. These cases run in a real Chromium,
 * which implements all of it natively, and keeping the stub would substitute a
 * model of the thing under test for the thing itself.
 *
 * The `dismiss controls` block's own `beforeAll` (stubbing
 * `HTMLDialogElement.prototype.showModal`/`close`) is dropped with it: the one
 * case that needed it is the host-`Dialog` fall-through, and a real Chromium
 * implements both methods natively.
 *
 * The recurring translations, each following a pattern the earlier suites set:
 *
 * - `render` from `vitest-browser-svelte` is async — always awaited.
 * - `fireEvent.click(trigger)` becomes a native `trigger.click()`; the port
 *   wires the trigger with a real `click` listener, and a real browser routes
 *   `.click()` through it.
 * - `fireEvent.keyDown(document, {key: 'Escape'})` becomes a dispatched
 *   `KeyboardEvent` on `document`, which is where `useFocusTrap` listens.
 * - `fireEvent.keyDown(trigger, {key: 'Enter'})` becomes a dispatched
 *   `KeyboardEvent` on the trigger, which is where the port binds its
 *   `role="button"` keydown handler.
 * - `getByRole('dialog', {hidden: true})` becomes a container `querySelector`,
 *   as `hover-card`/`tooltip` do — a closed popover is `display: none` in a real
 *   browser, so a role query would have to opt into hidden nodes to see it.
 * - `act()` has no counterpart — a `$state` write flushes on its own and
 *   `expect.element` retries until it has.
 */

function escape(target: EventTarget): void {
	target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

describe('Popover', () => {
	it('renders trigger element', async () => {
		const screen = await render(Popover, {
			props: { label: 'Test popover', triggerLabel: 'Open' }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Open', exact: true }))
			.toBeInTheDocument();
	});

	it('sets aria-haspopup on trigger', async () => {
		const screen = await render(Popover, { props: { label: 'Test', triggerLabel: 'Trigger' } });
		const trigger = screen.getByRole('button', { name: 'Trigger', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');
	});

	it('sets aria-expanded=false initially', async () => {
		const screen = await render(Popover, { props: { label: 'Test', triggerLabel: 'Trigger' } });
		const trigger = screen.getByRole('button', { name: 'Trigger', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens on click and updates aria-expanded', async () => {
		const screen = await render(Popover, { props: { label: 'Test', triggerLabel: 'Open' } });
		const trigger = screen.getByRole('button', { name: 'Open', exact: true });
		(trigger.element() as HTMLElement).click();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('renders popover content with role=dialog', async () => {
		const screen = await render(Popover, {
			props: { label: 'Greeting', contentText: 'Hello', triggerLabel: 'Open' }
		});
		// The dialog is inside a popover element — hidden until shown but present
		// in the DOM, so a container query rather than getByRole (see the header).
		const dialog = screen.container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute('aria-label', 'Greeting');
	});

	it('can render a neutral wrapper when content owns its role', async () => {
		const screen = await render(Popover, {
			props: {
				role: 'none',
				contentVariant: 'menu',
				contentText: 'Menu content',
				label: 'Actions',
				triggerLabel: 'Open'
			}
		});
		const trigger = screen.getByRole('button', { name: 'Open', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'true');
		expect(screen.container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
		expect(screen.container.querySelector('[role="menu"]')).toHaveAttribute(
			'aria-label',
			'Actions'
		);
	});

	it('can render a non-modal dialog wrapper', async () => {
		const screen = await render(Popover, {
			props: {
				role: 'dialog',
				isModal: false,
				contentText: 'Hello',
				label: 'Greeting',
				triggerLabel: 'Open'
			}
		});
		const dialog = screen.container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();
		expect(dialog).not.toHaveAttribute('aria-modal');
	});

	it('calls onOpenChange when opened', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Popover, {
			props: { label: 'Test', onOpenChange, triggerLabel: 'Open' }
		});
		(screen.getByRole('button', { name: 'Open', exact: true }).element() as HTMLElement).click();
		await vi.waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(true);
		});
	});

	it('does not open when isEnabled is false', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Popover, {
			props: { label: 'Test', isEnabled: false, onOpenChange, triggerLabel: 'Open' }
		});
		(screen.getByRole('button', { name: 'Open', exact: true }).element() as HTMLElement).click();
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('renders with data-testid', async () => {
		const screen = await render(Popover, {
			props: { label: 'Test', 'data-testid': 'my-popover', triggerLabel: 'Open' }
		});
		await expect.element(screen.getByTestId('my-popover')).toBeInTheDocument();
	});

	it('supports anchorRef sibling mode', async () => {
		const screen = await render(Popover, {
			props: { label: 'Sibling', triggerVariant: 'anchor-ref', triggerLabel: 'Anchor' }
		});
		const anchor = screen.getByRole('button', { name: 'Anchor', exact: true });
		await expect.element(anchor).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(anchor).toHaveAttribute('aria-expanded', 'false');
	});

	it('finds button inside wrapper and attaches ARIA', async () => {
		const screen = await render(Popover, {
			props: { label: 'Test', triggerVariant: 'nested', triggerLabel: 'Nested button' }
		});
		const button = screen.getByRole('button', { name: 'Nested button', exact: true });
		await expect.element(button).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('finds role="button" elements and attaches ARIA', async () => {
		const screen = await render(Popover, {
			props: { label: 'Test', triggerVariant: 'role-button', triggerLabel: 'Custom trigger' }
		});
		const trigger = screen.getByRole('button', { name: 'Custom trigger', exact: true });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens on click for role="button" elements', async () => {
		const screen = await render(Popover, {
			props: { label: 'Test', triggerVariant: 'role-button', triggerLabel: 'Custom trigger' }
		});
		const trigger = screen.getByRole('button', { name: 'Custom trigger', exact: true });
		(trigger.element() as HTMLElement).click();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('opens on Enter/Space for role="button" elements', async () => {
		const screen = await render(Popover, {
			props: { label: 'Test', triggerVariant: 'role-button', triggerLabel: 'Custom trigger' }
		});
		const trigger = screen.getByRole('button', { name: 'Custom trigger', exact: true });
		trigger.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('warns in dev when children have no button', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Popover, {
			props: { label: 'Test', triggerVariant: 'not-button', triggerLabel: 'Not a button' }
		});
		await vi.waitFor(() => {
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('must contain a <button> or [role="button"]')
			);
		});
		warnSpy.mockRestore();
	});

	describe('dismiss controls', () => {
		it('dismisses on Escape by default', async () => {
			const screen = await render(Popover, { props: { label: 'Test', triggerLabel: 'Open' } });
			const trigger = screen.getByRole('button', { name: 'Open', exact: true });
			(trigger.element() as HTMLElement).click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

			escape(document);
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('stays open on Escape when hasEscapeDismiss is false', async () => {
			const screen = await render(Popover, {
				props: {
					label: 'Test',
					hasLightDismiss: false,
					hasEscapeDismiss: false,
					triggerLabel: 'Open'
				}
			});
			const trigger = screen.getByRole('button', { name: 'Open', exact: true });
			(trigger.element() as HTMLElement).click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

			escape(document);
			// Give any (incorrect) dismiss a chance to run before asserting it stayed.
			await new Promise((resolve) => setTimeout(resolve, 20));
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('still dismisses on Escape when only light dismiss is off', async () => {
			const screen = await render(Popover, {
				props: { label: 'Test', hasLightDismiss: false, triggerLabel: 'Open' }
			});
			const trigger = screen.getByRole('button', { name: 'Open', exact: true });
			(trigger.element() as HTMLElement).click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

			escape(document);
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('switches to popover="manual" when hasLightDismiss is false', async () => {
			const auto = await render(Popover, { props: { label: 'Test', triggerLabel: 'Open' } });
			(auto.getByRole('button', { name: 'Open', exact: true }).element() as HTMLElement).click();
			expect(auto.container.querySelector('[popover]')).toHaveAttribute('popover', 'auto');
			auto.unmount();

			const manual = await render(Popover, {
				props: { label: 'Test', hasLightDismiss: false, triggerLabel: 'Open' }
			});
			(manual.getByRole('button', { name: 'Open', exact: true }).element() as HTMLElement).click();
			expect(manual.container.querySelector('[popover]')).toHaveAttribute('popover', 'manual');
		});

		// Upstream's `beforeAll` for this block (stubbing HTMLDialogElement
		// showModal/close) is omitted — a real Chromium implements both natively.
		it('lets Escape fall through to a host Dialog when fully opted out', async () => {
			const onDialogOpenChange = vi.fn();
			const screen = await render(PopoverInDialog, { props: { onDialogOpenChange } });
			const trigger = screen
				.getByRole('button', { name: 'Open tip', exact: true })
				.element() as HTMLElement;
			trigger.click();
			await expect
				.element(screen.getByRole('button', { name: 'Open tip', exact: true }))
				.toHaveAttribute('aria-expanded', 'true');

			// The Dialog listens for Escape on the dialog element, so fire from a
			// node inside it. The popover registers no Escape handler, so
			// hasActiveFocusTrapEscape() is false and the Dialog handles the press
			// while the popover itself stays open.
			escape(trigger);
			expect(onDialogOpenChange).toHaveBeenCalledWith(false);
			expect(trigger).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('focus restoration', () => {
		it('returns focus to the trigger when closed via Escape', async () => {
			const screen = await render(Popover, {
				props: {
					label: 'Test',
					contentVariant: 'inside-button',
					contentText: 'Inside',
					triggerLabel: 'Open'
				}
			});
			const trigger = screen
				.getByRole('button', { name: 'Open', exact: true })
				.element() as HTMLElement;
			trigger.focus();
			expect(trigger).toHaveFocus();

			trigger.click();
			await expect
				.element(screen.getByRole('button', { name: 'Open', exact: true }))
				.toHaveAttribute('aria-expanded', 'true');

			// Move focus into the open popover, as a keyboard user would.
			const inside = screen.getByTestId('inside-content').element();
			inside.focus();
			expect(inside).toHaveFocus();

			escape(document);
			await expect
				.element(screen.getByRole('button', { name: 'Open', exact: true }))
				.toHaveAttribute('aria-expanded', 'false');
			await vi.waitFor(() => {
				expect(document.activeElement).toBe(trigger);
			});
		});

		it('returns focus to the trigger on light dismiss', async () => {
			const screen = await render(Popover, {
				props: {
					label: 'Test',
					contentVariant: 'inside-button',
					contentText: 'Inside',
					triggerLabel: 'Open'
				}
			});
			const trigger = screen
				.getByRole('button', { name: 'Open', exact: true })
				.element() as HTMLElement;
			trigger.focus();

			trigger.click();
			await expect
				.element(screen.getByRole('button', { name: 'Open', exact: true }))
				.toHaveAttribute('aria-expanded', 'true');

			const inside = screen.getByTestId('inside-content').element();
			inside.focus();
			expect(inside).toHaveFocus();

			// Simulate the browser's light dismiss for popover="auto": clicking
			// outside fires a `toggle` event with newState "closed".
			const popoverEl = screen.container.querySelector('[popover]');
			expect(popoverEl).not.toBeNull();
			const toggleEvent = new Event('toggle');
			Object.defineProperty(toggleEvent, 'newState', { value: 'closed' });
			popoverEl!.dispatchEvent(toggleEvent);

			await expect
				.element(screen.getByRole('button', { name: 'Open', exact: true }))
				.toHaveAttribute('aria-expanded', 'false');
			await vi.waitFor(() => {
				expect(document.activeElement).toBe(trigger);
			});
		});
	});
});
