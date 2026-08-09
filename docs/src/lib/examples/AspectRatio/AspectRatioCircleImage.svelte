<!--
	Ported from upstream's `templates/blocks/components/AspectRatio/AspectRatioCircleImage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Center } from '@astryx-svelte/core';
</script>

<Center width={300}>
	<AspectRatio ratio={1} shape="ellipse" fit="cover">
		<!--
			Upstream's alt text is "Circular image", which trips Svelte's
			redundant-alt check because screen readers already announce an `<img>`
			as an image. Kept verbatim — the alt is example content, and the page
			shows the block's source — with the warning suppressed rather than the
			text quietly edited. TODO.md records it.
		-->
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src="https://lookaside.facebook.com/assets/astryx/light-home-square-1.png"
			alt="Circular image"
		/>
	</AspectRatio>
</Center>
