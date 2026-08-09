<script lang="ts">
	import Carousel from '$lib/components/carousel/carousel.svelte';
	import type { CarouselHandle } from '$lib/components/carousel/carousel.svelte';
	import type { CarouselFixtureItem } from './carousel-fixture.svelte';

	/**
	 * A consumer that drives the carousel's imperative handle from an `$effect` —
	 * the literal translation of React's
	 * `useEffect(() => handleRef.current?.scrollNext(), [x])`.
	 *
	 * The point is the run counter: it is a plain `let`, not `$state`, so reading
	 * or writing it tracks nothing and the only thing that can re-run the effect
	 * is a dependency the *handle call itself* registered.
	 */
	interface Props {
		items: CarouselFixtureItem[];
		hasLoop?: boolean;
	}

	const { items, hasLoop = true }: Props = $props();

	let carousel = $state<CarouselHandle | null>(null);
	let runs = 0;

	/** How many times the consumer effect has run. */
	export function getRuns(): number {
		return runs;
	}

	$effect(() => {
		runs += 1;
		carousel?.scrollNext();
	});
</script>

{#snippet item(entry: CarouselFixtureItem)}
	<div data-testid={entry.testid}>{entry.text}</div>
{/snippet}

<Carousel bind:this={carousel} {hasLoop} {items} {item} aria-label="Effect probe" />
