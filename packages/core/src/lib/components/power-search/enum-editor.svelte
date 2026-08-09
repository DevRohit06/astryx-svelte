<script lang="ts" module>
	import type { EnumOperatorValue, FilterValue } from './types.js';

	export interface EnumEditorProps {
		operatorValue: EnumOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue, shouldSave?: boolean) => void;
	}
</script>

<script lang="ts">
	import Selector from '../selector/selector.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/**
	 * Ported from `EnumEditor` in Astryx's `PowerSearchValueEditor.tsx`. One of
	 * the three editors that pass `shouldSave = true`.
	 */

	const { operatorValue, filterValue, onChange }: EnumEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(filterValue?.type === 'enum' ? filterValue.value : undefined);

	const options = $derived(
		operatorValue.values.map((item) => ({
			value: item.value,
			label: item.label
		}))
	);
</script>

<Selector
	label={t('@astryx.powersearch.valueEditor.value')}
	isLabelHidden
	{options}
	value={currentValue}
	onChange={(value: string) => {
		onChange({ type: 'enum', value }, true);
	}}
/>
