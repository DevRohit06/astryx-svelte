<script lang="ts">
	import type { TopNavRenderMode } from '$lib/components/top-nav/top-nav-render-context.svelte.js';
	import { setTopNavRenderMode } from '$lib/components/top-nav/top-nav-render-context.svelte.js';
	import TopNavItem from '$lib/components/top-nav/top-nav-item.svelte';

	/**
	 * `<TopNavItem>` under a chosen render mode.
	 *
	 * Upstream writes `<TopNavRenderContext value="drawer">` around the item; a
	 * test file cannot set context, so the mode is a prop here and the fixture
	 * calls `setTopNavRenderMode` at its own init — which is the only place a
	 * Svelte context can be written.
	 */
	interface Props {
		mode: TopNavRenderMode;
		/** Props for `<TopNavItem>` itself. */
		props: Record<string, unknown>;
	}

	const { mode, props }: Props = $props();

	setTopNavRenderMode(() => mode);
</script>

<TopNavItem {...props} label={props.label as string} />
