<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	import type { IconName } from '../icon/icon-registry.js';
	// `TypeaheadSize` is published from `typeahead.stylex.ts`, derived from the
	// wrapper size style keys — the arrangement `TextInput`/`Selector` use.
	import type { TypeaheadSize } from './typeahead.stylex.js';
	import type { SearchableItem, SearchSource } from './types.js';

	// `TypeaheadSize` is not re-exported from here — the barrel publishes it
	// straight from `typeahead.stylex.ts`, the arrangement `NumberInputSize` uses.

	// `TypeaheadStatus`/`TypeaheadStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream re-exports them from `Typeahead.tsx`.
	export type TypeaheadStatus = InputStatus;
	export type TypeaheadStatusType = InputStatusType;

	/**
	 * `onchange` is omitted so the component's own `onChange` is not shadowed by
	 * the native handler arriving through the rest spread — the hole `NumberInput`
	 * and `Selector` close for the same reason.
	 */
	export interface TypeaheadProps<T extends SearchableItem> extends Omit<
		BaseProps<HTMLDivElement>,
		'onchange'
	> {
		/** Accessible label (required). */
		label: string;
		/**
		 * Visually hide the label.
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Helper text. */
		description?: string;
		/**
		 * Required field.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Optional field.
		 * @default false
		 */
		isOptional?: boolean;
		/** Validation status. */
		status?: InputStatus;
		/**
		 * How the status message is placed relative to the input.
		 * - `attached`: message overlaps directly below the input (bordered treatment)
		 * - `detached`: message floats below as a separate element with spacing
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/**
		 * Icon to display at the start of the input — a registry name, or a snippet
		 * for a custom icon. Upstream applies `size="sm" color="secondary"` to a
		 * registry icon; a snippet is authored by the caller, so set them yourself
		 * to match.
		 */
		startIcon?: IconName | Snippet;
		/**
		 * Width of the field. Numbers are treated as pixels, strings are used as-is
		 * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
		 * stay aligned, unlike setting width via `xstyle`/`class`/`style`.
		 */
		width?: SizeValue;
		/** Label tooltip. */
		labelTooltip?: string;
		/** Search source providing items. */
		searchSource: SearchSource<T>;
		/** Currently selected item (null = nothing selected). */
		value: T | null;
		/** Callback when selection changes. */
		onChange: (item: T | null) => void;
		/** Renderer for dropdown items. Default: `TypeaheadItem`. */
		renderItem?: Snippet<[T]>;
		/** Placeholder text. */
		placeholder?: string;
		/**
		 * Show results on focus before typing.
		 * @default false
		 */
		hasEntriesOnFocus?: boolean;
		/**
		 * Max dropdown items.
		 * @default 10
		 */
		maxMenuItems?: number;
		/**
		 * Text shown when no results found.
		 * @default 'No results found'
		 */
		emptySearchResultsText?: string;
		/**
		 * Whether the input is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Explains why the input is disabled. When set together with `isDisabled`,
		 * the input shows a tooltip with this text on hover and keyboard focus, and
		 * the field stays focusable (via `aria-disabled`) so the reason is
		 * discoverable by keyboard and assistive technology. Editing and selection
		 * stay blocked.
		 *
		 * Use this instead of wrapping a disabled input in `Tooltip` — disabled
		 * controls don't emit the pointer events an external tooltip needs.
		 */
		disabledMessage?: string;
		/**
		 * Show clear button.
		 * @default true
		 */
		hasClear?: boolean;
		/**
		 * Auto-focus on mount.
		 * @default false
		 */
		hasAutoFocus?: boolean;
		/**
		 * Input size.
		 * @default 'md'
		 */
		size?: TypeaheadSize;
		/**
		 * Debounce delay in ms before triggering search after typing.
		 * Set to 0 for synchronous/local search sources that don't need debouncing.
		 * @default 150
		 */
		debounceMs?: number;
		/** Query change callback. */
		onChangeQuery?: (query: string) => void;
		/** Callback when the dropdown opens or closes. */
		onOpenChange?: (isOpen: boolean) => void;
	}
</script>

<script lang="ts" generics="T extends SearchableItem">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { stableClassName } from '../../internal/naming.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { getInputARIA } from '../../utils/input-aria.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Token from '../token/token.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useInputGroup } from '../input-group/input-group-context.svelte.js';
	import BaseTypeahead from './base-typeahead.svelte';
	import {
		typeaheadClearButtonStyle,
		typeaheadInputHiddenStyle,
		typeaheadTokenStyle,
		typeaheadWrapperAttrs
	} from './typeahead.stylex.js';

	/**
	 * A search-as-you-type component for selecting an item from a search source.
	 *
	 * Wraps `BaseTypeahead` with `Field` for label, description, and status. Owns
	 * the input wrapper styling, the selected-value token, and edit mode.
	 *
	 * Edit mode: clicking the token or input area removes the token, populates the
	 * input with the value's label, and selects all text. Blurring without
	 * selecting restores the original token. Escape also restores.
	 *
	 * @example
	 * ```svelte
	 * <Typeahead
	 *   label="Assignee"
	 *   searchSource={userSource}
	 *   value={assignee}
	 *   onChange={(item) => (assignee = item)}
	 *   placeholder="Search users..."
	 * />
	 * ```
	 */
	const {
		label,
		isLabelHidden = false,
		description,
		isRequired = false,
		isOptional = false,
		status,
		statusVariant = 'attached',
		startIcon,
		labelTooltip,
		searchSource,
		value,
		onChange,
		renderItem,
		placeholder,
		hasEntriesOnFocus,
		maxMenuItems,
		emptySearchResultsText,
		isDisabled = false,
		disabledMessage,
		hasClear = true,
		hasAutoFocus,
		size: sizeProp,
		debounceMs,
		onChangeQuery,
		onOpenChange,
		width,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId
	}: TypeaheadProps<T> = $props();

	const t = useTranslator();
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	// One base id with derived suffixes — the counterpart to upstream's four
	// `useId` calls, plus a fifth for the tooltip, which our `useTooltip` takes as
	// an input where upstream's mints it internally.
	const uid = $props.id();
	const inputId = `${uid}-input`;
	const inputLabelId = `${uid}-input-label`;
	const descriptionId = `${uid}-description`;
	const statusMessageId = `${uid}-status`;
	const tooltipId = `${uid}-tooltip`;

	const inputGroup = useInputGroup();

	let wrapperEl = $state<HTMLDivElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	// Disabled-reason tooltip. Disabled controls swallow pointer events, so the
	// tooltip listeners attach to the input wrapper (which already exists) and the
	// input stays perceivable via aria-disabled + readonly instead of the disabled
	// attribute. Editing and selection stay blocked by the isDisabled guards.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipId,
		placement: 'above' as const,
		// The wrapper div is not naturally focusable; focusin bubbles up from the
		// input, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// Edit mode: when the user clicks the token to edit the selected value
	let isEditing = $state(false);
	let editingValue = $state.raw<T | null>(null);

	// Show token when value is selected and not in edit mode
	const showToken = $derived(value != null && !isEditing);

	/** Enter edit mode: remove the token visually, populate the input with the value label. */
	function handleEnterEditMode(): void {
		if (isDisabled || !value) {
			return;
		}
		const current = value;
		editingValue = current;
		isEditing = true;
		// The base will receive onChangeQuery with the value's label
		onChangeQuery?.(current.label);
		requestAnimationFrame(() => {
			const input = inputEl;
			if (input) {
				// Set the input value directly since the base manages its own query
				// state, then dispatch a synthetic `input` to sync it.
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
					window.HTMLInputElement.prototype,
					'value'
				)?.set;
				nativeInputValueSetter?.call(input, current.label);
				input.dispatchEvent(new Event('input', { bubbles: true }));
				input.focus();
				input.setSelectionRange(0, input.value.length);
			}
		});
	}

	/** Restore the token if editing and no selection was made. */
	function handleBlur(e: FocusEvent): void {
		// Don't restore if focus is moving within the wrapper (e.g. to dropdown)
		if (wrapperEl?.contains(e.relatedTarget as Node | null)) {
			return;
		}

		if (editingValue && isEditing) {
			isEditing = false;
			editingValue = null;
			// Value was never cleared from parent, so no onChange needed
		}
	}

	/** Handle selection from the dropdown — clears edit mode. */
	function handleChange(item: T | null): void {
		isEditing = false;
		editingValue = null;
		onChange(item);
		// After selection, focus the token so keyboard users stay in the component.
		// requestAnimationFrame because the token renders on the next cycle.
		if (item) {
			requestAnimationFrame(() => {
				// `Token` exposes no element seam (it neither spreads rest nor takes an
				// attachment — see TODO.md), so the token is found by the stable
				// `astryx-token` class `themeProps` stamps on it, scoped to this
				// component's own wrapper. Upstream holds a `tokenRef`.
				const tokenEl = wrapperEl?.querySelector<HTMLElement>(`.${stableClassName('token')}`);
				if (tokenEl) {
					// Focus the internal button inside the token
					const button = tokenEl.querySelector('button');
					(button ?? tokenEl).focus();
				}
			});
		}
	}

	/** Handle clear (explicit X button on the token). */
	function handleClear(): void {
		isEditing = false;
		editingValue = null;
		onChange(null);
		inputEl?.focus();
	}

	/** Escape during edit mode restores the token. */
	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape' && editingValue) {
			e.preventDefault();
			isEditing = false;
			editingValue = null;
			inputEl?.blur();
		}
	}

	/** Click the wrapper to focus the input or enter edit mode. */
	function handleWrapperClick(): void {
		if (isDisabled) {
			return;
		}
		if (showToken) {
			handleEnterEditMode();
		} else {
			inputEl?.focus();
		}
	}

	const groupValue = $derived(inputGroup ? inputGroup() : null);
	const aria = $derived(
		getInputARIA(
			inputLabelId,
			[
				description ? descriptionId : null,
				status?.message ? statusMessageId : null,
				showsDisabledMessage ? disabledMessageTooltip.describedBy : null
			],
			groupValue ? { labelID: groupValue.labelID, describedByIDs: groupValue.describedByIDs } : null
		)
	);

	// Captures the `<input>` `BaseTypeahead` renders — the counterpart to
	// upstream's `ref={inputRef}`, travelling through the rest props the base
	// spreads onto it.
	const captureInput = (el: Element): void => {
		inputEl = el as HTMLInputElement;
	};

	const theme = $derived(themeProps('typeahead', { size, status: status?.type }));
	const wrapperAttrs = $derived(
		typeaheadWrapperAttrs(size, status?.type, isDisabled, inputGroup != null, xstyle)
	);
</script>

{#snippet startIconSlot()}
	{#if typeof startIcon === 'string'}
		<Icon icon={startIcon} size="sm" color="secondary" />
	{:else if startIcon}
		{@render startIcon()}
	{/if}
{/snippet}

{#snippet typeaheadContent()}
	<!--
		The wrapper is the click target and the dropdown anchor. It is not focusable
		and carries no role: the `role="combobox"` input inside it is the control,
		and the click handler exists only to widen the hit area over the padding and
		the token — both of which sit inside the same field the input already
		exposes to keyboard users.
	-->
	<div
		bind:this={wrapperEl}
		{@attach disabledMessageTooltip.attachTrigger}
		data-testid={testId}
		onclick={handleWrapperClick}
		onfocusout={handleBlur}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class, inputGroup ? className : undefined)}
		style={mergeStyle(
			wrapperAttrs.style,
			inputGroup ? (styleProp as string | undefined) : undefined
		)}
	>
		{#if startIcon}{@render startIconSlot()}{/if}
		{#if inputGroup}
			<VisuallyHidden id={inputLabelId}>{label}</VisuallyHidden>
		{/if}
		{#if showToken && value}
			<Token
				label={value.label}
				{size}
				onclick={handleEnterEditMode}
				{isDisabled}
				xstyle={typeaheadTokenStyle}
			/>
		{/if}
		<BaseTypeahead
			{@attach captureInput}
			{searchSource}
			{value}
			onChange={handleChange}
			{renderItem}
			placeholder={showToken ? undefined : placeholder}
			{hasEntriesOnFocus}
			{maxMenuItems}
			{emptySearchResultsText}
			{isDisabled}
			{hasAutoFocus}
			isFocusableDisabled={showsDisabledMessage}
			{inputId}
			ariaDescribedBy={aria.ariaDescribedBy}
			ariaLabelledBy={aria.ariaLabelledBy}
			{onChangeQuery}
			{onOpenChange}
			{debounceMs}
			anchorEl={wrapperEl}
			onKeyDown={handleKeyDown}
			inputXStyle={showToken ? typeaheadInputHiddenStyle : undefined}
			inputTabIndex={showToken ? -1 : undefined}
			{size}
		/>
		{#if hasClear && value && !isDisabled}
			<InputClearButton
				label={t('@astryx.typeahead.clearSelection')}
				onclick={(e) => {
					e.stopPropagation();
					handleClear();
				}}
				xstyle={typeaheadClearButtonStyle(size === 'sm')}
			/>
		{/if}
	</div>
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
{/snippet}

{#if inputGroup}
	{@render typeaheadContent()}
{:else}
	<Field
		{label}
		{isLabelHidden}
		{description}
		inputID={inputId}
		descriptionID={description ? descriptionId : undefined}
		{isOptional}
		{isRequired}
		{isDisabled}
		status={status
			? {
					type: status.type,
					message: status.message,
					messageID: status.message ? statusMessageId : undefined
				}
			: undefined}
		{statusVariant}
		{labelTooltip}
		{width}
		{xstyle}
		class={className}
		style={styleProp}
	>
		{@render typeaheadContent()}
	</Field>
{/if}
