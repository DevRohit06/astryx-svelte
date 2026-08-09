<script lang="ts">
	import {
		ClickableCard,
		Grid,
		Heading,
		Overlay,
		Section,
		Text,
		ToggleButton,
		ToggleButtonGroup,
		VStack
	} from '@astryx-svelte/core';
	import componentRegistry from '$lib/generated/component-registry.js';
	import exampleRegistry from '$lib/generated/example-registry.js';
	import ShowcaseThumbnail from '$lib/shell/showcase-thumbnail.svelte';
	import { importerFor } from '$lib/shell/example-modules.js';
	import { componentHref } from '$lib/shell/links.js';

	/**
	 * The templates gallery — upstream's `/templates`, over the templates this
	 * port actually ships.
	 *
	 * **Which templates those are is the one thing to read before judging this
	 * page.** Upstream's CLI publishes two kinds under `assets/templates/`:
	 * `type: 'page'` (43 whole pages at 0.3.0, of which its own gallery lists the
	 * 32 that are `isReady && !isHiddenFromOverview`) and `type: 'block'` (614 doc
	 * files, 629 once `alsoExampleFor` targets are counted). `astryx template
	 * --list` lists both. Its docsite's `/templates` shows only the pages, because
	 * its `TemplateThumbnail` renders each one's `page.tsx` live — and **not one
	 * page template is ported here**; their sources are React and the
	 * transcription is Phase 5 work that has not started. A gallery of 43 cards
	 * with no preview and nothing behind them would advertise something this port
	 * does not have.
	 *
	 * The **blocks** are the opposite case: all 629 that target a ported component
	 * have a Svelte rewrite (`coverage.examplesPending` is 0), each one transcribed
	 * from upstream's `.tsx` rather than authored. So this page is upstream's
	 * gallery — its header, its `ToggleButtonGroup` category filter, its
	 * `ClickableCard` + hover `Overlay` tile — over the half of upstream's own
	 * template set that exists here. The page templates return to it when they land.
	 *
	 * Two upstream affordances are absent and neither is a styling choice:
	 * **"Open in Playground"** needs `/playground`, which this port does not have,
	 * and the **preview dialog** (`TemplatePreviewDialog`, with `?preview=` in the
	 * URL and prev/next) shows a full-bleed render of a whole page — worth building
	 * for pages, and redundant for a block whose live preview and source already
	 * sit on the component page the tile links to.
	 *
	 * Categories are upstream's twelve gallery buckets, taken from each block's
	 * target component. Blocks below the fold never import at all — `ShowcaseThumbnail`
	 * gates on an `IntersectionObserver` — which is what makes 619 live tiles on
	 * one page affordable: at 1440px only nine are ever mounted at once.
	 */

	/** Upstream's `CATEGORIES`, in upstream's (alphabetical) order. */
	const CATEGORIES = [
		'Action',
		'Chat',
		'Container',
		'Content',
		'Data Input',
		'Data Visualization',
		'Feedback & Status',
		'Layout',
		'Navigation',
		'Overlay',
		'Table & List',
		'Utility'
	];

	const ALL = 'All';

	interface TemplateItem {
		id: string;
		block: string;
		name: string;
		description: string;
		component: string;
		componentLabel: string;
		category: string;
	}

	/** Category per component name, and the label the tile captions with. */
	const componentMeta = $derived.by(() => {
		// A scratch map rebuilt inside a derived — nothing reads it as state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, { category: string; displayName: string }>();
		for (const entry of componentRegistry) {
			map.set(entry.name, {
				category: entry.category ?? '',
				displayName: entry.displayName
			});
		}
		return map;
	});

	/**
	 * Every block, flattened and ordered as the registry orders it within a
	 * component (showcase first, then alphabetical), components alphabetical.
	 *
	 * A block whose target has no *gallery* category is dropped rather than
	 * bucketed into an invented one — the rule the components gallery already
	 * uses. That is exactly **ten** blocks and they are all the same shape: the
	 * hook-usage blocks (`useTooltip`, `useLayer`, `usePopover`, …), whose targets
	 * are hooks and therefore carry the hook vocabulary (`interaction`, `focus`,
	 * `layout`) rather than one of upstream's twelve buckets. They are on their
	 * hook's own page, where a hook's usage belongs. 629 → 619.
	 */
	const items = $derived.by(() => {
		const flat: TemplateItem[] = [];
		for (const [component, blocks] of Object.entries(exampleRegistry.byComponent)) {
			const meta = componentMeta.get(component);
			if (!meta || !CATEGORIES.includes(meta.category)) continue;
			for (const block of blocks) {
				if (!block.hasSvelte) continue;
				flat.push({
					id: block.id,
					block: block.block,
					name: block.name,
					description: block.description,
					component,
					componentLabel: meta.displayName,
					category: meta.category
				});
			}
		}
		return flat;
	});

	/** `All` plus each category actually present, in upstream's order. */
	const categories = $derived([
		ALL,
		...CATEGORIES.filter((category) => items.some((item) => item.category === category))
	]);

	let activeCategory = $state(ALL);

	const filtered = $derived(
		activeCategory === ALL ? items : items.filter((item) => item.category === activeCategory)
	);
</script>

<svelte:head>
	<title>Templates · astryx-svelte</title>
	<meta
		name="description"
		content="Ready-to-use blocks from the Astryx template set, every one rewritten in Svelte with its source on the component page."
	/>
</svelte:head>

<Section maxWidth={1200} padding={6} style="margin-inline: auto;">
	<VStack gap={10}>
		<VStack gap={6} align="stretch">
			<VStack gap={2}>
				<Heading level={1} type="display-1" justify="center">Templates</Heading>
				<Text type="large" weight="normal" color="secondary" justify="center">
					Ready-to-use blocks to kickstart your project — {items.length} of them, each rewritten in Svelte
					from the Astryx CLI's own template set.
				</Text>
				<!-- Stated rather than implied, on the components gallery's rule: the
				     page names the half of upstream's template set that is missing
				     instead of leaving a reader to infer that blocks are all there is. -->
				<Text type="supporting" color="secondary" justify="center">
					Upstream's 43 whole-page templates are not ported yet; these are the block templates.
				</Text>
			</VStack>
			<div class="category-filter">
				<ToggleButtonGroup
					label="Filter templates by category"
					value={activeCategory}
					onChange={(value: string | null) => (activeCategory = value ?? ALL)}
					size="sm"
				>
					{#each categories as category (category)}
						<ToggleButton value={category} label={category} />
					{/each}
				</ToggleButtonGroup>
			</div>
		</VStack>

		<Grid columns={{ minWidth: 320, repeat: 'fill' }} gap={4} rowGap={5} width="100%">
			{#each filtered as item (item.id)}
				<!--
					Declared here rather than inside `ClickableCard`: a `{#snippet}` that is
					a *direct* child of a component is read as one of its props, and
					`ClickableCard` has no `overlayContent`. Inside the `{#each}` it is an
					ordinary local snippet that closes over `item`, which is what `Overlay`
					needs — its `content` takes no arguments, so a page-level snippet
					parameterised by the item could not be passed to it.

					No colour props on the text: `OverlayScrim` wraps its children in a
					`MediaTheme` at the scrim's own mode, so the defaults already resolve
					against the dark tint. Upstream's overlay passes none either.
				-->
				{#snippet overlayContent()}
					<div class="tile-scrim">
						<Text type="body" weight="bold">{item.componentLabel}</Text>
						<!-- 35 of upstream's 629 blocks carry no `description`, all of them
						     showcase blocks whose whole description *is* the component's own
						     page. The name fills the line rather than leaving the scrim with
						     a heading and a gap. -->
						<Text type="supporting" maxLines={3}>{item.description || item.name}</Text>
					</div>
				{/snippet}
				<VStack gap={1}>
					<ClickableCard
						label="{item.name} — open {item.componentLabel}"
						href={componentHref(item.component)}
						padding={0}
						variant="transparent"
					>
						<!-- Upstream's tile: the thumbnail with a hover scrim carrying the
						     name and description. Its scrim also holds two buttons; both
						     lead somewhere this port does not have (see the component
						     docstring), so the card itself is the only target and the
						     scrim stays presentational. -->
						<Overlay showOn="hover-or-focus" scrim="dark" align="end" content={overlayContent}>
							<ShowcaseThumbnail load={importerFor(item.id)} />
						</Overlay>
					</ClickableCard>
					<!-- The block's own name, not its component's: five `AppShell` tiles in
					     a row all captioned "App Shell" read as a repeat rather than as five
					     templates. The component is what the hover scrim says. -->
					<Text type="supporting" color="secondary">{item.name}</Text>
				</VStack>
			{/each}
		</Grid>
	</VStack>
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
	 */
	.category-filter :global(.astryx-toggle-button-group) {
		flex-wrap: wrap;
		justify-content: center;
	}

	/*
	 * Upstream's scrim content is a `VStack justify="end" align="start"
	 * height="100%" width="100%"` — the scrim itself only supplies the tint, the
	 * padding and the gap, and the content decides it sits bottom-left. Without
	 * this the two lines land top-right, because the scrim's own `align` is
	 * `end` on the cross axis.
	 */
	.tile-scrim {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		align-items: flex-start;
		justify-content: flex-end;
		width: 100%;
		height: 100%;
	}
</style>
