<script lang="ts" module>
	export interface TextFilterControlProps {
		columnKey: string;
		header: string;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}
</script>

<script lang="ts">
	import TextInput from '../../../text-input/text-input.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `TextFilterControl`. Renders the `string` operator's
	 * control and reads/writes the filter state through the plugin's context, as
	 * upstream reads it from `FilterStoreContext`.
	 */
	let { columnKey, header, size, hasClear }: TextFilterControlProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey]);
	const strValue = $derived(typeof value === 'string' ? value : '');
</script>

<TextInput
	label={t('@astryx.tableFiltering.filterByColumn', { header })}
	isLabelHidden
	value={strValue}
	onChange={(newValue: string) => {
		config().onFilterChange(columnKey, newValue === '' ? null : newValue);
	}}
	placeholder={t('@astryx.tableFiltering.filterByColumn', { header })}
	{size}
	{hasClear}
/>
