<script lang="ts">
	import Lightbox from '$lib/components/lightbox/lightbox.svelte';
	import Modal from './layer-invariants-modal.svelte';

	/**
	 * Upstream's local `LightboxInRequired`: a `Lightbox` opened from inside a
	 * `purpose="required"` Dialog, with its own real open state so the census
	 * sees it close.
	 */
	const media = { src: '/photo.jpg', alt: 'A photo' };

	let isLightboxOpen = $state(true);
</script>

<Modal label="Required" purpose="required">
	<Lightbox isOpen={isLightboxOpen} onOpenChange={(open) => (isLightboxOpen = open)} {media} />
</Modal>
