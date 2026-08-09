import { Context } from '../../../../internal/context.js';
import type { UseTableTreeDataConfig } from './use-table-tree-data.js';

/**
 * The tree plugin's private context.
 *
 * Upstream builds a `TreeStore` — a hand-rolled external store with a listener
 * set, published through `TreeStoreContext` and read by each tree cell through
 * `useSyncExternalStore`, whose snapshot is an *integer* encoding of
 * `{level, indent, hasChildren, isExpanded}` because an object snapshot would
 * tear. All of that exists to give React fine-grained subscriptions: without
 * it, expanding one row re-renders the whole body.
 *
 * Svelte's reactivity is already fine-grained, so the store collapses to the
 * thing it was wrapping — a getter for the live config. A cell that reads
 * `config().getRowMeta(item)` in its own template re-runs only its own effect
 * when the expanded set changes. `subscribe` / `notify` / `getConfig`, the
 * `useEffect` that fires `notify()` on every render, and the whole
 * `encodeRowMeta` / `INDENT_INDEX` / `useRowMetaSnapshot` encoding have no
 * counterpart and are not ported: they are React scheduling, not behaviour.
 *
 * Stored as a **getter**, not a value, so the config the consumer passes stays
 * live — the recurring context hazard in this port.
 *
 * Private, as upstream's is: `TreeStoreContext` is not on `Table/index.ts`.
 */
export const TreeConfigContext = new Context<() => UseTableTreeDataConfig<Record<string, unknown>>>(
	'astryx.table.tree'
);

/**
 * Read the tree config. Returns `null` outside a table that has the tree
 * plugin, which is upstream's `use(TreeStoreContext)` returning `null` and
 * `TreeCellContent` rendering its children unwrapped.
 */
export function useTreeConfig(): (() => UseTableTreeDataConfig<Record<string, unknown>>) | null {
	return TreeConfigContext.getOr(null);
}
