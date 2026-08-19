<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';

	/**
	 * Upstream's wrapping-link tree, verbatim:
	 * `<a href="#profile"><HoverCard content={<span><a href="#inner">Inner
	 * link</a></span>}>Trigger</HoverCard></a>`.
	 *
	 * The point is the `<a>`: an interactive ancestor captures the layer's own
	 * interactions, so the container has to be hosted outside it (#5039).
	 */
	interface Props {
		/** Hover-open delay, in ms. */
		delay?: number;
	}

	const { delay }: Props = $props();
</script>

{#snippet content()}<span><a href="#inner">Inner link</a></span>{/snippet}

<!--
	`children` as a *prop*, not component content: Svelte wraps content in a
	snippet whatever it holds, so this is the only form that reaches `HoverCard`'s
	text branch — which is what upstream's bare `Trigger` string is. Recorded with
	the identical constraint in `hover-card-fixture.svelte`.
-->
<a href="#profile"><HoverCard {content} {delay} children="Trigger" /></a>
