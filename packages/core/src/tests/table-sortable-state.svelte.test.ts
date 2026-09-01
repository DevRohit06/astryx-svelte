/** PORTS: Table/plugins/sortable/useTableSortableState.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Fixture, { EMPLOYEES, type Employee } from './fixtures/table-sortable-state-fixture.svelte';
import Controlled from './fixtures/table-sortable-state-controlled-fixture.svelte';

/**
 * Astryx's `Table/plugins/sortable/useTableSortableState.test.tsx`, ported case
 * for case — **19 of upstream's 20 at the 0.5.0 pin**, in upstream's order and
 * under its titles (3 default sort, 3 interactive sorting, 1 numeric, 2
 * comparators, 4 controlled, 1 multi-sort, 2 NaN, 1 null/undefined, 1 empty
 * data, 1 applySort).
 *
 * **The one that is not here arrived at 0.5.0**: `re-sorts strings when the
 * provider locale changes`, in the comparators block. It is the collator half
 * of sorting — that a locale change re-runs the sort rather than keeping the
 * order computed under the old one. (This header read "**19 of 19** … Nothing
 * dropped", true at the v0.4.5 pin.)
 *
 * Upstream's `SortableStateTable` and `ControlledWrapper` helpers are the two
 * fixtures under `fixtures/table-sortable-state*.svelte`. Its two `renderHook`
 * cases and its `Capture` component read the hook's return value through the
 * fixture's `api` export, which `render(...).component` hands back — the port's
 * substitute for `result.current`, and getters rather than a destructure so a
 * later sort is actually observed.
 *
 * Standing translations:
 *
 * - `render` is async and takes `{ props }`.
 * - `getAllByRole('row')`/`within(row).getAllByRole('cell')` becomes a container
 *   `querySelectorAll('tbody tr td:first-child')`, which is what upstream's
 *   `getNameColumnValues` reduces to once the header row is sliced off.
 * - Upstream's `user.keyboard('{Shift>}') / click / keyboard('{/Shift}')` is
 *   `userEvent.click(el, { modifiers: ['Shift'] })`.
 */

type Screen = Awaited<ReturnType<typeof render>>;

/** Reads the text content of every first-column cell in order. */
function getNameColumnValues(screen: Screen): string[] {
	return Array.from(screen.container.querySelectorAll<HTMLElement>('tbody tr td:first-child')).map(
		(cell) => cell.textContent ?? ''
	);
}

// =============================================================================
// Sorting Tests
// =============================================================================

describe('useTableSortableState', () => {
	describe('default sort', () => {
		it('applies defaultSort on initial render', async () => {
			const screen = await render(Fixture, {
				props: { defaultSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);
		});

		it('renders unsorted when no defaultSort', async () => {
			const screen = await render(Fixture, { props: {} });

			// Original order
			expect(getNameColumnValues(screen)).toEqual(['Charlie', 'Alice', 'Bob', 'Diana']);
		});

		it('applies descending defaultSort', async () => {
			const screen = await render(Fixture, {
				props: { defaultSort: [{ sortKey: 'name', direction: 'descending' }] }
			});

			expect(getNameColumnValues(screen)).toEqual(['Diana', 'Charlie', 'Bob', 'Alice']);
		});
	});

	describe('interactive sorting', () => {
		it('clicking a header sorts ascending then descending', async () => {
			const screen = await render(Fixture, { props: {} });

			// Click Name header to sort ascending
			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));
			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);

			// Click again to sort descending
			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));
			expect(getNameColumnValues(screen)).toEqual(['Diana', 'Charlie', 'Bob', 'Alice']);
		});

		it('clicking a different column replaces sort', async () => {
			const screen = await render(Fixture, {
				props: { defaultSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);

			// Sort by age instead
			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }));

			// Age ascending: Alice(28), Diana(31), Charlie(35), Bob(42)
			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Diana', 'Charlie', 'Bob']);
		});

		it('unsorted state clears sort (allowUnsortedState=true)', async () => {
			const screen = await render(Fixture, {
				props: {
					defaultSort: [{ sortKey: 'name', direction: 'ascending' }],
					allowUnsortedState: true
				}
			});

			// Click to descending
			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));
			// Click to unsorted
			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));

			// Back to original order
			expect(getNameColumnValues(screen)).toEqual(['Charlie', 'Alice', 'Bob', 'Diana']);
		});
	});

	describe('numeric sorting', () => {
		it('sorts numbers correctly without custom comparator', async () => {
			const screen = await render(Fixture, { props: {} });

			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }));

			// Age ascending: 28, 31, 35, 42
			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Diana', 'Charlie', 'Bob']);
		});
	});

	describe('custom comparators', () => {
		it('uses custom comparator when provided', async () => {
			const screen = await render(Fixture, {
				props: {
					defaultSort: [{ sortKey: 'salary', direction: 'ascending' }],
					comparators: { salary: (a: Employee, b: Employee) => a.salary - b.salary }
				}
			});

			// Salary ascending: Alice(95k), Diana(110k), Charlie(120k), Bob(140k)
			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Diana', 'Charlie', 'Bob']);
		});

		it('falls back to default compare for keys without custom comparator', async () => {
			const screen = await render(Fixture, {
				props: {
					defaultSort: [{ sortKey: 'name', direction: 'ascending' }],
					comparators: { salary: (a: Employee, b: Employee) => a.salary - b.salary }
				}
			});

			// Name uses default string compare
			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);
		});
	});

	describe('controlled mode', () => {
		it('uses controlled sort state', async () => {
			const screen = await render(Controlled, { props: {} });

			expect(getNameColumnValues(screen)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);
		});

		it('responds to external sort state changes', async () => {
			const screen = await render(Controlled, { props: {} });

			await userEvent.click(screen.getByTestId('external-sort'));

			// Age descending: Bob(42), Charlie(35), Diana(31), Alice(28)
			expect(getNameColumnValues(screen)).toEqual(['Bob', 'Charlie', 'Diana', 'Alice']);
		});

		it('responds to sort clear', async () => {
			const screen = await render(Controlled, { props: {} });

			await userEvent.click(screen.getByTestId('clear-sort'));

			// Original order
			expect(getNameColumnValues(screen)).toEqual(['Charlie', 'Alice', 'Bob', 'Diana']);
		});

		it('header clicks update controlled state', async () => {
			const onSortChange = vi.fn();

			const screen = await render(Controlled, { props: { initialSort: [], onSortChange } });

			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'ascending' }]);
		});
	});

	describe('multi-sort', () => {
		it('supports multi-sort via shift+click', async () => {
			// Employees with same department
			const data: Employee[] = [
				{ id: '1', name: 'Charlie', age: 35, department: 'Engineering', salary: 120000 },
				{ id: '2', name: 'Alice', age: 28, department: 'Engineering', salary: 95000 },
				{ id: '3', name: 'Bob', age: 42, department: 'Design', salary: 140000 },
				{ id: '4', name: 'Diana', age: 31, department: 'Design', salary: 110000 }
			];

			const screen = await render(Fixture, {
				props: {
					data,
					defaultSort: [{ sortKey: 'department', direction: 'ascending' }],
					isMultiSortEnabled: true
				}
			});

			// Department ascending: Design(Bob, Diana), Engineering(Alice, Charlie)
			// Now shift+click Name to add secondary sort
			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }), {
				modifiers: ['Shift']
			});

			// Design: Bob, Diana; Engineering: Alice, Charlie
			expect(getNameColumnValues(screen)).toEqual(['Bob', 'Diana', 'Alice', 'Charlie']);
		});
	});

	describe('NaN handling', () => {
		it('keeps valid numbers sorted when a NaN cell is present', async () => {
			const data: Employee[] = [
				{ id: '1', name: 'A', age: 5, department: 'X', salary: 1 },
				{ id: '2', name: 'B', age: NaN, department: 'X', salary: 1 },
				{ id: '3', name: 'C', age: 1, department: 'X', salary: 1 },
				{ id: '4', name: 'D', age: 3, department: 'X', salary: 1 }
			];
			const screen = await render(Fixture, {
				props: { data, defaultSort: [{ sortKey: 'age', direction: 'ascending' }] }
			});
			// NaN groups at the end like null; the valid numbers stay ordered.
			expect(screen.component.api.sortedData.map((e) => e.age)).toEqual([1, 3, 5, NaN]);
		});

		it('sorts NaN to the start in descending order, like null', async () => {
			const data: Employee[] = [
				{ id: '1', name: 'A', age: 5, department: 'X', salary: 1 },
				{ id: '2', name: 'B', age: NaN, department: 'X', salary: 1 },
				{ id: '3', name: 'C', age: 1, department: 'X', salary: 1 }
			];
			const screen = await render(Fixture, {
				props: { data, defaultSort: [{ sortKey: 'age', direction: 'descending' }] }
			});
			expect(screen.component.api.sortedData.map((e) => e.age)).toEqual([NaN, 5, 1]);
		});
	});

	describe('null/undefined handling', () => {
		it('sorts null values to the end', async () => {
			const data: Employee[] = [
				{ id: '1', name: 'Charlie', age: 35, department: 'Engineering', salary: 120000 },
				{
					id: '2',
					name: null as unknown as string,
					age: 28,
					department: 'Design',
					salary: 95000
				},
				{ id: '3', name: 'Alice', age: 42, department: 'Engineering', salary: 140000 }
			];

			const screen = await render(Fixture, {
				props: { data, defaultSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const names = getNameColumnValues(screen);
			// Alice, Charlie first; null last
			expect(names[0]).toBe('Alice');
			expect(names[1]).toBe('Charlie');
		});
	});

	describe('empty data', () => {
		it('handles empty data array', async () => {
			const screen = await render(Fixture, {
				props: { data: [], defaultSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			// Should render without throwing — table still mounts with empty data
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
			// Sort headers should still be interactive
			await expect
				.element(screen.getByRole('button', { name: /sort by name/i }))
				.toBeInTheDocument();
		});
	});

	describe('applySort', () => {
		it('exposes applySort for external use', async () => {
			const screen = await render(Fixture, {
				props: {
					data: EMPLOYEES,
					defaultSort: [{ sortKey: 'name', direction: 'ascending' }]
				}
			});

			// Use applySort on a different dataset
			const subset: Employee[] = [
				{ id: '10', name: 'Zara', age: 25, department: 'PM', salary: 90000 },
				{ id: '11', name: 'Aaron', age: 30, department: 'Design', salary: 100000 }
			];

			const sorted = screen.component.api.applySort(subset);
			expect(sorted.map((e) => e.name)).toEqual(['Aaron', 'Zara']);
		});
	});
});
