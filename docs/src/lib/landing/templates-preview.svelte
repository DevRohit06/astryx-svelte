<script lang="ts">
	import type { Component } from 'svelte';
	import ShowcaseThumbnail from '$lib/shell/showcase-thumbnail.svelte';

	/**
	 * The Templates bento tile's preview — six real block templates, live and
	 * scaled, in the staggered two-per-row stack upstream uses.
	 *
	 * **The composition is upstream's `TemplatesPreview`; the contents are the
	 * templates this port has.** Upstream picks seven *page* templates
	 * (`product-gallery`, `ide`, `payment-form`, `login-split`,
	 * `settings-sidebar`, `ai-chat-landing`, `product-detail`) and renders each
	 * one's `page.tsx` at 1100px through `TemplateThumbnail`. Not one page
	 * template is ported (port/todo.md → Phase 5), so those seven slugs resolve to
	 * nothing here. The **block** templates all do exist — 619 of them reach
	 * `/templates` — so the tile shows six of those instead, through the same
	 * `ShowcaseThumbnail` the components gallery uses.
	 *
	 * The six are upstream's own showcase blocks, chosen to be legible at tile
	 * size and to cover different page furniture rather than six of one thing.
	 * They are named here rather than taken off the top of the registry because
	 * the registry's first six alphabetically are five `AlertDialog`s and an
	 * `AppShell`, which would read as a bug.
	 *
	 * This tile returns to upstream's seven pages when the page templates land;
	 * the row shape and the ratio are already upstream's.
	 */

	/**
	 * Six blocks, two per row.
	 *
	 * Upstream's middle row holds three so its centred `login-split` page sits in
	 * the middle. That works because a page template *is* a page: shrunk to a
	 * third of a narrow card it still reads as a layout. A block is a component
	 * demo, and at ~95px it reads as a smudge, so the rows are uniform here and
	 * every tile is half a card wide.
	 *
	 * **Literal `import()` calls rather than `importerFor()`, and that is a size
	 * decision.** The registry lookup would pull `example-modules.ts` — a
	 * 629-entry `import.meta.glob` that bundles to a 242 KB eager chunk — onto the
	 * landing page, which is the one route in the site with no reason to know the
	 * whole example set. Six named imports are six lazy chunks and nothing eager.
	 * See `ShowcaseThumbnail`'s `load` prop.
	 */
	const ROWS: Array<Array<{ id: string; load: () => Promise<{ default: Component }> }>> = [
		[
			{
				id: 'AppShellShowcase',
				load: () => import('$lib/examples/AppShell/AppShellShowcase.svelte')
			},
			{ id: 'TableShowcase', load: () => import('$lib/examples/Table/TableShowcase.svelte') }
		],
		[
			{
				id: 'CalendarShowcase',
				load: () => import('$lib/examples/Calendar/CalendarShowcase.svelte')
			},
			{
				id: 'ChatMessageListShowcase',
				load: () => import('$lib/examples/ChatMessageList/ChatMessageListShowcase.svelte')
			}
		],
		[
			{
				id: 'CommandPaletteShowcase',
				load: () => import('$lib/examples/CommandPalette/CommandPaletteShowcase.svelte')
			},
			{
				id: 'CollapsibleShowcase',
				load: () => import('$lib/examples/Collapsible/CollapsibleShowcase.svelte')
			}
		]
	];

	/**
	 * The width a block lays out at before being shrunk into its tile — upstream's
	 * `RENDER_WIDTH`, at 600 rather than 1100 because these are component blocks
	 * and not whole pages. Under the thumbnail's default (twice the tile) a 150px
	 * tile lays the block out at 300px, which is narrow enough that a multi-column
	 * block reflows into a column and the tile shows a fragment rather than the
	 * composition.
	 */
	const RENDER_WIDTH = 600;

	/** Upstream's `TILE_RATIO` — slightly taller than 16/10. */
	const TILE_RATIO = '16 / 11.5';
</script>

<div class="root" inert>
	{#each ROWS as row, index (index)}
		<div class="row">
			{#each row as block (block.id)}
				<div class="tile">
					<ShowcaseThumbnail
						load={block.load}
						renderWidth={RENDER_WIDTH}
						aspectRatio={TILE_RATIO}
					/>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
		width: 100%;
		max-width: 420px;
		margin-inline: auto;
		/* Decorative — never interactive, and `ShowcaseThumbnail` is already
		   `inert` on its own. */
		pointer-events: none;
	}

	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-2);
	}

	/*
	 * The thumbnail rounds and clips itself, so the tile only owns the shadow —
	 * nesting a second radius here would show a mismatched corner, which is the
	 * reason upstream passes `borderRadius="0"` to its own thumbnail.
	 */
	.tile {
		overflow: hidden;
		border-radius: var(--radius-container);
		box-shadow: var(--shadow-sm);
	}
</style>
