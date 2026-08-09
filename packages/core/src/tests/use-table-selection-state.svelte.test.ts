import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StateHelperTable, {
	type SelectionStateItem
} from './fixtures/table-selection-state-fixture.svelte';
import FilteredSelectionTable from './fixtures/table-filtered-selection-fixture.svelte';

/**
 * Astryx's `Table/plugins/selection/useTableSelectionState.test.tsx`, ported
 * case for case — **13 upstream cases** (7 `useTableSelectionState`, 6
 * `useTableSelectionState with filtered data`), **13 here**. Nothing dropped,
 * nothing added.
 *
 * Upstream's two harnesses become fixtures, since a hook has to run during
 * component init: `StateHelperTable` →
 * `fixtures/table-selection-state-fixture.svelte`, `FilteredSelectionTable` →
 * `fixtures/table-filtered-selection-fixture.svelte`. Both are transcriptions,
 * with `useState` → `$state` and the config object → the getter the port's hook
 * takes. `setSelectedKeys` is a plain setter here rather than React's updater
 * form — the hook's docstring says why, and no case in this file passes an
 * updater.
 *
 * Standing translations, as in `use-table-selection.svelte.test.ts`:
 *
 * - `render` is async and takes `{ props }`; `getAllByX` → `getByX(…).elements()`;
 *   `getByTestId` is unchanged.
 * - `getByLabelText` carries `{ exact: true }` — a Vitest browser locator matches
 *   a case-insensitive substring where RTL matches the whole normalized string.
 * - The **first** assertion after a click goes through `expect.element(...)`,
 *   which retries; the rest of the case then reads a fresh `elements()` array.
 *   Upstream can assert synchronously because React has flushed by the time
 *   `await user.click` resolves.
 * - `user.clear(input)` + `user.type(input, 'Ali')` is one `userEvent.fill(input,
 *   'Ali')`, and a bare `user.clear(input)` is `userEvent.fill(input, '')` —
 *   the counterpart the `MultiSelector` and `CommandPalette` ports settled on.
 */

// =============================================================================
// Test Data
// =============================================================================

const testData: SelectionStateItem[] = [
	{ id: '1', name: 'Alice', isLocked: false, isHidden: false },
	{ id: '2', name: 'Bob', isLocked: false, isHidden: false },
	{ id: '3', name: 'Charlie', isLocked: true, isHidden: false },
	{ id: '4', name: 'Diana', isLocked: false, isHidden: true }
];

const exact = { exact: true } as const;

const notLocked = (item: SelectionStateItem): boolean => !item.isLocked;
const notHidden = (item: SelectionStateItem): boolean => !item.isHidden;

// =============================================================================
// Tests
// =============================================================================

describe('useTableSelectionState', () => {
	it('select-all selects only enabled items', async () => {
		const screen = await render(StateHelperTable, {
			props: { data: testData, getIsItemEnabled: notLocked }
		});

		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		// Alice, Bob, Diana selected (enabled)
		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).toHaveAttribute('aria-selected', 'true');
		// Charlie disabled — NOT selected
		expect(rows[3]).not.toHaveAttribute('aria-selected');
		// Diana enabled
		expect(rows[4]).toHaveAttribute('aria-selected', 'true');
	});

	it('select-all preserves disabled-but-selected items', async () => {
		// Charlie (id: 3) starts selected but is disabled
		const screen = await render(StateHelperTable, {
			props: {
				data: testData,
				getIsItemEnabled: notLocked,
				initialSelected: new Set(['3'])
			}
		});

		// Charlie should be selected (was selected before becoming disabled)
		await expect.element(screen.getByRole('row').nth(3)).toHaveAttribute('aria-selected', 'true');

		// Select all — Charlie should stay selected, others get selected
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).toHaveAttribute('aria-selected', 'true');
		expect(rows[3]).toHaveAttribute('aria-selected', 'true'); // preserved
		expect(rows[4]).toHaveAttribute('aria-selected', 'true');
	});

	it('deselect-all preserves disabled-but-selected items', async () => {
		// Charlie (id: 3) starts selected but is disabled
		// Alice (id: 1) also starts selected
		const screen = await render(StateHelperTable, {
			props: {
				data: testData,
				getIsItemEnabled: notLocked,
				initialSelected: new Set(['1', '3'])
			}
		});

		// Click select-all first to select all enabled
		await userEvent.click(screen.getByLabelText('Select all rows', exact));
		await expect.element(screen.getByRole('row').nth(2)).toHaveAttribute('aria-selected', 'true');
		// Now deselect all
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		// Enabled items deselected
		await expect.element(screen.getByRole('row').nth(1)).not.toHaveAttribute('aria-selected');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).not.toHaveAttribute('aria-selected');
		// Charlie (disabled) stays selected
		expect(rows[3]).toHaveAttribute('aria-selected', 'true');
		expect(rows[4]).not.toHaveAttribute('aria-selected');
	});

	it('non-selectable items are excluded from select-all', async () => {
		const screen = await render(StateHelperTable, {
			props: { data: testData, getIsItemSelectable: notHidden }
		});

		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).toHaveAttribute('aria-selected', 'true');
		expect(rows[3]).toHaveAttribute('aria-selected', 'true');
		// Diana (non-selectable) — NOT selected
		expect(rows[4]).not.toHaveAttribute('aria-selected');
	});

	it('deselect-all does not affect non-selectable items', async () => {
		// Diana (id: 4, hidden/non-selectable) starts selected somehow
		const screen = await render(StateHelperTable, {
			props: {
				data: testData,
				getIsItemSelectable: notHidden,
				initialSelected: new Set(['4'])
			}
		});

		// Select all enabled+selectable
		await userEvent.click(screen.getByLabelText('Select all rows', exact));
		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		// Deselect all
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		await expect.element(screen.getByRole('row').nth(1)).not.toHaveAttribute('aria-selected');
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).not.toHaveAttribute('aria-selected');
		expect(rows[3]).not.toHaveAttribute('aria-selected');
		// Diana (non-selectable) stays selected — frozen
		expect(rows[4]).toHaveAttribute('aria-selected', 'true');
	});

	it('handles both non-selectable and disabled rows together', async () => {
		// Charlie is disabled, Diana is non-selectable, both start selected
		const screen = await render(StateHelperTable, {
			props: {
				data: testData,
				getIsItemEnabled: notLocked,
				getIsItemSelectable: notHidden,
				initialSelected: new Set(['3', '4'])
			}
		});

		// Both frozen items start selected
		await expect.element(screen.getByRole('row').nth(3)).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('row').elements()[4]).toHaveAttribute('aria-selected', 'true');

		// Select all — only Alice and Bob are actionable
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true');
		let rows = screen.getByRole('row').elements();
		expect(rows[2]).toHaveAttribute('aria-selected', 'true');
		expect(rows[3]).toHaveAttribute('aria-selected', 'true'); // frozen
		expect(rows[4]).toHaveAttribute('aria-selected', 'true'); // frozen

		// Deselect all — only Alice and Bob deselected
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		await expect.element(screen.getByRole('row').nth(1)).not.toHaveAttribute('aria-selected');
		rows = screen.getByRole('row').elements();
		expect(rows[2]).not.toHaveAttribute('aria-selected');
		expect(rows[3]).toHaveAttribute('aria-selected', 'true'); // still frozen
		expect(rows[4]).toHaveAttribute('aria-selected', 'true'); // still frozen
	});

	it('individual selection works normally', async () => {
		const screen = await render(StateHelperTable, { props: { data: testData } });

		const checkboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(checkboxes[1]); // Bob

		await expect.element(screen.getByRole('row').nth(2)).toHaveAttribute('aria-selected', 'true');
		const rows = screen.getByRole('row').elements();
		expect(rows[1]).not.toHaveAttribute('aria-selected');
		expect(rows[3]).not.toHaveAttribute('aria-selected');
	});
});

// =============================================================================
// Filtering + Selection Interaction Tests
// =============================================================================

describe('useTableSelectionState with filtered data', () => {
	it('select-all only selects visible (filtered) rows', async () => {
		// Filter to only show Alice and Charlie (names containing "li")
		const screen = await render(FilteredSelectionTable, {
			props: { data: testData, initialFilter: 'li' }
		});

		// Should show 2 rows (Alice, Charlie): header + 2 body rows = 3
		expect(screen.getByRole('row').elements()).toHaveLength(3);

		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		// Only Alice (1) and Charlie (3) should be selected
		await expect.element(screen.getByTestId('selected-count')).toHaveTextContent('2');
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('1,3');
	});

	it('select-all is unchecked when the filter matches nothing (#3591)', async () => {
		const screen = await render(FilteredSelectionTable, { props: { data: testData } });

		// Select Bob, then filter to an empty result set.
		const checkboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(checkboxes[1]);
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('2');

		const input = screen.getByTestId('filter-input');
		await userEvent.fill(input, 'zzz');

		// Zero visible rows must not read as "all selected" — previously the
		// header checkbox rendered checked here and deselect-all was a no-op.
		await expect.element(screen.getByLabelText('Select all rows', exact)).not.toBeChecked();

		// The hidden selection itself is preserved (frozen), as designed.
		await userEvent.fill(input, '');
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('2');
	});

	it('selections persist when filter changes', async () => {
		const screen = await render(FilteredSelectionTable, { props: { data: testData } });

		// Select Bob (row index 2 in unfiltered view)
		const checkboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(checkboxes[1]); // Bob

		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('2');

		// Now filter to only "Ali" — Bob disappears but stays selected
		const input = screen.getByTestId('filter-input');
		await userEvent.fill(input, 'Ali');

		// Bob is no longer visible
		await expect.poll(() => screen.getByRole('row').elements().length).toBe(2); // header + Alice

		// But selectedKeys still includes Bob
		await expect.element(screen.getByTestId('selected-count')).toHaveTextContent('1');
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('2');
	});

	it('select-all in filtered view preserves selections from other views', async () => {
		const screen = await render(FilteredSelectionTable, { props: { data: testData } });

		// Select Bob individually
		const checkboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(checkboxes[1]); // Bob (id: 2)

		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('2');

		// Filter to "Ali" — shows only Alice
		const input = screen.getByTestId('filter-input');
		await userEvent.fill(input, 'Ali');

		// Select all in filtered view (just Alice)
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		// Both Bob (from before) and Alice (from select-all) should be selected
		await expect.element(screen.getByTestId('selected-count')).toHaveTextContent('2');
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('1,2');
	});

	it('deselect-all in filtered view only deselects visible rows', async () => {
		const screen = await render(FilteredSelectionTable, { props: { data: testData } });

		// Select all (unfiltered) — selects all 4
		await userEvent.click(screen.getByLabelText('Select all rows', exact));
		await expect.element(screen.getByTestId('selected-count')).toHaveTextContent('4');

		// Filter to "Ali" — shows only Alice
		const input = screen.getByTestId('filter-input');
		await userEvent.fill(input, 'Ali');

		// Deselect all in filtered view — only deselects Alice
		await userEvent.click(screen.getByLabelText('Select all rows', exact));

		// Bob, Charlie, Diana still selected (not visible, so frozen)
		await expect.element(screen.getByTestId('selected-count')).toHaveTextContent('3');
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('2,3,4');
	});

	it('clearing filter restores selections from all views', async () => {
		const screen = await render(FilteredSelectionTable, { props: { data: testData } });

		// Select Alice individually
		const checkboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(checkboxes[0]); // Alice (id: 1)

		// Filter to "Bob" and select Bob
		const input = screen.getByTestId('filter-input');
		await userEvent.fill(input, 'Bob');
		const filteredCheckboxes = screen.getByLabelText('Select row', exact).elements();
		await userEvent.click(filteredCheckboxes[0]); // Bob (id: 2)

		// Clear filter
		await userEvent.fill(input, '');

		// Both Alice and Bob should be selected
		await expect.element(screen.getByTestId('selected-count')).toHaveTextContent('2');
		await expect.element(screen.getByTestId('selected-keys')).toHaveTextContent('1,2');

		// And they should appear selected in the table
		await expect.element(screen.getByRole('row').nth(1)).toHaveAttribute('aria-selected', 'true'); // Alice
		const rows = screen.getByRole('row').elements();
		expect(rows[2]).toHaveAttribute('aria-selected', 'true'); // Bob
		expect(rows[3]).not.toHaveAttribute('aria-selected'); // Charlie
		expect(rows[4]).not.toHaveAttribute('aria-selected'); // Diana
	});
});
