<script lang="ts">
	import {
		useLayerDismissal,
		type UseLayerDismissalReturn
	} from '$lib/components/layer/use-layer-dismissal.svelte.js';

	/**
	 * Upstream's local `CloseRequestLayer` — a registered layer plus a field to
	 * compose in, for the close requests that arrive with no keydown to read.
	 *
	 * Upstream reaches the hook's answer through a rendered `<button>` whose
	 * click calls `onAsk(shouldDismissOnCloseRequest())`, because it renders a
	 * component rather than calling `renderHook`. This port has the probe-fixture
	 * substitute instead: the return object is an instance export, reached
	 * through `render(...).component`, so the test calls the same function
	 * directly. Nothing is asserted about the button upstream, so nothing is lost
	 * with it.
	 */
	export const dismissal: UseLayerDismissalReturn = useLayerDismissal(() => ({
		isActive: true,
		onDismiss: () => {}
	}));
</script>

<input aria-label="composing field" />
