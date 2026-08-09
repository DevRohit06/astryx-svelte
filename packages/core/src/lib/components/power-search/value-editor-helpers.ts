import type { SearchableItem, SearchSource } from '../typeahead/types.js';
import type { EnumItem } from './types.js';

/**
 * The two module-private helpers from Astryx's `PowerSearchValueEditor.tsx`,
 * lifted into a `.ts` sibling because the editors that use them are now separate
 * `.svelte` files (Svelte has no in-file component declaration — the
 * `LinkProvider/RouterLink.svelte` precedent).
 *
 * **`createStaticSource` is deliberately a second declaration.** `Typeahead`
 * already ships one (`typeahead/create-static-source.ts`, published upstream as
 * `Typeahead/createStaticSource`), and `PowerSearchValueEditor.tsx` declares its
 * own private copy anyway rather than importing it. Reaching for the published
 * one here would be de-duplicating upstream's source, which is the same call the
 * example blocks already settled the other way: upstream repeating a literal is
 * upstream's shape, not a defect to tidy. The two are not identical either —
 * this one is synchronous and unmemoised where `Typeahead`'s is the published,
 * documented helper.
 */

export function createStaticSource(items: SearchableItem[]): SearchSource<SearchableItem> {
	return {
		search(query: string) {
			const lower = query.toLowerCase();
			return items.filter((item) => item.label.toLowerCase().includes(lower));
		},
		bootstrap() {
			return items;
		}
	};
}

export function enumItemsToSearchableItems(values: ReadonlyArray<EnumItem>): SearchableItem[] {
	return values.map((item) => ({
		id: item.value,
		label: item.label
	}));
}

/**
 * The empty source both `StringListEditor` and `EntityListEditor` fall back to
 * when their operator supplies none — upstream's inline
 * `{search: () => [], bootstrap: () => []}`, which accepts anything typed
 * (`StringListEditor` pairs it with `hasCreate`).
 */
export const emptySearchSource: SearchSource<SearchableItem> = {
	search: () => [],
	bootstrap: () => []
};
