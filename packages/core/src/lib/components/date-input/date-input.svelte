<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type { DayOfWeek, DayOfWeekName, ISODateString } from '../../utils/date-types.js';
	import type { TimestampFormat } from '../timestamp/timestamp-format.js';
	// `DateInputSize` is published from `date-input.stylex.ts`, derived from the
	// size style keys — the arrangement `TextInput`/`NumberInput`/`TimeInput` use.
	import type { DateInputSize } from './date-input.stylex.js';

	// `DateInputStatus`/`DateInputStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream re-exports them from `DateInput.tsx`.
	export type DateInputStatus = InputStatus;
	export type DateInputStatusType = InputStatusType;

	/**
	 * Named display formats for a committed date value. These are the date-only
	 * members of Timestamp's `format` vocabulary — reused verbatim (via
	 * `Extract`) so the same literal renders the same date shape in both
	 * `Timestamp` and `DateInput`:
	 * - `'date'`: locale short-month date, e.g. "Mar 21, 2026"
	 * - `'date_long'`: locale long-month date, e.g. "March 21, 2026" (the default)
	 * - `'date_weekday'`: short weekday + date, e.g. "Wed, Mar 21, 2026"
	 * - `'system_date'`: ISO 8601 calendar date, e.g. "2026-03-21"
	 *
	 * Because `DateInputFormat` is `Extract`ed from `TimestampFormat`, the two
	 * types stay in compile-time lockstep: renaming or removing one of these
	 * members from `TimestampFormat` breaks this type at build time.
	 */
	export type DateInputFormat = Extract<
		TimestampFormat,
		'date' | 'date_long' | 'date_weekday' | 'system_date'
	>;

	/**
	 * `onchange` and `defaultValue` are the only omissions, matching upstream.
	 *
	 * Upstream spreads `...rest` onto the **wrapper `<div>`**, not the `<input>` —
	 * unlike `TimeInput`/`NumberInput`, which spread onto the input. That is
	 * upstream's own inconsistency and is replicated: a caller's `data-testid`
	 * lands on the bordered surface here, and the `BaseProps` element type is
	 * `HTMLDivElement` to match.
	 *
	 * That rest target is also why `oninput`/`onblur`/`onclick`/`onkeydown` are
	 * **not** omitted, where `NumberInput` omits them. `NumberInput`'s reason is
	 * real but local: upstream spreads rest onto the very `<input>` that carries
	 * the composed handlers, so a caller's would be silently shadowed. Here the
	 * composed handlers sit on the inner `<input>` while rest goes to the wrapper,
	 * so nothing can shadow anything — a caller's `onclick` lands on the div and
	 * fires on bubble alongside the component's own, exactly as upstream's does.
	 * Omitting them would narrow a published props type against a hazard this
	 * component does not have.
	 */
	export interface DateInputProps extends Omit<
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
		 * the field stays focusable (via `aria-disabled`) so the reason is
		 * discoverable by keyboard and assistive technology. Typing and calendar
		 * activation stay blocked.
		 *
		 * Use this instead of wrapping a disabled input in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/** The selected date in ISO format (YYYY-MM-DD). */
		value?: ISODateString;
		/**
		 * Callback fired when the date changes. Called with `undefined` when the
		 * input is cleared.
		 */
		onChange?: (value: ISODateString | undefined) => void;
		/** Async action on change. Fires after `onChange`. */
		changeAction?: (value: ISODateString | undefined) => void | Promise<void>;
		/**
		 * Whether the input is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/** Minimum selectable date in ISO format. */
		min?: ISODateString;
		/** Maximum selectable date in ISO format. */
		max?: ISODateString;
		/** Custom date constraint functions. Date is disabled if ANY function returns false. */
		dateConstraints?: ReadonlyArray<(date: Date) => boolean>;
		/**
		 * Placeholder text shown when no date is selected.
		 * @default "Select a date"
		 */
		placeholder?: string;
		/**
		 * The size of the input. Inherited from an enclosing `SizeContext` when unset.
		 * @default 'md'
		 */
		size?: DateInputSize;
		/**
		 * Status indicator for the input. When set, displays a coloured border and
		 * status icon; if `message` is provided, it displays below the input.
		 */
		status?: InputStatus;
		/**
		 * How the status message is placed relative to the input.
		 * - `attached`: message overlaps directly below the input (bordered treatment)
		 * - `detached`: message floats below as a separate element with spacing
		 * - `tooltip`: no message box; the status icon becomes a focusable info-tip
		 *   button that reveals the message on hover, keyboard focus, or tap
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Whether to show a clear button when a date is set. When clicked, resets
		 * the value to `undefined` and returns focus to the input.
		 * @default false
		 */
		hasClear?: boolean;
		/**
		 * Number of months to display in the calendar popover.
		 * @default 1
		 */
		numberOfMonths?: 1 | 2;
		/**
		 * First day of week in the calendar popover. Accepts a number
		 * (0 = Sunday … 6 = Saturday) or a three-letter day name ('sun'–'sat',
		 * case-insensitive).
		 * @default 0
		 */
		weekStartsOn?: DayOfWeek | DayOfWeekName;
		/**
		 * How a committed date is displayed:
		 * - `'date_long'`: long-month date, e.g. "March 21, 2026" (the default)
		 * - `'date'`: short-month date, e.g. "Mar 21, 2026"
		 * - `'date_weekday'`: short weekday + date, e.g. "Wed, Mar 21, 2026"
		 * - `'system_date'`: ISO 8601 calendar date, e.g. "2026-03-21"
		 * - `(value: ISODateString) => string`: fully custom display string
		 *
		 * Formatting applies only to the committed value — never to text the user
		 * is actively typing. A custom function's output that `parseDateInput`
		 * cannot read back can't be re-committed after an edit; external `value`
		 * changes always recompute the display from the ISO value.
		 *
		 * @default 'date_long'
		 * @example
		 * ```svelte
		 * <DateInput label="Ship date" value={date} onChange={setDate} format="date" />
		 * <DateInput
		 *   label="Ship date"
		 *   value={date}
		 *   onChange={setDate}
		 *   format={(iso) => new Date(iso + 'T00:00').toDateString()}
		 * />
		 * ```
		 */
		format?: DateInputFormat | ((value: ISODateString) => string);
	}
</script>

<script lang="ts">
	import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
	import PointerDateField from './pointer-date-field.svelte';
	import TouchDateField from './touch-date-field.svelte';

	/**
	 * The pointer that decides which surface a `DateInput` renders.
	 *
	 * `pointer: coarse` is the *primary* pointing device, which is what makes it
	 * the whole test. A touchscreen laptop reports `fine` (its trackpad) with
	 * `any-pointer: coarse` alongside, so it keeps the typable field — right,
	 * because its keyboard is there. A tablet reports `coarse` and gets the
	 * picker, at any width. There is deliberately no width bound: it would only
	 * re-exclude the tablets, since a narrowed desktop window is still a mouse.
	 *
	 * Deliberately NOT exported — upstream's reasoning, kept: it was, briefly,
	 * on the theory that an app might want to ask the same question and lay out
	 * to match, but nothing asked, and other components just write
	 * `@media (pointer: coarse)` inline rather than sharing a constant. An
	 * export is additive later and awkward to withdraw, so it waits for a real
	 * caller.
	 */
	const TOUCH_POINTER_QUERY = '(pointer: coarse)';

	/**
	 * A date picker that fits the pointer it is being used with.
	 *
	 * With a mouse or trackpad this is a text input you can type into, with a
	 * calendar in a popover — unchanged, and still the surface every existing
	 * consumer gets. With a finger it is a picker built for one: a bottom sheet
	 * holding one month per screen, swiped sideways, with month and year wheels
	 * behind the header title for the far jumps swiping is bad at.
	 *
	 * The props are identical either way — this is one component with two
	 * surfaces, not two components — so nothing at the call site changes, and a
	 * date typed on a laptop and a date thumbed on a phone are the same value.
	 *
	 * ## Why a runtime switch and not CSS
	 *
	 * The two surfaces are structurally different — a popover anchored to a text
	 * field versus a full-width sheet holding a scroller — so "render both, hide
	 * one" would double the DOM, double the tab stops, and mount two calendars.
	 * The condition is not layout either: it is *which interaction is faster*,
	 * and that depends on the pointer, which CSS cannot hand to JS.
	 *
	 * ## Hydration
	 *
	 * `useMediaQuery` reports its `serverDefault` (false) during SSR, so server
	 * HTML is always the pointer field and the swap happens on the client. That
	 * is deliberately unobservable: both surfaces render the SAME closed field —
	 * a bordered input with a calendar icon and the formatted date — and differ
	 * only in what opens. Nothing moves; the field just starts opening a sheet.
	 *
	 * Note the one honest difference from upstream, and it is `useMediaQuery`'s
	 * rather than this component's: our hook subscribes in `$effect.pre`, so a
	 * client-only mount never paints the pointer field first, while a hydrating
	 * mount on a coarse-pointer device takes Svelte's mismatch-recovery path for
	 * this `{#if}` — the server's field is discarded and the touch field is
	 * built client-side. The rendered result is the same either way. See
	 * `hooks/use-media-query.svelte.ts`.
	 *
	 * @example
	 * ```svelte
	 * <DateInput label="Event date" value={date} onChange={(v) => (date = v)} />
	 * ```
	 */
	const props: DateInputProps = $props();

	const isTouch = useMediaQuery(() => TOUCH_POINTER_QUERY);
</script>

{#if isTouch.matches}
	<TouchDateField {...props} />
{:else}
	<PointerDateField {...props} />
{/if}
