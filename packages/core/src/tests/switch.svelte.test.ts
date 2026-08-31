import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import Switch from '$lib/components/switch/switch.svelte';
import SwitchForm from './fixtures/switch-form.svelte';
import SwitchBind from './fixtures/switch-bind.svelte';
import { cssIn, forcedColorsCssIn } from './forced-colors.js';

/**
 * Astryx's `Switch/Switch.test.tsx`, ported case for case — **51** upstream
 * cases at the 0.5.2 pin, **51** of them here, plus one beyond upstream (`supports
 * two-way bind:value`) that pins the `$bindable` decision (justified below, and
 * recorded in port/todo.md). **52 `it` in the file.** Nothing is dropped.
 *
 * The count is re-derived at the 0.5.2 pin. It read "**50** … at the 0.5.0 pin"
 * and stayed true only until the pin moved: 0.5.1 gave the control its own
 * `astryx-switch-label` target and added the one-case `label theme target`
 * describe for it, ported at the bottom of this file. Before that, it read
 * "**49** … at v0.4.1", and 0.4.x had added `drops the label gap when
 * isLabelHidden so the row is only as wide as the track`, which is ported here
 * (restated only in how the second render is driven — see the case).
 *
 * v0.3.0 → v0.4.1 added the two `form participation` cases about a required
 * control that is disabled *with a reason* (`form=""` detaches it from
 * constraint validation, since dropping `disabled` alone would leave a required
 * checkbox nothing can satisfy). Both are ported verbatim, through the existing
 * `switch-form.svelte` fixture. The same release moved the detached
 * `FieldStatus`'s gap off a spacer `<div>` and onto its `xstyle`; no case here
 * asserted that wrapper (the two `labelPosition` cases count the children of the
 * *row*, above the status), so nothing needed updating.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "**45** upstream cases at 0.3.0, **43** of them
 * here". Both numbers were false. Enumerating
 * `git show v0.3.0:packages/core/src/Switch/Switch.test.tsx` gives **47** — 28
 * in `describe('Switch')`, 8 `disabledMessage`, 3 `labelSpacing`, 3 `form
 * participation`, 2 `RTL thumb travel direction`, 1 `rest forwarding` and 2
 * `forced colors` — and four of them, not two, were unported:
 *
 * - **`renders with custom size prop (sm / md)`** and **`announces a status
 *   message that appears after mount`** had never been carried across at all,
 *   and the header did not name them.
 * - **`toggles when clicking on the description`** and **`does not fold the
 *   description into the switch accessible name`** were parked behind the claim
 *   that this port's `field-label.svelte` / `use-input-container.svelte.ts`
 *   "have not taken that change". **That claim is stale**: `field-label.svelte`
 *   forwards description clicks through `useInputContainer` (`:133-179`), which
 *   landed later in the same batch. Both cases are ported here and pass.
 *
 * The header also claimed **`treats the deprecated 'default' value as an alias
 * for hug`** was "upstream's and is deleted here too". Upstream deleted it at
 * 0.3.0 along with the alias, so it is not a case this port drops — it does not
 * exist at the tag and is not counted on either side.
 *
 * Upstream's `beforeEach` (`:19-42`) shims `showPopover`/`hidePopover` and
 * overrides `matches(':popover-open')` because jsdom implements none of the
 * Popover API, and reflects the open state as a `popover-open` *attribute* the
 * assertions then read. The browser project needs none of it: Chromium has the
 * real Popover API, so the open state is read with `matches(':popover-open')` —
 * the same drop the `Tooltip`, `Timestamp` and `TextArea` ports already
 * recorded. Upstream's `h = {hidden: true}` survives as
 * `getByRole('tooltip', { includeHidden: true })` / a container query, since a
 * *closed* popover is genuinely `display:none` here.
 *
 * Renamed props (see `switch.svelte`): upstream `onFocus`/`onBlur` are the
 * forwarded DOM handlers `onfocus`/`onblur`; `onChange` keeps its camelCase name
 * because it is a custom `(checked, event)` callback, not a forwarded element
 * handler.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:172`)** — Svelte has no `ref` prop. Upstream's
 *   `ref` targets the `<input>`; this port spreads `...rest` onto the ROOT
 *   `<div>` (the `rest forwarding` case pins that), so an attachment passed
 *   through rest lands on the root, not the input. Ported as the
 *   attachment-through-rest counterpart the sibling suites use, asserting what
 *   the port actually does (attachment on the root) and naming the divergence.
 *
 * Restated, each noted at the case:
 * - `does not call onChange when isDisabled` and `blocks toggling while
 *   focusable-disabled` — Playwright's actionability check refuses to click an
 *   element that is `disabled` or `aria-disabled`, which would assert its
 *   heuristic instead of the component (TextArea precedent). The interaction is
 *   delivered the only way a browser allows.
 * - `keeps the switch focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, which
 *   counts `aria-disabled="true"` as disabled; upstream's `not.toBeDisabled()`
 *   is jest-dom's native-only reading. The native question is asked directly.
 * - the `disabledMessage` hover case dispatches `mouseenter`/`mouseleave` at the
 *   row rather than moving a real pointer there, exactly as upstream's
 *   `fireEvent.mouseEnter(getRow())` does.
 */

const noop = (): void => {};

// `useAnnounce`'s live regions are a document-level singleton that outlives a
// render, so the announcing case starts from a clean pair (the `field` suite's
// precedent). Upstream gets this for free: its jsdom document is torn down
// between cases.
afterEach(() => {
	__resetLiveRegionsForTest();
});

/** The native switch input. */
function inputIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="switch"]');
	if (!(el instanceof HTMLInputElement)) {
		throw new Error('expected a switch input');
	}
	return el;
}

/**
 * Upstream's `getRow()`: `getByRole('switch').closest('div').parentElement` —
 * the switch *row* that carries the disabled-reason tooltip's hover listeners.
 */
function rowOf(input: HTMLInputElement): HTMLElement {
	const el = input.closest('div')?.parentElement;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a switch row');
	}
	return el;
}

/** The tooltip layer, present (but `display:none`) whenever a reason renders. */
function tooltipIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[role="tooltip"]');
	return el instanceof HTMLElement ? el : null;
}

/**
 * The sliding thumb. Upstream reaches it by the StyleX *debug* class its dev
 * build emits (`[class*="thumbOnSizeStyles"]`); this port compiles production
 * atomic classes, which carry no such name, so it goes through the stable theme
 * class both builds render.
 */
function thumbIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('.astryx-switch-thumb');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a switch thumb');
	}
	return el;
}

/** Upstream's `.astryx-switch-field` lookup for the `labelSpacing` cases. */
function fieldIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('.astryx-switch-field');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected the switch field');
	}
	return el;
}

describe('Switch', () => {
	it('renders with label', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop }
		});
		await expect.element(screen.getByLabelText('Enable notifications')).toBeInTheDocument();
	});

	it('renders as off by default', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop }
		});
		await expect.element(screen.getByRole('switch')).not.toBeChecked();
	});

	it('renders as on when value prop is true', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: true, onChange: noop }
		});
		await expect.element(screen.getByRole('switch')).toBeChecked();
	});

	it('renders with custom size prop (sm / md)', async () => {
		const screen = await render(Switch, {
			props: { label: 'Small switch', value: false, size: 'sm', onChange: noop }
		});
		await expect.element(screen.getByRole('switch')).toBeInTheDocument();

		await screen.rerender({ label: 'Medium switch', value: false, size: 'md', onChange: noop });
		await expect.element(screen.getByRole('switch')).toBeInTheDocument();
	});

	it('calls onChange with new checked state when clicked', async () => {
		const handleChange = vi.fn();
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: handleChange }
		});

		await userEvent.click(screen.getByRole('switch'));
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
	});

	it('calls onChange with false when turning off', async () => {
		const handleChange = vi.fn();
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: true, onChange: handleChange }
		});

		await userEvent.click(screen.getByRole('switch'));
		expect(handleChange).toHaveBeenCalledWith(false, expect.any(Object));
	});

	it('works when clicking on the label', async () => {
		const handleChange = vi.fn();
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: handleChange }
		});

		await userEvent.click(screen.getByText('Enable notifications', { exact: true }));
		expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
	});

	it('renders description when provided', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Dark mode',
				description: 'Switch to a darker color scheme',
				value: false,
				onChange: noop
			}
		});
		await expect
			.element(screen.getByText('Switch to a darker color scheme', { exact: true }))
			.toBeInTheDocument();
	});

	it('associates description with switch via aria-describedby', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Dark mode',
				description: 'Switch to a darker color scheme',
				value: false,
				onChange: noop
			}
		});
		const control = inputIn(screen.container);
		const description = screen
			.getByText('Switch to a darker color scheme', { exact: true })
			.element();
		expect(control).toHaveAttribute('aria-describedby', description.id);
	});

	it('toggles when clicking on the description', async () => {
		const handleChange = vi.fn();
		const screen = await render(Switch, {
			props: {
				label: 'Dark mode',
				description: 'Switch to a darker color scheme',
				value: false,
				onChange: handleChange
			}
		});

		const description = screen.getByText('Switch to a darker color scheme', { exact: true });
		await userEvent.click(description);
		expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));

		// Park the real pointer off the element again. Upstream's `user.click` runs
		// in jsdom, which has no pointer to leave anywhere; Playwright's leaves the
		// physical mouse at the description's centre, and Chromium re-hit-tests
		// hover after each later render — which re-opens the `disabledMessage`
		// tooltip right after that block's synthetic `mouseleave` closes it (the
		// sibling `CheckboxInput` suite went red on exactly that). Asserts nothing.
		await userEvent.unhover(description);
	});

	it('does not fold the description into the switch accessible name', async () => {
		// Description stays a sibling of the <label>, so it must not become part
		// of the switch's accessible name — it belongs in the accessible
		// description (aria-describedby) only, to avoid double announcement.
		const screen = await render(Switch, {
			props: {
				label: 'Dark mode',
				description: 'Switch to a darker color scheme',
				value: false,
				onChange: noop
			}
		});
		const switchEl = screen.getByRole('switch');
		await expect.element(switchEl).toHaveAccessibleName('Dark mode');
		await expect.element(switchEl).toHaveAccessibleDescription('Switch to a darker color scheme');
	});

	it('is disabled when isDisabled prop is true', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop, isDisabled: true }
		});
		await expect.element(screen.getByRole('switch')).toBeDisabled();
	});

	it('does not call onChange when isDisabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: handleChange,
				isDisabled: true
			}
		});

		const control = inputIn(screen.container);
		// Restated: upstream uses `user.click`. Playwright refuses to click a
		// natively-disabled element (its actionability heuristic), which would
		// assert the heuristic rather than the component. The keystrokes are aimed
		// at the control the only way a browser allows — a focus a disabled element
		// declines, then real key events. Nothing reaches it, so nothing calls back
		// and nothing toggles.
		control.focus();
		expect(document.activeElement).not.toBe(control);
		await userEvent.keyboard(' ');
		expect(handleChange).not.toHaveBeenCalled();
		expect(control).not.toBeChecked();
	});

	// Counterpart to upstream's `forwards ref correctly` (`:172`); see the file
	// header. Upstream's `ref` targets the `<input>` and asserts
	// `expect.any(HTMLInputElement)`. This port spreads `...rest` onto the ROOT
	// `<div>`, so an attachment through rest lands on the root — asserted with the
	// stronger `toBe`, and the divergence (root, not input) named here.
	it('hands the root element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(fieldIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(Switch, {
			props: { label: 'Toggle row', isLabelHidden: true, value: false, onChange: noop }
		});
		const label = screen.getByText('Toggle row', { exact: true });
		await expect.element(label).toBeInTheDocument();
		// Label should still be accessible
		await expect.element(screen.getByLabelText('Toggle row')).toBeInTheDocument();
	});

	it('drops the label gap when isLabelHidden so the row is only as wide as the track', async () => {
		const screen = await render(Switch, {
			props: { label: 'Toggle row', isLabelHidden: true, value: false, onChange: noop }
		});
		const row = inputIn(screen.container).parentElement!.parentElement!;
		expect(getComputedStyle(row).gap).toMatch(/^0(px)?$/);

		// Upstream's `rerender` re-renders a whole new element, so dropping
		// `isLabelHidden` from the JSX resets it to its default. `rerender` here
		// MERGES props onto the live instance, so an omitted prop keeps its last
		// value — `isLabelHidden: false` is what upstream's omission means.
		await screen.rerender({
			label: 'Toggle row',
			isLabelHidden: false,
			value: false,
			onChange: noop
		});
		expect(getComputedStyle(row).gap).not.toMatch(/^0(px)?$/);
	});

	it('keeps description linked via aria-describedby when isLabelHidden', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Toggle row',
				isLabelHidden: true,
				description: 'Enables sync for this row',
				value: false,
				onChange: noop
			}
		});
		const control = inputIn(screen.container);
		const description = screen.getByText('Enables sync for this row', { exact: true }).element();
		expect(description.id).not.toBe('');
		expect(control.getAttribute('aria-describedby')).toContain(description.id);
	});

	it('shows label visually by default', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop }
		});
		await expect.element(screen.getByText('Enable notifications', { exact: true })).toBeVisible();
	});

	it('renders with labelPosition start (label before switch)', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				labelPosition: 'start'
			}
		});
		// Outer div wraps the container div holding the label and switch wrappers.
		const outerDiv = screen.container.firstElementChild as HTMLElement;
		const containerDiv = outerDiv.firstElementChild as HTMLElement;
		expect(Array.from(containerDiv.children).length).toBe(2);
	});

	it('renders with labelPosition end (switch before label)', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				labelPosition: 'end'
			}
		});
		const outerDiv = screen.container.firstElementChild as HTMLElement;
		const containerDiv = outerDiv.firstElementChild as HTMLElement;
		expect(Array.from(containerDiv.children).length).toBe(2);
	});

	it('has role="switch" for accessibility', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop }
		});
		await expect.element(screen.getByRole('switch')).toBeInTheDocument();
	});

	it('sets aria-busy on input when loading', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, isLoading: true, onChange: noop }
		});
		await expect.element(screen.getByRole('switch')).toHaveAttribute('aria-busy', 'true');
	});

	it('renders status message when status prop is provided', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				status: { type: 'error', message: 'Failed to save setting' }
			}
		});
		await expect
			.element(screen.getByText('Failed to save setting', { exact: true }))
			.toBeInTheDocument();
	});

	it('sets aria-invalid when status type is error', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				status: { type: 'error', message: 'Error message' }
			}
		});
		await expect.element(screen.getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
	});

	it('does not set aria-invalid when status type is not error', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				status: { type: 'warning', message: 'Warning message' }
			}
		});
		await expect.element(screen.getByRole('switch')).not.toHaveAttribute('aria-invalid');
	});

	it('associates status message with switch via aria-describedby', async () => {
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				status: { type: 'error', message: 'Error message' }
			}
		});
		const describedBy = inputIn(screen.container).getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
	});

	// Regression: the status is conditionally mounted, so it must be announced
	// through the persistent useAnnounce live region — a live region born
	// together with its content is not reliably announced.
	it('announces a status message that appears after mount', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop }
		});
		expect(document.querySelector('[data-astryx-live-region="assertive"]')).toBeNull();

		await screen.rerender({
			label: 'Enable notifications',
			value: false,
			onChange: noop,
			status: { type: 'error', message: 'Failed to save setting' }
		});
		await vi.waitFor(() => {
			expect(document.querySelector('[data-astryx-live-region="assertive"]')).toHaveTextContent(
				'Failed to save setting'
			);
		});
	});

	it('calls onFocus and onBlur callbacks', async () => {
		const handleFocus = vi.fn();
		const handleBlur = vi.fn();
		const screen = await render(Switch, {
			props: {
				label: 'Enable notifications',
				value: false,
				onChange: noop,
				// Renamed: upstream `onFocus`/`onBlur` are the forwarded DOM handlers.
				onfocus: handleFocus,
				onblur: handleBlur
			}
		});

		await userEvent.click(screen.getByRole('switch'));
		expect(handleFocus).toHaveBeenCalled();

		await userEvent.tab();
		expect(handleBlur).toHaveBeenCalled();
	});

	it('sets required attribute when isRequired is true', async () => {
		const screen = await render(Switch, {
			props: { label: 'Enable notifications', value: false, onChange: noop, isRequired: true }
		});
		await expect.element(screen.getByRole('switch')).toBeRequired();
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(Switch, {
				props: {
					label: 'Enable notifications',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Notifications are turned off org-wide'
				}
			});
			const tooltip = tooltipIn(screen.container)!;
			expect(tooltip).toHaveTextContent('Notifications are turned off org-wide');

			const row = rowOf(inputIn(screen.container));
			// `mouseenter`/`mouseleave` do not bubble; the listeners sit on the row.
			// Dispatched as upstream's `fireEvent.mouseEnter(getRow())` dispatches them.
			row.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's invented `popover-open`
				// attribute; Chromium has the real Popover API.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});

			row.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(Switch, {
				props: {
					label: 'Enable notifications',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Notifications are turned off org-wide'
				}
			});
			const tooltip = tooltipIn(screen.container)!;
			const control = inputIn(screen.container);
			// Restated in how keyboard focus is delivered. Upstream's `user.tab()`
			// lands on the sole tab stop; here Playwright's synthetic Tab does not
			// settle onto a `<input type="checkbox">` in this environment (it stays on
			// `<body>`), so a Tab is issued to put the browser in keyboard modality and
			// focus is then placed on the control — which the `:focus-visible` heuristic
			// treats as keyboard-originated (a plain programmatic focus, without the
			// preceding Tab, is *not* `:focus-visible` on a checkbox, and the earlier
			// bare-`tab()` attempt correctly did not open the tooltip). This exercises
			// the component's `focusin` + `:focus-visible` gate exactly as a real Tab
			// would.
			await userEvent.tab();
			control.focus();
			await expect.element(screen.getByRole('switch')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(Switch, {
				props: {
					label: 'Enable notifications',
					value: false,
					onChange: noop,
					disabledMessage: 'Notifications are turned off org-wide'
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(Switch, {
				props: { label: 'Enable notifications', value: false, onChange: noop, isDisabled: true }
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('keeps the switch focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(Switch, {
				props: {
					label: 'Enable notifications',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Notifications are turned off org-wide'
				}
			});
			const control = screen.getByRole('switch');
			// Restated: upstream's `not.toBeDisabled()` is jest-dom's native-only
			// reading. vitest-browser's matcher of that name is Playwright's ARIA
			// computation, which counts `aria-disabled="true"` as disabled — so it
			// answers "disabled" on the very attribute the next line asserts.
			// Upstream's question is asked directly: no native `disabled`, which is
			// what keeps the control in the tab order.
			await expect.element(control).not.toHaveAttribute('disabled');
			expect(inputIn(screen.container).disabled).toBe(false);
			await expect.element(control).toHaveAttribute('aria-disabled', 'true');
		});

		it('links the reason tooltip via aria-describedby', async () => {
			const screen = await render(Switch, {
				props: {
					label: 'Enable notifications',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Notifications are turned off org-wide'
				}
			});
			const control = inputIn(screen.container);
			const tooltip = tooltipIn(screen.container)!;
			expect(control.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks toggling while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Switch, {
				props: {
					label: 'Enable notifications',
					value: false,
					onChange,
					isDisabled: true,
					disabledMessage: 'Notifications are turned off org-wide'
				}
			});
			const control = inputIn(screen.container);
			// Restated in delivery: upstream clicks the control. Playwright reads
			// `aria-disabled="true"` as "not enabled" and refuses to click, which
			// would assert its heuristic instead of the guard. The control *is*
			// focusable — the case's premise — so it is focused directly and toggled
			// with a real key press.
			control.focus();
			expect(document.activeElement).toBe(control);
			await userEvent.keyboard(' ');
			// The guard holds: no callback fires, and the *visible* switch stays off
			// (the track's `data-checked` is driven by `isOn`, which is never
			// committed on the blocked path).
			expect(onChange).not.toHaveBeenCalled();
			// The browser toggles the native checkbox before the handler runs, but
			// upstream's controlled `checked={isOn}` re-asserts `checked={false}` on
			// re-render so the box reads unchecked. A Svelte one-way `checked={isOn}`
			// is *not* re-asserted when `isOn` is unchanged, so `handleChange`'s guard
			// re-syncs the DOM (`e.target.checked = isOn`) by hand — without which
			// `.checked`, and the `aria-checked` computed from it on `role="switch"`,
			// would announce the wrong state. This pins that re-sync.
			expect(control).not.toBeChecked();
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(Switch, {
				props: { label: 'Enable notifications', value: false, onChange: noop, isDisabled: true }
			});
			await expect.element(screen.getByRole('switch')).toBeDisabled();
		});
	});

	describe('labelSpacing', () => {
		it('omits the data attribute for the default hug spacing', async () => {
			const screen = await render(Switch, {
				props: { label: 'Notify', value: false, onChange: noop }
			});
			expect(fieldIn(screen.container)).not.toHaveAttribute('data-label-spacing');
		});

		it('reflects spread spacing as a data attribute and variant class', async () => {
			const screen = await render(Switch, {
				props: { label: 'Notify', value: false, onChange: noop, labelSpacing: 'spread' }
			});
			const field = fieldIn(screen.container);
			expect(field).toHaveAttribute('data-label-spacing', 'spread');
			expect(field.className).toContain('spread');
		});

		it('renders explicit hug the same as the default', async () => {
			const implicit = await render(Switch, {
				props: { label: 'Notify', value: false, onChange: noop }
			});
			const explicit = await render(Switch, {
				props: { label: 'Notify', value: false, onChange: noop, labelSpacing: 'hug' }
			});
			expect(fieldIn(explicit.container)).not.toHaveAttribute('data-label-spacing');
			expect(fieldIn(explicit.container).className).toBe(fieldIn(implicit.container).className);
		});

		// REMOVED at upstream 0.3.0 with the value it covered: "treats the
		// deprecated 'default' value as an alias for hug". `SwitchLabelSpacing` is
		// now `'hug' | 'spread'` on both sides (0.3.0's "remove long-deprecated
		// compatibility APIs" breaking change), so there is no alias left to assert
		// and keeping the case would not typecheck.
	});

	describe('form participation', () => {
		it('submits under htmlName when on', async () => {
			const screen = await render(SwitchForm, {
				props: {
					switches: [{ label: 'Notify', htmlName: 'notify', value: true, onChange: noop }]
				}
			});
			const form = screen.container.querySelector('form')!;
			const data = new FormData(form);
			expect(data.get('notify')).toBe('on');
		});

		it('does not block form submission when required and disabled with a disabledMessage', async () => {
			const screen = await render(SwitchForm, {
				props: {
					switches: [
						{
							label: 'Notify',
							htmlName: 'notify',
							value: false,
							onChange: noop,
							isRequired: true,
							isDisabled: true,
							disabledMessage: 'Notifications are turned off org-wide'
						}
					]
				}
			});
			// `disabledMessage` drops the native `disabled` so the reason stays
			// focus-discoverable, but `required` is still on the element — so the
			// control is detached from the form with `form=""` instead. No element can
			// have the empty id, so it owns no form: out of constraint validation and
			// out of the form data, while staying visible, focusable and labelled.
			expect(screen.container.querySelector('form')!.checkValidity()).toBe(true);
		});

		it('still blocks submission when required and off but enabled', async () => {
			const screen = await render(SwitchForm, {
				props: {
					switches: [
						{ label: 'Notify', htmlName: 'notify', value: false, onChange: noop, isRequired: true }
					]
				}
			});
			expect(screen.container.querySelector('form')!.checkValidity()).toBe(false);
		});

		it('is excluded from form data when disabled, even with a disabledMessage', async () => {
			const screen = await render(SwitchForm, {
				props: {
					switches: [
						{
							label: 'Notify',
							htmlName: 'notify',
							value: true,
							onChange: noop,
							isDisabled: true,
							disabledMessage: 'Locked'
						}
					]
				}
			});
			const form = screen.container.querySelector('form')!;
			expect([...new FormData(form).keys()]).toEqual([]);
		});

		it('submits nothing when off or when htmlName is omitted', async () => {
			const screen = await render(SwitchForm, {
				props: {
					switches: [
						{ label: 'Off', htmlName: 'off', value: false, onChange: noop },
						{ label: 'Unnamed', value: true, onChange: noop }
					]
				}
			});
			const form = screen.container.querySelector('form')!;
			expect([...new FormData(form).keys()]).toEqual([]);
		});
	});

	describe('RTL thumb travel direction', () => {
		it('applies a distinct thumb style when on vs off (on-travel is wired)', async () => {
			const on = await render(Switch, { props: { label: 'On', value: true, onChange: noop } });
			const off = await render(Switch, { props: { label: 'Off', value: false, onChange: noop } });
			// Upstream queries `[class*="thumbOnSizeStyles"]` / `[class*="thumbOff…"]`
			// — debug class names its dev-mode StyleX emits, which a production
			// compile does not (see `thumbIn`). The assertion — on and off carry
			// different classes — is upstream's, unchanged.
			const onThumb = thumbIn(on.container);
			const offThumb = thumbIn(off.container);
			expect(onThumb.getAttribute('class')).not.toBe(offThumb.getAttribute('class'));
		});

		it('mirrors the on-state thumb travel under RTL (negative translateX)', async () => {
			const on = await render(Switch, { props: { label: 'Toggle', value: true, onChange: noop } });
			const css = cssIn(thumbIn(on.container));
			// LTR on-travel moves the thumb toward the physical right (positive px).
			expect(css).toMatch(/transform:\s*translateX\(1[24]px\)/);
			// RTL mirrors it: the on-thumb lands on the inline-end (physical left)
			// side, so the travel flips sign, scoped to `[dir="rtl"]`.
			expect(css).toMatch(
				/:is\(\[dir="rtl"\][^)]*\)[^{]*\{[^}]*transform:\s*translateX\(-1[24]px\)/
			);
		});
	});

	describe('rest forwarding', () => {
		it('forwards data-testid, id, and aria-* to the root element', async () => {
			const screen = await render(Switch, {
				props: {
					label: 'Notifications',
					value: false,
					onChange: noop,
					'data-testid': 'my-switch',
					id: 'switch-1',
					'aria-label': 'Toggle notifications'
				}
			});
			const root = screen.container.querySelector('[data-testid="my-switch"]');
			expect(root).not.toBeNull();
			expect(root).toHaveAttribute('id', 'switch-1');
			expect(root).toHaveAttribute('aria-label', 'Toggle notifications');
		});
	});

	// Beyond upstream, pinning the `$bindable` decision (recorded in port/todo.md):
	// React has no `bind:` and no counterpart case. A bound parent value tracks a
	// toggle, so this goes red if `value` ever regresses to non-bindable and
	// silently stops writing back. The optimistic `changeAction` path deliberately
	// does *not* commit `value`, so this only exercises the plain toggle path.
	it('supports two-way bind:value', async () => {
		const screen = await render(SwitchBind, { props: { initial: false } });
		await expect.element(screen.getByTestId('mirror')).toHaveTextContent('off');

		await userEvent.click(screen.getByRole('switch'));
		await expect.element(screen.getByTestId('mirror')).toHaveTextContent('on');
	});
});

// Neither jsdom nor a Chromium test page can emulate forced-colors rendering, so
// these assert that the compiled output includes the forced-colors rules; visual
// behavior needs manual verification under Windows High Contrast. See
// `forced-colors.ts` for why the scan is scoped to the rendered subtree here and
// global upstream.
describe('forced colors (WCAG 1.4.11)', () => {
	it('compiles forced-colors overrides so on/off state survives Windows High Contrast', async () => {
		// Upstream renders one switch and scans the whole document, which is
		// module-scoped there. Scoped to elements here, so each state that owns a
		// rule has to be on screen: on-track/on-thumb, off-track/off-thumb, and the
		// disabled track.
		const on = await render(Switch, {
			props: { label: 'Notifications', value: true, onChange: noop }
		});
		const off = await render(Switch, {
			props: { label: 'Notifications', value: false, onChange: noop }
		});
		const disabled = await render(Switch, {
			props: { label: 'Notifications', value: false, onChange: noop, isDisabled: true }
		});
		const css = forcedColorsCssIn(on.container, off.container, disabled.container);
		// Track outline (backgrounds are stripped; the border keeps the bounds).
		expect(css).toContain('border-color: canvastext;');
		// Off track stays empty; on track uses the selection color.
		expect(css).toContain('background-color: canvas;');
		expect(css).toContain('background-color: highlight;');
		// Thumb fill per state.
		expect(css).toContain('background-color: canvastext;');
		expect(css).toContain('background-color: highlighttext;');
		// Disabled affordance (opacity dimming does not survive forcing).
		expect(css).toContain('border-color: graytext;');
	});

	it('gates the hover tint out of forced colors so the thumb stays visible on hover', async () => {
		const on = await render(Switch, {
			props: { label: 'Notifications', value: true, onChange: noop }
		});
		// The ancestor-hover tint is a non-system color-mix whose rule outranks the
		// plain forced-colors track rule. It is gated behind `forced-colors: none`
		// so it cannot reassert on hover and flatten the Highlight track to white
		// under the HighlightText thumb (white-on-white).
		expect(cssIn(on.container)).toContain('(hover: hover) and (forced-colors: none)');
		// And the tint never leaks into the forced-colors output.
		expect(forcedColorsCssIn(on.container)).not.toContain('color-mix');
	});
});

describe('label theme target', () => {
	it('names its own label so a theme can style it apart from a field label', async () => {
		// See `CheckboxInput`: the control names the label it owns.
		const screen = await render(Switch, {
			props: { label: 'Wi-Fi', value: false, onChange: noop }
		});
		const label = screen.getByText('Wi-Fi', { exact: true }).element().closest('label');
		expect(label).toHaveClass('astryx-field-label');
		expect(label).toHaveClass('astryx-switch-label');
	});
});
