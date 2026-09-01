/** PORTS: DateInput/DateInput.test.tsx */

import { afterAll, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import DateInput from '$lib/components/date-input/date-input.svelte';
import Icon from '$lib/components/icon/icon.svelte';
import type { ISODateString } from '$lib/utils/date-types.js';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import DateInputGroupProbe from './fixtures/date-input-group-probe.svelte';
import DateInputI18n from './fixtures/date-input-i18n.svelte';

/**
 * Astryx's `DateInput/DateInput.test.tsx`, ported case for case — **84 of
 * upstream's 94 at v0.4.5** (49 of the 50 directly in `describe('DateInput')`,
 * 5 in `describe('hasClear')`, 4 in `describe('incomplete typed input')`, 1 in
 * `describe('external value changes')`, 2 in `describe('InputGroup')`, 8 in
 * `describe('disabledMessage')`, 8 in `describe('format')`, 3 in
 * `describe('weekStartsOn')`, 2 of the 4 in the top-level `DateInput clear icon
 * theme target` and 2 in `DateInput disabled theme state`).
 *
 * **The count is re-derived at the v0.4.5 pin.** It read "84 of upstream's 93 at
 * v0.4.1" and named 9 absences; upstream has **94**, so a tenth had appeared and
 * was going unnamed. It is `does not commit on a composing Enter (IME)`
 * (upstream `:539`), and it is **blocked on a port defect**, not deferred to
 * another workstream: `date-input.svelte`'s keydown handler has no
 * `isImeKeyEvent` guard, where upstream's has carried one since the case landed,
 * so a CJK user committing an IME candidate with Enter commits the pending date.
 * `utils/ime.ts` is ported and exported here; it is simply not called from this
 * component. The same gap blocks two cases in `date-time-input` and one each in
 * `time-input` and `selector`.
 *
 * The other 9 absences are all pre-v0.3.0 work belonging to other workstreams,
 * which land with them rather than here:
 * - `DateInput statusVariant forwarding` (2)
 * - `DateInput calendar-toggle icon theme target` (5)
 * - the two `DateInput clear icon theme target` cases that v0.4.1 did *not*
 *   touch: `keeps the clear button functional alongside the target` (whose
 *   assertion `describe('hasClear')`'s `calls onChange with undefined when clear
 *   is clicked` already makes) and `exposes date-input-clear-icon so a theme
 *   reaches the icon color, size, and hover` (a pure `defineTheme` →
 *   `generateThemeCss` generation case with no `DateInput` in it; the
 *   `selector.svelte.test.ts` block is the pattern it will follow).
 *
 * There is no `displayName` case, no snapshot and no no-JSX construction form in
 * the file, so nothing is React-only except the ref case, which gets a
 * counterpart.
 *
 * ## v0.3.0 → v0.4.1
 *
 * Eight upstream cases changed or appeared, and all eight are here:
 * `resolves the invalid-date announcement from the i18n catalog` (the hardcoded
 * "Invalid date" became `t('@astryx.dateInput.invalidDate')`), the three
 * `weekStartsOn` cases (the new prop, forwarded raw to `Calendar`), the two
 * `DateInput disabled theme state` cases (`themeProps` now reflects
 * `disabled: isDisabled ? 'disabled' : null`), and the two clear-glyph cases
 * that v0.4.1 rewrote when the clear affordance moved to the shared
 * `InputClearButton` — `renders the astryx-input-clear-icon target (plus the
 * legacy alias) on the clear glyph` and `routes the clear glyph through the
 * shared clear button, keeping the legacy target`. Those last two are the only
 * members of their upstream describe that this file carries, for the reason
 * given above.
 *
 * **The runtime locale is no longer stubbed, and that is the point.** This file
 * used to substitute `Intl.DateTimeFormat` so an omitted locale resolved to
 * `en-US`, because `plainDateFormat` formatted with
 * `new Intl.DateTimeFormat(undefined, …)` and `parseDateInput` branched on an
 * `isLocaleDayFirst()` that read the same host default — so "January 25, 2026"
 * rendered as "25 January 2026" on a Chromium reporting `en-GB` or `en-IN`.
 * Both helpers now take upstream's `locale` argument and default it to `'en'`,
 * exactly as `useLocale()` does, so the display is host-independent on its own
 * and the stub has nothing left to do. It is deleted rather than left inert:
 * kept, it would hold all 84 cases green if the locale argument were ever
 * dropped again, which is the regression this file is now positioned to catch.
 *
 * Upstream imports `getButton`/`queryButton` from `__tests__/fastRoleQueries`
 * purely for jsdom speed — the helper keeps RTL's exact accessible-name
 * algorithm and only relaxes visibility filtering. A real browser computes those
 * names natively, so every `getButton(x)` here is
 * `getByRole('button', {name: x})`. No `includeHidden` is needed for the
 * calendar toggle or the clear button: both sit outside the popover, and the
 * closed popover's own buttons really are `display: none` here, exactly as
 * upstream's are unmounted-in-effect… except that `Layer` renders its children
 * unconditionally into a `popover` element, so the `Calendar` *is* mounted
 * throughout. That is upstream's structure too (`popover.render(...)` is called
 * unconditionally).
 *
 * Upstream's `disabledMessage` `beforeEach` (`:715-722`) shims
 * `showPopover`/`hidePopover` because jsdom implements neither, and its
 * `h = {hidden: true}` exists because a jsdom popover is not "visible" to the
 * accessibility tree. The browser project needs neither: Chromium has the real
 * Popover API, so the open state is read with `matches(':popover-open')` and
 * `{hidden: true}` survives as `{includeHidden: true}`, since a *closed*
 * popover really is `display: none` here. This is the arrangement
 * `number-input`, `file-input`, `time-input` and `date-range-input` already set
 * for the same block.
 *
 * `changeAction` never appears in the upstream file, so nothing here exercises
 * `createOptimistic` (`internal/optimistic.svelte.ts`); `pagination.svelte.test.ts`
 * is where that pattern is tested.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:44`)** — Svelte has no `ref` prop and this
 *   port omits it. Upstream's `ref` is merged onto the `<input>` while its
 *   `...rest` goes to the wrapper `<div>`; this port keeps that split (the props
 *   type is `BaseProps<HTMLDivElement>` for exactly that reason), so the seam a
 *   consumer actually has is an attachment through the rest props, and it
 *   receives the wrapper element. It checks more than upstream's does — the
 *   element itself rather than only that a callback ran — but of the div, not
 *   the input.
 *
 * Restated, each noted at the case:
 * - every `getByDisplayValue(...)` — vitest-browser has no such locator, so the
 *   input is located by role and its value asserted with `toHaveValue`, which is
 *   the same question (`getByDisplayValue` matches on `element.value`).
 * - every `fireEvent.change/blur/keyDown` — vitest-browser has no `fireEvent`.
 *   `change` becomes an assignment plus a bubbling native `input` event (React's
 *   `onChange` on an input *is* that event, and it is what this port binds);
 *   `blur` and `keyDown` become the same native events dispatched at the input.
 *   Each matters because the point is a whole value arriving at once, or a key
 *   arriving without Playwright's actionability checks in the way.
 * - `announces an alert message …` / `does not announce …` — upstream scopes to
 *   the render container because `Calendar`'s `useAnnounce` mounts a global
 *   `role="alert"` region on `document.body`. `render()`'s query helpers are
 *   bound to `baseElement` (the body) here, so the container-scoped
 *   `screen.locator` is used instead; it is exactly `within(container)`.
 * - `handles Escape keydown without error` — upstream's body has **no
 *   assertion** at all, which `expect.requireAssertions` rejects. Restated to
 *   assert what the title claims.
 * - `does not open popover when clicking calendar button while disabled` —
 *   Playwright refuses to click a disabled button, which would assert its
 *   actionability heuristic rather than the component's guard.
 * - the four `incomplete typed input` cases — `not.toThrow()` only covers the
 *   synchronous handler here; Svelte's re-render is flushed a microtask later,
 *   so a crash in the render would escape it. Each keeps upstream's
 *   `not.toThrow()` and adds the awaited assertion that proves the flush landed.
 * - every case that fires a *second* event after a `change` gets an
 *   `await flush()` between them; see the helper. React renders synchronously
 *   inside each `fireEvent`, so upstream's two events are two renders, and
 *   collapsing them into one Svelte batch hides the intermediate state the case
 *   is about. Nothing about the component changes — a user cannot blur in the
 *   same microtask as their keystroke.
 * - every `getByLabelText`/`getByText` carries `{exact: true}`. RTL's queries
 *   are whole-string by default; Playwright's text and label engines are
 *   substring *and* case-insensitive, so a bare `getByLabelText('Date')` also
 *   matches the popover's `aria-label="Choose date"` and reports a strict-mode
 *   violation. `{exact: true}` restores RTL's semantics rather than relaxing
 *   the query.
 * - `keeps the input focusable via aria-disabled when a reason is provided` and
 *   `preserves disabledMessage tooltip wiring when grouped` — vitest-browser's
 *   `toBeDisabled` is Playwright's ARIA computation, not jest-dom's
 *   native-attribute one, and they disagree by design on exactly the
 *   `aria-disabled` these cases require.
 * - `blocks value changes and opening while focusable-disabled` — Playwright
 *   refuses to click or type into an `aria-disabled` element at all.
 * - the `disabledMessage` hover case — upstream's `fireEvent.mouseEnter`/
 *   `mouseLeave` target the wrapper div, which a real pointer at that element's
 *   centre cannot do (the input fills it), so the events are dispatched where
 *   upstream dispatches them.
 * - `uses group ARIA and skips standalone Field chrome when grouped` —
 *   upstream's document-wide `document.querySelectorAll('.astryx-field')` is
 *   scoped to the render container, which is what RTL's freshly-cleaned
 *   `document` amounts to.
 */

afterAll(() => {
	// `Calendar.navigateTo` announces the newly visible month through the
	// singleton live regions; drop them so the next file starts clean.
	__resetLiveRegionsForTest();
});

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

/** Upstream's `fireEvent.blur(input)`. */
function blur(input: HTMLInputElement): void {
	input.dispatchEvent(new FocusEvent('blur'));
}

/**
 * React re-renders synchronously inside each `fireEvent`, so upstream's
 * `change` then `blur` are two renders. Svelte batches to a microtask, and its
 * `set_value` skips the DOM write when the value it would write equals the one
 * it last wrote — so firing both in one tick makes `pendingInput` go
 * `null → 'not a date' → null` with no render in between, and the value this
 * helper assigned by hand is never reconciled away. `await flush()` between the
 * two events is upstream's second render, not a workaround for one: a real user
 * cannot blur in the same microtask as their keystroke.
 */
function flush(): Promise<void> {
	return tick();
}

/** Upstream's `fireEvent.keyDown(input, init)`. */
function keyDown(input: HTMLInputElement, init: KeyboardEventInit): void {
	input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
}

const noop = (): void => {};

const iso = (value: string): ISODateString => value as ISODateString;

describe('DateInput', () => {
	it('renders with label', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByLabelText('Date', { exact: true })).toBeInTheDocument();
	});

	it('renders with placeholder', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, placeholder: 'Pick a date' }
		});
		await expect.element(screen.getByPlaceholder('Pick a date')).toBeInTheDocument();
	});

	// Restated: no `getByDisplayValue` locator exists here; `toHaveValue` on the
	// role-located input asks the same question of the same property.
	it('displays formatted date when value is provided', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveValue('January 25, 2026');
	});

	// Counterpart to upstream's `forwards ref correctly` (`:44`); see the file
	// header. Upstream's `ref` lands on the `<input>` and its `...rest` on the
	// wrapper `<div>`; this port has only the latter seam, and it receives the
	// element itself rather than merely proving a callback ran.
	it('forwards ref correctly', async () => {
		const attached = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, [createAttachmentKey()]: attached }
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(wrapperOf(inputIn(screen.container)));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isLabelHidden: true, onChange: noop }
		});
		const label = screen.getByText('Date', { exact: true });
		await expect.element(label).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Date', { exact: true })).toBeInTheDocument();
	});

	it('shows label visually by default', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Event date', onChange: noop }
		});
		const label = screen.getByText('Event date', { exact: true });
		await expect.element(label).toBeVisible();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isRequired: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
	});

	it('does not set aria-required when isRequired is false', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-required');
	});

	it('sets disabled attribute when isDisabled is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isDisabled: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeDisabled();
	});

	it('is not disabled by default', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).not.toBeDisabled();
	});

	// Restated only in scope: upstream's `document.querySelector` is the render
	// container in an RTL-cleaned document.
	it('renders calendar icon', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		expect(screen.container.querySelector('svg')).not.toBeNull();
	});

	it('combobox input has aria-haspopup="dialog" attribute', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'dialog');
	});

	it('calendar button is focusable and clickable', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		const button = screen.getByRole('button', { name: 'Open calendar', exact: true });
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).not.toBeDisabled();
	});

	it('calendar button is disabled when isDisabled is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isDisabled: true, onChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Open calendar', exact: true }))
			.toBeDisabled();
	});

	it('does not call onChange while typing invalid input', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange }
		});

		changeValue(inputIn(screen.container), 'invalid');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('sets aria-invalid="true" when typed input is unparseable', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});

		const input = screen.getByRole('combobox');
		changeValue(inputIn(screen.container), '13/45/2024');

		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
	});

	it('does not set aria-invalid when typed input is a valid date', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});

		const input = screen.getByRole('combobox');
		changeValue(inputIn(screen.container), '03/15/2026');

		await expect.element(input).not.toHaveAttribute('aria-invalid');
	});

	it('announces an alert message when typed input is invalid', async () => {
		// Scope to the component's own container: the embedded Calendar uses the
		// shared `useAnnounce` hook, whose global polite/assertive live-region pair
		// (both mounted on document.body by any announce) would otherwise make a
		// body-wide `getByRole('alert')` ambiguous. `screen.locator` is
		// `page.elementLocator(container)` — upstream's `within(container)`.
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});

		changeValue(inputIn(screen.container), '13/45/2024');

		await expect.element(screen.locator.getByRole('alert')).toHaveTextContent('Invalid date');
	});

	it('does not announce an alert message when input is valid', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});

		changeValue(inputIn(screen.container), '03/15/2026');

		await expect.element(screen.locator.getByRole('alert')).toHaveTextContent('');
		expect(screen.getByText('Invalid date', { exact: true }).query()).toBeNull();
	});

	// New at v0.4.1: the live region's copy is `t('@astryx.dateInput.invalidDate')`
	// rather than a hardcoded English string. `screen.locator` is upstream's
	// `within(container)`, for the reason the two cases above give.
	it('resolves the invalid-date announcement from the i18n catalog', async () => {
		const screen = await render(DateInputI18n, {
			props: {
				locale: 'en',
				overrides: { en: { '@astryx.dateInput.invalidDate': 'Ungültiges Datum' } },
				label: 'Date',
				onChange: noop
			}
		});

		changeValue(inputIn(screen.container), '13/45/2024');

		await expect.element(screen.locator.getByRole('alert')).toHaveTextContent('Ungültiges Datum');
	});

	it('reverts to previous value on blur when input is invalid', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange }
		});

		const input = inputIn(screen.container);
		changeValue(input, 'not a date');
		// See `flush` — upstream's `fireEvent.change` is a render of its own.
		await flush();
		blur(input);

		await expect.element(screen.getByRole('combobox')).toHaveValue('January 25, 2026');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('calls onChange on blur when input is valid', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange }
		});

		const input = inputIn(screen.container);
		changeValue(input, '03/15/2026');
		await flush();
		blur(input);

		expect(onChange).toHaveBeenCalledWith('2026-03-15');
	});

	it('calls onChange immediately when input becomes valid', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange }
		});

		changeValue(inputIn(screen.container), '03/15/2026');

		expect(onChange).toHaveBeenCalledWith('2026-03-15');
	});

	// --- P0: Text input respects min/max/dateConstraints ---

	it('does not call onChange when typed date is before min', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange, min: iso('2026-03-01'), max: iso('2026-12-31') }
		});

		changeValue(inputIn(screen.container), '02/15/2026');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('does not call onChange when typed date is after max', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange, min: iso('2026-01-01'), max: iso('2026-03-01') }
		});

		changeValue(inputIn(screen.container), '04/15/2026');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('does not call onChange when typed date fails dateConstraints', async () => {
		const onChange = vi.fn();
		// Constraint: no weekends
		const noWeekends = (date: Date): boolean => date.getDay() !== 0 && date.getDay() !== 6;
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange, dateConstraints: [noWeekends] }
		});

		// 2026-03-15 is a Sunday
		changeValue(inputIn(screen.container), '03/15/2026');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('calls onChange when typed date is within min/max range', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange, min: iso('2026-01-01'), max: iso('2026-12-31') }
		});

		changeValue(inputIn(screen.container), '06/15/2026');

		expect(onChange).toHaveBeenCalledWith('2026-06-15');
	});

	it('reverts on blur when typed date violates constraints', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				onChange,
				value: iso('2026-03-10'),
				min: iso('2026-03-01'),
				max: iso('2026-03-31')
			}
		});

		const input = inputIn(screen.container);
		changeValue(input, '04/15/2026');
		await flush();
		blur(input);

		// Should revert to previous value
		await expect.element(screen.getByRole('combobox')).toHaveValue('March 10, 2026');
		expect(onChange).not.toHaveBeenCalled();
	});

	// --- P1: Input disabled during isBusy (isLoading) ---

	it('disables input and button when isLoading is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isLoading: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeDisabled();
		await expect
			.element(screen.getByRole('button', { name: 'Open calendar', exact: true }))
			.toBeDisabled();
	});

	it('shows spinner when isLoading is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isLoading: true, onChange: noop }
		});
		// Spinner renders with role="status" or an SVG animation
		const spinner = screen.container.querySelector('[aria-busy="true"]');
		expect(spinner).not.toBeNull();
	});

	// --- P1: Escape key handler ---

	// Restated: upstream's body has no assertion at all — it fires the event and
	// ends, which `expect.requireAssertions` rejects and which would also pass
	// vacuously. The title's claim is asserted instead: Escape neither throws nor
	// disturbs the closed popover.
	it('handles Escape keydown without error', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		const input = inputIn(screen.container);

		// Escape should not throw even when popover isn't open.
		expect(() => keyDown(input, { key: 'Escape' })).not.toThrow();
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
	});

	// --- P2: Input has role="combobox" ---

	it('input has role="combobox"', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('input has aria-expanded attribute', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens the calendar popover on ArrowDown (keyboard, forms-13)', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		const input = screen.getByRole('combobox');
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
		keyDown(inputIn(screen.container), { key: 'ArrowDown' });
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
	});

	it('opens the calendar popover on Alt+ArrowDown (keyboard, forms-13)', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		const input = screen.getByRole('combobox');
		keyDown(inputIn(screen.container), { key: 'ArrowDown', altKey: true });
		await expect.element(input).toHaveAttribute('aria-expanded', 'true');
	});

	it('does not open on ArrowDown when disabled', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isDisabled: true, onChange: noop }
		});
		const input = screen.getByRole('combobox');
		keyDown(inputIn(screen.container), { key: 'ArrowDown' });
		await expect.element(input).toHaveAttribute('aria-expanded', 'false');
	});

	it('input has aria-haspopup="dialog"', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'dialog');
	});

	// --- P1: Tab order: calendar button first, then input ---

	it('renders calendar button before input in DOM order', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		const input = screen.container.querySelector('input');
		const button = screen.container.querySelector('button');
		// Calendar button should come before input in the DOM
		expect(button!.compareDocumentPosition(input!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});

	// --- P2: Status rendering ---

	it('renders status icon for error status', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, status: { type: 'error', message: 'Bad date' } }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
	});

	it('renders status icon for warning status', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, status: { type: 'warning', message: 'Watch out' } }
		});
		// Should not be aria-invalid for warnings
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
	});

	it('renders status icon for success status', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, status: { type: 'success', message: 'Looks good' } }
		});
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
	});

	// --- P1: Description and aria-describedby ---

	it('renders description and links via aria-describedby', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', description: 'Pick your preferred date', onChange: noop }
		});
		const input = inputIn(screen.container);
		await expect
			.element(screen.getByText('Pick your preferred date', { exact: true }))
			.toBeInTheDocument();
		expect(input).toHaveAttribute('aria-describedby');
		const describedBy = input.getAttribute('aria-describedby')!;
		const descEl = document.getElementById(describedBy);
		expect(descEl).toHaveTextContent('Pick your preferred date');
	});

	it('links status message via aria-describedby', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, status: { type: 'error', message: 'Invalid date' } }
		});
		const input = inputIn(screen.container);
		const describedBy = input.getAttribute('aria-describedby')!;
		const ids = describedBy.split(' ');
		const found = ids.some((id) => {
			const el = document.getElementById(id);
			return el?.textContent?.includes('Invalid date');
		});
		expect(found).toBe(true);
	});

	// --- P1: Clearing value on empty blur ---

	it('calls onChange with undefined when input is cleared and blurred', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange }
		});

		const input = inputIn(screen.container);
		changeValue(input, '');
		await flush();
		blur(input);

		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	// --- P1: Disabled prevents onChange ---

	it('disables input when isDisabled is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isDisabled: true, onChange: noop }
		});

		await expect.element(screen.getByRole('combobox')).toBeDisabled();
	});

	// --- P1: aria-busy on input ---

	it('sets aria-busy on input when isLoading is true', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isLoading: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
	});

	it('does not set aria-busy when not loading', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-busy');
	});

	// --- P1: Popover does not open when disabled ---

	// Restated in how the click is delivered: Playwright refuses to click a
	// disabled button, so upstream's `fireEvent.click(button)` is dispatched
	// directly — which is the stronger test anyway, since it proves the guard
	// rather than the browser's dead-button behaviour.
	it('does not open popover when clicking calendar button while disabled', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', isDisabled: true, onChange: noop }
		});
		const button = screen.getByRole('button', { name: 'Open calendar', exact: true }).element();
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
	});

	// --- Enter key commits typed date ---

	it('commits typed date and fires onChange on Enter key', async () => {
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange }
		});

		const input = inputIn(screen.container);
		changeValue(input, '03/15/2026');
		await flush();
		onChange.mockClear();
		keyDown(input, { key: 'Enter' });

		expect(onChange).toHaveBeenCalledWith('2026-03-15');
	});

	// --- Arrow-down opens calendar popover ---

	// Note: upstream limits its popover coverage because jsdom has no Popover
	// API; the three cases it does keep (ArrowDown, Alt+ArrowDown, disabled) run
	// against the real one here.

	describe('hasClear', () => {
		it('shows clear button when hasClear is true and value exists', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-15'), onChange: noop, hasClear: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Clear Date', exact: true }))
				.toBeInTheDocument();
		});

		it('does not show clear button when value is undefined', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange: noop, hasClear: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Date', exact: true }).query()).toBeNull();
		});

		it('does not show clear button when hasClear is false', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-15'), onChange: noop }
			});
			expect(screen.getByRole('button', { name: 'Clear Date', exact: true }).query()).toBeNull();
		});

		it('does not show clear button when disabled', async () => {
			const screen = await render(DateInput, {
				props: {
					label: 'Date',
					value: iso('2026-01-15'),
					onChange: noop,
					hasClear: true,
					isDisabled: true
				}
			});
			expect(screen.getByRole('button', { name: 'Clear Date', exact: true }).query()).toBeNull();
		});

		it('calls onChange with undefined when clear is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-15'), onChange, hasClear: true }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear Date', exact: true }));
			expect(onChange).toHaveBeenCalledWith(undefined);
		});
	});

	// --- Regression: in-progress / leading-zero input must not crash ---

	describe('incomplete typed input', () => {
		it('does not crash or fire onChange when first digit typed is 0', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange }
			});

			const input = inputIn(screen.container);
			// Typing a leading "0" (e.g. starting "01" for January) must be treated
			// as incomplete input, not coerced into an (invalid) date that crashes.
			expect(() => changeValue(input, '0')).not.toThrow();

			expect(onChange).not.toHaveBeenCalled();
			// Restated: `not.toThrow()` only covers the synchronous handler here —
			// Svelte's re-render is flushed a microtask later, so the awaited value
			// assertion is what proves the render survived too.
			await expect.element(screen.getByRole('combobox')).toHaveValue('0');
		});

		it('does not crash or fire onChange when first digit typed is 1', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange }
			});

			const input = inputIn(screen.container);
			expect(() => changeValue(input, '1')).not.toThrow();

			expect(onChange).not.toHaveBeenCalled();
			await expect.element(screen.getByRole('combobox')).toHaveValue('1');
		});

		it('does not crash while progressively typing a numeric date', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange }
			});

			const input = inputIn(screen.container);
			// Simulate keystroke-by-keystroke entry of "01/15/2026". The leading
			// single-digit keystrokes must not crash (the original bug). `await tick()`
			// between keystrokes is React's synchronous flush per `fireEvent`: without
			// it all six would coalesce into one render and the intermediate states
			// would never exist.
			for (const partial of ['0', '01', '01/', '01/1', '01/15', '01/15/']) {
				expect(() => changeValue(input, partial)).not.toThrow();
				await flush();
			}

			// Completing the date commits it without error.
			expect(() => changeValue(input, '01/15/2026')).not.toThrow();
			await flush();
			expect(onChange).toHaveBeenCalledWith('2026-01-15');
		});

		it('does not crash on blur after typing an incomplete value', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange }
			});

			const input = inputIn(screen.container);
			changeValue(input, '0');
			await flush();
			expect(() => blur(input)).not.toThrow();
			expect(onChange).not.toHaveBeenCalled();
			// As above: the awaited assertion is what proves the post-blur render
			// landed. The pending buffer is dropped, so the empty value comes back.
			await expect.element(screen.getByRole('combobox')).toHaveValue('');
		});
	});

	describe('external value changes', () => {
		it('clears pending input when value changes externally', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-15'), onChange }
			});

			const input = screen.getByRole('combobox');
			await expect.element(input).toHaveValue('January 15, 2026');

			// User starts typing — sets pending input
			changeValue(inputIn(screen.container), 'Feb');
			await expect.element(input).toHaveValue('Feb');

			// Value changes externally (e.g. parent resets the date)
			await screen.rerender({ label: 'Date', value: iso('2026-03-20'), onChange });

			// Pending input should be cleared, showing the new formatted value
			await expect.element(input).toHaveValue('March 20, 2026');
		});
	});

	describe('InputGroup', () => {
		it('uses group ARIA and skips standalone Field chrome when grouped', async () => {
			const screen = await render(DateInputGroupProbe, {
				props: {
					group: {
						label: 'Availability',
						description: 'Choose a start date',
						status: { type: 'error', message: 'Date is required' }
					},
					dateInput: { label: 'Date', isLabelHidden: true, onChange: noop }
				}
			});

			const groupLoc = screen.getByRole('group', { name: 'Availability', exact: true });
			await expect.element(groupLoc).toBeInTheDocument();
			const group = groupLoc.element();
			const input = screen
				.getByRole('combobox', { name: 'Availability Date', exact: true })
				.element();

			// Restated only in scope, as above.
			expect(screen.container.querySelectorAll('.astryx-field')).toHaveLength(1);
			expect(input).toHaveAttribute('aria-labelledby');
			expect(input.getAttribute('aria-labelledby')).toContain(
				group.getAttribute('aria-labelledby')
			);
			expect(input).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby')!);
			expect(input).not.toHaveAttribute('aria-invalid');
			await expect
				.element(screen.getByText('Date is required', { exact: true }))
				.toBeInTheDocument();
		});

		it('preserves disabledMessage tooltip wiring when grouped', async () => {
			const screen = await render(DateInputGroupProbe, {
				props: {
					group: { label: 'Availability' },
					dateInput: {
						label: 'Date',
						isLabelHidden: true,
						isDisabled: true,
						disabledMessage: 'Scheduling is locked',
						onChange: noop
					}
				}
			});

			const inputLoc = screen.getByRole('combobox', { name: 'Availability Date', exact: true });
			await expect.element(inputLoc).toBeInTheDocument();
			const input = inputLoc.element();
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();

			// Restated: upstream's `not.toBeDisabled()` is jest-dom's, which reads the
			// *native* disabled state only. vitest-browser's matcher of that name is
			// Playwright's ARIA computation, which counts `aria-disabled="true"` as
			// disabled — so it would answer "true" on the very attribute the next line
			// requires. Upstream's question is asked directly instead.
			expect(input).not.toHaveAttribute('disabled');
			expect((input as HTMLInputElement).disabled).toBe(false);
			expect(input).toHaveAttribute('aria-disabled', 'true');
			expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
			expect(tooltip).toHaveTextContent('Scheduling is locked');
			await expect
				.element(screen.getByRole('button', { name: 'Open calendar', exact: true }))
				.toBeDisabled();
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', isDisabled: true, disabledMessage: 'You need the Editor role' }
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
			const screen = await render(DateInput, {
				props: { label: 'Date', isDisabled: true, disabledMessage: 'You need the Editor role' }
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('combobox')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', disabledMessage: 'You need the Editor role' }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', isDisabled: true, disabledMessage: 'You need the Editor role' }
			});
			const input = screen.getByRole('combobox');
			// Restated for the reason given on the grouped case above: Playwright's
			// `toBeDisabled` counts `aria-disabled="true"`, so the absence of the
			// *native* disabled attribute — which is what keeps the control in the
			// tab order — is asserted directly.
			await expect.element(input).not.toHaveAttribute('disabled');
			expect(inputIn(screen.container).disabled).toBe(false);
			await expect.element(input).toHaveAttribute('aria-disabled', 'true');
			await expect.element(input).toHaveAttribute('readonly');
		});

		it('links the reason tooltip from the input via aria-describedby', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', isDisabled: true, disabledMessage: 'You need the Editor role' }
			});
			const input = inputIn(screen.container);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks value changes and opening while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(DateInput, {
				props: {
					label: 'Date',
					onChange,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const input = inputIn(screen.container);
			// Restated: upstream clicks and types with `user`. Playwright's
			// actionability check reads `aria-disabled="true"` as "not enabled" and
			// refuses both, which would assert its heuristic instead of the guard.
			// The control *is* focusable — that is the case's premise — so the click
			// is dispatched and the keys are real.
			input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			input.focus();
			expect(document.activeElement).toBe(input);
			await userEvent.keyboard('2026-03-15');

			await expect.element(screen.getByRole('combobox')).toHaveValue('');
			await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', isDisabled: true }
			});
			const input = screen.getByRole('combobox');
			await expect.element(input).toBeDisabled();
			await expect.element(input).not.toHaveAttribute('aria-disabled');
		});
	});

	describe('format', () => {
		it('defaults to the long-month date_long shape', async () => {
			// Non-breaking default: byte-identical to the historical hardcoded
			// DATE_FORMAT_LONG rendering. `format` now defaults to 'date_long'.
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('January 25, 2026');
		});

		it('renders the long-month shape for explicit format="date_long"', async () => {
			// Explicit date_long is identical to the unset default above and to the
			// old hardcoded long-month output — real named parity with Timestamp.
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-25'), onChange: noop, format: 'date_long' }
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('January 25, 2026');
		});

		it('renders the short-month shape for format="date"', async () => {
			// Same literal + same shape as `<Timestamp format="date" />`.
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-25'), onChange: noop, format: 'date' }
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('Jan 25, 2026');
		});

		it('renders the ISO shape for format="system_date"', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-25'), onChange: noop, format: 'system_date' }
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('2026-01-25');
		});

		it('renders a weekday prefix for format="date_weekday"', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-25'), onChange: noop, format: 'date_weekday' }
			});
			// 2026-01-25 is a Sunday; assert the weekday-prefixed shape without
			// over-fitting locale punctuation.
			await expect.element(screen.getByRole('combobox')).toHaveValue('Sun, Jan 25, 2026');
		});

		it('supports a custom function format', async () => {
			const screen = await render(DateInput, {
				props: {
					label: 'Date',
					value: iso('2026-01-25'),
					onChange: noop,
					format: (value: ISODateString) => `custom:${value}`
				}
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('custom:2026-01-25');
		});

		it('does not apply format to in-progress typed input', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange: noop, format: 'system_date' }
			});
			const input = inputIn(screen.container);
			input.focus();
			await userEvent.keyboard('January 25');
			// While typing, the raw text is shown verbatim — not reformatted.
			await expect.element(screen.getByRole('combobox')).toHaveValue('January 25');
		});

		it('recomputes the display in format on external value change', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', value: iso('2026-01-25'), onChange: noop, format: 'date' }
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('Jan 25, 2026');
			await screen.rerender({
				label: 'Date',
				value: iso('2026-03-10'),
				onChange: noop,
				format: 'date'
			});
			await expect.element(screen.getByRole('combobox')).toHaveValue('Mar 10, 2026');
		});
	});

	// New at v0.4.1: `weekStartsOn?: DayOfWeek | DayOfWeekName`, forwarded raw to
	// `<Calendar>` with no local default — `Calendar` owns both the `= 0` fallback
	// and the name→number normalisation, so these cases assert the forwarding
	// through the rendered header rather than the prop.
	describe('weekStartsOn', () => {
		// Upstream's comment: "The calendar popover renders in the top layer; jsdom
		// keeps the content in the DOM but role queries skip it, so read the
		// columnheaders directly." The reason survives here for a different cause —
		// `PopoverLayer` renders its children unconditionally into a real `popover`
		// element, which is `display: none` until shown, so a role query would skip
		// it too. `querySelectorAll` reaches it in both environments, and the
		// ArrowDown that opens the popover is kept exactly as upstream fires it.
		const openAndReadWeekdays = (container: HTMLElement): (string | null)[] => {
			keyDown(inputIn(container), { key: 'ArrowDown' });
			return Array.from(container.querySelectorAll('[role="columnheader"]'))
				.slice(0, 7)
				.map((h) => h.textContent);
		};

		it('defaults to a Sunday-first week', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange: noop }
			});
			expect(openAndReadWeekdays(screen.container)).toEqual([
				'Su',
				'Mo',
				'Tu',
				'We',
				'Th',
				'Fr',
				'Sa'
			]);
		});

		it('forwards a numeric weekStartsOn to the calendar', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange: noop, weekStartsOn: 1 }
			});
			expect(openAndReadWeekdays(screen.container)).toEqual([
				'Mo',
				'Tu',
				'We',
				'Th',
				'Fr',
				'Sa',
				'Su'
			]);
		});

		it('accepts a three-letter day name', async () => {
			const screen = await render(DateInput, {
				props: { label: 'Date', onChange: noop, weekStartsOn: 'mon' }
			});
			expect(openAndReadWeekdays(screen.container)).toEqual([
				'Mo',
				'Tu',
				'We',
				'Th',
				'Fr',
				'Sa',
				'Su'
			]);
		});
	});
});

/**
 * Two of upstream's four `DateInput clear icon theme target` cases — the two
 * v0.4.1 rewrote when the clear affordance moved to the shared
 * `InputClearButton`. The other two are unchanged pre-v0.3.0 work and are named,
 * with their reason, in the file header.
 */
describe('DateInput clear icon theme target', () => {
	// Resolve the clear glyph span (the astryx-icon element inside the clear
	// button), independent of the theme target class. Scoped to the render
	// container rather than upstream's global `screen`, because the second case
	// mounts a reference `Icon` into the same document.
	const getClearIcon = (container: HTMLElement): HTMLElement => {
		const button = container.querySelector('[aria-label="Clear Date"]');
		const icon = button?.querySelector('.astryx-icon');
		if (icon == null) {
			throw new Error('clear icon not found');
		}
		return icon as HTMLElement;
	};

	it('renders the astryx-input-clear-icon target (plus the legacy alias) on the clear glyph', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-15'), onChange: noop, hasClear: true }
		});
		// The canonical target lands on the icon element itself (not the button),
		// so a theme can restyle just this glyph (color, size, hover) via
		// `defineTheme` — a button-level target could not reach the icon's own
		// color/size. The original per-component name rides along for a
		// deprecation window.
		const icon = getClearIcon(screen.container);
		expect(icon).toHaveClass('astryx-input-clear-icon');
		expect(icon).toHaveClass('astryx-date-input-clear-icon');
		expect(icon).toHaveClass('astryx-icon');
	});

	it('routes the clear glyph through the shared clear button, keeping the legacy target', async () => {
		// The clear affordance now composes the shared InputClearButton (a ghost
		// Button with a secondary/sm glyph), so the icon carries the canonical
		// `astryx-input-clear-icon` target and — for a deprecation window — the
		// original `astryx-date-input-clear-icon`. Aside from those target classes
		// it matches the shared button's own `close`/`sm`/`secondary` glyph
		// exactly, so the default look is defined in one place.
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-15'), onChange: noop, hasClear: true }
		});
		const icon = getClearIcon(screen.container);
		expect(icon).toHaveClass('astryx-input-clear-icon');
		expect(icon).toHaveClass('astryx-date-input-clear-icon');

		const refScreen = await render(Icon, {
			props: { icon: 'close', size: 'sm', color: 'secondary' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => c !== 'astryx-input-clear-icon' && c !== 'astryx-date-input-clear-icon')
				.sort();

		expect(styleClasses(icon)).toEqual(styleClasses(refIcon));
	});
});

// New at v0.4.1: `themeProps('date-input', …)` gained
// `disabled: isDisabled ? 'disabled' : null`, so the root reflects the state as
// both a data attribute and a bare class token.
describe('DateInput disabled theme state', () => {
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-date-input');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(DateInput, {
			props: { label: 'Date', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-date-input');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});
