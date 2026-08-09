<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Upstream's `AnotherLink` — a second distinguishable custom link. */
	const { children, ...rest }: { children: Snippet; [key: string]: unknown } = $props();
</script>

<a data-another-link {...rest}>{@render children()}</a>
