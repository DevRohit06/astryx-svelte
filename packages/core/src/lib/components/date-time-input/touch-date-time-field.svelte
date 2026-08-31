<script lang="ts" module>
	import type { ISODateString } from '../../utils/date-types.js';
	import type { ISOTimeString } from '../../utils/time-parser.js';
	import type { PlainDate } from '../../utils/plain-date.js';
	import type { ISODateTimeString } from './date-time-input.svelte';

	/**
	 * Upstream restates these three in `TouchDateTimeField.tsx` rather than
	 * importing `DateTimeInput.tsx`'s, so this file restates them too — the
	 * pointer surface keeps its own copies in
	 * `pointer-date-time-field.svelte`.
	 */
	function splitDateTime(dt: ISODateTimeString | undefined): {
		date: ISODateString | undefined;
		time: ISOTimeString | undefined;
	} {
		if (!dt) {
			return { date: undefined, time: undefined };
		}
		const tIndex = dt.indexOf('T');
		if (tIndex === -1) {
			return { date: dt as unknown as ISODateString, time: undefined };
		}
		return {
			date: dt.slice(0, tIndex) as ISODateString,
			time: dt.slice(tIndex + 1) as ISOTimeString
		};
	}

	function combineDateTime(
		date: ISODateString | undefined,
		time: ISOTimeString | undefined
	): ISODateTimeString | undefined {
		if (!date || !time) {
			return undefined;
		}
		return `${date}T${time}` as ISODateTimeString;
	}

	function getDefaultTime(hasSeconds: boolean): ISOTimeString {
		const now = new Date();
		return formatISOTime(
			{ hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() },
			hasSeconds
		);
	}

	const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

	function parseValidISODate(date: ISODateString | undefined): PlainDate | null {
		if (date == null || !ISO_DATE.test(date)) {
			return null;
		}
		try {
			return plainDateFromISO(date);
		} catch {
			return null;
		}
	}

	function normalizeISOTime(
		time: ISOTimeString | undefined,
		hasSeconds: boolean
	): ISOTimeString | undefined {
		if (time === undefined) {
			return undefined;
		}
		const parsed = parseISOTime(time);
		return parsed ? formatISOTime(parsed, hasSeconds) : undefined;
	}

	function timeToSeconds(time: ISOTimeString | undefined): number | null {
		if (time === undefined) {
			return null;
		}
		const parsed = parseISOTime(time);
		return parsed == null ? null : parsed.hour * 3600 + parsed.minute * 60 + parsed.second;
	}

	function twoDigits(value: number): string {
		return String(value).padStart(2, '0');
	}

	function hour12From24(hour: number): number {
		return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
	}

	function hour24From12(hour: number, meridiem: number): number {
		if (meridiem === 0) {
			return hour === 12 ? 0 : hour;
		}
		return hour === 12 ? 12 : hour + 12;
	}

	function rangeOverlaps(
		startSecond: number,
		endSecond: number,
		min: ISOTimeString | undefined,
		max: ISOTimeString | undefined
	): boolean {
		const minSecond = timeToSeconds(min);
		const maxSecond = timeToSeconds(max);
		return (
			(minSecond == null || endSecond >= minSecond) &&
			(maxSecond == null || startSecond <= maxSecond)
		);
	}

	type TouchDateTimePanel = 'date' | 'time';
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import type { DateTimeInputProps } from './date-time-input.svelte';
	import type { WheelOption } from '../date-input/wheel.svelte';
	import { normalizeDayOfWeek } from '../../utils/date-types.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { isImeKeyEvent } from '../../utils/ime.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import {
		clampTime,
		formatDisplayTime12h,
		formatDisplayTime24h,
		formatISOTime,
		isTimeInRange,
		parseISOTime
	} from '../../utils/time-parser.js';
	import {
		DATE_FORMAT_LONG,
		DATE_FORMAT_MONTH_YEAR,
		DATE_FORMAT_WEEKDAY_ONLY,
		plainDateFormat,
		plainDateFromISO,
		plainDateToday
	} from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useCalendarConstraints } from '../calendar/use-calendar-constraints.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import BottomSheet from '../bottom-sheet/bottom-sheet.svelte';
	import Button from '../button/button.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import IconButton from '../icon-button/icon-button.svelte';
	import SegmentedControl from '../segmented-control/segmented-control.svelte';
	import SegmentedControlItem from '../segmented-control/segmented-control-item.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import MonthScroller from '../date-input/month-scroller.svelte';
	import MonthYearWheels from '../date-input/month-year-wheels.svelte';
	import Wheel from '../date-input/wheel.svelte';
	import {
		DEFAULT_MONTH_REACH,
		clampIndex,
		fromMonthIndex,
		monthIndexOf
	} from '../date-input/month-geometry.js';
	import {
		touchDateTimeArrowIconAttrs,
		touchDateTimeArrowXstyle,
		touchDateTimeDateSurfaceAttrs,
		touchDateTimeDateSurfaceStackAttrs,
		touchDateTimeDateWrapperAttrs,
		touchDateTimeFooterAttrs,
		touchDateTimeHeaderActionsAttrs,
		touchDateTimeHeaderAttrs,
		touchDateTimeIconButtonAttrs,
		touchDateTimeInputAttrs,
		touchDateTimePanelAttrs,
		touchDateTimePanelStackAttrs,
		touchDateTimeResetButtonXstyle,
		touchDateTimeRowAttrs,
		touchDateTimeSheetBodyAttrs,
		touchDateTimeSurfaceAttrs,
		touchDateTimeTimeWheelsAttrs,
		touchDateTimeTimeWrapperAttrs,
		touchDateTimeTitleAttrs,
		touchDateTimeTitleTextAttrs,
		touchDateTimeWeekdayAttrs,
		touchDateTimeWeekdaysAttrs,
		touchDateTimeWheelSpacerAttrs
	} from './touch-date-time-field.stylex.js';

	/**
	 * The touch half of `DateTimeInput`, ported from Astryx's
	 * `DateTimeInput/TouchDateTimeField.tsx`. It holds `DateTimeInput`'s whole
	 * prop contract so the desktop and touch surfaces are interchangeable. The
	 * desktop-only props `timeIncrement` and `timeOptionInterval` remain accepted
	 * but are intentionally ignored here: time is selected with wheels instead of
	 * a typed field or preset list.
	 *
	 * The closed control is two bordered segments under one label — a date field
	 * and a time field — and either one opens the same bottom sheet, on its own
	 * panel. The Date panel is `DateInput`'s touch picker, month-paged with the
	 * month/year wheels behind its title; the Time panel is a row of wheels.
	 *
	 * Internal to `DateTimeInput`; not exported from the barrel, exactly as
	 * upstream keeps it out of `DateTimeInput/index.ts`.
	 */
	let {
		label,
		isLabelHidden = false,
		description,
		isOptional = false,
		isRequired = false,
		isDisabled = false,
		disabledMessage,
		value,
		onChange,
		changeAction,
		isLoading = false,
		min,
		max,
		dateConstraints,
		hasSeconds = false,
		hourFormat = '12h',
		// Desktop-only: mobile uses wheels instead of typed arrow stepping or a
		// preset list.
		timeIncrement: _timeIncrement,
		timeOptionInterval: _timeOptionInterval,
		hasClear = false,
		placeholder: placeholderFromProps,
		timePlaceholder: timePlaceholderFromProps,
		timeLabel,
		size: sizeProp,
		status,
		labelTooltip,
		// Desktop-only: the touch Date panel shows one swipe-paged month at a time.
		numberOfMonths: _numberOfMonths,
		weekStartsOn: weekStartsOnProp = 0,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateTimeInputProps = $props();

	const t = useTranslator();
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.dateTimeInput.placeholder'));
	const timePlaceholder = $derived(
		timePlaceholderFromProps ?? t('@astryx.dateTimeInput.timePlaceholder')
	);
	const resolvedTimeLabel = $derived(timeLabel ?? t('@astryx.dateTimeInput.timeSuffix', { label }));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	const uid = $props.id();
	const dateInputId = `${uid}-date`;
	const timeInputId = `${uid}-time`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const tooltipID = `${uid}-tooltip`;

	let dateInput = $state<HTMLInputElement | null>(null);
	let timeSegment = $state<HTMLButtonElement | null>(null);
	let scroller = $state<MonthScroller | null>(null);

	// Upstream's `timeSegmentRef`, which it hands to `SegmentedControlItem` as a
	// `ref`. Svelte's `bind:this` on a component yields the instance rather than
	// its element, so the node is captured through an attachment spread into the
	// item's `...rest` — the arrangement `Avatar` already uses to reach a child's
	// element.
	const attachTimeSegment = (node: HTMLButtonElement): (() => void) => {
		timeSegment = node;
		return () => {
			timeSegment = null;
		};
	};

	// Upstream's `useOptimistic` + `useTransition` pair.
	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);
	// Deliberately `isLoading`, not `isBusy`: upstream keeps a pending
	// `changeAction` out of the disabled test here, so the sheet stays usable
	// while a commit is in flight.
	const isEffectivelyDisabled = $derived(isDisabled || isLoading);

	// Only the persistent `isDisabled` state — not the transient busy state —
	// surfaces a reason. The listeners attach to the outer row, which is always
	// present, rather than to either pointer-swallowing input.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant: 'detached' as const
	}));

	// Hand-rolled rather than `getInputARIA`: this component never reads the
	// `InputGroup` context, so there is no group half to merge.
	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			statusIcon.describedBy ?? null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	const minParts = $derived(splitDateTime(min));
	const maxParts = $derived(splitDateTime(max));
	const valueParts = $derived(splitDateTime(optimistic.current));
	const calendarMin = $derived(minParts.date);
	const calendarMax = $derived(maxParts.date);
	const constraints = useCalendarConstraints(() => ({
		min: calendarMin,
		max: calendarMax,
		dateConstraints
	}));

	let isSheetOpen = $state(false);
	let activePanel = $state<TouchDateTimePanel>('date');
	let isWheelOpen = $state(false);
	// The sheet-local time, so a time chosen before any date survives until one
	// exists. Seeded once from the incoming value, exactly as upstream's lazy
	// `useState` initializer is.
	// svelte-ignore state_referenced_locally
	let draftTime = $state<ISOTimeString | undefined>(
		normalizeISOTime(splitDateTime(value).time, hasSeconds)
	);

	// Upstream's `useMemo(() => plainDateToday(), [])`: once, for the life of the
	// component, so the `aria-current` marker cannot move mid-session.
	const today = plainDateToday();

	const selectedDate = $derived(parseValidISODate(valueParts.date));
	const fallbackTime = $derived(getDefaultTime(hasSeconds));
	const normalizedValueTime = $derived(normalizeISOTime(valueParts.time, hasSeconds));
	const timeForWheels = $derived(normalizedValueTime ?? draftTime ?? fallbackTime);
	const parsedWheelTime = $derived(
		parseISOTime(timeForWheels) ?? {
			hour: 0,
			minute: 0,
			second: 0
		}
	);
	const weekStartsOn = $derived(normalizeDayOfWeek(weekStartsOnProp));

	// Mirror an externally controlled time into the sheet-local draft, and let an
	// external clear reset it too.
	$effect(() => {
		const nextTime = normalizedValueTime;
		const current = optimistic.current;
		untrack(() => {
			if (nextTime !== undefined) {
				draftTime = nextTime;
			} else if (current === undefined) {
				draftTime = undefined;
			}
		});
	});

	// The reachable range. Anchored once — this is upstream's state initializer,
	// and recomputing it as the selection moves would shift every pane's scroll
	// offset under the user mid-gesture.
	// svelte-ignore state_referenced_locally
	const anchorMonthIndex = monthIndexOf(
		parseValidISODate(splitDateTime(value).date) ?? plainDateToday()
	);
	const minMonthIndex = $derived(
		calendarMin != null
			? monthIndexOf(plainDateFromISO(calendarMin))
			: anchorMonthIndex - DEFAULT_MONTH_REACH
	);
	const maxMonthIndex = $derived(
		calendarMax != null
			? monthIndexOf(plainDateFromISO(calendarMax))
			: anchorMonthIndex + DEFAULT_MONTH_REACH
	);

	// The bounds are spelled out again rather than read off the `$derived`s
	// above: this is upstream's `useState` initializer, which runs once with the
	// first render's props, and reading a `$derived` here would say the opposite.
	// svelte-ignore state_referenced_locally
	let monthIndex = $state(
		clampIndex(
			anchorMonthIndex,
			splitDateTime(min).date != null
				? monthIndexOf(plainDateFromISO(splitDateTime(min).date as ISODateString))
				: anchorMonthIndex - DEFAULT_MONTH_REACH,
			splitDateTime(max).date != null
				? monthIndexOf(plainDateFromISO(splitDateTime(max).date as ISODateString))
				: anchorMonthIndex + DEFAULT_MONTH_REACH
		)
	);

	const parts = $derived(fromMonthIndex(monthIndex));
	const canStepBack = $derived(monthIndex > minMonthIndex);
	const canStepForward = $derived(monthIndex < maxMonthIndex);

	// `min`/`max` can change underneath the mounted sheet; keep the visible month
	// in range. Converges in one pass: the write only happens when the clamp
	// moved, and re-running finds it already clamped.
	$effect(() => {
		const clamped = clampIndex(monthIndex, minMonthIndex, maxMonthIndex);
		if (clamped !== monthIndex) {
			monthIndex = clamped;
			scroller?.scrollToMonth(clamped, 'auto');
		}
	});

	const dayNames = $derived(
		Array.from({ length: 7 }, (_, offset) =>
			plainDateFormat(
				{ year: 1970, month: 1, day: 4 + ((weekStartsOn + offset) % 7) },
				DATE_FORMAT_WEEKDAY_ONLY
			)
		)
	);
	const monthYearLabel = $derived(
		plainDateFormat({ year: parts.year, month: parts.month, day: 1 }, DATE_FORMAT_MONTH_YEAR)
	);

	const dateDisplayValue = $derived(
		selectedDate == null ? '' : plainDateFormat(selectedDate, DATE_FORMAT_LONG)
	);

	const timeDisplayValue = $derived.by(() => {
		const displayTime = normalizedValueTime ?? draftTime;
		return displayTime
			? (hourFormat === '12h' ? formatDisplayTime12h : formatDisplayTime24h)(
					displayTime,
					hasSeconds
				)
			: '';
	});

	// Time bounds only bite on the boundary days themselves: a 09:00 minimum on
	// 1 March constrains 1 March and no other date.
	function timeBoundsForDate(date: ISODateString | undefined): {
		min: ISOTimeString | undefined;
		max: ISOTimeString | undefined;
	} {
		return {
			min: date != null && minParts.date === date && minParts.time ? minParts.time : undefined,
			max: date != null && maxParts.date === date && maxParts.time ? maxParts.time : undefined
		};
	}

	function clampTimeForDate(date: ISODateString | undefined, time: ISOTimeString): ISOTimeString {
		const bounds = timeBoundsForDate(date);
		return clampTime(time, bounds.min, bounds.max, hasSeconds);
	}

	/** Fires `onChange`, then runs `changeAction` behind the optimistic override. */
	function fireChange(newValue: ISODateTimeString | undefined): void {
		if (isEffectivelyDisabled) {
			return;
		}
		onChange(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	function openSheet(panel: TouchDateTimePanel): void {
		if (!isEffectivelyDisabled) {
			isWheelOpen = false;
			activePanel = panel;
			isSheetOpen = true;
		}
	}

	function closeSheet(): void {
		if (selectedDate == null) {
			draftTime = undefined;
		}
		isSheetOpen = false;
	}

	function handleSheetOpenChange(nextOpen: boolean): void {
		if (nextOpen) {
			isSheetOpen = true;
		} else {
			closeSheet();
		}
	}

	$effect(() => {
		if (isEffectivelyDisabled && isSheetOpen) {
			untrack(() => closeSheet());
		}
	});

	// One month either way, clamped to the reachable range. Goes through the same
	// scrollToMonth the swipe settles on, so the arrows and the gesture cannot
	// disagree about where a month rests.
	function stepMonth(delta: number): void {
		const target = clampIndex(monthIndex + delta, minMonthIndex, maxMonthIndex);
		if (target === monthIndex) {
			return;
		}
		monthIndex = target;
		scroller?.scrollToMonth(target, 'smooth');
	}

	/**
	 * Put the picker back to how it opens: no value, current month.
	 *
	 * "If possible" is load-bearing on the month half: a range can exclude the
	 * current month entirely, and there is no honest place to go in that case, so
	 * the move is skipped and the calendar stays where it is. The value is
	 * cleared either way.
	 */
	function handleResetInSheet(): void {
		fireChange(undefined);
		draftTime = undefined;
		const currentMonth = monthIndexOf(today);
		if (currentMonth < minMonthIndex || currentMonth > maxMonthIndex) {
			return;
		}
		monthIndex = currentMonth;
		scroller?.scrollToMonth(currentMonth, 'smooth');
	}

	function handleDateSelect(nextDate: ISODateString): void {
		const nextTime = clampTimeForDate(nextDate, timeForWheels);
		draftTime = nextTime;
		const combined = combineDateTime(nextDate, nextTime);
		if (combined && combined !== optimistic.current) {
			fireChange(combined);
		}
	}

	function commitWheelTime(rawTime: ISOTimeString): void {
		const nextTime = clampTimeForDate(valueParts.date, rawTime);
		draftTime = nextTime;
		if (valueParts.date != null) {
			const combined = combineDateTime(valueParts.date, nextTime);
			if (combined && combined !== optimistic.current) {
				fireChange(combined);
			}
		}
	}

	function composeWheelTime({
		hour24,
		hour12,
		minute,
		second,
		meridiem
	}: {
		hour24?: number;
		hour12?: number;
		minute?: number;
		second?: number;
		meridiem?: number;
	}): ISOTimeString {
		const currentMeridiem = parsedWheelTime.hour < 12 ? 0 : 1;
		let hour = parsedWheelTime.hour;
		if (hourFormat === '24h') {
			hour = hour24 ?? hour;
		} else {
			hour = hour24From12(hour12 ?? hour12From24(hour), meridiem ?? currentMeridiem);
		}
		return formatISOTime(
			{
				hour,
				minute: minute ?? parsedWheelTime.minute,
				second: hasSeconds ? (second ?? parsedWheelTime.second) : 0
			},
			hasSeconds
		);
	}

	const timeBounds = $derived(timeBoundsForDate(valueParts.date));

	const hourOptions: WheelOption[] = $derived.by(() => {
		if (hourFormat === '24h') {
			return Array.from({ length: 24 }, (_, hour) => ({
				value: hour,
				label: twoDigits(hour),
				isDisabled: !rangeOverlaps(hour * 3600, hour * 3600 + 3599, timeBounds.min, timeBounds.max)
			}));
		}
		const meridiem = parsedWheelTime.hour < 12 ? 0 : 1;
		// In 12-hour mode the hour column is interpreted inside the active AM/PM
		// half, so disabled rows describe reachability within that half only.
		return Array.from({ length: 12 }, (_, index) => {
			const hour = index + 1;
			const hour24 = hour24From12(hour, meridiem);
			return {
				value: hour,
				label: String(hour),
				isDisabled: !rangeOverlaps(
					hour24 * 3600,
					hour24 * 3600 + 3599,
					timeBounds.min,
					timeBounds.max
				)
			};
		});
	});

	const minuteOptions: WheelOption[] = $derived(
		Array.from({ length: 60 }, (_, minute) => {
			const start = parsedWheelTime.hour * 3600 + minute * 60;
			return {
				value: minute,
				label: twoDigits(minute),
				isDisabled: !rangeOverlaps(
					start,
					start + (hasSeconds ? 59 : 0),
					timeBounds.min,
					timeBounds.max
				)
			};
		})
	);

	const secondOptions: WheelOption[] = $derived(
		Array.from({ length: 60 }, (_, second) => ({
			value: second,
			label: twoDigits(second),
			isDisabled: !isTimeInRange(
				formatISOTime(
					{
						hour: parsedWheelTime.hour,
						minute: parsedWheelTime.minute,
						second
					},
					true
				),
				timeBounds.min,
				timeBounds.max
			)
		}))
	);

	const meridiemOptions: WheelOption[] = $derived([
		{
			value: 0,
			label: t('@astryx.dateTimeInput.meridiemAM'),
			isDisabled: !rangeOverlaps(0, 11 * 3600 + 3599, timeBounds.min, timeBounds.max)
		},
		{
			value: 1,
			label: t('@astryx.dateTimeInput.meridiemPM'),
			isDisabled: !rangeOverlaps(12 * 3600, 23 * 3600 + 3599, timeBounds.min, timeBounds.max)
		}
	]);

	/**
	 * The calendar reports the month it has scrolled to — but only while it is
	 * the surface being scrolled. The wheels steer it while they are up, so its
	 * echo would close a cycle; ignoring the echo removes the cycle instead of
	 * damping it.
	 */
	function handleVisibleMonthChange(next: number): void {
		if (activePanel === 'date' && !isWheelOpen) {
			monthIndex = next;
		}
	}

	/**
	 * Put the calendar back where it belongs whenever it becomes the live
	 * surface again — after a panel switch, or once the wheels close.
	 *
	 * `monthIndex` is read through `untrack` — upstream's ref, for the same
	 * reason: depending on it would re-run this on every month the user swipes
	 * to, yanking the scroller back mid-gesture.
	 */
	$effect(() => {
		if (activePanel === 'date' && !isWheelOpen) {
			untrack(() => scroller?.scrollToMonth(monthIndex, 'auto'));
		}
	});

	// APG combobox keys. Both fields are readonly and take no text, so only the
	// documented openers are wired.
	function handleInputKeyDown(event: KeyboardEvent, panel: TouchDateTimePanel): void {
		// An IME sitting over a readonly field still sends its committing Enter
		// here first, and opening a sheet on the keystroke that finishes a Korean
		// syllable is the wrong answer. See utils/ime.ts.
		if (isImeKeyEvent(event)) {
			return;
		}
		if (
			event.key === 'ArrowDown' ||
			event.key === 'Enter' ||
			event.key === ' ' ||
			event.key === 'Spacebar'
		) {
			event.preventDefault();
			openSheet(panel);
		}
	}

	let clearFocusTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		return () => {
			if (clearFocusTimer != null) {
				clearTimeout(clearFocusTimer);
			}
		};
	});

	let timeSegmentFocusTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		return () => {
			if (timeSegmentFocusTimer != null) {
				clearTimeout(timeSegmentFocusTimer);
			}
		};
	});

	function handleClear(event: MouseEvent): void {
		event.stopPropagation();
		fireChange(undefined);
		draftTime = undefined;
		isSheetOpen = false;
		const field = dateInput;
		if (field == null) {
			return;
		}
		// Focus goes back to the field on the NEXT task, not synchronously:
		// clearing unmounts this button, and focusing another element in the same
		// task as that unmount makes iOS Safari scroll the document to the top.
		// `preventScroll` alone does not fix it — the deferral is the load-bearing
		// half — and it is kept because the reveal scroll is unwanted too.
		clearFocusTimer = setTimeout(() => {
			clearFocusTimer = null;
			field.focus({ preventScroll: true });
		}, 0);
	}

	function handleSaveDate(): void {
		isWheelOpen = false;
		activePanel = 'time';
		if (timeSegmentFocusTimer != null) {
			clearTimeout(timeSegmentFocusTimer);
		}
		timeSegmentFocusTimer = setTimeout(() => {
			timeSegmentFocusTimer = null;
			timeSegment?.focus({ preventScroll: true });
		}, 0);
	}

	function handleWheelChange(next: number): void {
		monthIndex = next;
		scroller?.scrollToMonth(next, 'auto');
	}

	const theme = $derived(
		themeProps('date-time-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const dateSegmentTheme = $derived(
		themeProps('date-time-input-date-segment', {
			size,
			status: status?.type ?? null
		})
	);
	const timeSegmentTheme = $derived(
		themeProps('date-time-input-time-segment', {
			size,
			status: status?.type ?? null
		})
	);
	const rowAttrs = $derived(touchDateTimeRowAttrs(xstyle));
	const dateWrapperAttrs = $derived(
		touchDateTimeDateWrapperAttrs(size, status?.type, isEffectivelyDisabled)
	);
	const timeWrapperAttrs = $derived(
		touchDateTimeTimeWrapperAttrs(size, status?.type, isEffectivelyDisabled)
	);
	const iconButtonAttrs = $derived(touchDateTimeIconButtonAttrs(isEffectivelyDisabled));
	const controlAttrs = $derived(touchDateTimeInputAttrs(isEffectivelyDisabled));
	const sheetBodyAttrs = touchDateTimeSheetBodyAttrs();
	const surfaceAttrs = touchDateTimeSurfaceAttrs();
	const panelStackAttrs = touchDateTimePanelStackAttrs();
	const headerAttrs = touchDateTimeHeaderAttrs();
	const titleAttrs = touchDateTimeTitleAttrs();
	const titleTextAttrs = touchDateTimeTitleTextAttrs();
	const arrowIconAttrs = touchDateTimeArrowIconAttrs();
	const dateSurfaceStackAttrs = touchDateTimeDateSurfaceStackAttrs();
	const weekdaysAttrs = touchDateTimeWeekdaysAttrs();
	const weekdayAttrs = touchDateTimeWeekdayAttrs();
	const wheelSpacerAttrs = touchDateTimeWheelSpacerAttrs();
	const timeWheelsAttrs = touchDateTimeTimeWheelsAttrs();
	const footerAttrs = touchDateTimeFooterAttrs();
	const datePanelAttrs = $derived(touchDateTimePanelAttrs(activePanel !== 'date'));
	const timePanelAttrs = $derived(touchDateTimePanelAttrs(activePanel !== 'time'));
	const headerActionsAttrs = $derived(touchDateTimeHeaderActionsAttrs(isWheelOpen));
	const calendarSurfaceAttrs = $derived(touchDateTimeDateSurfaceAttrs(isWheelOpen));
	const wheelsSurfaceAttrs = $derived(touchDateTimeDateSurfaceAttrs(!isWheelOpen));
</script>

{#snippet chevronLeftIcon()}
	<span class={arrowIconAttrs.class} style={arrowIconAttrs.style}>
		<Icon icon="chevronLeft" size="sm" color="inherit" />
	</span>
{/snippet}

{#snippet chevronRightIcon()}
	<span class={arrowIconAttrs.class} style={arrowIconAttrs.style}>
		<Icon icon="chevronRight" size="sm" color="inherit" />
	</span>
{/snippet}

{#snippet surface()}
	<div class={surfaceAttrs.class} style={surfaceAttrs.style}>
		<SegmentedControl
			value={activePanel}
			onChange={(nextPanel) => {
				activePanel = nextPanel as TouchDateTimePanel;
				isWheelOpen = false;
			}}
			label={t('@astryx.dateTimeInput.pickerMode')}
			layout="fill"
		>
			<SegmentedControlItem value="date" label={t('@astryx.dateTimeInput.dateTab')} />
			<SegmentedControlItem
				{...{ [createAttachmentKey()]: attachTimeSegment }}
				value="time"
				label={t('@astryx.dateTimeInput.timeTab')}
			/>
		</SegmentedControl>

		<div class={panelStackAttrs.class} style={panelStackAttrs.style}>
			<div
				data-panel="date"
				aria-hidden={activePanel !== 'date' ? 'true' : undefined}
				inert={activePanel !== 'date' ? true : undefined}
				class={datePanelAttrs.class}
				style={datePanelAttrs.style}
			>
				<div class={headerAttrs.class} style={headerAttrs.style}>
					<button
						type="button"
						onclick={() => (isWheelOpen = !isWheelOpen)}
						aria-expanded={isWheelOpen}
						aria-label={t('@astryx.dateInput.chooseMonthYear', { monthYear: monthYearLabel })}
						class={titleAttrs.class}
						style={titleAttrs.style}
					>
						<span class={titleTextAttrs.class} style={titleTextAttrs.style}>{monthYearLabel}</span>
						<Icon icon="chevronDown" size="sm" color="secondary" />
					</button>
					<span
						inert={isWheelOpen ? true : undefined}
						class={headerActionsAttrs.class}
						style={headerActionsAttrs.style}
					>
						<IconButton
							variant="ghost"
							size="sm"
							xstyle={touchDateTimeArrowXstyle(canStepBack)}
							isDisabled={!canStepBack}
							onclick={() => stepMonth(-1)}
							label={t('@astryx.calendar.previousMonth')}
							icon={chevronLeftIcon}
						/>
						<IconButton
							variant="ghost"
							size="sm"
							xstyle={touchDateTimeArrowXstyle(canStepForward)}
							isDisabled={!canStepForward}
							onclick={() => stepMonth(1)}
							label={t('@astryx.calendar.nextMonth')}
							icon={chevronRightIcon}
						/>
						<Button
							variant="ghost"
							size="sm"
							xstyle={touchDateTimeResetButtonXstyle()}
							label={t('@astryx.dateInput.resetPicking')}
							onclick={handleResetInSheet}
						/>
					</span>
				</div>

				<div class={dateSurfaceStackAttrs.class} style={dateSurfaceStackAttrs.style}>
					<div
						data-date-surface="calendar"
						aria-hidden={isWheelOpen ? 'true' : undefined}
						inert={isWheelOpen ? true : undefined}
						class={calendarSurfaceAttrs.class}
						style={calendarSurfaceAttrs.style}
					>
						<div aria-hidden="true" class={weekdaysAttrs.class} style={weekdaysAttrs.style}>
							{#each dayNames as name (name)}
								<div class={weekdayAttrs.class} style={weekdayAttrs.style}>{name}</div>
							{/each}
						</div>
						{#key `${minMonthIndex}:${maxMonthIndex}`}
							<MonthScroller
								bind:this={scroller}
								{minMonthIndex}
								{maxMonthIndex}
								initialMonthIndex={monthIndex}
								onVisibleMonthChange={handleVisibleMonthChange}
								{selectedDate}
								{today}
								isDateDisabled={constraints.isDateDisabled}
								{weekStartsOn}
								onSelect={handleDateSelect}
							/>
						{/key}
						<div class={footerAttrs.class} style={footerAttrs.style}>
							<Button
								variant="primary"
								size="md"
								width="100%"
								label={t('@astryx.dateTimeInput.saveDatePicking')}
								isDisabled={selectedDate == null}
								onclick={handleSaveDate}
							/>
						</div>
					</div>

					<div
						data-date-surface="wheels"
						aria-hidden={!isWheelOpen ? 'true' : undefined}
						inert={!isWheelOpen ? true : undefined}
						class={wheelsSurfaceAttrs.class}
						style={wheelsSurfaceAttrs.style}
					>
						<div
							aria-hidden="true"
							class={wheelSpacerAttrs.class}
							style={wheelSpacerAttrs.style}
						></div>
						<MonthYearWheels
							{monthIndex}
							{minMonthIndex}
							{maxMonthIndex}
							onChange={handleWheelChange}
							monthLabel={t('@astryx.dateInput.monthWheel')}
							yearLabel={t('@astryx.dateInput.yearWheel')}
							isActive={activePanel === 'date' && isWheelOpen}
						/>
						<div class={footerAttrs.class} style={footerAttrs.style}>
							<Button
								variant="secondary"
								size="md"
								width="100%"
								label={t('@astryx.dateInput.doneChoosingMonth')}
								onclick={() => (isWheelOpen = false)}
							/>
						</div>
					</div>
				</div>
			</div>

			<div
				data-panel="time"
				role="group"
				aria-label={resolvedTimeLabel}
				aria-hidden={activePanel !== 'time' ? 'true' : undefined}
				inert={activePanel !== 'time' ? true : undefined}
				class={timePanelAttrs.class}
				style={timePanelAttrs.style}
			>
				<div class={timeWheelsAttrs.class} style={timeWheelsAttrs.style}>
					<Wheel
						label={t('@astryx.dateTimeInput.hourWheel')}
						options={hourOptions}
						value={hourFormat === '24h' ? parsedWheelTime.hour : hour12From24(parsedWheelTime.hour)}
						isActive={activePanel === 'time'}
						onChange={(hour) =>
							commitWheelTime(
								hourFormat === '24h'
									? composeWheelTime({ hour24: hour })
									: composeWheelTime({ hour12: hour })
							)}
					/>
					<Wheel
						label={t('@astryx.dateTimeInput.minuteWheel')}
						options={minuteOptions}
						value={parsedWheelTime.minute}
						isActive={activePanel === 'time'}
						onChange={(minute) => commitWheelTime(composeWheelTime({ minute }))}
					/>
					{#if hasSeconds}
						<Wheel
							label={t('@astryx.dateTimeInput.secondWheel')}
							options={secondOptions}
							value={parsedWheelTime.second}
							isActive={activePanel === 'time'}
							onChange={(second) => commitWheelTime(composeWheelTime({ second }))}
						/>
					{/if}
					{#if hourFormat === '12h'}
						<Wheel
							label={t('@astryx.dateTimeInput.meridiemWheel')}
							options={meridiemOptions}
							value={parsedWheelTime.hour < 12 ? 0 : 1}
							isActive={activePanel === 'time'}
							onChange={(meridiem) => commitWheelTime(composeWheelTime({ meridiem }))}
						/>
					{/if}
				</div>
				<div class={footerAttrs.class} style={footerAttrs.style}>
					<Button
						variant="primary"
						size="md"
						width="100%"
						label={t('@astryx.dateInput.savePicking')}
						onclick={closeSheet}
					/>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet sheetBody()}
	<div class={sheetBodyAttrs.class} style={sheetBodyAttrs.style}>{@render surface()}</div>
{/snippet}

<Field
	{label}
	{isLabelHidden}
	{description}
	inputID={dateInputId}
	descriptionID={description ? descriptionID : undefined}
	{isOptional}
	{isRequired}
	{isDisabled}
	status={status
		? {
				type: status.type,
				message: status.message,
				messageID: status.message ? statusMessageID : undefined
			}
		: undefined}
	{labelTooltip}
	statusVariant="detached"
	{width}
>
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, rowAttrs.class, className)}
		style={mergeStyle(rowAttrs.style, styleProp as string | undefined)}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		<!--
			A click on the wrapper's own padding opens the sheet; a click that
			started on a child (the toggle, the input, the clear button) is that
			child's, so the target test is what keeps the two apart.
		-->
		<div
			onclick={(event) => {
				if (event.target === event.currentTarget) {
					openSheet('date');
				}
			}}
			{...dateSegmentTheme}
			class={cx(dateSegmentTheme.class, dateWrapperAttrs.class)}
			style={dateWrapperAttrs.style}
		>
			<button
				type="button"
				onclick={() => openSheet('date')}
				disabled={isEffectivelyDisabled}
				aria-label={t('@astryx.dateInput.openCalendar')}
				tabindex={-1}
				class={iconButtonAttrs.class}
				style={iconButtonAttrs.style}
			>
				<Icon
					icon="calendar"
					size="sm"
					color="secondary"
					{...themeProps('date-time-input-toggle-icon', {
						state: isSheetOpen ? 'expanded' : 'collapsed'
					})}
				/>
			</button>
			<!-- svelte-ignore a11y_role_has_required_aria_props -->
			<input
				bind:this={dateInput}
				id={dateInputId}
				type="text"
				role="combobox"
				value={dateDisplayValue}
				readonly
				inputmode="none"
				onclick={() => openSheet('date')}
				onkeydown={(event) => handleInputKeyDown(event, 'date')}
				{placeholder}
				disabled={isEffectivelyDisabled && !showsDisabledMessage}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				aria-describedby={ariaDescribedBy}
				aria-required={isEffectivelyRequired() ? 'true' : undefined}
				aria-invalid={status?.type === 'error' ? 'true' : undefined}
				aria-busy={isBusy || undefined}
				aria-expanded={isSheetOpen && activePanel === 'date'}
				aria-haspopup="dialog"
				aria-autocomplete="none"
				autocomplete="off"
				class={controlAttrs.class}
				style={controlAttrs.style}
			/>
			{#if hasClear && value !== undefined && !isEffectivelyDisabled}
				<InputClearButton label={t('@astryx.dateInput.clear', { label })} onclick={handleClear} />
			{/if}
			{#if isBusy}<Spinner size="sm" />{/if}
			<InputStatusIcon {statusIcon} />
		</div>

		<div
			onclick={(event) => {
				if (event.target === event.currentTarget) {
					openSheet('time');
				}
			}}
			{...timeSegmentTheme}
			class={cx(timeSegmentTheme.class, timeWrapperAttrs.class)}
			style={timeWrapperAttrs.style}
		>
			<button
				type="button"
				onclick={() => openSheet('time')}
				disabled={isEffectivelyDisabled}
				aria-label={t('@astryx.dateTimeInput.openTimePicker', { label: resolvedTimeLabel })}
				tabindex={-1}
				class={iconButtonAttrs.class}
				style={iconButtonAttrs.style}
			>
				<Icon
					icon="clock"
					size="sm"
					color="secondary"
					{...themeProps('date-time-input-clock-icon')}
				/>
			</button>
			<!-- svelte-ignore a11y_role_has_required_aria_props -->
			<input
				id={timeInputId}
				type="text"
				role="combobox"
				value={timeDisplayValue}
				readonly
				inputmode="none"
				onclick={() => openSheet('time')}
				onkeydown={(event) => handleInputKeyDown(event, 'time')}
				placeholder={timePlaceholder}
				disabled={isEffectivelyDisabled && !showsDisabledMessage}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				aria-label={resolvedTimeLabel}
				aria-describedby={ariaDescribedBy}
				aria-required={isEffectivelyRequired() ? 'true' : undefined}
				aria-invalid={status?.type === 'error' ? 'true' : undefined}
				aria-busy={isBusy || undefined}
				aria-expanded={isSheetOpen && activePanel === 'time'}
				aria-haspopup="dialog"
				aria-autocomplete="none"
				autocomplete="off"
				class={controlAttrs.class}
				style={controlAttrs.style}
			/>
		</div>
		<BottomSheet
			isOpen={isSheetOpen}
			onOpenChange={handleSheetOpenChange}
			label={t('@astryx.dateTimeInput.dialogLabel')}
			height="hug"
			children={sheetBody}
		/>
		{#if showsDisabledMessage && disabledMessage}
			<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
		{/if}
	</div>
</Field>
