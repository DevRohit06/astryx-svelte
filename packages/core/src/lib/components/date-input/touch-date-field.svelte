<script lang="ts">
	import { untrack } from 'svelte';
	import type { DateInputProps } from './date-input.svelte';
	import type { ISODateString } from '../../utils/date-types.js';
	import { normalizeDayOfWeek } from '../../utils/date-types.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { stableClassName } from '../../internal/naming.js';
	import { isImeKeyEvent } from '../../utils/ime.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import {
		DATE_FORMAT_MONTH_YEAR,
		DATE_FORMAT_WEEKDAY_ONLY,
		formatSharedDate,
		plainDateFormat,
		plainDateFromISO,
		plainDateToday
	} from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
	import { useCalendarConstraints } from '../calendar/use-calendar-constraints.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import BottomSheet from '../bottom-sheet/bottom-sheet.svelte';
	import Button from '../button/button.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import IconButton from '../icon-button/icon-button.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import MonthScroller from './month-scroller.svelte';
	import MonthYearWheels from './month-year-wheels.svelte';
	import {
		DEFAULT_MONTH_REACH,
		clampIndex,
		fromMonthIndex,
		monthIndexOf
	} from './month-geometry.js';
	import {
		touchBodyAttrs,
		touchDateFieldIconButtonAttrs,
		touchDateFieldInputAttrs,
		touchDateFieldWrapperAttrs,
		touchFooterActionBeneathAttrs,
		touchFooterActionOverlayAttrs,
		touchFooterAttrs,
		touchHeaderAttrs,
		touchHeaderResetAttrs,
		touchMonthArrowIconAttrs,
		touchMonthArrowXstyle,
		touchMonthArrowsAttrs,
		touchPanelBeneathAttrs,
		touchPanelOverlayAttrs,
		touchResetButtonXstyle,
		touchSheetBodyAttrs,
		touchSurfaceAttrs,
		touchTitleAttrs,
		touchTitleChevronXstyle,
		touchTitleTextAttrs,
		touchWeekdayAttrs,
		touchWeekdaysAttrs
	} from './touch-date-field.stylex.js';

	/**
	 * The touch half of `DateInput`, ported from Astryx's
	 * `DateInput/TouchDateField.tsx`. It holds `DateInput`'s whole prop
	 * contract so the two surfaces are interchangeable: the `Field` wrapper,
	 * status treatment, optimistic `changeAction`, disabled-reason tooltip and
	 * `InputGroup` membership all behave exactly as on the pointer control —
	 * only the picker differs.
	 *
	 * ## The closed field is deliberately the same control
	 *
	 * It is a real `<input>`, not a button: same element, same `role="combobox"`,
	 * same border, same clear button, so the label's `for` names it natively and
	 * the switch between surfaces moves nothing on screen. It just cannot be
	 * typed into: `readonly` blocks entry, and `inputmode="none"` stops the
	 * virtual keyboard from opening over the sheet.
	 *
	 * ## Three ideas in the picker
	 *
	 * 1. One month per screen. Every pane is exactly the size of the scrollport
	 *    and snaps to its start, so the picker is a fixed height and there is no
	 *    resting position showing half of two months. See `month-scroller`.
	 * 2. Swiping is the month control, and the arrows are the backup.
	 * 3. The title is the escape hatch. Tap it and the same box becomes a month
	 *    wheel and a year wheel — a flick each to reach 2019 instead of forty.
	 *
	 * Reset is chrome, so it sits in the header beside the arrows rather than in
	 * the footer: the footer is where the task ends, and an undo of equal weight
	 * beside Save is a mis-tap that throws away the date just chosen.
	 *
	 * Internal to `DateInput`; not exported from the barrel, exactly as upstream
	 * keeps it out of `DateInput/index.ts`.
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
		placeholder: placeholderFromProps,
		size: sizeProp,
		status,
		statusVariant = 'attached',
		labelTooltip,
		hasClear = false,
		// Desktop-only: the scroller is a single continuously paged column, so a
		// second month would be the month already one flick away. Accepted (the
		// prop types are shared) and ignored.
		numberOfMonths: _numberOfMonths,
		weekStartsOn: weekStartsOnProp = 0,
		format = 'date_long',
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateInputProps = $props();

	const t = useTranslator();
	const locale = useLocale();
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.dateInput.placeholder'));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	const weekStartsOn = $derived(normalizeDayOfWeek(weekStartsOnProp));

	const uid = $props.id();
	const id = `${uid}-input`;
	const inputLabelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const tooltipID = `${uid}-tooltip`;

	let input = $state<HTMLInputElement | null>(null);
	const inputGroup = useInputGroup();

	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);
	const isEffectivelyDisabled = $derived(isDisabled || isBusy);

	// Disabled-reason tooltip, same contract as the pointer field: a disabled
	// control swallows pointer events, so the listeners attach to the wrapper and
	// the input stays focusable via aria-disabled rather than the disabled
	// attribute. Only the persistent disabled state surfaces a reason, never the
	// transient busy one.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	const constraints = useCalendarConstraints(() => ({ min, max, dateConstraints }));

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant,
		isInGroup: inputGroup != null
	}));

	const groupValue = $derived(inputGroup ? inputGroup() : null);
	const aria = $derived(
		getInputARIA(
			inputLabelID,
			[
				description ? descriptionID : null,
				statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
				statusIcon.describedBy ?? null,
				showsDisabledMessage ? disabledMessageTooltip.describedBy : null
			],
			groupValue ? { labelID: groupValue.labelID, describedByIDs: groupValue.describedByIDs } : null
		)
	);

	let isSheetOpen = $state(false);
	let isWheelOpen = $state(false);
	let scroller = $state<MonthScroller | null>(null);

	// Pending focus handoff from the clear button; see handleClear.
	let clearFocusTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		return () => {
			if (clearFocusTimer != null) {
				clearTimeout(clearFocusTimer);
			}
		};
	});

	// Upstream's `useMemo(() => plainDateToday(), [])`: once, for the life of the
	// component, so the `aria-current` marker cannot move mid-session.
	const today = plainDateToday();

	const selectedDate = $derived.by(() => {
		const current = optimistic.current;
		return current != null && /^\d{4}-\d{2}-\d{2}$/.test(current)
			? plainDateFromISO(current)
			: null;
	});

	// The reachable range. Explicit bounds win; otherwise the scroller reaches a
	// century in each direction from wherever it opened. Anchored once — this is
	// upstream's state initializer, and recomputing it as the selection moves
	// would shift every pane's scroll offset under the user mid-gesture.
	// svelte-ignore state_referenced_locally
	const anchorMonthIndex = monthIndexOf(
		value != null && /^\d{4}-\d{2}-\d{2}$/.test(value) ? plainDateFromISO(value) : plainDateToday()
	);
	const minMonthIndex = $derived(
		min != null ? monthIndexOf(plainDateFromISO(min)) : anchorMonthIndex - DEFAULT_MONTH_REACH
	);
	const maxMonthIndex = $derived(
		max != null ? monthIndexOf(plainDateFromISO(max)) : anchorMonthIndex + DEFAULT_MONTH_REACH
	);

	// The bounds are spelled out again rather than read off the `$derived`s
	// above: this is upstream's `useState` initializer, which runs once with the
	// first render's props, and reading a `$derived` here would say the opposite.
	// svelte-ignore state_referenced_locally
	let monthIndex = $state(
		clampIndex(
			anchorMonthIndex,
			min != null ? monthIndexOf(plainDateFromISO(min)) : anchorMonthIndex - DEFAULT_MONTH_REACH,
			max != null ? monthIndexOf(plainDateFromISO(max)) : anchorMonthIndex + DEFAULT_MONTH_REACH
		)
	);

	const parts = $derived(fromMonthIndex(monthIndex));

	/**
	 * Three-letter weekday names — "Sun", not Calendar's "Su".
	 *
	 * The sheet is full width and the columns are ~51px, so there is room for
	 * the form people actually read, and a picker operated by thumb should not
	 * make anyone decode "Tu" against "Th".
	 *
	 * This is CLDR's `abbreviated` width, which `Intl` produces natively — no
	 * truncation, so non-English locales stay correct rather than being sliced
	 * to three characters. Built here rather than taken from `useCalendarDays`,
	 * which supplies the short form for Calendar's own header. The rotation
	 * matches: day 4 of January 1970 was a Sunday, so offsetting from it by
	 * `weekStartsOn` walks the week in the same order the panes lay out their
	 * columns.
	 */
	const dayNames = $derived(
		Array.from({ length: 7 }, (_, offset) =>
			plainDateFormat(
				{ year: 1970, month: 1, day: 4 + ((weekStartsOn + offset) % 7) },
				DATE_FORMAT_WEEKDAY_ONLY,
				locale()
			)
		)
	);
	const monthYearLabel = $derived(
		plainDateFormat(
			{ year: parts.year, month: parts.month, day: 1 },
			DATE_FORMAT_MONTH_YEAR,
			locale()
		)
	);

	// Formats the committed value only. A function format is called with the ISO
	// value; a named one reuses Timestamp's shared date mapping, so the same
	// literal renders the same shape here and on the pointer control.
	const displayValue = $derived.by(() => {
		const current = optimistic.current;
		if (current == null || !/^\d{4}-\d{2}-\d{2}$/.test(current)) {
			return '';
		}
		return typeof format === 'function'
			? format(current)
			: formatSharedDate(plainDateFromISO(current), format, locale());
	});

	function fireChange(newValue: ISODateString | undefined): void {
		if (isBusy) {
			return;
		}
		onChange?.(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	function openSheet(): void {
		if (!isEffectivelyDisabled) {
			// Always onto the calendar, whatever was showing last time. The wheels
			// are a detour taken to reach a far month, not a mode to be left in:
			// reopening into them would answer a question the user has not asked
			// yet, and hide the dates they came back for behind another tap.
			isWheelOpen = false;
			isSheetOpen = true;
		}
	}

	function handleClear(): void {
		fireChange(undefined);
		// Focus goes back to the field on the NEXT task, not synchronously.
		//
		// Clearing unmounts this button (it only renders while there is a value),
		// and focusing another element in the same task as that unmount makes iOS
		// Safari scroll the whole document to the top — the user is thrown from
		// wherever the field sat to the start of the page. Measured on the iOS 26
		// simulator against the live docsite, field at scrollY 2055: synchronous
		// focus lands at 0, deferred focus stays at 2055.
		//
		// `preventScroll` alone does NOT fix it (verified: still 0) — this is not
		// the browser's ordinary scroll-the-focused-element-into-view step, so the
		// deferral is the load-bearing half. It is kept because the reveal scroll
		// is real too, and unwanted for the same reason.
		//
		// Skipping the focus entirely would also stop the scroll, but then focus
		// dies with the unmounting button and lands on <body>.
		const field = input;
		if (field == null) {
			return;
		}
		clearFocusTimer = setTimeout(() => {
			clearFocusTimer = null;
			field.focus({ preventScroll: true });
		}, 0);
	}

	/**
	 * Put the picker back to how it opens: no date, current month.
	 *
	 * "If possible" is load-bearing: a range can exclude the current month
	 * entirely (a booking window starting next quarter), and there is no honest
	 * place to go in that case. `clampIndex` would silently land on the nearest
	 * edge, which is a different month presented as if it were today's, so the
	 * move is skipped instead and the calendar stays where it is. The value is
	 * still cleared either way — that half never depends on the range.
	 */
	function handleResetInSheet(): void {
		fireChange(undefined);
		const currentMonth = monthIndexOf(today);
		if (currentMonth < minMonthIndex || currentMonth > maxMonthIndex) {
			return;
		}
		if (currentMonth === monthIndex) {
			return;
		}
		monthIndex = currentMonth;
		scroller?.scrollToMonth(currentMonth, 'smooth');
	}

	// Selection commits on the tap and leaves the sheet up, so a mistake can be
	// corrected in place and a nearby date reconsidered without reopening.
	// Dismissal is the footer's Save (and the handle, the scrim, Escape) — none
	// of which commit anything, because this already has.
	function handleSelect(next: ISODateString): void {
		fireChange(next);
	}

	// Whether there is anywhere to step. An arrow with nowhere to go is hidden
	// rather than disabled: a disabled control still says "this is a thing you
	// could do", and at the end of a range it is not.
	const canStepBack = $derived(monthIndex > minMonthIndex);
	const canStepForward = $derived(monthIndex < maxMonthIndex);

	// One month either way, clamped to the reachable range. Goes through the
	// same scrollToMonth the swipe settles on, so the arrows and the gesture
	// cannot disagree about where a month rests.
	function stepMonth(delta: number): void {
		const target = clampIndex(monthIndex + delta, minMonthIndex, maxMonthIndex);
		if (target === monthIndex) {
			return;
		}
		monthIndex = target;
		scroller?.scrollToMonth(target, 'smooth');
	}

	// A wheel commit steers the scroller immediately, even though it is behind
	// the wheels: it keeps its layout box while hidden, so by the time the
	// wheels close it is already resting on the new month.
	function handleWheelChange(next: number): void {
		monthIndex = next;
		scroller?.scrollToMonth(next, 'auto');
	}

	/**
	 * The calendar reports the month it has scrolled to — but only while it is
	 * the surface being scrolled.
	 *
	 * While the wheels are up the wheels are the source of truth, and the
	 * calendar is being STEERED by them: a wheel commit calls `scrollToMonth`
	 * above, the calendar scrolls, and it would report that month straight back
	 * here. That closes a cycle — wheel commits, calendar echoes, the echo moves
	 * the wheel's selected row, the wheel is repositioned onto it, and the
	 * resulting scroll reads as another commit. Ignoring the echo removes the
	 * cycle instead of damping it.
	 */
	function handleVisibleMonthChange(next: number): void {
		if (isWheelOpen) {
			return;
		}
		monthIndex = next;
	}

	/**
	 * Put the calendar back where it belongs when the wheels close.
	 *
	 * The wheels steer it while it is hidden, and a hidden scroller is not a
	 * reliable place to leave a scroll position: `visibility: hidden` keeps the
	 * layout box, but iOS re-snaps the scroller when it becomes visible again,
	 * and it does not necessarily re-snap to the pane we put it on. That fires a
	 * scroll at the exact moment reports start being trusted again — which is
	 * why the month drifted on the way back to the dates.
	 *
	 * Re-asserting is cheap when nothing moved (the scroller is already there,
	 * so nothing scrolls) and exactly right when something did. `scrollToMonth`
	 * marks the target as steered, so this correction does not report itself
	 * back either.
	 *
	 * `monthIndex` is read through `untrack` — upstream's ref, for the same
	 * reason: depending on it would re-run this on every month the user swipes
	 * to, yanking the scroller back mid-gesture.
	 */
	$effect(() => {
		if (isWheelOpen) {
			return;
		}
		untrack(() => scroller?.scrollToMonth(monthIndex, 'auto'));
	});

	// APG combobox keys. The field takes no text, so every printable key is
	// free — but only the documented openers are wired, so a stray keystroke
	// does not pop a sheet.
	function handleInputKeyDown(event: KeyboardEvent): void {
		// Same guard the pointer surface carries. This field is readonly and
		// takes no composition of its own, but an IME sitting over it still
		// sends its committing Enter here first — and opening a date sheet on
		// the keystroke that finishes a Korean syllable is the same wrong
		// answer. See utils/ime.ts.
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
			openSheet();
		}
	}

	const theme = $derived(
		themeProps('date-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const wrapperAttrs = $derived(
		touchDateFieldWrapperAttrs(
			size,
			status?.type,
			isEffectivelyDisabled,
			inputGroup != null,
			xstyle
		)
	);
	const toggleAttrs = $derived(touchDateFieldIconButtonAttrs(isEffectivelyDisabled));
	const controlAttrs = $derived(touchDateFieldInputAttrs(isEffectivelyDisabled));
	const surfaceAttrs = touchSurfaceAttrs();
	const headerAttrs = touchHeaderAttrs();
	const titleAttrs = touchTitleAttrs();
	const titleTextAttrs = touchTitleTextAttrs();
	const monthArrowIconAttrs = touchMonthArrowIconAttrs();
	const weekdayAttrs = touchWeekdayAttrs();
	const bodyAttrs = touchBodyAttrs();
	const footerAttrs = touchFooterAttrs();
	const sheetBodyAttrs = touchSheetBodyAttrs();
	const arrowsAttrs = $derived(touchMonthArrowsAttrs(isWheelOpen));
	const headerResetAttrs = $derived(touchHeaderResetAttrs(isWheelOpen));
	const weekdaysAttrs = $derived(touchWeekdaysAttrs(isWheelOpen));
	const calendarPanelAttrs = $derived(touchPanelBeneathAttrs(isWheelOpen));
	const wheelsPanelAttrs = $derived(touchPanelOverlayAttrs(!isWheelOpen));
	const calendarFooterAttrs = $derived(touchFooterActionBeneathAttrs(isWheelOpen));
	const wheelsFooterAttrs = $derived(touchFooterActionOverlayAttrs(!isWheelOpen));
</script>

{#snippet chevronLeftIcon()}
	<span class={monthArrowIconAttrs.class} style={monthArrowIconAttrs.style}>
		<Icon icon="chevronLeft" size="sm" color="inherit" />
	</span>
{/snippet}

{#snippet chevronRightIcon()}
	<span class={monthArrowIconAttrs.class} style={monthArrowIconAttrs.style}>
		<Icon icon="chevronRight" size="sm" color="inherit" />
	</span>
{/snippet}

{#snippet surface()}
	<div class={surfaceAttrs.class} style={surfaceAttrs.style}>
		<div class={headerAttrs.class} style={headerAttrs.style}>
			<button
				type="button"
				onclick={() => (isWheelOpen = !isWheelOpen)}
				aria-expanded={isWheelOpen}
				aria-label={t('@astryx.dateInput.chooseMonthYear', { monthYear: monthYearLabel })}
				data-title="month-year"
				class={titleAttrs.class}
				style={titleAttrs.style}
			>
				<span class={titleTextAttrs.class} style={titleTextAttrs.style}>{monthYearLabel}</span>
				<Icon
					icon="chevronDown"
					size="sm"
					color="secondary"
					xstyle={touchTitleChevronXstyle(isWheelOpen)}
				/>
			</button>
			<!--
				Both arrows at the trailing corner, as a pair — and only while the
				calendar is the surface they step. `IconButton` gives them Button's
				optical centring, focus ring, disabled treatment and hit area.

				`inert` as well as the hidden styling: the fade keeps them `visible`
				until it finishes, and a control that is on its way out should not
				answer a click or a Tab in the meantime.

				Mirrored under RTL by the shared helper: "previous" is the earlier
				month, which sits on the right when the inline axis runs that way, and
				the panes mirror with it.
			-->
			<span
				data-arrows="months"
				inert={isWheelOpen ? true : undefined}
				class={arrowsAttrs.class}
				style={arrowsAttrs.style}
			>
				<IconButton
					variant="ghost"
					size="sm"
					xstyle={touchMonthArrowXstyle(canStepBack)}
					isDisabled={!canStepBack}
					onclick={() => stepMonth(-1)}
					label={t('@astryx.calendar.previousMonth')}
					icon={chevronLeftIcon}
				/>
				<IconButton
					variant="ghost"
					size="sm"
					xstyle={touchMonthArrowXstyle(canStepForward)}
					isDisabled={!canStepForward}
					onclick={() => stepMonth(1)}
					label={t('@astryx.calendar.nextMonth')}
					icon={chevronRightIcon}
				/>
			</span>
			<!--
				Reset, past the arrows, and gone with them on the wheels: the wheels
				choose a month, and there is no date there to put back. Hidden rather
				than unmounted, for the arrows' reason — the corner keeps its size, so
				the header cannot change height mid-swap.
			-->
			<span
				data-action="reset"
				inert={isWheelOpen ? true : undefined}
				class={headerResetAttrs.class}
				style={headerResetAttrs.style}
			>
				<!--
					ghost: a filled button up here would outrank the Save that finishes
					the task.
				-->
				<Button
					variant="ghost"
					size="sm"
					xstyle={touchResetButtonXstyle()}
					label={t('@astryx.dateInput.resetPicking')}
					onclick={handleResetInSheet}
				/>
			</span>
		</div>

		<!--
			Decorative: each day carries its weekday in its accessible name, so this
			row is not a header row for assistive technology — and it must live
			outside the scroller, or it would scroll away with the month.
		-->
		<div aria-hidden="true" class={weekdaysAttrs.class} style={weekdaysAttrs.style}>
			{#each dayNames as name (name)}
				<div class={weekdayAttrs.class} style={weekdayAttrs.style}>{name}</div>
			{/each}
		</div>

		<div class={bodyAttrs.class} style={bodyAttrs.style}>
			<!--
				`inert` as well as the hidden styling: the panel keeps its layout box
				(so the scroller holds its position and the wheels can steer it),
				which means without this it would still be tabbable behind the layer
				on top.
			-->
			<div
				data-panel="calendar"
				inert={isWheelOpen ? true : undefined}
				class={calendarPanelAttrs.class}
				style={calendarPanelAttrs.style}
			>
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
						onSelect={handleSelect}
					/>
				{/key}
			</div>
			<div
				data-panel="wheels"
				inert={isWheelOpen ? undefined : true}
				class={wheelsPanelAttrs.class}
				style={wheelsPanelAttrs.style}
			>
				<MonthYearWheels
					{monthIndex}
					{minMonthIndex}
					{maxMonthIndex}
					onChange={handleWheelChange}
					monthLabel={t('@astryx.dateInput.monthWheel')}
					yearLabel={t('@astryx.dateInput.yearWheel')}
					isActive={isWheelOpen}
				/>
			</div>
		</div>

		<!--
			Save does NOT commit: a tap on a day has already fired onChange by the
			time it is reachable. It is a close button, exactly equivalent to the
			grab handle, the scrim and Escape — which is why it is safe for those to
			remain, and why there is no Cancel to pair it with.

			No `inert` on the footer itself: the two cells below take turns, so the
			footer as a whole is always live. It carried one while the footer was
			hidden entirely on the wheels, and leaving it behind made the wheels'
			own Done button unreachable — an inert ancestor disables everything
			inside it.
		-->
		<div class={footerAttrs.class} style={footerAttrs.style}>
			<div
				inert={isWheelOpen ? true : undefined}
				class={calendarFooterAttrs.class}
				style={calendarFooterAttrs.style}
			>
				<!--
					md, not sm: it is the action a thumb reaches for, so it gets the
					comfortable size rather than the compact one the header's ghost
					buttons use.
				-->
				<Button
					variant="primary"
					size="md"
					width="100%"
					label={t('@astryx.dateInput.savePicking')}
					onclick={() => (isSheetOpen = false)}
				/>
			</div>
			<div
				inert={isWheelOpen ? undefined : true}
				class={wheelsFooterAttrs.class}
				style={wheelsFooterAttrs.style}
			>
				<!--
					secondary, not primary: this one does not finish the task, it
					finishes a step. Giving both surfaces a primary button would say the
					wheels are somewhere you can complete from.
				-->
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
{/snippet}

{#snippet sheetBody()}
	<div class={sheetBodyAttrs.class} style={sheetBodyAttrs.style}>{@render surface()}</div>
{/snippet}

{#snippet inputWrapper()}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class, className)}
		style={mergeStyle(wrapperAttrs.style, styleProp as string | undefined)}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		{#if inputGroup}
			<VisuallyHidden id={inputLabelID}>{label}</VisuallyHidden>
		{/if}
		<button
			type="button"
			onclick={openSheet}
			disabled={isEffectivelyDisabled}
			aria-label={t('@astryx.dateInput.openCalendar')}
			tabindex={-1}
			class={toggleAttrs.class}
			style={toggleAttrs.style}
		>
			<Icon
				icon="calendar"
				size="sm"
				color="secondary"
				{...themeProps('date-input-toggle-icon', {
					state: isSheetOpen ? 'expanded' : 'collapsed'
				})}
			/>
		</button>
		<!--
			No `aria-controls`, and that is upstream's shape rather than an omission:
			the picker lives in a `BottomSheet`, which renders its own `<dialog>` and
			owns the id — the pointer surface can point at its popover because it
			mints that id itself. Inventing one here to satisfy the rule would be a
			prop this component does not have, and the parity rule says no. The field
			still announces its state through `aria-expanded` + `aria-haspopup`.
		-->
		<!-- svelte-ignore a11y_role_has_required_aria_props -->
		<input
			bind:this={input}
			{id}
			type="text"
			role="combobox"
			value={displayValue}
			readonly
			inputmode="none"
			onclick={openSheet}
			onkeydown={handleInputKeyDown}
			{placeholder}
			disabled={isEffectivelyDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			aria-labelledby={aria.ariaLabelledBy}
			aria-describedby={aria.ariaDescribedBy}
			aria-required={isEffectivelyRequired() ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			aria-expanded={isSheetOpen}
			aria-haspopup="dialog"
			aria-autocomplete="none"
			autocomplete="off"
			class={controlAttrs.class}
			style={controlAttrs.style}
		/>
		{#if hasClear && value !== undefined && !isEffectivelyDisabled}
			<InputClearButton
				label={t('@astryx.dateInput.clear', { label })}
				onclick={handleClear}
				iconClassName={stableClassName('date-input-clear-icon')}
			/>
		{/if}
		{#if isBusy}<Spinner size="sm" />{/if}
		<InputStatusIcon {statusIcon} />
		<BottomSheet
			isOpen={isSheetOpen}
			onOpenChange={(open) => (isSheetOpen = open)}
			label={t('@astryx.dateInput.dialogLabel')}
			height="hug"
			children={sheetBody}
		/>
		{#if showsDisabledMessage && disabledMessage}
			<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
		{/if}
	</div>
{/snippet}

{#if inputGroup}
	{@render inputWrapper()}
{:else}
	<Field
		{label}
		{isLabelHidden}
		{description}
		inputID={id}
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
		{statusVariant}
		{labelTooltip}
		{width}
	>
		{@render inputWrapper()}
	</Field>
{/if}
