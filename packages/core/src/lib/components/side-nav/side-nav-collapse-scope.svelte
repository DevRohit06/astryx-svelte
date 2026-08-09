<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SideNavCollapseState } from './side-nav-collapse-context.svelte.js';

	export interface SideNavCollapseScopeProps {
		/** The collapse state to publish to the wrapped subtree. */
		state: SideNavCollapseState;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setSideNavCollapseContext } from './side-nav-collapse-context.svelte.js';

	/**
	 * Internal — publishes `SideNavCollapseContext` to a subtree.
	 *
	 * React scopes a context to part of a tree by wrapping that part in
	 * `<SideNavCollapseContext value={…}>`. Svelte sets context at *component*
	 * init, so scoping needs a component boundary: this is that boundary and
	 * nothing more, rendering no element of its own.
	 *
	 * `SideNav` uses it to publish its live collapse state, and `SideNavItem` uses
	 * it to pin the state back to expanded around the children it shows inside a
	 * collapsed item's flyout.
	 *
	 * Not exported — upstream has no counterpart component for it to be named
	 * after, and its context object is barrel-private on both sides.
	 */
	let { state, children }: SideNavCollapseScopeProps = $props();

	setSideNavCollapseContext(() => state);
</script>

{@render children()}
