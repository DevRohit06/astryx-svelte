import type { ISODateString, PlainDate } from '../../utils/date-types.js';
import {
	DATE_FORMAT_MONTH_YEAR,
	plainDateAddDays,
	plainDateAddMonths,
	plainDateFormat,
	plainDateFromISO,
	plainDateSetFirstOfMonth,
	plainDateToISO,
	plainDateToday
} from '../../utils/plain-date.js';

/**
 * Ported from Astryx's `Calendar/hooks/useCalendarNavigation.ts`.
 *
 * Options arrive as a getter, for the reason `useCalendarDays` documents. Two
 * things about the translation are worth naming:
 *
 * - **`internalFocusDate` is seeded once, not derived.** Upstream's lazy
 *   `useState` initialiser runs on the first render only, so a later change to
 *   `initialValue` does *not* move the visible month. A `$derived` here would
 *   have made it move, which is a different component. `$state` with an
 *   init-time seed is the exact counterpart.
 * - **The controlled test is upstream's, both halves.** Focus is controlled only
 *   when `focusDate` *and* `onFocusDateChange` are both supplied; supplying one
 *   alone falls through to the internal state. `navigateMonth` mirrors that with
 *   its own `onFocusDateChange` test rather than reusing `isControlledFocus`, so
 *   a caller passing only `onFocusDateChange` gets notified without the month
 *   ever moving — replicated, not corrected, because upstream's own tests pin it.
 */

/** Configuration for calendar navigation. */
export interface UseCalendarNavigationOptions {
	/** Initial value to determine starting month */
	initialValue?: ISODateString;
	/** Controlled focus date (which month is visible) */
	focusDate?: ISODateString;
	/** Callback when visible month changes */
	onFocusDateChange?: (focusDate: ISODateString) => void;
	/** Number of months to display */
	numberOfMonths?: 1 | 2;
}

/** Return type for the `useCalendarNavigation` hook. */
export interface UseCalendarNavigationReturn {
	/** The base month (first day of the focus month) as a PlainDate */
	readonly baseMonth: PlainDate;
	/** Array of visible months to render as PlainDates */
	readonly visibleMonths: PlainDate[];
	/** Formatted label for the month header */
	readonly monthYearLabel: string;
	/** Navigate to previous/next month */
	navigateMonth: (delta: number, focusedDate?: ISODateString, offset?: number) => void;
	/** Target date to focus after navigation */
	readonly pendingFocus: ISODateString | null;
	/** Clear the pending focus */
	clearPendingFocus: () => void;
}

/**
 * Hook for managing calendar month navigation.
 *
 * Handles the current focus date (which month is visible), previous/next
 * navigation, and pending focus for keyboard navigation across months.
 *
 * @example
 * ```ts
 * const nav = useCalendarNavigation(() => ({ initialValue: '2026-01-15', numberOfMonths: 1 }));
 *
 * nav.navigateMonth(1);            // next month
 * nav.navigateMonth(1, focused, 1); // from an arrow key, horizontal offset
 * nav.navigateMonth(1, focused, 7); // vertical offset
 * ```
 */
export function useCalendarNavigation(
	options: () => UseCalendarNavigationOptions
): UseCalendarNavigationReturn {
	// Pending focus target after month navigation.
	let pendingFocus = $state<ISODateString | null>(null);

	// Internal focus date state. Seeded once at init, as upstream's lazy
	// `useState` initialiser is — see the note at the top of the file.
	const seed = options();
	let internalFocusDate = $state<PlainDate>(
		seed.focusDate
			? plainDateFromISO(seed.focusDate)
			: seed.initialValue
				? plainDateFromISO(seed.initialValue)
				: plainDateToday()
	);

	const focusDate = $derived.by((): PlainDate => {
		const { focusDate: focusDateProp, onFocusDateChange } = options();
		const isControlledFocus = focusDateProp !== undefined && onFocusDateChange !== undefined;
		return isControlledFocus ? plainDateFromISO(focusDateProp) : internalFocusDate;
	});

	// Base month (first day of focus month).
	const baseMonth = $derived(plainDateSetFirstOfMonth(focusDate));

	const visibleMonths = $derived.by(() => {
		const numberOfMonths = options().numberOfMonths ?? 1;
		return Array.from({ length: numberOfMonths }, (_, i) => plainDateAddMonths(baseMonth, i));
	});

	const monthYearLabel = $derived.by(() => {
		const numberOfMonths = options().numberOfMonths ?? 1;
		if (numberOfMonths === 1) {
			return plainDateFormat(visibleMonths[0], DATE_FORMAT_MONTH_YEAR);
		}
		return visibleMonths.map((m) => plainDateFormat(m, DATE_FORMAT_MONTH_YEAR)).join(' – ');
	});

	function navigateMonth(delta: number, focusedDate?: ISODateString, offset?: number): void {
		const newMonth = plainDateAddMonths(baseMonth, delta);
		const newISO = plainDateToISO(newMonth);

		// Target focus date, when one was provided.
		if (focusedDate) {
			const currentDate = plainDateFromISO(focusedDate);
			// The provided offset (1 for horizontal, 7 for vertical).
			const daysToMove = offset ?? 7;
			const targetDate = plainDateAddDays(currentDate, delta * daysToMove);
			pendingFocus = plainDateToISO(targetDate);
		}

		const { onFocusDateChange } = options();
		if (onFocusDateChange) {
			onFocusDateChange(newISO);
		} else {
			internalFocusDate = newMonth;
		}
	}

	function clearPendingFocus(): void {
		pendingFocus = null;
	}

	return {
		get baseMonth() {
			return baseMonth;
		},
		get visibleMonths() {
			return visibleMonths;
		},
		get monthYearLabel() {
			return monthYearLabel;
		},
		navigateMonth,
		get pendingFocus() {
			return pendingFocus;
		},
		clearPendingFocus
	};
}
