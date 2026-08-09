<script lang="ts">
	import {
		useOverflow,
		type UseOverflowOptions,
		type UseOverflowReturn
	} from '$lib/hooks/use-overflow.svelte.js';

	/**
	 * `renderHook`'s stand-in. Nothing is rendered — upstream's test drives the
	 * ref callbacks directly with mock elements, and an attachment is just a
	 * function of the element, so it can be called the same way.
	 *
	 * `seenCounts` stands in for upstream's render counter. React re-renders the
	 * whole hook when state changes; the Svelte equivalent of "did that cause an
	 * update?" is whether a dependent effect re-ran, so this records every
	 * `visibleCount` an effect has observed.
	 */
	interface Props {
		itemCount: number;
		options?: UseOverflowOptions;
	}

	const { itemCount, options = {} }: Props = $props();

	export const overflow: UseOverflowReturn = useOverflow(
		() => itemCount,
		() => options
	);

	export const seenCounts: number[] = [];

	$effect(() => {
		seenCounts.push(overflow.visibleCount);
	});
</script>
