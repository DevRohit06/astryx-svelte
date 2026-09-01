/** PORTS: DateInput/DateInputTouch.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import DateInput from '$lib/components/date-input/date-input.svelte';
import type { ISODateString } from '$lib/utils/date-types.js';
import { SCROLL_QUIET_MS } from '$lib/components/date-input/use-scroll-settle.svelte.js';
import { SWIPE_DISTANCE } from '$lib/components/date-input/use-own-scroll-gesture.svelte.js';
import { DRAG_SLOP } from '$lib/components/date-input/use-pointer-drag-scroll.svelte.js';
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

/**
 * Render, then open the picker and let the calendar arrive.
 *
 * Upstream's `renderAndOpen` is a click and nothing else, because in jsdom the
 * scroller never scrolls: the pane it mounts first is the pane it shows. Here
 * the initial month is reached by a real scroll, and the header reports the
 * month under the scrollport — so reading it too early gives whichever pane the
 * overscan mounted first, which is up to three months early. Three cases caught
 * it by opening on August and reading May.
 *
 * The wait is for the header to stop changing across a frame, which is "the
 * calendar has finished arriving" rather than a guess at how long that takes. A
 * header that is stable and *wrong* still fails, which is the property that
 * matters.
 */
async function openPicker(): Promise<void> {
	await click(field());
	await settleMonthPanes();
	let previous = '';
	await vi.waitFor(async () => {
		const before = monthTitle().textContent ?? '';
		await frame();
		const after = monthTitle().textContent ?? '';
		if (before !== after || after !== previous) {
			previous = after;
			throw new Error(`calendar still arriving: ${before} -> ${after}`);
		}
	});
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

/**
 * Wait out the calendar/wheels cross-fade. Both panels stay mounted and swap on
 * `visibility` and `opacity`, so whichever one is arriving is not yet visible to
 * a role query when the click returns.
 */
async function settleSwap(): Promise<void> {
	await vi.waitFor(() => {
		const arriving = document.querySelector('[data-panel]:not([inert])');
		if (!(arriving instanceof HTMLElement)) {
			throw new Error('no active panel');
		}
		const { visibility, opacity } = getComputedStyle(arriving);
		if (visibility !== 'visible' || Number(opacity) < 1) {
			throw new Error(`panel still arriving: ${visibility} ${opacity}`);
		}
	});
	await tick();
}

/**
 * Throw unless a wheel's scroll position agrees with the row it says is
 * selected. `Wheel`'s own park effect compares exactly this, so it is the
 * predicate for "the wheel has finished travelling" rather than a proxy for it.
 */
function expectParked(listbox: HTMLElement): void {
	const options = [...listbox.querySelectorAll('[role="option"]')];
	const selected = options.findIndex((o) => o.getAttribute('aria-selected') === 'true');
	const rowHeight = (options[0] as HTMLElement | undefined)?.offsetHeight ?? 0;
	if (selected < 0 || rowHeight === 0) {
		throw new Error('wheel not laid out yet');
	}
	const at = Math.round(listbox.scrollTop / rowHeight);
	if (at !== selected) {
		throw new Error(`wheel parked on row ${at}, selects row ${selected}`);
	}
}

/** Long enough that a scroll settle has certainly run. */
async function pastQuietPeriod(multiplier = 2): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, SCROLL_QUIET_MS * multiplier));
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

// ---------------------------------------------------------------------------
// Resting between two months — the iOS snap failure
// ---------------------------------------------------------------------------

/**
 * `scroll-snap-type: mandatory` is supposed to make all of this unnecessary, and
 * on a static list it does. This list is virtualized: seven panes exist out of
 * twelve hundred, and THE PANES ARE THE SNAP AREAS — so every month the finger
 * crosses mounts one and unmounts another, mid-fling.
 *
 * iOS scrolls off the main thread. It picks a landing place from the snap points
 * it knows about at the time, and a re-render that lands after that decision
 * moves them; the scroller comes to rest where no snap point exists any more and
 * nothing re-snaps it. Reported from a device as the calendar sitting between
 * two months with the weekday header still square — which is exactly the shape
 * of it: the grid is not skewed, the scrollport is parked a couple of columns
 * into a pane, so the left of March and the right of April are on screen under
 * one Sun-to-Sat header.
 *
 * **Chrome never shows it, because it snaps again after the mutation — and
 * Chrome is what this project runs.** That sentence is upstream's, and it is
 * also the whole difficulty of porting this block. Upstream tests the correction
 * in jsdom precisely because jsdom implements no snapping: the scroller can be
 * PUT at a bad offset and left there. Chromium will not leave it there. It
 * re-snaps, so by the time the settle's rAF reads the offset a second time it
 * has moved, the "still travelling" guard returns, and the correction never runs
 * — which is not a failure of the correction but the browser pre-empting it.
 *
 * Ported verbatim, three cases failed with `scrollTo` never called and **three
 * passed vacuously**: every negative case asserts `scrollTo` was *not* called,
 * which a scroller that never reaches the correction satisfies for the wrong
 * reason. So the counterpart of "run it where nothing snaps" is to turn snapping
 * off for the case — `scroll-snap-type: none` on the scroller, set after the
 * calendar opens. That reproduces the iOS condition rather than removing it, and
 * it is what makes the three negatives assert anything at all.
 *
 * `Element.prototype.scrollTo` is a real method here, so the spy stands in for
 * upstream's `beforeAll` mock and is restored per case rather than for the file.
 */
describe('DateInput — a rest position between two months', () => {
	/** The row March 2026 occupies in a range that opens in January 2024. */
	const MARCH_2026_ROW = 26;
	const FIVE_YEARS = { min: iso('2024-01-01'), max: iso('2028-12-31') };

	/** Drag, release, and let the quiet period elapse. */
	async function swipeTo(scroller: HTMLElement, offset: number): Promise<void> {
		touchAt(scroller, 'touchstart', 100, 100);
		scroller.scrollLeft = offset;
		scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
		touchAt(scroller, 'touchend', 100, 100);
	}

	async function openCalendar(): Promise<{
		scroller: HTMLElement;
		pane: number;
		scrollTo: ReturnType<typeof vi.spyOn>;
	}> {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21'), ...FIVE_YEARS } });
		await openPicker();
		const scroller = monthScroller();
		const pane = scroller.clientWidth;
		expect(pane).toBeGreaterThan(0);
		// The device condition, recreated: see the block comment. Without this
		// Chromium re-snaps every offset these cases set, and the correction under
		// test is never reached — including by the cases asserting it does not run.
		scroller.style.scrollSnapType = 'none';
		// Upstream's `vi.mocked(Element.prototype.scrollTo)` from its `beforeAll`.
		// Spied *after* opening, so the scroll that centres the initial month is
		// not counted — which is what upstream's `mockClear()` achieves.
		const scrollTo = vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(() => {});
		return { scroller, pane, scrollTo };
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('puts the calendar back on a pane once the swipe is over', async () => {
		const { scroller, pane, scrollTo } = await openCalendar();
		// Two columns in — what the device screenshot showed.
		const stray = Math.round((pane * 2) / 7);
		await swipeTo(scroller, MARCH_2026_ROW * pane + stray);

		await vi.waitFor(() =>
			expect(scrollTo).toHaveBeenCalledWith(
				expect.objectContaining({ left: MARCH_2026_ROW * pane })
			)
		);
	});

	it('goes to the nearer pane, not back the way it came', async () => {
		const { scroller, pane, scrollTo } = await openCalendar();
		// Three quarters of the way to April: April is the honest answer, and a
		// correction that always rounded down would drag the user backwards.
		await swipeTo(scroller, MARCH_2026_ROW * pane + pane * 0.75);

		await vi.waitFor(() =>
			expect(scrollTo).toHaveBeenCalledWith(
				expect.objectContaining({ left: (MARCH_2026_ROW + 1) * pane })
			)
		);
	});

	/**
	 * A scroller the browser snapped for itself must be left alone. Correcting it
	 * anyway would mean every swipe on Chrome — where snapping works — ended with
	 * a second, pointless scroll.
	 */
	it('leaves a scroller that snapped properly alone', async () => {
		const { scroller, pane, scrollTo } = await openCalendar();
		await swipeTo(scroller, (MARCH_2026_ROW + 2) * pane);

		await pastQuietPeriod();
		expect(scrollTo).not.toHaveBeenCalled();
	});

	/**
	 * Sub-pixel drift is the browser's own rounding on a fractional viewport, not
	 * a failed snap. Correcting it would fire a scroll after every gesture on any
	 * device whose width is not a whole number of pixels.
	 */
	it('ignores sub-pixel drift', async () => {
		const { scroller, pane, scrollTo } = await openCalendar();
		await swipeTo(scroller, MARCH_2026_ROW * pane + 0.4);

		await pastQuietPeriod();
		expect(scrollTo).not.toHaveBeenCalled();
	});

	/**
	 * The correction waits for the finger. Firing it mid-drag would fight the
	 * hand that is still moving the scroller — the same mistake that made the
	 * wheels climb a month at a time on iOS, and the reason `useScrollSettle`
	 * waits for a release rather than for quiet alone.
	 */
	it('does not correct while the finger is still down', async () => {
		const { scroller, pane, scrollTo } = await openCalendar();
		touchAt(scroller, 'touchstart', 100, 100);
		scroller.scrollLeft = MARCH_2026_ROW * pane + 120;
		scroller.dispatchEvent(new Event('scroll', { bubbles: true }));

		await pastQuietPeriod();
		expect(scrollTo).not.toHaveBeenCalled();

		// And on release it does the correction it was holding back.
		touchAt(scroller, 'touchend', 100, 100);
		await vi.waitFor(() => expect(scrollTo).toHaveBeenCalled());
	});

	/**
	 * The one that actually reverses a swipe, and the reason the correction
	 * re-checks stillness rather than trusting the quiet period.
	 *
	 * iOS runs its own snap animation for ~150-300ms after the finger lifts, and
	 * fires scroll events irregularly while it does — a gap longer than the quiet
	 * period is routine in the slow tail. The settle lands mid-animation, reads an
	 * offset still travelling toward April, rounds THAT to the nearest pane (still
	 * March, since the animation is not yet halfway), and drags the calendar back
	 * where it came from. Swipe forward, get pulled backward.
	 *
	 * Simulated by moving the scroller between the two samples, which is what an
	 * animation in flight looks like from here.
	 */
	it('does not correct a scroller that is still travelling', async () => {
		const { scroller, pane, scrollTo } = await openCalendar();
		// A quarter of the way to April, and still going.
		let offset = MARCH_2026_ROW * pane + pane * 0.25;
		Object.defineProperty(scroller, 'scrollLeft', {
			configurable: true,
			get: () => {
				// Every read advances it, the way an in-flight animation does.
				offset += 8;
				return offset;
			},
			set: (value: number) => {
				offset = value;
			}
		});

		await swipeTo(scroller, offset);
		await pastQuietPeriod(3);
		// Nothing. Correcting here would have sent it back to March, undoing a
		// swipe the browser was already completing.
		expect(scrollTo).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Month / year wheels
// ---------------------------------------------------------------------------

describe('DateInput — month/year wheels', () => {
	/**
	 * The header title. Queried by attribute rather than by role and accessible
	 * name: every role query in here walks a tree of ~150 elements and computes a
	 * name for each, which dominates the runtime of these tests.
	 */
	const title = () => monthTitle();

	/**
	 * Click the title, then let the cross-fade finish.
	 *
	 * Upstream needs no wait: jsdom runs no transitions, so the panel it just
	 * un-inerted is readable in the same task. The panels here really do fade —
	 * `visibility` and `opacity` on a duration the CSS block asserts — and
	 * Playwright's role queries ignore an element that is not yet visible, so a
	 * verbatim port cannot find the listbox it just opened. Same class of
	 * mistake as reading a computed style straight after mount (batch 042): the
	 * value on offer is the entry state, not the resting one.
	 */
	async function openWheels(): Promise<void> {
		// The year the header shows before the wheels open is the year they must
		// land on. Captured first because what follows asserts it does not move: a
		// wheel still travelling to its initial row reports whichever row is under
		// the band, and committing a month against that reads the wrong year.
		const year = (title().textContent ?? '').trim().split(/\s+/).pop();
		await click(title());
		await settleSwap();
		// Upstream needs no wait — jsdom lays out nothing and scrolls nothing, so
		// its wheels sit on the row the props named from the first render. These
		// are real scroll-snapped lists that travel to that row, and each has a
		// settle that commits whatever is under the band when the scrolling
		// stops. Tapping one mid-travel commits against a row it is only passing,
		// and the five-year cases then read January 2025.
		//
		// The wait is for the wheels to be **parked**: scroll position agreeing
		// with the selected row, which is the same predicate the component's own
		// park effect uses. Two weaker waits were tried and are recorded because
		// both look right. `aria-selected` is driven by the committed value, not
		// by the scroll position, so it reads correct throughout the travel that
		// has not committed yet. A fixed quiet-period sleep passes in isolation
		// and fails in a full-file run — the failure is load-sensitive, so any
		// wait measured in milliseconds rather than in the state it is waiting
		// for is a flake with a threshold.
		await vi.waitFor(() => {
			for (const name of ['Month', 'Year'] as const) {
				expectParked(wheel(name));
			}
		});
		expect(title().textContent).toContain(year);
	}

	/** The swap panel holding the calendar, or the one holding the wheels. */
	function panel(which: 'calendar' | 'wheels'): HTMLElement {
		const element = document.querySelector(`[data-panel="${which}"]`);
		if (!(element instanceof HTMLElement)) {
			throw new Error(`no ${which} panel`);
		}
		return element;
	}

	function wheel(name: 'Month' | 'Year'): HTMLElement {
		return page.getByRole('listbox', { name, ...exact }).element() as HTMLElement;
	}

	/** Upstream's `within(wheel).getByText(label)`, whole-string as RTL's is. */
	function wheelRow(name: 'Month' | 'Year', label: string): HTMLElement {
		const row = [...wheel(name).querySelectorAll('[role="option"]')].find(
			(option) => option.textContent?.trim() === label
		);
		if (!(row instanceof HTMLElement)) {
			throw new Error(`no ${label} row in the ${name} wheel`);
		}
		return row;
	}

	const ONE_YEAR = { min: iso('2026-01-01'), max: iso('2026-12-31') };
	const FIVE_YEARS = { min: iso('2024-01-01'), max: iso('2028-12-31') };

	async function renderAndOpen(props: Record<string, unknown> = {}): Promise<void> {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21'), ...props } });
		await openPicker();
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('the header title opens them, and says so', async () => {
		await renderAndOpen();
		expect(title()).toHaveAttribute('aria-expanded', 'false');
		expect(panel('wheels')).toHaveAttribute('inert');
		expect(panel('calendar')).not.toHaveAttribute('inert');
		await openWheels();
		expect(title()).toHaveAttribute('aria-expanded', 'true');
		expect(panel('wheels')).not.toHaveAttribute('inert');
		expect(panel('calendar')).toHaveAttribute('inert');
		expect(wheel('Month')).toBeInTheDocument();
		expect(wheel('Year')).toBeInTheDocument();
	});

	/**
	 * The arrows step the calendar, and the calendar is not on screen. They keep
	 * their layout box rather than unmounting: they are the tallest thing in the
	 * header on a coarse pointer (44px against the title's 36), so dropping them
	 * would shorten it and shift the sheet mid-cross-fade.
	 */
	it('hides the month arrows while the wheels are up', async () => {
		await renderAndOpen();
		const arrows = document.querySelector('[data-arrows="months"]') as HTMLElement;
		expect(arrows).not.toHaveAttribute('inert');

		await openWheels();
		expect(arrows).toHaveAttribute('inert');
		// Still in the layout, so the header cannot change height.
		expect(arrows).toBeInTheDocument();

		await click(title());
		await settleSwap();
		expect(arrows).not.toHaveAttribute('inert');
	});

	it('offers twelve months, with the current one selected', async () => {
		await renderAndOpen();
		await openWheels();
		const options = [...wheel('Month').querySelectorAll('[role="option"]')];
		expect(options).toHaveLength(12);
		expect(options[2]).toHaveTextContent('March');
		expect(options[2]).toHaveAttribute('aria-selected', 'true');
	});

	it('tapping a wheel row moves the calendar to that month', async () => {
		await renderAndOpen(ONE_YEAR);
		await openWheels();
		await click(wheelRow('Month', 'September'));
		await vi.waitFor(() => expect(title()).toHaveTextContent('September 2026'));
	});

	it('the year wheel keeps the month', async () => {
		await renderAndOpen(FIVE_YEARS);
		await openWheels();
		await click(wheelRow('Year', '2025'));
		await vi.waitFor(() => expect(title()).toHaveTextContent('March 2025'));
	});

	it('Reset empties the field and brings the calendar home', async () => {
		const onChange = vi.fn();
		// Today is 15 March 2026 in these tests; open on a month away from it.
		await renderAndOpen({
			initial: iso('2026-08-21'),
			onChange,
			min: iso('2026-01-01'),
			max: iso('2026-12-31')
		});
		expect(title()).toHaveTextContent('August 2026');

		await click(button('Reset'));
		expect(onChange).toHaveBeenCalledWith(undefined);
		expect(field()).toHaveValue('');
		// Clearing the date and leaving the calendar on the month of the date you
		// just cleared is a half-finished action.
		await vi.waitFor(() => expect(title()).toHaveTextContent('March 2026'));
		// And it does not dismiss — the sheet is still there to pick again.
		expect(field()).toHaveAttribute('aria-expanded', 'true');
	});

	it('clears without moving when the current month is out of range', async () => {
		const onChange = vi.fn();
		await renderAndOpen({
			initial: iso('2027-05-10'),
			onChange,
			min: iso('2027-01-01'),
			max: iso('2027-12-31')
		});
		expect(title()).toHaveTextContent('May 2027');

		await click(button('Reset'));
		expect(onChange).toHaveBeenCalledWith(undefined);
		expect(field()).toHaveValue('');
		expect(title()).toHaveTextContent('May 2027');
	});

	/**
	 * The wheels are a detour to reach a far month, not a mode. Reopening into
	 * them would answer a question the user has not asked yet, and hide the dates
	 * they came back for behind another tap.
	 */
	/**
	 * A wheel commit steers the hidden calendar, and the calendar reports the
	 * month it lands on. Taking that report back while the wheels are open closes
	 * a cycle: commit -> echo -> the echo moves the wheel selected row -> the
	 * wheel is repositioned -> that scroll reads as another commit.
	 *
	 * Whether it converges comes down to how precisely a browser says "scrolling
	 * stopped". Chrome has scrollend and settles at once; iOS below Safari 26 has
	 * none, and its momentum runs on after the finger lifts, so each lap committed
	 * the next month along and the month climbed on its own.
	 */
	it('ignores the calendar echo while the wheels are steering it', async () => {
		await renderAndOpen(FIVE_YEARS);
		await openWheels();
		await click(wheelRow('Month', 'January'));
		await vi.waitFor(() => expect(title()).toHaveTextContent('January 2026'));

		// The calendar, scrolling to January behind the wheels, reports each month
		// it passes. None of it may move the month the wheels just set.
		const scroller = monthScroller();
		scroller.style.scrollSnapType = 'none';
		const pane = scroller.clientWidth;
		for (const row of [5, 6, 7, 8]) {
			await scrollTo(scroller, row * pane);
		}
		expect(title()).toHaveTextContent('January 2026');
	});

	/**
	 * The reveal case, reported from a device. A wheel commit steers the calendar
	 * while it is hidden, and visibility: hidden keeps the layout box but does not
	 * guarantee the scroll position survives: iOS re-snaps on reveal, firing a
	 * scroll exactly as the wheels close and reports start being trusted again.
	 */
	it('holds the month when the hidden calendar is re-snapped on reveal', async () => {
		await renderAndOpen(FIVE_YEARS);
		await openWheels();
		await click(wheelRow('Month', 'January'));
		await vi.waitFor(() => expect(title()).toHaveTextContent('January 2026'));

		// iOS moves the hidden scroller off the pane it was steered to.
		const scroller = monthScroller();
		scroller.style.scrollSnapType = 'none';
		const pane = scroller.clientWidth;
		scroller.scrollLeft += 4 * pane;

		// Back to the dates. The stray position must not become the month, and the
		// calendar must be put back on the pane the month names.
		const scrollToSpy = vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(() => {});
		await click(title());
		await settleSwap();
		scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
		await frame();
		await frame();
		expect(title()).toHaveTextContent('January 2026');

		// January 2026 is row 24 of a range that starts in January 2024.
		await vi.waitFor(() =>
			expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ left: 24 * pane }))
		);
	});

	it('always reopens on the calendar, whatever was showing last time', async () => {
		await renderAndOpen();
		await openWheels();
		expect(title()).toHaveAttribute('aria-expanded', 'true');

		// Dismissed from the wheels, where Done is deliberately not offered — the
		// handle, the scrim and Escape are the ways out.
		await keyDown(document.querySelector('dialog[open]')!, 'Escape');
		await vi.waitFor(() => expect(field()).toHaveAttribute('aria-expanded', 'false'));

		await openPicker();
		expect(title()).toHaveAttribute('aria-expanded', 'false');
		expect(panel('calendar')).not.toHaveAttribute('inert');
		expect(panel('wheels')).toHaveAttribute('inert');
	});

	it('is a single tab stop driven by the arrow keys', async () => {
		await renderAndOpen();
		await openWheels();
		const months = wheel('Month');
		expect(months).toHaveAttribute('tabindex', '0');
		await keyDown(months, 'ArrowDown');
		await vi.waitFor(() => expect(title()).toHaveTextContent('April 2026'));
		await keyDown(months, 'ArrowUp');
		await vi.waitFor(() => expect(title()).toHaveTextContent('March 2026'));
	});

	it('will not commit a row outside min/max', async () => {
		await renderAndOpen({ initial: iso('2026-03-10') });
		await openWheels();
		const december = wheelRow('Month', 'December');
		expect(december).toHaveAttribute('aria-disabled', 'true');
		await click(december);
		expect(title()).toHaveTextContent('March 2026');
	});

	it('bounds the year wheel to the reachable range', async () => {
		await renderAndOpen({
			initial: iso('2026-03-10'),
			min: iso('2025-01-01'),
			max: iso('2027-12-31')
		});
		await openWheels();
		expect(
			[...wheel('Year').querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim())
		).toEqual(['2025', '2026', '2027']);
	});

	it('the title is what closes them again', async () => {
		await renderAndOpen();
		await openWheels();
		expect(title()).toHaveAttribute('aria-expanded', 'true');
		await click(title());
		await settleSwap();
		expect(title()).toHaveAttribute('aria-expanded', 'false');
		expect(panel('wheels')).toHaveAttribute('inert');
	});

	it('offers Reset only on the calendar, in the header corner', async () => {
		await renderAndOpen();
		const reset = button('Reset');
		// The trailing-most thing in the header, past the arrows — not the footer,
		// which is Save's alone.
		const header = reset.closest('[data-action="reset"]')!.parentElement!;
		expect(header.querySelector('[data-title="month-year"]')).not.toBeNull();
		expect(header.lastElementChild).toHaveAttribute('data-action', 'reset');

		await openWheels();
		// The wheels choose a month; there is no date there to clear.
		expect(page.getByRole('button', { name: 'Reset', ...exact }).elements()).toHaveLength(0);
		// Hidden, not unmounted, so the header cannot change height mid-swap.
		expect(document.querySelector('dialog[open] [data-action="reset"]')).toHaveAttribute('inert');
	});

	it('Save closes the whole picker; Done only leaves the wheels', async () => {
		// Two finishes, deliberately different: Save ends the task, Done ends a
		// step. They never appear together — each belongs to the surface it is
		// shown on — so neither has to carry two meanings by position.
		await renderAndOpen();
		await openWheels();
		await click(button('Done'));
		await settleSwap();
		// Back on the calendar, still open.
		expect(field()).toHaveAttribute('aria-expanded', 'true');
		expect(title()).toHaveAttribute('aria-expanded', 'false');

		await click(button('Save'));
		await vi.waitFor(() => expect(field()).toHaveAttribute('aria-expanded', 'false'));
	});

	/**
	 * `inert` disables everything INSIDE it, so an inert ancestor is enough to
	 * kill a button that looks perfectly fine on its own.
	 *
	 * This is not hypothetical. The footer kept an `inert` from an earlier version
	 * where it was hidden wholesale on the wheels; once the wheels grew their own
	 * Done button inside that same footer, the button rendered, looked right,
	 * passed every attribute assertion — and did nothing when tapped.
	 *
	 * Nothing above caught it: upstream notes `inert` has no behavioural effect in
	 * jsdom, so role queries still found the button and the cell's own attribute
	 * was correct. The only honest check is to walk the ancestors, which is what
	 * this does — and it is worth keeping here even though Chromium implements
	 * `inert` for real, because the walk is the assertion rather than a stand-in
	 * for one.
	 */
	it('leaves no inert ancestor over whichever action is showing', async () => {
		const inertAncestorsOf = (label: string) => {
			const el = [...document.querySelectorAll('dialog[open] button')].find(
				(b) => b.textContent?.trim() === label
			)!;
			const blocking: string[] = [];
			// Start above the button's own cell, which is legitimately inert for the
			// action that is currently hidden.
			let node = el.parentElement?.parentElement ?? null;
			while (node != null && node.tagName !== 'BODY') {
				if (node.hasAttribute('inert')) {
					blocking.push(node.tagName.toLowerCase());
				}
				node = node.parentElement;
			}
			return blocking;
		};

		await renderAndOpen();
		expect(inertAncestorsOf('Save')).toEqual([]);
		expect(inertAncestorsOf('Reset')).toEqual([]);

		await openWheels();
		expect(inertAncestorsOf('Done')).toEqual([]);
	});

	it('shows exactly one footer action, and only the visible one is reachable', async () => {
		await renderAndOpen();
		// Queried off the DOM rather than by role: every role-with-name query walks
		// this tree computing accessible names, and there are ~150 elements in it.
		// Same reason the title helper above does it this way.
		const footerButton = (label: string) =>
			[...document.querySelectorAll('dialog[open] button')].find(
				(el) => el.textContent?.trim() === label
			);
		// Which ANCESTOR carries `inert`, not which parent — the wheels' action
		// sits inside a fading wrapper, and asserting on `parentElement` would pass
		// or fail on that nesting rather than on reachability.
		const isBlocked = (label: string) => footerButton(label)?.closest('[inert]') != null;

		expect(isBlocked('Save')).toBe(false);
		expect(isBlocked('Done')).toBe(true);
		expect(page.getByRole('button', { name: 'Done', ...exact }).elements()).toHaveLength(0);

		await openWheels();
		expect(isBlocked('Save')).toBe(true);
		expect(isBlocked('Done')).toBe(false);
		expect(page.getByRole('button', { name: 'Save', ...exact }).elements()).toHaveLength(0);

		// Both stay mounted throughout, which is what keeps the row's height fixed
		// across the swap.
		expect(footerButton('Save')).toBeInTheDocument();
		expect(footerButton('Done')).toBeInTheDocument();
	});

	/**
	 * **Upstream repeats five cases verbatim** and they are ported once.
	 *
	 * 'the year wheel keeps the month', `is a single tab stop driven by the arrow
	 * keys`, `will not commit a row outside min/max`, `bounds the year wheel to
	 * the reachable range` and `the title is what closes them again` each appear
	 * twice in `DateInputTouch.test.tsx` — once at the head of this block and
	 * again at its foot, identical in body. A second copy asserts nothing the
	 * first does not, so it is recorded in `port/debts.md` as an upstream defect
	 * rather than replicated, which is this repo's rule for upstream bugs. It is
	 * also why the case delta for this suite cannot reach zero.
	 */
});

// ---------------------------------------------------------------------------
// Nested scrollers keep their own touch gesture
// ---------------------------------------------------------------------------

describe('DateInput — nested scrollers keep their own touch gesture', () => {
	/**
	 * Stand-in for `BottomSheet`'s swipe-to-dismiss listener: a NATIVE listener on
	 * an ancestor, in the bubble phase, which is exactly how the sheet attaches
	 * its own. If an event reaches this, the sheet would have read it as a drag.
	 */
	function watchAncestor(): { seen: string[]; stop: () => void } {
		const seen: string[] = [];
		const listener = (event: Event) => seen.push(event.type);
		for (const type of ['touchstart', 'touchmove', 'touchend']) {
			document.body.addEventListener(type, listener);
		}
		return {
			seen,
			stop: () => {
				for (const type of ['touchstart', 'touchmove', 'touchend']) {
					document.body.removeEventListener(type, listener);
				}
			}
		};
	}

	/**
	 * A real `TouchEvent`. Upstream builds a stand-in and explains at length that
	 * jsdom has no constructible one, and that a bare `Event` carrying no
	 * `changedTouches` crashes any handler reading it — including BottomSheet's.
	 * Chromium constructs the real thing, so the explanation and the hazard both
	 * go away.
	 */
	function touch(el: Element, type: string, at = { x: 100, y: 200 }): boolean {
		const point = new Touch({ identifier: 1, target: el, clientX: at.x, clientY: at.y });
		const empty = type === 'touchend';
		return el.dispatchEvent(
			new TouchEvent(type, {
				bubbles: true,
				cancelable: type !== 'touchend',
				touches: empty ? [] : [point],
				targetTouches: empty ? [] : [point],
				changedTouches: [point]
			})
		);
	}

	/**
	 * A whole gesture: down at the origin, drag by (dx, dy), lift. Returns the
	 * scroller's stubbed `scrollBy`, which is how the paging fallback shows up.
	 *
	 * The `scrollLeft`/`scrollBy` shadows are upstream's and are kept: upstream
	 * needs them because jsdom never scrolls, and they are needed here for the
	 * opposite reason — a real scroller *would* move, and `scrollsBy` has to be
	 * the only thing that moves it if the case is to distinguish "the compositor
	 * panned" from "it did not". Instance-only and deleted after, as upstream
	 * notes, because a prototype getter makes every later DOM read take a slow
	 * path.
	 */
	function swipe(
		el: Element,
		dx: number,
		dy: number,
		{ scrollsBy = 0 }: { scrollsBy?: number } = {}
	): ReturnType<typeof vi.fn> {
		let offset = 0;
		const scrollBy = vi.fn();
		Object.defineProperties(el, {
			scrollLeft: {
				configurable: true,
				get: () => offset,
				set: (value: number) => {
					offset = value;
				}
			},
			scrollBy: { configurable: true, value: scrollBy }
		});
		const origin = { x: 150, y: 200 };
		touch(el, 'touchstart', origin);
		for (const step of [0.5, 1]) {
			if (step === 0.5) {
				offset += scrollsBy;
			}
			touch(el, 'touchmove', { x: origin.x + dx * step, y: origin.y + dy * step });
		}
		touch(el, 'touchend');
		// @ts-expect-error - removing the shadows restores the prototype's
		delete el.scrollLeft;
		// @ts-expect-error - same
		delete el.scrollBy;
		return scrollBy;
	}

	async function renderAndOpen(props: Record<string, unknown> = {}): Promise<void> {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21'), ...props } });
		await openPicker();
	}

	it('lets a touch on the calendar reach the sheet, now that it pages sideways', async () => {
		await renderAndOpen();
		const scroller = monthScroller();
		const ancestor = watchAncestor();
		touch(scroller, 'touchstart');
		touch(scroller, 'touchmove');
		// The calendar used to claim the gesture, because it scrolled vertically
		// and the sheet read every downward drag as a dismiss. Paging sideways
		// removes the conflict: horizontal pans stay here and vertical ones go to
		// the sheet, so a downward drag can go back to meaning swipe-to-dismiss. A
		// move with no direction yet (the same point twice) is nobody's.
		expect(ancestor.seen).toEqual(['touchstart', 'touchmove']);
		ancestor.stop();
	});

	it('claims a horizontal drag on the calendar', async () => {
		await renderAndOpen();
		const ancestor = watchAncestor();
		swipe(monthScroller(), -80, 0);
		// touchstart still propagates — 'inline' cannot know the direction yet —
		// but every move after the axis locks is ours.
		expect(ancestor.seen).not.toContain('touchmove');
		ancestor.stop();
	});

	it('leaves a downward drag on the calendar to the sheet', async () => {
		await renderAndOpen();
		const ancestor = watchAncestor();
		swipe(monthScroller(), 0, 80);
		expect(ancestor.seen).toContain('touchmove');
		ancestor.stop();
	});

	it('keeps a diagonal drag, because a thumb arcs as it swipes', async () => {
		await renderAndOpen();
		const ancestor = watchAncestor();
		// ~50° off horizontal: past the browser's own pan-x cone, still ours.
		swipe(monthScroller(), -60, 72);
		expect(ancestor.seen).not.toContain('touchmove');
		ancestor.stop();
	});

	/**
	 * The band between our claim and the browser's `pan-x` cone. The sheet has
	 * been told to keep off, and the compositor refuses to pan, so without the
	 * fallback these gestures would do nothing at all — measured as a dead zone
	 * from 45° to 60° on an iPhone 15 profile.
	 */
	it('pages a month itself when the browser refuses to pan a claimed swipe', async () => {
		await renderAndOpen();
		const scroller = monthScroller();

		const forward = swipe(scroller, -60, 72);
		expect(forward).toHaveBeenCalledTimes(1);
		expect(forward.mock.calls[0][0]).toMatchObject({ behavior: 'smooth' });
		// Swiping left advances: the offset moves towards the end of the line.
		expect(forward.mock.calls[0][0].left).toBeGreaterThan(0);

		const back = swipe(scroller, 60, 72);
		expect(back.mock.calls[0][0].left).toBeLessThan(0);
	});

	it('stays out of the way when the browser did pan', async () => {
		await renderAndOpen();
		// Native momentum and snapping own this one; a second nudge would fight
		// them. `scrollsBy` stands in for the compositor moving the scroller.
		expect(swipe(monthScroller(), -120, 0, { scrollsBy: 40 })).not.toHaveBeenCalled();
	});

	it('ignores a claimed gesture too short to be a swipe', async () => {
		await renderAndOpen();
		expect(swipe(monthScroller(), -SWIPE_DISTANCE + 4, 0)).not.toHaveBeenCalled();
	});

	it('never pages from a drag it gave to the sheet', async () => {
		await renderAndOpen();
		expect(swipe(monthScroller(), -40, 200)).not.toHaveBeenCalled();
	});

	it('stops a touch on a wheel from reaching the sheet', async () => {
		await renderAndOpen();
		await click(monthTitle());
		await settleSwap();
		const monthWheel = page.getByRole('listbox', { name: 'Month', ...exact }).element();
		const ancestor = watchAncestor();
		touch(monthWheel, 'touchstart');
		touch(monthWheel, 'touchmove');
		expect(ancestor.seen).not.toContain('touchstart');
		expect(ancestor.seen).not.toContain('touchmove');
		ancestor.stop();
	});

	it('lets touchend through, so the sheet can reset its own bookkeeping', async () => {
		await renderAndOpen();
		const ancestor = watchAncestor();
		touch(monthScroller(), 'touchend');
		expect(ancestor.seen).toContain('touchend');
		ancestor.stop();
	});

	it('leaves the rest of the picker to the sheet', async () => {
		await renderAndOpen();
		// The header is not a scroller: a drag there is the sheet's to interpret,
		// and it is one of the two places a dismiss can still start from.
		const ancestor = watchAncestor();
		touch(monthTitle(), 'touchstart');
		touch(monthTitle(), 'touchmove');
		expect(ancestor.seen).toEqual(['touchstart', 'touchmove']);
		ancestor.stop();
	});

	it('does not swallow taps — stopPropagation must not reach click', async () => {
		const onChange = vi.fn();
		await renderAndOpen({ onChange });
		await click(dayIn('March 2026', /March 25, 2026/));
		expect(onChange).toHaveBeenCalledWith('2026-03-25');
	});
});

// ---------------------------------------------------------------------------
// Dragging a wheel with a mouse
// ---------------------------------------------------------------------------

/**
 * A wheel is a scroll container, so a finger pans it for free. A mouse gets
 * nothing: browsers do not drag-scroll an overflow container, so pressing and
 * pulling on the one control shaped like a thing you spin did nothing at all.
 *
 * It matters on desktop specifically because that is where this surface is
 * reviewed, themed and screenshotted.
 *
 * Two of upstream's three shims go: `withWheelLayout` fakes a row height jsdom
 * will not compute, and `trackable` stubs `scrollTop`, `scrollTo` and the whole
 * pointer-capture API. Chromium has all of them, so the row height is measured
 * and the scroll position is simply read. The third, `pointer()`, becomes a real
 * `PointerEvent` — upstream builds an `Event` and defines `clientY`/`pointerId`/
 * `pointerType`/`button` onto it because jsdom's constructor is not usable.
 */
describe('DateInput — a mouse can drag a wheel', () => {
	async function renderAndOpenWheels(): Promise<HTMLElement> {
		await render(ControlledDateInput, { props: { initial: iso('2026-03-21') } });
		await openPicker();
		await click(monthTitle());
		await settleSwap();
		return page.getByRole('listbox', { name: 'Month', ...exact }).element() as HTMLElement;
	}

	function pointer(
		el: Element,
		type: string,
		{ y = 0, pointerType = 'mouse', button = 0, id = 1 } = {}
	): void {
		el.dispatchEvent(
			new PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				clientY: y,
				pointerId: id,
				pointerType,
				button
			})
		);
	}

	/** The real row height, where upstream's shim hard-codes 28. */
	function rowHeight(el: HTMLElement): number {
		const option = el.querySelector('[role="option"]');
		const height = option instanceof HTMLElement ? option.offsetHeight : 0;
		expect(height).toBeGreaterThan(0);
		return height;
	}

	it('scrolls the wheel when a mouse drags it', async () => {
		const el = await renderAndOpenWheels();
		const size = rowHeight(el);
		el.scrollTop = 0;
		pointer(el, 'pointerdown', { y: 200 });
		pointer(el, 'pointermove', { y: 160 });
		// Content follows the hand: pulling up scrolls further down the list.
		expect(el.scrollTop).toBe(40);
		pointer(el, 'pointerup', { y: 160 });
		// And the release lands on a row boundary rather than between two.
		await vi.waitFor(() => expect(el.scrollTop % size).toBe(0));
	});

	it('ignores movement too small to be a drag, so a click is still a click', async () => {
		const el = await renderAndOpenWheels();
		el.scrollTop = 0;
		pointer(el, 'pointerdown', { y: 200 });
		pointer(el, 'pointermove', { y: 200 - (DRAG_SLOP - 1) });
		expect(el.scrollTop).toBe(0);
	});

	it('leaves touch and pen alone — they pan natively, and better', async () => {
		const el = await renderAndOpenWheels();
		for (const pointerType of ['touch', 'pen']) {
			el.scrollTop = 0;
			pointer(el, 'pointerdown', { y: 200, pointerType });
			pointer(el, 'pointermove', { y: 120, pointerType });
			expect(el.scrollTop).toBe(0);
			pointer(el, 'pointerup', { y: 120, pointerType });
		}
	});

	it('ignores a secondary button, which belongs to the context menu', async () => {
		const el = await renderAndOpenWheels();
		el.scrollTop = 0;
		pointer(el, 'pointerdown', { y: 200, button: 2 });
		pointer(el, 'pointermove', { y: 120 });
		expect(el.scrollTop).toBe(0);
	});

	/**
	 * `scroll-snap-type: y mandatory` re-snaps after every scroll, programmatic
	 * ones included. Measured with it left on: 7 of 8 five-pixel drag steps were
	 * yanked back to a snap position, so the wheel stuck to a row and then jumped
	 * a whole one.
	 */
	it('suspends snapping for the drag, and restores it after', async () => {
		const el = await renderAndOpenWheels();
		expect(el.style.scrollSnapType).toBe('');
		pointer(el, 'pointerdown', { y: 200 });
		pointer(el, 'pointermove', { y: 160 });
		expect(el.style.scrollSnapType).toBe('none');
		pointer(el, 'pointerup', { y: 160 });
		el.dispatchEvent(new Event('scrollend'));
		await vi.waitFor(() => expect(el.style.scrollSnapType).toBe(''));
	});

	/**
	 * BottomSheet starts its own drag-to-dismiss from a `pointerdown` on its body
	 * and CAPTURES the pointer for it, which retargets every later pointer event —
	 * including the click. Measured before this: a click on a wheel row that
	 * wobbled more than a pixel selected nothing at all.
	 */
	it('keeps the press away from the sheet, which would capture the pointer', async () => {
		const el = await renderAndOpenWheels();
		const seen: string[] = [];
		const listener = (event: Event) => seen.push(event.type);
		document.body.addEventListener('pointerdown', listener);
		pointer(el, 'pointerdown', { y: 200 });
		expect(seen).not.toContain('pointerdown');
		document.body.removeEventListener('pointerdown', listener);
	});
});
