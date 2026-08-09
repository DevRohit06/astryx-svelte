<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TableFilterVariant, UseTableFilteringConfig } from './use-table-filtering.js';

	export interface FilteringScopeProps {
		/** Getter for the live filtering config, supplied by the hook. */
		config: () => UseTableFilteringConfig;
		/** Getter for the resolved display variant, supplied by the hook. */
		variant: () => TableFilterVariant;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { FilterConfigContext, FilterVariantContext } from './filter-context.svelte.js';

	/**
	 * Internal — the provider `useTableFiltering.transformTableContext()` returns.
	 *
	 * Upstream's transform closes over its store and its variant and returns
	 * `<FilterStoreContext value={store}><FilterVariantContext value={variant}>
	 * {children}</…></…>`. Svelte sets context at component init, so the port
	 * needs a component boundary; the hook binds both getters onto this one with
	 * `withProps`, because `TableContextProvider` declares only `children` and a
	 * `.ts` hook has no other way to hand it state.
	 *
	 * One component sets both contexts where upstream nests two providers. Context
	 * is keyed per component *instance*, so the extra boundary is not observable —
	 * and the two stay separate keys, which is what lets the popover override the
	 * config alone (`filter-draft-scope.svelte`).
	 *
	 * Renders no DOM of its own.
	 */
	let { config, variant, children }: FilteringScopeProps = $props();

	// Wrapped rather than passed straight through: `config`/`variant` are props,
	// and handing the context a prop's *initial* value would freeze it. The arrows
	// re-read on every call, so a consumer changing `filters` or `variant` stays
	// live. Upstream re-memoises the whole plugin when `variant` changes; reading
	// it through a getter is the same observable behaviour with nothing to
	// invalidate — and it is why this port's plugin object can be built once.
	FilterConfigContext.set(() => config());
	FilterVariantContext.set(() => variant());
</script>

{@render children()}
