<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import {
		Button,
		Card,
		ClickableCard,
		CodeBlock,
		Divider,
		Grid,
		Heading,
		Popover,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import componentRegistry from '$lib/generated/component-registry.js';
	import coverage from '$lib/generated/coverage.js';
	import exampleRegistry from '$lib/generated/example-registry.js';
	import ShowcaseThumbnail from '$lib/shell/showcase-thumbnail.svelte';
	import { importerFor } from '$lib/shell/example-modules.js';
	import { componentHref } from '$lib/shell/links.js';

	/**
	 * The components gallery — upstream's `ComponentsGalleryPage`.
	 *
	 * A *visual* index: every tile is a live render of that component's showcase
	 * block, scaled down, so the page is browsable by eye rather than by reading
	 * names. An earlier revision of this page listed names and descriptions in
	 * `Card`s, which is not what upstream shows.
	 *
	 * Only ported components appear — `coverage.unported` names the rest, and
	 * listing something this port does not ship would be the same defect as
	 * inventing it.
	 */

	/**
	 * Upstream's `CATEGORIES`, in upstream's order — which is alphabetical, so
	 * Chat sits second rather than near the end.
	 */
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

	/** The showcase block per component, which is what a tile renders. */
	const showcaseFor = $derived.by(() => {
		// A scratch map inside a derived, rebuilt on every recompute — nothing
		// reads it as state, so it stays a plain Map.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, { id: string; hasSvelte: boolean }>();
		for (const [name, entries] of Object.entries(exampleRegistry.byComponent)) {
			const showcase = entries.find((entry) => entry.isShowcase);
			if (showcase) map.set(name, { id: showcase.id, hasSvelte: showcase.hasSvelte });
		}
		return map;
	});

	/**
	 * Upstream's filter, predicate for predicate: hidden from the overview,
	 * hidden outright, hooks (`name.startsWith('use')`), uncategorised entries,
	 * and the whole `Utilities` group are all skipped. Registry order is kept —
	 * upstream does not re-sort within a category.
	 */
	const grouped = $derived.by(() =>
		CATEGORIES.map((category) => ({
			category,
			entries: componentRegistry.filter(
				(entry) =>
					!entry.isHiddenFromOverview &&
					!entry.hidden &&
					!entry.name.startsWith('use') &&
					entry.category != null &&
					entry.group !== 'Utilities' &&
					entry.category === category
			)
		})).filter((group) => group.entries.length > 0)
	);
</script>

<Seo
	title="Components"
	description="All 101 Astryx components in Svelte 5 — accessible, themeable, and checked against upstream's compiled CSS. Copy-ready examples for every variant and state."
/>

{#snippet installSteps()}
	<VStack gap={3}>
		<VStack gap={1}>
			<Text type="body" weight="bold">1. Install the package</Text>
			<Card padding={0}>
				<CodeBlock
					code="npm install {coverage.corePackage.name}"
					language="bash"
					container="section"
					hasCopyButton
				/>
			</Card>
		</VStack>
		<VStack gap={1}>
			<Text type="body" weight="bold">2. Import a component</Text>
			<Card padding={0}>
				<!-- Upstream imports from a per-component subpath
				     (`@astryxdesign/core/ComponentName`); this port publishes a single
				     barrel, which is what every page's import snippet shows. -->
				<CodeBlock
					code={`import { ... } from '${coverage.corePackage.name}';`}
					language="typescript"
					container="section"
					hasCopyButton
				/>
			</Card>
		</VStack>
	</VStack>
{/snippet}

<!--
	`margin-inline: auto` belongs on the `Section` itself — upstream's
	`xstyle={{marginInline: 'auto'}}`. Putting it on a wrapper does nothing: the
	wrapper is a full-width block, so it is already "centred" and the capped
	Section inside it stays hard against the left edge.

	`style` rather than a scoped class because Svelte's style scoping cannot reach
	inside a child component, and `xstyle` is StyleX, which may not be imported
	from a `.svelte` file.
-->
<Section maxWidth={1200} padding={6} style="margin-inline: auto;">
	<VStack gap={10}>
		<VStack gap={4} hAlign="center">
			<VStack gap={2} hAlign="center">
				<Text type="display-1" justify="center">Browse the library</Text>
				<Text type="body" color="secondary" justify="center">
					Every component, with copy-ready examples for every variant, state, and pattern.
				</Text>
			</VStack>
			<!--
				`label` is this port's addition (it is `Popover`'s public name for
				`usePopover`'s `dialogLabel`). Upstream's gallery passes only `width`
				and `content`, so its popover is a `role="dialog"` with no accessible
				name — assistive tech announces "dialog" and nothing else. `usePopover`
				warns about exactly that, on every visit to this page, and the warning
				is a faithful port of upstream's own. Named rather than replicated, on
				the `Code/CodeInlineInParagraph` precedent: an a11y defect on a page
				*we* ship is fixed and documented, where a component's own behaviour
				would be replicated. The name matches the trigger's label.
			-->
			<Popover width={360} content={installSteps} label="Install core library">
				<Button variant="primary" size="lg" label="Install core library" />
			</Popover>
		</VStack>

		{#each grouped as group (group.category)}
			<Divider />
			<VStack gap={4}>
				<Heading level={2}>{group.category}</Heading>
				<Grid columns={{ minWidth: 300, repeat: 'fill' }} gap={3} rowGap={4}>
					{#each group.entries as entry (entry.name)}
						{@const showcase = showcaseFor.get(entry.name)}
						<VStack gap={1}>
							<ClickableCard
								label={entry.displayName}
								href={componentHref(entry.name)}
								padding={0}
								variant="transparent"
							>
								{#if showcase}
									<ShowcaseThumbnail load={showcase.hasSvelte ? importerFor(showcase.id) : null} />
								{:else}
									<div class="tile-placeholder"></div>
								{/if}
							</ClickableCard>
							<Text type="supporting">{entry.displayName}</Text>
						</VStack>
					{/each}
				</Grid>
			</VStack>
		{/each}
	</VStack>
</Section>

<style>
	/* Upstream's `styles.cardImage`: the tile for a component with no showcase
	   block. Same box as a thumbnail, so the grid rows stay even. */
	.tile-placeholder {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 10;
		background-color: var(--color-background-muted);
		border-radius: var(--radius-container);
	}
</style>
