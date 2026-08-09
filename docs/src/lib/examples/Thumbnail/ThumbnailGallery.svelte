<!--
	Ported from upstream's `templates/blocks/components/Thumbnail/ThumbnailGallery.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Thumbnail } from '@astryx-svelte/core';
	import { GOLDEN_SUNSET, MISTY_VALLEY, NIGHT_FOREST, SNOWY_PEAKS } from './thumbnail-images.js';

	const ATTACHMENTS = [
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

	let selected = $state<string | null>(null);
	let items = $state(ATTACHMENTS);
</script>

<Stack direction="vertical" gap={3}>
	<Text type="supporting" color="secondary">Click to preview, dismiss to remove</Text>
	<Stack direction="horizontal" gap={2} vAlign="center">
		{#each items as item (item.id)}
			<Thumbnail
				src={item.src}
				alt={item.alt}
				label={item.label}
				onclick={() => (selected = item.label)}
				onRemove={() => (items = items.filter((i) => i.id !== item.id))}
			/>
		{/each}
	</Stack>
	{#if selected}
		<Text type="supporting" color="secondary">Selected: {selected}</Text>
	{/if}
</Stack>
