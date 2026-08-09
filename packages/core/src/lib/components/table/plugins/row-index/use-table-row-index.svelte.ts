import type { Snippet } from 'svelte';
import { withProps } from '../../../../internal/with-props.js';
import type { TableColumn, TablePlugin } from '../../table-types.js';
import RowIndexScope from './row-index-scope.svelte';
import { rowIndexCell } from './row-index-slots.svelte';
import type { RowIndexContextValue } from './row-index-context.svelte.js';

/**
 * Ported from Astryx's `Table/plugins/rowIndex/useTableRowIndex.tsx`.
 *
 * The one structural change is the context. Upstream's `renderCell` closes over
 * the `lookup` function and `startFrom`; a Svelte snippet is authored in a
 * `.svelte` file and cannot close over a `.ts` hook's locals, so the plugin
 * publishes both through a private context — the mechanism `selection` already
 * uses upstream. Nothing about the rendered column or the public API changes.
 *
 * The `useMemo` around the lookup becomes `$derived.by`, which is the same memo
 * with the dependency array inferred; the `useMemo` around the plugin object
 * has no counterpart, because the object closes over getters and is therefore
 * already stable. The lookup `Map` is a plain one — built inside the derived
 * and never mutated after — so `svelte/prefer-svelte-reactivity` is disabled
 * at its construction site.
 */

/**
 * Configuration for {@link useTableRowIndex}.
 *
 * Astryx's `renderCell` receives only the row item (not its position), so the
 * plugin needs the rendered `data` array — the same array passed to
 * `<Table data>` — to derive each row's 1-based ordinal. Pass `getRowKey` when
 * items don't have a stable identity by reference (e.g. new objects each
 * render); it must return a **unique** string per row (duplicate keys collapse
 * to a single ordinal).
 */
export interface UseTableRowIndexConfig<T extends Record<string, unknown>> {
	/** The data array currently rendered by the table (post sort/filter/page). */
	data: T[];
	/**
	 * Optional key extractor returning a **unique** string per row. When
	 * provided, index lookup is keyed by the returned string (stable across new
	 * object identities); otherwise items are matched by reference identity.
	 *
	 * Upstream asks for this to be wrapped in `useCallback` for a stable plugin
	 * identity; here the config arrives as a getter, so an inline arrow costs
	 * nothing.
	 */
	getRowKey?: (item: T) => string;
	/** Header label for the index column. @default '#' */
	label?: string | Snippet;
	/** First index value. @default 1 */
	startFrom?: number;
}

const INDEX_COLUMN_WIDTH = { type: 'pixel' as const, value: 48 };

/** Index column key — prefixed to avoid collisions with user columns. */
const INDEX_COLUMN_KEY = '__rowIndex';

/**
 * Returns a {@link TablePlugin} that prepends a right-aligned, monospaced
 * row-number column. Numbering follows the order of the rendered `data` array,
 * so it reflects the current sort / filter / pagination view.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const rowIndex = useTableRowIndex(() => ({ data }));
 * </script>
 * <Table {data} {columns} idKey="id" plugins={{ rowIndex }} />
 * ```
 */
export function useTableRowIndex<T extends Record<string, unknown>>(
	config: () => UseTableRowIndexConfig<T>
): TablePlugin<T> {
	// Single item → ordinal lookup, built in one pass and rebuilt only when the
	// data array or key extractor changes. Keyed by getRowKey when provided
	// (stable across new object identities), otherwise by object reference.
	const lookup = $derived.by(() => {
		const { data, getRowKey } = config();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<unknown, number>();
		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			map.set(getRowKey ? getRowKey(item) : item, i);
		}
		return (item: T): number | undefined => map.get(getRowKey ? getRowKey(item) : item);
	});

	const provider = withProps(RowIndexScope, {
		value: (): RowIndexContextValue => ({
			lookup: lookup as (item: Record<string, unknown>) => number | undefined,
			startFrom: config().startFrom ?? 1
		})
	});

	return {
		transformTableContext() {
			return provider;
		},

		transformColumns(columns: TableColumn<T>[]) {
			const indexColumn: TableColumn<T> = {
				key: INDEX_COLUMN_KEY,
				header: config().label ?? '#',
				width: INDEX_COLUMN_WIDTH,
				align: 'end',
				resizable: false,
				renderCell: rowIndexCell as unknown as Snippet<[T]>
			};
			return [indexColumn, ...columns];
		}
	};
}
