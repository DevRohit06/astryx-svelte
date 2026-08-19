<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';

	/**
	 * Upstream's `CallbackRefFlow`. There the sheet's `ref` alternates between two
	 * callbacks so a parent re-render detaches and re-attaches it; here the
	 * counterpart is two attachments, this port's standing ref translation. Either
	 * way the point is that a handoff already in flight must survive the churn.
	 */
	const attachA: Attachment<HTMLElement> = () => {};
	const attachB: Attachment<HTMLElement> = () => {};

	let activeSheet = $state<string | null>('details');
	let useAlternateRef = $state(false);
</script>

<button type="button" onclick={() => (useAlternateRef = !useAlternateRef)}>Rerender parent</button>
<BottomSheetSwitcher {activeSheet} onActiveSheetChange={(id) => (activeSheet = id)}>
	<BottomSheet
		{@attach useAlternateRef ? attachB : attachA}
		sheetId="details"
		label="Details"
		data-testid="callback-details-sheet"
	>
		<button type="button" onclick={() => (activeSheet = 'confirm')}>
			Continue with callback ref
		</button>
	</BottomSheet>
	<BottomSheet sheetId="confirm" label="Confirm" data-testid="callback-confirm-sheet">
		Confirmation
	</BottomSheet>
</BottomSheetSwitcher>
