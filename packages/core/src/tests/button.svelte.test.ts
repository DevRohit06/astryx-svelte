/** PORTS: Button/Button.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Button from '$lib/components/button/button.svelte';
import ButtonFixture from './fixtures/button-fixture.svelte';
import ButtonI18nFixture from './fixtures/button-i18n.svelte';

/**
 * Astryx's `Button/Button.test.tsx`, ported case for case — **40 upstream cases
 * at the 0.5.0 pin (38 in `describe('Button')` plus 2 in its nested `elevation`
 * block), 39 here**. `Button.test.tsx` is the only test file in upstream's
 * `Button/` directory. There is no `displayName` case, no snapshot and no
 * no-JSX construction form, so `ref` is the only React-only surface and it gets
 * a counterpart.
 *
 * **The one that is not here arrived at 0.5.0**: `keeps its merged ref attached
 * across unrelated rerenders`. It is not a standing React-only drop — this port
 * answers `ref` with an attachment, and an attachment surviving a rerender is
 * exactly the reactivity hazard worth pinning — so it is an ordinary unported
 * case rather than an accounted-for one. (This header read "**39** upstream
 * cases at v0.3.0 … 39 here, none dropped", true at that pin.)
 *
 * What translated, each commented where it appears:
 *
 * - **`icon`, `endContent` and `children` go through `button-fixture.svelte`.**
 *   All three are `Snippet`s here, and a snippet can only be authored in a
 *   template. The fixture stringifies upstream's `<Badge label={3} />` because
 *   our `Badge.label` is `string | Snippet` — the rendered text, which is what
 *   the cases assert, is unchanged.
 *
 * - **`forwards ref correctly` is a counterpart.** Svelte has no `ref`; a
 *   consumer reaches the root through an attachment travelling in the rest props,
 *   which `Button` spreads onto its `<button>`. It checks more than upstream's
 *   does — upstream only proves a callback ran with *some* `HTMLButtonElement`,
 *   this receives the button itself.
 *
 * - **`onClick`/`onKeyDown` are `onclick`/`onkeydown`**, Svelte's spellings of
 *   the same props.
 *
 * - **`act()` has no counterpart.** A `$state` write flushes on its own, so the
 *   pending-action cases resolve the promise and then let `expect.element` retry
 *   (or `await tick()` where the assertion is on a spy rather than the DOM).
 *
 * Restated, each noted at the case:
 * - **the two "does not fire click when disabled/loading" cases dispatch a
 *   native `.click()`** instead of `user.click`. A natively `disabled` button is
 *   not actionable to Playwright's userEvent, where React's own listener made
 *   upstream's `user.click` reach the guard; the same substitution
 *   `toggle-button.svelte.test.ts` already makes.
 * - **`does not fire handlers when aria-disabled via tooltip` dispatches a
 *   native `.click()` too.** Playwright's actionability counts
 *   `aria-disabled="true"` as not enabled, so `user.click` can only time out.
 *   The substitution makes the case check *more* than upstream's, since the
 *   event genuinely reaches the button.
 * - **the two fast-double-click cases dispatch native `.click()` pairs** for
 *   upstream's `fireEvent.click` pairs, which is the same trusted-free dispatch
 *   and — crucially — keeps both clicks inside one flush, which is the whole
 *   point of the dedupe guard.
 */

describe('Button', () => {
	it('renders label as visible text', async () => {
		const screen = await render(Button, { props: { label: 'Click me' } });
		await expect
			.element(screen.getByRole('button', { name: 'Click me', exact: true }))
			.toBeInTheDocument();
	});

	it('renders children instead of label when provided', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Accessible name' }, text: 'Custom content' }
		});
		const button = screen.getByRole('button');
		await expect.element(button).toHaveTextContent('Custom content');
	});

	it('renders with different variants', async () => {
		const screen = await render(Button, { props: { label: 'Primary', variant: 'primary' } });
		await expect.element(screen.getByRole('button')).toBeInTheDocument();

		await screen.rerender({ label: 'Secondary', variant: 'secondary' });
		await expect.element(screen.getByRole('button')).toBeInTheDocument();

		await screen.rerender({ label: 'Ghost', variant: 'ghost' });
		await expect.element(screen.getByRole('button')).toBeInTheDocument();

		await screen.rerender({ label: 'Destructive', variant: 'destructive' });
		await expect.element(screen.getByRole('button')).toBeInTheDocument();
	});

	it('renders icon-only button with aria-label', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Settings', isIconOnly: true }, icon: '⚙' }
		});
		const button = screen.getByRole('button', { name: 'Settings', exact: true });
		await expect.element(button).toHaveAttribute('aria-label', 'Settings');
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders icon with text when both icon and children provided', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Settings' }, icon: '⚙' }
		});
		const button = screen.getByRole('button').element();
		expect(button).not.toHaveAttribute('aria-label');
		expect(button).toHaveTextContent('Settings');
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('shows isLoading state with spinner', async () => {
		const screen = await render(Button, { props: { label: 'Submit', isLoading: true } });
		const button = screen.getByRole('button');
		// Button should be disabled when loading
		await expect.element(button).toBeDisabled();
	});

	it('sets aria-busy synchronously while clickAction is pending', async () => {
		// The spinner reveal is visually delayed (CSS animation-delay), but the
		// loading DOM state — aria-busy and disabled — must not be delayed.
		let resolveAction: (() => void) | undefined;
		const clickAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);
		const screen = await render(Button, { props: { label: 'Save', clickAction } });
		const button = screen.getByRole('button');

		await userEvent.click(button);
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button).toBeDisabled();

		resolveAction?.();
		await expect.element(button).not.toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();
	});

	it('renders the loading spinner with the inherit shade for every variant (#2717)', async () => {
		// The spinner must follow the button's resolved foreground color rather
		// than a hardcoded white, so it keeps contrast on themed variants like the
		// neutral theme's muted-red destructive button.
		for (const variant of ['primary', 'secondary', 'ghost', 'destructive'] as const) {
			const screen = await render(Button, {
				props: { label: 'Submit', variant, isLoading: true }
			});
			const spinner = screen.container.querySelector('.astryx-spinner');
			expect(spinner).not.toBeNull();
			expect(spinner).toHaveAttribute('data-shade', 'inherit');
			screen.unmount();
		}
	});

	it('handles click events', async () => {
		const handleClick = vi.fn();
		const screen = await render(Button, { props: { label: 'Click me', onclick: handleClick } });

		await userEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('does not fire click when disabled', async () => {
		const handleClick = vi.fn();
		const screen = await render(Button, {
			props: { label: 'Click me', isDisabled: true, onclick: handleClick }
		});

		// A native `disabled` button is not actionable to Playwright's userEvent;
		// upstream's `user.click` reaches the guard because React attaches its own
		// listener. The native `.click()` is the equivalent trusted-free dispatch,
		// and the browser drops it on a disabled button just as the component would.
		(screen.getByRole('button').element() as HTMLButtonElement).click();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('does not fire click when loading', async () => {
		const handleClick = vi.fn();
		const screen = await render(Button, {
			props: { label: 'Click me', isLoading: true, onclick: handleClick }
		});

		// Loading disables the button — same dispatch substitution as above.
		(screen.getByRole('button').element() as HTMLButtonElement).click();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('forwards ref correctly', async () => {
		// Counterpart to upstream's `ref`: an attachment in the rest props, which
		// `Button` spreads onto its `<button>`.
		let node: Element | undefined;
		const screen = await render(Button, {
			props: {
				label: 'Test',
				[createAttachmentKey()]: (element: Element) => {
					node = element;
				}
			}
		});
		expect(node).toBe(screen.getByRole('button').element());
		expect(node).toBeInstanceOf(HTMLButtonElement);
	});

	// endContent tests
	it('renders endContent after label', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Click me' }, endBadge: 3 }
		});
		const button = screen.getByRole('button');
		await expect.element(button).toHaveTextContent('Click me');
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toHaveTextContent('3');
	});

	it('renders endContent with children', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Accessible name' }, text: 'Custom content', endBadge: 'New' }
		});
		const button = screen.getByRole('button');
		await expect.element(button).toHaveTextContent('Custom content');
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('renders endContent with icon and children', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Settings' }, icon: '⚙', endBadge: 'New' }
		});
		const button = screen.getByRole('button');
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		await expect.element(button).toHaveTextContent('Settings');
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('does not render endContent for icon-only buttons', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Settings', isIconOnly: true }, icon: '⚙', endBadge: 3 }
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
		expect(screen.getByTestId('end').query()).toBeNull();
	});

	it('wraps endContent in a container for color inheritance', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Test' }, endBadge: 3 }
		});
		const badge = screen.getByTestId('end').element();
		// The badge should be inside a wrapper span that inherits color
		const wrapper = badge.parentElement;
		expect(wrapper?.tagName).toBe('SPAN');
	});

	it('hides endContent content when loading', async () => {
		const screen = await render(ButtonFixture, {
			props: { button: { label: 'Submit', isLoading: true }, endBadge: 3 }
		});
		// endContent should still be in the DOM
		expect(screen.getByTestId('end').query()).not.toBeNull();
		// Button should be disabled and have aria-busy
		const button = screen.getByRole('button');
		await expect.element(button).toBeDisabled();
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
	});

	it('renders astryx-* classes and data attributes for theme targeting', async () => {
		const screen = await render(Button, {
			props: { label: 'Test', variant: 'secondary', size: 'sm' }
		});
		const button = screen.getByRole('button').element();
		expect(button.className).toContain('astryx-button');
		expect(button.className).toContain('secondary');
		expect(button.className).toContain('sm');
		expect(button).toHaveAttribute('data-variant', 'secondary');
		expect(button).toHaveAttribute('data-size', 'sm');
	});

	it('applies string width as-is', async () => {
		const screen = await render(Button, { props: { label: 'Sign in', width: '100%' } });
		const button = screen.getByRole('button').element();
		// StyleX compiles the dynamic width to an inline CSS custom property.
		expect(button.getAttribute('style')).toContain('100%');
		expect(button.className).toContain('dynamicStyles.width');
	});

	it('applies numeric width as pixels', async () => {
		const screen = await render(Button, { props: { label: 'Sign in', width: 240 } });
		expect(screen.getByRole('button').element().getAttribute('style')).toContain('240');
	});

	it('omits width styling when the prop is not provided', async () => {
		const screen = await render(Button, { props: { label: 'Sign in' } });
		expect(screen.getByRole('button').element().className).not.toContain('dynamicStyles.width');
	});

	it('applies width when rendered as a link via href', async () => {
		const screen = await render(Button, {
			props: { label: 'Sign in', href: 'https://example.com', width: '100%' }
		});
		expect(
			screen.getByRole('link', { name: 'Sign in', exact: true }).element().getAttribute('style')
		).toContain('100%');
	});

	// P0: onClick fires before clickAction, clickAction respects preventDefault
	it('fires onClick before clickAction', async () => {
		const order: string[] = [];
		const handleClick = vi.fn(() => {
			order.push('onClick');
		});
		const handleAction = vi.fn(() => {
			order.push('clickAction');
		});
		const screen = await render(Button, {
			props: { label: 'Test', onclick: handleClick, clickAction: handleAction }
		});

		await userEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
		expect(handleAction).toHaveBeenCalledTimes(1);
		expect(order).toEqual(['onClick', 'clickAction']);
	});

	it('does not call clickAction when onClick calls preventDefault', async () => {
		const handleClick = vi.fn((event: MouseEvent) => event.preventDefault());
		const handleAction = vi.fn();
		const screen = await render(Button, {
			props: { label: 'Test', onclick: handleClick, clickAction: handleAction }
		});

		await userEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
		expect(handleAction).not.toHaveBeenCalled();
	});

	it('fires clickAction once on a fast double-click (no double-submit)', async () => {
		let resolveAction: (() => void) | undefined;
		const handleAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);
		const screen = await render(Button, { props: { label: 'Pay', clickAction: handleAction } });

		const button = screen.getByRole('button').element() as HTMLButtonElement;
		// Both dispatches inside one flush — upstream's `fireEvent.click` pair
		// inside a single `act`.
		button.click();
		button.click();
		await tick();
		expect(handleAction).toHaveBeenCalledTimes(1);

		resolveAction?.();
		await tick();
	});

	it('stays clickable (not disabled) while a clickAction is pending when isInterruptible', async () => {
		let resolveAction: (() => void) | undefined;
		const clickAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolveAction = resolve;
				})
		);
		const screen = await render(Button, {
			props: { label: 'Toggle', isInterruptible: true, clickAction }
		});
		const button = screen.getByRole('button');

		await userEvent.click(button);
		// Loading is announced via aria-busy, but the button is not disabled so it
		// can be re-clicked to interrupt the in-flight action.
		await expect.element(button).toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();

		resolveAction?.();
		await expect.element(button).not.toHaveAttribute('aria-busy', 'true');
		await expect.element(button).not.toBeDisabled();
	});

	it('re-fires clickAction on re-click while pending when isInterruptible (no dedupe)', async () => {
		// Unlike the fire-once default, an interruptible action is not deduped: a
		// re-click while pending starts a fresh action that interrupts the prior.
		const resolvers: (() => void)[] = [];
		const clickAction = vi.fn(
			async () =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve);
				})
		);
		const screen = await render(Button, {
			props: { label: 'Toggle', isInterruptible: true, clickAction }
		});

		const button = screen.getByRole('button').element() as HTMLButtonElement;
		button.click();
		await tick();
		button.click();
		await tick();
		expect(clickAction).toHaveBeenCalledTimes(2);

		resolvers.forEach((resolve) => resolve());
		await tick();
	});

	// type/name/value/form props
	it('defaults type to button', async () => {
		const screen = await render(Button, { props: { label: 'Test' } });
		await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'button');
	});

	it('passes type=submit', async () => {
		const screen = await render(Button, { props: { label: 'Submit', type: 'submit' } });
		await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'submit');
	});

	it('uses aria-disabled instead of disabled when tooltip is present and button is disabled', async () => {
		const screen = await render(Button, {
			props: { label: 'Test', tooltip: 'Reason disabled', isDisabled: true }
		});
		const button = screen.getByRole('button').element();
		// Should NOT have native disabled (so it stays focusable for tooltip)
		expect(button).not.toHaveAttribute('disabled');
		expect(button).toHaveAttribute('aria-disabled', 'true');
	});

	it('does not fire handlers when aria-disabled via tooltip', async () => {
		const handleClick = vi.fn();
		const screen = await render(Button, {
			props: {
				label: 'Test',
				tooltip: 'Reason disabled',
				isDisabled: true,
				onclick: handleClick
			}
		});
		// Playwright's actionability treats `aria-disabled="true"` as not enabled,
		// so `user.click` never dispatches and the case can only time out. The
		// native `.click()` is the trusted-free dispatch React's own listener gave
		// upstream — and here it is the *stronger* check: the event really reaches
		// the button (nothing suppresses it at the DOM level, which is exactly what
		// this branch gives up by not being natively `disabled`), so the component's
		// own guard is the only thing that can keep the handler from running.
		(screen.getByRole('button').element() as HTMLButtonElement).click();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('suppresses activation keys but passes other keys when aria-disabled via tooltip', async () => {
		const handleKeyDown = vi.fn();
		const screen = await render(Button, {
			props: {
				label: 'Test',
				tooltip: 'Reason disabled',
				isDisabled: true,
				onkeydown: handleKeyDown
			}
		});
		const button = screen.getByRole('button').element() as HTMLButtonElement;
		button.focus();
		await userEvent.keyboard('{Enter}');
		// Activation keys (Enter) should be suppressed
		expect(handleKeyDown).not.toHaveBeenCalled();

		// Non-activation keys (Escape) should reach consumer handler
		await userEvent.keyboard('{Escape}');
		expect(handleKeyDown).toHaveBeenCalledTimes(1);
	});

	it('has a live region that announces loading state', async () => {
		const screen = await render(Button, { props: { label: 'Submit' } });
		const button = screen.getByRole('button').element();
		const liveRegion = button.querySelector('[role="status"]');
		expect(liveRegion).not.toBeNull();
		expect(liveRegion).toHaveTextContent('');

		await screen.rerender({ label: 'Submit', isLoading: true });
		expect(liveRegion).toHaveTextContent('Loading');
	});

	it('localizes the loading announcement through the i18n catalog', async () => {
		const screen = await render(ButtonI18nFixture, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.button.loading': 'Chargement' } },
				label: 'Submit',
				isLoading: true
			}
		});
		const button = screen.getByRole('button').element();
		// The Spinner also has role="status", so grab the live region explicitly.
		const regions = button.querySelectorAll('[role="status"]');
		const liveRegion = regions[regions.length - 1];
		expect(liveRegion).toHaveTextContent('Chargement');
	});

	describe('elevation', () => {
		it('renders a distinct class for each elevation level', async () => {
			const classFor = async (elevation: 'none' | 'low' | 'med' | 'high') => {
				const screen = await render(Button, { props: { label: 'Save', elevation } });
				return screen.container.querySelector('button')!.className;
			};
			const classes = new Set([
				await classFor('none'),
				await classFor('low'),
				await classFor('med'),
				await classFor('high')
			]);
			expect(classes.size).toBe(4);
		});

		it('defaults to flat (elevation none)', async () => {
			const def = await render(Button, { props: { label: 'Save' } });
			const none = await render(Button, { props: { label: 'Save', elevation: 'none' } });
			expect(def.container.querySelector('button')!.className).toBe(
				none.container.querySelector('button')!.className
			);
		});
	});

	it('exposes aria-busy on the link-rendered button while loading', async () => {
		// Non-interruptible loading disables the button, which falls back to
		// <button> rendering — so an anchor only shows loading when interruptible.
		const screen = await render(Button, {
			props: {
				label: 'Docs',
				href: 'https://example.com',
				isLoading: true,
				isInterruptible: true
			}
		});
		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('aria-busy', 'true');
	});

	it('does not set aria-busy on the link-rendered button when not loading', async () => {
		const screen = await render(Button, {
			props: { label: 'Docs', href: 'https://example.com' }
		});
		const link = screen.getByRole('link').element();
		expect(link).not.toHaveAttribute('aria-busy');
	});
});
