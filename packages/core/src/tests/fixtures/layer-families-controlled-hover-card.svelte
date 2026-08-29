<script lang="ts" module>
	export interface LayerFamiliesControlledHoverCardProps {
		onCardChange: (isOpen: boolean) => void;
		onDialogChange: (isOpen: boolean) => void;
		/** Upstream's card body: `Pinned card`, or `Stuck card` for the last case. */
		cardText?: string;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';

	/**
	 * Upstream's controlled-HoverCard tree: a card held open by its consumer,
	 * inside a Dialog. Both the trigger and the card body are snippets here, so
	 * neither can be written in a `render()` props object.
	 */
	const {
		onCardChange,
		onDialogChange,
		cardText = 'Pinned card'
	}: LayerFamiliesControlledHoverCardProps = $props();
</script>

{#snippet content()}<span>{cardText}</span>{/snippet}

<Dialog isOpen={true} onOpenChange={onDialogChange} aria-label="Host">
	<HoverCard isOpen={true} onOpenChange={onCardChange} {content}>
		<button type="button">Trigger</button>
	</HoverCard>
</Dialog>
