<script lang="ts">
	import Layer from '$lib/components/layer/layer.svelte';
	import {
		useLayer,
		type LayerAlignment,
		type LayerPlacement
	} from '$lib/components/layer/use-layer.svelte.js';

	/**
	 * Upstream's three context harnesses in one. `ContextLayerHarness`,
	 * `Harness` and `CustomHarness` differ only in which render props they pass
	 * and whether the trigger carries a `dir`/`style`, so a single fixture with
	 * those as props covers all three — the alternative was three files whose
	 * markup is identical.
	 */
	const {
		positioning,
		placement,
		alignment,
		layerStyle,
		triggerStyle,
		triggerDir
	}: {
		positioning?: 'anchor' | 'custom';
		placement?: LayerPlacement;
		alignment?: LayerAlignment;
		layerStyle?: string;
		triggerStyle?: string;
		triggerDir?: 'ltr' | 'rtl';
	} = $props();

	const id = $props.id();
	const layer = useLayer(() => ({ mode: 'context', id }));
</script>

<button
	type="button"
	{@attach layer.attachTrigger}
	dir={triggerDir}
	style={triggerStyle}
	onclick={() => (layer.isOpen ? layer.hide() : layer.show())}
>
	trigger
</button>
<Layer {layer} {positioning} {placement} {alignment} style={layerStyle}>
	<span>content</span>
</Layer>
