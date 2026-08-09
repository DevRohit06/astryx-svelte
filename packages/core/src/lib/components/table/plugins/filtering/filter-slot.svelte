<script lang="ts" module>
	import type { OperatorValue } from '../../../power-search/types.js';

	export interface FilterSlotProps {
		columnKey: string;
		header: string;
		operatorValue: OperatorValue;
	}
</script>

<script lang="ts">
	import PopoverFilterTrigger from './popover-filter-trigger.svelte';
	import { filterAfterPopoverAttrs } from './filtering.stylex.js';

	/**
	 * Internal — upstream's `FilterSlot`. The `popover` variant's header-cell
	 * content: the funnel trigger for one column.
	 *
	 * Upstream's comment explains why the slot components are stable *types* with
	 * their dynamic data in context — React keeps the same fiber and no remount
	 * occurs when filter state updates. Here `columnKey`/`header`/`operatorValue`
	 * arrive as props through the hook's **keyed** slot binder (they are per-cell
	 * data, which no context can carry), and the filter *state* still comes from
	 * context. The keying is what buys the same property: one bound snippet per
	 * column key means `{@render}` keeps its branch and only these props change,
	 * so the component is updated rather than re-created. An unkeyed binding would
	 * hand `{@render}` a new function identity per transform and lose exactly what
	 * upstream's note is protecting.
	 */
	let { columnKey, header, operatorValue }: FilterSlotProps = $props();

	const wrapper = filterAfterPopoverAttrs();
</script>

<div class={wrapper.class} style={wrapper.style}>
	<PopoverFilterTrigger {columnKey} {header} {operatorValue} />
</div>
