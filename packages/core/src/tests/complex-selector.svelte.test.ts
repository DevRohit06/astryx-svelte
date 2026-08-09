import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CloseFixture from './fixtures/complex-selector-close.svelte';
import FruitFixture, { type FruitValue } from './fixtures/complex-selector-fruit.svelte';

/**
 * Astryx's `ComplexSelector/ComplexSelector.test.tsx`, ported case for case —
 * **3 upstream cases** in its single `describe('ComplexSelector')` block, 3
 * here, none dropped and none added. There is no ref-callback and no
 * `displayName` case in the file, so nothing is React-only.
 *
 * Runs in the **client (real Chromium)** project, for the reason
 * `selector.svelte.test.ts` and `popover.svelte.test.ts` do: the popup opens
 * through the native Popover API and the focus restore needs real focus.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited.
 * - `userEvent` comes from `vitest/browser`.
 * - Upstream's `h = {hidden: true}` companion is **gone**. It exists because
 *   jsdom leaves a stubbed popover `display: none`, so every node inside it is
 *   hidden from the accessibility tree. Chromium opens the popover for real, so
 *   the grid cells and the `Done` button are genuinely visible once the trigger
 *   has been clicked, and asking for hidden nodes would query for the opposite
 *   of what the assertion is about.
 * - `waitFor` is `vi.waitFor`.
 * - Both content shapes go through a fixture (`complex-selector-fruit.svelte`,
 *   `complex-selector-close.svelte`): the content is a parameterised snippet
 *   and a snippet has to be declared in markup, so a case cannot author one
 *   inline the way upstream authors JSX.
 *
 * `act()` has no counterpart and is not needed here: upstream never reaches for
 * it in this file, a `$state` write flushes on its own, and `expect.element`
 * retries.
 */

const APPLE_RIPE: FruitValue = { fruit: 'Apple', ripeness: 'Ripe' };

describe('ComplexSelector', () => {
	it('renders custom content with value and commits through onChange', async () => {
		const onChange = vi.fn();

		const screen = await render(FruitFixture, {
			props: { value: APPLE_RIPE, onChange }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend' }));
		await userEvent.click(screen.getByRole('gridcell', { name: 'Banana Juicy' }));

		expect(onChange).toHaveBeenCalledWith({ fruit: 'Banana', ripeness: 'Juicy' });
		await expect
			.element(screen.getByRole('button', { name: 'Fruit blend' }))
			.toHaveAttribute('aria-expanded', 'false');
	});

	it('runs changeAction through the provided onChange helper', async () => {
		const onChange = vi.fn();
		const changeAction = vi.fn();

		const screen = await render(FruitFixture, {
			props: { value: APPLE_RIPE, onChange, changeAction }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend' }));
		await userEvent.click(screen.getByRole('gridcell', { name: 'Banana Crisp' }));

		expect(onChange).toHaveBeenCalledWith({ fruit: 'Banana', ripeness: 'Crisp' });
		await vi.waitFor(() => {
			expect(changeAction).toHaveBeenCalledWith({
				fruit: 'Banana',
				ripeness: 'Crisp'
			});
		});
	});

	it('passes a close helper to composed content', async () => {
		const screen = await render(CloseFixture);

		const trigger = screen.getByRole('button', { name: 'Fruit blend' });
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		await userEvent.click(screen.getByRole('button', { name: 'Done' }));
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});
