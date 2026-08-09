<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SideNavRenderMode } from './side-nav-render-context.svelte.js';

	export interface SideNavRenderScopeProps {
		/** The render mode to publish to the wrapped subtree. */
		mode: SideNavRenderMode;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setSideNavRenderMode } from './side-nav-render-context.svelte.js';

	/**
	 * Internal — publishes `SideNavRenderContext` to a subtree.
	 *
	 * React scopes a context to part of a tree by wrapping that part in
	 * `<SideNavRenderContext value="drawer">`. Svelte sets context at *component*
	 * init, so scoping needs a component boundary: this is that boundary and
	 * nothing more, rendering no element of its own.
	 *
	 * `AppShell` is its only consumer, and it needs all three non-default modes —
	 * `topbar`, `drawer` and `drawer-content` — sometimes for two copies of the
	 * same `SideNav` at once. Not exported: upstream's public seam is the context
	 * object plus `useSideNavRenderMode`, both of which this port ships.
	 */
	let { mode, children }: SideNavRenderScopeProps = $props();

	setSideNavRenderMode(() => mode);
</script>

{@render children()}
