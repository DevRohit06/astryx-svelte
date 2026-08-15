<script lang="ts">
	import Probe from './container-reveal-probe.svelte';

	/**
	 * A flat list of `count` reveal containers, as a fixture because `{#each}`
	 * needs a component to live in.
	 *
	 * Upstream renders 500 of these to prove a large list mounts without a dev
	 * warning — the thing the marker pool could not do, since it had six slots
	 * and warned past them.
	 */
	const { count }: { count: number } = $props();
</script>

{#each Array.from({ length: count }, (_, i) => i) as index (index)}
	<Probe />
{/each}
