/**
 * Ported from Astryx's `PowerSearch/utils.ts`, verbatim.
 *
 * Upstream publishes this module at its own subpath,
 * `@astryxdesign/core/PowerSearch/utils`, and it is the *only* route to
 * `formatFilterValue` — the `PowerSearch/index.ts` barrel does not carry it, so
 * it is not reachable from the package *root* on either side.
 *
 * **`formatFilterValue` is therefore reachable from nothing here.** This package
 * ships 8 subpath keys against upstream's 123, and the missing
 * per-component subpaths are a standing debt (port/todo.md) rather than a decision
 * taken for this module; `./PowerSearch/utils` is one more of them. So the file
 * exists to keep the grouping and its one asymmetry visible, and the export gap
 * is recorded in Known debts — it is not that the subpath was considered and
 * declined.
 */

export { formatFilterValue } from './format-filter-value.js';
export type { InternalConfig } from './use-internal-config.svelte.js';
export type { OperatorValue, FilterValue } from './types.js';
