<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface DismissalFlatLayerProps {
		onDismiss: () => void;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { useLayerDismissal } from '$lib/components/layer/use-layer-dismissal.svelte.js';

	/**
	 * Upstream's local `FlatLayer` — a layer that reports no depth, like a bare
	 * focus trap, which renders nothing and so cannot push a depth provider
	 * around its content. Containment is the only nesting signal it has.
	 */
	const { onDismiss, children }: DismissalFlatLayerProps = $props();

	let container = $state<HTMLDivElement | null>(null);

	useLayerDismissal(() => ({
		isActive: true,
		onDismiss,
		getContainer: () => container
	}));
</script>

<div bind:this={container}>{@render children?.()}</div>
