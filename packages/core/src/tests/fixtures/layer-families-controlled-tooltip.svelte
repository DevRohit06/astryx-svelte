<script lang="ts" module>
	export interface LayerFamiliesControlledTooltipProps {
		onTipChange: (isOpen: boolean) => void;
		onDialogChange: (isOpen: boolean) => void;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import Tooltip from '$lib/components/tooltip/tooltip.svelte';

	/**
	 * Upstream's controlled-Tooltip tree: a tip held open by its consumer, inside
	 * a Dialog. The trigger is component content and therefore a snippet.
	 */
	const { onTipChange, onDialogChange }: LayerFamiliesControlledTooltipProps = $props();
</script>

<Dialog isOpen={true} onOpenChange={onDialogChange} aria-label="Host">
	<Tooltip isOpen={true} onOpenChange={onTipChange} content="Pinned tip">
		<button type="button">Trigger</button>
	</Tooltip>
</Dialog>
