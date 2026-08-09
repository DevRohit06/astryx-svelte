<!--
	Ported from upstream's `templates/blocks/components/AspectRatio/AspectRatioImageGallery.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Center, Grid } from '@astryx-svelte/core';

	const images = [
		{ id: 1, alt: 'Mountain landscape' },
		{ id: 2, alt: 'Ocean sunset' },
		{ id: 3, alt: 'Forest trail' },
		{ id: 4, alt: 'City skyline' },
		{ id: 5, alt: 'Desert dunes' },
		{ id: 6, alt: 'Snowy peaks' }
	];
</script>

<!--
	Anchor a definite width so the grid renders in shrink-to-fit contexts
	(e.g. the docsite example preview, which wraps blocks in a
	`min-width: fit-content` container). Without a fixed-width ancestor,
	the `width="100%"` grid collapses to zero — AspectRatio positions its
	child absolutely, so it has no intrinsic width to size the grid from.
-->
<Center width={600}>
	<Grid columns={3} gap={4} width="100%">
		{#each images as image (image.id)}
			<AspectRatio ratio={4 / 3} fit="cover">
				<img
					src="https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-1.png"
					alt={image.alt}
					style="border-radius: 8px"
				/>
			</AspectRatio>
		{/each}
	</Grid>
</Center>
