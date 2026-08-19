<script lang="ts">
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';

	/**
	 * Upstream's `ModeSwitchFlow`: a flow that drops its scrim mid-life and is
	 * then reopened modally, so the switcher has to capture a fresh focus trigger
	 * rather than restoring to the first one.
	 */
	let activeSheet = $state<string | null>(null);
	let hasScrim = $state(true);
</script>

<button type="button" onclick={() => (activeSheet = 'details')}>Open first modal</button>
<button
	type="button"
	onclick={() => {
		hasScrim = true;
		activeSheet = 'details';
	}}
>
	Open second modal
</button>
<BottomSheetSwitcher {activeSheet} onActiveSheetChange={(id) => (activeSheet = id)} {hasScrim}>
	<BottomSheet sheetId="details" label="Details" data-testid="mode-details-sheet">
		<button type="button" onclick={() => (hasScrim = false)}>Make non-modal</button>
		<button type="button" onclick={() => (activeSheet = null)}>Close flow</button>
	</BottomSheet>
</BottomSheetSwitcher>
