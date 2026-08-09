<script lang="ts">
	import Section from '$lib/components/section/section.svelte';

	/**
	 * Renders a `Section` with children, since a Svelte snippet can only be
	 * authored in a template — React's cases write children inline, but here the
	 * smallest thing that can hand a `Section` its children is a component.
	 *
	 * `props` spread onto the outer `Section` (carrying `class`, `style`, sizing,
	 * rest props and any attachment). Four child shapes cover every upstream case:
	 * plain text, a `<span data-testid>` (the "renders children" case), and a
	 * nested `Section` (the padding-propagation cases), whose own props come from
	 * `nested` and whose body is `nestedText`.
	 */
	interface Props {
		props?: Record<string | symbol, unknown>;
		text?: string;
		childTestid?: string;
		nested?: Record<string | symbol, unknown>;
		nestedText?: string;
	}

	const { props = {}, text, childTestid, nested, nestedText }: Props = $props();
</script>

<Section {...props}>
	{#if nested}
		<Section {...nested}>{nestedText}</Section>
	{:else if childTestid != null}
		<span data-testid={childTestid}>{text}</span>
	{:else}
		{text}
	{/if}
</Section>
