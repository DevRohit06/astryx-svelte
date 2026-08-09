<script lang="ts">
	import LayoutPanel from '$lib/components/layout/layout-panel.svelte';
	import { useResizable } from '$lib/components/resizable/use-resizable.svelte.js';

	/**
	 * A panel whose width comes from a region, alongside a `width` prop the
	 * region is expected to win over — upstream's `Harness` for the same case.
	 */
	const { defaultSize = 300, width = 100 }: { defaultSize?: number; width?: number } = $props();

	const region = useResizable(() => ({ defaultSize }));
</script>

<LayoutPanel {width} resizable={region.props}>P</LayoutPanel>
