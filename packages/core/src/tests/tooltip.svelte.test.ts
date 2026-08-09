import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Tooltip from './fixtures/tooltip-fixture.svelte';
import { TIMER_BUDGET } from './timer-budget.js';
import { whenWired } from './trigger-wiring.js';

/**
 * Ported from Astryx's `Tooltip/Tooltip.test.tsx`, all **twelve** cases at
 * v0.3.0. Nothing is dropped.
 *
 * (The previous header said "all ten cases". Upstream has 12: its nested
 * `describe('press-to-dismiss')` pair — `hides the tooltip when the trigger is
 * pressed` and `does not press-dismiss a controlled tooltip` — was unported and
 * unnamed. Both are ported here and both passed on the first run; the behaviour
 * lives in `use-tooltip.svelte.ts`'s `pointerdown` listener.)
 *
 * Upstream's `beforeAll` block is gone, and that is the whole migration.
 * It exists to give jsdom a Popover API at all — a `showPopover`/`hidePopover`
 * pair backed by a `WeakMap`, plus a `matches` override so `:popover-open`
 * answers from that map. These run in a real browser, which implements all of
 * it natively; keeping the stub would replace the thing under test with a
 * model of it. Where a case genuinely asserts *that showPopover was called*,
 * the spy is installed for that case alone, as `useLayer`'s own suite does.
 *
 * Two smaller shifts, both following patterns the earlier suites set:
 * `waitFor` around a spy becomes `vi.waitFor`, which retries identically, and
 * the layer is located with a `querySelector` on the render container rather
 * than `getByRole('tooltip', {hidden: true})` — a closed popover is
 * `display: none` in a real browser, so a role query would have to opt into
 * hidden nodes to see it, and the container query is what `useLayer`'s suite
 * already uses for the same element.
 */

const originalShowPopover = HTMLElement.prototype.showPopover;

afterEach(() => {
	HTMLElement.prototype.showPopover = originalShowPopover;
});

function tooltipLayerIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="tooltip"]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a tooltip layer');
	}
	return el;
}

/**
 * Async because it waits for the trigger to be *wired*, not merely present —
 * see `trigger-wiring.ts`. Every interaction below goes through here so the
 * precondition cannot be forgotten at a call site.
 */
async function triggerIn(container: HTMLElement): Promise<HTMLElement> {
	const el = container.querySelector('button');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a trigger button');
	}
	await whenWired(el);
	return el;
}

/** `mouseenter`/`mouseleave` do not bubble; the listeners sit on the element. */
function mouse(element: HTMLElement, type: 'mouseenter' | 'mouseleave'): void {
	element.dispatchEvent(new MouseEvent(type));
}

/**
 * Upstream's `fireEvent.pointerDown(trigger)`, dispatched the same way. A real
 * Playwright press would also move the physical mouse onto the trigger, which
 * would deliver a genuine `mouseenter` the hover cases above dispatch
 * synthetically — the press-dismiss question is about the `pointerdown`
 * listener, not about pointer travel.
 */
function pointerDown(element: HTMLElement): void {
	element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
}

function escape(init: KeyboardEventInit = {}): void {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, ...init }));
}

describe('Tooltip', () => {
	it('renders trigger element', async () => {
		const screen = await render(Tooltip, { props: { content: 'Tooltip text' } });
		await expect.element(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
	});

	it('gives the tooltip layer role="tooltip" linked from the trigger', async () => {
		const screen = await render(Tooltip, { props: { content: 'Tooltip text' } });
		const layer = tooltipLayerIn(screen.container);
		expect(layer).toHaveTextContent('Tooltip text');
		// ARIA tooltip pattern: trigger references the layer via aria-describedby.
		const trigger = await triggerIn(screen.container);
		expect(trigger.getAttribute('aria-describedby')).toBe(layer.id);
	});

	it('calls onOpenChange(true) when shown via hover', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Tooltip, {
			props: { content: 'Tooltip text', onOpenChange, delay: 0 }
		});

		mouse(await triggerIn(screen.container), 'mouseenter');

		await vi.waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(true);
		});
	});

	describe('isDefaultOpen', () => {
		it('shows tooltip on mount when isDefaultOpen is true', async () => {
			const showPopover = vi.fn(originalShowPopover);
			HTMLElement.prototype.showPopover = showPopover;

			await render(Tooltip, { props: { content: 'Default open tooltip', isDefaultOpen: true } });

			// showPopover should be called on mount
			await vi.waitFor(() => {
				expect(showPopover).toHaveBeenCalled();
			});
		});

		it('calls onOpenChange(true) on mount when isDefaultOpen is true', async () => {
			const onOpenChange = vi.fn();
			await render(Tooltip, {
				props: { content: 'Default open tooltip', isDefaultOpen: true, onOpenChange }
			});

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('does not show tooltip on mount when isDefaultOpen is false', async () => {
			const showPopover = vi.fn(originalShowPopover);
			HTMLElement.prototype.showPopover = showPopover;

			await render(Tooltip, { props: { content: 'Not default open' } });

			// Give it time to potentially fire
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(showPopover).not.toHaveBeenCalled();
		});

		it('tooltip is still dismissible after isDefaultOpen', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: {
					content: 'Dismissible tooltip',
					isDefaultOpen: true,
					onOpenChange,
					hideDelay: 0
				}
			});

			// Wait for it to show
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});

			// Mouse leave should hide it — via the 100ms hover bridge that a zero
			// `hideDelay` substitutes, so this wait is gated on a component timer.
			mouse(await triggerIn(screen.container), 'mouseleave');

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			}, TIMER_BUDGET);
		});
	});

	describe('WCAG 1.4.13 — content on hover or focus', () => {
		it('dismisses on Escape while visible (dismissible)', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: { content: 'Dismiss me', onOpenChange, delay: 0 }
			});

			mouse(await triggerIn(screen.container), 'mouseenter');
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});

			escape();
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});

		it('ignores Escape during IME composition', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: { content: 'Stay', onOpenChange, delay: 0 }
			});

			mouse(await triggerIn(screen.container), 'mouseenter');
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
			onOpenChange.mockClear();

			escape({ isComposing: true });
			// Give any (incorrect) async hide a chance to run.
			await new Promise((r) => setTimeout(r, 20));
			expect(onOpenChange).not.toHaveBeenCalledWith(false);
		});

		it('stays open when the pointer moves onto the tooltip surface (hoverable)', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: { content: 'Hover me', onOpenChange, delay: 0 }
			});

			mouse(await triggerIn(screen.container), 'mouseenter');
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
			onOpenChange.mockClear();

			// Pointer leaves the trigger but enters the tooltip surface before the
			// hover-bridge grace period elapses — the tooltip must not hide.
			mouse(await triggerIn(screen.container), 'mouseleave');
			mouse(tooltipLayerIn(screen.container), 'mouseenter');

			await new Promise((r) => setTimeout(r, 150));
			expect(onOpenChange).not.toHaveBeenCalledWith(false);
		});
	});

	describe('press-to-dismiss', () => {
		it('hides the tooltip when the trigger is pressed', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: { content: 'Copy link', onOpenChange, delay: 0 }
			});

			const trigger = await triggerIn(screen.container);
			mouse(trigger, 'mouseenter');
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});

			pointerDown(trigger);
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});

		it('does not press-dismiss a controlled tooltip', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: { content: 'Controlled', isOpen: true, onOpenChange, delay: 0 }
			});

			const trigger = await triggerIn(screen.container);
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
			onOpenChange.mockClear();

			pointerDown(trigger);
			// Give any (incorrect) async hide a chance to run.
			await new Promise((r) => setTimeout(r, 20));
			expect(onOpenChange).not.toHaveBeenCalledWith(false);
		});
	});
});
