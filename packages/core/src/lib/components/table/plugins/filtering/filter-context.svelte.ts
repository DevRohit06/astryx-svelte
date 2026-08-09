import { Context } from '../../../../internal/context.js';
import type { TableFilterVariant, UseTableFilteringConfig } from './use-table-filtering.js';

/**
 * The filtering plugin's two private contexts.
 *
 * Upstream declares `interface FilterStore { getConfig: () => …Config }` and
 * publishes it through `FilterStoreContext`. The wrapper exists purely so the
 * value in context can stay stable while the config it returns changes every
 * render — which is what a getter already is. So the store collapses to the
 * thing it was wrapping, exactly as `selection`'s did, and the context holds
 * `() => UseTableFilteringConfig` directly.
 *
 * **Both are stored as getters**, the recurring context hazard in this port: a
 * context that holds a *value* freezes it at the moment the provider
 * initialised, and a consumer swapping `filters` or `variant` would never be
 * seen.
 *
 * Upstream's second context, `FilterVariantContext`, is kept as a second
 * context rather than folded into the config: its comment says the variant is
 * read by slot components that must not go "through the mutable store", and one
 * component may override the config context (see `filter-draft-scope.svelte`)
 * without disturbing the variant. Both are set by a single provider component
 * here rather than two nested ones — context is per component *instance*, so
 * the nesting depth upstream's JSX creates is not observable.
 *
 * Private, as upstream's are: neither is on `Table/index.ts`.
 */
export const FilterConfigContext = new Context<() => UseTableFilteringConfig>(
	'astryx.table.filtering'
);

/**
 * The display variant. Upstream's `createContext<TableFilterVariant>('popover')`
 * carries a default, so reading it outside a provider is legal and yields
 * `'popover'`; {@link useFilterVariant} reproduces that.
 */
export const FilterVariantContext = new Context<() => TableFilterVariant>(
	'astryx.table.filtering.variant'
);

/**
 * Read the live filtering config.
 *
 * Throws outside a table carrying the plugin, as upstream's `useFilterStore`
 * does — and with upstream's message verbatim, which names the hook by *its*
 * internal spelling. Unreachable in practice on either side: the only callers
 * are the control components the plugin's own transforms render.
 */
export function useFilterConfig(): () => UseTableFilteringConfig {
	const config = FilterConfigContext.getOr(null);
	if (!config) {
		throw new Error('useFilterStore must be used within a Table with filtering');
	}
	return config;
}

/** Read the display variant, defaulting to `'popover'` outside a provider. */
export function useFilterVariant(): () => TableFilterVariant {
	return FilterVariantContext.getOr(() => 'popover' as TableFilterVariant);
}
