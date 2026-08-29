<script lang="ts" module>
	import type { EntityListOperatorValue, FilterValue, PowerSearchEntity } from './types.js';

	export interface EntityListEditorProps {
		operatorValue: EntityListOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
		maxMenuItems?: number;
	}
</script>

<script lang="ts">
	import Tokenizer from '../tokenizer/tokenizer.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { emptySearchSource } from './value-editor-helpers.js';
	import type { SearchableItem } from '../typeahead/types.js';

	/**
	 * Ported from `EntityListEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * `renderItem` forwards straight through — it is `Snippet<[SearchableItem]>`
	 * here where upstream types it as a `ReactNode`-returning render prop, the
	 * translation already settled in `types.ts` and already the shape
	 * `Tokenizer.renderItem` takes.
	 */

	const { operatorValue, filterValue, onChange, maxMenuItems }: EntityListEditorProps = $props();

	const t = useTranslator();

	const source = $derived(operatorValue.searchSource ?? emptySearchSource);

	// Preserve photo in auxiliaryData so it round-trips through the tokenizer (#1106).
	const currentValue = $derived.by<SearchableItem[]>(() => {
		if (filterValue?.type !== 'entity_list') {
			return [];
		}
		return filterValue.value.map((entity: PowerSearchEntity) => ({
			id: entity.id,
			label: entity.label,
			auxiliaryData: entity.photo ? { photo: entity.photo } : undefined
		}));
	});
</script>

<Tokenizer
	label={t('@astryx.powersearch.valueEditor.entities')}
	isLabelHidden
	searchSource={source}
	value={currentValue}
	onChange={(items) => {
		onChange({
			type: 'entity_list',
			// Round-trip photo from auxiliaryData back to PowerSearchEntity (#1106).
			value: items.map((item) => {
				const aux = item.auxiliaryData as { photo?: string } | undefined;
				return {
					id: item.id,
					label: item.label,
					...(aux?.photo ? { photo: aux.photo } : {})
				};
			})
		});
	}}
	renderItem={operatorValue.renderItem}
	placeholder={t('@astryx.powersearch.valueEditor.searchPlaceholder')}
	debounceMs={operatorValue.searchSource ? 150 : 0}
	{maxMenuItems}
/>
