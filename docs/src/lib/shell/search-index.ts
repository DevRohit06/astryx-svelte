import componentRegistry from '$lib/generated/component-registry.js';
import docsRegistry from '$lib/generated/docs-registry.js';
import { componentHref, templatesHref, themesHref, topicHref } from './links.js';

/**
 * The whole search index, in the bundle.
 *
 * Upstream's `SearchPalette.tsx` builds a `createStaticSource` over the union of
 * components, doc topics, packages and templates, with keywords read from the
 * `.doc.mjs` `keywords` arrays — **no Algolia, no Pagefind**. The same data is
 * already generated here, so the same approach carries over unchanged; only the
 * item set is smaller, because templates and packages are out of the v1 cut.
 */

export interface SearchItem {
	id: string;
	label: string;
	/** `Components` / `Documentation` — the group heading in the palette. */
	section: string;
	description: string;
	href: string;
	keywords: string[];
}

function componentItems(): SearchItem[] {
	return componentRegistry
		.filter((entry) => !entry.hidden)
		.map((entry) => ({
			id: `component:${entry.name}`,
			label: entry.displayName,
			section: entry.isHook ? 'Utilities' : 'Components',
			description: entry.description ?? entry.usage?.description?.split('\n')[0] ?? '',
			href: componentHref(entry.name),
			keywords: [entry.name, ...entry.keywords]
		}));
}

function topicItems(): SearchItem[] {
	return docsRegistry.map((topic) => ({
		id: `topic:${topic.name}`,
		label: topic.title,
		section: 'Documentation',
		description: topic.description,
		href: topicHref(topic.name),
		keywords: [topic.name, topic.category ?? '']
	}));
}

/**
 * The two galleries, as two entries rather than one per item.
 *
 * Upstream indexes every template and every theme individually, from the
 * registries its palette already imports. This module is imported by
 * `+layout.svelte`, so it is in **every** page's bundle — and the two registries
 * that would be needed (`example-registry`, 296 KB; `theme-registry` plus the
 * eight theme objects) are currently confined to the routes that render them.
 * Pulling either into the root layout to index 637 rows nobody searches by name
 * is the trade the sidebar's own registry projection was written to avoid; the
 * pages themselves are what a reader is looking for.
 */
function pageItems(): SearchItem[] {
	return [
		{
			id: 'page:templates',
			label: 'Templates',
			section: 'Documentation',
			description: "Ready-to-use blocks from the Astryx CLI's template set.",
			href: templatesHref(),
			keywords: ['templates', 'blocks', 'examples', 'gallery']
		},
		{
			id: 'page:themes',
			label: 'Themes',
			section: 'Documentation',
			description: 'Browse and preview every published theme package.',
			href: themesHref(),
			keywords: ['themes', 'tokens', 'palette', 'dark mode', 'defineTheme']
		}
	];
}

/** Built once at module scope: the data is static and the list is ~150 entries. */
export const SEARCH_ITEMS: SearchItem[] = [...pageItems(), ...topicItems(), ...componentItems()];

/**
 * Case-insensitive substring ranking. A prefix match on the label outranks a
 * substring match, which outranks a keyword-only match — enough structure that
 * typing `but` puts Button first without pulling in a fuzzy-matching dependency
 * upstream does not have either.
 */
export function searchItems(query: string, limit = 20): SearchItem[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];

	const scored: { item: SearchItem; score: number }[] = [];

	for (const item of SEARCH_ITEMS) {
		const label = item.label.toLowerCase();
		let score = -1;

		if (label.startsWith(needle)) score = 0;
		else if (label.includes(needle)) score = 1;
		else if (item.keywords.some((keyword) => keyword.toLowerCase().includes(needle))) score = 2;
		else if (item.description.toLowerCase().includes(needle)) score = 3;

		if (score >= 0) scored.push({ item, score });
	}

	scored.sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label));
	return scored.slice(0, limit).map((entry) => entry.item);
}
