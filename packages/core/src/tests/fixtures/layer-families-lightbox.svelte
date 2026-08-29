<script lang="ts" module>
	export interface LayerFamiliesLightboxProps {
		onLightboxChange: (isOpen: boolean) => void;
		/** Renders upstream's `aria-label="Above"` Dialog after the Lightbox. */
		hasDialogAbove?: boolean;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import Lightbox from '$lib/components/lightbox/lightbox.svelte';

	/**
	 * Upstream's two bare-Lightbox trees from
	 * `Layer/layerDismissalFamilies.test.tsx`: the Lightbox alone, and the
	 * Lightbox with a Dialog opened over it as a sibling. `hasDialogAbove` is the
	 * seam between them, because the second tree is a JSX fragment and a fragment
	 * is component content here.
	 */
	const { onLightboxChange, hasDialogAbove = false }: LayerFamiliesLightboxProps = $props();

	const media = { src: '/photo.jpg', alt: 'A photo' };

	const noop = (): void => {};
</script>

<Lightbox isOpen={true} onOpenChange={onLightboxChange} {media} />
{#if hasDialogAbove}
	<Dialog isOpen={true} onOpenChange={noop} aria-label="Above">Above</Dialog>
{/if}
