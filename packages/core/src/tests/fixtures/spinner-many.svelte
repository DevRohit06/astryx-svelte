<script lang="ts">
	import Spinner from '$lib/components/spinner/spinner.svelte';

	/**
	 * A flat list of `count` spinners, as a fixture because `{#each}` needs a
	 * component to live in.
	 *
	 * Upstream renders five in one React fragment to prove their rings are pinned
	 * to the timeline origin in a *single* frame. One `render()` call per spinner
	 * would not test that: each would flush on its own, and the batch it is
	 * asserting would never form.
	 */
	const { count }: { count: number } = $props();
</script>

{#each Array.from({ length: count }, (_, i) => i) as index (index)}
	<Spinner />
{/each}
