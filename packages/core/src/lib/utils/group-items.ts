import type { SearchableItem } from '../components/typeahead/types.js';

/**
 * Ported from Astryx's `utils/groupItems.ts` — a verbatim transcription. It was
 * the one Phase 1 utility deferred, because it is typed against `Typeahead`'s
 * `SearchableItem` and had nothing to import until that component landed.
 *
 * Upstream's consumers are `CommandPalette` and the trigger menu, neither of
 * which is ported yet; it is published anyway because `utils/index.ts` does.
 */

/**
 * A group of items with an optional heading.
 * `heading` is null for ungrouped items.
 */
export interface ItemGroup<T extends SearchableItem = SearchableItem> {
	heading: string | null;
	items: T[];
}

/**
 * Extract the group string from an item's `auxiliaryData`.
 */
export function getItemGroup(item: SearchableItem): string | undefined {
	const aux = item.auxiliaryData as Record<string, unknown> | undefined;
	return typeof aux?.group === 'string' ? aux.group : undefined;
}

/**
 * Group items by `auxiliaryData.group`, preserving insertion order of groups.
 * Ungrouped items are collected into a final group with `heading: null`.
 *
 * If no items have a group, returns a single entry with `heading: null`.
 *
 * @example
 * ```ts
 * const items = [
 *   { id: '1', label: 'Home', auxiliaryData: { group: 'Navigation' } },
 *   { id: '2', label: 'Settings', auxiliaryData: { group: 'Navigation' } },
 *   { id: '3', label: 'Dark mode', auxiliaryData: { group: 'Preferences' } },
 *   { id: '4', label: 'Help' }
 * ];
 *
 * groupItems(items);
 * // [
 * //   { heading: 'Navigation', items: [{id:'1',…}, {id:'2',…}] },
 * //   { heading: 'Preferences', items: [{id:'3',…}] },
 * //   { heading: null, items: [{id:'4',…}] }
 * // ]
 * ```
 */
export function groupItems<T extends SearchableItem>(items: T[]): ItemGroup<T>[] {
	const hasGroups = items.some((item) => getItemGroup(item) != null);

	if (!hasGroups) {
		return [{ heading: null, items }];
	}

	const groupOrder: string[] = [];
	const groups = new Map<string, T[]>();
	const ungrouped: T[] = [];

	for (const item of items) {
		const group = getItemGroup(item);
		if (group != null) {
			if (!groups.has(group)) {
				groupOrder.push(group);
				groups.set(group, []);
			}
			groups.get(group)?.push(item);
		} else {
			ungrouped.push(item);
		}
	}

	const result: ItemGroup<T>[] = groupOrder.map((heading) => ({
		heading,
		items: groups.get(heading) ?? []
	}));

	if (ungrouped.length > 0) {
		result.push({ heading: null, items: ungrouped });
	}

	return result;
}
