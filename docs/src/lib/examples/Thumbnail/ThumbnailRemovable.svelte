<!--
	Ported from upstream's `templates/blocks/components/Thumbnail/ThumbnailRemovable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Thumbnail } from '@astryx-svelte/core';
	import { GOLDEN_SUNSET, MISTY_VALLEY, NIGHT_FOREST, SNOWY_PEAKS } from './thumbnail-images.js';

	const IMAGES = [
		{
			id: 1,
			src: NIGHT_FOREST,
			alt: 'Forest at night under a crescent moon',
			label: 'forest-night.jpg'
		},
		{ id: 2, src: MISTY_VALLEY, alt: 'Misty mountain valley', label: 'misty-valley.jpg' },
		{ id: 3, src: GOLDEN_SUNSET, alt: 'Golden sunset over mountains', label: 'golden-sunset.jpg' },
		{ id: 4, src: SNOWY_PEAKS, alt: 'Snowy mountain peaks', label: 'snowy-peaks.jpg' }
	];

	let items = $state(IMAGES);
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Remove button adapts contrast to image luminance</Text>
	<Stack direction="horizontal" gap={3} vAlign="center">
		{#each items as item (item.id)}
			<Thumbnail
				src={item.src}
				alt={item.alt}
				label={item.label}
				onRemove={() => (items = items.filter((i) => i.id !== item.id))}
			/>
		{/each}
		{#if items.length === 0}
			<Text type="supporting" color="secondary">All removed.</Text>
		{/if}
	</Stack>
</Stack>
