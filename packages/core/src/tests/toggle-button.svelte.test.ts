import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ToggleButtonProbe from './fixtures/toggle-button-probe.svelte';
import ToggleButtonGroupProbe from './fixtures/toggle-button-group-probe.svelte';
import { cssIn, forcedColorsCssIn } from './forced-colors.js';

/**
 * Astryx's `ToggleButton/ToggleButton.test.tsx`, ported case for case.
 *
 * The recount is the contract: upstream has **26** `it` cases at the 0.5.0 pin across
 * four describe blocks — `ToggleButton` (18), `ToggleButtonGroup (single)` (4),
 * `ToggleButtonGroup (multiple)` (3), `forced colors` (1, new at 0.3.0). All 26
 * are ported here; none dropped.
 *
 * Upstream has **no** `displayName` case and **no** `ref`-forwarding case, so
 * neither of this port's usual drops/counterparts applies — nothing is absent.
 *
 * `ToggleButton`'s `icon`/`pressedIcon`/`children` are React elements upstream
 * passes inline; here every standalone case renders through
 * `toggle-button-probe.svelte`, which describes them as props. The two group
 * blocks render through `toggle-button-group-probe.svelte`, which holds the
 * group value in `$state` and commits on change — upstream's `useState`.
 *
 * `aria-pressed` is a boolean upstream serialises to the strings "true"/"false";
 * the assertions read those strings, unchanged.
 *
 * `act()` has no counterpart: a `$state` write flushes on its own and
 * `expect.element` retries until the DOM reflects it. Upstream's `act`-wrapped
 * settles (cases 14–16) become resolving the deferred promise and awaiting the
 * DOM to clear `aria-busy`. Upstream's `fireEvent.click` (case 16) is delivered
 * as a native `.click()`, its plain trusted-free DOM dispatch.
 */

const noop = (): void => {};

// =============================================================================
// ToggleButton — Standalone
// =============================================================================

describe('ToggleButton', () => {
	// 1
	it('renders with label as visible text', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: false, onPressedChange: noop }
		});
		await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
	});

	// 2
	it('renders children instead of label when provided', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Toggle bold',
				isPressed: false,
				onPressedChange: noop,
				childrenText: 'Custom content'
			}
		});
		await expect.element(screen.getByRole('button')).toHaveTextContent('Custom content');
	});

	// 3
	it('renders icon-only button with aria-label', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Bold',
				isPressed: false,
				onPressedChange: noop,
				hasIcon: true,
				iconTestid: 'icon',
				iconText: 'B',
				isIconOnly: true
			}
		});
		const button = screen.getByRole('button', { name: 'Bold' });
		await expect.element(button).toHaveAttribute('aria-label', 'Bold');
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	// 4
	it('sets aria-pressed=false when not pressed', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: false, onPressedChange: noop }
		});
		await expect.element(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
	});

	// 5
	it('sets aria-pressed=true when pressed', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: true, onPressedChange: noop }
		});
		await expect.element(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
	});

	// 6
	it('calls onPressedChange with true when clicking unpressed button', async () => {
		const handleChange = vi.fn();
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: false, onPressedChange: handleChange }
		});
		await userEvent.click(screen.getByRole('button'));
		expect(handleChange).toHaveBeenCalledWith(true, expect.anything());
	});

	// 7
	it('calls onPressedChange with false when clicking pressed button', async () => {
		const handleChange = vi.fn();
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: true, onPressedChange: handleChange }
		});
		await userEvent.click(screen.getByRole('button'));
		expect(handleChange).toHaveBeenCalledWith(false, expect.anything());
	});

	// 8
	it('renders pressedIcon when pressed', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: true,
				onPressedChange: noop,
				hasIcon: true,
				iconTestid: 'outline-icon',
				iconText: '♡',
				pressedIconTestid: 'filled-icon',
				pressedIconText: '♥',
				isIconOnly: true
			}
		});
		await expect.element(screen.getByTestId('filled-icon')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-testid="outline-icon"]')).toBeNull();
	});

	// 9
	it('renders icon when not pressed even if pressedIcon provided', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: false,
				onPressedChange: noop,
				hasIcon: true,
				iconTestid: 'outline-icon',
				iconText: '♡',
				pressedIconTestid: 'filled-icon',
				pressedIconText: '♥',
				isIconOnly: true
			}
		});
		await expect.element(screen.getByTestId('outline-icon')).toBeInTheDocument();
		expect(screen.container.querySelector('[data-testid="filled-icon"]')).toBeNull();
	});

	// 10
	it('does not fire events when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Bold',
				isPressed: false,
				onPressedChange: handleChange,
				isDisabled: true
			}
		});
		// A native `disabled` button is not actionable to Playwright's userEvent;
		// upstream's `user.click` reaches the guard because React attaches its own
		// listener. The native `.click()` is the equivalent trusted-free dispatch,
		// and the browser drops it on a disabled button just as the component would.
		(screen.getByRole('button').element() as HTMLButtonElement).click();
		expect(handleChange).not.toHaveBeenCalled();
	});

	// 11
	it('renders width reservation element for label text', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: false, onPressedChange: noop }
		});
		const button = screen.getByRole('button').element() as HTMLButtonElement;
		const hiddenSpan = button.querySelector('[aria-hidden="true"]');
		expect(hiddenSpan).not.toBeNull();
		expect(hiddenSpan).toHaveTextContent('Bold');
	});

	// 12
	it('does not render width reservation for icon-only buttons', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Bold',
				isPressed: false,
				onPressedChange: noop,
				hasIcon: true,
				isIconOnly: true
			}
		});
		const button = screen.getByRole('button').element() as HTMLButtonElement;
		const hiddenSpan = button.querySelector('[aria-hidden="true"]');
		expect(hiddenSpan).toBeNull();
	});

	// 13
	it('passes data-testid through', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Bold',
				isPressed: false,
				onPressedChange: noop,
				'data-testid': 'bold-toggle'
			}
		});
		await expect.element(screen.getByTestId('bold-toggle')).toBeInTheDocument();
	});

	// 14
	it('shows the optimistic pressed state and stays interruptible while pending', async () => {
		let resolveAction: (() => void) | undefined;
		const pressedChangeAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);

		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: false,
				onPressedChange: noop,
				pressedChangeAction
			}
		});

		const button = screen.getByRole('button', { name: 'Favorite' });
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');

		await userEvent.click(button);

		// The optimistic state flips immediately and the spinner shows via
		// aria-busy, but the button is never disabled — it stays clickable so the
		// action can be interrupted by another click.
		expect(pressedChangeAction).toHaveBeenCalledWith(true);
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();

		// Settle the action so the pending transition doesn't leak into later tests.
		resolveAction?.();
		await expect.element(button).not.toHaveAttribute('aria-busy', 'true');
	});

	// 15
	it('clears the loading state once the action settles', async () => {
		let resolveAction: (() => void) | undefined;
		const pressedChangeAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);

		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: false,
				onPressedChange: noop,
				pressedChangeAction
			}
		});

		const button = screen.getByRole('button', { name: 'Favorite' });
		await userEvent.click(button);

		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();

		resolveAction?.();
		await expect.element(button).not.toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();
	});

	// 16
	it('interrupts an in-flight action on re-click (true -> false -> true)', async () => {
		// Each click interrupts the previous transition. The actions are resolved
		// at the end so the pending transition doesn't leak into later tests.
		const resolvers: (() => void)[] = [];
		const pressedChangeAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve);
				})
		);

		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: false,
				onPressedChange: noop,
				pressedChangeAction
			}
		});

		const button = screen.getByRole('button', { name: 'Favorite' });
		const el = button.element() as HTMLButtonElement;

		// Each click derives the next state from the optimistic (in-progress)
		// value, so rapid clicks toggle rather than being dropped. The button is
		// never disabled while pending, so every click lands and interrupts.
		// Upstream's `fireEvent.click` inside `act` → a native `.click()`.
		el.click();
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		el.click();
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		el.click();
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');

		expect(pressedChangeAction).toHaveBeenCalledTimes(3);
		expect(pressedChangeAction).toHaveBeenNthCalledWith(1, true);
		expect(pressedChangeAction).toHaveBeenNthCalledWith(2, false);
		expect(pressedChangeAction).toHaveBeenNthCalledWith(3, true);

		resolvers.forEach((resolve) => resolve());
		await expect.element(button).not.toHaveAttribute('aria-busy', 'true');
	});

	// 17
	it('supports a synchronous pressedChangeAction', async () => {
		// A sync handler (e.g. a router navigation) with no returned promise.
		const pressedChangeAction = vi.fn((_next: boolean) => {});
		const onPressedChange = vi.fn();

		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: false,
				onPressedChange,
				pressedChangeAction
			}
		});

		const button = screen.getByRole('button', { name: 'Favorite' });
		await userEvent.click(button);

		expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
		expect(pressedChangeAction).toHaveBeenCalledWith(true);
	});

	// 18
	it('skips pressedChangeAction when onPressedChange calls preventDefault', async () => {
		const pressedChangeAction = vi.fn();
		const onPressedChange = vi.fn((_next: boolean, event: MouseEvent) => {
			event.preventDefault();
		});

		const screen = await render(ToggleButtonProbe, {
			props: {
				label: 'Favorite',
				isPressed: false,
				onPressedChange,
				pressedChangeAction
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Favorite' }));

		expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
		expect(pressedChangeAction).not.toHaveBeenCalled();
	});
});

// =============================================================================
// ToggleButtonGroup — Single mode
// =============================================================================

describe('ToggleButtonGroup (single)', () => {
	const items = [
		{ value: 'list', label: 'List' },
		{ value: 'grid', label: 'Grid' },
		{ value: 'card', label: 'Card' }
	];

	// 19
	it('renders a group with role="group" and aria-label', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { label: 'View mode', single: 'list', items }
		});
		await expect.element(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
	});

	// 20
	it('marks the selected button as pressed', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { label: 'View mode', single: 'list', items }
		});
		await expect
			.element(screen.getByRole('button', { name: 'List' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(screen.getByRole('button', { name: 'Grid' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	// 21
	it('selects a different button on click', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { label: 'View mode', single: 'list', items }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Grid' }));

		await expect
			.element(screen.getByRole('button', { name: 'Grid' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(screen.getByRole('button', { name: 'List' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	// 22
	it('allows deselection by clicking the active button', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { label: 'View mode', single: 'list', items }
		});

		await userEvent.click(screen.getByRole('button', { name: 'List' }));

		await expect
			.element(screen.getByRole('button', { name: 'List' }))
			.toHaveAttribute('aria-pressed', 'false');
		await expect
			.element(screen.getByRole('button', { name: 'Grid' }))
			.toHaveAttribute('aria-pressed', 'false');
	});
});

// =============================================================================
// ToggleButtonGroup — Multiple mode
// =============================================================================

describe('ToggleButtonGroup (multiple)', () => {
	const items = [
		{ value: 'bold', label: 'Bold' },
		{ value: 'italic', label: 'Italic' },
		{ value: 'underline', label: 'Underline' }
	];

	// 23
	it('marks selected buttons as pressed', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { type: 'multiple', label: 'Formatting', multiple: ['bold'], items }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Bold' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(screen.getByRole('button', { name: 'Italic' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	// 24
	it('adds a value when clicking an unpressed button', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { type: 'multiple', label: 'Formatting', multiple: ['bold'], items }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Italic' }));

		await expect
			.element(screen.getByRole('button', { name: 'Bold' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(screen.getByRole('button', { name: 'Italic' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	// 25
	it('removes a value when clicking a pressed button', async () => {
		const screen = await render(ToggleButtonGroupProbe, {
			props: { type: 'multiple', label: 'Formatting', multiple: ['bold'], items }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Bold' }));

		await expect
			.element(screen.getByRole('button', { name: 'Bold' }))
			.toHaveAttribute('aria-pressed', 'false');
	});
});

// Neither jsdom nor a Chromium test page can emulate forced-colors rendering, so
// this asserts that the compiled output includes the forced-colors rules; visual
// behavior needs manual verification under Windows High Contrast. See
// `forced-colors.ts` for why the scan is scoped to the rendered subtree here and
// global upstream.
describe('forced colors (WCAG 1.4.11)', () => {
	it('compiles forced-colors overrides so the pressed state survives Windows High Contrast', async () => {
		const screen = await render(ToggleButtonProbe, {
			props: { label: 'Bold', isPressed: true, onPressedChange: noop }
		});
		const css = forcedColorsCssIn(screen.container);
		// The painted pressed overlay is stripped; Highlight/HighlightText marks
		// the pressed toggle (critical for icon-only toggles, which otherwise
		// lose all pressed indication).
		expect(css).toContain('background-color: highlight;');
		expect(css).toContain('color: highlighttext;');
		// ToggleButton renders a <button>; without opting out of UA remapping it
		// keeps the native ButtonFace surface and ignores the Highlight fill,
		// leaving HighlightText text on a white surface. forced-color-adjust: none
		// makes both render as authored.
		expect(cssIn(screen.container)).toContain('forced-color-adjust: none;');
	});
});
