import type { SearchableItem, SearchSource } from './types.js';

/**
 * Ported from Astryx's `Typeahead/createStaticSource.ts` — a verbatim
 * transcription; the module is pure and has no React in it.
 */

export interface CreateStaticSourceOptions<T extends SearchableItem = SearchableItem> {
	/**
	 * Extract additional search terms from an item.
	 * These are checked alongside the label during search.
	 *
	 * @example
	 * ```ts
	 * createStaticSource(items, {
	 *   keywords: (item) => item.auxiliaryData?.aliases ?? []
	 * });
	 * ```
	 */
	keywords?: (item: T) => string[];
}

/**
 * Create a search source from a static array of items.
 *
 * Filters by substring match on `label` and optional keywords.
 * For anything beyond substring matching (fuzzy, ranked, server-side),
 * implement `SearchSource` directly.
 *
 * @example
 * ```ts
 * // Simple — label-only matching
 * const source = createStaticSource([
 *   { id: 'home', label: 'Home' },
 *   { id: 'settings', label: 'Settings' }
 * ]);
 *
 * // With keywords — also matches on aliases
 * const source = createStaticSource(commands, {
 *   keywords: (item) => item.auxiliaryData?.aliases ?? []
 * });
 * ```
 */
export function createStaticSource<T extends SearchableItem>(
	items: T[],
	options?: CreateStaticSourceOptions<T>
): SearchSource<T> {
	const getKeywords = options?.keywords;

	return {
		search(query: string): T[] {
			const lower = query.toLowerCase().trim();
			if (lower === '') {
				return items;
			}

			return items.filter((item) => {
				if (item.label.toLowerCase().includes(lower)) {
					return true;
				}
				if (getKeywords) {
					return getKeywords(item).some((kw) => kw.toLowerCase().includes(lower));
				}
				return false;
			});
		},

		bootstrap(): T[] {
			return items;
		}
	};
}
