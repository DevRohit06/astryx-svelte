<!--
	Ported from upstream's `templates/blocks/components/Lightbox/LightboxVideo.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Lightbox } from '@astryx-svelte/core';

	let isOpen = $state(false);
</script>

<Button label="Play video" onclick={() => (isOpen = true)} />
<Lightbox
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
	media={{
		src: 'https://lookaside.facebook.com/assets/?set=astryx&name=Nature-1&density=1',
		alt: 'Flower blooming in time-lapse',
		type: 'video',
		caption: 'A flower blooming in time-lapse'
	}}
/>
