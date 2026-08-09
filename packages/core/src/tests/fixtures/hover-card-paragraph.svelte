<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';

	/**
	 * Upstream's paragraph tree, verbatim:
	 * `<p>Before <HoverCard content={<span>Card content</span>}>
	 * <a href="#trigger">Trigger</a></HoverCard> after</p>`.
	 *
	 * Kept separate from `hover-card-fixture.svelte` because the `<p>` is the
	 * point of these cases — the layer must stay phrasing content so the HTML
	 * parser does not reparent it out of the paragraph.
	 */
	interface Props {
		/** Text rendered inside the card. */
		contentText?: string;
	}

	const { contentText = 'Card content' }: Props = $props();
</script>

{#snippet content()}<span>{contentText}</span>{/snippet}

<p>Before <HoverCard {content}><a href="#trigger">Trigger</a></HoverCard> after</p>
