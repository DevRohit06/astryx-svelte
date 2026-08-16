<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';

	/**
	 * Upstream's paragraph tree, verbatim:
	 * `<p>Before <HoverCard content={<span>Card content</span>}>
	 * <a href="#trigger">Trigger</a></HoverCard> after</p>`.
	 *
	 * Kept separate from `hover-card-fixture.svelte` because the `<p>` is the
	 * point of these cases — a paragraph is an unsafe host, so the layer has to
	 * be corrected out of it rather than reparented by the HTML parser.
	 */
	interface Props {
		/** Text rendered inside the card. */
		contentText?: string;
		/** Hover-open delay, in ms. */
		delay?: number;
		/** Hover-close delay, in ms. */
		hideDelay?: number;
	}

	const { contentText = 'Card content', delay, hideDelay }: Props = $props();
</script>

{#snippet content()}<span>{contentText}</span>{/snippet}

<p>
	Before <HoverCard {content} {delay} {hideDelay}><a href="#trigger">Trigger</a></HoverCard> after
</p>
