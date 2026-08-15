<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type { ISOTimeString } from '../../utils/time-parser.js';
	// `TimeInputSize` is published from `time-input.stylex.ts`, derived from the
	// size style keys — the arrangement `TextInput`/`NumberInput` use.
	import type { TimeInputSize } from './time-input.stylex.js';

	// `TimeInputStatus`/`TimeInputStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream re-exports them from `TimeInput.tsx`.
	export type TimeInputStatus = InputStatus;
	export type TimeInputStatusType = InputStatusType;

	export type TimeInputHourFormat = '12h' | '24h';

	/**
	 * `onchange` and `defaultValue` are omitted so `onChange` can carry the
	 * component's own signature — upstream omits the same pair. `onfocus`,
	 * `onblur`, `oninput` and `onkeydown` go with them for the reason
	 * `NumberInput` documents: each is composed with the component's own handler
	 * rather than forwarded raw, so leaving them in the surface would let a caller
	 * pass one that typechecks and is then silently shadowed by the spread.
	 *
	 * Unlike `NumberInput`, upstream's `TimeInput` exposes no `onFocus`/`onBlur`
	 * props at all — both handlers are entirely internal (they drive `isFocused`,
	 * which swaps the placeholder for a format hint, and the blur commit). So
	 * nothing is re-added under a lowercase name here; adding one would invent API.
	 */
	export interface TimeInputProps extends Omit<
		BaseProps<HTMLInputElement>,
		'onchange' | 'defaultValue' | 'oninput' | 'onfocus' | 'onblur' | 'onkeydown'
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
		 * discoverable by keyboard and assistive technology. Typing and arrow-key
		 * adjustment stay blocked.
		 *
		 * Use this instead of wrapping a disabled input in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/** The selected time in ISO format (HH:MM or HH:MM:SS). */
		value?: ISOTimeString;
		/**
		 * Callback fired when the time changes. Called with `undefined` when the
		 * input is cleared.
		 */
		onChange?: (value: ISOTimeString | undefined) => void;
		/** Async action on change. Fires after `onChange`. */
		changeAction?: (value: ISOTimeString | undefined) => void | Promise<void>;
		/**
		 * Whether the input is in a loading state.
		 * @default false
		 */
		isLoading?: boolean;
		/** Minimum selectable time in ISO format. */
		min?: ISOTimeString;
		/** Maximum selectable time in ISO format. */
		max?: ISOTimeString;
		/**
		 * Whether to include seconds in the time input.
		 * @default false
		 */
		hasSeconds?: boolean;
		/**
		 * Whether to show a clear button when a value is set.
		 * @default false
		 */
		hasClear?: boolean;
		/**
		 * Whether to automatically focus the input on mount.
		 * @default false
		 */
		hasAutoFocus?: boolean;
		/**
		 * Hour format for display.
		 * - `'12h'`: 12-hour with AM/PM (e.g. "2:30 PM")
		 * - `'24h'`: 24-hour (e.g. "14:30")
		 * @default '12h'
		 */
		hourFormat?: TimeInputHourFormat;
		/**
		 * Increment in minutes when using arrow keys.
		 * @default 1
		 */
		increment?: number;
		/**
		 * Placeholder text shown when no time is selected.
		 * @default "Select a time"
		 */
		placeholder?: string;
		/**
		 * The size of the input. Inherited from an enclosing `SizeContext` when unset.
		 * @default 'md'
		 */
		size?: TimeInputSize;
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
	}
</script>

<script lang="ts">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import {
		adjustTime,
		formatDisplayTime12h,
		formatDisplayTime24h,
		formatISOTime,
		isTimeInRange,
		parseTimeInput
	} from '../../utils/time-parser.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import {
		timeInputAttrs,
		timeInputIconAttrs,
		timeInputWrapperAttrs
	} from './time-input.stylex.js';

	/**
	 * A time field with the whole `Field` shell around it — or, when nested in an
	 * `InputGroup`, a bare control that borrows the group's label and collapses its
	 * border into the row.
	 *
	 * Typing is free-form and parsed on every keystroke: an entry that parses *and*
	 * falls inside `min`/`max` commits immediately, so `onChange` does not wait for
	 * blur. Anything else is held in a local pending buffer, dims the text,
	 * announces itself to assistive technology and reverts on blur. ArrowUp and
	 * ArrowDown adjust by `increment` minutes, seeding from the current clock time
	 * when the field is empty.
	 *
	 * @example
	 * ```svelte
	 * <TimeInput label="Start time" value={time} onChange={(v) => (time = v)} hourFormat="12h" hasClear />
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
		hasSeconds = false,
		hasClear = false,
		hasAutoFocus = false,
		hourFormat = '12h',
		increment = 1,
		placeholder: placeholderFromProps,
		size: sizeProp,
		status,
		statusVariant = 'attached',
		labelTooltip,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TimeInputProps = $props();

	const t = useTranslator();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.timeInput.placeholder'));
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	// A member reads the enclosing group once at init (context presence is fixed),
	// then the getter reactively for `describedByIDs`.
	const inputGroup = useInputGroup();

	// One base id with derived suffixes — the counterpart to upstream's four
	// `useId` calls, plus a fifth for the tooltip, which our `useTooltip` takes as
	// an input where upstream's mints it internally.
	const uid = $props.id();
	const id = `${uid}-input`;
	const inputLabelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const tooltipID = `${uid}-tooltip`;

	let container = $state<HTMLDivElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);

	// Upstream's `useOptimistic` + `useTransition` pair. `isBusy` is upstream's
	// `isLoading || optimisticValue !== value`; here the in-flight count says the
	// same thing without comparing a value against itself.
	const optimistic = createOptimistic(() => value);
	const isBusy = $derived(isLoading || optimistic.isPending);

	// A disabled field with a reason stays perceivable: it takes aria-disabled and
	// readonly instead of the native disabled attribute, and the tooltip listeners
	// attach to the always-present container rather than the pointer-swallowing input.
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

	// In grouped mode the status message renders as a visually-hidden node that
	// exists only for `aria-describedby`. Announce it through the persistent
	// `useAnnounce` live regions instead of putting `role`/`aria-live` on that
	// node — a live region mounted together with its content is not reliably
	// announced. Ungrouped mode delegates to Field -> FieldStatus, which
	// announces itself the same way.
	const announce = useAnnounce();
	$effect(() => {
		if (inputGroup && status?.message) {
			announce(status.message, status.type === 'error' ? 'assertive' : 'polite');
		}
	});

	const groupValue = $derived(inputGroup ? inputGroup() : null);
	const aria = $derived(
		getInputARIA(
			inputLabelID,
			[
				description ? descriptionID : null,
				// No `!inputGroup` guard, unlike `TextInput`/`NumberInput`: this
				// component renders its own visually-hidden status element inside a
				// group, so the id resolves there too. Upstream's shape.
				statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
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
	let isFocused = $state(false);

	const formatDisplayTime = $derived(
		hourFormat === '12h' ? formatDisplayTime12h : formatDisplayTime24h
	);

	/** Fires `onChange`, then runs `changeAction` behind the optimistic override. */
	function fireChange(newValue: ISOTimeString | undefined): void {
		onChange?.(newValue);
		if (changeAction) {
			void optimistic.run(newValue, () => changeAction(newValue));
		}
	}

	// Display value: the pending text while typing, otherwise the formatted value.
	const displayValue = $derived.by(() => {
		if (pendingInput !== null) {
			return pendingInput;
		}
		return optimistic.current ? formatDisplayTime(optimistic.current, hasSeconds) : '';
	});

	// Whether the pending text parses and is in range — drives the dimmed text,
	// `aria-invalid` and the live region. A blank pending value is *not* invalid.
	const isInputValid = $derived.by(() => {
		if (pendingInput === null || !pendingInput.trim()) {
			return true;
		}
		const parsed = parseTimeInput(pendingInput, hasSeconds);
		if (!parsed) {
			return false;
		}
		return isTimeInRange(parsed, min, max);
	});

	// Focused and empty swaps the placeholder for a format hint. Upstream writes
	// both hints as bare English literals rather than translator keys, and the
	// catalog carries no key for either — so they transcribe verbatim.
	const displayPlaceholder = $derived.by(() => {
		if (isFocused && !displayValue) {
			return hourFormat === '12h' ? 'e.g., 2:30 PM' : 'e.g., 14:30';
		}
		return placeholder;
	});

	/**
	 * Writes `displayValue` onto the input **only when the element disagrees**,
	 * which is React's controlled-input rule and the reason upstream does not
	 * clobber partially-typed text. `NumberInput` documents why this has to be an
	 * attachment rather than a `value={…}` attribute: the `<input>` carries
	 * `{...rest}`, and any spread routes every attribute through `set_attributes`,
	 * which compares against the previously *rendered* string rather than the DOM.
	 *
	 * Attachments do not run during SSR, hence the server-only `value` spread on
	 * the element: the server still emits the attribute React emits, hydration's
	 * `remove_input_defaults` moves it to the property, and this then no-ops.
	 */
	function syncDisplayValue(el: HTMLInputElement): void {
		if (el.value !== displayValue) {
			el.value = displayValue;
		}
	}

	// `typeof window` rather than a bundler flag: `isSafari()` in `CodeBlock` uses
	// the same `typeof navigator` probe, which is upstream's own idiom.
	const isServer = typeof window === 'undefined';

	// Bound to `oninput`, not `onchange`: React's `onChange` on an input is the
	// native `input` event and fires per keystroke.
	function handleInputChange(e: Event): void {
		// With a disabledMessage the input drops `disabled` for focusability, so
		// guard value mutation explicitly (readonly also blocks typing).
		if (isDisabled) {
			return;
		}
		const newValue = (e.target as HTMLInputElement).value;
		pendingInput = newValue;

		// If the input is valid, update immediately (don't wait for blur).
		const parsed = parseTimeInput(newValue, hasSeconds);
		if (parsed && isTimeInRange(parsed, min, max) && parsed !== value) {
			fireChange(parsed);
		}
	}

	function handleFocus(): void {
		// A disabled input stays focusable (via aria-disabled) so its reason is
		// discoverable, but it must not present editing affordances — keep the
		// static placeholder rather than swapping in the format hint.
		if (isDisabled) {
			return;
		}
		isFocused = true;
	}

	function handleBlur(): void {
		isFocused = false;

		if (pendingInput === null) {
			return;
		}

		if (!pendingInput.trim()) {
			// Empty input clears the value.
			if (value !== undefined) {
				fireChange(undefined);
			}
			pendingInput = null;
			return;
		}

		const parsed = parseTimeInput(pendingInput, hasSeconds);
		if (parsed && isTimeInRange(parsed, min, max)) {
			// Valid time — update if different.
			if (parsed !== value) {
				fireChange(parsed);
			}
		}
		// Clear the pending input; the display reverts to the formatted value.
		pendingInput = null;
	}

	function handleInputKeyDown(e: KeyboardEvent): void {
		// Arrow-key adjustment mutates the value; block it while showing a
		// disabled reason (the input keeps focusability via aria-disabled).
		if (isDisabled) {
			return;
		}
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();

			// Current time, or the wall clock when the field is empty.
			let currentTime = value;
			if (!currentTime) {
				const now = new Date();
				currentTime = formatISOTime(
					{ hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() },
					hasSeconds
				);
			}

			const delta = e.key === 'ArrowUp' ? increment : -increment;
			const newTime = adjustTime(currentTime, delta, hasSeconds);

			if (isTimeInRange(newTime, min, max)) {
				fireChange(newTime);
				// Stepping programmatically rewrites a plain textbox's value, and
				// screen readers do not announce programmatic textbox changes — the
				// new value must be spoken explicitly or stepping is silent
				// (WCAG 4.1.2).
				announce(formatDisplayTime(newTime, hasSeconds));
			}
		}
	}

	function handleClear(): void {
		fireChange(undefined);
		input?.focus();
	}

	// Focus the input when clicking anywhere on the wrapper (icons, padding).
	const inputContainer = useInputContainer(() => ({
		container,
		input,
		disabled: isDisabled
	}));

	// `disabled` reflects as `data-disabled` (and as a bare state class) so a theme
	// can reach the state without duplicating the component's own conditionals.
	const theme = $derived(
		themeProps('time-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const wrapperAttrs = $derived(
		timeInputWrapperAttrs(size, status?.type, isDisabled, inputGroup != null, xstyle)
	);
	const iconAttrs = timeInputIconAttrs();
	const controlAttrs = $derived(timeInputAttrs(isDisabled, !isInputValid));
</script>

{#snippet inputWrapper()}
	<div
		bind:this={container}
		{...inputContainer}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class, className)}
		style={mergeStyle(wrapperAttrs.style, styleProp as string | undefined)}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		<div class={iconAttrs.class} style={iconAttrs.style}>
			<Icon icon="clock" size="sm" color="secondary" />
		</div>
		{#if inputGroup}
			<VisuallyHidden id={inputLabelID}>{label}</VisuallyHidden>
		{/if}
		{#if inputGroup && description}
			<VisuallyHidden as="div" id={descriptionID}>{description}</VisuallyHidden>
		{/if}
		{#if inputGroup && status?.message}
			<!--
				Bare on purpose: this node exists only as an `aria-describedby`
				target. The announcement goes through `useAnnounce` above.
			-->
			<VisuallyHidden as="div" id={statusMessageID}>{status.message}</VisuallyHidden>
		{/if}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			{...rest}
			{...isServer ? { value: displayValue } : undefined}
			bind:this={input}
			{id}
			type="text"
			oninput={handleInputChange}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleInputKeyDown}
			placeholder={displayPlaceholder}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			readonly={showsDisabledMessage || undefined}
			autofocus={hasAutoFocus}
			data-autofocus={hasAutoFocus || undefined}
			aria-describedby={aria.ariaDescribedBy}
			aria-required={isRequired === true ? 'true' : undefined}
			aria-invalid={status?.type === 'error' || !isInputValid ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			aria-labelledby={aria.ariaLabelledBy}
			class={controlAttrs.class}
			style={controlAttrs.style}
			{@attach syncDisplayValue}
		/>
		<!--
			Live region announcing invalid typed input to assistive technology. The
			value silently reverts on blur, so without this a screen-reader user
			would get no feedback that their entry was rejected (WCAG 3.3.1).
		-->
		<VisuallyHidden as="div" role="alert" aria-live="assertive">
			{!isInputValid ? t('@astryx.timeInput.invalidTime') : ''}
		</VisuallyHidden>
		{#if isBusy}<Spinner size="sm" />{/if}
		{#if hasClear && value && !isDisabled}
			<InputClearButton
				label={t('@astryx.timeInput.clearLabel', { label })}
				onclick={handleClear}
			/>
		{/if}
		<InputStatusIcon {statusIcon} />
	</div>
{/snippet}

{#if inputGroup}
	{@render inputWrapper()}
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
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
		{#if showsDisabledMessage && disabledMessage}
			<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
		{/if}
	</Field>
{/if}
