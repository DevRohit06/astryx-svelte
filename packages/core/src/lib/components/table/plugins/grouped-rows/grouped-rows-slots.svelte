<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import GroupHeaderCell from './group-header-cell.svelte';
	import { unwrapSlotArg } from '../../../../internal/bind-snippet.js';

	/** What `groupHeaderRow` needs to render one group-header row's cell. */
	export interface GroupHeaderArg {
		groupKey: string;
		count: number;
		collapsed: boolean;
		toggle: () => void;
		renderGroupHeader?: Snippet<[string, number, boolean]>;
	}

	/**
	 * The group-header row's `children`. Bound per header row through
	 * `createSlotBinder` — it closes over that row's key, count and collapsed
	 * state. The binding is keyed by the row's `__group_<key>` identity so the
	 * bound snippet keeps one function identity per group: `{@render}` branches
	 * on that identity, so an unkeyed binding would replace the chevron button
	 * the toggle was clicked from instead of updating it.
	 */
	export { groupHeaderRow };
</script>

{#snippet groupHeaderRow(arg: GroupHeaderArg | (() => GroupHeaderArg))}
	{@const a = unwrapSlotArg(arg)}
	<GroupHeaderCell
		groupKey={a.groupKey}
		count={a.count}
		collapsed={a.collapsed}
		toggle={a.toggle}
		renderGroupHeader={a.renderGroupHeader}
	/>
{/snippet}
