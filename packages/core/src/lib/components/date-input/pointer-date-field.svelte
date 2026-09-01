<script lang="ts">
	import type { DateInputProps } from './date-input.svelte';
	import type { ISODateString } from '../../utils/date-types.js';
	import { untrack } from 'svelte';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { isImeKeyEvent } from '../../utils/ime.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { isFocusDetached } from '../../utils/focus-return.js';
	import { stableClassName } from '../../internal/naming.js';
	import { parseDateInput } from '../../utils/date-parser.js';
	import { formatSharedDate, plainDateFromISO, plainDateToISO } from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
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
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import {
		dateInputAttrs,
		dateInputIconButtonAttrs,
		dateInputWrapperAttrs
	} from './date-input.stylex.js';

	/**
	 * The pointer-driven half of `DateInput`, ported from the `PointerDateField`
	 * function in Astryx's `DateInput/DateInput.tsx`. `DateInput` renders this
	 * whenever the primary pointer is not a finger; the touch surface is
	 * `touch-date-field.svelte`.
	 *
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
		// Deliberately no default: it is forwarded raw, and `Calendar` owns both the
		// `= 0` fallback and the name→number normalisation. Defaulting here too would
		// state the same fact twice, in the file that does not decide it.
		weekStartsOn,
		format = 'date_long',
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateInputProps = $props();

	// Announce the effective required state (form default included) while the
	// native `required` stays bound to the explicit `isRequired`, so a layout
	// default never switches on browser validation.
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});

	const t = useTranslator();
	const locale = useLocale();
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
				// a group. Recorded in port/debts.md under Known debts.
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
			: formatSharedDate(plainDateFromISO(iso), format, locale());
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
		pendingInput === null || !pendingInput.trim()
			? true
			: parseDateInput(pendingInput, locale()) !== null
	);

	const popover = usePopover(() => ({
		id: popoverID,
		dialogLabel: t('@astryx.dateInput.dialogLabel'),
		closeButtonLabel: t('@astryx.dateInput.closeCalendar'),
		// Return focus to the input when the calendar closes — but only when the
		// dismiss left focus detached (Escape, or a click on non-focusable empty
		// space), which the focus trap cannot restore on its own. A native
		// `popover="auto"` light-dismiss fires synchronously with the pointer event
		// that moved focus, so if the user clicked another control — the clear
		// button, another field, anywhere — focus has already landed there;
		// reclaiming it would fight their click.
		onHide: () => {
			if (isFocusDetached()) {
				input?.focus();
			}
		}
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
		const parsed = parseDateInput(newValue, locale());
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

		const parsed = parseDateInput(pendingInput, locale());
		if (parsed && !constraints.isDateDisabled(parsed)) {
			const parsedISO = plainDateToISO(parsed);
			if (parsedISO !== value) {
				fireChange(parsedISO);
			}
		}
		pendingInput = null;
	}

	function handleInputKeyDown(e: KeyboardEvent): void {
		// An in-progress IME composition uses Enter to commit the candidate and
		// Escape to cancel it; that composing keydown fires before
		// compositionend, so without this guard a Korean/Japanese/Chinese user
		// committing a syllable with Enter would instead commit the pending date
		// (or Escape would close the calendar mid-composition). See utils/ime.ts.
		if (isImeKeyEvent(e)) {
			return;
		}
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

	// `disabled` reflects as `data-disabled` (and as a bare state class) so a theme
	// can reach the state without duplicating the component's own conditionals.
	// Keyed off `isDisabled`, not `isEffectivelyDisabled`: a busy field is not a
	// disabled one, and upstream reflects the prop.
	const theme = $derived(
		themeProps('date-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const wrapperAttrs = $derived(
		dateInputWrapperAttrs(size, status?.type, isEffectivelyDisabled, inputGroup != null, xstyle)
	);
	const toggleAttrs = $derived(dateInputIconButtonAttrs(isEffectivelyDisabled));
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
			aria-required={isEffectivelyRequired() ? 'true' : undefined}
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
			{!isInputValid ? t('@astryx.dateInput.invalidDate') : ''}
		</VisuallyHidden>
		{#if hasClear && value !== undefined && !isEffectivelyDisabled}
			<!--
				The shared clear affordance. It stamps `astryx-input-clear-icon` on the
				glyph; `iconClassName` keeps this component's original
				`astryx-date-input-clear-icon` target beside it through a deprecation
				window, so a theme written against the old name still reaches the icon.
			-->
			<InputClearButton
				label={t('@astryx.dateInput.clear', { label })}
				onclick={handleClear}
				iconClassName={stableClassName('date-input-clear-icon')}
			/>
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
				{weekStartsOn}
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
