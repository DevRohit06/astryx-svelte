<script lang="ts">
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';

	/**
	 * Upstream's `NestedStandaloneSheetFlow`: a sheet written inside a switcher
	 * item's content. It must be standalone — the item resets the switcher
	 * context for its own content — so it opens a dialog of its own rather than
	 * joining the flow.
	 */
	let isNestedOpen = $state(false);
</script>

<BottomSheetSwitcher activeSheet="details" onActiveSheetChange={() => {}}>
	<BottomSheet sheetId="details" label="Details">
		<button type="button" onclick={() => (isNestedOpen = true)}>Open nested sheet</button>
		<BottomSheet
			isOpen={isNestedOpen}
			onOpenChange={(next) => (isNestedOpen = next)}
			label="Nested standalone sheet"
		>
			Nested content
		</BottomSheet>
	</BottomSheet>
</BottomSheetSwitcher>
