<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type { ISODateString } from '../../utils/date-types.js';
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
	import { untrack } from 'svelte';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { parseDateInput } from '../../utils/date-parser.js';
	import { formatSharedDate, plainDateFromISO, plainDateToISO } from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Calendar from '../calendar/calendar.svelte';
	import type { CalendarHandle } from '../calendar/calendar.svelte';
	import { useCalendarConstraints } from '../calendar/use-calendar-constraints.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import {
		dateInputAttrs,
		dateInputIconButtonAttrs,
		dateInputWrapperAttrs
	} from './date-input.stylex.js';

	/**
	 * A date picker: a text input paired with a `Calendar` in a popover — or, when
	 * nested in an `InputGroup`, a bare control that borrows the group's label and
	 * collapses its border into the row.
	 *
	 * Typing is free-form and parsed on every keystroke by `parseDateInput`, which
	 * is locale-aware (it reads whether the runtime formats day-first). An entry
	 * that parses *and* passes `min`/`max`/`dateConstraints` commits immediately
	 * and scrolls the calendar to that month; anything else is held in a pending
	 * buffer, dims the text, announces itself and reverts on blur. ArrowDown (and
	 * Alt+ArrowDown) opens the calendar without moving focus, per APG combobox.
	 *
	 * @example
	 * ```svelte
	 * <DateInput label="Event date" value={date} onChange={(v) => (date = v)} />
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
		placeholder: placeholderFromProps,
		size: sizeProp,
		status,
		statusVariant = 'attached',
		labelTooltip,
		hasClear = false,
		numberOfMonths = 1,
		format = 'date_long',
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateInputProps = $props();

	const t = useTranslator();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.dateInput.placeholder'));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	const inputGroup = useInputGroup();

	// One base id with derived suffixes — the counterpart to upstream's four
	// `useId` calls, plus two more our hooks take as inputs where upstream's mint
	// them internally.
	const uid = $props.id();
	const id = `${uid}-input`;
	const inputLabelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const popoverID = `${uid}-popover`;
	const tooltipID = `${uid}-tooltip`;

	let input = $state<HTMLInputElement | null>(null);
	// Upstream's `calendarRef`, a `CalendarHandle`. Reached by `bind:this` here,
	// because the handle is an instance export rather than a `handleRef` prop.
	let calendar = $state<CalendarHandle | null>(null);

	// Upstream's `useOptimistic` + `useTransition` pair.
	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);
	const isEffectivelyDisabled = $derived(isDisabled || isBusy);

	// Only the persistent `isDisabled` state — not the transient busy state —
	// surfaces a reason. A disabled field with one stays perceivable: it takes
	// aria-disabled and readonly instead of the native disabled attribute, and the
	// tooltip listeners attach to the always-present wrapper.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The container div is not naturally focusable; focusin bubbles up from
		// the input, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant,
		isInGroup: inputGroup != null
	}));

	// Constraint checking for text input validation (reuses the calendar logic).
	const constraints = useCalendarConstraints(() => ({ min, max, dateConstraints }));

	const groupValue = $derived(inputGroup ? inputGroup() : null);
	const aria = $derived(
		getInputARIA(
			inputLabelID,
			[
				description ? descriptionID : null,
				// The status message element is rendered by `Field`, which is skipped
				// inside an `InputGroup` — only reference it when it actually exists.
				//
				// The `!inputGroup` half is ours: upstream omits it here while
				// carrying it (with this comment) in `TextInput` and `NumberInput`,
				// and unlike `TimeInput` this component renders no in-group status
				// element — so upstream's `aria-describedby` points at nothing inside
				// a group. Recorded in TODO.md under Known debts.
				!inputGroup && statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
				// The tooltip variant renders no message box; describe the input by the
				// tooltip's content instead so the status is still announced.
				statusIcon.describedBy ?? null,
				showsDisabledMessage ? disabledMessageTooltip.describedBy : null
			],
			groupValue ? { labelID: groupValue.labelID, describedByIDs: groupValue.describedByIDs } : null
		)
	);

	// Pending input while the user is typing (null = show the formatted value).
	let pendingInput = $state<string | null>(null);

	/**
	 * The last value this component itself fired, and the previous `value` prop.
	 *
	 * Upstream clears the pending buffer when `value` changes *externally* —
	 * during render, via two refs, "to avoid an extra render cycle". The
	 * distinction is load-bearing: a value change this component caused (by
	 * parsing what the user typed) must **not** wipe the half-typed text, while a
	 * change from anywhere else must.
	 *
	 * Plain `let`s rather than `$state`, and the comparison runs inside the same
	 * `$derived` that reads `value` — so it happens before the render that
	 * consumes `pendingInput`, which is what upstream's render-phase mutation
	 * achieves. Making them `$state` would make the effect depend on its own
	 * writes.
	 */
	let lastFiredValue: ISODateString | undefined = undefined;
	let prevValue: ISODateString | undefined = value;

	$effect.pre(() => {
		const next = value;
		// `value` is the only dependency. `pendingInput` is read *and* written
		// here, so tracking it would make the effect depend on its own write —
		// upstream's render-phase check reads it without subscribing to it either.
		untrack(() => {
			if (next !== prevValue) {
				prevValue = next;
				if (next !== lastFiredValue) {
					lastFiredValue = undefined;
					if (pendingInput !== null) {
						pendingInput = null;
					}
				}
			}
		});
	});

	// Format a committed ISO value for display. The default `date_long` renders
	// the long-month shape (byte-identical to the historical hardcoded
	// `DATE_FORMAT_LONG` rendering, so still non-breaking); a function is called
	// with the ISO value; every other named member reuses Timestamp's shared date
	// mapping. Applies ONLY to the committed value, never to in-progress typed
	// input.
	function formatCommittedValue(iso: ISODateString): string {
		return typeof format === 'function'
			? format(iso)
			: formatSharedDate(plainDateFromISO(iso), format);
	}

	// Display value: the pending text while typing, otherwise the formatted
	// value. The ISO shape test is upstream's — a malformed value renders empty
	// rather than throwing out of `plainDateFromISO`.
	const displayValue = $derived.by(() => {
		if (pendingInput !== null) {
			return pendingInput;
		}
		const current = optimistic.current;
		return current && /^\d{4}-\d{2}-\d{2}$/.test(current) ? formatCommittedValue(current) : '';
	});

	// Whether the pending text parses — drives the dimmed text, `aria-invalid`
	// and the live region. A blank pending value is *not* invalid. Note this is
	// parse-only: a date that parses but fails a constraint is not "invalid" here,
	// it simply never commits.
	const isInputValid = $derived(
		pendingInput === null || !pendingInput.trim() ? true : parseDateInput(pendingInput) !== null
	);

	const popover = usePopover(() => ({
		id: popoverID,
		dialogLabel: t('@astryx.dateInput.dialogLabel'),
		closeButtonLabel: t('@astryx.dateInput.closeCalendar'),
		onHide: () => input?.focus()
	}));

	/** Toggle from the button — moves focus into the calendar. */
	function handleToggle(): void {
		if (!isEffectivelyDisabled) {
			if (popover.isOpen) {
				popover.hide();
			} else {
				popover.show();
			}
		}
	}

	/** Open from an input click — focus stays in the input. */
	function handleInputClick(): void {
		if (!isEffectivelyDisabled && !popover.isOpen) {
			popover.show({ skipAutoFocus: true });
		}
	}

	/** Fires `onChange`, then runs `changeAction` behind the optimistic override. */
	function fireChange(newValue: ISODateString | undefined): void {
		if (isBusy) {
			return;
		}
		onChange?.(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	function handleClear(): void {
		fireChange(undefined);
		input?.focus();
	}

	function handleDateSelect(selectedDate: ISODateString): void {
		fireChange(selectedDate);
		pendingInput = null;
		popover.hide();
	}

	// Bound to `oninput`, not `onchange`: React's `onChange` on an input is the
	// native `input` event and fires per keystroke.
	function handleInputChange(e: Event): void {
		// With a disabledMessage the input drops `disabled` for focusability, so
		// guard value mutation explicitly (readonly also blocks typing).
		if (isEffectivelyDisabled) {
			return;
		}
		const newValue = (e.target as HTMLInputElement).value;
		pendingInput = newValue;

		// If the input is valid and passes constraints, update immediately.
		const parsed = parseDateInput(newValue);
		if (parsed && plainDateToISO(parsed) !== value && !constraints.isDateDisabled(parsed)) {
			const parsedISO = plainDateToISO(parsed);
			lastFiredValue = parsedISO;
			fireChange(parsedISO);
			// Navigate the calendar to the parsed date's month.
			calendar?.navigateTo(parsedISO);
		}
	}

	/** Commit the pending text. Shared by blur and Enter. */
	function commitPendingInput(): void {
		if (pendingInput === null) {
			return;
		}

		if (!pendingInput.trim()) {
			if (value !== undefined) {
				fireChange(undefined);
			}
			pendingInput = null;
			return;
		}

		const parsed = parseDateInput(pendingInput);
		if (parsed && !constraints.isDateDisabled(parsed)) {
			const parsedISO = plainDateToISO(parsed);
			if (parsedISO !== value) {
				fireChange(parsedISO);
			}
		}
		pendingInput = null;
	}

	function handleInputKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape' && popover.isOpen) {
			e.preventDefault();
			popover.hide();
		} else if ((e.key === 'ArrowDown' || (e.altKey && e.key === 'ArrowDown')) && !popover.isOpen) {
			// APG combobox: ArrowDown (and Alt+ArrowDown) opens the calendar
			// popover from the keyboard, keeping focus in the input (forms-13).
			e.preventDefault();
			if (!isEffectivelyDisabled) {
				popover.show({ skipAutoFocus: true });
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			commitPendingInput();
		}
	}

	const theme = $derived(themeProps('date-input', { size, status: status?.type ?? null }));
	const wrapperAttrs = $derived(
		dateInputWrapperAttrs(size, status?.type, isEffectivelyDisabled, inputGroup != null, xstyle)
	);
	const toggleAttrs = $derived(dateInputIconButtonAttrs(isEffectivelyDisabled));
	const clearAttrs = dateInputIconButtonAttrs();
	const controlAttrs = $derived(dateInputAttrs(isEffectivelyDisabled, !isInputValid));
</script>

{#snippet inputWrapper()}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class, className)}
		style={mergeStyle(wrapperAttrs.style, styleProp as string | undefined)}
		{@attach popover.attachTrigger}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		{#if inputGroup}
			<VisuallyHidden id={inputLabelID}>{label}</VisuallyHidden>
		{/if}
		<button
			type="button"
			onclick={handleToggle}
			disabled={isEffectivelyDisabled}
			aria-label={popover.isOpen
				? t('@astryx.dateInput.toggleCalendarClose')
				: t('@astryx.dateInput.openCalendar')}
			class={toggleAttrs.class}
			style={toggleAttrs.style}
		>
			<!--
				Stable theme target on the calendar-toggle glyph itself, so a theme can
				restyle just this icon (colour, size, hover) via `defineTheme`, and its
				open/closed state via `data-state`. Same-element rules in
				`@layer astryx-theme` win over the icon's own base colour and size,
				which a button-level target could not reach.
			-->
			<Icon
				icon="calendar"
				size="sm"
				color="secondary"
				{...themeProps('date-input-toggle-icon', {
					state: popover.isOpen ? 'expanded' : 'collapsed'
				})}
			/>
		</button>
		<input
			bind:this={input}
			{id}
			type="text"
			role="combobox"
			value={displayValue}
			oninput={handleInputChange}
			onblur={commitPendingInput}
			onclick={handleInputClick}
			onkeydown={handleInputKeyDown}
			{placeholder}
			disabled={isEffectivelyDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			readonly={showsDisabledMessage || undefined}
			aria-labelledby={aria.ariaLabelledBy}
			aria-describedby={aria.ariaDescribedBy}
			aria-required={isRequired === true ? 'true' : undefined}
			aria-invalid={status?.type === 'error' || !isInputValid ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			aria-expanded={popover.isOpen}
			aria-haspopup="dialog"
			aria-controls={popover.isOpen ? popover.id : undefined}
			aria-autocomplete="none"
			autocomplete="off"
			class={controlAttrs.class}
			style={controlAttrs.style}
		/>
		<!--
			Live region announcing invalid typed input to assistive technology. The
			value silently reverts on blur, so without this a screen-reader user
			would get no feedback that their entry was rejected (WCAG 3.3.1).
		-->
		<VisuallyHidden as="div" role="alert" aria-live="assertive">
			{!isInputValid ? 'Invalid date' : ''}
		</VisuallyHidden>
		{#if hasClear && value !== undefined && !isEffectivelyDisabled}
			<button
				type="button"
				onclick={handleClear}
				aria-label={t('@astryx.dateInput.clear', { label })}
				class={clearAttrs.class}
				style={clearAttrs.style}
			>
				<!--
					Stable theme target on the clear glyph itself — see the toggle icon
					above for why it sits on the icon rather than the button.
				-->
				<Icon icon="close" size="sm" color="secondary" {...themeProps('date-input-clear-icon')} />
			</button>
		{/if}
		{#if isBusy}<Spinner size="sm" />{/if}
		<InputStatusIcon {statusIcon} />
		<PopoverLayer {popover} placement="below" alignment="start">
			<Calendar
				bind:this={calendar}
				mode="single"
				value={optimistic.current}
				onChange={handleDateSelect}
				{min}
				{max}
				{dateConstraints}
				{numberOfMonths}
			/>
		</PopoverLayer>
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
