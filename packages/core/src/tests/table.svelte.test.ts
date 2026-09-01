/** PORTS: Table/Table.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import {
	DEFAULT_MIN_COLUMN_WIDTH,
	capitalize,
	generateColumns,
	pixel,
	proportional,
	resolveColumnWidths
} from '$lib/components/table/column-utils.js';
import type {
	ProportionalWidth,
	TableColumn,
	TablePlugin
} from '$lib/components/table/table-types.js';
import TableChildrenFixture from './fixtures/table-children-fixture.svelte';
import TableCellFixture from './fixtures/table-cell-fixture.svelte';
import TableFixture from './fixtures/table-fixture.svelte';
import TableRowFixture from './fixtures/table-row-fixture.svelte';
import TableSectionsFixture from './fixtures/table-sections-fixture.svelte';
import { dynamic } from './fixtures/table-xstyle.stylex.js';
import { renderBaseTable, renderTable } from './render-table.js';

/**
 * Ported from Astryx's `Table/Table.test.tsx` — **121 of its 130 `it` cases at
 * the 0.5.0 pin**, in upstream's order and under upstream's names, with two
 * families renamed because their mechanism changed (below).
 *
 * The 9 not here: the whole `TableRow styling props` describe (2 — `className`
 * and `style` on a row, in-table and standalone), the two `isContentSuppressed`
 * plugin-pipeline cases, the four children-mode section-ownership cases
 * (`TableHeader`/`TableBody` supply the `thead`/`tbody` and `Table` renders
 * none of its own) and `capitalize`'s astral-plane case (#4759). Only
 * `isContentSuppressed` is blocked — that `BodyCellRenderProps` flag has no
 * counterpart in this port; the other seven are coverage debt against source
 * that already behaves as they assert.
 *
 * **No case here is deferred with the plugin hooks**, and `Table.test.tsx`
 * imports none of them: every plugin in the file is a hand-written object handed
 * to the public `plugins` prop, and that pipeline is fully ported. Checked case
 * by case, not assumed. (The header used to add that the hooks "do not exist in
 * this repo"; `components/table/plugins/` now holds them, so that reason has
 * expired — it deferred nothing either way.)
 *
 * **`Table.perf.test.tsx` (11 cases) is not ported, and no counterpart file
 * exists.** This repo ports no perf suite — `src/tests/` has never had one —
 * and each of its three groups is unportable for its own reason:
 *
 * - Five cases count how many times a `renderCell` runs across a state change,
 *   which is a measurement of `React.memo` + `areRowPropsEqual`. There is no
 *   `MemoizedTableRow` here: the keyed `{#each}` and fine-grained reactivity
 *   *are* the memo, and `renderCell` is a `Snippet` whose body re-runs when the
 *   values it reads change rather than when a parent re-renders. The question
 *   "how many rows re-rendered" has no addressee.
 * - Three cases assert only that a React parent re-renders when its own state
 *   changes (`expect(renderCount).toHaveBeenCalledTimes(2)`). That is React's
 *   semantics, not the Table's. The only *behavioural* thing any of the eight
 *   asserts is that a changed cell shows its new value, which
 *   `clears a cell when the field is removed from the row object (#3595)`
 *   below covers in its stronger form.
 * - Three cases assert wall-clock budgets (100 rows under 200 ms, 500 under
 *   500, an update under 100) taken in jsdom against React's synchronous
 *   render. Mounting through Playwright into a real Chromium measures something
 *   else entirely, and a wall-clock budget in the client project is precisely
 *   the flake family `fileParallelism: false` exists to retire.
 *
 * Standing translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited; `rerender` is `screen.rerender`, which
 *   takes the whole props object.
 * - `screen.getAllByRole(r)` becomes `screen.getByRole(r).elements()`;
 *   `queryByX` becomes `screen.getByX(…).query()`; `container` is
 *   `screen.container`.
 * - **`getByText` always passes `{exact: true}`.** Testing Library matches a
 *   whole normalized string by default; a Vitest browser locator matches a
 *   case-insensitive *substring*, so a bare `getByText('Alice')` also matches
 *   the `alice@example.com` cell and trips strict mode. `exact` restores
 *   upstream's semantics rather than changing what is asserted.
 * - Four `forwards ref to the <x> element` cases become **`hands the <x>
 *   element to an attachment passed through rest props`** — the `ButtonGroup`
 *   counterpart. It checks more than upstream's does: upstream asserts the
 *   callback received *an* `HTMLTableElement`, this asserts it received *the*
 *   one in the document.
 * - A column's `renderCell` and `header` are `Snippet`s and `emptyState` is a
 *   `Snippet | false`, none of which can be authored in a `.ts` file, so the
 *   cases that use them go through `table-fixture.svelte`, which names each
 *   snippet by string. Children mode likewise goes through
 *   `table-children-fixture.svelte`; the bare `TableRow` / `TableCell` /
 *   section cases through their own fixtures, since each must sit inside a real
 *   `<table>`.
 * - `colSpan`/`rowSpan` are `colspan`/`rowspan` — Svelte's attribute names, and
 *   what upstream's own assertions already read out of the DOM.
 * - `render(Table, …)` / `render(BaseTable, …)` are the `renderTable` /
 *   `renderBaseTable` wrappers from `./render-table.js`, which pin the row
 *   generic per call. `render()` takes the component as a value, so it has no
 *   `data` to infer `T` from and instantiates it at its constraint — see that
 *   file for why, and for why markup does not have the problem. Only the
 *   inference site moves; the props are still checked against the component's
 *   real props type.
 * - Exactly one assertion is **restated**, `passes through idKey function to
 *   base table`; the comment at the case says why, and it is a Svelte runtime
 *   behaviour rather than a port one. Every other assertion is upstream's.
 *
 * Three cases here — `applies transformTable plugin`, `accepts user plugins
 * alongside XDS styling` and `runs user plugins after XDS styling plugin` —
 * found a real defect in `base-table.svelte` on first run, and it has since
 * been fixed: the `<table>` re-emitted `data-testid={testId}` *after*
 * `{...tableRenderProps.htmlProps}`, so an `undefined` consumer value erased a
 * plugin-set attribute. `data-testid` now rides `rest`, as upstream lets it.
 * Kept in mind if that destructure ever comes back.
 *
 * One divergence worth stating loudly, though no upstream case pins it:
 * upstream's `TableRow` spreads `{...props}` *before* `mergeProps`, so a
 * caller's `className` is clobbered by the merged one. This port composes them
 * instead, on the `Dialog` `role`-clobber precedent. Upstream's case title says
 * "excluding className/style" but its body asserts only `aria-label`, so the
 * ported assertion is unchanged and nothing needed inverting.
 */

// =============================================================================
// Test Data
// =============================================================================

interface User extends Record<string, unknown> {
	name: string;
	age: number;
	email: string;
}

const users: User[] = [
	{ name: 'Alice', age: 30, email: 'alice@example.com' },
	{ name: 'Bob', age: 25, email: 'bob@example.com' },
	{ name: 'Charlie', age: 35, email: 'charlie@example.com' }
];

const columns: TableColumn<User>[] = [
	{ key: 'name', header: 'Name' },
	{ key: 'age', header: 'Age', width: pixel(80) },
	{ key: 'email', header: 'Email', width: proportional(2) }
];

// =============================================================================
// columnUtils Tests
// =============================================================================

describe('columnUtils', () => {
	describe('proportional', () => {
		it('creates a proportional width with default value 1 and default minWidth', () => {
			const w = proportional();
			expect(w).toEqual({
				type: 'proportional',
				value: 1,
				minWidth: DEFAULT_MIN_COLUMN_WIDTH
			});
		});

		it('creates a proportional width with custom value and default minWidth', () => {
			const w = proportional(3);
			expect(w).toEqual({
				type: 'proportional',
				value: 3,
				minWidth: DEFAULT_MIN_COLUMN_WIDTH
			});
		});
	});

	describe('pixel', () => {
		it('creates a pixel width', () => {
			const w = pixel(200);
			expect(w).toEqual({ type: 'pixel', value: 200 });
		});
	});

	describe('capitalize', () => {
		it('capitalizes first letter', () => {
			expect(capitalize('name')).toBe('Name');
		});

		it('handles empty string', () => {
			expect(capitalize('')).toBe('');
		});

		it('handles single character', () => {
			expect(capitalize('a')).toBe('A');
		});
	});

	describe('generateColumns', () => {
		it('generates columns from data keys', () => {
			const cols = generateColumns(users);
			expect(cols).toHaveLength(3);
			expect(cols[0].key).toBe('name');
			expect(cols[0].header).toBe('Name');
			expect(cols[1].key).toBe('age');
			expect(cols[1].header).toBe('Age');
			expect(cols[2].key).toBe('email');
			expect(cols[2].header).toBe('Email');
		});

		it('returns empty array for empty data', () => {
			expect(generateColumns([])).toEqual([]);
		});

		it('assigns content-proportional widths based on data analysis', () => {
			const cols = generateColumns(users);
			// All columns should have proportional type
			for (const col of cols) {
				expect(col.width?.type).toBe('proportional');
			}
			// Columns with longer content should get higher proportion
			const emailCol = cols.find((c) => c.key === 'email')!;
			const ageCol = cols.find((c) => c.key === 'age')!;
			expect(emailCol.width!.value).toBeGreaterThan(ageCol.width!.value);
		});

		it('derives min-width from header or longest word', () => {
			const cols = generateColumns(users);
			for (const col of cols) {
				// Min-width should be at least the floor
				expect((col.width as ProportionalWidth).minWidth).toBeGreaterThanOrEqual(60);
			}
		});

		it('produces stable width values for known data', () => {
			const cols = generateColumns(users);
			// Snapshot: these values should remain stable over time.
			// name: "Charlie" (7 chars) → medium → proportion 2
			// age: "35" (2 chars) → short → proportion 1
			// email: "charlie@example.com" (19 chars) → long → proportion 3
			const nameCol = cols.find((c) => c.key === 'name')!;
			const ageCol = cols.find((c) => c.key === 'age')!;
			const emailCol = cols.find((c) => c.key === 'email')!;

			expect(nameCol.width).toEqual({
				type: 'proportional',
				value: 2,
				minWidth: 60 // max("Name"=4, "Charlie"=7) * 8 = 56 → floor 60
			});
			expect(ageCol.width).toEqual({
				type: 'proportional',
				value: 1,
				minWidth: 60 // max("Age"=3, "35"=2) * 8 = 24 → floor 60
			});
			expect(emailCol.width).toEqual({
				type: 'proportional',
				value: 3,
				minWidth: 152 // max("Email"=5, "charlie@example.com"=19) * 8 = 152
			});
		});

		it('does not analyze non-string/number values', () => {
			const data = [
				{ id: 1, meta: { nested: 'object' }, tags: ['a', 'b'] },
				{ id: 2, meta: { nested: 'thing' }, tags: ['c'] }
			];
			const cols = generateColumns(data);
			// meta and tags are objects/arrays — should get 0 content length
			// so their proportion comes only from header length
			const metaCol = cols.find((c) => c.key === 'meta')!;
			const tagsCol = cols.find((c) => c.key === 'tags')!;
			// Header "Meta" = 4, "Tags" = 4 — both should have same proportion
			expect((metaCol.width as ProportionalWidth).value).toBe(
				(tagsCol.width as ProportionalWidth).value
			);
		});

		it('never overrides explicit column widths', () => {
			// generateColumns is only called when no columns prop is provided.
			// This test verifies the contract: explicit widths pass through unchanged.
			const explicit: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: pixel(200) },
				{
					key: 'email',
					header: 'Email',
					width: proportional(3, { minWidth: 300 })
				}
			];
			// resolveColumnWidths should use the explicit values, not re-derive
			const resolved = resolveColumnWidths(explicit);
			expect(resolved.columns.get('name')?.style.width).toBe('200px');
			expect(resolved.columns.get('email')?.style.minWidth).toBe('300px');
		});
	});

	describe('proportional with minWidth', () => {
		it('creates a proportional width with explicit minWidth', () => {
			const w = proportional(1, { minWidth: 200 });
			expect(w).toEqual({ type: 'proportional', value: 1, minWidth: 200 });
		});

		it('uses DEFAULT_MIN_COLUMN_WIDTH when no minWidth provided', () => {
			const w = proportional(2);
			expect(w).toEqual({
				type: 'proportional',
				value: 2,
				minWidth: DEFAULT_MIN_COLUMN_WIDTH
			});
			expect(w.minWidth).toBe(DEFAULT_MIN_COLUMN_WIDTH);
		});
	});
});

// =============================================================================
// BaseTable Tests
// =============================================================================

describe('BaseTable', () => {
	it('renders a table element', async () => {
		const screen = await renderBaseTable({ data: users, columns });
		await expect.element(screen.getByRole('table')).toBeInTheDocument();
	});

	it('renders column headers as th elements', async () => {
		const screen = await renderBaseTable({ data: users, columns });
		const headers = screen.getByRole('columnheader').elements();
		expect(headers).toHaveLength(3);
		expect(headers[0]).toHaveTextContent('Name');
		expect(headers[1]).toHaveTextContent('Age');
		expect(headers[2]).toHaveTextContent('Email');
	});

	it('renders every column header with scope="col"', async () => {
		const screen = await renderBaseTable({ data: users, columns });
		const headers = screen.getByRole('columnheader').elements();
		expect(headers).toHaveLength(3);
		for (const header of headers) {
			expect(header).toHaveAttribute('scope', 'col');
		}
	});

	it('lets a consumer override scope via header html props', async () => {
		// A `<th scope="row">` maps to the `rowheader` role, so query the DOM
		// directly to assert the attribute regardless of the resolved ARIA role.
		const plugin: TablePlugin<User> = {
			transformHeaderCell: (props, column) =>
				column.key === 'name'
					? { ...props, htmlProps: { ...props.htmlProps, scope: 'row' } }
					: props
		};
		const screen = await renderBaseTable({ data: users, columns, plugins: [plugin] });
		const headerCells = screen.container.querySelectorAll('thead th');
		// columns fixture order: name, age, email — plugin overrides name → 'row'
		expect(headerCells[0]).toHaveAttribute('scope', 'row');
		expect(headerCells[1]).toHaveAttribute('scope', 'col');
		expect(headerCells[2]).toHaveAttribute('scope', 'col');
	});

	it('renders data cells', async () => {
		const screen = await renderBaseTable({ data: users, columns });
		const cells = screen.getByRole('cell').elements();
		// 3 rows * 3 columns = 9 cells
		expect(cells).toHaveLength(9);
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('30', { exact: true })).toBeInTheDocument();
		await expect
			.element(screen.getByText('alice@example.com', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders correct number of rows', async () => {
		const screen = await renderBaseTable({ data: users, columns });
		// 1 header row + 3 data rows
		expect(screen.getByRole('row').elements()).toHaveLength(4);
	});

	it('does not apply hover styling to the header row when hasHover is set', async () => {
		// Use the public Table (provides TableContext); BaseTable alone has no
		// context, so rows wouldn't pick up hover styling at all.
		const screen = await renderTable({ data: users, columns, hasHover: true });
		const headerRow = screen.container.querySelector('thead tr');
		const bodyRow = screen.container.querySelector('tbody tr');
		expect(headerRow).not.toBeNull();
		expect(bodyRow).not.toBeNull();

		const headerClasses = new Set((headerRow?.className ?? '').split(/\s+/).filter(Boolean));
		// The body row carries hover-styling class(es) that the header row does not.
		const bodyOnlyClasses = (bodyRow?.className ?? '')
			.split(/\s+/)
			.filter((c) => c && !headerClasses.has(c));
		expect(bodyOnlyClasses.length).toBeGreaterThan(0);
	});

	it('auto-generates columns from data keys when columns omitted', async () => {
		const screen = await renderBaseTable({ data: users });
		const headers = screen.getByRole('columnheader').elements();
		expect(headers).toHaveLength(3);
		expect(headers[0]).toHaveTextContent('Name');
		expect(headers[1]).toHaveTextContent('Age');
		expect(headers[2]).toHaveTextContent('Email');
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
	});

	it('uses raw key as header when header prop is not provided', async () => {
		const cols: TableColumn<User>[] = [{ key: 'name' }];
		const screen = await renderBaseTable({ data: users, columns: cols });
		expect(screen.getByRole('columnheader').element()).toHaveTextContent('name');
	});

	it('renders custom header as ReactNode', async () => {
		// Upstream passes `<span data-testid="custom-header">Full Name</span>` as
		// `header`; here it is the fixture's `full-name` snippet.
		const screen = await render(TableFixture, {
			props: { base: true, data: users, columns: [{ key: 'name', headerSlot: 'full-name' }] }
		});
		expect(screen.getByTestId('custom-header').element()).toHaveTextContent('Full Name');
	});

	it('uses idKey string to key rows', async () => {
		const screen = await renderBaseTable({ data: users, columns, idKey: 'email' });
		expect(screen.getByRole('row').elements()).toHaveLength(4);
	});

	it('uses idKey function to key rows', async () => {
		const screen = await renderBaseTable({
			data: users,
			columns,
			idKey: (item: User) => item.email
		});
		expect(screen.getByRole('row').elements()).toHaveLength(4);
	});

	it('renders custom cell renderer', async () => {
		const screen = await render(TableFixture, {
			props: {
				base: true,
				data: users,
				columns: [{ key: 'name', header: 'Name', cellSlot: 'bold-name' }]
			}
		});
		const boldNames = screen.getByTestId('bold-name').elements();
		expect(boldNames).toHaveLength(3);
		expect(boldNames[0]).toHaveTextContent('Alice');
	});

	it('renders null/undefined values as empty string', async () => {
		const data = [{ name: null as unknown as string, age: 0, email: '' }];
		const screen = await renderBaseTable({ data, columns });
		const cells = screen.getByRole('cell').elements();
		// null renders as empty, 0 renders as '0', empty string renders as empty
		expect(cells[0]).toHaveTextContent('');
		expect(cells[1]).toHaveTextContent('0');
		expect(cells[2]).toHaveTextContent('');
	});

	it('renders children mode instead of data', async () => {
		const screen = await render(TableChildrenFixture, {
			props: { base: true, mode: 'bare-row' }
		});
		await expect.element(screen.getByText('Manual cell', { exact: true })).toBeInTheDocument();
	});

	it('does not render thead in children mode without columns', async () => {
		const screen = await render(TableChildrenFixture, {
			props: { base: true, mode: 'bare-row' }
		});
		expect(screen.container.querySelector('thead')).toBeNull();
	});

	it('renders empty table when data is empty array', async () => {
		const screen = await renderBaseTable({ data: [], columns });
		await expect.element(screen.getByRole('table')).toBeInTheDocument();
		// Header row + empty state row
		expect(screen.getByRole('row').elements()).toHaveLength(2);
		await expect.element(screen.getByText('No data', { exact: true })).toBeInTheDocument();
	});

	it('does not render colgroup', async () => {
		const screen = await renderBaseTable({ data: users, columns });
		expect(screen.container.querySelector('colgroup')).toBeNull();
	});

	// Counterpart to upstream's `forwards ref to the table element`. Svelte has
	// no `ref`; an attachment threaded through rest props is how a consumer
	// reaches the element, and it receives the node rather than only proving a
	// callback ran.
	it('hands the table element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await renderBaseTable({
			data: users,
			columns,
			[createAttachmentKey()]: attached
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLTableElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('table'));
	});

	describe('root element styling props (#3679)', () => {
		it('applies className to the table element', async () => {
			const screen = await renderTable({ data: users, columns, class: 'custom-table' });
			expect(screen.getByRole('table').element().className).toContain('custom-table');
		});

		it('applies style to the table element', async () => {
			const screen = await renderTable({ data: users, columns, style: 'opacity:0.9' });
			expect((screen.getByRole('table').element() as HTMLElement).style.opacity).toBe('0.9');
		});

		it('accepts xstyle without error', async () => {
			const screen = await renderTable({ data: users, columns, xstyle: undefined });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
		});

		it('spreads id and aria attributes onto the table element', async () => {
			const screen = await renderTable({
				data: users,
				columns,
				id: 'users-table',
				'aria-label': 'Users',
				'data-analytics': 'tables'
			});
			const table = screen.getByRole('table', { name: 'Users', exact: true }).element();
			expect(table.id).toBe('users-table');
			expect(table).toHaveAttribute('data-analytics', 'tables');
		});

		it('keeps the computed column min-width over a consumer style.minWidth', async () => {
			const { tableMinWidth } = resolveColumnWidths(columns);
			const screen = await renderTable({ data: users, columns, style: 'min-width:10px' });
			expect((screen.getByRole('table').element() as HTMLElement).style.minWidth).toBe(
				`${tableMinWidth}px`
			);
		});

		it('lets a consumer style.minWidth survive when columns compute none', async () => {
			const plain: TableColumn<User>[] = [{ key: 'name' }, { key: 'age' }];
			const screen = await renderTable({ data: users, columns: plain, style: 'min-width:10px' });
			expect((screen.getByRole('table').element() as HTMLElement).style.minWidth).toBe('10px');
		});

		it('keeps the astryx theme classes alongside a consumer className', async () => {
			const screen = await renderTable({ data: users, columns, class: 'custom-table' });
			const table = screen.getByRole('table').element();
			expect(table.className).toContain('astryx-base-table');
			expect(table.className).toContain('astryx-table');
			expect(table.className).toContain('custom-table');
		});

		it('passes event handlers through to the table element', async () => {
			const onClick = vi.fn();
			const screen = await renderTable({ data: users, columns, onclick: onClick });
			screen
				.getByRole('table')
				.element()
				.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it('applies dynamic xstyle values to the table element', async () => {
			const screen = await renderTable({ data: users, columns, xstyle: dynamic.opacity(0.42) });
			expect(screen.getByRole('table').element().getAttribute('style')).toContain('0.42');
		});

		it('honors className in children mode', async () => {
			const screen = await render(TableChildrenFixture, {
				props: { mode: 'body-with-row', rest: { class: 'custom-table' } }
			});
			expect(screen.getByRole('table').element().className).toContain('custom-table');
		});

		it('honors className on an unwrapped BaseTable (no scrollWrapper)', async () => {
			const screen = await renderBaseTable({ data: users, columns, class: 'custom-table' });
			expect(screen.getByRole('table').element().className).toContain('custom-table');
		});
	});

	describe('plugin pipeline', () => {
		it('applies transformTable plugin', async () => {
			const plugin: TablePlugin<User> = {
				transformTable: (props) => ({
					...props,
					htmlProps: { ...props.htmlProps, 'data-testid': 'plugin-table' }
				})
			};
			const screen = await renderBaseTable({ data: users, columns, plugins: [plugin] });
			await expect.element(screen.getByTestId('plugin-table')).toBeInTheDocument();
		});

		it('applies transformHeaderRow plugin', async () => {
			const plugin: TablePlugin<User> = {
				transformHeaderRow: (props) => ({
					...props,
					htmlProps: { ...props.htmlProps, 'data-testid': 'plugin-header-row' }
				})
			};
			const screen = await renderBaseTable({ data: users, columns, plugins: [plugin] });
			await expect.element(screen.getByTestId('plugin-header-row')).toBeInTheDocument();
		});

		it('applies transformHeaderCell plugin with column context', async () => {
			const receivedKeys: string[] = [];
			const plugin: TablePlugin<User> = {
				transformHeaderCell: (props, column) => {
					receivedKeys.push(column.key);
					return {
						...props,
						htmlProps: { ...props.htmlProps, 'data-column': column.key }
					};
				}
			};
			const screen = await renderBaseTable({ data: users, columns, plugins: [plugin] });
			expect(receivedKeys).toEqual(['name', 'age', 'email']);
			const headers = screen.getByRole('columnheader').elements();
			expect(headers[0]).toHaveAttribute('data-column', 'name');
		});

		it('applies transformBodyRow plugin with item and index', async () => {
			const receivedItems: string[] = [];
			const plugin: TablePlugin<User> = {
				transformBodyRow: (props, item, index) => {
					receivedItems.push(item.name);
					return {
						...props,
						htmlProps: { ...props.htmlProps, 'data-row-index': String(index) }
					};
				}
			};
			await renderBaseTable({ data: users, columns, plugins: [plugin] });
			expect(receivedItems).toEqual(['Alice', 'Bob', 'Charlie']);
		});

		it('applies transformBodyCell plugin with column and item context', async () => {
			const calls: { col: string; name: string }[] = [];
			const plugin: TablePlugin<User> = {
				transformBodyCell: (props, column, item) => {
					calls.push({ col: column.key, name: item.name });
					return props;
				}
			};
			await renderBaseTable({ data: users, columns, plugins: [plugin] });
			// 3 rows * 3 columns = 9 calls
			expect(calls).toHaveLength(9);
			expect(calls[0]).toEqual({ col: 'name', name: 'Alice' });
		});

		it('composes multiple plugins sequentially', async () => {
			const plugin1: TablePlugin<User> = {
				transformTable: (props) => ({
					...props,
					htmlProps: { ...props.htmlProps, 'data-first': 'yes' }
				})
			};
			const plugin2: TablePlugin<User> = {
				transformTable: (props) => ({
					...props,
					htmlProps: { ...props.htmlProps, 'data-second': 'yes' }
				})
			};
			const screen = await renderBaseTable({ data: users, columns, plugins: [plugin1, plugin2] });
			const table = screen.getByRole('table').element();
			expect(table).toHaveAttribute('data-first', 'yes');
			expect(table).toHaveAttribute('data-second', 'yes');
		});

		it('later plugin can read props set by earlier plugin', async () => {
			const plugin1: TablePlugin<User> = {
				transformTable: (props) => ({
					...props,
					htmlProps: { ...props.htmlProps, 'data-step': '1' }
				})
			};
			const plugin2: TablePlugin<User> = {
				transformTable: (props) => {
					const step = (props.htmlProps as Record<string, string>)['data-step'];
					return {
						...props,
						htmlProps: { ...props.htmlProps, 'data-step': step + ',2' }
					};
				}
			};
			const screen = await renderBaseTable({ data: users, columns, plugins: [plugin1, plugin2] });
			expect(screen.getByRole('table').element()).toHaveAttribute('data-step', '1,2');
		});
	});

	describe('column min-widths', () => {
		it('applies default minWidth on header cells for proportional columns', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: proportional(1) },
				{ key: 'age', header: 'Age', width: proportional(1) }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const headers = screen.getByRole('columnheader').elements();
			expect(headers[0]).toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH}px`
			});
			expect(headers[1]).toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH}px`
			});
		});

		it('applies explicit minWidth on proportional columns', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: proportional(1, { minWidth: 200 }) },
				{ key: 'age', header: 'Age', width: proportional(1) }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const headers = screen.getByRole('columnheader').elements();
			expect(headers[0]).toHaveStyle({ minWidth: '200px' });
			expect(headers[1]).toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH}px`
			});
		});

		it('sets minWidth on pixel columns to prevent shrinking', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: pixel(80) },
				{ key: 'age', header: 'Age', width: proportional(1) }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const headers = screen.getByRole('columnheader').elements();
			expect(headers[0]).toHaveStyle({ width: '80px', minWidth: '80px' });
			expect(headers[1]).toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH}px`
			});
		});

		it('applies content-derived minWidth on auto-generated columns', async () => {
			const screen = await renderBaseTable({ data: users });
			const headers = screen.getByRole('columnheader').elements();
			for (const header of headers) {
				// Each column should have a minWidth derived from content (at least 60px floor)
				const style = header.getAttribute('style') ?? '';
				expect(style).toContain('min-width');
			}
		});

		it('does not apply minWidth on columns with no explicit width', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name' },
				{ key: 'age', header: 'Age' }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const headers = screen.getByRole('columnheader').elements();
			expect(headers[0]).not.toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH}px`
			});
			expect(headers[1]).not.toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH}px`
			});
		});

		it('sets table min-width to enforce proportional column minimums', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: proportional(1) },
				{ key: 'age', header: 'Age', width: proportional(1) }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const table = screen.getByRole('table').element();
			// 2 equal columns: 120 * 2 / 1 = 240px
			expect(table).toHaveStyle({
				minWidth: `${DEFAULT_MIN_COLUMN_WIDTH * 2}px`
			});
		});

		it('sets table min-width based on most constrained proportional column', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: proportional(1, { minWidth: 200 }) },
				{ key: 'age', header: 'Age', width: proportional(1) }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const table = screen.getByRole('table').element();
			// name requires: 200 * 2 / 1 = 400px (most constrained)
			// age requires:  120 * 2 / 1 = 240px
			expect(table).toHaveStyle({ minWidth: '400px' });
		});

		it('sets table min-width accounting for pixel and proportional columns', async () => {
			const cols: TableColumn<User>[] = [
				{ key: 'name', header: 'Name', width: pixel(80) },
				{ key: 'age', header: 'Age', width: proportional(1) }
			];
			const screen = await renderBaseTable({ data: users, columns: cols });
			const table = screen.getByRole('table').element();
			// pixel: 80px + proportional requires 120 * 1 / 1 = 120px
			// Table min-width = 80 + 120 = 200px
			expect(table).toHaveStyle({
				minWidth: `${80 + DEFAULT_MIN_COLUMN_WIDTH}px`
			});
		});
	});
});

// =============================================================================
// Table Tests
// =============================================================================

describe('Table', () => {
	it('clears a cell when the field is removed from the row object (#3595)', async () => {
		const cols: TableColumn<Record<string, unknown>>[] = [
			{ key: 'name', header: 'Name' },
			{ key: 'status', header: 'Status' }
		];
		// `T` is pinned rather than inferred from the first `data`: the whole case
		// is that the second render drops a field, so inferring the row shape from
		// the first would make the rerender a type error. Upstream's `cols` pins
		// exactly the same `Record<string, unknown>`.
		const screen = await renderTable<Record<string, unknown>>({
			data: [{ id: '1', name: 'Alice', status: 'active' }],
			columns: cols,
			idKey: 'id'
		});
		await expect.element(screen.getByText('active', { exact: true })).toBeInTheDocument();

		// Clearing a field by omitting it (optimistic update / server response)
		// must re-render the row — upstream's memo previously only compared the
		// keys of the NEW item, so the deleted field's stale value kept rendering.
		await screen.rerender({
			data: [{ id: '1', name: 'Alice' }],
			columns: cols,
			idKey: 'id'
		});
		expect(screen.getByText('active', { exact: true }).query()).not.toBeInTheDocument();
	});

	it('renders a table with correct structure', async () => {
		const screen = await renderTable({ data: users, columns });
		await expect.element(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.getByRole('columnheader').elements()).toHaveLength(3);
		expect(screen.getByRole('cell').elements()).toHaveLength(9);
		expect(screen.getByRole('row').elements()).toHaveLength(4);
	});

	it('wraps table in a scroll container', async () => {
		const screen = await renderTable({ data: users, columns });
		const table = screen.getByRole('table').element();
		const wrapper = table.parentElement;
		expect(wrapper).toBeTruthy();
		expect(wrapper!.className).toContain('astryx-table-scroll-wrapper');
	});

	it('makes the scroll container keyboard-focusable', async () => {
		const screen = await renderTable({ data: users, columns });
		const table = screen.getByRole('table').element();
		const wrapper = table.parentElement;
		expect(wrapper).toBeTruthy();
		expect(wrapper!).toHaveAttribute('tabindex', '0');
		expect(wrapper!).toHaveAttribute('role', 'group');
		expect(wrapper!).toHaveAttribute('aria-label', 'Table');
	});

	it('uses table-layout: auto in children mode', async () => {
		const screen = await render(TableChildrenFixture, {
			props: { mode: 'bare-body', rest: { dividers: 'rows' } }
		});
		const table = screen.container.querySelector('table');
		expect(table).toHaveStyle({ tableLayout: 'auto' });
	});

	it('uses table-layout: fixed in data-driven mode', async () => {
		const screen = await renderTable({ data: users, columns });
		const table = screen.container.querySelector('table');
		expect(table).toHaveStyle({ tableLayout: 'fixed' });
	});

	it('renders all data values', async () => {
		const screen = await renderTable({ data: users, columns });
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Bob', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Charlie', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('30', { exact: true })).toBeInTheDocument();
		await expect
			.element(screen.getByText('alice@example.com', { exact: true }))
			.toBeInTheDocument();
	});

	it('auto-generates columns from data', async () => {
		const screen = await renderTable({ data: users });
		const headers = screen.getByRole('columnheader').elements();
		expect(headers).toHaveLength(3);
		expect(headers[0]).toHaveTextContent('Name');
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
	});

	// Counterpart to upstream's `forwards ref to the table element`, as above.
	it('hands the table element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await renderTable({ data: users, columns, [createAttachmentKey()]: attached });
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLTableElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('table'));
	});

	describe('density', () => {
		it('renders with compact density', async () => {
			const screen = await renderTable({ data: users, columns, density: 'compact' });
			expect(screen.getByRole('row').elements()).toHaveLength(4);
		});

		it('renders with balanced density (default)', async () => {
			const screen = await renderTable({ data: users, columns });
			expect(screen.getByRole('row').elements()).toHaveLength(4);
		});

		it('renders with spacious density', async () => {
			const screen = await renderTable({ data: users, columns, density: 'spacious' });
			expect(screen.getByRole('row').elements()).toHaveLength(4);
		});

		it('reflects density as data-density on cells and header cells (theme hook)', async () => {
			// The density lives in internal StyleX classes, so cells expose it as a
			// data-density attribute on the stable astryx-table-cell /
			// astryx-table-header-cell targets. This lets a theme override padding
			// per density (e.g. hold the inline inset while varying the block) via
			// `defineTheme` — the padding split is otherwise unreachable.
			const screen = await renderTable({ data: users, columns, density: 'spacious' });
			const cell = screen.getByRole('cell').elements()[0];
			const header = screen.getByRole('columnheader').elements()[0];
			expect(cell.className).toContain('astryx-table-cell');
			expect(cell).toHaveAttribute('data-density', 'spacious');
			expect(header.className).toContain('astryx-table-header-cell');
			expect(header).toHaveAttribute('data-density', 'spacious');

			await screen.rerender({ data: users, columns, density: 'compact' });
			expect(screen.getByRole('cell').elements()[0]).toHaveAttribute('data-density', 'compact');
			expect(screen.getByRole('columnheader').elements()[0]).toHaveAttribute(
				'data-density',
				'compact'
			);
		});
	});

	describe('dividers', () => {
		it('renders with row dividers (default)', async () => {
			const screen = await renderTable({ data: users, columns });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
		});

		it('renders with column dividers', async () => {
			const screen = await renderTable({ data: users, columns, dividers: 'columns' });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
		});

		it('renders with grid dividers', async () => {
			const screen = await renderTable({ data: users, columns, dividers: 'grid' });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
		});

		it('renders with no dividers', async () => {
			const screen = await renderTable({ data: users, columns, dividers: 'none' });
			await expect.element(screen.getByRole('table')).toBeInTheDocument();
		});
	});

	describe('striped', () => {
		it('renders with isStriped rows', async () => {
			const screen = await renderTable({ data: users, columns, isStriped: true });
			expect(screen.getByRole('row').elements()).toHaveLength(4);
		});
	});

	describe('hover', () => {
		it('renders with hasHover enabled', async () => {
			const screen = await renderTable({ data: users, columns, hasHover: true });
			expect(screen.getByRole('row').elements()).toHaveLength(4);
		});
	});

	it('renders with all appearance props combined', async () => {
		const screen = await renderTable({
			data: users,
			columns,
			density: 'compact',
			dividers: 'grid',
			isStriped: true,
			hasHover: true
		});
		await expect.element(screen.getByRole('table')).toBeInTheDocument();
		expect(screen.getByRole('row').elements()).toHaveLength(4);
		expect(screen.getByRole('cell').elements()).toHaveLength(9);
	});

	it('accepts user plugins alongside XDS styling', async () => {
		const userPlugin: TablePlugin<User> = {
			transformTable: (props) => ({
				...props,
				htmlProps: { ...props.htmlProps, 'data-testid': 'custom-plugin' }
			})
		};
		const screen = await renderTable({ data: users, columns, plugins: { custom: userPlugin } });
		await expect.element(screen.getByTestId('custom-plugin')).toBeInTheDocument();
	});

	it('runs user plugins after XDS styling plugin', async () => {
		const userPlugin: TablePlugin<User> = {
			transformTable: (props) => {
				// XDS plugin should have already added styles
				expect(props.xstyle.length).toBeGreaterThan(1);
				return {
					...props,
					htmlProps: { ...props.htmlProps, 'data-testid': 'after-xds' }
				};
			}
		};
		const screen = await renderTable({ data: users, columns, plugins: { custom: userPlugin } });
		await expect.element(screen.getByTestId('after-xds')).toBeInTheDocument();
	});

	it('renders children mode with TableRow and TableCell', async () => {
		const screen = await render(TableChildrenFixture, {
			props: { mode: 'rows', rest: { density: 'balanced', dividers: 'rows' } }
		});
		await expect.element(screen.getByText('Streamed A', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Streamed D', { exact: true })).toBeInTheDocument();
		expect(screen.getByRole('row').elements()).toHaveLength(2);
		expect(screen.getByRole('cell').elements()).toHaveLength(4);
	});

	it('passes through idKey string to base table', async () => {
		const screen = await renderTable({ data: users, columns, idKey: 'email' });
		expect(screen.getByRole('row').elements()).toHaveLength(4);
	});

	it('passes through idKey function to base table', async () => {
		const idKey = vi.fn((item: User) => item.email);
		await renderTable({ data: users, columns, idKey });
		// RESTATED. Upstream's `toHaveBeenCalledTimes(3)` pins React's `data.map`
		// calling the extractor once per row. Here the extractor *is* the
		// `{#each}` key expression, and Svelte's dev runtime evaluates it twice
		// per item on purpose, to check the key function is idempotent
		// (`each_key_volatile` — see `internal/client/dom/blocks/each.js`). A
		// literal count would therefore pin a Svelte internal rather than the
		// port. The question upstream asks — is `idKey` called for every row and
		// only the rows? — is what the distinct arguments answer.
		expect(new Set(idKey.mock.calls.map(([item]) => item))).toEqual(new Set(users));
		expect(idKey).toHaveBeenCalledWith(users[0]);
		expect(idKey).toHaveBeenCalledWith(users[1]);
		expect(idKey).toHaveBeenCalledWith(users[2]);
	});

	it('applies overflow truncation styles to body cells', async () => {
		// text-overflow: ellipsis + overflow: hidden + white-space: nowrap are applied
		// via StyleX class names when textOverflow="truncate".
		const longData = [
			{
				name: 'a_very_long_string_without_spaces_that_would_overflow_a_fixed_width_column',
				value: '42'
			}
		];
		const screen = await renderTable({ data: longData, textOverflow: 'truncate' });
		const cell = screen.getByRole('cell').elements()[0];
		// Cell should have at least one StyleX-generated class applied
		expect(cell.className.length).toBeGreaterThan(0);
		// Text content is present in the DOM (truncation is purely visual)
		expect(cell).toHaveTextContent(
			'a_very_long_string_without_spaces_that_would_overflow_a_fixed_width_column'
		);
	});

	it('wraps text by default (textOverflow="wrap")', async () => {
		const screen = await renderTable({ data: users, columns });
		const cells = screen.getByRole('cell').elements();
		// In wrap mode, no Text wrapper — content renders directly
		expect(cells[0]).toHaveTextContent('Alice');
		expect(cells[0]).not.toHaveAttribute('title');
	});

	it('wraps text when textOverflow="wrap"', async () => {
		const screen = await renderTable({ data: users, columns, textOverflow: 'wrap' });
		const cells = screen.getByRole('cell').elements();
		// In wrap mode, no title attribute is added (text is visible, not hidden)
		expect(cells[0]).not.toHaveAttribute('title');
		// Content is present
		expect(cells[0]).toHaveTextContent('Alice');
	});

	it('wraps default-rendered cells in Text when textOverflow="truncate"', async () => {
		const screen = await renderTable({ data: users, columns, textOverflow: 'truncate' });
		const cells = screen.getByRole('cell').elements();
		// Default-rendered cells contain an Text child element (a <span>)
		const textEl = cells[0].querySelector('span');
		expect(textEl).toBeTruthy();
		expect(textEl).toHaveTextContent('Alice');
	});

	it('does not wrap renderCell content in Text when truncating', async () => {
		const screen = await render(TableFixture, {
			props: {
				data: users,
				columns: [
					{ key: 'name', header: 'Name', cellSlot: 'custom-name' },
					{ key: 'email', header: 'Email' }
				],
				rest: { textOverflow: 'truncate' }
			}
		});
		// Custom renderCell: consumer owns the content
		const customCells = screen.getByTestId('custom').elements();
		expect(customCells[0]).toHaveTextContent('Alice');
	});

	it('sets title attribute on string header cells', async () => {
		const screen = await renderTable({ data: users, columns });
		const headers = screen.getByRole('columnheader').elements();
		// columns fixture order: name, age, email
		expect(headers[0]).toHaveAttribute('title', 'Name');
		expect(headers[1]).toHaveAttribute('title', 'Age');
		expect(headers[2]).toHaveAttribute('title', 'Email');
	});
});

// =============================================================================
// TableRow Tests
// =============================================================================

describe('TableRow', () => {
	it('renders a tr element', async () => {
		const screen = await render(TableRowFixture, {
			props: { rest: { 'data-testid': 'test-row' } }
		});
		expect(screen.getByTestId('test-row').element().tagName).toBe('TR');
	});

	it('renders children inside the tr', async () => {
		const screen = await render(TableRowFixture, { props: { cells: ['First', 'Second'] } });
		await expect.element(screen.getByText('First', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Second', { exact: true })).toBeInTheDocument();
	});

	// Counterpart to upstream's `forwards ref to the tr element`, as above.
	it('hands the tr element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(TableRowFixture, {
			props: { rest: { [createAttachmentKey()]: attached } }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLTableRowElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('tr'));
	});

	it('passes through HTML attributes (excluding className/style)', async () => {
		const screen = await render(TableRowFixture, {
			props: { rest: { 'data-testid': 'row', 'aria-label': 'test row' } }
		});
		expect(screen.getByTestId('row').element()).toHaveAttribute('aria-label', 'test row');
	});
});

// =============================================================================
// TableCell Tests
// =============================================================================

describe('TableCell', () => {
	it('renders a td element', async () => {
		const screen = await render(TableCellFixture, {
			props: { text: 'Content', rest: { 'data-testid': 'test-cell' } }
		});
		expect(screen.getByTestId('test-cell').element().tagName).toBe('TD');
	});

	it('renders children inside the td', async () => {
		const screen = await render(TableCellFixture, { props: { nested: true } });
		await expect.element(screen.getByText('Nested content', { exact: true })).toBeInTheDocument();
	});

	it('renders empty when no children provided', async () => {
		const screen = await render(TableCellFixture, {
			props: { empty: true, rest: { 'data-testid': 'empty-cell' } }
		});
		expect(screen.getByTestId('empty-cell').element()).toHaveTextContent('');
	});

	// Counterpart to upstream's `forwards ref to the td element`, as above.
	it('hands the td element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(TableCellFixture, {
			props: { text: 'Cell', rest: { [createAttachmentKey()]: attached } }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLTableCellElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('td'));
	});

	it('forwards colSpan attribute', async () => {
		const screen = await render(TableCellFixture, {
			props: { text: 'Spanning', rest: { colspan: 3, 'data-testid': 'span-cell' } }
		});
		expect(screen.getByTestId('span-cell').element()).toHaveAttribute('colspan', '3');
	});

	it('forwards rowSpan attribute', async () => {
		const screen = await render(TableCellFixture, {
			props: { text: 'Spanning', rest: { rowspan: 2, 'data-testid': 'rowspan-cell' } }
		});
		expect(screen.getByTestId('rowspan-cell').element()).toHaveAttribute('rowspan', '2');
	});
});

// =============================================================================
// Column Alignment Tests
// =============================================================================

describe('column alignment', () => {
	it('applies textAlign to header and body cells via inline style', async () => {
		const screen = await renderTable({
			data: users,
			columns: [
				{ key: 'name', header: 'Name' },
				{ key: 'age', header: 'Age', align: 'end' },
				{ key: 'email', header: 'Email', align: 'center' }
			] satisfies TableColumn<User>[]
		});

		const headerCells = screen.container.querySelectorAll('th');
		// First column: no explicit align (default 'start' is handled by CSS default)
		expect(headerCells[0]).not.toHaveStyle({ textAlign: 'end' });
		expect(headerCells[0]).not.toHaveStyle({ textAlign: 'center' });
		// Second column: end aligned
		expect(headerCells[1]).toHaveStyle({ textAlign: 'end' });
		// Third column: center aligned
		expect(headerCells[2]).toHaveStyle({ textAlign: 'center' });

		const bodyRows = screen.container.querySelectorAll('tbody tr');
		const firstRowCells = bodyRows[0].querySelectorAll('td');
		expect(firstRowCells[1]).toHaveStyle({ textAlign: 'end' });
		expect(firstRowCells[2]).toHaveStyle({ textAlign: 'center' });
	});

	it('defaults to start alignment when align is not specified', async () => {
		const screen = await renderTable({ data: users, columns: [{ key: 'name', header: 'Name' }] });

		const headerCell = screen.container.querySelector('th');
		// No textAlign inline style when default
		expect(headerCell?.style.textAlign).toBeFalsy();
	});

	it('applies align through the plugin pipeline on BaseTable', async () => {
		const screen = await renderBaseTable({
			data: users,
			columns: [
				{ key: 'name', header: 'Name', align: 'center' },
				{ key: 'age', header: 'Age', align: 'end' }
			] satisfies TableColumn<User>[]
		});

		const headerCells = screen.container.querySelectorAll('th');
		expect(headerCells[0]).toHaveStyle({ textAlign: 'center' });
		expect(headerCells[1]).toHaveStyle({ textAlign: 'end' });

		const bodyCells = screen.container.querySelectorAll('tbody td');
		expect(bodyCells[0]).toHaveStyle({ textAlign: 'center' });
		expect(bodyCells[1]).toHaveStyle({ textAlign: 'end' });
	});
});

// =============================================================================
// Vertical Alignment Tests
// =============================================================================

describe('vertical alignment', () => {
	it('defaults to middle vertical alignment', async () => {
		const screen = await renderTable({ data: users, columns: [{ key: 'name', header: 'Name' }] });

		const bodyCell = screen.container.querySelector('tbody td');
		expect(bodyCell).toHaveStyle({ verticalAlign: 'middle' });
	});

	it('applies top vertical alignment', async () => {
		const screen = await renderTable({
			data: users,
			columns: [{ key: 'name', header: 'Name' }],
			verticalAlign: 'top'
		});

		const bodyCell = screen.container.querySelector('tbody td');
		expect(bodyCell).toHaveStyle({ verticalAlign: 'top' });
	});

	it('applies bottom vertical alignment', async () => {
		const screen = await renderTable({
			data: users,
			columns: [{ key: 'name', header: 'Name' }],
			verticalAlign: 'bottom'
		});

		const bodyCell = screen.container.querySelector('tbody td');
		expect(bodyCell).toHaveStyle({ verticalAlign: 'bottom' });
	});
});

describe('emptyState', () => {
	it('renders default empty state when data is empty', async () => {
		const screen = await renderTable({
			data: [],
			columns: [
				{ key: 'name', header: 'Name' },
				{ key: 'age', header: 'Age' }
			]
		});
		await expect.element(screen.getByText('No data', { exact: true })).toBeInTheDocument();
	});

	it('renders custom empty state when provided', async () => {
		const screen = await render(TableFixture, {
			props: {
				data: [],
				columns: [
					{ key: 'name', header: 'Name' },
					{ key: 'age', header: 'Age' }
				],
				emptyText: 'No results found'
			}
		});
		await expect.element(screen.getByTestId('empty')).toBeInTheDocument();
		await expect.element(screen.getByText('No results found', { exact: true })).toBeInTheDocument();
	});

	it('does not render empty state when data has rows', async () => {
		const screen = await renderTable({
			data: [{ name: 'Alice', age: 30 }],
			columns: [
				{ key: 'name', header: 'Name' },
				{ key: 'age', header: 'Age' }
			]
		});
		expect(screen.getByText('No data', { exact: true }).query()).not.toBeInTheDocument();
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
	});

	it('does not render empty state when data is undefined', async () => {
		const screen = await renderTable({ columns: [{ key: 'name', header: 'Name' }] });
		expect(screen.getByText('No data', { exact: true }).query()).not.toBeInTheDocument();
	});

	it('disables empty state with false', async () => {
		const screen = await renderTable({
			data: [],
			columns: [{ key: 'name', header: 'Name' }],
			emptyState: false
		});
		expect(screen.getByText('No data', { exact: true }).query()).not.toBeInTheDocument();
	});

	it('empty state row spans all columns', async () => {
		const screen = await render(TableFixture, {
			props: {
				data: [],
				columns: [
					{ key: 'name', header: 'Name' },
					{ key: 'age', header: 'Age' },
					{ key: 'role', header: 'Role' }
				],
				emptyText: 'Nothing here'
			}
		});
		const td = screen.getByTestId('empty').element().closest('td');
		expect(td).toHaveAttribute('colspan', '3');
	});

	it('still renders headers even when data is empty', async () => {
		const screen = await renderTable({
			data: [],
			columns: [
				{ key: 'name', header: 'Name' },
				{ key: 'age', header: 'Age' }
			]
		});
		await expect.element(screen.getByText('Name', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Age', { exact: true })).toBeInTheDocument();
	});

	describe('table section rest forwarding', () => {
		it('forwards data-testid and id to the tbody, thead, and tfoot', async () => {
			const screen = await render(TableSectionsFixture, {
				props: {
					head: { 'data-testid': 'thead', id: 'head-1' },
					body: { 'data-testid': 'tbody', id: 'body-1' },
					foot: { 'data-testid': 'tfoot', id: 'foot-1' }
				}
			});
			const thead = screen.container.querySelector('thead')!;
			const tbody = screen.container.querySelector('tbody')!;
			const tfoot = screen.container.querySelector('tfoot')!;
			expect(thead).toHaveAttribute('data-testid', 'thead');
			expect(thead).toHaveAttribute('id', 'head-1');
			expect(tbody).toHaveAttribute('data-testid', 'tbody');
			expect(tbody).toHaveAttribute('id', 'body-1');
			expect(tfoot).toHaveAttribute('data-testid', 'tfoot');
			expect(tfoot).toHaveAttribute('id', 'foot-1');
		});
	});
});

describe('ARIA row indexing (#3939)', () => {
	const bodyRows = (container: HTMLElement): HTMLTableRowElement[] =>
		Array.from(container.querySelectorAll('tbody tr'));

	it('emits no aria-rowindex/aria-rowcount by default', async () => {
		const screen = await renderTable<User>({ data: users, columns });
		expect(screen.container.querySelector('table')).not.toHaveAttribute('aria-rowcount');
		for (const row of bodyRows(screen.container)) {
			expect(row).not.toHaveAttribute('aria-rowindex');
		}
	});

	it('numbers rows from 1 when rowCount is provided', async () => {
		const screen = await renderTable<User>({ data: users, columns, rowCount: users.length });
		expect(screen.container.querySelector('table')).toHaveAttribute(
			'aria-rowcount',
			String(users.length)
		);
		const indices = bodyRows(screen.container).map((r) => r.getAttribute('aria-rowindex'));
		expect(indices).toEqual(['1', '2', '3']);
	});

	it('offsets aria-rowindex by rowIndexStart for a paginated view', async () => {
		// Page 3 of a 10-per-page dataset: first visible row is dataset row 21.
		const screen = await renderTable<User>({
			data: users,
			columns,
			rowIndexStart: 21,
			rowCount: 100
		});
		expect(screen.container.querySelector('table')).toHaveAttribute('aria-rowcount', '100');
		const indices = bodyRows(screen.container).map((r) => r.getAttribute('aria-rowindex'));
		expect(indices).toEqual(['21', '22', '23']);
	});

	it('sets aria-rowcount to -1 (unknown) when only rowIndexStart is given', async () => {
		// Windowed/cursor pagination: offset known, total unknown.
		const screen = await renderTable<User>({ data: users, columns, rowIndexStart: 5 });
		expect(screen.container.querySelector('table')).toHaveAttribute('aria-rowcount', '-1');
		const indices = bodyRows(screen.container).map((r) => r.getAttribute('aria-rowindex'));
		expect(indices).toEqual(['5', '6', '7']);
	});

	it('does not assign an ARIA row index to the header row', async () => {
		const screen = await renderTable<User>({ data: users, columns, rowCount: users.length });
		const header = screen.container.querySelectorAll('tr')[0];
		expect(header).not.toHaveAttribute('aria-rowindex');
	});

	it('lets a plugin override the seeded aria-rowindex', async () => {
		const plugin: TablePlugin<User> = {
			transformBodyRow(props, _item, index) {
				return {
					...props,
					htmlProps: { ...props.htmlProps, 'aria-rowindex': 100 + (index ?? 0) }
				};
			}
		};
		const screen = await renderTable<User>({
			data: users,
			columns,
			rowCount: users.length,
			plugins: { custom: plugin }
		});
		const indices = bodyRows(screen.container).map((r) => r.getAttribute('aria-rowindex'));
		expect(indices).toEqual(['100', '101', '102']);
	});
});
