<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		FocusEventHandler,
		HTMLInputAttributes,
		KeyboardEventHandler
	} from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	// `NumberInputSize` is published from `number-input.stylex.ts`, derived from
	// the size style keys — the arrangement `TextInput`/`TextArea` use.
	import type { NumberInputSize } from './number-input.stylex.js';

	// `NumberInputStatus`/`NumberInputStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream publishes them from `NumberInput/index.ts`.
	export type NumberInputStatus = InputStatus;
	export type NumberInputStatusType = InputStatusType;

	/**
	 * `onChange` and `defaultValue` are omitted so the union arms below can
	 * redeclare `onChange`. `oninput`/`onfocus`/`onblur`/`onkeydown` are omitted
	 * for the same reason the named callbacks replace them: each is composed with
	 * the component's own handler rather than forwarded raw, so leaving them in
	 * the surface would let a caller pass one that typechecks and is then silently
	 * shadowed by the spread. `TextInput` omits `oninput` for the same reason.
	 *
	 * (Upstream has no equivalent hole: React registers `onInput` and `onChange`
	 * as separate props over the same native event, so a caller's `onInput`
	 * arriving through `{...props}` does fire alongside the component's own.)
	 */
	interface NumberInputPropsBase extends Omit<
		BaseProps<HTMLInputElement>,
		'onchange' | 'defaultValue' | 'oninput' | 'onfocus' | 'onblur' | 'onkeydown'
	> {
		/** Label text for the input (always rendered for accessibility). */
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
		 * Why the field is disabled, shown in a tooltip. Setting it keeps the
		 * control focusable — it takes `aria-disabled` and `readonly` instead of the
		 * native `disabled`, so the reason stays discoverable by keyboard.
		 */
		disabledMessage?: string;
		/**
		 * Icon shown before the input.
		 *
		 * Upstream applies `size="sm" color="secondary"` for you; a snippet is
		 * authored by the caller, so set them yourself to match:
		 * `{#snippet startIcon()}<Icon icon="dollar" size="sm" color="secondary" />{/snippet}`
		 */
		startIcon?: Snippet;
		/**
		 * Icon shown before the label text.
		 *
		 * Upstream applies `size="sm" color="inherit"`; set them yourself to match.
		 */
		labelIcon?: Snippet;
		/** Validation status, rendered as a border, an icon and an optional message. */
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
		 * Size of the control. Inherited from an enclosing `SizeContext` when unset.
		 * @default 'md'
		 */
		size?: NumberInputSize;
		/**
		 * The current value. `null` or `undefined` is an empty/unset value.
		 *
		 * Strictly controlled — unlike `TextInput`, this is **not** `$bindable()`.
		 * Upstream never writes it back; every commit path is `onChange` only, and
		 * the emptied-then-blurred-with-no-parent-update case depends on that.
		 */
		value: number | null | undefined;
		/** Placeholder text. */
		placeholder?: string;
		/** Width of the whole field — label, control and status. */
		width?: SizeValue;
		/** Tooltip text shown from an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * @default false
		 */
		hasAutoFocus?: boolean;
		/** `name` attribute, for form submission. */
		htmlName?: string;
		/** `autocomplete` attribute. */
		autoComplete?: string;
		/** Minimum allowed value. Both an `min` attribute and a validation constraint. */
		min?: number | null;
		/** Maximum allowed value. Both a `max` attribute and a validation constraint. */
		max?: number | null;
		/**
		 * The step increment. Rendered as the `step` attribute only — it is *not* a
		 * validation constraint. Unset renders no attribute (upstream's props table
		 * documents a default of `1`; that is the HTML implicit step, not a
		 * component default, and the source assigns none).
		 */
		step?: number | null;
		/** Units text shown at the end of the input (e.g. `'%'` or `'GB'`). */
		units?: string | null;
		/**
		 * Whether to accept integers only.
		 * @default false
		 */
		isIntegerOnly?: boolean;
		/**
		 * Fired when the input receives focus. Lowercase because it composes with
		 * the `<input>`'s own handler; upstream names it `onFocus`.
		 */
		onfocus?: FocusEventHandler<HTMLInputElement>;
		/**
		 * Fired when the input loses focus, *after* the pending value is committed.
		 * Lowercase for the reason above; upstream names it `onBlur`.
		 */
		onblur?: FocusEventHandler<HTMLInputElement>;
		/** Called when Enter is pressed, after the Enter commit. */
		onEnter?: () => void;
		/**
		 * Fired on every keydown, after the Enter handling. Lowercase because it is
		 * composed onto the `<input>`; upstream names it `onKeyDown`.
		 */
		onkeydown?: KeyboardEventHandler<HTMLInputElement>;
	}

	/**
	 * Without `hasClear`, `onChange` only receives valid numbers. With `hasClear`
	 * it widens to accept `null`, which is what clearing emits.
	 *
	 * A discriminated union rather than an interface — upstream's shape. The three
	 * constituent types stay unexported here because upstream exports only the
	 * union.
	 */
	type NumberInputPropsNonClearable = NumberInputPropsBase & {
		hasClear?: false;
		onChange: (value: number) => void;
	};

	type NumberInputPropsClearable = NumberInputPropsBase & {
		/**
		 * Whether to show a clear button when a value is set. Clicking it resets the
		 * value to `null` and returns focus to the input.
		 *
		 * When enabled, `onChange` widens to also accept `null`.
		 */
		hasClear: true;
		onChange: (value: number | null) => void;
	};

	export type NumberInputProps = NumberInputPropsNonClearable | NumberInputPropsClearable;

	/**
	 * Parse and validate a string as a number, returning `null` when it fails.
	 *
	 * Module-private, as upstream's is. The order of the checks is upstream's and
	 * is observable: a blank or lone `-` is rejected before `Number()` sees it,
	 * and the integer constraint is applied before the range ones.
	 */
	function parseNumberInput(
		input: string,
		options: { min?: number | null; max?: number | null; isIntegerOnly?: boolean }
	): number | null {
		const trimmed = input.trim();
		if (trimmed === '' || trimmed === '-') {
			return null;
		}

		const num = Number(trimmed);
		if (!Number.isFinite(num)) {
			return null;
		}

		// Check integer constraint
		if (options.isIntegerOnly && !Number.isInteger(num)) {
			return null;
		}

		// Check min constraint
		if (options.min != null && num < options.min) {
			return null;
		}

		// Check max constraint
		if (options.max != null && num > options.max) {
			return null;
		}

		return num;
	}
</script>

<script lang="ts">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import {
		numberInputAttrs,
		numberInputClearButtonAttrs,
		numberInputUnitsAttrs,
		numberInputWrapperAttrs
	} from './number-input.stylex.js';

	/**
	 * A numeric field with the whole `Field` shell around it — or, when nested in
	 * an `InputGroup`, a bare control that borrows the group's label and collapses
	 * its border into the row.
	 *
	 * `onChange` fires only for values that pass validation (`min`/`max`/
	 * `isIntegerOnly`); an unparseable entry is held in a local pending buffer,
	 * dims the text, announces itself to assistive technology and reverts on blur.
	 * There are **no increment/decrement buttons** — the only stepper is the one
	 * `type="number"` gives the UA. (Upstream's `.doc.mjs` anatomy lists a
	 * `Spinner` for "increment and decrement controls"; the source renders none,
	 * and the source wins.)
	 *
	 * @example
	 * ```svelte
	 * <NumberInput label="Quantity" value={quantity} onChange={(v) => (quantity = v)} />
	 * <NumberInput label="Price" value={price} onChange={(v) => (price = v)} min={0} step={0.01} />
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
		startIcon,
		labelIcon,
		status,
		statusVariant = 'attached',
		size: sizeProp,
		onChange,
		value,
		placeholder,
		labelTooltip,
		hasAutoFocus = false,
		htmlName,
		autoComplete,
		min,
		max,
		step,
		units,
		isIntegerOnly = false,
		onfocus,
		onblur,
		hasClear,
		onEnter,
		onkeydown,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: NumberInputProps = $props();

	// The union's two arms differ only in whether `onChange` accepts `null`, and
	// destructuring a union narrows a call to the *intersection* of the parameter
	// types — so the clearable arm's own `onChange(null)` would not typecheck.
	// One cast at the single point the arms meet, the seam `ListItem` documents.
	const emit = $derived(onChange as (value: number | null) => void);

	const t = useTranslator();
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
	const unitsID = `${uid}-units`;

	let container = $state<HTMLDivElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);

	// Pending input while the user is typing (null = show the committed value).
	let pendingInput = $state<string | null>(null);

	// A disabled field with a reason stays perceivable: it takes aria-disabled and
	// readonly instead of the native disabled attribute, and the tooltip listeners
	// attach to the always-present container rather than the pointer-swallowing input.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

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
				// The status message element is rendered by `Field`, which is skipped
				// inside an `InputGroup` — only reference it when it actually exists.
				!inputGroup && statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
				// The tooltip variant renders no message box; describe the input by the
				// tooltip's content instead so the status is still announced.
				statusIcon.describedBy ?? null,
				// The units are rendered as decorative text beside the control, so the
				// only way they reach assistive tech is through the description.
				units ? unitsID : null,
				showsDisabledMessage ? disabledMessageTooltip.describedBy : null
			],
			groupValue ? { labelID: groupValue.labelID, describedByIDs: groupValue.describedByIDs } : null
		)
	);

	// Display value: the pending text while typing, otherwise the committed value.
	// With type="number" there is no formatted display value to fall back to.
	const displayValue = $derived.by(() => {
		if (pendingInput !== null) {
			return pendingInput;
		}
		if (value == null) {
			return '';
		}
		return String(value);
	});

	/**
	 * Writes `displayValue` onto the input **only when the element disagrees**,
	 * which is React's controlled-input rule (`updateInput`: `if (node.value !=
	 * value) node.value = …`) and the reason upstream does not clobber a
	 * partially-typed number.
	 *
	 * This has to be an attachment rather than a `value={…}` attribute because the
	 * `<input>` carries `{...rest}`: any spread routes *every* attribute through
	 * `set_attributes`, whose guard compares against the previously **rendered**
	 * string and then assigns `element.value` unconditionally. Svelte's non-spread
	 * `set_value` does carry the DOM compare — the spread is what loses it.
	 *
	 * It matters because a number field in `badInput` (`1e`, `2-`, …) reports
	 * `value === ''` while still showing the raw text. `pendingInput` correctly
	 * becomes `''` — `hasClear`'s commit-null-on-blur depends on that, so the
	 * guard must not move into `handleInputChange` — and the stale compare then
	 * sees `'1' → ''` and wipes the editor. Typing `1e5` ended as `5`.
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

	// Whether the pending text parses — drives the dimmed text, `aria-invalid`
	// and the live region. A blank pending value is *not* invalid.
	const isInputValid = $derived.by(() => {
		if (pendingInput === null || !pendingInput.trim()) {
			return true;
		}
		return parseNumberInput(pendingInput, { min, max, isIntegerOnly }) !== null;
	});

	/** Commit the pending text, honouring the clearable contract. Shared by blur and Enter. */
	function commitPending(): void {
		if (pendingInput === null) {
			return;
		}
		if (hasClear && pendingInput.trim() === '') {
			// Keyboard clearing honors the clearable contract: an emptied input
			// commits null instead of silently reverting.
			if (value != null) {
				emit(null);
			}
		} else {
			const parsed = parseNumberInput(pendingInput, { min, max, isIntegerOnly });
			if (parsed !== null && parsed !== value) {
				emit(parsed);
			}
		}
	}

	// Bound to `oninput`, not `onchange`: React's `onChange` on an input is the
	// native `input` event and fires per keystroke.
	function handleInputChange(e: Event): void {
		// The value can't change while showing a disabled message (the field is
		// read-only and non-native-disabled), but guard the handler too so the
		// pending value and onChange never fire.
		if (isDisabled) {
			return;
		}
		const newValue = (e.target as HTMLInputElement).value;
		pendingInput = newValue;

		// If the input is valid, update immediately.
		const parsed = parseNumberInput(newValue, { min, max, isIntegerOnly });
		if (parsed !== null && parsed !== value) {
			emit(parsed);
		}
	}

	function handleBlur(e: FocusEvent): void {
		commitPending();
		// Clear the pending input — the display reverts to the committed value.
		pendingInput = null;
		onblur?.(e as Parameters<NonNullable<typeof onblur>>[0]);
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter') {
			// Validate and commit on Enter. Unlike blur, `pendingInput` is *not*
			// cleared, so the typed text stays on screen.
			commitPending();
			onEnter?.();
		}
		onkeydown?.(e as Parameters<NonNullable<typeof onkeydown>>[0]);
	}

	// While focused, a wheel gesture steps the value — keep that gesture from
	// also bubbling up and scrolling an ancestor container (page, Dialog,
	// ScrollArea). When the input isn't focused the wheel isn't stepping the
	// value, so normal scrolling is left alone.
	//
	// `wheel` is not one of the events Svelte delegates to the root, so the
	// listener is attached to the element itself and `stopPropagation` behaves
	// as it does in React's synthetic tree here.
	function handleWheel(e: WheelEvent): void {
		if (document.activeElement === e.currentTarget) {
			e.stopPropagation();
		}
	}

	function handleClear(): void {
		if (hasClear) {
			emit(null);
		}
		pendingInput = null;
		input?.focus();
	}

	// Focus the input when clicking anywhere on the wrapper (icons, padding).
	const inputContainer = useInputContainer(() => ({
		container,
		input,
		disabled: isDisabled
	}));

	const theme = $derived(themeProps('number-input', { size, status: status?.type ?? null }));
	const wrapperAttrs = $derived(
		numberInputWrapperAttrs(size, status?.type, isDisabled, inputGroup != null, xstyle)
	);
	const controlAttrs = $derived(numberInputAttrs(isDisabled, !isInputValid));
	const unitsAttrs = numberInputUnitsAttrs();
	const clearAttrs = numberInputClearButtonAttrs();
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
		{#if startIcon}{@render startIcon()}{/if}
		{#if inputGroup}
			<VisuallyHidden id={inputLabelID}>{label}</VisuallyHidden>
		{/if}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			{...rest}
			{...isServer ? { value: displayValue } : undefined}
			bind:this={input}
			{id}
			name={htmlName}
			type="number"
			autocomplete={autoComplete as HTMLInputAttributes['autocomplete']}
			oninput={handleInputChange}
			{onfocus}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
			onwheel={handleWheel}
			{placeholder}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			readonly={showsDisabledMessage || undefined}
			autofocus={hasAutoFocus}
			data-autofocus={hasAutoFocus || undefined}
			min={min ?? undefined}
			max={max ?? undefined}
			step={step ?? undefined}
			aria-describedby={aria.ariaDescribedBy}
			aria-required={isRequired === true ? 'true' : undefined}
			aria-invalid={status?.type === 'error' || !isInputValid ? 'true' : undefined}
			aria-labelledby={aria.ariaLabelledBy}
			class={controlAttrs.class}
			style={controlAttrs.style}
			{@attach syncDisplayValue}
		/>
		{#if units}<span id={unitsID} class={unitsAttrs.class} style={unitsAttrs.style}>{units}</span
			>{/if}
		<!--
			Live region announcing invalid typed input to assistive technology. The
			value silently reverts on blur, so without this a screen-reader user
			would get no feedback that their entry was rejected (WCAG 3.3.1).
		-->
		<VisuallyHidden as="div" role="alert" aria-live="assertive">
			{!isInputValid ? 'Invalid number' : ''}
		</VisuallyHidden>
		{#if hasClear && value != null && !isDisabled}
			<button
				type="button"
				onclick={handleClear}
				aria-label={t('@astryx.numberInput.clearLabel', { label })}
				class={clearAttrs.class}
				style={clearAttrs.style}
			>
				<Icon icon="close" size="sm" color="secondary" />
			</button>
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
		{labelIcon}
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
