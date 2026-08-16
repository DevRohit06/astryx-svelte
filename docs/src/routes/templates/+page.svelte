<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Button,
		ClickableCard,
		Grid,
		HStack,
		Heading,
		Overlay,
		Section,
		Text,
		ToggleButton,
		ToggleButtonGroup,
		VStack,
		useAppShellMobile
	} from '@astryx-svelte/core';
	import templateRegistry from '$lib/generated/template-registry.js';
	import ShowcaseThumbnail from '$lib/shell/showcase-thumbnail.svelte';
	import TemplatePreviewDialog from '$lib/shell/template-preview-dialog.svelte';
	import type { TemplatePreviewItem } from '$lib/shell/template-preview-dialog.svelte';
	import { templateImporterFor } from '$lib/shell/example-modules.js';

	/**
	 * The templates gallery — upstream's `/templates`, which is a **pages-only**
	 * gallery.
	 *
	 * This page used to list the 619 **block** templates, and said so honestly:
	 * upstream's CLI publishes two kinds under `assets/templates/`, `type: 'page'`
	 * (43 whole pages) and `type: 'block'` (629 once `alsoExampleFor` targets are
	 * counted), and only the pages had no Svelte rewrite. Showing the half that
	 * existed was the right call while that was true. It is being made false one
	 * batch at a time (`port/ledger/022-page-templates.md`), so the
	 * page is now what upstream's is.
	 *
	 * **The blocks are not kept alongside them.** Upstream's `/templates` shows no
	 * blocks at all — its block set is a CLI scaffolding feature that surfaces on
	 * component detail pages, which is exactly where this port's blocks already
	 * live, each with a live preview and its source. Keeping a second, larger
	 * gallery of them here "just in case" would leave this page permanently
	 * unlike the page it is a port of.
	 *
	 * ### What is listed
	 *
	 * `isReady && !isHiddenFromOverview && hasSvelte`, over the 42 templates the
	 * registry records — the CLI ships 43, and upstream's generator drops the one
	 * marked `scaffold` from its docsite registry, which this port's does too.
	 * `blank` is still a template `astryx-svelte template` scaffolds; a gallery of
	 * finished pages is just not where an empty one belongs.
	 *
	 * The first two terms are upstream's editorial calls, carried through verbatim
	 * by the registry — inverting them would be inventing content, and the
	 * templates they hide are still recorded and still scaffoldable. `hasSvelte` is this
	 * port's own third term and the one that keeps the page honest while the
	 * batches land: a template with no transcription yet would otherwise be a card
	 * with an empty box in it. The supporting line below names the remainder
	 * rather than letting a short gallery imply upstream ships a short one, and it
	 * disappears on its own when the count reaches zero.
	 *
	 * ### What is not here
	 *
	 * **Group headings.** The brief for this rewrite asked for them; upstream has
	 * none. Its gallery renders one flat `Grid` and uses the group only to *order*
	 * it — `groupRank` then name — with the comment "so the single grid stays
	 * stable". Ordering is ported; headings would be invented layout, which the
	 * parity rule calls a defect rather than an improvement. They are ten lines to
	 * add if that is ever the decision.
	 *
	 * **"Open in Playground",** on the tile and in the preview dialog both:
	 * `/playground` is not in this port, and `nav-items.ts`'s standing rule is that
	 * linking to a 404 is worse than not linking. The tile's other scrim button,
	 * **Preview**, does return — the reason it was dropped before was that a block
	 * had a live preview and source on the component page already, and that
	 * reasoning never extended to a whole page.
	 *
	 * Below-the-fold tiles never import: `ShowcaseThumbnail` gates on an
	 * `IntersectionObserver`, which is what makes a page of live renders
	 * affordable. It renders each template at twice the tile width and scales it
	 * to half, upstream's `TemplateThumbnail` default (its `renderWidth` override
	 * is for the landing page's wider tiles, and upstream's own gallery does not
	 * pass it either). One cosmetic difference is inherited from sharing the
	 * component with the block gallery: upstream's template thumbnail backs its
	 * tile with `--color-background-surface`, because a content-only template
	 * renders transparent, where `ShowcaseThumbnail` uses `--color-background-muted`.
	 */

	/**
	 * Upstream's `GROUP_ORDER`. Groups outside it append alphabetically and
	 * `Other` sorts last; the group itself is derived in the registry, where
	 * `groupOf` explains why it lives there and this list does not.
	 */
	const GROUP_ORDER = [
		'Dashboard',
		'Table',
		'Form',
		'Settings',
		'Login',
		'Tools',
		'Content',
		'AI Chat',
		'Gallery',
		'Shell'
	];

	const OTHER_GROUP = 'Other';
	const ALL = 'All';

	/** Upstream's `groupRank`. */
	function groupRank(group: string): number {
		const index = GROUP_ORDER.indexOf(group);
		if (index !== -1) return index;
		return group === OTHER_GROUP ? Number.MAX_SAFE_INTEGER : GROUP_ORDER.length;
	}

	const appShellMobile = useAppShellMobile();
	const isMobile = $derived(appShellMobile().isMobile);

	/**
	 * Everything upstream's gallery would list — its `isReady &&
	 * !isHiddenFromOverview` filter, and nothing else. Only used for the pending
	 * count, so that count is measured against upstream's gallery rather than
	 * against all 43.
	 */
	const listable = templateRegistry.filter((entry) => entry.isReady && !entry.isHiddenFromOverview);

	/**
	 * The flat, display-ordered list: group rank, then group name, then template
	 * name. `filter` already returns a fresh array, so sorting it in place does
	 * not disturb the generated module.
	 *
	 * Plain `const`, not `$derived`: the registry is build-time data and nothing
	 * on this page can change it. Upstream's `useMemo(..., [])` is the same
	 * statement in React's vocabulary.
	 */
	const items = listable
		.filter((entry) => entry.hasSvelte)
		.sort(
			(a, b) =>
				groupRank(a.group) - groupRank(b.group) ||
				a.group.localeCompare(b.group) ||
				a.name.localeCompare(b.name)
		);

	const pending = listable.length - items.length;

	/**
	 * `All`, then each group present, in display order.
	 *
	 * Deduplicated with `indexOf` rather than a `Set` because `items` is already
	 * sorted and eleven entries make the difference academic — and a bare `new
	 * Set` in a `.svelte` file trips `svelte/prefer-svelte-reactivity`, whose
	 * suppression would need more explaining than the two-line alternative.
	 */
	const categories = [
		ALL,
		...items.map((item) => item.group).filter((group, index, all) => all.indexOf(group) === index)
	];

	let activeCategory = $state(ALL);

	const filtered = $derived(
		activeCategory === ALL ? items : items.filter((item) => item.group === activeCategory)
	);

	/** What the dialog needs, in the order prev/next should walk. */
	const previewItems = $derived<TemplatePreviewItem[]>(
		filtered.map((item) => ({
			slug: item.slug,
			name: item.name,
			description: item.description
		}))
	);

	/**
	 * `?preview=<slug>` is the dialog's address — upstream's `/templates/[slug]`
	 * is a redirect to it, so a direct link to a template has to arrive here and
	 * open the dialog. `[slug]/+page.ts` is that redirect.
	 *
	 * Adopted in an effect rather than `$derived`ed from `page.url` for the reason
	 * `components/[name]`'s `?tab=` records at length: this page prerenders, and
	 * SvelteKit throws on `url.searchParams` during prerender precisely so a build
	 * cannot bake one request's query into a static file. Reading it after
	 * hydration also keeps the hydrated DOM identical to the server's.
	 *
	 * The effect writes without reading, so it cannot re-trigger itself, and
	 * `$state` skips equal writes — so the echo from `setPreview`'s own
	 * `replaceState` is a no-op rather than a second render.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let previewSlug = $state<string | null>(null);

	$effect(() => {
		previewSlug = page.url.searchParams.get('preview');
	});

	/**
	 * `-1` covers both "no preview requested" and "the requested slug is not in
	 * the current filter" — upstream's `indexBySlug.get(slug) ?? null`, which
	 * closes the dialog in the same two cases.
	 */
	const previewIndex = $derived(
		previewSlug == null ? -1 : previewItems.findIndex((item) => item.slug === previewSlug)
	);

	/** Upstream's `router.replace(..., {scroll: false})` — no history entry. */
	function setPreview(slug: string | null): void {
		previewSlug = slug;
		const url = new URL(page.url);
		if (slug == null) url.searchParams.delete('preview');
		else url.searchParams.set('preview', slug);
		replaceState(url, page.state);
	}
</script>

<Seo
	title="Page Templates"
	description="Full page layouts built from Astryx components — dashboards, chat, settings, auth and more. Preview them live, then scaffold one with a single CLI command."
/>

<Section maxWidth={1200} padding={6} style="margin-inline: auto;">
	<VStack gap={10}>
		<VStack gap={6} align="stretch">
			<VStack gap={2}>
				<Heading level={1} type="display-1" justify="center">Templates</Heading>
				<Text type="body" color="secondary" justify="center">
					Ready-to-use page templates to kickstart your project.
				</Text>
				<!--
					Stated rather than implied, on the components gallery's rule, and
					self-retiring: the page names the part of upstream's gallery that is
					still being transcribed instead of leaving a reader to infer that a
					short gallery is the whole set. It renders nothing once the last
					batch lands.
				-->
				{#if pending > 0}
					<Text type="supporting" color="secondary" justify="center">
						{pending} of upstream's {listable.length} gallery templates are still being transcribed to
						Svelte.
					</Text>
				{/if}
			</VStack>

			{#if items.length > 0}
				<div class="category-filter">
					<ToggleButtonGroup
						label="Filter templates by category"
						value={activeCategory}
						onChange={(value: string | null) => (activeCategory = value ?? ALL)}
					>
						{#each categories as category (category)}
							<ToggleButton value={category} label={category} />
						{/each}
					</ToggleButtonGroup>
				</div>
			{/if}
		</VStack>

		{#if items.length === 0}
			<!--
				Upstream has no empty state, because its gallery cannot be empty. This
				one can, for exactly as long as the first batch takes, and an empty
				`Grid` under a filter with one chip in it would read as a broken page
				rather than an unfinished one.
			-->
			<VStack gap={1} align="center">
				<Text type="large" weight="normal">No page templates have landed yet.</Text>
				<Text type="supporting" color="secondary">
					All {templateRegistry.length} of upstream's gallery templates are recorded; {listable.length}
					are waiting on their Svelte transcription.
				</Text>
			</VStack>
		{:else}
			<Grid columns={{ minWidth: isMobile ? 280 : 420 }} gap={4} width="100%">
				{#each filtered as item (item.slug)}
					<!--
						Both snippets are declared inside the `{#each}` on purpose: a
						`{#snippet}` that is a *direct* child of a component is read as one
						of its props, and neither `ClickableCard` nor `Overlay` has a prop
						by these names. Here they are ordinary local snippets closing over
						`item`, which is what `Overlay` needs — its `content` takes no
						arguments, so a page-level snippet parameterised by the item could
						not be passed to it.

						No colour props on the scrim's text: `OverlayScrim` wraps its
						children in a `MediaTheme` at the scrim's own mode, so the defaults
						already resolve against the dark tint. Upstream passes none either.
					-->
					{#snippet thumbnail()}
						<ShowcaseThumbnail load={templateImporterFor(item.slug)} />
					{/snippet}

					{#snippet overlayContent()}
						<VStack
							role="presentation"
							onclick={() => setPreview(item.slug)}
							justify="end"
							align="start"
							height="100%"
							width="100%"
							gap={4}
							style="padding: 8px; cursor: pointer;"
						>
							<VStack gap={0.5}>
								<Heading level={3}>{item.name}</Heading>
								<Text maxLines={2}>{item.description}</Text>
							</VStack>
							<HStack gap={2}>
								<Button label="Preview" variant="secondary" onclick={() => setPreview(item.slug)} />
							</HStack>
						</VStack>
					{/snippet}

					<ClickableCard
						label="Preview {item.name}"
						padding={0}
						maxWidth="100%"
						onclick={() => setPreview(item.slug)}
						style="--color-overlay: color-mix(in srgb, var(--color-on-light) 78%, transparent);"
					>
						{#if isMobile}
							{@render thumbnail()}
						{:else}
							<Overlay showOn="hover" scrim="dark" content={overlayContent}>
								{@render thumbnail()}
							</Overlay>
						{/if}
					</ClickableCard>
				{/each}
			</Grid>
		{/if}
	</VStack>

	<TemplatePreviewDialog
		items={previewItems}
		index={previewIndex === -1 ? 0 : previewIndex}
		isOpen={previewIndex !== -1}
		onOpenChange={(open) => {
			if (!open) setPreview(null);
		}}
		onIndexChange={(index) => setPreview(previewItems[index]?.slug ?? null)}
		variant={isMobile ? 'fullscreen' : undefined}
	/>
</Section>

<style>
	.category-filter {
		display: flex;
		justify-content: center;
	}

	/*
	 * Upstream's `styles.categoryFilter` — `flexWrap: 'wrap'` and
	 * `justifyContent: 'center'`, hung on the `ToggleButtonGroup` itself through
	 * `xstyle`. That box is the one that has to wrap: putting the rule on a
	 * wrapper leaves the group `nowrap`, and with thirteen chips it measured
	 * 997px inside a 375px viewport, clipped rather than scrolled — the last five
	 * categories were unreachable on a phone with no scrollbar to say so.
	 *
	 * `xstyle` is StyleX, which a `.svelte` file may not import, and the group
	 * publishes no `class` prop; `:global` on its stable `.astryx-*` selector is
	 * the remaining channel, and it is the one the theme layer uses too. Same
	 * shape as `features-showcase.svelte`'s `:global(.feature-card)`.
	 *
	 * The chip count is now upstream's eleven rather than the block gallery's
	 * thirteen, and the chips are full-size rather than `sm` because upstream
	 * passes no `size`. Both make the row wider per chip, not narrower — the
	 * measurement above is the reason the rule exists, not its precondition.
	 */
	.category-filter :global(.astryx-toggle-button-group) {
		flex-wrap: wrap;
		justify-content: center;
	}
</style>
