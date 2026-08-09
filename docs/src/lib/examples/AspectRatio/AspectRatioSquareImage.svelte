<!--
	Ported from upstream's `templates/blocks/components/AspectRatio/AspectRatioSquareImage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Center } from '@astryx-svelte/core';
</script>

<Center width={300}>
	<AspectRatio ratio={1} fit="cover">
		<img
			src="https://lookaside.facebook.com/assets/astryx/light-home-square-1.png"
			alt="1:1 square"
		/>
	</AspectRatio>
</Center>
