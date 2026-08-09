<script lang="ts" module>
	export interface TimeFilterControlProps {
		columnKey: string;
		header: string;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import TimeInput from '../../../time-input/time-input.svelte';
	import type { ISOTimeString } from '../../../../utils/time-parser.js';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `TimeFilterControl`, for the `time` operator. The
	 * `ISOTimeString` cast is upstream's, for the reason `DateFilterControl`
	 * records.
	 */
	let { columnKey, header, size, hasClear }: TimeFilterControlProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey] as string | undefined);
</script>

<TimeInput
	label={t('@astryx.tableFiltering.filterByColumn', { header })}
	isLabelHidden
	value={(value as ISOTimeString | undefined) ?? undefined}
	onChange={(newValue) => {
		config().onFilterChange(columnKey, newValue ?? null);
	}}
	{size}
	{hasClear}
/>
