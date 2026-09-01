<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { DayOfWeek, DayOfWeekName } from '../../utils/date-types.js';
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
</script>

<script lang="ts">
	import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
	import PointerDateTimeField from './pointer-date-time-field.svelte';
	import TouchDateTimeField from './touch-date-time-field.svelte';

	/**
	 * The pointer that decides which surface a `DateTimeInput` renders — the same
	 * test `DateInput` applies, and module-private for the same reason: nothing has
	 * asked to share it, and an export is additive later and awkward to withdraw.
	 */
	const TOUCH_POINTER_QUERY = '(pointer: coarse)';

	/**
	 * A combined date and time picker that keeps the desktop text-entry surface on
	 * mouse/trackpad devices and uses Astryx's custom bottom-sheet picker on coarse
	 * pointers.
	 *
	 * Unlike `DateInput`, this never hands touch picking to the browser/OS — there
	 * is no `nativePicker` here and upstream publishes none: the mobile flow has to
	 * coordinate date and time together, preserve drafted time before a date
	 * exists, and enforce datetime `min`/`max` across both panels, none of which a
	 * pair of platform pickers can do.
	 *
	 * ## Hydration
	 *
	 * `useMediaQuery` reports its `serverDefault` (false) during SSR, so server HTML
	 * is always the pointer surface and the swap happens on the client — the same
	 * arrangement, and the same one honest difference from upstream, that
	 * `date-input.svelte` documents.
	 *
	 * @example
	 * ```svelte
	 * <DateTimeInput label="Meeting time" value={dateTime} onChange={(v) => (dateTime = v)} />
	 * ```
	 */
	const props: DateTimeInputProps = $props();

	const isTouch = useMediaQuery(() => TOUCH_POINTER_QUERY);
</script>

{#if isTouch.matches}
	<TouchDateTimeField {...props} />
{:else}
	<PointerDateTimeField {...props} />
{/if}
