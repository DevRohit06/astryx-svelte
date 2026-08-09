<!--
	Ported from upstream's `templates/blocks/components/Lightbox/LightboxShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Lightbox } from '@astryx-svelte/core';

	let isOpen = $state(false);
</script>

<button onclick={() => (isOpen = true)}>View image</button>
<Lightbox
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
	media={{
		src: 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png',
		alt: 'Coastal shoreline with ocean waves',
		caption: 'A scenic coastline with waves rolling onto a sandy beach beneath a clear sky.'
	}}
/>
