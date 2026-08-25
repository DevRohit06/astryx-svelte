import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import TextInput from '$lib/components/text-input/text-input.svelte';
import IconSlotProbe from './fixtures/icon-slot-probe.svelte';
import BindHarness from './fixtures/text-input-bind.svelte';
import TextInputForm from './fixtures/text-input-form.svelte';
import TextInputGroupProbe from './fixtures/text-input-group-probe.svelte';

/**
 * Astryx's `TextInput/TextInput.test.tsx`, ported case for case — **all 74 of
 * upstream's 74** at the 0.5.0 pin, plus one beyond upstream (`supports two-way
 * bind:value`) that pins the `$bindable` decision. **75 `it` in the file.**
 * Re-derived at the 0.5.0 pin (the header last stated it at v0.4.5); upstream's
 * file has not moved since v0.4.1.
 * Sibling of `text-area.svelte.test.ts`, which solved the same translation
 * problems first; this file follows it.
 *
 * ## The 0.4.1 batch (61 → 74)
 *
 * Thirteen cases came with `isReadOnly` and the form-participation fix: the
 * `form participation` describe (3), the `isReadOnly` describe (6), and the two
 * theme-state describes at the bottom of the file (`data-disabled` /
 * `data-readonly` on the root target, 2 each). Two translations, noted at the
 * cases:
 *
 * - the six that read `FormData` go through `text-input-form.svelte`, because a
 *   Svelte test cannot pass a `<form>` as markup children of the component under
 *   test the way upstream's JSX does. Same fixture shape as
 *   `checkbox-input-form.svelte` and `number-input-form.svelte`.
 * - `hides the clear button` keeps upstream's *unnamed* `queryByRole('button')`.
 *   The clear affordance is the shared `InputClearButton` (a ghost `Button`)
 *   here, not the bare `<button>` upstream inlined at 0.3.0, so a query that
 *   matched the old markup shape would not survive; the role query does, and a
 *   read-only field renders no button at all.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "52 upstream cases, 52 here". Upstream had **61** at
 * v0.3.0; the nine that were absent are now here — the whole `TextInput statusVariant
 * forwarding` describe (the `attached`/`detached` pair plus the six
 * `statusVariant="tooltip"` cases) and `has no dangling aria-describedby ids
 * inside InputGroup (WCAG 1.3.1)`, which goes through the new
 * `text-input-group-probe.svelte` because a case cannot author the
 * `<InputGroup>` child inline. The tooltip cases read the open state with
 * `matches(':popover-open')` for the same environment reason the
 * `disabledMessage` block does.
 *
 * Upstream's `beforeEach` (`:20-43`) shims `showPopover`/`hidePopover` and
 * `:popover-open` because jsdom implements none of them, and its `h = {hidden:
 * true}` exists because a jsdom popover is not "visible" to the accessibility
 * tree. The browser project needs neither: Chromium has the Popover API, so the
 * open state is read with `matches(':popover-open')` — the same finding the
 * `Tooltip`, `TextArea`, and `Switch` ports already recorded. `{hidden: true}`
 * survives as `getByRole('tooltip', {includeHidden: true})`, since a *closed*
 * popover is `display:none` for real here.
 *
 * `startIcon` is a `Snippet` rather than `ReactNode | IconType` (this port has
 * no `renderIconSlot` — see port/todo.md), so the two cases that pass one go through
 * `icon-slot-probe.svelte`, which renders upstream's `TestIcon` markup verbatim
 * as a snippet. Both assert `querySelector('svg')`, which it satisfies exactly.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:101`)** — Svelte has no `ref` prop. `TextInput`
 *   spreads its rest props onto the `<input>`, so the mechanism a consumer
 *   actually uses — an attachment through the rest props — is available, and it
 *   checks more than upstream's: it receives the element rather than only
 *   proving a callback ran.
 *
 * `calls onChange with value and event when typing` is restated for the
 * `$bindable` decision: upstream's last call is `('i', …)` because React
 * re-asserts a controlled `value=""` onto the DOM between keystrokes, resetting
 * the field; with `value` now `$bindable()` the plain edit path commits
 * `value = newValue` locally, so the field accumulates and the last call is
 * `('Hi', …)`. The optimistic `changeAction` path deliberately does *not*
 * commit `value`, so its revert-on-settle is unaffected.
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

describe('TextInput', () => {
	it('renders with label', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop }
		});
		await expect.element(screen.getByLabelText('Name')).toBeInTheDocument();
	});

	it('renders with placeholder', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop, placeholder: 'Enter text' }
		});
		await expect.element(screen.getByPlaceholder('Enter text')).toBeInTheDocument();
	});

	it('calls onChange with value and event when typing', async () => {
		const handleChange = vi.fn();
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: handleChange }
		});

		const input = screen.getByRole('textbox');
		await userEvent.type(input, 'Hi');
		expect(handleChange).toHaveBeenCalledTimes(2);
		// Restated: upstream's last call is `('i', …)`, because React re-asserts
		// the controlled `value=""` onto the DOM between keystrokes so the second
		// lands in an emptied field. With `value` now `$bindable()`, the plain
		// edit path commits `value = newValue` locally, so the field accumulates
		// and the second call carries `'Hi'`. The substance of the case — that
		// `onChange` fires per keystroke with the field's value plus the event —
		// is asserted unchanged.
		expect(handleChange).toHaveBeenLastCalledWith('Hi', expect.any(Object));
	});

	it('supports two-way bind:value', async () => {
		// Beyond upstream, pinning the `$bindable` decision: a bound parent value
		// tracks typing, and a new value flows back down. React has no `bind:` and
		// no counterpart case; this exists so a regression to a non-bindable
		// `value` — which would silently stop `bind:value` from writing back — goes
		// red rather than passing unnoticed. Mirrors the `TextArea` port.
		const screen = await render(BindHarness, { props: { initial: 'ab' } });
		const input = screen.getByRole('textbox');
		await expect.element(input).toHaveValue('ab');

		await userEvent.type(input, 'c');
		await expect.element(screen.getByTestId('mirror')).toHaveTextContent('abc');
	});

	it('works with state setter function directly', async () => {
		const setValue = vi.fn();
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: setValue }
		});

		const input = screen.getByRole('textbox');
		await userEvent.type(input, 'A');
		expect(setValue).toHaveBeenCalledWith('A', expect.any(Object));
	});

	it('renders empty string when value is undefined', async () => {
		const screen = await render(TextInput, {
			// @ts-expect-error — testing runtime safety when value is omitted
			props: { label: 'Name', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveValue('');
	});

	it('displays controlled value', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: 'Controlled value', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveValue('Controlled value');
	});

	// Counterpart to upstream's `forwards ref correctly` (`:101`); see the file
	// header. Upstream asserts `expect.any(HTMLInputElement)`; this receives the
	// element itself, so the assertion is the stronger `toBe`.
	it('hands the input to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(TextInput, {
			props: {
				label: 'Name',
				value: '',
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(inputIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Search', isLabelHidden: true, value: '', onChange: noop }
		});
		const label = screen.getByText('Search');
		await expect.element(label).toBeInTheDocument();
		// Label should still be accessible
		await expect.element(screen.getByLabelText('Search')).toBeInTheDocument();
	});

	it('shows label visually by default', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Email', value: '', onChange: noop }
		});
		const label = screen.getByText('Email');
		await expect.element(label).toBeVisible();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Username', isRequired: true, value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
	});

	it('does not set aria-required when isRequired is false', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Username', value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
	});

	it('sets disabled attribute when isDisabled is true', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', isDisabled: true, value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toBeDisabled();
	});

	it('does not fire onChange when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(TextInput, {
			props: { label: 'Name', isDisabled: true, value: '', onChange: handleChange }
		});

		const input = inputIn(screen.container);
		// Restated: upstream types with `user.type`. Playwright's actionability
		// check refuses to type into a natively disabled element at all, which
		// would assert its heuristic rather than the component, so the keystrokes
		// are aimed at the control the only way a browser allows — a focus a
		// disabled element declines, followed by real key events. Nothing reaches
		// it, so nothing calls back and nothing changes.
		input.focus();
		expect(document.activeElement).not.toBe(input);
		await userEvent.keyboard('test');
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('is not disabled by default', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).not.toBeDisabled();
	});

	it('renders with startIcon', async () => {
		const screen = await render(IconSlotProbe, {
			props: {
				component: TextInput,
				slot: 'startIcon',
				rest: { label: 'Search', value: '', onChange: noop }
			}
		});
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();
		// Icon should be rendered (as an SVG element)
		const svg = screen.container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('renders without icon wrapper when startIcon is not provided', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop }
		});
		// No SVG should be present
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	describe('status prop', () => {
		it('renders with error status icon', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'error' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders with warning status icon', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'warning' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders with success status icon', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'success' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders status message when provided', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Email',
					value: '',
					onChange: noop,
					status: { type: 'error', message: 'Invalid email address' }
				}
			});
			await expect.element(screen.getByText('Invalid email address')).toBeInTheDocument();
		});

		it('has no dangling aria-describedby ids inside InputGroup (WCAG 1.3.1)', async () => {
			// Inside an InputGroup no Field renders, so the status message element
			// does not exist; aria-describedby must not reference its id.
			const screen = await render(TextInputGroupProbe, {
				props: {
					group: { label: 'Contact' },
					textInput: {
						label: 'Email',
						value: '',
						onChange: noop,
						status: { type: 'error', message: 'Invalid email address' }
					}
				}
			});
			const inputLoc = screen.getByRole('textbox');
			await expect.element(inputLoc).toBeInTheDocument();
			const describedBy = inputLoc.element().getAttribute('aria-describedby') ?? '';
			for (const idToken of describedBy.split(/\s+/).filter(Boolean)) {
				expect(document.getElementById(idToken)).not.toBeNull();
			}
		});

		it('does not render status message when not provided', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'error' } }
			});
			expect(screen.getByText(/invalid/i).query()).toBeNull();
		});

		it('sets aria-invalid when status type is error', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'error' } }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
		});

		it('does not set aria-invalid for warning status', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'warning' } }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
		});

		it('does not set aria-invalid for success status', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Email', value: '', onChange: noop, status: { type: 'success' } }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
		});

		it('includes status message in aria-describedby', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Email',
					value: '',
					onChange: noop,
					status: { type: 'error', message: 'Invalid email' }
				}
			});
			const input = inputIn(screen.container);
			const describedBy = input.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();
			// The status message should be reachable via the described-by ID
			const messageElement = screen.getByText('Invalid email').element();
			expect(messageElement).toHaveAttribute('id');
			expect(describedBy).toContain(messageElement.id);
		});
	});

	it('renders tooltip info icon when labelTooltip is provided', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Help', value: '', onChange: noop, labelTooltip: 'Helpful info' }
		});
		// Info icon should be present
		expect(screen.container.querySelector('svg')).toBeInTheDocument();
	});

	it('does not render tooltip icon when labelTooltip is not provided', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop }
		});
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	describe('hasAutoFocus prop', () => {
		it('focuses the input when hasAutoFocus is true', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, hasAutoFocus: true }
			});
			await expect.element(screen.getByRole('textbox')).toHaveFocus();
		});

		it('does not focus when hasAutoFocus is false', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop }
			});
			expect(inputIn(screen.container)).not.toHaveFocus();
		});
	});

	describe('htmlName prop', () => {
		it('sets name attribute when htmlName is provided', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, htmlName: 'username' }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
		});

		it('does not set name attribute when htmlName is not provided', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('name');
		});
	});

	// Upstream renders `<form><TextInput …/></form>` as JSX children of `render`.
	// A Svelte test cannot pass markup children to the component under test, so
	// the form lives in `text-input-form.svelte` and the cases reach it through
	// `container.querySelector('form')` — the assertions are upstream's verbatim.
	describe('form participation', () => {
		it('submits the value under htmlName', async () => {
			const screen = await render(TextInputForm, {
				props: {
					textInput: { label: 'Owner', htmlName: 'owner', value: 'alice', onChange: noop }
				}
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('owner')).toBe('alice');
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(TextInputForm, {
				props: {
					textInput: {
						label: 'Owner',
						htmlName: 'owner',
						value: 'alice',
						onChange: noop,
						isDisabled: true
					}
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});

		// Regression: a disabledMessage swaps the native `disabled` attribute for
		// aria-disabled + readOnly so the reason stays focus-discoverable, but
		// read-only fields still submit — the name has to be withheld too.
		it('is excluded from form data when disabled, even with a disabledMessage', async () => {
			const screen = await render(TextInputForm, {
				props: {
					textInput: {
						label: 'Owner',
						htmlName: 'owner',
						value: 'alice',
						onChange: noop,
						isDisabled: true,
						disabledMessage: 'You need the Editor role to change this'
					}
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});

	describe('isReadOnly', () => {
		it('marks the input read-only', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Owner', value: 'alice', onChange: noop, isReadOnly: true }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('readonly');
		});

		it('still submits its value with the form', async () => {
			const screen = await render(TextInputForm, {
				props: {
					textInput: {
						label: 'Owner',
						htmlName: 'owner',
						value: 'alice',
						onChange: noop,
						isReadOnly: true
					}
				}
			});
			expect(new FormData(screen.container.querySelector('form')!).get('owner')).toBe('alice');
		});

		it('does not call onChange when the user types', async () => {
			const handleChange = vi.fn();
			const screen = await render(TextInput, {
				props: { label: 'Owner', value: 'alice', onChange: handleChange, isReadOnly: true }
			});
			// Ported as upstream writes it — unlike the `isDisabled` cases, nothing
			// here trips Playwright's actionability check: a read-only input is
			// neither `disabled` nor `aria-disabled`, so `type` focuses it and sends
			// real keys. Chromium's editor refuses the insert, and the `oninput`
			// guard refuses the callback, so neither layer can mask the other.
			await userEvent.type(screen.getByRole('textbox'), 'xyz');
			expect(handleChange).not.toHaveBeenCalled();
		});

		it('stays focusable and is not disabled', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Owner', value: 'alice', onChange: noop, isReadOnly: true }
			});
			const input = screen.getByRole('textbox');
			await expect.element(input).not.toBeDisabled();
			await userEvent.tab();
			await expect.element(input).toHaveFocus();
		});

		it('hides the clear button', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: 'alice',
					onChange: noop,
					hasClear: true,
					isReadOnly: true
				}
			});
			// Upstream's *unnamed* `queryByRole('button')`, kept unnamed on purpose:
			// the clear affordance is the shared `InputClearButton` (a ghost
			// `Button`) here rather than the bare `<button>` upstream inlined, so a
			// query tied to the old markup would not survive the change — the role
			// query does, and a read-only field renders no button at all.
			expect(screen.getByRole('button').query()).toBeNull();
		});

		it('lets isDisabled win when both are set', async () => {
			const screen = await render(TextInputForm, {
				props: {
					textInput: {
						label: 'Owner',
						htmlName: 'owner',
						value: 'alice',
						onChange: noop,
						isReadOnly: true,
						isDisabled: true
					}
				}
			});
			await expect.element(screen.getByRole('textbox')).toBeDisabled();
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});

	describe('onEnter', () => {
		it('calls onEnter when Enter key is pressed', async () => {
			const handleEnter = vi.fn();
			const screen = await render(TextInput, {
				props: { label: 'Name', value: 'hello', onChange: noop, onEnter: handleEnter }
			});
			const input = screen.getByRole('textbox');
			await userEvent.click(input);
			await userEvent.keyboard('{Enter}');
			expect(handleEnter).toHaveBeenCalledTimes(1);
		});

		it('does not call onEnter for other keys', async () => {
			const handleEnter = vi.fn();
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, onEnter: handleEnter }
			});
			const input = screen.getByRole('textbox');
			await userEvent.click(input);
			await userEvent.keyboard('abc');
			expect(handleEnter).not.toHaveBeenCalled();
		});
	});

	describe('onKeyDown', () => {
		// Upstream names the prop `onKeyDown`; this port forwards it to the
		// `<input>` under its native lowercase name `onkeydown`.
		it('passes through onKeyDown events', async () => {
			const handleKeyDown = vi.fn();
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, onkeydown: handleKeyDown }
			});
			const input = screen.getByRole('textbox');
			await userEvent.click(input);
			await userEvent.keyboard('a');
			expect(handleKeyDown).toHaveBeenCalledTimes(1);
		});

		it('calls both onKeyDown and onEnter on Enter', async () => {
			const handleKeyDown = vi.fn();
			const handleEnter = vi.fn();
			const screen = await render(TextInput, {
				props: {
					label: 'Name',
					value: '',
					onChange: noop,
					onkeydown: handleKeyDown,
					onEnter: handleEnter
				}
			});
			const input = screen.getByRole('textbox');
			await userEvent.click(input);
			await userEvent.keyboard('{Enter}');
			expect(handleEnter).toHaveBeenCalledTimes(1);
			expect(handleKeyDown).toHaveBeenCalledTimes(1);
		});
	});

	describe('hasClear', () => {
		it('shows clear button when hasClear is true and value is non-empty', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: 'hello', onChange: noop, hasClear: true }
			});
			await expect.element(screen.getByRole('button', { name: 'Clear Name' })).toBeInTheDocument();
		});

		it('does not show clear button when value is empty', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, hasClear: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Name' }).query()).toBeNull();
		});

		it('does not show clear button when hasClear is false', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: 'hello', onChange: noop }
			});
			expect(screen.getByRole('button', { name: 'Clear Name' }).query()).toBeNull();
		});

		it('does not show clear button when disabled', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Name',
					value: 'hello',
					onChange: noop,
					hasClear: true,
					isDisabled: true
				}
			});
			expect(screen.getByRole('button', { name: 'Clear Name' }).query()).toBeNull();
		});

		it('calls onChange with empty string when clear is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(TextInput, {
				props: { label: 'Name', value: 'hello', onChange, hasClear: true }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear Name' }));
			expect(onChange).toHaveBeenCalledWith('', null);
		});
	});

	describe('click-to-focus', () => {
		it('focuses input when clicking the start icon', async () => {
			const screen = await render(IconSlotProbe, {
				props: {
					component: TextInput,
					slot: 'startIcon',
					rest: { label: 'Search', value: '', onChange: noop }
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
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop }
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

	describe('width prop (#2755)', () => {
		it('sizes the outer field, not just the input wrapper', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop, width: '100%' }
			});
			const input = inputIn(screen.container);
			const inputWrapper = wrapperOf(input);
			// Field root is the labelled ancestor that owns the width.
			const fieldRoot = input.closest('.astryx-field') as HTMLElement;
			expect(fieldRoot).toBeTruthy();
			expect(fieldRoot.getAttribute('style')).toContain('100%');
			// The inner control wrapper is not the element carrying the width.
			expect(fieldRoot).not.toBe(inputWrapper);
			expect(inputWrapper.getAttribute('style') ?? '').not.toContain('100%');
		});

		it('does not set width when the prop is omitted', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Name', value: '', onChange: noop }
			});
			const fieldRoot = inputIn(screen.container).closest('.astryx-field') as HTMLElement;
			expect(fieldRoot.getAttribute('style') ?? '').not.toContain('100%');
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: '',
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
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: '',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('textbox')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: '',
					onChange: noop,
					disabledMessage: 'You need the Editor role'
				}
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Owner', value: '', onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: '',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const input = screen.getByRole('textbox');
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
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: '',
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
			const screen = await render(TextInput, {
				props: {
					label: 'Owner',
					value: '',
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
			await userEvent.keyboard('hello');
			expect(onChange).not.toHaveBeenCalled();
			expect(input).toHaveValue('');
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(TextInput, {
				props: { label: 'Owner', value: '', onChange: noop, isDisabled: true }
			});
			const input = screen.getByRole('textbox');
			await expect.element(input).toBeDisabled();
			await expect.element(input).not.toHaveAttribute('aria-disabled');
		});
	});
});

describe('TextInput statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'detached'
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});

	it('renders no message box for statusVariant="tooltip"', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'tooltip'
			}
		});
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();
		expect(screen.container.querySelector('.astryx-field-status')).not.toBeInTheDocument();
	});

	it('surfaces the status message in a tooltip for statusVariant="tooltip"', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'tooltip'
			}
		});
		const tooltip = screen.getByRole('tooltip', { includeHidden: true });
		await expect.element(tooltip).toHaveTextContent('Invalid email');
	});

	it('describes the input by the status tooltip for statusVariant="tooltip"', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'tooltip'
			}
		});
		const inputLoc = screen.getByRole('textbox');
		await expect.element(inputLoc).toBeInTheDocument();
		const input = inputLoc.element();
		const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
		expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
	});

	it('renders the tooltip status affordance as a focusable button (WCAG 2.1.1)', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'tooltip'
			}
		});
		// The status affordance is a real button with an accessible name naming
		// the status type (WCAG 4.1.2), so keyboard-only users (no AT) can reach it.
		const statusButton = screen.getByRole('button', { name: /error details/i });
		await expect.element(statusButton).toBeInTheDocument();
		await expect.element(statusButton).toHaveAttribute('type', 'button');
	});

	it('opens the status tooltip on keyboard focus for statusVariant="tooltip"', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'tooltip'
			}
		});
		const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
		// Tab from the input to the status button; keyboard focus reveals the tip.
		await userEvent.tab();
		await userEvent.tab();
		await vi.waitFor(() => {
			// `:popover-open` rather than upstream's `popover-open` attribute, which
			// its jsdom shim invents; Chromium has the real thing.
			expect(tooltip.matches(':popover-open')).toBe(true);
		});
	});

	it('describes the status button by the tooltip content for statusVariant="tooltip"', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Email',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Invalid email' },
				statusVariant: 'tooltip'
			}
		});
		const buttonLoc = screen.getByRole('button', { name: /error details/i });
		await expect.element(buttonLoc).toBeInTheDocument();
		const statusButton = buttonLoc.element();
		const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
		expect(statusButton.getAttribute('aria-describedby')).toContain(tooltip.id);
	});
});

describe('TextInput disabled theme state', () => {
	// Reflecting isDisabled on the root theming target lets a theme gate its own
	// hover/border treatment on disabled (data-disabled + a .disabled variant),
	// mirroring how status is reflected — without structural :has() CSS.
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-text-input');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-text-input');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});

describe('TextInput readonly theme state', () => {
	it('reflects readonly on the root target so themes can gate paint on it', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop, isReadOnly: true }
		});
		const root = screen.container.querySelector('.astryx-text-input');
		expect(root).toHaveAttribute('data-readonly', 'readonly');
	});

	it('omits data-readonly when editable', async () => {
		const screen = await render(TextInput, {
			props: { label: 'Name', value: '', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-text-input');
		expect(root).not.toHaveAttribute('data-readonly');
	});
});
