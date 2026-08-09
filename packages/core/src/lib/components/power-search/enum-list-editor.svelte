<script lang="ts" module>
	import type { EnumListOperatorValue, FilterValue } from './types.js';

	export interface EnumListEditorProps {
		operatorValue: EnumListOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
	}
</script>

<script lang="ts">
	import Tokenizer from '../tokenizer/tokenizer.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { createStaticSource, enumItemsToSearchableItems } from './value-editor-helpers.js';
	import type { SearchableItem } from '../typeahead/types.js';

	/**
	 * Ported from `EnumListEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * Note the emitted value is `item.id`, not `item.label` — the tokenizer
	 * carries enum *labels* for display and the filter stores enum *values*.
	 * `StringListEditor`, whose items are their own labels, maps `.label`
	 * instead; the asymmetry is upstream's and is deliberate on both sides.
	 */

	const { operatorValue, filterValue, onChange }: EnumListEditorProps = $props();

	const t = useTranslator();

	const items = $derived(enumItemsToSearchableItems(operatorValue.values));

	const source = $derived(createStaticSource(items));

	const currentValue = $derived.by<SearchableItem[]>(() => {
		if (filterValue?.type !== 'enum_list') {
			return [];
		}
		return filterValue.value.map((v) => {
			const item = operatorValue.values.find((e) => e.value === v);
			return { id: v, label: item?.label ?? v };
		});
	});
</script>

<Tokenizer
	label={t('@astryx.powersearch.valueEditor.values')}
	isLabelHidden
	searchSource={source}
	value={currentValue}
	onChange={(selectedItems) => {
		onChange({
			type: 'enum_list',
			value: selectedItems.map((item) => item.id)
		});
	}}
	placeholder={t('@astryx.powersearch.valueEditor.selectValuesPlaceholder')}
	hasEntriesOnFocus
	debounceMs={0}
/>
