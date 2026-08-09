import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SelectionTable, {
	type SelectableUser
} from './fixtures/table-selection-plugin-fixture.svelte';

/**
 * Astryx's `Table/plugins/selection/useTableSelection.test.tsx`, ported case for
 * case — **14 upstream cases at v0.3.0, 13 here, 1 dropped and named below.**
 * Nothing added.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "**11 upstream cases, 11 here**. Nothing dropped".
 * Upstream has **14**, and three were unported:
 *
 * - `derives per-row accessible names from getRowLabel` and `keeps the "Select
 *   all rows" header label when getRowLabel is provided` are ported here (the
 *   `getRowLabel` config option already existed on the port's hook); both passed
 *   on the first run.
 * - **DROPPED: `unsubscribes detached row refs instead of accumulating
 *   listeners`.** It drives upstream's `transformBodyRow(...).ref` — a React
 *   callback ref that subscribes a per-row selection listener and returns a
 *   detach — and asserts that re-attaching without detaching does not accumulate
 *   subscribers. **This port has no such mechanism to test.** Its
 *   `transformBodyRow` (`use-table-selection.ts:137-151`) returns only
 *   `htmlProps`: it runs inside `BaseTable`'s `{@const}`, i.e. a derived, so the
 *   row that re-renders is the row whose selection changed, and there is no
 *   subscription list at all. Nothing to leak, and no `ref` to hand a row
 *   element to. A stub reproducing React's ref protocol would assert the stub.
 *   Recorded in TODO.md alongside the same decision in
 *   `use-table-selection-perf.svelte.test.ts`.
 *
 * Upstream's `SelectionTable` harness lives in
 * `fixtures/table-selection-plugin-fixture.svelte`: a hook must run during
 * component init, so a React function component becomes a fixture. It wires
 * local `$state` straight into `useTableSelection`, with no state helper in
 * between, which is what keeps this a test of the plugin.
 *
 * Standing translations, each following a pattern an earlier suite set:
 *
 * - `render` is async and takes `{ props }`; `screen.getAllByX(…)` becomes
 *   `screen.getByX(…).elements()`.
 * - **`getByLabelText` carries `{ exact: true }`.** A Vitest browser locator
 *   matches a case-insensitive *substring*; upstream's RTL query matches the whole
 *   normalized string. `exact` restores upstream's semantics rather than changing
 *   what is asserted.
 * - `user.click` is `userEvent.click` from `vitest/browser`, and `act()` has no
 *   counterpart — a `$state` write flushes on its own.
 * - Upstream reads `screen.getAllByRole('row')` once and asserts against that
 *   array synchronously after an `await user.click(...)`, which works because
 *   React has already flushed by then. Here the **first** assertion after a click
 *   goes through `expect.element(...)`, which retries until the effect has run;
 *   the remaining assertions in the same case then read a fresh `elements()`
 *   array. Same assertions, retried rather than raced.
 */

// =============================================================================
// Test Data
// =============================================================================

const selectableUsers: SelectableUser[] = [
	{ id: '1', name: 'Alice', role: 'engineer', isLocked: false },
	{ id: '2', name: 'Bob', role: 'admin', isLocked: false },
	{ id: '3', name: 'Charlie', role: 'designer', isLocked: true }
];

const exact = { exact: true } as const;

// =============================================================================
// Tests
// =============================================================================

describe('useTableSelection', () => {
	it('renders selection checkboxes in header and body rows', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const checkboxes = screen.getByRole('checkbox').elements();
		expect(checkboxes).toHaveLength(4);
	});

	it('renders header checkbox with "Select all rows" label', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		await expect.element(screen.getByLabelText('Select all rows', exact)).toBeInTheDocument();
	});

	it('renders row checkboxes with "Select row" label', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();
		expect(rowCheckboxes).toHaveLength(3);
	});

	it('derives per-row accessible names from getRowLabel', async () => {
		const screen = await render(SelectionTable, {
			props: { data: selectableUsers, getRowLabel: (item: SelectableUser) => item.name }
		});
		await expect.element(screen.getByLabelText('Select Alice', exact)).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Select Bob', exact)).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Select Charlie', exact)).toBeInTheDocument();
		expect(screen.getByLabelText('Select row', exact).query()).toBeNull();
	});

	it('keeps the "Select all rows" header label when getRowLabel is provided', async () => {
		const screen = await render(SelectionTable, {
			props: { data: selectableUsers, getRowLabel: (item: SelectableUser) => item.name }
		});
		await expect.element(screen.getByLabelText('Select all rows', exact)).toBeInTheDocument();
	});

	it('toggles individual row selection on click', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();

		await userEvent.click(rowCheckboxes[0]);

		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).not.toHaveAttribute('aria-selected');
		expect(rows[3]).not.toHaveAttribute('aria-selected');
	});

	it('deselects a selected row on click', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();

		await userEvent.click(rowCheckboxes[0]);
		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');

		await userEvent.click(rowCheckboxes[0]);
		await expect.element(screen.getByRole('row').nth(1)).not.toHaveAttribute('aria-selected');
	});

	it('selects all rows when select-all is clicked', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const selectAll = screen.getByLabelText('Select all rows', exact);

		await userEvent.click(selectAll);

		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).toHaveAttribute('aria-selected', 'true');
		expect(rows[3]).toHaveAttribute('aria-selected', 'true');
	});

	it('deselects all rows when select-all is clicked again', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const selectAll = screen.getByLabelText('Select all rows', exact);

		await userEvent.click(selectAll);
		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		await userEvent.click(selectAll);

		await expect.element(screen.getByRole('row').nth(1)).not.toHaveAttribute('aria-selected');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).not.toHaveAttribute('aria-selected');
		expect(rows[3]).not.toHaveAttribute('aria-selected');
	});

	it('hides checkbox for non-selectable rows', async () => {
		const screen = await render(SelectionTable, {
			props: {
				data: selectableUsers,
				getIsItemSelectable: (item: SelectableUser) => item.role !== 'admin'
			}
		});
		const checkboxes = screen.getByRole('checkbox').elements();
		expect(checkboxes).toHaveLength(3);
	});

	it('disables checkbox for disabled rows', async () => {
		const screen = await render(SelectionTable, {
			props: {
				data: selectableUsers,
				getIsItemEnabled: (item: SelectableUser) => !item.isLocked
			}
		});
		const rowCheckboxes = screen.getByLabelText('Select row', exact).elements();
		expect(rowCheckboxes[0]).not.toBeDisabled();
		expect(rowCheckboxes[1]).not.toBeDisabled();
		expect(rowCheckboxes[2]).toBeDisabled();
	});

	it('prepends selection <td> to each body row', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const firstBodyRow = screen.getByRole('row').nth(1);
		const cells = firstBodyRow.getByRole('cell').elements();
		expect(cells).toHaveLength(3);
	});

	it('prepends selection <th> to header row', async () => {
		const screen = await render(SelectionTable, { props: { data: selectableUsers } });
		const headerRow = screen.getByRole('row').nth(0);
		const headers = headerRow.getByRole('columnheader').elements();
		expect(headers).toHaveLength(3);
	});
});
