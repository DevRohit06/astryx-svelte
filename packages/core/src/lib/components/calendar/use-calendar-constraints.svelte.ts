import type { ISODateString, PlainDate } from '../../utils/date-types.js';
import {
	plainDateDiffDays,
	plainDateFromISO,
	plainDateIsAfter,
	plainDateIsBefore,
	plainDateToDate
} from '../../utils/plain-date.js';

/**
 * Ported from Astryx's `Calendar/hooks/useCalendarConstraints.ts`.
 *
 * Options arrive as a getter, for the reason `useCalendarDays` documents. The
 * returned `isDateDisabled` is a plain function rather than a `$derived`
 * closure: upstream's `useCallback` exists only to keep the identity stable
 * across renders so downstream `useMemo`s do not thrash, and there is no
 * counterpart to preserve here. It still reads `options()` on every call, so a
 * changed `min`/`max`/`dateConstraints` takes effect immediately and any
 * `$derived` that called it re-runs — which is what upstream's dependency array
 * bought.
 */

/** Configuration for date constraints. */
export interface UseCalendarConstraintsOptions {
	/** Minimum selectable date in ISO format */
	min?: ISODateString;
	/** Maximum selectable date in ISO format */
	max?: ISODateString;
	/**
	 * Custom date constraint functions.
	 * Date is disabled if ANY function returns false.
	 */
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>;
	/**
	 * Maximum number of days a range may span, counting both endpoints (a value
	 * of 7 allows a 7-day window). In range mode, once a start is picked, dates
	 * further than this from it are disabled. No effect until a range anchor
	 * exists.
	 */
	maxRangeSpan?: number;
	/**
	 * Minimum number of days a range must span, counting both endpoints (a value
	 * of 2 forbids a single-day range). In range mode, once a start is picked,
	 * dates closer than this to it are disabled.
	 */
	minRangeSpan?: number;
	/**
	 * The in-progress range start (first click, awaiting the second). Span
	 * constraints are measured from this date. Null when no selection is
	 * underway.
	 */
	rangeAnchor?: PlainDate | null;
}

/** Return type for the `useCalendarConstraints` hook. */
export interface UseCalendarConstraintsReturn {
	/** Check if a PlainDate is disabled */
	readonly isDateDisabled: (date: PlainDate) => boolean;
	/** Parsed min date (or null) */
	readonly minDate: PlainDate | null;
	/** Parsed max date (or null) */
	readonly maxDate: PlainDate | null;
}

/**
 * Hook for managing calendar date validation constraints.
 *
 * Provides a function to check if a date is disabled based on min/max bounds,
 * range-span bounds, and custom constraint functions.
 *
 * @example
 * ```ts
 * const constraints = useCalendarConstraints(() => ({
 *   min: '2026-01-01',
 *   max: '2026-12-31',
 *   dateConstraints: [(date) => date.getDay() !== 0], // No Sundays (receives a native Date)
 *   maxRangeSpan: 7, // once a start is picked, cap the window at 7 days
 *   rangeAnchor // the in-progress start (null before the first click)
 * }));
 *
 * if (constraints.isDateDisabled({ year: 2026, month: 6, day: 15 })) {
 *   // not selectable
 * }
 * ```
 */
export function useCalendarConstraints(
	options: () => UseCalendarConstraintsOptions
): UseCalendarConstraintsReturn {
	const minDate = $derived.by(() => {
		const { min } = options();
		return min ? plainDateFromISO(min) : null;
	});
	const maxDate = $derived.by(() => {
		const { max } = options();
		return max ? plainDateFromISO(max) : null;
	});

	function isDateDisabled(date: PlainDate): boolean {
		// Check min bound
		if (minDate && plainDateIsBefore(date, minDate)) {
			return true;
		}

		// Check max bound
		if (maxDate && plainDateIsAfter(date, maxDate)) {
			return true;
		}

		// Range-span bounds, measured from the in-progress start. Spans count both
		// endpoints (a span of 7 spans a 7-day window), so the reachable distance
		// from the anchor is `span - 1` days in either direction. Only active once a
		// start is picked — before that, every day stays pickable.
		const { maxRangeSpan, minRangeSpan, rangeAnchor } = options();
		if (rangeAnchor) {
			const distance = Math.abs(plainDateDiffDays(rangeAnchor, date));
			if (maxRangeSpan != null && distance > maxRangeSpan - 1) {
				return true;
			}
			// The anchor itself (distance 0) is never disabled by `minRangeSpan` — it
			// is the picked start, and disabling it would render the active selection
			// start as aria-disabled to keyboard and screen-reader users.
			if (minRangeSpan != null && distance > 0 && distance < minRangeSpan - 1) {
				return true;
			}
		}

		// Check custom constraints (convert to Date for public API compatibility)
		const { dateConstraints } = options();
		if (dateConstraints) {
			for (const constraint of dateConstraints) {
				if (!constraint(plainDateToDate(date))) {
					return true;
				}
			}
		}

		return false;
	}

	return {
		isDateDisabled,
		get minDate() {
			return minDate;
		},
		get maxDate() {
			return maxDate;
		}
	};
}
