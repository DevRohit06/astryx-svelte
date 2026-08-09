<script lang="ts">
	import { Center, Spinner, Text } from '@astryx-svelte/core';
	import { importerFor } from './example-modules.js';

	/**
	 * The hero preview at the top of a component page — upstream's
	 * `ShowcasePreview`, which is a *different* component from the one inside an
	 * example block and framed differently: a 16/9 stage with no inner padding,
	 * collapsing to a 160px-floor free-height box on small screens where 16/9
	 * would crop.
	 *
	 * Upstream picks between the two with `useMediaQuery('(max-width: 768px)')`.
	 * That hook is not ported (batch 3), and a media-query *hook* would make the
	 * first server render pick a width — so the breakpoint is a media query in
	 * CSS instead. Both shapes are the same element, so the server's HTML is
	 * right at every width instead of right at one and re-laid-out on hydration:
	 * the same trade `top-nav.svelte` already documents.
	 */
	interface Props {
		/** `<Component>/<Block>`, the id the example registry uses. */
		id: string;
		/** The registry's own flag, so an un-rewritten block never even imports. */
		hasSvelte: boolean;
	}

	const { id, hasSvelte }: Props = $props();

	const importer = $derived(hasSvelte ? importerFor(id) : null);
</script>

{#if importer}
	{#await importer()}
		<div class="showcase-placeholder">
			<Center width="100%" height="100%">
				<Spinner size="md" />
			</Center>
		</div>
	{:then module}
		{@const Block = module.default}
		<div class="showcase">
			<div class="showcase-inner">
				<Block />
			</div>
		</div>
	{:catch}
		<div class="showcase-placeholder">
			<Center width="100%" height="100%">
				<Text type="supporting" color="secondary">Preview not available</Text>
			</Center>
		</div>
	{/await}
{:else}
	<div class="showcase-placeholder">
		<Center width="100%" height="100%">
			<Text type="supporting" color="secondary">
				Live preview pending — this block's Svelte rewrite has not landed yet.
			</Text>
		</Center>
	</div>
{/if}

<style>
	.showcase,
	.showcase-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: auto;
	}

	/* Upstream renders the block as a *direct* flex child on desktop and only wraps
	   it in the `min-width: fit-content` div on small screens. The wrapper is
	   unconditional here because the branch is CSS rather than a `useMediaQuery`,
	   so `display: contents` takes it back out of the layout tree above 768px.
	   Without that it is an auto-width block between the flex container and the
	   block, and a percentage width inside resolves against a box that is itself
	   sized by its content: `ChatComposer` in a `Stack width="100%"` collapses to
	   the composer's max-content (~64px), because a contenteditable has no
	   intrinsic width. Blocks whose content is naturally wide hide it. */
	.showcase-inner {
		display: contents;
	}

	/* Upstream's small-screen branch: no aspect ratio, a 160px floor, and the
	   block wrapped so it scrolls rather than squashing. */
	@media (max-width: 768px) {
		.showcase,
		.showcase-placeholder {
			aspect-ratio: auto;
			min-height: 160px;
		}

		.showcase-inner {
			display: block;
			min-width: fit-content;
		}
	}
</style>
