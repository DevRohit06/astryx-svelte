<script lang="ts">
	import { Heading } from '@astryx-svelte/core';
	import { buildOutline } from '$lib/shell/build-outline.js';
	import BestPracticesBlock from '$lib/shell/best-practices-block.svelte';
	import ContentBlockView from '$lib/shell/content-block.svelte';
	import DocPageLayout from '$lib/shell/doc-page-layout.svelte';
	import type { BestPractice, ReferenceSection, ReferenceTopic } from '$lib/generated/types.js';

	/**
	 * Upstream's `ReferenceDocView` — one `/docs/<topic>` reference page rendered
	 * from its authored `ContentBlock[]`.
	 *
	 * Extracted from the route when `/docs/<package>` landed. Upstream's
	 * `docs/[topic]/page.tsx` serves two kinds of slug from one route and picks
	 * the view; this is the first of the two, and the route now does the same
	 * pick rather than holding one view's markup inline.
	 *
	 * Upstream also has a third view, `TokensDocView`, for the seven foundations
	 * token topics. Here that split lives one level down: a section that declares
	 * a `previewType` routes its tables through `shell/token-table.svelte`, so
	 * both kinds render the same authored blocks and only the table renderer
	 * differs.
	 */
	const { topic }: { topic: ReferenceTopic } = $props();

	// Sections *and* their `heading` blocks, each at its own level, with ids
	// deduped across the whole page — see `build-outline.ts`. The page consumes
	// the minted ids rather than re-deriving them, because two sections can hold
	// a heading with the same text.
	const built = $derived(buildOutline(topic.sections));

	/**
	 * Upstream's `ReferenceDocView.isBestPracticesSection` — a section whose
	 * content is *nothing but* `do`/`dont` lists is not rendered block by block;
	 * the whole section becomes one `BestPracticesBlock`, so the guidance reads as
	 * a labelled two-column table instead of loose badges. 12 of the 20 topics
	 * have such a section (`color`, `elevation`, `motion`, `shape`, `spacing`,
	 * `typography`, `styling`, `styling-libraries` ×2, `browser-support`,
	 * `illustrations`, `principles`).
	 *
	 * The three sections that *mix* a do/dont list with prose (`layout / Cards vs
	 * Rows`, `theme / Component Style Overrides`, `theme / Runtime vs Built
	 * Themes`) keep the per-block path, which is upstream's behaviour too — its
	 * `ListBlock` resolves any style that is not `ordered`/`unordered` to marker
	 * `none` and renders no badge. Verified on astryx.atmeta.com/docs/layout:
	 * that section has 0 `.astryx-badge`.
	 */
	function isBestPracticesSection(section: ReferenceSection): boolean {
		return (
			section.content.length > 0 &&
			section.content.every(
				(block) => block.type === 'list' && (block.style === 'do' || block.style === 'dont')
			)
		);
	}

	/** Flattens a best-practices section's lists into upstream's row order. */
	function bestPracticesOf(section: ReferenceSection): BestPractice[] {
		const items: BestPractice[] = [];
		for (const block of section.content) {
			if (block.type !== 'list') continue;
			if (block.style !== 'do' && block.style !== 'dont') continue;
			for (const item of block.items) {
				items.push({ guidance: block.style === 'do', description: item });
			}
		}
		return items;
	}
</script>

<DocPageLayout title={topic.title} description={topic.description} outline={built.outline}>
	{#each topic.sections as section, sectionIndex (section.title)}
		{@const id = built.sectionIds[sectionIndex]}
		<section {id} class="doc-section">
			<!--
				`type="display-3"` is upstream's `AnchorHeading … level={2}
				type="display-3"`. Without it a section heading renders at the theme's
				plain `level-2` size — measured 20px/28px here against upstream's
				29px/36px — which is what made the pages read flat.
			-->
			<Heading level={2} type="display-3">
				{section.title}
				<a class="anchor" href="#{id}" aria-label="Link to {section.title}">#</a>
			</Heading>
			{#if isBestPracticesSection(section)}
				<BestPracticesBlock items={bestPracticesOf(section)} />
			{:else}
				{#each section.content as block, i (i)}
					<ContentBlockView
						{block}
						previewType={section.previewType}
						headingId={built.blockIds.get(`${sectionIndex}:${i}`)}
					/>
				{/each}
			{/if}
		</section>
	{/each}
</DocPageLayout>

<style>
	.doc-section {
		display: flex;
		flex-direction: column;
		/* Upstream wraps each section in `VStack gap={4}` — 16px, not 12px. */
		gap: var(--spacing-4);
		/*
		 * Upstream's `AnchorHeading`: `calc(var(--_app-shell-header-height, 0px) +
		 * var(--docs-anchor-offset, 0px) + 16px)`. `AppShell` is unported, so this
		 * port's own 56px sticky header stands in for the first term — which is
		 * what the bare `72px` here already was, with the offset silently at 0.
		 * `DocPageLayout` publishes the mobile jump menu's measured height into
		 * `--docs-anchor-offset`, so a section scrolled to below 1024px now clears
		 * the pinned selector instead of landing behind it.
		 */
		scroll-margin-block-start: calc(
			var(--_app-shell-header-height, 56px) + var(--docs-anchor-offset, 0px) + 16px
		);
	}

	.anchor {
		margin-inline-start: var(--spacing-2);
		color: var(--color-text-disabled);
		text-decoration: none;
		opacity: 0;
	}

	.doc-section:hover .anchor,
	.anchor:focus-visible {
		opacity: 1;
	}
</style>
