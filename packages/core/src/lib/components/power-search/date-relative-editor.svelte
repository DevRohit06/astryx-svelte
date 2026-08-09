<script lang="ts" module>
	import type { DateRelativeOperatorValue, FilterValue } from './types.js';

	export interface DateRelativeEditorProps {
		operatorValue: DateRelativeOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue, shouldSave?: boolean) => void;
	}
</script>

<script lang="ts">
	import Selector from '../selector/selector.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/**
	 * Ported from `DateRelativeEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * The option table is generated, not authored, and its labels are **not
	 * translated** — upstream builds `` `${amount} ${unit} ago` `` in English
	 * while every other string in the file goes through `t()`. Transcribed as-is;
	 * translating them here would invent 24 catalog keys upstream does not have.
	 *
	 * One of the three editors that pass `shouldSave = true`, so choosing an
	 * option applies the filter without a further click on Apply.
	 */

	const { operatorValue, filterValue, onChange }: DateRelativeEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(
		filterValue?.type === 'date_relative' ? filterValue.value : undefined
	);

	const options = $derived.by(() => {
		const result: { value: string; label: string }[] = [];
		const units = [
			{ unit: 'day', plural: 'days' },
			{ unit: 'week', plural: 'weeks' },
			{ unit: 'month', plural: 'months' }
		];
		for (const { unit, plural } of units) {
			const amounts =
				unit === 'day' ? [1, 3, 7, 14, 30] : unit === 'week' ? [1, 2, 4] : [1, 3, 6, 12];
			for (const amount of amounts) {
				if (operatorValue.isPastAllowed !== false) {
					result.push({
						value: `${amount}${unit[0]}_ago`,
						label: `${amount} ${amount === 1 ? unit : plural} ago`
					});
				}
				if (operatorValue.isFutureAllowed !== false) {
					result.push({
						value: `${amount}${unit[0]}_from_now`,
						label: `${amount} ${amount === 1 ? unit : plural} from now`
					});
				}
			}
		}
		return result;
	});
</script>

<Selector
	label={t('@astryx.powersearch.valueEditor.relativeDate')}
	isLabelHidden
	{options}
	value={currentValue}
	onChange={(value: string) => {
		onChange({ type: 'date_relative', value }, true);
	}}
/>
