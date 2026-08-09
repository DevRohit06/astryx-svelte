<script lang="ts" module>
	import type { SearchSource } from '../../../typeahead/types.js';
	import type {
		EntityListOperatorValue,
		StringListOperatorValue
	} from '../../../power-search/types.js';

	export interface StringListFilterControlProps {
		columnKey: string;
		header: string;
		operatorValue: StringListOperatorValue | EntityListOperatorValue;
		size: 'sm' | 'md';
		hasClear?: boolean;
	}

	/**
	 * Used when the operator declares no search source: any typed text becomes a
	 * tag. Upstream builds this inside a `useMemo(…, [])` — a constant with an
	 * empty dependency list, so it lifts to module scope with no behaviour change
	 * and no hook.
	 */
	const fallbackSource: SearchSource = {
		search: async (query: string) =>
			query.trim() ? [{ id: query.trim(), label: query.trim() }] : [],
		bootstrap: () => []
	};
</script>

<script lang="ts">
	import Tokenizer from '../../../tokenizer/tokenizer.svelte';
	import type { SearchableItem } from '../../../typeahead/types.js';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';

	/**
	 * Internal — upstream's `StringListFilterControl`, for the `string_list` and
	 * `entity_list` operators.
	 *
	 * `Tokenizer.onChange` takes a second `change` argument here that React's does
	 * not; upstream ignores everything but the items, so the handler does too.
	 */
	let { columnKey, header, operatorValue, size, hasClear }: StringListFilterControlProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived((config().filters[columnKey] as string[] | undefined) ?? []);

	// Use the operator's search source if provided, otherwise fall back
	// to a simple static source that accepts any typed text as a new tag.
	const searchSource = $derived(operatorValue.searchSource ?? fallbackSource);

	const items = $derived(value.map((v) => ({ id: v, label: v })));
</script>

<Tokenizer
	label={t('@astryx.tableFiltering.filterByColumn', { header })}
	isLabelHidden
	{searchSource}
	value={items}
	onChange={(newItems: SearchableItem[]) => {
		const newValues = newItems.map((item) => item.id);
		config().onFilterChange(columnKey, newValues.length > 0 ? newValues : null);
	}}
	{size}
	{hasClear}
/>
