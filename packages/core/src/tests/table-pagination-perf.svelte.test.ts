/** PORTS: Table/plugins/pagination/useTablePagination-perf.test.tsx */

import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Fixture, { generateItems } from './fixtures/table-pagination-fixture.svelte';
import Probe from './fixtures/table-pagination-probe.svelte';

/**
 * Astryx's `Table/plugins/pagination/useTablePagination-perf.test.tsx`, ported
 * case for case — **3 of 3 at the 0.5.0 pin**, in upstream's order and under
 * its titles. Nothing
 * dropped; all three are **counterparts**, because every assertion in the file
 * is a React render count and React renders have no counterpart here.
 *
 * What upstream is really protecting is stated in its own header: the plugin
 * object must be referentially stable so a page or pageSize change does not
 * re-render the whole table. That property survives the port and is worth
 * pinning — it is just observed differently:
 *
 * - Upstream's `PluginStabilityTracker` counts, in an effect, how often the
 *   plugin reference changes. Here the hook body runs once per component, so the
 *   count is structurally zero; what is *not* structural, and what actually
 *   remounts the table when it regresses, is the component reference
 *   `transformTableContext()` returns. `use-table-pagination.ts` binds that
 *   provider once through `withProps` precisely for this reason, so both cases
 *   assert the plugin object **and** the provider reference.
 * - Upstream's `PaginationRenderCountTable` counts `renderCell` invocations per
 *   row id. Svelte has no render to count and the brief forbids inventing a
 *   render-counting harness, so the third case asserts the DOM consequence
 *   upstream's counts stand for: the outgoing page's rows leave, the incoming
 *   page's rows each appear exactly once, and the table body itself is *updated*
 *   rather than rebuilt (element identity preserved).
 *
 * `act()` has no counterpart — a `$state` write flushes on its own and
 * `expect.poll` retries.
 */

describe('Pagination plugin render performance', () => {
	it('plugin identity should be stable across page changes', async () => {
		const screen = await render(Probe, { props: { initialPageSize: 5, totalItems: 20 } });
		const plugin = screen.component.api.plugin;
		const provider = plugin.transformTableContext!();

		// Go to page 2
		screen.component.api.setPage(2);
		// Go to page 3
		screen.component.api.setPage(3);
		await expect.poll(() => screen.component.api.page).toBe(3);

		// Plugin reference should NOT have changed
		expect(screen.component.api.plugin).toBe(plugin);
		expect(screen.component.api.plugin.transformTableContext!()).toBe(provider);
	});

	it('plugin identity should be stable across pageSize changes', async () => {
		const screen = await render(Probe, { props: { initialPageSize: 5, totalItems: 20 } });
		const plugin = screen.component.api.plugin;
		const provider = plugin.transformTableContext!();

		// Change page size
		screen.component.api.setPageSize(10);

		// Plugin reference should NOT have changed
		expect(screen.component.api.plugin).toBe(plugin);
		expect(screen.component.api.plugin.transformTableContext!()).toBe(provider);
	});

	it('page change should not re-render rows that remain visible', async () => {
		// 20 items, pageSize 5 — page 1 shows items 1-5, page 2 shows items 6-10.
		// (Upstream's helper numbers from 0; `generateItems` numbers from 1.)
		const screen = await render(Fixture, { props: { data: generateItems(20), pageSize: 5 } });
		const bodyRows = () => screen.container.querySelectorAll('tbody tr');

		// Initial render: 5 rows, one per page-1 item.
		expect(bodyRows()).toHaveLength(5);
		const tbody = screen.container.querySelector('tbody');

		// Navigate to page 2
		await userEvent.click(screen.getByRole('button', { name: 'Go to page 2', exact: true }));
		await expect.element(screen.getByText('Item 6', { exact: true })).toBeInTheDocument();

		// Page 1 rows are gone — they are not in the DOM at all.
		for (let i = 1; i <= 5; i++) {
			expect(screen.getByText(`Item ${i}`, { exact: true }).query()).toBeNull();
		}

		// Page 2 rows each render exactly once.
		for (let i = 6; i <= 10; i++) {
			expect(screen.getByText(`Item ${i}`, { exact: true }).elements()).toHaveLength(1);
		}
		expect(bodyRows()).toHaveLength(5);

		// Identity, not markup: the body was updated in place rather than rebuilt,
		// which is the Svelte-visible form of "the page change did not re-render
		// everything".
		expect(screen.container.querySelector('tbody')).toBe(tbody);
	});
});
