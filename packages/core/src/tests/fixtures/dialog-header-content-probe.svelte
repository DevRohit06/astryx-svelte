<script lang="ts">
	import DialogHeader from '$lib/components/dialog/dialog-header.svelte';

	/**
	 * Renders `DialogHeader` with `startContent`/`endContent` filled by snippets —
	 * upstream passes those as inline JSX elements (`<button>Back</button>`), and a
	 * Svelte snippet has to be authored in a template. A snippet is passed only
	 * when its label is set, so the header's own `{#if startContent}` wrappers
	 * behave exactly as when the prop is absent.
	 */
	interface Props {
		title: string;
		onOpenChange?: (isOpen: boolean) => unknown;
		startLabel?: string;
		endLabel?: string;
	}

	const { title, onOpenChange, startLabel, endLabel }: Props = $props();
</script>

{#snippet start()}
	<button type="button">{startLabel}</button>
{/snippet}

{#snippet end()}
	<button type="button">{endLabel}</button>
{/snippet}

<DialogHeader
	{title}
	{onOpenChange}
	startContent={startLabel ? start : undefined}
	endContent={endLabel ? end : undefined}
/>
