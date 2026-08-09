import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import NumberInput from '$lib/components/number-input/number-input.svelte';
import IconSlotProbe from './fixtures/icon-slot-probe.svelte';

/**
 * Astryx's `NumberInput/NumberInput.test.tsx`, ported case for case. Upstream at
 * 0.3.0 has 74: 66 in `describe('NumberInput')`, 4 in
 * `describe('keyboard clearing with hasClear (#3599)')` and 4 in
 * `describe('NumberInput statusVariant forwarding')`. 71 are here — the three
 * `describe('NumberInput')` cases 0.2.0 added (`includes the units text in the
 * accessible description (WCAG 1.3.1)`, `combines units with the description in
 * the accessible description`, `has no dangling aria-describedby ids inside
 * InputGroup (WCAG 1.3.1)`) are still missing: this file was first ported
 * against 0.1.9 and they have never been carried over. Recorded so the gap is
 * named rather than hidden by the count.
 *
 * Sibling of `text-input.svelte.test.ts`, which solved the same translation
 * problems first; this file follows it wherever the two overlap.
 *
 * Upstream's `beforeEach` (`:20-43`) shims `showPopover`/`hidePopover` and
 * `:popover-open` because jsdom implements none of them, and its `h = {hidden:
 * true}` exists because a jsdom popover is not "visible" to the accessibility
 * tree. The browser project needs neither: Chromium has the Popover API, so the
 * open state is read with `matches(':popover-open')`. `{hidden: true}` survives
 * as `getByRole('tooltip', {includeHidden: true})`, since a *closed* popover is
 * `display:none` for real here.
 *
 * `startIcon` is a `Snippet` rather than `ReactNode | IconType` (this port has
 * no `renderIconSlot` — see TODO.md), so the two cases that pass one go through
 * `icon-slot-probe.svelte`, which renders upstream's `TestIcon` markup verbatim
 * as a snippet. Both assert `querySelector('svg')`, which it satisfies exactly.
 *
 * Upstream's `onFocus`/`onBlur`/`onKeyDown` are `onfocus`/`onblur`/`onkeydown`
 * here — they compose with the `<input>`'s own handlers, so they take the native
 * lowercase names. Upstream's `onChange` is React's `onChange` on an input,
 * which *is* the native `input` event; ours is bound to `oninput`, so it is
 * per-keystroke on both sides and the typing cases port unchanged.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:84`)** — Svelte has no `ref` prop, and this
 *   port omits it. `NumberInput` spreads its rest props onto the `<input>`
 *   (`number-input.svelte:456`), so the seam a consumer actually uses — an
 *   attachment through the rest props — does exist, and it checks more than
 *   upstream's: it receives the element rather than only proving a callback ran.
 *
 * Restated, each noted at the case:
 * - `does not fire onChange when disabled` and `blocks value changes while
 *   focusable-disabled` — Playwright refuses to click or type into an element
 *   that is `disabled` or `aria-disabled`, which would assert its actionability
 *   heuristic instead of the component.
 * - `keeps the input focusable via aria-disabled when a reason is provided`
 *   — vitest-browser's `toBeDisabled` is Playwright's ARIA computation, not
 *   jest-dom's native-attribute one, and they disagree by design here.
 * - the two `click-to-focus` cases and the tooltip hover case — upstream's
 *   `fireEvent.click`/`mouseEnter` target the wrapper itself, which a real
 *   pointer at the wrapper's centre cannot do (the input is there), so the
 *   events are dispatched at the wrapper as upstream dispatches them.
 * - the whole `#3599` group — `fireEvent.change`/`blur`/`keyDown` have no
 *   vitest-browser counterpart, so the same events are dispatched directly; see
 *   the comment on that describe.
 * - the DOM-wide `document.querySelector('svg')` assertions are scoped to the
 *   render container, which is what RTL's freshly-cleaned `document` amounts to.
 */

function inputIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input');
	if (!(el instanceof HTMLInputElement)) {
		throw new Error('expected an input');
	}
	return el;
}

/** Upstream's `input.parentElement!` — the bordered input wrapper. */
function wrapperOf(input: HTMLInputElement): HTMLElement {
	const el = input.parentElement;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a wrapper element');
	}
	return el;
}

const noop = (): void => {};

describe('NumberInput', () => {
	it('renders with label', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		await expect.element(screen.getByLabelText('Quantity')).toBeInTheDocument();
	});

	it('renders with placeholder', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop, placeholder: 'Enter number' }
		});
		await expect.element(screen.getByPlaceholder('Enter number')).toBeInTheDocument();
	});

	it('displays controlled value as number', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: 456, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveValue(456);
	});

	it('displays null for null value', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveValue(null);
	});

	it('displays null for undefined value', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: undefined, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveValue(null);
	});

	// Counterpart to upstream's `forwards ref correctly` (`:84`); see the file
	// header. Upstream asserts `expect.any(HTMLInputElement)`; this receives the
	// element itself, so the assertion is the stronger `toBe`.
	it('hands the input to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(NumberInput, {
			props: {
				label: 'Quantity',
				value: null,
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(inputIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', isLabelHidden: true, value: null, onChange: noop }
		});
		const label = screen.getByText('Quantity');
		await expect.element(label).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Quantity')).toBeInTheDocument();
	});

	it('shows label visually by default', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: null, onChange: noop }
		});
		const label = screen.getByText('Amount');
		await expect.element(label).toBeVisible();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', isRequired: true, value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('aria-required', 'true');
	});

	it('does not set aria-required when isRequired is false', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-required');
	});

	it('sets disabled attribute when isDisabled is true', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', isDisabled: true, value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toBeDisabled();
	});

	it('does not fire onChange when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', isDisabled: true, value: null, onChange: handleChange }
		});

		const input = inputIn(screen.container);
		// Restated: upstream types with `user.type`. Playwright's actionability
		// check refuses to type into a natively disabled element at all, which
		// would assert its heuristic rather than the component, so the keystrokes
		// are aimed at the control the only way a browser allows — a focus a
		// disabled element declines, followed by real key events.
		input.focus();
		expect(document.activeElement).not.toBe(input);
		await userEvent.keyboard('123');
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('is not disabled by default', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).not.toBeDisabled();
	});

	it('renders with startIcon', async () => {
		const screen = await render(IconSlotProbe, {
			props: {
				component: NumberInput,
				slot: 'startIcon',
				rest: { label: 'Count', value: null, onChange: noop }
			}
		});
		await expect.element(screen.getByRole('spinbutton')).toBeInTheDocument();
		const svg = screen.container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('renders without icon wrapper when startIcon is not provided', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	describe('native number input attributes', () => {
		it('sets min attribute', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: null, onChange: noop, min: 0 }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('min', '0');
		});

		it('sets max attribute', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: null, onChange: noop, max: 120 }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('max', '120');
		});

		it('sets step attribute', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Price', value: null, onChange: noop, step: 0.01 }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('step', '0.01');
		});
	});

	describe('onChange validation', () => {
		it('calls onChange with valid number when typing', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: handleChange }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '42');

			expect(handleChange).toHaveBeenCalledWith(4);
			expect(handleChange).toHaveBeenCalledWith(42);
		});

		it('does not call onChange when value exceeds max', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Rating', value: null, onChange: handleChange, max: 5 }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '10');

			// 1 is valid (<=5), but 10 is not
			expect(handleChange).toHaveBeenCalledWith(1);
			expect(handleChange).not.toHaveBeenCalledWith(10);
		});

		it('does not call onChange when value is below min', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: null, onChange: handleChange, min: 0 }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '-5');

			// Neither -5 nor any partial input is valid with min=0
			expect(handleChange).not.toHaveBeenCalled();
		});

		it('does not call onChange for decimal when isIntegerOnly is true', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Count', value: null, onChange: handleChange, isIntegerOnly: true }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '3.5');

			// 3 is valid, but 3.5 is not
			expect(handleChange).toHaveBeenCalledWith(3);
			expect(handleChange).not.toHaveBeenCalledWith(3.5);
		});

		it('calls onChange for decimal when isIntegerOnly is false', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Price', value: null, onChange: handleChange }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '3.5');

			expect(handleChange).toHaveBeenCalledWith(3.5);
		});
	});

	describe('units prop', () => {
		it('renders units text when provided', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Discount', value: 10, onChange: noop, units: '%' }
			});
			await expect.element(screen.getByText('%')).toBeInTheDocument();
		});

		it('does not render units when not provided', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: 100, onChange: noop }
			});
			expect(screen.getByText('%').query()).toBeNull();
			expect(screen.getByText('GB').query()).toBeNull();
		});
	});

	describe('event callbacks', () => {
		it('calls onFocus when input receives focus', async () => {
			const handleFocus = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop, onfocus: handleFocus }
			});

			await userEvent.click(screen.getByRole('spinbutton'));
			expect(handleFocus).toHaveBeenCalledTimes(1);
		});

		it('calls onBlur when input loses focus', async () => {
			const handleBlur = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop, onblur: handleBlur }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.tab();
			expect(handleBlur).toHaveBeenCalledTimes(1);
		});

		it('calls onEnter when Enter key is pressed', async () => {
			const handleEnter = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop, onEnter: handleEnter }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.keyboard('{Enter}');
			expect(handleEnter).toHaveBeenCalledTimes(1);
		});

		it('commits valid value on Enter key', async () => {
			const handleChange = vi.fn();
			const handleEnter = vi.fn();
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: null,
					onChange: handleChange,
					onEnter: handleEnter
				}
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '42');
			handleChange.mockClear();
			await userEvent.keyboard('{Enter}');

			expect(handleEnter).toHaveBeenCalledTimes(1);
		});
	});

	describe('status prop', () => {
		it('renders with error status icon', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'error' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders with warning status icon', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'warning' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders with success status icon', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'success' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders status message when provided', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Amount',
					value: null,
					onChange: noop,
					status: { type: 'error', message: 'Value must be positive' }
				}
			});
			await expect.element(screen.getByText('Value must be positive')).toBeInTheDocument();
		});

		it('does not render status message when not provided', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'error' } }
			});
			expect(screen.getByText(/positive/i).query()).toBeNull();
		});

		it('sets aria-invalid when status type is error', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'error' } }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
		});

		it('does not set aria-invalid for warning status', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'warning' } }
			});
			await expect.element(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-invalid');
		});

		it('does not set aria-invalid for success status', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Amount', value: null, onChange: noop, status: { type: 'success' } }
			});
			await expect.element(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-invalid');
		});
	});

	describe('invalid typed input feedback (WCAG 3.3.1)', () => {
		it('sets aria-invalid="true" when typed input is unparseable', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Count', value: null, onChange: noop, isIntegerOnly: true }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			// "3.5" is invalid when isIntegerOnly is set
			await userEvent.type(input, '3.5');

			await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		});

		it('does not set aria-invalid when typed input is valid', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Count', value: null, onChange: noop }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '42');

			await expect.element(input).not.toHaveAttribute('aria-invalid');
		});

		it('announces an alert message when typed input is invalid', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Count', value: null, onChange: noop, isIntegerOnly: true }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '3.5');

			// Scoped to the component's own container: 0.2.0 routes `FieldStatus`
			// through `useAnnounce`, whose global assertive region is also
			// `role="alert"` and would make a body-wide query ambiguous.
			// `screen.locator` is `page.elementLocator(container)` — upstream's
			// `within(container)`.
			await expect.element(screen.locator.getByRole('alert')).toHaveTextContent('Invalid number');
		});

		it('does not announce an alert message when input is valid', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Count', value: null, onChange: noop }
			});

			const input = screen.getByRole('spinbutton');
			await userEvent.click(input);
			await userEvent.type(input, '42');

			await expect.element(screen.locator.getByRole('alert')).toHaveTextContent('');
			expect(screen.getByText('Invalid number').query()).toBeNull();
		});
	});

	it('renders tooltip info icon when labelTooltip is provided', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Help', value: null, onChange: noop, labelTooltip: 'Helpful info' }
		});
		expect(screen.container.querySelector('svg')).toBeInTheDocument();
	});

	it('does not render tooltip icon when labelTooltip is not provided', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	describe('hasAutoFocus prop', () => {
		it('focuses the input when hasAutoFocus is true', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop, hasAutoFocus: true }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveFocus();
		});

		it('does not focus when hasAutoFocus is false', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop }
			});
			expect(inputIn(screen.container)).not.toHaveFocus();
		});
	});

	describe('htmlName prop', () => {
		it('sets name attribute when htmlName is provided', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop, htmlName: 'quantity' }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('name', 'quantity');
		});

		it('does not set name attribute when htmlName is not provided', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop }
			});
			await expect.element(screen.getByRole('spinbutton')).not.toHaveAttribute('name');
		});
	});

	describe('autoComplete prop', () => {
		it('sets autocomplete attribute when autoComplete is provided', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: null, onChange: noop, autoComplete: 'off' }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('autocomplete', 'off');
		});
	});

	describe('hasClear', () => {
		it('shows clear button when hasClear is true and value exists', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Qty', value: 5, onChange: noop, hasClear: true }
			});
			await expect.element(screen.getByRole('button', { name: 'Clear Qty' })).toBeInTheDocument();
		});

		it('does not show clear button when value is null', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Qty', value: null, onChange: noop, hasClear: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Qty' }).query()).toBeNull();
		});

		it('does not show clear button when hasClear is false', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Qty', value: 5, onChange: noop }
			});
			expect(screen.getByRole('button', { name: 'Clear Qty' }).query()).toBeNull();
		});

		it('does not show clear button when disabled', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Qty', value: 5, onChange: noop, hasClear: true, isDisabled: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Qty' }).query()).toBeNull();
		});

		it('calls onChange with null when clear is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Qty', value: 5, onChange, hasClear: true }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear Qty' }));
			expect(onChange).toHaveBeenCalledWith(null);
		});
	});

	describe('click-to-focus', () => {
		it('focuses input when clicking the start icon', async () => {
			const screen = await render(IconSlotProbe, {
				props: {
					component: NumberInput,
					slot: 'startIcon',
					rest: { label: 'Qty', value: 0, onChange: noop }
				}
			});

			const input = inputIn(screen.container);
			const wrapper = wrapperOf(input);
			const iconElement = wrapper.querySelector('svg')!;

			// Restated only in how the click is delivered: upstream's
			// `fireEvent.click(iconElement)` sets the icon as the event target, which
			// is the whole point — the container handler must delegate focus from a
			// non-interactive descendant. A real pointer click would have to hit the
			// icon's pixels, and the icon is 1em of an unthemed default glyph.
			iconElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(input).toHaveFocus();
		});

		it('focuses input when clicking the wrapper padding', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Qty', value: 0, onChange: noop }
			});

			const input = inputIn(screen.container);
			const wrapper = wrapperOf(input);

			// As above: a real pointer at the wrapper's centre lands on the input,
			// which focuses natively and would pass the case without the delegation
			// ever running. Dispatching at the wrapper is upstream's event exactly.
			wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(input).toHaveFocus();
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const input = inputIn(screen.container);
			const container = wrapperOf(input);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip).toHaveTextContent('You need the Editor role');

			// Upstream's `fireEvent.mouseEnter`/`mouseLeave`, dispatched the same way:
			// a real pointer moved to the wrapper's centre would be over the input,
			// and `unhover` parks it at the viewport origin — both would assert where
			// Playwright puts the mouse rather than what the wrapper listens for.
			container.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's `popover-open` attribute,
				// which its jsdom shim invents; Chromium has the real thing.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});

			container.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('spinbutton')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange: noop,
					disabledMessage: 'You need the Editor role'
				}
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 5, onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const input = screen.getByRole('spinbutton');
			// Restated: upstream's `not.toBeDisabled()` is jest-dom's, which reads the
			// *native* disabled state only. vitest-browser's matcher of that name is
			// Playwright's ARIA computation, which counts `aria-disabled="true"` as
			// disabled — so it answers "true" on the very attribute the next line
			// requires. Upstream's question is asked directly instead: no native
			// `disabled`, which is what keeps the control in the tab order.
			await expect.element(input).not.toHaveAttribute('disabled');
			expect(inputIn(screen.container).disabled).toBe(false);
			await expect.element(input).toHaveAttribute('aria-disabled', 'true');
			await expect.element(input).toHaveAttribute('readonly');
		});

		it('links the reason tooltip from the input via aria-describedby', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const input = inputIn(screen.container);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks value changes while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const input = inputIn(screen.container);
			// Restated: upstream clicks then types. Playwright's actionability check
			// reads `aria-disabled="true"` as "not enabled" and refuses to click at
			// all, which would assert its heuristic instead of the guard. The control
			// *is* focusable — that is the case's premise — so it is focused directly
			// and typed into with real keys.
			input.focus();
			expect(document.activeElement).toBe(input);
			await userEvent.keyboard('9');
			expect(onChange).not.toHaveBeenCalled();
			expect(input).toHaveValue(5);
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 5, onChange: noop, isDisabled: true }
			});
			const input = screen.getByRole('spinbutton');
			await expect.element(input).toBeDisabled();
			await expect.element(input).not.toHaveAttribute('aria-disabled');
		});
	});
});

/**
 * Upstream drives this group with `fireEvent`, which vitest-browser has no
 * counterpart for, so the same events are dispatched directly on the input:
 * `fireEvent.change(input, {target: {value: ''}})` becomes an assignment plus a
 * bubbling `input` event (React's `onChange` on an input *is* the native `input`
 * event, which is what this port binds), `fireEvent.blur` a `blur` event, and
 * `fireEvent.keyDown` a bubbling `keydown`. Real typing cannot substitute: the
 * point of each case is a field emptied without the clear button.
 */
describe('keyboard clearing with hasClear (#3599)', () => {
	/**
	 * Upstream's `fireEvent.change(input, {target: {value: ''}})`.
	 *
	 * The `await tick()` is upstream's `act()`, not an extra step: RTL wraps every
	 * `fireEvent` in `act()`, so React has re-rendered — and re-synchronised its
	 * DOM value tracker — before the `blur`/`keyDown` that follows. Svelte flushes
	 * template effects on a microtask, so without the tick both events land in one
	 * flush, `displayValue` never observably passes through `''`, and `set_value`'s
	 * "unchanged since last flush" short-circuit leaves the emptied field alone.
	 * That is an artefact of dispatching two events in the same task; a real user's
	 * input and blur are always separated by at least one.
	 */
	async function emptyField(input: HTMLInputElement): Promise<void> {
		input.value = '';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await tick();
	}

	it('commits null when the input is emptied and blurred', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', hasClear: true, value: 42, onChange }
		});
		const input = inputIn(screen.container);
		await emptyField(input);
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('commits null when the input is emptied and Enter is pressed', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', hasClear: true, value: 42, onChange }
		});
		const input = inputIn(screen.container);
		await emptyField(input);
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('does not fire when emptied and blurred with no prior value', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', hasClear: true, value: null, onChange }
		});
		const input = inputIn(screen.container);
		await emptyField(input);
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('still reverts on blur when hasClear is not set', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', value: 42, onChange }
		});
		const input = inputIn(screen.container);
		await emptyField(input);
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).not.toHaveBeenCalled();
		// Upstream reads `input.value` straight after `fireEvent.blur`, which is
		// synchronous in React. The revert here rides a `$state` write, so the
		// read is retried until the effect has flushed — same assertion, awaited.
		await vi.waitFor(() => {
			expect(input.value).toBe('42');
		});
	});
});

/**
 * Upstream's sibling `describe('NumberInput statusVariant forwarding')`. Two
 * cases arrived with 0.2.0's `statusVariant` plumbing (not carried over when
 * this file was first ported against 0.1.9) and two with 0.3.0's wheel guard.
 *
 * The wheel cases restate upstream's `fireEvent.wheel` as a directly dispatched
 * `WheelEvent`: there is no vitest-browser wheel gesture that targets an element
 * without also scrolling, and the assertion is about propagation, not scrolling.
 * `wheel` is not one of the events Svelte delegates to the root, so the listener
 * is on the element and `stopPropagation` is observable at the ancestor exactly
 * as it is in React's synthetic tree.
 */
describe('NumberInput statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(NumberInput, {
			props: {
				label: 'Amount',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Must be positive' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(NumberInput, {
			props: {
				label: 'Amount',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Must be positive' },
				statusVariant: 'detached' as const
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});

	it('stops wheel propagation while focused so ancestor containers do not scroll', async () => {
		const onScrollableWheel = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange: noop }
		});
		screen.container.addEventListener('wheel', onScrollableWheel);
		const input = inputIn(screen.container);
		input.focus();
		input.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
		expect(onScrollableWheel).not.toHaveBeenCalled();
	});

	it('does not stop wheel propagation when the input is not focused', async () => {
		const onScrollableWheel = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange: noop }
		});
		screen.container.addEventListener('wheel', onScrollableWheel);
		const input = inputIn(screen.container);
		input.blur();
		input.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
		expect(onScrollableWheel).toHaveBeenCalledTimes(1);
	});
});
