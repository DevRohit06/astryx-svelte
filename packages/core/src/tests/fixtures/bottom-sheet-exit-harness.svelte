<script lang="ts">
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import type { BottomSheetSnapPoint } from '$lib/components/bottom-sheet/snap-offsets.js';

	/**
	 * Upstream's `ExitHarness` from `BottomSheet.test.tsx`: a self-closing sheet,
	 * so a case can watch the exit animation of a sheet whose consumer has already
	 * flipped `isOpen` to false.
	 */
	let {
		hasScrim,
		snapPoints
	}: {
		hasScrim?: boolean;
		snapPoints?: ReadonlyArray<BottomSheetSnapPoint>;
	} = $props();

	let isOpen = $state(true);
</script>

<BottomSheet
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
	label="Filters"
	{snapPoints}
	{hasScrim}
>
	<button type="button" onclick={() => (isOpen = false)}>Close sheet</button>
</BottomSheet>
