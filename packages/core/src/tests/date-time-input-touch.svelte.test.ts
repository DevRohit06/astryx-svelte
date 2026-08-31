import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import * as stylex from '@stylexjs/stylex';
import DateTimeInput from '$lib/components/date-time-input/date-time-input.svelte';
import type { ISODateTimeString } from '$lib/components/date-time-input/date-time-input.svelte';
// Upstream reads its own source with `node:fs`; the browser project has neither
// `fs` nor `__dirname`, and Vite's `?raw` hands over the same bytes. The
// precedent is `mobile-nav-entry-animation.svelte.test.ts`.
import touchFieldSource from '$lib/components/date-time-input/touch-date-time-field.svelte?raw';
import touchStyleSource from '$lib/components/date-time-input/touch-date-time-field.stylex.ts?raw';
import ControlledDateTimeInput from './fixtures/date-time-input-controlled.svelte';

/**
 * Astryx's `DateTimeInput/DateTimeInputTouch.test.tsx`, ported case for case —
 * **all 39 of upstream's 39** at the **v0.5.2** pin (`describe('DateTimeInput
 * touch surface')`, measured off the checkout). Nothing is dropped: the file
 * has no `displayName` case, no snapshot, no no-JSX construction form and no
 * `ref`.
 *
 * ## Project
 *
 * Client (real Chromium). The surface is a `<dialog>` opened with `showModal()`
 * holding a virtualized month scroller and four scroll-snapped wheels; every
 * one of those needs real layout.
 *
 * ## Upstream's environment shims are dropped, every one of them deliberately
 *
 * - **`MockResizeObserver`** — jsdom ships no `ResizeObserver`, so upstream
 *   needs a no-op. Chromium ships a real one and `MonthScroller` *needs* it:
 *   the scroller reads its pane width from layout, and a no-op observer would
 *   leave `paneSize` at 0 and mount no month pane at all. Stubbing it here
 *   would silently remove the calendar from six cases that click a day in it.
 * - **`withMonthLayout`** — upstream shadows `HTMLElement.prototype.clientWidth`
 *   to fake the scrollport, for the same reason: jsdom lays nothing out. Its
 *   counterpart here is `settleMonthPanes()`, which simply waits for the panes
 *   the real observer mounts once the sheet is displayed. Every case upstream
 *   wraps in `withMonthLayout` and that actually reaches a day cell calls it.
 * - `window.scrollTo`, `Element.prototype.scrollTo`, `scrollIntoView` and the
 *   `HTMLDialogElement` `showModal`/`show`/`close` shims are dropped for the
 *   same reason — Chromium implements all of them, and the dialog's real modal
 *   behaviour is what the `aria-expanded` and scrim cases are about.
 *
 * `matchMedia` is kept verbatim as `stubMedia`, and is load-bearing: it is what
 * selects the touch surface over the pointer one.
 *
 * ## The clock
 *
 * Upstream's `vi.setSystemTime(new Date(2026, 2, 15, 9, 30, 45))` becomes
 * `vi.useFakeTimers({toFake: ['Date']})` plus the same `setSystemTime`. Only
 * `Date` is faked: vitest's default `toFake` set includes `queueMicrotask`,
 * which is what Svelte schedules on, and faking it stalls mount and unmount.
 * The clock matters — `getDefaultTime()` seeds the time half from `new Date()`,
 * which is what makes `2026-03-21T09:30` deterministic in three cases.
 *
 * ## Restated, each noted at the case
 *
 * - every `fireEvent.click(el)` — vitest-browser has no `fireEvent`; the
 *   counterpart is a raw `el.click()`, which dispatches the same lone `click`
 *   event upstream's does. It is also *required* rather than merely equivalent
 *   for `clears an uncommitted time draft when dismissed from the scrim`:
 *   Playwright's `.click()` would aim at the dialog's centre, which is the
 *   panel, and the scrim test is precisely about a click whose target is the
 *   dialog itself.
 * - every `fireEvent.keyDown(el, {key})` — a dispatched `KeyboardEvent`,
 *   followed by `tick()` so two events fired back to back do not share one
 *   Svelte batch.
 * - the three `vi.useFakeTimers()` + `vi.runAllTimers()` cases (`enables Save
 *   date after a controlled date selection updates value`, `Save date advances
 *   to Time…`, `clears the whole datetime and restores focus on the next task`)
 *   — `setTimeout` is **not** faked and `runAllTimers()` becomes
 *   `nextTask()`. Faking `setTimeout` in this project breaks Playwright's own
 *   in-page actionability polling, and every assertion survives the change: the
 *   "not yet called" half still runs synchronously after the click, and the
 *   "called after the deferral" half still runs after exactly one macrotask,
 *   which is what `setTimeout(…, 0)` is.
 * - `does not wire focus to reopen the sheet after dismissal` and `bounds grid
 *   panel min-content width…` read source text. `readFileSync` becomes `?raw`
 *   (see the import), the file becomes this port's `touch-date-time-field.svelte`
 *   / `.stylex.ts`, `onFocus=` becomes `onfocus=`, and the style-block regex
 *   closes on a tab rather than two spaces because this repo indents with tabs.
 *   Upstream's own reasoning for asserting on the definition survives intact.
 * - `keeps the desktop two-field surface on a fine primary pointer` — upstream's
 *   `expect(screen.getByLabelText('Meeting time'))` becomes an exact match. The
 *   time field's name is derived from the field label (`"{label} time"`), so a
 *   substring matcher would let `'Meeting'` and `'Meeting time'` collide, which
 *   is the whole reason this repo pins `exact: true`.
 * - `keeps a disabled reason reachable while blocking activation` — upstream's
 *   `expect(field).not.toBeDisabled()`. vitest-browser's `toBeDisabled` is
 *   Playwright's ARIA computation, which counts `aria-disabled="true"` as
 *   disabled, where jest-dom's reads the native attribute. The two disagree by
 *   design on exactly the attribute this case requires, so the native attribute
 *   is asserted directly. Same substitution the sibling
 *   `date-time-input.svelte.test.ts` makes for the same block.
 * - `Save after keyboard opening does not refocus-reopen the sheet` — the
 *   assertions are upstream's, but they run after the sheet's exit motion has
 *   completed rather than in the same task as the click. That is where the case
 *   bites: `BottomSheet` returns focus to its trigger on motion complete, and
 *   the whole question is whether that focus reopens the sheet. jsdom has no
 *   transitions, so upstream's synchronous assertions already sit after the
 *   focus return; here they have to wait for it.
 *
 * ## `exact: true` everywhere
 *
 * Every string `name`/`text` carries it. Three collisions it prevents:
 * `'Meeting'` vs `'Meeting time'` on the two comboboxes, `'Save'` vs `'Save
 * date'` on the two footer buttons, and the wheel options, where `'3'` is a
 * substring of `'13'`, `'23'`, `'30'`… in the same listbox.
 */

const noop = (): void => {};

const iso = (value: string): ISODateTimeString => value as ISODateTimeString;

/** Playwright's locators are substring/case-insensitive; RTL's are exact. */
const exact = { exact: true } as const;

const HOVER_CAPABLE = /\(\s*hover\s*:\s*hover\s*\)/;

/**
 * Upstream's `responsiveLayoutProbe`. StyleX compiles `stylex.create` out of any
 * module the plugin sees, including a test file, so the probe emits the same
 * atomic classes the component's own style block does — which is what makes the
 * comparison meaningful rather than a restatement of the class hash.
 */
const responsiveLayoutProbe = stylex.create({
	row: { flexWrap: 'wrap' },
	segment: { flexBasis: 196, minInlineSize: 0 }
});

function expectResponsiveProbeClasses(
	element: HTMLElement,
	style: (typeof responsiveLayoutProbe)[keyof typeof responsiveLayoutProbe]
): void {
	const classes = (stylex.props(style).className ?? '')
		.split(' ')
		.filter((className) => className !== '' && !className.includes('__'));
	expect(classes.length).toBeGreaterThan(0);
	for (const className of classes) {
		expect(element).toHaveClass(className);
	}
}

function stubMedia(pointer: 'coarse' | 'fine', anyPointer = pointer): void {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: /any-pointer:\s*coarse/.test(query)
			? anyPointer === 'coarse'
			: /pointer:\s*coarse/.test(query)
				? pointer === 'coarse'
				: /pointer:\s*fine/.test(query)
					? pointer === 'fine'
					: HOVER_CAPABLE.test(query),
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	}));
}

/**
 * Upstream's `withMonthLayout`, inverted: the scroller mounts its panes from a
 * real `ResizeObserver` callback once the sheet is displayed, so the counterpart
 * of faking the scrollport is waiting for the panes it produces.
 */
async function settleMonthPanes(): Promise<void> {
	await vi.waitFor(() => {
		if (document.querySelector('[data-scroller="months"] [role="gridcell"]') == null) {
			throw new Error('no month pane mounted yet');
		}
	});
}

function dateField(label = 'Meeting'): HTMLElement {
	return page.getByRole('combobox', { name: label, ...exact }).element() as HTMLElement;
}

function timeField(label = 'Meeting time'): HTMLElement {
	return page.getByRole('combobox', { name: label, ...exact }).element() as HTMLElement;
}

function dateSegment(): HTMLElement {
	const segment = document.querySelector('.astryx-date-time-input-date-segment');
	if (!(segment instanceof HTMLElement)) {
		throw new Error('date segment not found');
	}
	return segment;
}

function timeSegment(): HTMLElement {
	const segment = document.querySelector('.astryx-date-time-input-time-segment');
	if (!(segment instanceof HTMLElement)) {
		throw new Error('time segment not found');
	}
	return segment;
}

/** Upstream's `fireEvent.click`. */
async function click(element: Element): Promise<void> {
	(element as HTMLElement).click();
	await tick();
}

/** Upstream's `fireEvent.keyDown(el, {key})`, flushed the same way. */
async function keyDown(element: Element, key: string): Promise<void> {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
	await tick();
}

/** Upstream's `vi.runAllTimers()` for a `setTimeout(…, 0)`. See the header. */
async function nextTask(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
	await tick();
}

function button(name: string): HTMLElement {
	return page.getByRole('button', { name, ...exact }).element() as HTMLElement;
}

function radio(name: string): HTMLElement {
	return page.getByRole('radio', { name, ...exact }).element() as HTMLElement;
}

async function openDateSheet(label = 'Meeting'): Promise<HTMLElement> {
	const field = dateField(label);
	await click(field);
	return field;
}

async function openTimeSheet(label = 'Meeting time'): Promise<HTMLElement> {
	const field = timeField(label);
	await click(field);
	return field;
}

async function switchToTimePanel(): Promise<void> {
	await click(radio('Time'));
}

function optionIn(listName: string, optionName: string): HTMLElement {
	return page
		.getByRole('listbox', { name: listName, ...exact })
		.getByRole('option', { name: optionName, ...exact })
		.element() as HTMLElement;
}

beforeAll(() => {
	// Upstream's `beforeAll` shims `window.scrollTo`, `Element.prototype.scrollTo`,
	// `scrollIntoView` and `HTMLDialogElement`'s `showModal`/`show`/`close`,
	// because jsdom implements none of them. Chromium implements all of them,
	// and the real modal dialog is what the sheet's own cases are about.
	vi.useFakeTimers({ toFake: ['Date'] });
});

afterAll(() => {
	vi.useRealTimers();
});

beforeEach(() => {
	vi.setSystemTime(new Date(2026, 2, 15, 9, 30, 45));
	stubMedia('coarse');
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('DateTimeInput touch surface', () => {
	it('uses the bottom-sheet picker on a coarse pointer', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		const field = dateField();

		expect(field).toHaveAttribute('readonly');
		expect(field).toHaveAttribute('inputmode', 'none');
		expect(field).toHaveAttribute('aria-expanded', 'false');

		await click(field);
		expect(field).toHaveAttribute('aria-expanded', 'true');
		await expect
			.element(page.getByRole('radiogroup', { name: 'Date/time section', ...exact }))
			.toBeInTheDocument();
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
	});

	it('uses intrinsic wrapping for the closed touch segments', async () => {
		const screen = await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		const row = screen.container.querySelector('.astryx-date-time-input') as HTMLElement;
		expectResponsiveProbeClasses(row, responsiveLayoutProbe.row);
		expectResponsiveProbeClasses(dateSegment(), responsiveLayoutProbe.segment);
		expectResponsiveProbeClasses(timeSegment(), responsiveLayoutProbe.segment);
	});

	it('keeps the desktop two-field surface on a fine primary pointer', async () => {
		stubMedia('fine', 'coarse');
		const screen = await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });

		expect(screen.getByRole('combobox').element()).not.toHaveAttribute('readonly');
		await expect.element(screen.getByLabelText('Meeting time', exact)).toBeInTheDocument();
	});

	it('closed touch fields display separate values and placeholders', async () => {
		const screen = await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		expect(dateField()).toHaveAttribute('placeholder', 'Select a date');
		expect(timeField()).toHaveAttribute('placeholder', 'Select a time');
		expect(dateField()).toHaveValue('');
		expect(timeField()).toHaveValue('');

		await screen.rerender({
			label: 'Meeting',
			value: iso('2026-03-15T14:30'),
			onChange: noop
		});
		expect(dateField()).toHaveValue('March 15, 2026');
		expect(timeField()).toHaveValue('2:30 PM');
		expect(dateField()).not.toHaveValue('March 15, 2026, 2:30 PM');
	});

	it('uses a custom timePlaceholder on the touch time segment', async () => {
		await render(DateTimeInput, {
			props: { label: 'Meeting', timePlaceholder: 'Pick a time', onChange: noop }
		});
		expect(timeField()).toHaveAttribute('placeholder', 'Pick a time');
	});

	it('does not wire focus to reopen the sheet after dismissal', () => {
		// Upstream reads `TouchDateTimeField.tsx` with `node:fs`; the browser
		// project has neither `fs` nor `__dirname`, so the bytes come in through
		// Vite's `?raw`. `onFocus=` is React's spelling of `onfocus=`.
		expect(touchFieldSource).not.toContain('onfocus=');
		expect(touchFieldSource).not.toContain('handleDateFocus');
		expect(touchFieldSource).not.toContain('handleTimeFocus');
	});

	it('opens directly to Date from the date segment and calendar icon', async () => {
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T09:30'), onChange: noop }
		});
		await click(dateField());
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
		expect(dateField()).toHaveAttribute('aria-expanded', 'true');
		expect(timeField()).toHaveAttribute('aria-expanded', 'false');

		await click(button('Save date'));
		expect(radio('Time')).toHaveAttribute('aria-checked', 'true');
		await click(button('Save'));
		await click(button('Open calendar'));
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
	});

	it('opens directly to Time from the time segment and clock affordance with no date', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await click(timeField());
		expect(radio('Time')).toHaveAttribute('aria-checked', 'true');
		expect(dateField()).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'true');

		await click(button('Save'));
		await click(button('Open Meeting time'));
		expect(radio('Time')).toHaveAttribute('aria-checked', 'true');
	});

	it('opens from date and time segment padding clicks', async () => {
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T09:30'), onChange: noop }
		});

		await click(dateSegment());
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
		await click(button('Save date'));
		await click(button('Save'));

		await click(timeSegment());
		expect(radio('Time')).toHaveAttribute('aria-checked', 'true');
	});

	it('keyboard activation opens the corresponding touch panel', async () => {
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T09:30'), onChange: noop }
		});
		await keyDown(dateField(), 'Enter');
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');

		await click(button('Save date'));
		await click(button('Save'));
		await keyDown(timeField(), ' ');
		expect(radio('Time')).toHaveAttribute('aria-checked', 'true');
	});

	it('switches between inert date and time panels with the pill control', async () => {
		const screen = await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await openDateSheet();

		const datePanel = screen.container.querySelector('[data-panel="date"]') as HTMLElement;
		const timePanel = screen.container.querySelector('[data-panel="time"]') as HTMLElement;
		expect(datePanel).not.toHaveAttribute('aria-hidden');
		expect(timePanel).toHaveAttribute('aria-hidden', 'true');

		await switchToTimePanel();
		expect(datePanel).toHaveAttribute('aria-hidden', 'true');
		expect(timePanel).not.toHaveAttribute('aria-hidden');
		expect(radio('Time')).toHaveAttribute('aria-checked', 'true');
		expect(dateField()).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'true');
	});

	it('selects a date with the drafted/default time and leaves the Date panel active', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, { props: { label: 'Meeting', onChange } });
		await openDateSheet();
		await settleMonthPanes();

		await click(button('Saturday, March 21, 2026'));

		expect(onChange).toHaveBeenCalledWith('2026-03-21T09:30');
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
	});

	it('does not lose a time chosen before the date exists', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, { props: { label: 'Meeting', onChange } });
		await openTimeSheet();
		await settleMonthPanes();

		await click(optionIn('AM/PM', 'PM'));
		await click(optionIn('Hour', '3'));
		await click(optionIn('Minute', '45'));
		expect(timeField()).toHaveValue('3:45 PM');
		expect(dateField()).toHaveValue('');
		expect(onChange).not.toHaveBeenCalled();

		await click(radio('Date'));
		await click(button('Saturday, March 21, 2026'));
		expect(onChange).toHaveBeenCalledWith('2026-03-21T15:45');
	});

	it('keeps an uncommitted time draft across Date and Time tab switches', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await openTimeSheet();

		await click(optionIn('AM/PM', 'PM'));
		await click(optionIn('Hour', '3'));
		await click(optionIn('Minute', '45'));
		await click(radio('Date'));
		expect(timeField()).toHaveValue('3:45 PM');

		await switchToTimePanel();
		expect(timeField()).toHaveValue('3:45 PM');
	});

	it('clears an uncommitted time draft when Time Save closes without a date', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await openTimeSheet();

		await click(optionIn('AM/PM', 'PM'));
		await click(optionIn('Hour', '3'));
		await click(optionIn('Minute', '45'));
		expect(timeField()).toHaveValue('3:45 PM');

		await click(button('Save'));
		expect(timeField()).toHaveValue('');
	});

	it('clears an uncommitted time draft when dismissed with Escape', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await openTimeSheet();

		await click(optionIn('AM/PM', 'PM'));
		await click(optionIn('Hour', '3'));
		await click(optionIn('Minute', '45'));
		expect(timeField()).toHaveValue('3:45 PM');

		await keyDown(page.getByRole('dialog').element(), 'Escape');
		expect(timeField()).toHaveValue('');
	});

	it('clears an uncommitted time draft when dismissed from the scrim', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await openTimeSheet();

		await click(optionIn('AM/PM', 'PM'));
		await click(optionIn('Hour', '3'));
		await click(optionIn('Minute', '45'));
		expect(timeField()).toHaveValue('3:45 PM');

		// A raw `.click()` rather than Playwright's: the scrim IS the dialog
		// element, and a real pointer click at the dialog's centre would land on
		// the panel instead. Upstream's `fireEvent.click` has the same shape.
		await click(page.getByRole('dialog').element());
		expect(timeField()).toHaveValue('');
	});

	it('commits 12-hour wheel changes against the controlled date', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T14:30'), onChange }
		});
		await openDateSheet();
		await switchToTimePanel();

		await click(optionIn('Hour', '3'));
		expect(onChange).toHaveBeenCalledWith('2026-03-15T15:30');
	});

	it('commits 24-hour wheel changes', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30'),
				hourFormat: '24h',
				onChange
			}
		});
		await openDateSheet();
		await switchToTimePanel();

		await click(optionIn('Hour', '09'));
		expect(onChange).toHaveBeenCalledWith('2026-03-15T09:30');
	});

	it('commits seconds when hasSeconds is set', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30:00'),
				hasSeconds: true,
				onChange
			}
		});
		await openDateSheet();
		await switchToTimePanel();

		await click(optionIn('Second', '45'));
		expect(onChange).toHaveBeenCalledWith('2026-03-15T14:30:45');
	});

	it('disables out-of-range hours on the min/max boundary date', async () => {
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T10:00'),
				min: iso('2026-03-15T09:00'),
				max: iso('2026-03-15T17:00'),
				hourFormat: '24h',
				onChange: noop
			}
		});
		await openDateSheet();
		await switchToTimePanel();

		expect(optionIn('Hour', '08')).toHaveAttribute('aria-disabled', 'true');
		expect(optionIn('Hour', '09')).not.toHaveAttribute('aria-disabled');
		expect(optionIn('Hour', '18')).toHaveAttribute('aria-disabled', 'true');
	});

	it('preserves the browsed month when switching Date to Time and back', async () => {
		await render(DateTimeInput, { props: { label: 'Meeting', onChange: noop } });
		await openDateSheet();
		await settleMonthPanes();

		await click(button('Next month'));
		await expect.element(page.getByText('April 2026', exact)).toBeInTheDocument();

		await switchToTimePanel();
		await click(radio('Date'));
		await expect.element(page.getByText('April 2026', exact)).toBeInTheDocument();
		expect(document.querySelector('[data-scroller="months"]')).not.toBeNull();
	});

	it('bounds grid panel min-content width so MonthScroller cannot feed back through its spacer', () => {
		// Upstream reads `TouchDateTimeField.tsx`, where the styles are inline in
		// the component file; this port keeps them in `touch-date-time-field.stylex.ts`.
		// The block regex closes on a tab because this repo indents with tabs.
		const styleBlock = (name: string): string => {
			const match = new RegExp(`${name}: \\{([\\s\\S]*?)\\n\\t\\},`).exec(touchStyleSource);
			if (match == null) {
				throw new Error(`missing style block ${name}`);
			}
			return match[1];
		};

		for (const name of [
			'touchRow',
			'touchSheetBody',
			'touchSurface',
			'touchPanelStack',
			'touchPanel',
			'touchDateSurfaceStack',
			'touchDateSurface',
			'touchTimeWheels'
		]) {
			expect(styleBlock(name)).toContain("inlineSize: '100%'");
			expect(styleBlock(name)).toContain('minInlineSize: 0');
		}
		for (const name of ['touchDateWrapper', 'touchTimeWrapper']) {
			expect(styleBlock(name)).toContain('minInlineSize: 0');
		}
	});

	it('keeps accepting in-sheet edits while a changeAction is pending', async () => {
		const onChange = vi.fn();
		const changeAction = vi.fn(async () => new Promise<void>(() => {}));
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30'),
				onChange,
				changeAction
			}
		});
		await openDateSheet();
		await switchToTimePanel();

		await click(optionIn('Hour', '3'));
		expect(onChange).toHaveBeenCalledWith('2026-03-15T15:30');
		expect(dateField()).toHaveAttribute('aria-busy', 'true');

		await click(optionIn('Minute', '45'));
		expect(onChange).toHaveBeenCalledWith('2026-03-15T15:45');
		expect(changeAction).toHaveBeenCalledTimes(2);
	});

	it('clamps drafted time to the selected date boundary', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: { label: 'Meeting', min: iso('2026-03-21T09:00'), onChange }
		});
		await openDateSheet();
		await settleMonthPanes();
		await switchToTimePanel();
		await click(optionIn('Hour', '3'));

		await click(radio('Date'));
		await click(button('Saturday, March 21, 2026'));

		expect(onChange).toHaveBeenCalledWith('2026-03-21T09:00');
	});

	it('honors dateConstraints in the Date panel', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				dateConstraints: [(date: Date) => date.getDate() !== 21],
				onChange
			}
		});
		await openDateSheet();
		await settleMonthPanes();
		const disabledDay = button('Saturday, March 21, 2026');

		expect(disabledDay).toHaveAttribute('aria-disabled', 'true');
		await click(disabledDay);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('Reset clears the value and leaves the sheet open on the Date panel', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange }
		});
		const field = await openDateSheet();
		await settleMonthPanes();

		await click(button('Reset'));
		expect(onChange).toHaveBeenCalledWith(undefined);
		expect(field).toHaveAttribute('aria-expanded', 'true');
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
	});

	it('keeps Save date disabled until a valid date exists', async () => {
		await render(ControlledDateTimeInput, { props: {} });
		await openDateSheet();
		await settleMonthPanes();
		const saveDateButton = button('Save date');

		expect(saveDateButton).toBeDisabled();
		await click(saveDateButton);
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
		expect(timeField()).toHaveAttribute('aria-expanded', 'false');
	});

	it('enables Save date after a controlled date selection updates value', async () => {
		await render(ControlledDateTimeInput, { props: {} });
		await openDateSheet();
		await settleMonthPanes();
		const saveDateButton = button('Save date');
		expect(saveDateButton).toBeDisabled();

		await click(button('Saturday, March 21, 2026'));
		expect(dateField()).toHaveValue('March 21, 2026');
		expect(saveDateButton).not.toBeDisabled();

		await click(saveDateButton);
		expect(dateField()).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'true');
		const timeTab = radio('Time');
		expect(timeTab).toHaveAttribute('aria-checked', 'true');

		// Upstream's `vi.runAllTimers()`; the focus is deferred by one macrotask.
		await nextTask();
		expect(timeTab).toHaveFocus();
	});

	it('disables Save date after Reset clears the controlled date', async () => {
		await render(ControlledDateTimeInput, {
			props: { initialValue: iso('2026-03-15T10:00') }
		});
		await openDateSheet();
		await settleMonthPanes();
		const saveDateButton = button('Save date');
		expect(saveDateButton).not.toBeDisabled();

		await click(button('Reset'));
		expect(dateField()).toHaveValue('');
		expect(saveDateButton).toBeDisabled();

		await click(saveDateButton);
		expect(radio('Date')).toHaveAttribute('aria-checked', 'true');
		expect(timeField()).toHaveAttribute('aria-expanded', 'false');
	});

	it('Save date advances to Time, focuses the Time tab, and does not change the value', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange }
		});
		await openDateSheet();
		await settleMonthPanes();
		const timeTab = radio('Time');

		await click(button('Save date'));

		expect(dateField()).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'true');
		expect(timeTab).toHaveAttribute('aria-checked', 'true');
		expect(document.querySelector('[data-panel="time"]')).not.toHaveAttribute('aria-hidden');
		expect(onChange).not.toHaveBeenCalled();

		await nextTask();
		expect(timeTab).toHaveFocus();
	});

	it('Save after keyboard opening does not refocus-reopen the sheet', async () => {
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange: noop }
		});
		const field = dateField();
		field.focus();
		await keyDown(field, 'Enter');
		expect(field).toHaveAttribute('aria-expanded', 'true');

		await click(button('Save date'));
		await click(button('Save'));
		// The assertions are upstream's; they run once the sheet's exit motion has
		// completed, because that is when `BottomSheet` hands focus back to the
		// trigger — the very focus this case says must not reopen anything. jsdom
		// closes synchronously, so upstream's assertions already sit after it.
		await vi.waitFor(() => {
			if (document.querySelector('dialog[open]') != null) {
				throw new Error('sheet still open');
			}
		});
		expect(field).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'false');
	});

	it('Time Save closes the sheet without changing the value', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange }
		});
		await openDateSheet();
		await settleMonthPanes();
		await click(button('Save date'));

		await click(button('Save'));
		expect(dateField()).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'false');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('disables out-of-range seconds on the min/max boundary time', async () => {
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30:30'),
				min: iso('2026-03-15T14:30:30'),
				max: iso('2026-03-15T14:30:30'),
				hasSeconds: true,
				onChange: noop
			}
		});
		await openDateSheet();
		await switchToTimePanel();

		expect(optionIn('Second', '29')).toHaveAttribute('aria-disabled', 'true');
		expect(optionIn('Second', '30')).not.toHaveAttribute('aria-disabled');
		expect(optionIn('Second', '31')).toHaveAttribute('aria-disabled', 'true');
	});

	it('reflects controlled value changes in the closed field', async () => {
		const screen = await render(DateTimeInput, {
			props: { label: 'Meeting', value: iso('2026-03-15T10:00'), onChange: noop }
		});
		expect(dateField()).toHaveValue('March 15, 2026');
		expect(timeField()).toHaveValue('10:00 AM');

		await screen.rerender({
			label: 'Meeting',
			value: iso('2026-03-16T18:45'),
			onChange: noop
		});
		expect(dateField()).toHaveValue('March 16, 2026');
		expect(timeField()).toHaveValue('6:45 PM');
	});

	it('clears the whole datetime and restores focus on the next task', async () => {
		const onChange = vi.fn();
		await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T10:00'),
				hasClear: true,
				onChange
			}
		});
		const field = dateField();
		const focusSpy = vi.spyOn(field, 'focus');

		await click(button('Clear Meeting'));
		expect(onChange).toHaveBeenCalledWith(undefined);
		expect(field).toHaveAttribute('aria-expanded', 'false');
		expect(focusSpy).not.toHaveBeenCalled();

		// Upstream's `vi.runAllTimers()`; the focus is deferred by one macrotask.
		await nextTask();
		expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
	});

	it('blocks opening, clearing and in-sheet edits while loading', async () => {
		const onChange = vi.fn();
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30'),
				isLoading: true,
				hasClear: true,
				onChange
			}
		});
		const loadingField = dateField();
		await click(loadingField);
		expect(loadingField).toHaveAttribute('aria-expanded', 'false');
		expect(page.getByRole('button', { name: 'Clear Meeting', ...exact }).query()).toBeNull();

		// `rerender` merges rather than replaces, so `isLoading` is spelled out.
		await screen.rerender({
			label: 'Meeting',
			value: iso('2026-03-15T14:30'),
			isLoading: false,
			hasClear: true,
			onChange
		});
		const field = dateField();
		await click(field);
		await switchToTimePanel();
		expect(field).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'true');

		await screen.rerender({
			label: 'Meeting',
			value: iso('2026-03-15T14:30'),
			isLoading: true,
			hasClear: true,
			onChange
		});
		expect(field).toHaveAttribute('aria-expanded', 'false');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('clicking the pending spinner inside an enabled date segment does not open the sheet', async () => {
		const onChange = vi.fn();
		const changeAction = vi.fn(async () => new Promise<void>(() => {}));
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				value: iso('2026-03-15T14:30'),
				changeAction,
				onChange
			}
		});
		await openTimeSheet();
		await click(optionIn('Minute', '45'));
		await click(button('Save'));
		const spinner = screen.container.querySelector(
			'.astryx-date-time-input-date-segment .astryx-spinner'
		) as HTMLElement;
		expect(spinner).not.toBeNull();
		expect(dateField()).not.toBeDisabled();

		await click(spinner);

		expect(dateField()).toHaveAttribute('aria-expanded', 'false');
		expect(timeField()).toHaveAttribute('aria-expanded', 'false');
	});

	it('keeps a disabled reason reachable while blocking activation', async () => {
		const screen = await render(DateTimeInput, {
			props: {
				label: 'Meeting',
				isDisabled: true,
				disabledMessage: 'Choose a project first',
				onChange: noop
			}
		});
		const field = dateField();

		// Restated: vitest-browser's `toBeDisabled` is Playwright's ARIA
		// computation, which counts `aria-disabled="true"` as disabled where
		// jest-dom's reads the native attribute. This case is about exactly that
		// difference, so the native attribute is asserted directly.
		expect(field).not.toHaveAttribute('disabled');
		expect(field).toHaveAttribute('aria-disabled', 'true');
		expect(field.getAttribute('aria-describedby')).toContain(
			screen.getByRole('tooltip', { includeHidden: true }).element().id
		);
		await click(field);
		expect(field).toHaveAttribute('aria-expanded', 'false');
	});
});
