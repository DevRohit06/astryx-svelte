<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { KeyboardEventHandler } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	// `TextInputSize` is published from `text-input.stylex.ts`, derived from the
	// size style keys — the arrangement `TextAreaSize` uses.
	import type { TextInputSize } from './text-input.stylex.js';

	/** The three input modes upstream supports — no `number`, `tel`, etc. */
	export type TextInputType = 'text' | 'password' | 'email';

	// `TextInputStatus`/`TextInputStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream publishes them from `TextInput/index.ts`.
	export type TextInputStatus = InputStatus;
	export type TextInputStatusType = InputStatusType;

	/**
	 * `BaseProps` is parameterised to `HTMLInputElement` so `rest` spreads onto the
	 * `<input>`. `oninput` and `onkeydown` are omitted so the redeclarations below
	 * replace rather than conflict — `oninput` is bound to the change handler, and
	 * `onkeydown` is composed with `onEnter`.
	 */
	export interface TextInputProps extends Omit<
		BaseProps<HTMLInputElement>,
		'oninput' | 'onkeydown'
	> {
		/**
		 * @default 'text'
		 */
		type?: TextInputType;
		/** Label text for the field (always rendered for accessibility). */
		label: string;
		/** The input's value. */
		value: string;
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
		 * The value is shown at full opacity and still submits with the form, but
		 * cannot be edited. Unlike `isDisabled`, a read-only input is not dimmed and
		 * stays in the tab order — use it for a value the user should see and send
		 * but not change. `isDisabled` takes precedence when both are set.
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
		 * `{#snippet startIcon()}<Icon icon="search" size="sm" color="secondary" />{/snippet}`
		 */
		startIcon?: Snippet;
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
		size?: TextInputSize;
		/** Fired on every edit, with the new value and the originating event. */
		onChange?: (value: string, e: Event) => void;
		/**
		 * Async action fired after `onChange`, when it did not `preventDefault`.
		 * Shows the new value optimistically and a spinner while it is in flight.
		 */
		changeAction?: (value: string, e: Event) => void | Promise<void>;
		/**
		 * Shows the busy state without an action in flight.
		 * @default false
		 */
		isLoading?: boolean;
		/** Placeholder text. */
		placeholder?: string;
		/** Width of the whole field — label, control and status. */
		width?: SizeValue;
		/** Tooltip text shown from an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Whether to show a clear button when the input is non-empty and enabled.
		 * @default false
		 */
		hasClear?: boolean;
		/**
		 * @default false
		 */
		hasAutoFocus?: boolean;
		/** `name` attribute, for form submission. */
		htmlName?: string;
		/** Called when Enter is pressed in the input. */
		onEnter?: () => void;
		/**
		 * Fired on keydown, alongside `onEnter`. Lowercase because it is forwarded
		 * to the `<input>`; upstream names it `onKeyDown`.
		 */
		onkeydown?: KeyboardEventHandler<HTMLInputElement>;
	}
</script>

<script lang="ts">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import { textInputAttrs, textInputWrapperAttrs } from './text-input.stylex.js';

	/**
	 * A single-line text field with the whole `Field` shell around it — or, when
	 * nested in an `InputGroup`, a bare control that borrows the group's label and
	 * collapses its border into the row.
	 *
	 * Controlled, as upstream is: `value` in, `onChange` out. `value` is
	 * `$bindable()`, so `bind:value` is the idiomatic spelling; the two-way write
	 * is confined to the plain edit path, leaving the optimistic `changeAction`
	 * path to drive the display and revert, exactly as `TextArea` does.
	 *
	 * @example
	 * ```svelte
	 * <TextInput label="Email" type="email" bind:value />
	 * <TextInput label="Query" hasClear {value} onChange={(v) => (value = v)} />
	 * ```
	 */
	let {
		type = 'text',
		label,
		value = $bindable(),
		isLabelHidden = false,
		description,
		isOptional = false,
		isRequired = false,
		isDisabled = false,
		isReadOnly = false,
		disabledMessage,
		startIcon,
		status,
		statusVariant = 'attached',
		size: sizeProp,
		onChange,
		changeAction,
		isLoading = false,
		placeholder,
		width,
		labelTooltip,
		hasClear = false,
		hasAutoFocus = false,
		htmlName,
		onEnter,
		onkeydown,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: TextInputProps = $props();

	const t = useTranslator();
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	// A member reads the enclosing group once at init (context presence is fixed),
	// then the getter reactively for `describedByIDs`.
	const inputGroup = useInputGroup();

	// One base id with derived suffixes — the counterpart to upstream's several
	// `useId` calls, for the reason the `TextArea` port records.
	const uid = $props.id();
	const id = `${uid}-input`;
	const inputLabelID = `${uid}-label`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const tooltipID = `${uid}-tooltip`;
	const statusTooltipID = `${uid}-status-tip`;

	let container = $state<HTMLDivElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);

	const optimistic = createOptimistic(() => value);

	// Busyness is the optimistic value differing from the committed one — never
	// `optimistic.isPending`, which would show a spinner the plain controlled case
	// never warrants (the `TextArea` port explains this at length).
	const isBusy = $derived(isLoading || optimistic.current !== value);

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
				showsDisabledMessage ? disabledMessageTooltip.describedBy : null
			],
			groupValue ? { labelID: groupValue.labelID, describedByIDs: groupValue.describedByIDs } : null
		)
	);

	// Bound to `oninput`, not `onchange`: React's `onChange` on an input is the
	// native `input` event and fires per keystroke, which every `onChange`-per-
	// character assertion in upstream's suite depends on.
	function handleChange(e: Event): void {
		// TextInput does NOT disable during busy — only aria-busy — so this guard is
		// plain `isDisabled`/`isReadOnly` (unlike TextArea's `effectivelyDisabled`).
		// The value cannot change while either holds (the field is `readonly`), but
		// guard the handler too so the optimistic value and callbacks never fire.
		if (isDisabled || isReadOnly) {
			return;
		}
		const newValue = (e.target as HTMLInputElement).value;
		onChange?.(newValue, e);
		if (changeAction && !e.defaultPrevented) {
			// Optimistic path: leave `value` uncommitted so the override drives the
			// display and `isBusy` stays true for the action's duration.
			void optimistic.run(newValue, () => changeAction(newValue, e));
		} else {
			// Plain edit path: commit the two-way binding, which also removes the
			// need for React's controlled force-reset.
			value = newValue;
		}
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter') {
			onEnter?.();
		}
		onkeydown?.(e as Parameters<NonNullable<typeof onkeydown>>[0]);
	}

	function handleClear(): void {
		onChange?.('', null as unknown as Event);
		value = '';
		input?.focus();
	}

	// Focus the input when clicking anywhere on the wrapper (icons, padding).
	// Plain `isDisabled` — a busy field stays interactive.
	const inputContainer = useInputContainer(() => ({
		container,
		input,
		disabled: isDisabled
	}));

	// `disabled` / `readonly` reflect as `data-disabled` / `data-readonly` (and as
	// bare state classes) so a theme can reach both states without duplicating the
	// component's own conditionals. `readonly` selects no style key — the point of
	// the state is that it is NOT dimmed.
	const theme = $derived(
		themeProps('text-input', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null,
			readonly: isReadOnly ? 'readonly' : null
		})
	);
	const wrapperAttrs = $derived(
		textInputWrapperAttrs(size, status?.type, isDisabled, inputGroup != null, xstyle)
	);
	const controlAttrs = $derived(textInputAttrs(isDisabled));
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
			bind:this={input}
			{id}
			name={isDisabled ? undefined : htmlName}
			{type}
			value={optimistic.current}
			{placeholder}
			oninput={handleChange}
			onkeydown={onEnter || onkeydown ? handleKeyDown : undefined}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			readonly={isReadOnly || showsDisabledMessage || undefined}
			autofocus={hasAutoFocus}
			data-autofocus={hasAutoFocus || undefined}
			aria-describedby={aria.ariaDescribedBy}
			aria-labelledby={aria.ariaLabelledBy}
			aria-required={isRequired === true ? 'true' : undefined}
			aria-invalid={status?.type === 'error' ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			class={controlAttrs.class}
			style={controlAttrs.style}
		/>
		{#if hasClear && value !== '' && !isDisabled && !isReadOnly}
			<InputClearButton
				label={t('@astryx.textInput.clearLabel', { label })}
				onclick={handleClear}
			/>
		{/if}
		{#if isBusy}<Spinner size="sm" />{/if}
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
