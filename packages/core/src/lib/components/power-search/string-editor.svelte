<script lang="ts" module>
	import type { FilterValue, StringOperatorValue } from './types.js';

	export interface StringEditorProps {
		operatorValue: StringOperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue, shouldSave?: boolean) => void;
		onEnter?: () => void;
		maxMenuItems?: number;
	}
</script>

<script lang="ts">
	import TextInput from '../text-input/text-input.svelte';
	import Typeahead from '../typeahead/typeahead.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import type { SearchableItem } from '../typeahead/types.js';

	/**
	 * Ported from `StringEditor` in Astryx's `PowerSearchValueEditor.tsx`.
	 *
	 * A sibling module because Svelte has no in-file component declaration — the
	 * `LinkProvider/RouterLink.svelte` precedent. Upstream declares this and
	 * eleven more editors inside the dispatcher's file.
	 *
	 * **`onEnter` is accepted and never called.** Upstream binds it as `_onEnter`
	 * and no editor invokes it; the popover's Enter handling lives on its own
	 * container `keydown` instead. It stays on the props because
	 * `PowerSearchEditPopover` threads it and the dispatcher forwards it — a
	 * dead channel on both sides, not a port omission.
	 */

	const {
		operatorValue,
		filterValue,
		onChange,
		onEnter: _onEnter,
		maxMenuItems
	}: StringEditorProps = $props();

	const t = useTranslator();

	const currentValue = $derived(filterValue?.type === 'string' ? filterValue.value : '');

	// When a searchSource is provided, render a typeahead instead of a plain
	// text input so users get suggestions (#1103).
	const selectedItem = $derived<SearchableItem | null>(
		currentValue ? { id: currentValue, label: currentValue } : null
	);
</script>

{#if operatorValue.searchSource}
	<Typeahead
		label={t('@astryx.powersearch.valueEditor.value')}
		isLabelHidden
		searchSource={operatorValue.searchSource}
		value={selectedItem}
		onChange={(item) => {
			if (item) {
				onChange({ type: 'string', value: item.label }, true);
			} else {
				onChange({ type: 'string', value: '' });
			}
		}}
		placeholder={t('@astryx.powersearch.valueEditor.searchPlaceholder')}
		debounceMs={150}
		{maxMenuItems}
	/>
{:else}
	<TextInput
		label={t('@astryx.powersearch.valueEditor.value')}
		isLabelHidden
		value={currentValue}
		placeholder={t('@astryx.powersearch.valueEditor.enterValuePlaceholder')}
		onChange={(value: string) => {
			onChange({ type: 'string', value });
		}}
	/>
{/if}
