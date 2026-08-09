<!--
	Ported from upstream's `templates/blocks/components/AspectRatio/AspectRatioWidescreen.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Center } from '@astryx-svelte/core';
</script>

<Center width={600}>
	<AspectRatio ratio={16 / 9} fit="cover">
		<img
			src="https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png"
			alt="16:9 widescreen"
		/>
	</AspectRatio>
</Center>
