<script lang="ts" module>
	import type { DateRange, DayOfWeek, ISODateString, PlainDate } from '../../utils/date-types.js';

	/**
	 * Props for the private `MonthGrid`.
	 *
	 * Not exported from the barrel: upstream declares `MonthGridProps` inside
	 * `Calendar.tsx` as a file-private interface and publishes neither it nor the
	 * component. This file exists only because Svelte has no in-file component
	 * declaration.
	 */
	export interface MonthGridProps {
		month: PlainDate;
		value: ISODateString | DateRange | undefined;
		mode: 'single' | 'range';
		rangeSelectionStart: ISODateString | null;
		hoveredDate: ISODateString | null;
		min?: ISODateString;
		max?: ISODateString;
		dateConstraints?: ReadonlyArray<(date: Date) => boolean>;
		maxRangeSpan?: number;
		minRangeSpan?: number;
		hasOutsideDays: boolean;
		hasWeekNumbers: boolean;
		hasVariableRowCount: boolean;
		weekStartsOn: DayOfWeek;
		onDayClick: (date: PlainDate) => void;
		onDayHover: (date: PlainDate | null) => void;
		today: PlainDate;
		onNavigatePrevious?: (focusedDate: ISODateString, offset: number) => void;
		onNavigateNext?: (focusedDate: ISODateString, offset: number) => void;
	}
</script>

<script lang="ts">
	import { useGridFocus } from '../../hooks/use-grid-focus.svelte.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
	import {
		DATE_FORMAT_MONTH_YEAR,
		plainDateFormat,
		plainDateFromISO,
		plainDateGetWeekNumber,
		plainDateIsBefore,
		plainDateIsEqual,
		plainDateToISO
	} from '../../utils/plain-date.js';
	import { computeDayNeighborContinuity } from './day-cell-utils.js';
	import { useCalendarConstraints } from './use-calendar-constraints.svelte.js';
	import { useCalendarDays } from './use-calendar-days.svelte.js';
	import DayCell from './day-cell.svelte';
	import {
		dayNameAttrs,
		daysGridAttrs,
		monthGridAttrs,
		weekNumberAttrs,
		weekNumberHeaderAttrs,
		weekRowAttrs
	} from './calendar.stylex.js';

	let {
		month,
		value,
		mode,
		rangeSelectionStart,
		hoveredDate,
		min,
		max,
		dateConstraints,
		maxRangeSpan,
		minRangeSpan,
		hasOutsideDays,
		hasWeekNumbers,
		hasVariableRowCount,
		weekStartsOn,
		onDayClick,
		onDayHover,
		today,
		onNavigatePrevious,
		onNavigateNext
	}: MonthGridProps = $props();

	const locale = useLocale();
	const year = $derived(month.year);

	const grid = useCalendarDays(() => ({
		year,
		month: month.month,
		weekStartsOn,
		hasVariableRowCount
	}));

	// The in-progress range start, in `PlainDate` form for the span comparison.
	// Null outside range mode and before the first pick, which is what leaves every
	// otherwise-valid day selectable until an anchor exists.
	const rangeAnchor = $derived(
		mode === 'range' && rangeSelectionStart ? plainDateFromISO(rangeSelectionStart) : null
	);

	const constraints = useCalendarConstraints(() => ({
		min,
		max,
		dateConstraints,
		maxRangeSpan,
		minRangeSpan,
		rangeAnchor
	}));

	// Parse the selected date for roving-tabindex priority.
	const selectedDateForTabindex = $derived.by((): PlainDate | null => {
		if (mode === 'single' && value && typeof value === 'string') {
			return plainDateFromISO(value);
		}
		return null;
	});

	// Seed the initial roving tab stop for this month. `useGridFocus` owns the
	// live tab stop (see `hasRovingTabIndex` below) — it honours an existing
	// `tabindex="0"` and repairs/moves it thereafter — so this only decides which
	// day button starts tabbable. Priority: selected date (if visible and
	// enabled) > today (if visible and enabled) > first enabled in-month day.
	const seedTabbableIso = $derived.by((): ISODateString | null => {
		if (selectedDateForTabindex) {
			const isSelectedInMonth =
				selectedDateForTabindex.year === year && selectedDateForTabindex.month === month.month;
			if (isSelectedInMonth && !constraints.isDateDisabled(selectedDateForTabindex)) {
				return plainDateToISO(selectedDateForTabindex);
			}
		}

		const isTodayInMonth = today.year === year && today.month === month.month;
		if (isTodayInMonth && !constraints.isDateDisabled(today)) {
			return plainDateToISO(today);
		}

		for (const day of grid.days) {
			if (!day.isOutside && !constraints.isDateDisabled(day.date)) {
				return day.iso;
			}
		}

		return null;
	});

	/**
	 * The focused date, read from the focused element's machine-readable
	 * `data-date` (ISO) attribute rather than by parsing the human-readable
	 * `aria-label` with `new Date()` — that is locale/format dependent and returns
	 * Invalid Date in non-English locales (e.g. fr-FR, ja-JP), silently swallowing
	 * month-boundary arrow navigation (complex-4).
	 */
	function getFocusedDate(): ISODateString | null {
		const activeElement = document.activeElement as HTMLElement | null;
		if (!activeElement) {
			return null;
		}

		const iso = activeElement.getAttribute('data-date');
		if (!iso) {
			return null;
		}

		return iso as ISODateString;
	}

	function handleNavigatePrevious(_column: number, offset: number): void {
		const focusedDate = getFocusedDate();
		if (focusedDate) {
			onNavigatePrevious?.(focusedDate, offset);
		}
	}

	function handleNavigateNext(_column: number, offset: number): void {
		const focusedDate = getFocusedDate();
		if (focusedDate) {
			onNavigateNext?.(focusedDate, offset);
		}
	}

	function handlePageUp(): void {
		const focusedDate = getFocusedDate();
		if (focusedDate) {
			onNavigatePrevious?.(focusedDate, 7);
		}
	}

	function handlePageDown(): void {
		const focusedDate = getFocusedDate();
		if (focusedDate) {
			onNavigateNext?.(focusedDate, 7);
		}
	}

	// Grid focus navigation.
	//
	// The hook enumerates ALL grid cells (every `role="gridcell"`, including
	// disabled days and empty placeholder cells) so the true 7-column geometry is
	// preserved. `isCellFocusable` / `getFocusTarget` tell the hook which cells
	// can take focus (those containing an enabled day button) and where to send
	// focus (the day button inside the cell). Arrow keys move to the target
	// row/column and, if that cell is disabled, continue in the same direction to
	// the next enabled cell.
	//
	// One hook per `MonthGrid`, as upstream: with `numberOfMonths={2}` there are
	// two `role="grid"` elements and two independently seeded tab stops. A single
	// shared grid would be tidier and would change the keyboard behaviour.
	const gridFocus = useGridFocus(() => ({
		columns: 7,
		cellSelector: '[role="gridcell"]',
		isCellFocusable: (cell: HTMLElement) => cell.querySelector('button:not([disabled])') !== null,
		getFocusTarget: (cell: HTMLElement) => cell.querySelector<HTMLElement>('button'),
		hasRovingTabIndex: true,
		onNavigateBefore: handleNavigatePrevious,
		onNavigateAfter: handleNavigateNext,
		onPageUp: handlePageUp,
		onPageDown: handlePageDown
	}));

	// The pending-focus pass lives in `calendar.svelte`, not here — see the note on
	// `runPendingFocus` there. Upstream runs it per pane and relies on every pane
	// seeing the same committed prop; a Svelte child reads the parent's `$state`
	// live, so the first pane's clear would stop the rest.

	// Parse the selection. Upstream computes these as plain `let`s in the render
	// body, so they re-derive on every render; `$derived.by` is the counterpart.
	const selection = $derived.by(() => {
		let selectedDate: PlainDate | null = null;
		let rangeStart: PlainDate | null = null;
		let rangeEnd: PlainDate | null = null;

		if (mode === 'single' && value && typeof value === 'string') {
			selectedDate = plainDateFromISO(value);
		} else if (mode === 'range' && value && typeof value === 'object') {
			rangeStart = plainDateFromISO(value.start);
			rangeEnd = plainDateFromISO(value.end);
		}

		// An in-progress range selection collapses to a single-day range.
		if (rangeSelectionStart) {
			rangeStart = plainDateFromISO(rangeSelectionStart);
			rangeEnd = rangeStart;
		}

		// Preview range while hovering during range selection.
		let previewStart: PlainDate | null = null;
		let previewEnd: PlainDate | null = null;
		if (mode === 'range' && rangeSelectionStart && hoveredDate) {
			const startPd = plainDateFromISO(rangeSelectionStart);
			const hoverPd = plainDateFromISO(hoveredDate);
			if (!plainDateIsEqual(startPd, hoverPd)) {
				if (plainDateIsBefore(hoverPd, startPd)) {
					previewStart = hoverPd;
					previewEnd = startPd;
				} else {
					previewStart = startPd;
					previewEnd = hoverPd;
				}
			}
		}

		return { selectedDate, rangeStart, rangeEnd, previewStart, previewEnd };
	});

	// Month label for announcements — this pane's own month, not the combined
	// header label.
	const monthLabel = $derived(plainDateFormat(month, DATE_FORMAT_MONTH_YEAR, locale()));

	const rootAttrs = monthGridAttrs();
	const gridAttrs = $derived(daysGridAttrs(hasWeekNumbers));
	const rowAttrs = weekRowAttrs();
	const nameAttrs = dayNameAttrs();
	const numberHeaderAttrs = weekNumberHeaderAttrs();
	const numberAttrs = weekNumberAttrs();
</script>

<div class={rootAttrs.class} style={rootAttrs.style}>
	<!-- Days grid (APG grid: header row of columnheaders + week rows) -->
	<!--
		The container is not itself a tab stop: the APG date-picker pattern puts
		the roving tab stop on the day buttons, which is what `useGridFocus`'s
		`hasRovingTabIndex` manages. Upstream's grid carries no tabindex either.
	-->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		role="grid"
		aria-label={monthLabel}
		aria-multiselectable={mode === 'range' ? true : undefined}
		onkeydown={gridFocus.handleKeyDown}
		onfocusin={gridFocus.handleFocus}
		class={gridAttrs.class}
		style={gridAttrs.style}
		{@attach gridFocus.attachGrid}
	>
		<!--
			Day names header row (columnheaders live inside the grid). Uses the same
			display:contents row so its cells align to the grid columns.
		-->
		<div role="row" class={rowAttrs.class} style={rowAttrs.style}>
			{#if hasWeekNumbers}
				<div class={numberHeaderAttrs.class} style={numberHeaderAttrs.style}></div>
			{/if}
			{#each grid.dayNames as name (name)}
				<div role="columnheader" class={nameAttrs.class} style={nameAttrs.style}>{name}</div>
			{/each}
		</div>

		{#each grid.weeks as week (plainDateToISO(week.find((d) => !d.isOutside)?.date ?? week[0].date))}
			{@const weekDate = week.find((d) => !d.isOutside)?.date ?? week[0].date}
			<div role="row" class={rowAttrs.class} style={rowAttrs.style}>
				{#if hasWeekNumbers}
					<div role="rowheader" class={numberAttrs.class} style={numberAttrs.style}>
						{plainDateGetWeekNumber(weekDate)}
					</div>
				{/if}
				{#each week as day, dayIndex (day.iso)}
					<DayCell
						{day}
						{dayIndex}
						{mode}
						selectedDate={selection.selectedDate}
						rangeStart={selection.rangeStart}
						rangeEnd={selection.rangeEnd}
						previewStart={selection.previewStart}
						previewEnd={selection.previewEnd}
						{today}
						{hasOutsideDays}
						isDisabled={constraints.isDateDisabled(day.date)}
						neighbors={computeDayNeighborContinuity({
							week,
							dayIndex,
							mode,
							rangeStart: selection.rangeStart,
							rangeEnd: selection.rangeEnd,
							previewStart: selection.previewStart,
							previewEnd: selection.previewEnd,
							isDisabled: constraints.isDateDisabled
						})}
						isTabbable={day.iso === seedTabbableIso}
						isRangeSelectionInProgress={rangeSelectionStart !== null}
						{onDayClick}
						{onDayHover}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>
