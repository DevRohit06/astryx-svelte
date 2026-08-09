<script lang="ts" module>
	import type { FloatOperatorValue, IntegerOperatorValue } from '../../../power-search/types.js';

	export interface NumberFilterControlProps {
		columnKey: string;
		header: string;
		operatorValue: IntegerOperatorValue | FloatOperatorValue;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import NumberInput from '../../../number-input/number-input.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `NumberFilterControl`, for the `integer` and `float`
	 * operators.
	 *
	 * The two-branch render is upstream's and is not redundant: `NumberInputProps`
	 * is a union discriminated on `hasClear`, and only the `hasClear: true` arm
	 * accepts an `onChange` that can be handed `null`. React's props type has the
	 * same union for the same reason.
	 *
	 * `useCallback` around `handleChange` has no counterpart — a closure over the
	 * config getter is already stable and already live.
	 */
	let { columnKey, header, operatorValue, size, hasClear }: NumberFilterControlProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey]);
	const numValue = $derived(typeof value === 'number' ? value : null);

	const step = $derived(operatorValue.type === 'integer' ? 1 : null);

	function handleChange(newValue: number | null): void {
		config().onFilterChange(columnKey, newValue);
	}
</script>

{#if hasClear}
	<NumberInput
		label={t('@astryx.tableFiltering.filterByColumn', { header })}
		isLabelHidden
		value={numValue}
		onChange={handleChange}
		placeholder={t('@astryx.tableFiltering.filterByColumn', { header })}
		min={operatorValue.minValue ?? null}
		max={operatorValue.maxValue ?? null}
		{step}
		{size}
		hasClear
	/>
{:else}
	<NumberInput
		label={t('@astryx.tableFiltering.filterByColumn', { header })}
		isLabelHidden
		value={numValue}
		onChange={handleChange}
		placeholder={t('@astryx.tableFiltering.filterByColumn', { header })}
		min={operatorValue.minValue ?? null}
		max={operatorValue.maxValue ?? null}
		{step}
		{size}
	/>
{/if}
