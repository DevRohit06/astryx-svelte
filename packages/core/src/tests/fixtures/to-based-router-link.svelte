<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Upstream's `ToBasedRouterLink` — a mock router link that reads `to` rather
	 * than `href` (React Router / TanStack behaviour), driving its `href` from the
	 * injected `to` alias and echoing it as `data-to`.
	 */
	const { to, children, ...rest }: { to?: string; children: Snippet; [key: string]: unknown } =
		$props();
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a href={to} data-router-link data-to={to} {...rest}>{@render children()}</a>
