<script lang="ts" module>
	export interface DateFilterControlProps {
		columnKey: string;
		header: string;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import DateInput from '../../../date-input/date-input.svelte';
	import type { ISODateString } from '../../../../utils/date-types.js';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `DateFilterControl`, for the `date_absolute` operator.
	 *
	 * The cast to `ISODateString` is upstream's: `TableFilterValue` has no date
	 * branch, so a date filter is carried as a `string` and narrowed at the one
	 * place that knows what it is. Our `ISODateString` is a template-literal type
	 * where upstream's is the same, so the assertion is the same assertion.
	 */
	let { columnKey, header, size, hasClear }: DateFilterControlProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey] as string | undefined);
</script>

<DateInput
	label={t('@astryx.tableFiltering.filterByColumn', { header })}
	isLabelHidden
	value={(value as ISODateString | undefined) ?? undefined}
	onChange={(newValue) => {
		config().onFilterChange(columnKey, newValue ?? null);
	}}
	{size}
	{hasClear}
/>
