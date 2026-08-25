<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LayerEscapeBehavior } from '$lib/components/layer/layer-stack.js';

	export interface DismissalLayerProps {
		onDismiss: () => void;
		behavior?: LayerEscapeBehavior;
		isEnabled?: boolean;
		isActive?: boolean;
		isPresent?: () => boolean;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import LayerDepthProvider from '$lib/components/layer/layer-depth-provider.svelte';
	import { useLayerDismissal } from '$lib/components/layer/use-layer-dismissal.svelte.js';

	/**
	 * Upstream's local `Layer` component from `Layer/useLayerDismissal.test.tsx`
	 * — a layer that registers itself and renders its children one level deeper.
	 *
	 * A fixture rather than an inline component because the content it wraps is a
	 * snippet, which cannot be authored in a `render()` props object.
	 *
	 * `containerRef` becomes `bind:this`; `getContainer` still reads it lazily, so
	 * the stack sees the element the layer is built around at press time.
	 */
	const {
		onDismiss,
		behavior = 'close',
		isEnabled = true,
		isActive = true,
		isPresent,
		children
	}: DismissalLayerProps = $props();

	let container = $state<HTMLDivElement | null>(null);

	useLayerDismissal(() => ({
		isActive,
		onDismiss,
		escapeBehavior: behavior,
		isEnabled,
		isPresent,
		getContainer: () => container
	}));
</script>

<div bind:this={container}>
	<LayerDepthProvider>{@render children?.()}</LayerDepthProvider>
</div>
