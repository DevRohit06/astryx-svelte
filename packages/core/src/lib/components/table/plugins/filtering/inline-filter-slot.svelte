<script lang="ts" module>
	import type { OperatorValue } from '../../../power-search/types.js';

	export interface InlineFilterSlotProps {
		columnKey: string;
		header: string;
		operatorValue: OperatorValue | undefined;
	}
</script>

<script lang="ts">
	import FilterControl from './filter-control.svelte';
	import { useFilterVariant } from './filter-context.svelte.js';
	import { filterAfterInlineAttrs, filterPlaceholderAttrs } from './filtering.stylex.js';

	/**
	 * Internal — upstream's `InlineFilterSlot`. The `inline`/`inline-compact`
	 * variants' header-cell content: the filter control, or a height-only
	 * placeholder for a column that declares no filter, so the header row stays
	 * aligned. Uses each input's native `hasClear` for clearing.
	 */
	let { columnKey, header, operatorValue }: InlineFilterSlotProps = $props();

	const variant = useFilterVariant();

	const size = 'sm' as const;
	const wrapper = filterAfterInlineAttrs();
	const placeholder = $derived(filterPlaceholderAttrs(variant() === 'inline-compact'));
</script>

<div class={wrapper.class} style={wrapper.style}>
	{#if operatorValue != null}
		<FilterControl {columnKey} {header} {operatorValue} {size} hasClear />
	{:else}
		<div aria-hidden="true" class={placeholder.class} style={placeholder.style}></div>
	{/if}
</div>
