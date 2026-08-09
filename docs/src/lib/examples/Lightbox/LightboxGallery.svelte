<!--
	Ported from upstream's `templates/blocks/components/Lightbox/LightboxGallery.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Grid, LightboxLayer, Thumbnail, useLightbox } from '@astryx-svelte/core';

	const PHOTOS = [
		{
			src: 'https://lookaside.facebook.com/assets/astryx/Neutral-Backpack.png',
			alt: 'Backpack',
			caption: 'A backpack displayed on a neutral background.'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/building.png',
			alt: 'Modern building',
			caption: 'A modern building with a contemporary architectural design.'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png',
			alt: 'Coastal shoreline with ocean waves',
			caption: 'A scenic coastline with waves rolling onto a sandy beach beneath a clear sky.'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-1.png',
			alt: 'Illustrated lakeside landscape at sunset',
			caption:
				'A stylized landscape illustration featuring pink clouds reflected over a calm lake at sunset.'
		}
	];

	/**
	 * `useLightbox` takes its options as a getter and its rendering half is a
	 * component, because a Svelte hook cannot return markup: upstream's
	 * `lightbox.element` is `<LightboxLayer {lightbox} />` here. Both are this
	 * port's standing shapes (TODO.md).
	 *
	 * `Thumbnail.onClick` is likewise `onclick` here — the port lowercases the
	 * callback props that land on a real DOM node, keeping upstream's casing only
	 * for fields that never reach an element.
	 */
	const lightbox = useLightbox(() => ({ media: PHOTOS }));
</script>

<Grid columns={2} gap={2} style="width: 136px">
	{#each PHOTOS as photo, i (photo.src)}
		<Thumbnail src={photo.src} alt={photo.alt} label={photo.alt} onclick={() => lightbox.open(i)} />
	{/each}
</Grid>
<LightboxLayer {lightbox} />
