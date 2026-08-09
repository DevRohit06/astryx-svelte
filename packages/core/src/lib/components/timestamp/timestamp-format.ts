/**
 * Value parsing and *relative* formatting for Timestamp, ported from Astryx's
 * `src/Timestamp/Timestamp.tsx`. Kept out of the `.svelte` file so the
 * component stays markup and reactivity, and out of `timestamp.stylex.ts`
 * since none of it is styling.
 *
 * Absolute rendering lives next door in `format-instant.ts` — upstream split it
 * out at 0.2.0 so the visible text and each tooltip line format through one
 * function rather than two switches kept in step by hand.
 *
 * Everything here is a pure function of `(value, now)` — there is no React in
 * the original and no Svelte here, which is what makes the port a transcription
 * rather than a translation.
 */

export type TimestampFormat =
	| 'relative'
	| 'relative_short'
	| 'auto'
	| 'date'
	| 'date_long'
	| 'date_weekday'
	| 'date_time'
	| 'time'
	| 'system_date'
	| 'system_date_time'
	| 'system_time'
	| 'unix_seconds';

/** A format that shows a fixed date/time rather than one relative to now. */
export type AbsoluteTimestampFormat = Exclude<
	TimestampFormat,
	'relative' | 'relative_short' | 'auto'
>;

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Default auto threshold: 7 days in seconds. */
export const DEFAULT_AUTO_THRESHOLD = 7 * DAY;

/**
 * Tolerance (in seconds) for treating a *future* timestamp as the present.
 * A value only a handful of seconds ahead of our reference clock is almost
 * always clock skew — the displayed `now` lagging the real clock, or the value
 * being produced on a slightly faster clock — not a genuine future event, so
 * it reads as "now" rather than a confusing "in a few seconds". The future
 * side gets a wider window than the past (which only needs to absorb the
 * sub-second render-time lag) because future drift is far more likely to be
 * skew than real.
 */
const FUTURE_SKEW_TOLERANCE = 30;

export function parseValue(value: string | number): Date {
	if (typeof value === 'number') {
		// Heuristic: if the number is less than 1e12, treat as seconds; otherwise ms.
		// Unix timestamps in seconds are < 1e12 until ~2286.
		return new Date(value < 1e12 ? value * 1000 : value);
	}
	return new Date(value);
}

export function getRelativeTimeString(date: Date, now: Date): string {
	const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

	// Treat values at (or a hair before/after) the present as "now". The
	// internal `now` reference is captured at render time, so it can lag the
	// real clock; a value equal to "right now" can land a fraction of a second
	// in the future and round to a small negative delta. Without this clamp,
	// such values fall into the future branch and render "in a few seconds".
	if (Math.abs(diffSeconds) < 10) {
		return 'now';
	}

	if (diffSeconds < 0) {
		// Future dates
		const absDiff = Math.abs(diffSeconds);
		// A value only a few seconds ahead of our clock is almost always skew, not
		// a genuine future event — render it as the present rather than a
		// confusing "in a few seconds". Wider than the past window above on
		// purpose (see FUTURE_SKEW_TOLERANCE).
		if (absDiff <= FUTURE_SKEW_TOLERANCE) {
			return 'now';
		}
		if (absDiff < MINUTE) {
			return 'in a few seconds';
		}
		if (absDiff < HOUR) {
			const mins = Math.floor(absDiff / MINUTE);
			return `in ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
		}
		if (absDiff < DAY) {
			const hours = Math.floor(absDiff / HOUR);
			return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
		}
		if (absDiff < MONTH) {
			const days = Math.floor(absDiff / DAY);
			return `in ${days} ${days === 1 ? 'day' : 'days'}`;
		}
		if (absDiff < YEAR) {
			const months = Math.floor(absDiff / MONTH);
			return `in ${months} ${months === 1 ? 'month' : 'months'}`;
		}
		const years = Math.floor(absDiff / YEAR);
		return `in ${years} ${years === 1 ? 'year' : 'years'}`;
	}

	if (diffSeconds < MINUTE) {
		return `${diffSeconds} seconds ago`;
	}
	if (diffSeconds < HOUR) {
		const mins = Math.floor(diffSeconds / MINUTE);
		return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
	}
	if (diffSeconds < DAY) {
		const hours = Math.floor(diffSeconds / HOUR);
		return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
	}
	if (diffSeconds < 2 * DAY) {
		return 'yesterday';
	}
	if (diffSeconds < MONTH) {
		const days = Math.floor(diffSeconds / DAY);
		return `${days} days ago`;
	}
	if (diffSeconds < YEAR) {
		const months = Math.floor(diffSeconds / MONTH);
		return `${months} ${months === 1 ? 'month' : 'months'} ago`;
	}
	const years = Math.floor(diffSeconds / YEAR);
	return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * The compact sibling of `getRelativeTimeString`: the same tier boundaries and
 * present/future-skew handling, rendered with abbreviated units for
 * space-constrained surfaces (chat metadata, dense tables, chips).
 *
 * Units follow the common compact convention (and the Microsoft Style Guide):
 * `s` seconds, `m` minutes, `h` hours, `d` days, `mo` months, `y` years.
 * Months use `mo` — not `m` — because `m` already means minutes; a bare `m`
 * for months would be ambiguous. The value is always numeric (no "yesterday"
 * idiom, which belongs to the long form) so the short form stays predictable
 * and easy to scan. The `ago` / `in` affixes are kept so direction stays
 * unambiguous at a glance.
 */
export function getRelativeTimeShortString(date: Date, now: Date): string {
	const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

	// Present clamp — identical to the long form (see getRelativeTimeString).
	if (Math.abs(diffSeconds) < 10) {
		return 'now';
	}

	if (diffSeconds < 0) {
		// Future dates.
		const absDiff = Math.abs(diffSeconds);
		if (absDiff <= FUTURE_SKEW_TOLERANCE) {
			return 'now';
		}
		if (absDiff < MINUTE) {
			return `in ${absDiff}s`;
		}
		if (absDiff < HOUR) {
			return `in ${Math.floor(absDiff / MINUTE)}m`;
		}
		if (absDiff < DAY) {
			return `in ${Math.floor(absDiff / HOUR)}h`;
		}
		if (absDiff < MONTH) {
			return `in ${Math.floor(absDiff / DAY)}d`;
		}
		if (absDiff < YEAR) {
			return `in ${Math.floor(absDiff / MONTH)}mo`;
		}
		return `in ${Math.floor(absDiff / YEAR)}y`;
	}

	if (diffSeconds < MINUTE) {
		return `${diffSeconds}s ago`;
	}
	if (diffSeconds < HOUR) {
		return `${Math.floor(diffSeconds / MINUTE)}m ago`;
	}
	if (diffSeconds < DAY) {
		return `${Math.floor(diffSeconds / HOUR)}h ago`;
	}
	if (diffSeconds < MONTH) {
		return `${Math.floor(diffSeconds / DAY)}d ago`;
	}
	if (diffSeconds < YEAR) {
		return `${Math.floor(diffSeconds / MONTH)}mo ago`;
	}
	return `${Math.floor(diffSeconds / YEAR)}y ago`;
}

/** Returns the interval (in ms) at which a relative timestamp should update. */
export function getLiveInterval(diffSeconds: number): number {
	const absDiff = Math.abs(diffSeconds);
	if (absDiff < MINUTE) {
		return 1000;
	} // every second
	if (absDiff < HOUR) {
		return 30_000;
	} // every 30s
	if (absDiff < DAY) {
		return 60_000;
	} // every minute
	return 300_000; // every 5 minutes
}

/** Whether a format is non-relative (i.e. shows a fixed date/time). */
export function isAbsoluteFormat(format: TimestampFormat): format is AbsoluteTimestampFormat {
	return format !== 'relative' && format !== 'relative_short' && format !== 'auto';
}

/**
 * Whether a format renders a relative phrase ("2 hours ago" / "2h ago") rather
 * than a fixed instant. Both the long and short relative forms share the same
 * treatment: they get the accessible full-date name, the hover card, and live
 * updates.
 */
export function isRelativeFormat(format: TimestampFormat): format is 'relative' | 'relative_short' {
	return format === 'relative' || format === 'relative_short';
}
