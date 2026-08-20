import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import IconButton from '$lib/components/icon-button/icon-button.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `IconButton/IconButton.test.tsx` at **v0.4.5**, ported case for case.
 *
 * The count is the contract: upstream declares **10** `it` blocks at this pin,
 * one of which is a standing drop, and **9** are here.
 *
 * Eight of these lived in `nav-icon.svelte.test.ts` until now — a file carrying
 * two upstream suites at once and therefore able to state a count against
 * neither. They move here whole, unchanged. `forwards the elevation prop
 * through to the underlying button` (upstream `IconButton.test.tsx:95`) had no
 * port at all and is new here.
 *
 * **One dropped case:**
 *
 * - `has displayName set` — Svelte's default export is a component constructor
 *   with no `displayName` surface, so there is nothing to assert against. The
 *   same reason `InteractiveRoleContext`'s `displayName` case was dropped.
 *
 * **Two counterparts and one restatement. None of the three is a dropped case:**
 *
 * - `forwards ref correctly` becomes the attachment a consumer passes through
 *   the rest props. Svelte has no `ref`; the attachment receives the element
 *   itself, so this checks *more* than upstream's `toBeInstanceOf`
 *   (`HTMLButtonElement`) does — it proves the node handed over is the button
 *   in the container, not merely that some button reached the callback.
 * - Upstream's `icon={<span data-testid="icon">⚙</span>}` is a `Snippet` here,
 *   which can only be authored in a template; `slot-probe.svelte` supplies it.
 * - `is disabled when isDisabled is true` clicks with `button.click()` rather
 *   than `userEvent.click`. Upstream's runs against jsdom, which dispatches at
 *   whatever it is pointed at; here `userEvent` is Playwright, which waits for
 *   the element to become actionable and so hangs on a disabled control
 *   forever. `button.click()` is the same question — a disabled form control
 *   runs no activation behaviour and fires no click — asked in the only way
 *   this runner allows.
 *
 * Runs in the **client** (real Chromium) project.
 */

describe('IconButton', () => {
	const iconOnly = (rest: Record<string | symbol, unknown> = {}) => ({
		component: IconButton,
		slot: 'icon',
		text: '⚙',
		testid: 'icon',
		rest: { label: 'Settings', ...rest }
	});

	it('renders as an icon-only button with aria-label', async () => {
		const screen = await render(SlotProbe, { props: iconOnly() });
		const button = screen.container.querySelector('button')!;
		expect(button).toHaveAttribute('aria-label', 'Settings');
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeNull();
	});

	it('does not render label as visible text', async () => {
		const screen = await render(SlotProbe, { props: iconOnly() });
		expect(screen.container.querySelector('button')!.textContent).not.toContain('Settings');
	});

	it('forwards variant prop', async () => {
		const screen = await render(SlotProbe, {
			props: iconOnly({ label: 'Delete', variant: 'destructive' })
		});
		await expect.element(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});

	it('forwards size prop', async () => {
		const screen = await render(SlotProbe, { props: iconOnly({ label: 'Add', size: 'sm' }) });
		await expect.element(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
	});

	it('handles click events', async () => {
		const onclick = vi.fn();
		const screen = await render(SlotProbe, { props: iconOnly({ label: 'Close', onclick }) });
		await userEvent.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('is disabled when isDisabled is true', async () => {
		const onclick = vi.fn();
		const screen = await render(SlotProbe, {
			props: iconOnly({ label: 'Close', isDisabled: true, onclick })
		});
		const button = screen.container.querySelector('button')!;
		expect(button).toBeDisabled();
		button.click();
		expect(onclick).not.toHaveBeenCalled();
	});

	it('shows loading state', async () => {
		const screen = await render(SlotProbe, { props: iconOnly({ label: 'Save', isLoading: true }) });
		expect(screen.container.querySelector('button')).toBeDisabled();
	});

	// Counterpart to upstream's `forwards ref correctly`.
	it('hands the button element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, {
			props: iconOnly({ label: 'Action', [createAttachmentKey()]: attached })
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('button'));
	});

	// Upstream's `has displayName set` is dropped — see the header.

	it('forwards the elevation prop through to the underlying button', async () => {
		const classFor = async (elevation: 'none' | 'med') => {
			const screen = await render(SlotProbe, { props: iconOnly({ label: 'Add', elevation }) });
			return screen.container.querySelector('button')!.className;
		};
		// A raised FAB must render differently from the default flat icon button.
		expect(await classFor('med')).not.toBe(await classFor('none'));
	});
});
