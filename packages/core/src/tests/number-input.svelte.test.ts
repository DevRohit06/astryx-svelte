import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import NumberInput from '$lib/components/number-input/number-input.svelte';
import IconSlotProbe from './fixtures/icon-slot-probe.svelte';
import NumberInputForm from './fixtures/number-input-form.svelte';
import NumberInputGroupProbe from './fixtures/number-input-group-probe.svelte';

/**
 * Astryx's `NumberInput/NumberInput.test.tsx`, ported case for case. Upstream at
 * the **0.5.0** pin declares **117** blocks producing **122 cases** — 116 `it(`s
 * plus one `it.each` with six rows — and **113** are here.
 *
 * **The 4 blocks (9 cases) that are not here:**
 *
 * - **`does not step or commit on a composing keydown (IME)`**, added at
 *   v0.4.5. This one has been missing across two re-pins, because the header
 *   below stated its count against 0.4.1 and so never moved. It is portable
 *   now: `number-input.svelte` calls `isImeKeyEvent` in its keydown handler.
 * - **The whole 3-block `NumberInput stepper padding coupling` describe, added
 *   at 0.5.0** — `reads its padding from the public number-input padding
 *   tokens`, the six-row `it.each` `a themed padding reaches the steppers in
 *   every spelling` (the `padding` shorthand in one and two values, and the
 *   per-edge spellings), and `carries a themed border radius to the stepper
 *   column corners`. All three assert that the stepper column reads the *public*
 *   `--astryx-number-input-padding*` custom properties rather than a private
 *   copy, so porting them means checking that this port's stepper styles are
 *   keyed on the same public tokens.
 *
 * (This header read "Upstream at 0.4.1 has **113** `it(` cases and **113** are
 * here — nothing is dropped", true only at 0.4.1.)
 *
 * The 0.4.1 rewrite (#4896) turned the control into a *text-backed spinbutton*:
 * `type="text"` + `role="spinbutton"` + `inputmode`, with `aria-valuemin`/
 * `aria-valuemax`/`aria-valuenow`/`aria-valuetext` in place of the native
 * `min`/`max`/`step` attributes. Three consequences show up here:
 * - every value assertion is a **string** (`toHaveValue('456')`), where the
 *   `type="number"` era read numbers and `null`;
 * - our old `describe('native number input attributes')` (`sets min/max/step
 *   attribute`) is gone — those attributes no longer exist — and upstream's
 *   `describe('text-backed spinbutton attributes')` replaces it;
 * - the two Svelte-only wheel cases this file used to carry at the end of
 *   `describe('NumberInput statusVariant forwarding')` are superseded by
 *   upstream's own seven wheel cases in `describe('NumberInput stepping')` and
 *   have been folded into them rather than kept as duplicates.
 *
 * Sibling of `text-input.svelte.test.ts`, which solved the same translation
 * problems first; this file follows it wherever the two overlap.
 *
 * Upstream's `beforeEach` (`:29-52`) shims `showPopover`/`hidePopover` and
 * `:popover-open` because jsdom implements none of them, and its `h = {hidden:
 * true}` exists because a jsdom popover is not "visible" to the accessibility
 * tree. The browser project needs neither: Chromium has the Popover API, so the
 * open state is read with `matches(':popover-open')`. `{hidden: true}` survives
 * as `getByRole('tooltip', {includeHidden: true})`, since a *closed* popover is
 * `display:none` for real here. Upstream's `afterEach`
 * (`__resetLiveRegionsForTest`) has no counterpart either — the `useAnnounce`
 * singletons are per-page and `vitest-browser-svelte`'s `cleanup` unmounts them,
 * so the alert queries below are scoped to the render container instead.
 *
 * `startIcon` is a `Snippet` rather than `ReactNode | IconType` (this port has
 * no `renderIconSlot` — see port/todo.md), so the two cases that pass one go through
 * `icon-slot-probe.svelte`, which renders upstream's `TestIcon` markup verbatim
 * as a snippet. Both assert `querySelector('svg')`, which it satisfies exactly.
 *
 * Two upstream cases wrap the component in JSX a Svelte case cannot author, so
 * each gets a fixture of the shape the rest of the suite already uses:
 * `number-input-form.svelte` (`<form>`, for `describe('form participation')` and
 * the two `isReadOnly` cases that read `FormData`) and
 * `number-input-group-probe.svelte` (`<InputGroup>`, for the dangling-ids case).
 *
 * Upstream's `onFocus`/`onBlur`/`onKeyDown` are `onfocus`/`onblur`/`onkeydown`
 * here — they compose with the `<input>`'s own handlers, so they take the native
 * lowercase names. Upstream's `onChange` is React's `onChange` on an input,
 * which *is* the native `input` event; ours is bound to `oninput`, so it is
 * per-keystroke on both sides and the typing cases port unchanged.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:93`)** — Svelte has no `ref` prop, and this
 *   port omits it. `NumberInput` spreads its rest props onto the `<input>`, so
 *   the seam a consumer actually uses — an attachment through the rest props —
 *   does exist, and it checks more than upstream's: it receives the element
 *   rather than only proving a callback ran.
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
 * - every `fireEvent.change`/`focus`/`blur`/`keyDown`/`wheel` — vitest-browser
 *   has no `fireEvent`, so the same events are dispatched directly through the
 *   `changeValue`/`pressKey`/`fireWheel` helpers below.
 * - assertions that read the DOM straight after a dispatched event are wrapped
 *   in `vi.waitFor`: React re-renders synchronously inside RTL's `act()`, while
 *   the write here rides a `$state` change flushed on a microtask. Same
 *   assertion, awaited.
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

function formIn(container: HTMLElement): HTMLFormElement {
	const el = container.querySelector('form');
	if (!(el instanceof HTMLFormElement)) {
		throw new Error('expected a form');
	}
	return el;
}

/**
 * Upstream's `fireEvent.change(input, {target: {value}})`.
 *
 * The `await tick()` is upstream's `act()`, not an extra step: RTL wraps every
 * `fireEvent` in `act()`, so React has re-rendered — and re-synchronised its
 * DOM value tracker — before the `blur`/`keyDown` that follows. Svelte flushes
 * template effects on a microtask, so without the tick both events land in one
 * flush, `displayValue` never observably passes through the typed string, and
 * the "unchanged since last flush" short-circuit leaves the field alone. That is
 * an artefact of dispatching two events in the same task; a real user's input
 * and blur are always separated by at least one.
 */
async function changeValue(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await tick();
}

/** Upstream's `fireEvent.keyDown(input, {key})`. Cancelable, so `preventDefault` reads back. */
function pressKey(input: HTMLInputElement, key: string): void {
	input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/**
 * Upstream's `fireEvent.wheel(input, {…})`. The event is returned so a case can
 * assert on `defaultPrevented`, which is what upstream's `new WheelEvent(…)` +
 * `fireEvent(input, event)` pairs are for.
 *
 * `wheel` is not one of the events Svelte delegates to the root, and the
 * component attaches its own non-passive native listener, so `stopPropagation`
 * is observable at an ancestor exactly as it is in React's synthetic tree.
 */
function fireWheel(input: HTMLInputElement, init: WheelEventInit): WheelEvent {
	const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
	input.dispatchEvent(event);
	return event;
}

/**
 * Upstream's `<div onWheel={onScrollableWheel}>` ancestor — a scrollable parent
 * that must still see the gesture whenever the input declines it. The listener
 * goes on the render container, which is the only ancestor a Svelte case can
 * wrap the component in without a fixture.
 */
function watchAncestorWheel(container: HTMLElement) {
	const spy = vi.fn();
	container.addEventListener('wheel', spy);
	return spy;
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

	it('displays the controlled value as editable text', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: 456, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveValue('456');
	});

	it('displays an empty string for a null value', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveValue('');
	});

	it('displays an empty string for an undefined value', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: undefined, onChange: noop }
		});
		await expect.element(screen.getByRole('spinbutton')).toHaveValue('');
	});

	// Counterpart to upstream's `forwards ref correctly` (`:93`); see the file
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

	/**
	 * Replaces this file's old `describe('native number input attributes')` — the
	 * `min`/`max`/`step` attributes it asserted no longer exist at 0.4.1, because
	 * there is no `type="number"` left for a UA to enforce them.
	 */
	describe('text-backed spinbutton attributes', () => {
		it('uses a text input with decimal input mode by default', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Price', value: 5, onChange: noop }
			});
			const input = screen.getByRole('spinbutton');
			await expect.element(input).toHaveAttribute('type', 'text');
			await expect.element(input).toHaveAttribute('inputmode', 'decimal');
		});

		it('uses numeric input mode for integer-only values', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Count', value: 5, onChange: noop, isIntegerOnly: true }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'numeric');
		});

		it('exposes the minimum through spinbutton ARIA', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: null, onChange: noop, min: 0 }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuemin', '0');
		});

		it('exposes the maximum through spinbutton ARIA', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: null, onChange: noop, max: 120 }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuemax', '120');
		});

		it('exposes the current value through spinbutton ARIA', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Age', value: 42, onChange: noop }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '42');
		});
	});

	describe('formatted display values', () => {
		it('shows the formatted value at rest and exposes it to assistive technology', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Revenue',
					value: 1234,
					onChange: noop,
					formatValue: (number: number) => `$${number.toLocaleString('en-US')}`
				}
			});
			const input = screen.getByRole('spinbutton');
			await expect.element(input).toHaveValue('$1,234');
			await expect.element(input).toHaveAttribute('aria-valuetext', '$1,234');
			await expect.element(input).toHaveAttribute('aria-valuenow', '1234');
		});

		it('shows the raw numeric value while focused and restores formatting on blur', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Revenue',
					value: 1234,
					onChange: noop,
					formatValue: (number: number) => `$${number.toLocaleString('en-US')}`
				}
			});
			const input = inputIn(screen.container);

			// Upstream's `fireEvent.focus`/`fireEvent.blur`, dispatched directly: the
			// component reads the focus state it keeps itself, not `activeElement`.
			input.dispatchEvent(new FocusEvent('focus'));
			await vi.waitFor(() => {
				expect(input.value).toBe('1234');
			});

			input.dispatchEvent(new FocusEvent('blur'));
			await vi.waitFor(() => {
				expect(input.value).toBe('$1,234');
			});
		});

		it('preserves invalid pending text while focused, then restores the formatted true value', async () => {
			const onChange = vi.fn();
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 3,
					onChange,
					isIntegerOnly: true,
					formatValue: (number: number) => `${number} items`
				}
			});
			const input = inputIn(screen.container);

			input.dispatchEvent(new FocusEvent('focus'));
			await changeValue(input, '3.5');
			expect(input).toHaveValue('3.5');
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
			expect(onChange).not.toHaveBeenCalledWith(3.5);

			input.dispatchEvent(new FocusEvent('blur'));
			await vi.waitFor(() => {
				expect(input.value).toBe('3 items');
			});
		});

		it('does not call the formatter for an empty value', async () => {
			const formatValue = vi.fn((number: number) => String(number));
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: null, onChange: noop, formatValue }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveValue('');
			expect(formatValue).not.toHaveBeenCalled();
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

		it('includes the units text in the accessible description (WCAG 1.3.1)', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Storage', value: 50, onChange: noop, units: 'GB' }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAccessibleDescription(/GB/);
		});

		it('combines units with the description in the accessible description', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Discount',
					value: 10,
					onChange: noop,
					description: 'Applied at checkout',
					units: '%'
				}
			});
			const input = screen.getByRole('spinbutton');
			await expect.element(input).toHaveAccessibleDescription(/Applied at checkout/);
			await expect.element(input).toHaveAccessibleDescription(/%/);
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

		it('has no dangling aria-describedby ids inside InputGroup (WCAG 1.3.1)', async () => {
			// Inside an InputGroup no Field renders, so the status message element
			// does not exist; aria-describedby must not reference its id.
			const screen = await render(NumberInputGroupProbe, {
				props: {
					group: { label: 'Price' },
					numberInput: {
						label: 'Amount',
						value: null,
						onChange: noop,
						status: { type: 'error', message: 'Value must be positive' }
					}
				}
			});
			const inputLoc = screen.getByRole('spinbutton');
			await expect.element(inputLoc).toBeInTheDocument();
			const describedBy = inputLoc.element().getAttribute('aria-describedby') ?? '';
			for (const idToken of describedBy.split(/\s+/).filter(Boolean)) {
				expect(document.getElementById(idToken)).not.toBeNull();
			}
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

	/**
	 * Upstream renders `<form>` as JSX children of `render`; ours goes through
	 * `number-input-form.svelte`. Every assertion is on `FormData`, deliberately
	 * *not* on `getAttribute('value')`: Svelte's `remove_input_defaults` strips
	 * the `value` attribute from the hidden input and keeps only the property,
	 * which is what `FormData` reads anyway.
	 */
	describe('form participation', () => {
		it('submits the value under htmlName', async () => {
			const screen = await render(NumberInputForm, {
				props: {
					numberInput: { label: 'Quantity', htmlName: 'quantity', value: 42, onChange: noop }
				}
			});
			const data = new FormData(formIn(screen.container));
			expect(data.get('quantity')).toBe('42');
		});

		it('submits the raw number instead of the formatted display value', async () => {
			const screen = await render(NumberInputForm, {
				props: {
					numberInput: {
						label: 'Revenue',
						htmlName: 'revenue',
						value: 1234,
						onChange: noop,
						formatValue: (number: number) => `$${number.toLocaleString('en-US')}`
					}
				}
			});
			const data = new FormData(formIn(screen.container));
			expect(data.get('revenue')).toBe('1234');
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(NumberInputForm, {
				props: {
					numberInput: {
						label: 'Quantity',
						htmlName: 'quantity',
						value: 42,
						onChange: noop,
						isDisabled: true
					}
				}
			});
			expect([...new FormData(formIn(screen.container)).keys()]).toEqual([]);
		});

		// Regression: a disabledMessage swaps the native `disabled` attribute for
		// aria-disabled + readOnly so the reason stays focus-discoverable, but
		// read-only fields still submit — the name has to be withheld too.
		it('is excluded from form data when disabled, even with a disabledMessage', async () => {
			const screen = await render(NumberInputForm, {
				props: {
					numberInput: {
						label: 'Quantity',
						htmlName: 'quantity',
						value: 42,
						onChange: noop,
						isDisabled: true,
						disabledMessage: 'Quantity is fixed by the contract'
					}
				}
			});
			expect([...new FormData(formIn(screen.container)).keys()]).toEqual([]);
		});
	});

	describe('isReadOnly', () => {
		it('marks the input read-only', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 42, onChange: noop, isReadOnly: true }
			});
			await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('readonly');
		});

		it('still submits its value with the form', async () => {
			const screen = await render(NumberInputForm, {
				props: {
					numberInput: {
						label: 'Quantity',
						htmlName: 'quantity',
						value: 42,
						onChange: noop,
						isReadOnly: true
					}
				}
			});
			expect(new FormData(formIn(screen.container)).get('quantity')).toBe('42');
		});

		it('does not call onChange when the user types', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 42, onChange: handleChange, isReadOnly: true }
			});
			await userEvent.type(screen.getByRole('spinbutton'), '7');
			expect(handleChange).not.toHaveBeenCalled();
		});

		it('stays focusable and is not disabled', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 42, onChange: noop, isReadOnly: true }
			});
			const input = screen.getByRole('spinbutton');
			await expect.element(input).not.toBeDisabled();
			await userEvent.tab();
			await expect.element(input).toHaveFocus();
		});

		it('hides the clear button', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 42,
					onChange: noop,
					hasClear: true,
					isReadOnly: true
				}
			});
			expect(screen.getByRole('button').query()).toBeNull();
		});

		it('does not step on ArrowUp or ArrowDown', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 42, onChange: handleChange, isReadOnly: true }
			});
			const input = inputIn(screen.container);
			input.focus();
			await userEvent.keyboard('{ArrowUp}{ArrowDown}');
			expect(handleChange).not.toHaveBeenCalled();
			expect(input).toHaveValue('42');
		});

		it('leaves wheel scrolling to the page instead of stepping', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 42, onChange: handleChange, isReadOnly: true }
			});
			const onScrollableWheel = watchAncestorWheel(screen.container);
			const input = inputIn(screen.container);
			input.focus();
			const event = fireWheel(input, { deltaY: -100 });

			expect(handleChange).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(false);
			expect(onScrollableWheel).toHaveBeenCalledTimes(1);
		});

		it('disables both number steppers', async () => {
			const handleChange = vi.fn();
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 42,
					onChange: handleChange,
					hasNumberSteppers: true,
					isReadOnly: true
				}
			});
			const increment = screen.getByRole('button', { name: 'Increment Quantity' });
			await expect.element(increment).toBeDisabled();
			await expect
				.element(screen.getByRole('button', { name: 'Decrement Quantity' }))
				.toBeDisabled();

			// Upstream's `fireEvent.click` on a disabled button, dispatched directly:
			// Playwright's click waits for the element to become enabled and would
			// time out instead of exercising the guard.
			increment.element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(handleChange).not.toHaveBeenCalled();
		});

		it('lets isDisabled win when both are set', async () => {
			const screen = await render(NumberInputForm, {
				props: {
					numberInput: {
						label: 'Quantity',
						htmlName: 'quantity',
						value: 42,
						onChange: noop,
						isReadOnly: true,
						isDisabled: true
					}
				}
			});
			await expect.element(screen.getByRole('spinbutton')).toBeDisabled();
			expect([...new FormData(formIn(screen.container)).keys()]).toEqual([]);
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
			expect(input).toHaveValue('5');
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
 * `fireEvent.change(input, {target: {value: ''}})` is the shared `changeValue`
 * helper (an assignment plus a bubbling `input` event — React's `onChange` on an
 * input *is* the native `input` event, which is what this port binds),
 * `fireEvent.blur` a `blur` event, and `fireEvent.keyDown` a bubbling `keydown`.
 * Real typing cannot substitute: the point of each case is a field emptied
 * without the clear button.
 */
describe('keyboard clearing with hasClear (#3599)', () => {
	it('commits null when the input is emptied and blurred', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', hasClear: true, value: 42, onChange }
		});
		const input = inputIn(screen.container);
		await changeValue(input, '');
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('commits null when the input is emptied and Enter is pressed', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', hasClear: true, value: 42, onChange }
		});
		const input = inputIn(screen.container);
		await changeValue(input, '');
		pressKey(input, 'Enter');
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('does not fire when emptied and blurred with no prior value', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', hasClear: true, value: null, onChange }
		});
		const input = inputIn(screen.container);
		await changeValue(input, '');
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('still reverts on blur when hasClear is not set', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Qty', value: 42, onChange }
		});
		const input = inputIn(screen.container);
		await changeValue(input, '');
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
});

/**
 * 0.4.1's stepping suite. Upstream leaves `value` fixed across each case and
 * spies on `onChange` — the component is strictly controlled and never writes
 * its own prop, so a step from a `value={5}` that never updates always starts
 * from 5. Ours does the same, which is why the arrow-key cases can assert
 * `toHaveBeenLastCalledWith` twice against one render.
 *
 * `rerender` merges props rather than replacing them, so a case reproducing an
 * upstream prop set that *drops* a prop passes it back as `undefined`.
 */
describe('NumberInput stepping', () => {
	it('increments with ArrowUp and decrements with ArrowDown', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange }
		});
		const input = inputIn(screen.container);

		pressKey(input, 'ArrowUp');
		expect(onChange).toHaveBeenLastCalledWith(6);

		pressKey(input, 'ArrowDown');
		expect(onChange).toHaveBeenLastCalledWith(4);
	});

	it('lets onKeyDown cancel keyboard stepping', async () => {
		const onChange = vi.fn();
		// Upstream's `onKeyDown`; lowercase here because it composes onto the
		// `<input>`. In the unmodified-arrow branch it fires *before* the step, so
		// `preventDefault()` abandons it — and the early return is what keeps it
		// firing exactly once.
		const onkeydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange, onkeydown }
		});
		pressKey(inputIn(screen.container), 'ArrowUp');

		expect(onkeydown).toHaveBeenCalledTimes(1);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('uses decimal-safe step arithmetic', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 0.2, onChange, step: 0.1 }
		});
		pressKey(inputIn(screen.container), 'ArrowUp');
		expect(onChange).toHaveBeenCalledWith(0.3);
	});

	it('aligns an off-step value in the requested direction', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 0.25, onChange, step: 0.1 }
		});
		const input = inputIn(screen.container);

		pressKey(input, 'ArrowUp');
		expect(onChange).toHaveBeenLastCalledWith(0.3);

		pressKey(input, 'ArrowDown');
		expect(onChange).toHaveBeenLastCalledWith(0.2);
	});

	it('starts an empty value at the relevant boundary', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: null, onChange, min: 2 }
		});
		pressKey(inputIn(screen.container), 'ArrowUp');
		expect(onChange).toHaveBeenLastCalledWith(2);

		// `min: undefined` reproduces upstream's second prop set, which has no
		// `min` at all — `rerender` merges.
		await screen.rerender({ min: undefined, max: 8 });
		pressKey(inputIn(screen.container), 'ArrowDown');
		expect(onChange).toHaveBeenLastCalledWith(8);
	});

	it('keeps generated values integral when isIntegerOnly is set', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: null, onChange, min: 2.5, isIntegerOnly: true }
		});
		pressKey(inputIn(screen.container), 'ArrowUp');
		expect(onChange).toHaveBeenCalledWith(3);
	});

	it('does not step past min or max', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 10, onChange, min: 0, max: 10 }
		});
		pressKey(inputIn(screen.container), 'ArrowUp');
		expect(onChange).not.toHaveBeenCalled();

		await screen.rerender({ value: 0 });
		pressKey(inputIn(screen.container), 'ArrowDown');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('allows wheel stepping by default and consumes the focused gesture', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange }
		});
		const onScrollableWheel = watchAncestorWheel(screen.container);
		const input = inputIn(screen.container);
		input.focus();
		const event = fireWheel(input, { deltaY: -100 });

		expect(onChange).toHaveBeenCalledWith(6);
		expect(event.defaultPrevented).toBe(true);
		expect(onScrollableWheel).not.toHaveBeenCalled();
	});

	it('leaves wheel scrolling alone when isWheelEnabled is false', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange, isWheelEnabled: false }
		});
		const onScrollableWheel = watchAncestorWheel(screen.container);
		const input = inputIn(screen.container);
		input.focus();
		const event = fireWheel(input, { deltaY: -100 });

		expect(onChange).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
		expect(onScrollableWheel).toHaveBeenCalledTimes(1);
	});

	it('updates the wheel listener when isWheelEnabled changes', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange, isWheelEnabled: false }
		});
		const onScrollableWheel = watchAncestorWheel(screen.container);
		const input = inputIn(screen.container);
		input.focus();

		await screen.rerender({ isWheelEnabled: true });
		fireWheel(input, { deltaY: -100 });
		expect(onChange).toHaveBeenCalledWith(6);
		expect(onScrollableWheel).not.toHaveBeenCalled();

		onChange.mockClear();
		await screen.rerender({ isWheelEnabled: false });
		fireWheel(input, { deltaY: -100 });
		expect(onChange).not.toHaveBeenCalled();
		expect(onScrollableWheel).toHaveBeenCalledTimes(1);
	});

	it('leaves wheel scrolling alone when the input is not focused', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange }
		});
		const onScrollableWheel = watchAncestorWheel(screen.container);
		const input = inputIn(screen.container);
		const event = fireWheel(input, { deltaY: 100 });

		expect(onChange).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
		expect(onScrollableWheel).toHaveBeenCalledTimes(1);
	});

	it('leaves modified wheel gestures alone', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: { label: 'Amount', value: 5, onChange }
		});
		const onScrollableWheel = watchAncestorWheel(screen.container);
		const input = inputIn(screen.container);
		input.focus();
		fireWheel(input, { deltaY: -100, ctrlKey: true });

		expect(onChange).not.toHaveBeenCalled();
		expect(onScrollableWheel).toHaveBeenCalledTimes(1);
	});

	it('leaves wheel scrolling alone when the input is aria-disabled', async () => {
		const onChange = vi.fn();
		const screen = await render(NumberInput, {
			props: {
				label: 'Amount',
				value: 5,
				onChange,
				isDisabled: true,
				disabledMessage: 'This value is locked'
			}
		});
		const onScrollableWheel = watchAncestorWheel(screen.container);
		const input = inputIn(screen.container);
		input.focus();
		fireWheel(input, { deltaY: -100 });

		expect(onChange).not.toHaveBeenCalled();
		expect(onScrollableWheel).toHaveBeenCalledTimes(1);
	});

	describe('hasNumberSteppers', () => {
		it('does not show stepper buttons by default', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 5, onChange: noop }
			});
			expect(screen.getByRole('button', { name: 'Increment Quantity' }).query()).toBeNull();
			expect(screen.getByRole('button', { name: 'Decrement Quantity' }).query()).toBeNull();
		});

		it('shows localized increment and decrement buttons when enabled', async () => {
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 5, onChange: noop, hasNumberSteppers: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Increment Quantity' }))
				.toHaveAttribute('tabindex', '-1');
			await expect
				.element(screen.getByRole('button', { name: 'Decrement Quantity' }))
				.toHaveAttribute('tabindex', '-1');
		});

		it('steps the value and returns focus to the input', async () => {
			const onChange = vi.fn();
			const screen = await render(NumberInput, {
				props: { label: 'Quantity', value: 5, onChange, hasNumberSteppers: true }
			});
			const input = inputIn(screen.container);

			// Upstream's `fireEvent.click`, dispatched directly rather than driven
			// through Playwright: the steppers suppress focus on `pointerdown` and
			// hand it to the input from the click handler, so a real pointer would
			// add a focus round-trip the case is not about.
			screen
				.getByRole('button', { name: 'Increment Quantity' })
				.element()
				.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(onChange).toHaveBeenLastCalledWith(6);
			expect(input).toHaveFocus();

			screen
				.getByRole('button', { name: 'Decrement Quantity' })
				.element()
				.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(onChange).toHaveBeenLastCalledWith(4);
			expect(input).toHaveFocus();
		});

		it('disables only the stepper at the reached boundary', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 10,
					onChange: noop,
					min: 0,
					max: 10,
					hasNumberSteppers: true
				}
			});
			await expect
				.element(screen.getByRole('button', { name: 'Increment Quantity' }))
				.toBeDisabled();
			await expect
				.element(screen.getByRole('button', { name: 'Decrement Quantity' }))
				.not.toBeDisabled();
		});

		it('disables both steppers with the input', async () => {
			const screen = await render(NumberInput, {
				props: {
					label: 'Quantity',
					value: 5,
					onChange: noop,
					hasNumberSteppers: true,
					isDisabled: true
				}
			});
			await expect
				.element(screen.getByRole('button', { name: 'Increment Quantity' }))
				.toBeDisabled();
			await expect
				.element(screen.getByRole('button', { name: 'Decrement Quantity' }))
				.toBeDisabled();
		});
	});
});

describe('NumberInput disabled theme state', () => {
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-number-input');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-number-input');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});

describe('NumberInput readonly theme state', () => {
	it('reflects readonly on the root target so themes can gate paint on it', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Qty', value: 1, onChange: noop, isReadOnly: true }
		});
		const root = screen.container.querySelector('.astryx-number-input');
		expect(root).toHaveAttribute('data-readonly', 'readonly');
	});

	it('omits data-readonly when editable', async () => {
		const screen = await render(NumberInput, {
			props: { label: 'Qty', value: 1, onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-number-input');
		expect(root).not.toHaveAttribute('data-readonly');
	});
});
