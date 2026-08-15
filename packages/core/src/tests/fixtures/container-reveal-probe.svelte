<script lang="ts">
	import {
		useContainerReveal,
		type UseContainerRevealOptions,
		type UseContainerRevealReturn
	} from '$lib/hooks/use-container-reveal.svelte.js';

	/**
	 * `renderHook`'s stand-in for `useContainerReveal`.
	 *
	 * Two things the probe does that `result.current` cannot: it exposes the
	 * return as an instance export (upstream reads `result.current` the same
	 * way), *and* it spreads both getters onto real elements — which is the thing
	 * a caller actually does, and proves `{class, style}` survives the spread.
	 *
	 * `options` is left undefined by most cases so the hook's own default
	 * parameter is exercised, exactly as upstream's `useContainerReveal()` does.
	 *
	 * **The getter is now read on every call**, not once at init: upstream 0.4.0
	 * made `isEnabled` take effect after mount, which is what
	 * `rerender({isEnabled})` exercises. Through 0.3.0 it decided a one-time pool
	 * slot claim, so re-reading it would have changed nothing.
	 */
	interface Props {
		options?: () => UseContainerRevealOptions;
	}

	const { options }: Props = $props();

	export const reveal: UseContainerRevealReturn = useContainerReveal(() => options?.() ?? {});
</script>

<div data-reveal-container {...reveal.getContainerProps()}>
	<span data-reveal-content {...reveal.getContentRevealProps()}></span>
</div>
