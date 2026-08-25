<script lang="ts" module>
	import type { FilterValue, StringListOperatorValue } from './types.js';

	export interface StringListEditorProps {
		operatorValue: StringListOperatorValue;
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
	 * Ported from `StringListEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * Upstream's two `useMemo`s become `$derived`. The fallback source is hoisted
	 * to a module constant rather than allocated per derivation: upstream's memo
	 * keys on `[operatorValue.searchSource]`, so the stub it returns is stable
	 * for as long as the operator is, and a shared frozen object says that more
	 * plainly than a fresh literal would.
	 */

	const { operatorValue, filterValue, onChange, maxMenuItems }: StringListEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived.by<SearchableItem[]>(() => {
		if (filterValue?.type !== 'string_list') {
			return [];
		}
		return filterValue.value.map((v) => ({ id: v, label: v }));
	});

	const source = $derived(operatorValue.searchSource ?? emptySearchSource);

	// Enable creatable mode when no searchSource is provided (free-text tags)
	// or when isArbitraryStringAllowed is explicitly set (#1107).
	const hasCreate = $derived(operatorValue.isArbitraryStringAllowed || !operatorValue.searchSource);
</script>

<Tokenizer
	label={t('@astryx.powersearch.valueEditor.values')}
	isLabelHidden
	searchSource={source}
	value={currentValue}
	onChange={(items) => {
		onChange({
			type: 'string_list',
			value: items.map((item) => item.label)
		});
	}}
	placeholder={t('@astryx.powersearch.valueEditor.addValuesPlaceholder')}
	debounceMs={operatorValue.searchSource ? 150 : 0}
	{hasCreate}
	{maxMenuItems}
/>
