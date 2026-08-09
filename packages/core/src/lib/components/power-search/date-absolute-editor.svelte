<script lang="ts" module>
	import type { DateAbsoluteOperatorValue, FilterValue } from './types.js';

	export interface DateAbsoluteEditorProps {
		operatorValue: DateAbsoluteOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
	}
</script>

<script lang="ts">
	import DateInput from '../date-input/date-input.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import type { ISODateString } from '../../utils/date-types.js';

	/**
	 * Ported from `DateAbsoluteEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * **`operatorValue` is declared and never read**, upstream included — the
	 * parameter is destructured out of the props type but the body never touches
	 * it, so `DateAbsoluteOperatorValue.isDateOnly` reaches nothing. Kept because
	 * the dispatcher passes it and the prop is part of the shape.
	 */

	const {
		operatorValue: _operatorValue,
		filterValue,
		onChange
	}: DateAbsoluteEditorProps = $props();

	const t = useTranslator();

	// Convert unixSeconds to ISO date string for the date input
	const currentValue = $derived.by(() => {
		if (filterValue?.type !== 'date_absolute') {
			return undefined;
		}
		const date = new Date(filterValue.unixSeconds * 1000);
		return date.toISOString().split('T')[0] as ISODateString;
	});
</script>

<DateInput
	label={t('@astryx.powersearch.valueEditor.date')}
	isLabelHidden
	value={currentValue}
	onChange={(value) => {
		if (value != null) {
			const unixSeconds = Math.floor(new Date(value).getTime() / 1000);
			onChange({ type: 'date_absolute', unixSeconds });
		}
	}}
/>
