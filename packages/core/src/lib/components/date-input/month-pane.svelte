<script lang="ts" module>
	import type { DayOfWeek, ISODateString, PlainDate } from '../../utils/date-types.js';

	export interface MonthPaneProps {
		monthIndex: number;
		insetInlineStart: number;
		inlineSize: number;
		selectedDate: PlainDate | null;
		focusedDate: PlainDate | null;
		today: PlainDate;
		isDateDisabled: (date: PlainDate) => boolean;
		weekStartsOn: DayOfWeek;
		onSelect: (value: ISODateString) => void;
		onDayKeyDown: (event: KeyboardEvent, date: PlainDate) => void;
		onDayFocus: (date: PlainDate) => void;
	}
</script>

<script lang="ts">
	import { useCalendarDays } from '../calendar/use-calendar-days.svelte.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
	import {
		DATE_FORMAT_MONTH_YEAR,
		DATE_FORMAT_WITH_WEEKDAY,
		plainDateFormat,
		plainDateIsEqual,
		plainDateToISO
	} from '../../utils/plain-date.js';
	import { fromMonthIndex } from './month-geometry.js';
	import {
		monthCellAttrs,
		monthDayAttrs,
		monthPaneAttrs,
		monthPuckAttrs,
		monthRowAttrs
	} from './month-scroller.stylex.js';

	/**
	 * One month, as a six-row grid. Ported from the `MonthPane` half of
	 * Astryx's `DateInput/MonthScroller.tsx`, split into its own file because
	 * this port keeps one component per `.svelte` file.
	 *
	 * There is no `role="columnheader"` row in here: the weekday names are a
	 * single sticky row outside the scroller (they would otherwise scroll away),
	 * so each day instead carries its weekday in its accessible name.
	 */
	let {
		monthIndex,
		insetInlineStart,
		inlineSize,
		selectedDate,
		focusedDate,
		today,
		isDateDisabled,
		weekStartsOn,
		onSelect,
		onDayKeyDown,
		onDayFocus
	}: MonthPaneProps = $props();

	const locale = useLocale();
	const parts = $derived(fromMonthIndex(monthIndex));

	const grid = useCalendarDays(() => ({
		year: parts.year,
		month: parts.month,
		weekStartsOn,
		// Always six rows: a variable grid would make pane heights differ, and
		// with them every snap offset below this month.
		hasVariableRowCount: false
	}));

	const monthLabel = $derived(
		plainDateFormat(
			{ year: parts.year, month: parts.month, day: 1 },
			DATE_FORMAT_MONTH_YEAR,
			locale()
		)
	);

	// Exactly one day per pane is tab-reachable, so Tab moves through the
	// picker rather than through 42 buttons: the focused day if the keyboard
	// owns one, else the selection, else the first of the month.
	const tabbableISO = $derived.by(() => {
		if (
			focusedDate != null &&
			focusedDate.year === parts.year &&
			focusedDate.month === parts.month
		) {
			return plainDateToISO(focusedDate);
		}
		if (
			selectedDate != null &&
			selectedDate.year === parts.year &&
			selectedDate.month === parts.month
		) {
			return plainDateToISO(selectedDate);
		}
		return plainDateToISO({ year: parts.year, month: parts.month, day: 1 });
	});

	const paneAttrs = $derived(monthPaneAttrs(insetInlineStart, inlineSize));
	const rowAttrs = monthRowAttrs();
	const cellAttrs = monthCellAttrs();
</script>

<div
	role="grid"
	aria-label={monthLabel}
	data-month={monthLabel}
	class={paneAttrs.class}
	style={paneAttrs.style}
>
	{#each grid.weeks as week (week[0].iso)}
		<div role="row" class={rowAttrs.class} style={rowAttrs.style}>
			{#each week as day (day.iso)}
				<!--
					A spilled day is context, not a choice. Calendar computes the same
					thing as `effectivelyDisabled: isDisabled || isOutside`, and guards
					today/selected on `!isOutside` beside it, so a date borrowed from a
					neighbouring month never carries a ring or a puck in the pane that is
					only showing it.
				-->
				{@const isDisabled = day.isOutside || isDateDisabled(day.date)}
				{@const isSelected =
					!day.isOutside && selectedDate != null && plainDateIsEqual(day.date, selectedDate)}
				{@const isToday = !day.isOutside && plainDateIsEqual(day.date, today)}
				{@const dayAttrs = monthDayAttrs(day.isOutside, isDisabled)}
				{@const puckAttrs = monthPuckAttrs(isDisabled, isToday, isSelected)}
				<div
					role="gridcell"
					aria-selected={isSelected || undefined}
					class={cellAttrs.class}
					style={cellAttrs.style}
				>
					<button
						type="button"
						data-date={day.iso}
						tabindex={day.iso === tabbableISO ? 0 : -1}
						aria-label={plainDateFormat(day.date, DATE_FORMAT_WITH_WEEKDAY, locale())}
						aria-disabled={isDisabled || undefined}
						aria-current={isToday ? 'date' : undefined}
						onclick={() => {
							if (!isDisabled) {
								onSelect(day.iso);
							}
						}}
						onfocus={() => onDayFocus(day.date)}
						onkeydown={(event) => onDayKeyDown(event, day.date)}
						class={dayAttrs.class}
						style={dayAttrs.style}
					>
						<span class={puckAttrs.class} style={puckAttrs.style}>{day.dayNumber}</span>
					</button>
				</div>
			{/each}
		</div>
	{/each}
</div>
