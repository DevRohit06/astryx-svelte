<script lang="ts" module>
	import type { FilterValue, FloatOperatorValue } from './types.js';

	export interface FloatEditorProps {
		operatorValue: FloatOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
	}
</script>

<script lang="ts">
	import NumberInput from '../number-input/number-input.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/**
	 * Ported from `FloatEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 * Identical to `IntegerEditor` but for the emitted `type` and the absent
	 * `isIntegerOnly` — upstream keeps them as two components and so does this.
	 */

	const { operatorValue, filterValue, onChange }: FloatEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(filterValue?.type === 'float' ? filterValue.value : undefined);
</script>

<NumberInput
	label={t('@astryx.powersearch.valueEditor.value')}
	isLabelHidden
	value={currentValue ?? null}
	onChange={(value: number) => {
		onChange({ type: 'float', value });
	}}
	min={operatorValue.minValue}
	max={operatorValue.maxValue}
	units={operatorValue.units}
	placeholder={t('@astryx.powersearch.valueEditor.enterNumberPlaceholder')}
/>
