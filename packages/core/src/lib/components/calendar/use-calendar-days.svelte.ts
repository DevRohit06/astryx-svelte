import type { DayOfWeek, ISODateString, PlainDate } from '../../utils/date-types.js';
import {
	getDaysInMonth,
	plainDateAddDays,
	plainDateDayOfWeek,
	plainDateToISO
} from '../../utils/plain-date.js';

/**
 * Ported from Astryx's `Calendar/hooks/useCalendarDays.ts`.
 *
 * Upstream takes a plain options object and leans on four `useMemo`s to keep the
 * grid from being rebuilt every render. Here the options arrive as a **getter**
 * and each result is a `$derived` — the shape `useStreamingText` and
 * `useThemeMode` established. That is not a stylistic choice: a Svelte hook that
 * destructured its options would snapshot `year`/`month` at call time and the
 * grid would never advance when the caller navigated a month.
 *
 * The `useMemo` chain collapses to plain `$derived` because `$derived` already
 * caches on its dependencies. Upstream's `gridInfo` intermediate is kept rather
 * than inlined — `totalCells` is part of the public return and reading it must
 * not force the (much larger) `days` array to be built.
 */

/** Represents a single day in the calendar grid. */
export interface CalendarDay {
	/** The PlainDate for this day */
	date: PlainDate;
	/** ISO date string (YYYY-MM-DD) */
	iso: ISODateString;
	/** Whether this day is outside the current month */
	isOutside: boolean;
	/** The day number (1-31) */
	dayNumber: number;
}

/** Configuration for calendar days generation. */
export interface UseCalendarDaysOptions {
	/** The year to generate days for */
	year: number;
	/** The month (1-based: 1 = January, 12 = December) */
	month: number;
	/** First day of week (0=Sunday through 6=Saturday) */
	weekStartsOn?: DayOfWeek;
	/** Use variable rows per month vs. fixed 6-row grid */
	hasVariableRowCount?: boolean;
}

/** Return type for the `useCalendarDays` hook. */
export interface UseCalendarDaysReturn {
	/** All days in the grid (includes outside days) */
	readonly days: CalendarDay[];
	/** Days grouped into weeks */
	readonly weeks: CalendarDay[][];
	/** Localized day names for the header */
	readonly dayNames: string[];
	/** Total number of cells in the grid */
	readonly totalCells: number;
}

/**
 * Hook for generating calendar day grids.
 *
 * Calculates all the days to display for a given month, including days from
 * adjacent months to fill the grid.
 *
 * @example
 * ```ts
 * const grid = useCalendarDays(() => ({
 *   year: 2026,
 *   month: 1, // January (1-based)
 *   weekStartsOn: 0 // Sunday
 * }));
 * // grid.days[i].date is a PlainDate { year, month (1-based), day }
 * ```
 */
export function useCalendarDays(options: () => UseCalendarDaysOptions): UseCalendarDaysReturn {
	const year = $derived(options().year);
	const month = $derived(options().month);
	const weekStartsOn = $derived(options().weekStartsOn ?? 0);
	const hasVariableRowCount = $derived(options().hasVariableRowCount ?? false);

	// Grid structure.
	const gridInfo = $derived.by(() => {
		const totalDaysInMonth = getDaysInMonth(year, month);

		// Starting offset based on weekStartsOn.
		let startingDayOfWeek = plainDateDayOfWeek({ year, month, day: 1 }) - weekStartsOn;
		if (startingDayOfWeek < 0) {
			startingDayOfWeek += 7;
		}

		const totalDays = totalDaysInMonth + startingDayOfWeek;
		const totalRows = hasVariableRowCount ? Math.ceil(totalDays / 7) : 6;
		const totalCells = totalRows * 7;

		return { daysInMonth: totalDaysInMonth, startingDayOfWeek, totalCells };
	});

	const dayNames = $derived.by(() => {
		const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
		const rotated: string[] = [];
		for (let i = 0; i < 7; i++) {
			rotated.push(names[(i + weekStartsOn) % 7]);
		}
		return rotated;
	});

	const days = $derived.by(() => {
		const { daysInMonth: totalDaysInMonth, startingDayOfWeek, totalCells } = gridInfo;
		const firstOfMonth: PlainDate = { year, month, day: 1 };
		const result: CalendarDay[] = [];

		for (let i = 0; i < totalCells; i++) {
			const dayOffset = i - startingDayOfWeek + 1;
			const isOutside = dayOffset < 1 || dayOffset > totalDaysInMonth;
			const pd: PlainDate = isOutside
				? plainDateAddDays(firstOfMonth, dayOffset - 1)
				: { year, month, day: dayOffset };

			result.push({ date: pd, iso: plainDateToISO(pd), isOutside, dayNumber: pd.day });
		}

		return result;
	});

	const weeks = $derived.by(() => {
		const result: CalendarDay[][] = [];
		for (let i = 0; i < days.length; i += 7) {
			result.push(days.slice(i, i + 7));
		}
		return result;
	});

	return {
		get days() {
			return days;
		},
		get weeks() {
			return weeks;
		},
		get dayNames() {
			return dayNames;
		},
		get totalCells() {
			return gridInfo.totalCells;
		}
	};
}
