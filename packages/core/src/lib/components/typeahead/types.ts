import type { Snippet } from 'svelte';

/**
 * Ported from Astryx's `Typeahead/types.ts`. The one translation is `element`:
 * upstream's `ReactNode` becomes a `Snippet`, the leaf-slot shape settled for
 * `Item`/`Toast`. It is content the *caller* authors and the component renders
 * verbatim, so there is no string branch to discriminate.
 */

/**
 * Minimal item interface for search results.
 * Extend with `auxiliaryData` for custom data per item.
 *
 * @example
 * ```ts
 * interface UserItem extends SearchableItem<{ avatar: string; role: string }> {}
 *
 * const user: UserItem = {
 *   id: '1',
 *   label: 'Jane Doe',
 *   auxiliaryData: { avatar: '/jane.jpg', role: 'Engineer' }
 * };
 * ```
 */
export interface SearchableItem<TAuxData = unknown> {
	/** Unique identifier for the item. */
	id: string;

	/** Display label for the item. */
	label: string;

	/**
	 * Pre-rendered content for the row. When provided, takes priority over
	 * `renderItem` and the default label rendering.
	 */
	element?: Snippet;

	/**
	 * Arbitrary extra data associated with the item.
	 * Use generics to type this for your specific use case.
	 */
	auxiliaryData?: TAuxData;
}

/**
 * Search source interface for providing items to typeahead components.
 * Supports both synchronous and asynchronous search.
 *
 * @example
 * ```ts
 * // Sync search source
 * const fruitSource: SearchSource = {
 *   search: (query) => fruits.filter((f) => f.label.includes(query)),
 *   bootstrap: () => fruits.slice(0, 5)
 * };
 * ```
 */
export interface SearchSource<T extends SearchableItem = SearchableItem> {
	/**
	 * Called on query change. Returns matching items.
	 * Can be synchronous or asynchronous.
	 *
	 * For expensive operations (API calls, large datasets), consider caching
	 * results internally to avoid redundant work on repeated queries.
	 */
	search(query: string): Promise<T[]> | T[];

	/**
	 * Called on init/focus. Returns initial/default items.
	 * Can be synchronous or asynchronous.
	 */
	bootstrap(): Promise<T[]> | T[];

	/**
	 * Cancel any in-flight search. Called when a new search supersedes
	 * a previous one, or when the dropdown closes.
	 *
	 * Useful for aborting network requests (e.g., via `AbortController`).
	 * Optional — if not implemented, previous searches simply resolve and
	 * their results are discarded.
	 */
	cancel?(): void;
}
