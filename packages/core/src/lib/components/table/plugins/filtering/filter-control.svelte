<script lang="ts" module>
	import type {
		EntityListOperatorValue,
		EnumListOperatorValue,
		EnumOperatorValue,
		FloatOperatorValue,
		IntegerOperatorValue,
		OperatorValue,
		StringListOperatorValue
	} from '../../../power-search/types.js';

	export interface FilterControlProps {
		columnKey: string;
		header: string;
		operatorValue: OperatorValue;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import DateFilterControl from './date-filter-control.svelte';
	import MultiSelectorFilterControl from './multi-selector-filter-control.svelte';
	import NumberFilterControl from './number-filter-control.svelte';
	import SelectorFilterControl from './selector-filter-control.svelte';
	import StringListFilterControl from './string-list-filter-control.svelte';
	import TextFilterControl from './text-filter-control.svelte';
	import TimeFilterControl from './time-filter-control.svelte';

	/**
	 * Internal — upstream's `FilterControl`. Renders the control matching a
	 * column's operator value type.
	 *
	 * Upstream's `switch` becomes an `{#if}` chain over the same discriminant, in
	 * upstream's order. The five types with no control — `nested`, `empty`,
	 * `date_relative`, `date_range`, `custom` — fall off the end and render
	 * nothing, which is upstream's `return null`.
	 *
	 * The `{@const}` assertions exist because template control flow does not
	 * narrow a `$props()` binding: the discriminant is checked in the guard and
	 * the value re-asserted for the child's narrower prop type. Every assertion is
	 * on the branch its own guard established.
	 */
	let { columnKey, header, operatorValue, size, hasClear }: FilterControlProps = $props();
</script>

{#if operatorValue.type === 'string'}
	<TextFilterControl {columnKey} {header} {size} {hasClear} />
{:else if operatorValue.type === 'integer' || operatorValue.type === 'float'}
	{@const ov = operatorValue as IntegerOperatorValue | FloatOperatorValue}
	<NumberFilterControl {columnKey} {header} operatorValue={ov} {size} {hasClear} />
{:else if operatorValue.type === 'enum'}
	{@const ov = operatorValue as EnumOperatorValue}
	<SelectorFilterControl {columnKey} {header} operatorValue={ov} {size} {hasClear} />
{:else if operatorValue.type === 'enum_list'}
	{@const ov = operatorValue as EnumListOperatorValue}
	<MultiSelectorFilterControl {columnKey} {header} operatorValue={ov} {size} {hasClear} />
{:else if operatorValue.type === 'date_absolute'}
	<DateFilterControl {columnKey} {header} {size} {hasClear} />
{:else if operatorValue.type === 'time'}
	<TimeFilterControl {columnKey} {header} {size} {hasClear} />
{:else if operatorValue.type === 'string_list' || operatorValue.type === 'entity_list'}
	{@const ov = operatorValue as StringListOperatorValue | EntityListOperatorValue}
	<StringListFilterControl {columnKey} {header} operatorValue={ov} {size} {hasClear} />
{/if}
