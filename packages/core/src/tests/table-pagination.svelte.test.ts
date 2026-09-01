/** PORTS: Table/plugins/pagination/useTablePagination.test.tsx */

import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { paginateData } from '$lib/components/table/plugins/pagination/paginate-data.js';
import Fixture, { generateItems } from './fixtures/table-pagination-fixture.svelte';
import Probe from './fixtures/table-pagination-probe.svelte';
import DualPlugins from './fixtures/table-pagination-dual-fixture.svelte';
import CursorTable from './fixtures/table-pagination-cursor-fixture.svelte';

/**
 * Astryx's `Table/plugins/pagination/useTablePagination.test.tsx`, ported case
 * for case — **39 of upstream's 40 at the 0.5.0 pin**, in upstream's order and
 * under its titles (7 `paginateData`, 2 plugin hook, 12 plugin behavior, 5
 * Table integration, 5 props passthrough, 4 edge cases, 4 accessibility).
 *
 * **0.5.0 replaced one case with two**, and this file still carries the
 * replaced one. Upstream **removed** `transformTableContext renders Pagination
 * above and below` — which is still here, at `:172` — and **added**
 * `transformTableContext renders distinctly named Pagination above and below`
 * plus `position="both" interpolates a consumer label into distinct nav names`.
 * Both additions are about the same thing: when `position="both"` renders two
 * navs, each needs its own accessible name, so a screen-reader user can tell
 * the top one from the bottom one. Porting them means renaming the case at
 * `:172` rather than adding beside it. (This header read "**39 of 39** …
 * Nothing dropped", true at the v0.4.5 pin.)
 *
 * The seven `paginateData` cases are pure and would run in the node project,
 * but upstream keeps them in one file with the rendering cases and the count is
 * the contract — the same call `pagination.svelte.test.ts` makes for
 * `generatePageRange`.
 *
 * Upstream's `PaginatedTable`, `DualPluginTable` / `ReversedPluginTable` and its
 * two `CursorTable`s are the fixtures under `fixtures/table-pagination-*.svelte`;
 * a hook has to run during component init, so a probe fixture is what
 * `renderHook` is to React.
 *
 * Standing translations:
 *
 * - `render` is async and takes `{ props }`.
 * - `queryByRole(...)` → `getByRole(...).query()`, which is `null` when absent.
 * - `getByText` passes `{ exact: true }`. It is load-bearing here rather than
 *   cosmetic: a Vitest locator matches substrings, so `getByText('Item 1')`
 *   would also match `Item 10`…`Item 19` and fail strict mode.
 * - `act()` has no counterpart — a `$state` write flushes on its own.
 *
 * The one RESTATED case is "plugin reference is stable across renders"; see its
 * comment.
 */

type Screen = Awaited<ReturnType<typeof render>>;

function nav(screen: Screen) {
	return screen.getByRole('navigation', { name: 'Table pagination', exact: true });
}

// =============================================================================
// paginateData Utility Tests
// =============================================================================

describe('paginateData', () => {
	it('slices data for page 1', () => {
		const data = generateItems(30);
		const sliced = paginateData(data, 1, 10);
		expect(sliced).toHaveLength(10);
		expect(sliced[0].id).toBe('1');
		expect(sliced[9].id).toBe('10');
	});

	it('slices data for page 2', () => {
		const data = generateItems(30);
		const sliced = paginateData(data, 2, 10);
		expect(sliced).toHaveLength(10);
		expect(sliced[0].id).toBe('11');
		expect(sliced[9].id).toBe('20');
	});

	it('slices data for last page with partial data', () => {
		const data = generateItems(23);
		const sliced = paginateData(data, 3, 10);
		expect(sliced).toHaveLength(3);
		expect(sliced[0].id).toBe('21');
		expect(sliced[2].id).toBe('23');
	});

	it('returns empty array for empty data', () => {
		expect(paginateData([], 1, 10)).toEqual([]);
	});

	it('clamps invalid page numbers to the first page (#3593)', () => {
		const data = generateItems(30);
		// Negative pages previously fed a negative index to Array.slice, which
		// counts from the END of the data — the tail dressed up as a page.
		expect(paginateData(data, -1, 10)[0].id).toBe('1');
		expect(paginateData(data, 0, 10)[0].id).toBe('1');
		expect(paginateData(data, NaN, 10)[0].id).toBe('1');
		// Fractional pages floor to the containing page instead of straddling two.
		expect(paginateData(data, 1.5, 10).map((i) => i.id)).toEqual(
			paginateData(data, 1, 10).map((i) => i.id)
		);
	});

	it('returns empty array when page exceeds data', () => {
		const data = generateItems(10);
		expect(paginateData(data, 5, 10)).toEqual([]);
	});

	it('handles data shorter than pageSize', () => {
		const data = generateItems(3);
		expect(paginateData(data, 1, 10)).toHaveLength(3);
	});
});

// =============================================================================
// Plugin Hook Tests
// =============================================================================

describe('useTablePagination', () => {
	describe('plugin hook', () => {
		it('returns a TablePlugin with transformTableContext', async () => {
			const screen = await render(Probe, { props: { initialPage: 1, totalItems: 50 } });
			expect(screen.component.api.plugin).toBeDefined();
			expect(screen.component.api.plugin.transformTableContext).toBeTypeOf('function');
		});

		// RESTATED. Upstream's `rerender()` re-runs the hook and compares the two
		// results, pinning its `useMemo(…, [])`. A Svelte hook body runs once per
		// component, so there is no second call — the counterpart asks the same
		// question of what the table actually consumes: after a page change, both
		// the plugin object *and the provider component `transformTableContext`
		// returns* must be the same references. The second half is the one that
		// bites here, because a provider whose reference changes tears down and
		// rebuilds the whole table.
		it('plugin reference is stable across renders', async () => {
			const screen = await render(Probe, { props: { initialPage: 1, totalItems: 50 } });
			const first = screen.component.api.plugin;
			const firstProvider = first.transformTableContext!();

			screen.component.api.setPage(2);
			await expect.poll(() => screen.component.api.page).toBe(2);

			expect(screen.component.api.plugin).toBe(first);
			expect(screen.component.api.plugin.transformTableContext!()).toBe(firstProvider);
		});
	});

	// =========================================================================
	// Plugin Behavior
	// =========================================================================

	describe('plugin behavior', () => {
		it('transformTableContext renders Pagination below table by default', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(30), pageSize: 10 } });
			const table = screen.getByRole('table').element();
			await expect.element(nav(screen)).toBeInTheDocument();
			const navEl = nav(screen).element();
			expect(table).toBeInTheDocument();
			// Nav should come after the table in DOM order
			expect(table.compareDocumentPosition(navEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});

		it('guards pageSize 0 against Infinity page counts', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(5), pageSize: 0 } });
			await expect.element(nav(screen)).toBeInTheDocument();
			// pageSize is coerced to 1, so 5 items produce 5 pages, not Infinity,
			// and page 1 shows the first item instead of an empty slice
			expect(
				screen.getByRole('button', { name: 'Go to page Infinity', exact: true }).query()
			).toBeNull();
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 5', exact: true }))
				.toBeInTheDocument();
			await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
		});

		it('transformTableContext renders Pagination above table', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, position: 'above' }
			});
			const table = screen.getByRole('table').element();
			const navEl = nav(screen).element();
			// Nav should come before the table in DOM order
			expect(table.compareDocumentPosition(navEl) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
		});

		it('transformTableContext renders Pagination above and below', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, position: 'both' }
			});
			expect(nav(screen).elements()).toHaveLength(2);
		});

		it('transformTableContext does not render Pagination when position is none', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, position: 'none' }
			});
			expect(nav(screen).query()).toBeNull();
		});

		it('does not render pagination when there is only one page', async () => {
			// 5 items with pageSize 10 → 1 page total
			const screen = await render(Fixture, { props: { data: generateItems(5), pageSize: 10 } });
			expect(nav(screen).query()).toBeNull();
		});

		it('does not render pagination when totalPages is explicitly 1', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(5), pageSize: 10, totalPagesProp: 1 }
			});
			expect(nav(screen).query()).toBeNull();
		});

		it('renders pagination when hasMore is true even with one page of data', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(5), pageSize: 10, hasMore: true }
			});
			await expect.element(nav(screen)).toBeInTheDocument();
		});

		it('renders pagination wrapper with center alignment', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, align: 'center' }
			});
			expect(nav(screen).element().parentElement).toBeInTheDocument();
		});

		it('renders pagination wrapper with end alignment', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, align: 'end' }
			});
			expect(nav(screen).element().parentElement).toBeInTheDocument();
		});

		it('paginationProps include pageSizeOptions when provided', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(50), pageSize: 10, pageSizeOptions: [10, 25, 50] }
			});
			await expect
				.element(screen.getByLabelText('Items per page', { exact: true }))
				.toBeInTheDocument();
		});

		it('paginationProps exclude pageSizeOptions when not provided', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(50), pageSize: 10 } });
			expect(screen.getByLabelText('Items per page', { exact: true }).query()).toBeNull();
		});
	});

	// =========================================================================
	// Integration with Table
	// =========================================================================

	describe('integration with Table', () => {
		it('renders table with paginated data', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(25), pageSize: 10 } });
			const rows = screen.getByRole('row').elements();
			// 1 header row + 10 data rows
			expect(rows).toHaveLength(11);
		});

		it('page change re-renders table with new data', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(25), pageSize: 10 } });

			// Initially on page 1 — should show Item 1..10
			await expect.element(screen.getByText('Item 1', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByText('Item 10', { exact: true })).toBeInTheDocument();

			// Click page 2
			await userEvent.click(screen.getByRole('button', { name: 'Go to page 2', exact: true }));

			// Now should show Item 11..20
			await expect.element(screen.getByText('Item 11', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByText('Item 20', { exact: true })).toBeInTheDocument();
			expect(screen.getByText('Item 1', { exact: true }).query()).toBeNull();
		});

		it('empty data renders pagination as null', async () => {
			const screen = await render(Fixture, { props: { data: [], pageSize: 10 } });
			expect(nav(screen).query()).toBeNull();
		});

		it('works alongside selection plugin', async () => {
			const screen = await render(DualPlugins, { props: {} });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
			await expect.element(nav(screen)).toBeInTheDocument();
			await expect
				.element(screen.getByLabelText('Select all rows', { exact: true }))
				.toBeInTheDocument();
		});

		it('plugin order does not break rendering', async () => {
			const screen = await render(DualPlugins, { props: { reversed: true } });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
			await expect.element(nav(screen)).toBeInTheDocument();
		});
	});

	// =========================================================================
	// Props Passthrough to Pagination
	// =========================================================================

	describe('props passthrough', () => {
		it('passes variant prop', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, variant: 'compact' }
			});
			await expect.element(screen.getByText('Page 1 of 3', { exact: true })).toBeInTheDocument();
		});

		it('passes size prop', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, size: 'sm' }
			});
			await expect.element(nav(screen)).toBeInTheDocument();
		});

		it('passes label prop', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(30), pageSize: 10, label: 'Custom navigation' }
			});
			await expect
				.element(screen.getByRole('navigation', { name: 'Custom navigation', exact: true }))
				.toBeInTheDocument();
		});

		it('passes hasMore for cursor-based pagination', async () => {
			const screen = await render(CursorTable, {
				props: { count: 10, hasMore: true, pageSize: 10 }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page', exact: true }))
				.not.toBeDisabled();
		});

		it('passes onPageSizeChange and pageSizeOptions', async () => {
			const screen = await render(Fixture, {
				props: { data: generateItems(50), pageSize: 10, pageSizeOptions: [10, 25, 50] }
			});

			// Verify the page size selector is rendered with current value
			const selector = screen.getByRole('combobox', { name: 'Items per page', exact: true });
			await expect.element(selector).toBeInTheDocument();
			await expect.element(selector).toHaveTextContent('10');
		});
	});

	// =========================================================================
	// Edge Cases
	// =========================================================================

	describe('edge cases', () => {
		it('handles totalItems=0 — pagination is hidden', async () => {
			const screen = await render(Fixture, { props: { data: [], pageSize: 10 } });
			expect(nav(screen).query()).toBeNull();
		});

		it('handles totalPages=1 — pagination is hidden', async () => {
			// When there is only one page, the plugin should not render pagination at all.
			const screen = await render(Fixture, { props: { data: generateItems(5), pageSize: 10 } });
			expect(nav(screen).query()).toBeNull();
		});

		it('handles page=1 with no totalItems or totalPages (cursor mode)', async () => {
			const screen = await render(CursorTable, { props: { count: 5, hasMore: false } });
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page', exact: true }))
				.toBeDisabled();
			await expect
				.element(screen.getByRole('button', { name: 'Go to next page', exact: true }))
				.toBeDisabled();
		});

		it('handles rapid page changes', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(50), pageSize: 10 } });

			await userEvent.click(screen.getByRole('button', { name: 'Go to page 2', exact: true }));
			await userEvent.click(screen.getByRole('button', { name: 'Go to page 3', exact: true }));

			// Should be on page 3 showing Item 21..30
			await expect.element(screen.getByText('Item 21', { exact: true })).toBeInTheDocument();
			await expect.element(screen.getByText('Item 30', { exact: true })).toBeInTheDocument();
		});
	});

	// =========================================================================
	// Accessibility
	// =========================================================================

	describe('accessibility', () => {
		it('pagination nav has correct aria-label', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(30), pageSize: 10 } });
			await expect.element(nav(screen)).toBeInTheDocument();
		});

		it('page buttons have aria-label "Go to page N"', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(30), pageSize: 10 } });
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 1', exact: true }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 2', exact: true }))
				.toBeInTheDocument();
		});

		it('current page has aria-current="page"', async () => {
			const screen = await render(Fixture, { props: { data: generateItems(30), pageSize: 10 } });
			await expect
				.element(screen.getByRole('button', { name: 'Go to page 1', exact: true }))
				.toHaveAttribute('aria-current', 'page');
		});

		it('disabled prev/next buttons have aria-disabled', async () => {
			// Use multi-page data so pagination is rendered; on page 1, prev is disabled.
			const screen = await render(Fixture, { props: { data: generateItems(30), pageSize: 10 } });
			await expect
				.element(screen.getByRole('button', { name: 'Go to previous page', exact: true }))
				.toBeDisabled();
		});
	});
});
