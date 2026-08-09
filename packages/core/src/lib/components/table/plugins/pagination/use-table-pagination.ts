import { withProps } from '../../../../internal/with-props.js';
import type { TablePlugin } from '../../table-types.js';
import PaginationScope from './pagination-scope.svelte';

/**
 * Ported from Astryx's
 * `Table/plugins/pagination/useTablePagination.tsx`.
 *
 * All of the prop-building and the single-page suppression live in
 * `pagination-scope.svelte` rather than here, because upstream computes them in
 * the hook body and then reads them back through a ref *inside* the transform —
 * the ref exists precisely so the values are read at render time. A `$derived`
 * inside the rendering component is that, so the port puts the computation
 * where it is consumed and the hook is left holding only the plugin object.
 *
 * Note this is the one plugin whose `transformTableContext` sets no context: it
 * wraps the table with sibling chrome. `TableContextProvider` covers both.
 */

// =============================================================================
// Config Type
// =============================================================================

/**
 * Configuration for {@link useTablePagination}.
 *
 * The consumer owns all state. This hook renders pagination controls
 * around the table via `transformTableContext`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let page = $state(1);
 *   const pagination = useTablePagination(() => ({
 *     page, onPageChange: (p) => (page = p), totalItems: data.length, pageSize: 10
 *   }));
 * </script>
 * <Table data={paginateData(data, page, 10)} {columns} plugins={{ pagination }} />
 * ```
 */
export interface UseTablePaginationConfig {
	// --- Core (required) ---

	/** Current page number (1-based). */
	page: number;

	/** Called when the page changes. Consumer updates their own state. */
	onPageChange: (page: number) => void;

	// --- Data shape (provide one) ---

	/**
	 * Total number of items across all pages.
	 * Used to calculate total page count and "X–Y of Z" display.
	 * Takes precedence over `totalPages` if both are provided.
	 */
	totalItems?: number;

	/**
	 * Total number of pages. Use when you know the page count but not item count.
	 */
	totalPages?: number;

	/**
	 * Whether more pages exist after the current one.
	 * Use for cursor-based pagination where the total is unknown.
	 * Mutually exclusive with totalItems/totalPages.
	 */
	hasMore?: boolean;

	// --- Page size ---

	/**
	 * Number of items per page.
	 * @default 10
	 */
	pageSize?: number;

	/**
	 * Called when the user changes the page size via the page size selector.
	 * When provided alongside `pageSizeOptions`, a page size dropdown is shown.
	 */
	onPageSizeChange?: (pageSize: number) => void;

	/**
	 * Available page size options. Shows a page size selector when provided.
	 * @example
	 * ```ts
	 * [10, 25, 50, 100]
	 * ```
	 */
	pageSizeOptions?: number[];

	// --- Display ---

	/**
	 * Visual variant for the pagination controls.
	 * Passed through to Pagination.
	 * @default 'pages'
	 */
	variant?: 'pages' | 'count' | 'compact' | 'dots' | 'none';

	/**
	 * Size of the pagination controls.
	 * @default 'md'
	 */
	size?: 'sm' | 'md';

	/**
	 * Where to render the pagination controls relative to the table.
	 * - 'below' — renders pagination after the table (default)
	 * - 'above' — renders pagination before the table
	 * - 'both' — renders pagination above and below the table
	 * - 'none' — does not auto-render; use Pagination manually
	 *
	 * @default 'below'
	 */
	position?: 'below' | 'above' | 'both' | 'none';

	/**
	 * Horizontal alignment of the pagination controls within their container.
	 * - 'start' — left-aligned
	 * - 'center' — centered (default)
	 * - 'end' — right-aligned
	 *
	 * @default 'center'
	 */
	align?: 'start' | 'center' | 'end';

	// --- Accessibility ---

	/**
	 * Accessible label for the pagination nav landmark.
	 * @default 'Table pagination'
	 */
	label?: string;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Pagination table plugin — renders `Pagination` controls around the table.
 */
export function useTablePagination<T extends Record<string, unknown>>(
	config: () => UseTablePaginationConfig
): TablePlugin<T> {
	// Bound once — a changing provider reference remounts the whole table.
	const provider = withProps(PaginationScope, { config });

	return {
		transformTableContext() {
			return provider;
		}
	};
}
