<script lang="ts" module>
	import type { KeyboardEventHandler } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type {
		DateRange,
		DayOfWeek,
		DayOfWeekName,
		ISODateString
	} from '../../utils/date-types.js';

	// Upstream's `Calendar.tsx` re-exports `ISODateString`/`DayOfWeek`/
	// `DayOfWeekName`/`DateRange` from `utils/dateTypes`, and `Calendar/index.ts`
	// carries them to the package root.
	//
	// **This file re-exports none of them, and the published surface is unchanged.**
	// `src/lib/index.ts` names all four directly from `utils/date-types.js` — the
	// same declaration Calendar would have forwarded — so the root still publishes
	// each exactly once, which is the contract. The indirection is dropped because
	// a type re-export inside a `<script module>` trips `no-import-assign` in both
	// its forms (over an imported binding, *and* as `export type { … } from '…'`,
	// where there is no import at all). Aliasing instead — the arrangement
	// `NumberInput`/`TimeInput` use for `InputStatus` — is what the rest of the
	// repo does and what avoids the false positive.

	/**
	 * The imperative handle a `Calendar` exposes.
	 *
	 * Upstream reaches it through a `handleRef` prop and `useImperativeHandle`;
	 * Svelte's counterpart is the component instance itself, so this is an
	 * instance export and `bind:this` is the seam — the arrangement `Tokenizer`
	 * and `SideNav` already established. There is therefore no `handleRef` prop;
	 * the type still describes exactly what upstream's does.
	 *
	 * @example
	 * ```svelte
	 * let calendar: CalendarHandle;
	 * <Calendar bind:this={calendar} />
	 * <button onclick={() => calendar.navigateTo('2026-03-01')}>March</button>
	 * ```
	 */
	export interface CalendarHandle {
		/** Navigate the calendar to show the month containing the given date. */
		navigateTo: (date: ISODateString) => void;
	}

	/** Props shared by both selection modes. */
	interface CalendarBaseProps extends Omit<BaseProps<HTMLDivElement>, 'onchange' | 'defaultValue'> {
		/** Number of months to display (default: 1) */
		numberOfMonths?: 1 | 2;
		/** Minimum selectable date in ISO format */
		min?: ISODateString;
		/** Maximum selectable date in ISO format */
		max?: ISODateString;
		/**
		 * Custom date constraint functions. Date is disabled if ANY function returns false.
		 * Use for complex rules like "weekdays only" or "no holidays".
		 */
		dateConstraints?: ReadonlyArray<(date: Date) => boolean>;
		/**
		 * Range mode only. Maximum number of days a selected range may span,
		 * counting both endpoints — `maxRangeSpan={7}` allows a 7-day window
		 * (start + 6 days). Once a start date is picked, days beyond this distance
		 * from it are disabled in either direction; before a start is picked every
		 * otherwise-valid day stays selectable. Use for rolling windows like "at
		 * most a week from the chosen day". For fixed calendar bounds use
		 * `min`/`max`.
		 */
		maxRangeSpan?: number;
		/**
		 * Range mode only. Minimum number of days a selected range must span,
		 * counting both endpoints — `minRangeSpan={2}` forbids a single-day range.
		 * Once a start date is picked, days closer than this to it are disabled —
		 * except the start itself, which stays selectable as the active anchor.
		 * Defaults to 1 (a same-day start and end is allowed).
		 */
		minRangeSpan?: number;
		/**
		 * Controlled focus date (which month is visible).
		 * If not provided, defaults to selected date or today.
		 */
		focusDate?: ISODateString;
		/** Callback when visible month changes via navigation */
		onFocusDateChange?: (focusDate: ISODateString) => void;
		/**
		 * Show days from adjacent months (grayed out).
		 * Default: true
		 */
		hasOutsideDays?: boolean;
		/**
		 * Show ISO week numbers in a side column.
		 * Default: false
		 */
		hasWeekNumbers?: boolean;
		/**
		 * Use variable rows per month vs. fixed 6-row grid.
		 * Default: false (fixed 6 rows for consistent height)
		 */
		hasVariableRowCount?: boolean;
		/**
		 * First day of week. Accepts a number (0 = Sunday … 6 = Saturday) or a
		 * three-letter day name ('sun'–'sat', case-insensitive) for readability.
		 * Default: 0 (Sunday)
		 */
		weekStartsOn?: DayOfWeek | DayOfWeekName;
		/**
		 * Fired on keydown. Composed with the component's own Escape handler
		 * (which cancels an in-progress range selection) rather than replacing it,
		 * so a caller's handler runs first and both run. Lowercase because it is
		 * composed onto the root element; upstream names it `onKeyDown`.
		 */
		onkeydown?: KeyboardEventHandler<HTMLDivElement>;
	}

	interface CalendarSingleProps extends CalendarBaseProps {
		/** Selection mode */
		mode?: 'single';
		/** Selected date in ISO format (YYYY-MM-DD) */
		value?: ISODateString;
		/** Default value for uncontrolled mode */
		defaultValue?: ISODateString;
		/** Callback when date is selected */
		onChange?: (value: ISODateString, valueAsDate: Date) => void;
	}

	interface CalendarRangeProps extends CalendarBaseProps {
		/** Selection mode */
		mode: 'range';
		/** Selected date range */
		value?: DateRange;
		/** Default value for uncontrolled mode */
		defaultValue?: DateRange;
		/** Callback when range is selected */
		onChange?: (value: DateRange) => void;
	}

	/**
	 * A discriminated union on `mode`, as upstream. The two constituent types stay
	 * unexported because upstream exports only the union.
	 */
	export type CalendarProps = CalendarSingleProps | CalendarRangeProps;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
	import { normalizeDayOfWeek, type PlainDate } from '../../utils/date-types.js';
	import {
		DATE_FORMAT_MONTH_YEAR,
		DATE_FORMAT_WITH_WEEKDAY,
		plainDateAddDays,
		plainDateAddMonths,
		plainDateFormat,
		plainDateFromISO,
		plainDateIsBefore,
		plainDateIsEqual,
		plainDateSetFirstOfMonth,
		plainDateToDate,
		plainDateToISO,
		plainDateToday
	} from '../../utils/plain-date.js';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import { getInitialFocusDate } from './get-initial-focus-date.js';
	import MonthGrid from './month-grid.svelte';
	import {
		calendarAttrs,
		calendarHeaderAttrs,
		calendarMonthsContainerAttrs,
		calendarMonthYearLabelAttrs,
		calendarNavIconAttrs
	} from './calendar.stylex.js';

	/**
	 * A calendar for selecting a date or a date range.
	 *
	 * @example
	 * ```svelte
	 * <Calendar value={selected} onChange={(v) => (selected = v)} />
	 * ```
	 */
	let {
		mode = 'single',
		value,
		defaultValue,
		onChange,
		numberOfMonths: numberOfMonthsProp = 1,
		min,
		max,
		dateConstraints,
		maxRangeSpan,
		minRangeSpan,
		focusDate: focusDateProp,
		onFocusDateChange,
		hasOutsideDays = true,
		hasWeekNumbers = false,
		hasVariableRowCount = false,
		weekStartsOn: weekStartsOnProp = 0,
		xstyle,
		class: className,
		style: styleProp,
		onkeydown,
		...rest
	}: CalendarProps = $props();

	const t = useTranslator();
	const locale = useLocale();

	// Normalize `weekStartsOn` (number or three-letter day name) to a numeric
	// DayOfWeek so all downstream date math keeps working with an index.
	const weekStartsOn = $derived(normalizeDayOfWeek(weekStartsOnProp));

	// `numberOfMonths` is typed `1 | 2`; defensively clamp anything else that
	// slips through at runtime to 1 so the month loop can't render an absurd
	// number of grids (e.g. `numberOfMonths={1000}`).
	const numberOfMonths = $derived(numberOfMonthsProp === 2 ? 2 : 1);

	// Today's date, resolved once at init. Upstream's `useMemo(…, [])`.
	//
	// This is deliberately *not* deferred to an `$effect` or gated on `browser`:
	// the seeded roving tab stop, `aria-current="date"` and the today styling all
	// read it during the first render, so moving it would change the first paint
	// relative to upstream. It does mean the server's clock and timezone decide
	// what the server calls "today" — an inherited hydration hazard, recorded
	// under Known debts rather than diverged from.
	const today = plainDateToday();

	// Internal state for uncontrolled mode.
	let internalValue = $state<ISODateString | DateRange | undefined>(defaultValue);

	// Range selection in progress (first click made, waiting for second).
	let rangeSelectionStart = $state<ISODateString | null>(null);

	// Hovered date for the range preview.
	let hoveredDate = $state<ISODateString | null>(null);

	// Pending focus target after month navigation.
	let pendingFocus = $state<ISODateString | null>(null);

	const effectiveValue = $derived(value !== undefined ? value : internalValue);

	// Focus date state (which month is visible). Seeded once, as upstream's lazy
	// `useState` initialiser is: `focusDate` → the effective value (a range
	// unwraps to its `start`) → today, clamped into the min/max window so a
	// window that doesn't contain today doesn't open on an all-disabled month.
	//
	// Capturing the first render's props is the point — upstream's initialiser
	// runs once and later prop changes must not move the visible month — so the
	// one-shot reads here are deliberate (`touch-date-field.svelte`'s precedent).
	// svelte-ignore state_referenced_locally
	let internalFocusDate = $state<PlainDate>(
		getInitialFocusDate({
			focusDate: focusDateProp,
			value: effectiveValue,
			min,
			max,
			numberOfMonths,
			today
		})
	);

	// Focus is controlled only when *both* are supplied. `focusDate` alone leaves
	// focus internal, seeded from it on the first render — upstream's test, both
	// halves.
	const isControlledFocus = $derived(
		focusDateProp !== undefined && onFocusDateChange !== undefined
	);
	const focusDate = $derived(
		isControlledFocus && focusDateProp ? plainDateFromISO(focusDateProp) : internalFocusDate
	);

	/**
	 * Upstream's `useImperativeHandle(handleRef, …)`. Svelte's counterpart to an
	 * imperative handle is the component instance, so this is an instance export
	 * reached through `bind:this` rather than a `handleRef` prop.
	 */
	export function navigateTo(date: ISODateString): void {
		if (isControlledFocus) {
			onFocusDateChange?.(date);
		} else {
			internalFocusDate = plainDateFromISO(date);
		}
	}

	// Base month (first day of focus month).
	const baseMonth = $derived(plainDateSetFirstOfMonth(focusDate));

	const visibleMonths = $derived(
		Array.from({ length: numberOfMonths }, (_, i) => plainDateAddMonths(baseMonth, i))
	);

	const monthYearLabel = $derived.by(() => {
		if (numberOfMonths === 1) {
			return plainDateFormat(visibleMonths[0], DATE_FORMAT_MONTH_YEAR, locale());
		}
		return visibleMonths
			.map((m) => plainDateFormat(m, DATE_FORMAT_MONTH_YEAR, locale()))
			.join(' – ');
	});

	let monthsContainer = $state<HTMLDivElement | null>(null);

	/**
	 * Move focus onto the newly visible month after a keyboard month change.
	 *
	 * **This runs here rather than in `MonthGrid`, and the difference is not
	 * cosmetic.** Upstream passes `pendingFocus` and an `onPendingFocusHandled`
	 * callback to *every* pane, and each pane's `useEffect` searches its own grid,
	 * falls back to its own first enabled button, focuses it and clears the flag.
	 * React effects run against committed props, so the first pane clearing the
	 * flag does not stop the others: every pane runs, and the **last one wins**.
	 *
	 * A Svelte child reads the parent's `$state` live, so the first pane's clear
	 * would be visible to the second immediately and only one pane would ever run.
	 * With `numberOfMonths={2}` — which is `DateRangeInput`'s default — paging
	 * forward from the right-hand pane put the target seven days past the left
	 * pane's window, so the left pane found nothing, focused its own first day and
	 * cleared the flag before the right pane (which *did* contain the target) got
	 * a turn.
	 *
	 * So the pass is hoisted to the parent and walks the panes in DOM order,
	 * applying each pane's rule in turn. That reproduces upstream's sequence
	 * exactly, last-writer-wins included — the intermediate `.focus()` calls are
	 * not observable, since no paint happens between them.
	 */
	function runPendingFocus(target: ISODateString): void {
		if (!monthsContainer) {
			return;
		}

		const targetIso = plainDateToISO(plainDateFromISO(target));

		for (const grid of monthsContainer.querySelectorAll<HTMLElement>('[role="grid"]')) {
			const buttons = grid.querySelectorAll<HTMLElement>('button:not([disabled])');

			let targetButton: HTMLElement | null = null;
			for (const button of buttons) {
				if (button.getAttribute('data-date') === targetIso) {
					targetButton = button;
					break;
				}
			}

			if (!targetButton && buttons.length > 0) {
				targetButton = buttons[0];
			}

			targetButton?.focus();
		}
	}

	// Only `pendingFocus` is a dependency; the rest is DOM reads, and `untrack`
	// keeps the effect from re-running on unrelated grid changes — which would
	// steal focus back mid-interaction. Upstream's dependency array says the same.
	$effect(() => {
		const target = pendingFocus;
		if (!target) {
			return;
		}
		untrack(() => {
			runPendingFocus(target);
			pendingFocus = null;
		});
	});

	// Announce the newly visible month to screen readers whenever it changes.
	// The visible month label (`<span>`) carries no live semantics, so paging the
	// grid — via the header prev/next buttons, keyboard grid paging (arrow keys
	// across a month boundary, PageUp/PageDown), the `navigateTo` handle, or a
	// controlled `focusDate` change — otherwise updates the grid silently. Keying
	// off `monthYearLabel` reuses the existing single-/multi-month formatting and
	// only fires when the visible month actually changes (so selecting a date,
	// which does not move the grid, stays silent). The first-render guard avoids
	// announcing the initial month on mount.
	//
	// A plain `let`, not `$state`: it is written from inside the effect and must
	// not be a dependency of it, which is exactly what upstream's `useRef` buys.
	const announce = useAnnounce();
	let isInitialRender = true;
	$effect(() => {
		const label = monthYearLabel;
		if (isInitialRender) {
			isInitialRender = false;
			return;
		}
		announce(label);
	});

	// Whether prev/next navigation is possible given min/max.
	const canNavigatePrevious = $derived.by(() => {
		if (!min) {
			return true;
		}
		const minDate = plainDateFromISO(min);
		// Can't go back if min is in the current focus month.
		return (
			minDate.year < baseMonth.year ||
			(minDate.year === baseMonth.year && minDate.month < baseMonth.month)
		);
	});

	const canNavigateNext = $derived.by(() => {
		if (!max) {
			return true;
		}
		const maxDate = plainDateFromISO(max);
		// Check against the last visible month, not just baseMonth.
		const lastVisibleMonth = plainDateAddMonths(baseMonth, numberOfMonths - 1);
		return (
			maxDate.year > lastVisibleMonth.year ||
			(maxDate.year === lastVisibleMonth.year && maxDate.month > lastVisibleMonth.month)
		);
	});

	function navigateMonth(delta: number, focusedDate?: ISODateString, offset?: number): void {
		const newPd = plainDateAddMonths(baseMonth, delta);
		const newISO = plainDateToISO(newPd);

		// Target focus date, when a focused date was provided.
		if (focusedDate) {
			const currentPd = plainDateFromISO(focusedDate);
			const daysToMove = offset ?? 7;
			const targetPd = plainDateAddDays(currentPd, delta * daysToMove);
			pendingFocus = plainDateToISO(targetPd);
		}

		// Note this tests `onFocusDateChange` alone, *not* `isControlledFocus` —
		// a caller passing only the callback gets notified without the month
		// moving. Upstream's own behaviour, replicated rather than corrected.
		if (onFocusDateChange) {
			onFocusDateChange(newISO);
		} else {
			internalFocusDate = newPd;
		}
	}

	// Escape cancels an in-progress range selection.
	function handleCalendarKeyDown(e: KeyboardEvent): void {
		if (mode === 'range' && rangeSelectionStart !== null && e.key === 'Escape') {
			rangeSelectionStart = null;
			e.preventDefault();
			e.stopPropagation();
		}
	}

	// `composeEventHandlers(onKeyDown, handleCalendarKeyDown)` upstream: the
	// caller's handler runs first, then ours, and ours is skipped if the caller
	// called `preventDefault()`.
	function handleRootKeyDown(e: KeyboardEvent): void {
		onkeydown?.(e as Parameters<NonNullable<typeof onkeydown>>[0]);
		if (!e.defaultPrevented) {
			handleCalendarKeyDown(e);
		}
	}

	function handleDayClick(date: PlainDate): void {
		const iso = plainDateToISO(date);

		if (mode === 'single') {
			internalValue = iso;
			(onChange as CalendarSingleProps['onChange'])?.(iso, plainDateToDate(date));
		} else {
			// Range mode
			if (rangeSelectionStart === null) {
				// First click — start the range. Nothing else about this pick is
				// perceivable non-visually (WCAG 1.3.1) — the grid doesn't move, so the
				// month-change announcement stays silent — so speak the range progress
				// through the same polite live region.
				rangeSelectionStart = iso;
				announce(
					t('@astryx.calendar.rangeStartAnnounce', {
						date: plainDateFormat(date, DATE_FORMAT_WITH_WEEKDAY, locale())
					})
				);
			} else {
				// Second click — complete the range.
				const startPd = plainDateFromISO(rangeSelectionStart);

				// Clicking the anchor again clears the in-progress start rather than
				// committing a zero-length range. This is also the escape hatch when
				// `minRangeSpan` disables the days around the anchor: without it the
				// anchor would be the only clickable day left and the start could never
				// be moved. `minRangeSpan` leaves the anchor itself enabled precisely so
				// this toggle stays reachable.
				if (plainDateIsEqual(date, startPd)) {
					rangeSelectionStart = null;
					announce(
						t('@astryx.calendar.rangeClearedAnnounce', {
							date: plainDateFormat(date, DATE_FORMAT_WITH_WEEKDAY, locale())
						})
					);
					return;
				}

				let start: ISODateString;
				let end: ISODateString;

				// Ensure start <= end.
				if (plainDateIsBefore(date, startPd)) {
					start = iso;
					end = rangeSelectionStart;
				} else {
					start = rangeSelectionStart;
					end = iso;
				}

				const range: DateRange = { start, end };
				internalValue = range;
				rangeSelectionStart = null;
				(onChange as CalendarRangeProps['onChange'])?.(range);
				// Completed-range announcement, in chronological order (matches the
				// swapped {start, end} above even for a reverse pick).
				announce(
					t('@astryx.calendar.rangeCompleteAnnounce', {
						start: plainDateFormat(plainDateFromISO(start), DATE_FORMAT_WITH_WEEKDAY, locale()),
						end: plainDateFormat(plainDateFromISO(end), DATE_FORMAT_WITH_WEEKDAY, locale())
					})
				);
			}
		}
	}

	const theme = $derived(themeProps('calendar', { mode }));
	const rootAttrs = $derived(calendarAttrs(xstyle));
	const headerAttrs = calendarHeaderAttrs();
	const labelAttrs = calendarMonthYearLabelAttrs();
	const monthsAttrs = calendarMonthsContainerAttrs();
	const navIconAttrs = calendarNavIconAttrs();
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	onkeydown={handleRootKeyDown}
>
	<!-- Header with navigation -->
	<div class={headerAttrs.class} style={headerAttrs.style}>
		<Button
			{...themeProps('calendar-nav', {
				nav: 'prev',
				disabled: !canNavigatePrevious ? 'disabled' : null
			})}
			label={t('@astryx.calendar.previousMonth')}
			variant="ghost"
			onclick={() => navigateMonth(-1)}
			isDisabled={!canNavigatePrevious}
			isIconOnly
		>
			{#snippet icon()}
				<!--
					Wrapper span (not Icon props): Icon's string mode clobbers caller
					classNames, so the RTL mirror must live on its own element.
				-->
				<span class={navIconAttrs.class} style={navIconAttrs.style}>
					<Icon icon="chevronLeft" size="sm" color="inherit" />
				</span>
			{/snippet}
		</Button>

		<span class={labelAttrs.class} style={labelAttrs.style}>{monthYearLabel}</span>

		<Button
			{...themeProps('calendar-nav', {
				nav: 'next',
				disabled: !canNavigateNext ? 'disabled' : null
			})}
			label={t('@astryx.calendar.nextMonth')}
			variant="ghost"
			onclick={() => navigateMonth(1)}
			isDisabled={!canNavigateNext}
			isIconOnly
		>
			{#snippet icon()}
				<span class={navIconAttrs.class} style={navIconAttrs.style}>
					<Icon icon="chevronRight" size="sm" color="inherit" />
				</span>
			{/snippet}
		</Button>
	</div>
	<!-- Month grids -->
	<div bind:this={monthsContainer} class={monthsAttrs.class} style={monthsAttrs.style}>
		{#each visibleMonths as month (`${month.year}-${month.month}`)}
			<MonthGrid
				{month}
				value={effectiveValue}
				{mode}
				{rangeSelectionStart}
				{hoveredDate}
				{min}
				{max}
				{dateConstraints}
				{maxRangeSpan}
				{minRangeSpan}
				{hasOutsideDays}
				{hasWeekNumbers}
				{hasVariableRowCount}
				{weekStartsOn}
				onDayClick={handleDayClick}
				onDayHover={(date) => (hoveredDate = date ? plainDateToISO(date) : null)}
				{today}
				onNavigatePrevious={(focusedDate, offset) => navigateMonth(-1, focusedDate, offset)}
				onNavigateNext={(focusedDate, offset) => navigateMonth(1, focusedDate, offset)}
			/>
		{/each}
	</div>
</div>
