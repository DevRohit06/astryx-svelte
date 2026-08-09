<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import FilterSlot from './filter-slot.svelte';
	import InlineFilterSlot from './inline-filter-slot.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';
	import type { OperatorValue } from '../../../power-search/types.js';

	/** What `filterAfter` needs in order to render one header's funnel trigger. */
	export interface FilterAfterArg {
		/** Whatever a prior plugin already put in the `after` slot. */
		prior?: Snippet;
		columnKey: string;
		header: string;
		operatorValue: OperatorValue;
	}

	/** What `filterBelow` needs in order to render one header's inline control. */
	export interface FilterBelowArg {
		/** Whatever a prior plugin already put in the `below` slot. */
		prior?: Snippet;
		columnKey: string;
		header: string;
		/** `undefined` when the column declares no resolvable filter — a placeholder. */
		operatorValue: OperatorValue | undefined;
	}

	/**
	 * The filtering plugin's two markup slots.
	 *
	 * Both are bound per header cell through `createSlotBinder`, keyed by
	 * `column.key`: upstream writes
	 * `after: <>{props.after}<FilterSlot columnKey=… header=… operatorValue=… /></>`
	 * and the `below` equivalent, closing over the column *and* over the content
	 * the slot already held. That is per-cell data, which no context can carry —
	 * the case `internal/bind-snippet.ts` exists for; see its header for why the
	 * argument is read through `unwrapSlotArg` and why it must be an object.
	 *
	 * The hook keeps a **separate binder per snippet**, and the keying matters
	 * here more than anywhere: `{@render}` branches on the bound snippet's
	 * function identity, so an unkeyed binding would tear down and rebuild the
	 * filter input on every keystroke, taking its focus and caret with it.
	 *
	 * The fragment that renders `props.after` before the new content is upstream's
	 * `<>…</>` verbatim: a plugin never overwrites a prior plugin's slot content.
	 *
	 * The component's own default export is an empty component and is never used.
	 */
	export { filterAfter, filterBelow };
</script>

{#snippet filterAfter(arg: FilterAfterArg | (() => FilterAfterArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.prior}{@render a.prior()}{/if}
	<FilterSlot columnKey={a.columnKey} header={a.header} operatorValue={a.operatorValue} />
{/snippet}

{#snippet filterBelow(arg: FilterBelowArg | (() => FilterBelowArg))}
	{@const a = unwrapSlotArg(arg)}
	{#if a.prior}{@render a.prior()}{/if}
	<InlineFilterSlot columnKey={a.columnKey} header={a.header} operatorValue={a.operatorValue} />
{/snippet}
