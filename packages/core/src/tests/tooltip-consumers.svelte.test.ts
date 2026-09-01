/**
 * PORTS: Button/Button.test.tsx
 * PORTS: StatusDot/StatusDot.test.tsx
 * PORTS: Text/Text.test.tsx
 * PORTS: Heading/Heading.test.tsx
 */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Button from '$lib/components/button/button.svelte';
import StatusDot from '$lib/components/status-dot/status-dot.svelte';
import TruncatedText from './fixtures/truncated-text.svelte';

/**
 * The tooltip-path cases from three upstream suites — `Button`, `StatusDot` and
 * `Text`/`Heading` — gathered here because that is what they have in common:
 * each one verifies a debt that `Tooltip` landing retired. They belong in the
 * per-component suites and should be folded into them when those are ported
 * whole; keeping them in a file named after a component would claim that suite
 * is done when only this slice of it is.
 *
 * **`Timestamp`'s five keyboard-reachability cases have been folded out**, as
 * that rule prescribes: `src/tests/timestamp.svelte.test.ts` now ports upstream's
 * whole `Timestamp.test.tsx`, and they live there. Nothing was dropped in the
 * move.
 */

describe('Button — tooltip', () => {
	it('uses aria-disabled instead of disabled when tooltip is present and button is disabled', async () => {
		const screen = await render(Button, {
			props: { label: 'Test', tooltip: 'Reason disabled', isDisabled: true }
		});
		const button = screen.container.querySelector('button')!;
		// Should NOT have native disabled (so it stays focusable for the tooltip)
		expect(button).not.toHaveAttribute('disabled');
		expect(button).toHaveAttribute('aria-disabled', 'true');
	});

	it('does not fire handlers when aria-disabled via tooltip', async () => {
		const onclick = vi.fn();
		const screen = await render(Button, {
			props: { label: 'Test', tooltip: 'Reason disabled', isDisabled: true, onclick }
		});
		// Dispatched rather than driven through the locator: Playwright's
		// actionability check reads `aria-disabled` as "not enabled" and refuses to
		// click at all, which would assert its heuristic instead of our guard. The
		// point of the case is that a click that *does* reach the button is
		// swallowed by `handleClick`.
		screen.container.querySelector('button')!.click();
		expect(onclick).not.toHaveBeenCalled();
	});

	it('suppresses activation keys but passes other keys when aria-disabled via tooltip', async () => {
		const onkeydown = vi.fn();
		const screen = await render(Button, {
			props: { label: 'Test', tooltip: 'Reason disabled', isDisabled: true, onkeydown }
		});
		const button = screen.container.querySelector('button')!;
		button.focus();

		await userEvent.keyboard('{Enter}');
		// Activation keys (Enter) should be suppressed
		expect(onkeydown).not.toHaveBeenCalled();

		// Non-activation keys (Escape) should reach the consumer handler
		await userEvent.keyboard('{Escape}');
		expect(onkeydown).toHaveBeenCalledTimes(1);
	});
});

describe('StatusDot — tooltip', () => {
	it('renders with tooltip', async () => {
		const screen = await render(StatusDot, {
			props: { variant: 'success', label: 'Online', tooltip: 'Online' }
		});
		await expect
			.element(screen.getByRole('img', { name: 'Online', exact: true }))
			.toBeInTheDocument();
	});
});

describe('Text / Heading — truncation tooltip', () => {
	it('accepts hasTruncateTooltip=false to disable tooltip', async () => {
		const screen = await render(TruncatedText, {
			props: { maxLines: 1, hasTruncateTooltip: false, content: 'No tooltip' }
		});
		await expect.element(screen.getByText('No tooltip', { exact: true })).toBeInTheDocument();
	});

	it('accepts hasTruncateTooltip=false to disable tooltip (Heading)', async () => {
		const screen = await render(TruncatedText, {
			props: { as: 'heading', maxLines: 1, hasTruncateTooltip: false, content: 'No tooltip' }
		});
		await expect.element(screen.getByText('No tooltip', { exact: true })).toBeInTheDocument();
	});
});
