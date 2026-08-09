<script lang="ts" module>
	import type { CustomOperatorValue, FilterValue } from './types.js';

	export interface CustomEditorProps {
		operatorValue: CustomOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue) => void;
		isDisabled?: boolean;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/**
	 * Ported from `CustomEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * `operatorValue.Editor` is a component *constructor* on both sides — a
	 * `ComponentType<P>` upstream, a `Component<P>` here (the translation
	 * `types.ts` settled) — so it is instantiated, not rendered as a snippet.
	 * Svelte's dynamic-component form is a capitalised local binding, which is
	 * why `Editor` is pulled out of the operator value before the markup.
	 *
	 * This is the **only** editor the dispatcher forwards `isDisabled` to.
	 */

	const { operatorValue, filterValue, onChange, isDisabled }: CustomEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(filterValue?.type === 'custom' ? filterValue.value : null);

	const Editor = $derived(operatorValue.Editor);
</script>

<Editor
	{isDisabled}
	onChange={(value) => {
		if (value != null) {
			onChange({ type: 'custom', value });
		}
	}}
	placeholder={t('@astryx.powersearch.valueEditor.enterValuePlaceholder')}
	value={currentValue}
/>
