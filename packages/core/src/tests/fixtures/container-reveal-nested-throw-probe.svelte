<script lang="ts">
	import { useContainerReveal } from '$lib/hooks/use-container-reveal.svelte.js';
	import ThrowingProbe from './container-reveal-throwing-probe.svelte';

	/**
	 * An outer reveal container holding one that throws.
	 *
	 * Two slots are claimed and *neither* is returned: the throw unwinds the whole
	 * render, so the ancestor's `onDestroy` is skipped along with the nested one's.
	 * That is what makes a single failed request cost more than one slot, and why
	 * the reset drops the whole free list rather than trying to attribute strands.
	 */
	const reveal = useContainerReveal();
</script>

<div data-marker={reveal.getContainerProps().class}>
	<ThrowingProbe />
</div>
