<script lang="ts">
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';

	/**
	 * Upstream's focus-restore `Harness`: an opener beside the sheet, and a Done
	 * button inside it, so a case can watch focus travel out and back.
	 */
	let isOpen = $state(false);
</script>

<button type="button" onclick={() => (isOpen = true)}>Open sheet</button>
<BottomSheet {isOpen} onOpenChange={(next) => (isOpen = next)} label="Filters">
	<button type="button" onclick={() => (isOpen = false)}>Done</button>
</BottomSheet>
