import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Tooltip from './fixtures/tooltip-fixture.svelte';
import TooltipTouch from './fixtures/tooltip-touch-fixture.svelte';
import { TIMER_BUDGET } from './timer-budget.js';
import { whenWired } from './trigger-wiring.js';
import { __resetInteractionModalityForTest } from '$lib/utils/interaction-modality.js';

/**
 * Ported from Astryx's `Tooltip/Tooltip.test.tsx` — **all 24 of its cases at the
 * 0.5.0 pin**. Nothing is dropped.
 *
 * The last gap closed with the shared-dismissal-stack migration: upstream's
 * `controlled` describe — `echoes the close through onOpenChange when the
 * consumer flips isOpen` — is new at 0.5.0 and exists because a controlled
 * tooltip now stays on the stack and answers Escape by calling `onHide` instead
 * of hiding itself. Upstream's own comment on the case says so: the consumer
 * sees the request, and then this echo when they comply. (The header read
 * "23 of its 24 cases".)
 *
 * Upstream's 11-case `touch` describe — tap-to-open, tap-to-dismiss, pen hover
 * and the focus a tap leaves behind, all of it new at 0.5.0 with #5248 — is
 * ported in full at the bottom. It was unported until `touchTrigger` existed
 * here at all: the prop was documented in `Tooltip.doc.mjs` and declared
 * nowhere, so `grep touchTrigger src/lib` returned only prose. (The header read
 * "12 of its 24 cases"; before that, "all twelve cases at v0.3.0 … nothing is
 * dropped" — 12 was the whole suite at that tag, and the version bumps
 * invalidated it.)
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
async function triggerIn(container: HTMLElement, selector = 'button'): Promise<HTMLElement> {
	// `selector` names the trigger for the trees the `touch` describe renders:
	// the inert `<span tabindex=0>` of a text-only tooltip, the `<input>` of the
	// focus cases, and — where a sibling button sits outside the tooltip — the
	// one that is actually the trigger.
	const el = container.querySelector(selector);
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
		await expect
			.element(screen.getByRole('button', { name: 'Trigger', exact: true }))
			.toBeInTheDocument();
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

	describe('controlled', () => {
		// Escape asks a controlled tooltip to close by calling this same handler,
		// so a consumer who complies sees the request and then this echo. Pinning
		// the echo here keeps the two straight.
		it('echoes the close through onOpenChange when the consumer flips isOpen', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(Tooltip, {
				props: { content: 'Pinned', isOpen: true, onOpenChange, delay: 0 }
			});
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
			onOpenChange.mockClear();

			await screen.rerender({ content: 'Pinned', isOpen: false, onOpenChange, delay: 0 });

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});
	});

	describe('touch', () => {
		// The modality is document-global; a tap in one case must not decide the
		// next one's answer.
		beforeEach(() => {
			__resetInteractionModalityForTest();
		});

		/**
		 * A tap: the pointer sequence a finger produces before hover is faked.
		 *
		 * Upstream's `fireEvent.pointerEnter`/`pointerDown`/`pointerUp`/
		 * `mouseEnter`, dispatched the same way. A finger's arrival fires
		 * `pointerenter` too, and that is the path a pen must not take — covered
		 * here rather than starting at `pointerdown`.
		 *
		 * The press bubbles, which testing-library's does by default and which
		 * matters here: `trackInteractionModality` listens at the document, and a
		 * press that never reaches it leaves `getInteractionModality()` reading
		 * `'keyboard'` — the one value that makes the touch-focus guard inert.
		 */
		function tap(element: HTMLElement): void {
			element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
			element.dispatchEvent(
				new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })
			);
			element.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', bubbles: true }));
			// Touch synthesizes hover after the press; the tooltip must not act on it.
			mouse(element, 'mouseenter');
		}

		/** The inert `<span tabindex=0>` a text-only tooltip renders. */
		const TEXT_TRIGGER = 'span[tabindex]';

		it('opens on a tap when the trigger performs no action', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, delay: 200 }
			});

			tap(await triggerIn(screen.container, TEXT_TRIGGER));

			// Immediately: a tap is a decision, not hover intent, so no delay applies.
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('stays shut on a tap when the trigger performs an action', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: {
					content: 'Tooltip text',
					onOpenChange,
					delay: 0,
					trigger: 'button',
					triggerText: 'Save'
				}
			});

			tap(await triggerIn(screen.container));

			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(onOpenChange).not.toHaveBeenCalledWith(true);
		});

		it('opens on a tap of an action trigger when touchTrigger is "tap"', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: {
					content: 'What this metric means',
					onOpenChange,
					touchTrigger: 'tap',
					delay: 0,
					trigger: 'button',
					triggerText: 'Info'
				}
			});

			tap(await triggerIn(screen.container));

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('never opens on a tap when touchTrigger is "none"', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, touchTrigger: 'none', delay: 0 }
			});

			tap(await triggerIn(screen.container, TEXT_TRIGGER));

			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(onOpenChange).not.toHaveBeenCalledWith(true);
		});

		it('closes on a second tap of the trigger', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, delay: 0 }
			});

			const trigger = await triggerIn(screen.container, TEXT_TRIGGER);
			tap(trigger);
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});

			tap(trigger);
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});

		it('closes on a tap outside — the dismissal a tap-open owes the user', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, delay: 0, hasOutsideButton: true }
			});

			tap(await triggerIn(screen.container, TEXT_TRIGGER));
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});

			const elsewhere = screen.getByRole('button', { name: 'Elsewhere', exact: true }).element();
			elsewhere.dispatchEvent(
				new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })
			);

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});

		it('still opens on a real mouse hover after a tap', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: {
					content: 'Tooltip text',
					onOpenChange,
					delay: 0,
					trigger: 'button',
					triggerText: 'Save'
				}
			});

			const trigger = await triggerIn(screen.container);
			tap(trigger);
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(onOpenChange).not.toHaveBeenCalledWith(true);

			// A hybrid device: the same trigger, now under a mouse.
			trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
			mouse(trigger, 'mouseenter');

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('opens on a hovering pen, which is a hover and not a tap', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: {
					content: 'Tooltip text',
					onOpenChange,
					delay: 0,
					trigger: 'button',
					triggerText: 'Save'
				}
			});

			const trigger = await triggerIn(screen.container);
			// A stylus in detection range: pointerenter with nothing in contact, on
			// a device where `(hover: hover)` matches. Reading that as touch would
			// bail out of the hover path and leave the user no tooltip at all.
			trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'pen', buttons: 0 }));
			mouse(trigger, 'mouseenter');

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('tap-opens when a pen lands on an inert trigger', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, delay: 200 }
			});

			const trigger = await triggerIn(screen.container, TEXT_TRIGGER);
			// Hovering first, as a real pen does — then contact, which is a tap.
			trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'pen', buttons: 0 }));
			trigger.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'pen', bubbles: true }));
			trigger.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'pen', bubbles: true }));

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('does not reopen from the focus a tapped text field takes', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, delay: 0, trigger: 'input' }
			});

			const trigger = await triggerIn(screen.container, 'input');

			// An `<input>` is an action trigger, so `auto` gives it the tap — and
			// the focus it takes must not put the tooltip back over the field the
			// user is about to type into.
			tap(trigger);
			trigger.focus();

			// A tapped text field matches `:focus-visible` — deliberately, per
			// Selectors 4, so typing has a visible home. Upstream stands that up
			// with a spy on `matches`, because jsdom does not model it and without
			// it the case cannot fail whatever the focus path does. A real Chromium
			// implements the rule, so the precondition is *asserted* instead: this
			// is the gate the touch guard has to beat.
			expect(trigger.matches(':focus-visible')).toBe(true);

			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(onOpenChange).not.toHaveBeenCalledWith(true);
		});

		it('still opens on keyboard focus of a trigger a finger touched', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTouch, {
				props: { content: 'Tooltip text', onOpenChange, delay: 0, trigger: 'input' }
			});

			const trigger = await triggerIn(screen.container, 'input');
			tap(trigger);
			// Reaching for the keyboard ends the touch interaction; the guard is on
			// the gesture in flight, not on the device the trigger last saw.
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
			trigger.focus();
			expect(trigger.matches(':focus-visible')).toBe(true);

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});
	});
});
