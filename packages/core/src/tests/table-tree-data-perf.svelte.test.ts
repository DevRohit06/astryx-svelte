import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TreeRenderCountTable from './fixtures/table-tree-perf-fixture.svelte';
import DomBudgetTable, {
	budgetColumns,
	budgetData
} from './fixtures/table-tree-dom-budget-fixture.svelte';
import type { TreeRow } from './fixtures/table-tree-perf-fixture.svelte';
import { renderTable } from './render-table.js';

/**
 * Ported from Astryx's `Table/plugins/tree/useTableTreeData-perf.test.tsx` —
 * all **3** of its `it` cases at the 0.5.0 pin, in upstream's order and under
 * upstream's names.
 * Nothing dropped.
 *
 * ## Why one case is a counterpart rather than a translation
 *
 * Upstream's premise is stated in its own header: the tree plugin uses an
 * external store "so a toggle re-renders only the affected cells — not the
 * whole table body". That is a claim about React's re-render granularity, and
 * it is measured by threading a `renderCounts` record through each column's
 * `renderCell` and counting invocations.
 *
 * **There is no render to count here.** The port deletes the external store
 * outright (see `use-table-tree-data.ts`'s header): Svelte's reactivity is
 * fine-grained by construction, so a toggle updates exactly the expressions
 * whose sources changed and no cell function is re-invoked at all. A counter
 * inside a `renderCell` snippet would count *mounts*, not renders, and would
 * therefore assert something upstream is not asserting — a harness invented to
 * produce a number, which is the thing not to build.
 *
 * What survives is the observable half of the same question: does expanding the
 * last root disturb the rows before it? Asked of the thing that actually
 * changes in Svelte, that is **element identity** plus the mount count of the
 * new rows. Be exact about what that covers: it catches a **remount of the
 * table's row subtree** — which a plugin handing back a fresh component
 * reference from `transformTableContext()` would cause, silently, through
 * `base-table.svelte`'s `{@const Provider = …}`. It does *not* reproduce
 * upstream's isolation property, which has no observable proxy here: an unkeyed
 * `{#each}` would pass this too, because Svelte 5 reuses each-blocks and mutates
 * them in place, and the rows before the expanded root keep their position
 * either way. Nor is there anything to count — derived propagation is
 * value-equality gated, so an unaffected row's expressions never re-run and
 * nothing records that they did not. The live half of case 1 is upstream's own
 * second assertion: the children mount exactly once. Case 1 says so at its site. Cases 2 and 3
 * are pure DOM assertions and transcribe verbatim.
 *
 * ## Standing translations
 *
 * - `user.click` wrapped in `act` becomes `element.click()` plus an awaited
 *   `expect.poll`; `act()` has no counterpart.
 * - `screen.getAllByRole('row')` becomes a `tr` container query, because case 3
 *   renders twice into the same document and a page-level locator would be a
 *   strict-mode violation.
 */

function rows(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('tbody tr'));
}

function rowsWithText(container: HTMLElement, text: string): HTMLElement[] {
	return rows(container).filter((row) =>
		Array.from(row.querySelectorAll('td')).some((td) => td.textContent?.trim() === text)
	);
}

describe('Tree plugin render performance', () => {
	/**
	 * **Counterpart.** Upstream counts React `renderCell` invocations for the four
	 * preceding roots and asserts they did not change. The port has no re-render
	 * to count (see the file header); the closest observable is element identity,
	 * which catches a remount of the row subtree but — as the header says — not
	 * upstream's isolation property, which Svelte gives no way to observe. The
	 * second half of upstream's assertion, that the children mount exactly once,
	 * transcribes directly and is the half that can fail.
	 */
	it('expanding the last root does not re-render preceding rows', async () => {
		const screen = await render(TreeRenderCountTable, { props: {} });

		const before = rows(screen.container);
		expect(before).toHaveLength(5);

		(screen.container.querySelector('button[aria-label="Expand row"]') as HTMLElement).click();

		await expect.poll(() => rows(screen.container).length).toBe(7);

		const after = rows(screen.container);
		for (let i = 0; i < 4; i++) {
			expect(after[i]).toBe(before[i]);
		}
		// The children mounted exactly once.
		expect(rowsWithText(screen.container, 'Child 0')).toHaveLength(1);
		expect(rowsWithText(screen.container, 'Child 1')).toHaveLength(1);
	});

	it('collapsing unmounts the subtree rows entirely', async () => {
		const screen = await render(TreeRenderCountTable, { props: {} });

		(screen.container.querySelector('button[aria-label="Expand row"]') as HTMLElement).click();
		// header + 5 roots + 2 children
		await expect.poll(() => screen.container.querySelectorAll('tr').length).toBe(8);

		(screen.container.querySelector('button[aria-label="Collapse row"]') as HTMLElement).click();
		// header + 5 roots
		await expect.poll(() => screen.container.querySelectorAll('tr').length).toBe(6);
	});

	it('adds at most one wrapper, one expander/spacer to the tree column and zero DOM to other columns', async () => {
		const plain = await renderTable<TreeRow>({
			data: budgetData,
			columns: budgetColumns,
			idKey: 'id',
			plugins: {}
		});
		const plainSecondCellHTML = plain.container.querySelectorAll('tbody td')[1].innerHTML;

		const treeScreen = await render(DomBudgetTable, { props: {} });
		const cells = treeScreen.container.querySelectorAll('tbody td');

		// Tree column: one flex wrapper containing one expander button + text.
		const wrapper = cells[0].firstElementChild as HTMLElement;
		expect(wrapper.tagName).toBe('DIV');
		expect(wrapper.children).toHaveLength(1);
		expect(wrapper.querySelector('button')).not.toBeNull();

		// Other columns: byte-identical to the plugin-free render.
		expect(cells[1].innerHTML).toBe(plainSecondCellHTML);
	});
});
