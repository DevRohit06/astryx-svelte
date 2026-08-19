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
	 * `onwheel` is **not** omitted — but it does not behave as upstream's does, and
	 * the difference is worth stating rather than papering over. Ours is attached
	 * by Svelte to the element itself, beside the component's own native listener,
	 * so `stopPropagation()` does not reach it and a consumer's handler **fires**
	 * after each consumed step. React delegates `onWheel` from the root container,
	 * so upstream's `stopPropagation()` on the element listener means the root
	 * never sees the event and the consumer's handler **does not fire**. Matching
	 * upstream would need `stopImmediatePropagation()`, which only works if our
	 * listener happens to be registered first — too fragile a thing to lean on in
	 * order to gain the *less* useful behaviour.
	 *
	 * (Upstream has no equivalent hole for `oninput`: React registers `onInput` and
	 * `onChange` as separate props over the same native event, so a caller's
	 * `onInput` arriving through `{...props}` does fire alongside the component's
	 * own. Ours makes it a compile error instead of a silent drop.)
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
		 * Whether the input is read-only.
		 *
		 * The value is shown at full opacity and still submits with the form, but
		 * cannot be edited. Unlike `isDisabled`, a read-only input is not dimmed and
		 * stays in the tab order — use it for a value the user should see and send
		 * but not change. Stepping is off in every form while read-only: arrow keys,
		 * the wheel, and the number steppers. `isDisabled` takes precedence when
		 * both are set.
		 * @default false
		 */
		isReadOnly?: boolean;
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
		/**
		 * Minimum allowed value. A validation constraint (typing below it is
		 * rejected), the lower clamp for stepping, and the `aria-valuemin` the
		 * spinbutton advertises.
		 */
		min?: number | null;
		/**
		 * Maximum allowed value. A validation constraint (typing above it is
		 * rejected), the upper clamp for stepping, and the `aria-valuemax` the
		 * spinbutton advertises.
		 */
		max?: number | null;
		/**
		 * The step increment used by the arrow keys, the wheel and the number
		 * steppers. Never a validation constraint, and never rendered as an
		 * attribute — the control is a text-backed spinbutton, so there is no native
		 * `step` for a browser to enforce. An unset, non-finite, non-positive, or
		 * (under `isIntegerOnly`) fractional value falls back to `1`.
		 * @default 1
		 */
		step?: number | null;
		/**
		 * Formats the committed value while the input is not being edited. The raw
		 * numeric value is shown on focus so it stays editable, and the formatted
		 * one is exposed to assistive technology as `aria-valuetext`.
		 *
		 * Setting it moves form participation to a hidden input: the visible field
		 * would otherwise submit the formatted text.
		 */
		formatValue?: (value: number) => string;
		/**
		 * Whether scrolling the wheel over a focused input steps the value.
		 * @default true
		 */
		isWheelEnabled?: boolean;
		/**
		 * Whether to show increment and decrement buttons at the end of the input.
		 * @default false
		 */
		hasNumberSteppers?: boolean;
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
		 * Fired on every keydown. Lowercase because it is composed onto the
		 * `<input>`; upstream names it `onKeyDown`.
		 *
		 * For an unmodified ArrowUp/ArrowDown it fires **before** the step, and
		 * calling `preventDefault()` abandons it — that is the documented way to
		 * take over the arrow keys. For every other key it fires last, after the
		 * Enter commit.
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

	type StepDirection = -1 | 1;

	/**
	 * Decimal places in a number's *shortest* string form, exponent included, so
	 * `1e-7` reports 7 rather than the 0 a naive `split('.')` would.
	 */
	function getDecimalPlaces(value: number): number {
		const [coefficient, exponentText] = String(value).toLowerCase().split('e');
		const fractionLength = coefficient.split('.')[1]?.length ?? 0;
		const exponent = exponentText == null ? 0 : Number(exponentText);
		return Math.max(0, fractionLength - exponent);
	}

	/**
	 * `step`'s documented `@default 1`, applied in behaviour rather than as an
	 * attribute: an unset, non-finite, non-positive, or (under `isIntegerOnly`)
	 * fractional step all fall back to `1`.
	 */
	function getEffectiveStep(step: number | null | undefined, isIntegerOnly: boolean): number {
		if (
			step == null ||
			!Number.isFinite(step) ||
			step <= 0 ||
			(isIntegerOnly && !Number.isInteger(step))
		) {
			return 1;
		}
		return step;
	}

	/**
	 * The next value one step away, or the current one when there is nowhere to
	 * go. Transcribed from upstream rather than reimplemented — every constant is
	 * load-bearing:
	 *
	 * - `stepBase` anchors the grid on `min` (upstream's `stepMismatch` rule), but
	 *   only when `min` itself is legal for the field, else `0`.
	 * - The `tolerance` is what makes `0.25` at `step: 0.1` land on `0.3` going up
	 *   and `0.2` going down instead of being pushed a whole step by float error.
	 * - Clamping is `max(min, …)` then `min(max, …)`, so at a boundary the result
	 *   equals the current value and the `nextValue !== value` guard in `stepValue`
	 *   makes the step a no-op. That same comparison is what disables one stepper
	 *   button at a time.
	 * - `precision` re-rounds through `toFixed` so `0.1 + 0.2` reads `0.3`.
	 */
	function getSteppedValue({
		currentValue,
		direction,
		min,
		max,
		step,
		isIntegerOnly
	}: {
		currentValue: number | null;
		direction: StepDirection;
		min?: number | null;
		max?: number | null;
		step?: number | null;
		isIntegerOnly: boolean;
	}): number | null {
		const effectiveStep = getEffectiveStep(step, isIntegerOnly);
		const stepBase = min != null && (!isIntegerOnly || Number.isInteger(min)) ? min : 0;

		let nextValue: number;
		if (currentValue == null) {
			nextValue = direction === 1 ? (min ?? 0) : (max ?? 0);
			if (isIntegerOnly) {
				nextValue = direction === 1 ? Math.ceil(nextValue) : Math.floor(nextValue);
			}
		} else {
			const stepPosition = (currentValue - stepBase) / effectiveStep;
			const tolerance = Number.EPSILON * Math.max(1, Math.abs(stepPosition)) * 4;
			const nextStepPosition =
				direction === 1
					? Math.floor(stepPosition + tolerance) + 1
					: Math.ceil(stepPosition - tolerance) - 1;
			nextValue = stepBase + nextStepPosition * effectiveStep;
		}

		if (min != null) {
			nextValue = Math.max(min, nextValue);
		}
		if (max != null) {
			nextValue = Math.min(max, nextValue);
		}

		if (!Number.isFinite(nextValue)) {
			return currentValue;
		}

		const precision = Math.min(
			12,
			Math.max(getDecimalPlaces(effectiveStep), getDecimalPlaces(stepBase))
		);
		const roundedValue = Number(nextValue.toFixed(precision));
		if (isIntegerOnly && !Number.isInteger(roundedValue)) {
			return currentValue;
		}
		return Object.is(roundedValue, -0) ? 0 : roundedValue;
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
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import {
		numberInputAttrs,
		numberInputIncrementIconStyle,
		numberInputStepperButtonAttrs,
		numberInputSteppersAttrs,
		numberInputUnitsAttrs,
		numberInputWrapperAttrs
	} from './number-input.stylex.js';

	/**
	 * A numeric field with the whole `Field` shell around it — or, when nested in
	 * an `InputGroup`, a bare control that borrows the group's label and collapses
	 * its border into the row.
	 *
	 * The control is a **text-backed spinbutton**: `type="text"` with
	 * `role="spinbutton"` and `aria-valuemin`/`valuemax`/`valuenow`/`valuetext`,
	 * rather than `type="number"`. That is what lets `formatValue` show
	 * `$1,234.56` at rest and the raw number on focus, and what makes the stepping
	 * arithmetic the component's own rather than the UA's.
	 *
	 * `onChange` fires only for values that pass validation (`min`/`max`/
	 * `isIntegerOnly`); an unparseable entry is held in a local pending buffer,
	 * dims the text, announces itself to assistive technology and reverts on blur.
	 * Stepping — arrow keys, wheel, and the optional `hasNumberSteppers` buttons —
	 * *clamps* to `min`/`max` and no-ops at the boundary, where typing out of range
	 * is rejected outright.
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
		isReadOnly = false,
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
		formatValue,
		isWheelEnabled = true,
		hasNumberSteppers = false,
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

	// Announce the effective required state (form default included) while the
	// native `required` stays bound to the explicit `isRequired`, so a layout
	// default never switches on browser validation.
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});

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

	// One base id with derived suffixes — the counterpart to upstream's five
	// `useId` calls, plus a sixth for the tooltip, which our `useTooltip` takes as
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

	// Pending input while the user is typing (null = show the formatted value).
	let pendingInput = $state<string | null>(null);
	// Plain `$state` rather than a DOM probe: it swaps `displayValue` between the
	// formatted and the raw form, so it has to be readable during render.
	let isFocused = $state(false);

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

	const formattedValue = $derived.by(() => {
		if (value == null) {
			return '';
		}
		return formatValue?.(value) ?? String(value);
	});

	// Preserve pending text while editing. Otherwise show the formatted value at
	// rest and the raw numeric value while focused so it remains editable.
	const displayValue = $derived.by(() => {
		if (pendingInput !== null) {
			return pendingInput;
		}
		if (value == null) {
			return '';
		}
		return isFocused ? String(value) : formattedValue;
	});

	/**
	 * Writes `displayValue` onto the input **only when the element disagrees**,
	 * which is React's controlled-input rule (`updateInput`: `if (node.value !=
	 * value) node.value = …`).
	 *
	 * It is an attachment rather than a `value={…}` attribute because the
	 * `<input>` carries `{...rest}`: any spread routes *every* attribute through
	 * `set_attributes`, whose guard compares against the previously **rendered**
	 * string and then assigns `element.value` unconditionally. Svelte's non-spread
	 * `set_value` does carry the DOM compare — the spread is what loses it.
	 *
	 * **Defensive, not currently load-bearing.** Under `type="number"` this fixed a
	 * live bug (a `badInput` field reports `value === ''` while showing `1e`, so the
	 * stale compare wiped the editor). 0.4.1's `type="text"` has no bad-input state,
	 * and the obvious replacement symptom does not exist either: the HTML `value`
	 * setter only moves the caret when the new value *differs*, so a redundant
	 * same-string write is harmless. No case in the suite discriminates today. It
	 * stays because it is the faithful translation of `updateInput`, costs one
	 * string comparison per keystroke, and is what makes the server-only `value`
	 * spread below coherent. The client-side suite that used to pin it is retired;
	 * `src/tests/batch-5-server-markup.test.ts` still pins the spread. port/todo.md's
	 * batch-5 entry has the measurement.
	 *
	 * It must stay **reactive** (no `untrack`): since 0.4.1 `displayValue` genuinely
	 * changes under the user's hands, because focusing swaps the formatted string
	 * for the raw number and blurring swaps it back. `untrack`ing would run the
	 * attachment only at attach time and leave `$1,234.56` in a field being typed
	 * into. This is what distinguishes it from `useOverflow`/`useListFocus`, where
	 * the attachment is an attach/detach hook and a separate `$effect` owns updates.
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
		// The value can't change while showing a disabled message or while
		// read-only (both make the field `readonly`), but guard the handler too so
		// the pending value and onChange never fire.
		if (isDisabled || isReadOnly) {
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

	function handleFocus(e: FocusEvent): void {
		isFocused = true;
		onfocus?.(e as Parameters<NonNullable<typeof onfocus>>[0]);
	}

	function handleBlur(e: FocusEvent): void {
		commitPending();
		// Clear the pending input — the display reverts to the formatted value.
		pendingInput = null;
		isFocused = false;
		onblur?.(e as Parameters<NonNullable<typeof onblur>>[0]);
	}

	/**
	 * The number the next step starts from: the pending text when it parses, the
	 * committed value when it does not, and `null` for an emptied field — so
	 * stepping out of a half-typed entry lands where the user can see it.
	 */
	const valueForStepping = $derived.by(() => {
		if (pendingInput === null) {
			return value ?? null;
		}
		if (pendingInput.trim() === '') {
			return null;
		}
		return parseNumberInput(pendingInput, { min, max, isIntegerOnly }) ?? value ?? null;
	});

	function getNextValue(direction: StepDirection): number | null {
		return getSteppedValue({
			currentValue: valueForStepping,
			direction,
			min,
			max,
			step,
			isIntegerOnly
		});
	}

	function stepValue(direction: StepDirection): void {
		// A read-only field is not steppable by any route: keyboard, wheel, or the
		// stepper buttons all land here.
		if (isDisabled || isReadOnly) {
			return;
		}
		const nextValue = getNextValue(direction);
		if (nextValue == null) {
			return;
		}
		pendingInput = null;
		if (nextValue !== value) {
			emit(nextValue);
		}
	}

	// At a boundary `getSteppedValue` clamps back onto the current value, so the
	// same comparison that makes a step a no-op is what greys out one button.
	const canIncrement = $derived(getNextValue(1) !== valueForStepping);
	const canDecrement = $derived(getNextValue(-1) !== valueForStepping);

	function handleKeyDown(e: KeyboardEvent): void {
		const hasModifier = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
		if (!hasModifier && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			// `onkeydown` runs *first* in this branch so a consumer can take the
			// arrow keys over with `preventDefault()`, and the early `return` is what
			// keeps it firing exactly once.
			onkeydown?.(e as Parameters<NonNullable<typeof onkeydown>>[0]);
			if (e.defaultPrevented) {
				return;
			}
			e.preventDefault();
			stepValue(e.key === 'ArrowUp' ? 1 : -1);
			return;
		}
		if (e.key === 'Enter') {
			// Validate and commit on Enter. Unlike blur, `pendingInput` is *not*
			// cleared, so the typed text stays on screen.
			commitPending();
			onEnter?.();
		}
		onkeydown?.(e as Parameters<NonNullable<typeof onkeydown>>[0]);
	}

	/**
	 * A wheel gesture over the focused input steps the value, and the page must
	 * not scroll as well — which needs `preventDefault()` on a **non-passive**
	 * listener. Upstream reaches for a native listener because React's *delegated*
	 * one can be passive; Svelte marks only `touchstart`/`touchmove` passive
	 * (`utils.js`'s `PASSIVE_EVENTS`), so that half does not apply here.
	 *
	 * The reason ours is still an attachment is the other half: the `<input>`
	 * carries `{...rest}`, and an `onwheel={…}` attribute placed after the spread
	 * would silently **shadow** a consumer's own `onwheel` rather than run beside
	 * it. (What "beside it" means differs from upstream — see the note on
	 * `onwheel` in the props interface above.)
	 *
	 * Only `isWheelEnabled` is read synchronously, so that is the one prop whose
	 * change re-attaches the listener — upstream's `useCallback` ref re-runs on
	 * `isDisabled`/`isReadOnly` and on every keystroke (its deps reach
	 * `pendingInput` through `stepValue`), but those are re-read inside the handler
	 * here and so behave identically without the churn.
	 */
	function attachWheel(el: HTMLInputElement): (() => void) | void {
		if (!isWheelEnabled) {
			return;
		}

		const handleWheel = (event: WheelEvent): void => {
			// Bail before preventDefault so a read-only input never swallows the page
			// scroll it cannot act on.
			if (
				document.activeElement !== el ||
				isDisabled ||
				isReadOnly ||
				event.deltaY === 0 ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey
			) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			stepValue(event.deltaY < 0 ? 1 : -1);
		};

		el.addEventListener('wheel', handleWheel, { passive: false });
		return () => el.removeEventListener('wheel', handleWheel);
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

	const theme = $derived(
		themeProps('number-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null,
			readonly: isReadOnly ? 'readonly' : null
		})
	);
	const wrapperAttrs = $derived(
		numberInputWrapperAttrs(
			size,
			status?.type,
			isDisabled,
			inputGroup != null,
			hasNumberSteppers,
			xstyle
		)
	);
	const controlAttrs = $derived(numberInputAttrs(isDisabled, !isInputValid));
	const unitsAttrs = numberInputUnitsAttrs();
	const steppersAttrs = numberInputSteppersAttrs();
	const incrementDisabled = $derived(isDisabled || isReadOnly || !canIncrement);
	const decrementDisabled = $derived(isDisabled || isReadOnly || !canDecrement);
	const incrementAttrs = $derived(numberInputStepperButtonAttrs(false, incrementDisabled));
	const decrementAttrs = $derived(numberInputStepperButtonAttrs(true, decrementDisabled));
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
			name={isDisabled || formatValue ? undefined : htmlName}
			type="text"
			inputmode={isIntegerOnly ? 'numeric' : 'decimal'}
			role="spinbutton"
			autocomplete={autoComplete as HTMLInputAttributes['autocomplete']}
			oninput={handleInputChange}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
			{placeholder}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			readonly={isReadOnly || showsDisabledMessage || undefined}
			autofocus={hasAutoFocus}
			data-autofocus={hasAutoFocus || undefined}
			aria-valuemin={min ?? undefined}
			aria-valuemax={max ?? undefined}
			aria-valuenow={value ?? undefined}
			aria-valuetext={value == null || !formatValue ? undefined : formattedValue}
			aria-describedby={aria.ariaDescribedBy}
			aria-required={isEffectivelyRequired() ? 'true' : undefined}
			aria-invalid={status?.type === 'error' || !isInputValid ? 'true' : undefined}
			aria-labelledby={aria.ariaLabelledBy}
			class={controlAttrs.class}
			style={controlAttrs.style}
			{@attach syncDisplayValue}
			{@attach attachWheel}
		/>
		<!--
			With a formatter the visible field holds `$1,234.56`, which is not what a
			form should submit — so `name` moves to a hidden input carrying the raw
			number instead.
		-->
		{#if formatValue && htmlName && !isDisabled}
			<input type="hidden" name={htmlName} value={value == null ? '' : String(value)} />
		{/if}
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
		{#if hasClear && value != null && !isDisabled && !isReadOnly}
			<InputClearButton
				label={t('@astryx.numberInput.clearLabel', { label })}
				onclick={handleClear}
			/>
		{/if}
		<InputStatusIcon {statusIcon} />
		{#if hasNumberSteppers}
			<div class={steppersAttrs.class} style={steppersAttrs.style}>
				<button
					type="button"
					tabindex={-1}
					disabled={incrementDisabled}
					aria-label={t('@astryx.numberInput.incrementLabel', { label })}
					onpointerdown={(e) => e.preventDefault()}
					onclick={() => {
						input?.focus();
						stepValue(1);
					}}
					class={incrementAttrs.class}
					style={incrementAttrs.style}
				>
					<Icon
						icon="chevronDown"
						size="xsm"
						color="inherit"
						xstyle={numberInputIncrementIconStyle}
					/>
				</button>
				<button
					type="button"
					tabindex={-1}
					disabled={decrementDisabled}
					aria-label={t('@astryx.numberInput.decrementLabel', { label })}
					onpointerdown={(e) => e.preventDefault()}
					onclick={() => {
						input?.focus();
						stepValue(-1);
					}}
					class={decrementAttrs.class}
					style={decrementAttrs.style}
				>
					<Icon icon="chevronDown" size="xsm" color="inherit" />
				</button>
			</div>
		{/if}
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
