/** PORTS: DateInput/DateInputTouch.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import DateInput from '$lib/components/date-input/date-input.svelte';
import type { ISODateString } from '$lib/utils/date-types.js';
import ControlledDateInput from './fixtures/date-input-controlled.svelte';
import DateInputI18n from './fixtures/date-input-i18n.svelte';
import DateInputGroupProbe from './fixtures/date-input-group-probe.svelte';

/**
 * Astryx's `DateInput/DateInputTouch.test.tsx`, ported case for case — the
 * **DOM half**, at the **0.5.2** pin.
 *
 * ## Why this file is a companion rather than the whole port
 *
 * `date-input-touch.test.ts` (server project) already carries the same upstream
 * suite's 35 executable-without-a-DOM cases: `describe('monthGeometry')` and
 * `describe('DateInput — scroll CSS (definition-level)')`. Splitting one
 * upstream suite across two files is allowed and is declared on both — the case
 * delta in `port/status.md` is computed per connected group, so the two are
 * summed against upstream's total rather than each double-counting it.
 *
 * The split is upstream's own: its header says the month math is pure and the
 * scroll CSS is asserted on the style *definition* because jsdom implements
 * none of it. Those two properties put those cases in the node project here.
 * Everything in this file needs a rendered tree.
 *
 * ## Project
 *
 * Client (real Chromium). The surface is a `<dialog>` holding a virtualized
 * month scroller and two scroll-snapped wheels, and every case here depends on
 * real layout: the scroller mounts panes from a `ResizeObserver` reading a
 * width that only exists once CSS has been applied.
 *
 * ## Upstream's environment shims are dropped, deliberately
 *
 * The reasoning is `date-time-input-touch.svelte.test.ts`'s, and it holds here
 * for the same components:
 *
 * - **`MockResizeObserver`** — Chromium ships a real one, and `MonthScroller`
 *   *needs* it. A no-op observer leaves `paneSize` at 0 and mounts no pane at
 *   all, which would silently remove the calendar from most of this file.
 * - **`withLayout`** — upstream shadows `HTMLElement.prototype.clientWidth`
 *   because jsdom lays nothing out, and says in a comment that leaving the
 *   getter installed costs ~2.4s per test. Its counterpart here is
 *   `settleMonthPanes()`: wait for the panes the real observer mounts.
 * - **`Element.prototype.scrollTo`** and the three `HTMLDialogElement` shims —
 *   Chromium implements all four, and the dialog's real modal behaviour is what
 *   several cases here are about.
 *
 * `stubMedia` is kept, and is load-bearing: it is what selects the touch
 * surface. It is also kept **honest about width**, exactly as upstream wrote
 * it, so a width bound creeping back into the surface switch fails a case
 * rather than passing on a stub that ignores it.
 *
 * ## The clock
 *
 * `vi.useFakeTimers({toFake: ['Date']})` plus upstream's `setSystemTime(new
 * Date(2026, 2, 15))`. Only `Date` is faked: vitest's default `toFake` set
 * includes `queueMicrotask`, which is what Svelte schedules on, and faking it
 * stalls mount and unmount. `setTimeout` is left real for the same reason the
 * sibling suite leaves it real — faking it breaks Playwright's in-page
 * actionability polling.
 *
 * ## `exact: true` everywhere
 *
 * Every string `name` carries it. Playwright's locators substring-match where
 * Testing Library's are whole-string, so a verbatim port is *weaker* than the
 * case it ports. Day numbers are the sharpest instance in this file: `'1'` is a
 * substring of `'21'`, `'31'` and `'11'` in the same grid.
 */

/** Playwright's locators are substring/case-insensitive; RTL's are exact. */
const exact = { exact: true } as const;

const iso = (value: string): ISODateString => value as ISODateString;

/** Matches the repo-wide setup polyfill, so hover-gated behavior still works. */
const HOVER_CAPABLE = /\(\s*hover\s*:\s*hover\s*\)/;

/**
 * Upstream's `stubMedia`, verbatim in behaviour.
 *
 * Width queries are answered **honestly** against `width`, so a width bound
 * creeping back into the surface switch fails a test rather than passing
 * silently on a stub that ignores it.
 */
function stubMedia({
	pointer,
	anyPointer,
	width
}: {
	pointer: 'coarse' | 'fine';
	anyPointer?: 'coarse' | 'fine';
	width: number;
}): void {
	vi.stubGlobal('matchMedia', (query: string) => {
		let matches: boolean;
		const maxWidth = /\(\s*max-width:\s*(\d+)px\s*\)/.exec(query);
		const minWidth = /\(\s*min-width:\s*(\d+)px\s*\)/.exec(query);
		if (/any-pointer:\s*coarse/.test(query)) {
			matches = (anyPointer ?? pointer) === 'coarse';
		} else if (/pointer:\s*coarse/.test(query)) {
			matches = pointer === 'coarse';
		} else if (/pointer:\s*fine/.test(query)) {
			matches = pointer === 'fine';
		} else if (maxWidth) {
			matches = width <= Number(maxWidth[1]);
		} else if (minWidth) {
			matches = width >= Number(minWidth[1]);
		} else {
			matches = HOVER_CAPABLE.test(query);
		}
		// A compound query is only true when every part of it is.
		if (matches && maxWidth && query.includes('pointer:')) {
			matches = width <= Number(maxWidth[1]);
		}
		return {
			matches,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		};
	});
}

function setViewport(kind: 'mobile' | 'desktop'): void {
	stubMedia(
		kind === 'mobile' ? { pointer: 'coarse', width: 393 } : { pointer: 'fine', width: 1280 }
	);
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 2, 15)); // 15 March 2026, local
	setViewport('mobile');
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

/** The closed field — a real input on both surfaces. */
function field(): HTMLInputElement {
	return page.getByRole('combobox').element() as HTMLInputElement;
}

/**
 * Upstream's `withLayout`, inverted: the scroller mounts its panes from a real
 * `ResizeObserver` callback once the sheet is displayed, so the counterpart of
 * faking the scrollport is waiting for the panes the real observer produces.
 */
async function settleMonthPanes(): Promise<void> {
	await vi.waitFor(() => {
		if (document.querySelector('[data-scroller="months"] [role="gridcell"]') == null) {
			throw new Error('no month pane mounted yet');
		}
	});
}

/** Upstream's `fireEvent.click`. */
async function click(element: Element): Promise<void> {
	(element as HTMLElement).click();
	await tick();
}

/** Upstream's `fireEvent.keyDown(el, {key})`, flushed the same way. */
async function keyDown(element: Element, key: string): Promise<void> {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
	await tick();
}

/**
 * Upstream's `vi.runAllTimers()` where the deferral under test is a
 * `setTimeout(…, 0)`. `setTimeout` is left real in this project — faking it
 * breaks Playwright's in-page actionability polling — so one macrotask is the
 * faithful substitute rather than a weaker wait.
 */
async function nextTask(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
	await tick();
}

/** Render, then open the picker. Both mount panes, so both wait for them. */
async function openPicker(): Promise<void> {
	await click(field());
	await settleMonthPanes();
}

/**
 * One month's grid. Panes for neighbouring months are mounted too, so every day
 * query has to say which month it means.
 */
function pane(label: string): HTMLElement {
	const grid = [...document.querySelectorAll('[role="grid"]')].find(
		(g) => g.getAttribute('aria-label') === label
	);
	if (grid == null) {
		throw new Error(`no pane for ${label}`);
	}
	return grid as HTMLElement;
}

/**
 * Upstream's `within(pane(label)).getByRole('button', {name})`. Scoped to one
 * month's grid because neighbouring panes are mounted too, and a day number is
 * a substring of three others in the same document.
 */
function dayIn(label: string, name: RegExp): HTMLElement {
	const day = [...pane(label).querySelectorAll('button')].find((button) =>
		name.test(button.getAttribute('aria-label') ?? button.textContent ?? '')
	);
	if (day == null) {
		throw new Error(`no day matching ${name} in ${label}`);
	}
	return day;
}

/** Upstream's `within(pane(label)).getAllByRole(role)`. */
function allIn(label: string, role: string): HTMLElement[] {
	return [...pane(label).querySelectorAll(`[role="${role}"]`)] as HTMLElement[];
}

/** Upstream's `within(pane(label)).getAllByRole('button')`. */
function buttonsIn(label: string): HTMLElement[] {
	return [...pane(label).querySelectorAll('button')];
}

/** Upstream's `screen.getByRole('button', {name})`, exact by default. */
function button(name: string): HTMLElement {
	return page.getByRole('button', { name, ...exact }).element() as HTMLElement;
}

/** One animation frame, for the rAF-throttled scroll handlers. */
async function frame(): Promise<void> {
	await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

function monthScroller(): HTMLElement {
	const scroller = document.querySelector('[data-scroller="months"]');
	if (!(scroller instanceof HTMLElement)) {
		throw new Error('no month scroller');
	}
	return scroller;
}

/** Upstream's `fireEvent.scroll(el)`. */
async function scrollTo(element: HTMLElement, left: number): Promise<void> {
	element.scrollLeft = left;
	element.dispatchEvent(new Event('scroll', { bubbles: true }));
	await frame();
}

/**
 * Upstream builds a fake `touchstart` by hand and explains at length that jsdom
 * has no constructible `TouchEvent` and a bare `Event` carries no `touches`.
 * Chromium constructs both, so the counterpart is the real thing — which also
 * removes the hazard upstream's comment is about.
 */
function touchAt(target: EventTarget, type: string, clientX: number, clientY: number): void {
	const touch = new Touch({ identifier: 1, target: target as Element, clientX, clientY });
	target.dispatchEvent(
		new TouchEvent(type, {
			bubbles: true,
			cancelable: true,
			touches: type === 'touchend' ? [] : [touch],
			targetTouches: type === 'touchend' ? [] : [touch],
			changedTouches: [touch]
		})
	);
}

/** Upstream's `within(pane(label)).getAllByRole('gridcell', {selected: true})`. */
function selectedCellsIn(label: string): HTMLElement[] {
	return [
		...pane(label).querySelectorAll('[role="gridcell"][aria-selected="true"]')
	] as HTMLElement[];
}

/** Upstream's `weekdayRow()`: the only 7-cell aria-hidden block. */
function weekdayRow(): HTMLElement {
	const row = [...document.querySelectorAll('[aria-hidden="true"]')].find(
		(el) => el.children.length === 7
	);
	if (!(row instanceof HTMLElement)) {
		throw new Error('no weekday row');
	}
	return row;
}

function weekdayNames(): (string | undefined)[] {
	return [...weekdayRow().children].map((c) => c.textContent?.trim());
}

function monthTitle(): HTMLElement {
	const title = document.querySelector('[data-title="month-year"]');
	if (!(title instanceof HTMLElement)) {
		throw new Error('no month title');
	}
	return title;
}

// ---------------------------------------------------------------------------
// Which surface, and why
// ---------------------------------------------------------------------------

describe('DateInput — surface selection', () => {
	it('hands a touch device to the platform picker by default', async () => {
		// `nativePicker` defaults to 'touch': the OS draws the picker unless a
		// field opts out. Everything else in this file passes 'never', so this is
		// the one place the default itself is asserted.
		stubMedia({ pointer: 'coarse', width: 393 });
		await render(DateInput, { props: { label: 'Event date', onChange: () => {} } });
		expect(document.querySelector('input')).toHaveAttribute('type', 'date');
	});

	it('switches on the pointer alone, so a tablet gets the picker too', async () => {
		// `pointer` is the PRIMARY device, which is what makes it the whole test:
		// a touchscreen laptop reports `fine` (its trackpad) and keeps the typable
		// field, and a narrowed desktop window is still a mouse. A width bound
		// would only re-exclude tablets — the clearest case for a thumb picker
		// there is — so there deliberately is not one.
		//
		// An 1194px tablet in landscape: coarse pointer, far wider than any
		// handset breakpoint. `stubMedia` answers width honestly, so a width bound
		// creeping back in fails here rather than passing silently.
		stubMedia({ pointer: 'coarse', width: 1194 });
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		expect(field()).toHaveAttribute('readonly');
	});

	it('keeps the typable field for a touchscreen laptop', async () => {
		// Touch available, but the trackpad is primary — so `pointer` is `fine`
		// and only `any-pointer` is coarse. The keyboard is right there, and
		// typing a date beats scrolling to it.
		stubMedia({ pointer: 'fine', anyPointer: 'coarse', width: 1366 });
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		expect(field()).not.toHaveAttribute('readonly');
	});

	it('keeps the typable field in a narrowed desktop window', async () => {
		stubMedia({ pointer: 'fine', width: 500 });
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		expect(field()).not.toHaveAttribute('readonly');
	});

	it('renders the desktop DateInput when the query does not match', async () => {
		setViewport('desktop');
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		// The desktop control is a text field you can type into...
		expect(field()).not.toHaveAttribute('readonly');
		expect(field()).not.toHaveAttribute('inputmode');
		// ...and it opens a popover, not a sheet.
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('accepts typed input on the desktop surface', async () => {
		setViewport('desktop');
		const onChange = vi.fn();
		await render(DateInput, {
			props: { nativePicker: 'never', label: 'Event date', onChange, min: undefined }
		});
		// Upstream's `fireEvent.change(field(), {target: {value}})`. Svelte binds
		// on `input`, so the value is written and both events dispatched — the
		// single `change` React listens for does not drive a Svelte binding.
		const input = field();
		input.value = '2026-03-25';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		await tick();
		expect(onChange).toHaveBeenCalledWith('2026-03-25');
	});

	it('renders the touch field when the query matches', async () => {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		const input = field();
		// Still an input — same element, same role, so the label associates
		// natively — but the picker is the only way to change it.
		expect(input.tagName).toBe('INPUT');
		expect(input).toHaveAttribute('readonly');
		// What actually keeps the virtual keyboard from covering the sheet.
		expect(input).toHaveAttribute('inputmode', 'none');
	});

	it('updates the field and open picker when the provider locale changes', async () => {
		const screen = await render(DateInputI18n, {
			props: {
				locale: 'en-US',
				label: 'Event date',
				nativePicker: 'never',
				value: iso('2026-03-21'),
				min: iso('2026-02-01'),
				max: iso('2026-04-30')
			}
		});
		expect(field()).toHaveValue('March 21, 2026');

		await openPicker();
		expect(monthTitle()).toHaveTextContent('March 2026');
		expect(pane('March 2026')).toBeInTheDocument();

		// Upstream's `rerender(renderDateInput('es-ES'))`.
		await screen.rerender({
			locale: 'es-ES',
			label: 'Event date',
			nativePicker: 'never',
			value: iso('2026-03-21'),
			min: iso('2026-02-01'),
			max: iso('2026-04-30')
		});
		expect(field()).toHaveValue('21 de marzo de 2026');
		expect(monthTitle()).toHaveTextContent('marzo de 2026');
		expect(pane('marzo de 2026')).toBeInTheDocument();

		const nextButton = document.querySelector<HTMLButtonElement>(
			'[data-arrows="months"] button:last-child'
		);
		expect(nextButton).not.toBeNull();
		await click(nextButton!);
		await vi.waitFor(() => expect(monthTitle()).toHaveTextContent('abril de 2026'));
	});

	it('forwards ref to the input on both surfaces', async () => {
		// Counterpart, not a translation: this port has no `ref` prop. Upstream's
		// claim is that the SAME element is reachable on both surfaces and is an
		// `<input>` — which is what makes the label association and the `readonly`
		// assertions above meaningful. Asserting the rendered element's identity
		// keeps that claim; there is no callback to stand in for.
		setViewport('desktop');
		const desktop = await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		expect(field()).toBeInstanceOf(HTMLInputElement);
		await desktop.unmount();

		setViewport('mobile');
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		expect(field()).toBeInstanceOf(HTMLInputElement);
	});
});

// ---------------------------------------------------------------------------
// The field contract, honored identically on the touch surface
// ---------------------------------------------------------------------------

describe('DateInput — field parity', () => {
	it('shows a placeholder until a date is chosen, then the formatted value', async () => {
		const screen = await render(DateInput, {
			props: { nativePicker: 'never', label: 'Ship date', onChange: () => {} }
		});
		expect(field()).toHaveValue('');
		expect(field()).toHaveAttribute('placeholder', 'Select a date');
		await screen.rerender({
			nativePicker: 'never',
			label: 'Ship date',
			value: iso('2026-03-21'),
			onChange: () => {}
		});
		expect(field()).toHaveValue('March 21, 2026');
	});

	it('honors a named format', async () => {
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				value: iso('2026-03-21'),
				format: 'system_date',
				onChange: () => {}
			}
		});
		expect(field()).toHaveValue('2026-03-21');
	});

	it('honors a function format', async () => {
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				value: iso('2026-03-21'),
				format: (value: string) => `ISO:${value}`,
				onChange: () => {}
			}
		});
		expect(field()).toHaveValue('ISO:2026-03-21');
	});

	it('honors a custom placeholder', async () => {
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				placeholder: 'Pick a day',
				onChange: () => {}
			}
		});
		expect(field()).toHaveAttribute('placeholder', 'Pick a day');
	});

	it('clears from the field', async () => {
		const onChange = vi.fn();
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				value: iso('2026-03-21'),
				hasClear: true,
				onChange
			}
		});
		await click(page.getByRole('button', { name: /Clear Ship date/ }).element());
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it('returns focus to the field without letting the page scroll', async () => {
		// Clearing unmounts the clear button, and focusing another element in the
		// same task as that unmount makes iOS Safari scroll the document to the
		// top. Measured on the iOS 26 simulator against the live docsite, field at
		// scrollY 2055: synchronous focus lands at 0, deferred focus stays at
		// 2055. `preventScroll` alone does not fix it, so both halves are
		// asserted: the focus is deferred past the unmount, and it is passed
		// preventScroll.
		//
		// Upstream fakes timers and calls `runAllTimers()`. `setTimeout` is left
		// real here — faking it breaks Playwright's in-page actionability polling
		// — and `nextTask()` stands in, which is exactly what a `setTimeout(…, 0)`
		// deferral resolves after. Both halves of upstream's claim survive: the
		// synchronous check still runs in the same task as the click.
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				value: iso('2026-03-21'),
				hasClear: true,
				onChange: () => {}
			}
		});
		const input = field();
		const focus = vi.spyOn(input, 'focus');

		await click(page.getByRole('button', { name: /Clear Ship date/ }).element());

		// Not synchronous — that is the whole point.
		expect(focus).not.toHaveBeenCalled();

		await nextTask();

		expect(focus).toHaveBeenCalledWith({ preventScroll: true });
		focus.mockRestore();
	});

	it('does not open the picker until the field is tapped', async () => {
		await render(DateInput, {
			props: { nativePicker: 'never', label: 'Ship date', onChange: () => {} }
		});
		expect(field()).toHaveAttribute('aria-expanded', 'false');
		expect(document.querySelector('[role="grid"]')).toBeNull();
		await openPicker();
		expect(field()).toHaveAttribute('aria-expanded', 'true');
		expect(document.querySelectorAll('[role="grid"]').length).toBeGreaterThan(0);
	});

	it('opens from the keyboard, APG combobox style', async () => {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		await keyDown(field(), 'ArrowDown');
		expect(field()).toHaveAttribute('aria-expanded', 'true');
	});

	it('is not openable while disabled', async () => {
		await render(DateInput, {
			props: { nativePicker: 'never', label: 'Ship date', isDisabled: true, onChange: () => {} }
		});
		expect(field()).toBeDisabled();
		await click(field());
		expect(document.querySelector('[role="grid"]')).toBeNull();
	});

	it('stays focusable and explains itself when disabled with a reason', async () => {
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				isDisabled: true,
				disabledMessage: 'You need the Editor role',
				onChange: () => {}
			}
		});
		// aria-disabled, not disabled: the reason has to be reachable by keyboard.
		// Upstream's `not.toBeDisabled()` becomes the native attribute, because
		// vitest-browser's `toBeDisabled` is Playwright's ARIA computation and
		// counts `aria-disabled="true"` as disabled — the two disagree by design
		// on exactly the attribute this case is about. Same substitution
		// `date-input.svelte.test.ts` makes for the same block.
		expect(field()).not.toHaveAttribute('disabled');
		expect(field()).toHaveAttribute('aria-disabled', 'true');
		await click(field());
		expect(document.querySelector('[role="grid"]')).toBeNull();
	});

	it('renders label, description and status through Field', async () => {
		const screen = await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				description: 'When it leaves the warehouse',
				status: { type: 'error', message: 'Pick a date' },
				onChange: () => {}
			}
		});
		await expect.element(screen.getByText('Ship date', exact)).toBeInTheDocument();
		await expect
			.element(screen.getByText('When it leaves the warehouse', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByText('Pick a date', exact)).toBeInTheDocument();
		expect(field()).toHaveAttribute('aria-invalid', 'true');
		expect(field().getAttribute('aria-describedby')).toBeTruthy();
	});

	it('marks required for assistive technology', async () => {
		await render(DateInput, {
			props: { nativePicker: 'never', label: 'Ship date', isRequired: true, onChange: () => {} }
		});
		expect(field()).toHaveAttribute('aria-required', 'true');
	});

	it('associates the label natively, so the field is named without ARIA', async () => {
		const screen = await render(DateInput, {
			props: { nativePicker: 'never', label: 'Ship date', onChange: () => {} }
		});
		// Upstream's `getByLabelText`. vitest-browser has no label-text query; the
		// claim is that the accessible name comes from the native association, so
		// the counterpart resolves the name and asserts it is the same element.
		expect(screen.getByRole('combobox', { name: 'Ship date', ...exact }).element()).toBe(field());
		expect(field()).not.toHaveAttribute('aria-label');
	});

	it('runs changeAction and shows a busy state', async () => {
		let resolve: () => void = () => {};
		const changeAction = vi.fn(
			async () =>
				new Promise<void>((r) => {
					resolve = r;
				})
		);
		await render(DateInput, {
			props: {
				nativePicker: 'never',
				label: 'Ship date',
				value: iso('2026-03-10'),
				min: iso('2026-03-01'),
				max: iso('2026-03-31'),
				onChange: () => {},
				changeAction
			}
		});
		await openPicker();
		await click(dayIn('March 2026', /March 25, 2026/));
		expect(changeAction).toHaveBeenCalledWith('2026-03-25');
		resolve();
	});

	it('drops the Field wrapper inside an InputGroup', async () => {
		await render(DateInputGroupProbe, {
			props: {
				group: { label: 'Range' },
				dateInput: { nativePicker: 'never', label: 'Start', onChange: () => {} },
				hasText: false
			}
		});
		// Named by the group label plus its own, the way core's inputs are.
		expect(field().getAttribute('aria-labelledby')).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// The picker surface
// ---------------------------------------------------------------------------

describe('DateInput — calendar surface', () => {
	/** Upstream's `renderAndOpen`, whose default is `<Controlled initial="2026-03-21" />`. */
	async function renderAndOpen(props: Record<string, unknown> = {}): Promise<void> {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21'), ...props } });
		await openPicker();
	}

	it('opens on the selected month', async () => {
		await renderAndOpen();
		expect(pane('March 2026')).toBeInTheDocument();
	});

	it('opens on the current month when there is no value', async () => {
		await renderAndOpen({ initial: undefined });
		expect(pane('March 2026')).toBeInTheDocument();
	});

	it('mounts a window of months around the visible one, not the whole century', async () => {
		// The one test that wants the full default reach.
		await renderAndOpen({ min: undefined, max: undefined });
		const grids = [...document.querySelectorAll('[role="grid"]')];
		expect(grids.length).toBeGreaterThan(1);
		expect(grids.length).toBeLessThanOrEqual(7);
		expect(grids.map((g) => g.getAttribute('aria-label'))).toContain('March 2026');
	});

	it('renders every month as six rows, so panes cannot differ in height', async () => {
		await renderAndOpen({ initial: iso('2026-02-01') });
		// February 2026 needs only five rows; the pane still has six.
		expect(allIn('February 2026', 'row')).toHaveLength(6);
		expect(allIn('February 2026', 'gridcell')).toHaveLength(42);
	});

	it('commits the tapped day and LEAVES the sheet open', async () => {
		const onChange = vi.fn();
		await renderAndOpen({ onChange });
		await click(dayIn('March 2026', /March 25, 2026/));
		// The tap is the commit. Staying open lets a mistake be corrected in
		// place, and a nearby date reconsidered, without reopening.
		expect(onChange).toHaveBeenCalledWith('2026-03-25');
		expect(field()).toHaveAttribute('aria-expanded', 'true');
	});

	it('lets a second tap correct the first, still without closing', async () => {
		const onChange = vi.fn();
		await renderAndOpen({ onChange });
		await click(dayIn('March 2026', /March 25, 2026/));
		await click(dayIn('March 2026', /March 26, 2026/));
		expect(onChange).toHaveBeenLastCalledWith('2026-03-26');
		expect(field()).toHaveAttribute('aria-expanded', 'true');
	});

	it('Save closes the sheet without touching the value', async () => {
		const onChange = vi.fn();
		await renderAndOpen({ onChange });
		await click(dayIn('March 2026', /March 25, 2026/));
		onChange.mockClear();
		await click(button('Save'));
		await vi.waitFor(() => expect(field()).toHaveAttribute('aria-expanded', 'false'));
		// Named for what it means to someone finishing a form, not for what it
		// does internally: the value was already committed by the tap that chose
		// it, so this fires nothing of its own.
		expect(onChange).not.toHaveBeenCalled();
		expect(field()).toHaveValue('March 25, 2026');
	});

	it('Save closes even with no date chosen, committing nothing', async () => {
		const onChange = vi.fn();
		await render(DateInput, {
			props: { nativePicker: 'never', label: 'Ship date', onChange }
		});
		await openPicker();
		await click(button('Save'));
		await vi.waitFor(() => expect(field()).toHaveAttribute('aria-expanded', 'false'));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('has Save in the footer and no Today button', async () => {
		await renderAndOpen();
		expect(button('Save')).toBeInTheDocument();
		// "Today" moved the calendar to the current month WITHOUT selecting it,
		// which read as broken — the one thing the name promises is the thing it
		// did not do. Removed until it can be navigate-or-select on purpose.
		expect(page.getByRole('button', { name: 'Today', ...exact }).elements()).toHaveLength(0);
	});

	it('marks the selection and today', async () => {
		await renderAndOpen();
		expect(dayIn('March 2026', /March 21, 2026/).closest('[role="gridcell"]')).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect(dayIn('March 2026', /March 15, 2026/)).toHaveAttribute('aria-current', 'date');
	});

	it('leaves exactly one day per month tab-reachable', async () => {
		await renderAndOpen();
		const tabbable = buttonsIn('March 2026').filter((b) => b.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
		// The selected day, when the month holds one.
		expect(tabbable[0]).toHaveAttribute('data-date', '2026-03-21');
	});

	it('pages a month with the header arrows', async () => {
		await renderAndOpen();
		expect(monthTitle()).toHaveTextContent('March 2026');
		await click(button('Next month'));
		await vi.waitFor(() => expect(monthTitle()).toHaveTextContent('April 2026'));
		await click(button('Previous month'));
		await vi.waitFor(() => expect(monthTitle()).toHaveTextContent('March 2026'));
	});

	/**
	 * A programmatic scroll must not report its own arrival as if the user had
	 * scrolled there. Nothing needs the report — whatever asked for the scroll
	 * already knows the month — and trusting it turns a steer into a cycle.
	 *
	 * The case that bit: a wheel commit steers this scroller while it is hidden
	 * behind the wheels, and a hidden scroller does not reliably stay put. On iOS
	 * the position is re-snapped when the panel becomes visible again, firing a
	 * scroll just as the wheels close and reports start being trusted again — so
	 * the month drifted on the way back to the calendar.
	 */
	it('does not report a scroll it was told to make', async () => {
		await renderAndOpen({ min: iso('2026-01-01'), max: iso('2026-12-31') });
		const scroller = monthScroller();
		// Upstream's SCROLLPORT_WIDTH constant stands in for a scrollport jsdom
		// never measures. Here the pane really is laid out, so the pane size is
		// read from the element rather than asserted to be 360.
		const pane1 = scroller.clientWidth;
		expect(pane1).toBeGreaterThan(0);

		// An arrow steers it to April. The scroll that lands there is our own
		// doing, so whatever it reports must not move the month again.
		await click(button('Next month'));
		await vi.waitFor(() => expect(monthTitle()).toHaveTextContent('April 2026'));
		// Row 3 of a range starting in January is April: the month the steer was
		// aiming at, arriving.
		await scrollTo(scroller, 3 * pane1);
		expect(monthTitle()).toHaveTextContent('April 2026');

		// A finger ends the steering: from here the months it passes are the
		// user's, and every one of them counts.
		touchAt(scroller, 'touchstart', 100, 100);
		await scrollTo(scroller, 5 * pane1);
		// The report is made from inside a rAF callback, so it lands a frame after
		// the scroll rather than in the same task.
		await vi.waitFor(() => expect(monthTitle()).toHaveTextContent('June 2026'));
	});

	/**
	 * An arrow with nowhere to go is hidden, not greyed. A disabled control still
	 * says "this is a thing you could do", and at the edge of a range it is not —
	 * there is no state the user can reach where it becomes available, so a
	 * permanently greyed chevron just reads as broken.
	 *
	 * It keeps its box, though: `visibility: hidden` rather than unmounting, so
	 * the remaining arrow does not slide sideways as an edge is reached.
	 */
	it('hides an arrow at the end of the reachable range', async () => {
		await renderAndOpen({
			initial: iso('2026-03-10'),
			min: iso('2026-03-01'),
			max: iso('2026-03-31')
		});
		// Queried by attribute, not by role: `visibility: hidden` is exactly what
		// strips an element of its accessible name, so a role query cannot see
		// these — which is the point of the assertion below.
		const arrow = (name: string) =>
			document.querySelector<HTMLElement>(`dialog[open] button[aria-label="${name}"]`);
		for (const name of ['Previous month', 'Next month']) {
			// Still mounted, so the header cannot reflow...
			expect(arrow(name)).toBeInTheDocument();
			expect(arrow(name)).toBeDisabled();
			// ...but gone from the accessibility tree, and so unreachable.
			expect(page.getByRole('button', { name, ...exact }).elements()).toHaveLength(0);
		}
	});

	it('shows both arrows when there is somewhere to go in each direction', async () => {
		await renderAndOpen({
			initial: iso('2026-03-10'),
			min: iso('2026-01-01'),
			max: iso('2026-12-31')
		});
		expect(button('Previous month')).toBeInTheDocument();
		expect(button('Next month')).toBeInTheDocument();
	});

	it('does not change the selection when paging', async () => {
		const onChange = vi.fn();
		await renderAndOpen({ onChange });
		await click(button('Next month'));
		// Navigating is not selecting — the mistake the old Today button made.
		expect(onChange).not.toHaveBeenCalled();
		expect(field()).toHaveValue('March 21, 2026');
	});

	it('disables days outside min/max and refuses to commit them', async () => {
		const onChange = vi.fn();
		await renderAndOpen({
			initial: iso('2026-03-10'),
			min: iso('2026-03-05'),
			max: iso('2026-03-20'),
			onChange
		});
		const outOfRange = dayIn('March 2026', /March 25, 2026/);
		expect(outOfRange).toHaveAttribute('aria-disabled', 'true');
		await click(outOfRange);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('honors custom date constraints', async () => {
		await renderAndOpen({
			initial: iso('2026-03-10'),
			dateConstraints: [(date: Date) => date.getDay() !== 0]
		});
		// 2026-03-01 is a Sunday.
		expect(dayIn('March 2026', /March 1, 2026/)).toHaveAttribute('aria-disabled', 'true');
	});

	/**
	 * Spill days, the way the desktop calendar has them.
	 *
	 * These were left out at first, on the theory that a horizontal scroller
	 * would show the same date twice — greyed at the foot of one pane and again
	 * at the head of the next. Measured, that cannot happen: both panes are
	 * exactly the scrollport wide and share one 7-column grid, so a given weekday
	 * column is only ever visible in ONE pane at a time, and a date always sits
	 * in its weekday's column. Swept across a full pane boundary in 10% steps —
	 * 42 dates on screen throughout, zero duplicated.
	 */
	it('renders adjacent-month days, muted, like the desktop calendar', async () => {
		await renderAndOpen();
		// Every cell in the 6x7 grid is now a real day.
		expect(allIn('March 2026', 'gridcell')).toHaveLength(42);
		expect(buttonsIn('March 2026')).toHaveLength(42);
		// March 2026 begins on a Sunday, so it spills only forwards.
		expect(dayIn('March 2026', /April 1, 2026/)).toBeInTheDocument();
	});

	it('spills backwards too, on a month that does not start the week', async () => {
		await renderAndOpen({
			initial: iso('2026-04-15'),
			min: iso('2026-01-01'),
			max: iso('2026-12-31')
		});
		// April 2026 starts on a Wednesday: the first row opens with late March.
		expect(dayIn('April 2026', /March 29, 2026/)).toBeInTheDocument();
		expect(buttonsIn('April 2026')).toHaveLength(42);
	});

	/**
	 * A spilled day is shown, not offered.
	 *
	 * It was pickable at first, on the reasoning that a date you can see is a
	 * date you should be able to tap. The desktop calendar disagrees — it makes
	 * its own outside days unselectable — and on a pane that IS the month, so
	 * does the interaction: committing April 1 from March's pane would move the
	 * calendar out from under the thumb that just tapped it. The swipe and the
	 * arrows say "next month" without that ambiguity.
	 */
	it('does not commit an adjacent-month day', async () => {
		const onChange = vi.fn();
		await renderAndOpen({ onChange });
		const april1 = dayIn('March 2026', /April 1, 2026/);
		expect(april1).toHaveAttribute('aria-disabled', 'true');
		await click(april1);
		expect(onChange).not.toHaveBeenCalled();
	});

	/**
	 * Being outside is enough on its own — a spill day inside the allowed range
	 * is still not a choice. Worth its own case because `isDateDisabled` says
	 * nothing about April 1 here, so only the outside test can be what disables
	 * it.
	 */
	it('disables a spilled day the range would otherwise allow', async () => {
		await renderAndOpen({ min: iso('2026-01-01'), max: iso('2026-12-31') });
		// In range, and in its own pane it is perfectly pickable.
		expect(dayIn('April 2026', /April 1, 2026/)).not.toHaveAttribute('aria-disabled');
		// Borrowed by March, it is not.
		expect(dayIn('March 2026', /April 1, 2026/)).toHaveAttribute('aria-disabled', 'true');
	});

	/**
	 * The selection and today's ring belong to the month that owns the date.
	 * Calendar guards both on `!isOutside`; without the same guard a date would
	 * wear its puck twice, once in its own pane and once in the neighbour that
	 * only borrows it.
	 */
	it('leaves the puck and the today ring with the month that owns the day', async () => {
		await renderAndOpen({
			initial: iso('2026-04-01'),
			min: iso('2026-01-01'),
			max: iso('2026-12-31')
		});
		const spilled = dayIn('March 2026', /April 1, 2026/);
		const owned = dayIn('April 2026', /April 1, 2026/);
		// Same date, same label — and only one of them is dressed as selected.
		expect(owned.className).not.toBe(spilled.className);
		expect(selectedCellsIn('April 2026')).toHaveLength(1);
		expect(selectedCellsIn('March 2026')).toHaveLength(0);
	});

	/**
	 * A date shown in two panes must not be two tab stops — the pane that owns
	 * it, and the neighbour that merely spills it. That holds because
	 * `tabbableISO` is resolved per pane and only names dates in that pane's own
	 * month, so it is worth pinning: the case below is the one that would break
	 * if it ever became global, since April 1 is both the selection and a spill
	 * day in March's pane.
	 */
	it('gives a spilled date no tab stop in the pane that borrows it', async () => {
		await renderAndOpen({
			initial: iso('2026-04-01'),
			min: iso('2026-01-01'),
			max: iso('2026-12-31')
		});
		const tabbableIn = (label: string) =>
			buttonsIn(label)
				.filter((b) => b.getAttribute('tabindex') === '0')
				.map((b) => b.getAttribute('aria-label'));

		// April owns the date, so its stop is the date itself.
		expect(tabbableIn('April 2026')).toHaveLength(1);
		expect(tabbableIn('April 2026')[0]).toMatch(/April 1, 2026/);
		// March shows the same date, but its stop falls back to a March date —
		// every pane keeps exactly one, and never on a day it does not own.
		expect(tabbableIn('March 2026')).toHaveLength(1);
		expect(tabbableIn('March 2026')[0]).toMatch(/March/);
	});

	/**
	 * Three letters, where Calendar's own header uses two.
	 *
	 * The sheet is full width — ~51px a column against Calendar's popover — so
	 * there is room for the form people actually read, and a picker driven by
	 * thumb should not make anyone decode "Tu" against "Th".
	 *
	 * Exact equality, not `toHaveTextContent`: that matches substrings, so it
	 * passes against "Sun" while asserting "Su" and would not have noticed this
	 * change at all.
	 */
	it('labels the columns with three-letter weekday names', async () => {
		await renderAndOpen();
		expect(weekdayNames()).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
	});

	it('rotates the weekday header with weekStartsOn', async () => {
		await renderAndOpen({ weekStartsOn: 1 });
		expect(weekdayNames()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
	});

	it('accepts weekStartsOn as a day name, like Calendar and DateInput', async () => {
		await renderAndOpen({ weekStartsOn: 'sat' });
		expect(weekdayNames()[0]).toBe('Sat');
		// The columns rotate with the header, or the grid would be mislabelled.
		expect(buttonsIn('March 2026')[0].getAttribute('aria-label')).toMatch(
			/February 28, 2026|March/
		);
	});

	it('moves keyboard focus by date, across the month boundary', async () => {
		await renderAndOpen({ initial: iso('2026-03-31') });
		const last = dayIn('March 2026', /March 31, 2026/);
		last.focus();
		await keyDown(last, 'ArrowRight');
		expect(document.activeElement).toHaveAttribute('data-date', '2026-04-01');
	});

	it('moves a week at a time with the vertical arrows', async () => {
		await renderAndOpen({ initial: iso('2026-03-10') });
		const day = dayIn('March 2026', /March 10, 2026/);
		day.focus();
		await keyDown(day, 'ArrowDown');
		expect(document.activeElement).toHaveAttribute('data-date', '2026-03-17');
	});
});
