<script lang="ts" module>
	import type { EnumOperatorValue } from '../../../power-search/types.js';

	export interface SelectorFilterControlProps {
		columnKey: string;
		header: string;
		operatorValue: EnumOperatorValue;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import Selector from '../../../selector/selector.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `SelectorFilterControl`, for the `enum` operator.
	 *
	 * As with `NumberFilterControl`, the two-branch render is upstream's:
	 * `SelectorProps` is discriminated on `hasClear`, and only the clearable arm
	 * takes `value: string | null`. `useCallback` has no counterpart.
	 *
	 * Note the option list drops `EnumItem.icon`, exactly as upstream's
	 * `values.map(v => ({value: v.value, label: v.label}))` does.
	 */
	let { columnKey, header, operatorValue, size, hasClear }: SelectorFilterControlProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey]);
	const strValue = $derived(typeof value === 'string' ? value : '');

	const options = $derived(
		operatorValue.values.map((v) => ({
			value: v.value,
			label: v.label
		}))
	);

	function handleChange(newValue: string | null): void {
		config().onFilterChange(columnKey, newValue === '' || newValue == null ? null : newValue);
	}
</script>

{#if hasClear}
	<Selector
		label={t('@astryx.tableFiltering.filterByColumn', { header })}
		isLabelHidden
		{options}
		value={strValue || null}
		onChange={handleChange}
		placeholder={t('@astryx.table.filter.allPlaceholder')}
		{size}
		hasClear
	/>
{:else}
	<Selector
		label={t('@astryx.tableFiltering.filterByColumn', { header })}
		isLabelHidden
		{options}
		value={strValue}
		onChange={handleChange}
		placeholder={t('@astryx.table.filter.allPlaceholder')}
		{size}
	/>
{/if}
