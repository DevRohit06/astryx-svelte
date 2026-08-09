<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TopNavRenderMode } from './top-nav-render-context.svelte.js';

	export interface TopNavRenderScopeProps {
		/** The render mode to publish to the wrapped subtree. */
		mode: TopNavRenderMode;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setTopNavRenderMode } from './top-nav-render-context.svelte.js';

	/**
	 * Internal — publishes `TopNavRenderContext` to a subtree.
	 *
	 * The component boundary Svelte needs where React writes
	 * `<TopNavRenderContext value="drawer">`. Renders no element of its own.
	 *
	 * `AppShell` is its only consumer, and it wraps two copies of the same
	 * `TopNav` at once below the breakpoint — one in `mobile-bar` mode for the
	 * header, one in `drawer` mode for the overlay. Not exported: upstream's
	 * public seam is the context object plus `useTopNavRenderMode`, both of which
	 * this port ships.
	 */
	let { mode, children }: TopNavRenderScopeProps = $props();

	setTopNavRenderMode(() => mode);
</script>

{@render children()}
