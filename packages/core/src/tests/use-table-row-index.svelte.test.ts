import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness, { type RowIndexRow } from './fixtures/table-row-index-fixture.svelte';

/**
 * Astryx's `Table/plugins/rowIndex/useTableRowIndex.test.tsx`, ported case for
 * case — **9 upstream cases at the 0.5.0 pin, 9 here**. Nothing dropped, nothing added.
 *
 * Upstream's `Harness` becomes `fixtures/table-row-index-fixture.svelte`, since
 * a hook must run during a component's init. It is a transcription: the same
 * four props, the same single `name` column, and `getRowKey` selected by the
 * same `useKey` flag.
 *
 * Standing translations:
 *
 * - `render` is async and takes `{ props }`; `rerender(<Harness … />)` is
 *   `screen.rerender({ … })`, which takes the whole props object.
 * - `screen.getAllByRole(r)` is `screen.getByRole(r).elements()`;
 *   `within(el).getByText(t)` is the chained locator
 *   `screen.getByRole(r).nth(i).getByText(t)`; `queryByText(t)` is
 *   `screen.getByText(t, { exact: true }).query()`.
 * - **`getByText` always carries `{ exact: true }`.** A Vitest browser locator
 *   matches a case-insensitive *substring*, so a bare `getByText('1')` would also
 *   match `Item 1`-style content and trip strict mode; `exact` restores RTL's
 *   whole-normalized-string semantics rather than changing what is asserted.
 */

// =============================================================================
// Test Data
// =============================================================================

const data: RowIndexRow[] = [
	{ id: 'a', name: 'Alice' },
	{ id: 'b', name: 'Bob' },
	{ id: 'c', name: 'Carol' }
];

const exact = { exact: true } as const;

// =============================================================================
// Tests
// =============================================================================

describe('useTableRowIndex', () => {
	it('prepends a header cell with the default label', async () => {
		const screen = await render(Harness, { props: { rows: data } });
		// First column is the index column.
		await expect
			.element(screen.getByRole('columnheader').nth(0).getByText('#', exact))
			.toBeInTheDocument();
	});

	it('numbers rows 1..n by default', async () => {
		const screen = await render(Harness, { props: { rows: data } });
		await expect.element(screen.getByText('1', exact)).toBeInTheDocument();
		await expect.element(screen.getByText('2', exact)).toBeInTheDocument();
		await expect.element(screen.getByText('3', exact)).toBeInTheDocument();
	});

	it('respects startFrom', async () => {
		const screen = await render(Harness, { props: { rows: data, startFrom: 0 } });
		await expect.element(screen.getByText('0', exact)).toBeInTheDocument();
		await expect.element(screen.getByText('2', exact)).toBeInTheDocument();
		expect(screen.getByText('3', exact).query()).toBeNull();
	});

	it('supports a custom label', async () => {
		const screen = await render(Harness, { props: { rows: data, label: 'Row' } });
		await expect
			.element(screen.getByRole('columnheader').nth(0).getByText('Row', exact))
			.toBeInTheDocument();
	});

	it('numbers a single row', async () => {
		const screen = await render(Harness, { props: { rows: [{ id: 'a', name: 'Alice' }] } });
		const row = screen.getByRole('row').nth(1);
		await expect.element(row.getByText('1', exact)).toBeInTheDocument();
		await expect.element(row.getByText('Alice', exact)).toBeInTheDocument();
	});

	it('renders the index header with empty data and no row numbers', async () => {
		const screen = await render(Harness, { props: { rows: [] } });
		await expect
			.element(screen.getByRole('columnheader').nth(0).getByText('#', exact))
			.toBeInTheDocument();
		// No body rows → no ordinals.
		expect(screen.getByText('1', exact).query()).toBeNull();
	});

	it('renumbers when the data order changes (reference path)', async () => {
		const screen = await render(Harness, { props: { rows: data } });
		// nth(0) is the header row.
		await expect
			.element(screen.getByRole('row').nth(1).getByText('Alice', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(1).getByText('1', exact)).toBeInTheDocument();

		// Reorder: Carol, Alice, Bob (same object identities, new order).
		await screen.rerender({ rows: [data[2], data[0], data[1]] });
		await expect
			.element(screen.getByRole('row').nth(1).getByText('Carol', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(1).getByText('1', exact)).toBeInTheDocument();
		await expect
			.element(screen.getByRole('row').nth(2).getByText('Alice', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(2).getByText('2', exact)).toBeInTheDocument();
	});

	it('renumbers when the data order changes (keyed path)', async () => {
		// With getRowKey provided, the keyed lookup must still produce ordinals in
		// the new order. If the keyed branch were broken it would return undefined
		// and render no numbers — so this fails for the right reason.
		const screen = await render(Harness, { props: { rows: data, useKey: true } });
		await expect
			.element(screen.getByRole('row').nth(1).getByText('Alice', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(1).getByText('1', exact)).toBeInTheDocument();

		await screen.rerender({ rows: [data[1], data[2], data[0]], useKey: true });
		await expect
			.element(screen.getByRole('row').nth(1).getByText('Bob', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(1).getByText('1', exact)).toBeInTheDocument();
		await expect
			.element(screen.getByRole('row').nth(3).getByText('Alice', exact))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(3).getByText('3', exact)).toBeInTheDocument();
	});

	it('keyed path resolves ordinals across fresh object identities', async () => {
		// Simulates a re-fetch: brand-new objects with the same ids. Keyed lookup
		// must map them correctly.
		const fresh: RowIndexRow[] = [
			{ id: 'a', name: 'Alice' },
			{ id: 'b', name: 'Bob' }
		];
		const screen = await render(Harness, { props: { rows: fresh, useKey: true } });
		await expect.element(screen.getByRole('row').nth(1).getByText('1', exact)).toBeInTheDocument();
		await expect.element(screen.getByRole('row').nth(2).getByText('2', exact)).toBeInTheDocument();
	});
});
