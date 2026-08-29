<script lang="ts" module>
	export interface LayerInvariantsTipLayerProps {
		isPresent: () => boolean;
		onDismiss: () => void;
	}
</script>

<script lang="ts">
	import { useLayerDismissal } from '$lib/components/layer/use-layer-dismissal.svelte.js';

	/**
	 * Upstream's local `TipLayer`: a layer registered for its whole lifetime that
	 * answers presence at press time, the way the hover families do. Renders
	 * nothing, as upstream's `return null` does.
	 */
	const { isPresent, onDismiss }: LayerInvariantsTipLayerProps = $props();

	useLayerDismissal(() => ({ isActive: true, isPresent, onDismiss }));
</script>
