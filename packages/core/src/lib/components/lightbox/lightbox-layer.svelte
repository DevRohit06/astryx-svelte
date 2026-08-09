<script lang="ts" module>
	import type { UseLightboxReturn } from './use-lightbox.svelte.js';

	/**
	 * As with `LayerProps`, `TooltipLayerProps` and `KeyboardHintLayerProps`,
	 * upstream has no counterpart name: `element` is a value on the hook's
	 * return, not a component, so there is nothing there for a props type to
	 * describe.
	 */
	export interface LightboxLayerProps {
		/** The value returned by `useLightbox`. */
		lightbox: UseLightboxReturn;
	}
</script>

<script lang="ts">
	import Lightbox from './lightbox.svelte';

	/**
	 * The rendering half of `useLightbox`, replacing upstream's `element`.
	 *
	 * Note `onOpenChange` only handles `false` — upstream's `element` ignores a
	 * `true`, so the lightbox can never re-open itself through this path; only
	 * `open()` opens it.
	 */
	const { lightbox }: LightboxLayerProps = $props();

	// `media` is owned by the hook's options; the rest pass through to `Lightbox`
	// exactly as upstream spreads `...lightboxProps`.
	const options = $derived(lightbox.options);
	const media = $derived(options.media);
	const rest = $derived.by(() => {
		const { media: _media, ...others } = options;
		return others;
	});
</script>

<!--
	`{...rest}` goes last, as upstream spreads `{...lightboxProps}` last. The
	option type `Omit`s `isOpen`/`onOpenChange`/`media`/`index`/`defaultIndex`/
	`onIndexChange`, so a type-legal caller cannot reach the props above it
	either way — but the order is upstream's, so it is kept.
-->
<Lightbox
	isOpen={lightbox.isOpen}
	onOpenChange={(nextOpen) => {
		if (!nextOpen) {
			lightbox.close();
		}
	}}
	{media}
	index={lightbox.index}
	onIndexChange={(next) => lightbox.setIndex(next)}
	{...rest}
/>
