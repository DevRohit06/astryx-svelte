<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface TopNavMobileContentScopeProps {
		/**
		 * Extra drawer content for the wrapped `TopNav` to render below its own
		 * items — in practice, the `SideNav` in `drawer-content` mode.
		 */
		content?: Snippet;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setTopNavMobileContent } from './top-nav-mobile-content-context.svelte.js';

	/**
	 * Internal — publishes `TopNavMobileContentContext` to a subtree.
	 *
	 * The component boundary Svelte needs where React writes
	 * `<TopNavMobileContentContext value={…}>`. Renders no element of its own.
	 *
	 * This is the seam that keeps a shell with *both* navs from opening two
	 * drawers: `AppShell` hands the SideNav content down, and `TopNav` renders it
	 * inside the one `MobileNav` it owns. `TopNav` also reads the context's mere
	 * presence to decide whether to show its hamburger, so passing `undefined`
	 * here is meaningfully different from passing a snippet that renders nothing.
	 */
	let { content, children }: TopNavMobileContentScopeProps = $props();

	setTopNavMobileContent(() => content);
</script>

{@render children()}
