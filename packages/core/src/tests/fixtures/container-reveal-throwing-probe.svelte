<script lang="ts">
	import { useContainerReveal } from '$lib/hooks/use-container-reveal.svelte.js';

	/**
	 * A reveal container whose render **throws** once the pool slot is claimed.
	 *
	 * `useContainerReveal` returns its slot from `onDestroy`, which Svelte runs at
	 * the end of a *completed* server render. A render that throws never reaches
	 * it, so the slot stays claimed for the life of the process — the strand
	 * `scheduleServerPoolReset` exists to collect. This fixture is the only way to
	 * produce that: nothing in the package throws on purpose, and the strand
	 * cannot be reproduced by unmounting.
	 *
	 * The throw sits *after* the hook call, and reads the claim on its way out, so
	 * the slot really is taken first; a component that threw before claiming would
	 * strand nothing and prove nothing. Nothing is rendered — the markup would be
	 * unreachable, and the suite reads markers off the healthy renders instead.
	 */
	const reveal = useContainerReveal();

	throw new Error(
		`container-reveal fixture: deliberate render failure after claiming ${reveal.getContainerProps().class}`
	);
</script>
