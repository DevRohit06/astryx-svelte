import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import CheckboxInput, {
	type CheckboxInputProps
} from '$lib/components/checkbox-input/checkbox-input.svelte';
import CheckboxInputForm from './fixtures/checkbox-input-form.svelte';
import CheckboxInputLabelIcon from './fixtures/checkbox-input-label-icon.svelte';
import { forcedColorsCssIn } from './forced-colors.js';

/**
 * Astryx's `CheckboxInput/CheckboxInput.test.tsx`, ported case for case — **37**
 * upstream cases at v0.3.0 (24 `CheckboxInput`, 8 `disabledMessage`, 3 `form
 * participation`, 2 `forced colors`), **37** here. Nothing added, nothing
 * dropped.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "**36** upstream cases … **34** here" and named two
 * absences. Enumerating
 * `git show v0.3.0:packages/core/src/CheckboxInput/CheckboxInput.test.tsx`
 * gives **37**, and *three* cases were unported:
 *
 * - **`announces a status message that appears after mount`** had never been
 *   carried across at all, and the header did not name it.
 * - **`toggles when clicking on the description`** and **`does not fold the
 *   description into the checkbox accessible name`** were parked behind the
 *   claim that this port's `field-label.svelte` /
 *   `use-input-container.svelte.ts` "have not taken that change". **That claim
 *   is stale**: `field-label.svelte` forwards description clicks through
 *   `useInputContainer` (`:133-179`), which landed later in the same batch.
 *   Both cases are ported here and pass.
 *
 * Upstream's `beforeEach` (`:19-42`) shims `showPopover`/`hidePopover` and
 * overrides `matches(':popover-open')` because jsdom implements none of the
 * Popover API, reflecting the open state as an invented `popover-open`
 * *attribute* the assertions then read. The browser project needs none of it:
 * Chromium has the real Popover API, so the open state is read with
 * `matches(':popover-open')` — the same drop `dropdown-menu`, `Switch`,
 * `TextInput` and `Tooltip` already recorded. Upstream's `h = {hidden: true}`
 * (a closed popover is invisible to jsdom's a11y tree) survives as a container
 * query, since a closed popover is genuinely `display:none` here.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:223`)** — Svelte has no `ref` prop. Upstream's
 *   `ref` targets the `<input>`, and this port spreads `...rest` onto the
 *   `<input>` too (the asymmetry with `Switch`, which spreads onto its root, is
 *   itself pinned by the two `forwards … to the input` cases). So an attachment
 *   passed through rest props lands on the same element upstream's ref does, and
 *   the assertion is upstream's, strengthened from `expect.any(HTMLInputElement)`
 *   to the identity of the very input.
 *
 * Restated, each noted at the case:
 * - `does not call onChange when isDisabled` — Playwright's actionability check
 *   refuses to click a natively `disabled` element, which would assert its
 *   heuristic instead of the component (`Switch`/`RadioList` precedent). The
 *   interaction is delivered the only way a browser allows.
 * - `renders semantic labelIcon names as icons` — upstream's `labelIcon` is
 *   `ReactNode | IconType` and it passes the semantic name `"info"`; this port
 *   types `labelIcon` as a `Snippet`, so the caller authors the `<Icon
 *   icon="info" size="sm" color="inherit" />` the component would have built.
 *   The text comparison additionally collapses whitespace — Svelte emits a
 *   collapsed-whitespace text node between sibling elements written on separate
 *   template lines where JSX emits none, with or without a `labelIcon`. See the
 *   case.
 * - `keeps the checkbox focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, which
 *   counts `aria-disabled="true"` as disabled; upstream's `not.toBeDisabled()`
 *   is jest-dom's native-only reading. The native question is asked directly.
 * - `shows the reason tooltip on keyboard focus` — Playwright's synthetic Tab
 *   does not settle onto a `<input type="checkbox">` in this environment, so a
 *   Tab enters keyboard modality and focus is then placed on the control, which
 *   `:focus-visible` treats as keyboard-originated — the `focusin` gate the
 *   component actually reads. Same finding as the `Switch` and `RadioList` ports.
 * - `blocks toggling while focusable-disabled` — the control is
 *   focusable-disabled (`aria-disabled`, not native), which Playwright refuses to
 *   click. Upstream's `user.click` becomes a native `.click()`: the same
 *   untrusted dispatch that toggles the box and fires `change`, which is what
 *   exercises the port's re-sync guard.
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

/** The native checkbox input. */
function inputIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[type="checkbox"]');
	if (!(el instanceof HTMLInputElement)) {
		throw new Error('expected a checkbox input');
	}
	return el;
}

/**
 * Upstream's `getRow()`: `getByRole('checkbox').closest('div').parentElement` —
 * the checkbox *row* that carries the disabled-reason tooltip's hover listeners.
 * The nesting depth is load-bearing: `closest('div')` is the positioned wrapper
 * around the input, and its parent is the row.
 */
function rowOf(input: HTMLInputElement): HTMLElement {
	const el = input.closest('div')?.parentElement;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a checkbox row');
	}
	return el;
}

/** The tooltip layer, present (but `display:none`) whenever a reason renders. */
function tooltipIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[role="tooltip"]');
	return el instanceof HTMLElement ? el : null;
}

describe('CheckboxInput', () => {
	it('renders with label', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: noop }
		});
		await expect.element(screen.getByLabelText('Accept terms')).toBeInTheDocument();
	});

	it('renders as unchecked by default', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: noop }
		});
		await expect.element(screen.getByRole('checkbox')).not.toBeChecked();
	});

	it('renders as checked when value prop is true', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: true, onChange: noop }
		});
		await expect.element(screen.getByRole('checkbox')).toBeChecked();
	});

	it('calls onChange with new checked state when clicked', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: handleChange }
		});

		await userEvent.click(screen.getByRole('checkbox'));
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
	});

	it('calls onChange with false when unchecking', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: true, onChange: handleChange }
		});

		await userEvent.click(screen.getByRole('checkbox'));
		expect(handleChange).toHaveBeenCalledWith(false, expect.any(Object));
	});

	it('works when clicking on the label', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: handleChange }
		});

		await userEvent.click(screen.getByText('Accept terms'));
		expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
	});

	it('renders description when provided', async () => {
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Subscribe',
				description: 'Receive weekly updates',
				value: false,
				onChange: noop
			}
		});
		await expect.element(screen.getByText('Receive weekly updates')).toBeInTheDocument();
	});

	it('associates description with checkbox via aria-describedby', async () => {
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Subscribe',
				description: 'Receive weekly updates',
				value: false,
				onChange: noop
			}
		});
		const checkbox = inputIn(screen.container);
		const description = screen.getByText('Receive weekly updates').element();
		expect(checkbox).toHaveAttribute('aria-describedby', description.id);
	});

	it('toggles when clicking on the description', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Subscribe',
				description: 'Receive weekly updates',
				value: false,
				onChange: handleChange
			}
		});

		const description = screen.getByText('Receive weekly updates');
		await userEvent.click(description);
		expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));

		// Park the real pointer off the element again. Upstream's `user.click` runs
		// in jsdom, which has no pointer to leave anywhere; Playwright's leaves the
		// physical mouse at the description's centre, and Chromium re-hit-tests
		// hover after each later render — so the next case's freshly-mounted row
		// lands under a live pointer and re-opens the `disabledMessage` tooltip
		// straight after that case's synthetic `mouseleave` closes it. This restores
		// the pointer state the file starts with; it asserts nothing.
		await userEvent.unhover(description);
	});

	it('does not fold the description into the checkbox accessible name', async () => {
		// The description stays a sibling of the <label>, so it must NOT become
		// part of the checkbox's accessible name (which is computed from the
		// associated label). It belongs in the accessible DESCRIPTION only
		// (via aria-describedby) — otherwise screen readers announce it twice.
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Email notifications',
				description: "We'll send weekly digests",
				value: false,
				onChange: noop
			}
		});
		const checkbox = screen.getByRole('checkbox');
		await expect.element(checkbox).toHaveAccessibleName('Email notifications');
		await expect.element(checkbox).toHaveAccessibleDescription("We'll send weekly digests");
	});

	it('is disabled when isDisabled prop is true', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: noop, isDisabled: true }
		});
		await expect.element(screen.getByRole('checkbox')).toBeDisabled();
	});

	it('does not call onChange when isDisabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: handleChange, isDisabled: true }
		});

		// Restated delivery: upstream uses `user.click`. Playwright refuses to click
		// a natively-disabled element (its actionability heuristic), which would
		// assert the heuristic rather than the component. The interaction is aimed at
		// the control the only way a browser allows — a focus a disabled element
		// declines, then real key events. Nothing reaches it, so nothing calls back.
		const checkbox = inputIn(screen.container);
		checkbox.focus();
		expect(document.activeElement).not.toBe(checkbox);
		await userEvent.keyboard(' ');
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('forwards data-testid to the input', async () => {
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Accept terms',
				value: false,
				onChange: noop,
				'data-testid': 'accept-terms-checkbox'
			}
		});
		expect(screen.getByTestId('accept-terms-checkbox').element()).toBe(inputIn(screen.container));
	});

	it('forwards arbitrary data-* attributes to the input', async () => {
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Accept terms',
				value: false,
				onChange: noop,
				'data-tracking-id': 'checkbox-42'
			}
		});
		await expect
			.element(screen.getByRole('checkbox'))
			.toHaveAttribute('data-tracking-id', 'checkbox-42');
	});

	it('does not let rest props override checked, disabled, or type', async () => {
		// Not part of CheckboxInputProps; spread (rather than named props) to
		// sidestep the excess-property check the same way a real caller's spread
		// rest-props object would arrive untyped at runtime — upstream's own trick.
		const foreignAttrs: Record<string, unknown> = {
			checked: false,
			disabled: false,
			type: 'text'
		};
		const screen = await render(CheckboxInput, {
			props: {
				...foreignAttrs,
				label: 'Accept terms',
				value: true,
				onChange: noop,
				isDisabled: true
			} as unknown as CheckboxInputProps
		});
		const checkbox = inputIn(screen.container);
		expect(checkbox).toBeChecked();
		expect(checkbox).toBeDisabled();
		expect(checkbox).toHaveAttribute('type', 'checkbox');
	});

	// Counterpart to upstream's `forwards ref correctly` (`:223`); see the file
	// header. This port spreads `...rest` onto the `<input>` — the very element
	// upstream's `ref` targets — so the attachment receives it, and the assertion
	// is upstream's strengthened from `expect.any(HTMLInputElement)` to identity.
	it('hands the input element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Accept terms',
				value: false,
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
		expect(attached.mock.calls[0][0]).toBe(inputIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Select row', isLabelHidden: true, value: false, onChange: noop }
		});
		const label = screen.getByText('Select row');
		await expect.element(label).toBeInTheDocument();
		// Label should still be accessible
		await expect.element(screen.getByLabelText('Select row')).toBeInTheDocument();
	});

	it('keeps description linked via aria-describedby when isLabelHidden', async () => {
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Select row',
				isLabelHidden: true,
				description: 'Selects this row for bulk actions',
				value: false,
				onChange: noop
			}
		});
		const checkbox = inputIn(screen.container);
		const description = screen.getByText('Selects this row for bulk actions').element();
		expect(description.id).not.toBe('');
		expect(checkbox.getAttribute('aria-describedby')).toContain(description.id);
	});

	it('shows label visually by default', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: noop }
		});
		await expect.element(screen.getByText('Accept terms')).toBeVisible();
	});

	it('sets aria-busy when loading', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: noop, isLoading: true }
		});
		await expect.element(screen.getByRole('checkbox')).toHaveAttribute('aria-busy', 'true');
	});

	it('exposes indeterminate state via the native indeterminate property', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Select all', value: 'indeterminate', onChange: noop }
		});
		const checkbox = inputIn(screen.container);
		// Native checkboxes expose mixed state through the DOM indeterminate
		// property, which browsers map to aria-checked="mixed". A redundant
		// aria-checked attribute is intentionally NOT set (forms-16).
		expect(checkbox).toBeInstanceOf(HTMLInputElement);
		expect(checkbox.indeterminate).toBe(true);
		expect(checkbox).not.toHaveAttribute('aria-checked');
	});

	// Restated twice (see the file header): `labelIcon` is a `Snippet` here, so the
	// `<Icon icon="info" size="sm" color="inherit" />` upstream builds from the
	// semantic name is authored in the fixture; and the text comparison collapses
	// whitespace. Svelte emits a collapsed-whitespace text node between sibling
	// elements written on separate template lines, where JSX emits none — three on
	// each side of the label here, and *identically so with no `labelIcon` at all*
	// (verified against a bare `CheckboxInput` render), so it is a property of the
	// templating language, not of the icon. Normalising keeps upstream's scope (the
	// whole container, which is what catches an icon leaking its name as text) and
	// its question (the icon contributes no text of its own).
	it('renders semantic labelIcon names as icons', async () => {
		const screen = await render(CheckboxInputLabelIcon, {
			props: { label: 'Accept terms', value: false, onChange: noop }
		});

		expect(screen.container.textContent?.replace(/\s+/g, ' ').trim()).toBe('Accept terms');
		expect(screen.container.querySelector('.astryx-icon')).toBeInTheDocument();
	});

	it('renders status message and sets aria-invalid for error', async () => {
		const screen = await render(CheckboxInput, {
			props: {
				label: 'Accept terms',
				value: false,
				onChange: noop,
				status: { type: 'error', message: 'Required field' }
			}
		});
		await expect.element(screen.getByText('Required field')).toBeInTheDocument();
		await expect.element(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
	});

	// Regression: the status is conditionally mounted, so it must be announced
	// through the persistent useAnnounce live region — a live region born
	// together with its content is not reliably announced.
	it('announces a status message that appears after mount', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept terms', value: false, onChange: noop }
		});
		expect(document.querySelector('[data-astryx-live-region="assertive"]')).toBeNull();

		await screen.rerender({
			label: 'Accept terms',
			value: false,
			onChange: noop,
			status: { type: 'error', message: 'Required field' }
		});
		await vi.waitFor(() => {
			expect(document.querySelector('[data-astryx-live-region="assertive"]')).toHaveTextContent(
				'Required field'
			);
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(CheckboxInput, {
				props: {
					label: 'Accept terms',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Terms are managed by your administrator'
				}
			});
			const tooltip = tooltipIn(screen.container)!;
			expect(tooltip).toHaveTextContent('Terms are managed by your administrator');

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
			const screen = await render(CheckboxInput, {
				props: {
					label: 'Accept terms',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Terms are managed by your administrator'
				}
			});
			const tooltip = tooltipIn(screen.container)!;
			const checkbox = inputIn(screen.container);
			// Restated in delivery (see the file header): a Tab enters keyboard
			// modality, then focus is placed on the control so `:focus-visible` — the
			// component's `focusin` gate — treats it as keyboard-originated.
			await userEvent.tab();
			checkbox.focus();
			await expect.element(screen.getByRole('checkbox')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(CheckboxInput, {
				props: {
					label: 'Accept terms',
					value: false,
					onChange: noop,
					disabledMessage: 'Terms are managed by your administrator'
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(CheckboxInput, {
				props: { label: 'Accept terms', value: false, onChange: noop, isDisabled: true }
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('keeps the checkbox focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(CheckboxInput, {
				props: {
					label: 'Accept terms',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Terms are managed by your administrator'
				}
			});
			const checkbox = inputIn(screen.container);
			// Restated matcher (see the file header): vitest-browser's `toBeDisabled`
			// is Playwright's ARIA computation, which counts `aria-disabled="true"` as
			// disabled — so it would answer "disabled" on the very attribute the next
			// line asserts. Upstream's question is asked directly: no native
			// `disabled`, which is what keeps the control in the tab order.
			expect(checkbox).not.toHaveAttribute('disabled');
			expect(checkbox.disabled).toBe(false);
			expect(checkbox).toHaveAttribute('aria-disabled', 'true');
		});

		it('links the reason tooltip via aria-describedby', async () => {
			const screen = await render(CheckboxInput, {
				props: {
					label: 'Accept terms',
					value: false,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'Terms are managed by your administrator'
				}
			});
			const checkbox = inputIn(screen.container);
			const tooltip = tooltipIn(screen.container)!;
			expect(checkbox.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks toggling while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(CheckboxInput, {
				props: {
					label: 'Accept terms',
					value: false,
					onChange,
					isDisabled: true,
					disabledMessage: 'Terms are managed by your administrator'
				}
			});
			const checkbox = inputIn(screen.container);
			// Restated delivery (see the file header): the control is
			// focusable-disabled (`aria-disabled`, not native), which Playwright
			// refuses to click. A native `.click()` toggles the box and fires `change`
			// — which is precisely what exercises the guard.
			checkbox.click();
			expect(onChange).not.toHaveBeenCalled();
			// The browser flipped `.checked` before the handler ran; React re-asserts a
			// controlled input's `checked` on re-render, and this port re-asserts it by
			// hand from the guard (`syncNativeState`). This pins that re-sync — without
			// it the box would announce checked while `value` stayed false.
			expect(checkbox).not.toBeChecked();
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(CheckboxInput, {
				props: { label: 'Accept terms', value: false, onChange: noop, isDisabled: true }
			});
			await expect.element(screen.getByRole('checkbox')).toBeDisabled();
		});
	});

	describe('form participation', () => {
		it('submits under htmlName when checked', async () => {
			const screen = await render(CheckboxInputForm, {
				props: { checkbox: { label: 'Terms', htmlName: 'terms', value: true, onChange: noop } }
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('terms')).toBe('on');
		});

		it('is excluded from form data when disabled, even with a disabledMessage', async () => {
			const screen = await render(CheckboxInputForm, {
				props: {
					checkbox: {
						label: 'Terms',
						htmlName: 'terms',
						value: true,
						onChange: noop,
						isDisabled: true,
						disabledMessage: 'Locked'
					}
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});

		it('submits nothing when unchecked', async () => {
			const screen = await render(CheckboxInputForm, {
				props: { checkbox: { label: 'Terms', htmlName: 'terms', value: false, onChange: noop } }
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});
});

// Neither jsdom nor a Chromium test page can emulate forced-colors rendering, so
// these assert that the compiled output includes the forced-colors rules; visual
// behavior needs manual verification under Windows High Contrast. See
// `forced-colors.ts` for why the scan is scoped to the rendered subtree here and
// global upstream.
describe('forced colors (WCAG 1.4.11)', () => {
	it('compiles a forced-colors fill so the indeterminate mark survives Windows High Contrast', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'All', value: 'indeterminate', onChange: noop }
		});
		// The painted indeterminate bar would be stripped to Canvas (invisible);
		// CanvasText keeps it perceivable.
		expect(forcedColorsCssIn(screen.container)).toContain('background-color: canvastext;');
	});

	it('compiles a forced-colors color so the checkmark survives Windows High Contrast', async () => {
		const screen = await render(CheckboxInput, {
			props: { label: 'Accept', value: true, onChange: noop }
		});
		// The check strokes with currentColor; forced colors leaves it the same
		// white as the flattened box, so it needs its own CanvasText color to stay
		// perceivable on the Canvas box.
		expect(forcedColorsCssIn(screen.container)).toContain('color: canvastext;');
	});
});
