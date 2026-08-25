<script lang="ts" module>
	export interface LayerFamiliesLightboxInRequiredProps {
		onLightboxChange: (isOpen: boolean) => void;
		onDialogChange: (isOpen: boolean) => void;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import Lightbox from '$lib/components/lightbox/lightbox.svelte';

	/**
	 * Upstream's `<Dialog purpose="required">Choose one<Lightbox …/></Dialog>` —
	 * the shape the shared stack exists for, since the Dialog underneath swallows
	 * every press that reaches it. The nesting is component content, so it needs
	 * a fixture.
	 */
	const { onLightboxChange, onDialogChange }: LayerFamiliesLightboxInRequiredProps = $props();

	const media = { src: '/photo.jpg', alt: 'A photo' };
</script>

<Dialog isOpen={true} onOpenChange={onDialogChange} purpose="required" aria-label="Required">
	Choose one
	<Lightbox isOpen={true} onOpenChange={onLightboxChange} {media} />
</Dialog>
