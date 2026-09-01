/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TableSelectionFixture from './fixtures/table-selection-fixture.svelte';
import TableSortableFixture from './fixtures/table-sortable-fixture.svelte';

/**
 * **Beyond upstream**, and deliberately so — this file exists to pin the one
 * mechanism batch 13 had to invent, which has no React analogue and which the
 * ported plugin suites exercise only indirectly.
 *
 * An Astryx table plugin is a `.ts` hook that must produce (a) a context
 * provider closing over its own state and (b) `Snippet`s for the columns it
 * injects. React gets both from JSX closures. Svelte gets neither: a snippet is
 * authored in a `.svelte` file and cannot close over a hook's locals, and
 * `TableContextProvider` declares only `children`. The port's answer is
 * `internal/with-props.ts` plus module-exported snippets that render
 * context-reading components.
 *
 * Two properties of that answer are load-bearing and are checked here, because
 * a regression in either is silent — the table still renders, it just stops
 * updating or starts remounting:
 *
 * 1. A bound provider still reaches its subtree with its state, on both the
 *    server and client compile targets.
 * 2. The provider's component reference is **stable** across transform calls.
 *    port/todo.md records this as a contract note from batch 11: a dynamic component
 *    whose reference changes tears down and rebuilds the whole table.
 */

const ROWS = [
	{ id: 'a', name: 'Alice' },
	{ id: 'b', name: 'Bob' },
	{ id: 'c', name: 'Charlie' }
];

describe('table plugin bridge', () => {
	it('renders the selection plugin’s synthetic column through a bound provider', async () => {
		const screen = await render(TableSelectionFixture, { props: { data: ROWS } });

		// One select-all checkbox in the header, one per row.
		const checkboxes = screen.getByRole('checkbox').elements();
		expect(checkboxes).toHaveLength(ROWS.length + 1);
	});

	it('toggles a row and keeps the rest untouched', async () => {
		const screen = await render(TableSelectionFixture, { props: { data: ROWS } });

		const checkboxes = screen.getByRole('checkbox').elements();
		// [0] is select-all; [1] is Alice.
		(checkboxes[1] as HTMLElement).click();

		await expect
			.element(screen.getByRole('row', { name: /Alice/ }))
			.toHaveAttribute('aria-selected', 'true');
		expect(screen.container.querySelectorAll('tbody tr[aria-selected]')).toHaveLength(1);
	});

	it('select-all marks every row, and clearing it unmarks every row', async () => {
		const screen = await render(TableSelectionFixture, { props: { data: ROWS } });
		const selectAll = screen.getByRole('checkbox').elements()[0] as HTMLElement;

		selectAll.click();
		await expect
			.poll(() => screen.container.querySelectorAll('tbody tr[aria-selected="true"]').length)
			.toBe(ROWS.length);

		selectAll.click();
		await expect
			.poll(() => screen.container.querySelectorAll('tbody tr[aria-selected]').length)
			.toBe(0);
	});

	it('does not remount rows when selection changes (stable provider reference)', async () => {
		const screen = await render(TableSelectionFixture, { props: { data: ROWS } });

		const firstRowBefore = screen.container.querySelector('tbody tr');
		(screen.getByRole('checkbox').elements()[1] as HTMLElement).click();
		await expect
			.poll(() => screen.container.querySelectorAll('tbody tr[aria-selected="true"]').length)
			.toBe(1);

		// Identity, not markup: a changing provider reference would replace the
		// element rather than mutate it.
		expect(screen.container.querySelector('tbody tr')).toBe(firstRowBefore);
	});

	it('stacks two plugins, each injecting its own column through its own context', async () => {
		const screen = await render(TableSelectionFixture, {
			props: { data: ROWS, withRowIndex: true }
		});

		// rowIndex prepends 1..n; selection prepends its checkbox column. Both
		// synthetic columns render, plus the one real column.
		await expect.element(screen.getByRole('cell', { name: '1', exact: true })).toBeInTheDocument();
		await expect.element(screen.getByRole('cell', { name: '3', exact: true })).toBeInTheDocument();
		expect(screen.getByRole('checkbox').elements()).toHaveLength(ROWS.length + 1);
	});

	it('a non-selectable row renders no checkbox but still renders its data', async () => {
		const screen = await render(TableSelectionFixture, {
			props: { data: ROWS, getIsItemSelectable: (item: { id: string }) => item.id !== 'b' }
		});

		expect(screen.getByRole('checkbox').elements()).toHaveLength(ROWS.length);
		await expect
			.element(screen.getByRole('cell', { name: 'Bob', exact: true }))
			.toBeInTheDocument();
	});

	it('a disabled row renders a disabled checkbox', async () => {
		const screen = await render(TableSelectionFixture, {
			props: { data: ROWS, getIsItemEnabled: (item: { id: string }) => item.id !== 'c' }
		});

		const checkboxes = screen.getByRole('checkbox').elements();
		expect(checkboxes[ROWS.length]).toBeDisabled();
	});
});

const SORT_ROWS = [
	{ id: '1', name: 'Charlie', age: 30 },
	{ id: '2', name: 'Alice', age: 25 },
	{ id: '3', name: 'Bob', age: 35 }
];

/**
 * `bindSnippet` inside the real table pipeline. `useTableSortable` wraps each
 * sortable header's existing content in a button, closing over the column and
 * over the content the slot already held — the case a context cannot serve and
 * the reason the binder exists. `bind-snippet*.test.ts` pin the binder in
 * isolation; these pin it where it is actually used.
 */
describe('table plugin bridge — bound slots', () => {
	it('wraps a sortable header’s content in a sort button, keeping its label', async () => {
		const screen = await render(TableSortableFixture, { props: { data: SORT_ROWS } });

		await expect
			.element(screen.getByRole('button', { name: 'Sort by Name', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Sort by Age', exact: true }))
			.toBeInTheDocument();
	});

	it('leaves a non-sortable column’s header untouched', async () => {
		const screen = await render(TableSortableFixture, { props: { data: SORT_ROWS } });

		expect(screen.container.querySelector('th:last-child button')).toBeNull();
	});

	it('sorts on click and reflects it in aria-sort and the button label', async () => {
		const screen = await render(TableSortableFixture, { props: { data: SORT_ROWS } });

		(
			screen.getByRole('button', { name: 'Sort by Name', exact: true }).element() as HTMLElement
		).click();

		await expect
			.element(screen.getByRole('columnheader', { name: /Name/ }))
			.toHaveAttribute('aria-sort', 'ascending');
		expect(screen.container.querySelector('tbody tr td')).toHaveTextContent('Alice');
	});

	it('cycles ascending → descending → unsorted', async () => {
		const screen = await render(TableSortableFixture, { props: { data: SORT_ROWS } });
		const header = () =>
			screen.getByRole('button', { name: /Sort by Name/ }).element() as HTMLElement;

		header().click();
		await expect
			.poll(() => screen.container.querySelector('tbody tr td')?.textContent)
			.toBe('Alice');

		header().click();
		await expect
			.poll(() => screen.container.querySelector('tbody tr td')?.textContent)
			.toBe('Charlie');

		header().click();
		// Back to the source order — the third click clears the sort.
		await expect
			.poll(() => screen.container.querySelector('tbody tr td')?.textContent)
			.toBe('Charlie');
		await expect
			.poll(() => screen.container.querySelector('th')?.getAttribute('aria-sort'))
			.toBe(null);
	});
});

/**
 * Bound slots must keep their **element identity** across a transform re-run.
 *
 * `bindSnippet` alone returns a fresh function each call, and `{@render}` keys
 * its branch on that identity — so the rendered element is replaced rather than
 * updated, silently losing focus and any DOM state on it. The markup is
 * identical either way, which is why every other assertion in this file passed
 * while the defect was live. `createSlotBinder` is the fix.
 *
 * Mutation-checked: reverting `use-table-sortable.ts` to `bindSnippet(...)`
 * fails this case and leaves the other three sortable cases green.
 */
describe('table plugin bridge — bound slot identity', () => {
	it('keeps the sort button element, and its focus, across a sort change', async () => {
		const screen = await render(TableSortableFixture, { props: { data: SORT_ROWS } });
		const before = screen.container.querySelector('th button') as HTMLElement;

		before.focus();
		expect(document.activeElement).toBe(before);

		before.click();
		await expect
			.poll(() => screen.container.querySelector('tbody tr td')?.textContent)
			.toBe('Alice');

		// Identity, not markup: a rebuilt branch renders the same HTML but is a
		// different node, and a keyboard user would be dropped to <body>.
		expect(screen.container.querySelector('th button')).toBe(before);
		expect(document.activeElement).toBe(before);
	});
});
