<script lang="ts" module>
	import type { FilterValue, IntegerOperatorValue } from './types.js';

	export interface IntegerEditorProps {
		operatorValue: IntegerOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
	}
</script>

<script lang="ts">
	import NumberInput from '../number-input/number-input.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/** Ported from `IntegerEditor` in Astryx's `PowerSearchValueEditor.tsx`. */

	const { operatorValue, filterValue, onChange }: IntegerEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(filterValue?.type === 'integer' ? filterValue.value : undefined);
</script>

<NumberInput
	label={t('@astryx.powersearch.valueEditor.value')}
	isLabelHidden
	value={currentValue ?? null}
	onChange={(value: number) => {
		onChange({ type: 'integer', value });
	}}
	min={operatorValue.minValue}
	max={operatorValue.maxValue}
	units={operatorValue.units}
	isIntegerOnly
	placeholder={t('@astryx.powersearch.valueEditor.enterNumberPlaceholder')}
/>
