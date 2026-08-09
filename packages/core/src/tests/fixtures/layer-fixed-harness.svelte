<script lang="ts">
	import Layer from '$lib/components/layer/layer.svelte';
	import { useLayer } from '$lib/components/layer/use-layer.svelte.js';

	/**
	 * Upstream's `LayerHarness`/`FixedHarness`. It hands the imperative API back
	 * through an `onReady` callback because a React test has no other way in;
	 * an instance `export const` is what `render(...).component` gives here, so
	 * the layer object itself is the export.
	 */
	const { x = 0, y = 0 }: { x?: number; y?: number } = $props();

	const id = $props.id();
	export const layer = useLayer(() => ({ mode: 'fixed', id }));
</script>

<button type="button" onclick={layer.show}>opener</button>
<Layer {layer} {x} {y}>
	<span>Layer content</span>
</Layer>
