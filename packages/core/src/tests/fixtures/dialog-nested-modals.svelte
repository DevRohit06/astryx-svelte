<script lang="ts" module>
	export interface DialogNestedModalsProps {
		isInnerOpen: boolean;
		onOuterChange: (isOpen: boolean) => void;
		onInnerChange: (isOpen: boolean) => void;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';

	/**
	 * Upstream's local `NestedModals` component from `Dialog/Dialog.test.tsx` — an
	 * inner `Dialog` rendered inside an outer one's content, which is how a modal
	 * opened from inside another modal reaches the dismissal stack one level
	 * deeper.
	 *
	 * A fixture rather than a `render()` prop bag because the nesting *is*
	 * component content, and content is a snippet here.
	 */
	const { isInnerOpen, onOuterChange, onInnerChange }: DialogNestedModalsProps = $props();
</script>

<Dialog isOpen={true} onOpenChange={onOuterChange} purpose="info" aria-label="Outer">
	Outer content
	<Dialog isOpen={isInnerOpen} onOpenChange={onInnerChange} purpose="info" aria-label="Inner">
		Inner content
	</Dialog>
</Dialog>
