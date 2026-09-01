/** PORTS: TimeInput/TimeInput.test.tsx */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import TimeInput from '$lib/components/time-input/time-input.svelte';
import type { ISOTimeString } from '$lib/utils/time-parser.js';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import TimeInputGroupProbe from './fixtures/time-input-group-probe.svelte';
import TimeInputI18n from './fixtures/time-input-i18n.svelte';

/**
 * Astryx's `TimeInput/TimeInput.test.tsx`, ported case for case — **44 of
 * upstream's 45** at the **0.5.0** pin (26 directly in `describe('TimeInput')`, 6 in the
 * nested `describe('InputGroup integration')` — the last two of which are the
 * grouped-status/live-region pair — 9 in `describe('disabledMessage')`, 2 in the
 * top-level `describe('TimeInput statusVariant forwarding')` and 2 in
 * `describe('TimeInput disabled theme state')`). There is no `displayName` case,
 * no snapshot and no no-JSX construction form in the file, so nothing is
 * React-only except the ref case, which gets a counterpart.
 *
 * ## ONE CASE IS MISSING — its blocker is gone, the case is simply unported
 *
 * **`does not step the time on a composing ArrowUp/ArrowDown (IME)`**
 * (upstream `:45`) is NOT here. It is not droppable — nothing about it is
 * React-only — and it now has no obstacle either.
 *
 * **The stated reason expired.** This section used to read *"it would fail if
 * written, because `time-input.svelte`'s `handleInputKeyDown` (`:445`) has no
 * `isImeKeyEvent` guard"*, and named `date-time-input`, `date-input` and
 * `selector` as blocked on the same defect. `time-input.svelte`'s
 * `handleInputKeyDown` calls `isImeKeyEvent` now, and so do the keydown
 * handlers in all three of those components. The case transcribes from upstream
 * unchanged whenever someone writes it.
 *
 * ## The count, re-derived at the 0.5.0 pin
 *
 * This header read "**44** … at v0.4.1, **44 here, none dropped**" and stayed
 * true only until the pin moved: 0.4.x added the IME case above, so the header
 * was hiding a one-case gap. Upstream's file is unchanged between v0.4.5 and
 * 0.5.0, so the 45 and the block breakdown above carry over intact.
 *
 * ## v0.3.0 → v0.4.1
 *
 * Five cases were added upstream and are all here:
 * `resolves the invalid-time announcement from the i18n catalog` (the hardcoded
 * "Invalid time" became `t('@astryx.timeInput.invalidTime')`), the two
 * `politely announces the new time after Arrow…` stepping cases (the new
 * `announce(formatDisplayTime(…))` call on ArrowUp/ArrowDown), and the two
 * `TimeInput disabled theme state` cases (`themeProps` now reflects
 * `disabled: isDisabled ? 'disabled' : null`).
 *
 * ## The count, re-derived from the tag (an earlier header was wrong)
 *
 * This header once read "35 upstream cases … 35 here, none dropped". At v0.3.0
 * upstream had **39**, and all 39 were here: the `TimeInput statusVariant
 * forwarding` block and the two grouped-status/live-region cases (`keeps the
 * grouped status node role-free while announcing via the persistent region`,
 * `announces a grouped status message that appears after mount`) were ported
 * then. The live regions are a document-level singleton that outlives a render,
 * so the file resets them in `afterEach`, exactly as upstream's own `afterEach`
 * does.
 *
 * **Those last two fail, and the failure is the port's.** Upstream v0.3.0 moved
 * the grouped status node's announcement off the node itself and onto the
 * persistent `useAnnounce` regions (`TimeInput.tsx:386-396`, `:635`);
 * `time-input.svelte` still carries the pre-0.3.0 `role`/`aria-live` on that
 * node and never calls `useAnnounce`. Both cases keep upstream's assertions
 * unchanged — see the comments at each.
 *
 * Upstream's `disabledMessage` `beforeEach` (`:361-368`) shims
 * `showPopover`/`hidePopover` because jsdom implements neither, and its
 * `h = {hidden: true}` exists because a jsdom popover is not "visible" to the
 * accessibility tree. The browser project needs neither: Chromium has the real
 * Popover API, so the open state is read with `matches(':popover-open')` and
 * `{hidden: true}` survives as `getByRole('tooltip', {includeHidden: true})`,
 * since a *closed* popover really is `display:none` here. This is exactly the
 * arrangement `number-input.svelte.test.ts` set for the same nine-case block.
 *
 * `changeAction` never appears in the upstream file, so nothing here exercises
 * `createOptimistic`; and no case leans on the wall clock, so there is none to
 * pin. v0.4.1's two arrow-key stepping cases do assert on a result, but each
 * passes an explicit `value`, which is the branch that never reads `new Date()`
 * (the pre-existing `:456` arrow-key case still only asserts that `onChange` is
 * *not* called).
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:67`)** — Svelte has no `ref` prop and this
 *   port omits it. `TimeInput` spreads its rest props onto the `<input>`
 *   (`time-input.svelte:480`), so the seam a consumer actually uses — an
 *   attachment through the rest props — does exist, and it checks more than
 *   upstream's: it receives the element rather than only proving a callback ran.
 *
 * Restated, each noted at the case:
 * - every `getByDisplayValue(...)` — vitest-browser has no such locator, so the
 *   input is located by role and its value asserted with `toHaveValue`, which is
 *   the same question (`getByDisplayValue` matches on `element.value`).
 * - the four `fireEvent.change(input, {target: {value}})` cases — vitest-browser
 *   has no `fireEvent`, and the point of each is a whole value arriving at once
 *   rather than keystroke by keystroke, so the same native `input` event is
 *   dispatched directly (React's `onChange` on an input *is* that event, and it
 *   is what this port binds).
 * - the two click-to-focus cases and the tooltip hover case — upstream's
 *   `fireEvent.click`/`mouseEnter` target the wrapper and the icon container,
 *   which a real pointer at the wrapper's centre cannot do (the input is there),
 *   so the events are dispatched where upstream dispatches them.
 * - `keeps the input focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, not
 *   jest-dom's native-attribute one, and they disagree by design on exactly the
 *   `aria-disabled` this case requires.
 * - `blocks typing and arrow-key changes while focusable-disabled` — Playwright
 *   refuses to type into an `aria-disabled` element at all, which would assert
 *   its actionability heuristic rather than the component's guard.
 * - `does not render duplicate Field label chrome when grouped` — upstream's
 *   document-wide `document.querySelector('label')` is scoped to the render
 *   container, which is what RTL's freshly-cleaned `document` amounts to.
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

/**
 * Upstream's `fireEvent.change(input, {target: {value}})`. React's `onChange` on
 * an input *is* the native `input` event, which is what this port binds, so the
 * assignment plus a bubbling `input` event is the same event upstream fires.
 */
function changeValue(input: HTMLInputElement, value: string): void {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

const noop = (): void => {};

const iso = (value: string): ISOTimeString => value as ISOTimeString;

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}
function assertiveRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="assertive"]');
}

// Upstream's own top-level `afterEach`: `useAnnounce`'s live regions are a
// document-level singleton that outlives a render.
afterEach(() => {
	__resetLiveRegionsForTest();
});

describe('TimeInput', () => {
	it('renders with label', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});
		await expect.element(screen.getByLabelText('Time', { exact: true })).toBeInTheDocument();
	});

	it('renders with placeholder', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop, placeholder: 'Pick a time' }
		});
		await expect.element(screen.getByPlaceholder('Pick a time')).toBeInTheDocument();
	});

	// Restated: no `getByDisplayValue` locator exists here; `toHaveValue` on the
	// role-located input asks the same question of the same property.
	it('displays formatted time in 12h format', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveValue('2:30 PM');
	});

	it('displays formatted time in 24h format', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange: noop, hourFormat: '24h' }
		});
		await expect.element(screen.getByRole('textbox')).toHaveValue('14:30');
	});

	it('displays time with seconds', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30:45'), onChange: noop, hasSeconds: true }
		});
		await expect.element(screen.getByRole('textbox')).toHaveValue('2:30:45 PM');
	});

	// Counterpart to upstream's `forwards ref correctly` (`:67`); see the file
	// header. Upstream asserts `expect.any(HTMLInputElement)`; this receives the
	// element itself, so the assertion is the stronger `toBe`.
	it('hands the input to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop, [createAttachmentKey()]: attached }
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(inputIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', isLabelHidden: true, onChange: noop }
		});
		const label = screen.getByText('Time', { exact: true });
		await expect.element(label).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Time', { exact: true })).toBeInTheDocument();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', isRequired: true, onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
	});

	it('disables input when isDisabled is true', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', isDisabled: true, onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toBeDisabled();
	});

	it('shows clear button when hasClear is true and value exists', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange: noop, hasClear: true }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Clear Time', exact: true }))
			.toBeInTheDocument();
	});

	it('does not show clear button when value is empty', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop, hasClear: true }
		});
		expect(screen.getByRole('button', { name: 'Clear Time', exact: true }).query()).toBeNull();
	});

	it('calls onChange with undefined when clear button is clicked', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange, hasClear: true }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Clear Time', exact: true }));
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it('does not call onChange while typing invalid input', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange }
		});

		const input = screen.getByRole('textbox');
		await userEvent.click(input);
		await userEvent.type(input, 'invalid');

		// onChange should not be called while typing
		expect(onChange).not.toHaveBeenCalled();
	});

	it('reverts to previous value on blur when input is invalid', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange }
		});

		const input = screen.getByRole('textbox');
		await userEvent.click(input);
		await userEvent.clear(input);
		await userEvent.type(input, 'not a time');
		await userEvent.tab(); // blur

		// Should revert to the original value, not call onChange
		await expect.element(input).toHaveValue('2:30 PM');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('sets aria-invalid="true" when typed input is out of range', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});

		const input = screen.getByRole('textbox');
		changeValue(inputIn(screen.container), '25:99');

		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	it('does not set aria-invalid when typed input is a valid time', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});

		const input = screen.getByRole('textbox');
		changeValue(inputIn(screen.container), '3:45 pm');

		await expect.element(input).not.toHaveAttribute('aria-invalid');
	});

	it('announces an alert message when typed input is invalid', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});

		changeValue(inputIn(screen.container), '25:99');

		await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid time');
	});

	it('does not announce an alert message when input is valid', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});

		changeValue(inputIn(screen.container), '3:45 pm');

		await expect.element(screen.getByRole('alert')).toHaveTextContent('');
		expect(screen.getByText('Invalid time', { exact: true }).query()).toBeNull();
	});

	// New at v0.4.1: the live region's copy is `t('@astryx.timeInput.invalidTime')`
	// rather than a hardcoded English string.
	it('resolves the invalid-time announcement from the i18n catalog', async () => {
		const screen = await render(TimeInputI18n, {
			props: {
				locale: 'en',
				overrides: { en: { '@astryx.timeInput.invalidTime': 'Ungültige Zeit' } },
				label: 'Time',
				onChange: noop
			}
		});

		changeValue(inputIn(screen.container), '25:99');

		await expect.element(screen.getByRole('alert')).toHaveTextContent('Ungültige Zeit');
	});

	// Arrow-key stepping mutates a plain textbox programmatically, and screen
	// readers do not announce programmatic textbox changes — the new value must
	// be announced through the polite live region (WCAG 4.1.2).
	//
	// Restated only in how the key is delivered: vitest-browser has no
	// `fireEvent`, so upstream's `fireEvent.keyDown` is the same native event
	// dispatched at the input. `waitFor` is `vi.waitFor`; the announce sets the
	// region's text in a rAF callback, so it cannot be read synchronously.
	it('politely announces the new time after ArrowUp stepping', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange }
		});

		inputIn(screen.container).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
		);

		expect(onChange).toHaveBeenCalledWith('14:31');
		await vi.waitFor(() => {
			expect(politeRegion()).toHaveTextContent('2:31 PM');
		});
	});

	it('politely announces the new time after ArrowDown stepping', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', value: iso('14:30'), onChange }
		});

		inputIn(screen.container).dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
		);

		expect(onChange).toHaveBeenCalledWith('14:29');
		await vi.waitFor(() => {
			expect(politeRegion()).toHaveTextContent('2:29 PM');
		});
	});

	it('calls onChange on blur when input is valid', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange }
		});

		const input = screen.getByRole('textbox');
		await userEvent.click(input);
		await userEvent.type(input, '3:45 pm');
		await userEvent.tab(); // blur

		expect(onChange).toHaveBeenCalledWith('15:45');
	});

	it('calls onChange immediately when input becomes valid', async () => {
		const onChange = vi.fn();
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange }
		});

		const input = screen.getByRole('textbox');
		await userEvent.click(input);
		await userEvent.type(input, '3:45 pm');

		// onChange should be called immediately when input is valid, not waiting for blur
		expect(onChange).toHaveBeenCalledWith('15:45');
	});

	it('focuses input when clicking the clock icon', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});

		const input = inputIn(screen.container);
		const wrapper = wrapperOf(input);
		// The icon container is the first child div (before the input)
		const iconContainer = wrapper.querySelector(':scope > div') as HTMLElement;

		// Restated only in how the click is delivered: upstream's
		// `fireEvent.click(iconContainer)` sets the icon container as the event
		// target, which is the whole point — the container handler must delegate
		// focus from a non-interactive descendant. A real pointer click would have
		// to hit the icon's pixels.
		iconContainer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(input).toHaveFocus();
	});

	it('focuses input when clicking the wrapper padding', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});

		const input = inputIn(screen.container);
		const wrapper = wrapperOf(input);

		// As above: a real pointer at the wrapper's centre lands on the input,
		// which focuses natively and would pass the case without the delegation
		// ever running. Dispatching at the wrapper is upstream's event exactly.
		wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(input).toHaveFocus();
	});

	describe('InputGroup integration', () => {
		it('labels grouped TimeInput from the group and inner input labels', async () => {
			const screen = await render(TimeInputGroupProbe, {
				props: {
					group: { label: 'Schedule', description: 'Use local time' },
					timeInput: {
						label: 'Start time',
						isLabelHidden: true,
						value: iso('09:00'),
						onChange: noop
					}
				}
			});

			const groupLoc = screen.getByRole('group', { name: 'Schedule', exact: true });
			await expect.element(groupLoc).toBeInTheDocument();
			const group = groupLoc.element();
			const groupLabelID = group.getAttribute('aria-labelledby');
			const input = screen
				.getByRole('textbox', { name: 'Schedule Start time', exact: true })
				.element();
			const labelledByIDs = input.getAttribute('aria-labelledby')?.split(' ') ?? [];

			expect(labelledByIDs).toHaveLength(2);
			expect(labelledByIDs[0]).toBe(groupLabelID);
			expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Start time');
			expect(input).not.toHaveAttribute('aria-label');
			expect(input).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby')!);
		});

		it('includes group and local described-by content when grouped', async () => {
			const screen = await render(TimeInputGroupProbe, {
				props: {
					group: {
						label: 'Schedule',
						description: 'Use local time',
						status: { type: 'warning', message: 'Schedule is unusual' }
					},
					timeInput: {
						label: 'Start time',
						isLabelHidden: true,
						value: iso('09:00'),
						onChange: noop,
						description: 'Business hours only',
						status: { type: 'error', message: 'Start time is required' },
						isDisabled: true,
						disabledMessage: 'Time edits are locked'
					}
				}
			});

			const inputLoc = screen.getByRole('textbox', { name: 'Schedule Start time', exact: true });
			await expect.element(inputLoc).toBeInTheDocument();
			const input = inputLoc.element();
			const describedByIDs = input.getAttribute('aria-describedby')?.split(' ') ?? [];
			const describedText = describedByIDs
				.map((id) => document.getElementById(id)?.textContent)
				.join(' ');

			expect(describedText).toContain('Use local time');
			expect(describedText).toContain('Schedule is unusual');
			expect(describedText).toContain('Business hours only');
			expect(describedText).toContain('Start time is required');
			expect(describedText).toContain('Time edits are locked');
		});

		it('does not render duplicate Field label chrome when grouped', async () => {
			const screen = await render(TimeInputGroupProbe, {
				props: {
					group: { label: 'Schedule' },
					timeInput: {
						label: 'Start time',
						isLabelHidden: true,
						value: iso('09:00'),
						onChange: noop
					}
				}
			});

			await expect.element(screen.getByText('Schedule', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByText('Start time', { exact: true })).toBeInTheDocument();
			expect(screen.getByText('Start time', { exact: true }).element().tagName).toBe('SPAN');
			// Restated: scoped to the render container, which is what RTL's
			// freshly-cleaned `document` amounts to.
			expect(screen.container.querySelector('label')).toBeNull();
		});

		it('suppresses the local status icon when grouped', async () => {
			const screen = await render(TimeInputGroupProbe, {
				props: {
					group: { label: 'Schedule' },
					timeInput: {
						label: 'Start time',
						isLabelHidden: true,
						value: iso('09:00'),
						onChange: noop,
						status: { type: 'error' }
					}
				}
			});

			await expect
				.element(screen.getByRole('group', { name: 'Schedule', exact: true }))
				.toBeInTheDocument();
			// The clock icon remains, but the trailing status icon is suppressed in
			// grouped mode so the shared InputGroup border/status treatment is not
			// duplicated.
			expect(screen.container.querySelectorAll('svg')).toHaveLength(1);
		});

		// The grouped status node exists only for aria-describedby; announcing
		// happens through the persistent useAnnounce regions because a live
		// region mounted together with its content is not reliably announced.
		//
		// FAILING — a confirmed gap in the port, not in the case. Upstream
		// v0.3.0's `TimeInput.tsx:635` renders the grouped status node as a bare
		// `<VisuallyHidden as="div" id={statusMessageID}>` and announces through
		// a `useAnnounce()` effect (`:386-396`). `time-input.svelte:490-497`
		// still carries the pre-0.3.0 `role`/`aria-live` on that node and calls
		// `useAnnounce` nowhere, so the node has `role="alert"` and the
		// persistent region stays empty. The assertions below are upstream's,
		// unchanged.
		it('keeps the grouped status node role-free while announcing via the persistent region', async () => {
			const screen = await render(TimeInputGroupProbe, {
				props: {
					group: { label: 'Schedule' },
					timeInput: {
						label: 'Start time',
						isLabelHidden: true,
						value: iso('09:00'),
						onChange: noop,
						status: { type: 'error', message: 'Start time is required' }
					}
				}
			});

			const inputLoc = screen.getByRole('textbox', { name: 'Schedule Start time', exact: true });
			await expect.element(inputLoc).toBeInTheDocument();
			const input = inputLoc.element();
			const describedByIDs = input.getAttribute('aria-describedby')?.split(' ') ?? [];
			const statusNode = describedByIDs
				.map((id) => document.getElementById(id))
				.find((el) => el?.textContent === 'Start time is required');
			expect(statusNode).toBeTruthy();
			expect(statusNode).not.toHaveAttribute('role');
			expect(statusNode).not.toHaveAttribute('aria-live');

			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('Start time is required');
			});
		});

		// Regression: a grouped status message appearing after mount (the common
		// validation flow) must land in the persistent announce region.
		//
		// FAILING for the same confirmed port gap as the case above: with no
		// `useAnnounce` call in `time-input.svelte`, no polite region is ever
		// created, so `politeRegion()` stays null.
		it('announces a grouped status message that appears after mount', async () => {
			const groupedProps = (status?: { type: 'error' | 'warning'; message: string }) => ({
				group: { label: 'Schedule' },
				timeInput: {
					label: 'Start time',
					isLabelHidden: true,
					value: iso('09:00'),
					onChange: noop,
					status
				}
			});
			const screen = await render(TimeInputGroupProbe, { props: groupedProps() });
			expect(politeRegion()).toBeNull();

			await screen.rerender(groupedProps({ type: 'warning', message: 'Schedule is unusual' }));
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Schedule is unusual');
			});
			// Non-error statuses stay on the polite channel.
			expect(assertiveRegion()).toHaveTextContent('');
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(TimeInput, {
				props: {
					label: 'Time',
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const container = wrapperOf(inputIn(screen.container));
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
			const screen = await render(TimeInput, {
				props: {
					label: 'Time',
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByLabelText('Time', { exact: true })).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(TimeInput, {
				props: { label: 'Time', disabledMessage: 'You need the Editor role' }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(TimeInput, {
				props: { label: 'Time', isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(TimeInput, {
				props: {
					label: 'Time',
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const input = screen.getByLabelText('Time', { exact: true });
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
			const screen = await render(TimeInput, {
				props: {
					label: 'Time',
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const input = inputIn(screen.container);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks typing and arrow-key changes while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(TimeInput, {
				props: {
					label: 'Time',
					onChange,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const input = inputIn(screen.container);
			// Restated: upstream types with `user.type`. Playwright's actionability
			// check reads `aria-disabled="true"` as "not enabled" and refuses to type
			// at all, which would assert its heuristic instead of the guard. The
			// control *is* focusable — that is the case's premise — so it is focused
			// directly and typed into with real keys.
			input.focus();
			expect(document.activeElement).toBe(input);
			await userEvent.keyboard('2:30 PM');
			expect(input).toHaveValue('');
			input.focus();
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
			expect(onChange).not.toHaveBeenCalled();
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(TimeInput, {
				props: { label: 'Time', isDisabled: true }
			});
			const input = screen.getByLabelText('Time', { exact: true });
			await expect.element(input).toBeDisabled();
			await expect.element(input).not.toHaveAttribute('aria-disabled');
		});

		it('does not swap in the format-hint placeholder on focus while disabled', async () => {
			const screen = await render(TimeInput, {
				props: {
					label: 'Time',
					isDisabled: true,
					disabledMessage: 'You need the Editor role',
					placeholder: 'Select a time'
				}
			});
			const input = inputIn(screen.container);
			input.focus();
			input.dispatchEvent(new FocusEvent('focus'));
			await expect
				.element(screen.getByLabelText('Time', { exact: true }))
				.toHaveAttribute('placeholder', 'Select a time');
		});
	});
});

describe('TimeInput statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(TimeInput, {
			props: {
				label: 'Start',
				value: undefined,
				onChange: noop,
				status: { type: 'error', message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(TimeInput, {
			props: {
				label: 'Start',
				value: undefined,
				onChange: noop,
				status: { type: 'error', message: 'Required' },
				statusVariant: 'detached'
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});
});

// New at v0.4.1: `themeProps('time-input', …)` gained
// `disabled: isDisabled ? 'disabled' : null`, so the root reflects the state as
// both a data attribute and a bare class token.
describe('TimeInput disabled theme state', () => {
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-time-input');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(TimeInput, {
			props: { label: 'Time', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-time-input');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});
