<script lang="ts">
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';

	/**
	 * Upstream's `ConditionalFlow`: the sheet exists only while it is active, so
	 * closing unmounts it in the same pass and the switcher has to release the
	 * shared modal layer without waiting for an exit that will never run.
	 */
	let activeSheet = $state<string | null>(null);
</script>

<button type="button" onclick={() => (activeSheet = 'details')}>Start conditional flow</button>
<BottomSheetSwitcher {activeSheet} onActiveSheetChange={(id) => (activeSheet = id)}>
	{#if activeSheet != null}
		<BottomSheet sheetId={activeSheet} label="Conditional details">Content</BottomSheet>
	{/if}
</BottomSheetSwitcher>
