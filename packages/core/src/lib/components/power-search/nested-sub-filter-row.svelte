<script lang="ts" module>
	import type { EditablePartialFilter } from './editable-filter.js';
	import type { InternalConfig } from './use-internal-config.svelte.js';

	export interface NestedSubFilterRowProps {
		config: InternalConfig;
		subFilter: EditablePartialFilter;
		onChange: (subFilter: EditablePartialFilter) => void;
		isReadOnly: boolean;
	}
</script>

<script lang="ts">
	import HStack from '../stack/hstack.svelte';
	import { editPopoverChipRowStyle } from './power-search-edit-popover.stylex.js';
	import Selector from '../selector/selector.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		editPopoverNestedFieldSelectorAttrs,
		editPopoverNestedOperatorSelectorAttrs,
		editPopoverNestedRowValueEditorAttrs
	} from './power-search-edit-popover.stylex.js';
	import PowerSearchValueEditor from './power-search-value-editor.svelte';
	import { resolveOperatorLabel } from './resolve-operator-label.js';
	import type { FilterValue, OperatorValue } from './types.js';

	/**
	 * Ported from `NestedSubFilterRow` in Astryx's `PowerSearchEditPopover.tsx`.
	 *
	 * One row of a nested filter group: field selector, operator selector, value
	 * editor. Upstream's three `useCallback`s become plain functions — their
	 * identities are not read by anything, since this component is rendered
	 * through a keyed bound snippet whose identity is stable by construction.
	 */

	const { config, subFilter, onChange, isReadOnly }: NestedSubFilterRowProps = $props();

	const t = useTranslator();

	const fieldOptions = $derived(
		config.getVisibleFields().map((field) => ({
			value: field.key,
			label: field.label
		}))
	);

	const operatorOptions = $derived(
		config.getVisibleOperators(subFilter.field).map((op) => ({
			value: op.key,
			label: resolveOperatorLabel(op, t)
		}))
	);

	const currentOperator = $derived(
		subFilter.operator ? config.getOperator(subFilter.field, subFilter.operator) : undefined
	);

	const operatorValue = $derived<OperatorValue | undefined>(currentOperator?.value);
	const isEmptyType = $derived(operatorValue?.type === 'empty');
	const isNestedType = $derived(operatorValue?.type === 'nested');

	function handleFieldChange(fieldKey: string): void {
		const defaultOp = config.getDefaultOperator(fieldKey);
		const newOp = defaultOp ? config.getOperator(fieldKey, defaultOp.key) : undefined;
		onChange({
			field: fieldKey,
			operator: defaultOp?.key,
			value: undefined,
			_subFilters: newOp?.value.type === 'nested' ? [] : undefined
		});
	}

	function handleOperatorChange(operatorKey: string): void {
		const newOp = config.getOperator(subFilter.field, operatorKey);
		const oldOp = currentOperator;
		const keepValue = newOp && oldOp && newOp.value.type === oldOp.value.type;
		onChange({
			...subFilter,
			operator: operatorKey,
			value: keepValue ? subFilter.value : undefined,
			_subFilters: newOp?.value.type === 'nested' ? (subFilter._subFilters ?? []) : undefined
		});
	}

	function handleValueChange(value: FilterValue): void {
		onChange({ ...subFilter, value });
	}
</script>

<HStack gap={2} vAlign="center" xstyle={editPopoverChipRowStyle}>
	<div {...editPopoverNestedFieldSelectorAttrs()}>
		<Selector
			label={t('@astryx.powersearch.editor.field')}
			isLabelHidden
			options={fieldOptions}
			value={subFilter.field}
			onChange={handleFieldChange}
			isDisabled={isReadOnly}
			size="md"
		/>
	</div>
	{#if operatorOptions.length > 0}
		<div {...editPopoverNestedOperatorSelectorAttrs()}>
			<Selector
				label={t('@astryx.powersearch.editor.operator')}
				isLabelHidden
				options={operatorOptions}
				value={subFilter.operator}
				onChange={handleOperatorChange}
				isDisabled={isReadOnly}
				size="md"
			/>
		</div>
	{/if}
	{#if operatorValue && !isEmptyType && !isNestedType}
		<div {...editPopoverNestedRowValueEditorAttrs()}>
			<PowerSearchValueEditor
				{operatorValue}
				filterValue={subFilter.value}
				onChange={handleValueChange}
				{config}
				isDisabled={isReadOnly}
			/>
		</div>
	{/if}
</HStack>
