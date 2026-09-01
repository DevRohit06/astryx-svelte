/** PORTS: Table/plugins/groupedRows/useTableGroupedRows-perf.test.tsx */

import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import GroupedRenderCountTable from './fixtures/table-grouped-rows-perf-fixture.svelte';

/**
 * Astryx's `Table/plugins/groupedRows/useTableGroupedRows-perf.test.tsx`, ported
 * case for case — **2 of upstream's 2 declarations**, in upstream's order and
 * under its titles. **Nothing is dropped and nothing is added.**
 *
 * Upstream's premise, from its own header: "The plugin keeps group headers out
 * of cell renderers per cell, at render time. Doing it by rewriting the columns
 * instead would hand `BaseTable` a new column object on every render, and its
 * element-by-element check on the resolved column array is what stops every row
 * re-rendering."
 *
 * ## What "render count" can and cannot mean here
 *
 * This is a performance suite, so the first question is whether its instrument
 * survives the port. Half of it does, and the two halves are worth separating.
 *
 * **Case 1 is not really a render-count assertion.** `toEqual({a: 1, b: 1, c: 1})`
 * is an assertion about *which items reach the cell renderer* — the record has
 * exactly the three real row ids and no fourth key, which is what "no group
 * header at all" means. A synthetic header row reaching the renderer would show
 * up as an entry keyed `''`, since `use-table-grouped-rows.svelte.ts`'s Proxy
 * resolves every unknown field on a header to the empty string and the fixture
 * keys by `item.id`. That question has a real addressee in Svelte and is ported
 * unchanged. The `1`s are meaningful too: `{@const}` is a `$derived` scoped to
 * the snippet body, so it evaluates once per instantiation and again only when
 * `item` changes.
 *
 * It also lands on the same invariant as the two 0.5.0 cases
 * `table-grouped-rows.svelte.test.ts` records as unported — a column's
 * `renderCell` must never be handed a group header row — and it passes: our
 * `base-table.svelte` builds `cellsFragment` as a *snippet* and the grouped
 * plugin's `transformBodyRow` replaces `children` before anything renders it, so
 * `col.renderCell` is never reached for a header. (`bodyCellsFor` does run for
 * header rows, but with a `renderCell` present it computes no text and touches
 * no field of the item.) That does not port those two cases — they assert other
 * things as well — but it does mean the hazard upstream's Proxy exists for is
 * not live here.
 *
 * **Case 2's mechanism is React-shaped, and this is stated rather than hidden.**
 * "A re-render of the surrounding component" has no Svelte event: clicking
 * `bump` writes `tick`, and nothing in the table reads `tick`, so no expression
 * under `<Table>` is invalidated and the counters cannot move. In React the same
 * click re-runs the whole component body, which is exactly why upstream needs
 * `useMemo` on `columns` and why the case is worth its keep there.
 *
 * The case is still ported verbatim rather than dropped, for two reasons. It is
 * cheap, and it is not quite tautological: `{@render cell.column.renderCell(item)}`
 * re-instantiates the snippet when the *snippet function identity* changes, so a
 * plugin or fixture that rebuilt `columns` — upstream's exact failure mode,
 * reached by a different road — would move these counters. What is genuinely
 * unavailable is upstream's stronger reading, "React re-rendered the parent and
 * the rows survived it"; there is no parent re-render to survive.
 *
 * One assertion is added *inside* case 2, not as a new case, and it is the half
 * that can actually fail here: the `<tr>` nodes are the same objects afterwards.
 * That is the Svelte-side statement of "no rows re-rendered" — a remount renders
 * identical HTML in different nodes, and only node identity tells them apart.
 * The precedent is `use-table-selection-perf.svelte.test.ts`, which reaches the
 * same instrument from the other direction.
 *
 * Standing translations: `render` is async and takes `{ props }`;
 * `act(async () => { await user.click(…) })` is a bare `await userEvent.click(…)`,
 * since a `$state` write flushes on its own; `toBeInTheDocument()` on the button
 * goes through `expect.element(...)`, which retries; and the string `name` in
 * `getByRole` carries `{ exact: true }`, because a Playwright locator
 * substring-matches an accessible name where Testing Library matches the whole
 * string — without it, `'bump 1'` would also match `'bump 10'`.
 */

describe('Grouped rows render performance', () => {
	it('renders each real row once and no group header at all', async () => {
		const renderCounts: Record<string, number> = {};
		await render(GroupedRenderCountTable, { props: { renderCounts } });
		expect(renderCounts).toEqual({ a: 1, b: 1, c: 1 });
	});

	it('a re-render of the surrounding component re-renders no rows', async () => {
		const renderCounts: Record<string, number> = {};
		const screen = await render(GroupedRenderCountTable, { props: { renderCounts } });
		const before = { ...renderCounts };
		// The `<tr>` nodes, as raw objects — identity is the point, so not via a
		// locator. See the file header: this is the half of the case that has
		// something to fail on in Svelte.
		const rowsBefore = [...screen.container.querySelectorAll('tbody tr')];
		// Two group headers and three members — so the identity check below is not
		// comparing two empty lists.
		expect(rowsBefore).toHaveLength(5);

		await userEvent.click(screen.getByRole('button', { name: /bump/ }));

		await expect
			.element(screen.getByRole('button', { name: 'bump 1', exact: true }))
			.toBeInTheDocument();
		expect(renderCounts).toEqual(before);
		const rowsAfter = [...screen.container.querySelectorAll('tbody tr')];
		// `toBe`, element by element, not `toEqual` on the arrays: `toEqual` walks
		// two distinct nodes with identical markup and calls them equal, which is
		// exactly the case a remount produces.
		expect(rowsAfter).toHaveLength(rowsBefore.length);
		for (let i = 0; i < rowsAfter.length; i++) {
			expect(rowsAfter[i]).toBe(rowsBefore[i]);
		}
	});
});
