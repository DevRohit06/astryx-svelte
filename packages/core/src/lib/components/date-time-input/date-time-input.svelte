<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { DayOfWeek, DayOfWeekName, ISODateString } from '../../utils/date-types.js';
	import type { ISOTimeString } from '../../utils/time-parser.js';
	import type { DateTimeInputSize } from './date-time-input.stylex.js';

	/**
	 * A combined date and time in ISO 8601 form — `"YYYY-MM-DDTHH:MM"` or
	 * `"YYYY-MM-DDTHH:MM:SS"`.
	 *
	 * Branded, as `ISODateString` and `ISOTimeString` are, so a bare string cannot
	 * be passed by accident. Declared here rather than in `utils/` because that is
	 * where upstream declares it: `DateTimeInput.tsx` owns this type, and nothing
	 * else in the library uses it.
	 */
	export type ISODateTimeString = string & { readonly __brand: 'ISODateTimeString' };

	export type DateTimeInputHourFormat = '12h' | '24h';

	/** Supported minute increments for arrow-key stepping of the time field. */
	export type DateTimeInputTimeIncrement = 1 | 5 | 10 | 15 | 30;

	// `DateTimeInputStatus`/`DateTimeInputStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream re-exports them.
	export type DateTimeInputStatus = InputStatus;
	export type DateTimeInputStatusType = InputStatusType;

	/**
	 * `...rest` spreads onto the outer row `<div>`, hence the `HTMLDivElement`
	 * element type — the same arrangement `DateInput`/`DateRangeInput` use.
	 * Upstream's `ref` targets the *date* input; Svelte has no `ref` prop.
	 */
	export interface DateTimeInputProps extends Omit<
		BaseProps<HTMLDivElement>,
		'onchange' | 'defaultValue'
	> {
		/** Label text for the input (required for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed between the label and input. */
		description?: string;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Whether the input is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Explains why the input is disabled. When set together with `isDisabled`,
		 * the input shows a tooltip with this text on hover and keyboard focus, and
		 * the date and time fields stay focusable (via `aria-disabled`) so the
		 * reason is discoverable by keyboard and assistive technology. Typing and
		 * calendar activation stay blocked.
		 *
		 * Use this instead of wrapping a disabled input in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/** The selected datetime in ISO 8601 format. */
		value?: ISODateTimeString;
		/**
		 * Fired when the datetime changes. Called with `undefined` when the input is
		 * cleared. **Required**, unlike `DateInput`'s — upstream's own asymmetry.
		 */
		onChange: (value: ISODateTimeString | undefined) => void;
		/** Async action on change. Fires after `onChange`. */
		changeAction?: (value: ISODateTimeString | undefined) => void | Promise<void>;
		/**
		 * Whether the input is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/** Minimum selectable datetime in ISO format. Constrains both date and time. */
		min?: ISODateTimeString;
		/** Maximum selectable datetime in ISO format. Constrains both date and time. */
		max?: ISODateTimeString;
		/** Custom date constraint functions. A date is disabled if ANY returns false. */
		dateConstraints?: ReadonlyArray<(date: Date) => boolean>;
		/**
		 * Whether to include seconds in the time portion.
		 * @default false
		 */
		hasSeconds?: boolean;
		/**
		 * Hour display format.
		 * @default '12h'
		 */
		hourFormat?: DateTimeInputHourFormat;
		/**
		 * Minutes added or subtracted when stepping the time field with the arrow
		 * keys. Constrained to a set of sensible increments.
		 * @default 1
		 */
		timeIncrement?: DateTimeInputTimeIncrement;
		/**
		 * Whether to show a clear button when a value is set.
		 * @default false
		 */
		hasClear?: boolean;
		/**
		 * Placeholder shown in the date portion when no date is selected.
		 * @default "Select a date"
		 */
		placeholder?: string;
		/**
		 * Placeholder shown in the time portion when no time is selected.
		 * @default "Select a time"
		 */
		timePlaceholder?: string;
		/**
		 * Accessible label for the time portion. Defaults to `"{label} time"` so it
		 * is tied to the field's own label and localizable, rather than a hardcoded
		 * English "Time".
		 */
		timeLabel?: string;
		/**
		 * The size of the inputs. Inherited from an enclosing `SizeContext` when unset.
		 * @default 'md'
		 */
		size?: DateTimeInputSize;
		/** Status indicator for the input. */
		status?: InputStatus;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Number of months to display in the calendar.
		 * @default 1
		 */
		numberOfMonths?: 1 | 2;
		/**
		 * First day of week in the calendar. Accepts a number
		 * (0 = Sunday … 6 = Saturday) or a three-letter day name ('sun'–'sat',
		 * case-insensitive).
		 * @default 0
		 */
		weekStartsOn?: DayOfWeek | DayOfWeekName;
	}

	/** Module-private, as upstream's are. */
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
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import { parseDateInput } from '../../utils/date-parser.js';
	import {
		adjustTime,
		formatDisplayTime12h,
		formatDisplayTime24h,
		formatISOTime,
		isTimeInRange,
		parseTimeInput
	} from '../../utils/time-parser.js';
	import {
		DATE_FORMAT_LONG,
		plainDateFormat,
		plainDateFromISO,
		plainDateToISO
	} from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { isFocusDetached } from '../../utils/focus-return.js';
	import Calendar from '../calendar/calendar.svelte';
	import type { CalendarHandle } from '../calendar/calendar.svelte';
	import { useCalendarConstraints } from '../calendar/use-calendar-constraints.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import {
		dateTimeInputAttrs,
		dateTimeInputDateWrapperAttrs,
		dateTimeInputIconAttrs,
		dateTimeInputIconButtonAttrs,
		dateTimeInputRowAttrs,
		dateTimeInputTimeWrapperAttrs
	} from './date-time-input.stylex.js';

	/**
	 * A combined date and time picker: side-by-side date and time fields under one
	 * label. The date field opens a `Calendar` popover; the time field supports
	 * typed entry and arrow-key adjustment.
	 *
	 * The two halves are not independent. `value` is one ISO string that is split
	 * on the `T` for display and recombined on every commit, so **a time alone
	 * never commits** — picking a time before a date updates only the visible text
	 * until a date exists. Choosing a date when none was set seeds the time from
	 * the wall clock, then clamps it into `min`/`max` if the chosen date is the
	 * boundary day.
	 *
	 * @example
	 * ```svelte
	 * <DateTimeInput label="Meeting time" value={dateTime} onChange={(v) => (dateTime = v)} />
	 * ```
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
		timeIncrement = 1,
		hasClear = false,
		placeholder: placeholderFromProps,
		timePlaceholder: timePlaceholderFromProps,
		timeLabel,
		size: sizeProp,
		status,
		labelTooltip,
		numberOfMonths = 1,
		// Deliberately no default: it is forwarded raw, and `Calendar` owns both the
		// `= 0` fallback and the name→number normalisation.
		weekStartsOn,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateTimeInputProps = $props();

	const t = useTranslator();
	// Speaks arrow-key stepping results through the persistent live regions:
	// stepping programmatically rewrites a plain textbox's value, which screen
	// readers do not announce on their own (WCAG 4.1.2).
	const announce = useAnnounce();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.dateTimeInput.placeholder'));
	const timePlaceholder = $derived(
		timePlaceholderFromProps ?? t('@astryx.dateTimeInput.timePlaceholder')
	);
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	const uid = $props.id();
	const dateInputId = `${uid}-date`;
	const timeInputId = `${uid}-time`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const popoverID = `${uid}-popover`;
	const tooltipID = `${uid}-tooltip`;

	let dateInput = $state<HTMLInputElement | null>(null);
	let timeInput = $state<HTMLInputElement | null>(null);
	let timeContainer = $state<HTMLDivElement | null>(null);
	// Upstream's `calendarRef`, reached by `bind:this` because `CalendarHandle` is
	// an instance export here rather than a `handleRef` prop.
	let calendar = $state<CalendarHandle | null>(null);

	// Upstream's `useOptimistic` + `useTransition` pair.
	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);
	const isEffectivelyDisabled = $derived(isDisabled || isBusy);

	// Only the persistent `isDisabled` state — not the transient busy state —
	// surfaces a reason. The listeners attach to the outer row, which is always
	// present, rather than to either pointer-swallowing input.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The container div is not naturally focusable; focusin bubbles up from
		// the inputs, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant: 'detached'
	}));

	// Hand-rolled rather than `getInputARIA`: this component never reads the
	// `InputGroup` context, so there is no group half to merge.
	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			status?.message ? statusMessageID : null,
			// Always `undefined` — the fixed `detached` presentation renders no
			// info-tip — but kept so the described-by list matches the rest of the
			// family, as upstream's does.
			statusIcon.describedBy ?? null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Split min/max and the current value.
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

	// Time constraints only bite on the boundary days themselves: a 09:00 minimum
	// on 1 March constrains 1 March and no other date.
	const timeMin = $derived.by(() => {
		if (!minParts.date || !minParts.time || !valueParts.date) {
			return undefined;
		}
		return valueParts.date === minParts.date ? minParts.time : undefined;
	});

	const timeMax = $derived.by(() => {
		if (!maxParts.date || !maxParts.time || !valueParts.date) {
			return undefined;
		}
		return valueParts.date === maxParts.date ? maxParts.time : undefined;
	});

	// --- Date input state ---
	let datePendingInput = $state<string | null>(null);

	// The `DateInput` reconciliation, on the date half only: a value change this
	// component caused must not wipe half-typed text, while an external one must.
	// See `date-input.svelte` for why these are plain `let`s and why the body is
	// untracked.
	let lastFiredDate: ISODateString | undefined = undefined;
	let prevDate: ISODateString | undefined = splitDateTime(value).date;

	$effect.pre(() => {
		const next = valueParts.date;
		untrack(() => {
			if (next !== prevDate) {
				prevDate = next;
				if (next !== lastFiredDate) {
					lastFiredDate = undefined;
					if (datePendingInput !== null) {
						datePendingInput = null;
					}
				}
			}
		});
	});

	const dateDisplayValue = $derived.by(() => {
		if (datePendingInput !== null) {
			return datePendingInput;
		}
		const d = valueParts.date;
		return d && /^\d{4}-\d{2}-\d{2}$/.test(d)
			? plainDateFormat(plainDateFromISO(d), DATE_FORMAT_LONG)
			: '';
	});

	const isDateInputValid = $derived(
		datePendingInput === null || !datePendingInput.trim()
			? true
			: parseDateInput(datePendingInput) !== null
	);

	// --- Time input state ---
	let timePendingInput = $state<string | null>(null);
	let isTimeFocused = $state(false);

	const formatDisplayTime = $derived(
		hourFormat === '12h' ? formatDisplayTime12h : formatDisplayTime24h
	);

	const timeDisplayValue = $derived.by(() => {
		if (timePendingInput !== null) {
			return timePendingInput;
		}
		return valueParts.time ? formatDisplayTime(valueParts.time, hasSeconds) : '';
	});

	const isTimeInputValid = $derived.by(() => {
		if (timePendingInput === null || !timePendingInput.trim()) {
			return true;
		}
		const parsed = parseTimeInput(timePendingInput, hasSeconds);
		if (!parsed) {
			return false;
		}
		return isTimeInRange(parsed, timeMin, timeMax);
	});

	// Focused and empty swaps in a format hint, as `TimeInput` does. Upstream
	// writes both hints as bare English literals with no translator key.
	const resolvedTimePlaceholder = $derived.by(() => {
		if (isTimeFocused && !timeDisplayValue) {
			return hourFormat === '12h' ? 'e.g., 2:30 PM' : 'e.g., 14:30';
		}
		return timePlaceholder;
	});

	/** Fires `onChange`, then runs `changeAction` behind the optimistic override. */
	function fireChange(newValue: ISODateTimeString | undefined): void {
		if (isBusy) {
			return;
		}
		onChange(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	const popover = usePopover(() => ({
		id: popoverID,
		dialogLabel: t('@astryx.dateTimeInput.dialogLabel'),
		closeButtonLabel: t('@astryx.dateInput.closeCalendar'),
		// Return focus to the date field when the calendar closes — but only when
		// the dismiss left focus detached (Escape, or a click on non-focusable empty
		// space), which the focus trap cannot restore on its own. A native
		// `popover="auto"` light-dismiss fires synchronously with the pointer event
		// that moved focus, so if the user clicked another control — the time field,
		// the clear button, anywhere — focus has already landed there; reclaiming it
		// would fight their click.
		onHide: () => {
			if (isFocusDetached()) {
				dateInput?.focus();
			}
		}
	}));

	function handleCalendarToggle(): void {
		if (!isEffectivelyDisabled) {
			if (popover.isOpen) {
				popover.hide();
			} else {
				popover.show();
			}
		}
	}

	function handleDateInputClick(): void {
		if (!isEffectivelyDisabled && !popover.isOpen) {
			popover.show({ skipAutoFocus: true });
		}
	}

	/**
	 * Commit a new date, carrying the existing time across — or the wall clock
	 * when there is none — and clamping it into range when the new date is the
	 * `min` or `max` boundary day.
	 */
	function handleDateChange(newDate: ISODateString, source: 'calendar' | 'input'): void {
		const currentTime = valueParts.time ?? getDefaultTime(hasSeconds);

		let effectiveTime = currentTime;
		if (minParts.date && newDate === minParts.date && minParts.time) {
			if (!isTimeInRange(effectiveTime, minParts.time, undefined)) {
				effectiveTime = minParts.time;
			}
		}
		if (maxParts.date && newDate === maxParts.date && maxParts.time) {
			if (!isTimeInRange(effectiveTime, undefined, maxParts.time)) {
				effectiveTime = maxParts.time;
			}
		}

		const combined = combineDateTime(newDate, effectiveTime);
		if (combined) {
			fireChange(combined);
		}
		if (source === 'calendar') {
			datePendingInput = null;
			popover.hide();
		}
	}

	function handleDateInputChange(e: Event): void {
		// With a disabledMessage the input drops `disabled` for focusability, so
		// guard value mutation explicitly (readonly also blocks typing).
		if (isEffectivelyDisabled) {
			return;
		}
		const text = (e.target as HTMLInputElement).value;
		datePendingInput = text;

		const parsed = parseDateInput(text);
		if (
			parsed &&
			plainDateToISO(parsed) !== valueParts.date &&
			!constraints.isDateDisabled(parsed)
		) {
			const parsedISO = plainDateToISO(parsed);
			lastFiredDate = parsedISO;
			handleDateChange(parsedISO, 'input');
			calendar?.navigateTo(parsedISO);
		}
	}

	function commitDatePendingInput(): void {
		if (datePendingInput === null) {
			return;
		}

		if (!datePendingInput.trim()) {
			if (value !== undefined) {
				fireChange(undefined);
			}
			datePendingInput = null;
			return;
		}

		const parsed = parseDateInput(datePendingInput);
		if (parsed && !constraints.isDateDisabled(parsed)) {
			const parsedISO = plainDateToISO(parsed);
			if (parsedISO !== valueParts.date) {
				handleDateChange(parsedISO, 'input');
			}
		}
		datePendingInput = null;
	}

	function handleDateKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape' && popover.isOpen) {
			e.preventDefault();
			popover.hide();
		} else if ((e.key === 'ArrowDown' || (e.altKey && e.key === 'ArrowDown')) && !popover.isOpen) {
			// APG combobox: ArrowDown (and Alt+ArrowDown) opens the calendar popover
			// from the keyboard, keeping focus in the input — matching `DateInput` and
			// the advertised combobox pattern.
			e.preventDefault();
			if (!isEffectivelyDisabled) {
				popover.show({ skipAutoFocus: true });
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			commitDatePendingInput();
		}
	}

	function handleTimeInputChange(e: Event): void {
		if (isEffectivelyDisabled) {
			return;
		}
		const text = (e.target as HTMLInputElement).value;
		timePendingInput = text;

		const parsed = parseTimeInput(text, hasSeconds);
		if (parsed && isTimeInRange(parsed, timeMin, timeMax) && parsed !== valueParts.time) {
			// A time with no date commits nothing — the value is one combined
			// string, and there is no date half to combine with yet.
			if (valueParts.date) {
				const combined = combineDateTime(valueParts.date, parsed);
				if (combined) {
					fireChange(combined);
				}
			}
		}
	}

	function handleTimeFocus(): void {
		// A disabled/busy input stays focusable (via aria-disabled) so its reason
		// is discoverable, but it must not present editing affordances — keep the
		// static placeholder rather than swapping in the format hint.
		if (isEffectivelyDisabled) {
			return;
		}
		isTimeFocused = true;
	}

	function handleTimeBlur(): void {
		isTimeFocused = false;
		if (timePendingInput === null) {
			return;
		}

		if (!timePendingInput.trim()) {
			// Empty time: revert the display to the previous value rather than
			// emitting a partial datetime.
			timePendingInput = null;
			return;
		}

		const parsed = parseTimeInput(timePendingInput, hasSeconds);
		if (parsed && isTimeInRange(parsed, timeMin, timeMax)) {
			if (parsed !== valueParts.time && valueParts.date) {
				const combined = combineDateTime(valueParts.date, parsed);
				if (combined) {
					fireChange(combined);
				}
			}
		}
		timePendingInput = null;
	}

	function handleTimeKeyDown(e: KeyboardEvent): void {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();

			let currentTime = valueParts.time;
			if (!currentTime) {
				const now = new Date();
				currentTime = formatISOTime(
					{ hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() },
					hasSeconds
				);
			}

			const delta = e.key === 'ArrowUp' ? timeIncrement : -timeIncrement;
			const newTime = adjustTime(currentTime, delta, hasSeconds);

			if (isTimeInRange(newTime, timeMin, timeMax) && valueParts.date) {
				const combined = combineDateTime(valueParts.date, newTime);
				if (combined) {
					fireChange(combined);
					// Screen readers do not announce the programmatic value rewrite,
					// so speak the new time explicitly (WCAG 4.1.2).
					announce(formatDisplayTime(newTime, hasSeconds));
				}
			}
		}
	}

	function handleClear(): void {
		fireChange(undefined);
		dateInput?.focus();
	}

	// Focus the time input when clicking its wrapper padding or clock glyph.
	const timeInputContainer = useInputContainer(() => ({
		container: timeContainer,
		input: timeInput,
		disabled: isEffectivelyDisabled
	}));

	// `disabled` reflects as `data-disabled` (and as a bare state class) so a theme
	// can reach the state without duplicating the component's own conditionals.
	// Keyed off `isDisabled`, not `isEffectivelyDisabled`: a busy field is not a
	// disabled one, and upstream reflects the prop.
	const theme = $derived(
		themeProps('date-time-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const rowAttrs = $derived(dateTimeInputRowAttrs(xstyle));
	const dateWrapperAttrs = $derived(
		dateTimeInputDateWrapperAttrs(size, status?.type, isEffectivelyDisabled)
	);
	const timeWrapperAttrs = $derived(
		dateTimeInputTimeWrapperAttrs(size, status?.type, isEffectivelyDisabled)
	);
	// The two segment wrappers are theming targets of their own, so a theme can
	// restyle their geometry (padding/height/font) — previously unreachable. Both
	// reflect `size` and `status` as data attributes, mirroring the root target.
	const dateSegmentTheme = $derived(
		themeProps('date-time-input-date-segment', { size, status: status?.type ?? null })
	);
	const timeSegmentTheme = $derived(
		themeProps('date-time-input-time-segment', { size, status: status?.type ?? null })
	);
	const toggleAttrs = $derived(dateTimeInputIconButtonAttrs(isEffectivelyDisabled));
	const iconAttrs = dateTimeInputIconAttrs();
	const dateControlAttrs = $derived(dateTimeInputAttrs(isEffectivelyDisabled, !isDateInputValid));
	const timeControlAttrs = $derived(dateTimeInputAttrs(isEffectivelyDisabled, !isTimeInputValid));
</script>

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
		<!-- Date input -->
		<div
			{...dateSegmentTheme}
			class={cx(dateSegmentTheme.class, dateWrapperAttrs.class)}
			style={dateWrapperAttrs.style}
			{@attach popover.attachTrigger}
		>
			<button
				type="button"
				onclick={handleCalendarToggle}
				disabled={isEffectivelyDisabled}
				aria-label={popover.isOpen
					? t('@astryx.dateInput.toggleCalendarClose')
					: t('@astryx.dateInput.openCalendar')}
				class={toggleAttrs.class}
				style={toggleAttrs.style}
			>
				<Icon icon="calendar" size="sm" color="secondary" />
			</button>
			<input
				bind:this={dateInput}
				id={dateInputId}
				type="text"
				role="combobox"
				value={dateDisplayValue}
				oninput={handleDateInputChange}
				onblur={commitDatePendingInput}
				onclick={handleDateInputClick}
				onkeydown={handleDateKeyDown}
				{placeholder}
				disabled={isEffectivelyDisabled && !showsDisabledMessage}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				readonly={showsDisabledMessage || undefined}
				aria-describedby={ariaDescribedBy}
				aria-required={isRequired === true ? 'true' : undefined}
				aria-invalid={status?.type === 'error' || !isDateInputValid ? 'true' : undefined}
				aria-busy={isBusy || undefined}
				aria-expanded={popover.isOpen}
				aria-haspopup="dialog"
				aria-controls={popover.isOpen ? popover.id : undefined}
				aria-autocomplete="none"
				autocomplete="off"
				class={dateControlAttrs.class}
				style={dateControlAttrs.style}
			/>
			<!--
				Live region announcing invalid typed date input to assistive
				technology. The value silently reverts on blur, so without this a
				screen-reader user would get no feedback that their entry was
				rejected (WCAG 3.3.1).
			-->
			<VisuallyHidden as="div" role="alert" aria-live="assertive">
				{!isDateInputValid ? t('@astryx.dateInput.invalidDate') : ''}
			</VisuallyHidden>
			{#if hasClear && value !== undefined && !isEffectivelyDisabled}
				<InputClearButton label={t('@astryx.dateInput.clear', { label })} onclick={handleClear} />
			{/if}
			{#if isBusy}<Spinner size="sm" />{/if}
			<InputStatusIcon {statusIcon} />
		</div>

		<!-- Time input -->
		<div
			bind:this={timeContainer}
			{...timeInputContainer}
			{...timeSegmentTheme}
			class={cx(timeSegmentTheme.class, timeWrapperAttrs.class)}
			style={timeWrapperAttrs.style}
		>
			<div class={iconAttrs.class} style={iconAttrs.style}>
				<Icon icon="clock" size="sm" color="secondary" />
			</div>
			<input
				bind:this={timeInput}
				id={timeInputId}
				type="text"
				value={timeDisplayValue}
				oninput={handleTimeInputChange}
				onfocus={handleTimeFocus}
				onblur={handleTimeBlur}
				onkeydown={handleTimeKeyDown}
				placeholder={resolvedTimePlaceholder}
				disabled={isEffectivelyDisabled && !showsDisabledMessage}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				readonly={showsDisabledMessage || undefined}
				aria-label={timeLabel ?? t('@astryx.dateTimeInput.timeSuffix', { label })}
				aria-describedby={ariaDescribedBy}
				aria-required={isRequired === true ? 'true' : undefined}
				aria-invalid={status?.type === 'error' || !isTimeInputValid ? 'true' : undefined}
				aria-busy={isBusy || undefined}
				class={timeControlAttrs.class}
				style={timeControlAttrs.style}
			/>
			<!--
				Live region announcing invalid typed time input to assistive
				technology (WCAG 3.3.1).
			-->
			<VisuallyHidden as="div" role="alert" aria-live="assertive">
				{!isTimeInputValid ? t('@astryx.timeInput.invalidTime') : ''}
			</VisuallyHidden>
		</div>
	</div>

	<PopoverLayer {popover} placement="below" alignment="start">
		<Calendar
			bind:this={calendar}
			mode="single"
			value={valueParts.date}
			onChange={(d: ISODateString) => handleDateChange(d, 'calendar')}
			min={calendarMin}
			max={calendarMax}
			{dateConstraints}
			{numberOfMonths}
			{weekStartsOn}
		/>
	</PopoverLayer>

	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
