<script lang="ts" module>
	export interface MonthYearWheelsProps {
		/** The month the wheels currently show. */
		monthIndex: number;
		/** First reachable month. */
		minMonthIndex: number;
		/** Last reachable month. */
		maxMonthIndex: number;
		/** Fired when either wheel comes to rest on a new month. */
		onChange: (monthIndex: number) => void;
		/** Accessible name for the month wheel. */
		monthLabel: string;
		/** Accessible name for the year wheel. */
		yearLabel: string;
		/** False while the panel is hidden. */
		isActive?: boolean;
	}
</script>

<script lang="ts">
	import { DATE_FORMAT_MONTH_ONLY, plainDateFormat } from '../../utils/plain-date.js';
	import Wheel, { type WheelOption } from './wheel.svelte';
	import { fromMonthIndex, toMonthIndex } from './month-geometry.js';
	import { monthYearWheelsAttrs } from './month-year-wheels.stylex.js';

	/**
	 * Month and year wheels, bounded by the same range as the scroller. Ported
	 * from Astryx's `DateInput/MonthYearWheels.tsx`.
	 *
	 * The shortcut out of continuous scrolling. Scrolling is the right gesture
	 * for "a month or two either way" and the wrong one for "December 2019", so
	 * the header title opens this instead: two wheels, one flick each.
	 *
	 * Internal to `DateInput`; not exported from the barrel, exactly as upstream
	 * keeps it out of `DateInput/index.ts`.
	 */
	let {
		monthIndex,
		minMonthIndex,
		maxMonthIndex,
		onChange,
		monthLabel,
		yearLabel,
		isActive = true
	}: MonthYearWheelsProps = $props();

	const parts = $derived(fromMonthIndex(monthIndex));

	// Day 15 of a fixed year: no timezone can push it into an adjacent month
	// the way day 1 or day 31 can.
	//
	// `plainDateFormat` rather than a raw `Intl.DateTimeFormat`, which the
	// shared lint rule forbids and which would duplicate the format vocabulary
	// besides. It resolves the locale itself, so there is nothing here for the
	// memo to depend on — the same is true of Calendar's own month labels, and
	// is why this list is constant for the life of the component. (Upstream's
	// `useMemo(…, [])`; a plain module-free constant here, computed once at
	// init for the same reason.)
	const monthNames = Array.from({ length: 12 }, (_, index) =>
		plainDateFormat({ year: 2021, month: index + 1, day: 15 }, DATE_FORMAT_MONTH_ONLY)
	);

	// Months outside the range stay on the wheel rather than vanishing: a list
	// whose length changes with the year would jump under the finger.
	const monthOptions: WheelOption[] = $derived(
		monthNames.map((name, index) => {
			const candidate = toMonthIndex(parts.year, index + 1);
			return {
				value: index + 1,
				label: name,
				isDisabled: candidate < minMonthIndex || candidate > maxMonthIndex
			};
		})
	);

	const yearOptions: WheelOption[] = $derived.by(() => {
		const first = fromMonthIndex(minMonthIndex).year;
		const last = fromMonthIndex(maxMonthIndex).year;
		const out: WheelOption[] = [];
		for (let candidate = first; candidate <= last; candidate++) {
			out.push({
				value: candidate,
				label: String(candidate),
				// A year is reachable when any of its months is.
				isDisabled:
					toMonthIndex(candidate, 12) < minMonthIndex || toMonthIndex(candidate, 1) > maxMonthIndex
			});
		}
		return out;
	});

	const attrs = monthYearWheelsAttrs();
</script>

<div class={attrs.class} style={attrs.style}>
	<Wheel
		label={monthLabel}
		options={monthOptions}
		value={parts.month}
		{isActive}
		onChange={(nextMonth) => onChange(toMonthIndex(parts.year, nextMonth))}
	/>
	<Wheel
		label={yearLabel}
		options={yearOptions}
		value={parts.year}
		{isActive}
		onChange={(nextYear) => {
			// Jan 31 -> Feb has no equivalent here (months carry no day), but a
			// year change can still land outside the range; clamp to it.
			const candidate = toMonthIndex(nextYear, parts.month);
			onChange(Math.min(Math.max(candidate, minMonthIndex), maxMonthIndex));
		}}
	/>
</div>
