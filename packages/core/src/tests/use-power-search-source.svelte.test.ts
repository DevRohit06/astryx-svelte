/** PORTS: PowerSearch/usePowerSearchSource.test.ts */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PowerSearchSourceProbe from './fixtures/power-search-source-probe.svelte';
import type {
	PowerSearchAuxData,
	PowerSearchConfig,
	PowerSearchItem
} from '$lib/components/power-search/types.js';
import type { SearchSource } from '$lib/components/typeahead/types.js';

/**
 * Astryx's `PowerSearch/usePowerSearchSource.test.ts` at the **0.5.0** pin —
 * **35 upstream cases, 35 here**, in upstream's order and under upstream's
 * `describe`s, with every assertion verbatim. Nothing dropped, nothing added.
 *
 * The 4 that arrived at 0.5.0 are the `typed-result cap` describe (`caps
 * results for a typed query`, `never caps the field list for an empty query`)
 * and the two grouping cases (`orders ungrouped fields before named groups`,
 * `leaves ranked results flat and in relevance order`). All four came in with
 * `maxSearchResults` and `PowerSearchAuxData.group`, and the `field menu
 * grouping` block added to `PowerSearch.test.tsx` in the same release is their
 * DOM-level pair.
 *
 * (This header read "**31** upstream cases, 31 here", true at the v0.4.5 pin.)
 *
 * ## Why the client project
 *
 * `usePowerSearchSource` calls `useTranslator()`, which reads Svelte context and
 * therefore has to run inside a component's initialisation. That rules out a
 * bare call from a node test, and it rules out `svelte/server` too: an SSR
 * render returns a string, and the thing under test here is an object of
 * methods that no markup can carry. So this is a `*.svelte.test.ts` in the
 * **client** project, with `fixtures/power-search-source-probe.svelte` standing
 * in for `renderHook` — it runs both hooks at init, renders nothing, and exposes
 * the `SearchSource` as an instance `export const`.
 *
 * Two consequences, neither of which touches an assertion:
 *
 * - **`createSource` is async**, because `render` from `vitest-browser-svelte`
 *   v3 is; every `it` therefore awaits it. Upstream's helper is synchronous
 *   only because `renderHook` is.
 * - **`syncBootstrap` / `syncSearch` are kept verbatim**, including their
 *   `instanceof Promise` guards. They are what pins the source to the
 *   synchronous branch of `SearchSource`, which is a real property of the port.
 *
 * ## One note on upstream's assertion, kept as upstream wrote it
 *
 * `empty search returns same as bootstrap` uses `toEqual`, i.e. *structural*
 * equality, not `toBe`. The port's `allItems` is a `$derived` precisely so the
 * two calls return the same array instance — but upstream's case does not
 * assert that, so neither does this one. Strengthening it to `toBe` would be
 * coverage upstream does not have, and this file adds none. (The property was
 * checked by hand: the case passes today, and it still passes if `allItems` is
 * rebuilt per call, which is exactly why the `toEqual` cannot stand as proof of
 * the cache.)
 *
 * ## Two upstream behaviours the port replicates deliberately
 *
 * `usePowerSearchSource` keeps upstream's untrimmed-query slice (a leading space
 * desynchronises `rawValue`) and its raw-query content-search item. No case here
 * feeds a leading space, so none of them observe the first; the second is what
 * `content search item is first in results` and its neighbours assert.
 */

// =============================================================================
// Helpers
// =============================================================================

async function createSource(
	config: PowerSearchConfig,
	// Uncapped by default so these tests exercise matching and ranking rather
	// than the typed-result cap, which has its own test below.
	maxTypedResults: number = Number.POSITIVE_INFINITY
): Promise<SearchSource<PowerSearchItem>> {
	const screen = await render(PowerSearchSourceProbe, {
		props: { config, maxTypedResults }
	});
	return screen.component.result;
}

function syncBootstrap(source: SearchSource<PowerSearchItem>): PowerSearchItem[] {
	const result = source.bootstrap();
	if (result instanceof Promise) {
		throw new Error('Expected synchronous bootstrap');
	}
	return result;
}

function syncSearch(source: SearchSource<PowerSearchItem>, query: string): PowerSearchItem[] {
	const result = source.search(query);
	if (result instanceof Promise) {
		throw new Error('Expected synchronous search');
	}
	return result;
}

// =============================================================================
// Fixtures
// =============================================================================

const baseConfig: PowerSearchConfig = {
	name: 'TestSearch',
	fields: [
		{
			key: 'title',
			label: 'Title',
			defaultOperator: 'contains',
			operators: [
				{ key: 'contains', label: 'contains', value: { type: 'string' } },
				{ key: 'is', label: 'is', value: { type: 'string' } }
			]
		},
		{
			key: 'status',
			label: 'Status',
			defaultOperator: 'is',
			operators: [
				{
					key: 'is',
					label: 'is',
					value: {
						type: 'enum',
						values: [
							{ value: 'open', label: 'Open' },
							{ value: 'closed', label: 'Closed' }
						]
					}
				}
			]
		}
	]
};

const configWithContentSearch: PowerSearchConfig = {
	...baseConfig,
	contentSearchFieldKey: 'title'
};

const groupedConfig: PowerSearchConfig = {
	name: 'GroupedSearch',
	fields: [
		field('team_a', 'Field Team A', 'Team'),
		field('plain_a', 'Field Plain A'),
		field('time_a', 'Field Time A', 'Time'),
		field('team_b', 'Field Team B', 'Team'),
		field('plain_b', 'Field Plain B'),
		field('time_b', 'Field Time B', 'Time')
	]
};

function field(key: string, label: string, group?: string) {
	return {
		key,
		label,
		group,
		operators: [{ key: 'is', label: 'is', value: { type: 'string' } as const }]
	};
}

// =============================================================================
// Tests
// =============================================================================

describe('usePowerSearchSource', () => {
	describe('bootstrap (no query)', () => {
		it('returns only field names without operator labels', async () => {
			const source = await createSource(baseConfig);
			const items = syncBootstrap(source);

			expect(items.map((i: PowerSearchItem) => i.label)).toEqual(['Title', 'Status']);
		});

		it('sets defaultOperator on bootstrap items', async () => {
			const source = await createSource(baseConfig);
			const items = syncBootstrap(source);

			const titleAux = items[0].auxiliaryData as PowerSearchAuxData;
			expect(titleAux.fieldKey).toBe('title');
			expect(titleAux.operatorKey).toBe('contains');

			const statusAux = items[1].auxiliaryData as PowerSearchAuxData;
			expect(statusAux.fieldKey).toBe('status');
			expect(statusAux.operatorKey).toBe('is');
		});

		it('empty search returns same as bootstrap', async () => {
			const source = await createSource(baseConfig);
			expect(syncSearch(source, '')).toEqual(syncBootstrap(source));
		});

		it('orders ungrouped fields before named groups', async () => {
			const items = syncBootstrap(await createSource(groupedConfig));
			expect(items.map((item) => item.label)).toEqual([
				'Field Plain A',
				'Field Plain B',
				'Field Team A',
				'Field Team B',
				'Field Time A',
				'Field Time B'
			]);
			expect(items.map((item) => (item.auxiliaryData as PowerSearchAuxData).group)).toEqual([
				undefined,
				undefined,
				'Team',
				'Team',
				'Time',
				'Time'
			]);
		});
	});

	describe('search (with query)', () => {
		it('shows field name for partial match', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'tit');

			expect(results.some((r) => r.label === 'Title')).toBe(true);
		});

		it('shows all field+operator combos for partial match', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'tit');
			const labels = results.map((r) => r.label);

			expect(labels).toContain('Title');
			expect(labels).toContain('Title contains');
			expect(labels).toContain('Title is');
		});

		it('matches query against combined field and operator label', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title contains');

			expect(results.some((r) => r.label === 'Title contains')).toBe(true);
		});

		it('matches partial field + operator query', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title con');

			expect(results.some((r) => r.label === 'Title contains')).toBe(true);
		});

		it('field name item uses defaultOperator', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'tit');

			const titleItem = results.find((r) => r.label === 'Title');
			const aux = titleItem?.auxiliaryData as PowerSearchAuxData;
			expect(aux.operatorKey).toBe('contains');
		});

		it('field+operator items use specific operator', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'tit');

			const isItem = results.find((r) => r.label === 'Title is');
			const aux = isItem?.auxiliaryData as PowerSearchAuxData;
			expect(aux.operatorKey).toBe('is');
		});

		it('leaves ranked results flat and in relevance order', async () => {
			const results = syncSearch(await createSource(groupedConfig), 'field');
			expect(results.slice(0, 6).map((item) => item.label)).toEqual([
				'Field Team A',
				'Field Team A is',
				'Field Plain A',
				'Field Plain A is',
				'Field Time A',
				'Field Time A is'
			]);
			expect(
				results.every((item) => (item.auxiliaryData as PowerSearchAuxData).group == null)
			).toBe(true);
		});
	});

	describe('contentSearchFieldKey', () => {
		it('shows content search item for non-matching query', async () => {
			const source = await createSource(configWithContentSearch);
			const results = syncSearch(source, 'foobar');

			expect(results[0].label).toBe('"foobar"');
			const aux = results[0].auxiliaryData as PowerSearchAuxData;
			expect(aux.fieldKey).toBe('title');
			expect(aux.operatorKey).toBe('contains');
			expect(aux.filterValue).toEqual({ type: 'string', value: 'foobar' });
		});

		it('does not show content search item when query exactly matches a field name', async () => {
			const source = await createSource(configWithContentSearch);
			const results = syncSearch(source, 'title');

			const contentItem = results.find((r) => r.label.startsWith('"'));
			expect(contentItem).toBeUndefined();
		});

		it('does not show content search item when query exactly matches field + operator', async () => {
			const source = await createSource(configWithContentSearch);
			const results = syncSearch(source, 'Title contains');

			const contentItem = results.find((r) => r.label.startsWith('"'));
			expect(contentItem).toBeUndefined();
		});

		it('exact match check is case-insensitive', async () => {
			const source = await createSource(configWithContentSearch);
			const results = syncSearch(source, 'TITLE');

			const contentItem = results.find((r) => r.label.startsWith('"'));
			expect(contentItem).toBeUndefined();
		});

		it('shows content search item for partial field match', async () => {
			const source = await createSource(configWithContentSearch);
			const results = syncSearch(source, 'tit');

			expect(results[0].label).toBe('"tit"');
			// Field and field+operator results should still appear after
			expect(results.some((r) => r.label === 'Title')).toBe(true);
			expect(results.some((r) => r.label === 'Title contains')).toBe(true);
		});

		it('does not show content search item when contentSearchFieldKey is not set', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'foobar');

			const contentItem = results.find((r) => r.label.startsWith('"'));
			expect(contentItem).toBeUndefined();
		});

		it('content search item is first in results', async () => {
			const source = await createSource(configWithContentSearch);
			const results = syncSearch(source, 'sta');

			expect(results[0].label).toBe('"sta"');
			expect(results.length).toBeGreaterThan(1);
		});
	});

	describe('field+operator+value suggestions', () => {
		it('suggests all string-valued operators for "title foobar"', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title foobar');

			const valueItems = results.filter((r) => r.label.includes('"foobar"'));
			expect(valueItems.map((r) => r.label)).toEqual([
				'Title contains "foobar"',
				'Title is "foobar"'
			]);

			const containsAux = valueItems[0].auxiliaryData as PowerSearchAuxData;
			expect(containsAux.fieldKey).toBe('title');
			expect(containsAux.operatorKey).toBe('contains');
			expect(containsAux.filterValue).toEqual({
				type: 'string',
				value: 'foobar'
			});

			const isAux = valueItems[1].auxiliaryData as PowerSearchAuxData;
			expect(isAux.operatorKey).toBe('is');
		});

		it('suggests only the matching operator for "title contains foobar"', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title contains foobar');

			const valueItems = results.filter((r) => r.label.includes('"foobar"'));
			expect(valueItems).toHaveLength(1);
			expect(valueItems[0].label).toBe('Title contains "foobar"');
			const aux = valueItems[0].auxiliaryData as PowerSearchAuxData;
			expect(aux.operatorKey).toBe('contains');
			expect(aux.filterValue).toEqual({ type: 'string', value: 'foobar' });
		});

		it('does not suggest "<field> <value>" matches when explicit operator matched', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title contains foobar');

			// Should NOT have 'Title is "contains foobar"' or similar
			const spurious = results.filter((r) => r.label.includes('"contains foobar"'));
			expect(spurious).toHaveLength(0);
		});

		it('suggests only the matching operator for "title is foobar"', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title is foobar');

			const valueItems = results.filter((r) => r.label.includes('"foobar"'));
			expect(valueItems).toHaveLength(1);
			expect(valueItems[0].label).toBe('Title is "foobar"');
			const aux = valueItems[0].auxiliaryData as PowerSearchAuxData;
			expect(aux.operatorKey).toBe('is');
		});

		it('is case-insensitive for field and operator matching', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'TITLE CONTAINS hello');

			const valueItem = results.find((r) => r.label === 'Title contains "hello"');
			expect(valueItem).toBeDefined();
		});

		it('preserves original case of the value', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title FooBar');

			const valueItem = results.find((r) => r.label === 'Title contains "FooBar"');
			expect(valueItem).toBeDefined();
			const aux = valueItem!.auxiliaryData as PowerSearchAuxData;
			expect(aux.filterValue).toEqual({ type: 'string', value: 'FooBar' });
		});

		it('does not suggest value match for non-string operators', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'status foobar');

			const valueItem = results.find((r) => r.label.includes('"foobar"'));
			expect(valueItem).toBeUndefined();
		});

		it('does not suggest value match when remainder matches an operator prefix', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'title con');

			// "con" is a prefix of "contains", so should not suggest a value match
			const valueItem = results.find((r) => r.label.includes('"con"'));
			expect(valueItem).toBeUndefined();
		});

		it('does not suggest value match when field has isValueMatchAllowed=false', async () => {
			const config: PowerSearchConfig = {
				name: 'Test',
				fields: [
					{
						key: 'title',
						label: 'Title',
						isValueMatchAllowed: false,
						operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
					}
				]
			};
			const source = await createSource(config);
			const results = syncSearch(source, 'title foobar');

			const valueItem = results.find((r) => r.label.includes('"foobar"'));
			expect(valueItem).toBeUndefined();
		});

		it('uses string_list filter value for string_list operators', async () => {
			const config: PowerSearchConfig = {
				name: 'Test',
				fields: [
					{
						key: 'tags',
						label: 'Tags',
						operators: [
							{
								key: 'contains',
								label: 'contains',
								value: { type: 'string_list' }
							}
						]
					}
				]
			};
			const source = await createSource(config);
			const results = syncSearch(source, 'tags hello');

			const valueItem = results.find((r) => r.label === 'Tags contains "hello"');
			expect(valueItem).toBeDefined();
			const aux = valueItem!.auxiliaryData as PowerSearchAuxData;
			expect(aux.filterValue).toEqual({ type: 'string_list', value: ['hello'] });
		});

		it('suggests matching enum values for "<field> <value>"', async () => {
			const config: PowerSearchConfig = {
				name: 'Test',
				fields: [
					{
						key: 'genre',
						label: 'Genre',
						operators: [
							{
								key: 'is',
								label: 'is',
								value: {
									type: 'enum',
									values: [
										{ value: 'fiction', label: 'Fiction' },
										{ value: 'nonfiction', label: 'Non-Fiction' },
										{ value: 'science', label: 'Science' }
									]
								}
							},
							{
								key: 'is_not',
								label: 'is not',
								value: {
									type: 'enum',
									values: [
										{ value: 'fiction', label: 'Fiction' },
										{ value: 'nonfiction', label: 'Non-Fiction' },
										{ value: 'science', label: 'Science' }
									]
								}
							}
						]
					}
				]
			};
			const source = await createSource(config);
			const results = syncSearch(source, 'genre fiction');

			const valueItems = results.filter(
				(r) => r.label.startsWith('Genre ') && r.label.includes('Fiction')
			);
			// "fiction" matches both "Fiction" and "Non-Fiction"
			expect(valueItems.map((r) => r.label)).toEqual([
				'Genre is Fiction',
				'Genre is Non-Fiction',
				'Genre is not Fiction',
				'Genre is not Non-Fiction'
			]);

			const isAux = valueItems[0].auxiliaryData as PowerSearchAuxData;
			expect(isAux.filterValue).toEqual({ type: 'enum', value: 'fiction' });
		});

		it('suggests only matching operator for "<field> <operator> <value>" with enum', async () => {
			const config: PowerSearchConfig = {
				name: 'Test',
				fields: [
					{
						key: 'genre',
						label: 'Genre',
						operators: [
							{
								key: 'is',
								label: 'is',
								value: {
									type: 'enum',
									values: [
										{ value: 'fiction', label: 'Fiction' },
										{ value: 'nonfiction', label: 'Non-Fiction' }
									]
								}
							},
							{
								key: 'is_not',
								label: 'is not',
								value: {
									type: 'enum',
									values: [
										{ value: 'fiction', label: 'Fiction' },
										{ value: 'nonfiction', label: 'Non-Fiction' }
									]
								}
							}
						]
					}
				]
			};
			const source = await createSource(config);
			const results = syncSearch(source, 'genre is fiction');

			const valueItems = results.filter((r) => r.label === 'Genre is Fiction');
			expect(valueItems).toHaveLength(1);
			// Should NOT include "is not" operator results
			const isNotItems = results.filter((r) => r.label.startsWith('Genre is not'));
			expect(isNotItems).toHaveLength(0);
		});

		it('suggests multiple matching enum values for partial match', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'status o');

			// "o" matches "Open" and "Closed"
			const valueItems = results.filter(
				(r) => r.label.startsWith('Status is ') && r.label !== 'Status is'
			);
			expect(valueItems.map((r) => r.label)).toEqual(['Status is Open', 'Status is Closed']);
		});

		it('does not suggest enum values when no labels match', async () => {
			const source = await createSource(baseConfig);
			const results = syncSearch(source, 'status xyz');

			const valueItems = results.filter(
				(r) => r.label.startsWith('Status is ') && r.label !== 'Status is'
			);
			expect(valueItems).toHaveLength(0);
		});

		it('uses enum_list filter value for enum_list operators', async () => {
			const config: PowerSearchConfig = {
				name: 'Test',
				fields: [
					{
						key: 'tags',
						label: 'Tags',
						operators: [
							{
								key: 'includes',
								label: 'includes',
								value: {
									type: 'enum_list',
									values: [
										{ value: 'bug', label: 'Bug' },
										{ value: 'feature', label: 'Feature' }
									]
								}
							}
						]
					}
				]
			};
			const source = await createSource(config);
			const results = syncSearch(source, 'tags bug');

			const valueItem = results.find((r) => r.label === 'Tags includes Bug');
			expect(valueItem).toBeDefined();
			const aux = valueItem!.auxiliaryData as PowerSearchAuxData;
			expect(aux.filterValue).toEqual({ type: 'enum_list', value: ['bug'] });
		});
	});
});

describe('typed-result cap', () => {
	const manyFields: PowerSearchConfig = {
		name: 'many',
		fields: Array.from({ length: 25 }, (_, i) => ({
			key: `field_${i}`,
			label: `Zebra ${String(i).padStart(2, '0')}`,
			operators: [{ key: 'is', label: 'is', value: { type: 'string' } as const }]
		}))
	};

	it('caps results for a typed query', async () => {
		const source = await createSource(manyFields, 10);
		expect(source.search('zebra')).toHaveLength(10);
	});

	it('never caps the field list for an empty query', async () => {
		const source = await createSource(manyFields, 10);
		expect(syncBootstrap(source)).toHaveLength(25);
		expect(source.search('')).toHaveLength(25);
	});
});
