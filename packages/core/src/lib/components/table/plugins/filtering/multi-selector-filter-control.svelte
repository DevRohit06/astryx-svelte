<script lang="ts" module>
	import type { EnumListOperatorValue } from '../../../power-search/types.js';

	export interface MultiSelectorFilterControlProps {
		columnKey: string;
		header: string;
		operatorValue: EnumListOperatorValue;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import MultiSelector from '../../../multi-selector/multi-selector.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `MultiSelectorFilterControl`, for the `enum_list`
	 * operator. `MultiSelectorProps.hasClear` is a plain boolean on both sides, so
	 * this one has no `hasClear` branch.
	 */
	let { columnKey, header, operatorValue, size, hasClear }: MultiSelectorFilterControlProps =
		$props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey]);
	const arrValue = $derived(Array.isArray(value) ? value : []);

	const options = $derived(
		operatorValue.values.map((v) => ({
			value: v.value,
			label: v.label
		}))
	);
</script>

<MultiSelector
	label={t('@astryx.tableFiltering.filterByColumn', { header })}
	isLabelHidden
	{options}
	value={arrValue}
	onChange={(newValue: string[]) => {
		config().onFilterChange(columnKey, newValue.length === 0 ? null : newValue);
	}}
	placeholder={t('@astryx.table.filter.allPlaceholder')}
	{size}
	hasSelectAll
	hasSearch={false}
	{hasClear}
/>
