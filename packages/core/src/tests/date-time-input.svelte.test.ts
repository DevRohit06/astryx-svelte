import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import DateTimeInput from '$lib/components/date-time-input/date-time-input.svelte';
import type { ISODateTimeString } from '$lib/components/date-time-input/date-time-input.svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import DateTimeInputI18n from './fixtures/date-time-input-i18n.svelte';

/**
 * Astryx's `DateTimeInput/DateTimeInput.test.tsx`, ported case for case — **all
 * 83 of upstream's 83** at v0.4.1 (45 directly in `describe('DateTimeInput')`,
 * 5 in `describe('hasClear')`, 1 in `describe('external value changes')`, 7 in
 * `describe('invalid typed input feedback (WCAG 3.3.1)')`, 9 in
 * `describe('disabledMessage')`, 4 in `describe('timeIncrement')`, 3 in
 * `describe('weekStartsOn')`, 7 in `describe('segment theme targets')` and 2 in
 * the top-level `describe('DateTimeInput disabled theme state')`). The file has
 * no `displayName` case, no snapshot and no no-JSX construction form, so the
 * only React-only surface is `ref`, which gets a counterpart.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "64 upstream cases … 64 here, **none dropped**".
 * Upstream had **75** at v0.3.0; the eleven that were absent — the four
 * forms-13 keyboard-open cases and the whole seven-case `segment theme targets`
 * describe — are now here. The segment block's last case swaps upstream's
 * `generateThemeTestCSS` for this port's `generateThemeCss`, the substitution
 * `multi-selector` and `selector` already made; everything else in the eleven is
 * upstream's assertion unchanged, with `getByLabelText(…)` resolved through the
 * file's existing `dateInputIn`/`timeInputIn` element helpers.
 *
 * ## v0.4.1 (#4876, #4900)
 *
 * Upstream added eight, all here:
 *
 * - `resolves the invalid date and time announcements from the i18n catalog`,
 *   in `invalid typed input feedback (WCAG 3.3.1)`. Upstream wraps the
 *   component in `<InternationalizationProvider>` inline; a provider's
 *   `children` is a snippet here, so it goes through
 *   `fixtures/date-time-input-i18n.svelte` — the `field-label-i18n.svelte`
 *   precedent. Same provider, same overrides, same assertions.
 * - the two ArrowUp/ArrowDown polite-announcement cases, in `timeIncrement`.
 *   They need upstream's new `afterEach(__resetLiveRegionsForTest)`, folded into
 *   this file's existing `afterEach`, and its `politeRegion()` helper verbatim.
 * - `describe('weekStartsOn')` (3), between `timeIncrement` and `segment theme
 *   targets` where upstream puts it.
 * - `describe('DateTimeInput disabled theme state')` (2), for the root's new
 *   `data-disabled`/`disabled` reflection.
 *
 * Upstream's `openAndReadWeekdays` carries a comment about jsdom role queries
 * skipping the top layer. That constraint does not exist here — Chromium's
 * popover content is queryable — but the helper still reads the columnheaders
 * off the container directly, which is upstream's assertion unchanged.
 *
 * Nothing here covers the `onHide`/`isFocusDetached` focus-return change that
 * shipped alongside: upstream added no case for it, and inventing one would be
 * coverage beyond upstream.
 *
 * Upstream's `disabledMessage` `beforeEach` (`:593-600`) shims
 * `showPopover`/`hidePopover` because jsdom implements neither, and its
 * `h = {hidden: true}` exists because a jsdom popover is not "visible" to the
 * accessibility tree. The browser project needs neither: Chromium has the real
 * Popover API, so the open state is read with `matches(':popover-open')` and
 * `{hidden: true}` survives as `getByRole('tooltip', {includeHidden: true})`,
 * since a *closed* popover really is `display:none` here. Same arrangement as
 * `time-input.svelte.test.ts` and `number-input.svelte.test.ts` for the same
 * nine-case block. Upstream's top-level `links the disabled reason to the time
 * input…` (`:328`) additionally patches `HTMLElement.prototype` *globally* and
 * never restores it; nothing here needs that either.
 *
 * `changeAction` never appears in the upstream file, so nothing exercises
 * `createOptimistic`.
 *
 * **The wall clock.** Two cases reach `getDefaultTime()` — the `new Date()` that
 * seeds the time half when a date is chosen and none was set: `calls onChange
 * when valid date is typed` and `does not set aria-invalid on the date input
 * when typed date is valid`. The first is pinned with a `Date`-only fake so the
 * emitted string is deterministic rather than merely prefix-matched; the second
 * asserts on `aria-invalid` and never observes the seeded time, so it is left
 * alone. Only `Date` is faked, never `queueMicrotask`, which is what Svelte
 * schedules on.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref to date input` (`:129`)** — Svelte has no `ref` prop.
 *   `DateTimeInputProps` extends `BaseProps<HTMLDivElement>` and `...rest`
 *   spreads onto the outer row `<div>` (`date-time-input.svelte:694`), so the
 *   seam a consumer actually uses is an attachment through the rest props, and
 *   it lands on the row rather than upstream's date input. It checks more than
 *   upstream's does: it receives the element instead of only proving a callback
 *   ran.
 *
 * Restated, each noted at the case:
 * - every `getByDisplayValue(...)` — vitest-browser has no such locator, so the
 *   input is located and its value asserted with `toHaveValue`, which is the
 *   same question (`getByDisplayValue` matches on `element.value`).
 * - every `fireEvent.change(input, {target: {value}})` — vitest-browser has no
 *   `fireEvent`, and the point of each is a whole value arriving at once rather
 *   than keystroke by keystroke, so the same native `input` event is dispatched
 *   directly (React's `onChange` on an input *is* that event, and it is what
 *   this port binds).
 * - `handles Escape keydown on date input without error` — upstream's body has
 *   no assertion at all, which `expect.requireAssertions` rejects. Restated to
 *   assert what the title claims.
 * - `keeps both inputs focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, not
 *   jest-dom's native-attribute one, and they disagree by design on exactly the
 *   `aria-disabled` this case requires.
 * - `blocks value changes and opening while focusable-disabled` — Playwright
 *   refuses to click or type into an `aria-disabled` element at all, which would
 *   assert its actionability heuristic rather than the component's guard.
 * - the tooltip hover case — upstream's `fireEvent.mouseEnter`/`mouseLeave`
 *   target the row, which a real pointer at the row's centre cannot do (an input
 *   is there), so the events are dispatched where upstream dispatches them.
 * - every text/label/placeholder locator carries `{exact: true}`. Playwright's
 *   engines are substring and case-insensitive by default where RTL's are exact,
 *   and this component deliberately derives `"{label} time"` from `label` — so
 *   `getByLabelText('Time')` would match `"Meeting time"` and upstream's
 *   `queryByLabelText('Time')` case would invert.
 *
 * Two environment stubs upstream has no need for, both in the same category as
 * its own `showPopover` shim — the browser reports the *real* machine where
 * jsdom reports Node's defaults:
 *
 * 1. **`Intl.DateTimeFormat`'s default locale is pinned to `en-US`.** Both this
 *    port and upstream format with `new Intl.DateTimeFormat(undefined, …)`
 *    (`plain-date.ts:230`, upstream `utils/plainDate.ts:258`), so the rendered
 *    date follows whatever locale the runtime reports. Upstream's Node/jsdom
 *    says `en-US` and its assertions are written as `"March 15, 2026"`;
 *    headless Chromium inherits the host OS locale and renders
 *    `"15 March 2026"` here. Pinning the default reproduces upstream's
 *    environment and keeps its literals verbatim. It also pins
 *    `isLocaleDayFirst()` (`date-parser.ts:13`), which reads the same default.
 * 2. **A `tick()` after every synthetic `input`/`keydown`.** RTL's `fireEvent`
 *    flushes React before it returns; a raw `dispatchEvent` does not flush
 *    Svelte, so two events fired back to back land in one batch. `reverts date
 *    input on blur when input is invalid` is the case that needs it: the
 *    display value leaves and returns to the same string within one batch, so
 *    Svelte's `set_value` sees no change and never repairs the DOM value the
 *    test wrote by hand. Real typing flushes between keystrokes, which is why
 *    this is a test artifact and not a port defect.
 */

const noop = (): void => {};

const iso = (value: string): ISODateTimeString => value as ISODateTimeString;

/** Playwright's locators are substring/case-insensitive; RTL's are exact. */
const exact = { exact: true } as const;

/** Upstream's `screen.getByRole('combobox')` as a raw element. */
function dateInputIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="combobox"]');
	if (!(el instanceof HTMLInputElement)) {
		throw new Error('expected the date input');
	}
	return el;
}

/** Upstream's `screen.getByLabelText('… time')` as a raw element. */
function timeInputIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[aria-label]');
	if (!(el instanceof HTMLInputElement)) {
		throw new Error('expected the time input');
	}
	return el;
}

/** Upstream's `dateInput.parentElement?.parentElement` — the outer row. */
function rowOf(dateInput: HTMLInputElement): HTMLElement {
	const el = dateInput.parentElement?.parentElement;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected the row element');
	}
	return el;
}

/**
 * Upstream's `fireEvent.change(input, {target: {value}})`. React's `onChange` on
 * an input *is* the native `input` event, which is what this port binds, so the
 * assignment plus a bubbling `input` event is the same event upstream fires —
 * and the `tick()` is `fireEvent`'s own flush, without which two events fired
 * back to back share a batch. See the file header.
 */
async function changeValue(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await tick();
}

/** Upstream's `fireEvent.keyDown(el, {key, …})`, flushed the same way. */
async function keyDown(el: HTMLElement, key: string, init: KeyboardEventInit = {}): Promise<void> {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
	await tick();
}

/** Upstream's `politeRegion()` — the singleton polite live region on `body`. */
function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

/** Collects the text of every element an `aria-describedby` points at. */
function describedText(el: HTMLElement): string {
	return (el.getAttribute('aria-describedby') ?? '')
		.split(' ')
		.filter(Boolean)
		.map((id) => document.getElementById(id)?.textContent ?? '')
		.join(' ');
}

// See the file header: upstream's assertions are written for Node's `en-US`
// default, which headless Chromium does not share.
const RealDateTimeFormat = Intl.DateTimeFormat;

beforeAll(() => {
	const Pinned = function (
		locales?: Intl.LocalesArgument,
		options?: Intl.DateTimeFormatOptions
	): Intl.DateTimeFormat {
		return new RealDateTimeFormat(locales ?? 'en-US', options);
	} as unknown as typeof Intl.DateTimeFormat;
	Pinned.supportedLocalesOf = RealDateTimeFormat.supportedLocalesOf;
	Object.defineProperty(Intl, 'DateTimeFormat', {
		value: Pinned,
		configurable: true,
		writable: true
	});
});

afterAll(() => {
	Object.defineProperty(Intl, 'DateTimeFormat', {
		value: RealDateTimeFormat,
		configurable: true,
		writable: true
	});
});

afterEach(() => {
	vi.useRealTimers();
	// Upstream's own `afterEach` — the arrow-key announcements go through the
	// module-level singleton live regions, so each case has to start clean.
	__resetLiveRegionsForTest();
});

describe('DateTimeInput', () => {
	it('renders with label', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting time', onChange: noop }
		});
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeInTheDocument();
	});

	it('derives the time input label from the field label (forms-15)', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting time', onChange: noop }
		});
		// Not a hardcoded "Time" — tied to the field label so it is localizable
		// and unambiguous when multiple date-time fields share a page.
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeInTheDocument();
		expect(screen.getByLabelText('Time', exact).query()).toBeNull();
	});

	it('uses an explicit timeLabel when provided', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting time', timeLabel: 'Start time', onChange: noop }
		});
		await expect.element(screen.getByLabelText('Start time', exact)).toBeInTheDocument();
	});

	it('renders with placeholder', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Time', onChange: noop, placeholder: 'Pick a date' }
		});
		await expect.element(screen.getByPlaceholder('Pick a date', exact)).toBeInTheDocument();
	});

	it('defaults the time portion placeholder to "Select a time"', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByPlaceholder('Select a time', exact)).toBeInTheDocument();
	});

	it('applies a custom timePlaceholder to the time portion', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				onChange: noop,
				placeholder: 'Pick a date',
				timePlaceholder: 'Pick a time'
			}
		});
		// Time portion uses the override; date portion keeps its own placeholder.
		await expect.element(screen.getByPlaceholder('Pick a time', exact)).toBeInTheDocument();
		await expect.element(screen.getByPlaceholder('Pick a date', exact)).toBeInTheDocument();
		expect(screen.getByPlaceholder('Select a time', exact).query()).toBeNull();
	});

	it('renders both date and time inputs', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeInTheDocument();
	});

	// Restated: no `getByDisplayValue` locator exists here; `toHaveValue` on the
	// located input asks the same question of the same property. Same for the
	// three cases that follow.
	it('displays formatted date in date input when value is provided', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveValue('March 15, 2026');
	});

	it('displays formatted time in time input when value is provided (12h)', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange: noop }
		});
		await expect.element(screen.getByLabelText('Meeting time', exact)).toHaveValue('2:30 PM');
	});

	it('displays formatted time in 24h format', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30'),
				onChange: noop,
				hourFormat: '24h'
			}
		});
		await expect.element(screen.getByLabelText('Meeting time', exact)).toHaveValue('14:30');
	});

	it('displays time with seconds', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Timestamp',
				value: iso('2026-03-15T14:30:45'),
				onChange: noop,
				hasSeconds: true
			}
		});
		await expect.element(screen.getByLabelText('Timestamp time', exact)).toHaveValue('2:30:45 PM');
	});

	// Counterpart to upstream's `forwards ref to date input` (`:129`); see the
	// file header. Upstream asserts `expect.any(HTMLInputElement)` on the date
	// input; this port's rest props land on the outer row `<div>`, so that is the
	// element the attachment receives — and it receives the element itself, so
	// the assertion is the stronger `toBe`.
	it('hands the row element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop, [createAttachmentKey()]: attached }
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(rowOf(dateInputIn(screen.container)));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isLabelHidden: true, onChange: noop }
		});
		const label = screen.getByText('Meeting', exact);
		await expect.element(label).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Meeting', exact)).toBeInTheDocument();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isRequired: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
	});

	it('does not set aria-required when isRequired is false', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-required');
	});

	it('sets disabled on both inputs when isDisabled is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isDisabled: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeDisabled();
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeDisabled();
	});

	it('is not disabled by default', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).not.toBeDisabled();
		await expect.element(screen.getByLabelText('Meeting time', exact)).not.toBeDisabled();
	});

	it('date input has role="combobox"', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('date input has aria-haspopup="dialog"', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'dialog');
	});

	it('date input has aria-expanded=false by default', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
	});

	it('opens the calendar popover on ArrowDown (keyboard, forms-13)', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		const input = dateInputIn(screen.container);
		input.focus();
		expect(input).toHaveAttribute('aria-expanded', 'false');
		await keyDown(input, 'ArrowDown');
		expect(input).toHaveAttribute('aria-expanded', 'true');
		// skipAutoFocus keeps focus in the input, per the APG date-picker pattern
		expect(input).toHaveFocus();
	});

	it('opens the calendar popover on Alt+ArrowDown (keyboard, forms-13)', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		const input = dateInputIn(screen.container);
		await keyDown(input, 'ArrowDown', { altKey: true });
		expect(input).toHaveAttribute('aria-expanded', 'true');
	});

	it('does not open on ArrowDown when disabled', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isDisabled: true, onChange: noop }
		});
		const input = dateInputIn(screen.container);
		await keyDown(input, 'ArrowDown');
		expect(input).toHaveAttribute('aria-expanded', 'false');
	});

	it('does not re-trigger on ArrowDown when the calendar is already open', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		const input = dateInputIn(screen.container);
		await keyDown(input, 'ArrowDown');
		expect(input).toHaveAttribute('aria-expanded', 'true');
		// A second ArrowDown is a no-op: the calendar stays open
		await keyDown(input, 'ArrowDown');
		expect(input).toHaveAttribute('aria-expanded', 'true');
	});

	it('calendar button is focusable and clickable', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		const button = screen.getByRole('button', { name: 'Open calendar' });
		await expect.element(button).toBeInTheDocument();
		await expect.element(button).not.toBeDisabled();
	});

	it('calendar button is disabled when isDisabled is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isDisabled: true, onChange: noop }
		});
		await expect.element(screen.getByRole('button', { name: 'Open calendar' })).toBeDisabled();
	});

	it('disables inputs and button when isLoading is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isLoading: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toBeDisabled();
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Open calendar' })).toBeDisabled();
	});

	it('sets aria-busy when isLoading is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isLoading: true, onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
	});

	it('does not set aria-busy when not loading', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-busy');
	});

	it('sets aria-busy on the time input when isLoading is true', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', isLoading: true, onChange: noop }
		});
		await expect
			.element(screen.getByLabelText('Meeting time', exact))
			.toHaveAttribute('aria-busy', 'true');
	});

	it('does not set aria-busy on the time input when not loading', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await expect
			.element(screen.getByLabelText('Meeting time', exact))
			.not.toHaveAttribute('aria-busy');
	});

	it('renders status icon for error status', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				onChange: noop,
				status: { type: 'error', message: 'Invalid datetime' }
			}
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
	});

	it('does not set aria-invalid for warning status', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				onChange: noop,
				status: { type: 'warning', message: 'Watch out' }
			}
		});
		await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
	});

	it('renders description and links via aria-describedby', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', description: 'Pick the meeting datetime', onChange: noop }
		});
		await expect.element(screen.getByText('Pick the meeting datetime', exact)).toBeInTheDocument();
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-describedby');
	});

	it('links status message via aria-describedby', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				onChange: noop,
				status: { type: 'error', message: 'Invalid datetime' }
			}
		});
		expect(describedText(dateInputIn(screen.container))).toContain('Invalid datetime');
	});

	it('links the description to the time input via aria-describedby', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', description: 'Pick the meeting datetime', onChange: noop }
		});
		// The description covers both halves of the field, so the time input must
		// carry it too — a screen-reader user tabbing into the time half should
		// not lose the field's description.
		expect(describedText(timeInputIn(screen.container))).toContain('Pick the meeting datetime');
	});

	it('links the status message to the time input via aria-describedby', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				onChange: noop,
				status: { type: 'error', message: 'Invalid datetime' }
			}
		});
		expect(describedText(timeInputIn(screen.container))).toContain('Invalid datetime');
	});

	it('links the disabled reason to the time input via aria-describedby', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'When',
				onChange: noop,
				isDisabled: true,
				disabledMessage: 'You need the Editor role'
			}
		});
		const timeInput = timeInputIn(screen.container);
		const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
		expect(timeInput.getAttribute('aria-describedby')).toContain(tooltip.id);
	});

	// Restated: upstream's body is a lone `fireEvent.keyDown` with no assertion,
	// which `expect.requireAssertions` rejects — and which would be vacuous even
	// without that, since a listener that throws during `dispatchEvent` surfaces
	// as an uncaught error rather than a failed expectation. The title's claim is
	// asserted instead: with the popover shut, Escape leaves the field untouched.
	it('handles Escape keydown on date input without error', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		await keyDown(dateInputIn(screen.container), 'Escape');

		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByRole('combobox')).toHaveValue('');
	});

	// --- Date text input behavior ---

	it('calls onChange when valid date is typed', async () => {
		// The time half is seeded from `getDefaultTime()`'s `new Date()`, so the
		// clock is pinned — `Date` only, never `queueMicrotask`. Upstream's
		// assertion is kept verbatim; the pin makes the untested half stable too.
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2026, 5, 1, 9, 5, 30));

		const onChange = vi.fn();
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange }
		});

		await changeValue(dateInputIn(screen.container), '03/15/2026');

		expect(onChange).toHaveBeenCalled();
		const calledValue = onChange.mock.calls[0][0] as string;
		expect(calledValue).toMatch(/^2026-03-15T/);
		expect(calledValue).toBe('2026-03-15T09:05');
	});

	it('does not call onChange while typing invalid date', async () => {
		const onChange = vi.fn();
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange }
		});

		await changeValue(dateInputIn(screen.container), 'invalid');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('reverts date input on blur when input is invalid', async () => {
		const onChange = vi.fn();
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-01-25T10:00'), onChange }
		});

		const input = dateInputIn(screen.container);
		await changeValue(input, 'not a date');
		input.dispatchEvent(new FocusEvent('blur'));

		await expect.element(screen.getByRole('combobox')).toHaveValue('January 25, 2026');
		expect(onChange).not.toHaveBeenCalled();
	});

	// --- Time input behavior ---

	it('does not call onChange for time when no date is set', async () => {
		const onChange = vi.fn();
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange }
		});

		await changeValue(timeInputIn(screen.container), '3:45 pm');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('calls onChange for time when date is already set', async () => {
		const onChange = vi.fn();
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange }
		});

		await changeValue(timeInputIn(screen.container), '3:45 pm');

		expect(onChange).toHaveBeenCalledWith('2026-03-15T15:45');
	});

	it('renders with size="lg"', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting time', onChange: noop, size: 'lg' }
		});
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeInTheDocument();
	});

	describe('hasClear', () => {
		it('shows clear button when hasClear is true and value exists', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'Meeting',
					value: iso('2026-03-15T14:30'),
					onChange: noop,
					hasClear: true
				}
			});
			await expect
				.element(screen.getByRole('button', { name: 'Clear Meeting' }))
				.toBeInTheDocument();
		});

		it('does not show clear button when value is undefined', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop, hasClear: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Meeting' }).query()).toBeNull();
		});

		it('does not show clear button when hasClear is false', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange: noop }
			});
			expect(screen.getByRole('button', { name: 'Clear Meeting' }).query()).toBeNull();
		});

		it('does not show clear button when disabled', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'Meeting',
					value: iso('2026-03-15T14:30'),
					onChange: noop,
					hasClear: true,
					isDisabled: true
				}
			});
			expect(screen.getByRole('button', { name: 'Clear Meeting' }).query()).toBeNull();
		});

		it('calls onChange with undefined when clear is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(DateTimeInput, {
				props: {
					label: 'Meeting',
					value: iso('2026-03-15T14:30'),
					onChange,
					hasClear: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear Meeting' }));
			expect(onChange).toHaveBeenCalledWith(undefined);
		});
	});

	describe('external value changes', () => {
		it('clears pending date input when value changes externally', async () => {
			const onChange = vi.fn();
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-01-15T10:00'), onChange }
			});

			const dateInput = dateInputIn(screen.container);
			expect(dateInput).toHaveValue('January 15, 2026');

			// User starts typing a new date
			await changeValue(dateInput, 'Feb');
			expect(dateInput).toHaveValue('Feb');

			// Value changes externally
			await screen.rerender({
				label: 'Meeting',
				value: iso('2026-03-20T10:00'),
				onChange
			});

			// Pending input should be cleared, showing the new formatted date
			await expect.element(screen.getByRole('combobox')).toHaveValue('March 20, 2026');
		});
	});

	describe('invalid typed input feedback (WCAG 3.3.1)', () => {
		it('sets aria-invalid="true" on the date input when typed date is unparseable', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});

			await changeValue(dateInputIn(screen.container), '13/45/2024');

			await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
		});

		it('does not set aria-invalid on the date input when typed date is valid', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});

			await changeValue(dateInputIn(screen.container), '03/15/2026');

			await expect.element(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
		});

		it('announces an alert message when the typed date is invalid', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});

			await changeValue(dateInputIn(screen.container), '13/45/2024');

			await expect.element(screen.getByText('Invalid date', exact)).toBeInTheDocument();
		});

		it('sets aria-invalid="true" on the time input when typed time is unparseable', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange: noop }
			});

			await changeValue(timeInputIn(screen.container), '99:99 zz');

			await expect
				.element(screen.getByLabelText('Meeting time', exact))
				.toHaveAttribute('aria-invalid', 'true');
		});

		it('does not set aria-invalid on the time input when typed time is valid', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange: noop }
			});

			await changeValue(timeInputIn(screen.container), '3:45 pm');

			await expect
				.element(screen.getByLabelText('Meeting time', exact))
				.not.toHaveAttribute('aria-invalid');
		});

		it('announces an alert message when the typed time is invalid', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange: noop }
			});

			await changeValue(timeInputIn(screen.container), '99:99 zz');

			await expect.element(screen.getByText('Invalid time', exact)).toBeInTheDocument();
		});

		// Upstream wraps the component in `<InternationalizationProvider>` inline;
		// a provider's `children` is a snippet here, so the wrapper is the
		// `date-time-input-i18n.svelte` fixture. Same provider, same overrides.
		it('resolves the invalid date and time announcements from the i18n catalog', async () => {
			const screen = await render(DateTimeInputI18n, {
				props: {
					locale: 'en',
					overrides: {
						en: {
							'@astryx.dateInput.invalidDate': 'Ungültiges Datum',
							'@astryx.timeInput.invalidTime': 'Ungültige Zeit'
						}
					},
					label: 'Meeting',
					value: iso('2026-03-15T10:00'),
					onChange: noop
				}
			});

			await changeValue(dateInputIn(screen.container), '13/45/2024');
			await expect.element(screen.getByText('Ungültiges Datum', exact)).toBeInTheDocument();

			await changeValue(timeInputIn(screen.container), '99:99 zz');
			await expect.element(screen.getByText('Ungültige Zeit', exact)).toBeInTheDocument();
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'When',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			// The tooltip anchors on the outer row that wraps both inputs.
			const row = rowOf(dateInputIn(screen.container));
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip).toHaveTextContent('You need the Editor role');

			// Upstream's `fireEvent.mouseEnter`/`mouseLeave`, dispatched the same way:
			// a real pointer moved to the row's centre would be over an input, and
			// `unhover` parks it at the viewport origin — both would assert where
			// Playwright puts the mouse rather than what the row listens for.
			row.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's `popover-open` attribute,
				// which its jsdom shim invents; Chromium has the real thing.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});

			row.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'When',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('combobox')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'When', onChange: noop, disabledMessage: 'You need the Editor role' }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'When', onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps both inputs focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'When',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const dateInput = dateInputIn(screen.container);
			const timeInput = timeInputIn(screen.container);
			// Restated: upstream's `not.toBeDisabled()` is jest-dom's, which reads the
			// *native* disabled state only. vitest-browser's matcher of that name is
			// Playwright's ARIA computation, which counts `aria-disabled="true"` as
			// disabled — so it answers "true" on the very attribute the next line
			// requires. Upstream's question is asked directly instead: no native
			// `disabled`, which is what keeps the controls in the tab order.
			expect(dateInput.disabled).toBe(false);
			expect(dateInput).toHaveAttribute('aria-disabled', 'true');
			expect(dateInput).toHaveAttribute('readonly');
			expect(timeInput.disabled).toBe(false);
			expect(timeInput).toHaveAttribute('aria-disabled', 'true');
			expect(timeInput).toHaveAttribute('readonly');
		});

		it('links the reason tooltip from the date input via aria-describedby', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'When',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const dateInput = dateInputIn(screen.container);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(dateInput.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks value changes and opening while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(DateTimeInput, {
				props: {
					label: 'When',
					onChange,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const dateInput = dateInputIn(screen.container);
			// Restated: upstream uses `user.click` then `user.type`. Playwright's
			// actionability check reads `aria-disabled="true"` as "not enabled" and
			// refuses to do either, which would assert its heuristic instead of the
			// component's guards. The click is dispatched where upstream's lands (the
			// input's own `onclick`, which is what opens the popover), and the control
			// *is* focusable — that is the case's premise — so it is focused directly
			// and typed into with real keys.
			dateInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			dateInput.focus();
			expect(document.activeElement).toBe(dateInput);
			await userEvent.keyboard('2026-03-15');

			expect(dateInput).toHaveValue('');
			expect(dateInput).toHaveAttribute('aria-expanded', 'false');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'When', onChange: noop, isDisabled: true }
			});
			const dateInput = screen.getByRole('combobox');
			await expect.element(dateInput).toBeDisabled();
			await expect.element(dateInput).not.toHaveAttribute('aria-disabled');
		});

		it('does not swap in the time format-hint placeholder on focus while disabled', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'When',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const timeInput = timeInputIn(screen.container);
			timeInput.focus();
			timeInput.dispatchEvent(new FocusEvent('focus'));
			await expect
				.element(screen.getByLabelText('When time', exact))
				.toHaveAttribute('placeholder', 'Select a time');
		});
	});

	describe('timeIncrement', () => {
		it('steps the time by timeIncrement minutes on ArrowUp', async () => {
			const onChange = vi.fn();
			const screen = await render(DateTimeInput, {
				props: {
					label: 'Meeting',
					value: iso('2026-03-15T14:30'),
					timeIncrement: 15,
					onChange
				}
			});

			await keyDown(timeInputIn(screen.container), 'ArrowUp');

			// 14:30 + 15min increment = 14:45
			expect(onChange).toHaveBeenCalledTimes(1);
			expect(onChange.mock.calls[0][0]).toContain('14:45');
		});

		it('defaults to a 1-minute increment', async () => {
			const onChange = vi.fn();
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange }
			});

			await keyDown(timeInputIn(screen.container), 'ArrowUp');

			// 14:30 + default 1min = 14:31
			expect(onChange).toHaveBeenCalledTimes(1);
			expect(onChange.mock.calls[0][0]).toContain('14:31');
		});

		// Arrow-key stepping mutates a plain textbox programmatically, and screen
		// readers do not announce programmatic textbox changes — the new value
		// must be announced through the polite live region (WCAG 4.1.2).
		it('politely announces the new time after ArrowUp stepping', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange: noop }
			});

			await keyDown(timeInputIn(screen.container), 'ArrowUp');

			// Upstream's `waitFor`; `announce` writes the text in a rAF callback, so
			// the retry is load-bearing here too.
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('2:31 PM');
			});
		});

		it('politely announces the new time after ArrowDown stepping', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange: noop }
			});

			await keyDown(timeInputIn(screen.container), 'ArrowDown');

			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('2:29 PM');
			});
		});
	});

	describe('weekStartsOn', () => {
		// Upstream's helper takes the container because jsdom's role queries skip
		// the top layer. Chromium's do not, but the columnheaders are still read
		// off the container directly — upstream's assertion unchanged. Upstream's
		// `fireEvent.keyDown(getAllByRole('combobox')[0], …)` is this file's
		// existing `keyDown(dateInputIn(container), …)`.
		const openAndReadWeekdays = async (container: HTMLElement): Promise<(string | null)[]> => {
			await keyDown(dateInputIn(container), 'ArrowDown');
			return Array.from(container.querySelectorAll('[role="columnheader"]'))
				.slice(0, 7)
				.map((h) => h.textContent);
		};

		it('defaults to a Sunday-first week', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'When', onChange: noop }
			});
			expect(await openAndReadWeekdays(screen.container)).toEqual([
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
			const screen = await render(DateTimeInput, {
				props: { label: 'When', onChange: noop, weekStartsOn: 1 }
			});
			expect(await openAndReadWeekdays(screen.container)).toEqual([
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
			const screen = await render(DateTimeInput, {
				props: { label: 'When', onChange: noop, weekStartsOn: 'mon' }
			});
			expect(await openAndReadWeekdays(screen.container)).toEqual([
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

	// ===========================================================================
	// Segment theme targets (#4075)
	// ===========================================================================

	describe('segment theme targets', () => {
		// The root only publishes `astryx-date-time-input`; the date and time
		// wrappers were anonymous nodes carrying hashed atomic classes only, so a
		// theme that restyles input geometry through the text-input/date-input/
		// time-input targets could not reach them and DateTimeInput rendered
		// shorter than every other input under that theme.

		it('renders the date segment target on the date wrapper', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});
			const dateInput = dateInputIn(screen.container);
			const wrapper = dateInput.closest('.astryx-date-time-input-date-segment');

			expect(wrapper).not.toBeNull();
			// The wrapper is the input's own container, not an ancestor further up.
			expect(wrapper).toBe(dateInput.parentElement);
		});

		it('renders the time segment target on the time wrapper', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});
			const timeInput = timeInputIn(screen.container);
			const wrapper = timeInput.closest('.astryx-date-time-input-time-segment');

			expect(wrapper).not.toBeNull();
			expect(wrapper).toBe(timeInput.parentElement);
		});

		it('reflects size on both segments so themes can restyle geometry', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', size: 'lg', onChange: noop }
			});

			const date = dateInputIn(screen.container).closest('.astryx-date-time-input-date-segment');
			const time = timeInputIn(screen.container).closest('.astryx-date-time-input-time-segment');

			expect(date).toHaveAttribute('data-size', 'lg');
			expect(date).toHaveClass('lg');
			expect(time).toHaveAttribute('data-size', 'lg');
			expect(time).toHaveClass('lg');
		});

		it('reflects status on both segments, mirroring the root', async () => {
			const screen = await render(DateTimeInput, {
				props: {
					label: 'Meeting',
					status: { type: 'error', message: 'Required' },
					onChange: noop
				}
			});

			const date = dateInputIn(screen.container).closest('.astryx-date-time-input-date-segment');
			const time = timeInputIn(screen.container).closest('.astryx-date-time-input-time-segment');

			expect(date).toHaveAttribute('data-status', 'error');
			expect(time).toHaveAttribute('data-status', 'error');
		});

		it('omits data-status when there is no status, like the root does', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});

			const date = dateInputIn(screen.container).closest('.astryx-date-time-input-date-segment');

			expect(date).not.toHaveAttribute('data-status');
		});

		it('keeps the root target intact', async () => {
			const screen = await render(DateTimeInput, {
				props: { label: 'Meeting', onChange: noop }
			});
			// Additive change — the existing root target still renders.
			expect(screen.container.querySelector('.astryx-date-time-input')).not.toBeNull();
		});

		it('exposes both segments as themeable defineTheme targets', () => {
			// The @layer cascade is not observable from JS, so the generated CSS is
			// what proves a theme can actually reach these nodes. `generateThemeCss`
			// is this port's counterpart to upstream's `generateThemeTestCSS` — both
			// return the flat stylesheet string.
			const theme = defineTheme({
				name: 'date-time-input-segments-test',
				components: {
					'date-time-input-date-segment': {
						base: { blockSize: 'var(--size-element-lg)' },
						lg: { paddingInline: 'var(--spacing-4)' }
					},
					'date-time-input-time-segment': {
						base: { blockSize: 'var(--size-element-lg)' }
					}
				}
			});
			const css = generateThemeCss(theme);

			expect(css).toContain('.astryx-date-time-input-date-segment {');
			expect(css).toContain('.astryx-date-time-input-date-segment.lg');
			expect(css).toContain('.astryx-date-time-input-time-segment {');
			expect(css).toContain('block-size: var(--size-element-lg)');
			expect(css).toContain('padding-inline: var(--spacing-4)');
		});
	});
});

describe('DateTimeInput disabled theme state', () => {
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-date-time-input');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-date-time-input');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});
