<script lang="ts" module>
	import type { Component } from 'svelte';

	/**
	 * The blocks the theme preview renders, in the order it renders them.
	 *
	 * Every one is an upstream `isShowcase` block out of the example set — the
	 * same file `/components/<name>` renders as that component's hero preview. The
	 * *selection* is this page's (upstream previews a page template instead; see
	 * `routes/themes/+page.svelte` for why that is not available), but nothing here
	 * is authored: swapping in hand-written demo markup would be the defect the
	 * parity rule names.
	 *
	 * Chosen to exercise the parts of a theme a token table cannot show — the
	 * accent on a filled control, the surface/border pair on a card, type on a
	 * heading, and a form control's focus ring.
	 *
	 * **Literal `import()` calls rather than `importerFor()`.** Resolving ids
	 * through the registry would pull `example-modules.ts` — a 629-entry
	 * `import.meta.glob` that bundles to a 242 KB eager chunk — onto a route that
	 * shows six blocks it names in source. Six named imports are six lazy chunks
	 * and nothing eager.
	 */
	export const PREVIEW_BLOCKS: Array<{ id: string; load: () => Promise<{ default: Component }> }> =
		[
			{ id: 'ButtonShowcase', load: () => import('$lib/examples/Button/ButtonShowcase.svelte') },
			{ id: 'BadgeShowcase', load: () => import('$lib/examples/Badge/BadgeShowcase.svelte') },
			{
				id: 'TextInputShowcase',
				load: () => import('$lib/examples/TextInput/TextInputShowcase.svelte')
			},
			{
				id: 'SegmentedControlShowcase',
				load: () => import('$lib/examples/SegmentedControl/SegmentedControlShowcase.svelte')
			},
			{ id: 'CardShowcase', load: () => import('$lib/examples/Card/CardShowcase.svelte') },
			{ id: 'BannerShowcase', load: () => import('$lib/examples/Banner/BannerShowcase.svelte') }
		];
</script>

<script lang="ts">
	import { Skeleton, Text, VStack } from '@astryx-svelte/core';

	/**
	 * The live half of `/themes` — a column of upstream showcase blocks, mounted
	 * inside whichever `<Theme>` wraps this component.
	 *
	 * Each block is imported lazily, exactly as `example-preview.svelte` does, so
	 * the route's own chunk stays small and the blocks arrive on hydration. They
	 * are *not* re-imported when the theme changes: a theme is CSS, so the same
	 * mounted markup restyles itself, and remounting six components on every click
	 * of the picker would be the expensive way to change a custom property.
	 *
	 * `<svelte:boundary>` per block rather than one around the set, so a block that
	 * throws costs its own tile instead of the whole preview.
	 */
</script>

<VStack gap={5}>
	{#each PREVIEW_BLOCKS as entry (entry.id)}
		<svelte:boundary>
			{#await entry.load()}
				<Skeleton width="100%" height={72} />
			{:then module}
				{@const Block = module.default}
				<div class="block">
					<Block />
				</div>
			{:catch}
				<Text type="supporting" color="secondary">Preview unavailable</Text>
			{/await}

			{#snippet failed()}
				<Text type="supporting" color="secondary">Preview unavailable</Text>
			{/snippet}
		</svelte:boundary>
	{/each}
</VStack>

<style>
	/* Blocks are authored to sit in a component page's preview card, which is
	   shrink-to-fit on both axes. Here they share one column, so a wide one
	   scrolls inside its own row rather than widening the page. */
	.block {
		width: 100%;
		overflow-x: auto;
	}
</style>
