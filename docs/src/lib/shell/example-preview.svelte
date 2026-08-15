<script lang="ts">
	import { Center, Spinner, Text } from '@astryx-svelte/core';
	import { importerFor } from './example-modules.js';

	/**
	 * The live preview inside an example block — upstream's `LivePreview`, the
	 * inner half of `ExampleBlock.tsx`.
	 *
	 * It draws **no chrome of its own**: the surrounding `Card` supplies the
	 * border and background, exactly as upstream's does. The 200px floor is what
	 * keeps a row of cards from jittering as their blocks stream in, and the
	 * `fit-content` inner wrapper is what makes a wide example scroll inside the
	 * card instead of stretching it.
	 *
	 * The import is lazy, so the server renders the frame and the block arrives
	 * on hydration — upstream's behaviour, and what keeps a component page from
	 * bundling every block it documents.
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
		<Center width="100%" minHeight={200}>
			<Spinner size="md" />
		</Center>
	{:then module}
		{@const Block = module.default}
		<div class="preview">
			<div class="preview-inner">
				<Block />
			</div>
		</div>
	{:catch}
		<Center width="100%" minHeight={200}>
			<Text type="supporting" color="secondary">Preview not available</Text>
		</Center>
	{/await}
{:else}
	<!--
		No upstream counterpart: upstream has no un-ported blocks. The ten this
		port cannot render yet are blocked on unported components (port/todo.md), and
		the gap is countable in `coverage`, so the frame says so rather than
		rendering empty.
	-->
	<Center width="100%" minHeight={200}>
		<Text type="supporting" color="secondary">
			Live preview pending — this block's Svelte rewrite has not landed yet.
		</Text>
	</Center>
{/if}

<style>
	.preview {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 200px;
		overflow: auto;
	}

	.preview-inner {
		min-width: fit-content;
		padding: var(--spacing-4);
	}
</style>
