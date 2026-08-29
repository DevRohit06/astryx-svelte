<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface LayerDepthProviderProps {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { setLayerDepthContext, useLayerDepth } from './layer-depth-context.js';

	/**
	 * Wrap a layer's content so any layer opened from inside it registers as
	 * nested, ported from Astryx's `LayerDepthProvider` in
	 * `Layer/LayerDepthContext.tsx`.
	 *
	 * Takes no depth prop on purpose: it reads the ambient depth and adds one, so
	 * nesting composes without anyone tracking absolute numbers.
	 *
	 * Renders no DOM element — it is a context boundary only, which is why it
	 * takes no `xstyle`/`ref`. Upstream exposes no props interface for the same
	 * reason; this port declares one because every component here does, and its
	 * only member is the content it wraps.
	 *
	 * @example
	 * ```svelte
	 * <LayerDepthProvider>
	 *   {@render children()}
	 * </LayerDepthProvider>
	 * ```
	 */
	const { children }: LayerDepthProviderProps = $props();

	// Read before the write, as upstream's `use(LayerDepthContext)` reads the
	// value it is about to shadow: Svelte's context map includes a component's
	// own writes, so a read after `setLayerDepthContext` would find this
	// provider's own getter and recurse.
	const parentDepth = useLayerDepth();

	setLayerDepthContext(() => parentDepth() + 1);
</script>

{@render children?.()}
