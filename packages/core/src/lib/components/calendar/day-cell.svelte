<script lang="ts" module>
	import type { PlainDate } from '../../utils/date-types.js';
	import type { DayNeighborContinuity } from './day-cell-utils.js';
	import type { CalendarDay } from './use-calendar-days.svelte.js';

	/**
	 * Props for the private `DayCell`.
	 *
	 * Not exported from the barrel, and deliberately so: upstream declares
	 * `DayCellProps` inside `Calendar.tsx` as a file-private interface and
	 * publishes neither it nor the component. This file exists only because Svelte
	 * has no in-file component declaration — the same reason
	 * `LinkProvider/RouterLink.svelte` exists.
	 */
	export interface DayCellProps {
		day: CalendarDay;
		dayIndex: number;
		mode: 'single' | 'range';
		selectedDate: PlainDate | null;
		rangeStart: PlainDate | null;
		rangeEnd: PlainDate | null;
		previewStart: PlainDate | null;
		previewEnd: PlainDate | null;
		today: PlainDate;
		hasOutsideDays: boolean;
		isDisabled: boolean;
		/**
		 * Whether the previous/next day in the same week continues the highlighted
		 * run (range and preview). When a neighbour is disabled or outside the month
		 * it breaks the run, so this day gets an end cap on that side (#2715).
		 */
		neighbors: DayNeighborContinuity;
		/**
		 * Whether this day seeds the initial roving tab stop. `useGridFocus`
		 * (`hasRovingTabIndex`) owns the live tab stop thereafter — it honours an
		 * existing `tabindex="0"` and repairs/moves it on navigation and focus.
		 */
		isTabbable: boolean;
		/**
		 * Whether a range pick is half-finished. It only affects the accessible
		 * name: a day that is both start and end reads as "range start" while the
		 * pick is in progress, and as both once the range is committed.
		 */
		isRangeSelectionInProgress: boolean;
		onDayClick: (date: PlainDate) => void;
		onDayHover: (date: PlainDate | null) => void;
	}
</script>

<script lang="ts">
	import { themeProps } from '../../internal/theme-props.js';
	import { cx } from '../../internal/sx.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
	import { DATE_FORMAT_WITH_WEEKDAY, plainDateFormat } from '../../utils/plain-date.js';
	import {
		computeDayCellState,
		computePreviewRounding,
		computeRangeRounding,
		isEndpoint
	} from './day-cell-utils.js';
	import { dayButtonAttrs, dayCellAttrs, previewBgAttrs, rangeBgAttrs } from './calendar.stylex.js';

	let {
		day,
		dayIndex,
		mode,
		selectedDate,
		rangeStart,
		rangeEnd,
		previewStart,
		previewEnd,
		today,
		hasOutsideDays,
		isDisabled,
		neighbors,
		isTabbable,
		isRangeSelectionInProgress,
		onDayClick,
		onDayHover
	}: DayCellProps = $props();

	const t = useTranslator();
	const locale = useLocale();

	const state = $derived(
		computeDayCellState({
			date: day.date,
			dayIndex,
			mode,
			selectedDate,
			rangeStart,
			rangeEnd,
			previewStart,
			previewEnd,
			today,
			isDisabled,
			isOutside: day.isOutside
		})
	);

	// Selection state has to reach the accessible name: it is otherwise conveyed
	// by the cell's background alone (WCAG 1.3.1). A range still being picked
	// (rangeStart === rangeEnd) reads as "range start" only; a completed one-day
	// range reads as both start and end.
	const dateLabel = $derived(plainDateFormat(day.date, DATE_FORMAT_WITH_WEEKDAY, locale()));
	const dayLabel = $derived(
		state.isSelected
			? t('@astryx.calendar.daySelected', { date: dateLabel })
			: state.isRangeStart && state.isRangeEnd
				? isRangeSelectionInProgress
					? t('@astryx.calendar.dayRangeStart', { date: dateLabel })
					: t('@astryx.calendar.dayRangeStartAndEnd', { date: dateLabel })
				: state.isRangeStart
					? t('@astryx.calendar.dayRangeStart', { date: dateLabel })
					: state.isRangeEnd
						? t('@astryx.calendar.dayRangeEnd', { date: dateLabel })
						: state.isInRange
							? t('@astryx.calendar.dayInRange', { date: dateLabel })
							: dateLabel
	);

	const endpoint = $derived(isEndpoint(state));
	const rangeRounding = $derived(
		computeRangeRounding(state, {
			prevInRange: neighbors.prevInRange,
			nextInRange: neighbors.nextInRange
		})
	);
	const previewRounding = $derived(
		computePreviewRounding(state, {
			prevInPreview: neighbors.prevInPreview,
			nextInPreview: neighbors.nextInPreview
		})
	);

	const cellAttrs = dayCellAttrs();
	const rangeAttrs = $derived(
		rangeBgAttrs({
			isRangeStart: state.isRangeStart,
			isRangeEnd: state.isRangeEnd,
			roundStart: rangeRounding.roundStart,
			roundEnd: rangeRounding.roundEnd
		})
	);
	const previewAttrs = $derived(
		previewBgAttrs({
			isPreviewStart: state.isPreviewStart,
			isPreviewEnd: state.isPreviewEnd,
			roundStart: previewRounding.roundStart,
			roundEnd: previewRounding.roundEnd
		})
	);
	// Which today-ring the cell draws, as a themeable state:
	//   'today-only'     → today, not selected, not in a range
	//   'today-in-range' → today, not single-selected, inside a range
	// `isSelected` is single-select only (see `computeDayCellState`), so a today
	// range endpoint still shows the today-in-range ring — `marker` mirrors the
	// StyleX conditions exactly, preserving the default rendering.
	const showsTodayRing = $derived(state.isToday && !state.isSelected && !state.isInRange);
	const showsTodayInRangeRing = $derived(state.isToday && !state.isSelected && state.isInRange);
	const markerState = $derived<'today-only' | 'today-in-range' | null>(
		showsTodayRing ? 'today-only' : showsTodayInRangeRing ? 'today-in-range' : null
	);

	const buttonTheme = $derived(
		themeProps('calendar-day', {
			selected: endpoint ? 'selected' : null,
			today: state.isToday ? 'today' : null,
			disabled: state.effectivelyDisabled ? 'disabled' : null,
			'in-range': state.isInRange ? 'in-range' : null,
			marker: markerState
		})
	);
	const buttonAttrs = $derived(
		dayButtonAttrs({
			isOutside: day.isOutside,
			isToday: state.isToday,
			isSelected: state.isSelected,
			isInRange: state.isInRange,
			isEndpoint: endpoint,
			effectivelyDisabled: state.effectivelyDisabled
		})
	);
</script>

{#if day.isOutside && !hasOutsideDays}
	<!--
		Empty placeholder cell — still a gridcell so the grid geometry stays a
		clean 7-per-row set for keyboard navigation.
	-->
	<div role="gridcell" class={cellAttrs.class} style={cellAttrs.style}></div>
{:else}
	<div
		role="gridcell"
		aria-selected={state.isSelected || state.isInRange || undefined}
		class={cellAttrs.class}
		style={cellAttrs.style}
	>
		<!-- Range background -->
		{#if state.isInRange}
			<div class={rangeAttrs.class} style={rangeAttrs.style}></div>
		{/if}

		<!-- Preview range background -->
		{#if state.isInPreview}
			<div class={previewAttrs.class} style={previewAttrs.style}></div>
		{/if}

		<!-- Day button -->
		<button
			type="button"
			data-date={day.iso}
			aria-label={dayLabel}
			aria-disabled={state.effectivelyDisabled || undefined}
			{...buttonTheme}
			class={cx(buttonTheme.class, buttonAttrs.class)}
			style={buttonAttrs.style}
			aria-current={state.isToday ? 'date' : undefined}
			disabled={isDisabled}
			tabindex={isTabbable ? 0 : -1}
			onclick={() => !state.effectivelyDisabled && onDayClick(day.date)}
			onmouseenter={() => !state.effectivelyDisabled && onDayHover(day.date)}
			onmouseleave={() => onDayHover(null)}
		>
			{day.dayNumber}
		</button>
	</div>
{/if}
