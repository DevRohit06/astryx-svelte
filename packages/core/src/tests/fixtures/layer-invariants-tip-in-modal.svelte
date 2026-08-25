<script lang="ts" module>
	export interface LayerInvariantsTipInModalProps {
		isTipShowing: () => boolean;
		onTipDismiss: () => void;
	}
</script>

<script lang="ts">
	import Modal from './layer-invariants-modal.svelte';
	import TipLayer from './layer-invariants-tip-layer.svelte';

	/**
	 * Upstream's `<Modal label="Host"><TipLayer /></Modal>`. The tip has to sit
	 * inside the modal's content for the tree to report it as the deeper layer,
	 * so it is a child component rather than a hook call in this fixture's own
	 * script — a hook called here would register at this fixture's depth.
	 */
	const { isTipShowing, onTipDismiss }: LayerInvariantsTipInModalProps = $props();
</script>

<Modal label="Host">
	<TipLayer isPresent={isTipShowing} onDismiss={onTipDismiss} />
</Modal>
