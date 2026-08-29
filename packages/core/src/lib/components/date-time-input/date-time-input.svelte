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

	/**
	 * Supported minute cadences for the preset-time dropdown. Every value divides
	 * an hour evenly, so each option lands on a round clock time.
	 */
	export type DateTimeInputTimeOptionInterval = 5 | 10 | 15 | 30 | 60;

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
		 * Minute cadence for a dropdown of preset times on the time field. Set it to
		 * turn the time field into a combobox listing every valid time at that
		 * cadence (`60` gives the 12 AM - 11 PM list, `15` a quarter-hour list).
		 *
		 * Omitted, the time field stays a plain text input: typed entry and
		 * arrow-key stepping only, with no combobox semantics added to the
		 * accessibility tree. Typed entry keeps working when the dropdown is on —
		 * the list is a shortcut, not a restriction, so a time between two options
		 * can still be typed.
		 *
		 * Independent of `timeIncrement`, which governs arrow-key stepping. Setting
		 * both to the same value is the usual choice for scheduling flows.
		 */
		timeOptionInterval?: DateTimeInputTimeOptionInterval;
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

	const MINUTES_PER_DAY = 24 * 60;

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
	import { isImeKeyEvent } from '../../utils/ime.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import { parseDateInput } from '../../utils/date-parser.js';
	import {
		adjustTime,
		formatDisplayTime12h,
		formatDisplayTime24h,
		formatISOTime,
		isTimeInRange,
		parseISOTime,
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
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import {
		dateTimeInputAttrs,
		dateTimeInputDateWrapperAttrs,
		dateTimeInputIconAttrs,
		dateTimeInputIconButtonAttrs,
		dateTimeInputRowAttrs,
		dateTimeInputTimeListboxAttrs,
		dateTimeInputTimeOptionAttrs,
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
		timeOptionInterval,
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

	// Announce the effective required state (form default included) while the
	// native `required` stays bound to the explicit `isRequired`, so a layout
	// default never switches on browser validation.
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});

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
	const timePopoverID = `${uid}-time-popover`;
	const timeListboxId = `${uid}-time-listbox`;
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
			return hourFormat === '12h'
				? t('@astryx.dateTimeInput.timeHint12h')
				: t('@astryx.dateTimeInput.timeHint24h');
		}
		return timePlaceholder;
	});

	// The time field's own accessible name. The option list is named from this
	// rather than from `label`, so a consumer-supplied `timeLabel` renames both
	// together instead of leaving the list announcing the old name.
	const resolvedTimeLabel = $derived(timeLabel ?? t('@astryx.dateTimeInput.timeSuffix', { label }));

	// --- Preset time options ---
	// Opt-in: without `timeOptionInterval` the time field keeps exactly the
	// semantics it shipped with — a plain text input, no combobox role, no second
	// listbox in the accessibility tree.
	const hasTimeOptions = $derived(timeOptionInterval !== undefined);

	const timeOptions = $derived.by(() => {
		if (timeOptionInterval === undefined) {
			return [];
		}
		const options: { time: ISOTimeString; label: string }[] = [];
		for (let minutes = 0; minutes < MINUTES_PER_DAY; minutes += timeOptionInterval) {
			const time = formatISOTime(
				{ hour: Math.floor(minutes / 60), minute: minutes % 60, second: 0 },
				hasSeconds
			);
			// The same bound the typed path enforces, so the list can never offer a
			// time that typing the identical string would reject.
			if (!isTimeInRange(time, timeMin, timeMax)) {
				continue;
			}
			options.push({ time, label: formatDisplayTime(time, hasSeconds) });
		}
		return options;
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
		// Guard the composing keydown (fires before compositionend): an IME uses
		// Enter to commit the candidate and Escape to cancel it, so without this
		// a CJK user committing a syllable with Enter would commit the pending
		// date instead. See utils/ime.ts.
		if (isImeKeyEvent(e)) {
			return;
		}
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

	// --- Time-option popover ---
	let highlightedTimeIndex = $state(-1);

	// With `popover="auto"`, showing the popover between pointerdown and
	// pointerup/click lets the browser's light dismiss treat that same click as
	// "outside" and close it again. Defer the show past the click, as
	// `BaseTypeahead` does for the same reason. Upstream's refs are plain `let`s
	// here — nothing reads them reactively.
	let timePointerActive = false;

	// Whether the highlight is still the one typing derived, or the user has since
	// moved it themselves. Enter honours typed text only in the former case —
	// otherwise the field would commit something other than the option it is
	// showing as active.
	let timeHighlightFollowsTyping = true;

	function markTimePointerActive(): void {
		timePointerActive = true;
		document.addEventListener(
			'click',
			() => {
				timePointerActive = false;
			},
			{ once: true }
		);
	}

	const timePopover = usePopover(() => ({
		id: timePopoverID,
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own `role="listbox"` carries the semantics; the input keeps
		// DOM focus, so announcing a dialog here would misrepresent it.
		role: 'none' as const,
		onHide: () => {
			highlightedTimeIndex = -1;
		}
	}));

	// Anchor the list to the time wrapper, not the date input the field's own
	// trigger attachment points at. Upstream's effect calls
	// `timePopover.triggerRef(el)` and `triggerRef(null)` on cleanup;
	// `attachTrigger` is the same seam, used imperatively.
	$effect(() => {
		const el = timeContainer;
		const enabled = hasTimeOptions;
		if (!enabled || !el) {
			return;
		}
		return timePopover.attachTrigger(el);
	});

	function timeOptionId(index: number): string {
		return `${timeListboxId}-option-${index}`;
	}

	// A field can go disabled or busy while its list is open — a `changeAction`
	// starting elsewhere in the form is enough. Leave it up and the dropdown hangs
	// over a control that no longer accepts input. The same applies to a list that
	// empties after it opened, which a narrowing min/max window does. An
	// open-but-empty list gates the keyboard switch off, so the arrows quietly
	// fall back to stepping the value instead.
	//
	// All three reads are hoisted above the condition so the dependency set is the
	// same on every run — a read short-circuited away would not be tracked, and the
	// effect would stop re-running.
	$effect(() => {
		const isOpen = timePopover.isOpen;
		const count = timeOptions.length;
		const disabled = isEffectivelyDisabled;
		if (isOpen && (disabled || count === 0)) {
			timePopover.hide();
		}
	});

	// The option list can shrink under an open popover — min/max tighten when the
	// date moves onto a boundary day, or the cadence prop changes. A stale index
	// past the new end shows no highlight at all and makes the arrow keys look
	// dead until the user walks it back into range.
	//
	// Clamped as it is read rather than synced through an effect: no extra render,
	// and the index can never point past the end even for the paint where the list
	// shrank.
	const activeTimeIndex = $derived(
		highlightedTimeIndex > timeOptions.length - 1 ? timeOptions.length - 1 : highlightedTimeIndex
	);

	// Keep the active option visible. The listbox is a fixed-height scroll
	// container, so without this a list opens at midnight with the highlight far
	// below the fold, and keyboard navigation walks off-screen. Mirrors
	// `BaseTypeahead`'s `scrollIntoView({block: 'nearest'})`.
	$effect(() => {
		const isOpen = timePopover.isOpen;
		const index = activeTimeIndex;
		const count = timeOptions.length;
		if (!isOpen || index < 0 || index >= count) {
			return;
		}
		document.getElementById(timeOptionId(index))?.scrollIntoView?.({ block: 'nearest' });
	});

	/**
	 * The selected time in the same shape the options carry. `splitDateTime` slices
	 * whatever follows the `T`, so a caller passing `14:00:00` with `hasSeconds`
	 * off leaves `"14:00:00"` against options of `"14:00"` — comparing raw would
	 * mark nothing selected, silently.
	 */
	const selectedOptionTime = $derived.by(() => {
		if (!valueParts.time) {
			return undefined;
		}
		const parsed = parseISOTime(valueParts.time);
		return parsed ? formatISOTime(parsed, hasSeconds) : undefined;
	});

	/**
	 * Index of the option at or immediately before `time`, so opening on a value
	 * that is not itself an option (13:07 in a 15-minute list) still lands the
	 * highlight somewhere sensible instead of nowhere.
	 */
	function closestOptionIndex(time: ISOTimeString | undefined): number {
		if (timeOptions.length === 0) {
			return -1;
		}
		// No time yet — the state a field lands in once a date is picked. The list
		// still opens on the first option, per the APG listbox pattern; leaving it
		// inactive made ArrowUp and Enter do nothing at all.
		if (!time) {
			return 0;
		}
		let candidate = -1;
		for (let i = 0; i < timeOptions.length; i++) {
			if (timeOptions[i].time <= time) {
				candidate = i;
			} else {
				break;
			}
		}
		// A value below every option (min pushes the list past it) still gets the
		// first option rather than an empty highlight.
		return candidate === -1 ? 0 : candidate;
	}

	function showTimeOptions(): void {
		if (
			!hasTimeOptions ||
			isEffectivelyDisabled ||
			timePopover.isOpen ||
			// A min/max window narrower than the cadence survives no option at all.
			// Opening on that would show an empty panel with nothing to pick.
			timeOptions.length === 0
		) {
			return;
		}
		highlightedTimeIndex = closestOptionIndex(selectedOptionTime);
		// `useInputContainer` routes wrapper clicks through `input.click()` once the
		// input advertises a popup, and a programmatic click does not focus. The
		// input must hold DOM focus or `aria-activedescendant` announces nothing.
		timeInput?.focus();
		if (timePointerActive) {
			document.addEventListener(
				'click',
				() => requestAnimationFrame(() => timePopover.show({ skipAutoFocus: true })),
				{ once: true }
			);
		} else {
			timePopover.show({ skipAutoFocus: true });
		}
	}

	/**
	 * The single commit path for a time chosen from the list. Deliberately the same
	 * shape as the typed path: same range check, same date requirement, so picking
	 * 9:00 AM and typing "9:00 AM" are indistinguishable downstream.
	 */
	function commitTimeOption(time: ISOTimeString): void {
		if (isEffectivelyDisabled || !isTimeInRange(time, timeMin, timeMax)) {
			return;
		}
		timePendingInput = null;
		// Compared against the normalised time, the same one the selected marker
		// uses. Comparing the raw value instead made clicking the option that
		// renders as selected emit a change, whenever the value carried seconds the
		// field does not display.
		if (time !== selectedOptionTime && valueParts.date) {
			const combined = combineDateTime(valueParts.date, time);
			if (combined) {
				fireChange(combined);
			}
		}
		timePopover.hide();
		timeInput?.focus();
	}

	function handleTimeInputChange(e: Event): void {
		if (isEffectivelyDisabled) {
			return;
		}
		const text = (e.target as HTMLInputElement).value;
		timePendingInput = text;

		const parsed = parseTimeInput(text, hasSeconds);

		// Typing narrows nothing — free-form entry is the contract, and a time
		// between two options must stay reachable. The list instead follows the
		// typed value so Enter lands somewhere the user expects.
		if (timePopover.isOpen && parsed) {
			timeHighlightFollowsTyping = true;
			highlightedTimeIndex = closestOptionIndex(parsed);
		}

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

	function handleTimeBlur(e: FocusEvent): void {
		isTimeFocused = false;

		// Native light dismiss only fires on outside clicks and Escape, so a focus
		// move that is neither — Tab handled elsewhere, or a programmatic focus —
		// would strand the listbox open in the top layer. Focus landing inside the
		// field or the popup itself is not a leave. Mirrors `BaseTypeahead`.
		if (timePopover.isOpen) {
			const next = e.relatedTarget as Node | null;
			const popoverEl = next ? document.getElementById(timePopover.id) : null;
			if (!next || !(timeContainer?.contains(next) || popoverEl?.contains(next))) {
				timePopover.hide();
			}
		}

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
		// ArrowUp/ArrowDown step the time and preventDefault; an IME candidate
		// window uses those same arrows to navigate candidates, so guard the
		// composing keydown (fires before compositionend) to avoid stealing them
		// mid-composition. See utils/ime.ts.
		if (isImeKeyEvent(e)) {
			return;
		}

		// The dropdown claims the arrow keys only while it is open. Closed, they
		// keep stepping the value by `timeIncrement` exactly as they always have —
		// that behaviour is documented and tested, so the list borrows Alt+ArrowDown
		// (the APG "open without moving" binding) to open instead.
		if (hasTimeOptions && !isEffectivelyDisabled) {
			if (e.key === 'Escape' && timePopover.isOpen) {
				e.preventDefault();
				timePopover.hide();
				return;
			}

			if (e.key === 'ArrowDown' && e.altKey) {
				e.preventDefault();
				// A keyboard open is never mid-click, so clear the deferral flag. A
				// press that ended without a click would otherwise leave it set and
				// hold every later open hostage to the next click anywhere.
				timePointerActive = false;
				showTimeOptions();
				return;
			}

			if (timePopover.isOpen && timeOptions.length > 0) {
				switch (e.key) {
					case 'ArrowDown':
						e.preventDefault();
						timeHighlightFollowsTyping = false;
						highlightedTimeIndex =
							activeTimeIndex < timeOptions.length - 1 ? activeTimeIndex + 1 : activeTimeIndex;
						return;
					case 'ArrowUp':
						e.preventDefault();
						timeHighlightFollowsTyping = false;
						highlightedTimeIndex = activeTimeIndex > 0 ? activeTimeIndex - 1 : activeTimeIndex;
						return;
					case 'Home':
						e.preventDefault();
						timeHighlightFollowsTyping = false;
						highlightedTimeIndex = 0;
						return;
					case 'End':
						e.preventDefault();
						timeHighlightFollowsTyping = false;
						highlightedTimeIndex = timeOptions.length - 1;
						return;
					case 'Enter': {
						e.preventDefault();
						// Typed text wins over the highlight. The highlight only tracks the
						// option at or before what was typed, so committing it here would
						// round 1:07 PM down to 1:00 PM and discard the entry.
						const typed =
							timeHighlightFollowsTyping && timePendingInput !== null
								? parseTimeInput(timePendingInput, hasSeconds)
								: null;
						const option = timeOptions[activeTimeIndex];
						if (typed) {
							commitTimeOption(typed);
						} else if (option) {
							commitTimeOption(option.time);
						}
						return;
					}
					case 'Tab':
						// Let focus leave; blur commits any typed text as usual.
						timePopover.hide();
						return;
					default:
						break;
				}
			}
		}

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
	// The preset-time list and each of its rows are theming targets of their own,
	// so a theme can restyle the dropdown without reaching through the shared
	// popover surface.
	const timeListboxTheme = $derived(themeProps('date-time-input-time-listbox'));
	const timeListboxAttrs = dateTimeInputTimeListboxAttrs();
	const timeOptionTheme = $derived(themeProps('date-time-input-time-option'));
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
				<!--
					Stable theme target on the calendar glyph, and on each open/closed
					state, mirroring `date-input-toggle-icon`. Same-element rules in
					`@layer astryx-theme` win over the icon's own base colour and size,
					which a segment-level target could not reach.
				-->
				<Icon
					icon="calendar"
					size="sm"
					color="secondary"
					{...themeProps('date-time-input-toggle-icon', {
						state: popover.isOpen ? 'expanded' : 'collapsed'
					})}
				/>
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
				aria-required={isEffectivelyRequired() ? 'true' : undefined}
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
			onpointerdown={hasTimeOptions ? markTimePointerActive : undefined}
			{...timeSegmentTheme}
			class={cx(timeSegmentTheme.class, timeWrapperAttrs.class)}
			style={timeWrapperAttrs.style}
		>
			<div class={iconAttrs.class} style={iconAttrs.style}>
				<!--
					The time segment has no toggle button — the clock is a static leading
					affordance — so this target carries no interactive state.
				-->
				<Icon
					icon="clock"
					size="sm"
					color="secondary"
					{...themeProps('date-time-input-clock-icon')}
				/>
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
				onclick={hasTimeOptions ? showTimeOptions : undefined}
				onpointerdown={hasTimeOptions ? markTimePointerActive : undefined}
				placeholder={resolvedTimePlaceholder}
				role={hasTimeOptions ? 'combobox' : undefined}
				aria-expanded={hasTimeOptions ? timePopover.isOpen : undefined}
				aria-controls={hasTimeOptions && timePopover.isOpen ? timeListboxId : undefined}
				aria-autocomplete={hasTimeOptions ? 'list' : undefined}
				aria-activedescendant={hasTimeOptions &&
				timePopover.isOpen &&
				activeTimeIndex >= 0 &&
				activeTimeIndex < timeOptions.length
					? timeOptionId(activeTimeIndex)
					: undefined}
				disabled={isEffectivelyDisabled && !showsDisabledMessage}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				readonly={showsDisabledMessage || undefined}
				aria-label={resolvedTimeLabel}
				aria-describedby={ariaDescribedBy}
				aria-required={isEffectivelyRequired() ? 'true' : undefined}
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

	{#if hasTimeOptions}
		<PopoverLayer popover={timePopover} placement="below" alignment="start">
			<!--
				The layer renders its children open or closed, so mount the list only
				while it is open — a 5-minute cadence is 288 nodes that would otherwise
				sit in the DOM of every opted-in field for its lifetime.
			-->
			{#if timePopover.isOpen}
				<div
					id={timeListboxId}
					role="listbox"
					aria-label={t('@astryx.dateTimeInput.timeOptionsLabel', { label: resolvedTimeLabel })}
					{...timeListboxTheme}
					class={cx(timeListboxTheme.class, timeListboxAttrs.class)}
					style={timeListboxAttrs.style}
				>
					{#each timeOptions as option, index (option.time)}
						{@const isSelected = option.time === selectedOptionTime}
						{@const optionAttrs = dateTimeInputTimeOptionAttrs(
							size,
							index === activeTimeIndex,
							isSelected
						)}
						<!--
							A `role="option"` div with click and hover handlers, as upstream
							renders. The keyboard model belongs to the input, which keeps DOM
							focus and drives selection through `aria-activedescendant`, so the
							row carries `tabindex="-1"` (it must be focusable-by-click so the
							blur handler can tell "inside the popover" from a genuine
							focus-out) and has no key handler of its own.
						-->
						<div
							id={timeOptionId(index)}
							role="option"
							aria-selected={isSelected}
							tabindex={-1}
							onpointerdown={(e) => e.preventDefault()}
							onclick={() => commitTimeOption(option.time)}
							onmouseenter={() => (highlightedTimeIndex = index)}
							{...timeOptionTheme}
							class={cx(timeOptionTheme.class, optionAttrs.class)}
							style={optionAttrs.style}
						>
							{option.label}
						</div>
					{/each}
				</div>
			{/if}
		</PopoverLayer>
	{/if}

	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
