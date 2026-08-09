import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { toSearchFilters } from '$lib/components/table/plugins/filtering/use-table-filtering.js';
import type { TableFilterState } from '$lib/components/table/plugins/filtering/use-table-filtering.js';
import type { TableColumn } from '$lib/components/table/table-types.js';
import FilterTable, {
	allFilterColumns,
	defaultColumns,
	searchConfig,
	type TestRow
} from './fixtures/table-filtering-fixture.svelte';
import Capture from './fixtures/table-filtering-capture-fixture.svelte';

/**
 * Ported from Astryx's `Table/plugins/filtering/useTableFiltering.test.tsx` —
 * all **16** of its `it` cases, in upstream's order and under upstream's names.
 * Nothing dropped.
 *
 * ## Standing translations
 *
 * - **`FilterTable` and `Capture` become probe fixtures**, because a hook has
 *   to run during a component's init.
 * - **Testing Library's `getAllBy*` become Vitest locators' `.elements()`**:
 *   `getAllByPlaceholderText` → `getByPlaceholder(…).elements()`,
 *   `queryAllByLabelText` → `getByLabelText(…).elements()`.
 * - **`user.click` / `user.type` are `userEvent` from `vitest/browser`**, which
 *   drives real Chromium rather than jsdom.
 *
 * ## Restated cases (assertion changed; each says so at its site)
 *
 * - "ignores unresolvable field references" and "works with no filterable
 *   columns" — upstream's `expect(() => render(…)).not.toThrow()` is vacuous
 *   here, since `render` is async and the promise is never awaited inside the
 *   callback.
 * - "returns a referentially stable plugin object" — see its site. Upstream
 *   compares the object across two React renders; there is no second render
 *   here, so the comparison is made across the `variant` change that upstream's
 *   `useMemo` dependency array names.
 *
 * ## Upstream surface with no counterpart
 *
 * The port's `transformColumns` is **always present** and no-ops in the
 * `popover` variant, where upstream sets the member to `undefined` — a single
 * plugin object cannot swap a member out, and `applyPlugins` simply gets its
 * input back. Upstream's suite happens not to assert on that member, so no case
 * is affected; it is recorded here because the difference is real.
 */

describe('useTableFiltering', () => {
	describe('popover variant — rendering', () => {
		it('renders filter icon for filterable columns', async () => {
			const screen = await render(FilterTable, { props: {} });
			const filterButtons = screen.getByRole('button', { name: /Filter / }).elements();
			expect(filterButtons).toHaveLength(3);
		});

		it('renders no filter icon for columns without filter config', async () => {
			const noFilterColumns: TableColumn<TestRow>[] = [
				{ key: 'name', header: 'Name' },
				{ key: 'status', header: 'Status' }
			];
			const screen = await render(FilterTable, { props: { columns: noFilterColumns } });
			expect(screen.getByLabelText(/Filter /).elements()).toHaveLength(0);
		});

		it('filter trigger button is clickable', async () => {
			const screen = await render(FilterTable, { props: {} });
			const filterButton = screen.getByRole('button', { name: 'Filter Name' });
			await userEvent.click(filterButton);
			// Button exists and is interactive
			await expect.element(filterButton).toBeInTheDocument();
		});
	});

	describe('inline variant — rendering', () => {
		it('renders inline filter controls', async () => {
			const screen = await render(FilterTable, { props: { variant: 'inline' } });
			const textInputs = screen.getByRole('textbox').elements();
			expect(textInputs.length).toBeGreaterThanOrEqual(1);
		});

		it('renders text input for string field', async () => {
			const screen = await render(FilterTable, { props: { variant: 'inline' } });
			const textInputs = screen.getByPlaceholder(/^Filter /).elements();
			expect(textInputs.length).toBeGreaterThanOrEqual(1);
		});

		it('renders number input for integer field', async () => {
			const screen = await render(FilterTable, { props: { variant: 'inline' } });
			const numberInputs = screen.getByRole('spinbutton').elements();
			expect(numberInputs.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('inline variant — interaction', () => {
		it('updates text filter on type', async () => {
			const screen = await render(FilterTable, { props: { variant: 'inline' } });
			const textInputs = screen.getByPlaceholder(/^Filter /).elements();
			await userEvent.type(textInputs[0] as HTMLElement, 'Alice');
			await expect.poll(() => (textInputs[0] as HTMLInputElement).value).toBe('Alice');
		});
	});

	describe('field reference forms', () => {
		it('supports object form { field, operator }', async () => {
			const columns: TableColumn<TestRow>[] = [
				{ key: 'name', header: 'Name', filter: { field: 'name', operator: 'contains' } }
			];
			const screen = await render(FilterTable, { props: { columns, variant: 'inline' } });
			const textInputs = screen.getByPlaceholder(/^Filter /).elements();
			expect(textInputs.length).toBeGreaterThanOrEqual(1);
		});

		/**
		 * **Restated.** Upstream writes `expect(() => render(…)).not.toThrow()`;
		 * `render` is async here, so that assertion would pass without the
		 * component ever mounting. Asserting the mounted result — the table renders
		 * and the unresolvable column simply gets no trigger — is what the title
		 * claims.
		 */
		it('ignores unresolvable field references', async () => {
			const columns: TableColumn<TestRow>[] = [
				{ key: 'name', header: 'Name', filter: 'nonexistent_field' }
			];
			const screen = await render(FilterTable, { props: { columns } });
			expect(screen.container.querySelector('table')).not.toBeNull();
			expect(screen.getByRole('button', { name: /Filter / }).elements()).toHaveLength(0);
		});
	});

	describe('toSearchFilters', () => {
		it('converts table filter state to PowerSearchFilter[]', () => {
			const filters: TableFilterState = { name: 'alice', status: 'active' };
			const result = toSearchFilters(filters, defaultColumns, searchConfig);
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				field: 'name',
				operator: 'contains',
				value: { type: 'string', value: 'alice' }
			});
			expect(result[1]).toEqual({
				field: 'status',
				operator: 'is',
				value: { type: 'enum', value: 'active' }
			});
		});

		it('skips columns with no filter value', () => {
			const filters: TableFilterState = { name: 'alice' };
			const result = toSearchFilters(filters, defaultColumns, searchConfig);
			expect(result).toHaveLength(1);
		});

		it('skips columns with no filter config', () => {
			const filters: TableFilterState = { name: 'alice' };
			const noFilterColumns = [{ key: 'name', header: 'Name' }];
			const result = toSearchFilters(filters, noFilterColumns, searchConfig);
			expect(result).toHaveLength(0);
		});

		it('handles integer values', () => {
			const filters: TableFilterState = { age: 30 };
			const result = toSearchFilters(filters, defaultColumns, searchConfig);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				field: 'age',
				operator: 'equals',
				value: { type: 'integer', value: 30 }
			});
		});

		it('handles enum_list values', () => {
			const filters: TableFilterState = { tags: ['admin', 'user'] };
			const result = toSearchFilters(filters, allFilterColumns, searchConfig);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				field: 'tags',
				operator: 'includes',
				value: { type: 'enum_list', value: ['admin', 'user'] }
			});
		});
	});

	describe('plugin stability', () => {
		/**
		 * **Restated.** Upstream renders `Capture` twice and asserts the memoised
		 * plugin object survived. A Svelte hook runs once per component instance,
		 * so "two renders" has no counterpart; the comparison is made instead
		 * across a change to `variant` — the input upstream lists in its `useMemo`
		 * dependency array, and therefore the one change that would hand back a new
		 * object upstream. The port reads it at call time, so the same object must
		 * still be there. `plugins[0] === plugins[1]` is upstream's assertion,
		 * unchanged.
		 *
		 * On its own, though, that assertion is **unfalsifiable** here: `plugin` is
		 * a `const` in the fixture and `screen.component` is captured once, so both
		 * array entries are the same binding for any implementation. The property
		 * that can actually fail is what the stable plugin *produces* — the keyed
		 * `after` slot must hand back the same snippet across a transform re-run,
		 * or `{@render}` keys onto a new function identity and replaces the filter
		 * trigger instead of updating it, taking its focus and popover state with
		 * it. A `filters` change is what forces that re-run; it is asserted before
		 * the variant change because the popover trigger does not *survive* a
		 * switch to the inline variant — inline fills the `below` slot and leaves
		 * `after` empty, so there is no trigger element to compare across it.
		 * Mutation-checked; see the run notes.
		 */
		it('returns a referentially stable plugin object', async () => {
			const screen = await render(Capture, { props: { variant: 'popover' } });
			const plugins = screen.component.captured;

			await expect.poll(() => plugins.length).toBeGreaterThanOrEqual(1);

			const triggerBefore = screen.container.querySelector('th button');
			expect(triggerBefore).not.toBeNull();
			await screen.rerender({ variant: 'popover', filters: { name: 'alice' } });
			await expect.poll(() => screen.container.querySelector('th button')).toBe(triggerBefore);

			await screen.rerender({ variant: 'inline', filters: { name: 'alice' } });
			await expect.poll(() => plugins.length).toBeGreaterThanOrEqual(2);

			expect(plugins[0]).toBe(plugins[1]);
		});

		/**
		 * **Restated.** Upstream's `expect(() => render(…)).not.toThrow()` is
		 * vacuous against an async `render`; the mounted result is asserted
		 * instead.
		 */
		it('works with no filterable columns', async () => {
			const noFilterColumns: TableColumn<TestRow>[] = [
				{ key: 'name', header: 'Name' },
				{ key: 'status', header: 'Status' }
			];
			const screen = await render(FilterTable, { props: { columns: noFilterColumns } });
			expect(screen.container.querySelector('table')).not.toBeNull();
			expect(screen.container.querySelectorAll('thead th')).toHaveLength(2);
		});
	});
});
