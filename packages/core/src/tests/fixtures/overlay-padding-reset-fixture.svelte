<script lang="ts" module>
	/** The overlays upstream's `OVERLAYS` table enumerates, in its order. */
	export type OverlayName = 'Dialog' | 'BottomSheet' | 'MobileNav' | 'Lightbox' | 'Popover';
</script>

<script lang="ts">
	import Section from '$lib/components/section/section.svelte';
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import MobileNav from '$lib/components/mobile-nav/mobile-nav.svelte';
	import Lightbox from '$lib/components/lightbox/lightbox.svelte';
	import Popover from '$lib/components/popover/popover.svelte';

	/**
	 * Upstream's `OVERLAYS` render functions, as one fixture.
	 *
	 * Every entry is `render(<Section padding={10}>{overlay(<div>c</div>)}</Section>)`
	 * — the page section that "leaks 40px", with the overlay open inside it. The
	 * five differ only in which component sits in the middle, so a `which` prop
	 * selects one rather than five near-identical fixtures. Each overlay's
	 * children/content is a `Snippet` here, and a snippet can only be authored in
	 * a template, which is why any of this needs a fixture at all.
	 */
	interface Props {
		which: OverlayName;
	}

	const { which }: Props = $props();
</script>

<Section padding={10}>
	{#if which === 'Dialog'}
		<Dialog isOpen onOpenChange={() => {}}>
			<div>c</div>
		</Dialog>
	{:else if which === 'BottomSheet'}
		<BottomSheet isOpen onOpenChange={() => {}} label="S">
			<div>c</div>
		</BottomSheet>
	{:else if which === 'MobileNav'}
		<MobileNav isOpen onOpenChange={() => {}} label="N">
			<div>c</div>
		</MobileNav>
	{:else if which === 'Lightbox'}
		<Lightbox isOpen onOpenChange={() => {}} media={{ src: 'a.png', alt: 'a' }} />
	{:else if which === 'Popover'}
		<Popover isOpen onOpenChange={() => {}} label="P">
			{#snippet content()}<div>c</div>{/snippet}
			<button type="button">t</button>
		</Popover>
	{/if}
</Section>
