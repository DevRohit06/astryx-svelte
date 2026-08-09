<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Stands in for upstream's `vi.fn` `SpyLink`. Svelte has no way to assert on a
	 * component's received props through a spy, so instead the anchor surfaces the
	 * two props the case cares about — `href` and the injected `to` (as `data-to`)
	 * — for a DOM assertion. Same question as the upstream spy
	 * (`toHaveBeenCalledWith({ href, to })`), read off the rendered element.
	 */
	const { href, to, children }: { href?: string; to?: string; children: Snippet } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a data-testid="spy-link" {href} data-to={to}>{@render children()}</a>
