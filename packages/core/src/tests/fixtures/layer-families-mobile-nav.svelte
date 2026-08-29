<script lang="ts" module>
	/**
	 * Which of upstream's three MobileNav trees to render:
	 * - `alone` — the drawer on its own
	 * - `over-required` — a `purpose="required"` Dialog, then the drawer as a
	 *   sibling opened over it
	 * - `with-dialog-inside` — a Dialog opened from inside the drawer
	 */
	export type LayerFamiliesMobileNavShape = 'alone' | 'over-required' | 'with-dialog-inside';

	export interface LayerFamiliesMobileNavProps {
		onNavChange: (isOpen: boolean) => void;
		onDialogChange?: (isOpen: boolean) => void;
		/** @default 'alone' */
		shape?: LayerFamiliesMobileNavShape;
	}
</script>

<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import MobileNav from '$lib/components/mobile-nav/mobile-nav.svelte';

	/**
	 * Upstream's three MobileNav trees, as one fixture. All three put markup
	 * inside the drawer (or beside it in a fragment), which is component content
	 * here and cannot be written in a `render()` props object.
	 */
	const { onNavChange, onDialogChange, shape = 'alone' }: LayerFamiliesMobileNavProps = $props();

	const noop = (): void => {};
</script>

{#if shape === 'over-required'}
	<Dialog
		isOpen={true}
		onOpenChange={onDialogChange ?? noop}
		purpose="required"
		aria-label="Required"
	>
		Choose one
	</Dialog>
{/if}
<MobileNav isOpen={true} onOpenChange={onNavChange} label="Drawer">
	<span>Nav content</span>
	{#if shape === 'with-dialog-inside'}
		<Dialog isOpen={true} onOpenChange={onDialogChange ?? noop} aria-label="Above">Above</Dialog>
	{/if}
</MobileNav>
