<script lang="ts">
	import type { Snippet } from 'svelte';
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';

	/**
	 * A switcher over one or two sheets, for the cases that need a sheet hosted
	 * inside a `BottomSheetSwitcher` rather than standing alone. Upstream writes
	 * the pair inline as JSX; a Svelte snippet cannot be authored inside a case,
	 * so the shape lives here and the case varies the props.
	 */
	let {
		activeSheet,
		onActiveSheetChange = () => {},
		hasScrim,
		height = 'tall',
		first,
		second
	}: {
		activeSheet: string | null;
		onActiveSheetChange?: (sheetId: string | null) => void;
		hasScrim?: boolean;
		height?: 'hug' | 'capped' | 'tall';
		first: Snippet;
		second?: Snippet;
	} = $props();
</script>

<BottomSheetSwitcher {activeSheet} {onActiveSheetChange} {hasScrim}>
	<BottomSheet sheetId="comment" label="Add a comment" {height}>
		{@render first()}
	</BottomSheet>
	{#if second}
		<BottomSheet sheetId="confirmation" label="Confirmation">
			{@render second()}
		</BottomSheet>
	{/if}
</BottomSheetSwitcher>
