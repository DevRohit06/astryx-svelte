<!--
	Ported from upstream's `templates/blocks/components/Lightbox/LightboxZoom.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Lightbox, Thumbnail } from '@astryx-svelte/core';

	/**
	 * Upstream's `Thumbnail.onClick` is `onclick` here: the port keeps upstream's
	 * casing only for callback fields that never reach an element (a
	 * `TreeListItemData.onClick`), and lowercases the ones that land on a real DOM
	 * node — the convention `Item`/`Link`/`ListItem`/`Token` and six others share.
	 */

	let isOpen = $state(false);
</script>

<Thumbnail
	src="https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png"
	alt="Coastal shoreline with ocean waves"
	label="Coastal shoreline with ocean waves"
	onclick={() => (isOpen = true)}
/>
<Lightbox
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
	media={{
		src: 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png',
		alt: 'Coastal shoreline with ocean waves',
		caption: 'A scenic coastline. Double-click to zoom in and drag to pan.'
	}}
	hasZoom
/>
