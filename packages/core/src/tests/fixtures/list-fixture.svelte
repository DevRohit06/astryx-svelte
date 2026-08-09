<script lang="ts" module>
	/** One item's spec. `props` reaches `ListItem`; the rest fill its snippets. */
	export interface ListFixtureItem {
		props: Record<string, unknown>;
		/** `startContent` — a span carrying this text and testid. */
		start?: { testid: string; text: string };
		/** `endContent` — a span carrying this text and testid. */
		end?: { testid: string; text: string };
		/** `endContent` — a real `<button>`, for the nested-interactive cases. */
		endButton?: { label: string; onclick: () => void };
		/** `description` as rich content rather than a string. */
		richDescription?: boolean;
	}
</script>

<script lang="ts">
	import List from '$lib/components/list/list.svelte';
	import ListItem from '$lib/components/list/list-item.svelte';

	/**
	 * `<List>` with `<ListItem>` children, driven by data.
	 *
	 * Upstream's cases write the items as JSX children with inline
	 * `startContent`/`endContent`/`description` elements. A Svelte snippet can
	 * only be authored in a template, so the items become a spec array and this
	 * fixture is the template that turns each entry back into markup.
	 */
	interface Props {
		/** Props for the `<List>` itself. */
		list?: Record<string, unknown>;
		/** `header`, rendered as `<span>{headerText}</span>` as upstream's cases do. */
		headerText?: string;
		items: ListFixtureItem[];
	}

	const { list = {}, headerText, items }: Props = $props();
</script>

{#snippet header()}
	<span>{headerText}</span>
{/snippet}

{#snippet richDescription()}
	<div><span>Rich</span> <span>description</span></div>
{/snippet}

<List {...list} header={headerText != null ? header : undefined}>
	{#each items as item (item.props['data-testid'] ?? item.props.label)}
		{#snippet startContent()}
			<span data-testid={item.start?.testid}>{item.start?.text}</span>
		{/snippet}
		{#snippet endContent()}
			{#if item.endButton}
				<button type="button" onclick={item.endButton.onclick}>{item.endButton.label}</button>
			{:else}
				<span data-testid={item.end?.testid}>{item.end?.text}</span>
			{/if}
		{/snippet}
		<ListItem
			{...item.props}
			label={item.props.label as string}
			description={item.richDescription
				? richDescription
				: (item.props.description as string | undefined)}
			startContent={item.start ? startContent : undefined}
			endContent={item.end || item.endButton ? endContent : undefined}
		/>
	{/each}
</List>
