<script lang="ts">
	import Probe from './container-reveal-probe.svelte';

	/**
	 * Upstream renders a fragment of `POOL_SIZE` probes to prove the free-list
	 * hands out that many distinct markers concurrently. Same thing here, as a
	 * fixture because `{#each}` needs a component to live in.
	 */
	const { count }: { count: number } = $props();
</script>

{#each Array.from({ length: count }, (_, i) => i) as index (index)}
	<Probe />
{/each}
