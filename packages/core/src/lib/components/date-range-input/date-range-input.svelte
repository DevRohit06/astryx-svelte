<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type {
		DateRange,
		DayOfWeek,
		DayOfWeekName,
		ISODateString
	} from '../../utils/date-types.js';
	import type { DateRangeInputSize } from './date-range-input.stylex.js';

	// Upstream re-exports `DateRange` from `DateRangeInput.tsx` as well as from
	// `Calendar`; both name the same declaration in `utils/dateTypes`. Not
	// re-exported here — `src/lib/index.ts` publishes it from `utils/date-types.js`
	// directly, so the root surface is identical. See `calendar.svelte` for why a
	// type re-export inside a `<script module>` is avoided.

	// `DateRangeInputStatus`/`DateRangeInputStatusType` alias Field's
	// `InputStatus`/`InputStatusType`, as upstream re-exports them.
	export type DateRangeInputStatus = InputStatus;
	export type DateRangeInputStatusType = InputStatusType;

	/** One quick-select option in the popover's preset rail. */
	export interface DateRangePreset {
		label: string;
		getRange: () => DateRange;
	}

	/**
	 * `onchange` and `defaultValue` are the only omissions, matching upstream.
	 *
	 * `...rest` spreads onto the wrapper `<div>`, as in `DateInput`, hence the
	 * `HTMLDivElement` element type. (Upstream's `ref` targets the *trigger
	 * button* rather than that div — an asymmetry with `DateInput`'s. Svelte has
	 * no `ref` prop, so it drops out either way.)
	 *
	 * `onclick` is **not** omitted: the component's own click handlers live on the
	 * three `<button>`s, while rest reaches only the wrapper, so a caller's
	 * `onclick` cannot be shadowed — it fires on bubble, as upstream's does. See
	 * `date-input.svelte` for the fuller note on why `NumberInput`'s omissions do
	 * not transfer to a wrapper-targeted rest spread.
	 */
	export interface DateRangeInputProps extends Omit<
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
		 * the trigger stays focusable (via `aria-disabled`) so the reason is
		 * discoverable by keyboard and assistive technology. Activation stays
		 * blocked.
		 *
		 * Use this instead of wrapping a disabled input in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/** The selected date range, or `null` if no range is selected. */
		value: DateRange | null;
		/** Fired when the range changes. Called with `null` when the range is cleared. */
		onChange: (value: DateRange | null) => void;
		/** Async action on change. Fires after `onChange`. */
		changeAction?: (value: DateRange | null) => void | Promise<void>;
		/**
		 * Whether the input is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/** Minimum selectable date in ISO format. */
		min?: ISODateString;
		/** Maximum selectable date in ISO format. */
		max?: ISODateString;
		/** Custom date constraint functions. A date is disabled if ANY function returns false. */
		dateConstraints?: ReadonlyArray<(date: Date) => boolean>;
		/** Preset date ranges shown as quick-select options beside the calendar. */
		presets?: ReadonlyArray<DateRangePreset>;
		/**
		 * Whether to show a clear button when a range is selected.
		 * @default true
		 */
		hasClear?: boolean;
		/**
		 * Placeholder text shown when no range is selected.
		 * @default "Select date range"
		 */
		placeholder?: string;
		/**
		 * The size of the trigger. Inherited from an enclosing `SizeContext` when unset.
		 * @default 'md'
		 */
		size?: DateRangeInputSize;
		/** Status indicator for the input. */
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
		 * Number of months to display in the calendar.
		 * @default 2
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

	/**
	 * Module-private, as upstream's are — `DateRangeInput/index.ts` publishes
	 * neither.
	 *
	 * The year is dropped from both endpoints only when the range sits entirely
	 * within the *current* year, so a historical range stays unambiguous.
	 */
	function formatRangeDisplay(range: DateRange | null): string {
		if (!range) {
			return '';
		}
		const start = plainDateFromISO(range.start);
		const end = plainDateFromISO(range.end);
		const currentYear = plainDateToday().year;
		const sameYear = start.year === end.year && start.year === currentYear;

		const fmt = sameYear ? DATE_FORMAT_SHORT : DATE_FORMAT_SHORT_WITH_YEAR;
		return `${plainDateFormat(start, fmt)} – ${plainDateFormat(end, fmt)}`;
	}

	function isRangeEqual(a: DateRange | null, b: DateRange | null): boolean {
		if (a === b) {
			return true;
		}
		if (!a || !b) {
			return false;
		}
		return a.start === b.start && a.end === b.end;
	}
</script>

<script lang="ts">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import {
		DATE_FORMAT_SHORT,
		DATE_FORMAT_SHORT_WITH_YEAR,
		plainDateFormat,
		plainDateFromISO,
		plainDateToday
	} from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { stableClassName } from '../../internal/naming.js';
	import Calendar from '../calendar/calendar.svelte';
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
	import {
		dateRangeInputIconButtonAttrs,
		dateRangeInputPopoverLayoutAttrs,
		dateRangeInputPresetButtonAttrs,
		dateRangeInputPresetSidebarAttrs,
		dateRangeInputTriggerAttrs,
		dateRangeInputWrapperAttrs
	} from './date-range-input.stylex.js';

	/**
	 * A date range picker: a button trigger that opens a popover holding a
	 * dual-month `Calendar` and an optional rail of preset ranges.
	 *
	 * Unlike `DateInput` there is no text entry — the trigger renders the
	 * formatted range and the calendar is the only way to set one. `value` and
	 * `onChange` are both **required**, and the component is strictly controlled.
	 *
	 * @example
	 * ```svelte
	 * <DateRangeInput
	 *   label="Date range"
	 *   value={range}
	 *   onChange={(v) => (range = v)}
	 *   presets={[{ label: 'Last 7 days', getRange: () => ({ start: '…', end: '…' }) }]}
	 * />
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
		presets,
		hasClear = true,
		placeholder: placeholderFromProps,
		size: sizeProp,
		status,
		statusVariant = 'attached',
		labelTooltip,
		numberOfMonths = 2,
		// Deliberately no default: it is forwarded raw, and `Calendar` owns both the
		// `= 0` fallback and the name→number normalisation.
		weekStartsOn,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateRangeInputProps = $props();

	const t = useTranslator();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.dateRangeInput.placeholder'));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	const uid = $props.id();
	const id = `${uid}-trigger`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const popoverID = `${uid}-popover`;
	const tooltipID = `${uid}-tooltip`;

	// Upstream's `useOptimistic` + `useTransition` pair.
	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);
	const isEffectivelyDisabled = $derived(isDisabled || isBusy);

	// Only the persistent `isDisabled` state — not the transient busy state —
	// surfaces a reason. The trigger stays perceivable via aria-disabled and the
	// tooltip listeners attach to the always-present wrapper.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The container div is not naturally focusable; focusin bubbles up from
		// the trigger button, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant
	}));

	// Hand-rolled rather than `getInputARIA`: this component never reads the
	// `InputGroup` context, so there is no group half to merge and no
	// `aria-labelledby` to compute — the trigger carries its own `aria-label`.
	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
			// The tooltip variant renders no message box; describe the input by the
			// tooltip's content instead so the status is still announced.
			statusIcon.describedBy ?? null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	const displayValue = $derived(formatRangeDisplay(optimistic.current));

	const popover = usePopover(() => ({
		id: popoverID,
		dialogLabel: t('@astryx.dateRangeInput.dialogLabel'),
		closeButtonLabel: t('@astryx.dateInput.closeCalendar')
	}));

	/** Fires `onChange`, then runs `changeAction` behind the optimistic override. */
	function fireChange(newValue: DateRange | null): void {
		if (isBusy) {
			return;
		}
		onChange(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	function handleToggle(): void {
		if (!isEffectivelyDisabled) {
			if (popover.isOpen) {
				popover.hide();
			} else {
				popover.show();
			}
		}
	}

	function handleRangeSelect(range: DateRange): void {
		fireChange(range);
		popover.hide();
	}

	function handlePresetClick(preset: DateRangePreset): void {
		fireChange(preset.getRange());
		popover.hide();
	}

	function handleClear(e: MouseEvent): void {
		e.stopPropagation();
		fireChange(null);
	}

	const triggerAriaLabel = $derived(
		value ? `${label}: ${displayValue}` : `${label}: ${placeholder}`
	);

	// `disabled` reflects as `data-disabled` (and as a bare state class) so a theme
	// can reach the state without duplicating the component's own conditionals.
	// Keyed off `isDisabled`, not `isEffectivelyDisabled`: a busy field is not a
	// disabled one, and upstream reflects the prop.
	const theme = $derived(
		themeProps('date-range-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const wrapperAttrs = $derived(
		dateRangeInputWrapperAttrs(size, status?.type, isEffectivelyDisabled, xstyle)
	);
	const toggleAttrs = $derived(dateRangeInputIconButtonAttrs(isEffectivelyDisabled));
	const triggerAttrs = $derived(dateRangeInputTriggerAttrs(!displayValue, isEffectivelyDisabled));
	const layoutAttrs = dateRangeInputPopoverLayoutAttrs();
	const sidebarAttrs = dateRangeInputPresetSidebarAttrs();
</script>

<Field
	{label}
	{isLabelHidden}
	{description}
	inputID={id}
	descriptionID={description ? descriptionID : undefined}
	{isOptional}
	{isRequired}
	isDisabled={isEffectivelyDisabled}
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
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class, className)}
		style={mergeStyle(wrapperAttrs.style, styleProp as string | undefined)}
		{@attach popover.attachTrigger}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		<button
			type="button"
			onclick={handleToggle}
			disabled={isEffectivelyDisabled}
			aria-label={popover.isOpen
				? t('@astryx.dateInput.toggleCalendarClose')
				: t('@astryx.dateInput.openCalendar')}
			tabindex={-1}
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
				{...themeProps('date-range-input-toggle-icon', {
					state: popover.isOpen ? 'expanded' : 'collapsed'
				})}
			/>
		</button>
		<!--
			`aria-required` and `aria-invalid` are not in `role="button"`'s supported
			set, and Svelte says so. They are upstream's own markup: this trigger
			stands in for a form control, and upstream carries both attributes on it
			so the field's required/error state is exposed somewhere. Replicated, not
			corrected — a component's own behaviour is upstream's to change, unlike an
			a11y defect on a page this repo ships. Recorded under Known debts.
		-->
		<!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
		<button
			{id}
			type="button"
			onclick={handleToggle}
			disabled={isEffectivelyDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			aria-label={triggerAriaLabel}
			aria-describedby={ariaDescribedBy}
			aria-required={isRequired === true ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			aria-expanded={popover.isOpen}
			aria-haspopup="dialog"
			aria-controls={popover.isOpen ? popover.id : undefined}
			class={triggerAttrs.class}
			style={triggerAttrs.style}
		>
			{displayValue || placeholder}
		</button>
		{#if hasClear && value !== null && !isEffectivelyDisabled}
			<!--
				The shared clear affordance. It stamps `astryx-input-clear-icon` on the
				glyph; `iconClassName` keeps this component's original
				`astryx-date-range-input-clear-icon` target beside it through a
				deprecation window, so a theme written against the old name still
				reaches the icon.
			-->
			<InputClearButton
				label={t('@astryx.dateInput.clear', { label })}
				onclick={handleClear}
				iconClassName={stableClassName('date-range-input-clear-icon')}
			/>
		{/if}
		{#if isBusy}<Spinner size="sm" />{/if}
		<InputStatusIcon {statusIcon} />
	</div>
	<PopoverLayer {popover} placement="below" alignment="start">
		<div class={layoutAttrs.class} style={layoutAttrs.style}>
			{#if presets && presets.length > 0}
				<div
					role="group"
					aria-label={t('@astryx.dateRangeInput.presetDateRanges')}
					class={sidebarAttrs.class}
					style={sidebarAttrs.style}
				>
					{#each presets as preset (preset.label)}
						{@const isActive = isRangeEqual(value, preset.getRange())}
						{@const presetAttrs = dateRangeInputPresetButtonAttrs(isActive)}
						<!--
							These presets are independent action buttons navigated by Tab,
							not a single-tab-stop listbox — so they are a labeled group of
							buttons, and the currently-applied preset is marked with
							aria-current (not aria-selected, a listbox concept that
							contradicted the Tab interaction) (forms-5).
						-->
						<button
							type="button"
							aria-current={isActive ? 'true' : undefined}
							onclick={() => handlePresetClick(preset)}
							class={presetAttrs.class}
							style={presetAttrs.style}
						>
							{preset.label}
						</button>
					{/each}
				</div>
			{/if}
			<Calendar
				mode="range"
				value={value ?? undefined}
				onChange={handleRangeSelect}
				{min}
				{max}
				{dateConstraints}
				{numberOfMonths}
				{weekStartsOn}
			/>
		</div>
	</PopoverLayer>

	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
