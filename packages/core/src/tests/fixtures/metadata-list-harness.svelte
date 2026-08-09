<script lang="ts">
	import MetadataList from '$lib/components/metadata-list/metadata-list.svelte';
	import MetadataListItem from '$lib/components/metadata-list/metadata-list-item.svelte';
	import type { MetadataListProps } from '$lib/components/metadata-list/metadata-list.svelte';

	/**
	 * A `MetadataList` over a list of `[label, value]` pairs.
	 *
	 * React's cases write the items inline as JSX children; the equivalent here
	 * is a fixture, since a case cannot author a snippet. The two optional slots
	 * are passed as `undefined` when they are off rather than as empty snippets —
	 * an empty snippet is still a snippet, and the components branch on whether
	 * the slot was provided at all.
	 */
	interface Props extends Omit<MetadataListProps, 'children' | 'title'> {
		items: [label: string, value: string][];
		hasTitle?: boolean;
		/** Label of the item that should render an icon. */
		iconOn?: string;
	}

	const { items, hasTitle = false, iconOn, ...rest }: Props = $props();
</script>

{#snippet titleContent()}
	<h3>Details</h3>
{/snippet}

{#snippet iconContent()}
	<span data-testid="test-icon">*</span>
{/snippet}

<MetadataList {...rest} title={hasTitle ? titleContent : undefined}>
	{#each items as [label, value] (label)}
		<MetadataListItem {label} icon={iconOn === label ? iconContent : undefined}>
			{value}
		</MetadataListItem>
	{/each}
</MetadataList>
