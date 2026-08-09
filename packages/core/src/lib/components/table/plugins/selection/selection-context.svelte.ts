import { Context } from 'runed';
import type { UseTableSelectionConfig } from './use-table-selection.js';

/**
 * The selection plugin's private context.
 *
 * Upstream builds a `SelectionStore` — a hand-rolled external store with a
 * listener set, published through `SelectionStoreContext` and read by each row
 * checkbox through `useSyncExternalStore`. The whole apparatus exists to give
 * React *fine-grained* subscriptions: without it, a selection change re-renders
 * every row.
 *
 * Svelte's reactivity is already fine-grained, so the store collapses to the
 * thing it was wrapping — a getter for the live config. A checkbox that reads
 * `config().getIsItemSelected(item)` in its own template re-runs only its own
 * effect when the consumer's selection state changes. `subscribe`/`notify`/
 * `getConfig` and the `useEffect` that fires `notify()` on every render have no
 * counterpart and are not ported; they are React scheduling, not behaviour.
 *
 * Stored as a **getter**, not a value, so the config the consumer passes stays
 * live — the recurring context hazard in this port.
 *
 * Private, as upstream's is: `SelectionStoreContext` is not on `Table/index.ts`.
 */
export const SelectionConfigContext = new Context<
	() => UseTableSelectionConfig<Record<string, unknown>>
>('astryx.table.selection');

/**
 * Read the selection config. Returns `null` outside a table that has the
 * selection plugin, which is upstream's `use(SelectionStoreContext)` returning
 * `null` and every consumer rendering nothing.
 */
export function useSelectionConfig():
	(() => UseTableSelectionConfig<Record<string, unknown>>) | null {
	return SelectionConfigContext.getOr(null);
}
