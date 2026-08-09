<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Upstream's `CustomLink` — a component link that tags its anchor with
	 * `data-custom-link` and spreads every other prop (`href`, the injected `to`,
	 * `data-testid`) straight onto the `<a>`.
	 */
	const { children, ...rest }: { children: Snippet; [key: string]: unknown } = $props();
</script>

<a data-custom-link {...rest}>{@render children()}</a>
