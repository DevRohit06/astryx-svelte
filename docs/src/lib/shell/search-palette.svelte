<script lang="ts" module>
	import { SEARCH_ITEMS } from './search-index.js';
	import { createStaticSource } from '@astryx-svelte/core';
	import type { SearchableItem } from '@astryx-svelte/core';

	/** What the palette carries per row, beyond the id/label a source needs. */
	type SearchAux = { group: string; href: string; description: string };
	type SearchCommand = SearchableItem<SearchAux>;

	/**
	 * The index as `SearchableItem`s. `group` drives `CommandPalette`'s automatic
	 * grouping, so the Components / Documentation / Utilities headings the
	 * hand-built palette rendered by hand now come from the component itself.
	 *
	 * Built once at module scope, as the index it reads is.
	 */
	const COMMANDS: SearchCommand[] = SEARCH_ITEMS.map((item) => ({
		id: item.id,
		label: item.label,
		auxiliaryData: {
			group: item.section,
			href: item.href,
			description: item.description
		}
	}));

	const HREF_BY_ID = new Map(COMMANDS.map((c) => [c.id, c.auxiliaryData!.href]));

	const source = createStaticSource(COMMANDS, {
		keywords: (item) => SEARCH_ITEMS.find((s) => s.id === item.id)?.keywords ?? []
	});
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { CommandPalette, Text } from '@astryx-svelte/core';

	/**
	 * The `⌘K` palette — **now the real `CommandPalette`**, which is what batch 9
	 * set out to do. The seam this file has always been did its job: the shell
	 * still mounts `<SearchPalette bind:isOpen />` and nothing outside it changed.
	 *
	 * This is also upstream's own arrangement, which the hand-built version could
	 * only approximate: `SearchPalette.tsx` builds a `createStaticSource` over the
	 * union of components, doc topics, packages and templates with keywords read
	 * from each `.doc.mjs` — no Algolia, no Pagefind. The item set here is smaller
	 * only because templates and packages are out of the v1 cut.
	 *
	 * Three behaviours are now the component's rather than this file's: the
	 * grouped headings (from `auxiliaryData.group`), the arrow/Home/End/Enter
	 * keyboard model (`useCombobox`, so it matches `Selector`), and the empty
	 * states. The keyword-aware ranking in `search-index.ts` still serves the
	 * sidebar filter, which is not a combobox.
	 */
	interface Props {
		isOpen: boolean;
	}

	let { isOpen = $bindable(false) }: Props = $props();

	function handleValueChange(id: string): void {
		const href = HREF_BY_ID.get(id);
		isOpen = false;
		if (href == null) return;
		// `href` is already a resolved pathname — `search-index.ts` builds it
		// through `links.ts`, so resolving again would prepend the base path twice.
		void goto(href);
	}
</script>

{#snippet renderItem(item: SearchCommand)}
	<span class="palette-row">
		<span class="palette-label">{item.label}</span>
		{#if item.auxiliaryData?.description}
			<span class="palette-description">{item.auxiliaryData.description}</span>
		{/if}
	</span>
{/snippet}

{#snippet emptyBootstrapText()}
	<Text type="supporting" color="secondary">
		Type to search {SEARCH_ITEMS.length} components, hooks and documentation topics.
	</Text>
{/snippet}

<CommandPalette
	{isOpen}
	onOpenChange={(open) => (isOpen = open)}
	searchSource={source}
	onValueChange={handleValueChange}
	label="Search components and docs"
	width={560}
	{renderItem}
	{emptyBootstrapText}
	emptySearchText="No results."
/>

<style>
	/*
	 * Row layout only. `CommandPaletteItem` owns the padding, radius, highlight
	 * and selected states — this is the label/description stack inside it, which
	 * is `renderItem`'s job on both sides.
	 */
	.palette-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}

	.palette-label {
		font-weight: var(--font-weight-medium);
	}

	.palette-description {
		overflow: hidden;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
