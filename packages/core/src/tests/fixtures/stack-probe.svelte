<script lang="ts">
	import type { Component } from 'svelte';

	/**
	 * Renders one of the Stack family with children.
	 *
	 * Upstream writes its children inline — `<Stack><div>Item 1</div><div>Item
	 * 2</div></Stack>` — and a Svelte snippet can only be authored in a template,
	 * so a component is the smallest thing that can hand one over.
	 * `createRawSnippet` cannot stand in for the multi-child cases: it renders
	 * exactly one root element and warns on anything else.
	 *
	 * `items` becomes one `<div>` per entry (upstream's `<div>Item 1</div>` form)
	 * and `text` is the bare-text child form (`<StackItem>Content</StackItem>`).
	 */
	interface Props {
		// `any` rather than a concrete props type: assignability for a component
		// is contravariant in its props, so the only type that accepts *every*
		// component is the one that is assignable to all of them.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		/** The target's own props, including any attachment key. */
		rest?: Record<string | symbol, unknown>;
		/** One `<div>` child per entry. */
		items?: string[];
		/** A single text child, when `items` is not given. */
		text?: string;
	}

	const { component: Target, rest = {}, items, text }: Props = $props();
</script>

<Target {...rest}>
	{#if items}
		{#each items as item (item)}
			<div>{item}</div>
		{/each}
	{:else}
		{text}
	{/if}
</Target>
