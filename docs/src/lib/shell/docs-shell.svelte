<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The wrapper every `/docs/*` and `/components/*` route sits in.
	 *
	 * It used to own the two-column grid and the sticky sidebar. **Batch 10 moved
	 * both to `AppShell`**, which now supplies the side panel, its sticky
	 * behaviour, the divider, and — below the breakpoint — the mobile drawer that
	 * this version had no counterpart for at all. The sidebar itself is supplied
	 * by `+layout.svelte` and gated on the route there.
	 *
	 * What is left is a pass-through, kept rather than deleted for one reason: it
	 * is the seam the routes import, and removing it would touch every page to
	 * save one element. It renders no DOM of its own.
	 */
	const { children }: { children: Snippet } = $props();
</script>

{@render children()}
