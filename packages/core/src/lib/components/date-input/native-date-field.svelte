<script lang="ts">
	import { untrack } from 'svelte';
	import type { DateInputProps } from './date-input.svelte';
	import type { ISODateString } from '../../utils/date-types.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { stableClassName } from '../../internal/naming.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { parseDateInput } from '../../utils/date-parser.js';
	import { formatSharedDate, plainDateFromISO, plainDateToISO } from '../../utils/plain-date.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
	import { useCalendarConstraints } from '../calendar/use-calendar-constraints.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { hasEditableDateSegments } from './native-date-segments.js';
	import {
		nativeDateFieldIconButtonAttrs,
		nativeDateFieldInputAttrs,
		nativeDateFieldOverlayAttrs,
		nativeDateFieldSlotAttrs,
		nativeDateFieldWrapperAttrs
	} from './native-date-field.stylex.js';

	/**
	 * The OS-picker surface, ported from Astryx's `DateInput/NativeDateField.tsx`.
	 * `DateInput` picks the pointer field on a mouse and, on touch, either this
	 * one (the default) or `TouchDateField` when the consumer opts out with
	 * `nativePicker`.
	 *
	 * Hands date picking to the platform: a real `<input type="date">`, whose
	 * picker the OS draws — the iOS wheel, the Android calendar dialog. The field
	 * itself still looks like every other Astryx input, and this component paints
	 * its text so `format` and `placeholder` keep applying.
	 *
	 * Everything unusual in here was measured by upstream on a real iOS device;
	 * the comments say which behaviour forced which decision, because none of
	 * them are reproducible in a desktop browser.
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
		// Destructured only to keep it OUT of `...rest`. Upstream's destructure
		// omits it, so it lands in `rest` and is spread onto the wrapper `<div>` —
		// harmless-looking in React (an unknown-prop warning) but not here, where
		// Svelte would stringify the function into a DOM attribute. There is no
		// optimistic path on this surface either way: the OS owns the picker, and
		// upstream reads `isLoading` alone for the busy state.
		changeAction: _changeAction,
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
		// The OS draws the picker, so neither reaches it: both describe a calendar
		// grid it does not have. Accepted (the prop types are shared) and ignored.
		numberOfMonths: _numberOfMonths,
		weekStartsOn: _weekStartsOn,
		format = 'date_long',
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DateInputProps = $props();

	const t = useTranslator();
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.dateInput.placeholder'));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	// Only breaks a tie the engine probe cannot: see ./native-date-segments.
	const isTouchPointer = useMediaQuery(() => '(pointer: coarse)');

	const uid = $props.id();
	const id = `${uid}-input`;
	const inputLabelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const tooltipID = `${uid}-tooltip`;

	let input = $state<HTMLInputElement | null>(null);
	const inputGroup = useInputGroup();

	const isEffectivelyDisabled = $derived(isDisabled || isLoading);

	// Disabled-reason tooltip, same contract as the other two surfaces: a
	// disabled control swallows pointer events, so the listeners attach to the
	// wrapper and the input stays focusable via aria-disabled.
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

	// A date the picker produced that `dateConstraints` refuses, held so the
	// refusal can be announced instead of looking like a dead tap.
	let rejectedValue = $state<string | null>(null);
	// Whether the control has focus — which, on a touch device, means its
	// picker is open.
	let isFocused = $state(false);
	// Whether the engine draws this control as editable segments rather than a
	// picker-only run. Latched on focus rather than read during render: the
	// probe touches the DOM, and unfocused the answer changes nothing.
	let isSegmentEditable = $state(false);
	// The raw value the control last reported and we acted on, so the same edit
	// arriving through both commit paths only fires one change.
	let lastCommit: string | null = null;

	// Upstream's render-phase `prevValueRef` reset, in the shape the pointer
	// field uses: a plain `let` compared inside a pre-effect, so the comparison
	// happens before the render that consumes it. `rejectedValue` is written
	// here, so the body is untracked — depending on it would make the effect
	// depend on its own write, which upstream's render-phase check does not.
	let prevValue: ISODateString | undefined = value;
	$effect.pre(() => {
		const next = value;
		untrack(() => {
			if (next !== prevValue) {
				prevValue = next;
				lastCommit = null;
				if (rejectedValue !== null) {
					rejectedValue = null;
				}
			}
		});
	});

	// The control's own value is always ISO — the only form it accepts, and
	// what the picker reads and writes. `format` rides on the overlay instead.
	const nativeValue = $derived(value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');
	const isInputValid = $derived(rejectedValue === null);

	function formatValue(iso: ISODateString): string {
		return typeof format === 'function'
			? format(iso)
			: formatSharedDate(plainDateFromISO(iso), format);
	}

	// This field paints the closed control's text itself, which is what keeps
	// `format` and `placeholder` applying: a picker-only control has no
	// segments to edit, so our text holds even while the picker is open, and
	// tracks it live. An editable control is the opposite case — its text IS
	// the edit surface, and it reports no `value` until every segment is
	// filled, so the overlay has nothing to paint mid-edit — so step aside for
	// as long as it has focus. See ./native-date-segments.
	const overlayText = $derived(
		nativeValue ? formatValue(nativeValue as ISODateString) : placeholder
	);
	const showsOverlay = $derived(!!overlayText && !(isFocused && isSegmentEditable));

	function commitValue(newValue: string): void {
		if (isEffectivelyDisabled) {
			return;
		}
		// The same edit can arrive twice — the `input` and `change` listeners
		// below both report it — so act on a raw value once.
		if (lastCommit === newValue) {
			return;
		}
		lastCommit = newValue;

		if (!newValue) {
			rejectedValue = null;
			if (value !== undefined) {
				onChange?.(undefined);
			}
			return;
		}

		const parsed = parseDateInput(newValue);
		if (!parsed) {
			return;
		}
		if (constraints.isDateDisabled(parsed)) {
			// iOS does not enforce min/max in its picker — those attributes are
			// constraint-validation flags, not clamps, and the sheet lets the
			// user land on any date. Refuse it here and let the sync effect snap
			// the control back; the live region below announces the refusal.
			rejectedValue = newValue;
			return;
		}

		rejectedValue = null;
		const parsedISO = plainDateToISO(parsed);
		if (parsedISO !== value) {
			onChange?.(parsedISO);
		}
	}

	/**
	 * Both commit paths, and both are native.
	 *
	 * Upstream carries a React `onChange` **and** a pair of hand-attached
	 * `input`/`change` listeners, because React's synthetic change system does
	 * not reliably observe the iOS picker's edits: measured on an iPhone,
	 * picking a date fired a native `input` event carrying the new date while
	 * React's `onChange` never ran, so React re-rendered and wrote its own stale
	 * value back over the picker's and the user's pick silently reverted.
	 *
	 * Svelte has no synthetic layer to route around — `oninput`/`onchange` are
	 * the native events — so the hand-attached pair IS these two attributes, and
	 * the `lastCommit` guard above still earns its keep because the same edit
	 * arrives on both.
	 */
	function handleNative(event: Event): void {
		commitValue((event.target as HTMLInputElement).value);
	}

	// The value the control mounts with. Deliberately captured once: writing to
	// the element while the picker sheet is open detaches the sheet from the
	// field on iOS — the wheel and Reset keep moving the sheet's own highlight,
	// but nothing they do reaches the input and no event fires, so the user's
	// pick appears to do nothing. Holding this constant means the template
	// touches the element exactly once, at mount; the effect below owns every
	// later update and only writes while the field is unfocused.
	// svelte-ignore state_referenced_locally
	const initialValue = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';

	// Push an externally-changed value in — but never while the control has
	// focus, for the reason above. Blur flips `isFocused`, so this doubles as
	// the reconcile once the picker closes.
	$effect(() => {
		if (isFocused) {
			return;
		}
		const el = input;
		const next = nativeValue;
		if (el && el.value !== next) {
			el.value = next;
		}
	});

	function handleFocus(): void {
		isSegmentEditable = hasEditableDateSegments(isTouchPointer.matches);
		isFocused = true;
	}

	function handleBlur(): void {
		const domValue = input?.value;
		isFocused = false;
		// A refused date is reverted by the sync effect the moment focus leaves,
		// so the field is once again showing a date that IS valid. Keeping the
		// rejection past that point would mark good data invalid, with no way
		// back except changing the field again. The live region announced the
		// refusal while it happened; that is the feedback.
		rejectedValue = null;
		if (domValue !== undefined && domValue !== nativeValue) {
			commitValue(domValue);
		}
	}

	// Focusing a date control is what raises the OS picker, so the usual
	// focus-restore after a clear would pop the picker the tap just dismissed —
	// and on iOS that reads as the clear having done nothing.
	function handleClear(): void {
		onChange?.(undefined);
	}

	function openPicker(): void {
		if (isEffectivelyDisabled) {
			return;
		}
		const el = input;
		if (!el) {
			return;
		}
		// Focus first: on touch browsers focusing the control is itself what
		// raises the picker, and iOS implements no `showPicker()` for type=date
		// (WebKit bug 261703), so focus is the whole mechanism there.
		el.focus();
		if (typeof el.showPicker === 'function') {
			try {
				el.showPicker();
			} catch {
				// showPicker throws without transient user activation and inside a
				// cross-origin iframe. The focus above is the fallback.
			}
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
		nativeDateFieldWrapperAttrs(
			size,
			status?.type,
			isEffectivelyDisabled,
			inputGroup != null,
			xstyle
		)
	);
	const toggleAttrs = $derived(nativeDateFieldIconButtonAttrs(isEffectivelyDisabled));
	const slotAttrs = nativeDateFieldSlotAttrs();
	const controlAttrs = $derived(
		nativeDateFieldInputAttrs(showsOverlay, isEffectivelyDisabled, !isInputValid)
	);
	const overlayAttrs = $derived(
		nativeDateFieldOverlayAttrs(
			!!nativeValue,
			isEffectivelyDisabled,
			!isInputValid && !!nativeValue
		)
	);
</script>

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
			onclick={openPicker}
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
				{...themeProps('date-input-toggle-icon', { state: 'collapsed' })}
			/>
		</button>
		<span class={slotAttrs.class} style={slotAttrs.style}>
			<!--
				UNCONTROLLED on purpose, with a value nothing rewrites after mount —
				`initialValue` is a plain const, so the template's own write happens
				once; see it and the sync effect above.
			-->
			<input
				bind:this={input}
				{id}
				type="date"
				value={initialValue}
				oninput={handleNative}
				onchange={handleNative}
				onfocus={handleFocus}
				onblur={handleBlur}
				{min}
				{max}
				disabled={isEffectivelyDisabled && !showsDisabledMessage}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				readonly={showsDisabledMessage || undefined}
				aria-labelledby={aria.ariaLabelledBy}
				aria-describedby={aria.ariaDescribedBy}
				aria-required={isEffectivelyRequired() ? 'true' : undefined}
				aria-invalid={status?.type === 'error' || !isInputValid ? 'true' : undefined}
				aria-busy={isLoading || undefined}
				class={controlAttrs.class}
				style={controlAttrs.style}
			/>
			{#if showsOverlay}
				<span aria-hidden="true" class={overlayAttrs.class} style={overlayAttrs.style}>
					{overlayText}
				</span>
			{/if}
		</span>
		<!--
			Live region announcing a refused date. The value snaps back on its own,
			so without this a screen-reader user would get no feedback that their
			pick was rejected (WCAG 3.3.1).
		-->
		<VisuallyHidden as="div" role="alert" aria-live="assertive">
			{!isInputValid ? t('@astryx.dateInput.invalidDate') : ''}
		</VisuallyHidden>
		{#if hasClear && value !== undefined && !isEffectivelyDisabled}
			<InputClearButton
				label={t('@astryx.dateInput.clear', { label })}
				onclick={handleClear}
				iconClassName={stableClassName('date-input-clear-icon')}
			/>
		{/if}
		{#if isLoading}<Spinner size="sm" />{/if}
		<InputStatusIcon {statusIcon} />
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
