import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Slots from './fixtures/command-palette-slots.svelte';
import ItemInDialog from './fixtures/command-palette-item-in-dialog.svelte';

/**
 * Ported from Astryx's `CommandPalette/CommandPaletteItem.test.tsx`, all 11 `it`
 * cases.
 *
 * Runs in the **client** (real Chromium) project: three cases turn on
 * `scrollIntoView`, and two of those need a real `<dialog>` for the inline
 * branch. Upstream's `scrollIntoView` save/restore on `HTMLElement.prototype` is
 * reproduced verbatim — Chromium *does* implement it, so without the stub the
 * scroll cases would silently pass on a no-op call rather than a spied one.
 */

const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
	HTMLElement.prototype,
	'scrollIntoView'
);

function mockScrollIntoView(): ReturnType<typeof vi.fn> {
	const scrollIntoView = vi.fn();
	Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
		configurable: true,
		value: scrollIntoView
	});
	return scrollIntoView;
}

afterEach(() => {
	if (scrollIntoViewDescriptor) {
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewDescriptor);
	} else {
		delete (HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
	}
});

describe('CommandPaletteItem', () => {
	it('renders children', async () => {
		const screen = await render(Slots, { props: { render: 'item', items: ['Test Item'] } });
		await expect.element(screen.getByText('Test Item', { exact: true })).toBeInTheDocument();
	});

	it('has option role', async () => {
		const screen = await render(Slots, { props: { render: 'item' } });
		await expect.element(screen.getByRole('option')).toBeInTheDocument();
	});

	it('calls onSelect when clicked', async () => {
		const user = userEvent.setup();
		const handleSelect = vi.fn();
		const screen = await render(Slots, {
			props: { render: 'item', value: 'test', onSelect: handleSelect }
		});
		await user.click(screen.getByRole('option').element());
		expect(handleSelect).toHaveBeenCalledWith('test');
	});

	it('does not call onSelect when disabled', async () => {
		const handleSelect = vi.fn();
		const screen = await render(Slots, {
			props: { render: 'item', value: 'test', onSelect: handleSelect, isDisabled: true }
		});
		// A direct dispatch, not `userEvent`: Playwright's actionability check
		// refuses to click an `aria-disabled` element and times out instead, so a
		// real click cannot reach the handler this case exists to prove is guarded.
		// This is exactly what upstream's `fireEvent.click` does — dispatch without
		// actionability — so the case tests the same thing on both sides. The
		// enabled case above keeps the real `userEvent` click.
		screen
			.getByRole('option')
			.element()
			.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handleSelect).not.toHaveBeenCalled();
	});

	it('sets aria-disabled when disabled', async () => {
		const screen = await render(Slots, {
			props: { render: 'item', value: 'test', isDisabled: true }
		});
		await expect.element(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true');
	});

	it('sets aria-selected when selected (not highlighted)', async () => {
		const screen = await render(Slots, {
			props: { render: 'item', value: 'test', isSelected: true }
		});
		await expect.element(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
	});

	it('does not set aria-selected when only highlighted', async () => {
		// Highlight is visual only — aria-activedescendant on the input conveys
		// keyboard focus, so aria-selected must not be set on highlight alone.
		const screen = await render(Slots, {
			props: { render: 'item', value: 'test', isHighlighted: true }
		});
		await expect.element(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
	});

	it('scrolls highlighted items into view by default', async () => {
		const scrollIntoView = mockScrollIntoView();

		await render(Slots, { props: { render: 'item', value: 'test', isHighlighted: true } });

		await vi.waitFor(() => {
			expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
		});
	});

	it('does not scroll initially highlighted items in inline dialogs', async () => {
		const scrollIntoView = mockScrollIntoView();

		await render(ItemInDialog, { props: { isHighlighted: true } });

		expect(scrollIntoView).not.toHaveBeenCalled();
	});

	it('scrolls inline dialog items after highlight changes', async () => {
		const scrollIntoView = mockScrollIntoView();

		const screen = await render(ItemInDialog, { props: { isHighlighted: false } });
		await screen.rerender({ isHighlighted: true });

		await vi.waitFor(() => {
			expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
		});
	});

	it('sets data-value attribute', async () => {
		const screen = await render(Slots, { props: { render: 'item', value: 'my-value' } });
		await expect.element(screen.getByRole('option')).toHaveAttribute('data-value', 'my-value');
	});
});
