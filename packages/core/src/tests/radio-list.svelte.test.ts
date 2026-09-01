/** PORTS: RadioList/RadioList.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import RadioListProbe from './fixtures/radio-list-probe.svelte';
import { forcedColorsCssIn } from './forced-colors.js';

/**
 * Astryx's `RadioList/RadioList.test.tsx`, ported case for case — **49 upstream
 * cases at the 0.5.0 pin**, **44 here**. The 44 are the whole of upstream's
 * suite as it stood from 0.3.0 through v0.4.5 (26 `RadioList`, 5 `focus
 * management`, 8 `disabledMessage`, 3 `form participation`, 1 `RadioListItem
 * rest forwarding`, 1 `forced colors`).
 *
 * **The 5 that are not here all arrived at 0.5.0:**
 *
 * - **The whole 4-case `radio-list-item theme target` block** — `renders
 *   astryx-radio-list-item, with its size, on every row`, `carries the selected
 *   and disabled states a theme keys on`, `rides the painting row element
 *   (astryx-item), not a bare layout wrapper`, and `keeps the bare default row
 *   appearance: zeroed padding/radius, no default background`.
 * - **`calls onChange when clicking the description`**, in the top-level
 *   `RadioList` block — the description text must be part of the row's click
 *   target, not inert beside it.
 *
 * (This header read "44 upstream cases at 0.3.0 … 44 here", true through
 * v0.4.5.)
 *
 * Because `<RadioList>` takes its `RadioListItem` children as a snippet, every
 * case renders through `radio-list-probe.svelte`, which describes the items as an
 * array and forwards every group prop; see that file. `value` is controlled there
 * (upstream's `value` + `onChange`), committed on change so the DOM reflects the
 * selection while the `onChange` spy still records the call.
 *
 * Upstream's `beforeEach` (`:20-43`) shims `showPopover`/`hidePopover` and
 * `matches(':popover-open')` because jsdom implements none of the Popover API, and
 * reflects the open state as a `popover-open` *attribute* the assertions read. The
 * browser project needs none of it: Chromium has the real Popover API, so the open
 * state is read with `matches(':popover-open')` — the same drop the `Switch`,
 * `TextInput`, and `Tooltip` ports recorded. Upstream's `h = {hidden: true}` (a
 * closed popover is invisible to jsdom's a11y tree) survives as a container query,
 * since a closed popover is genuinely `display:none` here.
 *
 * Restated, each noted at the case:
 * - `does not call onChange when group is disabled` / `... when individual item is
 *   disabled` — the radio is *natively* `disabled`; Playwright refuses to click a
 *   disabled element (its actionability heuristic), which would assert the
 *   heuristic instead of the component. The interaction is delivered the only way a
 *   browser allows (focus is declined, then a real key press), and nothing fires.
 * - `keeps radios focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, which counts
 *   `aria-disabled="true"` as disabled; upstream's `not.toBeDisabled()` is
 *   jest-dom's native-only reading. The native question is asked directly.
 * - `blocks selection while focusable-disabled` — the radio is focusable-disabled
 *   (`aria-disabled`, not native); Playwright refuses to click it. Upstream's
 *   `fireEvent.click` is a plain DOM dispatch, so the element's native `.click()`
 *   is used — the same trusted-free dispatch that toggles and fires `change`,
 *   exercising the component's re-sync guard exactly as upstream does.
 * - `shows the reason tooltip on keyboard focus` — upstream's `user.tab()` lands on
 *   the sole tab stop; Playwright's synthetic Tab does not reliably settle onto a
 *   radio here, so a Tab is issued to enter keyboard modality and focus is then
 *   placed on a radio, which `:focus-visible` treats as keyboard-originated (the
 *   `focusin` gate the component reads). Same finding as the Switch port.
 */

const noop = (): void => {};

/** The radios of the group — `input[type="radio"]` carry the implicit role. */
function radiosIn(container: HTMLElement): HTMLInputElement[] {
	return Array.from(container.querySelectorAll('input[type="radio"]'));
}

/** The tooltip layer, present (but `display:none`) whenever a reason renders. */
function tooltipIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[role="tooltip"]');
	return el instanceof HTMLElement ? el : null;
}

describe('RadioList', () => {
	it('renders with label', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText('Preference', { exact: true })).toBeInTheDocument();
	});

	it('renders radio items', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' },
					{ label: 'Option C', value: 'c' }
				]
			}
		});
		expect(radiosIn(screen.container)).toHaveLength(3);
	});

	it('renders radiogroup role', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByRole('radiogroup')).toBeInTheDocument();
	});

	it('selects the correct radio based on value prop', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: 'b',
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' },
					{ label: 'Option C', value: 'c' }
				]
			}
		});
		const radios = radiosIn(screen.container);
		expect(radios[0]).not.toBeChecked();
		expect(radios[1]).toBeChecked();
		expect(radios[2]).not.toBeChecked();
	});

	it('calls onChange with value string when clicking a radio', async () => {
		const handleChange = vi.fn();
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: 'a',
				onChange: handleChange,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});

		await userEvent.click(screen.getByLabelText('Option B', { exact: true }));
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledWith('b');
	});

	it('calls onChange when clicking on a label', async () => {
		const handleChange = vi.fn();
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: 'a',
				onChange: handleChange,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});

		await userEvent.click(screen.getByText('Option B', { exact: true }));
		expect(handleChange).toHaveBeenCalledWith('b');
	});

	it('disables all radios when group isDisabled is true', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				isDisabled: true,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});
		const radios = radiosIn(screen.container);
		expect(radios[0]).toBeDisabled();
		expect(radios[1]).toBeDisabled();
	});

	it('does not call onChange when group is disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: handleChange,
				isDisabled: true,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});

		// Restated delivery: the radio is natively `disabled`, which Playwright
		// refuses to click. Focus is declined by a disabled control and a real key
		// press reaches nothing, so onChange never fires — the property upstream's
		// blocked click asserts.
		const control = radiosIn(screen.container)[0];
		control.focus();
		expect(document.activeElement).not.toBe(control);
		await userEvent.keyboard(' ');
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('disables individual item when item isDisabled is true', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b', isDisabled: true }
				]
			}
		});
		const radios = radiosIn(screen.container);
		expect(radios[0]).not.toBeDisabled();
		expect(radios[1]).toBeDisabled();
	});

	it('does not call onChange when individual item is disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: handleChange,
				items: [{ label: 'Option A', value: 'a', isDisabled: true }]
			}
		});

		// Restated delivery, as above: the item radio is natively `disabled`.
		const control = radiosIn(screen.container)[0];
		control.focus();
		expect(document.activeElement).not.toBe(control);
		await userEvent.keyboard(' ');
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('shows Required indicator when isRequired is true', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				isRequired: true,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText(/Required/)).toBeInTheDocument();
	});

	it('shows Optional indicator when isOptional is true', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				isOptional: true,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText(/Optional/)).toBeInTheDocument();
	});

	it('renders error status message', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Please select an option' },
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect
			.element(screen.getByText('Please select an option', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders warning status message', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: 'a',
				onChange: noop,
				status: { type: 'warning', message: 'This may change later' },
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect
			.element(screen.getByText('This may change later', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders success status message', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: 'a',
				onChange: noop,
				status: { type: 'success', message: 'Great choice!' },
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText('Great choice!', { exact: true })).toBeInTheDocument();
	});

	it('sets aria-invalid on radiogroup when status is error', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Required' },
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
	});

	it('renders startContent', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', start: true }]
			}
		});
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
	});

	it('renders endContent', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', end: true }]
			}
		});
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('supports data-testid on RadioList', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				'data-testid': 'my-radio-list',
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByTestId('my-radio-list')).toBeInTheDocument();
	});

	it('supports data-testid on RadioListItem', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', 'data-testid': 'my-radio-item' }]
			}
		});
		await expect.element(screen.getByTestId('my-radio-item')).toBeInTheDocument();
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Hidden label',
				isLabelHidden: true,
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		const label = screen.getByText('Hidden label', { exact: true });
		await expect.element(label).toBeInTheDocument();
		// The radiogroup is named by the label element via aria-labelledby (not a
		// duplicated aria-label), so its accessible name is still "Hidden label".
		await expect
			.element(screen.getByRole('radiogroup', { name: 'Hidden label', exact: true }))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby');
		await expect.element(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
	});

	it('renders the group label as a span, not a label element (forms-14)', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Plan',
				value: '',
				onChange: noop,
				items: [
					{ label: 'Free', value: 'free' },
					{ label: 'Pro', value: 'pro' }
				]
			}
		});
		// A radiogroup's accessible name must not come from a literal `<label>`
		// element — a `<label>` names a single control and can't be associated with a
		// group. It is rendered as a `<span>` and referenced via aria-labelledby (with
		// no orphaned htmlFor).
		const labelEl = screen.getByText('Plan', { exact: true }).element();
		expect(labelEl.tagName).toBe('SPAN');
		expect(labelEl.closest('label')).toBeNull();
		expect(labelEl).not.toHaveAttribute('for');
		const group = screen.getByRole('radiogroup', { name: 'Plan', exact: true }).element();
		expect(group.getAttribute('aria-labelledby')).toBe(labelEl.id);
	});

	it('renders description on items', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', description: 'This is option A' }]
			}
		});
		await expect.element(screen.getByText('This is option A', { exact: true })).toBeInTheDocument();
	});

	it('renders description on the radio list group', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				description: 'Choose your preference',
				value: '',
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect
			.element(screen.getByText('Choose your preference', { exact: true }))
			.toBeInTheDocument();
	});

	it('applies horizontal orientation', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				orientation: 'horizontal',
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});
		// The radiogroup should exist and contain items.
		await expect.element(screen.getByRole('radiogroup')).toBeInTheDocument();
		expect(radiosIn(screen.container)).toHaveLength(2);
	});

	it('sets aria-required on radiogroup when isRequired is true', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: '',
				onChange: noop,
				isRequired: true,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
	});

	describe('focus management (no-selection tab stop)', () => {
		it('keeps focus on the selected radio when a value is selected', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: 'b',
					onChange: noop,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' },
						{ label: 'Option C', value: 'c' }
					]
				}
			});
			const selected = screen
				.getByLabelText('Option B', { exact: true })
				.element() as HTMLInputElement;
			// A selected value provides a deterministic native tab stop; focusing it
			// must not be redirected elsewhere.
			selected.focus();
			expect(selected).toHaveFocus();
		});

		it('redirects to the first radio when focus enters an unselected group forward', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: '',
					onChange: noop,
					before: true,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' },
						{ label: 'Option C', value: 'c' }
					]
				}
			});
			const radios = radiosIn(screen.container);
			const outside = screen.getByText('before', { exact: true }).element() as HTMLButtonElement;
			outside.focus();
			// Forward entry: the browser lands on a leading radio; the group keeps the
			// first radio as the deterministic tab stop.
			radios[0].focus();
			expect(radios[0]).toHaveFocus();

			// Landing on a middle radio from outside is normalized to the first.
			outside.focus();
			radios[1].focus();
			expect(radios[0]).toHaveFocus();
		});

		it('redirects to the last radio when focus enters an unselected group backward', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: '',
					onChange: noop,
					after: true,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' },
						{ label: 'Option C', value: 'c' }
					]
				}
			});
			const radios = radiosIn(screen.container);
			const outside = screen.getByText('after', { exact: true }).element() as HTMLButtonElement;
			outside.focus();
			// Backward (Shift+Tab) entry: the browser focuses the last radio; the group
			// keeps it as the deterministic tab stop rather than jumping away.
			radios[radios.length - 1].focus();
			expect(radios[radios.length - 1]).toHaveFocus();
		});

		it('does not hijack focus moving between radios within the group', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: '',
					onChange: noop,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' },
						{ label: 'Option C', value: 'c' }
					]
				}
			});
			const radios = radiosIn(screen.container);
			// Enter the group from outside, then move to a middle radio as arrow-key
			// navigation would. Intra-group movement must not be redirected back.
			radios[0].focus();
			radios[1].focus();
			expect(radios[1]).toHaveFocus();
			radios[2].focus();
			expect(radios[2]).toHaveFocus();
		});

		it('skips disabled radios when choosing the deterministic tab stop', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: '',
					onChange: noop,
					before: true,
					items: [
						{ label: 'Option A', value: 'a', isDisabled: true },
						{ label: 'Option B', value: 'b' },
						{ label: 'Option C', value: 'c' },
						{ label: 'Option D', value: 'd' }
					]
				}
			});
			const outside = screen.getByText('before', { exact: true }).element() as HTMLButtonElement;
			const optionB = screen
				.getByLabelText('Option B', { exact: true })
				.element() as HTMLInputElement;
			const optionC = screen
				.getByLabelText('Option C', { exact: true })
				.element() as HTMLInputElement;
			// A middle enabled radio (C) entered from outside is normalized to the first
			// *enabled* radio (B) — the disabled Option A is skipped.
			outside.focus();
			optionC.focus();
			expect(optionB).toHaveFocus();
		});
	});

	describe('disabledMessage', () => {
		async function renderGroup(onChange: (v: string) => void = noop) {
			return render(RadioListProbe, {
				props: {
					label: 'Plan',
					value: 'free',
					onChange,
					isDisabled: true,
					disabledMessage: 'Upgrade your account to change plans',
					items: [
						{ label: 'Free', value: 'free' },
						{ label: 'Pro', value: 'pro' }
					]
				}
			});
		}

		it('shows the reason tooltip on hover when the group is disabled with a reason', async () => {
			const screen = await renderGroup();
			const tooltip = tooltipIn(screen.container)!;
			expect(tooltip).toHaveTextContent('Upgrade your account to change plans');
			const group = screen.getByRole('radiogroup').element();
			// `mouseenter`/`mouseleave` do not bubble; the listeners sit on the group.
			// Dispatched as upstream's `fireEvent.mouseEnter(group)` dispatches them.
			group.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's invented `popover-open`
				// attribute; Chromium has the real Popover API.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
			group.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await renderGroup();
			const tooltip = tooltipIn(screen.container)!;
			const control = radiosIn(screen.container)[0];
			// Restated in delivery (see file header): a Tab enters keyboard modality,
			// then focus is placed on a radio so `:focus-visible` (the component's
			// `focusin` gate) treats it as keyboard-originated.
			await userEvent.tab();
			control.focus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Plan',
					value: 'free',
					onChange: noop,
					disabledMessage: 'Upgrade your account to change plans',
					items: [{ label: 'Free', value: 'free' }]
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Plan',
					value: 'free',
					onChange: noop,
					isDisabled: true,
					items: [{ label: 'Free', value: 'free' }]
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('keeps radios focusable via aria-disabled when a reason is provided', async () => {
			const screen = await renderGroup();
			// Restated matcher (see file header): the native question is asked directly
			// — no native `disabled` (what keeps the radio in the tab order), plus the
			// `aria-disabled` flag upstream reads.
			for (const radio of radiosIn(screen.container)) {
				expect(radio).not.toHaveAttribute('disabled');
				expect(radio.disabled).toBe(false);
				expect(radio).toHaveAttribute('aria-disabled', 'true');
			}
		});

		it('links the reason tooltip from the group via aria-describedby', async () => {
			const screen = await renderGroup();
			const group = screen.getByRole('radiogroup').element();
			const tooltip = tooltipIn(screen.container)!;
			expect(group.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks selection while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await renderGroup(onChange);
			const pro = screen.getByLabelText('Pro', { exact: true }).element() as HTMLInputElement;
			// Restated delivery (see file header): the radio is focusable-disabled
			// (`aria-disabled`, not native), which Playwright refuses to click. A native
			// `.click()` is upstream's `fireEvent.click` — it toggles and fires `change`,
			// exercising the component's re-sync guard.
			pro.click();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('keeps radios natively disabled when disabled without a reason', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Plan',
					value: 'free',
					onChange: noop,
					isDisabled: true,
					items: [
						{ label: 'Free', value: 'free' },
						{ label: 'Pro', value: 'pro' }
					]
				}
			});
			for (const radio of radiosIn(screen.container)) {
				expect(radio).toBeDisabled();
			}
		});
	});

	describe('form participation', () => {
		it('submits the selected value under htmlName', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					htmlName: 'pref',
					value: 'b',
					onChange: noop,
					form: true,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' }
					]
				}
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('pref')).toBe('b');
		});

		it('is excluded from form data when disabled, even with a disabledMessage', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					htmlName: 'pref',
					value: 'a',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Locked',
					form: true,
					items: [{ label: 'Option A', value: 'a' }]
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});

		it('keeps working as an isolated group when htmlName is omitted', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: 'a',
					onChange: noop,
					form: true,
					items: [{ label: 'Option A', value: 'a' }]
				}
			});
			// Auto-generated internal name still groups the radios, but the field name
			// is not part of the public form contract.
			const input = screen.container.querySelector('input[type="radio"]')!;
			expect(input.getAttribute('name')).toBeTruthy();
		});
	});

	describe('RadioListItem rest forwarding', () => {
		it('forwards data-testid, id, and aria-* to the item root element', async () => {
			const screen = await render(RadioListProbe, {
				props: {
					label: 'Preference',
					value: '',
					onChange: noop,
					items: [
						{
							label: 'Option A',
							value: 'a',
							'data-testid': 'item-a',
							id: 'item-a-id',
							'aria-label': 'First option'
						}
					]
				}
			});
			const item = screen.getByTestId('item-a');
			await expect.element(item).toHaveAttribute('id', 'item-a-id');
			await expect.element(item).toHaveAttribute('aria-label', 'First option');
		});
	});
});

// Neither jsdom nor a Chromium test page can emulate forced-colors rendering, so
// this asserts that the compiled output includes the forced-colors rule; visual
// behavior needs manual verification under Windows High Contrast. See
// `forced-colors.ts` for why the scan is scoped to the rendered subtree here and
// global upstream.
describe('forced colors (WCAG 1.4.11)', () => {
	it('compiles a forced-colors fill so the selected dot survives Windows High Contrast', async () => {
		const screen = await render(RadioListProbe, {
			props: {
				label: 'Preference',
				value: 'a',
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		// The painted inner dot would be stripped to Canvas (invisible), making
		// checked and unchecked radios identical; CanvasText keeps it perceivable.
		expect(forcedColorsCssIn(screen.container)).toContain('background-color: canvastext;');
	});
});
