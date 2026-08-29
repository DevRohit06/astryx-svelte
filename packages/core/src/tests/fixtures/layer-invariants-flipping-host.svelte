<script lang="ts">
	import Modal from './layer-invariants-modal.svelte';

	/**
	 * Upstream's local `FlippingHost`: a modal whose `purpose` — and therefore
	 * whose `escapeBehavior` — flips while it is open, with a second modal
	 * already opened over it.
	 */
	let purpose = $state<'required' | undefined>(undefined);
</script>

<Modal label="Host" {purpose} />
<Modal label="Later" />
<button type="button" onclick={() => (purpose = 'required')}>make required</button>
