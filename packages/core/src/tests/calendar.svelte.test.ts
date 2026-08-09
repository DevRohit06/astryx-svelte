import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import type { Locator, LocatorSelectors } from 'vitest/browser';
import { createAttachmentKey } from 'svelte/attachments';
import Calendar from '$lib/components/calendar/calendar.svelte';
import { calendarNavIconAttrs } from '$lib/components/calendar/calendar.stylex.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
import type { DayOfWeekName, ISODateString } from '$lib/utils/date-types.js';
import { DATE_FORMAT_WITH_WEEKDAY, plainDateFormat } from '$lib/utils/plain-date.js';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import CalendarRtl from './fixtures/calendar-rtl-fixture.svelte';

/**
 * Ported from Astryx's `Calendar/Calendar.test.tsx` — **all 73 of upstream's
 * 73** at v0.3.0, in upstream's order and with upstream's titles.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "all 62 cases … Nothing is dropped". Upstream has
 * **73**; the eleven that were absent are now here — the whole `day-cell marker
 * theme state` describe (6) and the whole `theming targets` describe (5). Two
 * translations they need, both already precedented in this repo:
 *
 * - `generateThemeTestCSS` becomes `generateThemeCss`, this port's function of
 *   the same job and shape (as `multi-selector` and `selector` do).
 * - `omits the marker state for non-today cells` is **restated**: upstream
 *   guards its only assertion behind `if (other)`, so it can pass having checked
 *   nothing. See the comment at the case.
 *
 * One title differs deliberately: upstream's `wraps both nav chevrons in the
 * navIcon wrapper` is spelled `wraps both nav chevrons in the RTL-mirroring
 * navIcon wrapper` here, and says so at the case.
 *
 * Ten of those are 0.2.0's, and they are why `getDayButton` stopped matching
 * exactly: the selection-state cases assert that a selected or in-range day
 * appends a state word to its accessible name.
 *
 * The translations, once each:
 *
 * - **`ref` → attachment.** Upstream's "forwards ref to the calendar root
 *   element" has no `ref` here. Its counterpart asserts the element an
 *   attachment passed through rest props receives, which checks more than
 *   upstream's does — it gets the element rather than only proving a callback
 *   ran.
 * - **`handleRef` → instance export.** `CalendarHandle` is not a prop here;
 *   `navigateTo` is an instance export reached through `bind:this`, and
 *   `render(...).component` is that same instance (the `Tokenizer`/`SideNav`
 *   arrangement, driven the way `layer.svelte.test.ts` drives it). The two
 *   `handleRef` cases call `screen.component.navigateTo(...)` and are marked
 *   below.
 * - **`act()` disappears.** A `$state` write flushes on its own and
 *   `expect.element` retries until it has.
 * - **RTL's `getAllByRole(r)` becomes `screen.getByRole(r).elements()`, and
 *   `within(el)` becomes locator chaining** — the shape `table.svelte.test.ts`
 *   established.
 * - **`document.querySelector` for day buttons becomes `screen.container`.**
 *   Equivalent (RTL renders into `document.body`) and immune to a stray node
 *   from another suite. The live-region queries stay on `document`, because the
 *   region really is appended to `<body>` outside the container.
 * - **The clock is pinned** for the two cases that depend on what "today" is.
 *   `today` is resolved once at component init via `plainDateToday()` (upstream
 *   does the same with `useMemo(…, [])`), so a month rollover between render and
 *   assertion would otherwise decide the result. Only `Date` is mocked —
 *   `vi.setSystemTime` without `vi.useFakeTimers()` leaves `setTimeout` and
 *   `queueMicrotask` alone, which is what Svelte schedules on. The expectations
 *   are still computed from `new Date()` exactly as upstream computes them.
 * - **One restatement**, on "outside days are not clickable": see the comment
 *   there. Upstream guards its click behind `if (outsideDays[0])`, so the case
 *   would pass green having clicked nothing.
 *
 * Three things a real browser forces that jsdom did not, none of them a change
 * to what is asserted:
 *
 * - **Day lookups build the accessible name instead of hard-coding en-US.**
 *   `plainDateFormat` uses `new Intl.DateTimeFormat(undefined, …)` — the
 *   *runtime* default locale — and this Chromium reports en-GB, so upstream's
 *   `/January\s+15,\s+2026/` matches nothing against "Thursday, 15 January
 *   2026". `getDayButton` keeps upstream's role+name lookup and computes the
 *   name with the component's own formatter. Nothing is weakened by that: the
 *   label's *content* is not what any case asserts, and the one case that cares
 *   about the label proves navigation ignores it.
 * - **Month-label text queries are scoped to the render container.**
 *   `render()`'s query helpers are bound to `baseElement`, i.e. `document.body`,
 *   which also holds the announce live region — so after a navigation
 *   "January 2026" legitimately exists twice and a bare `getByText` is a strict-
 *   mode violation. Upstream passes only because jsdom's rAF had not fired yet
 *   when its non-retrying assertion ran. `monthLabel()` queries inside the
 *   calendar, which is the element upstream means.
 * - **The outside-day click is dispatched directly.** Playwright's actionability
 *   check refuses to click an `aria-disabled="true"` element, where user-event
 *   in jsdom simply fires the click. Dispatching it removes the browser's guard
 *   and leaves only the component's, which is the guard the case is about.
 *
 * Two behaviours worth naming because they are upstream's and look wrong:
 *
 * - `numberOfMonths={2}` renders **two** `role="grid"` elements, each with its
 *   own `useGridFocus` and therefore its own roving tab stop. That is upstream's
 *   structure (one `MonthGrid`, one hook), so no case here asserts a single tab
 *   stop.
 * - The month header still comes from the runtime default locale; "January 2026"
 *   happens to render identically in en-US and en-GB, so upstream's literals
 *   stand as written.
 */

afterEach(() => {
	__resetLiveRegionsForTest();
	// Undoes `vi.setSystemTime` in the two clock-pinned cases; a no-op elsewhere.
	vi.useRealTimers();
});

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

/** What `render()` hands back, narrowed to the parts these helpers need. */
interface Screen extends LocatorSelectors {
	container: HTMLElement;
	/** `page.elementLocator(container)` — the container-scoped locator root. */
	locator: Locator;
}

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

/**
 * Helper to find a day button by its day number.
 * Day buttons are native <button> elements with aria-labels like
 * "Thursday, January 15, 2026". Each button is the sole child of a
 * role="gridcell" wrapper.
 *
 * Upstream matches that label with `/January\s+15,\s+2026/`; the name is built
 * with the component's own formatter here so the lookup survives a non-en-US
 * default locale (see the file header).
 */
function getDayButton(screen: Screen, day: number, month = 'January', year = 2026): Locator {
	const name = plainDateFormat(
		{ year, month: MONTH_NAMES.indexOf(month) + 1, day },
		DATE_FORMAT_WITH_WEEKDAY
	);
	// Substring, not exact. Upstream matches with `new RegExp(`${month}\\s+${day},
	// \\s+${year}`)`, which is already a substring match, and 0.2.0 relies on
	// that: a selected or in-range day appends a state word (", selected",
	// ", range start") to the name, so an exact match would stop finding exactly
	// the days the selection cases are about. The computed full date stays the
	// needle — day 1's name is not a substring of day 15's, because the weekday
	// prefix differs.
	return screen.getByRole('button', { name, exact: false });
}

/**
 * The same date string `getDayButton` searches by, for the cases that assert on
 * the accessible *name* rather than just finding the button. Upstream writes
 * these out as en-US literals ("Thursday, January 15, 2026, selected"); computing
 * the date half keeps the assertion locale-independent while still pinning the
 * state suffix, which is the part 0.2.0 added.
 */
function dayName(day: number, month = 'January', year = 2026): string {
	return plainDateFormat(
		{ year, month: MONTH_NAMES.indexOf(month) + 1, day },
		DATE_FORMAT_WITH_WEEKDAY
	);
}

function getButton(screen: Screen, name: string): Locator {
	return screen.getByRole('button', { name });
}

/**
 * Text inside the calendar itself. Upstream's `screen.getByText`, minus the
 * announce live region that shares `document.body` with the render container.
 */
function monthLabel(screen: Screen, text: string | RegExp): Locator {
	return screen.locator.getByText(text);
}

describe('Calendar', () => {
	// ─── Basic Rendering ─────────────────────────────────────────

	// Counterpart for upstream's "forwards ref to the calendar root element".
	// There is no `ref` prop here; an attachment through the rest props is how a
	// consumer reaches the root, and it receives the element itself.
	it('forwards ref to the calendar root element', async () => {
		const attached = vi.fn();
		const screen = await render(Calendar, {
			props: { [createAttachmentKey()]: attached }
		});

		expect(attached).toHaveBeenCalledOnce();
		const root = attached.mock.calls[0][0];
		expect(root).toBeInstanceOf(HTMLDivElement);
		expect(root).toBe(screen.container.firstElementChild);
	});

	// Counterpart: `handleRef` has no prop here. `navigateTo` is an instance
	// export, and `render(...).component` is the instance `bind:this` would give.
	it('exposes navigation through handleRef', async () => {
		const screen = await render(Calendar);

		screen.component.navigateTo('2026-03-01');

		await expect.element(monthLabel(screen, 'March 2026')).toBeInTheDocument();
	});

	it('renders current month by default', async () => {
		// Clock pinned: `today` is captured at component init, so a rollover
		// between init and the assertion would decide the result.
		vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
		const screen = await render(Calendar);

		const today = new Date();
		const formatter = new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'long'
		});
		const expectedLabel = formatter.format(today);

		await expect.element(monthLabel(screen, expectedLabel)).toBeInTheDocument();
	});

	it("marks today's cell with aria-current='date'", async () => {
		vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
		const screen = await render(Calendar);

		const now = new Date();
		const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

		const todayCell = screen.container.querySelector(`button[data-date="${iso}"]`);
		expect(todayCell).not.toBeNull();
		expect(todayCell).toHaveAttribute('aria-current', 'date');

		// Only today's cell is marked current.
		const others = Array.from(screen.container.querySelectorAll('button[data-date]')).filter(
			(el) => el.getAttribute('data-date') !== iso
		);
		expect(others.length).toBeGreaterThan(0);
		others.forEach((el) => expect(el).not.toHaveAttribute('aria-current'));
	});

	it('displays day names', async () => {
		const screen = await render(Calendar);

		await expect.element(monthLabel(screen, 'Su')).toBeInTheDocument();
		await expect.element(monthLabel(screen, 'Mo')).toBeInTheDocument();
		await expect.element(monthLabel(screen, 'Tu')).toBeInTheDocument();
		await expect.element(monthLabel(screen, 'We')).toBeInTheDocument();
		await expect.element(monthLabel(screen, 'Th')).toBeInTheDocument();
		await expect.element(monthLabel(screen, 'Fr')).toBeInTheDocument();
		await expect.element(monthLabel(screen, 'Sa')).toBeInTheDocument();
	});

	it('displays correct number of day cells', async () => {
		const screen = await render(Calendar);

		// 6 rows * 7 days = 42 cells (default fixed row count)
		const buttons = screen.getByRole('gridcell').elements();
		expect(buttons.length).toBe(42);
	});

	// ─── Selection ───────────────────────────────────────────────

	it('highlights selected date', async () => {
		const screen = await render(Calendar, {
			props: { value: '2026-01-15', focusDate: '2026-01-01' }
		});

		const day15 = getDayButton(screen, 15).element();
		// In an ARIA grid, selection state lives on the gridcell, not the button
		// (a plain button role does not permit aria-selected).
		const gridcell15 = day15.closest('[role="gridcell"]');
		expect(gridcell15).toHaveAttribute('aria-selected', 'true');
		expect(day15).not.toHaveAttribute('aria-selected');
	});

	it('calls onChange when date is selected', async () => {
		const handleChange = vi.fn();

		const screen = await render(Calendar, {
			props: { onChange: handleChange, focusDate: '2026-01-01' }
		});

		const day15 = getDayButton(screen, 15);
		await userEvent.click(day15);

		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledWith('2026-01-15', expect.any(Date));
	});

	// ─── Navigation ──────────────────────────────────────────────

	it('navigates to previous month', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-02-01' } });

		// Verify we start on February
		await expect.element(monthLabel(screen, 'February 2026')).toBeInTheDocument();

		const prevButton = getButton(screen, 'Previous month');
		await userEvent.click(prevButton);

		await expect.element(monthLabel(screen, 'January 2026')).toBeInTheDocument();
	});

	it('navigates to next month', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		// Verify we start on January
		await expect.element(monthLabel(screen, 'January 2026')).toBeInTheDocument();

		const nextButton = getButton(screen, 'Next month');
		await userEvent.click(nextButton);

		await expect.element(monthLabel(screen, 'February 2026')).toBeInTheDocument();
	});

	it('calls onFocusDateChange when navigating', async () => {
		const handleFocusChange = vi.fn();

		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', onFocusDateChange: handleFocusChange }
		});

		const nextButton = getButton(screen, 'Next month');
		await userEvent.click(nextButton);

		expect(handleFocusChange).toHaveBeenCalledWith('2026-02-01');
	});

	// ─── Date Constraints ────────────────────────────────────────

	it('respects min date constraint', async () => {
		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', min: '2026-01-10' }
		});

		// Day 5 should be disabled (before min)
		const day5 = getDayButton(screen, 5);
		await expect.element(day5).toBeDisabled();

		// Day 15 should be enabled (after min)
		const day15 = getDayButton(screen, 15);
		await expect.element(day15).not.toBeDisabled();
	});

	it('respects max date constraint', async () => {
		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', max: '2026-01-20' }
		});

		const day25 = getDayButton(screen, 25);
		await expect.element(day25).toBeDisabled();

		const day15 = getDayButton(screen, 15);
		await expect.element(day15).not.toBeDisabled();
	});

	it('respects custom dateConstraints', async () => {
		// Only allow weekdays
		const isWeekday = (date: Date) => {
			const day = date.getDay();
			return day !== 0 && day !== 6;
		};

		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', dateConstraints: [isWeekday] }
		});

		// January 4, 2026 is a Sunday - should be disabled
		const sunday = getDayButton(screen, 4);
		await expect.element(sunday).toBeDisabled();
	});

	// ─── Multi-Month ─────────────────────────────────────────────

	it('renders two months when numberOfMonths={2}', async () => {
		const screen = await render(Calendar, {
			props: { numberOfMonths: 2, focusDate: '2026-01-01' }
		});

		// The header shows both months
		await expect.element(monthLabel(screen, /January 2026.*February 2026/)).toBeInTheDocument();
	});

	it('navigation advances both months together', async () => {
		const screen = await render(Calendar, {
			props: { numberOfMonths: 2, focusDate: '2026-01-01' }
		});

		const nextButton = getButton(screen, 'Next month');
		await userEvent.click(nextButton);

		await expect.element(monthLabel(screen, /February 2026.*March 2026/)).toBeInTheDocument();
	});

	it('clamps out-of-range numberOfMonths to a single month', async () => {
		// 1000 would otherwise try to render 1000 month grids and lock the page up.
		const screen = await render(Calendar, {
			props: { numberOfMonths: 1000 as unknown as 1 | 2, focusDate: '2026-01-01' }
		});

		// Only the focused month renders — no second month, no range separator.
		await expect.element(monthLabel(screen, 'January 2026')).toBeInTheDocument();
		expect(monthLabel(screen, /February 2026/).elements()).toHaveLength(0);
	});

	it('clamps numberOfMonths={0} to a single month', async () => {
		const screen = await render(Calendar, {
			props: { numberOfMonths: 0 as unknown as 1 | 2, focusDate: '2026-01-01' }
		});

		// 0 previously rendered no months at all; now falls back to one.
		await expect.element(monthLabel(screen, 'January 2026')).toBeInTheDocument();
		expect(screen.getByRole('gridcell').elements().length).toBeGreaterThan(0);
	});

	// ─── Display Options ─────────────────────────────────────────

	it('shows week numbers when hasWeekNumbers is true', async () => {
		const screen = await render(Calendar, {
			props: { hasWeekNumbers: true, focusDate: '2026-01-01' }
		});

		// Look for week number cells - they should be in the grid but not buttons
		// Week numbers for January 2026 include week 1, 2, 3, 4, 5
		const weekNumberCells = monthLabel(screen, /^[1-5]$/).elements();
		// Should have more than just day numbers (week numbers add extra cells)
		expect(weekNumberCells.length).toBeGreaterThan(5);
	});

	it('respects weekStartsOn option', async () => {
		const screen = await render(Calendar, { props: { weekStartsOn: 1 } });

		// First day name should be Monday
		const dayNames = monthLabel(screen, /^(Mo|Tu|We|Th|Fr|Sa|Su)$/).elements();
		expect(dayNames[0]).toHaveTextContent('Mo');
	});

	it('accepts a three-letter day name for weekStartsOn', async () => {
		const screen = await render(Calendar, { props: { weekStartsOn: 'mon' } });

		// "mon" should behave exactly like the numeric 1 (Monday first).
		const dayNames = monthLabel(screen, /^(Mo|Tu|We|Th|Fr|Sa|Su)$/).elements();
		expect(dayNames[0]).toHaveTextContent('Mo');
	});

	it('treats weekStartsOn day names case-insensitively', async () => {
		// Upstream writes `{'WED' as 'wed'}`; TS here needs the extra hop because
		// the two string literal types do not overlap.
		const screen = await render(Calendar, {
			props: { weekStartsOn: 'WED' as unknown as DayOfWeekName }
		});

		const dayNames = monthLabel(screen, /^(Mo|Tu|We|Th|Fr|Sa|Su)$/).elements();
		expect(dayNames[0]).toHaveTextContent('We');
	});

	// ─── Range Mode ──────────────────────────────────────────────

	it('supports range selection mode', async () => {
		const handleChange = vi.fn();

		const screen = await render(Calendar, {
			props: { mode: 'range', onChange: handleChange, focusDate: '2026-01-01' }
		});

		// Click start date
		const day10 = getDayButton(screen, 10);
		await userEvent.click(day10);

		// Click end date
		const day15 = getDayButton(screen, 15);
		await userEvent.click(day15);

		expect(handleChange).toHaveBeenCalledWith({
			start: '2026-01-10',
			end: '2026-01-15'
		});
	});

	it('handles reverse range selection (end before start)', async () => {
		const handleChange = vi.fn();

		const screen = await render(Calendar, {
			props: { mode: 'range', onChange: handleChange, focusDate: '2026-01-01' }
		});

		// Click later date first
		const day20 = getDayButton(screen, 20);
		await userEvent.click(day20);

		// Click earlier date
		const day10 = getDayButton(screen, 10);
		await userEvent.click(day10);

		// Should swap to ensure start <= end
		expect(handleChange).toHaveBeenCalledWith({
			start: '2026-01-10',
			end: '2026-01-20'
		});
	});

	it('highlights range when value is provided', async () => {
		const screen = await render(Calendar, {
			props: {
				mode: 'range',
				value: { start: '2026-01-10', end: '2026-01-15' },
				focusDate: '2026-01-01'
			}
		});

		const day10 = getDayButton(screen, 10).element();
		const day12 = getDayButton(screen, 12).element();
		const day15 = getDayButton(screen, 15).element();

		// Selection state lives on the gridcell wrapper, not the day button.
		expect(day10.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
		expect(day12.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
		expect(day15.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
		expect(day10).not.toHaveAttribute('aria-selected');
		expect(day12).not.toHaveAttribute('aria-selected');
		expect(day15).not.toHaveAttribute('aria-selected');
	});

	it('caps the range highlight next to a disabled mid-range day (#2715)', async () => {
		// Disable Jan 13. With Jan 10–15 selected, day 12 (immediately before the
		// disabled day) should get a rounded end cap on its right edge, and day 14
		// (immediately after) a rounded cap on its left edge — so the highlight
		// reads as terminating at the disabled gap rather than running square-edged
		// into it.
		const disableJan13 = (d: Date) =>
			!(d.getFullYear() === 2026 && d.getMonth() === 0 && d.getDate() === 13);
		const screen = await render(Calendar, {
			props: {
				mode: 'range',
				value: { start: '2026-01-10', end: '2026-01-15' },
				focusDate: '2026-01-01',
				dateConstraints: [disableJan13]
			}
		});

		// The range background is an absolutely-positioned sibling div inside the
		// same gridcell as the day button.
		const rangeBgFor = (day: number): HTMLElement => {
			const button = getDayButton(screen, day).element();
			const cell = button.closest('[role="gridcell"]') as HTMLElement;
			// First child div is the range background (rendered before the button).
			return cell.firstElementChild as HTMLElement;
		};

		const day12Bg = rangeBgFor(12);
		const day14Bg = rangeBgFor(14);

		// Capped edges have a border radius; the un-capped edge stays square.
		expect(getComputedStyle(day12Bg).borderTopRightRadius).not.toBe('');
		expect(getComputedStyle(day12Bg).borderTopRightRadius).not.toBe('0px');
		expect(getComputedStyle(day14Bg).borderTopLeftRadius).not.toBe('');
		expect(getComputedStyle(day14Bg).borderTopLeftRadius).not.toBe('0px');
	});

	it('does not range-highlight adjacent-month spillover days in two-month view', async () => {
		// #2715: with July 1–31 selected and July+August visible, July 26–31 also
		// render as outside days in the August pane. Those spillover copies must
		// not carry the range-highlight state (data-in-range) even though their
		// dates fall inside the selected range.
		const screen = await render(Calendar, {
			props: {
				mode: 'range',
				numberOfMonths: 2,
				focusDate: '2026-07-01',
				value: { start: '2026-07-01', end: '2026-07-31' }
			}
		});

		const spillover = [
			'2026-07-26',
			'2026-07-27',
			'2026-07-28',
			'2026-07-29',
			'2026-07-30',
			'2026-07-31'
		];

		const allDayButtons = Array.from(
			screen.container.querySelectorAll<HTMLButtonElement>('button[data-date]')
		);

		for (const iso of spillover) {
			const matches = allDayButtons.filter((b) => b.getAttribute('data-date') === iso);
			// Renders once in the July pane and once as a spillover in August.
			expect(matches.length).toBeGreaterThanOrEqual(2);
			const outsideCopies = matches.filter((b) => b.getAttribute('aria-disabled') === 'true');
			expect(outsideCopies.length).toBeGreaterThanOrEqual(1);
			for (const b of outsideCopies) {
				expect(b).not.toHaveAttribute('data-in-range');
			}
		}
	});

	// ─── Accessibility ───────────────────────────────────────────

	it('has accessible grid structure', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		await expect.element(screen.getByRole('grid')).toBeInTheDocument();
		expect(screen.getByRole('row').elements().length).toBeGreaterThan(0);
		expect(screen.getByRole('gridcell').elements().length).toBeGreaterThan(0);
	});

	it('renders a valid APG grid: one grid, header row of columnheaders inside it, week rows of gridcells', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		const grids = screen.getByRole('grid').elements();
		expect(grids.length).toBe(1);
		const grid = grids[0];

		// The columnheaders live INSIDE the grid.
		const columnHeaders = screen.getByRole('columnheader').elements();
		expect(columnHeaders.length).toBe(7);
		for (const header of columnHeaders) {
			expect(grid.contains(header)).toBe(true);
		}

		// The grid's rows: first is the header row of columnheaders, the rest are
		// week rows whose direct children are gridcells.
		const rows = screen.getByRole('grid').getByRole('row').elements();
		// 1 header row + 6 week rows (fixed 6-row grid).
		expect(rows.length).toBe(7);

		const [headerRow, ...weekRows] = rows;

		// Header row's direct children are the 7 columnheaders.
		const headerChildren = Array.from(headerRow.children);
		const headerColHeaders = headerChildren.filter(
			(child) => child.getAttribute('role') === 'columnheader'
		);
		expect(headerColHeaders.length).toBe(7);

		// Each week row's direct children are gridcells (7 per row).
		for (const row of weekRows) {
			const gridcellChildren = Array.from(row.children).filter(
				(child) => child.getAttribute('role') === 'gridcell'
			);
			expect(gridcellChildren.length).toBe(7);
		}
	});

	it('renders week-number cells as rowheader when hasWeekNumbers is set', async () => {
		const screen = await render(Calendar, {
			props: { hasWeekNumbers: true, focusDate: '2026-01-01' }
		});

		const rowHeaders = screen.getByRole('grid').getByRole('rowheader').elements();
		// One rowheader (week number) per week row.
		expect(rowHeaders.length).toBeGreaterThanOrEqual(5);
		// Week numbers are numeric.
		for (const header of rowHeaders) {
			expect(header.textContent).toMatch(/^\d+$/);
		}
	});

	it('gridcell wrappers are direct children of week rows, and the button is inside the gridcell', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		const gridcells = screen.getByRole('grid').getByRole('gridcell').elements();
		for (const cell of gridcells) {
			// The gridcell's parent is a role="row".
			const parent = cell.parentElement;
			expect(parent?.getAttribute('role')).toBe('row');
			// The day button (if present) is a descendant of the gridcell.
			const button = cell.querySelector('button');
			if (button) {
				expect(cell.contains(button)).toBe(true);
				expect(button).not.toHaveAttribute('role', 'gridcell');
			}
		}
	});

	it('has navigation buttons with accessible labels', async () => {
		const screen = await render(Calendar);

		await expect.element(getButton(screen, 'Previous month')).toBeInTheDocument();
		await expect.element(getButton(screen, 'Next month')).toBeInTheDocument();
	});

	// ─── Month Change Announcements ──────────────────────────────

	describe('month change announcements', () => {
		it('does not announce on initial render', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });
			// The live region is only created lazily on first announce; mounting the
			// calendar must not speak the initial month.
			expect(politeRegion()).toBeNull();
			// Keeps the render from being unused, and pins that the month it did not
			// announce is the one on screen.
			await expect.element(monthLabel(screen, 'January 2026')).toBeInTheDocument();
		});

		it('announces the new month politely when clicking next', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

			await expect.poll(politeRegion).not.toBeNull();
			await expect.element(politeRegion()!).toHaveTextContent('February 2026');
		});

		it('announces the new month politely when clicking previous', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-02-01' } });

			await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));

			await expect.poll(politeRegion).not.toBeNull();
			await expect.element(politeRegion()!).toHaveTextContent('January 2026');
		});

		it('announces the next month when paging the grid with PageDown', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			// PageDown from a focused day pages the visible grid to the next month.
			getDayButton(screen, 15).element().focus();
			await userEvent.keyboard('{PageDown}');

			await expect.poll(politeRegion).not.toBeNull();
			await expect.element(politeRegion()!).toHaveTextContent('February 2026');
		});

		// Counterpart: upstream drives `handleRef.current.navigateTo`; here the
		// handle is the component instance.
		it('announces the newly visible month when navigated via the handle', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			screen.component.navigateTo('2026-03-01');

			await expect.poll(politeRegion).not.toBeNull();
			await expect.element(politeRegion()!).toHaveTextContent('March 2026');
		});

		it('announces both months in a two-month view', async () => {
			const screen = await render(Calendar, {
				props: { numberOfMonths: 2, focusDate: '2026-01-01' }
			});

			await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

			await expect.poll(politeRegion).not.toBeNull();
			await expect.element(politeRegion()!).toHaveTextContent('February 2026 – March 2026');
		});

		it('does not announce when selecting a date leaves the visible month unchanged', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			// Selecting an in-month day does not move the grid, so nothing should be
			// announced (the live region stays uncreated).
			await userEvent.click(getDayButton(screen, 15));

			// Allow the announce rAF a chance to run before asserting silence.
			await new Promise((resolve) => requestAnimationFrame(resolve));
			expect(politeRegion()).toBeNull();
		});
	});

	// ─── Selection Semantics for AT (WCAG 4.1.2 / 1.3.1) ────────

	describe('selection state in day accessible names', () => {
		it("appends 'selected' to the selected day's button name in single mode", async () => {
			const screen = await render(Calendar, {
				props: { value: '2026-01-15', focusDate: '2026-01-01' }
			});

			// Roving focus lands on the day <button>, which cannot carry
			// aria-selected (invalid on role="button") — the selection state must be
			// encoded in the button's accessible name instead.
			expect(getDayButton(screen, 15).element().getAttribute('aria-label')).toBe(
				`${dayName(15)}, selected`
			);
			// Unselected days carry the plain date name.
			expect(getDayButton(screen, 20).element().getAttribute('aria-label')).toBe(dayName(20));
		});

		it('marks range start, end, and in-range days in their accessible names', async () => {
			const screen = await render(Calendar, {
				props: {
					mode: 'range',
					value: { start: '2026-01-10', end: '2026-01-15' },
					focusDate: '2026-01-01'
				}
			});

			expect(getDayButton(screen, 10).element().getAttribute('aria-label')).toBe(
				`${dayName(10)}, range start`
			);
			expect(getDayButton(screen, 15).element().getAttribute('aria-label')).toBe(
				`${dayName(15)}, range end`
			);
			expect(getDayButton(screen, 12).element().getAttribute('aria-label')).toBe(
				`${dayName(12)}, in range`
			);
			// Days outside the range keep the plain date name.
			expect(getDayButton(screen, 20).element().getAttribute('aria-label')).toBe(dayName(20));
		});

		it('labels a one-day range as both range start and range end', async () => {
			const screen = await render(Calendar, {
				props: {
					mode: 'range',
					value: { start: '2026-01-10', end: '2026-01-10' },
					focusDate: '2026-01-01'
				}
			});

			expect(getDayButton(screen, 10).element().getAttribute('aria-label')).toBe(
				`${dayName(10)}, range start and range end`
			);
		});

		it("labels the in-progress first pick as 'range start' only", async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', focusDate: '2026-01-01' }
			});

			await userEvent.click(getDayButton(screen, 10));

			// While the range is in progress the picked day is only the start — not a
			// completed one-day range.
			expect(getDayButton(screen, 10).element().getAttribute('aria-label')).toBe(
				`${dayName(10)}, range start`
			);
		});
	});

	describe('range selection announcements', () => {
		it('announces the start pick and prompts for an end date', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', focusDate: '2026-01-01' }
			});

			await userEvent.click(getDayButton(screen, 10));

			await expect.poll(politeRegion).not.toBeNull();
			await expect
				.element(politeRegion()!)
				.toHaveTextContent(`Start date ${dayName(10)}. Select an end date.`);
		});

		it('announces the completed range after the second pick', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', focusDate: '2026-01-01' }
			});

			await userEvent.click(getDayButton(screen, 10));
			await userEvent.click(getDayButton(screen, 15));

			await expect.poll(politeRegion).not.toBeNull();
			await expect
				.element(politeRegion()!)
				.toHaveTextContent(`Selected range: ${dayName(10)} to ${dayName(15)}.`);
		});

		it('announces the completed range in chronological order for a reverse pick', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', focusDate: '2026-01-01' }
			});

			await userEvent.click(getDayButton(screen, 20));
			await userEvent.click(getDayButton(screen, 10));

			await expect.poll(politeRegion).not.toBeNull();
			await expect
				.element(politeRegion()!)
				.toHaveTextContent(`Selected range: ${dayName(10)} to ${dayName(20)}.`);
		});
	});

	describe('aria-multiselectable', () => {
		it('sets aria-multiselectable="true" on the grid in range mode', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', focusDate: '2026-01-01' }
			});

			await expect
				.element(screen.getByRole('grid'))
				.toHaveAttribute('aria-multiselectable', 'true');
		});

		it('does not set aria-multiselectable in single mode', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			await expect.element(screen.getByRole('grid')).not.toHaveAttribute('aria-multiselectable');
		});

		it('sets aria-multiselectable on both grids in a two-month range view', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', numberOfMonths: 2, focusDate: '2026-01-01' }
			});

			const grids = screen.getByRole('grid').elements();
			expect(grids.length).toBe(2);
			for (const grid of grids) {
				expect(grid).toHaveAttribute('aria-multiselectable', 'true');
			}
		});
	});

	// ─── Bug Regression Tests ───────────────────────────────────

	it('day buttons have data-date attribute with ISO string', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		const day15 = getDayButton(screen, 15);
		await expect.element(day15).toHaveAttribute('data-date', '2026-01-15');
	});

	it('ArrowDown moves focus +7 days, not to same day in next month', async () => {
		const handleFocusChange = vi.fn();

		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', onFocusDateChange: handleFocusChange }
		});

		// Focus Jan 28
		const day28 = getDayButton(screen, 28);
		await userEvent.click(day28);
		day28.element().focus();

		// Press ArrowDown — should move to Feb 4 (+7 days), not Feb 28
		await userEvent.keyboard('{ArrowDown}');

		// After navigation, Feb 4 should be focused
		const focusedElement = document.activeElement;
		expect(focusedElement).toHaveAttribute('data-date', '2026-02-04');
	});

	it('ArrowDown lands on the same weekday +7 days even when earlier days are disabled (complex-2)', async () => {
		// min disables Jan 1–4 (HTML-disabled). Jan 8 is a Thursday; ArrowDown must
		// land on Jan 15 (the same weekday, +7 days), not a shifted date caused by
		// the removed enabled cells.
		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', min: '2026-01-05' }
		});

		const day1 = getDayButton(screen, 1);
		await expect.element(day1).toBeDisabled();

		const day8 = getDayButton(screen, 8);
		day8.element().focus();

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toHaveAttribute('data-date', '2026-01-15');

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toHaveAttribute('data-date', '2026-01-22');
	});

	it('ArrowUp skips a disabled cell in the same column to the next enabled row (complex-2)', async () => {
		// max disables Jan 22 onward. Focus Feb 5 handling is out of scope; instead
		// use dateConstraints to disable a single mid-grid day and verify column
		// geometry is preserved (ArrowUp from Jan 15 skips disabled Jan 8 → Jan 1).
		const disableJan8 = (date: Date) =>
			!(date.getFullYear() === 2026 && date.getMonth() === 0 && date.getDate() === 8);

		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', dateConstraints: [disableJan8] }
		});

		const day8 = getDayButton(screen, 8);
		await expect.element(day8).toBeDisabled();

		const day15 = getDayButton(screen, 15);
		day15.element().focus();

		// ArrowUp: same column one row up is Jan 8 (disabled) → skip to Jan 1.
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toHaveAttribute('data-date', '2026-01-01');
	});

	it('cross-month arrow nav resolves the focused date from data-date (locale-safe)', async () => {
		// Regression for complex-4: getFocusedDate must read the machine-readable
		// data-date attribute, not parse the human-readable aria-label with
		// new Date() (which is locale-dependent). We prove the resolution path by
		// corrupting the aria-label to something new Date() cannot parse — cross-
		// month navigation must still report the correct ISO date.
		const handleFocusChange = vi.fn();

		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', onFocusDateChange: handleFocusChange }
		});

		const day28 = getDayButton(screen, 28).element();
		await userEvent.click(day28);
		day28.focus();
		// Simulate a non-English/unparseable aria-label while keeping data-date.
		day28.setAttribute('aria-label', '2026年1月28日 水曜日');

		await userEvent.keyboard('{ArrowDown}');

		// Feb 4 (+7 days) — resolved via data-date despite the unparseable label.
		expect(document.activeElement).toHaveAttribute('data-date', '2026-02-04');
	});

	it('prev button is disabled when focusDate month contains min', async () => {
		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', min: '2026-01-15' }
		});

		const prevButton = getButton(screen, 'Previous month');
		await expect.element(prevButton).toBeDisabled();
	});

	it('next button is disabled when focusDate month contains max', async () => {
		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', max: '2026-01-15' }
		});

		const nextButton = getButton(screen, 'Next month');
		await expect.element(nextButton).toBeDisabled();
	});

	it('outside days are not clickable when hasOutsideDays is true', async () => {
		const handleChange = vi.fn();

		const screen = await render(Calendar, {
			props: { focusDate: '2026-01-01', hasOutsideDays: true, onChange: handleChange }
		});

		// January 2026 starts on Thursday, so Dec 28-31 are outside days
		// Find an outside day button (December day visible in January grid)
		const outsideDays = screen
			.getByRole('gridcell')
			.elements()
			.filter((cell) => {
				const button = cell.querySelector('button');
				return button?.getAttribute('aria-disabled') === 'true';
			});

		// RESTATED. Upstream guards the click behind `if (outsideDays[0])` and
		// `if (button)`, so the case passes green having clicked nothing at all.
		// Assert the outside days exist, then click unconditionally — which is what
		// the title claims is being tested.
		expect(outsideDays.length).toBeGreaterThan(0);
		const button = outsideDays[0].querySelector('button');
		expect(button).not.toBeNull();
		// Dispatched rather than driven through `userEvent`: Playwright's
		// actionability check refuses to click an `aria-disabled="true"` element,
		// where user-event in jsdom fires the click regardless. Going direct
		// removes the *browser's* guard and leaves only the component's, which is
		// the one this case is about.
		button!.click();

		expect(handleChange).not.toHaveBeenCalled();
	});

	it('Escape cancels range selection in progress', async () => {
		const handleChange = vi.fn();

		const screen = await render(Calendar, {
			props: { mode: 'range', onChange: handleChange, focusDate: '2026-01-01' }
		});

		// Click start date to begin range selection
		const day10 = getDayButton(screen, 10);
		await userEvent.click(day10);

		// Press Escape to cancel
		await userEvent.keyboard('{Escape}');

		// Click another date — should start a NEW range, not complete the old one
		const day20 = getDayButton(screen, 20);
		await userEvent.click(day20);

		// onChange should NOT have been called (no range completed)
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('day name headers have role="columnheader"', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		const columnHeaders = screen.getByRole('columnheader').elements();
		expect(columnHeaders.length).toBe(7);

		// Verify they contain day name abbreviations
		const dayNames = columnHeaders.map((h) => h.textContent);
		expect(dayNames).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
	});

	it('button inside gridcell does not duplicate role="gridcell"', async () => {
		const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

		const gridcells = screen.getByRole('gridcell').elements();
		for (const cell of gridcells) {
			const button = cell.querySelector('button');
			if (button) {
				expect(button).not.toHaveAttribute('role', 'gridcell');
			}
		}
	});

	// ─── RTL (#3388) ─────────────────────────────────────────────

	describe('RTL month navigation', () => {
		// Upstream's note is that jsdom does not apply compiled StyleX CSS, so the
		// scaleX(-1) mirror is only observable in a browser. These run in a real
		// Chromium, but the case is ported as upstream wrote it: it pins the
		// structure the fix depends on — both nav chevrons render inside the navIcon
		// wrapper that carries the ':is([dir="rtl"] *)' conditional transform.
		it('wraps both nav chevrons in the RTL-mirroring navIcon wrapper', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			// Our style module exposes attribute helpers rather than raw style
			// objects, so this is `calendarNavIconAttrs()` where upstream writes
			// `stylex.props(calendarStyles.navIcon)`. Same class, same assertion.
			const { class: navIconClass } = calendarNavIconAttrs();
			expect(navIconClass).toBeTruthy();

			for (const name of ['Previous month', 'Next month']) {
				const button = getButton(screen, name).element();
				const wrappers = Array.from(button.querySelectorAll('span')).filter(
					(span) => span.className === navIconClass
				);
				expect(wrappers.length).toBe(1);
			}
		});

		it('keeps navigation semantics unchanged under dir="rtl"', async () => {
			const screen = await render(CalendarRtl, {
				props: { calendar: { focusDate: '2026-02-01' } }
			});

			await expect.element(monthLabel(screen, 'February 2026')).toBeInTheDocument();

			// DOM order and handlers must not change in RTL: flexbox already
			// places "Previous month" at the visual right; only the glyph mirrors.
			await userEvent.click(getButton(screen, 'Previous month'));
			await expect.element(monthLabel(screen, 'January 2026')).toBeInTheDocument();

			await userEvent.click(getButton(screen, 'Next month'));
			await expect.element(monthLabel(screen, 'February 2026')).toBeInTheDocument();
		});
	});

	describe('day-cell marker theme state', () => {
		// Pin "today" to a mid-month date so the ±2-day range helpers below stay
		// within a single rendered month. With the real clock, running near a month
		// boundary (e.g. the 1st) pushed today-2 into the previous month, so the
		// rendered grid didn't contain today's cell and the marker assertions
		// flaked. Fake only Date (timers stay real; these tests are synchronous) —
		// which is also this file's standing rule, because `queueMicrotask` is what
		// Svelte schedules on. The file's `afterEach` restores real timers.
		beforeEach(() => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
		});
		// Tests use the (now-pinned) "today" since Calendar derives it internally.
		// Helpers pin the exact ISO strings.
		function todayISO(): ISODateString {
			const n = new Date();
			return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}` as ISODateString;
		}
		function isoOffsetFromToday(deltaDays: number): ISODateString {
			const n = new Date();
			n.setDate(n.getDate() + deltaDays);
			return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}` as ISODateString;
		}
		// Upstream's document-wide `document.querySelector`, scoped to the render
		// container — which is what RTL's freshly-cleaned `document` amounts to.
		function todayCell(screen: Screen): HTMLElement {
			const el = screen.container.querySelector<HTMLElement>(`button[data-date="${todayISO()}"]`);
			expect(el).not.toBeNull();
			return el as HTMLElement;
		}

		it('reflects marker="today-only" for a plain today cell (no selection)', async () => {
			const screen = await render(Calendar);
			const cell = todayCell(screen);
			expect(cell).toHaveAttribute('data-marker', 'today-only');
			expect(cell).toHaveAttribute('data-today', 'today');
			expect(cell).not.toHaveAttribute('data-selected');
			expect(cell).not.toHaveAttribute('data-in-range');
		});

		it('reflects marker="today-in-range" when today is strictly inside a range', async () => {
			const screen = await render(Calendar, {
				props: {
					mode: 'range',
					value: { start: isoOffsetFromToday(-2), end: isoOffsetFromToday(2) }
				}
			});
			const cell = todayCell(screen);
			// Today is inside the range but not an endpoint: the today-in-range ring
			// is shown, so `marker` reflects that compound state precisely.
			expect(cell).toHaveAttribute('data-marker', 'today-in-range');
			expect(cell).toHaveAttribute('data-in-range', 'in-range');
			expect(cell).not.toHaveAttribute('data-selected');
		});

		it('shows no marker state when today is the single-selected date', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'single', value: todayISO() }
			});
			const cell = todayCell(screen);
			// A single-mode selected cell shows no ring by default — `marker` is
			// absent, while `selected` (which owns the selected treatment) is present.
			expect(cell).not.toHaveAttribute('data-marker');
			expect(cell).toHaveAttribute('data-selected', 'selected');
			expect(cell).toHaveAttribute('data-today', 'today');
		});

		it('preserves the today-in-range ring on a today range endpoint', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'range', value: { start: todayISO(), end: isoOffsetFromToday(3) } }
			});
			const cell = todayCell(screen);
			// A range endpoint is NOT `isSelected` (that flag is single-mode only),
			// so by default the today-in-range ring IS drawn on a today endpoint
			// alongside the endpoint styling. `marker` mirrors that exactly — this
			// asserts the default rendering is preserved, byte-for-byte.
			expect(cell).toHaveAttribute('data-marker', 'today-in-range');
			expect(cell).toHaveAttribute('data-in-range', 'in-range');
		});

		it('omits the marker state for non-today cells', async () => {
			const screen = await render(Calendar);
			const other = screen.container.querySelector(`button[data-date="${isoOffsetFromToday(1)}"]`);
			// RESTATED. Upstream guards this with `if (other)`, against the +1 day
			// landing in an adjacent month with outside days hidden — so on the wrong
			// day of the month its only assertion never runs and the case passes
			// having checked nothing. The clock is pinned to the 15th two lines
			// above, which makes the cell's presence a fact rather than a hope, so it
			// is asserted instead of guarded.
			expect(other).not.toBeNull();
			expect(other).not.toHaveAttribute('data-marker');
		});

		it('exposes the marker states as themeable defineTheme targets', () => {
			// A browser cannot resolve the @layer cascade from JS, so the
			// DOM-reflection tests above cover that the right state renders; this
			// asserts the state is reachable by a theme via the sanctioned
			// defineTheme channel. `generateThemeCss` is this port's counterpart to
			// upstream's `generateThemeTestCSS` — both return the flat stylesheet
			// string.
			const theme = defineTheme({
				name: 'calendar-marker-test',
				components: {
					'calendar-day': {
						'marker:today-only': {
							boxShadow: 'inset 0 0 0 2px var(--color-accent)'
						},
						'marker:today-in-range': {
							boxShadow: 'inset 0 0 0 2px var(--color-text-primary)'
						}
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-calendar-day.today-only');
			expect(css).toContain('.astryx-calendar-day.today-in-range');
			expect(css).toContain('box-shadow: inset 0 0 0 2px var(--color-accent)');
			expect(css).toContain('box-shadow: inset 0 0 0 2px var(--color-text-primary)');
		});
	});

	// ─── Theming targets ─────────────────────────────────────────
	describe('theming targets', () => {
		it('renders the astryx-calendar-nav target on both month-nav buttons', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			const prev = getButton(screen, 'Previous month');
			const next = getButton(screen, 'Next month');

			// Dedicated, stable theme target — scoped to the nav controls, not the
			// global astryx-button handle that hits every Button in the app.
			await expect.element(prev).toHaveClass('astryx-calendar-nav');
			await expect.element(next).toHaveClass('astryx-calendar-nav');

			// Direction is reflected so a theme can target one arrow alone.
			await expect.element(prev).toHaveAttribute('data-nav', 'prev');
			await expect.element(next).toHaveAttribute('data-nav', 'next');
		});

		it('reflects the disabled nav state as a data attribute at the range edges', async () => {
			// Clamp navigation so "Previous month" is disabled and "Next" is not.
			const screen = await render(Calendar, {
				props: { focusDate: '2026-01-15', min: '2026-01-01', max: '2026-03-31' }
			});

			const prev = getButton(screen, 'Previous month');
			const next = getButton(screen, 'Next month');

			await expect.element(prev).toHaveAttribute('data-disabled', 'disabled');
			await expect.element(next).not.toHaveAttribute('data-disabled');
		});

		it('keeps the default nav rendering unchanged (still a ghost icon button)', async () => {
			const screen = await render(Calendar, { props: { focusDate: '2026-01-01' } });

			// The new target is additive — the nav still carries the stock Button
			// classes, so default appearance is preserved.
			const prev = getButton(screen, 'Previous month');
			await expect.element(prev).toHaveClass('astryx-button');
			await expect.element(prev).toHaveClass('ghost');
			expect(prev.element().tagName).toBe('BUTTON');
		});

		it('renders the astryx-calendar-day target with its reflected states', async () => {
			const screen = await render(Calendar, {
				props: { mode: 'single', value: '2026-01-15', focusDate: '2026-01-01' }
			});

			const selected = getDayButton(screen, 15);
			await expect.element(selected).toHaveClass('astryx-calendar-day');
			await expect.element(selected).toHaveAttribute('data-selected', 'selected');

			// A non-selected weekday cell still carries the base target and no
			// selected/today reflection.
			const plain = getDayButton(screen, 20);
			await expect.element(plain).toHaveClass('astryx-calendar-day');
			await expect.element(plain).not.toHaveAttribute('data-selected');
		});

		it('exposes calendar-nav as a themeable defineTheme target', () => {
			// The generated CSS is what proves the target is reachable by a theme:
			// the @layer cascade is not observable from JS, so the DOM-class
			// assertions above and this generation assertion together cover the seam.
			const theme = defineTheme({
				name: 'calendar-nav-test',
				components: {
					'calendar-nav': {
						base: { color: 'var(--color-accent)' },
						'nav:next': { backgroundColor: 'var(--color-accent-muted)' }
					}
				}
			});
			const css = generateThemeCss(theme);
			expect(css).toContain('.astryx-calendar-nav {');
			expect(css).toContain('color: var(--color-accent)');
			expect(css).toContain('.astryx-calendar-nav.next');
			expect(css).toContain('background-color: var(--color-accent-muted)');
		});
	});
});
