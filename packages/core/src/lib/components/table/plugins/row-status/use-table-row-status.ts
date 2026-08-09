import { bindCellSnippet } from '../../../../internal/bind-snippet.js';
import type { IconName } from '../../../icon/icon-registry.js';
import { pixel } from '../../column-utils.js';
import type { TableColumn, TablePlugin } from '../../table-types.js';
import { rowStatusCell, type RowStatusCellArg } from './row-status-slots.svelte';
import type { TableRowStatusColor } from './row-status.stylex.js';

export type { TableRowStatusColor } from './row-status.stylex.js';

/**
 * Ported from Astryx's `Table/plugins/rowStatus/useTableRowStatus.tsx`.
 *
 * The smallest of the table plugins: one synthetic column, one transform, no
 * context and no state. Three translations, all of them the settled ones:
 *
 * - **`config` is a getter**, as every published hook in this port takes.
 *   Upstream's `useMemo(..., [getStatus])` exists to keep the plugin object
 *   stable while `getStatus` stays current; a getter is current by construction
 *   and the object below is built once, so the memo has nothing left to do.
 * - **`renderCell` is a bound cell snippet.** A `.ts` hook cannot author a
 *   snippet, and this one needs closure data (`getStatus`), so it goes through
 *   `bindCellSnippet` — the `tree` plugin's shape, minus the keying, because
 *   there is exactly one column here and therefore one binding. The identity is
 *   still stable for the same reason it matters there: `{@render}` branches on
 *   the bound snippet's function identity.
 * - **The status is resolved hook-side and travels in the argument.** Upstream's
 *   `renderCell` calls `getStatus(item)` inside the closure; here that call is
 *   the binder's getter, which keeps the slot module free of the config's row
 *   generic and keeps `getStatus` off the snippet's argument surface.
 *
 * The styles, `SEMANTIC_COLORS` and `resolveColor` live in `row-status.stylex.ts`
 * — StyleX may only be imported from a `.ts`/`.stylex.ts` module, and the dot's
 * colour is a `stylex.create` function style.
 */

/**
 * A row's status indicator. `color` accepts a semantic status color
 * (mapped to a theme token) or any raw CSS color string as an escape hatch.
 * By default the plugin renders a colored status dot. Provide `icon` to signal
 * status by shape as well as color, which is more accessible when several
 * statuses coexist. `label` is required so the status is never conveyed by
 * color alone — it names the indicator for assistive technology and shows on
 * hover. Return `null` for rows with no status.
 */
export interface TableRowStatus {
	/** Semantic status color (preferred) or a raw CSS color string. */
	color: TableRowStatusColor | (string & {});
	/** Optional icon rendered as the signifier instead of the dot (shape as an a11y differentiator). */
	icon?: IconName;
	/**
	 * Accessible name for the status, announced to assistive technology and
	 * shown in a tooltip on hover. Required: a status must never be conveyed by
	 * color alone.
	 */
	label: string;
}

/** Configuration for {@link useTableRowStatus}. */
export interface UseTableRowStatusConfig<T extends Record<string, unknown>> {
	/**
	 * Derive the status indicator for a row. Return `null` for no indicator.
	 *
	 * @example
	 * ```ts
	 * getStatus: (row) =>
	 *   row.hasError ? { color: 'error', icon: 'error', label: 'Error' } : null
	 * ```
	 */
	getStatus: (item: T) => TableRowStatus | null;
}

// The status column holds a small centered dot (or an icon when provided).
// A fixed narrow width keeps every row's indicator aligned in one gutter.
const STATUS_COLUMN_WIDTH = pixel(28);

/**
 * Returns a {@link TablePlugin} that prepends a narrow column signaling per-row
 * status: a colored status dot by default, or an icon when `icon` is provided
 * (shape + color is more accessible than color alone).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const rowStatus = useTableRowStatus<Row>(() => ({
 *     getStatus: (row) =>
 *       row.state === 'error' ? { color: 'error', icon: 'error', label: 'Error' } : null
 *   }));
 * </script>
 * <Table data={data} {columns} idKey="id" plugins={{ rowStatus }} />
 * ```
 */
export function useTableRowStatus<T extends Record<string, unknown>>(
	config: () => UseTableRowStatusConfig<T>
): TablePlugin<T> {
	// Bound once, outside the transform: `{@render}` branches on the bound
	// snippet's function identity, so re-binding on every `transformColumns` pass
	// would rebuild every status cell.
	const statusCell = bindCellSnippet<T, RowStatusCellArg>(rowStatusCell, (item) => ({
		status: config().getStatus(item)
	}));

	const statusColumn: TableColumn<T> = {
		key: '__rowStatus',
		header: '',
		width: STATUS_COLUMN_WIDTH,
		resizable: false,
		renderCell: statusCell
	};

	return {
		transformColumns(columns: TableColumn<T>[]): TableColumn<T>[] {
			return [statusColumn, ...columns];
		}
	};
}
