<script lang="ts" module>
	export interface CarouselFixtureItem {
		text: string;
		testid?: string;
	}
</script>

<script lang="ts">
	import Carousel from '$lib/components/carousel/carousel.svelte';
	import type { CarouselHandle } from '$lib/components/carousel/carousel.svelte';

	/**
	 * `<Carousel>` driven by data.
	 *
	 * The port takes `items` + an `item` snippet where upstream takes children and
	 * wraps each with `Children.map` — a snippet cannot be mapped over. The
	 * fixture supplies the snippet upstream's cases write inline.
	 *
	 * It is also the parent that holds the imperative handle. Upstream reaches it
	 * through a `handleRef` prop and `createRef`; this port publishes the five
	 * methods as instance exports, so `bind:this` is the seam and `handle()`
	 * re-exposes them where upstream's cases hold `handle.current` — the
	 * `chat-composer-input-probe` arrangement.
	 */
	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		items: CarouselFixtureItem[];
	}

	const { props = {}, items }: Props = $props();

	let carousel = $state<CarouselHandle | null>(null);

	export function handle(): CarouselHandle {
		if (carousel == null) {
			throw new Error('Carousel has not mounted');
		}
		return carousel;
	}
</script>

{#snippet item(entry: CarouselFixtureItem)}
	<div data-testid={entry.testid}>{entry.text}</div>
{/snippet}

<Carousel bind:this={carousel} {...props} {items} {item} />
