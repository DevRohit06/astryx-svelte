import { Context } from 'runed';

/** What the index cell needs in order to render one row's ordinal. */
export interface RowIndexContextValue {
	/** Zero-based position of this item in the rendered data, or `undefined`. */
	lookup: (item: Record<string, unknown>) => number | undefined;
	/** First index value. */
	startFrom: number;
}

/**
 * The row-index plugin's private context.
 *
 * Unlike `selection`, upstream has **no context here** — its `renderCell` is a
 * closure over `lookup` and `startFrom`. A Svelte `Snippet` cannot close over
 * hook state (it is authored in a `.svelte` file, not in the `.ts` hook), so
 * the plugin publishes the two values the same way `selection` publishes its
 * store, and the cell reads them. The mechanism is upstream's own, applied to a
 * plugin that did not need it in React; the rendered output and the public API
 * are unchanged.
 *
 * Stored as a getter so a changing `data`/`startFrom` stays live.
 */
export const RowIndexContext = new Context<() => RowIndexContextValue>('astryx.table.rowIndex');

/** Read the row-index config. `null` outside a table carrying the plugin. */
export function useRowIndexContext(): (() => RowIndexContextValue) | null {
	return RowIndexContext.getOr(null);
}
