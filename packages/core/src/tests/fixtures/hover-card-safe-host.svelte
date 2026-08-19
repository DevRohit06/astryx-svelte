<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';

	/**
	 * Upstream's safe-host tree: a card whose parent needs no correction, followed
	 * by another control. The following button is the assertion's anchor — the
	 * container must mount at the layer's own position, immediately before it.
	 */
	interface Props {
		/** Hover-open delay, in ms. */
		delay?: number;
	}

	const { delay }: Props = $props();
</script>

{#snippet content()}<div>Block card content</div>{/snippet}

<HoverCard {content} {delay}><button type="button">Trigger</button></HoverCard>
<button type="button">Following control</button>
