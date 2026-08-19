<script lang="ts">
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';

	/**
	 * Upstream's `Flow`: two sheets in one switcher, with a button in each that
	 * hands off to the other. The suite's handoff, scrim, focus-restore and
	 * rapid-navigation cases all drive this one shape.
	 */
	let activeSheet = $state<string | null>(null);
</script>

<button type="button" onclick={() => (activeSheet = 'details')}>Start flow</button>
<BottomSheetSwitcher {activeSheet} onActiveSheetChange={(id) => (activeSheet = id)}>
	<BottomSheet sheetId="details" label="Details" data-testid="details-sheet">
		<button type="button" onclick={() => (activeSheet = 'confirm')}>Continue</button>
	</BottomSheet>
	<BottomSheet sheetId="confirm" label="Confirm" data-testid="confirm-sheet">
		<button type="button" onclick={() => (activeSheet = 'details')}>Back</button>
	</BottomSheet>
</BottomSheetSwitcher>
