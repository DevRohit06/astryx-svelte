<script lang="ts" module>
	import type { DateRangeOperatorValue, FilterValue } from './types.js';

	export interface DateRangeEditorProps {
		operatorValue: DateRangeOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
	}
</script>

<script lang="ts">
	import DateInput from '../date-input/date-input.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import type { ISODateString } from '../../utils/date-types.js';

	/**
	 * Ported from `DateRangeEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * Two `DateInput`s in a fragment. Each handler rebuilds the whole range,
	 * preserving the *other* end from the current filter value and defaulting it
	 * to `{type: 'NOW'}` when there is none — so editing one end never clears the
	 * other. A cleared field becomes `unixSeconds: 0` rather than being dropped,
	 * which is upstream's choice and visible in the resulting filter.
	 *
	 * **`operatorValue` is declared and never read**, upstream included:
	 * `intervalDatePresets` and `relativeDatePresets` reach nothing.
	 */

	const { operatorValue: _operatorValue, filterValue, onChange }: DateRangeEditorProps = $props();

	const t = useTranslator();

	const startValue = $derived.by(() => {
		if (filterValue?.type !== 'date_range') {
			return undefined;
		}
		const part = filterValue.value.start;
		if (part.type === 'ABSOLUTE') {
			return new Date(part.unixSeconds * 1000).toISOString().split('T')[0] as ISODateString;
		}
		return undefined;
	});

	const endValue = $derived.by(() => {
		if (filterValue?.type !== 'date_range') {
			return undefined;
		}
		const part = filterValue.value.end;
		if (part.type === 'ABSOLUTE') {
			return new Date(part.unixSeconds * 1000).toISOString().split('T')[0] as ISODateString;
		}
		return undefined;
	});

	function handleStartChange(value: string | undefined): void {
		const startUnix = value ? Math.floor(new Date(value).getTime() / 1000) : 0;
		const existingEnd =
			filterValue?.type === 'date_range' ? filterValue.value.end : { type: 'NOW' as const };
		onChange({
			type: 'date_range',
			value: {
				start: { type: 'ABSOLUTE', unixSeconds: startUnix },
				end: existingEnd
			}
		});
	}

	function handleEndChange(value: string | undefined): void {
		const endUnix = value ? Math.floor(new Date(value).getTime() / 1000) : 0;
		const existingStart =
			filterValue?.type === 'date_range' ? filterValue.value.start : { type: 'NOW' as const };
		onChange({
			type: 'date_range',
			value: {
				start: existingStart,
				end: { type: 'ABSOLUTE', unixSeconds: endUnix }
			}
		});
	}
</script>

<DateInput
	label={t('@astryx.powersearch.valueEditor.startDate')}
	isLabelHidden
	value={startValue}
	onChange={handleStartChange}
/>
<DateInput
	label={t('@astryx.powersearch.valueEditor.endDate')}
	isLabelHidden
	value={endValue}
	onChange={handleEndChange}
/>
