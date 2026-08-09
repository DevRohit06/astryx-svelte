/**
 * Ported verbatim from Astryx's
 * `Table/plugins/pagination/paginateData.ts` — pure, with no React in it.
 */

/**
 * Slice a data array for the current page.
 *
 * Pure utility for client-side pagination. For server-side pagination
 * where data is already sliced, pass it directly to `Table`.
 *
 * @param data - Full data array
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page; coerced to a positive integer,
 *   non-finite values fall back to 10
 * @returns Slice of data for the current page
 *
 * @example
 * ```svelte
 * <Table data={paginateData(data, page, pageSize)} … />
 * ```
 */
export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
	// Same coercion as Pagination and useTablePagination: a 0/NaN/negative
	// pageSize would slice every page empty while the pagination chrome still
	// renders page buttons.
	const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10;
	// page needs the same coercion: a negative start index makes Array.slice
	// count from the END of the data (page -1 returns the tail dressed up as a
	// page), and a fractional page returns a slice straddling two pages.
	const p = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
	const start = (p - 1) * size;
	return data.slice(start, start + size);
}
