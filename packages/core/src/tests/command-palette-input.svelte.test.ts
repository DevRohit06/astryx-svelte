/** PORTS: CommandPalette/CommandPaletteInput.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CommandPaletteInput from '$lib/components/command-palette/command-palette-input.svelte';
import InputProvider from './fixtures/command-palette-input-provider.svelte';

/**
 * Ported from Astryx's `CommandPalette/CommandPaletteInput.test.tsx`, all 13
 * `it` cases at the 0.5.0 pin, across its two describe blocks — 13 upstream, 13
 * here, none
 * dropped. There is no `displayName` case and no snapshot in the file.
 *
 * Runs in the **client** (real Chromium) project: the auto-focus path is a
 * `requestAnimationFrame` followed by a real `.focus()`, and the two dialog
 * cases need a real `<dialog>`.
 *
 * Upstream drives typing with `fireEvent.change`, which sets the value and fires
 * one synthetic event; `userEvent.fill` is the counterpart here and is closer to
 * a real user. The component wires `oninput` where upstream wires React's
 * `onChange` — the same native event on both sides, so the `onChange` prop still
 * fires alongside `onValueChange`, which is what case 6 pins.
 */

describe('CommandPaletteInput', () => {
	it('renders with default placeholder', async () => {
		const screen = await render(CommandPaletteInput);
		await expect.element(screen.getByPlaceholder('Search…')).toBeInTheDocument();
	});

	it('renders with custom placeholder', async () => {
		const screen = await render(CommandPaletteInput, {
			props: { placeholder: 'Type a command...' }
		});
		await expect.element(screen.getByPlaceholder('Type a command...')).toBeInTheDocument();
	});

	it('has combobox role', async () => {
		const screen = await render(CommandPaletteInput);
		await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('has an accessible name by default', async () => {
		const screen = await render(CommandPaletteInput);
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Search…');
	});

	it('uses the label prop as the accessible name', async () => {
		const screen = await render(CommandPaletteInput, { props: { label: 'Search commands' } });
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('aria-label', 'Search commands');
		// The label prop does not affect the visible placeholder
		await expect.element(input).toHaveAttribute('placeholder', 'Search…');
	});

	it('falls back to a custom placeholder for the accessible name', async () => {
		const screen = await render(CommandPaletteInput, {
			props: { placeholder: 'Type a command...' }
		});
		await expect
			.element(screen.getByRole('combobox'))
			.toHaveAttribute('aria-label', 'Type a command...');
	});

	it('lets a consumer-passed aria-label override the default', async () => {
		const screen = await render(CommandPaletteInput, {
			props: { label: 'Search commands', 'aria-label': 'Custom name' }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Custom name');
	});

	it('calls onValueChange when typing', async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();
		const screen = await render(CommandPaletteInput, { props: { onValueChange: handleChange } });

		await user.fill(screen.getByRole('combobox').element(), 'test');

		expect(handleChange).toHaveBeenCalledWith('test');
	});

	it('displays controlled value', async () => {
		const screen = await render(CommandPaletteInput, {
			props: { value: 'hello', onValueChange: () => {} }
		});
		await expect.element(screen.getByRole('combobox')).toHaveValue('hello');
	});

	it('forwards native onChange alongside onValueChange', async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();
		const handleNativeChange = vi.fn();

		const screen = await render(CommandPaletteInput, {
			props: { onValueChange: handleChange, onChange: handleNativeChange }
		});

		await user.fill(screen.getByRole('combobox').element(), 'x');

		expect(handleChange).toHaveBeenCalledWith('x');
		expect(handleNativeChange).toHaveBeenCalled();
	});

	it('has aria-expanded and aria-autocomplete', async () => {
		const screen = await render(CommandPaletteInput);
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
		await expect.element(input).toHaveAttribute('aria-autocomplete', 'list');
	});
});

describe('CommandPaletteInput dialog context', () => {
	it('does not auto-focus inside an inline dialog', async () => {
		const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
		const screen = await render(InputProvider, { props: { inDialog: true } });

		const input = screen.getByRole('combobox').element();
		// Give the rAF the auto-focus path would have used a chance to run, so a
		// regression could not pass merely by being measured too early.
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

		const inputFocusCalls = focusSpy.mock.contexts.filter((context) => context === input);
		expect(inputFocusCalls).toHaveLength(0);
		focusSpy.mockRestore();
	});

	it('auto-focuses outside an inline dialog', async () => {
		const screen = await render(InputProvider);

		// Auto-focus uses requestAnimationFrame — `expect.element` retries for it.
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
	});
});
