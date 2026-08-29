<script lang="ts" module>
	export interface LayerFamiliesRequiredDialogProps {
		onDialogChange: (isOpen: boolean) => void;
		onLightboxChange?: (isOpen: boolean) => void;
		/** Renders a Lightbox opened *before* the Dialog, so it sits underneath. */
		hasLightboxBelow?: boolean;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import Lightbox from '$lib/components/lightbox/lightbox.svelte';

	/**
	 * Upstream's two `required Dialog` trees: the Dialog on its own, and the same
	 * Dialog with a Lightbox already open under it. `hasLightboxBelow` mounts
	 * exactly what upstream's second JSX fragment adds.
	 */
	const {
		onDialogChange,
		onLightboxChange,
		hasLightboxBelow = false
	}: LayerFamiliesRequiredDialogProps = $props();

	const media = { src: '/photo.jpg', alt: 'A photo' };

	const noop = (): void => {};
</script>

{#if hasLightboxBelow}
	<Lightbox isOpen={true} onOpenChange={onLightboxChange ?? noop} {media} />
{/if}
<Dialog isOpen={true} onOpenChange={onDialogChange} purpose="required" aria-label="Required">
	Choose one
</Dialog>
