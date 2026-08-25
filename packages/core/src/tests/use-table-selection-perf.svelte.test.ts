import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SelectionTestTable, { type PerfRow } from './fixtures/table-selection-perf-fixture.svelte';

/**
 * Astryx's `Table/plugins/selection/useTableSelection-perf.test.tsx` — **5
 * upstream cases at the 0.5.0 pin, 5 here**: three ported, two **counterparts**. Nothing is
 * dropped, and nothing is added.
 *
 * Upstream's premise, stated in its own header, is that "the selection plugin
 * uses an external store so that only the row whose selection state changed
 * re-renders — not all rows in the table body". The port's
 * `use-table-selection.ts` docstring records that the store has no counterpart:
 * Svelte's reactivity is fine-grained by construction, so `SelectionStore` +
 * `useSyncExternalStore` collapse into the config getter they were wrapping.
 *
 * That is why upstream's last two cases change mechanism. They count how many
 * times each row's `renderCell` ran across a click, using a
 * `SelectionRenderCountTable` harness whose only job is to increment a counter
 * per row. **There is no render to count here**: a `renderCell` is a `Snippet`
 * whose body re-runs when the values it reads change, not when a parent
 * re-renders, so "how many times did row 3 render" has no addressee — and
 * building a harness to manufacture one would be measuring a fiction.
 *
 * What the two counterparts assert, stated plainly rather than oversold: a
 * selection toggle must not **remount the table's row subtree**. Every other row
 * is the same DOM node with byte-identical markup afterwards, and only the
 * toggled row's checkbox changed state. That is a real regression class — a
 * plugin whose `transformTableContext()` hands back a fresh component reference
 * rebuilds everything under `base-table.svelte`'s `{@const Provider = …}`,
 * silently — and it is already pinned in isolation by
 * `table-plugin-smoke.svelte.test.ts:73`.
 *
 * It is **not** upstream's property, and the difference is worth being exact
 * about. Upstream measures per-row re-render *isolation*; that has no observable
 * proxy in Svelte. An unkeyed `{#each}` would pass these two cases just as
 * happily as the keyed one at `base-table.svelte:406`, because Svelte 5 reuses
 * each-blocks and mutates them in place rather than rebuilding them — and with
 * the key set unchanged across a toggle, node identity holds by construction.
 * Nor is there anything to count: derived propagation is value-equality gated,
 * so an unaffected row's expressions simply never re-run, and no observable
 * records that they did not. The half of each case that *can* fail is
 * `expect(after[i].outerHTML).not.toBe(htmlBefore[i])` on the toggled row, which
 * stops the loop above it from comparing two identical snapshots.
 *
 * Standing translations, as in the other two selection suites: `render` is async
 * and takes `{ props }`; `getAllByX` → `getByX(…).elements()`; `getByLabelText`
 * carries `{ exact: true }`; `act(async () => { await user.click(…) })` is a bare
 * `await userEvent.click(…)`, since a `$state` write flushes on its own; and the
 * first assertion after a click goes through `expect.element(...)`, which retries.
 */

// =============================================================================
// Test Data
// =============================================================================

const createTestData = (count: number): PerfRow[] =>
	Array.from({ length: count }, (_, i) => ({
		id: `row-${i}`,
		name: `Item ${i}`
	}));

const exact = { exact: true } as const;

/** The body rows, as raw nodes — identity is the point, so not via a locator. */
function bodyRows(container: HTMLElement): HTMLTableRowElement[] {
	return [...container.querySelectorAll('tbody tr')] as HTMLTableRowElement[];
}

// =============================================================================
// Tests
// =============================================================================

describe('Selection plugin render performance', () => {
	it('selecting a row updates aria-selected correctly', async () => {
		const screen = await render(SelectionTestTable, { props: { data: createTestData(5) } });

		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(rowCheckboxes[2]);

		await expect.element(screen.getByRole('row').nth(3)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[1]).not.toHaveAttribute('aria-selected');
		expect(rows[2]).not.toHaveAttribute('aria-selected');
	});

	it('select-all sets aria-selected on all rows', async () => {
		const screen = await render(SelectionTestTable, { props: { data: createTestData(5) } });

		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		for (let i = 1; i <= 5; i++) {
			expect(rows[i]).toHaveAttribute('aria-selected', 'true');
		}
	});

	it('multiple sequential selections work correctly', async () => {
		const screen = await render(SelectionTestTable, { props: { data: createTestData(5) } });

		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(rowCheckboxes[0]);
		await userEvent.click(rowCheckboxes[1]);
		await userEvent.click(rowCheckboxes[2]);

		await expect.element(screen.getByRole('row').nth(3)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[1]).toHaveAttribute('aria-selected', 'true');
		expect(rows[2]).toHaveAttribute('aria-selected', 'true');
		expect(rows[4]).not.toHaveAttribute('aria-selected');
		expect(rows[5]).not.toHaveAttribute('aria-selected');
	});

	/**
	 * COUNTERPART, under upstream's title. React's per-row render count has no
	 * addressee here; what is asserted instead is that the toggle did not remount
	 * the row subtree. See the file header for what that does and does not cover
	 * — in particular, it is *not* upstream's isolation property, which Svelte
	 * gives no way to observe.
	 */
	it('selecting a row should not re-render other rows', async () => {
		const screen = await render(SelectionTestTable, { props: { data: createTestData(5) } });

		const before = bodyRows(screen.container);
		const htmlBefore = before.map((row) => row.outerHTML);
		expect(before).toHaveLength(5);

		// Select row-2
		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(rowCheckboxes[2]);
		await expect.element(screen.getByRole('row').nth(3)).toHaveAttribute('aria-selected', 'true');

		const after = bodyRows(screen.container);
		for (let i = 0; i < after.length; i++) {
			// Identity, not markup: a remounted subtree renders the same HTML in a
			// different node. Both are checked, for every row but the toggled one.
			expect(after[i]).toBe(before[i]);
			if (i === 2) {
				// The toggled row *did* change, which is what stops the loop above
				// from being a comparison of two identical snapshots.
				expect(after[i].outerHTML).not.toBe(htmlBefore[i]);
				continue;
			}
			expect(after[i].outerHTML).toBe(htmlBefore[i]);
		}

		const checked = (
			screen.getByLabelText('Select row', exact).elements() as HTMLInputElement[]
		).map((box) => box.checked);
		expect(checked).toEqual([false, false, true, false, false]);
	});

	/**
	 * COUNTERPART, under upstream's title, by the same argument as the case above.
	 * Upstream zeroes its counters between the two clicks; the markup snapshot is
	 * taken between them here for the same reason.
	 */
	it('deselecting a row should not re-render other rows', async () => {
		const screen = await render(SelectionTestTable, { props: { data: createTestData(5) } });

		// Select row-1 first
		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(rowCheckboxes[1]);
		await expect.element(screen.getByRole('row').nth(2)).toHaveAttribute('aria-selected', 'true');

		const before = bodyRows(screen.container);
		const htmlBefore = before.map((row) => row.outerHTML);

		// Deselect row-1
		await userEvent.click(rowCheckboxes[1]);
		await expect.element(screen.getByRole('row').nth(2)).not.toHaveAttribute('aria-selected');

		const after = bodyRows(screen.container);
		for (let i = 0; i < after.length; i++) {
			expect(after[i]).toBe(before[i]);
			if (i === 1) {
				expect(after[i].outerHTML).not.toBe(htmlBefore[i]);
				continue;
			}
			expect(after[i].outerHTML).toBe(htmlBefore[i]);
		}

		const checked = (
			screen.getByLabelText('Select row', exact).elements() as HTMLInputElement[]
		).map((box) => box.checked);
		expect(checked).toEqual([false, false, false, false, false]);
	});
});
