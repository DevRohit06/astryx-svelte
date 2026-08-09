<script lang="ts" module>
	export interface CommandPaletteItemInDialogProps {
		isHighlighted?: boolean;
		isInline?: boolean;
		value?: string;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import CommandPaletteItem from '$lib/components/command-palette/command-palette-item.svelte';

	/**
	 * Upstream's `<Dialog isOpen isInline>` wrapper for the two inline
	 * scroll-suppression cases. `isInline` is a prop rather than hard-coded so the
	 * "scrolls after highlight changes" case can drive `isHighlighted` through a
	 * rerender without remounting the dialog — a remount would reset the
	 * `didMount` latch the case exists to exercise.
	 */
	const {
		isHighlighted = false,
		isInline = true,
		value = 'test'
	}: CommandPaletteItemInDialogProps = $props();
</script>

<Dialog isOpen {isInline} onOpenChange={() => {}}>
	<CommandPaletteItem {value} {isHighlighted}>Item</CommandPaletteItem>
</Dialog>
