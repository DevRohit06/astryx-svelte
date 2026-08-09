<script lang="ts">
	import type { Snippet } from 'svelte';
	import { TopNavRenderContext } from '@astryx-svelte/core';

	/**
	 * Publishes `'drawer'` to a subtree, standing in for upstream's
	 * `<TopNavRenderContext value="drawer">` in `SharedTopNav.tsx`.
	 *
	 * React reads context at render, so upstream can wrap JSX inline. Svelte reads
	 * it once at component init, so publishing needs a component boundary — the
	 * same shape core's own (unexported) `TopNavRenderScope` takes for `AppShell`.
	 * The context object is public here exactly as it is upstream, so this is a
	 * consumer using the documented seam rather than reaching past it.
	 *
	 * Why it exists at all: the nav items inside our own `MobileNav` drawer must
	 * render as vertical rows, not as the horizontal bar items they are in the
	 * header, and `TopNavItem` decides that from this context.
	 */
	const { children }: { children: Snippet } = $props();

	TopNavRenderContext.set(() => 'drawer');
</script>

{@render children()}
