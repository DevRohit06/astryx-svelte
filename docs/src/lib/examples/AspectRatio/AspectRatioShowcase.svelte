<!--
	Ported from upstream's `templates/blocks/components/AspectRatio/AspectRatioShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, HStack, Text, VStack } from '@astryx-svelte/core';

	const items = [
		{
			ratio: 1,
			label: '1 : 1',
			src: 'https://lookaside.facebook.com/assets/astryx/light-home-square-1.png',
			alt: '1:1 square'
		},
		{
			ratio: 4 / 3,
			label: '4 : 3',
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-1.png',
			alt: '4:3 standard'
		},
		{
			ratio: 16 / 9,
			label: '16 : 9',
			src: 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png',
			alt: '16:9 widescreen'
		}
	];
</script>

<HStack gap={4} vAlign="start">
	{#each items as { ratio, label, src, alt } (label)}
		<VStack gap={2} hAlign="center">
			<AspectRatio
				{ratio}
				fit="cover"
				style="height: 120px; width: auto; border-radius: var(--radius-container)"
			>
				<img {src} {alt} />
			</AspectRatio>
			<Text type="supporting" color="secondary">{label}</Text>
		</VStack>
	{/each}
</HStack>
