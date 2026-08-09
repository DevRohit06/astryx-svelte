<script lang="ts">
	import { untrack } from 'svelte';
	import { SizeContext, setSizeContext, type ElementSize } from '$lib/internal/contexts.svelte.js';
	import SizeProvider from './size-provider.svelte';
	import SizeProbe from './size-probe.svelte';

	/**
	 * Stands in for upstream's `<SizeProvider value={size}>` wrapper.
	 *
	 * `value` is read through a getter (`() => value`), which is the whole point:
	 * Svelte reads context once at init, so a context holding a plain value would
	 * freeze descendants at mount. Every static case would still pass; only the
	 * "provider value changes" case would catch it.
	 *
	 * `innerValue` self-nests a second provider, as upstream's `Nested` wrapper
	 * does. `raw` writes through `SizeContext.set` directly instead of
	 * `setSizeContext`, standing in for upstream's `SizeProvider === SizeContext.Provider`.
	 */
	interface Props {
		value: ElementSize | null;
		/** When set, nests a second provider inside this one. */
		innerValue?: ElementSize | null;
		/** Write through the exported context object rather than `setSizeContext`. */
		raw?: boolean;
		size?: string;
		fallback?: string;
	}

	const { value, innerValue, raw = false, size, fallback }: Props = $props();

	// `raw` selects the write channel once, at init — it is a fixture switch, not
	// state, so the one-time read is deliberate. `untrack` says so to the compiler.
	if (untrack(() => raw)) {
		SizeContext.set(() => value);
	} else {
		setSizeContext(() => value);
	}
</script>

{#if innerValue !== undefined}
	<SizeProvider value={innerValue} {size} {fallback} />
{:else}
	<SizeProbe {size} {fallback} />
{/if}
