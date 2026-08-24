<script lang="ts" module>
	import type { PartialFilter, PowerSearchFilter } from './types.js';
	import type { InternalConfig } from './use-internal-config.svelte.js';

	export interface PowerSearchEditPopoverProps {
		config: InternalConfig;
		/** The filter being edited/created. */
		filter: PartialFilter;
		/** 'create' for new filters, 'edit' for existing. */
		mode: 'create' | 'edit';
		/** Called when save is clicked with a complete filter, or null to delete. */
		onSave: (filter: PowerSearchFilter | null) => void;
		/** Called when the popover is closed without saving. */
		onCancel: () => void;
		/** Label for the save button. @default 'Apply' */
		saveButtonLabel?: string;
		/** Whether the filter is read-only. */
		isReadOnly?: boolean;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '../button/button.svelte';
	import HStack from '../stack/hstack.svelte';
	import Selector from '../selector/selector.svelte';
	import VStack from '../stack/vstack.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	// From the module, not the barrel — upstream keeps `isImeKeyEvent` out of
	// `hooks/index.ts` and its consumers import it directly.
	import { isImeKeyEvent } from '../../utils/ime.js';
	import NestedEditor from './nested-editor.svelte';
	import {
		editPopoverChipRowStyle,
		editPopoverContainerAttrs,
		editPopoverContentAttrs,
		editPopoverFieldSelectorAttrs,
		editPopoverFooterAttrs,
		editPopoverOperatorSelectorAttrs,
		editPopoverValueEditorAttrs
	} from './power-search-edit-popover.stylex.js';
	import PowerSearchValueEditor from './power-search-value-editor.svelte';
	import { resolveOperatorLabel } from './resolve-operator-label.js';
	import type { FilterValue, OperatorValue } from './types.js';

	/**
	 * Ported from Astryx's `PowerSearchEditPopover.tsx`.
	 *
	 * Field selector, operator selector, value editor and a Cancel/Apply footer —
	 * the contents of the popover `PowerSearch` opens to create or edit one
	 * filter. A `nested` operator swaps the body for a recursive `NestedEditor`.
	 *
	 * ## State, and why it is seeded once
	 *
	 * `partialFilter` is `$state` initialised from the `filter` prop and **never
	 * re-synced**, exactly as upstream's `useState(initialFilter)` is. The reset
	 * mechanism is a remount: `PowerSearch` wraps this in `{#key popoverKey}`
	 * where upstream passes `key={popoverKey}`. Two upstream test cases exist
	 * purely to pin that, including the *same index, different filter* variant a
	 * naive index-only key would miss — so the key is behaviour, not bookkeeping.
	 *
	 * ## The three React-isms
	 *
	 * - **The mount autofocus effect reads nothing reactive**, so it runs once, as
	 *   its `[]` dependency array says. What buys that is `valueEditorEl` being a
	 *   plain `let` rather than `$state` — see its declaration. An attachment
	 *   would have been the more idiomatic spelling but would also re-fire
	 *   whenever the value-editor branch toggled back on (change the field to an
	 *   `empty` operator and back), stealing focus where upstream's effect does
	 *   not.
	 * - **The empty-type auto-save effect keeps its tracked set to upstream's
	 *   three** — `isEmptyType`, the field and the operator — by `untrack`ing the
	 *   `onSave` **call**. The subtlety is in the spelling and is written out at
	 *   the effect itself; an earlier version wrapped the *lookup* instead, which
	 *   reads identically and untracks nothing.
	 * - **`handleValueChange` saves after the write, not inside it.** Upstream
	 *   calls `onSave` from within `setPartialFilter(prev => …)` — a render-phase
	 *   side effect that StrictMode double-invokes. A `$state` write is
	 *   synchronous, so the same ordering is just the next statement.
	 *
	 * ## Two upstream shapes kept as-is
	 *
	 * - **`isSaveDisabled` does not check `field`.** It is
	 *   `!operator || !value`, so a filter with an operator and a value but no
	 *   field enables Apply — which `handleSave` then rejects, because it *does*
	 *   check all three. Unreachable through the UI (the field selector always has
	 *   a value) and transcribed rather than tidied.
	 * - **The `keydown` handler sits on a bare `<div>`** with no role and no
	 *   `tabIndex`, relying on the event bubbling from a focused input. That is an
	 *   a11y gap on both sides — a keyboard user who has focused nothing inside
	 *   the popover cannot press Escape — and it is upstream's own, so it is
	 *   replicated. See the note above the branches for why it needs no
	 *   `svelte-ignore`.
	 */

	const {
		config,
		filter: initialFilter,
		mode,
		onSave,
		onCancel,
		saveButtonLabel: saveButtonLabelFromProps,
		isReadOnly = false
	}: PowerSearchEditPopoverProps = $props();

	const t = useTranslator();
	const saveButtonLabel = $derived(
		saveButtonLabelFromProps ?? t('@astryx.powersearch.editor.apply')
	);

	// Seeded once and never re-synced, as upstream's `useState(initialFilter)` is
	// — the `{#key}` around this component is what resets it. `untrack` says that
	// deliberately rather than letting the compiler warn about it.
	let partialFilter = $state<PartialFilter>(untrack(() => initialFilter));

	// Not `$state`: written by `bind:this` and read only inside an animation
	// frame, so nothing should re-run when it lands.
	// svelte-ignore non_reactive_update
	let valueEditorEl: HTMLDivElement | null = null;

	// Focus the first focusable element inside the value editor after mount.
	//
	// The dependency set is empty, so this runs once — as its `[]` counterpart
	// upstream does. What makes it empty is line 115: `valueEditorEl` is a plain
	// `let` written by `bind:this`, not a `$state`, so reading it tracks nothing
	// anywhere. (The animation-frame callback runs with no active reaction
	// either, so the read could not track even if it were reactive.)
	$effect(() => {
		const frame = requestAnimationFrame(() => {
			const container = valueEditorEl;
			if (!container) {
				return;
			}
			const focusable = container.querySelector<HTMLElement>(
				'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			);
			focusable?.focus();
		});
		return () => cancelAnimationFrame(frame);
	});

	const currentOperator = $derived(
		partialFilter.operator
			? config.getOperator(partialFilter.field, partialFilter.operator)
			: undefined
	);

	// Build field options for the selector
	const fieldOptions = $derived(
		config.getVisibleFields().map((field) => ({
			value: field.key,
			label: field.label
		}))
	);

	// Build operator options for the current field
	const operatorOptions = $derived(
		config.getVisibleOperators(partialFilter.field).map((op) => ({
			value: op.key,
			label: resolveOperatorLabel(op, t)
		}))
	);

	function handleFieldChange(fieldKey: string): void {
		const defaultOp = config.getDefaultOperator(fieldKey);
		partialFilter = {
			field: fieldKey,
			operator: defaultOp?.key,
			value: undefined
		};
	}

	function handleOperatorChange(operatorKey: string): void {
		const newOp = config.getOperator(partialFilter.field, operatorKey);
		const oldOp = currentOperator;
		const keepValue = newOp && oldOp && newOp.value.type === oldOp.value.type;

		partialFilter = {
			...partialFilter,
			operator: operatorKey,
			value: keepValue ? partialFilter.value : undefined
		};
	}

	function handleValueChange(value: FilterValue, shouldSave?: boolean): void {
		const updated = { ...partialFilter, value };
		partialFilter = updated;
		if (shouldSave && updated.field && updated.operator && updated.value) {
			onSave({
				field: updated.field,
				operator: updated.operator,
				value: updated.value
			});
		}
	}

	function handleSave(): void {
		if (partialFilter.field && partialFilter.operator && partialFilter.value) {
			onSave({
				field: partialFilter.field,
				operator: partialFilter.operator,
				value: partialFilter.value
			});
		}
	}

	function handleDelete(): void {
		onSave(null);
	}

	const isSaveDisabled = $derived(!partialFilter.operator || !partialFilter.value);

	// Handle Enter to save, Escape to cancel.
	//
	// The `defaultPrevented` guard on Enter is what stops the popover closing when
	// the user is selecting a multi-select option with Enter: the option list
	// handles that key and calls `preventDefault`, and without the check this
	// handler still read it as "save and close".
	function handleKeyDown(e: KeyboardEvent): void {
		// Don't treat an IME composition-commit Enter as save-to-close --
		// typing a CJK filter value and pressing Enter to confirm the
		// composition would otherwise close the popover mid-composition.
		if (isImeKeyEvent(e)) {
			return;
		}
		if (e.key === 'Enter' && !isSaveDisabled && !e.defaultPrevented) {
			e.preventDefault();
			handleSave();
		} else if (e.key === 'Escape' && !e.defaultPrevented) {
			e.preventDefault();
			onCancel();
		}
	}

	const operatorValue = $derived<OperatorValue | undefined>(currentOperator?.value);
	const isEmptyType = $derived(operatorValue?.type === 'empty');
	const isNestedType = $derived(operatorValue?.type === 'nested');

	// For empty type, auto-save on mount.
	//
	// The tracked set is deliberately upstream's three — `isEmptyType`, the field
	// and the operator — and **the `untrack` has to wrap the call, not the
	// lookup**. `untrack(() => onSave)(…)` reads as if it untracks the save, and
	// does not: the flag is restored the moment that arrow returns, so the
	// invocation runs tracked and every signal `onSave`'s body touches becomes a
	// dependency of *this* effect. `handlePopoverSave` reads the parent's
	// `popoverState` and `filters` and then writes `popoverState`, so the effect
	// would invalidate itself. Today that is unobservable — the write tears this
	// component down in the same flush, and a destroyed effect is skipped — but
	// it is one ordering change away from a duplicated `onChange` or an
	// `effect_update_depth_exceeded`. Found by the batch-14 idiom audit.
	$effect(() => {
		const shouldSave = isEmptyType;
		const field = partialFilter.field;
		const operator = partialFilter.operator;
		if (shouldSave && field && operator) {
			untrack(() =>
				onSave({
					field,
					operator,
					value: { type: 'empty' }
				})
			);
		}
	});

	const showOperatorSelector = $derived(operatorOptions.length > 1 || !isEmptyType);
</script>

{#snippet footer()}
	<div {...editPopoverFooterAttrs()}>
		<HStack gap={2} hAlign="between">
			{#if !isReadOnly && mode === 'edit'}
				<Button
					label={t('@astryx.powersearch.editor.delete')}
					onclick={handleDelete}
					variant="ghost"
					size="sm"
				/>
			{:else}
				<div></div>
			{/if}
			<HStack gap={2}>
				<Button
					label={t('@astryx.powersearch.editor.cancel')}
					onclick={onCancel}
					variant="ghost"
					size="sm"
				/>
				<Button
					label={saveButtonLabel}
					onclick={handleSave}
					variant="primary"
					size="sm"
					isDisabled={isSaveDisabled}
				/>
			</HStack>
		</HStack>
	</div>
{/snippet}

{#snippet fieldSelector()}
	<div {...editPopoverFieldSelectorAttrs()}>
		<Selector
			label={t('@astryx.powersearch.editor.field')}
			isLabelHidden
			options={fieldOptions}
			value={partialFilter.field}
			onChange={handleFieldChange}
			isDisabled={isReadOnly}
			size="md"
		/>
	</div>
{/snippet}

<!--
	Nested filter editing. Upstream returns early for this branch rather than
	composing one tree, and the two bodies differ in more than the middle: the
	nested one wraps its content in a `VStack`, and its footer has no
	`!isEmptyType` guard. Kept as two branches for that reason.

	Both branches hang `onkeydown` on a bare `<div>` with no role and no
	`tabIndex`, relying on the event bubbling up from a focused input — upstream's
	shape, and an a11y gap on both sides, since a keyboard user who has focused
	nothing inside the popover cannot press Escape. It needs no `svelte-ignore`:
	the static-element-interaction rule fires on pointer handlers, not on
	`onkeydown` alone, so silencing it here would be an unused directive.
-->
{#if isNestedType}
	<div {...editPopoverContainerAttrs()} onkeydown={handleKeyDown}>
		<div {...editPopoverContentAttrs()}>
			<VStack gap={2}>
				<HStack gap={2}>
					{@render fieldSelector()}
				</HStack>
				<NestedEditor
					{config}
					{partialFilter}
					{operatorOptions}
					onOperatorChange={handleOperatorChange}
					onPartialFilterChange={(filter) => {
						partialFilter = filter;
					}}
					{isReadOnly}
				/>
			</VStack>
		</div>
		{@render footer()}
	</div>
{:else}
	<div {...editPopoverContainerAttrs()} onkeydown={handleKeyDown}>
		<div {...editPopoverContentAttrs()}>
			<HStack gap={2} xstyle={editPopoverChipRowStyle}>
				{@render fieldSelector()}
				{#if showOperatorSelector && operatorOptions.length > 0}
					<div {...editPopoverOperatorSelectorAttrs()}>
						<Selector
							label={t('@astryx.powersearch.editor.operator')}
							isLabelHidden
							options={operatorOptions}
							value={partialFilter.operator}
							onChange={handleOperatorChange}
							isDisabled={isReadOnly}
							size="md"
						/>
					</div>
				{/if}
				{#if operatorValue && !isEmptyType}
					<div bind:this={valueEditorEl} {...editPopoverValueEditorAttrs()}>
						<PowerSearchValueEditor
							{operatorValue}
							filterValue={partialFilter.value}
							onChange={handleValueChange}
							onEnter={handleSave}
							{config}
							isDisabled={isReadOnly}
						/>
					</div>
				{/if}
			</HStack>
		</div>
		{#if !isEmptyType}
			{@render footer()}
		{/if}
	</div>
{/if}
