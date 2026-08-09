<script lang="ts" module>
	import type { FilterValue, TimeOperatorValue } from './types.js';

	export interface TimeEditorProps {
		operatorValue: TimeOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
	}
</script>

<script lang="ts">
	import TimeInput from '../time-input/time-input.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import type { ISOTimeString } from '../../utils/index.js';

	/** Ported from `TimeEditor` in Astryx's `PowerSearchValueEditor.tsx`. */

	const { operatorValue, filterValue, onChange }: TimeEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(
		filterValue?.type === 'time' ? (filterValue.value as ISOTimeString) : undefined
	);
</script>

<TimeInput
	label={t('@astryx.powersearch.valueEditor.time')}
	isLabelHidden
	value={currentValue}
	onChange={(value) => {
		if (value != null) {
			onChange({ type: 'time', value });
		}
	}}
	min={operatorValue.minValue as ISOTimeString | undefined}
	max={operatorValue.maxValue as ISOTimeString | undefined}
/>
