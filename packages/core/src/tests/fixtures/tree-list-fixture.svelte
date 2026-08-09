<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TreeListItemData } from '$lib/components/tree-list/tree-list-types.js';

	/**
	 * One item's spec. Identical to `TreeListItemData` except that the two snippet
	 * slots are named by string, so a test can describe a whole *tree* as data —
	 * a Svelte snippet can only be authored in a template, and the recursion means
	 * there is no `{#each}` for the test to hang one off.
	 */
	export interface TreeListFixtureItem extends Omit<
		TreeListItemData,
		'children' | 'startContent' | 'endContent'
	> {
		/** Key into the fixture's snippet table, filling `startContent`. */
		startSlot?: 'star';
		/** Key into the fixture's snippet table, filling `endContent`. */
		endSlot?: 'badge';
		children?: TreeListFixtureItem[];
	}

	function withSlots(
		list: TreeListFixtureItem[],
		slots: Record<string, Snippet>
	): TreeListItemData[] {
		return list.map(({ startSlot, endSlot, children, ...item }) => ({
			...item,
			startContent: startSlot != null ? slots[startSlot] : undefined,
			endContent: endSlot != null ? slots[endSlot] : undefined,
			children: children != null ? withSlots(children, slots) : undefined
		}));
	}
</script>

<script lang="ts">
	import TreeList from '$lib/components/tree-list/tree-list.svelte';

	interface Props {
		/** Props for the `<TreeList>` itself. */
		tree?: Record<string, unknown>;
		items: TreeListFixtureItem[];
		/** `header`, rendered as `<span>{headerText}</span>` as upstream's case does. */
		headerText?: string;
	}

	const { tree = {}, items, headerText }: Props = $props();
</script>

{#snippet star()}
	<span data-testid="icon">★</span>
{/snippet}

{#snippet badge()}
	<span data-testid="badge">3</span>
{/snippet}

{#snippet header()}
	<span>{headerText}</span>
{/snippet}

<TreeList
	{...tree}
	items={withSlots(items, { star, badge })}
	header={headerText != null ? header : undefined}
/>
