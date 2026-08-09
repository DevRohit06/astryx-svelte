<script lang="ts">
	import {
		useContainerReveal,
		type UseContainerRevealOptions,
		type UseContainerRevealReturn
	} from '$lib/hooks/use-container-reveal.svelte.js';

	/**
	 * `renderHook`'s stand-in for `useContainerReveal`. The hook claims its pool
	 * slot during component init and releases it on destroy, so a component is
	 * the only place it can run at all.
	 *
	 * Two things the probe does that `result.current` cannot: it exposes the
	 * return as an instance export (upstream reads `result.current` the same
	 * way), *and* it spreads both getters onto real elements — which is the thing
	 * a caller actually does, and proves `{class, style}` survives the spread.
	 *
	 * `options` is left undefined by most cases so the hook's own default
	 * parameter is exercised, exactly as upstream's `useContainerReveal()` does.
	 */
	interface Props {
		options?: () => UseContainerRevealOptions;
	}

	const { options }: Props = $props();

	// Forwarded by reference on purpose: the hook reads the getter once, at init,
	// so re-reading the prop would change nothing. No case rebinds it.
	// svelte-ignore state_referenced_locally
	export const reveal: UseContainerRevealReturn = useContainerReveal(options);
</script>

<!-- `data-marker` mirrors the container class so the SSR suite can read it out of
     a markup string without depending on how the spread orders attributes. -->
<div
	data-reveal-container
	data-marker={reveal.getContainerProps().class}
	{...reveal.getContainerProps()}
>
	<span data-reveal-content {...reveal.getContentRevealProps()}></span>
</div>
