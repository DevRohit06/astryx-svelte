<script lang="ts">
	import Modal from './layer-invariants-modal.svelte';

	/**
	 * Upstream's local `OuterAndInner`: an outer modal holding a control that
	 * closes the inner one, so the inner layer leaves the stack by a route the
	 * stack did not drive.
	 */
	let isInnerOpen = $state(true);
</script>

<Modal label="Outer">
	<button type="button" onclick={() => (isInnerOpen = false)}>close inner</button>
	{#if isInnerOpen}
		<Modal label="Inner" />
	{/if}
</Modal>
